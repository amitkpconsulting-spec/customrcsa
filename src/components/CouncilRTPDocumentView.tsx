import React, { useState, useMemo } from 'react';
import {
  Shield,
  FileText,
  Printer,
  Plus,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  BookOpen,
  Sliders,
  Award,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  defaultCouncilHeader,
  initialCouncilRisks,
  glossaryTerms,
  ismsClausesList,
  assuranceMappingMatrix,
} from '../data/councilRTPTemplateData';
import { CouncilRTPDocumentHeader, CouncilRTPRisk, RiskTreatmentPlan } from '../types';

interface CouncilRTPDocumentViewProps {
  rtp: RiskTreatmentPlan;
  onUpdatePlan?: (updated: RiskTreatmentPlan) => void;
  onAddNewRiskItem?: () => void;
  onExportPdf?: () => void;
}

export const CouncilRTPDocumentView: React.FC<CouncilRTPDocumentViewProps> = ({
  rtp,
  onUpdatePlan,
  onExportPdf,
}) => {
  const [header, setHeader] = useState<CouncilRTPDocumentHeader>(defaultCouncilHeader);
  const [risks, setRisks] = useState<CouncilRTPRisk[]>(() => {
    // Merge initialCouncilRisks with any existing high residual items from the active assessment
    const assessmentRisks: CouncilRTPRisk[] = rtp.items.map((item, idx) => {
      const imp = Math.min(5, Math.max(1, Math.round(item.inherentRisk / 5)));
      const lik = Math.min(5, Math.max(1, Math.round((item.residualRisk / 5) * 1.2)));
      const postScore: 'High' | 'Medium' | 'Low' =
        item.residualRisk >= 11 ? 'High' : item.residualRisk >= 6 ? 'Medium' : 'Low';

      return {
        refCode: item.refCode || `NIST.${idx + 1}`,
        category: item.rtpCategory || item.domain || 'Cybersecurity',
        ismsClause: item.ismsClause || 'ISO 27001 A9, 12, 14',
        ciaAttributes: item.ciaAttributes || 'C/I/A',
        treatmentDecision: item.treatmentDecision || (item.treatmentOption === 'MITIGATE' ? 'TRT>TOL' : 'TRT'),
        description: `${item.controlId} - ${item.controlTitle}: ${item.treatmentRationale || 'Operational deficiency remediation'}`,
        riskOwner: item.namedOwner || 'CISO & Systems Custodian',
        impactBefore: item.impactBefore || imp,
        likelihoodBefore: item.likelihoodBefore || lik,
        preMitigationScore: item.preMitigationScore || imp * lik,
        mitigation1: item.mitigation1 || item.actionPlanSteps[0] || 'Technical safeguard deployment and policy enforcement',
        mitigation2: item.mitigation2 || item.actionPlanSteps[1] || 'Continuous automated telemetric monitoring and alert escalation',
        mitigation3: item.mitigation3 || item.actionPlanSteps[2] || 'Quarterly independent review and CISO re-attestation',
        postMitigationCurrent: item.postMitigationCurrent || postScore,
        postMitigationPrevious: item.postMitigationPrevious || 'Medium',
        historicScores: item.historicScores || [
          { cycle: 'Feb-17', score: postScore },
          { cycle: 'Sep-16', score: 'Medium' },
          { cycle: 'Feb-16', score: 'Medium' },
        ],
        natureOfChange: item.natureOfChange,
        isTop10: item.residualRisk >= 9.0,
        relatedControlId: item.controlId,
      };
    });

    // Deduplicate against initialCouncilRisks by refCode
    const existingRefCodes = new Set(initialCouncilRisks.map((r) => r.refCode));
    const combined = [...initialCouncilRisks];
    for (const ar of assessmentRisks) {
      if (!existingRefCodes.has(ar.refCode)) {
        combined.push(ar);
      }
    }
    return combined;
  });

  const [activeTab, setActiveTab] = useState<
    'top10' | 'register' | 'changes' | 'matrix' | 'objectives' | 'assurance' | 'glossary'
  >('top10');

  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDecision, setSelectedDecision] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Risk Form State
  const [newRefCode, setNewRefCode] = useState('');
  const [newCategory, setNewCategory] = useState('Information Security');
  const [newIsms, setNewIsms] = useState('ISO 27001 A9, 12, 14');
  const [newCia, setNewCia] = useState('C/I/A');
  const [newDecision, setNewDecision] = useState<'TRT' | 'TOL' | 'TSF' | 'TMT' | 'TRT>TOL'>('TRT>TOL');
  const [newDesc, setNewDesc] = useState('');
  const [newOwner, setNewOwner] = useState('Director of IT');
  const [newImpact, setNewImpact] = useState(4);
  const [newLikelihood, setNewLikelihood] = useState(4);
  const [newMit1, setNewMit1] = useState('');
  const [newMit2, setNewMit2] = useState('');
  const [newMit3, setNewMit3] = useState('');
  const [newPostScore, setNewPostScore] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set<string>();
    risks.forEach((r) => set.add(r.category));
    return Array.from(set).sort();
  }, [risks]);

  // Top 10 Risks (High & Medium after mitigation)
  const top10Risks = useMemo(() => {
    return risks
      .filter((r) => r.postMitigationCurrent === 'High' || r.postMitigationCurrent === 'Medium')
      .sort((a, b) => {
        // High first, then highest pre-mitigation score
        if (a.postMitigationCurrent === 'High' && b.postMitigationCurrent !== 'High') return -1;
        if (b.postMitigationCurrent === 'High' && a.postMitigationCurrent !== 'High') return 1;
        return b.preMitigationScore - a.preMitigationScore;
      })
      .slice(0, 10);
  }, [risks]);

  // Changes since last published
  const changedRisks = useMemo(() => {
    return risks.filter(
      (r) =>
        r.natureOfChange ||
        r.postMitigationPrevious === 'NEW' ||
        (r.postMitigationCurrent !== r.postMitigationPrevious && r.postMitigationPrevious)
    );
  }, [risks]);

  // Filtered Register Risks
  const filteredRegister = useMemo(() => {
    return risks.filter((r) => {
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
      if (selectedDecision !== 'ALL' && r.treatmentDecision !== selectedDecision) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          r.refCode.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.riskOwner.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.ismsClause && r.ismsClause.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [risks, selectedCategory, selectedDecision, searchQuery]);

  const handleAddRisk = (e: React.FormEvent) => {
    e.preventDefault();
    const preScore = newImpact * newLikelihood;
    const added: CouncilRTPRisk = {
      refCode: newRefCode.trim() || `NEW-${Date.now().toString(36).slice(-4)}`,
      category: newCategory,
      ismsClause: newIsms,
      ciaAttributes: newCia,
      treatmentDecision: newDecision,
      description: newDesc,
      riskOwner: newOwner,
      impactBefore: newImpact,
      likelihoodBefore: newLikelihood,
      preMitigationScore: preScore,
      mitigation1: newMit1,
      mitigation2: newMit2,
      mitigation3: newMit3,
      postMitigationCurrent: newPostScore,
      postMitigationPrevious: 'NEW',
      historicScores: [{ cycle: 'Apr-17', score: newPostScore }],
      natureOfChange: 'Newly identified risk added to Council Treatment Register.',
      isTop10: newPostScore === 'High',
    };

    setRisks([added, ...risks]);
    setShowAddModal(false);
    // Reset form
    setNewRefCode('');
    setNewDesc('');
    setNewMit1('');
    setNewMit2('');
    setNewMit3('');
  };

  const renderBadge = (score: 'High' | 'Medium' | 'Low' | 'NEW') => {
    switch (score) {
      case 'High':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-950 border border-rose-600 text-rose-300">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-950 border border-amber-600 text-amber-300">
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-950 border border-emerald-600 text-emerald-300">
            Low
          </span>
        );
      case 'NEW':
        return (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-sky-950 border border-sky-600 text-sky-300">
            NEW
          </span>
        );
      default:
        return <span className="text-xs text-[#888888]">-</span>;
    }
  };

  return (
    <div className="space-y-6 font-mono text-white animate-fadeIn">
      {/* 1. DOCUMENT CONTROL & HEADER COVER (From AUD 25/17 Page 1) */}
      <div className="border-2 border-[#f5ff00]/60 bg-[#121212] p-6 space-y-6 shadow-xl print:border-black print:bg-white print:text-black">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262626] pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 bg-black border border-[#444444] text-[#f5ff00] text-[10px] font-bold tracking-widest uppercase">
                {header.documentRef}
              </span>
              <span className="px-2 py-0.5 bg-black border border-[#333333] text-[#aaaaaa] text-[10px] font-bold tracking-wider uppercase">
                {header.versionTag}
              </span>
              <span className="px-2 py-0.5 bg-emerald-950/70 border border-emerald-500 text-emerald-300 text-[10px] font-bold uppercase">
                Classification: {header.classification}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-syne font-bold uppercase tracking-tight text-white flex items-center gap-2.5">
              <Shield className="w-6 h-6 text-[#f5ff00]" />
              Risk Register & Risk Treatment Plan
            </h1>
            <p className="text-xs text-[#999999] font-sans">
              {header.executiveTitle} • {header.reportTarget} • {header.periodLabel}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap print:hidden">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 bg-[#f5ff00] text-black font-bold uppercase text-xs hover:bg-yellow-300 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Risk Item</span>
            </button>

            <button
              onClick={onExportPdf || (() => window.print())}
              className="px-3.5 py-2 bg-[#0c1a24] border border-[#38bdf8]/60 hover:border-[#38bdf8] text-[#38bdf8] font-bold uppercase text-xs transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_10px_rgba(56,189,248,0.2)]"
              title="Export standalone board-ready Risk Treatment Plan PDF summary mirroring Council AUD 25/17 structure"
            >
              <FileText className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Export Standalone PDF Summary</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-[#222222] border border-[#333333] hover:border-white text-[#aaaaaa] hover:text-white font-bold uppercase text-xs transition flex items-center gap-1.5 cursor-pointer"
              title="Direct print current view"
            >
              <Printer className="w-3.5 h-3.5 text-[#f5ff00]" />
              <span>Direct Print</span>
            </button>
          </div>
        </div>

        {/* Quick Executive Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 border border-[#262626] bg-black">
            <div className="text-[10px] uppercase text-[#888888]">Total Registered Risks</div>
            <div className="text-xl font-bold text-white mt-0.5">{risks.length}</div>
            <div className="text-[10px] text-[#666666]">Across {categories.length} Categories</div>
          </div>
          <div className="p-3 border border-[#262626] bg-black">
            <div className="text-[10px] uppercase text-rose-400">High Residual Risks</div>
            <div className="text-xl font-bold text-rose-400 mt-0.5">
              {risks.filter((r) => r.postMitigationCurrent === 'High').length}
            </div>
            <div className="text-[10px] text-[#666666]">Requires Urgent Council Action</div>
          </div>
          <div className="p-3 border border-[#262626] bg-black">
            <div className="text-[10px] uppercase text-amber-400">Medium Residual Risks</div>
            <div className="text-xl font-bold text-amber-400 mt-0.5">
              {risks.filter((r) => r.postMitigationCurrent === 'Medium').length}
            </div>
            <div className="text-[10px] text-[#666666]">Active Monitoring & Controls</div>
          </div>
          <div className="p-3 border border-[#262626] bg-black">
            <div className="text-[10px] uppercase text-emerald-400">Low / Controlled Risks</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {risks.filter((r) => r.postMitigationCurrent === 'Low').length}
            </div>
            <div className="text-[10px] text-[#666666]">Tolerated within Appetite</div>
          </div>
        </div>
      </div>

      {/* 2. SUB-SECTION NAVIGATION TABS (Matching Document Control Table of Contents) */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#262626] pb-2 text-xs print:hidden">
        <button
          onClick={() => setActiveTab('top10')}
          className={`px-3.5 py-2 font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'top10'
              ? 'bg-[#f5ff00] text-black shadow-[0_0_10px_rgba(245,255,0,0.3)]'
              : 'bg-black border border-[#333333] text-[#aaaaaa] hover:text-white'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Top 10 Risks (High & Med)</span>
        </button>

        <button
          onClick={() => setActiveTab('register')}
          className={`px-3.5 py-2 font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'register'
              ? 'bg-[#38bdf8] text-black shadow-[0_0_10px_rgba(56,189,248,0.3)]'
              : 'bg-black border border-[#333333] text-[#aaaaaa] hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Full Risk Treatment Register ({risks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('changes')}
          className={`px-3.5 py-2 font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'changes'
              ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
              : 'bg-black border border-[#333333] text-[#aaaaaa] hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Changes Since Last Published ({changedRisks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={`px-3.5 py-2 font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'matrix'
              ? 'bg-amber-400 text-black font-bold'
              : 'bg-black border border-[#333333] text-[#aaaaaa] hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>App ii: 5×5 Risk Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('objectives')}
          className={`px-3.5 py-2 font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'objectives'
              ? 'bg-emerald-400 text-black font-bold'
              : 'bg-black border border-[#333333] text-[#aaaaaa] hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>App iii: Strategic Objectives & Appetite</span>
        </button>

        <button
          onClick={() => setActiveTab('assurance')}
          className={`px-3.5 py-2 font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'assurance'
              ? 'bg-rose-400 text-black font-bold'
              : 'bg-black border border-[#333333] text-[#aaaaaa] hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>App iv: Assurance Mapping</span>
        </button>

        <button
          onClick={() => setActiveTab('glossary')}
          className={`px-3.5 py-2 font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            activeTab === 'glossary'
              ? 'bg-sky-400 text-black font-bold'
              : 'bg-black border border-[#333333] text-[#aaaaaa] hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>App i: Glossary & ISO Clauses</span>
        </button>
      </div>

      {/* 3. TAB VIEW CONTENT */}

      {/* TAB 1: TOP 10 RISKS (Page 3 of Document) */}
      {activeTab === 'top10' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="border border-[#262626] bg-[#141414] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#f5ff00] tracking-widest block">
                AUD 25/17 • EXECUTIVE REPORT TO COUNCIL
              </span>
              <h3 className="text-sm font-bold uppercase text-white">
                "Top 10" Risks (High & Medium After Mitigation) with Historic Trend Scorecard
              </h3>
            </div>
            <span className="text-[11px] text-[#888888]">
              Ordered by CURRENT RISK SCORE, then PRE-MITIGATION SCORE
            </span>
          </div>

          <div className="border border-[#262626] bg-[#111111] overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1150px]">
              <thead className="bg-[#181818] text-[#aaaaaa] border-b border-[#262626] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-16 text-center">Ref #</th>
                  <th className="p-3 w-56">Description & Pre-Mit Score</th>
                  <th className="p-3 w-40">Risk Owner</th>
                  <th className="p-3 w-52">Mitigation I</th>
                  <th className="p-3 w-52">Mitigation II</th>
                  <th className="p-3 w-48">Mitigation III</th>
                  <th className="p-3 w-28 text-center bg-[#1a1a00] text-[#f5ff00]">Current Score</th>
                  <th className="p-3 w-44 text-center">Historic Risk Scores</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {top10Risks.map((r, idx) => (
                  <tr key={r.refCode} className="hover:bg-[#181818] transition">
                    <td className="p-3 text-center font-mono font-bold text-[#38bdf8]">
                      {r.refCode}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-white">{r.description}</div>
                      <div className="text-[10px] text-[#888888] flex items-center gap-1.5 mt-0.5">
                        <span className="text-rose-400 font-semibold">Pre-Mit: {r.preMitigationScore}</span>
                        <span>•</span>
                        <span>{r.category}</span>
                        {r.ismsClause && (
                          <>
                            <span>•</span>
                            <span className="text-[#38bdf8]">{r.ismsClause}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-[#cccccc]">{r.riskOwner}</td>
                    <td className="p-3 text-[11px] text-[#aaaaaa] leading-relaxed">{r.mitigation1}</td>
                    <td className="p-3 text-[11px] text-[#aaaaaa] leading-relaxed">{r.mitigation2 || '-'}</td>
                    <td className="p-3 text-[11px] text-[#aaaaaa] leading-relaxed">{r.mitigation3 || '-'}</td>
                    <td className="p-3 text-center bg-[#151500] font-bold">
                      {renderBadge(r.postMitigationCurrent)}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap text-[9px] font-mono">
                        {r.historicScores && r.historicScores.length > 0 ? (
                          r.historicScores.slice(0, 4).map((h, hIdx) => (
                            <span
                              key={hIdx}
                              className={`px-1.5 py-0.2 border text-[9px] ${
                                h.score === 'High'
                                  ? 'bg-rose-950/60 border-rose-700 text-rose-300'
                                  : h.score === 'Medium'
                                  ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                                  : 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                              }`}
                              title={`${h.cycle}: ${h.score}`}
                            >
                              {h.cycle}: {h.score[0]}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#666666]">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FULL RISK REGISTER & TREATMENT PLAN (Pages 5-23 of Document) */}
      {activeTab === 'register' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Controls & Filters Bar */}
          <div className="border border-[#262626] bg-[#141414] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
                <input
                  type="text"
                  placeholder="Search Ref, Owner, Threat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-black border border-[#333333] text-xs font-mono text-white focus:border-[#38bdf8] outline-none w-56"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-black border border-[#333333] text-xs font-mono text-white focus:border-[#38bdf8] outline-none"
              >
                <option value="ALL">All Categories ({risks.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({risks.filter((r) => r.category === cat).length})
                  </option>
                ))}
              </select>

              <select
                value={selectedDecision}
                onChange={(e) => setSelectedDecision(e.target.value)}
                className="px-3 py-1.5 bg-black border border-[#333333] text-xs font-mono text-white focus:border-[#38bdf8] outline-none"
              >
                <option value="ALL">All Decisions (TRT, TOL, TSF, TMT)</option>
                <option value="TRT">TRT (Treat)</option>
                <option value="TRT>TOL">TRT &gt; TOL (Treat then Tolerate)</option>
                <option value="TOL">TOL (Tolerate)</option>
                <option value="TSF">TSF (Transfer)</option>
                <option value="TMT">TMT (Terminate)</option>
              </select>
            </div>

            <div className="text-xs text-[#888888]">
              Displaying <strong className="text-white">{filteredRegister.length}</strong> of {risks.length} recorded risks
            </div>
          </div>

          {/* Full Council Register Table */}
          <div className="border border-[#262626] bg-[#111111] overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1350px]">
              <thead className="bg-[#181818] text-[#aaaaaa] border-b border-[#262626] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-2.5 w-16 text-center">Ref #</th>
                  <th className="p-2.5 w-28">Category</th>
                  <th className="p-2.5 w-28">ISMS / ISO</th>
                  <th className="p-2.5 w-20 text-center">C/I/A</th>
                  <th className="p-2.5 w-24 text-center">Decision</th>
                  <th className="p-2.5 w-64">Description</th>
                  <th className="p-2.5 w-40">Risk Owner</th>
                  <th className="p-2.5 w-20 text-center">Impact (1-5)</th>
                  <th className="p-2.5 w-20 text-center">Likelihood (1-5)</th>
                  <th className="p-2.5 w-24 text-center">Pre-Mit Score</th>
                  <th className="p-2.5 w-56">Mitigation I</th>
                  <th className="p-2.5 w-52">Mitigation II</th>
                  <th className="p-2.5 w-48">Mitigation III</th>
                  <th className="p-2.5 w-24 text-center bg-[#181808] text-[#f5ff00]">Current</th>
                  <th className="p-2.5 w-24 text-center">Previous</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {filteredRegister.map((r) => (
                  <tr key={r.refCode} className="hover:bg-[#161616] transition">
                    <td className="p-2.5 text-center font-bold text-[#38bdf8]">{r.refCode}</td>
                    <td className="p-2.5 font-semibold text-[#cccccc]">{r.category}</td>
                    <td className="p-2.5 text-[11px] text-[#999999]">{r.ismsClause || '-'}</td>
                    <td className="p-2.5 text-center font-mono text-[10px] text-amber-300">
                      {r.ciaAttributes || '-'}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="px-1.5 py-0.5 bg-black border border-[#333333] text-[10px] text-purple-300 font-bold">
                        {r.treatmentDecision || 'TRT'}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <div className="font-semibold text-white">{r.description}</div>
                      {r.natureOfChange && (
                        <div className="text-[10px] text-amber-400 mt-0.5 bg-amber-950/40 px-1 border border-amber-800">
                          {r.natureOfChange}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 text-[#aaaaaa]">{r.riskOwner}</td>
                    <td className="p-2.5 text-center font-bold text-white">{r.impactBefore}</td>
                    <td className="p-2.5 text-center font-bold text-white">{r.likelihoodBefore}</td>
                    <td className="p-2.5 text-center font-bold text-rose-400">
                      {r.preMitigationScore}
                    </td>
                    <td className="p-2.5 text-[11px] text-[#aaaaaa] leading-relaxed">{r.mitigation1}</td>
                    <td className="p-2.5 text-[11px] text-[#aaaaaa] leading-relaxed">{r.mitigation2 || '-'}</td>
                    <td className="p-2.5 text-[11px] text-[#aaaaaa] leading-relaxed">{r.mitigation3 || '-'}</td>
                    <td className="p-2.5 text-center bg-[#151500] font-bold">
                      {renderBadge(r.postMitigationCurrent)}
                    </td>
                    <td className="p-2.5 text-center">
                      {renderBadge(r.postMitigationPrevious)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CHANGES SINCE LAST PUBLISHED (Page 4 of Document) */}
      {activeTab === 'changes' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="border border-[#262626] bg-[#141414] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-widest block">
                AUD 25/17 • Page 4 Audit Review
              </span>
              <h3 className="text-sm font-bold uppercase text-white">
                Changes Since Previous Iteration of the Risk Register & Treatment Plan
              </h3>
            </div>
            <span className="text-[11px] text-[#888888]">
              Updated bi-annually by Director of Operations & Executive Committee
            </span>
          </div>

          <div className="p-4 border border-[#333333] bg-[#0d0d0d] text-xs text-[#aaaaaa] leading-relaxed space-y-2">
            <p>
              <strong className="text-white">Overview of Risk Management & Treatment Process:</strong> Throughout the year, existing risks are continually monitored and assessed by Risk Owners against Likelihood, Impact, effectiveness of mitigations, and levels of residual risk.
            </p>
            <p>
              Small changes to risk or mitigation detail are flagged with red text, and more significant changes by persistent yellow highlight. Every six months these updates are formally recorded in the council register.
            </p>
          </div>

          <div className="border border-[#262626] bg-[#111111] overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead className="bg-[#181818] text-[#aaaaaa] border-b border-[#262626] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-36">Category</th>
                  <th className="p-3 w-24 text-center">Ref #</th>
                  <th className="p-3 w-72">Description</th>
                  <th className="p-3 w-64">Nature of Change in this Version</th>
                  <th className="p-3 w-28 text-center">Current Score</th>
                  <th className="p-3 w-28 text-center">Previous Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {changedRisks.map((r) => (
                  <tr key={r.refCode} className="hover:bg-[#181818] transition">
                    <td className="p-3 font-semibold text-white">{r.category}</td>
                    <td className="p-3 text-center font-mono font-bold text-[#38bdf8]">{r.refCode}</td>
                    <td className="p-3 text-white">{r.description}</td>
                    <td className="p-3 text-[#f5ff00] bg-[#181800]/50 font-medium">
                      {r.natureOfChange || 'Post-mitigation residual score shifted in latest cycle review.'}
                    </td>
                    <td className="p-3 text-center">{renderBadge(r.postMitigationCurrent)}</td>
                    <td className="p-3 text-center">{renderBadge(r.postMitigationPrevious)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: APPENDIX II - 5×5 RISK MATRIX & DEFINITIONS (Pages 25-26 of Document) */}
      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="border border-[#262626] bg-[#141414] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-widest block">
                APPENDIX II • AUD 25/17
              </span>
              <h3 className="text-sm font-bold uppercase text-white">
                HCPC 5×5 Risk Matrix & Multi-Dimensional Severity Criteria
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-rose-950 border border-rose-600 text-rose-300 text-[10px] font-bold">
                &gt;11 High (Urgent Action)
              </span>
              <span className="px-2 py-0.5 bg-amber-950 border border-amber-600 text-amber-300 text-[10px] font-bold">
                6-10 Medium (Some Action)
              </span>
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-600 text-emerald-300 text-[10px] font-bold">
                &lt;5 Low (Monitoring)
              </span>
            </div>
          </div>

          {/* 5x5 Visual Score Matrix */}
          <div className="border border-[#262626] bg-[#111111] p-5 space-y-3">
            <span className="text-xs uppercase font-bold tracking-wider text-[#aaaaaa] block">
              Likelihood × Impact Calculation Grid (1 - 25 Scale)
            </span>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="text-[#888888] font-bold border-b border-[#333333]">
                    <th className="p-2 text-left">Impact \ Likelihood</th>
                    <th className="p-2">Negligible (1)</th>
                    <th className="p-2">Rare (2)</th>
                    <th className="p-2">Unlikely (3)</th>
                    <th className="p-2">Possible (4)</th>
                    <th className="p-2">Probable (5)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222222]">
                  <tr>
                    <td className="p-2 text-left font-bold text-white">Catastrophic (5)</td>
                    <td className="p-2 bg-amber-950/70 text-amber-300 font-bold border border-[#222]">5</td>
                    <td className="p-2 bg-amber-950/70 text-amber-300 font-bold border border-[#222]">10</td>
                    <td className="p-2 bg-rose-950/80 text-rose-300 font-bold border border-[#222]">15</td>
                    <td className="p-2 bg-rose-950/90 text-rose-200 font-bold border border-[#222]">20</td>
                    <td className="p-2 bg-rose-900 text-white font-extrabold border border-rose-500">25</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-left font-bold text-white">Significant (4)</td>
                    <td className="p-2 bg-emerald-950/70 text-emerald-300 font-bold border border-[#222]">4</td>
                    <td className="p-2 bg-amber-950/70 text-amber-300 font-bold border border-[#222]">8</td>
                    <td className="p-2 bg-rose-950/80 text-rose-300 font-bold border border-[#222]">12</td>
                    <td className="p-2 bg-rose-950/90 text-rose-200 font-bold border border-[#222]">16</td>
                    <td className="p-2 bg-rose-950/90 text-rose-200 font-bold border border-[#222]">20</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-left font-bold text-white">Moderate (3)</td>
                    <td className="p-2 bg-emerald-950/70 text-emerald-300 font-bold border border-[#222]">3</td>
                    <td className="p-2 bg-amber-950/70 text-amber-300 font-bold border border-[#222]">6</td>
                    <td className="p-2 bg-amber-950/70 text-amber-300 font-bold border border-[#222]">9</td>
                    <td className="p-2 bg-rose-950/80 text-rose-300 font-bold border border-[#222]">12</td>
                    <td className="p-2 bg-rose-950/80 text-rose-300 font-bold border border-[#222]">15</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-left font-bold text-white">Minor (2)</td>
                    <td className="p-2 bg-emerald-950/70 text-emerald-300 font-bold border border-[#222]">2</td>
                    <td className="p-2 bg-emerald-950/70 text-emerald-300 font-bold border border-[#222]">4</td>
                    <td className="p-2 bg-amber-950/70 text-amber-300 font-bold border border-[#222]">6</td>
                    <td className="p-2 bg-amber-950/70 text-amber-300 font-bold border border-[#222]">8</td>
                    <td className="p-2 bg-amber-950/70 text-amber-300 font-bold border border-[#222]">10</td>
                  </tr>
                  <tr>
                    <td className="p-2 text-left font-bold text-white">Insignificant (1)</td>
                    <td className="p-2 bg-emerald-950/70 text-emerald-300 font-bold border border-[#222]">1</td>
                    <td className="p-2 bg-emerald-950/70 text-emerald-300 font-bold border border-[#222]">2</td>
                    <td className="p-2 bg-emerald-950/70 text-emerald-300 font-bold border border-[#222]">3</td>
                    <td className="p-2 bg-emerald-950/70 text-emerald-300 font-bold border border-[#222]">4</td>
                    <td className="p-2 bg-amber-950/70 text-amber-300 font-bold border border-[#222]">5</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Impact Criteria Definition Table (Stream 25/26) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="border border-[#262626] bg-[#121212] p-4 space-y-2">
              <h4 className="font-bold text-[#38bdf8] uppercase">Public Protection Impact</h4>
              <ul className="space-y-1.5 text-[11px] text-[#aaaaaa]">
                <li><strong className="text-white">5 - Catastrophic:</strong> Systematic failure exposes public to serious harm where mitigation expected.</li>
                <li><strong className="text-white">4 - Significant:</strong> Systematic failure exposes &gt;10 people to harm.</li>
                <li><strong className="text-white">3 - Moderate:</strong> Systemic failure exposes &gt;2 people to harm.</li>
                <li><strong className="text-white">2 - Minor:</strong> Failure results in inadequate protection for individuals/communities.</li>
                <li><strong className="text-white">1 - Insignificant:</strong> Fails to address isolated operational requirement.</li>
              </ul>
            </div>

            <div className="border border-[#262626] bg-[#121212] p-4 space-y-2">
              <h4 className="font-bold text-[#f5ff00] uppercase">Financial Impact</h4>
              <ul className="space-y-1.5 text-[11px] text-[#aaaaaa]">
                <li><strong className="text-white">5 - Catastrophic:</strong> Unfunded pressures &gt; £1,000,000.</li>
                <li><strong className="text-white">4 - Significant:</strong> Unfunded pressures £250,000 - £1,000,000.</li>
                <li><strong className="text-white">3 - Moderate:</strong> Unfunded pressures £50,000 - £250,000.</li>
                <li><strong className="text-white">2 - Minor:</strong> Unfunded pressures £20,000 - £50,000.</li>
                <li><strong className="text-white">1 - Insignificant:</strong> Unfunded pressures &gt; £10,000.</li>
              </ul>
            </div>

            <div className="border border-[#262626] bg-[#121212] p-4 space-y-2">
              <h4 className="font-bold text-purple-400 uppercase">Reputation Impact</h4>
              <ul className="space-y-1.5 text-[11px] text-[#aaaaaa]">
                <li><strong className="text-white">5 - Catastrophic:</strong> Maladministration that destroys public trust or key relationship.</li>
                <li><strong className="text-white">4 - Significant:</strong> Undermines trust/relationship for sustained period or critical moment.</li>
                <li><strong className="text-white">3 - Moderate:</strong> Undermines trust for short period (e.g. Policy U-turn).</li>
                <li><strong className="text-white">2 - Minor:</strong> Event that leads to widespread public criticism.</li>
                <li><strong className="text-white">1 - Insignificant:</strong> Leads to criticism by external stakeholders as anticipated.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: APPENDIX III - STRATEGIC OBJECTIVES & RISK APPETITE (Page 27) */}
      {activeTab === 'objectives' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="border border-[#262626] bg-[#141414] p-4">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest block">
              APPENDIX III • AUD 25/17
            </span>
            <h3 className="text-sm font-bold uppercase text-white">
              Strategic Objectives & Organizational Risk Appetite
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="border border-[#262626] bg-[#121212] p-5 space-y-3">
              <h4 className="font-bold text-[#f5ff00] uppercase text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Strategic Objectives 2016 - 2020
              </h4>
              <div className="space-y-2 text-[11px] text-[#cccccc]">
                <div className="p-2 border border-[#222] bg-black">
                  <span className="font-bold text-[#38bdf8]">SO1.GG Objective 1: Good Governance</span>
                  <p className="text-[#888888] mt-0.5">To maintain, review and develop good corporate governance. Specific risks: 4.1 to 4.17 inclusive.</p>
                </div>
                <div className="p-2 border border-[#222] bg-black">
                  <span className="font-bold text-[#38bdf8]">SO2.EBP Objective 2: Efficient Business Processes</span>
                  <p className="text-[#888888] mt-0.5">To maintain, review and develop efficient business processes throughout the organisation. Specific risks: 1.1, 1.2, 2.3, 4.1, 9.2.</p>
                </div>
                <div className="p-2 border border-[#222] bg-black">
                  <span className="font-bold text-[#38bdf8]">SO3.Com Objective 3: Communication</span>
                  <p className="text-[#888888] mt-0.5">To increase understanding and awareness of regulation amongst all stakeholders. Specific risks: 3.1 to 3.5.</p>
                </div>
                <div className="p-2 border border-[#222] bg-black">
                  <span className="font-bold text-[#38bdf8]">SO4.Evid Objective 4: Build the Evidence Base</span>
                  <p className="text-[#888888] mt-0.5">To ensure that the organisation’s work is evidence based. Specific risks: 14.2.</p>
                </div>
                <div className="p-2 border border-[#222] bg-black">
                  <span className="font-bold text-[#38bdf8]">SO5.IPA Objective 5: Influence Policy Agenda</span>
                  <p className="text-[#888888] mt-0.5">To be proactive in influencing the wider regulatory policy agenda. Specific risks: 1.2, 1.5.</p>
                </div>
                <div className="p-2 border border-[#222] bg-black">
                  <span className="font-bold text-[#38bdf8]">SO6.HmCty Objective 6: Four Country Engagement</span>
                  <p className="text-[#888888] mt-0.5">To ensure approach accounts for differences between the four home countries. Specific risks: 3.1, 3.2, 3.4.</p>
                </div>
              </div>
            </div>

            <div className="border border-[#262626] bg-[#121212] p-5 space-y-4">
              <h4 className="font-bold text-emerald-400 uppercase text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Council Risk Appetite Statement
              </h4>
              <div className="p-4 border border-emerald-900/60 bg-emerald-950/20 text-xs text-emerald-200 leading-relaxed space-y-3">
                <p className="font-semibold text-white">
                  The Council has an <em>averse appetite</em> to risk in that we:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-[#cccccc]">
                  <li><strong className="text-white">Identify all relevant risks</strong> across strategic, operational, technological, and fiduciary spheres.</li>
                  <li><strong className="text-white">Mitigate those risks to an appropriate level</strong> utilizing layered operational and detective controls.</li>
                  <li><strong className="text-white">Invest mitigation resources in proportion</strong> to the level of risk and systemic criticality.</li>
                </ol>
                <p className="text-[11px] text-[#888888] pt-2 border-t border-[#333333]">
                  Treatment decisions prioritize preventative automation, dual-signoff governance, and documented compliance with ISO 27001 / ISO 9001 standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: APPENDIX IV - ASSURANCE MAPPING (Page 28 of Document) */}
      {activeTab === 'assurance' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="border border-[#262626] bg-[#141414] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-widest block">
                APPENDIX IV • AUD 25/17
              </span>
              <h3 className="text-sm font-bold uppercase text-white">
                Three Lines of Defense Risk Assurance Mapping
              </h3>
            </div>
            <span className="text-[11px] text-[#888888]">
              Increasing Assurance: Area C → Area B → Area A
            </span>
          </div>

          <div className="border border-[#262626] bg-[#111111] overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead className="bg-[#181818] text-[#aaaaaa] border-b border-[#262626] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3 w-48">Key Business Risk Area</th>
                  <th className="p-3 w-64 bg-black/40 text-blue-300 border-l border-[#262626]">
                    AREA C: Management Control & Reporting
                  </th>
                  <th className="p-3 w-64 bg-black/40 text-amber-300 border-l border-[#262626]">
                    AREA B: Functional Oversight / Governance
                  </th>
                  <th className="p-3 w-80 bg-black/40 text-emerald-300 border-l border-[#262626]">
                    AREA A: Independent Review / Regulatory Oversight
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {assuranceMappingMatrix.map((m, idx) => (
                  <tr key={idx} className="hover:bg-[#181818] transition">
                    <td className="p-3 font-bold text-white">{m.area}</td>
                    <td className="p-3 border-l border-[#222] text-[11px] text-[#cccccc]">
                      <ul className="list-disc list-inside space-y-0.5">
                        {m.areaC.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-3 border-l border-[#222] text-[11px] text-[#cccccc]">
                      <ul className="list-disc list-inside space-y-0.5">
                        {m.areaB.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </td>
                    <td className="p-3 border-l border-[#222] text-[11px] text-[#cccccc]">
                      <ul className="list-disc list-inside space-y-0.5">
                        {m.areaA.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: APPENDIX I - GLOSSARY & ISO CLAUSES (Page 24 of Document) */}
      {activeTab === 'glossary' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="border border-[#262626] bg-[#141414] p-4">
            <span className="text-[10px] uppercase font-bold text-sky-400 tracking-widest block">
              APPENDIX I • AUD 25/17
            </span>
            <h3 className="text-sm font-bold uppercase text-white">
              Glossary, Abbreviations & ISO 27001 / ISMS Control Mapping
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="border border-[#262626] bg-[#121212] p-4 space-y-3">
              <h4 className="font-bold text-[#38bdf8] uppercase text-xs flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Glossary & Treatment Terms
              </h4>
              <div className="divide-y divide-[#222222] max-h-[480px] overflow-y-auto pr-1">
                {glossaryTerms.map((g, idx) => (
                  <div key={idx} className="py-2 space-y-0.5">
                    <span className="font-bold text-[#f5ff00]">{g.term}</span>
                    <p className="text-[11px] text-[#aaaaaa] leading-relaxed">{g.meaning}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-[#262626] bg-[#121212] p-4 space-y-3">
              <h4 className="font-bold text-purple-400 uppercase text-xs flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                ISO 27001:2013 ISMS Statement of Applicability Clauses
              </h4>
              <div className="divide-y divide-[#222222] max-h-[480px] overflow-y-auto pr-1">
                {ismsClausesList.map((c, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between gap-2">
                    <span className="font-bold text-white">{c.clause}</span>
                    <span className="text-[11px] text-[#888888]">{c.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. DOSSIER FOOTER ATTRIBUTION */}
      <div id="council-rtp-footer" className="pt-4 border-t border-[#262626] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#777777] font-mono print:border-black print:text-black">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-[#f5ff00] font-bold print:text-black">{header.documentRef}</span>
          <span>//</span>
          <span>{header.versionTag}</span>
          <span>//</span>
          <span className="text-emerald-400 print:text-black">Classification: {header.classification}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#888888] print:text-black">Developed by</span>
          <a
            id="council-rtp-technoscope-link"
            href="https://www.technoscope.co.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f5ff00] hover:underline font-bold print:text-black"
            title="Technoscope Official Website - www.technoscope.co.in"
          >
            www.technoscope.co.in
          </a>
          <span className="text-[#444444] print:text-black">//</span>
          <span className="text-[#dddddd] font-semibold print:text-black">Proprietary Copyright</span>
        </div>
      </div>

      {/* 4. MODAL: ADD CUSTOM RISK ITEM TO COUNCIL REGISTER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto font-mono text-white animate-fadeIn">
          <div className="border border-[#f5ff00] bg-[#141414] w-full max-w-2xl p-6 space-y-5 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#f5ff00]" />
                <h3 className="text-base font-syne font-bold uppercase text-white">
                  Add Risk to Council Risk Treatment Register
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#888888] hover:text-white text-xs cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleAddRisk} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] mb-1">Ref Code (e.g. 5.7 or 17.11):</label>
                  <input
                    type="text"
                    value={newRefCode}
                    onChange={(e) => setNewRefCode(e.target.value)}
                    required
                    placeholder="e.g. 5.7"
                    className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#888888] mb-1">Functional Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#888888] mb-1">ISMS / ISO Clause:</label>
                  <input
                    type="text"
                    value={newIsms}
                    onChange={(e) => setNewIsms(e.target.value)}
                    className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#888888] mb-1">C / I / A Attributes:</label>
                  <select
                    value={newCia}
                    onChange={(e) => setNewCia(e.target.value)}
                    className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  >
                    <option value="C/I/A">C / I / A (Full)</option>
                    <option value="x/I/A">x / I / A (Integrity & Avail)</option>
                    <option value="C/x/x">C / x / x (Confidentiality)</option>
                    <option value="C/x/A">C / x / A (Conf & Avail)</option>
                    <option value="C/I/x">C / I / x (Conf & Integ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#888888] mb-1">Treatment Decision:</label>
                  <select
                    value={newDecision}
                    onChange={(e) => setNewDecision(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  >
                    <option value="TRT>TOL">TRT &gt; TOL (Treat then Tolerate)</option>
                    <option value="TRT">TRT (Treat)</option>
                    <option value="TOL">TOL (Tolerate)</option>
                    <option value="TSF">TSF (Transfer)</option>
                    <option value="TMT">TMT (Terminate)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#888888] mb-1">Risk Description / Event:</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                  placeholder="Describe the risk scenario, threat actor, or operational vulnerability..."
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#888888] mb-1">Risk Owner:</label>
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#888888] mb-1">Impact Before (1-5):</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newImpact}
                    onChange={(e) => setNewImpact(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#888888] mb-1">Likelihood Before (1-5):</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={newLikelihood}
                    onChange={(e) => setNewLikelihood(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#262626]">
                <label className="block text-[#f5ff00] font-bold">Planned Mitigations:</label>
                <div>
                  <span className="text-[10px] text-[#888888] block mb-1">Mitigation I (Primary Safeguard):</span>
                  <input
                    type="text"
                    value={newMit1}
                    onChange={(e) => setNewMit1(e.target.value)}
                    required
                    placeholder="Primary operational or technical safeguard"
                    className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#888888] block mb-1">Mitigation II (Secondary Safeguard):</span>
                  <input
                    type="text"
                    value={newMit2}
                    onChange={(e) => setNewMit2(e.target.value)}
                    placeholder="Secondary monitoring or procedure check"
                    className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-[#888888] block mb-1">Mitigation III (Tertiary / SLA / Insurance):</span>
                  <input
                    type="text"
                    value={newMit3}
                    onChange={(e) => setNewMit3(e.target.value)}
                    placeholder="Contingency, SLA, or insurance backing"
                    className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#888888] mb-1">Post-Mitigation Residual Score:</label>
                <select
                  value={newPostScore}
                  onChange={(e) => setNewPostScore(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                >
                  <option value="Low">Low (&lt;5 - Ongoing Monitoring)</option>
                  <option value="Medium">Medium (6-10 - Some Action Required)</option>
                  <option value="High">High (&gt;11 - Urgent Action Required)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[#333333] text-[#aaaaaa] hover:text-white text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#f5ff00] text-black font-bold uppercase text-xs hover:bg-yellow-300 transition cursor-pointer"
                >
                  Save to Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
