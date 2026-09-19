import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  Tag, 
  Store, 
  DollarSign, 
  Loader2,
  Zap,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react';
import { api } from '../utils/api';

const QUICK_PROMPTS = [
  "Spent $48.50 at Trader Joe's for groceries yesterday",
  "Received $3,500 salary from Acme Corp",
  "Dinner at Chipotle with friends $28.40",
  "Budget $400 for Dining Out",
  "Subscribe to Netflix $19.99 per month",
  "Save $250 for Kyoto Autumn Journey"
];

export default function NaturalLanguageModal({ isOpen, onClose, onSuccess, apiKey }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [editedFields, setEditedFields] = useState({});
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setParsedResult(null);
      setEditedFields({});
      setIsListening(false);
      setSpeechError(null);
    }
  }, [isOpen]);

  // Voice Dictation handler
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechError('Voice dictation is not supported in this browser. Please use Chrome/Edge.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
        handleParse(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        setIsListening(false);
        setSpeechError(`Microphone error: ${event.error}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech init error:', err);
      setIsListening(false);
    }
  };

  const handleParse = async (textToParse) => {
    const q = textToParse || query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const res = await api.parseNaturalLanguage(q, apiKey);
      if (res.success) {
        setParsedResult(res);
        setEditedFields({
          ...res.extracted
        });
      }
    } catch (err) {
      console.error('NLP Parse error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!parsedResult) return;
    setConfirming(true);
    try {
      const res = await api.confirmNaturalLanguage({
        intent: parsedResult.intent,
        extracted: editedFields
      });
      if (res.success) {
        onSuccess(res);
        onClose();
      }
    } catch (err) {
      console.error('NLP Confirm error:', err);
    } finally {
      setConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-emerald-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
                Natural Language Financial Omnibar
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  NLP AI
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Type your expense, income, budget, or savings goal in everyday language.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Query Input Section */}
        <div className="p-6 space-y-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleParse();
              }}
              placeholder={isListening ? 'Listening... speak your transaction now!' : "e.g. Spent $62.50 at Trader Joe's yesterday on groceries..."}
              className={`w-full px-4 py-3.5 pl-11 pr-36 bg-slate-950 border rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none text-sm transition-all ${
                isListening
                  ? 'border-rose-500 ring-2 ring-rose-500/20 placeholder:text-rose-400 animate-pulse'
                  : 'border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              }`}
              autoFocus
            />
            <Sparkles className="absolute left-3.5 top-4 w-4 h-4 text-emerald-400" />
            
            <div className="absolute right-2 top-2 flex items-center gap-1.5">
              {/* Mic Dictation Button */}
              <button
                type="button"
                onClick={toggleListening}
                className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs font-semibold ${
                  isListening
                    ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/40 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-emerald-400'
                }`}
                title={isListening ? 'Click to stop listening' : 'Voice Dictation: Speak your transaction'}
              >
                {isListening ? <Mic className="w-3.5 h-3.5 animate-bounce" /> : <Mic className="w-3.5 h-3.5" />}
                {isListening && <span className="text-[10px]">Listening...</span>}
              </button>

              {/* Extract Button */}
              <button
                type="button"
                onClick={() => handleParse()}
                disabled={loading || !query.trim()}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>Extract</span>
              </button>
            </div>
          </div>

          {speechError && (
            <div className="text-[11px] text-amber-400 bg-amber-950/20 border border-amber-500/30 p-2 rounded-lg">
              {speechError}
            </div>
          )}

          {/* Quick Suggestions Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Try an example:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(prompt);
                    handleParse(prompt);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-emerald-500/40 text-slate-300 transition-all text-left truncate max-w-xs"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Parsed Extraction Card */}
          {parsedResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">
                    AI Extraction Successful ({Math.round(parsedResult.confidence * 100)}% confidence)
                  </span>
                </div>
                <span className="text-[11px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {parsedResult.intent.replace('_', ' ')}
                </span>
              </div>

              {/* Editable Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Amount */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-400" /> Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editedFields.amount || ''}
                    onChange={(e) => setEditedFields({ ...editedFields, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 font-mono text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Type</label>
                  <select
                    value={editedFields.type || 'expense'}
                    onChange={(e) => setEditedFields({ ...editedFields, type: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="expense">Expense (-)</option>
                    <option value="income">Income (+)</option>
                  </select>
                </div>

                {/* Merchant / Entity */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium flex items-center gap-1">
                    <Store className="w-3 h-3 text-cyan-400" /> Merchant / Entity
                  </label>
                  <input
                    type="text"
                    value={editedFields.merchant || ''}
                    onChange={(e) => setEditedFields({ ...editedFields, merchant: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium flex items-center gap-1">
                    <Tag className="w-3 h-3 text-purple-400" /> Category
                  </label>
                  <select
                    value={editedFields.category || 'General'}
                    onChange={(e) => setEditedFields({ ...editedFields, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Groceries">Groceries</option>
                    <option value="Dining Out">Dining Out</option>
                    <option value="Housing & Utilities">Housing & Utilities</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Entertainment & Leisure">Entertainment & Leisure</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Work & Development">Work & Development</option>
                    <option value="Salary">Salary</option>
                    <option value="Freelance & Consulting">Freelance & Consulting</option>
                    <option value="Dividends & Yield">Dividends & Yield</option>
                    <option value="General">General</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" /> Date
                  </label>
                  <input
                    type="date"
                    value={editedFields.date || ''}
                    onChange={(e) => setEditedFields({ ...editedFields, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Description</label>
                  <input
                    type="text"
                    value={editedFields.description || ''}
                    onChange={(e) => setEditedFields({ ...editedFields, description: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleConfirm}
                  disabled={confirming}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02]"
                >
                  {confirming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>Log to Finance Platform</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
