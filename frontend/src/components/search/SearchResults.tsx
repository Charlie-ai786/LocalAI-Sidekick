import React from 'react';
import { SearchResultItem } from '../../types';
import { FileText, BookOpen, Sparkles, KeyRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SearchResultsProps {
  results: SearchResultItem[];
  query: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
}) => {
  const { setActiveTab } = useApp();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2 px-1">
        <span>
          Found {results.length} relevant {results.length === 1 ? 'match' : 'matches'} for "{query}"
        </span>
        <span className="text-[11px] font-mono text-emerald-500">
          Ranked by Hybrid Cosine & BM25 Score
        </span>
      </div>

      {results.map((item, idx) => (
        <div
          key={idx}
          className="glass-card glow-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-500">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {item.document_name}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Page {item.page_number}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                  item.match_type === 'semantic'
                    ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                }`}
              >
                {item.match_type === 'semantic' ? <Sparkles className="w-3 h-3" /> : <KeyRound className="w-3 h-3" />}
                <span className="capitalize">{item.match_type} Match</span>
              </span>

              <span className="text-[10px] font-mono text-slate-400">
                Score: {(item.match_score * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
            "{item.snippet}"
          </p>

          <div className="flex justify-end pt-1">
            <button
              onClick={() => setActiveTab('documents')}
              className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              <span>View full document & ask questions →</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
