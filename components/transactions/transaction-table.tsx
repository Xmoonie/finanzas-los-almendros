"use client"

import { useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Pencil, Trash2, Search, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { useFinance } from "@/components/providers/finance-provider"
import { formatCurrency, getCategoryColor } from "@/lib/finance-store"
import { TransactionForm } from "@/components/transactions/transaction-form"
import type { Transaction, TransactionType } from "@/lib/types"

type SortField = "date" | "amount" | "category"
type SortDir = "asc" | "desc"

function getAvailableMonths(transactions: Transaction[], type: TransactionType): string[] {
  const months = new Set(
    transactions
      .filter(t => t.type === type)
      .map(t => t.date.substring(0, 7))
  )
  return Array.from(months).sort((a, b) => b.localeCompare(a))
}

function formatMonthLabel(yyyymm: string): string {
  const [year, month] = yyyymm.split("-")
  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
  const label = format(date, "MMMM yyyy", { locale: es })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function getAvailableYears(transactions: Transaction[], type: TransactionType): string[] {
  const years = new Set(
    transactions
      .filter(t => t.type === type)
      .map(t => t.date.substring(0, 4))
  )
  return Array.from(years).sort((a, b) => b.localeCompare(a))
}


export function TransactionTable({ type }: { type: TransactionType }) {
  const { data, deleteTransaction } = useFinance()
  const currentMonth = format(new Date(), "yyyy-MM")
  const currentYear = format(new Date(), "yyyy")

  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [monthFilter, setMonthFilter] = useState<string>(currentMonth)
  const [yearFilter, setYearFilter] = useState<string>(currentYear)
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")
  const [editTx, setEditTx] = useState<Transaction | null>(null)
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null)

  const categories = data.categories.filter(c => c.type === type)
  const availableMonths = useMemo(() => getAvailableMonths(data.transactions, type), [data.transactions, type])
const availableYears = useMemo(() => getAvailableYears(data.transactions, type), [data.transactions, type])
  const transactions = useMemo(() => {
    let filtered = data.transactions.filter(t => t.type === type)

    if (monthFilter !== "all") {
      filtered = filtered.filter(t => t.date.startsWith(monthFilter))
      if (yearFilter !== "all") {
  filtered = filtered.filter(t => t.date.startsWith(yearFilter))
}
    }

    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        t =>
          t.description.toLowerCase().includes(q) ||
          t.payee.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(t => t.category === categoryFilter)
    }

    filtered.sort((a, b) => {
      let cmp = 0
      if (sortField === "date") cmp = a.date.localeCompare(b.date)
      else if (sortField === "amount") cmp = a.amount - b.amount
      else cmp = a.category.localeCompare(b.category)
      return sortDir === "desc" ? -cmp : cmp
    })

    return filtered
  }, [data.transactions, type, search, categoryFilter, monthFilter, sortField, sortDir])

  const total = transactions.reduce((sum, t) => sum + t.amount, 0)

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(d => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  function handleDelete() {
    if (deleteTxId) {
      deleteTransaction(deleteTxId)
      toast.success(type === "income" ? "Ingreso eliminado" : "Gasto eliminado")
      setDeleteTxId(null)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar transacciones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro de año */}
<Select value={yearFilter} onValueChange={setYearFilter}>
  <SelectTrigger className="w-[100px]">
    <SelectValue placeholder="Año" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">Todos</SelectItem>
    {availableYears.map(y => (
      <SelectItem key={y} value={y}>{y}</SelectItem>
    ))}
  </SelectContent>
</Select>
            {/* Filtro de mes */}
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {availableMonths.map(m => (
                  <SelectItem key={m} value={m}>
                    {formatMonthLabel(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro de categoria */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas las categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="rounded-lg border bg-card px-3 py-2 text-sm font-semibold">
              Total: {formatCurrency(total)}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs" onClick={() => toggleSort("date")}>
                    Fecha
                    <ArrowUpDown className="ml-1 size-3" />
                  </Button>
                </TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs" onClick={() => toggleSort("category")}>
                    Categoria
                    <ArrowUpDown className="ml-1 size-3" />
                  </Button>
                </TableHead>
                <TableHead>{type === "income" ? "Pagador" : "Beneficiario"}</TableHead>
                <TableHead className="text-right">
                  <Button variant="ghost" size="sm" className="-ml-3 h-8 text-xs" onClick={() => toggleSort("amount")}>
                    Monto
                    <ArrowUpDown className="ml-1 size-3" />
                  </Button>
                </TableHead>
                <TableHead className="w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No se encontraron transacciones.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => {
                  const color = getCategoryColor(data.categories, tx.category)
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {format(parseISO(tx.date), "dd/MM/yyyy", { locale: es })}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{tx.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-transparent text-xs"
                          style={{ backgroundColor: `${color}15`, color }}
                        >
                          {tx.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{tx.payee}</TableCell>
                      <TableCell className="text-right text-sm font-semibold tabular-nums">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={() => setEditTx(tx)}
                          >
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTxId(tx.id)}
                          >
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {editTx && (
        <TransactionForm
          open={!!editTx}
          onOpenChange={(open) => { if (!open) setEditTx(null) }}
          type={type}
          transaction={editTx}
        />
      )}

      <AlertDialog open={!!deleteTxId} onOpenChange={(open) => { if (!open) setDeleteTxId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminacion</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminara permanentemente esta transaccion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}