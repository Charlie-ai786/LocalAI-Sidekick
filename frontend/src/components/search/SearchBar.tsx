import React from 'react';
import { Search, Loader2, X } from 'lucide-react';

interface SearchBarProps {
  query: string;
  setQuery: (q: string) => void;
  onSearch: (e: React.FormEvent) => void;
  isSearching: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  setQuery,
  onSearch,
  isSearching,
}) => {
  return (
    <form onSubmit={onSearch} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="w-5 h-5 absolute left-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by keywords or semantic meaning (e.g. 'payment terms', 'GPU instance', 'refund policy')..."
          className="w-full pl-12 pr-28 py-3.5 rounded-2xl glass-card text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700/80 focus:outline-none focus:border-brand-500 shadow-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-20 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="absolute right-2.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-all disabled:opacity-50 shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          <span>Search</span>
        </button>
      </div>
    </form>
  );
};
