import React from 'react';
import { ShieldCheck, Cpu, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PrivacyBadge: React.FC = () => {
  const { modelStatus } = useApp();

  const isDemo = modelStatus?.demo_mode_active ?? false;
  const isOllama = modelStatus?.ollama_running ?? false;

  return (
    <div className="flex items-center gap-2">
      {/* Privacy guarantee badge */}
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>100% On-Device Privacy</span>
      </div>

      {/* Model & Runtime status */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
          isOllama
            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300 border-brand-500/20'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20'
        }`}
      >
        {isOllama ? <Cpu className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
        <span>
          {isOllama
            ? `Ollama: ${modelStatus?.current_model || 'Local'}`
            : 'Demo Mode (Simulated AI)'}
        </span>
      </div>
    </div>
  );
};
