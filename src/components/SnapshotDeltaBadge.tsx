import React, { useState } from 'react';
import {
  Flame,
  Activity,
  Anchor,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  X,
  Sliders,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import { SnapshotDeltaSummary } from '../utils/versionTracker';

interface SnapshotDeltaBadgeProps {
  delta: SnapshotDeltaSummary;
  size?: 'sm' | 'md' | 'lg';
  showDetailsButton?: boolean;
  className?: string;
}

export const SnapshotDeltaBadge: React.FC<SnapshotDeltaBadgeProps> = ({
  delta,
  size = 'md',
  showDetailsButton = true,
  className = '',
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Badge visual configuration by activity level
  const getConfig = () => {
    switch (delta.activityLevel) {
      case 'critical':
      case 'high':
        return {
          icon: <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />,
          bg: 'bg-amber-950/40 hover:bg-amber-950/60',
          border: 'border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.25)]',
          text: 'text-amber-300',
          indicatorDot: 'bg-amber-400 shadow-[0_0_6px_#f59e0b]',
          labelTag: 'HIGH ACTIVITY',
          pillColor: 'bg-amber-500 text-black',
        };
      case 'moderate':
        return {
          icon: <Activity className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
          bg: 'bg-sky-950/40 hover:bg-sky-950/60',
          border: 'border-sky-500/70 shadow-[0_0_8px_rgba(56,189,248,0.15)]',
          text: 'text-sky-300',
          indicatorDot: 'bg-sky-400 shadow-[0_0_6px_#38bdf8]',
          labelTag: 'MODERATE ACTIVITY',
          pillColor: 'bg-sky-500 text-black',
        };
      case 'low':
        return {
          icon: <Activity className="w-3 h-3 text-teal-400 shrink-0" />,
          bg: 'bg-teal-950/30 hover:bg-teal-950/50',
          border: 'border-teal-600/60',
          text: 'text-teal-300',
          indicatorDot: 'bg-teal-400',
          labelTag: 'TARGETED CALIBRATION',
          pillColor: 'bg-teal-600 text-white',
        };
      case 'none':
        return {
          icon: <CheckCircle2 className="w-3 h-3 text-zinc-400 shrink-0" />,
          bg: 'bg-zinc-900/50 hover:bg-zinc-900/80',
          border: 'border-zinc-700/60',
          text: 'text-zinc-400',
          indicatorDot: 'bg-zinc-500',
          labelTag: 'ATTESTATION ONLY',
          pillColor: 'bg-zinc-700 text-white',
        };
      case 'baseline':
      default:
        return {
          icon: <Anchor className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
          bg: 'bg-blue-950/30 hover:bg-blue-950/50',
          border: 'border-blue-500/60',
          text: 'text-blue-300',
          indicatorDot: 'bg-blue-400',
          labelTag: 'BASELINE BENCHMARK',
          pillColor: 'bg-blue-600 text-white',
        };
    }
  };

  const cfg = getConfig();

  return (
    <>
      <div className={`inline-flex items-center gap-1.5 font-mono ${className}`}>
        {/* Visual Delta Badge Button */}
        <button
          type="button"
          onClick={() => delta.hasPrevious && setIsModalOpen(true)}
          disabled={!delta.hasPrevious}
          title={
            delta.hasPrevious
              ? `Click to inspect ${delta.changedControlsCount} controls changed from ${delta.previousVersionTag}`
              : 'Initial regulatory baseline assessment'
          }
          className={`flex items-center gap-2 px-2.5 py-1 border transition rounded-none font-mono text-xs cursor-pointer ${
            cfg.bg
          } ${cfg.border} ${cfg.text} ${
            !delta.hasPrevious ? 'cursor-default opacity-85' : 'hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {cfg.icon}

          {/* Core Delta Count */}
          <div className="flex items-center gap-1.5 font-bold">
            {delta.hasPrevious ? (
              <>
                <span className="font-extrabold tracking-tight">
                  Δ {delta.changedControlsCount}
                </span>
                <span className="text-[10px] opacity-80 uppercase hidden xs:inline">
                  {delta.changedControlsCount === 1 ? 'Control Changed' : 'Controls Changed'}
                </span>
              </>
            ) : (
              <span className="font-bold tracking-tight text-[11px] uppercase">
                Baseline (0 Δ)
              </span>
            )}
          </div>

          {/* Activity Tag Pill */}
          <span
            className={`text-[9px] font-extrabold px-1.5 py-0.2 uppercase tracking-wider ${cfg.pillColor}`}
          >
            {cfg.labelTag}
          </span>

          {delta.hasPrevious && showDetailsButton && (
            <ChevronRight className="w-3 h-3 text-current opacity-60 ml-0.5" />
          )}
        </button>
      </div>

      {/* DETAILED DELTA INSPECTOR MODAL */}
      {isModalOpen && delta.hasPrevious && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border-2 border-[#333333] hover:border-[#f5ff00]/60 max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-scaleUp font-mono text-xs">
            {/* Modal Header */}
            <div className="border-b border-[#262626] pb-3.5 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase bg-[#f5ff00] text-black">
                    AUDIT DELTA ENGINE
                  </span>
                  <span className="text-[10px] text-[#888888]">
                    Compared to: <strong className="text-white">{delta.previousVersionTag}</strong>
                  </span>
                </div>
                <h3 className="text-base font-syne font-bold uppercase text-white flex items-center gap-2">
                  {cfg.icon}
                  <span>Activity Breakdown: {delta.changedControlsCount} Controls Modified</span>
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#888888] hover:text-white p-1 hover:bg-[#222222] transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Intensity & Churn Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Box 1: Scope Delta Rate */}
              <div className="p-3 bg-[#111111] border border-[#262626] space-y-1">
                <div className="text-[10px] uppercase text-[#888888] flex items-center justify-between">
                  <span>Scope Delta Rate</span>
                  <span className="font-bold text-white">{delta.percentChanged}%</span>
                </div>
                <div className="w-full bg-[#222222] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      delta.percentChanged >= 30
                        ? 'bg-amber-400'
                        : delta.percentChanged >= 15
                        ? 'bg-sky-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, delta.percentChanged)}%` }}
                  />
                </div>
                <div className="text-[10px] text-[#777777]">
                  {delta.changedControlsCount} of {delta.totalControls} evaluated controls
                </div>
              </div>

              {/* Box 2: Posture Shift */}
              <div className="p-3 bg-[#111111] border border-[#262626] space-y-1">
                <div className="text-[10px] uppercase text-[#888888]">Residual Risk Shift</div>
                <div className="text-sm font-bold flex items-center gap-1.5">
                  {delta.residualDelta < 0 ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" />
                      {delta.residualDelta} pts (Risk Improved)
                    </span>
                  ) : delta.residualDelta > 0 ? (
                    <span className="text-rose-400 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{delta.residualDelta} pts (Risk Increased)
                    </span>
                  ) : (
                    <span className="text-[#888888]">0.0 pts (Unchanged)</span>
                  )}
                </div>
                <div className="text-[10px] text-[#777777]">
                  CEF Shift: {delta.cefDelta > 0 ? `+${delta.cefDelta}%` : `${delta.cefDelta}%`}
                </div>
              </div>

              {/* Box 3: Categorization */}
              <div className="p-3 bg-[#111111] border border-[#262626] space-y-1">
                <div className="text-[10px] uppercase text-[#888888]">Remediation Impact</div>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="px-1.5 py-0.5 bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-bold text-[10px]">
                    +{delta.improvedControlsCount} Improved
                  </span>
                  {delta.regressedControlsCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-950 border border-rose-700/60 text-rose-300 font-bold text-[10px]">
                      +{delta.regressedControlsCount} Regressed
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#777777]">
                  {delta.statusShiftCount} formal status shifts
                </div>
              </div>
            </div>

            {/* Changed Controls Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[#888888]">
                <span className="font-bold uppercase tracking-wider text-[11px] text-[#cccccc] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#f5ff00]" />
                  Itemized Control Changes ({delta.changedControls.length}):
                </span>
                <span className="text-[10px] text-[#777777]">
                  Audited against previous version
                </span>
              </div>

              {delta.changedControls.length === 0 ? (
                <div className="p-6 text-center bg-[#111111] border border-[#222222] text-[#888888]">
                  No control calibrations recorded in this snapshot.
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto border border-[#262626] bg-[#0c0c0c] divide-y divide-[#1e1e1e]">
                  {delta.changedControls.map((ctrl) => (
                    <div
                      key={ctrl.controlId}
                      className="p-3 hover:bg-[#151515] transition flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#f5ff00] text-xs">
                            {ctrl.controlId}
                          </span>
                          <span className="text-[10px] text-[#666666]">[{ctrl.domain}]</span>
                          <span
                            className={`text-[9px] font-bold px-1 py-0.2 uppercase ${
                              ctrl.changeType === 'improved'
                                ? 'bg-emerald-950 border border-emerald-700 text-emerald-300'
                                : ctrl.changeType === 'regressed'
                                ? 'bg-rose-950 border border-rose-700 text-rose-300'
                                : ctrl.changeType === 'added'
                                ? 'bg-sky-950 border border-sky-700 text-sky-300'
                                : 'bg-zinc-800 border border-zinc-600 text-zinc-300'
                            }`}
                          >
                            {ctrl.changeType}
                          </span>
                        </div>
                        <div className="text-white font-sans text-xs">{ctrl.title}</div>
                        <div className="text-[10px] text-[#888888] font-mono">
                          {ctrl.changeDescription}
                        </div>
                      </div>

                      {/* Right Posture Deltas */}
                      <div className="flex items-center gap-3 sm:text-right shrink-0">
                        <div>
                          <div className="text-[9px] text-[#666666] uppercase">Residual Risk</div>
                          <div className="font-bold text-white text-xs">
                            {ctrl.currResidual} / 25
                            {ctrl.residualDelta !== 0 && (
                              <span
                                className={`ml-1 text-[10px] ${
                                  ctrl.residualDelta < 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                ({ctrl.residualDelta < 0 ? '' : '+'}
                                {ctrl.residualDelta})
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] text-[#666666] uppercase">CEF Maturity</div>
                          <div className="font-bold text-[#f5ff00] text-xs">
                            {(ctrl.currCEF * 100).toFixed(0)}%
                            {ctrl.cefDelta !== 0 && (
                              <span
                                className={`ml-1 text-[10px] ${
                                  ctrl.cefDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                ({ctrl.cefDelta > 0 ? '+' : ''}
                                {ctrl.cefDelta}%)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
              <div className="text-[10px] text-[#666666]">
                NIST SP 800-53 Rev. 5 • Quantitative Control Assessment Delta
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-1.5 bg-[#222222] hover:bg-[#333333] text-white font-bold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
