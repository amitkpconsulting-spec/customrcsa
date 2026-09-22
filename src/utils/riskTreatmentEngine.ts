import {
  AssessedControl,
  RiskTreatmentPlan,
  RiskTreatmentItem,
  PriorityCriteriaConfig,
  RiskTreatmentMilestone,
  KRIThresholdItem,
  AnnualRiskTracking,
  RiskTreatmentOption,
  RCSAPayload,
} from '../types';
import { getControlRiskLevel, calculateControlRisk } from './riskCalculations';

export const DEFAULT_PRIORITY_CRITERIA: PriorityCriteriaConfig = {
  minResidualRiskScore: 10.0, // Major Risk Score between Medium-High to High (>=10.0)
  includeNeedsAttention: true,
  includeCriticalDeficiencies: true,
  maxCEFThreshold: 0.70,
  targetProcessAppFilter: 'ALL',
  prioritizeManualControls: true,
};

// Process / Application mappings for realistic enterprise context
const PROCESS_MAPPINGS: Record<string, string> = {
  'AC': 'Identity Governance & Access Management (Okta / AD)',
  'IA': 'Privileged Authentication & MFA Enclave',
  'SC': 'API Gateway & Perimeter Microsegmentation',
  'SI': 'Endpoint Protection (EDR) & Vulnerability Management',
  'AU': 'SIEM Centralized Audit & Telemetry Pipeline',
  'CP': 'Business Continuity & Disaster Recovery Infrastructure',
  'RA': 'Continuous Threat Assessment & Risk Intelligence',
  'SR': 'Third-Party Vendor & Supply Chain Ingestion Pipeline',
  'PT': 'PII Privacy Transparency & Data Discovery Engine',
  'CM': 'GitOps CI/CD Configuration & Infrastructure-as-Code',
  'IR': 'SecOps Incident Response & SOAR Playbooks',
  'AT': 'Workforce Security Awareness & Phishing Simulation',
  'CA': 'Continuous Compliance & Assurance Scanner',
  'MA': 'Infrastructure Maintenance & Hardware Management',
  'MP': 'Data Loss Prevention (DLP) & Media Protection',
  'PE': 'Data Center Physical & Environmental Controls',
  'PL': 'Enterprise Information Security Policy Architecture',
  'PM': 'Risk & Compliance Program Governance',
  'PS': 'Personnel Security & Background Verification',
  'SA': 'Software Development Lifecycle (SDLC) & AppSec Gates',
};

// Automation recommendations mapped to control families
const AUTOMATION_MAPPING: Record<string, { mechanism: string; checklistReplaced: string }> = {
  'AC': {
    mechanism: 'SCIM 2.0 automated provisioning & Azure AD / Okta automated deprovisioning webhook with 1-hr SLA',
    checklistReplaced: 'Manual monthly Excel spreadsheet user access reviews & IT ticket termination checklists',
  },
  'IA': {
    mechanism: 'FIDO2 / WebAuthn hardware security keys enforced via Conditional Access policy engine (zero bypass)',
    checklistReplaced: 'Manual SMS OTP verification and discretionary password expiration notices',
  },
  'SC': {
    mechanism: 'Envoy / Istio service mesh mTLS with automated certificate rotation & Kubernetes NetworkPolicy ingress gates',
    checklistReplaced: 'Manual firewall change request tickets & static IP whitelist spreadsheets',
  },
  'SI': {
    mechanism: 'CrowdStrike Falcon automated host isolation on detection & automated OS patching via Ansible Tower',
    checklistReplaced: 'Manual bi-weekly server patching checklists & spreadsheet vulnerability tracking',
  },
  'AU': {
    mechanism: 'Amazon Kinesis / Kafka streaming audit logs to Splunk Cloud with WORM S3 Object Lock retention',
    checklistReplaced: 'Manual weekly server syslog inspection & ad-hoc log archival verification',
  },
  'SR': {
    mechanism: 'Syft / CycloneDX automated SBOM generation in GitHub Actions with Prisma Cloud vulnerability blocking',
    checklistReplaced: 'Annual vendor questionnaire PDFs & email-based third-party compliance attestations',
  },
  'PT': {
    mechanism: 'OneTrust API automated consent telemetry with DynamoDB row-level cryptographic tokenization',
    checklistReplaced: 'Manual privacy impact assessment Word documents & periodic database query audits',
  },
  'CM': {
    mechanism: 'Terraform drift detection runner with GitHub Actions OPA Conftest policy enforcement',
    checklistReplaced: 'Manual server configuration checklists & quarterly change advisory board review logs',
  },
};

