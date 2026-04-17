import { Outlet } from 'react-router-dom';
import { Header } from './Header';

export function ChatLayout() {
  return (
    <div className="h-[100dvh] w-screen overflow-hidden bg-background text-text">
      <Header />
      {/* Messages content fills the space from Header (16) to bottom of screen (0) */}
      <div className="absolute inset-0 top-16 bottom-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
