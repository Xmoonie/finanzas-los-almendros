import { createClient } from "@/lib/supabase"
import type { Transaction, Budget, Category, FinanceData, RecurringExpense, TransactionType, Business } from "./types"

const supabase = createClient()

export const DEFAULT_CATEGORIES = (businessId: string): Omit<Category, "id">[] => [
  { businessId, name: "Ventas", type: "income", color: "#0d9488" },
  { businessId, name: "Servicios", type: "income", color: "#0ea5e9" },
  { businessId, name: "Consultorias", type: "income", color: "#8b5cf6" },
  { businessId, name: "Otros Ingresos", type: "income", color: "#64748b" },
  { businessId, name: "Alquiler", type: "expense", color: "#ef4444" },
  { businessId, name: "Servicios Publicos", type: "expense", color: "#f97316" },
  { businessId, name: "Planilla", type: "expense", color: "#eab308" },
  { businessId, name: "Suministros", type: "expense", color: "#84cc16" },
  { businessId, name: "Marketing", type: "expense", color: "#06b6d4" },
  { businessId, name: "Transporte", type: "expense", color: "#a855f7" },
  { businessId, name: "Mantenimiento", type: "expense", color: "#ec4899" },
  { businessId, name: "Otros Gastos", type: "expense", color: "#6b7280" },
]

// ─── Businesses ───────────────────────────────────────────────────────────────

export async function loadBusinesses(): Promise<Business[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: true })

  return (data || []).map(b => ({
    id: b.id,
    ownerId: b.owner_id,
    name: b.name,
    currency: b.currency,
    createdAt: b.created_at,
  }))
}

export async function createBusiness(name: string, currency = "HNL"): Promise<Business | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("businesses")
    .insert({ owner_id: user.id, name, currency })
    .select()
    .single()

  if (!data) return null

  // Crear categorías default para el nuevo negocio
  const cats = DEFAULT_CATEGORIES(data.id)
  await supabase.from("categories").insert(
    cats.map(c => ({ business_id: data.id, user_id: user.id, name: c.name, type: c.type, color: c.color }))
  )

  return {
    id: data.id,
    ownerId: data.owner_id,
    name: data.name,
    currency: data.currency,
    createdAt: data.created_at,
  }
}

// ─── Finance Data ──────────────────────────────────────────────────────────────

