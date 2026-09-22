import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Shield,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Zap,
  ArrowRight,
  Filter,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Sliders,
  DollarSign,
  Award,
} from 'lucide-react';
import { AssessedControl, RCSAPayload, RiskDomain } from '../types';

interface RemediationTrendROIChartProps {
  assessment: RCSAPayload;
  controls?: AssessedControl[];
  activeDomain?: string;
  onSelectDomain?: (domain: string) => void;
  onNavigateToRTP?: () => void;
  onNavigateToControl?: (controlId: string) => void;
  isCompact?: boolean;
}

export interface MilestoneProgressItem {
  id: string;
  quarter: string;
  name: string;
  focus: string;
  owner: string;
  estimatedReductionPts: number;
  completed: boolean;
  inProgress: boolean;
  associatedControls: string[];
  costEstimateK: number;
}

export const RemediationTrendROIChart: React.FC<RemediationTrendROIChartProps> = ({
  assessment,
  controls: propControls,
  activeDomain = 'ALL',
  onSelectDomain,
  onNavigateToRTP,
  onNavigateToControl,
  isCompact = false,
}) => {
  const controls = propControls || assessment.controls || [];

  // Domain Filter within Chart
  const [selectedDomain, setSelectedDomain] = useState<string>(activeDomain || 'ALL');
  // Scenario Mode: 'actual' (completed milestones only) | 'projected' (all planned milestones) | 'accelerated' (automated tooling)
  const [scenarioMode, setScenarioMode] = useState<'actual' | 'projected' | 'accelerated'>('actual');
  // Interactive milestone completion override state
  const [completedMilestoneIds, setCompletedMilestoneIds] = useState<string[]>([
    'm1_baseline',
    'm2_q1',
  ]);
  const [expandedMilestones, setExpandedMilestones] = useState(false);

  // Sync external domain filter if changed
  React.useEffect(() => {
    if (activeDomain && activeDomain !== selectedDomain) {
      setSelectedDomain(activeDomain);
    }
  }, [activeDomain]);

  // Unique domains available
  const availableDomains = useMemo(() => {
    return Array.from(new Set(controls.map((c) => c.domain)));
  }, [controls]);

  // Filtered controls based on domain
  const scopedControls = useMemo(() => {
    if (selectedDomain === 'ALL') return controls;
    return controls.filter((c) => c.domain === selectedDomain);
  }, [controls, selectedDomain]);

  // Baseline Risk Calculations for Scoped Controls
  const baselineStats = useMemo(() => {
    const total = scopedControls.length || 1;
    const avgInherent = Number(
      (scopedControls.reduce((sum, c) => sum + c.inherentRisk, 0) / total).toFixed(1)
    );
    const avgCurrentResidual = Number(
      (scopedControls.reduce((sum, c) => sum + c.residualRisk, 0) / total).toFixed(1)
    );
    const avgCurrentCEF = Number(
      (scopedControls.reduce((sum, c) => sum + c.calculatedCEF, 0) / total * 100).toFixed(0)
    );
    const criticalCount = scopedControls.filter((c) => c.residualRisk >= 15).length;
    const highCount = scopedControls.filter(
      (c) => c.residualRisk >= 10 && c.residualRisk < 15
    ).length;

    return {
      avgInherent,
      avgCurrentResidual,
      avgCurrentCEF: Number(avgCurrentCEF),
      criticalCount,
      highCount,
      totalCount: scopedControls.length,
    };
  }, [scopedControls]);

  // Defined Remediation Milestones
  const milestones: MilestoneProgressItem[] = useMemo(() => {
    const ownerName = assessment.organizationProfile.assessorName || 'Security Lead';
    return [
      {
        id: 'm1_baseline',
        quarter: 'Audit Baseline',
        name: 'Initial RCSA Scope & Gap Discovery',
        focus: 'Comprehensive NIST SP 800-53 evaluation across production systems.',
        owner: ownerName,
        estimatedReductionPts: 0,
        completed: true,
        inProgress: false,
        associatedControls: ['AC-2', 'IA-2', 'SC-7'],
        costEstimateK: 45,
      },
      {
        id: 'm2_q1',
        quarter: 'Q1 2026',
        name: 'P0 Deficiencies & Identity Hardening',
        focus: 'Hardware FIDO2 MFA (YubiKeys), SCIM 2.0 automated provisioning, and privileged access isolation.',
        owner: 'SecOps / IAM Lead',
        estimatedReductionPts: 3.8,
        completed: completedMilestoneIds.includes('m2_q1'),
        inProgress: !completedMilestoneIds.includes('m2_q1'),
        associatedControls: ['IA-2', 'AC-2', 'AC-6'],
        costEstimateK: 85,
      },
      {
        id: 'm3_q2',
        quarter: 'Q2 2026',
        name: 'Network Perimeter & Zero-Trust Mesh',
        focus: 'Deploy mTLS service mesh, automate ingress security groups, and enforce strict egress filtering.',
        owner: 'Platform Engineering',
        estimatedReductionPts: 3.2,
        completed: completedMilestoneIds.includes('m3_q2'),
        inProgress: !completedMilestoneIds.includes('m3_q2') && completedMilestoneIds.includes('m2_q1'),
        associatedControls: ['SC-7', 'SC-8', 'AC-3'],
        costEstimateK: 110,
      },
      {
        id: 'm4_q3',
        quarter: 'Q3 2026',
        name: 'CI/CD Guardrails & Automated Telemetry',
        focus: 'Automated vulnerability scanning in GitHub Actions, Terraform drift enforcement, and 24/7 SIEM alert triage.',
        owner: 'DevSecOps',
        estimatedReductionPts: 2.6,
        completed: completedMilestoneIds.includes('m4_q3'),
        inProgress: !completedMilestoneIds.includes('m4_q3') && completedMilestoneIds.includes('m3_q2'),
        associatedControls: ['SI-2', 'SI-4', 'AU-2'],
        costEstimateK: 65,
      },
      {
        id: 'm5_q4',
        quarter: 'Q4 2026',
        name: 'Cryptographic Attestation & ISO Recertification',
        focus: 'Formal audit re-certification, third-party penetration validation, and cryptographic hash verification.',
        owner: 'CISO / Lead Auditor',
        estimatedReductionPts: 2.1,
        completed: completedMilestoneIds.includes('m5_q4'),
        inProgress: !completedMilestoneIds.includes('m5_q4') && completedMilestoneIds.includes('m4_q3'),
        associatedControls: ['CA-2', 'AU-6', 'PL-4'],
        costEstimateK: 50,
      },
    ];
  }, [assessment, completedMilestoneIds]);

  // Toggle milestone completion state
  const handleToggleMilestone = (id: string) => {
    if (id === 'm1_baseline') return; // Baseline cannot be uncompleted
    setCompletedMilestoneIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  // Compile Trend Series Data over Time
  const trendData = useMemo(() => {
    const baseInherent = baselineStats.avgInherent;
    const tolerance = 5.0; // Standard Risk Appetite Tolerance Limit

    // Multiplier step reductions based on milestones
    let accumulatedReduction = 0;
    let baselineResidual = baselineStats.avgCurrentResidual;

    return milestones.map((m, idx) => {
      let isApplied = false;
      if (scenarioMode === 'actual') {
        isApplied = m.completed;
      } else if (scenarioMode === 'projected') {
        isApplied = true;
      } else if (scenarioMode === 'accelerated') {
        isApplied = true;
      }

      if (idx === 0) {
        // Baseline Point
        return {
          quarter: m.quarter,
          milestoneName: m.name,
          inherentRisk: baseInherent,
          residualRisk: baselineResidual,
          projectedResidual: baselineResidual,
          toleranceThreshold: tolerance,
          cefPct: baselineStats.avgCurrentCEF,
          treatmentROI: 1.0,
          valueSavedK: 0,
          spendK: m.costEstimateK,
          status: 'COMPLETED',
          isActualCurrent: true,
        };
      }

      const reductionFactor = scenarioMode === 'accelerated' ? 1.25 : 1.0;
      const ptsToReduce = m.estimatedReductionPts * reductionFactor;

      if (isApplied) {
        accumulatedReduction += ptsToReduce;
      }

      const projectedResidual = Number(
        Math.max(1.8, baselineResidual - accumulatedReduction).toFixed(1)
      );

      // Current actual residual reflects up to completed milestones
      const actualResidual = m.completed
        ? projectedResidual
        : Number(
            Math.max(
              projectedResidual,
              baselineResidual -
                milestones
                  .slice(1, idx + 1)
                  .filter((x) => x.completed)
                  .reduce((acc, curr) => acc + curr.estimatedReductionPts, 0)
            ).toFixed(1)
          );

      // Control Effectiveness Factor trajectory
      const calculatedCef = Math.min(
        96,
        Math.round(baselineStats.avgCurrentCEF + (idx * (scenarioMode === 'accelerated' ? 14 : 11)))
      );

      // Quantified Value-at-Risk Saved and ROI Multiple
      // 1 Inherent Risk point is modeled as ~$125,000 annualized operational risk exposure
      const exposureSaved = Number((accumulatedReduction * 125).toFixed(0));
      const cumulativeSpend = milestones
        .slice(0, idx + 1)
        .reduce((acc, curr) => acc + curr.costEstimateK, 0);
      const roiRatio = Number((exposureSaved / (cumulativeSpend || 1)).toFixed(1));

      return {
        quarter: m.quarter,
        milestoneName: m.name,
        inherentRisk: baseInherent,
        residualRisk: scenarioMode === 'actual' ? actualResidual : projectedResidual,
        projectedResidual,
        toleranceThreshold: tolerance,
        cefPct: calculatedCef,
        treatmentROI: Math.max(1.0, roiRatio),
        valueSavedK: exposureSaved,
        spendK: cumulativeSpend,
        status: m.completed ? 'COMPLETED' : m.inProgress ? 'IN_PROGRESS' : 'PLANNED',
        isActualCurrent: idx === completedMilestoneIds.length - 1,
      };
    });
  }, [baselineStats, milestones, scenarioMode, completedMilestoneIds]);

  // Cumulative ROI & Treatment Value Metrics
  const roiSummary = useMemo(() => {
    const initialInherent = baselineStats.avgInherent;
    const finalPoint = trendData[trendData.length - 1];
    const currentPoint =
      trendData.find((d) => d.isActualCurrent) || trendData[trendData.length - 1];

    const currentPointsReduced = Number(
      Math.max(0, initialInherent - currentPoint.residualRisk).toFixed(1)
    );
    const totalProjectedPointsReduced = Number(
      Math.max(0, initialInherent - finalPoint.projectedResidual).toFixed(1)
    );

    const currentReductionPct = Math.min(
      95,
      Math.round((currentPointsReduced / (initialInherent || 1)) * 100)
    );
    const projectedReductionPct = Math.min(
      95,
      Math.round((totalProjectedPointsReduced / (initialInherent || 1)) * 100)
    );

    // Modeled ROI calculations
    const estimatedLossAvoidance = Number((currentPointsReduced * 125000).toLocaleString());
    const projectedTotalLossAvoidance = Number(
      (totalProjectedPointsReduced * 125000).toLocaleString()
    );
    const totalBudgetInvested = milestones
      .filter((m) => m.completed)
      .reduce((sum, m) => sum + m.costEstimateK, 0);
    const totalProjectedBudget = milestones.reduce((sum, m) => sum + m.costEstimateK, 0);

    const currentROIMultiple = Number(
      ((currentPointsReduced * 125) / (totalBudgetInvested || 1)).toFixed(1)
    );
    const projectedROIMultiple = Number(
      ((totalProjectedPointsReduced * 125) / (totalProjectedBudget || 1)).toFixed(1)
    );

    const isBelowTolerance = currentPoint.residualRisk <= 5.0;

    return {
      currentPointsReduced,
      totalProjectedPointsReduced,
      currentReductionPct,
      projectedReductionPct,
      estimatedLossAvoidance,
      projectedTotalLossAvoidance,
      totalBudgetInvested,
      totalProjectedBudget,
      currentROIMultiple: Math.max(1.0, currentROIMultiple),
      projectedROIMultiple: Math.max(1.0, projectedROIMultiple),
      isBelowTolerance,
      currentResidual: currentPoint.residualRisk,
    };
  }, [baselineStats, trendData, milestones]);

  return (
    <div
      id="remediation-trend-roi-card"
      className="border border-[#262626] bg-[#121212] p-5 space-y-5 font-mono text-white transition-all shadow-xl"
    >
      {/* 1. Header Bar: Title, Context, Controls & Domain Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#262626] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 border border-[#38bdf8] bg-[#0c1a24] text-[#38bdf8] flex items-center gap-1.5">
              <TrendingDown className="w-3 h-3" />
              REMEDIATION ROI &amp; RISK TRAJECTORY
            </span>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 border border-[#333333] bg-black text-[#888888]">
              {scopedControls.length} Controls Evaluated
            </span>
            {selectedDomain !== 'ALL' && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 border border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00]">
                Domain: {selectedDomain}
              </span>
            )}
          </div>
          <h3 className="text-lg sm:text-xl font-syne font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <span>Inherent Risk vs. Residual Risk Burn-Down</span>
            <span className="text-xs font-mono font-normal text-[#888888]">
              (Milestone Velocity)
            </span>
          </h3>
          <p className="text-xs text-[#888888] font-sans max-w-3xl">
            Measures quantitative risk attenuation as remediation milestones are completed. Demonstrates
            the executive Return on Investment (ROI) of security controls against unmitigated inherent exposure.
          </p>
        </div>

        {/* Controls: Domain Filter & Projection Scenarios */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {/* Domain Dropdown */}
          <div className="flex items-center gap-1.5 bg-black border border-[#333333] px-2.5 py-1.5 text-xs">
            <Filter className="w-3 h-3 text-[#666666]" />
            <select
              id="trend-domain-selector"
              value={selectedDomain}
              onChange={(e) => {
                setSelectedDomain(e.target.value);
                if (onSelectDomain) onSelectDomain(e.target.value);
              }}
              className="bg-transparent text-white focus:outline-none cursor-pointer text-xs font-mono pr-2"
              title="Filter trend analysis by specific Risk Domain"
            >
              <option value="ALL" className="bg-[#121212] text-white">
                All Domains ({controls.length})
              </option>
              {availableDomains.map((dom) => (
                <option key={dom} value={dom} className="bg-[#121212] text-white">
                  {dom}
                </option>
              ))}
            </select>
          </div>

          {/* Scenario Mode Switcher */}
          <div className="flex items-center bg-black border border-[#333333] p-0.5 text-[11px] font-bold">
            <button
              onClick={() => setScenarioMode('actual')}
              className={`px-2.5 py-1 transition cursor-pointer ${
                scenarioMode === 'actual'
                  ? 'bg-[#1e1e0a] border border-[#f5ff00] text-[#f5ff00]'
                  : 'text-[#777777] hover:text-white'
              }`}
              title="Plots risk reduction based strictly on verified completed milestones"
            >
              Actual Progress
            </button>
            <button
              onClick={() => setScenarioMode('projected')}
              className={`px-2.5 py-1 transition cursor-pointer ${
                scenarioMode === 'projected'
                  ? 'bg-[#0c1a24] border border-[#38bdf8] text-[#38bdf8]'
                  : 'text-[#777777] hover:text-white'
              }`}
              title="Plots full-year projected trajectory across all scheduled quarters"
            >
              Full Target Plan
            </button>
            <button
              onClick={() => setScenarioMode('accelerated')}
              className={`px-2.5 py-1 transition cursor-pointer ${
                scenarioMode === 'accelerated'
                  ? 'bg-[#0f2415] border border-emerald-500 text-emerald-300'
                  : 'text-[#777777] hover:text-white'
              }`}
              title="Automated Continuous Controls Acceleration Scenario"
            >
              Automated Accelerated
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive Visual ROI Scorecard Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Inherent Ceiling vs Current Residual */}
        <div className="p-3.5 bg-black border border-[#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#888888]">
            <span>Risk Posture Shift</span>
            <Shield className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xs text-[#888888] line-through font-mono">
              {baselineStats.avgInherent}
            </span>
            <span className="text-xl sm:text-2xl font-syne font-bold text-white">
              &rarr; {roiSummary.currentResidual}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">
              (-{roiSummary.currentPointsReduced} pts)
            </span>
          </div>
          <div className="text-[10px] text-[#777777] mt-1">
            Inherent Ceiling vs. Post-Mitigation Residual
          </div>
        </div>

        {/* Metric 2: Risk Reduction % Achieved */}
        <div className="p-3.5 bg-black border border-[#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#888888]">
            <span>Risk Attenuation</span>
            <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-syne font-bold text-emerald-400">
              {roiSummary.currentReductionPct}%
            </span>
            <span className="text-[10px] text-[#888888]">
              (Target: {roiSummary.projectedReductionPct}%)
            </span>
          </div>
          <div className="text-[10px] text-[#777777] mt-1">
            Overall risk score attenuated to date
          </div>
        </div>

        {/* Metric 3: Quantified Visual ROI */}
        <div className="p-3.5 bg-black border border-[#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#888888]">
            <span>Treatment Visual ROI</span>
            <Award className="w-3.5 h-3.5 text-[#f5ff00]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-syne font-bold text-[#f5ff00]">
              {roiSummary.currentROIMultiple}x
            </span>
            <span className="text-[10px] text-yellow-200">
              Projected: {roiSummary.projectedROIMultiple}x
            </span>
          </div>
          <div className="text-[10px] text-[#777777] mt-1">
            Value Preserved vs. Spend ($k)
          </div>
        </div>

        {/* Metric 4: Risk Tolerance Compliance */}
        <div className="p-3.5 bg-black border border-[#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-[#888888]">
            <span>Appetite Compliance</span>
            <CheckCircle2 className={`w-3.5 h-3.5 ${roiSummary.isBelowTolerance ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`text-xs uppercase font-bold px-2 py-0.5 border ${
                roiSummary.isBelowTolerance
                  ? 'border-emerald-600 bg-emerald-950/50 text-emerald-300'
                  : 'border-amber-600 bg-amber-950/50 text-amber-300'
              }`}
            >
              {roiSummary.isBelowTolerance ? 'Within Tolerance' : 'Under Remediation'}
            </span>
            <span className="text-[10px] text-[#888888]">
              Threshold: ≤ 5.0
            </span>
          </div>
          <div className="text-[10px] text-[#777777] mt-1">
            Enterprise risk appetite ceiling
          </div>
        </div>
      </div>

      {/* 3. Primary Trend Chart Canvas (Recharts AreaChart with Inherent vs Residual) */}
      <div className="p-4 bg-black border border-[#262626] space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-[#ef4444] rounded"></span>
              <span className="text-[#ef4444] font-bold">Inherent Risk Ceiling (Pre-Controls)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 bg-[#38bdf8] rounded"></span>
              <span className="text-[#38bdf8] font-bold">Residual Risk (Post-Milestones)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-[#f5ff00]"></span>
              <span className="text-[#f5ff00]">Tolerance Threshold (≤ 5.0)</span>
            </div>
          </div>

          <div className="text-[10px] text-[#888888]">
            Interactive: Click milestones below to toggle completion status
          </div>
        </div>

        {/* Recharts Area Canvas */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trendData}
              margin={{ top: 10, right: 25, left: -10, bottom: 25 }}
            >
              <defs>
                {/* Residual Risk Burn-down Gradient */}
                <linearGradient id="remediationResidualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02} />
                </linearGradient>
                {/* Inherent Risk Shading */}
                <linearGradient id="remediationInherentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#222222" vertical={false} />
              <XAxis
                dataKey="quarter"
                stroke="#555555"
                tick={{ fill: '#aaaaaa', fontSize: 11, fontFamily: 'monospace' }}
                interval={0}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis
                domain={[0, 25]}
                stroke="#555555"
                tick={{ fill: '#888888', fontSize: 10, fontFamily: 'monospace' }}
                label={{
                  value: 'Risk Score (1 - 25)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#666666',
                  fontSize: 10,
                  fontFamily: 'monospace',
                }}
              />

              {/* Reference Line for Risk Tolerance / Appetite */}
              <ReferenceLine
                y={5.0}
                stroke="#f5ff00"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: 'Tolerance Limit (5.0)',
                  fill: '#f5ff00',
                  fontSize: 10,
                  position: 'right',
                  fontFamily: 'monospace',
                }}
              />

              {/* Custom Tooltip */}
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const delta = Number((data.inherentRisk - data.residualRisk).toFixed(1));
                    return (
                      <div className="p-3 bg-[#0d0d0d] border border-[#333333] shadow-2xl font-mono text-xs space-y-2 max-w-xs z-50">
                        <div className="border-b border-[#262626] pb-1.5">
                          <div className="text-[10px] text-[#38bdf8] font-bold uppercase tracking-wider">
                            {data.quarter}
                          </div>
                          <div className="text-white font-syne font-bold text-sm">
                            {data.milestoneName}
                          </div>
                          <div className="text-[10px] text-[#888888] mt-0.5">
                            Status: <span className="text-emerald-400 font-bold">{data.status}</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-[11px]">
                          <div className="flex justify-between items-center text-[#ef4444]">
                            <span>Inherent Exposure:</span>
                            <span className="font-bold">{data.inherentRisk} / 25</span>
                          </div>
                          <div className="flex justify-between items-center text-[#38bdf8]">
                            <span>Residual Risk:</span>
                            <span className="font-bold">{data.residualRisk} / 25</span>
                          </div>
                          <div className="flex justify-between items-center text-emerald-400 font-bold border-t border-[#222222] pt-1">
                            <span>Risk Attenuated:</span>
                            <span>-{delta} pts</span>
                          </div>
                          <div className="flex justify-between items-center text-[#f5ff00]">
                            <span>CEF Effectiveness:</span>
                            <span className="font-bold">{data.cefPct}%</span>
                          </div>
                          <div className="flex justify-between items-center text-white">
                            <span>Visual ROI Ratio:</span>
                            <span className="font-bold text-[#f5ff00]">{data.treatmentROI}x</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Inherent Risk Area */}
              <Area
                type="monotone"
                dataKey="inherentRisk"
                name="Inherent Risk"
                stroke="#ef4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#remediationInherentGrad)"
                activeDot={{ r: 4, stroke: '#ef4444', strokeWidth: 2, fill: '#000' }}
              />

              {/* Residual Risk Area */}
              <Area
                type="monotone"
                dataKey="residualRisk"
                name="Residual Risk"
                stroke="#38bdf8"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#remediationResidualGrad)"
                dot={{ r: 4, fill: '#38bdf8', stroke: '#0c1a24', strokeWidth: 2 }}
                activeDot={{ r: 6, stroke: '#38bdf8', strokeWidth: 3, fill: '#fff' }}
              />

              {/* Optional Projected Line overlay if viewing actual progress */}
              {scenarioMode === 'actual' && (
                <Line
                  type="monotone"
                  dataKey="projectedResidual"
                  name="Target Projection"
                  stroke="#888888"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Legend & Summary Callout */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-[#1f1f1f] text-xs text-[#888888]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#f5ff00]" />
            <span>
              Risk treatment trajectory de-risks {scopedControls.length} controls by{' '}
              <strong className="text-white">
                {roiSummary.currentReductionPct}% ({roiSummary.currentPointsReduced} pts)
              </strong>{' '}
              with a quantified <strong className="text-[#f5ff00]">{roiSummary.currentROIMultiple}x ROI</strong>.
            </span>
          </div>
          <button
            onClick={() => setExpandedMilestones(!expandedMilestones)}
            className="text-[#38bdf8] hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer"
          >
            <span>{expandedMilestones ? 'Hide Milestones' : 'Inspect Milestones & Tasks'}</span>
            {expandedMilestones ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* 4. Interactive Remediation Milestones Checklist Strip */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#888888]">
          <span className="uppercase font-bold tracking-wider text-[#cccccc] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#38bdf8]" />
            Remediation Milestones Sequence (Click to Toggle Completion State)
          </span>
          <span className="text-[10px]">
            {completedMilestoneIds.length - 1} of {milestones.length - 1} milestones achieved
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          {milestones.map((m, idx) => {
            const isCompleted = m.completed;
            const isBaseline = m.id === 'm1_baseline';

            return (
              <div
                key={m.id}
                onClick={() => handleToggleMilestone(m.id)}
                className={`p-3 border transition cursor-pointer select-none flex flex-col justify-between space-y-2 ${
                  isCompleted
                    ? 'border-emerald-600 bg-emerald-950/20 hover:bg-emerald-950/30'
                    : m.inProgress
                    ? 'border-[#38bdf8] bg-[#0c1a24] hover:bg-[#0f2230]'
                    : 'border-[#262626] bg-black/60 hover:border-[#444444]'
                }`}
                title={isBaseline ? 'Baseline audit benchmark' : 'Click to toggle completion status'}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[#888888]">
                      {m.quarter}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 border ${
                        isCompleted
                          ? 'border-emerald-500 text-emerald-400 bg-emerald-950'
                          : m.inProgress
                          ? 'border-[#38bdf8] text-[#38bdf8] bg-black'
                          : 'border-[#333333] text-[#666666] bg-black'
                      }`}
                    >
                      {isCompleted ? 'COMPLETED' : m.inProgress ? 'IN PROGRESS' : 'PLANNED'}
                    </span>
                  </div>
                  <div className="text-xs font-syne font-bold text-white mt-1 leading-snug">
                    {m.name}
                  </div>
                  <p className="text-[10px] text-[#888888] font-sans mt-1 line-clamp-2">
                    {m.focus}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-bold">
                    {idx === 0 ? 'Baseline' : `-${m.estimatedReductionPts} pts`}
                  </span>
                  <span className="text-[#888888]">${m.costEstimateK}k spend</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Expanded Drawer: Detailed Actions & Controls Linkage */}
      {expandedMilestones && (
        <div className="p-4 border border-[#333333] bg-[#0f0f0f] space-y-3 animate-in fade-in duration-150 text-xs">
          <div className="flex items-center justify-between border-b border-[#222222] pb-2">
            <span className="font-bold text-white uppercase flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#f5ff00]" />
              Remediation Action Items &amp; Target Control Alignment
            </span>
            {onNavigateToRTP && (
              <button
                onClick={onNavigateToRTP}
                className="text-[#f5ff00] hover:underline font-bold text-[11px] uppercase flex items-center gap-1 cursor-pointer"
              >
                <span>Open Full Risk Treatment Plan (RTP)</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="divide-y divide-[#222222]">
            {milestones.slice(1).map((m) => (
              <div key={m.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#38bdf8] font-bold">{m.quarter}</span>
                    <span className="text-white font-bold">{m.name}</span>
                    <span className="text-[10px] text-[#777777]">Owner: {m.owner}</span>
                  </div>
                  <div className="text-[11px] text-[#aaaaaa] font-sans">{m.focus}</div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-[#888888]">Target Controls</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {m.associatedControls.map((cid) => (
                        <button
                          key={cid}
                          onClick={() => onNavigateToControl && onNavigateToControl(cid)}
                          className="px-1.5 py-0.5 bg-black border border-[#444444] text-[#f5ff00] hover:border-[#f5ff00] text-[10px] font-bold cursor-pointer"
                          title={`Navigate to calibrate ${cid}`}
                        >
                          {cid}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleMilestone(m.id)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase transition cursor-pointer border ${
                      m.completed
                        ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                        : 'bg-black border-[#444444] text-white hover:border-[#f5ff00]'
                    }`}
                  >
                    {m.completed ? '✓ Done' : 'Mark Completed'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
