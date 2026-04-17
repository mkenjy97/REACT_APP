import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Toaster } from 'sonner';

// Pages
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

function App() {
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
            </Route>
            <Route element={<FullScreenLayout />}>
              <Route path="/maps" element={<Maps />} />
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
