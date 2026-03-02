"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { useFinance } from "@/components/providers/finance-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BalanceSummary } from "@/components/balance/balance-summary"
import { BalanceChart } from "@/components/balance/balance-chart"
import { DailyAverages } from "@/components/balance/daily-averages"
import { AnomalyAlerts } from "@/components/balance/anomaly-alerts"
import type { BalancePeriod } from "@/lib/finance-store"

function BalanceSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}

function BalanceContent() {
  const { isLoaded } = useFinance()
  const [period, setPeriod] = useState<BalancePeriod>("month")

  if (!isLoaded) return <BalanceSkeleton />

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header with period filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Balance en Vivo</h2>
          <p className="text-sm text-muted-foreground">
            Vista general de tus finanzas actualizada en tiempo real.
          </p>
        </div>
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as BalancePeriod)}
        >
          <TabsList>
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mes</TabsTrigger>
            <TabsTrigger value="all">Todo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Balance summary cards */}
      <BalanceSummary period={period} />

      {/* Chart + Averages side by side */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <BalanceChart period={period} />
        </div>
        <DailyAverages period={period} />
      </div>

      {/* Anomaly alerts */}
      <AnomalyAlerts />
    </div>
  )
}

export default function BalancePage() {
  return (
    <AppShell title="Balance">
      <BalanceContent />
    </AppShell>
  )
}
