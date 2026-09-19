import React, { useState } from 'react';
import { 
  PieChart, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Trash2,
  Pencil,
  PlusCircle,
  MinusCircle,
  Filter
} from 'lucide-react';
import { api } from '../utils/api';

export default function BudgetCards({ budgets = [], onRefresh, onNotify }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'warning' | 'ontrack'

  // Add/Edit state
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [threshold, setThreshold] = useState('80');
  const [saving, setSaving] = useState(false);

  const openAddModal = () => {
    setEditingBudget(null);
    setCategory('');
    setLimit('');
    setThreshold('80');
    setShowAddModal(true);
  };

  const openEditModal = (b) => {
    setEditingBudget(b);
    setCategory(b.category);
    setLimit(b.monthly_limit);
    setThreshold(b.alert_threshold || '80');
    setShowAddModal(true);
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!category || !limit) return;
    setSaving(true);
    try {
      if (editingBudget) {
        await api.updateBudget(editingBudget.id, {
          category,
          monthly_limit: parseFloat(limit),
          alert_threshold: parseFloat(threshold)
        });
        if (onNotify) onNotify({ title: 'Budget Updated', message: `Updated limit for ${category}.` });
      } else {
        await api.createBudget({
          category,
          monthly_limit: parseFloat(limit),
          alert_threshold: parseFloat(threshold)
        });
        if (onNotify) onNotify({ title: 'Budget Created', message: `Added ${category} budget.` });
      }
      setShowAddModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Save budget error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAdjust = async (id, categoryName, delta) => {
    try {
      await api.adjustBudget(id, delta);
      if (onRefresh) onRefresh();
      if (onNotify) onNotify({ title: 'Limit Adjusted', message: `${categoryName} budget ${delta > 0 ? 'increased' : 'reduced'} by $${Math.abs(delta)}.` });
    } catch (err) {
      console.error('Adjust budget error:', err);
    }
  };

  const handleDeleteBudget = async (id, catName) => {
    if (!confirm(`Remove the budget for "${catName}"?`)) return;
    try {
      await api.deleteBudget(id);
      if (onRefresh) onRefresh();
      if (onNotify) onNotify({ title: 'Budget Removed', type: 'info' });
    } catch (err) {
      console.error('Delete budget error:', err);
    }
  };

  const filteredBudgets = budgets.filter(b => {
    if (filterStatus === 'warning') return b.isOver || b.isWarning;
    if (filterStatus === 'ontrack') return !b.isOver && !b.isWarning;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-slate-100">Monthly Category Budgets</h3>
          <p className="text-xs text-slate-400">Track and constrain spending with proactive alerts</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Filter Buttons */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'all' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({budgets.length})
            </button>
            <button
              onClick={() => setFilterStatus('warning')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'warning' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Warning / Over
            </button>
            <button
              onClick={() => setFilterStatus('ontrack')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'ontrack' ? 'bg-teal-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              On Track
            </button>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Budget</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBudgets.map((b) => {
          const isOver = b.isOver;
          const isWarning = b.isWarning && !isOver;

          return (
            <div
              key={b.id}
              className={`glass-panel rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                isOver
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : isWarning
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm text-slate-100">{b.category}</div>
                  <div className="flex items-center gap-1">
                    {/* Edit Button */}
                    <button
                      onClick={() => openEditModal(b)}
                      className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                      title="Edit Limit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteBudget(b.id, b.category)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete Budget"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between text-xs mb-2 font-mono">
                  <div className="text-slate-400">
                    Spent: <span className="font-bold text-slate-200">${b.spent.toFixed(2)}</span>
                  </div>
                  <div className="text-slate-400">
                    Cap: <span className="font-bold text-slate-200">${b.monthly_limit.toFixed(2)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-3">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${
                      isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, b.percentUsed)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className={`font-semibold ${
                    isOver ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {b.percentUsed}% used
                  </span>
                  <span className="text-slate-400 font-mono">
                    {isOver
                      ? `Over by $${(b.spent - b.monthly_limit).toFixed(2)}`
                      : `$${b.remaining.toFixed(2)} remaining`}
                  </span>
                </div>
              </div>

              {/* Quick Adjust Buttons Footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Quick Tune Cap:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAdjust(b.id, b.category, -50)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono hover:text-white transition-colors"
                    title="Decrease cap by $50"
                  >
                    -$50
                  </button>
                  <button
                    onClick={() => handleAdjust(b.id, b.category, 50)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 font-mono font-bold hover:text-emerald-300 transition-colors"
                    title="Increase cap by $50"
                  >
                    +$50
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Budget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100">
                {editingBudget ? 'Edit Budget Limit' : 'Set Category Budget'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Groceries, Entertainment..."
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Monthly Limit ($)</label>
                <input
                  type="number"
                  step="1"
                  placeholder="e.g. 500"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Alert Threshold (%)</label>
                <input
                  type="number"
                  step="5"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Get an alert when spending reaches this percentage.</p>
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
                  {saving ? 'Saving...' : editingBudget ? 'Update Budget' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
