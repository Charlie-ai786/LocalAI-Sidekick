import React from 'react';
import { ModelStatus } from '../../types';
import { Cpu, CheckCircle2, AlertTriangle, ShieldCheck, HardDrive, WifiOff } from 'lucide-react';

interface OllamaStatusCardProps {
  status: ModelStatus | null;
}

export const OllamaStatusCard: React.FC<OllamaStatusCardProps> = ({ status }) => {
  const isRunning = status?.ollama_running ?? false;
  const isDemo = status?.demo_mode_active ?? false;

  return (
    <div className="glass-card rounded-2xl p-6 border space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isRunning
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
            }`}
          >
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isRunning ? 'Local Ollama Daemon Connected' : 'Local Ollama Runtime Offline'}
              </h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  isRunning
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                }`}
              >
                {isRunning ? 'Online & Ready' : 'Demo Fallback'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Target endpoint: <span className="font-mono text-slate-600 dark:text-slate-300">{status?.ollama_url || 'http://localhost:11434'}</span>
            </p>
          </div>
        </div>

        {/* Local privacy guarantee pill */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs">
          <WifiOff className="w-4 h-4 text-emerald-500" />
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block">
              100% Offline Capability
            </span>
            <span className="text-[10px] text-slate-400">
              Zero cloud API token fees or expiry
            </span>
          </div>
        </div>
      </div>

      {/* Info message */}
      <div
        className={`p-3.5 rounded-xl text-xs leading-relaxed border ${
          isRunning
            ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300'
            : 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
        }`}
      >
        {status?.message}
      </div>

      {/* Metrics footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Model</span>
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 mt-1 block font-mono">
            {status?.current_model || 'None'}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Installed Locally</span>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 block">
            {status?.installed_models.length || 0} Models
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Inference Cost</span>
          <span className="text-xs font-bold text-emerald-500 mt-1 block">
            $0.00 / Request
          </span>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Data Transmission</span>
          <span className="text-xs font-bold text-emerald-500 mt-1 block">
            0 Bytes Sent Remote
          </span>
        </div>
      </div>
    </div>
  );
};
