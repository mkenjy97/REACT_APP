import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, History, RepeatIcon, TrendingUp } from 'lucide-react';
import { TRANSITIONS } from '@/constants/animations';

type NavItem = {
  to: string;
  icon: React.ElementType;
  label: string;
};

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useTranslation();

  const links: NavItem[] = [
    { to: '/',                icon: LayoutDashboard, label: t('spendless.nav_dashboard') },
    { to: '/history',         icon: History,         label: t('spendless.nav_history') },
    { to: '/fixed-expenses',  icon: RepeatIcon,      label: t('spendless.nav_fixed') },
    { to: '/recap',           icon: TrendingUp,      label: 'Recap' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 z-50 pb-safe sm:pb-0 glass-panel !rounded-none !border-b-0 !border-l-0 !border-r-0">
      <div className="flex h-full items-center justify-around px-2 pb-2">
        {links.map(({ to, icon: NavIcon, label }) => {
          const isActive = to === '/'
            ? currentPath === '/'
            : currentPath.startsWith(to);

          return (
            <NavLink
              key={to}
              to={to}
              className="relative flex flex-col items-center justify-center w-full h-full text-text-muted hover:text-text transition-colors"
              aria-label={label}
            >
              <div className="relative z-10 flex flex-col items-center justify-center pt-2 pb-1">
                <NavIcon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? 'text-primary-400' : ''}
                />
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary-400' : ''}`}>
                  {label}
                </span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute bg-primary-500/15 rounded-2xl w-20 h-[64px] z-0"
                  transition={TRANSITIONS.spring}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
