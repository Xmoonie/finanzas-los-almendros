import { createClient } from "@/lib/supabase"
import type { RecipeComponent, Recipe, RecipeItem, ComponentCategory } from "./types"

const supabase = createClient()

// ─── Components ───────────────────────────────────────────────────────────────

export async function loadRecipeComponents(businessId: string): Promise<RecipeComponent[]> {
  const { data } = await supabase
    .from("recipe_components")
    .select("*")
    .eq("business_id", businessId)
    .order("category")

  return (data || []).map(c => ({
    id: c.id,
    businessId: c.business_id,
    name: c.name,
    category: c.category as ComponentCategory,
    costPerPortion: c.cost_per_portion,
    wastePercentage: c.waste_percentage,
    notes: c.notes ?? undefined,
  }))
}

export async function addRecipeComponent(
  components: RecipeComponent[],
  component: Omit<RecipeComponent, "id">
): Promise<RecipeComponent[]> {
  const { data } = await supabase
    .from("recipe_components")
    .insert({
      business_id: component.businessId,
      name: component.name,
      category: component.category,
      cost_per_portion: component.costPerPortion,
      waste_percentage: component.wastePercentage,
      notes: component.notes ?? null,
    })
    .select()
    .single()

  if (!data) return components
  return [...components, { ...component, id: data.id }]
}

export async function updateRecipeComponent(
  components: RecipeComponent[],
  component: RecipeComponent
): Promise<RecipeComponent[]> {
  await supabase
    .from("recipe_components")
    .update({
      name: component.name,
      category: component.category,
      cost_per_portion: component.costPerPortion,
      waste_percentage: component.wastePercentage,
      notes: component.notes ?? null,
    })
    .eq("id", component.id)

  return components.map(c => c.id === component.id ? component : c)
}

export async function deleteRecipeComponent(
  components: RecipeComponent[],
  id: string
): Promise<RecipeComponent[]> {
  await supabase.from("recipe_components").delete().eq("id", id)
  return components.filter(c => c.id !== id)
}

// ─── Recipes ──────────────────────────────────────────────────────────────────

export async function loadRecipes(businessId: string): Promise<Recipe[]> {
  const { data: recipes } = await supabase
    .from("recipes")
    .select("*, recipe_items(*)")
    .eq("business_id", businessId)
    .order("created_at")

  return (recipes || []).map(r => ({
    id: r.id,
    businessId: r.business_id,
    name: r.name,
    basePrice: r.base_price,
    notes: r.notes ?? undefined,
    items: (r.recipe_items || []).map((item: any) => ({
      id: item.id,
      recipeId: item.recipe_id,
      componentId: item.component_id,
      quantity: item.quantity,
    })),
  }))
}

export async function addRecipe(
  recipes: Recipe[],
  recipe: Omit<Recipe, "id" | "items">,
  items: Omit<RecipeItem, "id" | "recipeId">[]
): Promise<Recipe[]> {
  const { data } = await supabase
    .from("recipes")
    .insert({
      business_id: recipe.businessId,
      name: recipe.name,
      base_price: recipe.basePrice,
      notes: recipe.notes ?? null,
    })
    .select()
    .single()

  if (!data) return recipes

  const insertedItems: RecipeItem[] = []
  if (items.length > 0) {
    const { data: itemData } = await supabase
      .from("recipe_items")
      .insert(items.map(item => ({
        recipe_id: data.id,
        component_id: item.componentId,
        quantity: item.quantity,
      })))
      .select()

    if (itemData) {
      insertedItems.push(...itemData.map((i: any) => ({
        id: i.id,
        recipeId: i.recipe_id,
        componentId: i.component_id,
        quantity: i.quantity,
      })))
    }
  }

  return [...recipes, { ...recipe, id: data.id, items: insertedItems }]
}

export async function updateRecipe(
  recipes: Recipe[],
  recipe: Recipe
): Promise<Recipe[]> {
  await supabase
    .from("recipes")
    .update({
      name: recipe.name,
      base_price: recipe.basePrice,
      notes: recipe.notes ?? null,
    })
    .eq("id", recipe.id)

  // Borrar items existentes y reinsertar
  await supabase.from("recipe_items").delete().eq("recipe_id", recipe.id)

  if (recipe.items.length > 0) {
    await supabase.from("recipe_items").insert(
      recipe.items.map(item => ({
        recipe_id: recipe.id,
        component_id: item.componentId,
        quantity: item.quantity,
      }))
    )
  }

  return recipes.map(r => r.id === recipe.id ? recipe : r)
}

export async function deleteRecipe(
  recipes: Recipe[],
  id: string
): Promise<Recipe[]> {
  await supabase.from("recipes").delete().eq("id", id)
  return recipes.filter(r => r.id !== id)
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function getRecipeCost(recipe: Recipe, components: RecipeComponent[]): number {
  return recipe.items.reduce((total, item) => {
    const component = components.find(c => c.id === item.componentId)
    if (!component) return total
    const realCost = component.costPerPortion * (1 + component.wastePercentage / 100)
    return total + realCost * item.quantity
  }, 0)
}

export function getRecipeMargin(recipe: Recipe, components: RecipeComponent[]): {
  cost: number
  price: number
  margin: number
  marginPct: number
} {
  const cost = getRecipeCost(recipe, components)
  const margin = recipe.basePrice - cost
  const marginPct = recipe.basePrice > 0 ? (margin / recipe.basePrice) * 100 : 0
  return { cost, price: recipe.basePrice, margin, marginPct }
}

export const CATEGORY_LABELS: Record<string, string> = {
  proteina: "🥩 Proteína",
  arroz: "🍚 Arroz",
  ensalada: "🥗 Ensalada",
  bastimento: "🍌 Bastimento",
  extra: "➕ Extra",
}