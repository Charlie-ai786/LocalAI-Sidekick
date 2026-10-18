import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DocumentDetail, DocumentItem } from '../types';
import { useApp } from '../context/AppContext';
import { UploadZone } from '../components/documents/UploadZone';
import { DocumentList } from '../components/documents/DocumentList';
import { DocumentViewer } from '../components/documents/DocumentViewer';
import { DocumentChat } from '../components/documents/DocumentChat';
import { FileText, MessageSquare, BookOpen } from 'lucide-react';

export const DocumentsPage: React.FC = () => {
  const { refreshTrigger, triggerRefresh, showToast } = useApp();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocDetail, setSelectedDocDetail] = useState<DocumentDetail | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<'viewer' | 'chat'>('viewer');

  const fetchDocs = async () => {
    try {
      const res = await api.getDocuments();
      setDocuments(res.documents);
      if (res.documents.length > 0 && !selectedDocId) {
        setSelectedDocId(res.documents[0].id);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [refreshTrigger]);

  useEffect(() => {
    if (!selectedDocId) {
      setSelectedDocDetail(null);
      return;
    }
    const fetchDetail = async () => {
      try {
        const detail = await api.getDocumentDetail(selectedDocId);
        setSelectedDocDetail(detail);
      } catch (err) {
        console.error('Failed to fetch document detail:', err);
      }
    };
    fetchDetail();
  }, [selectedDocId, refreshTrigger]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this document and all its indexed chunks?')) return;
    try {
      await api.deleteDocument(id);
      showToast('Document deleted and embeddings removed', 'info');
      if (selectedDocId === id) {
        setSelectedDocId(null);
      }
      triggerRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete document', 'error');
    }
  };

  const handleAsk = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDocId(id);
    setActiveViewTab('chat');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-130px)]">
      {/* Left panel: Upload & List (5 cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4 h-full overflow-hidden">
        <UploadZone onUploadSuccess={triggerRefresh} />
        <div className="flex-1 overflow-y-auto pr-1">
          <DocumentList
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDoc={id => setSelectedDocId(id)}
            onDeleteDoc={handleDelete}
            onAskDoc={handleAsk}
          />
        </div>
      </div>

      {/* Right panel: Viewer or Chat (7 cols) */}
      <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
        {/* Tab switch between viewer and chat */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setActiveViewTab('viewer')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeViewTab === 'viewer'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'glass-card text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Document Text & Summary</span>
          </button>

          <button
            onClick={() => setActiveViewTab('chat')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeViewTab === 'chat'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'glass-card text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>RAG Q&A Assistant</span>
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeViewTab === 'viewer' ? (
            <DocumentViewer
              document={selectedDocDetail}
              onInvoiceCreated={() => triggerRefresh()}
            />
          ) : (
            <DocumentChat
              documentId={selectedDocId || undefined}
              documentName={selectedDocDetail?.original_name}
            />
          )}
        </div>
      </div>
    </div>
  );
};
