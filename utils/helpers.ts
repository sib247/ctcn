import { Transaction, Wallet } from '../types';

export const formatCurrency = (amount: number, currency = 'VND'): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getCashbackCycleRange = (dateStr: string, startDay: number) => {
  const date = new Date(dateStr);
  let start = new Date(date.getFullYear(), date.getMonth(), startDay);
  
  // If the transaction date is before the start day of this month, 
  // then it belongs to the cycle starting in the previous month.
  if (date.getDate() < startDay) {
    start = new Date(date.getFullYear(), date.getMonth() - 1, startDay);
  }

  // End date is the day before the next start day
  const end = new Date(start);
  end.setMonth(start.getMonth() + 1);
  end.setDate(start.getDate() - 1); // e.g., if start is 5th, end is 4th of next month

  return { start, end };
};

export const calculateTotalCashbackInPeriod = (
  walletId: string,
  ruleId: string,
  cycleStart: Date,
  cycleEnd: Date,
  allTransactions: Transaction[]
): number => {
  // Filter transactions for this wallet within the cycle
  // Note: This needs complex logic to map transactions back to rules if multiple rules apply.
  // Simplified: We assume we can sum up cashbackAmount of transactions that matched this rule.
  // However, Transaction object doesn't store ruleId. 
  // To strictly enforce caps, we often need to re-evaluate or store ruleId.
  // For this app, let's sum total cashback for the wallet if the rule is generic, 
  // or filter by category if the rule is category specific.
  
  return 0; // Placeholder, logic moved to main calculate function for efficiency
};

export const calculatePotentialCashback = (
  amount: number,
  wallet: Wallet,
  categoryId: string,
  dateStr: string,
  allTransactions: Transaction[]
): number => {
  if (wallet.type !== 'CREDIT' || !wallet.cashbackRules || wallet.cashbackRules.length === 0) {
    return 0;
  }

  // 1. Find matching rule
  let rule = wallet.cashbackRules.find(r => r.categoryId === categoryId);
  // If no specific rule, look for "ALL"
  if (!rule) {
    rule = wallet.cashbackRules.find(r => r.categoryId === 'ALL');
  }

  if (!rule) return 0;
  if (amount < rule.minSpend) return 0;

  // 2. Calculate theoretical cashback
  let calculated = amount * (rule.percentage / 100);

  // 3. Check Period Cap
  if (rule.maxRewardPerPeriod > 0) {
    const startDay = wallet.cashbackCycleStartDay || 1;
    const { start, end } = getCashbackCycleRange(dateStr, startDay);
    
    // Sum existing cashback for this specific rule (approximate by category match) in the current cycle
    const relevantTransactions = allTransactions.filter(t => {
      if (t.walletId !== wallet.id) return false;
      const tDate = new Date(t.date);
      if (tDate < start || tDate > end) return false;
      
      // Check if this transaction likely used the same rule
      // (This is heuristic since we don't store ruleId on transaction)
      if (rule!.categoryId === 'ALL') {
         // If rule is ALL, it includes everything that DIDNT match a specific rule
         // This is complex to check retroactively without storing ruleId.
         // Simplification: Sum ALL cashback for this wallet in this period? 
         // No, that might overlap with specific categories.
         // Let's assume for this app: Limit is per Category Rule.
         return t.categoryId !== rule!.categoryId; // Logic flaw here without ruleId.
      } else {
         return t.categoryId === rule!.categoryId;
      }
    });

    // Better approach for this app size:
    // If the rule has a limit, we sum up cashback of transactions with that category in this period.
    // If rule is 'ALL', we sum up cashback of transactions that don't belong to other specific rules.
    
    let currentPeriodCashback = 0;
    
    const specificRuleCategoryIds = wallet.cashbackRules
      .filter(r => r.categoryId !== 'ALL')
      .map(r => r.categoryId);

    const txsInCycle = allTransactions.filter(t => {
       const tDate = new Date(t.date);
       return t.walletId === wallet.id && tDate >= start && tDate <= end;
    });

    if (rule.categoryId === 'ALL') {
       // Sum cashback of txs that are NOT in specific categories
       currentPeriodCashback = txsInCycle
         .filter(t => !specificRuleCategoryIds.includes(t.categoryId))
         .reduce((sum, t) => sum + t.cashbackAmount, 0);
    } else {
       currentPeriodCashback = txsInCycle
         .filter(t => t.categoryId === rule!.categoryId)
         .reduce((sum, t) => sum + t.cashbackAmount, 0);
    }

    const remaining = Math.max(0, rule.maxRewardPerPeriod - currentPeriodCashback);
    return Math.min(calculated, remaining);
  }

  return calculated;
};