// Contingency plans mapped to control families
const CONTINGENCY_MAPPING: Record<string, string> = {
  'AC': 'Activate emergency account lockdown protocol; trigger manual HR audit; freeze all active service account tokens and revoke OAuth sessions across IdP.',
  'IA': 'Enforce mandatory credential reset across all elevated roles; mandate step-up physical hardware token registration; restrict administrative access to bastion IP ranges.',
  'SC': 'Trigger WAF emergency rate-limiting rules; isolate affected network subnet via security group egress deny-all; engage cloud provider DDoS mitigation.',
  'SI': 'Trigger EDR automated host isolation; rollback unpatched containers to last certified immutable image; engage external incident response retainers.',
  'AU': 'Failover audit telemetry ingestion to secondary warm S3 archive bucket; trigger high-priority alerts to SecOps on-call via PagerDuty.',
  'SR': 'Invoke contractual SLA emergency audit clause; restrict vendor API keys to read-only sandbox; claim cyber insurance third-party breach rider.',
  'PT': 'Execute GDPR/CCPA regulatory disclosure notification workflow within 72h SLA; isolate affected database replicas; execute automated data purge scripts.',
  'CM': 'Rollback infrastructure drift via immutable GitOps commit revert; lock deployment pipeline; trigger automated Terraform state reconciliation.',
};

// WHO TDR Tool 1.13 Risk Category mapping
function getWHOCategoryForControl(family: string, domain: string): {
  category: 'PARTICIPANT_RIGHTS_SAFETY' | 'DATA_INTEGRITY_PROTECTION' | 'PROJECT_COMPLETION_OPERATIONAL' | 'SECURITY_ACCESS_CONTROL' | 'SYSTEM_REPUTATIONAL';
  area: string;
} {
  if (domain === 'Privacy' || family === 'PT' || family === 'PS') {
    return {
      category: 'PARTICIPANT_RIGHTS_SAFETY',
      area: 'Participant Rights, Informed Consent & Privacy Protection',
    };
  }
  if (family === 'AC' || family === 'IA') {
    return {
      category: 'SECURITY_ACCESS_CONTROL',
      area: 'Access Control, Identity Verification & Authentication Enclave',
    };
  }
  if (family === 'AU' || family === 'SI' || family === 'SC' || domain === 'Data Security') {
    return {
      category: 'DATA_INTEGRITY_PROTECTION',
      area: 'Data Integrity, Electronic Records (eCRF) & System Protection',
    };
  }
  if (family === 'SR' || family === 'SA' || family === 'PM' || family === 'CP') {
    return {
      category: 'PROJECT_COMPLETION_OPERATIONAL',
      area: 'Successful Project Completion, Operational Logistics & Third Parties',
    };
  }
  return {
    category: 'SYSTEM_REPUTATIONAL',
    area: 'Organizational Governance, Staff Training & Reputation Management',
  };
}

/**
 * Evaluates whether a control matches the organization's priority criteria for Risk Treatment
 */
