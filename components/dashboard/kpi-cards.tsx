"use client"

import { useMemo } from "react"
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { useFinance } from "@/components/providers/finance-provider"
import { formatCurrency } from "@/lib/finance-store"
import { useMonthFilter } from "@/components/dashboard/month-filter"

interface KPIData {
  label: string
  value: number
  change: number
  icon: React.ElementType
  type: "income" | "expense" | "profit" | "balance"
}

export function KPICards() {
  const { data } = useFinance()
  const { selectedMonth } = useMonthFilter()

  const kpis = useMemo<KPIData[]>(() => {
    const selectedDate = parseISO(`${selectedMonth}-01`)
    const prevDate = subMonths(selectedDate, 1)

    const selStart = format(startOfMonth(selectedDate), "yyyy-MM-dd")
    const selEnd = format(endOfMonth(selectedDate), "yyyy-MM-dd")
    const prevStart = format(startOfMonth(prevDate), "yyyy-MM-dd")
    const prevEnd = format(endOfMonth(prevDate), "yyyy-MM-dd")

    const currentIncome = data.transactions
      .filter(t => t.type === "income" && t.date >= selStart && t.date <= selEnd)
      .reduce((sum, t) => sum + t.amount, 0)

    const currentExpenses = data.transactions
      .filter(t => t.type === "expense" && t.date >= selStart && t.date <= selEnd)
      .reduce((sum, t) => sum + t.amount, 0)

    const lastIncome = data.transactions
      .filter(t => t.type === "income" && t.date >= prevStart && t.date <= prevEnd)
      .reduce((sum, t) => sum + t.amount, 0)

    const lastExpenses = data.transactions
      .filter(t => t.type === "expense" && t.date >= prevStart && t.date <= prevEnd)
      .reduce((sum, t) => sum + t.amount, 0)

    const totalIncome = data.transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = data.transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0
    const expenseChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0
    const currentProfit = currentIncome - currentExpenses
    const lastProfit = lastIncome - lastExpenses
    const profitChange = lastProfit !== 0 ? ((currentProfit - lastProfit) / Math.abs(lastProfit)) * 100 : 0

    return [
      { label: "Ingresos del Mes", value: currentIncome, change: incomeChange, icon: TrendingUp, type: "income" },
      { label: "Gastos del Mes", value: currentExpenses, change: expenseChange, icon: TrendingDown, type: "expense" },
      { label: "Ganancia Neta", value: currentProfit, change: profitChange, icon: DollarSign, type: "profit" },
      { label: "Balance Total", value: totalIncome - totalExpenses, change: 0, icon: PiggyBank, type: "balance" },
    ]
  }, [data.transactions, selectedMonth])

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
                <span className="text-2xl font-bold tracking-tight">
                  {formatCurrency(kpi.value)}
                </span>
                {kpi.type !== "balance" && (
                  <div className="flex items-center gap-1">
                    {kpi.change >= 0 ? (
                      <TrendingUp className="size-3 text-success" />
                    ) : (
                      <TrendingDown className="size-3 text-destructive" />
                    )}
                    <span className={`text-xs font-medium ${kpi.change >= 0 ? "text-success" : "text-destructive"}`}>
                      {kpi.change >= 0 ? "+" : ""}{kpi.change.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs mes anterior</span>
                  </div>
                )}
              </div>
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                kpi.type === "income" ? "bg-success/10 text-success" :
                kpi.type === "expense" ? "bg-destructive/10 text-destructive" :
                kpi.type === "profit" ? "bg-primary/10 text-primary" :
                "bg-chart-4/10 text-chart-4"
              }`}>
                <kpi.icon className="size-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
