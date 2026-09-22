import { useState, useMemo } from 'react';
import {
  Shield,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Cpu,
  Activity,
  ArrowRight,
  TrendingDown,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  Play,
  RotateCcw,
  Sparkles,
  FileText,
  Edit3,
  User,
  Trash2,
} from 'lucide-react';
import {
  AssessedControl,
  RCSAPayload,
  RiskTreatmentPlan,
  RiskTreatmentItem,
  RiskTreatmentOption,
  RiskTreatmentMilestone,
  PriorityCriteriaConfig,
} from '../types';
import {
  generateRiskTreatmentPlan,
  DEFAULT_PRIORITY_CRITERIA,
  applyRTPRemediationToControls,
} from '../utils/riskTreatmentEngine';
import { exportRCSAToExcel, exportRCSAToJSON } from '../utils/exportUtils';
import { CouncilRTPDocumentView } from './CouncilRTPDocumentView';
import { WHOTemplateDocumentView } from './WHOTemplateDocumentView';
import { HighResidualRiskRemediationModal } from './HighResidualRiskRemediationModal';
import { AddWHORiskModal } from './AddWHORiskModal';
import { HighResidualRiskWorkspace } from './HighResidualRiskWorkspace';
import { StandaloneRTPPdfExportModal } from './StandaloneRTPPdfExportModal';

interface RiskTreatmentPlanViewProps {
  assessment: RCSAPayload;
  controls: AssessedControl[];
  onUpdateAssessment: (updatedAssessment: RCSAPayload) => void;
  onNavigateToControl?: (controlId: string) => void;
  onSaveSnapshot?: (versionTag: string, notes: string, author: string) => void;
}

