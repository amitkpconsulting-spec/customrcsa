import React, { useState } from 'react';
import {
  RiskTreatmentPlan,
  RiskTreatmentItem,
  RiskTreatmentMilestone,
} from '../types';
import {
  AlertTriangle,
  Shield,
  User,
  Calendar,
  TrendingDown,
  Plus,
  Trash2,
  CheckCircle2,
  Cpu,
  Sparkles,
  Edit3,
  Sliders,
  Play,
  RotateCcw,
} from 'lucide-react';

interface HighResidualRiskWorkspaceProps {
  rtp: RiskTreatmentPlan;
  onUpdateItem: (updatedItem: RiskTreatmentItem) => void;
  onOpenModal: (item: RiskTreatmentItem) => void;
  onAddNewRisk: () => void;
  onOpenCriteria: () => void;
  onApplyToAssessment: () => void;
}

export const HighResidualRiskWorkspace: React.FC<HighResidualRiskWorkspaceProps> = ({
  rtp,
  onUpdateItem,
  onOpenModal,
  onAddNewRisk,
  onOpenCriteria,
  onApplyToAssessment,
}) => {
  // Local state for inline new step inputs keyed by itemId
  const [inlineNewSteps, setInlineNewSteps] = useState<Record<string, string>>({});

  // Filter for high residual risk controls (score >= 9.0 or High/Critical)
  const highRiskItems = rtp.items.filter(
    (i) => i.residualRisk >= 9.0 || i.riskScoreBand === 'High' || i.riskScoreBand === 'Critical'
  );

  const totalPointsToReduce = highRiskItems.reduce(
    (acc, curr) => acc + curr.projectedRiskReductionPts,
    0
  );

  const remediatedCount = highRiskItems.filter((i) => i.status === 'REMEDIATED').length;
  const automatedCount = highRiskItems.filter((i) => i.isAutomatedSafeguard).length;

  // Handlers
  const handleAddInlineStep = (itemId: string) => {
    const text = inlineNewSteps[itemId];
    if (!text || !text.trim()) return;
    const item = rtp.items.find((i) => i.id === itemId);
    if (!item) return;

    const updated: RiskTreatmentItem = {
      ...item,
      actionPlanSteps: [...item.actionPlanSteps, text.trim()],
    };
    onUpdateItem(updated);
    setInlineNewSteps({ ...inlineNewSteps, [itemId]: '' });
  };

  const handleRemoveStep = (itemId: string, stepIdx: number) => {
    const item = rtp.items.find((i) => i.id === itemId);
    if (!item) return;
    const updated: RiskTreatmentItem = {
      ...item,
      actionPlanSteps: item.actionPlanSteps.filter((_, idx) => idx !== stepIdx),
    };
    onUpdateItem(updated);
  };

  const handleOwnerChange = (itemId: string, name: string) => {
    const item = rtp.items.find((i) => i.id === itemId);
    if (!item) return;
    onUpdateItem({ ...item, namedOwner: name });
  };

  const handleRoleChange = (itemId: string, role: string) => {
    const item = rtp.items.find((i) => i.id === itemId);
    if (!item) return;
    onUpdateItem({ ...item, ownerRole: role });
  };

  const handleDateChange = (itemId: string, deadline: string) => {
    const item = rtp.items.find((i) => i.id === itemId);
    if (!item) return;
    onUpdateItem({ ...item, deadline });
  };

  const handleNextReviewChange = (itemId: string, nextReviewDate: string) => {
    const item = rtp.items.find((i) => i.id === itemId);
    if (!item) return;
    onUpdateItem({ ...item, nextReviewDate });
  };

  const handleMilestoneChange = (itemId: string, milestone: string) => {
    const item = rtp.items.find((i) => i.id === itemId);
    if (!item) return;
    onUpdateItem({ ...item, quarterMilestone: milestone });
  };

  const handleReductionPtsChange = (itemId: string, pts: number) => {
    const item = rtp.items.find((i) => i.id === itemId);
    if (!item) return;
    const projectedResidual = Math.max(1.0, Number((item.residualRisk - pts).toFixed(1)));
    onUpdateItem({
      ...item,
      projectedRiskReductionPts: pts,
      desiredTargetResidual: projectedResidual,
    });
  };

  const handleToggleAutomation = (itemId: string) => {
    const item = rtp.items.find((i) => i.id === itemId);
    if (!item) return;
    const nextAuto = !item.isAutomatedSafeguard;
    const newTargetResidual = nextAuto
      ? Number((item.residualRisk * 0.35).toFixed(1))
      : Number((item.residualRisk * 0.65).toFixed(1));
    const newReductionPts = Number(Math.max(1.0, item.residualRisk - newTargetResidual).toFixed(1));

    onUpdateItem({
      ...item,
      isAutomatedSafeguard: nextAuto,
      desiredTargetResidual: newTargetResidual,
      projectedRiskReductionPts: newReductionPts,
      treatmentRationale: nextAuto
        ? 'Automated security safeguard and continuous policy validation deployed.'
        : 'Reverted to manual checklist with periodic supervisory sign-off.',
    });
  };

  return (
    <div className="space-y-6 font-mono text-white animate-fadeIn">
      {/* 1. WORKSPACE BANNER & METRICS */}
      <div className="border border-rose-900/70 bg-[#120a0d] p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-rose-950 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-rose-950 border border-rose-600 text-rose-300">
                PRIORITY REDUCTION QUEUE
              </span>
              <span className="text-xs text-[#888888]">
                Major Risk Score &gt;= {rtp.priorityCriteria.minResidualRiskScore.toFixed(1)}
              </span>
            </div>
            <h3 className="text-xl font-syne font-bold uppercase text-white mt-1">
              High Residual Risk Remediation Workspace
            </h3>
            <p className="text-xs text-[#aaaaaa] mt-1 max-w-3xl leading-relaxed">
              Dedicated interface to define specific remediation action steps, assign accountable Product Owners,
              enforce target completion dates, and track risk reduction milestones for all prioritized high-risk controls.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenCriteria}
              className="px-3 py-1.5 border border-[#333333] bg-black hover:border-[#f5ff00] hover:text-[#f5ff00] text-xs font-bold uppercase transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-[#f5ff00]" />
              <span>Priority Thresholds</span>
            </button>

            <button
              onClick={onAddNewRisk}
              className="px-3 py-1.5 bg-[#f5ff00] text-black font-bold uppercase text-xs hover:bg-yellow-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Risk</span>
            </button>

            <button
              onClick={onApplyToAssessment}
              className="px-3 py-1.5 bg-emerald-500 text-black font-bold uppercase text-xs hover:bg-emerald-400 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Apply to Assessment</span>
            </button>
          </div>
        </div>

        {/* 4 Quantitative Workspace KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 border border-rose-900/50 bg-black">
            <span className="text-[10px] text-rose-400 uppercase font-bold block">
              High Risk Controls
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-rose-300">{highRiskItems.length}</span>
              <span className="text-[10px] text-[#666666]">controls</span>
            </div>
            <span className="text-[10px] text-[#888888] mt-0.5 block">Major score &gt;= 9.0</span>
          </div>

          <div className="p-3 border border-[#262626] bg-black">
            <span className="text-[10px] text-amber-400 uppercase font-bold block">
              Target Risk Reduction
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-amber-300">
                -{totalPointsToReduce.toFixed(1)}
              </span>
              <span className="text-[10px] text-[#666666]">points</span>
            </div>
            <span className="text-[10px] text-[#888888] mt-0.5 block">Sum of milestone yields</span>
          </div>

          <div className="p-3 border border-[#262626] bg-black">
            <span className="text-[10px] text-[#38bdf8] uppercase font-bold block">
              Automated Safeguards
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-[#38bdf8]">{automatedCount}</span>
              <span className="text-[10px] text-[#666666]">/ {highRiskItems.length} active</span>
            </div>
            <span className="text-[10px] text-[#888888] mt-0.5 block">Manual checklists replaced</span>
          </div>

          <div className="p-3 border border-[#262626] bg-black">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">
              Remediated Controls
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-emerald-300">{remediatedCount}</span>
              <span className="text-[10px] text-[#666666]">completed</span>
            </div>
            <span className="text-[10px] text-[#888888] mt-0.5 block">Safeguards active in prod</span>
          </div>
        </div>
      </div>

      {/* 2. HIGH RISK CONTROLS LIST WITH INTERACTIVE CONTROLS */}
      <div className="space-y-4">
        {highRiskItems.length === 0 ? (
          <div className="border border-[#262626] bg-[#141414] p-8 text-center text-xs text-[#888888] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white uppercase">
              Zero Controls In High Residual Risk Queue
            </h4>
            <p>All controls are currently operating below the Major Risk threshold (&lt; {rtp.priorityCriteria.minResidualRiskScore.toFixed(1)}).</p>
          </div>
        ) : (
          highRiskItems.map((item, idx) => {
            const isCritical = item.residualRisk >= 15.0;

            return (
              <div
                key={item.id}
                className={`border bg-[#121212] transition ${
                  isCritical ? 'border-rose-600/80 shadow-[0_0_15px_rgba(225,29,72,0.15)]' : 'border-amber-600/60'
                }`}
              >
                {/* Control Header Bar */}
                <div className="p-4 bg-black border-b border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#666666]">#{idx + 1}</span>
                      <span className="px-2 py-0.5 bg-black border border-[#333333] text-[#f5ff00] font-bold text-xs">
                        {item.controlId}
                      </span>
                      <h4 className="font-syne font-bold text-sm text-white uppercase">
                        {item.controlTitle}
                      </h4>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider border ${
                          isCritical
                            ? 'border-rose-600 bg-rose-950 text-rose-300'
                            : 'border-amber-600 bg-amber-950 text-amber-300'
                        }`}
                      >
                        Risk: {item.riskScoreBand} ({item.residualRisk.toFixed(1)})
                      </span>
                    </div>

                    <div className="text-[11px] text-[#888888] flex items-center gap-2 flex-wrap">
                      <span>Process: <strong className="text-white">{item.businessProcessOrApp}</strong></span>
                      <span>•</span>
                      <span>Domain: <strong className="text-white">{item.domain}</strong></span>
                      <span>•</span>
                      <span>Area: <strong className="text-white">{item.whoRiskArea || 'Security Safeguards'}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onOpenModal(item)}
                      className="px-3 py-1.5 bg-[#1e293b] border border-[#38bdf8] text-[#38bdf8] hover:bg-[#38bdf8] hover:text-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Full Workspace Modal</span>
                    </button>
                  </div>
                </div>

                {/* 4 Interactive Columns: Steps, Owners, Dates, Milestones */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-xs">
                  {/* COL 1: INTERFACE TO DEFINE REMEDIATION STEPS */}
                  <div className="p-3 border border-[#262626] bg-black/60 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#222222] pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#f5ff00] flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Remediation Steps ({item.actionPlanSteps.length})
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {item.actionPlanSteps.map((step, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start justify-between gap-1.5 p-1.5 bg-[#161616] border border-[#262626]"
                        >
                          <span className="text-amber-400 font-bold shrink-0">{sIdx + 1}.</span>
                          <span className="text-[11px] text-[#cccccc] flex-1 leading-tight">
                            {step}
                          </span>
                          <button
                            onClick={() => handleRemoveStep(item.id, sIdx)}
                            className="text-[#666666] hover:text-rose-400 shrink-0 p-0.5"
                            title="Remove step"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Inline Add Step Input */}
                    <div className="flex items-center gap-1 pt-1">
                      <input
                        type="text"
                        value={inlineNewSteps[item.id] || ''}
                        onChange={(e) =>
                          setInlineNewSteps({ ...inlineNewSteps, [item.id]: e.target.value })
                        }
                        onKeyDown={(e) => e.key === 'Enter' && handleAddInlineStep(item.id)}
                        placeholder="Add remediation step..."
                        className="flex-1 px-2 py-1 bg-black border border-[#333333] text-[11px] text-white outline-none focus:border-[#f5ff00]"
                      />
                      <button
                        onClick={() => handleAddInlineStep(item.id)}
                        className="px-2 py-1 bg-[#f5ff00] text-black font-bold text-[10px] uppercase hover:bg-yellow-300"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* COL 2: INTERFACE TO ASSIGN OWNERS */}
                  <div className="p-3 border border-[#262626] bg-black/60 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#222222] pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-[#38bdf8] flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Accountable Owner & Role
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[9px] text-[#888888] block">Named Owner:</span>
                        <input
                          type="text"
                          value={item.namedOwner}
                          onChange={(e) => handleOwnerChange(item.id, e.target.value)}
                          className="w-full px-2 py-1 bg-black border border-[#333333] text-white text-[11px] focus:border-[#38bdf8] outline-none"
                        />
                      </div>

                      <div>
                        <span className="text-[9px] text-[#888888] block">Owner Role / Function:</span>
                        <input
                          type="text"
                          value={item.ownerRole}
                          onChange={(e) => handleRoleChange(item.id, e.target.value)}
                          className="w-full px-2 py-1 bg-black border border-[#333333] text-white text-[11px] focus:border-[#38bdf8] outline-none"
                        />
                      </div>

                      <div>
                        <span className="text-[9px] text-[#888888] block">Remediation Status:</span>
                        <select
                          value={item.status}
                          onChange={(e) =>
                            onUpdateItem({ ...item, status: e.target.value as any })
                          }
                          className="w-full px-2 py-1 bg-black border border-[#333333] text-white text-[11px] focus:border-[#38bdf8] outline-none"
                        >
                          <option value="NOT_STARTED">Not Started</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="VALIDATING">Validating</option>
                          <option value="REMEDIATED">Remediated</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* COL 3: INTERFACE TO SET TARGET COMPLETION DATES */}
                  <div className="p-3 border border-[#262626] bg-black/60 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#222222] pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Target Completion Dates
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[9px] text-[#888888] block">Target Deadline:</span>
                        <input
                          type="date"
                          value={item.deadline}
                          onChange={(e) => handleDateChange(item.id, e.target.value)}
                          className="w-full px-2 py-1 bg-black border border-[#333333] text-white text-[11px] focus:border-amber-400 outline-none"
                        />
                      </div>

                      <div>
                        <span className="text-[9px] text-[#888888] block">Next Review Date:</span>
                        <input
                          type="date"
                          value={item.nextReviewDate || item.deadline}
                          onChange={(e) => handleNextReviewChange(item.id, e.target.value)}
                          className="w-full px-2 py-1 bg-black border border-[#333333] text-white text-[11px] focus:border-amber-400 outline-none"
                        />
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[10px] text-[#888888]">
                        <span>Review SLA: 30 Days</span>
                        <span className="text-amber-300 font-bold">{item.deadline}</span>
                      </div>
                    </div>
                  </div>

                  {/* COL 4: INTERFACE TO TRACK RISK REDUCTION MILESTONES */}
                  <div className="p-3 border border-[#262626] bg-black/60 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-[#222222] pb-1.5">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        Risk Reduction Milestones
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-[9px] text-[#888888] block">Quarter Milestone:</span>
                        <select
                          value={item.quarterMilestone}
                          onChange={(e) => handleMilestoneChange(item.id, e.target.value)}
                          className="w-full px-2 py-1 bg-black border border-[#333333] text-white text-[11px] focus:border-emerald-400 outline-none"
                        >
                          <option value="Q1 2026">Q1 2026</option>
                          <option value="Q2 2026">Q2 2026</option>
                          <option value="Q3 2026">Q3 2026</option>
                          <option value="Q4 2026">Q4 2026</option>
                          <option value="FY 2027">FY 2027</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[9px] text-[#888888] block">Target Reduction Points:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0.5"
                          max={item.residualRisk}
                          value={item.projectedRiskReductionPts}
                          onChange={(e) =>
                            handleReductionPtsChange(item.id, parseFloat(e.target.value) || 1)
                          }
                          className="w-full px-2 py-1 bg-black border border-[#333333] text-emerald-300 font-bold text-[11px] focus:border-emerald-400 outline-none"
                        />
                      </div>

                      {/* Before / After Gauge */}
                      <div className="p-1.5 bg-[#161616] border border-[#262626] flex items-center justify-between">
                        <span className="text-[10px] text-rose-400">RR: {item.residualRisk.toFixed(1)}</span>
                        <span className="text-[10px] text-[#666666]">➔</span>
                        <span className="text-[10px] text-emerald-400 font-bold">
                          Target: {item.desiredTargetResidual.toFixed(1)} pts
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Bar: Automation Switch & Contingency Plan */}
                <div className="p-3 bg-black/90 border-t border-[#222222] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[11px] text-[#aaaaaa]">
                    <strong className="text-purple-400">Contingency:</strong>
                    <span className="truncate max-w-xl" title={item.contingencyPlan}>
                      {item.contingencyPlan || 'Invoke backup controls and notify incident commander.'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleAutomation(item.id)}
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase transition flex items-center gap-1 cursor-pointer ${
                        item.isAutomatedSafeguard
                          ? 'bg-[#38bdf8] text-black hover:bg-sky-400'
                          : 'bg-black border border-[#38bdf8] text-[#38bdf8] hover:bg-[#38bdf8] hover:text-black'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{item.isAutomatedSafeguard ? 'Automated Safeguard Active' : 'Switch to Automated'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
