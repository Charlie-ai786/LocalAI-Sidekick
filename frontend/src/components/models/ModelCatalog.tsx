import React from 'react';
import { ModelInfo } from '../../types';
import { Check, Copy, Download, HardDrive, Cpu, Terminal, ExternalLink } from 'lucide-react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

interface ModelCatalogProps {
  catalog: ModelInfo[];
  currentModel: string;
  onOpenSetupGuide: () => void;
}

export const ModelCatalog: React.FC<ModelCatalogProps> = ({
  catalog,
  currentModel,
  onOpenSetupGuide,
}) => {
  const { showToast, triggerRefresh } = useApp();

  const handleSelectModel = async (modelTag: string) => {
    try {
      await api.selectModel(modelTag);
      showToast(`Switched active inference model to "${modelTag}"`, 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to select model', 'error');
    }
  };

  const copyPullCommand = (tag: string) => {
    const cmd = `ollama pull ${tag}`;
    navigator.clipboard.writeText(cmd);
    showToast(`Copied "${cmd}" to clipboard`, 'info');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Compatible Open-Weight Models
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verified models optimized for local consumer hardware (CPU or GPU). Zero token meters or paid API keys.
          </p>
        </div>

        <button
          onClick={onOpenSetupGuide}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 hover:bg-brand-500/20 transition-colors"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>How to install Ollama</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalog.map(model => {
          const isActive = currentModel === model.tag;
          return (
            <div
              key={model.tag}
              className={`glass-card glow-card rounded-2xl p-5 border flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-brand-500 ring-2 ring-brand-500/20'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{model.name}</span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white">
                          Active
                        </span>
                      )}
                    </h5>
                    <span className="text-[11px] font-mono text-slate-400">
                      {model.tag}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {model.parameter_size}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3">
                  {model.description}
                </p>

                {/* Specs row */}
                <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Download</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{model.size_gb} GB</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Hardware Req</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 truncate block">{model.recommended_vram}</span>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>License: {model.license}</span>
                  {model.installed ? (
                    <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Installed
                    </span>
                  ) : (
                    <span className="text-slate-400">Not detected</span>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-2">
                <button
                  onClick={() => handleSelectModel(model.tag)}
                  className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white cursor-default'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-brand-600 hover:text-white'
                  }`}
                >
                  {isActive ? 'Active Model' : 'Select Model'}
                </button>

                <button
                  onClick={() => copyPullCommand(model.tag)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title={`Copy: ollama pull ${model.tag}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
