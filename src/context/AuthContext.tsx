import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
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
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, profile: null });

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

    return (
        <AuthContext.Provider value={{ user, loading, profile }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
