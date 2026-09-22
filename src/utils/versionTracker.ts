import {
  RCSAPayload,
  RCSAAssessmentVersion,
  AssessedControl,
  AuditSignoff,
} from '../types';

/**
 * Calculates quantitative risk and compliance metrics for a version snapshot
 */
export function calculateVersionMetrics(
  controls: AssessedControl[],
  auditSignoff: AuditSignoff
): RCSAAssessmentVersion['metrics'] {
  const total = controls.length || 1;
  const assessed = controls.filter((c) => c.status !== 'NOT_EVALUATED').length;

  const totalInherent = controls.reduce((s, c) => s + (c.inherentRisk || 0), 0);
  const totalResidual = controls.reduce((s, c) => s + (c.residualRisk || 0), 0);
  const totalCEF = controls.reduce((s, c) => s + (c.calculatedCEF || 0), 0);

  const avgInherent = Number((totalInherent / total).toFixed(1));
  const avgResidual = Number((totalResidual / total).toFixed(1));
  const avgCEF = Number((totalCEF / total).toFixed(2));

  const criticalDeficiencies = controls.filter(
    (c) => c.status === 'CRITICAL_DEFICIENCY' || c.residualRisk >= 15
  ).length;

  const highDeficiencies = controls.filter(
    (c) => c.status === 'NEEDS_ATTENTION' || (c.residualRisk >= 10 && c.residualRisk < 15)
  ).length;

  return {
    inherentRisk: avgInherent,
    residualRisk: avgResidual,
    cefScore: avgCEF,
    totalControls: controls.length,
    assessedControls: assessed,
    criticalDeficiencies,
    highDeficiencies,
    auditStatus: auditSignoff.status,
  };
}

/**
 * Deep clones an assessment state into an immutable snapshot
 */
export function createAssessmentVersionSnapshot(
  assessment: RCSAPayload,
  versionTag: string,
  changeSummary: string,
  author: string = 'Lead Risk Assessor',
  isBaseline: boolean = false
): RCSAAssessmentVersion {
  const currentHistory = assessment.versionHistory || [];
  const versionNumber = currentHistory.length + 1;
  const metrics = calculateVersionMetrics(assessment.controls, assessment.auditSignoff);

  // Deep clone state to ensure total immutability
  const clonedControls = JSON.parse(JSON.stringify(assessment.controls));
  const clonedProfile = JSON.parse(JSON.stringify(assessment.organizationProfile));
  const clonedSignoff = JSON.parse(JSON.stringify(assessment.auditSignoff));
  const clonedAIRemediation = assessment.aiRemediation
    ? JSON.parse(JSON.stringify(assessment.aiRemediation))
    : undefined;

  return {
    id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    versionNumber,
    versionTag: versionTag.trim() || `v${versionNumber}.0`,
    timestamp: new Date().toISOString(),
    author: author.trim() || assessment.organizationProfile.assessorName || 'Risk Assessor',
    changeSummary: changeSummary.trim() || 'Periodic assessment state checkpoint.',
    domain: assessment.rcsaDomain || 'All',
    isBaseline,
    metrics,
    snapshot: {
      assessmentName: assessment.assessmentName,
      timestamp: assessment.timestamp || new Date().toISOString(),
      organizationProfile: clonedProfile,
      controls: clonedControls,
      auditSignoff: clonedSignoff,
      aiRemediation: clonedAIRemediation,
    },
  };
}

/**
 * Saves a new version snapshot directly onto the RCSA object's versionHistory tracker
 */
export function addVersionSnapshotToRCSA(
  assessment: RCSAPayload,
  versionTag: string,
  changeSummary: string,
  author?: string
): RCSAPayload {
  const newSnapshot = createAssessmentVersionSnapshot(
    assessment,
    versionTag,
    changeSummary,
    author || assessment.organizationProfile.assessorName
  );

  const existingHistory = assessment.versionHistory || [];
  const updatedHistory = [newSnapshot, ...existingHistory];

  return {
    ...assessment,
    timestamp: new Date().toISOString(),
    currentVersionNumber: newSnapshot.versionNumber,
    currentVersionTag: newSnapshot.versionTag,
    versionHistory: updatedHistory,
  };
}

/**
 * Reverts the active RCSA object to a previous historical version snapshot.
 * Preserves a safety auto-backup of the current working copy before restoring.
 */
