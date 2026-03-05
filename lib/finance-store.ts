import { createClient } from "@/lib/supabase"
import type { Transaction, Budget, Category, FinanceData, RecurringExpense, TransactionType } from "./types"

const supabase = createClient()

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-1", name: "Ventas", type: "income", color: "#0d9488" },
  { id: "cat-2", name: "Servicios", type: "income", color: "#0ea5e9" },
  { id: "cat-3", name: "Consultorias", type: "income", color: "#8b5cf6" },
  { id: "cat-4", name: "Otros Ingresos", type: "income", color: "#64748b" },
  { id: "cat-5", name: "Alquiler", type: "expense", color: "#ef4444" },
  { id: "cat-6", name: "Servicios Publicos", type: "expense", color: "#f97316" },
  { id: "cat-7", name: "Planilla", type: "expense", color: "#eab308" },
  { id: "cat-8", name: "Suministros", type: "expense", color: "#84cc16" },
  { id: "cat-9", name: "Marketing", type: "expense", color: "#06b6d4" },
  { id: "cat-10", name: "Transporte", type: "expense", color: "#a855f7" },
  { id: "cat-11", name: "Mantenimiento", type: "expense", color: "#ec4899" },
  { id: "cat-12", name: "Otros Gastos", type: "expense", color: "#6b7280" },
]

export async function loadFinanceData(): Promise<FinanceData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { transactions: [], budgets: [], categories: DEFAULT_CATEGORIES, recurringExpenses: [] }

  const [transactions, budgets, categories, recurringExpenses] = await Promise.all([
    supabase.from("transactions").select("*").order("date", { ascending: false }),
    supabase.from("budgets").select("*"),
    supabase.from("categories").select("*"),
    supabase.from("recurring_expenses").select("*"),
  ])

  return {
    transactions: (transactions.data || []).map(t => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
      payee: t.payee,
    })),
    budgets: (budgets.data || []).map(b => ({
      id: b.id,
      category: b.category,
      monthlyLimit: b.monthly_limit,
      month: b.month,
    })),
    categories: categories.data?.length ? categories.data : DEFAULT_CATEGORIES,
    recurringExpenses: (recurringExpenses.data || []).map(r => ({
      id: r.id,
      category: r.category,
      description: r.description,
      payee: r.payee,
      amount: r.amount,
      frequency: r.frequency,
      startDate: r.start_date,
      active: r.active,
    })),
  }
}

export async function addTransaction(data: FinanceData, transaction: Omit<Transaction, "id">): Promise<FinanceData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return data

  const { data: inserted } = await supabase.from("transactions").insert({
    user_id: user.id,
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.category,
    description: transaction.description,
    date: transaction.date,
    payee: transaction.payee,
  }).select().single()

  if (!inserted) return data
  return { ...data, transactions: [{ ...transaction, id: inserted.id }, ...data.transactions] }
}

export async function updateTransaction(data: FinanceData, transaction: Transaction): Promise<FinanceData> {
  await supabase.from("transactions").update({
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.category,
    description: transaction.description,
    date: transaction.date,
    payee: transaction.payee,
  }).eq("id", transaction.id)

  return { ...data, transactions: data.transactions.map(t => t.id === transaction.id ? transaction : t) }
}

export async function deleteTransaction(data: FinanceData, id: string): Promise<FinanceData> {
  await supabase.from("transactions").delete().eq("id", id)
  return { ...data, transactions: data.transactions.filter(t => t.id !== id) }
}

export async function addBudget(data: FinanceData, budget: Omit<Budget, "id">): Promise<FinanceData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return data

  const { data: inserted } = await supabase.from("budgets").insert({
    user_id: user.id,
    category: budget.category,
    monthly_limit: budget.monthlyLimit,
    month: budget.month,
  }).select().single()

  if (!inserted) return data
  return { ...data, budgets: [...data.budgets, { ...budget, id: inserted.id }] }
}

export async function updateBudget(data: FinanceData, budget: Budget): Promise<FinanceData> {
  await supabase.from("budgets").update({
    category: budget.category,
    monthly_limit: budget.monthlyLimit,
    month: budget.month,
  }).eq("id", budget.id)

  return { ...data, budgets: data.budgets.map(b => b.id === budget.id ? budget : b) }
}

export async function deleteBudget(data: FinanceData, id: string): Promise<FinanceData> {
  await supabase.from("budgets").delete().eq("id", id)
  return { ...data, budgets: data.budgets.filter(b => b.id !== id) }
}

export async function addRecurringExpense(data: FinanceData, expense: Omit<RecurringExpense, "id">): Promise<FinanceData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return data

  const { data: inserted } = await supabase.from("recurring_expenses").insert({
    user_id: user.id,
    category: expense.category,
    description: expense.description,
    payee: expense.payee,
    amount: expense.amount,
    frequency: expense.frequency,
    start_date: expense.startDate,
    active: expense.active,
  }).select().single()

  if (!inserted) return data
  return { ...data, recurringExpenses: [...data.recurringExpenses, { ...expense, id: inserted.id }] }
}

export async function updateRecurringExpense(data: FinanceData, expense: RecurringExpense): Promise<FinanceData> {
  await supabase.from("recurring_expenses").update({
    category: expense.category,
    description: expense.description,
    payee: expense.payee,
    amount: expense.amount,
    frequency: expense.frequency,
    start_date: expense.startDate,
    active: expense.active,
  }).eq("id", expense.id)

  return { ...data, recurringExpenses: data.recurringExpenses.map(r => r.id === expense.id ? expense : r) }
}

export async function deleteRecurringExpense(data: FinanceData, id: string): Promise<FinanceData> {
  await supabase.from("recurring_expenses").delete().eq("id", id)
  return { ...data, recurringExpenses: data.recurringExpenses.filter(r => r.id !== id) }
}

export async function toggleRecurringExpense(data: FinanceData, id: string): Promise<FinanceData> {
  const expense = data.recurringExpenses.find(r => r.id === id)
  if (!expense) return data

  await supabase.from("recurring_expenses").update({ active: !expense.active }).eq("id", id)
  return { ...data, recurringExpenses: data.recurringExpenses.map(r => r.id === id ? { ...r, active: !r.active } : r) }
}

export async function addCategory(data: FinanceData, category: Omit<Category, "id">): Promise<FinanceData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return data

  const { data: inserted } = await supabase.from("categories").insert({
    user_id: user.id,
    name: category.name,
    type: category.type,
    color: category.color,
  }).select().single()

  if (!inserted) return data
  return { ...data, categories: [...data.categories, { ...category, id: inserted.id }] }
}

export async function deleteCategory(data: FinanceData, id: string): Promise<FinanceData> {
  await supabase.from("categories").delete().eq("id", id)
  return { ...data, categories: data.categories.filter(c => c.id !== id) }
}

export function formatCurrency(amount: number): string {
  return `L ${amount.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function getCategoryColor(categories: Category[], categoryName: string): string {
  return categories.find(c => c.name === categoryName)?.color || "#6b7280"
}

export function getMonthlyRecurringTotal(recurringExpenses: RecurringExpense[]): number {
  return recurringExpenses
    .filter(r => r.active)
    .reduce((total, r) => {
      switch (r.frequency) {
        case "weekly": return total + r.amount * 4.33
        case "biweekly": return total + r.amount * 2.17
        case "monthly": return total + r.amount
        case "yearly": return total + r.amount / 12
        default: return total + r.amount
      }
    }, 0)
}