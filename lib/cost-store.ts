import { createClient } from "@/lib/supabase"
import type { CostLogEntry, CostLogData } from "./cost-types"

const supabase = createClient()

export async function loadCostLog(): Promise<CostLogData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { entries: [] }

  const { data, error } = await supabase
    .from("cost_log")
    .select("*")
    .order("date", { ascending: false })

  if (error || !data) return { entries: [] }

  return {
    entries: data.map(row => ({
      id: row.id,
      date: row.date,
      category: row.category,
      item: row.item,
      meat_type: row.meat_type ?? undefined,
      quantity_used: row.quantity_used,
      quantity_wasted: row.quantity_wasted,
      unit: row.unit,
      unit_cost: row.unit_cost,
      total_cost: row.total_cost,
      waste_cost: row.waste_cost,
      notes: row.notes ?? undefined,
      logged_by: row.logged_by,
    })),
  }
}

export async function addCostEntry(
  data: CostLogData,
  entry: Omit<CostLogEntry, "id" | "total_cost" | "waste_cost">
): Promise<CostLogData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return data

  const total_cost = (entry.quantity_used + entry.quantity_wasted) * entry.unit_cost
  const waste_cost = entry.quantity_wasted * entry.unit_cost

  const { data: inserted, error } = await supabase
    .from("cost_log")
    .insert({
      user_id: user.id,
      date: entry.date,
      category: entry.category,
      item: entry.item,
      meat_type: entry.meat_type ?? null,
      quantity_used: entry.quantity_used,
      quantity_wasted: entry.quantity_wasted,
      unit: entry.unit,
      unit_cost: entry.unit_cost,
      total_cost,
      waste_cost,
      notes: entry.notes ?? null,
      logged_by: entry.logged_by,
    })
    .select()
    .single()

  if (error || !inserted) return data

  const newEntry: CostLogEntry = { ...entry, id: inserted.id, total_cost, waste_cost }
  return { entries: [newEntry, ...data.entries] }
}

export async function deleteCostEntry(data: CostLogData, id: string): Promise<CostLogData> {
  await supabase.from("cost_log").delete().eq("id", id)
  return { entries: data.entries.filter(e => e.id !== id) }
}

export function getCostSummaryForDate(entries: CostLogEntry[], date: string) {
  const filtered = entries.filter(e => e.date === date)
  return {
    total_cost: filtered.reduce((s, e) => s + e.total_cost, 0),
    waste_cost: filtered.reduce((s, e) => s + e.waste_cost, 0),
    by_category: {
      carne: filtered.filter(e => e.category === "carne").reduce((s, e) => s + e.total_cost, 0),
      vegetales: filtered.filter(e => e.category === "vegetales").reduce((s, e) => s + e.total_cost, 0),
      arroz_granos: filtered.filter(e => e.category === "arroz_granos").reduce((s, e) => s + e.total_cost, 0),
    },
  }
}

export function getCostSummaryForMonth(entries: CostLogEntry[], month: string) {
  const filtered = entries.filter(e => e.date.startsWith(month))
  return {
    total_cost: filtered.reduce((s, e) => s + e.total_cost, 0),
    waste_cost: filtered.reduce((s, e) => s + e.waste_cost, 0),
    waste_percentage: (() => {
      const total = filtered.reduce((s, e) => s + e.total_cost, 0)
      const waste = filtered.reduce((s, e) => s + e.waste_cost, 0)
      return total > 0 ? (waste / total) * 100 : 0
    })(),
    by_category: {
      carne: filtered.filter(e => e.category === "carne").reduce((s, e) => s + e.total_cost, 0),
      vegetales: filtered.filter(e => e.category === "vegetales").reduce((s, e) => s + e.total_cost, 0),
      arroz_granos: filtered.filter(e => e.category === "arroz_granos").reduce((s, e) => s + e.total_cost, 0),
    },
  }
}

export async function updateCostEntry(
  data: CostLogData,
  entry: CostLogEntry
): Promise<CostLogData> {
  const total_cost = (entry.quantity_used + entry.quantity_wasted) * entry.unit_cost
  const waste_cost = entry.quantity_wasted * entry.unit_cost

  await supabase
    .from("cost_log")
    .update({
      date: entry.date,
      category: entry.category,
      item: entry.item,
      meat_type: entry.meat_type ?? null,
      quantity_used: entry.quantity_used,
      quantity_wasted: entry.quantity_wasted,
      unit: entry.unit,
      unit_cost: entry.unit_cost,
      total_cost,
      waste_cost,
      notes: entry.notes ?? null,
      logged_by: entry.logged_by,
    })
    .eq("id", entry.id)

  const updated: CostLogEntry = { ...entry, total_cost, waste_cost }
  return { entries: data.entries.map(e => e.id === entry.id ? updated : e) }
}