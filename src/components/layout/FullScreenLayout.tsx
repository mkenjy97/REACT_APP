import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export function FullScreenLayout() {
  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-background text-text">
      <Header />
      {/* Content fills exactly the space between header (64px) and bottom nav (80px) */}
      <div className="absolute inset-0 top-16 bottom-20 overflow-hidden">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
