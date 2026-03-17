"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

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
import type { Budget } from "@/lib/types"

const formSchema = z.object({
  category: z.string().min(1, "Selecciona una categoria"),
  monthlyLimit: z.coerce.number().positive("El presupuesto debe ser mayor a 0"),
})

type FormValues = z.infer<typeof formSchema>

interface BudgetFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: string
  budget?: Budget | null
}

export function BudgetForm({ open, onOpenChange, month, budget }: BudgetFormProps) {
  const { data, addBudget, updateBudget, activeBusiness } = useFinance()
  const expenseCategories = data.categories.filter(c => c.type === "expense")

  const existingBudgetCategories = data.budgets
    .filter(b => b.month === month && b.id !== budget?.id)
    .map(b => b.category)

  const availableCategories = expenseCategories.filter(
    c => !existingBudgetCategories.includes(c.name)
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: budget
      ? { category: budget.category, monthlyLimit: budget.monthlyLimit }
      : { category: "", monthlyLimit: 0 },
  })

  function onSubmit(values: FormValues) {
  if (budget) {
    updateBudget({ ...budget, monthlyLimit: values.monthlyLimit, category: values.category })
  } else {
    addBudget({ 
      category: values.category, 
      monthlyLimit: values.monthlyLimit, 
      month,
      businessId: activeBusiness?.id ?? "",
    })
  }
  form.reset()
  onOpenChange(false)
}
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {budget ? "Editar Presupuesto" : "Nuevo Presupuesto"}
          </DialogTitle>
          <DialogDescription>
            {budget ? "Modifica el limite del presupuesto." : "Establece un limite mensual para una categoria."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
                      {(budget ? expenseCategories : availableCategories).map((cat) => (
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
              name="monthlyLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Limite Mensual (L)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {budget ? "Guardar" : "Crear Presupuesto"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
