"use client"

import { useState, useMemo } from "react"
import { useUnifiedSales, type UnifiedSale, type UnifiedSaleItem } from "@/contexts/unified-sales-context"
import { useOrders } from "@/contexts/orders-context"
import { useProduction } from "@/contexts/production-context"
import { useBreakfast } from "@/contexts/breakfast-context"
import { useLoyalty } from "@/contexts/loyalty-context"
import { useStock } from "@/contexts/stock-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SalesDashboard } from "./sales-dashboard"
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
  StarIcon,
  RefreshCwIcon,
  DownloadIcon,
  FilterIcon,
  CalendarIcon,
  TrendingUpIcon,
  BarChart3Icon,
  ListIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PackageIcon,
  CoffeeIcon,
  UtensilsCrossedIcon,
  HashIcon,
  XCircleIcon,
  CheckIcon,
  PlayIcon,
  AlertCircleIcon,
} from "lucide-react"

interface CartItem {
  id: string
  productId: string
  productType: "showcase" | "menu" | "breakfast"
  name: string
  quantity: number
  maxQuantity: number
  unitPrice: number
  categoryId?: string
  recipeId?: string
}

type ManagedOrder = {
  id: string
  orderNumber: string
  sourceType: "unified" | "remote"
  type: "counter" | "breakfast" | "delivery" | "pickup" | "table"
  status: "pending" | "confirmed" | "preparing" | "ready" | "delivering" | "completed" | "cancelled"
  paymentMethod: string
  total: number
  subtotal: number
  discount: number
  deliveryFee: number
  createdAt: string
  clientId?: string
  clientEmail?: string
  clientName?: string
  tableNumber?: string
  pointsEarned: number
  customerNote?: string
  items: { quantity: number; name: string; total: number }[]
}

const ITEMS_PER_PAGE = 15

