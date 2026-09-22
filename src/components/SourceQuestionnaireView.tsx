import React, { useState, useMemo } from 'react';
import {
  Search,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Layers,
  ChevronDown,
  ChevronRight,
  FileCheck,
  Building,
  Server,
  Key,
  Users,
  Eye,
  Lock,
  ArrowRight,
  FileSpreadsheet,
  Download,
  Info,
  Sparkles,
} from 'lucide-react';
import { SourceQuestionnaireItem, RCSAPayload, IntegratedRCSAItem } from '../types';
import { CAIQ_SOURCE_QUESTIONNAIRE, CSA_CCM_DOMAINS } from '../data/caiqSourceQuestionnaire';
import { NIST_CONTROLS_CATALOG } from '../data/nistControls';
import { QuestionnaireIngestionModal } from './QuestionnaireIngestionModal';
import * as XLSX from 'xlsx';

interface SourceQuestionnaireViewProps {
  assessment: RCSAPayload;
  onNavigateToControl?: (controlId: string) => void;
}

export const SourceQuestionnaireView: React.FC<SourceQuestionnaireViewProps> = ({
  assessment,
  onNavigateToControl,
}) => {
  const [selectedFramework, setSelectedFramework] = useState<'caiq' | 'nist' | 'all'>('caiq');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOwnership, setSelectedOwnership] = useState<string>('ALL');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>('IAM-13.1');
  const [showLiteOnly, setShowLiteOnly] = useState<boolean>(false);
  const [isIngestionModalOpen, setIsIngestionModalOpen] = useState<boolean>(false);
  const [customIngestedItems, setCustomIngestedItems] = useState<SourceQuestionnaireItem[]>([]);

  const handleImportIngestedItems = (items: IntegratedRCSAItem[]) => {
    const converted: SourceQuestionnaireItem[] = items.map((it) => ({
      questionId: it.id,
      questionText: it.assessment_question,
      controlId: it.id,
      controlTitle: `${it.domain} - ${it.control_type} Control`,
      domainTitle: it.domain,
      domainCode: it.domain.slice(0, 3).toUpperCase(),
      controlSpecification: `Original Ingested Requirement: ${it.original_chunk_text}`,
      caiqLite: true,
      ssrmOwnership: 'Shared (Independent)',
      cspImplementationGuidance: `Implement ${it.control_type.toLowerCase()} safeguards to achieve residual risk level ${it.risk_calculations.residual_risk_level} (Target Score: ${it.risk_calculations.projected_residual_risk_score}).`,
      cscResponsibilitiesGuidance: `Continuous validation of control weight ${it.risk_calculations.control_effectiveness_weight}.`,
      auditingGuidelines: [
        `1. Review control effectiveness evidence matching ${it.control_type} safeguards.`,
        `2. Validate risk mitigation against baseline inherent risk (${it.risk_calculations.inherent_risk_score}) down to residual (${it.risk_calculations.projected_residual_risk_score}).`,
      ],
      standardReferences: it.mapping_tags.map((tag) => ({
        framework: 'Normalized Mapping',
        referenceId: tag,
      })),
      publication: 'Custom Ingested RCSA Protocol',
    }));

    setCustomIngestedItems((prev) => [...converted, ...prev]);
    setSelectedFramework('all');
  };

  // Convert NIST Controls into SourceQuestionnaireItems for unified browsing
  const nistSourceQuestions: SourceQuestionnaireItem[] = useMemo(() => {
    const items: SourceQuestionnaireItem[] = [];
    NIST_CONTROLS_CATALOG.forEach((control) => {
      control.assessmentQuestions.forEach((q, qIdx) => {
        items.push({
          questionId: `${control.controlId}.${qIdx + 1}`,
          questionText: q.text,
          controlId: control.controlId,
          controlTitle: control.title,
          domainTitle: control.familyName,
          domainCode: control.family,
          controlSpecification: control.discussion,
          caiqLite: true,
          ssrmOwnership: q.ssrmOwnership || 'Shared (Independent)',
          cspImplementationGuidance: q.guidance || control.discussion,
          cscResponsibilitiesGuidance: `Implement technical safeguards to satisfy ${control.controlId} in adherence with ${q.publication}.`,
          auditingGuidelines: q.auditingGuidance ? [q.auditingGuidance] : [
            `1. Examine policy and organizational procedures governing ${control.title} (${control.controlId}).`,
            `2. Inspect operating evidence, configuration baselines, and access logs to confirm control operating effectiveness.`
          ],
          standardReferences: [
            { framework: q.publication, referenceId: q.reference },
            ...(q.additionalRef ? [{ framework: 'Cross-Standard Reference', referenceId: q.additionalRef }] : [])
          ],
          publication: q.publication || 'NIST SP 800-53 Rev. 5'
        });
      });
    });
    return items;
  }, []);

  // Combined and filtered questions
  const filteredQuestions = useMemo(() => {
    let list: SourceQuestionnaireItem[] = [];
    if (selectedFramework === 'caiq') {
      list = [...customIngestedItems, ...CAIQ_SOURCE_QUESTIONNAIRE];
    } else if (selectedFramework === 'nist') {
      list = [...customIngestedItems, ...nistSourceQuestions];
    } else {
      list = [...customIngestedItems, ...CAIQ_SOURCE_QUESTIONNAIRE, ...nistSourceQuestions];
    }

    return list.filter((item) => {
      // Domain filter
      if (selectedDomain !== 'ALL') {
        if (selectedFramework === 'caiq' && item.domainCode !== selectedDomain) return false;
        if (selectedFramework === 'nist' && item.domainCode !== selectedDomain) return false;
        if (selectedFramework === 'all' && item.domainCode !== selectedDomain) return false;
      }

      // Ownership filter
      if (selectedOwnership !== 'ALL') {
        if (!item.ssrmOwnership.toLowerCase().includes(selectedOwnership.toLowerCase())) return false;
      }

      // Lite only filter
      if (showLiteOnly && !item.caiqLite) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = item.questionId.toLowerCase().includes(q);
        const matchText = item.questionText.toLowerCase().includes(q);
        const matchControl = item.controlId.toLowerCase().includes(q) || item.controlTitle.toLowerCase().includes(q);
        const matchSpec = item.controlSpecification.toLowerCase().includes(q);
        const matchRef = item.standardReferences?.some(r => r.referenceId.toLowerCase().includes(q) || r.framework.toLowerCase().includes(q));
        if (!matchId && !matchText && !matchControl && !matchSpec && !matchRef) {
          return false;
        }
      }

      return true;
    });
  }, [selectedFramework, selectedDomain, selectedOwnership, showLiteOnly, searchQuery, nistSourceQuestions]);

  const handleExportQuestionsExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = filteredQuestions.map((q) => [
      q.questionId,
      q.questionText,
      q.controlId,
      q.controlTitle,
      q.domainTitle,
      q.ssrmOwnership,
      q.publication,
      q.standardReferences?.map(r => `${r.framework}: ${r.referenceId}`).join(' | ') || '',
      q.controlSpecification,
      q.auditingGuidelines?.join('\n') || '',
      q.cspImplementationGuidance || '',
      q.cscResponsibilitiesGuidance || ''
    ]);

    const headers = [
      'Question ID',
      'Consensus Assessment Question',
      'Control ID',
      'Control Title',
      'Domain',
      'SSRM Ownership',
      'Publication',
      'Authoritative References',
      'Control Specification',
      'Auditing Guidelines',
      'CSP Guidance',
      'CSC Responsibilities'
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Source Questionnaire');
    XLSX.writeFile(wb, `Source_Questionnaire_${selectedFramework.toUpperCase()}_v4.1.xlsx`);
  };

  // Domain count aggregation for sidebar
  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const baseList = selectedFramework === 'caiq' ? CAIQ_SOURCE_QUESTIONNAIRE : selectedFramework === 'nist' ? nistSourceQuestions : [...CAIQ_SOURCE_QUESTIONNAIRE, ...nistSourceQuestions];
    baseList.forEach(item => {
      counts[item.domainCode] = (counts[item.domainCode] || 0) + 1;
    });
    return counts;
  }, [selectedFramework, nistSourceQuestions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-[#262626] bg-[#111111] text-white">
      {/* Left Panel: Search & Domain Filters */}
      <section className="lg:col-span-3 bg-black border-b lg:border-b-0 lg:border-r border-[#262626] p-6 flex flex-col gap-6">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#666666] block mb-2">
            System Search
          </span>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="INPUT_QUERY..."
              className="bg-[#111111] border border-[#333333] focus:border-[#f5ff00] text-white px-3 py-2.5 font-mono text-xs w-full outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-xs text-[#888888] hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#666666] block mb-2">
            Filter: Ownership
          </span>
          <select
            value={selectedOwnership}
            onChange={(e) => setSelectedOwnership(e.target.value)}
            className="bg-[#111111] border border-[#333333] focus:border-[#f5ff00] text-white px-3 py-2 font-mono text-xs w-full outline-none"
          >
            <option value="ALL">ALL (Shared & Owned)</option>
            <option value="Shared">Shared Responsibility</option>
            <option value="CSP-Owned">CSP-Owned (Provider)</option>
            <option value="CSC-Owned">CSC-Owned (Customer)</option>
            <option value="Independent">Independent Implementation</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#666666]">
              Framework Source
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[
              { id: 'caiq', label: 'CCM' },
              { id: 'nist', label: 'NIST' },
              { id: 'all', label: 'ALL' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => {
                  setSelectedFramework(f.id as any);
                  setSelectedDomain('ALL');
                }}
                className={`py-1.5 font-mono text-[10px] uppercase border transition ${
                  selectedFramework === f.id
                    ? 'bg-[#f5ff00] text-black border-[#f5ff00] font-bold'
                    : 'bg-[#181818] text-[#888888] border-[#2a2a2a] hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#666666]">
              System Domains
            </span>
            <span className="font-mono text-[10px] text-[#f5ff00]">
              {filteredQuestions.length} Items
            </span>
          </div>

          <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
            <div
              onClick={() => setSelectedDomain('ALL')}
              className={`font-mono text-xs py-1.5 px-2 border-b border-[#222222] cursor-pointer flex justify-between transition ${
                selectedDomain === 'ALL'
                  ? 'bg-[#1e1e00] text-[#f5ff00] font-bold border-l-2 border-l-[#f5ff00]'
                  : 'text-[#aaaaaa] hover:text-[#f5ff00]'
              }`}
            >
              <span>ALL DATA</span>
              <span>{Object.values(domainCounts).reduce<number>((a, b) => a + (b as number), 0)}</span>
            </div>

            {CSA_CCM_DOMAINS.map((domain) => {
              const count = domainCounts[domain.code] || 0;
              if (count === 0 && selectedFramework === 'caiq') return null;
              return (
                <div
                  key={domain.code}
                  onClick={() => setSelectedDomain(domain.code)}
                  className={`font-mono text-[11px] py-1.5 px-2 border-b border-[#222222] cursor-pointer flex justify-between transition ${
                    selectedDomain === domain.code
                      ? 'bg-[#1e1e00] text-[#f5ff00] font-bold border-l-2 border-l-[#f5ff00]'
                      : 'text-[#888888] hover:text-[#f5ff00]'
                  }`}
                >
                  <span className="truncate pr-2">{domain.code} {domain.title.toUpperCase()}</span>
                  <span>{String(count).padStart(2, '0')}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Right Section: Content Grid with Data Cells */}
      <section className="lg:col-span-9 bg-[#111111] flex flex-col">
        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Hero Banner Data Cell */}
          <div className="col-span-full border-b border-[#262626] bg-gradient-to-b from-[#181818] to-[#111111] p-6 sm:p-8 space-y-4">
            <div className="font-mono text-[#f5ff00] text-xs font-bold tracking-wider">
              [SOURCE_QUESTIONNAIRE]
            </div>
            <h2 className="text-2xl sm:text-3xl font-syne font-bold uppercase tracking-tight text-white">
              Protocol Examination & Framework Catalog
            </h2>
            <p className="text-sm text-[#888888] max-w-3xl leading-relaxed">
              Consensus assessment based on CSA CCM v4.1.0 and NIST SP 800-53 Rev. 5. Unified multi-framework reference engine for technical control validation, SSRM responsibility boundaries, and auditing guidelines.
            </p>

            <div className="flex items-center gap-2 flex-wrap pt-2">
              <button
                onClick={() => {
                  setSelectedFramework('caiq');
                  setSelectedDomain('ALL');
                }}
                className={`font-mono text-xs px-3 py-1.5 uppercase transition ${
                  selectedFramework === 'caiq'
                    ? 'bg-[#f5ff00] text-black font-bold'
                    : 'bg-[#222222] text-white border border-[#333333] hover:border-[#f5ff00]'
                }`}
              >
                CCM CATALOG
              </button>

              <button
                onClick={() => {
                  setSelectedFramework('nist');
                  setSelectedDomain('ALL');
                }}
                className={`font-mono text-xs px-3 py-1.5 uppercase transition ${
                  selectedFramework === 'nist'
                    ? 'bg-[#f5ff00] text-black font-bold'
                    : 'bg-[#222222] text-white border border-[#333333] hover:border-[#f5ff00]'
                }`}
              >
                NIST_800-53
              </button>

              <button
                onClick={() => {
                  setSelectedFramework('all');
                  setSelectedDomain('ALL');
                }}
                className={`font-mono text-xs px-3 py-1.5 uppercase transition ${
                  selectedFramework === 'all'
                    ? 'bg-[#f5ff00] text-black font-bold'
                    : 'bg-[#222222] text-white border border-[#333333] hover:border-[#f5ff00]'
                }`}
              >
                UNIFIED_MAP
              </button>

              <button
                onClick={() => setIsIngestionModalOpen(true)}
                className="bg-[#f5ff00] text-black hover:bg-yellow-300 font-mono text-xs px-3 py-1.5 uppercase font-bold transition flex items-center gap-1.5 ml-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>INGEST_CUSTOM_RCSA</span>
              </button>

              <button
                onClick={handleExportQuestionsExcel}
                className="bg-[#181818] text-[#cccccc] border border-[#333333] hover:border-[#f5ff00] hover:text-white font-mono text-xs px-3 py-1.5 uppercase transition flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>EXPORT_XLSX</span>
              </button>
            </div>
          </div>

          {/* Render Individual Data Cells */}
          {filteredQuestions.map((item) => {
            const isExpanded = expandedQuestionId === item.questionId;
            const isMFAHighlight = item.questionId.includes('IAM-13.1') || item.controlId.includes('IA-2');

            return (
              <div
                key={item.questionId}
                className={`p-6 sm:p-7 border-b md:border-r border-[#262626] flex flex-col justify-between transition min-h-[360px] ${
                  isMFAHighlight ? 'bg-[#151500]' : 'bg-[#141414] hover:bg-[#181818]'
                }`}
              >
                <div className="space-y-3">
                  {/* Cell ID & Badges */}
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-sm font-bold ${isMFAHighlight ? 'text-[#f5ff00]' : 'text-[#f5ff00]'}`}>
                      {item.questionId}
                    </span>
                    <span className="font-mono text-[10px] text-[#666666] uppercase">
                      {item.publication || 'CCM v4.1.0'}
                    </span>
                  </div>

                  {/* Cell Title / Question Text */}
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {item.questionText}
                  </h3>

                  {/* Tag List */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className={`text-[10px] font-mono px-2 py-0.5 border ${
                      isMFAHighlight
                        ? 'text-[#f5ff00] border-[#f5ff00] bg-black'
                        : 'bg-[#222222] text-[#aaaaaa] border-[#333333]'
                    }`}>
                      {item.domainTitle ? item.domainTitle.toUpperCase().replace(/\s+/g, '_') : item.domainCode}
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 bg-[#222222] text-[#888888] border border-[#333333]">
                      SSRM: {item.ssrmOwnership.toUpperCase()}
                    </span>

                    {item.controlId && (
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-[#222222] text-[#f5ff00] border border-[#444400]">
                        REF: {item.controlId}
                      </span>
                    )}
                  </div>

                  {/* Guidance Box 1: Specification */}
                  {item.controlSpecification && (
                    <div className="bg-black border border-[#2a2a2a] p-3 mt-3 space-y-1">
                      <h6 className="text-[#f5ff00] font-mono text-[10px] uppercase font-bold tracking-wider">
                        SPECIFICATION
                      </h6>
                      <p className="text-xs text-[#888888] leading-relaxed line-clamp-3 hover:line-clamp-none transition">
                        {item.controlSpecification}
                      </p>
                    </div>
                  )}

                  {/* Guidance Box 2: Procedures / Auditing Guidance */}
                  {item.auditingGuidelines && item.auditingGuidelines.length > 0 && (
                    <div className="bg-black border border-[#2a2a2a] p-3 mt-2 space-y-1">
                      <h6 className="text-[#f5ff00] font-mono text-[10px] uppercase font-bold tracking-wider">
                        AUDITING PROCEDURES
                      </h6>
                      <p className="text-xs text-[#888888] leading-relaxed line-clamp-2 hover:line-clamp-none transition">
                        {item.auditingGuidelines[0]}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div className="pt-4 border-t border-[#222222] flex items-center justify-between gap-2 mt-4">
                  <div className="text-[10px] font-mono text-[#666666]">
                    DOMAIN: {item.domainCode}
                  </div>

                  {onNavigateToControl && item.controlId && (
                    <button
                      onClick={() => onNavigateToControl(item.controlId)}
                      className="bg-[#222222] text-white hover:bg-[#f5ff00] hover:text-black font-mono text-[10px] uppercase font-bold px-2.5 py-1 transition flex items-center gap-1"
                    >
                      <span>EVALUATE</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="p-12 text-center text-[#888888] font-mono text-xs">
            NO QUESTIONNAIRE ITEMS MATCH CURRENT FILTER CRITERIA
          </div>
        )}
      </section>

      {/* RCSA Ingestion Pipeline Modal */}
      <QuestionnaireIngestionModal
        isOpen={isIngestionModalOpen}
        onClose={() => setIsIngestionModalOpen(false)}
        onImportItems={handleImportIngestedItems}
      />
    </div>
  );
};
