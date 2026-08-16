import { RCSAPayload, RCSADomainType, RiskDomain, SectorType } from '../types';
import { NIST_CONTROLS_CATALOG, getControlsForRCSADomain } from './nistControls';
import { calculateControlRisk } from '../utils/riskCalculations';

export function createInitialAssessmentFromCatalog(
  assessmentName: string = 'Enterprise Production Core RCSA',
  sector: SectorType = 'Technology',
  targetSystem: string = 'Core Cloud Infrastructure & Data Platform',
  assessorName: string = 'Amit Patel (Principal Risk Assessor)',
  rcsaDomain: RCSADomainType = 'All',
  selectedDomains?: RiskDomain[]
): RCSAPayload {
  const effectiveDomain = selectedDomains && selectedDomains.length > 0
    ? (selectedDomains.length === 1 ? selectedDomains[0] : selectedDomains.join(' + '))
    : rcsaDomain;

  const selectedControlsCatalog = getControlsForRCSADomain(selectedDomains || effectiveDomain);

  const initialControls = selectedControlsCatalog.map((def, idx) => {
    // Seed default realistic evaluations
    let de = 0.8;
    let oe = 0.75;
    let defPenalty = 0;
    let gaps = '';
    let evidence = 'Documented in Enterprise Security Handbook v4.2; verified via quarterly automated compliance check.';

    // Create realistic variation for some high-profile controls
    if (def.controlId === 'AC-2') {
      de = 0.9;
      oe = 0.6;
      defPenalty = 0.1;
      gaps = 'Service accounts inactive for > 60 days not automatically decommissioned in secondary legacy AWS region.';
      evidence = 'Okta SSO automated deprovisioning in place for Active Directory; manual review for legacy DB accounts.';
    } else if (def.controlId === 'PT-2' || def.controlId === 'PT-4') {
      de = 0.75;
      oe = 0.65;
      defPenalty = 0.15;
      gaps = 'Customer consent telemetry lacks unified real-time revocation webhook in backend data warehouse.';
      evidence = 'OneTrust Privacy Consent Portal deployed; Kafka consent stream under testing.';
    } else if (def.controlId === 'SR-4') {
      de = 0.6;
      oe = 0.4;
      defPenalty = 0.2;
      gaps = 'SBOM generation active in GitHub actions but third-party container runtime scanning lacks automated signed attestation.';
      evidence = 'CycloneDX JSON generated during CI/CD builds.';
    } else if (def.controlId === 'SC-7') {
      de = 0.95;
      oe = 0.9;
      defPenalty = 0;
      evidence = 'Palo Alto Next-Gen Firewalls + AWS Security Groups deny-by-default; Zero Trust micro-segmentation deployed with Istio Service Mesh.';
    }

    const { inherentRisk, calculatedCEF, residualRisk, status } = calculateControlRisk(
      def.defaultImpact,
      def.defaultLikelihood,
      de,
      oe,
      defPenalty,
      0.95
    );

    const questionResponses: Record<string, { answer: 'YES' | 'PARTIAL' | 'NO' | 'NOT_APPLICABLE'; notes: string }> = {};
    def.assessmentQuestions.forEach((q, qIdx) => {
      questionResponses[q.id] = {
        answer: defPenalty > 0 && qIdx === 1 ? 'PARTIAL' : 'YES',
        notes: qIdx === 0 ? 'Fully established in enterprise standards.' : 'Operating with minor planned enhancements.',
      };
    });

    return {
      ...def,
      inherentImpact: def.defaultImpact,
      inherentLikelihood: def.defaultLikelihood,
      inherentRisk,
      designEffectiveness: de,
      operatingEffectiveness: oe,
      deficiencyPenalty: defPenalty,
      calculatedCEF,
      confidenceFactor: 0.95,
      residualRisk,
      status,
      implementationEvidence: evidence,
      gapsIdentified: gaps,
      questionResponses,
      evidenceAttachments: [
        {
          id: `ev-${idx}-1`,
          name: `${def.controlId}_Policy_Evidence_2026.pdf`,
          size: '1.4 MB',
          uploadedAt: '2026-08-10',
          fileType: 'application/pdf',
          hash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        },
      ],
      assignedOwner: idx % 3 === 0 ? 'DevSecOps Team' : idx % 3 === 1 ? 'Data Governance Lead' : 'CISO Security Ops',
      lastUpdated: '2026-08-14T10:00:00Z',
    };
  });

  const idPrefix = typeof effectiveDomain === 'string' ? effectiveDomain.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') : 'RCSA';

  return {
    assessmentId: `RCSA-2026-${idPrefix || 'CORE'}-${Math.floor(100 + Math.random() * 900)}`,
    assessmentName,
    rcsaDomain: effectiveDomain,
    selectedDomains: selectedDomains || (rcsaDomain === 'All' ? ['Privacy', 'Information Security', 'Cybersecurity', 'Governance'] : [rcsaDomain as any]),
    timestamp: new Date().toISOString(),
    organizationProfile: {
      sector,
      targetSystem,
      rcsaDomain: effectiveDomain,
      selectedDomains: selectedDomains || (rcsaDomain === 'All' ? ['Privacy', 'Information Security', 'Cybersecurity', 'Governance'] : [rcsaDomain as any]),
      assessorId: 'SEC-AUDIT-409',
      assessorName,
      businessUnit: 'Global Technology Infrastructure & Cyber Risk',
      reviewCycle: 'Q3 2026 Comprehensive RCSA Cycle',
      complianceTarget: effectiveDomain.includes('Privacy') && effectiveDomain.includes('Information Security')
        ? 'NIST Privacy Framework v1.0 / NIST SP 800-53 / ISO 27001'
        : effectiveDomain === 'Privacy' 
        ? 'NIST Privacy Framework v1.0 / GDPR / CCPA' 
        : effectiveDomain === 'Cybersecurity'
        ? 'NIST CSF 2.0 / Zero Trust (SP 800-207)'
        : effectiveDomain === 'Information Security'
        ? 'NIST SP 800-53 Rev. 5 / ISO/IEC 27001:2022'
        : 'NIST SP 800-53 Rev. 5 Universe & Privacy Overlay',
      systemImpactLevel: 'High',
      lastAssessmentDate: '2026-08-15',
    },
    controls: initialControls,
    auditSignoff: {
      status: 'In Review',
      assessorSignedBy: assessorName,
      assessorSignDate: '2026-08-14',
      auditNotes: `Quarterly ${effectiveDomain} Risk & Control Self-Assessment verified against NIST SP 800-53 Rev. 5 controls, publications, and sector regulatory overlays.`,
    },
    aiRemediation: {
      engineUsed: 'Google Gemini 3.7 Flash & NIST Expert Model',
      modelVersion: 'gemini-3.7-flash-v2',
      generatedTimestamp: '2026-08-15T09:30:00Z',
      executiveSummary: `Assessment indicates a strong foundational baseline across the ${rcsaDomain} scope, with targeted remediation recommended for enhanced compliance and residual risk reduction.`,
      sectorNotes: `For ${sector} sector, prioritized automated testing, verifiable technical telemetry, and sub-processor governance to satisfy regulatory requirements.`,
      roadmap: [
        {
          id: 'rem-1',
          priority: 'P0_IMMEDIATE',
          targetControl: rcsaDomain === 'Privacy' ? 'PT-4' : 'SR-4',
          controlTitle: rcsaDomain === 'Privacy' ? 'Consent & Revocation Telemetry' : 'Software Supply Chain Provenance (SBOM)',
          domain: rcsaDomain === 'Privacy' ? 'Privacy' : 'Information Security',
          gapSummary: rcsaDomain === 'Privacy' 
            ? 'Customer consent telemetry lacks unified real-time revocation webhook in backend data warehouse.'
            : 'Container runtime scanning lacks automated signed cryptographic attestation on build artifacts.',
          technicalRemediationAction: rcsaDomain === 'Privacy'
            ? 'Deploy Apache Kafka topic for real-time consent updates and automated row-level masking in Snowflake.'
            : 'Implement Cosign/Sigstore keyless signing in GitHub Actions and block untrusted images via Kubernetes Admission Controller.',
          compensatingControl: 'Daily automated vulnerability and compliance scans.',
          estimatedResidualReduction: 8.5,
          implementationTimeline: '1-2 Weeks',
          validationCriteria: 'Verifiable audit trail and automated enforcement confirmed in production tests.',
          assignedTo: rcsaDomain === 'Privacy' ? 'Data Privacy Officer & Eng' : 'Cloud Platform Security Lead',
          dueDate: '2026-08-30',
          status: 'IN_PROGRESS',
        },
        {
          id: 'rem-2',
          priority: 'P1_HIGH',
          targetControl: rcsaDomain === 'Privacy' ? 'SI-19' : 'AC-2',
          controlTitle: rcsaDomain === 'Privacy' ? 'De-identification & Masking' : 'Account Management & Orphaned Credentials',
          domain: rcsaDomain === 'Privacy' ? 'Privacy' : 'Cybersecurity',
          gapSummary: rcsaDomain === 'Privacy'
            ? 'Analytical queries require automated pseudonymization and differential privacy safeguards.'
            : 'Legacy database accounts in secondary disaster recovery region require manual deactivation.',
          technicalRemediationAction: rcsaDomain === 'Privacy'
            ? 'Apply dynamic hashing and cryptographic salt to all PII fields in analytics views.'
            : 'Migrate remaining standalone DB credentials to HashiCorp Vault with dynamic STS session tokens (TTL 1 hr).',
          compensatingControl: 'Bi-weekly manual audit of database and analytics rosters.',
          estimatedResidualReduction: 6.2,
          implementationTimeline: '30 Days',
          validationCriteria: '100% elimination of unmasked PII and static passwords.',
          assignedTo: rcsaDomain === 'Privacy' ? 'Lead Data Architect' : 'Database Reliability Team',
          dueDate: '2026-09-15',
          status: 'OPEN',
        },
      ],
    },
  };
}

