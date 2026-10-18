import React, { useState, useRef } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { useApp } from '../../context/AppContext';

interface UploadZoneProps {
  onUploadSuccess: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onUploadSuccess }) => {
  const { showToast } = useApp();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Check size limit 25MB
    if (file.size > 25 * 1024 * 1024) {
      showToast('File exceeds maximum size of 25MB.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      await api.uploadDocument(file);
      showToast(`Successfully indexed "${file.name}"`, 'success');
      onUploadSuccess();
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onDragOver={e => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={e => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      onClick={() => fileInputRef.current?.click()}
      className={`glass-card rounded-2xl p-8 border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
        isDragging
          ? 'border-brand-500 bg-brand-500/10 scale-[1.01]'
          : 'border-slate-300 dark:border-slate-700/80 hover:border-brand-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.csv,.md"
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />

      <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-500 dark:text-brand-400 flex items-center justify-center mb-4 shadow-sm">
        {isUploading ? (
          <Loader2 className="w-7 h-7 animate-spin" />
        ) : (
          <UploadCloud className="w-7 h-7" />
        )}
      </div>

      <h4 className="text-base font-bold text-slate-900 dark:text-white">
        {isUploading ? 'Extracting & Indexing Pages...' : 'Drop PDF, TXT, or CSV files here'}
      </h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
        Supports PDF contracts, reports, receipts, and text briefs up to 25MB. Files are processed 100% locally on your machine.
      </p>

      <div className="flex items-center gap-2 mt-4 text-[11px] font-medium text-slate-400">
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">PDF</span>
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">TXT</span>
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">CSV</span>
        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">MD</span>
      </div>
    </div>
  );
};
