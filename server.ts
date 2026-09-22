import express from "express";
import path from "path";
import fs from "fs";
import fsPromises from "fs/promises";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Quota circuit breaker tracking
let quotaExhaustedUntil = 0;

// Helper for resilient Gemini API calls with exponential backoff on transient errors (503, 500)
// and instant graceful fallback on quota exhaustion (429 / RESOURCE_EXHAUSTED)
async function executeGeminiWithRetry<T>(
  fn: () => Promise<T>,
  retries = 1,
  delayMs = 1000
): Promise<{ data?: T; error?: any; isTransient?: boolean; isQuotaExhausted?: boolean }> {
  // If we know quota is exhausted in the last 60 seconds, skip attempting remote call
  if (Date.now() < quotaExhaustedUntil) {
    return {
      error: new Error("Quota currently exhausted. Using local deterministic expert engine."),
      isQuotaExhausted: true,
      isTransient: false,
    };
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fn();
      return { data: result };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      const isQuotaExhausted =
        errMsg.includes("RESOURCE_EXHAUSTED") ||
        errMsg.includes("Quota exceeded") ||
        errMsg.includes("quotaId") ||
        errMsg.includes("GenerateRequestsPerDay") ||
        errMsg.includes("free_tier_requests");

      if (isQuotaExhausted) {
        // Set circuit breaker for 60 seconds to avoid flooding logs and delay responses
        quotaExhaustedUntil = Date.now() + 60000;
        console.warn("[Gemini API] Quota limit reached; seamlessly activating deterministic local expert fallback.");
        return { error: err, isQuotaExhausted: true, isTransient: false };
      }

      const isTransient =
        errMsg.includes("503") ||
        errMsg.includes("UNAVAILABLE") ||
        errMsg.includes("high demand") ||
        errMsg.includes("500") ||
        errMsg.includes("INTERNAL") ||
        errMsg.includes("fetch failed");

      if (isTransient && attempt < retries) {
        console.warn(`[Gemini API] Transient connection issue (attempt ${attempt + 1}/${retries + 1}). Retrying in ${delayMs}ms...`);
        await new Promise((res) => setTimeout(res, delayMs * (attempt + 1)));
        continue;
      }
      return { error: err, isTransient };
    }
  }
  return { error: new Error("Max retries exceeded"), isTransient: true };
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// -------------------------------------------------------------
// LOCAL AI PLATFORM ENGINE HELPERS (Ollama, LM Studio, Unsloth, AnythingLLM)
// -------------------------------------------------------------

interface LocalAIConfig {
  mode?: string;
  ollamaEndpoint?: string;
  ollamaModel?: string;
  ollamaApiPath?: '/api' | '/v1';
  lmStudioEndpoint?: string;
  lmStudioModel?: string;
  unslothEndpoint?: string;
  unslothModel?: string;
  anythingLlmEndpoint?: string;
  anythingLlmModel?: string;
  anythingLlmApiKey?: string;
  delimitGeminiKey?: boolean;
  fallbackToLocalOnQuota?: boolean;
  isAirGappedMode?: boolean;
}

