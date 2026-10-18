import React from 'react';
import { useApp } from '../../context/AppContext';
import { PrivacyBadge } from './PrivacyBadge';
import { RefreshCw, Play, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../../api/client';

export const Header: React.FC = () => {
  const { activeTab, modelStatus, triggerRefresh, showToast } = useApp();

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'AI Workspace Overview', desc: 'Monitor local document intelligence, metrics, and expense tracking.' };
      case 'documents':
        return { title: 'PDF & Document Intelligence', desc: 'Extract text, generate summaries, and perform grounded Q&A with exact page citations.' };
      case 'invoices':
        return { title: 'Invoice & Receipt Organizer', desc: 'Extract merchant, total, date, and tax. Correct fields and export to CSV.' };
      case 'studio':
        return { title: 'Business Content Studio', desc: 'Generate high-converting proposals, emails, product copy, and captions.' };
      case 'search':
        return { title: 'Local File Search', desc: 'Perform hybrid semantic and keyword search across your indexed documents.' };
      case 'models':
        return { title: 'Local Model Manager', desc: 'Configure local open-weight models (Qwen, Gemma, Llama) running offline via Ollama.' };
    }
  };

  const { title, desc } = getTitle();

  const toggleDemo = async () => {
    if (!modelStatus) return;
    try {
      const nextState = !modelStatus.demo_mode_active;
      await api.toggleDemoMode(nextState);
      triggerRefresh();
      showToast(nextState ? 'Switched to Demo Mode (Simulated AI)' : 'Switched to Ollama Local Engine', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle mode', 'error');
    }
  };

  return (
    <header className="h-20 border-b border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-[#0f172a]/50 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {desc}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Toggle Demo Mode Button */}
        <button
          onClick={toggleDemo}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            modelStatus?.demo_mode_active
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-500'
          }`}
          title="Toggle between simulated demo data and real Ollama local inference"
        >
          <Play className="w-3.5 h-3.5" />
          <span>{modelStatus?.demo_mode_active ? 'Demo Mode Active' : 'Real Local Mode'}</span>
        </button>

        {/* Privacy & Model status badge */}
        <PrivacyBadge />

        {/* Refresh button */}
        <button
          onClick={triggerRefresh}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Refresh Workspace State"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
