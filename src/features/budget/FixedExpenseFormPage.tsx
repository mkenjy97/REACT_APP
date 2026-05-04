import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ChevronLeft, ToggleLeft, ToggleRight, Loader2, RepeatIcon } from 'lucide-react';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useAuthStore } from '@/store/useAuthStore';
import { expenseSchema, type ExpenseFormData } from '@/validation/budget.schema';
import { GlassCard } from '@/components/ui/GlassCard';
import { PAGE_VARIANTS } from '@/constants/animations';
import { DEFAULT_CATEGORIES } from '@/types/budget.types';
import { cn } from '@/components/ui/GlassCard';

export function FixedExpenseFormPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { addExpense, expenses } = useBudgetStore();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: undefined,
      category: 'casa',
      description: '',
      isFixed: true,
      startDate: new Date().toISOString().split('T')[0],
      isFinancing: false,
    },
  });

  const isFinancingVal = watch('isFinancing');
  const uniqueAccounts = Array.from(new Set(expenses.map(e => e.accountSource).filter(Boolean))) as string[];

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user?.uid) return;

    try {
      await addExpense({
        userId: user.uid,
        amount: data.amount,
        category: data.category,
        date: new Date().toISOString().split('T')[0],
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        description: data.description,
        isFixed: true,
        billingDay: (typeof data.billingDay === 'number' && !isNaN(data.billingDay)) ? data.billingDay : undefined,
        accountSource: data.accountSource ?? undefined,
        isFinancing: data.isFinancing ?? false,
        totalFinanced: (data.isFinancing && typeof data.totalFinanced === 'number' && !isNaN(data.totalFinanced)) ? data.totalFinanced : undefined,
        totalInstallments: (data.isFinancing && typeof data.totalInstallments === 'number' && !isNaN(data.totalInstallments)) ? data.totalInstallments : undefined,
        currentInstallment: (data.isFinancing && typeof data.currentInstallment === 'number' && !isNaN(data.currentInstallment)) ? data.currentInstallment : undefined,
        addedBy: user.displayName || user.email || t('common.loading'),
        createdAt: Date.now(),
      });

      toast.success(t('spendless.fixed_expense_added') || t('common.success'));
      navigate('/fixed-expenses');
    } catch {
      toast.error(t('auth.generic_error'));
    }
  };

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col gap-5 pb-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(-1)} className="p-2 glass-button" aria-label={t('common.back')}>
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <RepeatIcon size={20} className="text-purple-400" />
            {t('spendless.add_fixed')}
          </h1>
          <p className="text-xs text-text-muted">{t('spendless.fixed_expenses_subtitle')}</p>
        </div>
      </div>

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

        {/* Category */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-text-muted pl-1">{t('spendless.category')}</label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <div className="grid grid-cols-5 gap-2">
                {DEFAULT_CATEGORIES.map(cat => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => field.onChange(cat.name)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all text-xs font-medium',
                      field.value === cat.name
                        ? 'border-transparent ring-2 ring-purple-400 bg-purple-100/30 scale-105'
                        : 'border-glass-border bg-glass-bg'
                    )}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-[9px] leading-tight text-center capitalize">{t(`spendless.categories.${cat.name}`)}</span>
                  </button>
                ))}
              </div>
            )}
          />
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

        {/* Start Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-muted pl-1">{t('spendless.start_date') || 'Data Inizio'}</label>
          <input
            type="date"
            className={cn(
              'w-full px-4 py-3 rounded-2xl bg-glass-bg border focus:outline-none focus:ring-2 focus:ring-purple-400 transition',
              errors.startDate ? 'border-red-500' : 'border-glass-border'
            )}
            {...register('startDate')}
          />
          {errors.startDate && <p className="text-xs text-red-400 pl-1">{errors.startDate.message}</p>}
        </div>

        {/* Billing Day & Account */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-muted pl-1">{t('spendless.date')} (1-31)</label>
            <input
              type="number"
              min="1"
              max="31"
              placeholder="es. 15"
              className="w-full px-4 py-3 rounded-2xl bg-glass-bg border border-glass-border focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm"
              {...register('billingDay', { valueAsNumber: true })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-muted pl-1">{t('spendless.group_account')}</label>
            <input
              type="text"
              list="account-suggestions"
              placeholder="es. Unicredit"
              className="w-full px-4 py-3 rounded-2xl bg-glass-bg border border-glass-border focus:outline-none focus:ring-2 focus:ring-purple-400 transition text-sm"
              {...register('accountSource')}
            />
            <datalist id="account-suggestions">
              {uniqueAccounts.map(a => <option key={a} value={a} />)}
            </datalist>
          </div>
        </div>

        {/* Financing Section */}
        <div className="flex flex-col gap-3">
          <GlassCard className="!p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{t('spendless.is_financing')}</p>
              <p className="text-xs text-text-muted">{t('spendless.recurring_desc')}</p>
            </div>
            <Controller
              control={control}
              name="isFinancing"
              render={({ field }) => (
                <button type="button" onClick={() => field.onChange(!field.value)} className="text-purple-500">
                  {field.value
                    ? <ToggleRight size={36} className="text-purple-400" />
                    : <ToggleLeft size={36} className="text-text-muted" />
                  }
                </button>
              )}
            />
          </GlassCard>

          <AnimatePresence>
            {isFinancingVal && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <GlassCard className="!p-4 flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] text-text-muted mb-1 block uppercase font-bold">{t('spendless.total_financed')} (€)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        {...register('totalFinanced', { valueAsNumber: true })} 
                        className="w-full px-3 py-2 rounded-xl bg-glass-bg border border-glass-border text-sm focus:ring-2 focus:ring-purple-400" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted mb-1 block uppercase font-bold">{t('spendless.total_installments')}</label>
                      <input 
                        type="number" 
                        {...register('totalInstallments', { valueAsNumber: true })} 
                        className="w-full px-3 py-2 rounded-xl bg-glass-bg border border-glass-border text-sm focus:ring-2 focus:ring-purple-400" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted mb-1 block uppercase font-bold">{t('spendless.current_installment')}</label>
                      <input 
                        type="number" 
                        {...register('currentInstallment', { valueAsNumber: true })} 
                        className="w-full px-3 py-2 rounded-xl bg-glass-bg border border-glass-border text-sm focus:ring-2 focus:ring-purple-400" 
                      />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
        >
          {isSubmitting && <Loader2 size={18} className="animate-spin" />}
          {t('common.save')}
        </motion.button>
      </form>
    </motion.div>
  );
}
