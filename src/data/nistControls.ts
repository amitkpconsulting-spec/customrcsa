/**
 * NIST SP 800-53 Rev. 5 Control Universe & Domain RCSA Questionnaires
 * Authoritative Citations: NIST SP 800-53 Rev. 5, NIST Privacy Framework v1.0,
 * NIST CSF 2.0, ISO/IEC 27001:2022, NIST SP 800-161, NIST SP 800-88, NIST SP 800-61.
 */

import { NistControlDefinition, NistFamilyId, RiskDomain, RCSADomainType, AssessedControl } from '../types';

export interface RCSADomainConfig {
  id: RCSADomainType;
  title: string;
  shortTitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  coreFrameworks: string[];
  focusFamilies: NistFamilyId[];
  targetAudience: string;
  sampleQuestionsCount: number;
}

export const RCSA_DOMAIN_CONFIGS: Record<RCSADomainType, RCSADomainConfig> = {
  'Privacy': {
    id: 'Privacy',
    title: 'Privacy RCSA',
    shortTitle: 'Privacy Domain',
    badge: 'PII & Transparency Baseline',
    badgeColor: 'border-purple-600 text-purple-700 bg-purple-50',
    description: 'Specialized assessment evaluating PII collection, lawful processing authority, purpose limitation, individual consent & rights, privacy by design, de-identification, and data protection impact assessments (PIAs).',
    coreFrameworks: [
      'NIST Privacy Framework v1.0',
      'NIST SP 800-53 Rev. 5 (PT & SI Families)',
      'ISO/IEC 27701:2019 Privacy Extension',
      'GDPR (EU 2016/679) & CCPA/CPRA',
      'NIST SP 800-188 (De-Identification)'
    ],
    focusFamilies: ['PT', 'SI', 'PM', 'RA', 'AC', 'AU', 'MP'],
    targetAudience: 'Data Privacy Officers (DPO), Legal Counsel, Data Governance Leads, Chief Compliance Officers',
    sampleQuestionsCount: 22,
  },
  'Information Security': {
    id: 'Information Security',
    title: 'Information Security RCSA',
    shortTitle: 'InfoSec Domain',
    badge: 'CIA & Governance Baseline',
    badgeColor: 'border-blue-600 text-blue-700 bg-blue-50',
    description: 'Comprehensive assessment evaluating the Confidentiality, Integrity, and Availability of enterprise assets, configuration baselines, media sanitization, supply chain SCRM/SBOM, personnel screening, and business continuity (BCDR).',
    coreFrameworks: [
      'NIST SP 800-53 Rev. 5 (InfoSec Baseline)',
      'ISO/IEC 27001:2022 (ISMS Requirements)',
      'NIST SP 800-161 Rev. 1 (Supply Chain SCRM)',
      'NIST SP 800-34 Rev. 1 (Contingency Planning)',
      'NIST SP 800-88 Rev. 1 (Media Sanitization)'
    ],
    focusFamilies: ['AT', 'CA', 'CM', 'CP', 'MA', 'MP', 'PE', 'PL', 'PS', 'SA', 'SI', 'SR'],
    targetAudience: 'Chief Information Security Officers (CISO), IT Risk Directors, Internal Auditors, Compliance Managers',
    sampleQuestionsCount: 28,
  },
  'Cybersecurity': {
    id: 'Cybersecurity',
    title: 'Cyber Security RCSA',
    shortTitle: 'Cyber Threat Domain',
    badge: 'Threat & Defense Baseline',
    badgeColor: 'border-emerald-600 text-emerald-700 bg-emerald-50',
    description: 'Deep technical assessment evaluating cyber defenses, perimeter boundary filtering, Zero Trust identity & MFA, continuous SIEM/SOC event logging, incident containment, vulnerability scanning, and cryptographic protection.',
    coreFrameworks: [
      'NIST Cybersecurity Framework (CSF) 2.0',
      'NIST SP 800-53 Rev. 5 (Cyber Controls)',
      'NIST SP 800-207 (Zero Trust Architecture)',
      'NIST SP 800-61 Rev. 2 (Incident Response)',
      'FIPS 140-3 Cryptographic Standards'
    ],
    focusFamilies: ['AC', 'AU', 'IA', 'IR', 'RA', 'SC', 'SI'],
    targetAudience: 'Security Operations Center (SOC) Leads, Cyber Threat Analysts, DevSecOps Engineers, Network Architects',
    sampleQuestionsCount: 30,
  },
  'All': {
    id: 'All',
    title: 'Comprehensive Enterprise RCSA',
    shortTitle: 'Universal Baseline',
    badge: 'All 20 NIST Control Families',
    badgeColor: 'border-[#1A1A1A] text-[#1A1A1A] bg-[#FAF9F6]',
    description: 'The complete enterprise assessment spanning all 20 NIST SP 800-53 Rev. 5 control families, combining Cybersecurity, Information Security, Privacy, and Executive Governance.',
    coreFrameworks: [
      'NIST SP 800-53 Rev. 5 Catalog',
      'NIST Privacy Framework v1.0',
      'NIST CSF 2.0 & Zero Trust (SP 800-207)',
      'ISO/IEC 27001:2022 & SOC 2 Type II'
    ],
    focusFamilies: [
      'AC', 'AT', 'AU', 'CA', 'CM', 'CP', 'IA', 'IR', 'MA', 'MP',
      'PE', 'PL', 'PM', 'PS', 'PT', 'RA', 'SA', 'SC', 'SI', 'SR'
    ],
    targetAudience: 'Enterprise Risk Committees, Board of Directors, Principal Risk Assessors, Regulatory Examiners',
    sampleQuestionsCount: 52,
  },
};

export const NIST_FAMILIES: { id: NistFamilyId; name: string; domain: RiskDomain; count: number }[] = [
  { id: 'AC', name: 'Access Control', domain: 'Cybersecurity', count: 25 },
  { id: 'AT', name: 'Awareness and Training', domain: 'Information Security', count: 6 },
  { id: 'AU', name: 'Audit and Accountability', domain: 'Cybersecurity', count: 16 },
  { id: 'CA', name: 'Assessment, Authorization, and Monitoring', domain: 'Information Security', count: 9 },
  { id: 'CM', name: 'Configuration Management', domain: 'Information Security', count: 14 },
  { id: 'CP', name: 'Contingency Planning', domain: 'Information Security', count: 13 },
  { id: 'IA', name: 'Identification and Authentication', domain: 'Cybersecurity', count: 12 },
  { id: 'IR', name: 'Incident Response', domain: 'Cybersecurity', count: 10 },
  { id: 'MA', name: 'Maintenance', domain: 'Information Security', count: 7 },
  { id: 'MP', name: 'Media Protection', domain: 'Information Security', count: 8 },
  { id: 'PE', name: 'Physical and Environmental Protection', domain: 'Information Security', count: 23 },
  { id: 'PL', name: 'Planning', domain: 'Governance', count: 11 },
  { id: 'PM', name: 'Program Management', domain: 'Governance', count: 32 },
  { id: 'PS', name: 'Personnel Security', domain: 'Information Security', count: 9 },
  { id: 'PT', name: 'PII Processing and Transparency', domain: 'Privacy', count: 8 },
  { id: 'RA', name: 'Risk Assessment', domain: 'Cybersecurity', count: 10 },
  { id: 'SA', name: 'System and Services Acquisition', domain: 'Information Security', count: 23 },
  { id: 'SC', name: 'System and Communications Protection', domain: 'Cybersecurity', count: 51 },
  { id: 'SI', name: 'System and Information Integrity', domain: 'Cybersecurity', count: 23 },
  { id: 'SR', name: 'Supply Chain Risk Management', domain: 'Information Security', count: 12 },
];

