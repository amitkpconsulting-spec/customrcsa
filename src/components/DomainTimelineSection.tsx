import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Flame,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Plus,
  Download,
  Filter,
  Layers,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Target,
  FileCheck,
  UserCheck,
  Award,
} from 'lucide-react';
import { DomainMilestone, RCSADomainType, MilestoneStatus, MilestoneCategory } from '../types';
import { getMilestonesForDomain, computeRenewalSummary } from '../data/domainMilestones';
import { RCSA_DOMAIN_CONFIGS } from '../data/nistControls';

interface DomainTimelineSectionProps {
  currentDomain: RCSADomainType;
  onNavigateToStage: (stage: any) => void;
  onNavigateToControl?: (controlId: string) => void;
}

export const DomainTimelineSection: React.FC<DomainTimelineSectionProps> = ({
  currentDomain,
  onNavigateToStage,
}) => {
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<RCSADomainType>(currentDomain || 'All');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'table'>('timeline');
  const [customMilestones, setCustomMilestones] = useState<DomainMilestone[]>(() => {
    return getMilestonesForDomain(selectedDomainFilter);
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-11-30');
  const [newCategory, setNewCategory] = useState<MilestoneCategory>('ASSESSMENT_CYCLE');
  const [newOwner, setNewOwner] = useState('Security & Risk Assessor');
  const [newCriticality, setNewCriticality] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');
  const [newDeliverable, setNewDeliverable] = useState('');

  // Keep synced if domain changes externally unless user manually switched
  React.useEffect(() => {
    setCustomMilestones(getMilestonesForDomain(selectedDomainFilter));
  }, [selectedDomainFilter]);

  const domainConfig = RCSA_DOMAIN_CONFIGS[selectedDomainFilter] || RCSA_DOMAIN_CONFIGS[currentDomain];
  const renewalSummary = computeRenewalSummary(customMilestones);

  // Filtered milestones
  const filteredMilestones = customMilestones.filter((m) => {
    if (activeCategoryFilter === 'ALL') return true;
    if (activeCategoryFilter === 'RENEWALS') return m.isRenewalDate || m.category === 'RENEWAL_EXPIRATION';
    if (activeCategoryFilter === 'IN_PROGRESS') return m.status === 'IN_PROGRESS';
    if (activeCategoryFilter === 'CRITICAL') return m.criticality === 'CRITICAL' || m.status === 'CRITICAL_PATH';
    if (activeCategoryFilter === 'AUDITS') return m.category === 'AUDIT_MILESTONE' || m.category === 'REGULATORY_FILING';
    return true;
  });

  const toggleMilestoneStatus = (id: string) => {
    setCustomMilestones((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          const nextStatus: MilestoneStatus =
            m.status === 'COMPLETED'
              ? 'IN_PROGRESS'
              : m.status === 'IN_PROGRESS'
              ? 'COMPLETED'
              : 'IN_PROGRESS';
          const nextProgress = nextStatus === 'COMPLETED' ? 100 : nextStatus === 'IN_PROGRESS' ? 50 : 0;
          return { ...m, status: nextStatus, progressPct: nextProgress };
        }
        return m;
      })
    );
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const targetDateObj = new Date(newDate);
    const today = new Date('2026-08-16');
    const diffTime = targetDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const newMilestone: DomainMilestone = {
      id: `CUSTOM-MS-${Date.now().toString().slice(-4)}`,
      domain: selectedDomainFilter,
      title: newTitle.trim(),
      category: newCategory,
      phase: 'Custom Assessment Checkpoint',
      targetDate: newDate,
      renewalCycle: newCategory === 'RENEWAL_EXPIRATION' ? 'Annual Cycle' : 'Scheduled Milestone',
      status: 'UPCOMING',
      progressPct: 0,
      ownerRole: newOwner.trim() || 'Risk & Audit Team',
      deliverables: newDeliverable ? [newDeliverable.trim()] : ['Audit Evidence Package'],
      frameworkRef: 'NIST SP 800-53 Rev. 5 / Domain Baseline',
      description: `Targeted organizational milestone for ${selectedDomainFilter} risk governance cycle.`,
      criticality: newCriticality,
      daysRemaining: diffDays,
      isRenewalDate: newCategory === 'RENEWAL_EXPIRATION',
    };

    setCustomMilestones((prev) => [...prev, newMilestone].sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()));
    setIsAddModalOpen(false);
    setNewTitle('');
  };

  const handleExportSchedule = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(customMilestones, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `RCSA_${selectedDomainFilter}_Milestone_Timeline_2026.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getStatusBadge = (status: MilestoneStatus) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 border border-emerald-500/40 bg-emerald-950/40 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 border border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00]">
            <RefreshCw className="w-3 h-3 animate-spin" />
            IN PROGRESS
          </span>
        );
      case 'CRITICAL_PATH':
      case 'AT_RISK':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 border border-red-500/50 bg-red-950/40 text-red-400">
            <Flame className="w-3 h-3 text-red-500" />
            CRITICAL PATH
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 border border-amber-500/50 bg-amber-950/40 text-amber-400">
            <AlertTriangle className="w-3 h-3" />
            OVERDUE
          </span>
        );
      case 'UPCOMING':
      default:
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 border border-[#333333] bg-[#1a1a1a] text-[#888888]">
            <Clock className="w-3 h-3" />
            UPCOMING
          </span>
        );
    }
  };

  const getCategoryBadge = (category: MilestoneCategory, isRenewal?: boolean) => {
    if (isRenewal || category === 'RENEWAL_EXPIRATION') {
      return (
        <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 border border-cyan-500/50 bg-cyan-950/40 text-cyan-300">
          ★ ANNUAL RENEWAL
        </span>
      );
    }
    switch (category) {
      case 'AUDIT_MILESTONE':
        return (
          <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 border border-purple-500/40 bg-purple-950/30 text-purple-300">
            AUDIT CHECKPOINT
          </span>
        );
      case 'REGULATORY_FILING':
        return (
          <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 border border-amber-500/40 bg-amber-950/30 text-amber-300">
            REGULATORY FILING
          </span>
        );
      case 'REMEDIATION_DEADLINE':
        return (
          <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 border border-orange-500/40 bg-orange-950/30 text-orange-300">
            REMEDIATION SLA
          </span>
        );
      case 'ASSESSMENT_CYCLE':
      default:
        return (
          <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 border border-[#444444] bg-[#1e1e1e] text-[#aaaaaa]">
            ASSESSMENT STAGE
          </span>
        );
    }
  };

  return (
    <div className="border border-[#262626] bg-[#141414] text-white">
      {/* Header Bar */}
      <div className="p-5 sm:p-6 border-b border-[#222222] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 border border-[#333333] bg-black text-[#888888]">
              TIMELINE CADENCE ENGINE
            </span>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00]">
              DOMAIN: {selectedDomainFilter.toUpperCase()}
            </span>
            <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-emerald-500/40 bg-emerald-950/30 text-emerald-400">
              CADENCE: 2026-2027 CYCLE
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-syne font-bold uppercase tracking-tight text-white flex items-center gap-2.5">
            <Calendar className="w-6 h-6 text-[#f5ff00]" />
            <span>Assessment Milestones & Renewal Timeline</span>
          </h3>

          <p className="text-xs text-[#888888] font-sans max-w-3xl">
            Continuous compliance roadmap tracking statutory examination gates, third-party audit renewals, cryptographic rotation deadlines, and annual executive recertifications for <strong className="text-white font-semibold">{domainConfig?.title || selectedDomainFilter}</strong>.
          </p>
        </div>

        {/* Action Controls & Views */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Domain Quick Switcher */}
          <div className="flex items-center border border-[#333333] bg-black p-0.5 text-xs font-mono">
            {(['Privacy', 'Information Security', 'Cybersecurity', 'Governance', 'All'] as RCSADomainType[]).map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDomainFilter(d)}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                  selectedDomainFilter === d
                    ? 'bg-[#f5ff00] text-black'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                {d === 'Information Security' ? 'InfoSec' : d === 'Cybersecurity' ? 'Cyber' : d}
              </button>
            ))}
          </div>

          {/* View Mode Buttons */}
          <div className="flex items-center border border-[#333333] bg-black p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                viewMode === 'timeline' ? 'bg-[#222222] text-[#f5ff00] border border-[#f5ff00]/40' : 'text-[#888888] hover:text-white'
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                viewMode === 'calendar' ? 'bg-[#222222] text-[#f5ff00] border border-[#f5ff00]/40' : 'text-[#888888] hover:text-white'
              }`}
            >
              Horizon
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                viewMode === 'table' ? 'bg-[#222222] text-[#f5ff00] border border-[#f5ff00]/40' : 'text-[#888888] hover:text-white'
              }`}
            >
              Matrix
            </button>
          </div>

          {/* Add Milestone Trigger */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 border border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00] hover:bg-[#f5ff00] hover:text-black font-mono text-xs font-bold uppercase transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Milestone</span>
          </button>

          {/* Export Schedule */}
          <button
            onClick={handleExportSchedule}
            className="p-1.5 border border-[#333333] bg-[#1f1f1f] text-[#888888] hover:text-white hover:border-[#666666] transition"
            title="Export Timeline Schedule JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Renewal Status Hero Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-[#222222] bg-[#0d0d0d]">
        {/* Metric 1: Next Annual Renewal */}
        <div className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-[#222222] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#888888]">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>Next Renewal Deadline</span>
            </div>
            <div className="text-2xl sm:text-3xl font-syne font-extrabold text-white mt-1">
              {renewalSummary.daysUntilNextRenewal}{' '}
              <span className="text-xs font-mono font-normal text-cyan-400">DAYS REMAINING</span>
            </div>
            <div className="text-[11px] font-mono text-[#666666] mt-0.5 truncate max-w-[200px]" title={renewalSummary.nearestRenewalMilestone?.title}>
              {renewalSummary.nearestRenewalMilestone?.title || 'Annual Certification Renewal'}
            </div>
          </div>
          <div className="w-10 h-10 border border-cyan-500/30 bg-cyan-950/30 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold">
            {renewalSummary.nearestRenewalMilestone?.targetDate?.slice(5) || 'Q4'}
          </div>
        </div>

        {/* Metric 2: Active Cycle Progress */}
        <div className="p-4 sm:p-5 border-b sm:border-b-0 lg:border-r border-[#222222] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#888888]">
              <Target className="w-3.5 h-3.5 text-[#f5ff00]" />
              <span>Cycle Completion</span>
            </div>
            <div className="text-2xl sm:text-3xl font-syne font-extrabold text-[#f5ff00] mt-1">
              {renewalSummary.activeCycleCompletionPct}%
            </div>
            <div className="text-[11px] font-mono text-[#666666] mt-0.5">
              {customMilestones.filter((m) => m.status === 'COMPLETED').length} of {customMilestones.length} Milestones Cleared
            </div>
          </div>
          <div className="w-12 h-12 flex items-center justify-center">
            <div className="w-full bg-[#222222] h-2 relative">
              <div
                className="bg-[#f5ff00] h-2 transition-all"
                style={{ width: `${renewalSummary.activeCycleCompletionPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 3: Critical Path Checkpoints */}
        <div className="p-4 sm:p-5 border-b sm:border-b-0 sm:border-r border-[#222222] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#888888]">
              <Flame className="w-3.5 h-3.5 text-red-400" />
              <span>Critical Path Gates</span>
            </div>
            <div className="text-2xl sm:text-3xl font-syne font-extrabold text-white mt-1">
              {renewalSummary.criticalPathCount} <span className="text-xs font-mono font-normal text-red-400">GATES</span>
            </div>
            <div className="text-[11px] font-mono text-[#666666] mt-0.5">
              Mandatory Regulatory & Audit Gates
            </div>
          </div>
          <div className="w-10 h-10 border border-red-500/30 bg-red-950/30 flex items-center justify-center text-red-400 font-mono text-xs font-bold">
            P0
          </div>
        </div>

        {/* Metric 4: Framework Baseline */}
        <div className="p-4 sm:p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#888888]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Governing Standards</span>
            </div>
            <div className="text-sm font-mono font-bold text-white mt-1.5 uppercase">
              {selectedDomainFilter === 'Privacy'
                ? 'NIST Privacy + GDPR'
                : selectedDomainFilter === 'Information Security'
                ? 'ISO 27001 + NIST 800-53'
                : selectedDomainFilter === 'Cybersecurity'
                ? 'NIST CSF 2.0 + SOC 2'
                : 'NIST SP 800-53 Rev. 5'}
            </div>
            <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
              100% Traceability Mapped
            </div>
          </div>
          <div className="w-10 h-10 border border-emerald-500/30 bg-emerald-950/30 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold">
            SEC
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="px-5 py-3 border-b border-[#222222] bg-[#111111] flex items-center justify-between gap-3 flex-wrap text-xs font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[#666666] text-[11px] uppercase mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'RENEWALS', label: '★ Annual Renewals' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'CRITICAL', label: 'Critical Path' },
            { id: 'AUDITS', label: 'Audits & Filings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategoryFilter(tab.id)}
              className={`px-2.5 py-1 border text-[10px] font-bold uppercase transition ${
                activeCategoryFilter === tab.id
                  ? 'border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00]'
                  : 'border-[#2c2c2c] bg-[#181818] text-[#888888] hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-[11px] text-[#666666]">
          Showing {filteredMilestones.length} of {customMilestones.length} Milestones
        </div>
      </div>

      {/* VIEW MODE 1: CHRONOLOGICAL ROADMAP TIMELINE */}
      {viewMode === 'timeline' && (
        <div className="p-5 sm:p-8 space-y-6">
          <div className="relative pl-6 sm:pl-8 before:absolute before:left-[11px] sm:before:left-[15px] before:top-3 before:bottom-3 before:w-[2px] before:bg-[#262626]">
            {filteredMilestones.map((milestone, idx) => {
              const isPastOrPresent = milestone.progressPct > 0;
              const isCompleted = milestone.status === 'COMPLETED';
              const isCritical = milestone.criticality === 'CRITICAL';

              return (
                <div key={milestone.id} className="relative pb-8 last:pb-2 group">
                  {/* Timeline Node Bullet */}
                  <div
                    onClick={() => toggleMilestoneStatus(milestone.id)}
                    className={`absolute -left-[27px] sm:-left-[31px] top-1.5 w-6 h-6 sm:w-7 sm:h-7 border cursor-pointer flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'border-emerald-500 bg-emerald-950 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                        : isCritical
                        ? 'border-red-500 bg-red-950 text-red-400'
                        : isPastOrPresent
                        ? 'border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00] shadow-[0_0_8px_rgba(245,255,0,0.3)]'
                        : 'border-[#444444] bg-[#181818] text-[#777777] group-hover:border-white'
                    }`}
                    title="Click to toggle status"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <span className="font-mono text-[10px] font-bold">{idx + 1}</span>
                    )}
                  </div>

                  {/* Milestone Card Container */}
                  <div className={`border p-4 sm:p-5 transition ${
                    milestone.isRenewalDate
                      ? 'border-cyan-500/40 bg-gradient-to-r from-[#0e171b] to-[#141414]'
                      : isCompleted
                      ? 'border-emerald-500/30 bg-[#0d1611]'
                      : 'border-[#262626] bg-[#161616] hover:border-[#3a3a3a]'
                  }`}>
                    {/* Top Row: Phase, Date, Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#222222]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] uppercase font-bold text-[#888888]">
                          {milestone.phase}
                        </span>
                        <span className="text-[#333333]">•</span>
                        {getCategoryBadge(milestone.category, milestone.isRenewalDate)}
                        {getStatusBadge(milestone.status)}
                        {milestone.criticality === 'CRITICAL' && (
                          <span className="font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 border border-red-500/40 bg-red-950/30 text-red-400">
                            P0 CRITICAL
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 font-mono text-xs">
                        <div className="flex items-center gap-1 text-[#f5ff00] font-bold">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{milestone.targetDate}</span>
                        </div>
                        <span className="text-[#555555]">|</span>
                        <span className={milestone.daysRemaining <= 30 ? 'text-amber-400 font-bold' : 'text-[#888888]'}>
                          {milestone.daysRemaining > 0 ? `T-${milestone.daysRemaining}d` : 'DUE'}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Title & Description */}
                    <div className="pt-3 pb-2 space-y-1.5">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-base sm:text-lg font-syne font-bold text-white tracking-tight leading-snug">
                          {milestone.title}
                        </h4>
                        <span className="font-mono text-[11px] text-[#777777] shrink-0 border border-[#2a2a2a] px-1.5 py-0.5 bg-black">
                          {milestone.id}
                        </span>
                      </div>
                      <p className="text-xs text-[#999999] font-sans leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="py-2.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-[#888888] mb-1">
                        <span>Milestone Execution Progress</span>
                        <span className="font-bold text-white">{milestone.progressPct}%</span>
                      </div>
                      <div className="w-full bg-[#202020] h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isCompleted
                              ? 'bg-emerald-400'
                              : isCritical
                              ? 'bg-red-400'
                              : 'bg-[#f5ff00]'
                          }`}
                          style={{ width: `${milestone.progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Bottom Metadata & Deliverables */}
                    <div className="pt-3 border-t border-[#222222] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[#777777] text-[11px]">
                          <UserCheck className="w-3.5 h-3.5 text-[#aaaaaa]" />
                          <span>Owner: <strong className="text-white font-semibold">{milestone.ownerRole}</strong></span>
                          <span className="text-[#444444]">•</span>
                          <span>Ref: <span className="text-[#f5ff00]">{milestone.frameworkRef}</span></span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                          <FileCheck className="w-3 h-3 text-[#666666]" />
                          <span className="text-[#666666]">Deliverables:</span>
                          {milestone.deliverables.map((del, dIdx) => (
                            <span
                              key={dIdx}
                              className="px-1.5 py-0.5 border border-[#333333] bg-[#111111] text-[#cccccc]"
                            >
                              {del}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => toggleMilestoneStatus(milestone.id)}
                          className="px-2.5 py-1 border border-[#333333] hover:border-white text-[11px] text-[#aaaaaa] hover:text-white uppercase transition"
                        >
                          {isCompleted ? 'Re-open' : 'Mark Done'}
                        </button>
                        <button
                          onClick={() => onNavigateToStage('questionnaire')}
                          className="px-3 py-1 border border-[#f5ff00] bg-[#1a1a00] hover:bg-[#f5ff00] hover:text-black text-[#f5ff00] text-[11px] font-bold uppercase transition flex items-center gap-1"
                        >
                          <span>Evaluate Controls</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: QUARTERLY HORIZON & RENEWAL CALENDAR */}
      {viewMode === 'calendar' && (
        <div className="p-5 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Q3 2026 Box */}
            <div className="border border-[#333333] bg-[#121212] p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                <div>
                  <span className="font-mono text-[10px] text-[#f5ff00] font-bold uppercase tracking-widest">
                    CURRENT QUARTER
                  </span>
                  <h4 className="text-xl font-syne font-bold text-white">Q3 2026 (AUG - SEP)</h4>
                </div>
                <div className="px-2 py-1 bg-[#1c1c1c] border border-[#333333] text-[11px] font-mono text-[#f5ff00]">
                  ACTIVE
                </div>
              </div>

              <div className="space-y-3">
                {customMilestones
                  .filter((m) => m.targetDate.startsWith('2026-08') || m.targetDate.startsWith('2026-09'))
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-3 border border-[#222222] bg-[#181818] hover:border-[#444444] transition space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#f5ff00] font-bold">{m.targetDate}</span>
                        {getStatusBadge(m.status)}
                      </div>
                      <div className="text-xs font-bold text-white font-syne">{m.title}</div>
                      <div className="text-[10px] text-[#777777] font-mono">{m.ownerRole}</div>
                      <div className="w-full bg-[#111111] h-1">
                        <div className="bg-[#f5ff00] h-1" style={{ width: `${m.progressPct}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Q4 2026 Box (Annual Renewals & Certifications) */}
            <div className="border border-cyan-500/40 bg-[#0e1619] p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-cyan-500/20">
                <div>
                  <span className="font-mono text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
                    RENEWAL & ATTESTATION HORIZON
                  </span>
                  <h4 className="text-xl font-syne font-bold text-white">Q4 2026 (OCT - DEC)</h4>
                </div>
                <div className="px-2 py-1 bg-cyan-950/60 border border-cyan-500/50 text-[11px] font-mono text-cyan-300">
                  RENEWAL GATE
                </div>
              </div>

              <div className="space-y-3">
                {customMilestones
                  .filter((m) => m.targetDate.startsWith('2026-10') || m.targetDate.startsWith('2026-11') || m.targetDate.startsWith('2026-12'))
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-3 border border-cyan-500/30 bg-[#121c22] hover:border-cyan-400 transition space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-cyan-300 font-bold">{m.targetDate}</span>
                        {m.isRenewalDate && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-cyan-500 text-black uppercase">
                            ★ RENEWAL
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-white font-syne">{m.title}</div>
                      <div className="text-[10px] text-cyan-400/70 font-mono">T-{m.daysRemaining} days remaining</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Q1 2027 Box (Next Cycle & Continuous Monitoring) */}
            <div className="border border-[#333333] bg-[#121212] p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
                <div>
                  <span className="font-mono text-[10px] text-[#888888] font-bold uppercase tracking-widest">
                    FORWARD HORIZON
                  </span>
                  <h4 className="text-xl font-syne font-bold text-white">Q1 2027 (JAN - MAR)</h4>
                </div>
                <div className="px-2 py-1 bg-[#1c1c1c] border border-[#333333] text-[11px] font-mono text-[#888888]">
                  NEW CYCLE
                </div>
              </div>

              <div className="space-y-3">
                {customMilestones
                  .filter((m) => m.targetDate.startsWith('2027-'))
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-3 border border-[#222222] bg-[#181818] hover:border-[#444444] transition space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-[#888888] font-bold">{m.targetDate}</span>
                        {getStatusBadge(m.status)}
                      </div>
                      <div className="text-xs font-bold text-white font-syne">{m.title}</div>
                      <div className="text-[10px] text-[#777777] font-mono">{m.ownerRole}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 3: SYSTEMATIC CADENCE DATA TABLE */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-[#262626] bg-[#0f0f0f] text-[#888888]">
                <th className="py-3 px-4 uppercase font-bold">ID / Milestone Title</th>
                <th className="py-3 px-4 uppercase font-bold">Category</th>
                <th className="py-3 px-4 uppercase font-bold">Target Date</th>
                <th className="py-3 px-4 uppercase font-bold">SLA / Days</th>
                <th className="py-3 px-4 uppercase font-bold">Status</th>
                <th className="py-3 px-4 uppercase font-bold">Progress</th>
                <th className="py-3 px-4 uppercase font-bold">Owner Role</th>
                <th className="py-3 px-4 uppercase font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1e1e]">
              {filteredMilestones.map((m) => (
                <tr key={m.id} className="hover:bg-[#181818] transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm font-syne">{m.title}</div>
                    <div className="text-[10px] text-[#666666]">{m.id} • {m.frameworkRef}</div>
                  </td>
                  <td className="py-3.5 px-4">{getCategoryBadge(m.category, m.isRenewalDate)}</td>
                  <td className="py-3.5 px-4 font-bold text-[#f5ff00]">{m.targetDate}</td>
                  <td className="py-3.5 px-4 text-[#aaaaaa]">
                    {m.daysRemaining > 0 ? `${m.daysRemaining} days` : 'Due / Passed'}
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(m.status)}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-[#222222] h-1.5">
                        <div className="bg-[#f5ff00] h-1.5" style={{ width: `${m.progressPct}%` }} />
                      </div>
                      <span className="text-[11px] text-[#888888]">{m.progressPct}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-[#aaaaaa]">{m.ownerRole}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toggleMilestoneStatus(m.id)}
                      className="px-2 py-1 border border-[#333333] hover:border-white text-[10px] text-white uppercase"
                    >
                      Toggle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Quick Links to Stages */}
      <div className="p-4 sm:p-5 border-t border-[#222222] bg-[#0c0c0c] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#777777]">
          <span>Fast Execution Shortcuts:</span>
          <button
            onClick={() => onNavigateToStage('questionnaire')}
            className="text-white hover:text-[#f5ff00] underline"
          >
            Assessments
          </button>
          <span>•</span>
          <button
            onClick={() => onNavigateToStage('remediation')}
            className="text-white hover:text-[#f5ff00] underline"
          >
            Remediation Roadmap
          </button>
          <span>•</span>
          <button
            onClick={() => onNavigateToStage('signoff')}
            className="text-white hover:text-[#f5ff00] underline"
          >
            Formal Certification Signoff
          </button>
        </div>

        <div className="text-[11px] text-[#555555]">
          Domain Cadence Engine • Technoscope RCSA
        </div>
      </div>

      {/* Modal: Add Custom Milestone */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="border border-[#333333] bg-[#141414] text-white w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <h4 className="text-lg font-syne font-bold uppercase tracking-tight text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#f5ff00]" />
                <span>Add Organizational Milestone</span>
              </h4>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#888888] hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMilestone} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-[#888888] uppercase mb-1">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual ISO 27001 Surveillance Audit"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-black border border-[#333333] focus:border-[#f5ff00] px-3 py-2 text-white font-sans outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] uppercase mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-black border border-[#333333] focus:border-[#f5ff00] px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#888888] uppercase mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as MilestoneCategory)}
                    className="w-full bg-black border border-[#333333] focus:border-[#f5ff00] px-3 py-2 text-white outline-none"
                  >
                    <option value="ASSESSMENT_CYCLE">Assessment Stage</option>
                    <option value="RENEWAL_EXPIRATION">★ Annual Renewal / Expiration</option>
                    <option value="AUDIT_MILESTONE">Audit Checkpoint</option>
                    <option value="REGULATORY_FILING">Regulatory Filing</option>
                    <option value="REMEDIATION_DEADLINE">Remediation SLA</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#888888] uppercase mb-1">Owner Role</label>
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="e.g. CISO / Lead Assessor"
                    className="w-full bg-black border border-[#333333] focus:border-[#f5ff00] px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#888888] uppercase mb-1">Criticality</label>
                  <select
                    value={newCriticality}
                    onChange={(e) => setNewCriticality(e.target.value as any)}
                    className="w-full bg-black border border-[#333333] focus:border-[#f5ff00] px-3 py-2 text-white outline-none"
                  >
                    <option value="CRITICAL">P0 Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#888888] uppercase mb-1">Key Deliverable</label>
                <input
                  type="text"
                  value={newDeliverable}
                  onChange={(e) => setNewDeliverable(e.target.value)}
                  placeholder="e.g. Signed Assessment Report v2.0"
                  className="w-full bg-black border border-[#333333] focus:border-[#f5ff00] px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-[#333333] text-[#aaaaaa] hover:text-white uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#f5ff00] text-black hover:bg-yellow-300 font-bold uppercase shadow"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
