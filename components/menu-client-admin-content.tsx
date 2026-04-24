"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { 
  StockProvider, 
  useStock, 
  type Offer, 
  type MenuItem, 
  type MenuCategory,
  type Supplement,
  type Promotion
} from "@/contexts/stock-context"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { NotificationProvider, useNotification } from "@/contexts/notification-context"
import { NotificationContainer } from "@/components/notification-container"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeftIcon,
  PlusIcon,
  EditIcon,
  Trash2Icon,
  GiftIcon,
  CakeIcon,
  TagIcon,
  ClockIcon,
  SearchIcon,
  PercentIcon,
  CoinsIcon,
  ImageIcon,
  SparklesIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  FlameIcon,
  StarIcon,
  UploadIcon,
} from "lucide-react"
import { Pagination } from "@/components/pagination"

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
  
  // Menu Item Management state
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null)
  const [uploadingProductImage, setUploadingProductImage] = useState(false)
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null)
  const [productImageFile, setProductImageFile] = useState<File | null>(null)
  const [productFormData, setProductFormData] = useState({
    name: "",
    description: "",
    price: "",
    points: "",
    category: "",
    image: "",
    allergens: "",
    isAvailable: true,
    hasPromotion: false,
    promotionType: "percentage" as Promotion["type"],
    promotionValue: "",
    promotionLabel: "",
    promotionEndDate: "",
  })
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [newSupplement, setNewSupplement] = useState({ name: "", price: "" })
  
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
  
  // Pagination state for products
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  
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
  
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  
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
  // IMAGE UPLOAD FUNCTIONS
  // ============================================
  
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith('image/')) {
      addNotification({ type: "error", title: "Erreur", message: "Veuillez selectionner une image" })
      return
    }
    
    if (file.size > 2 * 1024 * 1024) {
      addNotification({ type: "error", title: "Erreur", message: "L'image ne doit pas depasser 2MB" })
      return
    }
    
    setUploadingProductImage(true)
    
    try {
      const previewUrl = URL.createObjectURL(file)
      setProductImagePreview(previewUrl)
      setProductImageFile(file)
      setProductFormData(prev => ({ ...prev, image: "" }))
    } catch (error) {
      console.error('Error uploading image:', error)
      addNotification({ type: "error", title: "Erreur", message: "Erreur lors du chargement de l'image" })
    } finally {
      setUploadingProductImage(false)
    }
  }

  const handleRemoveProductImage = () => {
    if (productImagePreview) {
      URL.revokeObjectURL(productImagePreview)
    }
    setProductImagePreview(null)
    setProductImageFile(null)
  }

  const resetProductImage = () => {
    if (productImagePreview) {
      URL.revokeObjectURL(productImagePreview)
    }
    setProductImagePreview(null)
    setProductImageFile(null)
    setUploadingProductImage(false)
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
      category: "",
      image: "",
      allergens: "",
      isAvailable: true,
      hasPromotion: false,
      promotionType: "percentage",
      promotionValue: "",
      promotionLabel: "",
      promotionEndDate: "",
    })
    setSupplements([])
    setNewSupplement({ name: "", price: "" })
    resetProductImage()
  }
  
  const addSupplement = () => {
    if (!newSupplement.name || !newSupplement.price) {
      addNotification({ type: "error", title: "Erreur", message: "Remplissez le nom et le prix du supplement" })
      return
    }
    setSupplements([...supplements, {
      id: Date.now().toString(),
      name: newSupplement.name,
      price: parseFloat(newSupplement.price)
    }])
    setNewSupplement({ name: "", price: "" })
  }

  const removeSupplement = (id: string) => {
    setSupplements(supplements.filter(s => s.id !== id))
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
      allergens: product.allergens?.join(", ") || "",
      isAvailable: product.isAvailable,
      hasPromotion: !!product.promotion,
      promotionType: product.promotion?.type || "percentage",
      promotionValue: product.promotion?.value?.toString() || "",
      promotionLabel: product.promotion?.label || "",
      promotionEndDate: product.promotion?.endDate || "",
    })
    
    if (product.image && !product.image.startsWith('blob:')) {
      const imageUrl = product.image.startsWith('http') 
        ? product.image 
        : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}/menu/${product.image}`
      setProductImagePreview(imageUrl)
      setProductImageFile(null)
    } else {
      setProductImagePreview(null)
      setProductImageFile(null)
    }
    
    setSupplements(product.supplements || [])
    setEditingProduct(product)
    setShowProductDialog(true)
  }
const handleSaveProduct = async () => {
  if (!productFormData.name || !productFormData.description || !productFormData.price || !productFormData.category) {
    addNotification({ type: "error", title: "Erreur", message: "Veuillez remplir tous les champs obligatoires" })
    return
  }

  const allergensArray = productFormData.allergens
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a)

  let promotion: Promotion | undefined
  if (productFormData.hasPromotion) {
    promotion = {
      type: productFormData.promotionType,
      value: productFormData.promotionValue ? parseFloat(productFormData.promotionValue) : undefined,
      label: productFormData.promotionLabel || undefined,
      endDate: productFormData.promotionEndDate || undefined,
    }
  }
  
  const productData = {
    name: productFormData.name,
    description: productFormData.description,
    price: parseFloat(productFormData.price),
    points: productFormData.points ? parseInt(productFormData.points) : undefined,
    category: productFormData.category,
    image: productImageFile || undefined, // Pass File object for upload
    allergens: allergensArray,
    isAvailable: productFormData.isAvailable,
    supplements: supplements.length > 0 ? supplements : undefined,
    promotion,
  }
  
  try {
    if (editingProduct) {
      await updateMenuItem(editingProduct.id, productData)
      addNotification({ type: "success", title: "Produit modifié", message: `Le produit "${productData.name}" a été mis à jour` })
    } else {
      await addMenuItem(productData)
      addNotification({ type: "success", title: "Produit créé", message: `Le produit "${productData.name}" a été ajouté` })
    }
    
    setShowProductDialog(false)
    resetProductForm()
  } catch (error) {
    console.error('Error saving product:', error)
    addNotification({ type: "error", title: "Erreur", message: "Erreur lors de l'enregistrement" })
  }
}
  
  const handleDeleteProduct = () => {
    if (!deleteProductConfirm) return
    deleteMenuItem(deleteProductConfirm.id)
    addNotification({ type: "success", title: "Produit supprime", message: `Le produit a ete supprime` })
    setDeleteProductConfirm(null)
  }
  
  const handleViewPublicMenu = () => {
    window.open("/menu", "_blank")
  }

  const handleResetMenuData = () => {
    if (confirm("Voulez-vous réinitialiser les données du menu avec les exemples par défaut ? Cette action est irréversible.")) {
      localStorage.removeItem("pastry-menu-items")
      localStorage.removeItem("pastry-menu-categories")
      window.location.reload()
    }
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
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleResetMenuData}>
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Reinitialiser
              </Button>
              <Button variant="outline" size="sm" onClick={handleViewPublicMenu}>
                <ExternalLinkIcon className="h-4 w-4 mr-2" />
                Voir menu
              </Button>
              {currentOffers.length > 0 && (
                <Badge className="bg-rose-100 text-rose-700">
                  <SparklesIcon className="h-3 w-3 mr-1" />
                  {currentOffers.length} offre(s) active(s)
                </Badge>
              )}
            </div>
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
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
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
              {paginatedProducts.map(product => {
                const category = menuCategories.find(c => c.id === product.category)
                
                return (
                  <Card key={product.id} className={`overflow-hidden ${!product.isAvailable ? "opacity-60" : ""}`}>
                    <div className="h-28 bg-stone-100 relative">
                      {product.image ? (
                        <img 
                          src={product.image.startsWith('http') ? product.image : `${process.env.NEXT_PUBLIC_API_IMAGE_URL}/menu/${product.image}`} 
                          alt={product.name} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <CakeIcon className="h-10 w-10 text-stone-300" />
                        </div>
                      )}
                      {product.promotion && (
                        <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold text-white ${
                          product.promotion.type === "percentage" ? "bg-red-500" :
                          product.promotion.type === "fixed" ? "bg-orange-500" :
                          product.promotion.type === "offer" ? "bg-green-500" :
                          product.promotion.type === "new" ? "bg-blue-500" :
                          "bg-red-600"
                        }`}>
                          {product.promotion.label || (
                            product.promotion.type === "percentage" ? `-${product.promotion.value}%` :
                            product.promotion.type === "fixed" ? `-${product.promotion.value} TND` :
                            product.promotion.type === "offer" ? "OFFRE" :
                            product.promotion.type === "new" ? "NOUVEAU" :
                            "POPULAIRE"
                          )}
                        </div>
                      )}
                      {product.supplements && product.supplements.length > 0 && (
                        <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                          +{product.supplements.length} options
                        </div>
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
                      
                      {product.allergens && product.allergens.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.allergens.map((allergen) => (
                            <span key={allergen} className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                              {allergen}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          {product.promotion && (product.promotion.type === "percentage" || product.promotion.type === "fixed") && product.promotion.value && (
                            <span className="text-xs text-stone-400 line-through mr-1">{product.price.toFixed(2)}</span>
                          )}
                          <span className="font-bold text-amber-600">
                            {product.promotion?.type === "percentage" && product.promotion.value
                              ? (product.price * (1 - product.promotion.value / 100)).toFixed(2)
                              : product.promotion?.type === "fixed" && product.promotion.value
                              ? (product.price - product.promotion.value).toFixed(2)
                              : product.price.toFixed(2)} TND
                          </span>
                        </div>
                        {product.points && product.points > 0 && (
                          <div className="flex items-center gap-1 text-emerald-600 text-sm">
                            <CoinsIcon className="h-4 w-4" />
                            <span>+{product.points} pts</span>
                          </div>
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
            
            {filteredProducts.length > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredProducts.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(value) => {
                    setItemsPerPage(value)
                    setCurrentPage(1)
                  }}
                />
              </div>
            )}
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
      
      {/* Product Dialog with Image Upload */}
      <Dialog open={showProductDialog} onOpenChange={(open) => {
        setShowProductDialog(open)
        if (!open) resetProductForm()
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Modifier le produit" : "Nouveau produit"}
            </DialogTitle>
            <DialogDescription>
              Ajoutez les details de l'article du menu avec description, suppléments et promotions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de l'article *</Label>
              <Input
                id="name"
                value={productFormData.name}
                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                placeholder="Ex: Croissant Artisanal"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={productFormData.description}
                onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                placeholder="Decrivez l'article en detail..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="price">Prix (TND) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.1"
                  value={productFormData.price}
                  onChange={(e) => setProductFormData({ ...productFormData, price: e.target.value })}
                  placeholder="4.50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="points" className="flex items-center gap-1.5">
                  Points
                  <CoinsIcon className="h-3.5 w-3.5 text-emerald-600" />
                </Label>
                <Input
                  id="points"
                  type="number"
                  value={productFormData.points}
                  onChange={(e) => setProductFormData({ ...productFormData, points: e.target.value })}
                  placeholder="5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categorie *</Label>
                <Select
                  value={productFormData.category}
                  onValueChange={(value) => setProductFormData({ ...productFormData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {menuCategories
                      .filter((cat) => cat.isActive)
                      .sort((a, b) => a.order - b.order)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Photo de l'article</Label>
              <div className="relative">
                {productImagePreview ? (
                  <div className="relative group">
                    <div className="relative h-40 w-full rounded-xl overflow-hidden border-2 border-amber-200 bg-amber-50">
                      <img
                        src={productImagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageUpload}
                          className="hidden"
                        />
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center hover:bg-amber-100 transition-colors">
                          <UploadIcon className="h-5 w-5 text-stone-700" />
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveProductImage}
                        className="h-10 w-10 rounded-full bg-white flex items-center justify-center hover:bg-red-100 transition-colors"
                      >
                        <Trash2Icon className="h-5 w-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProductImageUpload}
                      className="hidden"
                      disabled={uploadingProductImage}
                    />
                    <div className={`h-40 w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${
                      uploadingProductImage 
                        ? "border-amber-300 bg-amber-50" 
                        : "border-stone-300 hover:border-amber-400 hover:bg-amber-50"
                    }`}>
                      {uploadingProductImage ? (
                        <>
                          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center animate-pulse">
                            <UploadIcon className="h-5 w-5 text-amber-600" />
                          </div>
                          <span className="text-sm text-amber-600">Chargement...</span>
                        </>
                      ) : (
                        <>
                          <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-stone-400" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-stone-700">Cliquez pour ajouter une photo</p>
                            <p className="text-xs text-stone-400 mt-1">JPG, PNG ou WEBP (max 2MB)</p>
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergens">Allergenes</Label>
              <Input
                id="allergens"
                value={productFormData.allergens}
                onChange={(e) => setProductFormData({ ...productFormData, allergens: e.target.value })}
                placeholder="Gluten, Lait, Oeufs (separes par des virgules)"
              />
            </div>

            {/* Supplements Section */}
            <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center gap-2">
                <TagIcon className="h-4 w-4 text-blue-600" />
                <Label className="font-medium">Supplements / Options</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Ajoutez des options payantes (ex: Thon +3 TND, Fromage +2 TND)
              </p>
              
              {supplements.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {supplements.map((supp) => (
                    <div key={supp.id} className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm">
                      <span>{supp.name}</span>
                      <span className="font-medium text-blue-700">+{supp.price.toFixed(2)} TND</span>
                      <button
                        type="button"
                        onClick={() => removeSupplement(supp.id)}
                        className="ml-1 text-blue-700 hover:text-red-600"
                      >
                        <Trash2Icon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-2">
                <Input
                  placeholder="Nom (ex: Thon)"
                  value={newSupplement.name}
                  onChange={(e) => setNewSupplement({ ...newSupplement, name: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Prix"
                  value={newSupplement.price}
                  onChange={(e) => setNewSupplement({ ...newSupplement, price: e.target.value })}
                  className="w-24"
                />
                <Button type="button" variant="outline" size="icon" onClick={addSupplement}>
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Promotion Section */}
            <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="h-4 w-4 text-amber-600" />
                  <Label className="font-medium">Promotion / Etiquette</Label>
                </div>
                <input
                  type="checkbox"
                  checked={productFormData.hasPromotion}
                  onChange={(e) => setProductFormData({ ...productFormData, hasPromotion: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
              </div>
              
              {productFormData.hasPromotion && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setProductFormData({ ...productFormData, promotionType: "percentage" })}
                      className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-sm transition ${
                        productFormData.promotionType === "percentage" ? "border-amber-500 bg-amber-50 text-amber-700" : "hover:bg-muted"
                      }`}
                    >
                      <PercentIcon className="h-4 w-4" />
                      Remise %
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductFormData({ ...productFormData, promotionType: "fixed" })}
                      className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-sm transition ${
                        productFormData.promotionType === "fixed" ? "border-amber-500 bg-amber-50 text-amber-700" : "hover:bg-muted"
                      }`}
                    >
                      <TagIcon className="h-4 w-4" />
                      Remise TND
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductFormData({ ...productFormData, promotionType: "offer" })}
                      className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-sm transition ${
                        productFormData.promotionType === "offer" ? "border-green-500 bg-green-50 text-green-700" : "hover:bg-muted"
                      }`}
                    >
                      <GiftIcon className="h-4 w-4" />
                      Offre
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductFormData({ ...productFormData, promotionType: "new" })}
                      className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-sm transition ${
                        productFormData.promotionType === "new" ? "border-blue-500 bg-blue-50 text-blue-700" : "hover:bg-muted"
                      }`}
                    >
                      <StarIcon className="h-4 w-4" />
                      Nouveau
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductFormData({ ...productFormData, promotionType: "popular" })}
                      className={`col-span-2 flex items-center justify-center gap-2 rounded-lg border p-2 text-sm transition ${
                        productFormData.promotionType === "popular" ? "border-red-500 bg-red-50 text-red-700" : "hover:bg-muted"
                      }`}
                    >
                      <FlameIcon className="h-4 w-4" />
                      Populaire
                    </button>
                  </div>
                  
                  {(productFormData.promotionType === "percentage" || productFormData.promotionType === "fixed") && (
                    <div className="space-y-2">
                      <Label>
                        {productFormData.promotionType === "percentage" ? "Pourcentage de remise" : "Montant de remise (TND)"}
                      </Label>
                      <Input
                        type="number"
                        step="1"
                        value={productFormData.promotionValue}
                        onChange={(e) => setProductFormData({ ...productFormData, promotionValue: e.target.value })}
                        placeholder={productFormData.promotionType === "percentage" ? "20" : "5"}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Label personnalise (optionnel)</Label>
                    <Input
                      value={productFormData.promotionLabel}
                      onChange={(e) => setProductFormData({ ...productFormData, promotionLabel: e.target.value })}
                      placeholder="Ex: Offre speciale, Nouveau, etc."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Date de fin (optionnel)</Label>
                    <Input
                      type="date"
                      value={productFormData.promotionEndDate}
                      onChange={(e) => setProductFormData({ ...productFormData, promotionEndDate: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={productFormData.isAvailable}
                onCheckedChange={(checked) => setProductFormData({ ...productFormData, isAvailable: checked })}
              />
              <Label>Article disponible a la vente</Label>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => {
              setShowProductDialog(false)
              resetProductForm()
            }}>
              Annuler
            </Button>
            <Button onClick={handleSaveProduct} className="bg-amber-500 hover:bg-amber-600">
              {editingProduct ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
      
      {/* Delete Confirmations */}
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
export { MenuClientAdminContent }

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