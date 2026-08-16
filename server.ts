import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      platform: "Custom RCSA by Technocope",
      framework: "NIST SP 800-53 Rev. 5",
      timestamp: new Date().toISOString(),
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // AI Remediation generation endpoint
  app.post("/api/gemini/remediate", async (req, res) => {
    try {
      const { assessment, sector, focusControls } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(200).json({
          fallback: true,
          message: "No GEMINI_API_KEY detected in environment; using embedded NIST SP 800-53 expert remediation engine.",
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const promptContext = {
        organization: assessment?.organizationProfile || { sector: sector || "Technology", target_system: "Enterprise Core" },
        deficiencies: (focusControls || []).map((c: any) => ({
          control_id: c.controlId,
          title: c.title,
          family: c.family,
          domain: c.domain,
          inherent_risk: c.inherentRisk,
          cef: c.cef,
          residual_risk: c.residualRisk,
          design_effectiveness: c.designEffectiveness,
          operating_effectiveness: c.operatingEffectiveness,
          deficiency_penalty: c.deficiencyPenalty,
          gaps_identified: c.gapsIdentified || "Incomplete control implementation or open audit finding",
          evidence_notes: c.implementationEvidence || "",
        })),
      };

      const systemInstruction = `You are an expert compliance auditor, cybersecurity architect, and risk specialist for NIST SP 800-53 Rev. 5.
Given a list of identified control deficiencies and risk assessments across Privacy, Cyber, and InfoSec domains, formulate a comprehensive, actionable, and structured remediation roadmap.
For each control, provide:
1. priority (P0_IMMEDIATE, P1_HIGH, P2_MEDIUM, P3_LOW)
2. target_control (e.g. AC-2, PT-2)
3. gap_summary (clear root cause summary)
4. technical_remediation_action (concrete technical & configuration steps, e.g. enforcing MFA, role-based RBAC, WORM storage, TLS 1.3, DLP rules)
5. compensating_control (short-term mitigating mechanism)
6. estimated_residual_reduction (numerical estimate of risk score points reduced, e.g. 5.5 to 12.0)
7. implementation_timeline (e.g. "1-2 Weeks", "30 Days")
8. validation_criteria (how auditors will verify remediation evidence)`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `Please generate a structured NIST SP 800-53 Rev. 5 remediation roadmap for the following assessed deficiencies:\n${JSON.stringify(promptContext, null, 2)}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executive_summary: { type: Type.STRING },
              sector_regulatory_notes: { type: Type.STRING },
              remediation_roadmap: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    priority: { type: Type.STRING },
                    target_control: { type: Type.STRING },
                    control_title: { type: Type.STRING },
                    gap_summary: { type: Type.STRING },
                    technical_remediation_action: { type: Type.STRING },
                    compensating_control: { type: Type.STRING },
                    estimated_residual_reduction: { type: Type.NUMBER },
                    implementation_timeline: { type: Type.STRING },
                    validation_criteria: { type: Type.STRING },
                  },
                  required: [
                    "priority",
                    "target_control",
                    "gap_summary",
                    "technical_remediation_action",
                    "compensating_control",
                    "estimated_residual_reduction",
                  ],
                },
              },
            },
            required: ["executive_summary", "remediation_roadmap"],
          },
        },
      });

      const responseText = response.text?.trim() || "{}";
      const parsedData = JSON.parse(responseText);

      return res.json({
        success: true,
        source: "gemini-3.7-flash",
        data: parsedData,
      });
    } catch (error: any) {
      console.error("Gemini API Remediation Error:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate AI remediation",
        fallback: true,
      });
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Custom RCSA by Technocope server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
