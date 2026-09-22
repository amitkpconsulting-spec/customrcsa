import { RCSATemplate, RiskDomain, SectorType } from '../types';
import { MULTI_SECTOR_RCSA_PRESETS } from './demoAssessments';

export const DEFAULT_RCSA_TEMPLATES: RCSATemplate[] = MULTI_SECTOR_RCSA_PRESETS.map((preset) => ({
  id: `tpl-${preset.id}`,
  name: preset.name,
  description: preset.description,
  domains: preset.selectedDomains,
  sector: preset.sector,
  systemImpactLevel: preset.systemImpactLevel,
  businessUnit: preset.businessUnit,
  reviewCycle: preset.reviewCycle,
  targetSystem: preset.system,
  assessorName: preset.assessorName,
  isDefault: true,
  createdAt: '2026-08-15',
  tags: [preset.sector, ...preset.selectedDomains, preset.systemImpactLevel],
  frameworkFocus: preset.complianceTarget,
}));

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
