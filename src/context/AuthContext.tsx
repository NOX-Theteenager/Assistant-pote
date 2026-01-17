import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            
            if (currentUser) {
                console.log("User logged in:", currentUser.uid);
                
                // SYNC LOGIC: Migrate localStorage to Firestore on first login
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                
                if (!userDoc.exists()) {
                    // First login - migrate local data to Firestore
                    const localData = {
                        balance: localStorage.getItem('pote_balance') || '100',
                        transactions: localStorage.getItem('pote_transactions') || '[]',
                        savingsGoals: localStorage.getItem('pote_savings_goals') || '[]',
                        recurringIncomes: localStorage.getItem('pote_incomes') || '[]',
                        accounts: localStorage.getItem('pote_accounts') || '[]',
                        currency: localStorage.getItem('pote_currency') || 'EUR',
                        theme: localStorage.getItem('pote_theme') || 'dark',
                    };
                    
                    await setDoc(userDocRef, {
                        ...localData,
                        createdAt: new Date().toISOString(),
                        email: currentUser.email,
                        displayName: currentUser.displayName
                    });
                    console.log("Data migrated to Firestore!");
                } else {
                    // Returning user - load data from Firestore to localStorage
                    const cloudData = userDoc.data();
                    if (cloudData) {
                        localStorage.setItem('pote_balance', cloudData.balance);
                        localStorage.setItem('pote_transactions', cloudData.transactions);
                        localStorage.setItem('pote_savings_goals', cloudData.savingsGoals);
                        localStorage.setItem('pote_incomes', cloudData.recurringIncomes);
                        localStorage.setItem('pote_accounts', cloudData.accounts);
                        localStorage.setItem('pote_currency', cloudData.currency);
                        localStorage.setItem('pote_theme', cloudData.theme);
                        console.log("Data loaded from Firestore!");
                        // Trigger a page reload to apply loaded data
                        window.location.reload();
                    }
                }
            }
        });
        return () => unsubscribe();
    }, []);

    const login = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed", error);
            alert("Erreur de connexion Google. Vérifie ta config Firebase.");
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