export function doesControlMatchPriorityCriteria(
  control: AssessedControl,
  criteria: PriorityCriteriaConfig
): { matched: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Criterion 1: Residual Risk Score threshold (e.g. Medium-High to High >= 10.0)
  if (control.residualRisk >= criteria.minResidualRiskScore) {
    reasons.push(
      `Major Risk Score ${control.residualRisk.toFixed(1)} exceeds priority threshold (>=${criteria.minResidualRiskScore.toFixed(1)})`
    );
  }

  // Criterion 2: Deficient Controls / Penalties
  if (criteria.includeCriticalDeficiencies && control.status === 'CRITICAL_DEFICIENCY') {
    reasons.push('Critical Deficiency flagged during audit examination');
  }

  if (criteria.includeNeedsAttention && control.status === 'NEEDS_ATTENTION') {
    reasons.push('Audit status requires attention');
  }

  if (control.deficiencyPenalty > 0) {
    reasons.push(`Audit deficiency penalty (-${(control.deficiencyPenalty * 100).toFixed(0)}%) open`);
  }

  // Criterion 3: Sub-optimal Control Effectiveness Factor
  if (control.calculatedCEF < criteria.maxCEFThreshold) {
    reasons.push(
      `Control Effectiveness Factor (${(control.calculatedCEF * 100).toFixed(0)}%) below target threshold (<${(criteria.maxCEFThreshold * 100).toFixed(0)}%)`
    );
  }

  // Criterion 4: Manual Checklist vs Automated
  if (criteria.prioritizeManualControls && control.confidenceFactor < 1.0) {
    reasons.push('Manual error-prone execution (Confidence: ' + (control.confidenceFactor * 100).toFixed(0) + '%)');
  }

  const matched = reasons.length > 0;
  return { matched, reasons };
}

/**
 * Builds standard Key Risk Indicators (KRIs) for continuous monitoring post-RCSA
 */
export function generateDefaultKRIs(systemName: string): KRIThresholdItem[] {
  return [
    {
      id: 'kri-cve-vuln',
      indicatorName: 'Unpatched Critical & High Vulnerabilities (>14 Days)',
      targetControlId: 'SI-2',
      metricUnit: 'active CVEs',
      currentValue: 3,
      warningThreshold: 2,
      breachThreshold: 5,
      status: 'WARNING',
      interimReviewTriggered: false,
      lastChecked: new Date().toISOString(),
      description: 'Continuous scanner telemetry tracking open vulnerabilities exceeding organizational SLA.',
    },
    {
      id: 'kri-mfa-exemption',
      indicatorName: 'Privileged Accounts with MFA Exemption or Non-Hardware MFA',
      targetControlId: 'IA-2',
      metricUnit: '% accounts',
      currentValue: 0.0,
      warningThreshold: 0.0,
      breachThreshold: 1.0,
      status: 'NORMAL',
      interimReviewTriggered: false,
      lastChecked: new Date().toISOString(),
      description: 'Identity directory telemetry ensuring zero bypass on administrative enclaves.',
    },
    {
      id: 'kri-orphan-accounts',
      indicatorName: 'Orphaned Accounts Active >24h Post-Termination',
      targetControlId: 'AC-2',
      metricUnit: 'active accounts',
      currentValue: 1,
      warningThreshold: 1,
      breachThreshold: 2,
      status: 'WARNING',
      interimReviewTriggered: false,
      lastChecked: new Date().toISOString(),
      description: 'Daily reconciliation comparing HRIS termination roster against Okta/Active Directory.',
    },
    {
      id: 'kri-failed-auth-spike',
      indicatorName: 'Anomalous Failed Authentication Velocity',
      targetControlId: 'AC-7',
      metricUnit: 'failed auth/hr',
      currentValue: 42,
      warningThreshold: 100,
      breachThreshold: 250,
      status: 'NORMAL',
      interimReviewTriggered: false,
      lastChecked: new Date().toISOString(),
      description: 'SIEM behavioral threshold detecting credential stuffing and brute force attempts.',
    },
    {
      id: 'kri-audit-log-gap',
      indicatorName: 'Audit Telemetry Ingestion Inactivity Gap',
      targetControlId: 'AU-6',
      metricUnit: 'minutes',
      currentValue: 4,
      warningThreshold: 15,
      breachThreshold: 30,
      status: 'NORMAL',
      interimReviewTriggered: false,
      lastChecked: new Date().toISOString(),
      description: 'Continuous monitoring heartbeat ensuring uninterrupted security log pipelines.',
    },
  ];
}

/**
 * Builds default 4-Quarter Annual Milestones for Product Owners to track risk reduction
 */