export function revertRCSAToVersion(
  assessment: RCSAPayload,
  targetVersionId: string,
  revertAuthor: string = 'Lead Risk Assessor'
): {
  updatedAssessment: RCSAPayload;
  restoredVersion: RCSAAssessmentVersion;
  safetyBackupVersion: RCSAAssessmentVersion;
} {
  const history = assessment.versionHistory || [];
  const targetVersion = history.find((v) => v.id === targetVersionId);

  if (!targetVersion) {
    throw new Error(`Version snapshot with id "${targetVersionId}" not found in RCSA object.`);
  }

  // 1. Create a safety auto-backup snapshot of current working assessment
  const currentTag = assessment.currentVersionTag || `v${history.length}.x (Draft)`;
  const safetyBackup = createAssessmentVersionSnapshot(
    assessment,
    `Backup (${currentTag})`,
    `Automatic pre-revert safety backup captured prior to restoring ${targetVersion.versionTag}.`,
    revertAuthor
  );

  // 2. Restore state from target snapshot (deep cloned to prevent mutation)
  const restoredControls = JSON.parse(JSON.stringify(targetVersion.snapshot.controls));
  const restoredProfile = JSON.parse(JSON.stringify(targetVersion.snapshot.organizationProfile));
  const restoredSignoff = JSON.parse(JSON.stringify(targetVersion.snapshot.auditSignoff));
  const restoredRemediation = targetVersion.snapshot.aiRemediation
    ? JSON.parse(JSON.stringify(targetVersion.snapshot.aiRemediation))
    : undefined;

  // 3. Compile updated version history with safety backup
  const updatedHistory = [safetyBackup, ...history];

  const updatedAssessment: RCSAPayload = {
    ...assessment,
    assessmentName: targetVersion.snapshot.assessmentName || assessment.assessmentName,
    organizationProfile: restoredProfile,
    controls: restoredControls,
    auditSignoff: restoredSignoff,
    aiRemediation: restoredRemediation,
    timestamp: new Date().toISOString(),
    currentVersionNumber: targetVersion.versionNumber,
    currentVersionTag: `${targetVersion.versionTag} (Restored)`,
    versionHistory: updatedHistory,
  };

  return {
    updatedAssessment,
    restoredVersion: targetVersion,
    safetyBackupVersion: safetyBackup,
  };
}

/**
 * Deletes a snapshot from the RCSA object's versionHistory
 */
export function deleteVersionSnapshotFromRCSA(
  assessment: RCSAPayload,
  targetVersionId: string
): RCSAPayload {
  const existingHistory = assessment.versionHistory || [];
  const updatedHistory = existingHistory.filter((v) => v.id !== targetVersionId);

  // If deleted item was active version tag, adjust active tag if needed
  let updatedTag = assessment.currentVersionTag;
  if (updatedHistory.length > 0 && (!updatedTag || !updatedHistory.some(v => v.versionTag === updatedTag))) {
    updatedTag = updatedHistory[0].versionTag;
  }

  return {
    ...assessment,
    currentVersionTag: updatedTag,
    versionHistory: updatedHistory,
  };
}

/**
 * Initializes a default baseline snapshot if the RCSA object lacks version history
 */
