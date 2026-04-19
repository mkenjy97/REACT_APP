import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { motion } from 'framer-motion';
import { PAGE_VARIANTS } from '@/constants/animations';

export function ChatPage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [otherUser, setOtherUser] = useState<any>(location.state?.user || null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!otherUser && userId) {
      getDoc(doc(db, 'users', userId)).then(snap => {
        if (snap.exists()) setOtherUser({ id: snap.id, ...snap.data() });
      });
    }
  }, [userId, otherUser]);

  useEffect(() => {
    if (!currentUser?.uid || !userId) return;
    
    const chatId = [currentUser.uid, userId].sort().join('_');
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      
      updateDoc(doc(db, 'chats', chatId), {
        unreadBy: arrayRemove(currentUser.uid)
      }).catch(() => {});

      const unreadIncoming = snapshot.docs.filter(d => d.data().senderId !== currentUser.uid && !d.data().read);
      if (unreadIncoming.length > 0) {
        const batch = writeBatch(db);
        unreadIncoming.forEach(d => {
          batch.update(doc(db, 'chats', chatId, 'messages', d.id), { read: true });
        });
        batch.commit().catch(console.error);
      }
    });

    return () => unsub();
  }, [currentUser, userId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !currentUser?.uid || !userId) return;

    const chatId = [currentUser.uid, userId].sort().join('_');
    const content = text;
    setText('');
    
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: content,
      senderId: currentUser.uid,
      read: false,
      createdAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'chats', chatId), {
      lastMessageText: content,
      lastMessageAt: serverTimestamp(),
      lastSenderId: currentUser.uid,
      participants: [currentUser.uid, userId],
      unreadBy: arrayUnion(userId)
    }, { merge: true });
  };

  return (
    <motion.div 
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col h-full bg-background"
    >
      <GlassCard className="!rounded-none !border-t-0 !border-l-0 !border-r-0 p-4 pt-safe-top flex items-center gap-3 shrink-0 z-10 sticky top-0 shadow-sm rounded-b-3xl">
         <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-full bg-surface" onClick={() => navigate(-1)}>
            <Icon name="ChevronLeft" size={20} />
         </Button>
         <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-500 flex items-center justify-center font-bold">
            {(otherUser?.displayName || otherUser?.email || 'U').charAt(0).toUpperCase()}
         </div>
         <div className="flex-1 overflow-hidden">
            <h2 className="font-bold truncate">{otherUser?.displayName || 'Utente'}</h2>
            <p className="text-xs text-primary-500 font-medium">Chat Online</p>
         </div>
      </GlassCard>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-24">
         {messages.length === 0 && (
           <p className="text-center text-text-muted my-auto font-medium">Nessun messaggio. Inizia la conversazione!</p>
         )}
         {messages.map((m) => {
           const isMe = m.senderId === currentUser?.uid;
           const timeStr = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
           
           return (
             <div key={m.id} className={`flex max-w-[85%] ${isMe ? 'self-end' : 'self-start'}`}>
               <div className={`p-3.5 px-4 rounded-3xl shadow-sm ${isMe ? 'bg-primary-500 text-white rounded-tr-sm' : 'glass-panel rounded-tl-sm border border-glass-border'}`}>
                 <p className="text-[15px]">{m.text}</p>
                 <div className="flex items-center justify-end gap-1 mt-1">
                    {timeStr && (
                      <span className={`text-[10px] block ${isMe ? 'text-primary-100' : 'text-text-muted'}`}>
                        {timeStr}
                      </span>
                    )}
                    {isMe && (
                      <div className={m.read ? 'text-blue-300' : 'text-primary-200'}>
                        <Icon name="Check" size={12} />
                      </div>
                    )}
                 </div>
               </div>
             </div>
           );
         })}
         <div ref={bottomRef} className="h-4" />
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 pb-safe bg-background/80 backdrop-blur-xl border-t border-glass-border z-20">
         <form onSubmit={sendMessage} className="flex gap-2 max-w-3xl mx-auto w-full relative">
            <input 
              type="text" 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Scrivi un messaggio..."
              className="flex-1 h-12 rounded-full border border-glass-border bg-surface pl-5 pr-14 py-2 text-[15px] shadow-inner focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all font-medium"
            />
            <Button type="submit" className="absolute right-1 top-1 bottom-1 shrink-0 h-10 w-10 rounded-full p-0 flex items-center justify-center shadow-md bg-primary-500 text-white transition-transform active:scale-95" disabled={!text.trim()}>
               <Icon name="Add" size={18} />
            </Button>
         </form>
      </div>
    </motion.div>
  );
}
