import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Trash2, X, Check, Calendar } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, type ExpenseFormData } from "@/validation/budget.schema";
import { DEFAULT_CATEGORIES } from "@/types/budget.types";
import { useSavingIndicator, triggerHaptic } from "@/hooks/usePremiumEditable";
import { EDITABLE_VIEW, EDITABLE_COLLAPSE } from "@/constants/animations";
import { cn } from "@/components/ui/GlassCard";
import { useTranslation } from "react-i18next";

export function FixedExpenseRow({
  expense,
  currency,
  onDelete,
  onEdit,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: {
  expense: any;
  currency: string;
  onDelete: (id: string) => Promise<void> | void;
  onEdit: (id: string, data: Partial<ExpenseFormData>) => Promise<void> | void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const { isSaving, setIsSaving, flash, triggerSuccess } =
    useSavingIndicator();

  const {
    register,
    handleSubmit,
    reset,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expense,
  });

  useEffect(() => {
    reset(expense);
  }, [expense, reset]);


  const submitEdit = async (data: ExpenseFormData) => {
    try {
      setIsSaving(true);
      triggerHaptic();
      await onEdit(expense.id, data);
      triggerSuccess();
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const catConf = DEFAULT_CATEGORIES.find(
    (c) => c.name === expense.category
  );

  const isFuture =
    expense.startDate &&
    new Date(expense.startDate).toISOString().substring(0, 7) >
      new Date().toISOString().substring(0, 7);

  return (
    <AnimatePresence mode="wait">
      {isEditing ? (
        <motion.div
          key="edit"
          {...EDITABLE_COLLAPSE}
          className="overflow-hidden border-b border-glass-border py-3"
        >
          <form
            onSubmit={handleSubmit(submitEdit)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsEditing(false);
                reset();
              }
            }}
            className="flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
                className="w-1/3 px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm"
              />
              <select
                {...register("category")}
                className="w-2/3 px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm"
              >
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="text"
              {...register("description")}
              className="w-full px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm"
            />

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">
                  {t("spendless.billing_day") || "Giorno di ricorrenza"}
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  {...register("billingDay", { valueAsNumber: true })}
                  placeholder="Es. 5"
                  className="w-full px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm"
                />
              </div>

              <div className="flex flex-col gap-1 w-full">
                <label className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">
                  {t("spendless.start_date") || "Data inizio"}
                </label>
                <input
                  type="date"
                  {...register("startDate")}
                  className="w-full px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-1">
              {isSaving && (
                <span className="text-[10px] text-primary-400 flex gap-1 items-center">
                  Saving
                  <span className="animate-bounce">.</span>
                  <span className="animate-bounce delay-75">.</span>
                  <span className="animate-bounce delay-150">.</span>
                </span>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    reset();
                  }}
                  className="p-1.5 rounded-lg text-text-muted hover:bg-glass-border"
                >
                  <X size={16} />
                </button>
                <button
                  type="submit"
                  className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Check size={16} />
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      ) : (
        <motion.div
          key="view"
          {...EDITABLE_VIEW}
          onClick={() => {
            if (isSelectionMode && onToggleSelect) {
              onToggleSelect(expense.id);
            }
          }}
          className={cn(
            "flex items-center justify-between py-3 border-b border-glass-border transition-colors",
            flash && "bg-emerald-500/10",
            isSelected && "bg-primary-500/10"
          )}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isSelectionMode && (
              <div className="text-primary-400 text-sm">
                {isSelected ? "☑️" : "⬜"}
              </div>
            )}
            <span className="text-xl">{catConf?.icon ?? "📦"}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {expense.description}
              </p>
              <p className="text-xs text-text-muted truncate flex flex-wrap gap-x-2 gap-y-0.5">
                <span className="capitalize">{expense.category}</span>

                {typeof expense.billingDay === "number" && !isNaN(expense.billingDay) && (
                  <span className="px-2 py-0.5 rounded-md bg-glass-border text-[10px] font-medium">
                    Ogni mese il {expense.billingDay}
                  </span>
                )}

                {expense.startDate && (
                  <span className="px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-400 text-[10px] font-medium flex items-center gap-1">
                    <Calendar size={12} />
                    {t("spendless.from", "Dal")}{" "}
                    {new Date(expense.startDate).toLocaleDateString("it-IT")}
                  </span>
                )}

                {isFuture && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 text-[10px] font-bold">
                    {t("spendless.not_active_yet", "Non ancora attiva")}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                isFuture
                  ? "text-text-muted line-through"
                  : "text-purple-400"
              )}
            >
              {currency}
              {expense.amount.toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="p-1 rounded-full text-text-muted hover:bg-glass-border"
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              onClick={async () => {
                triggerHaptic();
                await onDelete(expense.id);
              }}
              className="p-1 rounded-full text-red-400 hover:bg-red-500/10"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
