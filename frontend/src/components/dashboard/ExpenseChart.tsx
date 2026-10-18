import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

interface ExpenseChartProps {
  monthlyData: { month: string; amount: number }[];
  categoryData: Record<string, number>;
}

const CATEGORY_COLORS = [
  '#6366f1', // brand indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#3b82f6', // blue
  '#14b8a6', // teal
  '#64748b', // slate
];

export const ExpenseChart: React.FC<ExpenseChartProps> = ({
  monthlyData,
  categoryData,
}) => {
  const categoriesList = Object.entries(categoryData).map(([name, value]) => ({
    name,
    amount: value,
  })).sort((a, b) => b.amount - a.amount);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Expense Trend */}
      <div className="glass-card rounded-2xl p-6 border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Expense Trajectory
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monthly spending totals extracted from local invoices
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">
            Real-Time
          </span>
        </div>

        <div className="h-64 w-full">
          {monthlyData && monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={v => `$${v}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#475569',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`$${val.toFixed(2)}`, 'Expenses']}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No invoice expense data yet.
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="glass-card rounded-2xl p-6 border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Spending by Category
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tax & accounting category segmentation
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          {categoriesList.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoriesList}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={v => `$${v}`} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#475569',
                    borderRadius: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`$${val.toFixed(2)}`, 'Total']}
                />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                  {categoriesList.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No expenses categorized yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
