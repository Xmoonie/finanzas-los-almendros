"use client"

import { useState, useMemo } from "react"
import { Plus, Repeat, Pencil, Trash2, Power, PowerOff } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { useFinance } from "@/components/providers/finance-provider"
import { formatCurrency, getMonthlyRecurringTotal, getCategoryColor } from "@/lib/finance-store"
import { RecurringForm } from "@/components/recurring/recurring-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import type { RecurringExpense, RecurringFrequency } from "@/lib/types"

const frequencyLabels: Record<RecurringFrequency, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  yearly: "Anual",
}

function RecurringSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  )
}

export default function RecurringPage() {
  const { data, isLoaded, deleteRecurringExpense, toggleRecurringExpense } = useFinance()
  const [formOpen, setFormOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<RecurringExpense | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const monthlyTotal = useMemo(
    () => getMonthlyRecurringTotal(data.recurringExpenses),
    [data.recurringExpenses]
  )

  const activeCount = data.recurringExpenses.filter(r => r.active).length
  const inactiveCount = data.recurringExpenses.length - activeCount

  const yearlyProjection = monthlyTotal * 12

  const handleEdit = (expense: RecurringExpense) => {
    setEditExpense(expense)
  }

  const handleDelete = () => {
    if (deleteId) {
      deleteRecurringExpense(deleteId)
      toast.success("Gasto fijo eliminado")
      setDeleteId(null)
    }
  }

  const handleToggle = (id: string) => {
    toggleRecurringExpense(id)
    const expense = data.recurringExpenses.find(r => r.id === id)
    if (expense) {
      toast.success(expense.active ? "Gasto fijo desactivado" : "Gasto fijo activado")
    }
  }

  if (!isLoaded) {
    return (
      <AppShell title="Gastos Fijos">
        <RecurringSkeleton />
      </AppShell>
    )
  }

  return (
    <AppShell title="Gastos Fijos">
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Gastos Fijos</h2>
            <p className="text-sm text-muted-foreground">
              Administra tus gastos recurrentes y fijos del negocio.
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Agregar Gasto Fijo
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Total Mensual</span>
                  <span className="text-xl font-bold tracking-tight text-foreground">
                    {formatCurrency(monthlyTotal)}
                  </span>
                </div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-chart-5/10">
                  <Repeat className="size-4 text-chart-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Proyeccion Anual</span>
                  <span className="text-xl font-bold tracking-tight text-foreground">
                    {formatCurrency(yearlyProjection)}
                  </span>
                </div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-warning/10">
                  <Repeat className="size-4 text-warning" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">Estado</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-success text-success-foreground">
                      {activeCount} activos
                    </Badge>
                    {inactiveCount > 0 && (
                      <Badge variant="secondary">
                        {inactiveCount} inactivos
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <Power className="size-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recurring expenses list */}
        {data.recurringExpenses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-12">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Repeat className="size-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">No hay gastos fijos</p>
                <p className="text-sm text-muted-foreground">
                  Agrega tus gastos recurrentes para un mejor control.
                </p>
              </div>
              <Button onClick={() => setFormOpen(true)} variant="outline" className="mt-2 gap-2">
                <Plus className="size-4" />
                Agregar Gasto Fijo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {data.recurringExpenses.map((expense) => (
              <Card
                key={expense.id}
                className={`transition-opacity ${!expense.active ? "opacity-50" : ""}`}
              >
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4">
                    {/* Category color indicator */}
                    <div
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: getCategoryColor(data.categories, expense.category) }}
                    />

                    {/* Info */}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {expense.description}
                        </span>
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          {frequencyLabels[expense.frequency]}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {expense.category} &middot; {expense.payee}
                      </span>
                    </div>

                    {/* Amount */}
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {formatCurrency(expense.amount)}
                    </span>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1">
                      <Switch
                        checked={expense.active}
                        onCheckedChange={() => handleToggle(expense.id)}
                        aria-label={expense.active ? "Desactivar" : "Activar"}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleEdit(expense)}
                      >
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(expense.id)}
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit form */}
      <RecurringForm
        open={formOpen || !!editExpense}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false)
            setEditExpense(null)
          }
        }}
        expense={editExpense}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar gasto fijo</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminara el gasto recurrente permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  )
}
