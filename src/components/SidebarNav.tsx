import React from 'react';
import {
  AssessmentWorkflowStage,
  RCSAPayload,
} from '../types';
import {
  Sparkles,
  Settings,
  Layers,
  FolderOpen,
  PlusCircle,
  FileSpreadsheet,
  FileCode,
  Printer,
  Shield,
  FileText,
  Radio,
  Tv,
  TrendingDown,
} from 'lucide-react';

interface SidebarNavProps {
  currentStage: AssessmentWorkflowStage;
  onSelectStage: (stage: AssessmentWorkflowStage) => void;
  assessment: RCSAPayload;
  onOpenSettingsModal: () => void;
  onOpenSectorModal: () => void;
  onOpenDemoModal: () => void;
  onOpenAICopilot?: () => void;
  onOpenPresentation?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentStage,
  onSelectStage,
  assessment,
  onOpenSettingsModal,
  onOpenSectorModal,
  onOpenDemoModal,
  onOpenAICopilot,
  onOpenPresentation,
}) => {
  // 3 Primary Consolidate Workspaces
  const isExecutive = currentStage === 'dashboard' || currentStage === 'heatmap' || currentStage === 'compliance_timeline' || currentStage === 'timeline';
  const isStudio = currentStage === 'assessment_workflow' || currentStage === 'questionnaire' || currentStage === 'source_questionnaire' || currentStage === 'remediation';
  const isGovernance = currentStage === 'governance' || currentStage === 'reports' || currentStage === 'signoff';

  return (
    <aside className="w-16 sm:w-20 bg-black border-r border-[#262626] flex flex-col items-center py-6 gap-3 shrink-0 z-50 select-none">
      {/* Top Logo / Brand Glyph */}
      <a
        href="https://www.technoscope.co.in"
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 border border-[#333333] hover:border-[#f5ff00] bg-[#111111] flex items-center justify-center font-bold text-xs tracking-tighter text-[#f5ff00] cursor-pointer mb-2 transition shadow-[0_0_8px_rgba(245,255,0,0.15)]"
        title="Technoscope Official Website - technoscope.co.in"
      >
        <span className="font-mono text-xs">TC</span>
      </a>

      {/* Primary Workspaces Navigation */}
      <div className="flex flex-col gap-2 w-full items-center">
        {/* 1. EXECUTIVE WORKSPACE */}
        <button
          onClick={() => onSelectStage('dashboard')}
          className={`w-11 h-11 border flex flex-col items-center justify-center font-mono text-xs transition relative group cursor-pointer ${
            isExecutive
              ? 'bg-[#f5ff00] text-black border-[#f5ff00] font-bold shadow-[0_0_14px_rgba(245,255,0,0.35)]'
              : 'bg-[#111111] text-[#999999] border-[#2a2a2a] hover:border-[#f5ff00] hover:text-[#f5ff00]'
          }`}
          title="Executive Workspace (Risk Posture, Heatmap, Trajectory, Gaps)"
        >
          <Layers className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-bold tracking-tighter">EXEC</span>
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-black border border-[#333333] text-white text-[11px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 shadow-xl">
            1. Executive Workspace (Overview, Heatmap, Radar, Trajectory)
          </div>
        </button>

        {/* 2. ASSESSMENT STUDIO */}
        <button
          onClick={() => onSelectStage('assessment_workflow')}
          className={`w-11 h-11 border flex flex-col items-center justify-center font-mono text-xs transition relative group cursor-pointer ${
            isStudio
              ? 'bg-[#f5ff00] text-black border-[#f5ff00] font-bold shadow-[0_0_14px_rgba(245,255,0,0.35)]'
              : 'bg-[#111111] text-[#999999] border-[#2a2a2a] hover:border-[#f5ff00] hover:text-[#f5ff00]'
          }`}
          title="Controls & Assessment Studio (NIST Matrix, Source Mapping, POAM Roadmap)"
        >
          <Shield className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-bold tracking-tighter">STUDIO</span>
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-black border border-[#333333] text-white text-[11px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 shadow-xl">
            2. Controls & Assessment Studio (NIST Matrix, CAIQ, Remediation)
          </div>
        </button>

        {/* 3. GOVERNANCE & AUDIT DOSSIER */}
        <button
          onClick={() => onSelectStage('governance')}
          className={`w-11 h-11 border flex flex-col items-center justify-center font-mono text-xs transition relative group cursor-pointer ${
            isGovernance
              ? 'bg-[#f5ff00] text-black border-[#f5ff00] font-bold shadow-[0_0_14px_rgba(245,255,0,0.35)]'
              : 'bg-[#111111] text-[#999999] border-[#2a2a2a] hover:border-[#f5ff00] hover:text-[#f5ff00]'
          }`}
          title="Governance & Audit Dossier (Reports, CISO Sign-off, Exports)"
        >
          <FileText className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-bold tracking-tighter">AUDIT</span>
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-black border border-[#333333] text-white text-[11px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 shadow-xl">
            3. Governance & Audit Dossier (Reports, Certification, Exports)
          </div>
        </button>

        {/* 4. RISK TREATMENT PLAN (RTP) */}
        <button
          onClick={() => onSelectStage('remediation')}
          className={`w-11 h-11 border flex flex-col items-center justify-center font-mono text-xs transition relative group cursor-pointer ${
            currentStage === 'remediation'
              ? 'bg-[#f5ff00] text-black border-[#f5ff00] font-bold shadow-[0_0_14px_rgba(245,255,0,0.35)]'
              : 'bg-[#111111] text-[#999999] border-[#2a2a2a] hover:border-[#38bdf8] hover:text-[#38bdf8]'
          }`}
          title="Post-Audit Risk Treatment Plan (RTP - 5 Steps & Annual Reduction Tracking)"
        >
          <TrendingDown className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-bold tracking-tighter">RTP</span>
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-black border border-[#333333] text-white text-[11px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 shadow-xl">
            4. Risk Treatment Plan (RTP: 5 Steps, Priority Criteria, Product Owner Milestones)
          </div>
        </button>

        <div className="w-8 h-px bg-[#262626] my-1"></div>

        {/* AI COPILOT DRAWER TRIGGER */}
        <button
          onClick={onOpenAICopilot}
          className="w-11 h-11 border border-[#333333] bg-[#141408] text-[#f5ff00] hover:bg-[#f5ff00] hover:text-black flex flex-col items-center justify-center font-mono text-xs transition relative group cursor-pointer shadow-[0_0_10px_rgba(245,255,0,0.15)]"
          title="AI Security Copilot (Zero Trust Hardening, Predictions, Analysis)"
        >
          <Sparkles className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-bold">AI</span>
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#f5ff00] animate-ping" />
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-black border border-[#333333] text-white text-[11px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 shadow-xl">
            ✨ AI Security Copilot (Zero Trust Hardening & Insights)
          </div>
        </button>

        {/* PRESENTER VIEW TRIGGER */}
        <button
          onClick={onOpenPresentation || (() => onSelectStage('presentation'))}
          className="w-11 h-11 border border-[#2a2a2a] bg-[#111111] text-[#38bdf8] hover:border-[#38bdf8] hover:bg-[#0c1a24] flex flex-col items-center justify-center font-mono text-xs transition relative group cursor-pointer"
          title="Full Screen Boardroom Presenter Mode"
        >
          <Tv className="w-4 h-4 mb-0.5" />
          <span className="text-[9px] font-bold">PRES</span>
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-black border border-[#333333] text-white text-[11px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 shadow-xl">
            ⛶ Fullscreen Boardroom Presenter Mode
          </div>
        </button>
      </div>

      {/* Bottom Utility Controls */}
      <div className="mt-auto flex flex-col gap-2 w-full items-center pt-3 border-t border-[#222222]">
        <button
          onClick={onOpenSectorModal}
          className="w-10 h-10 border border-[#2a2a2a] bg-[#111111] text-[#888888] hover:text-[#f5ff00] hover:border-[#f5ff00] flex items-center justify-center text-[10px] font-mono transition relative group cursor-pointer"
          title="Sector Overlay Profile"
        >
          <span>SEC</span>
          <div className="absolute left-full ml-3 px-2 py-1 bg-black border border-[#333333] text-white text-[10px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 shadow-xl">
            Sector Overlay Profile
          </div>
        </button>

        <button
          onClick={onOpenDemoModal}
          className="w-10 h-10 border border-[#2a2a2a] bg-[#111111] text-[#888888] hover:text-[#f5ff00] hover:border-[#f5ff00] flex items-center justify-center text-[10px] font-mono transition relative group cursor-pointer"
          title="Templates & Presets"
        >
          <span>TMP</span>
          <div className="absolute left-full ml-3 px-2 py-1 bg-black border border-[#333333] text-white text-[10px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 shadow-xl">
            Presets & Catalog Templates (28)
          </div>
        </button>

        <button
          onClick={onOpenSettingsModal}
          className="w-10 h-10 border border-[#2a2a2a] bg-[#111111] text-[#888888] hover:text-[#f5ff00] hover:border-[#f5ff00] flex items-center justify-center text-xs font-mono transition relative group cursor-pointer"
          title="Engine Settings & Air-Gapped Mode"
        >
          <Settings className="w-3.5 h-3.5" />
          <div className="absolute left-full ml-3 px-2 py-1 bg-black border border-[#333333] text-white text-[10px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50 shadow-xl">
            AI Engine / Air-Gapped Mode Config
          </div>
        </button>
      </div>
    </aside>
  );
};
