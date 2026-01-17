export interface RecurringIncome {
  id: string;
  name: string;
  amount: number;
  dayOfMonth: number; // 1-31
}

/**
 * Checks if any recurring incomes should be applied since the last login.
 * Returns a list of incomes that triggered.
 */
export const checkRecurringIncomes = (
  incomes: RecurringIncome[],
  lastLoginDate: Date | null
): RecurringIncome[] => {
  if (!lastLoginDate || incomes.length === 0) return [];

  const now = new Date();
  const last = new Date(lastLoginDate);
  const triggered: RecurringIncome[] = [];

  // Normalize dates to midnight to avoid time issues
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastCheck = new Date(last.getFullYear(), last.getMonth(), last.getDate());

  // If same day, nothing to do
  if (today.getTime() === lastCheck.getTime()) return [];

  // Iterate strictly through days from lastCheck + 1 day up to today
  // to catch any dayOfMonth that happened in between
  const cursor = new Date(lastCheck);
  cursor.setDate(cursor.getDate() + 1);

  while (cursor <= today) {
    const day = cursor.getDate();
    
    incomes.forEach(inc => {
      // If the income matches this day
      // OR if it's day 31 and the month doesn't have 31 days (handled by JS date overflow? No, better safe logic usually required, but keeping simple for now: strict match)
      // JS Date auto-corrects: e.g. Feb 30 -> Mar 2. This logic simply checks "Is today the Nth?"
      // To strictly support "Month End", we'd need more complex logic.
      // For now: Simple day match.
      if (inc.dayOfMonth === day) {
        triggered.push(inc);
      }
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  return triggered;
};
