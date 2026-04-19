import { useEffect, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export function HomePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="mb-4">
        <h1 className="text-3xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-text-muted mt-1">{t('dashboard.subtitle')}</p>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GlassCard className="h-40 flex flex-col gap-4">
            <Skeleton className="w-1/3 h-6" />
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-1/2 h-4" />
          </GlassCard>
          <GlassCard className="h-40 flex flex-col gap-4">
            <Skeleton className="w-1/3 h-6" />
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-1/2 h-4" />
          </GlassCard>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {[1, 2, 3, 4].map((i) => (
            <motion.div key={i} variants={item}>
              <GlassCard className="h-40 hover:-translate-y-1 transition-transform cursor-pointer flex flex-col">
                <h3 className="font-semibold text-lg mb-2">{t('dashboard.item_title')} {i}</h3>
                <p className="text-text-muted text-sm line-clamp-2">
                  {t('dashboard.item_desc')}
                </p>
                <div className="mt-auto flex items-center justify-between text-xs font-medium text-primary-500 pt-4">
                  <span>{t('dashboard.view_details')}</span>
                  <span>&rarr;</span>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
