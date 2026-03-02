"use client"

import { useState } from "react"
import { format } from "date-fns"
import { AppShell } from "@/components/layout/app-shell"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { ExpenseChart } from "@/components/dashboard/expense-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { MonthPicker, MonthFilterProvider } from "@/components/dashboard/month-filter"
import { useFinance } from "@/components/providers/finance-provider"
import { Skeleton } from "@/components/ui/skeleton"

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}

function DashboardContent() {
  const { isLoaded } = useFinance()
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"))

  if (!isLoaded) return <DashboardSkeleton />

  return (
    <MonthFilterProvider selectedMonth={selectedMonth}>
      <div className="flex flex-col gap-6 p-6">
        {/* Month filter row */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Resumen del período</h2>
            <p className="text-xs text-muted-foreground">Filtra por mes para ver el rendimiento específico</p>
          </div>
          <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
        </div>
        <KPICards />
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart />
          <ExpenseChart />
        </div>
        <RecentTransactions />
      </div>
    </MonthFilterProvider>
  )
}

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <DashboardContent />
    </AppShell>
  )
}
