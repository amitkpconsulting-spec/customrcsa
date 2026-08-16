/**
 * Custom RCSA by Technoscope - Enterprise Type Definitions
 * Framework: NIST SP 800-53 Rev. 5
 */

export type RiskDomain = 'Privacy' | 'Cybersecurity' | 'Information Security' | 'Governance';

export type RCSADomainType = 'All' | 'Privacy' | 'Information Security' | 'Cybersecurity' | 'Governance' | string;

export type NistFamilyId =
  | 'AC'  // Access Control
  | 'AT'  // Awareness & Training
  | 'AU'  // Audit & Accountability
  | 'CA'  // Assessment, Authorization & Monitoring
  | 'CM'  // Configuration Management
  | 'CP'  // Contingency Planning
  | 'IA'  // Identification & Authentication
  | 'IR'  // Incident Response
  | 'MA'  // Maintenance
  | 'MP'  // Media Protection
  | 'PE'  // Physical & Environmental Protection
  | 'PL'  // Planning
  | 'PM'  // Program Management
  | 'PS'  // Personnel Security
  | 'PT'  // PII Processing & Transparency
  | 'RA'  // Risk Assessment
  | 'SA'  // System & Services Acquisition
  | 'SC'  // System & Communications Protection
  | 'SI'  // System & Information Integrity
  | 'SR'; // Supply Chain Risk Management

export type SectorType =
  | 'Financial'
  | 'Healthcare'
  | 'Retail'
  | 'Technology'
  | 'Public_Sector'
  | 'Critical_Infrastructure'
  | 'Defense'
  | 'General_Enterprise';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type ControlStatus =
  | 'COMPLIANT'
  | 'SATISFACTORY'
  | 'NEEDS_ATTENTION'
  | 'CRITICAL_DEFICIENCY'
  | 'NOT_EVALUATED';

export type AssessmentWorkflowStage =
  | 'dashboard'
  | 'ai_dashboard'
  | 'create_rcsa'
  | 'scope'
  | 'questionnaire'
  | 'source_questionnaire'
  | 'heatmap'
  | 'remediation'
  | 'action_items'
  | 'signoff'
  | 'reports'
  | 'export';

export interface SourceStandardMapping {
  framework: string;         // e.g. "NIST SP 800-53 Rev. 5", "ISO/IEC 27001:2022", "CIS Controls v8", "GDPR", "NIST CSF 2.0"
  referenceId: string;       // e.g. "§AC-2(1)", "§A.5.15", "CIS 5.1", "Art. 6(1)"
  gapLevel?: 'No Gap' | 'Partial Gap' | 'Full Gap';
}

export interface SourceQuestionnaireItem {
  questionId: string;                 // e.g. "IAM-13.1", "DSP-08.1", "TVM-03.1"
  questionText: string;               // e.g. "Are processes, procedures, and technical measures for authenticating access to systems..."
  controlId: string;                  // e.g. "IAM-13", "DSP-08", "TVM-03"
  controlTitle: string;               // e.g. "Strong Authentication"
  domainTitle: string;                // e.g. "Identity & Access Management"
  domainCode: string;                 // e.g. "IAM", "DSP", "TVM", "A&A"
  controlSpecification: string;       // Authoritative specification
  caiqLite: boolean;                  // Part of CAIQ Lite
  ssrmOwnership: string;              // "CSP-Owned" | "CSC-Owned" | "Shared" | "Shared (Independent)" | "Shared (Dependent)"
  iaasOwnership?: string;             // "Shared" | "CSP-Owned" | "CSC-Owned"
  paasOwnership?: string;
  saasOwnership?: string;
  cspImplementationGuidance?: string; // Guidance for Cloud Service Provider
  cscResponsibilitiesGuidance?: string;// Guidance for Cloud Service Customer
  auditingGuidelines?: string[];      // Step-by-step examination procedures for auditors
  standardReferences?: SourceStandardMapping[];
  publication: string;                // "CSA CCM v4.1.0 / CAIQ v4.1.0" or "NIST SP 800-53 Rev. 5"
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  guidance?: string;
  subControl?: string;
  reference: string;          // e.g. "NIST SP 800-53 Rev. 5 §AC-2(1)" or "CSA CCM v4.1.0 §IAM-13"
  publication: string;        // e.g. "NIST SP 800-53 Rev. 5", "CSA CAIQ v4.1.0", "NIST Privacy Framework v1.0"
  additionalRef?: string;     // e.g. "GDPR Art. 6(1)(a)", "NIST CSF 2.0 PR.AC-01", "PCI-DSS v4.0 Req 8.2"
  ssrmOwnership?: string;     // e.g. "Shared (Dependent)", "CSP-Owned", "CSC-Owned"
  auditingGuidance?: string;  // Auditing examination steps
}

