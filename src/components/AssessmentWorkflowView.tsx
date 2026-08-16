import React, { useState } from 'react';
import {
  Search,
  AlertCircle,
  Paperclip,
  Plus,
  Sliders,
  FileText,
  Info,
} from 'lucide-react';
import { AssessedControl } from '../types';
import { calculateControlRisk } from '../utils/riskCalculations';
import { NIST_FAMILIES } from '../data/nistControls';

interface AssessmentWorkflowViewProps {
  controls: AssessedControl[];
  onUpdateControl: (updated: AssessedControl) => void;
  onBatchUpdateControls: (updatedList: AssessedControl[]) => void;
  selectedControlId?: string | null;
  onClearSelectedControlId?: () => void;
  initialDomainFilter?: string | null;
}

export const AssessmentWorkflowView: React.FC<AssessmentWorkflowViewProps> = ({
  controls,
  onUpdateControl,
  onBatchUpdateControls,
  selectedControlId,
  initialDomainFilter,
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string>(initialDomainFilter || 'ALL');
  const [selectedFamily, setSelectedFamily] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(null);
  const [uploadModalControlId, setUploadModalControlId] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');

  // Filtering
  const filteredControls = controls.filter((c) => {
    if (selectedDomain !== 'ALL' && c.domain !== selectedDomain) return false;
    if (selectedFamily !== 'ALL' && c.family !== selectedFamily) return false;
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = c.controlId.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchGaps = c.gapsIdentified?.toLowerCase().includes(q);
      const matchEvidence = c.implementationEvidence?.toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchGaps && !matchEvidence) return false;
    }
    return true;
  });

  const handleFieldChange = (control: AssessedControl, field: keyof AssessedControl, value: any) => {
    const updated: AssessedControl = {
      ...control,
      [field]: value,
      lastUpdated: new Date().toISOString(),
    };

    // Recalculate risk formula
    const { inherentRisk, calculatedCEF, residualRisk, status } = calculateControlRisk(
      field === 'inherentImpact' ? value : updated.inherentImpact,
      field === 'inherentLikelihood' ? value : updated.inherentLikelihood,
      field === 'designEffectiveness' ? value : updated.designEffectiveness,
      field === 'operatingEffectiveness' ? value : updated.operatingEffectiveness,
      field === 'deficiencyPenalty' ? value : updated.deficiencyPenalty,
      field === 'confidenceFactor' ? value : updated.confidenceFactor
    );

    updated.inherentRisk = inherentRisk;
    updated.calculatedCEF = calculatedCEF;
    updated.residualRisk = residualRisk;
    updated.status = status;

    onUpdateControl(updated);
  };

  const handleQuestionAnswer = (
    control: AssessedControl,
    questionId: string,
    answer: 'YES' | 'PARTIAL' | 'NO' | 'NOT_APPLICABLE'
  ) => {
    const newResponses = {
      ...control.questionResponses,
      [questionId]: {
        ...(control.questionResponses[questionId] || { notes: '' }),
        answer,
      },
    };

    // Estimate design/operating effectiveness based on answers
    const answers = Object.values(newResponses).map((r) => r.answer);
    const yesCount = answers.filter((a) => a === 'YES').length;
    const partialCount = answers.filter((a) => a === 'PARTIAL').length;
    const noCount = answers.filter((a) => a === 'NO').length;
    const totalQ = answers.length || 1;

    let derivedDe = control.designEffectiveness;
    let derivedOe = control.operatingEffectiveness;
    let derivedDef = control.deficiencyPenalty;

    if (noCount > 0) {
      derivedDe = Math.max(
        0.2,
        Number(((yesCount * 1.0 + partialCount * 0.5) / totalQ).toFixed(2))
      );
      derivedOe = Math.max(
        0.1,
        Number(((yesCount * 0.9 + partialCount * 0.4) / totalQ).toFixed(2))
      );
      derivedDef = Math.min(0.3, noCount * 0.1);
    } else if (partialCount > 0) {
      derivedDe = 0.8;
      derivedOe = 0.65;
      derivedDef = 0.05;
    } else {
      derivedDe = 0.95;
      derivedOe = 0.9;
      derivedDef = 0;
    }

    const { inherentRisk, calculatedCEF, residualRisk, status } = calculateControlRisk(
      control.inherentImpact,
      control.inherentLikelihood,
      derivedDe,
      derivedOe,
      derivedDef,
      control.confidenceFactor
    );

    const updated: AssessedControl = {
      ...control,
      questionResponses: newResponses,
      designEffectiveness: derivedDe,
      operatingEffectiveness: derivedOe,
      deficiencyPenalty: derivedDef,
      inherentRisk,
      calculatedCEF,
      residualRisk,
      status,
      lastUpdated: new Date().toISOString(),
    };

    onUpdateControl(updated);
  };

  const handleAddEvidenceFile = (controlId: string) => {
    if (!newFileName.trim()) return;
    const control = controls.find((c) => c.controlId === controlId);
    if (!control) return;

    const newAttachment = {
      id: `ev-${Date.now()}`,
      name: newFileName.trim(),
      size: `${(Math.random() * 2 + 0.4).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().split('T')[0],
      fileType: newFileName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream',
      hash: `SHA256:${Array.from({ length: 16 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('')}`,
    };

    const updated: AssessedControl = {
      ...control,
      evidenceAttachments: [...control.evidenceAttachments, newAttachment],
      confidenceFactor: 1.0,
    };

    const { inherentRisk, calculatedCEF, residualRisk, status } = calculateControlRisk(
      updated.inherentImpact,
      updated.inherentLikelihood,
      updated.designEffectiveness,
      updated.operatingEffectiveness,
      updated.deficiencyPenalty,
      1.0
    );

    updated.inherentRisk = inherentRisk;
    updated.calculatedCEF = calculatedCEF;
    updated.residualRisk = residualRisk;
    updated.status = status;

    onUpdateControl(updated);
    setNewFileName('');
    setUploadModalControlId(null);
  };

  const handleBatchAutoScore = (mode: 'compliant' | 'moderate_gap') => {
    const updatedList = controls.map((c) => {
      const de = mode === 'compliant' ? 0.95 : 0.65;
      const oe = mode === 'compliant' ? 0.9 : 0.55;
      const def = mode === 'compliant' ? 0 : 0.15;
      const { inherentRisk, calculatedCEF, residualRisk, status } = calculateControlRisk(
        c.inherentImpact,
        c.inherentLikelihood,
        de,
        oe,
        def,
        0.95
      );
      return {
        ...c,
        designEffectiveness: de,
        operatingEffectiveness: oe,
        deficiencyPenalty: def,
        calculatedCEF,
        residualRisk,
        status,
        lastUpdated: new Date().toISOString(),
      };
    });
    onBatchUpdateControls(updatedList);
  };

  return (
    <div className="space-y-6 pb-20 text-white animate-fadeIn">
      {/* Filter Header Banner */}
      <div className="border border-[#262626] bg-[#141414] p-6 space-y-6">
        {/* Top Domain Selection Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#262626] pb-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs font-mono font-bold uppercase tracking-wider">
            {['ALL', 'Cybersecurity', 'Privacy', 'Information Security', 'Governance'].map((dom) => (
              <button
                key={dom}
                onClick={() => setSelectedDomain(dom)}
                className={`px-3 py-1.5 border transition whitespace-nowrap ${
                  selectedDomain === dom
                    ? 'border-[#f5ff00] bg-[#f5ff00] text-black font-bold'
                    : 'border-[#333333] bg-[#1a1a1a] text-[#888888] hover:text-white hover:border-[#666666]'
                }`}
              >
                {dom === 'ALL' ? 'All NIST Families' : dom}
                <span className="ml-1 text-[10px] font-mono opacity-75">
                  (
                  {dom === 'ALL'
                    ? controls.length
                    : controls.filter((c) => c.domain === dom).length}
                  )
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBatchAutoScore('compliant')}
              className="px-3 py-1.5 border border-[#333333] bg-[#1a1a1a] text-[#888888] hover:text-[#f5ff00] hover:border-[#f5ff00] text-[10px] font-mono uppercase tracking-wider font-bold transition"
              title="Set standard compliant design and operating effectiveness across all controls"
            >
              Batch Compliant
            </button>
            <button
              onClick={() => handleBatchAutoScore('moderate_gap')}
              className="px-3 py-1.5 border border-[#333333] bg-[#1a1a1a] text-[#888888] hover:text-[#f5ff00] hover:border-[#f5ff00] text-[10px] font-mono uppercase tracking-wider font-bold transition"
              title="Simulate realistic audit findings and gaps"
            >
              Simulate Gaps
            </button>
          </div>
        </div>

        {/* Search & Select Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#888888] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Control ID (e.g. AC-2, PT-4)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#333333] bg-black text-white placeholder-[#666666] focus:border-[#f5ff00] outline-none font-mono"
            />
          </div>

          <div>
            <select
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none font-mono"
            >
              <option value="ALL">All 20 NIST Control Families</option>
              {NIST_FAMILIES.map((fam) => (
                <option key={fam.id} value={fam.id}>
                  {fam.id} - {fam.name} ({fam.domain})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none font-mono"
            >
              <option value="ALL">All Compliance Statuses</option>
              <option value="COMPLIANT">Compliant (CEF &ge; 85%)</option>
              <option value="SATISFACTORY">Satisfactory (CEF 60-84%)</option>
              <option value="NEEDS_ATTENTION">Needs Attention</option>
              <option value="CRITICAL_DEFICIENCY">Critical Deficiency (RR &ge; 15)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Control Questionnaire Cards */}
      <div className="space-y-6">
        {filteredControls.length === 0 ? (
          <div className="border border-[#262626] bg-[#141414] p-12 text-center">
            <AlertCircle className="w-6 h-6 text-[#888888] mx-auto mb-2" />
            <h4 className="text-sm font-syne font-bold uppercase text-white">
              No Controls Match Active Query
            </h4>
            <p className="text-xs text-[#888888] font-mono mt-1">
              Adjust search parameters or domain filters.
            </p>
          </div>
        ) : (
          filteredControls.map((c) => {
            const isDiscussionExpanded = expandedDiscussionId === c.controlId;
            const isCritical = c.residualRisk >= 15;
            const isHigh = c.residualRisk >= 10 && c.residualRisk < 15;

            return (
              <div
                key={c.controlId}
                id={`control-${c.controlId}`}
                className={`border bg-[#141414] p-6 space-y-6 transition ${
                  selectedControlId === c.controlId
                    ? 'border-[#f5ff00] shadow-[0_0_15px_rgba(245,255,0,0.15)]'
                    : 'border-[#262626]'
                }`}
              >
                {/* Control Title Bar */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#262626] pb-5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-base font-bold px-2.5 py-0.5 border border-[#333333] bg-black text-[#f5ff00]">
                        {c.controlId}
                      </span>
                      <h3 className="text-lg sm:text-xl font-syne font-bold uppercase tracking-tight text-white">
                        {c.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono uppercase font-bold tracking-widest text-[#888888]">
                      <span>
                        {c.familyName} ({c.family})
                      </span>
                      <span>•</span>
                      <span>{c.domain}</span>
                      {c.isAssuranceRelated && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400">Assurance Priority</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-[#aaaaaa] max-w-3xl pt-1">
                      {c.discussion}
                    </p>
                  </div>

                  {/* Quantitative Badges */}
                  <div className="flex items-center gap-4 shrink-0 self-start md:self-center border-t md:border-t-0 border-[#262626] pt-3 md:pt-0">
                    <div className="text-center p-2 border border-[#262626] bg-black min-w-[70px]">
                      <div className="text-[9px] font-mono uppercase font-bold text-[#888888] tracking-wider">
                        Inherent
                      </div>
                      <div className="text-lg font-mono font-bold text-white">{c.inherentRisk}</div>
                    </div>
                    <div className="text-center p-2 border border-[#262626] bg-black min-w-[70px]">
                      <div className="text-[9px] font-mono uppercase font-bold text-[#888888] tracking-wider">
                        CEF
                      </div>
                      <div className="text-lg font-mono font-bold text-[#f5ff00]">
                        {(c.calculatedCEF * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div
                      className={`text-center p-2 border min-w-[70px] ${
                        isCritical
                          ? 'border-rose-600 bg-rose-950/40 text-rose-300'
                          : isHigh
                          ? 'border-amber-600 bg-amber-950/40 text-amber-300'
                          : 'border-emerald-600 bg-emerald-950/40 text-emerald-300'
                      }`}
                    >
                      <div className="text-[9px] font-mono uppercase font-bold tracking-wider opacity-80">
                        Residual
                      </div>
                      <div className="text-lg font-mono font-bold">{c.residualRisk.toFixed(1)}</div>
                    </div>
                  </div>
                </div>

                {/* NIST SP 800-53 Guidance Collapsible */}
                <div>
                  <button
                    onClick={() =>
                      setExpandedDiscussionId(isDiscussionExpanded ? null : c.controlId)
                    }
                    className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#f5ff00] hover:underline flex items-center gap-1.5"
                  >
                    <Info className="w-3 h-3 inline" />
                    {isDiscussionExpanded
                      ? 'Collapse NIST Guidance [-]'
                      : 'View NIST Guidance & Enhancements [+]'}
                  </button>

                  {isDiscussionExpanded && (
                    <div className="mt-3 p-4 bg-black border border-[#262626] text-xs space-y-3 font-mono">
                      <div>
                        <span className="font-bold uppercase text-[10px] text-[#888888] block mb-1">
                          NIST Discussion:
                        </span>
                        <p className="leading-relaxed text-[#cccccc]">{c.discussion}</p>
                      </div>
                      {c.relatedControls.length > 0 && (
                        <div className="pt-2 border-t border-[#262626] flex items-center gap-2 flex-wrap">
                          <span className="font-bold uppercase text-[10px] text-[#888888]">
                            Related Controls:
                          </span>
                          {c.relatedControls.map((rc) => (
                            <span
                              key={rc}
                              className="text-[10px] px-1.5 py-0.5 border border-[#333333] bg-[#141414] text-[#f5ff00]"
                            >
                              {rc}
                            </span>
                          ))}
                        </div>
                      )}
                      {c.controlEnhancements.length > 0 && (
                        <div className="pt-2 border-t border-[#262626]">
                          <span className="font-bold uppercase text-[10px] text-[#888888] block mb-1">
                            Enhancements:
                          </span>
                          <ul className="list-disc list-inside space-y-1 text-[#cccccc]">
                            {c.controlEnhancements.map((enh, idx) => (
                              <li key={idx}>
                                {c.controlId}({idx + 1}): {enh}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Questionnaire Inquiries */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#888888] flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-[#f5ff00]" />
                      Customized Questionnaire Inquiries & Authoritative References
                    </h4>
                    <span className="text-[10px] font-mono text-[#666666]">
                      NIST SP 800-53 / Privacy Framework / CSF
                    </span>
                  </div>

                  <div className="space-y-2">
                    {c.assessmentQuestions.map((q, qIndex) => {
                      const currentResp = c.questionResponses[q.id]?.answer || 'YES';
                      const formattedIndex = String(qIndex + 1).padStart(2, '0');

                      return (
                        <div
                          key={q.id}
                          className="p-4 border border-[#262626] bg-[#0d0d0d] space-y-3 transition"
                        >
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <span className="text-base font-mono font-bold text-[#666666]">
                                {formattedIndex}
                              </span>
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-[10px] font-bold text-[#888888]">
                                    [{q.id}]
                                  </span>
                                  {q.reference && (
                                    <span className="text-[9px] font-mono px-2 py-0.5 border border-[#333333] bg-black font-bold text-[#f5ff00]">
                                      {q.reference}
                                    </span>
                                  )}
                                  {q.publication && (
                                    <span className="text-[9px] font-mono px-2 py-0.5 bg-[#181818] text-[#aaaaaa] border border-[#262626]">
                                      {q.publication}
                                    </span>
                                  )}
                                  {q.additionalRef && (
                                    <span className="text-[9px] font-mono px-2 py-0.5 bg-purple-950 text-purple-300 border border-purple-800">
                                      {q.additionalRef}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm font-medium leading-relaxed text-white">
                                  {q.text}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end md:self-start">
                              {(['YES', 'PARTIAL', 'NO', 'NOT_APPLICABLE'] as const).map((opt) => {
                                const isSelected = currentResp === opt;
                                let btnStyle =
                                  'border-[#333333] bg-[#181818] text-[#888888] hover:text-white hover:border-[#666666]';
                                if (isSelected) {
                                  if (opt === 'YES')
                                    btnStyle = 'border-[#f5ff00] bg-[#f5ff00] text-black font-bold';
                                  else if (opt === 'PARTIAL')
                                    btnStyle =
                                      'border-amber-500 bg-amber-500 text-black font-bold';
                                  else if (opt === 'NO')
                                    btnStyle = 'border-rose-600 bg-rose-600 text-white font-bold';
                                  else
                                    btnStyle = 'border-white bg-white text-black font-bold';
                                }
                                return (
                                  <button
                                    key={opt}
                                    onClick={() => handleQuestionAnswer(c, q.id, opt)}
                                    className={`px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border transition ${btnStyle}`}
                                  >
                                    {opt === 'NOT_APPLICABLE' ? 'N/A' : opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quantitative Scoring Controls */}
                <div className="p-5 border border-[#262626] bg-[#0c0c0c] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#f5ff00] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      Quantitative Calibration (CEF Engine)
                    </span>
                    <span className="text-[10px] font-mono text-[#888888]">
                      CEF = (0.4×{c.designEffectiveness} + 0.6×{c.operatingEffectiveness}) × (1 -{' '}
                      {c.deficiencyPenalty}) ={' '}
                      <strong className="text-white font-bold">{c.calculatedCEF.toFixed(2)}</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div>
                      <div className="flex justify-between text-xs font-mono font-bold mb-1 text-white">
                        <span>Inherent Impact</span>
                        <span className="text-[#f5ff00]">{c.inherentImpact} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={c.inherentImpact}
                        onChange={(e) =>
                          handleFieldChange(c, 'inherentImpact', parseInt(e.target.value))
                        }
                        className="w-full accent-[#f5ff00] h-1.5 bg-[#262626] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono font-bold mb-1 text-white">
                        <span>Inherent Likelihood</span>
                        <span className="text-[#f5ff00]">{c.inherentLikelihood} / 5</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={c.inherentLikelihood}
                        onChange={(e) =>
                          handleFieldChange(c, 'inherentLikelihood', parseInt(e.target.value))
                        }
                        className="w-full accent-[#f5ff00] h-1.5 bg-[#262626] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono font-bold mb-1 text-white">
                        <span>Design Eff. (40%)</span>
                        <span className="text-[#f5ff00]">
                          {(c.designEffectiveness * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={c.designEffectiveness}
                        onChange={(e) =>
                          handleFieldChange(c, 'designEffectiveness', parseFloat(e.target.value))
                        }
                        className="w-full accent-[#f5ff00] h-1.5 bg-[#262626] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono font-bold mb-1 text-white">
                        <span>Operating Eff. (60%)</span>
                        <span className="text-[#f5ff00]">
                          {(c.operatingEffectiveness * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={c.operatingEffectiveness}
                        onChange={(e) =>
                          handleFieldChange(c, 'operatingEffectiveness', parseFloat(e.target.value))
                        }
                        className="w-full accent-[#f5ff00] h-1.5 bg-[#262626] cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-[#262626]">
                    <div>
                      <div className="flex justify-between text-xs font-mono font-bold mb-1 text-white">
                        <span>Audit Deficiency Deduction</span>
                        <span className="text-rose-400">
                          -{(c.deficiencyPenalty * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.05"
                        value={c.deficiencyPenalty}
                        onChange={(e) =>
                          handleFieldChange(c, 'deficiencyPenalty', parseFloat(e.target.value))
                        }
                        className="w-full accent-rose-500 h-1.5 bg-[#262626] cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono font-bold mb-1 text-white">
                        <span>Evidence Verification Mode</span>
                        <span className="font-mono text-xs text-[#888888]">
                          {c.confidenceFactor === 1.0
                            ? 'Automated Telemetry (1.0)'
                            : 'Manual Attestation (0.8)'}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleFieldChange(c, 'confidenceFactor', 1.0)}
                          className={`flex-1 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border transition ${
                            c.confidenceFactor >= 0.95
                              ? 'border-[#f5ff00] bg-[#f5ff00] text-black'
                              : 'border-[#333333] bg-[#1a1a1a] text-[#888888] hover:text-white'
                          }`}
                        >
                          1.0 Automated
                        </button>
                        <button
                          onClick={() => handleFieldChange(c, 'confidenceFactor', 0.8)}
                          className={`flex-1 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider border transition ${
                            c.confidenceFactor < 0.95
                              ? 'border-[#f5ff00] bg-[#f5ff00] text-black'
                              : 'border-[#333333] bg-[#1a1a1a] text-[#888888] hover:text-white'
                          }`}
                        >
                          0.8 Manual
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence & Gaps Textareas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-[#888888] mb-1">
                      Implementation Evidence & Verification Notes:
                    </label>
                    <textarea
                      rows={2}
                      value={c.implementationEvidence}
                      onChange={(e) =>
                        handleFieldChange(c, 'implementationEvidence', e.target.value)
                      }
                      placeholder="Policy handbook reference, SIEM log telemetry, automated compliance audit results..."
                      className="w-full p-3 text-xs border border-[#333333] bg-black text-white placeholder-[#555555] focus:border-[#f5ff00] outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-rose-400 mb-1">
                      Identified Gaps, Exceptions & Root Cause:
                    </label>
                    <textarea
                      rows={2}
                      value={c.gapsIdentified}
                      onChange={(e) => handleFieldChange(c, 'gapsIdentified', e.target.value)}
                      placeholder="Disaster recovery testing overdue, missing SBOM container validation..."
                      className="w-full p-3 text-xs border border-rose-900 bg-black text-white placeholder-[#555555] focus:border-rose-500 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Footer: Artifacts & Responsible Owner */}
                <div className="pt-4 border-t border-[#262626] flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-[#888888] flex items-center gap-1">
                      <Paperclip className="w-3 h-3 text-[#f5ff00]" />
                      Artifacts ({c.evidenceAttachments.length}):
                    </span>
                    {c.evidenceAttachments.map((att) => (
                      <span
                        key={att.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#333333] text-[10px] font-mono bg-black text-[#cccccc]"
                      >
                        <FileText className="w-2.5 h-2.5 text-[#888888]" />
                        <span className="max-w-[130px] truncate">{att.name}</span>
                      </span>
                    ))}
                    <button
                      onClick={() => setUploadModalControlId(c.controlId)}
                      className="px-2 py-0.5 border border-[#333333] bg-[#1a1a1a] text-[#888888] hover:text-[#f5ff00] hover:border-[#f5ff00] text-[10px] font-mono font-bold uppercase tracking-wider transition flex items-center gap-1"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      Attach
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[10px] uppercase tracking-wider text-[#888888]">
                      Owner:
                    </span>
                    <input
                      type="text"
                      value={c.assignedOwner || ''}
                      onChange={(e) => handleFieldChange(c, 'assignedOwner', e.target.value)}
                      placeholder="e.g. Identity Team"
                      className="px-2 py-1 text-xs border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none w-40 font-mono"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Upload Artifact Modal */}
      {uploadModalControlId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-[#141414] border border-[#333333] max-w-md w-full p-6 space-y-4 shadow-[0_0_25px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-sm font-syne font-bold uppercase text-white">
                Attach Verification Evidence
              </h3>
              <button
                onClick={() => setUploadModalControlId(null)}
                className="font-mono text-sm text-[#888888] hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#888888] font-mono leading-relaxed">
              Attach policy documentation, SIEM telemetry export, screenshot, or configuration audit
              report for control{' '}
              <strong className="text-[#f5ff00] font-bold">{uploadModalControlId}</strong>.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-[#888888] mb-1">
                  Document / Artifact Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g., AC2_Deprovisioning_Splunk_Audit_2026.pdf"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full p-2.5 text-xs border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none font-mono"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {[
                  'MFA_Policy_v3.pdf',
                  'SIEM_Telemetry_Export.json',
                  'PenTest_Attestation.pdf',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNewFileName(preset)}
                    className="text-[10px] px-2 py-1 border border-[#333333] bg-black text-[#888888] hover:text-[#f5ff00] hover:border-[#f5ff00] transition font-mono truncate"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#262626]">
              <button
                onClick={() => setUploadModalControlId(null)}
                className="px-3 py-1.5 text-xs font-mono uppercase font-bold tracking-wider text-[#888888] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAddEvidenceFile(uploadModalControlId)}
                className="px-4 py-1.5 text-xs font-mono uppercase font-bold tracking-wider bg-[#f5ff00] text-black hover:bg-yellow-300 transition"
              >
                Attach Artifact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
