import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export const OnboardingChat = ({ onComplete }: { onComplete: () => void }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(0);
    const [balance, setBalance] = useState('');

    const handleComplete = async () => {
        if (!user) return;

        await setDoc(doc(db, 'users', user.uid), {
            onboardingComplete: true,
            balance: parseFloat(balance) || 0,
            currency: 'EUR',
            monthlyBudget: 0,
            displayName: user.displayName
        }, { merge: true });

        onComplete();
    };

    const steps = [
        {
            text: "Wesh ! Moi c'est Pote. Je vais t'aider à pas finir sous un pont.",
            button: "C'est parti"
        },
        {
            text: "Pour commencer, t'as combien sur ton compte là tout de suite ? (Sois honnête, je le saurai)",
            input: true,
            placeholder: "0.00",
            button: "Valider"
        }
    ];

    const current = steps[step];

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full max-w-sm glass-card p-8 rounded-3xl border-t border-white/10"
                >
                    <p className="text-xl font-bold mb-8 leading-relaxed">
                        {current.text}
                    </p>

                    {current.input && (
                        <div className="mb-8">
                             <input
                                type="number"
                                autoFocus
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                className="w-full bg-transparent border-b-2 border-neon-green py-2 text-3xl font-mono outline-none"
                                placeholder={current.placeholder}
                            />
                        </div>
                    )}

                    <button
                        onClick={() => step < steps.length - 1 ? setStep(step + 1) : handleComplete()}
                        className="w-full bg-neon-green text-black py-4 rounded-2xl font-bold active:scale-95 transition-transform"
                    >
                        {current.button}
                    </button>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
