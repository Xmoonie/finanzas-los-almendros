"use client"

import { useMemo } from "react"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useFinance } from "@/components/providers/finance-provider"
import { formatCurrency, getCategoryColor } from "@/lib/finance-store"
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { useMonthFilter } from "@/components/dashboard/month-filter"

export function RecentTransactions() {
  const { data } = useFinance()
  const { selectedMonth } = useMonthFilter()

  const { transactions, monthLabel } = useMemo(() => {
    const selectedDate = parseISO(`${selectedMonth}-01`)
    const monthStart = format(startOfMonth(selectedDate), "yyyy-MM-dd")
    const monthEnd = format(endOfMonth(selectedDate), "yyyy-MM-dd")
    const label = format(selectedDate, "MMMM yyyy", { locale: es })
    const labelCap = label.charAt(0).toUpperCase() + label.slice(1)

    const filtered = data.transactions
      .filter(t => t.date >= monthStart && t.date <= monthEnd)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8)

    return { transactions: filtered, monthLabel: labelCap }
  }, [data.transactions, selectedMonth])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transacciones del Mes</CardTitle>
        <CardDescription>Últimas transacciones de {monthLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin transacciones en este mes
            </p>
          ) : (
            transactions.map((tx) => {
              const color = getCategoryColor(data.categories, tx.category)
              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                      tx.type === "income" ? "bg-success/10" : "bg-destructive/10"
                    }`}>
                      {tx.type === "income" ? (
                        <ArrowUpRight className="size-4 text-success" />
                      ) : (
                        <ArrowDownRight className="size-4 text-destructive" />
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">{tx.description}</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="border-transparent px-1.5 py-0 text-[10px]"
                          style={{ backgroundColor: `${color}15`, color }}
                        >
                          {tx.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(tx.date), "d MMM yyyy", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${
                    tx.type === "income" ? "text-success" : "text-destructive"
                  }`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
