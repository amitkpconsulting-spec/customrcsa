import { RCSATemplate, RiskDomain, SectorType } from '../types';

export const DEFAULT_RCSA_TEMPLATES: RCSATemplate[] = [
  {
    id: 'tpl-privacy-gdpr',
    name: 'Global Privacy & PII Data Protection Baseline',
    description: 'Specialized for GDPR Art. 35 DPIA, CCPA/CPRA, and NIST Privacy Framework. Covers consent vaults, telemetry, cross-border data transfer, and data subject rights.',
    domains: ['Privacy'],
    sector: 'Technology',
    systemImpactLevel: 'High',
    businessUnit: 'Global Privacy Office & Data Governance',
    reviewCycle: 'Q3 2026 Annual Review Cycle',
    targetSystem: 'Customer Data Platform, Telemetry Pipeline & Consent Vault',
    assessorName: 'Lead Privacy Risk Assessor',
    isDefault: true,
    createdAt: '2026-08-01',
    tags: ['GDPR', 'NIST Privacy', 'CCPA', 'PII'],
    frameworkFocus: 'NIST Privacy Framework / ISO 27701',
  },
  {
    id: 'tpl-cyber-zerotrust',
    name: 'FinTech Zero Trust & Cyber Threat Defense Profile',
    description: 'Designed for financial systems, banking enclaves, and high-assurance environments. Tailored for continuous SIEM telemetry, MFA enforcement, and API gateway protection.',
    domains: ['Cybersecurity', 'Information Security'],
    sector: 'Financial',
    systemImpactLevel: 'High',
    businessUnit: 'Cyber Defense Operations & SecOps Enclave',
    reviewCycle: 'Q3 2026 Formal Audit Cycle',
    targetSystem: 'Zero Trust Core Banking Enclave & Payment Rail Gateways',
    assessorName: 'Principal Cyber Risk Engineer',
    isDefault: true,
    createdAt: '2026-08-05',
    tags: ['Zero Trust', 'FinTech', 'FFIEC', 'NIST CSF 2.0'],
    frameworkFocus: 'NIST SP 800-207 / PCI-DSS v4.0',
  },
  {
    id: 'tpl-healthcare-hipaa',
    name: 'Healthcare EHR & HIPAA Security Rule Matrix',
    description: 'EHR systems, clinical telemetry, and ePHI processing compliant with HIPAA Security Rule and NIST SP 800-53 Rev. 5 high impact baselines.',
    domains: ['Information Security', 'Privacy'],
    sector: 'Healthcare',
    systemImpactLevel: 'High',
    businessUnit: 'Clinical Informatics & Healthcare Compliance Directorate',
    reviewCycle: 'Bi-Annual HIPAA Assessment Cycle',
    targetSystem: 'Cloud Electronic Health Records (EHR) & Clinical Telemetry Vault',
    assessorName: 'Healthcare Compliance Officer',
    isDefault: true,
    createdAt: '2026-08-10',
    tags: ['HIPAA', 'ePHI', 'HITECH', 'NIST 800-53'],
    frameworkFocus: 'HIPAA Security Rule / NIST SP 800-66',
  },
  {
    id: 'tpl-iso27001-saas',
    name: 'ISO/IEC 27001:2022 & SOC 2 Fast Track',
    description: 'Comprehensive Information Security Management System (ISMS) controls with software supply chain security (SCRM) and cloud posture management.',
    domains: ['Information Security'],
    sector: 'Technology',
    systemImpactLevel: 'Moderate',
    businessUnit: 'Information Security & Cloud Infrastructure Group',
    reviewCycle: 'Annual ISO 27001 Surveillance Cycle',
    targetSystem: 'Multi-Tenant SaaS Microservices & Cloud Infrastructure',
    assessorName: 'Lead ISMS Auditor',
    isDefault: true,
    createdAt: '2026-08-12',
    tags: ['ISO 27001', 'SOC 2', 'SCRM', 'ISMS'],
    frameworkFocus: 'ISO/IEC 27001:2022 Annex A',
  },
  {
    id: 'tpl-universal-20fam',
    name: 'Universal 20-Family Enterprise Multi-Domain RCSA',
    description: 'All 4 risk domains united: Privacy, Cybersecurity, Information Security, and Governance across all 20 NIST SP 800-53 families.',
    domains: ['Privacy', 'Information Security', 'Cybersecurity', 'Governance'],
    sector: 'General_Enterprise',
    systemImpactLevel: 'High',
    businessUnit: 'Global Enterprise Risk & Compliance Committee',
    reviewCycle: 'FY2026 Enterprise Comprehensive Audit',
    targetSystem: 'Enterprise Global Hybrid Multi-Cloud Infrastructure',
    assessorName: 'Chief Risk Officer & Joint Audit Panel',
    isDefault: true,
    createdAt: '2026-08-15',
    tags: ['Enterprise 360', 'All Domains', 'NIST 800-53', 'Governance'],
    frameworkFocus: 'NIST SP 800-53 Rev. 5 Universal',
  },
];

const STORAGE_KEY = 'technoscope_rcsa_templates';

export function getSavedTemplates(): RCSATemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RCSA_TEMPLATES;
    const custom: RCSATemplate[] = JSON.parse(raw);
    return [...DEFAULT_RCSA_TEMPLATES, ...custom];
  } catch (e) {
    console.error('Error loading saved templates:', e);
    return DEFAULT_RCSA_TEMPLATES;
  }
}

export function saveCustomTemplate(template: Omit<RCSATemplate, 'id' | 'createdAt' | 'isDefault'>): RCSATemplate {
  const newTemplate: RCSATemplate = {
    ...template,
    id: `custom-tpl-${Date.now()}`,
    createdAt: new Date().toISOString().split('T')[0],
    isDefault: false,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: RCSATemplate[] = raw ? JSON.parse(raw) : [];
    const updated = [newTemplate, ...existing];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving template:', e);
  }

  return newTemplate;
}

export function deleteCustomTemplate(templateId: string): RCSATemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RCSA_TEMPLATES;
    const existing: RCSATemplate[] = JSON.parse(raw);
    const filtered = existing.filter((t) => t.id !== templateId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return [...DEFAULT_RCSA_TEMPLATES, ...filtered];
  } catch (e) {
    console.error('Error deleting template:', e);
    return DEFAULT_RCSA_TEMPLATES;
  }
}
