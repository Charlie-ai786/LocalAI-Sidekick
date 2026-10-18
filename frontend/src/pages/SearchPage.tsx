import React, { useState } from 'react';
import { api } from '../api/client';
import { SearchResultItem } from '../types';
import { useApp } from '../context/AppContext';
import { SearchBar } from '../components/search/SearchBar';
import { SearchResults } from '../components/search/SearchResults';
import { Search, Sparkles, HelpCircle } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const { showToast } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const sampleQueries = [
    'retainer payment',
    'GPU compute instances',
    'privacy and compliance',
    'termination clause',
    'workstation hardware',
  ];

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery || query;
    if (!q.trim()) return;

    if (customQuery) setQuery(customQuery);

    setIsSearching(true);
    try {
      const res = await api.search(q.trim());
      setResults(res.results);
      setHasSearched(true);
    } catch (err: any) {
      showToast(err.message || 'Search failed', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Search Bar */}
      <SearchBar
        query={query}
        setQuery={setQuery}
        onSearch={handleSearch}
        isSearching={isSearching}
      />

      {/* Sample Query Suggestions */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
        <span className="flex items-center gap-1 font-semibold text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-brand-500" />
          <span>Try searching:</span>
        </span>
        {sampleQueries.map(sq => (
          <button
            key={sq}
            onClick={() => handleSearch(undefined, sq)}
            className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-500 hover:text-brand-500 transition-colors"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Results or Empty State */}
      {hasSearched ? (
        results.length > 0 ? (
          <SearchResults results={results} query={query} />
        ) : (
          <div className="glass-card rounded-2xl p-12 border text-center text-slate-400 space-y-2">
            <Search className="w-10 h-10 mx-auto opacity-30 text-brand-500" />
            <h5 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No matching snippets found
            </h5>
            <p className="text-xs max-w-sm mx-auto">
              We searched across all indexed document chunks but found no strong matches. Try broader keywords or index additional files.
            </p>
          </div>
        )
      ) : (
        <div className="glass-card rounded-2xl p-12 border text-center text-slate-400 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Hybrid Vector & Semantic File Search
          </h4>
          <p className="text-xs max-w-md mx-auto leading-relaxed">
            Search naturally across your contracts, proposals, guides, and invoices. Results combine semantic dense embeddings with exact keyword BM25 retrieval without sending your files to any cloud vector database.
          </p>
        </div>
      )}
    </div>
  );
};
