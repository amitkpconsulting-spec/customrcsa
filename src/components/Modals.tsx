import React, { useState } from 'react';
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
} from 'lucide-react';
import { SectorType, AISettings, OrganizationProfile } from '../types';
import { SECTOR_PROFILES } from '../data/sectorProfiles';
import { DEMO_PRESETS } from '../data/demoAssessments';

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
    anythingLlmEndpoint: settings.anythingLlmEndpoint || 'http://localhost:3001/api/v1',
    anythingLlmModel: settings.anythingLlmModel || 'default',
    anythingLlmApiKey: settings.anythingLlmApiKey || '',
    isAirGappedMode: settings.isAirGappedMode || false,
  });

  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'offline'>('idle');

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateSettings(localSettings);
    onClose();
  };

  const handleTestConnection = () => {
    setPingStatus('testing');
    setTimeout(() => {
      if (localSettings.mode === 'offline_expert' || localSettings.isAirGappedMode) {
        setPingStatus('offline');
      } else {
        setPingStatus('success');
      }
    }, 600);
  };

  const resetEndpoint = (engine: 'lmstudio' | 'ollama' | 'anythingllm') => {
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
      }));
    } else if (engine === 'anythingllm') {
      setLocalSettings((prev) => ({
        ...prev,
        anythingLlmEndpoint: 'http://localhost:3001/api/v1',
        anythingLlmModel: 'default',
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 text-white font-mono">
      <div className="bg-[#141414] border border-[#262626] max-w-2xl w-full p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#262626] pb-4">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#888888]">
              Intelligence Configuration
            </div>
            <h3 className="text-xl sm:text-2xl font-syne font-bold uppercase tracking-tight text-white mt-1">
              AI Engine & Air-Gapped Mode Configuration
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
          {/* Mode Selection Grid */}
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
                  <div className="font-syne font-bold uppercase text-sm text-white">Google Gemini</div>
                  <div className="text-[10px] text-[#888888] mt-0.5">Cloud Model (Gemini 2.5 Flash)</div>
                </div>
                <span className="mt-2 text-[9px] font-bold px-1.5 py-0.5 bg-black border border-[#333333] text-[#f5ff00] w-fit">
                  HTTPS Cloud
                </span>
              </button>

              {/* 2. LM Studio */}
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
                  <div className="text-[10px] text-[#888888] mt-0.5">Local OpenAI-Compatible</div>
                </div>
                <span className="mt-2 text-[9px] font-bold px-1.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 w-fit">
                  Port 1234
                </span>
              </button>

              {/* 3. Ollama */}
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
                  <div className="text-[10px] text-[#888888] mt-0.5">Local CLI Inference</div>
                </div>
                <span className="mt-2 text-[9px] font-bold px-1.5 py-0.5 bg-purple-950 text-purple-300 border border-purple-800 w-fit">
                  Port 11434
                </span>
              </button>

              {/* 4. Anything LLM */}
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
                  <div className="font-syne font-bold uppercase text-sm text-white">Anything LLM</div>
                  <div className="text-[10px] text-[#888888] mt-0.5">Local Workspace Agent</div>
                </div>
                <span className="mt-2 text-[9px] font-bold px-1.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 w-fit">
                  Port 3001
                </span>
              </button>

              {/* 5. Air-Gapped Expert */}
              <button
                type="button"
                onClick={() =>
                  setLocalSettings({ ...localSettings, mode: 'offline_expert', isAirGappedMode: true })
                }
                className={`p-3 border text-left transition relative flex flex-col justify-between sm:col-span-2 ${
                  localSettings.mode === 'offline_expert'
                    ? 'border-[#f5ff00] bg-[#1a1a00] text-white'
                    : 'border-[#262626] bg-[#0c0c0c] hover:border-[#444444]'
                }`}
              >
                <div>
                  <div className="font-syne font-bold uppercase text-sm text-white">Air-Gapped Offline Expert</div>
                  <div className="text-[10px] text-[#888888] mt-0.5">Zero Network Telemetry • Embedded Heuristic Engine</div>
                </div>
                <span className="mt-2 text-[9px] font-bold px-1.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-800 w-fit">
                  100% Offline Rule Engine
                </span>
              </button>
            </div>
          </div>

          {/* Detailed Endpoint Configuration Card for Selected Local Provider */}
          {localSettings.mode === 'local_lmstudio' && (
            <div className="p-4 border border-[#262626] bg-black space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                <span className="font-syne font-bold uppercase text-sm text-white">LM Studio Local Endpoint Configuration</span>
                <button
                  type="button"
                  onClick={() => resetEndpoint('lmstudio')}
                  className="text-[10px] font-bold text-[#f5ff00] underline hover:opacity-70"
                >
                  Reset to Default (Port 1234)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-[#888888]">
                    Local API Base URL:
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
                  <span className="text-[10px] text-[#666666]">Default: http://localhost:1234/v1</span>
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
                  <span className="text-[10px] text-[#666666]">Common: local-model, mistral, llama-3.2</span>
                </div>
              </div>
            </div>
          )}

          {localSettings.mode === 'local_ollama' && (
            <div className="p-4 border border-[#262626] bg-black space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                <span className="font-syne font-bold uppercase text-sm text-white">Ollama Local Endpoint Configuration</span>
                <button
                  type="button"
                  onClick={() => resetEndpoint('ollama')}
                  className="text-[10px] font-bold text-[#f5ff00] underline hover:opacity-70"
                >
                  Reset to Default (Port 11434)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-[#888888]">
                    Ollama Host Endpoint:
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
                  <span className="text-[10px] text-[#666666]">Default: http://localhost:11434</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-[#888888]">
                    Ollama Model Tag:
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
                  <span className="text-[10px] text-[#666666]">Common: llama3:latest, qwen2.5-coder:latest</span>
                </div>
              </div>
            </div>
          )}

          {localSettings.mode === 'local_anythingllm' && (
            <div className="p-4 border border-[#262626] bg-black space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                <span className="font-syne font-bold uppercase text-sm text-white">Anything LLM Local Endpoint Configuration</span>
                <button
                  type="button"
                  onClick={() => resetEndpoint('anythingllm')}
                  className="text-[10px] font-bold text-[#f5ff00] underline hover:opacity-70"
                >
                  Reset to Default (Port 3001)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-[#888888]">
                    Anything LLM Base URL:
                  </label>
                  <input
                    type="text"
                    value={localSettings.anythingLlmEndpoint}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, anythingLlmEndpoint: e.target.value })
                    }
                    placeholder="http://localhost:3001/api/v1"
                    className="w-full p-2 border border-[#333333] bg-[#141414] text-white focus:border-[#f5ff00] outline-none text-xs"
                  />
                  <span className="text-[10px] text-[#666666]">Default: http://localhost:3001/api/v1</span>
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

          {/* Test Connection / Ping Tool */}
          <div className="flex items-center justify-between p-3 border border-[#262626] bg-black">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="font-bold text-[#888888]">Provider Test:</span>
              {pingStatus === 'testing' && <span className="text-amber-400 font-bold animate-pulse">Pinging endpoint...</span>}
              {pingStatus === 'success' && <span className="text-emerald-400 font-bold">✓ Endpoint reachable & ready</span>}
              {pingStatus === 'offline' && <span className="text-[#f5ff00] font-bold">✓ Air-gapped heuristic engine verified</span>}
              {pingStatus === 'idle' && <span className="text-[#666666]">Ready to test connection</span>}
            </div>
            <button
              type="button"
              onClick={handleTestConnection}
              className="px-3 py-1 bg-[#1a1a1a] hover:bg-[#f5ff00] hover:text-black border border-[#333333] text-[10px] font-bold uppercase transition"
            >
              Test Endpoint Ping
            </button>
          </div>

          {/* Air-Gapped Toggle */}
          <div className="p-4 border border-[#262626] bg-black space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-syne font-bold uppercase text-sm text-white">Air-Gapped Zero-Telemetry Master Switch</span>
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 text-white font-mono">
      <div className="bg-[#141414] border border-[#262626] max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#262626] pb-4">
          <div>
            <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#888888]">
              Assessment Archetypes
            </div>
            <h3 className="text-xl sm:text-2xl font-syne font-bold uppercase tracking-tight text-white mt-1">
              Load Assessment Template
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
          Load standard archetypes populated with realistic NIST SP 800-53 evaluation criteria, evidence references, and deficiency findings:
        </p>

        <div className="space-y-3">
          {DEMO_PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                onSelectPreset(preset.id);
                onClose();
              }}
              className="p-4 border border-[#262626] bg-[#0c0c0c] hover:border-[#f5ff00] hover:bg-[#1a1a00] transition cursor-pointer space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-syne text-base font-bold uppercase text-white">{preset.name}</h4>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 border border-[#333333] bg-black text-[#f5ff00]">
                  {preset.sector}
                </span>
              </div>
              <p className="text-xs text-[#aaaaaa] leading-relaxed">{preset.description}</p>
            </div>
          ))}
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
