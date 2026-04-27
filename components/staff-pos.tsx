"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import {
  QrCodeIcon,
  SearchIcon,
  UserIcon,
  GiftIcon,
  CoinsIcon,
  WalletIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  CrownIcon,
  HistoryIcon,
  UserPlusIcon,
  AlertCircleIcon,
} from "lucide-react"
import { useLoyalty, LOYALTY_CONFIG, type LoyaltyClient, type LoyaltyTier } from "@/contexts/loyalty-context"
import { useNotification } from "@/contexts/notification-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog"
import { Label } from "./ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

const tierColors: Record<LoyaltyTier, { bg: string; text: string; border: string }> = {
  bronze: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300" },
  silver: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300" },
  gold: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-400" },
  diamond: { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-400" },
}

export function StaffPOS() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedClient, setSelectedClient] = useState<LoyaltyClient | null>(null)
  const [purchaseAmount, setPurchaseAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showRewardsDialog, setShowRewardsDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [showAddPointsDialog, setShowAddPointsDialog] = useState(false)
  const [manualPoints, setManualPoints] = useState("")
  const [manualReason, setManualReason] = useState("")
  const [showReferralDialog, setShowReferralDialog] = useState(false)
  const [pendingReferral, setPendingReferral] = useState<any>(null)

  const {
    clients,
    getClientByQR,
    getClientByEmail,
    getClientByPhone,
    addPoints,
    calculatePointsForPurchase,
    rewards,
    redeemReward,
    transactions,
    updateClient,
    getTodayMultiplier,
    referrals,
    validateReferralFirstPurchase,
    getPendingReferrals,
  } = useLoyalty()

  const { addNotification } = useNotification()

  useEffect(() => {
    if (!selectedClient) return

    const syncedClient = clients.find((client) => client.id === selectedClient.id)
    if (syncedClient) {
      setSelectedClient(syncedClient)
    }
  }, [clients, selectedClient])

  const handleSearch = () => {
    if (!searchQuery.trim()) return

    let client = getClientByQR(searchQuery)
    if (!client) client = getClientByEmail(searchQuery)
    if (!client) client = getClientByPhone(searchQuery)

    if (client) {
      setSelectedClient(client)
      addNotification(`Client trouve: ${client.name}`, "success")
    } else {
      addNotification("Aucun client trouve avec ces informations", "error")
    }
  }

  const handleProcessPurchase = () => {
    if (!selectedClient || !purchaseAmount) return

    setIsProcessing(true)
    const amount = parseFloat(purchaseAmount)
    const pointsEarned = calculatePointsForPurchase(amount, selectedClient.tier, selectedClient.gender)
    const multiplier = getTodayMultiplier(selectedClient.gender)

    // Add points
    const loyaltyMetadata = {
      multiplier: multiplier > 1 ? multiplier : undefined,
      purchaseAmount: amount,
      totalSpent: selectedClient.totalSpent + amount,
      totalOrdersIncrement: 1,
      lastVisit: new Date().toISOString(),
    }

    if (pointsEarned > 0) {
      addPoints(selectedClient.id, pointsEarned, "earn", `Achat de ${amount} TND`, loyaltyMetadata)
    } else {
      updateClient(selectedClient.id, {
        totalSpent: loyaltyMetadata.totalSpent,
        totalOrders: selectedClient.totalOrders + 1,
        lastVisit: loyaltyMetadata.lastVisit,
      })
    }

    // Verifier si c'est le premier achat d'un client parraine
    const pendingRef = referrals.find(
      (r) => (r.referredId === selectedClient.id || r.referredEmail === selectedClient.email) && 
             r.status === "first_purchase_pending"
    )
    
    if (pendingRef) {
      // Valider le parrainage et donner les points au parrain
      validateReferralFirstPurchase(pendingRef.id, amount, "caisse")
      const referrer = clients.find((c) => c.id === pendingRef.referrerId)
      addNotification(
        `Parrainage valide! ${referrer?.name || "Le parrain"} recoit ${pendingRef.referrerReward} points`,
        "success"
      )
    }

    addNotification(
      `Transaction validee! ${pointsEarned} points ajoutes${multiplier > 1 ? ` (x${multiplier} bonus)` : ""}`,
      "success"
    )

    setPurchaseAmount("")
    setIsProcessing(false)
  }

  const handleRedeemReward = (rewardId: string) => {
    if (!selectedClient) return

    const reward = rewards.find((r) => r.id === rewardId)
    if (!reward) return

    const success = redeemReward(selectedClient.id, rewardId)
    if (success) {
      addNotification(`Recompense "${reward.name}" echangee avec succes!`, "success")
      // Refresh selected client
      const updatedClient = clients.find((c) => c.id === selectedClient.id)
      if (updatedClient) setSelectedClient(updatedClient)
      setShowRewardsDialog(false)
    } else {
      addNotification("Impossible d'echanger cette recompense", "error")
    }
  }

  const handleAddManualPoints = () => {
    if (!selectedClient || !manualPoints || !manualReason) return

    const points = parseInt(manualPoints)
    addPoints(selectedClient.id, points, "adjustment", manualReason)

    addNotification(`${points} points ajoutes manuellement`, "success")
    setManualPoints("")
    setManualReason("")
    setShowAddPointsDialog(false)
  }

  const clientTransactions = selectedClient
    ? transactions.filter((t) => t.clientId === selectedClient.id).slice(0, 10)
    : []

  const availableRewards = selectedClient
    ? rewards.filter((r) => {
        if (!r.isActive) return false
        if (r.stock !== undefined && r.stock <= 0) return false
        if (r.minTier) {
          const tierOrder = ["bronze", "silver", "gold", "diamond"]
          if (tierOrder.indexOf(selectedClient.tier) < tierOrder.indexOf(r.minTier)) return false
        }
        return true
      })
    : []

  const todayMultiplier = getTodayMultiplier()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Espace Caisse</h1>
          <p className="text-muted-foreground">Gestion des transactions et fidelite client</p>
        </div>
        {todayMultiplier > 1 && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2">
            <SparklesIcon className="h-4 w-4 mr-2" />
            Journee speciale x{todayMultiplier} points
          </Badge>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Search Section */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <QrCodeIcon className="h-5 w-5 text-primary" />
            Identification Client
          </h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="QR Code, Email ou Telephone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>
                <SearchIcon className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Scannez le QR code du client ou entrez son email/telephone
            </div>
          </div>
        </Card>

        {/* Quick Stats */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Statistiques du Jour</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">
                {transactions.filter((t) => t.createdAt.startsWith(new Date().toISOString().split("T")[0])).length}
              </p>
              <p className="text-xs text-muted-foreground">Transactions</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {transactions
                  .filter(
                    (t) => t.createdAt.startsWith(new Date().toISOString().split("T")[0]) && t.type === "earn"
                  )
                  .reduce((sum, t) => sum + t.points, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Points donnes</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-amber-600">
                {Math.abs(
                  transactions
                    .filter(
                      (t) => t.createdAt.startsWith(new Date().toISOString().split("T")[0]) && t.type === "redeem"
                    )
                    .reduce((sum, t) => sum + t.points, 0)
                )}
              </p>
              <p className="text-xs text-muted-foreground">Points echanges</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Selected Client Section */}
      {selectedClient && (
        <Card className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className={`h-16 w-16 rounded-full flex items-center justify-center ${tierColors[selectedClient.tier].bg}`}
              >
                <CrownIcon className={`h-8 w-8 ${tierColors[selectedClient.tier].text}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
                <p className="text-muted-foreground">{selectedClient.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${tierColors[selectedClient.tier].bg} ${tierColors[selectedClient.tier].text}`}>
                    {LOYALTY_CONFIG.tiers[selectedClient.tier].name}
                  </Badge>
                  {LOYALTY_CONFIG.tiers[selectedClient.tier].bonus > 0 && (
                    <span className="text-xs text-green-600">
                      +{LOYALTY_CONFIG.tiers[selectedClient.tier].bonus}% bonus
                    </span>
                  )}
                  {referrals.find(
                    (r) => (r.referredId === selectedClient.id || r.referredEmail === selectedClient.email) && 
                           r.status === "first_purchase_pending"
                  ) && (
                    <Badge className="bg-purple-100 text-purple-700 border border-purple-300">
                      <UserPlusIcon className="h-3 w-3 mr-1" />
                      Parraine - 1er achat en attente
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSelectedClient(null)}>
              <XCircleIcon className="h-4 w-4 mr-2" />
              Fermer
            </Button>
          </div>

          <Tabs defaultValue="transaction" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="transaction">Transaction</TabsTrigger>
              <TabsTrigger value="info">Informations</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="transaction" className="space-y-4 mt-4">
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <CoinsIcon className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                  <p className="text-2xl font-bold">{selectedClient.loyaltyPoints}</p>
                  <p className="text-xs text-muted-foreground">Points actuels</p>
                </Card>
                <Card className="p-4 text-center">
                  <WalletIcon className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{(selectedClient.walletBalance || 0).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Wallet (TND)</p>
                </Card>
                <Card className="p-4 text-center">
                  <GiftIcon className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold">{selectedClient.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">Commandes</p>
                </Card>
                <Card className="p-4 text-center">
                  <SparklesIcon className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{selectedClient.lifetimePoints}</p>
                  <p className="text-xs text-muted-foreground">Points cumules</p>
                </Card>
              </div>

              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Montant de l'achat (TND)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                  />
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg min-w-[120px]">
                  <p className="text-sm text-green-700">Points a gagner</p>
                  <p className="text-2xl font-bold text-green-600">
                    {purchaseAmount
                      ? calculatePointsForPurchase(parseFloat(purchaseAmount), selectedClient.tier, selectedClient.gender)
                      : 0}
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleProcessPurchase}
                  disabled={!purchaseAmount || isProcessing}
                  className="min-w-[150px]"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  Valider
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="info" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedClient.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telephone</p>
                    <p className="font-medium">{selectedClient.phone || "Non renseigne"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date d'inscription</p>
                    <p className="font-medium">{new Date(selectedClient.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Total depense</p>
                    <p className="font-medium">{(selectedClient.totalSpent || 0).toFixed(2)} TND</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Derniere visite</p>
                    <p className="font-medium">
                      {selectedClient.lastVisit
                        ? new Date(selectedClient.lastVisit).toLocaleDateString("fr-FR")
                        : "Premiere visite"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Code parrainage</p>
                    <p className="font-medium font-mono">{selectedClient.referralCode}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setShowRewardsDialog(true)}>
                  <GiftIcon className="h-6 w-6 text-purple-500" />
                  <span>Echanger Recompense</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setShowAddPointsDialog(true)}>
                  <CoinsIcon className="h-6 w-6 text-amber-500" />
                  <span>Ajouter Points</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2" onClick={() => setShowHistoryDialog(true)}>
                  <HistoryIcon className="h-6 w-6 text-blue-500" />
                  <span>Historique</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <WalletIcon className="h-6 w-6 text-green-500" />
                  <span>Crediter Wallet</span>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* Recent Clients */}
      {!selectedClient && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Clients Recents</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clients.slice(0, 6).map((client) => (
              <Card
                key={client.id}
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedClient(client)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${tierColors[client.tier].bg}`}
                  >
                    <UserIcon className={`h-5 w-5 ${tierColors[client.tier].text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{client.name}</p>
                    <p className="text-sm text-muted-foreground">{client.loyaltyPoints} pts</p>
                  </div>
                  <Badge variant="outline" className={tierColors[client.tier].text}>
                    {client.tier}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Rewards Dialog */}
      <Dialog open={showRewardsDialog} onOpenChange={setShowRewardsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Echanger une Recompense</DialogTitle>
            <DialogDescription>
              Points disponibles: <strong>{selectedClient?.loyaltyPoints || 0}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {availableRewards.map((reward) => {
              const canRedeem = selectedClient && selectedClient.loyaltyPoints >= reward.pointsCost
              return (
                <Card key={reward.id} className={`p-4 ${!canRedeem ? "opacity-50" : ""}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{reward.name}</h3>
                      <p className="text-sm text-muted-foreground">{reward.description}</p>
                      <p className="text-sm font-medium text-amber-600 mt-1">{reward.pointsCost} points</p>
                    </div>
                    <Button
                      size="sm"
                      disabled={!canRedeem}
                      onClick={() => handleRedeemReward(reward.id)}
                    >
                      Echanger
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Historique des Transactions</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {clientTransactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{t.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className={`font-bold ${t.points > 0 ? "text-green-600" : "text-red-600"}`}>
                  {t.points > 0 ? "+" : ""}
                  {t.points}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Points Dialog */}
      <Dialog open={showAddPointsDialog} onOpenChange={setShowAddPointsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter des Points Manuellement</DialogTitle>
            <DialogDescription>Cette action sera enregistree dans l'historique</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre de points</Label>
              <Input
                type="number"
                placeholder="50"
                value={manualPoints}
                onChange={(e) => setManualPoints(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Raison</Label>
              <Input
                placeholder="Compensation service client..."
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPointsDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddManualPoints} disabled={!manualPoints || !manualReason}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
