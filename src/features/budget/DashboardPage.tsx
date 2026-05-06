import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBudgetStore, SPENDING_BADGE_CONFIG, getMonthKey } from '@/store/useBudgetStore';
import { useAuthStore } from '@/store/useAuthStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { PAGE_VARIANTS, TRANSITIONS, STAGGER_CONTAINER, STAGGER_ITEM } from '@/constants/animations';
import { Eye, EyeOff, Plus, TrendingDown, Calendar, Edit2, Check, X, TrendingUp } from 'lucide-react';
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
        <span className="text-[10px] font-bold text-text-muted tabular-nums shrink-0">
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Main value */}
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p
            className={cn('text-2xl sm:text-3xl font-bold tabular-nums transition-all duration-300', mainTextColor, {
              'blur-md select-none': blurred,
            })}
          >
            {showRemainingAsMain ? (
              <>
                {currency}
                {remaining.toFixed(2)}
              </>
            ) : (
              <>
                {currency}
                {spent.toFixed(2)}
              </>
            )}
          </p>

          {fixedSpent !== undefined && fixedSpent > 0 ? (
            <p className={cn('text-[10px] text-purple-400 font-medium', { 'blur-md': blurred })}>
              {t('spendless.spent')} {t('spendless.nav_fixed').toLowerCase()}: {currency}
              {fixedSpent.toFixed(0)}
            </p>
          ) : (
            <div className="h-[14px]" />
          )}

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
            <p className="text-xs text-text-muted mt-0.5">
              {t('spendless.budget')}:{' '}
              <span className={cn({ 'blur-md select-none': blurred })}>
                {currency}
                {limit.toFixed(2)}
              </span>
            </p>
          )}
        </div>

        {/* Optional: keep spent visible but compact (good for 2-up layout) */}
        <div className="text-right shrink-0">
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
function ExpenseRow({ amount, description, category, blurred, currency = '€', addedBy }: {
  amount: number; description: string; category: string; blurred: boolean; currency?: string; addedBy?: string;
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
            {t(`spendless.categories.${category}`)} {addedBy && ` • ${addedBy}`}
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
  const { summary, budget, expenses, incomes, privacyMode, togglePrivacyMode, settings, updateFamilyBudget, deleteIncome } = useBudgetStore();
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

  // Last 5 non-fixed expenses
  const recentExpenses = [...expenses]
    .filter(e => !e.isFixed)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const badge = summary?.spendingBadge;
  const badgeConf = badge ? SPENDING_BADGE_CONFIG[badge] : null;

  const [showFabMenu, setShowFabMenu] = useState(false);

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
                {monthName} · <span className="text-primary-400">{daysRemaining} {t('spendless.days_left')}</span>
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
            {/* Spending badge */}
            {badgeConf && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={TRANSITIONS.bounce}
                className={cn('text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full text-white bg-gradient-to-r whitespace-nowrap', badgeConf.color)}
              >
                {badgeConf.emoji} {t(`spendless.badges.${badge}`)}
              </motion.span>
            )}

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
              label={t('spendless.weekly_budget')}
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
              label={t('spendless.monthly_budget')}
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
            <p className="text-xs text-text-muted uppercase tracking-widest">
              {t('spendless.income_details')} {t('spendless.this_month').toLowerCase()}
            </p>
            <div className="flex items-center justify-between gap-2 mt-1">
              <p className={cn('text-3xl font-bold text-primary-400 tabular-nums', { 'blur-md select-none': privacyMode })}>
                {currency}
                {totalIncomeCurrentMonth.toFixed(2)}
              </p>
              <div className={cn('flex flex-col text-[10px] items-end leading-tight text-text-muted', { 'blur-sm': privacyMode })}>
                <span>
                  {t('spendless.normal_incomes')}: {currency}
                  {totalNormalCurrentMonth.toFixed(2)}
                </span>
                <span className="text-purple-400 font-medium">
                  {t('spendless.extra_incomes')}: {currency}
                  {totalExtraCurrentMonth.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Quick list current month incomes */}
            {currentMonthIncomes.length > 0 && (
              <div className="mt-3 border-t border-glass-border pt-3 flex flex-col gap-2">
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
                            inc.isExtra ? 'bg-purple-500/20' : 'bg-primary-500/20'
                          )}
                        >
                          <TrendingUp size={14} className={inc.isExtra ? 'text-purple-400' : 'text-primary-400'} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{inc.description}</p>
                          <p className="text-[10px] text-text-muted truncate">{new Date(inc.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={cn('text-xs font-bold tabular-nums', inc.isExtra ? 'text-purple-400' : 'text-primary-400', {
                            'blur-sm': privacyMode,
                          })}
                        >
                          +{currency}
                          {inc.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => deleteIncome(inc.id)}
                          className="p-1 text-red-400 hover:bg-red-500/10 rounded-full transition"
                          aria-label={t('common.remove')}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </GlassCard>
        </section>

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="!p-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-primary-500/20 rounded-xl shrink-0">
              <TrendingDown size={16} className="text-primary-400 sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="flex-1 min-w-0 w-full">
              <p className="text-[10px] sm:text-xs text-text-muted truncate">{t('spendless.this_month')}</p>
              <p className={cn('text-xs sm:text-sm font-bold tabular-nums truncate', { 'blur-md select-none': privacyMode })}>
                {currency}{(summary?.totalVariableThisMonth ?? 0).toFixed(0)} <span className="text-[9px] sm:text-[10px] font-normal text-text-muted">var.</span>
              </p>
              <p className={cn('text-[9px] sm:text-[10px] text-text-muted font-medium tabular-nums mt-0.5 truncate', { 'blur-md select-none': privacyMode })}>
                {t('spendless.spent')}: {currency}{(summary?.totalSpentThisMonth ?? 0).toFixed(0)}
              </p>
            </div>
          </GlassCard>
          <GlassCard className="!p-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-xl shrink-0">
              <Calendar size={16} className="text-blue-400 sm:w-[18px] sm:h-[18px]" />
            </div>
            <div className="flex-1 min-w-0 w-full">
              <p className="text-[10px] sm:text-xs text-text-muted truncate">{t('spendless.avg_daily')}</p>
              <p className={cn('text-xs sm:text-sm font-bold tabular-nums truncate', { 'blur-md select-none': privacyMode })}>
                {currency}{(now.getDate() > 0 ? (summary?.totalVariableThisMonth ?? 0) / now.getDate() : 0).toFixed(0)} <span className="text-[9px] sm:text-[10px] font-normal text-text-muted">var.</span>
              </p>
              <p className={cn('text-[9px] sm:text-[10px] text-text-muted font-medium tabular-nums mt-0.5 truncate', { 'blur-md select-none': privacyMode })}>
                {t('spendless.spent')}: {currency}{(now.getDate() > 0 ? (summary?.totalSpentThisMonth ?? 0) / now.getDate() : 0).toFixed(0)}
              </p>
            </div>
          </GlassCard>
        </div>

        {/* ── Recent Expenses ── */}
        {recentExpenses.length > 0 && (
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest">
                {t('spendless.recent_expenses')}
              </h2>
              <button
                onClick={() => navigate('/history')}
                className="text-xs text-primary-400 font-medium"
              >
                {t('spendless.view_all')} →
              </button>
            </div>
            {recentExpenses.map(e => (
              <ExpenseRow
                key={e.id}
                amount={e.amount}
                description={e.description}
                category={e.category}
                blurred={privacyMode}
                currency={currency}
                addedBy={e.addedBy}
              />
            ))}
          </GlassCard>
        )}

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
