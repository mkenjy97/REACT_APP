import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Icon } from '@/components/ui/Icon';
import { APP_CONFIG } from '@/config/app.config';

export function Header() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const notificationsCount = useNotificationStore((state) => state.notifications.length + state.unreadChatCount);
  const { appName, appIconUrl } = useThemeStore();

  const borderColors = {
    Admin: 'border-amber-400',
    Manager: 'border-slate-400',
    User: 'border-primary-400',
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-50 glass-panel !rounded-none !border-t-0 !border-l-0 !border-r-0 flex items-center justify-between px-4 sm:px-6">
      {/* Left side — dynamic branding */}
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-200 to-primary-400 flex items-center justify-center text-white overflow-hidden shrink-0" aria-hidden="true">
          {appIconUrl ? (
            <img src={appIconUrl} alt="app icon" className="w-full h-full object-cover" />
          ) : (
            <Icon name="Home" size={16} />
          )}
        </div>
        <span className="font-bold text-lg text-text tracking-tight">{appName || APP_CONFIG.name || t('app_name')}</span>
      </Link>

      <div className="flex items-center gap-4">
        {APP_CONFIG.features.hasNotifications && (
          <Link to="/notifications" className="relative p-2 rounded-full hover:bg-glass-bg transition-colors" aria-label="Notifications">
            <Icon name="Notifications" size={20} className="text-text-muted" />
            {notificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            )}
          </Link>
        )}

        {user && (
          <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {user.role !== 'User' && (
              <div className="hidden sm:block">
                <RoleBadge role={user.role} />
              </div>
            )}
            <div
              className={`w-9 h-9 rounded-full border-2 overflow-hidden bg-surface flex items-center justify-center ${borderColors[user.role]}`}
            >
              <span className="text-xs font-bold text-text-muted uppercase">
                {user?.displayName?.substring(0, 2) || user?.email?.substring(0, 2) || 'U'}
              </span>
            </div>
          </Link>
        )}
      </div>
    </header>
  );
}
