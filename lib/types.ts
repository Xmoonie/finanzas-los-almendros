export type TransactionType = "income" | "expense"
export type ExpenseType = "cogs" | "opex"

export interface Business {
  id: string
  ownerId: string
  name: string
  currency: string
  createdAt: string
}

export interface Category {
  id: string
  businessId: string
  name: string
  type: TransactionType
  color: string
  expenseType?: ExpenseType
}

export interface Subcategory {
  id: string
  businessId: string
  categoryName: string
  expenseType: ExpenseType
  name: string
}

export interface ExpenseMemory {
  id: string
  businessId: string
  description?: string
  categoryName: string
  expenseType: ExpenseType
  subcategoryId?: string
  subcategoryName?: string
}

export interface Transaction {
  id: string
  businessId: string
  type: TransactionType
  amount: number
  category: string
  notes?: string
  date: string
  payee?: string
  subcategoryId?: string
  subcategoryName?: string
}

export interface Budget {
  id: string
  businessId: string
  category: string
  monthlyLimit: number
  month: string
}

export type RecurringFrequency = "weekly" | "biweekly" | "monthly" | "yearly"

export interface RecurringExpense {
  id: string
  businessId: string
  category: string
  description?: string
  notes?: string
  payee?: string
  amount: number
  frequency: RecurringFrequency
  startDate: string
  active: boolean
  subcategoryId?: string
  subcategoryName?: string
  dayOfMonth?: number
}

export interface FinanceData {
  transactions: Transaction[]
  budgets: Budget[]
  categories: Category[]
  recurringExpenses: RecurringExpense[]
  subcategories: Subcategory[]
  expenseMemory: ExpenseMemory[]
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