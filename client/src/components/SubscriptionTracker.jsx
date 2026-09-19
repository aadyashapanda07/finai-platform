import React, { useState } from 'react';
import { 
  RefreshCw, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  PauseCircle, 
  PlayCircle, 
  CheckCircle2, 
  X,
  Sparkles,
  DollarSign,
  Calendar,
  Pencil,
  Ban,
  ShieldCheck,
  Check
} from 'lucide-react';
import { api } from '../utils/api';

export default function SubscriptionTracker({ 
  subscriptions = [], 
  stats = {}, 
  onRefresh,
  onNotify
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState('monthly');
  const [category, setCategory] = useState('Entertainment & Leisure');
  const [billingDate, setBillingDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const openAddModal = () => {
    setEditingSub(null);
    setName('');
    setAmount('');
    setCycle('monthly');
    setCategory('Entertainment & Leisure');
    setBillingDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (sub) => {
    setEditingSub(sub);
    setName(sub.name);
    setAmount(sub.amount);
    setCycle(sub.billing_cycle || 'monthly');
    setCategory(sub.category || 'Entertainment & Leisure');
    setBillingDate(sub.next_billing_date || '');
    setNotes(sub.notes || '');
    setShowModal(true);
  };

  const handleStatusToggle = async (id, currentStatus, serviceName) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      await api.updateSubscriptionStatus(id, nextStatus);
      if (onRefresh) onRefresh();
      if (onNotify) onNotify({ 
        title: `Subscription ${nextStatus === 'paused' ? 'Paused' : 'Resumed'}`, 
        message: `${serviceName} marked as ${nextStatus}.` 
      });
    } catch (err) {
      console.error('Status update error:', err);
    }
  };

  const handleCancelService = async (id, serviceName) => {
    if (!confirm(`Cancel and terminate tracking for "${serviceName}"?`)) return;
    try {
      await api.updateSubscriptionStatus(id, 'cancelled');
      if (onRefresh) onRefresh();
      if (onNotify) onNotify({ title: 'Service Cancelled', message: `${serviceName} marked as cancelled.` });
    } catch (err) {
      console.error('Cancel subscription error:', err);
    }
  };

  const handleDismissLeak = async (id, serviceName) => {
    try {
      await api.dismissSubscriptionLeak(id);
      if (onRefresh) onRefresh();
      if (onNotify) onNotify({ title: 'Leak Cleared', message: `Marked ${serviceName} as verified.` });
    } catch (err) {
      console.error('Dismiss leak error:', err);
    }
  };

  const handleDelete = async (id, serviceName) => {
    if (!confirm(`Remove "${serviceName}" permanently?`)) return;
    try {
      await api.deleteSubscription(id);
      if (onRefresh) onRefresh();
      if (onNotify) onNotify({ title: 'Subscription Removed', type: 'info' });
    } catch (err) {
      console.error('Delete subscription error:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !amount) return;
    setSaving(true);
    try {
      if (editingSub) {
        await api.updateSubscription(editingSub.id, {
          name,
          amount: parseFloat(amount),
          billing_cycle: cycle,
          category,
          next_billing_date: billingDate,
          notes
        });
        if (onNotify) onNotify({ title: 'Subscription Updated', message: `Saved changes to ${name}.` });
      } else {
        await api.createSubscription({
          name,
          amount: parseFloat(amount),
          billing_cycle: cycle,
          category,
          next_billing_date: billingDate || new Date().toISOString().split('T')[0],
          notes
        });
        if (onNotify) onNotify({ title: 'Subscription Added', message: `Now tracking ${name}.` });
      }
      setShowModal(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Save subscription error:', err);
    } finally {
      setSaving(false);
    }
  };

  const leaks = subscriptions.filter(s => s.is_leak === 1 && s.status === 'active');

  const filteredSubs = subscriptions.filter(s => {
    if (filterStatus === 'all') return true;
    return s.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Monthly Recurring</span>
          <div className="text-2xl font-extrabold text-slate-100 font-mono mt-1">
            ${stats.monthlyTotal?.toFixed(2) || '0.00'}
          </div>
          <span className="text-[11px] text-slate-500">Across {stats.activeCount || 0} services</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Annual Run-Rate</span>
          <div className="text-2xl font-extrabold text-slate-100 font-mono mt-1">
            ${stats.annualTotal?.toFixed(2) || '0.00'}
          </div>
          <span className="text-[11px] text-slate-500">Projected 12mo spend</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-rose-500/30 bg-rose-950/10">
          <span className="text-xs text-rose-300 font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Detected Leaks
          </span>
          <div className="text-2xl font-extrabold text-rose-400 font-mono mt-1">
            {stats.leakCount || 0}
          </div>
          <span className="text-[11px] text-rose-300/80">Require user attention</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/10">
          <span className="text-xs text-emerald-300 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            Potential Savings
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            ${stats.leakSavingsPotential?.toFixed(2) || '0.00'}
          </div>
          <span className="text-[11px] text-emerald-300/80">Annually if resolved</span>
        </div>
      </div>

      {/* Subscription Leak Alert Banner */}
      {leaks.length > 0 && (
        <div className="p-4 rounded-2xl border border-rose-500/40 bg-rose-950/20 backdrop-blur space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h4 className="font-bold text-sm text-rose-200">
                Subscription Leak Detection: {leaks.length} Unoptimized Service{leaks.length > 1 ? 's' : ''}
              </h4>
            </div>
            <span className="text-xs text-slate-400">Take action to stop unwanted charges</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {leaks.map(leak => (
              <div key={leak.id} className="p-3 rounded-xl bg-slate-900/80 border border-rose-500/20 flex flex-col justify-between text-xs">
                <div>
                  <div className="flex items-center justify-between font-bold text-slate-100">
                    <span>{leak.name}</span>
                    <span className="font-mono text-rose-400">${leak.amount.toFixed(2)}/mo</span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-1">
                    {leak.leak_reason || 'Identified as potentially redundant or underutilized.'}
                  </p>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    onClick={() => handleDismissLeak(leak.id, leak.name)}
                    className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-[11px] transition-all flex items-center gap-1"
                    title="Keep this subscription and dismiss the warning"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Keep Service</span>
                  </button>
                  <button
                    onClick={() => handleStatusToggle(leak.id, leak.status, leak.name)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] transition-all"
                  >
                    Pause Subscription
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscriptions Ledger */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-base text-slate-100">All Recurring Subscriptions</h3>
            <p className="text-xs text-slate-400">Manage memberships, SaaS, and ongoing streaming services</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter buttons */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterStatus === 'all' ? 'bg-emerald-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({subscriptions.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterStatus === 'active' ? 'bg-teal-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('paused')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterStatus === 'paused' ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Paused
              </button>
            </div>

            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subscription</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Service Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Billing Cycle</th>
                <th className="py-3 px-3">Next Renewal</th>
                <th className="py-3 px-3 text-right">Cost</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSubs.map((sub) => {
                const isActive = sub.status === 'active';
                const isCancelled = sub.status === 'cancelled';

                return (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-200 flex items-center gap-2">
                        {sub.name}
                        {sub.is_leak === 1 && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                            Leak
                          </span>
                        )}
                      </div>
                      {sub.notes && <div className="text-[11px] text-slate-400">{sub.notes}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
                        {sub.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 uppercase text-[10px] font-mono text-slate-400">
                      {sub.billing_cycle}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-400">
                      {sub.next_billing_date || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-100">
                      ${parseFloat(sub.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : isCancelled
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(sub)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          title="Edit Subscription"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {/* Pause / Resume Button */}
                        <button
                          onClick={() => handleStatusToggle(sub.id, sub.status, sub.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title={isActive ? 'Pause Subscription' : 'Resume Subscription'}
                        >
                          {isActive ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />}
                        </button>
                        {/* Cancel Service Button */}
                        {!isCancelled && (
                          <button
                            onClick={() => handleCancelService(sub.id, sub.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                            title="Cancel Service"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(sub.id, sub.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete from list"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Subscription Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100">
                {editingSub ? 'Edit Subscription' : 'Add Recurring Subscription'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Netflix, Spotify, Gym..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 15.99"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Billing Cycle</label>
                  <select
                    value={cycle}
                    onChange={(e) => setCycle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Entertainment & Leisure">Entertainment & Leisure</option>
                  <option value="Work & Development">Work & Development</option>
                  <option value="Health & Wellness">Health & Wellness</option>
                  <option value="Housing & Utilities">Housing & Utilities</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Next Billing Date</label>
                <input
                  type="date"
                  value={billingDate}
                  onChange={(e) => setBillingDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Shared with family, promotional rate..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
                >
                  {saving ? 'Saving...' : editingSub ? 'Update Subscription' : 'Add Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
