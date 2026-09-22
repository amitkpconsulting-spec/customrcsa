import { CouncilRTPDocumentHeader, CouncilRTPRisk, RiskTreatmentPlan, RCSAPayload } from '../types';
import {
  defaultCouncilHeader,
  initialCouncilRisks,
  assuranceMappingMatrix,
} from '../data/councilRTPTemplateData';

export interface StandaloneRTPPdfExportOptions {
  templateStyle: 'council_aud_25_17' | 'who_tool_1_13';
  includeExecutiveSummary: boolean;
  includeTop10Scorecard: boolean;
  includeFullRegister: boolean;
  includeMatrixCriteria: boolean;
  includeAssuranceMapping: boolean;
  includeSignoffBlock: boolean;
  filterSeverity: 'ALL' | 'HIGH_MEDIUM' | 'TOP_10';
  selectedCategory?: string;
  customNotes?: string;
}

export const defaultPdfExportOptions: StandaloneRTPPdfExportOptions = {
  templateStyle: 'council_aud_25_17',
  includeExecutiveSummary: true,
  includeTop10Scorecard: true,
  includeFullRegister: true,
  includeMatrixCriteria: true,
  includeAssuranceMapping: true,
  includeSignoffBlock: true,
  filterSeverity: 'ALL',
  selectedCategory: 'ALL',
  customNotes: '',
};

function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates an isolated, self-contained, fully styled HTML document string
 * designed for 100% fidelity print-to-PDF mirroring the AUD 25/17 & WHO Tool 1.13 Risk Management templates.
 */
