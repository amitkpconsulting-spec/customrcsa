import {
  AssessedControl,
  DomainRiskSummary,
  RiskDomain,
  RiskLevel,
  ControlStatus,
  SectorType,
  RiskWeightingModifiers,
  EnvironmentOperatingMode
} from '../types';
import { SECTOR_PROFILES } from '../data/sectorProfiles';

export function calculateControlRisk(
  inherentImpact: number,
  inherentLikelihood: number,
  designEffectiveness: number,
  operatingEffectiveness: number,
  deficiencyPenalty: number = 0,
  confidenceFactor: number = 1.0
): {
  inherentRisk: number;
  calculatedCEF: number;
  residualRisk: number;
  riskLevel: RiskLevel;
  status: ControlStatus;
} {
  const clampedImpact = Math.max(1, Math.min(5, inherentImpact));
  const clampedLikelihood = Math.max(1, Math.min(5, inherentLikelihood));
  const inherentRisk = clampedImpact * clampedLikelihood;

  const de = Math.max(0, Math.min(1, designEffectiveness));
  const oe = Math.max(0, Math.min(1, operatingEffectiveness));
  const def = Math.max(0, Math.min(0.5, deficiencyPenalty));
  const cf = Math.max(0.8, Math.min(1.0, confidenceFactor));

  // CEF = (0.4 * De + 0.6 * Oe) * (1 - deficiencyPenalty)
  const rawCEF = (0.4 * de + 0.6 * oe) * (1 - def);
  const calculatedCEF = Math.max(0, Math.min(1, Number(rawCEF.toFixed(3))));

  // Residual Risk = IR * (1 - (CEF * Cf))
  const rawRR = inherentRisk * (1 - (calculatedCEF * cf));
  const residualRisk = Math.max(0.1, Number(rawRR.toFixed(2)));

  let riskLevel: RiskLevel = 'Low';
  if (residualRisk >= 15.0) {
    riskLevel = 'Critical';
  } else if (residualRisk >= 10.0) {
    riskLevel = 'High';
  } else if (residualRisk >= 5.0) {
    riskLevel = 'Medium';
  } else {
    riskLevel = 'Low';
  }

  let status: ControlStatus = 'COMPLIANT';
  if (calculatedCEF >= 0.85 && def === 0) {
    status = 'COMPLIANT';
  } else if (calculatedCEF >= 0.60) {
    status = 'SATISFACTORY';
  } else if (residualRisk >= 15.0 || def >= 0.3) {
    status = 'CRITICAL_DEFICIENCY';
  } else {
    status = 'NEEDS_ATTENTION';
  }

  return {
    inherentRisk,
    calculatedCEF,
    residualRisk,
    riskLevel,
    status,
  };
}

export function getRiskLevelBadge(level: RiskLevel): {
  label: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
} {
  switch (level) {
    case 'Critical':
      return {
        label: 'Critical (>= 15.0)',
        bgColor: 'bg-rose-500/10 dark:bg-rose-950/40',
        textColor: 'text-rose-600 dark:text-rose-400',
        borderColor: 'border-rose-300 dark:border-rose-800',
        dotColor: 'bg-rose-500',
      };
    case 'High':
      return {
        label: 'High (10.0 - 14.9)',
        bgColor: 'bg-orange-500/10 dark:bg-orange-950/40',
        textColor: 'text-orange-600 dark:text-orange-400',
        borderColor: 'border-orange-300 dark:border-orange-800',
        dotColor: 'bg-orange-500',
      };
    case 'Medium':
      return {
        label: 'Medium (5.0 - 9.9)',
        bgColor: 'bg-amber-500/10 dark:bg-amber-950/40',
        textColor: 'text-amber-600 dark:text-amber-400',
        borderColor: 'border-amber-300 dark:border-amber-800',
        dotColor: 'bg-amber-500',
      };
    case 'Low':
    default:
      return {
        label: 'Low (< 5.0)',
        bgColor: 'bg-emerald-500/10 dark:bg-emerald-950/40',
        textColor: 'text-emerald-600 dark:text-emerald-400',
        borderColor: 'border-emerald-300 dark:border-emerald-800',
        dotColor: 'bg-emerald-500',
      };
  }
}

export function getControlRiskLevel(residualRisk: number): RiskLevel {
  if (residualRisk >= 15.0) return 'Critical';
  if (residualRisk >= 10.0) return 'High';
  if (residualRisk >= 5.0) return 'Medium';
  return 'Low';
}

export function getInherentRiskLevel(inherentRisk: number): RiskLevel {
  if (inherentRisk >= 16) return 'Critical';
  if (inherentRisk >= 12) return 'High';
  if (inherentRisk >= 6) return 'Medium';
  return 'Low';
}

