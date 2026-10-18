import React from 'react';
import { DocumentItem } from '../../types';
import { FileText, Trash2, BookOpen, MessageSquare, Check, Sparkles } from 'lucide-react';

interface DocumentListProps {
  documents: DocumentItem[];
  selectedDocId: string | null;
  onSelectDoc: (id: string) => void;
  onDeleteDoc: (id: string, e: React.MouseEvent) => void;
  onAskDoc: (id: string, e: React.MouseEvent) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocId,
  onSelectDoc,
  onDeleteDoc,
  onAskDoc,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Indexed Documents ({documents.length})
        </span>
      </div>

      {documents.length > 0 ? (
        documents.map(doc => {
          const isSelected = selectedDocId === doc.id;
          return (
            <div
              key={doc.id}
              onClick={() => onSelectDoc(doc.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                isSelected
                  ? 'bg-brand-500/10 border-brand-500 text-brand-900 dark:text-brand-100 shadow-sm'
                  : 'glass-card border-slate-200 dark:border-slate-800/80 hover:border-brand-500/40 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2 rounded-lg ${isSelected ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-sm font-semibold truncate group-hover:text-brand-500 transition-colors">
                    {doc.original_name}
                  </h5>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span>{doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}</span>
                    <span>•</span>
                    <span>{doc.file_size_kb} KB</span>
                    {doc.summary && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-500 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Summarized
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                <button
                  onClick={e => onAskDoc(doc.id, e)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Ask questions about this document"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  onClick={e => onDeleteDoc(doc.id, e)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Delete document and remove embeddings"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })
      ) : (
        <div className="glass-card rounded-xl p-8 text-center text-xs text-slate-400 border">
          No documents uploaded yet. Upload a PDF or contract above to begin.
        </div>
      )}
    </div>
  );
};
