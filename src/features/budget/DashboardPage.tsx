import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBudgetStore, getMonthKey } from '@/store/useBudgetStore';
import { useAuthStore } from '@/store/useAuthStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { PAGE_VARIANTS, TRANSITIONS, STAGGER_CONTAINER, STAGGER_ITEM } from '@/constants/animations';
import { Eye, EyeOff, Plus, TrendingDown, Edit2, Check, X, TrendingUp, ChevronDown } from 'lucide-react';
import { cn } from '@/components/ui/GlassCard';
import { DEFAULT_CATEGORIES } from '@/types/budget.types';
import { toast } from 'sonner';

// ─── Budget Bar ───────────────────────────────────────────────────────────────
interface BudgetBarProps {
  label: string;
  spent: number;
  limit: number;
  percentage: number;
  blurred: boolean;
  currency?: string;
  onEdit?: (newLimit: number) => void;
  fixedSpent?: number;
  mainValue?: 'remaining' | 'spent';
}

function getBarColor(pct: number) {
  if (pct >= 100) return 'from-red-500 to-rose-600';
  if (pct >= 90) return 'from-orange-400 to-red-500';
  if (pct >= 70) return 'from-amber-400 to-orange-500';
  return 'from-emerald-400 to-teal-500';
}

function BudgetProgressCard({
  label,
  spent,
  limit,
  percentage,
  blurred,
  currency = '€',
  onEdit,
  fixedSpent,
  mainValue = 'remaining',
}: BudgetBarProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(limit.toString());
  const color = getBarColor(percentage);

  const remaining = Math.max(limit - spent, 0);
  const showRemainingAsMain = mainValue === 'remaining';
  const mainTextColor = showRemainingAsMain ? 'text-emerald-400' : 'text-red-400';

  const handleSave = () => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val > 0 && onEdit) {
      onEdit(val);
    } else {
      setEditValue(limit.toString());
    }
    setIsEditing(false);
  };

  return (
    <GlassCard className="flex flex-col gap-3">
      {/* Header row (compact for 2-up layout) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-widest truncate">{label}</span>
          {onEdit && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 rounded-md text-text-muted hover:bg-glass-border transition-colors shrink-0"
            >
              <Edit2 size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Main value */}
      <div className="flex flex-col gap-2">
        <div className="min-w-0">
          {showRemainingAsMain && (
            <p
              className={cn(
                'text-[10px] font-semibold uppercase tracking-widest text-emerald-400 mb-0.5',
                { 'blur-md select-none': blurred }
              )}
            >
              {t('spendless.remaining')}
            </p>
          )}
          <p
            className={cn('text-2xl sm:text-3xl font-bold tabular-nums transition-all duration-300', mainTextColor, {
              'blur-md select-none': blurred,
            })}
          >
            {showRemainingAsMain ? (
              <>
                {currency}
                {remaining.toFixed(0)}
              </>
            ) : (
              <>
                {currency}
                {spent.toFixed(0)}
              </>
            )}
          </p>

          <p className={cn('text-[10px] text-purple-400 font-medium truncate', { 'blur-md': blurred })}>
            {fixedSpent !== undefined && fixedSpent > 0 ? (
              <>
                {t('spendless.fixed_expenses')}: {currency}
                {fixedSpent.toFixed(0)}
              </>
            ) : (
              <span className="opacity-0">placeholder</span>
            )}
          </p>

          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-20 sm:w-24 bg-background border border-glass-border rounded px-2 py-1 text-sm font-bold"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <button onClick={handleSave} className="p-1 text-primary-500 shrink-0">
                <Check size={16} />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditValue(limit.toString());
                }}
                className="p-1 text-red-400 shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <p className="text-xs text-text-muted mt-0.5 truncate">
              {t('spendless.budget')}:{' '}
              <span className={cn({ 'blur-md select-none': blurred })}>
                {currency}
                {limit.toFixed(0)}
              </span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-text-muted">{t('spendless.spent')}</p>
          <p className={cn('text-sm font-bold text-red-400 tabular-nums', { 'blur-md select-none': blurred })}>
            {currency}
            {spent.toFixed(0)}
          </p>
        </div>
      </div>

      {/* Progress bar with percentage integrated */}
      <div className="relative h-3 bg-glass-bg rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', color)}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ ...TRANSITIONS.spring, delay: 0.2 }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-[10px] font-black tracking-wider text-white/90 drop-shadow', { 'blur-sm': blurred })}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Recent Expense Row ───────────────────────────────────────────────────────
