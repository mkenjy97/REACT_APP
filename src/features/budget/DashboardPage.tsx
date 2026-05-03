import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useBudgetStore, SPENDING_BADGE_CONFIG, getMonthKey } from '@/store/useBudgetStore';
import { useAuthStore } from '@/store/useAuthStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { PAGE_VARIANTS, TRANSITIONS, STAGGER_CONTAINER, STAGGER_ITEM } from '@/constants/animations';
import { Eye, EyeOff, Plus, TrendingDown, Calendar, Edit2, Check, X, Users, Copy, CheckCircle } from 'lucide-react';
import { cn } from '@/components/ui/GlassCard';
import { DEFAULT_CATEGORIES } from '@/types/budget.types';
import { toast } from 'sonner';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

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
}

function getBarColor(pct: number) {
  if (pct >= 100) return 'from-red-500 to-rose-600';
  if (pct >= 90) return 'from-orange-400 to-red-500';
  if (pct >= 70) return 'from-amber-400 to-orange-500';
  return 'from-emerald-400 to-teal-500';
}

function BudgetProgressCard({ label, spent, limit, percentage, blurred, currency = '€', onEdit, fixedSpent }: BudgetBarProps) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(limit.toString());
  const color = getBarColor(percentage);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-muted uppercase tracking-widest">{label}</span>
          {onEdit && !isEditing && (
            <button onClick={() => setIsEditing(true)} className="p-1 rounded-md text-text-muted hover:bg-glass-border transition-colors">
              <Edit2 size={12} />
            </button>
          )}
        </div>
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', {
          'bg-primary-500/20 text-primary-400': percentage < 70,
          'bg-amber-500/20 text-amber-400': percentage >= 70 && percentage < 90,
          'bg-red-500/20 text-red-400': percentage >= 90,
        })}>
          {Math.round(percentage)}%
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className={cn('text-3xl font-bold tabular-nums transition-all duration-300', {
            'blur-md select-none': blurred,
          })}>
            {currency}{spent.toFixed(2)}
          </p>
          {fixedSpent !== undefined && fixedSpent > 0 && (
            <p className={cn("text-[10px] text-purple-400 font-medium", { 'blur-md': blurred })}>
              {t('spendless.spent')} {t('spendless.nav_fixed').toLowerCase()}: {currency}{fixedSpent.toFixed(0)}
            </p>
          )}
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                className="w-24 bg-background border border-glass-border rounded px-2 py-1 text-sm font-bold"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
              <button onClick={handleSave} className="p-1 text-primary-500"><Check size={16} /></button>
              <button onClick={() => { setIsEditing(false); setEditValue(limit.toString()); }} className="p-1 text-red-400"><X size={16} /></button>
            </div>
          ) : (
            <p className="text-xs text-text-muted mt-0.5">
              {t('spendless.budget')}: <span className={cn({ 'blur-md select-none': blurred })}>{currency}{limit.toFixed(2)}</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">{t('spendless.remaining')}</p>
          <p className={cn('text-lg font-bold', {
            'text-primary-400': percentage < 70,
            'text-amber-400': percentage >= 70 && percentage < 90,
            'text-red-400': percentage >= 90,
            'blur-md select-none': blurred,
          })}>
            {currency}{Math.max(limit - spent, 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Animated progress bar */}
      <div className="h-3 bg-glass-bg rounded-full overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full bg-gradient-to-r', color)}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ ...TRANSITIONS.spring, delay: 0.2 }}
        />
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
    <div className="flex items-center justify-between py-2.5 border-b border-glass-border last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-xl">{catConf?.icon ?? '📦'}</span>
        <div>
          <p className="text-sm font-medium leading-tight">{description}</p>
          <p className="text-xs text-text-muted capitalize">
            {t(`spendless.categories.${category}`)} {addedBy && ` • ${addedBy}`}
          </p>
        </div>
      </div>
      <span className={cn('text-sm font-bold text-red-400 tabular-nums', {
        'blur-md select-none': blurred,
      })}>
        -{currency}{amount.toFixed(2)}
      </span>
    </div>
  );
}

import { useState, useEffect } from 'react';

