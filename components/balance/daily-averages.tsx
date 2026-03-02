"use client"

import { useMemo } from "react"
import { Calculator } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFinance } from "@/components/providers/finance-provider"
import { formatCurrency, getBalanceForPeriod } from "@/lib/finance-store"
import type { BalancePeriod } from "@/lib/finance-store"

interface DailyAveragesProps {
  period: BalancePeriod
}

export function DailyAverages({ period }: DailyAveragesProps) {
  const { data } = useFinance()

  const balance = useMemo(
    () => getBalanceForPeriod(data.transactions, period),
    [data.transactions, period]
  )

  const averages = [
    {
      label: "Ingreso Promedio / Dia",
      value: balance.dailyAverage.income,
      colorClass: "text-success",
      bgClass: "bg-success/10",
    },
    {
      label: "Gasto Promedio / Dia",
      value: balance.dailyAverage.expenses,
      colorClass: "text-destructive",
      bgClass: "bg-destructive/10",
    },
    {
      label: "Neto Promedio / Dia",
      value: balance.dailyAverage.net,
      colorClass: balance.dailyAverage.net >= 0 ? "text-success" : "text-destructive",
      bgClass: balance.dailyAverage.net >= 0 ? "bg-success/10" : "bg-destructive/10",
    },
  ]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Calculator className="size-4 text-muted-foreground" />
          Promedios Diarios
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {averages.map((avg) => (
          <div key={avg.label} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{avg.label}</span>
            <div className={`rounded-md px-2.5 py-1 text-sm font-semibold ${avg.colorClass} ${avg.bgClass}`}>
              {formatCurrency(avg.value)}
            </div>
          </div>
        ))}

        {period === "month" && (
          <div className="mt-2 rounded-lg border border-dashed p-3">
            <p className="text-xs text-muted-foreground">
              Proyeccion mensual al ritmo actual:
            </p>
            <p className={`mt-1 text-sm font-bold ${
              balance.dailyAverage.net >= 0 ? "text-success" : "text-destructive"
            }`}>
              {formatCurrency(balance.dailyAverage.net * 30)} estimado neto/mes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
