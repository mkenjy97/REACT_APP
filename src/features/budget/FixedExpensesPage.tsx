import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Plus, Trash2, RepeatIcon, ChevronLeft, Edit2, X, Check, ToggleLeft, ToggleRight, Calculator, CheckSquare, Square } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useBudgetStore } from '@/store/useBudgetStore';
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
  startDate,
  currency,
  onDelete,
  onEdit,
  isSelectionMode,
  isSelected,
  onToggleSelect,
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
  startDate?: string;
  currency: string;
  onDelete: (id: string) => void;
  onEdit: (id: string, data: Partial<ExpenseFormData>) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
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
      currentInstallment: currentInstallment ?? undefined,
      startDate: startDate ?? new Date().toISOString().split('T')[0],
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

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-text-muted px-1 uppercase font-bold">{t('spendless.start_date') || 'Data Inizio'}</label>
            <input type="date" {...register('startDate')} className="w-full px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm" />
          </div>

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
      className={cn(
        "flex items-center justify-between py-3 border-b border-glass-border last:border-0 transition-colors",
        isSelected && "bg-primary-500/5 -mx-2 px-2 rounded-lg"
      )}
      onClick={() => isSelectionMode && onToggleSelect?.(id)}
    >
      <div className="flex items-center gap-3 w-[60%] overflow-hidden">
        {isSelectionMode && (
          <div className="flex-shrink-0 text-primary-400">
            {isSelected ? <CheckSquare size={20} /> : <Square size={20} className="text-text-muted opacity-50" />}
          </div>
        )}
        <span className="text-xl flex-shrink-0">{catConf?.icon ?? '🔁'}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{description}</p>
          <p className="text-xs text-text-muted capitalize truncate">
            {t(`spendless.categories.${category}`)}
            {!!billingDay && !isNaN(billingDay) && ` • ${t('spendless.date')} ${billingDay}`}
            {accountSource && ` • ${accountSource}`}
          </p>
          {startDate && startDate.substring(0, 7) > new Date().toISOString().substring(0, 7) && (
            <p className="text-[10px] text-amber-400 font-bold mt-0.5">
              🚀 {t('spendless.starts_from') || 'Inizia da'}: {new Date(startDate).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
            </p>
          )}
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
              {t('spendless.installments_progress', { current: currentInstallment || 0, total: totalInstallments || '?' })} {totalFinanced && !isNaN(totalFinanced) ? `• ${t('spendless.spent')}: ${currency}${totalFinanced.toFixed(2)}` : ''}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className={cn(
          "font-bold text-sm tabular-nums",
          startDate && startDate.substring(0, 7) > new Date().toISOString().substring(0, 7) ? "text-text-muted line-through opacity-50" : "text-red-400"
        )}>
          {currency}{amount.toFixed(2)}/{t('spendless.this_month').toLowerCase()}
        </span>
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
  const { expenses, deleteExpense, updateExpense, settings } = useBudgetStore();
  const [groupBy, setGroupBy] = useState<'financing' | 'account' | 'category'>('financing');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const currency = settings?.currency ?? '€';
  const monthKey = new Date().toISOString().substring(0, 7);
  const fixedExpenses = expenses.filter(e => e.isFixed);
  const activeFixedExpenses = fixedExpenses.filter(e => !e.startDate || e.startDate.substring(0, 7) <= monthKey);
  const totalFixed = activeFixedExpenses.reduce((s, e) => s + e.amount, 0);


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
              {t('spendless.fixed_expenses')}
            </h1>
            <p className="text-xs text-text-muted">{t('spendless.fixed_expenses_subtitle')}</p>
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
                        startDate={e.startDate}
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
      <motion.button
        onClick={() => navigate('/add-fixed-expense')}
        className="fixed bottom-24 right-5 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={TRANSITIONS.bounce}
        aria-label={t('spendless.add_fixed')}
        id="fab-add-fixed-expense"
      >
        <Plus size={26} strokeWidth={2.5} />
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
