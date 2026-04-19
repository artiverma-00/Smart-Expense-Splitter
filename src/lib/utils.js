import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate net balances for all members in a group
 * Returns: { userId: netAmount } — positive = owed money, negative = owes money
 */
export function calculateBalances(expenses, settlements = []) {
  const balances = {};

  for (const expense of expenses) {
    const paidById =
      expense.paidBy._id?.toString() || expense.paidBy.toString();

    if (!balances[paidById]) balances[paidById] = 0;
    balances[paidById] += expense.amount;

    for (const split of expense.splits) {
      const splitUserId = split.user._id?.toString() || split.user.toString();
      if (!balances[splitUserId]) balances[splitUserId] = 0;
      balances[splitUserId] -= split.amount;
    }
  }

  for (const settlement of settlements) {
    const fromId =
      settlement.fromUser._id?.toString() || settlement.fromUser.toString();
    const toId =
      settlement.toUser._id?.toString() || settlement.toUser.toString();

    balances[fromId] = (balances[fromId] || 0) + settlement.amount;
    balances[toId] = (balances[toId] || 0) - settlement.amount;
  }

  return balances;
}

/**
 * Minimum transactions algorithm
 * Returns array of { from, to, amount } to settle all debts
 */
export function minimizeTransactions(balances) {
  const creditors = [];
  const debtors = [];

  for (const [userId, amount] of Object.entries(balances)) {
    const rounded = Math.round(amount * 100) / 100;
    if (rounded > 0.01) creditors.push({ userId, amount: rounded });
    else if (rounded < -0.01)
      debtors.push({ userId, amount: Math.abs(rounded) });
  }

  const transactions = [];

  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const creditor = creditors[i];
    const debtor = debtors[j];
    const settleAmount = Math.min(creditor.amount, debtor.amount);

    transactions.push({
      from: debtor.userId,
      to: creditor.userId,
      amount: Math.round(settleAmount * 100) / 100,
    });

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) i++;
    if (debtor.amount < 0.01) j++;
  }

  return transactions;
}

/**
 * Calculate equal split amounts
 */
export function calculateEqualSplit(totalAmount, memberIds) {
  const perPerson = Math.round((totalAmount / memberIds.length) * 100) / 100;
  const splits = memberIds.map((userId) => ({
    user: userId,
    amount: perPerson,
    paid: false,
  }));

  const total = perPerson * memberIds.length;
  const diff = Math.round((totalAmount - total) * 100) / 100;
  if (diff !== 0)
    splits[0].amount = Math.round((splits[0].amount + diff) * 100) / 100;

  return splits;
}

/**
 * Group expenses by category for AI insights
 */
export function groupByCategory(expenses) {
  const grouped = {};
  for (const expense of expenses) {
    const cat = expense.category || "other";
    if (!grouped[cat]) grouped[cat] = { total: 0, count: 0, expenses: [] };
    grouped[cat].total += expense.amount;
    grouped[cat].count += 1;
    grouped[cat].expenses.push(expense);
  }
  return grouped;
}

/**
 * Get spending trend — last 7 days vs previous 7 days
 */
export function getSpendingTrend(expenses) {
  const now = new Date();
  const last7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const prev7 = new Date(now - 14 * 24 * 60 * 60 * 1000);

  const recentTotal = expenses
    .filter((e) => new Date(e.date) >= last7)
    .reduce((sum, e) => sum + e.amount, 0);

  const previousTotal = expenses
    .filter((e) => new Date(e.date) >= prev7 && new Date(e.date) < last7)
    .reduce((sum, e) => sum + e.amount, 0);

  const percentChange =
    previousTotal === 0
      ? 100
      : Math.round(((recentTotal - previousTotal) / previousTotal) * 100);

  return { recentTotal, previousTotal, percentChange };
}
