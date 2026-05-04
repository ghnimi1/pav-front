"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
  ArrowLeftIcon,
  SearchIcon,
  PlusIcon,
  EditIcon,
  Trash2Icon,
  CoffeeIcon,
  DicesIcon,
  GiftIcon,
  CalendarIcon,
  SettingsIcon,
  CheckIcon,
  CroissantIcon,
  SparklesIcon,
  EyeIcon,
} from "lucide-react"
import { StockProvider, useStock, type MenuItem } from "@/contexts/stock-context"
import { BreakfastProvider, useBreakfast, type BreakfastItem } from "@/contexts/breakfast-context"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { LoyaltyProvider } from "@/contexts/loyalty-context"
import { NotificationProvider, useNotification } from "@/contexts/notification-context"
import { NotificationContainer } from "@/components/notification-container"
import { 
  LoyaltyCardsProvider, 
  useLoyaltyCards,
  type LoyaltyCardConfig,
  type StampPosition,
} from "@/contexts/loyalty-cards-context"
import { LoyaltyCardDisplay } from "@/components/loyalty-card-display"
import { cn } from "@/lib/utils"

function LoyaltyCardsAdminContent() {
  const router = useRouter()
  const { addNotification } = useNotification()
  const { menuItems } = useStock()
  const { items: breakfastItems } = useBreakfast()
  const { 
    isLoyaltyCardsEnabled,
    setLoyaltyCardsEnabled,
    cardConfigs, 
    createCardConfig, 
    updateCardConfig, 
    deleteCardConfig,
    customerCards,
  } = useLoyaltyCards()

  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [selectedCard, setSelectedCard] = useState<LoyaltyCardConfig | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    productName: "",
    productPrice: 2,
    eligibleProductIds: [] as string[],
    totalStamps: 12,
    expirationDays: 90,
    backgroundColor: "light" as "dark" | "light",
    stampIcon: "cup" as "cup" | "croissant" | "custom",
    gridColumns: 4,
    isActive: true,
    autoRenew: true,
  })
  
  // Stamp positions configuration
  const [stampPositions, setStampPositions] = useState<StampPosition[]>([])
  
  // Combine menu items and breakfast items for selection
  const allProducts = useMemo(() => {
    const products: { id: string; name: string; price: number; category: string; source: "menu" | "breakfast" }[] = []
    
    menuItems.forEach(item => {
      products.push({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        source: "menu",
      })
    })
    
    breakfastItems.forEach(item => {
      products.push({
        id: item.id,
        name: item.name,
        price: item.price || 0,
        category: item.category,
        source: "breakfast",
      })
    })
    
    return products
  }, [menuItems, breakfastItems])

  // Filter cards by search
  const filteredCards = useMemo(() => {
    if (!searchQuery) return cardConfigs
    const query = searchQuery.toLowerCase()
    return cardConfigs.filter(card => 
      card.name.toLowerCase().includes(query) ||
      card.productName.toLowerCase().includes(query)
    )
  }, [cardConfigs, searchQuery])

  // Generate default stamp positions
  const generateStampPositions = (total: number, gamePositions: number[], rewardPositions: number[]) => {
    const positions: StampPosition[] = []
    for (let i = 1; i <= total; i++) {
      if (gamePositions.includes(i)) {
        positions.push({
          position: i,
          type: "game",
          gameConfig: {
            gameName: "Chich Bich",
            chances: 3,
            winCondition: "double-6",
            rewardProductIds: [],
          },
        })
      } else if (rewardPositions.includes(i)) {
        positions.push({
          position: i,
          type: "reward",
          rewardConfig: {
            rewardProductIds: [],
            rewardText: "Produit Offert",
          },
        })
      } else {
        positions.push({
          position: i,
          type: "normal",
        })
      }
    }
    return positions
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      productName: "",
      productPrice: 2,
      eligibleProductIds: [],
      totalStamps: 12,
      expirationDays: 90,
      backgroundColor: "light",
      stampIcon: "cup",
      gridColumns: 4,
      isActive: true,
      autoRenew: true,
    })
    setStampPositions(generateStampPositions(12, [6], [12]))
  }

  // Open create dialog
  const openCreateDialog = () => {
    resetForm()
    setShowCreateDialog(true)
  }

  // Open edit dialog
  const openEditDialog = (card: LoyaltyCardConfig) => {
    setSelectedCard(card)
    setFormData({
      name: card.name,
      description: card.description,
      productName: card.productName,
      productPrice: card.productPrice,
      eligibleProductIds: card.eligibleProductIds,
      totalStamps: card.totalStamps,
      expirationDays: card.expirationDays,
      backgroundColor: card.backgroundColor,
      stampIcon: card.stampIcon,
      gridColumns: card.gridColumns,
      isActive: card.isActive,
      autoRenew: card.autoRenew,
    })
    setStampPositions(card.stampPositions)
    setShowEditDialog(true)
  }

  // Handle total stamps change
  const handleTotalStampsChange = (total: number) => {
    setFormData(prev => ({ ...prev, totalStamps: total }))
    // Recalculate positions
    const gamePos = total === 12 ? [6] : total === 18 ? [6, 12] : [Math.floor(total / 2)]
    const rewardPos = [total]
    setStampPositions(generateStampPositions(total, gamePos, rewardPos))
  }

  // Toggle position type
  const togglePositionType = (position: number, newType: "normal" | "game" | "reward") => {
    setStampPositions(prev => prev.map(p => {
      if (p.position === position) {
        if (newType === "game") {
          return {
            ...p,
            type: "game",
            gameConfig: {
              gameName: "Chich Bich",
              chances: 3,
              winCondition: "double-6" as const,
              rewardProductIds: [],
            },
            rewardConfig: undefined,
          }
        } else if (newType === "reward") {
          return {
            ...p,
            type: "reward",
            rewardConfig: {
              rewardProductIds: [],
              rewardText: "Produit Offert",
            },
            gameConfig: undefined,
          }
        } else {
          return {
            ...p,
            type: "normal",
            gameConfig: undefined,
            rewardConfig: undefined,
          }
        }
      }
      return p
    }))
  }

  const toggleSpecialRewardProduct = (
    position: number,
    kind: "game" | "reward",
    productId: string
  ) => {
    setStampPositions((prev) =>
      prev.map((entry) => {
        if (entry.position !== position) return entry

        if (kind === "game" && entry.gameConfig) {
          const nextIds = entry.gameConfig.rewardProductIds.includes(productId)
            ? entry.gameConfig.rewardProductIds.filter((id) => id !== productId)
            : [...entry.gameConfig.rewardProductIds, productId]

          return {
            ...entry,
            gameConfig: {
              ...entry.gameConfig,
              rewardProductIds: nextIds,
            },
          }
        }

        if (kind === "reward" && entry.rewardConfig) {
          const nextIds = entry.rewardConfig.rewardProductIds.includes(productId)
            ? entry.rewardConfig.rewardProductIds.filter((id) => id !== productId)
            : [...entry.rewardConfig.rewardProductIds, productId]

          return {
            ...entry,
            rewardConfig: {
              ...entry.rewardConfig,
              rewardProductIds: nextIds,
            },
          }
        }

        return entry
      })
    )
  }

  const updateRewardText = (position: number, rewardText: string) => {
    setStampPositions((prev) =>
      prev.map((entry) =>
        entry.position === position && entry.rewardConfig
          ? {
              ...entry,
              rewardConfig: {
                ...entry.rewardConfig,
                rewardText,
              },
            }
          : entry
      )
    )
  }

  // Save card
  const handleSave = async () => {
    if (!formData.name || !formData.productName) {
      addNotification("Veuillez remplir tous les champs obligatoires", "error")
      return
    }

    const cardData = {
      ...formData,
      stampPositions,
    }

    if (showEditDialog && selectedCard) {
      await updateCardConfig(selectedCard.id, cardData)
      addNotification("Carte mise a jour avec succes", "success")
      setShowEditDialog(false)
    } else {
      await createCardConfig(cardData)
      addNotification("Carte creee avec succes", "success")
      setShowCreateDialog(false)
    }
    
    resetForm()
    setSelectedCard(null)
  }

  // Delete card
  const handleDelete = async () => {
    if (selectedCard) {
      await deleteCardConfig(selectedCard.id)
      addNotification("Carte supprimee avec succes", "success")
      setShowDeleteDialog(false)
      setSelectedCard(null)
    }
  }

  // Toggle product eligibility
  const toggleProductEligible = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      eligibleProductIds: prev.eligibleProductIds.includes(productId)
        ? prev.eligibleProductIds.filter(id => id !== productId)
        : [...prev.eligibleProductIds, productId],
    }))
  }

  // Get stats for a card
  const getCardStats = (config: LoyaltyCardConfig) => {
    const cards = customerCards.filter(c => c.configId === config.id)
    const activeCards = cards.filter(c => c.status === "active")
    const completedCards = cards.filter(c => c.status === "completed")
    const totalStamps = cards.reduce((sum, c) => sum + c.currentStampCount, 0)
    return { total: cards.length, active: activeCards.length, completed: completedCards.length, totalStamps }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/admin")}
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-stone-900">Cartes de Fidelite</h1>
              <p className="text-sm text-stone-500">Gerez vos cartes a tampons</p>
            </div>
          </div>
          <Button onClick={openCreateDialog} className="bg-amber-500 hover:bg-amber-600">
            <PlusIcon className="w-4 h-4 mr-2" />
            Nouvelle carte
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Global Toggle */}
        <Card className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                isLoyaltyCardsEnabled 
                  ? "bg-gradient-to-br from-amber-500 to-orange-500" 
                  : "bg-stone-200"
              )}>
                <CoffeeIcon className={cn(
                  "w-5 h-5",
                  isLoyaltyCardsEnabled ? "text-white" : "text-stone-500"
                )} />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">Cartes de Fidelite</h3>
                <p className="text-sm text-stone-500">
                  {isLoyaltyCardsEnabled 
                    ? "Les cartes sont visibles pour les clients" 
                    : "Les cartes sont masquees pour les clients"}
                </p>
              </div>
            </div>
            <Switch
              checked={isLoyaltyCardsEnabled}
              onCheckedChange={(checked) => {
                void setLoyaltyCardsEnabled(checked)
              }}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
        </Card>
        
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Rechercher une carte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((card) => {
            const stats = getCardStats(card)
            return (
              <Card key={card.id} className="overflow-hidden">
                {/* Card Preview */}
                <div className={cn(
                  "p-4 relative",
                  card.backgroundColor === "dark" ? "bg-stone-900" : "bg-gradient-to-br from-amber-50 to-orange-50"
                )}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center",
                      card.backgroundColor === "dark" ? "bg-amber-500/20" : "bg-amber-100"
                    )}>
                      {card.stampIcon === "croissant" ? (
                        <CroissantIcon className="w-6 h-6 text-amber-600" />
                      ) : (
                        <CoffeeIcon className="w-6 h-6 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <h3 className={cn(
                        "font-bold",
                        card.backgroundColor === "dark" ? "text-white" : "text-stone-900"
                      )}>
                        {card.name}
                      </h3>
                      <p className={cn(
                        "text-sm",
                        card.backgroundColor === "dark" ? "text-stone-400" : "text-stone-500"
                      )}>
                        {card.productName} - {card.productPrice} DT
                      </p>
                    </div>
                  </div>
                  
                  {/* Mini stamps preview */}
                  <div className="flex flex-wrap gap-1 justify-center">
                    {card.stampPositions.slice(0, 12).map((pos) => (
                      <div
                        key={pos.position}
                        className={cn(
                          "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold",
                          pos.type === "game" 
                            ? "bg-amber-500 text-white" 
                            : pos.type === "reward"
                              ? "bg-emerald-500 text-white"
                              : card.backgroundColor === "dark"
                                ? "bg-stone-700 text-stone-400"
                                : "bg-white border border-stone-200 text-stone-500"
                        )}
                      >
                        {pos.type === "game" ? (
                          <DicesIcon className="w-3 h-3" />
                        ) : pos.type === "reward" ? (
                          <GiftIcon className="w-3 h-3" />
                        ) : (
                          pos.position
                        )}
                      </div>
                    ))}
                    {card.totalStamps > 12 && (
                      <div className={cn(
                        "w-6 h-6 rounded-md flex items-center justify-center text-[10px]",
                        card.backgroundColor === "dark" ? "text-stone-500" : "text-stone-400"
                      )}>
                        +{card.totalStamps - 12}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-4 space-y-3">
                  {/* Status & Stats */}
                  <div className="flex items-center justify-between">
                    <Badge variant={card.isActive ? "default" : "secondary"}>
                      {card.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <div className="flex items-center gap-2 text-xs text-stone-500">
                      <CalendarIcon className="w-3 h-3" />
                      <span>{card.expirationDays} jours</span>
                    </div>
                  </div>

                  {/* Stamps info */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-stone-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-stone-900">{card.totalStamps}</p>
                      <p className="text-[10px] text-stone-500">Tampons</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-amber-600">
                        {card.stampPositions.filter(p => p.type === "game").length}
                      </p>
                      <p className="text-[10px] text-stone-500">Jeux</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2">
                      <p className="text-lg font-bold text-emerald-600">
                        {card.stampPositions.filter(p => p.type === "reward").length}
                      </p>
                      <p className="text-[10px] text-stone-500">Offerts</p>
                    </div>
                  </div>

                  {/* Usage stats */}
                  <div className="bg-stone-50 rounded-lg p-3">
                    <p className="text-xs text-stone-500 mb-2">Statistiques</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-stone-500">Cartes actives:</span>
                        <span className="font-bold ml-1">{stats.active}</span>
                      </div>
                      <div>
                        <span className="text-stone-500">Completees:</span>
                        <span className="font-bold ml-1">{stats.completed}</span>
                      </div>
                    </div>
                  </div>

                  {/* Eligible products */}
                  <div>
                    <p className="text-xs text-stone-500 mb-1">
                      Produits eligibles: {card.eligibleProductIds.length}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-stone-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedCard(card)
                        setShowPreviewDialog(true)
                      }}
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      Apercu
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(card)}
                    >
                      <EditIcon className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => {
                        setSelectedCard(card)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-12">
            <CoffeeIcon className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-900 mb-2">
              Aucune carte de fidelite
            </h3>
            <p className="text-stone-500 mb-4">
              Creez votre premiere carte a tampons pour fideliser vos clients
            </p>
            <Button onClick={openCreateDialog}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Creer une carte
            </Button>
          </div>
        )}
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false)
          setShowEditDialog(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? "Modifier la carte" : "Nouvelle carte de fidelite"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de la carte *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Passeport Cafe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productName">Nom du produit *</Label>
                <Input
                  id="productName"
                  value={formData.productName}
                  onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="Cafe Importe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Cumulez vos cafes et tentez votre chance"
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productPrice">Prix (DT)</Label>
                <Input
                  id="productPrice"
                  type="number"
                  step="0.1"
                  value={formData.productPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, productPrice: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalStamps">Nombre de tampons</Label>
                <Select
                  value={formData.totalStamps.toString()}
                  onValueChange={(v) => handleTotalStampsChange(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 tampons</SelectItem>
                    <SelectItem value="8">8 tampons</SelectItem>
                    <SelectItem value="10">10 tampons</SelectItem>
                    <SelectItem value="12">12 tampons</SelectItem>
                    <SelectItem value="15">15 tampons</SelectItem>
                    <SelectItem value="18">18 tampons</SelectItem>
                    <SelectItem value="20">20 tampons</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDays">Expiration (jours)</Label>
                <Input
                  id="expirationDays"
                  type="number"
                  value={formData.expirationDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, expirationDays: parseInt(e.target.value) || 90 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gridColumns">Colonnes grille</Label>
                <Select
                  value={formData.gridColumns.toString()}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, gridColumns: parseInt(v) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 colonnes</SelectItem>
                    <SelectItem value="4">4 colonnes</SelectItem>
                    <SelectItem value="5">5 colonnes</SelectItem>
                    <SelectItem value="6">6 colonnes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Style */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icone des tampons</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.stampIcon === "cup" ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, stampIcon: "cup" }))}
                    className="flex-1"
                  >
                    <CoffeeIcon className="w-4 h-4 mr-2" />
                    Gobelet
                  </Button>
                  <Button
                    type="button"
                    variant={formData.stampIcon === "croissant" ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, stampIcon: "croissant" }))}
                    className="flex-1"
                  >
                    <CroissantIcon className="w-4 h-4 mr-2" />
                    Croissant
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fond de la carte</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={formData.backgroundColor === "light" ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, backgroundColor: "light" }))}
                    className="flex-1"
                  >
                    Clair
                  </Button>
                  <Button
                    type="button"
                    variant={formData.backgroundColor === "dark" ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, backgroundColor: "dark" }))}
                    className="flex-1"
                  >
                    Sombre
                  </Button>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Carte active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.autoRenew}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, autoRenew: checked }))}
                />
                <Label>Renouvellement auto</Label>
              </div>
            </div>

            {/* Stamp positions configuration */}
            <div className="space-y-3">
              <Label>Configuration des positions</Label>
              <p className="text-sm text-stone-500">
                Cliquez sur une position pour changer son type
              </p>
              <div className="flex flex-wrap gap-2">
                {stampPositions.map((pos) => (
                  <div key={pos.position} className="relative">
                    <Select
                      value={pos.type}
                      onValueChange={(v) => togglePositionType(pos.position, v as "normal" | "game" | "reward")}
                    >
                      <SelectTrigger className={cn(
                        "w-14 h-14",
                        pos.type === "game" && "bg-amber-100 border-amber-500",
                        pos.type === "reward" && "bg-emerald-100 border-emerald-500"
                      )}>
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold">{pos.position}</span>
                          {pos.type === "game" && <DicesIcon className="w-3 h-3 text-amber-600" />}
                          {pos.type === "reward" && <GiftIcon className="w-3 h-3 text-emerald-600" />}
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="game">Jeu Chich Bich</SelectItem>
                        <SelectItem value="reward">Recompense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>

            {stampPositions.some((pos) => pos.type !== "normal") && (
              <div className="space-y-4">
                <Label>Gestion des recompenses</Label>
                <div className="space-y-4">
                  {stampPositions
                    .filter((pos) => pos.type === "game" || pos.type === "reward")
                    .map((pos) => (
                      <div key={`special-${pos.position}`} className="rounded-xl border border-stone-200 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-stone-900">
                              Position {pos.position} - {pos.type === "game" ? "Jeu Chich Bich" : "Recompense"}
                            </p>
                            <p className="text-sm text-stone-500">
                              {pos.type === "game"
                                ? "Choisissez les produits gagnables quand le client remporte le jeu."
                                : "Choisissez les produits offerts et le texte affiche au client."}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {pos.type === "game"
                              ? `${pos.gameConfig?.rewardProductIds.length || 0} produit(s)`
                              : `${pos.rewardConfig?.rewardProductIds.length || 0} produit(s)`}
                          </Badge>
                        </div>

                        {pos.type === "reward" && pos.rewardConfig && (
                          <div className="space-y-2">
                            <Label>Texte de recompense</Label>
                            <Input
                              value={pos.rewardConfig.rewardText}
                              onChange={(e) => updateRewardText(pos.position, e.target.value)}
                              placeholder="Boisson chaude offerte"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>
                            {pos.type === "game" ? "Produits gagnables" : "Produits offerts"}
                          </Label>
                          <div className="max-h-48 overflow-y-auto rounded-lg border border-stone-200 p-2 space-y-2">
                            {allProducts.map((product) => {
                              const checked =
                                pos.type === "game"
                                  ? pos.gameConfig?.rewardProductIds.includes(product.id) || false
                                  : pos.rewardConfig?.rewardProductIds.includes(product.id) || false

                              return (
                                <label
                                  key={`${pos.position}-${product.id}`}
                                  className="flex items-center gap-3 rounded-lg p-2 hover:bg-stone-50 cursor-pointer"
                                >
                                  <Checkbox
                                    checked={checked}
                                    onCheckedChange={() =>
                                      toggleSpecialRewardProduct(pos.position, pos.type, product.id)
                                    }
                                  />
                                  <span className="flex-1">{product.name}</span>
                                  {/* <Badge variant="outline" className="text-xs">
                                    {product.source === "breakfast" ? "Petit-dej" : product.category}
                                  </Badge> */}
                                  <span className="text-sm text-stone-500">{product.price} DT</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Eligible products selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Produits eligibles ({formData.eligibleProductIds.length} selectionnes)</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ 
                      ...prev, 
                      eligibleProductIds: allProducts.map(p => p.id) 
                    }))}
                  >
                    Tout selectionner
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, eligibleProductIds: [] }))}
                  >
                    Tout deselectionner
                  </Button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                {allProducts.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={formData.eligibleProductIds.includes(product.id)}
                      onCheckedChange={() => toggleProductEligible(product.id)}
                    />
                    <span className="flex-1">{product.name}</span>
                    {/* <Badge variant="outline" className="text-xs">
                      {product.source === "breakfast" ? "Petit-dej" : product.category}
                    </Badge> */}
                    <span className="text-sm text-stone-500">{product.price} DT</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setShowEditDialog(false)
                resetForm()
              }}
            >
              Annuler
            </Button>
            <Button onClick={() => void handleSave()} className="bg-amber-500 hover:bg-amber-600">
              <CheckIcon className="w-4 h-4 mr-2" />
              {showEditDialog ? "Enregistrer" : "Creer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la carte</DialogTitle>
          </DialogHeader>
          <p className="text-stone-600">
            Etes-vous sur de vouloir supprimer la carte &quot;{selectedCard?.name}&quot; ?
            Cette action est irreversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Apercu de la carte</DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <LoyaltyCardDisplay
              config={selectedCard}
              customerCard={undefined}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
export { LoyaltyCardsAdminPage }
export default function LoyaltyCardsAdminPage() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <StockProvider>
          <LoyaltyProvider>
            <BreakfastProvider>
              <LoyaltyCardsProvider>
                <LoyaltyCardsAdminContent />
                <NotificationContainer />
              </LoyaltyCardsProvider>
            </BreakfastProvider>
          </LoyaltyProvider>
        </StockProvider>
      </AuthProvider>
    </NotificationProvider>
  )
}