export function seedInitialVersionHistory(assessment: RCSAPayload): RCSAPayload {
  if (assessment.versionHistory && assessment.versionHistory.length > 0) {
    return assessment;
  }

  const assessor = assessment.organizationProfile.assessorName || 'Amit Patel (Principal Risk Assessor)';

  // 1. Snapshot v1.0 (Baseline - 5 months ago with higher deficiencies)
  const baselineControls: AssessedControl[] = assessment.controls.map((c, idx) => {
    // In baseline, lower CEF and higher deficiency penalty for demonstration
    const de = Math.max(0.4, Number((c.designEffectiveness - 0.25).toFixed(2)));
    const oe = Math.max(0.35, Number((c.operatingEffectiveness - 0.3).toFixed(2)));
    const defPenalty = idx % 4 === 0 ? 0.25 : idx % 5 === 0 ? 0.15 : c.deficiencyPenalty;
    const cef = Number(((0.4 * de + 0.6 * oe) * (1 - defPenalty)).toFixed(2));
    const residual = Number((c.inherentRisk * (1 - cef * c.confidenceFactor)).toFixed(1));
    const status = residual >= 15 ? 'CRITICAL_DEFICIENCY' : residual >= 10 ? 'NEEDS_ATTENTION' : c.status;

    return {
      ...c,
      designEffectiveness: de,
      operatingEffectiveness: oe,
      deficiencyPenalty: defPenalty,
      calculatedCEF: cef,
      residualRisk: residual,
      status,
      implementationEvidence: `Baseline observation: Evidence manual and incomplete during initial audit kickoff.`,
      gapsIdentified: idx % 4 === 0 ? 'Automated telemetry and continuous enforcement pending deployment.' : c.gapsIdentified,
      lastUpdated: '2026-03-31T14:30:00Z',
    };
  });

  const baselineSignoff: AuditSignoff = {
    status: 'Draft',
    assessorSignedBy: assessor,
    assessorSignDate: '2026-03-31',
    auditNotes: 'Initial gap assessment completed prior to remediation sprint kickoff.',
  };

  const baselineSnapshot: RCSAAssessmentVersion = {
    id: 'snap-v1.0-baseline',
    versionNumber: 1,
    versionTag: 'v1.0 (Q1 Regulatory Baseline)',
    timestamp: '2026-03-31T14:30:00Z',
    author: assessor,
    changeSummary: 'Initial regulatory baseline assessment established prior to remediation sprint kickoff. Higher gap volume in IAM and encryption.',
    domain: assessment.rcsaDomain || 'All',
    isBaseline: true,
    metrics: calculateVersionMetrics(baselineControls, baselineSignoff),
    snapshot: {
      assessmentName: `${assessment.assessmentName} (Q1 Baseline)`,
      timestamp: '2026-03-31T14:30:00Z',
      organizationProfile: { ...assessment.organizationProfile, lastAssessmentDate: '2026-03-31' },
      controls: baselineControls,
      auditSignoff: baselineSignoff,
      aiRemediation: assessment.aiRemediation,
    },
  };

  // 2. Snapshot v1.5 (Mid-Year Checkpoint - 2 months ago)
  const midYearControls: AssessedControl[] = assessment.controls.map((c, idx) => {
    const de = Math.max(0.65, Number((c.designEffectiveness - 0.1).toFixed(2)));
    const oe = Math.max(0.6, Number((c.operatingEffectiveness - 0.15).toFixed(2)));
    const defPenalty = idx % 7 === 0 ? 0.1 : 0.0;
    const cef = Number(((0.4 * de + 0.6 * oe) * (1 - defPenalty)).toFixed(2));
    const residual = Number((c.inherentRisk * (1 - cef * c.confidenceFactor)).toFixed(1));
    const status = residual >= 15 ? 'CRITICAL_DEFICIENCY' : residual >= 10 ? 'NEEDS_ATTENTION' : 'SATISFACTORY';

    return {
      ...c,
      designEffectiveness: de,
      operatingEffectiveness: oe,
      deficiencyPenalty: defPenalty,
      calculatedCEF: cef,
      residualRisk: residual,
      status,
      implementationEvidence: 'Mid-year remediation verified: MFA and logging pipelines active.',
      lastUpdated: '2026-06-30T10:15:00Z',
    };
  });

  const midYearSignoff: AuditSignoff = {
    status: 'In Review',
    assessorSignedBy: assessor,
    assessorSignDate: '2026-06-30',
    auditNotes: 'Mid-year sprint milestone signoff after deploying automated identity telemetry.',
  };

  const midYearSnapshot: RCSAAssessmentVersion = {
    id: 'snap-v1.5-midyear',
    versionNumber: 2,
    versionTag: 'v1.5 (Q2 Mid-Year Milestone)',
    timestamp: '2026-06-30T10:15:00Z',
    author: 'Sarah Jenkins (Security Architect)',
    changeSummary: 'Mid-year remediation milestone checkpoint. MFA deployed and critical gaps reduced by 50%.',
    domain: assessment.rcsaDomain || 'All',
    isBaseline: false,
    metrics: calculateVersionMetrics(midYearControls, midYearSignoff),
    snapshot: {
      assessmentName: `${assessment.assessmentName} (Q2 Mid-Year)`,
      timestamp: '2026-06-30T10:15:00Z',
      organizationProfile: { ...assessment.organizationProfile, lastAssessmentDate: '2026-06-30' },
      controls: midYearControls,
      auditSignoff: midYearSignoff,
      aiRemediation: assessment.aiRemediation,
    },
  };

  // 3. Snapshot v2.0 (Current Working Snapshot)
  const currentSnapshot: RCSAAssessmentVersion = {
    id: `snap-v2.0-${Date.now()}`,
    versionNumber: 3,
    versionTag: 'v2.0 (Audit-Ready Baseline)',
    timestamp: new Date().toISOString(),
    author: assessor,
    changeSummary: 'Current production assessment state with all evidence attachments and remediation roadmaps verified.',
    domain: assessment.rcsaDomain || 'All',
    isBaseline: false,
    metrics: calculateVersionMetrics(assessment.controls, assessment.auditSignoff),
    snapshot: {
      assessmentName: assessment.assessmentName,
      timestamp: assessment.timestamp || new Date().toISOString(),
      organizationProfile: JSON.parse(JSON.stringify(assessment.organizationProfile)),
      controls: JSON.parse(JSON.stringify(assessment.controls)),
      auditSignoff: JSON.parse(JSON.stringify(assessment.auditSignoff)),
      aiRemediation: assessment.aiRemediation ? JSON.parse(JSON.stringify(assessment.aiRemediation)) : undefined,
    },
  };

  return {
    ...assessment,
    currentVersionNumber: 3,
    currentVersionTag: 'v2.0 (Audit-Ready Baseline)',
    versionHistory: [currentSnapshot, midYearSnapshot, baselineSnapshot],
  };
}

