import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  type DocumentData,
  type QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';

export const dbService = {
  async getDocument<T = DocumentData>(col: string, id: string): Promise<T | null> {
    const docRef = doc(db, col, id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as T) : null;
  },

  async getDocuments<T = DocumentData>(col: string, constraints: QueryConstraint[] = []): Promise<T[]> {
    const q = query(collection(db, col), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  },

  async addDocument<T extends object>(col: string, data: T) {
    return await addDoc(collection(db, col), data);
  },

  async setDocument<T extends object>(col: string, id: string, data: T, merge = true) {
    const docRef = doc(db, col, id);
    return await setDoc(docRef, data, { merge });
  },

  async updateDocument<T extends object>(col: string, id: string, data: Partial<T>) {
    const docRef = doc(db, col, id);
    return await updateDoc(docRef, data as DocumentData);
  },

  async deleteDocument(col: string, id: string) {
    const docRef = doc(db, col, id);
    return await deleteDoc(docRef);
  }
};
