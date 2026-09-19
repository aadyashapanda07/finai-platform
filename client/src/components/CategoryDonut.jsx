import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#3b82f6', // blue
  '#f43f5e', // rose
  '#14b8a6', // teal
  '#84cc16'  // lime
];

export default function CategoryDonut({ breakdown = [] }) {
  const total = breakdown.reduce((acc, item) => acc + item.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl font-mono text-xs">
          <p className="font-bold text-slate-200">{data.name}</p>
          <p className="text-emerald-400 font-semibold">${data.value.toLocaleString()} ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
      <div>
        <h3 className="font-bold text-sm text-slate-100">Spending by Category</h3>
        <p className="text-xs text-slate-400">Distribution across active budget buckets</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Donut Chart */}
        <div className="h-52 w-52 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={breakdown}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {breakdown.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    stroke="#0f172a" 
                    strokeWidth={2}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[11px] text-slate-400 font-medium">Total Spend</span>
            <span className="text-base font-extrabold text-slate-100 font-mono">
              ${Math.round(total).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Category Legend */}
        <div className="w-full flex-1 grid grid-cols-2 gap-2 text-xs">
          {breakdown.slice(0, 6).map((item, idx) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/50 border border-slate-800/60">
                <span 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <div className="truncate flex-1">
                  <div className="truncate text-slate-300 font-medium">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono font-semibold">
                    ${Math.round(item.value).toLocaleString()} ({pct}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
