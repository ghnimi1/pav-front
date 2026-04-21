"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { LoyaltyProvider, useLoyalty, LOYALTY_CONFIG, type LoyaltyClient } from "@/contexts/loyalty-context"
import { StockProvider } from "@/contexts/stock-context"
import { BreakfastProvider, useBreakfast, type BreakfastOrder } from "@/contexts/breakfast-context"
import { OrdersProvider, useOrders, type RemoteOrder } from "@/contexts/orders-context"
import { UnifiedSalesProvider, useUnifiedSales, type UnifiedSale } from "@/contexts/unified-sales-context"
import { NotificationContainer } from "@/components/notification-container"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  ChefHatIcon,
  CoinsIcon,
  GiftIcon,
  TrophyIcon,
  WalletIcon,
  UsersIcon,
  Disc3Icon,
  DicesIcon,
  CrownIcon,
  ArrowLeftIcon,
  CopyIcon,
  ShareIcon,
  CheckIcon,
  TargetIcon,
  SparklesIcon,
  QrCodeIcon,
  HistoryIcon,
  StarIcon,
  Share2Icon,
  MailIcon,
  ShoppingBagIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ReceiptIcon,
  TruckIcon,
  StoreIcon,
  CoffeeIcon,
} from "lucide-react"
import { LoyaltyGames } from "@/components/loyalty-games"
import { LoyaltyCardsProvider, useLoyaltyCards } from "@/contexts/loyalty-cards-context"
import { LoyaltyCardDisplay } from "@/components/loyalty-card-display"
import { ChichBichGameModal } from "@/components/chichbich-game-modal"
import { useNotification } from "@/contexts/notification-context"

