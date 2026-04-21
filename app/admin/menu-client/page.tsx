"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  StockProvider, 
  useStock, 
  type Offer, 
  type MenuItem, 
  type MenuCategory,
  type OfferSchedule 
} from "@/contexts/stock-context"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { NotificationProvider, useNotification } from "@/contexts/notification-context"
import { NotificationContainer } from "@/components/notification-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeftIcon,
  PlusIcon,
  EditIcon,
  Trash2Icon,
  GiftIcon,
  CakeIcon,
  TagIcon,
  CalendarIcon,
  ClockIcon,
  SearchIcon,
  PackageIcon,
  PercentIcon,
  CoinsIcon,
  ImageIcon,
  SparklesIcon,
} from "lucide-react"

const DAYS_OF_WEEK = [
  { value: 0, label: "Dim" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
]

function MenuClientAdminContent() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { addNotification } = useNotification()
  const {
    offers,
    addOffer,
    updateOffer,
    deleteOffer,
    getCurrentOffers,
    menuItems,
    menuCategories,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    addMenuCategory,
    updateMenuCategory,
    deleteMenuCategory,
  } = useStock()

  // Tab state
  const [activeTab, setActiveTab] = useState("offers")
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  
  // Offer dialog state
  const [showOfferDialog, setShowOfferDialog] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const [offerFormData, setOfferFormData] = useState({
    name: "",
    description: "",
    image: "",
    originalPrice: "",
    discountedPrice: "",
    points: "",
    daysOfWeek: [1, 2, 3, 4, 5] as number[],
    startTime: "08:00",
    endTime: "18:00",
    validFrom: "",
    validUntil: "",
    maxPerDay: "",
    isActive: true,
  })
  
  // Product dialog state
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null)
  const [productFormData, setProductFormData] = useState({
    name: "",
    description: "",
    price: "",
    points: "",
    category: "",
    image: "",
    isAvailable: true,
  })
  
  // Category dialog state
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null)
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    slug: "",
    icon: "",
    order: "",
    isActive: true,
  })
  
  // Delete confirmations
  const [deleteOfferConfirm, setDeleteOfferConfirm] = useState<Offer | null>(null)
  const [deleteProductConfirm, setDeleteProductConfirm] = useState<MenuItem | null>(null)
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<MenuCategory | null>(null)
  
  // Filtered data
  const filteredOffers = useMemo(() => {
    if (!searchQuery) return offers
    const query = searchQuery.toLowerCase()
    return offers.filter(o => 
      o.name.toLowerCase().includes(query) || 
      o.description?.toLowerCase().includes(query)
    )
  }, [offers, searchQuery])
  
  const filteredProducts = useMemo(() => {
    let products = menuItems
    if (categoryFilter !== "all") {
      products = products.filter(p => p.category === categoryFilter)
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      products = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      )
    }
    return products
  }, [menuItems, categoryFilter, searchQuery])
  
  // Current offers
  const currentOffers = useMemo(() => getCurrentOffers(), [getCurrentOffers])
  
  // Check admin access
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Acces refuse</h2>
          <p className="text-stone-600 mb-4">Vous devez etre administrateur pour acceder a cette page.</p>
          <Button onClick={() => router.push("/admin")}>Retour</Button>
        </Card>
      </div>
    )
  }
  
  // ============================================
  // OFFER FUNCTIONS
  // ============================================
  
  const resetOfferForm = () => {
    setOfferFormData({
      name: "",
      description: "",
      image: "",
      originalPrice: "",
      discountedPrice: "",
      points: "",
      daysOfWeek: [1, 2, 3, 4, 5],
      startTime: "08:00",
      endTime: "18:00",
      validFrom: "",
      validUntil: "",
      maxPerDay: "",
      isActive: true,
    })
  }
  
  const handleOpenAddOffer = () => {
    resetOfferForm()
    setEditingOffer(null)
    setShowOfferDialog(true)
  }
  
  const handleOpenEditOffer = (offer: Offer) => {
    setOfferFormData({
      name: offer.name,
      description: offer.description,
      image: offer.image || "",
      originalPrice: offer.originalPrice.toString(),
      discountedPrice: offer.discountedPrice.toString(),
      points: offer.points.toString(),
      daysOfWeek: offer.schedule.daysOfWeek,
      startTime: offer.schedule.startTime,
      endTime: offer.schedule.endTime,
      validFrom: offer.validFrom || "",
      validUntil: offer.validUntil || "",
      maxPerDay: offer.maxPerDay?.toString() || "",
      isActive: offer.isActive,
    })
    setEditingOffer(offer)
    setShowOfferDialog(true)
  }
  
  const handleSaveOffer = () => {
    if (!offerFormData.name || !offerFormData.discountedPrice) {
      addNotification({ type: "error", title: "Erreur", message: "Veuillez remplir les champs obligatoires" })
      return
    }
    
    const offerData = {
      name: offerFormData.name,
      description: offerFormData.description,
      image: offerFormData.image || undefined,
      originalPrice: parseFloat(offerFormData.originalPrice) || 0,
      discountedPrice: parseFloat(offerFormData.discountedPrice),
      points: parseInt(offerFormData.points) || 0,
      items: editingOffer?.items || [],
      schedule: {
        daysOfWeek: offerFormData.daysOfWeek,
        startTime: offerFormData.startTime,
        endTime: offerFormData.endTime,
      },
      validFrom: offerFormData.validFrom || undefined,
      validUntil: offerFormData.validUntil || undefined,
      maxPerDay: offerFormData.maxPerDay ? parseInt(offerFormData.maxPerDay) : undefined,
      isActive: offerFormData.isActive,
    }
    
    if (editingOffer) {
      updateOffer(editingOffer.id, offerData)
      addNotification({ type: "success", title: "Offre modifiee", message: `L'offre "${offerData.name}" a ete mise a jour` })
    } else {
      addOffer(offerData)
      addNotification({ type: "success", title: "Offre creee", message: `L'offre "${offerData.name}" a ete ajoutee` })
    }
    
    setShowOfferDialog(false)
    resetOfferForm()
  }
  
  const handleDeleteOffer = () => {
    if (!deleteOfferConfirm) return
    deleteOffer(deleteOfferConfirm.id)
    addNotification({ type: "success", title: "Offre supprimee", message: `L'offre a ete supprimee` })
    setDeleteOfferConfirm(null)
  }
  
  // ============================================
  // PRODUCT FUNCTIONS
  // ============================================
  
  const resetProductForm = () => {
    setProductFormData({
      name: "",
      description: "",
      price: "",
      points: "",
      category: menuCategories[0]?.id || "",
      image: "",
      isAvailable: true,
    })
  }
  
  const handleOpenAddProduct = () => {
    resetProductForm()
    setEditingProduct(null)
    setShowProductDialog(true)
  }
  
  const handleOpenEditProduct = (product: MenuItem) => {
    setProductFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      points: product.points?.toString() || "",
      category: product.category,
      image: product.image || "",
      isAvailable: product.isAvailable,
    })
    setEditingProduct(product)
    setShowProductDialog(true)
  }
  
  const handleSaveProduct = () => {
    if (!productFormData.name || !productFormData.price || !productFormData.category) {
      addNotification({ type: "error", title: "Erreur", message: "Veuillez remplir les champs obligatoires" })
      return
    }
    
    const productData = {
      name: productFormData.name,
      description: productFormData.description,
      price: parseFloat(productFormData.price),
      points: parseInt(productFormData.points) || 0,
      category: productFormData.category,
      image: productFormData.image || undefined,
      allergens: editingProduct?.allergens || [],
      isAvailable: productFormData.isAvailable,
    }
    
    if (editingProduct) {
      updateMenuItem(editingProduct.id, productData)
      addNotification({ type: "success", title: "Produit modifie", message: `Le produit "${productData.name}" a ete mis a jour` })
    } else {
      addMenuItem(productData)
      addNotification({ type: "success", title: "Produit cree", message: `Le produit "${productData.name}" a ete ajoute` })
    }
    
    setShowProductDialog(false)
    resetProductForm()
  }
  
  const handleDeleteProduct = () => {
    if (!deleteProductConfirm) return
    deleteMenuItem(deleteProductConfirm.id)
    addNotification({ type: "success", title: "Produit supprime", message: `Le produit a ete supprime` })
    setDeleteProductConfirm(null)
  }
  
  // ============================================
  // CATEGORY FUNCTIONS
  // ============================================
  
  const resetCategoryForm = () => {
    setCategoryFormData({
      name: "",
      slug: "",
      icon: "",
      order: (menuCategories.length + 1).toString(),
      isActive: true,
    })
  }
  
  const handleOpenAddCategory = () => {
    resetCategoryForm()
    setEditingCategory(null)
    setShowCategoryDialog(true)
  }
  
  const handleOpenEditCategory = (category: MenuCategory) => {
    setCategoryFormData({
      name: category.name,
      slug: category.slug,
      icon: category.icon || "",
      order: category.order.toString(),
      isActive: category.isActive,
    })
    setEditingCategory(category)
    setShowCategoryDialog(true)
  }
  
  const handleSaveCategory = () => {
    if (!categoryFormData.name) {
      addNotification({ type: "error", title: "Erreur", message: "Veuillez entrer un nom" })
      return
    }
    
    const slug = categoryFormData.slug || categoryFormData.name.toLowerCase().replace(/\s+/g, "-")
    const categoryData = {
      name: categoryFormData.name,
      slug,
      icon: categoryFormData.icon || undefined,
      order: parseInt(categoryFormData.order) || 1,
      isActive: categoryFormData.isActive,
    }
    
    if (editingCategory) {
      updateMenuCategory(editingCategory.id, categoryData)
      addNotification({ type: "success", title: "Categorie modifiee", message: `La categorie a ete mise a jour` })
    } else {
      addMenuCategory(categoryData)
      addNotification({ type: "success", title: "Categorie creee", message: `La categorie a ete ajoutee` })
    }
    
    setShowCategoryDialog(false)
    resetCategoryForm()
  }
  
  const handleDeleteCategory = () => {
    if (!deleteCategoryConfirm) return
    // Check if products use this category
    const productsInCategory = menuItems.filter(p => p.category === deleteCategoryConfirm.id).length
    if (productsInCategory > 0) {
      addNotification({ type: "error", title: "Impossible", message: `${productsInCategory} produit(s) utilisent cette categorie` })
      setDeleteCategoryConfirm(null)
      return
    }
    deleteMenuCategory(deleteCategoryConfirm.id)
    addNotification({ type: "success", title: "Categorie supprimee", message: `La categorie a ete supprimee` })
    setDeleteCategoryConfirm(null)
  }
  
  const toggleDayOfWeek = (day: number) => {
    setOfferFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort()
    }))
  }
  
  return (
    <div className="min-h-screen bg-stone-100">
      <NotificationContainer />
      
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Menu Client</h1>
                <p className="text-sm text-stone-500">Gerez les offres, produits et categories</p>
              </div>
            </div>
            
            {/* Current Offers Badge */}
            {currentOffers.length > 0 && (
              <Badge className="bg-rose-100 text-rose-700">
                <SparklesIcon className="h-3 w-3 mr-1" />
                {currentOffers.length} offre(s) active(s)
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="offers" className="flex items-center gap-2">
              <GiftIcon className="h-4 w-4" />
              Offres ({offers.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <CakeIcon className="h-4 w-4" />
              Produits ({menuItems.length})
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <TagIcon className="h-4 w-4" />
              Categories ({menuCategories.length})
            </TabsTrigger>
          </TabsList>
          
          {/* Offers Tab */}
          <TabsContent value="offers">
            <div className="flex items-center justify-between mb-4">
              <div className="relative flex-1 max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une offre..."
                  className="pl-10"
                />
              </div>
              <Button onClick={handleOpenAddOffer} className="bg-rose-500 hover:bg-rose-600 text-white">
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvelle offre
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map(offer => {
                const savings = offer.originalPrice - offer.discountedPrice
                const savingsPercent = offer.originalPrice > 0 ? Math.round((savings / offer.originalPrice) * 100) : 0
                const isCurrentlyActive = currentOffers.some(o => o.id === offer.id)
                
                return (
                  <Card key={offer.id} className={`overflow-hidden ${!offer.isActive ? "opacity-60" : ""}`}>
                    <div className="h-32 bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center relative">
                      <GiftIcon className="h-12 w-12 text-rose-300" />
                      {isCurrentlyActive && (
                        <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                          En cours
                        </Badge>
                      )}
                      {savingsPercent > 0 && (
                        <Badge className="absolute top-2 left-2 bg-rose-500 text-white">
                          -{savingsPercent}%
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-stone-900">{offer.name}</h3>
                          <p className="text-sm text-stone-500 line-clamp-2">{offer.description}</p>
                        </div>
                        <Switch
                          checked={offer.isActive}
                          onCheckedChange={(checked) => updateOffer(offer.id, { isActive: checked })}
                        />
                      </div>
                      
                      {/* Schedule */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {DAYS_OF_WEEK.map(day => (
                          <Badge
                            key={day.value}
                            variant={offer.schedule.daysOfWeek.includes(day.value) ? "default" : "outline"}
                            className="text-xs"
                          >
                            {day.label}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
                        <ClockIcon className="h-3 w-3" />
                        <span>{offer.schedule.startTime} - {offer.schedule.endTime}</span>
                      </div>
                      
                      {/* Price */}
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <span className="text-lg font-bold text-rose-600">{offer.discountedPrice.toFixed(2)} TND</span>
                          {offer.originalPrice > offer.discountedPrice && (
                            <span className="text-sm text-stone-400 line-through ml-2">{offer.originalPrice.toFixed(2)}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 text-sm">
                          <CoinsIcon className="h-4 w-4" />
                          <span>+{offer.points} pts</span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditOffer(offer)} className="flex-1">
                          <EditIcon className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteOfferConfirm(offer)} className="text-red-500 hover:text-red-600">
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {filteredOffers.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <GiftIcon className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-stone-700">Aucune offre</h3>
                  <p className="text-stone-500">Creez votre premiere offre pour attirer les clients</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex items-center justify-between mb-4 gap-4">
              <div className="relative flex-1 max-w-md">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les categories</SelectItem>
                  {menuCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleOpenAddProduct} className="bg-amber-500 hover:bg-amber-600 text-white">
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouveau produit
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map(product => {
                const category = menuCategories.find(c => c.id === product.category)
                
                return (
                  <Card key={product.id} className={`overflow-hidden ${!product.isAvailable ? "opacity-60" : ""}`}>
                    <div className="h-28 bg-stone-100 flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                      ) : (
                        <CakeIcon className="h-10 w-10 text-stone-300" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-stone-900 truncate">{product.name}</h3>
                          {category && (
                            <Badge variant="outline" className="text-xs mt-1">{category.name}</Badge>
                          )}
                        </div>
                        <Switch
                          checked={product.isAvailable}
                          onCheckedChange={(checked) => updateMenuItem(product.id, { isAvailable: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-amber-600">{product.price.toFixed(2)} TND</span>
                        {product.points && product.points > 0 && (
                          <span className="text-sm text-emerald-600">+{product.points} pts</span>
                        )}
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditProduct(product)} className="flex-1">
                          <EditIcon className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setDeleteProductConfirm(product)} className="text-red-500 hover:text-red-600">
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <CakeIcon className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-stone-700">Aucun produit</h3>
                  <p className="text-stone-500">Ajoutez des produits a votre menu</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Categories Tab */}
          <TabsContent value="categories">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Categories de produits</h2>
              <Button onClick={handleOpenAddCategory} className="bg-stone-800 hover:bg-stone-900 text-white">
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouvelle categorie
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {menuCategories.sort((a, b) => a.order - b.order).map(category => {
                const productCount = menuItems.filter(p => p.category === category.id).length
                
                return (
                  <Card key={category.id} className={`${!category.isActive ? "opacity-60" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center text-xl">
                            {category.icon || <TagIcon className="h-5 w-5 text-stone-400" />}
                          </div>
                          <div>
                            <h3 className="font-medium text-stone-900">{category.name}</h3>
                            <p className="text-sm text-stone-500">{productCount} produit(s) - Ordre: {category.order}</p>
                          </div>
                        </div>
                        <Switch
                          checked={category.isActive}
                          onCheckedChange={(checked) => updateMenuCategory(category.id, { isActive: checked })}
                        />
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditCategory(category)} className="flex-1">
                          <EditIcon className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setDeleteCategoryConfirm(category)} 
                          className="text-red-500 hover:text-red-600"
                          disabled={productCount > 0}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOffer ? "Modifier l'offre" : "Nouvelle offre"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l&apos;offre *</Label>
              <Input
                value={offerFormData.name}
                onChange={(e) => setOfferFormData({ ...offerFormData, name: e.target.value })}
                placeholder="Ex: Petit Dejeuner Complet"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={offerFormData.description}
                onChange={(e) => setOfferFormData({ ...offerFormData, description: e.target.value })}
                placeholder="Decrivez l'offre..."
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix original (TND)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={offerFormData.originalPrice}
                  onChange={(e) => setOfferFormData({ ...offerFormData, originalPrice: e.target.value })}
                  placeholder="12.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Prix reduit (TND) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={offerFormData.discountedPrice}
                  onChange={(e) => setOfferFormData({ ...offerFormData, discountedPrice: e.target.value })}
                  placeholder="9.90"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Points fidelite</Label>
              <Input
                type="number"
                value={offerFormData.points}
                onChange={(e) => setOfferFormData({ ...offerFormData, points: e.target.value })}
                placeholder="15"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Jours de la semaine</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDayOfWeek(day.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      offerFormData.daysOfWeek.includes(day.value)
                        ? "bg-rose-500 text-white"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Heure de debut</Label>
                <Input
                  type="time"
                  value={offerFormData.startTime}
                  onChange={(e) => setOfferFormData({ ...offerFormData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Heure de fin</Label>
                <Input
                  type="time"
                  value={offerFormData.endTime}
                  onChange={(e) => setOfferFormData({ ...offerFormData, endTime: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de debut (optionnel)</Label>
                <Input
                  type="date"
                  value={offerFormData.validFrom}
                  onChange={(e) => setOfferFormData({ ...offerFormData, validFrom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin (optionnel)</Label>
                <Input
                  type="date"
                  value={offerFormData.validUntil}
                  onChange={(e) => setOfferFormData({ ...offerFormData, validUntil: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={offerFormData.isActive}
                onCheckedChange={(checked) => setOfferFormData({ ...offerFormData, isActive: checked })}
              />
              <Label>Offre active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfferDialog(false)}>Annuler</Button>
            <Button onClick={handleSaveOffer} className="bg-rose-500 hover:bg-rose-600">
              {editingOffer ? "Enregistrer" : "Creer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Modifier le produit" : "Nouveau produit"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du produit *</Label>
              <Input
                value={productFormData.name}
                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                placeholder="Ex: Croissant Artisanal"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={productFormData.description}
                onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                placeholder="Description du produit..."
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix (TND) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={productFormData.price}
                  onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                  placeholder="4.50"
                />
              </div>
              <div className="space-y-2">
                <Label>Points fidelite</Label>
                <Input
                  type="number"
                  value={productFormData.points}
                  onChange={(e) => setProductFormData({ ...productFormData, points: e.target.value })}
                  placeholder="5"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Categorie *</Label>
              <Select
                value={productFormData.category}
                onValueChange={(value) => setProductFormData({ ...productFormData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une categorie" />
                </SelectTrigger>
                <SelectContent>
                  {menuCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>URL de l&apos;image (optionnel)</Label>
              <Input
                value={productFormData.image}
                onChange={(e) => setProductFormData({ ...productFormData, image: e.target.value })}
                placeholder="/images/croissant.jpg"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={productFormData.isAvailable}
                onCheckedChange={(checked) => setProductFormData({ ...productFormData, isAvailable: checked })}
              />
              <Label>Disponible a la vente</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>Annuler</Button>
            <Button onClick={handleSaveProduct} className="bg-amber-500 hover:bg-amber-600">
              {editingProduct ? "Enregistrer" : "Creer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Category Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Modifier la categorie" : "Nouvelle categorie"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la categorie *</Label>
              <Input
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                placeholder="Ex: Viennoiseries"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Icone (emoji)</Label>
                <Input
                  value={categoryFormData.icon}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                  placeholder="🥐"
                />
              </div>
              <div className="space-y-2">
                <Label>Ordre d&apos;affichage</Label>
                <Input
                  type="number"
                  value={categoryFormData.order}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, order: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={categoryFormData.isActive}
                onCheckedChange={(checked) => setCategoryFormData({ ...categoryFormData, isActive: checked })}
              />
              <Label>Categorie active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>Annuler</Button>
            <Button onClick={handleSaveCategory} className="bg-stone-800 hover:bg-stone-900">
              {editingCategory ? "Enregistrer" : "Creer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Offer Confirmation */}
      <Dialog open={!!deleteOfferConfirm} onOpenChange={() => setDeleteOfferConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2Icon className="h-5 w-5" />
              Supprimer l&apos;offre
            </DialogTitle>
          </DialogHeader>
          <p className="text-stone-600 py-4">
            Etes-vous sur de vouloir supprimer <strong>{deleteOfferConfirm?.name}</strong> ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOfferConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteOffer}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Product Confirmation */}
      <Dialog open={!!deleteProductConfirm} onOpenChange={() => setDeleteProductConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2Icon className="h-5 w-5" />
              Supprimer le produit
            </DialogTitle>
          </DialogHeader>
          <p className="text-stone-600 py-4">
            Etes-vous sur de vouloir supprimer <strong>{deleteProductConfirm?.name}</strong> ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProductConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteProduct}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Category Confirmation */}
      <Dialog open={!!deleteCategoryConfirm} onOpenChange={() => setDeleteCategoryConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2Icon className="h-5 w-5" />
              Supprimer la categorie
            </DialogTitle>
          </DialogHeader>
          <p className="text-stone-600 py-4">
            Etes-vous sur de vouloir supprimer <strong>{deleteCategoryConfirm?.name}</strong> ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategoryConfirm(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleDeleteCategory}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function MenuClientAdminPage() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <StockProvider>
          <MenuClientAdminContent />
        </StockProvider>
      </AuthProvider>
    </NotificationProvider>
  )
}
