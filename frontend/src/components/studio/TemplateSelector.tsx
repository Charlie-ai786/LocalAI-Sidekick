import React from 'react';
import { StudioTemplate } from '../../types';
import { Package, Mail, FileText, Share2, Briefcase, Zap } from 'lucide-react';

interface TemplateSelectorProps {
  templates: StudioTemplate[];
  selectedTemplateId: string;
  onSelectTemplate: (template: StudioTemplate) => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplateId,
  onSelectTemplate,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Package': return <Package className="w-5 h-5 text-blue-500" />;
      case 'Mail': return <Mail className="w-5 h-5 text-indigo-500" />;
      case 'FileText': return <FileText className="w-5 h-5 text-purple-500" />;
      case 'Share2': return <Share2 className="w-5 h-5 text-pink-500" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5 text-amber-500" />;
      case 'Zap': return <Zap className="w-5 h-5 text-emerald-500" />;
      default: return <FileText className="w-5 h-5 text-brand-500" />;
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {templates.map(tpl => {
        const isSelected = selectedTemplateId === tpl.id;
        return (
          <button
            key={tpl.id}
            onClick={() => onSelectTemplate(tpl)}
            className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between group ${
              isSelected
                ? 'bg-brand-500/10 border-brand-500 shadow-glow'
                : 'glass-card border-slate-200 dark:border-slate-800 hover:border-brand-500/40'
            }`}
          >
            <div>
              <div className="mb-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-fit">
                {getIcon(tpl.icon)}
              </div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                {tpl.title}
              </h5>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
              {tpl.description}
            </p>
          </button>
        );
      })}
    </div>
  );
};