export interface ControlDiffResult {
  controlId: string;
  title: string;
  domain: string;
  currentStatus: string;
  snapshotStatus: string;
  currentResidual: number;
  snapshotResidual: number;
  currentCEF: number;
  snapshotCEF: number;
  residualDelta: number;
  cefDelta: number;
  hasChanged: boolean;
  notes: string[];
}

/**
 * Compares current assessment controls against a historical version snapshot's controls
 */
export function compareAssessmentWithSnapshot(
  currentControls: AssessedControl[],
  snapshotControls: AssessedControl[]
): ControlDiffResult[] {
  const snapshotMap = new Map<string, AssessedControl>();
  snapshotControls.forEach((c) => snapshotMap.set(c.controlId, c));

  return currentControls.map((current) => {
    const historical = snapshotMap.get(current.controlId);
    const snapResidual = historical ? historical.residualRisk : current.residualRisk;
    const snapCEF = historical ? historical.calculatedCEF : current.calculatedCEF;
    const snapStatus = historical ? historical.status : current.status;

    const residualDelta = Number((current.residualRisk - snapResidual).toFixed(1));
    const cefDelta = Number(((current.calculatedCEF - snapCEF) * 100).toFixed(0));

    const notes: string[] = [];
    if (residualDelta < 0) {
      notes.push(`Residual risk improved by ${Math.abs(residualDelta)} points`);
    } else if (residualDelta > 0) {
      notes.push(`Residual risk increased by ${residualDelta} points`);
    }

    if (cefDelta > 0) {
      notes.push(`Control effectiveness increased by +${cefDelta}%`);
    } else if (cefDelta < 0) {
      notes.push(`Control effectiveness dropped by ${cefDelta}%`);
    }

    if (current.status !== snapStatus) {
      notes.push(`Status shifted from ${snapStatus} to ${current.status}`);
    }

    const hasChanged = residualDelta !== 0 || cefDelta !== 0 || current.status !== snapStatus;

    return {
      controlId: current.controlId,
      title: current.title,
      domain: current.domain,
      currentStatus: current.status,
      snapshotStatus: snapStatus,
      currentResidual: current.residualRisk,
      snapshotResidual: snapResidual,
      currentCEF: current.calculatedCEF,
      snapshotCEF: snapCEF,
      residualDelta,
      cefDelta,
      hasChanged,
      notes,
    };
  });
}

export interface ChangedControlDetail {
  controlId: string;
  title: string;
  domain: string;
  changeType: 'improved' | 'regressed' | 'modified' | 'added' | 'removed';
  prevStatus?: string;
  currStatus: string;
  prevResidual: number;
  currResidual: number;
  prevCEF: number;
  currCEF: number;
  residualDelta: number;
  cefDelta: number;
  changeDescription: string;
}

