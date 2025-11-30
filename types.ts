
export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface UserSettings {
  currency: string;
  entityName: string;
  entityType: string;
  securityPin?: string;
  storageType?: 'local' | 'file';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  settings?: UserSettings;
}

export interface Wallet {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'credit' | 'other';
  initialBalance: number;
  color: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  deadline?: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  recurrence?: RecurrenceType;
  lastProcessedDate?: string;
  walletId: string;
  transferToWalletId?: string;
}

export type BudgetMap = Record<string, number>;

export interface AppState {
  user: User | null;
  transactions: Transaction[];
  lang: Language;
  theme: Theme;
}

export type Stats = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
};
