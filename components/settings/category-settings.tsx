"use client"

import { useState } from "react"
import { Plus, Trash2, Tag, ChevronDown, ChevronRight } from "lucide-react"
import { useFinance } from "@/components/providers/finance-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import type { TransactionType } from "@/lib/types"

const PRESET_COLORS = [
  "#0d9488", "#0ea5e9", "#8b5cf6", "#64748b",
  "#ef4444", "#f97316", "#eab308", "#84cc16",
  "#06b6d4", "#a855f7", "#ec4899", "#6b7280",
  "#10b981", "#f43f5e", "#3b82f6", "#d97706",
]

// ─── Add Category Form ────────────────────────────────────────────────────────

interface AddCategoryFormProps {
  type: TransactionType
  onAdd: (name: string, color: string, expenseType: "cogs" | "opex") => void
}

function AddCategoryForm({ type, onAdd }: AddCategoryFormProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(type === "income" ? "#0d9488" : "#ef4444")
  const [expenseType, setExpenseType] = useState<"cogs" | "opex">("opex")
  const [error, setError] = useState("")

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) { setError("El nombre no puede estar vacío"); return }
    onAdd(trimmed, color, expenseType)
    setName("")
    setColor(type === "income" ? "#0d9488" : "#ef4444")
    setExpenseType("opex")
    setError("")
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-dashed p-4 bg-muted/30">
      <p className="text-sm font-medium text-muted-foreground">Nueva categoría</p>
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[160px]">
          <Label className="text-xs mb-1 block">Nombre</Label>
          <Input
            placeholder={type === "income" ? "ej. Freelance" : "ej. Alimentación"}
            value={name}
            onChange={e => { setName(e.target.value); setError("") }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            className="h-9"
          />
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>
        {type === "expense" && (
          <div className="min-w-[140px]">
            <Label className="text-xs mb-1 block">Tipo</Label>
            <Select value={expenseType} onValueChange={v => setExpenseType(v as "cogs" | "opex")}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cogs">COGS</SelectItem>
                <SelectItem value="opex">Operativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label className="text-xs mb-1 block">Color</Label>
          <div className="flex gap-1 flex-wrap w-40">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                className="size-6 rounded-full border-2 transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: color === c ? "white" : "transparent",
                  outline: color === c ? `2px solid ${c}` : "none",
                }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>
        <Button size="sm" onClick={handleSubmit} className="h-9 gap-1 shrink-0">
          <Plus className="size-4" />
          Agregar
        </Button>
      </div>
    </div>
  )
}

// ─── Add Subcategory Form ─────────────────────────────────────────────────────

interface AddSubcategoryFormProps {
  categoryName: string
  expenseType: "cogs" | "opex"
  onAdd: (name: string) => void
}

function AddSubcategoryForm({ categoryName, expenseType, onAdd }: AddSubcategoryFormProps) {
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = () => {
    const trimmed = name.trim()
    if (!trimmed) { setError("El nombre no puede estar vacío"); return }
    onAdd(trimmed)
    setName("")
    setError("")
  }

  return (
    <div className="flex gap-2 items-end mt-2">
      <div className="flex-1">
        <Input
          placeholder={`Nueva subcategoría de ${categoryName}`}
          value={name}
          onChange={e => { setName(e.target.value); setError("") }}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          className="h-8 text-xs"
        />
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
      <Button size="sm" onClick={handleSubmit} className="h-8 gap-1 text-xs shrink-0">
        <Plus className="size-3" />
        Agregar
      </Button>
    </div>
  )
}

// ─── Category Row (with subcategories) ───────────────────────────────────────

interface CategoryRowProps {
  catId: string
  catName: string
  catColor: string
  expenseType?: "cogs" | "opex"
  type: TransactionType
}

function CategoryRow({ catId, catName, catColor, expenseType, type }: CategoryRowProps) {
  const { data, deleteCategory, addSubcategory, deleteSubcategory, activeBusiness } = useFinance()
  const [expanded, setExpanded] = useState(false)

  const subcategories = data.subcategories.filter(s => s.categoryName === catName)

  const handleAddSubcategory = (name: string) => {
    if (!expenseType) return
    addSubcategory({
      businessId: activeBusiness?.id ?? "",
      categoryName: catName,
      expenseType,
      name,
    })
  }

  return (
    <div className="flex flex-col rounded-lg border bg-background">
      {/* Fila principal de categoría */}
      <div className="flex items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2 flex-1">
          {type === "expense" && (
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded
                ? <ChevronDown className="size-3.5" />
                : <ChevronRight className="size-3.5" />
              }
            </button>
          )}
          <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
          <span className="text-sm font-medium">{catName}</span>
          {type === "expense" && expenseType && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4"
              style={{
                borderColor: expenseType === "cogs" ? "#f97316" : "#6b7280",
                color: expenseType === "cogs" ? "#f97316" : "#6b7280",
              }}
            >
              {expenseType === "cogs" ? "COGS" : "OPEX"}
            </Badge>
          )}
          {type === "expense" && subcategories.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {subcategories.length} subcategoría{subcategories.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará <strong>{catName}</strong> y todas sus subcategorías. Las transacciones existentes no serán afectadas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteCategory(catId)}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Panel de subcategorías (solo gastos) */}
      {type === "expense" && expanded && (
        <div className="border-t px-3 py-3 flex flex-col gap-1 bg-muted/20">
          {subcategories.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin subcategorías aún.</p>
          ) : (
            subcategories.map(sub => (
              <div
                key={sub.id}
                className="flex items-center justify-between rounded px-2 py-1 hover:bg-muted/40"
              >
                <span className="text-xs text-muted-foreground pl-2">— {sub.name}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar subcategoría?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminará <strong>{sub.name}</strong>. Las transacciones existentes no serán afectadas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteSubcategory(sub.id)}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
          {expenseType && (
            <AddSubcategoryForm
              categoryName={catName}
              expenseType={expenseType}
              onAdd={handleAddSubcategory}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ─── Category Section ─────────────────────────────────────────────────────────

interface CategorySectionProps {
  type: TransactionType
  title: string
  description: string
}

function CategorySection({ type, title, description }: CategorySectionProps) {
  const { data, addCategory, activeBusiness } = useFinance()
  const categories = data.categories.filter(c => c.type === type)

  const handleAdd = (name: string, color: string, expenseType: "cogs" | "opex") => {
    addCategory({ name, color, type, businessId: activeBusiness?.id ?? "", expenseType })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div
            className="size-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: type === "income" ? "#0d948815" : "#ef444415" }}
          >
            <Tag className="size-4" style={{ color: type === "income" ? "#0d9488" : "#ef4444" }} />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay categorías. Agrega una abajo.
            </p>
          ) : (
            categories.map(cat => (
              <CategoryRow
                key={cat.id}
                catId={cat.id}
                catName={cat.name}
                catColor={cat.color}
                expenseType={cat.expenseType}
                type={type}
              />
            ))
          )}
        </div>
        <AddCategoryForm type={type} onAdd={handleAdd} />
      </CardContent>
    </Card>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function CategorySettings() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Categorías y Subcategorías</h2>
        <p className="text-sm text-muted-foreground">
          Administra las categorías y sus subcategorías. Haz clic en la flecha de una categoría de gasto para ver y agregar subcategorías.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <CategorySection
          type="income"
          title="Categorías de Ingresos"
          description="Usado en la sección de Ingresos"
        />
        <CategorySection
          type="expense"
          title="Categorías de Gastos"
          description="Haz clic en ▶ para gestionar subcategorías"
        />
      </div>
    </div>
  )
}