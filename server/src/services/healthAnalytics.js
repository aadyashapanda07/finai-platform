const { all } = require('../db/database');

/**
 * Intelligent Financial Health & Predictive Analytics Engine
 */

const calculateFinancialHealth = async () => {
  // 1. Fetch live metrics
  const transactions = await all('SELECT * FROM transactions ORDER BY date DESC');
  const budgets = await all('SELECT * FROM budgets');
  const subscriptions = await all('SELECT * FROM subscriptions WHERE status != "cancelled"');
  const goals = await all('SELECT * FROM savings_goals');

  let totalIncome = 0;
  let totalExpenses = 0;
  const categorySpending = {};

  // Calculate current month's totals
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  transactions.forEach((tx) => {
    // Check if in current month (or use all transactions if dataset is within 30 days)
    const txDate = tx.date;
    const isCurrentMonth = txDate.startsWith(currentMonthStr);

    if (tx.type === 'income') {
      if (isCurrentMonth) totalIncome += tx.amount;
    } else if (tx.type === 'expense') {
      if (isCurrentMonth) {
        totalExpenses += tx.amount;
        categorySpending[tx.category] = (categorySpending[tx.category] || 0) + tx.amount;
      }
    }
  });

  // Fallback to recent 30-day window if current month has very few transactions
  if (totalIncome === 0 && transactions.some(t => t.type === 'income')) {
    transactions.forEach((tx) => {
      if (tx.type === 'income') totalIncome += tx.amount;
      else if (tx.type === 'expense') {
        totalExpenses += tx.amount;
        categorySpending[tx.category] = (categorySpending[tx.category] || 0) + tx.amount;
      }
    });
  }

  const netSavings = Math.max(0, totalIncome - totalExpenses);
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // 2. Pillar 1: Savings Rate (0 - 25 pts)
  // Target: 20%+ savings rate gets full 25 points
  const savingsRateScore = Math.min(25, Math.round((savingsRate / 20) * 25));

  // 3. Pillar 2: Budget Discipline (0 - 25 pts)
  let underBudgetCount = 0;
  let totalTrackedBudgets = budgets.length;

  budgets.forEach((b) => {
    const spent = categorySpending[b.category] || 0;
    if (spent <= b.monthly_limit) {
      underBudgetCount++;
    }
  });

  const budgetScore = totalTrackedBudgets > 0
    ? Math.round((underBudgetCount / totalTrackedBudgets) * 25)
    : 20;

  // 4. Pillar 3: Emergency Cushion (0 - 25 pts)
  // Benchmark: 3 to 6 months of expenses
  const emergencyGoal = goals.find(g => g.name.toLowerCase().includes('emergency'));
  const currentEmergencyFund = emergencyGoal ? emergencyGoal.current_amount : 0;
  const benchmarkMonthlyExpenses = totalExpenses > 0 ? totalExpenses : 2500;
  const targetCushion = benchmarkMonthlyExpenses * 3;
  const cushionRatio = targetCushion > 0 ? currentEmergencyFund / targetCushion : 0;
  const emergencyScore = Math.min(25, Math.round(cushionRatio * 25));

  // 5. Pillar 4: Subscription Efficiency (0 - 25 pts)
  const leakCount = subscriptions.filter(s => s.is_leak === 1).length;
  const totalMonthlySubscriptions = subscriptions.reduce((acc, s) => {
    return acc + (s.billing_cycle === 'yearly' ? s.amount / 12 : s.amount);
  }, 0);

  // Deduct 5 points per active leak, floor at 5
  const subscriptionScore = Math.max(5, 25 - (leakCount * 6));

  // Total Composite Score
  const totalScore = Math.min(100, Math.max(10, savingsRateScore + budgetScore + emergencyScore + subscriptionScore));

  let tier = 'Healthy';
  let tierColor = 'text-emerald-500';
  let summary = 'You are in a strong financial position with great cash flow and steady savings.';

  if (totalScore >= 90) {
    tier = 'Elite';
    tierColor = 'text-teal-400';
    summary = 'Outstanding financial discipline! You are maximizing savings and minimizing leaks.';
  } else if (totalScore >= 75) {
    tier = 'Healthy';
    tierColor = 'text-emerald-400';
    summary = 'Solid foundation. A few minor subscription leaks or budget adjustments can elevate you to Elite.';
  } else if (totalScore >= 55) {
    tier = 'Moderate';
    tierColor = 'text-amber-400';
    summary = 'Stable, but expenses are tightening your margins. Focus on lowering recurring subscriptions and dining out.';
  } else {
    tier = 'Needs Attention';
    tierColor = 'text-rose-400';
    summary = 'High burn rate or low savings buffer detected. Immediate budgeting and leak pruning recommended.';
  }

  // 6. Cash Flow Projection (30, 60, 90 days)
  const monthlyBurn = totalExpenses;
  const monthlyInflow = totalIncome;
  const projectedMonthlyNet = monthlyInflow - monthlyBurn;

  const projections = [
    { period: 'Current', net: netSavings, cumulativeSavings: netSavings },
    { period: '+30 Days', net: projectedMonthlyNet, cumulativeSavings: netSavings + projectedMonthlyNet },
    { period: '+60 Days', net: projectedMonthlyNet, cumulativeSavings: netSavings + (projectedMonthlyNet * 2) },
    { period: '+90 Days', net: projectedMonthlyNet, cumulativeSavings: netSavings + (projectedMonthlyNet * 3) }
  ];

  return {
    score: totalScore,
    tier,
    tierColor,
    summary,
    pillars: [
      { name: 'Savings Rate', score: savingsRateScore, max: 25, metric: `${savingsRate}%` },
      { name: 'Budget Discipline', score: budgetScore, max: 25, metric: `${underBudgetCount}/${totalTrackedBudgets} within limits` },
      { name: 'Emergency Cushion', score: emergencyScore, max: 25, metric: `$${currentEmergencyFund.toLocaleString()} saved` },
      { name: 'Subscription Efficiency', score: subscriptionScore, max: 25, metric: `${leakCount} leaks flagged` }
    ],
    metrics: {
      totalIncome,
      totalExpenses,
      netSavings,
      savingsRate,
      monthlySubscriptions: Math.round(totalMonthlySubscriptions * 100) / 100,
      activeGoalsCount: goals.filter(g => g.status === 'active').length,
      leaksDetected: leakCount
    },
    projections
  };
};

module.exports = {
  calculateFinancialHealth
};
