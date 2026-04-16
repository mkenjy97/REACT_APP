import { GlassCard } from '@/components/ui/GlassCard';
import { useTranslation } from 'react-i18next';
import { Bell, X, CheckCircle2 } from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';
import { motion, AnimatePresence } from 'framer-motion';

export function Notifications() {
  const { t } = useTranslation();
  const { notifications, removeNotification, clearAll } = useNotificationStore();

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-2 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('navigation.notifications')}</h1>
        {notifications.length > 0 && (
          <button 
            onClick={clearAll}
            className="text-sm text-text-muted hover:text-text transition-colors"
          >
            Clear All
          </button>
        )}
      </header>

      <div className="flex flex-col gap-4">
        <AnimatePresence initial={false}>
          {notifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center text-text-muted"
            >
              <CheckCircle2 size={48} className="mb-4 opacity-20" />
              <p>You're all caught up!</p>
            </motion.div>
          ) : (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                layout
                initial={{ opacity: 0, height: 0, scale: 0.8 }}
                animate={{ opacity: 1, height: 'auto', scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.8 }}
                transition={{ opacity: { duration: 0.2 }, layout: { duration: 0.2 } }}
              >
                <GlassCard className="flex gap-4 p-4 relative group">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 shrink-0">
                    <Bell size={20} />
                  </div>
                  <div className="flex-1 pr-6">
                    <h3 className="font-semibold text-lg">{t(notif.titleKey)}</h3>
                    <p className="text-text-muted text-sm mt-1">
                      {t(notif.descKey)}
                    </p>
                    <span className="text-xs font-medium text-primary-500 mt-2 block">
                      {t('notifications_page.hours_ago', { count: Number(notif.timeLabel) })}
                    </span>
                  </div>
                  <button
                    onClick={() => removeNotification(notif.id)}
                    className="absolute top-4 right-4 text-text-muted hover:text-text transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Remove notification"
                  >
                    <X size={18} />
                  </button>
                </GlassCard>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
