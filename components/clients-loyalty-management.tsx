"use client"

import { useMemo, useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import {
  AwardIcon,
  CopyIcon,
  CrownIcon,
  MinusIcon,
  SearchIcon,
  StarIcon,
  TrophyIcon,
  UserPlusIcon,
  WalletIcon,
} from "lucide-react"
import { useNotification } from "@/contexts/notification-context"
import { useLoyalty, type LoyaltyTier } from "@/contexts/loyalty-context"

const tierConfig: Record<
  LoyaltyTier,
  {
    name: string
    icon: typeof AwardIcon
    badgeClass: string
    textClass: string
  }
> = {
  bronze: {
    name: "Bronze",
    icon: AwardIcon,
    badgeClass: "bg-amber-700 text-white",
    textClass: "text-amber-700",
  },
  silver: {
    name: "Argent",
    icon: StarIcon,
    badgeClass: "bg-slate-400 text-white",
    textClass: "text-slate-600",
  },
  gold: {
    name: "Or",
    icon: TrophyIcon,
    badgeClass: "bg-amber-500 text-white",
    textClass: "text-amber-600",
  },
  diamond: {
    name: "Diamond",
    icon: CrownIcon,
    badgeClass: "bg-cyan-500 text-white",
    textClass: "text-cyan-600",
  },
}

export function ClientsLoyaltyManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTier, setSelectedTier] = useState<"all" | LoyaltyTier>("all")
  const { addNotification } = useNotification()
  const { clients, addPoints, getReferralsByReferrer, getProgramStats } = useLoyalty()

  const filteredClients = useMemo(() => {
    return clients
      .filter((client) => {
        const query = searchTerm.toLowerCase()
        const matchesSearch =
          client.name.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query) ||
          (client.phone || "").toLowerCase().includes(query)
        const matchesTier = selectedTier === "all" || client.tier === selectedTier
        return matchesSearch && matchesTier
      })
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
  }, [clients, searchTerm, selectedTier])

  const programStats = getProgramStats()
  const stats = useMemo(() => {
    const totalSpent = clients.reduce((sum, client) => sum + (client.totalSpent || 0), 0)
    const totalWallet = clients.reduce((sum, client) => sum + (client.wallet || 0), 0)
    const averageBasket = clients.length > 0 ? totalSpent / clients.length : 0

    return {
      totalClients: clients.length,
      activeClients: programStats.activeClients,
      totalSpent,
      totalWallet,
      averageBasket,
      byTier: {
        bronze: clients.filter((client) => client.tier === "bronze").length,
        silver: clients.filter((client) => client.tier === "silver").length,
        gold: clients.filter((client) => client.tier === "gold").length,
        diamond: clients.filter((client) => client.tier === "diamond").length,
      },
    }
  }, [clients, programStats.activeClients])

  const updateClientPoints = (clientId: string, pointsChange: number) => {
    if (pointsChange === 0) return

    if (pointsChange > 0) {
      addPoints(clientId, pointsChange, "bonus", "Ajustement manuel admin")
    } else {
      addPoints(clientId, pointsChange, "adjustment", "Retrait manuel admin")
    }

    addNotification(
      "success",
      pointsChange > 0 ? "Points ajoutes" : "Points retires",
      `${Math.abs(pointsChange)} point(s) mis a jour avec succes`
    )
  }

  const copyReferralCode = async (referralCode?: string) => {
    if (!referralCode) return

    try {
      await navigator.clipboard.writeText(referralCode)
      addNotification("success", "Code copie", "Le code de parrainage a ete copie")
    } catch {
      addNotification("error", "Copie impossible", "Le navigateur a bloque la copie")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Clients & Programme de Fidelite</h1>
        <p className="text-muted-foreground">Gerez vos clients et leur programme de fidelisation</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <p className="text-3xl font-bold">{stats.totalClients}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <UserPlusIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Clients Actifs</p>
              <p className="text-3xl font-bold">{stats.activeClients}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
              <StarIcon className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Points en Circulation</p>
              <p className="text-3xl font-bold">
                {(programStats.totalPointsIssued - programStats.totalPointsRedeemed).toLocaleString()}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
              <TrophyIcon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">CA Clients</p>
              <p className="text-3xl font-bold">{stats.totalSpent.toFixed(2)} TND</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100">
              <CrownIcon className="h-6 w-6 text-violet-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Wallet Total</p>
              <p className="text-3xl font-bold">{stats.totalWallet.toFixed(2)} TND</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100">
              <WalletIcon className="h-6 w-6 text-cyan-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, email ou telephone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedTier === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTier("all")}
            >
              Tous
            </Button>
            {(Object.keys(tierConfig) as LoyaltyTier[]).map((tier) => {
              const Icon = tierConfig[tier].icon
              return (
                <Button
                  key={tier}
                  variant={selectedTier === tier ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTier(tier)}
                >
                  <Icon className="mr-1 h-4 w-4" />
                  {tierConfig[tier].name}
                </Button>
              )
            })}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-4">
        {(Object.keys(tierConfig) as LoyaltyTier[]).map((tier) => {
          const Icon = tierConfig[tier].icon
          return (
            <Card key={tier} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{tierConfig[tier].name}</p>
                  <p className="text-2xl font-bold">{stats.byTier[tier]}</p>
                </div>
                <Icon className={`h-6 w-6 ${tierConfig[tier].textClass}`} />
              </div>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredClients.map((client) => {
          const config = tierConfig[client.tier || "bronze"]
          const TierIcon = config.icon
          const referralsCount = getReferralsByReferrer(client.id).length

          return (
            <Card key={client.id} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                    {client.phone && <p className="text-xs text-muted-foreground">{client.phone}</p>}
                  </div>
                  <Badge className={config.badgeClass}>
                    <TierIcon className="mr-1 h-3 w-3" />
                    {config.name}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Points actuels</p>
                    <p className="text-xl font-bold text-foreground">{client.loyaltyPoints || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Points cumules</p>
                    <p className="text-xl font-bold text-foreground">{client.lifetimePoints || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Depenses</p>
                    <p className="text-lg font-bold text-foreground">{(client.totalSpent || 0).toFixed(2)} TND</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Commandes</p>
                    <p className="text-lg font-bold text-foreground">{client.totalOrders || 0}</p>
                  </div>
                </div>

                <div className="rounded-lg border bg-stone-50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Code parrainage</span>
                    {client.referralCode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => void copyReferralCode(client.referralCode)}
                      >
                        <CopyIcon className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <p className="font-mono text-sm font-bold text-foreground">
                    {client.referralCode || "Non genere"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {referralsCount} parrainage(s) - Wallet {(client.wallet || 0).toFixed(2)} TND
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => updateClientPoints(client.id, 10)}
                  >
                    <StarIcon className="mr-1 h-4 w-4" />
                    +10 pts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => updateClientPoints(client.id, -10)}
                  >
                    <MinusIcon className="mr-1 h-4 w-4" />
                    -10 pts
                  </Button>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Membre depuis {new Date(client.createdAt).toLocaleDateString("fr-FR")}</span>
                  <span>{stats.averageBasket.toFixed(2)} TND/client</span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="flex min-h-[280px] items-center justify-center">
          <div className="text-center">
            <UserPlusIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium text-foreground">Aucun client trouve</p>
            <p className="text-sm text-muted-foreground">Essayez un autre filtre ou ajoutez de nouveaux clients</p>
          </div>
        </div>
      )}
    </div>
  )
}
