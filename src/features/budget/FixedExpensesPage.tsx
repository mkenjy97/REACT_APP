import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, RepeatIcon, ChevronLeft, Calculator, TrendingUp } from 'lucide-react';
import { useBudgetStore } from '@/store/useBudgetStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { PAGE_VARIANTS, TRANSITIONS } from '@/constants/animations';
import { type Income } from '@/types/budget.types';
import { cn } from '@/components/ui/GlassCard';
import { FixedIncomeRow } from './FixedIncomeRow';
import { FixedExpenseRow } from './FixedExpenseRow';


 // ─── Fixed Expenses Page ──────────────────────────────────────────────────────
export function FixedExpensesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { expenses, incomes, deleteExpense, updateExpense, updateIncome, settings, deleteIncome } = useBudgetStore();
  const [groupBy, setGroupBy] = useState<'financing' | 'account' | 'category'>('financing');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFabMenu, setShowFabMenu] = useState(false);

  const currency = settings?.currency ?? '€';
  const monthKey = new Date().toISOString().substring(0, 7);

  const fixedExpenses = expenses.filter(e => e.isFixed);
  const activeFixedExpenses = fixedExpenses.filter(e => !e.startDate || e.startDate.substring(0, 7) <= monthKey);
  const totalFixed = activeFixedExpenses.reduce((s, e) => s + e.amount, 0);

  // ── Fixed incomes (new section) ───────────────────────────────────────────
  const fixedIncomes = useMemo(() => incomes.filter(i => i.isFixed), [incomes]);
  const activeFixedIncomes = useMemo(() => fixedIncomes.filter(i => i.date.substring(0, 7) <= monthKey), [fixedIncomes, monthKey]);
  const totalFixedIncome = useMemo(() => activeFixedIncomes.reduce((s, i) => s + i.amount, 0), [activeFixedIncomes]);



  const groupedFixedExpenses = fixedExpenses.reduce((acc, expense) => {
    let key = t('spendless.categories.altro');
    if (groupBy === 'financing') {
      key = expense.isFinancing ? t('spendless.group_financing') : t('spendless.non_financing');
    }
    else if (groupBy === 'category') {
      key = t(`spendless.categories.${expense.category}`) || t('spendless.categories.altro');
    } else if (groupBy === 'account') {
      key = expense.accountSource || t('spendless.categories.altro');
    }
    if (!acc[key]) acc[key] = [];
    acc[key].push(expense);
    return acc;
  }, {} as Record<string, typeof expenses>);



  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('auth.generic_error'));
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      const partialExpense = { ...data };

      // Sanitize NaNs
      if (typeof partialExpense.billingDay === 'number' && isNaN(partialExpense.billingDay)) delete partialExpense.billingDay;
      if (typeof partialExpense.totalFinanced === 'number' && isNaN(partialExpense.totalFinanced)) delete partialExpense.totalFinanced;
      if (typeof partialExpense.totalInstallments === 'number' && isNaN(partialExpense.totalInstallments)) delete partialExpense.totalInstallments;
      if (typeof partialExpense.currentInstallment === 'number' && isNaN(partialExpense.currentInstallment)) delete partialExpense.currentInstallment;

      await updateExpense(id, partialExpense);
      toast.success(t('common.success'));
    } catch {
      toast.error(t('auth.generic_error'));
    }
  };


  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedExpenses = fixedExpenses.filter(e => selectedIds.has(e.id));
  const selectedTotal = selectedExpenses.reduce((s, e) => s + e.amount, 0);

  return (
    <>
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
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <RepeatIcon size={20} className="text-purple-400" />
              {t('spendless.recurring')}
            </h1>
            <p className="text-xs text-text-muted">{t('spendless.recurring_desc')}</p>
          </div>
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedIds(new Set());
            }}
            className={cn(
              "p-2 rounded-xl transition-all",
              isSelectionMode ? "bg-primary-500 text-white shadow-lg" : "glass-button text-text-muted"
            )}
            aria-label={t('spendless.selection_mode')}
          >
            <Calculator size={20} />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-widest">{t('spendless.fixed_expenses')}</p>
              <p className="text-2xl font-bold text-purple-400 tabular-nums mt-1">
                {currency}{totalFixed.toFixed(2)}
              </p>
              <p className="text-[10px] text-text-muted mt-1">{t('spendless.auto_added')}</p>
            </div>
            <span className="text-4xl">🔄</span>
          </GlassCard>

          <GlassCard className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-widest">{t('spendless.fixed_incomes')}</p>
              <p className="text-2xl font-bold text-primary-400 tabular-nums mt-1">
                {currency}{totalFixedIncome.toFixed(2)}
              </p>
              <p className="text-[10px] text-text-muted mt-1">{t('spendless.auto_added')}</p>
            </div>
            <span className="text-4xl">💰</span>
          </GlassCard>
        </div>


        {/* Recurring incomes */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest">{t('spendless.fixed_incomes')}</h2>
          </div>

          <GlassCard className="mt-2">
            {fixedIncomes.length === 0 ? (
              <p className="text-xs text-text-muted">{t('spendless.no_fixed_incomes')}</p>
            ) : (
              <div className="flex flex-col">
                {fixedIncomes
                  .slice()
                  .sort((a, b) => b.amount - a.amount)
                  .map((inc) => (
                    <FixedIncomeRow
                      key={inc.id}
                      inc={inc}
                      currency={currency}
                      onDelete={deleteIncome}
                      onEdit={async (id: string, data: Partial<Income>) => {
                        try {
                          await updateIncome(id, data);
                          toast.success(t('common.success'));
                        } catch {
                          toast.error(t('auth.generic_error'));
                        }
                      }}
                    />
                  ))}
              </div>
            )}
          </GlassCard>
        </section>

        

        {/* Grouping Toggle */}
        {fixedExpenses.length > 0 && (
          <div className="flex bg-glass-bg border border-glass-border rounded-xl p-1 gap-1">
            <button
              onClick={() => setGroupBy('financing')}
              className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold transition", groupBy === 'financing' ? 'bg-primary-500/20 text-primary-400' : 'text-text-muted hover:bg-glass-border')}
            >
              {t('spendless.group_financing')}
            </button>
            <button
              onClick={() => setGroupBy('account')}
              className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold transition", groupBy === 'account' ? 'bg-primary-500/20 text-primary-400' : 'text-text-muted hover:bg-glass-border')}
            >
              {t('spendless.group_account')}
            </button>
            <button
              onClick={() => setGroupBy('category')}
              className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold transition", groupBy === 'category' ? 'bg-primary-500/20 text-primary-400' : 'text-text-muted hover:bg-glass-border')}
            >
              {t('spendless.group_category')}
            </button>
          </div>
        )}

        {/* List */}
        <GlassCard>
          <AnimatePresence>
            {fixedExpenses.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 text-text-muted"
              >
                <p className="text-4xl mb-3">📋</p>
                <p className="font-medium">{t('spendless.no_fixed')}</p>
                <p className="text-xs">{t('spendless.add_fixed_hint')}</p>
              </motion.div>
            )}
            {Object.entries(groupedFixedExpenses)
              .sort(([a], [b]) => {
                if (groupBy === 'financing') return a === t('spendless.group_financing') ? -1 : 1;
                return a.localeCompare(b);
              })
              .map(([label, groupExpenses]) => (
                <div key={label} className="mb-4 last:mb-0">
                  <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2 px-1">{label}</h3>
                  {groupExpenses
                    .sort((a, b) => (groupBy === 'financing' ? b.amount - a.amount : 0))
                    .map(e => (
                      <FixedExpenseRow
                        key={e.id}
                        expense={e}
                        currency={currency}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedIds.has(e.id)}
                        onToggleSelect={toggleSelect}
                      />
                    ))}
                </div>
              ))}
          </AnimatePresence>




      </GlassCard>

      </motion.div>

      {/* ── FAB ── */}
      <AnimatePresence>
        {showFabMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[55]"
            onClick={() => setShowFabMenu(false)}
          >
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFabMenu && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={TRANSITIONS.spring}
            className="fixed bottom-40 right-5 z-[60] flex flex-col gap-2"
          >
            <button
              onClick={() => {
                setShowFabMenu(false);
                navigate('/add-fixed-expense');
              }}
              className="px-4 py-2.5 rounded-xl glass-button text-sm font-bold flex items-center gap-2"
            >
              <RepeatIcon size={16} className="text-purple-400" />
              {t('spendless.add_fixed')}
            </button>
            <button
              onClick={() => {
                setShowFabMenu(false);
                navigate('/add-fixed-income');
              }}
              className="px-4 py-2.5 rounded-xl glass-button text-sm font-bold flex items-center gap-2"
            >
              <TrendingUp size={16} className="text-primary-400" />
              {t('spendless.fixed_incomes') || t('spendless.add_income')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setShowFabMenu((s) => !s)}
        className="fixed bottom-24 right-5 z-[70] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={TRANSITIONS.bounce}
        aria-label={t('common.manage')}
        id="fab-add-fixed-expense"
      >
        <motion.div animate={{ rotate: showFabMenu ? 45 : 0 }} transition={{ duration: 0.15 }}>
          <Plus size={26} strokeWidth={2.5} />
        </motion.div>
      </motion.button>

      {/* Floating Selection Sum Bar (Fixed at bottom) */}
      <AnimatePresence>
        {isSelectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-24 left-4 right-4 z-[60]"
          >
            <GlassCard className="!p-4 bg-primary-500/20 border-primary-500/40 backdrop-blur-xl shadow-2xl flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">{t('spendless.selected_count', { count: selectedIds.size })}</span>
                <span className="text-xs text-text-muted">{t('spendless.total_selected')}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-primary-400 tabular-nums">
                  {currency}{selectedTotal.toFixed(2)}
                </span>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
