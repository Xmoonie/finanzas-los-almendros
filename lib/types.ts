export type TransactionType = "income" | "expense"

export interface Business {
  id: string
  ownerId: string
  name: string
  currency: string
  createdAt: string
}

export interface Transaction {
  id: string
  businessId: string
  type: TransactionType
  amount: number
  category: string
  description: string
  date: string
  payee: string
}

export interface Budget {
  id: string
  businessId: string
  category: string
  monthlyLimit: number
  month: string
}

export interface Category {
  id: string
  businessId: string
  name: string
  type: TransactionType
  color: string
}

export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "yearly"

export interface RecurringExpense {
  id: string
  businessId: string
  category: string
  description: string
  payee: string
  amount: number
  frequency: RecurringFrequency
  startDate: string
  active: boolean
}

export interface FinanceData {
  transactions: Transaction[]
  budgets: Budget[]
  categories: Category[]
  recurringExpenses: RecurringExpense[]

}
export interface Category {
  id: string
  businessId: string
  name: string
  type: TransactionType
  color: string
  expenseType?: "cogs" | "opex"
}
export type ComponentCategory = "proteina" | "arroz" | "ensalada" | "bastimento" | "extra"

export interface RecipeComponent {
  id: string
  businessId: string
  name: string
  category: ComponentCategory
  costPerPortion: number
  wastePercentage: number
  notes?: string
}

export interface RecipeItem {
  id: string
  recipeId: string
  componentId: string
  quantity: number
}

export interface Recipe {
  id: string
  businessId: string
  name: string
  basePrice: number
  notes?: string
  items: RecipeItem[]
}