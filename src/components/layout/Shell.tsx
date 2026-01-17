import React from 'react';
import { cn } from '../../lib/utils';
import { Home, BarChart2, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';

// --- Types ---
interface LayoutProps {
  children: React.ReactNode;
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  isLight?: boolean;
}

// --- Components ---

export const BottomNav = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => {
  const { theme } = useApp();
  const isLight = theme === 'light';
  
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none flex justify-center w-full max-w-md mx-auto">
      <div className={cn(
        "rounded-2xl flex justify-between items-center px-6 py-3 w-full pointer-events-auto border-t backdrop-blur-2xl",
        isLight 
          ? "bg-white/90 border-gray-200 shadow-lg" 
          : "bg-black/40 border-white/10 glass-card"
      )}>
        <NavItem 
          icon={Home} 
          label="Journal" 
          isActive={activeTab === 'journal'} 
          onClick={() => onTabChange('journal')} 
          isLight={isLight}
        />
        <NavItem 
          icon={BarChart2} 
          label="Bulletin" 
          isActive={activeTab === 'stats'} 
          onClick={() => onTabChange('stats')} 
          isLight={isLight}
        />
        <NavItem 
          icon={User} 
          label="Profil" 
          isActive={activeTab === 'profile'} 
          onClick={() => onTabChange('profile')} 
          isLight={isLight}
        />
      </div>
    </div>
  );
};

const NavItem = ({ icon: Icon, isActive, onClick, isLight }: NavItemProps) => {
  const activeColor = isLight ? "text-green-600" : "text-neon-green";
  const inactiveColor = isLight ? "text-gray-500 hover:text-gray-800" : "text-gray-400 hover:text-white";
  const activeBg = isLight ? "bg-green-100" : "bg-neon-green/10 shadow-[0_0_15px_rgba(57,255,20,0.15)]";
  const dotColor = isLight ? "bg-green-600" : "bg-neon-green shadow-[0_0_10px_#39ff14]";
  
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 transition-all duration-300 relative",
        isActive ? activeColor : inactiveColor
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-all duration-300",
        isActive && activeBg
      )}>
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      {isActive && (
        <motion.div 
          layoutId="nav-pill"
          className={cn("absolute -bottom-2 w-1 h-1 rounded-full", dotColor)}
        />
      )}
    </button>
  );
};

// Import the WebGL background
import LightPillar from '../ui/LightPillar';

export const AppShell = ({ children }: LayoutProps) => {
  const { theme } = useApp();
  const isLight = theme === 'light';
  
  // Theme-specific colors for the pillar
  const topColor = isLight ? '#16a34a' : '#39ff14';     // Green
  const bottomColor = isLight ? '#8b5cf6' : '#a855f7';   // Purple
  
  return (
    <div className={cn(
      "relative w-full h-full max-w-md mx-auto shadow-2xl overflow-hidden sm:rounded-[3rem] sm:h-[95dvh] sm:border-[8px] border-opacity-50",
      isLight 
        ? "bg-[#faf9f7] sm:border-gray-200" 
        : "bg-black sm:border-surface"
    )}>
      {/* Animated WebGL Background */}
      <LightPillar 
        topColor={topColor}
        bottomColor={bottomColor}
        intensity={isLight ? 0.6 : 1.0}
        rotationSpeed={0.25}
        glowAmount={isLight ? 0.003 : 0.004}
        pillarWidth={3.5}
        pillarHeight={0.35}
        noiseIntensity={0.2}
        pillarRotation={0}
        mixBlendMode={isLight ? 'multiply' : 'screen'}
      />
      
      {/* Overlay for content readability */}
      <div className={cn(
        "absolute inset-0 z-[1] pointer-events-none",
        isLight 
          ? "bg-gradient-to-b from-white/70 via-[#faf9f7]/60 to-[#faf9f7]/80" 
          : "bg-gradient-to-b from-black/40 via-transparent to-black/60"
      )} />

      {/* Content */}
      <main className="relative z-10 h-full flex flex-col">
        {children}
      </main>
    </div>
  );
};
