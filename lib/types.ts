export type TransactionType = "income" | "expense"

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  category: string
  description: string
  date: string // ISO date string
  payee: string // payer for income, payee for expense
}

export interface Budget {
  id: string
  category: string
  monthlyLimit: number
  month: string // YYYY-MM format
}

export interface Category {
  id: string
  name: string
  type: TransactionType
  color: string
}

export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "yearly"

export interface RecurringExpense {
  id: string
  category: string
  description: string
  payee: string
  amount: number
  frequency: RecurringFrequency
  startDate: string // ISO date string
  active: boolean
}

export interface FinanceData {
  transactions: Transaction[]
  budgets: Budget[]
  categories: Category[]
  recurringExpenses: RecurringExpense[]
}
