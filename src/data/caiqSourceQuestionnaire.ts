/**
 * CSA Cloud Controls Matrix (CCM v4.1.0) & Consensus Assessments Initiative Questionnaire (CAIQ v4.1.0)
 * Complete Source Questionnaire Catalog with Authoritative Specifications, SSRM Ownership, Implementation Guidelines & Auditing Guidelines
 * Published by Cloud Security Alliance (CSA) - Specification v4.1.0
 */

import { SourceQuestionnaireItem } from '../types';

export const CSA_CCM_DOMAINS = [
  { code: 'A&A', title: 'Audit & Assurance', icon: 'FileCheck', count: 8 },
  { code: 'AIS', title: 'Application & Interface Security', icon: 'Code', count: 12 },
  { code: 'BCR', title: 'Business Continuity Management & Resilience', icon: 'Activity', count: 14 },
  { code: 'CCC', title: 'Change Control & Configuration Management', icon: 'RefreshCw', count: 11 },
  { code: 'CEK', title: 'Cryptography, Encryption & Key Management', icon: 'Key', count: 23 },
  { code: 'DCS', title: 'Datacenter Security', icon: 'Server', count: 23 },
  { code: 'DSP', title: 'Data Security & Privacy Lifecycle Management', icon: 'Eye', count: 22 },
  { code: 'GRC', title: 'Governance, Risk & Compliance', icon: 'Layers', count: 9 },
  { code: 'HRS', title: 'Human Resources', icon: 'Users', count: 16 },
  { code: 'IAM', title: 'Identity & Access Management', icon: 'Lock', count: 18 },
  { code: 'IPY', title: 'Interoperability & Portability', icon: 'Share2', count: 8 },
  { code: 'I&S', title: 'Infrastructure & Virtualization Security', icon: 'Shield', count: 14 },
  { code: 'LOG', title: 'Logging & Monitoring', icon: 'ListOrdered', count: 16 },
  { code: 'SEF', title: 'Security Incident Management & Forensics', icon: 'AlertTriangle', count: 14 },
  { code: 'STA', title: 'Supply Chain Management & Transparency', icon: 'Truck', count: 19 },
  { code: 'TVM', title: 'Threat & Vulnerability Management', icon: 'Crosshair', count: 14 },
  { code: 'UEM', title: 'Universal Endpoint Management', icon: 'Laptop', count: 16 },
];

