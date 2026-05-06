import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Printer, TrendingUp } from 'lucide-react';

import { useBudgetStore } from '@/store/useBudgetStore';
import { GlassCard, cn } from '@/components/ui/GlassCard';
import { PAGE_VARIANTS, STAGGER_CONTAINER, STAGGER_ITEM } from '@/constants/animations';
import { DEFAULT_CATEGORIES } from '@/types/budget.types';

export function RecapPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { expenses, incomes, settings, privacyMode } = useBudgetStore();

  const [expandedExpenseMonths, setExpandedExpenseMonths] = useState<Record<string, boolean>>({});
  const [expandedIncomeMonths, setExpandedIncomeMonths] = useState<Record<string, boolean>>({});

  const currency = settings?.currency ?? '€';
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Current month incomes
  const currentMonthIncomes = incomes.filter(i => i.date.startsWith(currentMonthKey));
  const totalIncomeCurrentMonth = currentMonthIncomes.reduce((acc, i) => acc + i.amount, 0);
  const normalIncomes = currentMonthIncomes.filter(i => !i.isExtra);
  const extraIncomes = currentMonthIncomes.filter(i => i.isExtra);
  const totalNormalCurrentMonth = normalIncomes.reduce((acc, i) => acc + i.amount, 0);
  const totalExtraCurrentMonth = extraIncomes.reduce((acc, i) => acc + i.amount, 0);

  // Group incomes by month
  const incomesByMonth = incomes.reduce((acc, i) => {
    const monthKey = i.date.substring(0, 7);
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(i);
    return acc;
  }, {} as Record<string, typeof incomes>);

  const sortedIncomeMonths = Object.keys(incomesByMonth).sort((a, b) => b.localeCompare(a));

  // Group expenses by month (YYYY-MM)
  const expensesByMonth = expenses.reduce((acc, e) => {
    const monthKey = e.date.substring(0, 7); // e.g. 2026-05
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(e);
    return acc;
  }, {} as Record<string, typeof expenses>);

  // Sort months descending
  const sortedMonths = Object.keys(expensesByMonth).sort((a, b) => b.localeCompare(a));

  const toggleExpenseMonth = (month: string) => {
    setExpandedExpenseMonths(prev => ({ ...prev, [month]: !prev[month] }));
  };

  const toggleIncomeMonth = (month: string) => {
    setExpandedIncomeMonths(prev => {
      const isForcedOpen = month === currentMonthKey && prev[month] === undefined;
      // allow first render open, but once user interacts we must be able to close it
      const currentVal = isForcedOpen ? true : !!prev[month];
      return { ...prev, [month]: !currentVal };
    });
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
      <div className="pt-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp size={24} className="text-primary-400" />
            {t('spendless.nav_recap')}
          </h1>
          <p className="text-sm text-text-muted mt-0.5">{t('spendless.fixed_expenses_subtitle')}</p>
        </div>

        <button
          onClick={() => navigate('/export')}
          className="p-2 rounded-xl transition-all glass-button text-text-muted shrink-0"
          aria-label={t('profile.export_data')}
        >
          <Printer size={20} />
        </button>
      </div>

      {/* -- ENTRATE + SPESE MENSILI -- */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest">
            {t('spendless.nav_recap')} ({now.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })})
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <GlassCard>
            <p className="text-xs text-text-muted uppercase tracking-widest">
              {t('spendless.income_details')} {t('spendless.this_month').toLowerCase()}
            </p>
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className={cn("text-3xl font-bold text-primary-400 tabular-nums", { 'blur-md select-none': privacyMode })}>
                {currency}{totalIncomeCurrentMonth.toFixed(2)}
              </p>
              <div className={cn("flex flex-col text-[10px] items-end leading-tight text-text-muted", { 'blur-sm': privacyMode })}>
                <span>{t('spendless.normal_incomes')}: {currency}{totalNormalCurrentMonth.toFixed(2)}</span>
                <span className="text-purple-400 font-medium">{t('spendless.extra_incomes')}: {currency}{totalExtraCurrentMonth.toFixed(2)}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-xs text-text-muted uppercase tracking-widest">
              {t('spendless.history')} {t('spendless.this_month').toLowerCase()}
            </p>
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className={cn("text-3xl font-bold text-red-400 tabular-nums", { 'blur-md select-none': privacyMode })}>
                {currency}{(expensesByMonth[currentMonthKey]?.reduce((acc, e) => acc + e.amount, 0) ?? 0).toFixed(2)}
              </p>
              <div className={cn("flex flex-col text-[10px] items-end leading-tight text-text-muted", { 'blur-sm': privacyMode })}>
                <span>{(expensesByMonth[currentMonthKey]?.length ?? 0)} {t('spendless.nav_history').toLowerCase()}</span>
              </div>
            </div>
          </GlassCard>
        </div>


        <motion.div variants={STAGGER_CONTAINER} initial="initial" animate="animate" className="flex flex-col gap-3">
          {sortedIncomeMonths.map(monthKey => {
            const monthIncomes = incomesByMonth[monthKey].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const monthTotal = monthIncomes.reduce((acc, i) => acc + i.amount, 0);
            const [year, month] = monthKey.split('-');
            const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const monthName = monthDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
            const isExpanded = expandedIncomeMonths[monthKey] ?? (monthKey === currentMonthKey);

            return (
              <motion.div key={monthKey} variants={STAGGER_ITEM}>
                <GlassCard className="!p-0 overflow-hidden">
                  <button
                    onClick={() => toggleIncomeMonth(monthKey)}
                    className="w-full flex items-center justify-between p-4 hover:bg-glass-bg transition-colors text-left"
                  >
                    <div>
                      <h3 className="font-bold capitalize">{monthName}</h3>
                      <p className="text-xs text-text-muted">{monthIncomes.length} {t('spendless.income_details').toLowerCase()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("font-bold text-primary-400 tabular-nums", { 'blur-md': privacyMode })}>
                        +{currency}{monthTotal.toFixed(2)}
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
                          {monthIncomes.map(inc => (
                            <div key={inc.id} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", inc.isExtra ? "bg-purple-500/20" : "bg-primary-500/20")}>
                                  <TrendingUp size={16} className={inc.isExtra ? "text-purple-400" : "text-primary-400"} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{inc.description}</p>
                                  <p className="text-[10px] text-text-muted truncate">
                                    {new Date(inc.date).toLocaleDateString()} • {inc.addedBy}
                                  </p>
                                  {inc.isExtra && (
                                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[8px] font-bold uppercase tracking-wider">
                                      {t('spendless.badge_extra')}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={cn('text-sm font-semibold tabular-nums shrink-0', inc.isExtra ? "text-purple-400" : "text-primary-400", { 'blur-sm': privacyMode })}>
                                  +{currency}{inc.amount.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
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
              const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
              const monthName = monthDate.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' });
              const isExpanded = expandedExpenseMonths[monthKey] || false;

              return (
                <motion.div key={monthKey} variants={STAGGER_ITEM}>
                  <GlassCard className="!p-0 overflow-hidden">
                    <button
                      onClick={() => toggleExpenseMonth(monthKey)}
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
                                <div key={e.id} className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="text-lg shrink-0">{cat?.icon ?? '📦'}</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{e.description}</p>
                                      <p className="text-[10px] text-text-muted truncate">
                                        {new Date(e.date).toLocaleDateString()} • {t(`spendless.categories.${e.category}`)} {e.addedBy && `• ${e.addedBy}`}
                                      </p>
                                      {e.isFixed && (
                                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-400 text-[8px] font-bold uppercase tracking-wider">
                                          {t('spendless.nav_fixed')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className={cn('text-sm font-semibold text-red-400 tabular-nums shrink-0', { 'blur-sm': privacyMode })}>
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
