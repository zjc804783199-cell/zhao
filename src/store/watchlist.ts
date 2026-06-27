import { create } from 'zustand';
import type { WatchlistItem } from '../types';

interface WatchlistState {
  items: WatchlistItem[];
  addItem: (code: string, name: string) => void;
  removeItem: (code: string) => void;
  isInWatchlist: (code: string) => boolean;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'chanlun_watchlist';

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: [],

  addItem: (code: string, name: string) => {
    const { items } = get();
    if (items.some((item) => item.code === code)) return;

    const newItems = [...items, { code, name, addedAt: Date.now() }];
    set({ items: newItems });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  },

  removeItem: (code: string) => {
    const { items } = get();
    const newItems = items.filter((item) => item.code !== code);
    set({ items: newItems });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  },

  isInWatchlist: (code: string) => {
    return get().items.some((item) => item.code === code);
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ items: JSON.parse(stored) });
      }
    } catch (e) {
      console.error('Failed to load watchlist from storage', e);
    }
  },
}));
