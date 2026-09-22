import React, { useState, useMemo } from 'react';
import { RadarChart, BarChart } from '@mui/x-charts';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  Calendar,
  CheckSquare,
  Square,
  Shield,
  Layers,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Lock,
  Eye,
  Server,
  FileCheck,
  Building,
  Info,
  RefreshCw,
  Target,
} from 'lucide-react';
import { RCSAPayload, RiskDomain, RCSADomainType } from '../types';
import { exportRCSAToExcel, exportRCSAToJSON, printAuditReport } from '../utils/exportUtils';
import { SECTOR_PROFILES } from '../data/sectorProfiles';

interface ReportsSectionProps {
  assessment: RCSAPayload;
  onNavigateToStage: (stage: any) => void;
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({
  assessment,
  onNavigateToStage,
}) => {
  // Domain Selections
  const [selectedDomains, setSelectedDomains] = useState<RiskDomain[]>([
    'Privacy',
    'Information Security',
    'Cybersecurity',
    'Governance',
  ]);

  // Report Format & Profile Archetype
  const [reportType, setReportType] = useState<
    | 'executive_dossier'
    | 'comprehensive_audit'
    | 'deficiencies_poam'
    | 'regulatory_attestation'
    | 'source_gap_matrix'
  >('executive_dossier');

  // Date Range Configuration
  const [dateRangePreset, setDateRangePreset] = useState<
    'current_cycle' | 'last_90_days' | 'ytd_2026' | 'annual_horizon' | 'custom'
  >('current_cycle');
  const [customStartDate, setCustomStartDate] = useState('2026-01-01');
  const [customEndDate, setCustomEndDate] = useState('2026-08-16');

  // Executive Summary Inclusions
  const [inclusions, setInclusions] = useState({
    executiveSummary: true,
    residualRiskHeatmap: true,
    financialLossExposure: true,
    openDeficienciesPOA: true,
    aiPredictiveInsights: true,
    sourceControlEvidence: true,
    boardAttestationSignoff: true,
    domainMaturityScores: true,
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Toggle Inclusions
  const toggleInclusion = (key: keyof typeof inclusions) => {
    setInclusions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle Domain
  const toggleDomain = (dom: RiskDomain) => {
    if (selectedDomains.includes(dom)) {
      if (selectedDomains.length === 1) return; // Keep at least one
      setSelectedDomains(selectedDomains.filter((d) => d !== dom));
    } else {
      setSelectedDomains([...selectedDomains, dom]);
    }
  };

  // Filter controls matching selected domains
  const filteredControls = assessment.controls.filter((c) =>
    selectedDomains.includes(c.domain as RiskDomain)
  );

  const totalFiltered = filteredControls.length || 1;
  const avgInherent = Number(
    (filteredControls.reduce((s, c) => s + c.inherentRisk, 0) / totalFiltered).toFixed(1)
  );
  const avgResidual = Number(
    (filteredControls.reduce((s, c) => s + c.residualRisk, 0) / totalFiltered).toFixed(1)
  );
  const avgCEF = Number(
    (filteredControls.reduce((s, c) => s + c.calculatedCEF, 0) / totalFiltered).toFixed(2)
  );

  const criticalDeficiencies = filteredControls.filter(
    (c) => c.status === 'CRITICAL_DEFICIENCY'
  );
  const attentionDeficiencies = filteredControls.filter(
    (c) => c.status === 'NEEDS_ATTENTION'
  );

  // Heatmap matrix 5x5 distribution calculation
  const heatmap5x5Counts = useMemo(() => {
    const grid: Record<string, { count: number; codes: string[] }> = {};
    for (let imp = 1; imp <= 5; imp++) {
      for (let lik = 1; lik <= 5; lik++) {
        grid[`${imp}-${lik}`] = { count: 0, codes: [] };
      }
    }
    filteredControls.forEach((c) => {
      const imp = Math.min(5, Math.max(1, Math.round(c.inherentImpact || (c.residualRisk / 5))));
      const lik = Math.min(5, Math.max(1, Math.round(c.inherentLikelihood || (c.residualRisk / 5))));
      const key = `${imp}-${lik}`;
      if (grid[key]) {
        grid[key].count += 1;
        grid[key].codes.push(c.controlId);
      }
    });
    return grid;
  }, [filteredControls]);

  // Radar comparative dataset
  const radarChartData = useMemo(() => {
    const defaultProfile = SECTOR_PROFILES.Financial || Object.values(SECTOR_PROFILES)[0];
    const sectorKey = (assessment.organizationProfile.sector as keyof typeof SECTOR_PROFILES) || 'Financial';
    const sectorProfile = SECTOR_PROFILES[sectorKey] || defaultProfile;

    const domainsToRender = selectedDomains.length > 0 ? selectedDomains : ['Cybersecurity', 'Privacy', 'Information Security', 'Governance'];
    
    return domainsToRender.map((dom) => {
      const domControls = filteredControls.filter((c) => c.domain === dom);
      const dTotal = domControls.length || 1;
      const currentCEF = Number(
        ((domControls.reduce((s, c) => s + c.calculatedCEF, 0) / dTotal) * 100).toFixed(0)
      );
      const benchmarkScore = Math.min(95, Math.max(70, Math.round(82 * (sectorProfile.defaultRiskMultiplier ? (sectorProfile.defaultRiskMultiplier / 1.3) : 1))));

      return {
        domain: dom,
        currentScore: currentCEF,
        benchmarkTarget: benchmarkScore,
        peerAverage: Math.max(50, benchmarkScore - 8),
      };
    });
  }, [selectedDomains, filteredControls, assessment.organizationProfile.sector]);

  // Helper for heatmap cell severity coloring in report preview
  const getReportCellColor = (imp: number, lik: number) => {
    const product = imp * lik;
    if (product >= 16) return 'bg-rose-950/40 border-rose-700 text-rose-300';
    if (product >= 10) return 'bg-amber-950/40 border-amber-600 text-amber-300';
    if (product >= 5) return 'bg-yellow-950/40 border-yellow-600 text-yellow-300';
    return 'bg-emerald-950/40 border-emerald-600 text-emerald-300';
  };

  // Generate Bulk CSV Package
  const handleGenerateBulkCSV = () => {
    setIsExporting(true);
    try {
      const headers = [
        'Domain',
        'NIST Family',
        'Control ID',
        'Control Title',
        'Status',
        'Inherent Risk',
        'Calculated CEF',
        'Residual Risk',
        'Review Date',
        'Lead Assessor',
        'Sector',
        'Target System',
        'Audit Notes & Findings',
      ];

      const rows = filteredControls.map((c) => [
        `"${c.domain}"`,
        `"${c.family}"`,
        `"${c.controlId}"`,
        `"${c.title.replace(/"/g, '""')}"`,
        `"${c.implementationEvidence ? 'IMPLEMENTED' : 'EVALUATED'}"`,
        c.inherentRisk,
        c.calculatedCEF,
        c.residualRisk,
        `"${assessment.timestamp.split('T')[0]}"`,
        `"${assessment.organizationProfile.assessorName}"`,
        `"${assessment.organizationProfile.sector}"`,
        `"${assessment.organizationProfile.targetSystem.replace(/"/g, '""')}"`,
        `"${(c.gapsIdentified || c.implementationEvidence || 'No formal deficiency recorded').replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `Technoscope_RCSA_Bulk_Report_${selectedDomains.join('_')}_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportNotice(
        `Successfully generated Bulk CSV Report containing ${filteredControls.length} controls across ${selectedDomains.length} domains.`
      );
      setTimeout(() => setExportNotice(null), 5000);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Print PDF
  const handlePrintPDF = () => {
    window.print();
  };

  const getDateRangeLabel = () => {
    switch (dateRangePreset) {
      case 'current_cycle':
        return 'Q3 2026 Audit Cycle (Active)';
      case 'last_90_days':
        return 'Trailing 90-Day Window (May 18, 2026 – Aug 16, 2026)';
      case 'ytd_2026':
        return 'Calendar Year-to-Date 2026 (Jan 01, 2026 – Aug 16, 2026)';
      case 'annual_horizon':
        return 'Full Annual Horizon 2026-2027';
      case 'custom':
        return `${customStartDate} through ${customEndDate}`;
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-white">
      {/* Industrial Section Header */}
      <div className="border-b border-[#262626] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 border border-[#333333] bg-black text-[#888888]">
              REPORTING & AUDIT DOSSIER ENGINE
            </span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#f5ff00]">
              MULTI-DOMAIN COMPLIANCE PACKAGER
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-syne font-bold uppercase tracking-tight text-white">
            Reports & Dossier Generator
          </h2>
          <p className="text-xs sm:text-sm text-[#888888] mt-2 max-w-3xl leading-relaxed">
            Generate and export bulk multi-domain audit dossiers, board-level executive presentations, and CSV data ledgers with custom date filtering, framework mappings, and risk quantification.
          </p>
        </div>

        {/* Global Action Trigger Bar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleGenerateBulkCSV}
            disabled={isExporting}
            className="px-4 py-2.5 bg-[#222222] border border-[#333333] hover:border-[#f5ff00] hover:text-[#f5ff00] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
            title="Download Bulk CSV Data Matrix"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Generate Bulk CSV</span>
          </button>

          <button
            onClick={() => exportRCSAToExcel(assessment)}
            className="px-4 py-2.5 bg-[#222222] border border-[#333333] hover:border-[#f5ff00] hover:text-[#f5ff00] font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
            title="Export full multi-sheet Excel workbook"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Excel (XLSX)</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="px-5 py-2.5 bg-[#f5ff00] text-black hover:bg-yellow-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition shadow-[0_0_12px_rgba(245,255,0,0.25)]"
            title="Generate Board-ready Printable PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Export Notification Toast */}
      {exportNotice && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/80 text-emerald-300 text-xs font-mono flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Report Configuration Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Multi-Domain Scope & Archetype */}
        <div className="border border-[#262626] bg-[#141414] p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#f5ff00] uppercase tracking-wider font-bold">
                STEP 1: SCOPE & ARCHETYPE
              </span>
              <span className="font-mono text-[10px] text-[#888888]">
                {selectedDomains.length} / 4 DOMAINS
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase font-mono font-bold text-[#aaaaaa] block">
                Target Risk Domains (Multi-Select):
              </label>
              <div className="space-y-2">
                {[
                  { id: 'Privacy', label: 'Privacy RCSA', icon: Eye, count: 6, color: 'text-purple-400' },
                  { id: 'Information Security', label: 'InfoSec RCSA (ISMS)', icon: Server, count: 8, color: 'text-blue-400' },
                  { id: 'Cybersecurity', label: 'Cyber Defense & Zero Trust', icon: Lock, count: 6, color: 'text-emerald-400' },
                  { id: 'Governance', label: 'Governance & Risk Oversight', icon: Layers, count: 4, color: 'text-amber-400' },
                ].map((d) => {
                  const isChecked = selectedDomains.includes(d.id as RiskDomain);
                  const Icon = d.icon;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDomain(d.id as RiskDomain)}
                      className={`w-full p-3 border text-left flex items-center justify-between transition ${
                        isChecked
                          ? 'border-[#f5ff00] bg-[#1c1c08] text-white font-medium'
                          : 'border-[#2a2a2a] bg-black text-[#777777] hover:border-[#444444]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-[#f5ff00]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#555555]" />
                        )}
                        <Icon className={`w-3.5 h-3.5 ${d.color}`} />
                        <span className="font-mono text-xs">{d.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#888888]">
                        {d.count} Controls
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-[11px] uppercase font-mono font-bold text-[#aaaaaa] block">
                Report Dossier Archetype:
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
              >
                <option value="executive_dossier">Executive Board Presentation & Heatmap Dossier</option>
                <option value="comprehensive_audit">Comprehensive Audit Working Papers (NIST SP 800-53)</option>
                <option value="deficiencies_poam">Deficiencies & Corrective Action POA&M Ledger</option>
                <option value="regulatory_attestation">Regulatory Attestation & Sign-off Package</option>
                <option value="source_gap_matrix">CSA CAIQ & NIST Source Questionnaire Gap Matrix</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[#262626] text-[11px] font-mono text-[#888888] flex items-center justify-between">
            <span>Filtered Scope:</span>
            <span className="text-[#f5ff00] font-bold">{filteredControls.length} Controls Selected</span>
          </div>
        </div>

        {/* Column 2: Date Range & Timeline Filters */}
        <div className="border border-[#262626] bg-[#141414] p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#f5ff00] uppercase tracking-wider font-bold">
                STEP 2: DATE RANGE & CADENCE
              </span>
              <Calendar className="w-3.5 h-3.5 text-[#888888]" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase font-mono font-bold text-[#aaaaaa] block">
                Audit Cycle Presets:
              </label>
              <div className="space-y-2">
                {[
                  { id: 'current_cycle', label: 'Current Cycle (Q3 2026 Audit)' },
                  { id: 'last_90_days', label: 'Last 90 Days Telemetry' },
                  { id: 'ytd_2026', label: 'Year-to-Date 2026 (YTD)' },
                  { id: 'annual_horizon', label: 'Full Annual Horizon 2026-2027' },
                  { id: 'custom', label: 'Custom Date Range...' },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setDateRangePreset(preset.id as any)}
                    className={`w-full p-2.5 text-xs font-mono text-left border transition ${
                      dateRangePreset === preset.id
                        ? 'border-[#f5ff00] bg-[#1c1c08] text-[#f5ff00] font-bold'
                        : 'border-[#2a2a2a] bg-black text-[#888888] hover:border-[#444444]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {dateRangePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[10px] uppercase font-mono text-[#888888] block mb-1">
                    Start Date:
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-[#888888] block mb-1">
                    End Date:
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#262626] text-[11px] font-mono text-[#888888]">
            <span className="text-[#666666]">Active Window: </span>
            <span className="text-white font-medium">{getDateRangeLabel()}</span>
          </div>
        </div>

        {/* Column 3: Executive Inclusions & Sections */}
        <div className="border border-[#262626] bg-[#141414] p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] text-[#f5ff00] uppercase tracking-wider font-bold">
                STEP 3: EXECUTIVE INCLUSIONS
              </span>
              <Sliders className="w-3.5 h-3.5 text-[#888888]" />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] uppercase font-mono font-bold text-[#aaaaaa] block">
                Dossier Sections & Attachments:
              </label>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {[
                  { key: 'executiveSummary', label: 'Executive Board Summary' },
                  { key: 'residualRiskHeatmap', label: 'Residual Risk Heatmap 5x5' },
                  { key: 'domainMaturityScores', label: 'Multi-Domain Risk Comparison' },
                  { key: 'openDeficienciesPOA', label: 'Open Deficiencies & POA&M' },
                  { key: 'aiPredictiveInsights', label: 'AI Predictive Threat Analysis' },
                  { key: 'sourceControlEvidence', label: 'Control Findings & CAIQ Mappings' },
                  { key: 'boardAttestationSignoff', label: 'Officer Sign-off Attestation' },
                  { key: 'financialLossExposure', label: 'Loss Modeling (ALE / SLE)' },
                ].map((item) => {
                  const isChecked = inclusions[item.key as keyof typeof inclusions];
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleInclusion(item.key as keyof typeof inclusions)}
                      className="p-2 border border-[#222222] bg-black hover:border-[#333333] cursor-pointer flex items-center justify-between text-xs font-mono"
                    >
                      <span className={isChecked ? 'text-white' : 'text-[#666666]'}>
                        {item.label}
                      </span>
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#f5ff00]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-[#444444]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#262626] flex items-center justify-between">
            <button
              onClick={() =>
                setInclusions({
                  executiveSummary: true,
                  residualRiskHeatmap: true,
                  financialLossExposure: true,
                  openDeficienciesPOA: true,
                  aiPredictiveInsights: true,
                  sourceControlEvidence: true,
                  boardAttestationSignoff: true,
                  domainMaturityScores: true,
                })
              }
              className="text-[10px] font-mono text-[#888888] hover:text-[#f5ff00] underline"
            >
              Select All
            </button>
            <span className="text-[10px] font-mono text-[#f5ff00]">
              {Object.values(inclusions).filter(Boolean).length} / 8 Included
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* LIVE AUDIT DOSSIER PREVIEW CANVAS (PRINT READY)                  */}
      {/* ================================================================= */}
      <div className="border border-[#333333] bg-[#0c0c0c] p-6 sm:p-10 space-y-8 shadow-2xl relative">
        {/* Dossier Meta Top Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-white pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs uppercase tracking-widest text-[#888888]">
                CONFIDENTIAL AUDIT ARTIFACT // FOR BOARD & AUDITOR DISCLOSURE
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-syne font-extrabold uppercase text-white tracking-tight">
              {assessment.assessmentName || assessment.organizationProfile.targetSystem}
            </h1>
            <p className="text-xs font-mono text-[#aaaaaa] mt-1">
              {assessment.organizationProfile.businessUnit} • {assessment.organizationProfile.targetSystem}
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-xs space-y-1">
            <div className="text-[#f5ff00] font-bold">REPORT REF: RCSA-DOSSIER-2026-Q3</div>
            <div className="text-[#888888]">DATE RANGE: {getDateRangeLabel()}</div>
            <div className="text-[#888888]">ASSESSOR: {assessment.organizationProfile.assessorName}</div>
          </div>
        </div>

        {/* Aggregate KPI Metric Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <div className="p-4 bg-[#141414] border border-[#262626]">
            <div className="text-[10px] uppercase text-[#888888]">Inherent Risk Baseline</div>
            <div className="text-2xl font-bold text-white mt-1">{avgInherent} / 25</div>
            <div className="text-[10px] text-[#666666] mt-0.5">Pre-Mitigation Exposure</div>
          </div>

          <div className="p-4 bg-[#141414] border border-[#262626]">
            <div className="text-[10px] uppercase text-[#888888]">Control Effectiveness</div>
            <div className="text-2xl font-bold text-[#f5ff00] mt-1">{(avgCEF * 100).toFixed(0)}%</div>
            <div className="text-[10px] text-[#666666] mt-0.5">Calculated CEF Maturity</div>
          </div>

          <div className="p-4 bg-[#141414] border border-[#262626]">
            <div className="text-[10px] uppercase text-[#888888]">Residual Risk Posture</div>
            <div className="text-2xl font-bold text-white mt-1">{avgResidual} / 25</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">
              ↓ {Math.round(((avgInherent - avgResidual) / avgInherent) * 100)}% Net Reduction
            </div>
          </div>

          <div className="p-4 bg-[#141414] border border-[#262626]">
            <div className="text-[10px] uppercase text-[#888888]">Critical Deficiencies</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">{criticalDeficiencies.length}</div>
            <div className="text-[10px] text-[#888888] mt-0.5">{attentionDeficiencies.length} Needs Attention</div>
          </div>
        </div>

        {/* Section 1: Executive Summary Inclusion */}
        {inclusions.executiveSummary && (
          <div className="space-y-3 pt-4 border-t border-[#222222]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#f5ff00] text-black">
                SECTION 01
              </span>
              <h3 className="font-syne text-lg font-bold uppercase text-white">
                Executive Risk Summary & Strategic Context
              </h3>
            </div>
            <div className="p-5 bg-[#141414] border border-[#262626] font-sans text-xs text-[#cccccc] leading-relaxed space-y-2">
              <p>
                This multi-domain Risk & Control Self-Assessment evaluated <strong className="text-white font-semibold">{filteredControls.length} controls</strong> across the <strong className="text-[#f5ff00]">{selectedDomains.join(', ')}</strong> operational spectrum. Under the <strong className="text-white">{assessment.organizationProfile.complianceTarget}</strong> framework, the overall system exhibits an aggregate Control Effectiveness Factor (CEF) of <strong className="text-[#f5ff00]">{(avgCEF * 100).toFixed(0)}%</strong>, resulting in a net residual risk posture of <strong className="text-white">{avgResidual} / 25</strong>.
              </p>
              <p>
                Immediate priority must be given to <strong className="text-rose-400 font-semibold">{criticalDeficiencies.length} critical deficiencies</strong>, primarily centered around continuous telemetry monitoring, session token revocation, and cross-border PII transfer validation.
              </p>
            </div>
          </div>
        )}

        {/* Section 2: Domain-by-Domain Posture Breakdown & Radar Gap */}
        {inclusions.domainMaturityScores && (
          <div className="space-y-4 pt-4 border-t border-[#222222] print-break-avoid">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#f5ff00] text-black">
                SECTION 02
              </span>
              <h3 className="font-syne text-lg font-bold uppercase text-white">
                Multi-Domain Risk & Benchmark Gap Analysis
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Domain Maturity Table */}
              <div className="lg:col-span-7 overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border border-[#262626]">
                  <thead className="bg-[#181818] text-[#888888] border-b border-[#262626]">
                    <tr>
                      <th className="p-2.5">Domain</th>
                      <th className="p-2.5">CEF</th>
                      <th className="p-2.5">Residual</th>
                      <th className="p-2.5">Deficiencies</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222] bg-[#111111]">
                    {selectedDomains.map((dom) => {
                      const domControls = filteredControls.filter((c) => c.domain === dom);
                      const dTotal = domControls.length || 1;
                      const dResidual = Number(
                        (domControls.reduce((s, c) => s + c.residualRisk, 0) / dTotal).toFixed(1)
                      );
                      const dCEF = Number(
                        (domControls.reduce((s, c) => s + c.calculatedCEF, 0) / dTotal).toFixed(2)
                      );
                      const dDef = domControls.filter(
                        (c) => c.status === 'CRITICAL_DEFICIENCY' || c.status === 'NEEDS_ATTENTION'
                      ).length;

                      return (
                        <tr key={dom} className="hover:bg-[#161616]">
                          <td className="p-2.5 font-bold text-white flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#f5ff00]" />
                            {dom}
                          </td>
                          <td className="p-2.5 text-[#f5ff00] font-bold">{(dCEF * 100).toFixed(0)}%</td>
                          <td className="p-2.5 text-white font-bold">{dResidual} / 25</td>
                          <td className="p-2.5">
                            {dDef > 0 ? (
                              <span className="text-rose-400 font-bold">{dDef} Open</span>
                            ) : (
                              <span className="text-emerald-400 font-medium">0 Clear</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 text-[9px] font-bold border border-[#333333] bg-black text-[#cccccc]">
                              {dDef > 0 ? 'ATTENTION' : 'COMPLIANT'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Radar Chart Visual */}
              <div className="lg:col-span-5 p-3 bg-[#141414] border border-[#262626] flex flex-col items-center justify-center">
                <div className="w-full text-center pb-1 border-b border-[#262626] mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#888888]">
                    Radar Gap vs Sector Profile
                  </span>
                  <span className="text-[9px] font-mono text-[#f5ff00]">
                    {assessment.organizationProfile.sector}
                  </span>
                </div>
                <div className="w-full h-48 sm:h-56 flex items-center justify-center">
                  <RadarChart
                    radar={{
                      metrics: radarChartData.map((d) => d.domain),
                      max: 100,
                    }}
                    series={[
                      {
                        id: 'current',
                        label: 'Assessment',
                        data: radarChartData.map((d) => d.currentScore),
                        color: '#f5ff00',
                        fillArea: true,
                      },
                      {
                        id: 'benchmark',
                        label: 'Benchmark',
                        data: radarChartData.map((d) => d.benchmarkTarget),
                        color: '#38bdf8',
                        fillArea: true,
                      },
                    ]}
                    height={210}
                    sx={{
                      width: '100%',
                      '& .MuiChartsRotationAxis-tickLabel': {
                        fill: '#aaaaaa !important',
                        fontFamily: 'monospace !important',
                        fontSize: '9px !important',
                      },
                      '& .MuiRadarGrid-root line, & .MuiRadarGrid-root path': {
                        stroke: '#333333 !important',
                      },
                      '& .MuiChartsLegend-root text': {
                        fill: '#aaaaaa !important',
                        fontFamily: 'monospace !important',
                        fontSize: '9px !important',
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: Residual Risk Heatmap Matrix (5x5) */}
        {inclusions.residualRiskHeatmap && (
          <div className="space-y-3 pt-4 border-t border-[#222222] print-break-avoid">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#f5ff00] text-black">
                  SECTION 03
                </span>
                <h3 className="font-syne text-lg font-bold uppercase text-white">
                  Residual Risk Heatmap Matrix (5 × 5 Topology)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#888888]">
                Total Controls: <strong className="text-white">{filteredControls.length}</strong>
              </span>
            </div>

            <div className="p-4 bg-[#141414] border border-[#262626] space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#888888] pb-1 border-b border-[#262626]">
                <span>Likelihood (Y-Axis: L5 to L1)</span>
                <span>Impact (X-Axis: I1 to I5)</span>
              </div>

              {/* 5x5 Heatmap rows */}
              <div className="space-y-1.5 pt-1">
                {[5, 4, 3, 2, 1].map((lik) => (
                  <div key={lik} className="flex items-center gap-2">
                    <div className="w-7 text-right font-mono text-[10px] font-bold text-[#888888]">
                      L{lik}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 flex-1">
                      {[1, 2, 3, 4, 5].map((imp) => {
                        const cell = heatmap5x5Counts[`${imp}-${lik}`] || { count: 0, codes: [] };
                        const colorClass = getReportCellColor(imp, lik);
                        return (
                          <div
                            key={imp}
                            className={`p-2 border rounded-none flex items-center justify-between ${colorClass}`}
                          >
                            <span className="text-[9px] font-mono font-bold opacity-70">
                              {imp}×{lik}
                            </span>
                            <span className="text-xs font-mono font-bold">
                              {cell.count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-[#888888] border-t border-[#222222]">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-emerald-950 border border-emerald-600 inline-block" /> Low
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-yellow-950 border border-yellow-600 inline-block" /> Medium
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-amber-950 border border-amber-600 inline-block" /> High
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 bg-rose-950 border border-rose-700 inline-block" /> Critical
                  </span>
                </div>
                <span>CEF Mitigated Posture</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Open Deficiencies & POA&M Ledger */}
        {inclusions.openDeficienciesPOA && (
          <div className="space-y-3 pt-4 border-t border-[#222222] print-break-avoid">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#f5ff00] text-black">
                SECTION 04
              </span>
              <h3 className="font-syne text-lg font-bold uppercase text-white">
                Corrective Action Plan & Deficiencies Ledger (POA&M)
              </h3>
            </div>

            <div className="space-y-2">
              {[...criticalDeficiencies, ...attentionDeficiencies].slice(0, 5).map((def) => (
                <div
                  key={def.controlId}
                  className="p-4 bg-[#141414] border border-[#2a2a2a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                        {def.controlId}
                      </span>
                      <span className="font-bold text-white">{def.title}</span>
                      <span className="text-[#888888]">({def.domain})</span>
                    </div>
                    <p className="text-[#999999] text-[11px]">
                      {def.gapsIdentified || def.implementationEvidence || 'Inadequate compensating controls identified during technical audit examination.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] text-[#888888]">Residual Risk</div>
                      <div className="text-sm font-bold text-rose-400">{def.residualRisk} / 25</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Formal Attestation Sign-Off */}
        {inclusions.boardAttestationSignoff && (
          <div className="space-y-3 pt-6 border-t-2 border-[#333333]">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#f5ff00] text-black">
                VERIFICATION
              </span>
              <h3 className="font-syne text-lg font-bold uppercase text-white">
                Formal Attestation & Officer Certification
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 font-mono text-xs">
              <div className="p-4 bg-[#141414] border border-[#262626] space-y-3">
                <div className="text-[#888888] text-[10px] uppercase">Lead Risk Assessor Signature</div>
                <div className="text-white font-bold">{assessment.auditSignoff.assessorSignedBy || assessment.organizationProfile.assessorName}</div>
                <div className="border-b border-[#333333] pt-4 font-mono text-[10px] text-[#666666]">
                  CERTIFIED DATE: {assessment.auditSignoff.assessorSignDate || '2026-08-29'}
                </div>
              </div>

              <div className="p-4 bg-[#141414] border border-[#262626] space-y-3">
                <div className="text-[#888888] text-[10px] uppercase">Executive Officer Approval</div>
                <div className="text-white font-bold">{assessment.auditSignoff.cisoCertifiedBy || 'Chief Information Security Officer'}</div>
                <div className="border-b border-[#333333] pt-4 font-mono text-[10px] text-[#666666]">
                  BOARD SUBMISSION: {assessment.auditSignoff.cisoCertifyDate || '2026-08-29'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
