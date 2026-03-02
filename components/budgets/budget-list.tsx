"use client"

import { useMemo } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useFinance } from "@/components/providers/finance-provider"
import { formatCurrency, getCategoryColor } from "@/lib/finance-store"
import type { Budget } from "@/lib/types"

interface BudgetListProps {
  month: string
  onEdit: (budget: Budget) => void
  onDelete: (id: string) => void
}

export function BudgetList({ month, onEdit, onDelete }: BudgetListProps) {
  const { data } = useFinance()

  const budgetData = useMemo(() => {
    const monthBudgets = data.budgets.filter(b => b.month === month)

    return monthBudgets.map((budget) => {
      const spent = data.transactions
        .filter(t => t.type === "expense" && t.category === budget.category && t.date.startsWith(month))
        .reduce((sum, t) => sum + t.amount, 0)

      const percentage = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0
      const remaining = budget.monthlyLimit - spent
      const color = getCategoryColor(data.categories, budget.category)

      return { ...budget, spent, percentage, remaining, color }
    })
  }, [data.budgets, data.transactions, data.categories, month])

  const totalBudgeted = budgetData.reduce((sum, b) => sum + b.monthlyLimit, 0)
  const totalSpent = budgetData.reduce((sum, b) => sum + b.spent, 0)
  const totalPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  if (budgetData.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No hay presupuestos para este mes. Crea uno para comenzar a controlar tus gastos.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Overview card */}
      <Card>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Resumen General</span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {formatCurrency(totalSpent)} / {formatCurrency(totalBudgeted)}
              </span>
            </div>
            <Progress
              value={Math.min(totalPercentage, 100)}
              className={`h-3 ${
                totalPercentage > 90
                  ? "[&>[data-slot=progress-indicator]]:bg-destructive"
                  : totalPercentage > 75
                  ? "[&>[data-slot=progress-indicator]]:bg-warning"
                  : "[&>[data-slot=progress-indicator]]:bg-success"
              }`}
            />
            <div className="flex items-center justify-between text-sm">
              <span className={`font-semibold ${
                totalPercentage > 90 ? "text-destructive" : totalPercentage > 75 ? "text-warning" : "text-success"
              }`}>
                {totalPercentage.toFixed(0)}% utilizado
              </span>
              <span className="text-muted-foreground">
                Restante: {formatCurrency(Math.max(totalBudgeted - totalSpent, 0))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual budget cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {budgetData.map((b) => (
          <Card key={b.id} className="relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: b.color }} />
            <CardContent className="pt-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-2.5 rounded-full" style={{ backgroundColor: b.color }} />
                    <span className="text-sm font-semibold text-foreground">{b.category}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => onEdit(b)}
                    >
                      <Pencil className="size-3" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(b.id)}
                    >
                      <Trash2 className="size-3" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-bold tabular-nums text-foreground">
                    {formatCurrency(b.spent)}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    de {formatCurrency(b.monthlyLimit)}
                  </span>
                </div>

                <Progress
                  value={Math.min(b.percentage, 100)}
                  className={`h-2 ${
                    b.percentage > 90
                      ? "[&>[data-slot=progress-indicator]]:bg-destructive"
                      : b.percentage > 75
                      ? "[&>[data-slot=progress-indicator]]:bg-warning"
                      : "[&>[data-slot=progress-indicator]]:bg-success"
                  }`}
                />

                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${
                    b.percentage > 90 ? "text-destructive" : b.percentage > 75 ? "text-warning" : "text-success"
                  }`}>
                    {b.percentage.toFixed(0)}%
                  </span>
                  <span className="text-muted-foreground">
                    {b.remaining >= 0
                      ? `Restante: ${formatCurrency(b.remaining)}`
                      : `Excedido: ${formatCurrency(Math.abs(b.remaining))}`
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
