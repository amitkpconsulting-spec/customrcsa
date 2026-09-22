import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Shield,
  FileSpreadsheet,
  ChevronDown,
  ChevronRight,
  Calculator,
  X,
  Sliders,
  FileText,
  Paperclip,
  Plus,
  BookOpen,
  Wrench,
  CheckSquare,
  TrendingDown,
} from 'lucide-react';
import { AssessedControl, RCSAPayload, AISettings, AIRemediationPlan } from '../types';
import { calculateControlRisk } from '../utils/riskCalculations';
import { ControlDetailDrawer } from './ControlDetailDrawer';
import { SourceQuestionnaireView } from './SourceQuestionnaireView';
import { RemediationRoadmapView } from './RemediationRoadmapView';
import { RiskTreatmentPlanView } from './RiskTreatmentPlanView';
import { RemediationTrendROIChart } from './RemediationTrendROIChart';

interface AssessmentWorkflowViewProps {
  assessment: RCSAPayload;
  controls?: AssessedControl[];
  onUpdateControl: (control: AssessedControl) => void;
  onBatchUpdateControls?: (controls: AssessedControl[]) => void;
  onOpenUploadModal?: (controlId: string) => void;
  onOpenSettingsModal?: () => void;
  selectedControlId?: string | null;
  onSelectControl?: (controlId: string | null) => void;
  onClearSelectedControlId?: () => void;
  filterDomain?: string | null;
  initialDomainFilter?: string | null;
  onClearDomainFilter?: () => void;
  aiSettings?: AISettings;
  onUpdateRemediationPlan?: (plan: any) => void;
  onOpenAICopilotForControl?: (control: AssessedControl) => void;
  initialTab?: 'matrix' | 'roi_trend' | 'questionnaire' | 'remediation';
  onUpdateAssessment?: (updated: RCSAPayload) => void;
  onSaveSnapshot?: (versionTag: string, notes: string, author: string) => void;
}

