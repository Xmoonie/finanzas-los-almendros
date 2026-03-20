"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFinance } from "@/components/providers/finance-provider"
import { formatCurrency } from "@/lib/finance-store"
import type { Transaction } from "@/lib/types"

interface ProfitLossProps {
  transactions: Transaction[]
}

export function ProfitLoss({ transactions }: ProfitLossProps) {
  const { data } = useFinance()

  const results = useMemo(() => {
    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)

    const expenseTransactions = transactions.filter(t => t.type === "expense")

    const cogs = expenseTransactions
      .filter(t => {
        const cat = data.categories.find(c => c.name === t.category)
        return cat?.expenseType === "cogs"
      })
      .reduce((sum, t) => sum + t.amount, 0)

    const opex = expenseTransactions
      .filter(t => {
        const cat = data.categories.find(c => c.name === t.category)
        return !cat || cat.expenseType !== "cogs"
      })
      .reduce((sum, t) => sum + t.amount, 0)

    const grossProfit = income - cogs
    const grossMargin = income > 0 ? (grossProfit / income) * 100 : 0

    const operatingProfit = grossProfit - opex
    const operatingMargin = income > 0 ? (operatingProfit / income) * 100 : 0

    // Breakdown de opex por categoría
    const opexByCategory: Record<string, number> = {}
    expenseTransactions
      .filter(t => {
        const cat = data.categories.find(c => c.name === t.category)
        return !cat || cat.expenseType !== "cogs"
      })
      .forEach(t => {
        opexByCategory[t.category] = (opexByCategory[t.category] || 0) + t.amount
      })

    return { income, cogs, opex, grossProfit, grossMargin, operatingProfit, operatingMargin, opexByCategory }
  }, [transactions, data.categories])

  const Row = ({ label, value, bold, color, indent }: {
    label: string
    value: number
    bold?: boolean
    color?: string
    indent?: boolean
  }) => (
    <div className={`flex items-center justify-between py-1.5 ${indent ? "pl-4" : ""} ${bold ? "border-t mt-1 pt-2" : ""}`}>
      <span className={`text-sm ${bold ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-sm tabular-nums ${bold ? "font-bold" : ""} ${color ?? ""}`}>
        {formatCurrency(value)}
      </span>
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Estado de Resultados</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">

        {/* Ingresos */}
        <Row label="Ventas" value={results.income} bold color="text-success" />

        {/* COGS */}
        <div className="mt-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Costo de Ventas</span>
          <Row label="COGS" value={results.cogs} indent color="text-destructive" />
        </div>

        {/* Utilidad Bruta */}
        <div className="rounded-lg bg-muted/50 px-3 py-2 flex items-center justify-between mt-1">
          <span className="text-sm font-semibold">Utilidad Bruta</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{results.grossMargin.toFixed(1)}%</span>
            <span className={`text-sm font-bold tabular-nums ${results.grossProfit >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(results.grossProfit)}
            </span>
          </div>
        </div>

        {/* Gastos Operativos */}
        <div className="mt-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Gastos Operativos</span>
          {Object.entries(results.opexByCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([cat, amount]) => (
              <Row key={cat} label={cat} value={amount} indent />
            ))}
          <Row label="Total Operativos" value={results.opex} bold color="text-destructive" />
        </div>

        {/* Utilidad Operativa */}
        <div className={`rounded-lg px-3 py-2 flex items-center justify-between mt-1 ${
          results.operatingProfit >= 0 ? "bg-success/10" : "bg-destructive/10"
        }`}>
          <span className="text-sm font-semibold">Utilidad Operativa</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{results.operatingMargin.toFixed(1)}%</span>
            <span className={`text-sm font-bold tabular-nums ${results.operatingProfit >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(results.operatingProfit)}
            </span>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}