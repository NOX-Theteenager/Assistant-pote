import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';

// Donut Chart - Needs vs Wants
export const NeedsWantsDonut = ({ className }: { className?: string }) => {
    const { transactions, formatPrice, statsPeriod } = useApp();

    const filteredTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        const today = new Date();
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
        return true; // Should not happen with current UI
    });
    
    const wants = filteredTransactions.filter(t => t.type === 'want' && t.is_expense).reduce((acc, t) => acc + t.amount, 0);
    const needs = filteredTransactions.filter(t => t.type === 'need' && t.is_expense).reduce((acc, t) => acc + t.amount, 0);
    
    const data = [
        { name: 'Besoins', value: needs, color: '#39ff14' },
        { name: 'Envies', value: wants, color: '#ff073a' },
    ];
    
    const total = needs + wants;
    
    if (total === 0) {
        return (
            <div className={cn("glass-card p-6 rounded-2xl text-center", className)}>
                <p className={"opacity-50"}>Pas encore de données</p>
            </div>
        );
    }
    
    return (
        <div className={cn("glass-card p-4 rounded-2xl", className)}>
            <h4 className={cn("text-xs uppercase tracking-wider font-bold mb-4", "opacity-50")}>
                Besoins vs Envies
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
                            paddingAngle={2}
                            dataKey="value"
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
                </div>
            </div>
        </div>
    );
};

// Line Chart - Balance Evolution (dynamic)
export const BalanceEvolution = ({ className }: { className?: string }) => {
    const { transactions, balance, statsPeriod, formatPrice } = useApp();
    
    const days = statsPeriod === 'weekly' ? 7 : statsPeriod === 'monthly' ? 30 : statsPeriod === 'quarterly' ? 90 : 365;
    
    // Build balance history by starting from today and working backwards
    const data = [];
    let runningBalance = balance; // Start with the current balance

    // Create a map of transactions by date for efficient lookup
    const transactionsByDate = transactions.reduce((acc, t) => {
        const date = t.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(t);
        return acc;
    }, {} as Record<string, typeof transactions>);

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Add data point for the current day *before* reverse calculating
        data.push({
            name: date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
            balance: runningBalance,
        });

        // Find transactions for this day and reverse their effect
        const dayTrans = transactionsByDate[dateStr] || [];
        const dayChange = dayTrans.reduce((acc, t) => acc + (t.is_expense ? -t.amount : t.amount), 0);

        // To find the balance of the *previous* day, we reverse today's changes
        runningBalance -= dayChange;
    }
    
    // The loop generates dates from today backwards, so we reverse the array for the chart
    data.reverse();

    const strokeColor = '#39ff14';
    
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
                    />
                    <YAxis hide />
                    <Tooltip 
                        formatter={(value) => [formatPrice(value as number), 'Solde']}
                        contentStyle={{ 
                            backgroundColor: '#1a1a1a',
                            border: 'none', 
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                    />
                    <Line 
                        type="monotone" 
                        dataKey="balance" 
                        stroke={strokeColor} 
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: strokeColor }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};