// ─── Dashboard Page ───────────────────────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuthStore();
  const { summary, budget, expenses, incomes, privacyMode, togglePrivacyMode, settings, saveSettings, removeFamilyMember } = useBudgetStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showFamilyCode, setShowFamilyCode] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<{ uid: string, email: string, displayName?: string }[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!settings?.familyId) {
        setFamilyMembers([]);
        return;
      }
      setLoadingMembers(true);
      try {
        const q = query(collection(db, 'userSettings'), where('familyId', '==', settings.familyId));
        const snap = await getDocs(q);
        const members: any[] = [];
        for (const d of snap.docs) {
          const uId = d.data().userId;
          const uSnap = await getDoc(doc(db, 'users', uId));
          if (uSnap.exists()) {
            members.push({ uid: uId, ...uSnap.data() });
          }
        }
        setFamilyMembers(members);
      } catch (err) {
        console.error('Error fetching family members:', err);
      } finally {
        setLoadingMembers(false);
      }
    };
    if (showFamilyCode) {
      fetchMembers();
    }
  }, [settings?.familyId, showFamilyCode]);

  const handleJoinFamily = async () => {
    if (!joinCode || !user?.uid) return;
    try {
      await saveSettings(user.uid, { familyId: joinCode.trim() });
      toast.success(t('spendless.join_family_success'));
      setJoinCode('');
      setShowFamilyCode(false);
      // Reload is handled by subscribeToExpenses taking new settings
      window.location.reload();
    } catch {
      toast.error(t('auth.generic_error'));
    }
  };

  const copyCode = () => {
    if (!user?.uid) return;
    navigator.clipboard.writeText(user.uid);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currency = settings?.currency ?? '€';
  const now = new Date();
  const monthKey = getMonthKey(now);
  const monthName = now.toLocaleDateString(i18n.language, { month: 'long' });
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysRemaining = lastDayOfMonth.getDate() - now.getDate();

  const totalNormalIncome = incomes.filter(i => i.date.startsWith(monthKey) && !i.isExtra).reduce((acc, i) => acc + i.amount, 0);

  // Last 5 non-fixed expenses
  const recentExpenses = [...expenses]
    .filter(e => !e.isFixed)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const badge = summary?.spendingBadge;
  const badgeConf = badge ? SPENDING_BADGE_CONFIG[badge] : null;

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
        <div className="flex items-start justify-between pt-2">
          <div>
            <h1 className="text-2xl font-bold capitalize">{t('spendless.greeting', { name: user?.displayName?.split(' ')[0] ?? '' })}</h1>
            <div className="flex flex-col gap-1 mt-0.5">
              <p className="text-sm text-text-muted capitalize">
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

          <div className="flex items-center gap-2">
            {/* Spending badge */}
            {badgeConf && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={TRANSITIONS.bounce}
                className={cn('text-xs font-bold px-2.5 py-1 rounded-full text-white bg-gradient-to-r', badgeConf.color)}
              >
                {badgeConf.emoji} {t(`spendless.badges.${badge}`)}
              </motion.span>
            )}

            {/* Privacy toggle */}
            <button
              onClick={togglePrivacyMode}
              className="p-2.5 rounded-full glass-button"
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
          className="grid gap-4"
        >
          <motion.div variants={STAGGER_ITEM}>
            <BudgetProgressCard
              label={t('spendless.weekly_budget')}
              spent={summary?.totalSpentThisWeek ?? 0}
              limit={budget.weeklyLimit}
              percentage={summary?.weeklyPercentage ?? 0}
              blurred={privacyMode}
              currency={currency}
              onEdit={val => {
                if (user?.uid) {
                  saveSettings(user.uid, { budget: { ...budget, weeklyLimit: val } });
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
              fixedSpent={summary?.totalFixedThisMonth}
              onEdit={val => {
                if (val > totalNormalIncome) {
                  toast.error(`${t('spendless.monthly_budget')} > ${t('spendless.income_details')} (${currency}${totalNormalIncome.toFixed(2)})`);
                  return;
                }
                if (user?.uid) {
                  saveSettings(user.uid, { budget: { ...budget, monthlyLimit: val } });
                }
              }}
            />
          </motion.div>
        </motion.div>

        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="!p-4 flex items-center gap-3">
            <div className="p-2 bg-primary-500/20 rounded-xl">
              <TrendingDown size={18} className="text-primary-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-muted">{t('spendless.this_month')}</p>
              <p className={cn('text-sm font-bold tabular-nums', { 'blur-md select-none': privacyMode })}>
                {currency}{(summary?.totalVariableThisMonth ?? 0).toFixed(0)} <span className="text-[10px] font-normal text-text-muted">var.</span>
              </p>
              <p className={cn('text-[10px] text-text-muted font-medium tabular-nums mt-0.5', { 'blur-md select-none': privacyMode })}>
                {t('spendless.spent')}: {currency}{(summary?.totalSpentThisMonth ?? 0).toFixed(0)}
              </p>
            </div>
          </GlassCard>
          <GlassCard className="!p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Calendar size={18} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-text-muted">{t('spendless.avg_daily')}</p>
              <p className={cn('text-sm font-bold tabular-nums', { 'blur-md select-none': privacyMode })}>
                {currency}{(now.getDate() > 0 ? (summary?.totalVariableThisMonth ?? 0) / now.getDate() : 0).toFixed(0)} <span className="text-[10px] font-normal text-text-muted">var.</span>
              </p>
              <p className={cn('text-[10px] text-text-muted font-medium tabular-nums mt-0.5', { 'blur-md select-none': privacyMode })}>
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

        {/* ── Family Group ── */}
        <GlassCard>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-purple-400" />
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-widest">
                {t('spendless.family_group')}
              </h2>
            </div>
            <button
              onClick={() => setShowFamilyCode(!showFamilyCode)}
              className="text-xs text-primary-400 font-medium"
            >
              {showFamilyCode ? t('common.close') : t('common.manage')}
            </button>
          </div>

          <AnimatePresence>
            {showFamilyCode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-3 mt-3 pt-3 border-t border-glass-border overflow-hidden"
              >
                <div className="bg-glass-bg p-3 rounded-xl border border-glass-border flex flex-col gap-2">
                  <p className="text-xs text-text-muted">{t('spendless.invite_code')}:</p>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm tracking-wider font-bold">{user?.uid}</span>
                    <button onClick={copyCode} className="p-1.5 rounded-md glass-button text-text-muted">
                      {copied ? <CheckCircle size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('spendless.family_code_placeholder')}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-glass-bg border border-glass-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                  />
                  <button
                    onClick={handleJoinFamily}
                    disabled={!joinCode}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-sm disabled:opacity-50"
                  >
                    {t('spendless.join_btn')}
                  </button>
                </div>

                {settings?.familyId && settings.familyId !== user?.uid && (
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle size={12} /> {t('spendless.in_shared_group')}
                  </p>
                )}

                {settings?.familyId && (
                  <div className="mt-2">
                    <p className="text-xs text-text-muted mb-2 font-semibold uppercase tracking-widest">{t('spendless.group_members')}</p>
                    {loadingMembers ? (
                      <p className="text-xs text-text-muted">{t('common.loading')}</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {familyMembers.map(m => (
                          <div key={m.uid} className="flex items-center justify-between bg-glass-bg p-2 rounded-xl border border-glass-border">
                            <div>
                              <p className="text-sm font-medium">{m.displayName || m.email}</p>
                              <p className="text-[10px] text-text-muted">{m.email}</p>
                            </div>
                            {m.uid !== settings.familyId && (
                              <button
                                onClick={async () => {
                                  await removeFamilyMember(m.uid);
                                  setFamilyMembers(prev => prev.filter(u => u.uid !== m.uid));
                                  toast.success(t('common.success'));
                                }}
                                className="text-xs text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                              >
                                {t('common.remove')}
                              </button>
                            )}
                            {m.uid === settings.familyId && (
                              <span className="text-[10px] px-2 py-1 bg-purple-500/20 text-purple-400 rounded-md font-bold uppercase tracking-wider">{t('common.admin')}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

      </motion.div>

      {/* ── FAB ── */}
      <motion.button
        onClick={() => navigate('/add-expense')}
        className="fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-500 text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={TRANSITIONS.bounce}
        aria-label={t('spendless.add_expense')}
        id="fab-add-expense"
      >
        <Plus size={26} strokeWidth={2.5} />
      </motion.button>
    </>
  );
}
