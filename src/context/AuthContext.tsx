import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, db, googleProvider } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface UserProfile {
    currency: string;
    monthlyBudget: number;
    onboardingComplete: boolean;
    balance: number;
    lastLogin?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    profile: UserProfile | null;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    profile: null,
    login: async () => {},
    logout: async () => {}
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Subscribe to profile updates
                const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
                    if (doc.exists()) {
                        setProfile(doc.data() as UserProfile);
                    } else {
                        setProfile(null);
                    }
                    setLoading(false);
                });
                return () => unsubProfile();
            } else {
                setProfile(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const login = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Login failed", error);
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
        <AuthContext.Provider value={{ user, loading, profile, login, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
