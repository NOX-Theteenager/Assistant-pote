import { cn } from '../../lib/utils';

interface MascotProps {
    mood?: 'happy' | 'sad' | 'neutral' | 'sarcastic';
    scale?: number;
    className?: string;
}

export const Mascot = ({ mood = 'neutral', scale = 1, className }: MascotProps) => {
    const getMoodEmoji = () => {
        switch (mood) {
            case 'happy': return '😎';
            case 'sad': return '💀';
            case 'sarcastic': return '😏';
            default: return '🤖';
        }
    };

    return (
        <div
            className={cn("flex items-center justify-center transition-all duration-500", className)}
            style={{ transform: `scale(${scale})` }}
        >
            <div className="relative">
                {/* Glow Effect */}
                <div className={cn(
                    "absolute inset-0 blur-2xl opacity-20 rounded-full",
                    mood === 'happy' ? "bg-neon-green" :
                    mood === 'sad' ? "bg-red-500" :
                    "bg-neon-blue"
                )} />

                {/* Body */}
                <div className="relative text-6xl select-none animate-bounce">
                    {getMoodEmoji()}
                </div>
            </div>
        </div>
    );
};
