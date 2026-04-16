
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="text-center flex flex-col items-center"
      >
        <div className="w-24 h-24 mb-6 rounded-full bg-glass-bg border-4 border-glass-border flex items-center justify-center shadow-xl">
          <AlertCircle size={48} className="text-primary-500" />
        </div>
        
        <h1 className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary-400 to-primary-200">
          404
        </h1>
        <h2 className="text-2xl font-bold mt-4 tracking-tight">{t('not_found.title')}</h2>
        <p className="text-text-muted mt-2 max-w-sm mx-auto mb-8">
          {t('not_found.desc')}
        </p>

        <Button onClick={() => navigate('/')} size="lg">
          {t('not_found.back')}
        </Button>
      </motion.div>
    </div>
  );
}
