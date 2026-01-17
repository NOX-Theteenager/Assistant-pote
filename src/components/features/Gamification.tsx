import { useApp } from '../../context/AppContext';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { Frown, Meh, Smile, PartyPopper, Skull } from 'lucide-react';

interface ShameGaugeProps {
    className?: string;
}

export const ShameGauge = ({ className }: ShameGaugeProps) => {
    const { transactions, theme } = useApp();
    const isLight = theme === 'light';
    
    // Calculate shame level based on Wants vs Needs ratio
    const wants = transactions.filter(t => t.type === 'want' && t.is_expense).reduce((acc, t) => acc + t.amount, 0);
    const needs = transactions.filter(t => t.type === 'need' && t.is_expense).reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = wants + needs;
    
    // Shame percentage (0-100): Higher = more wants = more shame
    const shamePercent = totalExpenses > 0 ? Math.round((wants / totalExpenses) * 100) : 0;
    
    // Determine mood based on shame level
    const getMoodData = () => {
        if (shamePercent >= 80) return { icon: Skull, color: 'text-red-500', bg: 'bg-red-500', label: 'Catastrophe' };
        if (shamePercent >= 60) return { icon: Frown, color: 'text-orange-500', bg: 'bg-orange-500', label: 'Pas ouf' };
        if (shamePercent >= 40) return { icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-500', label: 'Moyen' };
        if (shamePercent >= 20) return { icon: Smile, color: 'text-green-500', bg: 'bg-green-500', label: 'Bien' };
        return { icon: PartyPopper, color: 'text-neon-green', bg: 'bg-neon-green', label: 'Parfait!' };
    };
    
    const mood = getMoodData();
    const MoodIcon = mood.icon;
    
    return (
        <div className={cn("glass-card p-4 rounded-2xl", className, isLight && "bg-white/90 border-gray-200")}>
            <div className="flex items-center justify-between mb-3">
                <span className={cn("text-xs uppercase tracking-wider font-bold", isLight ? "text-gray-500" : "opacity-50")}>
                    Jauge de Honte
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
            <div className={cn("h-3 rounded-full overflow-hidden mb-2", isLight ? "bg-gray-100" : "bg-black/30")}>
                <motion.div 
                    className={cn("h-full rounded-full", mood.bg)}
                    initial={{ width: 0 }}
                    animate={{ width: `${shamePercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>
            
            <div className="flex justify-between items-center">
                <span className={cn("text-xs", mood.color)}>{mood.label}</span>
                <span className={cn("text-xs font-mono", isLight ? "text-gray-400" : "opacity-40")}>
                    {shamePercent}% envies
                </span>
            </div>
        </div>
    );
};

// Mascot Component - Reacts to shame level
export const Mascot = () => {
    const { transactions, theme } = useApp();
    const isLight = theme === 'light';
    
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
                isLight ? "bg-gray-50" : "glass-panel"
            )}
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
            <span className="text-4xl">{getEmoji()}</span>
            <p className={cn("text-sm font-medium", isLight ? "text-gray-700" : "text-white/80")}>
                {getMessage()}
            </p>
        </motion.div>
    );
};
