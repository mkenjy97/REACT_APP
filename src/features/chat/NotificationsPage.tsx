import { GlassCard } from '@/components/ui/GlassCard';
import { useTranslation } from 'react-i18next';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';

export function NotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { notifications, removeNotification, clearAll } = useNotificationStore();
  const [unreadChats, setUnreadChats] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'chats'),
      where('unreadBy', 'array-contains', user.uid)
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const chats = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        const otherUserId = data.participants.find((id: string) => id !== user.uid);
        
        // Fetch sender details
        let senderName = 'Utente';
        if (otherUserId) {
          const userSnap = await getDoc(doc(db, 'users', otherUserId));
          if (userSnap.exists()) {
            senderName = userSnap.data().displayName || userSnap.data().email || 'Utente';
          }
        }

        return {
          id: chatDoc.id,
          otherUserId,
          senderName,
          ...data
        };
      }));
      setUnreadChats(chats);
    });

    return () => unsub();
  }, [user?.uid]);

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-2 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('navigation.notifications')}</h1>
        {notifications.length > 0 && (
          <button 
            onClick={clearAll}
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            Clear All
          </button>
        )}
      </header>
      
      {/* Sezione Messaggi Non Letti */}
      {unreadChats.length > 0 && (
        <section className="mb-6 animate-fade-in">
          <h2 className="text-sm font-bold text-primary-500 uppercase tracking-wider mb-3 ml-1 flex items-center gap-2">
             <MessageSquare size={16} />
             {t('notifications.unread_messages', { defaultValue: 'Messaggi non letti' })}
          </h2>
          <div className="flex flex-col gap-3">
             {unreadChats.map(chat => (
               <GlassCard 
                 key={chat.id} 
                 className="p-4 flex items-center gap-4 cursor-pointer hover:border-primary-300 transition-all border-l-4 border-l-primary-500"
                 onClick={() => navigate(`/messages/${chat.otherUserId}`)}
               >
                 <div className="w-12 h-12 rounded-full bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold text-lg shrink-0">
                    {chat.senderName.charAt(0).toUpperCase()}
                 </div>
                 <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                       <h3 className="font-bold truncate">{chat.senderName}</h3>
                       <span className="text-[10px] text-text-muted">
                          {chat.lastMessageAt?.toDate ? chat.lastMessageAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                       </span>
                    </div>
                    <p className="text-sm text-text-muted truncate italic">
                      "{chat.lastMessageText || '...'}"
                    </p>
                 </div>
               </GlassCard>
             ))}
          </div>
        </section>
      )}

      <div className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center text-text-muted"
            >
              <CheckCircle2 size={48} className="mb-4 opacity-20" />
              <p>You're all caught up!</p>
            </motion.div>
          ) : (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, height: 0, scale: 0.8 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.8 }}
                transition={{ opacity: { duration: 0.2 }, layout: { duration: 0.2 } }}
              >
                <GlassCard className="flex gap-4 p-4 relative group">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 shrink-0">
                    <Bell size={20} />
                  </div>
                  <div className="flex-1 pr-6">
                    <h3 className="font-semibold text-lg">{t(notif.titleKey)}</h3>
                    <p className="text-text-muted text-sm mt-1">
                      {t(notif.descKey)}
                    </p>
                    <span className="text-xs font-medium text-primary-500 mt-2 block">
                      {t('notifications_page.hours_ago', { count: Number(notif.timeLabel) })}
                    </span>
                  </div>
                  <button
                    onClick={() => removeNotification(notif.id)}
                    className="absolute top-4 right-4 text-text-muted hover:text-text transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Remove notification"
                  >
                    <X size={18} />
                  </button>
                </GlassCard>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
