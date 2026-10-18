import React, { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import { InvoiceRecord } from '../types';
import { useApp } from '../context/AppContext';
import { InvoiceTable } from '../components/invoices/InvoiceTable';
import { StatCard } from '../components/dashboard/StatCard';
import {
  DollarSign,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  UploadCloud,
  Loader2,
  X,
} from 'lucide-react';

export const InvoicesPage: React.FC = () => {
  const { refreshTrigger, triggerRefresh, showToast } = useApp();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInvoices = async () => {
    try {
      const data = await api.getInvoices();
      setInvoices(data);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [refreshTrigger]);

  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const needsReviewCount = invoices.filter(inv => inv.needs_review).length;
  const verifiedCount = invoices.filter(inv => !inv.needs_review).length;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsProcessing(true);
    try {
      await api.processInvoice(file);
      showToast(`Processed receipt "${file.name}" with local AI`, 'success');
      setIsUploadModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to parse invoice', 'error');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top metrics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Expenses"
          value={`$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext="Across all tracked receipts"
          icon={DollarSign}
          color="emerald"
        />

        <StatCard
          title="Total Receipts"
          value={invoices.length}
          subtext="Saved in local SQLite"
          icon={Receipt}
          color="brand"
        />

        <StatCard
          title="Needs Review"
          value={needsReviewCount}
          subtext={needsReviewCount > 0 ? 'Uncertain financial values' : 'No issues found'}
          icon={AlertTriangle}
          color={needsReviewCount > 0 ? 'amber' : 'emerald'}
        />

        <StatCard
          title="Verified Records"
          value={verifiedCount}
          subtext="Ready for accounting export"
          icon={CheckCircle2}
          color="purple"
        />
      </div>

      {/* Main Table */}
      <InvoiceTable
        invoices={invoices}
        onUploadReceipt={() => setIsUploadModalOpen(true)}
      />

      {/* Scan Receipt Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-700/80 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Scan Receipt or Invoice
                </h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl text-center cursor-pointer hover:border-brand-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all flex flex-col items-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.csv"
                className="hidden"
                onChange={e => handleFileUpload(e.target.files)}
              />
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
              </div>
              <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                {isProcessing ? 'Analyzing Receipt Line Items...' : 'Click or Drop Receipt to Scan'}
              </h5>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Extracts merchant, total amount, currency, tax, invoice number, and category without cloud transmission.
              </p>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>Supports PDF, TXT, and scanned bills</span>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
