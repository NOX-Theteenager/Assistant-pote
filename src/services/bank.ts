import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';

export interface BankAccount {
    id: string;
    name: string;
    balance: number;
    currency: string;
    provider: 'mono' | 'gocardless' | 'manual';
    lastSynced?: string;
}

export const BankService = {
    // Exchange Mono Code for ID (Call Cloud Function)
    exchangeMonoCode: async (code: string): Promise<{id: string}> => {
        const exchange = httpsCallable(functions, 'exchangeTokenMono');
        const result = await exchange({ code });
        return result.data as { id: string };
    },

    // Fetch Balance (Call Cloud Function)
    fetchBalance: async (accountId: string, provider: 'mono' | 'gocardless'): Promise<{balance: number, currency: string}> => {
        // CALLING REAL BACKEND. NO MOCKS.
        const fetchFn = httpsCallable(functions, provider === 'mono' ? 'fetchMonoBalance' : 'fetchGoCardlessBalance');
        
        try {
            const result = await fetchFn({ accountId });
            return result.data as { balance: number, currency: string };
        } catch (e: any) {
            console.error(`Real Bank Sync Failed for ${provider}:`, e);
            throw new Error(e.message || "Failed to sync bank.");
        }
    },

    // Mock Exchange Rates (Free API or Hardcoded for stability)
    getExchangeRate: (from: string, to: string): number => {
        const rates: Record<string, number> = {
            'EUR_USD': 1.08,
            'EUR_XAF': 655.957, 
            'USD_EUR': 0.92,
            'USD_XAF': 600.0,
            'XAF_EUR': 0.0015,
            'XAF_USD': 0.0016
        };
        if (from === to) return 1;
        const key = `${from}_${to}`;
        return rates[key] || 1;
    }
};
