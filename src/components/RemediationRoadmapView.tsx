import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Layers,
  RefreshCw,
} from 'lucide-react';
import {
  AssessedControl,
  RemediationRoadmapItem,
  AIRemediationPlan,
  SectorType,
  AISettings,
} from '../types';
import { generateRemediationRoadmap } from '../utils/remediationEngine';

interface RemediationRoadmapViewProps {
  controls: AssessedControl[];
  remediationPlan?: AIRemediationPlan;
  onUpdatePlan: (plan: AIRemediationPlan) => void;
  sector: SectorType;
  systemName: string;
  onNavigateToControl: (controlId: string) => void;
  aiSettings?: AISettings;
}

export const RemediationRoadmapView: React.FC<RemediationRoadmapViewProps> = ({
  controls,
  remediationPlan,
  onUpdatePlan,
  sector,
  systemName,
  onNavigateToControl,
  aiSettings,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  const handleGenerateRoadmap = async () => {
    setIsGenerating(true);
    try {
      const plan = await generateRemediationRoadmap(controls, sector, systemName, aiSettings);
      onUpdatePlan(plan);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusChange = (itemId: string, newStatus: RemediationRoadmapItem['status']) => {
    if (!remediationPlan) return;
    const updatedRoadmap = remediationPlan.roadmap.map((item) =>
      item.id === itemId ? { ...item, status: newStatus } : item
    );
    onUpdatePlan({
      ...remediationPlan,
      roadmap: updatedRoadmap,
    });
  };

  const roadmapItems = remediationPlan?.roadmap || [];
  const filteredItems = roadmapItems.filter((item) => {
    if (selectedPriority !== 'ALL' && item.priority !== selectedPriority) return false;
    return true;
  });

  const p0Count = roadmapItems.filter((i) => i.priority === 'P0_IMMEDIATE').length;
  const p1Count = roadmapItems.filter((i) => i.priority === 'P1_HIGH').length;
  const inProgressCount = roadmapItems.filter((i) => i.status === 'IN_PROGRESS').length;
  const resolvedCount = roadmapItems.filter((i) => i.status === 'RESOLVED').length;

  return (
    <div className="space-y-6 pb-20 text-white animate-fadeIn">
      {/* Header Banner */}
      <div className="border border-[#262626] bg-[#141414] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#f5ff00] border border-[#333333] bg-black px-2 py-0.5 inline-block">
            NIST SP 800-53 CORRECTIVE ACTION PLAN (POA&M)
          </div>
          <h2 className="text-2xl sm:text-3xl font-syne font-bold uppercase tracking-tight text-white">
            Automated Remediation Roadmap
          </h2>
          <p className="text-xs text-[#888888] max-w-2xl font-mono leading-relaxed">
            Prioritized corrective action paths, compensating safeguards, and verification criteria
            engineered to attenuate critical risk deficiencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateRoadmap}
            disabled={isGenerating}
            className="px-4 py-2 bg-[#f5ff00] text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-yellow-300 transition flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isGenerating ? 'Synthesizing...' : 'Regenerate Plan'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="border border-[#262626] bg-[#141414] p-4">
          <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-[#888888] block">
            P0 Critical (Immediate)
          </span>
          <span className="text-2xl font-mono font-bold text-rose-400 mt-1 block">{p0Count}</span>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-4">
          <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-[#888888] block">
            P1 High Priority
          </span>
          <span className="text-2xl font-mono font-bold text-amber-400 mt-1 block">{p1Count}</span>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-4">
          <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-[#888888] block">
            Active in Progress
          </span>
          <span className="text-2xl font-mono font-bold text-white mt-1 block">
            {inProgressCount}
          </span>
        </div>

        <div className="border border-[#262626] bg-[#141414] p-4">
          <span className="text-[9px] font-mono uppercase font-bold tracking-wider text-[#888888] block">
            Remediated & Verified
          </span>
          <span className="text-2xl font-mono font-bold text-emerald-400 mt-1 block">
            {resolvedCount}
          </span>
        </div>
      </div>

      {/* Executive Summary Card */}
      {remediationPlan && (
        <div className="border border-[#262626] bg-[#0e0e0e] p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#f5ff00] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Executive Synthesis & Regulatory Context
            </span>
            <span className="text-[10px] font-mono text-[#666666]">
              Engine: {remediationPlan.engineUsed}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-mono leading-relaxed text-white">
            "{remediationPlan.executiveSummary}"
          </p>
          {remediationPlan.sectorNotes && (
            <p className="text-xs text-[#888888] font-mono border-t border-[#262626] pt-2">
              <strong className="text-[#f5ff00]">Sector Overlay Notes:</strong>{' '}
              {remediationPlan.sectorNotes}
            </p>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#262626] pb-3 text-xs font-mono font-bold uppercase tracking-wider overflow-x-auto no-scrollbar">
        {['ALL', 'P0_IMMEDIATE', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW'].map((p) => (
          <button
            key={p}
            onClick={() => setSelectedPriority(p)}
            className={`px-3 py-1.5 border transition whitespace-nowrap ${
              selectedPriority === p
                ? 'border-[#f5ff00] bg-[#f5ff00] text-black'
                : 'border-[#333333] bg-[#1a1a1a] text-[#888888] hover:text-white hover:border-[#666666]'
            }`}
          >
            {p === 'ALL' ? 'All Roadmap Items' : p.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Action Items List */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="border border-[#262626] bg-[#141414] p-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-sm font-syne font-bold uppercase text-white">
              No Outstanding Deficiencies in Selection
            </h4>
            <p className="text-xs text-[#888888] font-mono mt-1">
              All prioritized items are satisfied or meet risk threshold.
            </p>
          </div>
        ) : (
          filteredItems.map((item, idx) => {
            const isP0 = item.priority === 'P0_IMMEDIATE';
            const isP1 = item.priority === 'P1_HIGH';
            const formattedIndex = String(idx + 1).padStart(2, '0');

            return (
              <div
                key={item.id}
                className="border border-[#262626] bg-[#141414] p-6 space-y-5"
              >
                {/* Item Header */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#262626] pb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl font-mono font-bold text-[#666666]">
                      {formattedIndex}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          onClick={() => onNavigateToControl(item.targetControl)}
                          className="font-mono text-xs font-bold px-2 py-0.5 border border-[#333333] bg-black text-[#f5ff00] cursor-pointer hover:bg-[#f5ff00] hover:text-black transition"
                          title="Jump to Control Assessment"
                        >
                          {item.targetControl}
                        </span>
                        <h3 className="text-sm sm:text-base font-syne font-bold uppercase text-white">
                          {item.controlTitle}
                        </h3>
                        <span
                          className={`text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 border ${
                            isP0
                              ? 'border-rose-600 text-rose-300 bg-rose-950/60'
                              : isP1
                              ? 'border-amber-600 text-amber-300 bg-amber-950/60'
                              : 'border-[#333333] text-white bg-black'
                          }`}
                        >
                          {item.priority.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#888888] font-bold mt-1">
                        Domain: <span className="text-white">{item.domain}</span> • Timeline:{' '}
                        <span className="text-white">{item.implementationTimeline}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle & Due Date */}
                  <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value as any)}
                      className="px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
                    >
                      <option value="OPEN">Status: OPEN</option>
                      <option value="IN_PROGRESS">Status: IN PROGRESS</option>
                      <option value="RESOLVED">Status: RESOLVED</option>
                      <option value="ACCEPTED_RISK">Status: RISK ACCEPTED</option>
                    </select>
                  </div>
                </div>

                {/* Technical Specifications Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-4 border border-rose-900/60 bg-black space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider block text-rose-400">
                      Identified Vulnerability / Root Cause Gap:
                    </span>
                    <p className="leading-relaxed text-[#cccccc]">{item.gapSummary}</p>
                  </div>

                  <div className="p-4 border border-[#262626] bg-black space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider block text-[#f5ff00]">
                      Mandatory Technical Remediation Action:
                    </span>
                    <p className="leading-relaxed text-white">
                      {item.technicalRemediationAction}
                    </p>
                  </div>
                </div>

                {/* Compensating Safeguards & Validation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#888888] block mb-1">
                      Interim Compensating Control:
                    </span>
                    <p className="text-[#aaaaaa] leading-relaxed border-l-2 border-[#f5ff00] pl-3">
                      {item.compensatingControl}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#888888] block mb-1">
                      Auditor Validation Criteria:
                    </span>
                    <p className="text-[#aaaaaa] leading-relaxed border-l-2 border-emerald-500 pl-3">
                      {item.validationCriteria}
                    </p>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="pt-3 border-t border-[#262626] flex flex-wrap items-center justify-between gap-4 text-[10px] font-mono text-[#888888]">
                  <span>Assigned: {item.assignedTo || 'Unassigned'}</span>
                  <span>Target Due: {item.dueDate || '30 Days'}</span>
                  <span className="font-bold text-emerald-400">
                    Est. Residual Reduction: -{item.estimatedResidualReduction.toFixed(1)} pts
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
