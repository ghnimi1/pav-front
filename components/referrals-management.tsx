"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Badge } from "./ui/badge"
import { Label } from "./ui/label"
import {
  UsersIcon,
  SearchIcon,
  CheckCircleIcon,
  ClockIcon,
  GiftIcon,
  UserPlusIcon,
  CoinsIcon,
  CalendarIcon,
  WalletIcon,
  AlertCircleIcon,
  SettingsIcon,
  SaveIcon,
} from "lucide-react"
import { useLoyalty, type Referral } from "@/contexts/loyalty-context"
import { useNotification } from "@/contexts/notification-context"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "./ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

const statusConfig = {
  pending: { label: "En attente", color: "bg-gray-100 text-gray-700", icon: ClockIcon },
  first_purchase_pending: { label: "1er achat en attente", color: "bg-amber-100 text-amber-700", icon: AlertCircleIcon },
  completed: { label: "Complete", color: "bg-blue-100 text-blue-700", icon: CheckCircleIcon },
  rewarded: { label: "Recompense", color: "bg-green-100 text-green-700", icon: GiftIcon },
}

export function ReferralsManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null)
  const [showValidateDialog, setShowValidateDialog] = useState(false)
  const [purchaseAmount, setPurchaseAmount] = useState("")
  const [activeTab, setActiveTab] = useState("pending")
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [tempReferrerReward, setTempReferrerReward] = useState("")
  const [tempReferredReward, setTempReferredReward] = useState("")

  const {
    referrals,
    clients,
    validateReferralFirstPurchase,
    getPendingReferrals,
    referralConfig,
    updateReferralConfig,
  } = useLoyalty()
  const { addNotification } = useNotification()

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    return client?.name || "Client inconnu"
  }

  const getClientEmail = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    return client?.email || ""
  }

  const pendingReferrals = getPendingReferrals()
  const completedReferrals = referrals.filter((r) => r.status === "rewarded" || r.status === "completed")

  const filteredReferrals = (activeTab === "pending" ? pendingReferrals : completedReferrals).filter((referral) => {
    if (!searchQuery) return true
    const referrerName = getClientName(referral.referrerId).toLowerCase()
    const referredName = (referral.referredName || "").toLowerCase()
    const query = searchQuery.toLowerCase()
    return referrerName.includes(query) || referredName.includes(query) || (referral.referredEmail || "").toLowerCase().includes(query)
  })

  const handleValidate = () => {
    if (!selectedReferral || !purchaseAmount) return

    const amount = parseFloat(purchaseAmount)
    if (isNaN(amount) || amount <= 0) {
      addNotification("Veuillez entrer un montant valide", "error")
      return
    }

    validateReferralFirstPurchase(selectedReferral.id, amount, "admin")
    addNotification(
      `Parrainage valide! ${getClientName(selectedReferral.referrerId)} a recu ${selectedReferral.referrerReward} points`,
      "success"
    )
    setShowValidateDialog(false)
    setSelectedReferral(null)
    setPurchaseAmount("")
  }

  const openConfigDialog = () => {
    setTempReferrerReward(referralConfig.referrerReward.toString())
    setTempReferredReward(referralConfig.referredReward.toString())
    setShowConfigDialog(true)
  }

  const saveConfig = () => {
    const referrerReward = parseInt(tempReferrerReward)
    const referredReward = parseInt(tempReferredReward)

    if (isNaN(referrerReward) || referrerReward < 0) {
      addNotification("Points parrain invalides", "error")
      return
    }
    if (isNaN(referredReward) || referredReward < 0) {
      addNotification("Points filleul invalides", "error")
      return
    }

    updateReferralConfig({ referrerReward, referredReward })
    addNotification("Configuration du parrainage mise a jour", "success")
    setShowConfigDialog(false)
  }

  const getReferralStats = () => {
    const totalReferrals = referrals.length
    const pendingCount = pendingReferrals.length
    const rewardedCount = referrals.filter((r) => r.status === "rewarded").length
    const totalPointsGiven = referrals
      .filter((r) => r.status === "rewarded")
      .reduce((sum, r) => sum + r.referrerReward + r.referredReward, 0)

    return { totalReferrals, pendingCount, rewardedCount, totalPointsGiven }
  }

  const stats = getReferralStats()

  // Regrouper les parrainages par parrain pour voir qui a parraine combien de clients
  const referralsByReferrer = referrals.reduce((acc, referral) => {
    if (!acc[referral.referrerId]) {
      acc[referral.referrerId] = []
    }
    acc[referral.referrerId].push(referral)
    return acc
  }, {} as Record<string, Referral[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestion des Parrainages</h2>
          <p className="text-muted-foreground">
            Suivez et validez les parrainages de vos clients
          </p>
        </div>
        <Button onClick={openConfigDialog} variant="outline" className="gap-2">
          <SettingsIcon className="h-4 w-4" />
          Configuration
        </Button>
      </div>

      {/* Configuration actuelle */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <CoinsIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">Recompenses de Parrainage</h3>
                <p className="text-sm text-purple-700">Configuration actuelle des points</p>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{referralConfig.referrerReward}</p>
                <p className="text-xs text-purple-600">Points Parrain</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">{referralConfig.referredReward}</p>
                <p className="text-xs text-indigo-600">Points Filleul</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Parrainages</p>
                <p className="text-2xl font-bold">{stats.totalReferrals}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <UsersIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente 1er achat</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valides</p>
                <p className="text-2xl font-bold text-green-600">{stats.rewardedCount}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Points distribues</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalPointsGiven}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <CoinsIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Parrains */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlusIcon className="h-5 w-5" />
            Top Parrains
          </CardTitle>
          <CardDescription>
            Les clients qui ont parraine le plus de nouveaux clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(referralsByReferrer)
              .map(([referrerId, refs]) => ({
                referrerId,
                name: getClientName(referrerId),
                email: getClientEmail(referrerId),
                total: refs.length,
                pending: refs.filter((r) => r.status === "first_purchase_pending").length,
                rewarded: refs.filter((r) => r.status === "rewarded").length,
              }))
              .sort((a, b) => b.total - a.total)
              .slice(0, 6)
              .map((parrain, index) => (
                <div
                  key={parrain.referrerId}
                  className="p-4 rounded-lg border bg-gradient-to-br from-background to-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? "bg-amber-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-amber-700" : "bg-blue-500"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{parrain.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{parrain.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">{parrain.total}</span>
                      <span className="text-muted-foreground">total</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{parrain.rewarded}</span>
                    </div>
                    {parrain.pending > 0 && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        {parrain.pending} en attente
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
          </div>
          {Object.keys(referralsByReferrer).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun parrainage enregistre
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des parrainages */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Liste des Parrainages</CardTitle>
              <CardDescription>
                Validez les parrainages apres le premier achat du filleul
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="gap-2">
                <ClockIcon className="h-4 w-4" />
                En attente ({pendingReferrals.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="gap-2">
                <CheckCircleIcon className="h-4 w-4" />
                Valides ({completedReferrals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {filteredReferrals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClockIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun parrainage en attente de validation</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parrain</TableHead>
                      <TableHead>Filleul</TableHead>
                      <TableHead>Date inscription</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Recompense</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals.map((referral) => {
                      const StatusIcon = statusConfig[referral.status].icon
                      return (
                        <TableRow key={referral.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{getClientName(referral.referrerId)}</p>
                              <p className="text-xs text-muted-foreground">{getClientEmail(referral.referrerId)}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
<p className="font-medium">{referral.referredName || "Filleul"}</p>
                <p className="text-xs text-muted-foreground">{referral.referredEmail || ""}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                              {new Date(referral.createdAt).toLocaleDateString("fr-FR")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusConfig[referral.status].color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {statusConfig[referral.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <CoinsIcon className="h-4 w-4 text-amber-500" />
                              <span className="font-medium">{referral.referrerReward} pts</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedReferral(referral)
                                setShowValidateDialog(true)
                              }}
                              className="gap-1"
                            >
                              <WalletIcon className="h-4 w-4" />
                              Valider 1er achat
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {filteredReferrals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun parrainage valide</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parrain</TableHead>
                      <TableHead>Filleul</TableHead>
                      <TableHead>1er Achat</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Date validation</TableHead>
                      <TableHead>Points donnes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReferrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{getClientName(referral.referrerId)}</p>
                            <p className="text-xs text-muted-foreground">{getClientEmail(referral.referrerId)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
<p className="font-medium">{referral.referredName || "Filleul"}</p>
                        <p className="text-xs text-muted-foreground">{referral.referredEmail || ""}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {referral.firstPurchaseDate && (
                            <div className="flex items-center gap-1 text-sm">
                              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                              {new Date(referral.firstPurchaseDate).toLocaleDateString("fr-FR")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{referral.firstPurchaseAmount ? Number(referral.firstPurchaseAmount).toFixed(2) : "0.00"} TND</span>
                        </TableCell>
                        <TableCell>
                          {referral.completedAt && (
                            <div className="flex items-center gap-1 text-sm">
                              <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                              {new Date(referral.completedAt).toLocaleDateString("fr-FR")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-700">
                              <CoinsIcon className="h-3 w-3 mr-1" />
                              {referral.referrerReward} pts (parrain)
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog de validation */}
      <Dialog open={showValidateDialog} onOpenChange={setShowValidateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WalletIcon className="h-5 w-5 text-green-600" />
              Valider le premier achat
            </DialogTitle>
            <DialogDescription>
              Saisissez le montant du premier achat pour valider le parrainage et attribuer les points au parrain.
            </DialogDescription>
          </DialogHeader>

          {selectedReferral && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Parrain</p>
                  <p className="font-medium">{getClientName(selectedReferral.referrerId)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Filleul</p>
                  <p className="font-medium">{selectedReferral.referredName}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseAmount">Montant du premier achat (TND)</Label>
                <Input
                  id="purchaseAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 25.50"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                />
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Apres validation:</strong>
                </p>
                <ul className="text-sm text-green-600 mt-2 space-y-1">
                  <li>- Le parrain recevra <strong>{selectedReferral.referrerReward} points</strong></li>
                  <li>- Le filleul a deja recu <strong>{selectedReferral.referredReward} points</strong> a son inscription</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowValidateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleValidate} className="gap-2">
              <CheckCircleIcon className="h-4 w-4" />
              Valider le parrainage
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de configuration */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-purple-600" />
              Configuration du Parrainage
            </DialogTitle>
            <DialogDescription>
              Definissez le nombre de points attribues pour chaque parrainage reussi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="referrerReward" className="flex items-center gap-2">
                <UserPlusIcon className="h-4 w-4 text-purple-600" />
                Points pour le Parrain
              </Label>
              <Input
                id="referrerReward"
                type="number"
                min="0"
                placeholder="Ex: 100"
                value={tempReferrerReward}
                onChange={(e) => setTempReferrerReward(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Points attribues au parrain quand son filleul fait son premier achat
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="referredReward" className="flex items-center gap-2">
                <GiftIcon className="h-4 w-4 text-indigo-600" />
                Points pour le Filleul
              </Label>
              <Input
                id="referredReward"
                type="number"
                min="0"
                placeholder="Ex: 50"
                value={tempReferredReward}
                onChange={(e) => setTempReferredReward(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Points de bienvenue attribues au filleul lors de son inscription
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 flex items-start gap-2">
                <AlertCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
                Les nouveaux montants s&apos;appliqueront uniquement aux futurs parrainages. Les parrainages existants conservent leurs valeurs.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveConfig} className="gap-2 bg-purple-600 hover:bg-purple-700">
              <SaveIcon className="h-4 w-4" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
