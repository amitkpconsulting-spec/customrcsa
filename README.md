# Custom RCSA by Technoscope
### Enterprise Risk & Control Self-Assessment (RCSA) Governance Platform

[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?style=flat&logo=github)](https://github.com/amitkpconsulting-spec/customrcsa)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-38bdf8.svg)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933.svg)
![Standards](https://img.shields.io/badge/NIST-SP%20800--53%20Rev.5-f5ff00.svg)

> **Repository URL**: [https://github.com/amitkpconsulting-spec/customrcsa](https://github.com/amitkpconsulting-spec/customrcsa)

---

## 1. Short Info of Tool

**Custom RCSA by Technoscope** is a full-stack, enterprise-grade Risk and Control Self-Assessment (RCSA) platform designed for cybersecurity, GRC (Governance, Risk, and Compliance), and IT leadership teams. It streamlines the end-to-end evaluation of operational and security controls against industry standards (such as **NIST SP 800-53 Rev. 5**, **ISO/IEC 27001**, **SOC 2 Type II**, **HIPAA**, and **FedRAMP**), automates qualitative and quantitative risk calculations, forecasts threat trajectories with multi-engine AI, and generates board-ready audit reports. Source code and releases are maintained at [github.com/amitkpconsulting-spec/customrcsa](https://github.com/amitkpconsulting-spec/customrcsa).

---

## 2. What It Does

- **Comprehensive Control Assessments**: Evaluates controls across all 20 NIST SP 800-53 domains (Access Control, Incident Response, Cryptography, System Integrity, Supply Chain, and more).
- **Dynamic Risk Quantification**: Automatically calculates Inherent Risk, Control Effectiveness scores, Defensibility multipliers, and Residual Risk (5x5 matrix scale from Low to Critical).
- **Interactive Heatmap Matrix**: Live visual 5x5 Inherent vs. Residual risk heatmaps with interactive cell inspections, domain filtering, and volatile control watchlists.
- **Multi-Model AI Intelligence Hub**:
  - **Executive Summaries**: High-level posture grading, key vulnerability extraction, and committee talking points.
  - **Predictive Trajectory Simulation**: 30-day and 90-day risk velocity forecasts across configurable stress scenarios (e.g., Ransomware surge, Sudden audit, Supply chain outage).
  - **Remediation Roadmap Synthesis**: Prioritized (P0–P3) remediation plans with ROI/risk reduction percentages, root-cause analyses, and compensating safeguard recommendations.
  - **Horizon & Trend Scanning**: Scans emerging regulatory updates and cyber threats mapped to system boundaries.
  - **Governance Writeups**: Automated generation of formal Board Memos, CISO Defense Statements, and Customer Trust Attestations.
- **Air-Gapped & Local AI Flexibility**:
  - **Cloud AI**: Google Gemini 2.5 Flash via `@google/genai`.
  - **Local AI Engines**: One-click integration with **LM Studio** (`localhost:1234`), **Ollama** (`localhost:11434`), and **Anything LLM** (`localhost:3001`).
  - **Air-Gapped Zero-Telemetry Mode**: 100% offline, deterministic heuristic rule engine operating strictly in memory without external network calls.
- **Audit Certification & Sign-off**: Multi-role digital signature workflows (Assessor, Security Reviewer, Lead CISO, External Auditor) with cryptographic audit hashes and tamper detection.
- **Multi-Format Exporting & Reporting**: Export full assessment bundles as structured JSON, multi-tab Excel (`.xlsx`) workbooks, and print-ready formal PDF executive reports.

---

## 3. How It Will Be Helpful

| Stakeholder / Role | Key Benefits & Value Proposition |
| :--- | :--- |
| **Chief Information Security Officers (CISOs)** | Translates complex technical control telemetry into defensible, board-level risk metrics, executive summaries, and clear residual risk posture grades. |
| **GRC & Compliance Teams** | Accelerates annual and quarterly RCSA cycles by 80% with standardized NIST SP 800-53 templates, sector-specific baselines (FinTech, Healthcare, Defense, SaaS, Critical Infra), and automated gap tracking. |
| **Risk Analysts & SecOps** | Quantifies control effectiveness with real-time math, identifies volatile controls before audit deadlines, and generates prioritized remediation roadmaps with estimated effort. |
| **External & Internal Auditors** | Provides timestamped audit certification trails, immutable baseline snapshots, version control diffing, and verifiable evidence references. |
| **Air-Gapped / Classified Environments** | Runs completely isolated with zero outbound network calls, ensuring classified defense and banking data never leaves local infrastructure. |

---

## 4. Architecture

The application follows a modern full-stack decoupled architecture running an Express.js backend and a React 19 single-page application with Vite:

```
┌──────────────────────────────────────────────────────────────────┐
│                   Custom RCSA Client (React 19)                  │
│  - Industrial Systematic Dark Theme UI (Tailwind CSS v4)         │
│  - Motion Transitions & Interactive Recharts / SVG Heatmaps      │
│  - Client-side Excel (xlsx) & JSON Generation Engine             │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ REST API / Vite Middleware
┌─────────────────────────────────▼────────────────────────────────┐
│                   Server Layer (Express.js + Node)                │
│  - Port 3000 (0.0.0.0 ingress)                                   │
│  - Bundled via esbuild into single dist/server.cjs in Production │
│  - Local file storage engine (/data/assessments.json)            │
└─────────────────────────────────┬────────────────────────────────┘
                                  │
      ┌───────────────────────────┴───────────────────────────┐
      ▼                                                       ▼
┌───────────────────────────────┐           ┌───────────────────────────────┐
│     Cloud AI Integration      │           │      Local & Offline AI       │
│  - Google GenAI SDK           │           │  - LM Studio (Port 1234)      │
│  - Gemini 2.5 Flash Model     │           │  - Ollama (Port 11434)        │
│  - Secure Server-Side Proxy   │           │  - Anything LLM (Port 3001)   │
│                               │           │  - Air-Gapped Embedded Engine │
└───────────────────────────────┘           └───────────────────────────────┘
```

### Directory Structure Overview
```
├── src/
│   ├── components/        # UI Views (AIDashboardView, HeatmapMatrixView, Modals, etc.)
│   ├── data/              # NIST SP 800-53 controls, Sector profiles, Demo presets
│   ├── utils/             # Calculation engines, AI inference routers, XLSX exporter
│   ├── types.ts           # Central TypeScript schemas & domain interfaces
│   ├── App.tsx            # Main application coordinator & stage manager
│   ├── main.tsx           # React entry point
│   └── index.css          # Tailwind CSS v4 design token styling
├── server.ts              # Express API & Vite dev server middleware
├── Setup.bat              # Automated Windows environment & dependency installer
├── Start.bat              # Interactive launcher & local server supervisor
├── package.json           # Dependencies and build scripts
└── vite.config.ts         # Vite build configuration
```

---

## 5. Dependencies

### System Prerequisites
- **Node.js**: v18.0.0 or higher (LTS recommended)
- **npm**: v9.0.0 or higher (or `bun` / `yarn` / `pnpm`)
- **Optional**: Docker & Docker Compose (for containerized deployments)

### Core NPM Dependencies
- **UI & Runtime**: `react` (v19.x), `react-dom`, `motion` (animations), `lucide-react` (icons)
- **Styling**: `tailwindcss` (v4.x), `@tailwindcss/vite`
- **Server**: `express` (v4.x), `tsx` (TypeScript executor), `esbuild` (bundler), `dotenv`
- **Data & Export**: `xlsx` (Excel spreadsheet generator), `canvas-confetti`
- **AI SDK**: `@google/genai` (Google Gemini SDK)

---

## 6. How to Run It

### Quick Start (Standard CLI)

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/amitkpconsulting-spec/customrcsa.git
   cd customrcsa
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional)**:
   Create a `.env` file from the provided `.env.example`:
   ```bash
   cp .env.example .env
   ```
   *(Add your `GEMINI_API_KEY` if you wish to use Google Gemini Cloud AI; otherwise local/offline modes work out of the box).*

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open your browser at [http://localhost:3000](http://localhost:3000).

5. **Build and Run for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## 7. Using Setup and Start Batch Files (Windows)

For Windows environments, two turnkey automation scripts are included in the project root:

### `Setup.bat` — Environment Setup & Dependency Checker
Run `Setup.bat` by double-clicking it or executing from Command Prompt / PowerShell:
```cmd
Setup.bat
```
**What `Setup.bat` does automatically:**
1. **Prerequisite Detection**: Verifies that Node.js and npm are installed and configured on the system PATH.
2. **Directory & Configuration Fulfillment**: Creates required `./data`, `./logs`, and `./uploads` folders and generates a standard `.env` configuration file if missing.
3. **Dependency Installation**: Runs a clean `npm install` to download all required packages.
4. **Production Compilation**: Builds the frontend assets and packages the backend server into `dist/server.cjs` via `npm run build`.

---

### `Start.bat` — Localhost Server Launcher
Run `Start.bat` by double-clicking it or executing from Command Prompt:
```cmd
Start.bat
```
**Features of `Start.bat`:**
- **Pre-flight Integrity Check**: Automatically invokes `Setup.bat` if dependencies or build artifacts are missing.
- **Interactive Control Menu**:
  - `[1] Run Localhost`: Starts the Node.js production server on port 3000 and automatically opens your default browser to `http://localhost:3000`.
  - `[2] Run Docker`: Builds and launches the application container using Docker Compose.
  - `[3] Run Setup`: Re-executes the environment setup and dependency refresh.
  - `[4] Exit`: Closes the launcher.

---

## 8. License

This project is licensed under the **MIT License**.

```
Technoscope (Amit Kumar Pandey) Proprietary Source-Available License
Copyright (c) 2026 Technoscope (Amit Kumar Pandey). All Rights Reserved.

This software and associated documentation files (the "Software") are the proprietary property of Technoscope (Amit Kumar Pandey).

By downloading, accessing, or using the Software, you agree to the following terms:

1. Grant of Limited License
You are granted a limited, non-exclusive, non-transferable right to download, install, and evaluate the Software for internal, non-commercial testing purposes only.

2. Absolute Ownership
The Software is licensed, not sold. Technoscope (Amit Kumar Pandey) retains all intellectual property rights, title, and interest in and to the Software. You may not claim ownership of the Software, its source code, or any derivative works under any circumstances.

3. Restrictions on Use
Without prior explicit, written permission from the copyright holder, you MAY NOT:

Use the Software for commercial purposes, including in production environments.

Modify, alter, or create derivative works of the Software.

Distribute, sub-license, host, or sell the Software to any third party.

Remove or alter any copyright notices or proprietary markings.

4. Consultancy, Advisory, and Commercial Use
Any production deployment, commercial usage, or requirement for technical support, implementation advisory, and compliance consultancy must be obtained directly from Technoscope (Amit Kumar Pandey).

To request commercial licensing, advisory services, or permission for restricted uses, please contact: [amitkp.consulting@gmail.com / www.technoscope.com]

5. Limitation of Liability
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
