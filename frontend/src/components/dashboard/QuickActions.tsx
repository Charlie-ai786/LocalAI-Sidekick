import React from 'react';
import { useApp } from '../../context/AppContext';
import { UploadCloud, Receipt, PenTool, Search, ArrowRight, Cpu } from 'lucide-react';

export const QuickActions: React.FC = () => {
  const { setActiveTab } = useApp();

  const actions = [
    {
      title: 'Upload Document / PDF',
      description: 'Extract text and ask grounded questions with page citations.',
      tab: 'documents' as const,
      icon: UploadCloud,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Scan Receipt / Invoice',
      description: 'Automatically extract totals, merchants, tax, and categories.',
      tab: 'invoices' as const,
      icon: Receipt,
      color: 'from-emerald-600 to-teal-600',
    },
    {
      title: 'Business Content Studio',
      description: 'Draft client proposals, emails, product briefs, and copy.',
      tab: 'studio' as const,
      icon: PenTool,
      color: 'from-purple-600 to-pink-600',
    },
    {
      title: 'Hybrid Semantic Search',
      description: 'Search cross-document knowledge base with vector similarity.',
      tab: 'search' as const,
      icon: Search,
      color: 'from-amber-600 to-orange-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map(act => {
        const Icon = act.icon;
        return (
          <button
            key={act.title}
            onClick={() => setActiveTab(act.tab)}
            className="glass-card glow-card rounded-2xl p-4 border text-left flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${act.color} flex items-center justify-center text-white mb-3 shadow-md`}>
                <Icon className="w-5 h-5" />
              </div>
              <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                {act.title}
              </h5>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {act.description}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
              <span>Open tool</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        );
      })}
    </div>
  );
};
