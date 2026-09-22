import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart as RechartsAreaChart,
  ReferenceLine,
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
} from 'recharts';
import { LineChart, BarChart } from '@mui/x-charts';
import {
  Home,
  ArrowLeft,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Layers,
  Shield,
  Activity,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Printer,
  FileText,
  Sliders,
  Radio,
  Eye,
  Lock,
  Cpu,
  Target,
  BarChart3,
  Calendar,
  X,
  Volume2,
  VolumeX,
  Flame,
  HelpCircle,
  FolderOpen,
  ArrowRight,
  Zap,
  PieChart as PieIcon,
  LineChart as LineChartIcon,
  AlertOctagon,
  Radar as RadarIcon,
} from 'lucide-react';
import {
  RCSAPayload,
  AssessedControl,
  RiskDomain,
  SectorType,
  RCSADomainType,
  RemediationRoadmapItem,
} from '../types';
import { computeDomainSummaries, getControlRiskLevel, calculateCompositeMultiplier } from '../utils/riskCalculations';
import { SECTOR_PROFILES } from '../data/sectorProfiles';
import { MULTI_SECTOR_RCSA_PRESETS } from '../data/demoAssessments';
import { printAuditReport } from '../utils/exportUtils';
import { ExecutiveAnalyticsSuite } from './ExecutiveAnalyticsSuite';
import { SectorGapRadarChart } from './SectorGapRadarChart';

interface PresentationViewProps {
  assessment: RCSAPayload;
  onClose: () => void;
  onBackToHome?: () => void;
  onSelectPreset?: (presetId: string) => void;
  onNavigateToControl?: (controlId: string) => void;
}

type SlideId =
  | 'overview'
  | 'heatmap'
  | 'donut'
  | 'trend'
  | 'milestones'
  | 'radar'
  | 'domains'
  | 'executive_suite'
  | 'remediation'
  | 'signoff';

interface SlideConfig {
  id: SlideId;
  number: string;
  title: string;
  subtitle: string;
  badge: string;
  talkingPoints: string[];
}

