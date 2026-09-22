import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Lock,
  Calendar,
  Share2,
  History,
} from 'lucide-react';
import { RCSAPayload, AuditSignoff } from '../types';
import { ReportsSection } from './ReportsSection';
import { AuditCertificationView } from './AuditCertificationView';
import { GovernanceVersionTimeline } from './GovernanceVersionTimeline';
import { exportRCSAToExcel, exportRCSAToJSON, printAuditReport } from '../utils/exportUtils';

interface GovernanceViewProps {
  assessment: RCSAPayload;
  onNavigateToStage: (stage: any) => void;
  onUpdateSignoff: (signoff: AuditSignoff) => void;
  onSaveSnapshot?: (versionTag: string, notes: string, author: string) => void;
  onRevertToVersion?: (versionId: string) => void;
  onDeleteSnapshot?: (versionId: string) => void;
}

export const GovernanceView: React.FC<GovernanceViewProps> = ({
  assessment,
  onNavigateToStage,
  onUpdateSignoff,
  onSaveSnapshot,
  onRevertToVersion,
  onDeleteSnapshot,
}) => {
  // Governance sub-tabs: 'dossier' | 'certification' | 'exports' | 'version_history'
  const [govTab, setGovTab] = useState<'dossier' | 'certification' | 'exports' | 'version_history'>('dossier');

  const handlePrint = () => {
    printAuditReport(assessment);
  };

  return (
    <div className="space-y-6 text-white pb-12">
      {/* Governance Workspace Header */}
      <div className="border border-[#262626] bg-[#141414] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 border border-[#333333] bg-black text-[#888888]">
              GOVERNANCE WORKSPACE
            </span>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-emerald-600 bg-emerald-950/40 text-emerald-300">
              AUDIT STATUS: {assessment.auditSignoff.status.toUpperCase()}
            </span>
            <button
              onClick={() => setGovTab('version_history')}
              className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-[#333333] hover:border-[#f5ff00] bg-black hover:text-[#f5ff00] text-[#aaaaaa] flex items-center gap-1 transition cursor-pointer"
              title="Inspect Version History & Rollback Timeline"
            >
              <History className="w-3 h-3 text-[#f5ff00]" />
              <span>VER: {assessment.currentVersionTag || 'v2.0'}</span>
              <span className="text-[#666666]">({assessment.versionHistory?.length || 1})</span>
            </button>
          </div>
          <h2 className="text-xl sm:text-2xl font-syne font-bold uppercase tracking-tight text-white">
            Governance & Audit Dossier
          </h2>
          <p className="text-xs text-[#888888] font-sans">
            Synthesize formal regulatory audit dossiers, generate PO&AM matrices, manage cryptographic CISO sign-offs, and export enterprise compliance artifacts.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportRCSAToExcel(assessment)}
            className="px-3.5 py-2 bg-[#222222] border border-[#333333] hover:border-emerald-500 hover:text-emerald-300 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-[#222222] border border-[#333333] hover:border-[#f5ff00] hover:text-[#f5ff00] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>

          <button
            onClick={() => onNavigateToStage('presentation')}
            className="px-4 py-2 border border-[#f5ff00] bg-[#1c1c08] text-[#f5ff00] hover:bg-[#f5ff00] hover:text-black text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition shrink-0 shadow-[0_0_10px_rgba(245,255,0,0.2)] cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>⛶ Boardroom Mode</span>
          </button>
        </div>
      </div>

      {/* Primary Sub-Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#262626] bg-[#0c0c0c] p-1.5 font-mono text-xs overflow-x-auto no-scrollbar">
        <button
          onClick={() => setGovTab('dossier')}
          className={`px-4 py-2 uppercase font-bold tracking-wider flex items-center gap-2 transition cursor-pointer border ${
            govTab === 'dossier'
              ? 'border-[#f5ff00] bg-[#181808] text-[#f5ff00]'
              : 'border-transparent text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>1. Audit Report Builder & Dossier</span>
        </button>

        <button
          onClick={() => setGovTab('certification')}
          className={`px-4 py-2 uppercase font-bold tracking-wider flex items-center gap-2 transition cursor-pointer border ${
            govTab === 'certification'
              ? 'border-emerald-500 bg-[#0c2414] text-emerald-300'
              : 'border-transparent text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>2. CISO Sign-off & Digital Attestation</span>
        </button>

        <button
          onClick={() => setGovTab('exports')}
          className={`px-4 py-2 uppercase font-bold tracking-wider flex items-center gap-2 transition cursor-pointer border ${
            govTab === 'exports'
              ? 'border-[#38bdf8] bg-[#0c1a24] text-[#38bdf8]'
              : 'border-transparent text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <Download className="w-3.5 h-3.5 text-[#38bdf8]" />
          <span>3. Multi-Format Exports & Verification</span>
        </button>

        <button
          onClick={() => setGovTab('version_history')}
          className={`px-4 py-2 uppercase font-bold tracking-wider flex items-center gap-2 transition cursor-pointer border ${
            govTab === 'version_history'
              ? 'border-[#f5ff00] bg-[#181808] text-[#f5ff00]'
              : 'border-transparent text-[#888888] hover:text-white hover:bg-[#161616]'
          }`}
        >
          <History className="w-3.5 h-3.5 text-[#f5ff00]" />
          <span>4. Version History & Audit Trail</span>
          <span className={`text-[10px] px-1.5 py-0.2 font-mono font-bold ${
            govTab === 'version_history' ? 'bg-[#f5ff00] text-black' : 'bg-[#222222] text-[#888888]'
          }`}>
            {assessment.versionHistory?.length || 1}
          </span>
        </button>
      </div>

      {/* TAB 1: REPORTS & DOSSIER BUILDER */}
      {govTab === 'dossier' && (
        <ReportsSection
          assessment={assessment}
          onNavigateToStage={onNavigateToStage}
        />
      )}

      {/* TAB 2: AUDIT CERTIFICATION */}
      {govTab === 'certification' && (
        <AuditCertificationView
          assessment={assessment}
          onUpdateSignoff={onUpdateSignoff}
          onPrintReport={handlePrint}
          onNavigateToRTP={() => onNavigateToStage('remediation')}
        />
      )}

      {/* TAB 3: EXPORTS & VERIFICATION */}
      {govTab === 'exports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 border border-[#262626] bg-[#141414] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="p-3 border border-[#2a2a2a] bg-black w-fit text-emerald-400">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-syne font-bold uppercase text-white">
                  Excel Multi-Sheet Workbook (.xlsx)
                </h3>
                <p className="text-xs text-[#888888] leading-relaxed">
                  Full RCSA workbook containing Executive Summary, NIST 800-53 Matrix, Risk Calculations with live Excel formulas, and PO&AM Deficiency Tracking.
                </p>
              </div>
              <button
                onClick={() => exportRCSAToExcel(assessment)}
                className="w-full py-2.5 bg-emerald-600 text-white hover:bg-emerald-500 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel Workbook</span>
              </button>
            </div>

            <div className="p-6 border border-[#262626] bg-[#141414] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="p-3 border border-[#2a2a2a] bg-black w-fit text-[#38bdf8]">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-syne font-bold uppercase text-white">
                  JSON Machine-Readable Payload (.json)
                </h3>
                <p className="text-xs text-[#888888] leading-relaxed">
                  Export complete structured JSON payload conforming to Technoscope RCSA v4 Schema for automated CI/CD pipeline verification and SIEM ingestion.
                </p>
              </div>
              <button
                onClick={() => exportRCSAToJSON(assessment)}
                className="w-full py-2.5 bg-[#1a1a1a] border border-[#444444] text-[#38bdf8] hover:border-[#38bdf8] font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Payload</span>
              </button>
            </div>

            <div className="p-6 border border-[#262626] bg-[#141414] flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="p-3 border border-[#2a2a2a] bg-black w-fit text-[#f5ff00]">
                  <Printer className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-syne font-bold uppercase text-white">
                  Official Audit Memorandum (PDF/Print)
                </h3>
                <p className="text-xs text-[#888888] leading-relaxed">
                  Clean, print-optimized CISO compliance dossier with formal signature blocks, digital seal, and high-priority mitigation roadmaps.
                </p>
              </div>
              <button
                onClick={handlePrint}
                className="w-full py-2.5 bg-[#f5ff00] text-black hover:bg-yellow-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Audit Memorandum</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: VERSION HISTORY & AUDIT TIMELINE */}
      {govTab === 'version_history' && (
        <GovernanceVersionTimeline
          assessment={assessment}
          onSaveSnapshot={onSaveSnapshot}
          onRevertToVersion={onRevertToVersion}
          onDeleteSnapshot={onDeleteSnapshot}
        />
      )}
    </div>
  );
};
