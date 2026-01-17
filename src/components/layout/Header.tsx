import { cn, formatCurrency } from '../../lib/utils';
import { AlertTriangle } from 'lucide-react';

import { useApp } from '../../context/AppContext';

export const Header = () => {
  const { balance, currency } = useApp();
  
  // Determine status color based on balance
  let statusColor = "text-neon-green";
  let StatusIcon = null;

  if (balance < 50 && balance > 0) {
    statusColor = "text-orange-400";
  } else if (balance <= 0) {
    statusColor = "text-neon-red";
    StatusIcon = AlertTriangle;
  }

  // Text shadows
  const getTextShadow = () => {
    return balance <= 0 
      ? '0 0 20px rgba(255, 7, 58, 0.5)' 
      : balance < 50 
        ? '0 0 20px rgba(255, 153, 0, 0.4)' 
        : '0 0 20px rgba(57, 255, 20, 0.4)';
  };

  return (
    <header className={cn(
      "flex flex-col items-center justify-center py-6 px-4 z-20 relative"
    )}>
      <span className={cn(
        "text-xs font-medium uppercase tracking-widest mb-1",
        "opacity-40"
      )}>Reste à vivre</span>
      
      <div className={cn(
        "relative flex items-center justify-center transition-colors duration-500",
        statusColor
      )}>
        {StatusIcon && (
          <StatusIcon className="absolute -left-8 w-6 h-6 animate-pulse" />
        )}
        
        <h1 
          className="text-5xl font-bold tracking-tighter"
          style={{ textShadow: getTextShadow() }}
        >
          {formatCurrency(balance, currency)}
        </h1>
      </div>
      
      <div className={cn(
        "mt-2 text-xs text-center font-mono",
        "opacity-40"
      )}>
        {balance <= 0 ? "T'es dans la merde." : "Ça va, tu gères."}
      </div>
    </header>
  );
};
