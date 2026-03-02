"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import type { FinanceData, Transaction, Budget, RecurringExpense } from "@/lib/types"
import {
  loadFinanceData,
  addTransaction as addTx,
  updateTransaction as updateTx,
  deleteTransaction as deleteTx,
  addBudget as addBdg,
  updateBudget as updateBdg,
  deleteBudget as deleteBdg,
  addRecurringExpense as addRec,
  updateRecurringExpense as updateRec,
  deleteRecurringExpense as deleteRec,
  toggleRecurringExpense as toggleRec,
  addCategory as addCat,
  deleteCategory as deleteCat,
} from "@/lib/finance-store"

interface FinanceContextValue {
  data: FinanceData
  isLoaded: boolean
  addTransaction: (transaction: Omit<Transaction, "id">) => void
  updateTransaction: (transaction: Transaction) => void
  deleteTransaction: (id: string) => void
  addBudget: (budget: Omit<Budget, "id">) => void
  updateBudget: (budget: Budget) => void
  deleteBudget: (id: string) => void
  addRecurringExpense: (expense: Omit<RecurringExpense, "id">) => void
  updateRecurringExpense: (expense: RecurringExpense) => void
  deleteRecurringExpense: (id: string) => void
  toggleRecurringExpense: (id: string) => void
  addCategory: (category: Omit<import("@/lib/types").Category, "id">) => void
  deleteCategory: (id: string) => void
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider")
  return ctx
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FinanceData>({
    transactions: [],
    budgets: [],
    categories: [],
    recurringExpenses: [],
  })
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loaded = loadFinanceData()
    setData(loaded)
    setIsLoaded(true)
  }, [])

  const handleAddTransaction = (transaction: Omit<Transaction, "id">) => {
    setData(prev => addTx(prev, transaction))
  }

  const handleUpdateTransaction = (transaction: Transaction) => {
    setData(prev => updateTx(prev, transaction))
  }

  const handleDeleteTransaction = (id: string) => {
    setData(prev => deleteTx(prev, id))
  }

  const handleAddBudget = (budget: Omit<Budget, "id">) => {
    setData(prev => addBdg(prev, budget))
  }

  const handleUpdateBudget = (budget: Budget) => {
    setData(prev => updateBdg(prev, budget))
  }

  const handleDeleteBudget = (id: string) => {
    setData(prev => deleteBdg(prev, id))
  }

  const handleAddRecurringExpense = (expense: Omit<RecurringExpense, "id">) => {
    setData(prev => addRec(prev, expense))
  }

  const handleUpdateRecurringExpense = (expense: RecurringExpense) => {
    setData(prev => updateRec(prev, expense))
  }

  const handleDeleteRecurringExpense = (id: string) => {
    setData(prev => deleteRec(prev, id))
  }

  const handleToggleRecurringExpense = (id: string) => {
    setData(prev => toggleRec(prev, id))
  }

  const handleAddCategory = (category: Omit<import("@/lib/types").Category, "id">) => {
    setData(prev => addCat(prev, category))
  }

  const handleDeleteCategory = (id: string) => {
    setData(prev => deleteCat(prev, id))
  }

  return (
    <FinanceContext.Provider
      value={{
        data,
        isLoaded,
        addTransaction: handleAddTransaction,
        updateTransaction: handleUpdateTransaction,
        deleteTransaction: handleDeleteTransaction,
        addBudget: handleAddBudget,
        updateBudget: handleUpdateBudget,
        deleteBudget: handleDeleteBudget,
        addRecurringExpense: handleAddRecurringExpense,
        updateRecurringExpense: handleUpdateRecurringExpense,
        deleteRecurringExpense: handleDeleteRecurringExpense,
        toggleRecurringExpense: handleToggleRecurringExpense,
        addCategory: handleAddCategory,
        deleteCategory: handleDeleteCategory,
      }}
    >
      {children}
    </FinanceContext.Provider>
  )
}
