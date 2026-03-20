"use client"

import { useMemo, useState } from "react"
import { Calculator } from "lucide-react"
import { format, getDaysInMonth } from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFinance } from "@/components/providers/finance-provider"
import { formatCurrency } from "@/lib/finance-store"
import type { BalancePeriod } from "@/lib/finance-store"

type ViewPeriod = "day" | "month" | "year" | "all"

interface DailyAveragesProps {
  period: BalancePeriod
  onPeriodChange: (period: BalancePeriod) => void
}

export function DailyAverages({ period, onPeriodChange }: DailyAveragesProps) {
  const { data } = useFinance()
  const currentMonth = format(new Date(), "yyyy-MM")
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>("month")
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const availableMonths = useMemo(() => {
    const months = new Set(data.transactions.map(t => t.date.substring(0, 7)))
    if (!months.has(currentMonth)) months.add(currentMonth)
    return Array.from(months).sort((a, b) => b.localeCompare(a))
  }, [data.transactions, currentMonth])

  const availableYears = useMemo(() => {
    const years = new Set(data.transactions.map(t => t.date.substring(0, 4)))
    return Array.from(years).sort((a, b) => b.localeCompare(a))
  }, [data.transactions])

  const results = useMemo(() => {
    const txs = data.transactions

    if (viewPeriod === "day") {
      // Filtrar por mes seleccionado
      const monthTxs = txs.filter(t => t.date.startsWith(selectedMonth))
      const incomeDays = new Set(monthTxs.filter(t => t.type === "income").map(t => t.date)).size
      const expenseDays = new Set(monthTxs.filter(t => t.type === "expense").map(t => t.date)).size
      const totalIncome = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
      const totalExpenses = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
      return {
        income: incomeDays > 0 ? totalIncome / incomeDays : 0,
        expenses: expenseDays > 0 ? totalExpenses / expenseDays : 0,
        net: 0,
        incomeLabel: `Promedio diario (${incomeDays} días con ventas)`,
        expensesLabel: `Promedio diario (${expenseDays} días con gastos)`,
        netLabel: "",
        showNet: false,
        projection: {
          show: true,
          daysInMonth: getDaysInMonth(new Date(selectedMonth + "-01")),
          income: incomeDays > 0 ? (totalIncome / incomeDays) * getDaysInMonth(new Date(selectedMonth + "-01")) : 0,
          expenses: expenseDays > 0 ? (totalExpenses / expenseDays) * getDaysInMonth(new Date(selectedMonth + "-01")) : 0,
        }
      }
    }

    if (viewPeriod === "month") {
      // Total del mes seleccionado
      const monthTxs = txs.filter(t => t.date.startsWith(selectedMonth))
      const totalIncome = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
      const totalExpenses = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
      return {
        income: totalIncome,
        expenses: totalExpenses,
        net: totalIncome - totalExpenses,
        incomeLabel: "Total ingresos del mes",
        expensesLabel: "Total gastos del mes",
        netLabel: "Neto del mes",
        showNet: true,
        projection: null,
      }
    }

    if (viewPeriod === "year") {
      // Promedio mensual dentro del año seleccionado
      const year = availableYears[0] ?? format(new Date(), "yyyy")
      const yearTxs = txs.filter(t => t.date.startsWith(year))
      const incomeMonths = new Set(yearTxs.filter(t => t.type === "income").map(t => t.date.substring(0, 7))).size
      const expenseMonths = new Set(yearTxs.filter(t => t.type === "expense").map(t => t.date.substring(0, 7))).size
      const totalIncome = yearTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
      const totalExpenses = yearTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
      return {
        income: incomeMonths > 0 ? totalIncome / incomeMonths : 0,
        expenses: expenseMonths > 0 ? totalExpenses / expenseMonths : 0,
        net: 0,
        incomeLabel: `Promedio mensual (${incomeMonths} meses con ventas)`,
        expensesLabel: `Promedio mensual (${expenseMonths} meses con gastos)`,
        netLabel: "",
        showNet: false,
        projection: null,
      }
    }

    // All — promedio mensual histórico
    const incomeMonths = new Set(txs.filter(t => t.type === "income").map(t => t.date.substring(0, 7))).size
    const expenseMonths = new Set(txs.filter(t => t.type === "expense").map(t => t.date.substring(0, 7))).size
    const totalIncome = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0)
    const totalExpenses = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0)
    return {
      income: incomeMonths > 0 ? totalIncome / incomeMonths : 0,
      expenses: expenseMonths > 0 ? totalExpenses / expenseMonths : 0,
      net: 0,
      incomeLabel: `Promedio mensual (${incomeMonths} meses con ventas)`,
      expensesLabel: `Promedio mensual (${expenseMonths} meses con gastos)`,
      netLabel: "",
      showNet: false,
      projection: null,
    }
  }, [data.transactions, viewPeriod, selectedMonth, availableYears])

  const formatMonthLabel = (yyyymm: string) => {
    const [y, m] = yyyymm.split("-")
    const label = format(new Date(parseInt(y), parseInt(m) - 1, 1), "MMM yyyy", { locale: es })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  const viewLabels: Record<ViewPeriod, string> = {
    day: "Promedio diario",
    month: "Por mes",
    year: "Promedio mensual del año",
    all: "Histórico",
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Calculator className="size-4 text-muted-foreground" />
            Promedios
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {(viewPeriod === "day" || viewPeriod === "month") && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[110px] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map(m => (
                    <SelectItem key={m} value={m} className="text-xs">{formatMonthLabel(m)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={viewPeriod} onValueChange={v => setViewPeriod(v as ViewPeriod)}>
              <SelectTrigger className="w-[140px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(viewLabels) as [ViewPeriod, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{results.incomeLabel}</span>
          <div className="rounded-md px-2.5 py-1 text-sm font-semibold text-success bg-success/10">
            {formatCurrency(results.income)}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{results.expensesLabel}</span>
          <div className="rounded-md px-2.5 py-1 text-sm font-semibold text-destructive bg-destructive/10">
            {formatCurrency(results.expenses)}
          </div>
        </div>
        {results.showNet && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{results.netLabel}</span>
            <div className={`rounded-md px-2.5 py-1 text-sm font-semibold ${results.net >= 0 ? "text-success bg-success/10" : "text-destructive bg-destructive/10"}`}>
              {formatCurrency(results.net)}
            </div>
          </div>
        )}
        {results.projection && (
          <div className="mt-2 rounded-lg border border-dashed p-3">
            <p className="text-xs text-muted-foreground">Proyección si se vende todos los días del mes:</p>
            <div className="mt-2 flex flex-col gap-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Ingresos proyectados</span>
                <span className="font-medium text-success">{formatCurrency(results.projection.income)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Gastos proyectados</span>
                <span className="font-medium text-destructive">{formatCurrency(results.projection.expenses)}</span>
              </div>
              <div className="flex justify-between text-xs border-t pt-1 mt-1">
                <span className="text-muted-foreground">Neto proyectado</span>
                <span className={`font-bold ${(results.projection.income - results.projection.expenses) >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(results.projection.income - results.projection.expenses)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}