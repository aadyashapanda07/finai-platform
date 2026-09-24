const path = require('path');
const fs = require('fs');

let sqlite3 = null;
let db = null;
let useMemoryStore = false;

try {
  sqlite3 = require('sqlite3').verbose();
  const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const dbPath = isVercel
    ? path.join('/tmp', 'finance.db')
    : path.resolve(__dirname, '../../data/finance.db');
  const dataDir = path.dirname(dbPath);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.warn('SQLite file open error, falling back to memory store:', err.message);
      useMemoryStore = true;
    } else {
      console.log('Connected to SQLite database at', dbPath);
    }
  });
} catch (err) {
  console.warn('Native sqlite3 unavailable (e.g. Vercel/serverless GLIBC). Falling back to resilient in-memory database.');
  useMemoryStore = true;
}

// In-Memory Database Store for environments where native sqlite3 cannot run (e.g. Vercel Lambda)
const memoryStore = {
  transactions: [],
  budgets: [],
  subscriptions: [],
  savings_goals: [],
  insights: [],
  settings: [],
  assets: [],
  liabilities: []
};

function normalizeSql(sql) {
  return sql.replace(/\s+/g, ' ').trim();
}

function executeMemoryRun(sql, params = []) {
  const norm = normalizeSql(sql);

  // CREATE TABLE
  if (/^CREATE TABLE/i.test(norm)) {
    const match = norm.match(/CREATE TABLE (?:IF NOT EXISTS )?([a-zA-Z0-9_]+)/i);
    if (match && !memoryStore[match[1]]) {
      memoryStore[match[1]] = [];
    }
    return { changes: 0 };
  }

  // DELETE FROM
  if (/^DELETE FROM/i.test(norm)) {
    const match = norm.match(/^DELETE FROM ([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+))?/i);
    if (match) {
      const tbl = match[1];
      const whereClause = match[2];
      if (!memoryStore[tbl]) return { changes: 0 };
      if (!whereClause) {
        const count = memoryStore[tbl].length;
        memoryStore[tbl] = [];
        return { changes: count };
      }
      if (/id\s*=\s*\?/i.test(whereClause)) {
        const id = params[0];
        const prevLen = memoryStore[tbl].length;
        memoryStore[tbl] = memoryStore[tbl].filter(r => r.id !== id);
        return { changes: prevLen - memoryStore[tbl].length };
      }
      if (/created_at\s*<\s*\?/i.test(whereClause)) {
        const cutoff = params[0];
        const prevLen = memoryStore[tbl].length;
        memoryStore[tbl] = memoryStore[tbl].filter(r => r.created_at >= cutoff);
        return { changes: prevLen - memoryStore[tbl].length };
      }
    }
    return { changes: 0 };
  }

  // INSERT INTO
  if (/^INSERT INTO/i.test(norm)) {
    const match = norm.match(/^INSERT INTO ([a-zA-Z0-9_]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
    if (match) {
      const tbl = match[1];
      const cols = match[2].split(',').map(c => c.trim());
      const row = {};
      cols.forEach((col, idx) => {
        row[col] = params[idx];
      });
      if (!row.created_at) row.created_at = new Date().toISOString();
      if (!memoryStore[tbl]) memoryStore[tbl] = [];
      memoryStore[tbl].push(row);
      return { id: row.id, changes: 1 };
    }
  }

  // UPDATE
  if (/^UPDATE/i.test(norm)) {
    const match = norm.match(/^UPDATE ([a-zA-Z0-9_]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
    if (match) {
      const tbl = match[1];
      const setClause = match[2];
      const whereClause = match[3];
      if (!memoryStore[tbl]) return { changes: 0 };

      let targetRows = memoryStore[tbl];
      if (whereClause) {
        if (/id\s*=\s*\?/i.test(whereClause)) {
          const id = params[params.length - 1];
          targetRows = memoryStore[tbl].filter(r => r.id === id);
        } else if (/dismissed\s*=\s*0/i.test(whereClause)) {
          targetRows = memoryStore[tbl].filter(r => !r.dismissed || r.dismissed === 0);
        }
      }

      let changes = 0;
      targetRows.forEach(row => {
        if (/current_amount\s*=\s*current_amount\s*\+\s*\?/i.test(setClause)) {
          const amt = parseFloat(params[0]) || 0;
          row.current_amount = (parseFloat(row.current_amount) || 0) + amt;
        } else if (/current_amount\s*=\s*MAX\(0,\s*current_amount\s*-\s*\?\)/i.test(setClause)) {
          const amt = parseFloat(params[0]) || 0;
          row.current_amount = Math.max(0, (parseFloat(row.current_amount) || 0) - amt);
        } else if (/COALESCE/i.test(setClause)) {
          const [amount, type, category, merchant, description, date, payment_method, tags] = params;
          if (amount !== null && amount !== undefined) row.amount = parseFloat(amount);
          if (type) row.type = type;
          if (category) row.category = category;
          if (merchant) row.merchant = merchant;
          if (description !== null && description !== undefined) row.description = description;
          if (date) row.date = date;
          if (payment_method) row.payment_method = payment_method;
          if (tags !== null && tags !== undefined) row.tags = tags;
        } else {
          const parts = setClause.split(',').map(s => s.trim());
          parts.forEach((p, idx) => {
            const key = p.split('=')[0].trim();
            if (params[idx] !== undefined) {
              row[key] = params[idx];
            } else if (/=\s*1\b/i.test(p)) {
              row[key] = 1;
            } else if (/=\s*0\b/i.test(p)) {
              row[key] = 0;
            } else if (/=\s*NULL\b/i.test(p)) {
              row[key] = null;
            }
          });
        }
        changes++;
      });
      return { changes };
    }
  }

  return { changes: 0 };
}

function executeMemorySelect(sql, params = []) {
  const norm = normalizeSql(sql);

  // COUNT(*)
  if (/SELECT COUNT\(\*\) as count FROM ([a-zA-Z0-9_]+)/i.test(norm)) {
    const tbl = norm.match(/FROM ([a-zA-Z0-9_]+)/i)[1];
    return [{ count: (memoryStore[tbl] || []).length }];
  }

  // GROUP BY spending per category
  if (/SUM\(amount\) as spent/i.test(norm)) {
    const datePrefix = params[0] ? params[0].replace('%', '') : '';
    const txs = memoryStore.transactions || [];
    const catMap = {};
    txs.forEach(t => {
      if (t.type === 'expense' && (!datePrefix || (t.date && t.date.startsWith(datePrefix)))) {
        catMap[t.category] = (catMap[t.category] || 0) + (parseFloat(t.amount) || 0);
      }
    });
    return Object.entries(catMap).map(([category, spent]) => ({ category, spent }));
  }

  const fromMatch = norm.match(/FROM ([a-zA-Z0-9_]+)/i);
  if (!fromMatch) return [];
  const tbl = fromMatch[1];
  let rows = [...(memoryStore[tbl] || [])];

  // WHERE
  const whereMatch = norm.match(/WHERE (.+?)(?:ORDER BY|LIMIT|$)/i);
  if (whereMatch) {
    const whereStr = whereMatch[1].trim();
    let pIdx = 0;

    if (/id\s*=\s*\?/i.test(whereStr)) {
      const idVal = params[pIdx++];
      rows = rows.filter(r => r.id === idVal);
    }
    if (/category\s*=\s*\?/i.test(whereStr)) {
      const catVal = params[pIdx++];
      rows = rows.filter(r => r.category === catVal);
    }
    if (/type\s*=\s*\?/i.test(whereStr)) {
      const typeVal = params[pIdx++];
      rows = rows.filter(r => r.type === typeVal);
    }
    if (/status\s*=\s*"active"/i.test(whereStr)) {
      rows = rows.filter(r => r.status === 'active');
    }
    if (/status\s*!=\s*"cancelled"/i.test(whereStr)) {
      rows = rows.filter(r => r.status !== 'cancelled');
    }
    if (/dismissed\s*=\s*0/i.test(whereStr)) {
      rows = rows.filter(r => !r.dismissed || r.dismissed === 0);
    }
    if (/title\s*=\s*\?/i.test(whereStr)) {
      const titleVal = params[pIdx++];
      rows = rows.filter(r => r.title === titleVal);
    }
    if (/merchant LIKE/i.test(whereStr)) {
      const search = (params[pIdx++] || '').replace(/%/g, '').toLowerCase();
      pIdx += 2;
      rows = rows.filter(r =>
        (r.merchant && r.merchant.toLowerCase().includes(search)) ||
        (r.description && r.description.toLowerCase().includes(search)) ||
        (r.tags && r.tags.toLowerCase().includes(search))
      );
    }
  }

  // ORDER BY
  if (/ORDER BY date DESC/i.test(norm)) {
    rows.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  } else if (/ORDER BY monthly_limit DESC/i.test(norm)) {
    rows.sort((a, b) => (parseFloat(b.monthly_limit) || 0) - (parseFloat(a.monthly_limit) || 0));
  } else if (/ORDER BY value DESC/i.test(norm)) {
    rows.sort((a, b) => (parseFloat(b.value) || 0) - (parseFloat(a.value) || 0));
  } else if (/ORDER BY amount DESC/i.test(norm)) {
    rows.sort((a, b) => (parseFloat(b.amount) || 0) - (parseFloat(a.amount) || 0));
  } else if (/ORDER BY is_leak DESC/i.test(norm)) {
    rows.sort((a, b) => (b.is_leak ? 1 : 0) - (a.is_leak ? 1 : 0));
  } else if (/ORDER BY status ASC/i.test(norm)) {
    rows.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
  } else if (/ORDER BY created_at DESC/i.test(norm)) {
    rows.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }

  // LIMIT
  const limitMatch = norm.match(/LIMIT\s+(\?|\d+)/i);
  if (limitMatch) {
    const limitVal = limitMatch[1] === '?' ? params[params.length - 1] : parseInt(limitMatch[1], 10);
    if (limitVal) rows = rows.slice(0, limitVal);
  }

  return rows;
}

// Helper for promise-based queries
const run = (sql, params = []) => {
  if (useMemoryStore || !db) {
    return Promise.resolve(executeMemoryRun(sql, params));
  }
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  if (useMemoryStore || !db) {
    const rows = executeMemorySelect(sql, params);
    return Promise.resolve(rows[0] || null);
  }
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  if (useMemoryStore || !db) {
    return Promise.resolve(executeMemorySelect(sql, params));
  }
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

const initSchema = async () => {
  await run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      merchant TEXT,
      description TEXT,
      date TEXT NOT NULL,
      receipt_url TEXT,
      payment_method TEXT DEFAULT 'Card',
      is_recurring INTEGER DEFAULT 0,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category TEXT UNIQUE NOT NULL,
      monthly_limit REAL NOT NULL,
      alert_threshold REAL DEFAULT 80.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      billing_cycle TEXT DEFAULT 'monthly',
      category TEXT NOT NULL,
      next_billing_date TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'flagged', 'cancelled')),
      is_leak INTEGER DEFAULT 0,
      leak_reason TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0.0,
      target_date TEXT,
      category TEXT DEFAULT 'General',
      icon TEXT DEFAULT 'target',
      color TEXT DEFAULT 'emerald',
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'paused')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      severity TEXT DEFAULT 'info' CHECK(severity IN ('info', 'warning', 'success', 'critical')),
      action_label TEXT,
      action_payload TEXT,
      dismissed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('cash', 'investment', 'retirement', 'crypto', 'real_estate', 'other')),
      value REAL NOT NULL,
      institution TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS liabilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('credit_card', 'student_loan', 'auto_loan', 'mortgage', 'other')),
      amount REAL NOT NULL,
      interest_rate REAL DEFAULT 0.0,
      min_payment REAL DEFAULT 0.0,
      institution TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Database tables verified/initialized.');
};

module.exports = {
  db,
  run,
  get,
  all,
  initSchema
};
