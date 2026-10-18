import React, { useState } from 'react';
import { Send, Bot, User, FileText, AlertCircle, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { api } from '../../api/client';
import { DocumentAskResponse, SourceCitation } from '../../types';
import { useApp } from '../../context/AppContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: SourceCitation[];
  foundInSource?: boolean;
  latency?: number;
}

interface DocumentChatProps {
  documentId?: string;
  documentName?: string;
}

export const DocumentChat: React.FC<DocumentChatProps> = ({
  documentId,
  documentName,
}) => {
  const { showToast } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: documentName
        ? `I am ready to answer questions grounded strictly in "${documentName}". What would you like to know?`
        : 'Ask any question about your indexed documents. Answers will cite specific source pages.',
      foundInSource: true,
    },
  ]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCitation, setSelectedCitation] = useState<SourceCitation | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    setInput('');

    const userMsg: Message = {
      id: Math.random().toString(),
      sender: 'user',
      text: query,
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res: DocumentAskResponse = await api.askDocument(query, documentId);
      const assistantMsg: Message = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: res.answer,
        sources: res.sources,
        foundInSource: res.found_in_source,
        latency: res.latency_sec,
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      showToast(err.message || 'Error executing query', 'error');
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'assistant',
          text: `Error: ${err.message || 'Failed to process question with local AI.'}`,
          foundInSource: false,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Document Q&A Assistant
            </h4>
            <p className="text-[11px] text-slate-400">
              {documentName ? `Scoped to: ${documentName}` : 'Cross-Document Hybrid RAG'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          Source-Grounded
        </span>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : 'bg-slate-100 dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700/80 shadow-sm'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Not found alert badge */}
                {msg.sender === 'assistant' && msg.foundInSource === false && (
                  <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Information was not verified in source text.</span>
                  </div>
                )}
              </div>

              {/* Source citations chips */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-slate-400 self-center mr-1">
                    Sources:
                  </span>
                  {msg.sources.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedCitation(src)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-200/60 dark:bg-slate-800/80 text-brand-600 dark:text-brand-300 border border-slate-300 dark:border-slate-700 hover:border-brand-500 transition-colors"
                      title={src.snippet}
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>
                        {src.document_name.slice(0, 14)}... (p.{src.page_number})
                      </span>
                    </button>
                  ))}
                  {msg.latency && (
                    <span className="text-[10px] text-slate-400 self-center ml-auto font-mono">
                      {msg.latency}s
                    </span>
                  )}
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <div className="w-8 h-8 rounded-xl bg-brand-600/50 text-white flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
              <span>Searching local vector index & generating response...</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Citation Modal Preview */}
      {selectedCitation && (
        <div className="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-xs flex items-start justify-between gap-3 animate-fade-in">
          <div>
            <span className="font-bold text-brand-500">
              Source Citation: {selectedCitation.document_name} (Page {selectedCitation.page_number})
            </span>
            <p className="mt-1 text-slate-600 dark:text-slate-300 italic font-mono text-[11px]">
              "{selectedCitation.snippet}"
            </p>
          </div>
          <button
            onClick={() => setSelectedCitation(null)}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input box */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/30">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={documentName ? `Ask about "${documentName}"...` : 'Ask a question across all documents...'}
          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="p-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-500 transition-colors disabled:opacity-50 shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
