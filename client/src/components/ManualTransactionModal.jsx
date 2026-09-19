import React, { useState } from 'react';
import { X, Plus, DollarSign, Calendar, Tag, Store } from 'lucide-react';
import { api } from '../utils/api';

export default function ManualTransactionModal({ isOpen, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Groceries');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;
    setSaving(true);
    try {
      const res = await api.createTransaction({
        amount: parseFloat(amount),
        type,
        category,
        merchant: merchant || (type === 'income' ? 'Income Source' : 'Merchant'),
        description,
        date,
        payment_method: paymentMethod
      });
      if (res.success) {
        onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      console.error('Create transaction error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="font-bold text-base text-slate-100">Add Transaction Manually</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Amount ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-slate-300 font-medium block mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="expense">Expense (-)</option>
                <option value="income">Income (+)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Merchant / Payee</label>
            <input
              type="text"
              placeholder="e.g. Whole Foods, Employer, Apple..."
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
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
            <div>
              <label className="text-slate-300 font-medium block mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Apple Pay">Apple Pay</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-medium block mb-1">Notes / Description</label>
            <input
              type="text"
              placeholder="e.g. Weekly essentials, client invoice..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
            >
              {saving ? 'Logging...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