export function UnifiedSalesManagement() {
  const {
    sales,
    addSale,
    updateSale,
    completeSale,
    cancelSale,
    confirmSale,
    startPreparing,
    markReady,
    getSalesByDate,
    getActiveSales,
    getPendingSales,
    getTodayStats,
    exportToExcel,
    todaySalesCount,
    todayRevenue,
  } = useUnifiedSales()
  const {
    orders: remoteOrders,
    updateOrderStatus,
    cancelOrder: cancelRemoteOrder,
  } = useOrders()

  const { recipes, recipeCategories, showcases, getAvailableItems, decrementShowcaseStock } = useProduction()
  const { items: breakfastItems, categories: breakfastCategories } = useBreakfast()
  const { clients, addPoints, getClientById, getClientByEmail, updateClient } = useLoyalty()
  const { menuItems, menuCategories } = useStock()

  // Main tab state
  const [activeTab, setActiveTab] = useState<"pos" | "orders" | "dashboard">("pos")

  // POS State
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed")
  const [pointsToUse, setPointsToUse] = useState(0)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false)
  const [lastSale, setLastSale] = useState<UnifiedSale | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [productSource, setProductSource] = useState<"all" | "showcase" | "menu" | "breakfast">("all")
  const [saleType, setSaleType] = useState<UnifiedSale["type"]>("counter")
  const [tableNumber, setTableNumber] = useState("")
  
  // Orders State
  const [orderSearchQuery, setOrderSearchQuery] = useState("")
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | "active" | "completed" | "cancelled">("active")
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month" | "all">("today")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<ManagedOrder | null>(null)
  const [orderDetailOpen, setOrderDetailOpen] = useState(false)

  // Available products from all sources
  const availableProducts = useMemo(() => {
    const products: CartItem[] = []

    // Showcase items (FIFO)
    if (productSource === "all" || productSource === "showcase") {
      const showcaseItems = getAvailableItems()
      const groupedByRecipe: Record<string, { items: typeof showcaseItems; recipe: typeof recipes[0] }> = {}
      
      for (const item of showcaseItems) {
        const recipe = recipes?.find(r => r.id === item.recipeId)
        if (!recipe) continue
        
        if (!groupedByRecipe[recipe.id]) {
          groupedByRecipe[recipe.id] = { items: [], recipe }
        }
        groupedByRecipe[recipe.id].items.push(item)
      }
      
      Object.values(groupedByRecipe).forEach(({ items, recipe }) => {
        const totalQty = items.reduce((sum, i) => sum + i.quantity, 0)
        products.push({
          id: `showcase-${recipe.id}`,
          productId: items[0].id,
          productType: "showcase",
          name: recipe.name,
          quantity: 0,
          maxQuantity: totalQty,
          unitPrice: items[0].sellingPrice,
          categoryId: recipe.categoryId,
          recipeId: recipe.id,
        })
      })
    }

    // Menu items
    if (productSource === "all" || productSource === "menu") {
      menuItems?.filter(m => m.isAvailable).forEach(item => {
        products.push({
          id: `menu-${item.id}`,
          productId: item.id,
          productType: "menu",
          name: item.name,
          quantity: 0,
          maxQuantity: 999,
          unitPrice: item.price,
          categoryId: item.category,
        })
      })
    }

    // Breakfast items
    if (productSource === "all" || productSource === "breakfast") {
      breakfastItems?.filter(b => b.isAvailable).forEach(item => {
        products.push({
          id: `breakfast-${item.id}`,
          productId: item.id,
          productType: "breakfast",
          name: item.name,
          quantity: 0,
          maxQuantity: 999,
          unitPrice: item.price,
          categoryId: item.categoryId,
        })
      })
    }

    // Filter by search and category
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [productSource, getAvailableItems, recipes, menuItems, breakfastItems, searchTerm, selectedCategory])

  // All categories combined
  const allCategories = useMemo(() => {
    const cats: { id: string; name: string; source: string }[] = []
    
    recipeCategories?.forEach(c => cats.push({ id: c.id, name: c.name, source: "Vitrine" }))
    menuCategories?.forEach(c => cats.push({ id: c.slug, name: c.name, source: "Menu" }))
    breakfastCategories?.forEach(c => cats.push({ id: c.id, name: c.name, source: "P.Dej" }))
    
    return cats
  }, [recipeCategories, menuCategories, breakfastCategories])

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const discountAmount = discountType === "percentage" ? subtotal * (discount / 100) : discount
  const pointsDiscount = pointsToUse * 0.01
  const total = Math.max(0, subtotal - discountAmount - pointsDiscount)
  const pointsToEarn = Math.floor(total)

  // Selected client (handle "anonymous" as no client)
  const client = selectedClient && selectedClient !== "anonymous" ? clients?.find(c => c.id === selectedClient) : undefined
  const maxPointsToUse = client ? Math.min(client.points, Math.floor(subtotal * 100)) : 0

  // Today stats
  const todayStats = getTodayStats()

  // Filtered orders
  const combinedOrders = useMemo<ManagedOrder[]>(() => {
    const unifiedOrders: ManagedOrder[] = sales.map((sale) => ({
      id: sale.id,
      orderNumber: sale.saleNumber,
      sourceType: "unified",
      type: sale.type,
      status: sale.status,
      paymentMethod: sale.paymentMethod,
      total: sale.total,
      subtotal: sale.subtotal,
      discount: sale.discount,
      deliveryFee: sale.deliveryFee,
      createdAt: sale.createdAt,
      clientId: sale.clientId,
      clientEmail: sale.clientEmail,
      clientName: sale.clientName,
      tableNumber: sale.tableNumber,
      pointsEarned: sale.pointsEarned,
      customerNote: sale.customerNote,
      items: sale.items.map((item) => ({
        quantity: item.quantity,
        name: item.name,
        total: item.total,
      })),
    }))

    const normalizedRemoteOrders: ManagedOrder[] = remoteOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      sourceType: "remote",
      type: order.deliveryMode === "delivery" ? "delivery" : "pickup",
      status: order.status === "new" ? "pending" : order.status,
      paymentMethod: order.paymentMethod,
      total: order.total,
      subtotal: order.subtotal,
      discount: 0,
      deliveryFee: order.deliveryFee,
      createdAt: order.createdAt,
      clientId: order.clientId,
      clientEmail: order.clientEmail,
      clientName: order.clientName,
      tableNumber: undefined,
      pointsEarned: order.totalPoints,
      customerNote: order.customerNote,
      items: order.items.map((item) => ({
        quantity: item.quantity,
        name: item.supplements?.length
          ? `${item.name} (+${item.supplements.map((supplement) => supplement.name).join(", ")})`
          : item.name,
        total: (item.price + (item.supplements?.reduce((sum, supplement) => sum + supplement.price, 0) || 0)) * item.quantity,
      })),
    }))

    return [...unifiedOrders, ...normalizedRemoteOrders]
  }, [sales, remoteOrders])

  const filteredOrders = useMemo(() => {
    let filtered = [...combinedOrders]

    // Status filter
    if (orderStatusFilter === "active") {
      filtered = filtered.filter(s => ["pending", "confirmed", "preparing", "ready", "delivering"].includes(s.status))
    } else if (orderStatusFilter === "completed") {
      filtered = filtered.filter(s => s.status === "completed")
    } else if (orderStatusFilter === "cancelled") {
      filtered = filtered.filter(s => s.status === "cancelled")
    }

    // Date filter
    const now = new Date()
    if (dateFilter === "today") {
      filtered = filtered.filter(s => new Date(s.createdAt).toDateString() === now.toDateString())
    } else if (dateFilter === "week") {
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - 7)
      filtered = filtered.filter(s => new Date(s.createdAt) >= weekAgo)
    } else if (dateFilter === "month") {
      filtered = filtered.filter(s => {
        const d = new Date(s.createdAt)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
    }

    // Search filter
    if (orderSearchQuery) {
      const query = orderSearchQuery.toLowerCase()
      filtered = filtered.filter(s => 
        s.orderNumber.toLowerCase().includes(query) ||
        s.clientName?.toLowerCase().includes(query) ||
        s.items.some(i => i.name.toLowerCase().includes(query))
      )
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [combinedOrders, orderStatusFilter, dateFilter, orderSearchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // ============================================
  // POS FUNCTIONS
  // ============================================

  const addToCart = (product: CartItem) => {
    const existing = cart.find(c => c.id === product.id)
    
    if (existing) {
      if (existing.quantity >= product.maxQuantity) return
      setCart(prev => prev.map(c => 
        c.id === product.id ? { ...c, quantity: c.quantity + 1 } : c
      ))
    } else {
      setCart(prev => [...prev, { ...product, quantity: 1 }])
    }
  }

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id !== id) return item
      const newQty = item.quantity + delta
      if (newQty <= 0 || newQty > item.maxQuantity) return item
      return { ...item, quantity: newQty }
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(c => c.id !== id))
  }

  const clearCart = () => {
    setCart([])
    setDiscount(0)
    setPointsToUse(0)
    setSelectedClient("")
    setTableNumber("")
  }

  const processPOSSale = (paymentMethod: UnifiedSale["paymentMethod"]) => {
    if (cart.length === 0) return

    const saleItems: UnifiedSaleItem[] = cart.map(c => ({
      id: `item-${Date.now()}-${Math.random()}`,
      productId: c.productId,
      productType: c.productType,
      name: c.name,
      quantity: c.quantity,
      unitPrice: c.unitPrice,
      total: c.unitPrice * c.quantity,
      recipeId: c.recipeId,
      categoryId: c.categoryId,
    }))

    const newSale = addSale({
      type: saleType,
      source: "pos",
      items: saleItems,
      subtotal,
      discount: discountAmount,
      discountType,
      deliveryFee: 0,
      total,
      paymentMethod,
      paymentStatus: "paid",
      status: "completed",
      clientId: client?.id,
      clientEmail: client?.email,
      clientName: client?.name,
      pointsEarned: pointsToEarn,
      pointsUsed: pointsToUse,
      cashierId: "admin",
      cashierName: "Administrateur",
      tableNumber: tableNumber || undefined,
      completedAt: new Date().toISOString(),
    })

    // Add loyalty points
    if (client) {
      const loyaltyMetadata = {
        orderId: newSale.id,
        purchaseAmount: total,
        totalSpent: (client.totalSpent || 0) + total,
        totalOrdersIncrement: 1,
        lastVisit: new Date().toISOString(),
      }

      if (pointsToEarn > 0) {
        addPoints(client.id, pointsToEarn, "earn", `Achat ${newSale.saleNumber}`, loyaltyMetadata)
      } else {
        updateClient(client.id, {
          totalSpent: loyaltyMetadata.totalSpent,
          totalOrders: (client.totalOrders || 0) + 1,
          lastVisit: loyaltyMetadata.lastVisit,
        })
      }
    }

    setLastSale(newSale)
    setPaymentDialogOpen(false)
    setReceiptDialogOpen(true)
    clearCart()
  }

  // ============================================
  // ORDER FUNCTIONS
  // ============================================

  const handleOrderAction = async (sale: ManagedOrder, action: string) => {
    const applyOrderLoyalty = () => {
      const client = (sale.clientId && getClientById(sale.clientId)) || (sale.clientEmail && getClientByEmail(sale.clientEmail))
      if (!client) return

      const loyaltyMetadata = {
        orderId: sale.id,
        purchaseAmount: sale.total,
        totalSpent: (client.totalSpent || 0) + sale.total,
        totalOrdersIncrement: 1,
        lastVisit: new Date().toISOString(),
      }

      if (sale.pointsEarned > 0) {
        addPoints(client.id, sale.pointsEarned, "earn", `Commande ${sale.orderNumber}`, loyaltyMetadata)
      } else {
        updateClient(client.id, {
          totalSpent: loyaltyMetadata.totalSpent,
          totalOrders: (client.totalOrders || 0) + 1,
          lastVisit: loyaltyMetadata.lastVisit,
        })
      }
    }

    if (sale.sourceType === "remote") {
      switch (action) {
        case "confirm":
          await updateOrderStatus(sale.id, "confirmed")
          break
        case "prepare":
          await updateOrderStatus(sale.id, "preparing")
          break
        case "ready":
          await updateOrderStatus(sale.id, "ready")
          break
        case "complete":
          await updateOrderStatus(sale.id, "completed")
          applyOrderLoyalty()
          break
        case "cancel":
          await cancelRemoteOrder(sale.id)
          break
      }
      return
    }

    switch (action) {
      case "confirm":
        confirmSale(sale.id, decrementShowcaseStock)
        break
      case "prepare":
        startPreparing(sale.id)
        break
      case "ready":
        markReady(sale.id)
        break
      case "complete":
        completeSale(sale.id)
        applyOrderLoyalty()
        break
      case "cancel":
        cancelSale(sale.id)
        break
    }
  }

  const getStatusBadge = (status: ManagedOrder["status"]) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: "En attente", className: "bg-amber-100 text-amber-700 border-amber-200" },
      confirmed: { label: "Confirmee", className: "bg-blue-100 text-blue-700 border-blue-200" },
      preparing: { label: "En preparation", className: "bg-purple-100 text-purple-700 border-purple-200" },
      ready: { label: "Prete", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      delivering: { label: "En livraison", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
      completed: { label: "Terminee", className: "bg-stone-100 text-stone-600 border-stone-200" },
      cancelled: { label: "Annulee", className: "bg-red-100 text-red-700 border-red-200" },
    }
    const c = config[status] || config.pending
    return <Badge className={`${c.className} border`}>{c.label}</Badge>
  }

  const getTypeBadge = (type: ManagedOrder["type"]) => {
    const config: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
      counter: { label: "Comptoir", icon: <ShoppingCartIcon className="h-3 w-3" />, className: "bg-stone-100 text-stone-600" },
      breakfast: { label: "P.Dej", icon: <CoffeeIcon className="h-3 w-3" />, className: "bg-amber-100 text-amber-700" },
      table: { label: "Table", icon: <UtensilsCrossedIcon className="h-3 w-3" />, className: "bg-blue-100 text-blue-700" },
      delivery: { label: "Livraison", icon: <PackageIcon className="h-3 w-3" />, className: "bg-purple-100 text-purple-700" },
      pickup: { label: "Retrait", icon: <PackageIcon className="h-3 w-3" />, className: "bg-emerald-100 text-emerald-700" },
    }
    const c = config[type] || config.counter
    return (
      <Badge variant="outline" className={`${c.className} border-0 gap-1`}>
        {c.icon}
        {c.label}
      </Badge>
    )
  }

  const handleExport = () => {
    const dateStr = new Date().toISOString().split("T")[0]
    exportToExcel(
      filteredOrders
        .filter((order) => order.sourceType === "unified")
        .map((order) => sales.find((sale) => sale.id === order.id)!)
        .filter(Boolean),
      `ventes-${dateStr}`
    )
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShoppingCartIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-800">Ventes & Commandes</h1>
            <p className="text-sm text-muted-foreground">Gerez vos ventes et suivez vos commandes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <DownloadIcon className="h-4 w-4" />
            Exporter Excel
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
            <RefreshCwIcon className="h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">CA Aujourd&apos;hui</p>
                <p className="text-3xl font-bold">{todayRevenue.toFixed(2)}</p>
                <p className="text-emerald-100 text-sm">TND</p>
              </div>
              <TrendingUpIcon className="h-10 w-10 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Ventes</p>
                <p className="text-3xl font-bold text-stone-800">{todaySalesCount}</p>
                <p className="text-muted-foreground text-sm">aujourd&apos;hui</p>
              </div>
              <ReceiptIcon className="h-10 w-10 text-stone-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Panier Moyen</p>
                <p className="text-3xl font-bold text-stone-800">
                  {todayStats.averageBasket.toFixed(2)}
                </p>
                <p className="text-muted-foreground text-sm">TND</p>
              </div>
              <ShoppingCartIcon className="h-10 w-10 text-stone-300" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-700 text-sm">En attente</p>
                <p className="text-3xl font-bold text-amber-700">{combinedOrders.filter(o => o.status === "pending").length}</p>
                <p className="text-amber-600 text-sm">commandes</p>
              </div>
              <ClockIcon className="h-10 w-10 text-amber-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col">
        <TabsList className="w-fit mb-4">
          <TabsTrigger value="pos" className="gap-2">
            <ShoppingCartIcon className="h-4 w-4" />
            Caisse
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ListIcon className="h-4 w-4" />
            Commandes
            {combinedOrders.filter(o => o.status === "pending").length > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white">{combinedOrders.filter(o => o.status === "pending").length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3Icon className="h-4 w-4" />
            Tableau de Bord
          </TabsTrigger>
        </TabsList>

        {/* POS Tab */}
        <TabsContent value="pos" className="flex-1 mt-0">
          <div className="grid grid-cols-3 gap-6 h-[calc(100vh-380px)]">
            {/* Products Section */}
            <div className="col-span-2 flex flex-col">
              {/* Filters */}
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={productSource} onValueChange={(v) => setProductSource(v as typeof productSource)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les produits</SelectItem>
                    <SelectItem value="showcase">Vitrine</SelectItem>
                    <SelectItem value="menu">Menu</SelectItem>
                    <SelectItem value="breakfast">Petit-dejeuner</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes categories</SelectItem>
                    {allCategories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Products Grid */}
              <ScrollArea className="flex-1 pr-4">
                {availableProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <PackageIcon className="h-12 w-12 mx-auto text-stone-300 mb-3" />
                    <p className="font-medium text-stone-600">Aucun produit disponible</p>
                    <p className="text-sm text-muted-foreground">Modifiez vos filtres ou ajoutez des produits</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {availableProducts.map(product => {
                      const inCart = cart.find(c => c.id === product.id)
                      const isDisabled = product.productType === "showcase" && (inCart?.quantity || 0) >= product.maxQuantity

                      return (
                        <Card
                          key={product.id}
                          className={`cursor-pointer transition-all hover:shadow-md hover:border-amber-300 ${isDisabled ? 'opacity-50' : ''}`}
                          onClick={() => !isDisabled && addToCart(product)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{product.name}</h4>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {product.productType === "showcase" ? "Vitrine" : product.productType === "menu" ? "Menu" : "P.Dej"}
                                </Badge>
                              </div>
                              {inCart && (
                                <Badge className="bg-amber-500 text-white shrink-0">{inCart.quantity}</Badge>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-amber-600">{product.unitPrice.toFixed(2)} TND</span>
                              {product.productType === "showcase" && (
                                <span className="text-xs text-muted-foreground">Stock: {product.maxQuantity}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Cart Section */}
            <div className="flex flex-col bg-white rounded-2xl border-2 border-stone-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <ShoppingCartIcon className="h-5 w-5 text-amber-600" />
                  Panier
                </h3>
                {cart.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Vider
                  </Button>
                )}
              </div>

              {/* Sale Type */}
              <div className="mb-4">
                <Label className="text-xs text-muted-foreground mb-1 block">Type de vente</Label>
                <Select value={saleType} onValueChange={(v) => setSaleType(v as UnifiedSale["type"])}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="counter">Comptoir</SelectItem>
                    <SelectItem value="table">Sur place (Table)</SelectItem>
                    <SelectItem value="breakfast">Petit-dejeuner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {saleType === "table" && (
                <div className="mb-4">
                  <Label className="text-xs text-muted-foreground mb-1 block">Numero de table</Label>
                  <Input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex: T1, T2..."
                    className="h-9"
                  />
                </div>
              )}

              {/* Cart Items */}
              <ScrollArea className="flex-1 -mx-4 px-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShoppingCartIcon className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>Panier vide</p>
                    <p className="text-xs">Cliquez sur un produit pour l&apos;ajouter</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-stone-50 group">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.unitPrice.toFixed(2)} TND</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCartQuantity(item.id, -1)}
                          >
                            <MinusIcon className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateCartQuantity(item.id, 1)}
                            disabled={item.productType === "showcase" && item.quantity >= item.maxQuantity}
                          >
                            <PlusIcon className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="font-semibold text-sm w-16 text-right">
                          {(item.unitPrice * item.quantity).toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 text-red-500"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Separator className="my-4" />

              {/* Client & Discount */}
              <div className="space-y-3 mb-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Client fidelite</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Client anonyme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anonymous">Client anonyme</SelectItem>
                      {clients?.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.points} pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">Remise</Label>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="h-9"
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
                    <Select value={discountType} onValueChange={(v) => setDiscountType(v as typeof discountType)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">TND</SelectItem>
                        <SelectItem value="percentage">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {client && client.points > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      Utiliser points ({client.points} disponibles)
                    </Label>
                    <Input
                      type="number"
                      value={pointsToUse}
                      onChange={(e) => setPointsToUse(Math.min(maxPointsToUse, parseInt(e.target.value) || 0))}
                      max={maxPointsToUse}
                      className="h-9"
                    />
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{subtotal.toFixed(2)} TND</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Remise</span>
                    <span>-{discountAmount.toFixed(2)} TND</span>
                  </div>
                )}
                {pointsDiscount > 0 && (
                  <div className="flex justify-between text-amber-600">
                    <span>Points utilises</span>
                    <span>-{pointsDiscount.toFixed(2)} TND</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-amber-600">{total.toFixed(2)} TND</span>
                </div>
                {pointsToEarn > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span className="flex items-center gap-1">
                      <StarIcon className="h-3 w-3" />
                      Points a gagner
                    </span>
                    <span>+{pointsToEarn} pts</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  onClick={() => setPaymentDialogOpen(true)}
                  disabled={cart.length === 0}
                >
                  Payer
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="flex-1 mt-0">
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numero, client, article..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={orderStatusFilter} onValueChange={(v) => setOrderStatusFilter(v as typeof orderStatusFilter)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">En cours</SelectItem>
                <SelectItem value="completed">Terminees</SelectItem>
                <SelectItem value="cancelled">Annulees</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as typeof dateFilter)}>
              <SelectTrigger className="w-40">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="all">Tout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders List */}
          <Card>
            <CardContent className="p-0">
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <ReceiptIcon className="h-12 w-12 mx-auto text-stone-300 mb-3" />
                  <p className="font-medium text-stone-600">Aucune commande trouvee</p>
                  <p className="text-sm text-muted-foreground">Modifiez vos filtres pour voir plus de resultats</p>
                </div>
              ) : (
                <div className="divide-y">
                  {paginatedOrders.map(sale => (
                    <div
                      key={sale.id}
                      className="p-4 hover:bg-stone-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center">
                            <HashIcon className="h-5 w-5 text-stone-500" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{sale.orderNumber}</span>
                              {getTypeBadge(sale.type)}
                              {getStatusBadge(sale.status)}
                              {sale.sourceType === "remote" && (
                                <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Client</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(sale.createdAt).toLocaleDateString("fr-TN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                              {sale.clientName && ` - ${sale.clientName}`}
                              {sale.tableNumber && ` - Table ${sale.tableNumber}`}
                            </p>
                            <p className="text-sm text-stone-600 mt-1">
                              {sale.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-start gap-3">
                          <div>
                            <p className="text-xl font-bold text-amber-600">{sale.total.toFixed(2)} TND</p>
                            <p className="text-xs text-muted-foreground">
                              {sale.paymentMethod === "cash" ? "Especes" : sale.paymentMethod === "card" ? "Carte" : sale.paymentMethod === "mobile" ? "Mobile" : "Wallet"}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {sale.status === "pending" && (
                              <>
                                <Button size="sm" variant="outline" className="h-8 px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => void handleOrderAction(sale, "confirm")}>
                                  <CheckIcon className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 px-2 text-red-600 border-red-200 hover:bg-red-50" onClick={() => void handleOrderAction(sale, "cancel")}>
                                  <XIcon className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {sale.status === "confirmed" && (
                              <Button size="sm" variant="outline" className="h-8 px-2 text-purple-600 border-purple-200 hover:bg-purple-50" onClick={() => void handleOrderAction(sale, "prepare")}>
                                <PlayIcon className="h-4 w-4 mr-1" />
                                Preparer
                              </Button>
                            )}
                            {sale.status === "preparing" && (
                              <Button size="sm" variant="outline" className="h-8 px-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => void handleOrderAction(sale, "ready")}>
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Prete
                              </Button>
                            )}
                            {sale.status === "ready" && (
                              <Button size="sm" className="h-8 px-2 bg-emerald-500 hover:bg-emerald-600" onClick={() => void handleOrderAction(sale, "complete")}>
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Terminer
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2"
                              onClick={() => { setSelectedOrder(sale); setOrderDetailOpen(true) }}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {filteredOrders.length} commande(s) au total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} sur {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="flex-1 mt-0">
          <SalesDashboard />
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-amber-600" />
              Mode de paiement
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-3xl font-bold text-amber-600 mb-6">{total.toFixed(2)} TND</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:border-emerald-300 hover:bg-emerald-50"
                onClick={() => processPOSSale("cash")}
              >
                <BanknoteIcon className="h-8 w-8 text-emerald-600" />
                <span>Especes</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:border-blue-300 hover:bg-blue-50"
                onClick={() => processPOSSale("card")}
              >
                <CreditCardIcon className="h-8 w-8 text-blue-600" />
                <span>Carte</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:border-purple-300 hover:bg-purple-50"
                onClick={() => processPOSSale("mobile")}
              >
                <SmartphoneIcon className="h-8 w-8 text-purple-600" />
                <span>Mobile</span>
              </Button>
              <Button
                variant="outline"
                className="h-20 flex-col gap-2 hover:border-amber-300 hover:bg-amber-50"
                onClick={() => processPOSSale("wallet")}
              >
                <WalletIcon className="h-8 w-8 text-amber-600" />
                <span>Wallet</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              <CheckCircleIcon className="h-16 w-16 mx-auto text-emerald-500 mb-2" />
              Vente terminee!
            </DialogTitle>
          </DialogHeader>
          {lastSale && (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-2">Numero de vente</p>
              <p className="text-2xl font-bold mb-4">{lastSale.saleNumber}</p>
              <p className="text-4xl font-bold text-amber-600">{lastSale.total.toFixed(2)} TND</p>
              {lastSale.pointsEarned > 0 && (
                <p className="text-emerald-600 mt-2 flex items-center justify-center gap-1">
                  <StarIcon className="h-4 w-4" />
                  +{lastSale.pointsEarned} points de fidelite
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button className="w-full" onClick={() => setReceiptDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5 text-amber-600" />
              Details de la commande
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">{selectedOrder.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedOrder.createdAt).toLocaleDateString("fr-TN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {getTypeBadge(selectedOrder.type)}
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Articles</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-medium">{item.total.toFixed(2)} TND</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{selectedOrder.subtotal.toFixed(2)} TND</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Remise</span>
                    <span>-{selectedOrder.discount.toFixed(2)} TND</span>
                  </div>
                )}
                {selectedOrder.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Livraison</span>
                    <span>{selectedOrder.deliveryFee.toFixed(2)} TND</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Total</span>
                  <span className="text-amber-600">{selectedOrder.total.toFixed(2)} TND</span>
                </div>
              </div>

              {(selectedOrder.clientName || selectedOrder.tableNumber) && (
                <>
                  <Separator />
                  <div className="text-sm space-y-1">
                    {selectedOrder.clientName && (
                      <div className="flex items-center gap-2">
                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedOrder.clientName}</span>
                      </div>
                    )}
                    {selectedOrder.tableNumber && (
                      <div className="flex items-center gap-2">
                        <HashIcon className="h-4 w-4 text-muted-foreground" />
                        <span>Table {selectedOrder.tableNumber}</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrderDetailOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
