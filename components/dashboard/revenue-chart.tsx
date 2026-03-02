"use client"

import { useMemo } from "react"
import { format, subMonths, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useFinance } from "@/components/providers/finance-provider"
import { formatCurrency } from "@/lib/finance-store"
import { useMonthFilter } from "@/components/dashboard/month-filter"

export function RevenueChart() {
  const { data } = useFinance()
  const { selectedMonth } = useMonthFilter()

  const chartData = useMemo(() => {
    // Always show 6 months centered around selected month (3 before, selected, 2 after capped at now)
    const selected = parseISO(`${selectedMonth}-01`)
    const now = new Date()
    const months = []

    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(selected, i)
      // Don't show future months
      if (monthDate > now) continue
      const monthKey = format(monthDate, "yyyy-MM")
      const monthLabel = format(monthDate, "MMM", { locale: es })

      const income = data.transactions
        .filter(t => t.type === "income" && t.date.startsWith(monthKey))
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = data.transactions
        .filter(t => t.type === "expense" && t.date.startsWith(monthKey))
        .reduce((sum, t) => sum + t.amount, 0)

      months.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        monthKey,
        ingresos: income,
        gastos: expenses,
        isSelected: monthKey === selectedMonth,
      })
    }

    return months
  }, [data.transactions, selectedMonth])

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Ingresos vs Gastos</CardTitle>
        <CardDescription>Ultimos meses — mes seleccionado resaltado</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
            <XAxis
              dataKey="month"
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `L ${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-lg border bg-card p-3 shadow-md">
                    <p className="mb-2 text-sm font-semibold text-card-foreground">{label}</p>
                    {payload.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
                          <span className="text-muted-foreground">{entry.name === "ingresos" ? "Ingresos" : "Gastos"}</span>
                        </div>
                        <span className="font-medium text-card-foreground">{formatCurrency(entry.value as number)}</span>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
            <Bar dataKey="ingresos" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, i) => (
                <Cell
                  key={`income-${i}`}
                  fill={entry.isSelected ? "var(--color-chart-2)" : "var(--color-chart-2)"}
                  opacity={entry.isSelected ? 1 : 0.4}
                />
              ))}
            </Bar>
            <Bar dataKey="gastos" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {chartData.map((entry, i) => (
                <Cell
                  key={`expense-${i}`}
                  fill="var(--color-chart-3)"
                  opacity={entry.isSelected ? 1 : 0.4}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
