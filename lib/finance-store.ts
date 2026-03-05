
import { format, subMonths, startOfMonth, endOfMonth, addDays, startOfWeek, endOfWeek, isWithinInterval, parseISO, differenceInDays } from "date-fns"
import { es } from "date-fns/locale"
import type { Transaction, Budget, Category, FinanceData, TransactionType, RecurringExpense } from "./types"

const STORAGE_KEY = "finanzas-data"

const DEFAULT_CATEGORIES: Category[] = [
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

function generateSeedTransactions(): Transaction[] {
  const now = new Date()
  const transactions: Transaction[] = []

  const incomeEntries = [
    { category: "Ventas", description: "Venta de productos", payee: "Cliente General" },
    { category: "Servicios", description: "Servicio de consultoria", payee: "Empresa ABC" },
    { category: "Ventas", description: "Venta al por mayor", payee: "Distribuidora XYZ" },
    { category: "Consultorias", description: "Asesoria tecnica", payee: "Corporacion 123" },
  ]

  const expenseEntries = [
    { category: "Alquiler", description: "Alquiler del local", payee: "Inmobiliaria Central" },
    { category: "Servicios Publicos", description: "Electricidad", payee: "ENEE" },
    { category: "Planilla", description: "Salarios del mes", payee: "Empleados" },
    { category: "Suministros", description: "Materiales de oficina", payee: "Office Depot" },
    { category: "Marketing", description: "Publicidad en redes", payee: "Meta Ads" },
    { category: "Transporte", description: "Combustible", payee: "Gasolinera Shell" },
  ]

  for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
    const monthDate = subMonths(now, monthOffset)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)
    const daysInMonth = monthEnd.getDate()

    // Generate 3-4 income entries per month
    const incomeCount = 3 + Math.floor(Math.random() * 2)
    for (let i = 0; i < incomeCount; i++) {
      const entry = incomeEntries[i % incomeEntries.length]
      const dayOffset = Math.floor(Math.random() * daysInMonth)
      const date = addDays(monthStart, dayOffset)
      transactions.push({
        id: crypto.randomUUID(),
        type: "income",
        amount: Math.round((15000 + Math.random() * 85000) * 100) / 100,
        category: entry.category,
        description: entry.description,
        date: format(date, "yyyy-MM-dd"),
        payee: entry.payee,
      })
    }

    // Generate 4-6 expense entries per month
    const expenseCount = 4 + Math.floor(Math.random() * 3)
    for (let i = 0; i < expenseCount; i++) {
      const entry = expenseEntries[i % expenseEntries.length]
      const dayOffset = Math.floor(Math.random() * daysInMonth)
      const date = addDays(monthStart, dayOffset)
      transactions.push({
        id: crypto.randomUUID(),
        type: "expense",
        amount: Math.round((2000 + Math.random() * 30000) * 100) / 100,
        category: entry.category,
        description: entry.description,
        date: format(date, "yyyy-MM-dd"),
        payee: entry.payee,
      })
    }
  }

  return transactions.sort((a, b) => b.date.localeCompare(a.date))
}

function generateSeedBudgets(): Budget[] {
  const now = new Date()
  const currentMonth = format(now, "yyyy-MM")
  const expenseCategories = DEFAULT_CATEGORIES.filter(c => c.type === "expense")

  const budgetLimits: Record<string, number> = {
    "Alquiler": 25000,
    "Servicios Publicos": 8000,
    "Planilla": 50000,
    "Suministros": 10000,
    "Marketing": 15000,
    "Transporte": 7000,
    "Mantenimiento": 5000,
    "Otros Gastos": 10000,
  }

  return expenseCategories.map(cat => ({
    id: crypto.randomUUID(),
    category: cat.name,
    monthlyLimit: budgetLimits[cat.name] || 10000,
    month: currentMonth,
  }))
}

function generateSeedRecurringExpenses(): RecurringExpense[] {
  const sixMonthsAgo = format(subMonths(new Date(), 6), "yyyy-MM-dd")
  return [
    {
      id: crypto.randomUUID(),
      category: "Alquiler",
      description: "Alquiler del local comercial",
      payee: "Inmobiliaria Central",
      amount: 22000,
      frequency: "monthly",
      startDate: sixMonthsAgo,
      active: true,
    },
    {
      id: crypto.randomUUID(),
      category: "Servicios Publicos",
      description: "Servicio de internet",
      payee: "Tigo Honduras",
      amount: 1800,
      frequency: "monthly",
      startDate: sixMonthsAgo,
      active: true,
    },
    {
      id: crypto.randomUUID(),
      category: "Planilla",
      description: "Salarios mensuales",
      payee: "Empleados",
      amount: 45000,
      frequency: "monthly",
      startDate: sixMonthsAgo,
      active: true,
    },
    {
      id: crypto.randomUUID(),
      category: "Marketing",
      description: "Suscripcion publicidad digital",
      payee: "Meta Ads",
      amount: 3500,
      frequency: "monthly",
      startDate: sixMonthsAgo,
      active: true,
    },
    {
      id: crypto.randomUUID(),
      category: "Mantenimiento",
      description: "Servicio de limpieza",
      payee: "Limpieza Express",
      amount: 2500,
      frequency: "biweekly",
      startDate: sixMonthsAgo,
      active: true,
    },
  ]
}

