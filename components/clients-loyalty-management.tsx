"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import { SearchIcon, TrophyIcon, CrownIcon, AwardIcon, StarIcon, PlusIcon, MinusIcon, CopyIcon, UserPlusIcon } from "lucide-react"
import { useNotification } from "@/contexts/notification-context"
import { useLoyalty } from "@/contexts/loyalty-context"

const tierConfig = {
  bronze: { name: "Bronze", icon: AwardIcon, color: "bg-amber-700", textColor: "text-amber-700", minSpent: 0 },
  silver: { name: "Argent", icon: StarIcon, color: "bg-gray-400", textColor: "text-gray-600", minSpent: 200 },
  gold: { name: "Or", icon: TrophyIcon, color: "bg-amber-500", textColor: "text-amber-600", minSpent: 500 },
  platinum: { name: "Platine", icon: CrownIcon, color: "bg-purple-500", textColor: "text-purple-600", minSpent: 1000 },
}

export function ClientsLoyaltyManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTier, setSelectedTier] = useState<string>("all")
  const { addNotification } = useNotification()
  const { clients, addPoints, getReferralsByReferrer } = useLoyalty()

  const updateClientPoints = (clientId: string, pointsChange: number) => {
    if (pointsChange > 0) {
      addPoints(clientId, pointsChange, "bonus", "Ajustement manuel admin")
    } else {
      addPoints(clientId, pointsChange, "redeem", "Ajustement manuel admin")
    }
    addNotification("success", `Points ${pointsChange > 0 ? "ajoutes" : "retires"} avec succes`)
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTier = selectedTier === "all" || client.tier === selectedTier
    return matchesSearch && matchesTier
  })

  const stats = {
    totalClients: clients.length,
    totalPoints: clients.reduce((sum, c) => sum + (c.loyaltyPoints || 0), 0),
    totalSpent: clients.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
    byTier: {
      bronze: clients.filter((c) => c.tier === "bronze").length,
      silver: clients.filter((c) => c.tier === "silver").length,
      gold: clients.filter((c) => c.tier === "gold").length,
      platinum: clients.filter((c) => c.tier === "platinum").length,
    },
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Clients & Programme de Fidélité</h1>
        <p className="text-muted-foreground">Gérez vos clients et leur programme de fidélisation</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <p className="text-3xl font-bold">{stats.totalClients}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <StarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Points Totaux</p>
              <p className="text-3xl font-bold">{stats.totalPoints}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
              <TrophyIcon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
              <p className="text-3xl font-bold">{stats.totalSpent.toFixed(2)} TND</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <CrownIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Par niveau</p>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-xs">
                <AwardIcon className="mr-1 h-3 w-3" /> {stats.byTier.bronze}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <StarIcon className="mr-1 h-3 w-3" /> {stats.byTier.silver}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <TrophyIcon className="mr-1 h-3 w-3" /> {stats.byTier.gold}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <CrownIcon className="mr-1 h-3 w-3" /> {stats.byTier.platinum}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={selectedTier === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTier("all")}
          >
            Tous
          </Button>
          {Object.entries(tierConfig).map(([tier, config]) => {
            const Icon = config.icon
            return (
              <Button
                key={tier}
                variant={selectedTier === tier ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTier(tier)}
              >
                <Icon className="mr-1 h-4 w-4" />
                {config.name}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Clients List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => {
          const tier = client.tier || "bronze"
          const config = tierConfig[tier as keyof typeof tierConfig]
          const TierIcon = config.icon
          const referralsCount = getReferralsByReferrer(client.id).length

          return (
            <Card key={client.id} className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  </div>
                  <Badge className={`${config.color} text-white`}>
                    <TierIcon className="mr-1 h-3 w-3" />
                    {config.name}
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Points</p>
                    <p className="text-xl font-bold text-foreground">{client.loyaltyPoints || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dépenses</p>
                    <p className="text-xl font-bold text-foreground">{(client.totalSpent || 0).toFixed(2)} TND</p>
                  </div>
                </div>

                {/* Code de parrainage */}
                {client.referralCode && (
                  <div className="p-2 bg-purple-50 rounded-lg border border-purple-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserPlusIcon className="h-4 w-4 text-purple-600" />
                        <span className="text-xs text-purple-600">Code parrainage:</span>
                        <span className="font-mono font-bold text-purple-700">{client.referralCode}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(client.referralCode || "")
                          addNotification("success","Code copie!" )
                        }}
                      >
                        <CopyIcon className="h-3 w-3 text-purple-600" />
                      </Button>
                    </div>
                    {referralsCount > 0 && (
                      <p className="text-xs text-purple-600">
                        {referralsCount} filleul{referralsCount > 1 ? "s" : ""} parraine{referralsCount > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => updateClientPoints(client.id, 10)}
                  >
                    <PlusIcon className="mr-1 h-4 w-4" />
                    +10 pts
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => updateClientPoints(client.id, -10)}
                  >
                    <MinusIcon className="mr-1 h-4 w-4" />
                    -10 pts
                  </Button>
                </div>

                {/* Member since */}
                <p className="text-xs text-muted-foreground">
                  Membre depuis {new Date(client.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredClients.length === 0 && (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <StarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium text-foreground">Aucun client trouvé</p>
            <p className="text-sm text-muted-foreground">Essayez de modifier vos critères de recherche</p>
          </div>
        </div>
      )}
    </div>
  )
}