export const NIST_CONTROLS_CATALOG: NistControlDefinition[] = [
  // ==========================================
  // 1. ACCESS CONTROL (AC) - CYBERSECURITY
  // ==========================================
  {
    controlId: 'AC-1',
    title: 'Policy and Procedures',
    family: 'AC',
    familyName: 'Access Control',
    domain: 'Cybersecurity',
    discussion: 'Access control policy and procedures address controls in the AC family implemented within systems and organizations to ensure management commitment, coordination, and regulatory compliance.',
    relatedControls: ['IA-1', 'PM-9', 'PM-24', 'PS-8', 'SI-12'],
    controlEnhancements: [],
    assessmentQuestions: [
      {
        id: 'AC-1.1',
        text: 'Does the organization develop, document, and disseminate an access control policy addressing purpose, scope, roles, responsibilities, and regulatory compliance?',
        reference: 'NIST SP 800-53 Rev. 5 §AC-1(a)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.5.15'
      },
      {
        id: 'AC-1.2',
        text: 'Are formal operational procedures established and reviewed annually to facilitate the implementation of the access control policy across all environments?',
        reference: 'NIST SP 800-53 Rev. 5 §AC-1(b)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CIS Control 5.1'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },
  {
    controlId: 'AC-2',
    title: 'Account Management',
    family: 'AC',
    familyName: 'Access Control',
    domain: 'Cybersecurity',
    discussion: 'Manages system accounts, group memberships, authorizations, and automated account workflows to enforce the principle of least privilege.',
    relatedControls: ['AC-3', 'AC-5', 'AC-6', 'AC-17', 'AC-18', 'AU-2', 'IA-2', 'IA-4', 'IA-5', 'PT-2', 'PT-3'],
    controlEnhancements: ['Automated System Account Management', 'Automated Temporary Account Removal', 'Disable Inactive Accounts', 'Dynamic Privilege Management'],
    assessmentQuestions: [
      {
        id: 'AC-2.1',
        text: 'Does the organization define and document the types of accounts allowed (individual, guest, service, emergency) and specifically prohibited for use within the system?',
        reference: 'NIST SP 800-53 Rev. 5 §AC-2(a)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST CSF 2.0 PR.AC-01'
      },
      {
        id: 'AC-2.2',
        text: 'Are authorized users, group/role memberships, and access authorizations specified, approved by management, and validated quarterly?',
        reference: 'NIST SP 800-53 Rev. 5 §AC-2(d)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.5.18'
      },
      {
        id: 'AC-2.3',
        text: 'Are inactive, expired, or terminated employee accounts disabled automatically within predefined timeframes (e.g., within 24 hours of separation or 60 days inactivity)?',
        reference: 'NIST SP 800-53 Rev. 5 §AC-2(3)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'PCI-DSS v4.0 Req 8.2.6'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 4,
  },
  {
    controlId: 'AC-3',
    title: 'Access Enforcement',
    family: 'AC',
    familyName: 'Access Control',
    domain: 'Cybersecurity',
    discussion: 'Enforces approved authorizations for logical access to information and system resources in accordance with applicable access control policies (e.g., RBAC, ABAC, MAC).',
    relatedControls: ['AC-2', 'AC-4', 'AC-6', 'AC-16', 'IA-2', 'SC-2', 'SC-3', 'SC-28', 'SI-4'],
    controlEnhancements: ['Dual Authorization', 'Mandatory Access Control', 'Role-Based Access Control', 'Attribute-Based Access Control', 'Individual Access to PII'],
    assessmentQuestions: [
      {
        id: 'AC-3.1',
        text: 'Does the system enforce approved authorizations for logical access to information and system resources in accordance with role-based (RBAC) or attribute-based (ABAC) policies?',
        reference: 'NIST SP 800-53 Rev. 5 §AC-3',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST CSF 2.0 PR.AC-03'
      },
      {
        id: 'AC-3.2',
        text: 'Are dual authorizations or two-person controls enforced for high-risk privileged commands, bulk data exports, and security configuration changes?',
        reference: 'NIST SP 800-53 Rev. 5 §AC-3(2)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'FFIEC Cat 3.1'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 4,
  },
  {
    controlId: 'AC-4',
    title: 'Information Flow Enforcement',
    family: 'AC',
    familyName: 'Access Control',
    domain: 'Cybersecurity',
    discussion: 'Enforces approved authorizations for controlling information flow within systems and across interconnected network boundaries based on flow control policies.',
    relatedControls: ['AC-3', 'AC-16', 'AC-17', 'AU-10', 'CA-3', 'CM-7', 'SC-7', 'SC-16'],
    controlEnhancements: ['Object Security Attributes', 'Processing Domains', 'Metadata Flow Control', 'One-way Flow Mechanisms', 'Security & Privacy Policy Filters'],
    assessmentQuestions: [
      {
        id: 'AC-4.1',
        text: 'Does the system enforce approved authorizations for controlling the flow of information within the system and across external boundary connections?',
        reference: 'NIST SP 800-53 Rev. 5 §AC-4',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-207 Zero Trust §3.2'
      },
      {
        id: 'AC-4.2',
        text: 'Are security and privacy policy filters configured to block, quarantine, or sanitize unauthorized data egress and cross-border transfers?',
        reference: 'NIST SP 800-53 Rev. 5 §AC-4(8)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'GDPR Art. 44-49'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
  },
  {
    controlId: 'AC-6',
    title: 'Least Privilege',
    family: 'AC',
    familyName: 'Access Control',
    domain: 'Cybersecurity',
    discussion: 'Employs the principle of least privilege, allowing only authorized accesses for users or processes that are strictly necessary to accomplish assigned organizational tasks.',
    relatedControls: ['AC-2', 'AC-3', 'AC-5', 'CM-5', 'PL-2', 'PM-12', 'SA-8', 'SC-38'],
    controlEnhancements: ['Authorize Access to Security Functions', 'Non-privileged Access for Nonsecurity Functions', 'Privileged Accounts Isolation', 'Review of User Privileges'],
    assessmentQuestions: [
      {
        id: 'AC-6.1',
        text: 'Does the organization employ the principle of least privilege, allowing only authorizations necessary to accomplish assigned operational tasks?',
        reference: 'NIST SP 800-53 Rev. 5 §AC-6',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.5.15'
      },
      {
        id: 'AC-6.2',
        text: 'Are privileged user accounts restricted to designated administrators and audited continuously for atypical or unauthorized command execution?',
        reference: 'NIST SP 800-53 Rev. 5 §AC-6(2)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CIS Control 5.4'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 4,
  },
  {
    controlId: 'AC-17',
    title: 'Remote Access',
    family: 'AC',
    familyName: 'Access Control',
    domain: 'Cybersecurity',
    discussion: 'Establishes usage restrictions, configuration requirements, and encrypted VPN/TLS protocols for all remote access to organizational systems.',
    relatedControls: ['AC-2', 'AC-3', 'AC-18', 'CA-3', 'IA-2', 'SC-8', 'SC-12', 'SI-4'],
    controlEnhancements: ['Monitoring and Control', 'Encryption Protection', 'Managed Access Control Points', 'Authenticate Remote Commands'],
    assessmentQuestions: [
      {
        id: 'AC-17.1',
        text: 'Are remote access connections authorized, monitored, and encrypted using robust cryptographic mechanisms (e.g., TLS 1.3, IPsec VPN with FIPS-validated ciphers)?',
        reference: 'NIST SP 800-53 Rev. 5 §AC-17(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-77 Rev. 1'
      },
      {
        id: 'AC-17.2',
        text: 'Are privileged administrative commands executed over remote sessions strictly protected with phishing-resistant Multi-Factor Authentication (MFA)?',
        reference: 'NIST SP 800-53 Rev. 5 §AC-17(2)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-63B AAL3'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 4,
  },

  // ==========================================
  // 2. AWARENESS AND TRAINING (AT) - INFOSEC
  // ==========================================
  {
    controlId: 'AT-1',
    title: 'Policy and Procedures',
    family: 'AT',
    familyName: 'Awareness and Training',
    domain: 'Information Security',
    discussion: 'Establishes organization-wide security and privacy training policies and procedures aligned with applicable laws and regulatory directives.',
    relatedControls: ['PM-9', 'PS-8', 'SI-12'],
    controlEnhancements: [],
    assessmentQuestions: [
      {
        id: 'AT-1.1',
        text: 'Is an awareness and training policy developed, documented, and disseminated that aligns with regulatory standards and executive directives?',
        reference: 'NIST SP 800-53 Rev. 5 §AT-1',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.6.3'
      }
    ],
    defaultImpact: 3,
    defaultLikelihood: 2,
    isAssuranceRelated: true,
  },
  {
    controlId: 'AT-2',
    title: 'Literacy Training and Awareness',
    family: 'AT',
    familyName: 'Awareness and Training',
    domain: 'Information Security',
    discussion: 'Provides security and privacy literacy training to all system users during onboarding and periodically thereafter, incorporating simulated social engineering exercises.',
    relatedControls: ['AC-3', 'AT-3', 'AT-4', 'IR-2', 'PM-13', 'PT-2'],
    controlEnhancements: ['Practical Exercises', 'Insider Threat Indicators', 'Social Engineering / Phishing Simulation', 'Cyber Threat Literacy'],
    assessmentQuestions: [
      {
        id: 'AT-2.1',
        text: 'Is security and privacy literacy training provided to all system users upon onboarding and at least annually thereafter with verifiable completion records?',
        reference: 'NIST SP 800-53 Rev. 5 §AT-2',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST CSF 2.0 PR.AT-01'
      },
      {
        id: 'AT-2.2',
        text: 'Does training incorporate practical simulated phishing, social engineering drills, and reporting procedures for suspected security incidents?',
        reference: 'NIST SP 800-53 Rev. 5 §AT-2(2)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CIS Control 14.2'
      }
    ],
    defaultImpact: 3,
    defaultLikelihood: 4,
    isAssuranceRelated: true,
  },
  {
    controlId: 'AT-3',
    title: 'Role-based Training',
    family: 'AT',
    familyName: 'Awareness and Training',
    domain: 'Information Security',
    discussion: 'Provides tailored technical training for personnel with privileged, administrative, privacy, software development, or incident response roles.',
    relatedControls: ['AC-3', 'AT-2', 'IR-2', 'PM-13', 'PS-9', 'PT-3', 'SA-8'],
    controlEnhancements: ['Environmental Controls Training', 'Physical Security Controls', 'PII Processing Training'],
    assessmentQuestions: [
      {
        id: 'AT-3.1',
        text: 'Is specialized, role-based security and privacy training provided to personnel before authorizing privileged access or assigning operational duties?',
        reference: 'NIST SP 800-53 Rev. 5 §AT-3',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.6.3'
      }
    ],
    defaultImpact: 3,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },

  // ==========================================
  // 3. AUDIT AND ACCOUNTABILITY (AU) - CYBERSECURITY
  // ==========================================
  {
    controlId: 'AU-2',
    title: 'Event Logging',
    family: 'AU',
    familyName: 'Audit and Accountability',
    domain: 'Cybersecurity',
    discussion: 'Identifies and records significant security events such as authentication attempts, privileged actions, security policy modifications, and data access transactions.',
    relatedControls: ['AC-2', 'AC-6', 'AU-3', 'AU-6', 'AU-11', 'AU-12', 'SI-4'],
    controlEnhancements: ['Reviews and Updates', 'Privileged Event Audits'],
    assessmentQuestions: [
      {
        id: 'AU-2.1',
        text: 'Does the organization identify and configure systems to log all significant security, authentication, administrative, and data access events?',
        reference: 'NIST SP 800-53 Rev. 5 §AU-2(a)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-92 §3.1'
      },
      {
        id: 'AU-2.2',
        text: 'Is there documented rationale verifying that the selected logged event types are sufficient to support forensic investigations and regulatory audits?',
        reference: 'NIST SP 800-53 Rev. 5 §AU-2(d)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'PCI-DSS v4.0 Req 10.2'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
  },
  {
    controlId: 'AU-3',
    title: 'Content of Audit Records',
    family: 'AU',
    familyName: 'Audit and Accountability',
    domain: 'Cybersecurity',
    discussion: 'Ensures audit records contain event type, timestamp, location, source, outcome, and subject/user identity while limiting unnecessary PII leakage in audit trails.',
    relatedControls: ['AU-2', 'AU-8', 'AU-12', 'SI-7', 'SI-11'],
    controlEnhancements: ['Additional Audit Metadata', 'Limit PII in Audit Records'],
    assessmentQuestions: [
      {
        id: 'AU-3.1',
        text: 'Do generated audit records establish what event occurred, exact timestamp, location/system, source IP, outcome, and associated user/service identities?',
        reference: 'NIST SP 800-53 Rev. 5 §AU-3(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.8.15'
      },
      {
        id: 'AU-3.2',
        text: 'Are unnecessary sensitive personal identifiers (PII/passwords) minimized or masked in audit logs according to privacy guidelines?',
        reference: 'NIST SP 800-53 Rev. 5 §AU-3(3)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST Privacy Framework v1.0 §PR.PO-P1'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
  },
  {
    controlId: 'AU-6',
    title: 'Audit Record Review, Analysis, and Reporting',
    family: 'AU',
    familyName: 'Audit and Accountability',
    domain: 'Cybersecurity',
    discussion: 'Regularly reviews and correlates audit logs with SIEM tools to detect inappropriate or unusual activity, unauthorized access, and malicious behavior.',
    relatedControls: ['AC-2', 'AU-7', 'CA-7', 'IR-5', 'SI-4'],
    controlEnhancements: ['Automated Process Integration', 'Correlate Repositories', 'Central SIEM Analysis', 'Full Text Analysis of Privileged Commands'],
    assessmentQuestions: [
      {
        id: 'AU-6.1',
        text: 'Are system audit records regularly reviewed and analyzed for indications of anomalous activity, privilege escalation, and indicators of compromise?',
        reference: 'NIST SP 800-53 Rev. 5 §AU-6',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST CSF 2.0 DE.AE-02'
      },
      {
        id: 'AU-6.2',
        text: 'Are audit logs centrally aggregated into an enterprise SIEM with automated correlation rules and real-time alerting to the SOC?',
        reference: 'NIST SP 800-53 Rev. 5 §AU-6(3)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CIS Control 8.5'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 4,
    isAssuranceRelated: true,
  },
  {
    controlId: 'AU-11',
    title: 'Audit Record Retention',
    family: 'AU',
    familyName: 'Audit and Accountability',
    domain: 'Cybersecurity',
    discussion: 'Retains audit records for a defined retention period to support after-the-fact incident investigations and meet statutory requirements.',
    relatedControls: ['AU-4', 'AU-9', 'MP-6', 'SI-12'],
    controlEnhancements: ['Long-term Retrieval Capability'],
    assessmentQuestions: [
      {
        id: 'AU-11.1',
        text: 'Are audit records retained in tamper-proof / WORM storage for the required duration (e.g., minimum 1 to 5+ years) to support regulatory investigations?',
        reference: 'NIST SP 800-53 Rev. 5 §AU-11',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'SOC 2 CC7.2'
      }
    ],
    defaultImpact: 3,
    defaultLikelihood: 2,
  },

  // ==========================================
  // 4. ASSESSMENT, AUTHORIZATION, AND MONITORING (CA) - INFOSEC
  // ==========================================
  {
    controlId: 'CA-2',
    title: 'Control Assessments',
    family: 'CA',
    familyName: 'Assessment, Authorization, and Monitoring',
    domain: 'Information Security',
    discussion: 'Develops control assessment plans and conducts periodic technical testing of controls to determine effectiveness and identify deficiencies.',
    relatedControls: ['CA-5', 'CA-6', 'CA-7', 'RA-5', 'SA-11'],
    controlEnhancements: ['Independent Assessors', 'Specialized Assessments / Automated Testing', 'Leveraging External Results'],
    assessmentQuestions: [
      {
        id: 'CA-2.1',
        text: 'Is a formal control assessment plan developed describing scope, technical assessment procedures, and independent assessor roles?',
        reference: 'NIST SP 800-53 Rev. 5 §CA-2(a)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-53A Rev. 5'
      },
      {
        id: 'CA-2.2',
        text: 'Does the organization periodically assess system controls to verify they operate as intended and produce desired residual risk outcomes?',
        reference: 'NIST SP 800-53 Rev. 5 §CA-2(b)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.5.35'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },
  {
    controlId: 'CA-3',
    title: 'Information Exchange',
    family: 'CA',
    familyName: 'Assessment, Authorization, and Monitoring',
    domain: 'Information Security',
    discussion: 'Approves and manages data exchanges and interconnectivity agreements (ISAs, MOUs, SLAs) with external partner systems.',
    relatedControls: ['AC-4', 'AC-20', 'AU-16', 'CA-6', 'PT-7', 'SA-9', 'SC-7'],
    controlEnhancements: ['Transfer Authorizations', 'Transitive Information Exchanges'],
    assessmentQuestions: [
      {
        id: 'CA-3.1',
        text: 'Is information exchange between the system and external partner entities governed by formal Interconnection Security Agreements (ISAs/SLAs)?',
        reference: 'NIST SP 800-53 Rev. 5 §CA-3',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-47 Rev. 1'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
  },
  {
    controlId: 'CA-7',
    title: 'Continuous Monitoring',
    family: 'CA',
    familyName: 'Assessment, Authorization, and Monitoring',
    domain: 'Information Security',
    discussion: 'Implements continuous monitoring of metrics, security posture, and control effectiveness to support ongoing risk-informed management decisions.',
    relatedControls: ['AC-2', 'AU-6', 'CA-2', 'CA-5', 'CM-3', 'RA-5', 'SI-4'],
    controlEnhancements: ['Independent Assessment', 'Trend Analyses', 'Automated Monitoring Support'],
    assessmentQuestions: [
      {
        id: 'CA-7.1',
        text: 'Does the organization maintain an active continuous monitoring strategy with system-level metrics and defined assessment frequencies?',
        reference: 'NIST SP 800-53 Rev. 5 §CA-7(a)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-137 §3.2'
      },
      {
        id: 'CA-7.2',
        text: 'Are automated telemetry tools employed to track and report configuration drift and vulnerability posture in real-time?',
        reference: 'NIST SP 800-53 Rev. 5 §CA-7(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'FedRAMP Continuous Monitoring Strategy'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },

  // ==========================================
  // 5. CONFIGURATION MANAGEMENT (CM) - INFOSEC
  // ==========================================
  {
    controlId: 'CM-2',
    title: 'Baseline Configuration',
    family: 'CM',
    familyName: 'Configuration Management',
    domain: 'Information Security',
    discussion: 'Maintains documented baseline configurations of hardware, software, and network components under formal change control.',
    relatedControls: ['CM-3', 'CM-5', 'CM-6', 'CM-8', 'SA-10'],
    controlEnhancements: ['Automated Baseline Currency', 'Retention of Previous Configurations for Rollback', 'Separate Test Environments'],
    assessmentQuestions: [
      {
        id: 'CM-2.1',
        text: 'Does the organization develop, document, and maintain under configuration control a current baseline configuration of all systems and microservices?',
        reference: 'NIST SP 800-53 Rev. 5 §CM-2',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CIS Control 4.1'
      },
      {
        id: 'CM-2.2',
        text: 'Are baseline configurations reviewed, verified, and updated upon significant system upgrades, patches, or architectural modifications?',
        reference: 'NIST SP 800-53 Rev. 5 §CM-2(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.8.9'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },
  {
    controlId: 'CM-3',
    title: 'Configuration Change Control',
    family: 'CM',
    familyName: 'Configuration Management',
    domain: 'Information Security',
    discussion: 'Governs proposed system modifications through Change Advisory Boards (CAB), security/privacy impact analyses, and automated validation.',
    relatedControls: ['CA-7', 'CM-2', 'CM-4', 'CM-5', 'CM-6', 'SA-10', 'SI-2'],
    controlEnhancements: ['Automated Change Documentation & Approval', 'Pre-implementation Testing & Validation', 'Automated Security Response'],
    assessmentQuestions: [
      {
        id: 'CM-3.1',
        text: 'Are proposed changes reviewed and approved through a formal Change Advisory Board (CAB) with explicit security and privacy impact assessments?',
        reference: 'NIST SP 800-53 Rev. 5 §CM-3(a)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ITIL v4 Change Enablement'
      },
      {
        id: 'CM-3.2',
        text: 'Are configuration changes tested and validated in isolated staging environments with automated rollback scripts prior to production deployment?',
        reference: 'NIST SP 800-53 Rev. 5 §CM-3(2)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'SOC 2 CC8.1'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },
  {
    controlId: 'CM-6',
    title: 'Configuration Settings',
    family: 'CM',
    familyName: 'Configuration Management',
    domain: 'Information Security',
    discussion: 'Applies restrictive, hardened configuration benchmarks (e.g. CIS benchmarks, DISA STIGs) across servers, endpoints, databases, and network equipment.',
    relatedControls: ['AC-3', 'CM-2', 'CM-3', 'CM-7', 'RA-5', 'SI-2', 'SI-4'],
    controlEnhancements: ['Automated Management & Verification', 'Respond to Unauthorized Changes'],
    assessmentQuestions: [
      {
        id: 'CM-6.1',
        text: 'Are configuration settings established and implemented to reflect the most hardened mode consistent with operational needs (e.g., CIS Level 1/2 Benchmarks)?',
        reference: 'NIST SP 800-53 Rev. 5 §CM-6',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'DISA STIG Standards'
      },
      {
        id: 'CM-6.2',
        text: 'Are configuration deviations formally documented, risk-accepted by the CISO, and audited for unauthorized changes?',
        reference: 'NIST SP 800-53 Rev. 5 §CM-6(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.8.9'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 4,
  },
  {
    controlId: 'CM-8',
    title: 'System Component Inventory',
    family: 'CM',
    familyName: 'Configuration Management',
    domain: 'Information Security',
    discussion: 'Maintains an accurate, automated inventory of all hardware, software, cloud instances, and virtual machines without duplicate accounting.',
    relatedControls: ['CM-2', 'CM-7', 'CP-2', 'MA-2', 'PE-20', 'PM-5', 'RA-5'],
    controlEnhancements: ['Automated Inventory Maintenance', 'Automated Unauthorized Component Detection', 'Centralized Repository'],
    assessmentQuestions: [
      {
        id: 'CM-8.1',
        text: 'Is an inventory of system components maintained that accurately reflects all hardware, software, virtual instances, containers, and cloud assets?',
        reference: 'NIST SP 800-53 Rev. 5 §CM-8',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CIS Controls 1.1 & 2.1'
      },
      {
        id: 'CM-8.2',
        text: 'Are automated discovery mechanisms utilized to detect and isolate unauthorized or rogue components on the network?',
        reference: 'NIST SP 800-53 Rev. 5 §CM-8(2)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST CSF 2.0 ID.AM-01'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },

  // ==========================================
  // 6. CONTINGENCY PLANNING (CP) - INFOSEC
  // ==========================================
  {
    controlId: 'CP-2',
    title: 'Contingency Plan',
    family: 'CP',
    familyName: 'Contingency Planning',
    domain: 'Information Security',
    discussion: 'Develops Business Continuity and Disaster Recovery (BCDR) plans detailing recovery objectives (RTO, RPO), restoration priorities, and emergency operations.',
    relatedControls: ['CP-3', 'CP-4', 'CP-6', 'CP-7', 'CP-9', 'CP-10', 'IR-4', 'PM-8'],
    controlEnhancements: ['Capacity Planning', 'Resume Essential Functions within Defined RTO', 'Alternate Sites Coordination', 'Critical Assets Identification'],
    assessmentQuestions: [
      {
        id: 'CP-2.1',
        text: 'Does the contingency plan identify essential business functions, Recovery Time Objectives (RTO), and Recovery Point Objectives (RPO)?',
        reference: 'NIST SP 800-53 Rev. 5 §CP-2',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-34 Rev. 1 §3.2'
      },
      {
        id: 'CP-2.2',
        text: 'Are procedures established to maintain operational continuity during unexpected outages, ransomware attacks, or infrastructure disruptions?',
        reference: 'NIST SP 800-53 Rev. 5 §CP-2(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO 22301:2019 §8.4'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 3,
  },
  {
    controlId: 'CP-4',
    title: 'Contingency Plan Testing',
    family: 'CP',
    familyName: 'Contingency Planning',
    domain: 'Information Security',
    discussion: 'Tests contingency and disaster recovery plans periodically using tabletop exercises, parallel simulations, and full failover drills.',
    relatedControls: ['AT-3', 'CP-2', 'CP-3', 'CP-9', 'IR-3', 'PM-14'],
    controlEnhancements: ['Alternate Site Testing', 'Automated Testing', 'Full Recovery & Reconstitution', 'Self-challenge / Chaos Testing'],
    assessmentQuestions: [
      {
        id: 'CP-4.1',
        text: 'Is the contingency plan tested at least annually through tabletop simulations or technical disaster recovery failover drills?',
        reference: 'NIST SP 800-53 Rev. 5 §CP-4',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.5.30'
      },
      {
        id: 'CP-4.2',
        text: 'Are test results formally reviewed and followed up with documented remediation action items and recovery plan updates?',
        reference: 'NIST SP 800-53 Rev. 5 §CP-4(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'FFIEC BCP Booklet'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },
  {
    controlId: 'CP-9',
    title: 'System Backup',
    family: 'CP',
    familyName: 'Contingency Planning',
    domain: 'Information Security',
    discussion: 'Conducts regular backups of user data, system configurations, and documentation with encrypted, immutable (WORM/air-gapped) storage.',
    relatedControls: ['CP-2', 'CP-6', 'CP-10', 'MP-4', 'SC-12', 'SC-28', 'SI-13'],
    controlEnhancements: ['Testing Backup Integrity & Restoration', 'Separate Storage / Immutable Backups', 'Dual Authorization for Deletion', 'Cryptographic Protection'],
    assessmentQuestions: [
      {
        id: 'CP-9.1',
        text: 'Are regular automated backups of user data, databases, and system configurations performed consistent with organizational RTO and RPO targets?',
        reference: 'NIST SP 800-53 Rev. 5 §CP-9',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CIS Control 11.1'
      },
      {
        id: 'CP-9.2',
        text: 'Is backup media protected with strong encryption and stored in immutable, air-gapped repositories with dual-authorization deletion rules against ransomware?',
        reference: 'NIST SP 800-53 Rev. 5 §CP-9(2)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CISA Ransomware Guide 2023'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 3,
  },

  // ==========================================
  // 7. IDENTIFICATION AND AUTHENTICATION (IA) - CYBERSECURITY
  // ==========================================
  {
    controlId: 'IA-2',
    title: 'Identification and Authentication (Organizational Users)',
    family: 'IA',
    familyName: 'Identification and Authentication',
    domain: 'Cybersecurity',
    discussion: 'Uniquely identifies and authenticates organizational users and enforces Multi-Factor Authentication (MFA) across privileged and non-privileged access.',
    relatedControls: ['AC-2', 'AC-3', 'AC-17', 'IA-4', 'IA-5', 'IA-8', 'SC-23'],
    controlEnhancements: ['MFA for Privileged Accounts', 'MFA for Non-privileged Accounts', 'Separate Device Factor', 'Replay-Resistant Authentication', 'Single Sign-On'],
    assessmentQuestions: [
      {
        id: 'IA-2.1',
        text: 'Does the system uniquely identify and authenticate all organizational users before granting access to internal resources?',
        reference: 'NIST SP 800-53 Rev. 5 §IA-2',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-63B §4.1'
      },
      {
        id: 'IA-2.2',
        text: 'Is phishing-resistant Multi-Factor Authentication (MFA with FIDO2/WebAuthn) enforced for all privileged, administrative, and remote logins?',
        reference: 'NIST SP 800-53 Rev. 5 §IA-2(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'OMB M-22-09 Zero Trust Directive'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 4,
  },
  {
    controlId: 'IA-5',
    title: 'Authenticator Management',
    family: 'IA',
    familyName: 'Identification and Authentication',
    domain: 'Cybersecurity',
    discussion: 'Manages passwords, cryptographic certificates, hardware tokens, and biometrics with strict lifecycle procedures, key rotation, and salt hashing.',
    relatedControls: ['AC-3', 'CM-6', 'IA-2', 'IA-4', 'SC-12', 'SC-13', 'SC-28'],
    controlEnhancements: ['Password Strength & Complexity', 'PKI-Based Authentication', 'No Embedded Hardcoded Secrets', 'Password Managers'],
    assessmentQuestions: [
      {
        id: 'IA-5.1',
        text: 'Are default factory passwords and hardcoded API tokens strictly changed before initial deployment of any hardware or software component?',
        reference: 'NIST SP 800-53 Rev. 5 §IA-5',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'OWASP Top 10 A07:2021'
      },
      {
        id: 'IA-5.2',
        text: 'Are administrative procedures implemented for credential lifecycle management, secret rotation, and immediate revocation upon compromise?',
        reference: 'NIST SP 800-53 Rev. 5 §IA-5(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.5.17'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 4,
  },

  // ==========================================
  // 8. INCIDENT RESPONSE (IR) - CYBERSECURITY
  // ==========================================
  {
    controlId: 'IR-4',
    title: 'Incident Handling',
    family: 'IR',
    familyName: 'Incident Response',
    domain: 'Cybersecurity',
    discussion: 'Implements an incident response lifecycle covering preparation, detection, analysis, containment, eradication, and post-incident lessons learned.',
    relatedControls: ['AU-6', 'CP-2', 'IR-2', 'IR-5', 'IR-6', 'IR-8', 'SC-7', 'SI-4'],
    controlEnhancements: ['Automated Incident Handling', 'Dynamic Network Reconfiguration', 'Insider Threat Incident Handling', 'SOC Operations', 'Forensic Analysis'],
    assessmentQuestions: [
      {
        id: 'IR-4.1',
        text: 'Does the organization maintain a 24/7 incident handling capability covering threat detection, triage, dynamic network isolation, containment, and forensic analysis?',
        reference: 'NIST SP 800-53 Rev. 5 §IR-4',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-61 Rev. 2 §3.1'
      },
      {
        id: 'IR-4.2',
        text: 'Are post-incident root-cause analyses and lessons-learned systematically integrated into control configurations and staff training within 14 days?',
        reference: 'NIST SP 800-53 Rev. 5 §IR-4(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST CSF 2.0 RS.MA-01'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 4,
    isAssuranceRelated: true,
  },
  {
    controlId: 'IR-6',
    title: 'Incident Reporting',
    family: 'IR',
    familyName: 'Incident Response',
    domain: 'Cybersecurity',
    discussion: 'Requires personnel and automated systems to report suspected security incidents and privacy breaches to designated authorities within defined timeframes.',
    relatedControls: ['IR-4', 'IR-5', 'IR-8', 'PM-12', 'PT-2'],
    controlEnhancements: ['Automated Reporting Mechanisms', 'Vulnerability Reporting from Incidents', 'Supply Chain Incident Sharing'],
    assessmentQuestions: [
      {
        id: 'IR-6.1',
        text: 'Are personnel required to report suspected security incidents or data breaches to the SOC/Security team within defined timeframes (e.g., within 1 hour)?',
        reference: 'NIST SP 800-53 Rev. 5 §IR-6',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CIRCIA 72-Hour Reporting Mandate'
      },
      {
        id: 'IR-6.2',
        text: 'Are automated workflows configured to notify regulatory authorities, data protection commissioners, and impacted customers within statutory deadlines (e.g., GDPR 72 hrs)?',
        reference: 'NIST SP 800-53 Rev. 5 §IR-6(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'GDPR Art. 33 & SEC Cyber Rules'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
  },

  // ==========================================
  // 9. MAINTENANCE (MA) - INFOSEC
  // ==========================================
  {
    controlId: 'MA-2',
    title: 'Controlled Maintenance',
    family: 'MA',
    familyName: 'Maintenance',
    domain: 'Information Security',
    discussion: 'Schedules, documents, and approves on-site and remote maintenance while sanitizing equipment before off-site servicing.',
    relatedControls: ['CM-3', 'CM-8', 'MA-4', 'MP-6', 'PE-16', 'SR-3'],
    controlEnhancements: ['Automated Maintenance Tracking', 'Post-maintenance Control Verification'],
    assessmentQuestions: [
      {
        id: 'MA-2.1',
        text: 'Are all system maintenance and repair activities explicitly scheduled, approved, and recorded in maintenance audit logs?',
        reference: 'NIST SP 800-53 Rev. 5 §MA-2',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.8.14'
      },
      {
        id: 'MA-2.2',
        text: 'Is equipment sanitized of sensitive and PII data and verified before removal from organizational facilities for off-site vendor servicing?',
        reference: 'NIST SP 800-53 Rev. 5 §MA-2(2)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-88 Rev. 1'
      }
    ],
    defaultImpact: 3,
    defaultLikelihood: 2,
  },
  {
    controlId: 'MA-4',
    title: 'Nonlocal Maintenance',
    family: 'MA',
    familyName: 'Maintenance',
    domain: 'Information Security',
    discussion: 'Controls and authenticates nonlocal / remote diagnostic connections, enforcing strong encryption and immediate session termination upon completion.',
    relatedControls: ['AC-17', 'IA-2', 'MA-2', 'SC-7', 'SC-8', 'SC-10'],
    controlEnhancements: ['Logging and Review of Remote Sessions', 'Replay-Resistant Session Auth', 'Cryptographic Session Protection'],
    assessmentQuestions: [
      {
        id: 'MA-4.1',
        text: 'Is remote vendor maintenance permitted only with explicit time-bound approval, session recording, and strong cryptographic authentication?',
        reference: 'NIST SP 800-53 Rev. 5 §MA-4',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-161 SCRM §4.3'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
  },

  // ==========================================
  // 10. MEDIA PROTECTION (MP) - INFOSEC & PRIVACY
  // ==========================================
  {
    controlId: 'MP-4',
    title: 'Media Storage',
    family: 'MP',
    familyName: 'Media Protection',
    domain: 'Information Security',
    discussion: 'Physically controls and securely stores digital and non-digital media containing sensitive or PII data in locked containers or encrypted vaults.',
    relatedControls: ['AC-19', 'CP-9', 'MP-2', 'PE-3', 'SC-28'],
    controlEnhancements: ['Cryptographic Protection for Stored Media', 'Automated Restricted Storage Access'],
    assessmentQuestions: [
      {
        id: 'MP-4.1',
        text: 'Are physical and digital storage media containing sensitive data secured in controlled access areas or encrypted hardware vaults?',
        reference: 'NIST SP 800-53 Rev. 5 §MP-4',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.7.10'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 2,
  },
  {
    controlId: 'MP-6',
    title: 'Media Sanitization',
    family: 'MP',
    familyName: 'Media Protection',
    domain: 'Information Security',
    discussion: 'Sanitizes digital media (crypto-erase, degauss, purge, shred) prior to disposal or reuse in accordance with NIST SP 800-88 guidelines.',
    relatedControls: ['MA-2', 'MP-2', 'PM-22', 'SI-12', 'SR-12'],
    controlEnhancements: ['Track & Verify Sanitization Records', 'Equipment Testing', 'Dual Authorization for Sanitization'],
    assessmentQuestions: [
      {
        id: 'MP-6.1',
        text: 'Does the organization sanitize digital media prior to disposal or release for reuse using approved NIST SP 800-88 Rev. 1 Clear, Purge, or Destroy techniques?',
        reference: 'NIST SP 800-53 Rev. 5 §MP-6',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-88 Rev. 1 §4.3'
      },
      {
        id: 'MP-6.2',
        text: 'Are formal Certificates of Destruction and cryptographic erasure validation logs retained for all decommissioned storage drives and virtual volumes?',
        reference: 'NIST SP 800-53 Rev. 5 §MP-6(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'GDPR Art. 17 (Right to Erasure)'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },

  // ==========================================
  // 11. PHYSICAL AND ENVIRONMENTAL PROTECTION (PE) - INFOSEC
  // ==========================================
  {
    controlId: 'PE-3',
    title: 'Physical Access Control',
    family: 'PE',
    familyName: 'Physical and Environmental Protection',
    domain: 'Information Security',
    discussion: 'Enforces physical access security at facility perimeters, server rooms, and data centers using badges, biometric readers, locks, and continuous surveillance.',
    relatedControls: ['AC-3', 'AU-2', 'PE-2', 'PE-6', 'PE-8', 'PS-3'],
    controlEnhancements: ['Server Room Sub-perimeter Access', 'Continuous Guards', 'Anti-Tamper Protections', 'Access Control Vestibules / Mantraps'],
    assessmentQuestions: [
      {
        id: 'PE-3.1',
        text: 'Are physical access authorizations enforced at all entry and exit points to facilities and server rooms using electronic keycard/biometric systems?',
        reference: 'NIST SP 800-53 Rev. 5 §PE-3',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.7.2'
      },
      {
        id: 'PE-3.2',
        text: 'Are visitor logs maintained and physical access badge permissions reviewed and audited quarterly?',
        reference: 'NIST SP 800-53 Rev. 5 §PE-3(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'SOC 2 CC6.4'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 2,
  },
  {
    controlId: 'PE-6',
    title: 'Monitoring Physical Access',
    family: 'PE',
    familyName: 'Physical and Environmental Protection',
    domain: 'Information Security',
    discussion: 'Monitors facility physical access using CCTV surveillance, motion detectors, and alarm systems correlated with incident response.',
    relatedControls: ['AU-2', 'AU-6', 'CA-7', 'IR-4', 'PE-3'],
    controlEnhancements: ['Intrusion Alarms', 'Automated Intrusion Response', 'Video Surveillance Retention (e.g. 90+ days)'],
    assessmentQuestions: [
      {
        id: 'PE-6.1',
        text: 'Are sensitive physical spaces and data center ingress points monitored 24/7 with CCTV video surveillance recorded and retained for at least 90 days?',
        reference: 'NIST SP 800-53 Rev. 5 §PE-6',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'PCI-DSS v4.0 Req 9.2'
      }
    ],
    defaultImpact: 3,
    defaultLikelihood: 2,
    isAssuranceRelated: true,
  },

  // ==========================================
  // 12. PLANNING (PL) - GOVERNANCE
  // ==========================================
  {
    controlId: 'PL-2',
    title: 'System Security and Privacy Plans',
    family: 'PL',
    familyName: 'Planning',
    domain: 'Governance',
    discussion: 'Develops and maintains a comprehensive System Security and Privacy Plan (SSPP) detailing architecture, boundaries, categorized data types, and tailored NIST controls.',
    relatedControls: ['CA-2', 'CA-3', 'PL-8', 'PL-10', 'PM-1', 'PM-9', 'RA-3', 'SA-8'],
    controlEnhancements: ['Concept of Operations', 'Functional Architecture Synchronization'],
    assessmentQuestions: [
      {
        id: 'PL-2.1',
        text: 'Has the organization developed and maintained an up-to-date System Security and Privacy Plan (SSPP) covering system boundaries and control baselines?',
        reference: 'NIST SP 800-53 Rev. 5 §PL-2',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-18 Rev. 1'
      },
      {
        id: 'PL-2.2',
        text: 'Is the SSPP approved by the Authorizing Official (AO) / CISO prior to production deployment and reviewed upon major changes?',
        reference: 'NIST SP 800-53 Rev. 5 §PL-2(a)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'FedRAMP SSP Guidelines'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 2,
    isAssuranceRelated: true,
  },
  {
    controlId: 'PL-8',
    title: 'Security and Privacy Architectures',
    family: 'PL',
    familyName: 'Planning',
    domain: 'Governance',
    discussion: 'Establishes enterprise security and privacy architectures incorporating defense-in-depth, zero trust boundaries, and supplier diversity.',
    relatedControls: ['PM-7', 'RA-9', 'SA-8', 'SA-17', 'SC-7'],
    controlEnhancements: ['Defense-in-Depth Layering', 'Supplier Diversity'],
    assessmentQuestions: [
      {
        id: 'PL-8.1',
        text: 'Are security and privacy architectures integrated with the enterprise architecture using defense-in-depth and Zero Trust principles?',
        reference: 'NIST SP 800-53 Rev. 5 §PL-8',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-207 Zero Trust'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 2,
  },

  // ==========================================
  // 13. PROGRAM MANAGEMENT (PM) - GOVERNANCE & PRIVACY
  // ==========================================
  {
    controlId: 'PM-9',
    title: 'Risk Management Strategy',
    family: 'PM',
    familyName: 'Program Management',
    domain: 'Governance',
    discussion: 'Establishes an organization-wide risk management strategy defining risk appetite, tolerance thresholds, quantitative scoring metrics, and continuous monitoring.',
    relatedControls: ['CA-6', 'CA-7', 'PM-1', 'PM-18', 'PM-28', 'RA-3'],
    controlEnhancements: [],
    assessmentQuestions: [
      {
        id: 'PM-9.1',
        text: 'Does the organization maintain a formal risk management strategy defining risk tolerance, quantitative thresholds (Inherent/Residual Risk), and mitigation criteria?',
        reference: 'NIST SP 800-53 Rev. 5 §PM-9',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-37 Rev. 2 (RMF)'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 2,
    isAssuranceRelated: true,
  },
  {
    controlId: 'PM-18',
    title: 'Privacy Program Plan',
    family: 'PM',
    familyName: 'Program Management',
    domain: 'Privacy',
    discussion: 'Develops and disseminates an organization-wide privacy program plan led by the Senior Agency Official for Privacy (SAOP) / Chief Privacy Officer.',
    relatedControls: ['PM-9', 'PM-19', 'PM-20', 'PM-22', 'PT-1'],
    controlEnhancements: [],
    assessmentQuestions: [
      {
        id: 'PM-18.1',
        text: 'Is there an established privacy program plan with dedicated resources, governance oversight, and defined executive accountability (DPO/CPO)?',
        reference: 'NIST SP 800-53 Rev. 5 §PM-18',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST Privacy Framework v1.0 §ID.GV-P1'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 2,
    isAssuranceRelated: true,
  },

  // ==========================================
  // 14. PERSONNEL SECURITY (PS) - INFOSEC
  // ==========================================
  {
    controlId: 'PS-3',
    title: 'Personnel Screening',
    family: 'PS',
    familyName: 'Personnel Security',
    domain: 'Information Security',
    discussion: 'Performs pre-employment background screening and periodic rescreening for all personnel accessing critical systems, proprietary data, or PII.',
    relatedControls: ['AC-2', 'IA-4', 'PE-2', 'PM-12', 'PS-2', 'PS-6', 'PS-7'],
    controlEnhancements: ['Classified / Special Protection Screening', 'Formal Indoctrination'],
    assessmentQuestions: [
      {
        id: 'PS-3.1',
        text: 'Are formal background screening checks performed on all employees and contractors prior to authorizing access to production systems and sensitive data?',
        reference: 'NIST SP 800-53 Rev. 5 §PS-3',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.6.1'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
  },
  {
    controlId: 'PS-4',
    title: 'Personnel Termination',
    family: 'PS',
    familyName: 'Personnel Security',
    domain: 'Information Security',
    discussion: 'Disables system access immediately upon employee departure, revokes all credentials, retrieves physical assets, and conducts security exit interviews.',
    relatedControls: ['AC-2', 'IA-4', 'PE-2', 'PM-12', 'PS-5', 'PS-6'],
    controlEnhancements: ['Post-employment Binding Requirements', 'Automated Deprovisioning Actions'],
    assessmentQuestions: [
      {
        id: 'PS-4.1',
        text: 'Are logical access privileges revoked and active SSO sessions terminated immediately (or within 2 hours) upon employee termination or reassignment?',
        reference: 'NIST SP 800-53 Rev. 5 §PS-4',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.6.2'
      },
      {
        id: 'PS-4.2',
        text: 'Are all corporate hardware, cryptographic tokens, and facility access badges retrieved and accounted for during the offboarding checklist?',
        reference: 'NIST SP 800-53 Rev. 5 §PS-4(a)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CIS Control 5.3'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 3,
  },

  // ==========================================
  // 15. PII PROCESSING AND TRANSPARENCY (PT) - PRIVACY
  // ==========================================
  {
    controlId: 'PT-1',
    title: 'Privacy Policy and Procedures',
    family: 'PT',
    familyName: 'PII Processing and Transparency',
    domain: 'Privacy',
    discussion: 'Develops, documents, and disseminates an organization-wide privacy policy addressing purpose, scope, roles, responsibilities, and legal compliance.',
    relatedControls: ['PM-9', 'PM-18', 'PT-2', 'PT-3', 'PT-5', 'RA-8'],
    controlEnhancements: [],
    assessmentQuestions: [
      {
        id: 'PT-1.1',
        text: 'Does the organization develop, document, and disseminate a formal privacy policy governing all PII collection, storage, processing, and disclosure?',
        reference: 'NIST SP 800-53 Rev. 5 §PT-1',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST Privacy Framework v1.0 §ID.GV-P1'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 2,
    isAssuranceRelated: true,
  },
  {
    controlId: 'PT-2',
    title: 'Authority to Process Personally Identifiable Information',
    family: 'PT',
    familyName: 'PII Processing and Transparency',
    domain: 'Privacy',
    discussion: 'Determines and documents the legal authority permitting the processing of PII, restricting data operations to authorized purposes.',
    relatedControls: ['AC-3', 'CM-13', 'PM-9', 'PM-24', 'PT-3', 'PT-5', 'RA-8', 'SI-18'],
    controlEnhancements: ['Data Tagging for Authorized Processing', 'Automated Enforcement of Processing Authority'],
    assessmentQuestions: [
      {
        id: 'PT-2.1',
        text: 'Has the organization determined and documented the lawful basis (e.g. statutory authority, consent, legitimate interest) for processing each PII data element?',
        reference: 'NIST SP 800-53 Rev. 5 §PT-2',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST Privacy Framework v1.0 §CT.PO-P1 / GDPR Art. 6'
      },
      {
        id: 'PT-2.2',
        text: 'Is PII processing restricted solely to authorized operational activities using automated data lineage tagging and policy enforcement filters?',
        reference: 'NIST SP 800-53 Rev. 5 §PT-2(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27701:2019 §6.3.2'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },
  {
    controlId: 'PT-3',
    title: 'Personally Identifiable Information Processing Purposes',
    family: 'PT',
    familyName: 'PII Processing and Transparency',
    domain: 'Privacy',
    discussion: 'Identifies, documents, and publicly discloses the explicit purpose for processing PII and monitors changes in processing activities.',
    relatedControls: ['AC-3', 'AT-3', 'CM-13', 'PM-25', 'PT-2', 'PT-5', 'PT-7', 'RA-8'],
    controlEnhancements: ['Data Tagging for Processing Purposes', 'Automated Purpose Tracking'],
    assessmentQuestions: [
      {
        id: 'PT-3.1',
        text: 'Are specific PII processing purposes documented in public privacy notices and explicitly communicated to data subjects at or before collection?',
        reference: 'NIST SP 800-53 Rev. 5 §PT-3',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST Privacy Framework v1.0 §CT.PO-P2 / GDPR Art. 5(1)(b)'
      },
      {
        id: 'PT-3.2',
        text: 'Are downstream modifications to data processing operations monitored to ensure strict compatibility with original collection purposes?',
        reference: 'NIST SP 800-53 Rev. 5 §PT-3(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CCPA §1798.100(a)'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 3,
  },
  {
    controlId: 'PT-4',
    title: 'Consent',
    family: 'PT',
    familyName: 'PII Processing and Transparency',
    domain: 'Privacy',
    discussion: 'Implements tools and mechanisms for data subjects to provide informed opt-in/opt-out consent and revoke consent dynamically.',
    relatedControls: ['AC-16', 'PT-2', 'PT-5'],
    controlEnhancements: ['Tailored Consent Granularity', 'Just-In-Time Consent', 'Consent Revocation Mechanisms'],
    assessmentQuestions: [
      {
        id: 'PT-4.1',
        text: 'Are explicit, informed, and unbundled consent mechanisms provided to individuals prior to collecting or processing sensitive personal data?',
        reference: 'NIST SP 800-53 Rev. 5 §PT-4',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST Privacy Framework v1.0 §CT.PO-P3 / GDPR Art. 7'
      },
      {
        id: 'PT-4.2',
        text: 'Can data subjects easily manage granular consent preferences and revoke prior consent at any time, with revocations propagating across all datastores?',
        reference: 'NIST SP 800-53 Rev. 5 §PT-4(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CCPA §1798.120 (Opt-Out of Sale/Share)'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
  },
  {
    controlId: 'PT-5',
    title: 'Privacy Notice',
    family: 'PT',
    familyName: 'PII Processing and Transparency',
    domain: 'Privacy',
    discussion: 'Provides plain-language, clear privacy notices upon first interaction and at points of data collection, detailing authority, purposes, and sharing.',
    relatedControls: ['PM-20', 'PM-22', 'PT-2', 'PT-3', 'PT-4', 'RA-8'],
    controlEnhancements: ['Just-In-Time Notice', 'Privacy Act Statements'],
    assessmentQuestions: [
      {
        id: 'PT-5.1',
        text: 'Is a comprehensive, plain-language privacy notice presented to users upon initial interaction and at all data capture interfaces?',
        reference: 'NIST SP 800-53 Rev. 5 §PT-5',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST Privacy Framework v1.0 §CT.PO-P4 / GDPR Art. 13-14'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 2,
    isAssuranceRelated: true,
  },
  {
    controlId: 'PT-7',
    title: 'Specific Categories of Personally Identifiable Information',
    family: 'PT',
    familyName: 'PII Processing and Transparency',
    domain: 'Privacy',
    discussion: 'Applies stringent safeguards for sensitive PII categories such as SSNs, biometric markers, health data, financial records, and minors data.',
    relatedControls: ['IA-4', 'IR-9', 'PT-2', 'PT-3', 'RA-3'],
    controlEnhancements: ['Elimination of Unnecessary SSN Collection', 'First Amendment Protections'],
    assessmentQuestions: [
      {
        id: 'PT-7.1',
        text: 'Are special minimization rules and enhanced cryptographic protections enforced for sensitive PII categories (e.g. SSN, biometrics, health/PHI, children data)?',
        reference: 'NIST SP 800-53 Rev. 5 §PT-7',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'GDPR Art. 9 (Special Categories) & COPPA'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 3,
  },

  // ==========================================
  // 16. RISK ASSESSMENT (RA) - CYBERSECURITY & PRIVACY
  // ==========================================
  {
    controlId: 'RA-3',
    title: 'Risk Assessment',
    family: 'RA',
    familyName: 'Risk Assessment',
    domain: 'Cybersecurity',
    discussion: 'Conducts quantitative and qualitative risk assessments identifying threats, vulnerabilities, likelihood, impact, and adverse privacy effects.',
    relatedControls: ['CA-3', 'CA-6', 'CM-4', 'PM-9', 'PM-28', 'RA-2', 'RA-5', 'RA-7'],
    controlEnhancements: ['Supply Chain Risk Assessment', 'All-Source Threat Intelligence', 'Dynamic Threat Modeling', 'Predictive Cyber Analytics'],
    assessmentQuestions: [
      {
        id: 'RA-3.1',
        text: 'Does the organization conduct comprehensive risk assessments evaluating inherent risk (Impact x Likelihood), control effectiveness (CEF), and residual risk?',
        reference: 'NIST SP 800-53 Rev. 5 §RA-3',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-30 Rev. 1 §3.2'
      },
      {
        id: 'RA-3.2',
        text: 'Are quantitative risk assessment findings reviewed by risk committees and updated at least annually or upon major architectural alterations?',
        reference: 'NIST SP 800-53 Rev. 5 §RA-3(1)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.5.8'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },
  {
    controlId: 'RA-5',
    title: 'Vulnerability Monitoring and Scanning',
    family: 'RA',
    familyName: 'Risk Assessment',
    domain: 'Cybersecurity',
    discussion: 'Continuously monitors and scans applications, OS, containers, and network infrastructure using SCAP/CVE tools, enforcing remediation SLAs.',
    relatedControls: ['CA-2', 'CA-7', 'CM-6', 'CM-8', 'RA-3', 'SA-11', 'SI-2', 'SI-4'],
    controlEnhancements: ['Automated Scanning Feeds', 'Breadth and Depth Coverage', 'Automated Trend Analysis', 'Public Vulnerability Disclosure'],
    assessmentQuestions: [
      {
        id: 'RA-5.1',
        text: 'Are automated vulnerability scans executed on operating systems, containers, web applications, and network infrastructure at least weekly?',
        reference: 'NIST SP 800-53 Rev. 5 §RA-5',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST CSF 2.0 DE.CM-08 / CIS Control 7.1'
      },
      {
        id: 'RA-5.2',
        text: 'Are critical and high severity vulnerabilities remediated within strict organizational SLAs (e.g., Critical within 14 days, High within 30 days)?',
        reference: 'NIST SP 800-53 Rev. 5 §RA-5(2)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CISA Binding Operational Directive BOD 22-01'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 4,
    isAssuranceRelated: true,
  },
  {
    controlId: 'RA-8',
    title: 'Privacy Impact Assessments',
    family: 'RA',
    familyName: 'Risk Assessment',
    domain: 'Privacy',
    discussion: 'Conducts formal Privacy Impact Assessments (PIAs) before developing or procuring information technology that processes PII.',
    relatedControls: ['CM-4', 'CM-13', 'PT-2', 'PT-3', 'PT-5', 'RA-1', 'RA-3'],
    controlEnhancements: [],
    assessmentQuestions: [
      {
        id: 'RA-8.1',
        text: 'Is a formal Privacy Impact Assessment (PIA / DPIA) conducted, documented, and approved prior to deploying systems that process personally identifiable data?',
        reference: 'NIST SP 800-53 Rev. 5 §RA-8',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST Privacy Framework v1.0 §ID.RA-P1 / GDPR Art. 35'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },

  // ==========================================
  // 17. SYSTEM AND SERVICES ACQUISITION (SA) - INFOSEC
  // ==========================================
  {
    controlId: 'SA-8',
    title: 'Security and Privacy Engineering Principles',
    family: 'SA',
    familyName: 'System and Services Acquisition',
    domain: 'Information Security',
    discussion: 'Applies systems security engineering design principles including clear abstractions, least common mechanism, modularity, layered defenses, and minimization.',
    relatedControls: ['PL-8', 'PM-7', 'RA-3', 'SA-3', 'SA-4', 'SA-17', 'SC-2', 'SC-3'],
    controlEnhancements: ['Clear Abstractions', 'Modularity and Layering', 'Minimized Sharing', 'Reduced Complexity', 'Secure Defaults', 'Continuous Protection'],
    assessmentQuestions: [
      {
        id: 'SA-8.1',
        text: 'Are foundational security and privacy engineering principles (defense-in-depth, least privilege, data minimization, secure defaults) incorporated into system architecture?',
        reference: 'NIST SP 800-53 Rev. 5 §SA-8',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-160 Vol. 1 §3.1'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },
  {
    controlId: 'SA-11',
    title: 'Developer Testing and Evaluation',
    family: 'SA',
    familyName: 'System and Services Acquisition',
    domain: 'Information Security',
    discussion: 'Requires developers to perform static code analysis (SAST), dynamic analysis (DAST), penetration testing, and verifiable flaw remediation in CI/CD.',
    relatedControls: ['CA-2', 'CA-8', 'CM-4', 'RA-5', 'SA-3', 'SA-4', 'SA-15', 'SI-2'],
    controlEnhancements: ['Static Code Analysis', 'Threat Modeling', 'Independent Verification', 'Interactive Application Security Testing (IAST)'],
    assessmentQuestions: [
      {
        id: 'SA-11.1',
        text: 'Are automated SAST/DAST vulnerability scans, secret leak detection, and third-party penetration testing mandated in CI/CD pipelines before production release?',
        reference: 'NIST SP 800-53 Rev. 5 §SA-11',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'OWASP SAMM v2.0 & SSDF (SP 800-218)'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 4,
    isAssuranceRelated: true,
  },

  // ==========================================
  // 18. SYSTEM AND COMMUNICATIONS PROTECTION (SC) - CYBERSECURITY
  // ==========================================
  {
    controlId: 'SC-7',
    title: 'Boundary Protection',
    family: 'SC',
    familyName: 'System and Communications Protection',
    domain: 'Cybersecurity',
    discussion: 'Monitors and controls communications at external and internal managed interfaces using next-gen firewalls, DMZs, proxy filters, and zero-trust segmentation.',
    relatedControls: ['AC-4', 'AC-17', 'CA-3', 'CM-7', 'CP-8', 'IR-4', 'PL-8', 'SC-5', 'SI-4'],
    controlEnhancements: ['Access Points Limitation', 'Deny by Default / Allow by Exception', 'Prevent Split Tunneling', 'Prevent Data Exfiltration', 'Host-based Protection'],
    assessmentQuestions: [
      {
        id: 'SC-7.1',
        text: 'Are managed boundary protection devices (firewalls, WAFs, API gateways) configured to enforce deny-all-by-default traffic rules at ingress and egress points?',
        reference: 'NIST SP 800-53 Rev. 5 §SC-7(a)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST CSF 2.0 PR.PS-01'
      },
      {
        id: 'SC-7.2',
        text: 'Are internal networks micro-segmented into isolated trust zones (Zero Trust architecture) to prevent lateral adversary movement?',
        reference: 'NIST SP 800-53 Rev. 5 §SC-7(21)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-207 Zero Trust §3.1'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 4,
  },
  {
    controlId: 'SC-8',
    title: 'Transmission Confidentiality and Integrity',
    family: 'SC',
    familyName: 'System and Communications Protection',
    domain: 'Cybersecurity',
    discussion: 'Protects the confidentiality and integrity of transmitted data using end-to-end encryption protocols (TLS 1.3, IPsec, SSHv2, HTTPS).',
    relatedControls: ['AC-17', 'AU-10', 'IA-3', 'MA-4', 'SC-12', 'SC-13', 'SC-28'],
    controlEnhancements: ['Cryptographic Protection (TLS/IPsec)', 'Pre- and Post-Transmission Handling', 'Conceal Communication Patterns'],
    assessmentQuestions: [
      {
        id: 'SC-8.1',
        text: 'Is all sensitive operational data and PII encrypted in transit over external and internal networks using industry-standard protocols (e.g. TLS 1.3 with AES-256-GCM)?',
        reference: 'NIST SP 800-53 Rev. 5 §SC-8',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-52 Rev. 2 & PCI-DSS Req 4.1'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 4,
  },
  {
    controlId: 'SC-12',
    title: 'Cryptographic Key Establishment and Management',
    family: 'SC',
    familyName: 'System and Communications Protection',
    domain: 'Cybersecurity',
    discussion: 'Establishes and manages cryptographic keys throughout their lifecycle (generation, distribution, storage in HSM/KMS, access, and destruction).',
    relatedControls: ['AC-17', 'CM-3', 'IA-7', 'SC-8', 'SC-13', 'SC-28'],
    controlEnhancements: ['Key Availability / Escrow', 'FIPS-Validated Symmetric Keys', 'Hardware Security Modules (HSM)'],
    assessmentQuestions: [
      {
        id: 'SC-12.1',
        text: 'Are cryptographic keys generated, stored in dedicated FIPS 140-3 Hardware Security Modules (HSM/KMS), and rotated automatically at least annually?',
        reference: 'NIST SP 800-53 Rev. 5 §SC-12',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-57 Part 1 Rev. 5'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 3,
  },
  {
    controlId: 'SC-28',
    title: 'Protection of Information at Rest',
    family: 'SC',
    familyName: 'System and Communications Protection',
    domain: 'Cybersecurity',
    discussion: 'Protects the confidentiality and integrity of data at rest across disk volumes, databases, object stores, and backups using AES-256 encryption.',
    relatedControls: ['AC-3', 'CP-9', 'MP-4', 'PE-3', 'SC-8', 'SC-12', 'SC-13', 'SI-7'],
    controlEnhancements: ['Cryptographic Protection (AES-256)', 'Secure Offline Storage', 'Hardware-Protected TPM Key Store'],
    assessmentQuestions: [
      {
        id: 'SC-28.1',
        text: 'Is sensitive data, customer PII, and database storage encrypted at rest across all disks, database tables, and object stores using AES-256 encryption?',
        reference: 'NIST SP 800-53 Rev. 5 §SC-28',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'FIPS 197 & HIPAA §164.312(a)(2)(iv)'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 4,
  },

  // ==========================================
  // 19. SYSTEM AND INFORMATION INTEGRITY (SI) - CYBERSECURITY & PRIVACY
  // ==========================================
  {
    controlId: 'SI-2',
    title: 'Flaw Remediation',
    family: 'SI',
    familyName: 'System and Information Integrity',
    domain: 'Cybersecurity',
    discussion: 'Identifies, tests, and installs security patches, firmware updates, and hotfixes within defined timeframes to eliminate known vulnerabilities.',
    relatedControls: ['CA-5', 'CM-3', 'CM-6', 'RA-5', 'SA-10', 'SI-3', 'SI-7'],
    controlEnhancements: ['Automated Patch Management Tools', 'Automated Flaw Status Verification', 'Time-to-Remediate Benchmarks'],
    assessmentQuestions: [
      {
        id: 'SI-2.1',
        text: 'Does the organization maintain an automated patch management pipeline to test and apply security updates across all servers and endpoints?',
        reference: 'NIST SP 800-53 Rev. 5 §SI-2',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-40 Rev. 4 §2.1'
      },
      {
        id: 'SI-2.2',
        text: 'Are security patches for actively exploited zero-day vulnerabilities deployed within emergency organizational benchmarks (e.g. 72 hours)?',
        reference: 'NIST SP 800-53 Rev. 5 §SI-2(2)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CISA Known Exploited Vulnerabilities (KEV)'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 4,
    isAssuranceRelated: true,
  },
  {
    controlId: 'SI-3',
    title: 'Malicious Code Protection',
    family: 'SI',
    familyName: 'System and Information Integrity',
    domain: 'Cybersecurity',
    discussion: 'Deploys endpoint detection and response (EDR), anti-malware signatures, and heuristic/AI protections at entry/exit points and server hosts.',
    relatedControls: ['AC-4', 'CM-8', 'IR-4', 'RA-5', 'SC-7', 'SC-44', 'SI-4', 'SI-7'],
    controlEnhancements: ['Central Management', 'Automatic Signature Updates', 'Heuristic / AI-based Detection', 'Real-time File Scanning'],
    assessmentQuestions: [
      {
        id: 'SI-3.1',
        text: 'Are next-generation Endpoint Detection & Response (EDR) and anti-malware protections deployed on all endpoints, gateways, and cloud workloads with continuous telemetry?',
        reference: 'NIST SP 800-53 Rev. 5 §SI-3',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'CIS Control 10.1 & NIST CSF 2.0 PR.DS-01'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 4,
  },
  {
    controlId: 'SI-4',
    title: 'System Monitoring',
    family: 'SI',
    familyName: 'System and Information Integrity',
    domain: 'Cybersecurity',
    discussion: 'Continuously monitors system and network traffic to detect intrusions, anomalous behaviors, unauthorized connections, and indicators of compromise (IOCs).',
    relatedControls: ['AC-2', 'AU-2', 'AU-6', 'CA-7', 'IR-4', 'RA-10', 'SC-7', 'SI-3', 'SI-7'],
    controlEnhancements: ['System-wide Intrusion Detection (IDS/IPS)', 'Automated Real-Time SIEM Analysis', 'Inbound & Outbound Traffic Inspection', 'Automated Threat Alerts'],
    assessmentQuestions: [
      {
        id: 'SI-4.1',
        text: 'Does the organization monitor internal and perimeter network traffic 24/7 with Intrusion Detection/Prevention Systems (IDS/IPS) to detect malicious activities?',
        reference: 'NIST SP 800-53 Rev. 5 §SI-4',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-94 Rev. 1'
      },
      {
        id: 'SI-4.2',
        text: 'Are real-time threat intelligence feeds and IOC matches automatically correlated and dispatched as high-priority alerts to the SOC?',
        reference: 'NIST SP 800-53 Rev. 5 §SI-4(12)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST CSF 2.0 DE.CM-01'
      }
    ],
    defaultImpact: 5,
    defaultLikelihood: 4,
    isAssuranceRelated: true,
  },
  {
    controlId: 'SI-10',
    title: 'Information Input Validation',
    family: 'SI',
    familyName: 'System and Information Integrity',
    domain: 'Cybersecurity',
    discussion: 'Checks the valid syntax and semantics of system inputs to prevent injection attacks (SQLi, XSS, Command Injection) and buffer overflows.',
    relatedControls: ['AC-3', 'SA-8', 'SI-11'],
    controlEnhancements: ['Manual Override Auditing', 'Predictable Error Handling', 'Injection Prevention & Parameterized Interfaces'],
    assessmentQuestions: [
      {
        id: 'SI-10.1',
        text: 'Are all user, API, and external inputs syntactically and semantically validated against strict positive schemas (allow-lists) and parameterized queries?',
        reference: 'NIST SP 800-53 Rev. 5 §SI-10',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'OWASP Top 10 A03:2021 (Injection)'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 4,
  },
  {
    controlId: 'SI-12',
    title: 'Information Management and Retention',
    family: 'SI',
    familyName: 'System and Information Integrity',
    domain: 'Information Security',
    discussion: 'Manages and retains organizational information and logs in accordance with statutory retention schedules, disposing of data securely when expired.',
    relatedControls: ['AU-11', 'MP-6', 'PM-22', 'PT-2', 'RA-3'],
    controlEnhancements: ['Limit PII Elements in Lifecycle', 'Automated Data Disposal Following Retention'],
    assessmentQuestions: [
      {
        id: 'SI-12.1',
        text: 'Is organizational data and PII retained strictly according to documented retention schedules and disposed of permanently upon expiration?',
        reference: 'NIST SP 800-53 Rev. 5 §SI-12',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.8.10'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },
  {
    controlId: 'SI-18',
    title: 'Personally Identifiable Information Quality Operations',
    family: 'SI',
    familyName: 'System and Information Integrity',
    domain: 'Privacy',
    discussion: 'Monitors the accuracy, relevance, and completeness of PII throughout the data lifecycle, supporting data subject correction/deletion requests.',
    relatedControls: ['PM-22', 'PM-24', 'PT-2', 'SI-4'],
    controlEnhancements: ['Automated PII Normalization', 'Data Tags for Quality Tracking', 'Individual Correction Request Workflow'],
    assessmentQuestions: [
      {
        id: 'SI-18.1',
        text: 'Are automated operations in place to verify PII accuracy, maintain data lineage, and process individual data correction and erasure requests within 30 days?',
        reference: 'NIST SP 800-53 Rev. 5 §SI-18',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST Privacy Framework v1.0 §CT.DM-P3 / GDPR Art. 16'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },
  {
    controlId: 'SI-19',
    title: 'De-identification',
    family: 'SI',
    familyName: 'System and Information Integrity',
    domain: 'Privacy',
    discussion: 'Applies pseudonymization, masking, differential privacy, and statistical disclosure controls to datasets before analytics or external sharing.',
    relatedControls: ['MP-6', 'PM-23', 'PT-2', 'RA-2', 'SI-12'],
    controlEnhancements: ['Direct Identifier Masking / Hashing', 'Differential Privacy', 'Validated De-identification Algorithms', 'Motivated Intruder Testing'],
    assessmentQuestions: [
      {
        id: 'SI-19.1',
        text: 'Are direct identifiers removed, pseudonymized, or cryptographically salted/hashed before analytical processing or data sharing with third parties?',
        reference: 'NIST SP 800-53 Rev. 5 §SI-19',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-188 (De-Identification) §3.2'
      },
      {
        id: 'SI-19.2',
        text: 'Are de-identification methods periodically tested for re-identification vulnerability using motivated intruder attack simulations?',
        reference: 'NIST SP 800-53 Rev. 5 §SI-19(4)',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'HIPAA Safe Harbor / Expert Determination'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
  },

  // ==========================================
  // 20. SUPPLY CHAIN RISK MANAGEMENT (SR) - INFOSEC
  // ==========================================
  {
    controlId: 'SR-2',
    title: 'Supply Chain Risk Management Plan',
    family: 'SR',
    familyName: 'Supply Chain Risk Management',
    domain: 'Information Security',
    discussion: 'Develops and maintains a formal Supply Chain Risk Management (SCRM) plan governing vendor research, acquisition, provenance, and component lifecycle.',
    relatedControls: ['CA-2', 'CP-4', 'IR-4', 'PM-9', 'PM-30', 'RA-3', 'SA-8'],
    controlEnhancements: ['Establish Cross-Disciplinary SCRM Team'],
    assessmentQuestions: [
      {
        id: 'SR-2.1',
        text: 'Has the organization established a formal Supply Chain Risk Management (SCRM) plan with a dedicated cross-disciplinary oversight committee?',
        reference: 'NIST SP 800-53 Rev. 5 §SR-2',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-161 Rev. 1 §2.1'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },
  {
    controlId: 'SR-3',
    title: 'Supply Chain Controls and Processes',
    family: 'SR',
    familyName: 'Supply Chain Risk Management',
    domain: 'Information Security',
    discussion: 'Identifies weaknesses in external suppliers and enforces flow-down contractual security requirements to prime and sub-tier contractors.',
    relatedControls: ['PE-16', 'PM-30', 'SA-4', 'SA-10', 'SR-5', 'SR-6', 'SR-11'],
    controlEnhancements: ['Diverse Supply Base', 'Limitation of Harm', 'Sub-tier Flow Down Contract Clauses'],
    assessmentQuestions: [
      {
        id: 'SR-3.1',
        text: 'Are supply chain security controls, breach notification SLAs, and right-to-audit clauses mandated in contracts with all third-party vendors and cloud providers?',
        reference: 'NIST SP 800-53 Rev. 5 §SR-3',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'ISO/IEC 27001:2022 §A.5.19'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
  },
  {
    controlId: 'SR-4',
    title: 'Provenance & Software Bill of Materials (SBOM)',
    family: 'SR',
    familyName: 'Supply Chain Risk Management',
    domain: 'Information Security',
    discussion: 'Documents, monitors, and validates component provenance (Software Bill of Materials / SBOM, hardware serial tracing, digital signatures) to prevent tampering.',
    relatedControls: ['CM-8', 'MA-2', 'RA-9', 'SA-3', 'SI-4', 'SR-11'],
    controlEnhancements: ['Unique Component Identification & SBOM Tracking', 'Validate as Genuine / Anti-Tamper Seals', 'Software Pedigree Analysis'],
    assessmentQuestions: [
      {
        id: 'SR-4.1',
        text: 'Does the organization generate, maintain, and cryptographically verify Software Bill of Materials (SBOM - CycloneDX/SPDX) for all software builds and containers?',
        reference: 'NIST SP 800-53 Rev. 5 §SR-4',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'Executive Order 14028 & NIST SP 800-218'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 4,
  },
  {
    controlId: 'SR-6',
    title: 'Supplier Assessments and Reviews',
    family: 'SR',
    familyName: 'Supply Chain Risk Management',
    domain: 'Information Security',
    discussion: 'Regularly audits and assesses third-party suppliers for security posture, compliance certifications (SOC 2, ISO 27001), and foreign ownership or influence (FOCI).',
    relatedControls: ['CA-8', 'SA-21', 'SR-3', 'SR-5'],
    controlEnhancements: ['Independent Third-Party Testing of Vendors'],
    assessmentQuestions: [
      {
        id: 'SR-6.1',
        text: 'Are third-party vendor risk assessments and compliance reviews (SOC 2 Type II / ISO 27001) conducted prior to vendor onboarding and annually thereafter?',
        reference: 'NIST SP 800-53 Rev. 5 §SR-6',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-161 Rev. 1 §3.4'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
    isAssuranceRelated: true,
  },
  {
    controlId: 'SR-11',
    title: 'Component Authenticity',
    family: 'SR',
    familyName: 'Supply Chain Risk Management',
    domain: 'Information Security',
    discussion: 'Implements anti-counterfeiting policies and scanning to detect and prevent counterfeit or maliciously tainted hardware and software components.',
    relatedControls: ['PE-3', 'SA-4', 'SI-7', 'SR-9', 'SR-10'],
    controlEnhancements: ['Anti-Counterfeit Training', 'Configuration Control for Repair', 'Anti-Counterfeit Scanning'],
    assessmentQuestions: [
      {
        id: 'SR-11.1',
        text: 'Are inspection procedures and automated signature checks implemented to detect and reject counterfeit hardware or unverified software packages?',
        reference: 'NIST SP 800-53 Rev. 5 §SR-11',
        publication: 'NIST SP 800-53 Rev. 5',
        additionalRef: 'NIST SP 800-161 Rev. 1 §4.8'
      }
    ],
    defaultImpact: 4,
    defaultLikelihood: 3,
  }
];

/**
 * Filter controls matching specific RCSA Domain(s) - Supports Multi-Domain Combination
 */
export function getControlsForRCSADomain(domainInput: RCSADomainType | (RiskDomain | RCSADomainType)[]): NistControlDefinition[] {
  // Normalize input into an array of domain strings
  let domains: string[] = [];
  if (Array.isArray(domainInput)) {
    domains = domainInput;
  } else if (typeof domainInput === 'string') {
    if (domainInput === 'All' || domainInput === 'Universal') {
      return NIST_CONTROLS_CATALOG;
    }
    // Check if it's a combined string like "Privacy + Information Security" or "Privacy, Cybersecurity"
    if (domainInput.includes('+') || domainInput.includes('&') || domainInput.includes(',')) {
      domains = domainInput.split(/[+&,]/).map((d) => d.trim()).filter(Boolean);
    } else {
      domains = [domainInput.trim()];
    }
  }

  if (domains.length === 0 || domains.includes('All')) {
    return NIST_CONTROLS_CATALOG;
  }

  const matchedControls = new Map<string, NistControlDefinition>();

  domains.forEach((dom) => {
    const normalizedDom = dom.toLowerCase();

    NIST_CONTROLS_CATALOG.forEach((c) => {
      // Privacy matching
      if (normalizedDom.includes('privacy')) {
        if (
          c.domain === 'Privacy' ||
          c.family === 'PT' ||
          ['SI-18', 'SI-19', 'PM-18', 'RA-8', 'MP-6', 'AC-24'].includes(c.controlId)
        ) {
          matchedControls.set(c.controlId, c);
        }
      }

      // Information Security matching
      if (normalizedDom.includes('information security') || normalizedDom === 'infosec') {
        if (
          c.domain === 'Information Security' ||
          ['AT', 'CA', 'CM', 'CP', 'MA', 'MP', 'PE', 'PS', 'SA', 'SR'].includes(c.family)
        ) {
          matchedControls.set(c.controlId, c);
        }
      }

      // Cybersecurity matching
      if (normalizedDom.includes('cybersecurity') || normalizedDom === 'cyber') {
        if (
          c.domain === 'Cybersecurity' ||
          ['AC', 'AU', 'IA', 'IR', 'RA', 'SC', 'SI'].includes(c.family)
        ) {
          matchedControls.set(c.controlId, c);
        }
      }

      // Governance matching
      if (normalizedDom.includes('governance')) {
        if (
          c.domain === 'Governance' ||
          ['PL', 'PM', 'CA'].includes(c.family)
        ) {
          matchedControls.set(c.controlId, c);
        }
      }
    });
  });

  const result = Array.from(matchedControls.values());
  return result.length > 0 ? result : NIST_CONTROLS_CATALOG;
}

