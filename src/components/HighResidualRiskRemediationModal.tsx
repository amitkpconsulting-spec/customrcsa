import React, { useState } from 'react';
import {
  RiskTreatmentItem,
  RiskTreatmentOption,
  RiskTreatmentMilestone,
} from '../types';
import {
  Shield,
  Calendar,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  Cpu,
  Sparkles,
  Layers,
  Clock,
  RotateCcw,
} from 'lucide-react';

interface HighResidualRiskRemediationModalProps {
  item: RiskTreatmentItem;
  milestones: RiskTreatmentMilestone[];
  onSave: (updatedItem: RiskTreatmentItem) => void;
  onClose: () => void;
}

export const HighResidualRiskRemediationModal: React.FC<HighResidualRiskRemediationModalProps> = ({
  item,
  milestones,
  onSave,
  onClose,
}) => {
  // Form State
  const [controlTitle, setControlTitle] = useState(item.controlTitle);
  const [namedOwner, setNamedOwner] = useState(item.namedOwner);
  const [ownerRole, setOwnerRole] = useState(item.ownerRole);
  const [deadline, setDeadline] = useState(item.deadline);
  const [nextReviewDate, setNextReviewDate] = useState(item.nextReviewDate || '');
  const [treatmentOption, setTreatmentOption] = useState<RiskTreatmentOption>(item.treatmentOption);
  const [treatmentRationale, setTreatmentRationale] = useState(item.treatmentRationale);
  const [actionSteps, setActionSteps] = useState<string[]>([...item.actionPlanSteps]);
  const [newStepText, setNewStepText] = useState('');
  const [contingencyPlan, setContingencyPlan] = useState(item.contingencyPlan || '');
  const [specificConcern, setSpecificConcern] = useState(item.specificConcern || '');
  const [isAutomatedSafeguard, setIsAutomatedSafeguard] = useState(item.isAutomatedSafeguard);
  const [automationMechanism, setAutomationMechanism] = useState(item.automationMechanism);
  const [manualChecklistReplaced, setManualChecklistReplaced] = useState(item.manualChecklistReplaced);
  const [quarterMilestone, setQuarterMilestone] = useState(item.quarterMilestone);
  const [projectedRiskReductionPts, setProjectedRiskReductionPts] = useState(item.projectedRiskReductionPts);
  const [status, setStatus] = useState(item.status);
  const [probabilityRating, setProbabilityRating] = useState<'L' | 'M' | 'H'>(item.probabilityRating || 'H');
  const [impactRating, setImpactRating] = useState<'L' | 'M' | 'H'>(item.impactRating || 'H');
  const [detectabilityRating, setDetectabilityRating] = useState<'L' | 'M' | 'H'>(item.detectabilityRating || 'M');

  // Step Handlers
  const handleAddStep = () => {
    if (!newStepText.trim()) return;
    setActionSteps([...actionSteps, newStepText.trim()]);
    setNewStepText('');
  };

  const handleRemoveStep = (index: number) => {
    setActionSteps(actionSteps.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, val: string) => {
    const updated = [...actionSteps];
    updated[index] = val;
    setActionSteps(updated);
  };

  // Date Presets
  const setDeadlineDaysFromNow = (days: number) => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setDeadline(d.toISOString().split('T')[0]);
  };

  const setReviewDaysFromNow = (days: number) => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    setNextReviewDate(d.toISOString().split('T')[0]);
  };

  // Projected Residual Calculation
  const projectedResidual = Math.max(
    1.0,
    Number((item.residualRisk - projectedRiskReductionPts).toFixed(1))
  );

  const handleSave = () => {
    const updated: RiskTreatmentItem = {
      ...item,
      controlTitle,
      namedOwner,
      ownerRole,
      deadline,
      nextReviewDate: nextReviewDate || deadline,
      treatmentOption,
      treatmentRationale,
      actionPlanSteps: actionSteps,
      contingencyPlan,
      specificConcern,
      isAutomatedSafeguard,
      automationMechanism,
      manualChecklistReplaced,
      quarterMilestone,
      projectedRiskReductionPts: Number(projectedRiskReductionPts),
      desiredTargetResidual: projectedResidual,
      status,
      probabilityRating,
      impactRating,
      detectabilityRating,
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="border border-[#38bdf8]/40 bg-[#121212] w-full max-w-4xl p-6 space-y-6 shadow-2xl font-mono text-white max-h-[92vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#262626] pb-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-[#0369a1] text-sky-100 border border-[#38bdf8]">
                REMEDIATION WORKSPACE
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-rose-950 border border-rose-700 text-rose-300">
                Major Risk Score: {item.residualRisk.toFixed(1)} ({item.riskScoreBand})
              </span>
              <span className="text-[10px] px-2 py-0.5 bg-black border border-[#333333] text-[#aaaaaa]">
                Control ID: {item.controlId}
              </span>
            </div>
            <h3 className="text-xl font-syne font-bold uppercase text-white">
              Configure Risk Treatment & Action Plan: {item.controlId}
            </h3>
            <p className="text-xs text-[#888888]">
              Define remediation action steps, assign accountable owners, set strict completion dates, and schedule risk reduction milestones.
            </p>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1 text-[#888888] hover:text-white border border-transparent hover:border-[#333333] text-sm"
          >
            ✕ Close
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-6 overflow-y-auto pr-1 text-xs">
          {/* TOP SUMMARY / RESIDUAL REDUCTION IMPACT GAUGE */}
          <div className="p-4 border border-[#262626] bg-black grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-[#888888] block uppercase font-bold">Inherent Risk</span>
              <span className="text-xl font-bold text-white">{item.inherentRisk}</span>
              <span className="text-[10px] text-[#666666] block">Likelihood × Impact</span>
            </div>
            <div>
              <span className="text-[10px] text-[#888888] block uppercase font-bold">Pre-Treatment Residual</span>
              <span className="text-xl font-bold text-rose-400">{item.residualRisk.toFixed(1)}</span>
              <span className="text-[10px] text-rose-500/80 block">Current Deficient Posture</span>
            </div>
            <div>
              <span className="text-[10px] text-[#888888] block uppercase font-bold">Risk Reduction Target</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max={item.residualRisk}
                  value={projectedRiskReductionPts}
                  onChange={(e) => setProjectedRiskReductionPts(parseFloat(e.target.value) || 1)}
                  className="w-20 px-2 py-0.5 bg-[#181818] border border-[#38bdf8] text-[#38bdf8] font-bold text-base"
                />
                <span className="text-xs text-[#38bdf8] font-bold">pts</span>
              </div>
              <span className="text-[10px] text-[#666666] block">Milestone Yield</span>
            </div>
            <div>
              <span className="text-[10px] text-[#888888] block uppercase font-bold">Post-Remediation Target</span>
              <span className="text-xl font-bold text-emerald-400">{projectedResidual.toFixed(1)}</span>
              <span className="text-[10px] text-emerald-500 block">
                (-{Math.round((projectedRiskReductionPts / item.residualRisk) * 100)}% reduction)
              </span>
            </div>
          </div>

          {/* 1. INTERFACE: DEFINE REMEDIATION STEPS */}
          <div className="p-4 border border-[#333333] bg-[#161616] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#f5ff00] flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                1. Define Remediation Steps & Procedures ({actionSteps.length} Active Steps)
              </label>
              <span className="text-[10px] text-[#888888]">
                Specific technical & operational actions to resolve deficiencies
              </span>
            </div>

            {/* List of current steps */}
            <div className="space-y-2">
              {actionSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-black border border-[#2a2a2a] p-2">
                  <span className="text-xs font-bold text-[#f5ff00] w-6 shrink-0 text-center">
                    {idx + 1}.
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => handleStepChange(idx, e.target.value)}
                    className="flex-1 bg-transparent text-xs text-white border-none outline-none focus:text-[#f5ff00]"
                  />
                  <button
                    onClick={() => handleRemoveStep(idx)}
                    className="p-1 text-[#666666] hover:text-rose-400 transition"
                    title="Remove step"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new step input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddStep()}
                placeholder="Type new remediation action and press Enter or Click Add..."
                className="flex-1 px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none text-xs"
              />
              <button
                onClick={handleAddStep}
                className="px-3 py-2 bg-[#f5ff00] text-black font-bold uppercase tracking-wider hover:bg-yellow-300 transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>
          </div>

          {/* 2. INTERFACE: ASSIGN OWNERS & TIMELINES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Owner Details */}
            <div className="p-4 border border-[#333333] bg-[#161616] space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#38bdf8] flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                2. Assign Accountable Owner & Role
              </label>

              <div>
                <span className="text-[10px] text-[#888888] block mb-1">Named Owner:</span>
                <input
                  type="text"
                  value={namedOwner}
                  onChange={(e) => setNamedOwner(e.target.value)}
                  placeholder="e.g. Sarah Chen, David Miller"
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#888888] block mb-1">Owner Role / Title:</span>
                <input
                  type="text"
                  value={ownerRole}
                  onChange={(e) => setOwnerRole(e.target.value)}
                  placeholder="e.g. Product Owner, Lead Identity Architect, SecOps Lead"
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#888888] block mb-1">Remediation Status:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
                >
                  <option value="NOT_STARTED">NOT STARTED</option>
                  <option value="IN_PROGRESS">IN PROGRESS (Remediating)</option>
                  <option value="VALIDATING">VALIDATING (Under Audit Review)</option>
                  <option value="REMEDIATED">REMEDIATED (Safeguard Active)</option>
                  <option value="ACCEPTED_WITHIN_LIMITS">ACCEPTED WITHIN LIMITS</option>
                </select>
              </div>
            </div>

            {/* Target Completion Dates */}
            <div className="p-4 border border-[#333333] bg-[#161616] space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                3. Target Completion Date & Next Review
              </label>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#888888]">Target Completion Date (Deadline):</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDeadlineDaysFromNow(30)}
                      className="text-[9px] px-1.5 py-0.5 bg-black border border-[#333333] hover:text-white"
                    >
                      +30d
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeadlineDaysFromNow(60)}
                      className="text-[9px] px-1.5 py-0.5 bg-black border border-[#333333] hover:text-white"
                    >
                      +60d
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeadlineDaysFromNow(90)}
                      className="text-[9px] px-1.5 py-0.5 bg-black border border-[#333333] hover:text-white"
                    >
                      +90d
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-amber-400 outline-none font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#888888]">Next Review Date (Follow-up):</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setReviewDaysFromNow(14)}
                      className="text-[9px] px-1.5 py-0.5 bg-black border border-[#333333] hover:text-white"
                    >
                      +14d
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewDaysFromNow(30)}
                      className="text-[9px] px-1.5 py-0.5 bg-black border border-[#333333] hover:text-white"
                    >
                      +30d
                    </button>
                  </div>
                </div>
                <input
                  type="date"
                  value={nextReviewDate}
                  onChange={(e) => setNextReviewDate(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-amber-400 outline-none font-mono"
                />
              </div>

              <div>
                <span className="text-[10px] text-[#888888] block mb-1">Aligned Milestone Period:</span>
                <select
                  value={quarterMilestone}
                  onChange={(e) => setQuarterMilestone(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-amber-400 outline-none"
                >
                  <option value="Q1 2026">Q1 2026 Milestone</option>
                  <option value="Q2 2026">Q2 2026 Milestone</option>
                  <option value="Q3 2026">Q3 2026 Milestone</option>
                  <option value="Q4 2026">Q4 2026 Milestone</option>
                  <option value="FY 2027">FY 2027 Milestone</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. QUALITATIVE SEVERITY RATINGS & CONTINGENCY PLAN */}
          <div className="p-4 border border-[#333333] bg-[#161616] space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                4. Qualitative Severity Ratings & Contingency Plan
              </label>
              <span className="text-[10px] text-[#888888]">Standard Protocol Format</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-[#888888] block mb-1">Probability (P):</span>
                <select
                  value={probabilityRating}
                  onChange={(e) => setProbabilityRating(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-purple-400 outline-none"
                >
                  <option value="H">H - High (Likely / Frequent)</option>
                  <option value="M">M - Medium (Possible / Occasional)</option>
                  <option value="L">L - Low (Unlikely / Rare)</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-[#888888] block mb-1">Impact (I):</span>
                <select
                  value={impactRating}
                  onChange={(e) => setImpactRating(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-purple-400 outline-none"
                >
                  <option value="H">H - High (Major breach / Disruption)</option>
                  <option value="M">M - Medium (Moderate degradation)</option>
                  <option value="L">L - Low (Minor / Negligible)</option>
                </select>
              </div>

              <div>
                <span className="text-[10px] text-[#888888] block mb-1">Detectability (D):</span>
                <select
                  value={detectabilityRating}
                  onChange={(e) => setDetectabilityRating(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-purple-400 outline-none"
                >
                  <option value="L">L - Low (Difficult to detect / Hidden)</option>
                  <option value="M">M - Medium (Moderately detectable)</option>
                  <option value="H">H - High (Easily detected / Automated)</option>
                </select>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-[#888888] block mb-1">
                Contingency Plan (Action taken if risk materializes):
              </span>
              <textarea
                rows={2}
                value={contingencyPlan}
                onChange={(e) => setContingencyPlan(e.target.value)}
                placeholder="Document backup protocols, emergency isolation, failover steps, or secondary safeguard invocation..."
                className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-purple-400 outline-none text-xs"
              />
            </div>
          </div>

          {/* 4. AUTOMATED SAFEGUARD SWITCH */}
          <div className="p-4 border border-[#38bdf8]/40 bg-[#0b161f] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#38bdf8]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#38bdf8]">
                  Automate Control (Replace Manual Checklist with Code/Policy Engine)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAutomatedSafeguard(!isAutomatedSafeguard)}
                className={`px-3 py-1 text-xs font-bold uppercase transition cursor-pointer flex items-center gap-1.5 ${
                  isAutomatedSafeguard
                    ? 'bg-[#38bdf8] text-black hover:bg-sky-400'
                    : 'bg-black border border-[#38bdf8] text-[#38bdf8] hover:bg-[#38bdf8] hover:text-black'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAutomatedSafeguard ? 'Automated Active' : 'Switch to Automated'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-[#888888] block mb-1">Automation Mechanism:</span>
                <input
                  type="text"
                  value={automationMechanism}
                  onChange={(e) => setAutomationMechanism(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white text-xs outline-none focus:border-[#38bdf8]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#888888] block mb-1">Manual Checklist Replaced:</span>
                <input
                  type="text"
                  value={manualChecklistReplaced}
                  onChange={(e) => setManualChecklistReplaced(e.target.value)}
                  className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white text-xs outline-none focus:border-[#38bdf8]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#262626] shrink-0">
          <div className="text-[11px] text-[#888888]">
            Targeting <strong className="text-emerald-400">-{projectedRiskReductionPts} pts</strong> risk reduction for {quarterMilestone}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-[#333333] hover:border-white text-xs text-[#888888] hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-[#f5ff00] text-black font-bold uppercase tracking-wider hover:bg-yellow-300 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Treatment Plan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
