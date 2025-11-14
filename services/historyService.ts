
import { SummaryEntry } from '../types';

const HISTORY_KEY = 'jurisResumoHistory';

/**
 * Retrieves the entire history of summaries from local storage.
 * @returns An array of SummaryEntry objects.
 */
export function getHistory(): SummaryEntry[] {
    try {
        const historyJson = localStorage.getItem(HISTORY_KEY);
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
        console.error('Error reading history from local storage:', error);
        return [];
    }
}

/**
 * Saves a new summary entry to the history in local storage.
 * @param newEntry The SummaryEntry object to save.
 */
export function saveSummary(newEntry: SummaryEntry): void {
    try {
        const history = getHistory();
        history.push(newEntry);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error('Error saving summary to local storage:', error);
    }
}

/**
 * Clears the entire history from local storage.
 */
export function clearHistory(): void {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error('Error clearing history from local storage:', error);
    }
}
