import React from 'react';
import { X, Terminal, ExternalLink, ShieldCheck, Download, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useApp();

  if (!isOpen) return null;

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied "${text}"`, 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="glass-card rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-700/80 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                How to Run Local Open-Weight Models with Ollama
              </h3>
              <p className="text-xs text-slate-400">
                100% on-device AI execution without external cloud tokens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">1</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Install Ollama on Your Operating System
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 ml-8">
            Download the installer for Windows, macOS, or Linux from the official open-source website:
          </p>
          <div className="ml-8 p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-800 dark:text-slate-200">
              https://ollama.com/download
            </span>
            <a
              href="https://ollama.com/download"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-brand-500 hover:underline flex items-center gap-1"
            >
              <span>Visit Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Step 2 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">2</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Pull a Recommended Model
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 ml-8">
            Open your terminal (PowerShell, Command Prompt, or Bash) and run one of the following commands:
          </p>

          <div className="ml-8 space-y-2">
            <div
              onClick={() => copyText('ollama pull qwen2.5:3b')}
              className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs flex items-center justify-between cursor-pointer border border-slate-800 hover:border-brand-500/50"
            >
              <div>
                <span className="text-emerald-400 font-bold">$</span> ollama pull qwen2.5:3b
                <span className="text-slate-500 text-[10px] block font-sans mt-0.5">Recommended (1.9 GB - Best instruction following)</span>
              </div>
              <span className="text-[10px] text-brand-400 font-sans">Click to copy</span>
            </div>

            <div
              onClick={() => copyText('ollama pull gemma2:2b')}
              className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs flex items-center justify-between cursor-pointer border border-slate-800 hover:border-brand-500/50"
            >
              <div>
                <span className="text-emerald-400 font-bold">$</span> ollama pull gemma2:2b
                <span className="text-slate-500 text-[10px] block font-sans mt-0.5">Ultra-lightweight (1.6 GB - Runs on any low-spec laptop)</span>
              </div>
              <span className="text-[10px] text-brand-400 font-sans">Click to copy</span>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">3</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Zero-Configuration Automatic Detection
            </h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 ml-8">
            Once Ollama is started, LocalAI Sidekick detects it instantly at <code className="text-brand-500">http://localhost:11434</code>. You can switch models anytime from the Model Manager dropdown.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-colors"
          >
            Got it, close guide
          </button>
        </div>
      </div>
    </div>
  );
};
