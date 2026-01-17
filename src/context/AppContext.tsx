import React, { createContext, useContext, useState, useEffect } from 'react';
import { GeminiService } from '../services/gemini';
import { Message, Transaction } from '../components/chat/ChatInterfaces';
import { formatCurrency } from '../lib/utils';
import { RecurringIncome, checkRecurringIncomes } from '../lib/finance';
import { BankAccount, BankService } from '../services/bank';
import { useAuth } from './AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
}

type StatsPeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

interface AppState {
  balance: number;
  messages: Message[];
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  
  recurringIncomes: RecurringIncome[];
  addRecurringIncome: (income: Omit<RecurringIncome, 'id'>) => void;
  removeRecurringIncome: (id: string) => void;
  updateBalance: (newBalance: number) => void;

  // Settings
  statsPeriod: StatsPeriod;
  setStatsPeriod: (period: StatsPeriod) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  formatPrice: (amount: number) => string;
  
  isLoading: boolean;
  sendMessage: (text: string, imageBase64?: string) => Promise<void>;
  
  addSavingsGoal: (name: string, target: number) => void;
  addToSavingsGoal: (id: string, amount: number) => void;
  deleteSavingsGoal: (id: string) => void;
  
  accounts: BankAccount[];
  totalWealth: number;
  addBankAccount: (account: BankAccount) => void;

  resetData: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ""; 
const gemini = new GeminiService(API_KEY);

const DEFAULT_GOAL: SavingsGoal = { id: 'default', name: 'Voyage', target: 500, current: 0 };
const DEFAULT_BALANCE = 100.00;

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  // --- State Initialization ---
  
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('pote_balance');
    return saved ? parseFloat(saved) : DEFAULT_BALANCE;
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('pote_messages');
    if (saved) {
      return JSON.parse(saved, (key, value) => 
        key === 'timestamp' ? new Date(value) : value
      );
    }
    return [{
      id: 'welcome',
      text: "Wesh ! T'as encore dépensé ton argent n'importe comment ? Dis-moi tout.",
      sender: 'ai',
      timestamp: new Date()
    }];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('pote_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // MIGRATION: Check if old 'pote_savings' exists and migrate to 'pote_savings_goals'
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() => {
    const savedGoals = localStorage.getItem('pote_savings_goals');
    if (savedGoals) {
      return JSON.parse(savedGoals);
    }
    
    // Migration Logic
    const oldSavings = localStorage.getItem('pote_savings');
    if (oldSavings) {
      const old = JSON.parse(oldSavings);
      // Create a goal from old data
      return [{ id: 'migrated', name: old.name, target: old.target, current: old.current }];
    }

    return [DEFAULT_GOAL];
  });

  const [recurringIncomes, setRecurringIncomes] = useState<RecurringIncome[]>(() => {
    const saved = localStorage.getItem('pote_incomes');
    return saved ? JSON.parse(saved) : [];
  });
  
  // Stats Period Setting
  const [statsPeriod, setStatsPeriodState] = useState<StatsPeriod>(() => {
    return (localStorage.getItem('pote_stats_period') as StatsPeriod) || 'monthly';
  });

  const [lastLogin, setLastLogin] = useState<Date | null>(() => {
    const saved = localStorage.getItem('pote_last_login');
    return saved ? new Date(saved) : null;
  });