export function generateStandaloneRTPHtml(
  assessment: RCSAPayload,
  rtp: RiskTreatmentPlan,
  councilRisks: CouncilRTPRisk[] = initialCouncilRisks,
  header: CouncilRTPDocumentHeader = defaultCouncilHeader,
  options: StandaloneRTPPdfExportOptions = defaultPdfExportOptions
): string {
  // Filter risks based on options
  let filteredRisks = [...councilRisks];
  if (options.filterSeverity === 'HIGH_MEDIUM') {
    filteredRisks = filteredRisks.filter(
      (r) => r.postMitigationCurrent === 'High' || r.postMitigationCurrent === 'Medium'
    );
  } else if (options.filterSeverity === 'TOP_10') {
    filteredRisks = filteredRisks.filter((r) => r.isTop10 || r.postMitigationCurrent === 'High');
  }

  if (options.selectedCategory && options.selectedCategory !== 'ALL') {
    filteredRisks = filteredRisks.filter((r) => r.category === options.selectedCategory);
  }

  // Summary counts
  const totalCount = filteredRisks.length;
  const highCount = filteredRisks.filter((r) => r.postMitigationCurrent === 'High').length;
  const medCount = filteredRisks.filter((r) => r.postMitigationCurrent === 'Medium').length;
  const lowCount = filteredRisks.filter((r) => r.postMitigationCurrent === 'Low').length;
  const top10Risks = filteredRisks.filter((r) => r.isTop10).slice(0, 10);

  // Group by category for full register
  const categories = Array.from(new Set(filteredRisks.map((r) => r.category)));

  // Generate HTML string with inline CSS
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${header.documentRef} - Standalone Risk Treatment Plan Summary</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@700;800&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
      @bottom-right {
        content: "Page " counter(page) " of " counter(pages);
        font-family: 'JetBrains Mono', monospace;
        font-size: 8pt;
        color: #64748b;
      }
    }

    *, *::before, *::after {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 24px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 9.5pt;
      line-height: 1.45;
      color: #0f172a;
      background: #ffffff;
    }

    .pdf-container {
      max-width: 960px;
      margin: 0 auto;
    }

    .page-break {
      page-break-after: always;
      break-after: page;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Typography */
    h1, h2, h3, h4 {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      text-transform: uppercase;
      margin: 0;
      color: #09090b;
      letter-spacing: -0.02em;
    }

    .mono {
      font-family: 'JetBrains Mono', monospace;
    }

    /* Badges */
    .badge {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      border: 1px solid #cbd5e1;
      border-radius: 2px;
      white-space: nowrap;
    }
    .badge-high {
      background-color: #fee2e2;
      color: #b91c1c;
      border-color: #fca5a5;
    }
    .badge-med {
      background-color: #fef3c7;
      color: #b45309;
      border-color: #fcd34d;
    }
    .badge-low {
      background-color: #dcfce7;
      color: #15803d;
      border-color: #86efac;
    }
    .badge-decision {
      background-color: #f1f5f9;
      color: #0f172a;
      border-color: #cbd5e1;
    }

    /* Formal Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
      margin-top: 8px;
      margin-bottom: 16px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #0f172a;
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    tr:nth-child(even) td {
      background-color: #f8fafc;
    }

    /* Header dossier block */
    .dossier-header {
      border: 2px solid #0f172a;
      padding: 16px;
      margin-bottom: 20px;
      background: #fafafa;
    }
    .dossier-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1.5px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .dossier-seal {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      font-weight: 700;
      text-align: right;
      color: #475569;
    }

    .stat-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .stat-card {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      padding: 10px;
    }
    .stat-title {
      font-family: 'JetBrains Mono', monospace;
      font-size: 7pt;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .stat-val {
      font-family: 'Syne', sans-serif;
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }

    /* Matrix 5x5 Grid */
    .matrix-grid {
      display: grid;
      grid-template-columns: 80px repeat(5, 1fr);
      gap: 4px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7pt;
      margin: 12px 0;
    }
    .matrix-cell {
      padding: 8px 4px;
      text-align: center;
      border: 1px solid #cbd5e1;
      font-weight: 700;
    }
    .cell-h { background: #fee2e2; color: #991b1b; border-color: #f87171; }
    .cell-m { background: #fef3c7; color: #92400e; border-color: #fbbf24; }
    .cell-l { background: #dcfce7; color: #166534; border-color: #4ade80; }

    /* Sign-off signatures */
    .signature-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-top: 20px;
    }
    .sign-box {
      border: 1px solid #cbd5e1;
      padding: 12px;
      background: #f8fafc;
    }
    .sign-line {
      border-bottom: 1px solid #94a3b8;
      height: 36px;
      margin-bottom: 6px;
      font-family: 'Syne', sans-serif;
      font-size: 13pt;
      font-weight: 700;
      color: #1e293b;
      display: flex;
      align-items: flex-end;
    }

    .doc-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      margin-top: 24px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7pt;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  </style>
</head>
<body>
  <div class="pdf-container">

    <!-- PAGE 1: COVER & EXECUTIVE SUMMARY -->
    <div class="dossier-header">
      <div class="dossier-top">
        <div>
          <span class="badge" style="background:#0f172a; color:#f8fafc; border-color:#0f172a; margin-bottom:6px;">
            OFFICIAL GOVERNANCE DOSSIER
          </span>
          <h1 style="font-size: 20pt; line-height: 1.1; margin-top: 4px;">
            Risk Register &amp; Risk Treatment Plan
          </h1>
          <div style="font-size: 10pt; color: #475569; font-weight: 600; margin-top: 4px;">
            ${header.reportTarget} • ${header.executiveTitle}
          </div>
        </div>
        <div class="dossier-seal">
          <div>REF: <strong>${header.documentRef}</strong></div>
          <div>VERSION: <strong>${header.versionTag}</strong></div>
          <div>DATE: <strong>${header.issueDate}</strong></div>
          <div>STATUS: <strong>${header.classification}</strong></div>
        </div>
      </div>

      <div style="font-size: 8.5pt; color: #334155; line-height: 1.5;">
        <strong>Executive Purpose:</strong> This official Risk Treatment Plan (RTP) provides Council with a structured, post-RCSA governance framework evaluating corporate vulnerabilities, operational resilience, and cybersecurity exposures. It formalizes prioritized risk mitigations across the <em>Three Lines of Assurance</em>, defines clear remediation roadmaps, and benchmarks residual risk movement against Council's statutory risk appetite.
      </div>
    </div>

    <!-- Executive Stat Summary Strip -->
    <div class="stat-strip avoid-break">
      <div class="stat-card">
        <div class="stat-title">Registered Risks</div>
        <div class="stat-val">${totalCount}</div>
        <div style="font-size: 7pt; color: #64748b;">Across ${categories.length} Categories</div>
      </div>
      <div class="stat-card" style="border-left: 3px solid #ef4444;">
        <div class="stat-title" style="color: #b91c1c;">High Residual Risks</div>
        <div class="stat-val" style="color: #b91c1c;">${highCount}</div>
        <div style="font-size: 7pt; color: #64748b;">Requires Urgent Council Action</div>
      </div>
      <div class="stat-card" style="border-left: 3px solid #f59e0b;">
        <div class="stat-title" style="color: #b45309;">Medium Residual Risks</div>
        <div class="stat-val" style="color: #b45309;">${medCount}</div>
        <div style="font-size: 7pt; color: #64748b;">Managed Under Active Controls</div>
      </div>
      <div class="stat-card" style="border-left: 3px solid #10b981;">
        <div class="stat-title" style="color: #15803d;">Tolerated Risks</div>
        <div class="stat-val" style="color: #15803d;">${lowCount}</div>
        <div style="font-size: 7pt; color: #64748b;">Within Appetite Tolerance</div>
      </div>
    </div>

    <!-- Strategic Alignment & Appetite Statement -->
    ${
      options.includeExecutiveSummary
        ? `
    <div class="avoid-break" style="border: 1px solid #cbd5e1; padding: 12px; background: #f8fafc; margin-bottom: 20px;">
      <h3 style="font-size: 10pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px;">
        1. Strategic Objectives (SO) &amp; Council Risk Appetite Posture
      </h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 8pt;">
        <div>
          <strong style="color: #0f172a;">Strategic Alignment:</strong>
          <ul style="margin: 4px 0 0 16px; padding: 0; color: #334155; line-height: 1.4;">
            <li><strong>SO1:</strong> Public Protection &amp; Patient Safety Benchmark</li>
            <li><strong>SO2:</strong> Accurate Regulatory Registration &amp; Renewal</li>
            <li><strong>SO3:</strong> Proportionate Fitness to Practise (FtP) Proceedings</li>
            <li><strong>SO4:</strong> Education &amp; Training Quality Assurance</li>
            <li><strong>SO5:</strong> Proactive Stakeholder Communication &amp; Transparency</li>
            <li><strong>SO6:</strong> Financial Sustainability &amp; Operational Continuity</li>
          </ul>
        </div>
        <div>
          <strong style="color: #0f172a;">Council Risk Appetite Guidelines:</strong>
          <p style="margin: 4px 0 0 0; color: #334155; line-height: 1.4;">
            Council maintains an <strong>Averse</strong> risk appetite for breaches of statutory public protection or regulatory non-compliance.
            Council maintains a <strong>Cautious</strong> appetite for operational, IT, and financial disruptions, requiring that all residual scores &ge; 11 (High) be mitigated to Medium or Low within 90 days.
          </p>
        </div>
      </div>
    </div>
    `
        : ''
    }

    <!-- SECTION 2: TOP 10 PRIORITY RISKS SCORECARD -->
    ${
      options.includeTop10Scorecard && top10Risks.length > 0
        ? `
    <div class="page-break">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px;">
        <div>
          <h2 style="font-size: 12pt;">2. Top 10 Priority Risks Scorecard (Multi-Cycle Trend)</h2>
          <div style="font-size: 8pt; color: #64748b; font-family: 'JetBrains Mono', monospace;">
            Identifies highest inherent vulnerabilities and tracks post-mitigation trajectory across audit cycles
          </div>
        </div>
        <span class="badge badge-high">${top10Risks.length} PRIORITY RISKS</span>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 40px;">Rank</th>
            <th style="width: 60px;">Ref Code</th>
            <th style="width: 80px;">Category</th>
            <th>Risk Description &amp; Threat Context</th>
            <th style="width: 90px;">Owner</th>
            <th style="width: 70px;">Pre-Score</th>
            <th style="width: 80px;">Multi-Cycle</th>
            <th style="width: 80px;">Current Residual</th>
            <th style="width: 70px;">Decision</th>
          </tr>
        </thead>
        <tbody>
          ${top10Risks
            .map((r, idx) => {
              const currentBadge =
                r.postMitigationCurrent === 'High'
                  ? 'badge-high'
                  : r.postMitigationCurrent === 'Medium'
                  ? 'badge-med'
                  : 'badge-low';
              const historicCycles = (r.historicScores || [])
                .slice(0, 3)
                .map((h) => `${h.cycle}: ${h.score.slice(0, 1)}`)
                .join(' &rarr; ');

              return `
            <tr>
              <td style="font-weight: 700; text-align: center; font-family: 'JetBrains Mono', monospace;">#${idx + 1}</td>
              <td style="font-weight: 700; font-family: 'JetBrains Mono', monospace;">${r.refCode}</td>
              <td style="font-size: 7.5pt;">${r.category}</td>
              <td>
                <strong>${r.description}</strong>
                ${r.ismsClause ? `<div style="font-size: 7pt; color: #64748b; margin-top: 2px;">ISO 27001: ${r.ismsClause} • CIA: ${r.ciaAttributes || 'C/I/A'}</div>` : ''}
                <div style="font-size: 7pt; color: #475569; margin-top: 3px; font-style: italic;">
                  Mitigation I: ${r.mitigation1}
                </div>
              </td>
              <td style="font-size: 7.5pt;">${r.riskOwner}</td>
              <td style="text-align: center; font-family: 'JetBrains Mono', monospace; font-weight: 700;">
                ${r.preMitigationScore} / 25
              </td>
              <td style="font-size: 7pt; font-family: 'JetBrains Mono', monospace; color: #475569;">
                ${historicCycles || 'N/A'}
              </td>
              <td style="text-align: center;">
                <span class="badge ${currentBadge}">${r.postMitigationCurrent}</span>
              </td>
              <td style="text-align: center;">
                <span class="badge badge-decision">${r.treatmentDecision || 'TRT>TOL'}</span>
              </td>
            </tr>
          `;
            })
            .join('')}
        </tbody>
      </table>
    </div>
    `
        : ''
    }

    <!-- SECTION 3: COMPREHENSIVE RISK TREATMENT REGISTER -->
    ${
      options.includeFullRegister
        ? `
    <div class="page-break">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px;">
        <div>
          <h2 style="font-size: 12pt;">3. Comprehensive Risk Treatment Plan Register</h2>
          <div style="font-size: 8pt; color: #64748b; font-family: 'JetBrains Mono', monospace;">
            Detailed action plans, multi-tier controls (I, II, III), and treatment decisions by functional domain
          </div>
        </div>
        <span class="badge">${filteredRisks.length} TOTAL CONTROLS</span>
      </div>

      ${categories
        .map((cat) => {
          const catRisks = filteredRisks.filter((r) => r.category === cat);
          if (catRisks.length === 0) return '';

          return `
          <div class="avoid-break" style="margin-top: 14px;">
            <div style="background: #e2e8f0; padding: 4px 8px; font-family: 'Syne', sans-serif; font-size: 9pt; font-weight: 800; text-transform: uppercase; border-left: 4px solid #0f172a;">
              Domain / Category: ${cat} (${catRisks.length} Risks)
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 55px;">Ref</th>
                  <th style="width: 140px;">Risk &amp; Description</th>
                  <th style="width: 60px;">Pre Score</th>
                  <th>Multi-Tier Mitigation Controls (I, II, III)</th>
                  <th style="width: 65px;">Residual</th>
                  <th style="width: 65px;">Decision</th>
                  <th style="width: 85px;">Owner &amp; Target</th>
                </tr>
              </thead>
              <tbody>
                ${catRisks
                  .map((r) => {
                    const postBadge =
                      r.postMitigationCurrent === 'High'
                        ? 'badge-high'
                        : r.postMitigationCurrent === 'Medium'
                        ? 'badge-med'
                        : 'badge-low';

                    return `
                  <tr>
                    <td style="font-weight: 700; font-family: 'JetBrains Mono', monospace;">${r.refCode}</td>
                    <td>
                      <strong>${r.description}</strong>
                      ${r.ismsClause ? `<div style="font-size: 6.5pt; color: #64748b;">${r.ismsClause} (${r.ciaAttributes || 'C/I/A'})</div>` : ''}
                    </td>
                    <td style="text-align: center; font-family: 'JetBrains Mono', monospace;">
                      ${r.preMitigationScore}
                    </td>
                    <td style="font-size: 7.5pt; line-height: 1.35;">
                      <div><strong>I:</strong> ${r.mitigation1}</div>
                      ${r.mitigation2 ? `<div style="color: #475569; margin-top: 2px;"><strong>II:</strong> ${r.mitigation2}</div>` : ''}
                      ${r.mitigation3 ? `<div style="color: #64748b; margin-top: 2px;"><strong>III:</strong> ${r.mitigation3}</div>` : ''}
                    </td>
                    <td style="text-align: center;">
                      <span class="badge ${postBadge}">${r.postMitigationCurrent}</span>
                    </td>
                    <td style="text-align: center;">
                      <span class="badge badge-decision">${r.treatmentDecision || 'TRT>TOL'}</span>
                    </td>
                    <td style="font-size: 7pt;">
                      <strong>${r.riskOwner}</strong>
                      <div style="color: #64748b;">Q3 2026 Milestone</div>
                    </td>
                  </tr>
                `;
                  })
                  .join('')}
              </tbody>
            </table>
          </div>
        `;
        })
        .join('')}
    </div>
    `
        : ''
    }

    <!-- SECTION 4: APPENDIX II - 5X5 MATRIX & SCORING CRITERIA -->
    ${
      options.includeMatrixCriteria
        ? `
    <div class="page-break">
      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 12px;">
        <h2 style="font-size: 12pt;">4. Appendix II: 5&times;5 Consequence &amp; Likelihood Matrix</h2>
        <div style="font-size: 8pt; color: #64748b; font-family: 'JetBrains Mono', monospace;">
          Standard risk classification model adhering to Council AUD 25/17 protocol
        </div>
      </div>

      <div class="matrix-grid avoid-break">
        <div class="matrix-cell" style="background:#0f172a; color:#fff;">L \\ C</div>
        <div class="matrix-cell" style="background:#0f172a; color:#fff;">1 Insignif.</div>
        <div class="matrix-cell" style="background:#0f172a; color:#fff;">2 Minor</div>
        <div class="matrix-cell" style="background:#0f172a; color:#fff;">3 Moderate</div>
        <div class="matrix-cell" style="background:#0f172a; color:#fff;">4 Major</div>
        <div class="matrix-cell" style="background:#0f172a; color:#fff;">5 Catastr.</div>

        <div class="matrix-cell" style="background:#f1f5f9;">5 A. Certain</div>
        <div class="matrix-cell cell-l">5 Low</div>
        <div class="matrix-cell cell-m">10 Med</div>
        <div class="matrix-cell cell-h">15 High</div>
        <div class="matrix-cell cell-h">20 High</div>
        <div class="matrix-cell cell-h">25 High</div>

        <div class="matrix-cell" style="background:#f1f5f9;">4 Likely</div>
        <div class="matrix-cell cell-l">4 Low</div>
        <div class="matrix-cell cell-m">8 Med</div>
        <div class="matrix-cell cell-h">12 High</div>
        <div class="matrix-cell cell-h">16 High</div>
        <div class="matrix-cell cell-h">20 High</div>

        <div class="matrix-cell" style="background:#f1f5f9;">3 Possible</div>
        <div class="matrix-cell cell-l">3 Low</div>
        <div class="matrix-cell cell-m">6 Med</div>
        <div class="matrix-cell cell-m">9 Med</div>
        <div class="matrix-cell cell-h">12 High</div>
        <div class="matrix-cell cell-h">15 High</div>

        <div class="matrix-cell" style="background:#f1f5f9;">2 Unlikely</div>
        <div class="matrix-cell cell-l">2 Low</div>
        <div class="matrix-cell cell-l">4 Low</div>
        <div class="matrix-cell cell-m">6 Med</div>
        <div class="matrix-cell cell-m">8 Med</div>
        <div class="matrix-cell cell-m">10 Med</div>

        <div class="matrix-cell" style="background:#f1f5f9;">1 Rare</div>
        <div class="matrix-cell cell-l">1 Low</div>
        <div class="matrix-cell cell-l">2 Low</div>
        <div class="matrix-cell cell-l">3 Low</div>
        <div class="matrix-cell cell-l">4 Low</div>
        <div class="matrix-cell cell-l">5 Low</div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 7.5pt; margin-top: 10px;" class="avoid-break">
        <div style="border: 1px solid #fca5a5; background: #fee2e2; padding: 8px;">
          <strong style="color: #991b1b;">High Risk Band (Score 11 - 25):</strong>
          <p style="margin: 2px 0 0 0; color: #7f1d1d;">
            Unacceptable without urgent Senior Management Team &amp; Council intervention. Active Risk Treatment Plan required within 14 business days.
          </p>
        </div>
        <div style="border: 1px solid #fcd34d; background: #fef3c7; padding: 8px;">
          <strong style="color: #92400e;">Medium Risk Band (Score 6 - 10):</strong>
          <p style="margin: 2px 0 0 0; color: #78350f;">
            Tolerated under periodic monitoring. Department heads must verify operating controls quarterly and document compensating controls.
          </p>
        </div>
        <div style="border: 1px solid #86efac; background: #dcfce7; padding: 8px;">
          <strong style="color: #166534;">Low Risk Band (Score 1 - 5):</strong>
          <p style="margin: 2px 0 0 0; color: #14532d;">
            Acceptable within baseline risk appetite. Maintained under standard operating procedures and automated annual re-certification.
          </p>
        </div>
      </div>
    </div>
    `
        : ''
    }

    <!-- SECTION 5: THREE LINES OF ASSURANCE MAPPING -->
    ${
      options.includeAssuranceMapping
        ? `
    <div class="avoid-break" style="margin-top: 20px;">
      <div style="border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 10px;">
        <h2 style="font-size: 12pt;">5. Appendix IV: Three Lines of Defense Assurance Mapping</h2>
        <div style="font-size: 8pt; color: #64748b; font-family: 'JetBrains Mono', monospace;">
          Governance framework establishing independent verification across operational and audit layers
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 140px; text-align: left;">Key Business Risk Area</th>
            <th style="text-align: left;">Area C: Management Control &amp; Reporting</th>
            <th style="text-align: left;">Area B: Functional Oversight</th>
            <th style="text-align: left;">Area A: Independent Assurance</th>
          </tr>
        </thead>
        <tbody>
          ${assuranceMappingMatrix
            .map(
              (a) => `
            <tr>
              <td style="font-weight: 700; font-family: 'JetBrains Mono', monospace;">${escapeHtml(a.area)}</td>
              <td style="font-size: 7.5pt;">${escapeHtml(a.areaC.join(', '))}</td>
              <td style="font-size: 7.5pt;">${escapeHtml(a.areaB.join(', '))}</td>
              <td style="font-size: 7.5pt;">${escapeHtml(a.areaA.join(', '))}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    `
        : ''
    }

    <!-- SECTION 6: FORMAL GOVERNANCE SIGN-OFF & ATTESTATION -->
    ${
      options.includeSignoffBlock
        ? `
    <div class="avoid-break" style="margin-top: 24px; border: 2px solid #0f172a; padding: 16px; background: #fafafa;">
      <h3 style="font-size: 11pt; border-bottom: 1.5px solid #0f172a; padding-bottom: 4px; margin-bottom: 12px;">
        6. Formal Governance Sign-off &amp; Executive Approvals
      </h3>
      <p style="font-size: 8pt; color: #475569; margin: 0 0 12px 0;">
        We hereby attest that this Risk Treatment Plan accurately reflects the operational, cybersecurity, and regulatory posture of <strong>${assessment.organizationProfile.targetSystem}</strong>. The treatment strategies, assigned owners, and milestone commitments are approved for formal submission to Council and the Audit &amp; Risk Committee.
      </p>

      <div class="signature-grid">
        <div class="sign-box">
          <div class="sign-line">${header.executiveTitle.split(',')[0]}</div>
          <div style="font-weight: 700; font-size: 8pt;">${header.executiveTitle}</div>
          <div style="font-size: 7.5pt; color: #64748b;">Chief Executive &amp; Registrar • Executive Sponsor</div>
          <div style="font-size: 7pt; color: #94a3b8; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">
            Date: ${header.issueDate} • Digital ID: #EXEC-REG-${header.documentRef.slice(0, 7)}
          </div>
        </div>

        <div class="sign-box">
          <div class="sign-line">A. Thorne, FCA</div>
          <div style="font-weight: 700; font-size: 8pt;">Dr. Alistair Thorne, Chair</div>
          <div style="font-size: 7.5pt; color: #64748b;">Audit &amp; Risk Committee • Independent Assurance</div>
          <div style="font-size: 7pt; color: #94a3b8; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">
            Date: ${header.issueDate} • Digital ID: #ARC-CHAIR-AT902
          </div>
        </div>

        <div class="sign-box">
          <div class="sign-line">${assessment.organizationProfile.assessorName}</div>
          <div style="font-weight: 700; font-size: 8pt;">${assessment.organizationProfile.assessorName} (${assessment.organizationProfile.assessorId})</div>
          <div style="font-size: 7.5pt; color: #64748b;">Lead Risk Assessor &amp; System Custodian</div>
          <div style="font-size: 7pt; color: #94a3b8; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">
            Date: ${assessment.organizationProfile.lastAssessmentDate} • Verified via Technoscope RCSA Engine
          </div>
        </div>

        <div class="sign-box">
          <div class="sign-line">Quality Certified</div>
          <div style="font-weight: 700; font-size: 8pt;">Information Security &amp; Compliance Office</div>
          <div style="font-size: 7.5pt; color: #64748b;">ISO 27001 ISMS / NIST SP 800-53 Rev. 5</div>
          <div style="font-size: 7pt; color: #94a3b8; font-family: 'JetBrains Mono', monospace; margin-top: 4px;">
            Status: COMPLIANT &bull; Zero Outstanding Critical Deficiencies
          </div>
        </div>
      </div>
    </div>
    `
        : ''
    }

    <!-- DOCUMENT FOOTER -->
    <div class="doc-footer">
      <div>
        Developed by <strong>www.technoscope.co.in</strong> &bull; Proprietary Copyright &bull; Council Risk Register &amp; Risk Treatment Plan (AUD 25/17)
      </div>
      <div>
        Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} &bull; NIST SP 800-53 / ISO 27001
      </div>
    </div>

  </div>
</body>
</html>`;
}

/**
 * Opens a clean, isolated popup window containing only the standalone HTML document
 * and triggers window.print() to generate the PDF cleanly.
 */
export function printStandaloneRTPWindow(htmlContent: string, title = 'Risk_Treatment_Plan_AUD_25_17'): void {
  const printWindow = window.open('', '_blank', 'width=1100,height=850,menubar=no,toolbar=no,location=no,status=no');
  if (!printWindow) {
    alert('Browser popup was blocked. Please allow popups for this site, or use the direct "Print / Save PDF" button.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();

  // Allow styles and fonts to render
  setTimeout(() => {
    printWindow.print();
  }, 600);
}

/**
 * Downloads the standalone, self-contained HTML file for offline viewing and printing.
 */
export function downloadStandaloneRTPHtml(
  htmlContent: string,
  filename = 'Risk_Treatment_Plan_AUD_25_17_Dossier.html'
): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers direct browser print for the active modal, scoping print to #standalone-rtp-pdf-document.
 */
export function triggerModalPrint(): void {
  document.body.classList.add('printing-standalone-pdf');

  const cleanup = () => {
    document.body.classList.remove('printing-standalone-pdf');
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);
  window.print();

  // Fallback cleanup if afterprint does not fire in some browsers
  setTimeout(() => {
    document.body.classList.remove('printing-standalone-pdf');
  }, 2500);
}