export async function loadFinanceData(businessId: string): Promise<FinanceData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { transactions: [], budgets: [], categories: [], recurringExpenses: [] }

  const [transactions, budgets, categories, recurringExpenses] = await Promise.all([
    supabase.from("transactions").select("*").eq("business_id", businessId).order("date", { ascending: false }),
    supabase.from("budgets").select("*").eq("business_id", businessId),
    supabase.from("categories").select("*").eq("business_id", businessId),
    supabase.from("recurring_expenses").select("*").eq("business_id", businessId),
  ])

  return {
    transactions: (transactions.data || []).map(t => ({
      id: t.id,
      businessId: t.business_id,
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
      payee: t.payee,
    })),
    budgets: (budgets.data || []).map(b => ({
      id: b.id,
      businessId: b.business_id,
      category: b.category,
      monthlyLimit: b.monthly_limit,
      month: b.month,
    })),
    categories: categories.data?.length ? categories.data.map(c => ({
      id: c.id,
      businessId: c.business_id,
      name: c.name,
      type: c.type,
      color: c.color,
    })) : [],
    recurringExpenses: (recurringExpenses.data || []).map(r => ({
      id: r.id,
      businessId: r.business_id,
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
    business_id: transaction.businessId,
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
    business_id: budget.businessId,
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
    business_id: expense.businessId,
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
    business_id: category.businessId,
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

// ─── Utilities ────────────────────────────────────────────────────────────────

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

export type BalancePeriod = "day" | "week" | "month" | "all"

export interface BalanceData {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  transactionCount: number
  dailyAverage: {
    income: number
    expenses: number
    net: number
  }
  periodLabel: string
}

export function getBalanceForPeriod(
  transactions: Transaction[],
  period: BalancePeriod,
  customDate?: Date
): BalanceData {
  const { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, parseISO, differenceInDays } = require("date-fns")
  const { es } = require("date-fns/locale")
  const now = customDate || new Date()
  let filtered: Transaction[]
  let periodLabel: string
  let daysInPeriod: number

  switch (period) {
    case "day": {
      const dayStr = format(now, "yyyy-MM-dd")
      filtered = transactions.filter(t => t.date === dayStr)
      periodLabel = format(now, "dd 'de' MMMM, yyyy", { locale: es })
      daysInPeriod = 1
      break
    }
    case "week": {
      const weekStart = startOfWeek(now, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
      filtered = transactions.filter(t => {
        const d = parseISO(t.date)
        return isWithinInterval(d, { start: weekStart, end: weekEnd })
      })
      periodLabel = `${format(weekStart, "dd MMM", { locale: es })} - ${format(weekEnd, "dd MMM, yyyy", { locale: es })}`
      daysInPeriod = differenceInDays(now, weekStart) + 1
      break
    }
    case "month": {
      const monthStart = startOfMonth(now)
      const monthEndDate = endOfMonth(now)
      const monthStartStr = format(monthStart, "yyyy-MM-dd")
      const monthEndStr = format(monthEndDate, "yyyy-MM-dd")
      filtered = transactions.filter(t => t.date >= monthStartStr && t.date <= monthEndStr)
      periodLabel = format(now, "MMMM yyyy", { locale: es })
      daysInPeriod = differenceInDays(now, monthStart) + 1
      break
    }
    default: {
      filtered = transactions
      if (transactions.length > 0) {
        const dates = transactions.map(t => t.date).sort()
        const oldest = parseISO(dates[0])
        periodLabel = `Desde ${format(oldest, "dd MMM yyyy", { locale: es })}`
        daysInPeriod = Math.max(1, differenceInDays(now, oldest) + 1)
      } else {
        periodLabel = "Sin transacciones"
        daysInPeriod = 1
      }
      break
    }
  }

  const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpenses = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    transactionCount: filtered.length,
    dailyAverage: {
      income: totalIncome / daysInPeriod,
      expenses: totalExpenses / daysInPeriod,
      net: (totalIncome - totalExpenses) / daysInPeriod,
    },
    periodLabel,
  }
}

export interface Anomaly {
  type: "spike" | "drop"
  category: string
  transactionType: TransactionType
  currentAmount: number
  averageAmount: number
  percentChange: number
  period: string
}

export function detectAnomalies(transactions: Transaction[]): Anomaly[] {
  const { format, parseISO } = require("date-fns")
  const { es } = require("date-fns/locale")
  const now = new Date()
  const anomalies: Anomaly[] = []
  const types: Array<"income" | "expense"> = ["income", "expense"]

  for (const txType of types) {
    const typeTxs = transactions.filter(t => t.type === txType)
    const categories = [...new Set(typeTxs.map(t => t.category))]

    for (const cat of categories) {
      const catTxs = typeTxs.filter(t => t.category === cat)
      const monthlyTotals: Record<string, number> = {}
      for (const tx of catTxs) {
        const month = tx.date.substring(0, 7)
        monthlyTotals[month] = (monthlyTotals[month] || 0) + tx.amount
      }

      const months = Object.keys(monthlyTotals).sort()
      if (months.length < 2) continue

      const currentMonth = format(now, "yyyy-MM")
      const previousMonths = months.filter(m => m !== currentMonth)
      if (previousMonths.length === 0) continue

      const avgPrevious = previousMonths.reduce((s, m) => s + monthlyTotals[m], 0) / previousMonths.length
      const currentAmount = monthlyTotals[currentMonth] || 0
      if (avgPrevious === 0) continue

      const percentChange = ((currentAmount - avgPrevious) / avgPrevious) * 100
      if (Math.abs(percentChange) > 30) {
        anomalies.push({
          type: percentChange > 0 ? "spike" : "drop",
          category: cat,
          transactionType: txType,
          currentAmount,
          averageAmount: avgPrevious,
          percentChange,
          period: format(now, "MMMM yyyy", { locale: es }),
        })
      }
    }
  }

  return anomalies.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
}