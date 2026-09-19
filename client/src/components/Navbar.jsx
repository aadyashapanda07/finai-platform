import React from 'react';
import { 
  Sparkles, 
  Receipt, 
  PlusCircle, 
  LayoutDashboard, 
  ReceiptText, 
  PieChart, 
  RefreshCw, 
  Target, 
  Bot, 
  Settings,
  AlertTriangle,
  Landmark,
  Sliders,
  FileSpreadsheet,
  HelpCircle
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  openNlModal, 
  openReceiptModal, 
  openAdvisor,
  openSettings,
  openExportModal,
  openShortcutsModal,
  leakCount = 0
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { 
      id: 'subscriptions', 
      label: 'Subscriptions', 
      icon: RefreshCw, 
      badge: leakCount > 0 ? `${leakCount} leak${leakCount > 1 ? 's' : ''}` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
    },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'networth', label: 'Net Worth', icon: Landmark },
    { id: 'simulator', label: 'Simulator', icon: Sliders },
    { id: 'advisor', label: 'AI Advisor', icon: Bot, isAi: true }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-emerald-300">
                  FinAI
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">AI-Powered Wealth & Health</p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.isAi ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full border ${item.badgeColor} font-mono ml-0.5`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Natural Language Omnibar Quick Add */}
            <button
              onClick={openNlModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Add via natural language (Ctrl+K)"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-100" />
              <span className="hidden sm:inline">AI Quick Add</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-emerald-700/40 rounded border border-emerald-400/30 text-emerald-200">
                ⌘K
              </kbd>
            </button>

            {/* Receipt Scanner Button */}
            <button
              onClick={openReceiptModal}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/70 hover:border-emerald-500/40 hover:bg-slate-850 text-slate-200 text-xs font-medium transition-all"
              title="Scan a paper or digital receipt"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Scan Receipt</span>
            </button>

            {/* Export & Import Button */}
            <button
              onClick={openExportModal}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
              title="Export CSV / JSON Data"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Settings button */}
            <button
              onClick={openSettings}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-all"
              title="Settings & AI Keys"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 overflow-x-auto gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap ${
                  isActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
