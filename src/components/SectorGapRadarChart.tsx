import React, { useState, useMemo } from 'react';
import { RadarChart, BarChart } from '@mui/x-charts';
import {
  Shield,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Target,
  ArrowRight,
  Info,
  Sliders,
  Sparkles,
  BarChart3,
  Radar as RadarIcon,
} from 'lucide-react';
import {
  RCSAPayload,
  SectorType,
  RiskDomain,
  NistFamilyId,
  AssessedControl,
} from '../types';
import { SECTOR_PROFILES } from '../data/sectorProfiles';

interface SectorGapRadarChartProps {
  assessment: RCSAPayload;
  onFilterDomainInQuestionnaire?: (domain: string) => void;
  onNavigateToStage?: (stage: string) => void;
}

export type BenchmarkMetricMode = 'effectiveness' | 'risk_containment' | 'maturity';

interface PillarDefinition {
  id: string;
  name: string;
  shortName: string;
  domain: RiskDomain;
  families: NistFamilyId[];
  description: string;
  sectorTargetWeights: Record<SectorType, number>; // 0 to 100 benchmark baseline
}

const RADAR_PILLARS: PillarDefinition[] = [
  {
    id: 'iam',
    name: 'Identity & Access Control',
    shortName: 'Identity & Access',
    domain: 'Cybersecurity',
    families: ['AC', 'IA'],
    description: 'MFA, credential lifecycle, privilege authorization, and Zero Trust boundary access.',
    sectorTargetWeights: {
      Financial: 92,
      Healthcare: 88,
      Retail: 90,
      Technology: 94,
      Public_Sector: 82,
      Critical_Infrastructure: 90,
      Defense: 96,
      General_Enterprise: 80,
    },
  },
  {
    id: 'threat_defense',
    name: 'Threat Defense & Incident Containment',
    shortName: 'Threat Defense',
    domain: 'Cybersecurity',
    families: ['SC', 'SI', 'IR'],
    description: 'Boundary protection, SIEM anomaly detection, malware defense, and incident triage.',
    sectorTargetWeights: {
      Financial: 90,
      Healthcare: 86,
      Retail: 85,
      Technology: 92,
      Public_Sector: 80,
      Critical_Infrastructure: 95,
      Defense: 98,
      General_Enterprise: 78,
    },
  },
  {
    id: 'privacy_data',
    name: 'Privacy & Data Protection',
    shortName: 'Privacy & Data',
    domain: 'Privacy',
    families: ['PT', 'MP'],
    description: 'PII lawful processing, consent tracking, crypto key handling, and media sanitization.',
    sectorTargetWeights: {
      Financial: 94,
      Healthcare: 96,
      Retail: 88,
      Technology: 90,
      Public_Sector: 85,
      Critical_Infrastructure: 80,
      Defense: 92,
      General_Enterprise: 75,
    },
  },
  {
    id: 'audit_risk',
    name: 'Audit, Continuous Monitoring & Risk',
    shortName: 'Audit & Continuous Monitoring',
    domain: 'Information Security',
    families: ['AU', 'CA', 'RA'],
    description: 'Immutable audit trails, vulnerability scanning, continuous attestation, and RA baselines.',
    sectorTargetWeights: {
      Financial: 95,
      Healthcare: 89,
      Retail: 82,
      Technology: 88,
      Public_Sector: 84,
      Critical_Infrastructure: 89,
      Defense: 96,
      General_Enterprise: 76,
    },
  },
  {
    id: 'supply_chain',
    name: 'Supply Chain & Third-Party SCRM',
    shortName: 'Supply Chain SCRM',
    domain: 'Information Security',
    families: ['SR', 'SA'],
    description: 'Vendor SBOM provenance, sub-processor security attestation, and procurement controls.',
    sectorTargetWeights: {
      Financial: 88,
      Healthcare: 82,
      Retail: 80,
      Technology: 92,
      Public_Sector: 78,
      Critical_Infrastructure: 92,
      Defense: 95,
      General_Enterprise: 72,
    },
  },
  {
    id: 'governance_resilience',
    name: 'Governance, Resilience & BCDR',
    shortName: 'Governance & Resilience',
    domain: 'Governance',
    families: ['CP', 'PL', 'PM', 'PS', 'PE', 'CM'],
    description: 'Disaster recovery, configuration baselines, personnel vetting, and executive oversight.',
    sectorTargetWeights: {
      Financial: 90,
      Healthcare: 92,
      Retail: 84,
      Technology: 88,
      Public_Sector: 85,
      Critical_Infrastructure: 96,
      Defense: 94,
      General_Enterprise: 80,
    },
  },
];

