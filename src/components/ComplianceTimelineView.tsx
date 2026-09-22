import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, BarChart } from '@mui/x-charts';
import {
  Calendar,
  Clock,
  TrendingDown,
  TrendingUp,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  ArrowRight,
  Plus,
  Download,
  Filter,
  Layers,
  Sparkles,
  GitCommit,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  Flame,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart,
  RefreshCw,
  Sliders,
  ChevronRight,
  Save,
  Trash2,
  FileSpreadsheet,
  FileText,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import {
  RCSAPayload,
  RCSAVersionSnapshot,
  RCSADomainType,
  RiskDomain,
  AssessmentWorkflowStage,
  DomainMilestone,
  MilestoneStatus,
  MilestoneCategory,
} from '../types';
import {
  getSavedVersionSnapshots,
  saveVersionSnapshot,
  createSnapshotFromAssessment,
} from '../data/versionSnapshots';
import { getMilestonesForDomain, computeRenewalSummary } from '../data/domainMilestones';
import { RCSA_DOMAIN_CONFIGS } from '../data/nistControls';
import { SECTOR_PROFILES } from '../data/sectorProfiles';

interface ComplianceTimelineViewProps {
  assessment: RCSAPayload;
  onNavigateToStage: (stage: AssessmentWorkflowStage) => void;
  onSelectControlForReview?: (controlId: string) => void;
}

type ChartMetricMode = 'risk_progression' | 'compliance_cef' | 'deficiency_burndown' | 'domain_trajectory';
type TimeFilterMode = 'all' | 'historical' | 'projected';
type SimulationScenario = 'steady' | 'accelerated' | 'threat_surge';

interface TimelineDataPoint {
  id: string;
  label: string;
  shortLabel: string;
  date: string;
  isProjected?: boolean;
  inherentRisk: number;
  residualRisk: number;
  cef: number; // 0.0 - 1.0 (percentage)
  compliancePct: number; // 0 - 100%
  deficiencies: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  domainScores: {
    Cybersecurity: number;
    Privacy: number;
    'Information Security': number;
    Governance: number;
  };
  description: string;
}

export const ComplianceTimelineView: React.FC<ComplianceTimelineViewProps> = ({
  assessment,
  onNavigateToStage,
  onSelectControlForReview,
}) => {
  // 1. Version Snapshots State
  const [snapshots, setSnapshots] = useState<RCSAVersionSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('current');
  const [compareSnapshotId, setCompareSnapshotId] = useState<string>('snap-v1.0');
  
  // 2. Chart Configurations
  const [chartMode, setChartMode] = useState<ChartMetricMode>('risk_progression');
  const [timeFilter, setTimeFilter] = useState<TimeFilterMode>('all');
  const [hoveredPoint, setHoveredPoint] = useState<TimelineDataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  
  // 3. AI Predictive Simulation
  const [simulationScenario, setSimulationScenario] = useState<SimulationScenario>('steady');
  const [isSimulating, setIsSimulating] = useState(false);
  const [showToleranceThreshold, setShowToleranceThreshold] = useState(true);
  const riskToleranceThreshold = 8.0; // Standard enterprise tolerance ceiling

  // 4. Milestone Tracker
  const [milestones, setMilestones] = useState<DomainMilestone[]>(() => {
    return getMilestonesForDomain(assessment.rcsaDomain || 'All');
  });
  const [milestoneFilter, setMilestoneFilter] = useState<string>('ALL');

  // 5. Snapshot Modal & Form
  const [isCreateSnapshotModalOpen, setIsCreateSnapshotModalOpen] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState('');
  const [newSnapshotNotes, setNewSnapshotNotes] = useState('');
  const [newCreatedBy, setNewCreatedBy] = useState(assessment.organizationProfile.assessorName || 'Lead Risk Assessor');
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Load Saved Snapshots from localStorage on mount
  useEffect(() => {
    const loaded = getSavedVersionSnapshots();
    setSnapshots(loaded);
  }, []);

  // Compute Current Assessment Live Metrics
  const currentTotal = assessment.controls.length || 1;
  const currentAssessed = assessment.controls.filter((c) => c.status !== 'NOT_EVALUATED').length;
  const currentAvgInherent = Number(
    (assessment.controls.reduce((s, c) => s + c.inherentRisk, 0) / currentTotal).toFixed(1)
  );
  const currentAvgResidual = Number(
    (assessment.controls.reduce((s, c) => s + c.residualRisk, 0) / currentTotal).toFixed(1)
  );
  const currentAvgCEF = Number(
    (assessment.controls.reduce((s, c) => s + c.calculatedCEF, 0) / currentTotal).toFixed(2)
  );
  const currentCritical = assessment.controls.filter((c) => c.status === 'CRITICAL_DEFICIENCY').length;
  const currentHigh = assessment.controls.filter((c) => c.status === 'NEEDS_ATTENTION' && c.inherentRisk >= 15).length;
  const currentMedium = assessment.controls.filter((c) => c.status === 'NEEDS_ATTENTION' && c.inherentRisk < 15).length;
  const currentLow = assessment.controls.filter((c) => c.status === 'SATISFACTORY').length;
  const currentComplianceRate = Math.round(
    (assessment.controls.filter((c) => c.status === 'COMPLIANT' || c.status === 'SATISFACTORY').length / currentTotal) * 100
  );

  // Compute Domain Specific Current Scores
  const computeCurrentDomainScore = (domainName: RiskDomain) => {
    const domainControls = assessment.controls.filter((c) => c.domain === domainName);
    if (!domainControls.length) return currentAvgResidual;
    return Number((domainControls.reduce((s, c) => s + c.residualRisk, 0) / domainControls.length).toFixed(1));
  };

  // Compile Comprehensive Timeline Progression Series
  const timelineSeries: TimelineDataPoint[] = useMemo(() => {
    const series: TimelineDataPoint[] = [];

    // 1. Add Historical Snapshots
    snapshots.forEach((snap) => {
      series.push({
        id: snap.id,
        label: snap.versionTag,
        shortLabel: snap.versionTag.split(' ')[0] || snap.id,
        date: snap.timestamp.split('T')[0],
        isProjected: false,
        inherentRisk: snap.inherentRiskScore || 18.0,
        residualRisk: snap.residualRiskScore,
        cef: snap.controlEffectivenessScore,
        compliancePct: Math.round(snap.controlEffectivenessScore * 100),
        deficiencies: {
          critical: snap.deficienciesCount?.critical ?? 3,
          high: snap.deficienciesCount?.high ?? 5,
          medium: snap.deficienciesCount?.medium ?? 4,
          low: snap.deficienciesCount?.low ?? 2,
        },
        domainScores: {
          Cybersecurity: snap.domainScores?.Cybersecurity?.residual ?? 15.0,
          Privacy: snap.domainScores?.Privacy?.residual ?? 14.5,
          'Information Security': snap.domainScores?.['Information Security']?.residual ?? 14.0,
          Governance: snap.domainScores?.Governance?.residual ?? 12.0,
        },
        description: snap.notes,
      });
    });

    // 2. Add Current Active Assessment Working Copy
    series.push({
      id: 'current',
      label: `Current Working Assessment (${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`,
      shortLabel: 'Current',
      date: new Date().toISOString().split('T')[0],
      isProjected: false,
      inherentRisk: currentAvgInherent,
      residualRisk: currentAvgResidual,
      cef: currentAvgCEF,
      compliancePct: currentComplianceRate,
      deficiencies: {
        critical: currentCritical,
        high: currentHigh,
        medium: currentMedium,
        low: currentLow,
      },
      domainScores: {
        Cybersecurity: computeCurrentDomainScore('Cybersecurity'),
        Privacy: computeCurrentDomainScore('Privacy'),
        'Information Security': computeCurrentDomainScore('Information Security'),
        Governance: computeCurrentDomainScore('Governance'),
      },
      description: 'Active real-time evaluation with current control responses and uploaded evidence.',
    });

    // 3. Add Projected Simulation Forward Data Points based on selected scenario
    let projected30dResidual = Math.max(3.0, currentAvgResidual - 1.8);
    let projected90dResidual = Math.max(2.5, currentAvgResidual - 3.4);
    let projectedCEF = Math.min(0.95, currentAvgCEF + 0.14);
    let projectedCritical = Math.max(0, currentCritical - 1);
    let projectedHigh = Math.max(1, currentHigh - 2);

    if (simulationScenario === 'accelerated') {
      projected30dResidual = Math.max(2.5, currentAvgResidual - 2.6);
      projected90dResidual = Math.max(2.0, currentAvgResidual - 4.8);
      projectedCEF = Math.min(0.98, currentAvgCEF + 0.22);
      projectedCritical = 0;
      projectedHigh = 0;
    } else if (simulationScenario === 'threat_surge') {
      projected30dResidual = Math.min(19.0, currentAvgResidual + 2.2);
      projected90dResidual = Math.min(18.0, currentAvgResidual + 1.4);
      projectedCEF = Math.max(0.35, currentAvgCEF - 0.08);
      projectedCritical = currentCritical + 2;
      projectedHigh = currentHigh + 3;
    }

    // 90-Day Post-Remediation Projection
    series.push({
      id: 'projected_q4',
      label: `Q4 2026 Target (${simulationScenario === 'accelerated' ? 'Accelerated Sprint' : simulationScenario === 'threat_surge' ? 'Threat Surge Stress' : 'Remediation Roadmap'})`,
      shortLabel: 'Q4 Forecast',
      date: '2026-11-30',
      isProjected: true,
      inherentRisk: currentAvgInherent,
      residualRisk: Number(projected90dResidual.toFixed(1)),
      cef: Number(projectedCEF.toFixed(2)),
      compliancePct: Math.round(projectedCEF * 100),
      deficiencies: {
        critical: projectedCritical,
        high: projectedHigh,
        medium: Math.max(1, currentMedium - 1),
        low: currentLow + 3,
      },
      domainScores: {
        Cybersecurity: Math.max(2.5, computeCurrentDomainScore('Cybersecurity') - 2.5),
        Privacy: Math.max(2.5, computeCurrentDomainScore('Privacy') - 2.0),
        'Information Security': Math.max(2.5, computeCurrentDomainScore('Information Security') - 2.2),
        Governance: Math.max(2.5, computeCurrentDomainScore('Governance') - 1.8),
      },
      description: `AI simulation assuming completion of scheduled P0/P1 remediation roadmap items under ${simulationScenario.replace('_', ' ')} conditions.`,
    });

    // Sort series chronologically
    return series.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [snapshots, currentAvgInherent, currentAvgResidual, currentAvgCEF, currentCritical, currentHigh, currentMedium, currentLow, currentComplianceRate, simulationScenario]);

  // Filtered Series based on time range
  const filteredSeries = useMemo(() => {
    if (timeFilter === 'historical') return timelineSeries.filter((p) => !p.isProjected);
    if (timeFilter === 'projected') return timelineSeries.filter((p) => p.id === 'current' || p.isProjected);
    return timelineSeries;
  }, [timelineSeries, timeFilter]);

  // Selected Active Data Point for Inspection
  const activeInspectionPoint = useMemo(() => {
    return timelineSeries.find((p) => p.id === selectedSnapshotId) || timelineSeries[timelineSeries.length - 1];
  }, [timelineSeries, selectedSnapshotId]);

  // Baseline Comparison Point
  const comparisonPoint = useMemo(() => {
    return timelineSeries.find((p) => p.id === compareSnapshotId) || timelineSeries[0];
  }, [timelineSeries, compareSnapshotId]);

  // Compute Delta between Active Inspection and Comparison Point
  const deltaResidual = Number((activeInspectionPoint.residualRisk - comparisonPoint.residualRisk).toFixed(1));
  const deltaCEF = Math.round((activeInspectionPoint.cef - comparisonPoint.cef) * 100);
  const deltaCritical = activeInspectionPoint.deficiencies.critical - comparisonPoint.deficiencies.critical;
  const overallReductionPct = comparisonPoint.residualRisk > 0 
    ? Math.round(((comparisonPoint.residualRisk - activeInspectionPoint.residualRisk) / comparisonPoint.residualRisk) * 100)
    : 0;

  // Handle Snapshot Capture
  const handleCaptureSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newVersionTag.trim() || `v${(snapshots.length + 1).toFixed(1)} (${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`;
    const snap = createSnapshotFromAssessment(
      assessment,
      tag,
      newSnapshotNotes.trim() || 'Point-in-time compliance checkpoint captured from timeline view.',
      newCreatedBy.trim()
    );
    const updated = saveVersionSnapshot(snap);
    setSnapshots(updated);
    setSelectedSnapshotId(snap.id);
    setIsCreateSnapshotModalOpen(false);
    setNewVersionTag('');
    setNewSnapshotNotes('');
    setNotificationToast(`Successfully captured and archived snapshot '${snap.versionTag}'.`);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // Milestone Status Toggle
  const toggleMilestone = (id: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextStatus: MilestoneStatus =
            m.status === 'COMPLETED' ? 'IN_PROGRESS' : m.status === 'IN_PROGRESS' ? 'COMPLETED' : 'IN_PROGRESS';
          return {
            ...m,
            status: nextStatus,
            progressPct: nextStatus === 'COMPLETED' ? 100 : nextStatus === 'IN_PROGRESS' ? 50 : 0,
          };
        }
        return m;
      })
    );
  };

  // Filtered Milestones
  const filteredMilestones = milestones.filter((m) => {
    if (milestoneFilter === 'ALL') return true;
    if (milestoneFilter === 'IN_PROGRESS') return m.status === 'IN_PROGRESS';
    if (milestoneFilter === 'CRITICAL') return m.criticality === 'CRITICAL' || m.status === 'CRITICAL_PATH';
    if (milestoneFilter === 'AUDITS') return m.category === 'AUDIT_MILESTONE' || m.category === 'REGULATORY_FILING';
    return true;
  });

  // Export Timeline to JSON
  const handleExportTimelineJSON = () => {
    const exportData = {
      system: assessment.organizationProfile.targetSystem,
      sector: assessment.organizationProfile.sector,
      exportedAt: new Date().toISOString(),
      timelineSeries,
      milestones,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance_timeline_${assessment.organizationProfile.targetSystem.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Timeline to CSV
  const handleExportTimelineCSV = () => {
    const headers = ['Snapshot ID', 'Label', 'Date', 'Type', 'Inherent Risk', 'Residual Risk', 'CEF %', 'Compliance %', 'Critical Deficiencies', 'High Deficiencies', 'Cybersecurity Risk', 'Privacy Risk', 'InfoSec Risk', 'Governance Risk'];
    const rows = timelineSeries.map((p) => [
      p.id,
      `"${p.label}"`,
      p.date,
      p.isProjected ? 'Projected Forecast' : 'Verified Assessment',
      p.inherentRisk,
      p.residualRisk,
      `${Math.round(p.cef * 100)}%`,
      `${p.compliancePct}%`,
      p.deficiencies.critical,
      p.deficiencies.high,
      p.domainScores.Cybersecurity,
      p.domainScores.Privacy,
      p.domainScores['Information Security'],
      p.domainScores.Governance,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance_progression_timeline.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // SVG Chart Geometry Constants
  const chartWidth = 720;
  const chartHeight = 240;
  const padding = { top: 25, right: 35, bottom: 40, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Chart Coordinate Calculators
  const pointsCount = filteredSeries.length;
  const getX = (index: number) => {
    if (pointsCount <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (pointsCount - 1)) * innerWidth;
  };

  // Max scale values depending on chart mode
  const getY = (val: number, maxVal = 25) => {
    const clamped = Math.max(0, Math.min(val, maxVal));
    return padding.top + innerHeight - (clamped / maxVal) * innerHeight;
  };

  const toleranceY = getY(riskToleranceThreshold, 25);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner */}
      <div className="border border-[#262626] bg-[#141414] p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f5ff00]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 border border-[#f5ff00] bg-[#f5ff00]/10 text-[#f5ff00] text-[10px] font-mono font-bold tracking-widest uppercase">
                LONGITUDINAL_ANALYSIS
              </span>
              <span className="font-mono text-xs text-[#888888]">
                NIST SP 800-53 REV. 5 // SECTOR MATURITY PROGRESSION
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
              Compliance Timeline & Risk Progression
            </h1>
            <p className="text-xs sm:text-sm text-[#999999] max-w-3xl leading-relaxed">
              Visualize the multi-cycle evolution of security control effectiveness, monitor residual risk burndown velocity, and project 90-day compliance targets against regulatory benchmarks.
            </p>
          </div>

          {/* Quick Header CTA Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setNewVersionTag(`v${(snapshots.length + 1).toFixed(1)} Checkpoint`);
                setIsCreateSnapshotModalOpen(true);
              }}
              className="px-3.5 py-2 border border-[#f5ff00] bg-[#f5ff00] text-black hover:bg-[#e6ee00] transition text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_12px_rgba(245,255,0,0.2)]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Capture Snapshot</span>
            </button>

            <button
              onClick={handleExportTimelineCSV}
              className="px-3 py-2 border border-[#333333] bg-[#1a1a1a] hover:border-[#f5ff00] hover:text-[#f5ff00] text-[#cccccc] transition text-xs font-mono flex items-center gap-1.5"
              title="Export Timeline Series as CSV Spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleExportTimelineJSON}
              className="px-3 py-2 border border-[#333333] bg-[#1a1a1a] hover:border-[#f5ff00] hover:text-[#f5ff00] text-[#cccccc] transition text-xs font-mono flex items-center gap-1.5"
              title="Export Full JSON Snapshot Model"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationToast && (
        <div className="p-3 border border-[#10b981] bg-[#10b981]/10 text-[#10b981] font-mono text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notificationToast}</span>
          </div>
          <button onClick={() => setNotificationToast(null)} className="text-[#888888] hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* 2. Top Metric Cards (4 KPI Counters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Residual Risk Velocity */}
        <div className="border border-[#262626] bg-[#141414] p-4 relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888888] text-xs font-mono">
            <span>RESIDUAL_RISK_VELOCITY</span>
            <ShieldAlert className="w-4 h-4 text-[#f5ff00]" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white">
              {currentAvgResidual}
            </span>
            <span className="text-xs font-mono text-[#888888]">/ 25.0</span>
            <span className="ml-auto text-xs font-mono text-[#10b981] flex items-center gap-0.5 bg-[#10b981]/10 px-1.5 py-0.5 border border-[#10b981]/30">
              <TrendingDown className="w-3 h-3" />
              {overallReductionPct > 0 ? `-${overallReductionPct}%` : 'Stable'}
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#777777] flex items-center justify-between border-t border-[#222222] pt-2">
            <span>Baseline: {comparisonPoint.residualRisk}</span>
            <span className="text-[#f5ff00]">Δ {deltaResidual > 0 ? `+${deltaResidual}` : deltaResidual}</span>
          </div>
        </div>

        {/* Card 2: Control Effectiveness Factor (CEF) */}
        <div className="border border-[#262626] bg-[#141414] p-4 relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888888] text-xs font-mono">
            <span>CONTROL_EFFECTIVENESS</span>
            <ShieldCheck className="w-4 h-4 text-[#10b981]" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-[#10b981]">
              {Math.round(currentAvgCEF * 100)}%
            </span>
            <span className="text-xs font-mono text-[#888888]">CEF Index</span>
            <span className="ml-auto text-xs font-mono text-[#10b981] flex items-center gap-0.5 bg-[#10b981]/10 px-1.5 py-0.5 border border-[#10b981]/30">
              <TrendingUp className="w-3 h-3" />
              +{deltaCEF}% vs Baseline
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#777777] flex items-center justify-between border-t border-[#222222] pt-2">
            <span>Target Benchmark: 85%</span>
            <span className="text-[#10b981]">{currentAssessed}/{currentTotal} Controls</span>
          </div>
        </div>

        {/* Card 3: Critical Deficiencies Burndown */}
        <div className="border border-[#262626] bg-[#141414] p-4 relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888888] text-xs font-mono">
            <span>CRITICAL_DEFICIENCIES</span>
            <Flame className="w-4 h-4 text-[#f43f5e]" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono ${currentCritical > 0 ? 'text-[#f43f5e]' : 'text-[#10b981]'}`}>
              {currentCritical}
            </span>
            <span className="text-xs font-mono text-[#888888]">Active</span>
            <span className={`ml-auto text-xs font-mono flex items-center gap-0.5 px-1.5 py-0.5 border ${
              deltaCritical <= 0 ? 'text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30' : 'text-[#f43f5e] bg-[#f43f5e]/10 border-[#f43f5e]/30'
            }`}>
              {deltaCritical <= 0 ? `${deltaCritical} Resolved` : `+${deltaCritical} New`}
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#777777] flex items-center justify-between border-t border-[#222222] pt-2">
            <span>High Risk: {currentHigh}</span>
            <span>Needs Attn: {currentMedium}</span>
          </div>
        </div>

        {/* Card 4: Audit Health & Next Milestone */}
        <div className="border border-[#262626] bg-[#141414] p-4 relative flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#888888] text-xs font-mono">
            <span>NEXT_AUDIT_MILESTONE</span>
            <Clock className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold font-mono text-white">
              Oct 15, 2026
            </span>
            <span className="ml-auto text-xs font-mono text-[#38bdf8] bg-[#38bdf8]/10 px-1.5 py-0.5 border border-[#38bdf8]/30">
              47d Left
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#777777] flex items-center justify-between border-t border-[#222222] pt-2">
            <span>Cycle: Q3 Annual Attestation</span>
            <span className="text-[#10b981]">On Schedule</span>
          </div>
        </div>
      </div>

      {/* 3. Main Chart & Progression Visualizer Section */}
      <div className="border border-[#262626] bg-[#141414] p-6 space-y-6">
        {/* Chart Top Controls Toolbar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-[#222222] pb-5">
          {/* Chart Mode Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0c0c0c] p-1 border border-[#262626]">
            <button
              onClick={() => setChartMode('risk_progression')}
              className={`px-3 py-1.5 text-xs font-mono transition flex items-center gap-1.5 ${
                chartMode === 'risk_progression'
                  ? 'bg-[#f5ff00] text-black font-bold'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Risk Score Velocity</span>
            </button>

            <button
              onClick={() => setChartMode('compliance_cef')}
              className={`px-3 py-1.5 text-xs font-mono transition flex items-center gap-1.5 ${
                chartMode === 'compliance_cef'
                  ? 'bg-[#f5ff00] text-black font-bold'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>CEF & Compliance %</span>
            </button>

            <button
              onClick={() => setChartMode('deficiency_burndown')}
              className={`px-3 py-1.5 text-xs font-mono transition flex items-center gap-1.5 ${
                chartMode === 'deficiency_burndown'
                  ? 'bg-[#f5ff00] text-black font-bold'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Deficiency Burndown</span>
            </button>

            <button
              onClick={() => setChartMode('domain_trajectory')}
              className={`px-3 py-1.5 text-xs font-mono transition flex items-center gap-1.5 ${
                chartMode === 'domain_trajectory'
                  ? 'bg-[#f5ff00] text-black font-bold'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Domain Breakdown</span>
            </button>
          </div>

          {/* Time Filters & Simulation Modifiers */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tolerance Line Toggle */}
            {chartMode === 'risk_progression' && (
              <button
                onClick={() => setShowToleranceThreshold(!showToleranceThreshold)}
                className={`px-2.5 py-1 text-[11px] font-mono border transition flex items-center gap-1.5 ${
                  showToleranceThreshold
                    ? 'border-[#10b981] bg-[#10b981]/10 text-[#10b981]'
                    : 'border-[#333333] text-[#777777] bg-[#111111]'
                }`}
              >
                <Target className="w-3 h-3" />
                <span>Tolerance Ceiling (8.0)</span>
              </button>
            )}

            {/* Time Filter */}
            <div className="flex items-center bg-[#0c0c0c] border border-[#262626] text-xs font-mono">
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-2.5 py-1 ${timeFilter === 'all' ? 'bg-[#222222] text-[#f5ff00] font-bold' : 'text-[#777777] hover:text-white'}`}
              >
                All (Full Spectrum)
              </button>
              <button
                onClick={() => setTimeFilter('historical')}
                className={`px-2.5 py-1 ${timeFilter === 'historical' ? 'bg-[#222222] text-[#f5ff00] font-bold' : 'text-[#777777] hover:text-white'}`}
              >
                Historical Only
              </button>
              <button
                onClick={() => setTimeFilter('projected')}
                className={`px-2.5 py-1 ${timeFilter === 'projected' ? 'bg-[#222222] text-[#f5ff00] font-bold' : 'text-[#777777] hover:text-white'}`}
              >
                Forward Target
              </button>
            </div>

            {/* Predictive Scenario Switcher */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-[#262626]">
              <span className="text-[10px] font-mono text-[#777777] uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#f5ff00]" />
                Forecast:
              </span>
              <select
                value={simulationScenario}
                onChange={(e) => setSimulationScenario(e.target.value as SimulationScenario)}
                className="bg-[#0c0c0c] border border-[#333333] text-white text-xs font-mono px-2 py-1 focus:border-[#f5ff00] outline-none"
              >
                <option value="steady">Steady Remediation</option>
                <option value="accelerated">Accelerated Sprint (+40% velocity)</option>
                <option value="threat_surge">Threat Surge Stress Test</option>
              </select>
            </div>
          </div>
        </div>

        {/* MUI X-Charts Interactive Visualizer */}
        <div className="relative border border-[#222222] bg-[#0c0c0c] p-4 rounded-none overflow-x-auto">
          <div className="w-full min-w-[680px]">
            {chartMode === 'risk_progression' && (
              <LineChart
                xAxis={[
                  {
                    scaleType: 'point',
                    data: filteredSeries.map((p) => p.shortLabel),
                    tickLabelStyle: { fill: '#888888', fontFamily: 'monospace', fontSize: 11 },
                  },
                ]}
                yAxis={[
                  {
                    min: 0,
                    max: 25,
                    tickLabelStyle: { fill: '#666666', fontFamily: 'monospace', fontSize: 11 },
                  },
                ]}
                series={[
                  {
                    id: 'residual',
                    label: 'Residual Risk Score',
                    data: filteredSeries.map((p) => p.residualRisk),
                    color: '#f5ff00',
                    area: true,
                  },
                  {
                    id: 'inherent',
                    label: 'Inherent Baseline',
                    data: filteredSeries.map((p) => p.inherentRisk),
                    color: '#f59e0b',
                  },
                  ...(showToleranceThreshold
                    ? [
                        {
                          id: 'tolerance',
                          label: 'Risk Ceiling (8.0)',
                          data: filteredSeries.map(() => 8.0),
                          color: '#10b981',
                        },
                      ]
                    : []),
                ]}
                height={280}
                sx={{
                  width: '100%',
                  '& .MuiChartsAxis-line': { stroke: '#333333' },
                  '& .MuiChartsAxis-tick': { stroke: '#444444' },
                  '& .MuiChartsGrid-line': { stroke: '#222222', strokeDasharray: '2 2' },
                  '& .MuiChartsLegend-root text': {
                    fill: '#cccccc !important',
                    fontFamily: 'monospace !important',
                    fontSize: '11px !important',
                  },
                }}
              />
            )}

            {chartMode === 'compliance_cef' && (
              <LineChart
                xAxis={[
                  {
                    scaleType: 'point',
                    data: filteredSeries.map((p) => p.shortLabel),
                    tickLabelStyle: { fill: '#888888', fontFamily: 'monospace', fontSize: 11 },
                  },
                ]}
                yAxis={[
                  {
                    min: 0,
                    max: 100,
                    valueFormatter: (v: number | null) => (v !== null ? `${v}%` : ''),
                    tickLabelStyle: { fill: '#666666', fontFamily: 'monospace', fontSize: 11 },
                  },
                ]}
                series={[
                  {
                    id: 'compliance',
                    label: 'Compliance Coverage %',
                    data: filteredSeries.map((p) => p.compliancePct),
                    color: '#10b981',
                    area: true,
                  },
                  {
                    id: 'cef',
                    label: 'CEF % Factor',
                    data: filteredSeries.map((p) => Math.round(p.cef * 100)),
                    color: '#38bdf8',
                  },
                ]}
                height={280}
                sx={{
                  width: '100%',
                  '& .MuiChartsAxis-line': { stroke: '#333333' },
                  '& .MuiChartsAxis-tick': { stroke: '#444444' },
                  '& .MuiChartsGrid-line': { stroke: '#222222', strokeDasharray: '2 2' },
                  '& .MuiChartsLegend-root text': {
                    fill: '#cccccc !important',
                    fontFamily: 'monospace !important',
                    fontSize: '11px !important',
                  },
                }}
              />
            )}

            {chartMode === 'deficiency_burndown' && (
              <BarChart
                xAxis={[
                  {
                    scaleType: 'band',
                    data: filteredSeries.map((p) => p.shortLabel),
                    tickLabelStyle: { fill: '#888888', fontFamily: 'monospace', fontSize: 11 },
                  },
                ]}
                yAxis={[
                  {
                    min: 0,
                    tickLabelStyle: { fill: '#666666', fontFamily: 'monospace', fontSize: 11 },
                  },
                ]}
                series={[
                  {
                    id: 'crit',
                    label: 'Critical Gaps',
                    data: filteredSeries.map((p) => p.deficiencies.critical),
                    color: '#f43f5e',
                    stack: 'gaps',
                  },
                  {
                    id: 'high',
                    label: 'High Gaps',
                    data: filteredSeries.map((p) => p.deficiencies.high),
                    color: '#f59e0b',
                    stack: 'gaps',
                  },
                  {
                    id: 'med',
                    label: 'Medium Gaps',
                    data: filteredSeries.map((p) => p.deficiencies.medium),
                    color: '#f5ff00',
                    stack: 'gaps',
                  },
                  {
                    id: 'low',
                    label: 'Low Gaps',
                    data: filteredSeries.map((p) => p.deficiencies.low),
                    color: '#38bdf8',
                    stack: 'gaps',
                  },
                ]}
                height={280}
                sx={{
                  width: '100%',
                  '& .MuiChartsAxis-line': { stroke: '#333333' },
                  '& .MuiChartsAxis-tick': { stroke: '#444444' },
                  '& .MuiChartsGrid-line': { stroke: '#222222', strokeDasharray: '2 2' },
                  '& .MuiChartsLegend-root text': {
                    fill: '#cccccc !important',
                    fontFamily: 'monospace !important',
                    fontSize: '11px !important',
                  },
                }}
              />
            )}

            {chartMode === 'domain_trajectory' && (
              <LineChart
                xAxis={[
                  {
                    scaleType: 'point',
                    data: filteredSeries.map((p) => p.shortLabel),
                    tickLabelStyle: { fill: '#888888', fontFamily: 'monospace', fontSize: 11 },
                  },
                ]}
                yAxis={[
                  {
                    min: 0,
                    max: 25,
                    tickLabelStyle: { fill: '#666666', fontFamily: 'monospace', fontSize: 11 },
                  },
                ]}
                series={[
                  {
                    id: 'cyber',
                    label: 'Cybersecurity',
                    data: filteredSeries.map((p) => p.domainScores.Cybersecurity),
                    color: '#f43f5e',
                  },
                  {
                    id: 'privacy',
                    label: 'Privacy',
                    data: filteredSeries.map((p) => p.domainScores.Privacy),
                    color: '#38bdf8',
                  },
                  {
                    id: 'infosec',
                    label: 'Information Security',
                    data: filteredSeries.map((p) => p.domainScores['Information Security']),
                    color: '#f5ff00',
                  },
                  {
                    id: 'gov',
                    label: 'Governance',
                    data: filteredSeries.map((p) => p.domainScores.Governance),
                    color: '#10b981',
                  },
                ]}
                height={280}
                sx={{
                  width: '100%',
                  '& .MuiChartsAxis-line': { stroke: '#333333' },
                  '& .MuiChartsAxis-tick': { stroke: '#444444' },
                  '& .MuiChartsGrid-line': { stroke: '#222222', strokeDasharray: '2 2' },
                  '& .MuiChartsLegend-root text': {
                    fill: '#cccccc !important',
                    fontFamily: 'monospace !important',
                    fontSize: '11px !important',
                  },
                }}
              />
            )}
          </div>
        </div>

        {/* Legend Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#888888] border-t border-[#222222] pt-4">
          <div className="flex flex-wrap items-center gap-5">
            {chartMode === 'risk_progression' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 bg-[#f5ff00]" />
                  <span className="text-white font-bold">Residual Risk (Target: &lt; 8.0)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 bg-[#f59e0b] border-dashed border-t" />
                  <span>Inherent Risk Baseline</span>
                </div>
                {showToleranceThreshold && (
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-[#10b981] border-dashed border-t" />
                    <span className="text-[#10b981]">Risk Tolerance Ceiling</span>
                  </div>
                )}
              </>
            )}

            {chartMode === 'compliance_cef' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 bg-[#10b981]" />
                  <span className="text-white font-bold">Control Effectiveness Factor (CEF)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#10b981]/20 border border-[#10b981]" />
                  <span>NIST SP 800-53 Compliance Maturity Area</span>
                </div>
              </>
            )}

            {chartMode === 'deficiency_burndown' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#f43f5e]" />
                  <span>Critical Deficiencies</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#f59e0b]" />
                  <span>High Risk Gaps</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#f5ff00]" />
                  <span>Medium / Needs Attention</span>
                </div>
              </>
            )}

            {chartMode === 'domain_trajectory' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#f43f5e]" />
                  <span>Cybersecurity</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#38bdf8]" />
                  <span>Privacy</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#f5ff00]" />
                  <span>InfoSec</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-[#10b981]" />
                  <span>Governance</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#666666]">
            <span>Click any node to inspect point-in-time state</span>
          </div>
        </div>
      </div>

      {/* 4. Inspection & Point-in-Time Comparator Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Selected Checkpoint Inspector & Time Machine Diff */}
        <div className="lg:col-span-2 border border-[#262626] bg-[#141414] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222222] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#f5ff00]" />
                <h3 className="font-bold text-white font-mono text-sm uppercase">
                  Checkpoint Inspection & Comparator
                </h3>
              </div>
              <p className="text-xs text-[#888888] font-mono mt-0.5">
                Comparing active selection against baseline audit reference.
              </p>
            </div>

            {/* Selector Dropdowns */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-[#666666]">Active:</span>
                <select
                  value={selectedSnapshotId}
                  onChange={(e) => setSelectedSnapshotId(e.target.value)}
                  className="bg-[#0c0c0c] border border-[#333333] text-[#f5ff00] text-xs font-mono px-2 py-1 focus:border-[#f5ff00] outline-none"
                >
                  {timelineSeries.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-[#666666]">vs:</span>
                <select
                  value={compareSnapshotId}
                  onChange={(e) => setCompareSnapshotId(e.target.value)}
                  className="bg-[#0c0c0c] border border-[#333333] text-[#cccccc] text-xs font-mono px-2 py-1 focus:border-[#f5ff00] outline-none"
                >
                  {timelineSeries.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Comparative Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#0c0c0c] border border-[#222222] p-3">
              <div className="text-[10px] font-mono text-[#888888]">RESIDUAL_RISK</div>
              <div className="text-lg font-mono font-bold text-white mt-1">
                {activeInspectionPoint.residualRisk}
              </div>
              <div className="text-[11px] font-mono text-[#10b981] mt-0.5">
                {deltaResidual <= 0 ? `${deltaResidual}` : `+${deltaResidual}`} vs {comparisonPoint.residualRisk}
              </div>
            </div>

            <div className="bg-[#0c0c0c] border border-[#222222] p-3">
              <div className="text-[10px] font-mono text-[#888888]">COMPLIANCE_CEF</div>
              <div className="text-lg font-mono font-bold text-[#10b981] mt-1">
                {Math.round(activeInspectionPoint.cef * 100)}%
              </div>
              <div className="text-[11px] font-mono text-[#10b981] mt-0.5">
                +{deltaCEF}% vs {Math.round(comparisonPoint.cef * 100)}%
              </div>
            </div>

            <div className="bg-[#0c0c0c] border border-[#222222] p-3">
              <div className="text-[10px] font-mono text-[#888888]">CRITICAL_GAPS</div>
              <div className={`text-lg font-mono font-bold mt-1 ${activeInspectionPoint.deficiencies.critical > 0 ? 'text-[#f43f5e]' : 'text-[#10b981]'}`}>
                {activeInspectionPoint.deficiencies.critical}
              </div>
              <div className="text-[11px] font-mono text-[#888888] mt-0.5">
                {deltaCritical <= 0 ? `${deltaCritical} vs Baseline` : `+${deltaCritical} New`}
              </div>
            </div>

            <div className="bg-[#0c0c0c] border border-[#222222] p-3">
              <div className="text-[10px] font-mono text-[#888888]">STATUS_FLAG</div>
              <div className="text-xs font-mono font-bold text-white mt-1.5 flex items-center gap-1.5">
                {activeInspectionPoint.isProjected ? (
                  <span className="text-[#38bdf8] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Projected
                  </span>
                ) : (
                  <span className="text-[#10b981] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Attested
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-[#777777] mt-0.5">{activeInspectionPoint.date}</div>
            </div>
          </div>

          {/* Description & Narrative Notes */}
          <div className="bg-[#0c0c0c] border border-[#222222] p-4 space-y-2">
            <div className="text-xs font-mono text-[#888888] flex items-center justify-between">
              <span>CHECKPOINT_NOTES_&_AUDIT_NARRATIVE</span>
              <span className="text-[10px] text-[#555555]">{activeInspectionPoint.label}</span>
            </div>
            <p className="text-xs text-[#dddddd] leading-relaxed font-mono">
              {activeInspectionPoint.description}
            </p>
          </div>

          {/* Domain Breakdown Table */}
          <div className="space-y-2">
            <div className="text-xs font-mono text-[#888888] uppercase">
              Domain Residual Risk Comparison Across Checkpoints
            </div>
            <div className="border border-[#222222] divide-y divide-[#1f1f1f]">
              {(['Cybersecurity', 'Privacy', 'Information Security', 'Governance'] as RiskDomain[]).map((d) => {
                const activeVal = activeInspectionPoint.domainScores[d] ?? 0;
                const compVal = comparisonPoint.domainScores[d] ?? 0;
                const dDelta = Number((activeVal - compVal).toFixed(1));

                return (
                  <div key={d} className="flex items-center justify-between p-2.5 bg-[#0c0c0c] text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-none bg-[#f5ff00]" />
                      <span className="text-white font-medium">{d}</span>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[#888888] text-[10px]">Baseline: </span>
                        <span className="text-[#cccccc]">{compVal}</span>
                      </div>
                      <div className="text-right min-w-[70px]">
                        <span className="text-[#888888] text-[10px]">Active: </span>
                        <span className="text-white font-bold">{activeVal}</span>
                      </div>
                      <div className={`text-right min-w-[60px] font-bold ${dDelta <= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                        {dDelta <= 0 ? `${dDelta}` : `+${dDelta}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Snapshot Archive Manager & Quick Capture */}
        <div className="border border-[#262626] bg-[#141414] p-6 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#f5ff00]" />
                <h3 className="font-bold text-white font-mono text-sm uppercase">
                  Snapshot Archive
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-[#222222] text-[#f5ff00] px-1.5 py-0.5 border border-[#333333]">
                {timelineSeries.length} Checkpoints
              </span>
            </div>

            {/* List of Version Snapshots */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {timelineSeries.map((point) => {
                const isSelected = selectedSnapshotId === point.id;
                return (
                  <div
                    key={point.id}
                    onClick={() => setSelectedSnapshotId(point.id)}
                    className={`p-3 border transition cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'border-[#f5ff00] bg-[#f5ff00]/10 text-white'
                        : 'border-[#222222] bg-[#0c0c0c] text-[#aaaaaa] hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-white truncate max-w-[170px]">
                        {point.label}
                      </span>
                      <span className="text-[10px] font-mono text-[#888888]">{point.date}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#888888]">
                      <span>Residual: <strong className="text-[#f5ff00]">{point.residualRisk}</strong></span>
                      <span>CEF: <strong className="text-[#10b981]">{Math.round(point.cef * 100)}%</strong></span>
                      <span>Gaps: <strong className="text-[#f43f5e]">{point.deficiencies.critical}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action to Jump to Assessments / Remediation */}
          <div className="space-y-2 pt-4 border-t border-[#222222]">
            <button
              onClick={() => onNavigateToStage('remediation')}
              className="w-full py-2 border border-[#333333] bg-[#1a1a1a] hover:border-[#f5ff00] hover:text-[#f5ff00] text-white text-xs font-mono transition flex items-center justify-center gap-2"
            >
              <span>View Remediation Roadmap (POA&M)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateToStage('signoff')}
              className="w-full py-2 border border-[#222222] bg-[#0c0c0c] hover:border-[#10b981] hover:text-[#10b981] text-[#888888] text-xs font-mono transition flex items-center justify-center gap-2"
            >
              <span>Audit Sign-off & Certification</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Assessment Milestones & Regulatory Deadlines Tracker */}
      <div className="border border-[#262626] bg-[#141414] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#222222] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#f5ff00]" />
              <h3 className="font-bold text-white font-mono text-sm uppercase">
                Assessment Milestones & Regulatory Deadlines
              </h3>
            </div>
            <p className="text-xs text-[#888888] font-mono mt-0.5">
              Scheduled audit cycles, certification renewals, and statutory filing deadlines.
            </p>
          </div>

          {/* Milestone Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#0c0c0c] p-1 border border-[#262626]">
            {['ALL', 'IN_PROGRESS', 'CRITICAL', 'AUDITS'].map((f) => (
              <button
                key={f}
                onClick={() => setMilestoneFilter(f)}
                className={`px-2.5 py-1 text-xs font-mono transition ${
                  milestoneFilter === f ? 'bg-[#f5ff00] text-black font-bold' : 'text-[#888888] hover:text-white'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Milestones Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMilestones.map((milestone) => {
            const isCompleted = milestone.status === 'COMPLETED';
            const isInProgress = milestone.status === 'IN_PROGRESS';
            const isCritical = milestone.criticality === 'CRITICAL' || milestone.status === 'CRITICAL_PATH';

            return (
              <div
                key={milestone.id}
                className={`border p-4 flex flex-col justify-between gap-3 transition ${
                  isCompleted
                    ? 'border-[#10b981]/40 bg-[#10b981]/5'
                    : isCritical
                    ? 'border-[#f43f5e]/40 bg-[#f43f5e]/5'
                    : 'border-[#262626] bg-[#0c0c0c]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#888888] uppercase tracking-wider">
                      {milestone.domain} // {milestone.phase}
                    </span>
                    <button
                      onClick={() => toggleMilestone(milestone.id)}
                      className={`text-[10px] font-mono px-2 py-0.5 border uppercase font-bold transition ${
                        isCompleted
                          ? 'border-[#10b981] text-[#10b981] bg-[#10b981]/10'
                          : isInProgress
                          ? 'border-[#f5ff00] text-[#f5ff00] bg-[#f5ff00]/10'
                          : 'border-[#444444] text-[#888888]'
                      }`}
                    >
                      {milestone.status.replace('_', ' ')}
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-white font-mono">
                    {milestone.title}
                  </h4>

                  <p className="text-xs text-[#999999] leading-relaxed">
                    {milestone.description}
                  </p>
                </div>

                <div className="space-y-2 border-t border-[#1f1f1f] pt-3">
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#777777]">
                      <span>Completion</span>
                      <span className="text-[#f5ff00]">{milestone.progressPct}%</span>
                    </div>
                    <div className="w-full bg-[#1a1a1a] h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted ? 'bg-[#10b981]' : isCritical ? 'bg-[#f43f5e]' : 'bg-[#f5ff00]'
                        }`}
                        style={{ width: `${milestone.progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#888888]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#f5ff00]" />
                      {milestone.targetDate}
                    </span>
                    <span className="text-[#aaaaaa]">{milestone.ownerRole}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 6. Modal: Capture Point-in-Time Snapshot */}
      {isCreateSnapshotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border border-[#333333] bg-[#141414] w-full max-w-lg p-6 space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4 text-[#f5ff00]" />
                <h3 className="font-bold text-white font-mono text-sm uppercase">
                  Archive Assessment Snapshot
                </h3>
              </div>
              <button
                onClick={() => setIsCreateSnapshotModalOpen(false)}
                className="text-[#888888] hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCaptureSnapshot} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[#888888]">
                  Version Tag & Milestone Title *
                </label>
                <input
                  type="text"
                  required
                  value={newVersionTag}
                  onChange={(e) => setNewVersionTag(e.target.value)}
                  placeholder="e.g. v2.0 (Q3 Certified Baseline)"
                  className="w-full bg-[#0c0c0c] border border-[#333333] focus:border-[#f5ff00] text-white px-3 py-2 text-xs font-mono outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[#888888]">
                  Created By (Assessor / Auditor Name) *
                </label>
                <input
                  type="text"
                  required
                  value={newCreatedBy}
                  onChange={(e) => setNewCreatedBy(e.target.value)}
                  className="w-full bg-[#0c0c0c] border border-[#333333] focus:border-[#f5ff00] text-white px-3 py-2 text-xs font-mono outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-[#888888]">
                  Audit Notes & Checkpoint Narrative
                </label>
                <textarea
                  rows={3}
                  value={newSnapshotNotes}
                  onChange={(e) => setNewSnapshotNotes(e.target.value)}
                  placeholder="Summary of controls assessed, newly completed remediations, and remaining exposure..."
                  className="w-full bg-[#0c0c0c] border border-[#333333] focus:border-[#f5ff00] text-white p-3 text-xs font-mono outline-none resize-none"
                />
              </div>

              <div className="bg-[#0c0c0c] border border-[#222222] p-3 text-xs font-mono text-[#888888] space-y-1">
                <div className="text-white font-bold">Snapshot Preview Metrics:</div>
                <div>Residual Risk: <span className="text-[#f5ff00] font-bold">{currentAvgResidual}</span> / 25.0</div>
                <div>Control Effectiveness (CEF): <span className="text-[#10b981] font-bold">{Math.round(currentAvgCEF * 100)}%</span></div>
                <div>Critical Deficiencies: <span className="text-[#f43f5e] font-bold">{currentCritical}</span></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateSnapshotModalOpen(false)}
                  className="px-4 py-2 border border-[#333333] text-[#888888] hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-[#f5ff00] bg-[#f5ff00] text-black font-bold hover:bg-[#e6ee00] text-xs font-mono flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Snapshot to Timeline</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