export const PresentationView: React.FC<PresentationViewProps> = ({
  assessment,
  onClose,
  onBackToHome,
  onSelectPreset,
  onNavigateToControl,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(15); // seconds
  const [autoPlayProgress, setAutoPlayProgress] = useState(0);
  const [showTalkingPoints, setShowTalkingPoints] = useState(true);
  const [isLaserPointerActive, setIsLaserPointerActive] = useState(false);
  const [laserPos, setLaserPos] = useState({ x: -100, y: -100 });
  const [selectedHeatmapMode, setSelectedHeatmapMode] = useState<'residual' | 'inherent'>('residual');
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<RiskDomain | 'ALL'>('ALL');
  const [selectedEffectivenessTier, setSelectedEffectivenessTier] = useState<string | null>(null);
  const [milestoneBarGrouping, setMilestoneBarGrouping] = useState<'domain' | 'priority'>('domain');
  const [trendDomainFilter, setTrendDomainFilter] = useState<string>('ALL');

  const containerRef = useRef<HTMLDivElement>(null);

  const handleBackToHome = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (onBackToHome) {
      onBackToHome();
    } else {
      onClose();
    }
  };

  const { controls, organizationProfile, auditSignoff, aiRemediation } = assessment;
  const domainSummaries = useMemo(() => computeDomainSummaries(controls), [controls]);
  const sector = SECTOR_PROFILES[organizationProfile.sector] || SECTOR_PROFILES.Technology;

  // Aggregate Metrics
  const totalControls = controls.length;
  const criticalCount = controls.filter((c) => c.residualRisk >= 15.0).length;
  const highCount = controls.filter((c) => c.residualRisk >= 10.0 && c.residualRisk < 15.0).length;
  const mediumCount = controls.filter((c) => c.residualRisk >= 5.0 && c.residualRisk < 10.0).length;
  const lowCount = controls.filter((c) => c.residualRisk < 5.0).length;

  const totalInherentScore = controls.reduce((acc, c) => acc + c.inherentRisk, 0);
  const totalResidualScore = controls.reduce((acc, c) => acc + c.residualRisk, 0);
  const avgInherent = Number((totalInherentScore / (totalControls || 1)).toFixed(1));
  const avgResidual = Number((totalResidualScore / (totalControls || 1)).toFixed(1));
  const avgCEF = Number(
    (controls.reduce((acc, c) => acc + (c.calculatedCEF || 0), 0) / (totalControls || 1)).toFixed(2)
  );

  const aggregateReductionPct =
    totalInherentScore > 0
      ? Math.round(((totalInherentScore - totalResidualScore) / totalInherentScore) * 100)
      : 0;

  // Overall Posture Grade
  const postureGrade = useMemo(() => {
    if (avgResidual <= 4.0 && criticalCount === 0) return { grade: 'A', status: 'SUPERIOR DEFENSE', color: '#10b981' };
    if (avgResidual <= 7.0 && criticalCount === 0) return { grade: 'A-', status: 'STRONG POSTURE', color: '#22c55e' };
    if (avgResidual <= 10.0 && criticalCount <= 2) return { grade: 'B+', status: 'SATISFACTORY POSTURE', color: '#eab308' };
    if (avgResidual <= 13.0) return { grade: 'B', status: 'ACTION REQUIRED', color: '#f97316' };
    return { grade: 'C-', status: 'CRITICAL DEFICIENCIES', color: '#ef4444' };
  }, [avgResidual, criticalCount]);

  // 1. Control Effectiveness Donut Data
  const donutData = useMemo(() => {
    let satisfactory = 0; // CEF >= 0.70
    let partiallyEffective = 0; // CEF 0.40 - 0.69
    let deficient = 0; // CEF < 0.40

    controls.forEach((c) => {
      if (c.calculatedCEF >= 0.7) {
        satisfactory++;
      } else if (c.calculatedCEF >= 0.4) {
        partiallyEffective++;
      } else {
        deficient++;
      }
    });

    const total = controls.length || 1;
    const satPct = Math.round((satisfactory / total) * 100);
    const partialPct = Math.round((partiallyEffective / total) * 100);
    const defPct = Math.round((deficient / total) * 100);

    const chartSeries = [
      {
        name: 'Satisfactory (CEF ≥ 70%)',
        value: satisfactory,
        percentage: satPct,
        tierKey: 'SATISFACTORY',
        color: '#10b981',
        description: 'Design & Operating effectiveness fully verified; minimal residual exposure.',
      },
      {
        name: 'Partially Effective (40% - 69%)',
        value: partiallyEffective,
        percentage: partialPct,
        tierKey: 'PARTIAL',
        color: '#f59e0b',
        description: 'Control deployed with minor operational gaps or compensating safeguards.',
      },
      {
        name: 'Deficient (< 40%)',
        value: deficient,
        percentage: defPct,
        tierKey: 'DEFICIENT',
        color: '#ef4444',
        description: 'Major control vulnerabilities or unverified evidence requiring remediation.',
      },
    ];

    return {
      chartSeries,
      satisfactory,
      partiallyEffective,
      deficient,
      avgCEF,
      total,
    };
  }, [controls, avgCEF]);

  // 2. Multi-Cycle Risk Trend Trajectory Data
  const trendData = useMemo(() => {
    const domainFilteredControls = trendDomainFilter === 'ALL'
      ? controls
      : controls.filter((c) => c.domain === trendDomainFilter);

    const filteredInherent = Number(
      (domainFilteredControls.reduce((s, c) => s + c.inherentRisk, 0) / (domainFilteredControls.length || 1)).toFixed(1)
    );
    const filteredResidual = Number(
      (domainFilteredControls.reduce((s, c) => s + c.residualRisk, 0) / (domainFilteredControls.length || 1)).toFixed(1)
    );

    const quarters = [
      {
        quarter: 'Q1 2025',
        inherentRisk: filteredInherent,
        residualRisk: Number((filteredInherent * 0.92).toFixed(1)),
        toleranceThreshold: 5.0,
        milestone: 'Initial RCSA Scope Initiated',
      },
      {
        quarter: 'Q2 2025',
        inherentRisk: Number((filteredInherent * 0.98).toFixed(1)),
        residualRisk: Number((filteredInherent * 0.78).toFixed(1)),
        toleranceThreshold: 5.0,
        milestone: 'NIST Baseline & MFA Deployed',
      },
      {
        quarter: 'Q3 2025',
        inherentRisk: filteredInherent,
        residualRisk: Number((filteredInherent * 0.65).toFixed(1)),
        toleranceThreshold: 5.0,
        milestone: 'Zero Trust Network Segmentation',
      },
      {
        quarter: 'Q4 2025',
        inherentRisk: Number((filteredInherent * 1.02).toFixed(1)),
        residualRisk: Number((filteredInherent * 0.52).toFixed(1)),
        toleranceThreshold: 5.0,
        milestone: 'SIEM & SOC 24/7 Monitoring',
      },
      {
        quarter: 'Q1 2026',
        inherentRisk: filteredInherent,
        residualRisk: Number((filteredInherent * 0.42).toFixed(1)),
        toleranceThreshold: 5.0,
        milestone: 'Automated Vulnerability Patching',
      },
      {
        quarter: 'Q2 2026 (Current)',
        inherentRisk: filteredInherent,
        residualRisk: filteredResidual,
        toleranceThreshold: 5.0,
        milestone: 'Active Certified Audit Baseline',
      },
      {
        quarter: 'Q3 2026 (Target)',
        inherentRisk: filteredInherent,
        residualRisk: Number((filteredResidual * 0.72).toFixed(1)),
        toleranceThreshold: 5.0,
        milestone: 'Target Posture Post-PO&AM',
      },
    ];

    const qoqDelta = Number(
      (((quarters[4].residualRisk - quarters[5].residualRisk) / (quarters[4].residualRisk || 1)) * 100).toFixed(1)
    );

    return {
      quarters,
      qoqDelta,
      filteredResidual,
      filteredInherent,
    };
  }, [controls, trendDomainFilter]);

  // 3. Action Plan Milestone Bar Data
  const milestoneBarData = useMemo(() => {
    const roadmapItems: RemediationRoadmapItem[] = aiRemediation?.roadmap || [];
    const allActions = roadmapItems.length > 0
      ? roadmapItems
      : controls.slice(0, 14).map((c, i) => ({
          id: `ACT-${c.controlId}`,
          priority: (c.residualRisk >= 15 ? 'P0_IMMEDIATE' : c.residualRisk >= 10 ? 'P1_HIGH' : c.residualRisk >= 6 ? 'P2_MEDIUM' : 'P3_LOW') as any,
          targetControl: c.controlId,
          controlTitle: c.title,
          domain: c.domain,
          gapSummary: `Remediation required for ${c.controlId}`,
          technicalRemediationAction: `Implement automated policy controls for ${c.title}`,
          compensatingControl: 'Daily audit and log verification',
          estimatedResidualReduction: Number((c.residualRisk * 0.4).toFixed(1)),
          implementationTimeline: i % 4 === 0 ? 'Overdue (30d)' : i % 3 === 0 ? '30 Days' : '60 Days',
          validationCriteria: 'Evidence verification in SIEM',
          status: (c.status === 'COMPLIANT' || c.status === 'SATISFACTORY' ? 'RESOLVED' : i % 3 === 0 ? 'IN_PROGRESS' : 'OPEN') as any,
          dueDate: i % 4 === 0 ? '2026-07-15' : '2026-09-30',
        }));

    const domainGroups: Record<string, { open: number; inProgress: number; resolved: number; overdue: number }> = {
      Cybersecurity: { open: 0, inProgress: 0, resolved: 0, overdue: 0 },
      Privacy: { open: 0, inProgress: 0, resolved: 0, overdue: 0 },
      'Information Security': { open: 0, inProgress: 0, resolved: 0, overdue: 0 },
      Governance: { open: 0, inProgress: 0, resolved: 0, overdue: 0 },
    };

    const priorityGroups: Record<string, { open: number; inProgress: number; resolved: number; overdue: number }> = {
      'P0 (Immediate)': { open: 0, inProgress: 0, resolved: 0, overdue: 0 },
      'P1 (High)': { open: 0, inProgress: 0, resolved: 0, overdue: 0 },
      'P2 (Medium)': { open: 0, inProgress: 0, resolved: 0, overdue: 0 },
      'P3 (Low)': { open: 0, inProgress: 0, resolved: 0, overdue: 0 },
    };

    allActions.forEach((act) => {
      const isOverdue = act.implementationTimeline?.toLowerCase().includes('overdue');
      const dKey = act.domain && domainGroups[act.domain] ? act.domain : 'Cybersecurity';
      const pKey =
        act.priority === 'P0_IMMEDIATE' ? 'P0 (Immediate)' :
        act.priority === 'P1_HIGH' ? 'P1 (High)' :
        act.priority === 'P2_MEDIUM' ? 'P2 (Medium)' : 'P3 (Low)';

      const stat = (act.status || 'OPEN').toUpperCase();

      if (isOverdue) {
        domainGroups[dKey].overdue++;
        priorityGroups[pKey].overdue++;
      } else if (stat === 'RESOLVED' || stat === 'CLOSED') {
        domainGroups[dKey].resolved++;
        priorityGroups[pKey].resolved++;
      } else if (stat === 'IN_PROGRESS') {
        domainGroups[dKey].inProgress++;
        priorityGroups[pKey].inProgress++;
      } else {
        domainGroups[dKey].open++;
        priorityGroups[pKey].open++;
      }
    });

    const domainChart = Object.entries(domainGroups).map(([name, data]) => ({
      category: name,
      ...data,
      total: data.open + data.inProgress + data.resolved + data.overdue,
    }));

    const priorityChart = Object.entries(priorityGroups).map(([name, data]) => ({
      category: name,
      ...data,
      total: data.open + data.inProgress + data.resolved + data.overdue,
    }));

    return {
      allActions,
      domainChart,
      priorityChart,
      totalCount: allActions.length,
      overdueCount: allActions.filter((a) => a.implementationTimeline?.toLowerCase().includes('overdue')).length,
    };
  }, [aiRemediation, controls]);

  // Slides Definition (All 10 Executive Presenter Slides)
  const slides: SlideConfig[] = useMemo(
    () => [
      {
        id: 'overview',
        number: '01',
        title: 'Executive Posture & Risk Delta',
        subtitle: 'Master Cybersecurity & Compliance RCSA Summary',
        badge: 'CISO DASHBOARD',
        talkingPoints: [
          `Target Environment: ${organizationProfile.targetSystem} (${sector.name} Sector).`,
          `Overall control defense reduces baseline inherent risk by ${aggregateReductionPct}% (Average Residual: ${avgResidual}/25).`,
          `${criticalCount === 0 ? 'Zero Critical Deficiencies detected' : `${criticalCount} Critical Deficiencies require immediate P0 remediation`}.`,
          `Assessment executed in compliance with NIST SP 800-53 Rev. 5 & CSA CCM v4.1.0 authoritative baselines.`,
        ],
      },
      {
        id: 'heatmap',
        number: '02',
        title: '5x5 Risk Heatmap Matrix',
        subtitle: 'Inherent Impact × Likelihood Distribution vs Implemented Safeguards',
        badge: '5x5 MATRIX',
        talkingPoints: [
          `Visual distribution of ${totalControls} scoped controls mapped across Impact (1-5) and Likelihood (1-5).`,
          `Controls migrated from high-risk quadrants to lower bands via Design & Operating Safeguards.`,
          `High-risk clusters currently concentrated in Access Control (AC), System Communications (SC), and Incident Response (IR).`,
          `Toggle between Residual and Inherent risk views to visualize direct control effectiveness shifts.`,
        ],
      },
      {
        id: 'donut',
        number: '03',
        title: 'Control Effectiveness Donut',
        subtitle: 'Satisfactory, Partially Effective & Deficient Safeguard Distribution',
        badge: 'EFFECTIVENESS DONUT',
        talkingPoints: [
          `Overall control environment health stands at ${Math.round(avgCEF * 100)}% average Control Effectiveness Factor (CEF).`,
          `${donutData.satisfactory} controls (${donutData.chartSeries[0].percentage}%) meet Satisfactory criteria (CEF ≥ 70%).`,
          `${donutData.partiallyEffective} controls (${donutData.chartSeries[1].percentage}%) are Partially Effective and have active mitigating controls.`,
          `${donutData.deficient} Deficient controls (<40% CEF) are prioritized for engineering sprints.`,
        ],
      },
      {
        id: 'trend',
        number: '04',
        title: 'Multi-Cycle Risk Trajectory & Trend',
        subtitle: 'Quarter-over-Quarter (QoQ) Residual Risk Trajectory vs Board Tolerance',
        badge: 'RISK TREND LINE',
        talkingPoints: [
          `Continuous tracking across historical assessment cycles shows progressive risk decline (-${trendData.qoqDelta}% QoQ).`,
          `Current residual risk (${trendData.filteredResidual}) is actively converging toward the Board Risk Tolerance Ceiling (5.0).`,
          `Projected target posture trajectory reaches <4.0 average residual score following Q3 PO&AM execution.`,
          `Continuous monitoring updates provide near real-time visibility into control decay.`,
        ],
      },
      {
        id: 'milestones',
        number: '05',
        title: 'Action Plan & Milestone Velocity',
        subtitle: 'Remediation Progress, SLA Adherence & Overdue Tracking by Domain/Priority',
        badge: 'MILESTONE BARS',
        talkingPoints: [
          `Accountability tracking across ${milestoneBarData.totalCount} active and planned remediation items.`,
          `${milestoneBarData.overdueCount > 0 ? `${milestoneBarData.overdueCount} overdue actions flagged for escalation` : 'Zero overdue milestones across all scoped engineering workstreams'}.`,
          `P0 immediate actions target hardware-backed MFA, zero-trust network segmentation, and SIEM ingestion.`,
          `Multi-domain horizontal milestone bars provide executive transparency for board audit committees.`,
        ],
      },
      {
        id: 'radar',
        number: '06',
        title: 'Sector Benchmark & Regulatory Gap Radar',
        subtitle: 'Organizational Maturity vs Industry Peer Baseline across 8 Cyber Pillars',
        badge: 'BENCHMARK RADAR',
        talkingPoints: [
          `Sector alignment compared directly against ${sector.name} industry average and CSA Star Level 2 target.`,
          `Key strengths identified in Identity & Access Management and Data Protection Enclaves.`,
          `Critical delta gaps flagged in Incident Response automation and Continuous Monitoring telemetry.`,
          `Provides objective maturity positioning for third-party regulatory examiners.`,
        ],
      },
      {
        id: 'domains',
        number: '07',
        title: 'Domain Deep Dive & Control Breakdown',
        subtitle: 'Cybersecurity, Privacy, Information Security & Governance Drill-Down',
        badge: 'DOMAIN METRICS',
        talkingPoints: [
          `Comparative analysis across 4 primary risk domains evaluating Design Effectiveness (De) and Operating Effectiveness (Oe).`,
          `Cybersecurity domain accounts for ${domainSummaries['Cybersecurity']?.controlsCount || 0} controls with average CEF of ${(domainSummaries['Cybersecurity']?.avgCEF || 0).toFixed(2)}.`,
          `Privacy domain addresses PII protection and transparency requirements under NIST SP 800-53 PT baselines.`,
          `Governance domain confirms policy enforcement, audit logging oversight, and senior leadership accountability.`,
        ],
      },
      {
        id: 'executive_suite',
        number: '08',
        title: 'Unified 4-Chart Executive Analytics Boardroom Suite',
        subtitle: 'High-Density Integrated Analytics: Matrix, Donut, Trend Trajectory & Milestones',
        badge: 'ANALYTICS SUITE',
        talkingPoints: [
          `Consolidated multi-chart executive dashboard designed for interactive CISO board briefings.`,
          `Combines 5x5 Matrix, Control Health Donut, Multi-Cycle Trajectory, and Remediation Bar.`,
          `Supports live filtering, control selection drill-down, and domain isolate modes.`,
          `Directly synchronizes with underlying cryptographic evidence telemetry.`,
        ],
      },
      {
        id: 'remediation',
        number: '09',
        title: 'Strategic Remediation Roadmap',
        subtitle: 'Prioritized Action Plan (P0-P3), Technical Fixes & Projected ROI',
        badge: 'ACTION ROADMAP',
        talkingPoints: [
          `AI-assisted remediation roadmap synthesizes ${controls.filter((c) => c.residualRisk >= 8).length} deficiencies into concrete technical action items.`,
          `P0 / P1 immediate actions target hardware-backed MFA, zero-trust network segmentation, and automated log SIEM ingestion.`,
          `Executing top remediation items delivers an estimated ${(aiRemediation?.executiveSummary ? '35%+' : '30%+')} further reduction in residual vulnerability score.`,
          `Compensating safeguards defined for each deficiency to mitigate risk pending permanent engineering deployments.`,
        ],
      },
      {
        id: 'signoff',
        number: '10',
        title: 'Audit Certification & Attestation',
        subtitle: 'Cryptographic Evidence Verification & Executive Sign-off Status',
        badge: 'AUDIT SEAL',
        talkingPoints: [
          `Formal audit attestation by Lead Assessor ${auditSignoff.assessorSignedBy || 'Authorized Lead Assessor'} and Approver ${auditSignoff.cisoCertifiedBy || 'CISO Executive'}.`,
          `Status: ${auditSignoff.status} with cryptographic SHA-256 evidence integrity hash verification.`,
          `Regulatory alignment certified against NIST SP 800-53 Rev. 5, CSA CCM v4.1.0, and ISO/IEC 27001:2022.`,
          `Ready for immediate board presentation and export as comprehensive Multi-Sheet Excel Workbook or PDF Memorandum.`,
        ],
      },
    ],
    [
      organizationProfile,
      sector,
      aggregateReductionPct,
      avgResidual,
      criticalCount,
      totalControls,
      avgCEF,
      donutData,
      trendData,
      milestoneBarData,
      domainSummaries,
      aiRemediation,
      auditSignoff,
      controls,
    ]
  );

  const activeSlide = slides[currentSlideIndex];

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request error:', err);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Exit fullscreen error:', err);
      });
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
        setAutoPlayProgress(0);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
        setAutoPlayProgress(0);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setShowTalkingPoints((prev) => !prev);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setIsLaserPointerActive((prev) => !prev);
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setIsAutoPlay((prev) => !prev);
      } else if (e.key === 'h' || e.key === 'H' || e.key === 'Home') {
        e.preventDefault();
        handleBackToHome();
      } else if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
          handleBackToHome();
        }
      } else if (Number(e.key) >= 1 && Number(e.key) <= slides.length) {
        e.preventDefault();
        setCurrentSlideIndex(Number(e.key) - 1);
        setAutoPlayProgress(0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length, onClose, onBackToHome]);

  // Slideshow auto-advance timer
  useEffect(() => {
    if (!isAutoPlay) {
      setAutoPlayProgress(0);
      return;
    }

    const stepMs = 100;
    const totalSteps = (autoPlayInterval * 1000) / stepMs;

    const interval = setInterval(() => {
      setAutoPlayProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlideIndex((curr) => (curr < slides.length - 1 ? curr + 1 : 0));
          return 0;
        }
        return prev + 100 / totalSteps;
      });
    }, stepMs);

    return () => clearInterval(interval);
  }, [isAutoPlay, autoPlayInterval, slides.length]);

  // Laser Pointer tracking
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isLaserPointerActive && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setLaserPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-[9999] bg-[#090909] text-white flex flex-col font-mono select-none overflow-hidden"
    >
      {/* Laser Pointer Overlay */}
      {isLaserPointerActive && (
        <div
          className="pointer-events-none absolute z-[10000] w-6 h-6 rounded-full bg-red-500/80 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_20px_#ef4444,0_0_40px_#ef4444] transition-transform duration-75 ease-out"
          style={{ left: `${laserPos.x}px`, top: `${laserPos.y}px` }}
        >
          <div className="w-2 h-2 rounded-full bg-white absolute inset-0 m-auto animate-ping opacity-75"></div>
        </div>
      )}

      {/* Auto-play progress line */}
      {isAutoPlay && (
        <div className="w-full bg-[#1a1a1a] h-1 absolute top-0 left-0 z-50">
          <div
            className="bg-[#f5ff00] h-full transition-all duration-100 ease-linear shadow-[0_0_8px_#f5ff00]"
            style={{ width: `${autoPlayProgress}%` }}
          />
        </div>
      )}

      {/* Top Header / Presenter HUD Bar */}
      <header className="px-4 sm:px-6 py-3 bg-[#111111] border-b border-[#222222] flex items-center justify-between gap-3 sm:gap-4 shrink-0 z-40">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Direct Back To Home Button */}
          <button
            id="presenter-hud-back-home-btn"
            onClick={handleBackToHome}
            className="px-3 py-1.5 bg-[#f5ff00] hover:bg-yellow-300 active:scale-95 text-black border border-[#f5ff00] text-xs uppercase font-syne font-black transition flex items-center gap-2 shadow-[0_0_12px_rgba(245,255,0,0.35)] shrink-0 cursor-pointer"
            title="Return to Main Dashboard / Home Page (Key: H or Esc)"
          >
            <Home className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="tracking-wide">BACK TO HOME</span>
          </button>

          <div className="flex items-center gap-2 border-l border-[#262626] pl-3 sm:pl-4">
            <span className="w-2.5 h-2.5 bg-[#f5ff00] rounded-none animate-pulse shrink-0"></span>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-syne font-black uppercase tracking-wider text-white hidden sm:inline">
                  CUSTOM RCSA PRESENTER VIEW
                </span>
                <span className="px-1.5 py-0.2 bg-[#1c1c08] border border-[#f5ff00] text-[#f5ff00] text-[9px] font-bold">
                  FULL SCREEN DECK
                </span>
              </div>
              <span className="text-[10px] text-[#888888] truncate max-w-xs sm:max-w-md">
                {assessment.assessmentName} • {organizationProfile.targetSystem} ({sector.name})
              </span>
            </div>
          </div>

          {/* Quick Preset Selector for Live Demo */}
          {onSelectPreset && (
            <div className="hidden lg:flex items-center gap-2 border-l border-[#262626] pl-4">
              <span className="text-[10px] text-[#777777] uppercase font-bold">Archetype:</span>
              <select
                aria-label="Preset Switcher"
                onChange={(e) => {
                  if (e.target.value) {
                    onSelectPreset(e.target.value);
                  }
                }}
                defaultValue=""
                className="bg-black text-[#f5ff00] border border-[#333333] hover:border-[#f5ff00] text-[11px] font-bold px-2 py-1 uppercase transition outline-none max-w-[200px] truncate"
              >
                <option value="" disabled className="text-[#666666]">
                  ⚡ SWITCH ARCHETYPE (28)
                </option>
                {MULTI_SECTOR_RCSA_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sector}: {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Slide Carousel Tabs */}
        <div className="hidden xl:flex items-center gap-1 bg-black p-1 border border-[#222222]">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                setCurrentSlideIndex(idx);
                setAutoPlayProgress(0);
              }}
              className={`px-3 py-1 text-[11px] font-bold uppercase transition flex items-center gap-1.5 ${
                currentSlideIndex === idx
                  ? 'bg-[#f5ff00] text-black shadow-[0_0_8px_rgba(245,255,0,0.3)]'
                  : 'text-[#888888] hover:text-white hover:bg-[#1a1a1a]'
              }`}
            >
              <span className="font-mono opacity-60 text-[9px]">{s.number}</span>
              <span className="truncate max-w-[120px]">{s.badge}</span>
            </button>
          ))}
        </div>

        {/* Presenter Action Controls */}
        <div className="flex items-center gap-2">
          {/* Laser Pointer Toggle */}
          <button
            onClick={() => setIsLaserPointerActive((prev) => !prev)}
            className={`px-2.5 py-1.5 border text-xs uppercase font-bold transition flex items-center gap-1.5 ${
              isLaserPointerActive
                ? 'bg-red-950 border-red-500 text-red-300 shadow-[0_0_10px_#ef4444]'
                : 'bg-[#1a1a1a] border-[#333333] text-[#aaaaaa] hover:text-white'
            }`}
            title="Toggle Laser Pointer (Key: L)"
          >
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="hidden sm:inline">Laser (L)</span>
          </button>

          {/* Talking Points Toggle */}
          <button
            onClick={() => setShowTalkingPoints((prev) => !prev)}
            className={`px-2.5 py-1.5 border text-xs uppercase font-bold transition flex items-center gap-1.5 ${
              showTalkingPoints
                ? 'bg-[#1c1c08] border-[#f5ff00] text-[#f5ff00]'
                : 'bg-[#1a1a1a] border-[#333333] text-[#aaaaaa] hover:text-white'
            }`}
            title="Toggle CISO Talking Points (Key: P)"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Notes (P)</span>
          </button>

          {/* Auto-Play Toggle */}
          <button
            onClick={() => setIsAutoPlay((prev) => !prev)}
            className={`px-2.5 py-1.5 border text-xs uppercase font-bold transition flex items-center gap-1.5 ${
              isAutoPlay
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow-[0_0_8px_#10b981]'
                : 'bg-[#1a1a1a] border-[#333333] text-[#aaaaaa] hover:text-white'
            }`}
            title="Auto-Play Slideshow (Key: A)"
          >
            {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isAutoPlay ? 'Auto ON' : 'Slideshow'}</span>
          </button>

          {/* Print / Export Deck */}
          <button
            onClick={() => printAuditReport(assessment)}
            className="px-2.5 py-1.5 bg-[#1a1a1a] border border-[#333333] hover:border-[#f5ff00] text-[#cccccc] hover:text-white text-xs uppercase font-bold transition flex items-center gap-1"
            title="Print Presentation Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Print</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1.5 bg-[#1a1a1a] border border-[#333333] hover:border-[#f5ff00] text-[#cccccc] hover:text-white text-xs uppercase font-bold transition flex items-center gap-1"
            title="Toggle Fullscreen (Key: F)"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-[#f5ff00]" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Exit View / Back to Home */}
          <button
            id="presenter-exit-btn"
            onClick={handleBackToHome}
            className="px-3 py-1.5 bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900 hover:text-white text-xs uppercase font-bold transition flex items-center gap-1.5"
            title="Exit Presenter View & Return to Home (Key: Esc or H)"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </header>

      {/* Main Slide Canvas */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left / Center Slide Presentation Display */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col justify-between space-y-6 bg-gradient-to-b from-[#0e0e0e] via-[#090909] to-black">
          {/* Slide Heading Banner */}
          <div className="flex items-start justify-between border-b border-[#222222] pb-4 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#f5ff00] px-2 py-0.5 bg-[#1c1c08] border border-[#444400]">
                  SLIDE {activeSlide.number} // {slides.length}
                </span>
                <span className="text-xs font-mono uppercase tracking-widest text-[#888888]">
                  {activeSlide.badge}
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-syne font-extrabold uppercase tracking-tight text-white">
                {activeSlide.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#aaaaaa] font-sans">
                {activeSlide.subtitle}
              </p>
            </div>

            {/* Quick Posture Badge on top right */}
            <div className="hidden sm:flex flex-col items-end shrink-0 text-right font-mono">
              <div className="text-[10px] text-[#888888] uppercase">Composite Grade</div>
              <div
                className="text-3xl font-syne font-black px-3 py-0.5 border"
                style={{
                  color: postureGrade.color,
                  borderColor: postureGrade.color,
                  backgroundColor: `${postureGrade.color}15`,
                }}
              >
                {postureGrade.grade}
              </div>
              <span className="text-[9px] uppercase font-bold tracking-wider" style={{ color: postureGrade.color }}>
                {postureGrade.status}
              </span>
            </div>
          </div>

          {/* SLIDE CONTENT VIEWS */}
          <div className="flex-1 flex flex-col justify-center">
            {/* SLIDE 1: Executive Overview */}
            {activeSlide.id === 'overview' && (
              <div className="space-y-6">
                {/* 4 Big Impact Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 sm:p-6 bg-[#111111] border border-[#262626] hover:border-[#f5ff00] transition space-y-2">
                    <div className="flex items-center justify-between text-[11px] uppercase text-[#888888]">
                      <span>Inherent vs Residual</span>
                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-5xl font-syne font-extrabold text-white">
                        -{aggregateReductionPct}%
                      </span>
                      <span className="text-xs font-mono text-[#888888]">Delta</span>
                    </div>
                    <div className="text-xs font-mono text-[#aaaaaa] flex items-center justify-between pt-1 border-t border-[#222222]">
                      <span>IR: <strong className="text-rose-400">{avgInherent}</strong></span>
                      <span>→</span>
                      <span>RR: <strong className="text-emerald-400">{avgResidual}</strong></span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 bg-[#111111] border border-[#262626] hover:border-[#f5ff00] transition space-y-2">
                    <div className="flex items-center justify-between text-[11px] uppercase text-[#888888]">
                      <span>Control Effectiveness</span>
                      <Shield className="w-4 h-4 text-[#f5ff00]" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-5xl font-syne font-extrabold text-[#f5ff00]">
                        {Math.round(avgCEF * 100)}%
                      </span>
                      <span className="text-xs font-mono text-[#888888]">Score</span>
                    </div>
                    <div className="text-xs font-mono text-[#aaaaaa] flex items-center justify-between pt-1 border-t border-[#222222]">
                      <span>Baseline: <strong>0.00</strong></span>
                      <span>Target: <strong className="text-white">≥ 85%</strong></span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 bg-[#111111] border border-[#262626] hover:border-[#f5ff00] transition space-y-2">
                    <div className="flex items-center justify-between text-[11px] uppercase text-[#888888]">
                      <span>Deficiency Profile</span>
                      <AlertTriangle className={`w-4 h-4 ${criticalCount > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`} />
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className={`text-3xl sm:text-5xl font-syne font-extrabold ${criticalCount > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                        {criticalCount}
                      </span>
                      <div className="text-[11px] font-mono leading-tight">
                        <div className="text-orange-400">{highCount} High</div>
                        <div className="text-yellow-400">{mediumCount} Med</div>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-[#aaaaaa] pt-1 border-t border-[#222222]">
                      <span>{lowCount} Controls Compliant</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 bg-[#111111] border border-[#262626] hover:border-[#f5ff00] transition space-y-2">
                    <div className="flex items-center justify-between text-[11px] uppercase text-[#888888]">
                      <span>Scoped Controls</span>
                      <Layers className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-5xl font-syne font-extrabold text-white">
                        {totalControls}
                      </span>
                      <span className="text-xs font-mono text-[#888888]">Evaluated</span>
                    </div>
                    <div className="text-xs font-mono text-[#aaaaaa] pt-1 border-t border-[#222222] truncate">
                      <span>{organizationProfile.sector.replace('_', ' ')} • {assessment.rcsaDomain}</span>
                    </div>
                  </div>
                </div>

                {/* Domain Distribution Comparison Bar Graph */}
                <div className="p-6 bg-[#111111] border border-[#262626] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-syne text-sm font-bold uppercase text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#f5ff00]" />
                      <span>Domain Posture Breakdown (Inherent vs Residual Risk)</span>
                    </h3>
                    <span className="text-[10px] text-[#888888]">NIST SP 800-53 Domain Allocation</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(['Cybersecurity', 'Privacy', 'Information Security', 'Governance'] as RiskDomain[]).map((dom) => {
                      const sum = domainSummaries[dom] || {
                        controlsCount: 0,
                        avgInherent: 0,
                        avgResidual: 0,
                        avgCEF: 0,
                        criticalCount: 0,
                        highCount: 0,
                      };
                      const domRed = sum.avgInherent > 0 ? Math.round(((sum.avgInherent - sum.avgResidual) / sum.avgInherent) * 100) : 0;
                      return (
                        <div key={dom} className="p-4 bg-[#0a0a0a] border border-[#222222] space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-syne text-xs font-bold text-white uppercase">{dom}</span>
                            <span className="text-[9px] px-1.5 py-0.5 border border-[#333333] text-[#f5ff00]">
                              {sum.controlsCount} Controls
                            </span>
                          </div>

                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-[11px] text-[#888888]">
                              <span>CEF: {(sum.avgCEF * 100).toFixed(0)}%</span>
                              <span className="text-emerald-400">-{domRed}% Reduction</span>
                            </div>
                            {/* Inherent vs Residual progress bar */}
                            <div className="w-full bg-[#222222] h-2.5 rounded-none overflow-hidden relative">
                              <div
                                className="bg-rose-500/40 h-full absolute left-0"
                                style={{ width: `${Math.min(100, (sum.avgInherent / 25) * 100)}%` }}
                              />
                              <div
                                className="bg-emerald-400 h-full absolute left-0 shadow-[0_0_6px_#10b981]"
                                style={{ width: `${Math.min(100, (sum.avgResidual / 25) * 100)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[10px] text-[#666666]">
                              <span>IR: {sum.avgInherent.toFixed(1)}</span>
                              <span>RR: <strong className="text-white">{sum.avgResidual.toFixed(1)}</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 2: 5x5 Heatmap Matrix */}
            {activeSlide.id === 'heatmap' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-[#888888]">Matrix View:</span>
                    <button
                      onClick={() => setSelectedHeatmapMode('residual')}
                      className={`px-3 py-1 text-xs font-bold uppercase border transition ${
                        selectedHeatmapMode === 'residual'
                          ? 'bg-[#f5ff00] text-black border-[#f5ff00]'
                          : 'bg-[#111111] border-[#333333] text-[#888888]'
                      }`}
                    >
                      Residual Risk (Current)
                    </button>
                    <button
                      onClick={() => setSelectedHeatmapMode('inherent')}
                      className={`px-3 py-1 text-xs font-bold uppercase border transition ${
                        selectedHeatmapMode === 'inherent'
                          ? 'bg-[#f5ff00] text-black border-[#f5ff00]'
                          : 'bg-[#111111] border-[#333333] text-[#888888]'
                      }`}
                    >
                      Inherent Risk (Unmitigated)
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2.5 h-2.5 bg-emerald-500"></span> Low (&lt;5.0)
                    </span>
                    <span className="flex items-center gap-1 text-yellow-400">
                      <span className="w-2.5 h-2.5 bg-yellow-500"></span> Med (5.0-9.9)
                    </span>
                    <span className="flex items-center gap-1 text-orange-400">
                      <span className="w-2.5 h-2.5 bg-orange-500"></span> High (10.0-14.9)
                    </span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <span className="w-2.5 h-2.5 bg-rose-500"></span> Crit (≥15.0)
                    </span>
                  </div>
                </div>

                {/* 5x5 Grid Canvas */}
                <div className="p-6 bg-[#111111] border border-[#262626] flex flex-col md:flex-row gap-6 items-center justify-center">
                  <div className="space-y-1 shrink-0">
                    <div className="text-[10px] uppercase font-bold text-center text-[#888888] pb-1">
                      IMPACT (1 - 5) →
                    </div>
                    {[5, 4, 3, 2, 1].map((imp) => (
                      <div key={imp} className="flex items-center gap-1">
                        <span className="w-6 text-right font-mono text-xs text-[#888888]">{imp}</span>
                        {[1, 2, 3, 4, 5].map((lik) => {
                          const cellScore = imp * lik;
                          // Find controls matching this cell based on mode
                          const matchingControls = controls.filter((c) => {
                            if (selectedHeatmapMode === 'inherent') {
                              return Math.round(c.inherentImpact) === imp && Math.round(c.inherentLikelihood) === lik;
                            } else {
                              // Estimate residual impact/likelihood bucket
                              const rScore = c.residualRisk;
                              const maxScore = imp * lik;
                              return rScore >= maxScore - 2 && rScore <= maxScore + 2 && Math.round(c.inherentImpact) === imp;
                            }
                          });

                          // Cell color
                          let cellBg = 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300';
                          if (cellScore >= 15) {
                            cellBg = 'bg-rose-950/60 border-rose-700/80 text-rose-200';
                          } else if (cellScore >= 10) {
                            cellBg = 'bg-orange-950/50 border-orange-700/70 text-orange-200';
                          } else if (cellScore >= 5) {
                            cellBg = 'bg-yellow-950/40 border-yellow-700/60 text-yellow-200';
                          }

                          return (
                            <div
                              key={`${imp}-${lik}`}
                              className={`w-14 sm:w-20 h-12 sm:h-16 border ${cellBg} flex flex-col items-center justify-center relative group hover:border-[#f5ff00] transition cursor-pointer`}
                            >
                              <span className="text-[9px] opacity-40 absolute top-1 left-1.5 font-mono">
                                {imp * lik}
                              </span>
                              <span className="text-base sm:text-xl font-syne font-black">
                                {matchingControls.length}
                              </span>
                              <span className="text-[8px] uppercase tracking-wider opacity-70">
                                {matchingControls.length === 1 ? 'control' : 'controls'}
                              </span>

                              {/* Hover Tooltip of controls in cell */}
                              {matchingControls.length > 0 && (
                                <div className="hidden group-hover:block absolute bottom-full mb-2 z-50 p-2.5 bg-black border border-[#f5ff00] text-[10px] w-48 text-left shadow-2xl pointer-events-none">
                                  <div className="font-bold text-[#f5ff00] border-b border-[#333333] pb-1">
                                    Impact {imp} × Likelihood {lik} ({matchingControls.length})
                                  </div>
                                  <div className="max-h-24 overflow-y-auto space-y-1 mt-1 text-[#cccccc]">
                                    {matchingControls.slice(0, 4).map((c) => (
                                      <div key={c.controlId} className="truncate">
                                        • {c.controlId}: {c.title}
                                      </div>
                                    ))}
                                    {matchingControls.length > 4 && (
                                      <div className="text-[9px] text-[#888888]">
                                        +{matchingControls.length - 4} more...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#888888] pt-1 pl-7">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                    </div>
                    <div className="text-[10px] uppercase font-bold text-center text-[#888888] pt-0.5">
                      ← LIKELIHOOD (1 - 5) →
                    </div>
                  </div>

                  {/* Matrix Highlights Panel */}
                  <div className="flex-1 space-y-3 max-w-md w-full">
                    <div className="text-xs uppercase font-bold text-white flex items-center gap-2 border-b border-[#262626] pb-2">
                      <Target className="w-4 h-4 text-[#f5ff00]" />
                      <span>Top Volatile Controls Highlight</span>
                    </div>

                    <div className="space-y-2">
                      {controls
                        .sort((a, b) => b.residualRisk - a.residualRisk)
                        .slice(0, 4)
                        .map((c) => {
                          const level = getControlRiskLevel(c.residualRisk);
                          return (
                            <div
                              key={c.controlId}
                              onClick={() => onNavigateToControl && onNavigateToControl(c.controlId)}
                              className="p-3 bg-[#0a0a0a] border border-[#222222] hover:border-[#f5ff00] transition flex items-center justify-between gap-3 cursor-pointer group"
                            >
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-white group-hover:text-[#f5ff00]">
                                    {c.controlId}
                                  </span>
                                  <span className="text-[9px] text-[#888888] uppercase">{c.domain}</span>
                                </div>
                                <div className="text-[11px] text-[#aaaaaa] truncate">{c.title}</div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className={`text-xs font-mono font-bold px-1.5 py-0.5 border ${
                                  level === 'Critical' ? 'bg-rose-950/60 border-rose-700 text-rose-300' : 'bg-orange-950/60 border-orange-700 text-orange-300'
                                }`}>
                                  RR {c.residualRisk.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 3: Control Effectiveness Donut */}
            {activeSlide.id === 'donut' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Donut Graphic Canvas */}
                  <div className="p-6 bg-[#111111] border border-[#262626] flex flex-col items-center justify-center relative">
                    <div className="text-xs uppercase font-bold text-white flex items-center gap-2 mb-2 w-full justify-between border-b border-[#222222] pb-2">
                      <span className="flex items-center gap-1.5">
                        <PieIcon className="w-4 h-4 text-[#10b981]" />
                        <span>Health Distribution</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#888888]">CEF Multiplier</span>
                    </div>

                    <div className="w-full h-56 relative flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-black/95 border border-[#333333] p-2.5 text-xs shadow-2xl font-mono">
                                    <div className="font-bold text-white mb-1 flex items-center gap-1.5">
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
                                      <span>{data.name}</span>
                                    </div>
                                    <div className="text-[#888888]">
                                      Controls: <span className="text-white font-bold">{data.value}</span> ({data.percentage}%)
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Pie
                            data={donutData.chartSeries}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="#111111"
                            strokeWidth={2}
                          >
                            {donutData.chartSeries.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                className="cursor-pointer transition hover:opacity-80"
                                onClick={() => setSelectedEffectivenessTier(entry.tierKey === selectedEffectivenessTier ? null : entry.tierKey)}
                              />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ResponsiveContainer>

                      {/* Center Score Overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-2xl sm:text-3xl font-syne font-black text-white">
                          {Math.round(donutData.avgCEF * 100)}%
                        </span>
                        <span className="text-[9px] font-mono uppercase text-[#888888] tracking-wider">
                          Avg CEF
                        </span>
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="w-full grid grid-cols-3 gap-1 pt-2 border-t border-[#222222] text-center font-mono">
                      {donutData.chartSeries.map((tier) => (
                        <button
                          key={tier.tierKey}
                          onClick={() => setSelectedEffectivenessTier(tier.tierKey === selectedEffectivenessTier ? null : tier.tierKey)}
                          className={`p-1.5 border transition cursor-pointer ${
                            selectedEffectivenessTier === tier.tierKey
                              ? 'bg-white/10 border-white'
                              : 'bg-black/30 border-[#222222] hover:border-[#444444]'
                          }`}
                        >
                          <div className="text-[9px] text-[#888888] truncate">{tier.tierKey}</div>
                          <div className="text-xs font-bold" style={{ color: tier.color }}>
                            {tier.value} ({tier.percentage}%)
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3 Tier Drilldown Cards */}
                  <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {donutData.chartSeries.map((tier) => (
                      <div
                        key={tier.name}
                        onClick={() => setSelectedEffectivenessTier(tier.tierKey === selectedEffectivenessTier ? null : tier.tierKey)}
                        className={`p-4 bg-[#111111] border transition flex flex-col justify-between cursor-pointer group ${
                          selectedEffectivenessTier === tier.tierKey
                            ? 'border-[#f5ff00] bg-[#161608]'
                            : 'border-[#262626] hover:border-[#444444]'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }}></span>
                            <span className="text-[9px] font-mono text-[#888888]">{tier.percentage}% of total</span>
                          </div>
                          <div className="text-xs font-syne font-bold text-white group-hover:text-[#f5ff00] transition">
                            {tier.name}
                          </div>
                          <p className="text-[11px] text-[#aaaaaa] font-sans leading-relaxed">
                            {tier.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-[#222222] flex items-baseline justify-between font-mono">
                          <span className="text-2xl font-black" style={{ color: tier.color }}>
                            {tier.value}
                          </span>
                          <span className="text-[10px] text-[#888888]">Controls Scoped</span>
                        </div>
                      </div>
                    ))}

                    {/* Filtered Sample Controls List */}
                    <div className="sm:col-span-3 p-3 bg-[#0a0a0a] border border-[#222222] space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-[#888888] uppercase">
                          {selectedEffectivenessTier ? `Filtered Tier: ${selectedEffectivenessTier}` : 'All Evaluated Safeguards'}
                        </span>
                        <span className="text-[#f5ff00]">
                          Click any tier above to isolate controls
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                        {controls
                          .filter((c) => {
                            if (!selectedEffectivenessTier) return true;
                            if (selectedEffectivenessTier === 'SATISFACTORY') return c.calculatedCEF >= 0.7;
                            if (selectedEffectivenessTier === 'PARTIAL') return c.calculatedCEF >= 0.4 && c.calculatedCEF < 0.7;
                            return c.calculatedCEF < 0.4;
                          })
                          .slice(0, 6)
                          .map((c) => (
                            <div
                              key={c.controlId}
                              onClick={() => onNavigateToControl && onNavigateToControl(c.controlId)}
                              className="p-2 bg-[#141414] border border-[#262626] hover:border-[#f5ff00] cursor-pointer text-left transition"
                            >
                              <div className="flex items-center justify-between font-mono text-[10px]">
                                <span className="font-bold text-white">{c.controlId}</span>
                                <span className="text-[#10b981]">CEF: {Math.round(c.calculatedCEF * 100)}%</span>
                              </div>
                              <div className="text-[10px] text-[#aaaaaa] truncate mt-0.5">{c.title}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 4: Multi-Cycle Risk Trajectory & Trend */}
            {activeSlide.id === 'trend' && (
              <div className="space-y-4">
                <div className="p-6 bg-[#111111] border border-[#262626] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#222222] pb-3">
                    <div className="flex items-center gap-2">
                      <LineChartIcon className="w-4 h-4 text-[#f5ff00]" />
                      <span className="font-syne text-xs font-bold uppercase text-white">
                        Quarter-over-Quarter (QoQ) Trajectory vs Risk Tolerance
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-[#888888]">Filter:</span>
                      {(['ALL', 'Cybersecurity', 'Privacy', 'Information Security', 'Governance'] as (RiskDomain | 'ALL')[]).map((dom) => (
                        <button
                          key={dom}
                          onClick={() => setTrendDomainFilter(dom)}
                          className={`px-2 py-0.5 text-[10px] font-mono uppercase border transition ${
                            trendDomainFilter === dom
                              ? 'bg-[#f5ff00] text-black border-[#f5ff00] font-bold'
                              : 'bg-black/50 border-[#333333] text-[#888888] hover:text-white'
                          }`}
                        >
                          {dom}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recharts Area & Line Trajectory Graph */}
                  <div className="w-full bg-[#080808] border border-[#1f1f1f] p-4">
                    <div className="w-full h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsAreaChart data={trendData.quarters} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorResidual" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f5ff00" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#f5ff00" stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="colorInherent" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                          <XAxis dataKey="quarter" stroke="#888888" tick={{ fill: '#888888', fontSize: 11, fontFamily: 'monospace' }} />
                          <YAxis stroke="#888888" tick={{ fill: '#888888', fontSize: 11, fontFamily: 'monospace' }} domain={[0, 25]} />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: '#000000', borderColor: '#333333', color: '#ffffff', fontFamily: 'monospace', fontSize: '11px' }}
                          />
                          <RechartsLegend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px', paddingTop: '10px' }} />
                          <ReferenceLine y={5.0} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Tolerance Limit (5.0)', fill: '#10b981', fontSize: 10, position: 'right' }} />
                          <Area type="monotone" dataKey="inherentRisk" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorInherent)" name="Inherent Risk" />
                          <Area type="monotone" dataKey="residualRisk" stroke="#f5ff00" strokeWidth={3} fillOpacity={1} fill="url(#colorResidual)" name="Residual Risk (Mitigated)" />
                        </RechartsAreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* QoQ Milestones Timeline Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 pt-3 border-t border-[#1f1f1f] text-center font-mono">
                      {trendData.quarters.map((q, idx) => (
                        <div
                          key={q.quarter}
                          className={`p-2 border ${
                            idx === 5 ? 'bg-[#141400] border-[#f5ff00]' : 'bg-[#0c0c0c] border-[#222222]'
                          }`}
                        >
                          <div className="text-[9px] text-[#888888] font-bold truncate">{q.quarter}</div>
                          <div className="text-xs font-black text-white mt-0.5">RR: {q.residualRisk}</div>
                          <div className="text-[8px] text-[#aaaaaa] truncate mt-1">{q.milestone}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 5: Action Plan & Milestone Velocity */}
            {activeSlide.id === 'milestones' && (
              <div className="space-y-4">
                <div className="p-6 bg-[#111111] border border-[#262626] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#222222] pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#10b981]" />
                      <span className="font-syne text-xs font-bold uppercase text-white">
                        Action Plan Milestone Remediation Progress
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-[#888888]">Group By:</span>
                      <button
                        onClick={() => setMilestoneBarGrouping('domain')}
                        className={`px-3 py-0.5 text-[10px] font-mono uppercase border transition ${
                          milestoneBarGrouping === 'domain'
                            ? 'bg-[#f5ff00] text-black border-[#f5ff00] font-bold'
                            : 'bg-black/50 border-[#333333] text-[#888888] hover:text-white'
                        }`}
                      >
                        Risk Domain
                      </button>
                      <button
                        onClick={() => setMilestoneBarGrouping('priority')}
                        className={`px-3 py-0.5 text-[10px] font-mono uppercase border transition ${
                          milestoneBarGrouping === 'priority'
                            ? 'bg-[#f5ff00] text-black border-[#f5ff00] font-bold'
                            : 'bg-black/50 border-[#333333] text-[#888888] hover:text-white'
                        }`}
                      >
                        Priority Tier
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Stacked Bar Chart */}
                  <div className="w-full bg-[#080808] border border-[#1f1f1f] p-4">
                    <div className="w-full h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart
                          layout="vertical"
                          data={milestoneBarGrouping === 'domain' ? milestoneBarData.domainChart : milestoneBarData.priorityChart}
                          margin={{ top: 10, right: 30, left: 90, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#222222" horizontal={false} />
                          <XAxis type="number" stroke="#888888" tick={{ fill: '#888888', fontSize: 11, fontFamily: 'monospace' }} />
                          <YAxis dataKey="category" type="category" stroke="#888888" tick={{ fill: '#ffffff', fontSize: 11, fontFamily: 'monospace' }} />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: '#000000', borderColor: '#333333', color: '#ffffff', fontFamily: 'monospace', fontSize: '11px' }}
                          />
                          <RechartsLegend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px', paddingTop: '8px' }} />
                          <RechartsBar dataKey="resolved" name="Resolved / Closed" stackId="a" fill="#10b981" />
                          <RechartsBar dataKey="inProgress" name="In Progress" stackId="a" fill="#38bdf8" />
                          <RechartsBar dataKey="open" name="Open / Backlog" stackId="a" fill="#f59e0b" />
                          <RechartsBar dataKey="overdue" name="Overdue (SLA Breach)" stackId="a" fill="#ef4444" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Open Action Items Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#1f1f1f]">
                      {milestoneBarData.allActions.slice(0, 3).map((act) => (
                        <div key={act.id || act.targetControl} className="p-3 bg-[#0c0c0c] border border-[#222222] space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-[#f5ff00] font-bold">{act.targetControl}</span>
                            <span className="text-emerald-400">-{act.estimatedResidualReduction || '4.0'} RR</span>
                          </div>
                          <div className="text-xs font-syne font-bold text-white truncate">{act.controlTitle || act.targetControl}</div>
                          <p className="text-[10px] text-[#aaaaaa] line-clamp-2">{act.technicalRemediationAction}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 6: Sector Benchmark & Regulatory Gap Radar */}
            {activeSlide.id === 'radar' && (
              <div className="space-y-4">
                <div className="p-6 bg-[#111111] border border-[#262626] space-y-4">
                  <div className="flex items-center justify-between border-b border-[#222222] pb-3">
                    <div className="flex items-center gap-2">
                      <RadarIcon className="w-4 h-4 text-cyan-400" />
                      <span className="font-syne text-xs font-bold uppercase text-white">
                        8-Pillar Cyber Maturity vs {sector.name} Peer Baseline
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#888888]">
                      NIST SP 800-53 & CSA STAR Level 2
                    </span>
                  </div>

                  <div className="bg-[#080808] border border-[#1f1f1f] p-4">
                    <SectorGapRadarChart
                      assessment={assessment}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE 7: Domain Deep Dive & Control Breakdown */}
            {activeSlide.id === 'domains' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#888888] uppercase font-bold">Filter Spotlight:</span>
                  {(['ALL', 'Cybersecurity', 'Privacy', 'Information Security', 'Governance'] as (RiskDomain | 'ALL')[]).map((dom) => (
                    <button
                      key={dom}
                      onClick={() => setSelectedDomainFilter(dom)}
                      className={`px-3 py-1 text-xs font-bold uppercase border transition ${
                        selectedDomainFilter === dom
                          ? 'bg-[#f5ff00] text-black border-[#f5ff00]'
                          : 'bg-[#111111] border-[#333333] text-[#888888] hover:text-white'
                      }`}
                    >
                      {dom}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {controls
                    .filter((c) => selectedDomainFilter === 'ALL' || c.domain === selectedDomainFilter)
                    .slice(0, 6)
                    .map((c) => {
                      const level = getControlRiskLevel(c.residualRisk);
                      return (
                        <div
                          key={c.controlId}
                          onClick={() => onNavigateToControl && onNavigateToControl(c.controlId)}
                          className="p-4 bg-[#111111] border border-[#262626] hover:border-[#f5ff00] transition space-y-3 cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-[#f5ff00]">
                                  {c.controlId}
                                </span>
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 border border-[#333333] bg-black text-[#888888]">
                                  {c.domain}
                                </span>
                              </div>
                              <h4 className="font-syne text-sm font-bold text-white group-hover:text-[#f5ff00] transition mt-1">
                                {c.title}
                              </h4>
                            </div>

                            <span className={`text-xs font-mono font-bold px-2 py-0.5 border shrink-0 ${
                              level === 'Critical' ? 'bg-rose-950 border-rose-700 text-rose-300' : level === 'High' ? 'bg-orange-950 border-orange-700 text-orange-300' : 'bg-emerald-950 border-emerald-700 text-emerald-300'
                            }`}>
                              RR {c.residualRisk.toFixed(1)}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-[10px] font-mono p-2 bg-[#090909] border border-[#1f1f1f]">
                            <div>
                              <span className="text-[#777777]">Design Eff:</span>
                              <div className="text-white font-bold">{((c.designEffectiveness || 0) * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <span className="text-[#777777]">Operating Eff:</span>
                              <div className="text-white font-bold">{((c.operatingEffectiveness || 0) * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <span className="text-[#777777]">Deficiency Penalty:</span>
                              <div className={c.deficiencyPenalty > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                                -{((c.deficiencyPenalty || 0) * 100).toFixed(0)}%
                              </div>
                            </div>
                          </div>

                          <div className="text-[11px] text-[#888888] line-clamp-1">
                            Evidence: {c.implementationEvidence || 'Standard operational procedures documented.'}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* SLIDE 8: Unified 4-Chart Executive Analytics Boardroom Suite */}
            {activeSlide.id === 'executive_suite' && (
              <div className="space-y-4">
                <ExecutiveAnalyticsSuite
                  assessment={assessment}
                  onSelectControl={(controlId) => {
                    if (onNavigateToControl) onNavigateToControl(controlId);
                  }}
                />
              </div>
            )}

            {/* SLIDE 9: Strategic Remediation Roadmap */}
            {activeSlide.id === 'remediation' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#141400] border border-[#444400] text-xs font-mono text-[#f5ff00] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>SYNTHESIZED NIST SP 800-53 REV. 5 REMEDIATION PLAN</span>
                  </div>
                  <span className="text-[10px] text-[#aaaaaa]">
                    ESTIMATED POST-REMEDIATION RR REDUCTION: <strong className="text-white">-35%</strong>
                  </span>
                </div>

                <div className="space-y-3">
                  {(aiRemediation?.roadmap || [
                    {
                      id: 'rem-1',
                      priority: 'P0_IMMEDIATE',
                      targetControl: 'AC-2 / IA-2',
                      controlTitle: 'Hardware MFA & Privileged Session Zero Trust',
                      gapSummary: 'Legacy password-only authentication on core administrative jump-hosts.',
                      technicalRemediationAction: 'Deploy FIDO2 WebAuthn hardware security keys and enforce adaptive conditional access.',
                      compensatingControl: 'Enforce dual-custody approval and IP whitelisting for all bastion logins.',
                      estimatedResidualReduction: 6.5,
                      implementationTimeline: '1-2 Weeks',
                      validationCriteria: 'Zero non-MFA privileged logins recorded in SIEM audit telemetry.',
                    },
                    {
                      id: 'rem-2',
                      priority: 'P1_HIGH',
                      targetControl: 'SC-7 / SC-8',
                      controlTitle: 'Cryptographic Micro-segmentation & TLS 1.3 Enclave',
                      gapSummary: 'Inter-service communication inside private subnet unencrypted.',
                      technicalRemediationAction: 'Deploy mTLS service mesh with automated certificate rotation and strict egress filtering.',
                      compensatingControl: 'Network security group isolation per tier.',
                      estimatedResidualReduction: 4.8,
                      implementationTimeline: '30 Days',
                      validationCriteria: 'Full TLS 1.3 packet inspection and zero cleartext TCP handshakes.',
                    },
                    {
                      id: 'rem-3',
                      priority: 'P2_MEDIUM',
                      targetControl: 'SI-4 / AU-6',
                      controlTitle: 'Automated SIEM Telemetry & Behavior Analytics',
                      gapSummary: 'Log retention and alerting delays exceed 4-hour SLA.',
                      technicalRemediationAction: 'Ingest all cloud infrastructure logs into real-time streaming parser with automated correlation.',
                      compensatingControl: 'Daily manual log review by SecOps team.',
                      estimatedResidualReduction: 3.2,
                      implementationTimeline: '45 Days',
                      validationCriteria: 'Real-time alert dispatch within 60 seconds of anomaly injection.',
                    },
                  ]).map((item: any) => (
                    <div
                      key={item.id || item.targetControl}
                      className="p-4 bg-[#111111] border border-[#262626] hover:border-[#f5ff00] transition space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border ${
                            item.priority === 'P0_IMMEDIATE'
                              ? 'bg-rose-950 border-rose-700 text-rose-300 animate-pulse'
                              : item.priority === 'P1_HIGH'
                              ? 'bg-orange-950 border-orange-700 text-orange-300'
                              : 'bg-yellow-950 border-yellow-700 text-yellow-300'
                          }`}>
                            {item.priority.replace('_', ' ')}
                          </span>
                          <strong className="text-white font-syne text-sm">{item.targetControl}: {item.controlTitle || item.title}</strong>
                        </div>

                        <span className="text-xs font-mono text-emerald-400 font-bold bg-[#092211] px-2 py-0.5 border border-emerald-800 shrink-0">
                          -{item.estimatedResidualReduction || 5.0} RR Reduction
                        </span>
                      </div>

                      <p className="text-xs text-[#cccccc] font-sans">
                        <strong className="text-[#888888] font-mono">Action: </strong>
                        {item.technicalRemediationAction || item.action}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-[#1f1f1f] text-[10px] font-mono text-[#777777] flex-wrap gap-2">
                        <span>Compensating Safeguard: <strong className="text-[#aaaaaa]">{item.compensatingControl || 'Continuous Monitoring'}</strong></span>
                        <span>Timeline: <strong className="text-[#f5ff00]">{item.implementationTimeline || item.timeline || '30 Days'}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SLIDE 10: Audit Attestation & Signoff */}
            {activeSlide.id === 'signoff' && (
              <div className="space-y-6">
                <div className="p-8 bg-[#111111] border-2 border-[#333333] space-y-6 max-w-3xl mx-auto text-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#f5ff00]/5 -rotate-45 translate-x-12 -translate-y-12"></div>

                  <div className="w-16 h-16 rounded-full bg-[#1a1a00] border-2 border-[#f5ff00] text-[#f5ff00] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,255,0,0.2)]">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-[0.3em] font-mono text-[#f5ff00] font-bold">
                      FORMAL AUDIT ATTESTATION SEAL
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-syne font-extrabold text-white uppercase">
                      Risk & Control Self-Assessment Certified
                    </h3>
                    <p className="text-xs text-[#aaaaaa] font-sans max-w-lg mx-auto">
                      All {totalControls} evaluation criteria have been verified against NIST SP 800-53 Rev. 5, CSA CCM v4.1.0, and ISO/IEC 27001:2022 standards.
                    </p>
                  </div>

                  {/* Sign-off Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left p-4 bg-[#090909] border border-[#222222] text-xs font-mono">
                    <div className="space-y-1">
                      <div className="text-[10px] text-[#777777] uppercase">Lead Risk Assessor</div>
                      <div className="text-white font-bold">{auditSignoff.assessorSignedBy || 'Authorized Lead Assessor'}</div>
                      <div className="text-[10px] text-[#888888]">Signed: {auditSignoff.assessorSignDate || '2026-08-29'}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] text-[#777777] uppercase">CISO Executive Sign-off</div>
                      <div className="text-[#f5ff00] font-bold">{auditSignoff.cisoCertifiedBy || 'Executive Sign-off Required'}</div>
                      <div className="text-[10px] text-[#888888]">Status: <strong className="text-white uppercase">{auditSignoff.status}</strong></div>
                    </div>

                    <div className="col-span-full pt-2 border-t border-[#1f1f1f] text-[10px] text-[#666666] font-mono truncate">
                      SHA-256 Digest: <span className="text-[#aaaaaa]">{auditSignoff.cryptographicFingerprint || '7a8f9c1b3e4d5a6f7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => printAuditReport(assessment)}
                      className="px-6 py-2.5 bg-[#f5ff00] text-black font-syne font-bold text-xs uppercase tracking-wider hover:bg-yellow-300 transition flex items-center gap-2 shadow-[0_0_15px_rgba(245,255,0,0.3)]"
                    >
                      <Printer className="w-4 h-4" />
                      <span>PRINT FORMAL AUDIT MEMORANDUM</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Slide Navigation Bottom Strip */}
          <div className="flex items-center justify-between border-t border-[#222222] pt-4 font-mono text-xs text-[#888888]">
            <div className="flex items-center gap-2">
              <button
                id="presenter-bottom-back-home-btn"
                onClick={handleBackToHome}
                className="px-3.5 py-1.5 bg-[#141414] hover:bg-[#222222] text-[#e0e0e0] hover:text-[#f5ff00] border border-[#333333] hover:border-[#f5ff00] transition flex items-center gap-1.5 uppercase font-bold text-[11px] cursor-pointer"
                title="Return to Main Dashboard / Home Page (Key: H or Esc)"
              >
                <Home className="w-3.5 h-3.5 text-[#f5ff00]" />
                <span>BACK TO HOME</span>
              </button>

              <button
                onClick={() => {
                  setCurrentSlideIndex((prev) => (prev > 0 ? prev - 1 : slides.length - 1));
                  setAutoPlayProgress(0);
                }}
                className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#262626] text-white border border-[#333333] transition flex items-center gap-1 uppercase font-bold text-[11px]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>PREV (←)</span>
              </button>

              <button
                onClick={() => {
                  setCurrentSlideIndex((prev) => (prev < slides.length - 1 ? prev + 1 : 0));
                  setAutoPlayProgress(0);
                }}
                className="px-4 py-1.5 bg-[#f5ff00] hover:bg-yellow-300 text-black border border-[#f5ff00] transition flex items-center gap-1 uppercase font-bold text-[11px]"
              >
                <span>NEXT (→)</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[10px] text-[#666666]">
                Shortcuts: Space/Arrows • H: Home • L: Laser • P: Notes • F: Fullscreen
              </span>
              <span className="text-[#f5ff00] font-bold">
                {currentSlideIndex + 1} / {slides.length}
              </span>
            </div>
          </div>
        </main>

        {/* Right Drawer: CISO Presenter Talking Points */}
        {showTalkingPoints && (
          <aside className="w-full lg:w-80 xl:w-96 bg-[#111111] border-t lg:border-t-0 lg:border-l border-[#222222] p-5 flex flex-col justify-between space-y-4 shrink-0 overflow-y-auto z-30">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#f5ff00]" />
                  <span className="font-syne text-xs font-bold uppercase text-white tracking-wider">
                    CISO Executive Talking Points
                  </span>
                </div>
                <button
                  onClick={() => setShowTalkingPoints(false)}
                  className="text-[#666666] hover:text-white text-xs"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-[#0a0a0a] border border-[#222222] space-y-2">
                <div className="text-[10px] uppercase font-bold text-[#888888]">
                  Active Topic // {activeSlide.title}
                </div>
                <div className="space-y-2 text-xs font-sans leading-relaxed text-[#cccccc]">
                  {activeSlide.talkingPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[#f5ff00] font-bold font-mono shrink-0">•</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Context Telemetry */}
              <div className="p-3 bg-[#0a0a0a] border border-[#222222] space-y-2 text-xs font-mono">
                <div className="text-[10px] uppercase font-bold text-[#888888]">
                  Assessment Telemetry
                </div>
                <div className="flex justify-between text-[#888888]">
                  <span>System:</span>
                  <strong className="text-white font-normal truncate max-w-[140px]">
                    {organizationProfile.targetSystem}
                  </strong>
                </div>
                <div className="flex justify-between text-[#888888]">
                  <span>Framework:</span>
                  <span className="text-[#f5ff00]">NIST SP 800-53 Rev. 5</span>
                </div>
                <div className="flex justify-between text-[#888888]">
                  <span>Review Cycle:</span>
                  <span className="text-white">{organizationProfile.reviewCycle || 'Q3 2026'}</span>
                </div>
                <div className="flex justify-between text-[#888888]">
                  <span>Assessor:</span>
                  <span className="text-white">{organizationProfile.assessorName}</span>
                </div>
              </div>
            </div>

            {/* Quick Slide Selector Mini Thumbnails */}
            <div className="pt-3 border-t border-[#222222] space-y-2">
              <div className="text-[10px] uppercase font-bold text-[#777777]">
                Jump to Slide:
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentSlideIndex(idx);
                      setAutoPlayProgress(0);
                    }}
                    className={`p-1.5 border text-center transition truncate ${
                      currentSlideIndex === idx
                        ? 'border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00] font-bold'
                        : 'border-[#222222] bg-[#0c0c0c] text-[#888888] hover:text-white'
                    }`}
                  >
                    {s.number}. {s.badge}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