export interface NistControlDefinition {
  controlId: string;
  title: string;
  family: NistFamilyId;
  familyName: string;
  domain: RiskDomain;
  discussion: string;
  relatedControls: string[];
  controlEnhancements: string[];
  assessmentQuestions: AssessmentQuestion[];
  defaultImpact: number;
  defaultLikelihood: number;
  isAssuranceRelated?: boolean;
}

export interface QuestionResponse {
  answer: 'YES' | 'PARTIAL' | 'NO' | 'NOT_APPLICABLE';
  notes: string;
}

export interface EvidenceAttachment {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  fileType: string;
  hash?: string;
}

export interface AssessedControl extends NistControlDefinition {
  inherentImpact: number;       // 1 - 5
  inherentLikelihood: number;   // 1 - 5
  inherentRisk: number;         // Impact * Likelihood (1 - 25)
  designEffectiveness: number;  // 0.0 - 1.0
  operatingEffectiveness: number; // 0.0 - 1.0
  deficiencyPenalty: number;    // 0.0 - 0.5
  calculatedCEF: number;        // Control Effectiveness Factor: (0.4*De + 0.6*Oe)*(1 - deficiencyPenalty)
  confidenceFactor: number;     // 0.8 (Manual) - 1.0 (Automated)
  residualRisk: number;         // IR * (1 - (CEF * Cf))
  status: ControlStatus;
  implementationEvidence: string;
  gapsIdentified: string;
  questionResponses: Record<string, QuestionResponse>;
  evidenceAttachments: EvidenceAttachment[];
  assignedOwner?: string;
  lastUpdated: string;
}

export interface SectorOverlay {
  id: SectorType;
  name: string;
  regulatoryFrameworks: string[];
  focusFamilies: NistFamilyId[];
  mandatoryOverlays: string;
  description: string;
  defaultRiskMultiplier: number;
  badgeColor: string;
}

export interface OrganizationProfile {
  sector: SectorType;
  targetSystem: string;
  assessorId: string;
  assessorName: string;
  businessUnit: string;
  reviewCycle: string;
  complianceTarget: string;
  systemImpactLevel: 'Low' | 'Moderate' | 'High';
  lastAssessmentDate: string;
  rcsaDomain: RCSADomainType;
  selectedDomains?: RiskDomain[];
}

export interface AuditSignoff {
  status: 'Draft' | 'In Review' | 'Remediated' | 'Certified';
  assessorSignedBy?: string;
  assessorSignDate?: string;
  reviewerSignedBy?: string;
  reviewerSignDate?: string;
  cisoCertifiedBy?: string;
  cisoCertifyDate?: string;
  cryptographicFingerprint?: string;
  auditNotes?: string;
}

export interface RemediationRoadmapItem {
  id: string;
  priority: 'P0_IMMEDIATE' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';
  targetControl: string;
  controlTitle: string;
  domain: RiskDomain;
  gapSummary: string;
  technicalRemediationAction: string;
  compensatingControl: string;
  estimatedResidualReduction: number;
  implementationTimeline: string;
  validationCriteria: string;
  assignedTo?: string;
  dueDate?: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_RISK';
}

