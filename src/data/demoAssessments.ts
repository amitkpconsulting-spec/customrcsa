import { RCSAPayload, RCSADomainType, RiskDomain, SectorType, AssessedControl, AIRemediationItem } from '../types';
import { NIST_CONTROLS_CATALOG, getControlsForRCSADomain } from './nistControls';
import { calculateControlRisk } from '../utils/riskCalculations';
import { seedInitialVersionHistory } from '../utils/versionTracker';

export interface RCSAPresetDefinition {
  id: string;
  name: string;
  sector: SectorType;
  rcsaDomain: RCSADomainType;
  selectedDomains: RiskDomain[];
  system: string;
  businessUnit: string;
  assessorName: string;
  reviewCycle: string;
  complianceTarget: string;
  systemImpactLevel: 'Low' | 'Moderate' | 'High';
  description: string;
  baselineDEFModifier?: number;
  customFindings?: Record<string, { de: number; oe: number; defPenalty: number; gaps: string; evidence: string }>;
  customRoadmap?: AIRemediationItem[];
}

export const MULTI_SECTOR_RCSA_PRESETS: RCSAPresetDefinition[] = [
  // ==================== 1. BANKING & FINANCIAL SERVICES (5 PRESETS) ====================
  {
    id: 'fin-core-banking',
    name: 'Tier-1 Core Banking Enclave & Real-Time Payment Rails RCSA',
    sector: 'Financial',
    rcsaDomain: 'All',
    selectedDomains: ['Cybersecurity', 'Information Security', 'Governance'],
    system: 'FedWire / ACH Real-Time Clearing Engine & Core Ledger',
    businessUnit: 'Global Transaction Banking & Payments Operations',
    assessorName: 'Marcus Vance (Senior Director of Cyber Risk)',
    reviewCycle: 'Q3 2026 FFIEC Formal Examination',
    complianceTarget: 'FFIEC Cat-1 / NYDFS 500 / PCI-DSS v4.0 / GLBA Baseline',
    systemImpactLevel: 'High',
    description: 'High-assurance evaluation of high-value interbank transfer rails, dual-authorization enforcement, HSM transaction signing, and immutable audit logging.',
    baselineDEFModifier: 0.05,
    customFindings: {
      'AC-2': {
        de: 0.95,
        oe: 0.9,
        defPenalty: 0.0,
        gaps: '',
        evidence: 'Active Directory + CyberArk PAM with 4-hour dynamic checkout tokens and hardware YubiKey MFA.',
      },
      'SC-7': {
        de: 0.95,
        oe: 0.95,
        defPenalty: 0.0,
        gaps: '',
        evidence: 'Micro-segmented payment enclave protected by redundant Palo Alto PA-5450 firewalls with strict zero-trust ingress filtering.',
      },
      'SR-4': {
        de: 0.7,
        oe: 0.5,
        defPenalty: 0.2,
        gaps: 'Third-party SWIFT messaging components lack real-time binary provenance verification in secondary DR site.',
        evidence: 'Annual vendor SOC 2 review on file; SBOM ingestion currently running in staging.',
      },
    },
    customRoadmap: [
      {
        id: 'rem-fin-1',
        priority: 'P0_IMMEDIATE',
        targetControl: 'SR-4',
        controlTitle: 'Supply Chain Provenance & SWIFT Connector Attestation',
        domain: 'Information Security',
        gapSummary: 'Secondary DR messaging gateways lack cryptographically signed SBOM validation.',
        technicalRemediationAction: 'Enforce Sigstore Cosign verification at container admission and automate real-time vendor attestation scans.',
        compensatingControl: 'Daily manual code hash audits and network anomaly heuristics.',
        estimatedResidualReduction: 8.4,
        implementationTimeline: '2 Weeks',
        validationCriteria: 'Zero unverified artifacts allowed into payment cluster.',
        assignedTo: 'SecOps & Payment Core Engineering',
        dueDate: '2026-09-15',
        status: 'IN_PROGRESS',
      },
      {
        id: 'rem-fin-2',
        priority: 'P1_HIGH',
        targetControl: 'AU-6',
        controlTitle: 'Real-Time WORM Transaction Audit Telemetry',
        domain: 'Cybersecurity',
        gapSummary: 'Secondary transaction logs queued with up to 15-minute sync latency to immutable Splunk cloud vault.',
        technicalRemediationAction: 'Deploy Kafka streaming replication with Kafka-to-S3 Object Lock legal hold in compliant WORM mode.',
        compensatingControl: 'Local encrypted NVMe buffer with integrity checksums.',
        estimatedResidualReduction: 6.1,
        implementationTimeline: '30 Days',
        validationCriteria: 'Sub-second immutable log attestation confirmed via automated synthetic testing.',
        assignedTo: 'Data Engineering & Cloud Infrastructure',
        dueDate: '2026-09-30',
        status: 'OPEN',
      },
    ],
  },
  {
    id: 'fin-hft-gateway',
    name: 'Global High-Frequency Trading & Market Gateway Platform RCSA',
    sector: 'Financial',
    rcsaDomain: 'Cybersecurity',
    selectedDomains: ['Cybersecurity', 'Governance'],
    system: 'Ultra-Low-Latency Order Execution & Direct Market Access (DMA) Mesh',
    businessUnit: 'Quantitative Trading & Algorithmic Execution Infrastructure',
    assessorName: 'Elena Rostova (Principal Financial Cyber Engineer)',
    reviewCycle: 'Q3 2026 Algorithmic Safeguards Audit',
    complianceTarget: 'SEC Rule 15c3-5 / FINRA / CFTC System Safeguards',
    systemImpactLevel: 'High',
    description: 'Specialized assessment of sub-millisecond market execution networks, FPGA boundary controls, risk kill-switch telemetry, and insider threat isolation.',
    baselineDEFModifier: 0.08,
    customFindings: {
      'SC-7': {
        de: 0.95,
        oe: 0.9,
        defPenalty: 0.05,
        gaps: 'Co-location fiber cross-connects require automated optical tap encryption verification.',
        evidence: 'Arista 7130 FPGA deterministic risk filters with hardware kill-switches.',
      },
      'IA-2': {
        de: 0.9,
        oe: 0.85,
        defPenalty: 0.0,
        gaps: '',
        evidence: 'FIDO2 biometric tokens enforced for all algorithmic deployment pipelines.',
      },
    },
  },
  {
    id: 'fin-cardholder-cde',
    name: 'FinTech Cardholder Data Environment & Tokenization Vault RCSA',
    sector: 'Financial',
    rcsaDomain: 'Information Security',
    selectedDomains: ['Information Security', 'Privacy'],
    system: 'Credit Card Tokenization Vault & Multi-Currency Settlement API',
    businessUnit: 'Merchant Acquiring & Cardholder Security Unit',
    assessorName: 'David Chen (QSA & Lead FinTech Auditor)',
    reviewCycle: 'Annual PCI-DSS v4.0 Assessment Cycle',
    complianceTarget: 'PCI-DSS v4.0 Level 1 Service Provider / ISO 27001',
    systemImpactLevel: 'High',
    description: 'Cardholder Data Environment (CDE) segmentation, dynamic format-preserving tokenization (FPE), dual-custody cryptographic keys, and automated key rotation.',
  },
  {
    id: 'fin-wealth-privacy',
    name: 'Private Wealth Management & HNW Client PII Vault RCSA',
    sector: 'Financial',
    rcsaDomain: 'Privacy',
    selectedDomains: ['Privacy', 'Governance'],
    system: 'Wealth Advisory Portal, Trust Accounting & Investor CRM',
    businessUnit: 'Private Banking & Global Client Privacy Directorate',
    assessorName: 'Claire Beaumont (Global Data Protection Officer)',
    reviewCycle: 'Bi-Annual Privacy Impact Assessment (PIA)',
    complianceTarget: 'GLBA Safeguards / GDPR Art. 35 / CCPA / Swiss FADP',
    systemImpactLevel: 'High',
    description: 'Privacy framework controls for Ultra-High-Net-Worth financial portfolios, cross-border banking secrecy regulations, and investor consent telemetry.',
  },
  {
    id: 'fin-interbank-swift',
    name: 'Interbank Cross-Border Settlement & SWIFT CSP Architecture RCSA',
    sector: 'Financial',
    rcsaDomain: 'All',
    selectedDomains: ['Privacy', 'Information Security', 'Cybersecurity', 'Governance'],
    system: 'SWIFT Alliance Access Gateway & ISO 20022 Financial Messaging Hub',
    businessUnit: 'International Treasury & Liquidity Clearing Division',
    assessorName: 'Jonathan Sterling (SWIFT CSP Certified Lead Assessor)',
    reviewCycle: 'Q3 2026 SWIFT Customer Security Programme Mandatory Attestation',
    complianceTarget: 'SWIFT CSP v2026 / BCBS 239 / CPMI-IOSCO Standards',
    systemImpactLevel: 'High',
    description: 'Comprehensive 20-family assessment of dedicated SWIFT operating zones, hardware security modules (HSM), multi-factor bastion hosts, and strict physical air-gaps.',
  },

  // ==================== 2. HEALTHCARE & LIFE SCIENCES (4 PRESETS) ====================
  {
    id: 'health-ehr-telemetry',
    name: 'CarePulse Enterprise EHR & Clinical Telemetry Cloud RCSA',
    sector: 'Healthcare',
    rcsaDomain: 'All',
    selectedDomains: ['Information Security', 'Privacy', 'Cybersecurity'],
    system: 'Epic/Cerner Integrated EHR & Real-Time Patient Vitals Cloud',
    businessUnit: 'Clinical Informatics & Healthcare IT Infrastructure',
    assessorName: 'Dr. Rachel Adams (Chief Healthcare Compliance Officer)',
    reviewCycle: 'FY2026 Comprehensive HIPAA & HITECH Review',
    complianceTarget: 'HIPAA Security & Privacy Rules / HITECH Act / NIST SP 800-66 Rev. 2',
    systemImpactLevel: 'High',
    description: 'Electronic Protected Health Information (ePHI) governance, emergency break-glass audit trails, clinical workstation timeout policies, and HL7/FHIR API security.',
    customFindings: {
      'PT-2': {
        de: 0.9,
        oe: 0.8,
        defPenalty: 0.05,
        gaps: 'Patient consent telemetry for clinical trial secondary use requires real-time FHIR consent resource updates.',
        evidence: 'FHIR v4.0.1 Consent API integrated with Epic EHR backend.',
      },
      'SC-28': {
        de: 0.95,
        oe: 0.9,
        defPenalty: 0.0,
        gaps: '',
        evidence: 'AWS KMS envelope encryption with Customer Managed Keys (CMK) and FIPS 140-3 HSM root of trust.',
      },
    },
    customRoadmap: [
      {
        id: 'rem-health-1',
        priority: 'P0_IMMEDIATE',
        targetControl: 'PT-4',
        controlTitle: 'ePHI De-Identification & Clinical Research Export Masking',
        domain: 'Privacy',
        gapSummary: 'Exported research datasets require automated Safe Harbor statistical validation.',
        technicalRemediationAction: 'Implement automated k-anonymity and differential privacy transformation in Snowflake clinical data warehouse.',
        compensatingControl: 'Manual Institutional Review Board (IRB) signoff on all dataset releases.',
        estimatedResidualReduction: 7.8,
        implementationTimeline: '3 Weeks',
        validationCriteria: 'Zero direct patient identifiers present in clinical analytics queries.',
        assignedTo: 'Healthcare Data Governance & Biostatistics Team',
        dueDate: '2026-09-20',
        status: 'IN_PROGRESS',
      },
    ],
  },
  {
    id: 'health-genomics-datalake',
    name: 'Genomics Diagnostic Data Lake & Next-Gen Sequencing RCSA',
    sector: 'Healthcare',
    rcsaDomain: 'Privacy',
    selectedDomains: ['Privacy', 'Governance'],
    system: 'Petabyte-Scale Genomic Variant Repository & Precision Oncology Pipeline',
    businessUnit: 'Molecular Genetics & Precision Medicine Directorate',
    assessorName: 'Dr. Sanjay Kulkarni (Director of Genomic Privacy & Bioethics)',
    reviewCycle: 'Q3 2026 Life Sciences Compliance Review',
    complianceTarget: 'GDPR Genetic Data Safeguards / GINA / FDA 21 CFR Part 11',
    systemImpactLevel: 'High',
    description: 'Strict privacy and access governance for whole-genome sequencing (WGS) data, donor re-identification defenses, and biobank sample chain of custody.',
  },
  {
    id: 'health-iomt-mesh',
    name: 'Hospital IoMT Smart Medical Device Mesh & ICU Telemetry RCSA',
    sector: 'Healthcare',
    rcsaDomain: 'Cybersecurity',
    selectedDomains: ['Cybersecurity', 'Information Security'],
    system: 'Intelligent Infusion Pumps, ICU Patient Monitors & Medical IoT Gateways',
    businessUnit: 'Biomedical Engineering & Hospital Clinical SecOps',
    assessorName: 'Thomas Wright (Lead Medical Device Security Engineer)',
    reviewCycle: 'Q3 2026 Medical Device Cybersecurity Audit',
    complianceTarget: 'FDA Medical Device Cybersecurity Guidance / NIST SP 800-53 / ISO 13485',
    systemImpactLevel: 'High',
    description: 'Medical device firmware integrity, 802.1X device certificates, hospital VLAN micro-segmentation, and zero-day threat isolation for life-critical patient hardware.',
  },
  {
    id: 'health-telehealth-portal',
    name: 'Telehealth Video Consultation & E-Prescription Gateway RCSA',
    sector: 'Healthcare',
    rcsaDomain: 'Information Security',
    selectedDomains: ['Information Security', 'Privacy'],
    system: 'WebRTC HIPAA-Compliant Video Consultations & Surescripts Pharmacy Rail',
    businessUnit: 'Digital Health & Virtual Patient Care Division',
    assessorName: 'Maya Lin (Healthcare IT Security Manager)',
    reviewCycle: 'Bi-Annual Digital Health Assessment',
    complianceTarget: 'HIPAA Omnibus Rule / DEA EPCS (Electronic Prescriptions) Standards',
    systemImpactLevel: 'Moderate',
    description: 'Peer-to-peer WebRTC video stream encryption, two-factor DEA-compliant biometric signature verification for controlled substances, and digital prescription tracking.',
  },

  // ==================== 3. RETAIL & E-COMMERCE (3 PRESETS) ====================
  {
    id: 'retail-ecom-checkout',
    name: 'Omnichannel Global E-Commerce & Checkout Engine RCSA',
    sector: 'Retail',
    rcsaDomain: 'All',
    selectedDomains: ['Cybersecurity', 'Information Security', 'Privacy'],
    system: 'High-Volume Checkout Microservices, Cart Engine & Payment Gateway',
    businessUnit: 'Global Digital Commerce & Consumer Platforms',
    assessorName: 'Kevin O’Connor (VP of Retail Risk & Information Security)',
    reviewCycle: 'Q3 2026 Peak Season Readiness & PCI Audit',
    complianceTarget: 'PCI-DSS v4.0 / CCPA/CPRA / FTC Safeguards Rule / ISO 27001',
    systemImpactLevel: 'High',
    description: 'Protection against Magecart/e-skimming, script integrity monitoring (PCI 6.4.3), bot protection, fraud score modeling, and consumer privacy consent.',
    customRoadmap: [
      {
        id: 'rem-ret-1',
        priority: 'P0_IMMEDIATE',
        targetControl: 'SI-4',
        controlTitle: 'E-Commerce Client-Side Script Integrity & Tamper Defense',
        domain: 'Cybersecurity',
        gapSummary: 'Third-party analytics tags running on checkout page require automated CSP and Subresource Integrity (SRI) hashes.',
        technicalRemediationAction: 'Implement strict Content Security Policy (CSP) with nonce generation and automated tag sandboxing in Akamai Edge.',
        compensatingControl: 'Daily automated DOM mutation scanning and client anomaly alerts.',
        estimatedResidualReduction: 9.1,
        implementationTimeline: '10 Days',
        validationCriteria: '100% of external JavaScript assets cryptographically signed and hash-verified.',
        assignedTo: 'Web Platform & Frontend Security Lead',
        dueDate: '2026-09-10',
        status: 'IN_PROGRESS',
      },
    ],
  },
  {
    id: 'retail-logistics-iot',
    name: 'Automated Fulfillment Warehouses & Supply Chain IoT RCSA',
    sector: 'Retail',
    rcsaDomain: 'Information Security',
    selectedDomains: ['Information Security', 'Governance'],
    system: 'Warehouse Robotics, Automated Sorting Conveyors & Inventory ERP',
    businessUnit: 'Global Supply Chain, Logistics & Fulfillment Operations',
    assessorName: 'Samantha Green (Supply Chain Risk Director)',
    reviewCycle: 'Q3 2026 Operational Resilience Audit',
    complianceTarget: 'ISO/IEC 27001:2022 / NIST CSF 2.0 / TAPA FSR Standards',
    systemImpactLevel: 'Moderate',
    description: 'Robotic fleet automation security, warehouse wireless mesh encryption, RFID telemetry protection, and contingency fulfillment rerouting.',
  },
  {
    id: 'retail-loyalty-privacy',
    name: 'Customer Loyalty Rewards & Personalized Recommendation Engine RCSA',
    sector: 'Retail',
    rcsaDomain: 'Privacy',
    selectedDomains: ['Privacy', 'Governance'],
    system: 'Consumer Loyalty Vault, Behavioral Tracking & Marketing ML Pipeline',
    businessUnit: 'Customer Experience, Loyalty Marketing & Privacy Office',
    assessorName: 'Nathaniel Reed (Privacy & Consumer Trust Counsel)',
    reviewCycle: 'Annual Consumer Privacy Assessment',
    complianceTarget: 'CPRA / Virginia VCDPA / Colorado CPA / FTC Consumer Protection',
    systemImpactLevel: 'Moderate',
    description: 'Consumer behavioral data collection, dark pattern elimination, right-to-delete workflows, and machine learning personalization consent mechanisms.',
  },

  // ==================== 4. SAAS & ENTERPRISE SOFTWARE (4 PRESETS) ====================
  {
    id: 'tech-b2b-saas',
    name: 'Multi-Tenant B2B Enterprise SaaS & Microservices Mesh RCSA',
    sector: 'Technology',
    rcsaDomain: 'All',
    selectedDomains: ['Privacy', 'Information Security', 'Cybersecurity', 'Governance'],
    system: 'Multi-Tenant Cloud SaaS Platform, Kubernetes Service Mesh & Global APIs',
    businessUnit: 'Cloud Platform Engineering, Product Security & SRE',
    assessorName: 'Amit Patel (Principal Risk Assessor & Lead Cloud Architect)',
    reviewCycle: 'Q3 2026 SOC 2 Type II & ISO 27001 Surveillance Cycle',
    complianceTarget: 'SOC 2 Type II (All 5 Trust Criteria) / ISO/IEC 27001:2022 / CCPA',
    systemImpactLevel: 'High',
    description: 'Multi-tenancy logical database isolation, zero-trust Istio service mesh mTLS, sub-processor vendor management, and automated DevSecOps telemetry.',
    customFindings: {
      'AC-2': {
        de: 0.9,
        oe: 0.75,
        defPenalty: 0.1,
        gaps: 'Orphaned contractor service accounts in secondary developer staging clusters require automated weekly pruning.',
        evidence: 'Okta SCIM automated provisioning integrated with HRIS; Terraform infrastructure-as-code account provisioning.',
      },
      'SR-4': {
        de: 0.85,
        oe: 0.7,
        defPenalty: 0.15,
        gaps: 'SBOM container signatures verified in production; staging cluster allows unsigned developer experimental images.',
        evidence: 'GitHub Actions CycloneDX SBOM generator active; Kyverno policy enforcing signatures in production namespace.',
      },
    },
    customRoadmap: [
      {
        id: 'rem-tech-1',
        priority: 'P0_IMMEDIATE',
        targetControl: 'SR-4',
        controlTitle: 'Universal Cryptographic SBOM Attestation in All Environments',
        domain: 'Information Security',
        gapSummary: 'Staging namespaces lack mandatory Sigstore cosign policy enforcement.',
        technicalRemediationAction: 'Update Kyverno Admission Controller to require Cosign signatures and SLSA provenance across all cluster namespaces.',
        compensatingControl: 'Daily automated Trivy container image scanning.',
        estimatedResidualReduction: 8.7,
        implementationTimeline: '1-2 Weeks',
        validationCriteria: '100% blocked unverified deployments across all Kubernetes clusters.',
        assignedTo: 'Platform SecOps & Cloud Infrastructure Lead',
        dueDate: '2026-09-12',
        status: 'IN_PROGRESS',
      },
    ],
  },
  {
    id: 'tech-ai-inference',
    name: 'Generative AI & LLM Inference Cloud Infrastructure RCSA',
    sector: 'Technology',
    rcsaDomain: 'Cybersecurity',
    selectedDomains: ['Cybersecurity', 'Privacy', 'Governance'],
    system: 'GPU Supercluster, LLM Fine-Tuning Pipeline & Real-Time Inference Gateway',
    businessUnit: 'Artificial Intelligence Research & AI Safety Directorate',
    assessorName: 'Dr. Zachary Thorne (Lead AI Security & Safety Auditor)',
    reviewCycle: 'Q3 2026 AI Safety & Governance Assessment',
    complianceTarget: 'NIST AI Risk Management Framework (AI RMF 1.0) / ISO/IEC 42001 / EU AI Act',
    systemImpactLevel: 'High',
    description: 'Prompt injection mitigation, training data PII scrubbing, model weight exfiltration defenses, red-teaming telemetry, and GPU cluster multi-tenancy isolation.',
  },
  {
    id: 'tech-devsecops-sbom',
    name: 'Continuous DevSecOps CI/CD & SBOM Supply Chain Enclave RCSA',
    sector: 'Technology',
    rcsaDomain: 'Information Security',
    selectedDomains: ['Information Security', 'Governance'],
    system: 'Enterprise GitHub Enterprise, Artifact Registry & Deployment Pipelines',
    businessUnit: 'Developer Experience, Build Engineering & SecOps',
    assessorName: 'Devon Miller (Director of Application Security)',
    reviewCycle: 'Bi-Annual Software Supply Chain Review',
    complianceTarget: 'OpenSSF Scorecard / SLSA Level 3 Framework / NIST SP 800-218 (SSDF)',
    systemImpactLevel: 'High',
    description: 'Hermetic build environments, ephemeral runners, branch protection rules, mutual TLS developer commit signing, and dependency vulnerability SLAs.',
  },
  {
    id: 'tech-idp-zerotrust',
    name: 'Global Identity Provider (IdP) & Zero Trust Access Gateway RCSA',
    sector: 'Technology',
    rcsaDomain: 'Cybersecurity',
    selectedDomains: ['Cybersecurity', 'Information Security'],
    system: 'Cloud Identity Provider (IdP), Conditional Access Engine & SASE Mesh',
    businessUnit: 'Enterprise Identity Architecture & Cyber Defense Ops',
    assessorName: 'Leila Farrokh (Chief Identity Architect)',
    reviewCycle: 'Q3 2026 Zero Trust Architecture Review',
    complianceTarget: 'NIST SP 800-207 (Zero Trust Architecture) / FIPS 140-3',
    systemImpactLevel: 'High',
    description: 'Continuous session risk evaluation, passwordless FIDO2 WebAuthn keys, automated token revocation, and device posture compliance attestation.',
  },

  // ==================== 5. CRITICAL INFRASTRUCTURE & ENERGY (3 PRESETS) ====================
  {
    id: 'crit-scada-grid',
    name: 'National Smart Grid SCADA Telemetry & Power Distribution OT RCSA',
    sector: 'Critical_Infrastructure',
    rcsaDomain: 'All',
    selectedDomains: ['Cybersecurity', 'Information Security', 'Governance'],
    system: 'SCADA Energy Management System (EMS) & Substation RTU Telemetry Mesh',
    businessUnit: 'Power Grid Operations, OT Cybersecurity & Substation Engineering',
    assessorName: 'Colonel (Ret.) Donald Bradley (OT Cyber Lead Assessor)',
    reviewCycle: 'Q3 2026 Mandatory NERC CIP Compliance Audit',
    complianceTarget: 'NERC CIP-002 through CIP-014 / NIST SP 800-82 Rev. 3 / CISA Directives',
    systemImpactLevel: 'High',
    description: 'Purdue model Level 2/3 boundary isolation, optical unidirectional data diodes, OT serial protocol inspection, and black-start disaster recovery readiness.',
    customRoadmap: [
      {
        id: 'rem-crit-1',
        priority: 'P0_IMMEDIATE',
        targetControl: 'SC-7',
        controlTitle: 'Unidirectional Data Diode Enforcement for Substation SCADA',
        domain: 'Cybersecurity',
        gapSummary: 'Legacy backup serial links in two regional substations require hardware air-gap diode upgrades.',
        technicalRemediationAction: 'Install Owl Cyber Defense hardware data diodes with physical photo-emitter isolation.',
        compensatingControl: 'Continuous physical security patrols and localized offline logging.',
        estimatedResidualReduction: 9.6,
        implementationTimeline: '2 Weeks',
        validationCriteria: 'Absolute hardware mathematical impossibility of reverse packet flow confirmed.',
        assignedTo: 'Substation Engineering & OT SecOps',
        dueDate: '2026-09-05',
        status: 'IN_PROGRESS',
      },
    ],
  },
  {
    id: 'crit-nuclear-safety',
    name: 'Nuclear Generation Plant Digital Safety & Reactor Control Mesh RCSA',
    sector: 'Critical_Infrastructure',
    rcsaDomain: 'Cybersecurity',
    selectedDomains: ['Cybersecurity', 'Governance', 'Information Security'],
    system: 'Digital Instrumentation and Control (DI&C) & Reactor Protection System (RPS)',
    businessUnit: 'Nuclear Cyber Security Directorate & Plant Operations',
    assessorName: 'Dr. Gregory Vance (Nuclear Cyber Security Inspector)',
    reviewCycle: 'Annual NRC Cyber Security Inspection',
    complianceTarget: 'NRC 10 CFR 73.54 / NEI 08-09 Rev. 6 / IAEA Nuclear Security Series',
    systemImpactLevel: 'High',
    description: 'Air-gapped reactor safety instrumentation, analog bypass isolation, supply chain component X-ray analysis, and 100% isolated software update kiosks.',
  },
  {
    id: 'crit-water-pipeline',
    name: 'Municipal Water Treatment & Pipeline SCADA Enclave RCSA',
    sector: 'Critical_Infrastructure',
    rcsaDomain: 'Information Security',
    selectedDomains: ['Information Security', 'Cybersecurity'],
    system: 'Water Filtration SCADA, Chemical Dosing PLC Controllers & Remote Pumps',
    businessUnit: 'Water Works Authority & Operational Technology Department',
    assessorName: 'Mark Higgins (Municipal Infrastructure Risk Auditor)',
    reviewCycle: 'FY2026 EPA Risk Assessment Cycle',
    complianceTarget: 'America’s Water Infrastructure Act (AWIA Section 2013) / CISA Water Sector Guidance',
    systemImpactLevel: 'High',
    description: 'PLC chemical dosing tamper limits, physical pump telemetry isolation, cellular backup failover encryption, and emergency municipal boil-water alert systems.',
  },

  // ==================== 6. FEDERAL, DEFENSE & GOVCLOUD (3 PRESETS) ====================
  {
    id: 'def-dod-il6',
    name: 'DoD Impact Level 6 (IL6) Classified Secret GovCloud RCSA',
    sector: 'Defense',
    rcsaDomain: 'All',
    selectedDomains: ['Privacy', 'Information Security', 'Cybersecurity', 'Governance'],
    system: 'SIPRNet Classified Multi-Region GovCloud & Mission Command Enclave',
    businessUnit: 'Defense Information Systems Agency (DISA) & Joint Cyber Directorate',
    assessorName: 'Commander Eric Vance (DoD Principal Authorizing Official)',
    reviewCycle: 'FY2026 DoD Continuous Authority to Operate (cATO) Assessment',
    complianceTarget: 'DoD Cloud Computing SRG IL6 / NIST SP 800-53 Rev. 5 FedRAMP High / CMMC Level 3',
    systemImpactLevel: 'High',
    description: 'Complete 20-family assessment covering Type-1 NSA-certified encryption, SCIF boundary enforcement, TEMPEST emission controls, and continuous red-team testing.',
    customRoadmap: [
      {
        id: 'rem-def-1',
        priority: 'P0_IMMEDIATE',
        targetControl: 'AC-2',
        controlTitle: 'SIPRNet Automated PKI Token Revocation & Zero Trust Attribute Validation',
        domain: 'Cybersecurity',
        gapSummary: 'Cross-domain solution (CDS) security token propagation requires sub-second OCSP revocation polling.',
        technicalRemediationAction: 'Deploy dedicated localized OCSP responders with hardware cryptographic timestamping.',
        compensatingControl: 'Strict 1-hour Kerberos ticket lifetimes.',
        estimatedResidualReduction: 8.9,
        implementationTimeline: '1 Week',
        validationCriteria: 'Instantaneous token revocation across all mission command terminals.',
        assignedTo: 'DISA Defense Enclave Security Group',
        dueDate: '2026-09-08',
        status: 'IN_PROGRESS',
      },
    ],
  },
  {
    id: 'def-fedramp-high',
    name: 'Federal Civilian Citizen Services Multi-Cloud Enclave RCSA',
    sector: 'Defense',
    rcsaDomain: 'Information Security',
    selectedDomains: ['Information Security', 'Cybersecurity', 'Privacy'],
    system: 'FedRAMP High Citizen Identity, Benefits Disbursal & Agency Cloud Core',
    businessUnit: 'Federal Civilian Risk Management & Authorization Office',
    assessorName: 'Sarah Jenkins (3PAO Lead Assessor & FedRAMP Specialist)',
    reviewCycle: 'Annual FedRAMP High Continuous Monitoring Assessment',
    complianceTarget: 'NIST SP 800-53 Rev. 5 FedRAMP High Baseline / OMB M-22-09 Zero Trust',
    systemImpactLevel: 'High',
    description: 'Federal civilian citizen portal protection, continuous automated vulnerability scanning (CA-7), supply chain provenance (SR-4), and privacy disclosures.',
  },
  {
    id: 'def-cmmc-avionics',
    name: 'Defense Industrial Base Tactical Avionics & Telemetry RCSA',
    sector: 'Defense',
    rcsaDomain: 'Cybersecurity',
    selectedDomains: ['Cybersecurity', 'Information Security', 'Governance'],
    system: 'Avionics Flight Software CI/CD, Missile Telemetry & Controlled Unclassified Info (CUI)',
    businessUnit: 'Aerospace Cyber Engineering & CMMC Compliance Group',
    assessorName: 'Arthur Pendelton (CMMC Certified Third-Party Assessor)',
    reviewCycle: 'CMMC Level 3 Third-Party Assessment (C3PAO)',
    complianceTarget: 'NIST SP 800-171 Rev. 2 / NIST SP 800-172 / DFARS 252.204-7012',
    systemImpactLevel: 'High',
    description: 'Controlled Unclassified Information (CUI) isolation, flight telemetry encryption, advanced persistent threat (APT) defense, and subcontractor pedigree attestation.',
  },

  // ==================== 7. PUBLIC SECTOR & EDUCATION (3 PRESETS) ====================
  {
    id: 'pub-university-ferpa',
    name: 'State University Academic Cloud & Student Records Portal RCSA',
    sector: 'Public_Sector',
    rcsaDomain: 'Privacy',
    selectedDomains: ['Privacy', 'Information Security'],
    system: 'Student Information System (SIS), Learning Management (LMS) & Financial Aid',
    businessUnit: 'University Information Technology Services (UITS) & Registrar',
    assessorName: 'Dean Robert Sterling (Campus Data Protection Officer)',
    reviewCycle: 'Annual FERPA & State Higher Ed Privacy Review',
    complianceTarget: 'FERPA (34 CFR Part 99) / State Student Privacy Acts / NIST CSF 2.0',
    systemImpactLevel: 'Moderate',
    description: 'Protection of student educational records, transcript verification digital signatures, student financial aid data governance, and campus guest Wi-Fi isolation.',
  },
  {
    id: 'pub-municipal-tax',
    name: 'State & Municipal Citizen Tax & Business Licensing Registry RCSA',
    sector: 'Public_Sector',
    rcsaDomain: 'Cybersecurity',
    selectedDomains: ['Cybersecurity', 'Privacy', 'Governance'],
    system: 'State Department of Revenue Citizen Tax Portal & Property Tax Database',
    businessUnit: 'State Treasury & Municipal Cyber Defense Center',
    assessorName: 'Patricia Morales (State Chief Information Security Officer)',
    reviewCycle: 'FY2026 State Legislative Cybersecurity Review',
    complianceTarget: 'IRS Publication 1075 / CJIS Security Policy / NIST SP 800-53 Moderate',
    systemImpactLevel: 'High',
    description: 'Federal Tax Information (FTI) safeguarding, citizen digital identity verification, payment processing isolation, and municipal ransomware resilience.',
  },
  {
    id: 'pub-health-registry',
    name: 'Public Health Epidemiology & Immunization Registry RCSA',
    sector: 'Public_Sector',
    rcsaDomain: 'All',
    selectedDomains: ['Privacy', 'Information Security', 'Governance'],
    system: 'Statewide Immunization Information System (IIS) & Disease Surveillance Mesh',
    businessUnit: 'State Department of Public Health & Epidemiology Division',
    assessorName: 'Dr. Linda Cooper (Public Health Informatics Director)',
    reviewCycle: 'Bi-Annual Public Health Compliance Cycle',
    complianceTarget: 'HIPAA Public Health Overlays / CDC Data Modernization Standards',
    systemImpactLevel: 'High',
    description: 'Population-level health surveillance data ingestion, clinical lab reporting encryption, anonymized epidemiological research APIs, and emergency outbreak alert systems.',
  },

  // ==================== 8. GENERAL ENTERPRISE & CORPORATE IT (3 PRESETS) ====================
  {
    id: 'ent-global-erp',
    name: 'Global Fortune 500 Enterprise ERP & Financial Ledger RCSA',
    sector: 'General_Enterprise',
    rcsaDomain: 'All',
    selectedDomains: ['Privacy', 'Information Security', 'Cybersecurity', 'Governance'],
    system: 'SAP S/4HANA Cloud ERP, Global Payroll & Treasury Management Hub',
    businessUnit: 'Global Corporate Information Systems & Enterprise Risk Management',
    assessorName: 'Henrik Lindqvist (Chief Risk Officer & Enterprise Audit Chair)',
    reviewCycle: 'FY2026 SOX 404 & Enterprise Comprehensive Audit',
    complianceTarget: 'COBIT 2019 / SOX Section 404 / ISO/IEC 27001:2022 / CIS Critical Controls',
    systemImpactLevel: 'High',
    description: 'Full 20 NIST family enterprise universe assessing segregation of duties (SoD) in ERP financials, privileged vendor access, disaster recovery, and corporate fraud defense.',
    customRoadmap: [
      {
        id: 'rem-ent-1',
        priority: 'P0_IMMEDIATE',
        targetControl: 'AC-2',
        controlTitle: 'Enterprise ERP Segregation of Duties (SoD) & Conflict Automation',
        domain: 'Cybersecurity',
        gapSummary: 'Finance ledger roles require automated detection of toxic combinations between invoice approval and disbursement execution.',
        technicalRemediationAction: 'Deploy automated SailPoint IdentityIQ SoD matrix rulebook with proactive provisioning blockers.',
        compensatingControl: 'Monthly manual executive controller review of high-value journal entries.',
        estimatedResidualReduction: 8.2,
        implementationTimeline: '3 Weeks',
        validationCriteria: 'Zero toxic SoD role combinations remaining in SAP production accounts.',
        assignedTo: 'Enterprise Business Systems & Internal Audit Lead',
        dueDate: '2026-09-25',
        status: 'IN_PROGRESS',
      },
    ],
  },
  {
    id: 'ent-ma-integration',
    name: 'Cross-Border M&A Subsidiary Integration & Threat Audit RCSA',
    sector: 'General_Enterprise',
    rcsaDomain: 'Information Security',
    selectedDomains: ['Information Security', 'Cybersecurity'],
    system: 'Acquired International Subsidiary Networks, Active Directory & Cloud Infrastructure',
    businessUnit: 'Corporate Development & Global M&A Cybersecurity Integration Taskforce',
    assessorName: 'Trevor Vance (Director of M&A Cyber Diligence)',
    reviewCycle: 'Post-Acquisition Day-90 Mandatory Risk Audit',
    complianceTarget: 'ISO 27001:2022 / NIST CSF 2.0 / Regional Data Privacy Directives',
    systemImpactLevel: 'High',
    description: 'Targeted evaluation of newly acquired subsidiary assets, legacy technical debt, dormant administrator backdoors, and network bridge firewall hardening.',
  },
  {
    id: 'ent-workforce-sase',
    name: 'Global Hybrid Workforce & Zero Trust SASE Endpoint RCSA',
    sector: 'General_Enterprise',
    rcsaDomain: 'Cybersecurity',
    selectedDomains: ['Cybersecurity', 'Privacy'],
    system: '50,000 Global Managed Laptops, Mobile Devices & Secure Access Service Edge (SASE)',
    businessUnit: 'End User Computing & Global Workplace Technology',
    assessorName: 'Chloe Bennett (Lead Endpoint Security Engineer)',
    reviewCycle: 'Q3 2026 Workplace Security Baseline Review',
    complianceTarget: 'NIST SP 800-53 / CIS Controls v8 / Zero Trust Endpoint Guidelines',
    systemImpactLevel: 'Moderate',
    description: 'CrowdStrike EDR telemetry, BitLocker/FileVault disk encryption enforcement, Zscaler SASE private access, and remote wipe automation.',
  },
];

