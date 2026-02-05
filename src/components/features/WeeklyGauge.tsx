import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';

export const WeeklyGauge = () => {
    const { transactions, monthlyBudget, formatPrice } = useApp();

    // Simple logic: Spent this week vs 1/4 of monthly budget
    const today = new Date();
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());

    const spentThisWeek = transactions
        .filter(t => t.is_expense && new Date(t.date) >= startOfWeek)
        .reduce((acc, t) => acc + t.amount, 0);

    const weeklyBudget = monthlyBudget / 4;
    const percentage = weeklyBudget > 0 ? (spentThisWeek / weeklyBudget) * 100 : 0;

    return (
        <div className="glass-card p-4 rounded-2xl">
            <div className="flex justify-between items-end mb-2">
                <h4 className="text-xs font-bold opacity-50 uppercase tracking-wider">Budget Hebdo</h4>
                <span className={cn(
                    "text-sm font-mono font-bold",
                    percentage > 100 ? "text-red-400" : "text-neon-green"
                )}>
                    {formatPrice(spentThisWeek)} / {formatPrice(weeklyBudget)}
                </span>
            </div>

            <div className="h-4 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 p-0.5">
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        percentage > 100 ? "bg-red-500 shadow-[0_0_10px_#ef4444]" :
                        percentage > 80 ? "bg-yellow-400" : "bg-neon-green shadow-[0_0_10px_#39ff14]"
                    )}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>

            {percentage > 100 && (
                <p className="text-[10px] text-red-400 mt-2 text-center animate-pulse">
                    T'as déjà tout claqué reuf...
                </p>
            )}
        </div>
    );
};
