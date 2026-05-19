"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { useEffect } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFinance } from "@/components/providers/finance-provider"
import type { RecurringExpense, RecurringFrequency } from "@/lib/types"

const formSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  category: z.string().min(1, "Selecciona una categoria"),
  subcategoryId: z.string().optional(),
  description: z.string().min(1, "Ingresa una descripcion"),
  frequency: z.enum(["weekly", "biweekly", "monthly", "yearly"] as const),
  dayOfMonth: z.coerce.number().min(1).max(31).optional(),
})

type FormValues = z.infer<typeof formSchema>

const frequencyLabels: Record<RecurringFrequency, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  yearly: "Anual",
}

interface RecurringFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: RecurringExpense | null
}

export function RecurringForm({ open, onOpenChange, expense }: RecurringFormProps) {
  const { data, addRecurringExpense, updateRecurringExpense, activeBusiness } = useFinance()
  const expenseCategories = data.categories.filter(c => c.type === "expense")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: expense
      ? {
          amount: expense.amount,
          category: expense.category,
          subcategoryId: expense.subcategoryId ?? "",
          description: expense.description,
          frequency: expense.frequency,
          dayOfMonth: expense.dayOfMonth ?? undefined,
        }
      : {
          amount: 0,
          category: "",
          subcategoryId: "",
          description: "",
          frequency: "monthly" as RecurringFrequency,
          dayOfMonth: undefined,
        },
  })

  const selectedCategory = form.watch("category")
  const selectedFrequency = form.watch("frequency")

  const subcategories = data.subcategories.filter(
    s => s.categoryName === selectedCategory
  )

  // Reset subcategoría cuando cambia categoría
  useEffect(() => {
    if (!expense) form.setValue("subcategoryId", "")
  }, [selectedCategory, expense, form])

  function onSubmit(values: FormValues) {
    const selectedSub = values.subcategoryId
      ? data.subcategories.find(s => s.id === values.subcategoryId)
      : undefined

    const recData = {
      businessId: activeBusiness?.id ?? "",
      category: values.category,
      description: values.description,
      amount: values.amount,
      frequency: values.frequency,
      startDate: format(new Date(), "yyyy-MM-dd"),
      active: true,
      subcategoryId: selectedSub?.id ?? undefined,
      subcategoryName: selectedSub?.name ?? undefined,
      dayOfMonth: values.dayOfMonth ?? undefined,
    }

    if (expense) {
      updateRecurringExpense({ ...recData, id: expense.id, active: expense.active })
    } else {
      addRecurringExpense(recData)
    }

    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {expense ? "Editar" : "Agregar"} Gasto Fijo
          </DialogTitle>
          <DialogDescription>
            {expense
              ? "Modifica los datos del gasto recurrente."
              : "Registra un nuevo gasto fijo recurrente."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">

            {/* Descripción */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripcion</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Renta local, Planilla, Agua..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Monto */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto (L)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categoría */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                          {cat.expenseType && (
                            <span className="ml-2 text-xs text-muted-foreground uppercase">
                              {cat.expenseType}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Subcategoría */}
            {selectedCategory && subcategories.length > 0 && (
              <FormField
                control={form.control}
                name="subcategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una subcategoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">— Ninguna —</SelectItem>
                        {subcategories.map((sub) => (
                          <SelectItem key={sub.id} value={sub.id}>
                            {sub.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Frecuencia */}
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frecuencia</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona frecuencia" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.entries(frequencyLabels) as Array<[RecurringFrequency, string]>).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Día del mes — solo si frecuencia es mensual */}
            {selectedFrequency === "monthly" && (
              <FormField
                control={form.control}
                name="dayOfMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Día del mes para registrar</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="Ej: 1, 15, 30"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {expense ? "Guardar Cambios" : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}