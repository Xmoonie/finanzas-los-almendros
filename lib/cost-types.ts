export type IngredientCategory = "carne" | "vegetales" | "arroz_granos"

export type MeatType = "pollo" | "res" | "cerdo" | "otro"

export type Unit = "lb" | "kg" | "unidad" | "porcion"

export interface CostLogEntry {
  id: string
  date: string
  category: IngredientCategory
  item: string
  meat_type?: MeatType
  quantity_used: number
  quantity_wasted: number
  unit: Unit
  unit_cost: number
  total_cost: number
  waste_cost: number
  notes?: string
  logged_by: string
}

export interface CostLogData {
  entries: CostLogEntry[]
}