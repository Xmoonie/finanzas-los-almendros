"use client"

import { useState, useMemo } from "react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useFinance } from "@/components/providers/finance-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfitLoss } from "@/components/reports/profit-loss"
import { CashFlowChart } from "@/components/reports/cash-flow-chart"
import { CategoryBreakdown } from "@/components/reports/category-breakdown"
import { MonthlyComparison } from "@/components/reports/monthly-comparison"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"

export default function ReportsPage() {
  const { data, isLoaded } = useFinance()
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfMonth(new Date()),
  })

  const filteredTransactions = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return data.transactions

    const fromStr = format(dateRange.from, "yyyy-MM-dd")
    const toStr = format(dateRange.to, "yyyy-MM-dd")

    return data.transactions.filter(t => t.date >= fromStr && t.date <= toStr)
  }, [data.transactions, dateRange])

  const effectiveRange = {
    from: dateRange.from || startOfMonth(subMonths(new Date(), 5)),
    to: dateRange.to || endOfMonth(new Date()),
  }

  return (
    <AppShell title="Reportes">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Reportes</h2>
            <p className="text-sm text-muted-foreground">
              Analiza el desempeno financiero de tu negocio.
            </p>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[280px] justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 size-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd/MM/yyyy")
                  )
                ) : (
                  "Seleccionar rango"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                defaultMonth={dateRange.from}
                selected={dateRange}
                onSelect={(range) => {
                  if (range) setDateRange(range)
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {!isLoaded ? (
          <div className="flex flex-col gap-6">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <ProfitLoss transactions={filteredTransactions} />
              <CashFlowChart transactions={filteredTransactions} dateRange={effectiveRange} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <CategoryBreakdown
                transactions={filteredTransactions}
                categories={data.categories}
                type="income"
              />
              <CategoryBreakdown
                transactions={filteredTransactions}
                categories={data.categories}
                type="expense"
              />
            </div>
            <MonthlyComparison transactions={filteredTransactions} dateRange={effectiveRange} />
          </div>
        )}
      </div>
    </AppShell>
  )
}