export interface SnapshotDeltaSummary {
  hasPrevious: boolean;
  previousVersionTag?: string;
  previousVersionId?: string;
  changedControlsCount: number;
  totalControls: number;
  percentChanged: number;
  improvedControlsCount: number;
  regressedControlsCount: number;
  statusShiftCount: number;
  residualDelta: number;
  cefDelta: number;
  activityLevel: 'baseline' | 'none' | 'low' | 'moderate' | 'high' | 'critical';
  activityLabel: string;
  changedControls: ChangedControlDetail[];
}

/**
 * Computes the delta between a snapshot and its chronologically immediately preceding snapshot
 * to determine the number of controls changed and gauge audit activity intensity.
 */
export function computeSnapshotDelta(
  snapshot: RCSAAssessmentVersion,
  allSnapshots: RCSAAssessmentVersion[]
): SnapshotDeltaSummary {
  if (!snapshot || !snapshot.snapshot || !snapshot.snapshot.controls) {
    return {
      hasPrevious: false,
      changedControlsCount: 0,
      totalControls: 0,
      percentChanged: 0,
      improvedControlsCount: 0,
      regressedControlsCount: 0,
      statusShiftCount: 0,
      residualDelta: 0,
      cefDelta: 0,
      activityLevel: 'baseline',
      activityLabel: 'Initial Baseline',
      changedControls: [],
    };
  }

  // Sort all snapshots by timestamp ascending (or versionNumber)
  const sorted = [...allSnapshots].sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    if (timeA !== timeB) return timeA - timeB;
    return (a.versionNumber || 0) - (b.versionNumber || 0);
  });

  const snapIndex = sorted.findIndex((s) => s.id === snapshot.id);
  const prevSnapshot = snapIndex > 0 ? sorted[snapIndex - 1] : null;

  if (!prevSnapshot || !prevSnapshot.snapshot || !prevSnapshot.snapshot.controls) {
    return {
      hasPrevious: false,
      changedControlsCount: 0,
      totalControls: snapshot.snapshot.controls.length,
      percentChanged: 0,
      improvedControlsCount: 0,
      regressedControlsCount: 0,
      statusShiftCount: 0,
      residualDelta: 0,
      cefDelta: 0,
      activityLevel: 'baseline',
      activityLabel: 'Initial Regulatory Baseline',
      changedControls: [],
    };
  }

  const currControls = snapshot.snapshot.controls;
  const prevControls = prevSnapshot.snapshot.controls;
  const prevMap = new Map<string, AssessedControl>();
  prevControls.forEach((c) => prevMap.set(c.controlId, c));

  const changedControls: ChangedControlDetail[] = [];
  let improvedCount = 0;
  let regressedCount = 0;
  let statusShiftCount = 0;

  currControls.forEach((curr) => {
    const prev = prevMap.get(curr.controlId);
    if (!prev) {
      changedControls.push({
        controlId: curr.controlId,
        title: curr.title,
        domain: curr.domain,
        changeType: 'added',
        currStatus: curr.status,
        prevResidual: 0,
        currResidual: curr.residualRisk,
        prevCEF: 0,
        currCEF: curr.calculatedCEF,
        residualDelta: curr.residualRisk,
        cefDelta: Math.round(curr.calculatedCEF * 100),
        changeDescription: 'New control introduced into scope',
      });
      return;
    }

    const residualDelta = Number((curr.residualRisk - prev.residualRisk).toFixed(1));
    const cefDelta = Number(((curr.calculatedCEF - prev.calculatedCEF) * 100).toFixed(0));
    const statusChanged = curr.status !== prev.status;
    const deChanged = Math.abs((curr.designEffectiveness || 0) - (prev.designEffectiveness || 0)) >= 0.04;
    const oeChanged = Math.abs((curr.operatingEffectiveness || 0) - (prev.operatingEffectiveness || 0)) >= 0.04;
    const defPenaltyChanged = Math.abs((curr.deficiencyPenalty || 0) - (prev.deficiencyPenalty || 0)) >= 0.04;
    const gapsChanged = (curr.gapsIdentified || '').trim() !== (prev.gapsIdentified || '').trim();

    const isChanged =
      residualDelta !== 0 ||
      cefDelta !== 0 ||
      statusChanged ||
      deChanged ||
      oeChanged ||
      defPenaltyChanged ||
      gapsChanged;

    if (isChanged) {
      let changeType: ChangedControlDetail['changeType'] = 'modified';
      const descParts: string[] = [];

      if (residualDelta < 0 || cefDelta > 0) {
        changeType = 'improved';
        improvedCount++;
        if (residualDelta < 0) descParts.push(`Risk -${Math.abs(residualDelta)} pts`);
        if (cefDelta > 0) descParts.push(`CEF +${cefDelta}%`);
      } else if (residualDelta > 0 || cefDelta < 0) {
        changeType = 'regressed';
        regressedCount++;
        if (residualDelta > 0) descParts.push(`Risk +${residualDelta} pts`);
        if (cefDelta < 0) descParts.push(`CEF ${cefDelta}%`);
      } else {
        changeType = 'modified';
        if (statusChanged) statusShiftCount++;
      }

      if (statusChanged) {
        descParts.push(`Status: ${prev.status} → ${curr.status}`);
      } else if (gapsChanged && curr.gapsIdentified) {
        descParts.push(`Remediation Gaps Updated`);
      }

      changedControls.push({
        controlId: curr.controlId,
        title: curr.title,
        domain: curr.domain,
        changeType,
        prevStatus: prev.status,
        currStatus: curr.status,
        prevResidual: prev.residualRisk,
        currResidual: curr.residualRisk,
        prevCEF: prev.calculatedCEF,
        currCEF: curr.calculatedCEF,
        residualDelta,
        cefDelta,
        changeDescription: descParts.join(' • ') || 'Control calibrated',
      });
    }
  });

  // Check for removed controls
  const currMap = new Map<string, AssessedControl>();
  currControls.forEach((c) => currMap.set(c.controlId, c));
  prevControls.forEach((prev) => {
    if (!currMap.has(prev.controlId)) {
      changedControls.push({
        controlId: prev.controlId,
        title: prev.title,
        domain: prev.domain,
        changeType: 'removed',
        prevStatus: prev.status,
        currStatus: 'DECOMMISSIONED',
        prevResidual: prev.residualRisk,
        currResidual: 0,
        prevCEF: prev.calculatedCEF,
        currCEF: 0,
        residualDelta: -prev.residualRisk,
        cefDelta: -Math.round(prev.calculatedCEF * 100),
        changeDescription: 'Control removed from assessment scope',
      });
    }
  });

  const changedControlsCount = changedControls.length;
  const totalControls = currControls.length || 1;
  const percentChanged = Math.round((changedControlsCount / totalControls) * 100);

  const overallResidualDelta = Number(
    ((snapshot.metrics?.residualRisk || 0) - (prevSnapshot.metrics?.residualRisk || 0)).toFixed(1)
  );
  const overallCEFDelta = Number(
    ((((snapshot.metrics?.cefScore || 0) - (prevSnapshot.metrics?.cefScore || 0)) * 100)).toFixed(0)
  );

  let activityLevel: SnapshotDeltaSummary['activityLevel'] = 'none';
  let activityLabel = '0 Controls Changed (Attestation / Metadata)';

  if (changedControlsCount === 0) {
    activityLevel = 'none';
    activityLabel = '0 Controls Changed (Signoff / Metadata Only)';
  } else if (changedControlsCount >= 8 || percentChanged >= 40) {
    activityLevel = 'critical';
    activityLabel = `${changedControlsCount} Controls Changed (Major Overhaul / Sprint)`;
  } else if (changedControlsCount >= 4 || percentChanged >= 20) {
    activityLevel = 'high';
    activityLabel = `${changedControlsCount} Controls Changed (High Activity Period)`;
  } else if (changedControlsCount >= 2) {
    activityLevel = 'moderate';
    activityLabel = `${changedControlsCount} Controls Changed (Moderate Activity)`;
  } else {
    activityLevel = 'low';
    activityLabel = `${changedControlsCount} Control Changed (Targeted Calibration)`;
  }

  return {
    hasPrevious: true,
    previousVersionTag: prevSnapshot.versionTag,
    previousVersionId: prevSnapshot.id,
    changedControlsCount,
    totalControls,
    percentChanged,
    improvedControlsCount: improvedCount,
    regressedControlsCount: regressedCount,
    statusShiftCount,
    residualDelta: overallResidualDelta,
    cefDelta: overallCEFDelta,
    activityLevel,
    activityLabel,
    changedControls,
  };
}
