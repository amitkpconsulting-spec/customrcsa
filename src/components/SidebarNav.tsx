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
  Printer
} from 'lucide-react';

interface SidebarNavProps {
  currentStage: AssessmentWorkflowStage;
  onSelectStage: (stage: AssessmentWorkflowStage) => void;
  assessment: RCSAPayload;
  onOpenSettingsModal: () => void;
  onOpenSectorModal: () => void;
  onOpenDemoModal: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  currentStage,
  onSelectStage,
  assessment,
  onOpenSettingsModal,
  onOpenSectorModal,
  onOpenDemoModal,
}) => {
  const navItems: { id: AssessmentWorkflowStage; code: string; label: string; highlight?: boolean }[] = [
    { id: 'dashboard', code: 'DB', label: 'Dashboard' },
    { id: 'ai_dashboard', code: 'AI', label: 'AI Intelligence', highlight: true },
    { id: 'source_questionnaire', code: 'SQ', label: 'Source Questionnaire' },
    { id: 'questionnaire', code: 'AS', label: 'Assessments' },
    { id: 'heatmap', code: 'HM', label: 'Heatmap Matrix' },
    { id: 'remediation', code: 'RM', label: 'Remediation' },
    { id: 'reports', code: 'RP', label: 'Bulk Reports Generator' },
    { id: 'signoff', code: 'SG', label: 'Certification' },
    { id: 'create_rcsa', code: 'CR', label: '+ Create RCSA' },
  ];

  return (
    <aside className="w-16 sm:w-20 bg-black border-r border-[#262626] flex flex-col items-center py-6 gap-3 shrink-0 z-50 select-none">
      {/* Top Logo / Brand Glyph */}
      <a
        href="https://www.technoscope.co.in"
        target="_blank"
        rel="noopener noreferrer"
        className="w-10 h-10 border border-[#333333] hover:border-[#f5ff00] bg-[#111111] flex items-center justify-center font-bold text-xs tracking-tighter text-[#f5ff00] cursor-pointer mb-3 transition"
        title="Technoscope Official Website - technoscope.co.in"
      >
        <span className="font-mono text-xs">TC</span>
      </a>

      {/* Main Nav Icons */}
      <div className="flex flex-col gap-2.5 w-full items-center">
        {navItems.map((item) => {
          const isActive = currentStage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectStage(item.id)}
              className={`w-10 h-10 border flex items-center justify-center font-mono text-xs transition relative group ${
                isActive
                  ? 'bg-[#f5ff00] text-black border-[#f5ff00] font-bold shadow-[0_0_12px_rgba(245,255,0,0.3)]'
                  : 'bg-[#111111] text-[#999999] border-[#2a2a2a] hover:border-[#f5ff00] hover:text-[#f5ff00]'
              }`}
              title={item.label}
            >
              <span>{item.code}</span>
              {item.highlight && !isActive && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#f5ff00] animate-ping" />
              )}

              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-2 py-1 bg-black border border-[#333333] text-white text-[10px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50">
                {item.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Utility Controls */}
      <div className="mt-auto flex flex-col gap-2.5 w-full items-center pt-4 border-t border-[#222222]">
        <button
          onClick={onOpenSectorModal}
          className="w-10 h-10 border border-[#2a2a2a] bg-[#111111] text-[#888888] hover:text-[#f5ff00] hover:border-[#f5ff00] flex items-center justify-center text-[10px] font-mono transition relative group"
          title="Sector Overlay Profile"
        >
          <span>SEC</span>
          <div className="absolute left-full ml-3 px-2 py-1 bg-black border border-[#333333] text-white text-[10px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50">
            Sector Overlay
          </div>
        </button>

        <button
          onClick={onOpenDemoModal}
          className="w-10 h-10 border border-[#2a2a2a] bg-[#111111] text-[#888888] hover:text-[#f5ff00] hover:border-[#f5ff00] flex items-center justify-center text-[10px] font-mono transition relative group"
          title="Templates & Presets"
        >
          <span>TMP</span>
          <div className="absolute left-full ml-3 px-2 py-1 bg-black border border-[#333333] text-white text-[10px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50">
            Presets & Templates
          </div>
        </button>

        <button
          onClick={onOpenSettingsModal}
          className="w-10 h-10 border border-[#2a2a2a] bg-[#111111] text-[#888888] hover:text-[#f5ff00] hover:border-[#f5ff00] flex items-center justify-center text-xs font-mono transition relative group"
          title="Engine Settings & Air-Gapped Mode"
        >
          <Settings className="w-3.5 h-3.5" />
          <div className="absolute left-full ml-3 px-2 py-1 bg-black border border-[#333333] text-white text-[10px] font-mono whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition z-50">
            AI Engine / Settings
          </div>
        </button>
      </div>
    </aside>
  );
};
