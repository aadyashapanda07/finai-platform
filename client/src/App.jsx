import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  Percent, 
  Loader2,
  TrendingUp,
  AlertCircle,
  Calendar,
  Download,
  Sliders,
  Landmark,
  Database
} from 'lucide-react';

import Navbar from './components/Navbar';
import HealthScoreCard from './components/HealthScoreCard';
import InsightsFeed from './components/InsightsFeed';
import CashFlowChart from './components/CashFlowChart';
import CategoryDonut from './components/CategoryDonut';
import TransactionTable from './components/TransactionTable';
import BudgetCards from './components/BudgetCards';
import SubscriptionTracker from './components/SubscriptionTracker';
import GoalsGrid from './components/GoalsGrid';
import AIAdvisorChat from './components/AIAdvisorChat';
import NetWorthView from './components/NetWorthView';
import WhatIfSimulator from './components/WhatIfSimulator';
import NaturalLanguageModal from './components/NaturalLanguageModal';
import ReceiptScannerModal from './components/ReceiptScannerModal';
import ManualTransactionModal from './components/ManualTransactionModal';
import ExportImportModal from './components/ExportImportModal';
import ShortcutsModal from './components/ShortcutsModal';
import SettingsModal from './components/SettingsModal';
import Toast from './components/Toast';