  const [currency, setCurrencyState] = useState(() => {
    return localStorage.getItem('pote_currency') || 'EUR';
  });

  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('pote_accounts');
    return saved ? JSON.parse(saved) : [];
  });

  // Calculate Total Wealth
  const totalWealth = React.useMemo(() => {
     // Safety check in case accounts didn't load
     if (!accounts) return balance;
     
     const accountsTotal = accounts.reduce((acc, account) => {
        const rate = BankService.getExchangeRate(account.currency, currency);
        return acc + (account.balance * rate);
     }, 0);
     return balance + accountsTotal;
  }, [balance, accounts, currency]);

  useEffect(() => localStorage.setItem('pote_accounts', JSON.stringify(accounts)), [accounts]);

  const [isLoading, setIsLoading] = useState(false);

  // --- Effects ---
  const setCurrency = (c: string) => {
    setCurrencyState(c);
    localStorage.setItem('pote_currency', c);
  };

  const formatPrice = (amount: number) => {
    return formatCurrency(amount, currency);
  };

  // --- Data Sync Effects ---

  // Save data to Firestore when state changes (if user is logged in)
  useEffect(() => {
    if (user) {
      const data = {
        balance: balance.toString(),
        messages: JSON.stringify(messages),
        transactions: JSON.stringify(transactions),
        savingsGoals: JSON.stringify(savingsGoals),
        recurringIncomes: JSON.stringify(recurringIncomes),
        currency,
        statsPeriod,
        accounts: JSON.stringify(accounts),
      };
      setDoc(doc(db, 'users', user.uid), data, { merge: true });
    }
  }, [user, balance, messages, transactions, savingsGoals, recurringIncomes, currency, statsPeriod, accounts]);

  // Load data from Firestore or migrate local data on user login
  useEffect(() => {
    const syncData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // Returning user: Load data from Firestore
          const data = userDoc.data();
          setBalance(parseFloat(data.balance || DEFAULT_BALANCE.toString()));
          setMessages(JSON.parse(data.messages || '[]'));
          setTransactions(JSON.parse(data.transactions || '[]'));
          setSavingsGoals(JSON.parse(data.savingsGoals || '[]'));
          setRecurringIncomes(JSON.parse(data.recurringIncomes || '[]'));
          setCurrencyState(data.currency || 'EUR');
          setStatsPeriodState(data.statsPeriod || 'monthly');
          setAccounts(JSON.parse(data.accounts || '[]'));
        } else {
          // First login: Migrate local data to Firestore
          const localData = {
            balance: localStorage.getItem('pote_balance') || DEFAULT_BALANCE.toString(),
            messages: localStorage.getItem('pote_messages') || '[]',
            transactions: localStorage.getItem('pote_transactions') || '[]',
            savingsGoals: localStorage.getItem('pote_savings_goals') || '[]',
            recurringIncomes: localStorage.getItem('pote_incomes') || '[]',
            currency: localStorage.getItem('pote_currency') || 'EUR',
            statsPeriod: localStorage.getItem('pote_stats_period') || 'monthly',
            accounts: localStorage.getItem('pote_accounts') || '[]',
            createdAt: new Date().toISOString(),
            email: user.email,
            displayName: user.displayName,
          };
          await setDoc(userDocRef, localData);
        }
      } else {
        // User logged out: Reset to default/local state
        setBalance(localStorage.getItem('pote_balance') ? parseFloat(localStorage.getItem('pote_balance')!) : DEFAULT_BALANCE);
        setMessages(localStorage.getItem('pote_messages') ? JSON.parse(localStorage.getItem('pote_messages')!) : []);
        setTransactions(localStorage.getItem('pote_transactions') ? JSON.parse(localStorage.getItem('pote_transactions')!) : []);
        setSavingsGoals(localStorage.getItem('pote_savings_goals') ? JSON.parse(localStorage.getItem('pote_savings_goals')!) : [DEFAULT_GOAL]);
        setRecurringIncomes(localStorage.getItem('pote_incomes') ? JSON.parse(localStorage.getItem('pote_incomes')!) : []);
        setCurrencyState(localStorage.getItem('pote_currency') || 'EUR');
        setStatsPeriodState((localStorage.getItem('pote_stats_period') as StatsPeriod) || 'monthly');
        setAccounts(localStorage.getItem('pote_accounts') ? JSON.parse(localStorage.getItem('pote_accounts')!) : []);
      }
    };
    syncData();
  }, [user]);

  // Local storage persistence (for logged-out users)
  useEffect(() => { if (!user) localStorage.setItem('pote_balance', balance.toString()) }, [balance, user]);
  useEffect(() => { if (!user) localStorage.setItem('pote_messages', JSON.stringify(messages)) }, [messages, user]);
  useEffect(() => { if (!user) localStorage.setItem('pote_transactions', JSON.stringify(transactions)) }, [transactions, user]);
  useEffect(() => { if (!user) localStorage.setItem('pote_savings_goals', JSON.stringify(savingsGoals)) }, [savingsGoals, user]);
  useEffect(() => { if (!user) localStorage.setItem('pote_incomes', JSON.stringify(recurringIncomes)) }, [recurringIncomes, user]);
  useEffect(() => { if (!user) localStorage.setItem('pote_currency', currency); }, [currency, user]);
  useEffect(() => { if (!user) localStorage.setItem('pote_stats_period', statsPeriod); }, [statsPeriod, user]);
  useEffect(() => { if (!user) localStorage.setItem('pote_accounts', JSON.stringify(accounts)); }, [accounts, user]);


  // Check Recurring Income on Mount
  useEffect(() => {
    const now = new Date();
    if (lastLogin) {
      const pendingIncomes = checkRecurringIncomes(recurringIncomes, lastLogin);
      if (pendingIncomes.length > 0) {
        let totalAdded = 0;
        pendingIncomes.forEach(inc => {
            totalAdded += inc.amount;
            const newTx: Transaction = {
                amount: inc.amount,
                category: 'Revenu Fixe',
                is_expense: false,
                date: new Date().toISOString(),
                currency: currency,
                type: 'income',
                name: inc.name
            };
            setTransactions(prev => [...prev, newTx]);
        });

        if (totalAdded > 0) {
            setBalance(prev => prev + totalAdded);
            const msg: Message = {
                id: Date.now().toString(),
                text: `🤑 Money Money ! Tes revenus fixes sont tombés (+${formatPrice(totalAdded)}). On se met bien !`,
                sender: 'ai',
                timestamp: new Date(),
                metadata: { sentiment: 'praise' }
            };
            setMessages(prev => [...prev, msg]);
        }
      }
    }
    setLastLogin(now);
    localStorage.setItem('pote_last_login', now.toISOString());
  }, []);

  // --- Actions ---

  const updateBalance = (newBalance: number) => setBalance(newBalance);

  const addRecurringIncome = (income: Omit<RecurringIncome, 'id'>) => {
    const newInc = { ...income, id: Date.now().toString() };
    setRecurringIncomes(prev => [...prev, newInc]);
  };

  const removeRecurringIncome = (id: string) => {
    setRecurringIncomes(prev => prev.filter(i => i.id !== id));
  };

  const addSavingsGoal = (name: string, target: number) => {
    const newGoal: SavingsGoal = {
        id: Date.now().toString(),
        name,
        target,
        current: 0
    };
    setSavingsGoals(prev => [...prev, newGoal]);
  };

  const addToSavingsGoal = (id: string, amount: number) => {
     if (balance >= amount) {
         setBalance(prev => prev - amount);
         setSavingsGoals(prev => prev.map(goal => 
             goal.id === id ? { ...goal, current: goal.current + amount } : goal
         ));
         
         // Find goal name for message
         const goal = savingsGoals.find(g => g.id === id);
         const goalName = goal ? goal.name : 'ta cagnotte';

         const sysMsg: Message = {
            id: Date.now().toString(),
            text: `💰 Hop, ${formatPrice(amount)} mis de côté pour ${goalName}. T'es un génie.`,
            sender: 'ai',
            timestamp: new Date(),
            metadata: { sentiment: 'praise' }
         };
         setMessages(prev => [...prev, sysMsg]);
     }
  };

  const deleteSavingsGoal = (id: string) => {
      // Return money to balance? Or just delete? safely just delete for now or ask user. 
      // User request didn't specify, generally returning money is safer but complex to explain in UI.
      // Let's assume the money is "spent" or kept in the deleted goal (lost). 
      // BETTER: Refund to balance to be nice.
      const goal = savingsGoals.find(g => g.id === id);
      if(goal && goal.current > 0) {
          setBalance(prev => prev + goal.current);
          const sysMsg: Message = {
            id: Date.now().toString(),
            text: `⚠️ Cagnotte "${goal.name}" supprimée. J'ai remis les ${formatPrice(goal.current)} sur ton compte. Ne les flambe pas tout de suite !`,
            sender: 'ai',
            timestamp: new Date(),
            metadata: { sentiment: 'warning' }
         };
         setMessages(prev => [...prev, sysMsg]);
      }
      setSavingsGoals(prev => prev.filter(g => g.id !== id));
  };

  const resetData = () => {
    localStorage.clear();
    setBalance(DEFAULT_BALANCE);
    setMessages([]);
    setTransactions([]);
    setSavingsGoals([DEFAULT_GOAL]);
    setRecurringIncomes([]);
    window.location.reload();
  };

  const sendMessage = async (text: string, imageBase64?: string) => {
    // 1. Add User Message
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
      metadata: imageBase64 ? { image: imageBase64 } : undefined
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // 2. Process with Gemini
    if (!API_KEY) {
      setTimeout(() => {
        const mockResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: "Pas de clé API détectée mon pote. Ajoute VITE_GEMINI_API_KEY dans ton .env !",
            sender: 'ai',
            timestamp: new Date(),
            metadata: { sentiment: 'warning' }
        };
        setMessages(prev => [...prev, mockResponse]);
        setIsLoading(false);
      }, 1000);
      return;
    }

    try {
      const result = await gemini.processMessage(text, balance, imageBase64, currency);
      
      // 3. Handle Transaction if present
      let finalBalance = balance;
      if (result.transaction && result.transaction.amount > 0) {
          const amount = result.transaction.amount;
          const isExpense = result.transaction.is_expense !== false;
          
          finalBalance = isExpense ? balance - amount : balance + amount;
          setBalance(parseFloat(finalBalance.toFixed(2)));

          // Add to history
          const neTx: Transaction = {
            amount,
            category: result.transaction.category,
            is_expense: isExpense,
            date: new Date().toISOString(),
            currency: result.transaction.currency || 'EUR',
            type: result.transaction.type, // Use new type from Gemini
            name: result.transaction.name || text
          };
          setTransactions(prev => [...prev, neTx]);
      }

      // 4. Add AI Response
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: result.ai_response,
        sender: 'ai',
        timestamp: new Date(),
        metadata: {
            transaction: result.transaction && result.transaction.amount > 0 ? {
                amount: result.transaction.amount,
                category: result.transaction.category,
                is_expense: result.transaction.is_expense !== false,
                date: new Date().toISOString(),
                currency: 'EUR',
                name: result.transaction.name || text
            } : undefined,
            sentiment: result.sentiment
        }
      };
      setMessages(prev => [...prev, aiMsg]);

    } catch (e) {
      console.error(e);
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: "J'ai eu un bug de cerveau. Réessaie ?",
        sender: 'ai',
        timestamp: new Date(),
        metadata: { sentiment: 'neutral' }
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppContext.Provider value={{ 
        balance, messages, transactions, savingsGoals, currency, isLoading, 
        recurringIncomes, accounts, totalWealth,
        sendMessage, addSavingsGoal, addToSavingsGoal, deleteSavingsGoal, resetData, setCurrency, formatPrice,
        addRecurringIncome, removeRecurringIncome, updateBalance, addBankAccount: (acc) => setAccounts(prev => [...prev, acc]),
        statsPeriod, setStatsPeriod: setStatsPeriodState
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
