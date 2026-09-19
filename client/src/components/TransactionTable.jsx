import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Trash2, 
  Pencil,
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus,
  Receipt,
  Calendar,
  X,
  FileSpreadsheet,
  Check,
  Tag
} from 'lucide-react';
import { api } from '../utils/api';

export default function TransactionTable({ 
  transactions = [], 
  onRefresh, 
  onOpenManualModal, 
  onOpenNlModal,
  onNotify
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [deletingId, setDeletingId] = useState(null);

  // Edit Transaction State
  const [editingTx, setEditingTx] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState('expense');
  const [editCategory, setEditCategory] = useState('Groceries');
  const [editMerchant, setEditMerchant] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Receipt preview modal state
  const [viewReceiptTx, setViewReceiptTx] = useState(null);

  const categories = Array.from(new Set(transactions.map(t => t.category))).filter(Boolean);

  const isFiltered = searchTerm !== '' || filterType !== 'all' || filterCategory !== 'all';

  const filtered = transactions.filter(tx => {
    const matchSearch = !searchTerm || 
      tx.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.tags?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchType = filterType === 'all' || tx.type === filterType;
    const matchCat = filterCategory === 'all' || tx.category === filterCategory;

    return matchSearch && matchType && matchCat;
  });

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterCategory('all');
  };

  const handleExportFiltered = () => {
    if (filtered.length === 0) return;
    const headers = ['Date', 'Type', 'Category', 'Merchant', 'Description', 'Amount', 'PaymentMethod'];
    const rows = filtered.map(t => [
      `"${t.date || ''}"`,
      `"${t.type || 'expense'}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.amount,
      `"${t.payment_method || 'Card'}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finai_filtered_transactions_${Date.now()}.csv`;
    link.click();
    if (onNotify) onNotify({ title: 'Exported', message: `Downloaded ${filtered.length} filtered transactions.` });
  };

  const openEditModal = (tx) => {
    setEditingTx(tx);
    setEditAmount(tx.amount);
    setEditType(tx.type);
    setEditCategory(tx.category);
    setEditMerchant(tx.merchant || '');
    setEditDescription(tx.description || '');
    setEditDate(tx.date || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTx) return;
    setSavingEdit(true);
    try {
      await api.updateTransaction(editingTx.id, {
        amount: parseFloat(editAmount),
        type: editType,
        category: editCategory,
        merchant: editMerchant,
        description: editDescription,
        date: editDate
      });
      setEditingTx(null);
      if (onRefresh) onRefresh();
      if (onNotify) onNotify({ title: 'Transaction Updated', message: `Updated ${editMerchant} record.` });
    } catch (err) {
      console.error('Update transaction error:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id, merchant) => {
    if (!confirm(`Are you sure you want to delete the transaction for "${merchant || 'this item'}"?`)) return;
    setDeletingId(id);
    try {
      await api.deleteTransaction(id);
      if (onRefresh) onRefresh();
      if (onNotify) onNotify({ title: 'Transaction Deleted', type: 'info' });
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-4 p-5">
      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-slate-100">Transaction History</h3>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {filtered.length} {filtered.length === 1 ? 'record' : 'records'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Manage, filter, and inspect financial ledger activity</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 md:w-52">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search merchant, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Types</option>
            <option value="expense">Expenses Only</option>
            <option value="income">Income Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Clear Filters Button */}
          {isFiltered && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          {/* Export Filtered CSV Button */}
          <button
            onClick={handleExportFiltered}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/40 text-slate-400 hover:text-emerald-400 transition-all"
            title="Download this view as CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>

          {/* Add Transaction Button */}
          <button
            onClick={onOpenManualModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Manual</span>
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3">Date</th>
              <th className="py-3 px-3">Merchant / Payee</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 px-3">Payment Method</th>
              <th className="py-3 px-3 text-right">Amount</th>
              <th className="py-3 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400">
                  <div className="space-y-2">
                    <p>No transactions match your active search filters.</p>
                    {isFiltered && (
                      <button
                        onClick={handleClearFilters}
                        className="text-xs text-emerald-400 underline font-semibold"
                      >
                        Clear active filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((tx) => {
                const isIncome = tx.type === 'income';
                const hasReceipt = tx.tags?.includes('receipt') || tx.tags?.includes('ocr');

                return (
                  <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                      {tx.date}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                        <span>{tx.merchant || 'Unknown'}</span>
                        {hasReceipt && (
                          <button
                            onClick={() => setViewReceiptTx(tx)}
                            className="text-emerald-400 hover:text-emerald-300 transition-colors"
                            title="View receipt breakdown"
                          >
                            <Receipt className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">
                        {tx.description}
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {tx.payment_method || 'Card'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-sm whitespace-nowrap">
                      <span className={isIncome ? 'text-emerald-400' : 'text-slate-200'}>
                        {isIncome ? '+' : '-'}${parseFloat(tx.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* Edit Button */}
                        <button
                          onClick={() => openEditModal(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                          title="Edit Transaction"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(tx.id, tx.merchant)}
                          disabled={deletingId === tx.id}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-400" />
                <span>Edit Transaction</span>
              </h3>
              <button onClick={() => setEditingTx(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
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
                  value={editMerchant}
                  onChange={(e) => setEditMerchant(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
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
                  <label className="text-slate-300 font-medium block mb-1">Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Description / Memo</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Details Modal */}
      {viewReceiptTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-100">
                <Receipt className="w-4 h-4 text-emerald-400" />
                <span>Receipt Item Details</span>
              </div>
              <button onClick={() => setViewReceiptTx(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <div className="font-bold text-sm text-slate-200">{viewReceiptTx.merchant}</div>
              <div className="text-[11px] text-slate-400">{viewReceiptTx.date} • {viewReceiptTx.category}</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 leading-relaxed text-slate-300">
              {viewReceiptTx.description}
            </div>
            <div className="flex justify-between items-baseline pt-1 font-mono">
              <span className="text-slate-400">Total Billed:</span>
              <span className="text-base font-extrabold text-emerald-400">${parseFloat(viewReceiptTx.amount).toFixed(2)}</span>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setViewReceiptTx(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