export const RiskTreatmentPlanView: React.FC<RiskTreatmentPlanViewProps> = ({
  assessment,
  controls,
  onUpdateAssessment,
  onNavigateToControl,
  onSaveSnapshot,
}) => {
  // Initialize or pull existing RTP
  const [rtp, setRtp] = useState<RiskTreatmentPlan>(() => {
    if (assessment.riskTreatmentPlan && assessment.riskTreatmentPlan.items?.length > 0) {
      return assessment.riskTreatmentPlan;
    }
    return generateRiskTreatmentPlan(assessment);
  });

  // Top-level Navigation Mode:
  // 'council_template': Council Risk Register & Risk Treatment Plan (AUD 25/17 Template)
  // 'high_risk_workspace': Interface to define remediation steps, assign owners, set dates, and track milestones
  // 'who_template': Standard Tool 1.13 Risk Treatment Register
  // '5_steps': 5 Systematic steps post-RCSA
  // 'milestones': Product Owner Annual Tracking & Milestones
  const [viewMode, setViewMode] = useState<
    'council_template' | 'high_risk_workspace' | 'who_template' | '5_steps' | 'milestones'
  >('council_template');

  // Modal states for editing and adding
  const [editingItem, setEditingItem] = useState<RiskTreatmentItem | null>(null);
  const [showAddWHORiskModal, setShowAddWHORiskModal] = useState(false);

  // Active sub-step in 5-step mode: 'all' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5'
  const [activeStepTab, setActiveStepTab] = useState<
    'all' | 'step1' | 'step2' | 'step3' | 'step4' | 'step5' | 'milestones'
  >('all');

  // Priority Criteria configuration panel state
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [criteria, setCriteria] = useState<PriorityCriteriaConfig>(
    rtp.priorityCriteria || DEFAULT_PRIORITY_CRITERIA
  );

  // Filter states
  const [selectedProcessFilter, setSelectedProcessFilter] = useState<string>('ALL');
  const [selectedTreatmentFilter, setSelectedTreatmentFilter] = useState<string>('ALL');
  const [selectedRiskBandFilter, setSelectedRiskBandFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected item for expanded view
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Milestone modal state
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [showPdfExportModal, setShowPdfExportModal] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestonePeriod, setNewMilestonePeriod] = useState('Q2 2026');
  const [newMilestoneTargetPts, setNewMilestoneTargetPts] = useState(4.0);
  const [newMilestoneOwner, setNewMilestoneOwner] = useState(assessment.organizationProfile.assessorName || 'Product Owner');

  // Simulation Feedback state
  const [simulationResult, setSimulationResult] = useState<{
    message: string;
    pointsReduced: number;
    reducedControls: number;
    timestamp: string;
  } | null>(null);

  // Regenerate RTP when criteria changes
  const handleApplyCriteria = () => {
    const updatedPlan = generateRiskTreatmentPlan(assessment, criteria);
    setRtp(updatedPlan);
    onUpdateAssessment({
      ...assessment,
      riskTreatmentPlan: updatedPlan,
    });
    setShowCriteriaModal(false);
  };

  // Treatment option change handler
  const handleTreatmentOptionChange = (itemId: string, newOption: RiskTreatmentOption) => {
    const updatedItems = rtp.items.map((item) => {
      if (item.id !== itemId) return item;
      let rationale = item.treatmentRationale;
      if (newOption === 'MITIGATE') {
        rationale = 'Deploy technical safeguards and automated enforcement to reduce residual risk below tolerance.';
      } else if (newOption === 'TRANSFER') {
        rationale = 'Transfer residual liability via cyber insurance policy and vendor contractual SLA indemnification.';
      } else if (newOption === 'AVOID') {
        rationale = 'Discontinue high-risk legacy feature, sunset component, or isolate affected network segment.';
      } else if (newOption === 'ACCEPT') {
        rationale = 'Formally accept residual risk within executive tolerance limits with approved sign-off and annual expiry.';
      }
      return {
        ...item,
        treatmentOption: newOption,
        treatmentRationale: rationale,
      };
    });

    const updatedPlan: RiskTreatmentPlan = {
      ...rtp,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    setRtp(updatedPlan);
    onUpdateAssessment({
      ...assessment,
      riskTreatmentPlan: updatedPlan,
    });
  };

  // Toggle control automation handler (Step 4)
  const handleToggleAutomation = (itemId: string) => {
    const updatedItems = rtp.items.map((item) => {
      if (item.id !== itemId) return item;
      const nextAutomated = !item.isAutomatedSafeguard;
      // When automated, target residual risk drops significantly
      const newTargetResidual = nextAutomated
        ? Number((item.residualRisk * 0.35).toFixed(1))
        : Number((item.residualRisk * 0.65).toFixed(1));
      const newReductionPts = Number(Math.max(1.0, item.residualRisk - newTargetResidual).toFixed(1));

      return {
        ...item,
        isAutomatedSafeguard: nextAutomated,
        desiredTargetResidual: newTargetResidual,
        projectedRiskReductionPts: newReductionPts,
      };
    });

    const updatedPlan: RiskTreatmentPlan = {
      ...rtp,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    setRtp(updatedPlan);
    onUpdateAssessment({
      ...assessment,
      riskTreatmentPlan: updatedPlan,
    });
  };

  // Milestone completion update
  const handleUpdateMilestoneProgress = (milestoneId: string, deltaPct: number) => {
    const updatedMilestones = rtp.annualTracking.milestones.map((ms) => {
      if (ms.id !== milestoneId) return ms;
      const nextPct = Math.min(100, Math.max(0, ms.completionPct + deltaPct));
      const nextStatus: RiskTreatmentMilestone['status'] =
        nextPct >= 100 ? 'COMPLETED' : nextPct > 0 ? 'IN_PROGRESS' : 'PLANNED';
      return {
        ...ms,
        completionPct: nextPct,
        status: nextStatus,
      };
    });

    // Recalculate annual achieved reduction %
    const totalTarget = updatedMilestones.reduce((acc, ms) => acc + ms.targetRiskReductionPts, 0);
    const totalAchievedPts = updatedMilestones.reduce(
      (acc, ms) => acc + (ms.targetRiskReductionPts * ms.completionPct) / 100,
      0
    );
    const achievedPct = totalTarget > 0 ? Math.round((totalAchievedPts / totalTarget) * 100) : 0;
    const currentResidual = Math.max(
      rtp.annualTracking.targetAnnualResidual,
      rtp.annualTracking.baselineAnnualResidual - totalAchievedPts
    );

    const updatedPlan: RiskTreatmentPlan = {
      ...rtp,
      annualTracking: {
        ...rtp.annualTracking,
        milestones: updatedMilestones,
        achievedReductionPercent: achievedPct,
        currentAnnualResidual: Number(currentResidual.toFixed(1)),
      },
      updatedAt: new Date().toISOString(),
    };
    setRtp(updatedPlan);
    onUpdateAssessment({
      ...assessment,
      riskTreatmentPlan: updatedPlan,
    });
  };

  // Add custom milestone
  const handleAddMilestone = () => {
    if (!newMilestoneTitle.trim()) return;
    const newMs: RiskTreatmentMilestone = {
      id: `ms-custom-${Date.now().toString(36)}`,
      title: newMilestoneTitle,
      period: newMilestonePeriod,
      targetRiskReductionPts: Number(newMilestoneTargetPts),
      status: 'PLANNED',
      associatedControlIds: [],
      completionPct: 0,
      owner: newMilestoneOwner,
      verificationCriteria: 'Product Owner and Auditor validation evidence submitted upon sprint completion.',
    };

    const updatedPlan: RiskTreatmentPlan = {
      ...rtp,
      annualTracking: {
        ...rtp.annualTracking,
        milestones: [...rtp.annualTracking.milestones, newMs],
      },
      updatedAt: new Date().toISOString(),
    };
    setRtp(updatedPlan);
    onUpdateAssessment({
      ...assessment,
      riskTreatmentPlan: updatedPlan,
    });
    setNewMilestoneTitle('');
    setShowAddMilestoneModal(false);
  };

  // Simulate KRI breach / toggle
  const handleSimulateKRIBreach = (kriId: string) => {
    const updatedKris = rtp.kris.map((kri) => {
      if (kri.id !== kriId) return kri;
      const isBreached = kri.status === 'BREACHED';
      return {
        ...kri,
        status: (isBreached ? 'NORMAL' : 'BREACHED') as any,
        interimReviewTriggered: !isBreached,
        currentValue: isBreached ? Math.max(0, kri.warningThreshold - 1) : kri.breachThreshold + 2,
        lastChecked: new Date().toISOString(),
      };
    });

    const updatedPlan: RiskTreatmentPlan = {
      ...rtp,
      kris: updatedKris,
      updatedAt: new Date().toISOString(),
    };
    setRtp(updatedPlan);
    onUpdateAssessment({
      ...assessment,
      riskTreatmentPlan: updatedPlan,
    });
  };

  // Apply RTP to assessment controls matrix
  const handleApplyToAssessment = () => {
    const { updatedControls, reducedCount, totalPointsReduced } = applyRTPRemediationToControls(
      controls,
      rtp
    );

    const updatedAssessment: RCSAPayload = {
      ...assessment,
      controls: updatedControls,
      riskTreatmentPlan: {
        ...rtp,
        approvalStatus: 'PO_APPROVED',
        approvedBy: assessment.organizationProfile.assessorName || 'Product Owner',
        approvalDate: new Date().toISOString().split('T')[0],
      },
      timestamp: new Date().toISOString(),
    };

    onUpdateAssessment(updatedAssessment);

    if (onSaveSnapshot) {
      onSaveSnapshot(
        `v${(assessment.currentVersionNumber || 1) + 0.1} (Post-RTP Applied)`,
        `Applied Risk Treatment Plan (RTP): Reduced ${totalPointsReduced} risk pts across ${reducedCount} priority controls.`,
        assessment.organizationProfile.assessorName || 'Product Owner'
      );
    }

    setSimulationResult({
      message: `Risk Treatment Plan successfully applied to active assessment!`,
      pointsReduced: totalPointsReduced,
      reducedControls: reducedCount,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  };

  // Filtered RTP items
  const filteredItems = useMemo(() => {
    return rtp.items.filter((item) => {
      if (selectedProcessFilter !== 'ALL' && !item.businessProcessOrApp.includes(selectedProcessFilter)) {
        return false;
      }
      if (selectedTreatmentFilter !== 'ALL' && item.treatmentOption !== selectedTreatmentFilter) {
        return false;
      }
      if (selectedRiskBandFilter !== 'ALL' && item.riskScoreBand !== selectedRiskBandFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.controlId.toLowerCase().includes(q) ||
          item.controlTitle.toLowerCase().includes(q) ||
          item.businessProcessOrApp.toLowerCase().includes(q) ||
          item.namedOwner.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rtp.items, selectedProcessFilter, selectedTreatmentFilter, selectedRiskBandFilter, searchQuery]);

  // Unique business processes for dropdown
  const uniqueProcesses = useMemo(() => {
    const set = new Set<string>();
    rtp.items.forEach((i) => {
      const parts = i.businessProcessOrApp.split('(')[0].trim();
      set.add(parts);
    });
    return Array.from(set);
  }, [rtp.items]);

  // Breached KRIs
  const breachedKriCount = rtp.kris.filter((k) => k.status === 'BREACHED').length;

  // Update entire plan
  const handleUpdatePlan = (updatedPlan: RiskTreatmentPlan) => {
    setRtp(updatedPlan);
    onUpdateAssessment({
      ...assessment,
      riskTreatmentPlan: updatedPlan,
    });
  };

  // Update single item (from HighResidualRiskWorkspace or list)
  const handleUpdateItem = (updatedItem: RiskTreatmentItem) => {
    const updatedItems = rtp.items.map((i) => (i.id === updatedItem.id ? updatedItem : i));
    const updatedPlan: RiskTreatmentPlan = {
      ...rtp,
      items: updatedItems,
      updatedAt: new Date().toISOString(),
    };
    setRtp(updatedPlan);
    onUpdateAssessment({
      ...assessment,
      riskTreatmentPlan: updatedPlan,
    });
  };

  // Save item from HighResidualRiskRemediationModal
  const handleSaveRemediationItem = (updatedItem: RiskTreatmentItem) => {
    handleUpdateItem(updatedItem);
    setEditingItem(null);
    setSimulationResult({
      message: `Updated remediation action plan & milestones for ${updatedItem.controlId}!`,
      pointsReduced: updatedItem.projectedRiskReductionPts,
      reducedControls: 1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  };

  // Add new risk item from AddWHORiskModal
  const handleAddWHORiskItem = (newItem: RiskTreatmentItem) => {
    const updatedPlan: RiskTreatmentPlan = {
      ...rtp,
      items: [newItem, ...rtp.items],
      updatedAt: new Date().toISOString(),
    };
    setRtp(updatedPlan);
    onUpdateAssessment({
      ...assessment,
      riskTreatmentPlan: updatedPlan,
    });
    setShowAddWHORiskModal(false);
    setSimulationResult({
      message: `Added new risk concern ${newItem.controlId} to Risk Treatment Plan!`,
      pointsReduced: newItem.projectedRiskReductionPts,
      reducedControls: 1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  };

  return (
    <div className="space-y-6 pb-24 text-white animate-fadeIn font-sans">
      {/* 1. TOP BANNER: POST-RCSA RISK TREATMENT PLAN (RTP) */}
      <div className="border border-[#262626] bg-[#141414] p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#f5ff00] border border-[#333333] bg-black px-2.5 py-0.5 inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              POST-RCSA RISK TREATMENT PLAN (RTP)
            </span>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 border border-emerald-800 bg-emerald-950/60 text-emerald-300">
              Audit Status: {assessment.auditSignoff.status}
            </span>
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 border border-[#333333] bg-[#1a1a1a] text-[#888888]">
              Target: {assessment.organizationProfile.targetSystem}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-syne font-bold uppercase tracking-tight text-white">
            Risk Treatment & Annual Reduction Studio
          </h2>
          <p className="text-xs text-[#888888] max-w-3xl font-mono leading-relaxed">
            Post-RCSA governance framework prioritizing controls with Major Risk Scores between Medium-High to High.
            Defines actionable remediation roadmaps, assigns named Product Owners, formalizes treatment options (Mitigate / Transfer / Avoid / Accept),
            replaces manual checklists with automated safeguards, and tracks annual risk reduction milestones.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setShowCriteriaModal(true)}
            className="px-3.5 py-2 border border-[#333333] bg-black hover:border-[#f5ff00] hover:text-[#f5ff00] text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#f5ff00]" />
            <span>Priority Criteria</span>
          </button>

          <button
            onClick={() => setShowPdfExportModal(true)}
            className="px-3.5 py-2 border border-[#38bdf8]/60 bg-[#0c1a24] hover:border-[#38bdf8] text-[#38bdf8] text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(56,189,248,0.2)]"
            title="Export standalone Risk Treatment Plan PDF summary mirroring Council AUD 25/17 & WHO Tool 1.13 templates"
          >
            <FileText className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Export Standalone PDF Summary</span>
          </button>

          <button
            onClick={handleApplyToAssessment}
            className="px-4 py-2 bg-[#f5ff00] text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-yellow-300 transition flex items-center gap-2 shadow-[0_0_12px_rgba(245,255,0,0.25)] cursor-pointer"
            title="Apply RTP remediations and automation confidence boosts to live RCSA controls matrix"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Apply RTP to Assessment</span>
          </button>

          <button
            onClick={() => exportRCSAToExcel(assessment)}
            className="px-3 py-2 border border-[#333333] bg-[#1a1a1a] hover:border-white text-xs font-mono font-bold uppercase tracking-wider text-[#cccccc] hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            title="Export full RCSA & RTP Dossier to Excel"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Export RTP (Excel)</span>
          </button>
        </div>
      </div>

      {/* SIMULATION FEEDBACK BANNER */}
      {simulationResult && (
        <div className="border border-emerald-500/60 bg-[#0e1a12] p-4 flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300 block">
                {simulationResult.message}
              </span>
              <span className="text-[11px] font-mono text-[#aaaaaa]">
                Applied at {simulationResult.timestamp} • Reduced{' '}
                <strong className="text-white">{simulationResult.pointsReduced} pts</strong> across{' '}
                <strong className="text-white">{simulationResult.reducedControls} priority controls</strong>.
              </span>
            </div>
          </div>
          <button
            onClick={() => setSimulationResult(null)}
            className="text-xs font-mono text-[#888888] hover:text-white px-2 py-1 border border-transparent hover:border-[#333333]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* KRI BREACH WARNING BANNER */}
      {breachedKriCount > 0 && (
        <div className="border border-rose-600 bg-rose-950/40 p-4 flex items-center justify-between gap-4 animate-pulse">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300 block">
                INTERIM REVIEW TRIGGERED: {breachedKriCount} Key Risk Indicator(s) Breached
              </span>
              <span className="text-[11px] font-mono text-rose-200">
                Continuous telemetry detected threshold violation prior to annual review cycle. Mandates out-of-cycle risk assessment.
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveStepTab('step5')}
            className="px-3 py-1 bg-rose-600 text-white font-mono text-xs font-bold uppercase tracking-wider hover:bg-rose-500 transition cursor-pointer shrink-0"
          >
            Inspect KRIs →
          </button>
        </div>
      )}

      {/* 2. MODE NAVIGATION TABS */}
      <div className="border border-[#262626] bg-[#141414] p-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setViewMode('council_template')}
            className={`px-4 py-2 font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'council_template'
                ? 'bg-[#f5ff00] text-black shadow-[0_0_12px_rgba(245,255,0,0.35)]'
                : 'bg-black border border-[#333333] text-[#aaaaaa] hover:border-white hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4 text-black" />
            <span>Risk Register & RTP Template</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-black/40 text-black border border-black/20 uppercase font-bold">
              AUD 25/17
            </span>
          </button>

          <button
            onClick={() => setViewMode('high_risk_workspace')}
            className={`px-4 py-2 font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'high_risk_workspace'
                ? 'bg-[#38bdf8] text-black shadow-[0_0_12px_rgba(56,189,248,0.35)]'
                : 'bg-black border border-[#333333] text-[#aaaaaa] hover:border-white hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>High Residual Risk Workspace</span>
            <span className="text-[9px] px-1.5 py-0.2 bg-rose-950 text-rose-300 border border-rose-700 font-bold">
              {rtp.items.filter((i) => i.residualRisk >= 9.0).length} High Risk
            </span>
          </button>

          <button
            onClick={() => setViewMode('who_template')}
            className={`px-4 py-2 font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'who_template'
                ? 'bg-amber-400 text-black shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                : 'bg-black border border-[#333333] text-[#aaaaaa] hover:border-white hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Standard Tool 1.13 Register</span>
          </button>

          <button
            onClick={() => setViewMode('5_steps')}
            className={`px-4 py-2 font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              viewMode === '5_steps'
                ? 'bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                : 'bg-black border border-[#333333] text-[#aaaaaa] hover:border-white hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>5-Step Post-RCSA Workflow</span>
          </button>

          <button
            onClick={() => setViewMode('milestones')}
            className={`px-4 py-2 font-bold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'milestones'
                ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                : 'bg-black border border-[#333333] text-[#aaaaaa] hover:border-white hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Annual Tracking & Milestones</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddWHORiskModal(true)}
            className="px-3 py-1.5 bg-[#1e293b] border border-[#38bdf8] text-[#38bdf8] hover:bg-[#38bdf8] hover:text-black font-bold uppercase text-[11px] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Risk Item</span>
          </button>
        </div>
      </div>

      {/* VIEW CONDITIONAL RENDERING */}
      {viewMode === 'council_template' && (
        <CouncilRTPDocumentView
          rtp={rtp}
          onUpdatePlan={handleUpdatePlan}
          onAddNewRiskItem={() => setShowAddWHORiskModal(true)}
          onExportPdf={() => setShowPdfExportModal(true)}
        />
      )}

      {viewMode === 'who_template' && (
        <WHOTemplateDocumentView
          rtp={rtp}
          onUpdatePlan={handleUpdatePlan}
          onOpenRemediationEditor={(item) => setEditingItem(item)}
          onAddNewRiskItem={() => setShowAddWHORiskModal(true)}
          onExportPdf={() => setShowPdfExportModal(true)}
        />
      )}

      {viewMode === 'high_risk_workspace' && (
        <HighResidualRiskWorkspace
          rtp={rtp}
          onUpdateItem={handleUpdateItem}
          onOpenModal={(item) => setEditingItem(item)}
          onAddNewRisk={() => setShowAddWHORiskModal(true)}
          onOpenCriteria={() => setShowCriteriaModal(true)}
          onApplyToAssessment={handleApplyToAssessment}
        />
      )}

      {/* 3. PRODUCT OWNER ANNUAL RISK REDUCTION TRACKING GAUGE & MILESTONES */}
      {(viewMode === 'milestones' || viewMode === '5_steps') && (
      <div className="border border-[#262626] bg-[#111111] p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262626] pb-4">
          <div>
            <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#38bdf8] flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5" />
              PRODUCT OWNER ANNUAL RISK REDUCTION TRACKER
            </div>
            <h3 className="text-lg font-syne font-bold uppercase text-white mt-0.5">
              Desired vs. Achieved Annual Risk Reduction ({rtp.annualTracking.reviewCycleYear})
            </h3>
            <p className="text-xs text-[#888888] font-mono">
              Product Owner: <span className="text-white font-bold">{rtp.annualTracking.productOwnerName}</span> • System:{' '}
              <span className="text-white">{rtp.organizationSystem}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddMilestoneModal(true)}
              className="px-3 py-1.5 bg-[#1e293b] border border-[#38bdf8] text-[#38bdf8] hover:bg-[#38bdf8] hover:text-black font-mono text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Annual Milestone</span>
            </button>
          </div>
        </div>

        {/* 4 Quantitative Gauge Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border border-[#262626] bg-[#161616]">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#888888] block">
              Baseline Residual Risk
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-rose-400">
                {rtp.annualTracking.baselineAnnualResidual.toFixed(1)}
              </span>
              <span className="text-[10px] font-mono text-[#666666]">post-audit pts</span>
            </div>
            <span className="text-[10px] font-mono text-[#777777] mt-1 block">
              Starting point before treatment plan
            </span>
          </div>

          <div className="p-4 border border-[#262626] bg-[#161616]">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#888888] block">
              Desired Target Residual
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-emerald-400">
                {rtp.annualTracking.targetAnnualResidual.toFixed(1)}
              </span>
              <span className="text-[10px] font-mono text-emerald-500">
                (-{rtp.annualTracking.desiredReductionPercent}%)
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#777777] mt-1 block">
              Product Owner annual reduction target
            </span>
          </div>

          <div className="p-4 border border-[#262626] bg-[#161616]">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#888888] block">
              Current Remediated Residual
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-amber-300">
                {rtp.annualTracking.currentAnnualResidual.toFixed(1)}
              </span>
              <span className="text-[10px] font-mono text-[#888888]">active score</span>
            </div>
            <span className="text-[10px] font-mono text-[#777777] mt-1 block">
              Updates in real-time as milestones complete
            </span>
          </div>

          <div className="p-4 border border-[#262626] bg-[#161616]">
            <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#888888] block">
              Achieved Annual Progress
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-bold text-[#f5ff00]">
                {rtp.annualTracking.achievedReductionPercent}%
              </span>
              <span className="text-[10px] font-mono text-[#888888]">of target</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-black h-2 border border-[#333333] mt-2 overflow-hidden">
              <div
                className="bg-[#f5ff00] h-full transition-all duration-500"
                style={{ width: `${rtp.annualTracking.achievedReductionPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Milestone Schedule Cards (Q1 - Q4) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#aaaaaa] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#38bdf8]" />
              Annual Milestones Schedule & Deliverables
            </span>
            <span className="text-[10px] font-mono text-[#666666]">
              Click ±15% to simulate milestone completion
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {rtp.annualTracking.milestones.map((ms) => {
              const isDone = ms.status === 'COMPLETED';
              const isInProgress = ms.status === 'IN_PROGRESS';

              return (
                <div
                  key={ms.id}
                  className={`border p-4 flex flex-col justify-between gap-3 transition ${
                    isDone
                      ? 'border-emerald-700 bg-[#0e1912]'
                      : isInProgress
                      ? 'border-[#38bdf8] bg-[#0c161c]'
                      : 'border-[#262626] bg-[#141414]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-black border border-[#333333] text-[#38bdf8]">
                        {ms.period}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 border ${
                          isDone
                            ? 'border-emerald-600 text-emerald-300 bg-emerald-950'
                            : isInProgress
                            ? 'border-sky-600 text-sky-300 bg-sky-950'
                            : 'border-[#333333] text-[#888888] bg-black'
                        }`}
                      >
                        {ms.status.replace('_', ' ')}
                      </span>
                    </div>

                    <h4 className="text-xs font-mono font-bold text-white leading-snug">
                      {ms.title}
                    </h4>

                    <p className="text-[10px] font-mono text-[#888888] leading-tight">
                      Owner: <span className="text-white">{ms.owner}</span>
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#262626]">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#888888]">Target: -{ms.targetRiskReductionPts} pts</span>
                      <span className="font-bold text-white">{ms.completionPct}%</span>
                    </div>

                    <div className="w-full bg-black h-1.5 border border-[#333333] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isDone ? 'bg-emerald-400' : 'bg-[#38bdf8]'
                        }`}
                        style={{ width: `${ms.completionPct}%` }}
                      ></div>
                    </div>

                    {/* Quick increment/decrement buttons for testing */}
                    <div className="flex items-center justify-between gap-1 pt-1">
                      <button
                        onClick={() => handleUpdateMilestoneProgress(ms.id, -25)}
                        disabled={ms.completionPct <= 0}
                        className="px-2 py-0.5 bg-black border border-[#333333] text-[9px] font-mono text-[#888888] hover:text-white disabled:opacity-30 cursor-pointer"
                      >
                        -25%
                      </button>
                      <button
                        onClick={() => handleUpdateMilestoneProgress(ms.id, 25)}
                        disabled={ms.completionPct >= 100}
                        className="px-2 py-0.5 bg-black border border-[#333333] text-[9px] font-mono text-[#38bdf8] hover:bg-[#38bdf8] hover:text-black font-bold disabled:opacity-30 cursor-pointer"
                      >
                        +25%
                      </button>
                      <button
                        onClick={() => handleUpdateMilestoneProgress(ms.id, ms.completionPct >= 100 ? -100 : 100)}
                        className={`px-2 py-0.5 border text-[9px] font-mono font-bold cursor-pointer ${
                          isDone
                            ? 'border-emerald-600 bg-emerald-950 text-emerald-300'
                            : 'border-[#333333] bg-black text-[#aaaaaa] hover:border-white'
                        }`}
                      >
                        {isDone ? 'Undo' : 'Complete'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      )}

      {/* 3. FIVE POST-RCSA STEPS INTERACTIVE WORKFLOW SELECTOR & MATRIX */}
      {viewMode === '5_steps' && (
      <>
      <div className="border border-[#262626] bg-[#141414] p-4">
        <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#888888] mb-3">
          5 Systematic Steps to Reduce Risk Post-RCSA
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveStepTab('all')}
            className={`p-2.5 border text-left flex flex-col justify-between transition cursor-pointer ${
              activeStepTab === 'all'
                ? 'border-[#f5ff00] bg-[#1c1c0a] text-[#f5ff00]'
                : 'border-[#262626] bg-black text-[#888888] hover:text-white'
            }`}
          >
            <span className="text-[9px] font-bold text-[#666666] block">VIEW ALL</span>
            <span className="font-bold text-[11px] mt-1">Master Plan Matrix</span>
            <span className="text-[10px] text-[#888888] mt-1">{rtp.items.length} Controls</span>
          </button>

          <button
            onClick={() => setActiveStepTab('step1')}
            className={`p-2.5 border text-left flex flex-col justify-between transition cursor-pointer ${
              activeStepTab === 'step1'
                ? 'border-rose-500 bg-[#200e12] text-rose-300'
                : 'border-[#262626] bg-black text-[#888888] hover:text-white'
            }`}
          >
            <span className="text-[9px] font-bold text-rose-500 block">STEP 1</span>
            <span className="font-bold text-[11px] mt-1">Analyze Residual Risk</span>
            <span className="text-[10px] text-[#888888] mt-1">Inherent vs CEF</span>
          </button>

          <button
            onClick={() => setActiveStepTab('step2')}
            className={`p-2.5 border text-left flex flex-col justify-between transition cursor-pointer ${
              activeStepTab === 'step2'
                ? 'border-amber-500 bg-[#20170a] text-amber-300'
                : 'border-[#262626] bg-black text-[#888888] hover:text-white'
            }`}
          >
            <span className="text-[9px] font-bold text-amber-500 block">STEP 2</span>
            <span className="font-bold text-[11px] mt-1">Define Action Plans</span>
            <span className="text-[10px] text-[#888888] mt-1">Owners & Deadlines</span>
          </button>

          <button
            onClick={() => setActiveStepTab('step3')}
            className={`p-2.5 border text-left flex flex-col justify-between transition cursor-pointer ${
              activeStepTab === 'step3'
                ? 'border-purple-500 bg-[#1c0e24] text-purple-300'
                : 'border-[#262626] bg-black text-[#888888] hover:text-white'
            }`}
          >
            <span className="text-[9px] font-bold text-purple-500 block">STEP 3</span>
            <span className="font-bold text-[11px] mt-1">Select Treatment</span>
            <span className="text-[10px] text-[#888888] mt-1">Mitigate / Transfer / Avoid / Accept</span>
          </button>

          <button
            onClick={() => setActiveStepTab('step4')}
            className={`p-2.5 border text-left flex flex-col justify-between transition cursor-pointer ${
              activeStepTab === 'step4'
                ? 'border-[#38bdf8] bg-[#0c1c24] text-[#38bdf8]'
                : 'border-[#262626] bg-black text-[#888888] hover:text-white'
            }`}
          >
            <span className="text-[9px] font-bold text-[#38bdf8] block">STEP 4</span>
            <span className="font-bold text-[11px] mt-1">Automate Controls</span>
            <span className="text-[10px] text-[#888888] mt-1">Manual ➔ Automated</span>
          </button>

          <button
            onClick={() => setActiveStepTab('step5')}
            className={`p-2.5 border text-left flex flex-col justify-between transition cursor-pointer ${
              activeStepTab === 'step5'
                ? 'border-emerald-500 bg-[#0e2016] text-emerald-300'
                : 'border-[#262626] bg-black text-[#888888] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-emerald-500 block">STEP 5</span>
              {breachedKriCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </div>
            <span className="font-bold text-[11px] mt-1">Monitor KRIs</span>
            <span className="text-[10px] text-[#888888] mt-1">{rtp.kris.length} Telemetry Points</span>
          </button>
        </div>
      </div>

      {/* STEP 5 DEDICATED VIEW: CONTINUOUS MONITORING & KEY RISK INDICATORS (KRIs) */}
      {activeStepTab === 'step5' && (
        <div className="border border-[#262626] bg-[#111111] p-6 space-y-5 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262626] pb-4">
            <div>
              <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-emerald-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                STEP 5: CONTINUOUS MONITORING ENGINE
              </div>
              <h3 className="text-xl font-syne font-bold uppercase text-white">
                Key Risk Indicators (KRIs) & Interim Review Triggers
              </h3>
              <p className="text-xs text-[#888888] font-mono mt-1">
                Continuous telemetry tracking metrics between scheduled annual review cycles. If a KRI breaches its threshold,
                an interim out-of-cycle risk assessment review is immediately triggered.
              </p>
            </div>

            <span className="text-xs font-mono px-3 py-1 bg-black border border-[#333333] text-[#aaaaaa]">
              Active KRIs: <strong className="text-white">{rtp.kris.length}</strong> • Breached:{' '}
              <strong className={breachedKriCount > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {breachedKriCount}
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rtp.kris.map((kri) => {
              const isBreached = kri.status === 'BREACHED';
              const isWarning = kri.status === 'WARNING';

              return (
                <div
                  key={kri.id}
                  className={`border p-5 space-y-3 transition ${
                    isBreached
                      ? 'border-rose-600 bg-[#200e12]'
                      : isWarning
                      ? 'border-amber-600 bg-[#1c140a]'
                      : 'border-[#262626] bg-[#141414]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-black border border-[#333333] text-[#f5ff00]">
                      Target: {kri.targetControlId}
                    </span>
                    <span
                      className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 border ${
                        isBreached
                          ? 'border-rose-600 text-rose-300 bg-rose-950 animate-pulse'
                          : isWarning
                          ? 'border-amber-600 text-amber-300 bg-amber-950'
                          : 'border-emerald-600 text-emerald-300 bg-emerald-950'
                      }`}
                    >
                      {kri.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-mono font-bold text-white leading-snug">
                    {kri.indicatorName}
                  </h4>

                  <p className="text-[11px] font-mono text-[#aaaaaa] leading-relaxed">
                    {kri.description}
                  </p>

                  <div className="p-3 bg-black border border-[#262626] space-y-1.5 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#888888]">Current Telemetry:</span>
                      <span
                        className={`font-bold text-sm ${
                          isBreached
                            ? 'text-rose-400'
                            : isWarning
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {kri.currentValue} {kri.metricUnit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#666666]">
                      <span>Warning: {kri.warningThreshold} {kri.metricUnit}</span>
                      <span>Breach: {kri.breachThreshold} {kri.metricUnit}</span>
                    </div>
                  </div>

                  {isBreached && (
                    <div className="p-2 border border-rose-800 bg-rose-950/80 text-[10px] font-mono text-rose-300">
                      ⚠️ Threshold breach logged! Interim RCSA review flagged.
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
                    <span className="text-[9px] font-mono text-[#666666]">
                      Checked: {new Date(kri.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => handleSimulateKRIBreach(kri.id)}
                      className="px-2.5 py-1 bg-black border border-[#333333] hover:border-white text-[10px] font-mono text-[#cccccc] hover:text-white transition flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{isBreached ? 'Reset Normal' : 'Simulate Breach'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. MASTER RTP CONTROLS MATRIX / FILTER BAR */}
      <div className="space-y-4">
        {/* Filters and Search Strip */}
        <div className="border border-[#262626] bg-[#141414] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Treatment Option Filter */}
            <select
              value={selectedTreatmentFilter}
              onChange={(e) => setSelectedTreatmentFilter(e.target.value)}
              className="px-3 py-1.5 bg-black border border-[#333333] text-xs font-mono text-white focus:border-[#f5ff00] outline-none"
            >
              <option value="ALL">All Treatments (Mitigate / Transfer / Avoid / Accept)</option>
              <option value="MITIGATE">🛡️ Mitigate (New / Hardened Controls)</option>
              <option value="TRANSFER">📑 Transfer (Insurance / Vendor SLA)</option>
              <option value="AVOID">⛔ Avoid (Sunset / Discontinue)</option>
              <option value="ACCEPT">📋 Accept (Tolerance Signoff)</option>
            </select>

            {/* Risk Band Filter */}
            <select
              value={selectedRiskBandFilter}
              onChange={(e) => setSelectedRiskBandFilter(e.target.value)}
              className="px-3 py-1.5 bg-black border border-[#333333] text-xs font-mono text-white focus:border-[#f5ff00] outline-none"
            >
              <option value="ALL">All Risk Severity Bands</option>
              <option value="Critical">Critical (Score &gt;= 15.0)</option>
              <option value="High">High (Score &gt;= 12.0)</option>
              <option value="Medium-High">Medium-High (Score &gt;= 9.0)</option>
              <option value="Medium">Medium</option>
            </select>

            {/* Business Process Filter */}
            {uniqueProcesses.length > 0 && (
              <select
                value={selectedProcessFilter}
                onChange={(e) => setSelectedProcessFilter(e.target.value)}
                className="px-3 py-1.5 bg-black border border-[#333333] text-xs font-mono text-white focus:border-[#f5ff00] outline-none"
              >
                <option value="ALL">All Processes & Applications</option>
                {uniqueProcesses.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Control, Process, Owner..."
              className="px-3 py-1.5 bg-black border border-[#333333] text-xs font-mono text-white placeholder-[#666666] focus:border-[#f5ff00] outline-none w-full sm:w-64"
            />
            <span className="text-xs font-mono text-[#888888] whitespace-nowrap">
              {filteredItems.length} of {rtp.items.length} items
            </span>
          </div>
        </div>

        {/* 5. ITEM CARDS GRID: 5 STEPS VISUALLY HIGHLIGHTED ON EACH CARD */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="border border-[#262626] bg-[#141414] p-12 text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h4 className="text-base font-syne font-bold uppercase text-white">
                No Controls Match Selection Criteria
              </h4>
              <p className="text-xs font-mono text-[#888888] max-w-md mx-auto">
                No items match the currently selected filters or priority threshold. Adjust criteria or search terms.
              </p>
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isExpanded = expandedItemId === item.id;
              const isMitigate = item.treatmentOption === 'MITIGATE';
              const isTransfer = item.treatmentOption === 'TRANSFER';
              const isAvoid = item.treatmentOption === 'AVOID';
              const isAccept = item.treatmentOption === 'ACCEPT';

              const isCritical = item.riskScoreBand === 'Critical';
              const isHigh = item.riskScoreBand === 'High' || item.riskScoreBand === 'Medium-High';

              return (
                <div
                  key={item.id}
                  className={`border transition bg-[#141414] ${
                    isCritical
                      ? 'border-rose-900/80 hover:border-rose-500'
                      : isHigh
                      ? 'border-amber-900/80 hover:border-amber-500'
                      : 'border-[#262626] hover:border-[#444444]'
                  }`}
                >
                  {/* Card Header Bar */}
                  <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#222222]">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-[#666666]">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <span
                          onClick={() => onNavigateToControl && onNavigateToControl(item.controlId)}
                          className="font-mono text-xs font-bold px-2 py-0.5 border border-[#333333] bg-black text-[#f5ff00] cursor-pointer hover:bg-[#f5ff00] hover:text-black transition"
                          title="View in Controls Studio"
                        >
                          {item.controlId}
                        </span>
                        <h4 className="text-sm sm:text-base font-syne font-bold uppercase text-white">
                          {item.controlTitle}
                        </h4>

                        <span
                          className={`text-[9px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 border ${
                            isCritical
                              ? 'border-rose-600 text-rose-300 bg-rose-950'
                              : isHigh
                              ? 'border-amber-600 text-amber-300 bg-amber-950'
                              : 'border-[#333333] text-[#aaaaaa] bg-black'
                          }`}
                        >
                          Risk: {item.riskScoreBand} ({item.residualRisk.toFixed(1)})
                        </span>

                        <span className="text-[9px] font-mono px-2 py-0.5 bg-[#1b2533] border border-[#2b4263] text-[#7dd3fc]">
                          {item.quarterMilestone}
                        </span>
                      </div>

                      <div className="text-[11px] font-mono text-[#888888] flex items-center gap-2 flex-wrap">
                        <span>Process / Enclave: <strong className="text-white">{item.businessProcessOrApp}</strong></span>
                        <span>•</span>
                        <span>Domain: <strong className="text-white">{item.domain}</strong></span>
                        <span>•</span>
                        <span>Named Owner: <strong className="text-white">{item.namedOwner}</strong></span>
                      </div>
                    </div>

                    {/* Fast Treatment Selector & Expand Toggle */}
                    <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
                      <select
                        value={item.treatmentOption}
                        onChange={(e) =>
                          handleTreatmentOptionChange(item.id, e.target.value as RiskTreatmentOption)
                        }
                        className={`px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border cursor-pointer ${
                          isMitigate
                            ? 'border-sky-500 bg-sky-950/60 text-sky-300'
                            : isTransfer
                            ? 'border-purple-500 bg-purple-950/60 text-purple-300'
                            : isAvoid
                            ? 'border-rose-500 bg-rose-950/60 text-rose-300'
                            : 'border-emerald-500 bg-emerald-950/60 text-emerald-300'
                        }`}
                      >
                        <option value="MITIGATE">🛡️ Mitigate (Controls)</option>
                        <option value="TRANSFER">📑 Transfer (Insurance/SLA)</option>
                        <option value="AVOID">⛔ Avoid (Deprecate)</option>
                        <option value="ACCEPT">📋 Accept (Tolerate)</option>
                      </select>

                      <button
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className="px-2.5 py-1.5 border border-[#333333] bg-black hover:border-white text-xs font-mono text-white flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Collapse' : 'Inspect 5 Steps'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Summary Bar: The 5 Steps Preview */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs font-mono bg-black/60">
                    {/* Step 1 Preview: Inherent vs Residual */}
                    <div className="p-3 border border-[#222222] bg-black space-y-1">
                      <span className="text-[9px] uppercase font-bold text-rose-400 block">
                        1. Residual Gap
                      </span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-[#888888]">IR {item.inherentRisk} ➔ RR</span>
                        <span className="font-bold text-sm text-rose-300">{item.residualRisk.toFixed(1)}</span>
                      </div>
                      <span className="text-[10px] text-[#666666] block">
                        CEF: {(item.currentCEF * 100).toFixed(0)}%
                      </span>
                    </div>

                    {/* Step 2 Preview: Action Plan */}
                    <div className="p-3 border border-[#222222] bg-black space-y-1">
                      <span className="text-[9px] uppercase font-bold text-amber-400 block">
                        2. Action Owner
                      </span>
                      <div className="truncate font-bold text-white text-[11px]" title={item.namedOwner}>
                        {item.namedOwner}
                      </div>
                      <span className="text-[10px] text-[#888888] block">Due: {item.deadline}</span>
                    </div>

                    {/* Step 3 Preview: Treatment Option */}
                    <div className="p-3 border border-[#222222] bg-black space-y-1">
                      <span className="text-[9px] uppercase font-bold text-purple-400 block">
                        3. Treatment Option
                      </span>
                      <span
                        className={`font-bold text-[11px] block ${
                          isMitigate
                            ? 'text-sky-300'
                            : isTransfer
                            ? 'text-purple-300'
                            : isAvoid
                            ? 'text-rose-300'
                            : 'text-emerald-300'
                        }`}
                      >
                        {item.treatmentOption}
                      </span>
                      <span className="text-[10px] text-[#666666] truncate block" title={item.treatmentRationale}>
                        {item.treatmentRationale}
                      </span>
                    </div>

                    {/* Step 4 Preview: Automation Safeguard */}
                    <div className="p-3 border border-[#222222] bg-black space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-[#38bdf8]">
                          4. Safeguard
                        </span>
                        <span
                          className={`text-[8px] font-bold px-1 py-0.2 uppercase ${
                            item.isAutomatedSafeguard
                              ? 'bg-[#0369a1] text-sky-200'
                              : 'bg-[#333333] text-[#aaaaaa]'
                          }`}
                        >
                          {item.isAutomatedSafeguard ? 'Automated' : 'Manual'}
                        </span>
                      </div>
                      <span className="text-[10px] text-white truncate block" title={item.automationMechanism}>
                        {item.automationMechanism}
                      </span>
                      <span className="text-[9px] text-emerald-400 font-bold block">
                        Confidence: {item.isAutomatedSafeguard ? '100% (1.0)' : '80% (0.8)'}
                      </span>
                    </div>

                    {/* Step 5 / Desired Target Reduction */}
                    <div className="p-3 border border-[#222222] bg-black space-y-1">
                      <span className="text-[9px] uppercase font-bold text-emerald-400 block">
                        Desired Target
                      </span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-emerald-300 font-bold text-sm">
                          {item.desiredTargetResidual.toFixed(1)} pts
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold">
                          -{item.projectedRiskReductionPts} pts
                        </span>
                      </div>
                      <span className="text-[10px] text-[#888888] block">
                        Milestone: {item.quarterMilestone}
                      </span>
                    </div>
                  </div>

                  {/* EXPANDED FULL 5-STEPS DOSSIER */}
                  {isExpanded && (
                    <div className="p-6 border-t border-[#262626] bg-[#0c0c0c] space-y-6 animate-fadeIn font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-[#222222] pb-2">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-[#f5ff00] flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" />
                          Detailed 5-Step Remediation Specification for {item.controlId}
                        </span>
                        <span className="text-[10px] text-[#666666]">
                          Priority Criteria Matched: {item.priorityCriteriaMatched.join(', ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* STEP 1: ANALYZE RESIDUAL RISK */}
                        <div className="p-4 border border-rose-900/60 bg-black space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Step 1: Analyze Residual Risk Gaps
                            </span>
                            <span className="text-[10px] text-[#888888]">
                              Deficiency: {item.residualRisk > 10 ? 'High' : 'Moderate'}
                            </span>
                          </div>
                          <p className="text-[#cccccc] text-[11px] leading-relaxed">
                            Inherent Risk score of <strong className="text-white">{item.inherentRisk}</strong> is
                            attenuated to <strong className="text-rose-400">{item.residualRisk.toFixed(1)}</strong> due
                            to Control Effectiveness Factor of{' '}
                            <strong className="text-white">{(item.currentCEF * 100).toFixed(0)}%</strong>.
                            Current safeguard leaves an unacceptable delta gap requiring treatment.
                          </p>
                          <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[10px] text-[#888888]">
                            <span>Inherent Score: {item.inherentRisk}</span>
                            <span>Current CEF: {(item.currentCEF * 100).toFixed(0)}%</span>
                            <span className="text-rose-300 font-bold">Residual: {item.residualRisk.toFixed(1)}</span>
                          </div>
                        </div>

                        {/* STEP 2: DEFINE ACTION PLANS */}
                        <div className="p-4 border border-amber-900/60 bg-black space-y-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 block">
                            Step 2: Define Action Plan & Named Owner
                          </span>
                          <div className="space-y-1 text-[11px]">
                            {item.actionPlanSteps.map((step, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-2">
                                <span className="text-amber-400 font-bold">{sIdx + 1}.</span>
                                <span className="text-[#cccccc]">{step}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[10px] text-[#aaaaaa]">
                            <span>Named Owner: <strong className="text-white">{item.namedOwner}</strong></span>
                            <span>Target SLA: <strong className="text-amber-300">{item.deadline}</strong></span>
                          </div>
                        </div>

                        {/* STEP 3: SELECT TREATMENT OPTIONS */}
                        <div className="p-4 border border-purple-900/60 bg-black space-y-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400 block">
                            Step 3: Select Treatment Option & Rationale
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-purple-950 border border-purple-700 text-purple-300 font-bold uppercase text-[10px]">
                              {item.treatmentOption}
                            </span>
                            <span className="text-[11px] text-[#cccccc]">{item.treatmentRationale}</span>
                          </div>
                          <p className="text-[10px] text-[#888888] pt-1">
                            Governance standard mandates documenting formal justification when choosing
                            transfer, avoidance, or executive risk acceptance.
                          </p>
                        </div>

                        {/* STEP 4: AUTOMATE CONTROLS */}
                        <div className="p-4 border border-sky-900/60 bg-black space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#38bdf8] flex items-center gap-1">
                              <Cpu className="w-3.5 h-3.5" />
                              Step 4: Automate Controls (Eliminate Manual Checklists)
                            </span>
                            <button
                              onClick={() => handleToggleAutomation(item.id)}
                              className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 cursor-pointer ${
                                item.isAutomatedSafeguard
                                  ? 'bg-[#38bdf8] text-black hover:bg-sky-400'
                                  : 'bg-black border border-[#38bdf8] text-[#38bdf8] hover:bg-[#38bdf8] hover:text-black'
                              }`}
                            >
                              <Sparkles className="w-3 h-3" />
                              <span>{item.isAutomatedSafeguard ? 'Automated Active' : 'Switch to Automated'}</span>
                            </button>
                          </div>

                          <div className="space-y-1 text-[11px]">
                            <div className="text-white">
                              <strong className="text-[#38bdf8]">Automated Safeguard:</strong>{' '}
                              {item.automationMechanism}
                            </div>
                            <div className="text-[#888888] text-[10px]">
                              <strong className="text-rose-400">Replaced Manual Checklist:</strong>{' '}
                              {item.manualChecklistReplaced}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[#222222] text-[10px] text-emerald-300 flex items-center justify-between">
                            <span>Confidence Factor: {item.isAutomatedSafeguard ? '1.0 (Automated System Enforced)' : '0.8 (Manual Human Checklist)'}</span>
                            <span>Yield: -{item.projectedRiskReductionPts} pts reduction</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Quick Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
                        <span className="text-[10px] text-[#666666]">
                          Annual Milestone Alignment: <strong className="text-white">{item.quarterMilestone}</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="px-3 py-1 bg-[#1e293b] border border-[#38bdf8] text-[#38bdf8] hover:bg-[#38bdf8] hover:text-black text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                          >
                            Edit Remediation & Milestones
                          </button>
                          <button
                            onClick={() => onNavigateToControl && onNavigateToControl(item.controlId)}
                            className="px-3 py-1 bg-black border border-[#333333] hover:border-[#f5ff00] hover:text-[#f5ff00] text-xs transition cursor-pointer"
                          >
                            Open Control Calibration →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      </>
      )}

      {/* MODAL: DEFINE PRIORITY CRITERIA */}
      {showCriteriaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border border-[#333333] bg-[#141414] w-full max-w-xl p-6 space-y-6 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#f5ff00]" />
                <h3 className="text-base font-syne font-bold uppercase text-white">
                  Define Organization Priority Criteria
                </h3>
              </div>
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="text-[#888888] hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-[#888888] leading-relaxed">
              Define the criteria for which controls, processes, and applications require remediation.
              Controls matching these parameters will be synthesized into the formal Risk Treatment Plan (RTP).
            </p>

            <div className="space-y-4 text-xs">
              {/* Threshold Slider: Major Risk Score */}
              <div className="p-3 border border-[#262626] bg-black space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Major Risk Score Threshold:</span>
                  <span className="text-sm font-bold text-[#f5ff00]">
                    &gt;= {criteria.minResidualRiskScore.toFixed(1)} (Medium-High to High)
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="18"
                  step="0.5"
                  value={criteria.minResidualRiskScore}
                  onChange={(e) =>
                    setCriteria({ ...criteria, minResidualRiskScore: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[#f5ff00] cursor-pointer"
                />
                <span className="text-[10px] text-[#666666] block">
                  Controls with a Major Risk Score equal to or exceeding this threshold are automatically prioritized for risk reduction.
                </span>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2.5">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criteria.includeCriticalDeficiencies}
                    onChange={(e) =>
                      setCriteria({ ...criteria, includeCriticalDeficiencies: e.target.checked })
                    }
                    className="accent-[#f5ff00]"
                  />
                  <span>Prioritize controls flagged with Critical Deficiencies</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criteria.includeNeedsAttention}
                    onChange={(e) =>
                      setCriteria({ ...criteria, includeNeedsAttention: e.target.checked })
                    }
                    className="accent-[#f5ff00]"
                  />
                  <span>Include controls with audit status "Needs Attention"</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criteria.prioritizeManualControls}
                    onChange={(e) =>
                      setCriteria({ ...criteria, prioritizeManualControls: e.target.checked })
                    }
                    className="accent-[#f5ff00]"
                  />
                  <span>Prioritize error-prone manual checklists for Step 4 automation</span>
                </label>
              </div>

              {/* CEF Threshold */}
              <div className="p-3 border border-[#262626] bg-black space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Max Control Effectiveness Factor (CEF):</span>
                  <span className="font-bold text-[#38bdf8]">
                    &lt; {(criteria.maxCEFThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="0.9"
                  step="0.05"
                  value={criteria.maxCEFThreshold}
                  onChange={(e) =>
                    setCriteria({ ...criteria, maxCEFThreshold: parseFloat(e.target.value) })
                  }
                  className="w-full accent-[#38bdf8] cursor-pointer"
                />
                <span className="text-[10px] text-[#666666] block">
                  Controls operating below this effectiveness score require corrective action.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262626]">
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="px-4 py-2 border border-[#333333] text-xs font-mono text-[#888888] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCriteria}
                className="px-4 py-2 bg-[#f5ff00] text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-yellow-300 transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-calibrate & Generate RTP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM ANNUAL MILESTONE */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border border-[#333333] bg-[#141414] w-full max-w-lg p-6 space-y-5 shadow-2xl font-mono">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-base font-syne font-bold uppercase text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#38bdf8]" />
                Add Product Owner Annual Milestone
              </h3>
              <button
                onClick={() => setShowAddMilestoneModal(false)}
                className="text-[#888888] hover:text-white text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#888888] mb-1">Milestone Title / Objective:</label>
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  placeholder="e.g. Q3: Automated Patch Management SLA Enforcement"
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#888888] mb-1">Target Period:</label>
                  <select
                    value={newMilestonePeriod}
                    onChange={(e) => setNewMilestonePeriod(e.target.value)}
                    className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
                  >
                    <option value="Q1 2026">Q1 2026</option>
                    <option value="Q2 2026">Q2 2026</option>
                    <option value="Q3 2026">Q3 2026</option>
                    <option value="Q4 2026">Q4 2026</option>
                    <option value="FY 2027">FY 2027</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#888888] mb-1">Target Reduction Points:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="20"
                    value={newMilestoneTargetPts}
                    onChange={(e) => setNewMilestoneTargetPts(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#888888] mb-1">Named Owner / Lead:</label>
                <input
                  type="text"
                  value={newMilestoneOwner}
                  onChange={(e) => setNewMilestoneOwner(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#38bdf8] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262626]">
              <button
                onClick={() => setShowAddMilestoneModal(false)}
                className="px-4 py-2 border border-[#333333] text-xs font-mono text-[#888888] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMilestone}
                className="px-4 py-2 bg-[#38bdf8] text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-sky-300 transition"
              >
                Create Milestone
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: HIGH RESIDUAL RISK REMEDIATION EDITOR */}
      {editingItem && (
        <HighResidualRiskRemediationModal
          item={editingItem}
          milestones={rtp.annualTracking.milestones}
          onSave={handleSaveRemediationItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* MODAL: ADD CUSTOM RISK TO WHO TDR LOG */}
      {showAddWHORiskModal && (
        <AddWHORiskModal
          onAdd={handleAddWHORiskItem}
          onClose={() => setShowAddWHORiskModal(false)}
        />
      )}

      {/* MODAL: STANDALONE RTP PDF EXPORT */}
      <StandaloneRTPPdfExportModal
        isOpen={showPdfExportModal}
        onClose={() => setShowPdfExportModal(false)}
        assessment={assessment}
        rtp={rtp}
      />
    </div>
  );
};
