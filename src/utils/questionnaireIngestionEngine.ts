import { RCSAIngestionResult, IntegratedRCSAItem, ControlClassificationType } from '../types';

export function calculateRiskLevel(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score <= 6) return 'Low';
  if (score <= 12) return 'Medium';
  if (score <= 19) return 'High';
  return 'Critical';
}

export function heuristicDetectDomain(text: string): { domain: string; tags: string[] } {
  const lower = text.toLowerCase();
  if (lower.includes('access') || lower.includes('iam') || lower.includes('password') || lower.includes('mfa') || lower.includes('auth') || lower.includes('privilege')) {
    return { domain: 'Access Control', tags: ['Access Management', 'NIST SP 800-53 AC', 'ISO 27001 A.9', 'Zero Trust'] };
  }
  if (lower.includes('encrypt') || lower.includes('data') || lower.includes('privacy') || lower.includes('dlp') || lower.includes('pii') || lower.includes('gdpr') || lower.includes('hsm')) {
    return { domain: 'Data Protection', tags: ['Data Governance', 'Cryptographic Controls', 'NIST SP 800-53 SC', 'ISO 27001 A.10', 'GDPR'] };
  }
  if (lower.includes('vendor') || lower.includes('third party') || lower.includes('supplier') || lower.includes('contractor') || lower.includes('supply chain')) {
    return { domain: 'Third-Party Risk', tags: ['Vendor Assessment', 'Supply Chain Security', 'NIST SP 800-53 SR', 'ISO 27001 A.15'] };
  }
  if (lower.includes('incident') || lower.includes('breach') || lower.includes('forensic') || lower.includes('soc') || lower.includes('alert') || lower.includes('response')) {
    return { domain: 'Incident Management', tags: ['Incident Response', 'NIST SP 800-53 IR', 'ISO 27001 A.16', 'Threat Detection'] };
  }
  if (lower.includes('backup') || lower.includes('disaster') || lower.includes('recovery') || lower.includes('bcp') || lower.includes('resilience') || lower.includes('continuity')) {
    return { domain: 'Resilience', tags: ['Business Continuity', 'Disaster Recovery', 'NIST SP 800-53 CP', 'ISO 27001 A.17'] };
  }
  if (lower.includes('log') || lower.includes('audit') || lower.includes('monitor') || lower.includes('siem') || lower.includes('telemetry')) {
    return { domain: 'Logging & Monitoring', tags: ['Continuous Auditing', 'NIST SP 800-53 AU', 'ISO 27001 A.12'] };
  }
  return { domain: 'Governance', tags: ['Corporate Governance', 'Risk Management', 'NIST SP 800-53 PL', 'ISO 27001 A.5'] };
}

export function heuristicDetectControlType(text: string): ControlClassificationType {
  const lower = text.toLowerCase();
  if (lower.includes('prevent') || lower.includes('block') || lower.includes('restrict') || lower.includes('enforce') || lower.includes('encrypt') || lower.includes('mfa') || lower.includes('firewall')) {
    return 'Preventive';
  }
  if (lower.includes('detect') || lower.includes('monitor') || lower.includes('audit') || lower.includes('alert') || lower.includes('log') || lower.includes('scan') || lower.includes('inspect')) {
    return 'Detective';
  }
  if (lower.includes('recover') || lower.includes('restore') || lower.includes('patch') || lower.includes('remediat') || lower.includes('backup') || lower.includes('isolate')) {
    return 'Corrective';
  }
  if (lower.includes('policy') || lower.includes('standard') || lower.includes('training') || lower.includes('guideline') || lower.includes('charter')) {
    return 'Directive';
  }
  return 'Preventive';
}

