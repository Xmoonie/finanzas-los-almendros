"use client"

import { createContext, useContext, useState, useMemo } from "react"
import { format, subMonths, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, ChevronDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// ── Context ────────────────────────────────────────────────────────────────────

interface MonthFilterContextValue {
  /** "yyyy-MM" string, e.g. "2025-03" */
  selectedMonth: string
  isCurrentMonth: boolean
}

const MonthFilterContext = createContext<MonthFilterContextValue>({
  selectedMonth: format(new Date(), "yyyy-MM"),
  isCurrentMonth: true,
})

export function useMonthFilter() {
  return useContext(MonthFilterContext)
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface MonthFilterProviderProps {
  children: React.ReactNode
  selectedMonth: string
}

export function MonthFilterProvider({ children, selectedMonth }: MonthFilterProviderProps) {
  const isCurrentMonth = selectedMonth === format(new Date(), "yyyy-MM")
  return (
    <MonthFilterContext.Provider value={{ selectedMonth, isCurrentMonth }}>
      {children}
    </MonthFilterContext.Provider>
  )
}

// ── Picker UI ─────────────────────────────────────────────────────────────────

interface MonthPickerProps {
  value: string
  onChange: (month: string) => void
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const now = new Date()
  const currentMonth = format(now, "yyyy-MM")

  // Build last 12 months (newest first)
  const options = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(startOfMonth(now), i)
      const key = format(date, "yyyy-MM")
      const label = format(date, "MMMM yyyy", { locale: es })
      const labelCapitalized = label.charAt(0).toUpperCase() + label.slice(1)
      return { key, label: labelCapitalized, isCurrent: key === currentMonth }
    })
  }, [])

  const selectedLabel = options.find(o => o.key === value)?.label ?? value
  const isCurrentMonth = value === currentMonth

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 h-9 pr-3 pl-3 font-medium min-w-[190px] justify-between"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-muted-foreground shrink-0" />
            <span className="text-sm">{selectedLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isCurrentMonth && (
              <Badge
                variant="secondary"
                className="px-1.5 py-0 text-[10px] h-4 bg-primary/10 text-primary border-0"
              >
                Actual
              </Badge>
            )}
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {options.map(opt => (
          <DropdownMenuItem
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{opt.label}</span>
            <div className="flex items-center gap-1.5">
              {opt.isCurrent && (
                <Badge
                  variant="secondary"
                  className="px-1.5 py-0 text-[10px] h-4 bg-primary/10 text-primary border-0"
                >
                  Actual
                </Badge>
              )}
              {opt.key === value && <Check className="size-3.5 text-primary" />}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
