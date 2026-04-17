import { create } from 'zustand';
import { db } from '@/services/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';

export const PLACE_TYPES = [
  'Bar',
  'Ufficio',
  'Centro sportivo',
  'Ristorante',
  'Parco',
  'Cooperativa',
  'Spazio eventi',
  'Altro',
] as const;

export type PlaceType = (typeof PLACE_TYPES)[number];

export type Place = {
  id: string;
  name: string;
  type: PlaceType;
  lat: number;
  lng: number;
  address?: string;
  description?: string;
  addedBy?: string;
  createdAt: string;
};

type PlacesState = {
  places: Place[];
  addPlace: (place: Omit<Place, 'id' | 'createdAt'>) => Promise<void>;
  removePlace: (id: string) => Promise<void>;
  updatePlace: (id: string, data: Partial<Omit<Place, 'id' | 'createdAt'>>) => Promise<void>;
  _setPlaces: (places: Place[]) => void;
};

let unsubPlaces: (() => void) | null = null;

export const subscribeToPlaces = () => {
  if (unsubPlaces) return;
  const colRef = collection(db, 'places');
  unsubPlaces = onSnapshot(colRef, (snapshot) => {
    const freshPlaces: Place[] = [];
    snapshot.forEach((doc) => {
      freshPlaces.push({ id: doc.id, ...doc.data() } as Place);
    });
    usePlacesStore.getState()._setPlaces(freshPlaces);
  });
};

export const unsubscribePlaces = () => {
  if (unsubPlaces) {
    unsubPlaces();
    unsubPlaces = null;
  }
};

export const usePlacesStore = create<PlacesState>()((set) => ({
  places: [],
  
  addPlace: async (place) => {
    const newId = crypto.randomUUID();
    const newPlace = {
      ...place,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'places', newId), newPlace);
    // UI verrà aggiornata dal listener onSnapshot
  },
  
  removePlace: async (id) => {
    await deleteDoc(doc(db, 'places', id));
  },
  
  updatePlace: async (id, data) => {
    await setDoc(doc(db, 'places', id), data, { merge: true });
  },

  _setPlaces: (places) => set({ places }),
}));

// ─── Utility: Haversine distance (km) ────────────────────────────────────────
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}
