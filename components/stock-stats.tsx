"use client"

import { useStock } from "@/contexts/stock-context"
import { Card } from "./ui/card"
import { 
  PackageIcon, 
  AlertTriangleIcon, 
  TrendingDownIcon, 
  BoxIcon,
  FolderIcon,
  LayersIcon,
  ArchiveIcon,
  DollarSignIcon
} from "lucide-react"

export function StockStats() {
  const { 
    stockCategories = [], 
    subCategories = [], 
    products = [], 
    getLowStockProducts, 
    getExpiringSoonBatches 
  } = useStock()

  const lowStockCount = getLowStockProducts?.()?.length ?? 0
  const expiringCount = getExpiringSoonBatches?.()?.length ?? 0
  
  // Calculate total batches and stock value
  const totalBatches = (products || []).reduce((sum, p) => sum + (p.batches?.length || 0), 0)
  const totalStockValue = (products || []).reduce((sum, p) => {
    const productStock = (p.batches || []).reduce((bSum, b) => bSum + (b.quantity * b.unitCost), 0)
    return sum + productStock
  }, 0)

  const stats = [
    {
      title: "Categories",
      value: stockCategories?.length ?? 0,
      icon: FolderIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Sous-categories",
      value: subCategories?.length ?? 0,
      icon: LayersIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Produits",
      value: products?.length ?? 0,
      icon: BoxIcon,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Lots actifs",
      value: totalBatches,
      icon: ArchiveIcon,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    },
    {
      title: "Valeur Stock",
      value: `${totalStockValue.toFixed(0)} TND`,
      icon: DollarSignIcon,
      color: "text-green-600",
      bgColor: "bg-green-100",
      isLarge: true,
    },
    {
      title: "Stock Bas",
      value: lowStockCount,
      icon: TrendingDownIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      alert: lowStockCount > 0,
    },
    {
      title: "DLC Proche",
      value: expiringCount,
      icon: AlertTriangleIcon,
      color: "text-red-600",
      bgColor: "bg-red-100",
      alert: expiringCount > 0,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card 
            key={stat.title} 
            className={`p-4 ${stat.alert ? "border-red-200 bg-red-50/50" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{stat.title}</p>
                <p className={`text-xl font-bold ${stat.alert ? "text-red-600" : "text-foreground"}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
