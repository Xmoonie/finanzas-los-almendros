"use client"

import { useMemo } from "react"
import { format, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/finance-store"
import type { Transaction } from "@/lib/types"

interface CashFlowChartProps {
  transactions: Transaction[]
  dateRange: { from: Date; to: Date }
}

export function CashFlowChart({ transactions, dateRange }: CashFlowChartProps) {
  const chartData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: startOfMonth(dateRange.from),
      end: endOfMonth(dateRange.to),
    })

    let cumulative = 0

    return months.map((monthDate) => {
      const monthKey = format(monthDate, "yyyy-MM")
      const monthLabel = format(monthDate, "MMM yy", { locale: es })

      const monthIncome = transactions
        .filter(t => t.type === "income" && t.date.startsWith(monthKey))
        .reduce((sum, t) => sum + t.amount, 0)

      const monthExpenses = transactions
        .filter(t => t.type === "expense" && t.date.startsWith(monthKey))
        .reduce((sum, t) => sum + t.amount, 0)

      const netFlow = monthIncome - monthExpenses
      cumulative += netFlow

      return {
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        flujo: netFlow,
        acumulado: cumulative,
      }
    })
  }, [transactions, dateRange])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flujo de Efectivo</CardTitle>
        <CardDescription>Flujo neto y acumulado por mes</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillAcumulado" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
                          <span className="text-muted-foreground">
                            {entry.name === "flujo" ? "Flujo Neto" : "Acumulado"}
                          </span>
                        </div>
                        <span className="font-medium text-card-foreground">{formatCurrency(entry.value as number)}</span>
                      </div>
                    ))}
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="acumulado"
              stroke="var(--color-chart-1)"
              fill="url(#fillAcumulado)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="flujo"
              stroke="var(--color-chart-2)"
              fill="transparent"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
