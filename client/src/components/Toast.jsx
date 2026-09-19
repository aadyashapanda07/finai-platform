import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        let Icon = CheckCircle2;
        let border = 'border-emerald-500/30';
        let bg = 'bg-slate-900/95 text-emerald-400';

        if (t.type === 'error') {
          Icon = AlertTriangle;
          border = 'border-rose-500/40';
          bg = 'bg-slate-900/95 text-rose-400';
        } else if (t.type === 'info') {
          Icon = Info;
          border = 'border-cyan-500/30';
          bg = 'bg-slate-900/95 text-cyan-400';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${border} ${bg} shadow-2xl backdrop-blur-md animate-in slide-in-from-top-3 duration-300`}
          >
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <div className="font-bold text-slate-100">{t.title}</div>
              {t.message && <div className="text-slate-300 mt-0.5 leading-relaxed">{t.message}</div>}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
