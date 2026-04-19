import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useNavigate } from 'react-router-dom';

export function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    
    // Sottoscrizione per ottenere tutti gli utenti (escluso l'utente corrente filter-by-client)
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const u: any[] = [];
      snapshot.forEach(doc => {
        if (doc.id !== currentUser.uid) {
           u.push({ id: doc.id, ...doc.data() });
        }
      });
      setUsers(u);
    });
    return () => unsub();
  }, [currentUser]);

  const filteredUsers = users.filter(u => 
     (u.displayName || u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full animate-fade-in pb-24">
      <div className="px-container pt-safe-top sticky top-0 bg-background/80 backdrop-blur-md z-10 pb-4">
         <h1 className="text-3xl font-bold font-heading mb-4 px-2">Utenti</h1>
         <Input
           placeholder="Cerca un utente..."
           value={search}
           onChange={e => setSearch(e.target.value)}
           rightElement={<Search className="text-text-muted" size={18} />}
         />
      </div>

      <div className="px-container flex flex-col gap-3 mt-2">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-10 text-text-muted">Nessun utente trovato</div>
        ) : (
          filteredUsers.map(u => (
            <GlassCard key={u.id} className="p-4 flex items-center gap-4 transition-all hover:border-primary-300">
              <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-500 flex items-center justify-center font-bold text-lg shrink-0">
                {(u.displayName || u.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-lg truncate leading-tight">{u.displayName || 'Utente'}</h3>
                <p className="text-sm text-text-muted truncate">{u.email}</p>
                {u.role && <span className="text-xs text-primary-500 bg-primary-500/10 px-2 py-0.5 rounded-md mt-1 inline-block">{u.role}</span>}
              </div>
              <Button size="sm" className="shrink-0 rounded-full h-10 w-10 p-0" onClick={() => navigate(`/messages/${u.id}`, { state: { user: u } })}>
                 <MessageSquare size={18} />
              </Button>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
