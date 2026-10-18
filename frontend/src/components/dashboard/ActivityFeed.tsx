import React from 'react';
import { ActivityLogItem } from '../../types';
import { FileText, Receipt, Sparkles, Search, Trash2, CheckCircle2 } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityLogItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'document_upload':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'invoice_extraction':
        return <Receipt className="w-4 h-4 text-emerald-500" />;
      case 'summary':
      case 'studio_generate':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'rag_query':
        return <Search className="w-4 h-4 text-brand-500" />;
      case 'document_deletion':
        return <Trash2 className="w-4 h-4 text-rose-500" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
    }
  };

  const formatTime = (ts: string) => {
    try {
      const date = new Date(ts);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            Recent Local Activities
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time execution log of on-device AI actions
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {activities.length > 0 ? (
          activities.map(act => (
            <div
              key={act.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60 hover:border-brand-500/30 transition-all text-xs"
            >
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 mt-0.5">
                {getActivityIcon(act.activity_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {act.title}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono ml-2 flex-shrink-0">
                    {formatTime(act.timestamp)}
                  </span>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 line-clamp-1">
                  {act.description}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-xs text-slate-400">
            No activities recorded yet.
          </div>
        )}
      </div>
    </div>
  );
};
