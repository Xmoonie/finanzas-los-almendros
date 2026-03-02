"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/finance-store"
import type { Transaction } from "@/lib/types"

interface ProfitLossProps {
  transactions: Transaction[]
}

export function ProfitLoss({ transactions }: ProfitLossProps) {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0)

  const profit = income - expenses
  const margin = income > 0 ? (profit / income) * 100 : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estado de Resultados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg bg-success/10 p-3">
            <span className="text-sm font-medium text-success">Total Ingresos</span>
            <span className="text-lg font-bold tabular-nums text-success">{formatCurrency(income)}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-destructive/10 p-3">
            <span className="text-sm font-medium text-destructive">Total Gastos</span>
            <span className="text-lg font-bold tabular-nums text-destructive">{formatCurrency(expenses)}</span>
          </div>
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Ganancia Neta</span>
              <span className={`text-xl font-bold tabular-nums ${profit >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(profit)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Margen de ganancia</span>
              <span className={`text-sm font-medium ${margin >= 0 ? "text-success" : "text-destructive"}`}>
                {margin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
