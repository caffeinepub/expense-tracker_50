import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "@/components/ui/sonner";
import { Loader2, Plus, Trash2, TrendingUp, Wallet } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Expense } from "./backend.d";
import {
  useAddExpense,
  useDeleteExpense,
  useGetAllExpenses,
} from "./hooks/useQueries";

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

const CATEGORY_ICONS: Record<Category, string> = {
  Food: "🍽️",
  Transport: "🚌",
  Shopping: "🛍️",
  Bills: "📋",
  Health: "💊",
  Entertainment: "🎬",
  Other: "📦",
};

function getCategoryClass(category: string): string {
  const map: Record<string, string> = {
    Food: "badge-food",
    Transport: "badge-transport",
    Shopping: "badge-shopping",
    Bills: "badge-bills",
    Health: "badge-health",
    Entertainment: "badge-entertainment",
    Other: "badge-other",
  };
  return map[category] ?? "badge-other";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(timestampNs: bigint): string {
  const ms = Number(timestampNs / 1_000_000n);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(ms));
}

function getTotals(expenses: Expense[]) {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let today = 0;
  let week = 0;
  let month = 0;

  for (const expense of expenses) {
    const ms = Number(expense.timestamp / 1_000_000n);
    if (ms >= todayStart) today += expense.amount;
    if (ms >= weekStart) week += expense.amount;
    if (ms >= monthStart) month += expense.amount;
  }

  return { today, week, month };
}

function SummaryCard({
  label,
  amount,
  icon,
  ocid,
  delay,
}: {
  label: string;
  amount: number;
  icon: React.ReactNode;
  ocid: string;
  delay: number;
}) {
  return (
    <motion.div
      data-ocid={ocid}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="bg-card rounded-2xl p-5 border border-border shadow-xs flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-body font-medium text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-display font-bold text-foreground tabular-nums">
        {formatCurrency(amount)}
      </p>
    </motion.div>
  );
}