export function loadFinanceData(): FinanceData {
  if (typeof window === "undefined") {
    return { transactions: [], budgets: [], categories: DEFAULT_CATEGORIES, recurringExpenses: [] }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored) as FinanceData
      return data
    }
  } catch {
    // If parsing fails, seed with defaults
  }

  const seedData: FinanceData = {
    transactions: generateSeedTransactions(),
    budgets: generateSeedBudgets(),
    categories: DEFAULT_CATEGORIES,
    recurringExpenses: generateSeedRecurringExpenses(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData))
  return seedData
}

export function saveFinanceData(data: FinanceData): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Transaction CRUD
export function addTransaction(data: FinanceData, transaction: Omit<Transaction, "id">): FinanceData {
  const newTransaction: Transaction = {
    ...transaction,
    id: crypto.randomUUID(),
  }
  const updated = {
    ...data,
    transactions: [newTransaction, ...data.transactions].sort((a, b) => b.date.localeCompare(a.date)),
  }
  saveFinanceData(updated)
  return updated
}

export function updateTransaction(data: FinanceData, transaction: Transaction): FinanceData {
  const updated = {
    ...data,
    transactions: data.transactions.map(t => t.id === transaction.id ? transaction : t),
  }
  saveFinanceData(updated)
  return updated
}

export function deleteTransaction(data: FinanceData, id: string): FinanceData {
  const updated = {
    ...data,
    transactions: data.transactions.filter(t => t.id !== id),
  }
  saveFinanceData(updated)
  return updated
}

// Budget CRUD
export function addBudget(data: FinanceData, budget: Omit<Budget, "id">): FinanceData {
  const newBudget: Budget = {
    ...budget,
    id: crypto.randomUUID(),
  }
  const updated = {
    ...data,
    budgets: [...data.budgets, newBudget],
  }
  saveFinanceData(updated)
  return updated
}

export function updateBudget(data: FinanceData, budget: Budget): FinanceData {
  const updated = {
    ...data,
    budgets: data.budgets.map(b => b.id === budget.id ? budget : b),
  }
  saveFinanceData(updated)
  return updated
}

export function deleteBudget(data: FinanceData, id: string): FinanceData {
  const updated = {
    ...data,
    budgets: data.budgets.filter(b => b.id !== id),
  }
  saveFinanceData(updated)
  return updated
}

// Formatting helpers
export function formatCurrency(amount: number): string {
  return `L ${amount.toLocaleString("es-HN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function getCategoryColor(categories: Category[], categoryName: string): string {
  return categories.find(c => c.name === categoryName)?.color || "#6b7280"
}

// Recurring Expense CRUD
export function addRecurringExpense(data: FinanceData, expense: Omit<RecurringExpense, "id">): FinanceData {
  const newExpense: RecurringExpense = {
    ...expense,
    id: crypto.randomUUID(),
  }
  const updated = {
    ...data,
    recurringExpenses: [...data.recurringExpenses, newExpense],
  }
  saveFinanceData(updated)
  return updated
}

export function updateRecurringExpense(data: FinanceData, expense: RecurringExpense): FinanceData {
  const updated = {
    ...data,
    recurringExpenses: data.recurringExpenses.map(r => r.id === expense.id ? expense : r),
  }
  saveFinanceData(updated)
  return updated
}

export function deleteRecurringExpense(data: FinanceData, id: string): FinanceData {
  const updated = {
    ...data,
    recurringExpenses: data.recurringExpenses.filter(r => r.id !== id),
  }
  saveFinanceData(updated)
  return updated
}

export function toggleRecurringExpense(data: FinanceData, id: string): FinanceData {
  const updated = {
    ...data,
    recurringExpenses: data.recurringExpenses.map(r =>
      r.id === id ? { ...r, active: !r.active } : r
    ),
  }
  saveFinanceData(updated)
  return updated
}

// Category CRUD
export function addCategory(data: FinanceData, category: Omit<Category, "id">): FinanceData {
  const newCategory: Category = {
    ...category,
    id: crypto.randomUUID(),
  }
  const updated = {
    ...data,
    categories: [...data.categories, newCategory],
  }
  saveFinanceData(updated)
  return updated
}

export function deleteCategory(data: FinanceData, id: string): FinanceData {
  const updated = {
    ...data,
    categories: data.categories.filter(c => c.id !== id),
  }
  saveFinanceData(updated)
  return updated
}

// Recurring expense monthly total
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

// Balance Sheet utilities
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
      const monthEnd = endOfMonth(now)
      const monthStartStr = format(monthStart, "yyyy-MM-dd")
      const monthEndStr = format(monthEnd, "yyyy-MM-dd")
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

// Anomaly detection - identifies significant changes (>30% deviation from average)
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
  const now = new Date()
  const currentMonthStart = format(startOfMonth(now), "yyyy-MM-dd")
  const currentMonthEnd = format(endOfMonth(now), "yyyy-MM-dd")
  const anomalies: Anomaly[] = []

  // Group by type and category
  const types: Array<"income" | "expense"> = ["income", "expense"]

  for (const txType of types) {
    const typeTxs = transactions.filter(t => t.type === txType)
    const categories = [...new Set(typeTxs.map(t => t.category))]

    for (const cat of categories) {
      const catTxs = typeTxs.filter(t => t.category === cat)

      // Group by month
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

      // Only flag changes >30%
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

  // Sort by absolute percent change descending
  return anomalies.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange))
}
