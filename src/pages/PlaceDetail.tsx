import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { usePlacesStore, type Place } from '@/store/usePlacesStore';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Clock, User, Tag } from 'lucide-react';

export function PlaceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { places } = usePlacesStore();

  const place = places.find((p) => p.id === id);

  if (!place) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
        <h2 className="text-xl font-bold">Luogo non trovato</h2>
        <Button onClick={() => navigate(-1)} variant="secondary">
          <ArrowLeft size={16} className="mr-2" /> Torna indietro
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-glass-bg transition-colors"
          aria-label="Torna indietro"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold truncate pr-4">{place.name}</h1>
      </header>

      <GlassCard className="overflow-hidden">
        {/* Placeholder per l'immagine del luogo o la mappa statica */}
        <div className="h-48 w-full bg-primary-100 dark:bg-primary-500 flex items-center justify-center">
          <MapPin size={48} className="text-primary-500 dark:text-primary-50 opacity-20" />
        </div>
        
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-500 text-primary-500 dark:text-primary-50 text-sm font-medium">
              <Tag size={14} className="mr-1.5" /> {place.type}
            </span>
          </div>

          <div className="space-y-3 mt-2">
            {place.address && (
              <div className="flex items-start gap-3 text-text">
                <MapPin size={18} className="text-text-muted mt-0.5 shrink-0" />
                <span>{place.address}</span>
              </div>
            )}
            
            {place.description && (
              <p className="text-text-muted mt-4 bg-background/50 p-4 rounded-xl text-sm leading-relaxed border border-glass-border">
                {place.description}
              </p>
            )}
          </div>

          <div className="h-px w-full bg-glass-border my-2" />

          <div className="flex items-center gap-6 text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <User size={14} />
              Aggiunto da {place.addedBy}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              {new Date(place.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
