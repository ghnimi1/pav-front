"use client"

import { useStock } from "@/contexts/stock-context"
import { useProduction } from "@/contexts/production-context"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { AlertTriangleIcon, TrendingDownIcon, CalendarIcon, PackageIcon, CakeIcon, AlertOctagonIcon } from "lucide-react"

export function AlertsPanel() {
  const { getLowStockProducts, getExpiringSoonBatches, subCategories = [], stockCategories = [] } = useStock()
  const { getLowStockItems, getExpiringItems, recipes } = useProduction()

  const lowStockProducts = getLowStockProducts?.() ?? []
  const expiringBatches = getExpiringSoonBatches?.() ?? []
  
  // Showcase/vitrine stock alerts
  const lowShowcaseItems = getLowStockItems?.() ?? []
  const expiringShowcaseItems = getExpiringItems?.(24) ?? [] // Items expiring in 24 hours
  
  // Get recipe names for showcase items
  const getRecipeName = (recipeId: string) => recipes.find(r => r.id === recipeId)?.name ?? "Produit inconnu"
  
  // Out of stock recipes (showcase items with 0 quantity)
  const outOfStockRecipes = new Set<string>()
  lowShowcaseItems.forEach(item => {
    if (item.quantity === 0) {
      outOfStockRecipes.add(item.recipeId)
    }
  })

  const hasNoAlerts = lowStockProducts.length === 0 && 
    expiringBatches.length === 0 && 
    lowShowcaseItems.length === 0 && 
    expiringShowcaseItems.length === 0

  if (hasNoAlerts) {
    return (
      <Card className="p-6 bg-emerald-50/50 border-emerald-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
            <PackageIcon className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-emerald-800">Tout va bien!</h3>
            <p className="text-sm text-emerald-600">Aucune alerte de stock ou d&apos;expiration</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Out of Stock Alert - Critical */}
      {outOfStockRecipes.size > 0 && (
        <Card className="border-red-300 bg-red-50/50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <AlertOctagonIcon className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-red-900">Rupture de Stock!</h3>
                <p className="text-sm text-red-700">
                  {outOfStockRecipes.size} produit{outOfStockRecipes.size > 1 ? "s" : ""} en rupture - non affiche{outOfStockRecipes.size > 1 ? "s" : ""} au menu
                </p>
              </div>
              <div className="space-y-2">
                {Array.from(outOfStockRecipes).slice(0, 4).map((recipeId) => (
                  <div key={recipeId} className="flex items-center justify-between rounded-md bg-white p-2 text-sm shadow-sm">
                    <div className="flex items-center gap-2">
                      <CakeIcon className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-foreground">{getRecipeName(recipeId)}</span>
                    </div>
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                      Rupture
                    </Badge>
                  </div>
                ))}
              </div>
              {outOfStockRecipes.size > 4 && (
                <p className="text-xs text-red-600">
                  +{outOfStockRecipes.size - 4} autre{outOfStockRecipes.size - 4 > 1 ? "s" : ""} produit{outOfStockRecipes.size - 4 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Low Showcase Stock Alert */}
      {lowShowcaseItems.filter(i => i.quantity > 0).length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <CakeIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-amber-900">Stock Vitrine Bas</h3>
                <p className="text-sm text-amber-700">
                  {lowShowcaseItems.filter(i => i.quantity > 0).length} produit{lowShowcaseItems.filter(i => i.quantity > 0).length > 1 ? "s" : ""} fini{lowShowcaseItems.filter(i => i.quantity > 0).length > 1 ? "s" : ""} a reapprovisionner
                </p>
              </div>
              <div className="space-y-2">
                {lowShowcaseItems.filter(i => i.quantity > 0).slice(0, 4).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md bg-white p-2 text-sm shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{getRecipeName(item.recipeId)}</span>
                      <span className="text-xs text-muted-foreground">Lot: {item.batchNumber}</span>
                    </div>
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                      {item.quantity} restant{item.quantity > 1 ? "s" : ""}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Expiring Showcase Items Alert */}
      {expiringShowcaseItems.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
              <CalendarIcon className="h-5 w-5 text-purple-600" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-purple-900">Expiration Proche (Vitrine)</h3>
                <p className="text-sm text-purple-700">
                  {expiringShowcaseItems.length} lot{expiringShowcaseItems.length > 1 ? "s" : ""} expire{expiringShowcaseItems.length > 1 ? "nt" : ""} dans les 24h
                </p>
              </div>
              <div className="space-y-2">
                {expiringShowcaseItems.slice(0, 4).map((item) => {
                  const expDate = new Date(`${item.expirationDate}T${item.expirationTime}`)
                  const hoursUntilExpiry = Math.ceil((expDate.getTime() - new Date().getTime()) / (1000 * 60 * 60))
                  return (
                    <div key={item.id} className="flex items-center justify-between rounded-md bg-white p-2 text-sm shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{getRecipeName(item.recipeId)}</span>
                        <span className="text-xs text-muted-foreground">{item.quantity} unites</span>
                      </div>
                      <Badge variant="outline" className={`gap-1 text-xs ${
                        hoursUntilExpiry <= 6 
                          ? "bg-red-100 text-red-700 border-red-300" 
                          : "bg-purple-100 text-purple-700 border-purple-300"
                      }`}>
                        <CalendarIcon className="h-3 w-3" />
                        {hoursUntilExpiry <= 0 ? "Expire!" : `${hoursUntilExpiry}h`}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Raw Materials Alerts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {lowStockProducts.length > 0 && (
          <Card className="border-orange-200 bg-orange-50/50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-100">
              <TrendingDownIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-orange-900">Stock Bas</h3>
                <p className="text-sm text-orange-700">
                  {lowStockProducts.length} produit{lowStockProducts.length > 1 ? "s" : ""} sous le seuil minimum
                </p>
              </div>
              <div className="space-y-2">
                {lowStockProducts.slice(0, 4).map((product) => {
                  const totalStock = (product.batches || []).reduce((sum, b) => sum + b.quantity, 0)
                  const subCat = (subCategories || []).find(s => s.id === product.subCategoryId)
                  const cat = (stockCategories || []).find(c => c.id === subCat?.categoryId)
                  return (
                    <div key={product.id} className="flex items-center justify-between rounded-md bg-white p-2 text-sm shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{product.name}</span>
                        <span className="text-xs text-muted-foreground">{cat?.icon} {subCat?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                          {totalStock} / {product.minStock} {product.unit}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
              {lowStockProducts.length > 4 && (
                <p className="text-xs text-orange-600">
                  +{lowStockProducts.length - 4} autre{lowStockProducts.length - 4 > 1 ? "s" : ""} produit{lowStockProducts.length - 4 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {expiringBatches.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100">
              <AlertTriangleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-red-900">Expiration Proche</h3>
                <p className="text-sm text-red-700">
                  {expiringBatches.length} lot{expiringBatches.length > 1 ? "s" : ""} expire{expiringBatches.length > 1 ? "nt" : ""} dans 30 jours
                </p>
              </div>
              <div className="space-y-2">
                {expiringBatches.slice(0, 4).map((batch) => {
                  const daysUntilExpiry = Math.ceil(
                    (new Date(batch.expirationDate || batch.receivedDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  )
                  return (
                    <div key={batch.id} className="flex items-center justify-between rounded-md bg-white p-2 text-sm shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">Lot: {batch.batchNumber}</span>
                        <span className="text-xs text-muted-foreground">{batch.quantity} unites restantes</span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`gap-1 text-xs ${
                          daysUntilExpiry <= 7 
                            ? "bg-red-100 text-red-700 border-red-300" 
                            : "bg-orange-100 text-orange-700 border-orange-300"
                        }`}
                      >
                        <CalendarIcon className="h-3 w-3" />
                        {daysUntilExpiry <= 0 ? "Expire!" : `${daysUntilExpiry}j`}
                      </Badge>
                    </div>
                  )
                })}
              </div>
              {expiringBatches.length > 4 && (
                <p className="text-xs text-red-600">
                  +{expiringBatches.length - 4} autre{expiringBatches.length - 4 > 1 ? "s" : ""} lot{expiringBatches.length - 4 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
      </div>
    </div>
  )
}
