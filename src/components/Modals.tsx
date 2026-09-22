import React, { useState, useMemo } from 'react';
import {
  Layers,
  Settings,
  FolderOpen,
  Check,
  Shield,
  Server,
  Sparkles,
  Lock,
  Database,
  Radio,
  Cpu,
  Search,
  Building,
  Filter,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { SectorType, AISettings, OrganizationProfile } from '../types';
import { SECTOR_PROFILES } from '../data/sectorProfiles';
import { DEMO_PRESETS, MULTI_SECTOR_RCSA_PRESETS } from '../data/demoAssessments';

// 1. Sector Profile Overlay Modal
interface SectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSector: SectorType;
  onSelectSector: (sector: SectorType) => void;
}

export const SectorModal: React.FC<SectorModalProps> = ({
  isOpen,
  onClose,
  currentSector,
  onSelectSector,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 text-white font-mono">
      <div className="bg-[#141414] border border-[#262626] max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#262626] pb-4">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#888888]">
              Regulatory Frameworks
            </div>
            <h3 className="text-xl sm:text-2xl font-syne font-bold uppercase tracking-tight text-white mt-1">
              Select Sector Overlay Baseline
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-[#888888] hover:text-white transition px-2 py-1"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-[#888888] leading-relaxed">
          Switching sector overlay injects tailored compliance baselines, priority NIST SP 800-53 control families, and sector-specific risk multipliers.
        </p>

        <div className="space-y-3">
          {Object.values(SECTOR_PROFILES).map((profile) => {
            const isSelected = profile.id === currentSector;
            return (
              <div
                key={profile.id}
                onClick={() => {
                  onSelectSector(profile.id);
                  onClose();
                }}
                className={`p-4 border transition cursor-pointer space-y-2 ${
                  isSelected
                    ? 'border-[#f5ff00] bg-[#1a1a00]'
                    : 'border-[#262626] bg-[#0c0c0c] hover:border-[#444444] hover:bg-[#161616]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-syne text-base font-bold uppercase text-white">
                      {profile.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-black text-[#f5ff00] border border-[#333333]">
                      {profile.defaultRiskMultiplier}x Base
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 border border-[#f5ff00] bg-[#f5ff00] text-black">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-[#aaaaaa] leading-relaxed">{profile.description}</p>

                <div className="flex items-center gap-2 flex-wrap pt-1 text-[10px] text-[#888888]">
                  <span className="font-bold text-[#cccccc]">Frameworks:</span>
                  {profile.regulatoryFrameworks.map((fw) => (
                    <span key={fw} className="px-1.5 py-0.2 border border-[#333333] bg-black text-[#cccccc]">
                      {fw}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end pt-4 border-t border-[#262626]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs uppercase font-bold tracking-wider bg-[#1a1a1a] border border-[#333333] text-[#cccccc] hover:text-white hover:border-[#666666] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. AI Settings / Air-Gapped Modal
interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onUpdateSettings: (settings: AISettings) => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<AISettings>({
    mode: settings.mode || 'gemini',
    lmStudioEndpoint: settings.lmStudioEndpoint || 'http://localhost:1234/v1',
    lmStudioModel: settings.lmStudioModel || 'local-model',
    ollamaEndpoint: settings.ollamaEndpoint || 'http://localhost:11434',
    ollamaModel: settings.ollamaModel || 'llama3:latest',
    ollamaApiPath: settings.ollamaApiPath || '/api',
    unslothEndpoint: settings.unslothEndpoint || 'http://localhost:8888',
    unslothModel: settings.unslothModel || 'unsloth-model',
    anythingLlmEndpoint: settings.anythingLlmEndpoint || 'http://localhost:3001/api',
    anythingLlmModel: settings.anythingLlmModel || 'default',
    anythingLlmApiKey: settings.anythingLlmApiKey || '',
    delimitGeminiKey: settings.delimitGeminiKey || false,
    fallbackToLocalOnQuota: settings.fallbackToLocalOnQuota !== false,
    isAirGappedMode: settings.isAirGappedMode || false,
  });

  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'success' | 'failed';
    pingMs?: number;
    message?: string;
    models?: string[];
  }>({ status: 'idle' });

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleTestConnection = async () => {
    setTestResult({ status: 'testing' });
    try {
      let endpoint = '';
      let model = '';
      let apiKey = '';
      if (localSettings.mode === 'local_ollama') {
        endpoint = localSettings.ollamaEndpoint;
        model = localSettings.ollamaModel;
      } else if (localSettings.mode === 'local_lmstudio') {
        endpoint = localSettings.lmStudioEndpoint;
        model = localSettings.lmStudioModel;
      } else if (localSettings.mode === 'local_unsloth') {
        endpoint = localSettings.unslothEndpoint || 'http://localhost:8888';
        model = localSettings.unslothModel || 'unsloth-model';
      } else if (localSettings.mode === 'local_anythingllm') {
        endpoint = localSettings.anythingLlmEndpoint;
        model = localSettings.anythingLlmModel;
        apiKey = localSettings.anythingLlmApiKey || '';
      }

      const res = await fetch('/api/local-ai/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: localSettings.mode,
          endpoint,
          model,
          apiKey,
        }),
      });
      const data = await res.json();
      setTestResult({
        status: data.success ? 'success' : 'failed',
        pingMs: data.pingMs,
        message: data.message,
        models: data.models,
      });
    } catch (e: any) {
      setTestResult({
        status: 'failed',
        message: `Connection failed: ${e.message}`,
      });
    }
  };

  const resetEndpoint = (engine: 'lmstudio' | 'ollama' | 'unsloth' | 'anythingllm') => {
    if (engine === 'lmstudio') {
      setLocalSettings((prev) => ({
        ...prev,
        lmStudioEndpoint: 'http://localhost:1234/v1',
        lmStudioModel: 'local-model',
      }));
    } else if (engine === 'ollama') {
      setLocalSettings((prev) => ({
        ...prev,
        ollamaEndpoint: 'http://localhost:11434',
        ollamaModel: 'llama3:latest',
        ollamaApiPath: '/api',
      }));
    } else if (engine === 'unsloth') {
      setLocalSettings((prev) => ({
        ...prev,
        unslothEndpoint: 'http://localhost:8888',
        unslothModel: 'unsloth-model',
      }));
    } else if (engine === 'anythingllm') {
      setLocalSettings((prev) => ({
        ...prev,
        anythingLlmEndpoint: 'http://localhost:3001/api',
        anythingLlmModel: 'default',
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 text-white font-mono">
      <div className="bg-[#141414] border border-[#262626] max-w-3xl w-full p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#262626] pb-4">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#888888] flex items-center gap-2">
              <span>Intelligence Configuration</span>
              <span className="px-1.5 py-0.5 bg-[#f5ff00] text-black text-[9px] font-bold">Local Endpoint Selectable</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-syne font-bold uppercase tracking-tight text-white mt-1">
              AI Engine & Endpoint Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-[#888888] hover:text-white transition p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 text-xs text-white">
          {/* Provider Selection Grid */}
          <div className="space-y-2">
            <label className="block text-[10px] uppercase font-bold tracking-wider text-[#888888]">
              Select Reasoning Provider:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Google Gemini */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({ ...localSettings, mode: 'gemini', isAirGappedMode: false })
                }
                className={`p-3 border text-left transition relative flex flex-col justify-between ${
                  localSettings.mode === 'gemini'
                    ? 'border-[#f5ff00] bg-[#1a1a00] text-white'
                    : 'border-[#262626] bg-[#0c0c0c] hover:border-[#444444]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="font-syne font-bold uppercase text-sm text-white">Google Gemini</div>
                    {localSettings.delimitGeminiKey && (
                      <span className="text-[8px] font-bold px-1 py-0.2 bg-amber-950 text-amber-300 border border-amber-700">Delimited</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#888888] mt-0.5">Cloud API (Gemini 3.7 Flash)</div>
                </div>
                <span className="mt-2 text-[9px] font-bold px-1.5 py-0.5 bg-black border border-[#333333] text-[#f5ff00] w-fit">
                  HTTPS Cloud
                </span>
              </button>

              {/* 2. Ollama */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({ ...localSettings, mode: 'local_ollama', isAirGappedMode: false })
                }
                className={`p-3 border text-left transition relative flex flex-col justify-between ${
                  localSettings.mode === 'local_ollama'
                    ? 'border-[#f5ff00] bg-[#1a1a00] text-white'
                    : 'border-[#262626] bg-[#0c0c0c] hover:border-[#444444]'
                }`}
              >
                <div>
                  <div className="font-syne font-bold uppercase text-sm text-white">Ollama</div>
                  <div className="text-[10px] text-[#888888] mt-0.5">CLI-First Daemon • Local LLM</div>
                </div>
                <span className="mt-2 text-[9px] font-bold px-1.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 w-fit">
                  Port 11434
                </span>
              </button>

              {/* 3. LM Studio */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({ ...localSettings, mode: 'local_lmstudio', isAirGappedMode: false })
                }
                className={`p-3 border text-left transition relative flex flex-col justify-between ${
                  localSettings.mode === 'local_lmstudio'
                    ? 'border-[#f5ff00] bg-[#1a1a00] text-white'
                    : 'border-[#262626] bg-[#0c0c0c] hover:border-[#444444]'
                }`}
              >
                <div>
                  <div className="font-syne font-bold uppercase text-sm text-white">LM Studio</div>
                  <div className="text-[10px] text-[#888888] mt-0.5">Desktop GUI • GGUF Models</div>
                </div>
                <span className="mt-2 text-[9px] font-bold px-1.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 w-fit">
                  Port 1234/v1
                </span>
              </button>

              {/* 4. Unsloth */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({ ...localSettings, mode: 'local_unsloth', isAirGappedMode: false })
                }
                className={`p-3 border text-left transition relative flex flex-col justify-between ${
                  localSettings.mode === 'local_unsloth'
                    ? 'border-[#f5ff00] bg-[#1a1a00] text-white'
                    : 'border-[#262626] bg-[#0c0c0c] hover:border-[#444444]'
                }`}
              >
                <div>
                  <div className="font-syne font-bold uppercase text-sm text-white">Unsloth Studio</div>
                  <div className="text-[10px] text-[#888888] mt-0.5">Low-VRAM QLoRA & Fast LLM</div>
                </div>
                <span className="mt-2 text-[9px] font-bold px-1.5 py-0.5 bg-orange-950 text-orange-300 border border-orange-800 w-fit">
                  Port 8888/v1
                </span>
              </button>

              {/* 5. AnythingLLM */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({ ...localSettings, mode: 'local_anythingllm', isAirGappedMode: false })
                }
                className={`p-3 border text-left transition relative flex flex-col justify-between ${
                  localSettings.mode === 'local_anythingllm'
                    ? 'border-[#f5ff00] bg-[#1a1a00] text-white'
                    : 'border-[#262626] bg-[#0c0c0c] hover:border-[#444444]'
                }`}
              >
                <div>
                  <div className="font-syne font-bold uppercase text-sm text-white">AnythingLLM</div>
                  <div className="text-[10px] text-[#888888] mt-0.5">RAG Workspace App</div>
                </div>
                <span className="mt-2 text-[9px] font-bold px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 w-fit">
                  Port 3001/api
                </span>
              </button>

              {/* 6. Air-Gapped Expert */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({ ...localSettings, mode: 'offline_expert', isAirGappedMode: true })
                }
                className={`p-3 border text-left transition relative flex flex-col justify-between ${
                  localSettings.mode === 'offline_expert'
                    ? 'border-[#f5ff00] bg-[#1a1a00] text-white'
                    : 'border-[#262626] bg-[#0c0c0c] hover:border-[#444444]'
                }`}
              >
                <div>
                  <div className="font-syne font-bold uppercase text-sm text-white">Offline Expert</div>
                  <div className="text-[10px] text-[#888888] mt-0.5">Embedded NIST SP 800-53 Rules</div>
                </div>
                <span className="mt-2 text-[9px] font-bold px-1.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 w-fit">
                  100% Air-Gapped
                </span>
              </button>
            </div>
          </div>

          {/* Gemini Cloud & Delimitation Controls */}
          {localSettings.mode === 'gemini' && (
            <div className="p-4 border border-[#262626] bg-black space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-syne font-bold uppercase text-sm text-white">Google Gemini Cloud Engine</span>
                  {localSettings.delimitGeminiKey ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-700">API Key Delimited (Bypassed)</span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-700">Cloud Active</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      delimitGeminiKey: !localSettings.delimitGeminiKey,
                    })
                  }
                  className={`text-[11px] font-bold px-2.5 py-1 border transition ${
                    localSettings.delimitGeminiKey
                      ? 'bg-emerald-950 hover:bg-emerald-900 border-emerald-600 text-emerald-300'
                      : 'bg-rose-950 hover:bg-rose-900 border-rose-600 text-rose-300'
                  }`}
                >
                  {localSettings.delimitGeminiKey ? 'Restore Gemini Key' : 'Delimit / Bypass Gemini Key'}
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] text-[#888888] leading-relaxed">
                  {localSettings.delimitGeminiKey ? (
                    <span className="text-amber-300">
                      Gemini API Key is currently <strong>delimited</strong>. All requests will bypass cloud calls and route strictly through your configured local endpoints (Ollama, LM Studio, Unsloth, AnythingLLM) or the offline rule engine.
                    </span>
                  ) : (
                    <span>
                      Standard cloud inference using Google Gemini 3.7 Flash server-side. You can delimit the API key at any time to prevent cloud token consumption and rely solely on local endpoints.
                    </span>
                  )}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f]">
                  <div>
                    <div className="text-[11px] font-bold text-white">Auto-Failover to Local Endpoints on Quota Limit</div>
                    <div className="text-[10px] text-[#666666]">If Gemini hits HTTP 429 quota exhaustion, seamlessly switch to Ollama / LM Studio without failing.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={localSettings.fallbackToLocalOnQuota !== false}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, fallbackToLocalOnQuota: e.target.checked })
                    }
                    className="accent-[#f5ff00] w-4 h-4 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Ollama Local Endpoint Configuration */}
          {localSettings.mode === 'local_ollama' && (
            <div className="p-4 border border-[#262626] bg-black space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                <span className="font-syne font-bold uppercase text-sm text-white">Ollama Local Endpoint Configuration</span>
                <button
                  type="button"
                  onClick={() => resetEndpoint('ollama')}
                  className="text-[10px] font-bold text-[#f5ff00] underline hover:opacity-70"
                >
                  Reset to Default (http://localhost:11434)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-[#888888]">
                    Ollama Base URL:
                  </label>
                  <input
                    type="text"
                    value={localSettings.ollamaEndpoint}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, ollamaEndpoint: e.target.value })
                    }
                    placeholder="http://localhost:11434"
                    className="w-full p-2 border border-[#333333] bg-[#141414] text-white focus:border-[#f5ff00] outline-none text-xs"
                  />
                  <span className="text-[10px] text-[#666666]">Default Base: http://localhost:11434</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-[#888888]">
                    Model Identifier:
                  </label>
                  <input
                    type="text"
                    value={localSettings.ollamaModel}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, ollamaModel: e.target.value })
                    }
                    placeholder="llama3:latest"
                    className="w-full p-2 border border-[#333333] bg-[#141414] text-white focus:border-[#f5ff00] outline-none text-xs"
                  />
                  <span className="text-[10px] text-[#666666]">Common: llama3:latest, qwen2.5-coder:latest, mistral</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f]">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold uppercase text-[#888888]">API Path Mode:</div>
                  <div className="text-[10px] text-[#666666]">Choose between Native Ollama API and OpenAI-compatible endpoints</div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, ollamaApiPath: '/api' })}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase border transition ${
                      localSettings.ollamaApiPath !== '/v1'
                        ? 'bg-[#f5ff00] text-black border-[#f5ff00]'
                        : 'bg-[#141414] text-[#888888] border-[#333333]'
                    }`}
                  >
                    Native (/api)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, ollamaApiPath: '/v1' })}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase border transition ${
                      localSettings.ollamaApiPath === '/v1'
                        ? 'bg-[#f5ff00] text-black border-[#f5ff00]'
                        : 'bg-[#141414] text-[#888888] border-[#333333]'
                    }`}
                  >
                    OpenAI (/v1)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* LM Studio Local Endpoint Configuration */}
          {localSettings.mode === 'local_lmstudio' && (
            <div className="p-4 border border-[#262626] bg-black space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                <span className="font-syne font-bold uppercase text-sm text-white">LM Studio Local Endpoint Configuration</span>
                <button
                  type="button"
                  onClick={() => resetEndpoint('lmstudio')}
                  className="text-[10px] font-bold text-[#f5ff00] underline hover:opacity-70"
                >
                  Reset to Default (http://localhost:1234/v1)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-[#888888]">
                    OpenAI-Compatible Base URL:
                  </label>
                  <input
                    type="text"
                    value={localSettings.lmStudioEndpoint}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, lmStudioEndpoint: e.target.value })
                    }
                    placeholder="http://localhost:1234/v1"
                    className="w-full p-2 border border-[#333333] bg-[#141414] text-white focus:border-[#f5ff00] outline-none text-xs"
                  />
                  <span className="text-[10px] text-[#666666]">Default Base: http://localhost:1234/v1</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-[#888888]">
                    Loaded Model Identifier:
                  </label>
                  <input
                    type="text"
                    value={localSettings.lmStudioModel}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, lmStudioModel: e.target.value })
                    }
                    placeholder="local-model"
                    className="w-full p-2 border border-[#333333] bg-[#141414] text-white focus:border-[#f5ff00] outline-none text-xs"
                  />
                  <span className="text-[10px] text-[#666666]">LM Studio automatically routes to whichever GGUF model is loaded</span>
                </div>
              </div>
            </div>
          )}

          {/* Unsloth Studio Local Endpoint Configuration */}
          {localSettings.mode === 'local_unsloth' && (
            <div className="p-4 border border-[#262626] bg-black space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                <span className="font-syne font-bold uppercase text-sm text-white">Unsloth Studio Local Endpoint Configuration</span>
                <button
                  type="button"
                  onClick={() => resetEndpoint('unsloth')}
                  className="text-[10px] font-bold text-[#f5ff00] underline hover:opacity-70"
                >
                  Reset to Default (http://localhost:8888)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-[#888888]">
                    Unsloth Base URL:
                  </label>
                  <input
                    type="text"
                    value={localSettings.unslothEndpoint || 'http://localhost:8888'}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, unslothEndpoint: e.target.value })
                    }
                    placeholder="http://localhost:8888"
                    className="w-full p-2 border border-[#333333] bg-[#141414] text-white focus:border-[#f5ff00] outline-none text-xs"
                  />
                  <span className="text-[10px] text-[#666666]">Default Base: http://localhost:8888 (exposes /v1/chat/completions)</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-[#888888]">
                    Fine-Tuned / Inference Model Tag:
                  </label>
                  <input
                    type="text"
                    value={localSettings.unslothModel || 'unsloth-model'}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, unslothModel: e.target.value })
                    }
                    placeholder="unsloth-model"
                    className="w-full p-2 border border-[#333333] bg-[#141414] text-white focus:border-[#f5ff00] outline-none text-xs"
                  />
                  <span className="text-[10px] text-[#666666]">Developer-first fine-tuned QLoRA weights or standalone server</span>
                </div>
              </div>
            </div>
          )}

          {/* AnythingLLM Local Endpoint Configuration */}
          {localSettings.mode === 'local_anythingllm' && (
            <div className="p-4 border border-[#262626] bg-black space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                <span className="font-syne font-bold uppercase text-sm text-white">AnythingLLM Workspace Endpoint Configuration</span>
                <button
                  type="button"
                  onClick={() => resetEndpoint('anythingllm')}
                  className="text-[10px] font-bold text-[#f5ff00] underline hover:opacity-70"
                >
                  Reset to Default (http://localhost:3001/api)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-[#888888]">
                    AnythingLLM Base URL:
                  </label>
                  <input
                    type="text"
                    value={localSettings.anythingLlmEndpoint}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, anythingLlmEndpoint: e.target.value })
                    }
                    placeholder="http://localhost:3001/api"
                    className="w-full p-2 border border-[#333333] bg-[#141414] text-white focus:border-[#f5ff00] outline-none text-xs"
                  />
                  <span className="text-[10px] text-[#666666]">Default Base: http://localhost:3001/api (Web UI: http://localhost:3001)</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-[#888888]">
                    API Key (Optional):
                  </label>
                  <input
                    type="password"
                    value={localSettings.anythingLlmApiKey || ''}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, anythingLlmApiKey: e.target.value })
                    }
                    placeholder="Enter Workspace API Key if required"
                    className="w-full p-2 border border-[#333333] bg-[#141414] text-white focus:border-[#f5ff00] outline-none text-xs"
                  />
                  <span className="text-[10px] text-[#666666]">Leave blank for unauthenticated local instances</span>
                </div>
              </div>
            </div>
          )}

          {/* Live Ping & Endpoint Diagnostic Tool */}
          <div className="p-3.5 border border-[#262626] bg-black space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-bold text-[#888888]">Diagnostic Test:</span>
                {testResult.status === 'testing' && (
                  <span className="text-amber-400 font-bold animate-pulse">Testing connection latency...</span>
                )}
                {testResult.status === 'success' && (
                  <span className="text-emerald-400 font-bold">
                    ✓ Connected ({testResult.pingMs}ms)
                  </span>
                )}
                {testResult.status === 'failed' && (
                  <span className="text-rose-400 font-bold">✕ Offline / Error</span>
                )}
                {testResult.status === 'idle' && (
                  <span className="text-[#666666]">Click to ping active provider</span>
                )}
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testResult.status === 'testing'}
                className="px-3 py-1 bg-[#1a1a1a] hover:bg-[#f5ff00] hover:text-black border border-[#333333] text-[10px] font-bold uppercase transition disabled:opacity-50"
              >
                {testResult.status === 'testing' ? 'Testing...' : 'Test Endpoint Ping'}
              </button>
            </div>
            {testResult.message && (
              <div className={`text-[10px] p-2 border ${
                testResult.status === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : testResult.status === 'failed'
                  ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                  : 'bg-[#141414] border-[#333333] text-[#888888]'
              }`}>
                {testResult.message}
                {testResult.models && testResult.models.length > 0 && (
                  <div className="mt-1 text-[9px] text-[#aaaaaa]">
                    Available models: {testResult.models.slice(0, 5).join(', ')}
                    {testResult.models.length > 5 && ` (+${testResult.models.length - 5} more)`}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Air-Gapped Zero Telemetry Toggle */}
          <div className="p-4 border border-[#262626] bg-black space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-syne font-bold uppercase text-sm text-white">Air-Gapped Zero-Telemetry Master Switch</span>
                <div className="text-[10px] text-[#666666] mt-0.5">Strict offline compliance for classified / zero-trust environments</div>
              </div>
              <input
                type="checkbox"
                checked={localSettings.isAirGappedMode}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  setLocalSettings({
                    ...localSettings,
                    isAirGappedMode: isChecked,
                    mode: isChecked ? 'offline_expert' : localSettings.mode,
                  });
                }}
                className="accent-[#f5ff00] w-4 h-4 cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-[#888888] leading-relaxed">
              When activated, all outbound network requests are strictly halted. Risk calculations, question scoring, and remediation roadmaps are executed entirely client-side using embedded NIST SP 800-53 Rev. 5 rule matrices.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#262626]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs uppercase font-bold tracking-wider border border-[#333333] bg-[#1a1a1a] text-[#888888] hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs uppercase font-bold tracking-wider bg-[#f5ff00] text-black hover:bg-yellow-300 transition"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

// 3. Demo Templates Loader Modal
interface DemoTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (presetId: string) => void;
}