import { api } from './utils/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // Core Data
  const [health, setHealth] = useState(null);
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [subStats, setSubStats] = useState({});
  const [goals, setGoals] = useState([]);
  const [insights, setInsights] = useState([]);

  // Modals & Popups
  const [showNlModal, setShowNlModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('finai_gemini_api_key') || '');
  const [dateRange, setDateRange] = useState('all');

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ title, message, type = 'success' }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Filtered transactions based on date range
  const filteredTransactions = React.useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    if (dateRange === 'all') return transactions;

    const now = new Date();
    return transactions.filter(t => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return true;
      if (dateRange === 'this_month') {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      }
      if (dateRange === 'last_30') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return d >= thirtyDaysAgo;
      }
      if (dateRange === 'this_year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, dateRange]);

  // Dynamically compute summary when dateRange is not 'all'
  const activeSummary = React.useMemo(() => {
    if (dateRange === 'all' || !summary) return summary;
    let inc = 0;
    let exp = 0;
    const catMap = {};
    for (const t of filteredTransactions) {
      const amt = parseFloat(t.amount) || 0;
      if (t.type === 'income') {
        inc += amt;
      } else {
        exp += amt;
        catMap[t.category] = (catMap[t.category] || 0) + amt;
      }
    }
    const catBreakdown = Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value) }));
    const net = inc - exp;
    const sRate = inc > 0 ? Math.max(0, Math.round((net / inc) * 100)) : 0;
    return {
      ...summary,
      totalIncome: inc,
      totalExpense: exp,
      netSavings: net,
      savingsRate: sRate,
      categoryBreakdown: catBreakdown.length > 0 ? catBreakdown : summary.categoryBreakdown
    };
  }, [summary, filteredTransactions, dateRange]);

  const [serverError, setServerError] = useState(false);

  // Load all data
  const loadAllData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        api.getFinancialHealth(),
        api.getTransactionSummary(),
        api.getTransactions(),
        api.getBudgets(),
        api.getSubscriptions(),
        api.getGoals(),
        api.getInsights()
      ]);

      const [
        healthRes,
        summaryRes,
        txRes,
        budgetRes,
        subRes,
        goalsRes,
        insightsRes
      ] = results.map(r => r.status === 'fulfilled' ? r.value : { success: false });

      if (healthRes?.success) setHealth(healthRes.data);
      if (summaryRes?.success) setSummary(summaryRes.data);
      if (txRes?.success) setTransactions(txRes.data || []);
      if (budgetRes?.success) setBudgets(budgetRes.data || []);
      if (subRes?.success) {
        setSubscriptions(subRes.data || []);
        setSubStats(subRes.stats || {});
      }
      if (goalsRes?.success) setGoals(goalsRes.data || []);
      if (insightsRes?.success) setInsights(insightsRes.data || []);

      const anySuccess = results.some(r => r.status === 'fulfilled' && r.value?.success);
      setServerError(!anySuccess);
    } catch (err) {
      console.error('Error loading finance platform data:', err);
      setServerError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLoadDemoData = async () => {
    try {
      const res = await api.reseedData();
      if (res.success) {
        addToast({ title: 'Sample Data Loaded', message: 'Restored 22 transactions and complete ledger analytics!' });
        loadAllData();
      }
    } catch (err) {
      console.error('Reseed error:', err);
      addToast({ title: 'Failed to load demo data', message: 'Please ensure backend server is running.', type: 'info' });
    }
  };

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowNlModal(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setShowReceiptModal(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setShowManualModal(prev => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShowExportModal(prev => !prev);
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleActionSuccess = (res) => {
    loadAllData();
    if (res?.type === 'transaction' || res?.amount) {
      addToast({
        title: 'Transaction Logged',
        message: `Saved ${res.data?.merchant || 'record'} for $${parseFloat(res.data?.amount || res.amount || 0).toFixed(2)}.`
      });
    } else if (res?.type === 'budget') {
      addToast({
        title: 'Budget Set',
        message: `Updated limit for ${res.data?.category}.`
      });
    } else {
      addToast({
        title: 'Action Completed',
        message: 'Your ledger and financial health scores have updated.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openNlModal={() => setShowNlModal(true)}
        openReceiptModal={() => setShowReceiptModal(true)}
        openAdvisor={() => setCurrentTab('advisor')}
        openSettings={() => setShowSettingsModal(true)}
        openExportModal={() => setShowExportModal(true)}
        openShortcutsModal={() => setShowShortcutsModal(true)}
        leakCount={subStats.leakCount || 0}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">
              Synchronizing financial ledger, AI insights, and predictive models...
            </p>
          </div>
        ) : (
          <>
            {/* Date Range Selector & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div>
                <h1 className="text-xl font-black text-slate-100 tracking-tight">
                  Financial Ledger & Analytics
                </h1>
                <p className="text-xs text-slate-400">Real-time ledger tracking, AI categorization, and predictive models</p>
              </div>

              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1 text-xs self-start sm:self-auto">
                <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1" />
                <button
                  onClick={() => setDateRange('this_month')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    dateRange === 'this_month' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setDateRange('last_30')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    dateRange === 'last_30' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Last 30 Days
                </button>
                <button
                  onClick={() => setDateRange('this_year')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    dateRange === 'this_year' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  This Year
                </button>
                <button
                  onClick={() => setDateRange('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    dateRange === 'all' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Time
                </button>
                <div className="h-4 w-px bg-slate-800 mx-1" />
                <button
                  onClick={handleLoadDemoData}
                  className="px-2.5 py-1 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-semibold transition-all flex items-center gap-1"
                  title="Reload or restore sample data"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Restore Demo</span>
                </button>
              </div>
            </div>

            {/* Offline or Server Warning Banner */}
            {serverError && (
              <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-in fade-in">
                <div className="flex items-center gap-2.5 text-amber-300">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span>
                    Backend server not responding on port 5000. Ensure <code>npm run dev</code> or <code>Run-FinAI.bat</code> is running.
                  </span>
                </div>
                <button
                  onClick={loadAllData}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-medium self-end sm:self-auto"
                >
                  Retry Connection
                </button>
              </div>
            )}

            {/* Empty Ledger Notice Banner */}
            {transactions.length === 0 && !loading && !serverError && (
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">Your Ledger is Currently Empty ($0.00)</h4>
                    <p className="text-xs text-slate-400">
                      Click below to load sample mock transactions, budgets, subscriptions, and goals to visualize your analytics!
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLoadDemoData}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 flex-shrink-0"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Load Sample Demo Data</span>
                </button>
              </div>
            )}

            {/* Top Stat Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Inflow ({dateRange.replace('_', ' ')})</span>
                  <div className="text-xl font-extrabold text-slate-100 font-mono mt-0.5">
                    ${activeSummary?.totalIncome?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>Income & Deposits</span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Outflow ({dateRange.replace('_', ' ')})</span>
                  <div className="text-xl font-extrabold text-slate-100 font-mono mt-0.5">
                    ${activeSummary?.totalExpense?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <span className="text-[11px] text-rose-400 flex items-center gap-1 mt-0.5">
                    <ArrowDownLeft className="w-3 h-3" />
                    <span>Expenses & Bills</span>
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Net Surplus</span>
                  <div className={`text-xl font-extrabold font-mono mt-0.5 ${
                    (activeSummary?.netSavings || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    ${activeSummary?.netSavings?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-0.5">Retained liquidity</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Savings Rate</span>
                  <div className="text-xl font-extrabold text-slate-100 font-mono mt-0.5">
                    {activeSummary?.savingsRate || 0}%
                  </div>
                  <span className="text-[11px] text-emerald-400 mt-0.5">
                    {(activeSummary?.savingsRate || 0) >= 20 ? 'Optimal (Target: 20%+)' : 'Below 20% Target'}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Tab Views */}
            {currentTab === 'dashboard' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Financial Health Gauge & Pillars */}
                <HealthScoreCard health={health} />

                {/* AI Insights & Alerts Feed */}
                <InsightsFeed
                  insights={insights}
                  onRefresh={loadAllData}
                  onNavigate={(tab) => setCurrentTab(tab)}
                  onNotify={addToast}
                />

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CashFlowChart trends={summary?.monthlyTrends} />
                  <CategoryDonut breakdown={activeSummary?.categoryBreakdown} />
                </div>

                {/* Recent Transactions Snippet */}
                <TransactionTable
                  transactions={filteredTransactions.slice(0, 8)}
                  onRefresh={loadAllData}
                  onOpenManualModal={() => setShowManualModal(true)}
                  onOpenNlModal={() => setShowNlModal(true)}
                />
              </div>
            )}

            {currentTab === 'transactions' && (
              <div className="animate-in fade-in duration-300">
                <TransactionTable
                  transactions={filteredTransactions}
                  onRefresh={loadAllData}
                  onOpenManualModal={() => setShowManualModal(true)}
                  onOpenNlModal={() => setShowNlModal(true)}
                />
              </div>
            )}

            {currentTab === 'budgets' && (
              <div className="animate-in fade-in duration-300">
                <BudgetCards
                  budgets={budgets}
                  onRefresh={loadAllData}
                  onNotify={addToast}
                />
              </div>
            )}

            {currentTab === 'subscriptions' && (
              <div className="animate-in fade-in duration-300">
                <SubscriptionTracker
                  subscriptions={subscriptions}
                  stats={subStats}
                  onRefresh={loadAllData}
                  onNotify={addToast}
                />
              </div>
            )}

            {currentTab === 'goals' && (
              <div className="animate-in fade-in duration-300">
                <GoalsGrid
                  goals={goals}
                  onRefresh={loadAllData}
                  onNotify={addToast}
                />
              </div>
            )}

            {currentTab === 'networth' && (
              <div className="animate-in fade-in duration-300">
                <NetWorthView onNotify={addToast} />
              </div>
            )}

            {currentTab === 'simulator' && (
              <div className="animate-in fade-in duration-300">
                <WhatIfSimulator
                  summary={activeSummary}
                  subStats={subStats}
                  goals={goals}
                  onRefresh={loadAllData}
                  onNotify={addToast}
                />
              </div>
            )}

            {currentTab === 'advisor' && (
              <div className="animate-in fade-in duration-300">
                <AIAdvisorChat
                  apiKey={apiKey}
                  health={health}
                />
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">FinAI Platform</span>
            <span>•</span>
            <span>AI-Powered Personal Finance & Wealth Intelligence</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 underline"
            >
              Shortcuts (Press ?)
            </button>
            <span>•</span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Ctrl+K</kbd> Omnibar
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NaturalLanguageModal
        isOpen={showNlModal}
        onClose={() => setShowNlModal(false)}
        onSuccess={handleActionSuccess}
        apiKey={apiKey}
      />

      <ReceiptScannerModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        onSuccess={handleActionSuccess}
        apiKey={apiKey}
      />

      <ManualTransactionModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSuccess={handleActionSuccess}
      />

      <ExportImportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onSuccess={loadAllData}
        onNotify={addToast}
      />

      <ShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        onSuccess={loadAllData}
        onNotify={addToast}
      />
    </div>
  );
}
