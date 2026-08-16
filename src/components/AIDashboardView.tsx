import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  ShieldAlert,
  FileText,
  Activity,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Sliders,
  Radio,
} from 'lucide-react';
import {
  RCSAPayload,
  AISettings,
  AIExecutiveSummary,
  AIHeatmapPrediction,
  AIRiskRemediationSynthesis,
  AITrendItem,
  AIWriteupType,
  AIWriteupResult,
  AIRemediationPlan,
  RemediationRoadmapItem,
} from '../types';
import {
  generateAISummary,
  generateAIHeatmapPrediction,
  generateAIRiskRemediationSynthesis,
  generateAITrends,
  generateAIWriteup,
  getAIEngineLabel,
} from '../utils/aiDashboardEngine';
import { SECTOR_PROFILES } from '../data/sectorProfiles';

interface AIDashboardViewProps {
  assessment: RCSAPayload;
  aiSettings: AISettings;
  onOpenSettingsModal: () => void;
  onNavigateToStage: (stage: any) => void;
  onSelectControlForReview: (controlId: string) => void;
  onUpdateRemediationPlan?: (plan: AIRemediationPlan) => void;
}

type AITabType =
  | 'summary'
  | 'heatmap_prediction'
  | 'risk_remediation'
  | 'latest_trends'
  | 'writeups';

