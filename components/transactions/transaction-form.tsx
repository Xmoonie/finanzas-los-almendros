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
import type { Transaction, TransactionType } from "@/lib/types"

const formSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  category: z.string().min(1, "Selecciona una categoria"),
  description: z.string().min(1, "Ingresa una descripcion"),
  payee: z.string().min(1, "Ingresa un nombre"),
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
  const { data, addTransaction, updateTransaction } = useFinance()
  const categories = data.categories.filter(c => c.type === type)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: transaction
      ? {
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          payee: transaction.payee,
          date: new Date(transaction.date),
        }
      : {
          amount: 0,
          category: "",
          description: "",
          payee: "",
          date: new Date(),
        },
  })

  function onSubmit(values: FormValues) {
    const txData = {
      type,
      amount: values.amount,
      category: values.category,
      description: values.description,
      payee: values.payee,
      date: format(values.date, "yyyy-MM-dd"),
    }

    if (transaction) {
      updateTransaction({ ...txData, id: transaction.id })
    } else {
      addTransaction(txData)
    }

    form.reset()
    onOpenChange(false)
  }

  const isIncome = type === "income"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? "Editar" : "Agregar"} {isIncome ? "Ingreso" : "Gasto"}
          </DialogTitle>
          <DialogDescription>
            {transaction ? "Modifica los datos de la transaccion." : `Registra un nuevo ${isIncome ? "ingreso" : "gasto"}.`}
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
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
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
                      {categories.map((cat) => (
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
                    <Input placeholder="Describe la transaccion" {...field} />
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
                  <FormLabel>{isIncome ? "Pagador" : "Beneficiario"}</FormLabel>
                  <FormControl>
                    <Input placeholder={isIncome ? "Quien paga" : "A quien se paga"} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                {transaction ? "Guardar Cambios" : "Agregar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
