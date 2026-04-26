"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  ArrowLeftIcon,
  SearchIcon,
  FilterIcon,
  RefreshCwIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  StoreIcon,
  PackageIcon,
  ChefHatIcon,
  PlayIcon,
  MoreVerticalIcon,
  PhoneIcon,
  MapPinIcon,
  UserIcon,
  CalendarIcon,
  CoinsIcon,
  BellIcon,
  SettingsIcon,
  EyeIcon,
  PrinterIcon,
  BanIcon,
  ChevronRightIcon,
  ListFilterIcon,
  LayoutGridIcon,
  ClipboardListIcon,
  HistoryIcon,
} from "lucide-react"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { OrdersProvider, useOrders, type RemoteOrder, type OrderStatus } from "@/contexts/orders-context"
import { LoyaltyProvider, useLoyalty } from "@/contexts/loyalty-context"
import { NotificationProvider, useNotification } from "@/contexts/notification-context"
import { NotificationContainer } from "@/components/notification-container"

// Status configuration
const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string; icon: React.ElementType }> = {
  new: { label: "Nouvelle", color: "text-blue-700", bgColor: "bg-blue-100", icon: BellIcon },
  confirmed: { label: "Confirmee", color: "text-purple-700", bgColor: "bg-purple-100", icon: CheckCircleIcon },
  preparing: { label: "En preparation", color: "text-amber-700", bgColor: "bg-amber-100", icon: ChefHatIcon },
  ready: { label: "Prete", color: "text-emerald-700", bgColor: "bg-emerald-100", icon: PackageIcon },
  delivering: { label: "En livraison", color: "text-cyan-700", bgColor: "bg-cyan-100", icon: TruckIcon },
  completed: { label: "Terminee", color: "text-stone-600", bgColor: "bg-stone-100", icon: CheckCircleIcon },
  cancelled: { label: "Annulee", color: "text-red-700", bgColor: "bg-red-100", icon: XCircleIcon },
}

// Next status mapping
const nextStatusMap: Partial<Record<OrderStatus, OrderStatus>> = {
  new: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "delivering",
  delivering: "completed",
}