export const DemoTemplatesModal: React.FC<DemoTemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('ALL');

  const sectorCategories = [
    { id: 'ALL', label: 'All Sectors', count: MULTI_SECTOR_RCSA_PRESETS.length },
    { id: 'Financial', label: 'Financial / Banking', count: MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'Financial').length },
    { id: 'Healthcare', label: 'Healthcare & Life Sci', count: MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'Healthcare').length },
    { id: 'Retail', label: 'Retail & E-Com', count: MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'Retail').length },
    { id: 'Technology', label: 'Technology & SaaS', count: MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'Technology').length },
    { id: 'Critical_Infrastructure', label: 'Critical Infra & OT', count: MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'Critical_Infrastructure').length },
    { id: 'Defense', label: 'Federal & Defense', count: MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'Defense').length },
    { id: 'Public_Sector', label: 'Public & Education', count: MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'Public_Sector').length },
    { id: 'General_Enterprise', label: 'Enterprise IT', count: MULTI_SECTOR_RCSA_PRESETS.filter((p) => p.sector === 'General_Enterprise').length },
  ];

  const filteredPresets = useMemo(() => {
    return MULTI_SECTOR_RCSA_PRESETS.filter((preset) => {
      const matchesSector = selectedSectorFilter === 'ALL' || preset.sector === selectedSectorFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        preset.name.toLowerCase().includes(q) ||
        preset.system.toLowerCase().includes(q) ||
        preset.sector.toLowerCase().includes(q) ||
        preset.complianceTarget.toLowerCase().includes(q) ||
        preset.description.toLowerCase().includes(q) ||
        preset.businessUnit.toLowerCase().includes(q);
      return matchesSector && matchesSearch;
    });
  }, [selectedSectorFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 text-white font-mono">
      <div className="bg-[#141414] border border-[#262626] max-w-4xl w-full p-6 sm:p-8 space-y-5 max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#262626] pb-4">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#888888] flex items-center gap-2">
              <span>Assessment Archetypes Universe</span>
              <span className="px-1.5 py-0.2 bg-[#f5ff00] text-black text-[9px] font-bold">28 Multi-Sector RCSAs</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-syne font-bold uppercase tracking-tight text-white mt-1">
              Load Multi-Sector RCSA Template
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-[#888888] hover:text-white transition px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Search and Filter Row */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by system, framework (PCI, HIPAA, FedRAMP, NERC CIP), sector, or keyword..."
              className="w-full pl-9 pr-4 py-2.5 bg-black border border-[#333333] text-white text-xs placeholder:text-[#666666] focus:border-[#f5ff00] outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#888888] hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sector Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
            {sectorCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedSectorFilter(cat.id)}
                className={`px-2.5 py-1 uppercase whitespace-nowrap transition border ${
                  selectedSectorFilter === cat.id
                    ? 'border-[#f5ff00] bg-[#1a1a00] text-[#f5ff00] font-bold'
                    : 'border-[#262626] bg-[#0c0c0c] text-[#888888] hover:text-white hover:border-[#444444]'
                }`}
              >
                <span>{cat.label}</span>
                <span className="ml-1.5 text-[9px] opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Presets List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[50vh]">
          {filteredPresets.length === 0 ? (
            <div className="text-center py-12 text-[#666666] border border-dashed border-[#262626]">
              <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <div className="text-xs uppercase">No matching assessments found</div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSectorFilter('ALL');
                }}
                className="mt-2 text-[10px] text-[#f5ff00] underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            filteredPresets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => {
                  onSelectPreset(preset.id);
                  onClose();
                }}
                className="p-4 border border-[#262626] bg-[#0c0c0c] hover:border-[#f5ff00] hover:bg-[#1a1a00] transition cursor-pointer space-y-2 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 bg-black text-[#f5ff00] border border-[#333333]">
                        {preset.sector.replace('_', ' ')}
                      </span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 border border-[#333333] text-[#aaaaaa]">
                        {preset.rcsaDomain} Domain
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 border border-purple-900 bg-purple-950/40 text-purple-300">
                        {preset.systemImpactLevel} Impact
                      </span>
                    </div>
                    <h4 className="font-syne text-sm sm:text-base font-bold uppercase text-white group-hover:text-[#f5ff00] transition mt-1">
                      {preset.name}
                    </h4>
                  </div>

                  <button className="px-3 py-1 bg-[#1a1a1a] group-hover:bg-[#f5ff00] group-hover:text-black border border-[#333333] text-[10px] font-bold uppercase tracking-wider transition shrink-0 flex items-center gap-1">
                    <span>Load</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <p className="text-xs text-[#aaaaaa] leading-relaxed line-clamp-2">{preset.description}</p>

                <div className="flex items-center justify-between pt-1 border-t border-[#1f1f1f] text-[10px] text-[#777777] flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[#888888]">Target:</span>
                    <strong className="text-[#cccccc] font-normal truncate">{preset.system}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#888888]">Target Standards:</span>
                    <span className="text-[#f5ff00] font-mono">{preset.complianceTarget}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#262626] text-xs">
          <span className="text-[10px] text-[#888888]">
            Showing <strong className="text-white">{filteredPresets.length}</strong> of {MULTI_SECTOR_RCSA_PRESETS.length} multi-sector assessment presets
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs uppercase font-bold tracking-wider bg-[#1a1a1a] border border-[#333333] text-[#cccccc] hover:text-white hover:border-[#666666] transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
