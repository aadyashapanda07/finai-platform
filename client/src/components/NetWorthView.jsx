import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  CreditCard, 
  Plus, 
  Trash2, 
  DollarSign, 
  PieChart as PieIcon, 
  ShieldCheck, 
  X,
  Wallet,
  Landmark,
  Coins,
  Pencil
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../utils/api';

const ASSET_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6'];

export default function NetWorthView({ onNotify }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals & Editing
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showLiabilityModal, setShowLiabilityModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editingLiability, setEditingLiability] = useState(null);

  // New Asset form
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('cash');
  const [assetValue, setAssetValue] = useState('');
  const [assetInst, setAssetInst] = useState('');
  const [assetNotes, setAssetNotes] = useState('');

  // New Liability form
  const [liabName, setLiabName] = useState('');
  const [liabType, setLiabType] = useState('credit_card');
  const [liabAmount, setLiabAmount] = useState('');
  const [liabRate, setLiabRate] = useState('');
  const [liabInst, setLiabInst] = useState('');

  const loadData = async () => {
    try {
      const res = await api.getNetWorth();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Error fetching net worth:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAsset = async (e) => {
    e.preventDefault();
    if (!assetName || !assetValue) return;
    try {
      await api.createAsset({
        name: assetName,
        type: assetType,
        value: parseFloat(assetValue),
        institution: assetInst,
        notes: assetNotes
      });
      setShowAssetModal(false);
      setAssetName('');
      setAssetValue('');
      setAssetInst('');
      setAssetNotes('');
      loadData();
      if (onNotify) onNotify({ title: 'Asset Added', message: `Added ${assetName} to your portfolio.` });
    } catch (err) {
      console.error('Create asset error:', err);
    }
  };

  const handleUpdateAsset = async (e) => {
    e.preventDefault();
    if (!editingAsset || !editingAsset.name || !editingAsset.value) return;
    try {
      await api.updateAsset(editingAsset.id, {
        name: editingAsset.name,
        type: editingAsset.type,
        value: parseFloat(editingAsset.value),
        institution: editingAsset.institution,
        notes: editingAsset.notes
      });
      setEditingAsset(null);
      loadData();
      if (onNotify) onNotify({ title: 'Asset Updated', message: `Updated valuation for ${editingAsset.name}.` });
    } catch (err) {
      console.error('Update asset error:', err);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!confirm('Remove this asset?')) return;
    try {
      await api.deleteAsset(id);
      loadData();
      if (onNotify) onNotify({ title: 'Asset Removed', type: 'info' });
    } catch (err) {
      console.error('Delete asset error:', err);
    }
  };

  const handleCreateLiability = async (e) => {
    e.preventDefault();
    if (!liabName || !liabAmount) return;
    try {
      await api.createLiability({
        name: liabName,
        type: liabType,
        amount: parseFloat(liabAmount),
        interest_rate: parseFloat(liabRate || 0),
        institution: liabInst
      });
      setShowLiabilityModal(false);
      setLiabName('');
      setLiabAmount('');
      setLiabRate('');
      setLiabInst('');
      loadData();
      if (onNotify) onNotify({ title: 'Liability Recorded', message: `Added ${liabName} to debt tracker.` });
    } catch (err) {
      console.error('Create liability error:', err);
    }
  };

  const handleUpdateLiability = async (e) => {
    e.preventDefault();
    if (!editingLiability || !editingLiability.name || !editingLiability.amount) return;
    try {
      await api.updateLiability(editingLiability.id, {
        name: editingLiability.name,
        type: editingLiability.type,
        amount: parseFloat(editingLiability.amount),
        interest_rate: parseFloat(editingLiability.interest_rate || 0),
        institution: editingLiability.institution
      });
      setEditingLiability(null);
      loadData();
      if (onNotify) onNotify({ title: 'Liability Updated', message: `Updated terms for ${editingLiability.name}.` });
    } catch (err) {
      console.error('Update liability error:', err);
    }
  };

  const handleDeleteLiability = async (id) => {
    if (!confirm('Remove this debt item?')) return;
    try {
      await api.deleteLiability(id);
      loadData();
      if (onNotify) onNotify({ title: 'Liability Removed', type: 'info' });
    } catch (err) {
      console.error('Delete liability error:', err);
    }
  };

  if (loading || !data) {
    return <div className="text-center py-20 text-slate-400 text-xs">Loading Net Worth Ledger...</div>;
  }

  const { totalAssets, totalLiabilities, netWorth, debtToAssetRatio, assets, liabilities, assetAllocation } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
          <span className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Total Net Worth</span>
          <div className="text-3xl font-extrabold text-slate-100 font-mono mt-1">
            ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-2">Assets minus total outstanding liabilities</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Assets</span>
          <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-1">
            ${totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-2">{assets.length} active holdings across banking, crypto & equity</p>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Liabilities</span>
          <div className="text-3xl font-extrabold text-rose-400 font-mono mt-1">
            ${totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-400 mt-2">Debt-to-Asset Ratio: <strong className="text-slate-200">{debtToAssetRatio}%</strong> (Healthy &lt; 35%)</p>
        </div>
      </div>

      {/* Asset Allocation Chart */}
      {assetAllocation && assetAllocation.length > 0 && (
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-100">Asset Portfolio Allocation</h3>
              <p className="text-xs text-slate-400">Distribution across liquidity, equities, and retirement reserves</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="h-52 w-52 relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    formatter={(val) => `$${val.toLocaleString()}`}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Pie
                    data={assetAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {assetAllocation.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={ASSET_COLORS[index % ASSET_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-medium">Assets</span>
                <span className="text-sm font-extrabold text-slate-100 font-mono">
                  ${Math.round(totalAssets / 1000)}k
                </span>
              </div>
            </div>

            <div className="w-full flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {assetAllocation.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: ASSET_COLORS[idx % ASSET_COLORS.length] }}
                  />
                  <div className="truncate">
                    <div className="font-semibold text-slate-200">{item.type}</div>
                    <div className="text-[11px] text-slate-400 font-mono font-bold">
                      ${item.value.toLocaleString()} ({item.percentage}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assets & Liabilities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets Section */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-slate-100">Assets & Holdings ({assets.length})</h3>
            </div>
            <button
              onClick={() => setShowAssetModal(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Asset</span>
            </button>
          </div>

          <div className="space-y-2">
            {assets.map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="font-bold text-xs text-slate-100 flex items-center gap-2">
                    {a.name}
                    <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono bg-slate-800 text-slate-400 border border-slate-700">
                      {a.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{a.institution || a.notes || 'Asset'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-emerald-400 text-sm mr-1">
                    ${parseFloat(a.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={() => setEditingAsset({ ...a })}
                    className="p-1 text-slate-500 hover:text-emerald-400 rounded transition-colors"
                    title="Edit Asset"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAsset(a.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    title="Remove Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities Section */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-sm text-slate-100">Liabilities & Debts ({liabilities.length})</h3>
            </div>
            <button
              onClick={() => setShowLiabilityModal(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 shadow transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Debt</span>
            </button>
          </div>

          <div className="space-y-2">
            {liabilities.map((l) => (
              <div key={l.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
                <div>
                  <div className="font-bold text-xs text-slate-100 flex items-center gap-2">
                    {l.name}
                    <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20">
                      {l.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {l.interest_rate > 0 ? `${l.interest_rate}% APR • ` : ''}{l.institution || 'Liability'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-rose-400 text-sm mr-1">
                    ${parseFloat(l.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={() => setEditingLiability({ ...l })}
                    className="p-1 text-slate-500 hover:text-amber-400 rounded transition-colors"
                    title="Edit Debt"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteLiability(l.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                    title="Remove Debt"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100">Add Asset to Net Worth</h3>
              <button onClick={() => setShowAssetModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAsset} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Asset Name</label>
                <input
                  type="text"
                  placeholder="e.g. Marcus High Yield Savings, Vanguard ETF..."
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Asset Category</label>
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="cash">Cash & Checking</option>
                    <option value="investment">Stock / Brokerage</option>
                    <option value="retirement">Retirement (401k/IRA)</option>
                    <option value="crypto">Crypto / Digital</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="other">Other Asset</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Value ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="10000"
                    value={assetValue}
                    onChange={(e) => setAssetValue(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Institution / Holding</label>
                <input
                  type="text"
                  placeholder="e.g. Fidelity, Coinbase, Chase..."
                  value={assetInst}
                  onChange={(e) => setAssetInst(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Liability Modal */}
      {showLiabilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100">Add Liability / Debt</h3>
              <button onClick={() => setShowLiabilityModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLiability} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Debt Name</label>
                <input
                  type="text"
                  placeholder="e.g. Credit Card, Student Loan, Auto Loan..."
                  value={liabName}
                  onChange={(e) => setLiabName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Debt Type</label>
                  <select
                    value={liabType}
                    onChange={(e) => setLiabType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="auto_loan">Auto Loan</option>
                    <option value="student_loan">Student Loan</option>
                    <option value="mortgage">Mortgage</option>
                    <option value="other">Other Debt</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Outstanding Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2500"
                    value={liabAmount}
                    onChange={(e) => setLiabAmount(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Interest Rate (% APR)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 19.99"
                    value={liabRate}
                    onChange={(e) => setLiabRate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Lender / Institution</label>
                  <input
                    type="text"
                    placeholder="e.g. Chase, Discover..."
                    value={liabInst}
                    onChange={(e) => setLiabInst(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLiabilityModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow"
                >
                  Save Debt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-400" />
                <span>Edit Asset</span>
              </h3>
              <button onClick={() => setEditingAsset(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateAsset} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Asset Name</label>
                <input
                  type="text"
                  value={editingAsset.name}
                  onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Asset Category</label>
                  <select
                    value={editingAsset.type}
                    onChange={(e) => setEditingAsset({ ...editingAsset, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="cash">Cash & Checking</option>
                    <option value="investment">Stock / Brokerage</option>
                    <option value="retirement">Retirement (401k/IRA)</option>
                    <option value="crypto">Crypto / Digital</option>
                    <option value="real_estate">Real Estate</option>
                    <option value="other">Other Asset</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Valuation ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingAsset.value}
                    onChange={(e) => setEditingAsset({ ...editingAsset, value: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Institution / Holding</label>
                <input
                  type="text"
                  value={editingAsset.institution || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, institution: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Notes</label>
                <input
                  type="text"
                  value={editingAsset.notes || ''}
                  onChange={(e) => setEditingAsset({ ...editingAsset, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow"
                >
                  Update Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Liability Modal */}
      {editingLiability && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-rose-400" />
                <span>Edit Liability / Debt</span>
              </h3>
              <button onClick={() => setEditingLiability(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateLiability} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Debt Name</label>
                <input
                  type="text"
                  value={editingLiability.name}
                  onChange={(e) => setEditingLiability({ ...editingLiability, name: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Debt Type</label>
                  <select
                    value={editingLiability.type}
                    onChange={(e) => setEditingLiability({ ...editingLiability, type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="auto_loan">Auto Loan</option>
                    <option value="student_loan">Student Loan</option>
                    <option value="mortgage">Mortgage</option>
                    <option value="other">Other Debt</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingLiability.amount}
                    onChange={(e) => setEditingLiability({ ...editingLiability, amount: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Interest Rate (% APR)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingLiability.interest_rate ?? ''}
                    onChange={(e) => setEditingLiability({ ...editingLiability, interest_rate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Lender / Institution</label>
                  <input
                    type="text"
                    value={editingLiability.institution || ''}
                    onChange={(e) => setEditingLiability({ ...editingLiability, institution: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLiability(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow"
                >
                  Update Debt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
