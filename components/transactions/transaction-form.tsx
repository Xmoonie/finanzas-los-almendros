"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useEffect, useState } from "react"

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { useFinance } from "@/components/providers/finance-provider"
import type { Transaction, TransactionType } from "@/lib/types"

const formSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  category: z.string().min(1, "Selecciona una categoria"),
  subcategoryId: z.string().optional(),
  notes: z.string().optional(),
  payee: z.string().optional(),
  date: z.date({ required_error: "Selecciona una fecha" }),
})

type FormValues = z.infer<typeof formSchema>

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: TransactionType
  transaction?: Transaction | null
}

export function TransactionForm({ open, onOpenChange, type, transaction }: TransactionFormProps) {
  const { data, addTransaction, updateTransaction, activeBusiness } = useFinance()
  const categories = data.categories.filter(c => c.type === type)
  const isExpense = type === "expense"

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: transaction
      ? {
          amount: transaction.amount,
          category: transaction.category,
          subcategoryId: transaction.subcategoryId ?? "",
          description: transaction.description,
          payee: transaction.payee ?? "",
          date: new Date(transaction.date),
        }
      : {
          amount: 0,
          category: "",
          subcategoryId: "",
          notes: "",
          payee: "",
          date: new Date(),
        },
  })

  const selectedCategory = form.watch("category")
  const descriptionValue = form.watch("description")

  // Subcategorías filtradas por categoría seleccionada
  const subcategories = data.subcategories.filter(
    s => s.categoryName === selectedCategory
  )

  // Autocomplete: cuando cambia la descripción, buscar en expense_memory
  useEffect(() => {
    if (!isExpense || !descriptionValue || transaction) return

    const match = data.expenseMemory.find(
      m => m.description === descriptionValue.toLowerCase().trim()
    )

    if (match) {
      form.setValue("category", match.categoryName)
      if (match.subcategoryId) {
        form.setValue("subcategoryId", match.subcategoryId)
      }
    }
  }, [descriptionValue, data.expenseMemory, isExpense, transaction, form])

  // Reset subcategoría cuando cambia la categoría
  useEffect(() => {
    if (!transaction) {
      form.setValue("subcategoryId", "")
    }
  }, [selectedCategory, transaction, form])

  function onSubmit(values: FormValues) {
    const selectedSub = values.subcategoryId
      ? data.subcategories.find(s => s.id === values.subcategoryId)
      : undefined

    const txData = {
      type,
      businessId: activeBusiness?.id ?? "",
      amount: values.amount,
      category: values.category,
      notes: values.notes,
      date: format(values.date, "yyyy-MM-dd"),
      payee: values.payee ?? undefined,
      subcategoryId: selectedSub?.id ?? undefined,
      subcategoryName: selectedSub?.name ?? undefined,
    }

    if (transaction) {
      updateTransaction({ ...txData, id: transaction.id })
    } else {
      addTransaction(txData)
    }

    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar" : "Agregar"} {isExpense ? "Gasto" : "Ingreso"}
          </DialogTitle>
          <DialogDescription>
            {transaction
              ? "Modifica los datos de la transaccion."
              : `Registra un nuevo ${isExpense ? "gasto" : "ingreso"}.`}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">

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

            {/* Descripción — va primero en gastos para triggear autocomplete */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripcion</FormLabel>
                  <FormControl>
                    <Input placeholder="Describe la transaccion" {...field} />
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
                      {categories.map((cat) => (
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

            {/* Subcategoría — solo si hay subcategorías para la categoría seleccionada */}
            {isExpense && selectedCategory && subcategories.length > 0 && (
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
{/* Notas */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas <span className="text-muted-foreground text-xs">(opcional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Informacion adicional..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Pagador — solo en ingresos */}
            {!isExpense && (
              <FormField
                control={form.control}
                name="payee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pagador</FormLabel>
                    <FormControl>
                      <Input placeholder="Quien paga" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Fecha */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "dd/MM/yyyy") : "Selecciona fecha"}
                          <CalendarIcon className="ml-auto size-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {transaction ? "Guardar Cambios" : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}