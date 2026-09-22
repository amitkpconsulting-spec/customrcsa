import React, { useState } from 'react';
import {
  X,
  Sliders,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Paperclip,
  Plus,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  Info,
} from 'lucide-react';
import { AssessedControl } from '../types';
import { calculateControlRisk } from '../utils/riskCalculations';

interface ControlDetailDrawerProps {
  control: AssessedControl | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateControl: (updated: AssessedControl) => void;
  onOpenUploadModal: (controlId: string) => void;
  onOpenAICopilotForControl?: (control: AssessedControl) => void;
  onNavigateNext?: () => void;
  onNavigatePrev?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  currentIndex?: number;
  totalCount?: number;
}

export const ControlDetailDrawer: React.FC<ControlDetailDrawerProps> = ({
  control,
  isOpen,
  onClose,
  onUpdateControl,
  onOpenUploadModal,
  onOpenAICopilotForControl,
  onNavigateNext,
  onNavigatePrev,
  hasPrev = false,
  hasNext = false,
  currentIndex,
  totalCount,
}) => {
  const [activeTab, setActiveTab] = useState<'calibration' | 'evidence' | 'gaps'>('calibration');
  const [quickRecalcFeedback, setQuickRecalcFeedback] = useState(false);

  if (!isOpen || !control) return null;

  const handleFieldChange = (field: keyof AssessedControl, value: any) => {
    const updated: AssessedControl = {
      ...control,
      [field]: value,
      lastUpdated: new Date().toISOString(),
    };

    // Recalculate risk formula automatically
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
    questionId: string,
    response: 'YES' | 'PARTIAL' | 'NO'
  ) => {
    const updatedResponses = {
      ...(control.questionResponses || {}),
      [questionId]: {
        answer: response,
        notes: control.questionResponses?.[questionId]?.notes || '',
      },
    };

    const questions = control.assessmentQuestions || [];
    const totalQ = questions.length || 1;
    let yesCount = 0;
    let partialCount = 0;

    questions.forEach((q) => {
      const ans = updatedResponses[q.id]?.answer;
      if (ans === 'YES') yesCount++;
      else if (ans === 'PARTIAL') partialCount++;
    });

    const autoOe = Number(((yesCount * 1.0 + partialCount * 0.5) / totalQ).toFixed(2));

    const { inherentRisk, calculatedCEF, residualRisk, status } = calculateControlRisk(
      control.inherentImpact,
      control.inherentLikelihood,
      control.designEffectiveness,
      autoOe,
      control.deficiencyPenalty,
      control.confidenceFactor
    );

    onUpdateControl({
      ...control,
      questionResponses: updatedResponses,
      operatingEffectiveness: autoOe,
      inherentRisk,
      calculatedCEF,
      residualRisk,
      status,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleQuickRecalc = () => {
    const { inherentRisk, calculatedCEF, residualRisk, status } = calculateControlRisk(
      control.inherentImpact,
      control.inherentLikelihood,
      control.designEffectiveness,
      control.operatingEffectiveness,
      control.deficiencyPenalty,
      control.confidenceFactor
    );

    onUpdateControl({
      ...control,
      inherentRisk,
      calculatedCEF,
      residualRisk,
      status,
      lastUpdated: new Date().toISOString(),
    });

    setQuickRecalcFeedback(true);
    setTimeout(() => setQuickRecalcFeedback(false), 2500);
  };

  const isCritical = control.residualRisk >= 15;
  const isHigh = control.residualRisk >= 10 && control.residualRisk < 15;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-2xl bg-[#111111] border-l border-[#262626] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#262626] bg-[#0c0c0c] flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 border border-[#333333] bg-black text-[#f5ff00]">
                {control.controlId}
              </span>
              <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">
                {control.familyName} ({control.family}) • {control.domain}
              </span>
              <span
                className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 border ${
                  control.status === 'COMPLIANT'
                    ? 'border-emerald-600 text-emerald-400 bg-emerald-950/40'
                    : control.status === 'SATISFACTORY'
                    ? 'border-[#f5ff00] text-[#f5ff00] bg-[#1a1a00]'
                    : control.status === 'NEEDS_ATTENTION'
                    ? 'border-orange-600 text-orange-400 bg-orange-950/40'
                    : 'border-red-600 text-red-400 bg-red-950/40'
                }`}
              >
                {control.status.replace('_', ' ')}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-syne font-bold uppercase tracking-tight text-white leading-snug truncate">
              {control.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {currentIndex !== undefined && totalCount !== undefined && (
              <span className="text-[10px] font-mono text-[#666666] mr-1">
                {currentIndex + 1}/{totalCount}
              </span>
            )}
            <button
              onClick={onNavigatePrev}
              disabled={!hasPrev}
              className="p-1.5 border border-[#2a2a2a] bg-black text-[#888888] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="Previous Control"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNavigateNext}
              disabled={!hasNext}
              className="p-1.5 border border-[#2a2a2a] bg-black text-[#888888] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
              title="Next Control"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 border border-[#333333] bg-[#1a1a1a] text-[#888888] hover:text-white hover:border-white transition cursor-pointer ml-1"
              title="Close Drawer (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Score Summary Strip */}
        <div className="grid grid-cols-3 bg-black border-b border-[#262626] font-mono text-center divide-x divide-[#222222]">
          <div className="py-2.5 px-3">
            <div className="text-[9px] uppercase text-[#777777]">Inherent Risk</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {control.inherentRisk} <span className="text-[9px] text-[#666666] font-normal">/ 25</span>
            </div>
          </div>
          <div className="py-2.5 px-3">
            <div className="text-[9px] uppercase text-[#777777]">CEF Effectiveness</div>
            <div className="text-sm font-bold text-[#f5ff00] mt-0.5">
              {(control.calculatedCEF * 100).toFixed(0)}%
            </div>
          </div>
          <div className="py-2.5 px-3">
            <div className="text-[9px] uppercase text-[#777777]">Residual Risk</div>
            <div
              className={`text-sm font-bold mt-0.5 ${
                isCritical ? 'text-rose-400' : isHigh ? 'text-orange-400' : 'text-emerald-400'
              }`}
            >
              {control.residualRisk.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Drawer Tabs */}
        <div className="flex border-b border-[#262626] bg-[#0d0d0d] px-4 font-mono text-xs">
          <button
            onClick={() => setActiveTab('calibration')}
            className={`py-3 px-4 uppercase font-bold tracking-wider flex items-center gap-1.5 border-b-2 -mb-px transition cursor-pointer ${
              activeTab === 'calibration'
                ? 'border-[#f5ff00] text-[#f5ff00] bg-[#161616]'
                : 'border-transparent text-[#777777] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Calibration (CEF)</span>
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`py-3 px-4 uppercase font-bold tracking-wider flex items-center gap-1.5 border-b-2 -mb-px transition cursor-pointer ${
              activeTab === 'evidence'
                ? 'border-[#f5ff00] text-[#f5ff00] bg-[#161616]'
                : 'border-transparent text-[#777777] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. Evidence & Tests</span>
            <span className="text-[10px] px-1 py-0.2 bg-[#222222] border border-[#333333] text-[#aaaaaa]">
              {control.assessmentQuestions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('gaps')}
            className={`py-3 px-4 uppercase font-bold tracking-wider flex items-center gap-1.5 border-b-2 -mb-px transition cursor-pointer ${
              activeTab === 'gaps'
                ? 'border-[#f5ff00] text-[#f5ff00] bg-[#161616]'
                : 'border-transparent text-[#777777] hover:text-white'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>3. Gaps & Actions</span>
          </button>
        </div>

        {/* Drawer Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs text-white">
          {/* TAB 1: CALIBRATION */}
          {activeTab === 'calibration' && (
            <div className="space-y-6">
              {/* Discussion / Scope */}
              <div className="p-3.5 bg-black border border-[#222222] space-y-1">
                <div className="text-[9px] font-mono uppercase tracking-wider text-[#666666] font-bold">
                  NIST Control Baseline Discussion
                </div>
                <p className="text-xs text-[#aaaaaa] leading-relaxed font-sans">
                  {control.discussion}
                </p>
              </div>

              {/* Inherent Risk Parameters */}
              <div className="p-4 border border-[#262626] bg-[#141414] space-y-4">
                <div className="flex items-center justify-between border-b border-[#222222] pb-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#f5ff00] tracking-wider">
                    Inherent Risk Calibration (Impact × Likelihood)
                  </span>
                  <span className="font-mono text-xs text-white font-bold">
                    Score: {control.inherentRisk} / 25
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-[#888888] uppercase block mb-1.5">
                      Inherent Impact (1-5): <strong className="text-white">{control.inherentImpact}</strong>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={control.inherentImpact}
                      onChange={(e) => handleFieldChange('inherentImpact', parseInt(e.target.value))}
                      className="w-full accent-[#f5ff00] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#666666] mt-1">
                      <span>1 (Negligible)</span>
                      <span>5 (Catastrophic)</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#888888] uppercase block mb-1.5">
                      Inherent Likelihood (1-5): <strong className="text-white">{control.inherentLikelihood}</strong>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      step="1"
                      value={control.inherentLikelihood}
                      onChange={(e) => handleFieldChange('inherentLikelihood', parseInt(e.target.value))}
                      className="w-full accent-[#f5ff00] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-[#666666] mt-1">
                      <span>1 (Rare)</span>
                      <span>5 (Almost Certain)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Effectiveness Factor (CEF) Sliders */}
              <div className="p-4 border border-[#262626] bg-[#141414] space-y-4">
                <div className="flex items-center justify-between border-b border-[#222222] pb-2">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#f5ff00] tracking-wider">
                    Control Effectiveness Factor (CEF Engine)
                  </span>
                  <button
                    onClick={handleQuickRecalc}
                    className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase border border-[#333333] bg-black text-[#f5ff00] hover:border-[#f5ff00] transition flex items-center gap-1 cursor-pointer"
                  >
                    <Calculator className="w-2.5 h-2.5" />
                    <span>Quick Re-calc</span>
                  </button>
                </div>

                {quickRecalcFeedback && (
                  <div className="p-2 border border-emerald-700 bg-emerald-950/60 text-emerald-300 font-mono text-[10px] flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Formulas successfully updated for {control.controlId}.</span>
                  </div>
                )}

                <div className="space-y-3.5">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-[#aaaaaa]">Design Effectiveness (De: 40% weight)</span>
                      <span className="font-bold text-white">{(control.designEffectiveness * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={control.designEffectiveness}
                      onChange={(e) => handleFieldChange('designEffectiveness', parseFloat(e.target.value))}
                      className="w-full accent-[#f5ff00] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-[#aaaaaa]">Operating Effectiveness (Oe: 60% weight)</span>
                      <span className="font-bold text-white">{(control.operatingEffectiveness * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={control.operatingEffectiveness}
                      onChange={(e) => handleFieldChange('operatingEffectiveness', parseFloat(e.target.value))}
                      className="w-full accent-[#f5ff00] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-[#aaaaaa]">Deficiency Penalty</span>
                      <span className="font-bold text-rose-400">{(control.deficiencyPenalty * 100).toFixed(0)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.5"
                      step="0.05"
                      value={control.deficiencyPenalty}
                      onChange={(e) => handleFieldChange('deficiencyPenalty', parseFloat(e.target.value))}
                      className="w-full accent-red-500 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1">
                      <span className="text-[#aaaaaa]">Confidence Factor (Audit Verification)</span>
                      <span className="font-bold text-white">{control.confidenceFactor.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      value={control.confidenceFactor}
                      onChange={(e) => handleFieldChange('confidenceFactor', parseFloat(e.target.value))}
                      className="w-full accent-[#f5ff00] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EVIDENCE & QUESTIONS */}
          {activeTab === 'evidence' && (
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="text-[10px] font-mono uppercase font-bold text-[#f5ff00] tracking-wider">
                  Test of Operating Effectiveness Questionnaire ({control.assessmentQuestions.length} Questions)
                </div>

                {control.assessmentQuestions.map((q, idx) => (
                  <div key={q.id} className="p-3.5 border border-[#262626] bg-black space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-mono text-[10px] font-bold text-[#888888] shrink-0 mt-0.5">
                        Q{idx + 1}.
                      </span>
                      <p className="text-xs text-white leading-relaxed font-sans flex-1">
                        {q.text}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {(['YES', 'PARTIAL', 'NO'] as const).map((resp) => {
                        const activeResp = control.questionResponses?.[q.id]?.answer;
                        return (
                          <button
                            key={resp}
                            onClick={() => handleQuestionAnswer(q.id, resp)}
                            className={`px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider border transition cursor-pointer ${
                              activeResp === resp
                                ? resp === 'YES'
                                  ? 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                                  : resp === 'PARTIAL'
                                  ? 'border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00]'
                                  : 'border-rose-500 bg-rose-950/60 text-rose-300'
                                : 'border-[#2a2a2a] bg-[#141414] text-[#666666] hover:text-white'
                            }`}
                          >
                            {resp}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Implementation Evidence Textarea */}
              <div className="p-4 border border-[#262626] bg-[#141414] space-y-2">
                <label className="text-[10px] font-mono uppercase font-bold text-[#aaaaaa] block">
                  Implementation Evidence & Assessor Findings
                </label>
                <textarea
                  rows={3}
                  value={control.implementationEvidence || ''}
                  onChange={(e) => handleFieldChange('implementationEvidence', e.target.value)}
                  placeholder="Reference production logs, SIEM rules, automated pipeline policies, or policy document URLs..."
                  className="w-full p-2.5 text-xs bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none font-mono"
                />
              </div>

              {/* Attached Evidence Artifacts */}
              <div className="p-4 border border-[#262626] bg-[#141414] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#aaaaaa] flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    Attached Evidence Artifacts ({control.evidenceAttachments?.length || 0})
                  </span>
                  <button
                    onClick={() => onOpenUploadModal(control.controlId)}
                    className="px-2.5 py-1 text-[9px] font-mono font-bold uppercase border border-[#333333] bg-black text-[#f5ff00] hover:border-[#f5ff00] transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>Attach Evidence</span>
                  </button>
                </div>

                {control.evidenceAttachments && control.evidenceAttachments.length > 0 ? (
                  <div className="space-y-1.5">
                    {control.evidenceAttachments.map((att, i) => (
                      <div
                        key={att.id || i}
                        className="flex items-center justify-between p-2 bg-black border border-[#2a2a2a] text-[11px] font-mono text-[#cccccc]"
                      >
                        <span className="truncate">{att.name}</span>
                        <span className="text-[9px] text-[#34d399] uppercase font-bold">{att.size} • VERIFIED</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] font-mono text-[#666666] text-center py-2">
                    No artifacts attached yet. Click "Attach Evidence" to link policies or screenshots.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GAPS & ACTION ITEMS */}
          {activeTab === 'gaps' && (
            <div className="space-y-5">
              <div className="p-4 border border-[#262626] bg-[#141414] space-y-2">
                <label className="text-[10px] font-mono uppercase font-bold text-rose-400 block">
                  Identified Gaps & Root Causes
                </label>
                <textarea
                  rows={3}
                  value={control.gapsIdentified || ''}
                  onChange={(e) => handleFieldChange('gapsIdentified', e.target.value)}
                  placeholder="Detail any missing controls, partial coverage, or operational failures..."
                  className="w-full p-2.5 text-xs bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none font-mono"
                />
              </div>

              {/* AI Hardening & Mitigation Action */}
              {onOpenAICopilotForControl && (
                <div className="p-4 border border-[#f5ff00]/60 bg-[#141408] space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#f5ff00]" />
                    <span className="font-syne font-bold uppercase text-xs text-white">
                      AI Security Copilot & Zero Trust Hardening
                    </span>
                  </div>
                  <p className="text-xs text-[#aaaaaa]">
                    Generate technical Zero Trust policy hardening, automated drift detection scripts, or remediation recommendations tailored specifically for <strong className="text-[#f5ff00]">{control.controlId}</strong>.
                  </p>
                  <button
                    onClick={() => onOpenAICopilotForControl(control)}
                    className="w-full py-2.5 bg-[#f5ff00] text-black hover:bg-yellow-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-[0_0_10px_rgba(245,255,0,0.2)] cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate AI Mitigation & Hardening Code</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-[#262626] bg-[#0c0c0c] flex items-center justify-between gap-3">
          <button
            onClick={handleQuickRecalc}
            className="px-3.5 py-2 border border-[#333333] bg-[#1a1a1a] hover:border-[#f5ff00] text-[#f5ff00] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Recalculate Risk</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#222222] hover:bg-[#333333] text-white font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer"
            >
              Done
            </button>
            {hasNext && (
              <button
                onClick={onNavigateNext}
                className="px-4 py-2 bg-[#f5ff00] text-black hover:bg-yellow-300 font-mono text-xs font-bold uppercase tracking-wider transition flex items-center gap-1 cursor-pointer"
              >
                <span>Save & Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
