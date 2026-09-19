import React, { useState } from 'react';
import { X, Key, Sparkles, Check, Info, ShieldCheck, Cpu, RotateCcw, Trash2, Database, AlertTriangle } from 'lucide-react';
import { api } from '../utils/api';

export default function SettingsModal({ isOpen, onClose, apiKey, setApiKey, onSuccess, onNotify }) {
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [clearing, setClearing] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setApiKey(inputKey.trim());
    localStorage.setItem('finai_gemini_api_key', inputKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const handleReseed = async () => {
    if (!confirm('Reset entire ledger and restore rich sample transactions, budgets, subscriptions, and goals?')) return;
    setResetting(true);
    try {
      const res = await api.reseedData();
      if (res.success) {
        if (onNotify) onNotify({ title: 'Sample Data Restored', message: 'Initialized full financial ledger with sample entries.' });
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Reseed error:', err);
    } finally {
      setResetting(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('CAUTION: This will permanently wipe ALL transactions, budgets, subscriptions, assets, liabilities, and goals. Are you sure?')) return;
    setClearing(true);
    try {
      const res = await api.clearAllData();
      if (res.success) {
        if (onNotify) onNotify({ title: 'Ledger Cleared', message: 'All personal finance data wiped clean.', type: 'info' });
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Clear error:', err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-slate-100">Settings & Intelligence Engine</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: AI Engine */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Cpu className="w-4 h-4" />
              <span>Dual-Mode AI Intelligence</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              • <strong className="text-slate-200">Local Engine (Default):</strong> 100% private, deterministic rule-based NLP extraction and receipt parsing without external API keys.<br />
              • <strong className="text-slate-200">Gemini Cloud AI:</strong> Add an optional Google Gemini API Key for deep conversational coaching and multimodal OCR.
            </p>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Google Gemini API Key (Optional)</label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Keys are stored strictly in your local browser storage.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 shadow"
            >
              {saved ? <Check className="w-4 h-4" /> : <Key className="w-4 h-4" />}
              <span>{saved ? 'Saved!' : 'Save Key'}</span>
            </button>
          </div>
        </form>

        {/* Section 2: Data Management & Reset */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-slate-200 font-semibold">
            <Database className="w-4 h-4 text-cyan-400" />
            <span>Ledger & Database Operations</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleReseed}
              disabled={resetting}
              className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-left transition-all flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
                <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                <span>Reset Sample Data</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Restore full demo transactions, budgets, goals & assets
              </p>
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={clearing}
              className="p-3 rounded-xl bg-slate-950 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-500/40 text-slate-300 text-left transition-all flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-rose-400 font-semibold mb-1">
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Data</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Wipe all records to start completely fresh
              </p>
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
          >
            Close Settings
          </button>
        </div>
      </div>
    </div>
  );
}
