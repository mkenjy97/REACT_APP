import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronLeft, Loader2, RepeatIcon } from 'lucide-react';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useAuthStore } from '@/store/useAuthStore';
import { incomeSchema, type IncomeFormData } from '@/validation/budget.schema';
import { GlassCard } from '@/components/ui/GlassCard';
import { PAGE_VARIANTS } from '@/constants/animations';
import { cn } from '@/components/ui/GlassCard';

export function FixedIncomeFormPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { addIncome } = useBudgetStore();

  const today = new Date().toISOString().split('T')[0];
  const thisMonthKey = new Date().toISOString().substring(0, 7);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: 0,
      description: '',
      date: today,
      isExtra: false,
    },
  });

  const onSubmit = async (data: IncomeFormData) => {
    if (!user?.uid) return;

    try {
      // For recurring incomes we store the selected "billing day" inside `date`
      // as YYYY-MM-DD using the current month, so later we can read `date.substring(8,10)`
      // to replicate every month.
      const repeatingDay = data.date.substring(8, 10);
      const normalizedDate = `${thisMonthKey}-${repeatingDay}`;

      await addIncome({
        userId: user.uid,
        amount: data.amount,
        description: data.description,
        date: normalizedDate,
        addedBy: user.displayName || user.email || t('common.loading'),
        createdAt: Date.now(),
        isExtra: false,
        isFixed: true,
      });
      toast.success(t('common.success'));
      navigate('/fixed-expenses');
    } catch {
      toast.error(t('auth.generic_error'));
    }
  };

  return (
    <motion.div variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-5 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(-1)} className="p-2 glass-button" aria-label={t('common.back')}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <RepeatIcon size={20} className="text-purple-400" />
            {t('spendless.fixed_incomes') || 'Entrate fisse'}
          </h1>
          <p className="text-xs text-text-muted">{t('spendless.recurring_desc')}</p>
        </div>
      </div>

      <GlassCard className="!p-4">
        <form onSubmit={handleSubmit(onSubmit as any)} className="flex flex-col gap-4">
          {/* Amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-muted pl-1">{t('spendless.amount')}</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-muted pointer-events-none">€</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                placeholder="0.00"
                className={cn(
                  'w-full pl-8 pr-4 py-3.5 rounded-2xl bg-glass-bg border text-2xl font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-purple-400 transition',
                  errors.amount ? 'border-red-500' : 'border-glass-border'
                )}
                {...register('amount', { valueAsNumber: true })}
              />
            </div>
            {errors.amount && <p className="text-xs text-red-400 pl-1">{errors.amount.message}</p>}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-muted pl-1">{t('spendless.description')}</label>
            <input
              type="text"
              placeholder={t('spendless.description')}
              className={cn(
                'w-full px-4 py-3 rounded-2xl bg-glass-bg border focus:outline-none focus:ring-2 focus:ring-purple-400 transition',
                errors.description ? 'border-red-500' : 'border-glass-border'
              )}
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-red-400 pl-1">{errors.description.message}</p>}
          </div>

          {/* Repeat day (monthly) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-muted pl-1">{t('spendless.date')}</label>
            <input
              type="number"
              min={1}
              max={31}
              inputMode="numeric"
              className={cn(
                'w-full px-4 py-3 rounded-2xl bg-glass-bg border focus:outline-none focus:ring-2 focus:ring-purple-400 transition',
                errors.date ? 'border-red-500' : 'border-glass-border'
              )}
              {...register('date', {
                setValueAs: (v) => {
                  const day = String(v ?? '').padStart(2, '0');
                  return `${thisMonthKey}-${day}`;
                },
              })}
            />
            <p className="text-[10px] text-text-muted pl-1">{t('spendless.recurring_desc')}</p>
            {errors.date && <p className="text-xs text-red-400 pl-1">{errors.date.message}</p>}
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            {t('common.save')}
          </motion.button>
        </form>
      </GlassCard>
    </motion.div>
  );
}
