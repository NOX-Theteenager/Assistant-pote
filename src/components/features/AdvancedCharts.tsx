import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';

// Donut Chart - Needs vs Wants
export const NeedsWantsDonut = ({ className }: { className?: string }) => {
    const { transactions, theme, formatPrice } = useApp();
    const isLight = theme === 'light';
    
    const wants = transactions.filter(t => t.type === 'want' && t.is_expense).reduce((acc, t) => acc + t.amount, 0);
    const needs = transactions.filter(t => t.type === 'need' && t.is_expense).reduce((acc, t) => acc + t.amount, 0);
    
    const data = [
        { name: 'Besoins', value: needs, color: isLight ? '#16a34a' : '#39ff14' },
        { name: 'Envies', value: wants, color: isLight ? '#dc2626' : '#ff073a' },
    ];
    
    const total = needs + wants;
    
    if (total === 0) {
        return (
            <div className={cn("glass-card p-6 rounded-2xl text-center", className, isLight && "bg-white/90")}>
                <p className={isLight ? "text-gray-500" : "opacity-50"}>Pas encore de données</p>
            </div>
        );
    }
    
    return (
        <div className={cn("glass-card p-4 rounded-2xl", className, isLight && "bg-white/90 border-gray-200")}>
            <h4 className={cn("text-xs uppercase tracking-wider font-bold mb-4", isLight ? "text-gray-500" : "opacity-50")}>
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
                                <span className={cn("text-sm", isLight ? "text-gray-700" : "text-white/80")}>{item.name}</span>
                            </div>
                            <span className="text-sm font-mono">{formatPrice(item.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Line Chart - Balance Evolution (last 7 days)
export const BalanceEvolution = ({ className }: { className?: string }) => {
    const { transactions, balance, theme, formatPrice } = useApp();
    const isLight = theme === 'light';
    
    // Build balance history for last 7 days
    const today = new Date();
    const data = [];
    let runningBalance = balance;
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Get transactions for this day
        const dayTrans = transactions.filter(t => t.date === dateStr);
        const dayChange = dayTrans.reduce((acc, t) => {
            return acc + (t.is_expense ? -t.amount : t.amount);
        }, 0);
        
        // For simplicity, we reconstruct backwards
        data.push({
            name: date.toLocaleDateString('fr-FR', { weekday: 'short' }),
            balance: runningBalance,
        });
    }
    
    const strokeColor = isLight ? '#16a34a' : '#39ff14';
    
    return (
        <div className={cn("glass-card p-4 rounded-2xl", className, isLight && "bg-white/90 border-gray-200")}>
            <h4 className={cn("text-xs uppercase tracking-wider font-bold mb-4", isLight ? "text-gray-500" : "opacity-50")}>
                Évolution du solde
            </h4>
            <ResponsiveContainer width="100%" height={150}>
                <LineChart data={data}>
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: isLight ? '#6b7280' : '#9ca3af' }}
                    />
                    <YAxis hide />
                    <Tooltip 
                        formatter={(value) => [formatPrice(value as number), 'Solde']}
                        contentStyle={{ 
                            backgroundColor: isLight ? '#fff' : '#1a1a1a', 
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
