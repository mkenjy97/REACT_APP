// PREMIUM REFACTORED HISTORY PAGE

import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ChevronLeft,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { useBudgetStore } from "@/store/useBudgetStore";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  PAGE_VARIANTS,
  STAGGER_CONTAINER,
  STAGGER_ITEM,
} from "@/constants/animations";
import { cn } from "@/components/ui/GlassCard";
import { FixedExpenseRow } from "@/features/budget/FixedExpenseRow";
import { FixedIncomeRow } from "@/features/budget/FixedIncomeRow";

type FilterPeriod = "week" | "month" | "all";

export function ExpenseHistoryPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const {
    expenses,
    incomes,
    deleteExpense,
    deleteIncome,
    updateExpense,
    updateIncome,
    privacyMode,
    settings,
  } = useBudgetStore();

  const [period] = useState<FilterPeriod>("month");
  const [txType] = useState<"all" | "expenses" | "incomes">("all");

  const currency = settings?.currency ?? "€";
  const now = new Date();

  // Variabili
  const variableExpenses = expenses.filter((e) => !e.isFixed);

  // Fisse → mostrate con data di scalatura (billingDay nel mese corrente)
  const fixedExpensesWithDate = expenses
    .filter((e) => e.isFixed)
    .map((e) => {
      let billingDay: number | undefined;

      if (typeof e.billingDay === "number" && !isNaN(e.billingDay)) {
        billingDay = e.billingDay;
      } else if (e.startDate) {
        const parsed = new Date(e.startDate);
        if (!isNaN(parsed.getTime())) {
          billingDay = parsed.getDate();
        }
      }

      if (!billingDay || billingDay < 1 || billingDay > 31) {
        billingDay = 1; // fallback sicuro
      }

      const lastDayOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();

      const safeDay = Math.min(billingDay, lastDayOfMonth);

      const generatedDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        safeDay
      );

      const safeDate = isNaN(generatedDate.getTime())
        ? now.toISOString().substring(0, 10)
        : generatedDate.toISOString().substring(0, 10);

      return {
        ...e,
        date: safeDate,
      };
    });

  const txExpenses = [...variableExpenses, ...fixedExpensesWithDate].map(
    (e) => ({
      ...e,
      _type: "expense" as const,
    })
  );
  const txIncomes = incomes.map((i) => ({
    ...i,
    _type: "income" as const,
  }));

  const txAll = [...txExpenses, ...txIncomes]
    .filter((tx) => {
      if (txType === "expenses") return tx._type === "expense";
      if (txType === "incomes") return tx._type === "income";
      return true;
    })
    .filter((tx) => {
      if (period === "all") return true;
      const d = new Date(tx.date);
      if (period === "month") {
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

  const totalExpenses = txAll
    .filter((tx) => tx._type === "expense")
    .reduce((s, tx) => s + tx.amount, 0);

  const totalIncomes = txAll
    .filter((tx) => tx._type === "income")
    .reduce((s, tx) => s + tx.amount, 0);

  const grouped = txAll.reduce<Record<string, typeof txAll>>(
    (acc, tx) => {
      if (!acc[tx.date]) acc[tx.date] = [];
      acc[tx.date].push(tx);
      return acc;
    },
    {}
  );

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
        <button
          onClick={() => navigate(-1)}
          className="p-2 glass-button"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold">
            {t("spendless.nav_history")}
          </h1>
        </div>
      </div>

      {/* Totals */}
      <GlassCard className="flex justify-between">
        <div>
          <p className="text-xs text-text-muted uppercase">
            {t("spendless.nav_history")}
          </p>
          <p
            className={cn("text-3xl font-bold", {
              "blur-md": privacyMode,
            })}
          >
            {currency}
            {(totalIncomes - totalExpenses).toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="text-emerald-400 text-sm font-bold">
            <ArrowUpRight size={14} />
            +{currency}
            {totalIncomes.toFixed(0)}
          </div>
          <div className="text-red-400 text-sm font-bold">
            <ArrowDownRight size={14} />
            -{currency}
            {totalExpenses.toFixed(0)}
          </div>
        </div>
      </GlassCard>

      {/* List */}
      <motion.div
        variants={STAGGER_CONTAINER}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-4"
      >
        {Object.entries(grouped).map(([date, items]) => (
          <motion.div key={date} variants={STAGGER_ITEM}>
            <GlassCard className="!p-0 overflow-hidden">
              <div className="px-4 py-2 bg-glass-bg border-b border-glass-border text-xs font-bold">
                {new Date(date).toLocaleDateString(i18n.language)}
              </div>

              <div className="px-4">
                {items.map((tx) =>
                  tx._type === "expense" ? (
                    <FixedExpenseRow
                      key={tx.id}
                      expense={tx}
                      currency={currency}
                      onDelete={deleteExpense}
                      onEdit={async (id, data) => {
                        const sanitized: any = { ...data };
                        if (sanitized.billingDay === null) delete sanitized.billingDay;
                        if (sanitized.accountSource === null) delete sanitized.accountSource;
                        await updateExpense(id, sanitized);
                      }}
                    />
                  ) : (
                    <FixedIncomeRow
                      key={tx.id}
                      inc={tx}
                      currency={currency}
                      onDelete={deleteIncome}
                      onEdit={updateIncome}
                    />
                  )
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
