import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function CashFlowChart({ trends = [] }) {
  // If trends data is sparse, provide default monthly progression
  const displayData = trends && trends.length > 0 ? trends : [
    { month: 'Jun', income: 4850, expense: 2780 },
    { month: 'Jul', income: 5200, expense: 3100 },
    { month: 'Aug', income: 4850, expense: 2950 },
    { month: 'Sep', income: 5742, expense: 2840 }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const inc = payload.find(p => p.dataKey === 'income')?.value || 0;
      const exp = payload.find(p => p.dataKey === 'expense')?.value || 0;
      const net = inc - exp;

      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl font-mono text-xs space-y-1">
          <p className="font-bold text-slate-200">{label}</p>
          <p className="text-emerald-400">Income: ${inc.toLocaleString()}</p>
          <p className="text-rose-400">Expense: ${exp.toLocaleString()}</p>
          <div className="pt-1 border-t border-slate-800 text-slate-300 font-bold">
            Net Surplus: <span className={net >= 0 ? 'text-teal-400' : 'text-rose-400'}>${net.toLocaleString()}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-100">Monthly Cash Flow Velocity</h3>
          <p className="text-xs text-slate-400">Net Inflow vs Outflow over time</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-300">Income</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-slate-300">Expenses</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#incomeGrad)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#f43f5e"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#expenseGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
