import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Eye,
  Layers,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Sliders,
  FileCheck,
  Building,
  User,
  Sparkles,
  ExternalLink,
  Check,
  Plus,
  Bookmark,
  BookmarkPlus,
  Trash2,
  Tag,
  Save,
  Clock,
} from 'lucide-react';
import { RCSADomainType, SectorType, RCSAPayload, RiskDomain, RCSATemplate } from '../types';
import { RCSA_DOMAIN_CONFIGS, getControlsForRCSADomain } from '../data/nistControls';
import { createInitialAssessmentFromCatalog } from '../data/demoAssessments';
import { SECTOR_PROFILES } from '../data/sectorProfiles';
import {
  getSavedTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
} from '../data/rcsaTemplates';

interface CreateRCSASectionProps {
  onAssessmentCreated: (newAssessment: RCSAPayload) => void;
  onCancel?: () => void;
}

const AVAILABLE_DOMAINS: { id: RiskDomain; label: string; desc: string; icon: any; color: string; badge: string }[] = [
  {
    id: 'Privacy',
    label: 'Privacy RCSA',
    desc: 'PII processing, consent telemetry, privacy notices, data subject rights & cross-border transfers.',
    icon: Eye,
    color: 'border-purple-600 bg-purple-950/40 text-purple-300',
    badge: 'NIST Privacy Framework / GDPR / CCPA',
  },
  {
    id: 'Information Security',
    label: 'Information Security RCSA',
    desc: 'ISMS controls, security awareness, media sanitization, contingency planning & software supply chain (SCRM).',
    icon: Shield,
    color: 'border-blue-600 bg-blue-950/40 text-blue-300',
    badge: 'ISO/IEC 27001 / NIST SP 800-53',
  },
  {
    id: 'Cybersecurity',
    label: 'Cybersecurity RCSA',
    desc: 'Zero trust architecture, MFA, continuous audit logging, SIEM alerts, vulnerability & incident response.',
    icon: Lock,
    color: 'border-emerald-600 bg-emerald-950/40 text-emerald-300',
    badge: 'NIST CSF 2.0 / SP 800-207 Zero Trust',
  },
  {
    id: 'Governance',
    label: 'Governance & Risk RCSA',
    desc: 'Security planning, risk assessment programs, cryptographic policy, and audit oversight.',
    icon: Layers,
    color: 'border-amber-600 bg-amber-950/40 text-amber-300',
    badge: 'NIST SP 800-37 / Enterprise ERM',
  },
];

