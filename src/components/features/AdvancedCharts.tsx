import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';

// Donut Chart - Expenses vs Savings
export const ExpensesSavingsDonut = ({ className }: { className?: string }) => {
    const { transactions, formatPrice, statsPeriod } = useApp();

    const filteredTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Strictly current month as per "month" requirement in prompt, 
        // OR respect the global statsPeriod if the user toggled it.
        // The prompt says "difference on the MONTH". So let's force Monthly for this specific chart 
        // or respect the global selector if it makes sense. 
        // Let's stick to the filtered logic from context (which respects statsPeriod) 
        // BUT the prompt specifically mentioned "sur le mois".
        // Use Global Filter for consistency, assuming user selected 'Monthly'.
        
        if (statsPeriod === 'weekly') {
          const oneWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
          return date > oneWeekAgo;
        }
        if (statsPeriod === 'monthly') {
          const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          return date > oneMonthAgo;
        }
        if (statsPeriod === 'quarterly') {
            const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
            return date > threeMonthsAgo;
        }
        if (statsPeriod === 'yearly') {
          const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
          return date > oneYearAgo;
        }
        return true; 
    });
    
    const totalExpenses = filteredTransactions.filter(t => t.is_expense).reduce((acc, t) => acc + t.amount, 0);
    const totalIncome = filteredTransactions.filter(t => !t.is_expense).reduce((acc, t) => acc + t.amount, 0);
    
    // Savings = Income - Expenses
    // If Expenses > Income, Savings = 0 (and we might want to show Deficit? Donut doesn't handle negative well)
    const rawSavings = totalIncome - totalExpenses;
    const savings = Math.max(0, rawSavings);
    
    // If deficit, we could show it as a separate slice or just show 100% expenses.
    // Let's keep it simple: Expenses vs Savings.
    
    const data = [
        { name: 'Dépenses', value: totalExpenses, color: '#ff073a' }, // Neon Red
        { name: 'Épargne', value: savings, color: '#39ff14' },       // Neon Green
    ];
    
    const total = totalExpenses + savings;
    
    return (
        <div className={cn("glass-card p-4 rounded-2xl", className)}>
            <h4 className={cn("text-xs uppercase tracking-wider font-bold mb-4", "opacity-50")}>
                Dépenses vs Épargne
            </h4>
            <div className="flex items-center gap-4">
                <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                    {data.map((item) => (
                        <div key={item.name} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className={cn("text-sm", "text-white/80")}>{item.name}</span>
                            </div>
                            <span className="text-sm font-mono">{formatPrice(item.value)}</span>
                        </div>
                    ))}
                    {/* Bonus: Show deficit text if savings is 0 and we have expenses > income */}
                    {rawSavings < 0 && (
                        <div className="text-xs text-red-400 mt-2 text-right">
                           Déficit: {formatPrice(Math.abs(rawSavings))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Line Chart - Balance Evolution (dynamic)
export const BalanceEvolution = ({ className }: { className?: string }) => {
    const { transactions, balance, statsPeriod, formatPrice } = useApp();
    
    // Prompt says: "montrer les differentes fluctuation du solde durant le mois"
    // We stick to the statsPeriod logic but ensure it's detailed.
    const days = statsPeriod === 'weekly' ? 7 : statsPeriod === 'monthly' ? 30 : statsPeriod === 'quarterly' ? 90 : 365;
    
    // Build balance history by starting from today and working backwards
    const data = [];
    let runningBalance = balance; // Start with the current balance

    // Create a map of transactions by date for efficient lookup
    // Normalize date to YYYY-MM-DD
    const transactionsByDate = transactions.reduce((acc, t) => {
        const dateStr = new Date(t.date).toISOString().split('T')[0];
        if (!acc[dateStr]) {
            acc[dateStr] = [];
        }
        acc[dateStr].push(t);
        return acc;
    }, {} as Record<string, typeof transactions>);

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Add data point for the current day
        // Visualization: We want the End-of-Day balance.
        data.push({
            name: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
            balance: runningBalance,
        });

        // To go back in time, we REVERSE the transaction effect.
        // If today I spent 10, yesterday I had 10 more.
        const dayTrans = transactionsByDate[dateStr] || [];
        const dayChange = dayTrans.reduce((acc, t) => {
            // Expense reduces balance, so to go back, we ADD it.
            // Income increases balance, so to go back, we SUBTRACT it.
            return acc + (t.is_expense ? -t.amount : t.amount);
        }, 0);

        runningBalance -= dayChange;
    }
    
    data.reverse();

    return (
        <div className={cn("glass-card p-4 rounded-2xl", className)}>
            <h4 className={cn("text-xs uppercase tracking-wider font-bold mb-4", "opacity-50")}>
                Évolution du solde
            </h4>
            <ResponsiveContainer width="100%" height={150}>
                <LineChart data={data}>
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        interval={Math.floor(days / 5)} 
                    />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                        formatter={(value) => [formatPrice(value as number), 'Solde']}
                        contentStyle={{ 
                            backgroundColor: '#1a1a1a',
                            border: '1px solid rgba(255,255,255,0.1)', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            color: '#fff'
                        }}
                        itemStyle={{ color: '#39ff14' }}
                        labelStyle={{ color: '#9ca3af', marginBottom: '0.5rem' }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke="#39ff14" 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "#39ff14", stroke: "#fff" }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
