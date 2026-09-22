import React, { useState, useMemo } from 'react';
import {
  Printer,
  FileDown,
  ExternalLink,
  X,
  Sliders,
  CheckCircle2,
  Shield,
  Layers,
  Calendar,
  Award,
  AlertTriangle,
  FileText,
  Eye,
  Settings,
  Sparkles,
  Download,
} from 'lucide-react';
import {
  CouncilRTPDocumentHeader,
  CouncilRTPRisk,
  RiskTreatmentPlan,
  RCSAPayload,
} from '../types';
import {
  defaultCouncilHeader,
  initialCouncilRisks,
  assuranceMappingMatrix,
} from '../data/councilRTPTemplateData';
import {
  StandaloneRTPPdfExportOptions,
  defaultPdfExportOptions,
  generateStandaloneRTPHtml,
  printStandaloneRTPWindow,
  downloadStandaloneRTPHtml,
  triggerModalPrint,
} from '../utils/standaloneRtpPdfGenerator';

interface StandaloneRTPPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: RCSAPayload;
  rtp: RiskTreatmentPlan;
  initialRisks?: CouncilRTPRisk[];
  initialHeader?: CouncilRTPDocumentHeader;
}

export const StandaloneRTPPdfExportModal: React.FC<StandaloneRTPPdfExportModalProps> = ({
  isOpen,
  onClose,
  assessment,
  rtp,
  initialRisks = initialCouncilRisks,
  initialHeader = defaultCouncilHeader,
}) => {
  const [options, setOptions] = useState<StandaloneRTPPdfExportOptions>(defaultPdfExportOptions);
  const [activeTab, setActiveTab] = useState<'preview' | 'settings'>('preview');
  const [header, setHeader] = useState<CouncilRTPDocumentHeader>(initialHeader);

  // Sync risks from props or rtp
  const risks = useMemo(() => {
    if (initialRisks && initialRisks.length > 0) return initialRisks;
    return initialCouncilRisks;
  }, [initialRisks]);

  // Unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(risks.map((r) => r.category)));
  }, [risks]);

  // Filtered risks
  const filteredRisks = useMemo(() => {
    let list = [...risks];
    if (options.filterSeverity === 'HIGH_MEDIUM') {
      list = list.filter((r) => r.postMitigationCurrent === 'High' || r.postMitigationCurrent === 'Medium');
    } else if (options.filterSeverity === 'TOP_10') {
      list = list.filter((r) => r.isTop10 || r.postMitigationCurrent === 'High');
    }
    if (options.selectedCategory && options.selectedCategory !== 'ALL') {
      list = list.filter((r) => r.category === options.selectedCategory);
    }
    return list;
  }, [risks, options.filterSeverity, options.selectedCategory]);

  const top10Risks = useMemo(() => {
    return filteredRisks.filter((r) => r.isTop10).slice(0, 10);
  }, [filteredRisks]);

  // Counts
  const totalCount = filteredRisks.length;
  const highCount = filteredRisks.filter((r) => r.postMitigationCurrent === 'High').length;
  const medCount = filteredRisks.filter((r) => r.postMitigationCurrent === 'Medium').length;
  const lowCount = filteredRisks.filter((r) => r.postMitigationCurrent === 'Low').length;

  // Standalone HTML representation for export
  const standaloneHtml = useMemo(() => {
    return generateStandaloneRTPHtml(assessment, rtp, risks, header, options);
  }, [assessment, rtp, risks, header, options]);

  if (!isOpen) return null;

  const handleDirectPrint = () => {
    triggerModalPrint();
  };

  const handleOpenPrintWindow = () => {
    printStandaloneRTPWindow(standaloneHtml, `${header.documentRef}_Summary_PDF`);
  };

  const handleDownloadHtml = () => {
    const filename = `${assessment.assessmentId || 'RCSA'}_AUD_25_17_Risk_Treatment_Plan_Dossier.html`;
    downloadStandaloneRTPHtml(standaloneHtml, filename);
  };

  return (
    <div
      id="standalone-rtp-pdf-modal-overlay"
      className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden font-mono print-include"
    >
      {/* 1. MODAL TOP TOOLBAR (NO-PRINT) */}
      <div className="w-full max-w-6xl bg-[#141414] border border-[#333333] p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-white shrink-0 no-print no-print-pdf shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#f5ff00] text-black font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 bg-[#262626] text-[#38bdf8] border border-[#38bdf8]/40">
                STANDALONE PDF EXPORT
              </span>
              <span className="text-[10px] text-[#888888]">
                AUD 25/17 &bull; Tool 1.13 Template Format
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-syne font-bold uppercase tracking-tight text-white flex items-center gap-2 mt-0.5">
              <span>Risk Treatment Plan (RTP) Dossier</span>
              <span className="text-xs font-mono font-normal text-[#aaaaaa]">
                ({filteredRisks.length} Risks Scoped)
              </span>
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Settings / Preview Switcher */}
          <button
            onClick={() => setActiveTab(activeTab === 'preview' ? 'settings' : 'preview')}
            className={`px-3 py-1.5 border text-xs uppercase font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#f5ff00] bg-[#1e1e0a] text-[#f5ff00]'
                : 'border-[#333333] bg-black text-[#888888] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{activeTab === 'settings' ? 'View Document' : 'Customize Sections'}</span>
          </button>

          {/* Download HTML */}
          <button
            onClick={handleDownloadHtml}
            className="px-3 py-1.5 bg-[#1f1f1f] border border-[#333333] hover:border-white text-xs uppercase font-bold text-[#cccccc] hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            title="Download standalone offline HTML file ready to print/save as PDF"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Offline HTML</span>
          </button>

          {/* Open Clean Print Tab */}
          <button
            onClick={handleOpenPrintWindow}
            className="px-3 py-1.5 bg-[#1f1f1f] border border-[#333333] hover:border-[#38bdf8] text-xs uppercase font-bold text-[#38bdf8] transition flex items-center gap-1.5 cursor-pointer"
            title="Opens a clean, isolated browser window with 100% pure print styles and auto-triggers print"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Isolated Print Tab</span>
          </button>

          {/* Direct Print / Save PDF */}
          <button
            onClick={handleDirectPrint}
            className="px-4 py-1.5 bg-[#f5ff00] text-black font-bold text-xs uppercase hover:bg-yellow-300 transition flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,255,0,0.35)] cursor-pointer"
            title="Print or Save as PDF using browser print dialog"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-1.5 bg-black border border-[#333333] hover:border-rose-500 text-[#888888] hover:text-rose-400 transition cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN MODAL BODY AREA */}
      <div className="w-full max-w-6xl flex-1 overflow-y-auto bg-[#0a0a0a] border-x border-b border-[#333333] p-3 sm:p-6 flex flex-col items-center">
        {/* TAB 1: CUSTOMIZATION SETTINGS PANEL (IF ACTIVE) */}
        {activeTab === 'settings' && (
          <div className="w-full max-w-4xl bg-[#141414] border border-[#333333] p-5 text-white space-y-6 no-print no-print-pdf animate-in fade-in duration-150 mb-6">
            <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-[#f5ff00]">PDF Export Configuration</span>
                <h3 className="text-base font-syne font-bold uppercase mt-0.5">
                  Configure Sections, Scope &amp; Sign-offs
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('preview')}
                className="px-3 py-1 bg-[#f5ff00] text-black text-xs uppercase font-bold hover:bg-yellow-300 transition cursor-pointer"
              >
                Apply &amp; Return to Preview &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Left Column: Scope & Filters */}
              <div className="space-y-4">
                <span className="text-[11px] uppercase font-bold text-[#888888] tracking-wider block">
                  1. Risk Scope &amp; Severity Filter
                </span>

                <div className="space-y-2">
                  <label className="text-[10px] text-[#aaaaaa] uppercase block">Risk Severity Level:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'ALL', label: `All (${risks.length})` },
                      { id: 'HIGH_MEDIUM', label: 'High & Medium' },
                      { id: 'TOP_10', label: 'Top 10 Only' },
                    ].map((btn) => (
                      <button
                        key={btn.id}
                        type="button"
                        onClick={() =>
                          setOptions((prev) => ({ ...prev, filterSeverity: btn.id as any }))
                        }
                        className={`p-2 text-center border font-bold uppercase transition cursor-pointer ${
                          options.filterSeverity === btn.id
                            ? 'bg-[#0c1a24] border-[#38bdf8] text-[#38bdf8]'
                            : 'bg-black border-[#262626] text-[#777777] hover:text-white'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#aaaaaa] uppercase block">Functional Category Filter:</label>
                  <select
                    value={options.selectedCategory || 'ALL'}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, selectedCategory: e.target.value }))
                    }
                    className="w-full p-2 bg-black border border-[#333333] text-white text-xs font-mono focus:border-[#f5ff00] outline-none cursor-pointer"
                  >
                    <option value="ALL">All Categories ({categories.length})</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-[#aaaaaa] uppercase block">Document Reference:</label>
                  <input
                    type="text"
                    value={header.documentRef}
                    onChange={(e) => setHeader({ ...header, documentRef: e.target.value })}
                    className="w-full p-2 bg-black border border-[#333333] text-white text-xs font-mono focus:border-[#f5ff00] outline-none"
                  />
                </div>
              </div>

              {/* Right Column: Section Toggles */}
              <div className="space-y-4">
                <span className="text-[11px] uppercase font-bold text-[#888888] tracking-wider block">
                  2. Document Sections Inclusion
                </span>

                <div className="space-y-2.5">
                  {[
                    {
                      key: 'includeExecutiveSummary',
                      label: 'Executive Summary & Strategic Objectives',
                      desc: 'Council Strategic Objectives (SO1-SO6) & Risk Appetite Posture',
                    },
                    {
                      key: 'includeTop10Scorecard',
                      label: 'Top 10 Priority Risks Scorecard',
                      desc: 'Includes multi-cycle trend analysis (Feb-17, Sep-16, Feb-16) and Layered Mitigations I, II, III',
                    },
                    {
                      key: 'includeFullRegister',
                      label: 'Comprehensive Treatment Register',
                      desc: 'Full tabular matrix categorized by domain with CIA & ISO 27001 clauses',
                    },
                    {
                      key: 'includeMatrixCriteria',
                      label: 'Appendix II: 5x5 Scoring Matrix',
                      desc: '1-25 scoring grid and formal benchmark criteria (Public, Financial, Legal)',
                    },
                    {
                      key: 'includeAssuranceMapping',
                      label: 'Appendix IV: Three Lines of Defense Assurance',
                      desc: 'Operational management, corporate oversight, and independent audit evidence',
                    },
                    {
                      key: 'includeSignoffBlock',
                      label: 'Formal Governance Sign-off Block',
                      desc: 'Chief Executive, Audit Chair, and Lead Assessor signature lines with digital stamps',
                    },
                  ].map((sec) => {
                    const checked = (options as any)[sec.key];
                    return (
                      <label
                        key={sec.key}
                        className="flex items-start gap-2.5 p-2 bg-black border border-[#222222] hover:border-[#444444] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setOptions((prev) => ({ ...prev, [sec.key]: e.target.checked }))
                          }
                          className="mt-1 accent-[#f5ff00]"
                        />
                        <div>
                          <div className="font-bold text-white text-xs">{sec.label}</div>
                          <div className="text-[10px] text-[#777777] font-sans">{sec.desc}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE PRINTABLE A4 WHITE-PAPER DOCUMENT PREVIEW */}
        <div
          id="standalone-rtp-pdf-document"
          className="w-full max-w-[900px] bg-white text-[#0f172a] p-8 sm:p-12 shadow-2xl border border-[#cbd5e1] font-sans text-[9pt] leading-relaxed transition-all"
        >
          {/* DOCUMENT HEADER / COVER BANNER */}
          <div className="border-2 border-[#0f172a] p-5 mb-6 bg-[#fafafa]">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-[#0f172a] pb-4 mb-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 bg-[#0f172a] text-white font-mono text-[8pt] font-bold uppercase tracking-widest mb-2">
                  OFFICIAL GOVERNANCE DOSSIER
                </span>
                <h1 className="text-xl sm:text-2xl font-syne font-extrabold uppercase tracking-tight text-[#09090b]">
                  Risk Register &amp; Risk Treatment Plan
                </h1>
                <div className="text-xs text-[#475569] font-bold mt-1">
                  {header.reportTarget} &bull; {header.executiveTitle}
                </div>
              </div>
              <div className="text-right font-mono text-[8pt] text-[#475569] shrink-0">
                <div>REF: <strong className="text-[#0f172a]">{header.documentRef}</strong></div>
                <div>VERSION: <strong className="text-[#0f172a]">{header.versionTag}</strong></div>
                <div>DATE: <strong className="text-[#0f172a]">{header.issueDate}</strong></div>
                <div>STATUS: <strong className="text-[#0f172a]">{header.classification}</strong></div>
              </div>
            </div>

            <p className="text-[8.5pt] text-[#334155] leading-normal font-sans">
              <strong>Executive Purpose:</strong> This official Risk Treatment Plan (RTP) provides Council with a structured, post-RCSA governance framework evaluating corporate vulnerabilities, operational resilience, and cybersecurity exposures. It formalizes prioritized risk mitigations across the <em>Three Lines of Assurance</em>, defines clear remediation roadmaps, and benchmarks residual risk movement against Council&apos;s statutory risk appetite.
            </p>
          </div>

          {/* STAT STRIP */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-mono page-break-inside-avoid">
            <div className="border border-[#cbd5e1] bg-[#f8fafc] p-3">
              <div className="text-[7.5pt] font-bold uppercase text-[#64748b]">Total Registered Risks</div>
              <div className="text-2xl font-syne font-bold text-[#0f172a] mt-1">{totalCount}</div>
              <div className="text-[7pt] text-[#64748b]">Across {categories.length} Categories</div>
            </div>
            <div className="border border-[#cbd5e1] border-l-4 border-l-rose-600 bg-[#f8fafc] p-3">
              <div className="text-[7.5pt] font-bold uppercase text-rose-700">High Residual Risks</div>
              <div className="text-2xl font-syne font-bold text-rose-700 mt-1">{highCount}</div>
              <div className="text-[7pt] text-[#64748b]">Requires Urgent Council Action</div>
            </div>
            <div className="border border-[#cbd5e1] border-l-4 border-l-amber-500 bg-[#f8fafc] p-3">
              <div className="text-[7.5pt] font-bold uppercase text-amber-700">Medium Residual Risks</div>
              <div className="text-2xl font-syne font-bold text-amber-700 mt-1">{medCount}</div>
              <div className="text-[7pt] text-[#64748b]">Managed Under Active Controls</div>
            </div>
            <div className="border border-[#cbd5e1] border-l-4 border-l-emerald-600 bg-[#f8fafc] p-3">
              <div className="text-[7.5pt] font-bold uppercase text-emerald-700">Tolerated Risks</div>
              <div className="text-2xl font-syne font-bold text-emerald-700 mt-1">{lowCount}</div>
              <div className="text-[7pt] text-[#64748b]">Within Appetite Tolerance</div>
            </div>
          </div>

          {/* SECTION 1: STRATEGIC OBJECTIVES & RISK APPETITE */}
          {options.includeExecutiveSummary && (
            <div className="border border-[#cbd5e1] p-4 bg-[#f8fafc] mb-6 page-break-inside-avoid">
              <h3 className="font-syne font-bold uppercase text-[10pt] border-b border-[#cbd5e1] pb-1.5 mb-3 text-[#09090b]">
                1. Strategic Objectives (SO) &amp; Council Risk Appetite Posture
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[8pt] text-[#334155]">
                <div>
                  <strong className="text-[#0f172a] uppercase font-mono text-[7.5pt]">Strategic Alignment Matrix:</strong>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li><strong>SO1:</strong> Public Protection &amp; Patient Safety Benchmark</li>
                    <li><strong>SO2:</strong> Accurate Regulatory Registration &amp; Renewal</li>
                    <li><strong>SO3:</strong> Proportionate Fitness to Practise (FtP) Proceedings</li>
                    <li><strong>SO4:</strong> Education &amp; Training Quality Assurance</li>
                    <li><strong>SO5:</strong> Proactive Stakeholder Communication &amp; Transparency</li>
                    <li><strong>SO6:</strong> Financial Sustainability &amp; Operational Continuity</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-[#0f172a] uppercase font-mono text-[7.5pt]">Council Risk Appetite Guidelines:</strong>
                  <p className="mt-1 leading-relaxed">
                    Council maintains an <strong>Averse</strong> risk appetite for breaches of statutory public protection or regulatory non-compliance.
                    Council maintains a <strong>Cautious</strong> appetite for operational, IT, and financial disruptions, requiring that all residual scores &ge; 11 (High) be mitigated to Medium or Low within 90 business days.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: TOP 10 PRIORITY RISKS SCORECARD */}
          {options.includeTop10Scorecard && top10Risks.length > 0 && (
            <div className="mb-6 page-break-inside-avoid page-break-after-always">
              <div className="flex items-center justify-between border-b-2 border-[#0f172a] pb-1.5 mb-2.5">
                <div>
                  <h3 className="font-syne font-bold uppercase text-[11pt] text-[#09090b]">
                    2. Top 10 Priority Risks Scorecard (Multi-Cycle Trend)
                  </h3>
                  <div className="font-mono text-[7pt] text-[#64748b]">
                    Tracks post-mitigation trajectory across historic audit cycles and layers mitigations I, II, III
                  </div>
                </div>
                <span className="font-mono text-[7.5pt] font-bold px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 uppercase">
                  {top10Risks.length} Priority Risks
                </span>
              </div>

              <table className="w-full border-collapse border border-[#cbd5e1] text-[7.5pt] my-2">
                <thead>
                  <tr className="bg-[#0f172a] text-white font-mono text-[7pt] uppercase">
                    <th className="p-1.5 border border-[#cbd5e1] text-center w-8">Rank</th>
                    <th className="p-1.5 border border-[#cbd5e1] w-12">Ref</th>
                    <th className="p-1.5 border border-[#cbd5e1] w-16">Category</th>
                    <th className="p-1.5 border border-[#cbd5e1]">Risk Description &amp; Threat Context</th>
                    <th className="p-1.5 border border-[#cbd5e1] w-20">Owner</th>
                    <th className="p-1.5 border border-[#cbd5e1] text-center w-14">Pre-Score</th>
                    <th className="p-1.5 border border-[#cbd5e1] text-center w-16">Current Residual</th>
                    <th className="p-1.5 border border-[#cbd5e1] text-center w-14">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {top10Risks.map((r, idx) => (
                    <tr key={r.refCode} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                      <td className="p-1.5 border border-[#cbd5e1] text-center font-mono font-bold">
                        #{idx + 1}
                      </td>
                      <td className="p-1.5 border border-[#cbd5e1] font-mono font-bold text-[#0f172a]">
                        {r.refCode}
                      </td>
                      <td className="p-1.5 border border-[#cbd5e1]">{r.category}</td>
                      <td className="p-1.5 border border-[#cbd5e1]">
                        <strong className="text-[#09090b]">{r.description}</strong>
                        {r.ismsClause && (
                          <div className="text-[6.5pt] text-[#64748b] font-mono mt-0.5">
                            ISO 27001: {r.ismsClause} &bull; CIA: {r.ciaAttributes || 'C/I/A'}
                          </div>
                        )}
                        <div className="text-[7pt] text-[#334155] italic mt-1">
                          Mitigation I: {r.mitigation1}
                        </div>
                      </td>
                      <td className="p-1.5 border border-[#cbd5e1]">{r.riskOwner}</td>
                      <td className="p-1.5 border border-[#cbd5e1] text-center font-mono font-bold">
                        {r.preMitigationScore} / 25
                      </td>
                      <td className="p-1.5 border border-[#cbd5e1] text-center">
                        <span
                          className={`font-mono text-[7pt] font-bold px-1.5 py-0.5 border uppercase ${
                            r.postMitigationCurrent === 'High'
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : r.postMitigationCurrent === 'Medium'
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {r.postMitigationCurrent}
                        </span>
                      </td>
                      <td className="p-1.5 border border-[#cbd5e1] text-center font-mono text-[7pt]">
                        <span className="px-1 py-0.2 bg-slate-100 border border-slate-300 font-bold">
                          {r.treatmentDecision || 'TRT>TOL'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SECTION 3: COMPREHENSIVE RISK TREATMENT REGISTER */}
          {options.includeFullRegister && (
            <div className="mb-6">
              <div className="flex items-center justify-between border-b-2 border-[#0f172a] pb-1.5 mb-3">
                <div>
                  <h3 className="font-syne font-bold uppercase text-[11pt] text-[#09090b]">
                    3. Comprehensive Risk Treatment Plan Register
                  </h3>
                  <div className="font-mono text-[7pt] text-[#64748b]">
                    Full schedule of assessed controls, mitigation layers (I, II, III), and treatment options
                  </div>
                </div>
                <span className="font-mono text-[7.5pt] font-bold px-2 py-0.5 bg-slate-100 border border-slate-300 uppercase">
                  {filteredRisks.length} Total Controls
                </span>
              </div>

              {categories.map((cat) => {
                const catRisks = filteredRisks.filter((r) => r.category === cat);
                if (catRisks.length === 0) return null;

                return (
                  <div key={cat} className="mb-4 page-break-inside-avoid">
                    <div className="bg-[#e2e8f0] px-2.5 py-1 font-syne font-bold uppercase text-[8pt] text-[#0f172a] border-l-4 border-l-[#0f172a]">
                      Category / Domain: {cat} ({catRisks.length} Risks)
                    </div>

                    <table className="w-full border-collapse border border-[#cbd5e1] text-[7.5pt] my-1">
                      <thead>
                        <tr className="bg-[#0f172a] text-white font-mono text-[7pt] uppercase">
                          <th className="p-1.5 border border-[#cbd5e1] w-12">Ref</th>
                          <th className="p-1.5 border border-[#cbd5e1] w-40">Risk &amp; Description</th>
                          <th className="p-1.5 border border-[#cbd5e1] text-center w-12">Pre</th>
                          <th className="p-1.5 border border-[#cbd5e1]">Multi-Tier Controls (I, II, III)</th>
                          <th className="p-1.5 border border-[#cbd5e1] text-center w-14">Residual</th>
                          <th className="p-1.5 border border-[#cbd5e1] text-center w-14">Decision</th>
                          <th className="p-1.5 border border-[#cbd5e1] w-20">Owner</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catRisks.map((r, idx) => (
                          <tr key={r.refCode} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                            <td className="p-1.5 border border-[#cbd5e1] font-mono font-bold text-[#0f172a]">
                              {r.refCode}
                            </td>
                            <td className="p-1.5 border border-[#cbd5e1]">
                              <strong className="text-[#09090b]">{r.description}</strong>
                              {r.ismsClause && (
                                <div className="text-[6.5pt] text-[#64748b] font-mono">
                                  {r.ismsClause} ({r.ciaAttributes || 'C/I/A'})
                                </div>
                              )}
                            </td>
                            <td className="p-1.5 border border-[#cbd5e1] text-center font-mono font-bold">
                              {r.preMitigationScore}
                            </td>
                            <td className="p-1.5 border border-[#cbd5e1] text-[7pt] space-y-0.5">
                              <div><strong>I:</strong> {r.mitigation1}</div>
                              {r.mitigation2 && (
                                <div className="text-[#475569]"><strong>II:</strong> {r.mitigation2}</div>
                              )}
                              {r.mitigation3 && (
                                <div className="text-[#64748b]"><strong>III:</strong> {r.mitigation3}</div>
                              )}
                            </td>
                            <td className="p-1.5 border border-[#cbd5e1] text-center">
                              <span
                                className={`font-mono text-[6.5pt] font-bold px-1 py-0.2 border uppercase ${
                                  r.postMitigationCurrent === 'High'
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : r.postMitigationCurrent === 'Medium'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                }`}
                              >
                                {r.postMitigationCurrent}
                              </span>
                            </td>
                            <td className="p-1.5 border border-[#cbd5e1] text-center font-mono text-[7pt]">
                              <span className="px-1 py-0.2 bg-slate-100 border border-slate-300 font-bold">
                                {r.treatmentDecision || 'TRT>TOL'}
                              </span>
                            </td>
                            <td className="p-1.5 border border-[#cbd5e1] text-[7pt]">
                              <strong>{r.riskOwner}</strong>
                              <div className="text-[6.5pt] text-[#64748b]">Q3 2026</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {/* SECTION 4: APPENDIX II - 5X5 MATRIX */}
          {options.includeMatrixCriteria && (
            <div className="mb-6 page-break-inside-avoid">
              <div className="border-b-2 border-[#0f172a] pb-1.5 mb-3">
                <h3 className="font-syne font-bold uppercase text-[11pt] text-[#09090b]">
                  4. Appendix II: 5&times;5 Consequence &amp; Likelihood Matrix
                </h3>
                <div className="font-mono text-[7pt] text-[#64748b]">
                  Council Risk Appetite scoring model and evaluation thresholds
                </div>
              </div>

              <div className="grid grid-cols-6 gap-1 font-mono text-[7.5pt] my-3">
                <div className="p-2 bg-[#0f172a] text-white text-center font-bold">L \ C</div>
                <div className="p-2 bg-[#0f172a] text-white text-center font-bold">1 Insignif.</div>
                <div className="p-2 bg-[#0f172a] text-white text-center font-bold">2 Minor</div>
                <div className="p-2 bg-[#0f172a] text-white text-center font-bold">3 Moderate</div>
                <div className="p-2 bg-[#0f172a] text-white text-center font-bold">4 Major</div>
                <div className="p-2 bg-[#0f172a] text-white text-center font-bold">5 Catastr.</div>

                <div className="p-2 bg-[#f1f5f9] text-center font-bold">5 A. Certain</div>
                <div className="p-2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-center font-bold">5 L</div>
                <div className="p-2 bg-amber-100 text-amber-800 border border-amber-300 text-center font-bold">10 M</div>
                <div className="p-2 bg-rose-100 text-rose-800 border border-rose-300 text-center font-bold">15 H</div>
                <div className="p-2 bg-rose-100 text-rose-800 border border-rose-300 text-center font-bold">20 H</div>
                <div className="p-2 bg-rose-100 text-rose-800 border border-rose-300 text-center font-bold">25 H</div>

                <div className="p-2 bg-[#f1f5f9] text-center font-bold">4 Likely</div>
                <div className="p-2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-center font-bold">4 L</div>
                <div className="p-2 bg-amber-100 text-amber-800 border border-amber-300 text-center font-bold">8 M</div>
                <div className="p-2 bg-rose-100 text-rose-800 border border-rose-300 text-center font-bold">12 H</div>
                <div className="p-2 bg-rose-100 text-rose-800 border border-rose-300 text-center font-bold">16 H</div>
                <div className="p-2 bg-rose-100 text-rose-800 border border-rose-300 text-center font-bold">20 H</div>

                <div className="p-2 bg-[#f1f5f9] text-center font-bold">3 Possible</div>
                <div className="p-2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-center font-bold">3 L</div>
                <div className="p-2 bg-amber-100 text-amber-800 border border-amber-300 text-center font-bold">6 M</div>
                <div className="p-2 bg-amber-100 text-amber-800 border border-amber-300 text-center font-bold">9 M</div>
                <div className="p-2 bg-rose-100 text-rose-800 border border-rose-300 text-center font-bold">12 H</div>
                <div className="p-2 bg-rose-100 text-rose-800 border border-rose-300 text-center font-bold">15 H</div>

                <div className="p-2 bg-[#f1f5f9] text-center font-bold">2 Unlikely</div>
                <div className="p-2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-center font-bold">2 L</div>
                <div className="p-2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-center font-bold">4 L</div>
                <div className="p-2 bg-amber-100 text-amber-800 border border-amber-300 text-center font-bold">6 M</div>
                <div className="p-2 bg-amber-100 text-amber-800 border border-amber-300 text-center font-bold">8 M</div>
                <div className="p-2 bg-amber-100 text-amber-800 border border-amber-300 text-center font-bold">10 M</div>

                <div className="p-2 bg-[#f1f5f9] text-center font-bold">1 Rare</div>
                <div className="p-2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-center font-bold">1 L</div>
                <div className="p-2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-center font-bold">2 L</div>
                <div className="p-2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-center font-bold">3 L</div>
                <div className="p-2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-center font-bold">4 L</div>
                <div className="p-2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-center font-bold">5 L</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[7.5pt] mt-2">
                <div className="border border-rose-200 bg-rose-50 p-2 text-rose-900">
                  <strong>High Risk (Score 11 - 25):</strong>
                  <p className="mt-0.5">Unacceptable without urgent Senior Management Team and Council intervention.</p>
                </div>
                <div className="border border-amber-200 bg-amber-50 p-2 text-amber-900">
                  <strong>Medium Risk (Score 6 - 10):</strong>
                  <p className="mt-0.5">Tolerated under active quarterly monitoring and documented compensating safeguards.</p>
                </div>
                <div className="border border-emerald-200 bg-emerald-50 p-2 text-emerald-900">
                  <strong>Low Risk (Score 1 - 5):</strong>
                  <p className="mt-0.5">Acceptable within appetite. Maintained under standard operating procedures.</p>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: THREE LINES OF ASSURANCE */}
          {options.includeAssuranceMapping && (
            <div className="mb-6 page-break-inside-avoid">
              <div className="border-b-2 border-[#0f172a] pb-1.5 mb-3">
                <h3 className="font-syne font-bold uppercase text-[11pt] text-[#09090b]">
                  5. Appendix IV: Three Lines of Defense Assurance Mapping
                </h3>
                <div className="font-mono text-[7pt] text-[#64748b]">
                  Operational evidence, management oversight, and independent validation
                </div>
              </div>

              <table className="w-full border-collapse border border-[#cbd5e1] text-[7.5pt] my-2">
                <thead>
                  <tr className="bg-[#0f172a] text-white font-mono text-[7pt] uppercase">
                    <th className="p-1.5 border border-[#cbd5e1] w-36 text-left">Key Business Risk Area</th>
                    <th className="p-1.5 border border-[#cbd5e1] text-left">Area C: Management Control &amp; Reporting</th>
                    <th className="p-1.5 border border-[#cbd5e1] text-left">Area B: Functional Oversight</th>
                    <th className="p-1.5 border border-[#cbd5e1] text-left">Area A: Independent Assurance</th>
                  </tr>
                </thead>
                <tbody>
                  {assuranceMappingMatrix.map((a, idx) => (
                    <tr key={a.area} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]'}>
                      <td className="p-1.5 border border-[#cbd5e1] font-mono font-bold text-[#0f172a]">
                        {a.area}
                      </td>
                      <td className="p-1.5 border border-[#cbd5e1] text-[7pt]">
                        {a.areaC.join(', ')}
                      </td>
                      <td className="p-1.5 border border-[#cbd5e1] text-[7pt]">
                        {a.areaB.join(', ')}
                      </td>
                      <td className="p-1.5 border border-[#cbd5e1] text-[7pt]">
                        {a.areaA.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SECTION 6: FORMAL SIGN-OFF & ATTESTATION */}
          {options.includeSignoffBlock && (
            <div className="border-2 border-[#0f172a] p-4 bg-[#fafafa] mt-6 page-break-inside-avoid">
              <h3 className="font-syne font-bold uppercase text-[10pt] border-b border-[#0f172a] pb-1 mb-2 text-[#09090b]">
                6. Formal Governance Sign-off &amp; Executive Approvals
              </h3>
              <p className="text-[7.5pt] text-[#475569] mb-3">
                We hereby attest that this Risk Treatment Plan accurately reflects the operational, cybersecurity, and regulatory posture of <strong>{assessment.organizationProfile.targetSystem}</strong>. The treatment strategies and milestone commitments are approved for formal submission to Council and the Audit &amp; Risk Committee.
              </p>

              <div className="grid grid-cols-2 gap-3 text-[7.5pt]">
                <div className="border border-[#cbd5e1] bg-white p-2.5">
                  <div className="border-b border-[#94a3b8] h-8 flex items-end font-syne font-bold text-sm text-[#1e293b]">
                    {header.executiveTitle.split(',')[0]}
                  </div>
                  <div className="font-bold mt-1 text-[#0f172a]">{header.executiveTitle}</div>
                  <div className="text-[7pt] text-[#64748b]">Chief Executive &amp; Registrar &bull; Executive Sponsor</div>
                  <div className="text-[6.5pt] font-mono text-[#94a3b8] mt-1">Date: {header.issueDate} &bull; Verified Attestation</div>
                </div>

                <div className="border border-[#cbd5e1] bg-white p-2.5">
                  <div className="border-b border-[#94a3b8] h-8 flex items-end font-syne font-bold text-sm text-[#1e293b]">
                    Dr. Alistair Thorne, Chair
                  </div>
                  <div className="font-bold mt-1 text-[#0f172a]">Dr. Alistair Thorne, FCA</div>
                  <div className="text-[7pt] text-[#64748b]">Audit &amp; Risk Committee &bull; Independent Assurance</div>
                  <div className="text-[6.5pt] font-mono text-[#94a3b8] mt-1">Date: {header.issueDate} &bull; Certified</div>
                </div>

                <div className="border border-[#cbd5e1] bg-white p-2.5">
                  <div className="border-b border-[#94a3b8] h-8 flex items-end font-syne font-bold text-sm text-[#1e293b]">
                    {assessment.organizationProfile.assessorName}
                  </div>
                  <div className="font-bold mt-1 text-[#0f172a]">
                    {assessment.organizationProfile.assessorName} ({assessment.organizationProfile.assessorId})
                  </div>
                  <div className="text-[7pt] text-[#64748b]">Lead Risk Assessor &bull; System Custodian</div>
                  <div className="text-[6.5pt] font-mono text-[#94a3b8] mt-1">Date: {assessment.organizationProfile.lastAssessmentDate}</div>
                </div>

                <div className="border border-[#cbd5e1] bg-white p-2.5">
                  <div className="border-b border-[#94a3b8] h-8 flex items-end font-syne font-bold text-sm text-[#1e293b]">
                    Quality Certified
                  </div>
                  <div className="font-bold mt-1 text-[#0f172a]">Information Security &amp; Compliance Office</div>
                  <div className="text-[7pt] text-[#64748b]">ISO 27001 ISMS / NIST SP 800-53 Rev. 5</div>
                  <div className="text-[6.5pt] font-mono text-emerald-700 font-bold mt-1">Status: COMPLIANT &bull; Zero Critical Breaches</div>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT FOOTER */}
          <div className="border-t border-[#cbd5e1] pt-3 mt-6 font-mono text-[7pt] text-[#64748b] flex items-center justify-between">
            <div>
              Developed by <strong>www.technoscope.co.in</strong> &bull; Proprietary Copyright &bull; Council Risk Register &amp; Risk Treatment Plan (AUD 25/17)
            </div>
            <div>
              NIST SP 800-53 / ISO 27001 &bull; {assessment.organizationProfile.targetSystem}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
