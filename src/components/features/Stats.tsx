import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { Award, TrendingUp, TrendingDown } from 'lucide-react';
import { ShameGauge, Mascot } from './Gamification';
import { NeedsWantsDonut, BalanceEvolution } from './AdvancedCharts';

export const StatsView = () => {
  const { transactions, balance, formatPrice, theme } = useApp();

  // 1. Calculate Stats
  const hasIncome = transactions.some(t => t.type === 'income' || t.is_expense === false);
  
  const totalExpenses = transactions
      .filter(t => t.is_expense)
      .reduce((acc, t) => acc + t.amount, 0);

  const totalIncome = transactions
      .filter(t => !t.is_expense)
      .reduce((acc, t) => acc + t.amount, 0);

  // 2. Grade
  const calculateGrade = () => {
    // Simple heuristic: Balance > 20% of income => A
    if (balance < 0) return { grade: 'F', comment: "Catastrophique. T'es fauché.", color: "text-neon-red" };
    if (balance < 50) return { grade: 'D', comment: "Limite limite. Fais gaffe.", color: "text-orange-500" };
    
    // If we have income info, do meaningful ratio
    if (totalIncome > 0) {
        const ratio = balance / totalIncome;
        if (ratio > 0.3) return { grade: 'A', comment: "Le Roi du Pétrole.", color: "text-neon-green" };
        if (ratio > 0.1) return { grade: 'B', comment: "Ça gère.", color: "text-neon-blue" };
        return { grade: 'C', comment: "Attention à la fin de mois.", color: "text-yellow-400" };
    }

    return { grade: 'B', comment: "Pas mal, pas mal.", color: "text-neon-blue" };
  };

  const { grade, comment, color } = calculateGrade();

  // 3. Battle: Useful (Need) vs Futile (Want)
  // Legacy Fallback: If no type, use old category list
  const usefulLegacy = ['food', 'bills', 'transport', 'loyer', 'courses', 'facture', 'pharmacie'];
  
  const needTotal = transactions
    .filter(t => t.is_expense) // Only expenses
    .filter(t => {
        if (t.type) return t.type === 'need';
        return usefulLegacy.some(c => t.category.toLowerCase().includes(c));
    })
    .reduce((acc, t) => acc + t.amount, 0);

  const wantTotal = transactions
    .filter(t => t.is_expense)
    .filter(t => {
        if (t.type) return t.type === 'want';
        if (usefulLegacy.some(c => t.category.toLowerCase().includes(c))) return false;
        return true; 
    })
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExp = needTotal + wantTotal || 1; 

  return (
    <div className={cn("p-6 h-full overflow-y-auto pb-24", theme === 'light' ? 'text-gray-800' : 'text-white')}>
       <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Award className="text-neon-blue" />
        Bulletin Hebdo
      </h2>

      {/* The Report Card */}
      <div className="glass-card p-6 rounded-3xl text-center mb-6 border-t border-white/10 relative overflow-hidden">
        <div className={cn("text-8xl font-black mb-2 drop-shadow-[0_0_25px_rgba(0,0,0,0.5)]", color)}>
          {grade}
        </div>
        <p className="text-xl font-bold mb-1">{comment}</p>
        <p className="opacity-40 text-sm">Basé sur ta santé financière</p>
      </div>

      {/* NEW: Mascot & Shame Gauge */}
      <div className="grid grid-cols-2 gap-4 mb-6">
          <ShameGauge />
          <Mascot />
      </div>
      
      {/* NEW: Advanced Charts */}
      <div className="grid grid-cols-1 gap-4 mb-8">
          <NeedsWantsDonut />
          <BalanceEvolution />
      </div>

      {/* Income vs Expense Summary */}
      <div className="flex gap-4 mb-8">
          <div className="flex-1 glass-panel p-4 rounded-xl flex flex-col items-center">
             <div className="flex items-center gap-2 text-green-400 mb-1">
                 <TrendingUp size={16} /> Entrées
             </div>
             <span className="text-lg font-bold font-mono">{formatPrice(totalIncome)}</span>
          </div>
          <div className="flex-1 glass-panel p-4 rounded-xl flex flex-col items-center">
             <div className="flex items-center gap-2 text-red-400 mb-1">
                 <TrendingDown size={16} /> Sorties
             </div>
             <span className="text-lg font-bold font-mono">{formatPrice(totalExpenses)}</span>
          </div>
      </div>

      {/* Battle Bar */}
      <div className="mb-8">
        <h3 className="font-bold mb-4 flex justify-between">
            <span>⚔️ Le Duel</span>
            <span className="text-xs opacity-40 font-normal">Besoin vs Envie</span>
        </h3>
        
        <div className="h-6 w-full flex rounded-full overflow-hidden bg-black/10 dark:bg-black/50">
           <div style={{ width: `${(needTotal / totalExp) * 100}%` }} className="h-full bg-neon-blue transition-all" />
           <div style={{ width: `${(wantTotal / totalExp) * 100}%` }} className="h-full bg-neon-red transition-all" />
        </div>
        
        <div className="flex justify-between mt-2 text-sm font-mono">
            <span className="text-neon-blue">{formatPrice(needTotal)} (Besoin)</span>
            <span className="text-neon-red">{formatPrice(wantTotal)} (Envie)</span>
        </div>
      </div>

      {/* Recent History */}
      <div>
        <h3 className="font-bold mb-4">Derniers Mouvements</h3>
        <div className="space-y-3">
            {transactions.slice(-5).reverse().map((t, i) => (
                <div key={i} className="flex justify-between items-center p-3 glass-panel rounded-xl">
                    <div className="flex flex-col">
                        <span className="font-medium capitalize">{t.category}</span>
                        <span className="text-xs opacity-40">{new Date(t.date).toLocaleDateString()}</span>
                    </div>
                    <span className={cn("font-mono font-bold", !t.is_expense ? "text-neon-green" : t.type === 'want' ? "text-neon-red" : "text-orange-400")}>
                        {!t.is_expense ? '+' : '-'}{formatPrice(t.amount)}
                    </span>
                </div>
            ))}
            {transactions.length === 0 && (
                <p className="opacity-30 text-center text-sm py-4">Rien à signaler chef.</p>
            )}
        </div>
      </div>
    </div>
  );
};
