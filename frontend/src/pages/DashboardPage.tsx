import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DashboardStats } from '../types';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/dashboard/StatCard';
import { ExpenseChart } from '../components/dashboard/ExpenseChart';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { QuickActions } from '../components/dashboard/QuickActions';
import { FileText, Receipt, DollarSign, AlertCircle, HardDrive, ShieldCheck, Cpu } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { refreshTrigger } = useApp();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [refreshTrigger]);

  return (
    <div className="space-y-6">
      {/* Quick Action Cards */}
      <QuickActions />

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Documents Indexed"
          value={stats ? stats.total_documents : 0}
          subtext="Processed on local device"
          icon={FileText}
          trend="+100% private"
          color="brand"
        />

        <StatCard
          title="Invoices Tracked"
          value={stats ? stats.total_invoices : 0}
          subtext={stats?.needs_review_count ? `${stats.needs_review_count} need review` : 'All verified'}
          icon={Receipt}
          trend={stats?.needs_review_count ? 'Action required' : 'Verified'}
          color={stats?.needs_review_count ? 'amber' : 'emerald'}
        />

        <StatCard
          title="Total Expenses"
          value={stats ? `$${stats.total_expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'}
          subtext="Extracted line totals"
          icon={DollarSign}
          color="emerald"
        />

        <StatCard
          title="Storage Utilized"
          value={stats ? `${stats.storage_used_mb} MB` : '0 MB'}
          subtext="Local disk footprint"
          icon={HardDrive}
          trend="No cloud storage"
          color="purple"
        />
      </div>

      {/* Analytics Charts */}
      {stats && (
        <ExpenseChart
          monthlyData={stats.monthly_expenses}
          categoryData={stats.expenses_by_category}
        />
      )}

      {/* Activity Timeline */}
      {stats && (
        <ActivityFeed activities={stats.recent_activities} />
      )}
    </div>
  );
};
