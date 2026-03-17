import * as XLSX from "xlsx"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { CostLogEntry } from "./cost-types"

const CATEGORY_LABELS: Record<string, string> = {
  carne: "Carne",
  vegetales: "Vegetales",
  arroz_granos: "Arroz / Granos",
}

export function exportCostLogToExcel(entries: CostLogEntry[]) {
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: Raw Log ──────────────────────────────────────────────
  const rawRows: (string | number)[][] = [
    ["Fecha", "Categoría", "Ingrediente", "Usado", "Desperdicio", "Unidad", "Costo/U (L)", "Total (L)", "Desperdicio (L)", "Registrado por", "Notas"],
    ...entries.map(e => [
      e.date,
      CATEGORY_LABELS[e.category] ?? e.category,
      e.item,
      e.quantity_used,
      e.quantity_wasted,
      e.unit,
      e.unit_cost,
      e.total_cost,
      e.waste_cost,
      e.logged_by,
      e.notes ?? "",
    ])
  ]
  const wsRaw = XLSX.utils.aoa_to_sheet(rawRows)
  wsRaw["!cols"] = [
    { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 8 }, { wch: 12 },
    { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 24 }
  ]
  XLSX.utils.book_append_sheet(wb, wsRaw, "Registro Diario")

  // ── Sheet 2: Monthly Summary by Category ─────────────────────────
  const months = [...new Set(entries.map(e => e.date.substring(0, 7)))].sort()
  const summaryRows: (string | number)[][] = [
    ["Mes", "Carne (L)", "Vegetales (L)", "Arroz/Granos (L)", "Total (L)"]
  ]
  for (const month of months) {
    const m = entries.filter(e => e.date.startsWith(month))
    const carne = m.filter(e => e.category === "carne").reduce((s, e) => s + e.total_cost, 0)
    const veg = m.filter(e => e.category === "vegetales").reduce((s, e) => s + e.total_cost, 0)
    const grains = m.filter(e => e.category === "arroz_granos").reduce((s, e) => s + e.total_cost, 0)
    const label = format(new Date(month + "-02"), "MMMM yyyy", { locale: es })
    const summaryRow: (string | number)[] = [label, carne, veg, grains, carne + veg + grains]
    summaryRows.push(summaryRow)
  }
  const summaryTotalRow: (string | number)[] = [
    "TOTAL",
    entries.filter(e => e.category === "carne").reduce((s, e) => s + e.total_cost, 0),
    entries.filter(e => e.category === "vegetales").reduce((s, e) => s + e.total_cost, 0),
    entries.filter(e => e.category === "arroz_granos").reduce((s, e) => s + e.total_cost, 0),
    entries.reduce((s, e) => s + e.total_cost, 0),
  ]
  summaryRows.push(summaryTotalRow)
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows)
  wsSummary["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen Mensual")

  // ── Sheet 3: Waste Report ─────────────────────────────────────────
  const wasteRows: (string | number)[][] = [
    ["Mes", "Costo Total (L)", "Desperdicio (L)", "% Desperdicio"]
  ]
  for (const month of months) {
    const m = entries.filter(e => e.date.startsWith(month))
    const total = m.reduce((s, e) => s + e.total_cost, 0)
    const waste = m.reduce((s, e) => s + e.waste_cost, 0)
    const pct = total > 0 ? (waste / total) * 100 : 0
    const label = format(new Date(month + "-02"), "MMMM yyyy", { locale: es })
    const wasteRow: (string | number)[] = [label, total, waste, pct]
    wasteRows.push(wasteRow)
  }
  const totalAll = entries.reduce((s, e) => s + e.total_cost, 0)
  const wasteAll = entries.reduce((s, e) => s + e.waste_cost, 0)
  const wasteTotalRow: (string | number)[] = [
    "TOTAL",
    totalAll,
    wasteAll,
    totalAll > 0 ? (wasteAll / totalAll) * 100 : 0
  ]
  wasteRows.push(wasteTotalRow)
  const wsWaste = XLSX.utils.aoa_to_sheet(wasteRows)
  wsWaste["!cols"] = [{ wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 14 }]
  XLSX.utils.book_append_sheet(wb, wsWaste, "Reporte Desperdicio")

  // ── Download ──────────────────────────────────────────────────────
  const fileName = `costos-los-almendros-${format(new Date(), "yyyy-MM-dd")}.xlsx`
  XLSX.writeFile(wb, fileName)
}