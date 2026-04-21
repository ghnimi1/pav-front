"use client"

import { useState, useMemo } from "react"
import { useProduction } from "@/contexts/production-context"
import { useLoyalty } from "@/contexts/loyalty-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  SearchIcon, 
  PlusIcon,
  MinusIcon,
  TrashIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  BanknoteIcon,
  SmartphoneIcon,
  WalletIcon,
  UserIcon,
  GiftIcon,
  PercentIcon,
  CheckCircleIcon,
  XIcon,
  ReceiptIcon,
  ClockIcon,
  StarIcon
} from "lucide-react"
import type { Sale, ShowcaseItem } from "@/contexts/production-context"

interface CartItem {
  showcaseItemId: string
  recipeId: string
  recipeName: string
  quantity: number
  maxQuantity: number
  unitPrice: number
}

export function SalesPOS() {
  const { 
    recipes,
    recipeCategories,
    showcases,
    getAvailableItems,
    processSale,
    getTodaySales,
    getSalesStats
  } = useProduction()
  
  const { clients, addPoints, usePoints } = useLoyalty()
  
  const [selectedShowcase, setSelectedShowcase] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed")
  const [pointsToUse, setPointsToUse] = useState(0)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [lastSale, setLastSale] = useState<Sale | null>(null)
  
  // Get available items (FIFO sorted)
  const availableItems = useMemo(() => {
    return getAvailableItems(selectedShowcase === "all" ? undefined : selectedShowcase)
  }, [getAvailableItems, selectedShowcase])
  
  // Group items by recipe for display
  const groupedItems = useMemo(() => {
    const groups: Record<string, { recipe: typeof recipes[0]; items: typeof availableItems; totalQuantity: number }> = {}
    
    for (const item of availableItems) {
      const recipe = recipes?.find(r => r.id === item.recipeId)
      if (!recipe) continue
      
      if (!groups[recipe.id]) {
        groups[recipe.id] = { recipe, items: [], totalQuantity: 0 }
      }
      groups[recipe.id].items.push(item)
      groups[recipe.id].totalQuantity += item.quantity
    }
    
    return Object.values(groups).filter(g => 
      g.recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [availableItems, recipes, searchTerm])
  
  // Today's stats
  const todaySales = getTodaySales()
  const todayStats = getSalesStats(new Date().toISOString().split("T")[0])
  
  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const discountAmount = discountType === "percentage" ? subtotal * (discount / 100) : discount
  const pointsDiscount = pointsToUse * 0.01
  const total = Math.max(0, subtotal - discountAmount - pointsDiscount)
  
  // Selected client info
  const client = clients?.find(c => c.id === selectedClient)
  const maxPointsToUse = client ? Math.min(client.points, Math.floor(subtotal * 100)) : 0
  
  const addToCart = (recipeId: string) => {
    // Find the first available item for this recipe (FIFO)
    const recipeItems = availableItems.filter(i => i.recipeId === recipeId)
    if (recipeItems.length === 0) return
    
    const recipe = recipes?.find(r => r.id === recipeId)
    if (!recipe) return
    
    // Check total available quantity
    const totalAvailable = recipeItems.reduce((sum, i) => sum + i.quantity, 0)
    const existingCartItem = cart.find(c => c.recipeId === recipeId)
    const currentInCart = existingCartItem?.quantity || 0
    
    if (currentInCart >= totalAvailable) return
    
    if (existingCartItem) {
      setCart(prev => prev.map(item => 
        item.recipeId === recipeId 
          ? { ...item, quantity: item.quantity + 1, maxQuantity: totalAvailable }
          : item
      ))
    } else {
      // Use the first item (FIFO)
      const firstItem = recipeItems[0]
      setCart(prev => [...prev, {
        showcaseItemId: firstItem.id,
        recipeId,
        recipeName: recipe.name,
        quantity: 1,
        maxQuantity: totalAvailable,
        unitPrice: firstItem.sellingPrice,
      }])
    }
  }
  
  const updateCartQuantity = (recipeId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.recipeId !== recipeId) return item
      
      const newQuantity = item.quantity + delta
      if (newQuantity <= 0) return item
      if (newQuantity > item.maxQuantity) return item
      
      return { ...item, quantity: newQuantity }
    }))
  }
  
  const removeFromCart = (recipeId: string) => {
    setCart(prev => prev.filter(item => item.recipeId !== recipeId))
  }
  
  const clearCart = () => {
    setCart([])
    setSelectedClient("")
    setDiscount(0)
    setPointsToUse(0)
  }
  
  const handlePayment = (paymentMethod: Sale["paymentMethod"]) => {
    if (cart.length === 0) return
    
    // Build items for processSale - need to distribute quantities across showcase items (FIFO)
    const saleItems: { showcaseItemId: string; quantity: number }[] = []
    
    for (const cartItem of cart) {
      let remaining = cartItem.quantity
      const recipeItems = availableItems.filter(i => i.recipeId === cartItem.recipeId)
      
      for (const showcaseItem of recipeItems) {
        if (remaining <= 0) break
        
        const toTake = Math.min(remaining, showcaseItem.quantity)
        saleItems.push({ showcaseItemId: showcaseItem.id, quantity: toTake })
        remaining -= toTake
      }
    }
    
    const sale = processSale(
      saleItems,
      paymentMethod,
      selectedClient || undefined,
      discount,
      discountType,
      pointsToUse
    )
    
    if (sale) {
      // Update client loyalty points
      if (selectedClient && sale.pointsEarned) {
        addPoints?.(selectedClient, sale.pointsEarned, "Achat en boutique", sale.id)
      }
      if (selectedClient && pointsToUse > 0) {
        usePoints?.(selectedClient, pointsToUse, "Utilisation points", sale.id)
      }
      
      setLastSale(sale)
      setPaymentDialogOpen(false)
      setReceiptDialogOpen(true)
      clearCart()
    }
  }
  
  const getCategoryColor = (categoryId: string) => {
    const cat = recipeCategories?.find(c => c.id === categoryId)
    return cat?.color || "bg-gray-100 text-gray-800"
  }
  
  const getCategoryIcon = (categoryId: string) => {
    const cat = recipeCategories?.find(c => c.id === categoryId)
    return cat?.icon || "?"
  }
  
  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <ReceiptIcon className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">Ventes aujourd&apos;hui</p>
                <p className="font-bold">{todaySales.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <BanknoteIcon className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">CA du jour</p>
                <p className="font-bold">{todayStats.totalRevenue.toFixed(2)} TND</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <ShoppingCartIcon className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">Panier moyen</p>
                <p className="font-bold">{todayStats.averageTicket.toFixed(2)} TND</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-xs text-muted-foreground">Heure</p>
                <p className="font-bold">{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Search and Filter */}
        <div className="flex gap-3">
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
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Vitrine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les vitrines</SelectItem>
              {(showcases || []).filter(s => s.isActive).map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Products Grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pr-4">
            {groupedItems.map(({ recipe, totalQuantity }) => (
              <Card 
                key={recipe.id} 
                className={`cursor-pointer hover:border-amber-300 transition-colors ${totalQuantity === 0 ? 'opacity-50' : ''}`}
                onClick={() => totalQuantity > 0 && addToCart(recipe.id)}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{getCategoryIcon(recipe.categoryId)}</span>
                    <Badge variant="outline" className={totalQuantity <= 3 ? 'bg-red-50 text-red-700' : ''}>
                      {totalQuantity}
                    </Badge>
                  </div>
                  <h3 className="font-medium text-sm line-clamp-2">{recipe.name}</h3>
                  <p className="text-lg font-bold text-amber-600">{recipe.sellingPrice.toFixed(2)} TND</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {groupedItems.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCartIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun produit disponible</p>
            </div>
          )}
        </ScrollArea>
      </div>
      
      {/* Right Panel - Cart */}
      <Card className="w-96 flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCartIcon className="h-5 w-5 text-amber-600" />
            Panier
            {cart.length > 0 && (
              <Badge variant="secondary">{cart.reduce((s, i) => s + i.quantity, 0)} articles</Badge>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-4 pt-0">
          {/* Cart Items */}
          <ScrollArea className="flex-1 -mx-4 px-4">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Panier vide</p>
                <p className="text-sm">Cliquez sur un produit pour l&apos;ajouter</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.recipeId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.recipeName}</p>
                      <p className="text-sm text-amber-600">{item.unitPrice.toFixed(2)} TND</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => updateCartQuantity(item.recipeId, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <MinusIcon className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => updateCartQuantity(item.recipeId, 1)}
                        disabled={item.quantity >= item.maxQuantity}
                      >
                        <PlusIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="w-16 text-right font-medium">
                      {(item.unitPrice * item.quantity).toFixed(2)}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => removeFromCart(item.recipeId)}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <Separator className="my-3" />
          
          {/* Client Selection */}
          <div className="space-y-2 mb-3">
            <Label className="text-xs">Client fidelite</Label>
            <Select value={selectedClient || "anonymous"} onValueChange={(v) => setSelectedClient(v === "anonymous" ? "" : v)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Client anonyme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="anonymous">Client anonyme</SelectItem>
                {(clients || []).map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-3 w-3" />
                      {c.name} ({c.points} pts)
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {client && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <StarIcon className="h-3 w-3 text-amber-500" />
                <span>{client.tier} - {client.points} points disponibles</span>
              </div>
            )}
          </div>
          
          {/* Discount */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="space-y-1">
              <Label className="text-xs">Remise</Label>
              <div className="flex">
                <Input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="h-9 rounded-r-none"
                />
                <Select value={discountType} onValueChange={(v: "fixed" | "percentage") => setDiscountType(v)}>
                  <SelectTrigger className="h-9 w-16 rounded-l-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">TND</SelectItem>
                    <SelectItem value="percentage">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {client && (
              <div className="space-y-1">
                <Label className="text-xs">Utiliser points</Label>
                <Input
                  type="number"
                  min="0"
                  max={maxPointsToUse}
                  value={pointsToUse}
                  onChange={(e) => setPointsToUse(Math.min(parseInt(e.target.value) || 0, maxPointsToUse))}
                  className="h-9"
                />
              </div>
            )}
          </div>
          
          {/* Totals */}
          <div className="space-y-1 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{subtotal.toFixed(2)} TND</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Remise</span>
                <span>-{discountAmount.toFixed(2)} TND</span>
              </div>
            )}
            {pointsDiscount > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Points ({pointsToUse} pts)</span>
                <span>-{pointsDiscount.toFixed(2)} TND</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-amber-600">{total.toFixed(2)} TND</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={clearCart} disabled={cart.length === 0}>
              Annuler
            </Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => setPaymentDialogOpen(true)}
              disabled={cart.length === 0}
            >
              Payer
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choisir le mode de paiement</DialogTitle>
          </DialogHeader>
          
          <div className="text-center mb-4">
            <p className="text-3xl font-bold text-amber-600">{total.toFixed(2)} TND</p>
            <p className="text-sm text-muted-foreground">{cart.reduce((s, i) => s + i.quantity, 0)} articles</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => handlePayment("cash")}
            >
              <BanknoteIcon className="h-8 w-8 text-green-600" />
              <span>Especes</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => handlePayment("card")}
            >
              <CreditCardIcon className="h-8 w-8 text-blue-600" />
              <span>Carte</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => handlePayment("mobile")}
            >
              <SmartphoneIcon className="h-8 w-8 text-purple-600" />
              <span>Mobile</span>
            </Button>
            {client && (
              <Button 
                variant="outline" 
                className="h-20 flex-col gap-2"
                onClick={() => handlePayment("wallet")}
              >
                <WalletIcon className="h-8 w-8 text-amber-600" />
                <span>Portefeuille</span>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircleIcon className="h-5 w-5" />
              Vente enregistree
            </DialogTitle>
          </DialogHeader>
          
          {lastSale && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{lastSale.total.toFixed(2)} TND</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(lastSale.createdAt).toLocaleString("fr-FR")}
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                {lastSale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.quantity}x {item.recipeName}</span>
                    <span>{item.total.toFixed(2)} TND</span>
                  </div>
                ))}
              </div>
              
              {lastSale.pointsEarned && lastSale.pointsEarned > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                  <GiftIcon className="h-5 w-5 text-amber-600" />
                  <span className="text-sm">
                    <strong>{lastSale.pointsEarned}</strong> points fidélité gagnes!
                  </span>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setReceiptDialogOpen(false)} className="w-full bg-amber-600 hover:bg-amber-700">
              Nouvelle vente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