function ExpenseRow({ amount, description, category, date, blurred, currency = '€', addedBy }: {
  amount: number; description: string; category: string; date: string; blurred: boolean; currency?: string; addedBy?: string;
}) {
  const { t } = useTranslation();
  const catConf = DEFAULT_CATEGORIES.find(c => c.name === category);
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-glass-border last:border-0 gap-2">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-xl shrink-0">{catConf?.icon ?? '📦'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight truncate">{description}</p>
          <p className="text-xs text-text-muted capitalize truncate">
            {new Date(date).toLocaleDateString()} • {t(`spendless.categories.${category}`)} {addedBy && ` • ${addedBy}`}
          </p>
        </div>
      </div>
      <span className={cn('text-sm font-bold text-red-400 tabular-nums shrink-0', {
        'blur-md select-none': blurred,
      })}>
        -{currency}{amount.toFixed(2)}
      </span>
    </div>
  );
}

import { useState } from 'react';

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuthStore();
  const { summary, budget, expenses, incomes, privacyMode, togglePrivacyMode, settings, updateFamilyBudget } = useBudgetStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const currency = settings?.currency ?? '€';
  const now = new Date();
  const monthKey = getMonthKey(now);
  const monthName = now.toLocaleDateString(i18n.language, { month: 'long' });
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = lastDayOfMonth.getDate() - now.getDate();

  const totalNormalIncome = incomes.filter((i) => i.date.startsWith(monthKey) && !i.isExtra).reduce((acc, i) => acc + i.amount, 0);

  // Current month incomes
  const currentMonthIncomes = incomes.filter((i) => i.date.startsWith(monthKey));
  const totalIncomeCurrentMonth = currentMonthIncomes.reduce((acc, i) => acc + i.amount, 0);
  const normalIncomes = currentMonthIncomes.filter((i) => !i.isExtra);
  const extraIncomes = currentMonthIncomes.filter((i) => i.isExtra);
  const totalNormalCurrentMonth = normalIncomes.reduce((acc, i) => acc + i.amount, 0);
  const totalExtraCurrentMonth = extraIncomes.reduce((acc, i) => acc + i.amount, 0);

  // Current month expenses split
  const currentMonthExpenses = expenses.filter((e) =>
    e.date.startsWith(monthKey)
  );

  const normalMonthExpenses = currentMonthExpenses.filter(
    (e) => !e.isFixed && !e.isAutoGenerated
  );

  const fixedMonthExpenses = currentMonthExpenses.filter(
    (e) => e.isAutoGenerated || e.isFixed
  );

  const totalNormalMonthExpenses = normalMonthExpenses.reduce(
    (acc, e) => acc + e.amount,
    0
  );

  const totalFixedMonthExpenses = fixedMonthExpenses.reduce(
    (acc, e) => acc + e.amount,
    0
  );

  // Last 5 non-fixed expenses
  const recentExpenses = [...expenses]
    .filter(e => !e.isFixed)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  // badge removed

  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showIncomeDetails, setShowIncomeDetails] = useState(false);
  const [showMonthExpenses, setShowMonthExpenses] = useState(false);

  return (
    <>
      <motion.div
        variants={PAGE_VARIANTS}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex flex-col gap-5 pb-6"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between pt-2 gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold capitalize truncate">{t('spendless.greeting', { name: user?.displayName?.split(' ')[0] ?? '' })}</h1>
            <div className="flex flex-col gap-1 mt-0.5">
              <p className="text-sm text-text-muted capitalize truncate">
                {monthName} · <span className="text-primary-400">{daysRemaining} {t('spendless.days_remaining')}</span>
              </p>
              {/* Month Progress Bar */}
              <div className="w-full h-1 bg-glass-bg rounded-full overflow-hidden mt-1">
                <motion.div
                  className="h-full bg-primary-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(now.getDate() / lastDayOfMonth.getDate()) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-[10px] text-text-muted/60 font-medium">
                {t('spendless.month_progress')}: {Math.round((now.getDate() / lastDayOfMonth.getDate()) * 100)}%
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
            {/* Spending badge removed as requested */}

            {/* Privacy toggle */}
            <button
              onClick={togglePrivacyMode}
              className="p-2 sm:p-2.5 rounded-full glass-button shrink-0"
              aria-label="Privacy mode"
            >
              <AnimatePresence mode="wait">
                <motion.div key={privacyMode ? 'hide' : 'show'}
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* ── Budget Cards ── */}
        <motion.div
          variants={STAGGER_CONTAINER}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 gap-3"
        >
          <motion.div variants={STAGGER_ITEM}>
            <BudgetProgressCard
              label={t('spendless.week')}
              spent={summary?.totalSpentThisWeek ?? 0}
              limit={budget.weeklyLimit}
              percentage={summary?.weeklyPercentage ?? 0}
              blurred={privacyMode}
              currency={currency}
              mainValue="remaining"
              onEdit={(val) => {
                if (user?.uid) {
                  updateFamilyBudget(user.uid, { ...budget, weeklyLimit: val });
                }
              }}
            />
          </motion.div>
          <motion.div variants={STAGGER_ITEM}>
            <BudgetProgressCard
              label={t('spendless.month')}
              spent={summary?.totalSpentThisMonth ?? 0}
              limit={budget.monthlyLimit}
              percentage={summary?.monthlyPercentage ?? 0}
              blurred={privacyMode}
              currency={currency}
              mainValue="remaining"
              fixedSpent={summary?.totalFixedThisMonth}
              onEdit={(val) => {
                if (val > totalNormalIncome) {
                  toast.error(
                    `${t('spendless.monthly_budget')} > ${t('spendless.income_details')} (${currency}${totalNormalIncome.toFixed(2)})`
                  );
                  return;
                }
                if (user?.uid) {
                  updateFamilyBudget(user.uid, { ...budget, monthlyLimit: val });
                }
              }}
            />
          </motion.div>
        </motion.div>

        {/* ── Income Card ── */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest">{t('spendless.income_details')}</h2>
          </div>

          <GlassCard className="mb-3">
            <button
              onClick={() => setShowIncomeDetails((s) => !s)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-widest">
                    {t('spendless.income_details')} {t('spendless.this_month').toLowerCase()}
                  </p>
                  <p
                    className={cn('text-3xl font-bold text-emerald-400 tabular-nums mt-1', {
                      'blur-md select-none': privacyMode,
                    })}
                  >
                    {currency}
                    {totalIncomeCurrentMonth.toFixed(2)}
                  </p>

                  <div
                    className={cn(
                      'flex flex-col text-[10px] leading-tight text-text-muted mt-1',
                      { 'blur-sm': privacyMode }
                    )}
                  >
                    <span>
                      {t('spendless.normal_incomes').replace(/.*\s/, '')}: {currency}
                      {totalNormalCurrentMonth.toFixed(2)}
                    </span>
                    <span className="text-purple-400 font-medium">
                      {t('spendless.extra_incomes').replace(/.*\s/, '')}: {currency}
                      {totalExtraCurrentMonth.toFixed(2)}
                    </span>
                  </div>
                </div>

                <motion.div
                  animate={{ rotate: showIncomeDetails ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 shrink-0 text-text-muted"
                >
                  <ChevronDown size={18} />
                </motion.div>
              </div>
            </button>

            <AnimatePresence>
              {showIncomeDetails && currentMonthIncomes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-3 border-t border-glass-border pt-3 flex flex-col gap-2 overflow-hidden"
                >
                  {currentMonthIncomes
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 3)
                    .map((inc) => (
                      <div key={inc.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                            inc.isExtra ? 'bg-purple-500/20' : 'bg-emerald-500/20'
                          )}
                        >
                          <TrendingUp
                            size={14}
                            className={inc.isExtra ? 'text-purple-400' : 'text-emerald-400'}
                          />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{inc.description}</p>
                            <p className="text-[10px] text-text-muted truncate">
                              {new Date(inc.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'text-xs font-bold tabular-nums shrink-0',
                            inc.isExtra ? 'text-purple-400' : 'text-emerald-400',
                            { 'blur-sm': privacyMode }
                          )}
                        >
                          +{currency}
                          {inc.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </section>

        {/* ── Month Expenses Card ── */}
        <section>
          <GlassCard className="mb-3">
            <button
              onClick={() => setShowMonthExpenses((s) => !s)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-widest">
                    Spese questo mese
                  </p>
                  <p
                    className={cn('text-3xl font-bold text-red-400 tabular-nums mt-1', {
                      'blur-md select-none': privacyMode,
                    })}
                  >
                    {currency}
                    {(summary?.totalSpentThisMonth ?? 0).toFixed(2)}
                  </p>

                  <div
                    className={cn(
                      'flex flex-col text-[10px] leading-tight text-text-muted mt-1',
                      { 'blur-sm': privacyMode }
                    )}
                  >
                    <span>
                      var.: {currency}
                      {totalNormalMonthExpenses.toFixed(2)}
                    </span>
                    <span className="text-purple-400 font-medium">
                      {t('spendless.nav_fixed').toLowerCase()}: {currency}
                      {totalFixedMonthExpenses.toFixed(2)}
                    </span>
                  </div>
                </div>

                <motion.div
                  animate={{ rotate: showMonthExpenses ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 shrink-0 text-text-muted"
                >
                  <ChevronDown size={18} />
                </motion.div>
              </div>
            </button>

            <AnimatePresence>
              {showMonthExpenses && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-3 border-t border-glass-border pt-3 flex flex-col gap-2 overflow-hidden"
                >
                  {currentMonthExpenses
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .map((e) => (
                      <ExpenseRow
                        key={e.id}
                        amount={e.amount}
                        description={e.description}
                        category={e.category}
                        date={e.date}
                        blurred={privacyMode}
                        currency={currency}
                        addedBy={e.addedBy}
                      />
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </section>

        {/* ── Weekly Trend Chart ── */}
        <section>
          <GlassCard className="!p-4">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest">
                Trend settimanale
              </h2>
              <p className="text-[10px] text-text-muted mt-1">
                Spese totali per settimana ({currency})
              </p>
            </div>

            {(() => {
              const weeks: Record<number, number> = {};
              // Escludiamo spese fisse e auto-generate (solo variabili)
              normalMonthExpenses.forEach((e) => {
                const day = new Date(e.date).getDate();
                const week = Math.ceil(day / 7);
                if (!weeks[week]) weeks[week] = 0;
                weeks[week] += e.amount;
              });

              const weekValues = [1, 2, 3, 4, 5].map((w) => weeks[w] ?? 0);
              const max = Math.max(...weekValues, 1);

              return (
                <div className="relative w-full">
                  <div className="w-full aspect-[6/1]">
                    <svg
                      viewBox="0 0 600 100"
                      className="w-full h-full"
                    >
                      {/* baseline with internal horizontal padding */}
                      <line x1="24" y1="95" x2="576" y2="95" stroke="#334155" strokeWidth="1" />

                      {/* line */}
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        points={weekValues
                          .map((val, i) => {
                            const x = 24 + (i / 4) * 552; // proportional padding (4%)
                            const y = 95 - (val / max) * 85;
                            return `${x},${y}`;
                          })
                          .join(' ')}
                      />

                      {/* dots */}
                      {weekValues.map((val, i) => {
                        const x = 24 + (i / 4) * 552;
                        const y = 95 - (val / max) * 85;
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="2.5"
                            fill="#10b981"
                          />
                        );
                      })}
                    </svg>
                  </div>

                  <div className="flex justify-between text-[10px] text-text-muted mt-2 px-[4%]">
                    {weekValues.map((val, i) => {
                      const startDay = i * 7 + 1;
                      const endDay = Math.min((i + 1) * 7, lastDayOfMonth.getDate());
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <span>{startDay}-{endDay}</span>
                          <span className="text-emerald-400 font-semibold">
                            {privacyMode ? '•••' : val.toFixed(0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </GlassCard>
        </section>

        

        {/* ── Empty State ── */}
        {recentExpenses.length === 0 && (
          <GlassCard className="text-center py-10 flex flex-col items-center gap-3">
            <span className="text-5xl">💸</span>
            <p className="font-semibold text-text-muted">{t('spendless.no_expenses')}</p>
            <p className="text-xs text-text-muted">{t('spendless.add_first')}</p>
          </GlassCard>
        )}


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
                navigate('/add-expense');
              }}
              className="px-4 py-2.5 rounded-xl glass-button text-sm font-bold flex items-center gap-2"
            >
              <TrendingDown size={16} className="text-red-400" />
              {t('spendless.add_expense')}
            </button>
            <button
              onClick={() => {
                setShowFabMenu(false);
                navigate('/add-income');
              }}
              className="px-4 py-2.5 rounded-xl glass-button text-sm font-bold flex items-center gap-2"
            >
              <TrendingUp size={16} className="text-primary-400" />
              {t('spendless.add_income')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setShowFabMenu((s) => !s)}
        className="fixed bottom-24 right-5 z-[70] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-500 text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={TRANSITIONS.bounce}
        aria-label={t('common.manage')}
        id="fab-add-expense"
      >
        <motion.div animate={{ rotate: showFabMenu ? 45 : 0 }} transition={{ duration: 0.15 }}>
          <Plus size={26} strokeWidth={2.5} />
        </motion.div>
      </motion.button>
    </>
  );
}
