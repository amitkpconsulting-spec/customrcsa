import { RCSAVersionSnapshot, RCSAPayload } from '../types';

export const INITIAL_VERSION_SNAPSHOTS: RCSAVersionSnapshot[] = [
  {
    id: 'snap-v1.0',
    versionTag: 'v1.0 (Q1 2026 Baseline)',
    timestamp: '2026-03-31T14:30:00Z',
    name: 'Initial Regulatory Baseline Assessment',
    createdBy: 'Amit Patel (Lead Assessor)',
    notes: 'Initial enterprise gap assessment prior to remediation kickoff. High deficiency volume identified in IAM and Media Protection.',
    domain: 'All',
    overallRiskScore: 14.8,
    inherentRiskScore: 18.2,
    residualRiskScore: 14.8,
    controlEffectivenessScore: 0.42,
    totalControls: 24,
    assessedControls: 24,
    deficienciesCount: {
      critical: 4,
      high: 6,
      medium: 5,
      low: 2,
    },
    domainScores: {
      Privacy: { inherent: 17.5, residual: 15.2, cef: 0.38, status: 'NEEDS_ATTENTION' },
      'Information Security': { inherent: 18.0, residual: 14.6, cef: 0.45, status: 'NEEDS_ATTENTION' },
      Cybersecurity: { inherent: 19.1, residual: 15.0, cef: 0.41, status: 'CRITICAL_DEFICIENCY' },
      Governance: { inherent: 16.2, residual: 12.8, cef: 0.48, status: 'SATISFACTORY' },
    },
  },
  {
    id: 'snap-v1.5',
    versionTag: 'v1.5 (Q2 2026 Mid-Year)',
    timestamp: '2026-06-30T10:15:00Z',
    name: 'Mid-Year Remediation Sprint Milestone',
    createdBy: 'Sarah Jenkins (Security Architect)',
    notes: 'Deployed automated MFA telemetry and IAM session termination safeguards. Critical deficiencies reduced by 50%.',
    domain: 'All',
    overallRiskScore: 10.4,
    inherentRiskScore: 18.2,
    residualRiskScore: 10.4,
    controlEffectivenessScore: 0.65,
    totalControls: 24,
    assessedControls: 24,
    deficienciesCount: {
      critical: 2,
      high: 3,
      medium: 6,
      low: 4,
    },
    domainScores: {
      Privacy: { inherent: 17.5, residual: 11.2, cef: 0.62, status: 'SATISFACTORY' },
      'Information Security': { inherent: 18.0, residual: 10.1, cef: 0.68, status: 'SATISFACTORY' },
      Cybersecurity: { inherent: 19.1, residual: 9.8, cef: 0.70, status: 'SATISFACTORY' },
      Governance: { inherent: 16.2, residual: 9.2, cef: 0.64, status: 'SATISFACTORY' },
    },
  },
];

const SNAPSHOT_STORAGE_KEY = 'technoscope_rcsa_version_snapshots';

export function getSavedVersionSnapshots(): RCSAVersionSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return INITIAL_VERSION_SNAPSHOTS;
    const custom: RCSAVersionSnapshot[] = JSON.parse(raw);
    return [...INITIAL_VERSION_SNAPSHOTS, ...custom];
  } catch (e) {
    console.error('Error loading version snapshots:', e);
    return INITIAL_VERSION_SNAPSHOTS;
  }
}

export function saveVersionSnapshot(snapshot: RCSAVersionSnapshot): RCSAVersionSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    const existing: RCSAVersionSnapshot[] = raw ? JSON.parse(raw) : [];
    const updated = [snapshot, ...existing];
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(updated));
    return [...INITIAL_VERSION_SNAPSHOTS, ...updated];
  } catch (e) {
    console.error('Error saving version snapshot:', e);
    return INITIAL_VERSION_SNAPSHOTS;
  }
}

export function createSnapshotFromAssessment(
  assessment: RCSAPayload,
  versionTag: string,
  notes: string,
  createdBy: string
): RCSAVersionSnapshot {
  const controls = assessment.controls;
  const total = controls.length || 1;
  const assessed = controls.filter((c) => c.status !== 'NOT_EVALUATED').length;
  
  const avgInherent = Number((controls.reduce((s, c) => s + c.inherentRisk, 0) / total).toFixed(1));
  const avgResidual = Number((controls.reduce((s, c) => s + c.residualRisk, 0) / total).toFixed(1));
  const avgCEF = Number((controls.reduce((s, c) => s + c.calculatedCEF, 0) / total).toFixed(2));

  const deficiencies = {
    critical: controls.filter((c) => c.status === 'CRITICAL_DEFICIENCY').length,
    high: controls.filter((c) => c.status === 'NEEDS_ATTENTION').length,
    medium: controls.filter((c) => c.status === 'SATISFACTORY' && c.residualRisk > 8).length,
    low: controls.filter((c) => c.status === 'COMPLIANT' || c.residualRisk <= 8).length,
  };

  const domainScores: Record<string, { inherent: number; residual: number; cef: number; status: string }> = {};
  
  // Calculate per domain
  ['Privacy', 'Information Security', 'Cybersecurity', 'Governance'].forEach((dom) => {
    const domControls = controls.filter((c) => c.domain === dom);
    if (domControls.length > 0) {
      const dTotal = domControls.length;
      const dInherent = Number((domControls.reduce((s, c) => s + c.inherentRisk, 0) / dTotal).toFixed(1));
      const dResidual = Number((domControls.reduce((s, c) => s + c.residualRisk, 0) / dTotal).toFixed(1));
      const dCEF = Number((domControls.reduce((s, c) => s + c.calculatedCEF, 0) / dTotal).toFixed(2));
      const hasCritical = domControls.some((c) => c.status === 'CRITICAL_DEFICIENCY');
      const hasNeedsAttn = domControls.some((c) => c.status === 'NEEDS_ATTENTION');
      const status = hasCritical ? 'CRITICAL_DEFICIENCY' : hasNeedsAttn ? 'NEEDS_ATTENTION' : 'COMPLIANT';

      domainScores[dom] = {
        inherent: dInherent,
        residual: dResidual,
        cef: dCEF,
        status,
      };
    }
  });

  return {
    id: `snap-${Date.now()}`,
    versionTag,
    timestamp: new Date().toISOString(),
    name: assessment.assessmentName || 'Current Production RCSA Snapshot',
    createdBy: createdBy || 'Risk Assessor',
    notes,
    domain: assessment.rcsaDomain || 'All',
    overallRiskScore: avgResidual,
    inherentRiskScore: avgInherent,
    residualRiskScore: avgResidual,
    controlEffectivenessScore: avgCEF,
    totalControls: total,
    assessedControls: assessed,
    deficienciesCount: deficiencies,
    domainScores,
  };
}