export function createAssessmentFromPreset(presetId: string): RCSAPayload {
  const preset = MULTI_SECTOR_RCSA_PRESETS.find((p) => p.id === presetId) || MULTI_SECTOR_RCSA_PRESETS[0];
  const selectedControlsCatalog = getControlsForRCSADomain(preset.selectedDomains);

  const initialControls: AssessedControl[] = selectedControlsCatalog.map((def, idx) => {
    // Default baseline values
    let de = 0.82;
    let oe = 0.78;
    let defPenalty = preset.baselineDEFModifier || 0.0;
    let gaps = '';
    let evidence = `Verified in Enterprise Security Manual v4.1 for ${preset.system}; corroborated with operational telemetry.`;

    // Check if preset has custom findings for this specific control
    if (preset.customFindings && preset.customFindings[def.controlId]) {
      const custom = preset.customFindings[def.controlId];
      de = custom.de;
      oe = custom.oe;
      defPenalty = custom.defPenalty;
      gaps = custom.gaps;
      evidence = custom.evidence;
    } else {
      // Deterministic realistic variance based on control ID and index
      if (def.controlId === 'AC-2') {
        de = 0.88;
        oe = 0.65;
        defPenalty = 0.1;
        gaps = `Dormant test accounts in ${preset.system} require automated 60-day lifecycle expiration.`;
        evidence = 'Okta / CyberArk directory integration active; quarterly reconciliation pending full automation.';
      } else if (def.controlId === 'PT-2' || def.controlId === 'PT-4') {
        de = 0.8;
        oe = 0.7;
        defPenalty = 0.15;
        gaps = `Real-time consent withdrawal webhooks require message broker validation for ${preset.system}.`;
        evidence = 'OneTrust Privacy Consent Portal deployed and integrated with core database views.';
      } else if (def.controlId === 'SR-4') {
        de = 0.75;
        oe = 0.6;
        defPenalty = 0.2;
        gaps = 'Vendor SBOM ingestion pipeline running; runtime attestation verification in progress.';
        evidence = 'CycloneDX JSON artifacts produced during CI/CD build cycles.';
      } else if (def.controlId === 'SC-7') {
        de = 0.95;
        oe = 0.92;
        defPenalty = 0.0;
        evidence = 'Next-Gen Perimeter Firewalls and Zero Trust Service Mesh micro-segmentation deployed in production.';
      } else if (def.controlId === 'AU-6') {
        de = 0.9;
        oe = 0.85;
        defPenalty = 0.0;
        evidence = 'Centralized SIEM ingestion with tamper-evident WORM retention policy active.';
      } else if (def.controlId === 'IR-4') {
        de = 0.85;
        oe = 0.8;
        defPenalty = 0.05;
        evidence = 'Documented Computer Security Incident Response Plan (CSIRP) with tested tabletop drill findings.';
      }
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
        notes: qIdx === 0
          ? `Standard operational procedure established for ${preset.system}.`
          : 'Verified through technical configuration audit and automated evidence check.',
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
          id: `ev-${preset.id}-${idx}-1`,
          name: `${def.controlId}_${preset.sector}_Evidence_2026.pdf`,
          size: `${(1.2 + (idx % 4) * 0.4).toFixed(1)} MB`,
          uploadedAt: '2026-08-15',
          fileType: 'application/pdf',
          hash: `SHA256:${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`,
        },
      ],
      assignedOwner: idx % 3 === 0 ? `${preset.sector} SecOps Team` : idx % 3 === 1 ? 'Data Governance Lead' : 'Platform Architecture Lead',
      lastUpdated: '2026-08-20T10:00:00Z',
    };
  });

  const idPrefix = preset.sector.substring(0, 3).toUpperCase();

  const defaultRoadmap: AIRemediationItem[] = [
    {
      id: `rem-${preset.id}-1`,
      priority: 'P0_IMMEDIATE',
      targetControl: preset.selectedDomains.includes('Privacy') ? 'PT-4' : 'AC-2',
      controlTitle: preset.selectedDomains.includes('Privacy') ? 'Consent & De-Identification Telemetry' : 'Automated Credential Lifecycle & PAM Enforcement',
      domain: preset.selectedDomains.includes('Privacy') ? 'Privacy' : 'Cybersecurity',
      gapSummary: `Identified gap in ${preset.system} requiring immediate automated remediation.`,
      technicalRemediationAction: `Deploy hardware-enforced safeguards and automated policy reconciliation for ${preset.system}.`,
      compensatingControl: 'Weekly manual compliance audits and enhanced SIEM alerting.',
      estimatedResidualReduction: 8.5,
      implementationTimeline: '1-2 Weeks',
      validationCriteria: 'Audited log verification and zero open deficiency tickets.',
      assignedTo: `${preset.sector} Remediation Taskforce`,
      dueDate: '2026-09-15',
      status: 'IN_PROGRESS',
    },
    {
      id: `rem-${preset.id}-2`,
      priority: 'P1_HIGH',
      targetControl: 'SR-4',
      controlTitle: 'Supply Chain Provenance & Sub-Processor Assurance',
      domain: 'Information Security',
      gapSummary: 'Third-party components require continuous cryptographic SBOM verification.',
      technicalRemediationAction: 'Implement automated Sigstore cosign checking at build and container runtime admission.',
      compensatingControl: 'Quarterly third-party SOC 2 and ISO 27001 report reviews.',
      estimatedResidualReduction: 6.4,
      implementationTimeline: '30 Days',
      validationCriteria: '100% verified dependency tree in production.',
      assignedTo: 'Cloud DevSecOps Lead',
      dueDate: '2026-09-30',
      status: 'OPEN',
    },
  ];

  return seedInitialVersionHistory({
    assessmentId: `RCSA-2026-${idPrefix}-${Math.floor(100 + Math.random() * 900)}`,
    assessmentName: preset.name,
    rcsaDomain: preset.rcsaDomain,
    selectedDomains: preset.selectedDomains,
    timestamp: new Date().toISOString(),
    organizationProfile: {
      sector: preset.sector,
      targetSystem: preset.system,
      rcsaDomain: preset.rcsaDomain,
      selectedDomains: preset.selectedDomains,
      assessorId: `SEC-AUDIT-${preset.id.substring(0, 6).toUpperCase()}`,
      assessorName: preset.assessorName,
      businessUnit: preset.businessUnit,
      reviewCycle: preset.reviewCycle,
      complianceTarget: preset.complianceTarget,
      systemImpactLevel: preset.systemImpactLevel,
      lastAssessmentDate: '2026-08-15',
    },
    controls: initialControls,
    auditSignoff: {
      status: 'In Review',
      assessorSignedBy: preset.assessorName,
      assessorSignDate: '2026-08-15',
      auditNotes: `Comprehensive ${preset.sector} Risk & Control Self-Assessment for ${preset.system} verified against ${preset.complianceTarget}.`,
    },
    aiRemediation: {
      engineUsed: 'Google Gemini 3.7 Flash & Multi-Sector Expert Model',
      modelVersion: 'gemini-3.7-flash-v2',
      generatedTimestamp: '2026-08-20T09:30:00Z',
      executiveSummary: `Assessment indicates a strong control framework for ${preset.name} with targeted high-priority safeguards recommended for ${preset.system}.`,
      sectorNotes: `Tailored for ${preset.sector} regulatory landscape with active enforcement of ${preset.complianceTarget}.`,
      roadmap: preset.customRoadmap || defaultRoadmap,
    },
  });
}

