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
  groupName: string; // Tên danh mục hoàn tiền (VD: Ẩm thực, Online, Siêu thị)
  mcc?: string; // Mã loại giao dịch (VD: 5812, 5411)
  percentage: number;
  minSpend: number;
  maxRewardPerPeriod: number; // 0 là không giới hạn
}

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: number;
  creditLimit?: number; 
  statementDate?: number; 
  cashbackCycleStartDay?: number; 
  cashbackRules: CashbackRule[];
}

export interface TransactionGroup {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  transactionGroupId: string; // Nhóm giao dịch (Ăn uống, Di chuyển...)
  cashbackRuleId?: string; // Quy tắc hoàn tiền áp dụng
  amount: number;
  date: string; // YYYY-MM-DD
  note: string;
  type: TransactionType;
  cashbackAmount: number;
}

export interface AppData {
  wallets: Wallet[];
  transactionGroups: TransactionGroup[];
  transactions: Transaction[];
  currency: string;
  userName: string;
  darkMode: boolean;
}