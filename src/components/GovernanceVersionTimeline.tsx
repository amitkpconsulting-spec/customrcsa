import React, { useState } from 'react';
import {
  History,
  GitCommit,
  RotateCcw,
  Trash2,
  Download,
  Shield,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Save,
  Search,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  FileText,
  Sliders,
  Check,
  Tag,
  Eye,
  Info,
  Flame,
} from 'lucide-react';
import { RCSAPayload, RCSAAssessmentVersion, AssessedControl } from '../types';
import { calculateVersionMetrics, computeSnapshotDelta } from '../utils/versionTracker';
import { SnapshotDeltaBadge } from './SnapshotDeltaBadge';

interface GovernanceVersionTimelineProps {
  assessment: RCSAPayload;
  onSaveSnapshot?: (versionTag: string, notes: string, author: string) => void;
  onRevertToVersion?: (versionId: string) => void;
  onDeleteSnapshot?: (versionId: string) => void;
}

export const GovernanceVersionTimeline: React.FC<GovernanceVersionTimelineProps> = ({
  assessment,
  onSaveSnapshot,
  onRevertToVersion,
  onDeleteSnapshot,
}) => {
  const versionHistory: RCSAAssessmentVersion[] = assessment.versionHistory || [];

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'high_activity' | 'milestones' | 'baselines'>('all');

  // Expanded inspection per card
  const [expandedSnapshotId, setExpandedSnapshotId] = useState<string | null>(null);
  const [onlyShowChangedInCard, setOnlyShowChangedInCard] = useState<Record<string, boolean>>({});

  // Modals / Confirmation Dialogs
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [restoreCandidate, setRestoreCandidate] = useState<RCSAAssessmentVersion | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<RCSAAssessmentVersion | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for creating snapshot
  const nextVerNum = (versionHistory.length || 0) + 1;
  const [newVersionTag, setNewVersionTag] = useState(`v${nextVerNum}.0 (Governance Signoff)`);
  const [newSnapshotNotes, setNewSnapshotNotes] = useState(
    'Formal governance audit checkpoint prior to executive committee presentation.'
  );
  const [newCreatedBy, setNewCreatedBy] = useState(
    assessment.organizationProfile.assessorName || 'Lead Governance Assessor'
  );

  // Current Live Assessment Metrics
  const currentMetrics = calculateVersionMetrics(
    assessment.controls,
    assessment.auditSignoff
  );

  // High activity snapshot counter for auditor filter
  const highActivityCount = versionHistory.filter((snap) => {
    const d = computeSnapshotDelta(snap, versionHistory);
    return (
      d.hasPrevious &&
      (d.activityLevel === 'high' || d.activityLevel === 'critical' || d.changedControlsCount >= 4)
    );
  }).length;

  // Filtered Snapshots
  const filteredSnapshots = versionHistory.filter((snap) => {
    const matchesSearch =
      snap.versionTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snap.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snap.changeSummary.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'baselines') return snap.isBaseline;
    if (filterType === 'milestones') return !snap.isBaseline;
    if (filterType === 'high_activity') {
      const d = computeSnapshotDelta(snap, versionHistory);
      return (
        d.hasPrevious &&
        (d.activityLevel === 'high' || d.activityLevel === 'critical' || d.changedControlsCount >= 4)
      );
    }
    return true;
  });

  // Handlers
  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveSnapshot) {
      onSaveSnapshot(newVersionTag.trim(), newSnapshotNotes.trim(), newCreatedBy.trim());
      setIsCreateModalOpen(false);
      setToastMessage(`Snapshot "${newVersionTag.trim()}" recorded to Governance ledger.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleConfirmRestore = () => {
    if (restoreCandidate && onRevertToVersion) {
      const tag = restoreCandidate.versionTag;
      onRevertToVersion(restoreCandidate.id);
      setRestoreCandidate(null);
      setToastMessage(`Assessment successfully restored to "${tag}". A safety backup was saved.`);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteCandidate && onDeleteSnapshot) {
      const tag = deleteCandidate.versionTag;
      onDeleteSnapshot(deleteCandidate.id);
      setDeleteCandidate(null);
      setToastMessage(`Snapshot "${tag}" deleted from version history ledger.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleExportSnapshotJSON = (snap: RCSAAssessmentVersion) => {
    const jsonStr = JSON.stringify(snap, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assessment.assessmentId}_${snap.versionTag.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-white font-sans animate-fadeIn">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-mono flex items-center gap-3 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner & Stats */}
      <div className="border border-[#262626] bg-[#141414] p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 border border-[#333333] bg-black text-[#888888]">
                AUDIT GOVERNANCE TIMELINE
              </span>
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00] flex items-center gap-1">
                <History className="w-3 h-3" />
                Active: {assessment.currentVersionTag || 'v2.0'}
              </span>
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-[#333333] bg-black text-[#aaaaaa]">
                {versionHistory.length} Recorded Snapshots
              </span>
            </div>
            <h3 className="text-xl font-syne font-bold uppercase tracking-tight text-white flex items-center gap-2">
              <History className="w-5 h-5 text-[#f5ff00]" />
              Regulatory Version History & Governance Audit Trail
            </h3>
            <p className="text-xs text-[#888888] max-w-2xl font-sans leading-relaxed">
              Chronological ledger tracking point-in-time assessment baselines, assessor authorship, remediation iterations, and attestation signoffs. Restore any historical state or prune outdated non-regulatory checkpoints.
            </p>
          </div>

          <button
            onClick={() => {
              setNewVersionTag(`v${versionHistory.length + 1}.0 (Governance Milestone)`);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#f5ff00] text-black hover:bg-yellow-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition shrink-0 shadow-[0_0_10px_rgba(245,255,0,0.2)] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>+ Record Audit Snapshot</span>
          </button>
        </div>

        {/* High-Level Version KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#262626] font-mono text-xs">
          <div className="p-3 bg-[#111111] border border-[#222222]">
            <div className="text-[10px] text-[#888888] uppercase">Active Ledger Version</div>
            <div className="text-base font-bold text-[#f5ff00] truncate">
              {assessment.currentVersionTag || 'v2.0'}
            </div>
          </div>
          <div className="p-3 bg-[#111111] border border-[#222222]">
            <div className="text-[10px] text-[#888888] uppercase">Current Residual Risk</div>
            <div className="text-base font-bold text-white">
              {currentMetrics.residualRisk} / 25
            </div>
          </div>
          <div className="p-3 bg-[#111111] border border-[#222222]">
            <div className="text-[10px] text-[#888888] uppercase">Control Maturity (CEF)</div>
            <div className="text-base font-bold text-emerald-400">
              {(currentMetrics.cefScore * 100).toFixed(0)}%
            </div>
          </div>
          <div className="p-3 bg-[#111111] border border-[#222222]">
            <div className="text-[10px] text-[#888888] uppercase">Total Historical Checkpoints</div>
            <div className="text-base font-bold text-white">
              {versionHistory.length} Snapshots
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-[#141414] border border-[#262626]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#666666]" />
          <input
            type="text"
            placeholder="Search by author, version tag, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-black border border-[#333333] text-xs font-mono text-white focus:border-[#f5ff00] outline-none"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto font-mono text-xs">
          <span className="text-[#888888] text-[11px]">Filter:</span>
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 uppercase text-[10px] font-bold border transition cursor-pointer ${
              filterType === 'all'
                ? 'border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00]'
                : 'border-[#333333] text-[#888888] hover:text-white'
            }`}
          >
            All ({versionHistory.length})
          </button>
          <button
            onClick={() => setFilterType('high_activity')}
            className={`px-3 py-1 uppercase text-[10px] font-bold border transition cursor-pointer flex items-center gap-1.5 ${
              filterType === 'high_activity'
                ? 'border-amber-500 bg-amber-950/60 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : 'border-[#333333] text-[#888888] hover:text-amber-300'
            }`}
            title="Filter to snapshots with high control churn (>= 4 controls modified)"
          >
            <Flame className="w-3 h-3 text-amber-400" />
            <span>High Activity ({highActivityCount})</span>
          </button>
          <button
            onClick={() => setFilterType('baselines')}
            className={`px-3 py-1 uppercase text-[10px] font-bold border transition cursor-pointer ${
              filterType === 'baselines'
                ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                : 'border-[#333333] text-[#888888] hover:text-white'
            }`}
          >
            Baselines ({versionHistory.filter((v) => v.isBaseline).length})
          </button>
          <button
            onClick={() => setFilterType('milestones')}
            className={`px-3 py-1 uppercase text-[10px] font-bold border transition cursor-pointer ${
              filterType === 'milestones'
                ? 'border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00]'
                : 'border-[#333333] text-[#888888] hover:text-white'
            }`}
          >
            Milestones ({versionHistory.filter((v) => !v.isBaseline).length})
          </button>
        </div>
      </div>

      {/* TIMELINE DISPLAY */}
      {filteredSnapshots.length === 0 ? (
        <div className="p-12 text-center border border-[#262626] bg-[#141414] space-y-3">
          <History className="w-8 h-8 text-[#666666] mx-auto" />
          <div className="text-sm font-bold text-white uppercase font-syne">No Snapshots Found</div>
          <p className="text-xs text-[#888888] max-w-md mx-auto">
            {searchTerm
              ? `No snapshots match your search "${searchTerm}".`
              : 'No assessment snapshots recorded in this view.'}
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-[#f5ff00] before:via-[#333333] before:to-transparent">
          {filteredSnapshots.map((snap, index) => {
            const isCurrentActive = snap.versionTag === assessment.currentVersionTag;
            const isExpanded = expandedSnapshotId === snap.id;
            const delta = computeSnapshotDelta(snap, versionHistory);
            const showOnlyChanged = !!onlyShowChangedInCard[snap.id];
            const changedIds = new Set(delta.changedControls.map((c) => c.controlId));

            const displayedControls = showOnlyChanged
              ? snap.snapshot.controls.filter((c) => changedIds.has(c.controlId))
              : snap.snapshot.controls;

            const formattedDate = new Date(snap.timestamp).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={snap.id}
                id={`timeline-snapshot-${snap.id}`}
                className={`relative border transition group ${
                  isCurrentActive
                    ? 'border-[#f5ff00] bg-[#161608]/40 shadow-[0_0_15px_rgba(245,255,0,0.06)]'
                    : 'border-[#262626] bg-[#141414] hover:border-[#383838]'
                }`}
              >
                {/* Timeline Connector Node */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-5 -translate-x-1/2 w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                    isCurrentActive
                      ? 'bg-black border-[#f5ff00] shadow-[0_0_8px_#f5ff00]'
                      : snap.isBaseline
                      ? 'bg-black border-blue-400 shadow-[0_0_8px_#38bdf8]'
                      : delta.activityLevel === 'high' || delta.activityLevel === 'critical'
                      ? 'bg-black border-amber-400 shadow-[0_0_8px_#f59e0b]'
                      : 'bg-black border-[#555555] group-hover:border-[#aaaaaa]'
                  }`}
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCurrentActive
                        ? 'bg-[#f5ff00]'
                        : snap.isBaseline
                        ? 'bg-blue-400'
                        : delta.activityLevel === 'high' || delta.activityLevel === 'critical'
                        ? 'bg-amber-400'
                        : 'bg-[#777777]'
                    }`}
                  />
                </div>

                {/* Card Container */}
                <div className="p-5 sm:p-6 space-y-4">
                  {/* Top Bar: Version Tag, Timestamp, Badges, & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#222222] pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-syne text-base font-bold uppercase tracking-tight text-white flex items-center gap-2">
                          <GitCommit className="w-4 h-4 text-[#f5ff00]" />
                          {snap.versionTag}
                        </span>

                        {isCurrentActive && (
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-[#f5ff00] text-black tracking-wider uppercase shadow-[0_0_6px_rgba(245,255,0,0.4)]">
                            Active State
                          </span>
                        )}

                        {snap.isBaseline && (
                          <span className="px-2 py-0.5 text-[9px] font-mono font-bold bg-blue-950 border border-blue-600 text-blue-300 uppercase">
                            Baseline
                          </span>
                        )}

                        {/* Delta Indicator next to snapshot */}
                        <SnapshotDeltaBadge delta={delta} />

                        <span className="text-[10px] font-mono text-[#666666] px-1.5 py-0.5 bg-black border border-[#2a2a2a]">
                          ID: {snap.id}
                        </span>
                      </div>

                      {/* Author & Timestamp Bar */}
                      <div className="flex items-center gap-3 text-xs font-mono text-[#aaaaaa] flex-wrap pt-0.5">
                        <div className="flex items-center gap-1.5 text-white">
                          <User className="w-3.5 h-3.5 text-[#f5ff00]" />
                          <span className="font-bold">{snap.author}</span>
                        </div>
                        <span className="text-[#444444]">•</span>
                        <div className="flex items-center gap-1.5 text-[#888888]">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formattedDate}</span>
                        </div>
                        <span className="text-[#444444]">•</span>
                        <div className="flex items-center gap-1 text-[#888888]">
                          <Shield className="w-3 h-3 text-emerald-400" />
                          <span className="uppercase text-[10px]">{snap.metrics.auditStatus}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Restore & Delete */}
                    <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                      {/* Restore Action Button */}
                      <button
                        onClick={() => setRestoreCandidate(snap)}
                        className="px-3 py-1.5 bg-[#1c1c1c] border border-amber-500/80 hover:bg-amber-500 hover:text-black text-amber-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                        title="Restore the assessment to this exact point-in-time version"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restore</span>
                      </button>

                      {/* Delete Action Button */}
                      <button
                        onClick={() => setDeleteCandidate(snap)}
                        className="px-3 py-1.5 bg-[#1c1c1c] border border-rose-600/70 hover:bg-rose-600 hover:text-white text-rose-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer shadow-[0_0_8px_rgba(244,63,94,0.1)]"
                        title="Permanently remove this snapshot from version history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>

                      {/* Export Snapshot JSON */}
                      <button
                        onClick={() => handleExportSnapshotJSON(snap)}
                        className="p-1.5 bg-[#1c1c1c] border border-[#333333] hover:border-[#38bdf8] text-[#888888] hover:text-[#38bdf8] transition cursor-pointer"
                        title="Download raw snapshot JSON payload"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {/* Expand / Inspect Controls Toggle */}
                      <button
                        onClick={() => setExpandedSnapshotId(isExpanded ? null : snap.id)}
                        className="p-1.5 bg-[#1c1c1c] border border-[#333333] hover:border-[#f5ff00] text-[#888888] hover:text-[#f5ff00] transition cursor-pointer"
                        title={isExpanded ? 'Collapse inspection' : 'Inspect snapshot controls'}
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* High-Activity Period Alert Banner */}
                  {delta.hasPrevious && (delta.activityLevel === 'high' || delta.activityLevel === 'critical') && (
                    <div className="p-3 bg-gradient-to-r from-amber-950/40 via-amber-950/20 to-black border-l-2 border-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono">
                      <div className="flex items-center gap-2.5">
                        <span className="p-1.5 bg-amber-500/20 text-amber-400 shrink-0">
                          <Flame className="w-4 h-4 animate-pulse" />
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold uppercase tracking-wider text-amber-300 text-[11px]">
                              High-Activity Audit Period Detected:
                            </span>
                            <span className="text-[10px] bg-amber-500 text-black font-extrabold px-1.5 py-0.2 uppercase">
                              {delta.changedControlsCount} Controls Changed ({delta.percentChanged}% Scope Delta)
                            </span>
                          </div>
                          <div className="text-[11px] text-[#aaaaaa] font-sans pt-0.5">
                            Major control recalibration recorded against previous checkpoint{' '}
                            <strong className="text-white">{delta.previousVersionTag}</strong>.
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[11px]">
                        <span className="px-2 py-0.5 bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 font-bold">
                          +{delta.improvedControlsCount} Improved
                        </span>
                        {delta.regressedControlsCount > 0 && (
                          <span className="px-2 py-0.5 bg-rose-950/80 border border-rose-700/80 text-rose-300 font-bold">
                            +{delta.regressedControlsCount} Regressed
                          </span>
                        )}
                        <span className="text-[#888888] hidden md:inline">
                          Residual:{' '}
                          <strong
                            className={
                              delta.residualDelta < 0
                                ? 'text-emerald-400'
                                : delta.residualDelta > 0
                                ? 'text-rose-400'
                                : 'text-zinc-400'
                            }
                          >
                            {delta.residualDelta < 0 ? '' : '+'}
                            {delta.residualDelta}
                          </strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Descriptive Notes Block */}
                  <div className="p-3.5 bg-black/60 border border-[#222222] space-y-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#666666] flex items-center gap-1">
                      <FileText className="w-3 h-3 text-[#f5ff00]" />
                      Descriptive Notes & Change Summary:
                    </div>
                    <p className="text-xs text-[#d1d5db] font-sans leading-relaxed">
                      {snap.changeSummary || 'Point-in-time regulatory assessment snapshot.'}
                    </p>
                  </div>

                  {/* Key Quantitative Posture Metrics in this snapshot */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                    <div className="p-2.5 bg-[#111111] border border-[#222222] flex flex-col justify-between">
                      <span className="text-[9px] uppercase text-[#888888]">Residual Risk Score</span>
                      <div className="text-sm font-bold text-white pt-1">
                        {snap.metrics.residualRisk} <span className="text-[10px] text-[#666666]">/ 25</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#111111] border border-[#222222] flex flex-col justify-between">
                      <span className="text-[9px] uppercase text-[#888888]">Control Maturity (CEF)</span>
                      <div className="text-sm font-bold text-[#f5ff00] pt-1">
                        {(snap.metrics.cefScore * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#111111] border border-[#222222] flex flex-col justify-between">
                      <span className="text-[9px] uppercase text-[#888888]">Deficiencies (Crit / High)</span>
                      <div className="text-sm font-bold pt-1">
                        <span className="text-rose-400">{snap.metrics.criticalDeficiencies}</span>
                        <span className="text-[#555555]"> / </span>
                        <span className="text-amber-400">{snap.metrics.highDeficiencies}</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-[#111111] border border-[#222222] flex flex-col justify-between">
                      <span className="text-[9px] uppercase text-[#888888]">Controls Evaluated</span>
                      <div className="text-sm font-bold text-white pt-1">
                        {snap.metrics.assessedControls} <span className="text-[10px] text-[#666666]">/ {snap.metrics.totalControls}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Controls Inspector for this snapshot */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#262626] space-y-3 font-mono text-xs animate-fadeIn">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[#888888]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold uppercase tracking-wider text-[11px] text-[#cccccc]">
                            Control Matrix Preview ({displayedControls.length} Controls)
                          </span>
                          {delta.hasPrevious && delta.changedControlsCount > 0 && (
                            <span className="text-[10px] text-amber-300 font-bold px-1.5 py-0.5 bg-amber-950/40 border border-amber-600/50">
                              {delta.changedControlsCount} delta modifications vs {delta.previousVersionTag}
                            </span>
                          )}
                        </div>

                        {/* Toggle between All Controls and Only Changed Controls */}
                        {delta.hasPrevious && delta.changedControlsCount > 0 && (
                          <div className="flex items-center gap-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() =>
                                setOnlyShowChangedInCard((prev) => ({
                                  ...prev,
                                  [snap.id]: false,
                                }))
                              }
                              className={`px-2 py-0.5 border cursor-pointer ${
                                !showOnlyChanged
                                  ? 'bg-[#262626] border-[#f5ff00] text-[#f5ff00] font-bold'
                                  : 'border-[#333333] text-[#888888] hover:text-white'
                              }`}
                            >
                              All Controls ({snap.snapshot.controls.length})
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setOnlyShowChangedInCard((prev) => ({
                                  ...prev,
                                  [snap.id]: true,
                                }))
                              }
                              className={`px-2 py-0.5 border cursor-pointer flex items-center gap-1 ${
                                showOnlyChanged
                                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 font-bold'
                                  : 'border-[#333333] text-[#888888] hover:text-amber-300'
                              }`}
                            >
                              <Flame className="w-2.5 h-2.5 text-amber-400" />
                              <span>Only Changed ({delta.changedControlsCount})</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="max-h-60 overflow-y-auto border border-[#262626] bg-black">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead className="bg-[#181818] text-[#888888] sticky top-0 border-b border-[#262626]">
                            <tr>
                              <th className="p-2">ID</th>
                              <th className="p-2">Title</th>
                              <th className="p-2 text-center">Status</th>
                              <th className="p-2 text-center">Residual</th>
                              <th className="p-2 text-center">CEF</th>
                              {delta.hasPrevious && <th className="p-2 text-right">Delta Shift</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#222222]">
                            {displayedControls.map((c) => {
                              const changedDetail = delta.changedControls.find(
                                (cd) => cd.controlId === c.controlId
                              );
                              const isChanged = !!changedDetail;

                              return (
                                <tr
                                  key={c.controlId}
                                  className={`hover:bg-[#161616] ${
                                    isChanged ? 'bg-[#181507]/40' : ''
                                  }`}
                                >
                                  <td className="p-2 font-bold text-[#f5ff00]">
                                    <div className="flex items-center gap-1.5">
                                      <span>{c.controlId}</span>
                                      {isChanged && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-2 text-[#cccccc] truncate max-w-xs">
                                    <div>{c.title}</div>
                                    {changedDetail && (
                                      <div className="text-[9px] text-[#888888] font-mono">
                                        {changedDetail.changeDescription}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-2 text-center">
                                    <span
                                      className={`px-1.5 py-0.2 text-[9px] uppercase font-bold ${
                                        c.status === 'CRITICAL_DEFICIENCY'
                                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                          : c.status === 'NEEDS_ATTENTION'
                                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      }`}
                                    >
                                      {c.status.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td className="p-2 text-center text-white">{c.residualRisk.toFixed(1)}</td>
                                  <td className="p-2 text-center text-[#aaaaaa]">
                                    {(c.calculatedCEF * 100).toFixed(0)}%
                                  </td>
                                  {delta.hasPrevious && (
                                    <td className="p-2 text-right font-mono text-[10px]">
                                      {changedDetail ? (
                                        <span
                                          className={`font-bold px-1 py-0.2 ${
                                            changedDetail.changeType === 'improved'
                                              ? 'text-emerald-400'
                                              : changedDetail.changeType === 'regressed'
                                              ? 'text-rose-400'
                                              : 'text-amber-400'
                                          }`}
                                        >
                                          {changedDetail.changeType.toUpperCase()}
                                        </span>
                                      ) : (
                                        <span className="text-[#555555]">—</span>
                                      )}
                                    </td>
                                  )}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RESTORE CONFIRMATION MODAL */}
      {restoreCandidate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border-2 border-amber-500 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleUp font-mono text-xs">
            <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
              <h3 className="text-base font-syne font-bold uppercase text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                Confirm Assessment Restore
              </h3>
              <button
                onClick={() => setRestoreCandidate(null)}
                className="text-[#888888] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-950/30 border border-amber-700/60 text-amber-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                Target Restore: {restoreCandidate.versionTag}
              </div>
              <div className="text-[11px] text-amber-300/80">
                Author: {restoreCandidate.author} • Created: {new Date(restoreCandidate.timestamp).toLocaleString()}
              </div>
            </div>

            <p className="text-[#aaaaaa] leading-relaxed font-sans text-xs">
              Restoring this snapshot will set the active RCSA controls, risk metrics, and signoff status back to this point in time. 
              <strong> A safety auto-backup of your current state will be preserved automatically.</strong>
            </p>

            <div className="grid grid-cols-3 gap-2 p-3 bg-black border border-[#333333] text-center">
              <div>
                <div className="text-[9px] text-[#888888] uppercase">Residual Risk</div>
                <div className="text-sm font-bold text-white">
                  {currentMetrics.residualRisk} &rarr; <span className="text-amber-400">{restoreCandidate.metrics.residualRisk}</span>
                </div>
              </div>
              <div>
                <div className="text-[9px] text-[#888888] uppercase">CEF Factor</div>
                <div className="text-sm font-bold text-white">
                  {(currentMetrics.cefScore * 100).toFixed(0)}% &rarr; <span className="text-amber-400">{(restoreCandidate.metrics.cefScore * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div>
                <div className="text-[9px] text-[#888888] uppercase">Critical Gaps</div>
                <div className="text-sm font-bold text-white">
                  {currentMetrics.criticalDeficiencies} &rarr; <span className="text-amber-400">{restoreCandidate.metrics.criticalDeficiencies}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setRestoreCandidate(null)}
                className="px-4 py-2 border border-[#333333] text-[#888888] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-5 py-2 bg-amber-500 text-black font-bold hover:bg-amber-400 flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Restore</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border-2 border-rose-600 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleUp font-mono text-xs">
            <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
              <h3 className="text-base font-syne font-bold uppercase text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                Delete Snapshot from History
              </h3>
              <button
                onClick={() => setDeleteCandidate(null)}
                className="text-[#888888] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-rose-950/30 border border-rose-700/60 text-rose-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                Snapshot: {deleteCandidate.versionTag}
              </div>
              <div className="text-[11px] text-rose-300/80">
                Author: {deleteCandidate.author} • Timestamp: {new Date(deleteCandidate.timestamp).toLocaleString()}
              </div>
            </div>

            <p className="text-[#aaaaaa] leading-relaxed font-sans text-xs">
              Are you sure you want to delete this snapshot entry? This will permanently remove it from the RCSA Version History ledger and cannot be undone.
            </p>

            {deleteCandidate.versionTag === assessment.currentVersionTag && (
              <div className="p-2.5 bg-yellow-950/40 border border-yellow-700/60 text-yellow-300 text-[11px] flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>Notice: This snapshot is currently tagged as the active version. Deleting it will re-index your active tag.</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setDeleteCandidate(null)}
                className="px-4 py-2 border border-[#333333] text-[#888888] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 text-white font-bold hover:bg-rose-500 flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.3)]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SNAPSHOT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border-2 border-[#f5ff00] max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleUp font-mono text-xs">
            <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
              <h3 className="text-base font-syne font-bold uppercase text-white flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#f5ff00]" />
                Record Governance Audit Snapshot
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#888888] hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-4">
              <div>
                <label className="text-[11px] uppercase font-bold text-[#aaaaaa] block mb-1">
                  Version Tag / Label:
                </label>
                <input
                  type="text"
                  value={newVersionTag}
                  onChange={(e) => setNewVersionTag(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  placeholder="e.g. v3.0 (CISO Annual Audit Attestation)"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-[#aaaaaa] block mb-1">
                  Author / Assessor Name:
                </label>
                <input
                  type="text"
                  value={newCreatedBy}
                  onChange={(e) => setNewCreatedBy(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-[#aaaaaa] block mb-1">
                  Descriptive Notes & Audit Rationale:
                </label>
                <textarea
                  rows={3}
                  value={newSnapshotNotes}
                  onChange={(e) => setNewSnapshotNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none resize-none"
                  placeholder="Summarize key audit signoffs, control calibrations, or regulatory findings..."
                  required
                />
              </div>

              {/* Quick Note Presets */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-[#666666]">Quick Presets:</span>
                {[
                  'CISO Audit Signoff',
                  'Post-Remediation Verification',
                  'Board Governance Dossier',
                  'Annual Regulatory Baseline',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setNewSnapshotNotes(preset)}
                    className="px-2 py-0.5 text-[10px] bg-[#1a1a1a] border border-[#333333] hover:border-[#f5ff00] text-[#cccccc] hover:text-[#f5ff00] transition cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-[#1c1c1c] border border-[#333333] space-y-1.5 text-[11px]">
                <div className="text-[#888888] font-bold">STATE TO BE PRESERVED:</div>
                <div className="grid grid-cols-3 gap-2 text-white">
                  <div>
                    Residual: <span className="text-[#f5ff00] font-bold">{currentMetrics.residualRisk}/25</span>
                  </div>
                  <div>
                    CEF: <span className="text-[#f5ff00] font-bold">{(currentMetrics.cefScore * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    Controls: <span className="text-white font-bold">{currentMetrics.totalControls}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-[#333333] text-[#888888] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#f5ff00] text-black font-bold hover:bg-yellow-300 shadow-[0_0_10px_rgba(245,255,0,0.3)] cursor-pointer"
                >
                  Save Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
