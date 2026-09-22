import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  X,
  Layers,
  ArrowRight,
  Shield,
  Tag,
  Check,
  RefreshCw,
  FileCode,
  ListFilter,
} from 'lucide-react';
import { RCSAIngestionResult, IntegratedRCSAItem } from '../types';
import { processQuestionnaireWithAI } from '../utils/questionnaireIngestionEngine';

interface QuestionnaireIngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportItems?: (items: IntegratedRCSAItem[]) => void;
}

const SAMPLE_QUESTIONNAIRES = {
  vendor_tprm: `THIRD-PARTY RISK MANAGEMENT & SECURITY AUDIT CHECKLIST 2026
CONFIDENTIAL - FOR INTERNAL AUDIT USE ONLY

1. Access Control & IAM: Are all third-party contractor accounts provisioned with mandatory Hardware-backed Multi-Factor Authentication (MFA) and subject to automated 90-day inactivity de-provisioning?
2. Data Governance: Is all customer Personally Identifiable Information (PII) encrypted both at rest using AES-256-GCM and in transit via TLS 1.3 with automated key rotation?
3. Incident Management: Does the organization maintain a 24/7 Computer Security Incident Response Plan (CSIRP) with mandatory regulatory breach notification within 72 hours under GDPR/SEC rules?
4. Disaster Recovery: Are immutable WORM backups stored off-site with quarterly sandbox recovery testing and an RTO under 4 hours?
5. Continuous Monitoring: Is centralized security event logging enabled across all production hosts with SIEM alerting and WORM retention for a minimum of 365 days?
6. Vendor Governance: Are SOC 2 Type II reports and ISO 27001 certifications collected, reviewed, and risk-scored annually for all Tier-1 third-party suppliers?`,

  cloud_iso: `ISO 27001:2022 / NIST SP 800-53 CLOUD AUDIT EXTRACT
===================================================
A.9.2.1 User Registration and Deregistration: Enforce formal user onboarding, role-based RBAC, and immediate account de-activation upon employee termination.
A.10.1.1 Cryptographic Key Management: Generate, store, and manage all master cryptographic encryption keys exclusively inside FIPS 140-3 Level 3 Hardware Security Modules (HSMs).
A.12.4.1 Event Logging: Audit and trace all administrator privilege escalations, failed authentication events, and API key generation in immutable audit repositories.
A.15.1.1 Information Security in Supplier Relationships: Require all external vendors with database access to sign data protection agreements (DPAs) and undergo yearly pen testing.
A.17.1.2 Implementing Information Security Continuity: Maintain multi-region geo-redundant database replication with automated failover and zero data loss SLA.`,
};

