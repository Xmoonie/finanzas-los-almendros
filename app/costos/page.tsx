"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { AppShell } from "@/components/layout/app-shell"
import { CostProvider, useCost } from "@/components/providers/cost-provider"
import { getCostSummaryForDate, getCostSummaryForMonth } from "@/lib/cost-store"
import { formatCurrency } from "@/lib/finance-store"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trash2, PlusCircle } from "lucide-react"
import type { IngredientCategory, MeatType, Unit } from "@/lib/cost-types"

const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  carne: "🥩 Carne",
  vegetales: "🥦 Vegetales",
  arroz_granos: "🌾 Arroz / Granos",
}

const MEAT_ITEMS: Record<MeatType, string> = {
  pollo: "Pollo",
  res: "Res",
  cerdo: "Cerdo",
  otro: "Otro",
}

const UNIT_LABELS: Record<Unit, string> = {
  lb: "Libras (lb)",
  kg: "Kilogramos (kg)",
  unidad: "Unidades",
  porcion: "Porciones",
}

const VEGETABLE_SUGGESTIONS = [
  "Tomate", "Cebolla", "Chiltoma", "Lechuga", "Zanahoria",
  "Papa", "Repollo", "Chile", "Cilantro", "Ajo",
]

const GRAIN_SUGGESTIONS = ["Arroz blanco", "Arroz integral", "Frijoles", "Lentejas", "Maíz"]

const DEFAULT_FORM = {
  date: format(new Date(), "yyyy-MM-dd"),
  category: "" as IngredientCategory | "",
  item: "",
  meat_type: "" as MeatType | "",
  quantity_used: "",
  quantity_wasted: "",
  unit: "lb" as Unit,
  unit_cost: "",
  notes: "",
  logged_by: "",
}

