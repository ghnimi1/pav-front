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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  SparklesIcon,
  CoffeeIcon,
  CakeIcon,
  UtensilsIcon,
  SettingsIcon,
  CheckIcon,
  PackageIcon,
  StarIcon,
  ImageIcon,
} from "lucide-react"
import Image from "next/image"
import { StockProvider, useStock, type Supplement, type MenuItem, type ProductSupplementConfig } from "@/contexts/stock-context"
import { BreakfastProvider, useBreakfast, type BreakfastItem } from "@/contexts/breakfast-context"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { NotificationProvider, useNotification } from "@/contexts/notification-context"
import { NotificationContainer } from "@/components/notification-container"

// Unified product type for both menus
interface UnifiedProduct {
  id: string
  name: string
  description?: string
  price: number
  points?: number
  image?: string
  isAvailable: boolean
  availableSupplements?: ProductSupplementConfig[]
  category: string
  source: "patisserie" | "breakfast"
}

function MenuAdminContent() {
  const router = useRouter()
  const { showNotification } = useNotification()
  const { menuItems, menuCategories, supplements, updateMenuItem } = useStock()
  const { items: breakfastItems, categories: breakfastCategories, updateItem } = useBreakfast()
  
  const [activeTab, setActiveTab] = useState<"all" | "patisserie" | "breakfast">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showSupplementsDialog, setShowSupplementsDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<UnifiedProduct | null>(null)
  const [selectedSupplements, setSelectedSupplements] = useState<Map<string, { enabled: boolean; customPrice?: number }>>(new Map())
  
  // Convert to unified products
  const unifiedProducts = useMemo(() => {
    const products: UnifiedProduct[] = []
    
    // Add patisserie items
    menuItems.forEach(item => {
      products.push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        points: item.points,
        image: item.image,
        isAvailable: item.isAvailable,
        availableSupplements: item.availableSupplements,
        category: item.category,
        source: "patisserie"
      })
    })
    
    // Add breakfast items
    breakfastItems.forEach(item => {
      products.push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        points: item.points,
        image: item.image,
        isAvailable: item.isAvailable,
        availableSupplements: item.availableSupplements,
        category: item.categoryId,
        source: "breakfast"
      })
    })
    
    return products
  }, [menuItems, breakfastItems])

  // Get all categories
  const allCategories = useMemo(() => {
    const categories: { id: string; name: string; source: string }[] = []
    
    menuCategories.forEach(cat => {
      categories.push({ id: cat.slug, name: cat.name, source: "patisserie" })
    })
    
    breakfastCategories.forEach(cat => {
      categories.push({ id: cat.id, name: cat.name, source: "breakfast" })
    })
    
    return categories
  }, [menuCategories, breakfastCategories])

  // Filter products
  const filteredProducts = useMemo(() => {
    return unifiedProducts.filter(product => {
      // Tab filter
      if (activeTab === "patisserie" && product.source !== "patisserie") return false
      if (activeTab === "breakfast" && product.source !== "breakfast") return false
      
      // Search filter
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      
      // Category filter
      if (selectedCategory !== "all" && product.category !== selectedCategory) return false
      
      return true
    })
  }, [unifiedProducts, activeTab, searchQuery, selectedCategory])

  // Open supplements configuration dialog
  const handleConfigureSupplements = (product: UnifiedProduct) => {
    setEditingProduct(product)
    
    // Initialize selected supplements from product config
    const supplementsMap = new Map<string, { enabled: boolean; customPrice?: number }>()
    supplements.forEach(sup => {
      const config = product.availableSupplements?.find(ps => ps.supplementId === sup.id)
      supplementsMap.set(sup.id, {
        enabled: config?.isEnabled || false,
        customPrice: config?.customPrice
      })
    })
    setSelectedSupplements(supplementsMap)
    setShowSupplementsDialog(true)
  }

  // Toggle supplement for product
  const toggleSupplement = (supplementId: string) => {
    setSelectedSupplements(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(supplementId) || { enabled: false }
      newMap.set(supplementId, { ...current, enabled: !current.enabled })
      return newMap
    })
  }

  // Set custom price for supplement
  const setCustomPrice = (supplementId: string, price: string) => {
    setSelectedSupplements(prev => {
      const newMap = new Map(prev)
      const current = newMap.get(supplementId) || { enabled: false }
      newMap.set(supplementId, { 
        ...current, 
        customPrice: price ? parseFloat(price) : undefined 
      })
      return newMap
    })
  }

  // Save supplements configuration
  const handleSaveSupplements = () => {
    if (!editingProduct) return

    const supplementConfigs: ProductSupplementConfig[] = []
    selectedSupplements.forEach((config, supplementId) => {
      supplementConfigs.push({
        supplementId,
        isEnabled: config.enabled,
        customPrice: config.customPrice
      })
    })

    if (editingProduct.source === "patisserie") {
      updateMenuItem(editingProduct.id, { availableSupplements: supplementConfigs })
    } else {
      updateItem(editingProduct.id, { availableSupplements: supplementConfigs })
    }

    showNotification("success", "Supplements mis a jour avec succes")
    setShowSupplementsDialog(false)
    setEditingProduct(null)
  }

  // Toggle product availability
  const toggleAvailability = (product: UnifiedProduct) => {
    if (product.source === "patisserie") {
      updateMenuItem(product.id, { isAvailable: !product.isAvailable })
    } else {
      updateItem(product.id, { isAvailable: !product.isAvailable })
    }
    showNotification("success", `${product.name} ${!product.isAvailable ? "active" : "desactive"}`)
  }

  // Count enabled supplements for a product
  const getEnabledSupplementsCount = (product: UnifiedProduct): number => {
    return product.availableSupplements?.filter(s => s.isEnabled).length || 0
  }

  // Get category name
  const getCategoryName = (product: UnifiedProduct): string => {
    if (product.source === "patisserie") {
      return menuCategories.find(c => c.slug === product.category)?.name || product.category
    }
    return breakfastCategories.find(c => c.id === product.category)?.name || product.category
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="rounded-full"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Gestion des Menus</h1>
                <p className="text-sm text-stone-500">Patisserie et Petit Dejeuner</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/admin/supplements")}
              variant="outline"
              className="gap-2"
            >
              <SparklesIcon className="h-4 w-4" />
              Gerer Supplements
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mb-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="all" className="gap-2">
              <PackageIcon className="h-4 w-4" />
              Tous
            </TabsTrigger>
            <TabsTrigger value="patisserie" className="gap-2">
              <CakeIcon className="h-4 w-4" />
              Patisserie
            </TabsTrigger>
            <TabsTrigger value="breakfast" className="gap-2">
              <CoffeeIcon className="h-4 w-4" />
              Petit Dej
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Categorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les categories</SelectItem>
              {allCategories
                .filter(cat => activeTab === "all" || cat.source === activeTab)
                .map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="text-2xl font-bold text-stone-900">{unifiedProducts.length}</div>
            <div className="text-sm text-stone-500">Produits Total</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-amber-600">
              {unifiedProducts.filter(p => getEnabledSupplementsCount(p) > 0).length}
            </div>
            <div className="text-sm text-stone-500">Avec Supplements</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-emerald-600">
              {unifiedProducts.filter(p => p.isAvailable).length}
            </div>
            <div className="text-sm text-stone-500">Actifs</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-600">{supplements.length}</div>
            <div className="text-sm text-stone-500">Supplements</div>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <Card 
              key={`${product.source}-${product.id}`}
              className={`overflow-hidden transition-all ${!product.isAvailable ? "opacity-60" : ""}`}
            >
              {/* Image */}
              <div className="relative h-32 bg-stone-100">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-stone-300" />
                  </div>
                )}
                
                {/* Source badge */}
                <Badge 
                  className={`absolute top-2 left-2 ${
                    product.source === "patisserie" 
                      ? "bg-pink-100 text-pink-700" 
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {product.source === "patisserie" ? (
                    <><CakeIcon className="h-3 w-3 mr-1" /> Patisserie</>
                  ) : (
                    <><CoffeeIcon className="h-3 w-3 mr-1" /> Petit Dej</>
                  )}
                </Badge>

                {/* Supplements count */}
                {getEnabledSupplementsCount(product) > 0 && (
                  <Badge className="absolute top-2 right-2 bg-purple-500 text-white">
                    <SparklesIcon className="h-3 w-3 mr-1" />
                    {getEnabledSupplementsCount(product)} suppl.
                  </Badge>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-stone-900">{product.name}</h3>
                    <p className="text-xs text-stone-500">{getCategoryName(product)}</p>
                  </div>
                  <Switch
                    checked={product.isAvailable}
                    onCheckedChange={() => toggleAvailability(product)}
                  />
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-bold text-amber-600">{product.price.toFixed(2)} TND</span>
                  {product.points && product.points > 0 && (
                    <span className="text-sm text-emerald-600 flex items-center gap-1">
                      <StarIcon className="h-3 w-3" />
                      +{product.points} pts
                    </span>
                  )}
                </div>

                {/* Actions */}
                <Button
                  onClick={() => handleConfigureSupplements(product)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <SettingsIcon className="h-4 w-4" />
                  Configurer Supplements
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <PackageIcon className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">Aucun produit trouve</p>
          </div>
        )}
      </div>

      {/* Supplements Configuration Dialog */}
      <Dialog open={showSupplementsDialog} onOpenChange={setShowSupplementsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-amber-500" />
              Configurer les Supplements
            </DialogTitle>
            {editingProduct && (
              <p className="text-sm text-stone-500">
                Pour: <span className="font-medium text-stone-700">{editingProduct.name}</span>
              </p>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {supplements.length === 0 ? (
              <div className="text-center py-8">
                <SparklesIcon className="h-10 w-10 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500">Aucun supplement disponible</p>
                <Button
                  variant="link"
                  onClick={() => router.push("/admin/supplements")}
                  className="mt-2"
                >
                  Creer des supplements
                </Button>
              </div>
            ) : (
              supplements.map(supplement => {
                const config = selectedSupplements.get(supplement.id) || { enabled: false }
                return (
                  <Card 
                    key={supplement.id}
                    className={`p-4 transition-all ${config.enabled ? "border-amber-300 bg-amber-50/50" : ""}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <Checkbox
                        checked={config.enabled}
                        onCheckedChange={() => toggleSupplement(supplement.id)}
                        className="mt-1"
                      />

                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-stone-900">{supplement.name}</h4>
                            {supplement.description && (
                              <p className="text-xs text-stone-500">{supplement.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-amber-600">
                              +{supplement.price.toFixed(2)} TND
                            </div>
                            {supplement.points && supplement.points > 0 && (
                              <div className="text-xs text-emerald-600">+{supplement.points} pts</div>
                            )}
                          </div>
                        </div>

                        {/* Custom price (only if enabled) */}
                        {config.enabled && (
                          <div className="mt-3 flex items-center gap-2">
                            <Label className="text-xs text-stone-500 whitespace-nowrap">
                              Prix personnalise:
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder={supplement.price.toFixed(2)}
                              value={config.customPrice || ""}
                              onChange={(e) => setCustomPrice(supplement.id, e.target.value)}
                              className="h-8 w-24 text-sm"
                            />
                            <span className="text-xs text-stone-400">TND</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <p className="text-sm text-stone-500">
                {Array.from(selectedSupplements.values()).filter(s => s.enabled).length} supplement(s) selectionne(s)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSupplementsDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSaveSupplements} className="bg-amber-500 hover:bg-amber-600">
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <NotificationContainer />
    </div>
  )
}

export default function MenuAdminPage() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <StockProvider>
          <BreakfastProvider>
            <MenuAdminContent />
          </BreakfastProvider>
        </StockProvider>
      </AuthProvider>
    </NotificationProvider>
  )
}
