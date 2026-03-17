"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  Moon,
  Sun,
  Scale,
  Repeat,
  Settings,
  ChefHat,
  LogOut,
  Building2,
  ChevronDown,
  Plus,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { useFinance } from "@/components/providers/finance-provider"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Balance", href: "/balance", icon: Scale },
  { label: "Ingresos", href: "/income", icon: TrendingUp },
  { label: "Gastos", href: "/expenses", icon: TrendingDown },
  { label: "Gastos Fijos", href: "/recurring", icon: Repeat },
  { label: "Presupuestos", href: "/budgets", icon: Wallet },
  { label: "Reportes", href: "/reports", icon: BarChart3 },
  { label: "Control de Costos", href: "/costos", icon: ChefHat },
  { label: "Configuración", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { businesses, activeBusiness, setActiveBusiness, createBusiness } = useFinance()
  const [showNewBiz, setShowNewBiz] = useState(false)
  const [newBizName, setNewBizName] = useState("")
  const [creating, setCreating] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleCreateBusiness = async () => {
    if (!newBizName.trim()) return
    setCreating(true)
    await createBusiness(newBizName.trim())
    setNewBizName("")
    setCreating(false)
    setShowNewBiz(false)
  }

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 w-full hover:opacity-80 transition-opacity">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div className="flex flex-col items-start group-data-[collapsible=icon]:hidden flex-1 min-w-0">
                  <span className="text-sm font-bold tracking-tight truncate w-full text-left">
                    {activeBusiness?.name ?? "Sin negocio"}
                  </span>
                  <span className="text-[10px] text-sidebar-foreground/60">Gestión Financiera</span>
                </div>
                <ChevronDown className="size-3 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {businesses.map(biz => (
                <DropdownMenuItem
                  key={biz.id}
                  onClick={() => setActiveBusiness(biz)}
                  className={activeBusiness?.id === biz.id ? "bg-accent" : ""}
                >
                  <Building2 className="size-4 mr-2" />
                  {biz.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowNewBiz(true)}>
                <Plus className="size-4 mr-2" />
                Nuevo negocio
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || (item.href === "/dashboard" && pathname === "/")}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-2 gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="group-data-[collapsible=icon]:hidden">
              {theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
          </Button>
        </SidebarFooter>
      </Sidebar>

      <Dialog open={showNewBiz} onOpenChange={setShowNewBiz}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo negocio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="biz-name">Nombre del negocio</Label>
              <Input
                id="biz-name"
                placeholder="Ej: Restaurante El Palmeral"
                value={newBizName}
                onChange={e => setNewBizName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreateBusiness()}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleCreateBusiness}
              disabled={!newBizName.trim() || creating}
            >
              {creating ? "Creando..." : "Crear negocio"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}