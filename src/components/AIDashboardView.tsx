import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
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
  Zap,
  Terminal,
  Layers,
  Lock,
  Download,
  ExternalLink,
  Code,
  FileCode,
  CheckSquare,
  ChevronDown,
  ChevronUp,
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
  AIMitigationDomainResult,
  AIMitigationSuggestion,
  AIMitigationStrategyType,
  RiskDomain,
} from '../types';
import {
  generateAISummary,
  generateAIHeatmapPrediction,
  generateAIRiskRemediationSynthesis,
  generateAITrends,
  generateAIWriteup,
  generateAIMitigationSuggestions,
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
  | 'mitigation_suggestions'
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
  const [activeTab, setActiveTab] = useState<AITabType>('mitigation_suggestions');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // AI Feature States
  const [summaryData, setSummaryData] = useState<AIExecutiveSummary | null>(null);
  const [heatmapData, setHeatmapData] = useState<AIHeatmapPrediction | null>(null);
  const [riskData, setRiskData] = useState<AIRiskRemediationSynthesis | null>(null);
  const [trendsData, setTrendsData] = useState<AITrendItem[]>([]);
  const [selectedScenario, setSelectedScenario] = useState('Current Operating Trajectory');

  // Mitigation Suggestions State
  const [mitigationData, setMitigationData] = useState<AIMitigationDomainResult | null>(null);
  const [selectedMitigationDomain, setSelectedMitigationDomain] = useState<RiskDomain | 'ALL'>('ALL');
  const [selectedMitigationStrategy, setSelectedMitigationStrategy] = useState<string>('ALL');
  const [selectedUrgencyFilter, setSelectedUrgencyFilter] = useState<string>('ALL');
  const [isGeneratingMitigations, setIsGeneratingMitigations] = useState<boolean>(false);
  const [appliedMitigationIds, setAppliedMitigationIds] = useState<Set<string>>(new Set());
  const [expandedSnippetId, setExpandedSnippetId] = useState<string | null>(null);

  // Writeups State
  const [selectedWriteupType, setSelectedWriteupType] = useState<AIWriteupType>('BOARD_MEMO');
  const [customWriteupInstruction, setCustomWriteupInstruction] = useState('');
  const [writeupResult, setWriteupResult] = useState<AIWriteupResult | null>(null);
  const [isGeneratingWriteup, setIsGeneratingWriteup] = useState(false);

  // Trend filter
  const [trendCategoryFilter, setTrendCategoryFilter] = useState<string>('ALL');

  const sector =
    SECTOR_PROFILES[assessment.organizationProfile.sector] || SECTOR_PROFILES.Technology;

  // Initial & Tab-switch Load of AI Features (on-demand per active tab to prevent concurrent API burst)
  useEffect(() => {
    loadActiveTabData(activeTab);
  }, [activeTab, assessment.assessmentId, aiSettings.mode, aiSettings.isAirGappedMode]);

  const loadActiveTabData = async (tab: typeof activeTab) => {
    // Only load if not already populated or if refreshing
    setIsLoading(true);
    try {
      if (tab === 'summary') {
        if (!summaryData) {
          const sum = await generateAISummary(assessment, aiSettings);
          setSummaryData(sum);
        }
      } else if (tab === 'mitigation_suggestions') {
        if (!mitigationData) {
          const mitigations = await generateAIMitigationSuggestions(
            assessment,
            aiSettings,
            selectedMitigationDomain,
            selectedMitigationStrategy
          );
          setMitigationData(mitigations);
        }
      } else if (tab === 'heatmap_prediction') {
        if (!heatmapData) {
          const heat = await generateAIHeatmapPrediction(assessment, aiSettings, selectedScenario);
          setHeatmapData(heat);
        }
      } else if (tab === 'risk_remediation') {
        if (!riskData) {
          const risk = await generateAIRiskRemediationSynthesis(assessment, aiSettings);
          setRiskData(risk);
        }
      } else if (tab === 'latest_trends') {
        if (!trendsData || trendsData.length === 0) {
          const trends = await generateAITrends(assessment, aiSettings);
          setTrendsData(trends);
        }
      } else if (tab === 'writeups') {
        if (!writeupResult) {
          const writeup = await generateAIWriteup(selectedWriteupType, assessment, aiSettings, customWriteupInstruction);
          setWriteupResult(writeup);
        }
      }
    } catch (e) {
      console.error('Error loading AI tab data:', e);
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
      } else if (activeTab === 'mitigation_suggestions') {
        await handleGenerateMitigations();
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

  const handleGenerateMitigations = async (
    targetDomain: RiskDomain | 'ALL' = selectedMitigationDomain,
    targetStrategy: string = selectedMitigationStrategy
  ) => {
    setIsGeneratingMitigations(true);
    try {
      const res = await generateAIMitigationSuggestions(
        assessment,
        aiSettings,
        targetDomain,
        targetStrategy
      );
      setMitigationData(res);
    } catch (err) {
      console.error('Error generating mitigation suggestions:', err);
    } finally {
      setIsGeneratingMitigations(false);
    }
  };

  const handleDomainFilterChange = async (domain: RiskDomain | 'ALL') => {
    setSelectedMitigationDomain(domain);
    await handleGenerateMitigations(domain, selectedMitigationStrategy);
  };

  const handleApplySingleMitigation = (sug: AIMitigationSuggestion) => {
    setAppliedMitigationIds((prev) => new Set([...prev, sug.id]));

    if (onUpdateRemediationPlan) {
      const newItem: RemediationRoadmapItem = {
        id: `ROADMAP-MIT-${Date.now()}`,
        priority: sug.urgency === 'IMMEDIATE' ? 'P0_IMMEDIATE' : sug.urgency === 'HIGH' ? 'P1_HIGH' : 'P2_MEDIUM',
        targetControl: sug.targetControlId,
        controlTitle: sug.controlTitle,
        domain: sug.domain,
        gapSummary: sug.vulnerabilityAddressed,
        technicalRemediationAction: `${sug.title}: ${sug.technicalImplementation}`,
        compensatingControl: sug.compensatingSafeguard,
        estimatedResidualReduction: Number((sug.currentResidualRisk - sug.projectedResidualRisk).toFixed(1)),
        implementationTimeline: sug.implementationCost,
        validationCriteria: sug.auditValidationMetric,
        status: 'OPEN',
      };

      const existingPlan = assessment.aiRemediation;
      const plan: AIRemediationPlan = {
        engineUsed: getAIEngineLabel(aiSettings),
        modelVersion: 'gemini-proactive-v1',
        generatedTimestamp: new Date().toISOString(),
        roadmap: [newItem, ...(existingPlan?.roadmap || [])],
        sectorNotes: existingPlan?.sectorNotes || `Mitigation applied from ${sug.domain} domain proactive recommendations.`,
        executiveSummary: existingPlan?.executiveSummary || 'Proactive mitigation suggestions integrated directly into remediation roadmap.',
      };

      onUpdateRemediationPlan(plan);
    }
  };

  const handleApplyAllMitigations = () => {
    if (!mitigationData || !onUpdateRemediationPlan) return;

    const newIds = new Set(appliedMitigationIds);
    mitigationData.suggestions.forEach((s) => newIds.add(s.id));
    setAppliedMitigationIds(newIds);

    const roadmapItems: RemediationRoadmapItem[] = mitigationData.suggestions.map((sug, idx) => ({
      id: `ROADMAP-PROACTIVE-${idx + 1}`,
      priority: sug.urgency === 'IMMEDIATE' ? 'P0_IMMEDIATE' : sug.urgency === 'HIGH' ? 'P1_HIGH' : 'P2_MEDIUM',
      targetControl: sug.targetControlId,
      controlTitle: sug.controlTitle,
      domain: sug.domain,
      gapSummary: sug.vulnerabilityAddressed,
      technicalRemediationAction: `[PROACTIVE ${sug.strategyType}] ${sug.title} - ${sug.technicalImplementation}`,
      compensatingControl: sug.compensatingSafeguard,
      estimatedResidualReduction: Number((sug.currentResidualRisk - sug.projectedResidualRisk).toFixed(1)),
      implementationTimeline: sug.implementationCost,
      validationCriteria: sug.auditValidationMetric,
      status: 'OPEN',
    }));

    const plan: AIRemediationPlan = {
      engineUsed: mitigationData.engineUsed,
      modelVersion: 'gemini-3.7-flash-mitigation',
      generatedTimestamp: new Date().toISOString(),
      roadmap: roadmapItems,
      sectorNotes: `Proactive mitigation recommendations applied for ${mitigationData.domain} domain across ${sector.name}.`,
      executiveSummary: mitigationData.domainExecutiveBrief,
    };

    onUpdateRemediationPlan(plan);
    onNavigateToStage('remediation');
  };

  const handleExportMitigations = () => {
    if (!mitigationData) return;
    const jsonStr = JSON.stringify(mitigationData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rcsa-proactive-mitigations-${mitigationData.domain.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
      id: 'mitigation_suggestions',
      label: 'Mitigation Suggestions',
      icon: <Zap className="w-3.5 h-3.5" />,
      badge: 'Proactive AI',
    },
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

  const getStrategyColorClass = (strategy: string) => {
    switch (strategy) {
      case 'ZERO_TRUST':
        return 'bg-purple-950/70 text-purple-300 border-purple-700/60';
      case 'DATA_PROTECTION':
        return 'bg-blue-950/70 text-blue-300 border-blue-700/60';
      case 'AUTOMATED_INGESTION':
        return 'bg-amber-950/70 text-amber-300 border-amber-700/60';
      case 'KEY_MANAGEMENT':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60';
      case 'CONTINUOUS_AUDITING':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60';
      case 'PRIVACY_ENGINEERING':
        return 'bg-pink-950/70 text-pink-300 border-pink-700/60';
      case 'RESILIENCE':
        return 'bg-orange-950/70 text-orange-300 border-orange-700/60';
      default:
        return 'bg-[#222222] text-[#f5ff00] border-[#444444]';
    }
  };

  const getUrgencyColorClass = (urgency: string) => {
    switch (urgency) {
      case 'IMMEDIATE':
        return 'bg-rose-950/80 text-rose-300 border-rose-600';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-300 border-amber-600';
      case 'MEDIUM':
        return 'bg-blue-950/80 text-blue-300 border-blue-600';
      case 'PROACTIVE_HARDENING':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600';
      default:
        return 'bg-[#222222] text-white border-[#444444]';
    }
  };

  const filteredMitigations = (mitigationData?.suggestions || []).filter((item) => {
    if (selectedMitigationStrategy !== 'ALL' && item.strategyType !== selectedMitigationStrategy) {
      return false;
    }
    if (selectedUrgencyFilter !== 'ALL' && item.urgency !== selectedUrgencyFilter) {
      return false;
    }
    return true;
  });

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
      {/* TAB 0: PROACTIVE MITIGATION SUGGESTIONS (GEMINI AI)        */}
      {/* ========================================================= */}
      {activeTab === 'mitigation_suggestions' && (
        <div className="space-y-6">
          {/* Domain & Strategy Filter Ribbon */}
          <div className="border border-[#262626] bg-[#141414] p-5 space-y-4 font-mono">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-700 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#f5ff00]" />
                    Gemini Proactive Defense Intelligence
                  </span>
                  <span className="text-[10px] text-[#888888]">
                    Zero-Trust • Automated Guardrails • Cryptographic Hardening
                  </span>
                </div>
                <h3 className="text-xl font-syne font-black uppercase text-white mt-1">
                  Proactive Security Control Recommendations
                </h3>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => handleGenerateMitigations()}
                  disabled={isGeneratingMitigations}
                  className="px-3.5 py-2 bg-[#f5ff00] text-black hover:bg-yellow-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
                >
                  <Sparkles
                    className={`w-3.5 h-3.5 text-black ${
                      isGeneratingMitigations ? 'animate-spin' : ''
                    }`}
                  />
                  <span>
                    {isGeneratingMitigations ? 'Synthesizing with Gemini...' : 'Re-Run Domain Synthesis'}
                  </span>
                </button>

                <button
                  onClick={handleApplyAllMitigations}
                  disabled={!mitigationData || mitigationData.suggestions.length === 0}
                  className="px-3.5 py-2 border border-emerald-500 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition disabled:opacity-50"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Apply All to Remediation</span>
                </button>

                <button
                  onClick={handleExportMitigations}
                  className="p-2 border border-[#333333] bg-[#1a1a1a] hover:text-white text-[#888888] hover:border-[#555555] transition"
                  title="Export Mitigation Recommendations JSON"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Domain Selection Tabs */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase tracking-wider text-[#888888] font-bold block">
                Target Assessment Domain:
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {(['ALL', 'Cybersecurity', 'Privacy', 'Information Security', 'Governance'] as (RiskDomain | 'ALL')[]).map(
                  (dom) => {
                    const count =
                      dom === 'ALL'
                        ? assessment.controls.length
                        : assessment.controls.filter((c) => c.domain === dom).length;
                    return (
                      <button
                        key={dom}
                        onClick={() => handleDomainFilterChange(dom)}
                        className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider border transition flex items-center gap-2 ${
                          selectedMitigationDomain === dom
                            ? 'bg-[#f5ff00] text-black border-[#f5ff00]'
                            : 'bg-black text-[#aaaaaa] border-[#333333] hover:border-[#666666] hover:text-white'
                        }`}
                      >
                        <span>{dom === 'ALL' ? 'All Domains' : dom}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 ${
                            selectedMitigationDomain === dom
                              ? 'bg-black text-[#f5ff00]'
                              : 'bg-[#1e1e1e] text-[#888888]'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Strategy & Urgency Secondary Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#888888] block mb-1">
                  Defense Strategy Filter:
                </label>
                <select
                  value={selectedMitigationStrategy}
                  onChange={(e) => setSelectedMitigationStrategy(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-black border border-[#333333] text-xs text-white outline-none focus:border-[#f5ff00]"
                >
                  <option value="ALL">All Strategies (Zero Trust, Data, Resil, etc.)</option>
                  <option value="ZERO_TRUST">Zero Trust IAM & Ephemeral Auth</option>
                  <option value="DATA_PROTECTION">Data Protection & HSM Envelopes</option>
                  <option value="AUTOMATED_INGESTION">Automated Posture & Drift Alerting</option>
                  <option value="CONTINUOUS_AUDITING">Continuous WORM Audit Logging</option>
                  <option value="PRIVACY_ENGINEERING">Privacy Engineering & DSAR Tokenization</option>
                  <option value="RESILIENCE">Immutable Backup & Sandbox DR</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#888888] block mb-1">
                  Urgency / Hardening Level:
                </label>
                <select
                  value={selectedUrgencyFilter}
                  onChange={(e) => setSelectedUrgencyFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-black border border-[#333333] text-xs text-white outline-none focus:border-[#f5ff00]"
                >
                  <option value="ALL">All Urgencies</option>
                  <option value="IMMEDIATE">Immediate Hardening</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="PROACTIVE_HARDENING">Proactive Hardening Baseline</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="text-[11px] text-[#888888] flex items-center gap-1.5 p-2 bg-black border border-[#262626] w-full">
                  <span className="text-[#f5ff00] font-bold">
                    {filteredMitigations.length}
                  </span>
                  <span>proactive recommendations active in filter</span>
                </div>
              </div>
            </div>
          </div>

          {/* Domain Intelligence Executive Banner */}
          {mitigationData && (
            <div className="border border-[#333333] bg-[#141414] p-6 space-y-6 font-mono">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#f5ff00]">
                      Domain CISO Defense Posture: {mitigationData.domain}
                    </span>
                  </div>
                  <p className="text-sm font-sans text-white leading-relaxed font-medium">
                    {mitigationData.domainExecutiveBrief}
                  </p>
                  <div className="p-3 bg-black border border-[#262626] text-xs space-y-1">
                    <span className="text-[10px] uppercase font-bold text-rose-400 block">
                      Active Threat Actor Vector Context:
                    </span>
                    <p className="text-[#aaaaaa] text-xs leading-relaxed">
                      {mitigationData.threatContext}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:col-span-2">
                  <div className="p-4 bg-black border border-[#262626] space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#888888] block">
                      Domain Maturity Score
                    </span>
                    <div className="text-3xl font-syne font-black text-[#f5ff00]">
                      {mitigationData.overallMaturityScore}
                      <span className="text-xs font-mono text-[#888888]">/100</span>
                    </div>
                    <div className="text-[10px] text-[#888888]">
                      Tier: {mitigationData.overallMaturityScore >= 80 ? 'Optimized' : 'Managed Hardening'}
                    </div>
                  </div>

                  <div className="p-4 bg-black border border-[#262626] space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#888888] block">
                      Defense Posture Ratio
                    </span>
                    <div className="text-lg font-syne font-bold text-emerald-400">
                      {mitigationData.proactiveVsReactiveRatio}
                    </div>
                    <div className="text-[10px] text-[#888888]">Proactive vs. Reactive Index</div>
                  </div>

                  <div className="p-4 bg-black border border-[#262626] space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#888888] block">
                      Projected Risk Drop
                    </span>
                    <div className="text-3xl font-syne font-black text-cyan-400">
                      -{mitigationData.estimatedAggregateRiskReduction}%
                    </div>
                    <div className="text-[10px] text-[#888888]">Net Residual Risk Reduction</div>
                  </div>

                  <div className="p-4 bg-black border border-[#262626] space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#888888] block">
                      Framework Alignment
                    </span>
                    <div className="text-xs font-bold text-white">NIST SP 800-53 Rev. 5</div>
                    <div className="text-[10px] text-[#888888]">CSA CCM v4.1.0 • ISO 27001</div>
                  </div>
                </div>
              </div>

              {/* Framework Mapping Badges */}
              <div className="pt-4 border-t border-[#262626] flex items-center justify-between gap-4 flex-wrap text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-[#888888]">
                    Covered Controls:
                  </span>
                  {mitigationData.frameworkMappings.nistSp80053.map((ctrl) => (
                    <span
                      key={ctrl}
                      className="px-2 py-0.5 bg-black border border-[#333333] text-[10px] font-bold text-[#f5ff00]"
                    >
                      {ctrl}
                    </span>
                  ))}
                </div>

                <div className="text-[10px] text-[#666666]">
                  Generated via {mitigationData.engineUsed}
                </div>
              </div>
            </div>
          )}

          {/* List of Proactive Mitigation Cards */}
          <div className="space-y-4">
            {filteredMitigations.length === 0 ? (
              <div className="border border-[#333333] bg-[#141414] p-12 text-center space-y-3 font-mono">
                <ShieldCheck className="w-10 h-10 text-[#555555] mx-auto" />
                <p className="text-sm text-[#aaaaaa]">
                  No proactive mitigations match the selected domain and filter criteria.
                </p>
                <button
                  onClick={() => {
                    setSelectedMitigationDomain('ALL');
                    setSelectedMitigationStrategy('ALL');
                    setSelectedUrgencyFilter('ALL');
                  }}
                  className="px-4 py-2 bg-[#f5ff00] text-black text-xs font-bold uppercase tracking-wider"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredMitigations.map((sug) => {
                const isApplied = appliedMitigationIds.has(sug.id);
                const isExpanded = expandedSnippetId === sug.id;
                const riskDropPct = Math.round(
                  ((sug.currentResidualRisk - sug.projectedResidualRisk) / (sug.currentResidualRisk || 1)) * 100
                );

                return (
                  <div
                    key={sug.id}
                    className={`border transition-all duration-200 font-mono ${
                      isApplied
                        ? 'border-emerald-700/80 bg-[#101912]'
                        : 'border-[#262626] bg-[#141414] hover:border-[#444444]'
                    } p-6 space-y-5`}
                  >
                    {/* Header Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#262626] pb-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 border ${getUrgencyColorClass(
                              sug.urgency
                            )}`}
                          >
                            {sug.urgency.replace('_', ' ')}
                          </span>

                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 border ${getStrategyColorClass(
                              sug.strategyType
                            )}`}
                          >
                            {sug.strategyType.replace('_', ' ')}
                          </span>

                          <button
                            onClick={() => onSelectControlForReview(sug.targetControlId)}
                            className="text-[10px] font-bold px-2 py-0.5 bg-black border border-[#333333] text-[#f5ff00] hover:border-[#f5ff00] flex items-center gap-1 transition"
                            title="Inspect Control in RCSA Questionnaire"
                          >
                            <span>{sug.targetControlId}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>

                          <span className="text-[10px] text-[#888888]">
                            {sug.controlTitle} • <strong className="text-white">{sug.domain}</strong>
                          </span>
                        </div>

                        <h4 className="text-lg sm:text-xl font-syne font-bold text-white leading-snug">
                          {sug.title}
                        </h4>
                      </div>

                      {/* Applied Status Badge */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isApplied && (
                          <span className="px-2.5 py-1 bg-emerald-950 border border-emerald-600 text-emerald-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-emerald-400" />
                            Applied to Roadmap
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Risk Transformation Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-black border border-[#262626]">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#888888] block">
                          Inherent Baseline
                        </span>
                        <div className="text-base font-bold text-[#f5ff00]">
                          {sug.inherentRisk.toFixed(1)}
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#888888] block">
                          Current Residual
                        </span>
                        <div className="text-base font-bold text-rose-400">
                          {sug.currentResidualRisk.toFixed(1)}
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#888888] block">
                          Projected Residual
                        </span>
                        <div className="text-base font-bold text-emerald-400 flex items-center gap-1">
                          <span>{sug.projectedResidualRisk.toFixed(1)}</span>
                          <span className="text-[10px] text-emerald-300">(-{riskDropPct}%)</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#888888] block">
                          CEF Gain / Cost
                        </span>
                        <div className="text-xs font-bold text-cyan-300">
                          +{sug.estimatedCEFImprovement.toFixed(2)} CEF • {sug.implementationCost}
                        </div>
                      </div>
                    </div>

                    {/* Core Architectural Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-rose-400 block mb-0.5">
                            Deficiency / Vulnerability Addressed:
                          </span>
                          <p className="text-[#cccccc] text-[11px] leading-relaxed">
                            {sug.vulnerabilityAddressed}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#f5ff00] block mb-0.5">
                            Proactive Architecture Strategy:
                          </span>
                          <p className="text-[#dddddd] text-[11px] leading-relaxed">
                            {sug.proactiveStrategy}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-0.5">
                            Technical Implementation & Guardrails:
                          </span>
                          <p className="text-[#cccccc] text-[11px] leading-relaxed">
                            {sug.technicalImplementation}
                          </p>
                        </div>

                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
                            Compensating Safeguard & Defense Multiplier:
                          </span>
                          <p className="text-[#aaaaaa] text-[11px] leading-relaxed">
                            {sug.compensatingSafeguard} — <em className="text-white not-italic">{sug.defenseMultiplier}</em>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Configuration / CLI Snippet Accordion */}
                    {sug.configurationSnippet && (
                      <div className="border border-[#262626] bg-black">
                        <button
                          onClick={() =>
                            setExpandedSnippetId(isExpanded ? null : sug.id)
                          }
                          className="w-full px-3.5 py-2 flex items-center justify-between text-left text-xs font-mono text-[#888888] hover:text-white transition"
                        >
                          <span className="flex items-center gap-2 text-[11px] text-[#f5ff00] font-bold">
                            <Terminal className="w-3.5 h-3.5" />
                            Technical Configuration / Policy Snippet
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#666666]">
                              {isExpanded ? 'Hide Code' : 'View Code'}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="p-3.5 border-t border-[#262626] bg-[#0c0c0c] relative">
                            <button
                              onClick={() =>
                                handleCopy(sug.configurationSnippet || '', `snippet_${sug.id}`)
                              }
                              className="absolute top-3 right-3 px-2 py-1 bg-[#1e1e1e] hover:bg-[#333333] text-[10px] font-bold text-white border border-[#444444] flex items-center gap-1"
                            >
                              {copiedKey === `snippet_${sug.id}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-[#f5ff00]" />
                              )}
                              <span>
                                {copiedKey === `snippet_${sug.id}` ? 'Copied' : 'Copy'}
                              </span>
                            </button>
                            <pre className="text-[11px] text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed pr-16">
                              {sug.configurationSnippet}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Audit Telemetry Proof & Actions Footer */}
                    <div className="pt-3 border-t border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="text-[11px] text-[#888888] flex items-center gap-1.5 flex-wrap">
                        <span className="text-[#666666]">Auditor Proof:</span>
                        <span className="text-white font-medium">{sug.auditValidationMetric}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            handleCopy(
                              `### Proactive Mitigation: ${sug.title}\n- Target Control: ${sug.targetControlId} (${sug.controlTitle})\n- Strategy: ${sug.strategyType}\n- Urgency: ${sug.urgency}\n- Risk Delta: ${sug.currentResidualRisk} -> ${sug.projectedResidualRisk}\n- Strategy: ${sug.proactiveStrategy}\n- Technical Implementation: ${sug.technicalImplementation}\n- Compensating Safeguard: ${sug.compensatingSafeguard}\n- Audit Metric: ${sug.auditValidationMetric}\n\nConfiguration:\n\`\`\`\n${sug.configurationSnippet || 'N/A'}\n\`\`\``,
                              `spec_${sug.id}`
                            )
                          }
                          className="px-2.5 py-1.5 bg-[#1a1a1a] hover:bg-[#262626] text-[#aaaaaa] hover:text-white border border-[#333333] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition"
                        >
                          {copiedKey === `spec_${sug.id}` ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-[#888888]" />
                          )}
                          <span>{copiedKey === `spec_${sug.id}` ? 'Copied' : 'Copy Spec'}</span>
                        </button>

                        <button
                          onClick={() => handleApplySingleMitigation(sug)}
                          disabled={isApplied}
                          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                            isApplied
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 opacity-60 cursor-default'
                              : 'bg-[#f5ff00] text-black hover:bg-yellow-300'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{isApplied ? 'Applied' : 'Apply to Roadmap'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

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
