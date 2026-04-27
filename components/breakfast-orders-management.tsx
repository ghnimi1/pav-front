"use client"

import { useState, useMemo } from "react"
import { useBreakfast, type BreakfastOrder } from "@/contexts/breakfast-context"
import { useLoyalty } from "@/contexts/loyalty-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CoffeeIcon,
  RefreshCwIcon,
  EyeIcon,
  ReceiptIcon,
  HashIcon,
  CalendarIcon,
  TrendingUpIcon,
  CoinsIcon,
  FilterIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  BarChart3Icon,
  HistoryIcon,
} from "lucide-react"

const ITEMS_PER_PAGE = 20

export function BreakfastOrdersManagement() {
  const { orders, validateOrder, cancelOrder } = useBreakfast()
  const { addPoints, getClientByEmail, getClientById, updateClient, referrals, validateReferralFirstPurchase } = useLoyalty()
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null)
  const [tableNumber, setTableNumber] = useState("")
  const [ticketNumber, setTicketNumber] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "validated" | "cancelled">("all")
  
  // Advanced filters
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "month" | "year" | "custom">("today")
  const [customDateFrom, setCustomDateFrom] = useState("")
  const [customDateTo, setCustomDateTo] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<"orders" | "history">("orders")

  // Date filtering logic
  const getDateRange = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (dateFilter) {
      case "today":
        return { from: today, to: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
      case "week":
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        return { from: weekStart, to: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000) }
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        return { from: monthStart, to: new Date(monthEnd.getTime() + 24 * 60 * 60 * 1000) }
      case "year":
        const yearStart = new Date(today.getFullYear(), 0, 1)
        const yearEnd = new Date(today.getFullYear(), 11, 31)
        return { from: yearStart, to: new Date(yearEnd.getTime() + 24 * 60 * 60 * 1000) }
      case "custom":
        return {
          from: customDateFrom ? new Date(customDateFrom) : new Date(0),
          to: customDateTo ? new Date(new Date(customDateTo).getTime() + 24 * 60 * 60 * 1000) : new Date()
        }
      default:
        return { from: new Date(0), to: new Date() }
    }
  }

  // Filter orders
  const filteredOrders = useMemo(() => {
    const dateRange = getDateRange()
    
    return orders.filter(order => {
      // Status filter
      if (filterStatus !== "all" && order.status !== filterStatus) return false
      
      // Date filter
      const orderDate = new Date(order.createdAt)
      if (orderDate < dateRange.from || orderDate >= dateRange.to) return false
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesId = order.id.toLowerCase().includes(query)
        const matchesTable = order.tableNumber?.toLowerCase().includes(query)
        const matchesTicket = order.ticketNumber?.toLowerCase().includes(query)
        const matchesItems = order.items.some(item => item.item.name.toLowerCase().includes(query))
        if (!matchesId && !matchesTable && !matchesTicket && !matchesItems) return false
      }
      
      return true
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, filterStatus, dateFilter, customDateFrom, customDateTo, searchQuery])

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Statistics
  const stats = useMemo(() => {
    const dateRange = getDateRange()
    const periodOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      return orderDate >= dateRange.from && orderDate < dateRange.to
    })
    
    const totalRevenue = periodOrders
      .filter(o => o.status === "validated")
      .reduce((sum, o) => sum + o.total, 0)
    
    const pendingCount = periodOrders.filter(o => o.status === "pending").length
    const validatedCount = periodOrders.filter(o => o.status === "validated").length
    const cancelledCount = periodOrders.filter(o => o.status === "cancelled").length
    
    const avgOrderValue = validatedCount > 0 ? totalRevenue / validatedCount : 0
    
    return {
      total: periodOrders.length,
      pending: pendingCount,
      validated: validatedCount,
      cancelled: cancelledCount,
      revenue: totalRevenue,
      avgOrderValue
    }
  }, [orders, dateFilter, customDateFrom, customDateTo])

  const currentOrder = orders.find(o => o.id === selectedOrder)