export const DEMO_PRESETS: { id: string; name: string; sector: SectorType; rcsaDomain: RCSADomainType; description: string; system: string }[] = [
  {
    id: 'demo-privacy',
    name: 'Privacy RCSA - Consumer Data & GDPR/CCPA Platform',
    sector: 'Technology',
    rcsaDomain: 'Privacy',
    system: 'Customer Data Platform, Telemetry Pipeline & Consent Vault',
    description: 'Specialized Privacy RCSA focusing on PII lawful authority, purpose binding, opt-in/opt-out consent mechanisms, privacy notices, and de-identification.',
  },
  {
    id: 'demo-cyber',
    name: 'Cyber Security RCSA - Threat Defense & Zero Trust Infrastructure',
    sector: 'Financial',
    rcsaDomain: 'Cybersecurity',
    system: 'Fintech Payment Core, Zero Trust Mesh & Cardholder Vault',
    description: 'Technical Cyber RCSA focusing on perimeter defense (SC-7), MFA (IA-2), real-time SIEM logging (AU-2/6), vulnerability scanning (RA-5), and incident handling (IR-4).',
  },
  {
    id: 'demo-infosec',
    name: 'Information Security RCSA - Enterprise ISMS & Supply Chain',
    sector: 'Healthcare',
    rcsaDomain: 'Information Security',
    system: 'CarePulse Cloud EHR, Microservices & Vendor Integration',
    description: 'Comprehensive InfoSec RCSA focusing on configuration baselines (CM-2), BCDR contingency plans (CP-2/9), media sanitization (MP-6), and SBOM supply chain management (SR-4).',
  },
  {
    id: 'demo-enterprise',
    name: 'Comprehensive Enterprise RCSA - 20 NIST Families Universe',
    sector: 'Financial',
    rcsaDomain: 'All',
    system: 'Global Cloud Infrastructure & Multi-Tenant Enterprise Core',
    description: 'Full-spectrum enterprise RCSA combining Cybersecurity, Information Security, Privacy, and Executive Governance controls.',
  },
];
