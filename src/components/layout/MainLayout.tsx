
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <Header />
      {/* Main content area, padded for header and bottom nav */}
      <main className="flex-1 w-full max-w-4xl mx-auto pt-20 pb-24 px-4 pb-safe-bottom">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
