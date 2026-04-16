import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'User' | 'Manager' | 'Admin';

type UserData = {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
};

type AuthState = {
  user: UserData | null;
  isLoading: boolean;
  login: (userData: UserData) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false, // In a real app, this might start true while checking session
      login: (userData) => set({ user: userData }),
      logout: () => set({ user: null }),
      setRole: (role) => set((state) => ({ user: state.user ? { ...state.user, role } : null })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
