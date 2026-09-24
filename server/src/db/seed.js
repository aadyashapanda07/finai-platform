const { v4: uuidv4 } = require('../utils/uuid');
const { run, all, initSchema } = require('./database');

const seedData = async () => {
  await initSchema();

  const existingTx = await all('SELECT COUNT(*) as count FROM transactions');
  const existingAssets = await all('SELECT COUNT(*) as count FROM assets');

  if (existingAssets[0].count === 0) {
    console.log('Seeding assets and liabilities...');
    const assets = [
      { id: uuidv4(), name: 'Checking Account', type: 'cash', value: 4250.00, institution: 'Chase Premier', notes: 'Daily operating liquidity' },
      { id: uuidv4(), name: 'High-Yield Savings (4.75% APY)', type: 'cash', value: 11450.00, institution: 'Marcus by Goldman', notes: 'Emergency fund cushion' },
      { id: uuidv4(), name: 'Vanguard Total Stock ETF (VTI)', type: 'investment', value: 24800.00, institution: 'Vanguard Brokerage', notes: 'Long-term equity compounding' },
      { id: uuidv4(), name: 'Employer 401(k) Retirement Plan', type: 'retirement', value: 48900.00, institution: 'Fidelity Investments', notes: 'Tax-deferred retirement pool' },
      { id: uuidv4(), name: 'Ethereum & Bitcoin Core Holdings', type: 'crypto', value: 7200.00, institution: 'Cold Storage Vault', notes: 'Digital asset reserve' }
    ];

    for (const a of assets) {
      await run(
        `INSERT INTO assets (id, name, type, value, institution, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [a.id, a.name, a.type, a.value, a.institution, a.notes]
      );
    }

    const liabilities = [
      { id: uuidv4(), name: 'Chase Sapphire Preferred', type: 'credit_card', amount: 840.50, interest_rate: 21.49, min_payment: 35.00, institution: 'Chase Card Services' },
      { id: uuidv4(), name: 'Low-APR Auto Loan', type: 'auto_loan', amount: 5800.00, interest_rate: 3.49, min_payment: 285.00, institution: 'Credit Union Federal' }
    ];

    for (const l of liabilities) {
      await run(
        `INSERT INTO liabilities (id, name, type, amount, interest_rate, min_payment, institution)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [l.id, l.name, l.type, l.amount, l.interest_rate, l.min_payment, l.institution]
      );
    }
  }

  if (existingTx[0].count > 0) {
    console.log('Database already has transaction data.');
    return;
  }

  console.log('Seeding initial financial platform data...');

  // 1. Initial Budgets
  const budgets = [
    { id: uuidv4(), category: 'Groceries', monthly_limit: 600, alert_threshold: 80 },
    { id: uuidv4(), category: 'Dining Out', monthly_limit: 350, alert_threshold: 75 },
    { id: uuidv4(), category: 'Housing & Utilities', monthly_limit: 1800, alert_threshold: 90 },
    { id: uuidv4(), category: 'Entertainment & Leisure', monthly_limit: 250, alert_threshold: 80 },
    { id: uuidv4(), category: 'Shopping', monthly_limit: 300, alert_threshold: 75 },
    { id: uuidv4(), category: 'Transportation', monthly_limit: 250, alert_threshold: 80 },
    { id: uuidv4(), category: 'Health & Wellness', monthly_limit: 150, alert_threshold: 80 }
  ];

  for (const b of budgets) {
    await run(
      'INSERT INTO budgets (id, category, monthly_limit, alert_threshold) VALUES (?, ?, ?, ?)',
      [b.id, b.category, b.monthly_limit, b.alert_threshold]
    );
  }

  // 2. Initial Subscriptions with leak detection hints
  const subscriptions = [
    {
      id: uuidv4(),
      name: 'Netflix Premium 4K',
      amount: 22.99,
      billing_cycle: 'monthly',
      category: 'Entertainment & Leisure',
      next_billing_date: '2026-09-24',
      status: 'active',
      is_leak: 0,
      leak_reason: null,
      notes: 'Family entertainment'
    },
    {
      id: uuidv4(),
      name: 'Spotify Premium Individual',
      amount: 11.99,
      billing_cycle: 'monthly',
      category: 'Entertainment & Leisure',
      next_billing_date: '2026-09-18',
      status: 'active',
      is_leak: 1,
      leak_reason: 'Potential duplicate: You also have an Apple Music Family plan active.',
      notes: 'Music streaming'
    },
    {
      id: uuidv4(),
      name: 'Apple Music Family',
      amount: 16.99,
      billing_cycle: 'monthly',
      category: 'Entertainment & Leisure',
      next_billing_date: '2026-10-02',
      status: 'active',
      is_leak: 1,
      leak_reason: 'Redundant audio streaming service alongside Spotify.',
      notes: 'Shared with family'
    },
    {
      id: uuidv4(),
      name: 'Equinox Gym Membership',
      amount: 210.00,
      billing_cycle: 'monthly',
      category: 'Health & Wellness',
      next_billing_date: '2026-10-01',
      status: 'active',
      is_leak: 1,
      leak_reason: 'Zero gym check-ins detected in the last 45 days. High cancellation savings ($2,520/yr).',
      notes: 'Downtown club access'
    },
    {
      id: uuidv4(),
      name: 'AWS Cloud Hosting',
      amount: 43.50,
      billing_cycle: 'monthly',
      category: 'Work & Development',
      next_billing_date: '2026-10-05',
      status: 'active',
      is_leak: 0,
      leak_reason: null,
      notes: 'Side projects compute'
    },
    {
      id: uuidv4(),
      name: 'Github Copilot Pro',
      amount: 10.00,
      billing_cycle: 'monthly',
      category: 'Work & Development',
      next_billing_date: '2026-09-29',
      status: 'active',
      is_leak: 0,
      leak_reason: null,
      notes: 'Developer productivity tool'
    },
    {
      id: uuidv4(),
      name: 'The Athletic Sports Digest',
      amount: 7.99,
      billing_cycle: 'monthly',
      category: 'Entertainment & Leisure',
      next_billing_date: '2026-09-20',
      status: 'active',
      is_leak: 1,
      leak_reason: 'Promotional discount expired; rate increased from $2.99 to $7.99.',
      notes: 'Sports journalism'
    }
  ];

  for (const s of subscriptions) {
    await run(
      `INSERT INTO subscriptions (id, name, amount, billing_cycle, category, next_billing_date, status, is_leak, leak_reason, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.name, s.amount, s.billing_cycle, s.category, s.next_billing_date, s.status, s.is_leak, s.leak_reason, s.notes]
    );
  }

  // 3. Savings Goals
  const goals = [
    {
      id: uuidv4(),
      name: 'Emergency Reserve Fund (6 Months)',
      target_amount: 15000,
      current_amount: 11450,
      target_date: '2026-12-31',
      category: 'Safety Net',
      icon: 'shield-check',
      color: 'emerald',
      status: 'active'
    },
    {
      id: uuidv4(),
      name: 'Kyoto & Tokyo Autumn Journey',
      target_amount: 4200,
      current_amount: 3100,
      target_date: '2026-11-15',
      category: 'Travel',
      icon: 'plane',
      color: 'sky',
      status: 'active'
    },
    {
      id: uuidv4(),
      name: 'Next-Gen EV Down Payment',
      target_amount: 12000,
      current_amount: 5800,
      target_date: '2027-04-01',
      category: 'Vehicle',
      icon: 'car',
      color: 'indigo',
      status: 'active'
    },
    {
      id: uuidv4(),
      name: 'Home Office Tech Upgrade',
      target_amount: 2500,
      current_amount: 2500,
      target_date: '2026-08-30',
      category: 'Gear',
      icon: 'laptop',
      color: 'amber',
      status: 'completed'
    }
  ];

  for (const g of goals) {
    await run(
      `INSERT INTO savings_goals (id, name, target_amount, current_amount, target_date, category, icon, color, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [g.id, g.name, g.target_amount, g.current_amount, g.target_date, g.category, g.icon, g.color, g.status]
    );
  }

  // 4. Historical & Current Month Transactions
  const today = new Date();
  const formatIso = (daysAgo) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const sampleTransactions = [
    // Income
    { id: uuidv4(), amount: 4850.00, type: 'income', category: 'Salary', merchant: 'TechCorp Global', description: 'Bi-weekly Direct Deposit', date: formatIso(1), payment_method: 'Direct Deposit', is_recurring: 1, tags: 'paycheck,primary' },
    { id: uuidv4(), amount: 750.00, type: 'income', category: 'Freelance & Consulting', merchant: 'Design Studio Client', description: 'UI Architecture Consultation Invoice #104', date: formatIso(5), payment_method: 'Bank Wire', is_recurring: 0, tags: 'side-hustle' },
    { id: uuidv4(), amount: 142.30, type: 'income', category: 'Dividends & Yield', merchant: 'Vanguard High-Yield', description: 'Monthly Dividend Distribution', date: formatIso(12), payment_method: 'Investment Account', is_recurring: 1, tags: 'passive' },
    { id: uuidv4(), amount: 4850.00, type: 'income', category: 'Salary', merchant: 'TechCorp Global', description: 'Bi-weekly Direct Deposit', date: formatIso(15), payment_method: 'Direct Deposit', is_recurring: 1, tags: 'paycheck,primary' },

    // Expenses - Recent
    { id: uuidv4(), amount: 124.60, type: 'expense', category: 'Groceries', merchant: 'Whole Foods Market', description: 'Weekly organic groceries & pantry items', date: formatIso(0), payment_method: 'Apple Pay (Amex)', is_recurring: 0, tags: 'food,organic' },
    { id: uuidv4(), amount: 42.50, type: 'expense', category: 'Dining Out', merchant: 'Blue Bottle Coffee & Bakery', description: 'Brunch & artisanal pour-over with Alex', date: formatIso(1), payment_method: 'Credit Card', is_recurring: 0, tags: 'coffee,social' },
    { id: uuidv4(), amount: 18.25, type: 'expense', category: 'Transportation', merchant: 'Uber Technologies', description: 'Ride home from downtown meeting', date: formatIso(2), payment_method: 'Apple Pay', is_recurring: 0, tags: 'rideshare' },
    { id: uuidv4(), amount: 1550.00, type: 'expense', category: 'Housing & Utilities', merchant: 'Metropolitan Residences', description: 'Monthly Apartment Rent', date: formatIso(13), payment_method: 'ACH Transfer', is_recurring: 1, tags: 'rent,fixed' },
    { id: uuidv4(), amount: 145.20, type: 'expense', category: 'Housing & Utilities', merchant: 'City Power & Grid', description: 'Electricity & Gas bill for August/Sept', date: formatIso(6), payment_method: 'Direct Debit', is_recurring: 1, tags: 'utilities' },
    { id: uuidv4(), amount: 89.99, type: 'expense', category: 'Shopping', merchant: 'Amazon.com', description: 'Ergonomic mousepad & USB-C cable kit', date: formatIso(3), payment_method: 'Credit Card', is_recurring: 0, tags: 'office,electronics' },
    { id: uuidv4(), amount: 76.40, type: 'expense', category: 'Dining Out', merchant: 'Ramen Danbo', description: 'Dinner with college friends', date: formatIso(4), payment_method: 'Credit Card', is_recurring: 0, tags: 'dining,social' },
    { id: uuidv4(), amount: 210.00, type: 'expense', category: 'Health & Wellness', merchant: 'Equinox Fitness Club', description: 'Monthly Gym Membership', date: formatIso(13), payment_method: 'Credit Card', is_recurring: 1, tags: 'fitness,subscription' },
    { id: uuidv4(), amount: 95.10, type: 'expense', category: 'Groceries', merchant: "Trader Joe's", description: 'Fresh produce, snacks, and sparkling water', date: formatIso(7), payment_method: 'Debit Card', is_recurring: 0, tags: 'groceries' },
    { id: uuidv4(), amount: 48.00, type: 'expense', category: 'Transportation', merchant: 'Shell Oil Station #402', description: 'Fuel refill (Premium unleaded)', date: formatIso(8), payment_method: 'Credit Card', is_recurring: 0, tags: 'gas' },
    { id: uuidv4(), amount: 22.99, type: 'expense', category: 'Entertainment & Leisure', merchant: 'Netflix', description: 'Streaming Monthly Premium Tier', date: formatIso(20), payment_method: 'Credit Card', is_recurring: 1, tags: 'streaming' },
    { id: uuidv4(), amount: 16.99, type: 'expense', category: 'Entertainment & Leisure', merchant: 'Apple.com/bill', description: 'Apple Music Family', date: formatIso(14), payment_method: 'Apple Pay', is_recurring: 1, tags: 'streaming,music' },
    { id: uuidv4(), amount: 11.99, type: 'expense', category: 'Entertainment & Leisure', merchant: 'Spotify USA', description: 'Spotify Individual Plan', date: formatIso(26), payment_method: 'PayPal', is_recurring: 1, tags: 'streaming,music' },
    { id: uuidv4(), amount: 65.00, type: 'expense', category: 'Entertainment & Leisure', merchant: 'AMC IMAX Cinema', description: 'Movie tickets & concessions for 2', date: formatIso(9), payment_method: 'Credit Card', is_recurring: 0, tags: 'movies' },
    { id: uuidv4(), amount: 115.80, type: 'expense', category: 'Groceries', merchant: 'Sprouts Farmers Market', description: 'Bulk grains, nuts, and organic poultry', date: formatIso(11), payment_method: 'Apple Pay', is_recurring: 0, tags: 'groceries' },
    { id: uuidv4(), amount: 84.50, type: 'expense', category: 'Dining Out', merchant: 'Trattoria Bella Vista', description: 'Italian bistro dinner', date: formatIso(10), payment_method: 'Credit Card', is_recurring: 0, tags: 'dining' },
    { id: uuidv4(), amount: 35.00, type: 'expense', category: 'Health & Wellness', merchant: 'CorePower Yoga', description: 'Drop-in hot vinyasa session', date: formatIso(12), payment_method: 'Apple Pay', is_recurring: 0, tags: 'yoga' },
    { id: uuidv4(), amount: 140.00, type: 'expense', category: 'Shopping', merchant: 'Nordstrom Rack', description: 'Autumn jacket and winter scarf', date: formatIso(16), payment_method: 'Credit Card', is_recurring: 0, tags: 'apparel' }
  ];

  for (const t of sampleTransactions) {
    await run(
      `INSERT INTO transactions (id, amount, type, category, merchant, description, date, payment_method, is_recurring, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [t.id, t.amount, t.type, t.category, t.merchant, t.description, t.date, t.payment_method, t.is_recurring, t.tags]
    );
  }

  // 5. Initial AI Insights
  const initialInsights = [
    {
      id: uuidv4(),
      type: 'leak',
      title: 'Redundant Subscriptions Detected: $28.98/mo',
      message: 'You are currently paying for both Spotify ($11.99) and Apple Music Family ($16.99). Cancelling one will reclaim ~$144 to ~$204 annually.',
      severity: 'warning',
      action_label: 'Review Subscriptions',
      action_payload: '/subscriptions'
    },
    {
      id: uuidv4(),
      type: 'budget_alert',
      title: 'Dining Out Exceeded: 86% of Budget Used',
      message: 'You have spent $303.40 of your $350 monthly limit on Dining Out with 16 days left in the billing cycle.',
      severity: 'warning',
      action_label: 'View Dining Out Budget',
      action_payload: '/budgets'
    },
    {
      id: uuidv4(),
      type: 'savings_tip',
      title: 'Emergency Cushion: 76% Funded',
      message: 'At your current average monthly savings velocity of $1,840, your 6-month Emergency Fund will be 100% complete by mid-November!',
      severity: 'success',
      action_label: 'Check Savings Goal',
      action_payload: '/goals'
    },
    {
      id: uuidv4(),
      type: 'trend',
      title: 'Health Score Trend: +4 Pts This Month',
      message: 'Your overall financial health index is 82/100 ("Healthy Tier"). Reducing recurring leakage can push you into the "Elite" 90+ zone.',
      severity: 'info',
      action_label: 'Inspect Health Radar',
      action_payload: '/dashboard'
    }
  ];

  console.log('Successfully populated initial financial mock data!');
};

if (require.main === module) {
  seedData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}

module.exports = { seedData };
