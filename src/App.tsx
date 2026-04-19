import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { Toaster } from 'sonner';
import { useEffect } from 'react';

// Config
import { APP_CONFIG } from '@/config/app.config';

// Stores
import { subscribeToTheme, unsubscribeTheme } from '@/store/useThemeStore';
import { subscribeToPlaces, unsubscribePlaces } from '@/store/usePlacesStore';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';

// Feature Pages
import { AuthPage } from '@/features/auth/AuthPage';
import { HomePage } from '@/features/home/HomePage';
import { MapsPage } from '@/features/maps/MapsPage';
import { SearchPage } from '@/features/maps/SearchPage';
import { PlaceDetailPage } from '@/features/maps/PlaceDetailPage';
import { ChatPage } from '@/features/chat/ChatPage';
import { NotificationsPage } from '@/features/chat/NotificationsPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { UsersPage } from '@/features/profile/UsersPage';
import { SupportPage } from '@/features/support/SupportPage';
import { NotFoundPage } from '@/features/navigation/NotFoundPage';

// Layouts
import { FullScreenLayout } from '@/components/layout/FullScreenLayout';
import { ChatLayout } from '@/components/layout/ChatLayout';

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
          {APP_CONFIG.features.hasAuth && (
            <Route path="/auth" element={<AuthPage />} />
          )}

          {/* Protected Routes Wrapper */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              
              {APP_CONFIG.features.hasSearch && (
                <Route path="/search" element={<SearchPage />} />
              )}
              
              <Route path="/profile" element={<ProfilePage />} />
              
              {APP_CONFIG.features.hasSupport && (
                <Route path="/support" element={<SupportPage />} />
              )}
              
              {APP_CONFIG.features.hasNotifications && (
                <Route path="/notifications" element={<NotificationsPage />} />
              )}
              
              {APP_CONFIG.features.hasMaps && (
                <Route path="/places/:id" element={<PlaceDetailPage />} />
              )}
              
              <Route path="/users" element={<UsersPage />} />
            </Route>

            {APP_CONFIG.features.hasMaps && (
              <Route element={<FullScreenLayout />}>
                <Route path="/maps" element={<MapsPage />} />
              </Route>
            )}

            {APP_CONFIG.features.hasChat && (
              <Route element={<ChatLayout />}>
                <Route path="/messages/:userId" element={<ChatPage />} />
              </Route>
            )}
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
      
      {/* Global Toast Provider */}
      <Toaster 
        theme={APP_CONFIG.theme.defaultMode} 
        position="top-center" 
        toastOptions={{
          className: APP_CONFIG.theme.glassMode ? 'glass-panel !border-glass-border' : '',
        }}
      />
    </>
  );
}

export default App;
