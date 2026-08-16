import React, { useState, useMemo } from 'react';
import {
  AssessedControl,
  SectorType,
  MatrixDimension,
  EnvironmentOperatingMode,
  RiskWeightingModifiers,
} from '../types';
import { SECTOR_PROFILES } from '../data/sectorProfiles';
import {
  MODIFIER_WEIGHTS,
  ENVIRONMENT_MODES,
  calculateCompositeMultiplier,
  getControlRiskLevel,
  getRiskLevelBadge,
} from '../utils/riskCalculations';
import {
  Sliders,
  Layers,
  Server,
  FileSpreadsheet,
  ArrowRight,
  Cpu,
  Sparkles,
  Shield,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface HeatmapMatrixViewProps {
  controls: AssessedControl[];
  onSelectControl: (controlId: string) => void;
  currentSector?: SectorType;
  onUpdateSector?: (sector: SectorType) => void;
}

export const HeatmapMatrixView: React.FC<HeatmapMatrixViewProps> = ({
  controls,
  onSelectControl,
  currentSector = 'Technology',
  onUpdateSector,
}) => {
  // 1. Matrix Configuration States
  const [dimension, setDimension] = useState<MatrixDimension>('5x5');
  const [matrixMode, setMatrixMode] = useState<'residual' | 'inherent'>('residual');
  const [selectedSector, setSelectedSector] = useState<SectorType>(currentSector);
  const [environmentMode, setEnvironmentMode] = useState<EnvironmentOperatingMode>('production');

  // 2. Risk Weighting & Threshold Modifiers
  const [modifiers, setModifiers] = useState<RiskWeightingModifiers>({
    aiMlProcessing: true, // +1.5x
    sensitivePii: true, // +1.4x
    crossBorderTransfer: false, // +1.3x
    unmonitoredVendor: false, // +1.2x
  });

  const [selectedCell, setSelectedCell] = useState<{
    impact: number;
    likelihood: number;
    dimension: MatrixDimension;
  } | null>(null);

  const [isConfigExpanded, setIsConfigExpanded] = useState<boolean>(true);

  // Sync sector if prop changes
  const handleSectorChange = (sector: SectorType) => {
    setSelectedSector(sector);
    if (onUpdateSector) {
      onUpdateSector(sector);
    }
  };

  const toggleModifier = (key: keyof RiskWeightingModifiers) => {
    setModifiers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Calculate composite multiplier
  const compositeTelemetry = useMemo(() => {
    return calculateCompositeMultiplier(selectedSector, modifiers, environmentMode);
  }, [selectedSector, modifiers, environmentMode]);

  // Map 1-5 score to 1-3 scale for 3x3 dimension
  const map5To3 = (val: number): number => {
    if (val <= 2) return 1; // Low
    if (val === 3) return 2; // Medium
    return 3; // High
  };

  // Calculate adjusted control ratings with multipliers
  const enrichedControls = useMemo(() => {
    return controls.map((c) => {
      const effReduction = 1 - c.calculatedCEF * c.confidenceFactor;
      const rawResImpact = Math.min(
        5,
        Math.max(1, Math.round(c.inherentImpact * Math.sqrt(effReduction)))
      );
      const rawResLikelihood = Math.min(
        5,
        Math.max(1, Math.round(c.inherentLikelihood * Math.sqrt(effReduction)))
      );

      const baseInherent = c.inherentRisk;
      const baseResidual = c.residualRisk;

      // Apply composite multiplier
      const adjustedInherent = Math.min(
        100,
        Number((baseInherent * compositeTelemetry.compositeMultiplier).toFixed(1))
      );
      const adjustedResidual = Math.min(
        100,
        Number((baseResidual * compositeTelemetry.compositeMultiplier).toFixed(1))
      );

      return {
        ...c,
        rawResImpact,
        rawResLikelihood,
        adjustedInherent,
        adjustedResidual,
        // 3x3 coordinates
        inhImpact3: map5To3(c.inherentImpact),
        inhLikelihood3: map5To3(c.inherentLikelihood),
        resImpact3: map5To3(rawResImpact),
        resLikelihood3: map5To3(rawResLikelihood),
      };
    });
  }, [controls, compositeTelemetry]);

  // Group controls by coordinates depending on active dimension and mode
  const getControlsInCell = (impact: number, likelihood: number, dim: MatrixDimension) => {
    return enrichedControls.filter((c) => {
      if (dim === '5x5') {
        if (matrixMode === 'inherent') {
          return c.inherentImpact === impact && c.inherentLikelihood === likelihood;
        } else {
          return c.rawResImpact === impact && c.rawResLikelihood === likelihood;
        }
      } else {
        // 3x3 Grid
        if (matrixMode === 'inherent') {
          return c.inhImpact3 === impact && c.inhLikelihood3 === likelihood;
        } else {
          return c.resImpact3 === impact && c.resLikelihood3 === likelihood;
        }
      }
    });
  };

  // Severity color calculation (Cybernetic / Industrial Palette)
  const getCellSeverityColor = (impact: number, likelihood: number, dim: MatrixDimension) => {
    if (dim === '5x5') {
      const score = impact * likelihood;
      if (score >= 16) return 'bg-rose-950/80 hover:bg-rose-900 border-rose-600/70 text-rose-200';
      if (score >= 10) return 'bg-amber-950/80 hover:bg-amber-900 border-amber-600/70 text-amber-200';
      if (score >= 5) return 'bg-yellow-950/60 hover:bg-yellow-900 border-yellow-600/70 text-yellow-200';
      return 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-600/70 text-emerald-200';
    } else {
      // 3x3 Grid (Score 1 - 9)
      const score = impact * likelihood;
      if (score >= 6) return 'bg-rose-950/80 hover:bg-rose-900 border-rose-600/70 text-rose-200';
      if (score >= 3) return 'bg-amber-950/80 hover:bg-amber-900 border-amber-600/70 text-amber-200';
      return 'bg-emerald-950/60 hover:bg-emerald-900 border-emerald-600/70 text-emerald-200';
    }
  };

  const activeCellControls = selectedCell
    ? getControlsInCell(selectedCell.impact, selectedCell.likelihood, selectedCell.dimension)
    : [];

  // Export Matrix Data to Excel
  const handleExportMatrixExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary metadata sheet
    const summaryRows = [
      ['Custom RCSA Matrix Configuration & Profile Export'],
      ['Timestamp', new Date().toISOString()],
      ['Matrix Dimension', dimension],
      ['View Mode', matrixMode.toUpperCase()],
      ['Sector Profile', SECTOR_PROFILES[selectedSector]?.name || selectedSector],
      ['Sector Base Multiplier', `${compositeTelemetry.sectorMultiplier}x`],
      ['Environment Operating Mode', ENVIRONMENT_MODES[environmentMode].label],
      ['Environment Tolerance Buffer', `${compositeTelemetry.environmentTolerance}x`],
      ['Composite Risk Multiplier', `${compositeTelemetry.compositeMultiplier}x`],
      [
        'Active Modifiers',
        Object.entries(modifiers)
          .filter(([, v]) => v)
          .map(([k]) => MODIFIER_WEIGHTS[k as keyof RiskWeightingModifiers].label)
          .join('; ') || 'None',
      ],
      [],
      [
        'Control ID',
        'Title',
        'Domain',
        'Inherent Impact',
        'Inherent Likelihood',
        'Base Inherent Risk',
        'Adjusted Inherent Risk',
        'CEF (%)',
        'Base Residual Risk',
        'Adjusted Residual Risk',
        'Status',
      ],
    ];

    enrichedControls.forEach((c) => {
      summaryRows.push([
        c.controlId,
        c.title,
        c.domain,
        c.inherentImpact.toString(),
        c.inherentLikelihood.toString(),
        c.inherentRisk.toString(),
        c.adjustedInherent.toString(),
        `${(c.calculatedCEF * 100).toFixed(0)}%`,
        c.residualRisk.toString(),
        c.adjustedResidual.toString(),
        c.status,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Risk Matrix Data');
    XLSX.writeFile(wb, `Risk_Matrix_${dimension}_${selectedSector}_${environmentMode}.xlsx`);
  };

  return (
    <div className="space-y-6 pb-20 text-white animate-fadeIn">
      {/* Header Banner */}
      <div className="border border-[#262626] bg-[#141414] p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-widest font-bold border border-[#333333] bg-black text-[#f5ff00]">
                MATRIX TOPOLOGY ENGINE
              </span>
              <span className="text-xs font-mono text-[#888888]">
                Grid: <strong className="text-white">{dimension}</strong> • Sector:{' '}
                <strong className="text-white">{SECTOR_PROFILES[selectedSector]?.name}</strong> (
                {compositeTelemetry.sectorMultiplier}x)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-syne font-bold uppercase tracking-tight text-white">
              Interactive Risk & Control Matrix ({dimension})
            </h1>
            <p className="text-xs text-[#aaaaaa] max-w-3xl leading-relaxed">
              Dynamically calibrate risk boundaries between <strong>3×3</strong> and{' '}
              <strong>5×5</strong> topologies with industry sector profiles, AI/PII weighting
              modifiers, and environment governance tolerances.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportMatrixExcel}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#f5ff00] hover:bg-yellow-300 text-black text-xs font-mono font-bold uppercase tracking-wider transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Matrix (Excel)
            </button>
          </div>
        </div>

        {/* Primary Controls Row: Dimension Selector & Matrix Mode */}
        <div className="mt-6 pt-6 border-t border-[#262626] flex flex-wrap items-center justify-between gap-4">
          {/* Dimension Selector (3x3 vs 5x5) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-[#888888] mr-1">
              Matrix Layout:
            </span>
            <div className="inline-flex border border-[#333333] bg-black p-1">
              <button
                onClick={() => {
                  setDimension('3x3');
                  setSelectedCell(null);
                }}
                className={`px-3.5 py-1.5 text-xs font-mono font-bold tracking-wide uppercase transition ${
                  dimension === '3x3'
                    ? 'bg-[#f5ff00] text-black'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                3 × 3 Matrix (Low / Med / High)
              </button>
              <button
                onClick={() => {
                  setDimension('5x5');
                  setSelectedCell(null);
                }}
                className={`px-3.5 py-1.5 text-xs font-mono font-bold tracking-wide uppercase transition ${
                  dimension === '5x5'
                    ? 'bg-[#f5ff00] text-black'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                5 × 5 Matrix (Standard NIST)
              </button>
            </div>
          </div>

          {/* Residual vs Inherent Mode */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-[#888888] mr-1">
              Analysis Layer:
            </span>
            <div className="inline-flex border border-[#333333] bg-black p-1">
              <button
                onClick={() => {
                  setMatrixMode('residual');
                  setSelectedCell(null);
                }}
                className={`px-3.5 py-1.5 text-xs font-mono font-bold tracking-wide uppercase transition ${
                  matrixMode === 'residual'
                    ? 'bg-[#f5ff00] text-black'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                Residual Risk (Post-Control)
              </button>
              <button
                onClick={() => {
                  setMatrixMode('inherent');
                  setSelectedCell(null);
                }}
                className={`px-3.5 py-1.5 text-xs font-mono font-bold tracking-wide uppercase transition ${
                  matrixMode === 'inherent'
                    ? 'bg-[#f5ff00] text-black'
                    : 'text-[#888888] hover:text-white'
                }`}
              >
                Inherent Baseline (Pre-Control)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customizable Parameters Accordion / Bar */}
      <div className="border border-[#262626] bg-[#141414]">
        {/* Toggle Header */}
        <div
          onClick={() => setIsConfigExpanded(!isConfigExpanded)}
          className="p-4 flex items-center justify-between cursor-pointer select-none bg-[#111111] hover:bg-[#181818] transition border-b border-[#262626]"
        >
          <div className="flex items-center gap-3">
            <Sliders className="w-4 h-4 text-[#f5ff00]" />
            <div>
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Custom Risk Parameters, Sector Modifiers & Operating Environment
              </h3>
              <p className="text-[11px] text-[#888888] font-mono mt-0.5">
                Composite Net Multiplier:{' '}
                <strong className="text-[#f5ff00]">{compositeTelemetry.compositeMultiplier}x</strong>{' '}
                ({compositeTelemetry.sectorMultiplier}x Base Sector ×{' '}
                {compositeTelemetry.modifierMultiplier}x Modifiers ×{' '}
                {compositeTelemetry.environmentTolerance}x Env Buffer)
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold uppercase text-[#f5ff00] hover:underline">
            {isConfigExpanded ? 'Collapse [-]' : 'Expand [+]'}
          </span>
        </div>

        {isConfigExpanded && (
          <div className="p-6 space-y-6 animate-fadeIn">
            {/* Section 1: Industry Sector Risk Profile */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#f5ff00]" />
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    1. Industry Sector Risk Profile (Base Risk Multipliers)
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[#888888]">
                  Active Sector Multiplier:{' '}
                  <strong className="text-[#f5ff00]">{compositeTelemetry.sectorMultiplier}x</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* 1. Banking & Financial */}
                <button
                  onClick={() => handleSectorChange('Financial')}
                  className={`p-3.5 text-left border transition relative flex flex-col justify-between ${
                    selectedSector === 'Financial'
                      ? 'border-[#f5ff00] bg-[#1a1a00] text-white'
                      : 'border-[#262626] bg-[#0e0e0e] hover:border-[#444444]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-syne font-bold uppercase text-white">
                        Banking & Financial
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-700">
                        1.4x Base
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-snug font-mono">
                      FFIEC, PCI-DSS v4.0, NYDFS 500
                    </p>
                  </div>
                </button>

                {/* 2. Healthcare & Life Sciences */}
                <button
                  onClick={() => handleSectorChange('Healthcare')}
                  className={`p-3.5 text-left border transition relative flex flex-col justify-between ${
                    selectedSector === 'Healthcare'
                      ? 'border-[#f5ff00] bg-[#1a1a00] text-white'
                      : 'border-[#262626] bg-[#0e0e0e] hover:border-[#444444]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-syne font-bold uppercase text-white">
                        Healthcare & Life Sci
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-rose-950 text-rose-400 border border-rose-700">
                        1.5x Base
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-snug font-mono">
                      HIPAA Security/Privacy, HITECH, FDA
                    </p>
                  </div>
                </button>

                {/* 3. Retail & E-Commerce */}
                <button
                  onClick={() => handleSectorChange('Retail')}
                  className={`p-3.5 text-left border transition relative flex flex-col justify-between ${
                    selectedSector === 'Retail'
                      ? 'border-[#f5ff00] bg-[#1a1a00] text-white'
                      : 'border-[#262626] bg-[#0e0e0e] hover:border-[#444444]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-syne font-bold uppercase text-white">
                        Retail & E-Commerce
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-amber-950 text-amber-400 border border-amber-700">
                        1.2x Base
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-snug font-mono">
                      Cardholder CDE, POS, CCPA/CPRA
                    </p>
                  </div>
                </button>

                {/* 4. SaaS & Enterprise Software */}
                <button
                  onClick={() => handleSectorChange('Technology')}
                  className={`p-3.5 text-left border transition relative flex flex-col justify-between ${
                    selectedSector === 'Technology'
                      ? 'border-[#f5ff00] bg-[#1a1a00] text-white'
                      : 'border-[#262626] bg-[#0e0e0e] hover:border-[#444444]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-syne font-bold uppercase text-white">
                        SaaS & Software
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-sky-950 text-sky-400 border border-sky-700">
                        1.3x Base
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-snug font-mono">
                      SOC 2, ISO 27001, DevSecOps
                    </p>
                  </div>
                </button>

                {/* 5. Public Sector & Education */}
                <button
                  onClick={() => handleSectorChange('Public_Sector')}
                  className={`p-3.5 text-left border transition relative flex flex-col justify-between ${
                    selectedSector === 'Public_Sector'
                      ? 'border-[#f5ff00] bg-[#1a1a00] text-white'
                      : 'border-[#262626] bg-[#0e0e0e] hover:border-[#444444]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-syne font-bold uppercase text-white">
                        Public & Education
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-700">
                        1.1x Base
                      </span>
                    </div>
                    <p className="text-[10px] text-[#888888] leading-snug font-mono">
                      FERPA, State Privacy Acts, CJIS
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Section 2: Risk Weighting & Threshold Modifiers */}
            <div className="space-y-3 pt-4 border-t border-[#262626]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#f5ff00]" />
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    2. Risk Weighting & Threshold Modifiers (System Attributes)
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[#888888]">
                  Combined Modifier Factor:{' '}
                  <strong className="text-[#f5ff00]">{compositeTelemetry.modifierMultiplier}x</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Modifier 1: AI/ML System Processing */}
                <div
                  onClick={() => toggleModifier('aiMlProcessing')}
                  className={`p-4 border transition cursor-pointer select-none space-y-2 ${
                    modifiers.aiMlProcessing
                      ? 'border-[#f5ff00] bg-[#1a1a00]'
                      : 'border-[#262626] bg-[#0e0e0e] hover:border-[#444444]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={modifiers.aiMlProcessing}
                        onChange={() => {}}
                        className="w-4 h-4 rounded-none accent-[#f5ff00] bg-black border-[#444444]"
                      />
                      <span className="text-xs font-mono font-bold text-white">
                        AI / ML System Processing
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-700">
                      +1.5x
                    </span>
                  </div>
                  <p className="text-[10px] text-[#888888] font-mono leading-relaxed pl-6">
                    LLM prompts, embeddings, automated model decisions, agentic execution vectors.
                  </p>
                </div>

                {/* Modifier 2: Special Category / Sensitive PII */}
                <div
                  onClick={() => toggleModifier('sensitivePii')}
                  className={`p-4 border transition cursor-pointer select-none space-y-2 ${
                    modifiers.sensitivePii
                      ? 'border-[#f5ff00] bg-[#1a1a00]'
                      : 'border-[#262626] bg-[#0e0e0e] hover:border-[#444444]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={modifiers.sensitivePii}
                        onChange={() => {}}
                        className="w-4 h-4 rounded-none accent-[#f5ff00] bg-black border-[#444444]"
                      />
                      <span className="text-xs font-mono font-bold text-white">
                        Sensitive PII / Special Category
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-700">
                      +1.4x
                    </span>
                  </div>
                  <p className="text-[10px] text-[#888888] font-mono leading-relaxed pl-6">
                    Biometric tokens, health records, financial telemetry, minor/child personal data.
                  </p>
                </div>

                {/* Modifier 3: Cross-Border Data Transfer */}
                <div
                  onClick={() => toggleModifier('crossBorderTransfer')}
                  className={`p-4 border transition cursor-pointer select-none space-y-2 ${
                    modifiers.crossBorderTransfer
                      ? 'border-[#f5ff00] bg-[#1a1a00]'
                      : 'border-[#262626] bg-[#0e0e0e] hover:border-[#444444]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={modifiers.crossBorderTransfer}
                        onChange={() => {}}
                        className="w-4 h-4 rounded-none accent-[#f5ff00] bg-black border-[#444444]"
                      />
                      <span className="text-xs font-mono font-bold text-white">
                        Cross-Border Third-Party
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-sky-950 text-sky-300 border border-sky-700">
                      +1.3x
                    </span>
                  </div>
                  <p className="text-[10px] text-[#888888] font-mono leading-relaxed pl-6">
                    International data flows subject to EU GDPR Art. 44-49, SCCs, and TIA mandates.
                  </p>
                </div>

                {/* Modifier 4: Unmonitored Vendor / Subprocessor */}
                <div
                  onClick={() => toggleModifier('unmonitoredVendor')}
                  className={`p-4 border transition cursor-pointer select-none space-y-2 ${
                    modifiers.unmonitoredVendor
                      ? 'border-[#f5ff00] bg-[#1a1a00]'
                      : 'border-[#262626] bg-[#0e0e0e] hover:border-[#444444]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={modifiers.unmonitoredVendor}
                        onChange={() => {}}
                        className="w-4 h-4 rounded-none accent-[#f5ff00] bg-black border-[#444444]"
                      />
                      <span className="text-xs font-mono font-bold text-white">
                        Unmonitored Vendor Sharing
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-700">
                      +1.2x
                    </span>
                  </div>
                  <p className="text-[10px] text-[#888888] font-mono leading-relaxed pl-6">
                    Fourth-party supply chains lacking continuous API telemetry or SOC 2 verification.
                  </p>
                </div>
              </div>
            </div>

            {/* Section 3: Environment Operating Mode */}
            <div className="space-y-3 pt-4 border-t border-[#262626]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-[#f5ff00]" />
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    3. Environment Operating Mode (Governance Tolerance)
                  </h4>
                </div>
                <span className="text-[11px] font-mono text-[#888888]">
                  Buffer Factor:{' '}
                  <strong className="text-[#f5ff00]">{compositeTelemetry.environmentTolerance}x</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {Object.entries(ENVIRONMENT_MODES).map(([modeKey, modeInfo]) => {
                  const isSelected = environmentMode === modeKey;
                  return (
                    <button
                      key={modeKey}
                      onClick={() => setEnvironmentMode(modeKey as EnvironmentOperatingMode)}
                      className={`p-4 text-left border transition space-y-2 ${
                        isSelected
                          ? 'border-[#f5ff00] bg-[#1a1a00]'
                          : 'border-[#262626] bg-[#0e0e0e] hover:border-[#444444]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-syne font-bold uppercase text-white">
                          {modeInfo.label}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 border ${
                            isSelected
                              ? 'border-[#f5ff00] text-[#f5ff00] bg-black'
                              : 'border-[#333333] text-[#888888] bg-black'
                          }`}
                        >
                          {modeInfo.toleranceMultiplier}x Buffer
                        </span>
                      </div>
                      <p className="text-[10px] text-[#888888] font-mono leading-relaxed">
                        {modeInfo.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Matrix and Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* The Matrix Canvas (3x3 or 5x5) */}
        <div className="lg:col-span-8 border border-[#262626] bg-[#141414] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Impact (X-Axis) vs. Likelihood (Y-Axis) • {dimension} Grid
            </span>
            <div className="flex items-center gap-3 text-xs font-mono text-[#888888]">
              <span>
                Layer:{' '}
                <strong className="text-[#f5ff00]">
                  {matrixMode === 'residual'
                    ? 'Residual Risk (CEF Mitigated)'
                    : 'Inherent Risk (Unmitigated)'}
                </strong>
              </span>
            </div>
          </div>

          {/* 5x5 Matrix Layout */}
          {dimension === '5x5' && (
            <div className="relative pt-2 pb-2">
              {/* Y-Axis Label */}
              <div className="hidden sm:block absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-mono font-bold uppercase tracking-widest text-[#666666] select-none whitespace-nowrap">
                Likelihood (L5 to L1)
              </div>

              {/* Grid 5x5 */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((lik) => {
                  return (
                    <div key={lik} className="flex items-center gap-2">
                      <div className="w-8 text-right font-mono text-xs font-bold text-[#888888] pr-1">
                        L{lik}
                      </div>
                      <div className="grid grid-cols-5 gap-2 flex-1">
                        {[1, 2, 3, 4, 5].map((imp) => {
                          const cellControls = getControlsInCell(imp, lik, '5x5');
                          const isSelected =
                            selectedCell?.impact === imp &&
                            selectedCell?.likelihood === lik &&
                            selectedCell?.dimension === '5x5';
                          const severityClass = getCellSeverityColor(imp, lik, '5x5');

                          return (
                            <button
                              key={imp}
                              onClick={() =>
                                setSelectedCell({ impact: imp, likelihood: lik, dimension: '5x5' })
                              }
                              className={`h-16 sm:h-20 p-2 border transition flex flex-col justify-between text-left ${severityClass} ${
                                isSelected
                                  ? 'ring-2 ring-[#f5ff00] border-[#f5ff00] bg-black/40'
                                  : 'hover:border-[#f5ff00]'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-mono text-[10px] font-bold opacity-80">
                                  {imp}×{lik}
                                </span>
                                <span className="font-mono font-bold text-sm sm:text-base">
                                  {cellControls.length}
                                </span>
                              </div>

                              {cellControls.length > 0 && (
                                <div className="flex flex-wrap gap-1 overflow-hidden max-h-6">
                                  {cellControls.slice(0, 3).map((c) => (
                                    <span
                                      key={c.controlId}
                                      className="text-[8px] font-mono px-1 py-0.2 bg-black/50 border border-white/10 font-bold"
                                    >
                                      {c.controlId}
                                    </span>
                                  ))}
                                  {cellControls.length > 3 && (
                                    <span className="text-[8px] font-mono font-bold opacity-70">
                                      +{cellControls.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* X-Axis Labels 5x5 */}
                <div className="flex items-center gap-2 pt-2">
                  <div className="w-8"></div>
                  <div className="grid grid-cols-5 gap-2 flex-1 text-center font-mono text-[10px] font-bold text-[#888888]">
                    <span>I1 Low</span>
                    <span>I2 Minor</span>
                    <span>I3 Moderate</span>
                    <span>I4 Major</span>
                    <span>I5 Critical</span>
                  </div>
                </div>
                <div className="text-center text-[10px] font-mono font-bold uppercase tracking-widest text-[#666666] select-none pt-1">
                  Impact (I1 to I5)
                </div>
              </div>
            </div>
          )}

          {/* 3x3 Matrix Layout */}
          {dimension === '3x3' && (
            <div className="relative pt-2 pb-2">
              {/* Y-Axis Label */}
              <div className="hidden sm:block absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-mono font-bold uppercase tracking-widest text-[#666666] select-none whitespace-nowrap">
                Likelihood (L3 to L1)
              </div>

              {/* Grid 3x3 */}
              <div className="space-y-3">
                {[3, 2, 1].map((lik) => {
                  return (
                    <div key={lik} className="flex items-center gap-2">
                      <div className="w-10 text-right font-mono text-xs font-bold text-[#888888] pr-1">
                        L{lik}
                      </div>
                      <div className="grid grid-cols-3 gap-3 flex-1">
                        {[1, 2, 3].map((imp) => {
                          const cellControls = getControlsInCell(imp, lik, '3x3');
                          const isSelected =
                            selectedCell?.impact === imp &&
                            selectedCell?.likelihood === lik &&
                            selectedCell?.dimension === '3x3';
                          const severityClass = getCellSeverityColor(imp, lik, '3x3');

                          return (
                            <button
                              key={imp}
                              onClick={() =>
                                setSelectedCell({ impact: imp, likelihood: lik, dimension: '3x3' })
                              }
                              className={`h-24 sm:h-28 p-3 border transition flex flex-col justify-between text-left ${severityClass} ${
                                isSelected
                                  ? 'ring-2 ring-[#f5ff00] border-[#f5ff00] bg-black/40'
                                  : 'hover:border-[#f5ff00]'
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-mono text-xs font-bold opacity-80">
                                  Level {imp}×{lik}
                                </span>
                                <span className="font-mono font-bold text-lg sm:text-xl">
                                  {cellControls.length}{' '}
                                  <span className="text-xs font-mono font-normal opacity-70">
                                    controls
                                  </span>
                                </span>
                              </div>

                              {cellControls.length > 0 && (
                                <div className="flex flex-wrap gap-1 overflow-hidden max-h-12">
                                  {cellControls.slice(0, 6).map((c) => (
                                    <span
                                      key={c.controlId}
                                      className="text-[9px] font-mono px-1.5 py-0.5 bg-black/50 border border-white/10 font-bold"
                                    >
                                      {c.controlId}
                                    </span>
                                  ))}
                                  {cellControls.length > 6 && (
                                    <span className="text-[9px] font-mono font-bold opacity-70">
                                      +{cellControls.length - 6} more
                                    </span>
                                  )}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* X-Axis Labels 3x3 */}
                <div className="flex items-center gap-2 pt-2">
                  <div className="w-10"></div>
                  <div className="grid grid-cols-3 gap-3 flex-1 text-center font-mono text-xs font-bold text-[#888888]">
                    <span>Impact 1 • Low</span>
                    <span>Impact 2 • Medium</span>
                    <span>Impact 3 • High</span>
                  </div>
                </div>
                <div className="text-center text-[10px] font-mono font-bold uppercase tracking-widest text-[#666666] select-none pt-1">
                  Impact Scale (1 to 3)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Cell Inspector Sidebar */}
        <div className="lg:col-span-4 border border-[#262626] bg-[#141414] p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-[#262626] pb-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#f5ff00] block font-mono">
                Quadrant Control Telemetry
              </span>
              <h3 className="text-base font-syne font-bold uppercase text-white mt-1">
                {selectedCell
                  ? `Impact ${selectedCell.impact} × Likelihood ${selectedCell.likelihood} (${selectedCell.dimension})`
                  : 'Select a Matrix Cell'}
              </h3>
              <p className="text-xs text-[#888888] mt-1 font-mono">
                {selectedCell
                  ? `${activeCellControls.length} NIST controls currently classified in this coordinate.`
                  : 'Click any matrix cell to inspect control distribution, composite weighting attenuation, and gap telemetry.'}
              </p>
            </div>

            {selectedCell && (
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {activeCellControls.length === 0 ? (
                  <div className="text-xs text-[#888888] font-mono text-center py-8 bg-black border border-[#262626]">
                    No controls currently evaluated in this specific coordinate.
                  </div>
                ) : (
                  activeCellControls.map((c) => {
                    const badge = getRiskLevelBadge(getControlRiskLevel(c.residualRisk));
                    return (
                      <div
                        key={c.controlId}
                        className="p-3.5 border border-[#262626] bg-[#0c0c0c] hover:border-[#f5ff00] transition space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold border border-[#333333] px-2 py-0.5 bg-black text-[#f5ff00]">
                            {c.controlId}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 bg-[#1f1f1f] text-[#888888]">
                              Base RR: {c.residualRisk.toFixed(1)}
                            </span>
                            <span
                              className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 border ${badge.borderColor} ${badge.textColor} bg-black`}
                            >
                              Adj: {c.adjustedResidual.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        <h4 className="text-xs font-syne font-bold uppercase text-white line-clamp-1">
                          {c.title}
                        </h4>

                        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[#888888] pt-1 border-t border-[#262626]">
                          <div>
                            CEF:{' '}
                            <strong className="text-white">
                              {(c.calculatedCEF * 100).toFixed(0)}%
                            </strong>
                          </div>
                          <div>
                            Domain: <strong className="text-white">{c.domain}</strong>
                          </div>
                        </div>

                        <button
                          onClick={() => onSelectControl(c.controlId)}
                          className="w-full mt-2 py-1.5 bg-[#1f1f1f] hover:bg-[#f5ff00] hover:text-black text-white border border-[#333333] text-[10px] font-mono font-bold uppercase transition flex items-center justify-center gap-1"
                        >
                          Assess Control in RCSA
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Classification Legend & Multiplier Status */}
          <div className="pt-4 border-t border-[#262626] space-y-3">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="uppercase font-bold text-[#888888]">Classification Legend:</span>
              <span className="text-[#888888]">
                Tolerance:{' '}
                <strong className="text-white">
                  {ENVIRONMENT_MODES[environmentMode].label.split(' ')[0]}
                </strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-rose-950 border border-rose-600 inline-block"></span>
                <span className="text-rose-300">Critical Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-amber-950 border border-amber-600 inline-block"></span>
                <span className="text-amber-300">High Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-yellow-950 border border-yellow-600 inline-block"></span>
                <span className="text-yellow-300">Medium Risk</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-emerald-950 border border-emerald-600 inline-block"></span>
                <span className="text-emerald-300">Low Risk</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