// Fetch with configurable timeout helper
async function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// 1. Ollama Provider Invoker (CLI-first daemon, default base: http://localhost:11434/v1)
async function callOllama(
  endpoint: string | undefined,
  model: string | undefined,
  systemInstruction: string,
  prompt: string,
  jsonMode: boolean = true
): Promise<{ success: boolean; data?: any; rawText?: string; error?: string }> {
  const base = (endpoint || "http://localhost:11434/v1").replace(/\/$/, "");
  const targetModel = model || "llama3:latest";

  // First try OpenAI-compatible endpoint: /v1/chat/completions
  const chatUrl = base.endsWith("/v1") ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
  try {
    const res = await fetchWithTimeout(
      chatUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          response_format: jsonMode ? { type: "json_object" } : undefined,
        }),
      },
      12000
    );

    if (res.ok) {
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content || "";
      if (jsonMode) {
        try {
          const parsed = JSON.parse(content);
          return { success: true, data: parsed, rawText: content };
        } catch {
          // If response wrapped in markdown code fence
          const clean = content.replace(/```json\n?|\n?```/g, "").trim();
          const parsed = JSON.parse(clean);
          return { success: true, data: parsed, rawText: content };
        }
      }
      return { success: true, rawText: content };
    }
  } catch (err: any) {
    console.warn(`[Ollama OpenAI route /v1/chat/completions failed, trying native /api/generate]:`, err.message);
  }

  // Fallback to Ollama native /api/generate
  const nativeBase = base.replace(/\/v1$/, "");
  try {
    const res = await fetchWithTimeout(
      `${nativeBase}/api/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: targetModel,
          system: systemInstruction,
          prompt: prompt,
          stream: false,
          format: jsonMode ? "json" : undefined,
        }),
      },
      12000
    );

    if (res.ok) {
      const json = await res.json();
      const responseText = json.response || "";
      if (jsonMode) {
        const clean = responseText.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(clean);
        return { success: true, data: parsed, rawText: responseText };
      }
      return { success: true, rawText: responseText };
    }
  } catch (err: any) {
    return { success: false, error: `Ollama unavailable at ${base}: ${err.message}` };
  }

  return { success: false, error: `Ollama invocation failed at ${base}` };
}

// 2. LM Studio Provider Invoker (Desktop GUI-first, default base: http://localhost:1234/v1)
async function callLMStudio(
  endpoint: string | undefined,
  model: string | undefined,
  systemInstruction: string,
  prompt: string,
  jsonMode: boolean = true
): Promise<{ success: boolean; data?: any; rawText?: string; error?: string }> {
  const base = (endpoint || "http://localhost:1234/v1").replace(/\/$/, "");
  const targetModel = model || "local-model";
  const chatUrl = base.endsWith("/v1") ? `${base}/chat/completions` : `${base}/v1/chat/completions`;

  try {
    const res = await fetchWithTimeout(
      chatUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          response_format: jsonMode ? { type: "json_object" } : undefined,
        }),
      },
      12000
    );

    if (res.ok) {
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content || "";
      if (jsonMode) {
        try {
          const parsed = JSON.parse(content);
          return { success: true, data: parsed, rawText: content };
        } catch {
          const clean = content.replace(/```json\n?|\n?```/g, "").trim();
          const parsed = JSON.parse(clean);
          return { success: true, data: parsed, rawText: content };
        }
      }
      return { success: true, rawText: content };
    }
    return { success: false, error: `LM Studio returned HTTP ${res.status}` };
  } catch (err: any) {
    return { success: false, error: `LM Studio unavailable at ${base}: ${err.message}` };
  }
}

// 3. Unsloth Provider Invoker (Fast, low-VRAM local fine-tuning and inference, default base: http://localhost:8888)
// API Compatibility: Exposes local /v1 endpoints meant for developer tools and coding agents like Claude Code or Codex.
async function callUnsloth(
  endpoint: string | undefined,
  model: string | undefined,
  systemInstruction: string,
  prompt: string,
  jsonMode: boolean = true
): Promise<{ success: boolean; data?: any; rawText?: string; error?: string }> {
  const base = (endpoint || "http://localhost:8888").replace(/\/$/, "");
  const targetModel = model || "unsloth-model";
  const chatUrl = base.endsWith("/v1") ? `${base}/chat/completions` : `${base}/v1/chat/completions`;

  try {
    const res = await fetchWithTimeout(
      chatUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: targetModel,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          response_format: jsonMode ? { type: "json_object" } : undefined,
        }),
      },
      12000
    );

    if (res.ok) {
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content || "";
      if (jsonMode) {
        try {
          const parsed = JSON.parse(content);
          return { success: true, data: parsed, rawText: content };
        } catch {
          const clean = content.replace(/```json\n?|\n?```/g, "").trim();
          const parsed = JSON.parse(clean);
          return { success: true, data: parsed, rawText: content };
        }
      }
      return { success: true, rawText: content };
    }
    return { success: false, error: `Unsloth returned HTTP ${res.status}` };
  } catch (err: any) {
    return { success: false, error: `Unsloth unavailable at ${base}: ${err.message}` };
  }
}

// 4. AnythingLLM Provider Invoker (Document ingestion & workspace agent, default base: http://localhost:3001/api/v1)
async function callAnythingLLM(
  endpoint: string | undefined,
  workspaceSlug: string | undefined,
  apiKey: string | undefined,
  systemInstruction: string,
  prompt: string,
  jsonMode: boolean = true
): Promise<{ success: boolean; data?: any; rawText?: string; error?: string }> {
  const base = (endpoint || "http://localhost:3001/api/v1").replace(/\/$/, "");
  const slug = workspaceSlug || "rcsa-workspace";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  // Try Workspace Chat API
  const workspaceChatUrl = `${base}/workspace/${slug}/chat`;
  try {
    const res = await fetchWithTimeout(
      workspaceChatUrl,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: `${systemInstruction}\n\nTask:\n${prompt}`,
          mode: "chat",
        }),
      },
      12000
    );

    if (res.ok) {
      const json = await res.json();
      const textResponse = json.textResponse || json.response || "";
      if (jsonMode) {
        try {
          const clean = textResponse.replace(/```json\n?|\n?```/g, "").trim();
          const parsed = JSON.parse(clean);
          return { success: true, data: parsed, rawText: textResponse };
        } catch {
          return { success: true, data: { response: textResponse }, rawText: textResponse };
        }
      }
      return { success: true, rawText: textResponse };
    }
  } catch (err: any) {
    console.warn(`[AnythingLLM workspace chat failed, trying openai compatible endpoint]:`, err.message);
  }

  // Try AnythingLLM OpenAI-compatible endpoint
  const openAiUrl = `${base}/openai/chat/completions`;
  try {
    const res = await fetchWithTimeout(
      openAiUrl,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: slug,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        }),
      },
      12000
    );

    if (res.ok) {
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content || "";
      if (jsonMode) {
        const clean = content.replace(/```json\n?|\n?```/g, "").trim();
        const parsed = JSON.parse(clean);
        return { success: true, data: parsed, rawText: content };
      }
      return { success: true, rawText: content };
    }
  } catch (err: any) {
    return { success: false, error: `AnythingLLM unavailable at ${base}: ${err.message}` };
  }

  return { success: false, error: `AnythingLLM failed at ${base}` };
}

// Unified multi-platform request dispatcher
async function executeUnifiedAI(
  aiSettings: LocalAIConfig | undefined,
  systemInstruction: string,
  prompt: string,
  geminiExecutor: () => Promise<any>
): Promise<{ success: boolean; source: string; data?: any; fallback?: boolean; message?: string }> {
  const mode = aiSettings?.mode || "gemini";

  if (aiSettings?.isAirGappedMode || mode === "offline_expert") {
    return {
      success: false,
      fallback: true,
      source: "offline_expert",
      message: "Air-Gapped mode active; using deterministic local expert engine.",
    };
  }

  // 1. Ollama Dispatch
  if (mode === "local_ollama") {
    const res = await callOllama(
      aiSettings?.ollamaEndpoint,
      aiSettings?.ollamaModel,
      systemInstruction,
      prompt,
      true
    );
    if (res.success && res.data) {
      return {
        success: true,
        source: `local_ollama (${aiSettings?.ollamaModel || "llama3:latest"})`,
        data: res.data,
      };
    }
    console.warn(`[Unified Dispatch] Ollama local call failed (${res.error}), attempting fallback.`);
  }

  // 2. LM Studio Dispatch
  if (mode === "local_lmstudio") {
    const res = await callLMStudio(
      aiSettings?.lmStudioEndpoint,
      aiSettings?.lmStudioModel,
      systemInstruction,
      prompt,
      true
    );
    if (res.success && res.data) {
      return {
        success: true,
        source: `local_lmstudio (${aiSettings?.lmStudioModel || "local-model"})`,
        data: res.data,
      };
    }
    console.warn(`[Unified Dispatch] LM Studio local call failed (${res.error}), attempting fallback.`);
  }

  // 3. Unsloth Dispatch (Developer-first, fast inference, QLoRA endpoints)
  if (mode === "local_unsloth") {
    const res = await callUnsloth(
      aiSettings?.unslothEndpoint,
      aiSettings?.unslothModel,
      systemInstruction,
      prompt,
      true
    );
    if (res.success && res.data) {
      return {
        success: true,
        source: `local_unsloth (${aiSettings?.unslothModel || "unsloth-model"})`,
        data: res.data,
      };
    }
    console.warn(`[Unified Dispatch] Unsloth local call failed (${res.error}), attempting fallback.`);
  }

  // 4. AnythingLLM Dispatch (RAG / Workspace agent)
  if (mode === "local_anythingllm") {
    const res = await callAnythingLLM(
      aiSettings?.anythingLlmEndpoint,
      aiSettings?.anythingLlmModel,
      aiSettings?.anythingLlmApiKey,
      systemInstruction,
      prompt,
      true
    );
    if (res.success && res.data) {
      return {
        success: true,
        source: `local_anythingllm (${aiSettings?.anythingLlmModel || "default"})`,
        data: res.data,
      };
    }
    console.warn(`[Unified Dispatch] AnythingLLM local call failed (${res.error}), attempting fallback.`);
  }

  // 5. Google Gemini Cloud API (Bounded / Delimited)
  if (mode === "gemini") {
    // If Gemini key is explicitly delimited / bypassed by the user:
    if (aiSettings?.delimitGeminiKey) {
      console.log("[Unified Dispatch] Gemini key delimited/bypassed. Routing to local endpoints...");
      // Auto-route across local endpoints: Ollama, LM Studio, Unsloth, AnythingLLM
      const ollamaRes = await callOllama(aiSettings?.ollamaEndpoint, aiSettings?.ollamaModel, systemInstruction, prompt, true);
      if (ollamaRes.success && ollamaRes.data) {
        return { success: true, source: `local_ollama [Gemini Delimited] (${aiSettings?.ollamaModel || "llama3:latest"})`, data: ollamaRes.data };
      }
      const lmRes = await callLMStudio(aiSettings?.lmStudioEndpoint, aiSettings?.lmStudioModel, systemInstruction, prompt, true);
      if (lmRes.success && lmRes.data) {
        return { success: true, source: `local_lmstudio [Gemini Delimited] (${aiSettings?.lmStudioModel || "local-model"})`, data: lmRes.data };
      }
      const unslothRes = await callUnsloth(aiSettings?.unslothEndpoint, aiSettings?.unslothModel, systemInstruction, prompt, true);
      if (unslothRes.success && unslothRes.data) {
        return { success: true, source: `local_unsloth [Gemini Delimited] (${aiSettings?.unslothModel || "unsloth-model"})`, data: unslothRes.data };
      }
      const anyRes = await callAnythingLLM(aiSettings?.anythingLlmEndpoint, aiSettings?.anythingLlmModel, aiSettings?.anythingLlmApiKey, systemInstruction, prompt, true);
      if (anyRes.success && anyRes.data) {
        return { success: true, source: `local_anythingllm [Gemini Delimited] (${aiSettings?.anythingLlmModel || "default"})`, data: anyRes.data };
      }
      return {
        success: false,
        fallback: true,
        source: "offline_expert",
        message: "Gemini API key is delimited; local endpoints unreachable. Using deterministic offline engine.",
      };
    }

    // Attempt Gemini Cloud Execution
    try {
      const geminiResult = await geminiExecutor();
      if (geminiResult) {
        return {
          success: true,
          source: "gemini-3.7-flash",
          data: geminiResult,
        };
      }
    } catch (err: any) {
      console.warn("[Unified Dispatch] Gemini call failed / quota reached:", err?.message);
      // Auto-fallback to local endpoints on quota limit or network timeout
      if (aiSettings?.fallbackToLocalOnQuota !== false) {
        console.log("[Unified Dispatch] Auto-falling back to local endpoints due to Gemini error/quota...");
        const ollamaRes = await callOllama(aiSettings?.ollamaEndpoint, aiSettings?.ollamaModel, systemInstruction, prompt, true);
        if (ollamaRes.success && ollamaRes.data) {
          return { success: true, source: `local_ollama [Quota Fallback] (${aiSettings?.ollamaModel || "llama3:latest"})`, data: ollamaRes.data };
        }
        const lmRes = await callLMStudio(aiSettings?.lmStudioEndpoint, aiSettings?.lmStudioModel, systemInstruction, prompt, true);
        if (lmRes.success && lmRes.data) {
          return { success: true, source: `local_lmstudio [Quota Fallback] (${aiSettings?.lmStudioModel || "local-model"})`, data: lmRes.data };
        }
        const unslothRes = await callUnsloth(aiSettings?.unslothEndpoint, aiSettings?.unslothModel, systemInstruction, prompt, true);
        if (unslothRes.success && unslothRes.data) {
          return { success: true, source: `local_unsloth [Quota Fallback] (${aiSettings?.unslothModel || "unsloth-model"})`, data: unslothRes.data };
        }
        const anyRes = await callAnythingLLM(aiSettings?.anythingLlmEndpoint, aiSettings?.anythingLlmModel, aiSettings?.anythingLlmApiKey, systemInstruction, prompt, true);
        if (anyRes.success && anyRes.data) {
          return { success: true, source: `local_anythingllm [Quota Fallback] (${aiSettings?.anythingLlmModel || "default"})`, data: anyRes.data };
        }
      }
    }
  }

  return {
    success: false,
    fallback: true,
    source: "offline_expert",
    message: "Configured AI endpoints unavailable; fallback to heuristic deterministic engine.",
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    ensureDbStorage();
    const stat = fs.existsSync(ASSESSMENTS_FILE) ? fs.statSync(ASSESSMENTS_FILE) : null;
    const assessments = readAssessments();

    res.json({
      status: "ok",
      platform: "Custom RCSA by Technoscope",
      framework: "NIST SP 800-53 Rev. 5 & CSA CCM v4.1.0",
      timestamp: new Date().toISOString(),
      hasGeminiApiKey: Boolean(process.env.GEMINI_API_KEY),
      database: {
        status: "ready",
        engine: "Local JSON Document Database",
        storagePath: "data/assessments.json",
        totalAssessments: assessments.length,
        sizeBytes: stat?.size || 0,
      },
      supportedLocalPlatforms: [
        { name: "Ollama", defaultBaseUrl: "http://localhost:11434", nativeApi: "http://localhost:11434/api", openAiApi: "http://localhost:11434/v1", purpose: "CLI-first, lightweight model management, fast background inference" },
        { name: "LM Studio", defaultBaseUrl: "http://localhost:1234/v1", purpose: "Desktop GUI-first, search & test GGUF models with zero terminal configuration" },
        { name: "Unsloth", defaultBaseUrl: "http://localhost:8888", openAiApi: "http://localhost:8888/v1", purpose: "Fast low-VRAM fine-tuning (QLoRA) and high-performance local inference" },
        { name: "AnythingLLM", defaultBaseUrl: "http://localhost:3001/api", webUi: "http://localhost:3001", purpose: "All-in-one RAG workspace application consuming local engines" },
      ],
    });
  });

  // -------------------------------------------------------------
  // LOCAL FILE DATABASE STORAGE ENGINE (/data/assessments.json)
  // -------------------------------------------------------------
  const DATA_DIR = path.join(process.cwd(), "data");
  const ASSESSMENTS_FILE = path.join(DATA_DIR, "assessments.json");
  const DB_META_FILE = path.join(DATA_DIR, "db-meta.json");

  function ensureDbStorage() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(ASSESSMENTS_FILE)) {
        fs.writeFileSync(ASSESSMENTS_FILE, JSON.stringify([], null, 2), "utf8");
      }
    } catch (err: any) {
      console.error("[DB Storage Error] Failed to initialize data directory:", err.message);
    }
  }

  // Initialize DB on boot
  ensureDbStorage();

  function readAssessments(): any[] {
    ensureDbStorage();
    try {
      const raw = fs.readFileSync(ASSESSMENTS_FILE, "utf8");
      if (!raw.trim()) return [];
      return JSON.parse(raw);
    } catch (err: any) {
      console.warn("[DB Storage] Error reading assessments.json:", err.message);
      return [];
    }
  }

  function writeAssessments(assessments: any[]) {
    ensureDbStorage();
    fs.writeFileSync(ASSESSMENTS_FILE, JSON.stringify(assessments, null, 2), "utf8");
  }

  function getActiveAssessmentId(): string | null {
    ensureDbStorage();
    try {
      if (fs.existsSync(DB_META_FILE)) {
        const meta = JSON.parse(fs.readFileSync(DB_META_FILE, "utf8"));
        return meta.activeAssessmentId || null;
      }
    } catch {}
    return null;
  }

  function setActiveAssessmentId(id: string) {
    ensureDbStorage();
    try {
      const meta = fs.existsSync(DB_META_FILE) ? JSON.parse(fs.readFileSync(DB_META_FILE, "utf8")) : {};
      meta.activeAssessmentId = id;
      meta.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DB_META_FILE, JSON.stringify(meta, null, 2), "utf8");
    } catch {}
  }

  // 1. DB Health & Metrics Endpoint
  app.get("/api/db/status", (_req, res) => {
    ensureDbStorage();
    try {
      const stat = fs.existsSync(ASSESSMENTS_FILE) ? fs.statSync(ASSESSMENTS_FILE) : null;
      const assessments = readAssessments();
      const activeId = getActiveAssessmentId();
      res.json({
        status: "healthy",
        engine: "Local JSON Document Database",
        filePath: "data/assessments.json",
        fullPath: ASSESSMENTS_FILE,
        exists: Boolean(stat),
        totalAssessments: assessments.length,
        sizeBytes: stat?.size || 0,
        lastModified: stat?.mtime?.toISOString() || null,
        activeAssessmentId: activeId,
        assessmentsSummary: assessments.map((a: any) => ({
          id: a.id,
          system: a.organizationProfile?.targetSystem || a.targetSystem || "Enterprise System",
          sector: a.organizationProfile?.sector || "Technology",
          totalControls: a.controls?.length || 0,
          timestamp: a.timestamp,
          complianceTarget: a.organizationProfile?.complianceTarget,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ status: "error", error: err.message });
    }
  });

  // 2. List all assessments in DB
  app.get("/api/assessments", (_req, res) => {
    try {
      const assessments = readAssessments();
      const activeId = getActiveAssessmentId();
      res.json({
        success: true,
        assessments,
        activeAssessmentId: activeId,
        count: assessments.length,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Get currently active assessment
  app.get("/api/assessments/active", (_req, res) => {
    try {
      const assessments = readAssessments();
      const activeId = getActiveAssessmentId();
      let active = null;
      if (activeId) {
        active = assessments.find((a: any) => a.id === activeId);
      }
      if (!active && assessments.length > 0) {
        active = assessments[0];
      }
      res.json({
        success: true,
        assessment: active,
        activeAssessmentId: active?.id || null,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. Get specific assessment by ID
  app.get("/api/assessments/:id", (req, res) => {
    try {
      const assessments = readAssessments();
      const found = assessments.find((a: any) => a.id === req.params.id);
      if (!found) {
        return res.status(404).json({ success: false, message: `Assessment '${req.params.id}' not found in DB` });
      }
      res.json({ success: true, assessment: found });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Save or Update Assessment in DB (Upsert)
  app.post("/api/assessments", (req, res) => {
    try {
      const payload = req.body?.assessment || req.body;
      if (!payload || !payload.id) {
        return res.status(400).json({ success: false, message: "Invalid assessment payload: 'id' is required." });
      }
      const makeActive = req.body?.makeActive !== false;
      const assessments = readAssessments();
      const existingIndex = assessments.findIndex((a: any) => a.id === payload.id);

      const updated = {
        ...payload,
        lastModified: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        assessments[existingIndex] = updated;
      } else {
        assessments.push(updated);
      }

      writeAssessments(assessments);
      if (makeActive) {
        setActiveAssessmentId(updated.id);
      }

      res.json({
        success: true,
        assessment: updated,
        totalCount: assessments.length,
        action: existingIndex >= 0 ? "updated" : "created",
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Set Active Assessment in DB
  app.post("/api/assessments/active/:id", (req, res) => {
    try {
      const { id } = req.params;
      const assessments = readAssessments();
      const found = assessments.find((a: any) => a.id === id);
      if (!found) {
        return res.status(404).json({ success: false, message: `Assessment '${id}' not found in DB` });
      }
      setActiveAssessmentId(id);
      res.json({ success: true, activeAssessmentId: id, assessment: found });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Delete Assessment from DB
  app.delete("/api/assessments/:id", (req, res) => {
    try {
      const { id } = req.params;
      const assessments = readAssessments();
      const filtered = assessments.filter((a: any) => a.id !== id);
      if (filtered.length === assessments.length) {
        return res.status(404).json({ success: false, message: `Assessment '${id}' not found in DB` });
      }
      writeAssessments(filtered);
      const activeId = getActiveAssessmentId();
      if (activeId === id) {
        const nextActive = filtered.length > 0 ? filtered[0].id : null;
        if (nextActive) setActiveAssessmentId(nextActive);
      }
      res.json({ success: true, totalCount: filtered.length, deletedId: id });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 8. Seed Database endpoint
  app.post("/api/db/seed", (req, res) => {
    try {
      const { assessment } = req.body;
      const assessments = readAssessments();
      if (assessments.length === 0 && assessment) {
        writeAssessments([assessment]);
        setActiveAssessmentId(assessment.id);
        return res.json({ success: true, message: "Database initialized with baseline assessment", totalCount: 1 });
      }
      return res.json({ success: true, message: "Database already populated", totalCount: assessments.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // -------------------------------------------------------------
  // LOCAL AI PLATFORM DEDICATED ENDPOINTS & PROXIES
  // -------------------------------------------------------------

  // Comprehensive health matrix for all local AI platforms + cloud Gemini
  app.get("/api/local-ai/status", async (_req, res) => {
    const checkPlatform = async (url: string) => {
      try {
        const r = await fetchWithTimeout(url, { method: "GET" }, 2500);
        return r.ok;
      } catch {
        return false;
      }
    };

    const [ollamaUp, lmStudioUp, unslothUp, anythingLlmUp] = await Promise.all([
      checkPlatform("http://localhost:11434/api/tags"),
      checkPlatform("http://localhost:1234/v1/models"),
      checkPlatform("http://localhost:8888/v1/models"),
      checkPlatform("http://localhost:3001/api/v1/auth"),
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      platforms: {
        ollama: {
          name: "Ollama",
          defaultBaseUrl: "http://localhost:11434",
          nativeApiPath: "http://localhost:11434/api",
          openAiApiPath: "http://localhost:11434/v1",
          purpose: "CLI-first, lightweight command-line model management and fast inference",
          online: ollamaUp,
          port: 11434,
        },
        lmStudio: {
          name: "LM Studio",
          defaultBaseUrl: "http://localhost:1234/v1",
          openAiApiPath: "http://localhost:1234/v1",
          purpose: "Desktop GUI-first, test GGUF models with zero terminal configuration",
          online: lmStudioUp,
          port: 1234,
        },
        unsloth: {
          name: "Unsloth (Unsloth Studio)",
          defaultBaseUrl: "http://localhost:8888",
          openAiApiPath: "http://localhost:8888/v1",
          purpose: "Fast low-VRAM fine-tuning (QLoRA) and high-performance local inference",
          online: unslothUp,
          port: 8888,
        },
        anythingLlm: {
          name: "AnythingLLM",
          defaultBaseUrl: "http://localhost:3001/api",
          webUiUrl: "http://localhost:3001",
          purpose: "All-in-one RAG workspace application consuming local backends",
          online: anythingLlmUp,
          port: 3001,
        },
        gemini: {
          name: "Google Gemini 3.7 Flash",
          type: "cloud_gemini",
          available: Boolean(process.env.GEMINI_API_KEY),
          model: "gemini-3.7-flash",
          delimitable: true,
        },
      },
    });
  });

  // --- 1. OLLAMA PROXIES ---
  // Ollama Health
  app.get("/api/local-ai/ollama/health", async (req, res) => {
    const endpoint = (req.query.endpoint as string) || "http://localhost:11434";
    const clean = endpoint.replace(/\/v1$/, "").replace(/\/$/, "");
    try {
      const ping = await fetchWithTimeout(`${clean}/api/tags`, {}, 3000);
      if (ping.ok) {
        const json = await ping.json();
        return res.json({ status: "online", endpoint: clean, models: json.models || [] });
      }
      return res.json({ status: "offline", endpoint: clean, message: `HTTP ${ping.status}` });
    } catch (err: any) {
      return res.json({ status: "offline", endpoint: clean, error: err.message });
    }
  });

  // Ollama List Models
  app.get("/api/local-ai/ollama/models", async (req, res) => {
    const endpoint = (req.query.endpoint as string) || "http://localhost:11434";
    const clean = endpoint.replace(/\/v1$/, "").replace(/\/$/, "");
    try {
      const response = await fetchWithTimeout(`${clean}/api/tags`, {}, 4000);
      if (response.ok) {
        const json = await response.json();
        const models = (json.models || []).map((m: any) => ({
          name: m.name,
          size: m.size,
          modified_at: m.modified_at,
          digest: m.digest,
        }));
        return res.json({ success: true, models });
      }
      return res.status(200).json({ success: false, models: [], message: "Ollama daemon unreachable" });
    } catch (e: any) {
      return res.status(200).json({ success: false, models: [], error: e.message });
    }
  });

  // Ollama Chat Proxy (OpenAI-compatible /v1/chat/completions)
  app.post("/api/local-ai/ollama/chat", async (req, res) => {
    const { endpoint, model, messages, temperature, format } = req.body;
    const base = (endpoint || "http://localhost:11434/v1").replace(/\/$/, "");
    const chatUrl = base.endsWith("/v1") ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
    try {
      const response = await fetchWithTimeout(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "llama3:latest",
          messages,
          temperature: temperature ?? 0.2,
          response_format: format === "json" ? { type: "json_object" } : undefined,
        }),
      }, 15000);
      const json = await response.json();
      return res.json(json);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // Ollama Generate Proxy (Native /api/generate)
  app.post("/api/local-ai/ollama/generate", async (req, res) => {
    const { endpoint, model, prompt, system, format } = req.body;
    const clean = (endpoint || "http://localhost:11434").replace(/\/v1$/, "").replace(/\/$/, "");
    try {
      const response = await fetchWithTimeout(`${clean}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "llama3:latest",
          prompt,
          system,
          stream: false,
          format: format === "json" ? "json" : undefined,
        }),
      }, 15000);
      const json = await response.json();
      return res.json(json);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // --- 2. LM STUDIO PROXIES ---
  // LM Studio Health
  app.get("/api/local-ai/lmstudio/health", async (req, res) => {
    const endpoint = (req.query.endpoint as string) || "http://localhost:1234/v1";
    const clean = endpoint.replace(/\/$/, "");
    const modelsUrl = clean.endsWith("/v1") ? `${clean}/models` : `${clean}/v1/models`;
    try {
      const ping = await fetchWithTimeout(modelsUrl, {}, 3000);
      if (ping.ok) {
        const json = await ping.json();
        return res.json({ status: "online", endpoint: clean, models: json.data || [] });
      }
      return res.json({ status: "offline", endpoint: clean, message: `HTTP ${ping.status}` });
    } catch (err: any) {
      return res.json({ status: "offline", endpoint: clean, error: err.message });
    }
  });

  // LM Studio List Models
  app.get("/api/local-ai/lmstudio/models", async (req, res) => {
    const endpoint = (req.query.endpoint as string) || "http://localhost:1234/v1";
    const clean = endpoint.replace(/\/$/, "");
    const modelsUrl = clean.endsWith("/v1") ? `${clean}/models` : `${clean}/v1/models`;
    try {
      const response = await fetchWithTimeout(modelsUrl, {}, 4000);
      if (response.ok) {
        const json = await response.json();
        return res.json({ success: true, models: json.data || [] });
      }
      return res.status(200).json({ success: false, models: [], message: "LM Studio local server unreachable" });
    } catch (e: any) {
      return res.status(200).json({ success: false, models: [], error: e.message });
    }
  });

  // LM Studio Chat Proxy
  app.post("/api/local-ai/lmstudio/chat", async (req, res) => {
    const { endpoint, model, messages, temperature, format } = req.body;
    const base = (endpoint || "http://localhost:1234/v1").replace(/\/$/, "");
    const chatUrl = base.endsWith("/v1") ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
    try {
      const response = await fetchWithTimeout(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "local-model",
          messages,
          temperature: temperature ?? 0.2,
          response_format: format === "json" ? { type: "json_object" } : undefined,
        }),
      }, 15000);
      const json = await response.json();
      return res.json(json);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // --- 3. ANYTHINGLLM PROXIES ---
  // AnythingLLM Health
  app.get("/api/local-ai/anythingllm/health", async (req, res) => {
    const endpoint = (req.query.endpoint as string) || "http://localhost:3001/api/v1";
    const clean = endpoint.replace(/\/$/, "");
    const authUrl = `${clean}/auth`;
    try {
      const ping = await fetchWithTimeout(authUrl, {}, 3000);
      return res.json({ status: ping.ok ? "online" : "offline", endpoint: clean });
    } catch (err: any) {
      return res.json({ status: "offline", endpoint: clean, error: err.message });
    }
  });

  // AnythingLLM List Workspaces
  app.get("/api/local-ai/anythingllm/workspaces", async (req, res) => {
    const endpoint = (req.query.endpoint as string) || "http://localhost:3001/api/v1";
    const apiKey = (req.query.apiKey as string) || "";
    const clean = endpoint.replace(/\/$/, "");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    try {
      const response = await fetchWithTimeout(`${clean}/workspaces`, { headers }, 4000);
      if (response.ok) {
        const json = await response.json();
        return res.json({ success: true, workspaces: json.workspaces || [] });
      }
      return res.status(200).json({ success: false, workspaces: [] });
    } catch (e: any) {
      return res.status(200).json({ success: false, workspaces: [], error: e.message });
    }
  });

  // AnythingLLM Document Ingestion Proxy
  app.post("/api/local-ai/anythingllm/ingest", async (req, res) => {
    const { endpoint, apiKey, workspaceSlug, documentText, title } = req.body;
    const clean = (endpoint || "http://localhost:3001/api/v1").replace(/\/$/, "");
    const slug = workspaceSlug || "rcsa-workspace";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    try {
      const response = await fetchWithTimeout(`${clean}/document/raw-text`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          textContent: documentText,
          metadata: {
            title: title || "RCSA Assessment Document",
            timestamp: new Date().toISOString(),
            source: "Technoscope RCSA Studio",
          },
          workspace: slug,
        }),
      }, 15000);

      const json = await response.json();
      return res.json({ success: true, data: json });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // AnythingLLM Chat / Query Proxy
  app.post("/api/local-ai/anythingllm/chat", async (req, res) => {
    const { endpoint, apiKey, workspaceSlug, message, mode } = req.body;
    const clean = (endpoint || "http://localhost:3001/api/v1").replace(/\/$/, "");
    const slug = workspaceSlug || "rcsa-workspace";
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    try {
      const response = await fetchWithTimeout(`${clean}/workspace/${slug}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message,
          mode: mode || "chat",
        }),
      }, 15000);

      const json = await response.json();
      return res.json({ success: true, data: json });
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e.message });
    }
  });

  // --- 4. UNSLOTH PROXIES ---
  // Unsloth Health
  app.get("/api/local-ai/unsloth/health", async (req, res) => {
    const endpoint = (req.query.endpoint as string) || "http://localhost:8888";
    const clean = endpoint.replace(/\/$/, "");
    const modelsUrl = clean.endsWith("/v1") ? `${clean}/models` : `${clean}/v1/models`;
    try {
      const ping = await fetchWithTimeout(modelsUrl, {}, 3000);
      if (ping.ok) {
        const json = await ping.json();
        return res.json({ status: "online", endpoint: clean, models: json.data || [] });
      }
      return res.json({ status: "offline", endpoint: clean, message: `HTTP ${ping.status}` });
    } catch (err: any) {
      return res.json({ status: "offline", endpoint: clean, error: err.message });
    }
  });

  // Unsloth List Models
  app.get("/api/local-ai/unsloth/models", async (req, res) => {
    const endpoint = (req.query.endpoint as string) || "http://localhost:8888";
    const clean = endpoint.replace(/\/$/, "");
    const modelsUrl = clean.endsWith("/v1") ? `${clean}/models` : `${clean}/v1/models`;
    try {
      const response = await fetchWithTimeout(modelsUrl, {}, 4000);
      if (response.ok) {
        const json = await response.json();
        return res.json({ success: true, models: json.data || [] });
      }
      return res.status(200).json({ success: false, models: [], message: "Unsloth local server unreachable" });
    } catch (e: any) {
      return res.status(200).json({ success: false, models: [], error: e.message });
    }
  });

  // Unsloth Chat Proxy
  app.post("/api/local-ai/unsloth/chat", async (req, res) => {
    const { endpoint, model, messages, temperature, format } = req.body;
    const base = (endpoint || "http://localhost:8888").replace(/\/$/, "");
    const chatUrl = base.endsWith("/v1") ? `${base}/chat/completions` : `${base}/v1/chat/completions`;
    try {
      const response = await fetchWithTimeout(chatUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "unsloth-model",
          messages,
          temperature: temperature ?? 0.2,
          response_format: format === "json" ? { type: "json_object" } : undefined,
        }),
      }, 15000);
      const json = await response.json();
      return res.json(json);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // --- 5. ENDPOINT PING & DIAGNOSTIC TEST ---
  app.post("/api/local-ai/test-connection", async (req, res) => {
    const { platform, endpoint, model, apiKey } = req.body;
    const startTime = Date.now();

    try {
      if (platform === "offline_expert") {
        return res.json({
          success: true,
          pingMs: 1,
          status: "ready",
          message: "Air-Gapped deterministic engine active (100% offline, zero network)",
        });
      }

      if (platform === "gemini") {
        const hasKey = Boolean(process.env.GEMINI_API_KEY);
        if (!hasKey) {
          return res.json({
            success: false,
            pingMs: 0,
            status: "missing_key",
            message: "GEMINI_API_KEY environment variable is not set. Cloud calls will be delimited/disabled.",
          });
        }
        return res.json({
          success: true,
          pingMs: 5,
          status: "ready",
          message: "Google Gemini Cloud Client initialized (gemini-3.7-flash)",
        });
      }

      if (platform === "local_ollama") {
        const clean = (endpoint || "http://localhost:11434").replace(/\/v1$/, "").replace(/\/$/, "");
        const check = await fetchWithTimeout(`${clean}/api/tags`, {}, 4000);
        const pingMs = Date.now() - startTime;
        if (check.ok) {
          const json = await check.json();
          const count = json.models?.length || 0;
          return res.json({
            success: true,
            pingMs,
            status: "online",
            message: `Ollama reachable on port 11434 (${count} local models available)`,
            models: (json.models || []).map((m: any) => m.name),
          });
        }
        return res.json({
          success: false,
          pingMs,
          status: "offline",
          message: `Ollama returned HTTP ${check.status}. Check if 'ollama serve' is running.`,
        });
      }

      if (platform === "local_lmstudio") {
        const clean = (endpoint || "http://localhost:1234/v1").replace(/\/$/, "");
        const url = clean.endsWith("/v1") ? `${clean}/models` : `${clean}/v1/models`;
        const check = await fetchWithTimeout(url, {}, 4000);
        const pingMs = Date.now() - startTime;
        if (check.ok) {
          const json = await check.json();
          const count = json.data?.length || 0;
          return res.json({
            success: true,
            pingMs,
            status: "online",
            message: `LM Studio reachable on port 1234 (${count} loaded models available)`,
            models: (json.data || []).map((m: any) => m.id),
          });
        }
        return res.json({
          success: false,
          pingMs,
          status: "offline",
          message: `LM Studio returned HTTP ${check.status}. Check if Local Server is started.`,
        });
      }

      if (platform === "local_unsloth") {
        const clean = (endpoint || "http://localhost:8888").replace(/\/$/, "");
        const url = clean.endsWith("/v1") ? `${clean}/models` : `${clean}/v1/models`;
        const check = await fetchWithTimeout(url, {}, 4000);
        const pingMs = Date.now() - startTime;
        if (check.ok) {
          const json = await check.json();
          const count = json.data?.length || 0;
          return res.json({
            success: true,
            pingMs,
            status: "online",
            message: `Unsloth Studio reachable on port 8888 (${count} models detected)`,
            models: (json.data || []).map((m: any) => m.id),
          });
        }
        return res.json({
          success: false,
          pingMs,
          status: "offline",
          message: `Unsloth returned HTTP ${check.status}. Check if 'unsloth start' is running on port 8888.`,
        });
      }

      if (platform === "local_anythingllm") {
        const clean = (endpoint || "http://localhost:3001/api").replace(/\/$/, "");
        const authUrl = clean.endsWith("/v1") ? `${clean}/auth` : `${clean}/v1/auth`;
        const check = await fetchWithTimeout(authUrl, {}, 4000);
        const pingMs = Date.now() - startTime;
        return res.json({
          success: check.ok,
          pingMs,
          status: check.ok ? "online" : "offline",
          message: check.ok
            ? "AnythingLLM instance reachable on port 3001"
            : `AnythingLLM returned HTTP ${check.status}. Check if AnythingLLM app is running.`,
        });
      }

      return res.json({
        success: false,
        pingMs: Date.now() - startTime,
        status: "unknown_platform",
        message: `Unknown provider '${platform}'`,
      });
    } catch (e: any) {
      return res.json({
        success: false,
        pingMs: Date.now() - startTime,
        status: "offline",
        message: `Connection failed: ${e.message}`,
      });
    }
  });

  // --- 6. UNIFIED LOCAL/CLOUD AI EXECUTOR ---
  app.post("/api/local-ai/execute", async (req, res) => {
    const { platform, endpoint, model, apiKey, workspaceSlug, systemInstruction, prompt, format, delimitGeminiKey } = req.body;
    const aiConfig: LocalAIConfig = {
      mode: platform,
      ollamaEndpoint: endpoint,
      ollamaModel: model,
      lmStudioEndpoint: endpoint,
      lmStudioModel: model,
      unslothEndpoint: endpoint,
      unslothModel: model,
      anythingLlmEndpoint: endpoint,
      anythingLlmModel: workspaceSlug || model,
      anythingLlmApiKey: apiKey,
      delimitGeminiKey: delimitGeminiKey,
    };

    const result = await executeUnifiedAI(
      aiConfig,
      systemInstruction || "You are a senior NIST SP 800-53 compliance and cybersecurity risk assessor. Respond in valid JSON.",
      prompt,
      async () => {
        const ai = getGeminiClient();
        if (!ai) return null;
        const { data } = await executeGeminiWithRetry(() =>
          ai.models.generateContent({
            model: "gemini-3.7-flash",
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: format === "json" ? "application/json" : "text/plain",
            },
          })
        );
        return data?.text ? (format === "json" ? JSON.parse(data.text) : data.text) : null;
      }
    );

    return res.json(result);
  });

  // -------------------------------------------------------------
  // PRIMARY UNIFIED SERVER-SIDE AI REASONING ENDPOINTS
  // -------------------------------------------------------------

  // 1. AI Remediation generation endpoint
  app.post("/api/gemini/remediate", async (req, res) => {
    try {
      const { assessment, sector, focusControls, aiSettings } = req.body;

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

      const systemInstruction = `You are an expert compliance auditor, cybersecurity architect, and risk specialist for NIST SP 800-53 Rev. 5 and CSA CCM v4.1.0.
Given a list of identified control deficiencies and risk assessments across Privacy, Cyber, and InfoSec domains, formulate a comprehensive, actionable, and structured remediation roadmap in JSON format.
For each control, provide:
1. priority (P0_IMMEDIATE, P1_HIGH, P2_MEDIUM, P3_LOW)
2. target_control (e.g. AC-2, PT-2)
3. control_title
4. gap_summary (clear root cause summary)
5. technical_remediation_action (concrete technical & configuration steps)
6. compensating_control (short-term mitigating mechanism)
7. estimated_residual_reduction (numerical estimate of risk score points reduced)
8. implementation_timeline (e.g. "1-2 Weeks", "30 Days")
9. validation_criteria (how auditors will verify remediation evidence)

JSON structure:
{
  "executive_summary": "...",
  "sector_regulatory_notes": "...",
  "remediation_roadmap": [
    {
      "priority": "P1_HIGH",
      "target_control": "AC-2",
      "control_title": "Account Management",
      "gap_summary": "...",
      "technical_remediation_action": "...",
      "compensating_control": "...",
      "estimated_residual_reduction": 4.5,
      "implementation_timeline": "30 Days",
      "validation_criteria": "..."
    }
  ]
}`;

      const promptText = `Please generate a structured NIST SP 800-53 Rev. 5 remediation roadmap for the following assessed deficiencies:\n${JSON.stringify(promptContext, null, 2)}`;

      const result = await executeUnifiedAI(
        aiSettings,
        systemInstruction,
        promptText,
        async () => {
          const ai = getGeminiClient();
          if (!ai) return null;
          const { data: response } = await executeGeminiWithRetry(() =>
            ai.models.generateContent({
              model: "gemini-3.7-flash",
              contents: promptText,
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
            })
          );
          return response?.text ? JSON.parse(response.text.trim()) : null;
        }
      );

      return res.json(result);
    } catch (error: any) {
      console.warn("Remediate Catch Handler:", error?.message);
      return res.status(200).json({
        success: false,
        fallback: true,
        message: error?.message || "Fallback activated",
      });
    }
  });

  // 2. Proactive Mitigation Suggestions endpoint
  app.post("/api/gemini/mitigation-suggestions", async (req, res) => {
    try {
      const { assessment, domain, sector, strategyFilter, aiSettings } = req.body;

      const domainControls = (assessment?.controls || []).filter((c: any) =>
        !domain || domain === "ALL" ? true : c.domain === domain
      );

      const promptContext = {
        organization: assessment?.organizationProfile || {
          sector: sector || "Technology",
          targetSystem: "Enterprise System",
          complianceTarget: "NIST SP 800-53 Rev. 5 / CSA CCM v4.1.0",
        },
        targetDomain: domain || "ALL",
        strategyFilter: strategyFilter || "ALL",
        assessedDomainControls: domainControls.map((c: any) => ({
          controlId: c.controlId,
          title: c.title,
          family: c.family,
          domain: c.domain,
          inherentRisk: c.inherentRisk,
          cef: c.cef,
          residualRisk: c.residualRisk,
          designEffectiveness: c.designEffectiveness,
          operatingEffectiveness: c.operatingEffectiveness,
          deficiencyPenalty: c.deficiencyPenalty,
          gapsIdentified: c.gapsIdentified || "Open finding or baseline hardening requirement",
        })),
        totalControlsInScope: domainControls.length,
      };

      const systemInstruction = `You are a Principal Cybersecurity Architect, CISO Advisor, and Lead NIST SP 800-53 Rev. 5 / CSA CCM v4.1.0 Specialist.
Generate structured proactive security control mitigation recommendations tailored specifically for the selected domain (${domain || "All Domains"}) and sector.
Proactive mitigations should move beyond reactive patching into architectural defense-in-depth, zero-trust enforcement, automated telemetry ingestion, continuous configuration validation, and hardware-backed safeguards.

Output format (strict JSON):
{
  "domainExecutiveBrief": "Concise CISO-level briefing on proactive domain defense posture",
  "threatContext": "Current threat actor tactics, techniques, and procedures (TTPs)",
  "overallMaturityScore": 78,
  "proactiveVsReactiveRatio": "75% Proactive / 25% Reactive",
  "estimatedAggregateRiskReduction": 38.5,
  "frameworkMappings": {
    "nistSp80053": ["AC-2", "IA-2", "SC-7"],
    "csaCcm": ["IAM-01", "DSP-03"],
    "iso27001": ["A.9.1", "A.10.1"]
  },
  "suggestions": [
    {
      "id": "mit-1",
      "targetControlId": "AC-2",
      "controlTitle": "Account Management",
      "domain": "Cybersecurity",
      "strategyType": "ARCHITECTURAL_PREVENTION",
      "title": "Automated Just-In-Time Ephemeral Credentials",
      "urgency": "IMMEDIATE",
      "inherentRisk": 20,
      "currentResidualRisk": 16,
      "projectedResidualRisk": 4.8,
      "estimatedCEFImprovement": 0.45,
      "vulnerabilityAddressed": "...",
      "proactiveStrategy": "...",
      "technicalImplementation": "...",
      "configurationSnippet": "...",
      "compensatingSafeguard": "...",
      "defenseMultiplier": "3.5x Risk Reduction",
      "auditValidationMetric": "...",
      "implementationCost": "$$"
    }
  ]
}`;

      const promptText = `Generate proactive security mitigation recommendations for the following domain and controls context:\n${JSON.stringify(promptContext, null, 2)}`;

      const result = await executeUnifiedAI(
        aiSettings,
        systemInstruction,
        promptText,
        async () => {
          const ai = getGeminiClient();
          if (!ai) return null;
          const { data: response } = await executeGeminiWithRetry(() =>
            ai.models.generateContent({
              model: "gemini-3.7-flash",
              contents: promptText,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    domainExecutiveBrief: { type: Type.STRING },
                    threatContext: { type: Type.STRING },
                    overallMaturityScore: { type: Type.NUMBER },
                    proactiveVsReactiveRatio: { type: Type.STRING },
                    estimatedAggregateRiskReduction: { type: Type.NUMBER },
                    frameworkMappings: {
                      type: Type.OBJECT,
                      properties: {
                        nistSp80053: { type: Type.ARRAY, items: { type: Type.STRING } },
                        csaCcm: { type: Type.ARRAY, items: { type: Type.STRING } },
                        iso27001: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ["nistSp80053", "csaCcm", "iso27001"],
                    },
                    suggestions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          targetControlId: { type: Type.STRING },
                          controlTitle: { type: Type.STRING },
                          domain: { type: Type.STRING },
                          strategyType: { type: Type.STRING },
                          title: { type: Type.STRING },
                          urgency: { type: Type.STRING },
                          inherentRisk: { type: Type.NUMBER },
                          currentResidualRisk: { type: Type.NUMBER },
                          projectedResidualRisk: { type: Type.NUMBER },
                          estimatedCEFImprovement: { type: Type.NUMBER },
                          vulnerabilityAddressed: { type: Type.STRING },
                          proactiveStrategy: { type: Type.STRING },
                          technicalImplementation: { type: Type.STRING },
                          configurationSnippet: { type: Type.STRING },
                          compensatingSafeguard: { type: Type.STRING },
                          defenseMultiplier: { type: Type.STRING },
                          auditValidationMetric: { type: Type.STRING },
                          implementationCost: { type: Type.STRING },
                        },
                        required: [
                          "id",
                          "targetControlId",
                          "controlTitle",
                          "domain",
                          "strategyType",
                          "title",
                          "urgency",
                          "inherentRisk",
                          "currentResidualRisk",
                          "projectedResidualRisk",
                          "vulnerabilityAddressed",
                          "proactiveStrategy",
                          "technicalImplementation",
                          "compensatingSafeguard",
                          "defenseMultiplier",
                          "auditValidationMetric",
                          "implementationCost",
                        ],
                      },
                    },
                  },
                  required: [
                    "domainExecutiveBrief",
                    "threatContext",
                    "overallMaturityScore",
                    "proactiveVsReactiveRatio",
                    "estimatedAggregateRiskReduction",
                    "suggestions",
                    "frameworkMappings",
                  ],
                },
              },
            })
          );
          return response?.text ? JSON.parse(response.text.trim()) : null;
        }
      );

      return res.json(result);
    } catch (error: any) {
      console.warn("Mitigation Suggestions Catch Handler:", error?.message);
      return res.status(200).json({
        success: false,
        fallback: true,
        message: error?.message || "Fallback activated",
      });
    }
  });

  // 3. RCSA Questionnaire Ingestion & Semantic Chunking Endpoint
  app.post("/api/gemini/ingest-questionnaire", async (req, res) => {
    try {
      const { rawContent, format, aiSettings } = req.body;

      if (!rawContent) {
        return res.status(200).json({
          success: false,
          fallback: true,
          message: "Empty questionnaire content provided.",
        });
      }

      const systemInstruction = `You are an expert Risk and Control Self-Assessment (RCSA) Ingestion Engine.
Process user-uploaded custom questionnaires, normalize content into strict integrated RCSA items, compute risk levels, and output in JSON:
{
  "source_upload_metadata": {
    "total_chunks_extracted": 12,
    "primary_domains_identified": ["Access Control", "Data Protection"]
  },
  "integrated_rcsa_items": [
    {
      "id": "CUST-RCSA-001",
      "original_chunk_text": "...",
      "domain": "Access Control",
      "assessment_question": "...",
      "control_type": "Preventive",
      "risk_calculations": {
        "likelihood": 3,
        "impact": 4,
        "inherent_risk_score": 12,
        "inherent_risk_level": "Medium",
        "control_effectiveness_weight": 0.7,
        "projected_residual_risk_score": 3.6,
        "residual_risk_level": "Low"
      },
      "mapping_tags": ["NIST AC-2", "ISO A.9.1"]
    }
  ]
}`;

      const promptText = `Process and normalize the following custom questionnaire text into strict integrated RCSA items format (format: ${format || 'unstructured'}):\n\n${rawContent}`;

      const result = await executeUnifiedAI(
        aiSettings,
        systemInstruction,
        promptText,
        async () => {
          const ai = getGeminiClient();
          if (!ai) return null;
          const { data: response } = await executeGeminiWithRetry(() =>
            ai.models.generateContent({
              model: "gemini-3.7-flash",
              contents: promptText,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
              },
            })
          );
          return response?.text ? JSON.parse(response.text.trim()) : null;
        }
      );

      return res.json(result);
    } catch (error: any) {
      console.warn("Ingest Catch Handler:", error?.message);
      return res.status(200).json({
        success: false,
        fallback: true,
        message: error?.message || "Fallback activated",
      });
    }
  });

  // 4. AI Executive Summary Endpoint
  app.post("/api/ai/summary", async (req, res) => {
    try {
      const { assessment, aiSettings } = req.body;
      const controls = assessment?.controls || [];
      const promptData = {
        system: assessment?.organizationProfile?.targetSystem || "Enterprise System",
        sector: assessment?.organizationProfile?.sector || "Technology",
        totalControls: controls.length,
        criticalDeficiencies: controls.filter((c: any) => c.residualRisk >= 15).length,
        highDeficiencies: controls.filter((c: any) => c.residualRisk >= 10 && c.residualRisk < 15).length,
        averageResidualRisk: (controls.reduce((s: number, c: any) => s + (c.residualRisk || 0), 0) / (controls.length || 1)).toFixed(1),
        sampleControls: controls.slice(0, 10).map((c: any) => ({ id: c.controlId, title: c.title, residualRisk: c.residualRisk })),
      };

      const systemInstruction = `You are a Lead CISO Auditor for NIST SP 800-53 Rev. 5 & CSA CCM v4.1.0. Generate a high-level executive summary analysis in JSON:
{
  "postureGrade": "B+",
  "headline": "Strong Perimeter Safeguards with Target Action Needed in Ephemeral Key Management",
  "keyRiskDrivers": ["IAM-02 credential lifecycle gaps", "Delayed vendor audit sign-offs"],
  "strengthsIdentified": ["Zero-trust network micro-segmentation active", "100% encrypted volume compliance"],
  "criticalVulnerabilities": ["Privileged session recording gap on legacy staging DBs"],
  "boardTalkingPoints": ["Residual risk reduced by 34% this cycle", "Targeting A-level compliance by Q4"],
  "auditReadinessScore": 84,
  "regulatoryExposureSummary": "Moderate exposure under SEC Cybersecurity Disclosure rules; negligible GDPR penalty risk."
}`;

      const promptText = `Generate executive summary for this RCSA assessment:\n${JSON.stringify(promptData, null, 2)}`;

      const result = await executeUnifiedAI(
        aiSettings,
        systemInstruction,
        promptText,
        async () => {
          const ai = getGeminiClient();
          if (!ai) return null;
          const { data: response } = await executeGeminiWithRetry(() =>
            ai.models.generateContent({
              model: "gemini-3.7-flash",
              contents: promptText,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
              },
            })
          );
          return response?.text ? JSON.parse(response.text.trim()) : null;
        }
      );

      return res.json(result);
    } catch (e: any) {
      return res.status(200).json({ success: false, fallback: true });
    }
  });

  // 5. AI Heatmap Prediction Endpoint
  app.post("/api/ai/heatmap-prediction", async (req, res) => {
    try {
      const { assessment, scenario, aiSettings } = req.body;
      const controls = assessment?.controls || [];
      const promptData = {
        system: assessment?.organizationProfile?.targetSystem,
        sector: assessment?.organizationProfile?.sector,
        scenario: scenario || "Current Operating Trajectory",
        controlsCount: controls.length,
        criticalCount: controls.filter((c: any) => c.residualRisk >= 15).length,
      };

      const systemInstruction = `You are a Quantitative Cyber Risk Modeler for NIST SP 800-53 and CSA CCM. Predict 30-day and 90-day risk shifts in JSON format with forecastScenario, baselineCriticalCount, projectedCriticalCount30d, projectedCriticalCount90d, riskVelocityScore, domainRiskShifts, volatileControls, and preventativeRecommendations.`;
      const promptText = `Predict risk trajectory for:\n${JSON.stringify(promptData, null, 2)}`;

      const result = await executeUnifiedAI(
        aiSettings,
        systemInstruction,
        promptText,
        async () => {
          const ai = getGeminiClient();
          if (!ai) return null;
          const { data: response } = await executeGeminiWithRetry(() =>
            ai.models.generateContent({
              model: "gemini-3.7-flash",
              contents: promptText,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
              },
            })
          );
          return response?.text ? JSON.parse(response.text.trim()) : null;
        }
      );

      return res.json(result);
    } catch (e: any) {
      return res.status(200).json({ success: false, fallback: true });
    }
  });

  // 6. AI Risk Remediation Synthesis Endpoint
  app.post("/api/ai/risk-remediation", async (req, res) => {
    try {
      const { assessment, aiSettings } = req.body;
      const controls = assessment?.controls || [];
      const deficiencies = controls.filter((c: any) => c.residualRisk >= 8);

      const promptData = {
        system: assessment?.organizationProfile?.targetSystem,
        sector: assessment?.organizationProfile?.sector,
        deficiencies: deficiencies.slice(0, 8).map((c: any) => ({
          controlId: c.controlId,
          title: c.title,
          domain: c.domain,
          residualRisk: c.residualRisk,
          gapsIdentified: c.gapsIdentified,
        })),
      };

      const systemInstruction = `You are a Principal Cyber Risk Synthesizer. Output high-impact consolidated synthesis items in JSON format including totalDeficienciesAnalyzed, remediationBudgetEstimate, overallProjectedResidualReduction, strategicGuidance, and highestImpactActions array.`;
      const promptText = `Synthesize risk remediations for:\n${JSON.stringify(promptData, null, 2)}`;

      const result = await executeUnifiedAI(
        aiSettings,
        systemInstruction,
        promptText,
        async () => {
          const ai = getGeminiClient();
          if (!ai) return null;
          const { data: response } = await executeGeminiWithRetry(() =>
            ai.models.generateContent({
              model: "gemini-3.7-flash",
              contents: promptText,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
              },
            })
          );
          return response?.text ? JSON.parse(response.text.trim()) : null;
        }
      );

      return res.json(result);
    } catch (e: any) {
      return res.status(200).json({ success: false, fallback: true });
    }
  });

  // 7. AI Regulatory Trends Endpoint
  app.post("/api/ai/trends", async (req, res) => {
    try {
      const { assessment, aiSettings } = req.body;
      const promptData = {
        sector: assessment?.organizationProfile?.sector || "Technology",
        system: assessment?.organizationProfile?.targetSystem || "Core Systems",
      };

      const systemInstruction = `You are a Global Cybersecurity and Compliance Regulatory Analyst. Return an array of 5 current 2026 regulatory/threat trends in JSON format matching the schema: [{ id, title, category, sourceAuthority, effectiveDateOrPeriod, relevanceScore, summary, directImpactOnSystem, relevantNistControls, actionRequired }]`;
      const promptText = `Generate 5 active 2026 cybersecurity regulatory and emerging threat trends for ${promptData.sector} sector:\n${JSON.stringify(promptData, null, 2)}`;

      const result = await executeUnifiedAI(
        aiSettings,
        systemInstruction,
        promptText,
        async () => {
          const ai = getGeminiClient();
          if (!ai) return null;
          const { data: response } = await executeGeminiWithRetry(() =>
            ai.models.generateContent({
              model: "gemini-3.7-flash",
              contents: promptText,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
              },
            })
          );
          return response?.text ? JSON.parse(response.text.trim()) : null;
        }
      );

      return res.json(result);
    } catch (e: any) {
      return res.status(200).json({ success: false, fallback: true });
    }
  });

  // 8. AI Governance Writeup Endpoint
  app.post("/api/ai/writeup", async (req, res) => {
    try {
      const { writeupType, assessment, customInstructions, aiSettings } = req.body;
      const controls = assessment?.controls || [];
      const promptData = {
        writeupType,
        customInstructions: customInstructions || "",
        system: assessment?.organizationProfile?.targetSystem,
        sector: assessment?.organizationProfile?.sector,
        controlsCount: controls.length,
        averageResidual: (controls.reduce((s: number, c: any) => s + (c.residualRisk || 0), 0) / (controls.length || 1)).toFixed(1),
      };

      const systemInstruction = `You are a Chief Compliance Officer & Lead Technical Writer for NIST SP 800-53 and CSA CCM. Return structured governance writeup in JSON format with writeupType, title, targetAudience, executiveSummary, content, and keyActionItems.`;
      const promptText = `Generate governance writeup for type ${writeupType}:\n${JSON.stringify(promptData, null, 2)}`;

      const result = await executeUnifiedAI(
        aiSettings,
        systemInstruction,
        promptText,
        async () => {
          const ai = getGeminiClient();
          if (!ai) return null;
          const { data: response } = await executeGeminiWithRetry(() =>
            ai.models.generateContent({
              model: "gemini-3.7-flash",
              contents: promptText,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
              },
            })
          );
          return response?.text ? JSON.parse(response.text.trim()) : null;
        }
      );

      return res.json(result);
    } catch (e: any) {
      return res.status(200).json({ success: false, fallback: true });
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
    console.log(`Custom RCSA by Technoscope server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
