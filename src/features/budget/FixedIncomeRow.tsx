import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, Trash2, X, Check, TrendingUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Income } from "@/types/budget.types";
import {
  useSavingIndicator,
  triggerHaptic,
} from "@/hooks/usePremiumEditable";

const incomeSchema = z.object({
  amount: z.number().min(0, "L'importo non può essere negativo"),
  description: z.string().min(1, "Descrizione obbligatoria"),
  date: z.string().min(1, "Data obbligatoria"),
});

export function FixedIncomeRow({
  inc,
  currency,
  onDelete,
  onEdit,
}: {
  inc: Income;
  currency: string;
  onDelete: (id: string) => void;
  onEdit: (id: string, data: Partial<Income>) => Promise<void> | void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const { isSaving, setIsSaving, flash, triggerSuccess } =
    useSavingIndicator();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof incomeSchema>>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: inc.amount,
      description: inc.description,
      date: inc.date,
    },
  });

  useEffect(() => {
    reset({
      amount: inc.amount,
      description: inc.description,
      date: inc.date,
    });
  }, [inc, reset]);

  const submitEdit = async (data: z.infer<typeof incomeSchema>) => {
    try {
      setIsSaving(true);
      triggerHaptic();
      await onEdit(inc.id, data);
      triggerSuccess();
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isEditing ? (
        <motion.div
          key="edit"
          layout
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25 }}
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
                min="0"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
                className="w-1/3 px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm"
              />
              <input
                type="date"
                {...register("date")}
                className="w-2/3 px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm"
              />
            </div>

            {errors.amount && (
              <span className="text-[10px] text-red-400">
                {errors.amount.message}
              </span>
            )}

            <input
              type="text"
              {...register("description")}
              className="w-full px-2 py-1.5 rounded-lg bg-glass-bg border border-glass-border text-sm"
            />

            {errors.description && (
              <span className="text-[10px] text-red-400">
                {errors.description.message}
              </span>
            )}

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
          layout
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center justify-between border-b border-glass-border py-3 gap-2 ${
            flash ? "bg-emerald-500/10" : ""
          }`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary-500/20 shrink-0">
              <TrendingUp size={16} className="text-primary-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">
                {inc.description}
              </p>
              <p className="text-[10px] text-text-muted truncate">
                {new Date(inc.date).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-sm font-bold tabular-nums text-primary-400">
              +{currency}
              {inc.amount.toFixed(2)}
            </span>

            <button
              type="button"
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1.5 rounded-full text-text-muted hover:bg-glass-border transition"
            >
              <Edit2 size={14} />
            </button>

            <button
              type="button"
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                triggerHaptic();
                onDelete(inc.id);
              }}
              className="p-1.5 rounded-full text-red-400 hover:bg-red-500/10 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