export default function App() {
  const { data: expenses = [], isLoading } = useGetAllExpenses();
  const addExpense = useAddExpense();
  const deleteExpense = useDeleteExpense();

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("");
  const [note, setNote] = useState("");
  const [amountError, setAmountError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  const totals = getTotals(expenses);

  const sortedExpenses = [...expenses].sort((a, b) => {
    return Number(b.timestamp - a.timestamp);
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let valid = true;

    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setAmountError("Please enter a valid amount");
      valid = false;
    } else {
      setAmountError("");
    }

    if (!category) {
      setCategoryError("Please select a category");
      valid = false;
    } else {
      setCategoryError("");
    }

    if (!valid) return;

    addExpense.mutate(
      { amount: Number(amount), category, note: note.trim() },
      {
        onSuccess: () => {
          setAmount("");
          setCategory("");
          setNote("");
          toast.success("Expense added successfully");
        },
        onError: () => {
          toast.error("Failed to add expense. Please try again.");
        },
      },
    );
  }

  function handleDelete(id: bigint, index: number) {
    deleteExpense.mutate(id, {
      onSuccess: () => {
        toast.success("Expense deleted");
      },
      onError: () => {
        toast.error("Failed to delete expense");
      },
    });
    // suppress unused warning
    void index;
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="grain-overlay bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto px-4 py-8 md:py-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">
                Expense Tracker
              </h1>
              <p className="text-primary-foreground/70 text-sm font-body">
                Track every rupee, stay in control
              </p>
            </div>
          </motion.div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <section aria-label="Spending Summary">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-xs font-body font-semibold uppercase tracking-widest text-muted-foreground mb-3"
          >
            Spending Summary
          </motion.h2>
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard
              label="Today"
              amount={totals.today}
              icon={<TrendingUp className="w-4 h-4" />}
              ocid="summary.today.card"
              delay={0.05}
            />
            <SummaryCard
              label="This Week"
              amount={totals.week}
              icon={<TrendingUp className="w-4 h-4" />}
              ocid="summary.week.card"
              delay={0.1}
            />
            <SummaryCard
              label="This Month"
              amount={totals.month}
              icon={<TrendingUp className="w-4 h-4" />}
              ocid="summary.month.card"
              delay={0.15}
            />
          </div>
        </section>

        {/* Add Expense Form */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          aria-label="Add Expense"
          className="bg-card rounded-2xl border border-border shadow-xs p-5"
        >
          <h2 className="text-lg font-display font-bold text-foreground mb-4">
            Add Expense
          </h2>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Amount */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="amount"
                  className="text-sm font-body font-medium text-foreground"
                >
                  Amount <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-body font-semibold select-none">
                    ₹
                  </span>
                  <Input
                    id="amount"
                    data-ocid="expense.amount.input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (amountError) setAmountError("");
                    }}
                    className="pl-8 font-body tabular-nums"
                    aria-invalid={!!amountError}
                    aria-describedby={amountError ? "amount-error" : undefined}
                  />
                </div>
                {amountError && (
                  <p
                    id="amount-error"
                    className="text-xs text-destructive font-body"
                  >
                    {amountError}
                  </p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="category"
                  className="text-sm font-body font-medium text-foreground"
                >
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={category}
                  onValueChange={(val) => {
                    setCategory(val);
                    if (categoryError) setCategoryError("");
                  }}
                >
                  <SelectTrigger
                    id="category"
                    data-ocid="expense.category.select"
                    className="font-body"
                    aria-invalid={!!categoryError}
                    aria-describedby={
                      categoryError ? "category-error" : undefined
                    }
                  >
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="font-body">
                        <span className="mr-1.5">{CATEGORY_ICONS[cat]}</span>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {categoryError && (
                  <p
                    id="category-error"
                    className="text-xs text-destructive font-body"
                  >
                    {categoryError}
                  </p>
                )}
              </div>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label
                htmlFor="note"
                className="text-sm font-body font-medium text-foreground"
              >
                Note{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="note"
                data-ocid="expense.note.input"
                type="text"
                placeholder="e.g. Lunch at office canteen"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="font-body"
                maxLength={120}
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              data-ocid="expense.submit_button"
              disabled={addExpense.isPending}
              className="w-full font-body font-semibold bg-primary hover:bg-primary/90 text-primary-foreground h-11"
            >
              {addExpense.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Expense
                </>
              )}
            </Button>
          </form>
        </motion.section>

        {/* Expense List */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          aria-label="Expense History"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-body font-semibold uppercase tracking-widest text-muted-foreground">
              All Expenses
            </h2>
            {expenses.length > 0 && (
              <span className="text-xs font-body text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                {expenses.length} {expenses.length === 1 ? "entry" : "entries"}
              </span>
            )}
          </div>

          <div
            data-ocid="expense.list"
            className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden"
          >
            {isLoading ? (
              <div
                data-ocid="expense.loading_state"
                className="flex flex-col items-center justify-center py-14 gap-3"
              >
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <p className="text-sm font-body text-muted-foreground">
                  Loading expenses…
                </p>
              </div>
            ) : sortedExpenses.length === 0 ? (
              <div
                data-ocid="expense.empty_state"
                className="flex flex-col items-center justify-center py-14 gap-3 text-center px-6"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/8 flex items-center justify-center">
                  <Wallet className="w-7 h-7 text-primary/60" />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground text-base">
                    No expenses yet
                  </p>
                  <p className="text-sm font-body text-muted-foreground mt-1">
                    Add your first expense above to start tracking.
                  </p>
                </div>
              </div>
            ) : (
              <ul>
                <AnimatePresence initial={false}>
                  {sortedExpenses.map((expense, index) => (
                    <motion.li
                      key={expense.id.toString()}
                      data-ocid={`expense.item.${index + 1}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, height: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      layout
                    >
                      {index > 0 && <Separator />}
                      <div className="flex items-center gap-3 px-5 py-4 hover:bg-muted/40 transition-colors">
                        {/* Category icon bubble */}
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0 text-base">
                          {CATEGORY_ICONS[expense.category as Category] ?? "📦"}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-body font-semibold px-2 py-0.5 rounded-full ${getCategoryClass(expense.category)}`}
                            >
                              {expense.category}
                            </span>
                            {expense.note && (
                              <span className="text-sm font-body text-foreground truncate max-w-[180px]">
                                {expense.note}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-body text-muted-foreground mt-0.5">
                            {formatDateTime(expense.timestamp)}
                          </p>
                        </div>

                        {/* Amount */}
                        <span className="text-base font-display font-bold text-foreground tabular-nums flex-shrink-0">
                          {formatCurrency(expense.amount)}
                        </span>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          data-ocid={`expense.delete_button.${index + 1}`}
                          className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0 rounded-lg"
                          onClick={() => handleDelete(expense.id, index + 1)}
                          disabled={deleteExpense.isPending}
                          aria-label={`Delete expense of ${formatCurrency(expense.amount)}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="text-center py-6">
          <p className="text-xs font-body text-muted-foreground">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Built with ♥ using caffeine.ai
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