export const AssessmentWorkflowView: React.FC<AssessmentWorkflowViewProps> = ({
  assessment,
  controls: propControls,
  onUpdateControl,
  onBatchUpdateControls,
  onOpenUploadModal,
  onOpenSettingsModal,
  selectedControlId,
  onSelectControl,
  onClearSelectedControlId,
  filterDomain,
  initialDomainFilter,
  onClearDomainFilter,
  aiSettings,
  onUpdateRemediationPlan,
  onOpenAICopilotForControl,
  initialTab,
  onUpdateAssessment,
  onSaveSnapshot,
}) => {
  // Studio Active Tab: 'matrix' | 'roi_trend' | 'questionnaire' | 'remediation'
  const [studioTab, setStudioTab] = useState<'matrix' | 'roi_trend' | 'questionnaire' | 'remediation'>(
    initialTab || 'matrix'
  );
  const [showTrendInMatrix, setShowTrendInMatrix] = useState(true);
  const [remediationSubMode, setRemediationSubMode] = useState<'rtp' | 'ai_roadmap'>('rtp');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>(initialDomainFilter || filterDomain || 'ALL');
  const [selectedFamily, setSelectedFamily] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  // Drawer State
  const [activeDrawerControlId, setActiveDrawerControlId] = useState<string | null>(selectedControlId || null);

  const controls = propControls || assessment.controls;

  // Quick Re-calculate Feedback Banner
  const [recalcFeedback, setRecalcFeedback] = useState<{
    timestamp: string;
    count: number;
    avgInherent: number;
    avgCEF: number;
    avgResidual: number;
    compliantCount: number;
    gapCount: number;
    targetScope: string;
  } | null>(null);

  useEffect(() => {
    if (filterDomain) {
      setSelectedDomain(filterDomain);
    }
  }, [filterDomain]);

  useEffect(() => {
    if (selectedControlId) {
      setActiveDrawerControlId(selectedControlId);
      setStudioTab('matrix');
    }
  }, [selectedControlId]);

  // Extract unique domains and families
  const domains = useMemo(() => {
    return Array.from(new Set(controls.map((c) => c.domain)));
  }, [controls]);

  const families = useMemo(() => {
    return Array.from(
      new Set(controls.map((c) => `${c.family}: ${c.familyName}`))
    );
  }, [controls]);

  // Filter controls
  const filteredControls = useMemo(() => {
    return controls.filter((c) => {
      const matchesSearch =
        c.controlId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.discussion.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.family.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDomain =
        selectedDomain === 'ALL' || c.domain === selectedDomain;

      const matchesFamily =
        selectedFamily === 'ALL' || `${c.family}: ${c.familyName}` === selectedFamily;

      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'COMPLIANT' && c.status === 'COMPLIANT') ||
        (selectedStatus === 'SATISFACTORY' && c.status === 'SATISFACTORY') ||
        (selectedStatus === 'NEEDS_ATTENTION' && c.status === 'NEEDS_ATTENTION') ||
        (selectedStatus === 'CRITICAL_DEFICIENCY' && (c.status === 'CRITICAL_DEFICIENCY' || c.residualRisk >= 15));

      return matchesSearch && matchesDomain && matchesFamily && matchesStatus;
    });
  }, [controls, searchQuery, selectedDomain, selectedFamily, selectedStatus]);

  // Batch Auto-Score
  const handleBatchAutoScore = (mode: 'compliant' | 'balanced' | 'deficiencies') => {
    if (!onBatchUpdateControls) return;

    const updated = controls.map((c) => {
      let impact = c.inherentImpact;
      let likelihood = c.inherentLikelihood;
      let de = c.designEffectiveness;
      let oe = c.operatingEffectiveness;
      let penalty = c.deficiencyPenalty;
      let conf = c.confidenceFactor;

      if (mode === 'compliant') {
        de = 0.95;
        oe = 0.9;
        penalty = 0.0;
        conf = 0.95;
      } else if (mode === 'balanced') {
        de = 0.8;
        oe = 0.75;
        penalty = 0.05;
        conf = 0.85;
      } else if (mode === 'deficiencies') {
        impact = 5;
        likelihood = 4;
        de = 0.4;
        oe = 0.3;
        penalty = 0.25;
        conf = 0.7;
      }

      const { inherentRisk, calculatedCEF, residualRisk, status } = calculateControlRisk(
        impact,
        likelihood,
        de,
        oe,
        penalty,
        conf
      );

      return {
        ...c,
        inherentImpact: impact,
        inherentLikelihood: likelihood,
        designEffectiveness: de,
        operatingEffectiveness: oe,
        deficiencyPenalty: penalty,
        confidenceFactor: conf,
        inherentRisk,
        calculatedCEF,
        residualRisk,
        status,
        lastUpdated: new Date().toISOString(),
      };
    });

    onBatchUpdateControls(updated);
  };

  // Quick Re-calculate All
  const handleQuickRecalculate = (scope: 'filtered' | 'all' = 'all') => {
    const targetControls = scope === 'filtered' ? filteredControls : controls;
    if (targetControls.length === 0) return;

    const updatedList = targetControls.map((c) => {
      const { inherentRisk, calculatedCEF, residualRisk, status } = calculateControlRisk(
        c.inherentImpact,
        c.inherentLikelihood,
        c.designEffectiveness,
        c.operatingEffectiveness,
        c.deficiencyPenalty,
        c.confidenceFactor
      );

      return {
        ...c,
        inherentRisk,
        calculatedCEF,
        residualRisk,
        status,
        lastUpdated: new Date().toISOString(),
      };
    });

    if (onBatchUpdateControls) {
      if (scope === 'all') {
        onBatchUpdateControls(updatedList);
      } else {
        const fullUpdated = controls.map((c) => {
          const found = updatedList.find((u) => u.controlId === c.controlId);
          return found || c;
        });
        onBatchUpdateControls(fullUpdated);
      }
    } else {
      updatedList.forEach((c) => onUpdateControl(c));
    }

    const totalCount = updatedList.length;
    const avgInherent = Number((updatedList.reduce((acc, c) => acc + c.inherentRisk, 0) / totalCount).toFixed(1));
    const avgCEF = Number((updatedList.reduce((acc, c) => acc + c.calculatedCEF, 0) / totalCount * 100).toFixed(1));
    const avgResidual = Number((updatedList.reduce((acc, c) => acc + c.residualRisk, 0) / totalCount).toFixed(1));
    const compliantCount = updatedList.filter((c) => c.status === 'COMPLIANT').length;
    const gapCount = updatedList.filter((c) => c.status === 'CRITICAL_DEFICIENCY' || c.status === 'NEEDS_ATTENTION').length;

    setRecalcFeedback({
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      count: totalCount,
      avgInherent,
      avgCEF,
      avgResidual,
      compliantCount,
      gapCount,
      targetScope: scope === 'filtered' ? 'Active Filter Selection' : 'Full Assessment Catalog',
    });
  };

  // Find active drawer control
  const activeDrawerControl = useMemo(() => {
    if (!activeDrawerControlId) return null;
    return controls.find((c) => c.controlId === activeDrawerControlId) || null;
  }, [controls, activeDrawerControlId]);

  const currentDrawerIndex = useMemo(() => {
    if (!activeDrawerControlId) return -1;
    return filteredControls.findIndex((c) => c.controlId === activeDrawerControlId);
  }, [filteredControls, activeDrawerControlId]);

  const handleNextControl = () => {
    if (currentDrawerIndex >= 0 && currentDrawerIndex < filteredControls.length - 1) {
      setActiveDrawerControlId(filteredControls[currentDrawerIndex + 1].controlId);
    }
  };

  const handlePrevControl = () => {
    if (currentDrawerIndex > 0) {
      setActiveDrawerControlId(filteredControls[currentDrawerIndex - 1].controlId);
    }
  };

  return (
    <div className="space-y-6 text-white pb-12">
      {/* Studio Sub-Navigation Banner */}
      <div className="border border-[#262626] bg-[#141414] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 border border-[#333333] bg-black text-[#888888]">
              STUDIO WORKSPACE
            </span>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00]">
              {assessment.assessmentName}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-syne font-bold uppercase tracking-tight text-white">
            Controls & Assessment Studio
          </h2>
          <p className="text-xs text-[#888888] font-sans">
            Calibrate quantitative risk parameters (Impact × Likelihood, CEF Engine), record audit testing evidence, and track remediation roadmaps.
          </p>
        </div>

        {/* Studio Sub-view Switcher Tabs */}
        <div className="flex items-center bg-black border border-[#262626] p-1 gap-1 shrink-0 font-mono text-xs flex-wrap">
          <button
            onClick={() => setStudioTab('matrix')}
            className={`px-3.5 py-2 font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              studioTab === 'matrix'
                ? 'bg-[#1e1e0a] border border-[#f5ff00] text-[#f5ff00]'
                : 'text-[#888888] hover:text-white border border-transparent'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>NIST Controls Matrix</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-[#222222] border border-[#333333] text-[#aaaaaa]">
              {controls.length}
            </span>
          </button>

          <button
            onClick={() => setStudioTab('roi_trend')}
            className={`px-3.5 py-2 font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              studioTab === 'roi_trend'
                ? 'bg-[#0c1a24] border border-[#38bdf8] text-[#38bdf8]'
                : 'text-[#888888] hover:text-white border border-transparent'
            }`}
            title="Plots Inherent Risk vs Residual Risk over time as remediation milestones are completed"
          >
            <TrendingDown className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Remediation ROI Trend</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#38bdf8] text-black font-bold">
              ROI CHART
            </span>
          </button>

          <button
            onClick={() => setStudioTab('questionnaire')}
            className={`px-3.5 py-2 font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              studioTab === 'questionnaire'
                ? 'bg-[#181024] border border-purple-500 text-purple-300'
                : 'text-[#888888] hover:text-white border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Source Questionnaire</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-purple-950 border border-purple-800 text-purple-300">
              CAIQ
            </span>
          </button>

          <button
            onClick={() => setStudioTab('remediation')}
            className={`px-3.5 py-2 font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer ${
              studioTab === 'remediation'
                ? 'bg-[#1c1c0a] border border-[#f5ff00] text-[#f5ff00]'
                : 'text-[#888888] hover:text-white border border-transparent'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-[#f5ff00]" />
            <span>Risk Treatment Plan (RTP)</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-[#f5ff00] text-black font-bold">
              RTP / 5-STEPS
            </span>
          </button>
        </div>
      </div>

      {/* RENDER VIEW: REMEDIATION ROI & RISK TRAJECTORY TREND STUDIO */}
      {studioTab === 'roi_trend' && (
        <RemediationTrendROIChart
          assessment={assessment}
          controls={controls}
          activeDomain={selectedDomain}
          onSelectDomain={(dom) => setSelectedDomain(dom)}
          onNavigateToRTP={() => setStudioTab('remediation')}
          onNavigateToControl={(cid) => {
            setActiveDrawerControlId(cid);
            setStudioTab('matrix');
          }}
        />
      )}

      {/* RENDER VIEW 1: SOURCE QUESTIONNAIRE */}
      {studioTab === 'questionnaire' && (
        <SourceQuestionnaireView
          assessment={assessment}
          onNavigateToControl={(cid) => {
            setActiveDrawerControlId(cid);
            setStudioTab('matrix');
          }}
        />
      )}

      {/* RENDER VIEW 2: RISK TREATMENT PLAN (RTP) & REMEDIATION STUDIO */}
      {studioTab === 'remediation' && (
        <div className="space-y-4">
          {/* Sub-mode selector bar */}
          <div className="flex items-center justify-between border-b border-[#262626] pb-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRemediationSubMode('rtp')}
                className={`px-3 py-1.5 font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                  remediationSubMode === 'rtp'
                    ? 'border border-[#f5ff00] bg-[#1c1c0a] text-[#f5ff00]'
                    : 'text-[#888888] hover:text-white border border-transparent'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Risk Treatment Plan (RTP: 5 Steps & Annual Tracking)</span>
              </button>

              <button
                onClick={() => setRemediationSubMode('ai_roadmap')}
                className={`px-3 py-1.5 font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 ${
                  remediationSubMode === 'ai_roadmap'
                    ? 'border border-[#38bdf8] bg-[#0c1a24] text-[#38bdf8]'
                    : 'text-[#888888] hover:text-white border border-transparent'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>AI Remediation PO&AM Sprints</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStudioTab('roi_trend')}
                className="text-[11px] font-mono text-[#38bdf8] hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <TrendingDown className="w-3 h-3" />
                <span>View Remediation ROI Trend &rarr;</span>
              </button>
              <span className="text-[10px] text-[#666666]">
                {remediationSubMode === 'rtp' ? 'NIST 800-53 / ISO 27005 Post-Audit RTP' : 'POA&M Agile Sprint Tracker'}
              </span>
            </div>
          </div>

          {remediationSubMode === 'rtp' ? (
            <RiskTreatmentPlanView
              assessment={assessment}
              controls={controls}
              onUpdateAssessment={
                onUpdateAssessment ||
                ((upd) => {
                  if (onBatchUpdateControls) onBatchUpdateControls(upd.controls);
                })
              }
              onNavigateToControl={(cid) => {
                setActiveDrawerControlId(cid);
                setStudioTab('matrix');
              }}
              onSaveSnapshot={onSaveSnapshot}
            />
          ) : (
            <RemediationRoadmapView
              controls={controls}
              remediationPlan={assessment.aiRemediation}
              onUpdatePlan={onUpdateRemediationPlan || (() => {})}
              sector={assessment.organizationProfile.sector}
              systemName={assessment.organizationProfile.targetSystem}
              onNavigateToControl={(cid) => {
                setActiveDrawerControlId(cid);
                setStudioTab('matrix');
              }}
              aiSettings={aiSettings}
            />
          )}
        </div>
      )}

      {/* RENDER VIEW 3: NIST CONTROLS MATRIX STUDIO */}
      {studioTab === 'matrix' && (
        <div className="space-y-5">
          {/* Remediation ROI & Risk Trajectory Trend Chart Panel */}
          <div className="border border-[#262626] bg-black/60 p-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#38bdf8] animate-pulse"></span>
                <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-[#38bdf8]" />
                  Remediation Trajectory &amp; ROI Trend Analysis
                </span>
                <span className="text-[10px] text-[#888888]">
                  (Inherent vs. Residual Risk Burn-Down)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTrendInMatrix(!showTrendInMatrix)}
                  className="px-2.5 py-1 bg-[#121212] border border-[#333333] hover:border-[#38bdf8] text-[#38bdf8] text-[11px] font-bold uppercase transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>{showTrendInMatrix ? 'Collapse Trend Chart ▲' : 'Expand Trend & ROI Plot ▼'}</span>
                </button>
                <button
                  onClick={() => setStudioTab('roi_trend')}
                  className="text-[#f5ff00] hover:underline font-bold text-[11px] uppercase tracking-wider cursor-pointer"
                >
                  Full Studio View &rarr;
                </button>
              </div>
            </div>

            {showTrendInMatrix && (
              <RemediationTrendROIChart
                assessment={assessment}
                controls={controls}
                activeDomain={selectedDomain}
                onSelectDomain={(dom) => setSelectedDomain(dom)}
                onNavigateToRTP={() => setStudioTab('remediation')}
                onNavigateToControl={(cid) => {
                  setActiveDrawerControlId(cid);
                }}
              />
            )}
          </div>

          {/* Domain Chips Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => {
                setSelectedDomain('ALL');
                if (onClearDomainFilter) onClearDomainFilter();
              }}
              className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border transition shrink-0 cursor-pointer ${
                selectedDomain === 'ALL'
                  ? 'border-[#f5ff00] bg-[#1c1c08] text-[#f5ff00]'
                  : 'border-[#262626] bg-[#111111] text-[#777777] hover:text-white'
              }`}
            >
              All Domains ({controls.length})
            </button>
            {domains.map((dom) => {
              const domCount = controls.filter((c) => c.domain === dom).length;
              return (
                <button
                  key={dom}
                  onClick={() => setSelectedDomain(dom)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border transition shrink-0 cursor-pointer ${
                    selectedDomain === dom
                      ? 'border-[#f5ff00] bg-[#1c1c08] text-[#f5ff00]'
                      : 'border-[#262626] bg-[#111111] text-[#777777] hover:text-white'
                  }`}
                >
                  {dom} ({domCount})
                </button>
              );
            })}
          </div>

          {/* Filtering & Quick Recalculate Bar */}
          <div className="p-4 border border-[#262626] bg-[#141414] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#666666]" />
                <input
                  type="text"
                  placeholder="Filter controls by ID, title, family..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none font-mono"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-[#666666] hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Family Filter Dropdown */}
              <select
                value={selectedFamily}
                onChange={(e) => setSelectedFamily(e.target.value)}
                className="w-full sm:w-56 px-3 py-2 text-xs border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none font-mono"
              >
                <option value="ALL">All Control Families</option>
                {families.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full sm:w-52 px-3 py-2 text-xs border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none font-mono"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLIANT">Compliant</option>
                <option value="SATISFACTORY">Satisfactory</option>
                <option value="NEEDS_ATTENTION">Needs Attention</option>
                <option value="CRITICAL_DEFICIENCY">Critical Deficiency</option>
              </select>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleQuickRecalculate('all')}
                className="px-3.5 py-2 bg-[#f5ff00] text-black hover:bg-yellow-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow-[0_0_10px_rgba(245,255,0,0.2)] cursor-pointer"
                title="Automatically calculate Inherent and Residual Risk formulas for all controls"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Quick Re-calculate</span>
              </button>

              <button
                onClick={() => setShowAdvancedTools(!showAdvancedTools)}
                className={`px-3 py-2 border font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                  showAdvancedTools
                    ? 'border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00]'
                    : 'border-[#333333] bg-black text-[#888888] hover:text-white'
                }`}
                title="Toggle batch calibration and auto-scoring tools"
              >
                <span>Tools {showAdvancedTools ? '▲' : '▼'}</span>
              </button>
            </div>
          </div>

          {/* Progressive Disclosure: Advanced Tools Drawer / Panel */}
          {showAdvancedTools && (
            <div className="p-4 border border-[#333333] bg-[#0f0f0f] space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-[#f5ff00] tracking-wider">
                  Advanced Batch Calibration & Scoring Presets
                </span>
                <span className="text-[10px] font-mono text-[#666666]">
                  Applies standardized test scoring baselines across all controls
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => handleBatchAutoScore('compliant')}
                  className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-600 text-emerald-300 font-mono text-xs font-bold uppercase hover:bg-emerald-900 transition cursor-pointer"
                >
                  Auto-Pass All (High CEF ~92%)
                </button>
                <button
                  onClick={() => handleBatchAutoScore('balanced')}
                  className="px-3 py-1.5 bg-[#1a1a1a] border border-[#444444] text-[#cccccc] font-mono text-xs font-bold uppercase hover:border-white transition cursor-pointer"
                >
                  Balanced Standard (CEF ~77%)
                </button>
                <button
                  onClick={() => handleBatchAutoScore('deficiencies')}
                  className="px-3 py-1.5 bg-rose-950/60 border border-rose-600 text-rose-300 font-mono text-xs font-bold uppercase hover:bg-rose-900 transition cursor-pointer"
                >
                  Stress Test Deficiencies (Low CEF ~35%)
                </button>
              </div>
            </div>
          )}

          {/* Re-calculate Feedback Banner */}
          {recalcFeedback && (
            <div className="border border-[#f5ff00] bg-[#10100d] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 border border-[#f5ff00] bg-black flex items-center justify-center text-[#f5ff00] shrink-0 mt-0.5">
                  <Calculator className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-syne font-bold uppercase tracking-wider text-white">
                      Formulas Re-calculated Successfully
                    </span>
                    <span className="text-[10px] font-mono text-[#888888]">
                      at {recalcFeedback.timestamp} • Scope: {recalcFeedback.targetScope} ({recalcFeedback.count} controls)
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[#aaaaaa]">
                    Applied: <span className="text-[#f5ff00] font-bold">IR = Impact × Likelihood</span> | <span className="text-[#f5ff00] font-bold">RR = IR × (1 - CEF × Confidence)</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 flex-wrap">
                <div className="px-2.5 py-1 bg-black border border-[#333333] text-center">
                  <div className="text-[9px] font-mono uppercase text-[#888888]">Avg Inherent</div>
                  <div className="text-xs font-mono font-bold text-white">{recalcFeedback.avgInherent} / 25</div>
                </div>
                <div className="px-2.5 py-1 bg-black border border-[#333333] text-center">
                  <div className="text-[9px] font-mono uppercase text-[#888888]">Avg CEF</div>
                  <div className="text-xs font-mono font-bold text-[#f5ff00]">{recalcFeedback.avgCEF}%</div>
                </div>
                <div className="px-2.5 py-1 bg-black border border-[#333333] text-center">
                  <div className="text-[9px] font-mono uppercase text-[#888888]">Avg Residual</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">{recalcFeedback.avgResidual}</div>
                </div>
                <div className="px-2.5 py-1 bg-black border border-[#333333] text-center">
                  <div className="text-[9px] font-mono uppercase text-[#888888]">Compliant / Gaps</div>
                  <div className="text-xs font-mono font-bold text-white">
                    <span className="text-emerald-400">{recalcFeedback.compliantCount}</span> / <span className="text-rose-400">{recalcFeedback.gapCount}</span>
                  </div>
                </div>
                <button
                  onClick={() => setRecalcFeedback(null)}
                  className="p-1 text-[#888888] hover:text-white border border-transparent hover:border-[#444444] cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* High-Density Controls Table */}
          <div className="border border-[#262626] bg-[#141414] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-[#262626] bg-black text-[10px] uppercase tracking-wider font-bold text-[#888888]">
                    <th className="py-3.5 px-4 w-28">Control ID</th>
                    <th className="py-3.5 px-4">Title & Description</th>
                    <th className="py-3.5 px-4">Domain</th>
                    <th className="py-3.5 px-4 text-center">Inherent Risk</th>
                    <th className="py-3.5 px-4 text-center">CEF %</th>
                    <th className="py-3.5 px-4 text-center">Residual Risk</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {filteredControls.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-[#777777]">
                        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-[#555555]" />
                        <div className="text-sm font-syne font-bold uppercase text-white">
                          No Controls Match Active Query
                        </div>
                        <p className="text-xs font-mono mt-1 text-[#666666]">
                          Clear search terms or reset domain filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredControls.map((c) => {
                      const isCritical = c.residualRisk >= 15;
                      const isHigh = c.residualRisk >= 10 && c.residualRisk < 15;
                      const isSelected = activeDrawerControlId === c.controlId;

                      return (
                        <tr
                          key={c.controlId}
                          onClick={() => {
                            setActiveDrawerControlId(c.controlId);
                            if (onSelectControl) onSelectControl(c.controlId);
                          }}
                          className={`hover:bg-[#1a1a1a] transition cursor-pointer ${
                            isSelected ? 'bg-[#1a1a10] border-l-2 border-l-[#f5ff00]' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-bold text-[#f5ff00]">
                            {c.controlId}
                          </td>
                          <td className="py-3.5 px-4 font-medium max-w-md">
                            <div className="text-white font-sans font-semibold text-xs truncate">
                              {c.title}
                            </div>
                            <div className="text-[10px] text-[#777777] font-mono truncate mt-0.5">
                              {c.familyName} ({c.family})
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-[11px] text-[#888888] whitespace-nowrap">
                            {c.domain}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-white">
                            {c.inherentRisk}
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-[#f5ff00]">
                            {(c.calculatedCEF * 100).toFixed(0)}%
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 text-xs font-bold border ${
                                isCritical
                                  ? 'border-red-600 text-red-400 bg-red-950/40'
                                  : isHigh
                                  ? 'border-orange-600 text-orange-400 bg-orange-950/40'
                                  : 'border-emerald-700 text-emerald-400 bg-emerald-950/30'
                              }`}
                            >
                              {c.residualRisk.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`text-[9px] uppercase font-bold px-2 py-0.5 border ${
                                c.status === 'COMPLIANT'
                                  ? 'border-emerald-600 text-emerald-400 bg-emerald-950/40'
                                  : c.status === 'SATISFACTORY'
                                  ? 'border-[#f5ff00] text-[#f5ff00] bg-[#1a1a00]'
                                  : c.status === 'NEEDS_ATTENTION'
                                  ? 'border-orange-600 text-orange-400 bg-orange-950/40'
                                  : 'border-red-600 text-red-400 bg-red-950/40'
                              }`}
                            >
                              {c.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDrawerControlId(c.controlId);
                              }}
                              className="px-3 py-1 bg-[#222222] border border-[#333333] text-white hover:border-[#f5ff00] hover:text-[#f5ff00] text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                            >
                              Calibrate &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Stats */}
            <div className="p-3 bg-black border-t border-[#262626] flex items-center justify-between text-xs text-[#777777] font-mono">
              <span>Showing {filteredControls.length} of {controls.length} controls</span>
              <span>NIST SP 800-53 Rev. 5 Baseline Catalog</span>
            </div>
          </div>
        </div>
      )}

      {/* Contextual Slide-Out Drawer for Calibrating Controls */}
      <ControlDetailDrawer
        control={activeDrawerControl}
        isOpen={Boolean(activeDrawerControlId)}
        onClose={() => {
          setActiveDrawerControlId(null);
          if (onSelectControl) onSelectControl(null);
        }}
        onUpdateControl={onUpdateControl}
        onOpenUploadModal={onOpenUploadModal}
        onOpenAICopilotForControl={onOpenAICopilotForControl}
        onNavigateNext={handleNextControl}
        onNavigatePrev={handlePrevControl}
        hasNext={currentDrawerIndex >= 0 && currentDrawerIndex < filteredControls.length - 1}
        hasPrev={currentDrawerIndex > 0}
        currentIndex={currentDrawerIndex >= 0 ? currentDrawerIndex : undefined}
        totalCount={filteredControls.length}
      />
    </div>
  );
};