export const CreateRCSASection: React.FC<CreateRCSASectionProps> = ({
  onAssessmentCreated,
  onCancel,
}) => {
  const [selectedDomains, setSelectedDomains] = useState<RiskDomain[]>(['Privacy']);
  const [assessmentName, setAssessmentName] = useState('Production Privacy & PII Compliance RCSA');
  const [targetSystem, setTargetSystem] = useState('Customer Data Platform, Telemetry Pipeline & Consent Vault');
  const [sector, setSector] = useState<SectorType>('Technology');
  const [assessorName, setAssessorName] = useState('Amit Patel (Lead Risk Assessor)');
  const [businessUnit, setBusinessUnit] = useState('Data Privacy & Cloud Security Office');
  const [impactLevel, setImpactLevel] = useState<'Low' | 'Moderate' | 'High'>('High');
  const [reviewCycle, setReviewCycle] = useState('Q3 2026 Formal Audit Cycle');

  // Custom Templates State
  const [templates, setTemplates] = useState<RCSATemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateTags, setNewTemplateTags] = useState('Custom, Baseline, Q3');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setTemplates(getSavedTemplates());
  }, []);

  const handleApplyTemplate = (tpl: RCSATemplate) => {
    setSelectedTemplateId(tpl.id);
    setSelectedDomains(tpl.domains);
    setAssessmentName(tpl.name);
    setTargetSystem(tpl.targetSystem);
    setSector(tpl.sector);
    setImpactLevel(tpl.systemImpactLevel);
    setBusinessUnit(tpl.businessUnit);
    setReviewCycle(tpl.reviewCycle);
    if (tpl.assessorName) setAssessorName(tpl.assessorName);

    setToastMessage(`Loaded configuration template: '${tpl.name}'`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenSaveModal = () => {
    setNewTemplateName(`${selectedDomains.join(' + ')} Custom Template`);
    setNewTemplateDesc(`Pre-configured ${selectedDomains.join(' + ')} scope with ${impactLevel} Impact baseline for ${sector} sector.`);
    setIsSaveTemplateModalOpen(true);
  };

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    const saved = saveCustomTemplate({
      name: newTemplateName.trim(),
      description: newTemplateDesc.trim() || `Custom configuration with ${selectedDomains.join(' + ')} for ${targetSystem}`,
      domains: selectedDomains,
      sector,
      systemImpactLevel: impactLevel,
      businessUnit,
      reviewCycle,
      targetSystem,
      assessorName,
      tags: newTemplateTags.split(',').map(t => t.trim()).filter(Boolean),
      frameworkFocus: selectedDomains.map(d => RCSA_DOMAIN_CONFIGS[d]?.title || d).join(' / '),
    });

    setTemplates(getSavedTemplates());
    setSelectedTemplateId(saved.id);
    setIsSaveTemplateModalOpen(false);
    setToastMessage(`Saved custom template '${saved.name}' for quick re-use.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleDeleteTemplate = (tplId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteCustomTemplate(tplId);
    setTemplates(updated);
    if (selectedTemplateId === tplId) setSelectedTemplateId(null);
    setToastMessage('Deleted custom template from saved library.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const controlsForDomain = getControlsForRCSADomain(selectedDomains);

  // Total questions count
  const totalQuestions = controlsForDomain.reduce(
    (acc, c) => acc + c.assessmentQuestions.length,
    0
  );

  // Collect unique families & frameworks
  const combinedFamilies = Array.from(new Set(controlsForDomain.map((c) => c.family)));

  // Domain multi-select toggler
  const toggleDomain = (domainId: RiskDomain) => {
    let next: RiskDomain[];
    if (selectedDomains.includes(domainId)) {
      if (selectedDomains.length === 1) return; // keep at least one
      next = selectedDomains.filter((d) => d !== domainId);
    } else {
      next = [...selectedDomains, domainId];
    }
    updateDomainSelection(next);
  };

  // Quick Preset Handlers
  const applyPreset = (domains: RiskDomain[]) => {
    updateDomainSelection(domains);
  };

  const updateDomainSelection = (domains: RiskDomain[]) => {
    setSelectedDomains(domains);
    
    // Auto-update assessment title and context recommendations
    if (domains.length === 1) {
      const d = domains[0];
      if (d === 'Privacy') {
        setAssessmentName('Production Privacy & PII Compliance RCSA');
        setTargetSystem('Customer Data Platform, Telemetry Pipeline & Consent Vault');
        setBusinessUnit('Data Privacy & Cloud Governance Office');
      } else if (d === 'Information Security') {
        setAssessmentName('Enterprise Information Security & ISMS RCSA');
        setTargetSystem('Core Infrastructure, Cloud VPCs & Microservices');
        setBusinessUnit('Enterprise Information Security & IT Audit');
      } else if (d === 'Cybersecurity') {
        setAssessmentName('Cyber Threat Defense & Zero Trust Security RCSA');
        setTargetSystem('Cloud Perimeter Gateways, Identity Mesh & Production Clusters');
        setBusinessUnit('Cyber Defense Operations & SecOps');
      } else {
        setAssessmentName('Enterprise Governance, Risk & Oversight RCSA');
        setTargetSystem('Enterprise Policy Repository & Risk Management Board');
        setBusinessUnit('Corporate Governance & Risk Committee');
      }
    } else if (domains.length === 2 && domains.includes('Privacy') && domains.includes('Information Security')) {
      setAssessmentName('Unified Privacy & Information Security Joint RCSA');
      setTargetSystem('Core Cloud Infrastructure, PII Data Lakes & Customer Data Platform');
      setBusinessUnit('Joint Privacy Office & Information Security Directorate');
    } else if (domains.length === 2 && domains.includes('Cybersecurity') && domains.includes('Information Security')) {
      setAssessmentName('Enterprise Cyber Defense & InfoSec Dual RCSA');
      setTargetSystem('Zero Trust Production Enclave & Multi-Cloud VPC Mesh');
      setBusinessUnit('Unified Information Security & SecOps Center');
    } else if (domains.length === 2 && domains.includes('Privacy') && domains.includes('Cybersecurity')) {
      setAssessmentName('Privacy Vault & Cyber Perimeter Security RCSA');
      setTargetSystem('Encrypted PII Microservices & Secure Key Management HSM');
      setBusinessUnit('Cyber Defense & Privacy Engineering');
    } else if (domains.length >= 4) {
      setAssessmentName('Comprehensive Enterprise 20-Family Universal RCSA');
      setTargetSystem('Enterprise Global Hybrid Multi-Cloud Infrastructure');
      setBusinessUnit('Global Enterprise Risk & Compliance Committee');
    } else {
      setAssessmentName(`${domains.join(' + ')} Combined RCSA`);
      setTargetSystem('Enterprise Production Multi-Domain Systems');
      setBusinessUnit('Enterprise Risk Management Directorate');
    }
  };

  // Submit Handler
  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveDomainName = selectedDomains.length === 1 
      ? selectedDomains[0] 
      : selectedDomains.length === 4 
      ? 'All' 
      : selectedDomains.join(' + ');

    const created = createInitialAssessmentFromCatalog(
      assessmentName.trim() || `${effectiveDomainName} Assessment`,
      sector,
      targetSystem.trim() || 'Enterprise Production System',
      assessorName.trim() || 'Risk Assessor',
      effectiveDomainName,
      selectedDomains
    );

    created.organizationProfile.businessUnit = businessUnit;
    created.organizationProfile.systemImpactLevel = impactLevel;
    created.organizationProfile.reviewCycle = reviewCycle;

    onAssessmentCreated(created);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-500/80 text-emerald-300 text-xs font-mono flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Save Template Modal */}
      {isSaveTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border-2 border-[#f5ff00] max-w-lg w-full p-6 space-y-6 shadow-2xl animate-scaleUp">
            <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
              <h3 className="text-base font-syne font-bold uppercase text-white flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-[#f5ff00]" />
                Save Current Scope as Re-Usable Template
              </h3>
              <button
                onClick={() => setIsSaveTemplateModalOpen(false)}
                className="text-[#888888] hover:text-white font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCurrentAsTemplate} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-[11px] uppercase font-bold text-[#aaaaaa] block mb-1">
                  Template Name:
                </label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-[#aaaaaa] block mb-1">
                  Description & Regulatory Scope:
                </label>
                <textarea
                  rows={3}
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-[#aaaaaa] block mb-1">
                  Search Tags (comma-separated):
                </label>
                <input
                  type="text"
                  value={newTemplateTags}
                  onChange={(e) => setNewTemplateTags(e.target.value)}
                  placeholder="e.g. GDPR, PII, High-Impact, Tier1"
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                />
              </div>

              <div className="p-3 bg-[#1c1c1c] border border-[#333333] space-y-1 text-[11px]">
                <div className="text-[#888888]">CONFIGURATION CAPTURED:</div>
                <div className="text-white">
                  Domains: <span className="text-[#f5ff00] font-bold">{selectedDomains.join(' + ')}</span> • Sector: <span className="text-[#f5ff00] font-bold">{sector}</span> • Impact: <span className="text-[#f5ff00] font-bold">{impactLevel}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSaveTemplateModalOpen(false)}
                  className="px-4 py-2 border border-[#333333] text-[#888888] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#f5ff00] text-black font-bold hover:bg-yellow-300 shadow-[0_0_10px_rgba(245,255,0,0.3)]"
                >
                  Save to Template Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="border-b border-[#262626] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 border border-[#333333] bg-black text-[#888888]">
              SECTION: RCSA INITIALIZATION ENGINE
            </span>
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#f5ff00]">
              TECHNOSCOPE RCSA ENGINE
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-syne font-bold uppercase tracking-tight text-white">
            Create New RCSA Assessment
          </h2>
          <p className="text-xs sm:text-sm text-[#888888] mt-2 max-w-2xl leading-relaxed">
            Select one or combine multiple assessment domains (e.g., Privacy + Information Security) to dynamically generate unified control universes, tailored questionnaires, and composite risk weighting.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          <button
            type="button"
            onClick={handleOpenSaveModal}
            className="px-4 py-2 bg-[#222222] border border-[#333333] hover:border-[#f5ff00] hover:text-[#f5ff00] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
            title="Save current domain & settings as a re-usable template"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-[#f5ff00]" />
            <span>Save as Template</span>
          </button>

          {onCancel && (
            <button
              onClick={onCancel}
              type="button"
              className="px-4 py-2 border border-[#333333] bg-[#1a1a1a] text-white font-mono text-xs font-bold uppercase tracking-wider hover:border-[#f5ff00] hover:text-[#f5ff00] transition"
            >
              Cancel & Return
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* RE-USABLE TEMPLATES GALLERY (QUICK LOAD PRESETS)          */}
      {/* ========================================================= */}
      <div className="border border-[#262626] bg-[#141414] p-6 space-y-4">
        <div className="border-b border-[#262626] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#f5ff00]" />
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-white">
              SAVED & ARCHETYPE TEMPLATES LIBRARY
            </h3>
            <span className="font-mono text-[10px] text-[#888888]">({templates.length} AVAILABLE)</span>
          </div>

          <span className="text-[10px] font-mono text-[#888888]">
            Click any template to auto-populate domains, sector & parameters
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map((tpl) => {
            const isSelected = selectedTemplateId === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => handleApplyTemplate(tpl)}
                className={`p-4 border text-left transition cursor-pointer flex flex-col justify-between space-y-3 group relative ${
                  isSelected
                    ? 'border-[#f5ff00] bg-[#1c1c08]'
                    : 'border-[#262626] bg-[#0f0f0f] hover:border-[#444444] hover:bg-[#161616]'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 border border-[#333333] bg-black text-[#f5ff00]">
                      {tpl.domains.join(' + ')}
                    </span>
                    {!tpl.isDefault && (
                      <button
                        onClick={(e) => handleDeleteTemplate(tpl.id, e)}
                        className="text-[#666666] hover:text-rose-400 p-1 transition"
                        title="Delete custom template"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <h4 className="text-sm font-syne font-bold uppercase text-white group-hover:text-[#f5ff00] transition">
                    {tpl.name}
                  </h4>
                  <p className="text-[11px] text-[#888888] font-sans leading-relaxed line-clamp-2">
                    {tpl.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#222222] flex items-center justify-between text-[10px] font-mono text-[#777777]">
                  <span>Sector: <strong className="text-[#aaaaaa]">{tpl.sector}</strong></span>
                  <span>Impact: <strong className="text-white">{tpl.systemImpactLevel}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleCreateAssessment} className="space-y-8">
        {/* Step 1: Multi-Domain Scope Selection (Dropdown & Combining Multi-Select) */}
        <div className="border border-[#262626] bg-[#141414] p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
            <div>
              <span className="font-mono text-[10px] text-[#f5ff00] uppercase tracking-wider font-bold block">STEP 01</span>
              <h3 className="text-lg font-syne font-bold uppercase text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#f5ff00] inline" />
                Domain Scope (Multi-Select & Combining Option)
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-1 bg-black border border-[#333333] text-[#888888]">
                {selectedDomains.length} DOMAIN{selectedDomains.length > 1 ? 'S' : ''} SELECTED
              </span>
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-1 bg-[#f5ff00] text-black">
                {controlsForDomain.length} CONTROLS ACTIVE
              </span>
            </div>
          </div>

          {/* Quick Combining Presets */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-mono font-bold text-[#888888] block">
              QUICK COMBINATION PRESETS:
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset(['Privacy', 'Information Security'])}
                className={`px-3 py-1.5 text-xs font-mono border transition flex items-center gap-1.5 ${
                  selectedDomains.length === 2 && selectedDomains.includes('Privacy') && selectedDomains.includes('Information Security')
                    ? 'border-[#f5ff00] bg-[#222200] text-[#f5ff00] font-bold'
                    : 'border-[#333333] bg-[#181818] text-[#cccccc] hover:border-[#f5ff00]'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#f5ff00]" />
                <span>Privacy + Information Security (Combined)</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(['Cybersecurity', 'Information Security'])}
                className={`px-3 py-1.5 text-xs font-mono border transition flex items-center gap-1.5 ${
                  selectedDomains.length === 2 && selectedDomains.includes('Cybersecurity') && selectedDomains.includes('Information Security')
                    ? 'border-[#f5ff00] bg-[#222200] text-[#f5ff00] font-bold'
                    : 'border-[#333333] bg-[#181818] text-[#cccccc] hover:border-[#f5ff00]'
                }`}
              >
                <span>Cybersecurity + InfoSec (Dual)</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(['Privacy', 'Cybersecurity'])}
                className={`px-3 py-1.5 text-xs font-mono border transition flex items-center gap-1.5 ${
                  selectedDomains.length === 2 && selectedDomains.includes('Privacy') && selectedDomains.includes('Cybersecurity')
                    ? 'border-[#f5ff00] bg-[#222200] text-[#f5ff00] font-bold'
                    : 'border-[#333333] bg-[#181818] text-[#cccccc] hover:border-[#f5ff00]'
                }`}
              >
                <span>Privacy + Cybersecurity</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(['Privacy', 'Information Security', 'Cybersecurity', 'Governance'])}
                className={`px-3 py-1.5 text-xs font-mono border transition flex items-center gap-1.5 ${
                  selectedDomains.length === 4
                    ? 'border-[#f5ff00] bg-[#222200] text-[#f5ff00] font-bold'
                    : 'border-[#333333] bg-[#181818] text-[#cccccc] hover:border-[#f5ff00]'
                }`}
              >
                <span>All 4 Enterprise Domains (Full 20-Family)</span>
              </button>
            </div>
          </div>

          {/* Interactive Multi-Select Domain Grid */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-mono font-bold text-[#888888] block">
              TOGGLE INDIVIDUAL DOMAINS TO COMBINE:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVAILABLE_DOMAINS.map((domainItem) => {
                const isSelected = selectedDomains.includes(domainItem.id);
                const IconComponent = domainItem.icon;
                return (
                  <button
                    key={domainItem.id}
                    type="button"
                    onClick={() => toggleDomain(domainItem.id)}
                    className={`p-4 border text-left transition flex items-start justify-between gap-3 relative ${
                      isSelected
                        ? 'border-[#f5ff00] bg-[#1a1a00] shadow-[0_0_12px_rgba(245,255,0,0.15)]'
                        : 'border-[#262626] bg-[#181818] hover:border-[#444444]'
                    }`}
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <IconComponent className={`w-4 h-4 ${isSelected ? 'text-[#f5ff00]' : 'text-[#888888]'}`} />
                        <span className="font-bold font-syne uppercase text-sm text-white">
                          {domainItem.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#888888] leading-snug">
                        {domainItem.desc}
                      </p>
                      <div className="pt-1.5">
                        <span className="text-[9px] font-mono px-1.5 py-0.5 bg-black border border-[#333333] text-[#aaaaaa]">
                          {domainItem.badge}
                        </span>
                      </div>
                    </div>

                    <div className={`w-5 h-5 border flex items-center justify-center transition mt-0.5 font-mono ${
                      isSelected ? 'bg-[#f5ff00] border-[#f5ff00] text-black font-bold' : 'border-[#444444] bg-black'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Combination Summary Strip */}
          <div className="p-5 border border-[#262626] bg-black space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222222] pb-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-[#888888]">
                  CURRENT ASSESSMENT CONFIGURATION:
                </span>
                <h4 className="text-base sm:text-lg font-syne font-bold uppercase text-white mt-0.5">
                  {selectedDomains.length === 1
                    ? `${selectedDomains[0]} Dedicated RCSA`
                    : selectedDomains.length === 4
                    ? 'Universal 4-Domain Enterprise Assessment'
                    : `${selectedDomains.join(' & ')} Combined RCSA`}
                </h4>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="text-right">
                  <span className="text-[#666666] block text-[9px] uppercase font-bold">Catalog Scope</span>
                  <span className="font-bold text-sm text-[#f5ff00]">{controlsForDomain.length} NIST Controls</span>
                </div>
                <div className="text-right border-l border-[#262626] pl-4">
                  <span className="text-[#666666] block text-[9px] uppercase font-bold">Question Bank</span>
                  <span className="font-bold text-sm text-white">{totalQuestions} Inquiries</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#888888] block mb-1.5 flex items-center gap-1 font-mono">
                  <Layers className="w-3 h-3 inline text-[#f5ff00]" />
                  ACTIVE NIST SP 800-53 FAMILIES ({combinedFamilies.length}):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {combinedFamilies.map((fam) => (
                    <span
                      key={fam}
                      className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[#222222] text-[#f5ff00] border border-[#333333]"
                    >
                      {fam}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#888888] block mb-1.5 flex items-center gap-1 font-mono">
                  <BookOpen className="w-3 h-3 inline text-[#f5ff00]" />
                  COMBINED REGULATORY OVERLAYS:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDomains.map((d) => (
                    <span
                      key={d}
                      className="text-[10px] font-mono font-medium px-2 py-0.5 bg-[#181818] border border-[#333333] text-[#cccccc]"
                    >
                      {d === 'Privacy' ? 'NIST Privacy / GDPR / CCPA' : d === 'Information Security' ? 'ISO 27001 / SP 800-53' : d === 'Cybersecurity' ? 'NIST CSF 2.0 / Zero Trust' : 'NIST SP 800-37 ERM'}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Assessment Context & Profile Attributes */}
        <div className="border border-[#262626] bg-[#141414] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#262626] pb-4">
            <div>
              <span className="font-mono text-[10px] text-[#f5ff00] uppercase tracking-wider font-bold block">STEP 02</span>
              <h3 className="text-lg font-syne font-bold uppercase text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-[#f5ff00] inline" />
                Assessment Context & System Attributes
              </h3>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#888888] font-mono">
              SECTOR & BOUNDARY GOVERNANCE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Assessment Name */}
            <div className="space-y-1.5">
              <label htmlFor="assessment-name-input" className="block text-[11px] uppercase font-bold tracking-wider text-[#aaaaaa]">
                Assessment Name / Engagement Title *
              </label>
              <input
                id="assessment-name-input"
                type="text"
                required
                value={assessmentName}
                onChange={(e) => setAssessmentName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
              />
            </div>

            {/* Target System */}
            <div className="space-y-1.5">
              <label htmlFor="target-system-input" className="block text-[11px] uppercase font-bold tracking-wider text-[#aaaaaa]">
                Target System & Scope Boundary *
              </label>
              <input
                id="target-system-input"
                type="text"
                required
                value={targetSystem}
                onChange={(e) => setTargetSystem(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
              />
            </div>

            {/* Sector Selection */}
            <div className="space-y-1.5">
              <label htmlFor="sector-select" className="block text-[11px] uppercase font-bold tracking-wider text-[#aaaaaa]">
                Industry Sector Profile
              </label>
              <select
                id="sector-select"
                value={sector}
                onChange={(e) => setSector(e.target.value as SectorType)}
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
              >
                {Object.keys(SECTOR_PROFILES).map((s) => (
                  <option key={s} value={s}>
                    {s} — {SECTOR_PROFILES[s as SectorType].name} (Risk Mult: {SECTOR_PROFILES[s as SectorType].defaultRiskMultiplier}x)
                  </option>
                ))}
              </select>
            </div>

            {/* Impact Level */}
            <div className="space-y-1.5">
              <label htmlFor="impact-level-select" className="block text-[11px] uppercase font-bold tracking-wider text-[#aaaaaa]">
                System Impact Categorization (FIPS 199)
              </label>
              <select
                id="impact-level-select"
                value={impactLevel}
                onChange={(e) => setImpactLevel(e.target.value as 'Low' | 'Moderate' | 'High')}
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
              >
                <option value="High">High Impact (Critical System / Sensitive PII / Tier 1)</option>
                <option value="Moderate">Moderate Impact (Standard Enterprise Services)</option>
                <option value="Low">Low Impact (Internal Non-Critical Tools)</option>
              </select>
            </div>

            {/* Lead Assessor */}
            <div className="space-y-1.5">
              <label htmlFor="assessor-name-input" className="block text-[11px] uppercase font-bold tracking-wider text-[#aaaaaa]">
                Lead Assessor Name
              </label>
              <input
                id="assessor-name-input"
                type="text"
                value={assessorName}
                onChange={(e) => setAssessorName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
              />
            </div>

            {/* Business Unit */}
            <div className="space-y-1.5">
              <label htmlFor="business-unit-input" className="block text-[11px] uppercase font-bold tracking-wider text-[#aaaaaa]">
                Business Unit / Operating Entity
              </label>
              <input
                id="business-unit-input"
                type="text"
                value={businessUnit}
                onChange={(e) => setBusinessUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
              />
            </div>

            {/* Review Cycle */}
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="review-cycle-input" className="block text-[11px] uppercase font-bold tracking-wider text-[#aaaaaa]">
                Audit / Assessment Review Cycle
              </label>
              <input
                id="review-cycle-input"
                type="text"
                value={reviewCycle}
                onChange={(e) => setReviewCycle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#262626]">
          <div className="text-xs text-[#888888] font-mono">
            Ready to initialize <strong className="text-[#f5ff00] font-bold">{controlsForDomain.length} controls</strong> across <strong className="text-[#f5ff00] font-bold">{selectedDomains.length} domains</strong>.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full sm:w-auto px-5 py-3 border border-[#333333] text-white font-mono text-xs font-bold uppercase tracking-wider hover:border-[#f5ff00] transition"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-[#f5ff00] text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-yellow-300 transition flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(245,255,0,0.3)]"
            >
              <span>Initialize RCSA Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
