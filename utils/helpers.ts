import { Transaction, Wallet, TransactionType } from '../types';

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
  if (date.getDate() < startDay) {
    start = new Date(date.getFullYear(), date.getMonth() - 1, startDay);
  }
  const end = new Date(start);
  end.setMonth(start.getMonth() + 1);
  end.setDate(start.getDate() - 1);
  return { start, end };
};

export const calculateRuleCashback = (
  amount: number,
  wallet: Wallet,
  ruleId: string,
  dateStr: string,
  allTransactions: Transaction[]
): number => {
  if (wallet.type !== 'CREDIT') return 0;
  
  const rule = wallet.cashbackRules.find(r => r.id === ruleId);
  if (!rule) return 0;

  // Ngưỡng chi tối thiểu
  if (amount < rule.minSpend) return 0;

  let potential = amount * (rule.percentage / 100);

  // Hạn mức tối đa mỗi kỳ
  if (rule.maxRewardPerPeriod > 0) {
    const { start, end } = getCashbackCycleRange(dateStr, wallet.cashbackCycleStartDay || 1);
    
    const alreadyReceived = allTransactions
      .filter(t => {
        const tDate = new Date(t.date);
        return t.walletId === wallet.id && 
               t.cashbackRuleId === rule.id && 
               tDate >= start && 
               tDate <= end;
      })
      .reduce((sum, t) => sum + t.cashbackAmount, 0);

    const remaining = Math.max(0, rule.maxRewardPerPeriod - alreadyReceived);
    return Math.min(potential, remaining);
  }

  return potential;
};