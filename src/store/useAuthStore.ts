import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

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
      setRole: (role) => set((state) => {
        if (state.user) {
          const newUser = { ...state.user, role };
          setDoc(doc(db, 'users', state.user.uid), { role, email: state.user.email, displayName: state.user.displayName || '' }, { merge: true }).catch(console.error);
          return { user: newUser };
        }
        return { user: null };
      }),
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
