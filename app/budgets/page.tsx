"use client"

import { useState } from "react"
import { format, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { BudgetList } from "@/components/budgets/budget-list"
import { BudgetForm } from "@/components/budgets/budget-form"
import { useFinance } from "@/components/providers/finance-provider"
import { Skeleton } from "@/components/ui/skeleton"
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
import type { Budget } from "@/lib/types"

export default function BudgetsPage() {
  const { isLoaded, deleteBudget } = useFinance()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [formOpen, setFormOpen] = useState(false)
  const [editBudget, setEditBudget] = useState<Budget | null>(null)
  const [deleteBudgetId, setDeleteBudgetId] = useState<string | null>(null)

  const monthKey = format(currentMonth, "yyyy-MM")
  const monthLabel = format(currentMonth, "MMMM yyyy", { locale: es })

  function handleDelete() {
    if (deleteBudgetId) {
      deleteBudget(deleteBudgetId)
      toast.success("Presupuesto eliminado")
      setDeleteBudgetId(null)
    }
  }

  return (
    <AppShell title="Presupuestos">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Presupuestos</h2>
            <p className="text-sm text-muted-foreground">
              Establece limites de gasto por categoria y monitorea tu avance.
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Nuevo Presupuesto
          </Button>
        </div>

        {/* Month navigator */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Mes anterior</span>
          </Button>
          <span className="min-w-[160px] text-center text-sm font-semibold capitalize text-foreground">
            {monthLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Mes siguiente</span>
          </Button>
        </div>

        {!isLoaded ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        ) : (
          <BudgetList
            month={monthKey}
            onEdit={(b) => setEditBudget(b)}
            onDelete={(id) => setDeleteBudgetId(id)}
          />
        )}
      </div>

      {/* Add form */}
      <BudgetForm
        open={formOpen}
        onOpenChange={setFormOpen}
        month={monthKey}
      />

      {/* Edit form */}
      {editBudget && (
        <BudgetForm
          open={!!editBudget}
          onOpenChange={(open) => { if (!open) setEditBudget(null) }}
          month={monthKey}
          budget={editBudget}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteBudgetId} onOpenChange={(open) => { if (!open) setDeleteBudgetId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar presupuesto</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminara este presupuesto. Esta accion no se puede deshacer.
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
