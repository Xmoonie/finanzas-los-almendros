"use client"

import { useMemo } from "react"
import { TrendingUp, TrendingDown, Scale, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFinance } from "@/components/providers/finance-provider"
import { formatCurrency, getBalanceForPeriod, getMonthlyRecurringTotal } from "@/lib/finance-store"
import type { BalancePeriod } from "@/lib/finance-store"

interface BalanceSummaryProps {
  period: BalancePeriod
}

export function BalanceSummary({ period }: BalanceSummaryProps) {
  const { data } = useFinance()

  const balance = useMemo(
    () => getBalanceForPeriod(data.transactions, period),
    [data.transactions, period]
  )

  const recurringMonthly = useMemo(
    () => getMonthlyRecurringTotal(data.recurringExpenses),
    [data.recurringExpenses]
  )

  const allTimeBalance = useMemo(
    () => getBalanceForPeriod(data.transactions, "all"),
    [data.transactions]
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Main balance card */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Scale className="size-4" />
            Balance Neto - {balance.periodLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <span className={`text-4xl font-bold tracking-tight ${
              balance.netBalance >= 0 ? "text-success" : "text-destructive"
            }`}>
              {formatCurrency(balance.netBalance)}
            </span>
            <span className="text-xs text-muted-foreground">
              {balance.transactionCount} transaccion{balance.transactionCount !== 1 ? "es" : ""} en este periodo
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Income / Expense / Recurring breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Ingresos</span>
                <span className="text-xl font-bold tracking-tight text-success">
                  {formatCurrency(balance.totalIncome)}
                </span>
              </div>
              <div className="flex size-9 items-center justify-center rounded-lg bg-success/10">
                <ArrowUpRight className="size-4 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Gastos</span>
                <span className="text-xl font-bold tracking-tight text-destructive">
                  {formatCurrency(balance.totalExpenses)}
                </span>
              </div>
              <div className="flex size-9 items-center justify-center rounded-lg bg-destructive/10">
                <ArrowDownRight className="size-4 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Gastos Fijos / Mes</span>
                <span className="text-xl font-bold tracking-tight text-chart-5">
                  {formatCurrency(recurringMonthly)}
                </span>
              </div>
              <div className="flex size-9 items-center justify-center rounded-lg bg-chart-5/10">
                <TrendingDown className="size-4 text-chart-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All-time balance if filtered */}
      {period !== "all" && (
        <Card className="border-dashed">
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">Balance Total Historico</span>
                <span className={`text-lg font-bold tracking-tight ${
                  allTimeBalance.netBalance >= 0 ? "text-success" : "text-destructive"
                }`}>
                  {formatCurrency(allTimeBalance.netBalance)}
                </span>
              </div>
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <Scale className="size-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
