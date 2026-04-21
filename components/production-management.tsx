"use client"

import { useState } from "react"
import { useProduction } from "@/contexts/production-context"
import { useStock } from "@/contexts/stock-context"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  PlusIcon, 
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  ChefHatIcon,
  PackageIcon,
  CalendarIcon,
  ListOrderedIcon,
  FactoryIcon,
  ArrowRightIcon
} from "lucide-react"
import type { ProductionOrder } from "@/contexts/production-context"

export function ProductionManagement() {
  const { 
    recipes,
    recipeCategories,
    showcases,
    productionOrders,
    addProductionOrder,
    updateProductionOrder,
    deleteProductionOrder,
    startProduction,
    completeProduction,
    cancelProduction,
    checkIngredientAvailability,
    getRecipeCost
  } = useProduction()
  
  const { products } = useStock()
  const { currentEmployee } = useAuth()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTab, setSelectedTab] = useState<"planned" | "in-progress" | "completed">("planned")
  
  const [form, setForm] = useState({
    recipeId: "",
    showcaseId: "",
    quantity: 1,
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: "08:00",
    notes: "",
  })
  
  // Filter orders by status
  const plannedOrders = (productionOrders || []).filter(o => o.status === "planned")
  const inProgressOrders = (productionOrders || []).filter(o => o.status === "in-progress")
  const completedOrders = (productionOrders || []).filter(o => o.status === "completed")
  const todayOrders = (productionOrders || []).filter(o => 
    o.scheduledDate === new Date().toISOString().split("T")[0]
  )
  
  // Stats
  const totalPlanned = plannedOrders.length
  const totalInProgress = inProgressOrders.length
  const totalCompleted = completedOrders.length
  const todayPlanned = todayOrders.filter(o => o.status === "planned").length
  
  const resetForm = () => {
    setForm({
      recipeId: "",
      showcaseId: "",
      quantity: 1,
      scheduledDate: new Date().toISOString().split("T")[0],
      scheduledTime: "08:00",
      notes: "",
    })
  }
  
  const handleSubmit = () => {
    if (!form.recipeId || !form.showcaseId) return
    
    addProductionOrder({
      recipeId: form.recipeId,
      showcaseId: form.showcaseId,
      quantity: form.quantity,
      scheduledDate: form.scheduledDate,
      scheduledTime: form.scheduledTime,
      status: "planned",
      notes: form.notes,
    })
    
    setIsDialogOpen(false)
    resetForm()
  }
  
  const handleStart = (orderId: string) => {
    const order = productionOrders?.find(o => o.id === orderId)
    if (!order) return
    
    // Check ingredients
    const { available, missing } = checkIngredientAvailability(order.recipeId, order.quantity)
    
    if (!available) {
      const missingNames = missing.map(m => {
        const product = products?.find(p => p.id === m.productId)
        return `${product?.name || "?"}: ${m.needed.toFixed(2)} requis, ${m.available.toFixed(2)} disponible`
      }).join("\n")
      
      alert(`Ingredients insuffisants:\n\n${missingNames}`)
      return
    }
    
    const success = startProduction(orderId, currentEmployee?.id || "unknown")
    if (success) {
      setSelectedTab("in-progress")
    }
  }
  
  const handleComplete = (orderId: string) => {
    const success = completeProduction(orderId)
    if (success) {
      setSelectedTab("completed")
    }
  }
  
  const handleCancel = (orderId: string) => {
    if (confirm("Annuler cette production?")) {
      cancelProduction(orderId)
    }
  }
  
  const getRecipeName = (recipeId: string) => {
    return recipes?.find(r => r.id === recipeId)?.name || "Recette inconnue"
  }
  
  const getRecipeCategory = (recipeId: string) => {
    const recipe = recipes?.find(r => r.id === recipeId)
    const cat = recipeCategories?.find(c => c.id === recipe?.categoryId)
    return cat ? `${cat.icon} ${cat.name}` : ""
  }
  
  const getShowcaseName = (showcaseId: string) => {
    return showcases?.find(s => s.id === showcaseId)?.name || "Vitrine inconnue"
  }
  
  const getStatusBadge = (status: ProductionOrder["status"]) => {
    switch (status) {
      case "planned":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Planifie</Badge>
      case "in-progress":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">En cours</Badge>
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Termine</Badge>
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Annule</Badge>
    }
  }
  
  const OrderCard = ({ order }: { order: ProductionOrder }) => {
    const recipe = recipes?.find(r => r.id === order.recipeId)
    const { available } = checkIngredientAvailability(order.recipeId, order.quantity)
    const totalUnits = (recipe?.yield || 1) * order.quantity
    const totalCost = getRecipeCost(order.recipeId) * totalUnits
    
    return (
      <Card className={`${order.status === "cancelled" ? 'opacity-50' : ''}`}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{getRecipeName(order.recipeId)}</h3>
              <p className="text-sm text-muted-foreground">{getRecipeCategory(order.recipeId)}</p>
            </div>
            {getStatusBadge(order.status)}
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <PackageIcon className="h-4 w-4" />
              <span>{order.quantity} x {recipe?.yield || 1} = {totalUnits} {recipe?.yieldUnit}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>{new Date(order.scheduledDate).toLocaleDateString("fr-FR")}</span>
              {order.scheduledTime && <span>{order.scheduledTime}</span>}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <ArrowRightIcon className="h-4 w-4 text-amber-600" />
              {getShowcaseName(order.showcaseId)}
            </span>
            <span className="font-medium">{totalCost.toFixed(2)} TND</span>
          </div>
          
          {/* Availability indicator for planned orders */}
          {order.status === "planned" && (
            <div className={`flex items-center gap-1 text-sm ${available ? 'text-green-600' : 'text-red-600'}`}>
              {available ? (
                <>
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Ingredients disponibles</span>
                </>
              ) : (
                <>
                  <AlertTriangleIcon className="h-4 w-4" />
                  <span>Ingredients insuffisants</span>
                </>
              )}
            </div>
          )}
          
          {/* Time info for in-progress */}
          {order.status === "in-progress" && order.startedAt && (
            <div className="text-sm text-muted-foreground">
              <ClockIcon className="h-4 w-4 inline mr-1" />
              Debute a {new Date(order.startedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
          
          {/* Completed info */}
          {order.status === "completed" && order.completedAt && (
            <div className="text-sm text-green-600">
              <CheckCircleIcon className="h-4 w-4 inline mr-1" />
              Termine a {new Date(order.completedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
          
          {order.notes && (
            <p className="text-sm text-muted-foreground italic">"{order.notes}"</p>
          )}
          
          {/* Actions */}
          <div className="flex gap-2">
            {order.status === "planned" && (
              <>
                <Button 
                  size="sm" 
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleStart(order.id)}
                  disabled={!available}
                >
                  <PlayIcon className="h-4 w-4 mr-1" />
                  Demarrer
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleCancel(order.id)}
                >
                  <XCircleIcon className="h-4 w-4 text-red-600" />
                </Button>
              </>
            )}
            {order.status === "in-progress" && (
              <Button 
                size="sm" 
                className="flex-1 bg-amber-600 hover:bg-amber-700"
                onClick={() => handleComplete(order.id)}
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Terminer
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
            <FactoryIcon className="h-8 w-8 text-amber-600" />
            Production - Laboratoire
          </h1>
          <p className="text-muted-foreground">Planifiez et suivez vos productions</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="bg-amber-600 hover:bg-amber-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Nouvelle Production
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <ListOrderedIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Planifiees</p>
                <p className="text-2xl font-bold">{totalPlanned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <PlayIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{totalInProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Terminees</p>
                <p className="text-2xl font-bold">{totalCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aujourd&apos;hui</p>
                <p className="text-2xl font-bold">{todayPlanned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as typeof selectedTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="planned" className="gap-2">
            <ListOrderedIcon className="h-4 w-4" />
            Planifiees ({plannedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="gap-2">
            <PlayIcon className="h-4 w-4" />
            En cours ({inProgressOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircleIcon className="h-4 w-4" />
            Terminees ({completedOrders.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="planned" className="mt-4">
          {plannedOrders.length === 0 ? (
            <div className="text-center py-12">
              <ListOrderedIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune production planifiee</p>
              <Button variant="link" onClick={() => setIsDialogOpen(true)}>Planifier une production</Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plannedOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="in-progress" className="mt-4">
          {inProgressOrders.length === 0 ? (
            <div className="text-center py-12">
              <PlayIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune production en cours</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {inProgressOrders.map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-4">
          {completedOrders.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucune production terminee</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedOrders.slice(0, 12).map(order => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* New Production Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHatIcon className="h-5 w-5 text-amber-600" />
              Nouvelle Production
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Recette *</Label>
              <Select 
                value={form.recipeId || undefined} 
                onValueChange={(v) => setForm({ ...form, recipeId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner une recette" />
                </SelectTrigger>
                <SelectContent>
                  {(recipes || []).filter(r => r.isActive).map(recipe => {
                    const cat = recipeCategories?.find(c => c.id === recipe.categoryId)
                    return (
                      <SelectItem key={recipe.id} value={recipe.id}>
                        {cat?.icon} {recipe.name} ({recipe.yield} {recipe.yieldUnit})
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Vitrine de destination *</Label>
              <Select 
                value={form.showcaseId || undefined} 
                onValueChange={(v) => setForm({ ...form, showcaseId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner une vitrine" />
                </SelectTrigger>
                <SelectContent>
                  {(showcases || []).filter(s => s.isActive).map(showcase => (
                    <SelectItem key={showcase.id} value={showcase.id}>
                      {showcase.name} ({showcase.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Nombre de lots a produire *</Label>
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
              />
              {form.recipeId && (
                <p className="text-sm text-muted-foreground">
                  = {form.quantity * (recipes?.find(r => r.id === form.recipeId)?.yield || 1)} unites
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Heure</Label>
                <Input
                  type="time"
                  value={form.scheduledTime}
                  onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                />
              </div>
            </div>
            
            {/* Ingredient check */}
            {form.recipeId && (
              <div className={`p-3 rounded-lg ${
                checkIngredientAvailability(form.recipeId, form.quantity).available 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {checkIngredientAvailability(form.recipeId, form.quantity).available ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span>Tous les ingredients sont disponibles</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-red-700">
                      <AlertTriangleIcon className="h-5 w-5" />
                      <span>Ingredients insuffisants</span>
                    </div>
                    <ul className="text-sm text-red-600 ml-7">
                      {checkIngredientAvailability(form.recipeId, form.quantity).missing.map(m => {
                        const product = products?.find(p => p.id === m.productId)
                        return (
                          <li key={m.productId}>
                            {product?.name}: {m.available.toFixed(2)} disponible / {m.needed.toFixed(2)} requis
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Instructions speciales..."
                rows={2}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button 
              onClick={handleSubmit} 
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!form.recipeId || !form.showcaseId}
            >
              Planifier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
