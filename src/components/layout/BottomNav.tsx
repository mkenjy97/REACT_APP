
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Search, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useTranslation();

  const links = [
    { to: '/', icon: Home, label: t('navigation.home') },
    { to: '/search', icon: Search, label: t('navigation.search') },
    { to: '/support', icon: HelpCircle, label: t('navigation.support') },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 z-50 pb-safe sm:pb-0 glass-panel !rounded-none !border-b-0 !border-l-0 !border-r-0">
      <div className="flex h-full items-center justify-around px-2 pb-2">
        {links.map(({ to, icon: Icon, label }) => {
          const isActive = currentPath === to;
          return (
            <NavLink
              key={to}
              to={to}
              className="relative flex flex-col items-center justify-center w-full h-full text-text-muted hover:text-text transition-colors"
              aria-label={label}
            >
              <div className="relative z-10 flex flex-col items-center justify-center pt-2 pb-1">
                <Icon size={24} className={isActive ? 'text-primary-500 dark:text-primary-50' : ''} />
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary-500 dark:text-primary-50' : ''}`}>
                  {label}
                </span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute bg-primary-100/40 dark:bg-primary-500/30 rounded-2xl w-20 h-[64px] z-0"
                  transition={{ type: 'tween', duration: 0.25, ease: 'easeInOut' }}
                />
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
