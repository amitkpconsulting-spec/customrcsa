import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Sparkles,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Eye,
  Server,
  Shield,
  PlusCircle,
  BookOpen,
  Activity,
  ShieldAlert,
  TrendingUp,
  FileText,
  Radio,
  Cpu,
  RefreshCw,
  History,
} from 'lucide-react';
import {
  AssessedControl,
  RCSAPayload,
  RCSADomainType,
  AISettings,
  AIExecutiveSummary,
  AIHeatmapPrediction,
  AIRiskRemediationSynthesis,
  AITrendItem,
} from '../types';
import { computeDomainSummaries, getControlRiskLevel } from '../utils/riskCalculations';
import { SECTOR_PROFILES } from '../data/sectorProfiles';
import { RCSA_DOMAIN_CONFIGS } from '../data/nistControls';
import { DomainTimelineSection } from './DomainTimelineSection';
import { VersionHistorySection } from './VersionHistorySection';
import {
  generateAISummary,
  generateAIHeatmapPrediction,
  generateAIRiskRemediationSynthesis,
  generateAITrends,
  getAIEngineLabel,
} from '../utils/aiDashboardEngine';

interface DashboardViewProps {
  assessment: RCSAPayload;
  onNavigateToStage: (stage: any) => void;
  onFilterDomainInQuestionnaire: (domain: string) => void;
  onSelectControlForReview: (controlId: string) => void;
  onOpenCreateRCSA?: () => void;
  aiSettings?: AISettings;
  onOpenSettingsModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  assessment,
  onNavigateToStage,
  onFilterDomainInQuestionnaire,
  onSelectControlForReview,
  onOpenCreateRCSA,
  aiSettings,
  onOpenSettingsModal,
}) => {
  const { controls, organizationProfile } = assessment;
  const domainSummaries = computeDomainSummaries(controls);
  const sector = SECTOR_PROFILES[organizationProfile.sector] || SECTOR_PROFILES.Technology;
  const currentDomain: RCSADomainType = assessment.rcsaDomain || organizationProfile.rcsaDomain || 'All';
  const domainConfig = RCSA_DOMAIN_CONFIGS[currentDomain];

  // Dashboard Sub-View Tabs
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'version_history'>('overview');

  // AI Feature States
  const [aiSummary, setAiSummary] = useState<AIExecutiveSummary | null>(null);
  const [aiHeatmap, setAiHeatmap] = useState<AIHeatmapPrediction | null>(null);
  const [aiRisk, setAiRisk] = useState<AIRiskRemediationSynthesis | null>(null);
  const [aiTrends, setAiTrends] = useState<AITrendItem[]>([]);
  const [activeAIFeature, setActiveAIFeature] = useState<'summary' | 'heatmap' | 'remediation' | 'trends' | 'writeups'>('summary');
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadAIFeatures() {
      setIsLoadingAI(true);
      try {
        const [sum, heat, risk, trends] = await Promise.all([
          generateAISummary(assessment, aiSettings),
          generateAIHeatmapPrediction(assessment, aiSettings),
          generateAIRiskRemediationSynthesis(assessment, aiSettings),
          generateAITrends(assessment, aiSettings),
        ]);
        if (isMounted) {
          setAiSummary(sum);
          setAiHeatmap(heat);
          setAiRisk(risk);
          setAiTrends(trends);
        }
      } catch (e) {
        console.error('Error fetching AI dashboard features:', e);
      } finally {
        if (isMounted) setIsLoadingAI(false);
      }
    }
    loadAIFeatures();
    return () => {
      isMounted = false;
    };
  }, [assessment.assessmentId, aiSettings?.mode, aiSettings?.isAirGappedMode]);

  // Aggregate Metrics
  const totalControls = controls.length;
  const assessedControls = controls.filter((c) => c.status !== 'NOT_EVALUATED').length;
  const avgInherent = Number((controls.reduce((s, c) => s + c.inherentRisk, 0) / totalControls).toFixed(1));
  const avgResidual = Number((controls.reduce((s, c) => s + c.residualRisk, 0) / totalControls).toFixed(1));
  const avgCEF = Number((controls.reduce((s, c) => s + c.calculatedCEF, 0) / totalControls).toFixed(2));
  const completionPct = Math.round((assessedControls / totalControls) * 100);

  // Top Deficiencies (Highest Residual Risk)
  const topDeficiencies = [...controls]
    .sort((a, b) => b.residualRisk - a.residualRisk)
    .slice(0, 6);

  return (
    <div className="space-y-8 pb-12 text-white">
      {/* Industrial Domain Quick Creation Banner */}
      <div className="border border-[#262626] bg-[#141414] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 border border-[#333333] bg-black text-[#888888]">
              DOMAIN FRAMEWORK ENGINE
            </span>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00]">
              ACTIVE: {domainConfig?.title?.toUpperCase() || 'CUSTOM RCSA'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-syne font-bold uppercase tracking-tight text-white">
            Domain-Specific RCSA Framework Engine
          </h2>
          <p className="text-xs text-[#888888] max-w-2xl font-sans">
            Tailor assessment criteria across <strong className="text-white font-semibold">Privacy RCSA</strong> (NIST Privacy / PII), <strong className="text-white font-semibold">Information Security RCSA</strong> (ISMS / SCRM), or <strong className="text-white font-semibold">Cyber Security RCSA</strong> (Zero Trust / Threat Defense).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigateToStage('ai_dashboard')}
            className="px-4 py-2.5 border border-[#333333] bg-[#1f1f1f] text-white hover:border-[#f5ff00] hover:text-[#f5ff00] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#f5ff00]" />
            <span>AI Dashboard</span>
          </button>

          <button
            onClick={() => onNavigateToStage('reports')}
            className="px-4 py-2.5 border border-[#333333] bg-[#1f1f1f] text-white hover:border-[#f5ff00] hover:text-[#f5ff00] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reports</span>
          </button>

          <button
            onClick={onOpenCreateRCSA || (() => onNavigateToStage('create_rcsa'))}
            className="px-5 py-2.5 bg-[#f5ff00] text-black hover:bg-yellow-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition shrink-0 shadow-[0_0_10px_rgba(245,255,0,0.2)]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Create RCSA Section</span>
          </button>
        </div>
      </div>

      {/* Primary Dashboard Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#262626] bg-[#0c0c0c] p-1.5">
        <button
          onClick={() => setDashboardTab('overview')}
          className={`px-5 py-2.5 font-mono text-xs uppercase font-bold tracking-wider flex items-center gap-2 transition border ${
            dashboardTab === 'overview'
              ? 'border-[#f5ff00] bg-[#181808] text-[#f5ff00]'
              : 'border-transparent text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Risk Posture & Intelligence</span>
        </button>

        <button
          onClick={() => setDashboardTab('version_history')}
          className={`px-5 py-2.5 font-mono text-xs uppercase font-bold tracking-wider flex items-center gap-2 transition border ${
            dashboardTab === 'version_history'
              ? 'border-[#f5ff00] bg-[#181808] text-[#f5ff00]'
              : 'border-transparent text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <History className="w-4 h-4 text-[#f5ff00]" />
          <span>Version History & Trends</span>
          <span className="px-1.5 py-0.2 bg-[#222222] border border-[#333333] text-[10px] text-[#aaaaaa]">
            Diff Engine
          </span>
        </button>
      </div>

      {/* Render Version History Tab if selected */}
      {dashboardTab === 'version_history' ? (
        <VersionHistorySection
          assessment={assessment}
          onNavigateToStage={onNavigateToStage}
        />
      ) : (
        <>
          {/* ========================================================= */}
          {/* AI INTEGRATED INTELLIGENCE SUITE IN DASHBOARD             */}
          {/* ========================================================= */}
      <div className="border border-[#262626] bg-[#141414] overflow-hidden">
        {/* Header Bar */}
        <div className="bg-[#0f0f0f] border-b border-[#262626] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-[#f5ff00] text-black flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                AI Integrated Intelligence
              </span>
              <span className="text-[10px] font-mono text-[#888888] flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-[#34d399] animate-pulse" />
                {getAIEngineLabel(aiSettings)}
              </span>
            </div>
            <h3 className="text-lg font-syne font-bold uppercase tracking-tight text-white">
              AI Risk Insights & Predictive Analysis Engine
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToStage('ai_dashboard')}
              className="px-3.5 py-1.5 bg-[#222222] border border-[#333333] hover:border-[#f5ff00] hover:text-[#f5ff00] text-white text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
            >
              <span>FULL AI DASHBOARD</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Feature Selector Tabs inside Dashboard */}
        <div className="border-b border-[#222222] bg-black px-4 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'summary', label: '1. Executive Summary', icon: <Sparkles className="w-3 h-3" /> },
            { id: 'heatmap', label: '2. Heatmap Prediction', icon: <Activity className="w-3 h-3" /> },
            { id: 'remediation', label: '3. Risk & Remediation', icon: <ShieldAlert className="w-3 h-3" /> },
            { id: 'trends', label: '4. Latest Trends', icon: <TrendingUp className="w-3 h-3" /> },
            { id: 'writeups', label: '5. Audit Writeups', icon: <FileText className="w-3 h-3" /> },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveAIFeature(f.id as any)}
              className={`py-3 px-3 text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 transition border-b-2 -mb-px whitespace-nowrap ${
                activeAIFeature === f.id
                  ? 'border-[#f5ff00] text-[#f5ff00] bg-[#161616] font-bold'
                  : 'border-transparent text-[#777777] hover:text-white'
              }`}
            >
              {f.icon}
              <span>{f.label}</span>
            </button>
          ))}
        </div>

        {/* Feature Content Panel */}
        <div className="p-6 bg-[#141414]">
          {/* AI Feature 1: Summary */}
          {activeAIFeature === 'summary' && aiSummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-3 p-5 bg-black border border-[#2a2a2a] flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#777777]">
                      POSTURE GRADE
                    </span>
                    <div className="text-5xl font-syne font-bold text-[#f5ff00] mt-1">
                      {aiSummary.postureGrade}
                    </div>
                  </div>
                  <div className="pt-3 border-t border-[#222222]">
                    <div className="text-xs font-mono font-bold text-[#34d399]">
                      AUDIT READINESS: {aiSummary.auditReadinessScore}%
                    </div>
                    <div className="text-[10px] font-mono text-[#666666] mt-0.5">
                      {sector.name} FRAMEWORK
                    </div>
                  </div>
                </div>

                <div className="md:col-span-9 space-y-3 bg-[#181818] p-5 border border-[#262626]">
                  <div className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#888888]">
                    AI EXECUTIVE SYNOPSIS
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white leading-snug">
                    "{aiSummary.headline}"
                  </h4>
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-[#f5ff00]">
                      TOP BOARD TALKING POINTS:
                    </span>
                    <ul className="space-y-1.5 text-xs text-[#cccccc]">
                      {aiSummary.boardTalkingPoints.slice(0, 2).map((pt, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-[#f5ff00] text-black mt-0.5 shrink-0">
                            0{i + 1}
                          </span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Feature 2: Heatmap Prediction */}
          {activeAIFeature === 'heatmap' && aiHeatmap && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 border border-[#2a2a2a] bg-black">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#777777]">RISK VELOCITY</span>
                  <div className="text-2xl font-syne font-bold text-red-500 mt-1">
                    {aiHeatmap.riskVelocityScore}
                  </div>
                </div>
                <div className="p-4 border border-[#2a2a2a] bg-black">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#777777]">BASELINE CRITICALS</span>
                  <div className="text-2xl font-syne font-bold text-white mt-1">
                    {aiHeatmap.baselineCriticalCount}
                  </div>
                </div>
                <div className="p-4 border border-[#2a2a2a] bg-black">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#777777]">30-DAY FORECAST</span>
                  <div className="text-2xl font-syne font-bold text-orange-400 mt-1">
                    {aiHeatmap.projectedCriticalCount30d}
                  </div>
                </div>
                <div className="p-4 border border-[#2a2a2a] bg-black">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#777777]">90-DAY TRAJECTORY</span>
                  <div className="text-2xl font-syne font-bold text-red-400 mt-1">
                    {aiHeatmap.projectedCriticalCount90d}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-black border border-[#262626] text-xs font-mono text-[#888888]">
                <strong className="text-[#f5ff00] font-semibold">VOLATILE CONTROL WATCHLIST:</strong>{' '}
                {aiHeatmap.volatileControls.map((c) => `${c.controlId} (${c.controlTitle})`).join(' • ')}
              </div>
            </div>
          )}

          {/* AI Feature 3: Risk & Remediation */}
          {activeAIFeature === 'remediation' && aiRisk && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  AI PRIORITIZED REMEDIATION BACKLOG ({aiRisk.highestImpactActions.length} ACTIONS)
                </span>
                <span className="text-xs font-mono font-bold text-[#34d399]">
                  PROJECTED RISK REDUCTION: ↓ {aiRisk.overallProjectedResidualReduction}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiRisk.highestImpactActions.slice(0, 2).map((item) => (
                  <div key={item.id} className="p-4 border border-[#2a2a2a] bg-black space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-red-600 text-white">
                        {item.priority}
                      </span>
                      <span className="text-[10px] font-mono text-[#888888]">{item.estimatedCostEffort}</span>
                    </div>
                    <div className="font-bold text-sm text-white">{item.title}</div>
                    <p className="text-xs text-[#888888]">{item.recommendedRemediation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Feature 4: Latest Trends */}
          {activeAIFeature === 'trends' && (
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                HORIZON REGULATORY & EMERGING THREAT RADAR
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiTrends.slice(0, 2).map((trend) => (
                  <div key={trend.id} className="p-4 border border-[#2a2a2a] bg-black space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 bg-purple-900/60 text-purple-300 border border-purple-700">
                        {trend.category}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#f5ff00]">RELEVANCE: {trend.relevanceScore}%</span>
                    </div>
                    <h5 className="font-bold text-xs text-white">{trend.title}</h5>
                    <p className="text-[11px] text-[#888888]">{trend.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Feature 5: Writeups Launcher */}
          {activeAIFeature === 'writeups' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-black border border-[#262626]">
              <div className="space-y-1">
                <h4 className="font-syne font-bold uppercase text-base text-white">
                  AI Governance & Audit Memorandum Generator
                </h4>
                <p className="text-xs text-[#888888]">
                  Generate instant Board Memos, CISO Defense Statements, Customer Trust Letters, and Regulatory Statements of Controls.
                </p>
              </div>
              <button
                onClick={() => onNavigateToStage('ai_dashboard')}
                className="px-4 py-2.5 bg-[#f5ff00] text-black hover:bg-yellow-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Launch Writeups Builder</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Split Hero Section: Module Focus & Core Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#262626] bg-[#141414]">
        {/* Left Column: Active Module & Progress */}
        <div className="lg:col-span-4 p-7 border-b lg:border-b-0 lg:border-r border-[#262626] flex flex-col justify-between space-y-6 bg-black">
          <div className="space-y-4">
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-[#666666] mb-1">
                ACTIVE ASSESSMENT MODULE
              </h3>
              <div className="text-2xl font-syne font-bold uppercase text-white leading-tight">
                {assessment.assessmentName}
              </div>
              <p className="text-xs mt-2 leading-relaxed text-[#888888]">
                {sector.mandatoryOverlays} Target baseline: <span className="font-semibold text-white">{organizationProfile.complianceTarget}</span>.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#222222]">
              <div className="w-2 h-2 rounded-full bg-[#f5ff00] animate-pulse"></div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#aaaaaa]">
                PHASE: AUDIT & REMEDIATION ({assessment.auditSignoff.status})
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-[#262626]">
            <div className="flex justify-between items-baseline">
              <div className="text-4xl font-syne font-extrabold text-[#f5ff00]">{completionPct}%</div>
              <span className="text-xs font-mono text-[#888888]">{assessedControls}/{totalControls} CONTROLS</span>
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest font-bold mt-1 text-[#666666]">
              WORKFLOW COMPLETION
            </div>
            <div className="w-full h-1.5 bg-[#222222] mt-3 overflow-hidden">
              <div
                className="h-full bg-[#f5ff00] transition-all duration-500"
                style={{ width: `${completionPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Right Column: Quantitative Risk Scores */}
        <div className="lg:col-span-8 p-7 flex flex-col justify-between space-y-6 bg-[#141414]">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-[#666666]">
                EXECUTIVE RISK QUANTIFICATION ({currentDomain.toUpperCase()} DOMAIN)
              </h3>
              <button
                onClick={() => onNavigateToStage('questionnaire')}
                className="px-3 py-1 bg-[#222222] border border-[#333333] hover:border-[#f5ff00] hover:text-[#f5ff00] font-mono text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 text-white"
              >
                <span>EVALUATE QUESTIONNAIRE</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Metric Score Rows */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-black border border-[#262626]">
                <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#777777]">
                  INHERENT RISK (IR)
                </div>
                <div className="text-3xl sm:text-4xl font-syne font-bold mt-2 text-white">
                  {avgInherent}
                </div>
                <div className="text-[10px] font-mono mt-1 text-[#555555]">
                  SCALE 1.0 – 25.0 (I × L)
                </div>
              </div>

              <div className="p-5 bg-black border border-[#262626]">
                <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#777777]">
                  CONTROL EFFECTIVENESS
                </div>
                <div className="text-3xl sm:text-4xl font-syne font-bold mt-2 text-[#f5ff00]">
                  {(avgCEF * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] font-mono mt-1 text-[#555555]">
                  CEF: {avgCEF.toFixed(2)} (De 40% + Oe 60%)
                </div>
              </div>

              <div className="p-5 bg-black border border-[#262626]">
                <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#777777]">
                  RESIDUAL RISK (RR)
                </div>
                <div className="text-3xl sm:text-4xl font-syne font-bold mt-2 text-white">
                  {avgResidual}
                </div>
                <div className="text-[10px] font-mono mt-1 text-[#34d399] font-bold">
                  ↓ {Math.round(((avgInherent - avgResidual) / avgInherent) * 100)}% NET REDUCTION
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#222222] flex flex-wrap items-center justify-between text-xs text-[#777777] font-mono">
            <span>FORMULA: <span className="text-[#f5ff00]">RESIDUAL RISK = IR × (1 - CEF × CONFIDENCE)</span></span>
            <span>STANDARD: NIST SP 800-53 REV. 5</span>
          </div>
        </div>
      </div>

      {/* Visual Timeline Component: Assessment Milestones & Renewal Dates */}
      <DomainTimelineSection
        currentDomain={currentDomain}
        onNavigateToStage={onNavigateToStage}
        onNavigateToControl={onSelectControlForReview}
      />

      {/* Multi-Domain Risk Posture Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#262626] pb-3">
          <h3 className="font-mono text-xs uppercase tracking-[0.3em] font-bold text-[#888888]">
            MULTI-DOMAIN RISK POSTURE
          </h3>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#555555]">
            CLICK ANY DOMAIN TO INSPECT CONTROLS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {domainSummaries.map((ds) => {
            const getIcon = () => {
              switch (ds.domain) {
                case 'Privacy':
                  return <Eye className="w-4 h-4 text-purple-400" />;
                case 'Cybersecurity':
                  return <Lock className="w-4 h-4 text-emerald-400" />;
                case 'Information Security':
                  return <Server className="w-4 h-4 text-blue-400" />;
                default:
                  return <Shield className="w-4 h-4 text-[#f5ff00]" />;
              }
            };

            return (
              <div
                key={ds.domain}
                onClick={() => onFilterDomainInQuestionnaire(ds.domain)}
                className="p-5 border border-[#262626] bg-[#141414] hover:bg-[#181818] hover:border-[#f5ff00] transition cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="p-2 border border-[#2a2a2a] bg-black">
                      {getIcon()}
                    </div>
                    <span className="font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border border-[#333333] bg-black text-[#888888]">
                      {ds.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-base font-syne font-bold uppercase mt-3 text-white group-hover:text-[#f5ff00] transition">
                    {ds.domain}
                  </h4>
                  <p className="text-[11px] text-[#666666] font-mono mt-0.5">
                    {ds.totalControls} Evaluated Controls
                  </p>
                </div>

                <div className="pt-3 border-t border-[#222222] grid grid-cols-3 text-center font-mono">
                  <div>
                    <div className="text-[9px] uppercase font-bold text-[#666666]">Inherent</div>
                    <div className="text-sm font-bold text-white">{ds.aggregateInherentRisk}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-[#666666]">CEF</div>
                    <div className="text-sm font-bold text-[#f5ff00]">{(ds.averageCEF * 100).toFixed(0)}%</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase font-bold text-[#666666]">Residual</div>
                    <div className="text-sm font-bold text-white">{ds.aggregateResidualRisk}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Source Questionnaire & Reference Engine Highlight */}
      <div className="border border-[#262626] bg-[#141414] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest font-bold bg-purple-950/70 text-purple-300 border border-purple-700">
              CSA CAIQ v4.1.0 & NIST 800-53
            </span>
            <span className="text-[10px] font-mono text-[#888888]">
              283+ Consensus Questions • 17 Cloud Domains • SSRM Model
            </span>
          </div>
          <h3 className="text-xl font-syne font-bold uppercase text-white">
            Authoritative Source Questionnaire & Control Reference Catalog
          </h3>
          <p className="text-xs text-[#888888] max-w-2xl leading-relaxed">
            Access the complete CSA Cloud Controls Matrix (CCM v4.1.0) & CAIQ v4.1.0 questionnaire inventory with step-by-step auditing examination guidelines, implementation recommendations, and cross-framework mappings (ISO 27001, CIS Controls, GDPR).
          </p>
        </div>

        <button
          onClick={() => onNavigateToStage('source_questionnaire')}
          className="px-5 py-3 bg-[#f5ff00] text-black hover:bg-yellow-300 font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition shrink-0 shadow-[0_0_12px_rgba(245,255,0,0.25)]"
        >
          <BookOpen className="w-4 h-4" />
          <span>Open Source Questionnaire</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Deficiencies Table */}
      <div className="border border-[#262626] bg-[#141414] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-4">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.3em] font-bold text-[#888888]">
              HIGH PRIORITY RISK DEFICIENCIES
            </h3>
            <p className="text-xs text-[#666666] font-mono mt-0.5">
              Ranked by residual risk impact under active sector baseline ({sector.name}).
            </p>
          </div>
          <button
            onClick={() => onNavigateToStage('remediation')}
            className="font-mono text-xs uppercase tracking-wider font-bold text-[#f5ff00] hover:underline self-start sm:self-auto"
          >
            Open Remediation Roadmap &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-[#262626] bg-black text-[10px] uppercase tracking-wider font-bold text-[#888888]">
                <th className="py-3 px-4">Control ID</th>
                <th className="py-3 px-4">Safeguard Title</th>
                <th className="py-3 px-4">Domain</th>
                <th className="py-3 px-4 text-center">Inherent</th>
                <th className="py-3 px-4 text-center">CEF</th>
                <th className="py-3 px-4 text-center">Residual</th>
                <th className="py-3 px-4">Identified Gap & Root Cause</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {topDeficiencies.map((c) => {
                const isCritical = c.residualRisk >= 15;
                const isHigh = c.residualRisk >= 10 && c.residualRisk < 15;

                return (
                  <tr key={c.controlId} className="hover:bg-[#1a1a1a] transition">
                    <td className="py-3.5 px-4 font-bold text-[#f5ff00]">
                      {c.controlId}
                    </td>
                    <td className="py-3.5 px-4 font-medium max-w-xs font-sans text-white">
                      <div className="truncate font-semibold">{c.title}</div>
                      <div className="text-[10px] text-[#666666] font-mono">{c.familyName} ({c.family})</div>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] text-[#888888]">{c.domain}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-white">
                      {c.inherentRisk}
                    </td>
                    <td className="py-3.5 px-4 text-center text-[#f5ff00]">
                      {(c.calculatedCEF * 100).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 text-xs font-bold border ${
                        isCritical
                          ? 'border-red-600 text-red-400 bg-red-950/40'
                          : isHigh
                          ? 'border-orange-600 text-orange-400 bg-orange-950/40'
                          : 'border-[#333333] text-white bg-black'
                      }`}>
                        {c.residualRisk.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-sm font-sans">
                      <p className="truncate text-xs text-[#888888]" title={c.gapsIdentified || c.implementationEvidence}>
                        {c.gapsIdentified || c.implementationEvidence || 'Standard operational controls in effect.'}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectControlForReview(c.controlId)}
                        className="px-3 py-1 bg-[#222222] border border-[#333333] text-white hover:border-[#f5ff00] hover:text-[#f5ff00] text-[10px] font-bold uppercase tracking-wider transition"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};
