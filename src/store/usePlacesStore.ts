import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

const MOCK_PLACES: Place[] = [
  {
    id: '1',
    name: 'Bar del Centro',
    type: 'Bar',
    lat: 41.9028,
    lng: 12.4964,
    address: 'Via del Corso 1, Roma',
    description: 'Storico bar nel cuore di Roma, ottimo espresso.',
    addedBy: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Parco della Caffarella',
    type: 'Parco',
    lat: 41.8709,
    lng: 12.5241,
    address: 'Via della Caffarella, Roma',
    description: 'Grande parco naturale perfetto per sport all\'aperto.',
    addedBy: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Centro Sportivo Torrino',
    type: 'Centro sportivo',
    lat: 41.8183,
    lng: 12.4697,
    address: 'Via del Torrino 25, Roma',
    description: 'Centro sportivo con campi da calcio e tennis.',
    addedBy: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Ristorante da Luigi',
    type: 'Ristorante',
    lat: 41.8900,
    lng: 12.4822,
    address: 'Via Appia Nuova 110, Roma',
    description: 'Cucina romana tradizionale, sempre affollato.',
    addedBy: 'admin',
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Spazio Coworking Prati',
    type: 'Ufficio',
    lat: 41.9082,
    lng: 12.4601,
    address: 'Via Cola di Rienzo 80, Roma',
    description: 'Coworking moderno con sale riunioni e fibra.',
    addedBy: 'admin',
    createdAt: new Date().toISOString(),
  },
];

type PlacesState = {
  places: Place[];
  addPlace: (place: Omit<Place, 'id' | 'createdAt'>) => void;
  removePlace: (id: string) => void;
  updatePlace: (id: string, data: Partial<Omit<Place, 'id' | 'createdAt'>>) => void;
};

export const usePlacesStore = create<PlacesState>()(
  persist(
    (set) => ({
      places: MOCK_PLACES,
      addPlace: (place) =>
        set((state) => ({
          places: [
            ...state.places,
            {
              ...place,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      removePlace: (id) =>
        set((state) => ({ places: state.places.filter((p) => p.id !== id) })),
      updatePlace: (id, data) =>
        set((state) => ({
          places: state.places.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),
    }),
    { name: 'places-storage' }
  )
);

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
