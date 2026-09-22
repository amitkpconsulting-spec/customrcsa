import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingDown,
  Gauge,
  Sliders,
  ExternalLink,
  Zap,
  Activity,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';
import { AssessedControl, RCSAPayload } from '../types';

interface RiskManagementMetricsCardProps {
  assessment: RCSAPayload;
  onNavigateToStage: (stage: any) => void;
  onSelectControlForReview: (controlId: string) => void;
  onFilterDomainInQuestionnaire?: (domain: string) => void;
}

export const RiskManagementMetricsCard: React.FC<RiskManagementMetricsCardProps> = ({
  assessment,
  onNavigateToStage,
  onSelectControlForReview,
  onFilterDomainInQuestionnaire,
}) => {
  const { controls, riskTreatmentPlan, aiRemediation } = assessment;

  // 1. Total Controls Evaluated calculations
  const totalControlsCount = controls.length;
  const evaluatedControls = controls.filter((c) => c.status !== 'NOT_EVALUATED');
  const evaluatedControlsCount = evaluatedControls.length;
  const evaluatedPct = totalControlsCount > 0 ? Math.round((evaluatedControlsCount / totalControlsCount) * 100) : 0;

  const compliantCount = controls.filter((c) => c.status === 'COMPLIANT' || c.status === 'SATISFACTORY').length;
  const needsAttentionCount = controls.filter((c) => c.status === 'NEEDS_ATTENTION').length;
  const criticalDeficiencyCount = controls.filter((c) => c.status === 'CRITICAL_DEFICIENCY').length;
  const notEvaluatedCount = controls.filter((c) => c.status === 'NOT_EVALUATED').length;

  // 2. Remediation Progress (%) calculations
  const rtpItems = riskTreatmentPlan?.items || [];
  const rtpTotal = rtpItems.length;
  const rtpCompleted = rtpItems.filter((i) => i.status === 'REMEDIATED' || i.status === 'ACCEPTED_WITHIN_LIMITS').length;
  const rtpInProgress = rtpItems.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'VALIDATING').length;

  const aiRoadmap = aiRemediation?.roadmap || [];
  const aiTotal = aiRoadmap.length;
  const aiResolved = aiRoadmap.filter((r) => r.status === 'RESOLVED').length;
  const aiInProgress = aiRoadmap.filter((r) => r.status === 'IN_PROGRESS').length;

  let remediationProgressPct = 0;
  let remediationCompletedCount = 0;
  let remediationInProgressCount = 0;
  let remediationTotalCount = 0;
  let remediationSource = 'Controls Compliance';

  if (rtpTotal > 0) {
    remediationTotalCount = rtpTotal;
    remediationCompletedCount = rtpCompleted;
    remediationInProgressCount = rtpInProgress;
    remediationProgressPct = Math.min(100, Math.round(((rtpCompleted + rtpInProgress * 0.5) / rtpTotal) * 100));
    remediationSource = 'Risk Treatment Plan (RTP)';
  } else if (aiTotal > 0) {
    remediationTotalCount = aiTotal;
    remediationCompletedCount = aiResolved;
    remediationInProgressCount = aiInProgress;
    remediationProgressPct = Math.min(100, Math.round(((aiResolved + aiInProgress * 0.5) / aiTotal) * 100));
    remediationSource = 'AI Remediation Roadmap';
  } else {
    // Fallback based on control compliance among evaluated controls
    const targetNeedingRemediation = needsAttentionCount + criticalDeficiencyCount;
    remediationTotalCount = targetNeedingRemediation;
    if (targetNeedingRemediation === 0 && evaluatedControlsCount > 0) {
      remediationProgressPct = 100;
      remediationCompletedCount = compliantCount;
    } else if (evaluatedControlsCount > 0) {
      remediationProgressPct = Math.round((compliantCount / evaluatedControlsCount) * 100);
      remediationCompletedCount = compliantCount;
    }
    remediationSource = 'Evaluated Baseline';
  }

  // Active RTP milestone if available
  const activeMilestone = riskTreatmentPlan?.annualTracking?.milestones?.find(
    (m) => m.status === 'IN_PROGRESS' || m.status === 'PLANNED'
  );

  // 3. Critical Open Risks calculations
  // Severe open risks: residualRisk >= 15 OR status is CRITICAL_DEFICIENCY (and not remediated/compliant)
  const criticalOpenControls = controls.filter(
    (c) => (c.residualRisk >= 15 || c.status === 'CRITICAL_DEFICIENCY') && c.status !== 'COMPLIANT' && c.status !== 'SATISFACTORY'
  );
  // High open risks: residualRisk between 10.0 and 14.9
  const highOpenControls = controls.filter(
    (c) => c.residualRisk >= 10 && c.residualRisk < 15 && c.status !== 'COMPLIANT' && c.status !== 'SATISFACTORY'
  );

  const criticalOpenCount = criticalOpenControls.length;
  const highOpenCount = highOpenControls.length;
  const totalSevereOpenRisks = criticalOpenCount + highOpenCount;

  // Highest severity open control for direct action
  const topCriticalControl: AssessedControl | undefined = [...criticalOpenControls]
    .sort((a, b) => b.residualRisk - a.residualRisk)[0] ||
    [...highOpenControls].sort((a, b) => b.residualRisk - a.residualRisk)[0];

  // Overall posture status badge
  const isHealthy = criticalOpenCount === 0 && highOpenCount === 0;
  const isWarning = criticalOpenCount === 0 && highOpenCount > 0;
  const isCritical = criticalOpenCount > 0;

  // Net Risk Reduction across all controls
  const totalInherent = controls.reduce((s, c) => s + c.inherentRisk, 0);
  const totalResidual = controls.reduce((s, c) => s + c.residualRisk, 0);
  const netRiskReductionPct = totalInherent > 0
    ? Math.max(0, Math.round(((totalInherent - totalResidual) / totalInherent) * 100))
    : 0;

  return (
    <div className="border border-[#262626] bg-[#141414] p-5 space-y-5 transition shadow-lg">
      {/* Card Header & Operational Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#262626] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-[#f5ff00] text-black flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              Risk Management Metrics
            </span>
            <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">
              NIST SP 800-53 Rev. 5 // ISO 27005
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-syne font-bold uppercase tracking-tight text-white flex items-center gap-2">
            Governance & Remediation Health
          </h3>
        </div>

        {/* Global Posture Badge & Direct Navigation */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div
            className={`px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
              isCritical
                ? 'border-red-500/80 bg-red-950/40 text-red-400 animate-pulse'
                : isWarning
                ? 'border-orange-500/80 bg-orange-950/40 text-orange-400'
                : 'border-emerald-500/80 bg-emerald-950/40 text-emerald-400'
            }`}
          >
            {isCritical ? (
              <>
                <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                <span>{criticalOpenCount} Critical Open Exposure</span>
              </>
            ) : isWarning ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                <span>{highOpenCount} High Risks Open</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Optimal Risk Tolerability</span>
              </>
            )}
          </div>

          <button
            onClick={() => onNavigateToStage('assessment_workflow')}
            className="px-3 py-1 border border-[#38bdf8]/60 bg-[#0c1a24] hover:border-[#38bdf8] text-[#38bdf8] text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
            title="Open Risk Treatment Plan & Assessment Studio"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 3 Core Metric KPI Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Total Controls Evaluated */}
        <div className="p-4 bg-black border border-[#262626] flex flex-col justify-between space-y-4 hover:border-[#444444] transition group">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#888888] flex items-center gap-1">
                <Gauge className="w-3 h-3 text-[#f5ff00]" />
                Total Controls Evaluated
              </span>
              <span className="text-[10px] font-mono font-bold text-[#f5ff00] bg-[#1a1a00] px-1.5 py-0.2 border border-[#f5ff00]/40">
                {evaluatedPct}%
              </span>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-syne font-bold text-white tracking-tight">
                {evaluatedControlsCount}
              </span>
              <span className="text-xs font-mono text-[#666666]">
                / {totalControlsCount} total controls
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-[#222222] overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-[#f5ff00] to-yellow-400 transition-all duration-500"
                style={{ width: `${evaluatedPct}%` }}
              ></div>
            </div>
          </div>

          {/* Breakdown Mini-Grid */}
          <div className="pt-3 border-t border-[#222222] grid grid-cols-4 gap-1 text-center font-mono">
            <div className="p-1 bg-[#111111] border border-[#222222]">
              <div className="text-[8px] uppercase text-[#34d399] font-bold">Compliant</div>
              <div className="text-xs font-bold text-white">{compliantCount}</div>
            </div>
            <div className="p-1 bg-[#111111] border border-[#222222]">
              <div className="text-[8px] uppercase text-orange-400 font-bold">Attention</div>
              <div className="text-xs font-bold text-white">{needsAttentionCount}</div>
            </div>
            <div className="p-1 bg-[#111111] border border-[#222222]">
              <div className="text-[8px] uppercase text-red-400 font-bold">Critical</div>
              <div className="text-xs font-bold text-white">{criticalDeficiencyCount}</div>
            </div>
            <div className="p-1 bg-[#111111] border border-[#222222]">
              <div className="text-[8px] uppercase text-[#666666] font-bold">Pending</div>
              <div className="text-xs font-bold text-white">{notEvaluatedCount}</div>
            </div>
          </div>
        </div>

        {/* Metric 2: Remediation Progress (%) */}
        <div className="p-4 bg-black border border-[#262626] flex flex-col justify-between space-y-4 hover:border-[#444444] transition group">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#888888] flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#38bdf8]" />
                Remediation Progress (%)
              </span>
              <span className="text-[10px] font-mono text-[#38bdf8] bg-[#0c1a24] px-1.5 py-0.2 border border-[#38bdf8]/40">
                {remediationSource}
              </span>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span className="text-3xl font-syne font-bold text-[#38bdf8] tracking-tight">
                {remediationProgressPct}%
              </span>
              <span className="text-xs font-mono text-[#888888]">
                {remediationCompletedCount} resolved
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-[#222222] overflow-hidden mt-2">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-[#38bdf8] transition-all duration-500"
                style={{ width: `${remediationProgressPct}%` }}
              ></div>
            </div>
          </div>

          {/* Remediation Sub-Metrics & Milestones */}
          <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-[#888888]">
              <Clock className="w-3 h-3 text-[#38bdf8]" />
              <span>
                {remediationInProgressCount} In Progress / Validating
              </span>
            </div>
            {activeMilestone ? (
              <span className="text-[#38bdf8] font-bold text-[10px] truncate max-w-[140px]" title={activeMilestone.title}>
                {activeMilestone.period}: ↓{activeMilestone.targetRiskReductionPts} pts
              </span>
            ) : (
              <span className="text-emerald-400 font-bold text-[10px]">
                ↓{netRiskReductionPct}% Risk Reduced
              </span>
            )}
          </div>
        </div>

        {/* Metric 3: Critical Open Risks */}
        <div
          className={`p-4 bg-black border flex flex-col justify-between space-y-4 transition group ${
            isCritical
              ? 'border-red-600/70 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
              : isWarning
              ? 'border-orange-600/70 shadow-[0_0_15px_rgba(249,115,22,0.1)]'
              : 'border-[#262626] hover:border-[#444444]'
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#888888] flex items-center gap-1">
                <ShieldAlert
                  className={`w-3 h-3 ${isCritical ? 'text-red-400' : isWarning ? 'text-orange-400' : 'text-emerald-400'}`}
                />
                Critical Open Risks
              </span>
              <span
                className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 border ${
                  isCritical
                    ? 'border-red-500 bg-red-950/60 text-red-300'
                    : isWarning
                    ? 'border-orange-500 bg-orange-950/60 text-orange-300'
                    : 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                }`}
              >
                {isCritical ? 'ACTION REQUIRED' : isWarning ? 'ELEVATED RISK' : 'WITHIN TOLERANCE'}
              </span>
            </div>

            <div className="flex items-baseline gap-2 pt-1">
              <span
                className={`text-3xl font-syne font-bold tracking-tight ${
                  isCritical ? 'text-red-400' : isWarning ? 'text-orange-400' : 'text-emerald-400'
                }`}
              >
                {criticalOpenCount}
              </span>
              <span className="text-xs font-mono text-[#888888]">
                critical ({highOpenCount} high residual)
              </span>
            </div>

            {/* Severity Band Bar */}
            <div className="w-full h-1.5 bg-[#222222] overflow-hidden mt-2 flex">
              <div
                className="h-full bg-red-500 transition-all"
                style={{
                  width: `${Math.min(100, (criticalOpenCount / (totalSevereOpenRisks || 1)) * 100)}%`,
                }}
              ></div>
              <div
                className="h-full bg-orange-500 transition-all"
                style={{
                  width: `${Math.min(100, (highOpenCount / (totalSevereOpenRisks || 1)) * 100)}%`,
                }}
              ></div>
            </div>
          </div>

          {/* Quick Review of Top Critical Open Item */}
          <div className="pt-3 border-t border-[#222222] flex items-center justify-between text-[10px] font-mono">
            {topCriticalControl ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-white truncate max-w-[160px]" title={topCriticalControl.title}>
                  Top: <strong className="text-red-400">{topCriticalControl.controlId}</strong> ({topCriticalControl.residualRisk.toFixed(1)} RR)
                </span>
                <button
                  onClick={() => onSelectControlForReview(topCriticalControl.controlId)}
                  className="px-2 py-0.5 bg-[#222222] hover:bg-red-950/60 border border-[#333333] hover:border-red-500 text-white hover:text-red-300 transition flex items-center gap-1 cursor-pointer font-bold"
                >
                  <span>Review</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Zero open critical residual risk breaches</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Summary Banner: Treatment Taxonomy & Quick Action */}
      <div className="pt-2 border-t border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[#888888]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-[#aaaaaa]">
            <Sliders className="w-3 h-3 text-[#f5ff00]" />
            <span>4-Way Treatment:</span>
          </span>
          <span className="px-1.5 py-0.5 bg-black border border-[#2a2a2a] text-white">
            TRT: <strong className="text-[#38bdf8]">{rtpItems.filter((i) => i.treatmentOption === 'MITIGATE').length || compliantCount}</strong>
          </span>
          <span className="px-1.5 py-0.5 bg-black border border-[#2a2a2a] text-white">
            TOL: <strong className="text-[#f5ff00]">{rtpItems.filter((i) => i.treatmentOption === 'ACCEPT').length}</strong>
          </span>
          <span className="px-1.5 py-0.5 bg-black border border-[#2a2a2a] text-white">
            TSF: <strong className="text-purple-400">{rtpItems.filter((i) => i.treatmentOption === 'TRANSFER').length}</strong>
          </span>
          <span className="px-1.5 py-0.5 bg-black border border-[#2a2a2a] text-white">
            TMT: <strong className="text-red-400">{rtpItems.filter((i) => i.treatmentOption === 'AVOID').length}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[#666666]">
            Aggregate RR: <strong className="text-white">{(totalResidual / (totalControlsCount || 1)).toFixed(1)}</strong>
          </span>
          <button
            onClick={() => onNavigateToStage('assessment_workflow')}
            className="text-[#f5ff00] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Manage Treatment Plans &rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
};
