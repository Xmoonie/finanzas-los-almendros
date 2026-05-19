"use client"

import { useMemo, } from "react"
import { format } from "date-fns"
import { FileDown, TableIcon } from "lucide-react"
import jsPDF from "jspdf"
import * as XLSX from "xlsx"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFinance } from "@/components/providers/finance-provider"
import { useCost } from "@/components/providers/cost-provider"
import { formatCurrency } from "@/lib/finance-store"
import type { Transaction } from "@/lib/types"

interface ProfitLossProps {
  transactions: Transaction[]
  dateRange: { from: Date; to: Date }
}

export function ProfitLoss({ transactions, dateRange,  }: ProfitLossProps) {
  const { data } = useFinance()
  const { data: costData } = useCost()

  const results = useMemo(() => {
    const income = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)

    const expenseTransactions = transactions.filter(t => t.type === "expense")

    const fromStr = format(dateRange.from, "yyyy-MM-dd")
    const toStr = format(dateRange.to, "yyyy-MM-dd")

    const cogsFromCostLog = costData.entries
      .filter(e => e.date >= fromStr && e.date <= toStr)
      .reduce((sum, e) => sum + e.total_cost, 0)

    const cogsFromTransactions = expenseTransactions
      .filter(t => {
        const cat = data.categories.find(c => c.name === t.category)
        return cat?.expenseType === "cogs"
      })
      .reduce((sum, t) => sum + t.amount, 0)

    const cogs = cogsFromTransactions + cogsFromCostLog

    const opexTransactions = expenseTransactions.filter(t => {
      const cat = data.categories.find(c => c.name === t.category)
      return !cat || cat.expenseType !== "cogs"
    })

    const opex = opexTransactions.reduce((sum, t) => sum + t.amount, 0)

    const grossProfit = income - cogs
    const grossMargin = income > 0 ? (grossProfit / income) * 100 : 0
    const operatingProfit = grossProfit - opex
    const operatingMargin = income > 0 ? (operatingProfit / income) * 100 : 0

    // Desglose COGS por subcategoría
    const cogsBySubcat: Record<string, number> = {}
    expenseTransactions
      .filter(t => {
        const cat = data.categories.find(c => c.name === t.category)
        return cat?.expenseType === "cogs"
      })
      .forEach(t => {
        const key = t.subcategoryName ?? t.category
        cogsBySubcat[key] = (cogsBySubcat[key] || 0) + t.amount
      })
    if (cogsFromCostLog > 0) {
      cogsBySubcat["Ingredientes (Control de Costos)"] =
        (cogsBySubcat["Ingredientes (Control de Costos)"] || 0) + cogsFromCostLog
    }

    // Desglose OPEX por subcategoría
    const opexBySubcat: Record<string, number> = {}
    opexTransactions.forEach(t => {
      const key = t.subcategoryName ?? t.category
      opexBySubcat[key] = (opexBySubcat[key] || 0) + t.amount
    })

    // Desglose OPEX por categoría (vista simple)
    // Desglose COGS por categoría (vista simple)
    const cogsByCategory: Record<string, number> = {}
    expenseTransactions
      .filter(t => {
        const cat = data.categories.find(c => c.name === t.category)
        return cat?.expenseType === "cogs"
      })
      .forEach(t => {
        cogsByCategory[t.category] = (cogsByCategory[t.category] || 0) + t.amount
      })
    if (cogsFromCostLog > 0) {
      cogsByCategory["Ingredientes (Control de Costos)"] =
        (cogsByCategory["Ingredientes (Control de Costos)"] || 0) + cogsFromCostLog
    }

    // Desglose OPEX por categoría (vista simple)
    const opexByCategory: Record<string, number> = {}
    
    opexTransactions.forEach(t => {
      opexByCategory[t.category] = (opexByCategory[t.category] || 0) + t.amount
    })

    return {
      income,
      cogsFromTransactions,
      cogsFromCostLog,
      cogs,
      cogsByCategory,
      opex,
      grossProfit,
      grossMargin,
      operatingProfit,
      operatingMargin,
      cogsBySubcat,
      opexBySubcat,
      opexByCategory,
    }
  }, [transactions, data.categories, costData.entries, dateRange])
  // ─── Export PDF ───────────────────────────────────────────────────────────
  function exportPDF() {
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const fromLabel = format(dateRange.from, "dd/MM/yyyy")
    const toLabel = format(dateRange.to, "dd/MM/yyyy")
    
    let y = 20
    const left = 20
    const right = 190

    const line = (label: string, value: string, bold = false, indent = false) => {
      if (bold) pdf.setFont("helvetica", "bold")
      else pdf.setFont("helvetica", "normal")
      pdf.setFontSize(bold ? 11 : 10)
      pdf.text(indent ? `  ${label}` : label, indent ? left + 5 : left, y)
      pdf.text(value, right, y, { align: "right" })
      y += 7
    }

    const separator = () => { y += 3 }

    // Header
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(14)
    pdf.text("Estado de Resultados", left, y)
    y += 7
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    pdf.text(`${fromLabel} — ${toLabel}`, left, y)
    y += 10

    // Ingresos
    line("VENTAS", formatCurrency(results.income), true)
    separator()

    // COGS
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9)
    pdf.text("COSTO DE VENTAS (COGS)", left, y)
    y += 6
    Object.entries(results.cogsBySubcat)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, val]) => line(key, formatCurrency(val), false, true))
    line("Total COGS", formatCurrency(results.cogs), true)
    separator()

    // Utilidad Bruta
    pdf.setDrawColor(200)
    pdf.line(left, y, right, y)
    y += 4
    line(`Utilidad Bruta (${results.grossMargin.toFixed(1)}%)`, formatCurrency(results.grossProfit), true)
    separator()

    // OPEX
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9)
    pdf.text("GASTOS OPERATIVOS (OPEX)", left, y)
    y += 6
    Object.entries(results.opexBySubcat)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, val]) => line(key, formatCurrency(val), false, true))
    line("Total OPEX", formatCurrency(results.opex), true)
    separator()

    // Utilidad Operativa
    pdf.line(left, y, right, y)
    y += 4
    line(`Utilidad Operativa (${results.operatingMargin.toFixed(1)}%)`, formatCurrency(results.operatingProfit), true)

    pdf.save(`Estado-Resultados-${format(dateRange.from, "dd-MM-yyyy")}-${format(dateRange.to, "dd-MM-yyyy")}.pdf`)
  }

  // ─── Export Excel ─────────────────────────────────────────────────────────
  function exportExcel() {
    const fromLabel = format(dateRange.from, "dd/MM/yyyy")
    const toLabel = format(dateRange.to, "dd/MM/yyyy")

    const rows: (string | number)[][] = [
      [`Estado de Resultados — ${fromLabel} al ${toLabel}`],
      [],
      ["Concepto", "Monto (L)"],
      ["INGRESOS", results.income],
      [],
      ["COSTO DE VENTAS (COGS)", ""],
    ]

    Object.entries(results.cogsBySubcat)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, val]) => rows.push([`  ${key}`, val]))

    rows.push(
      ["Total COGS", results.cogs],
      [],
      ["UTILIDAD BRUTA", results.grossProfit],
      [`Margen Bruto`, `${results.grossMargin.toFixed(1)}%`],
      [],
      ["GASTOS OPERATIVOS (OPEX)", ""],
    )

    Object.entries(results.opexBySubcat)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, val]) => rows.push([`  ${key}`, val]))

    rows.push(
      ["Total OPEX", results.opex],
      [],
      ["UTILIDAD OPERATIVA", results.operatingProfit],
      [`Margen Operativo`, `${results.operatingMargin.toFixed(1)}%`],
    )

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws["!cols"] = [{ wch: 45 }, { wch: 18 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Estado de Resultados")
    XLSX.writeFile(wb, `Estado-Resultados-${format(dateRange.from, "dd-MM-yyyy")}-${format(dateRange.to, "dd-MM-yyyy")}.xlsx`)
  }

  const Row = ({
    label, value, bold, color, indent, percentage,
  }: {
    label: string
    value: number
    bold?: boolean
    color?: string
    indent?: boolean
    percentage?: number
  }) => (
    <div className={`flex items-center justify-between py-1.5 ${indent ? "pl-4" : ""} ${bold ? "border-t mt-1 pt-2" : ""}`}>
      <span className={`text-sm ${bold ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
      <div className="flex items-center gap-3">
        {percentage !== undefined && (
          <span className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</span>
        )}
        <span className={`text-sm tabular-nums ${bold ? "font-bold" : ""} ${color ?? ""}`}>
          {formatCurrency(value)}
        </span>
      </div>
    </div>
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Estado de Resultados</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportExcel} className="gap-1 text-xs">
            <FileDown className="size-3" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1 text-xs">
            <FileDown className="size-3" />
            PDF
          </Button>
        </div>
      </CardHeader>

     <CardContent className="flex flex-col gap-2 bg-background">
        <div className="flex flex-col gap-2">

        {/* Header para el PDF */}
        <div className="mb-2">
          <p className="text-xs text-muted-foreground">
            {format(dateRange.from, "dd/MM/yyyy")} — {format(dateRange.to, "dd/MM/yyyy")}
          </p>
        </div>

        {/* Ingresos */}
        <Row label="Ventas" value={results.income} bold color="text-success" />

        {/* COGS */}
        <div className="mt-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Costo de Ventas (COGS)
          </span>
         {Object.entries(results.cogsBySubcat)
            .sort((a, b) => b[1] - a[1])
            .map(([key, val]) => (
              <Row key={key} label={key} value={val} indent color="text-destructive" />
            ))
          }
          <Row label="Total COGS" value={results.cogs} bold color="text-destructive" />
        </div>

        {/* Utilidad Bruta */}
        <div className={`rounded-lg bg-muted/50 px-3 py-2 flex items-center justify-between mt-1`}>
          <span className="text-sm font-semibold">Utilidad Bruta</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{results.grossMargin.toFixed(1)}%</span>
            <span className={`text-sm font-bold tabular-nums ${results.grossProfit >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(results.grossProfit)}
            </span>
          </div>
        </div>

        {/* OPEX */}
        <div className="mt-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Gastos Operativos (OPEX)
          </span>
         {Object.entries(results.opexBySubcat)
            .sort((a, b) => b[1] - a[1])
            .map(([key, val]) => (
              <Row key={key} label={key} value={val} indent />
            ))
          } 
          <Row label="Total OPEX" value={results.opex} bold color="text-destructive" />
        </div>

        {/* Utilidad Operativa */}
        <div className={`rounded-lg px-3 py-2 flex items-center justify-between mt-1 ${
          results.operatingProfit >= 0 ? "bg-success/10" : "bg-destructive/10"
        }`}>
          <span className="text-sm font-semibold">Utilidad Operativa</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{results.operatingMargin.toFixed(1)}%</span>
            <span className={`text-sm font-bold tabular-nums ${results.operatingProfit >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrency(results.operatingProfit)}
            </span>
          </div>
        </div>
</div>
      </CardContent>
    </Card>
  )
}