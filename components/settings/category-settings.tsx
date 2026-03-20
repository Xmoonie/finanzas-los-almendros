"use client"

import { useState } from "react"
import { Plus, Trash2, Tag } from "lucide-react"
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
    if (!trimmed) {
      setError("El nombre no puede estar vacío")
      return
    }
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
          <Label htmlFor={`name-${type}`} className="text-xs mb-1 block">Nombre</Label>
          <Input
            id={`name-${type}`}
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

interface CategorySectionProps {
  type: TransactionType
  title: string
  description: string
}

function CategorySection({ type, title, description }: CategorySectionProps) {
  const { data, addCategory, deleteCategory, activeBusiness } = useFinance()
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
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 bg-background hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium">{cat.name}</span>
                  {type === "expense" && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4"
                      style={{
                        borderColor: cat.expenseType === "cogs" ? "#f97316" : "#6b7280",
                        color: cat.expenseType === "cogs" ? "#f97316" : "#6b7280",
                      }}
                    >
                      {cat.expenseType === "cogs" ? "COGS" : "Operativo"}
                    </Badge>
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
                        Esta acción eliminará la categoría <strong>{cat.name}</strong>. Las transacciones existentes con esta categoría no serán afectadas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteCategory(cat.id)}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))
          )}
        </div>
        <AddCategoryForm type={type} onAdd={handleAdd} />
      </CardContent>
    </Card>
  )
}

export function CategorySettings() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Categorías</h2>
        <p className="text-sm text-muted-foreground">
          Administra las categorías disponibles para clasificar tus ingresos y gastos.
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
          description="Usado en Gastos y Presupuestos"
        />
      </div>
    </div>
  )
}