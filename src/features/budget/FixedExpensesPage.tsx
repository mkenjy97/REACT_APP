import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Trash2, RepeatIcon, ChevronLeft, Edit2, X, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBudgetStore } from '@/store/useBudgetStore';
import { useAuthStore } from '@/store/useAuthStore';
import { expenseSchema, type ExpenseFormData } from '@/validation/budget.schema';
import { GlassCard } from '@/components/ui/GlassCard';
import { PAGE_VARIANTS, TRANSITIONS } from '@/constants/animations';
import { DEFAULT_CATEGORIES } from '@/types/budget.types';
import { cn } from '@/components/ui/GlassCard';


// ─── Fixed Expense Row ────────────────────────────────────────────────────────
function FixedExpenseRow({
  id,
  amount,
  description,
  category,
  billingDay,
  accountSource,
  isFinancing,
  totalFinanced,
  totalInstallments,
  currentInstallment,
  currency,
  onDelete,
  onEdit,
}: {
  id: string;
  amount: number;
  description: string;
  category: string;
  billingDay?: number;
  accountSource?: string;
  isFinancing?: boolean;
  totalFinanced?: number;
  totalInstallments?: number;
  currentInstallment?: number;
  currency: string;
  onDelete: (id: string) => void;
  onEdit: (id: string, data: Partial<ExpenseFormData>) => void;
}) {
  const { t } = useTranslation();
  const catConf = DEFAULT_CATEGORIES.find(c => c.name === category as any);
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, reset, watch, control } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount,
      category: category as ExpenseFormData['category'],
      description,
      isFixed: true,
      billingDay: billingDay ?? undefined,
      accountSource: accountSource ?? undefined,
      isFinancing: isFinancing ?? false,
      totalFinanced: totalFinanced ?? undefined,
      totalInstallments: totalInstallments ?? undefined,
      currentInstallment: currentInstallment ?? undefined
    }
  });

  const isFinancingVal = watch('isFinancing');

  const submitEdit = (data: any) => {
    onEdit(id, data);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-3 border-b border-glass-border">
        <form onSubmit={handleSubmit(submitEdit as any)} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input type="number" step="0.01" {...register('amount', { valueAsNumber: true })} className="w-1/3 px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm" />
            <select {...register('category')} className="w-2/3 px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm">
              {DEFAULT_CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <input type="text" {...register('description')} className="w-full px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm" placeholder={t('spendless.description')} />

          <div className="flex gap-2">
            <input type="number" min="1" max="31" {...register('billingDay', { valueAsNumber: true })} className="w-1/3 px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm" placeholder={t('spendless.date')} />
            <input type="text" list={`account-suggestions-${id}`} {...register('accountSource')} className="w-2/3 px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm" placeholder={t('spendless.group_account')} />
            <datalist id={`account-suggestions-${id}`}>
              {/* Note: In a real app we'd pass uniqueAccounts down, but standard browser autofill also helps */}
            </datalist>
          </div>

          <div className="flex items-center justify-between p-2 mt-1 bg-glass-bg rounded-lg border border-glass-border">
            <span className="text-xs font-semibold text-text-muted">{t('spendless.is_financing')}</span>
            <Controller
              control={control}
              name="isFinancing"
              render={({ field }) => (
                <button type="button" onClick={() => field.onChange(!field.value)} className="text-primary-500">
                  {field.value ? <ToggleRight size={24} className="text-primary-400" /> : <ToggleLeft size={24} className="text-text-muted" />}
                </button>
              )}
            />
          </div>
          {isFinancingVal && (
            <div className="grid grid-cols-3 gap-2 mt-1">
              <input type="number" step="0.01" {...register('totalFinanced', { valueAsNumber: true })} className="px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-xs" placeholder={t('spendless.total_financed')} />
              <input type="number" {...register('totalInstallments', { valueAsNumber: true })} className="px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-xs" placeholder={t('spendless.total_installments')} />
              <input type="number" {...register('currentInstallment', { valueAsNumber: true })} className="px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-xs" placeholder={t('spendless.current_installment')} />
            </div>
          )}

          <div className="flex justify-end gap-2 mt-1">
            <button type="button" onClick={() => { setIsEditing(false); reset(); }} className="p-1.5 rounded-lg text-text-muted hover:bg-glass-border"><X size={16} /></button>
            <button type="submit" className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10"><Check size={16} /></button>
          </div>
        </form>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={TRANSITIONS.spring}
      className="flex items-center justify-between py-3 border-b border-glass-border last:border-0"
    >
      <div className="flex items-center gap-3 w-[60%] overflow-hidden">
        <span className="text-xl flex-shrink-0">{catConf?.icon ?? '🔁'}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{description}</p>
          <p className="text-xs text-text-muted capitalize truncate">
            {t(`spendless.categories.${category}`)} {billingDay && ` • ${t('spendless.date')} ${billingDay}`} {accountSource && ` • ${accountSource}`}
          </p>
          {isFinancing && totalInstallments && (
            <div className="w-full mt-1.5 bg-glass-border rounded-full h-1 overflow-hidden flex">
              <div
                className="bg-primary-400 h-full transition-all duration-500"
                style={{ width: `${(Math.min(currentInstallment ?? 0, totalInstallments) / totalInstallments) * 100}%` }}
              />
            </div>
          )}
          {isFinancing && (
            <p className="text-[9px] text-primary-400 mt-0.5 font-medium truncate">
              {t('spendless.installments_progress', { current: currentInstallment ?? 0, total: totalInstallments ?? '?' })} {totalFinanced ? `• ${t('spendless.spent')}: ${currency}${totalFinanced}` : ''}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="font-bold text-sm text-red-400 tabular-nums">{currency}{amount.toFixed(2)}/{t('spendless.this_month').toLowerCase()}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-full text-text-muted hover:bg-glass-border transition"
            aria-label="Modifica spesa fissa"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(id)}
            className="p-1.5 rounded-full text-red-400 hover:bg-red-500/10 transition"
            aria-label="Elimina spesa fissa"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Fixed Expenses Page ──────────────────────────────────────────────────────
export function FixedExpensesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { expenses, addExpense, deleteExpense, updateExpense, settings } = useBudgetStore();
  const [showForm, setShowForm] = useState(false);
  const [groupBy, setGroupBy] = useState<'financing' | 'account' | 'category'>('financing');

  const currency = settings?.currency ?? '€';
  const fixedExpenses = expenses.filter(e => e.isFixed);
  const totalFixed = fixedExpenses.reduce((s, e) => s + e.amount, 0);
  const uniqueAccounts = Array.from(new Set(expenses.map(e => e.accountSource).filter(Boolean))) as string[];

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



  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      amount: undefined,
      category: 'casa',
      description: '',
      isFixed: true,
      isFinancing: false,
    },
  });

  const isFinancingVal = watch('isFinancing');

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user?.uid) return;
    try {
      await addExpense({
        userId: user.uid,
        amount: data.amount,
        category: data.category,
        date: data.date ?? new Date().toISOString().split('T')[0],
        description: data.description,
        isFixed: true,
        billingDay: typeof data.billingDay === 'number' ? data.billingDay : undefined,
        accountSource: data.accountSource ?? undefined,
        isFinancing: data.isFinancing ?? false,
        totalFinanced: typeof data.totalFinanced === 'number' ? data.totalFinanced : undefined,
        totalInstallments: typeof data.totalInstallments === 'number' ? data.totalInstallments : undefined,
        currentInstallment: typeof data.currentInstallment === 'number' ? data.currentInstallment : undefined,
        addedBy: user.displayName || user.email || t('common.loading'),
        createdAt: Date.now(),
      });
      toast.success(t('spendless.fixed_expense_added'));
      reset();
      setShowForm(false);
    } catch {
      toast.error(t('auth.generic_error'));
    }
  };

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

      await updateExpense(id, partialExpense);
      toast.success(t('common.success'));
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
            {t('spendless.fixed_expenses')}
          </h1>
          <p className="text-xs text-text-muted">{t('spendless.fixed_expenses_subtitle')}</p>
        </div>
      </div>

      {/* Summary card */}
      <GlassCard className="flex items-center justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase tracking-widest">{t('spendless.total_fixed')}</p>
          <p className="text-3xl font-bold text-purple-400 tabular-nums mt-1">
            {currency}{totalFixed.toFixed(2)}
          </p>
          <p className="text-xs text-text-muted mt-1">{t('spendless.auto_added')}</p>
        </div>
        <span className="text-5xl">🔄</span>
      </GlassCard>

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
          {fixedExpenses.length === 0 && !showForm && (
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
                      id={e.id}
                      amount={e.amount}
                      description={e.description}
                      category={e.category}
                      billingDay={e.billingDay}
                      accountSource={e.accountSource}
                      isFinancing={e.isFinancing}
                      totalFinanced={e.totalFinanced}
                      totalInstallments={e.totalInstallments}
                      currentInstallment={e.currentInstallment}
                      currency={currency}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
              </div>
            ))}
        </AnimatePresence>

        {/* Add Fixed Expense Form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit(onSubmit as any)}
              className="flex flex-col gap-3 pt-4 mt-2 border-t border-glass-border overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">{t('spendless.amount')} (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    inputMode="decimal"
                    placeholder="0.00"
                    className={cn(
                      'w-full px-3 py-2.5 rounded-xl bg-glass-bg border text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary-400',
                      errors.amount ? 'border-red-500' : 'border-glass-border'
                    )}
                    {...register('amount', { valueAsNumber: true })}
                  />
                  {errors.amount && <p className="text-xs text-red-400 mt-0.5">{errors.amount.message}</p>}
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">{t('spendless.category')}</label>
                  <select
                    className="w-full px-3 py-2.5 rounded-xl bg-glass-bg border border-glass-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    {...register('category')}
                  >
                    {DEFAULT_CATEGORIES.map(c => (
                      <option key={c.name} value={c.name}>
                        {c.icon} {t(`spendless.categories.${c.name}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-text-muted mb-1 block">{t('spendless.description')}</label>
                <input
                  type="text"
                  placeholder={t('spendless.description')}
                  className={cn(
                    'w-full px-3 py-2.5 rounded-xl bg-glass-bg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400',
                    errors.description ? 'border-red-500' : 'border-glass-border'
                  )}
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-red-400 mt-0.5">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">{t('spendless.date')}</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="es. 15"
                    className="w-full px-3 py-2.5 rounded-xl bg-glass-bg border border-glass-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    {...register('billingDay', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <label className="text-xs text-text-muted mb-1 block">{t('spendless.group_account')}</label>
                  <input
                    type="text"
                    list="account-suggestions"
                    placeholder="es. Conto Corrente"
                    className="w-full px-3 py-2.5 rounded-xl bg-glass-bg border border-glass-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
                    {...register('accountSource')}
                  />
                  <datalist id="account-suggestions">
                    {uniqueAccounts.map(a => <option key={a} value={a} />)}
                  </datalist>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-glass-bg rounded-xl border border-glass-border">
                <div>
                  <span className="text-sm font-semibold text-text-muted">{t('spendless.is_financing')}</span>
                  <p className="text-[10px] text-text-muted">{t('spendless.recurring_desc')}</p>
                </div>
                <Controller
                  control={control}
                  name="isFinancing"
                  render={({ field }) => (
                    <button type="button" onClick={() => field.onChange(!field.value)} className="text-primary-500">
                      {field.value ? <ToggleRight size={32} className="text-primary-400" /> : <ToggleLeft size={32} className="text-text-muted" />}
                    </button>
                  )}
                />
              </div>

              <AnimatePresence>
                {isFinancingVal && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-3 gap-3 overflow-hidden"
                  >
                    <div>
                      <label className="text-[10px] text-text-muted mb-1 block">{t('spendless.amount')} (€)</label>
                      <input type="number" step="0.01" {...register('totalFinanced', { valueAsNumber: true })} className="w-full px-2 py-2 rounded-xl bg-glass-bg border border-glass-border text-xs focus:ring-2 focus:ring-primary-400" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted mb-1 block">{t('spendless.total_installments')}</label>
                      <input type="number" {...register('totalInstallments', { valueAsNumber: true })} className="w-full px-2 py-2 rounded-xl bg-glass-bg border border-glass-border text-xs focus:ring-2 focus:ring-primary-400" />
                    </div>
                    <div>
                      <label className="text-[10px] text-text-muted mb-1 block">{t('spendless.current_installment')}</label>
                      <input type="number" {...register('currentInstallment', { valueAsNumber: true })} className="w-full px-2 py-2 rounded-xl bg-glass-bg border border-glass-border text-xs focus:ring-2 focus:ring-primary-400" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 mt-1">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-500 to-indigo-600 disabled:opacity-60"
                >
                  {t('common.save')}
                </motion.button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); reset(); }}
                  className="px-4 py-2.5 rounded-xl glass-button text-sm"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Add button */}
      {!showForm && (
        <motion.button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg"
          whileTap={{ scale: 0.97 }}
          id="add-fixed-expense-btn"
        >
          <Plus size={18} />
          {t('spendless.add_fixed')}
        </motion.button>
      )}
    </motion.div>
  );
}
