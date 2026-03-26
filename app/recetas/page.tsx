"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { RecipeProvider, useRecipe } from "@/components/providers/recipe-provider"
import { useFinance } from "@/components/providers/finance-provider"
import { getRecipeMargin, CATEGORY_LABELS } from "@/lib/recipe-store"
import { formatCurrency } from "@/lib/finance-store"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Pencil, Trash2, PlusCircle, X } from "lucide-react"
import type { RecipeComponent, Recipe, RecipeItem, ComponentCategory } from "@/lib/types"

const CATEGORY_OPTIONS: { value: ComponentCategory, label: string }[] = [
  { value: "proteina", label: "🥩 Proteína" },
  { value: "arroz", label: "🍚 Arroz" },
  { value: "ensalada", label: "🥗 Ensalada" },
  { value: "bastimento", label: "🍌 Bastimento" },
  { value: "extra", label: "➕ Extra" },
]

// ─── Component Form ────────────────────────────────────────────────────────────

function ComponentForm({
  open,
  onOpenChange,
  component,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  component?: RecipeComponent | null
}) {
  const { addComponent, updateComponent } = useRecipe()
  const { activeBusiness } = useFinance()
  const [form, setForm] = useState({
    name: component?.name ?? "",
    category: component?.category ?? "proteina" as ComponentCategory,
    costPerPortion: component?.costPerPortion?.toString() ?? "",
    wastePercentage: component?.wastePercentage?.toString() ?? "0",
    notes: component?.notes ?? "",
  })
  const [saving, setSaving] = useState(false)

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    if (!form.name || !form.costPerPortion) return
    setSaving(true)
    const data = {
      businessId: activeBusiness?.id ?? "",
      name: form.name,
      category: form.category,
      costPerPortion: parseFloat(form.costPerPortion),
      wastePercentage: parseFloat(form.wastePercentage || "0"),
      notes: form.notes || undefined,
    }
    if (component) {
      await updateComponent({ ...data, id: component.id })
    } else {
      await addComponent(data)
    }
    setSaving(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{component ? "Editar Componente" : "Nuevo Componente"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label>Nombre</Label>
            <Input placeholder="ej. Pollo asado, Arroz chino..." value={form.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Categoría</Label>
            <Select value={form.category} onValueChange={v => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Costo por porción (L)</Label>
              <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.costPerPortion} onChange={e => set("costPerPortion", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Merma (%)</Label>
              <Input type="number" min="0" max="100" step="1" placeholder="0" value={form.wastePercentage} onChange={e => set("wastePercentage", e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notas (opcional)</Label>
            <Input placeholder="ej. Incluye hueso, merma por cocción..." value={form.notes} onChange={e => set("notes", e.target.value)} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !form.name || !form.costPerPortion}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Recipe Form ───────────────────────────────────────────────────────────────

function RecipeForm({
  open,
  onOpenChange,
  recipe,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipe?: Recipe | null
}) {
  const { addRecipe, updateRecipe, components } = useRecipe()
  const { activeBusiness } = useFinance()
  const [name, setName] = useState(recipe?.name ?? "")
  const [basePrice, setBasePrice] = useState(recipe?.basePrice?.toString() ?? "")
  const [notes, setNotes] = useState(recipe?.notes ?? "")
  const [items, setItems] = useState<{ componentId: string, quantity: string }[]>(
    recipe?.items.map(i => ({ componentId: i.componentId, quantity: i.quantity.toString() })) ?? []
  )
  const [saving, setSaving] = useState(false)

  const addItem = () => setItems(prev => [...prev, { componentId: "", quantity: "1" }])
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))
  const setItem = (idx: number, field: string, value: string) =>
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))

  const validItems = items.filter(i => i.componentId && i.quantity)

  const handleSave = async () => {
    if (!name || !basePrice) return
    setSaving(true)
    const recipeData = {
      businessId: activeBusiness?.id ?? "",
      name,
      basePrice: parseFloat(basePrice),
      notes: notes || undefined,
    }
    const itemData = validItems.map(i => ({
      componentId: i.componentId,
      quantity: parseFloat(i.quantity),
    }))

    if (recipe) {
      await updateRecipe({
        ...recipeData,
        id: recipe.id,
        items: itemData.map(i => ({ ...i, id: "", recipeId: recipe.id })),
      })
    } else {
      await addRecipe(recipeData, itemData)
    }
    setSaving(false)
    onOpenChange(false)
  }

  const previewCost = validItems.reduce((total, item) => {
    const comp = components.find(c => c.id === item.componentId)
    if (!comp || !item.quantity) return total
    const realCost = comp.costPerPortion * (1 + comp.wastePercentage / 100)
    return total + realCost * parseFloat(item.quantity)
  }, 0)

  const previewMargin = basePrice ? parseFloat(basePrice) - previewCost : 0
  const previewMarginPct = basePrice && parseFloat(basePrice) > 0 ? (previewMargin / parseFloat(basePrice)) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{recipe ? "Editar Plato" : "Nuevo Plato"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Nombre del plato</Label>
              <Input placeholder="ej. Plato base con pollo" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Precio de venta (L)</Label>
              <Input type="number" min="0" step="1" placeholder="135" value={basePrice} onChange={e => setBasePrice(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Componentes</Label>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addItem}>
                <PlusCircle className="size-3" />
                Agregar
              </Button>
            </div>
            {items.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">No hay componentes. Agrega uno arriba.</p>
            )}
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Select value={item.componentId} onValueChange={v => setItem(idx, "componentId", v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar componente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(cat => {
                      const catComponents = components.filter(c => c.category === cat.value)
                      if (catComponents.length === 0) return null
                      return (
                        <div key={cat.value}>
                          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">{cat.label}</div>
                          {catComponents.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} — {formatCurrency(c.costPerPortion)}
                            </SelectItem>
                          ))}
                        </div>
                      )
                    })}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  className="w-20"
                  placeholder="1"
                  value={item.quantity}
                  onChange={e => setItem(idx, "quantity", e.target.value)}
                />
                <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem(idx)}>
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          {validItems.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Costo estimado</span>
                <span className="text-sm font-bold text-destructive">{formatCurrency(previewCost)}</span>
              </div>
              <div className="flex flex-col gap-0.5 items-end">
                <span className="text-xs text-muted-foreground">Margen estimado</span>
                <span className={`text-sm font-bold ${previewMargin >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(previewMargin)} ({previewMarginPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Notas (opcional)</Label>
            <Input placeholder="Variaciones, observaciones..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving || !name || !basePrice}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Content ──────────────────────────────────────────────────────────────

function RecetasContent() {
  const { components, recipes, isLoaded, deleteComponent, deleteRecipe } = useRecipe()
  const [compFormOpen, setCompFormOpen] = useState(false)
  const [recipeFormOpen, setRecipeFormOpen] = useState(false)
  const [editComponent, setEditComponent] = useState<RecipeComponent | null>(null)
  const [editRecipe, setEditRecipe] = useState<Recipe | null>(null)
  const [deleteCompId, setDeleteCompId] = useState<string | null>(null)
  const [deleteRecipeId, setDeleteRecipeId] = useState<string | null>(null)

  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
      </div>
    )
  }

  const componentsByCategory = CATEGORY_OPTIONS.map(cat => ({
    ...cat,
    items: components.filter(c => c.category === cat.value),
  }))

  return (
    <div className="flex flex-col gap-6 p-6">
      <Tabs defaultValue="platos">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="platos">Platos</TabsTrigger>
            <TabsTrigger value="componentes">Componentes</TabsTrigger>
          </TabsList>
          <div>
            <TabsContent value="platos" className="mt-0">
              <Button className="gap-2" onClick={() => { setEditRecipe(null); setRecipeFormOpen(true) }}>
                <Plus className="size-4" />
                Nuevo Plato
              </Button>
            </TabsContent>
            <TabsContent value="componentes" className="mt-0">
              <Button className="gap-2" onClick={() => { setEditComponent(null); setCompFormOpen(true) }}>
                <Plus className="size-4" />
                Nuevo Componente
              </Button>
            </TabsContent>
          </div>
        </div>

        {/* Platos */}
        <TabsContent value="platos" className="mt-6">
          {recipes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No hay platos registrados. Crea uno arriba.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map(recipe => {
                const { cost, margin, marginPct } = getRecipeMargin(recipe, components)
                return (
                  <Card key={recipe.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{recipe.name}</CardTitle>
                          <CardDescription className="text-xs">Precio: {formatCurrency(recipe.basePrice)}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => { setEditRecipe(recipe); setRecipeFormOpen(true) }}>
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => setDeleteRecipeId(recipe.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        {recipe.items.map(item => {
                          const comp = components.find(c => c.id === item.componentId)
                          if (!comp) return null
                          return (
                            <div key={item.id} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">{comp.name} ×{item.quantity}</span>
                              <span>{formatCurrency(comp.costPerPortion * (1 + comp.wastePercentage / 100) * item.quantity)}</span>
                            </div>
                          )
                        })}
                      </div>
                      <div className="border-t pt-2 flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-muted-foreground">Costo</span>
                          <span className="text-sm font-semibold text-destructive">{formatCurrency(cost)}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 items-end">
                          <span className="text-xs text-muted-foreground">Margen</span>
                          <span className={`text-sm font-bold ${margin >= 0 ? "text-success" : "text-destructive"}`}>
                            {formatCurrency(margin)} ({marginPct.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Componentes */}
        <TabsContent value="componentes" className="mt-6">
          <div className="flex flex-col gap-6">
            {componentsByCategory.map(cat => (
              cat.items.length === 0 ? null : (
                <div key={cat.value}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">{cat.label}</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {cat.items.map(comp => (
                      <Card key={comp.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium">{comp.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Costo: {formatCurrency(comp.costPerPortion)}
                                {comp.wastePercentage > 0 && ` (+${comp.wastePercentage}% merma)`}
                              </span>
                              <span className="text-xs font-medium">
                                Real: {formatCurrency(comp.costPerPortion * (1 + comp.wastePercentage / 100))}
                              </span>
                              {comp.notes && <span className="text-xs text-muted-foreground italic">{comp.notes}</span>}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="size-7" onClick={() => { setEditComponent(comp); setCompFormOpen(true) }}>
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => setDeleteCompId(comp.id)}>
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            ))}
            {components.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No hay componentes registrados. Crea uno arriba.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <ComponentForm
        open={compFormOpen}
        onOpenChange={open => { setCompFormOpen(open); if (!open) setEditComponent(null) }}
        component={editComponent}
      />
      <RecipeForm
        open={recipeFormOpen}
        onOpenChange={open => { setRecipeFormOpen(open); if (!open) setEditRecipe(null) }}
        recipe={editRecipe}
      />

      {/* Delete confirmations */}
      <AlertDialog open={!!deleteCompId} onOpenChange={open => { if (!open) setDeleteCompId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar componente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los platos que usen este componente perderán esa referencia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteCompId) deleteComponent(deleteCompId); setDeleteCompId(null) }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteRecipeId} onOpenChange={open => { if (!open) setDeleteRecipeId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteRecipeId) deleteRecipe(deleteRecipeId); setDeleteRecipeId(null) }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function RecetasPage() {
  return (
    <RecipeProvider>
      <AppShell title="Recetas">
        <RecetasContent />
      </AppShell>
    </RecipeProvider>
  )
}