export function generateDefaultMilestones(
  baselineResidualRisk: number,
  targetDesiredResidual: number
): RiskTreatmentMilestone[] {
  const totalReductionNeeded = Math.max(1, baselineResidualRisk - targetDesiredResidual);

  return [
    {
      id: 'ms-q1',
      title: 'Q1: Automated Identity Deprovisioning & Zero-Trust MFA Enclave',
      period: 'Q1 2026',
      targetRiskReductionPts: Number((totalReductionNeeded * 0.35).toFixed(1)),
      status: 'IN_PROGRESS',
      associatedControlIds: ['AC-2', 'IA-2'],
      completionPct: 65,
      owner: 'Sarah Chen (Lead Identity Architect)',
      verificationCriteria: 'Zero orphaned accounts post-termination verified via daily automated HRIS reconciliation.',
    },
    {
      id: 'ms-q2',
      title: 'Q2: Cloud Microsegmentation & Centralized Continuous SIEM Pipeline',
      period: 'Q2 2026',
      targetRiskReductionPts: Number((totalReductionNeeded * 0.30).toFixed(1)),
      status: 'PLANNED',
      associatedControlIds: ['SC-7', 'AU-6'],
      completionPct: 20,
      owner: 'David Miller (Head of Cloud Infrastructure)',
      verificationCriteria: 'Automated Kubernetes NetworkPolicy enforcement verified with zero open egress paths.',
    },
    {
      id: 'ms-q3',
      title: 'Q3: Automated Patch Management SLA & Real-Time EDR Isolation',
      period: 'Q3 2026',
      targetRiskReductionPts: Number((totalReductionNeeded * 0.20).toFixed(1)),
      status: 'PLANNED',
      associatedControlIds: ['SI-2'],
      completionPct: 0,
      owner: 'Elena Rostova (SecOps Remediation Lead)',
      verificationCriteria: 'Vulnerability telemetry proves zero unpatched high/critical CVEs older than 14 days.',
    },
    {
      id: 'ms-q4',
      title: 'Q4: Annual Audit Re-Attestation & 40%+ Desired Risk Reduction Signoff',
      period: 'Q4 2026',
      targetRiskReductionPts: Number((totalReductionNeeded * 0.15).toFixed(1)),
      status: 'PLANNED',
      associatedControlIds: ['CA-2', 'RA-3'],
      completionPct: 0,
      owner: 'Marcus Vance (CISO / Product Owner Executive)',
      verificationCriteria: 'CISO formal re-certification with cryptographic hash confirming desired residual risk attenuation.',
    },
  ];
}

/**
 * Initializes or generates a complete Post-RCSA Risk Treatment Plan (RTP)
 * tailored to an assessment's actual controls and audit posture.
 */
