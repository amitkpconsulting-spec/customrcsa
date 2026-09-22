import * as XLSX from 'xlsx';
import { RCSAPayload } from '../types';
import { computeDomainSummaries, getControlRiskLevel } from './riskCalculations';

export function exportRCSAToExcel(payload: RCSAPayload): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Executive Summary
  const domainSummaries = computeDomainSummaries(payload.controls);
  const totalInherent = Number((payload.controls.reduce((s, c) => s + c.inherentRisk, 0) / payload.controls.length).toFixed(1));
  const totalResidual = Number((payload.controls.reduce((s, c) => s + c.residualRisk, 0) / payload.controls.length).toFixed(1));
  const overallCEF = Number((payload.controls.reduce((s, c) => s + c.calculatedCEF, 0) / payload.controls.length).toFixed(2));

  const summaryData = [
    ['CUSTOM RCSA BY TECHNOSCOPE - EXECUTIVE SUMMARY REPORT'],
    ['Standard', 'NIST SP 800-53 Rev. 5 (Security and Privacy Controls)'],
    ['Assessment ID', payload.assessmentId],
    ['Assessment Name', payload.assessmentName],
    ['Target System', payload.organizationProfile.targetSystem],
    ['Sector Profile', payload.organizationProfile.sector],
    ['Compliance Baseline', payload.organizationProfile.complianceTarget],
    ['System Impact Level', payload.organizationProfile.systemImpactLevel],
    ['Lead Assessor', `${payload.organizationProfile.assessorName} (${payload.organizationProfile.assessorId})`],
    ['Assessment Date', payload.organizationProfile.lastAssessmentDate],
    ['Sign-off Status', payload.auditSignoff.status],
    [],
    ['EXECUTIVE METRICS'],
    ['Total Controls Evaluated', payload.controls.length],
    ['Average Inherent Risk (1-25)', totalInherent],
    ['Overall Control Effectiveness Factor (CEF 0.0 - 1.0)', overallCEF],
    ['Average Residual Risk (0.1 - 25)', totalResidual],
    ['Critical Residual Risks', payload.controls.filter(c => getControlRiskLevel(c.residualRisk) === 'Critical').length],
    ['High Residual Risks', payload.controls.filter(c => getControlRiskLevel(c.residualRisk) === 'High').length],
    ['Medium Residual Risks', payload.controls.filter(c => getControlRiskLevel(c.residualRisk) === 'Medium').length],
    ['Low Residual Risks', payload.controls.filter(c => getControlRiskLevel(c.residualRisk) === 'Low').length],
    [],
    ['DOMAIN RISK BREAKDOWN'],
    ['Domain', 'Total Controls', 'Assessed Count', 'Inherent Risk Avg', 'Avg CEF', 'Residual Risk Avg', 'Critical Issues', 'Status'],
    ...domainSummaries.map(d => [
      d.domain,
      d.totalControls,
      d.assessedCount,
      d.aggregateInherentRisk,
      d.averageCEF,
      d.aggregateResidualRisk,
      d.criticalCount,
      d.status,
    ]),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Executive Summary');

  // Sheet 2: Control Assessment Register
  const registerHeaders = [
    'Control ID',
    'Control Title',
    'Family',
    'Domain',
    'Inherent Impact (I)',
    'Inherent Likelihood (L)',
    'Inherent Risk (IR = I*L)',
    'Design Effectiveness (De)',
    'Operating Effectiveness (Oe)',
    'Deficiency Penalty (Delta)',
    'Calculated CEF',
    'Confidence Factor (Cf)',
    'Residual Risk (RR)',
    'Risk Level',
    'Compliance Status',
    'Implementation Evidence',
    'Identified Gaps & Audit Issues',
    'Assigned Owner',
  ];

  const registerRows = payload.controls.map((c, idx) => {
    const rowNum = idx + 2;
    return [
      c.controlId,
      c.title,
      c.family,
      c.domain,
      c.inherentImpact,
      c.inherentLikelihood,
      { t: 'n', f: `E${rowNum}*F${rowNum}`, v: c.inherentRisk },
      c.designEffectiveness,
      c.operatingEffectiveness,
      c.deficiencyPenalty,
      { t: 'n', f: `(0.4*H${rowNum}+0.6*I${rowNum})*(1-J${rowNum})`, v: c.calculatedCEF },
      c.confidenceFactor,
      { t: 'n', f: `G${rowNum}*(1-(K${rowNum}*L${rowNum}))`, v: c.residualRisk },
      getControlRiskLevel(c.residualRisk),
      c.status,
      c.implementationEvidence,
      c.gapsIdentified || 'None',
      c.assignedOwner || 'Unassigned',
    ];
  });

  const wsRegister = XLSX.utils.aoa_to_sheet([registerHeaders, ...registerRows]);
  XLSX.utils.book_append_sheet(wb, wsRegister, 'Control Register');

  // Sheet 3: AI Remediation Roadmap
  if (payload.aiRemediation && payload.aiRemediation.roadmap.length > 0) {
    const roadmapHeaders = [
      'Priority',
      'Target Control',
      'Control Title',
      'Domain',
      'Identified Gap Summary',
      'Technical Remediation Action',
      'Compensating Control',
      'Estimated Residual Reduction',
      'Timeline',
      'Validation Criteria',
      'Status',
      'Assigned To',
      'Due Date',
    ];

    const roadmapRows = payload.aiRemediation.roadmap.map(item => [
      item.priority,
      item.targetControl,
      item.controlTitle,
      item.domain,
      item.gapSummary,
      item.technicalRemediationAction,
      item.compensatingControl,
      item.estimatedResidualReduction,
      item.implementationTimeline,
      item.validationCriteria,
      item.status,
      item.assignedTo || 'Lead Architect',
      item.dueDate || '2026-09-30',
    ]);

    const wsRoadmap = XLSX.utils.aoa_to_sheet([roadmapHeaders, ...roadmapRows]);
    XLSX.utils.book_append_sheet(wb, wsRoadmap, 'Remediation Roadmap');
  }

  // Sheet 4: Version History & Rollback Ledger
  if (payload.versionHistory && payload.versionHistory.length > 0) {
    const versionHeaders = [
      'Version Tag',
      'Version Number',
      'Timestamp (ISO)',
      'Author / Assessor',
      'Residual Risk',
      'CEF Maturity',
      'Critical Deficiencies',
      'High Deficiencies',
      'Total Controls',
      'Audit Status',
      'Change Summary / Notes',
    ];

    const versionRows = payload.versionHistory.map((v) => [
      v.versionTag,
      v.versionNumber,
      v.timestamp,
      v.author,
      v.metrics.residualRisk,
      `${(v.metrics.cefScore * 100).toFixed(0)}%`,
      v.metrics.criticalDeficiencies,
      v.metrics.highDeficiencies,
      v.metrics.totalControls,
      v.metrics.auditStatus,
      v.changeSummary,
    ]);

    const wsVersion = XLSX.utils.aoa_to_sheet([versionHeaders, ...versionRows]);
    XLSX.utils.book_append_sheet(wb, wsVersion, 'Version History');
  }

  // Write file
  const fileName = `${payload.assessmentId}_Custom_RCSA_Technoscope.xlsx`;
  XLSX.writeFile(wb, fileName);
}

export function exportRCSAToJSON(payload: RCSAPayload): void {
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${payload.assessmentId}_NIST800_53_RCSA.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printAuditReport(_payload?: RCSAPayload): void {
  window.print();
}
