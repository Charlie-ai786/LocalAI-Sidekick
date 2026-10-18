import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  trend?: string;
  color?: 'brand' | 'emerald' | 'amber' | 'indigo' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  color = 'brand',
}) => {
  const colorStyles = {
    brand: 'text-brand-600 dark:text-brand-400 bg-brand-500/10 border-brand-500/20',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    indigo: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
  }[color];

  return (
    <div className="glass-card glow-card rounded-2xl p-5 border flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div className={`p-2.5 rounded-xl border ${colorStyles}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          {trend && (
            <span className="text-xs font-semibold text-emerald-500">
              {trend}
            </span>
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {subtext}
          </span>
        </div>
      </div>
    </div>
  );
};
