"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { TransactionTable } from "@/components/transactions/transaction-table"
import { TransactionForm } from "@/components/transactions/transaction-form"
import { useFinance } from "@/components/providers/finance-provider"
import { Skeleton } from "@/components/ui/skeleton"

export default function ExpensesPage() {
  const { isLoaded } = useFinance()
  const [formOpen, setFormOpen] = useState(false)

  return (
    <AppShell title="Gastos">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Gastos</h2>
            <p className="text-sm text-muted-foreground">
              Registra y administra todos los gastos de tu negocio.
            </p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Agregar Gasto
          </Button>
        </div>

        {!isLoaded ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : (
          <TransactionTable type="expense" />
        )}
      </div>

      <TransactionForm open={formOpen} onOpenChange={setFormOpen} type="expense" />
    </AppShell>
  )
}
