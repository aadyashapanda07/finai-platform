import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  Minus,
  Trash2, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  ShieldCheck, 
  Plane, 
  Car, 
  Laptop, 
  Sparkles,
  X,
  Pencil,
  ArrowDownLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';

const ICON_MAP = {
  'shield-check': ShieldCheck,
  'plane': Plane,
  'car': Car,
  'laptop': Laptop,
  'target': Target
};

export default function GoalsGrid({ goals = [], onRefresh, onNotify }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [contributeGoal, setContributeGoal] = useState(null);
  const [withdrawGoal, setWithdrawGoal] = useState(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'active' | 'completed'

  // Form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [icon, setIcon] = useState('target');
  const [color, setColor] = useState('emerald');
  const [saving, setSaving] = useState(false);

  const openAddModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setIcon('target');
    setColor('emerald');
    setShowAddModal(true);
  };

  const openEditModal = (g) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmount(g.target_amount);
    setCurrentAmount(g.current_amount);
    setTargetDate(g.target_date || '');
    setIcon(g.icon || 'target');
    setColor(g.color || 'emerald');
    setShowAddModal(true);
  };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount) return;
    setSaving(true);
    try {
      if (editingGoal) {
        await api.updateGoal(editingGoal.id, {
          name,
          target_amount: parseFloat(targetAmount),
          current_amount: parseFloat(currentAmount || 0),
          target_date: targetDate,
          icon,
          color
        });
        if (onNotify) onNotify({ title: 'Goal Updated', message: `Saved changes to ${name}.` });
      } else {
        await api.createGoal({
          name,
          target_amount: parseFloat(targetAmount),
          current_amount: parseFloat(currentAmount || 0),
          target_date: targetDate,
          icon,
          color
        });
        if (onNotify) onNotify({ title: 'Goal Created', message: `Now tracking target: ${name}.` });
      }
      setShowAddModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Create goal error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    if (!contributeGoal || !contributionAmount) return;
    setSaving(true);
    try {
      const res = await api.contributeToGoal(contributeGoal.id, parseFloat(contributionAmount));
      if (res.completed) {
        confetti({
          particleCount: 140,
          spread: 85,
          origin: { y: 0.6 }
        });
        if (onNotify) onNotify({ title: 'Milestone Completed! 🎉', message: `You reached 100% of ${contributeGoal.name}!` });
      } else {
        if (onNotify) onNotify({ title: 'Deposit Logged', message: `Added $${parseFloat(contributionAmount).toFixed(2)} to ${contributeGoal.name}.` });
      }
      setContributeGoal(null);
      setContributionAmount('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Contribution error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawGoal || !withdrawalAmount) return;
    setSaving(true);
    try {
      await api.withdrawFromGoal(withdrawGoal.id, parseFloat(withdrawalAmount));
      if (onNotify) onNotify({ title: 'Withdrawal Completed', message: `Transferred $${parseFloat(withdrawalAmount).toFixed(2)} from ${withdrawGoal.name}.`, type: 'info' });
      setWithdrawGoal(null);
      setWithdrawalAmount('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Withdrawal error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, goalName) => {
    if (!confirm(`Delete "${goalName}"?`)) return;
    try {
      await api.deleteGoal(id);
      if (onRefresh) onRefresh();
      if (onNotify) onNotify({ title: 'Goal Removed', type: 'info' });
    } catch (err) {
      console.error('Delete goal error:', err);
    }
  };

  const filteredGoals = goals.filter(g => {
    const isCompleted = g.status === 'completed' || g.progress >= 100;
    if (filterTab === 'completed') return isCompleted;
    if (filterTab === 'active') return !isCompleted;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-slate-100">Savings & Milestones Tracker</h3>
          <p className="text-xs text-slate-400">Target funds, safety nets, and long-term asset accumulation</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterTab === 'all' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({goals.length})
            </button>
            <button
              onClick={() => setFilterTab('active')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterTab === 'active' ? 'bg-teal-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterTab === 'completed' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Completed
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredGoals.map((g) => {
          const IconComponent = ICON_MAP[g.icon] || Target;
          const isCompleted = g.status === 'completed' || g.progress >= 100;

          return (
            <div
              key={g.id}
              className={`glass-panel rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                isCompleted
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-teal-400'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    {isCompleted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Done
                      </span>
                    )}
                    {/* Edit Button */}
                    <button
                      onClick={() => openEditModal(g)}
                      className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition-colors"
                      title="Edit Goal"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(g.id, g.name)}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="font-bold text-sm text-slate-100 line-clamp-1">{g.name}</h4>

                <div className="mt-3 space-y-1 font-mono text-xs">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xl font-extrabold text-slate-100">
                      ${g.current_amount.toLocaleString()}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      / ${g.target_amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${
                        isCompleted ? 'bg-emerald-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{ width: `${Math.min(100, g.progress)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] pt-1">
                    <span className="text-emerald-400 font-bold">{g.progress}%</span>
                    <span className="text-slate-400">
                      {isCompleted ? 'Target Achieved!' : `$${g.remainingAmount?.toLocaleString()} to go`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  {g.daysRemaining !== null && !isCompleted && (
                    <>
                      <Calendar className="w-3 h-3" />
                      <span>{g.daysRemaining} days left</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5">
                  {/* Withdraw Button */}
                  {g.current_amount > 0 && (
                    <button
                      onClick={() => setWithdrawGoal(g)}
                      className="px-2 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1 transition-all"
                      title="Withdraw funds"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  )}
                  {/* Deposit Button */}
                  {!isCompleted && (
                    <button
                      onClick={() => setContributeGoal(g)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1 transition-all shadow-sm"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Deposit</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit Modal */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-sm text-slate-100">Deposit toward {contributeGoal.name}</h4>
              <button onClick={() => setContributeGoal(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleContribute} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Deposit Amount ($)</label>
                <input
                  type="number"
                  step="10"
                  placeholder="e.g. 250"
                  value={contributionAmount}
                  onChange={(e) => setContributionAmount(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
                >
                  {saving ? 'Processing...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {withdrawGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-sm text-slate-100">Withdraw from {withdrawGoal.name}</h4>
              <button onClick={() => setWithdrawGoal(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleWithdraw} className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Withdrawal Amount ($)</span>
                  <span className="font-mono">Max: ${withdrawGoal.current_amount}</span>
                </div>
                <input
                  type="number"
                  step="10"
                  max={withdrawGoal.current_amount}
                  placeholder="e.g. 100"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawGoal(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow"
                >
                  {saving ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100">
                {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Target'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g. Down Payment, Europe Trip, Emergency Fund..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Target Amount ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Current Saved ($)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1000"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Icon Style</label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="target">Bullseye Target</option>
                    <option value="shield-check">Safety Shield</option>
                    <option value="plane">Travel Airplane</option>
                    <option value="car">Vehicle / Car</option>
                    <option value="laptop">Tech Equipment</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
                >
                  {saving ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