export const SectorGapRadarChart: React.FC<SectorGapRadarChartProps> = ({
  assessment,
  onFilterDomainInQuestionnaire,
  onNavigateToStage,
}) => {
  const { controls, organizationProfile } = assessment;
  const currentSectorId = organizationProfile.sector || 'Financial';
  
  // Selected benchmark sector for comparison (defaults to active assessment sector)
  const [selectedBenchmarkSector, setSelectedBenchmarkSector] = useState<SectorType>(currentSectorId);
  const [metricMode, setMetricMode] = useState<BenchmarkMetricMode>('effectiveness');
  const [showPeerOverlay, setShowPeerOverlay] = useState<boolean>(true);
  const [selectedPillarId, setSelectedPillarId] = useState<string | null>(null);
  const [visualFormat, setVisualFormat] = useState<'radar' | 'bar'>('radar');

  const activeSectorProfile = SECTOR_PROFILES[currentSectorId] || SECTOR_PROFILES.Technology;
  const comparedSectorProfile = SECTOR_PROFILES[selectedBenchmarkSector] || SECTOR_PROFILES.Financial;

  // Compute stats for each pillar
  const radarData = useMemo(() => {
    return RADAR_PILLARS.map((pillar) => {
      // Filter controls belonging to this pillar
      const pillarControls = controls.filter(
        (c) => pillar.families.includes(c.family as NistFamilyId) || c.domain === pillar.domain
      );

      const count = pillarControls.length;
      let currentScore = 0;
      let currentResidualAvg = 0;

      if (count > 0) {
        const sumCEF = pillarControls.reduce((acc, c) => acc + (c.calculatedCEF || 0), 0);
        const sumResidual = pillarControls.reduce((acc, c) => acc + (c.residualRisk || 0), 0);
        currentScore = Math.round((sumCEF / count) * 100);
        currentResidualAvg = Number((sumResidual / count).toFixed(1));
      } else {
        // Fallback to domain average if specific families not assessed
        const domainControls = controls.filter((c) => c.domain === pillar.domain);
        if (domainControls.length > 0) {
          const sumCEF = domainControls.reduce((acc, c) => acc + (c.calculatedCEF || 0), 0);
          currentScore = Math.round((sumCEF / domainControls.length) * 100);
          const sumResidual = domainControls.reduce((acc, c) => acc + (c.residualRisk || 0), 0);
          currentResidualAvg = Number((sumResidual / domainControls.length).toFixed(1));
        } else {
          currentScore = 70;
          currentResidualAvg = 6.5;
        }
      }

      // Sector benchmark baseline
      const benchmarkTarget = pillar.sectorTargetWeights[selectedBenchmarkSector] || 85;
      // Peer / Top Decile Target (e.g. +5% or defense benchmark)
      const topDecileTarget = Math.min(99, benchmarkTarget + 5);

      // Calculations based on metric mode
      let displayCurrent = currentScore;
      let displayBenchmark = benchmarkTarget;
      let displayPeer = topDecileTarget;

      if (metricMode === 'risk_containment') {
        // Risk containment: 0 to 100 (where residual risk of 0 is 100%, 25 is 0%)
        displayCurrent = Math.max(0, Math.min(100, Math.round(((25 - currentResidualAvg) / 25) * 100)));
        // Benchmark containment derived from sector multiplier
        const benchmarkTolerance = 25 * (1 - (comparedSectorProfile.defaultRiskMultiplier >= 1.4 ? 0.85 : 0.75));
        displayBenchmark = Math.round(((25 - benchmarkTolerance) / 25) * 100);
        displayPeer = Math.min(100, displayBenchmark + 6);
      } else if (metricMode === 'maturity') {
        // Maturity scale: 1.0 to 5.0 scaled to percentage for radar visualization
        // Score: 1 = 20%, 2 = 40%, 3 = 60%, 4 = 80%, 5 = 100%
        const currentMaturity = Number((1 + (currentScore / 100) * 4).toFixed(1));
        const benchmarkMaturity = Number((1 + (benchmarkTarget / 100) * 4).toFixed(1));
        const peerMaturity = Number((1 + (topDecileTarget / 100) * 4).toFixed(1));

        displayCurrent = currentScore;
        displayBenchmark = benchmarkTarget;
        displayPeer = topDecileTarget;
      }

      const gap = displayCurrent - displayBenchmark;

      return {
        pillarId: pillar.id,
        pillarName: pillar.name,
        subject: pillar.shortName,
        currentScore: displayCurrent,
        benchmarkScore: displayBenchmark,
        peerScore: displayPeer,
        gap,
        controlCount: count,
        domain: pillar.domain,
        families: pillar.families,
        description: pillar.description,
        currentResidualAvg,
      };
    });
  }, [controls, selectedBenchmarkSector, metricMode, comparedSectorProfile]);

  // Summary Metrics
  const overallCurrentAvg = Math.round(
    radarData.reduce((s, d) => s + d.currentScore, 0) / (radarData.length || 1)
  );
  const overallBenchmarkAvg = Math.round(
    radarData.reduce((s, d) => s + d.benchmarkScore, 0) / (radarData.length || 1)
  );
  const overallNetGap = overallCurrentAvg - overallBenchmarkAvg;

  // Largest Deficit Pillar
  const sortedGaps = [...radarData].sort((a, b) => a.gap - b.gap);
  const largestDeficit = sortedGaps[0];
  const strongestPillar = [...radarData].sort((a, b) => b.gap - a.gap)[0];

  // Custom Radar Tooltip
  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const gapVal = data.gap;
      const isDeficit = gapVal < 0;

      return (
        <div className="bg-[#111111] border border-[#333333] p-4 shadow-2xl font-mono text-xs max-w-xs space-y-2.5 z-50">
          <div className="flex items-center justify-between border-b border-[#262626] pb-2">
            <span className="font-bold text-white uppercase text-[11px]">
              {data.pillarName}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 bg-[#222222] border border-[#333333] text-[#888888]">
              {data.domain}
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#f5ff00]">
                <span className="w-2 h-2 bg-[#f5ff00] inline-block"></span>
                Current Assessment:
              </span>
              <span className="font-bold text-white">{data.currentScore}%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#38bdf8]">
                <span className="w-2 h-2 bg-[#38bdf8] inline-block"></span>
                {comparedSectorProfile.name.split(' ')[0]} Target:
              </span>
              <span className="font-bold text-white">{data.benchmarkScore}%</span>
            </div>

            {showPeerOverlay && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-purple-400">
                  <span className="w-2 h-2 bg-purple-400 inline-block"></span>
                  Top Decile Peer Target:
                </span>
                <span className="font-bold text-white">{data.peerScore}%</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#222222] flex items-center justify-between">
            <span className="text-[10px] text-[#888888] uppercase">Benchmark Gap:</span>
            <span
              className={`font-bold text-[11px] px-1.5 py-0.5 border ${
                isDeficit
                  ? 'border-red-600 bg-red-950/50 text-red-400'
                  : 'border-emerald-600 bg-emerald-950/50 text-emerald-400'
              }`}
            >
              {isDeficit ? `${gapVal}% Deficit` : `+${gapVal}% Above Target`}
            </span>
          </div>
          <p className="text-[10px] text-[#777777] font-sans pt-1 leading-tight">
            NIST Families: {data.families.join(', ')} • {data.controlCount} Controls Evaluated
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="border border-[#262626] bg-[#141414] overflow-hidden space-y-0 text-white">
      {/* Top Header Bar */}
      <div className="bg-[#0f0f0f] border-b border-[#262626] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider bg-[#38bdf8] text-black flex items-center gap-1">
              <Target className="w-3 h-3" />
              Comparative Gap Analysis
            </span>
            <span className="font-mono text-[10px] text-[#888888] px-2 py-0.5 border border-[#333333] bg-[#1a1a1a]">
              SECTOR: {activeSectorProfile.name}
            </span>
            <span className="font-mono text-[10px] text-[#f5ff00] px-2 py-0.5 border border-[#444400] bg-[#1e1e08]">
              MULTIPLIER: {activeSectorProfile.defaultRiskMultiplier}x
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-syne font-bold uppercase tracking-tight text-white flex items-center gap-2">
            Industry Benchmark Radar & Gap Quantification
          </h3>
          <p className="text-xs text-[#888888] max-w-2xl font-sans">
            Compare real-time RCSA effectiveness scores against NIST SP 800-53 Rev. 5 sector baseline benchmarks ({comparedSectorProfile.name}) across 6 core risk domains.
          </p>
        </div>

        {/* Action Controls & Benchmark Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sector Benchmark Selector */}
          <div className="flex items-center gap-1.5 bg-black border border-[#333333] px-3 py-1.5">
            <span className="font-mono text-[10px] text-[#777777] uppercase">Benchmark:</span>
            <select
              value={selectedBenchmarkSector}
              onChange={(e) => setSelectedBenchmarkSector(e.target.value as SectorType)}
              className="bg-transparent text-xs font-mono font-bold text-[#38bdf8] focus:outline-none cursor-pointer"
            >
              {Object.values(SECTOR_PROFILES).map((sec) => (
                <option key={sec.id} value={sec.id} className="bg-[#141414] text-white">
                  {sec.name} ({sec.defaultRiskMultiplier}x)
                </option>
              ))}
            </select>
          </div>

          {/* Metric Mode Toggle */}
          <div className="flex items-center border border-[#333333] bg-black p-0.5">
            <button
              onClick={() => setMetricMode('effectiveness')}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition ${
                metricMode === 'effectiveness'
                  ? 'bg-[#f5ff00] text-black'
                  : 'text-[#888888] hover:text-white'
              }`}
              title="Control Effectiveness Factor (0-100%)"
            >
              CEF %
            </button>
            <button
              onClick={() => setMetricMode('risk_containment')}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition ${
                metricMode === 'risk_containment'
                  ? 'bg-[#f5ff00] text-black'
                  : 'text-[#888888] hover:text-white'
              }`}
              title="Risk Containment Score (Higher = Lower Residual Risk)"
            >
              Containment
            </button>
            <button
              onClick={() => setMetricMode('maturity')}
              className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition ${
                metricMode === 'maturity'
                  ? 'bg-[#f5ff00] text-black'
                  : 'text-[#888888] hover:text-white'
              }`}
              title="Maturity Level Index"
            >
              Maturity
            </button>
          </div>

          {/* Chart View Toggle & Peer Overlay */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center border border-[#333333] bg-black p-0.5">
              <button
                onClick={() => setVisualFormat('radar')}
                className={`px-2 py-1 text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 ${
                  visualFormat === 'radar' ? 'bg-[#f5ff00] text-black' : 'text-[#888888] hover:text-white'
                }`}
                title="MUI X Charts Radar Topology View"
              >
                <RadarIcon className="w-3 h-3" />
                <span>Radar</span>
              </button>
              <button
                onClick={() => setVisualFormat('bar')}
                className={`px-2 py-1 text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 ${
                  visualFormat === 'bar' ? 'bg-[#f5ff00] text-black' : 'text-[#888888] hover:text-white'
                }`}
                title="MUI X Charts Grouped Bar Distribution"
              >
                <BarChart3 className="w-3 h-3" />
                <span>Bar</span>
              </button>
            </div>

            <button
              onClick={() => setShowPeerOverlay((p) => !p)}
              className={`px-2.5 py-1.5 border text-[10px] font-mono font-bold uppercase transition flex items-center gap-1 ${
                showPeerOverlay
                  ? 'border-purple-500 bg-purple-950/40 text-purple-300'
                  : 'border-[#333333] bg-black text-[#666666] hover:text-white'
              }`}
              title="Toggle Top Decile / Peer Target Overlay"
            >
              <span>Top 10% Peer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Radar Visualizer + Executive Delta Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-[#262626]">
        {/* Left 7 Cols: Interactive Radar Canvas */}
        <div className="lg:col-span-7 p-4 sm:p-6 bg-[#0f0f0f] border-b lg:border-b-0 lg:border-r border-[#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="w-3 h-3 bg-[#f5ff00] inline-block border border-black"></span>
                <span className="text-white font-bold">Assessment Score</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="w-3 h-3 bg-[#38bdf8] inline-block border border-black"></span>
                <span className="text-[#38bdf8] font-bold">
                  {comparedSectorProfile.name.split(' ')[0]} Benchmark
                </span>
              </div>
              {showPeerOverlay && (
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="w-3 h-3 bg-purple-500 inline-block border border-black"></span>
                  <span className="text-purple-400 font-bold">Top 10% Target</span>
                </div>
              )}
            </div>

            <span className="text-[10px] font-mono text-[#666666] hidden sm:inline">
              MUI X CHARTS • HOVER TO INSPECT
            </span>
          </div>

          {/* MUI X-Charts Visualization (RadarChart / BarChart) */}
          <div className="w-full h-80 sm:h-96 my-auto flex items-center justify-center relative">
            {visualFormat === 'radar' ? (
              <RadarChart
                radar={{
                  metrics: radarData.map((d) => d.subject),
                  max: 100,
                }}
                series={[
                  ...(showPeerOverlay
                    ? [
                        {
                          id: 'peer',
                          label: 'Top 10% Target',
                          data: radarData.map((d) => d.peerScore),
                          color: '#a855f7',
                          fillArea: true,
                        },
                      ]
                    : []),
                  {
                    id: 'benchmark',
                    label: `${comparedSectorProfile.name.split(' ')[0]} Target`,
                    data: radarData.map((d) => d.benchmarkScore),
                    color: '#38bdf8',
                    fillArea: true,
                  },
                  {
                    id: 'current',
                    label: 'Current Assessment',
                    data: radarData.map((d) => d.currentScore),
                    color: '#f5ff00',
                    fillArea: true,
                  },
                ]}
                height={350}
                sx={{
                  width: '100%',
                  '& .MuiChartsRotationAxis-tickLabel': {
                    fill: '#cccccc !important',
                    fontFamily: 'monospace !important',
                    fontSize: '10px !important',
                    fontWeight: 600,
                  },
                  '& .MuiRadarGrid-root line, & .MuiRadarGrid-root path': {
                    stroke: '#2a2a2a !important',
                    strokeDasharray: '2 2',
                  },
                  '& .MuiChartsLegend-root text': {
                    fill: '#aaaaaa !important',
                    fontFamily: 'monospace !important',
                    fontSize: '11px !important',
                  },
                }}
              />
            ) : (
              <BarChart
                xAxis={[
                  {
                    scaleType: 'band',
                    data: radarData.map((d) => d.subject),
                    tickLabelStyle: {
                      fill: '#aaaaaa',
                      fontFamily: 'monospace',
                      fontSize: 10,
                      angle: -25,
                      textAnchor: 'end',
                    },
                  },
                ]}
                yAxis={[
                  {
                    min: 0,
                    max: 100,
                    tickLabelStyle: {
                      fill: '#777777',
                      fontFamily: 'monospace',
                      fontSize: 10,
                    },
                  },
                ]}
                series={[
                  {
                    id: 'current_bar',
                    label: 'Assessment',
                    data: radarData.map((d) => d.currentScore),
                    color: '#f5ff00',
                  },
                  {
                    id: 'bench_bar',
                    label: `${comparedSectorProfile.name.split(' ')[0]} Target`,
                    data: radarData.map((d) => d.benchmarkScore),
                    color: '#38bdf8',
                  },
                  ...(showPeerOverlay
                    ? [
                        {
                          id: 'peer_bar',
                          label: 'Top 10% Peer',
                          data: radarData.map((d) => d.peerScore),
                          color: '#a855f7',
                        },
                      ]
                    : []),
                ]}
                height={350}
                sx={{
                  width: '100%',
                  '& .MuiChartsAxis-line': { stroke: '#333333' },
                  '& .MuiChartsAxis-tick': { stroke: '#444444' },
                  '& .MuiChartsGrid-line': { stroke: '#222222', strokeDasharray: '2 2' },
                  '& .MuiChartsLegend-root text': {
                    fill: '#aaaaaa !important',
                    fontFamily: 'monospace !important',
                    fontSize: '11px !important',
                  },
                }}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-[#777777] pt-2 border-t border-[#222222]">
            <span>SCALE: 0% - 100% CONTROL SATISFACTION</span>
            <span>FRAMEWORK: {comparedSectorProfile.regulatoryFrameworks.slice(0, 3).join(', ')}</span>
          </div>
        </div>

        {/* Right 5 Cols: Quantitative Executive Gap Scorecard */}
        <div className="lg:col-span-5 p-6 bg-[#141414] flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="text-[10px] font-mono uppercase font-bold tracking-widest text-[#777777]">
              EXECUTIVE GAP SYNTHESIS & METRICS
            </div>

            {/* Overall Comparison Card */}
            <div className="p-4 bg-black border border-[#2a2a2a] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#888888]">OVERALL NET POSTURE</span>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 border ${
                    overallNetGap >= 0
                      ? 'border-emerald-600 bg-emerald-950/40 text-emerald-400'
                      : 'border-red-600 bg-red-950/40 text-red-400'
                  }`}
                >
                  {overallNetGap >= 0 ? `+${overallNetGap}% ABOVE BENCHMARK` : `${overallNetGap}% NET DEFICIT`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#222222]">
                <div>
                  <div className="text-[10px] font-mono text-[#666666]">ASSESSMENT AVG</div>
                  <div className="text-2xl font-syne font-bold text-[#f5ff00]">
                    {overallCurrentAvg}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#666666]">SECTOR TARGET</div>
                  <div className="text-2xl font-syne font-bold text-[#38bdf8]">
                    {overallBenchmarkAvg}%
                  </div>
                </div>
              </div>

              <div className="w-full bg-[#222222] h-2 overflow-hidden flex">
                <div
                  className="bg-[#f5ff00] h-full"
                  style={{ width: `${Math.min(100, overallCurrentAvg)}%` }}
                  title={`Current: ${overallCurrentAvg}%`}
                ></div>
              </div>
            </div>

            {/* Critical Gap Focus */}
            {largestDeficit && (
              <div className="p-4 bg-red-950/20 border border-red-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-red-400 flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5" />
                    LARGEST DEFICIT PILLAR
                  </span>
                  <span className="text-xs font-mono font-bold text-red-300">
                    {largestDeficit.gap}% GAP
                  </span>
                </div>
                <div className="font-syne font-bold text-sm text-white">
                  {largestDeficit.pillarName}
                </div>
                <p className="text-xs text-[#aaaaaa] font-sans">
                  {largestDeficit.description} Current score of <strong className="text-[#f5ff00]">{largestDeficit.currentScore}%</strong> trails target <strong className="text-[#38bdf8]">{largestDeficit.benchmarkScore}%</strong>.
                </p>
                {onFilterDomainInQuestionnaire && (
                  <button
                    onClick={() => onFilterDomainInQuestionnaire(largestDeficit.domain)}
                    className="pt-1 text-[11px] font-mono font-bold text-[#f5ff00] hover:underline flex items-center gap-1"
                  >
                    <span>Inspect {largestDeficit.domain} Controls</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Top Strength Area */}
            {strongestPillar && (
              <div className="p-4 bg-emerald-950/20 border border-emerald-900/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    STRONGEST COMPLIANCE PILLAR
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    {strongestPillar.gap >= 0 ? `+${strongestPillar.gap}%` : `${strongestPillar.gap}%`}
                  </span>
                </div>
                <div className="font-syne font-bold text-sm text-white">
                  {strongestPillar.pillarName}
                </div>
                <p className="text-xs text-[#aaaaaa] font-sans">
                  Achieving <strong className="text-[#f5ff00]">{strongestPillar.currentScore}%</strong> vs benchmark <strong className="text-[#38bdf8]">{strongestPillar.benchmarkScore}%</strong>.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#262626] flex items-center justify-between">
            <span className="text-xs text-[#888888] font-mono">
              REGULATORY OVERLAYS: <strong className="text-white">{comparedSectorProfile.regulatoryFrameworks.length} Standards</strong>
            </span>
            {onNavigateToStage && (
              <button
                onClick={() => onNavigateToStage('remediation')}
                className="text-xs font-mono font-bold uppercase text-[#f5ff00] hover:underline flex items-center gap-1"
              >
                <span>Remediation Roadmap</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Domain Gap Breakdown Matrix / Table */}
      <div className="p-6 bg-[#141414] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
          <div>
            <h4 className="font-mono text-xs uppercase tracking-[0.25em] font-bold text-[#888888]">
              PILLAR-BY-PILLAR GAP SPECIFICATION & REMEDIATION GUIDANCE
            </h4>
            <p className="text-xs text-[#666666] font-mono mt-0.5">
              Click any pillar row to filter questionnaire controls or review gap mitigation recommendations.
            </p>
          </div>
          <span className="font-mono text-[10px] text-[#888888] uppercase">
            TARGET SECTOR: {comparedSectorProfile.name}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {radarData.map((item) => {
            const isCriticalDeficit = item.gap <= -10;
            const isModerateDeficit = item.gap < 0 && item.gap > -10;
            const isMeetingTarget = item.gap >= 0;

            const isSelected = selectedPillarId === item.pillarId;

            return (
              <div
                key={item.pillarId}
                onClick={() => setSelectedPillarId(isSelected ? null : item.pillarId)}
                className={`p-4 border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? 'border-[#f5ff00] bg-[#1a1a1a]'
                    : isCriticalDeficit
                    ? 'border-red-900/60 bg-[#151111] hover:border-red-600'
                    : isModerateDeficit
                    ? 'border-amber-900/60 bg-[#161410] hover:border-amber-500'
                    : 'border-[#262626] bg-black hover:border-[#38bdf8]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 bg-[#1a1a1a] border border-[#333333] text-[#aaaaaa]">
                      {item.domain}
                    </span>
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 border ${
                        isCriticalDeficit
                          ? 'border-red-600 bg-red-950/60 text-red-400'
                          : isModerateDeficit
                          ? 'border-amber-600 bg-amber-950/60 text-amber-400'
                          : 'border-emerald-600 bg-emerald-950/60 text-emerald-400'
                      }`}
                    >
                      {item.gap >= 0 ? `+${item.gap}%` : `${item.gap}% Gap`}
                    </span>
                  </div>

                  <h5 className="font-syne font-bold text-sm text-white mt-2">
                    {item.pillarName}
                  </h5>
                  <p className="text-[11px] text-[#777777] font-sans mt-1 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Score Bars */}
                <div className="space-y-2 pt-2 border-t border-[#222222] font-mono text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#f5ff00]">Current Assessment:</span>
                    <span className="font-bold text-white">{item.currentScore}%</span>
                  </div>
                  <div className="w-full bg-[#222222] h-1.5 overflow-hidden">
                    <div
                      className="bg-[#f5ff00] h-full"
                      style={{ width: `${item.currentScore}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-[#38bdf8]">Sector Benchmark:</span>
                    <span className="font-bold text-white">{item.benchmarkScore}%</span>
                  </div>
                  <div className="w-full bg-[#222222] h-1.5 overflow-hidden">
                    <div
                      className="bg-[#38bdf8] h-full"
                      style={{ width: `${item.benchmarkScore}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Row */}
                <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#666666]">NIST: {item.families.join(', ')}</span>
                  {onFilterDomainInQuestionnaire && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onFilterDomainInQuestionnaire(item.domain);
                      }}
                      className="text-[#f5ff00] hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Filter Controls</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
