import React, { useState, useEffect } from 'react';
import {
  History,
  GitCommit,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Plus,
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
} from 'lucide-react';
import { RCSAPayload, RCSAVersionSnapshot, RCSADomainType } from '../types';
import {
  getSavedVersionSnapshots,
  saveVersionSnapshot,
  createSnapshotFromAssessment,
} from '../data/versionSnapshots';

interface VersionHistorySectionProps {
  assessment: RCSAPayload;
  onNavigateToStage: (stage: any) => void;
}

export const VersionHistorySection: React.FC<VersionHistorySectionProps> = ({
  assessment,
  onNavigateToStage,
}) => {
  const [snapshots, setSnapshots] = useState<RCSAVersionSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newVersionTag, setNewVersionTag] = useState('v2.1 (Current Working Copy)');
  const [newSnapshotNotes, setNewSnapshotNotes] = useState('Point-in-time audit checkpoint after control remediation and evidence review.');
  const [newCreatedBy, setNewCreatedBy] = useState(assessment.organizationProfile.assessorName || 'Lead Risk Assessor');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Load snapshots on mount
  useEffect(() => {
    const loaded = getSavedVersionSnapshots();
    setSnapshots(loaded);
    if (loaded.length > 0) {
      setSelectedSnapshotId(loaded[0].id);
    }
  }, []);

  // Compute Current Assessment Snapshot Metrics
  const currentTotal = assessment.controls.length || 1;
  const currentAvgInherent = Number(
    (assessment.controls.reduce((s, c) => s + c.inherentRisk, 0) / currentTotal).toFixed(1)
  );
  const currentAvgResidual = Number(
    (assessment.controls.reduce((s, c) => s + c.residualRisk, 0) / currentTotal).toFixed(1)
  );
  const currentAvgCEF = Number(
    (assessment.controls.reduce((s, c) => s + c.calculatedCEF, 0) / currentTotal).toFixed(2)
  );
  const currentCritical = assessment.controls.filter((c) => c.status === 'CRITICAL_DEFICIENCY').length;
  const currentNeedsAttn = assessment.controls.filter((c) => c.status === 'NEEDS_ATTENTION').length;

  // Selected snapshot for comparison
  const compareSnapshot = snapshots.find((s) => s.id === selectedSnapshotId) || snapshots[0];

  // Calculate Deltas
  const residualDelta = compareSnapshot
    ? Number((currentAvgResidual - compareSnapshot.residualRiskScore).toFixed(1))
    : 0;
  const cefDelta = compareSnapshot
    ? Number(((currentAvgCEF - compareSnapshot.controlEffectivenessScore) * 100).toFixed(0))
    : 0;
  const criticalDelta = compareSnapshot
    ? currentCritical - (compareSnapshot.deficienciesCount?.critical || 0)
    : 0;

  // Handler for creating a new snapshot
  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    const newSnapshot = createSnapshotFromAssessment(
      assessment,
      newVersionTag.trim() || `v2.${snapshots.length + 1}`,
      newSnapshotNotes.trim(),
      newCreatedBy.trim()
    );

    const updated = saveVersionSnapshot(newSnapshot);
    setSnapshots(updated);
    setSelectedSnapshotId(newSnapshot.id);
    setIsCreateModalOpen(false);
    setSuccessToast(`Saved assessment snapshot '${newSnapshot.versionTag}' to version history.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-white">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-500/80 text-emerald-300 text-xs font-mono flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Version Header Banner */}
      <div className="border border-[#262626] bg-[#141414] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-0.5 border border-[#333333] bg-black text-[#888888]">
              AUDIT TRAIL & REVISION LOG
            </span>
            <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00]">
              {snapshots.length} SAVED SNAPSHOTS
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-syne font-bold uppercase tracking-tight text-white flex items-center gap-2">
            <History className="w-5 h-5 text-[#f5ff00]" />
            Assessment Version History & Trend Analysis
          </h2>
          <p className="text-xs text-[#888888] max-w-2xl font-sans">
            Track historical assessment milestones, compare current risk scores against baseline snapshots, and evaluate organizational risk reduction trajectory over time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-[#f5ff00] text-black hover:bg-yellow-300 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2 transition shrink-0 shadow-[0_0_10px_rgba(245,255,0,0.2)]"
          >
            <Save className="w-3.5 h-3.5" />
            <span>+ Save Current Snapshot</span>
          </button>
        </div>
      </div>

      {/* Create Snapshot Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border-2 border-[#f5ff00] max-w-lg w-full p-6 space-y-6 shadow-2xl animate-scaleUp">
            <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
              <h3 className="text-base font-syne font-bold uppercase text-white flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#f5ff00]" />
                Create New Assessment Snapshot
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#888888] hover:text-white font-mono text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-[11px] uppercase font-bold text-[#aaaaaa] block mb-1">
                  Version Tag (e.g., v2.0 Pre-Audit):
                </label>
                <input
                  type="text"
                  value={newVersionTag}
                  onChange={(e) => setNewVersionTag(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-[#333333] text-white focus:border-[#f5ff00] outline-none"
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
                />
              </div>

              <div className="p-3 bg-[#1c1c1c] border border-[#333333] space-y-1 text-[11px]">
                <div className="text-[#888888]">SNAPSHOT SNAP-DATA TO RECORD:</div>
                <div className="text-white">
                  Residual Risk: <span className="text-[#f5ff00] font-bold">{currentAvgResidual}/25</span> • CEF: <span className="text-[#f5ff00] font-bold">{(currentAvgCEF * 100).toFixed(0)}%</span> • Controls: <span className="text-white font-bold">{currentTotal}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-[#333333] text-[#888888] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#f5ff00] text-black font-bold hover:bg-yellow-300 shadow-[0_0_10px_rgba(245,255,0,0.3)]"
                >
                  Confirm & Save Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Snapshot Comparison Controls */}
      <div className="border border-[#262626] bg-[#141414] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-4">
          <div>
            <span className="font-mono text-[10px] text-[#f5ff00] uppercase tracking-wider font-bold block">
              TREND COMPARISON ENGINE
            </span>
            <h3 className="text-base font-syne font-bold uppercase text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#f5ff00]" />
              Select Baseline Snapshot to Compare
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#888888]">Compare Against:</span>
            <select
              value={selectedSnapshotId}
              onChange={(e) => setSelectedSnapshotId(e.target.value)}
              className="px-3.5 py-2 text-xs font-mono border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
            >
              {snapshots.map((snap) => (
                <option key={snap.id} value={snap.id}>
                  {snap.versionTag} ({new Date(snap.timestamp).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delta Comparison Scorecards */}
        {compareSnapshot && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            {/* Metric 1: Residual Risk Delta */}
            <div className="p-5 border border-[#262626] bg-[#111111] space-y-2">
              <div className="text-[10px] uppercase text-[#888888]">Residual Risk Posture</div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-white">{currentAvgResidual} / 25</div>
                <div className="text-xs text-[#777777]">vs {compareSnapshot.residualRiskScore}</div>
              </div>
              <div className="pt-2 border-t border-[#222222] flex items-center gap-1.5 text-xs">
                {residualDelta < 0 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    ↓ {Math.abs(residualDelta)} Risk Reduction ({Math.abs(Math.round((residualDelta / compareSnapshot.residualRiskScore) * 100))}%)
                  </span>
                ) : residualDelta > 0 ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    ↑ +{residualDelta} Risk Increase
                  </span>
                ) : (
                  <span className="text-[#888888]">No change (0.0)</span>
                )}
              </div>
            </div>

            {/* Metric 2: Control Effectiveness Maturity */}
            <div className="p-5 border border-[#262626] bg-[#111111] space-y-2">
              <div className="text-[10px] uppercase text-[#888888]">Control Effectiveness (CEF)</div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-[#f5ff00]">{(currentAvgCEF * 100).toFixed(0)}%</div>
                <div className="text-xs text-[#777777]">vs {(compareSnapshot.controlEffectivenessScore * 100).toFixed(0)}%</div>
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
                <div className="text-2xl font-bold text-rose-400">{currentCritical}</div>
                <div className="text-xs text-[#777777]">vs {compareSnapshot.deficienciesCount?.critical || 0} baseline</div>
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
                    +{criticalDelta} New Deficiencies
                  </span>
                ) : (
                  <span className="text-[#888888]">Equal deficiency count</span>
                )}
              </div>
            </div>

            {/* Metric 4: Total Controls Evaluated */}
            <div className="p-5 border border-[#262626] bg-[#111111] space-y-2">
              <div className="text-[10px] uppercase text-[#888888]">Controls Evaluated</div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold text-white">{currentTotal}</div>
                <div className="text-xs text-[#777777]">vs {compareSnapshot.totalControls} in snapshot</div>
              </div>
              <div className="pt-2 border-t border-[#222222] flex items-center gap-1.5 text-xs text-[#888888]">
                <span>Framework: NIST SP 800-53 Rev. 5</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Snapshot Context Notes */}
        {compareSnapshot && (
          <div className="p-4 bg-[#181818] border border-[#2c2c2c] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#333333] text-[#cccccc]">
                  {compareSnapshot.versionTag}
                </span>
                <span className="text-white font-bold">{compareSnapshot.name}</span>
              </div>
              <p className="text-[#888888] text-[11px] max-w-3xl">
                {compareSnapshot.notes || 'Baseline snapshot recorded during audit initialization.'}
              </p>
            </div>

            <div className="text-[11px] text-[#888888] shrink-0 text-right space-y-0.5">
              <div>Author: <span className="text-white">{compareSnapshot.createdBy}</span></div>
              <div>Timestamp: <span className="text-white">{new Date(compareSnapshot.timestamp).toLocaleString()}</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Historical Snapshots Log Table */}
      <div className="border border-[#262626] bg-[#141414] p-6 space-y-4">
        <div className="border-b border-[#262626] pb-3 flex items-center justify-between">
          <h3 className="font-mono text-xs uppercase tracking-[0.3em] font-bold text-[#888888]">
            HISTORICAL SNAPSHOT REVISION TIMELINE
          </h3>
          <span className="font-mono text-[10px] uppercase text-[#666666]">
            CHRONOLOGICAL AUDIT LEDGER
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border border-[#262626]">
            <thead className="bg-[#181818] text-[#888888] border-b border-[#262626]">
              <tr>
                <th className="p-3">Version Tag</th>
                <th className="p-3">Snapshot Name</th>
                <th className="p-3">Residual Risk</th>
                <th className="p-3">CEF Maturity</th>
                <th className="p-3">Deficiencies (Crit/High)</th>
                <th className="p-3">Author</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222] bg-[#111111]">
              {snapshots.map((snap) => {
                const isSelected = snap.id === selectedSnapshotId;
                return (
                  <tr
                    key={snap.id}
                    className={`hover:bg-[#161616] transition ${
                      isSelected ? 'bg-[#181808]' : ''
                    }`}
                  >
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <GitCommit className={`w-3.5 h-3.5 ${isSelected ? 'text-[#f5ff00]' : 'text-[#666666]'}`} />
                      <span className={isSelected ? 'text-[#f5ff00]' : 'text-white'}>
                        {snap.versionTag}
                      </span>
                    </td>
                    <td className="p-3 text-[#cccccc] max-w-xs truncate">{snap.name}</td>
                    <td className="p-3 font-bold text-white">{snap.residualRiskScore} / 25</td>
                    <td className="p-3 text-[#f5ff00]">{(snap.controlEffectivenessScore * 100).toFixed(0)}%</td>
                    <td className="p-3">
                      <span className="text-rose-400 font-bold">{snap.deficienciesCount?.critical || 0}</span>
                      <span className="text-[#666666]"> / </span>
                      <span className="text-amber-400 font-bold">{snap.deficienciesCount?.high || 0}</span>
                    </td>
                    <td className="p-3 text-[#888888]">{snap.createdBy}</td>
                    <td className="p-3 text-[#888888]">{new Date(snap.timestamp).toLocaleDateString()}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedSnapshotId(snap.id)}
                        className={`px-2.5 py-1 text-[10px] font-mono uppercase font-bold border transition ${
                          isSelected
                            ? 'border-[#f5ff00] bg-[#f5ff00] text-black'
                            : 'border-[#333333] bg-[#222222] text-white hover:border-[#f5ff00]'
                        }`}
                      >
                        {isSelected ? 'Active Diff' : 'Compare'}
                      </button>
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
