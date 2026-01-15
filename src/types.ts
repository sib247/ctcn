export enum WalletType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
  CASH = 'CASH'
}

export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME'
}

export interface CashbackRule {
  id: string;
  categoryId: string; // "ALL" for everything else
  mcc?: string; // Specific Merchant Category Code
  percentage: number;
  minSpend: number;
  maxRewardPerPeriod: number; // 0 for unlimited
}

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  creditLimit?: number; // Only for CREDIT
  statementDate?: number; // Day of month (1-31)
  cashbackCycleStartDay?: number; // Day of month (1-31)
  cashbackRules: CashbackRule[];
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string; // Name of lucide icon
  color: string;
  mcc?: string; // Default MCC for this category
}

export interface Transaction {
  id: string;
  walletId: string;
  categoryId: string;
  amount: number;
  date: string; // ISO String YYYY-MM-DD
  note: string;
  type: TransactionType;
  cashbackAmount: number; // Calculated automatically
}

export interface AppData {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  currency: string;
  userName: string;
  darkMode: boolean;
}
