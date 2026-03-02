"use client"

import { useMemo } from "react"
import { format, eachMonthOfInterval, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { formatCurrency } from "@/lib/finance-store"
import type { Transaction } from "@/lib/types"

interface MonthlyComparisonProps {
  transactions: Transaction[]
  dateRange: { from: Date; to: Date }
}

export function MonthlyComparison({ transactions, dateRange }: MonthlyComparisonProps) {
  const monthData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: startOfMonth(dateRange.from),
      end: endOfMonth(dateRange.to),
    })

    return months.map((monthDate) => {
      const monthKey = format(monthDate, "yyyy-MM")
      const label = format(monthDate, "MMMM yyyy", { locale: es })

      const income = transactions
        .filter(t => t.type === "income" && t.date.startsWith(monthKey))
        .reduce((sum, t) => sum + t.amount, 0)

      const expenses = transactions
        .filter(t => t.type === "expense" && t.date.startsWith(monthKey))
        .reduce((sum, t) => sum + t.amount, 0)

      return { label, income, expenses, profit: income - expenses }
    })
  }, [transactions, dateRange])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparacion Mensual</CardTitle>
        <CardDescription>Ingresos, gastos y ganancia por mes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mes</TableHead>
                <TableHead className="text-right">Ingresos</TableHead>
                <TableHead className="text-right">Gastos</TableHead>
                <TableHead className="text-right">Ganancia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthData.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="text-sm font-medium capitalize">{row.label}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-success">
                    {formatCurrency(row.income)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-destructive">
                    {formatCurrency(row.expenses)}
                  </TableCell>
                  <TableCell className={`text-right text-sm font-semibold tabular-nums ${
                    row.profit >= 0 ? "text-success" : "text-destructive"
                  }`}>
                    {formatCurrency(row.profit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