export function generateRiskTreatmentPlan(
  assessment: RCSAPayload,
  criteria: PriorityCriteriaConfig = DEFAULT_PRIORITY_CRITERIA
): RiskTreatmentPlan {
  const controls = assessment.controls;
  const systemName = assessment.organizationProfile.targetSystem || 'Enterprise Production Enclave';
  const ownerName = assessment.organizationProfile.assessorName || 'Product Owner';

  // Find controls that match the priority criteria
  const prioritizedControls = controls.filter((c) => {
    const { matched } = doesControlMatchPriorityCriteria(c, criteria);
    return matched;
  });

  // Fallback: If no controls exceed the threshold, select the top 6 highest residual risk controls
  const candidateControls =
    prioritizedControls.length > 0
      ? prioritizedControls
      : [...controls].sort((a, b) => b.residualRisk - a.residualRisk).slice(0, 6);

  // Map to Risk Treatment Items
  const items: RiskTreatmentItem[] = candidateControls.map((c, idx) => {
    const { reasons } = doesControlMatchPriorityCriteria(c, criteria);
    const riskLevel = getControlRiskLevel(c.residualRisk);
    
    // Assign appropriate risk score band
    let riskScoreBand: RiskTreatmentItem['riskScoreBand'] = 'Medium';
    if (c.residualRisk >= 15.0) riskScoreBand = 'Critical';
    else if (c.residualRisk >= 12.0) riskScoreBand = 'High';
    else if (c.residualRisk >= 9.0) riskScoreBand = 'Medium-High';
    else if (c.residualRisk >= 5.0) riskScoreBand = 'Medium';
    else riskScoreBand = 'Low';

    // Default Treatment Option based on severity:
    // P0/Critical: Mitigate with new controls or automation
    // Third party/vendors: Option to Transfer
    // Legacy/sunset: Option to Avoid
    // Low residual: Option to Accept
    let treatmentOption: RiskTreatmentOption = 'MITIGATE';
    let rationale = 'Deploy technological controls to systematically reduce residual risk below enterprise threshold.';

    if (c.family === 'SR') {
      treatmentOption = 'TRANSFER';
      rationale = 'Transfer residual operational liability via third-party vendor cyber insurance and contractual indemnity SLAs.';
    } else if (c.status === 'COMPLIANT' && c.residualRisk < 6.0) {
      treatmentOption = 'ACCEPT';
      rationale = 'Formally accept remaining residual risk within organizational tolerance with periodic re-assessment.';
    }

    // Step 2 Action Plan Details
    let actionSteps: string[] = [];
    if (c.family === 'AC') {
      actionSteps = [
        'Deploy automated SCIM 2.0 provisioning connector with Okta.',
        'Configure immediate account suspension upon HR termination webhook.',
        'Enforce weekly automated reconciliation scans with security alerts for orphan accounts.',
      ];
    } else if (c.family === 'IA') {
      actionSteps = [
        'Issue hardware FIDO2 keys (YubiKey 5C) to all privileged engineers.',
        'Enforce Conditional Access policy rejecting SMS/Phone OTP authentication.',
        'Automate quarterly key audit and revoke dormant credentials.',
      ];
    } else if (c.family === 'SC') {
      actionSteps = [
        'Implement Istio service mesh mTLS across all Kubernetes pods.',
        'Restrict ingress CIDR blocks with automated Terraform security groups.',
        'Conduct automated daily port scans to verify zero unencrypted listening ports.',
      ];
    } else if (c.family === 'SI') {
      actionSteps = [
        'Deploy CrowdStrike Falcon EDR with automated isolation enabled.',
        'Integrate automated vulnerability scanning in GitHub Actions pipeline.',
        'Establish 14-day SLA for critical patch deployment.',
      ];
    } else if (c.family === 'PT' || c.domain === 'Privacy') {
      actionSteps = [
        'Deploy automated consent management API integrated into customer portal.',
        'Enable field-level tokenization for all sensitive PII in data stores.',
        'Schedule weekly automated PII discovery scans across S3 buckets.',
      ];
    } else {
      actionSteps = [
        `Harden ${c.controlId} implementation to meet NIST SP 800-53 Rev. 5 benchmarks.`,
        'Implement automated telemetry monitoring to eliminate manual checklists.',
        'Document and attach audit evidence for quarterly re-attestation.',
      ];
    }

    // Step 4 Automation Specifications
    const autoInfo = AUTOMATION_MAPPING[c.family] || {
      mechanism: `Automated ${c.controlId} policy engine integrated with centralized telemetry pipeline`,
      checklistReplaced: 'Manual recurring audit checklists and spreadsheet evaluations',
    };

    // Projected risk reduction: moving CEF to 0.90 and Confidence Factor to 1.0 (Automated)
    const projectedCEF = Math.min(1.0, Math.max(c.calculatedCEF + 0.35, 0.88));
    const projectedResidual = c.inherentRisk * (1 - projectedCEF * 1.0);
    const reductionPts = Number(Math.max(1.0, c.residualRisk - projectedResidual).toFixed(1));

    const quarters = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];
    const quarterMilestone = quarters[idx % quarters.length];

    // WHO TDR Tool 1.13 mapping
    const whoMapping = getWHOCategoryForControl(c.family, c.domain);
    const probRating: 'L' | 'M' | 'H' = c.inherentLikelihood >= 4 ? 'H' : c.inherentLikelihood === 3 ? 'M' : 'L';
    const impRating: 'L' | 'M' | 'H' = c.inherentImpact >= 4 ? 'H' : c.inherentImpact === 3 ? 'M' : 'L';
    const detRating: 'L' | 'M' | 'H' = c.confidenceFactor >= 0.95 ? 'H' : c.calculatedCEF >= 0.70 ? 'M' : 'L';
    const contingency = CONTINGENCY_MAPPING[c.family] || 'Isolate affected component, switch to manual verified offline protocol, and initiate high-priority incident escalation.';
    const nextReview = new Date(Date.now() + (idx + 1) * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return {
      id: `rtp-item-${c.controlId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      controlId: c.controlId,
      controlTitle: c.title,
      domain: c.domain,
      businessProcessOrApp: PROCESS_MAPPINGS[c.family] || `${systemName} - Core Module`,
      inherentRisk: c.inherentRisk,
      currentCEF: Number(c.calculatedCEF.toFixed(2)),
      residualRisk: Number(c.residualRisk.toFixed(1)),
      riskScoreBand,
      priorityCriteriaMatched: reasons.length > 0 ? reasons : ['Prioritized by Risk Magnitude'],
      treatmentOption,
      treatmentRationale: rationale,
      actionPlanSteps: actionSteps,
      namedOwner: c.assignedOwner || `${ownerName} (Product Owner)`,
      ownerRole: 'Product Owner / Lead Engineer',
      deadline: new Date(Date.now() + (idx + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isAutomatedSafeguard: c.confidenceFactor >= 0.95,
      automationMechanism: autoInfo.mechanism,
      manualChecklistReplaced: autoInfo.checklistReplaced,
      desiredTargetResidual: Number(Math.max(1.0, projectedResidual).toFixed(1)),
      projectedRiskReductionPts: reductionPts,
      status: 'IN_PROGRESS',
      quarterMilestone,
      // WHO TDR Tool 1.13 Specific Template Fields
      whoCategory: whoMapping.category,
      whoRiskArea: whoMapping.area,
      specificConcern: `${c.title}: Ineffective control implementation (${(c.calculatedCEF * 100).toFixed(0)}% CEF) poses residual risk (${c.residualRisk.toFixed(1)}) to ${systemName} data integrity and security posture.`,
      probabilityRating: probRating,
      impactRating: impRating,
      detectabilityRating: detRating,
      contingencyPlan: contingency,
      nextReviewDate: nextReview,
    };
  });

  // Calculate annual risk metrics
  const totalInherent = candidateControls.reduce((sum, c) => sum + c.inherentRisk, 0);
  const baselineResidual = candidateControls.reduce((sum, c) => sum + c.residualRisk, 0);
  const totalProjectedReduction = items.reduce((sum, i) => sum + i.projectedRiskReductionPts, 0);
  const targetResidual = Math.max(1, baselineResidual - totalProjectedReduction);

  const desiredReductionPct = Math.min(
    60,
    Math.round((totalProjectedReduction / (baselineResidual || 1)) * 100)
  );

  const milestones = generateDefaultMilestones(baselineResidual, targetResidual);
  const kris = generateDefaultKRIs(systemName);

  return {
    planId: `rtp-${Date.now().toString(36)}`,
    planName: `Risk Management & Treatment Plan (Standard Protocol / NIST 800-53) - ${systemName}`,
    organizationSystem: systemName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    priorityCriteria: criteria,
    annualTracking: {
      baselineAnnualResidual: Number(baselineResidual.toFixed(1)),
      targetAnnualResidual: Number(targetResidual.toFixed(1)),
      currentAnnualResidual: Number(baselineResidual.toFixed(1)), // Initially at baseline
      desiredReductionPercent: desiredReductionPct,
      achievedReductionPercent: 0,
      productOwnerName: ownerName,
      reviewCycleYear: 'FY 2026',
      milestones,
    },
    items,
    kris,
    approvalStatus: 'DRAFT',
    executiveNotes: `RTP established post-audit following standard Risk Management Plan guidelines to remediate high-deficiency controls and achieve a ${desiredReductionPct}% desired residual risk reduction across ${systemName}.`,
    whoDocumentHeader: {
      protocolRef: `RTP-${assessment.assessmentId.slice(0, 8).toUpperCase()}`,
      planTitle: `Risk Management & Treatment Plan: ${systemName}`,
      shortTitle: `${systemName.slice(0, 24)} RTP`,
      versionNumber: 'v1.0 (Final Approved)',
      documentDate: '23 JAN 2026',
      templateSource: 'Standard Risk Treatment Plan Protocol (Tool 1.13 Format)',
      reviewAndApproval: [
        {
          function: 'Prepared by',
          name: `${ownerName} (Survey Management Team / Lead Assessor)`,
          date: '2026-01-23',
          signature: `${ownerName.slice(0, 1)}. [Attested]`,
          status: 'SIGNED',
        },
        {
          function: 'Approved by',
          name: 'Marcus Vance (Principal Investigator / Executive Risk Sponsor)',
          date: '2026-01-25',
          signature: 'M. Vance [Executive Signoff]',
          status: 'SIGNED',
        },
        {
          function: 'Quality Assurance',
          name: 'Dr. Alistair Thorne (Quality Assurance Lead)',
          date: '2026-01-26',
          signature: 'A. Thorne [QA Certified]',
          status: 'SIGNED',
        },
      ],
      revisionRecord: [
        {
          version: 'v0.1',
          changes: 'Initial draft identification of high residual risks and deficiencies.',
          author: ownerName,
          date: '2026-01-15',
        },
        {
          version: 'v1.0',
          changes: 'Approved baseline incorporating qualitative severity matrix, remediation action plans, and quarterly milestones.',
          author: ownerName,
          date: '2026-01-25',
        },
      ],
    },
  };
}

/**
 * Applies the RTP remediated state to the assessment's active controls matrix
 * so Product Owners can see the real-time effect on RCSA scores.
 */
export function applyRTPRemediationToControls(
  controls: AssessedControl[],
  rtp: RiskTreatmentPlan
): {
  updatedControls: AssessedControl[];
  reducedCount: number;
  totalPointsReduced: number;
} {
  let reducedCount = 0;
  let totalPointsReduced = 0;

  const itemMap = new Map<string, RiskTreatmentItem>();
  rtp.items.forEach((item) => itemMap.set(item.controlId, item));

  const updatedControls = controls.map((ctrl) => {
    const rtpItem = itemMap.get(ctrl.controlId);
    if (!rtpItem) return ctrl;

    // If remediated or validating or automated, boost control performance
    if (
      rtpItem.status === 'REMEDIATED' ||
      rtpItem.status === 'VALIDATING' ||
      rtpItem.isAutomatedSafeguard
    ) {
      const prevResidual = ctrl.residualRisk;

      // Automated controls get confidence factor 1.0
      const newConfidence = rtpItem.isAutomatedSafeguard ? 1.0 : Math.min(1.0, ctrl.confidenceFactor + 0.1);
      // Eliminate or reduce deficiency penalty
      const newPenalty = 0.0;
      // Improve design and operating effectiveness
      const newDE = Math.min(1.0, Math.max(ctrl.designEffectiveness, 0.9));
      const newOE = Math.min(1.0, Math.max(ctrl.operatingEffectiveness, 0.88));

      const { calculatedCEF, residualRisk, status } = calculateControlRisk(
        ctrl.inherentImpact,
        ctrl.inherentLikelihood,
        newDE,
        newOE,
        newPenalty,
        newConfidence
      );

      const delta = prevResidual - residualRisk;
      if (delta > 0) {
        totalPointsReduced += delta;
        reducedCount++;
      }

      return {
        ...ctrl,
        designEffectiveness: newDE,
        operatingEffectiveness: newOE,
        deficiencyPenalty: newPenalty,
        confidenceFactor: newConfidence,
        calculatedCEF,
        residualRisk,
        status: status === 'CRITICAL_DEFICIENCY' ? 'SATISFACTORY' : status,
        gapsIdentified: `Remediated via RTP [${rtpItem.treatmentOption}]: ${rtpItem.actionPlanSteps[0] || 'Technical safeguard implemented'}`,
        lastUpdated: new Date().toISOString(),
      };
    }

    return ctrl;
  });

  return {
    updatedControls,
    reducedCount,
    totalPointsReduced: Number(totalPointsReduced.toFixed(1)),
  };
}
