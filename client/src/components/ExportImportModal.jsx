import React, { useState } from 'react';
import { X, Download, Upload, FileSpreadsheet, Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../utils/api';

export default function ExportImportModal({ isOpen, onClose, onSuccess, onNotify }) {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    window.location.href = '/api/export/csv';
    if (onNotify) onNotify({ title: 'Downloading CSV', message: 'Transactions exported successfully.' });
  };

  const handleDownloadJson = () => {
    window.location.href = '/api/export/json';
    if (onNotify) onNotify({ title: 'Downloading JSON Backup', message: 'Full database snapshot exported.' });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result;
        let items = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          items = parsed.data?.transactions || parsed;
        } else {
          // Parse CSV
          const lines = text.split(/\r?\n/).filter(Boolean);
          const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
          
          for (let i = 1; i < lines.length; i++) {
            const vals = lines[i].split(',').map(v => v.replace(/^"|"$/g, '').trim());
            if (vals.length >= 2) {
              items.push({
                date: vals[0],
                type: vals[1] || 'expense',
                category: vals[2] || 'General',
                merchant: vals[3] || 'Imported Merchant',
                description: vals[4] || '',
                amount: parseFloat(vals[5] || vals[1] || 0)
              });
            }
          }
        }

        const res = await api.importData(items);
        if (res.success) {
          setImportResult(`Successfully imported ${res.imported} transactions.`);
          if (onNotify) onNotify({ title: 'Import Complete', message: `Imported ${res.imported} records.` });
          if (onSuccess) onSuccess();
        }
      } catch (err) {
        setImportResult(`Error parsing import file: ${err.message}`);
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-slate-100">Export & Import Financial Data</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Options */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            1. Download & Export
          </label>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              onClick={handleDownloadCsv}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-950/10 transition-all flex flex-col items-center justify-center gap-2 text-center group"
            >
              <FileSpreadsheet className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-slate-200">Export CSV</div>
                <span className="text-[10px] text-slate-500">Excel / Google Sheets</span>
              </div>
            </button>

            <button
              onClick={handleDownloadJson}
              className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/10 transition-all flex flex-col items-center justify-center gap-2 text-center group"
            >
              <Database className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-slate-200">Backup JSON</div>
                <span className="text-[10px] text-slate-500">Full platform archive</span>
              </div>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
            2. Restore / Import Data
          </label>
          <div className="relative border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-2xl p-5 text-center transition-all bg-slate-950/40 cursor-pointer">
            <input
              type="file"
              accept=".csv,.json"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center space-y-1.5">
              <Upload className="w-6 h-6 text-slate-400" />
              <div className="text-xs text-slate-300 font-medium">
                Click to upload <span className="text-emerald-400 underline">CSV or JSON file</span>
              </div>
              <p className="text-[10px] text-slate-500">Restores transactions into your active database</p>
            </div>
          </div>

          {importing && (
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Parsing and importing records...</span>
            </div>
          )}

          {importResult && (
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{importResult}</span>
            </div>
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
