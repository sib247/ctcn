import { Wallet, CashbackRule, Transaction } from '../types';

export function formatCurrency(amount: number, currency: string): string {
  if (currency === 'VND') {
    return `${amount.toLocaleString('vi-VN')}₫`;
  }
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function getCashbackCycleRange(date: string, cycleStartDay: number): { start: Date; end: Date } {
  const current = new Date(date);
  const currentDay = current.getDate();
  
  let start: Date;
  let end: Date;
  
  if (currentDay >= cycleStartDay) {
    // Current cycle
    start = new Date(current.getFullYear(), current.getMonth(), cycleStartDay);
    end = new Date(current.getFullYear(), current.getMonth() + 1, cycleStartDay - 1);
  } else {
    // Previous cycle
    start = new Date(current.getFullYear(), current.getMonth() - 1, cycleStartDay);
    end = new Date(current.getFullYear(), current.getMonth(), cycleStartDay - 1);
  }
  
  return { start, end };
}

export function calculatePotentialCashback(
  amount: number,
  wallet: Wallet,
  categoryId: string,
  date: string,
  allTransactions: Transaction[]
): number {
  if (!wallet.cashbackRules || wallet.cashbackRules.length === 0) {
    return 0;
  }

  // Find applicable rule (category specific first, then ALL)
  let applicableRule: CashbackRule | undefined = wallet.cashbackRules.find(
    r => r.categoryId === categoryId
  );
  
  if (!applicableRule) {
    applicableRule = wallet.cashbackRules.find(r => r.categoryId === 'ALL');
  }
  
  if (!applicableRule) {
    return 0;
  }

  // Check minimum spend
  if (amount < applicableRule.minSpend) {
    return 0;
  }

  // Calculate base cashback
  let cashback = (amount * applicableRule.percentage) / 100;

  // Check max reward per period if set
  if (applicableRule.maxRewardPerPeriod > 0) {
    const { start, end } = getCashbackCycleRange(date, wallet.cashbackCycleStartDay || 1);
    
    // Calculate total cashback already earned in this cycle for this rule
    const cycleTransactions = allTransactions.filter(t => {
      const tDate = new Date(t.date);
      return t.walletId === wallet.id && tDate >= start && tDate <= end;
    });

    let totalCashbackThisCycle = cycleTransactions.reduce((sum, t) => sum + t.cashbackAmount, 0);
    
    // Check if adding this cashback would exceed the limit
    const remainingLimit = applicableRule.maxRewardPerPeriod - totalCashbackThisCycle;
    
    if (remainingLimit <= 0) {
      return 0;
    }
    
    cashback = Math.min(cashback, remainingLimit);
  }

  return Math.round(cashback);
}
