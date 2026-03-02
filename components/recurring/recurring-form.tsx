"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

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
import type { RecurringExpense, RecurringFrequency } from "@/lib/types"

const formSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  category: z.string().min(1, "Selecciona una categoria"),
  description: z.string().min(1, "Ingresa una descripcion"),
  payee: z.string().min(1, "Ingresa un beneficiario"),
  frequency: z.enum(["weekly", "biweekly", "monthly", "yearly"] as const),
  startDate: z.date({ required_error: "Selecciona una fecha de inicio" }),
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
  const { data, addRecurringExpense, updateRecurringExpense } = useFinance()
  const expenseCategories = data.categories.filter(c => c.type === "expense")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: expense
      ? {
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
          payee: expense.payee,
          frequency: expense.frequency,
          startDate: new Date(expense.startDate),
        }
      : {
          amount: 0,
          category: "",
          description: "",
          payee: "",
          frequency: "monthly" as RecurringFrequency,
          startDate: new Date(),
        },
  })

  function onSubmit(values: FormValues) {
    const recData = {
      category: values.category,
      description: values.description,
      payee: values.payee,
      amount: values.amount,
      frequency: values.frequency,
      startDate: format(values.startDate, "yyyy-MM-dd"),
      active: true,
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
            {expense ? "Modifica los datos del gasto recurrente." : "Registra un nuevo gasto fijo recurrente."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frecuencia</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripcion</FormLabel>
                  <FormControl>
                    <Input placeholder="Describe el gasto fijo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beneficiario</FormLabel>
                  <FormControl>
                    <Input placeholder="A quien se paga" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Inicio</FormLabel>
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
                          {field.value
                            ? format(field.value, "dd/MM/yyyy")
                            : "Selecciona fecha"}
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
                {expense ? "Guardar Cambios" : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
