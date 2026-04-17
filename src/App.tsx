import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Toaster } from 'sonner';

// Pages
import { useEffect } from 'react';
import { subscribeToTheme, unsubscribeTheme } from '@/store/useThemeStore';
import { subscribeToPlaces, unsubscribePlaces } from '@/store/usePlacesStore';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';

import { Auth } from '@/pages/Auth';
import { Home } from '@/pages/Home';
import { Search } from '@/pages/Search';
import { Profile } from '@/pages/Profile';
import { Support } from '@/pages/Support';
import { NotFound } from '@/pages/NotFound';
import { Notifications } from '@/pages/Notifications';
import { Maps } from '@/pages/Maps';
import { PlaceDetail } from '@/pages/PlaceDetail';
import { FullScreenLayout } from '@/components/layout/FullScreenLayout';
import { ChatLayout } from '@/components/layout/ChatLayout';
import { Users } from '@/pages/Users';
import { Messages } from '@/pages/Messages';

function App() {
  const { user } = useAuthStore();
  const setUnreadChatCount = useNotificationStore((state) => state.setUnreadChatCount);

  useEffect(() => {
    // Inizializza i listeners di Firestore
    subscribeToTheme();
    subscribeToPlaces();
    
    let unsubChats: (() => void) | null = null;

    if (user?.uid) {
      const q = query(
        collection(db, 'chats'),
        where('unreadBy', 'array-contains', user.uid)
      );
      unsubChats = onSnapshot(q, (snapshot) => {
        setUnreadChatCount(snapshot.size);
      });
    } else {
      setUnreadChatCount(0);
    }
    
    return () => {
      unsubscribeTheme();
      unsubscribePlaces();
      if (unsubChats) unsubChats();
    };
  }, [user?.uid, setUnreadChatCount]);

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/auth" element={<Auth />} />

          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/support" element={<Support />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/places/:id" element={<PlaceDetail />} />
              <Route path="/users" element={<Users />} />
            </Route>
            <Route element={<FullScreenLayout />}>
              <Route path="/maps" element={<Maps />} />
            </Route>
            <Route element={<ChatLayout />}>
              <Route path="/messages/:userId" element={<Messages />} />
            </Route>
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      
      {/* Global Toast Provider */}
      <Toaster 
        theme="system" 
        position="top-center" 
        toastOptions={{
          className: 'glass-panel !border-glass-border',
        }}
      />
    </>
  );
}

export default App;