function ClientFideliteContent() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const { addNotification } = useNotification()
  const {
    clients,
    rewards,
    missions,
    clientMissions,
    transactions,
    referrals,
    redeemReward,
    getClientStats,
    updateMissionProgress,
  } = useLoyalty()
  const { orders } = useBreakfast()
  const { orders: remoteOrders, getOrdersByClient } = useOrders()
  const { sales } = useUnifiedSales()
  
  // Loyalty cards
  const { 
    getActiveConfigs, 
    getActiveCustomerCards, 
    playChichBich,
    getCardConfig,
  } = useLoyaltyCards()
  
  // Filter orders for the current client from unified sales
  const clientUnifiedOrders = sales.filter(s => s.clientEmail === user?.email)
  const clientOrders = orders.filter(o => o.clientEmail === user?.email)
  const clientRemoteOrders = user?.email ? getOrdersByClient(user.email) : []

  const [copiedCode, setCopiedCode] = useState(false)
  const [showReferralShareDialog, setShowReferralShareDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [selectedReward, setSelectedReward] = useState<any>(null)
  const [showRewardDialog, setShowRewardDialog] = useState(false)
  
  // Loyalty cards state
  const [showChichBichModal, setShowChichBichModal] = useState(false)
  const [chichBichGameData, setChichBichGameData] = useState<{
    cardId: string
    position: number
    chances: number
    winCondition: string
    rewardName: string
  } | null>(null)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/client/login")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  // Find the loyalty client based on current user
  const loyaltyClient = clients.find(
    (c) => c.email === user.email
  ) || {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: "",
    loyaltyPoints: user.loyaltyPoints || 0,
    lifetimePoints: user.loyaltyPoints || 0,
    tier: "bronze" as const,
    totalSpent: user.totalSpent || 0,
    totalOrders: 0,
    referralCode: `REF${user.id.slice(-6).toUpperCase()}`,
    referralCount: 0,
    wallet: 0,
    createdAt: user.createdAt,
    qrCode: `QR-${user.id}`,
  } as LoyaltyClient

  // Get loyalty cards data
  const visitorId = loyaltyClient?.id || user?.id || "guest"
  const activeCardConfigs = getActiveConfigs()
  const customerCards = getActiveCustomerCards(visitorId)
  
  // Handle playing Chich Bich game
  const handlePlayChichBich = (cardId: string, position: number) => {
    const card = customerCards.find(c => c.id === cardId)
    if (!card) return
    
    const config = getCardConfig(card.configId)
    if (!config) return
    
    const posConfig = config.stampPositions.find(p => p.position === position)
    if (!posConfig || posConfig.type !== "game" || !posConfig.gameConfig) return
    
    setChichBichGameData({
      cardId,
      position,
      chances: posConfig.gameConfig.chances,
      winCondition: posConfig.gameConfig.winCondition,
      rewardName: config.productName,
    })
    setShowChichBichModal(true)
  }

  const stats = getClientStats(loyaltyClient.id)
  const tierConfig = LOYALTY_CONFIG.tiers[loyaltyClient.tier]
  const tierOrder = ["bronze", "silver", "gold", "diamond"] as const
  const currentTierIndex = tierOrder.indexOf(loyaltyClient.tier)
  const nextTier = currentTierIndex < 3 ? LOYALTY_CONFIG.tiers[tierOrder[currentTierIndex + 1]] : null
  const progressToNextTier = nextTier
    ? ((loyaltyClient.lifetimePoints - LOYALTY_CONFIG.tiers[loyaltyClient.tier].minPoints) /
        (nextTier.minPoints - LOYALTY_CONFIG.tiers[loyaltyClient.tier].minPoints)) *
      100
    : 100

  const availableRewards = rewards.filter((r) => {
    if (!r.isActive) return false
    if (r.stock !== undefined && r.stock <= 0) return false
    if (r.minTier) {
      if (tierOrder.indexOf(loyaltyClient.tier) < tierOrder.indexOf(r.minTier)) return false
    }
    return true
  })

  const clientTransactionsList = transactions
    .filter((t) => t.clientId === loyaltyClient.id)
    .slice(0, 20)

  const activeMissions = missions.filter((m) => m.isActive)
  const myMissions = clientMissions.filter((cm) => cm.clientId === loyaltyClient.id)

  const copyReferralCode = () => {
    navigator.clipboard.writeText(loyaltyClient.referralCode)
    setCopiedCode(true)
    addNotification("Code de parrainage copie!", "success")
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const shareReferral = async () => {
    console.log("[v0] shareReferral called, navigator.share:", !!navigator.share)
    // Sur PC, toujours ouvrir le dialogue de partage personnalise
    // navigator.share n'est pas toujours fiable sur desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: "Rejoins Le Pave d'Art!",
          text: `Utilise mon code parrain ${loyaltyClient.referralCode} et recois 50 points de bienvenue!`,
          url: `${window.location.origin}/client/register?ref=${loyaltyClient.referralCode}`,
        })
      } catch (err) {
        console.log("[v0] Share cancelled or failed:", err)
        // Si erreur, ouvrir le dialogue
        setShowReferralShareDialog(true)
      }
    } else {
      // Sur PC, ouvrir le dialogue de partage
      console.log("[v0] Opening share dialog")
      setShowReferralShareDialog(true)
    }
  }

  const getReferralShareUrl = () => {
    return `${window.location.origin}/client/register?ref=${loyaltyClient.referralCode}`
  }

  const shareReferralOnPlatform = (platform: string) => {
    const url = getReferralShareUrl()
    const text = `Utilise mon code parrain ${loyaltyClient.referralCode} et recois 50 points de bienvenue chez Le Pave d'Art!`
    
    let shareLink = ""
    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
        break
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        break
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`
        break
      case "email":
        shareLink = `mailto:?subject=${encodeURIComponent("Rejoins Le Pave d'Art!")}&body=${encodeURIComponent(text + "\n\n" + url)}`
        break
    }
    
    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400")
    }
  }

  const handleRedeemReward = () => {
    if (!selectedReward) return
    const success = redeemReward(loyaltyClient.id, selectedReward.id)
    if (success) {
      addNotification(`Recompense "${selectedReward.name}" echangee avec succes!`, "success")
      setShowRewardDialog(false)
      setSelectedReward(null)
    } else {
      addNotification("Points insuffisants pour cette recompense", "error")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-amber-200/50 bg-white/95 shadow-sm backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/menu")}>
              <ArrowLeftIcon className="h-5 w-5" />
            </Button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-amber-700">
              <ChefHatIcon className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-amber-900">Mon Espace Fidelite</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowQRDialog(true)}>
            <QrCodeIcon className="h-4 w-4 mr-2" />
            Mon QR Code
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <Card className="p-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
              <CrownIcon className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{loyaltyClient.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-white/20 text-white border-0">{tierConfig.name}</Badge>
                {tierConfig.bonus > 0 && (
                  <span className="text-sm opacity-90">+{tierConfig.bonus}% bonus</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{loyaltyClient.loyaltyPoints}</p>
              <p className="text-sm opacity-80">points disponibles</p>
            </div>
          </div>
          {nextTier && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex justify-between text-sm mb-2">
                <span>Progression vers {nextTier.name}</span>
                <span>{Math.round(progressToNextTier)}%</span>
              </div>
              <Progress value={progressToNextTier} className="h-2 bg-white/20" />
            </div>
          )}
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <CoinsIcon className="h-6 w-6 mx-auto mb-2 text-amber-500" />
            <p className="text-xl font-bold">{loyaltyClient.lifetimePoints}</p>
            <p className="text-xs text-muted-foreground">Total gagne</p>
          </Card>
          <Card className="p-4 text-center">
            <TrophyIcon className="h-6 w-6 mx-auto mb-2 text-amber-500" />
            <p className="text-xl font-bold">{loyaltyClient.totalOrders || 0}</p>
            <p className="text-xs text-muted-foreground">Commandes</p>
          </Card>
          <Card className="p-4 text-center">
            <WalletIcon className="h-6 w-6 mx-auto mb-2 text-amber-500" />
            <p className="text-xl font-bold">{(loyaltyClient.wallet || 0).toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">TND Wallet</p>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="cards" className="space-y-4">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="cards" className="gap-1">
              <CoffeeIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Cartes</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1">
              <ShoppingBagIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Commandes</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="gap-1">
              <GiftIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Recompenses</span>
            </TabsTrigger>
            <TabsTrigger value="games" className="gap-1">
              <Disc3Icon className="h-4 w-4" />
              <span className="hidden sm:inline">Jeux</span>
            </TabsTrigger>
            <TabsTrigger value="missions" className="gap-1">
              <TargetIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Missions</span>
            </TabsTrigger>
            <TabsTrigger value="referral" className="gap-1">
              <UsersIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Parrainage</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1">
              <HistoryIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Historique</span>
            </TabsTrigger>
          </TabsList>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mes Cartes de Fidelite</h2>
              <Badge variant="outline">{customerCards.length} carte{customerCards.length > 1 ? "s" : ""} active{customerCards.length > 1 ? "s" : ""}</Badge>
            </div>
            
            {activeCardConfigs.length === 0 ? (
              <Card className="p-8 text-center">
                <CoffeeIcon className="h-12 w-12 mx-auto mb-4 text-stone-300" />
                <h3 className="font-semibold text-stone-600 mb-2">Aucune carte de fidelite disponible</h3>
                <p className="text-sm text-stone-500">Les cartes de fidelite seront bientot disponibles.</p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeCardConfigs.map((config) => {
                  const customerCard = customerCards.find(c => c.configId === config.id)
                  return (
                    <LoyaltyCardDisplay
                      key={config.id}
                      config={config}
                      customerCard={customerCard}
                      onPlayGame={handlePlayChichBich}
                    />
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Mes Commandes</h2>
              <Badge variant="outline">{clientOrders.length + clientRemoteOrders.length + clientUnifiedOrders.length} commande{(clientOrders.length + clientRemoteOrders.length + clientUnifiedOrders.length) > 1 ? "s" : ""}</Badge>
            </div>
            
            {/* Remote Orders Section */}
            {clientRemoteOrders.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-stone-600 flex items-center gap-2">
                  <TruckIcon className="h-4 w-4" />
                  Commandes a distance
                </h3>
                {clientRemoteOrders
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((order) => {
                    const remoteStatusConfig: Record<string, { label: string; color: string; icon: typeof ClockIcon }> = {
                      new: { label: "Nouvelle", color: "bg-blue-100 text-blue-700", icon: ClockIcon },
                      confirmed: { label: "Confirmee", color: "bg-purple-100 text-purple-700", icon: CheckCircleIcon },
                      preparing: { label: "En preparation", color: "bg-amber-100 text-amber-700", icon: ClockIcon },
                      ready: { label: "Prete", color: "bg-emerald-100 text-emerald-700", icon: CheckCircleIcon },
                      delivering: { label: "En livraison", color: "bg-cyan-100 text-cyan-700", icon: TruckIcon },
                      completed: { label: "Terminee", color: "bg-stone-100 text-stone-600", icon: CheckCircleIcon },
                      cancelled: { label: "Annulee", color: "bg-red-100 text-red-700", icon: XCircleIcon },
                    }
                    const status = remoteStatusConfig[order.status]
                    const StatusIcon = status.icon
                    
                    return (
                      <Card key={order.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              {order.deliveryMode === "delivery" ? (
                                <TruckIcon className="h-5 w-5 text-blue-600" />
                              ) : (
                                <StoreIcon className="h-5 w-5 text-emerald-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold">{order.orderNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString("fr-TN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                                {" - "}
                                {order.deliveryMode === "delivery" ? "Livraison" : "Retrait"}
                              </p>
                            </div>
                          </div>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          {order.items.map(item => `${item.quantity}x ${item.name}`).join(", ")}
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-bold text-amber-600">{order.total.toFixed(2)} TND</span>
                          {order.totalPoints > 0 && order.status === "completed" && (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                              <CoinsIcon className="h-3 w-3 mr-1" />
                              +{order.totalPoints} pts
                            </Badge>
                          )}
                        </div>
                      </Card>
                    )
                  })}
              </div>
            )}
            
            {/* On-site Orders Section */}
            {clientOrders.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-stone-600 flex items-center gap-2">
                  <StoreIcon className="h-4 w-4" />
                  Commandes sur place
                </h3>
                {clientOrders
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((order) => {
                    const statusConfig = {
                      pending: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: ClockIcon },
                      validated: { label: "Validee", color: "bg-emerald-100 text-emerald-700", icon: CheckCircleIcon },
                      cancelled: { label: "Annulee", color: "bg-red-100 text-red-700", icon: XCircleIcon },
                    }
                    const status = statusConfig[order.status]
                    const StatusIcon = status.icon
                    
                    return (
                      <Card key={order.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                              <ReceiptIcon className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-semibold">#{order.id.slice(-6).toUpperCase()}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString("fr-TN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                          </div>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          {order.items.map(item => `${item.quantity}x ${item.item.name}`).join(", ")}
                        </div>
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-bold text-amber-600">{order.total.toFixed(2)} TND</span>
                          {order.totalPoints > 0 && order.status === "validated" && (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                              <CoinsIcon className="h-3 w-3 mr-1" />
                              +{order.totalPoints} pts
                            </Badge>
                          )}
                        </div>
                      </Card>
                    )
                  })}
              </div>
            )}
            
            {/* Unified Sales Orders Section */}
            {clientUnifiedOrders.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-stone-600 flex items-center gap-2">
                  <ReceiptIcon className="h-4 w-4" />
                  Commandes recentes
                </h3>
                {clientUnifiedOrders
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 10)
                  .map((sale) => {
                    const statusConfig: Record<string, { label: string; color: string; icon: typeof ClockIcon }> = {
                      pending: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: ClockIcon },
                      confirmed: { label: "Confirmee", color: "bg-blue-100 text-blue-700", icon: CheckCircleIcon },
                      preparing: { label: "En preparation", color: "bg-orange-100 text-orange-700", icon: ClockIcon },
                      ready: { label: "Prete", color: "bg-emerald-100 text-emerald-700", icon: CheckCircleIcon },
                      completed: { label: "Terminee", color: "bg-green-100 text-green-700", icon: CheckCircleIcon },
                      cancelled: { label: "Annulee", color: "bg-red-100 text-red-700", icon: XCircleIcon },
                    }
                    const status = statusConfig[sale.status] || statusConfig.pending
                    const StatusIcon = status.icon
                    const typeLabels: Record<string, string> = {
                      counter: "Comptoir",
                      breakfast: "Petit-dejeuner",
                      delivery: "Livraison",
                      pickup: "A emporter",
                      table: "Sur place",
                    }
                    
                    return (
                      <Card key={sale.id} className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              sale.type === "breakfast" ? "bg-orange-100" : "bg-amber-100"
                            }`}>
                              <ReceiptIcon className={`h-5 w-5 ${
                                sale.type === "breakfast" ? "text-orange-600" : "text-amber-600"
                              }`} />
                            </div>
                            <div>
                              <p className="font-semibold">{sale.saleNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(sale.createdAt).toLocaleDateString("fr-TN", {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                                {" - "}
                                <span className="capitalize">{typeLabels[sale.type] || sale.type}</span>
                              </p>
                            </div>
                          </div>
                          <Badge className={status.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          {sale.items.map(item => `${item.quantity}x ${item.name}`).join(", ")}
                        </div>
                        
                        {sale.tableNumber && (
                          <div className="text-xs text-muted-foreground mb-2">
                            Table: {sale.tableNumber}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between pt-2 border-t">
                          <span className="font-bold text-amber-600">{sale.total.toFixed(2)} TND</span>
                          {sale.pointsEarned > 0 && sale.status === "completed" && (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">
                              <CoinsIcon className="h-3 w-3 mr-1" />
                              +{sale.pointsEarned} pts
                            </Badge>
                          )}
                        </div>
                      </Card>
                    )
                  })}
              </div>
            )}
            
            {/* Empty state */}
            {clientOrders.length === 0 && clientRemoteOrders.length === 0 && clientUnifiedOrders.length === 0 && (
              <Card className="p-8 text-center">
                <ShoppingBagIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-2">Aucune commande</h3>
                <p className="text-muted-foreground mb-4">
                  Vous n&apos;avez pas encore passe de commande.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button onClick={() => router.push("/menu")} variant="outline">
                    Commander sur place
                  </Button>
                  <Button onClick={() => router.push("/commander")} className="bg-amber-600 hover:bg-amber-700">
                    <TruckIcon className="h-4 w-4 mr-2" />
                    Commander a distance
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
            
          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recompenses Disponibles</h2>
              <Badge variant="outline">{loyaltyClient.loyaltyPoints} pts disponibles</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {availableRewards.map((reward) => {
                const canRedeem = loyaltyClient.loyaltyPoints >= reward.pointsCost
                return (
                  <Card key={reward.id} className={`p-4 ${!canRedeem ? "opacity-60" : ""}`}>
                    <div className="flex gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-amber-100">
                        <GiftIcon className="h-8 w-8 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{reward.name}</h3>
                        <p className="text-sm text-muted-foreground">{reward.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="secondary">{reward.pointsCost} pts</Badge>
                          <Button
                            size="sm"
                            disabled={!canRedeem}
                            onClick={() => {
                              setSelectedReward(reward)
                              setShowRewardDialog(true)
                            }}
                          >
                            Echanger
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games">
            <LoyaltyGames client={loyaltyClient} />
          </TabsContent>

          {/* Missions Tab */}
          <TabsContent value="missions" className="space-y-4">
            <h2 className="text-xl font-semibold">Mes Missions</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {activeMissions.map((mission) => {
                const myProgress = myMissions.find((m) => m.missionId === mission.id)
                const progress = myProgress ? myProgress.progress : 0
                const isCompleted = myProgress?.status === "completed"
                const progressPercent = Math.min((progress / mission.target) * 100, 100)

                return (
                  <Card key={mission.id} className={`p-4 ${isCompleted ? "bg-green-50 border-green-200" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${isCompleted ? "bg-green-100" : "bg-amber-100"}`}>
                        {isCompleted ? (
                          <CheckIcon className="h-6 w-6 text-green-600" />
                        ) : (
                          <TargetIcon className="h-6 w-6 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{mission.name}</h3>
                        <p className="text-sm text-muted-foreground">{mission.description}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{progress}/{mission.target}</span>
                            <span className="text-amber-600 font-medium">{mission.reward} pts</span>
                          </div>
                          <Progress value={progressPercent} className="h-2" />
                        </div>
                        {isCompleted && (
                          <Badge className="mt-2 bg-green-500">Completee!</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Referral Tab */}
          <TabsContent value="referral" className="space-y-4">
            <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <h2 className="text-xl font-bold mb-2">Parrainez vos amis</h2>
              <p className="text-sm opacity-90 mb-4">
                Invitez vos amis et recevez 100 points pour chaque parrainage reussi.
                Votre filleul recoit 50 points de bienvenue!
              </p>
              
              <div className="bg-white/10 rounded-lg p-4 mb-4">
                <Label className="text-white/80 text-sm">Votre code parrain</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={loyaltyClient.referralCode}
                    readOnly
                    className="bg-white/20 border-white/30 text-white font-mono text-lg"
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={copyReferralCode}
                    className="shrink-0"
                  >
                    {copiedCode ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button className="w-full bg-white text-blue-600 hover:bg-white/90" onClick={shareReferral}>
                <ShareIcon className="h-4 w-4 mr-2" />
                Partager mon code
              </Button>
            </Card>

            {/* Statistiques de parrainage */}
            {(() => {
              const myReferrals = referrals.filter((r) => r.referrerId === loyaltyClient.id)
              const completedReferrals = myReferrals.filter((r) => r.status === "rewarded")
              const pendingReferrals = myReferrals.filter((r) => r.status === "first_purchase_pending")
              const totalEarned = completedReferrals.reduce((sum, r) => sum + r.referrerReward, 0)
              const potentialPoints = pendingReferrals.reduce((sum, r) => sum + r.referrerReward, 0)

              return (
                <>
                  {/* Resume des stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card className="p-4 text-center bg-blue-50 border-blue-200">
                      <p className="text-2xl font-bold text-blue-600">{myReferrals.length}</p>
                      <p className="text-xs text-blue-600/80">Total filleuls</p>
                    </Card>
                    <Card className="p-4 text-center bg-green-50 border-green-200">
                      <p className="text-2xl font-bold text-green-600">{completedReferrals.length}</p>
                      <p className="text-xs text-green-600/80">Achats valides</p>
                    </Card>
                    <Card className="p-4 text-center bg-amber-50 border-amber-200">
                      <p className="text-2xl font-bold text-amber-600">{pendingReferrals.length}</p>
                      <p className="text-xs text-amber-600/80">En attente</p>
                    </Card>
                    <Card className="p-4 text-center bg-purple-50 border-purple-200">
                      <p className="text-2xl font-bold text-purple-600">{totalEarned}</p>
                      <p className="text-xs text-purple-600/80">Points gagnes</p>
                    </Card>
                  </div>

                  {/* Points en attente */}
                  {potentialPoints > 0 && (
                    <Card className="p-4 bg-gradient-to-r from-amber-100 to-orange-100 border-amber-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-amber-200 flex items-center justify-center">
                            <CoinsIcon className="h-5 w-5 text-amber-700" />
                          </div>
                          <div>
                            <p className="font-semibold text-amber-900">Points en attente</p>
                            <p className="text-sm text-amber-700">
                              {pendingReferrals.length} filleul{pendingReferrals.length > 1 ? "s" : ""} n&apos;{pendingReferrals.length > 1 ? "ont" : "a"} pas encore fait d&apos;achat
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-amber-700">+{potentialPoints}</p>
                          <p className="text-xs text-amber-600">pts potentiels</p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Liste des filleuls */}
                  <div className="space-y-2">
                    <h3 className="font-semibold">Mes filleuls ({myReferrals.length})</h3>
                    {myReferrals.length === 0 ? (
                      <Card className="p-6 text-center">
                        <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-muted-foreground">Vous n&apos;avez pas encore de filleuls</p>
                        <p className="text-sm text-muted-foreground">Partagez votre code pour commencer!</p>
                      </Card>
                    ) : (
                      myReferrals.map((ref) => {
                        const isCompleted = ref.status === "rewarded"
                        const isPending = ref.status === "first_purchase_pending"
                        
                        return (
                          <Card key={ref.id} className={`p-4 ${isCompleted ? "border-green-200 bg-green-50/50" : isPending ? "border-amber-200 bg-amber-50/50" : ""}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                  isCompleted ? "bg-green-100" : "bg-amber-100"
                                }`}>
                                  {isCompleted ? (
                                    <CheckIcon className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <UsersIcon className="h-5 w-5 text-amber-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{ref.referredName || "Filleul"}</p>
                                  <p className="text-xs text-muted-foreground">{ref.referredEmail}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Inscrit le {new Date(ref.createdAt).toLocaleDateString("fr-FR")}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                {isCompleted ? (
                                  <>
                                    <Badge className="bg-green-500 text-white">Valide</Badge>
                                    <p className="text-sm font-bold text-green-600 mt-1">+{ref.referrerReward} pts</p>
                                    {ref.firstPurchaseAmount !== undefined && ref.firstPurchaseAmount !== null && (
                                      <p className="text-xs text-muted-foreground">
                                        1er achat: {Number(ref.firstPurchaseAmount).toFixed(2)} TND
                                      </p>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <Badge variant="outline" className="border-amber-400 text-amber-600">
                                      En attente
                                    </Badge>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      +{ref.referrerReward} pts au 1er achat
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </Card>
                        )
                      })
                    )}
                  </div>
                </>
              )
            })()}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <h2 className="text-xl font-semibold">Historique des Points</h2>
            <div className="space-y-2">
              {clientTransactionsList.map((t) => (
                <Card key={t.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{t.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className={`font-bold ${t.points > 0 ? "text-green-600" : "text-red-600"}`}>
                      {t.points > 0 ? "+" : ""}{t.points}
                    </span>
                  </div>
                </Card>
              ))}
              {clientTransactionsList.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucune transaction pour le moment
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mon QR Code Fidelite</DialogTitle>
            <DialogDescription>
              Presentez ce code en caisse pour cumuler vos points
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            <div className="w-48 h-48 bg-white border-2 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <QrCodeIcon className="h-24 w-24 mx-auto text-foreground" />
                <p className="text-xs font-mono mt-2">{loyaltyClient.qrCode}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">{loyaltyClient.email}</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redeem Reward Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'echange</DialogTitle>
            <DialogDescription>
              Vous allez echanger {selectedReward?.pointsCost} points contre:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Card className="p-4 bg-amber-50">
              <h3 className="font-semibold text-lg">{selectedReward?.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedReward?.description}</p>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRewardDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleRedeemReward}>
              Confirmer ({selectedReward?.pointsCost} pts)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de partage code parrainage (PC) */}
      <Dialog open={showReferralShareDialog} onOpenChange={setShowReferralShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2Icon className="h-5 w-5 text-blue-500" />
              Partager votre code parrain
            </DialogTitle>
            <DialogDescription>
              Partagez votre code avec vos amis et gagnez des points quand ils s&apos;inscrivent!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Code et lien */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
              <p className="text-sm text-muted-foreground mb-1">Votre code parrain:</p>
              <p className="text-2xl font-bold text-blue-600">{loyaltyClient.referralCode}</p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={getReferralShareUrl()}
                  className="flex-1 px-3 py-2 text-xs bg-white border rounded truncate"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(getReferralShareUrl())
                    addNotification("Lien copie!", "success")
                  }}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Boutons de partage */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Partager sur:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => shareReferralOnPlatform("facebook")}
                  className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                >
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </Button>
                <Button
                  onClick={() => shareReferralOnPlatform("twitter")}
                  className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white"
                >
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  Twitter
                </Button>
                <Button
                  onClick={() => shareReferralOnPlatform("whatsapp")}
                  className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                >
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>
                <Button
                  onClick={() => shareReferralOnPlatform("email")}
                  variant="outline"
                >
                  <MailIcon className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Chich Bich Game Modal */}
      {chichBichGameData && (
        <ChichBichGameModal
          isOpen={showChichBichModal}
          onClose={() => {
            setShowChichBichModal(false)
            setChichBichGameData(null)
          }}
          onPlay={() => {
            const result = playChichBich(chichBichGameData.cardId, chichBichGameData.position)
            return result
          }}
          chances={chichBichGameData.chances}
          winCondition={chichBichGameData.winCondition}
          rewardName={chichBichGameData.rewardName}
        />
      )}
    </div>
  )
}

export default function ClientFidelitePage() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <StockProvider>
          <LoyaltyProvider>
            <OrdersProvider>
<BreakfastProvider>
              <UnifiedSalesProvider>
                <LoyaltyCardsProvider>
                  <ClientFideliteContent />
                </LoyaltyCardsProvider>
              </UnifiedSalesProvider>
            </BreakfastProvider>
            </OrdersProvider>
            <NotificationContainer />
          </LoyaltyProvider>
        </StockProvider>
      </AuthProvider>
    </NotificationProvider>
  )
}
