"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import type { FinanceData, Transaction, Budget, RecurringExpense, Category } from "@/lib/types"
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
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>
  updateTransaction: (transaction: Transaction) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  addBudget: (budget: Omit<Budget, "id">) => Promise<void>
  updateBudget: (budget: Budget) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
  addRecurringExpense: (expense: Omit<RecurringExpense, "id">) => Promise<void>
  updateRecurringExpense: (expense: RecurringExpense) => Promise<void>
  deleteRecurringExpense: (id: string) => Promise<void>
  toggleRecurringExpense: (id: string) => Promise<void>
  addCategory: (category: Omit<Category, "id">) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider")
  return ctx
}

const EMPTY: FinanceData = {
  transactions: [],
  budgets: [],
  categories: [],
  recurringExpenses: [],
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<FinanceData>(EMPTY)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    loadFinanceData().then(loaded => {
      setData(loaded)
      setIsLoaded(true)
    }).catch(() => {
      setData(EMPTY)
      setIsLoaded(true)
    })
  }, [])

  const handleAddTransaction = async (transaction: Omit<Transaction, "id">) => {
    const updated = await addTx(data, transaction)
    setData(updated)
  }

  const handleUpdateTransaction = async (transaction: Transaction) => {
    const updated = await updateTx(data, transaction)
    setData(updated)
  }

  const handleDeleteTransaction = async (id: string) => {
    const updated = await deleteTx(data, id)
    setData(updated)
  }

  const handleAddBudget = async (budget: Omit<Budget, "id">) => {
    const updated = await addBdg(data, budget)
    setData(updated)
  }

  const handleUpdateBudget = async (budget: Budget) => {
    const updated = await updateBdg(data, budget)
    setData(updated)
  }

  const handleDeleteBudget = async (id: string) => {
    const updated = await deleteBdg(data, id)
    setData(updated)
  }

  const handleAddRecurringExpense = async (expense: Omit<RecurringExpense, "id">) => {
    const updated = await addRec(data, expense)
    setData(updated)
  }

  const handleUpdateRecurringExpense = async (expense: RecurringExpense) => {
    const updated = await updateRec(data, expense)
    setData(updated)
  }

  const handleDeleteRecurringExpense = async (id: string) => {
    const updated = await deleteRec(data, id)
    setData(updated)
  }

  const handleToggleRecurringExpense = async (id: string) => {
    const updated = await toggleRec(data, id)
    setData(updated)
  }

  const handleAddCategory = async (category: Omit<Category, "id">) => {
    const updated = await addCat(data, category)
    setData(updated)
  }

  const handleDeleteCategory = async (id: string) => {
    const updated = await deleteCat(data, id)
    setData(updated)
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