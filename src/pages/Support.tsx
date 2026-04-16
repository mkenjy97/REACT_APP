import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ChevronDown, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export function Support() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t } = useTranslation();

  const faqs = [
    { question: t('support.faq.q1'), answer: t('support.faq.a1') },
    { question: t('support.faq.q2'), answer: t('support.faq.a2') },
    { question: t('support.faq.q3'), answer: t('support.faq.a3') },
  ];

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto">
      <div className="text-center mt-4">
        <h1 className="text-3xl font-bold">{t('support.title')}</h1>
        <p className="text-text-muted mt-2">{t('support.subtitle')}</p>
      </div>

      <div className="flex flex-col gap-3">
        {faqs.map((faq, idx) => (
          <GlassCard key={idx} className="p-1 overflow-hidden transition-all">
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="flex w-full items-center justify-between p-4 text-left font-medium outline-none"
            >
              <span className="text-lg">{faq.question}</span>
              <ChevronDown
                size={20}
                className={`text-text-muted transition-transform duration-300 ${
                  openIndex === idx ? 'rotate-180' : ''
                }`}
              />
            </button>
            <AnimatePresence initial={false}>
              {openIndex === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <div className="px-4 pb-4 text-text-muted leading-relaxed border-t border-glass-border/50 pt-3 flex-wrap">
                    {faq.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        ))}
      </div>

      <div className="mt-8 border-t border-glass-border pt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlassCard className="flex flex-col items-center justify-center p-6 text-center hover:bg-glass-border transition-colors cursor-pointer group">
          <Mail size={32} className="mb-3 text-primary-500 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-lg">{t('support.email_us')}</h3>
          <p className="text-text-muted text-sm mt-1">support@baseapp.com</p>
        </GlassCard>
        <GlassCard className="flex flex-col items-center justify-center p-6 text-center hover:bg-glass-border transition-colors cursor-pointer group">
          <Phone size={32} className="mb-3 text-primary-500 group-hover:scale-110 transition-transform" />
          <h3 className="font-semibold text-lg">{t('support.call_us')}</h3>
          <p className="text-text-muted text-sm mt-1">+1 (800) 123-4567</p>
        </GlassCard>
      </div>
    </div>
  );
}
