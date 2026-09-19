import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  Scissors, 
  Target, 
  Calendar, 
  Sliders, 
  Percent, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  BookmarkPlus,
  Check
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../utils/api';

export default function WhatIfSimulator({ summary, subStats, goals = [], onRefresh, onNotify }) {
  // Scenario 1: Expense Trimming
  const [diningCutPct, setDiningCutPct] = useState(25);
  const [shoppingCutPct, setShoppingCutPct] = useState(20);
  const [cancelLeaks, setCancelLeaks] = useState(true);

  // Scenario 2: Compound Wealth Engine
  const [monthlyInvest, setMonthlyInvest] = useState(summary?.netSavings ? Math.max(100, Math.round(summary.netSavings * 0.5)) : 500);
  const [initialCapital, setInitialCapital] = useState(5000);
  const [annualReturn, setAnnualReturn] = useState(8);
  const [years, setYears] = useState(10);
  const [savingGoal, setSavingGoal] = useState(false);
  const [goalCreated, setGoalCreated] = useState(false);

  const resetDefaults = () => {
    setDiningCutPct(25);
    setShoppingCutPct(20);
    setCancelLeaks(true);
    setMonthlyInvest(summary?.netSavings ? Math.max(100, Math.round(summary.netSavings * 0.5)) : 500);
    setInitialCapital(5000);
    setAnnualReturn(8);
    setYears(10);
    if (onNotify) onNotify({ title: 'Simulator Reset', message: 'Sandbox restored to baseline configuration.', type: 'info' });
  };

  const applyPreset = (preset) => {
    if (preset === 'aggressive') {
      setDiningCutPct(40);
      setShoppingCutPct(35);
      setCancelLeaks(true);
      setMonthlyInvest(1200);
      setInitialCapital(10000);
      setAnnualReturn(9.5);
      setYears(15);
      if (onNotify) onNotify({ title: 'Aggressive Strategy Applied', message: 'Set higher cutbacks and long-term 15-year compound growth.' });
    } else if (preset === 'balanced') {
      setDiningCutPct(25);
      setShoppingCutPct(20);
      setCancelLeaks(true);
      setMonthlyInvest(600);
      setInitialCapital(5000);
      setAnnualReturn(8.0);
      setYears(10);
      if (onNotify) onNotify({ title: 'Balanced Strategy Applied', message: 'Standard 10-year horizon with moderate monthly investing.' });
    } else if (preset === 'conservative') {
      setDiningCutPct(15);
      setShoppingCutPct(10);
      setCancelLeaks(false);
      setMonthlyInvest(300);
      setInitialCapital(2500);
      setAnnualReturn(6.0);
      setYears(5);
      if (onNotify) onNotify({ title: 'Conservative Strategy Applied', message: 'Low risk 5-year outlook with modest adjustments.' });
    }
  };

  // Calculate monthly savings from trims
  const diningSpend = summary?.categoryBreakdown?.find(c => c.name === 'Dining Out')?.value || 303;
  const shoppingSpend = summary?.categoryBreakdown?.find(c => c.name === 'Shopping')?.value || 230;

  const monthlyTrimSavings = useMemo(() => {
    let sum = (diningSpend * (diningCutPct / 100)) + (shoppingSpend * (shoppingCutPct / 100));
    if (cancelLeaks && subStats?.monthlyTotal) {
      sum += (subStats.leakSavingsPotential ? subStats.leakSavingsPotential / 12 : 28);
    }
    return Math.round(sum);
  }, [diningSpend, shoppingSpend, diningCutPct, shoppingCutPct, cancelLeaks, subStats]);

  const annualTrimSavings = monthlyTrimSavings * 12;

  // Calculate Compound Growth Trajectory
  const compoundData = useMemo(() => {
    const points = [];
    const monthlyRate = (annualReturn / 100) / 12;
    let balance = initialCapital;
    let totalInvested = initialCapital;

    // Point at year 0
    points.push({
      year: 'Year 0',
      totalWealth: Math.round(balance),
      principal: Math.round(totalInvested)
    });

    for (let y = 1; y <= years; y++) {
      for (let m = 0; m < 12; m++) {
        balance = (balance + monthlyInvest) * (1 + monthlyRate);
        totalInvested += monthlyInvest;
      }
      points.push({
        year: `Yr ${y}`,
        totalWealth: Math.round(balance),
        principal: Math.round(totalInvested)
      });
    }

    return points;
  }, [initialCapital, monthlyInvest, annualReturn, years]);

  const finalWealth = compoundData[compoundData.length - 1]?.totalWealth || 0;
  const finalPrincipal = compoundData[compoundData.length - 1]?.principal || 0;
  const interestEarned = Math.max(0, finalWealth - finalPrincipal);

  const handleSaveAsGoal = async () => {
    setSavingGoal(true);
    try {
      const targetDate = new Date();
      targetDate.setFullYear(targetDate.getFullYear() + years);
      const res = await api.createGoal({
        title: `${years}-Yr Wealth Target ($${Math.round(finalWealth / 1000)}k)`,
        target_amount: finalWealth,
        current_amount: initialCapital,
        target_date: targetDate.toISOString().split('T')[0],
        category: 'investments',
        color: '#06b6d4',
        icon: 'trending-up'
      });
      if (res.success) {
        setGoalCreated(true);
        if (onNotify) onNotify({
          title: 'Savings Goal Created!',
          message: `Created goal "${years}-Yr Wealth Target" with $${finalWealth.toLocaleString()} destination.`
        });
        if (onRefresh) onRefresh();
        setTimeout(() => setGoalCreated(false), 3000);
      }
    } catch (err) {
      console.error('Save goal error:', err);
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Presets & Reset */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Interactive Financial "What-If" Simulator
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Sandbox
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Model the long-term impact of spending cutbacks, subscription pruning, and compound market growth.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1 text-xs">
            <span className="text-[11px] text-slate-500 font-semibold px-2">Presets:</span>
            <button
              onClick={() => applyPreset('conservative')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 font-medium transition-all"
            >
              Conservative
            </button>
            <button
              onClick={() => applyPreset('balanced')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 font-medium transition-all"
            >
              Balanced
            </button>
            <button
              onClick={() => applyPreset('aggressive')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 font-medium transition-all"
            >
              Aggressive
            </button>
          </div>

          <button
            onClick={resetDefaults}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset Simulator to Defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Part 1: Expense Pruning Sandbox */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
          <Scissors className="w-4 h-4" />
          <span>Expense Cutback & Leak Reclamation Levers</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Lever 1 */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Cut Dining Out:</span>
              <span className="text-emerald-400 font-mono font-bold">{diningCutPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={diningCutPct}
              onChange={(e) => setDiningCutPct(parseInt(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Saves ${Math.round(diningSpend * (diningCutPct / 100))}/mo</span>
              <span>Current: ${Math.round(diningSpend)}</span>
            </div>
          </div>

          {/* Lever 2 */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Cut Shopping & Discretionary:</span>
              <span className="text-emerald-400 font-mono font-bold">{shoppingCutPct}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={shoppingCutPct}
              onChange={(e) => setShoppingCutPct(parseInt(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Saves ${Math.round(shoppingSpend * (shoppingCutPct / 100))}/mo</span>
              <span>Current: ${Math.round(shoppingSpend)}</span>
            </div>
          </div>

          {/* Lever 3 */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div className="text-xs font-semibold text-slate-300">Cancel Flagged Leaks</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-slate-400">Prune redundant streaming</span>
              <button
                onClick={() => setCancelLeaks(!cancelLeaks)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  cancelLeaks ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {cancelLeaks ? 'Active (+$$)' : 'Off'}
              </button>
            </div>
          </div>
        </div>

        {/* Trim Outcomes Banner */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-slate-100">
                Reclaimed Capital: <span className="text-emerald-400 font-mono">+${monthlyTrimSavings}/month</span>
              </div>
              <p className="text-xs text-slate-400">
                Generates <strong className="text-slate-200">${annualTrimSavings.toLocaleString()}</strong> in fresh cash every single year!
              </p>
            </div>
          </div>
          <button
            onClick={() => setMonthlyInvest(prev => prev + monthlyTrimSavings)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shadow-emerald-500/20"
          >
            Apply to Investment Engine ↓
          </button>
        </div>
      </div>

      {/* Part 2: Compound Wealth Growth Sandbox */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Compound Investment Growth Projection</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-slate-300">Total Portfolio Value</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span className="text-slate-400">Your Deposits</span>
            </div>
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="text-slate-400 font-medium">Monthly Contribution</div>
            <div className="text-base font-extrabold text-slate-100 font-mono">${monthlyInvest.toLocaleString()}</div>
            <input
              type="range"
              min="100"
              max="3000"
              step="50"
              value={monthlyInvest}
              onChange={(e) => setMonthlyInvest(parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="text-slate-400 font-medium">Initial Capital</div>
            <div className="text-base font-extrabold text-slate-100 font-mono">${initialCapital.toLocaleString()}</div>
            <input
              type="range"
              min="0"
              max="50000"
              step="1000"
              value={initialCapital}
              onChange={(e) => setInitialCapital(parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="text-slate-400 font-medium">Annual Return Rate</div>
            <div className="text-base font-extrabold text-cyan-400 font-mono">{annualReturn}% APY</div>
            <input
              type="range"
              min="4"
              max="14"
              step="0.5"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <div className="text-slate-400 font-medium">Projection Horizon</div>
            <div className="text-base font-extrabold text-slate-100 font-mono">{years} Years</div>
            <input
              type="range"
              min="3"
              max="25"
              step="1"
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Projection Chart */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={compoundData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="year" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(val) => `$${Math.round(val / 1000)}k`} />
              <Tooltip
                formatter={(val) => `$${val.toLocaleString()}`}
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="totalWealth" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#wealthGrad)" />
              <Area type="monotone" dataKey="principal" stroke="#64748b" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Compound KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-center text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Total Projected Wealth:</span>
            <div className="text-xl font-extrabold text-cyan-400 font-mono mt-1">
              ${finalWealth.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-slate-400">Your Total Deposits:</span>
            <div className="text-xl font-extrabold text-slate-200 font-mono mt-1">
              ${finalPrincipal.toLocaleString()}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-emerald-500/30 bg-emerald-950/10">
            <span className="text-emerald-300">Pure Compound Interest:</span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
              +${interestEarned.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Action Button: Save Goal */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSaveAsGoal}
            disabled={savingGoal}
            className={`px-4 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all shadow-md ${
              goalCreated
                ? 'bg-emerald-600 text-white'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20'
            }`}
          >
            {goalCreated ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
            <span>{goalCreated ? 'Goal Created in Planner!' : savingGoal ? 'Saving Goal...' : `Save as ${years}-Yr Savings Goal ($${Math.round(finalWealth / 1000)}k)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
