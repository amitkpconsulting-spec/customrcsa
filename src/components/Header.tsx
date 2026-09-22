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
  ChevronDown,
  Maximize2,
  Tv,
  FileText,
  HelpCircle,
  History,
} from 'lucide-react';
import { AssessmentWorkflowStage, RCSAPayload, RCSADomainType } from '../types';
import { SECTOR_PROFILES } from '../data/sectorProfiles';
import { RCSA_DOMAIN_CONFIGS } from '../data/nistControls';
import { MULTI_SECTOR_RCSA_PRESETS } from '../data/demoAssessments';

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
  onSelectPreset?: (presetId: string) => void;
  onOpenPresentation?: () => void;
  onOpenAICopilot?: () => void;
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
  onSelectPreset,
  onOpenPresentation,
  onOpenAICopilot,
}) => {
  const currentSector = SECTOR_PROFILES[assessment.organizationProfile.sector] || SECTOR_PROFILES.Technology;
  const currentDomain: RCSADomainType = assessment.rcsaDomain || assessment.organizationProfile.rcsaDomain || 'All';
  const domainConfig = RCSA_DOMAIN_CONFIGS[currentDomain];

  // Determine active workspace
  const isExecutive = currentStage === 'dashboard' || currentStage === 'heatmap' || currentStage === 'compliance_timeline' || currentStage === 'timeline';
  const isStudio = currentStage === 'assessment_workflow' || currentStage === 'questionnaire' || currentStage === 'source_questionnaire' || currentStage === 'remediation';
  const isGovernance = currentStage === 'governance' || currentStage === 'reports' || currentStage === 'signoff';

  const workspaces: { id: AssessmentWorkflowStage; label: string; code: string; active: boolean; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Executive Workspace',
      code: 'EXEC',
      active: isExecutive,
      badge: 'OVERVIEW & HEATMAP',
    },
    {
      id: 'assessment_workflow',
      label: 'Assessment Studio',
      code: 'STUDIO',
      active: isStudio,
      badge: 'NIST & CALIBRATION',
    },
    {
      id: 'governance',
      label: 'Governance & Audit',
      code: 'AUDIT',
      active: isGovernance,
      badge: 'SIGNOFF & DOSSIER',
    },
  ];

  return (
    <header className="bg-[#0e0e0e] text-white border-b border-[#262626] sticky top-0 z-40">
      {/* Top Main Bar */}
      <div className="px-4 sm:px-8 py-4 flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#222222]">
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
            <span className="text-[#333333] font-mono">•</span>
            <span className="text-[10px] font-mono text-white font-bold bg-[#1a1a1a] px-2 py-0.5 border border-[#333333]">
              {assessment.assessmentName}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-syne font-extrabold uppercase tracking-tight text-white leading-none pt-0.5 flex flex-wrap items-baseline gap-2.5">
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

          {/* Quick Action Tools Bar */}
          <div className="flex items-center gap-2 flex-wrap pt-2.5">
            <button
              onClick={onNewAssessment}
              className="bg-[#f5ff00] text-black font-mono font-bold text-xs px-3.5 py-1.5 uppercase hover:bg-yellow-300 transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,255,0,0.2)] cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ NEW RCSA</span>
            </button>

            {/* AI COPILOT BUTTON */}
            {onOpenAICopilot && (
              <button
                onClick={onOpenAICopilot}
                className="bg-[#141408] text-[#f5ff00] border border-[#f5ff00]/60 hover:border-[#f5ff00] hover:bg-[#202008] font-mono font-bold text-xs px-3 py-1.5 uppercase transition flex items-center gap-1.5 shadow-[0_0_8px_rgba(245,255,0,0.15)] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#f5ff00]" />
                <span>AI COPILOT</span>
              </button>
            )}

            {/* PRESENTER VIEW BUTTON */}
            <button
              onClick={() => {
                if (onOpenPresentation) {
                  onOpenPresentation();
                } else {
                  onSelectStage('presentation');
                }
              }}
              className="bg-[#111111] text-[#38bdf8] border border-[#38bdf8]/60 hover:border-[#38bdf8] hover:bg-[#0c1a24] font-mono font-bold text-xs px-3 py-1.5 uppercase transition flex items-center gap-1.5 cursor-pointer"
              title="Launch Full Screen Presentation Mode (Hotkey: P)"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>⛶ PRESENTER</span>
            </button>

            {/* Quick Multi-Sector Preset Selector */}
            {onSelectPreset && (
              <div className="relative inline-block">
                <select
                  aria-label="Quick Select RCSA Preset"
                  onChange={(e) => {
                    if (e.target.value) {
                      onSelectPreset(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="bg-[#1a1a1a] text-[#f5ff00] border border-[#f5ff00]/60 hover:border-[#f5ff00] font-mono text-[11px] font-bold px-2.5 py-1.5 uppercase transition cursor-pointer outline-none max-w-[190px] sm:max-w-[220px] truncate"
                >
                  <option value="" disabled className="text-[#888888]">
                    ⚡ QUICK SWITCH (28)
                  </option>
                  <optgroup label="1. Banking & Financial Services" className="bg-[#141414] text-white">
                    {MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'Financial').map((p) => (
                      <option key={p.id} value={p.id}>
                        🏦 {p.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="2. Healthcare & Life Sciences" className="bg-[#141414] text-white">
                    {MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'Healthcare').map((p) => (
                      <option key={p.id} value={p.id}>
                        🏥 {p.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="3. Retail & E-Commerce" className="bg-[#141414] text-white">
                    {MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'Retail').map((p) => (
                      <option key={p.id} value={p.id}>
                        🛒 {p.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="4. SaaS & Technology" className="bg-[#141414] text-white">
                    {MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'Technology').map((p) => (
                      <option key={p.id} value={p.id}>
                        💻 {p.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="5. Critical Infrastructure" className="bg-[#141414] text-white">
                    {MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'Critical_Infrastructure').map((p) => (
                      <option key={p.id} value={p.id}>
                        ⚡ {p.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="6. Federal & Defense" className="bg-[#141414] text-white">
                    {MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'Defense').map((p) => (
                      <option key={p.id} value={p.id}>
                        🛡️ {p.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="7. Public Sector & Education" className="bg-[#141414] text-white">
                    {MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'Public_Sector').map((p) => (
                      <option key={p.id} value={p.id}>
                        🏛️ {p.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            <button
              onClick={onExportExcel}
              className="bg-[#222222] text-white border border-[#333333] hover:border-emerald-500 hover:text-emerald-300 font-mono text-xs px-2.5 py-1.5 uppercase transition flex items-center gap-1 cursor-pointer"
              title="Export Excel Workbook"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>XLSX</span>
            </button>

            <button
              onClick={onExportJSON}
              className="bg-[#222222] text-white border border-[#333333] hover:border-[#38bdf8] hover:text-[#38bdf8] font-mono text-xs px-2.5 py-1.5 uppercase transition flex items-center gap-1 cursor-pointer"
              title="Export JSON"
            >
              <FileCode className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>JSON</span>
            </button>

            <button
              onClick={onPrintReport}
              className="bg-[#222222] text-white border border-[#333333] hover:border-[#f5ff00] hover:text-[#f5ff00] font-mono text-xs px-2.5 py-1.5 uppercase transition flex items-center gap-1 cursor-pointer"
              title="Print Audit Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT</span>
            </button>
          </div>
        </div>

        {/* Right Status Panel */}
        <div className="flex flex-col md:items-end justify-between self-stretch gap-1.5 font-mono text-right">
          <div className="space-y-0.5">
            <div className="text-[11px] uppercase tracking-wider font-bold text-[#f5ff00] flex items-center md:justify-end gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f5ff00] animate-pulse"></span>
              <span>SECTOR: {currentSector.name.toUpperCase()}</span>
            </div>
            <div className="text-xs text-[#999999] max-w-sm truncate">
              SYS: <strong className="text-white">{assessment.organizationProfile.targetSystem}</strong>
            </div>
            <div className="text-[10px] text-[#666666]">
              {assessment.organizationProfile.complianceTarget} // NIST SP 800-53
            </div>
          </div>

          <div className="flex items-center md:justify-end gap-2 text-[10px] text-[#888888] pt-1">
            <div>
              SIGNOFF: <span className="text-emerald-400 px-1.5 py-0.2 border border-emerald-800 bg-emerald-950/40 font-bold">{assessment.auditSignoff.status}</span>
            </div>
            <span className="text-[#444444]">|</span>
            <button
              onClick={() => onSelectStage('dashboard')}
              className="text-[#cccccc] hover:text-[#f5ff00] transition flex items-center gap-1 cursor-pointer"
              title="View Assessment Version History & Rollback Ledger"
            >
              <History className="w-3 h-3 text-[#f5ff00]" />
              <span className="text-white font-bold">{assessment.currentVersionTag || 'v2.0'}</span>
              <span className="px-1 py-0.2 bg-[#222222] border border-[#333333] text-[9px] text-[#f5ff00] font-bold">
                {assessment.versionHistory?.length || 1}V
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary 3-Workspace Navigation Strip */}
      <div className="px-4 sm:px-8 flex items-center justify-between overflow-x-auto gap-4 py-2 text-xs font-mono no-scrollbar bg-[#111111]">
        <nav className="flex items-center gap-2">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => onSelectStage(ws.id)}
              className={`px-4 py-2 uppercase text-xs tracking-wider transition whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                ws.active
                  ? 'bg-[#1e1e0a] text-[#f5ff00] border-[#f5ff00] font-bold shadow-[0_0_10px_rgba(245,255,0,0.15)]'
                  : 'text-[#888888] hover:text-white border-transparent hover:bg-[#161616]'
              }`}
            >
              {ws.id === 'dashboard' && <Layers className="w-3.5 h-3.5" />}
              {ws.id === 'assessment_workflow' && <Shield className="w-3.5 h-3.5" />}
              {ws.id === 'governance' && <FileText className="w-3.5 h-3.5" />}
              <span>{ws.label}</span>
              {ws.badge && (
                <span className={`text-[9px] px-1.5 py-0.2 font-bold font-mono ${
                  ws.active ? 'bg-[#f5ff00] text-black' : 'bg-[#222222] text-[#888888]'
                }`}>
                  {ws.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono text-[#666666]">
          <span>NIST SP 800-53 Rev. 5</span>
          <span>•</span>
          <span>CSA CAIQ v4.1.0</span>
          <span>•</span>
          <span>CEF Engine</span>
        </div>
      </div>
    </header>
  );
};
