import { useEffect, useRef, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { usePlacesStore, type Place, PLACE_TYPES, type PlaceType, haversineKm } from '@/store/usePlacesStore';
import { Input } from '@/components/ui/Input';
import { Plus, List, Search, MapPin, X, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Fix per icona di default di leaflet in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Componente per gestire click sulla mappa (per l'inserimento)
function MapClickHandler({ onLocationClick, isActive }: { onLocationClick: (latlng: L.LatLng) => void; isActive: boolean }) {
  useMapEvents({
    click(e) {
      if (isActive) {
        onLocationClick(e.latlng);
      }
    },
  });
  return null;
}

// Componente per spostare la mappa automaticamente sul nuovo punto scelto
function MapRecenter({ centerObj }: { centerObj: { pos: [number, number], t: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (centerObj) {
      map.flyTo(centerObj.pos, 16, { animate: true });
    }
  }, [centerObj, map]);
  return null;
}

export function Maps() {
  const { isDark } = useThemeStore();
  const { user } = useAuthStore();
  const { places, addPlace } = usePlacesStore();
  const navigate = useNavigate();

  // Stati generali
  const [showList, setShowList] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Form Nuovo Luogo
  const [newPlacePos, setNewPlacePos] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<{ pos: [number, number], t: number } | null>(null);

  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<PlaceType>('Altro');
  const [newAddress, setNewAddress] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isPickingMode, setIsPickingMode] = useState(false);

  // Filtyer e Ricerca Lista
  const [searchQuery, setSearchQuery] = useState('');

  const canAdd = user?.role === 'Manager' || user?.role === 'Admin';

  // Chiede localizzazione utente
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          console.warn('Geolocalizzazione negata o non disponibile.');
        }
      );
    }
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlacePos) return;

    try {
      await addPlace({
        name: newName,
        type: newType,
        lat: newPlacePos[0],
        lng: newPlacePos[1],
        address: newAddress,
        description: newDesc,
        addedBy: user?.displayName || user?.email || 'admin',
      });

      toast.success('Luogo aggiunto con successo!');
      
      // Reset
      setShowAddForm(false);
      setNewPlacePos(null);
      setNewName('');
      setNewAddress('');
      setNewDesc('');
      setNewType('Altro');
    } catch (err: any) {
      console.error(err);
      toast.error('Errore di salvataggio. Hai aggiornato le rules Firestore? (' + err.message + ')');
    }
  };

  const handleMapClick = (latlng: L.LatLng) => {
    const pos: [number, number] = [latlng.lat, latlng.lng];
    setNewPlacePos(pos);
    if (isPickingMode) {
      handleReverseGeocode(pos);
      setIsPickingMode(false);
    }
  };

  const handleGeocode = async () => {
    if (!newAddress.trim()) return;
    setIsGeocoding(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newAddress)}`);
      const data = await resp.json();
      if (data && data.length > 0) {
        const pos: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setNewPlacePos(pos);
        setMapCenter({ pos, t: Date.now() });
      } else {
        alert('Indirizzo non trovato!');
      }
    } catch {
      alert("Errore di rete durante la ricerca dell'indirizzo.");
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleReverseGeocode = async (pos: [number, number]) => {
    setIsGeocoding(true);
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos[0]}&lon=${pos[1]}`);
      const data = await resp.json();
      if (data && data.display_name) {
        setNewAddress(data.display_name);
      } else {
        alert('Nessun indirizzo trovato per questa posizione.');
      }
    } catch {
      alert("Errore del server durante il recupero dell'indirizzo.");
    } finally {
      setIsGeocoding(false);
    }
  };

  // Ordinamento e filtro lista
  const filteredAndSortedPlaces = [...places]
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.address?.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(p => ({
      ...p,
      distance: userLocation ? haversineKm(userLocation[0], userLocation[1], p.lat, p.lng) : null
    }))
    .sort((a, b) => {
      // Se abbiamo la location, ordina per distanza
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      // Altrimenti ordine alfabetico
      return a.name.localeCompare(b.name);
    });

  // Stili Mappa
  // Leaflet watermark viene rimosso tramite CSS in index.css o inline class (vedi sotto).
  const tileLayerUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* ── Mappa ── */}
      <div className="absolute inset-0 z-0 map-hide-attribution">
        <MapContainer
          center={[41.9028, 12.4964]} // Default Roma
          zoom={12}
          style={{ height: '100%', width: '100%', backgroundColor: isDark ? '#151816' : '#f7f9f8' }}
          zoomControl={false}
        >
          <TileLayer url={tileLayerUrl} />

          <MapRecenter centerObj={mapCenter} />
          <MapClickHandler onLocationClick={handleMapClick} isActive={showAddForm} />

          {/* Marker Luoghi Censiti */}
          {places.map((place) => (
            <Marker key={place.id} position={[place.lat, place.lng]}>
              <Popup className="glass-popup">
                <div className="p-1 min-w-[150px]">
                  <h3 className="font-bold text-sm mb-1">{place.name}</h3>
                  <p className="text-xs text-text-muted mb-2">{place.type}</p>
                  <Button size="sm" className="w-full h-8 text-xs" onClick={() => navigate(`/places/${place.id}`)}>
                    Dettagli
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Marker del Nuovo Luogo (in inserimento) */}
          {showAddForm && newPlacePos && (
             <Marker position={newPlacePos} opacity={0.6} />
          )}

           {/* Marker Posizione Utente */}
           {userLocation && (
            <Marker position={userLocation} opacity={0.8}>
               <Popup>Tu sei qui</Popup>
            </Marker>
          )}

        </MapContainer>
      </div>

      {/* ── Bottone per localizzazione Mappa (visibile se non si sta aggiungendo luoghi) ── */}
      {!showList && (
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="glass"
            className="w-12 h-12 p-0 rounded-full shadow-xl bg-background/90"
            onClick={() => {
              if (userLocation) {
                setMapCenter({ pos: userLocation, t: Date.now() });
              } else {
                alert("Posizione attuale non disponibile, abilita la localizzazione.");
              }
            }}
            aria-label="Centra su di me"
          >
            <Navigation size={22} className="text-primary-500" />
          </Button>
        </div>
      )}

      {/* ── Overlay Bottoni Fluttuanti in basso ── */}
      <div className="absolute bottom-6 left-0 right-0 z-10 flex items-center justify-center gap-4 px-4 pointer-events-none">
        
        <GlassCard className="pointer-events-auto flex gap-2 p-2 shadow-2xl rounded-full">
          <Button
            variant="glass"
            className={`rounded-full h-14 px-6 gap-2 ${showList ? 'bg-primary-500/20' : ''}`}
            onClick={() => { setShowList(!showList); setShowAddForm(false); }}
          >
            <List size={20} />
            <span className="font-semibold">Lista Luoghi</span>
          </Button>

          {canAdd && (
            <Button
              variant="primary"
              className={`rounded-full h-14 w-14 p-0 shadow-lg ${showAddForm ? 'bg-red-500 hover:bg-red-600' : ''}`}
              onClick={() => { 
                setShowAddForm(!showAddForm); 
                setShowList(false);
                setNewPlacePos(null);
              }}
              aria-label={showAddForm ? "Annulla" : "Aggiungi Luogo"}
            >
              {showAddForm ? <X size={24} /> : <Plus size={24} />}
            </Button>
          )}
        </GlassCard>
      </div>

      {/* ── Pannello Lista (Offcanvas) ── */}
      <AnimatePresence>
        {showList && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 top-1/3 z-20 bg-background/90 backdrop-blur-xl border-t border-glass-border shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col rounded-t-3xl overflow-hidden pointer-events-auto"
          >
            <div className="p-4 border-b border-glass-border flex flex-col gap-4 shrink-0 bg-surface/50">
               <div className="w-12 h-1.5 bg-glass-border rounded-full mx-auto" />
               <div className="flex items-center justify-between">
                 <h2 className="text-xl font-bold">Luoghi Censiti</h2>
                 <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" onClick={() => setShowList(false)}>
                   <X size={18} />
                 </Button>
               </div>
               
               <Input
                 placeholder="Cerca per nome o indirizzo, cap..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 rightElement={<Search size={18} className="text-text-muted" />}
                 className="bg-background"
               />
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-24">
              {filteredAndSortedPlaces.length === 0 ? (
                <div className="text-center py-10 text-text-muted">
                  Nessun luogo trovato.
                </div>
              ) : (
                filteredAndSortedPlaces.map((p) => (
                  <GlassCard 
                    key={p.id} 
                    className="p-4 flex items-center justify-between cursor-pointer hover:border-primary-300 transition-colors active:scale-[0.98]"
                    onClick={() => navigate(`/places/${p.id}`)}
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-semibold text-lg truncate">{p.name}</span>
                      <span className="text-sm text-text-muted">{p.type}</span>
                    </div>
                    {p.distance !== null && (
                      <div className="flex items-center gap-1 text-primary-500 font-medium text-sm whitespace-nowrap bg-primary-100 dark:bg-primary-500/20 px-2 py-1 rounded-md shrink-0">
                        <Navigation size={12} />
                        {p.distance < 1 ? '< 1 km' : `${p.distance.toFixed(1)} km`}
                      </div>
                    )}
                  </GlassCard>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pannello Inserimento ── */}
      <AnimatePresence>
        {showAddForm && (
           <motion.div
           initial={{ y: -50, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: -50, opacity: 0 }}
           className="absolute top-4 left-4 right-4 z-20 pointer-events-auto"
         >
           <GlassCard className="p-5 shadow-2xl relative">
             <Button 
               variant="ghost" 
               size="sm" 
               className="absolute top-2 right-2 h-8 w-8 p-0 rounded-full" 
               onClick={() => {
                 setShowAddForm(false);
                 setIsPickingMode(false);
               }}
             >
               <X size={18} />
             </Button>
             
             {isPickingMode ? (
               <div className="flex items-center justify-between py-2 pr-6">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-primary-500/20 text-primary-500 rounded-full flex items-center justify-center animate-pulse">
                     <MapPin size={20} />
                   </div>
                   <div className="flex flex-col">
                     <span className="font-bold text-sm">Scegli Posizione</span>
                     <span className="text-xs text-text-muted">Tocca ovunque sulla mappa.</span>
                   </div>
                 </div>
                 <Button variant="ghost" size="sm" onClick={() => setIsPickingMode(false)}>
                   Annulla
                 </Button>
               </div>
             ) : !newPlacePos ? (
               <div className="flex flex-col items-center py-4 text-center">
                 <div className="w-16 h-16 bg-primary-100 dark:bg-primary-500/30 text-primary-500 rounded-full flex items-center justify-center mb-3 animate-pulse">
                   <MapPin size={32} />
                 </div>
                 <h3 className="font-bold text-lg">Seleziona posizione</h3>
                 <p className="text-sm text-text-muted mt-1 mb-4">Tocca un punto sulla mappa oppure cerca un indirizzo:</p>
                 
                 <div className="w-full flex gap-2">
                   <Input 
                      placeholder="Es. Colosseo, Roma" 
                      value={newAddress} 
                      onChange={e => setNewAddress(e.target.value)} 
                   />
                   <Button size="sm" onClick={handleGeocode} disabled={isGeocoding || !newAddress.trim()} className="shrink-0 h-12 w-12 p-0 rounded-xl">
                     <Search size={18} />
                   </Button>
                 </div>
               </div>
             ) : (
               <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 mt-2">
                  <h3 className="font-bold text-lg border-b border-glass-border pb-2">Nuovo Luogo</h3>

                  
                  <Input 
                    label="Nome Luogo" 
                    required 
                    value={newName} 
                    onChange={e => setNewName(e.target.value)} 
                    placeholder="Es. Bar Centrale" 
                  />
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-muted ml-2">Tipologia</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as PlaceType)}
                      className="flex h-12 w-full rounded-full border border-glass-border bg-surface px-4 py-2 text-sm text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 shadow-sm"
                    >
                      {PLACE_TYPES.map(pt => (
                        <option key={pt} value={pt}>{pt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-muted ml-2">Indirizzo / CAP (Opzionale)</label>
                    <div className="flex gap-2">
                       <Input 
                         value={newAddress} 
                         onChange={e => setNewAddress(e.target.value)} 
                         placeholder="Es. Via Roma 1, Roma" 
                         wrapperClassName="flex-1"
                       />
                       <Button 
                         type="button"
                         size="sm" 
                         variant={isPickingMode ? 'primary' : 'glass'}
                         title="Seleziona dalla mappa"
                         onClick={() => {
                           setIsPickingMode(!isPickingMode);
                         }} 
                         className={`shrink-0 h-12 w-12 p-0 rounded-xl bg-surface`}
                       >
                         <MapPin size={18} className={isPickingMode ? 'text-white animate-bounce' : 'text-primary-500'} />
                       </Button>
                       <Button 
                         type="button"
                         size="sm" 
                         variant="glass"
                         title="Usa la tua posizione attuale"
                         disabled={isGeocoding || !userLocation}
                         onClick={() => {
                           if (userLocation) {
                             setNewPlacePos(userLocation);
                             setMapCenter({ pos: userLocation, t: Date.now() });
                             handleReverseGeocode(userLocation);
                           }
                         }} 
                         className="shrink-0 h-12 w-12 p-0 rounded-xl bg-surface"
                       >
                         <Navigation size={18} className="text-primary-500" />
                       </Button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-text-muted ml-2">Descrizione (Opzionale)</label>
                    <textarea
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Breve descrizione..."
                      className="flex w-full rounded-2xl border border-glass-border bg-surface px-4 py-3 text-sm text-text transition-colors placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 shadow-sm resize-none min-h-[80px]"
                    />
                  </div>

                  <Button type="submit" className="w-full mt-2">Salva Luogo</Button>
               </form>
             )}
           </GlassCard>
         </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        /* Nasconde il watermark leaflet */
        .map-hide-attribution .leaflet-control-attribution {
          display: none !important;
        }
        /* Customizza i popup Leaflet per farli sembrare glassmorphism */
        .leaflet-popup-content-wrapper {
          background-color: var(--glass-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--glass-border);
          color: var(--text-color);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          border-radius: 1rem;
        }
        .leaflet-popup-tip {
          background-color: var(--glass-bg);
          border: 1px solid var(--glass-border);
        }
      `}</style>
    </div>
  );
}
