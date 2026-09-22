import React, { useState } from 'react';
import { SidebarNav } from './components/SidebarNav';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AssessmentWorkflowView } from './components/AssessmentWorkflowView';
import { GovernanceView } from './components/GovernanceView';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { CreateRCSAModal } from './components/CreateRCSAModal';
import { PresentationView } from './components/PresentationView';
import { SectorModal, AISettingsModal, DemoTemplatesModal } from './components/Modals';
import {
  RCSAPayload,
  AssessmentWorkflowStage,
  AssessedControl,
  SectorType,
  AISettings,
  AuditSignoff,
  AIRemediationPlan,
} from './types';
import {
  createAssessmentFromPreset,
  MULTI_SECTOR_RCSA_PRESETS,
} from './data/demoAssessments';
import { exportRCSAToExcel, exportRCSAToJSON, printAuditReport } from './utils/exportUtils';
import { SECTOR_PROFILES } from './data/sectorProfiles';
import {
  addVersionSnapshotToRCSA,
  revertRCSAToVersion,
  deleteVersionSnapshotFromRCSA,
} from './utils/versionTracker';

export default function App() {
  const [assessment, setAssessment] = useState<RCSAPayload>(() =>
    createAssessmentFromPreset('tech-b2b-saas')
  );
  const [currentStage, setCurrentStage] = useState<AssessmentWorkflowStage>('dashboard');
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [initialDomainFilter, setInitialDomainFilter] = useState<string | null>(null);

  // Modals & Drawers
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isPresentationModalOpen, setIsPresentationModalOpen] = useState(false);
  const [isCreateRCSAModalOpen, setIsCreateRCSAModalOpen] = useState(false);

  // AI Copilot Drawer State
  const [isAICopilotOpen, setIsAICopilotOpen] = useState(false);
  const [aiCopilotTargetControl, setAiCopilotTargetControl] = useState<AssessedControl | undefined>(undefined);

  // AI settings
  const [aiSettings, setAiSettings] = useState<AISettings>({
    mode: 'gemini',
    lmStudioEndpoint: 'http://localhost:1234/v1',
    lmStudioModel: 'default',
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'llama3:latest',
    ollamaApiPath: '/api',
    unslothEndpoint: 'http://localhost:8888',
    unslothModel: 'unsloth-model',
    anythingLlmEndpoint: 'http://localhost:3001/api',
    anythingLlmModel: 'default',
    delimitGeminiKey: false,
    fallbackToLocalOnQuota: true,
    isAirGappedMode: false,
  });

  // Handler for single control update
  const handleUpdateControl = (updatedControl: AssessedControl) => {
    setAssessment((prev) => ({
      ...prev,
      controls: prev.controls.map((c) =>
        c.controlId === updatedControl.controlId ? updatedControl : c
      ),
      timestamp: new Date().toISOString(),
    }));
  };

  // Handler for batch controls update
  const handleBatchUpdateControls = (updatedList: AssessedControl[]) => {
    setAssessment((prev) => ({
      ...prev,
      controls: updatedList,
      timestamp: new Date().toISOString(),
    }));
  };

  // Handler for sector profile overlay change
  const handleSelectSector = (sector: SectorType) => {
    const profile = SECTOR_PROFILES[sector] || SECTOR_PROFILES.Technology;
    setAssessment((prev) => ({
      ...prev,
      organizationProfile: {
        ...prev.organizationProfile,
        sector,
        complianceTarget: `${profile.regulatoryFrameworks.join(', ')} Baseline`,
      },
    }));
  };

  // Handler for loading demo preset archetype
  const handleSelectPreset = (presetId: string) => {
    const newAssessment = createAssessmentFromPreset(presetId);
    setAssessment(newAssessment);
    setInitialDomainFilter(newAssessment.rcsaDomain !== 'All' ? newAssessment.rcsaDomain : null);
    setSelectedControlId(null);
    setCurrentStage('dashboard');
  };

  // Handler for newly created assessment from modal
  const handleAssessmentCreated = (newAssessment: RCSAPayload) => {
    setAssessment(newAssessment);
    setInitialDomainFilter(newAssessment.rcsaDomain !== 'All' ? newAssessment.rcsaDomain : null);
    setSelectedControlId(null);
    setCurrentStage('assessment_workflow');
  };

  // Navigation helpers
  const handleNavigateToAssessments = (domainFilter?: string) => {
    setInitialDomainFilter(domainFilter || null);
    setSelectedControlId(null);
    setCurrentStage('assessment_workflow');
  };

  const handleNavigateToControl = (controlId: string) => {
    setSelectedControlId(controlId);
    setInitialDomainFilter(null);
    setCurrentStage('assessment_workflow');
  };

  const handleOpenAICopilot = (targetControl?: AssessedControl) => {
    setAiCopilotTargetControl(targetControl);
    setIsAICopilotOpen(true);
  };

  const handleUpdateSignoff = (newSignoff: AuditSignoff) => {
    setAssessment((prev) => ({
      ...prev,
      auditSignoff: newSignoff,
    }));
  };

  const handleUpdateRemediationPlan = (plan: AIRemediationPlan) => {
    setAssessment((prev) => ({
      ...prev,
      aiRemediation: plan,
    }));
  };

  // Handler for saving a new snapshot directly to the RCSA object
  const handleSaveSnapshot = (versionTag: string, notes: string, author: string) => {
    setAssessment((prev) => addVersionSnapshotToRCSA(prev, versionTag, notes, author));
  };

  // Handler for reverting the RCSA object to a previous historical version
  const handleRevertToVersion = (versionId: string) => {
    setAssessment((prev) => {
      const { updatedAssessment } = revertRCSAToVersion(prev, versionId);
      return updatedAssessment;
    });
  };

  // Handler for deleting a snapshot from the RCSA version history
  const handleDeleteSnapshot = (versionId: string) => {
    setAssessment((prev) => deleteVersionSnapshotFromRCSA(prev, versionId));
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-row font-sans selection:bg-[#f5ff00] selection:text-black">
      {/* 3-Workspace Streamlined Sidebar Nav */}
      <SidebarNav
        currentStage={currentStage}
        onSelectStage={(stage) => {
          if (stage === 'presentation') {
            setIsPresentationModalOpen(true);
          } else {
            setCurrentStage(stage);
          }
        }}
        assessment={assessment}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenSectorModal={() => setIsSectorModalOpen(true)}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
        onOpenAICopilot={() => handleOpenAICopilot()}
        onOpenPresentation={() => setIsPresentationModalOpen(true)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#111111] overflow-x-hidden">
        {/* Systematic 3-Workspace Header */}
        <Header
          currentStage={currentStage}
          onSelectStage={(stage) => {
            if (stage === 'presentation') {
              setIsPresentationModalOpen(true);
            } else {
              setCurrentStage(stage);
            }
          }}
          assessment={assessment}
          onExportExcel={() => exportRCSAToExcel(assessment)}
          onExportJSON={() => exportRCSAToJSON(assessment)}
          onPrintReport={() => printAuditReport(assessment)}
          onOpenSectorModal={() => setIsSectorModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenDemoModal={() => setIsDemoModalOpen(true)}
          onNewAssessment={() => setIsCreateRCSAModalOpen(true)}
          onSelectPreset={handleSelectPreset}
          onOpenPresentation={() => setIsPresentationModalOpen(true)}
          onOpenAICopilot={() => handleOpenAICopilot()}
        />

        {/* Stage Content Canvas */}
        <main className="flex-1 w-full p-4 sm:p-8">
          {/* 1. EXECUTIVE WORKSPACE (Overview, Risk Heatmap Matrix, Radar Gaps, Timeline) */}
          {(currentStage === 'dashboard' ||
            currentStage === 'heatmap' ||
            currentStage === 'compliance_timeline' ||
            currentStage === 'timeline') && (
            <DashboardView
              assessment={assessment}
              onNavigateToStage={(stage) => {
                if (stage === 'presentation') {
                  setIsPresentationModalOpen(true);
                } else if (stage === 'questionnaire' || stage === 'assessment_workflow') {
                  setCurrentStage('assessment_workflow');
                } else if (stage === 'signoff' || stage === 'reports' || stage === 'governance') {
                  setCurrentStage('governance');
                } else if (stage === 'create_rcsa') {
                  setIsCreateRCSAModalOpen(true);
                } else {
                  setCurrentStage(stage);
                }
              }}
              onFilterDomainInQuestionnaire={handleNavigateToAssessments}
              onSelectControlForReview={handleNavigateToControl}
              onOpenCreateRCSA={() => setIsCreateRCSAModalOpen(true)}
              aiSettings={aiSettings}
              onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
              onOpenAICopilot={() => handleOpenAICopilot()}
              onSaveSnapshot={handleSaveSnapshot}
              onRevertToVersion={handleRevertToVersion}
              onDeleteSnapshot={handleDeleteSnapshot}
            />
          )}

          {/* 2. CONTROLS & ASSESSMENT STUDIO (NIST Matrix, Batch Scoring, Calibration Drawer, CAIQ, Remediation) */}
          {(currentStage === 'assessment_workflow' ||
            currentStage === 'questionnaire' ||
            currentStage === 'source_questionnaire' ||
            currentStage === 'remediation') && (
            <AssessmentWorkflowView
              controls={assessment.controls}
              onUpdateControl={handleUpdateControl}
              onBatchUpdateControls={handleBatchUpdateControls}
              selectedControlId={selectedControlId}
              onClearSelectedControlId={() => setSelectedControlId(null)}
              initialDomainFilter={initialDomainFilter}
              assessment={assessment}
              onUpdateRemediationPlan={handleUpdateRemediationPlan}
              onOpenAICopilotForControl={(control) => handleOpenAICopilot(control)}
              initialTab={
                currentStage === 'remediation'
                  ? 'remediation'
                  : currentStage === 'questionnaire' || currentStage === 'source_questionnaire'
                  ? 'questionnaire'
                  : 'matrix'
              }
              onUpdateAssessment={(updated) => setAssessment(updated)}
              onSaveSnapshot={handleSaveSnapshot}
            />
          )}

          {/* 3. GOVERNANCE & AUDIT DOSSIER (Reports Builder, CISO Sign-off, Multi-Format Exports) */}
          {(currentStage === 'governance' ||
            currentStage === 'reports' ||
            currentStage === 'signoff') && (
            <GovernanceView
              assessment={assessment}
              onNavigateToStage={(stage) => {
                if (stage === 'presentation') {
                  setIsPresentationModalOpen(true);
                } else {
                  setCurrentStage(stage);
                }
              }}
              onUpdateSignoff={handleUpdateSignoff}
              onSaveSnapshot={handleSaveSnapshot}
              onRevertToVersion={handleRevertToVersion}
              onDeleteSnapshot={handleDeleteSnapshot}
            />
          )}

          {/* STANDALONE AI DASHBOARD (If explicitly triggered) */}
          {currentStage === 'ai_dashboard' && (
            <div className="space-y-6">
              <DashboardView
                assessment={assessment}
                onNavigateToStage={(stage) => setCurrentStage(stage)}
                onFilterDomainInQuestionnaire={handleNavigateToAssessments}
                onSelectControlForReview={handleNavigateToControl}
                onOpenCreateRCSA={() => setIsCreateRCSAModalOpen(true)}
                aiSettings={aiSettings}
                onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
                onOpenAICopilot={() => handleOpenAICopilot()}
                onSaveSnapshot={handleSaveSnapshot}
                onRevertToVersion={handleRevertToVersion}
                onDeleteSnapshot={handleDeleteSnapshot}
              />
            </div>
          )}
        </main>

        {/* Industrial Footer Strip */}
        <footer id="app-global-footer" className="border-t border-[#262626] bg-[#0c0c0c] text-[#777777] px-6 sm:px-8 py-3.5 mt-auto flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[#f5ff00] font-bold">NIST_800-53_REV5</span>
            <span className="text-[#333333]">//</span>
            <span>CSA_CAIQ_v4.1.0</span>
            <span className="text-[#333333]">//</span>
            <span>ZERO_TRUST_CEF</span>
          </div>

          {/* Technoscope Proprietary Copyright Attribution */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-center">
            <span className="text-[#888888]">Developed by</span>
            <a
              id="footer-technoscope-link"
              href="https://www.technoscope.co.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5ff00] hover:text-yellow-300 font-bold underline-offset-2 hover:underline transition"
              title="Technoscope Official Website - www.technoscope.co.in"
            >
              www.technoscope.co.in
            </a>
            <span className="text-[#444444]">//</span>
            <span className="text-[#dddddd] font-semibold tracking-wide">
              Proprietary Copyright
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[#555555]">
            <span className="text-[#888888]">
              <a
                id="footer-github-spec-link"
                href="https://github.com/amitkpconsulting-spec/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#f5ff00] transition underline-offset-2 hover:underline"
                title="Technoscope Consulting Specifications GitHub"
              >
                TECHNOSCOPE_SYSTEMS_CORE_INFRASTRUCTURE
              </a>
            </span>
            <span className="text-[#333333]">//</span>
            <span className="text-[#34d399] font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse"></span>
              ONLINE_STABLE
            </span>
          </div>
        </footer>
      </div>

      {/* AI Security Copilot Slide-out Drawer */}
      <AICopilotDrawer
        isOpen={isAICopilotOpen}
        onClose={() => {
          setIsAICopilotOpen(false);
          setAiCopilotTargetControl(undefined);
        }}
        assessment={assessment}
        targetControl={aiCopilotTargetControl}
        aiSettings={aiSettings}
        onOpenSettings={() => {
          setIsAICopilotOpen(false);
          setIsSettingsModalOpen(true);
        }}
      />

      {/* Create RCSA Modal */}
      <CreateRCSAModal
        isOpen={isCreateRCSAModalOpen}
        onClose={() => setIsCreateRCSAModalOpen(false)}
        onAssessmentCreated={handleAssessmentCreated}
      />

      {/* Sector Profile Overlay Modal */}
      <SectorModal
        isOpen={isSectorModalOpen}
        onClose={() => setIsSectorModalOpen(false)}
        currentSector={assessment.organizationProfile.sector}
        onSelectSector={handleSelectSector}
      />

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={aiSettings}
        onUpdateSettings={setAiSettings}
      />

      {/* Catalog & Demo Presets Modal */}
      <DemoTemplatesModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSelectPreset={handleSelectPreset}
      />

      {/* Full Screen Presentation View Modal */}
      {isPresentationModalOpen && (
        <PresentationView
          assessment={assessment}
          onClose={() => setIsPresentationModalOpen(false)}
          onBackToHome={() => {
            setIsPresentationModalOpen(false);
            setCurrentStage('dashboard');
          }}
          onSelectPreset={handleSelectPreset}
          onNavigateToControl={(ctrlId) => {
            setIsPresentationModalOpen(false);
            handleNavigateToControl(ctrlId);
          }}
        />
      )}
    </div>
  );
}
