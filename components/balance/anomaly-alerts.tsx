"use client"

import { useMemo } from "react"
import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useFinance } from "@/components/providers/finance-provider"
import { detectAnomalies, formatCurrency } from "@/lib/finance-store"

export function AnomalyAlerts() {
  const { data } = useFinance()

  const anomalies = useMemo(
    () => detectAnomalies(data.transactions),
    [data.transactions]
  )

  if (anomalies.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="size-4 text-muted-foreground" />
            Alertas de Anomalias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-success/10">
              <TrendingUp className="size-5 text-success" />
            </div>
            <p className="text-sm font-medium text-foreground">Todo en orden</p>
            <p className="text-xs text-muted-foreground">
              No se detectaron cambios significativos este mes.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="size-4 text-warning" />
          Alertas de Anomalias
          <Badge variant="secondary" className="ml-auto text-xs">
            {anomalies.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {anomalies.map((anomaly, idx) => {
          const isSpike = anomaly.type === "spike"
          const isExpenseSpike = anomaly.transactionType === "expense" && isSpike
          const isIncomeSpike = anomaly.transactionType === "income" && isSpike
          const isIncomeDrop = anomaly.transactionType === "income" && !isSpike

          // Expense spike or income drop = bad, income spike or expense drop = good
          const isBad = isExpenseSpike || isIncomeDrop

          return (
            <div
              key={idx}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                isBad ? "border-destructive/20 bg-destructive/5" : "border-success/20 bg-success/5"
              }`}
            >
              <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md ${
                isBad ? "bg-destructive/10" : "bg-success/10"
              }`}>
                {isSpike ? (
                  <TrendingUp className={`size-3.5 ${isBad ? "text-destructive" : "text-success"}`} />
                ) : (
                  <TrendingDown className={`size-3.5 ${isBad ? "text-destructive" : "text-success"}`} />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {anomaly.category}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      isBad ? "border-destructive/30 text-destructive" : "border-success/30 text-success"
                    }`}
                  >
                    {anomaly.percentChange > 0 ? "+" : ""}{anomaly.percentChange.toFixed(0)}%
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {anomaly.transactionType === "income" ? "Ingreso" : "Gasto"} este mes:{" "}
                  <span className="font-medium text-foreground">{formatCurrency(anomaly.currentAmount)}</span>
                  {" "}vs promedio:{" "}
                  <span className="font-medium text-foreground">{formatCurrency(anomaly.averageAmount)}</span>
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
