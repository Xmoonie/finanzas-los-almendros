"use client"

import { useMemo } from "react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, eachWeekOfInterval, eachMonthOfInterval, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFinance } from "@/components/providers/finance-provider"
import type { BalancePeriod } from "@/lib/finance-store"

interface BalanceChartProps {
  period: BalancePeriod
}

export function BalanceChart({ period }: BalanceChartProps) {
  const { data } = useFinance()

  const chartData = useMemo(() => {
    const now = new Date()
    const txs = data.transactions

    switch (period) {
      case "day": {
        // Show hourly-ish breakdown not useful, instead show last 7 days
        const days = eachDayOfInterval({
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6),
          end: now,
        })
        return days.map(day => {
          const dayStr = format(day, "yyyy-MM-dd")
          const income = txs.filter(t => t.type === "income" && t.date === dayStr).reduce((s, t) => s + t.amount, 0)
          const expense = txs.filter(t => t.type === "expense" && t.date === dayStr).reduce((s, t) => s + t.amount, 0)
          return {
            label: format(day, "EEE dd", { locale: es }),
            Ingresos: income,
            Gastos: expense,
            Neto: income - expense,
          }
        })
      }
      case "week": {
        const weekStart = startOfWeek(now, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
        const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
        return days.map(day => {
          const dayStr = format(day, "yyyy-MM-dd")
          const income = txs.filter(t => t.type === "income" && t.date === dayStr).reduce((s, t) => s + t.amount, 0)
          const expense = txs.filter(t => t.type === "expense" && t.date === dayStr).reduce((s, t) => s + t.amount, 0)
          return {
            label: format(day, "EEE dd", { locale: es }),
            Ingresos: income,
            Gastos: expense,
            Neto: income - expense,
          }
        })
      }
      case "month": {
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)
        // Group into weekly chunks
        const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 })
        return weeks.map((weekStart, idx) => {
          const weekEndDate = idx < weeks.length - 1 ? new Date(weeks[idx + 1].getTime() - 1) : monthEnd
          const startStr = format(weekStart < monthStart ? monthStart : weekStart, "yyyy-MM-dd")
          const endStr = format(weekEndDate > monthEnd ? monthEnd : weekEndDate, "yyyy-MM-dd")
          const income = txs.filter(t => t.type === "income" && t.date >= startStr && t.date <= endStr).reduce((s, t) => s + t.amount, 0)
          const expense = txs.filter(t => t.type === "expense" && t.date >= startStr && t.date <= endStr).reduce((s, t) => s + t.amount, 0)
          return {
            label: `Sem ${idx + 1}`,
            Ingresos: income,
            Gastos: expense,
            Neto: income - expense,
          }
        })
      }
      default: {
        // All time - group by month (last 6 months)
        const months = eachMonthOfInterval({
          start: subMonths(now, 5),
          end: now,
        })
        return months.map(month => {
          const monthStart = format(startOfMonth(month), "yyyy-MM-dd")
          const monthEnd = format(endOfMonth(month), "yyyy-MM-dd")
          const income = txs.filter(t => t.type === "income" && t.date >= monthStart && t.date <= monthEnd).reduce((s, t) => s + t.amount, 0)
          const expense = txs.filter(t => t.type === "expense" && t.date >= monthStart && t.date <= monthEnd).reduce((s, t) => s + t.amount, 0)
          return {
            label: format(month, "MMM yy", { locale: es }),
            Ingresos: income,
            Gastos: expense,
            Neto: income - expense,
          }
        })
      }
    }
  }, [data.transactions, period])

  const formatValue = (value: number) =>
    `L ${(value / 1000).toFixed(1)}k`

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Ingresos vs Gastos</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              axisLine={false}
              tickLine={false}
              tickFormatter={formatValue}
            />
            <Tooltip
              formatter={(value: number) => [`L ${value.toLocaleString("es-HN", { minimumFractionDigits: 2 })}`, undefined]}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
                fontSize: "12px",
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
            />
            <Bar dataKey="Ingresos" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Gastos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
