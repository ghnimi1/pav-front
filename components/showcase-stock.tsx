"use client"

import { useState } from "react"
import { useProduction } from "@/contexts/production-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  SearchIcon, 
  PackageIcon,
  ClockIcon,
  AlertTriangleIcon,
  ArrowRightLeftIcon,
  GlassWaterIcon,
  CalendarIcon,
  TrendingDownIcon,
  XCircleIcon,
  CheckCircleIcon
} from "lucide-react"
import type { ShowcaseItem } from "@/contexts/production-context"

export function ShowcaseStock() {
  const { 
    recipes,
    recipeCategories,
    showcases,
    showcaseItems,
    getAvailableItems,
    getExpiringItems,
    getLowStockItems,
    transferItem,
    updateShowcaseItem,
    deleteShowcaseItem
  } = useProduction()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedShowcase, setSelectedShowcase] = useState<string>("all")
  const [selectedTab, setSelectedTab] = useState<"all" | "expiring" | "low">("all")
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ShowcaseItem | null>(null)
  const [transferForm, setTransferForm] = useState({ targetShowcaseId: "", quantity: 1 })
  
  // Get items based on selected tab
  const getItems = () => {
    switch (selectedTab) {
      case "expiring":
        return getExpiringItems(4)
      case "low":
        return getLowStockItems()
      default:
        return getAvailableItems(selectedShowcase === "all" ? undefined : selectedShowcase)
    }
  }
  
  const items = getItems().filter(item => {
    const recipe = recipes?.find(r => r.id === item.recipeId)
    return recipe?.name.toLowerCase().includes(searchTerm.toLowerCase())
  })
  
  // Stats
  const totalItems = showcaseItems?.filter(i => i.quantity > 0).length || 0
  const totalQuantity = showcaseItems?.reduce((sum, i) => sum + i.quantity, 0) || 0
  const expiringCount = getExpiringItems(4).length
  const lowStockCount = getLowStockItems().length
  
  const getRecipeName = (recipeId: string) => {
    return recipes?.find(r => r.id === recipeId)?.name || "Produit inconnu"
  }
  
  const getRecipeCategory = (recipeId: string) => {
    const recipe = recipes?.find(r => r.id === recipeId)
    const cat = recipeCategories?.find(c => c.id === recipe?.categoryId)
    return cat
  }
  
  const getShowcaseName = (showcaseId: string) => {
    return showcases?.find(s => s.id === showcaseId)?.name || "Vitrine inconnue"
  }
  
  const formatTime = (date: string, time: string) => {
    const d = new Date(`${date}T${time}`)
    return d.toLocaleString("fr-FR", { 
      day: "2-digit", 
      month: "2-digit", 
      hour: "2-digit", 
      minute: "2-digit" 
    })
  }
  
  const getExpirationStatus = (item: ShowcaseItem) => {
    const now = new Date()
    const expDate = new Date(`${item.expirationDate}T${item.expirationTime}`)
    const hoursLeft = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (hoursLeft <= 0) return { status: "expired", label: "Expire", color: "bg-red-100 text-red-800" }
    if (hoursLeft <= 2) return { status: "critical", label: `${Math.ceil(hoursLeft)}h`, color: "bg-red-100 text-red-800" }
    if (hoursLeft <= 4) return { status: "warning", label: `${Math.ceil(hoursLeft)}h`, color: "bg-amber-100 text-amber-800" }
    return { status: "ok", label: `${Math.ceil(hoursLeft)}h`, color: "bg-green-100 text-green-800" }
  }
  
  const openTransferDialog = (item: ShowcaseItem) => {
    setSelectedItem(item)
    setTransferForm({ targetShowcaseId: "", quantity: Math.min(1, item.quantity) })
    setTransferDialogOpen(true)
  }
  
  const handleTransfer = async () => {
    if (!selectedItem || !transferForm.targetShowcaseId) return
    
    await transferItem(selectedItem.id, transferForm.targetShowcaseId, transferForm.quantity)
    setTransferDialogOpen(false)
    setSelectedItem(null)
  }
  
  const handleMarkExpired = async (itemId: string) => {
    if (confirm("Marquer ce lot comme expire et le retirer du stock?")) {
      await updateShowcaseItem(itemId, { quantity: 0, status: "expired" })
    }
  }
  
  const ItemCard = ({ item }: { item: ShowcaseItem }) => {
    const cat = getRecipeCategory(item.recipeId)
    const expStatus = getExpirationStatus(item)
    const occupancy = item.initialQuantity > 0 ? (item.quantity / item.initialQuantity) * 100 : 100
    
    return (
      <Card className={`${expStatus.status === "expired" ? 'opacity-50' : ''}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{getRecipeName(item.recipeId)}</h3>
              {cat && (
                <Badge className={cat.color} variant="outline">{cat.icon} {cat.name}</Badge>
              )}
            </div>
            <Badge className={expStatus.color}>
              <ClockIcon className="h-3 w-3 mr-1" />
              {expStatus.label}
            </Badge>
          </div>
          
          {/* Quantity bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{item.quantity} unites</span>
              <span className="text-muted-foreground">sur {item.initialQuantity}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  occupancy > 50 ? 'bg-green-500' : occupancy > 20 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${occupancy}%` }}
              />
            </div>
          </div>
          
          {/* Info */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <GlassWaterIcon className="h-4 w-4" />
              <span>{getShowcaseName(item.showcaseId)}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{new Date(item.productionDate).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
          
          <div className="text-sm">
            <span className="text-muted-foreground">Lot: </span>
            <span className="font-mono text-xs">{item.batchNumber}</span>
          </div>
          
          {/* Pricing */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cout: {item.unitCost.toFixed(2)} TND</span>
            <span className="font-medium text-green-600">Vente: {item.sellingPrice.toFixed(2)} TND</span>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => openTransferDialog(item)}
              disabled={item.quantity === 0}
            >
              <ArrowRightLeftIcon className="h-4 w-4 mr-1" />
              Transferer
            </Button>
            {expStatus.status !== "ok" && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleMarkExpired(item.id)}
              >
                <XCircleIcon className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <PackageIcon className="h-8 w-8 text-amber-600" />
            Stock Vitrine
          </h1>
          <p className="text-muted-foreground">Produits finis disponibles a la vente</p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <PackageIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lots en Stock</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <CheckCircleIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unites Totales</p>
                <p className="text-2xl font-bold">{totalQuantity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={expiringCount > 0 ? 'border-amber-300' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${expiringCount > 0 ? 'bg-amber-100' : 'bg-gray-100'}`}>
                <AlertTriangleIcon className={`h-5 w-5 ${expiringCount > 0 ? 'text-amber-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expiration Proche</p>
                <p className={`text-2xl font-bold ${expiringCount > 0 ? 'text-amber-600' : ''}`}>{expiringCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? 'border-red-300' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${lowStockCount > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                <TrendingDownIcon className={`h-5 w-5 ${lowStockCount > 0 ? 'text-red-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Stock Bas</p>
                <p className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-red-600' : ''}`}>{lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedShowcase} onValueChange={setSelectedShowcase}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Vitrine" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les vitrines</SelectItem>
            {(showcases || []).map(s => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="expiring" className={expiringCount > 0 ? 'text-amber-600' : ''}>
            Expiration proche ({expiringCount})
          </TabsTrigger>
          <TabsTrigger value="low" className={lowStockCount > 0 ? 'text-red-600' : ''}>
            Stock bas ({lowStockCount})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={selectedTab} className="mt-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <PackageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {selectedTab === "expiring" 
                  ? "Aucun produit proche de l'expiration" 
                  : selectedTab === "low" 
                    ? "Aucun stock bas detecte"
                    : "Aucun produit en vitrine"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map(item => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Transfer Dialog */}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeftIcon className="h-5 w-5 text-amber-600" />
              Transferer vers une autre vitrine
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">{getRecipeName(selectedItem.recipeId)}</p>
                <p className="text-sm text-muted-foreground">
                  De: {getShowcaseName(selectedItem.showcaseId)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Quantite disponible: {selectedItem.quantity} unites
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Vitrine de destination *</Label>
                <Select 
                  value={transferForm.targetShowcaseId || undefined} 
                  onValueChange={(v) => setTransferForm({ ...transferForm, targetShowcaseId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {(showcases || [])
                      .filter(s => s.id !== selectedItem.showcaseId && s.isActive)
                      .map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Quantite a transferer</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedItem.quantity}
                  value={transferForm.quantity}
                  onChange={(e) => setTransferForm({ 
                    ...transferForm, 
                    quantity: Math.min(parseInt(e.target.value) || 1, selectedItem.quantity) 
                  })}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialogOpen(false)}>Annuler</Button>
            <Button 
              onClick={handleTransfer} 
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!transferForm.targetShowcaseId}
            >
              Transferer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