function CostLogForm() {
  const { addCostEntry } = useCost()
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const getItemSuggestions = () => {
    if (form.category === "vegetales") return VEGETABLE_SUGGESTIONS
    if (form.category === "arroz_granos") return GRAIN_SUGGESTIONS
    return []
  }

  const handleSubmit = async () => {
    if (!form.date || !form.category || !form.quantity_used || !form.unit_cost || !form.logged_by) return

    setSaving(true)
    await addCostEntry({
      date: form.date,
      category: form.category as IngredientCategory,
      item: form.category === "carne" && form.meat_type
        ? MEAT_ITEMS[form.meat_type as MeatType]
        : form.item,
      meat_type: form.category === "carne" ? (form.meat_type as MeatType) : undefined,
      quantity_used: parseFloat(form.quantity_used),
      quantity_wasted: parseFloat(form.quantity_wasted || "0"),
      unit: form.unit,
      unit_cost: parseFloat(form.unit_cost),
      notes: form.notes || undefined,
      logged_by: form.logged_by,
    })
    setSaving(false)
    setSuccess(true)
    setForm(prev => ({ ...DEFAULT_FORM, date: prev.date, logged_by: prev.logged_by, category: prev.category }))
    setTimeout(() => setSuccess(false), 2500)
  }

  const suggestions = getItemSuggestions()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Registrar Ingrediente</CardTitle>
        <CardDescription>El chef llena este formulario diariamente</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Fecha</Label>
          <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Registrado por</Label>
          <Input placeholder="Nombre del chef / encargado" value={form.logged_by} onChange={e => set("logged_by", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Categoría</Label>
          <Select value={form.category} onValueChange={v => set("category", v)}>
            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {form.category === "carne" ? (
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de carne</Label>
            <Select value={form.meat_type} onValueChange={v => set("meat_type", v)}>
              <SelectTrigger><SelectValue placeholder="Seleccionar carne..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(MEAT_ITEMS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label>Ingrediente</Label>
            <Input
              list="item-suggestions"
              placeholder="Ej: Arroz blanco, Tomate..."
              value={form.item}
              onChange={e => set("item", e.target.value)}
            />
            <datalist id="item-suggestions">
              {suggestions.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <Label>Unidad de medida</Label>
          <Select value={form.unit} onValueChange={v => set("unit", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(UNIT_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Cantidad utilizada</Label>
          <Input type="number" min="0" step="0.1" placeholder="0.0" value={form.quantity_used} onChange={e => set("quantity_used", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Cantidad desperdiciada</Label>
          <Input type="number" min="0" step="0.1" placeholder="0.0" value={form.quantity_wasted} onChange={e => set("quantity_wasted", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Costo por unidad (L)</Label>
          <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.unit_cost} onChange={e => set("unit_cost", e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
          <Label>Observaciones (opcional)</Label>
          <Input placeholder="Notas adicionales..." value={form.notes} onChange={e => set("notes", e.target.value)} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            <PlusCircle className="h-4 w-4" />
            {saving ? "Guardando..." : "Registrar"}
          </Button>
          {success && <span className="text-sm text-emerald-600 font-medium">✓ Registrado correctamente</span>}
        </div>
      </CardContent>
    </Card>
  )
}

const CATEGORY_BADGE: Record<string, string> = {
  carne: "bg-red-100 text-red-700",
  vegetales: "bg-green-100 text-green-700",
  arroz_granos: "bg-yellow-100 text-yellow-700",
}

function CostSummaryCards({ selectedDate }: { selectedDate: string }) {
  const { data } = useCost()
  const month = selectedDate.substring(0, 7)
  const daySummary = getCostSummaryForDate(data.entries, selectedDate)
  const monthSummary = getCostSummaryForMonth(data.entries, month)

  const cards = [
    { label: "Costo hoy", value: formatCurrency(daySummary.total_cost), sub: "Total ingredientes" },
    { label: "Desperdicio hoy", value: formatCurrency(daySummary.waste_cost), sub: "Costo del desperdicio", warn: daySummary.waste_cost > 0 },
    { label: "Costo del mes", value: formatCurrency(monthSummary.total_cost), sub: format(new Date(month + "-02"), "MMMM yyyy", { locale: es }) },
    { label: "% Desperdicio", value: `${monthSummary.waste_percentage.toFixed(1)}%`, sub: "Del total del mes", warn: monthSummary.waste_percentage > 10 },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(card => (
        <Card key={card.label}>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.warn ? "text-orange-500" : "text-foreground"}`}>
              {card.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CostLogTable({ selectedDate }: { selectedDate: string }) {
  const { data, deleteCostEntry } = useCost()
  const entries = data.entries.filter(e => e.date === selectedDate)

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No hay registros para esta fecha.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Registros — {format(new Date(selectedDate + "T12:00:00"), "dd 'de' MMMM yyyy", { locale: es })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Ingrediente</TableHead>
                <TableHead className="text-right">Usado</TableHead>
                <TableHead className="text-right">Desperdicio</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead className="text-right">C/U (L)</TableHead>
                <TableHead className="text-right">Total (L)</TableHead>
                <TableHead className="text-right">Desp. (L)</TableHead>
                <TableHead>Por</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(e => (
                <TableRow key={e.id}>
                  <TableCell>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_BADGE[e.category]}`}>
                      {CATEGORY_LABELS[e.category]}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{e.item}</TableCell>
                  <TableCell className="text-right">{e.quantity_used}</TableCell>
                  <TableCell className="text-right">
                    {e.quantity_wasted > 0 ? <span className="text-orange-500">{e.quantity_wasted}</span> : "—"}
                  </TableCell>
                  <TableCell>{e.unit}</TableCell>
                  <TableCell className="text-right">{formatCurrency(e.unit_cost)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(e.total_cost)}</TableCell>
                  <TableCell className="text-right">
                    {e.waste_cost > 0 ? <span className="text-orange-500">{formatCurrency(e.waste_cost)}</span> : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.logged_by}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => deleteCostEntry(e.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function CostosContent() {
  const { isLoaded } = useCost()
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"))

  if (!isLoaded) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Control de Costos Diario</h2>
          <p className="text-xs text-muted-foreground">Carnes, vegetales y arroz/granos</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground">Fecha</Label>
          <Input
            type="date"
            className="w-auto text-sm"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
      </div>
      <CostSummaryCards selectedDate={selectedDate} />
      <CostLogForm />
      <CostLogTable selectedDate={selectedDate} />
    </div>
  )
}

export default function CostosPage() {
  return (
    <CostProvider>
      <AppShell title="Control de Costos">
        <CostosContent />
      </AppShell>
    </CostProvider>
  )
}