export interface AIRemediationPlan {
  engineUsed: string;
  modelVersion: string;
  generatedTimestamp: string;
  executiveSummary: string;
  sectorNotes?: string;
  roadmap: RemediationRoadmapItem[];
}

export interface RCSAPayload {
  assessmentId: string;
  assessmentName: string;
  rcsaDomain: RCSADomainType;
  selectedDomains?: RiskDomain[];
  timestamp: string;
  organizationProfile: OrganizationProfile;
  controls: AssessedControl[];
  auditSignoff: AuditSignoff;
  aiRemediation?: AIRemediationPlan;
}

export interface DomainRiskSummary {
  domain: RiskDomain;
  totalControls: number;
  assessedCount: number;
  aggregateInherentRisk: number;
  aggregateResidualRisk: number;
  averageCEF: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  status: 'SATISFACTORY' | 'NEEDS_ATTENTION' | 'CRITICAL_DEFICIENCY';
}

export type AIMode =
  | 'gemini'
  | 'local_lmstudio'
  | 'local_ollama'
  | 'local_anythingllm'
  | 'offline_expert';

export interface AISettings {
  mode: AIMode;
  lmStudioEndpoint: string;
  lmStudioModel: string;
  ollamaEndpoint: string;
  ollamaModel: string;
  anythingLlmEndpoint: string;
  anythingLlmModel: string;
  anythingLlmApiKey?: string;
  isAirGappedMode: boolean;
}

export type MatrixDimension = '3x3' | '5x5';

export type EnvironmentOperatingMode = 'production' | 'staging' | 'sandbox';

export interface RiskWeightingModifiers {
  aiMlProcessing: boolean;       // +1.5x Multiplier
  sensitivePii: boolean;         // +1.4x Multiplier
  crossBorderTransfer: boolean;  // +1.3x Multiplier
  unmonitoredVendor: boolean;    // +1.2x Multiplier
}

export interface RiskMatrixConfig {
  dimension: MatrixDimension;
  sector: SectorType;
  environmentMode: EnvironmentOperatingMode;
  modifiers: RiskWeightingModifiers;
  matrixMode: 'residual' | 'inherent';
}

// ==========================================
// AI Dashboard & Intelligence Feature Types
// ==========================================

export interface AIExecutiveSummary {
  engineUsed: string;
  generatedTimestamp: string;
  postureGrade: 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  headline: string;
  keyRiskDrivers: string[];
  strengthsIdentified: string[];
  criticalVulnerabilities: string[];
  boardTalkingPoints: string[];
  auditReadinessScore: number; // 0 - 100
  regulatoryExposureSummary: string;
}

export interface ControlTrajectoryPrediction {
  controlId: string;
  controlTitle: string;
  domain: RiskDomain;
  currentResidualRisk: number;
  projectedResidualRisk30d: number;
  projectedResidualRisk90d: number;
  trajectoryDirection: 'IMPROVING' | 'STABLE' | 'DEGRADING' | 'CRITICAL_SPIKE';
  degradationFactors: string[];
  recommendedPreventativeAction: string;
}

export interface AIHeatmapPrediction {
  engineUsed: string;
  generatedTimestamp: string;
  forecastScenario: string;
  baselineCriticalCount: number;
  projectedCriticalCount30d: number;
  projectedCriticalCount90d: number;
  riskVelocityScore: 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';
  domainRiskShifts: {
    domain: RiskDomain;
    currentRisk: number;
    projectedRisk30d: number;
    projectedRisk90d: number;
    trend: 'INCREASING' | 'STABLE' | 'DECREASING';
    threatVector: string;
  }[];
  volatileControls: ControlTrajectoryPrediction[];
  preventativeRecommendations: string[];
}

export interface AIRiskSynthesisItem {
  id: string;
  title: string;
  domain: RiskDomain;
  affectedControls: string[];
  rootCauseAnalysis: string;
  threatLikelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  businessImpactSeverity: 'CATASTROPHIC' | 'MAJOR' | 'MODERATE' | 'MINOR';
  priority: 'P0_IMMEDIATE' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';
  recommendedRemediation: string;
  compensatingControl: string;
  estimatedCostEffort: 'LOW (1-3 Days)' | 'MEDIUM (1-2 Weeks)' | 'HIGH (1-2 Months)';
  estimatedRiskReductionPct: number;
  roiScore: number; // 1-10
}

