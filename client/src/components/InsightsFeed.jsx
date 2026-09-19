import React, { useState } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  X, 
  ArrowRight, 
  RotateCw,
  Zap,
  CheckCheck
} from 'lucide-react';
import { api } from '../utils/api';

export default function InsightsFeed({ insights, onRefresh, onNavigate, onNotify }) {
  const [refreshing, setRefreshing] = useState(false);
  const [dismissingAll, setDismissingAll] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.generateInsights();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Refresh insights error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDismiss = async (id, e) => {
    e.stopPropagation();
    try {
      await api.dismissInsight(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Dismiss insight error:', err);
    }
  };

  const handleDismissAll = async () => {
    setDismissingAll(true);
    try {
      await api.dismissAllInsights();
      if (onRefresh) onRefresh();
      if (onNotify) onNotify({ title: 'Insights Cleared', message: 'All active alerts dismissed.', type: 'info' });
    } catch (err) {
      console.error('Dismiss all error:', err);
    } finally {
      setDismissingAll(false);
    }
  };

  if (!insights || insights.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">No Critical Financial Warnings</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Your budgets are balanced and no immediate spending leaks were detected.
        </p>
        <button
          onClick={handleRefresh}
          className="text-xs px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-all"
        >
          Re-scan Insights
        </button>
      </div>
    );
  }

  const getSeverityStyle = (severity) => {
    switch (severity) {
      case 'critical':
      case 'warning':
        return {
          icon: AlertTriangle,
          border: 'border-amber-500/30 hover:border-amber-500/50',
          bg: 'bg-amber-950/20',
          iconColor: 'text-amber-400',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        };
      case 'success':
        return {
          icon: CheckCircle2,
          border: 'border-emerald-500/30 hover:border-emerald-500/50',
          bg: 'bg-emerald-950/20',
          iconColor: 'text-emerald-400',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        };
      case 'info':
      default:
        return {
          icon: Info,
          border: 'border-cyan-500/30 hover:border-cyan-500/50',
          bg: 'bg-cyan-950/20',
          iconColor: 'text-cyan-400',
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
        };
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            Active AI Insights & Leak Alerts
          </h3>
          <span className="text-xs font-mono font-bold px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {insights.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDismissAll}
            disabled={dismissingAll}
            className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Dismiss all active insights"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dismiss All</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Refresh AI Analysis"
          >
            <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Analysis</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((ins) => {
          const style = getSeverityStyle(ins.severity);
          const Icon = style.icon;

          return (
            <div
              key={ins.id}
              className={`p-4 rounded-xl border ${style.border} ${style.bg} backdrop-blur-sm transition-all duration-200 relative group flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${style.iconColor} flex-shrink-0`} />
                    <span className="text-xs font-bold text-slate-100 line-clamp-1">
                      {ins.title}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDismiss(ins.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-opacity"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed pl-6">
                  {ins.message}
                </p>
              </div>

              {ins.action_label && (
                <div className="mt-3 pl-6 pt-2 border-t border-slate-800/40 flex justify-end">
                  <button
                    onClick={() => {
                      if (onNavigate && ins.action_payload) {
                        const tab = ins.action_payload.replace('/', '');
                        onNavigate(tab || 'dashboard');
                      }
                    }}
                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:gap-1.5 transition-all"
                  >
                    <span>{ins.action_label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
