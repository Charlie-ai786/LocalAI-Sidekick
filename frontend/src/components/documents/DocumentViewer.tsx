import React, { useState } from 'react';
import { DocumentDetail } from '../../types';
import { Sparkles, FileText, Loader2, Receipt, Copy, Check } from 'lucide-react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

interface DocumentViewerProps {
  document: DocumentDetail | null;
  onInvoiceCreated?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onInvoiceCreated,
}) => {
  const { showToast, triggerRefresh, setActiveTab } = useApp();
  const [focus, setFocus] = useState<string>('executive');
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summary, setSummary] = useState<string | null>(document?.summary || null);
  const [isProcessingInvoice, setIsProcessingInvoice] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync summary if doc changes
  React.useEffect(() => {
    setSummary(document?.summary || null);
  }, [document]);

  if (!document) {
    return (
      <div className="glass-card rounded-2xl p-12 border text-center flex flex-col items-center justify-center h-full text-slate-400">
        <FileText className="w-12 h-12 mb-3 opacity-30 text-brand-500" />
        <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300">
          No Document Selected
        </h4>
        <p className="text-xs max-w-xs mt-1">
          Select a document from the list to view its extracted text, generate local summaries, or scan as an invoice.
        </p>
      </div>
    );
  }

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const res = await api.summarizeDocument(document.id, focus);
      setSummary(res.summary);
      showToast('Generated summary with local AI', 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to generate summary', 'error');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleScanAsInvoice = async () => {
    setIsProcessingInvoice(true);
    try {
      await api.processInvoice(undefined, document.id);
      showToast('Document scanned and added to Invoices', 'success');
      triggerRefresh();
      setActiveTab('invoices');
      if (onInvoiceCreated) onInvoiceCreated();
    } catch (err: any) {
      showToast(err.message || 'Failed to parse invoice', 'error');
    } finally {
      setIsProcessingInvoice(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(document.extracted_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Document text copied to clipboard', 'info');
  };

  return (
    <div className="glass-card rounded-2xl border flex flex-col h-full overflow-hidden">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap bg-slate-50/50 dark:bg-slate-900/30">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-md">
            {document.original_name}
          </h4>
          <span className="text-xs text-slate-400">
            {document.page_count} pages • {document.char_count.toLocaleString()} characters
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Scan as Invoice Button */}
          <button
            onClick={handleScanAsInvoice}
            disabled={isProcessingInvoice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/20 transition-colors disabled:opacity-50"
            title="Scan document text for merchant, totals, and receipts"
          >
            {isProcessingInvoice ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Receipt className="w-3.5 h-3.5" />}
            <span>Parse as Invoice</span>
          </button>

          {/* Focus Dropdown */}
          <select
            value={focus}
            onChange={e => setFocus(e.target.value)}
            className="text-xs rounded-xl px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="executive">Executive Focus</option>
            <option value="financial">Financial Focus</option>
            <option value="action_items">Action Items</option>
            <option value="key_facts">Key Facts</option>
          </select>

          {/* Summarize button */}
          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-500 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSummarizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isSummarizing ? 'Summarizing...' : 'Summarize'}</span>
          </button>

          <button
            onClick={handleCopyText}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Copy extracted text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main content scroll area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* AI Summary card if available */}
        {summary && (
          <div className="p-5 rounded-2xl bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/20 text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-2 mb-3 text-brand-600 dark:text-brand-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>AI Executive Summary</span>
            </div>
            <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
              {summary}
            </div>
          </div>
        )}

        {/* Extracted Text Content */}
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Extracted Document Text
          </span>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs font-mono whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 select-text max-h-[500px] overflow-y-auto">
            {document.extracted_text || '[No selectable text found in document]'}
          </div>
        </div>
      </div>
    </div>
  );
};
