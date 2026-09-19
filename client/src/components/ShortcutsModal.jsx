import React from 'react';
import { X, Keyboard, Sparkles } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K', mac: '⌘ + K', desc: 'Open AI Natural Language Omnibar' },
    { key: 'Ctrl + R', mac: '⌘ + R', desc: 'Open Smart Receipt Scanner' },
    { key: 'Ctrl + N', mac: '⌘ + N', desc: 'Add Manual Transaction' },
    { key: 'Ctrl + E', mac: '⌘ + E', desc: 'Export / Backup Financial Data' },
    { key: '?', mac: '?', desc: 'Show this Keyboard Shortcuts Guide' },
    { key: 'Esc', mac: 'Esc', desc: 'Close any modal or dialog' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-slate-100">Keyboard Shortcuts</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-300 font-medium">{s.desc}</span>
              <kbd className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-[11px] text-emerald-300 shadow">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
