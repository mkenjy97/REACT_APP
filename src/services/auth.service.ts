import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';

export const authService = {
  async login(email: string, pass: string) {
    return await signInWithEmailAndPassword(auth, email, pass);
  },

  async register(email: string, pass: string) {
    return await createUserWithEmailAndPassword(auth, email, pass);
  },

  async logout() {
    return await signOut(auth);
  },

  async updateDisplayName(name: string) {
    if (!auth.currentUser) throw new Error('No user logged in');
    return await updateProfile(auth.currentUser, { displayName: name });
  },

  onAuthChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser() {
    return auth.currentUser;
  }
};
