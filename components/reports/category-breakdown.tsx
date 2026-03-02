"use client"

import { useMemo } from "react"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency, getCategoryColor } from "@/lib/finance-store"
import type { Transaction, TransactionType, Category } from "@/lib/types"

interface CategoryBreakdownProps {
  transactions: Transaction[]
  categories: Category[]
  type: TransactionType
}

export function CategoryBreakdown({ transactions, categories, type }: CategoryBreakdownProps) {
  const chartData = useMemo(() => {
    const totals: Record<string, number> = {}

    transactions
      .filter(t => t.type === type)
      .forEach(t => {
        totals[t.category] = (totals[t.category] || 0) + t.amount
      })

    return Object.entries(totals)
      .map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(categories, name),
      }))
      .sort((a, b) => b.value - a.value)
  }, [transactions, categories, type])

  const title = type === "income" ? "Ingresos por Categoria" : "Gastos por Categoria"
  const description = type === "income" ? "Desglose de fuentes de ingreso" : "Desglose de gastos"

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay datos para mostrar.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(chartData.length * 44, 120)}>
            <BarChart data={chartData} layout="vertical" barCategoryGap={8}>
              <XAxis
                type="number"
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `L ${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                className="text-xs fill-muted-foreground"
                tickLine={false}
                axisLine={false}
                width={110}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const item = payload[0]
                  return (
                    <div className="rounded-lg border bg-card p-2 shadow-md">
                      <p className="text-xs font-medium text-card-foreground">{item.payload.name}</p>
                      <p className="text-sm font-semibold text-card-foreground">{formatCurrency(item.value as number)}</p>
                    </div>
                  )
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={28}>
                {chartData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
