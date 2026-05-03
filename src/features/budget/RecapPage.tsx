import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, X, Edit2, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { incomeSchema, type IncomeFormData } from '@/validation/budget.schema';
import { toast } from 'sonner';

import { useBudgetStore } from '@/store/useBudgetStore';
import { useAuthStore } from '@/store/useAuthStore';
import { GlassCard, cn } from '@/components/ui/GlassCard';
import { PAGE_VARIANTS, STAGGER_CONTAINER, STAGGER_ITEM } from '@/constants/animations';
import { DEFAULT_CATEGORIES } from '@/types/budget.types';

export function RecapPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { expenses, incomes, settings, addIncome, deleteIncome, updateIncome, privacyMode } = useBudgetStore();

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
  const [editingIncome, setEditingIncome] = useState<string | null>(null);

  const currency = settings?.currency ?? '€';
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // -- Income Form --
  const { register, handleSubmit, reset, watch, setValue } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: 0,
      description: '',
      date: now.toISOString().split('T')[0],
      isExtra: false
    }
  });

  const isExtraVal = watch('isExtra');

  const onIncomeSubmit = async (data: IncomeFormData) => {
    if (!user?.uid) return;
    try {
      if (editingIncome) {
        await updateIncome(editingIncome, data);
        toast.success(t('common.success'));
        setEditingIncome(null);
      } else {
        await addIncome({
          userId: user.uid,
          amount: data.amount,
          description: data.description,
          date: data.date,
          addedBy: user.displayName || user.email || 'Sconosciuto',
          createdAt: Date.now(),
          isExtra: data.isExtra ?? false
        });
        toast.success(t('common.success'));
      }
      reset();
      setShowIncomeForm(false);
    } catch {
      toast.error(t('auth.generic_error'));
    }
  };

  const startEditIncome = (income: any) => {
    setEditingIncome(income.id);
    reset({
      amount: income.amount,
      description: income.description,
      date: income.date,
      isExtra: income.isExtra ?? false
    });
    setShowIncomeForm(true);
  };

  const cancelEdit = () => {
    setEditingIncome(null);
    reset();
    setShowIncomeForm(false);
  };

  // -- Data processing --
  // Current month incomes
  const currentMonthIncomes = incomes.filter(i => i.date.startsWith(currentMonthKey));
  const totalIncomeCurrentMonth = currentMonthIncomes.reduce((acc, i) => acc + i.amount, 0);
  const normalIncomes = currentMonthIncomes.filter(i => !i.isExtra);
  const extraIncomes = currentMonthIncomes.filter(i => i.isExtra);

  // Group expenses by month (YYYY-MM)
  const expensesByMonth = expenses.reduce((acc, e) => {
    const monthKey = e.date.substring(0, 7); // e.g. 2026-05
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(e);
    return acc;
  }, {} as Record<string, typeof expenses>);

  // Sort months descending
  const sortedMonths = Object.keys(expensesByMonth).sort((a, b) => b.localeCompare(a));

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  return (
    <motion.div
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col gap-5 pb-24"
    >
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp size={24} className="text-primary-400" />
          {t('spendless.income_details')}
        </h1>
        <p className="text-sm text-text-muted mt-0.5">{t('spendless.fixed_expenses_subtitle')}</p>
      </div>

      {/* -- ENTRATE MENSILI -- */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest">
            {t('spendless.income_details')} ({now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })})
          </h2>
          <button
            onClick={() => {
              if (showIncomeForm && !editingIncome) setShowIncomeForm(false);
              else {
                setEditingIncome(null);
                reset({ amount: 0, description: '', date: now.toISOString().split('T')[0] });
                setShowIncomeForm(true);
              }
            }}
            className="flex items-center gap-1 text-xs font-bold text-primary-400 bg-primary-500/10 px-2 py-1 rounded-md"
          >
            {showIncomeForm && !editingIncome ? <X size={14} /> : <Plus size={14} />}
            {showIncomeForm && !editingIncome ? t('common.close') : t('common.save')}
          </button>
        </div>

        <GlassCard className="mb-4">
          <p className="text-xs text-text-muted uppercase tracking-widest">{t('spendless.income_details')} {t('spendless.this_month').toLowerCase()}</p>
          <p className={cn("text-3xl font-bold text-primary-400 tabular-nums mt-1", { 'blur-md select-none': privacyMode })}>
            {currency}{totalIncomeCurrentMonth.toFixed(2)}
          </p>
        </GlassCard>

        <AnimatePresence>
          {showIncomeForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <GlassCard className="border-primary-500/30">
                <form onSubmit={handleSubmit(onIncomeSubmit)} className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <input
                      type="number" step="0.01"
                      placeholder={t('spendless.amount')}
                      className="w-1/3 px-3 py-2 rounded-xl bg-glass-bg border border-glass-border focus:outline-none focus:ring-2 focus:ring-primary-400"
                      {...register('amount', { valueAsNumber: true })}
                    />
                    <input
                      type="date"
                      className="w-2/3 px-3 py-2 rounded-xl bg-glass-bg border border-glass-border focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm"
                      {...register('date')}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder={t('spendless.description')}
                    className="w-full px-3 py-2 rounded-xl bg-glass-bg border border-glass-border focus:outline-none focus:ring-2 focus:ring-primary-400"
                    {...register('description')}
                  />
                  <div className="flex items-center justify-between p-2 bg-glass-bg rounded-xl border border-glass-border">
                    <span className="text-sm font-semibold text-text-muted">{t('spendless.is_extra')}</span>
                    <button type="button" onClick={() => setValue('isExtra', !isExtraVal)} className="text-primary-500">
                      {isExtraVal ? <ToggleRight size={32} className="text-primary-400" /> : <ToggleLeft size={32} className="text-text-muted" />}
                    </button>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button type="button" onClick={cancelEdit} className="px-4 py-2 text-sm font-medium rounded-xl glass-button text-text-muted">
                      {t('common.cancel')}
                    </button>
                    <button type="submit" className="px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-primary-400 to-primary-500 text-white">
                      {editingIncome ? t('common.edit') : t('common.save')}
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {currentMonthIncomes.length > 0 && (
          <GlassCard className="!p-0 overflow-hidden">
            <div className="px-4 py-2 bg-glass-bg border-b border-glass-border">
              <span className="text-xs font-bold text-text-muted uppercase">{t('spendless.income_details')}</span>
            </div>
            <div className="px-4">
              {normalIncomes.length === 0 && <p className="text-xs text-text-muted py-3">{t('spendless.no_normal_income')}</p>}
              {normalIncomes.map(inc => (
                <div key={inc.id} className="flex items-center justify-between py-3 border-b border-glass-border last:border-0">
                  <div>
                    <p className="text-sm font-medium">{inc.description}</p>
                    <p className="text-xs text-text-muted">
                      {new Date(inc.date).toLocaleDateString()} • {inc.addedBy}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm font-bold text-primary-400 tabular-nums', { 'blur-sm': privacyMode })}>
                      +{currency}{inc.amount.toFixed(2)}
                    </span>
                    <button onClick={() => startEditIncome(inc)} className="p-1.5 text-text-muted hover:bg-glass-border rounded-full">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => deleteIncome(inc.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-full">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {extraIncomes.length > 0 && (
              <>
                <div className="px-4 py-2 bg-purple-500/10 border-y border-glass-border">
                  <span className="text-xs font-bold text-purple-400 uppercase">{t('spendless.extra_incomes')}</span>
                </div>
                <div className="px-4">
                  {extraIncomes.map(inc => (
                    <div key={inc.id} className="flex items-center justify-between py-3 border-b border-glass-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{inc.description}</p>
                        <p className="text-xs text-text-muted">
                          {new Date(inc.date).toLocaleDateString()} • {inc.addedBy}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-sm font-bold text-purple-400 tabular-nums', { 'blur-sm': privacyMode })}>
                          +{currency}{inc.amount.toFixed(2)}
                        </span>
                        <button onClick={() => startEditIncome(inc)} className="p-1.5 text-text-muted hover:bg-glass-border rounded-full">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteIncome(inc.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-full">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </GlassCard>
        )}
      </section>

      {/* -- STORICO USCITE MENSILI -- */}
      <section className="mt-4">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-3">
          {t('spendless.history')}
        </h2>

        {sortedMonths.length === 0 ? (
          <GlassCard className="text-center py-8">
            <span className="text-4xl">📊</span>
            <p className="text-text-muted mt-2 font-medium">{t('spendless.no_expenses')}</p>
          </GlassCard>
        ) : (
          <motion.div variants={STAGGER_CONTAINER} initial="initial" animate="animate" className="flex flex-col gap-3">
            {sortedMonths.map(monthKey => {
              const monthExpenses = expensesByMonth[monthKey].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
              const monthTotal = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
              const [year, month] = monthKey.split('-');
              const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
              const isExpanded = expandedMonths[monthKey] || false;

              return (
                <motion.div key={monthKey} variants={STAGGER_ITEM}>
                  <GlassCard className="!p-0 overflow-hidden">
                    <button
                      onClick={() => toggleMonth(monthKey)}
                      className="w-full flex items-center justify-between p-4 hover:bg-glass-bg transition-colors text-left"
                    >
                      <div>
                        <h3 className="font-bold capitalize">{monthName}</h3>
                        <p className="text-xs text-text-muted">{monthExpenses.length} {t('spendless.nav_history').toLowerCase()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("font-bold text-red-400 tabular-nums", { 'blur-md': privacyMode })}>
                          -{currency}{monthTotal.toFixed(2)}
                        </span>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                          <ChevronDown size={20} className="text-text-muted" />
                        </motion.div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden border-t border-glass-border"
                        >
                          <div className="p-4 flex flex-col gap-3 bg-black/5">
                            {monthExpenses.map(e => {
                              const cat = DEFAULT_CATEGORIES.find(c => c.name === e.category);
                              return (
                                <div key={e.id} className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-lg">{cat?.icon ?? '📦'}</span>
                                    <div>
                                      <p className="text-sm font-medium">{e.description}</p>
                                      <p className="text-[10px] text-text-muted">
                                        {new Date(e.date).toLocaleDateString()} • {t(`spendless.categories.${e.category}`)} {e.addedBy && `• ${e.addedBy}`}
                                      </p>
                                      {e.isFixed && (
                                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[8px] font-bold uppercase tracking-wider">
                                          {t('spendless.nav_fixed')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className={cn('text-sm font-semibold text-red-400 tabular-nums', { 'blur-sm': privacyMode })}>
                                    -{currency}{e.amount.toFixed(2)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>

    </motion.div>
  );
}
