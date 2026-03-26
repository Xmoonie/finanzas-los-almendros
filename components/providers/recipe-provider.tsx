"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import type { RecipeComponent, Recipe, RecipeItem } from "@/lib/types"
import {
  loadRecipeComponents,
  loadRecipes,
  addRecipeComponent as addComp,
  updateRecipeComponent as updateComp,
  deleteRecipeComponent as deleteComp,
  addRecipe as addRec,
  updateRecipe as updateRec,
  deleteRecipe as deleteRec,
} from "@/lib/recipe-store"
import { useFinance } from "@/components/providers/finance-provider"

interface RecipeContextValue {
  components: RecipeComponent[]
  recipes: Recipe[]
  isLoaded: boolean
  addComponent: (component: Omit<RecipeComponent, "id">) => Promise<void>
  updateComponent: (component: RecipeComponent) => Promise<void>
  deleteComponent: (id: string) => Promise<void>
  addRecipe: (recipe: Omit<Recipe, "id" | "items">, items: Omit<RecipeItem, "id" | "recipeId">[]) => Promise<void>
  updateRecipe: (recipe: Recipe) => Promise<void>
  deleteRecipe: (id: string) => Promise<void>
}

const RecipeContext = createContext<RecipeContextValue | null>(null)

export function useRecipe() {
  const ctx = useContext(RecipeContext)
  if (!ctx) throw new Error("useRecipe must be used within RecipeProvider")
  return ctx
}

export function RecipeProvider({ children }: { children: React.ReactNode }) {
  const { activeBusiness } = useFinance()
  const [components, setComponents] = useState<RecipeComponent[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!activeBusiness) return
    setIsLoaded(false)
    Promise.all([
      loadRecipeComponents(activeBusiness.id),
      loadRecipes(activeBusiness.id),
    ]).then(([comps, recs]) => {
      setComponents(comps)
      setRecipes(recs)
      setIsLoaded(true)
    }).catch(() => setIsLoaded(true))
  }, [activeBusiness])

  const handleAddComponent = async (component: Omit<RecipeComponent, "id">) => {
    const updated = await addComp(components, component)
    setComponents(updated)
  }

  const handleUpdateComponent = async (component: RecipeComponent) => {
    const updated = await updateComp(components, component)
    setComponents(updated)
  }

  const handleDeleteComponent = async (id: string) => {
    const updated = await deleteComp(components, id)
    setComponents(updated)
  }

  const handleAddRecipe = async (recipe: Omit<Recipe, "id" | "items">, items: Omit<RecipeItem, "id" | "recipeId">[]) => {
    const updated = await addRec(recipes, recipe, items)
    setRecipes(updated)
  }

  const handleUpdateRecipe = async (recipe: Recipe) => {
    const updated = await updateRec(recipes, recipe)
    setRecipes(updated)
  }

  const handleDeleteRecipe = async (id: string) => {
    const updated = await deleteRec(recipes, id)
    setRecipes(updated)
  }

  return (
    <RecipeContext.Provider value={{
      components,
      recipes,
      isLoaded,
      addComponent: handleAddComponent,
      updateComponent: handleUpdateComponent,
      deleteComponent: handleDeleteComponent,
      addRecipe: handleAddRecipe,
      updateRecipe: handleUpdateRecipe,
      deleteRecipe: handleDeleteRecipe,
    }}>
      {children}
    </RecipeContext.Provider>
  )
}