const handleValidate = () => {
    if (selectedOrder && tableNumber) {
      const order = orders.find(o => o.id === selectedOrder)
      
      // Credit points to client if they have a clientEmail
      if (order) {
        const client = (order.clientId && getClientById(order.clientId)) || (order.clientEmail && getClientByEmail(order.clientEmail))
        if (client) {
          const loyaltyMetadata = {
            orderId: order.id,
            purchaseAmount: order.total,
            totalSpent: (client.totalSpent || 0) + order.total,
            totalOrdersIncrement: 1,
            lastVisit: new Date().toISOString(),
          }

          // Add points from the order
          const pointsToAdd = order.totalPoints || 0
          if (pointsToAdd > 0) {
            addPoints(
              client.id, 
              pointsToAdd, 
              "earn", 
              `Commande petit-dejeuner #${ticketNumber || order.id.slice(-6)}`,
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
            validateReferralFirstPurchase(pendingReferral.id, order.total, "admin")
          }
        }
      }
      
      validateOrder(selectedOrder, tableNumber, ticketNumber || undefined)
      setSelectedOrder(null)
      setTableNumber("")
      setTicketNumber("")
    }
  }

  const handleCancel = (orderId: string) => {
    cancelOrder(orderId)
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-TN", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-TN", { day: "2-digit", month: "short", year: "numeric" })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300">En attente</Badge>
      case "validated":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">Validee</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-700 border-red-300">Annulee</Badge>
      default:
        return null
    }
  }

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "today": return "Aujourd'hui"
      case "week": return "Cette semaine"
      case "month": return "Ce mois"
      case "year": return "Cette annee"
      case "custom": return "Personnalise"
      default: return "Periode"
    }
  }

  const exportOrders = () => {
    const data = filteredOrders.map(order => ({
      id: order.id,
      date: formatDate(order.createdAt),
      time: formatTime(order.createdAt),
      status: order.status,
      table: order.tableNumber || "-",
      ticket: order.ticketNumber || "-",
      items: order.items.map(i => `${i.item.name} x${i.quantity}`).join(", "),
      total: order.total.toFixed(2)
    }))
    
    const csv = [
      ["ID", "Date", "Heure", "Statut", "Table", "Ticket", "Articles", "Total (TND)"].join(","),
      ...data.map(row => Object.values(row).join(","))
    ].join("\n")
    
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `commandes-${dateFilter}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <CoffeeIcon className="h-7 w-7 text-amber-600" />
            Gestion des Commandes
          </h1>
          <p className="text-muted-foreground mt-1">Gerez jusqu&apos;a 100+ commandes avec filtres avances</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-stone-200 p-1">
            <button
              onClick={() => setViewMode("orders")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === "orders" 
                  ? "bg-amber-500 text-white" 
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <ClockIcon className="h-4 w-4 inline mr-1.5" />
              Actives
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === "history" 
                  ? "bg-amber-500 text-white" 
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              <HistoryIcon className="h-4 w-4 inline mr-1.5" />
              Historique
            </button>
          </div>
          <Button variant="outline" onClick={exportOrders}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Stats Cards with Revenue */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Card className="col-span-2 bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-100">Recettes {getDateFilterLabel()}</p>
                <p className="text-3xl font-bold">{stats.revenue.toFixed(2)}</p>
                <p className="text-sm text-amber-100">TND</p>
              </div>
              <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center">
                <CoinsIcon className="h-7 w-7" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filterStatus === "all" ? "ring-2 ring-amber-500" : "hover:border-amber-300"}`}
          onClick={() => setFilterStatus("all")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BarChart3Icon className="h-6 w-6 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filterStatus === "pending" ? "ring-2 ring-amber-500" : "hover:border-amber-300"}`}
          onClick={() => setFilterStatus("pending")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <ClockIcon className="h-6 w-6 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filterStatus === "validated" ? "ring-2 ring-emerald-500" : "hover:border-emerald-300"}`}
          onClick={() => setFilterStatus("validated")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Validees</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.validated}</p>
              </div>
              <CheckCircleIcon className="h-6 w-6 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${filterStatus === "cancelled" ? "ring-2 ring-red-500" : "hover:border-red-300"}`}
          onClick={() => setFilterStatus("cancelled")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Annulees</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircleIcon className="h-6 w-6 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Average Order Value */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-50 border">
        <TrendingUpIcon className="h-5 w-5 text-emerald-600" />
        <div>
          <span className="text-sm text-muted-foreground">Panier moyen: </span>
          <span className="font-bold text-emerald-600">{stats.avgOrderValue.toFixed(2)} TND</span>
        </div>
        <div className="h-4 w-px bg-stone-300" />
        <div>
          <span className="text-sm text-muted-foreground">{filteredOrders.length} commande(s) affichee(s)</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-3 p-4 rounded-xl bg-white border">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par ID, table, ticket ou article..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            className="pl-9 h-10"
          />
        </div>

        {/* Date Filter */}
        <Select value={dateFilter} onValueChange={(v: typeof dateFilter) => { setDateFilter(v); setCurrentPage(1) }}>
          <SelectTrigger className="w-[180px] h-10">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Aujourd&apos;hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="year">Cette annee</SelectItem>
            <SelectItem value="custom">Personnalise</SelectItem>
          </SelectContent>
        </Select>

        {/* Custom date inputs */}
        {dateFilter === "custom" && (
          <>
            <Input
              type="date"
              value={customDateFrom}
              onChange={(e) => { setCustomDateFrom(e.target.value); setCurrentPage(1) }}
              className="w-[150px] h-10"
              placeholder="Du"
            />
            <Input
              type="date"
              value={customDateTo}
              onChange={(e) => { setCustomDateTo(e.target.value); setCurrentPage(1) }}
              className="w-[150px] h-10"
              placeholder="Au"
            />
          </>
        )}

        {/* Advanced filters toggle */}
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-amber-50 border-amber-300" : ""}
        >
          <FilterIcon className="h-4 w-4 mr-2" />
          Filtres
        </Button>
      </div>

      {/* Orders List with Pagination */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {viewMode === "history" ? "Historique des commandes" : 
             filterStatus === "all" ? "Toutes les commandes" : 
             filterStatus === "pending" ? "Commandes en attente" :
             filterStatus === "validated" ? "Commandes validees" : "Commandes annulees"}
          </h2>
          
          {/* Pagination info */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </div>
          )}
        </div>

        {paginatedOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CoffeeIcon className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">Aucune commande trouvee pour cette periode</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {paginatedOrders.map(order => (
              <Card 
                key={order.id} 
                className={`transition-all hover:shadow-md ${
                  order.status === "pending" ? "border-amber-200 bg-amber-50/30" : ""
                }`}
              >
                <CardContent className="p-3 lg:p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    {/* Order info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                        order.status === "pending" ? "bg-amber-100" :
                        order.status === "validated" ? "bg-emerald-100" : "bg-red-100"
                      }`}>
                        {order.status === "pending" ? <ClockIcon className="h-5 w-5 text-amber-600" /> :
                         order.status === "validated" ? <CheckCircleIcon className="h-5 w-5 text-emerald-600" /> :
                         <XCircleIcon className="h-5 w-5 text-red-600" />}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold">#{order.id.slice(-6).toUpperCase()}</span>
                          {getStatusBadge(order.status)}
                          {order.tableNumber && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <HashIcon className="h-3 w-3" />
                              T{order.tableNumber}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(order.createdAt)} a {formatTime(order.createdAt)}
                          {order.customerNote && <span className="ml-2 italic">- {order.customerNote}</span>}
                        </p>
                      </div>
                    </div>

                    {/* Items summary with names */}
                    <div className="flex-1 flex flex-wrap gap-1.5 min-w-0">
                      {order.items.slice(0, 4).map((cartItem, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-xs"
                        >
                          <span className="font-bold text-amber-600">x{cartItem.quantity}</span>
                          <span className="text-stone-700 truncate max-w-[100px]">{cartItem.item?.name || "Article"}</span>
                          <span className="text-stone-400">{((cartItem.item?.price || 0) * cartItem.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div className="flex items-center px-2.5 py-1 rounded-lg bg-amber-100 text-xs font-medium text-amber-700">
                          +{order.items.length - 4} autres
                        </div>
                      )}
                    </div>

                    {/* Total and actions */}
                    <div className="flex items-center justify-between lg:justify-end gap-3">
                      <span className="font-bold text-lg text-amber-600">
                        {order.total.toFixed(2)} TND
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {order.status === "pending" && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCancel(order.id)}
                              className="text-red-600 hover:bg-red-50 h-8"
                            >
                              <XCircleIcon className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order.id)
                                setTableNumber("")
                                setTicketNumber("")
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 h-8"
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Valider
                            </Button>
                          </>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedOrder(order.id)}
                          className="h-8"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Precedent
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number
                if (totalPages <= 5) {
                  page = i + 1
                } else if (currentPage <= 3) {
                  page = i + 1
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i
                } else {
                  page = currentPage - 2 + i
                }
                
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 ${currentPage === page ? "bg-amber-500 hover:bg-amber-600" : ""}`}
                  >
                    {page}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Validation Dialog */}
      <Dialog open={!!selectedOrder && currentOrder?.status === "pending"} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
              Valider la commande
            </DialogTitle>
          </DialogHeader>

          {currentOrder && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Commande</span>
                  <span className="font-mono font-bold">#{currentOrder.id.slice(-6).toUpperCase()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Articles</span>
                  <span>{currentOrder.items.reduce((sum, i) => sum + i.quantity, 0)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-amber-600">{currentOrder.total.toFixed(2)} TND</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="table">Numero de table *</Label>
                  <Input
                    id="table"
                    type="number"
                    placeholder="Ex: 5"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticket">Numero de ticket (optionnel)</Label>
                  <Input
                    id="ticket"
                    placeholder="Ex: 001234"
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Annuler</Button>
            <Button 
              onClick={handleValidate}
              disabled={!tableNumber}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Valider la commande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!selectedOrder && currentOrder?.status !== "pending"} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5 text-amber-600" />
              Details de la commande
            </DialogTitle>
          </DialogHeader>

          {currentOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm bg-muted px-2 py-1 rounded font-bold">
                  #{currentOrder.id.slice(-6).toUpperCase()}
                </span>
                {getStatusBadge(currentOrder.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium">{formatDate(currentOrder.createdAt)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Heure:</span>
                  <p className="font-medium">{formatTime(currentOrder.createdAt)}</p>
                </div>
                {currentOrder.tableNumber && (
                  <div>
                    <span className="text-muted-foreground">Table:</span>
                    <p className="font-medium">{currentOrder.tableNumber}</p>
                  </div>
                )}
                {currentOrder.ticketNumber && (
                  <div>
                    <span className="text-muted-foreground">Ticket:</span>
                    <p className="font-medium">{currentOrder.ticketNumber}</p>
                  </div>
                )}
              </div>

              {currentOrder.customerNote && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-800 italic">{currentOrder.customerNote}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">Articles</h4>
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {currentOrder.items.map((cartItem, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center">
                          {cartItem.quantity}
                        </span>
                        <span className="text-sm">{cartItem.item.name}</span>
                      </div>
                      <span className="font-medium text-sm">{(cartItem.item.price * cartItem.quantity).toFixed(2)} TND</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between font-semibold text-lg pt-3 border-t">
                <span>Total</span>
                <span className="text-amber-600">{currentOrder.total.toFixed(2)} TND</span>
              </div>

              {currentOrder.validatedAt && (
                <p className="text-xs text-muted-foreground">
                  Validee le {new Date(currentOrder.validatedAt).toLocaleString("fr-TN")}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