function AdminOrdersContent() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { addNotification } = useNotification()
  const { addPoints, getClientByEmail, getClientById, updateClient, referrals, validateReferralFirstPurchase } = useLoyalty()
  const {
    orders,
    updateOrderStatus,
    cancelOrder,
    addStaffNote,
    deliveryConfig,
  } = useOrders()

  // State
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")
  const [selectedOrder, setSelectedOrder] = useState<RemoteOrder | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all")
  const [filterMode, setFilterMode] = useState<"all" | "delivery" | "pickup">("all")
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month" | "all">("today")

  // Filter orders
  const filteredOrders = useMemo(() => {
    let result = [...orders]

    // Date filter
    const now = new Date()
    if (dateFilter === "today") {
      result = result.filter(o => new Date(o.createdAt).toDateString() === now.toDateString())
    } else if (dateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      result = result.filter(o => new Date(o.createdAt) >= weekAgo)
    } else if (dateFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      result = result.filter(o => new Date(o.createdAt) >= monthAgo)
    }

    // Status filter
    if (filterStatus !== "all") {
      result = result.filter(o => o.status === filterStatus)
    }

    // Mode filter
    if (filterMode !== "all") {
      result = result.filter(o => o.deliveryMode === filterMode)
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(o =>
        o.orderNumber.toLowerCase().includes(query) ||
        o.clientName?.toLowerCase().includes(query) ||
        o.clientPhone?.includes(query)
      )
    }

    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, dateFilter, filterStatus, filterMode, searchQuery])

  // Check admin access
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Card className="p-8 text-center max-w-md">
          <BanIcon className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Acces refuse</h2>
          <p className="text-stone-500 mb-4">Vous devez etre administrateur pour acceder a cette page.</p>
          <Button onClick={() => router.push("/")} className="bg-amber-500 hover:bg-amber-600">
            Retour a l&apos;accueil
          </Button>
        </Card>
      </div>
    )
  }

  // Kanban columns
  const kanbanColumns = [
    { status: "new" as OrderStatus, title: "Nouvelles", color: "border-t-blue-500" },
    { status: "confirmed" as OrderStatus, title: "Confirmees", color: "border-t-purple-500" },
    { status: "preparing" as OrderStatus, title: "En preparation", color: "border-t-amber-500" },
    { status: "ready" as OrderStatus, title: "Pretes", color: "border-t-emerald-500" },
  ]

  // Handle status change
  const handleStatusChange = async (order: RemoteOrder, newStatus: OrderStatus) => {
    await updateOrderStatus(order.id, newStatus, user?.id)

    // Credit points when order is completed
    if (newStatus === "completed") {
      const client = (order.clientId && getClientById(order.clientId)) || (order.clientEmail && getClientByEmail(order.clientEmail))
      if (client) {
        const loyaltyMetadata = {
          orderId: order.id,
          totalSpent: (client.totalSpent || 0) + order.total,
          totalOrdersIncrement: 1,
          lastVisit: new Date().toISOString(),
        }

        if (order.totalPoints > 0) {
          addPoints(
            client.id,
            order.totalPoints,
            "earn",
            `Commande ${order.orderNumber}`,
            loyaltyMetadata
          )
        } else {
          updateClient(client.id, {
            totalSpent: loyaltyMetadata.totalSpent,
            totalOrders: (client.totalOrders || 0) + 1,
            lastVisit: loyaltyMetadata.lastVisit,
          })
        }

        const pendingReferral = referrals.find(
          (referral) =>
            referral.status === "first_purchase_pending" &&
            (referral.referredId === client.id || referral.referredEmail === client.email)
        )

        if (pendingReferral) {
          validateReferralFirstPurchase(pendingReferral.id, order.total, user?.id || "admin")
        }
      }
    }

    addNotification({
      type: "success",
      title: "Statut mis a jour",
      message: `Commande ${order.orderNumber} - ${statusConfig[newStatus].label}`,
    })
  }

  // Handle cancel
  const handleCancel = async () => {
    if (selectedOrder) {
      await cancelOrder(selectedOrder.id, cancelReason)
      setCancelDialogOpen(false)
      setCancelReason("")
      setSelectedOrder(null)
      addNotification({
        type: "info",
        title: "Commande annulee",
        message: `Commande ${selectedOrder.orderNumber} a ete annulee`,
      })
    }
  }

  // Render order card
  const renderOrderCard = (order: RemoteOrder) => {
    const status = statusConfig[order.status]
    const StatusIcon = status.icon
    const canProgress = nextStatusMap[order.status] !== undefined && order.status !== "cancelled"
    const timeSinceCreation = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)

    return (
      <Card
        key={order.id}
        className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
          order.status === "new" && timeSinceCreation > 5 ? "ring-2 ring-red-400 animate-pulse" : ""
        }`}
        onClick={() => {
          setSelectedOrder(order)
          setDetailsOpen(true)
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{order.orderNumber}</span>
              <Badge className={`${status.bgColor} ${status.color} border-0`}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-stone-500 flex items-center gap-1 mt-1">
              <ClockIcon className="h-3 w-3" />
              {new Date(order.createdAt).toLocaleTimeString("fr-TN", { hour: "2-digit", minute: "2-digit" })}
              {timeSinceCreation > 0 && (
                <span className={timeSinceCreation > 15 ? "text-red-500 font-medium" : ""}>
                  (il y a {timeSinceCreation} min)
                </span>
              )}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setDetailsOpen(true); }}>
                <EyeIcon className="h-4 w-4 mr-2" />
                Voir details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                <PrinterIcon className="h-4 w-4 mr-2" />
                Imprimer
              </DropdownMenuItem>
              {order.clientPhone && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(`tel:${order.clientPhone}`); }}>
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Appeler client
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {order.status !== "completed" && order.status !== "cancelled" && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setCancelDialogOpen(true); }}
                >
                  <XCircleIcon className="h-4 w-4 mr-2" />
                  Annuler
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Customer info */}
        <div className="space-y-1 mb-3 text-sm">
          {order.clientName && (
            <p className="flex items-center gap-2">
              <UserIcon className="h-3.5 w-3.5 text-stone-400" />
              {order.clientName}
            </p>
          )}
          <p className="flex items-center gap-2">
            {order.deliveryMode === "delivery" ? (
              <>
                <TruckIcon className="h-3.5 w-3.5 text-blue-500" />
                <span>Livraison</span>
              </>
            ) : (
              <>
                <StoreIcon className="h-3.5 w-3.5 text-emerald-500" />
                <span>Retrait sur place</span>
              </>
            )}
          </p>
        </div>

        {/* Items summary */}
        <div className="border-t pt-3 mb-3">
          <p className="text-sm font-medium text-stone-600 mb-1">
            {order.items.reduce((sum, item) => sum + item.quantity, 0)} article(s)
          </p>
          <div className="text-xs text-stone-500 line-clamp-2">
            {order.items.map(item => `${item.quantity}x ${item.name}`).join(", ")}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-amber-600">{order.total.toFixed(2)} TND</span>
            {order.totalPoints > 0 && (
              <p className="text-xs text-emerald-600">+{order.totalPoints} pts</p>
            )}
          </div>
          {canProgress && (
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600"
              onClick={(e) => {
                e.stopPropagation()
                void handleStatusChange(order, nextStatusMap[order.status]!)
              }}
            >
              <PlayIcon className="h-4 w-4 mr-1" />
              {order.status === "new" ? "Confirmer" :
               order.status === "confirmed" ? "Preparer" :
               order.status === "preparing" ? "Pret" :
               order.status === "ready" && order.deliveryMode === "delivery" ? "Livrer" :
               "Terminer"}
            </Button>
          )}
          {order.status === "ready" && order.deliveryMode === "pickup" && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={(e) => {
                e.stopPropagation()
                void handleStatusChange(order, "completed")
              }}
            >
              <CheckCircleIcon className="h-4 w-4 mr-1" />
              Recuperee
            </Button>
          )}
        </div>
      </Card>
    )
  }

  // Stats
  const stats = {
    new: orders.filter(o => o.status === "new").length,
    inProgress: orders.filter(o => ["confirmed", "preparing", "ready", "delivering"].includes(o.status)).length,
    completedToday: orders.filter(o => 
      o.status === "completed" && 
      new Date(o.completedAt || "").toDateString() === new Date().toDateString()
    ).length,
    totalToday: orders.filter(o => 
      new Date(o.createdAt).toDateString() === new Date().toDateString()
    ).reduce((sum, o) => sum + o.total, 0),
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/")}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Gestion des Commandes</h1>
                <p className="text-sm text-stone-500">
                  {stats.new} nouvelle(s) - {stats.inProgress} en cours
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin/commandes/config")}
              >
                <SettingsIcon className="h-4 w-4 mr-2" />
                Configuration
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.location.reload()}
              >
                <RefreshCwIcon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <BellIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{stats.new}</p>
                <p className="text-sm text-blue-600">Nouvelles</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <ChefHatIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.inProgress}</p>
                <p className="text-sm text-amber-600">En cours</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-emerald-50 border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{stats.completedToday}</p>
                <p className="text-sm text-emerald-600">Terminees (jour)</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-stone-50 border-stone-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center">
                <CoinsIcon className="h-5 w-5 text-stone-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-700">{stats.totalToday.toFixed(0)} TND</p>
                <p className="text-sm text-stone-600">CA du jour</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Rechercher (numero, client, telephone)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as typeof dateFilter)}>
                <SelectTrigger className="w-[140px]">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                  <SelectItem value="week">7 derniers jours</SelectItem>
                  <SelectItem value="month">30 derniers jours</SelectItem>
                  <SelectItem value="all">Tout</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
                <SelectTrigger className="w-[140px]">
                  <ListFilterIcon className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterMode} onValueChange={(v) => setFilterMode(v as typeof filterMode)}>
                <SelectTrigger className="w-[140px]">
                  <TruckIcon className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous modes</SelectItem>
                  <SelectItem value="delivery">Livraison</SelectItem>
                  <SelectItem value="pickup">Retrait</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex rounded-lg border overflow-hidden">
                <Button
                  variant={viewMode === "kanban" ? "default" : "ghost"}
                  size="sm"
                  className={`rounded-none ${viewMode === "kanban" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                  onClick={() => setViewMode("kanban")}
                >
                  <LayoutGridIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className={`rounded-none ${viewMode === "list" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                  onClick={() => setViewMode("list")}
                >
                  <ClipboardListIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Kanban View */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {kanbanColumns.map(column => {
              const columnOrders = filteredOrders.filter(o => o.status === column.status)
              return (
                <div key={column.status} className={`bg-white rounded-xl border-t-4 ${column.color} shadow-sm`}>
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{column.title}</h3>
                      <Badge variant="secondary">{columnOrders.length}</Badge>
                    </div>
                  </div>
                  <div className="p-3 space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                    {columnOrders.length === 0 ? (
                      <div className="text-center py-8 text-stone-400">
                        <PackageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucune commande</p>
                      </div>
                    ) : (
                      columnOrders.map(order => renderOrderCard(order))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && (
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="active" className="gap-2">
                <ClipboardListIcon className="h-4 w-4" />
                Actives ({filteredOrders.filter(o => !["completed", "cancelled"].includes(o.status)).length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <HistoryIcon className="h-4 w-4" />
                Historique ({filteredOrders.filter(o => ["completed", "cancelled"].includes(o.status)).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-3">
              {filteredOrders
                .filter(o => !["completed", "cancelled"].includes(o.status))
                .map(order => renderOrderCard(order))}
              {filteredOrders.filter(o => !["completed", "cancelled"].includes(o.status)).length === 0 && (
                <Card className="p-8 text-center">
                  <PackageIcon className="h-12 w-12 mx-auto text-stone-300 mb-3" />
                  <p className="text-stone-500">Aucune commande active</p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-3">
              {filteredOrders
                .filter(o => ["completed", "cancelled"].includes(o.status))
                .map(order => renderOrderCard(order))}
              {filteredOrders.filter(o => ["completed", "cancelled"].includes(o.status)).length === 0 && (
                <Card className="p-8 text-center">
                  <HistoryIcon className="h-12 w-12 mx-auto text-stone-300 mb-3" />
                  <p className="text-stone-500">Aucun historique</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-xl">{selectedOrder.orderNumber}</span>
                  <Badge className={`${statusConfig[selectedOrder.status].bgColor} ${statusConfig[selectedOrder.status].color}`}>
                    {statusConfig[selectedOrder.status].label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {new Date(selectedOrder.createdAt).toLocaleString("fr-TN")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Client Info */}
                <Card className="p-4 space-y-2">
                  <h4 className="font-medium text-sm text-stone-500">CLIENT</h4>
                  {selectedOrder.clientName && (
                    <p className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-stone-400" />
                      {selectedOrder.clientName}
                    </p>
                  )}
                  {selectedOrder.clientPhone && (
                    <p className="flex items-center gap-2">
                      <PhoneIcon className="h-4 w-4 text-stone-400" />
                      <a href={`tel:${selectedOrder.clientPhone}`} className="text-blue-600 hover:underline">
                        {selectedOrder.clientPhone}
                      </a>
                    </p>
                  )}
                  {selectedOrder.clientEmail && (
                    <p className="flex items-center gap-2 text-sm text-stone-500">
                      {selectedOrder.clientEmail}
                    </p>
                  )}
                </Card>

                {/* Delivery Info */}
                <Card className="p-4 space-y-2">
                  <h4 className="font-medium text-sm text-stone-500">
                    {selectedOrder.deliveryMode === "delivery" ? "LIVRAISON" : "RETRAIT"}
                  </h4>
                  <div className="flex items-center gap-2">
                    {selectedOrder.deliveryMode === "delivery" ? (
                      <TruckIcon className="h-5 w-5 text-blue-600" />
                    ) : (
                      <StoreIcon className="h-5 w-5 text-emerald-600" />
                    )}
                    <span className="font-medium">
                      {selectedOrder.deliveryMode === "delivery" ? "Livraison a domicile" : "Retrait sur place"}
                    </span>
                  </div>
                  {selectedOrder.deliveryMode === "delivery" && selectedOrder.deliveryAddress && (
                    <div className="pl-7 text-sm text-stone-600">
                      <p>{selectedOrder.deliveryAddress.address}</p>
                      <p>{selectedOrder.deliveryAddress.city} {selectedOrder.deliveryAddress.postalCode}</p>
                      {selectedOrder.deliveryAddress.instructions && (
                        <p className="text-amber-600 mt-1">Note: {selectedOrder.deliveryAddress.instructions}</p>
                      )}
                    </div>
                  )}
                </Card>

                {/* Items */}
                <Card className="p-4">
                  <h4 className="font-medium text-sm text-stone-500 mb-3">ARTICLES</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-medium">{(item.price * item.quantity).toFixed(2)} TND</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span>Sous-total</span>
                        <span>{selectedOrder.subtotal.toFixed(2)} TND</span>
                      </div>
                      {selectedOrder.deliveryFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Livraison</span>
                          <span>{selectedOrder.deliveryFee.toFixed(2)} TND</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg mt-1">
                        <span>Total</span>
                        <span className="text-amber-600">{selectedOrder.total.toFixed(2)} TND</span>
                      </div>
                      {selectedOrder.totalPoints > 0 && (
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span>Points</span>
                          <span>+{selectedOrder.totalPoints} pts</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Notes */}
                {selectedOrder.customerNote && (
                  <Card className="p-4 bg-amber-50 border-amber-200">
                    <h4 className="font-medium text-sm text-amber-700 mb-1">NOTE CLIENT</h4>
                    <p className="text-sm text-amber-800">{selectedOrder.customerNote}</p>
                  </Card>
                )}
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                {selectedOrder.status !== "completed" && selectedOrder.status !== "cancelled" && (
                  <>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => {
                        setDetailsOpen(false)
                        setCancelDialogOpen(true)
                      }}
                    >
                      <XCircleIcon className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                    {nextStatusMap[selectedOrder.status] && (
                      <Button
                        className="bg-amber-500 hover:bg-amber-600"
                        onClick={() => {
                          void handleStatusChange(selectedOrder, nextStatusMap[selectedOrder.status]!)
                          setDetailsOpen(false)
                        }}
                      >
                        <ChevronRightIcon className="h-4 w-4 mr-2" />
                        {selectedOrder.status === "new" ? "Confirmer" :
                         selectedOrder.status === "confirmed" ? "Commencer preparation" :
                         selectedOrder.status === "preparing" ? "Marquer comme pret" :
                         selectedOrder.status === "ready" && selectedOrder.deliveryMode === "delivery" ? "En livraison" :
                         "Terminer"}
                      </Button>
                    )}
                    {selectedOrder.status === "ready" && selectedOrder.deliveryMode === "pickup" && (
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          void handleStatusChange(selectedOrder, "completed")
                          setDetailsOpen(false)
                        }}
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-2" />
                        Commande recuperee
                      </Button>
                    )}
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la commande</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir annuler la commande {selectedOrder?.orderNumber}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancelReason">Raison (optionnel)</Label>
              <Textarea
                id="cancelReason"
                placeholder="Raison de l'annulation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Retour
            </Button>
            <Button variant="destructive" onClick={() => void handleCancel()}>
              <XCircleIcon className="h-4 w-4 mr-2" />
              Confirmer l&apos;annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminOrdersPage() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <LoyaltyProvider>
          <OrdersProvider>
            <AdminOrdersContent />
          </OrdersProvider>
        </LoyaltyProvider>
        <NotificationContainer />
      </AuthProvider>
    </NotificationProvider>
  )
}
