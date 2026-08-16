import React, { useState } from 'react';
import { SidebarNav } from './components/SidebarNav';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CreateRCSASection } from './components/CreateRCSASection';
import { AssessmentWorkflowView } from './components/AssessmentWorkflowView';
import { HeatmapMatrixView } from './components/HeatmapMatrixView';
import { RemediationRoadmapView } from './components/RemediationRoadmapView';
import { AuditCertificationView } from './components/AuditCertificationView';
import { SourceQuestionnaireView } from './components/SourceQuestionnaireView';
import { AIDashboardView } from './components/AIDashboardView';
import { ReportsSection } from './components/ReportsSection';
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
import { createInitialAssessmentFromCatalog, DEMO_PRESETS } from './data/demoAssessments';
import { exportRCSAToExcel, exportRCSAToJSON, printAuditReport } from './utils/exportUtils';
import { SECTOR_PROFILES } from './data/sectorProfiles';

export default function App() {
  const [assessment, setAssessment] = useState<RCSAPayload>(() =>
    createInitialAssessmentFromCatalog()
  );
  const [currentStage, setCurrentStage] = useState<AssessmentWorkflowStage>('dashboard');
  const [selectedControlId, setSelectedControlId] = useState<string | null>(null);
  const [initialDomainFilter, setInitialDomainFilter] = useState<string | null>(null);

  // Modals
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  // AI settings
  const [aiSettings, setAiSettings] = useState<AISettings>({
    mode: 'gemini',
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'llama3:latest',
    anythingLlmEndpoint: 'http://localhost:3001/api/v1',
    anythingLlmModel: 'default',
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
    const preset = DEMO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const newAssessment = createInitialAssessmentFromCatalog(
      preset.name,
      preset.sector,
      preset.system,
      'Lead Risk Assessor',
      preset.rcsaDomain || 'All'
    );
    setAssessment(newAssessment);
    setCurrentStage('dashboard');
  };

  // Handler for newly created assessment from CreateRCSASection
  const handleAssessmentCreated = (newAssessment: RCSAPayload) => {
    setAssessment(newAssessment);
    setInitialDomainFilter(newAssessment.rcsaDomain !== 'All' ? newAssessment.rcsaDomain : null);
    setSelectedControlId(null);
    setCurrentStage('questionnaire');
  };

  // Navigation helpers
  const handleNavigateToAssessments = (domainFilter?: string) => {
    setInitialDomainFilter(domainFilter || null);
    setSelectedControlId(null);
    setCurrentStage('questionnaire');
  };

  const handleNavigateToControl = (controlId: string) => {
    setSelectedControlId(controlId);
    setInitialDomainFilter(null);
    setCurrentStage('questionnaire');
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

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-row font-sans selection:bg-[#f5ff00] selection:text-black">
      {/* Sidebar Nav with square icon glyphs */}
      <SidebarNav
        currentStage={currentStage}
        onSelectStage={setCurrentStage}
        assessment={assessment}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenSectorModal={() => setIsSectorModalOpen(true)}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#111111] overflow-x-hidden">
        {/* Systematic Header */}
        <Header
          currentStage={currentStage}
          onSelectStage={setCurrentStage}
          assessment={assessment}
          onExportExcel={() => exportRCSAToExcel(assessment)}
          onExportJSON={() => exportRCSAToJSON(assessment)}
          onPrintReport={printAuditReport}
          onOpenSectorModal={() => setIsSectorModalOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenDemoModal={() => setIsDemoModalOpen(true)}
          onNewAssessment={() => setCurrentStage('create_rcsa')}
        />

        {/* Stage Content Canvas */}
        <main className="flex-1 w-full p-4 sm:p-8">
          {currentStage === 'dashboard' && (
            <DashboardView
              assessment={assessment}
              onNavigateToStage={(stage) => setCurrentStage(stage)}
              onFilterDomainInQuestionnaire={handleNavigateToAssessments}
              onSelectControlForReview={handleNavigateToControl}
              onOpenCreateRCSA={() => setCurrentStage('create_rcsa')}
              aiSettings={aiSettings}
              onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
            />
          )}

          {currentStage === 'ai_dashboard' && (
            <AIDashboardView
              assessment={assessment}
              aiSettings={aiSettings}
              onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
              onNavigateToStage={(stage) => setCurrentStage(stage)}
              onSelectControlForReview={handleNavigateToControl}
              onUpdateRemediationPlan={handleUpdateRemediationPlan}
            />
          )}

          {currentStage === 'create_rcsa' && (
            <CreateRCSASection
              onAssessmentCreated={handleAssessmentCreated}
              onCancel={() => setCurrentStage('dashboard')}
            />
          )}

          {currentStage === 'questionnaire' && (
            <AssessmentWorkflowView
              controls={assessment.controls}
              onUpdateControl={handleUpdateControl}
              onBatchUpdateControls={handleBatchUpdateControls}
              selectedControlId={selectedControlId}
              onClearSelectedControlId={() => setSelectedControlId(null)}
              initialDomainFilter={initialDomainFilter}
            />
          )}

          {currentStage === 'source_questionnaire' && (
            <SourceQuestionnaireView
              assessment={assessment}
              onNavigateToControl={handleNavigateToControl}
            />
          )}

          {currentStage === 'heatmap' && (
            <HeatmapMatrixView
              controls={assessment.controls}
              onSelectControl={handleNavigateToControl}
              currentSector={assessment.organizationProfile.sector}
              onUpdateSector={handleSelectSector}
            />
          )}

          {currentStage === 'remediation' && (
            <RemediationRoadmapView
              controls={assessment.controls}
              remediationPlan={assessment.aiRemediation}
              onUpdatePlan={handleUpdateRemediationPlan}
              sector={assessment.organizationProfile.sector}
              systemName={assessment.organizationProfile.targetSystem}
              onNavigateToControl={handleNavigateToControl}
              aiSettings={aiSettings}
            />
          )}

          {currentStage === 'reports' && (
            <ReportsSection
              assessment={assessment}
              onNavigateToStage={setCurrentStage}
            />
          )}

          {currentStage === 'signoff' && (
            <AuditCertificationView
              assessment={assessment}
              onUpdateSignoff={handleUpdateSignoff}
              onPrintReport={printAuditReport}
            />
          )}
        </main>

        {/* Industrial Footer Strip */}
        <footer className="border-t border-[#262626] bg-[#0c0c0c] text-[#777777] px-6 sm:px-8 py-3.5 mt-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-3">
            <span className="text-[#f5ff00] font-bold">NIST_800-53_REV5</span>
            <span>//</span>
            <span>PRIVACY_FRAMEWORK_v1.0</span>
            <span>//</span>
            <span>CSF_2.0</span>
          </div>

          <div className="flex items-center gap-3 text-[#555555]">
            <span className="text-[#888888]">
              <a
                href="https://github.com/amitkpconsulting-spec/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#f5ff00] transition underline-offset-2 hover:underline"
                title="Technoscope Consulting Specifications GitHub"
              >
                TECHNOSCOPE_SYSTEMS_CORE_INFRASTRUCTURE
              </a>
            </span>
            <span>//</span>
            <span className="text-[#34d399] font-bold">ONLINE_STABLE</span>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <SectorModal
        isOpen={isSectorModalOpen}
        onClose={() => setIsSectorModalOpen(false)}
        currentSector={assessment.organizationProfile.sector}
        onSelectSector={handleSelectSector}
      />

      <AISettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={aiSettings}
        onUpdateSettings={setAiSettings}
      />

      <DemoTemplatesModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSelectPreset={handleSelectPreset}
      />
    </div>
  );
}
