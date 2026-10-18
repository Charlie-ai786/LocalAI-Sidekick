import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Receipt,
  PenTool,
  Search,
  Cpu,
  Shield,
  Sun,
  Moon,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, theme, toggleTheme, modelStatus } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'AI Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'PDF Intelligence', icon: FileText },
    { id: 'invoices', label: 'Invoice Organizer', icon: Receipt },
    { id: 'studio', label: 'Business Studio', icon: PenTool },
    { id: 'search', label: 'Local Search', icon: Search },
    { id: 'models', label: 'Model Manager', icon: Cpu },
  ] as const;

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col justify-between border-r border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-[#0f172a]/80 backdrop-blur-xl h-screen sticky top-0 transition-colors z-20">
      {/* Top Brand */}
      <div>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200 dark:border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-glow">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              LocalAI Sidekick
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              Open-Source AI Assistant
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="p-3 space-y-1.5 mt-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom info & controls */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
        {/* Hardware & Inference status pill */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Local Runtime</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono">
              OFFLINE OK
            </span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-[11px] truncate">
            {modelStatus?.ollama_running ? `Ollama (${modelStatus.current_model})` : 'Demo Simulator'}
          </p>
        </div>

        {/* Theme and settings bar */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
            title="Toggle Dark / Light Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <span className="text-[10px] text-slate-400 font-mono">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
