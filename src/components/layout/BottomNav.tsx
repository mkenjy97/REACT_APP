import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/Icon';
import type { IconName } from '@/components/ui/Icon';
import { APP_CONFIG } from '@/config/app.config';
import { TRANSITIONS } from '@/constants/animations';

type NavLinkItem = {
  to: string;
  icon: IconName;
  label: string;
  enabled: boolean;
};

export function BottomNav() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { t } = useTranslation();

  const links: NavLinkItem[] = [
    { to: '/', icon: 'Home', label: t('navigation.home'), enabled: true },
    { to: '/search', icon: 'Search', label: t('navigation.search'), enabled: APP_CONFIG.features.hasSearch },
    { to: '/maps', icon: 'Map', label: t('navigation.maps'), enabled: APP_CONFIG.features.hasMaps },
    { to: '/users', icon: 'User', label: t('navigation.users', { defaultValue: 'Utenti' }), enabled: true },
    { to: '/support', icon: 'Support', label: t('navigation.support'), enabled: APP_CONFIG.features.hasSupport },
  ];

  const activeLinks = links.filter(link => link.enabled);

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 z-50 pb-safe sm:pb-0 glass-panel !rounded-none !border-b-0 !border-l-0 !border-r-0">
      <div className="flex h-full items-center justify-around px-2 pb-2">
        {activeLinks.map(({ to, icon, label }) => {
          const isActive = to === '/maps'
            ? currentPath.startsWith('/maps')
            : (to === '/' ? currentPath === '/' : currentPath.startsWith(to));
            
          return (
            <NavLink
              key={to}
              to={to}
              className="relative flex flex-col items-center justify-center w-full h-full text-text-muted hover:text-text transition-colors"
              aria-label={label}
            >
              <div className="relative z-10 flex flex-col items-center justify-center pt-2 pb-1">
                <Icon 
                  name={icon} 
                  size={24} 
                  className={isActive ? 'text-primary-500 dark:text-primary-50' : ''} 
                />
                <span className={`text-[10px] mt-1 font-medium ${isActive ? 'text-primary-500 dark:text-primary-50' : ''}`}>
                  {label}
                </span>
              </div>
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute bg-primary-100/40 dark:bg-primary-500/30 rounded-2xl w-20 h-[64px] z-0"
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
