import { useRef } from 'react';
import { useApp } from '../../context/AppContext'; 
import { cn } from '../../lib/utils';
import { Award, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { ShameGauge } from './Gamification';
import { Mascot } from '../mascot/MascotScene';
import { ExpensesSavingsDonut, BalanceEvolution } from './AdvancedCharts';
import { WeeklyGauge } from './WeeklyGauge';
import html2canvas from 'html2canvas'; 
import jsPDF from 'jspdf';

export const StatsView = () => {
    const { transactions, balance, formatPrice, statsPeriod } = useApp();
    const statsRef = useRef<HTMLDivElement>(null);

    // 1. Filtrer les transactions selon la période choisie (statsPeriod)
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
      return true;
    });
  
    // 2. Calcul des totaux
    const totalExpenses = filteredTransactions
        .filter(t => t.is_expense)
        .reduce((acc, t) => acc + t.amount, 0);
  
    const totalIncome = filteredTransactions
        .filter(t => !t.is_expense)
        .reduce((acc, t) => acc + t.amount, 0);
  
    // 3. Calcul de la Note (Grade)
    const calculateGrade = () => {
      if (balance < 0) return { grade: 'F', comment: "Catastrophique. T'es fauché.", color: "text-neon-red" };
      if (balance < 50) return { grade: 'D', comment: "Limite limite. Fais gaffe.", color: "text-orange-500" };
      
      if (totalIncome > 0) {
          const ratio = balance / totalIncome;
          if (ratio > 0.3) return { grade: 'A', comment: "Le Roi du Pétrole.", color: "text-neon-green" };
          if (ratio > 0.1) return { grade: 'B', comment: "Ça gère.", color: "text-neon-blue" };
          return { grade: 'C', comment: "Attention à la fin de mois.", color: "text-yellow-400" };
      }
  
      return { grade: 'B', comment: "Pas mal, pas mal.", color: "text-neon-blue" };
    };
  
    const { grade, comment, color } = calculateGrade();

    // 4. Derniers Mouvements (Top 3)
    const recentMovements = filteredTransactions
        .filter(t => t.is_expense)
        .slice(-3)
        .reverse()
        .map(t => {
            let displayName = t.name;
            if (displayName.length > 30) {
                displayName = displayName.substring(0, 27) + "...";
            }
            return {
                ...t,
                displayName
            };
        });

    // 5. Fonction d'Export PDF (CORRIGÉE)
    const handleDownloadPDF = async () => {
        if (!statsRef.current) return;
        
        try {
            const element = statsRef.current;
            
            const canvas = await html2canvas(element, {
                backgroundColor: '#000000',
                scale: 2, 
                useCORS: true,
                logging: false
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            
            // Correction ici : On extrait la date dans une variable pour éviter l'erreur de syntaxe
            const dateLabel = new Date().toISOString().split('T')[0];
            pdf.save(`rapport_pote_${dateLabel}.pdf`);

        } catch (error) {
            console.error("PDF Export failed", error);
            alert("Oups, l'export PDF a échoué. Vérifie la console.");
        }
    };

    // Helper pour l'humeur de la mascotte
    const getMascotMood = () => {
        if (grade === 'A' || grade === 'B') return 'happy';
        if (grade === 'F') return 'sad';
        return 'neutral';
    };
  
    return (
      <div className={cn("p-6 h-full overflow-y-auto pb-24", 'text-white')} ref={statsRef}>
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <Award className="text-neon-blue" />
                Bulletin
            </h2>
            <button 
                onClick={handleDownloadPDF}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                title="Télécharger le rapport"
            >
                <Download size={20} />
            </button>
         </div>
  
        {/* Le Bulletin de Notes */}
        <div className="glass-card p-6 rounded-3xl text-center mb-6 border-t border-white/10 relative overflow-hidden">
          <div className={cn("text-8xl font-black mb-2 drop-shadow-[0_0_25px_rgba(0,0,0,0.5)]", color)}>
            {grade}
          </div>
          <p className="text-xl font-bold mb-1">{comment}</p>
          <p className="opacity-40 text-sm">Basé sur ta santé financière</p>
        </div>
        
        {/* Jauge Hebdomadaire */}
        <div className="mb-6">
            <WeeklyGauge />
        </div>
  
        {/* Grille Gamification & Mascotte */}
        <div className="grid grid-cols-2 gap-4 mb-6 relative">
            <ShameGauge />
            <div className="glass-card p-4 rounded-2xl relative overflow-hidden min-h-[150px]">
                 <Mascot mood={getMascotMood()} scale={1.2} />
            </div>
        </div>
        
        {/* Graphiques */}
        <div className="grid grid-cols-1 gap-4 mb-8">
            <ExpensesSavingsDonut />
            <BalanceEvolution />
        </div>
  
        {/* Résumé Entrées / Sorties */}
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
  
        {/* Historique Récent */}
        <div>
          <h3 className="font-bold mb-4">Derniers Mouvements (Top 3)</h3>
          <div className="space-y-3">
              {recentMovements.map((t, i) => (
                  <div key={i} className="flex justify-between items-center p-3 glass-panel rounded-xl">
                      <div className="flex flex-col">
                          <span className="font-medium capitalize">{t.displayName}</span>
                          <span className="text-xs opacity-40">{new Date(t.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex flex-col items-end">
                          <span className={cn("font-mono font-bold font-lg", !t.is_expense ? "text-neon-green" : "text-red-400")}>
                               {!t.is_expense ? '+' : '-'}{formatPrice(t.amount)}
                          </span>
                           <span className="text-[10px] uppercase opacity-50 bg-white/5 px-2 py-0.5 rounded-full mt-1">
                              {t.category}
                           </span>
                      </div>
                  </div>
              ))}
              {filteredTransactions.filter(t=>t.is_expense).length === 0 && (
                  <p className="opacity-30 text-center text-sm py-4">Aucune dépense récente.</p>
              )}
          </div>
        </div>
      </div>
    );
  };
