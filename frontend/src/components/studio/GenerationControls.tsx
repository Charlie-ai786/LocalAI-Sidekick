import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

interface GenerationControlsProps {
  topic: string;
  setTopic: (v: string) => void;
  audience: string;
  setAudience: (v: string) => void;
  tone: string;
  setTone: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
  length: string;
  setLength: (v: string) => void;
  keyPoints: string;
  setKeyPoints: (v: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  selectedTemplateTitle: string;
}

const TONES = ['Professional', 'Friendly', 'Persuasive', 'Bold', 'Urgent', 'Casual'];
const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Japanese'];
const LENGTHS = ['Short', 'Medium', 'Long'];

export const GenerationControls: React.FC<GenerationControlsProps> = ({
  topic,
  setTopic,
  audience,
  setAudience,
  tone,
  setTone,
  language,
  setLanguage,
  length,
  setLength,
  keyPoints,
  setKeyPoints,
  onGenerate,
  isGenerating,
  selectedTemplateTitle,
}) => {
  return (
    <div className="glass-card rounded-2xl p-5 border space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
          Studio Parameters ({selectedTemplateTitle})
        </h4>
        <span className="text-[11px] text-brand-500 font-semibold">
          100% On-Device Copywriting
        </span>
      </div>

      <div className="space-y-3">
        {/* Topic / Project Title */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Subject / Product / Topic *
          </label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Ergonomic wireless split keyboard for developers"
            className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Target Audience */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Target Audience
          </label>
          <input
            type="text"
            value={audience}
            onChange={e => setAudience(e.target.value)}
            placeholder="e.g. Tech leads, remote workers, students"
            className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Three column controls: Tone, Length, Language */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Tone
            </label>
            <select
              value={tone}
              onChange={e => setTone(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              {TONES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Length
            </label>
            <select
              value={length}
              onChange={e => setLength(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              {LENGTHS.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">
              Language
            </label>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              {LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Key Points */}
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Key Features & Specific Deliverables
          </label>
          <textarea
            value={keyPoints}
            onChange={e => setKeyPoints(e.target.value)}
            rows={3}
            placeholder="List specific numbers, pricing, warranty, or key value propositions..."
            className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 resize-none font-sans"
          />
        </div>

        <button
          onClick={onGenerate}
          disabled={isGenerating || !topic.trim()}
          className="w-full py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white transition-all shadow-glow flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Content Locally...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Content</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
