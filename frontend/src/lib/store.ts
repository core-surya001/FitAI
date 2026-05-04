import { create } from 'zustand';
import api from './api';

export interface User {
  id: number;
  full_name: string;
  email: string;
  credits: number;
  subscription: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => void;
  deductCredits: (amount: number) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  fetchUser: async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      
      const response = await api.get('/auth/me');
      set({ user: response.data, isAuthenticated: true, isLoading: false });
    } catch (error) {
      console.error("Failed to fetch user:", error);
      if (typeof window !== 'undefined') localStorage.removeItem('token');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false });
  },

  deductCredits: (amount: number) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, credits: user.credits - amount } });
    }
  }
}));