export interface AIRiskRemediationSynthesis {
  engineUsed: string;
  generatedTimestamp: string;
  totalDeficienciesAnalyzed: number;
  highestImpactActions: AIRiskSynthesisItem[];
  remediationBudgetEstimate: string;
  overallProjectedResidualReduction: number;
  strategicGuidance: string;
}

export interface AITrendItem {
  id: string;
  title: string;
  category: 'REGULATORY_UPDATE' | 'EMERGING_THREAT' | 'ENFORCEMENT_ACTION' | 'INDUSTRY_BENCHMARK';
  sourceAuthority: string; // e.g. "NIST", "SEC", "EU EDPB", "CISA", "HHS OCR"
  effectiveDateOrPeriod: string;
  relevanceScore: number; // 1 - 100%
  summary: string;
  directImpactOnSystem: string;
  relevantNistControls: string[];
  actionRequired: 'URGENT_ACTION' | 'ASSESSMENT_REQUIRED' | 'MONITOR_ONLY';
}

export type AIWriteupType =
  | 'BOARD_MEMO'
  | 'CISO_EXECUTIVE_DEFENSE'
  | 'REGULATORY_STATEMENT_OF_CONTROLS'
  | 'RISK_EXCEPTION_JUSTIFICATION'
  | 'CUSTOMER_TRUST_ATTESTATION'
  | 'AUDIT_GAP_NARRATIVE';

export interface AIWriteupResult {
  writeupType: AIWriteupType;
  title: string;
  targetAudience: string;
  dateGenerated: string;
  engineUsed: string;
  content: string; // Markdown formatted
  executiveSummary: string;
  keyActionItems: string[];
}

export type MilestoneStatus =
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'UPCOMING'
  | 'AT_RISK'
  | 'CRITICAL_PATH'
  | 'OVERDUE';

export type MilestoneCategory =
  | 'AUDIT_MILESTONE'
  | 'RENEWAL_EXPIRATION'
  | 'ASSESSMENT_CYCLE'
  | 'REMEDIATION_DEADLINE'
  | 'REGULATORY_FILING';

export interface DomainMilestone {
  id: string;
  domain: RCSADomainType;
  title: string;
  category: MilestoneCategory;
  phase: string;
  targetDate: string; // e.g. "2026-09-15"
  renewalCycle?: string; // e.g. "Annual (Q3 Renewal)", "Bi-Annual", "Continuous"
  status: MilestoneStatus;
  progressPct: number;
  ownerRole: string;
  deliverables: string[];
  frameworkRef: string; // e.g. "NIST Privacy / GDPR Art 35", "ISO 27001 Clause 9.2"
  description: string;
  criticality: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  daysRemaining: number;
  isRenewalDate?: boolean;
}

export interface RCSATemplate {
  id: string;
  name: string;
  description: string;
  domains: RiskDomain[];
  sector: SectorType;
  systemImpactLevel: 'Low' | 'Moderate' | 'High';
  businessUnit: string;
  reviewCycle: string;
  targetSystem: string;
  assessorName?: string;
  isDefault?: boolean;
  createdAt: string;
  tags?: string[];
  frameworkFocus?: string;
}

export interface RCSAVersionSnapshot {
  id: string;
  versionTag: string; // e.g. "v1.0 (Baseline)", "v1.1 (Mid-Year)", "v2.0 (Current)"
  timestamp: string;
  name: string;
  createdBy: string;
  notes: string;
  domain: RCSADomainType;
  overallRiskScore: number;
  inherentRiskScore: number;
  residualRiskScore: number;
  controlEffectivenessScore: number;
  totalControls: number;
  assessedControls: number;
  deficienciesCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  domainScores: Record<string, {
    inherent: number;
    residual: number;
    cef: number;
    status: string;
  }>;
}
