"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import type { CostLogData, CostLogEntry } from "@/lib/cost-types"
import {
  loadCostLog,
  addCostEntry as addEntry,
  deleteCostEntry as deleteEntry,
  updateCostEntry as updateEntry,
} from "@/lib/cost-store"

interface CostContextValue {
  data: CostLogData
  isLoaded: boolean
  addCostEntry: (entry: Omit<CostLogEntry, "id" | "total_cost" | "waste_cost">) => Promise<void>
  updateCostEntry: (entry: CostLogEntry) => Promise<void>
  deleteCostEntry: (id: string) => Promise<void>
}

const CostContext = createContext<CostContextValue | null>(null)

export function useCost() {
  const ctx = useContext(CostContext)
  if (!ctx) throw new Error("useCost must be used within CostProvider")
  return ctx
}

const EMPTY: CostLogData = { entries: [] }

export function CostProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<CostLogData>(EMPTY)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    loadCostLog()
      .then(loaded => {
        setData(loaded)
        setIsLoaded(true)
      })
      .catch(() => {
        setData(EMPTY)
        setIsLoaded(true)
      })
  }, [])

  const handleAddEntry = async (entry: Omit<CostLogEntry, "id" | "total_cost" | "waste_cost">) => {
    const updated = await addEntry(data, entry)
    setData(updated)
  }

  const handleUpdateEntry = async (entry: CostLogEntry) => {
    const updated = await updateEntry(data, entry)
    setData(updated)
  }

  const handleDeleteEntry = async (id: string) => {
    const updated = await deleteEntry(data, id)
    setData(updated)
  }

  return (
    <CostContext.Provider
      value={{
        data,
        isLoaded,
        addCostEntry: handleAddEntry,
        updateCostEntry: handleUpdateEntry,
        deleteCostEntry: handleDeleteEntry,
      }}
    >
      {children}
    </CostContext.Provider>
  )
}