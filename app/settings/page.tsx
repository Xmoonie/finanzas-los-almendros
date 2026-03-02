"use client"

import { AppShell } from "@/components/layout/app-shell"
import { CategorySettings } from "@/components/settings/category-settings"
import { useFinance } from "@/components/providers/finance-provider"
import { Skeleton } from "@/components/ui/skeleton"

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </div>
  )
}

function SettingsContent() {
  const { isLoaded } = useFinance()
  if (!isLoaded) return <SettingsSkeleton />
  return (
    <div className="p-6">
      <CategorySettings />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <AppShell title="Configuración">
      <SettingsContent />
    </AppShell>
  )
}
