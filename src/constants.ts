import { AppData, TransactionType, WalletType } from './types';

export const INITIAL_DATA: AppData = {
  currency: 'VND',
  userName: 'Người dùng',
  darkMode: false,
  wallets: [
    {
      id: 'w1',
      name: 'Ví Tiền Mặt',
      type: WalletType.CASH,
      balance: 5000000,
      cashbackRules: []
    },
    {
      id: 'w2',
      name: 'Techcombank Signature',
      type: WalletType.CREDIT,
      balance: 0, // Current debt
      creditLimit: 100000000,
      statementDate: 20,
      cashbackCycleStartDay: 20,
      cashbackRules: [
        {
          id: 'r1',
          categoryId: 'c1', // Ăn uống
          percentage: 5,
          minSpend: 100000,
          maxRewardPerPeriod: 500000
        },
        {
          id: 'r2',
          categoryId: 'ALL',
          percentage: 0.5,
          minSpend: 0,
          maxRewardPerPeriod: 0
        }
      ]
    },
    {
      id: 'w3',
      name: 'VPBank StepUp',
      type: WalletType.CREDIT,
      balance: 0,
      creditLimit: 50000000,
      statementDate: 5,
      cashbackCycleStartDay: 5,
      cashbackRules: [
        {
          id: 'r3',
          categoryId: 'c3', // Mua sắm online
          percentage: 15,
          minSpend: 500000,
          maxRewardPerPeriod: 600000
        }
      ]
    }
  ],
  categories: [
    { id: 'c1', name: 'Ăn uống', type: TransactionType.EXPENSE, icon: 'Utensils', color: '#f59e0b', mcc: '5812' },
    { id: 'c2', name: 'Di chuyển', type: TransactionType.EXPENSE, icon: 'Car', color: '#3b82f6', mcc: '4121' },
    { id: 'c3', name: 'Mua sắm', type: TransactionType.EXPENSE, icon: 'ShoppingBag', color: '#ec4899', mcc: '5311' },
    { id: 'c4', name: 'Hóa đơn', type: TransactionType.EXPENSE, icon: 'FileText', color: '#ef4444' },
    { id: 'c5', name: 'Giải trí', type: TransactionType.EXPENSE, icon: 'Film', color: '#8b5cf6', mcc: '7832' },
    { id: 'c6', name: 'Lương', type: TransactionType.INCOME, icon: 'DollarSign', color: '#10b981' },
    { id: 'c7', name: 'Thưởng', type: TransactionType.INCOME, icon: 'Gift', color: '#14b8a6' },
  ],
  transactions: [
    {
      id: 't1',
      walletId: 'w2',
      categoryId: 'c1',
      amount: 500000,
      date: new Date().toISOString().split('T')[0],
      note: 'Ăn tối nhà hàng',
      type: TransactionType.EXPENSE,
      cashbackAmount: 25000 // 5%
    },
    {
      id: 't2',
      walletId: 'w3',
      categoryId: 'c3',
      amount: 1000000,
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
      note: 'Mua giày Shopee',
      type: TransactionType.EXPENSE,
      cashbackAmount: 150000 // 15%
    }
  ]
};

// Map string names to Lucide icons dynamically in App.tsx, this is just a placeholder if needed
export const ICONS: Record<string, any> = {};
