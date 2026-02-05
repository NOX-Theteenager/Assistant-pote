import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { Frown, Meh, Smile, PartyPopper, Skull } from 'lucide-react';

interface ShameGaugeProps {
    className?: string;
}

export const ShameGauge = ({ className }: ShameGaugeProps) => {
    const { transactions, monthlyBudget } = useApp();
    
    // 1. Calculate Monthly stats for gauging
    // The prompt says: "Les information de la jauge de honte doit se faire par rapport à la gestion de cet argent hebdomadaire"
    // So we check the CURRENT WEEK status.
    
    const currentDate = new Date();
    const currentWeekNum = Math.floor((currentDate.getDate() - 1) / 7) + 1; // Simple week num matches WeeklyGauge
    const weeklyAllowance = monthlyBudget / 4;

    // Filter tx for current week
    const currentWeekSpent = transactions
        .filter(t => {
            const d = new Date(t.date);
            const isSameMonth = d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
            const weekNum = Math.floor((d.getDate() - 1) / 7) + 1;
            return isSameMonth && weekNum === currentWeekNum && t.is_expense;
        })
        .reduce((acc, t) => acc + t.amount, 0);

    // Calculate percentage used
    // If budget is 0, we can't shame properly, assume 0% or neutral
    const percentUsed = weeklyAllowance > 0 ? (currentWeekSpent / weeklyAllowance) * 100 : 0;

    // Shame calculation:
    // < 50% used: Great (0 shame)
    // 50-80% used: Okay
    // 80-100% used: Warning
    // > 100% used: SHAME (100% shame logic)
    
    let shamePercent = 0;
    if (percentUsed > 100) shamePercent = 100;
    else if (percentUsed > 80) shamePercent = 70;
    else if (percentUsed > 50) shamePercent = 30;
    else shamePercent = 0;
    
    // Determine mood based on shame level
    const getMoodData = () => {
        if (percentUsed >= 110) return { icon: Skull, color: 'text-red-500', bg: 'bg-red-500', label: 'Catastrophe' };
        if (percentUsed >= 100) return { icon: Frown, color: 'text-orange-500', bg: 'bg-orange-500', label: 'Ruiné' };
        if (percentUsed >= 80) return { icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-500', label: 'Paniak' };
        if (percentUsed >= 50) return { icon: Smile, color: 'text-green-500', bg: 'bg-green-500', label: 'Tranquille' };
        return { icon: PartyPopper, color: 'text-neon-green', bg: 'bg-neon-green', label: 'Le Boss' };
    };
    
    const mood = getMoodData();
    const MoodIcon = mood.icon;
    
    if (monthlyBudget === 0) return null; // Don't show if no budget set

    return (
        <div className={cn("glass-card p-4 rounded-2xl", className)}>
            <div className="flex items-center justify-between mb-3">
                <span className={cn("text-xs uppercase tracking-wider font-bold", "opacity-50")}>
                    Niveau de Honte
                </span>
                <motion.div
                    animate={{ 
                        rotate: shamePercent > 60 ? [0, -10, 10, -10, 0] : 0,
                        scale: shamePercent > 60 ? [1, 1.1, 1] : 1
                    }}
                    transition={{ repeat: shamePercent > 60 ? Infinity : 0, duration: 0.5 }}
                >
                    <MoodIcon className={cn("w-8 h-8", mood.color)} />
                </motion.div>
            </div>
            
            {/* Gauge Bar */}
            <div className={cn("h-3 rounded-full overflow-hidden mb-2", "bg-black/30")}>
                <motion.div 
                    className={cn("h-full rounded-full", mood.bg)}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentUsed > 100 ? 100 : percentUsed}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>
            
            <div className="flex justify-between items-center">
                <span className={cn("text-xs", mood.color)}>{mood.label}</span>
                <span className={cn("text-xs font-mono", "opacity-40")}>
                    {Math.round(percentUsed)}% budget
                </span>
            </div>
        </div>
    );
};

// Mascot Component - Reacts to shame level
export const EmojiMascot = () => {
    const { transactions } = useApp();
    
    const wants = transactions.filter(t => t.type === 'want' && t.is_expense).reduce((acc, t) => acc + t.amount, 0);
    const needs = transactions.filter(t => t.type === 'need' && t.is_expense).reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = wants + needs;
    const shamePercent = totalExpenses > 0 ? Math.round((wants / totalExpenses) * 100) : 0;
    
    // Emoji mascot based on shame
    const getEmoji = () => {
        if (shamePercent >= 80) return '💀';
        if (shamePercent >= 60) return '😬';
        if (shamePercent >= 40) return '😐';
        if (shamePercent >= 20) return '😊';
        return '🎉';
    };
    
    const getMessage = () => {
        if (shamePercent >= 80) return "Tu te moques de moi là ?!";
        if (shamePercent >= 60) return "Fais un effort...";
        if (shamePercent >= 40) return "Bof, peut mieux faire.";
        if (shamePercent >= 20) return "Pas mal du tout !";
        return "T'es un modèle !";
    };
    
    return (
        <motion.div 
            className={cn(
                "flex items-center gap-3 p-3 rounded-2xl",
                "glass-panel"
            )}
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
            <span className="text-4xl">{getEmoji()}</span>
            <p className={cn("text-sm font-medium", "text-white/80")}>
                {getMessage()}
            </p>
        </motion.div>
    );
};
