import React, { useState } from 'react';
import { Copy, Download, Check, Sparkles, FileText } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ContentEditorProps {
  content: string;
  setContent: (v: string) => void;
  templateTitle: string;
  latencySec?: number;
}

export const ContentEditor: React.FC<ContentEditorProps> = ({
  content,
  setContent,
  templateTitle,
  latencySec,
}) => {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);

  const wordCount = content ? content.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.ceil(wordCount / 200);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied content to clipboard', 'success');
  };

  const handleDownload = (format: 'md' | 'txt') => {
    if (!content) return;
    const blob = new Blob([content], { type: format === 'md' ? 'text/markdown' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localai_${templateTitle.toLowerCase().replace(/\s+/g, '_')}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded as .${format}`, 'info');
  };

  return (
    <div className="glass-card rounded-2xl border flex flex-col h-full overflow-hidden">
      {/* Editor toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Generated Result
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>~{readTimeMin} min read</span>
              {latencySec && (
                <>
                  <span>•</span>
                  <span className="font-mono text-emerald-500">{latencySec}s generation</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            disabled={!content}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-brand-500 transition-colors disabled:opacity-40"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          <button
            onClick={() => handleDownload('md')}
            disabled={!content}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-brand-500 transition-colors disabled:opacity-40"
            title="Download Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.MD</span>
          </button>

          <button
            onClick={() => handleDownload('txt')}
            disabled={!content}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-brand-500 transition-colors disabled:opacity-40"
            title="Download Plain Text"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.TXT</span>
          </button>
        </div>
      </div>

      {/* Editor text area */}
      <div className="flex-1 p-5 overflow-y-auto">
        {content ? (
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full h-full min-h-[420px] bg-transparent text-slate-800 dark:text-slate-100 text-xs leading-relaxed font-sans focus:outline-none resize-none"
            placeholder="Generated content will appear here..."
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-16">
            <FileText className="w-12 h-12 mb-3 opacity-30 text-purple-500" />
            <h5 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Content Studio Ready
            </h5>
            <p className="text-xs max-w-xs mt-1">
              Select a template and click "Generate Content" to draft proposals, emails, or product descriptions using local open-weight models.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
