"use client"

import { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useFinance } from "@/components/providers/finance-provider"
import { formatCurrency, getCategoryColor } from "@/lib/finance-store"
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns"
import { useMonthFilter } from "@/components/dashboard/month-filter"
import { es } from "date-fns/locale"

export function ExpenseChart() {
  const { data } = useFinance()
  const { selectedMonth } = useMonthFilter()

  const { chartData, monthLabel } = useMemo(() => {
    const selectedDate = parseISO(`${selectedMonth}-01`)
    const monthStart = format(startOfMonth(selectedDate), "yyyy-MM-dd")
    const monthEnd = format(endOfMonth(selectedDate), "yyyy-MM-dd")
    const label = format(selectedDate, "MMMM yyyy", { locale: es })
    const labelCap = label.charAt(0).toUpperCase() + label.slice(1)

    const categoryTotals: Record<string, number> = {}
    data.transactions
      .filter(t => t.type === "expense" && t.date >= monthStart && t.date <= monthEnd)
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
      })

    const cd = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value, color: getCategoryColor(data.categories, name) }))
      .sort((a, b) => b.value - a.value)

    return { chartData: cd, monthLabel: labelCap }
  }, [data.transactions, data.categories, selectedMonth])

  const total = chartData.reduce((sum, d) => sum + d.value, 0)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Gastos por Categoria</CardTitle>
        <CardDescription>Distribucion de {monthLabel}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {chartData.length === 0 ? (
          <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
            Sin gastos registrados en este mes
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 lg:flex-row lg:items-start">
            <div className="w-full max-w-[200px]">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const item = payload[0]
                      return (
                        <div className="rounded-lg border bg-card p-2 shadow-md">
                          <p className="text-xs font-medium text-card-foreground">{item.name}</p>
                          <p className="text-sm font-semibold text-card-foreground">
                            {formatCurrency(item.value as number)}
                          </p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {chartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
                    <span className="text-xs text-muted-foreground">
                      ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
