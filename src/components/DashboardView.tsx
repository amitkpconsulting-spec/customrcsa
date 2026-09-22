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
  LineChart as LineChartIcon,
  Target,
  Sliders,
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
  SectorType,
} from '../types';
import { computeDomainSummaries } from '../utils/riskCalculations';
import { SECTOR_PROFILES } from '../data/sectorProfiles';
import { RCSA_DOMAIN_CONFIGS } from '../data/nistControls';
import { DomainTimelineSection } from './DomainTimelineSection';
import { VersionHistorySection } from './VersionHistorySection';
import { SectorGapRadarChart } from './SectorGapRadarChart';
import { HeatmapMatrixView } from './HeatmapMatrixView';
import { ComplianceTimelineView } from './ComplianceTimelineView';
import { ExecutiveAnalyticsSuite } from './ExecutiveAnalyticsSuite';
import { RiskManagementMetricsCard } from './RiskManagementMetricsCard';
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
  onOpenAICopilot?: () => void;
  onUpdateSector?: (sector: SectorType) => void;
  onSaveSnapshot?: (versionTag: string, notes: string, author: string) => void;
  onRevertToVersion?: (versionId: string) => void;
  onDeleteSnapshot?: (versionId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  assessment,
  onNavigateToStage,
  onFilterDomainInQuestionnaire,
  onSelectControlForReview,
  onOpenCreateRCSA,
  aiSettings,
  onOpenSettingsModal,
  onOpenAICopilot,
  onUpdateSector,
  onSaveSnapshot,
  onRevertToVersion,
  onDeleteSnapshot,
}) => {
  const { controls, organizationProfile } = assessment;
  const domainSummaries = computeDomainSummaries(controls);
  const sector = SECTOR_PROFILES[organizationProfile.sector] || SECTOR_PROFILES.Technology;
  const currentDomain: RCSADomainType = assessment.rcsaDomain || organizationProfile.rcsaDomain || 'All';
  const domainConfig = RCSA_DOMAIN_CONFIGS[currentDomain];

  // Consolidated Executive Sub-Tabs: 'overview' | 'charts' | 'heatmap' | 'gap_analysis' | 'timeline' | 'version_history'
  const [dashboardTab, setDashboardTab] = useState<
    'overview' | 'charts' | 'heatmap' | 'gap_analysis' | 'timeline' | 'version_history'
  >('overview');

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
  const avgInherent = Number((controls.reduce((s, c) => s + c.inherentRisk, 0) / (totalControls || 1)).toFixed(1));
  const avgResidual = Number((controls.reduce((s, c) => s + c.residualRisk, 0) / (totalControls || 1)).toFixed(1));
  const avgCEF = Number((controls.reduce((s, c) => s + c.calculatedCEF, 0) / (totalControls || 1)).toFixed(2));
  const completionPct = Math.round((assessedControls / (totalControls || 1)) * 100);

  // Top Deficiencies
  const topDeficiencies = [...controls]
    .sort((a, b) => b.residualRisk - a.residualRisk)
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Executive Workspace Banner */}
      <div className="border border-[#262626] bg-[#141414] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 border border-[#333333] bg-black text-[#888888]">
              EXECUTIVE WORKSPACE
            </span>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00]">
              {organizationProfile.sector.toUpperCase()} SECTOR
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-syne font-bold uppercase tracking-tight text-white">
            Executive Risk & Governance Posture
          </h2>
          <p className="text-xs text-[#888888] max-w-2xl font-sans">
            Unified strategic overview across NIST SP 800-53, CSA Cloud Controls Matrix, quantitative CEF calibration, and predictive trajectory.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigateToStage('presentation')}
            className="px-4 py-2 border border-[#f5ff00] bg-[#1c1c08] text-[#f5ff00] hover:bg-[#f5ff00] hover:text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition shrink-0 shadow-[0_0_10px_rgba(245,255,0,0.2)] cursor-pointer"
            title="Launch Full Screen Presenter Mode"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>⛶ Presenter View</span>
          </button>

          <button
            onClick={onOpenCreateRCSA || (() => onNavigateToStage('create_rcsa'))}
            className="px-4 py-2 bg-[#f5ff00] text-black hover:bg-yellow-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition shrink-0 shadow-[0_0_10px_rgba(245,255,0,0.2)] cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ New Assessment</span>
          </button>
        </div>
      </div>

      {/* Primary Executive Workspace Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#262626] bg-[#0c0c0c] p-1.5 overflow-x-auto no-scrollbar font-mono text-xs">
        <button
          onClick={() => setDashboardTab('overview')}
          className={`px-4 py-2 uppercase font-bold tracking-wider flex items-center gap-2 transition cursor-pointer border ${
            dashboardTab === 'overview'
              ? 'border-[#f5ff00] bg-[#181808] text-[#f5ff00]'
              : 'border-transparent text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>1. Overview & Posture</span>
        </button>

        <button
          onClick={() => setDashboardTab('charts')}
          className={`px-4 py-2 uppercase font-bold tracking-wider flex items-center gap-2 transition cursor-pointer border ${
            dashboardTab === 'charts'
              ? 'border-[#f5ff00] bg-[#181808] text-[#f5ff00]'
              : 'border-transparent text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <LineChartIcon className="w-3.5 h-3.5 text-[#f5ff00]" />
          <span>2. Executive Charts (4 Core)</span>
        </button>

        <button
          onClick={() => setDashboardTab('heatmap')}
          className={`px-4 py-2 uppercase font-bold tracking-wider flex items-center gap-2 transition cursor-pointer border ${
            dashboardTab === 'heatmap'
              ? 'border-[#f5ff00] bg-[#181808] text-[#f5ff00]'
              : 'border-transparent text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>3. Interactive 5×5 Matrix</span>
        </button>

        <button
          onClick={() => setDashboardTab('gap_analysis')}
          className={`px-4 py-2 uppercase font-bold tracking-wider flex items-center gap-2 transition cursor-pointer border ${
            dashboardTab === 'gap_analysis'
              ? 'border-[#38bdf8] bg-[#0c1a24] text-[#38bdf8]'
              : 'border-transparent text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <Target className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>4. Sector Benchmark Radar</span>
        </button>

        <button
          onClick={() => setDashboardTab('timeline')}
          className={`px-4 py-2 uppercase font-bold tracking-wider flex items-center gap-2 transition cursor-pointer border ${
            dashboardTab === 'timeline'
              ? 'border-[#38bdf8] bg-[#0c1a24] text-[#38bdf8]'
              : 'border-transparent text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>5. Trajectory & Milestones</span>
        </button>

        <button
          onClick={() => setDashboardTab('version_history')}
          className={`px-4 py-2 uppercase font-bold tracking-wider flex items-center gap-2 transition cursor-pointer border ${
            dashboardTab === 'version_history'
              ? 'border-[#f5ff00] bg-[#181808] text-[#f5ff00]'
              : 'border-transparent text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <History className="w-3.5 h-3.5 text-[#f5ff00]" />
          <span>6. Version History & Rollback</span>
          <span className={`text-[10px] px-1.5 py-0.2 font-mono font-bold ${
            dashboardTab === 'version_history' ? 'bg-[#f5ff00] text-black' : 'bg-[#222222] text-[#888888]'
          }`}>
            {assessment.versionHistory?.length || 1}
          </span>
        </button>
      </div>

      {/* RENDER VIEW: EXECUTIVE CHARTS (4 CORE) */}
      {dashboardTab === 'charts' && (
        <ExecutiveAnalyticsSuite
          assessment={assessment}
          onSelectControl={onSelectControlForReview}
          onNavigateToStage={onNavigateToStage}
        />
      )}

      {/* RENDER VIEW: 5x5 HEATMAP */}
      {dashboardTab === 'heatmap' && (
        <HeatmapMatrixView
          controls={controls}
          onSelectControl={onSelectControlForReview}
          currentSector={organizationProfile.sector}
          onUpdateSector={onUpdateSector}
        />
      )}

      {/* RENDER VIEW: SECTOR GAP ANALYSIS */}
      {dashboardTab === 'gap_analysis' && (
        <div className="space-y-6">
          <SectorGapRadarChart
            assessment={assessment}
            onFilterDomainInQuestionnaire={onFilterDomainInQuestionnaire}
            onNavigateToStage={onNavigateToStage}
          />
        </div>
      )}

      {/* RENDER VIEW: TRAJECTORY & COMPLIANCE TIMELINE */}
      {dashboardTab === 'timeline' && (
        <div className="space-y-6">
          <DomainTimelineSection
            currentDomain={currentDomain}
            onNavigateToStage={onNavigateToStage}
            onNavigateToControl={onSelectControlForReview}
          />
          <ComplianceTimelineView
            assessment={assessment}
            onNavigateToStage={onNavigateToStage}
            onSelectControlForReview={onSelectControlForReview}
          />
        </div>
      )}

      {/* RENDER VIEW: VERSION HISTORY */}
      {dashboardTab === 'version_history' && (
        <VersionHistorySection
          assessment={assessment}
          onNavigateToStage={onNavigateToStage}
          onSaveSnapshot={onSaveSnapshot}
          onRevertToVersion={onRevertToVersion}
          onDeleteSnapshot={onDeleteSnapshot}
        />
      )}

      {/* RENDER VIEW: OVERVIEW & POSTURE */}
      {dashboardTab === 'overview' && (
        <div className="space-y-6">
          {/* Split Hero Section: Module Focus & Core Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#262626] bg-[#141414]">
            {/* Left Column: Active Module & Progress */}
            <div className="lg:col-span-4 p-6 border-b lg:border-b-0 lg:border-r border-[#262626] flex flex-col justify-between space-y-6 bg-black">
              <div className="space-y-3">
                <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-[#666666]">
                  ACTIVE ASSESSMENT
                </h3>
                <div className="text-xl sm:text-2xl font-syne font-bold uppercase text-white leading-tight">
                  {assessment.assessmentName}
                </div>
                <p className="text-xs leading-relaxed text-[#888888]">
                  Target Baseline: <span className="font-semibold text-white">{organizationProfile.complianceTarget}</span> ({sector.name}).
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-[#222222]">
                  <div className="w-2 h-2 rounded-full bg-[#f5ff00] animate-pulse"></div>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#aaaaaa]">
                    STATUS: {assessment.auditSignoff.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#262626]">
                <div className="flex justify-between items-baseline">
                  <div className="text-3xl font-syne font-extrabold text-[#f5ff00]">{completionPct}%</div>
                  <span className="text-xs font-mono text-[#888888]">{assessedControls}/{totalControls} CONTROLS</span>
                </div>
                <div className="w-full h-1.5 bg-[#222222] mt-2 overflow-hidden">
                  <div
                    className="h-full bg-[#f5ff00] transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Right Column: Quantitative Risk Scores */}
            <div className="lg:col-span-8 p-6 flex flex-col justify-between space-y-6 bg-[#141414]">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold text-[#666666]">
                    EXECUTIVE RISK QUANTIFICATION ({currentDomain.toUpperCase()})
                  </h3>
                  <button
                    onClick={() => onNavigateToStage('assessment_workflow')}
                    className="px-3 py-1 bg-[#222222] border border-[#333333] hover:border-[#f5ff00] hover:text-[#f5ff00] font-mono text-[10px] font-bold uppercase tracking-wider transition flex items-center gap-1.5 text-white cursor-pointer"
                  >
                    <span>OPEN ASSESSMENT STUDIO</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-black border border-[#262626]">
                    <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#777777]">
                      INHERENT RISK (IR)
                    </div>
                    <div className="text-3xl font-syne font-bold mt-1.5 text-white">
                      {avgInherent}
                    </div>
                    <div className="text-[10px] font-mono mt-1 text-[#555555]">
                      SCALE 1.0 – 25.0 (I × L)
                    </div>
                  </div>

                  <div className="p-4 bg-black border border-[#262626]">
                    <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#777777]">
                      CONTROL EFFECTIVENESS
                    </div>
                    <div className="text-3xl font-syne font-bold mt-1.5 text-[#f5ff00]">
                      {(avgCEF * 100).toFixed(0)}%
                    </div>
                    <div className="text-[10px] font-mono mt-1 text-[#555555]">
                      CEF: {avgCEF.toFixed(2)} (De 40% + Oe 60%)
                    </div>
                  </div>

                  <div className="p-4 bg-black border border-[#262626]">
                    <div className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#777777]">
                      RESIDUAL RISK (RR)
                    </div>
                    <div className="text-3xl font-syne font-bold mt-1.5 text-white">
                      {avgResidual}
                    </div>
                    <div className="text-[10px] font-mono mt-1 text-[#34d399] font-bold">
                      ↓ {Math.round(((avgInherent - avgResidual) / (avgInherent || 1)) * 100)}% NET REDUCTION
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#222222] flex flex-wrap items-center justify-between text-xs text-[#777777] font-mono">
                <span>FORMULA: <span className="text-[#f5ff00]">RR = IR × (1 - CEF × CONFIDENCE)</span></span>
                <span>STANDARD: NIST SP 800-53 REV. 5</span>
              </div>
            </div>
          </div>

          {/* Risk Management Metrics Card */}
          <RiskManagementMetricsCard
            assessment={assessment}
            onNavigateToStage={onNavigateToStage}
            onSelectControlForReview={onSelectControlForReview}
            onFilterDomainInQuestionnaire={onFilterDomainInQuestionnaire}
          />

          {/* AI Synopsis Banner */}
          {aiSummary && (
            <div className="border border-[#262626] bg-[#141414] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-[#f5ff00] text-black flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    AI Executive Synopsis
                  </span>
                  <span className="text-[10px] font-mono text-[#888888]">
                    Audit Readiness Score: <strong className="text-emerald-400">{aiSummary.auditReadinessScore}%</strong>
                  </span>
                </div>
                <div className="text-xs font-mono font-bold text-[#f5ff00]">
                  GRADE: {aiSummary.postureGrade}
                </div>
              </div>

              <h4 className="text-base font-bold text-white leading-snug">
                "{aiSummary.headline}"
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 text-xs text-[#cccccc]">
                {aiSummary.boardTalkingPoints.slice(0, 2).map((pt, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-black border border-[#222222]">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-[#f5ff00] text-black mt-0.5 shrink-0">
                      0{i + 1}
                    </span>
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4 Core Executive Charts Suite Embedded */}
          <div className="pt-2">
            <ExecutiveAnalyticsSuite
              assessment={assessment}
              onSelectControl={onSelectControlForReview}
              onNavigateToStage={onNavigateToStage}
            />
          </div>

          {/* Multi-Domain Risk Posture Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#262626] pb-2">
              <h3 className="font-mono text-xs uppercase tracking-[0.3em] font-bold text-[#888888]">
                MULTI-DOMAIN RISK POSTURE
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#555555]">
                CLICK DOMAIN TO FILTER IN STUDIO
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
                    className="p-4 border border-[#262626] bg-[#141414] hover:bg-[#181818] hover:border-[#f5ff00] transition cursor-pointer flex flex-col justify-between space-y-3 group"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="p-1.5 border border-[#2a2a2a] bg-black">
                          {getIcon()}
                        </div>
                        <span className="font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border border-[#333333] bg-black text-[#888888]">
                          {ds.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="text-sm font-syne font-bold uppercase mt-2.5 text-white group-hover:text-[#f5ff00] transition">
                        {ds.domain}
                      </h4>
                      <p className="text-[10px] text-[#666666] font-mono mt-0.5">
                        {ds.totalControls} Evaluated Controls
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[#222222] grid grid-cols-3 text-center font-mono">
                      <div>
                        <div className="text-[8px] uppercase font-bold text-[#666666]">Inherent</div>
                        <div className="text-xs font-bold text-white">{ds.aggregateInherentRisk}</div>
                      </div>
                      <div>
                        <div className="text-[8px] uppercase font-bold text-[#666666]">CEF</div>
                        <div className="text-xs font-bold text-[#f5ff00]">{(ds.averageCEF * 100).toFixed(0)}%</div>
                      </div>
                      <div>
                        <div className="text-[8px] uppercase font-bold text-[#666666]">Residual</div>
                        <div className="text-xs font-bold text-white">{ds.aggregateResidualRisk}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* High Priority Deficiencies Watchlist */}
          <div className="border border-[#262626] bg-[#141414] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
              <div>
                <h3 className="font-mono text-xs uppercase tracking-[0.3em] font-bold text-[#888888]">
                  HIGH PRIORITY RISK DEFICIENCIES
                </h3>
                <p className="text-[11px] text-[#666666] font-mono mt-0.5">
                  Ranked by highest residual risk impact under {sector.name} profile.
                </p>
              </div>
              <button
                onClick={() => onNavigateToStage('assessment_workflow')}
                className="font-mono text-xs uppercase tracking-wider font-bold text-[#f5ff00] hover:underline self-start sm:self-auto cursor-pointer"
              >
                Inspect All in Studio &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-[#262626] bg-black text-[10px] uppercase tracking-wider font-bold text-[#888888]">
                    <th className="py-2.5 px-3">Control ID</th>
                    <th className="py-2.5 px-3">Safeguard Title</th>
                    <th className="py-2.5 px-3">Domain</th>
                    <th className="py-2.5 px-3 text-center">Inherent</th>
                    <th className="py-2.5 px-3 text-center">CEF</th>
                    <th className="py-2.5 px-3 text-center">Residual</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  {topDeficiencies.map((c) => {
                    const isCritical = c.residualRisk >= 15;
                    const isHigh = c.residualRisk >= 10 && c.residualRisk < 15;

                    return (
                      <tr key={c.controlId} className="hover:bg-[#1a1a1a] transition">
                        <td className="py-3 px-3 font-bold text-[#f5ff00]">
                          {c.controlId}
                        </td>
                        <td className="py-3 px-3 font-medium max-w-xs font-sans text-white">
                          <div className="truncate font-semibold text-xs">{c.title}</div>
                        </td>
                        <td className="py-3 px-3 text-[11px] text-[#888888]">{c.domain}</td>
                        <td className="py-3 px-3 text-center font-bold text-white">
                          {c.inherentRisk}
                        </td>
                        <td className="py-3 px-3 text-center text-[#f5ff00]">
                          {(c.calculatedCEF * 100).toFixed(0)}%
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-bold border ${
                              isCritical
                                ? 'border-red-600 text-red-400 bg-red-950/40'
                                : isHigh
                                ? 'border-orange-600 text-orange-400 bg-orange-950/40'
                                : 'border-[#333333] text-white bg-black'
                            }`}
                          >
                            {c.residualRisk.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onSelectControlForReview(c.controlId)}
                            className="px-2.5 py-1 bg-[#222222] border border-[#333333] text-white hover:border-[#f5ff00] hover:text-[#f5ff00] text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
                          >
                            Review &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
