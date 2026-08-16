import React from 'react';
import {
  FileSpreadsheet,
  FileCode,
  Printer,
  Sparkles,
  Settings,
  Layers,
  FolderOpen,
  PlusCircle,
  Shield,
  Eye,
  Lock,
  Radio,
} from 'lucide-react';
import { AssessmentWorkflowStage, RCSAPayload, RCSADomainType } from '../types';
import { SECTOR_PROFILES } from '../data/sectorProfiles';
import { RCSA_DOMAIN_CONFIGS } from '../data/nistControls';

interface HeaderProps {
  currentStage: AssessmentWorkflowStage;
  onSelectStage: (stage: AssessmentWorkflowStage) => void;
  assessment: RCSAPayload;
  onExportExcel: () => void;
  onExportJSON: () => void;
  onPrintReport: () => void;
  onOpenSectorModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenDemoModal: () => void;
  onNewAssessment: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStage,
  onSelectStage,
  assessment,
  onExportExcel,
  onExportJSON,
  onPrintReport,
  onOpenSectorModal,
  onOpenSettingsModal,
  onOpenDemoModal,
  onNewAssessment,
}) => {
  const currentSector = SECTOR_PROFILES[assessment.organizationProfile.sector] || SECTOR_PROFILES.Technology;
  const currentDomain: RCSADomainType = assessment.rcsaDomain || assessment.organizationProfile.rcsaDomain || 'All';
  const domainConfig = RCSA_DOMAIN_CONFIGS[currentDomain];

  const stages: { id: AssessmentWorkflowStage; label: string; code: string; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', code: 'DB' },
    { id: 'ai_dashboard', label: 'AI Intelligence', code: 'AI', badge: 'AI' },
    { id: 'source_questionnaire', label: 'Source Questionnaire', code: 'SQ' },
    { id: 'questionnaire', label: 'Assessments', code: 'AS' },
    { id: 'heatmap', label: 'Risk Matrix', code: 'HM' },
    { id: 'remediation', label: 'Remediation', code: 'RM' },
    { id: 'signoff', label: 'Certification', code: 'SG' },
    { id: 'create_rcsa', label: '+ Create RCSA', code: 'CR' },
  ];

  return (
    <header className="bg-[#0e0e0e] text-white border-b border-[#262626] sticky top-0 z-40">
      {/* Main Systematic Header */}
      <div className="px-4 sm:px-8 py-5 flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#222222]">
        {/* Brand and System Meta */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#888888]">
              <a
                href="https://github.com/amitkpconsulting-spec/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#f5ff00] transition underline-offset-2 hover:underline inline-flex items-center gap-1"
                title="Technoscope Specification GitHub Repository"
              >
                FRAMEWORK ENGINE v4.1.0
              </a>
            </span>
            <span className="text-[#333333] font-mono">•</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#f5ff00] font-bold">
              {domainConfig?.title || `${currentDomain} RCSA`}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-syne font-extrabold uppercase tracking-tight text-white leading-none pt-1 flex flex-wrap items-baseline gap-2.5">
            <a
              href="#dashboard"
              onClick={(e) => {
                e.preventDefault();
                onSelectStage('dashboard');
              }}
              className="hover:text-[#f5ff00] transition inline-block text-white cursor-pointer"
              title="Custom RCSA - Home"
            >
              Custom RCSA
            </a>
            <span className="text-xs sm:text-sm font-mono font-normal tracking-normal text-[#888888] normal-case">
              by{' '}
              <a
                href="https://www.technoscope.co.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f5ff00] hover:text-white underline underline-offset-4 decoration-[#f5ff00]/60 hover:decoration-white font-semibold transition"
                title="Technoscope Official Website - www.technoscope.co.in"
              >
                Technoscope
              </a>
            </span>
          </h1>

          {/* Action Bar */}
          <div className="flex items-center gap-2 flex-wrap pt-3">
            <button
              onClick={onNewAssessment}
              className="bg-[#f5ff00] text-black font-mono font-bold text-xs px-3.5 py-1.5 uppercase hover:bg-yellow-300 transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,255,0,0.2)]"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ NEW RCSA</span>
            </button>

            <button
              onClick={onExportExcel}
              className="bg-[#222222] text-white border border-[#333333] hover:border-[#f5ff00] hover:text-[#f5ff00] font-mono text-xs px-3 py-1.5 uppercase transition flex items-center gap-1.5"
              title="Export full multi-sheet Excel Workbook"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>XLSX</span>
            </button>

            <button
              onClick={onExportJSON}
              className="bg-[#222222] text-white border border-[#333333] hover:border-[#f5ff00] hover:text-[#f5ff00] font-mono text-xs px-3 py-1.5 uppercase transition flex items-center gap-1.5"
              title="Export canonical JSON payload"
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>JSON</span>
            </button>

            <button
              onClick={onPrintReport}
              className="bg-[#222222] text-white border border-[#333333] hover:border-[#f5ff00] hover:text-[#f5ff00] font-mono text-xs px-3 py-1.5 uppercase transition flex items-center gap-1.5"
              title="Print formal Audit Memorandum"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT</span>
            </button>

            <button
              onClick={onOpenSectorModal}
              className="bg-[#181818] text-[#cccccc] border border-[#2a2a2a] hover:border-[#f5ff00] hover:text-white font-mono text-[11px] px-2.5 py-1.5 uppercase transition flex items-center gap-1"
            >
              <Layers className="w-3 h-3 text-[#f5ff00]" />
              <span>SECTOR: {currentSector.name}</span>
            </button>

            <button
              onClick={onOpenDemoModal}
              className="bg-[#181818] text-[#cccccc] border border-[#2a2a2a] hover:border-[#f5ff00] hover:text-white font-mono text-[11px] px-2.5 py-1.5 uppercase transition flex items-center gap-1"
            >
              <FolderOpen className="w-3 h-3" />
              <span>TEMPLATES</span>
            </button>
          </div>
        </div>

        {/* Right Status Panel */}
        <div className="flex flex-col md:items-end justify-between self-stretch gap-2 font-mono text-right">
          <div className="space-y-1">
            <div className="text-[11px] uppercase tracking-wider font-bold text-[#f5ff00] flex items-center md:justify-end gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f5ff00] animate-pulse"></span>
              <span>STATUS: REVIEW_MODE</span>
            </div>
            <div className="text-xs text-[#999999]">
              SYS: <strong className="text-white">{assessment.organizationProfile.targetSystem}</strong>
            </div>
            <div className="text-[11px] text-[#666666]">
              Q3_CYCLE_2026 // NIST_800-53_REV5
            </div>
          </div>

          <div className="text-[10px] text-[#888888] pt-1">
            SIGNOFF: <span className="text-white px-1.5 py-0.5 border border-[#333333] bg-[#1a1a1a]">{assessment.auditSignoff.status}</span>
          </div>
        </div>
      </div>

      {/* Systematic Horizontal Sub-Navigation */}
      <div className="px-4 sm:px-8 flex items-center justify-between overflow-x-auto gap-4 py-2 text-xs font-mono no-scrollbar bg-[#111111]">
        <nav className="flex items-center gap-1 sm:gap-2">
          {stages.map((stage) => {
            const isActive = currentStage === stage.id;
            return (
              <button
                key={stage.id}
                onClick={() => onSelectStage(stage.id)}
                className={`px-2.5 py-1.5 uppercase text-[11px] tracking-wider transition whitespace-nowrap flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#222222] text-[#f5ff00] border border-[#f5ff00] font-bold'
                    : 'text-[#888888] hover:text-white border border-transparent hover:border-[#333333]'
                }`}
              >
                <span>{stage.label}</span>
                {stage.badge && (
                  <span className="text-[8px] px-1 py-0.2 bg-[#f5ff00] text-black font-bold font-mono">
                    {stage.badge}
                  </span>
                )}
                {stage.id === 'remediation' && assessment.aiRemediation && (
                  <span className="text-[9px] px-1 text-[#f5ff00] border border-[#444400] bg-[#1a1a00]">
                    {assessment.aiRemediation.roadmap.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-[#666666]">
          <span>NIST SP 800-53 Rev. 5</span>
          <span>•</span>
          <span>CCM v4.1.0</span>
          <span>•</span>
          <span>SSRM ENGINE</span>
        </div>
      </div>
    </header>
  );
};
