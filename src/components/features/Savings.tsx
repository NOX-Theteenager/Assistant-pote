import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { PiggyBank, Briefcase, Settings, Plus, Trash2, Sun, Moon, Edit3, Coins, X, ChevronDown, Check, Wallet, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BankConnectModal } from './BankConnectModal';
import { BankService } from '../../services/bank';
import { useAuth } from '../../context/AuthContext';

export const SettingsView = () => {
  const { 
    balance, updateBalance, 
    savingsGoals, addSavingsGoal, addToSavingsGoal, deleteSavingsGoal,
    recurringIncomes, addRecurringIncome, removeRecurringIncome,
    accounts, totalWealth,
    theme, toggleTheme, currency, setCurrency, formatPrice, resetData 
  } = useApp();
  const { user, login, logout } = useAuth();

  // Local state for UI
  const [showIncomes, setShowIncomes] = useState(false);
  const [editingBalance, setEditingBalance] = useState(false);
  const [tempBalance, setTempBalance] = useState('');
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);
  
  // Modals
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [goalTarget, setGoalTarget] = useState('');

  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [addMoneyAmount, setAddMoneyAmount] = useState('');

  const [newIncomeName, setNewIncomeName] = useState('');
  const [newIncomeAmount, setNewIncomeAmount] = useState('');
  const [newIncomeDay, setNewIncomeDay] = useState('1');

  // --- Handlers ---
  const handleBalanceUpdate = () => {
    const val = parseFloat(tempBalance);
    if (!isNaN(val)) {
        updateBalance(val);
        setEditingBalance(false);
    }
  };

  const handleAddGoal = (e: React.FormEvent) => {
      e.preventDefault();
      if(goalName && goalTarget) {
          addSavingsGoal(goalName, parseFloat(goalTarget));
          setGoalName('');
          setGoalTarget('');
          setIsAddGoalOpen(false);
      }
  };

  const handleAddMoneyToGoal = (e: React.FormEvent) => {
      e.preventDefault();
      if(activeGoalId && addMoneyAmount) {
          addToSavingsGoal(activeGoalId, parseFloat(addMoneyAmount));
          setAddMoneyAmount('');
          setActiveGoalId(null);
      }
  };

  const handleAddIncome = () => {
      if (newIncomeName && newIncomeAmount) {
          addRecurringIncome({
              name: newIncomeName,
              amount: parseFloat(newIncomeAmount),
              dayOfMonth: parseInt(newIncomeDay)
          });
          setNewIncomeName('');
          setNewIncomeAmount('');
      }
  };

  // Limit incomes to 3 if not expanded
  const visibleIncomes = showIncomes ? recurringIncomes : recurringIncomes.slice(0, 3);

  return (
    <div className={cn("p-6 h-full overflow-y-auto pb-24", theme === 'light' ? 'text-gray-800' : 'text-white')}>
      
      {/* Header Profile */}
      <div className="flex justify-between items-start mb-8">
        <div>
            {/* <h2 className="text-3xl font-bold flex items-center gap-2">
                <Settings className={theme === 'light' ? "text-gray-600" : "text-white"} />
                Profil
            </h2> */}
             {user ? (
                 <div className="flex items-center gap-2 mt-2">
                    {user.photoURL && <img src={user.photoURL} className="w-6 h-6 rounded-full" alt="User" />}
                    <p className="text-sm opacity-50">Connecté en tant que {user.displayName}</p>
                    <button onClick={logout} className="text-xs text-red-400 hover:text-red-300 underline ml-2">Déconnexion</button>
                 </div>
             ) : (
                <div className="mt-2">
                    <p className={cn("text-sm mb-2", theme === 'light' ? "text-gray-500" : "opacity-50")}>Gère ton empire (ou tes dettes).</p>
                    <button 
                        onClick={login}
                        className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors"
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" />
                        Sauvegarder mes données
                    </button>
                </div>
             )}
        </div>
        <div className="flex gap-2">
            <button 
                onClick={toggleTheme}
                className="p-3 rounded-full glass-card hover:scale-105 transition-transform"
            >
                {theme === 'light' ? <Moon size={20} className="text-gray-800" /> : <Sun size={20} className="text-yellow-400" />}
            </button>
            <div className="relative group">
                <button className="p-3 rounded-full glass-card hover:scale-105 transition-transform text-neon-blue font-bold text-xs flex items-center justify-center w-12 h-12">
                    {currency}
                </button>
                <div className="absolute right-0 top-12 glass-card rounded-xl p-2 hidden group-hover:flex flex-col gap-1 z-50 min-w-[80px]">
                    {['EUR', 'USD', 'XAF', 'CAD', 'JPY'].map(c => (
                        <button key={c} onClick={() => setCurrency(c)} className="p-2 hover:bg-white/10 rounded-lg text-left text-sm font-bold">
                            {c}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* WEALTH CARD (New) */}
      <div className="glass-card p-6 rounded-3xl mb-8 relative border-t border-white/10 overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet size={120} />
          </div>
          
          <div className="relative z-10">
              <h3 className="flex items-center gap-2 font-bold mb-1 text-neon-green opacity-80 uppercase tracking-widest text-xs">
                  Patrimoine Total
              </h3>
              <div className="text-5xl font-black tracking-tighter mb-6">
                  {formatPrice(totalWealth)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                    onClick={() => setIsBankModalOpen(true)}
                    className="p-3 rounded-xl bg-neon-blue/20 text-neon-blue hover:bg-neon-blue hover:text-white transition-colors flex flex-col items-center gap-2 font-bold text-xs"
                 >
                     <Plus size={20} />
                     Lier un compte
                 </button>
                 <button 
                    onClick={() => setShowAccounts(!showAccounts)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center gap-2 font-bold text-xs"
                 >
                     <Landmark size={20} />
                     {showAccounts ? 'Masquer comptes' : 'Mes comptes'}
                 </button>
              </div>
          </div>
      </div>

      {/* Linked Accounts List */}
      <AnimatePresence>
          {showAccounts && (
            <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: 'auto', opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }}
                className="mb-8 overflow-hidden"
            >
                <h4 className="font-bold mb-3 text-sm opacity-50 uppercase">Comptes connectés</h4>
                
                {/* Manual Pote Wallet */}
                <div className="flex justify-between items-center p-4 glass-panel rounded-2xl mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neon-green/20 flex items-center justify-center text-neon-green">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <p className="font-bold">Portefeuille "Reste à vivre"</p>
                            <p className="text-xs opacity-50">Manuel</p>
                        </div>
                    </div>
                    {editingBalance ? (
                       <div className="flex items-center gap-2">
                           <input 
                               type="number" 
                               value={tempBalance}
                               onChange={(e) => setTempBalance(e.target.value)}
                               className="bg-transparent border-b border-white/20 w-20 text-right outline-none"
                               placeholder={balance.toString()}
                           />
                           <button onClick={handleBalanceUpdate}><Check size={16} className="text-neon-green"/></button>
                       </div>
                    ) : (
                       <div className="flex items-center gap-2">
                           <span className="font-mono">{formatPrice(balance)}</span>
                           <button onClick={() => { setTempBalance(balance.toString()); setEditingBalance(true); }} className="opacity-50 hover:opacity-100">
                               <Edit3 size={14} />
                           </button>
                       </div>
                    )}
                </div>

                {/* Connected Lists */}
                {accounts.map(acc => (
                    <div key={acc.id} className="flex justify-between items-center p-4 glass-panel rounded-2xl mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                <Building2 size={20} />
                            </div>
                            <div>
                                <p className="font-bold">{acc.name}</p>
                                <p className="text-xs opacity-50 uppercase">{acc.provider}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-mono">{acc.balance} {acc.currency}</p>
                            {acc.currency !== currency && (
                                <p className="text-[10px] opacity-40">~{formatPrice(acc.balance * BankService.getExchangeRate(acc.currency, currency))}</p>
                            )}
                        </div>
                    </div>
                ))}

                {accounts.length === 0 && (
                    <div className="text-center p-4 opacity-50 text-xs">
                        Aucun compte bancaire lié pour le moment.
                    </div>
                )}
            </motion.div>
          )}
      </AnimatePresence>

      <BankConnectModal isOpen={isBankModalOpen} onClose={() => setIsBankModalOpen(false)} />


      {/* Savings Goals */}
      <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold flex items-center gap-2">
                   <PiggyBank className="text-neon-purple" />
                   Coffres
               </h3>
               <button onClick={() => setIsAddGoalOpen(true)} className="text-xs bg-neon-purple/20 text-neon-purple px-3 py-1 rounded-full hover:bg-neon-purple hover:text-white transition-colors">
                   + Nouveau
               </button>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
              {savingsGoals.map(goal => (
                  <motion.div 
                    layout
                    key={goal.id} 
                    className="glass-panel p-4 rounded-2xl relative group cursor-pointer hover:border-neon-purple/50 transition-colors"
                    onClick={() => setActiveGoalId(goal.id)}
                  >
                        <div className="flex justify-between items-end mb-2">
                            <span className="font-bold capitalize">{goal.name}</span>
                            <span className="text-xs opacity-50">{Math.round((goal.current / goal.target) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden mb-2">
                            <div 
                                className="h-full bg-neon-purple transition-all duration-500" 
                                style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs font-mono opacity-60">
                            <span>{formatPrice(goal.current)}</span>
                            <span>{formatPrice(goal.target)}</span>
                        </div>
                        
                        <button 
                            onClick={(e) => { e.stopPropagation(); deleteSavingsGoal(goal.id); }}
                            className="absolute top-2 right-2 p-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={14} />
                        </button>
                  </motion.div>
              ))}
          </div>
      </div>

      {/* Recurring Incomes */}
      <div className="mb-8">
          <h3 className="font-bold mb-4 flex items-center gap-2">
              <Briefcase className="text-neon-green" />
              Revenus Fixes
          </h3>
          
          <div className="glass-panel p-4 rounded-2xl mb-4">
             <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 items-end">
                 <div className="flex flex-col gap-1">
                     <label className="text-[10px] uppercase tracking-wider opacity-50">Nom</label>
                     <input 
                        className="bg-transparent border-b border-white/10 focus:border-neon-green outline-none text-sm py-1" 
                        placeholder="Ex: Salaire"
                        value={newIncomeName}
                        onChange={e => setNewIncomeName(e.target.value)}
                     />
                 </div>
                 <div className="flex flex-col gap-1 w-20">
                     <label className="text-[10px] uppercase tracking-wider opacity-50">Jour</label>
                     <select 
                        className={cn("bg-transparent border-b border-white/10 text-sm py-1 outline-none", theme === 'light' && "bg-white/50")}
                        value={newIncomeDay}
                        onChange={e => setNewIncomeDay(e.target.value)}
                     >
                         {[...Array(31)].map((_, i) => (
                             <option key={i+1} value={i+1} className="text-black">{i+1}</option>
                         ))}
                     </select>
                 </div>
                 <div className="flex flex-col gap-1 w-24">
                     <label className="text-[10px] uppercase tracking-wider opacity-50">Montant</label>
                     <input 
                        type="number"
                        className="bg-transparent border-b border-white/10 focus:border-neon-green outline-none text-sm py-1" 
                        placeholder="0"
                        value={newIncomeAmount}
                        onChange={e => setNewIncomeAmount(e.target.value)}
                     />
                 </div>
                 <button 
                    onClick={handleAddIncome}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-neon-green/20 text-neon-green hover:bg-neon-green hover:text-black mb-1"
                 >
                     <Plus size={16} />
                 </button>
             </div>
          </div>

          <div className="space-y-2">
              {visibleIncomes.map((inc) => (
                  <div key={inc.id} className="flex justify-between items-center p-3 glass-panel rounded-xl border-l-2 border-neon-green">
                      <div>
                          <p className="font-bold text-sm">{inc.name}</p>
                          <p className="text-xs opacity-50">Le {inc.dayOfMonth} du mois</p>
                      </div>
                      <div className="flex items-center gap-3">
                          <span className="font-mono text-neon-green">+{formatPrice(inc.amount)}</span>
                          <button onClick={() => removeRecurringIncome(inc.id)} className="text-red-500 opacity-50 hover:opacity-100">
                              <Trash2 size={14} />
                          </button>
                      </div>
                  </div>
              ))}
          </div>

          {recurringIncomes.length > 3 && (
              <button 
                onClick={() => setShowIncomes(!showIncomes)}
                className="w-full text-center text-xs opacity-50 hover:opacity-100 mt-2 flex items-center justify-center gap-1"
              >
                  {showIncomes ? 'Voir moins' : `Voir plus (${recurringIncomes.length - 3} autres)`} <ChevronDown className={cn("transition-transform", showIncomes && "rotate-180")} size={12} />
              </button>
          )}
      </div>

      {/* Danger Zone */}
      <div className="mt-12 text-center">
          <button 
            onClick={() => { if(confirm('Sûr ? Tout sera effacé.')) resetData(); }}
            className="text-xs text-red-500 opacity-50 hover:opacity-100 underline"
          >
              Réinitialiser toutes les données
          </button>
      </div>

      {/* MODAL: New Goal */}
      <AnimatePresence>
          {isAddGoalOpen && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              >
                  <div className={cn("w-full max-w-xs p-6 rounded-3xl relative", theme === 'light' ? "bg-white" : "bg-gray-900 border border-white/10")}>
                      <button onClick={() => setIsAddGoalOpen(false)} className="absolute top-4 right-4 opacity-50"><X size={20} /></button>
                      <h3 className="text-xl font-bold mb-4">Nouveau Coffre</h3>
                      <form onSubmit={handleAddGoal} className="space-y-4">
                          <div>
                              <label className="text-xs opacity-50 uppercase">Nom du projet</label>
                              <input 
                                className={cn("w-full bg-transparent border-b py-2 outline-none font-bold", theme === 'light' ? "border-black/10" : "border-white/10")}
                                placeholder="PS5, Voyage, ..."
                                value={goalName}
                                onChange={e => setGoalName(e.target.value)}
                                autoFocus
                              />
                          </div>
                          <div>
                              <label className="text-xs opacity-50 uppercase">Objectif ({currency})</label>
                              <input 
                                type="number"
                                className={cn("w-full bg-transparent border-b py-2 outline-none font-bold font-mono", theme === 'light' ? "border-black/10" : "border-white/10")}
                                placeholder="500"
                                value={goalTarget}
                                onChange={e => setGoalTarget(e.target.value)}
                              />
                          </div>
                          <button type="submit" className="w-full py-3 bg-neon-purple text-white font-bold rounded-xl mt-4">
                              Créer
                          </button>
                      </form>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      {/* MODAL: Add Money to Goal */}
      <AnimatePresence>
          {activeGoalId && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              >
                  <div className={cn("w-full max-w-xs p-6 rounded-3xl relative", theme === 'light' ? "bg-white" : "bg-gray-900 border border-white/10")}>
                      <button onClick={() => setActiveGoalId(null)} className="absolute top-4 right-4 opacity-50"><X size={20} /></button>
                      <h3 className="text-xl font-bold mb-1">Remplir le coffre</h3>
                      <p className="text-sm opacity-50 mb-6">Combien tu mets de côté ?</p>
                      
                      <form onSubmit={handleAddMoneyToGoal} className="space-y-4">
                          <div className="relative">
                              <span className="absolute left-0 top-2 font-bold opacity-30">{currency}</span>
                              <input 
                                type="number" 
                                className={cn("w-full bg-transparent border-b py-2 pl-12 outline-none font-bold font-mono text-3xl", theme === 'light' ? "border-black/10" : "border-white/10")}
                                placeholder="0"
                                value={addMoneyAmount}
                                onChange={e => setAddMoneyAmount(e.target.value)}
                                autoFocus
                              />
                          </div>
                          <p className="text-xs text-center opacity-50">
                              Solde dispo: {balance} {currency}
                          </p>
                          <button 
                            type="submit" 
                            disabled={parseFloat(addMoneyAmount) > balance}
                            className={cn("w-full py-3 text-white font-bold rounded-xl mt-4 transition-colors", parseFloat(addMoneyAmount) > balance ? "bg-gray-500 cursor-not-allowed" : "bg-neon-green text-black")}
                          >
                              Ajouter
                          </button>
                      </form>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

    </div>
  );
};