export function heuristicCalculateRisk(domain: string, controlType: ControlClassificationType): {
  likelihood: number;
  impact: number;
  inherent_risk_score: number;
  inherent_risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  control_effectiveness_weight: number;
  projected_residual_risk_score: number;
  residual_risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
} {
  let likelihood = 3;
  let impact = 3;

  switch (domain) {
    case 'Access Control':
      likelihood = 4;
      impact = 4;
      break;
    case 'Data Protection':
      likelihood = 3;
      impact = 5;
      break;
    case 'Third-Party Risk':
      likelihood = 3;
      impact = 4;
      break;
    case 'Incident Management':
      likelihood = 3;
      impact = 4;
      break;
    case 'Resilience':
      likelihood = 2;
      impact = 5;
      break;
    case 'Logging & Monitoring':
      likelihood = 3;
      impact = 3;
      break;
    default:
      likelihood = 3;
      impact = 3;
      break;
  }

  const inherentScore = likelihood * impact;
  const inherentLevel = calculateRiskLevel(inherentScore);

  let ceWeight = 0.6;
  if (controlType === 'Preventive') ceWeight = 0.65;
  else if (controlType === 'Detective') ceWeight = 0.55;
  else if (controlType === 'Corrective') ceWeight = 0.50;
  else if (controlType === 'Directive') ceWeight = 0.40;

  const residualScore = Number((inherentScore * (1 - ceWeight)).toFixed(1));
  const residualLevel = calculateRiskLevel(residualScore);

  return {
    likelihood,
    impact,
    inherent_risk_score: inherentScore,
    inherent_risk_level: inherentLevel,
    control_effectiveness_weight: ceWeight,
    projected_residual_risk_score: residualScore,
    residual_risk_level: residualLevel,
  };
}

export function parseRawQuestionnaireChunks(rawContent: string, format: string = 'text'): RCSAIngestionResult {
  const lines = rawContent.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const items: IntegratedRCSAItem[] = [];
  const domainsSet = new Set<string>();

  // Filter out headers or metadata
  const cleanChunks: string[] = [];
  let currentAccumulator = '';

  for (const line of lines) {
    // Check if line looks like header/title
    if (
      line.startsWith('#') ||
      line.toUpperCase().includes('TABLE OF CONTENTS') ||
      line.toUpperCase().includes('CONFIDENTIAL') ||
      line.toUpperCase().includes('PAGE ') ||
      line.startsWith('---') ||
      line.startsWith('===')
    ) {
      continue;
    }

    // If starts with number or bullet, it is a new chunk
    const isNewChunk =
      /^(\d+[\.\)]|[-*•]|Q\d+[:\.]|REQ-\d+|CTRL-\d+)/i.test(line) ||
      line.includes('?') ||
      line.includes('\t') ||
      (line.includes(',') && line.split(',').length >= 2);

    if (isNewChunk) {
      if (currentAccumulator.trim().length > 15) {
        cleanChunks.push(currentAccumulator.trim());
      }
      currentAccumulator = line;
    } else {
      if (currentAccumulator) {
        currentAccumulator += ' ' + line;
      } else {
        currentAccumulator = line;
      }
    }
  }

  if (currentAccumulator.trim().length > 15) {
    cleanChunks.push(currentAccumulator.trim());
  }

  // Fallback if parsing resulted in too few items
  const finalChunks = cleanChunks.length > 0 ? cleanChunks : lines.filter((l) => l.length > 20);

  finalChunks.forEach((chunk, index) => {
    const id = `CUST-RCSA-${String(index + 1).padStart(3, '0')}`;
    const { domain, tags } = heuristicDetectDomain(chunk);
    domainsSet.add(domain);

    const controlType = heuristicDetectControlType(chunk);
    const riskCalcs = heuristicCalculateRisk(domain, controlType);

    // Clean question statement
    let question = chunk
      .replace(/^(\d+[\.\)]|[-*•]|Q\d+[:\.]|REQ-\d+|CTRL-\d+)\s*/i, '')
      .replace(/^[\s,;]+/, '')
      .trim();

    if (!question.endsWith('?') && !question.endsWith('.')) {
      question += '?';
    }

    items.push({
      id,
      original_chunk_text: chunk,
      domain,
      assessment_question: question,
      control_type: controlType,
      risk_calculations: riskCalcs,
      mapping_tags: tags,
    });
  });

  return {
    source_upload_metadata: {
      total_chunks_extracted: items.length,
      primary_domains_identified: Array.from(domainsSet),
      source_format: format,
      ingestion_timestamp: new Date().toISOString(),
    },
    integrated_rcsa_items: items,
  };
}

export async function processQuestionnaireWithAI(
  rawContent: string,
  format: string = 'text'
): Promise<RCSAIngestionResult> {
  try {
    const response = await fetch('/api/gemini/ingest-questionnaire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawContent, format }),
    });

    if (response.ok) {
      const json = await response.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('Backend ingestion endpoint unavailable, falling back to local deterministic parsing:', err);
  }

  // Fallback to local heuristic engine
  return parseRawQuestionnaireChunks(rawContent, format);
}