export function computeDomainSummaries(controls: AssessedControl[]): DomainRiskSummary[] {
  const domains: RiskDomain[] = ['Privacy', 'Cybersecurity', 'Information Security', 'Governance'];

  return domains.map((domain) => {
    const domainControls = controls.filter((c) => c.domain === domain);
    const total = domainControls.length;
    if (total === 0) {
      return {
        domain,
        totalControls: 0,
        assessedCount: 0,
        aggregateInherentRisk: 0,
        aggregateResidualRisk: 0,
        averageCEF: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        status: 'SATISFACTORY',
      };
    }

    const assessed = domainControls.filter((c) => c.status !== 'NOT_EVALUATED');
    const avgInherent = domainControls.reduce((sum, c) => sum + c.inherentRisk, 0) / total;
    const avgResidual = domainControls.reduce((sum, c) => sum + c.residualRisk, 0) / total;
    const avgCEF = domainControls.reduce((sum, c) => sum + c.calculatedCEF, 0) / total;

    let crit = 0, high = 0, med = 0, low = 0;
    domainControls.forEach((c) => {
      const lvl = getControlRiskLevel(c.residualRisk);
      if (lvl === 'Critical') crit++;
      else if (lvl === 'High') high++;
      else if (lvl === 'Medium') med++;
      else low++;
    });

    let status: 'SATISFACTORY' | 'NEEDS_ATTENTION' | 'CRITICAL_DEFICIENCY' = 'SATISFACTORY';
    if (crit > 0 || avgResidual >= 12.0) {
      status = 'CRITICAL_DEFICIENCY';
    } else if (high > 0 || avgResidual >= 7.0 || avgCEF < 0.6) {
      status = 'NEEDS_ATTENTION';
    }

    return {
      domain,
      totalControls: total,
      assessedCount: assessed.length,
      aggregateInherentRisk: Number(avgInherent.toFixed(1)),
      aggregateResidualRisk: Number(avgResidual.toFixed(1)),
      averageCEF: Number(avgCEF.toFixed(2)),
      criticalCount: crit,
      highCount: high,
      mediumCount: med,
      lowCount: low,
      status,
    };
  });
}

export const MODIFIER_WEIGHTS: Record<keyof RiskWeightingModifiers, { label: string; multiplier: number; description: string }> = {
  aiMlProcessing: {
    label: 'AI / ML System Processing',
    multiplier: 1.5,
    description: 'Autonomous model inferencing, LLM prompts, embeddings, or agentic actions introducing non-deterministic failure vectors.',
  },
  sensitivePii: {
    label: 'Special Category / Sensitive PII',
    multiplier: 1.4,
    description: 'Biometrics, health records, financial credentials, racial/ethnic or child data subject to heightened statutory penalties.',
  },
  crossBorderTransfer: {
    label: 'Cross-Border Third-Party Transfer',
    multiplier: 1.3,
    description: 'Data flows traversing international jurisdictions requiring Standard Contractual Clauses (SCCs) and transfer impact assessments.',
  },
  unmonitoredVendor: {
    label: 'Unmonitored Vendor / Subprocessor Sharing',
    multiplier: 1.2,
    description: 'Downstream fourth-party supply chain relationships lacking continuous API auditing or real-time security attestation.',
  },
};

export const ENVIRONMENT_MODES: Record<EnvironmentOperatingMode, { label: string; toleranceMultiplier: number; description: string; badge: string }> = {
  production: {
    label: 'Production Enterprise Governance',
    toleranceMultiplier: 1.0,
    description: 'Zero-compromise live operational governance with strict alerting thresholds and executive oversight.',
    badge: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  staging: {
    label: 'Staging & Pre-Deployment Audit',
    toleranceMultiplier: 0.85,
    description: 'Pre-launch validation gate; focuses on pre-flight security baselines with 15% testing tolerance buffer.',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  sandbox: {
    label: 'Sandboxed PoC / Testing Environment',
    toleranceMultiplier: 0.70,
    description: 'Isolated prototyping sandbox; tailored for feasibility experiments with 30% risk tolerance threshold.',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
};

export function calculateCompositeMultiplier(
  sector: SectorType,
  modifiers: RiskWeightingModifiers,
  envMode: EnvironmentOperatingMode
): {
  sectorMultiplier: number;
  modifierMultiplier: number;
  environmentTolerance: number;
  compositeMultiplier: number;
} {
  const sectorProfile = SECTOR_PROFILES[sector] || SECTOR_PROFILES.Technology;
  const sectorMultiplier = sectorProfile.defaultRiskMultiplier || 1.0;

  let modifierMultiplier = 1.0;
  if (modifiers.aiMlProcessing) modifierMultiplier *= MODIFIER_WEIGHTS.aiMlProcessing.multiplier;
  if (modifiers.sensitivePii) modifierMultiplier *= MODIFIER_WEIGHTS.sensitivePii.multiplier;
  if (modifiers.crossBorderTransfer) modifierMultiplier *= MODIFIER_WEIGHTS.crossBorderTransfer.multiplier;
  if (modifiers.unmonitoredVendor) modifierMultiplier *= MODIFIER_WEIGHTS.unmonitoredVendor.multiplier;

  const envConfig = ENVIRONMENT_MODES[envMode] || ENVIRONMENT_MODES.production;
  const environmentTolerance = envConfig.toleranceMultiplier;

  // Composite = Sector * Modifiers * EnvTolerance
  const rawComposite = sectorMultiplier * modifierMultiplier * environmentTolerance;
  const compositeMultiplier = Number(rawComposite.toFixed(2));

  return {
    sectorMultiplier,
    modifierMultiplier: Number(modifierMultiplier.toFixed(2)),
    environmentTolerance,
    compositeMultiplier,
  };
}

