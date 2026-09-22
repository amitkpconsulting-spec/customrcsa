import React, { useState } from 'react';
import {
  RiskTreatmentPlan,
  RiskTreatmentItem,
  WHODocumentHeader,
} from '../types';
import {
  FileText,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Edit3,
  Printer,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  User,
  Plus,
  TrendingDown,
} from 'lucide-react';

interface WHOTemplateDocumentViewProps {
  rtp: RiskTreatmentPlan;
  onUpdatePlan: (updatedPlan: RiskTreatmentPlan) => void;
  onOpenRemediationEditor: (item: RiskTreatmentItem) => void;
  onAddNewRiskItem: () => void;
  onExportPdf?: () => void;
}

export const WHOTemplateDocumentView: React.FC<WHOTemplateDocumentViewProps> = ({
  rtp,
  onUpdatePlan,
  onOpenRemediationEditor,
  onAddNewRiskItem,
  onExportPdf,
}) => {
  const [showMatrixInfo, setShowMatrixInfo] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [highRiskOnly, setHighRiskOnly] = useState(false);

  const header: WHODocumentHeader = rtp.whoDocumentHeader || {
    protocolRef: `RTP-${rtp.planId.slice(0, 8).toUpperCase()}`,
    planTitle: `Risk Management & Treatment Plan: ${rtp.organizationSystem}`,
    shortTitle: `${rtp.organizationSystem.slice(0, 20)} RTP`,
    versionNumber: 'v1.0 (Approved Baseline)',
    documentDate: '23 JAN 2026',
    templateSource: 'Risk Management Plan Protocol (Standard Tool 1.13 Format)',
    reviewAndApproval: [
      {
        function: 'Prepared by',
        name: `${rtp.annualTracking.productOwnerName} (Lead Assessor / SMT)`,
        date: '2026-01-23',
        signature: 'Verified',
        status: 'SIGNED',
      },
      {
        function: 'Approved by',
        name: 'Marcus Vance (Principal Investigator / Executive Risk Sponsor)',
        date: '2026-01-25',
        signature: 'M. Vance [Executive Signoff]',
        status: 'SIGNED',
      },
      {
        function: 'Quality Assurance',
        name: 'Dr. Alistair Thorne (Quality Assurance Lead)',
        date: '2026-01-26',
        signature: 'A. Thorne [QA Certified]',
        status: 'SIGNED',
      },
    ],
    revisionRecord: [
      {
        version: 'v0.1',
        changes: 'Initial draft identification of high residual risks and deficiencies.',
        author: rtp.annualTracking.productOwnerName,
        date: '2026-01-15',
      },
      {
        version: 'v1.0',
        changes: 'Approved baseline incorporating qualitative severity matrix, remediation action plans, and quarterly milestones.',
        author: rtp.annualTracking.productOwnerName,
        date: '2026-01-25',
      },
    ],
  };

  // Attest / Sign handler
  const handleAttestSignature = (index: number) => {
    const updatedApproval = [...header.reviewAndApproval];
    const current = updatedApproval[index];
    updatedApproval[index] = {
      ...current,
      status: 'SIGNED',
      date: new Date().toISOString().split('T')[0],
      signature: `${current.name.split(' ')[0]} [Attested]`,
    };

    const updatedPlan: RiskTreatmentPlan = {
      ...rtp,
      whoDocumentHeader: {
        ...header,
        reviewAndApproval: updatedApproval,
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdatePlan(updatedPlan);
  };

  // Filter items
  const filteredItems = rtp.items.filter((item) => {
    if (highRiskOnly && item.residualRisk < 9.0) return false;
    if (activeCategoryFilter !== 'ALL' && item.whoCategory !== activeCategoryFilter) return false;
    return true;
  });

  const highRiskCount = rtp.items.filter((i) => i.residualRisk >= 9.0).length;

  return (
    <div className="space-y-6 font-mono text-white animate-fadeIn">
      {/* 1. OFFICIAL RISK MANAGEMENT PLAN DOCUMENT HEADER BLOCK */}
      <div className="border-2 border-[#38bdf8]/50 bg-[#0d141c] p-6 space-y-6 print:border-black print:bg-white print:text-black">
        {/* Top Identification Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#22354a] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#38bdf8] text-black font-bold flex items-center justify-center text-sm font-sans tracking-tight shrink-0">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#38bdf8] block">
                ENTERPRISE RISK MANAGEMENT & TREATMENT PLAN
              </span>
              <span className="text-xs text-[#99b7d4] font-sans font-medium">
                Standard Risk Governance Protocol & Treatment Register • Tool 1.13 Format
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={onExportPdf || (() => window.print())}
              className="px-3.5 py-1.5 bg-[#38bdf8] text-black font-bold uppercase text-xs hover:bg-sky-300 transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(56,189,248,0.25)]"
              title="Export standalone Risk Treatment Plan PDF summary"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export PDF Summary</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-[#1b2b3d] border border-[#334155] text-white font-bold uppercase text-xs hover:border-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Direct Print</span>
            </button>
          </div>
        </div>

        {/* Formal Metadata Table (from Stream 1/2 of PDF) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 border border-[#1b2b3d] bg-black/50 p-4">
            <div className="flex justify-between border-b border-[#22354a] pb-1.5">
              <span className="text-[#64748b]">Plan Title:</span>
              <span className="font-bold text-white text-right">{header.planTitle}</span>
            </div>
            <div className="flex justify-between border-b border-[#22354a] pb-1.5">
              <span className="text-[#64748b]">Short Title:</span>
              <span className="font-bold text-white">{header.shortTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Target Enclave / System:</span>
              <span className="font-bold text-[#38bdf8]">{rtp.organizationSystem}</span>
            </div>
          </div>

          <div className="space-y-2 border border-[#1b2b3d] bg-black/50 p-4">
            <div className="flex justify-between border-b border-[#22354a] pb-1.5">
              <span className="text-[#64748b]">Protocol Reference #:</span>
              <span className="font-bold text-[#f5ff00]">{header.protocolRef}</span>
            </div>
            <div className="flex justify-between border-b border-[#22354a] pb-1.5">
              <span className="text-[#64748b]">Version Number:</span>
              <span className="font-bold text-emerald-400">{header.versionNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748b]">Document Date:</span>
              <span className="font-bold text-white">{header.documentDate}</span>
            </div>
          </div>
        </div>

        {/* Source Template Guidance Notice */}
        <div className="p-3.5 border border-[#334d6b] bg-[#091119] text-[11px] text-[#94a3b8] italic leading-relaxed">
          <strong>Guidance Note:</strong> This template is a standardized format for a Risk Management & Treatment Plan developed by Enterprise Risk Stewards & System Custodians. Instructions are provided as a guide to record, prioritize, and monitor risks. Risks should be reviewed periodically and the risk log updated to support continuous quality assurance.
        </div>

        {/* Review and Approval Record Table */}
        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-[#99b7d4] block">
            Document Review and Approval Record
          </span>

          <div className="overflow-x-auto border border-[#1b2b3d]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#142233] text-[#99b7d4] border-b border-[#1b2b3d]">
                <tr>
                  <th className="p-2.5 font-bold uppercase">Role / Function</th>
                  <th className="p-2.5 font-bold uppercase">Name</th>
                  <th className="p-2.5 font-bold uppercase">Date</th>
                  <th className="p-2.5 font-bold uppercase">Signature / Status</th>
                  <th className="p-2.5 font-bold uppercase text-right print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2b3d]">
                {header.reviewAndApproval.map((appr, idx) => (
                  <tr key={idx} className="hover:bg-black/30">
                    <td className="p-2.5 font-bold text-white">{appr.function}</td>
                    <td className="p-2.5 text-[#cbd5e1]">{appr.name}</td>
                    <td className="p-2.5 text-[#94a3b8]">{appr.date}</td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {appr.signature}
                      </span>
                    </td>
                    <td className="p-2.5 text-right print:hidden">
                      <button
                        onClick={() => handleAttestSignature(idx)}
                        className="text-[10px] px-2 py-0.5 border border-[#334d6b] hover:border-[#38bdf8] text-[#99b7d4] hover:text-white"
                      >
                        Re-Attest
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Revision Record Table */}
        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-[#99b7d4] block">
            Revision Record
          </span>

          <div className="overflow-x-auto border border-[#1b2b3d]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#142233] text-[#99b7d4] border-b border-[#1b2b3d]">
                <tr>
                  <th className="p-2.5 font-bold uppercase">Version</th>
                  <th className="p-2.5 font-bold uppercase">Date</th>
                  <th className="p-2.5 font-bold uppercase">Description of Changes</th>
                  <th className="p-2.5 font-bold uppercase">Author</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1b2b3d]">
                {header.revisionRecord.map((rev, idx) => (
                  <tr key={idx} className="hover:bg-black/30">
                    <td className="p-2.5 font-bold text-[#f5ff00]">{rev.version}</td>
                    <td className="p-2.5 text-[#94a3b8]">{rev.date}</td>
                    <td className="p-2.5 text-[#cbd5e1]">{rev.changes}</td>
                    <td className="p-2.5 text-white">{rev.author}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. QUALITATIVE RISK SCORING MATRIX & CRITERIA (ACCORDION) */}
      <div className="border border-[#262626] bg-[#141414] p-4">
        <button
          onClick={() => setShowMatrixInfo(!showMatrixInfo)}
          className="w-full flex items-center justify-between text-xs font-bold uppercase text-[#38bdf8] hover:text-white transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#38bdf8]" />
            Risk Assessment Scoring Criteria (3x3 Matrix & P×I×D Definitions)
          </span>
          {showMatrixInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showMatrixInfo && (
          <div className="pt-4 mt-4 border-t border-[#262626] space-y-4 text-xs animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Probability */}
              <div className="p-3 border border-[#262626] bg-black space-y-1.5">
                <span className="font-bold text-white block">Probability (P)</span>
                <p className="text-[11px] text-[#888888]">
                  Likelihood of risk occurrence during survey / operational lifecycle:
                </p>
                <ul className="text-[10px] space-y-1 text-[#aaaaaa]">
                  <li><strong className="text-emerald-400">Low (L / 1):</strong> Unlikely / rare occurrence</li>
                  <li><strong className="text-amber-400">Medium (M / 2):</strong> Moderate likelihood / occasionally reported</li>
                  <li><strong className="text-rose-400">High (H / 3):</strong> Frequent or highly probable occurrence</li>
                </ul>
              </div>

              {/* Impact */}
              <div className="p-3 border border-[#262626] bg-black space-y-1.5">
                <span className="font-bold text-white block">Impact (I)</span>
                <p className="text-[11px] text-[#888888]">
                  Consequence to participant safety, data integrity, or survey completion:
                </p>
                <ul className="text-[10px] space-y-1 text-[#aaaaaa]">
                  <li><strong className="text-emerald-400">Low (L / 1):</strong> Negligible impact, minor inconvenience</li>
                  <li><strong className="text-amber-400">Medium (M / 2):</strong> Moderate delay, localized rework required</li>
                  <li><strong className="text-rose-400">High (H / 3):</strong> Critical compromise, regulatory penalty, data invalidation</li>
                </ul>
              </div>

              {/* Detectability */}
              <div className="p-3 border border-[#262626] bg-black space-y-1.5">
                <span className="font-bold text-white block">Detectability (D)</span>
                <p className="text-[11px] text-[#888888]">
                  Ease of detecting the risk or deficiency before material damage:
                </p>
                <ul className="text-[10px] space-y-1 text-[#aaaaaa]">
                  <li><strong className="text-emerald-400">High (H / 1):</strong> Automated alerts, immediate real-time detection</li>
                  <li><strong className="text-amber-400">Medium (M / 2):</strong> Detected during routine weekly/monthly reviews</li>
                  <li><strong className="text-rose-400">Low (L / 3):</strong> Difficult to detect without comprehensive forensic audit</li>
                </ul>
              </div>
            </div>

            {/* 3x3 Grid Display */}
            <div className="p-3 border border-[#262626] bg-black flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[11px] text-[#888888]">
                <strong>Overall Severity Rating:</strong> Low (Green: Tolerable), Medium (Yellow: Manageable), High (Orange: Prioritized Action), Critical (Red: Immediate Intervention Required).
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-600 text-emerald-300 text-[10px] font-bold">LOW</span>
                <span className="px-2 py-0.5 bg-yellow-950 border border-yellow-600 text-yellow-300 text-[10px] font-bold">MEDIUM</span>
                <span className="px-2 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-bold">HIGH</span>
                <span className="px-2 py-0.5 bg-rose-950 border border-rose-600 text-rose-300 text-[10px] font-bold">CRITICAL</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. RISK TREATMENT & REMEDIATION REGISTER */}
      <div className="space-y-4">
        {/* Filter Strip */}
        <div className="border border-[#262626] bg-[#141414] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setHighRiskOnly(!highRiskOnly)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                highRiskOnly
                  ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                  : 'bg-black border border-[#333333] text-[#aaaaaa] hover:border-rose-500 hover:text-rose-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Controls with High Residual Risk ({highRiskCount})</span>
            </button>

            <select
              value={activeCategoryFilter}
              onChange={(e) => setActiveCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-black border border-[#333333] text-xs font-mono text-white focus:border-[#38bdf8] outline-none"
            >
              <option value="ALL">All Risk Categories (A, B, C & Enclaves)</option>
              <option value="PARTICIPANT_RIGHTS_SAFETY">Cat A: Participant / User Rights & Privacy</option>
              <option value="DATA_INTEGRITY_PROTECTION">Cat B: Data Integrity & System Security</option>
              <option value="PROJECT_COMPLETION_OPERATIONAL">Cat C: Project Completion & Logistics</option>
              <option value="SECURITY_ACCESS_CONTROL">Access Control & Authentication Enclaves</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onAddNewRiskItem}
              className="px-3 py-1.5 bg-[#f5ff00] text-black font-bold uppercase tracking-wider text-xs hover:bg-yellow-300 transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Risk Item</span>
            </button>
          </div>
        </div>

        {/* The Risk Treatment Register Table */}
        <div className="border border-[#262626] bg-[#111111] overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead className="bg-[#181818] text-[#aaaaaa] border-b border-[#262626] font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 w-12 text-center">#</th>
                <th className="p-3 w-48">Risk Area / Category</th>
                <th className="p-3 w-64">Specific Concern & Control</th>
                <th className="p-3 w-28 text-center">P / I / D</th>
                <th className="p-3 w-24 text-center">Severity</th>
                <th className="p-3 w-32">Response Strategy</th>
                <th className="p-3 w-72">Planned Remediation Steps</th>
                <th className="p-3 w-56">Contingency Plan</th>
                <th className="p-3 w-44">Responsible Owner</th>
                <th className="p-3 w-28">Target Date</th>
                <th className="p-3 w-28">Next Review</th>
                <th className="p-3 w-28 text-center">Target RR</th>
                <th className="p-3 w-28 text-center">Status</th>
                <th className="p-3 w-28 text-right print:hidden">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {filteredItems.map((item, idx) => {
                const isCritical = item.residualRisk >= 15.0;
                const isHigh = item.residualRisk >= 9.0 && item.residualRisk < 15.0;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#161616] transition ${
                      isCritical ? 'bg-rose-950/10' : isHigh ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    {/* Index */}
                    <td className="p-3 text-center text-[#666666] font-bold">
                      {idx + 1}
                    </td>

                    {/* Risk Area / Category */}
                    <td className="p-3">
                      <span className="font-bold text-white block">{item.whoRiskArea || item.domain}</span>
                      <span className="text-[10px] text-[#888888]">{item.businessProcessOrApp}</span>
                    </td>

                    {/* Specific Concern & Control */}
                    <td className="p-3 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 bg-black border border-[#333333] text-[#f5ff00] font-bold text-[10px]">
                          {item.controlId}
                        </span>
                        <span className="font-bold text-white">{item.controlTitle}</span>
                      </div>
                      <p className="text-[11px] text-[#aaaaaa] line-clamp-2" title={item.specificConcern}>
                        {item.specificConcern || item.treatmentRationale}
                      </p>
                    </td>

                    {/* P / I / D */}
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-black border border-[#333333]">
                        <span className="text-amber-400" title="Probability">P:{item.probabilityRating || 'H'}</span>
                        <span className="text-[#666666]">/</span>
                        <span className="text-rose-400" title="Impact">I:{item.impactRating || 'H'}</span>
                        <span className="text-[#666666]">/</span>
                        <span className="text-sky-400" title="Detectability">D:{item.detectabilityRating || 'M'}</span>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="p-3 text-center">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider border ${
                          isCritical
                            ? 'border-rose-600 bg-rose-950 text-rose-300'
                            : isHigh
                            ? 'border-amber-600 bg-amber-950 text-amber-300'
                            : 'border-[#333333] bg-black text-[#888888]'
                        }`}
                      >
                        {item.riskScoreBand} ({item.residualRisk.toFixed(1)})
                      </span>
                    </td>

                    {/* Response Strategy */}
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 uppercase ${
                          item.treatmentOption === 'MITIGATE'
                            ? 'text-sky-300 bg-sky-950/80 border border-sky-700'
                            : item.treatmentOption === 'TRANSFER'
                            ? 'text-purple-300 bg-purple-950/80 border border-purple-700'
                            : item.treatmentOption === 'AVOID'
                            ? 'text-rose-300 bg-rose-950/80 border border-rose-700'
                            : 'text-emerald-300 bg-emerald-950/80 border border-emerald-700'
                        }`}
                      >
                        {item.treatmentOption}
                      </span>
                    </td>

                    {/* Planned Remediation Steps */}
                    <td className="p-3">
                      <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-[#cccccc]">
                        {item.actionPlanSteps.map((step, sIdx) => (
                          <li key={sIdx} className="line-clamp-1" title={step}>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </td>

                    {/* Contingency Plan */}
                    <td className="p-3 text-[11px] text-[#aaaaaa]">
                      <p className="line-clamp-2" title={item.contingencyPlan}>
                        {item.contingencyPlan || 'Invoke emergency secondary controls and escalate to SecOps on-call.'}
                      </p>
                    </td>

                    {/* Responsible Owner */}
                    <td className="p-3">
                      <span className="font-bold text-white block">{item.namedOwner}</span>
                      <span className="text-[10px] text-[#888888]">{item.ownerRole}</span>
                    </td>

                    {/* Target Date */}
                    <td className="p-3 text-amber-300 font-mono text-[11px]">
                      {item.deadline}
                    </td>

                    {/* Next Review */}
                    <td className="p-3 text-[#aaaaaa] font-mono text-[11px]">
                      {item.nextReviewDate || item.deadline}
                    </td>

                    {/* Target RR & Milestone */}
                    <td className="p-3 text-center">
                      <span className="font-bold text-emerald-400 block text-xs">
                        {item.desiredTargetResidual.toFixed(1)} pts
                      </span>
                      <span className="text-[9px] text-[#666666]">
                        {item.quarterMilestone}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="p-3 text-center">
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-black border border-[#333333] text-[#aaaaaa]">
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="p-3 text-right print:hidden">
                      <button
                        onClick={() => onOpenRemediationEditor(item)}
                        className="px-2.5 py-1 bg-[#1a1a1a] border border-[#333333] hover:border-[#f5ff00] hover:text-[#f5ff00] text-[10px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                        title="Edit Remediation Steps, Owner, Target Date, and Milestones"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Document Footer Attribution */}
        <div id="who-template-footer" className="p-4 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#777777] font-mono print:border-black print:text-black">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-[#38bdf8] font-bold print:text-black">Tool 1.13 Standard RMP</span>
            <span>//</span>
            <span>ISO 31000 &amp; WHO TDR Compliance</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#888888] print:text-black">Developed by</span>
            <a
              id="who-template-technoscope-link"
              href="https://www.technoscope.co.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5ff00] hover:underline font-bold print:text-black"
              title="Technoscope Official Website - www.technoscope.co.in"
            >
              www.technoscope.co.in
            </a>
            <span className="text-[#444444] print:text-black">//</span>
            <span className="text-[#dddddd] font-semibold print:text-black">Proprietary Copyright</span>
          </div>
        </div>
      </div>
    </div>
  );
};
