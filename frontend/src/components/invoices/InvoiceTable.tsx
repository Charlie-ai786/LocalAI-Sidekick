import React, { useState } from 'react';
import { InvoiceRecord } from '../../types';
import {
  Download,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Edit2,
  Save,
  X,
  FileSpreadsheet,
  Plus,
  Loader2,
} from 'lucide-react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

interface InvoiceTableProps {
  invoices: InvoiceRecord[];
  onUploadReceipt: () => void;
}

const CATEGORIES = [
  'Software & Subscriptions',
  'Office & Workspace',
  'Hardware & Equipment',
  'Travel & Transport',
  'Meals & Entertainment',
  'Professional & Legal',
  'Marketing & Ads',
  'Utilities & Hosting',
  'General Business',
];

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  onUploadReceipt,
}) => {
  const { showToast, triggerRefresh } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InvoiceRecord>>({});
  const [isSaving, setIsSaving] = useState(false);

  const startEdit = (inv: InvoiceRecord) => {
    setEditingId(inv.id);
    setEditForm({
      merchant: inv.merchant,
      invoice_date: inv.invoice_date,
      total_amount: inv.total_amount,
      currency: inv.currency,
      tax_amount: inv.tax_amount,
      invoice_number: inv.invoice_number,
      category: inv.category,
      needs_review: inv.needs_review,
      notes: inv.notes,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (id: string) => {
    setIsSaving(true);
    try {
      await api.updateInvoice(id, editForm);
      showToast('Invoice fields updated successfully', 'success');
      setEditingId(null);
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to update invoice', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice record?')) return;
    try {
      await api.deleteInvoice(id);
      showToast('Invoice deleted', 'info');
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete invoice', 'error');
    }
  };

  const handleExportCsv = () => {
    window.open(api.getExportCsvUrl(), '_blank');
    showToast('Exported invoice records to CSV', 'success');
  };

  return (
    <div className="glass-card rounded-2xl border overflow-hidden">
      {/* Table toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-wrap bg-slate-50/50 dark:bg-slate-900/30">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Extracted Invoices & Receipts ({invoices.length})
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Records stored in local SQLite database. Correct any uncertain extractions below.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-brand-500 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-brand-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onUploadReceipt}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-500 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Scan Receipt</span>
          </button>
        </div>
      </div>

      {/* Responsive table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
              <th className="py-3 px-4">Merchant / Vendor</th>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Tax</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Review Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-sans">
            {invoices.length > 0 ? (
              invoices.map(inv => {
                const isEditing = editingId === inv.id;

                if (isEditing) {
                  return (
                    <tr key={inv.id} className="bg-brand-500/5 dark:bg-brand-500/10">
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editForm.merchant || ''}
                          onChange={e => setEditForm({ ...editForm, merchant: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editForm.invoice_number || ''}
                          onChange={e => setEditForm({ ...editForm, invoice_number: e.target.value })}
                          className="w-24 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={editForm.invoice_date || ''}
                          onChange={e => setEditForm({ ...editForm, invoice_date: e.target.value })}
                          className="w-24 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={editForm.category || ''}
                          onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                          className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs"
                        >
                          {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.tax_amount ?? ''}
                          onChange={e => setEditForm({ ...editForm, tax_amount: parseFloat(e.target.value) || 0 })}
                          className="w-16 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.total_amount ?? ''}
                          onChange={e => setEditForm({ ...editForm, total_amount: parseFloat(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-bold"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!editForm.needs_review}
                            onChange={e => setEditForm({ ...editForm, needs_review: !e.target.checked })}
                            className="rounded text-brand-600"
                          />
                          <span className="text-[11px] text-slate-600 dark:text-slate-300">Verified</span>
                        </label>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => saveEdit(inv.id)}
                            disabled={isSaving}
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                            title="Save changes"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {inv.merchant}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {inv.invoice_number || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {inv.invoice_date || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                        {inv.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {inv.tax_amount !== null ? `$${inv.tax_amount.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-emerald-400">
                      {inv.total_amount !== null
                        ? `${inv.currency} ${inv.total_amount.toFixed(2)}`
                        : <span className="text-amber-500">Unspecified</span>}
                    </td>
                    <td className="py-3 px-4">
                      {inv.needs_review ? (
                        <div
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/30"
                          title={inv.review_reasons?.join(', ') || 'Uncertain values need verification'}
                        >
                          <AlertTriangle className="w-3 h-3" />
                          <span>Needs Review</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => startEdit(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Correct extracted fields"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete invoice record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                  No invoice records saved. Upload a receipt or scan a PDF document above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
