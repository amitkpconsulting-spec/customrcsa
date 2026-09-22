import React, { useState } from 'react';
import {
  History,
  GitCommit,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Shield,
  Clock,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Save,
  Trash2,
  GitCompare,
  RotateCcw,
  Download,
  Check,
  Filter,
} from 'lucide-react';
import { RCSAPayload, RCSAAssessmentVersion, AssessedControl } from '../types';
import {
  compareAssessmentWithSnapshot,
  calculateVersionMetrics,
  computeSnapshotDelta,
} from '../utils/versionTracker';
import { SnapshotDeltaBadge } from './SnapshotDeltaBadge';

interface VersionHistorySectionProps {
  assessment: RCSAPayload;
  onNavigateToStage: (stage: any) => void;
  onSaveSnapshot?: (versionTag: string, notes: string, author: string) => void;
  onRevertToVersion?: (versionId: string) => void;
  onDeleteSnapshot?: (versionId: string) => void;
}

export const VersionHistorySection: React.FC<VersionHistorySectionProps> = ({
  assessment,
  onNavigateToStage,
  onSaveSnapshot,
  onRevertToVersion,
  onDeleteSnapshot,
}) => {
  const versionHistory: RCSAAssessmentVersion[] = assessment.versionHistory || [];

  // Selected snapshot for comparison
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(
    versionHistory[0]?.id || ''
  );

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [revertingSnapshot, setRevertingSnapshot] = useState<RCSAAssessmentVersion | null>(null);
  const [deletingSnapshot, setDeletingSnapshot] = useState<RCSAAssessmentVersion | null>(null);
  const [showOnlyChangedControls, setShowOnlyChangedControls] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for creating snapshot
  const nextVerNum = (versionHistory.length || 0) + 1;
  const [newVersionTag, setNewVersionTag] = useState(`v${nextVerNum}.0 (Audit Milestone)`);
  const [newSnapshotNotes, setNewSnapshotNotes] = useState(
    'Point-in-time audit checkpoint after control remediation and evidence review.'
  );
  const [newCreatedBy, setNewCreatedBy] = useState(
    assessment.organizationProfile.assessorName || 'Lead Risk Assessor'
  );

  // Current Assessment Live Metrics
  const currentMetrics = calculateVersionMetrics(
    assessment.controls,
    assessment.auditSignoff
  );

  // Selected snapshot for comparison
  const compareSnapshot =
    versionHistory.find((s) => s.id === selectedSnapshotId) || versionHistory[0];

  // Control Diffs
  const controlDiffs = compareSnapshot
    ? compareAssessmentWithSnapshot(assessment.controls, compareSnapshot.snapshot.controls)
    : [];

  const changedControls = controlDiffs.filter((d) => d.hasChanged);
  const displayedDiffs = showOnlyChangedControls ? changedControls : controlDiffs;

  // Calculate Deltas
  const residualDelta = compareSnapshot
    ? Number((currentMetrics.residualRisk - compareSnapshot.metrics.residualRisk).toFixed(1))
    : 0;

  const cefDelta = compareSnapshot
    ? Number(
        ((currentMetrics.cefScore - compareSnapshot.metrics.cefScore) * 100).toFixed(0)
      )
    : 0;

  const criticalDelta = compareSnapshot
    ? currentMetrics.criticalDeficiencies - compareSnapshot.metrics.criticalDeficiencies
    : 0;

  // Trigger Save Snapshot
  const handleCreateSnapshotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveSnapshot) {
      onSaveSnapshot(newVersionTag.trim(), newSnapshotNotes.trim(), newCreatedBy.trim());
      setIsCreateModalOpen(false);
      setToastMessage(`Snapshot "${newVersionTag.trim()}" successfully recorded to RCSA version tracker.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Trigger Revert
  const handleConfirmRevert = () => {
    if (revertingSnapshot && onRevertToVersion) {
      const tag = revertingSnapshot.versionTag;
      onRevertToVersion(revertingSnapshot.id);
      setRevertingSnapshot(null);
      setToastMessage(`Assessment successfully reverted to "${tag}". A pre-revert safety backup was saved.`);
      setTimeout(() => setToastMessage(null), 5000);
    }
  };

  // Trigger Delete
  const handleConfirmDelete = () => {
    if (deletingSnapshot && onDeleteSnapshot) {
      const tag = deletingSnapshot.versionTag;
      onDeleteSnapshot(deletingSnapshot.id);
      setDeletingSnapshot(null);
      setToastMessage(`Snapshot "${tag}" deleted from version history.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  // Export Version History Ledger JSON
  const handleExportHistoryJSON = () => {
    const exportData = {
      assessmentId: assessment.assessmentId,
      assessmentName: assessment.assessmentName,
      exportedAt: new Date().toISOString(),
      currentVersionTag: assessment.currentVersionTag,
      totalSnapshots: versionHistory.length,
      versionHistory: versionHistory,
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assessment.assessmentId}_RCSA_Version_History_Ledger.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export Single Snapshot JSON
  const handleExportSingleSnapshot = (snap: RCSAAssessmentVersion) => {
    const jsonStr = JSON.stringify(snap, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assessment.assessmentId}_${snap.versionTag.replace(/[^a-zA-Z0-9]/g, '_')}_Snapshot.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-mono flex items-center gap-3 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Version Header Banner */}
      <div className="border border-[#262626] bg-[#141414] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 border border-[#333333] bg-black text-[#888888]">
              RCSA OBJECT VERSION TRACKER
            </span>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00] flex items-center gap-1">
              <History className="w-3 h-3" />
              {assessment.currentVersionTag || 'v2.0 (Active Working Copy)'}
            </span>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-[#333333] bg-black text-[#aaaaaa]">
              {versionHistory.length} SNAPSHOTS IN LEDGER
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-syne font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-[#f5ff00]" />
            RCSA Assessment Version History & Rollback Ledger
          </h2>
          <p className="text-xs text-[#888888] max-w-2xl font-sans leading-relaxed">
            Every snapshot encapsulates an immutable copy of all NIST controls, risk calibrations, evidence links, and CISO signoffs. Save checkpoints or revert to any prior state with automated safety backups.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={handleExportHistoryJSON}
            className="px-3.5 py-2.5 bg-[#222222] border border-[#333333] hover:border-[#38bdf8] hover:text-[#38bdf8] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
            title="Download full RCSA Version History Ledger as JSON"
          >
            <Download className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Export Ledger</span>
          </button>

          <button
            onClick={() => {
              setNewVersionTag(`v${versionHistory.length + 1}.0 (Audit Checkpoint)`);
              setIsCreateModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#f5ff00] text-black hover:bg-yellow-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition shrink-0 shadow-[0_0_10px_rgba(245,255,0,0.2)] cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>+ Save Current Snapshot</span>
          </button>
        </div>
      </div>

      {/* CREATE SNAPSHOT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border-2 border-[#f5ff00] max-w-lg w-full p-6 space-y-6 shadow-2xl animate-scaleUp">
            <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
              <h3 className="text-base font-syne font-bold uppercase text-white flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#f5ff00]" />
                Save New Assessment Snapshot
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#888888] hover:text-white font-mono text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSnapshotSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-[11px] uppercase font-bold text-[#aaaaaa] block mb-1">
                  Version Tag (e.g., v2.1 Remediation Milestone):
                </label>
                <input
                  type="text"
                  value={newVersionTag}
                  onChange={(e) => setNewVersionTag(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
                  placeholder="e.g. v2.1 (Post-Remediation Verification)"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] uppercase font-bold text-[#aaaaaa] block mb-1">
                  Assessor / Author Name:
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
                  Version Notes & Change Summary:
                </label>
                <textarea
                  rows={3}
                  value={newSnapshotNotes}
                  onChange={(e) => setNewSnapshotNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none resize-none"
                  placeholder="Describe key safeguard remediations, evidence updates, or audit milestones recorded in this snapshot..."
                />
              </div>

              {/* Snapshot Preset Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-[#666666]">Quick Notes:</span>
                {[
                  'Remediation Sprint Review',
                  'Quarterly CISO Signoff',
                  'Pre-Audit Baseline',
                  'Zero Trust Calibration',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setNewSnapshotNotes(chip)}
                    className="px-2 py-0.5 text-[10px] bg-[#1a1a1a] border border-[#333333] hover:border-[#f5ff00] text-[#cccccc] hover:text-[#f5ff00] transition cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-[#1c1c1c] border border-[#333333] space-y-1.5 text-[11px]">
                <div className="text-[#888888] font-bold">METRICS TO BE CAPTURED IN SNAPSHOT:</div>
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
                  Confirm & Save Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVERT TO VERSION CONFIRMATION MODAL */}
      {revertingSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border-2 border-amber-500 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleUp">
            <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
              <h3 className="text-base font-syne font-bold uppercase text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                Revert Assessment to Historical Version
              </h3>
              <button
                onClick={() => setRevertingSnapshot(null)}
                className="text-[#888888] hover:text-white font-mono text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs text-[#cccccc]">
              <div className="p-3 bg-amber-950/30 border border-amber-700/60 text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  Target Version: {revertingSnapshot.versionTag}
                </div>
                <div className="text-[11px] text-amber-300/80">
                  Author: {revertingSnapshot.author} • Timestamp: {new Date(revertingSnapshot.timestamp).toLocaleString()}
                </div>
              </div>

              <p className="text-xs leading-relaxed text-[#aaaaaa]">
                Reverting will replace the current active assessment controls, CEF factors, evidence attachments, and signoff statuses with the exact state captured in this snapshot.
              </p>

              {/* Comparative impact */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-black border border-[#333333] text-center">
                <div>
                  <div className="text-[9px] text-[#888888] uppercase">Residual Risk</div>
                  <div className="text-sm font-bold text-white">
                    {currentMetrics.residualRisk} &rarr; <span className="text-amber-400">{revertingSnapshot.metrics.residualRisk}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-[#888888] uppercase">CEF Factor</div>
                  <div className="text-sm font-bold text-white">
                    {(currentMetrics.cefScore * 100).toFixed(0)}% &rarr; <span className="text-amber-400">{(revertingSnapshot.metrics.cefScore * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-[#888888] uppercase">Critical Gaps</div>
                  <div className="text-sm font-bold text-white">
                    {currentMetrics.criticalDeficiencies} &rarr; <span className="text-amber-400">{revertingSnapshot.metrics.criticalDeficiencies}</span>
                  </div>
                </div>
              </div>

              {/* Safety Auto-Backup Assurance */}
              <div className="p-3 bg-[#111111] border border-[#2a2a2a] text-[11px] text-[#888888] flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Safety Auto-Backup:</strong> Technoscope will automatically capture a timestamped safety backup of your current working copy in the version ledger before applying the rollback.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setRevertingSnapshot(null)}
                className="px-4 py-2 border border-[#333333] text-[#888888] hover:text-white cursor-pointer font-mono text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevert}
                className="px-5 py-2 bg-amber-500 text-black font-bold font-mono text-xs hover:bg-amber-400 flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm & Revert Assessment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE SNAPSHOT CONFIRMATION MODAL */}
      {deletingSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border-2 border-rose-600 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleUp font-mono text-xs">
            <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
              <h3 className="text-base font-syne font-bold uppercase text-white flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                Delete Snapshot from History
              </h3>
              <button
                onClick={() => setDeletingSnapshot(null)}
                className="text-[#888888] hover:text-white cursor-pointer font-mono"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-rose-950/30 border border-rose-700/60 text-rose-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                Snapshot: {deletingSnapshot.versionTag}
              </div>
              <div className="text-[11px] text-rose-300/80">
                Author: {deletingSnapshot.author} • Recorded: {new Date(deletingSnapshot.timestamp).toLocaleString()}
              </div>
            </div>

            <p className="text-[#aaaaaa] leading-relaxed font-sans text-xs">
              Are you sure you want to delete this snapshot entry? This will remove it from the historical ledger and comparison engine.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => setDeletingSnapshot(null)}
                className="px-4 py-2 border border-[#333333] text-[#888888] hover:text-white cursor-pointer font-mono text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 text-white font-bold font-mono text-xs hover:bg-rose-500 flex items-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.3)]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Comparison Controls */}
      <div className="border border-[#262626] bg-[#141414] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
          <div>
            <span className="font-mono text-[10px] text-[#f5ff00] uppercase tracking-wider font-bold block">
              POINT-IN-TIME DIFF ENGINE
            </span>
            <h3 className="text-base font-syne font-bold uppercase text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#f5ff00]" />
              Compare Current Assessment Against Historical Snapshot
            </h3>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono text-[#888888]">Baseline Snapshot:</span>
            <select
              value={selectedSnapshotId}
              onChange={(e) => setSelectedSnapshotId(e.target.value)}
              className="px-3.5 py-2 text-xs font-mono border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none cursor-pointer"
            >
              {versionHistory.map((snap) => (
                <option key={snap.id} value={snap.id}>
                  {snap.versionTag} ({new Date(snap.timestamp).toLocaleDateString()})
                </option>
              ))}
            </select>
            {compareSnapshot && (
              <SnapshotDeltaBadge
                delta={computeSnapshotDelta(compareSnapshot, versionHistory)}
                size="sm"
              />
            )}
          </div>
        </div>

        {/* Delta Comparison Scorecards */}
        {compareSnapshot && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {/* Metric 1: Residual Risk Delta */}
            <div className="p-5 border border-[#262626] bg-[#111111] space-y-2">
              <div className="text-[10px] uppercase text-[#888888]">Residual Risk Posture</div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-white">{currentMetrics.residualRisk} / 25</div>
                <div className="text-xs text-[#777777]">vs {compareSnapshot.metrics.residualRisk}</div>
              </div>
              <div className="pt-2 border-t border-[#222222] flex items-center gap-1.5 text-xs">
                {residualDelta < 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    ↓ {Math.abs(residualDelta)} Net Reduction ({Math.abs(Math.round((residualDelta / (compareSnapshot.metrics.residualRisk || 1)) * 100))}%)
                  </span>
                ) : residualDelta > 0 ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    ↑ +{residualDelta} Risk Increase
                  </span>
                ) : (
                  <span className="text-[#888888]">Identical risk (0.0)</span>
                )}
              </div>
            </div>

            {/* Metric 2: Control Effectiveness Maturity */}
            <div className="p-5 border border-[#262626] bg-[#111111] space-y-2">
              <div className="text-[10px] uppercase text-[#888888]">Control Effectiveness (CEF)</div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-[#f5ff00]">
                  {(currentMetrics.cefScore * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-[#777777]">
                  vs {(compareSnapshot.metrics.cefScore * 100).toFixed(0)}%
                </div>
              </div>
              <div className="pt-2 border-t border-[#222222] flex items-center gap-1.5 text-xs">
                {cefDelta > 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    ↑ +{cefDelta}% Maturity Growth
                  </span>
                ) : cefDelta < 0 ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    ↓ {cefDelta}% Maturity Drop
                  </span>
                ) : (
                  <span className="text-[#888888]">Equal maturity (0%)</span>
                )}
              </div>
            </div>

            {/* Metric 3: Critical Deficiencies Resolved */}
            <div className="p-5 border border-[#262626] bg-[#111111] space-y-2">
              <div className="text-[10px] uppercase text-[#888888]">Critical Deficiencies</div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-rose-400">
                  {currentMetrics.criticalDeficiencies}
                </div>
                <div className="text-xs text-[#777777]">
                  vs {compareSnapshot.metrics.criticalDeficiencies} in snapshot
                </div>
              </div>
              <div className="pt-2 border-t border-[#222222] flex items-center gap-1.5 text-xs">
                {criticalDelta < 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {Math.abs(criticalDelta)} Deficiencies Resolved
                  </span>
                ) : criticalDelta > 0 ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    +{criticalDelta} Deficiencies Added
                  </span>
                ) : (
                  <span className="text-[#888888]">Equal gap count</span>
                )}
              </div>
            </div>

            {/* Metric 4: Total Controls Evaluated */}
            <div className="p-5 border border-[#262626] bg-[#111111] space-y-2">
              <div className="text-[10px] uppercase text-[#888888]">Total Safeguards Evaluated</div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-white">{currentMetrics.totalControls}</div>
                <div className="text-xs text-[#777777]">
                  vs {compareSnapshot.metrics.totalControls} in snapshot
                </div>
              </div>
              <div className="pt-2 border-t border-[#222222] flex items-center gap-1.5 text-xs text-[#888888]">
                <span>Status: {compareSnapshot.metrics.auditStatus.toUpperCase()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Snapshot Context Notes & Quick Revert Trigger */}
        {compareSnapshot && (
          <div className="p-4 bg-[#181818] border border-[#2c2c2c] flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#333333] text-[#cccccc]">
                  {compareSnapshot.versionTag}
                </span>
                <span className="text-white font-bold">{compareSnapshot.snapshot.assessmentName}</span>
                {compareSnapshot.isBaseline && (
                  <span className="px-1.5 py-0.2 text-[9px] bg-blue-950 border border-blue-600 text-blue-300 font-bold">
                    ORIGINAL BASELINE
                  </span>
                )}
                <SnapshotDeltaBadge
                  delta={computeSnapshotDelta(compareSnapshot, versionHistory)}
                  size="sm"
                />
              </div>
              <p className="text-[#888888] text-[11px] max-w-3xl leading-relaxed">
                {compareSnapshot.changeSummary || 'Baseline snapshot recorded during assessment lifecycle.'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-[11px] text-[#888888] text-right space-y-0.5 hidden sm:block">
                <div>Author: <span className="text-white">{compareSnapshot.author}</span></div>
                <div>Recorded: <span className="text-white">{new Date(compareSnapshot.timestamp).toLocaleDateString()}</span></div>
              </div>

              <button
                onClick={() => setRevertingSnapshot(compareSnapshot)}
                className="px-3 py-2 bg-[#222222] border border-amber-500/70 hover:bg-amber-500 hover:text-black text-amber-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer"
                title="Rollback assessment to this historical snapshot"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revert to This Version</span>
              </button>
            </div>
          </div>
        )}

        {/* Granular Control Diff Breakdown */}
        {compareSnapshot && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-[#262626] pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h4 className="font-mono text-xs uppercase tracking-[0.2em] font-bold text-[#888888]">
                  CONTROL-BY-CONTROL DIFF INSPECTOR
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#222222] text-[#cccccc]">
                  {changedControls.length} MODIFIED SAFEGUARDS
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowOnlyChangedControls(false)}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition cursor-pointer border ${
                    !showOnlyChangedControls
                      ? 'border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00]'
                      : 'border-[#333333] text-[#888888] hover:text-white'
                  }`}
                >
                  All Controls ({controlDiffs.length})
                </button>
                <button
                  onClick={() => setShowOnlyChangedControls(true)}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase transition cursor-pointer border ${
                    showOnlyChangedControls
                      ? 'border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00]'
                      : 'border-[#333333] text-[#888888] hover:text-white'
                  }`}
                >
                  Changed Only ({changedControls.length})
                </button>
              </div>
            </div>

            {displayedDiffs.length === 0 ? (
              <div className="p-6 text-center text-xs font-mono text-[#777777] border border-[#262626] bg-black">
                No differences found between current state and this version snapshot.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto border border-[#262626]">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead className="bg-[#181818] text-[#888888] sticky top-0 z-10 text-[10px] uppercase border-b border-[#262626]">
                    <tr>
                      <th className="p-2.5">Control ID</th>
                      <th className="p-2.5">Safeguard Title</th>
                      <th className="p-2.5">Domain</th>
                      <th className="p-2.5 text-center">Snapshot Residual</th>
                      <th className="p-2.5 text-center">Current Residual</th>
                      <th className="p-2.5 text-center">Snapshot CEF</th>
                      <th className="p-2.5 text-center">Current CEF</th>
                      <th className="p-2.5">Observed Shift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222222] bg-[#111111]">
                    {displayedDiffs.map((diff) => (
                      <tr
                        key={diff.controlId}
                        className={`hover:bg-[#161616] transition ${
                          diff.hasChanged ? 'bg-[#18180c]/40' : ''
                        }`}
                      >
                        <td className="p-2.5 font-bold text-[#f5ff00]">{diff.controlId}</td>
                        <td className="p-2.5 text-[#cccccc] max-w-xs truncate font-sans text-xs">
                          {diff.title}
                        </td>
                        <td className="p-2.5 text-[#888888] text-[11px]">{diff.domain}</td>
                        <td className="p-2.5 text-center text-[#aaaaaa]">
                          {diff.snapshotResidual.toFixed(1)}
                        </td>
                        <td className="p-2.5 text-center font-bold text-white">
                          <span
                            className={
                              diff.residualDelta < 0
                                ? 'text-emerald-400 font-bold'
                                : diff.residualDelta > 0
                                ? 'text-rose-400 font-bold'
                                : 'text-white'
                            }
                          >
                            {diff.currentResidual.toFixed(1)}
                          </span>
                        </td>
                        <td className="p-2.5 text-center text-[#aaaaaa]">
                          {(diff.snapshotCEF * 100).toFixed(0)}%
                        </td>
                        <td className="p-2.5 text-center font-bold">
                          <span
                            className={
                              diff.cefDelta > 0
                                ? 'text-emerald-400 font-bold'
                                : diff.cefDelta < 0
                                ? 'text-rose-400 font-bold'
                                : 'text-[#f5ff00]'
                            }
                          >
                            {(diff.currentCEF * 100).toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-2.5">
                          {diff.hasChanged ? (
                            <div className="space-y-0.5">
                              {diff.residualDelta < 0 && (
                                <span className="inline-block px-1.5 py-0.2 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-[10px] mr-1">
                                  ↓ {Math.abs(diff.residualDelta)} Risk
                                </span>
                              )}
                              {diff.residualDelta > 0 && (
                                <span className="inline-block px-1.5 py-0.2 bg-rose-950/60 border border-rose-700/60 text-rose-300 text-[10px] mr-1">
                                  ↑ +{diff.residualDelta} Risk
                                </span>
                              )}
                              {diff.cefDelta > 0 && (
                                <span className="inline-block px-1.5 py-0.2 bg-yellow-950/60 border border-yellow-700/60 text-yellow-300 text-[10px]">
                                  +{diff.cefDelta}% CEF
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[#555555] text-[10px]">Unchanged</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historical Snapshots Log Table */}
      <div className="border border-[#262626] bg-[#141414] p-6 space-y-4">
        <div className="border-b border-[#262626] pb-3 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-mono text-xs uppercase tracking-[0.3em] font-bold text-[#888888]">
              HISTORICAL SNAPSHOT REVISION TIMELINE
            </h3>
            <span className="font-mono text-[10px] text-[#666666]">
              CHRONOLOGICAL AUDIT LEDGER EMBEDDED IN RCSA OBJECT
            </span>
          </div>

          <div className="text-xs font-mono text-[#888888]">
            Active Version: <span className="text-[#f5ff00] font-bold">{assessment.currentVersionTag || 'v2.0'}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border border-[#262626]">
            <thead className="bg-[#181818] text-[#888888] border-b border-[#262626] text-[10px] uppercase">
              <tr>
                <th className="p-3">Version Tag</th>
                <th className="p-3">Delta Activity</th>
                <th className="p-3">Change Summary</th>
                <th className="p-3 text-center">Residual Risk</th>
                <th className="p-3 text-center">CEF Maturity</th>
                <th className="p-3 text-center">Deficiencies (Crit/High)</th>
                <th className="p-3">Author</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222] bg-[#111111]">
              {versionHistory.map((snap) => {
                const isSelected = snap.id === selectedSnapshotId;
                const isCurrentActive = snap.versionTag === assessment.currentVersionTag;
                const delta = computeSnapshotDelta(snap, versionHistory);

                return (
                  <tr
                    key={snap.id}
                    className={`hover:bg-[#161616] transition ${
                      isSelected ? 'bg-[#181808]' : ''
                    }`}
                  >
                    <td className="p-3 font-bold text-white">
                      <div className="flex items-center gap-2 flex-wrap">
                        <GitCommit
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? 'text-[#f5ff00]' : 'text-[#666666]'
                          }`}
                        />
                        <span className={isSelected ? 'text-[#f5ff00]' : 'text-white'}>
                          {snap.versionTag}
                        </span>
                        {isCurrentActive && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-[#f5ff00] text-black font-bold tracking-wider">
                            ACTIVE
                          </span>
                        )}
                        {snap.isBaseline && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-blue-950 border border-blue-600 text-blue-300 font-bold">
                            BASELINE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <SnapshotDeltaBadge delta={delta} size="sm" />
                    </td>
                    <td className="p-3 text-[#cccccc] max-w-sm truncate text-[11px]">
                      {snap.changeSummary}
                    </td>
                    <td className="p-3 text-center font-bold text-white">
                      {snap.metrics.residualRisk} / 25
                    </td>
                    <td className="p-3 text-center text-[#f5ff00]">
                      {(snap.metrics.cefScore * 100).toFixed(0)}%
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-rose-400 font-bold">
                        {snap.metrics.criticalDeficiencies}
                      </span>
                      <span className="text-[#666666]"> / </span>
                      <span className="text-amber-400 font-bold">
                        {snap.metrics.highDeficiencies}
                      </span>
                    </td>
                    <td className="p-3 text-[#888888] text-[11px]">{snap.author}</td>
                    <td className="p-3 text-[#888888] text-[11px]">
                      {new Date(snap.timestamp).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSnapshotId(snap.id)}
                          className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold border transition cursor-pointer ${
                            isSelected
                              ? 'border-[#f5ff00] bg-[#f5ff00] text-black'
                              : 'border-[#333333] bg-[#222222] text-white hover:border-[#f5ff00]'
                          }`}
                          title="Select as baseline for diff comparison"
                        >
                          {isSelected ? 'Active Diff' : 'Compare'}
                        </button>

                        <button
                          onClick={() => setRevertingSnapshot(snap)}
                          className="px-2.5 py-1 text-[10px] font-mono uppercase font-bold border border-amber-600/70 bg-amber-950/30 hover:bg-amber-500 hover:text-black text-amber-300 transition flex items-center gap-1 cursor-pointer"
                          title="Revert assessment to this version"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Revert</span>
                        </button>

                        <button
                          onClick={() => setDeletingSnapshot(snap)}
                          className="p-1 border border-rose-800/60 bg-rose-950/30 hover:bg-rose-600 text-rose-300 hover:text-white transition cursor-pointer"
                          title="Delete snapshot from history"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleExportSingleSnapshot(snap)}
                          className="p-1 border border-[#333333] bg-[#1a1a1a] hover:border-[#38bdf8] text-[#888888] hover:text-[#38bdf8] transition cursor-pointer"
                          title="Export this snapshot JSON"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