export const QuestionnaireIngestionModal: React.FC<QuestionnaireIngestionModalProps> = ({
  isOpen,
  onClose,
  onImportItems,
}) => {
  const [inputText, setInputText] = useState<string>(SAMPLE_QUESTIONNAIRES.vendor_tprm);
  const [inputFormat, setInputFormat] = useState<string>('unstructured');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [ingestionResult, setIngestionResult] = useState<RCSAIngestionResult | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'json'>('preview');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleRunIngestion = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    try {
      const result = await processQuestionnaireWithAI(inputText, inputFormat);
      setIngestionResult(result);
    } catch (err) {
      console.error('Ingestion failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyJson = () => {
    if (!ingestionResult) return;
    navigator.clipboard.writeText(JSON.stringify(ingestionResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJson = () => {
    if (!ingestionResult) return;
    const blob = new Blob([JSON.stringify(ingestionResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rcsa-ingested-questionnaire-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'Critical':
        return 'bg-rose-950/80 text-rose-300 border-rose-600';
      case 'High':
        return 'bg-amber-950/80 text-amber-300 border-amber-600';
      case 'Medium':
        return 'bg-blue-950/80 text-blue-300 border-blue-600';
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111111] border border-[#333333] w-full max-w-6xl max-h-[92vh] flex flex-col font-mono text-white shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-[#262626] bg-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f5ff00]/10 border border-[#f5ff00]/40 text-[#f5ff00]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#f5ff00] bg-black px-1.5 py-0.5 border border-[#333333]">
                  RCSA Ingestion Engine v2.5
                </span>
                <span className="text-[10px] text-[#888888]">
                  Semantic Chunking & 5x5 Algorithmic Risk Mapping
                </span>
              </div>
              <h2 className="text-xl font-syne font-black uppercase text-white mt-0.5">
                Custom Questionnaire Ingestion Pipeline
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#888888] hover:text-white hover:bg-[#222222] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input text & configuration */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#888888] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#f5ff00]" />
                Raw Questionnaire Text / Extract
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setInputText(SAMPLE_QUESTIONNAIRES.vendor_tprm)}
                  className="text-[9px] px-2 py-0.5 bg-black border border-[#333333] hover:border-[#666666] text-[#aaaaaa] hover:text-white transition"
                >
                  Load Sample TPRM
                </button>
                <button
                  type="button"
                  onClick={() => setInputText(SAMPLE_QUESTIONNAIRES.cloud_iso)}
                  className="text-[9px] px-2 py-0.5 bg-black border border-[#333333] hover:border-[#666666] text-[#aaaaaa] hover:text-white transition"
                >
                  Load ISO 27001
                </button>
              </div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste raw questions, CSV rows, DOCX extracts, audit checklist items, or unformatted questionnaire text here..."
              rows={12}
              className="w-full bg-black border border-[#333333] focus:border-[#f5ff00] p-3.5 text-xs font-mono text-white outline-none resize-none leading-relaxed"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#888888] block mb-1">
                  Source Document Format:
                </label>
                <select
                  value={inputFormat}
                  onChange={(e) => setInputFormat(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-black border border-[#333333] text-xs text-white outline-none focus:border-[#f5ff00]"
                >
                  <option value="unstructured">Unstructured Text / DOCX Extract</option>
                  <option value="csv">Delimited CSV / Spreadsheet</option>
                  <option value="numbered_list">Numbered Assessment Checklist</option>
                  <option value="json">Raw JSON Question Array</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleRunIngestion}
                  disabled={isProcessing || !inputText.trim()}
                  className="w-full py-2 bg-[#f5ff00] text-black hover:bg-yellow-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Processing...' : 'Run Ingestion Engine'}</span>
                </button>
              </div>
            </div>

            {/* Ingestion Rules Summary */}
            <div className="p-3 bg-black border border-[#262626] text-[10px] space-y-1.5 text-[#888888]">
              <span className="text-[#f5ff00] font-bold block uppercase tracking-wider">
                Ingestion Engine Mathematical Model:
              </span>
              <div>• <strong>Inherent Risk ($IRS$):</strong> $L \times I$ (1–5 scale, max 25.0)</div>
              <div>• <strong>Control Weight ($CE$):</strong> Preventive (0.65), Detective (0.55), Corrective (0.50), Directive (0.40)</div>
              <div>• <strong>Residual Risk ($RRS$):</strong> $IRS \times (1 - CE)$</div>
              <div>• <strong>Tiers:</strong> Low (1–6), Medium (7–12), High (13–19), Critical (20–25)</div>
            </div>
          </div>

          {/* Right Column: Ingestion Output & Structured Preview */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition ${
                    activeTab === 'preview'
                      ? 'bg-[#f5ff00] text-black border-[#f5ff00]'
                      : 'bg-black text-[#888888] border-[#333333] hover:text-white'
                  }`}
                >
                  Extracted Items ({ingestionResult?.integrated_rcsa_items.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition ${
                    activeTab === 'json'
                      ? 'bg-[#f5ff00] text-black border-[#f5ff00]'
                      : 'bg-black text-[#888888] border-[#333333] hover:text-white'
                  }`}
                >
                  Strict JSON Schema
                </button>
              </div>

              {ingestionResult && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJson}
                    className="px-2.5 py-1.5 bg-[#1a1a1a] hover:bg-[#262626] border border-[#333333] text-[10px] font-bold text-white flex items-center gap-1.5 transition"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-[#f5ff00]" />}
                    <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="p-1.5 bg-[#1a1a1a] hover:bg-[#262626] border border-[#333333] text-[#888888] hover:text-white transition"
                    title="Download JSON Payload"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Results Viewer */}
            <div className="flex-1 min-h-[360px] max-h-[500px] overflow-y-auto">
              {!ingestionResult ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center border border-[#262626] bg-black text-[#666666] space-y-3">
                  <Layers className="w-10 h-10 text-[#444444]" />
                  <p className="text-xs">
                    Click <strong>"Run Ingestion Engine"</strong> to parse, normalize, and score your custom questions.
                  </p>
                </div>
              ) : activeTab === 'json' ? (
                <div className="p-4 bg-black border border-[#262626] text-xs font-mono">
                  <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed text-[11px]">
                    {JSON.stringify(ingestionResult, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Metadata Header */}
                  <div className="p-3 bg-black border border-[#262626] flex items-center justify-between text-xs flex-wrap gap-2">
                    <div>
                      <span className="text-[#888888]">Extracted Units:</span>{' '}
                      <strong className="text-[#f5ff00]">
                        {ingestionResult.source_upload_metadata.total_chunks_extracted}
                      </strong>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[#888888]">Identified Domains:</span>
                      {ingestionResult.source_upload_metadata.primary_domains_identified.map((dom) => (
                        <span
                          key={dom}
                          className="px-1.5 py-0.5 bg-[#181818] border border-[#333333] text-[9px] text-cyan-300 font-bold"
                        >
                          {dom}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* List of integrated items */}
                  {ingestionResult.integrated_rcsa_items.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-black border border-[#262626] hover:border-[#444444] transition space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#f5ff00] text-black font-bold text-[10px]">
                            {item.id}
                          </span>
                          <span className="px-2 py-0.5 bg-[#1a1a1a] border border-[#333333] text-[10px] text-white font-bold">
                            {item.domain}
                          </span>
                          <span className="px-2 py-0.5 bg-[#181818] border border-[#333333] text-[10px] text-[#aaaaaa]">
                            {item.control_type}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 border ${getRiskLevelBadge(
                              item.risk_calculations.inherent_risk_level
                            )}`}
                          >
                            IRS: {item.risk_calculations.inherent_risk_score} ({item.risk_calculations.inherent_risk_level})
                          </span>
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 border ${getRiskLevelBadge(
                              item.risk_calculations.residual_risk_level
                            )}`}
                          >
                            RRS: {item.risk_calculations.projected_residual_risk_score} ({item.risk_calculations.residual_risk_level})
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#888888] block mb-0.5">
                          Normalized Assessment Statement:
                        </span>
                        <p className="text-xs text-white font-sans font-medium leading-relaxed">
                          {item.assessment_question}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 bg-[#0d0d0d] border border-[#1f1f1f] text-[10px]">
                        <div>
                          <span className="text-[#666666] block">Likelihood (L):</span>
                          <span className="text-[#f5ff00] font-bold">{item.risk_calculations.likelihood}/5</span>
                        </div>
                        <div>
                          <span className="text-[#666666] block">Impact (I):</span>
                          <span className="text-[#f5ff00] font-bold">{item.risk_calculations.impact}/5</span>
                        </div>
                        <div>
                          <span className="text-[#666666] block">Control Weight (CE):</span>
                          <span className="text-cyan-300 font-bold">{item.risk_calculations.control_effectiveness_weight}</span>
                        </div>
                        <div>
                          <span className="text-[#666666] block">Residual Drop:</span>
                          <span className="text-emerald-400 font-bold">
                            -{(item.risk_calculations.inherent_risk_score - item.risk_calculations.projected_residual_risk_score).toFixed(1)} pts
                          </span>
                        </div>
                      </div>

                      {item.mapping_tags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <Tag className="w-3 h-3 text-[#666666]" />
                          {item.mapping_tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.2 bg-black border border-[#222222] text-[9px] text-[#888888]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#262626] bg-black flex items-center justify-between">
          <span className="text-[10px] text-[#666666]">
            Strict Output Format: JSON RCSA Ingestion Pipeline • NIST SP 800-53 & CSA CCM Mapping
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#1a1a1a] hover:bg-[#262626] text-xs font-bold uppercase tracking-wider text-[#aaaaaa] hover:text-white transition"
            >
              Close
            </button>
            {onImportItems && ingestionResult && (
              <button
                onClick={() => {
                  onImportItems(ingestionResult.integrated_rcsa_items);
                  onClose();
                }}
                className="px-4 py-2 bg-[#f5ff00] text-black hover:bg-yellow-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Import {ingestionResult.integrated_rcsa_items.length} Items into Catalog</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
