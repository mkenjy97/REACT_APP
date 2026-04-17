import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'User' | 'Manager' | 'Admin';

type UserData = {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  phoneNumber?: string;
};

type AuthState = {
  user: UserData | null;
  isLoading: boolean;
  login: (userData: UserData) => void;
  logout: () => void;
  setRole: (role: UserRole) => void;
  updateProfile: (data: Partial<Pick<UserData, 'displayName' | 'phoneNumber'>>) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      login: (userData) => set({ user: userData }),
      logout: () => set({ user: null }),
      setRole: (role) => set((state) => ({ user: state.user ? { ...state.user, role } : null })),
      updateProfile: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: 'auth-storage',
    }
  )
);
