import { AppData, TransactionType, WalletType, Transaction } from './types';

const generateMockData = (): AppData => {
  const wallets = [
    {
      id: 'w1',
      name: 'Ví Tiền Mặt',
      type: WalletType.CASH,
      balance: 15000000,
      cashbackRules: []
    },
    {
      id: 'w2',
      name: 'VIB Online Plus',
      type: WalletType.CREDIT,
      balance: -5000000,
      creditLimit: 50000000,
      statementDate: 15,
      cashbackCycleStartDay: 15,
      cashbackRules: [
        { id: 'r1', groupName: 'Mua sắm Online', mcc: '5311', percentage: 6, minSpend: 0, maxRewardPerPeriod: 600000 },
        { id: 'r2', groupName: 'Chi tiêu khác', percentage: 0.1, minSpend: 0, maxRewardPerPeriod: 0 }
      ]
    },
    {
      id: 'w3',
      name: 'HSBC Cashback',
      type: WalletType.CREDIT,
      balance: -2000000,
      creditLimit: 30000000,
      statementDate: 25,
      cashbackCycleStartDay: 25,
      cashbackRules: [
        { id: 'r3', groupName: 'Siêu thị & Y tế', mcc: '5411', percentage: 8, minSpend: 1000000, maxRewardPerPeriod: 200000 },
        { id: 'r4', groupName: 'Giáo dục', percentage: 5, minSpend: 0, maxRewardPerPeriod: 500000 }
      ]
    }
  ];

  const transactionGroups = [
    { id: 'tg1', name: 'Ăn uống', type: TransactionType.EXPENSE, icon: 'Utensils', color: '#f59e0b' },
    { id: 'tg2', name: 'Di chuyển', type: TransactionType.EXPENSE, icon: 'Car', color: '#3b82f6' },
    { id: 'tg3', name: 'Mua sắm', type: TransactionType.EXPENSE, icon: 'ShoppingBag', color: '#ec4899' },
    { id: 'tg4', name: 'Y tế', type: TransactionType.EXPENSE, icon: 'FileText', color: '#ef4444' },
    { id: 'tg5', name: 'Lương', type: TransactionType.INCOME, icon: 'DollarSign', color: '#10b981' },
  ];

  const transactions: Transaction[] = [];
  const now = new Date();
  
  for (let i = 0; i < 90; i++) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Lương hàng tháng
    if (date.getDate() === 5) {
      transactions.push({
        id: `inc-${i}`,
        walletId: 'w1',
        transactionGroupId: 'tg5',
        amount: 25000000,
        date: dateStr,
        note: 'Lương tháng',
        type: TransactionType.INCOME,
        cashbackAmount: 0
      });
    }

    // Giao dịch chi tiêu ngẫu nhiên
    if (Math.random() > 0.3) {
      const group = transactionGroups[Math.floor(Math.random() * 4)];
      const wallet = wallets[Math.floor(Math.random() * 3)];
      const amount = Math.floor(Math.random() * 500000) + 50000;
      
      let cashbackRuleId = undefined;
      let cashbackAmount = 0;

      if (wallet.type === WalletType.CREDIT && wallet.cashbackRules.length > 0) {
        const rule = wallet.cashbackRules[Math.floor(Math.random() * wallet.cashbackRules.length)];
        cashbackRuleId = rule.id;
        if (amount >= rule.minSpend) {
           cashbackAmount = Math.floor(amount * (rule.percentage / 100));
        }
      }

      transactions.push({
        id: `exp-${i}`,
        walletId: wallet.id,
        transactionGroupId: group.id,
        cashbackRuleId,
        amount,
        date: dateStr,
        note: `Chi tiêu ${group.name}`,
        type: TransactionType.EXPENSE,
        cashbackAmount
      });
    }
  }

  return {
    wallets,
    transactionGroups,
    transactions,
    currency: 'VND',
    userName: 'Thành viên SmartSpend',
    darkMode: false
  };
};

export const INITIAL_DATA = generateMockData();