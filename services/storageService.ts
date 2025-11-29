
import { Transaction, User, BudgetMap, Wallet, SavingsGoal } from '../types';

const STORAGE_PREFIX = 'MDA_APP_';

export const storageService = {
  getTransactions: (userEmail: string): Transaction[] => {
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}${userEmail}_transactions`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to parse transactions", e);
      return [];
    }
  },

  saveTransactions: (userEmail: string, transactions: Transaction[]) => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${userEmail}_transactions`, JSON.stringify(transactions));
    } catch (e) {
      console.error("Failed to save transactions", e);
    }
  },

  getBudgets: (userEmail: string): BudgetMap => {
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}${userEmail}_budgets`);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error("Failed to parse budgets", e);
      return {};
    }
  },

  saveBudgets: (userEmail: string, budgets: BudgetMap) => {
    localStorage.setItem(`${STORAGE_PREFIX}${userEmail}_budgets`, JSON.stringify(budgets));
  },

  getWallets: (userEmail: string): Wallet[] => {
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}${userEmail}_wallets`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to parse wallets", e);
      return [];
    }
  },

  saveWallets: (userEmail: string, wallets: Wallet[]) => {
    localStorage.setItem(`${STORAGE_PREFIX}${userEmail}_wallets`, JSON.stringify(wallets));
  },

  getGoals: (userEmail: string): SavingsGoal[] => {
    try {
      const data = localStorage.getItem(`${STORAGE_PREFIX}${userEmail}_goals`);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to parse goals", e);
      return [];
    }
  },

  saveGoals: (userEmail: string, goals: SavingsGoal[]) => {
    localStorage.setItem(`${STORAGE_PREFIX}${userEmail}_goals`, JSON.stringify(goals));
  },

  importData: (userEmail: string, jsonString: string): boolean => {
    try {
      const transactions = JSON.parse(jsonString);
      if (Array.isArray(transactions)) {
        localStorage.setItem(`${STORAGE_PREFIX}${userEmail}_transactions`, JSON.stringify(transactions));
        return true;
      }
      return false;
    } catch (e) {
      console.error("Invalid JSON", e);
      return false;
    }
  },

  clearData: (userEmail: string) => {
    localStorage.removeItem(`${STORAGE_PREFIX}${userEmail}_transactions`);
    localStorage.removeItem(`${STORAGE_PREFIX}${userEmail}_budgets`);
    localStorage.removeItem(`${STORAGE_PREFIX}${userEmail}_wallets`);
    localStorage.removeItem(`${STORAGE_PREFIX}${userEmail}_goals`);
  },

  processRecurringTransactions: (userEmail: string, transactions: Transaction[]): Transaction[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let newTransactions: Transaction[] = [...transactions];
    let hasChanges = false;

    // Filter for recurring templates
    const templates = transactions.filter(t => t.recurrence && t.recurrence !== 'none');

    templates.forEach(template => {
      // Determine start date for check
      const lastRunStr = template.lastProcessedDate || template.date;
      let lastRun = new Date(lastRunStr);
      lastRun.setHours(0, 0, 0, 0);

      const nextDue = new Date(lastRun);

      // Simple loop to catch up missed recurring dates
      // Safety limit: max 12 iterations to prevent infinite loops if something is wrong
      let iterations = 0;
      while (iterations < 12) {
        if (template.recurrence === 'daily') nextDue.setDate(nextDue.getDate() + 1);
        else if (template.recurrence === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
        else if (template.recurrence === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);

        if (nextDue <= today) {
           // Create new transaction
           const newTxn: Transaction = {
             ...template,
             id: crypto.randomUUID(),
             date: nextDue.toISOString().split('T')[0],
             recurrence: 'none', // Generated children are not recurring themselves
             lastProcessedDate: undefined
           };
           newTransactions.push(newTxn);
           
           // Update the template's lastProcessedDate
           const templateIndex = newTransactions.findIndex(t => t.id === template.id);
           if (templateIndex !== -1) {
             newTransactions[templateIndex] = {
               ...newTransactions[templateIndex],
               lastProcessedDate: nextDue.toISOString().split('T')[0]
             };
           }
           
           lastRun = new Date(nextDue);
           hasChanges = true;
           iterations++;
        } else {
          break;
        }
      }
    });

    if (hasChanges) {
      storageService.saveTransactions(userEmail, newTransactions);
    }
    
    return newTransactions;
  },

  exportToCSV: (transactions: Transaction[], filename: string) => {
    const headers = ['Date', 'Type', 'Wallet', 'Category', 'Description', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        t.date,
        t.type,
        t.walletId || 'N/A',
        `"${t.category}"`, 
        `"${t.description}"`,
        t.amount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
