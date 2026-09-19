const API_BASE = '/api';

export const api = {
  // Transactions
  getTransactions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/transactions?${query}`);
    return res.json();
  },

  getTransactionSummary: async () => {
    const res = await fetch(`${API_BASE}/transactions/summary`);
    return res.json();
  },

  createTransaction: async (data) => {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

    deleteTransaction: async (id) => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  updateTransaction: async (id, data) => {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Budgets
  getBudgets: async () => {
    const res = await fetch(`${API_BASE}/budgets`);
    return res.json();
  },

  createBudget: async (data) => {
    const res = await fetch(`${API_BASE}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateBudget: async (id, data) => {
    const res = await fetch(`${API_BASE}/budgets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  adjustBudget: async (id, delta) => {
    const res = await fetch(`${API_BASE}/budgets/${id}/adjust`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta })
    });
    return res.json();
  },

  deleteBudget: async (id) => {
    const res = await fetch(`${API_BASE}/budgets/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Subscriptions
  getSubscriptions: async () => {
    const res = await fetch(`${API_BASE}/subscriptions`);
    return res.json();
  },

  createSubscription: async (data) => {
    const res = await fetch(`${API_BASE}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateSubscription: async (id, data) => {
    const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateSubscriptionStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/subscriptions/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  dismissSubscriptionLeak: async (id) => {
    const res = await fetch(`${API_BASE}/subscriptions/${id}/dismiss-leak`, {
      method: 'PATCH'
    });
    return res.json();
  },

  deleteSubscription: async (id) => {
    const res = await fetch(`${API_BASE}/subscriptions/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Goals
  getGoals: async () => {
    const res = await fetch(`${API_BASE}/goals`);
    return res.json();
  },

  createGoal: async (data) => {
    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateGoal: async (id, data) => {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  contributeToGoal: async (id, amount) => {
    const res = await fetch(`${API_BASE}/goals/${id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    return res.json();
  },

  withdrawFromGoal: async (id, amount) => {
    const res = await fetch(`${API_BASE}/goals/${id}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    return res.json();
  },

  deleteGoal: async (id) => {
    const res = await fetch(`${API_BASE}/goals/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Health Score & Projections
  getFinancialHealth: async () => {
    const res = await fetch(`${API_BASE}/insights/health`);
    return res.json();
  },

  // Insights
  getInsights: async () => {
    const res = await fetch(`${API_BASE}/insights`);
    return res.json();
  },

  generateInsights: async () => {
    const res = await fetch(`${API_BASE}/insights/generate`, {
      method: 'POST'
    });
    return res.json();
  },

  dismissInsight: async (id) => {
    const res = await fetch(`${API_BASE}/insights/${id}/dismiss`, {
      method: 'PATCH'
    });
    return res.json();
  },

  dismissAllInsights: async () => {
    const res = await fetch(`${API_BASE}/insights/dismiss-all`, {
      method: 'PATCH'
    });
    return res.json();
  },

  // AI Omnibar & NLP
  parseNaturalLanguage: async (query, apiKey = null) => {
    const res = await fetch(`${API_BASE}/ai/parse-nl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, apiKey })
    });
    return res.json();
  },

  confirmNaturalLanguage: async (payload) => {
    const res = await fetch(`${API_BASE}/ai/confirm-nl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // Receipt Scanner
  getSampleReceipts: async () => {
    const res = await fetch(`${API_BASE}/ai/sample-receipts`);
    return res.json();
  },

  scanReceipt: async (formData) => {
    const res = await fetch(`${API_BASE}/ai/scan-receipt`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },

  // AI Financial Advisor Chat
  chatWithAdvisor: async (message, apiKey = null) => {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, apiKey })
    });
    return res.json();
  },

  // Net Worth & Assets / Liabilities
  getNetWorth: async () => {
    const res = await fetch(`${API_BASE}/networth`);
    return res.json();
  },

  createAsset: async (data) => {
    const res = await fetch(`${API_BASE}/networth/asset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateAsset: async (id, data) => {
    const res = await fetch(`${API_BASE}/networth/asset/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteAsset: async (id) => {
    const res = await fetch(`${API_BASE}/networth/asset/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  createLiability: async (data) => {
    const res = await fetch(`${API_BASE}/networth/liability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateLiability: async (id, data) => {
    const res = await fetch(`${API_BASE}/networth/liability/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteLiability: async (id) => {
    const res = await fetch(`${API_BASE}/networth/liability/${id}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Export & Import
  importData: async (items) => {
    const res = await fetch(`${API_BASE}/export/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    return res.json();
  },

  // Settings: Reseed & Clear
  reseedData: async () => {
    const res = await fetch(`${API_BASE}/settings/reseed`, {
      method: 'POST'
    });
    return res.json();
  },

  clearAllData: async () => {
    const res = await fetch(`${API_BASE}/settings/clear`, {
      method: 'POST'
    });
    return res.json();
  }
};
