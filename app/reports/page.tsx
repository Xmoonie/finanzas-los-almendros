"use client"

import { useState, useMemo } from "react"
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFinance } from "@/components/providers/finance-provider"
import { CostProvider } from "@/components/providers/cost-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { ProfitLoss } from "@/components/reports/profit-loss"
import { CashFlowChart } from "@/components/reports/cash-flow-chart"
import { CategoryBreakdown } from "@/components/reports/category-breakdown"
import { MonthlyComparison } from "@/components/reports/monthly-comparison"
import { cn } from "@/lib/utils"
import type { DateRange } from "react-day-picker"
import type { Transaction } from "@/lib/types"

type FilterMode = "month" | "range"

function getAvailableMonths(transactions: Transaction[]): string[] {
  const months = new Set(transactions.map(t => t.date.substring(0, 7)))
  return Array.from(months).sort((a, b) => b.localeCompare(a))
}

function formatMonthLabel(yyyymm: string): string {
  const [year, month] = yyyymm.split("-")
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  const label = format(date, "MMMM yyyy", { locale: es })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function ReportsContent() {
  const { data, isLoaded } = useFinance()
  const currentMonth = format(new Date(), "yyyy-MM")

  const [filterMode, setFilterMode] = useState<FilterMode>("month")
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth)
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfMonth(new Date()),
  })

  const availableMonths = useMemo(() => getAvailableMonths(data.transactions), [data.transactions])

  // Rango efectivo según el modo activo
  const effectiveRange = useMemo(() => {
    if (filterMode === "month") {
      const [year, month] = selectedMonth.split("-")
      const base = new Date(parseInt(year), parseInt(month) - 1, 1)
      return { from: startOfMonth(base), to: endOfMonth(base) }
    }
    return {
      from: dateRange.from || startOfMonth(subMonths(new Date(), 5)),
      to: dateRange.to || endOfMonth(new Date()),
    }
  }, [filterMode, selectedMonth, dateRange])

  const filteredTransactions = useMemo(() => {
    const fromStr = format(effectiveRange.from, "yyyy-MM-dd")
    const toStr = format(effectiveRange.to, "yyyy-MM-dd")
    return data.transactions.filter(t => t.date >= fromStr && t.date <= toStr)
  }, [data.transactions, effectiveRange])

  return (
    <AppShell title="Reportes">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Reportes</h2>
            <p className="text-sm text-muted-foreground">
              Analiza el desempeño financiero de tu negocio.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle de modo */}
            <div className="flex items-center rounded-lg border p-1">
              <Button
                type="button"
                size="sm"
                variant={filterMode === "month" ? "default" : "ghost"}
                className="h-7 px-3 text-xs"
                onClick={() => setFilterMode("month")}
              >
                Mes
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filterMode === "range" ? "default" : "ghost"}
                className="h-7 px-3 text-xs"
                onClick={() => setFilterMode("range")}
              >
                Rango
              </Button>
            </div>

            {/* Filtro por mes */}
            {filterMode === "month" && (
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Selecciona un mes" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map(m => (
                    <SelectItem key={m} value={m}>
                      {formatMonthLabel(m)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Filtro por rango */}
            {filterMode === "range" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-[280px] justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>{format(dateRange.from, "dd/MM/yyyy")} — {format(dateRange.to, "dd/MM/yyyy")}</>
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
                    onSelect={(range) => { if (range) setDateRange(range) }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
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
              <ProfitLoss
                transactions={filteredTransactions}
                dateRange={effectiveRange}
              />
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

export default function ReportsPage() {
  return (
    <CostProvider>
      <ReportsContent />
    </CostProvider>
  )
}