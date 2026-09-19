import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Loader2, 
  TrendingUp, 
  ShieldAlert, 
  Target,
  RefreshCw,
  Copy,
  Check,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { api } from '../utils/api';

const STARTER_PROMPTS = [
  "How can I safely save an extra $300 this month?",
  "Analyze my subscription expenses and suggest cuts",
  "How healthy is my current savings rate and emergency fund?",
  "What is my projected cash flow for the next 90 days?"
];

export default function AIAdvisorChat({ apiKey, health }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello! I'm your **FinAI Financial Intelligence Coach**. I'm actively analyzing your cash flow, budgets, subscription commitments, and savings goals.\n\nYour current Financial Health Score is **${health?.score || 82}/100 (${health?.tier || 'Healthy'})** with a savings rate of **${health?.metrics?.savingsRate || 28}%**.\n\nHow can I help optimize your finances today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Hello! I'm your **FinAI Financial Intelligence Coach**. I'm actively analyzing your cash flow, budgets, subscription commitments, and savings goals.\n\nYour current Financial Health Score is **${health?.score || 82}/100 (${health?.tier || 'Healthy'})** with a savings rate of **${health?.metrics?.savingsRate || 28}%**.\n\nHow can I help optimize your finances today?`
      }
    ]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (userText) => {
    const text = userText || input;
    if (!text.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.chatWithAdvisor(text, apiKey);
      if (res.success) {
        setMessages([
          ...newMessages,
          { role: 'assistant', content: res.reply, source: res.source }
        ]);
      }
    } catch (err) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Sorry, I encountered an error analyzing your data. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 flex flex-col h-[650px] overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100">FinAI Wealth & Health Advisor</h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400">
              Personalized, actionable insights powered by intelligent ledger analytics
            </p>
          </div>
        </div>
        <button
          onClick={handleClearChat}
          className="text-xs px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 flex items-center gap-1.5 transition-all shadow-sm"
          title="Reset Conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear Chat</span>
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-xl rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isUser
                    ? 'bg-emerald-600 text-white rounded-br-xs font-medium'
                    : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-bl-xs'
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>
                {!isUser && (
                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/50">
                    <div className="text-[10px] text-slate-400 font-mono">
                      {m.source ? `Engine: ${m.source}` : 'AI Intelligence'}
                    </div>
                    <button
                      onClick={() => handleCopy(m.content, idx)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors p-0.5 rounded"
                      title="Copy response"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400 font-mono">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="text-[10px] font-mono">Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-xs px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
              <span>FinAI is reviewing your financial data & crafting advice...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts */}
      <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[10px] text-slate-500 uppercase font-semibold flex-shrink-0">
          Suggested:
        </span>
        {STARTER_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 whitespace-nowrap transition-all"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask FinAI anything about your cash flow, budgets, or investments..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-all shadow-md shadow-emerald-600/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
