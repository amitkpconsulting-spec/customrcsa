import React, { useState } from 'react';
import {
  RiskTreatmentItem,
  RiskTreatmentOption,
  WHORiskCategory,
} from '../types';
import { Plus, Trash2, CheckCircle2, Shield } from 'lucide-react';

interface AddWHORiskModalProps {
  onAdd: (newItem: RiskTreatmentItem) => void;
  onClose: () => void;
}

export const AddWHORiskModal: React.FC<AddWHORiskModalProps> = ({ onAdd, onClose }) => {
  const [controlId, setControlId] = useState('AC-2');
  const [controlTitle, setControlTitle] = useState('Account Management & Deprovisioning');
  const [whoCategory, setWhoCategory] = useState<WHORiskCategory>('SECURITY_ACCESS_CONTROL');
  const [whoRiskArea, setWhoRiskArea] = useState('Access Control, Identity Verification & Authentication');
  const [specificConcern, setSpecificConcern] = useState(
    'Failure to rapidly suspend deprovisioned employee accounts creates risk of unauthorized lateral access.'
  );
  const [probabilityRating, setProbabilityRating] = useState<'L' | 'M' | 'H'>('H');
  const [impactRating, setImpactRating] = useState<'L' | 'M' | 'H'>('H');
  const [detectabilityRating, setDetectabilityRating] = useState<'L' | 'M' | 'H'>('M');
  const [treatmentOption, setTreatmentOption] = useState<RiskTreatmentOption>('MITIGATE');
  const [treatmentRationale, setTreatmentRationale] = useState(
    'Deploy automated webhook integration between HRIS and Identity Provider.'
  );
  const [actionSteps, setActionSteps] = useState<string[]>([
    'Configure SCIM 2.0 provisioning connector with 1-hour suspension SLA.',
    'Deploy daily automated reconciliation scan for orphaned accounts.',
  ]);
  const [newStepText, setNewStepText] = useState('');
  const [namedOwner, setNamedOwner] = useState('Sarah Chen');
  const [ownerRole, setOwnerRole] = useState('Lead Identity Architect');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [nextReviewDate, setNextReviewDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [contingencyPlan, setContingencyPlan] = useState(
    'Trigger emergency manual account lockdown protocol across Active Directory / Okta.'
  );
  const [quarterMilestone, setQuarterMilestone] = useState('Q2 2026');
  const [projectedRiskReductionPts, setProjectedRiskReductionPts] = useState(5.5);

  const handleAddStep = () => {
    if (!newStepText.trim()) return;
    setActionSteps([...actionSteps, newStepText.trim()]);
    setNewStepText('');
  };

  const handleRemoveStep = (idx: number) => {
    setActionSteps(actionSteps.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const inherent = probabilityRating === 'H' ? 16 : probabilityRating === 'M' ? 12 : 6;
    const residual = Math.max(2.0, inherent - 3.0);
    const targetResidual = Math.max(1.0, residual - projectedRiskReductionPts);

    const newItem: RiskTreatmentItem = {
      id: `rtp-item-who-${Date.now().toString(36)}`,
      controlId,
      controlTitle,
      domain: 'Cybersecurity',
      businessProcessOrApp: 'Identity & Access Enclave',
      inherentRisk: inherent,
      currentCEF: 0.55,
      residualRisk: residual,
      riskScoreBand: residual >= 12.0 ? 'High' : 'Medium-High',
      priorityCriteriaMatched: ['Identified via Risk Treatment Plan Protocol'],
      treatmentOption,
      treatmentRationale,
      actionPlanSteps: actionSteps,
      namedOwner,
      ownerRole,
      deadline,
      nextReviewDate,
      isAutomatedSafeguard: false,
      automationMechanism: 'Automated Identity Provider Webhook',
      manualChecklistReplaced: 'Manual weekly spreadsheet account audits',
      desiredTargetResidual: Number(targetResidual.toFixed(1)),
      projectedRiskReductionPts,
      status: 'IN_PROGRESS',
      quarterMilestone,
      whoCategory,
      whoRiskArea,
      specificConcern,
      probabilityRating,
      impactRating,
      detectabilityRating,
      contingencyPlan,
    };

    onAdd(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-mono text-white">
      <div className="border border-[#38bdf8] bg-[#121212] w-full max-w-2xl p-6 space-y-5 shadow-2xl my-auto">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#38bdf8]" />
            <h3 className="text-base font-syne font-bold uppercase text-white">
              Add Risk Concern to Treatment Register
            </h3>
          </div>
          <button onClick={onClose} className="text-[#888888] hover:text-white text-xs">
            ✕ Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#888888] mb-1">Control ID:</label>
              <input
                type="text"
                value={controlId}
                onChange={(e) => setControlId(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
              />
            </div>
            <div>
              <label className="block text-[#888888] mb-1">Control Title:</label>
              <input
                type="text"
                value={controlTitle}
                onChange={(e) => setControlTitle(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#888888] mb-1">Risk Category:</label>
              <select
                value={whoCategory}
                onChange={(e) => setWhoCategory(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
              >
                <option value="PARTICIPANT_RIGHTS_SAFETY">Cat A: Participant / User Rights & Privacy</option>
                <option value="DATA_INTEGRITY_PROTECTION">Cat B: Data Integrity & Systems Protection</option>
                <option value="PROJECT_COMPLETION_OPERATIONAL">Cat C: Project Completion & Logistics</option>
                <option value="SECURITY_ACCESS_CONTROL">Access Control & Identity Enclave</option>
              </select>
            </div>
            <div>
              <label className="block text-[#888888] mb-1">Risk Area:</label>
              <input
                type="text"
                value={whoRiskArea}
                onChange={(e) => setWhoRiskArea(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#888888] mb-1">Specific Concern / Description:</label>
            <textarea
              rows={2}
              value={specificConcern}
              onChange={(e) => setSpecificConcern(e.target.value)}
              required
              className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#888888] mb-1">Probability (P):</label>
              <select
                value={probabilityRating}
                onChange={(e) => setProbabilityRating(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
              >
                <option value="H">High (H)</option>
                <option value="M">Medium (M)</option>
                <option value="L">Low (L)</option>
              </select>
            </div>
            <div>
              <label className="block text-[#888888] mb-1">Impact (I):</label>
              <select
                value={impactRating}
                onChange={(e) => setImpactRating(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
              >
                <option value="H">High (H)</option>
                <option value="M">Medium (M)</option>
                <option value="L">Low (L)</option>
              </select>
            </div>
            <div>
              <label className="block text-[#888888] mb-1">Detectability (D):</label>
              <select
                value={detectabilityRating}
                onChange={(e) => setDetectabilityRating(e.target.value as any)}
                className="w-full px-2 py-1.5 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
              >
                <option value="L">Low / Hard (L)</option>
                <option value="M">Medium (M)</option>
                <option value="H">High / Easy (H)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[#888888] mb-1">Planned Remediation Steps:</label>
            <div className="space-y-1 mb-2">
              {actionSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-black p-1.5 border border-[#222222]">
                  <span className="text-[#38bdf8] font-bold">{idx + 1}.</span>
                  <span className="flex-1 text-white">{step}</span>
                  <button type="button" onClick={() => handleRemoveStep(idx)} className="text-[#666666] hover:text-rose-400">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                placeholder="Add next remediation action..."
                className="flex-1 px-3 py-1.5 bg-black border border-[#333333] text-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddStep}
                className="px-3 py-1.5 bg-[#38bdf8] text-black font-bold uppercase hover:bg-sky-300"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#888888] mb-1">Assigned Owner & Role:</label>
              <input
                type="text"
                value={namedOwner}
                onChange={(e) => setNamedOwner(e.target.value)}
                placeholder="Name"
                className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white mb-1 outline-none"
              />
              <input
                type="text"
                value={ownerRole}
                onChange={(e) => setOwnerRole(e.target.value)}
                placeholder="Role / Title"
                className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-[#888888] mb-1">Target Completion Date:</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white mb-1 outline-none"
              />
              <label className="block text-[#888888] mb-1 text-[10px]">Next Review Date:</label>
              <input
                type="date"
                value={nextReviewDate}
                onChange={(e) => setNextReviewDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#888888] mb-1">Contingency Plan:</label>
            <textarea
              rows={2}
              value={contingencyPlan}
              onChange={(e) => setContingencyPlan(e.target.value)}
              placeholder="Action to take if risk materializes..."
              className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#333333] text-xs text-[#888888] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#38bdf8] text-black font-bold uppercase tracking-wider hover:bg-sky-300 transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Add to Risk Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