export function createInitialAssessmentFromCatalog(
  assessmentName: string = 'Enterprise Production Core RCSA',
  sector: SectorType = 'Technology',
  targetSystem: string = 'Core Cloud Infrastructure & Data Platform',
  assessorName: string = 'Amit Patel (Principal Risk Assessor)',
  rcsaDomain: RCSADomainType = 'All',
  selectedDomains?: RiskDomain[]
): RCSAPayload {
  // If matching preset exists, load directly
  const effectiveDomain = selectedDomains && selectedDomains.length > 0
    ? (selectedDomains.length === 1 ? selectedDomains[0] : selectedDomains.join(' + '))
    : rcsaDomain;

  const match = MULTI_SECTOR_RCSA_PRESETS.find(
    (p) => p.name === assessmentName || (p.sector === sector && p.rcsaDomain === rcsaDomain)
  );
  if (match) {
    return createAssessmentFromPreset(match.id);
  }

  // Fallback to custom generator
  const selectedControlsCatalog = getControlsForRCSADomain(selectedDomains || effectiveDomain);

  const initialControls = selectedControlsCatalog.map((def, idx) => {
    let de = 0.8;
    let oe = 0.75;
    let defPenalty = 0;
    let gaps = '';
    let evidence = `Documented in Enterprise Security Handbook v4.2 for ${targetSystem}; verified via quarterly audit.`;

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

  return seedInitialVersionHistory({
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
      complianceTarget: 'NIST SP 800-53 Rev. 5 Universe & Sector Overlay',
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
      engineUsed: 'Google Gemini 3.7 Flash & Multi-Sector Expert Model',
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
      ],
    },
  });
}

export const DEMO_PRESETS = MULTI_SECTOR_RCSA_PRESETS.map((p) => ({
  id: p.id,
  name: p.name,
  sector: p.sector,
  rcsaDomain: p.rcsaDomain,
  system: p.system,
  description: p.description,
  businessUnit: p.businessUnit,
  complianceTarget: p.complianceTarget,
}));
