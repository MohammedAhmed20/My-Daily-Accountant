
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  Plus, Trash2, Edit2, Download, Upload, FileText, 
  TrendingUp, TrendingDown, Wallet as WalletIcon, Lightbulb, Settings, Bell, BellOff, X,
  Camera, FileSpreadsheet, Lock, PieChart as PieChartIcon, BarChart as BarChartIcon,
  ArrowRightLeft, Target, CreditCard, Landmark, Coins
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Language, TransactionType, User, BudgetMap, RecurrenceType, Wallet, SavingsGoal } from '../types';
import { TRANSLATIONS, CATEGORIES, TIPS, formatCurrency, WALLET_TYPES } from '../constants';
import { storageService } from '../services/storageService';
import { aiService } from '../services/aiService';

interface DashboardProps {
  user: User;
  lang: Language;
  onLogout: () => void;
  currency: string;
}

// Colors for Charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff003c', '#00f0ff'];
const WALLET_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export const Dashboard: React.FC<DashboardProps> = ({ user, lang, onLogout, currency }) => {
  const t = TRANSLATIONS[lang];
  
  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [budgets, setBudgets] = useState<BudgetMap>({});
  
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics'>('overview');
  
  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [isScanning, setIsScanning] = useState(false);
  const [pin, setPin] = useState(user.settings?.securityPin || '');
  
  // Forms Data
  const [formData, setFormData] = useState<Omit<Transaction, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    amount: 0,
    category: '',
    description: '',
    recurrence: 'none',
    walletId: '',
    transferToWalletId: ''
  });
  
  const [walletFormData, setWalletFormData] = useState<Omit<Wallet, 'id'>>({
    name: '',
    type: 'cash',
    initialBalance: 0,
    color: WALLET_COLORS[0]
  });

  const [goalFormData, setGoalFormData] = useState<Omit<SavingsGoal, 'id'>>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    color: WALLET_COLORS[0]
  });

  const [depositData, setDepositData] = useState({
    walletId: '',
    amount: 0
  });

  const [formErrors, setFormErrors] = useState<{ amount?: string; category?: string; wallet?: string }>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // --- Initialization & Migration ---
  useEffect(() => {
    // Load Wallets
    let loadedWallets = storageService.getWallets(user.email);
    let loadedTransactions = storageService.getTransactions(user.email);
    const loadedGoals = storageService.getGoals(user.email);
    const savedBudgets = storageService.getBudgets(user.email);

    // MIGRATION: If no wallets exist, create default and assign existing txns
    if (loadedWallets.length === 0) {
      const defaultWallet: Wallet = {
        id: crypto.randomUUID(),
        name: 'Cash',
        type: 'cash',
        initialBalance: 0,
        color: WALLET_COLORS[0]
      };
      loadedWallets = [defaultWallet];
      storageService.saveWallets(user.email, loadedWallets);

      // Assign transactions to default wallet if they don't have one
      let migrated = false;
      loadedTransactions = loadedTransactions.map(t => {
        if (!t.walletId) {
          migrated = true;
          return { ...t, walletId: defaultWallet.id };
        }
        return t;
      });
      if (migrated) {
        storageService.saveTransactions(user.email, loadedTransactions);
      }
    }

    setWallets(loadedWallets);
    setGoals(loadedGoals);
    setBudgets(savedBudgets);
    
    // Process recurring after migration ensure wallet IDs
    const processedTransactions = storageService.processRecurringTransactions(user.email, loadedTransactions);
    setTransactions(processedTransactions);
    
    // Set default wallet for form
    if (loadedWallets.length > 0) {
      setFormData(prev => ({ ...prev, walletId: loadedWallets[0].id }));
      setDepositData(prev => ({ ...prev, walletId: loadedWallets[0].id }));
    }

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [user.email]);

  // --- Persistence ---
  useEffect(() => {
    storageService.saveTransactions(user.email, transactions);
  }, [transactions, user.email]);

  useEffect(() => {
    storageService.saveBudgets(user.email, budgets);
  }, [budgets, user.email]);

  useEffect(() => {
    storageService.saveWallets(user.email, wallets);
  }, [wallets, user.email]);

  useEffect(() => {
    storageService.saveGoals(user.email, goals);
  }, [goals, user.email]);

  // --- Calculations ---

  const walletBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    wallets.forEach(w => {
      balances[w.id] = w.initialBalance || 0;
    });

    transactions.forEach(t => {
      if (!balances[t.walletId] && balances[t.walletId] !== 0) return;

      if (t.type === 'income') {
        balances[t.walletId] += t.amount;
      } else if (t.type === 'expense') {
        balances[t.walletId] -= t.amount;
      } else if (t.type === 'transfer' && t.transferToWalletId) {
        balances[t.walletId] -= t.amount; // Deduct from source
        if (balances[t.transferToWalletId] !== undefined) {
          balances[t.transferToWalletId] += t.amount; // Add to dest
        }
      }
    });
    return balances;
  }, [transactions, wallets]);

  const stats = useMemo(() => {
    const totalBalance = Object.values(walletBalances).reduce((sum: number, bal: number) => sum + bal, 0);
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return { totalIncome: income, totalExpense: expense, balance: totalBalance };
  }, [walletBalances, transactions]);

  // Charts Logic (Same as before but filtered for 'transfer' logic exclusion if needed)
  const pieData = useMemo(() => {
    const expenseData: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
    });
    return Object.keys(expenseData).map(key => ({ name: key, value: expenseData[key] }));
  }, [transactions]);

  const lineChartData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let runningBalance = wallets.reduce((sum, w) => sum + (w.initialBalance || 0), 0);
    
    // To make line chart accurate, we really need to replay history from day 1. 
    // Simplified: Show net change over time from current data points.
    return sorted.map(t => {
      if (t.type === 'income') runningBalance += t.amount;
      if (t.type === 'expense') runningBalance -= t.amount;
      // Transfers don't change global balance
      return {
        date: t.date,
        balance: runningBalance
      };
    });
  }, [transactions, wallets]);

  const barChartData = useMemo(() => {
    const monthlyData: Record<string, { name: string, income: number, expense: number }> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const name = date.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', year: '2-digit' });
      
      if (!monthlyData[key]) monthlyData[key] = { name, income: 0, expense: 0 };
      
      if (t.type === 'income') monthlyData[key].income += t.amount;
      if (t.type === 'expense') monthlyData[key].expense += t.amount;
    });

    return Object.values(monthlyData);
  }, [transactions, lang]);

  // --- Handlers ---

  const sendNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon.png' });
    }
  };

  const requestNotificationPermission = () => {
    if (!('Notification' in window)) return;
    Notification.requestPermission().then((permission) => {
      setNotificationPermission(permission);
      if (permission === 'granted') new Notification(t.notificationsEnabled);
    });
  };

  const checkBudget = (category: string, addedAmount: number, existingAmount: number = 0) => {
    const budget = budgets[category];
    if (!budget || budget <= 0) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const spentSoFar = transactions
      .filter(txn => txn.type === 'expense' && txn.category === category && txn.id !== editingId)
      .filter(txn => {
         const parts = txn.date.split('-');
         const year = parseInt(parts[0], 10);
         const month = parseInt(parts[1], 10) - 1;
         return month === currentMonth && year === currentYear;
      })
      .reduce((sum, txn) => sum + txn.amount, 0);

    const totalAfter = spentSoFar + addedAmount;
    const isExceeded = totalAfter > budget;
    const isNear = totalAfter >= budget * 0.8;
    const wasExceeded = (spentSoFar + existingAmount) > budget;
    const wasNear = (spentSoFar + existingAmount) >= budget * 0.8;

    if (isExceeded && !wasExceeded) {
      sendNotification(t.budgetExceeded, `${t.overLimitMsg} ${category}`);
    } else if (isNear && !wasNear && !isExceeded) {
      sendNotification(t.budgetAlert, `${t.nearLimitMsg} ${category}`);
    }
  };

  // Transaction Form Logic
  const handleTxnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: any = {};
    if (!formData.amount || formData.amount <= 0) errors.amount = t.invalidAmount;
    if (formData.type !== 'transfer' && !formData.category) errors.category = t.categoryRequired;
    if (!formData.walletId) errors.wallet = t.selectWallet;
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (formData.type === 'expense') {
      let existing = 0;
      if (editingId) {
        const old = transactions.find(t => t.id === editingId);
        if (old?.category === formData.category) existing = old.amount;
      }
      checkBudget(formData.category, formData.amount, existing);
    }

    const payload = { ...formData };
    // Clean up transfer fields if not transfer
    if (payload.type !== 'transfer') {
      delete payload.transferToWalletId;
    }

    if (editingId) {
      setTransactions(prev => prev.map(t => t.id === editingId ? { ...payload, id: editingId } as Transaction : t));
    } else {
      setTransactions(prev => [{ ...payload, id: crypto.randomUUID() } as Transaction, ...prev]);
    }
    closeForm();
  };

  // Wallet Form Logic
  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWalletId) {
      // Update existing wallet
      setWallets(prev => prev.map(w => w.id === editingWalletId ? { ...walletFormData, id: editingWalletId } as Wallet : w));
      setEditingWalletId(null);
    } else {
      // Create new wallet
      const newWallet: Wallet = {
        id: crypto.randomUUID(),
        ...walletFormData
      } as Wallet;
      setWallets([...wallets, newWallet]);
    }
    setIsWalletModalOpen(false);
    setWalletFormData({ name: '', type: 'cash', initialBalance: 0, color: WALLET_COLORS[wallets.length % WALLET_COLORS.length] });
  };

  // Wallet Edit Handler
  const handleEditWallet = (wallet: Wallet) => {
    setWalletFormData({
      name: wallet.name,
      type: wallet.type,
      initialBalance: wallet.initialBalance,
      color: wallet.color
    });
    setEditingWalletId(wallet.id);
    setIsWalletModalOpen(true);
  };

  // Wallet Delete Handler
  const handleDeleteWallet = (walletId: string) => {
    if (wallets.length === 1) {
      alert(lang === 'ar' ? 'يجب أن يكون لديك محفظة واحدة على الأقل' : 'You must have at least one wallet');
      return;
    }
    const hasTransactions = transactions.some(t => t.walletId === walletId || t.transferToWalletId === walletId);
    if (hasTransactions) {
      alert(lang === 'ar' ? 'لا يمكن حذف محفظة تحتوي على معاملات' : 'Cannot delete wallet with transactions');
      return;
    }
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه المحفظة؟' : 'Are you sure you want to delete this wallet?')) {
      setWallets(prev => prev.filter(w => w.id !== walletId));
    }
  };

  // Goal Form Logic
  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newGoal: SavingsGoal = {
      id: crypto.randomUUID(),
      ...goalFormData
    } as SavingsGoal;
    setGoals([...goals, newGoal]);
    setIsGoalModalOpen(false);
    setGoalFormData({ name: '', targetAmount: 0, currentAmount: 0, color: WALLET_COLORS[goals.length % WALLET_COLORS.length] });
  };

  // Goal Deposit Logic
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal) return;
    
    // 1. Create Expense Transaction
    const newTxn: Transaction = {
      id: crypto.randomUUID(),
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      amount: depositData.amount,
      category: 'Savings',
      description: `Deposit to Goal: ${selectedGoal.name}`,
      walletId: depositData.walletId,
      recurrence: 'none'
    };
    setTransactions([newTxn, ...transactions]);

    // 2. Update Goal Amount
    setGoals(prev => prev.map(g => g.id === selectedGoal.id ? { ...g, currentAmount: g.currentAmount + depositData.amount } : g));
    
    setIsDepositModalOpen(false);
    setSelectedGoal(null);
  };

  const handleEdit = (txn: Transaction) => {
    setFormData({
      date: txn.date,
      type: txn.type,
      amount: txn.amount,
      category: txn.category,
      description: txn.description,
      recurrence: txn.recurrence || 'none',
      walletId: txn.walletId || wallets[0]?.id,
      transferToWalletId: txn.transferToWalletId || ''
    });
    setEditingId(txn.id);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      amount: 0,
      category: '',
      description: '',
      recurrence: 'none',
      walletId: wallets[0]?.id || '',
      transferToWalletId: ''
    });
    setFormErrors({});
  };

  // Helper to get icon for wallet
  const getWalletIcon = (type: string) => {
    switch(type) {
      case 'bank': return <Landmark size={20} />;
      case 'credit': return <CreditCard size={20} />;
      case 'cash': return <Coins size={20} />;
      default: return <WalletIcon size={20} />;
    }
  };

  const randomTip = useMemo(() => TIPS[lang][Math.floor(Math.random() * TIPS[lang].length)], [lang]);

  // Scan Receipt
  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsScanning(true);
      const reader = new FileReader();
      reader.readAsDataURL(e.target.files[0]);
      reader.onload = async (event) => {
        try {
          const base64Data = event.target?.result as string;
          const result = await aiService.scanReceipt(base64Data);
          setFormData(prev => ({
            ...prev,
            amount: result.amount || prev.amount,
            date: result.date || prev.date,
            description: result.description || prev.description,
            category: result.category || prev.category,
            type: 'expense'
          }));
        } catch (error) {
          alert("Scan failed.");
        } finally {
          setIsScanning(false);
        }
      };
    }
  };

  // --- Export Functions ---
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'p' });
    const title = user.settings?.entityName || user.name;
    doc.text(`Financial Report - ${title}`, 14, 20);
    doc.text(`Balance: ${formatCurrency(stats.balance, currency, lang)}`, 14, 30);
    
    autoTable(doc, {
      head: [['Date', 'Type', 'Wallet', 'Category', 'Description', 'Amount']],
      body: transactions.map(t => [
        t.date, t.type, wallets.find(w=>w.id===t.walletId)?.name || 'N/A', t.category, t.description, t.amount.toFixed(2)
      ]),
      startY: 40,
    });
    doc.save(`report_${Date.now()}.pdf`);
  };

  const savePin = () => {
    const updatedUser = { ...user, settings: { ...user.settings!, securityPin: pin } };
    localStorage.setItem('mda_user', JSON.stringify(updatedUser));
    alert("PIN Saved!");
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
      
      {/* Overview / Analytics Toggle */}
      <div className="flex bg-white/50 dark:bg-black/20 p-1.5 rounded-2xl w-fit mx-auto backdrop-blur-md border border-white/20 dark:border-white/5 shadow-sm">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'overview' ? 'bg-white dark:bg-cyber-primary text-blue-600 dark:text-white shadow-md scale-105' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <div className="flex items-center gap-2"><PieChartIcon size={18} />{t.dashboard}</div>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'analytics' ? 'bg-white dark:bg-cyber-secondary text-purple-600 dark:text-white shadow-md scale-105' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <div className="flex items-center gap-2"><BarChartIcon size={18} />{t.analytics}</div>
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Top Stats - Global */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Balance Card */}
            <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-blue-500/20"></div>
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 dark:text-blue-400">
                     <WalletIcon size={24} />
                   </div>
                   <span className="text-xs font-medium px-2 py-1 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg flex items-center gap-1">
                     <TrendingUp size={12} /> +2.5%
                   </span>
                 </div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium">{t.balance}</p>
                 <h3 className={`text-3xl font-black ${stats.balance >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-500'}`}>
                   {formatCurrency(stats.balance, currency, lang)}
                 </h3>
               </div>
            </div>

            {/* Income Card */}
            <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-green-500/20"></div>
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-green-500/10 rounded-2xl text-green-600 dark:text-green-400">
                     <TrendingUp size={24} />
                   </div>
                 </div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium">{t.income}</p>
                 <h3 className="text-3xl font-black text-green-600 dark:text-green-400">
                   {formatCurrency(stats.totalIncome, currency, lang)}
                 </h3>
               </div>
            </div>

            {/* Expense Card */}
            <div className="glass-card p-6 rounded-3xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-red-500/20"></div>
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-red-500/10 rounded-2xl text-red-600 dark:text-red-400">
                     <TrendingDown size={24} />
                   </div>
                 </div>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 font-medium">{t.expense}</p>
                 <h3 className="text-3xl font-black text-red-600 dark:text-red-400">
                   {formatCurrency(stats.totalExpense, currency, lang)}
                 </h3>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Wallets & Transactions */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Wallets Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <WalletIcon size={24} className="text-blue-500"/> {t.wallets}
                  </h3>
                  <button onClick={() => setIsWalletModalOpen(true)} className="text-sm bg-white dark:bg-white/10 px-4 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/20 transition font-semibold shadow-sm border border-gray-100 dark:border-white/5">
                    + {t.addWallet}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wallets.map(wallet => {
                    const bal = walletBalances[wallet.id] || 0;
                    return (
                      <div key={wallet.id} className="glass-card p-5 rounded-2xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 border-l-4" style={{ borderLeftColor: wallet.color }}>
                        <div className="flex justify-between items-start relative z-10">
                          <div className="flex-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{wallet.name}</p>
                            <h4 className="text-2xl font-bold dark:text-white">{formatCurrency(bal, currency, lang)}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-gray-50 dark:bg-white/5 rounded-lg text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition">
                              {getWalletIcon(wallet.type)}
                            </div>
                          </div>
                        </div>
                        {/* Action buttons - show on hover */}
                        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <button 
                            onClick={() => handleEditWallet(wallet)} 
                            className="p-1.5 bg-white dark:bg-gray-800 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg shadow-md transition"
                            title={lang === 'ar' ? 'تعديل' : 'Edit'}
                          >
                            <Edit2 size={14}/>
                          </button>
                          <button 
                            onClick={() => handleDeleteWallet(wallet.id)} 
                            className="p-1.5 bg-white dark:bg-gray-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg shadow-md transition"
                            title={lang === 'ar' ? 'حذف' : 'Delete'}
                          >
                            <Trash2 size={14}/>
                          </button>
                        </div>
                        {/* Decorative background blob */}
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10 blur-2xl transition-all group-hover:opacity-20" style={{ background: wallet.color }}></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transactions Section */}
              <div className="glass-panel rounded-3xl overflow-hidden border border-white/20 dark:border-white/5">
                 <div className="p-6 border-b border-gray-100 dark:border-white/5 flex flex-wrap gap-4 justify-between items-center bg-white/50 dark:bg-white/5 backdrop-blur-sm">
                    <h3 className="text-lg font-bold dark:text-white">{t.recentTransactions}</h3>
                    <div className="flex gap-2">
                      <button onClick={exportPDF} className="p-2.5 hover:bg-white dark:hover:bg-white/10 rounded-xl transition text-gray-600 dark:text-gray-300"><FileText size={20}/></button>
                      <button onClick={() => setIsSettingsOpen(true)} className="p-2.5 hover:bg-white dark:hover:bg-white/10 rounded-xl transition text-gray-600 dark:text-gray-300"><Settings size={20}/></button>
                      <button 
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-cyber-primary dark:to-cyber-secondary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 transition active:scale-95"
                      >
                        <Plus size={20} /> <span className="hidden sm:inline">{t.addTransaction}</span>
                      </button>
                    </div>
                 </div>
                 <div className="max-h-[600px] overflow-y-auto custom-scrollbar p-2">
                    <table className="w-full text-start text-sm dark:text-gray-300 border-separate border-spacing-y-1">
                      <thead className="sticky top-0 z-10">
                        <tr className="text-gray-400 text-xs uppercase tracking-wider">
                          <th className="px-6 py-3 font-semibold text-left bg-gray-50/90 dark:bg-cyber-dark/90 backdrop-blur-sm rounded-l-xl">{t.date}</th>
                          <th className="px-6 py-3 font-semibold text-left bg-gray-50/90 dark:bg-cyber-dark/90 backdrop-blur-sm">{t.category}</th>
                          <th className="px-6 py-3 font-semibold text-left bg-gray-50/90 dark:bg-cyber-dark/90 backdrop-blur-sm">{t.description}</th>
                          <th className="px-6 py-3 font-semibold text-right bg-gray-50/90 dark:bg-cyber-dark/90 backdrop-blur-sm">{t.amount}</th>
                          <th className="px-6 py-3 font-semibold text-center bg-gray-50/90 dark:bg-cyber-dark/90 backdrop-blur-sm rounded-r-xl"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.slice(0, 15).map((txn) => (
                          <tr key={txn.id} className="group hover:bg-white/50 dark:hover:bg-white/5 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap rounded-l-xl border-y border-l border-transparent group-hover:border-gray-100 dark:group-hover:border-white/5">{txn.date}</td>
                            <td className="px-6 py-4 border-y border-transparent group-hover:border-gray-100 dark:group-hover:border-white/5">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                txn.type === 'income' ? 'bg-green-100/50 border-green-200 text-green-700 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400' :
                                txn.type === 'expense' ? 'bg-red-100/50 border-red-200 text-red-700 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400' :
                                'bg-blue-100/50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/20 dark:text-blue-400'
                              }`}>
                                {txn.type === 'transfer' ? t.transfer : txn.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 border-y border-transparent group-hover:border-gray-100 dark:group-hover:border-white/5">
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-700 dark:text-gray-200">{txn.description}</span>
                                {txn.type === 'transfer' && (
                                  <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                    {wallets.find(w => w.id === txn.walletId)?.name} 
                                    <ArrowRightLeft size={10}/> 
                                    {wallets.find(w => w.id === txn.transferToWalletId)?.name}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={`px-6 py-4 text-right font-bold text-base border-y border-transparent group-hover:border-gray-100 dark:group-hover:border-white/5 ${
                              txn.type === 'income' ? 'text-green-600 dark:text-green-400' : txn.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                            }`}>
                              {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}
                              {formatCurrency(txn.amount, currency, lang)}
                            </td>
                            <td className="px-6 py-4 text-center rounded-r-xl border-y border-r border-transparent group-hover:border-gray-100 dark:group-hover:border-white/5">
                              <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(txn)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition"><Edit2 size={16}/></button>
                                <button onClick={() => {if(confirm(t.confirmDelete)) setTransactions(prev => prev.filter(x=>x.id!==txn.id))}} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition"><Trash2 size={16}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
              </div>
            </div>

            {/* Right Column: Goals & Stats */}
            <div className="space-y-8">
              
              {/* Savings Goals */}
              <div className="glass-card p-6 rounded-3xl">
                 <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                    <Target size={22} className="text-purple-500"/> {t.goals}
                  </h3>
                  <button onClick={() => setIsGoalModalOpen(true)} className="text-xs bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition font-bold">
                    + {t.addGoal}
                  </button>
                </div>
                <div className="space-y-4">
                  {goals.length === 0 && <p className="text-gray-400 text-sm text-center py-8 bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">{t.noTransactions}</p>}
                  {goals.map(goal => {
                    const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
                    return (
                      <div key={goal.id} className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-bold dark:text-white">{goal.name}</span>
                          <span className="text-gray-500 font-medium">{formatCurrency(goal.currentAmount, currency, lang)} <span className="text-gray-300">/</span> {formatCurrency(goal.targetAmount, currency, lang)}</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                            style={{ width: `${progress}%`, background: goal.color }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-400 font-medium">{progress.toFixed(0)}%</span>
                          <button 
                             onClick={() => { setSelectedGoal(goal); setIsDepositModalOpen(true); }}
                             className="text-xs bg-gray-50 dark:bg-white/10 px-3 py-1.5 rounded-lg shadow-sm hover:bg-gray-100 dark:hover:bg-white/20 transition font-semibold flex items-center gap-1"
                          >
                            <Plus size={12}/> {t.deposit}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Pie Chart */}
              <div className="glass-card p-6 rounded-3xl min-h-[350px] flex flex-col">
                <h3 className="font-bold mb-2 dark:text-white flex items-center gap-2"><PieChartIcon size={20} className="text-cyan-500"/> {t.distribution}</h3>
                <div className="flex-1 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie 
                        data={pieData} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={80} 
                        paddingAngle={5} 
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {pieData.slice(0, 4).map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }}></div>
                      {entry.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Tip */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl shadow-neon-purple text-white relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                <Lightbulb size={80} className="absolute -bottom-4 -right-4 text-white/10 rotate-12" />
                <h4 className="font-bold mb-3 flex items-center gap-2 text-lg"><Lightbulb size={20} className="text-yellow-300 animate-pulse"/> {t.tipOfTheDay}</h4>
                <p className="text-sm opacity-90 leading-relaxed font-medium relative z-10">"{randomTip}"</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Analytics Tab */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="glass-card p-6 rounded-3xl shadow-sm h-96">
            <h3 className="font-bold dark:text-white mb-6 flex items-center gap-2"><TrendingUp size={20} className="text-cyan-500"/> {t.balanceHistory}</h3>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis dataKey="date" fontSize={10} tickFormatter={d=>d.substring(5)} axisLine={false} tickLine={false} dy={10} stroke="#94a3b8"/>
                <YAxis fontSize={10} axisLine={false} tickLine={false} dx={-10} stroke="#94a3b8"/>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Line type="monotone" dataKey="balance" stroke="#00f0ff" strokeWidth={4} dot={{r: 4, fill: '#00f0ff', strokeWidth: 0}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card p-6 rounded-3xl shadow-sm h-96">
             <h3 className="font-bold dark:text-white mb-6 flex items-center gap-2"><BarChartIcon size={20} className="text-purple-500"/> {t.monthlyComparison}</h3>
             <ResponsiveContainer width="100%" height="85%">
              <BarChart data={barChartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} dy={10} stroke="#94a3b8"/>
                <YAxis fontSize={10} axisLine={false} tickLine={false} dx={-10} stroke="#94a3b8"/>
                <RechartsTooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="income" fill="#10b981" radius={[6, 6, 6, 6]} barSize={20} />
                <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 6, 6]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. Transaction Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-white/10 animate-zoom-in relative overflow-hidden">
             {/* Decorative glow */}
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
             
             <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-gray-400">
                  {editingId ? t.editTransaction : t.addTransaction}
                </h3>
                <button onClick={closeForm} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition"><X size={24} className="text-gray-400"/></button>
             </div>
             
             {/* AI Scan (Only if adding) */}
             {!editingId && (
                <button onClick={() => cameraInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 py-4 mb-6 border-2 border-dashed border-cyan-500/30 rounded-2xl text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition group">
                   {isScanning ? <span className="animate-spin">⏳</span> : <Camera size={24} className="group-hover:scale-110 transition-transform"/>} 
                   <span className="font-bold">{t.scanReceipt}</span>
                </button>
             )}
             <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" onChange={handleScanReceipt} />

             <form onSubmit={handleTxnSubmit} className="space-y-5">
               {/* Type Toggle */}
               <div className="flex bg-gray-100 dark:bg-black/40 p-1.5 rounded-xl">
                 {(['income', 'expense', 'transfer'] as TransactionType[]).map(type => (
                   <button
                     key={type} type="button"
                     onClick={() => setFormData(prev => ({ ...prev, type }))}
                     className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all duration-300 ${formData.type === type ? 
                       (type === 'income' ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : type === 'expense' ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-blue-500 text-white shadow-lg shadow-blue-500/30') 
                       : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                   >
                     {type === 'transfer' ? t.transfer : type === 'income' ? t.income : t.expense}
                   </button>
                 ))}
               </div>

               <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">{t.date}</label>
                    <input type="date" value={formData.date} onChange={e=>setFormData({...formData, date:e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" required />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">{t.amount}</label>
                    <input type="number" step="0.01" value={formData.amount} onChange={e=>setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" required />
                    {formErrors.amount && <p className="text-red-500 text-xs mt-1">{formErrors.amount}</p>}
                  </div>
               </div>

               {/* Wallet Selection */}
               {formData.type === 'transfer' ? (
                 <div className="grid grid-cols-2 gap-5">
                   <div>
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">{t.fromWallet}</label>
                     <select value={formData.walletId} onChange={e=>setFormData({...formData, walletId: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition">
                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">{t.toWallet}</label>
                     <select value={formData.transferToWalletId} onChange={e=>setFormData({...formData, transferToWalletId: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition">
                        <option value="" disabled>{t.selectWallet}</option>
                        {wallets.filter(w => w.id !== formData.walletId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                     </select>
                   </div>
                 </div>
               ) : (
                 <div>
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">{t.selectWallet}</label>
                   <select value={formData.walletId} onChange={e=>setFormData({...formData, walletId: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition">
                      {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                   </select>
                   {formErrors.wallet && <p className="text-red-500 text-xs mt-1">{formErrors.wallet}</p>}
                 </div>
               )}

               {formData.type !== 'transfer' && (
                 <div>
                   <label className="text-xs text-gray-500 mb-1 block">{t.category}</label>
                   <select value={formData.category} onChange={e=>setFormData({...formData, category: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-black/20 rounded-lg border dark:border-white/10 text-sm dark:text-white">
                      <option value="" disabled>{t.selectCategory}</option>
                      {CATEGORIES[formData.type as 'income'|'expense'].map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                   {formErrors.category && <p className="text-red-500 text-xs">{formErrors.category}</p>}
                 </div>
               )}

               <div>
                 <label className="text-xs text-gray-500 mb-1 block">{t.description}</label>
                 <input type="text" value={formData.description} onChange={e=>setFormData({...formData, description: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-black/20 rounded-lg border dark:border-white/10 text-sm dark:text-white" placeholder="Description..." />
               </div>

               <div className="flex gap-3 pt-2">
                 <button type="button" onClick={closeForm} className="flex-1 py-2 bg-gray-100 dark:bg-white/5 rounded-lg text-sm">{t.cancel}</button>
                 <button type="submit" className="flex-1 py-2 bg-slate-900 dark:bg-cyber-primary text-white dark:text-black rounded-lg text-sm font-bold shadow-lg">{t.save}</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* 2. Add Wallet Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-white/10 animate-zoom-in">
             <h3 className="text-2xl font-black mb-6 dark:text-white">{editingWalletId ? (lang === 'ar' ? 'تعديل المحفظة' : 'Edit Wallet') : t.addWallet}</h3>
             <form onSubmit={handleWalletSubmit} className="space-y-5">
                <div>
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">{t.walletName}</label>
                   <input required type="text" value={walletFormData.name} onChange={e=>setWalletFormData({...walletFormData, name: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"/>
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">{t.type}</label>
                   <select value={walletFormData.type} onChange={e=>setWalletFormData({...walletFormData, type: e.target.value as any})} className="w-full p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition">
                      {WALLET_TYPES[lang].map(wt => <option key={wt.value} value={wt.value}>{wt.label}</option>)}
                   </select>
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">{t.initialBalance}</label>
                   <input type="number" value={walletFormData.initialBalance} onChange={e=>setWalletFormData({...walletFormData, initialBalance: parseFloat(e.target.value)})} className="w-full p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"/>
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">Color</label>
                   <div className="flex gap-3 flex-wrap">
                      {WALLET_COLORS.map(c => (
                        <button key={c} type="button" onClick={()=>setWalletFormData({...walletFormData, color: c})} className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${walletFormData.color===c?'ring-4 ring-offset-2 ring-gray-300 dark:ring-gray-600 scale-110':''}`} style={{background: c}} />
                      ))}
                   </div>
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={()=>{setIsWalletModalOpen(false); setEditingWalletId(null); setWalletFormData({ name: '', type: 'cash', initialBalance: 0, color: WALLET_COLORS[0] });}} className="flex-1 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition">{t.cancel}</button>
                   <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-cyber-primary dark:to-cyber-secondary text-white rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] transition">{t.save}</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* 3. Add Goal Modal */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
           <div className="glass-panel w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-white/10 animate-zoom-in">
             <h3 className="text-2xl font-black mb-6 dark:text-white">{t.addGoal}</h3>
             <form onSubmit={handleGoalSubmit} className="space-y-5">
                <div>
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">{t.goalName}</label>
                   <input required type="text" value={goalFormData.name} onChange={e=>setGoalFormData({...goalFormData, name: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"/>
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">{t.targetAmount}</label>
                   <input required type="number" value={goalFormData.targetAmount} onChange={e=>setGoalFormData({...goalFormData, targetAmount: parseFloat(e.target.value)})} className="w-full p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"/>
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">Color</label>
                   <div className="flex gap-3 flex-wrap">
                      {WALLET_COLORS.map(c => (
                        <button key={c} type="button" onClick={()=>setGoalFormData({...goalFormData, color: c})} className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${goalFormData.color===c?'ring-4 ring-offset-2 ring-gray-300 dark:ring-gray-600 scale-110':''}`} style={{background: c}} />
                      ))}
                   </div>
                </div>
                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={()=>setIsGoalModalOpen(false)} className="flex-1 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition">{t.cancel}</button>
                   <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-cyber-primary dark:to-cyber-secondary text-white rounded-xl text-sm font-bold shadow-lg hover:scale-[1.02] transition">{t.save}</button>
                </div>
             </form>
           </div>
        </div>
      )}

      {/* 4. Deposit Modal */}
      {isDepositModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-sm rounded-3xl shadow-2xl p-8 border border-white/20 dark:border-white/10 animate-zoom-in">
            <h3 className="text-2xl font-black mb-1 dark:text-white">{t.addFundsToGoal}</h3>
            <p className="text-sm text-gray-500 mb-6 font-medium">{selectedGoal.name}</p>
            <form onSubmit={handleDepositSubmit} className="space-y-5">
               <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">{t.fromWallet}</label>
                  <select value={depositData.walletId} onChange={e=>setDepositData({...depositData, walletId: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition">
                      {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatCurrency(walletBalances[w.id] || 0, currency, lang)})</option>)}
                  </select>
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">{t.depositAmount}</label>
                  <input required type="number" max={walletBalances[depositData.walletId]} value={depositData.amount} onChange={e=>setDepositData({...depositData, amount: parseFloat(e.target.value)})} className="w-full p-3 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 text-sm dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"/>
               </div>
               <div className="flex gap-4 pt-4">
                   <button type="button" onClick={()=>{setIsDepositModalOpen(false); setSelectedGoal(null)}} className="flex-1 py-3 bg-gray-100 dark:bg-white/5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition">{t.cancel}</button>
                   <button type="submit" className="flex-1 py-3 bg-green-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/30 hover:bg-green-600 transition">{t.deposit}</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal (Reused) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/10 max-h-[90vh] flex flex-col animate-pop-in">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-white/5 backdrop-blur-sm">
              <h3 className="text-xl font-black dark:text-white flex items-center gap-2"><Settings size={24} className="text-gray-700 dark:text-gray-300"/> {t.settings}</h3>
              <button onClick={()=>setIsSettingsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition"><X size={24} className="text-gray-400"/></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
              {/* Security */}
              <div className="space-y-4 p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3 mb-2"><div className="p-2 bg-orange-100 dark:bg-orange-500/20 rounded-lg text-orange-500"><Lock size={20}/></div><h4 className="font-bold dark:text-white text-lg">{t.securitySettings}</h4></div>
                <div className="flex gap-4">
                  <input type="password" maxLength={4} placeholder={t.pinPlaceholder} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className="flex-1 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-center font-mono text-lg tracking-widest dark:text-white focus:ring-2 focus:ring-orange-500 outline-none transition"/>
                  <button onClick={savePin} className="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition">{t.save}</button>
                </div>
              </div>
              {/* Notifications */}
              <div className="flex items-center justify-between p-5 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-500/10">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                      {notificationPermission === 'granted' ? <Bell size={24}/> : <BellOff size={24}/>}
                    </div>
                    <div>
                      <h4 className="font-bold dark:text-white text-lg">{t.enableNotifications}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Get alerts for budget limits</p>
                    </div>
                 </div>
                 {notificationPermission !== 'granted' && <button onClick={requestNotificationPermission} className="px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition">Enable</button>}
              </div>
              {/* Budgets */}
              <div className="space-y-5">
                 <h4 className="font-bold dark:text-white text-lg border-b pb-2 dark:border-white/10">{t.setBudget}</h4>
                 <div className="grid gap-4">
                   {CATEGORIES.expense.map(cat => (
                     <div key={cat} className="flex items-center justify-between gap-4 p-3 hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition">
                        <label className="text-sm font-bold text-gray-600 dark:text-gray-300 w-1/3">{cat}</label>
                        <input type="number" min="0" placeholder="No limit" value={budgets[cat] || ''} onChange={(e) => setBudgets({...budgets, [cat]: parseFloat(e.target.value)})} className="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl p-2.5 text-sm dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"/>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-black/10 flex justify-end">
               <button onClick={()=>setIsSettingsOpen(false)} className="px-8 py-3 bg-slate-900 dark:bg-cyber-primary text-white dark:text-black rounded-xl font-bold shadow-lg hover:scale-105 transition">{t.save}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