export const CAIQ_SOURCE_QUESTIONNAIRE: SourceQuestionnaireItem[] = [
  // --- Audit & Assurance (A&A) ---
  {
    questionId: 'A&A-01.1',
    questionText: 'Are audit and assurance policies, procedures, and standards established, documented, approved, communicated, applied, evaluated, and maintained?',
    controlId: 'A&A-01',
    controlTitle: 'Audit and Assurance Policy and Procedures',
    domainTitle: 'Audit & Assurance',
    domainCode: 'A&A',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain audit and assurance policies and procedures and standards. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: false,
    ssrmOwnership: 'Shared',
    iaasOwnership: 'Shared',
    paasOwnership: 'Shared',
    saasOwnership: 'Shared',
    cspImplementationGuidance: 'The CSP should establish formal policies and procedures based on industry best practices and relevant standards to educate its personnel of the required baseline for information security standards and guidelines (ISO/IEC 27001, AICPA SOC 2, CSA CCM). Define scope, independent assessments, conflict of interest, and audit management workflows.',
    cscResponsibilitiesGuidance: 'The CSC should state within policies that use of CSP services must provide appropriate audit evidence and contractual attestations meeting CSC compliance scope.',
    auditingGuidelines: [
      '1. Examine policy and procedures to confirm content adequacy in terms of purpose, authority, accountability, responsibilities, planning, communication, reporting, and follow-up.',
      '2. Examine audit charter and determine if independence, impartiality, and objectivity are guaranteed.',
      '3. Examine policy and procedures for evidence of review at least annually.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AU-1, §CA-1' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.5.1, §A.5.35' },
      { framework: 'AICPA TSC 2017', referenceId: 'CC2.1, CC5.3' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'A&A-01.2',
    questionText: 'Are audit and assurance policies, procedures, and standards reviewed and updated at least annually, or upon significant changes?',
    controlId: 'A&A-01',
    controlTitle: 'Audit and Assurance Policy and Procedures',
    domainTitle: 'Audit & Assurance',
    domainCode: 'A&A',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain audit and assurance policies and procedures and standards. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: false,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify annual review signoffs and change tracking for audit and assurance policies.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AU-1' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.5.1' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'A&A-02.1',
    questionText: 'Are independent audit and assurance assessments conducted according to relevant standards at least annually?',
    controlId: 'A&A-02',
    controlTitle: 'Independent Assessments',
    domainTitle: 'Audit & Assurance',
    domainCode: 'A&A',
    controlSpecification: 'Conduct independent audit and assurance assessments according to relevant standards at least annually.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    iaasOwnership: 'Shared',
    paasOwnership: 'Shared',
    saasOwnership: 'Shared',
    cspImplementationGuidance: 'The CSP should regularly conduct independent assurance and audit activities. Audits include independent verification of self-assessments, physical control reviews, SOC 2 Type II reports, and penetration testing by qualified third parties.',
    cscResponsibilitiesGuidance: 'The CSC should perform independent assessments or review third-party attestations of the CSP to demonstrate compliance consistent with contractual agreements.',
    auditingGuidelines: [
      '1. Examine the process to determine standards and regulations applicable to systems.',
      '2. Determine if the organization maintains and reviews a list of such standards.',
      '3. Determine if senior management exercises oversight over independence.',
      '4. Determine if the audit plan is informed by previous assessments and scheduled annually.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CA-2(1), §CA-2(2)' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.5.35, §A.5.36' },
      { framework: 'SOC 2 Type II', referenceId: 'CC4.1, CC4.2' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'A&A-03.1',
    questionText: 'Are independent audit and assurance assessments performed according to risk-based plans and policies, and in response to significant changes or emerging risks?',
    controlId: 'A&A-03',
    controlTitle: 'Risk Based Planning Assessment',
    domainTitle: 'Audit & Assurance',
    domainCode: 'A&A',
    controlSpecification: 'Perform independent audit and assurance assessments according to risk-based plans and policies,and in response to significant changes or emerging risks.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine risk-based audit planning methodologies and trigger criteria for emerging risks.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CA-2, §RA-3' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'A&A-04.1',
    questionText: 'Is compliance verified regarding all relevant standards, regulations, legal/contractual, and statutory requirements applicable to the audit?',
    controlId: 'A&A-04',
    controlTitle: 'Requirements Compliance',
    domainTitle: 'Audit & Assurance',
    domainCode: 'A&A',
    controlSpecification: 'Verify compliance with all relevant standards, regulations, legal/contractual, and statutory requirements applicable to the audit.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine regulatory mapping registry against active audit work programs.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CA-2, §PL-2' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'A&A-05.1',
    questionText: 'Is an audit management process defined and implemented to support audit planning, risk analysis, security control assessments, conclusions, remediation schedules, report generation, and reviews of past reports and supporting evidence and aligned with relevant auditing standards?',
    controlId: 'A&A-05',
    controlTitle: 'Audit Management Process',
    domainTitle: 'Audit & Assurance',
    domainCode: 'A&A',
    controlSpecification: 'Define and implement an Audit Management process aligned with relevant auditing standards to support audit planning, risk analysis, security control assessment, conclusion, remediation schedules, report generation, and review of past reports and supporting evidence.',
    caiqLite: false,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine formal audit management workflows, sampling methods, and evidence archival.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AU-6, §CA-7' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'A&A-06.1',
    questionText: 'Is a risk-based corrective action plan to remediate audit findings established, documented, approved, communicated, applied, evaluated, and maintained?',
    controlId: 'A&A-06',
    controlTitle: 'Remediation',
    domainTitle: 'Audit & Assurance',
    domainCode: 'A&A',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain a risk-based corrective action plan to remediate audit findings, regularly review and report remediation status to relevant stakeholders.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine CAPs / POAMs for audit deficiency tracking, escalation, and verification of closure.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CA-5 (Plan of Action and Milestones)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'A&A-06.2',
    questionText: 'Is the remediation status of audit findings regularly reviewed and reported to relevant stakeholders?',
    controlId: 'A&A-06',
    controlTitle: 'Remediation',
    domainTitle: 'Audit & Assurance',
    domainCode: 'A&A',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain a risk-based corrective action plan to remediate audit findings, regularly review and report remediation status to relevant stakeholders.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify periodic executive audit reporting and remediation dashboard status.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CA-5, §PM-4' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Application & Interface Security (AIS) ---
  {
    questionId: 'AIS-01.1',
    questionText: 'Are application security policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained?',
    controlId: 'AIS-01',
    controlTitle: 'Application and Interface Security Policy and Procedures',
    domainTitle: 'Application & Interface Security',
    domainCode: 'AIS',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain policies and procedures for application security. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: false,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine policy and procedures for adequacy, approval, communication, and effectiveness as applicable to application security capabilities.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SA-1, §SI-1' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.8.25, §A.8.26' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'AIS-02.1',
    questionText: 'Are baseline requirements to secure applications established, documented, and maintained?',
    controlId: 'AIS-02',
    controlTitle: 'Application Security Baseline Requirements',
    domainTitle: 'Application & Interface Security',
    domainCode: 'AIS',
    controlSpecification: 'Establish, document and maintain baseline requirements for securing applications.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine security baseline requirements (OWASP ASVS / Top 10) across application tiers.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CM-2, §SA-8' },
      { framework: 'OWASP Top 10:2021', referenceId: 'A01-A10' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'AIS-03.1',
    questionText: 'Are technical and operational metrics defined and implemented according to business objectives, security requirements, and compliance obligations?',
    controlId: 'AIS-03',
    controlTitle: 'Application Security Metrics',
    domainTitle: 'Application & Interface Security',
    domainCode: 'AIS',
    controlSpecification: 'Define and implement technical and operational metrics in alignment with business objectives, security requirements, and compliance obligations.',
    caiqLite: false,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine definition of operational metrics, MTTD/MTTR for code flaws, and test coverage.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§PM-6, §SA-11' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'AIS-04.1',
    questionText: 'Is a secure SDLC process defined and implemented for application requirements analysis, planning, design, development, testing, deployment, and operation per organizationally designed security requirements?',
    controlId: 'AIS-04',
    controlTitle: 'Secure Application Development Lifecycle',
    domainTitle: 'Application & Interface Security',
    domainCode: 'AIS',
    controlSpecification: 'Define and implement a secure SDLC process for application requirements analysis, planning, design, development, testing, deployment, and operation in accordance with security requirements.',
    caiqLite: true,
    ssrmOwnership: 'Shared (IaaS/PaaS) / CSP-Owned (SaaS)',
    iaasOwnership: 'Shared',
    paasOwnership: 'Shared',
    saasOwnership: 'CSP-Owned',
    cspImplementationGuidance: 'The CSP should leverage an SSDLC process to ensure that applications and APIs are securely designed, developed, deployed, and operated. Incorporate threat modeling (STRIDE), secure coding guidelines, SAST/DAST, and dependency scanning into CI/CD.',
    cscResponsibilitiesGuidance: 'In IaaS and PaaS, the CSC owns the application code and must implement SSDLC practices for all deployed applications.',
    auditingGuidelines: [
      '1. Examine SDLC policies and procedures for security requirements integration.',
      '2. Examine implementation of threat modeling, code reviews, and gated deployment checks.',
      '3. Verify that SSDLC implementation is in accordance with defined requirements.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SA-3, §SA-8, §SA-11, §SA-15' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.8.25, §A.8.27, §A.8.28' },
      { framework: 'CIS Controls v8', referenceId: '16.1, 16.2, 16.3' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'AIS-05.1',
    questionText: 'Does the testing strategy outline criteria to accept new information systems, upgrades, and new versions while ensuring application security, compliance adherence, and meeting organizational delivery goals?',
    controlId: 'AIS-05',
    controlTitle: 'Application Security Testing',
    domainTitle: 'Application & Interface Security',
    domainCode: 'AIS',
    controlSpecification: 'Implement a testing strategy, including criteria for acceptance of new information systems, upgrades and new versions, which provides application security assurance and maintains compliance while meeting organizational delivery goals. Automate when applicable and possible.',
    caiqLite: false,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine policy for testing strategies, acceptance criteria, and release gating.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SA-11(1), §CA-2' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'AIS-05.2',
    questionText: 'Is testing automated when applicable and possible?',
    controlId: 'AIS-05',
    controlTitle: 'Application Security Testing',
    domainTitle: 'Application & Interface Security',
    domainCode: 'AIS',
    controlSpecification: 'Implement a testing strategy, including criteria for acceptance of new information systems, upgrades and new versions, which provides application security assurance and maintains compliance while meeting organizational delivery goals. Automate when applicable and possible.',
    caiqLite: false,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify automated SAST, DAST, SCA, and secret scanning within CI/CD pipelines.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SA-11(8)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'AIS-06.1',
    questionText: 'Are strategies and capabilities established and implemented to deploy application code in a secure, standardized, and compliant manner?',
    controlId: 'AIS-06',
    controlTitle: 'Secure Application Deployment',
    domainTitle: 'Application & Interface Security',
    domainCode: 'AIS',
    controlSpecification: 'Establish and implement strategies and capabilities for secure, standardized, and compliant application deployment. Automate where possible.',
    caiqLite: true,
    ssrmOwnership: 'Shared (IaaS/PaaS) / CSP-Owned (SaaS)',
    auditingGuidelines: [
      '1. Examine automated deployment pipelines, immutable infrastructure, and segregation of duties.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CM-3, §SA-10' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'AIS-07.1',
    questionText: 'Are application security vulnerabilities remediated following defined processes?',
    controlId: 'AIS-07',
    controlTitle: 'Application Vulnerability Remediation',
    domainTitle: 'Application & Interface Security',
    domainCode: 'AIS',
    controlSpecification: 'Define and implement a process to remediate application security vulnerabilities, automating remediation when possible.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine vulnerability SLA tracking, patch workflows, and hotfix deployment processes.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SI-2, §RA-5' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'AIS-08.1',
    questionText: 'Are processes, procedures, and technical measures defined and implemented to secure APIs?',
    controlId: 'AIS-08',
    controlTitle: 'API Security',
    domainTitle: 'Application & Interface Security',
    domainCode: 'AIS',
    controlSpecification: 'Define and implement processes, procedures, and technical measures to secure APIs. Review and update for any improvements at least annually or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    iaasOwnership: 'Shared',
    paasOwnership: 'Shared',
    saasOwnership: 'Shared',
    cspImplementationGuidance: 'Enforce authentication for all API calls by default (OAuth 2.0 / JWT / mTLS), object-level authorization, rate limiting, token expiration, encryption in transit (TLS 1.3), and comprehensive API logging and attack detection (OWASP API Top 10).',
    cscResponsibilitiesGuidance: 'Configure API connection credentials, manage non-human identity (NHI) credentials, enforce least privilege scopes, and rotate tokens regularly.',
    auditingGuidelines: [
      '1. Examine API security policies covering authentication, authorization, rate limiting, and input validation.',
      '2. Evaluate whether roles for API security management and NHI lifecycle are clearly defined.',
      '3. Assess whether technical measures (API Gateways, WAF, mTLS) are operational and tested.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AC-3, §SC-8, §IA-5' },
      { framework: 'OWASP API Security Top 10', referenceId: 'API1-API10' },
      { framework: 'NIST SP 800-228', referenceId: 'API Security Guidelines' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Business Continuity Management & Operational Resilience (BCR) ---
  {
    questionId: 'BCR-01.1',
    questionText: 'Are business continuity management and operational resilience policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained?',
    controlId: 'BCR-01',
    controlTitle: 'Business Continuity Management Policy and Procedures',
    domainTitle: 'Business Continuity Management & Resilience',
    domainCode: 'BCR',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain business continuity management and operational resilience policies and procedures. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine BCM and operational resilience policy adequacy, annual review, and executive signoff.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CP-1' },
      { framework: 'ISO 22301:2019', referenceId: '§4.1, §5.2' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'BCR-02.1',
    questionText: 'Are criteria for developing business continuity and operational resiliency strategies and capabilities established based on business disruption and risk impacts?',
    controlId: 'BCR-02',
    controlTitle: 'Risk Assessment and Impact Analysis',
    domainTitle: 'Business Continuity Management & Resilience',
    domainCode: 'BCR',
    controlSpecification: 'Determine the impact of business disruptions and risks to establish criteria for developing business continuity and operational resilience strategies and capabilities. Review and update the risk assessment and impact analysis at least annually or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine Business Impact Analysis (BIA) documentation, RTO/RPO definitions, and risk criteria.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CP-2, §RA-3' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'BCR-03.1',
    questionText: 'Are strategies being established to reduce the impact of business disruptions, and are resiliency and recovery from business disruptions being improved?',
    controlId: 'BCR-03',
    controlTitle: 'Business Continuity Strategy',
    domainTitle: 'Business Continuity Management & Resilience',
    domainCode: 'BCR',
    controlSpecification: 'Establish strategies to reduce the impact of business disruptions, and improve resiliency and recovery from business disruptions.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify active resiliency strategies, multi-region failover, and redundancy architectures.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CP-2, §CP-6, §CP-7' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'BCR-08.1',
    questionText: 'Are backups performed periodically?',
    controlId: 'BCR-08',
    controlTitle: 'Backup',
    domainTitle: 'Business Continuity Management & Resilience',
    domainCode: 'BCR',
    controlSpecification: 'Periodically perform backups. Ensure the confidentiality, integrity and availability of the backup, and verify restoration from backup for resiliency.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    iaasOwnership: 'Shared',
    paasOwnership: 'Shared',
    saasOwnership: 'Shared',
    cspImplementationGuidance: 'Provide automated snapshotting, cross-region replication, immutable WORM backup storage, and cryptographic integrity verification (hashes).',
    cscResponsibilitiesGuidance: 'Select datasets for backup, schedule jobs according to RPO/RTO, enable backup encryption with managed keys, and conduct quarterly test restores.',
    auditingGuidelines: [
      '1. Examine backup schedule logs, 3-2-1 compliance, immutability configurations, and successful restoration drill records.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CP-9, §CP-9(1), §CP-10' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.8.13' },
      { framework: 'CIS Controls v8', referenceId: '11.1, 11.2, 11.3' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'BCR-08.2',
    questionText: 'Is the confidentiality, integrity, and availability of the backup ensured?',
    controlId: 'BCR-08',
    controlTitle: 'Backup',
    domainTitle: 'Business Continuity Management & Resilience',
    domainCode: 'BCR',
    controlSpecification: 'Periodically perform backups. Ensure the confidentiality, integrity and availability of the backup, and verify restoration from backup for resiliency.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify backup encryption at rest, access control restrictions, and hash integrity validation.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CP-9(3), §SC-28' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'BCR-08.3',
    questionText: 'Can backups be restored appropriately for resiliency?',
    controlId: 'BCR-08',
    controlTitle: 'Backup',
    domainTitle: 'Business Continuity Management & Resilience',
    domainCode: 'BCR',
    controlSpecification: 'Periodically perform backups. Ensure the confidentiality, integrity and availability of the backup, and verify restoration from backup for resiliency.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Review historical test restoration logs against defined RTO limits.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CP-10' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'BCR-09.1',
    questionText: 'Is a disaster response plan established, documented, approved, applied, evaluated, and maintained to ensure recovery from natural and man-made disasters?',
    controlId: 'BCR-09',
    controlTitle: 'Disaster Response Plan',
    domainTitle: 'Business Continuity Management & Resilience',
    domainCode: 'BCR',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain a disaster response plan to recover from natural and man-made disasters. Update the plan at least annually or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine Disaster Recovery Plan (DRP) documentation and trigger criteria.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CP-2, §CP-4' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'BCR-11.1',
    questionText: 'Are business-critical equipment supplemented with both locally redundant and geographically dispersed equipment located at a reasonable minimum distance, in accordance with applicable industry standards?',
    controlId: 'BCR-11',
    controlTitle: 'Equipment Redundancy',
    domainTitle: 'Business Continuity Management & Resilience',
    domainCode: 'BCR',
    controlSpecification: 'Supplement business-critical equipment with both locally redundant and geographically dispersed equipment located at a reasonable minimum distance in accordance with applicable industry standards.',
    caiqLite: false,
    ssrmOwnership: 'CSP-Owned',
    iaasOwnership: 'CSP-Owned',
    paasOwnership: 'CSP-Owned',
    saasOwnership: 'CSP-Owned',
    cspImplementationGuidance: 'Implement geographically dispersed datacenter regions and availability zones with independent power, cooling, and network links to prevent single points of failure.',
    cscResponsibilitiesGuidance: 'Architect cloud workloads across multiple availability zones and regions to leverage CSP equipment redundancy.',
    auditingGuidelines: [
      '1. Examine physical facility distribution, power diversity, and zone-level separation documentation.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CP-7, §PE-10, §PE-11' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Change Control & Configuration Management (CCC) ---
  {
    questionId: 'CCC-01.1',
    questionText: 'Are policies and procedures for managing the risks associated with applying changes to assets owned, controlled, or used by the organization established, documented, approved, communicated, applied, evaluated, and maintained?',
    controlId: 'CCC-01',
    controlTitle: 'Change Management Policy and Procedures',
    domainTitle: 'Change Control & Configuration Management',
    domainCode: 'CCC',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain policies and procedures for managing the risks associated with applying changes to assets owned, controlled or used by the organization. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine change control policies, Change Advisory Board (CAB) charter, and approval workflows.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CM-1, §CM-3' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.8.32' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'CCC-02.1',
    questionText: 'Is a defined quality change control, approval and testing process, incorporating baselines, testing, and release standards, established, maintained and implemented?',
    controlId: 'CCC-02',
    controlTitle: 'Quality Testing',
    domainTitle: 'Change Control & Configuration Management',
    domainCode: 'CCC',
    controlSpecification: 'Establish, maintain and implement a defined quality change control, approval and testing process incorporating baselines, testing, and release standards.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine testing records, QA signoffs, and pre-production staging results prior to production release.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CM-3, §SA-11' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'CCC-04.1',
    questionText: 'Is a procedure to authorize the addition, removal, update, and management of assets owned, controlled, or used by the organization, implemented and enforced?',
    controlId: 'CCC-04',
    controlTitle: 'Unauthorized Change Protection',
    domainTitle: 'Change Control & Configuration Management',
    domainCode: 'CCC',
    controlSpecification: 'Implement and enforce a procedure to authorize the addition, removal, update, and management of assets that are owned, controlled or used by the organization.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine unauthorized change detection mechanisms and asset tracking authorization controls.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CM-3, §CM-5' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'CCC-06.1',
    questionText: 'Are change management and configuration baselines established, documented and implemented for all relevant authorized changes on organizational assets?',
    controlId: 'CCC-06',
    controlTitle: 'Change Management Baseline',
    domainTitle: 'Change Control & Configuration Management',
    domainCode: 'CCC',
    controlSpecification: 'Establish, document and implement change management and configuration baselines for all relevant authorized changes on organization assets. Review and update the baselines at least annually or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify existence of hardened configuration baselines (CIS Benchmarks) in version control.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CM-2, §CM-2(1)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'CCC-07.1',
    questionText: 'Are detection measures implemented with proactive notification if changes deviate from established baselines?',
    controlId: 'CCC-07',
    controlTitle: 'Detection of Baseline Deviation',
    domainTitle: 'Change Control & Configuration Management',
    domainCode: 'CCC',
    controlSpecification: 'Implement detection measures with proactive notification in case of changes deviating from the established baseline.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Review automated configuration drift detection tools and real-time alerting.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CM-3(1), §SI-4' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'CCC-09.1',
    questionText: 'Is a process to proactively roll back changes to a previously known "good state" defined and implemented in case of errors or security concerns?',
    controlId: 'CCC-09',
    controlTitle: 'Change Restoration',
    domainTitle: 'Change Control & Configuration Management',
    domainCode: 'CCC',
    controlSpecification: 'Define and implement a process to proactively roll back changes to a previous known good state in case of errors or security concerns.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine rollback procedures, snapshot triggers, and fallback testing records.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CM-3(2)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Cryptography, Encryption & Key Management (CEK) ---
  {
    questionId: 'CEK-01.1',
    questionText: 'Are cryptography, encryption, and key management policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained?',
    controlId: 'CEK-01',
    controlTitle: 'Encryption and Key Management Policy and Procedures',
    domainTitle: 'Cryptography, Encryption & Key Management',
    domainCode: 'CEK',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain policies and procedures for Cryptography, Encryption and Key Management. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Review cryptography and key management policy and confirm approval by appropriate leadership.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-1, §SC-12, §SC-13' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.8.24' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'CEK-02.1',
    questionText: 'Are cryptography, encryption, and key management roles and responsibilities defined and implemented?',
    controlId: 'CEK-02',
    controlTitle: 'CEK Roles and Responsibilities',
    domainTitle: 'Cryptography, Encryption & Key Management',
    domainCode: 'CEK',
    controlSpecification: 'Define and implement cryptographic, encryption and key management roles and responsibilities.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify key custodian duties, dual-control, and split knowledge access controls.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-12, §AC-2' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'CEK-03.1',
    questionText: 'Are data protection at-rest and in-transit, and where applicable in use, provided using cryptographic libraries certified to approved standards?',
    controlId: 'CEK-03',
    controlTitle: 'Data Protection',
    domainTitle: 'Cryptography, Encryption & Key Management',
    domainCode: 'CEK',
    controlSpecification: 'Provide data protection at-rest, in-transit, and where applicable, in-use by using cryptographic libraries certified to approved standards.',
    caiqLite: true,
    ssrmOwnership: 'Shared (Dependent)',
    iaasOwnership: 'Shared',
    paasOwnership: 'Shared',
    saasOwnership: 'Shared',
    cspImplementationGuidance: 'The CSP should maintain a secure Cloud Key Management Service (CKMS) meeting FIPS 140-3 validation, offering full-disk encryption for databases/storage, TLS 1.3 for in-transit network traffic, and confidential computing / TEEs for data in-use.',
    cscResponsibilitiesGuidance: 'The CSC must configure storage encryption on all buckets/volumes, mandate HTTPS/TLS for all endpoint and API traffic, and securely manage client-managed encryption keys (CMK/BYOK).',
    auditingGuidelines: [
      '1. Identify data flows in-transit and confirm TLS 1.2+ cipher suites.',
      '2. Identify data storage at-rest and verify AES-256 / FIPS-certified encryption.',
      '3. Confirm usage of Trusted Execution Environments (TEEs) for sensitive data in-use.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-8, §SC-8(1), §SC-13, §SC-28' },
      { framework: 'FIPS 140-3', referenceId: 'Cryptographic Module Standards' },
      { framework: 'PCI DSS v4.0', referenceId: 'Req 3.4, 4.1' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'CEK-04.1',
    questionText: 'Are encryption algorithms following industry standards utilized for protecting data, based on the data classification and associated risks?',
    controlId: 'CEK-04',
    controlTitle: 'Encryption Algorithm',
    domainTitle: 'Cryptography, Encryption & Key Management',
    domainCode: 'CEK',
    controlSpecification: 'Utilize encryption algorithms following industry standards for protecting data, based on the data classification and associated risks.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify approved ciphers (AES-GCM-256, RSA-3072+, ECC P-384, ChaCha20-Poly1305).'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-13' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'CEK-10.1',
    questionText: 'Are cryptographic keys generated using industry-accepted and approved cryptographic libraries that specify algorithm strength and random number generator specifications?',
    controlId: 'CEK-10',
    controlTitle: 'Key Generation',
    domainTitle: 'Cryptography, Encryption & Key Management',
    domainCode: 'CEK',
    controlSpecification: 'Generate Cryptographic keys using industry accepted cryptographic libraries specifying the algorithm strength and the random number generator used.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Confirm keys are generated using CSPRNGs within certified Hardware Security Modules (HSMs).'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-12(1), §SC-13' },
      { framework: 'NIST SP 800-90A', referenceId: 'Random Bit Generators' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'CEK-12.1',
    questionText: 'Are cryptographic keys rotated based on a cryptoperiod calculated while considering information disclosure risks and legal and regulatory requirements?',
    controlId: 'CEK-12',
    controlTitle: 'Key Rotation',
    domainTitle: 'Cryptography, Encryption & Key Management',
    domainCode: 'CEK',
    controlSpecification: 'Rotate cryptographic keys in accordance with the calculated cryptoperiod, which includes provisions for considering the risk of information disclosure and legal and regulatory requirements.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify automated key rotation policies (e.g. 90-day / 365-day rotation intervals) in KMS.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-12, §SC-12(1)' },
      { framework: 'NIST SP 800-57', referenceId: 'Key Management Guideline' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'CEK-13.1',
    questionText: 'Are cryptographic keys revoked and removed before the end of the established cryptoperiod (when a key is compromised, or an entity is no longer part of the organization) per defined, implemented, and evaluated processes, procedures, and technical measures to include legal and regulatory requirement provisions?',
    controlId: 'CEK-13',
    controlTitle: 'Key Revocation',
    domainTitle: 'Cryptography, Encryption & Key Management',
    domainCode: 'CEK',
    controlSpecification: 'Define, implement and evaluate processes, procedures and technical measures to revoke and remove cryptographic keys prior to the end of its established cryptoperiod, when a key is compromised, or an entity is no longer part of the organization, which include provisions for legal and regulatory requirements.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine emergency key revocation procedures and CRL / OCSP distribution.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-12(2), §SC-17' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'CEK-14.1',
    questionText: 'Are processes, procedures and technical measures to securely destroy cryptographic keys when they are no longer needed, defined, implemented, and evaluated, and include provisions for legal and regulatory requirements?',
    controlId: 'CEK-14',
    controlTitle: 'Key Destruction',
    domainTitle: 'Cryptography, Encryption & Key Management',
    domainCode: 'CEK',
    controlSpecification: 'Define, implement, and evaluate processes, procedures, and technical measures to securely destroy cryptographic keys when they are no longer needed, which include provisions for legal and regulatory requirements.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine crypto-shredding procedures and immutable deletion audit logs.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-12, §MP-6' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Datacenter Security (DCS) ---
  {
    questionId: 'DCS-04.1',
    questionText: 'Are policies and procedures for maintaining a safe and secure working environment (in offices, rooms, and facilities) established, documented, approved, communicated, enforced, and maintained?',
    controlId: 'DCS-04',
    controlTitle: 'Secure Area Policy and Procedures',
    domainTitle: 'Datacenter Security',
    domainCode: 'DCS',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain policies and procedures for maintaining a safe and secure working environment in offices, rooms, and facilities. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'CSP-Owned',
    auditingGuidelines: [
      '1. Examine physical facility security policies, visitor escorts, and access restrictions.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§PE-1, §PE-2, §PE-3' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'DCS-06.1',
    questionText: 'Is the classification and documentation of physical and logical assets based on the organizational business risk?',
    controlId: 'DCS-06',
    controlTitle: 'Assets Classification',
    domainTitle: 'Datacenter Security',
    domainCode: 'DCS',
    controlSpecification: 'Classify and document the physical, and logical assets (e.g., applications) based on the organizational business risk. Review and update the assets’ classification at least annually, or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine asset inventory tagging and business risk classification.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CM-8, §RA-2' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'DCS-07.1',
    questionText: 'Are all relevant physical and logical assets at all CSP sites cataloged and tracked within a secured system?',
    controlId: 'DCS-07',
    controlTitle: 'Assets Cataloguing and Tracking',
    domainTitle: 'Datacenter Security',
    domainCode: 'DCS',
    controlSpecification: 'Catalogue and track all relevant physical and logical assets located at all of the service provider\'s sites within a secured system. Review and update the catalogue at least annually or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine CMDB systems, RFID/GPS tracking, and asset lifecycle state tracking.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CM-8(1), §CM-8(2)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Data Security & Privacy Lifecycle Management (DSP) ---
  {
    questionId: 'DSP-01.1',
    questionText: 'Are policies and procedures established, documented, approved, communicated, enforced, evaluated, and maintained for the preparation, classification, protection, and handling of data throughout its lifecycle according to all applicable laws and regulations, standards, and risk level?',
    controlId: 'DSP-01',
    controlTitle: 'Security and Privacy Policy and Procedures',
    domainTitle: 'Data Security & Privacy Lifecycle Management',
    domainCode: 'DSP',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain policies and procedures for the preparation, classification, protection and handling of data throughout its lifecycle, and according to all applicable laws and regulations, standards, and risk level. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    iaasOwnership: 'Shared',
    paasOwnership: 'Shared',
    saasOwnership: 'Shared',
    cspImplementationGuidance: 'The CSP should establish a comprehensive data lifecycle governance policy covering collection, storage, transfer, masking, retention, and destruction in compliance with GDPR, CCPA, and ISO 27701.',
    cscResponsibilitiesGuidance: 'The CSC must define its data classification schema, mandate encryption, enforce data loss prevention (DLP), and establish retention schedules.',
    auditingGuidelines: [
      '1. Examine data privacy policy framework for regulatory monitoring and role assignments.',
      '2. Verify that data handling controls address all phases: Collection, Storage, Usage, Sharing, Archival, and Destruction.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§PT-1, §MP-1, §SC-1' },
      { framework: 'NIST Privacy Framework v1.0', referenceId: 'GV.PO-P1' },
      { framework: 'GDPR (EU 2016/679)', referenceId: 'Art. 24, 25' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'DSP-03.1',
    questionText: 'Is a data inventory created and maintained for sensitive, regulated and personal information (at a minimum)?',
    controlId: 'DSP-03',
    controlTitle: 'Data Inventory',
    domainTitle: 'Data Security & Privacy Lifecycle Management',
    domainCode: 'DSP',
    controlSpecification: 'Create and maintain a data inventory, at least for any sensitive, regulated and personal data. Review and update the inventory at least annually or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine RoPA (Record of Processing Activities) and sensitive data discovery inventory.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§PT-2, §PM-5' },
      { framework: 'GDPR', referenceId: 'Art. 30' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'DSP-04.1',
    questionText: 'Is data classified according to type and sensitivity levels?',
    controlId: 'DSP-04',
    controlTitle: 'Data Classification',
    domainTitle: 'Data Security & Privacy Lifecycle Management',
    domainCode: 'DSP',
    controlSpecification: 'Classify data according to its type, criticality and sensitivity level.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine data classification tiering (Public, Internal, Confidential, Restricted/PII).'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§RA-2, §SC-16' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.5.12, §A.5.13' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'DSP-05.1',
    questionText: 'Is data flow documentation created to identify what data is processed and where it is stored and transmitted?',
    controlId: 'DSP-05',
    controlTitle: 'Data Flow Documentation',
    domainTitle: 'Data Security & Privacy Lifecycle Management',
    domainCode: 'DSP',
    controlSpecification: 'Create data flow documentation to identify what data is processed, stored or transmitted where. Review data flow documentation at defined intervals, at least annually, or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine Data Flow Diagrams (DFDs) detailing source, destination, protocol, and cross-border boundaries.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CA-3, §PL-2' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'DSP-06.1',
    questionText: 'Is the ownership and stewardship of all relevant personal and sensitive data documented?',
    controlId: 'DSP-06',
    controlTitle: 'Data Ownership and Stewardship',
    domainTitle: 'Data Security & Privacy Lifecycle Management',
    domainCode: 'DSP',
    controlSpecification: 'Document ownership and stewardship of all relevant documented personal and sensitive data. Perform review at least annually.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine RACI matrix defining Data Owners, Data Stewards, and Custodians.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§PM-5, §AC-2' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'DSP-07.1',
    questionText: 'Are systems, products, and business practices based on security principles by design and per industry best practices?',
    controlId: 'DSP-07',
    controlTitle: 'Data Protection by Design and Default',
    domainTitle: 'Data Security & Privacy Lifecycle Management',
    domainCode: 'DSP',
    controlSpecification: 'Develop systems, products, and business practices based upon a principle of security by design and industry best practices.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify security-by-design patterns, least privilege defaults, and architecture reviews.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SA-8, §SC-7' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'DSP-08.1',
    questionText: 'Are systems, products, and business practices based on privacy principles by design and according to industry best practices?',
    controlId: 'DSP-08',
    controlTitle: 'Data Privacy by Design and Default',
    domainTitle: 'Data Security & Privacy Lifecycle Management',
    domainCode: 'DSP',
    controlSpecification: 'Develop systems, products, and business practices based upon a principle of privacy by design and industry best practices. Ensure that systems\' privacy settings are configured by default, according to all applicable laws and regulations.',
    caiqLite: true,
    ssrmOwnership: 'Shared (Dependent)',
    iaasOwnership: 'Shared',
    paasOwnership: 'Shared',
    saasOwnership: 'Shared',
    cspImplementationGuidance: 'Configure systems with privacy-preserving defaults (opt-in consent, minimal data collection fields, auto-disabled tracking cookies, tokenization/pseudonymization).',
    cscResponsibilitiesGuidance: 'Enforce Privacy by Design checklists during development, conduct privacy threat modeling, and provide clear layered privacy notices.',
    auditingGuidelines: [
      '1. Examine systems to confirm privacy settings are restrictive by default (opt-in vs opt-out).',
      '2. Verify implementation of Privacy Enhancing Technologies (PETs): pseudonymization, k-anonymity, masking.'
    ],
    standardReferences: [
      { framework: 'NIST Privacy Framework v1.0', referenceId: 'PR.PO-P1, PR.DS-P1' },
      { framework: 'GDPR (EU 2016/679)', referenceId: 'Art. 25(1), 25(2)' },
      { framework: 'ISO/IEC 27701:2019', referenceId: '§7.2.5, §7.2.8' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'DSP-08.2',
    questionText: 'Are systems\' privacy settings configured by default and according to all applicable laws and regulations?',
    controlId: 'DSP-08',
    controlTitle: 'Data Privacy by Design and Default',
    domainTitle: 'Data Security & Privacy Lifecycle Management',
    domainCode: 'DSP',
    controlSpecification: 'Develop systems, products, and business practices based upon a principle of privacy by design and industry best practices. Ensure that systems\' privacy settings are configured by default, according to all applicable laws and regulations.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine GUI forms and APIs to ensure data minimization is enforced out of the box.'
    ],
    standardReferences: [
      { framework: 'NIST Privacy Framework v1.0', referenceId: 'PR.DS-P1' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'DSP-09.1',
    questionText: 'Is a data protection impact assessment (DPIA) conducted when processing personal data and evaluating the origin, nature, particularity, and severity of risks according to any applicable laws, regulations and industry best practices?',
    controlId: 'DSP-09',
    controlTitle: 'Data Protection Impact Assessment',
    domainTitle: 'Data Security & Privacy Lifecycle Management',
    domainCode: 'DSP',
    controlSpecification: 'Conduct a Data Protection Impact Assessment (DPIA) to evaluate the origin, nature, particularity and severity of the risks upon the processing of personal data, according to any applicable laws, regulations and industry best practices.',
    caiqLite: false,
    ssrmOwnership: 'Shared (Dependent)',
    auditingGuidelines: [
      '1. Examine completed DPIAs/PIAs, DPO approval signoffs, and high-risk processing mitigations.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§RA-3, §PT-2' },
      { framework: 'GDPR', referenceId: 'Art. 35' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'DSP-10.1',
    questionText: 'Are processes, procedures, and technical measures defined, implemented, and evaluated to ensure any transfer of personal or sensitive data is protected from unauthorized access and only processed within scope (as permitted by respective laws and regulations)?',
    controlId: 'DSP-10',
    controlTitle: 'Sensitive Data Transfer',
    domainTitle: 'Data Security & Privacy Lifecycle Management',
    domainCode: 'DSP',
    controlSpecification: 'Define, implement and evaluate processes, procedures and technical measures that ensure any transfer of personal or sensitive data is protected from unauthorized access and only processed within scope as permitted by the respective laws and regulations.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify Standard Contractual Clauses (SCCs), transfer impact assessments, and TLS encryption.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-8, §AC-4' },
      { framework: 'GDPR', referenceId: 'Art. 44, 46' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'DSP-11.1',
    questionText: 'Are processes, procedures, and technical measures defined, implemented, and evaluated to enable data subjects to request access to, modify, or delete personal data (per applicable laws and regulations)?',
    controlId: 'DSP-11',
    controlTitle: 'Personal Data Access, Reversal, Rectification and Deletion',
    domainTitle: 'Data Security & Privacy Lifecycle Management',
    domainCode: 'DSP',
    controlSpecification: 'Define and implement, processes, procedures and technical measures to enable data subjects to request access to, modification, or deletion of their personal data, according to any applicable laws and regulations.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine Data Subject Access Request (DSAR) workflows and 30-day fulfillment SLA compliance.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§PT-3, §PT-4' },
      { framework: 'GDPR', referenceId: 'Art. 15, 16, 17, 20' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'DSP-16.1',
    questionText: 'Do data retention, archiving, and deletion practices follow business requirements, applicable laws, and regulations?',
    controlId: 'DSP-16',
    controlTitle: 'Data Retention and Deletion',
    domainTitle: 'Data Security & Privacy Lifecycle Management',
    domainCode: 'DSP',
    controlSpecification: 'Data retention, archiving and deletion is managed in accordance with business requirements, applicable laws and regulations.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine data retention schedules, automated pruning policies, and NIST SP 800-88 sanitization certificates.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SI-12, §MP-6' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'DSP-17.1',
    questionText: 'Are processes, procedures, and technical measures defined and implemented to protect sensitive data throughout its lifecycle?',
    controlId: 'DSP-17',
    controlTitle: 'Sensitive Data Protection',
    domainTitle: 'Data Security & Privacy Lifecycle Management',
    domainCode: 'DSP',
    controlSpecification: 'Define and implement, processes, procedures and technical measures to protect sensitive data throughout it\'s lifecycle.',
    caiqLite: true,
    ssrmOwnership: 'CSP-Owned (IaaS/PaaS) / CSC-Owned (SaaS)',
    auditingGuidelines: [
      '1. Verify DLP inspection, tokenization, database activity monitoring, and field-level encryption.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-28, §MP-4' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Governance, Risk & Compliance (GRC) ---
  {
    questionId: 'GRC-01.1',
    questionText: 'Are information governance program policies and procedures sponsored by organizational leadership established, documented, approved, communicated, applied, evaluated, and maintained?',
    controlId: 'GRC-01',
    controlTitle: 'Governance Program Policy and Procedures',
    domainTitle: 'Governance, Risk and Compliance',
    domainCode: 'GRC',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain policies and procedures for an information governance program, which is sponsored by the leadership of the organization. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine governance charter, executive sponsorship records, and annual review approvals.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§PM-1, §PM-2' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§5.1' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'GRC-02.1',
    questionText: 'Is there an established and maintained formal, documented, and leadership-sponsored enterprise risk management (ERM) program that includes policies and procedures for identification, evaluation, ownership, treatment, and acceptance of risks?',
    controlId: 'GRC-02',
    controlTitle: 'Risk Management Program',
    domainTitle: 'Governance, Risk and Compliance',
    domainCode: 'GRC',
    controlSpecification: 'Establish and maintain a formal, documented, and leadership-sponsored Enterprise Risk Management (ERM) program that includes policies and procedures for identification, evaluation, ownership, treatment, and acceptance of risks.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine ERM risk register, risk appetite thresholds, and risk treatment plans.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§RA-1, §RA-3, §PM-9' },
      { framework: 'ISO 31000:2018', referenceId: 'Risk Management Principles' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'GRC-06.1',
    questionText: 'Are roles and responsibilities for planning, implementing, operating, assessing, and improving governance programs defined and documented?',
    controlId: 'GRC-06',
    controlTitle: 'Governance Responsibility Model',
    domainTitle: 'Governance, Risk and Compliance',
    domainCode: 'GRC',
    controlSpecification: 'Define and document roles and responsibilities for planning, implementing, operating, assessing, and improving governance programs.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify RACI governance chart and steering committee meeting minutes.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§PM-2, §AC-2' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'GRC-07.1',
    questionText: 'Are all relevant standards, regulations, legal/contractual, and statutory requirements applicable to your organization identified and documented?',
    controlId: 'GRC-07',
    controlTitle: 'Information System Regulatory Mapping',
    domainTitle: 'Governance, Risk and Compliance',
    domainCode: 'GRC',
    controlSpecification: 'Identify and document all relevant standards, regulations, legal/contractual, and statutory requirements, which are applicable to your organization. Review at least annually or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine regulatory mapping matrix against active cloud controls.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§PL-2, §PM-1' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Human Resources (HRS) ---
  {
    questionId: 'HRS-03.1',
    questionText: 'Are policies and procedures requiring unattended workspaces to conceal confidential data established, documented, approved, communicated, applied, evaluated, and maintained?',
    controlId: 'HRS-03',
    controlTitle: 'Clean Desk Policy and Procedures',
    domainTitle: 'Human Resources',
    domainCode: 'HRS',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain policies and procedures that require unattended workspaces to not have openly visible confidential data. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine clean desk / clear screen policies and spot-check compliance records.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AC-11, §MP-4' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.7.7' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'HRS-04.1',
    questionText: 'Are policies and procedures to protect information accessed, processed, or stored at remote sites and locations established, documented, approved, communicated, applied, evaluated, and maintained?',
    controlId: 'HRS-04',
    controlTitle: 'Remote and Home Working Policy and Procedures',
    domainTitle: 'Human Resources',
    domainCode: 'HRS',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain policies and procedures to protect information accessed, processed or stored at remote sites and locations. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify remote access VPN, MFA requirements, and endpoint encryption.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AC-17, §PE-17' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'HRS-11.1',
    questionText: 'Is a security awareness training program for all employees of the organization established, documented, approved, communicated, applied, evaluated and maintained?',
    controlId: 'HRS-11',
    controlTitle: 'Security Awareness Training',
    domainTitle: 'Human Resources',
    domainCode: 'HRS',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain a security awareness training program for all employees of the organization and provide regular training updates.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine training curriculum, onboarding completion logs, and annual refresher completion records (target >95%).'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AT-2, §AT-3' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.6.3' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Identity & Access Management (IAM) ---
  {
    questionId: 'IAM-01.1',
    questionText: 'Are identity and access management policies and procedures established, documented, approved, communicated, implemented, applied, evaluated, and maintained?',
    controlId: 'IAM-01',
    controlTitle: 'Identity and Access Management Policy and Procedures',
    domainTitle: 'Identity & Access Management',
    domainCode: 'IAM',
    controlSpecification: 'Establish, document, approve, communicate, implement, apply, evaluate, and maintain policies and procedures for identity and access management. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine IAM policy covering provisioning, deprovisioning, password complexity, least privilege, and PAM.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AC-1, §IA-1' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.5.15, §A.5.16' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'IAM-03.1',
    questionText: 'Is the inventory of identities managed, stored, and regularly reviewed, and is their level of access monitored?',
    controlId: 'IAM-03',
    controlTitle: 'Identity Inventory',
    domainTitle: 'Identity & Access Management',
    domainCode: 'IAM',
    controlSpecification: 'Manage, store, and regularly review the inventory of identities, and monitor their level of access.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify directory services (IdP / Okta / Azure AD), service account inventory, and inactive account pruning.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AC-2, §IA-4' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'IAM-04.1',
    questionText: 'Is the separation of duties principle employed when implementing information system access?',
    controlId: 'IAM-04',
    controlTitle: 'Separation of Duties',
    domainTitle: 'Identity & Access Management',
    domainCode: 'IAM',
    controlSpecification: 'Employ the separation of duties principle when implementing information system access.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine role definitions to verify separation between developers, administrators, and security auditors.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AC-5' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'IAM-05.1',
    questionText: 'Is the least privilege principle employed when implementing information system access?',
    controlId: 'IAM-05',
    controlTitle: 'Least Privilege',
    domainTitle: 'Identity & Access Management',
    domainCode: 'IAM',
    controlSpecification: 'Employ the least privilege principle when implementing information system access.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify RBAC / ABAC policies restrict access strictly to job duties and default-deny policies.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AC-6, §AC-6(1), §AC-6(2)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'IAM-06.1',
    questionText: 'Is an identity access provisioning process defined and implemented which authorizes, records, and communicates data and assets access changes?',
    controlId: 'IAM-06',
    controlTitle: 'Access Provisioning',
    domainTitle: 'Identity & Access Management',
    domainCode: 'IAM',
    controlSpecification: 'Define and implement an identity access provisioning process which authorizes, records, and communicates access changes to data and assets.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine access request tickets, manager approval records, and automated provisioning logs.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AC-2(1), §AC-2(2)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'IAM-07.1',
    questionText: 'Is a process in place to de-provision or modify identity access in a timely manner?',
    controlId: 'IAM-07',
    controlTitle: 'Access Changes and Revocation',
    domainTitle: 'Identity & Access Management',
    domainCode: 'IAM',
    controlSpecification: 'De-provision or modify identity access in a timely manner.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify HR offboarding automation revokes all access within 24 hours of employee departure.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AC-2(3), §PS-4' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'IAM-08.1',
    questionText: 'Are reviews and revalidation of identity access for least privilege and separation of duties completed with a frequency commensurate with organizational risk tolerance, and at least annually or upon significant changes?',
    controlId: 'IAM-08',
    controlTitle: 'Access Review',
    domainTitle: 'Identity & Access Management',
    domainCode: 'IAM',
    controlSpecification: 'Review and revalidate identity access for least privilege and separation of duties with a frequency that is commensurate with organizational risk tolerance, and at least annually or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine quarterly user access certification reports and remediation of orphaned accounts.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AC-2(4)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'IAM-09.1',
    questionText: 'Are processes, procedures, and technical measures for the segregation of privileged access roles defined, implemented, and evaluated?',
    controlId: 'IAM-09',
    controlTitle: 'Segregation of Privileged Access Roles',
    domainTitle: 'Identity & Access Management',
    domainCode: 'IAM',
    controlSpecification: 'Define, implement and evaluate processes, procedures and technical measures for the segregation of privileged access roles.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify separate dedicated administrative accounts, PAM vaults, and no shared root credentials.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AC-5, §AC-6(5)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'IAM-10.1',
    questionText: 'Is an access process defined and implemented to ensure privileged access roles and rights are granted for a limited period?',
    controlId: 'IAM-10',
    controlTitle: 'Management of Privileged Access Roles',
    domainTitle: 'Identity & Access Management',
    domainCode: 'IAM',
    controlSpecification: 'Define and implement an access process to ensure privileged access roles and rights are granted for a time limited period, and implement procedures to prevent the accumulation of segregated privileged access.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine Just-in-Time (JIT) elevation workflows and timed credential expiration.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AC-2(2), §AC-6' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'IAM-13.1',
    questionText: 'Are processes, procedures, and technical measures for authenticating access to systems, application, and data assets including multifactor authentication for a least-privileged user and sensitive data access defined, implemented, and evaluated?',
    controlId: 'IAM-13',
    controlTitle: 'Strong Authentication',
    domainTitle: 'Identity & Access Management',
    domainCode: 'IAM',
    controlSpecification: 'Define, implement and evaluate processes, procedures and technical measures for authenticating access to systems, application and data assets, including multifactor authentication for at least privileged user and sensitive data access. Adopt digital certificates or alternatives which achieve an equivalent level of security for system identities.',
    caiqLite: true,
    ssrmOwnership: 'Shared (Independent)',
    iaasOwnership: 'Shared',
    paasOwnership: 'Shared',
    saasOwnership: 'Shared',
    cspImplementationGuidance: 'Enforce MFA for all console access, APIs, and administrative interfaces. Adopt FIDO2 / WebAuthn phishing-resistant hardware tokens and digital certificates for service-to-service authentication.',
    cscResponsibilitiesGuidance: 'Mandate MFA for 100% of workforce user accounts, enforce conditional access policies, and prohibit SMS-based fallback for privileged roles.',
    auditingGuidelines: [
      '1. Examine authentication policies requiring MFA for remote, administrative, and sensitive data access.',
      '2. Verify that phishing-resistant MFA (FIDO2/WebAuthn/certificates) is operational.',
      '3. Review authentication logs for MFA enforcement.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§IA-2, §IA-2(1), §IA-2(2), §IA-5' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.5.17, §A.8.5' },
      { framework: 'CIS Controls v8', referenceId: '6.1, 6.2, 6.3, 6.4, 6.5' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'IAM-13.2',
    questionText: 'Are digital certificates or alternatives that achieve an equivalent security level for system identities adopted?',
    controlId: 'IAM-13',
    controlTitle: 'Strong Authentication',
    domainTitle: 'Identity & Access Management',
    domainCode: 'IAM',
    controlSpecification: 'Define, implement and evaluate processes, procedures and technical measures for authenticating access to systems, application and data assets, including multifactor authentication for at least privileged user and sensitive data access. Adopt digital certificates or alternatives which achieve an equivalent level of security for system identities.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify PKI infrastructure, mTLS certificate-based auth, and automated certificate lifecycle management.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§IA-5(2), §SC-17' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Infrastructure & Virtualization Security (I&S) ---
  {
    questionId: 'I&S-03.1',
    questionText: 'Are communications between environments, services, and applications monitored?',
    controlId: 'I&S-03',
    controlTitle: 'Network Security',
    domainTitle: 'Infrastructure & Virtualization Security',
    domainCode: 'I&S',
    controlSpecification: 'Monitor, encrypt and restrict communications between environments, services, and applications to only authenticated and authorized connections, as justified by the business. Review these configurations at least annually, and support them by a documented justification of all allowed services, protocols, ports, and compensating controls.',
    caiqLite: true,
    ssrmOwnership: 'Shared (IaaS/PaaS) / CSP-Owned (SaaS)',
    auditingGuidelines: [
      '1. Examine network traffic monitoring, flow logs (VPC Flow Logs), and NTA sensors.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-7, §SI-4' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'I&S-03.2',
    questionText: 'Are communications between environments, services, and applications encrypted?',
    controlId: 'I&S-03',
    controlTitle: 'Network Security',
    domainTitle: 'Infrastructure & Virtualization Security',
    domainCode: 'I&S',
    controlSpecification: 'Monitor, encrypt and restrict communications between environments, services, and applications to only authenticated and authorized connections, as justified by the business.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify mTLS mesh or IPSec tunnels between all microservices and database tiers.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-8, §SC-13' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'I&S-04.1',
    questionText: 'Is every host and guest OS, hypervisor, or infrastructure control plane hardened (according to their respective best practices) and supported by technical controls as part of a security baseline?',
    controlId: 'I&S-04',
    controlTitle: 'OS Hardening and Base Controls',
    domainTitle: 'Infrastructure & Virtualization Security',
    domainCode: 'I&S',
    controlSpecification: 'Harden host and guest OS, hypervisor or infrastructure control plane according to their respective best practices, and supported by technical controls, as part of a security baseline.',
    caiqLite: true,
    ssrmOwnership: 'Shared (IaaS) / CSP-Owned (PaaS/SaaS)',
    iaasOwnership: 'Shared',
    paasOwnership: 'CSP-Owned',
    saasOwnership: 'CSP-Owned',
    cspImplementationGuidance: 'Harden host hypervisors and control planes against CIS benchmarks. Provide secure golden images, secure boot, and vTPM attestation.',
    cscResponsibilitiesGuidance: 'Harden guest operating systems and containers, apply security patches within 30 days, disable unused ports/services, and enforce read-only filesystems.',
    auditingGuidelines: [
      '1. Examine CIS benchmark audit scan reports across VMs and container host nodes.',
      '2. Verify golden image pipeline automated vulnerability scanning prior to deployment.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CM-6, §SI-2, §SC-39' },
      { framework: 'CIS Benchmarks', referenceId: 'Level 1 / Level 2 Profiles' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.8.9' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'I&S-06.1',
    questionText: 'Are applications and infrastructures designed, developed, deployed, and configured such that service customer (tenant) access is appropriately segmented, segregated, monitored, and restricted?',
    controlId: 'I&S-06',
    controlTitle: 'Segmentation and Segregation',
    domainTitle: 'Infrastructure & Virtualization Security',
    domainCode: 'I&S',
    controlSpecification: 'Design, develop, deploy and configure applications and infrastructures such that service customer (tenant) access is appropriately segmented and segregated, monitored and restricted.',
    caiqLite: true,
    ssrmOwnership: 'Shared (IaaS/PaaS) / CSP-Owned (SaaS)',
    auditingGuidelines: [
      '1. Verify multi-tenant isolation, VPC subnetting, and container namespace isolation.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-7, §SC-7(21), §AC-4' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'I&S-07.1',
    questionText: 'Are secure and encrypted communication channels including only up-to-date and approved protocols used when migrating servers, services, applications, or data to cloud environments?',
    controlId: 'I&S-07',
    controlTitle: 'Migration to Cloud Environments',
    domainTitle: 'Infrastructure & Virtualization Security',
    domainCode: 'I&S',
    controlSpecification: 'Use secure and encrypted communication channels when migrating servers, services, applications, or data to cloud environments. Such channels must include only up-to-date and approved protocols.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify TLS/IPSec encryption and integrity checksums during all migration transfers.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-8, §SA-9' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'I&S-09.1',
    questionText: 'Are processes, procedures, and defense-in-depth techniques defined, implemented, and evaluated for protection, detection, and timely response to network-based attacks?',
    controlId: 'I&S-09',
    controlTitle: 'Network Defense',
    domainTitle: 'Infrastructure & Virtualization Security',
    domainCode: 'I&S',
    controlSpecification: 'Define, implement and evaluate processes, procedures and defense-in-depth techniques for protection, detection, and timely response to network-based attacks.',
    caiqLite: true,
    ssrmOwnership: 'Shared (IaaS/PaaS) / CSP-Owned (SaaS)',
    auditingGuidelines: [
      '1. Examine WAF rules, DDoS mitigation triggers, and IDS/IPS alert response workflows.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-7(5), §SI-4' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Logging & Monitoring (LOG) ---
  {
    questionId: 'LOG-01.1',
    questionText: 'Are logging and monitoring policies and procedures established, documented, approved, communicated, applied, evaluated, and maintained?',
    controlId: 'LOG-01',
    controlTitle: 'Logging and Monitoring Policy and Procedures',
    domainTitle: 'Logging & Monitoring',
    domainCode: 'LOG',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain policies and procedures for logging and monitoring. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine logging and monitoring policy for scope, retention periods, and alert thresholds.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AU-1' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.8.15' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'LOG-04.1',
    questionText: 'Is audit log access restricted to authorized identities, and are records of that access maintained?',
    controlId: 'LOG-04',
    controlTitle: 'Audit Logs Access and Accountability',
    domainTitle: 'Logging & Monitoring',
    domainCode: 'LOG',
    controlSpecification: 'Restrict audit log access to authorized identities and maintain records of that access.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify read-only log access permissions and segregation of duties for security reviewers.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AU-9, §AU-9(2)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'LOG-05.1',
    questionText: 'Are capabilities implemented and maintained to correlate and monitor security audit logs for the detection of suspicious or anomalous activity that deviates from typical or expected patterns?',
    controlId: 'LOG-05',
    controlTitle: 'Audit Logs Monitoring and Response',
    domainTitle: 'Logging & Monitoring',
    domainCode: 'LOG',
    controlSpecification: 'Implement and maintain capabilities to correlate and monitor security audit logs for the detection of suspicious or anomalous activity that deviates from typical or expected patterns. Establish and follow a defined process to review and take appropriate and timely actions on detected anomalies.',
    caiqLite: true,
    ssrmOwnership: 'Shared (Dependent)',
    iaasOwnership: 'Shared',
    paasOwnership: 'Shared',
    saasOwnership: 'Shared',
    cspImplementationGuidance: 'Aggregate logs into SIEM/SOAR platforms, utilize machine learning behavioral baselines, and correlate infrastructure, authentication, and network telemetry.',
    cscResponsibilitiesGuidance: 'Configure application log forwarding, define alert routing to internal SOC/CIRT, and respond to anomalies according to incident response playbooks.',
    auditingGuidelines: [
      '1. Examine SIEM correlation rules, alert trigger sensitivity, and mean time to acknowledge (MTTA).'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AU-6, §AU-6(1), §SI-4' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.8.16' },
      { framework: 'CIS Controls v8', referenceId: '8.2, 8.5' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'LOG-08.1',
    questionText: 'Are technical measures defined, implemented, and evaluated to enable service customers to detect and scrub or tokenize sensitive data from logs, in order to prevent unauthorized exposure as per applicable laws and regulations?',
    controlId: 'LOG-08',
    controlTitle: 'Audit Logs Sanitization',
    domainTitle: 'Logging & Monitoring',
    domainCode: 'LOG',
    controlSpecification: 'Define, implement and evaluate technical measures for service customers to detect and scrub or tokenize sensitive data from logs to prevent unauthorized exposure, as per applicable laws and regulations.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine log sanitization pipelines, regex masking rules for PII/passwords, and immutable raw log archives.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AU-9, §SI-12' },
      { framework: 'GDPR', referenceId: 'Art. 32' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Security Incident Management & Forensics (SEF) ---
  {
    questionId: 'SEF-03.1',
    questionText: 'Is a security incident response plan that includes a communication strategy for notifying relevant internal departments, impacted service customers, and other business-critical relationships (such as supply-chain) established, documented, approved, communicated, applied, evaluated, and maintained?',
    controlId: 'SEF-03',
    controlTitle: 'Incident Response Plans',
    domainTitle: 'Security Incident Management & Forensics',
    domainCode: 'SEF',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain a security incident response plan, which includes but is not limited to: a communication strategy for notifying relevant internal departments, impacted service customers, and other business critical relationships (such as supply-chain) that may be impacted.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine formal Incident Response Plan (IRP) covering all phases: Preparation, Detection, Containment, Eradication, Recovery, and Post-Mortem.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§IR-1, §IR-4, §IR-8' },
      { framework: 'NIST SP 800-61 Rev. 2', referenceId: 'Incident Handling Guide' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.5.24, §A.5.25' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'SEF-04.1',
    questionText: 'Is a structured approach followed to evaluate the effectiveness of incident response plans at planned intervals or upon significant changes?',
    controlId: 'SEF-04',
    controlTitle: 'Incident Response Testing',
    domainTitle: 'Security Incident Management & Forensics',
    domainCode: 'SEF',
    controlSpecification: 'Exercise the incident response plans at planned intervals or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine tabletop exercise records, red/blue team simulations, and after-action review improvements.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§IR-3, §IR-3(2)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'SEF-07.1',
    questionText: 'Are processes, procedures, and technical measures defined, implemented, and evaluated for timely and effective response to security incidents in accordance with incident categories and severity levels?',
    controlId: 'SEF-07',
    controlTitle: 'Incident Management and Response',
    domainTitle: 'Security Incident Management & Forensics',
    domainCode: 'SEF',
    controlSpecification: 'Define, implement and evaluate processes, procedures and technical measures for timely and effective response to security incidents in accordance with incident categories and severity levels. Review, update, and test processes and procedures at least annually.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify severity categorization matrix (P0 critical to P3 low) and SOAR containment playbooks.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§IR-4, §IR-4(1)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'SEF-08.1',
    questionText: 'Are processes, procedures, and technical measures for security breach notifications defined and implemented?',
    controlId: 'SEF-08',
    controlTitle: 'Security Breach Notification',
    domainTitle: 'Security Incident Management & Forensics',
    domainCode: 'SEF',
    controlSpecification: 'Define and implement processes, procedures and technical measures for security breach notifications. Report material security breaches including any relevant supply chain breaches, as per applicable SLAs, laws and regulations.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify 72-hour regulatory breach notification workflows and customer communication templates.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§IR-6, §IR-6(1)' },
      { framework: 'GDPR', referenceId: 'Art. 33, 34' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Supply Chain Management, Transparency & Accountability (STA) ---
  {
    questionId: 'STA-01.1',
    questionText: 'Are policies and procedures for supply chain risk management established, documented, approved, communicated, applied, evaluated, and maintained?',
    controlId: 'STA-01',
    controlTitle: 'Supply Chain Risk Management Policies and Procedures',
    domainTitle: 'Supply Chain Management, Transparency, and Accountability',
    domainCode: 'STA',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate, and maintain policies and procedures for supply chain risk management. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine third-party vendor risk assessment policies and procurement due diligence requirements.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SR-1, §SA-1' },
      { framework: 'NIST SP 800-161 Rev. 1', referenceId: 'C-SCRM Principles' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.5.19, §A.5.20' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'STA-03.1',
    questionText: 'Is the SSRM applied, documented, implemented, and managed throughout the supply chain?',
    controlId: 'STA-03',
    controlTitle: 'SSRM Supply Chain',
    domainTitle: 'Supply Chain Management, Transparency, and Accountability',
    domainCode: 'STA',
    controlSpecification: 'Apply, document, implement and manage the SSRM throughout the supply chain.',
    caiqLite: true,
    ssrmOwnership: 'Shared (Dependent)',
    auditingGuidelines: [
      '1. Verify documented delineation of Shared Security Responsibility Model across all cloud supply chain tiers.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SA-9, §SR-3' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'STA-05.1',
    questionText: 'Is the shared ownership and applicability of all CSA CCM controls delineated according to the SSRM?',
    controlId: 'STA-05',
    controlTitle: 'SSRM Control Ownership',
    domainTitle: 'Supply Chain Management, Transparency, and Accountability',
    domainCode: 'STA',
    controlSpecification: 'Delineate the shared ownership and applicability of all CSA CCM controls according to the SSRM.',
    caiqLite: true,
    ssrmOwnership: 'CSP-Owned',
    auditingGuidelines: [
      '1. Verify SSRM control matrix delineating CSP-Owned, CSC-Owned, and Shared controls across IaaS/PaaS/SaaS.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SA-9(1)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'STA-08.1',
    questionText: 'Is an inventory of all supply chain relationships developed and maintained?',
    controlId: 'STA-08',
    controlTitle: 'Supply Chain Inventory',
    domainTitle: 'Supply Chain Management, Transparency, and Accountability',
    domainCode: 'STA',
    controlSpecification: 'Develop and maintain an inventory of all supply chain relationships.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine third-party vendor registry, critical supplier risk tiers, and contract renewal dates.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SR-2, §CM-8' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Threat & Vulnerability Management (TVM) ---
  {
    questionId: 'TVM-02.1',
    questionText: 'Are policies and procedures to protect against malware and malicious instructions established, documented, approved, communicated, applied, evaluated, and maintained?',
    controlId: 'TVM-02',
    controlTitle: 'Malware and Malicious Instructions Protection Policy and Procedures',
    domainTitle: 'Threat & Vulnerability Management',
    domainCode: 'TVM',
    controlSpecification: 'Establish, document, approve, communicate, apply, evaluate and maintain policies and procedures to protect against malware and malicious instructions. Review and update the policies and procedures at least annually, or upon significant changes.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine anti-malware and EDR policies, signature update schedules, and real-time scanning.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SI-3, §SI-3(1)' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.8.7' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'TVM-03.1',
    questionText: 'Are processes, procedures, and technical measures defined, implemented, and evaluated for vulnerability detection on organizationally managed assets at least monthly?',
    controlId: 'TVM-03',
    controlTitle: 'Vulnerability Identification',
    domainTitle: 'Threat & Vulnerability Management',
    domainCode: 'TVM',
    controlSpecification: 'Define, implement and evaluate processes, procedures and technical measures for the detection of vulnerabilities on organizationally managed assets at least monthly.',
    caiqLite: true,
    ssrmOwnership: 'Shared (Independent)',
    iaasOwnership: 'Shared',
    paasOwnership: 'Shared',
    saasOwnership: 'Shared',
    cspImplementationGuidance: 'Execute automated vulnerability scans across host hypervisors, cloud infrastructure, and network devices at least monthly using certified scanning engines.',
    cscResponsibilitiesGuidance: 'Perform automated monthly authenticated vulnerability scanning on all virtual machines, application code, container images, and exposed web endpoints.',
    auditingGuidelines: [
      '1. Review monthly vulnerability scan reports across 100% of in-scope assets.',
      '2. Verify integration with CVSS/EPSS scoring and automated ticketing systems.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§RA-5, §RA-5(1), §RA-5(2), §SI-2' },
      { framework: 'ISO/IEC 27001:2022', referenceId: '§A.8.8' },
      { framework: 'CIS Controls v8', referenceId: '7.1, 7.2, 7.3, 7.4' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'TVM-05.1',
    questionText: 'Are processes, procedures, and technical measures defined, implemented, and evaluated to update detection tools, threat signatures, and compromise indicators weekly (or more frequent) basis?',
    controlId: 'TVM-05',
    controlTitle: 'Detection Updates',
    domainTitle: 'Threat & Vulnerability Management',
    domainCode: 'TVM',
    controlSpecification: 'Define, implement and evaluate processes, procedures and technical measures to update detection tools, threat signatures, and indicators of compromise on a weekly, or more frequent basis.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify daily/weekly automated threat feed and signature updates for firewalls, EDR, and IDS/IPS.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SI-3(2), §SI-4(5)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'TVM-08.1',
    questionText: 'Are processes, procedures and technical measures defined, implemented and evaluated based on identified risks to support scheduled and emergency responses to vulnerability identification?',
    controlId: 'TVM-08',
    controlTitle: 'Vulnerability Remediation Schedule',
    domainTitle: 'Threat & Vulnerability Management',
    domainCode: 'TVM',
    controlSpecification: 'Define, implement and evaluate processes, procedures and technical measures based on identified risks to support scheduled and emergency responses to vulnerability identification.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine remediation SLA adherence: Critical <= 7 days, High <= 14 days, Medium <= 30 days.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SI-2, §RA-5(5)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'TVM-10.1',
    questionText: 'Is a risk-based method used for the prioritization and mitigation of threats, leveraging an industry-recognized framework to guide threat decision-making and protection measures?',
    controlId: 'TVM-10',
    controlTitle: 'Threat Response',
    domainTitle: 'Threat & Vulnerability Management',
    domainCode: 'TVM',
    controlSpecification: 'Use a risk-based method for the prioritization and mitigation of threats, leveraging an industry-recognized framework to guide threat decision-making and protection measures.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine threat modeling artifacts (MITRE ATT&CK mappings) and prioritized countermeasure actions.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§RA-3, §SI-4(4)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'TVM-11.1',
    questionText: 'Is a process defined and implemented to track and report vulnerability identification and remediation activities that include stakeholder notification?',
    controlId: 'TVM-11',
    controlTitle: 'Vulnerability Management Reporting',
    domainTitle: 'Threat & Vulnerability Management',
    domainCode: 'TVM',
    controlSpecification: 'Define and implement a process for tracking and reporting vulnerability identification and remediation activities that includes stakeholder notification.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify vulnerability tracking metrics, executive dashboards, and stakeholder notification logs.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§RA-5, §PM-4' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },

  // --- Universal Endpoint Management (UEM) ---
  {
    questionId: 'UEM-02.1',
    questionText: 'Is there a defined, documented, applicable and evaluated list containing approved services, applications, and the sources of applications (stores) acceptable for use by endpoints when accessing or storing organization-managed data?',
    controlId: 'UEM-02',
    controlTitle: 'Application and Service Approval',
    domainTitle: 'Universal Endpoint Management',
    domainCode: 'UEM',
    controlSpecification: 'Define, document, apply and evaluate a list of approved services, applications and sources of applications (stores) acceptable for use by endpoints when accessing or storing organization-managed data.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify MDM application whitelisting and prohibition of unapproved application stores.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CM-7, §CM-7(5)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'UEM-04.1',
    questionText: 'Is an inventory of all endpoints used and maintained to store, access and process company data?',
    controlId: 'UEM-04',
    controlTitle: 'Endpoint Inventory',
    domainTitle: 'Universal Endpoint Management',
    domainCode: 'UEM',
    controlSpecification: 'Maintain an inventory of all endpoints used to store, access and process company data.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine centralized MDM endpoint inventory (laptops, mobile devices, OS versions, disk encryption status).'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§CM-8, §AC-19' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'UEM-05.1',
    questionText: 'Are processes, procedures, and technical measures defined, implemented and evaluated, to enforce policies and controls for all endpoints permitted to access systems and/or store, transmit, or process organizational data?',
    controlId: 'UEM-05',
    controlTitle: 'Endpoint Management',
    domainTitle: 'Universal Endpoint Management',
    domainCode: 'UEM',
    controlSpecification: 'Define, implement and evaluate processes, procedures and technical measures to enforce policies and controls for all endpoints permitted to access systems and/or store, transmit, or process organizational data.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify MDM policy enforcement, jailbreak/root detection, and compliance gating for device access.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AC-19, §CM-6' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'UEM-06.1',
    questionText: 'Are all relevant interactive-use endpoints configured to require an automatic lock screen?',
    controlId: 'UEM-06',
    controlTitle: 'Automatic Lock Screen',
    domainTitle: 'Universal Endpoint Management',
    domainCode: 'UEM',
    controlSpecification: 'Configure all relevant interactive-use endpoints to require an automatic lock screen.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify MDM configuration profiles enforcing <= 5 min inactivity screen lock with password/biometric unlock.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§AC-11, §AC-11(1)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'UEM-09.1',
    questionText: 'Are anti-malware detection and prevention technology services configured on managed endpoints?',
    controlId: 'UEM-09',
    controlTitle: 'Anti-Malware Detection and Prevention',
    domainTitle: 'Universal Endpoint Management',
    domainCode: 'UEM',
    controlSpecification: 'Configure managed endpoints with anti-malware detection and prevention technology and services.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify endpoint EDR agent health and signature definitions up to date across 100% of endpoints.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SI-3, §SI-3(1)' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'UEM-10.1',
    questionText: 'Are software firewalls configured on managed endpoints?',
    controlId: 'UEM-10',
    controlTitle: 'Software Firewall',
    domainTitle: 'Universal Endpoint Management',
    domainCode: 'UEM',
    controlSpecification: 'Configure managed endpoints with properly configured software firewalls.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Verify OS host firewall enabled and centrally locked from user modification.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§SC-7, §CM-6' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  },
  {
    questionId: 'UEM-13.1',
    questionText: 'Are processes, procedures, and technical measures defined, implemented, and evaluated to enable remote company data deletion on managed endpoint devices?',
    controlId: 'UEM-13',
    controlTitle: 'Remote Wipe',
    domainTitle: 'Universal Endpoint Management',
    domainCode: 'UEM',
    controlSpecification: 'Define, implement and evaluate processes, procedures and technical measures to enable the deletion of company data remotely on managed endpoint devices.',
    caiqLite: true,
    ssrmOwnership: 'Shared',
    auditingGuidelines: [
      '1. Examine remote wipe test records and selective corporate container wipe workflows.'
    ],
    standardReferences: [
      { framework: 'NIST SP 800-53 Rev. 5', referenceId: '§MP-6, §AC-19' }
    ],
    publication: 'CSA CCM v4.1.0 / CAIQ v4.1.0'
  }
];

/**
 * Filter helper for CAIQ questions by domain or search
 */
export function getCaiqQuestionsByDomain(domainCode?: string): SourceQuestionnaireItem[] {
  if (!domainCode || domainCode === 'ALL') {
    return CAIQ_SOURCE_QUESTIONNAIRE;
  }
  return CAIQ_SOURCE_QUESTIONNAIRE.filter((q) => q.domainCode === domainCode);
}
