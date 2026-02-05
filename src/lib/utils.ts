import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number, currencyCode: string = 'EUR'): string => {
  let locale = 'fr-FR'; // Default locale
  
  switch (currencyCode) {
    case 'USD': locale = 'en-US'; break;
    case 'GBP': locale = 'en-GB'; break;
    case 'JPY': locale = 'ja-JP'; break;
    case 'XAF': locale = 'fr-CM'; break; // Cameroon locale
    case 'CHF': locale = 'fr-CH'; break;
    default: locale = 'fr-FR';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (e) {
    console.warn("Currency format fallback", e);
    return `${amount} ${currencyCode}`;
  }
};

export const convertCurrency = (amount: number, from: string, to: string): number => {
    const rates: Record<string, number> = {
        'EUR_USD': 1.08,
        'EUR_XAF': 655.957, 
        'USD_EUR': 0.92,
        'USD_XAF': 600.0,
        'XAF_EUR': 0.00155, // 1/655.957 approx
        'XAF_USD': 0.0016
    };
    if (from === to) return amount;
    const key = `${from}_${to}`;
    return amount * (rates[key] || 1);
};