export const AIDashboardView: React.FC<AIDashboardViewProps> = ({
  assessment,
  aiSettings,
  onOpenSettingsModal,
  onNavigateToStage,
  onSelectControlForReview,
  onUpdateRemediationPlan,
}) => {
  const [activeTab, setActiveTab] = useState<AITabType>('summary');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // AI Feature States
  const [summaryData, setSummaryData] = useState<AIExecutiveSummary | null>(null);
  const [heatmapData, setHeatmapData] = useState<AIHeatmapPrediction | null>(null);
  const [riskData, setRiskData] = useState<AIRiskRemediationSynthesis | null>(null);
  const [trendsData, setTrendsData] = useState<AITrendItem[]>([]);
  const [selectedScenario, setSelectedScenario] = useState('Current Operating Trajectory');

  // Writeups State
  const [selectedWriteupType, setSelectedWriteupType] = useState<AIWriteupType>('BOARD_MEMO');
  const [customWriteupInstruction, setCustomWriteupInstruction] = useState('');
  const [writeupResult, setWriteupResult] = useState<AIWriteupResult | null>(null);
  const [isGeneratingWriteup, setIsGeneratingWriteup] = useState(false);

  // Trend filter
  const [trendCategoryFilter, setTrendCategoryFilter] = useState<string>('ALL');

  const sector =
    SECTOR_PROFILES[assessment.organizationProfile.sector] || SECTOR_PROFILES.Technology;

  // Initial Load of AI Features
  useEffect(() => {
    loadAllAIData();
  }, [assessment.assessmentId, aiSettings.mode, aiSettings.isAirGappedMode]);

  const loadAllAIData = async () => {
    setIsLoading(true);
    try {
      const [sum, heat, risk, trends, writeup] = await Promise.all([
        generateAISummary(assessment, aiSettings),
        generateAIHeatmapPrediction(assessment, aiSettings, selectedScenario),
        generateAIRiskRemediationSynthesis(assessment, aiSettings),
        generateAITrends(assessment, aiSettings),
        generateAIWriteup(selectedWriteupType, assessment, aiSettings),
      ]);
      setSummaryData(sum);
      setHeatmapData(heat);
      setRiskData(risk);
      setTrendsData(trends);
      setWriteupResult(writeup);
    } catch (e) {
      console.error('Error loading AI dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshCurrentTab = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'summary') {
        const sum = await generateAISummary(assessment, aiSettings);
        setSummaryData(sum);
      } else if (activeTab === 'heatmap_prediction') {
        const heat = await generateAIHeatmapPrediction(assessment, aiSettings, selectedScenario);
        setHeatmapData(heat);
      } else if (activeTab === 'risk_remediation') {
        const risk = await generateAIRiskRemediationSynthesis(assessment, aiSettings);
        setRiskData(risk);
      } else if (activeTab === 'latest_trends') {
        const trends = await generateAITrends(assessment, aiSettings);
        setTrendsData(trends);
      } else if (activeTab === 'writeups') {
        await handleGenerateWriteup();
      }
    } catch (e) {
      console.error('Error refreshing tab:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScenarioChange = async (scenario: string) => {
    setSelectedScenario(scenario);
    setIsLoading(true);
    try {
      const heat = await generateAIHeatmapPrediction(assessment, aiSettings, scenario);
      setHeatmapData(heat);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateWriteup = async () => {
    setIsGeneratingWriteup(true);
    try {
      const result = await generateAIWriteup(
        selectedWriteupType,
        assessment,
        aiSettings,
        customWriteupInstruction
      );
      setWriteupResult(result);
    } catch (e) {
      console.error('Error generating writeup:', e);
    } finally {
      setIsGeneratingWriteup(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyToRemediationRoadmap = () => {
    if (!riskData || !onUpdateRemediationPlan) return;

    const roadmapItems: RemediationRoadmapItem[] = riskData.highestImpactActions.map(
      (item, idx) => ({
        id: `ROADMAP-AI-${idx + 1}`,
        priority: item.priority,
        targetControl: item.affectedControls[0] || 'AC-2',
        controlTitle: item.title,
        domain: item.domain,
        gapSummary: item.rootCauseAnalysis,
        technicalRemediationAction: item.recommendedRemediation,
        compensatingControl: item.compensatingControl,
        estimatedResidualReduction: Number((item.estimatedRiskReductionPct * 0.1).toFixed(1)),
        implementationTimeline: item.estimatedCostEffort,
        validationCriteria: 'Automated telemetry ingestion & auditor re-examination.',
        status: 'OPEN',
      })
    );

    const plan: AIRemediationPlan = {
      engineUsed: riskData.engineUsed,
      modelVersion: 'ai-synthesis-v2.0',
      generatedTimestamp: new Date().toISOString(),
      executiveSummary: riskData.strategicGuidance,
      sectorNotes: `Derived from AI Synthesis for ${sector.name} under ${assessment.organizationProfile.targetSystem}.`,
      roadmap: roadmapItems,
    };

    onUpdateRemediationPlan(plan);
    onNavigateToStage('remediation');
  };

  const tabs: { id: AITabType; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'summary',
      label: 'Executive Summary',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      badge: 'Briefing',
    },
    {
      id: 'heatmap_prediction',
      label: 'Heatmap Prediction',
      icon: <Activity className="w-3.5 h-3.5" />,
      badge: 'Forecast',
    },
    {
      id: 'risk_remediation',
      label: 'Risk & Remediation',
      icon: <ShieldAlert className="w-3.5 h-3.5" />,
      badge: 'Synthesis',
    },
    {
      id: 'latest_trends',
      label: 'Latest Trends',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      badge: 'Horizon',
    },
    {
      id: 'writeups',
      label: 'Governance Writeups',
      icon: <FileText className="w-3.5 h-3.5" />,
      badge: 'Memos',
    },
  ];

  return (
    <div className="space-y-6 pb-20 text-white animate-fadeIn">
      {/* Top Banner: Engine Status & Quick Controls */}
      <div className="border border-[#262626] bg-[#141414] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap font-mono text-[10px]">
            <span className="px-2 py-0.5 font-bold uppercase tracking-wider bg-black text-[#f5ff00] border border-[#333333] flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#f5ff00]" />
              AI Intelligence Hub
            </span>
            <span className="px-2 py-0.5 border border-[#333333] bg-[#1a1a1a] text-[#cccccc] flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 text-emerald-400 animate-pulse" />
              {getAIEngineLabel(aiSettings)}
            </span>
            {aiSettings.isAirGappedMode && (
              <span className="px-2 py-0.5 font-bold uppercase tracking-wider bg-purple-950 text-purple-300 border border-purple-800">
                Air-Gapped Zero-Telemetry
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-syne font-bold uppercase tracking-tight text-white">
            AI Integrated Governance & Risk Dashboard
          </h2>
          <p className="text-xs text-[#888888] max-w-3xl font-mono leading-relaxed">
            Real-time multi-domain risk quantification, threat trajectory forecasts, prioritized
            remediation roadmaps, horizon scanning, and automated executive writeups.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={handleRefreshCurrentTab}
            disabled={isLoading}
            className="px-3 py-2 border border-[#333333] bg-[#1a1a1a] hover:bg-[#222222] text-[#cccccc] hover:text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
            title="Re-run AI Analysis"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Running AI...' : 'Refresh Insights'}</span>
          </button>

          <button
            onClick={onOpenSettingsModal}
            className="px-3.5 py-2 bg-[#f5ff00] text-black hover:bg-yellow-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
            title="Configure Local Providers (LM Studio, Ollama, Anything LLM) or Cloud"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Local AI Settings</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-[#262626] pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition border whitespace-nowrap ${
                isActive
                  ? 'border-[#f5ff00] bg-[#f5ff00] text-black font-bold'
                  : 'border-[#333333] bg-[#1a1a1a] text-[#888888] hover:text-white hover:border-[#666666]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 font-mono uppercase tracking-widest ${
                    isActive ? 'bg-black text-[#f5ff00]' : 'bg-[#222222] text-[#888888]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: AI EXECUTIVE SUMMARY                               */}
      {/* ========================================================= */}
      {activeTab === 'summary' && summaryData && (
        <div className="space-y-6">
          {/* Executive Posture & Score Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#262626] bg-[#141414]">
            <div className="lg:col-span-4 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-[#262626] flex flex-col justify-between space-y-6 bg-[#0c0c0c]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#888888]">
                  AI Assessed Posture
                </span>
                <div className="flex items-baseline gap-4 mt-2">
                  <div className="text-6xl font-mono font-bold text-[#f5ff00]">
                    {summaryData.postureGrade}
                  </div>
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                      Audit Readiness: {summaryData.auditReadinessScore}%
                    </div>
                    <div className="text-[10px] font-mono text-[#888888]">
                      {assessment.organizationProfile.sector} Regulatory Baseline
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-[#262626]">
                <div className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#888888]">
                  Defensibility Target
                </div>
                <p className="text-xs font-mono text-[#cccccc] leading-relaxed">
                  {summaryData.regulatoryExposureSummary}
                </p>
              </div>

              <div className="pt-2 text-[9px] font-mono text-[#666666]">
                Generated {new Date(summaryData.generatedTimestamp).toLocaleTimeString()} via{' '}
                {summaryData.engineUsed}
              </div>
            </div>

            <div className="lg:col-span-8 p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-[#888888]">
                  Executive Briefing Headline
                </span>
                <button
                  onClick={() => handleCopy(summaryData.headline, 'headline')}
                  className="text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 text-[#888888] hover:text-white"
                >
                  {copiedKey === 'headline' ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === 'headline' ? 'Copied' : 'Copy Headline'}</span>
                </button>
              </div>

              <h3 className="text-xl sm:text-2xl font-syne font-bold uppercase text-white leading-snug">
                "{summaryData.headline}"
              </h3>

              <div className="pt-4 border-t border-[#262626] space-y-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider block text-[#f5ff00]">
                  Key System Risk Drivers:
                </span>
                <ul className="space-y-2 text-xs font-mono text-[#cccccc]">
                  {summaryData.keyRiskDrivers.map((driver, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-black border border-[#333333] text-[#f5ff00] shrink-0 mt-0.5">
                        0{idx + 1}
                      </span>
                      <span>{driver}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Two Column Grid: Strengths vs Critical Vulnerabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="border border-[#262626] bg-[#141414] p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-white">
                  Verified Safeguard Strengths ({summaryData.strengthsIdentified.length})
                </h4>
              </div>
              <div className="space-y-2.5">
                {summaryData.strengthsIdentified.map((str, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-emerald-950/40 border border-emerald-800 text-xs font-mono text-emerald-300 flex items-start gap-2"
                  >
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vulnerabilities */}
            <div className="border border-[#262626] bg-[#141414] p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-white">
                  Critical Vulnerabilities & Gaps ({summaryData.criticalVulnerabilities.length})
                </h4>
              </div>
              <div className="space-y-2.5">
                {summaryData.criticalVulnerabilities.map((vuln, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-rose-950/40 border border-rose-800 text-xs font-mono text-rose-300 flex items-start gap-2"
                  >
                    <span className="text-rose-400 font-bold">⚠</span>
                    <span>{vuln}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Board-Level Talking Points */}
          <div className="border border-[#262626] bg-[#141414] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#f5ff00]" />
                <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-white">
                  Board & Executive Committee Talking Points
                </h4>
              </div>
              <button
                onClick={() =>
                  handleCopy(summaryData.boardTalkingPoints.join('\n\n'), 'board_points')
                }
                className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#888888] hover:text-white"
              >
                {copiedKey === 'board_points' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === 'board_points' ? 'Copied to Clipboard' : 'Copy All Points'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {summaryData.boardTalkingPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-black border border-[#262626] space-y-2 font-mono text-xs"
                >
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#1a1a1a] text-[#f5ff00] border border-[#333333]">
                    POINT 0{idx + 1}
                  </span>
                  <p className="text-[#cccccc] leading-relaxed pt-1">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: AI HEATMAP PREDICTION & TRAJECTORY FORECASTING     */}
      {/* ========================================================= */}
      {activeTab === 'heatmap_prediction' && heatmapData && (
        <div className="space-y-6">
          {/* Scenario Selector & Velocity Bar */}
          <div className="border border-[#262626] bg-[#141414] p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262626] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#888888] block">
                  Predictive Threat Trajectory Simulator
                </span>
                <h3 className="text-xl font-syne font-bold uppercase text-white">
                  AI Horizon Threat Modeling: 30 & 90-Day Forecast
                </h3>
              </div>

              {/* Scenario selector */}
              <div className="flex items-center gap-2 flex-wrap font-mono">
                <span className="text-xs font-bold uppercase tracking-wider text-[#888888]">
                  Stress Scenario:
                </span>
                <select
                  value={selectedScenario}
                  onChange={(e) => handleScenarioChange(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-[#333333] bg-black text-white font-medium focus:border-[#f5ff00] outline-none"
                >
                  <option value="Current Operating Trajectory">Current Operating Trajectory</option>
                  <option value="Ransomware Surge Vector">Ransomware & Extortion Surge</option>
                  <option value="Privacy Regulatory Audit">
                    Sudden Privacy Regulatory Audit (GDPR/CCPA)
                  </option>
                  <option value="3rd Party Cloud Vendor Outage">
                    3rd Party Supply Chain & Cloud Outage
                  </option>
                </select>
              </div>
            </div>

            {/* Metrics Row: Current vs 30d vs 90d */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono">
              <div className="p-4 border border-[#262626] bg-black">
                <span className="text-[10px] uppercase font-bold text-[#888888]">Risk Velocity</span>
                <div
                  className={`text-2xl font-bold mt-1 ${
                    heatmapData.riskVelocityScore === 'HIGH' ||
                    heatmapData.riskVelocityScore === 'EXTREME'
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {heatmapData.riskVelocityScore}
                </div>
                <div className="text-[10px] text-[#666666] mt-0.5">
                  Rate of control degradation
                </div>
              </div>

              <div className="p-4 border border-[#262626] bg-black">
                <span className="text-[10px] uppercase font-bold text-[#888888]">
                  Current Criticals
                </span>
                <div className="text-2xl font-bold mt-1 text-white">
                  {heatmapData.baselineCriticalCount}
                </div>
                <div className="text-[10px] text-[#666666] mt-0.5">Baseline assessment state</div>
              </div>

              <div className="p-4 border border-[#262626] bg-black">
                <span className="text-[10px] uppercase font-bold text-[#888888]">
                  Projected (30 Days)
                </span>
                <div className="text-2xl font-bold mt-1 text-amber-400">
                  {heatmapData.projectedCriticalCount30d}
                </div>
                <div className="text-[10px] text-amber-500 mt-0.5">
                  {heatmapData.projectedCriticalCount30d > heatmapData.baselineCriticalCount
                    ? `+${
                        heatmapData.projectedCriticalCount30d - heatmapData.baselineCriticalCount
                      } New Gaps`
                    : 'Stable'}
                </div>
              </div>

              <div className="p-4 border border-[#262626] bg-black">
                <span className="text-[10px] uppercase font-bold text-[#888888]">
                  Projected (90 Days)
                </span>
                <div className="text-2xl font-bold mt-1 text-rose-400">
                  {heatmapData.projectedCriticalCount90d}
                </div>
                <div className="text-[10px] text-rose-500 mt-0.5">
                  {heatmapData.projectedCriticalCount90d > heatmapData.baselineCriticalCount
                    ? `+${
                        heatmapData.projectedCriticalCount90d - heatmapData.baselineCriticalCount
                      } Critical Spike`
                    : 'Under Control'}
                </div>
              </div>
            </div>
          </div>

          {/* Domain Risk Shifts Matrix */}
          <div className="border border-[#262626] bg-[#141414] p-6 space-y-4">
            <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-white border-b border-[#262626] pb-3">
              Domain Risk Trajectory Under Scenario: {selectedScenario}
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-[#262626] bg-black text-[10px] uppercase tracking-wider font-bold text-[#888888]">
                    <th className="py-3 px-4">Domain</th>
                    <th className="py-3 px-4 text-center">Current RR</th>
                    <th className="py-3 px-4 text-center">Projected 30d</th>
                    <th className="py-3 px-4 text-center">Projected 90d</th>
                    <th className="py-3 px-4 text-center">Trend</th>
                    <th className="py-3 px-4">Primary Threat Vector</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626]">
                  {heatmapData.domainRiskShifts.map((d, idx) => (
                    <tr key={idx} className="hover:bg-[#1a1a1a]">
                      <td className="py-3 px-4 font-bold text-white">{d.domain}</td>
                      <td className="py-3 px-4 text-center">{d.currentRisk}</td>
                      <td className="py-3 px-4 text-center text-amber-400">{d.projectedRisk30d}</td>
                      <td className="py-3 px-4 text-center font-bold text-rose-400">
                        {d.projectedRisk90d}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${
                            d.trend === 'INCREASING'
                              ? 'bg-rose-950/60 border-rose-600 text-rose-300'
                              : 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                          }`}
                        >
                          {d.trend}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#aaaaaa] max-w-sm">
                        {d.threatVector}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Volatile Controls Watchlist */}
          <div className="border border-[#262626] bg-[#141414] p-6 space-y-4">
            <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-white border-b border-[#262626] pb-3">
              Volatile Controls Watchlist (High Likelihood of Audit Escalation)
            </h4>

            <div className="space-y-3 font-mono">
              {heatmapData.volatileControls.map((c) => (
                <div key={c.controlId} className="p-4 border border-[#262626] bg-black space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 border border-[#333333] bg-[#1a1a1a] text-[#f5ff00]">
                        {c.controlId}
                      </span>
                      <span className="font-syne font-bold uppercase text-sm text-white">
                        {c.controlTitle}
                      </span>
                      <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 border border-[#333333] bg-[#141414] text-[#888888]">
                        {c.domain}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs">
                        RR: <strong className="font-bold text-white">{c.currentResidualRisk}</strong>{' '}
                        &rarr; 90d:{' '}
                        <strong className="text-rose-400 font-bold">
                          {c.projectedResidualRisk90d}
                        </strong>
                      </span>
                      <button
                        onClick={() => onSelectControlForReview(c.controlId)}
                        className="px-2.5 py-1 border border-[#333333] bg-[#1a1a1a] hover:border-[#f5ff00] hover:text-[#f5ff00] text-[10px] uppercase font-bold transition text-[#cccccc]"
                      >
                        Inspect Control
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-[#aaaaaa]">
                    <strong className="text-[#f5ff00]">Preventative Action:</strong>{' '}
                    {c.recommendedPreventativeAction}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: AI RISK & REMEDIATION SYNTHESIS                     */}
      {/* ========================================================= */}
      {activeTab === 'risk_remediation' && riskData && (
        <div className="space-y-6">
          {/* Executive Overview Card */}
          <div className="border border-[#262626] bg-[#141414] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262626] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#888888]">
                  AI Prioritized Synthesis
                </span>
                <h3 className="text-xl sm:text-2xl font-syne font-bold uppercase text-white">
                  Targeted Remediation & Residual Risk Reduction Roadmap
                </h3>
              </div>

              {onUpdateRemediationPlan && (
                <button
                  onClick={handleApplyToRemediationRoadmap}
                  className="px-4 py-2 bg-[#f5ff00] text-black hover:bg-yellow-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition shrink-0"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Sync to Active Remediation View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-4 border border-[#262626] bg-black">
                <span className="text-[10px] uppercase font-bold text-[#888888]">
                  Analyzed Gaps
                </span>
                <div className="text-3xl font-bold mt-1 text-white">
                  {riskData.totalDeficienciesAnalyzed}
                </div>
                <div className="text-[10px] text-[#666666] mt-0.5">
                  Controls requiring engineering action
                </div>
              </div>

              <div className="p-4 border border-[#262626] bg-black">
                <span className="text-[10px] uppercase font-bold text-[#888888]">
                  Projected Risk Reduction
                </span>
                <div className="text-3xl font-bold mt-1 text-emerald-400">
                  ↓ {riskData.overallProjectedResidualReduction}%
                </div>
                <div className="text-[10px] text-emerald-500 mt-0.5">Net posture improvement</div>
              </div>

              <div className="p-4 border border-[#262626] bg-black">
                <span className="text-[10px] uppercase font-bold text-[#888888]">
                  Estimated Cost / Effort
                </span>
                <div className="text-base font-bold mt-2 text-white">
                  {riskData.remediationBudgetEstimate}
                </div>
              </div>
            </div>

            <div className="p-4 border-l-4 border-[#f5ff00] bg-black text-xs font-mono leading-relaxed text-[#cccccc]">
              <strong className="text-[#f5ff00]">AI Strategic Guidance:</strong>{' '}
              {riskData.strategicGuidance}
            </div>
          </div>

          {/* Action Cards */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono uppercase font-bold tracking-wider text-white">
              Top Prioritized Actions ({riskData.highestImpactActions.length})
            </h4>

            {riskData.highestImpactActions.map((action) => (
              <div
                key={action.id}
                className="border border-[#262626] bg-[#141414] p-6 space-y-4 font-mono"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 text-white ${
                        action.priority === 'P0_IMMEDIATE'
                          ? 'bg-rose-700'
                          : action.priority === 'P1_HIGH'
                          ? 'bg-amber-600'
                          : 'bg-[#262626]'
                      }`}
                    >
                      {action.priority.replace('_', ': ')}
                    </span>
                    <span className="font-syne font-bold uppercase text-sm sm:text-base text-white">
                      {action.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 border border-[#333333] bg-black text-[#888888]">
                      Effort: {action.estimatedCostEffort}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-800 font-bold">
                      Risk -{action.estimatedRiskReductionPct}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#888888]">
                      Root Cause Analysis
                    </span>
                    <p className="text-[#cccccc] bg-black p-3 border border-[#262626]">
                      {action.rootCauseAnalysis}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#888888]">
                      Compensating Safeguard
                    </span>
                    <p className="text-[#cccccc] bg-black p-3 border border-[#262626]">
                      {action.compensatingControl}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="text-xs text-white">
                    <strong className="text-[#f5ff00]">Technical Remediation:</strong>{' '}
                    {action.recommendedRemediation}
                  </div>
                  {action.affectedControls[0] && (
                    <button
                      onClick={() => onSelectControlForReview(action.affectedControls[0])}
                      className="text-[10px] uppercase font-bold text-[#f5ff00] hover:underline shrink-0"
                    >
                      View Control {action.affectedControls[0]} &rarr;
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: LATEST TRENDS & REGULATORY HORIZON                  */}
      {/* ========================================================= */}
      {activeTab === 'latest_trends' && (
        <div className="space-y-6">
          <div className="border border-[#262626] bg-[#141414] p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262626] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#888888] block">
                  Regulatory & Cyber Threat Horizon
                </span>
                <h3 className="text-xl font-syne font-bold uppercase text-white">
                  Latest Compliance Standards & Emerging Vector Trends
                </h3>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 flex-wrap font-mono">
                {['ALL', 'REGULATORY_UPDATE', 'EMERGING_THREAT', 'INDUSTRY_BENCHMARK'].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => setTrendCategoryFilter(cat)}
                      className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider border transition ${
                        trendCategoryFilter === cat
                          ? 'border-[#f5ff00] bg-[#f5ff00] text-black font-bold'
                          : 'border-[#333333] bg-[#1a1a1a] text-[#888888] hover:text-white hover:border-[#666666]'
                      }`}
                    >
                      {cat.replace('_', ' ')}
                    </button>
                  )
                )}
              </div>
            </div>

            <p className="text-xs text-[#888888] font-mono">
              AI-scanned horizon intelligence mapped specifically to{' '}
              <strong className="text-white">{sector.name}</strong> regulatory baseline (
              {sector.regulatoryFrameworks.join(', ')}) and system boundary{' '}
              <strong className="text-white">{assessment.organizationProfile.targetSystem}</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
            {trendsData
              .filter((t) => trendCategoryFilter === 'ALL' || t.category === trendCategoryFilter)
              .map((trend) => (
                <div
                  key={trend.id}
                  className="border border-[#262626] bg-[#141414] p-6 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`text-[9px] uppercase font-bold px-2 py-0.5 border ${
                          trend.category === 'REGULATORY_UPDATE'
                            ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                            : trend.category === 'EMERGING_THREAT'
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                            : 'bg-blue-950/60 text-blue-300 border-blue-800'
                        }`}
                      >
                        {trend.category.replace('_', ' ')}
                      </span>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[#888888]">Relevance:</span>
                        <span className="text-xs font-bold text-[#f5ff00]">
                          {trend.relevanceScore}%
                        </span>
                      </div>
                    </div>

                    <h4 className="text-base font-syne font-bold uppercase text-white leading-snug">
                      {trend.title}
                    </h4>

                    <div className="text-[10px] text-[#888888]">
                      Authority: <strong className="text-white">{trend.sourceAuthority}</strong> •{' '}
                      {trend.effectiveDateOrPeriod}
                    </div>

                    <p className="text-xs text-[#cccccc] leading-relaxed">{trend.summary}</p>

                    <div className="p-3 bg-black border border-[#262626] text-xs space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#f5ff00] block">
                        Direct System Impact:
                      </span>
                      <p className="text-[#aaaaaa] text-[11px]">{trend.directImpactOnSystem}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#262626] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-[#666666]">NIST Controls:</span>
                      {trend.relevantNistControls.map((ctrl) => (
                        <span
                          key={ctrl}
                          className="text-[10px] font-bold px-1.5 py-0.2 bg-black border border-[#333333] text-[#f5ff00]"
                        >
                          {ctrl}
                        </span>
                      ))}
                    </div>

                    <span
                      className={`text-[9px] font-bold uppercase px-2 py-0.5 border ${
                        trend.actionRequired === 'URGENT_ACTION'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-700'
                          : 'bg-[#1a1a1a] text-[#888888] border-[#333333]'
                      }`}
                    >
                      {trend.actionRequired.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: AI GOVERNANCE & AUDIT WRITEUPS                      */}
      {/* ========================================================= */}
      {activeTab === 'writeups' && (
        <div className="space-y-6">
          {/* Writeup Generator Controls */}
          <div className="border border-[#262626] bg-[#141414] p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262626] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#888888] block">
                  AI Governance Narrative Builder
                </span>
                <h3 className="text-xl font-syne font-bold uppercase text-white">
                  Formal Audit Memorandums & Executive Statements
                </h3>
              </div>

              <button
                onClick={handleGenerateWriteup}
                disabled={isGeneratingWriteup}
                className="px-4 py-2 bg-[#f5ff00] text-black hover:bg-yellow-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition shrink-0"
              >
                <Sparkles
                  className={`w-3.5 h-3.5 text-black ${isGeneratingWriteup ? 'animate-spin' : ''}`}
                />
                <span>{isGeneratingWriteup ? 'Generating Writeup...' : 'Generate Audit Memo'}</span>
              </button>
            </div>

            {/* Template Buttons */}
            <div className="space-y-2 font-mono">
              <span className="text-xs uppercase font-bold tracking-wider block text-[#888888]">
                Select Memorandum / Statement Template:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'BOARD_MEMO',
                    label: 'Board Audit Memo',
                    desc: 'Formal Risk & Audit Committee executive brief',
                  },
                  {
                    id: 'CISO_EXECUTIVE_DEFENSE',
                    label: 'CISO Defense Statement',
                    desc: 'Regulatory examination control defensibility',
                  },
                  {
                    id: 'CUSTOMER_TRUST_ATTESTATION',
                    label: 'Customer Trust Letter',
                    desc: 'Customer & partner security attestation',
                  },
                ].map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => setSelectedWriteupType(tmpl.id as AIWriteupType)}
                    className={`p-3 text-left border transition ${
                      selectedWriteupType === tmpl.id
                        ? 'border-[#f5ff00] bg-[#f5ff00] text-black font-bold'
                        : 'border-[#333333] bg-[#1a1a1a] text-[#888888] hover:text-white hover:border-[#666666]'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-wider">{tmpl.label}</div>
                    <div
                      className={`text-[10px] mt-1 ${
                        selectedWriteupType === tmpl.id ? 'opacity-80' : 'opacity-60'
                      }`}
                    >
                      {tmpl.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Instruction Box */}
            <div className="space-y-1.5 font-mono">
              <label className="text-xs uppercase font-bold tracking-wider text-[#888888]">
                Optional Custom Prompt / Auditor Instructions
              </label>
              <input
                type="text"
                value={customWriteupInstruction}
                onChange={(e) => setCustomWriteupInstruction(e.target.value)}
                placeholder="e.g. Highlight cloud encryption and multi-factor authentication compliance under Q3 budget..."
                className="w-full px-3 py-2 text-xs border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
              />
            </div>
          </div>

          {/* Rendered Writeup Output Document */}
          {writeupResult && (
            <div className="border border-[#333333] bg-[#141414] p-6 sm:p-10 space-y-6 font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#f5ff00]">
                    {writeupResult.targetAudience}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-syne font-bold uppercase text-white">
                    {writeupResult.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleCopy(writeupResult.content, 'writeup_text')}
                    className="px-3 py-1.5 border border-[#333333] bg-[#1a1a1a] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:text-white hover:border-[#666666] transition text-[#888888]"
                  >
                    {copiedKey === 'writeup_text' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'writeup_text' ? 'Copied' : 'Copy Text'}</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-[#f5ff00] text-black text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-yellow-300 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / PDF</span>
                  </button>
                </div>
              </div>

              {/* Document Text Body */}
              <div className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-[#dddddd] border border-[#262626] bg-black p-6 sm:p-8 font-mono">
                {writeupResult.content}
              </div>

              {/* Action Items Footer */}
              {writeupResult.keyActionItems.length > 0 && (
                <div className="pt-4 border-t border-[#262626] space-y-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#f5ff00]">
                    Governance Action Checklist:
                  </span>
                  <ul className="space-y-1 text-xs text-[#cccccc]">
                    {writeupResult.keyActionItems.map((act, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#f5ff00]"></span>
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
