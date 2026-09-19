import React from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  CheckCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export default function HealthScoreCard({ health }) {
  if (!health) return null;

  const { score, tier, tierColor, summary, pillars, metrics, projections } = health;

  // SVG circular gauge calculation
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Left: Score Circular Gauge */}
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="text-slate-800"
                strokeWidth="10"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke={
                  score >= 85 ? '#10b981' : score >= 70 ? '#14b8a6' : score >= 50 ? '#f59e0b' : '#f43f5e'
                }
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
                {score}
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">/ 100</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Financial Health Index</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold bg-slate-800 border border-slate-700 ${tierColor}`}>
                {tier} Tier
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
              Financial Status
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </h3>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              {summary}
            </p>
          </div>
        </div>

        {/* Center: 4 Health Pillars */}
        <div className="w-full lg:w-auto flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pillars.map((p, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-[11px] text-slate-400 font-medium truncate">{p.name}</div>
                <div className="text-sm font-bold text-slate-200 mt-1 font-mono">{p.metric}</div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                  <span>Score</span>
                  <span className="font-semibold text-emerald-400">{p.score}/{p.max}</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${(p.score / p.max) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 30/60/90 Projections bar */}
      {projections && (
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <span>AI Predictive Cash Flow Trajectory:</span>
          </div>
          <div className="flex flex-wrap gap-4 font-mono">
            {projections.map((proj, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-slate-400">{proj.period}:</span>
                <span className={`font-bold ${proj.net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {proj.net >= 0 ? '+' : ''}${Math.round(proj.net).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
