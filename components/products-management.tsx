"use client"

import { useState } from "react"
import { useStock } from "@/contexts/stock-context"
import { useNotification } from "@/contexts/notification-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  SearchIcon, 
  PackageIcon,
  ArchiveIcon,
  ArrowLeftIcon,
  AlertTriangleIcon,
  CalendarIcon,
  LayersIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BoxIcon,
  MapPinIcon,
  FolderIcon
} from "lucide-react"
import type { Product, Batch } from "@/contexts/stock-context"

interface ProductsManagementProps {
  selectedSubCategoryId?: string
  onBack?: () => void
}

export function ProductsManagement({ selectedSubCategoryId, onBack }: ProductsManagementProps) {
  const { 
    stockCategories, 
    subCategories, 
    products, 
    suppliers,
    batches,
    storageLocations,
    getActiveStorageLocations,
    addProduct, 
    updateProduct, 
    deleteProduct,
    getProductsBySubCategoryId,
    getProductStock,
    addBatch,
    updateBatch,
    deleteBatch,
    openBatch,
    getBatchesByProduct,
    getActiveBatches
  } = useStock()
  const { addNotification } = useNotification()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [filterSubCategoryId, setFilterSubCategoryId] = useState<string>(selectedSubCategoryId || "all")
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [selectedProductForBatch, setSelectedProductForBatch] = useState<Product | null>(null)
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "product" | "batch"; id: string } | null>(null)
  
  const [productForm, setProductForm] = useState({
    categoryId: "", // For filtering sub-categories
    subCategoryId: selectedSubCategoryId || "",
    name: "",
    description: "",
    unit: "kg" as Product["unit"],
    minQuantity: 5,
    unitPrice: 0,
    shelfLifeAfterOpening: 30,
    supplierId: "",
    defaultLocationId: "",
    isActive: true,
  })

  const [batchForm, setBatchForm] = useState({
    productId: "",
    supplierId: "",
    locationId: "",
    batchNumber: "",
    quantity: 1,
    unitCost: 0,
    receptionDate: new Date().toISOString().split("T")[0],
    productionDate: "",
    expirationDate: "",
    notes: "",
  })

  const unitOptions = [
    { value: "kg", label: "Kilogramme (kg)" },
    { value: "g", label: "Gramme (g)" },
    { value: "L", label: "Litre (L)" },
    { value: "ml", label: "Millilitre (ml)" },
    { value: "pieces", label: "Pieces" },
    { value: "sachets", label: "Sachets" },
    { value: "boites", label: "Boites" },
  ]

  const selectedSubCategory = subCategories.find(s => s.id === selectedSubCategoryId)
  const selectedCategory = selectedSubCategory 
    ? stockCategories.find(c => c.id === selectedSubCategory.categoryId) 
    : null

  const filteredProducts = (filterSubCategoryId === "all" 
    ? products 
    : getProductsBySubCategoryId(filterSubCategoryId)
  )
    .filter(prod => prod.name.toLowerCase().includes(searchQuery.toLowerCase()))

  const toggleProductExpand = (productId: string) => {
    const newExpanded = new Set(expandedProducts)
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId)
    } else {
      newExpanded.add(productId)
    }
    setExpandedProducts(newExpanded)
  }

  // Product CRUD
  const resetProductForm = () => {
    // If a subCategoryId is selected, find its categoryId
    const selectedSub = subCategories.find(s => s.id === selectedSubCategoryId)
    setProductForm({
      categoryId: selectedSub?.categoryId || "",
      subCategoryId: selectedSubCategoryId || "",
      name: "",
      description: "",
      unit: "kg",
      minQuantity: 5,
      unitPrice: 0,
      shelfLifeAfterOpening: 30,
      supplierId: "",
      defaultLocationId: "",
      isActive: true,
    })
    setEditingProduct(null)
  }

  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      // Find the categoryId from the product's subCategoryId
      const sub = subCategories.find(s => s.id === product.subCategoryId)
      setProductForm({
        categoryId: sub?.categoryId || "",
        subCategoryId: product.subCategoryId,
        name: product.name,
        description: product.description || "",
        unit: product.unit,
        minQuantity: product.minQuantity,
        unitPrice: product.unitPrice,
        shelfLifeAfterOpening: product.shelfLifeAfterOpening || 30,
        supplierId: product.supplierId || "",
        defaultLocationId: product.defaultLocationId || "",
        isActive: product.isActive,
      })
    } else {
      resetProductForm()
    }
    setIsProductDialogOpen(true)
  }

  const handleProductSubmit = () => {
    if (!productForm.name.trim()) {
      addNotification("Le nom du produit est requis", "error")
      return
    }
    if (!productForm.categoryId) {
      addNotification("Veuillez selectionner une categorie", "error")
      return
    }
    if (!productForm.subCategoryId) {
      addNotification("Veuillez selectionner une sous-categorie", "error")
      return
    }

    // Don't include categoryId in the product data (it's derived from subCategoryId)
    const productData = {
      subCategoryId: productForm.subCategoryId,
      name: productForm.name,
      description: productForm.description,
      unit: productForm.unit,
      minQuantity: productForm.minQuantity,
      unitPrice: productForm.unitPrice,
      shelfLifeAfterOpening: productForm.shelfLifeAfterOpening,
      supplierId: productForm.supplierId,
      defaultLocationId: productForm.defaultLocationId,
      isActive: productForm.isActive,
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, productData)
      addNotification("Produit modifie avec succes", "success")
    } else {
      addProduct(productData)
      addNotification("Produit ajoute avec succes", "success")
    }

    setIsProductDialogOpen(false)
    resetProductForm()
  }

  const handleDeleteProduct = (id: string) => {
    const batchCount = getBatchesByProduct(id).length
    if (batchCount > 0) {
      addNotification(`Ce produit a ${batchCount} lots. Supprimez-les d'abord.`, "error")
      setDeleteConfirm(null)
      return
    }
    deleteProduct(id)
    addNotification("Produit supprime", "success")
    setDeleteConfirm(null)
  }

  // Batch CRUD
  const resetBatchForm = () => {
    // Get default location from product if available
    const defaultLocation = selectedProductForBatch?.defaultLocationId || ""
    setBatchForm({
      productId: selectedProductForBatch?.id || "",
      supplierId: "",
      locationId: defaultLocation,
      batchNumber: `LOT-${Date.now().toString().slice(-6)}`,
      quantity: 1,
      unitCost: selectedProductForBatch?.unitPrice || 0,
      receptionDate: new Date().toISOString().split("T")[0],
      productionDate: "",
      expirationDate: "",
      notes: "",
    })
    setEditingBatch(null)
  }

  const openBatchDialog = (product: Product, batch?: Batch) => {
    setSelectedProductForBatch(product)
    if (batch) {
      setEditingBatch(batch)
      setBatchForm({
        productId: batch.productId,
        supplierId: batch.supplierId || "",
        locationId: batch.locationId || "",
        batchNumber: batch.batchNumber,
        quantity: batch.quantity,
        unitCost: batch.unitCost || 0,
        receptionDate: batch.receptionDate,
        productionDate: batch.productionDate || "",
        expirationDate: batch.expirationDate,
        notes: batch.notes || "",
      })
    } else {
      resetBatchForm()
      setBatchForm(prev => ({ 
        ...prev, 
        productId: product.id,
        locationId: product.defaultLocationId || "",
        unitCost: product.unitPrice || 0
      }))
    }
    setIsBatchDialogOpen(true)
  }

  const handleBatchSubmit = () => {
    if (!batchForm.batchNumber.trim()) {
      addNotification("Le numero de lot est requis", "error")
      return
    }
    if (!batchForm.expirationDate) {
      addNotification("La date d'expiration est requise", "error")
      return
    }
    if (batchForm.quantity <= 0) {
      addNotification("La quantite doit etre positive", "error")
      return
    }

    if (editingBatch) {
      updateBatch(editingBatch.id, {
        ...batchForm,
        isOpened: editingBatch.isOpened,
        openingDate: editingBatch.openingDate,
        expirationAfterOpening: editingBatch.expirationAfterOpening,
      })
      addNotification("Lot modifie avec succes", "success")
    } else {
      addBatch({
        ...batchForm,
        isOpened: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      addNotification("Lot ajoute avec succes", "success")
    }

    setIsBatchDialogOpen(false)
    resetBatchForm()
    setSelectedProductForBatch(null)
  }

  const handleOpenBatch = (batchId: string) => {
    openBatch(batchId, new Date().toISOString().split("T")[0])
    addNotification("Lot marque comme ouvert", "success")
  }

  const handleDeleteBatch = (id: string) => {
    deleteBatch(id)
    addNotification("Lot supprime", "success")
    setDeleteConfirm(null)
  }

  const getSubCategoryName = (subCategoryId: string) => {
    return subCategories.find(s => s.id === subCategoryId)?.name || "—"
  }

  const getCategoryForSubCategory = (subCategoryId: string) => {
    const sub = subCategories.find(s => s.id === subCategoryId)
    return stockCategories.find(c => c.id === sub?.categoryId)
  }

  const getSupplierName = (supplierId?: string) => {
    if (!supplierId) return "—"
    return suppliers.find(s => s.id === supplierId)?.name || "—"
  }

  const getDaysUntilExpiration = (date: string) => {
    const today = new Date()
    const exp = new Date(date)
    return Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="icon" onClick={onBack}>
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              {selectedCategory && (
                <>
                  <span className="text-lg">{selectedCategory.icon}</span>
                  <span className="text-muted-foreground">/</span>
                </>
              )}
              <h2 className="text-2xl font-bold text-foreground">
                {selectedSubCategory ? selectedSubCategory.name : "Produits"}
              </h2>
            </div>
            <p className="text-muted-foreground">
              Gerez vos produits et leurs lots (FIFO)
            </p>
          </div>
        </div>
        <Button onClick={() => openProductDialog()} className="gap-2 bg-green-600 hover:bg-green-700">
          <PlusIcon className="h-4 w-4" />
          Nouveau Produit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <PackageIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">{filteredProducts.length}</p>
              <p className="text-sm text-green-600">Produits</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BoxIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">
                {filteredProducts.reduce((sum, p) => sum + getBatchesByProduct(p.id).length, 0)}
              </p>
              <p className="text-sm text-blue-600">Lots en stock</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangleIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-900">
                {filteredProducts.filter(p => getProductStock(p.id) <= p.minQuantity).length}
              </p>
              <p className="text-sm text-amber-600">Stock faible</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {!selectedSubCategoryId && (
          <Select value={filterSubCategoryId} onValueChange={setFilterSubCategoryId}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Toutes sous-categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes sous-categories</SelectItem>
              {subCategories.map(sub => (
                <SelectItem key={sub.id} value={sub.id}>
                  {sub.icon} {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Products List */}
      <div className="space-y-4">
        {filteredProducts.map((product) => {
          const stock = getProductStock(product.id)
          const productBatches = getBatchesByProduct(product.id)
          const isLowStock = stock <= product.minQuantity
          const isExpanded = expandedProducts.has(product.id)
          const category = getCategoryForSubCategory(product.subCategoryId)

          return (
            <Card key={product.id} className={`overflow-hidden ${!product.isActive ? "opacity-60" : ""}`}>
              {/* Product Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleProductExpand(product.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button className="p-1 hover:bg-muted rounded">
                      {isExpanded ? (
                        <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg text-foreground">{product.name}</h3>
                        {isLowStock && (
                          <Badge variant="destructive" className="text-xs">Stock faible</Badge>
                        )}
                        {!product.isActive && (
                          <Badge variant="secondary" className="text-xs">Inactif</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {category?.icon} {getSubCategoryName(product.subCategoryId)} 
                        {product.description && ` • ${product.description}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`text-xl font-bold ${isLowStock ? "text-red-600" : "text-foreground"}`}>
                        {stock} {product.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Min: {product.minQuantity} {product.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{product.unitPrice.toFixed(2)} TND</p>
                      <p className="text-xs text-muted-foreground">/{product.unit}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {productBatches.length} lots
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-1"
                        onClick={() => openBatchDialog(product)}
                      >
                        <PlusIcon className="h-3 w-3" />
                        Lot
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => openProductDialog(product)}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:bg-red-50"
                        onClick={() => setDeleteConfirm({ type: "product", id: product.id })}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Batches (FIFO) */}
              {isExpanded && (
                <div className="border-t bg-muted/30">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                        <LayersIcon className="h-4 w-4" />
                        Lots en stock (FIFO - Premier entre, Premier sorti)
                      </h4>
                    </div>

                    {productBatches.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucun lot pour ce produit. Ajoutez un lot pour commencer.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {productBatches.map((batch, index) => {
                          const daysLeft = getDaysUntilExpiration(
                            batch.isOpened && batch.expirationAfterOpening 
                              ? batch.expirationAfterOpening 
                              : batch.expirationDate
                          )
                          const isExpiringSoon = daysLeft <= 7
                          const isExpired = daysLeft < 0

                          return (
                            <div 
                              key={batch.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                isExpired 
                                  ? "bg-red-50 border-red-200" 
                                  : isExpiringSoon 
                                    ? "bg-amber-50 border-amber-200" 
                                    : "bg-background border-border"
                              }`}
                            >
                              <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{batch.batchNumber}</span>
                                    {batch.isOpened && (
                                      <Badge variant="outline" className="text-xs">Ouvert</Badge>
                                    )}
                                    {index === 0 && !batch.isOpened && (
                                      <Badge className="text-xs bg-green-100 text-green-700">A utiliser</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                    <span className="flex items-center gap-1">
                                      <CalendarIcon className="h-3 w-3" />
                                      Recu: {new Date(batch.receptionDate).toLocaleDateString("fr-FR")}
                                    </span>
                                    {batch.supplierId && (
                                      <span>Fournisseur: {getSupplierName(batch.supplierId)}</span>
                                    )}
                                    {batch.locationId && (
                                      <span className="flex items-center gap-1">
                                        <MapPinIcon className="h-3 w-3 text-green-600" />
                                        {(storageLocations || []).find(l => l.id === batch.locationId)?.name || ""}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-6">
                                <div className="text-right">
                                  <p className="font-semibold">{batch.quantity} {product.unit}</p>
                                </div>
                                <div className="text-right min-w-[100px]">
                                  <p className={`text-sm font-medium ${
                                    isExpired ? "text-red-600" : isExpiringSoon ? "text-amber-600" : "text-foreground"
                                  }`}>
                                    {isExpired 
                                      ? "Expire!" 
                                      : daysLeft === 0 
                                        ? "Expire aujourd'hui" 
                                        : `${daysLeft} jours`}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    DLC: {new Date(
                                      batch.isOpened && batch.expirationAfterOpening 
                                        ? batch.expirationAfterOpening 
                                        : batch.expirationDate
                                    ).toLocaleDateString("fr-FR")}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {!batch.isOpened && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => handleOpenBatch(batch.id)}
                                    >
                                      Ouvrir
                                    </Button>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={() => openBatchDialog(product, batch)}
                                  >
                                    <PencilIcon className="h-3 w-3" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-7 w-7 text-red-600 hover:bg-red-50"
                                    onClick={() => setDeleteConfirm({ type: "batch", id: batch.id })}
                                  >
                                    <TrashIcon className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <PackageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">Aucun produit</h3>
          <p className="text-muted-foreground">Commencez par creer votre premier produit</p>
        </div>
      )}

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Modifier le produit" : "Nouveau produit"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Category Select */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderIcon className="h-4 w-4 text-amber-600" />
                Categorie *
              </Label>
              <Select 
                value={productForm.categoryId || undefined} 
                onValueChange={(value) => setProductForm({ ...productForm, categoryId: value, subCategoryId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner une categorie" />
                </SelectTrigger>
                <SelectContent>
                  {(stockCategories || []).filter(c => c.isActive).map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sub-Category Select - filtered by selected category */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <LayersIcon className="h-4 w-4 text-purple-600" />
                Sous-categorie *
              </Label>
              <Select 
                value={productForm.subCategoryId || undefined} 
                onValueChange={(value) => setProductForm({ ...productForm, subCategoryId: value })}
                disabled={!productForm.categoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={productForm.categoryId ? "Selectionner une sous-categorie" : "Selectionnez d'abord une categorie"} />
                </SelectTrigger>
                <SelectContent>
                  {(subCategories || [])
                    .filter(sub => sub.categoryId === productForm.categoryId && sub.isActive)
                    .map(sub => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.icon} {sub.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nom du produit *</Label>
              <Input
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Ex: Chocolat Noir 70%"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Description du produit..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unite *</Label>
                <Select 
                  value={productForm.unit} 
                  onValueChange={(value: Product["unit"]) => setProductForm({ ...productForm, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Prix unitaire (TND) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.unitPrice}
                  onChange={(e) => setProductForm({ ...productForm, unitPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantite minimum</Label>
                <Input
                  type="number"
                  min="0"
                  value={productForm.minQuantity}
                  onChange={(e) => setProductForm({ ...productForm, minQuantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Conservation apres ouverture (jours)</Label>
                <Input
                  type="number"
                  min="1"
                  value={productForm.shelfLifeAfterOpening}
                  onChange={(e) => setProductForm({ ...productForm, shelfLifeAfterOpening: parseInt(e.target.value) || 30 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fournisseur par defaut</Label>
                <Select 
                  value={productForm.supplierId || "none"} 
                  onValueChange={(value) => setProductForm({ ...productForm, supplierId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {(suppliers || []).filter(s => s.status === "active").map(sup => (
                      <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3 text-green-600" />
                  Emplacement par defaut
                </Label>
                <Select 
                  value={productForm.defaultLocationId || "none"} 
                  onValueChange={(value) => setProductForm({ ...productForm, defaultLocationId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Emplacement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {(getActiveStorageLocations?.() || []).map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name} {loc.temperature ? `(${loc.temperature})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActiveProduct"
                checked={productForm.isActive}
                onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActiveProduct" className="cursor-pointer">Produit actif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleProductSubmit} className="bg-green-600 hover:bg-green-700">
              {editingProduct ? "Modifier" : "Creer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Dialog */}
      <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBatch ? "Modifier le lot" : "Nouveau lot"}
              {selectedProductForBatch && (
                <span className="block text-sm font-normal text-muted-foreground mt-1">
                  {selectedProductForBatch.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Numero de lot *</Label>
              <Input
                value={batchForm.batchNumber}
                onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                placeholder="LOT-XXXXXX"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantite *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={batchForm.quantity}
                  onChange={(e) => setBatchForm({ ...batchForm, quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cout unitaire (TND) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={batchForm.unitCost}
                  onChange={(e) => setBatchForm({ ...batchForm, unitCost: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fournisseur</Label>
                <Select 
                  value={batchForm.supplierId || "none"} 
                  onValueChange={(value) => setBatchForm({ ...batchForm, supplierId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {(suppliers || []).filter(s => s.status === "active").map(sup => (
                      <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3 text-green-600" />
                  Emplacement
                </Label>
                <Select 
                  value={batchForm.locationId || "none"} 
                  onValueChange={(value) => setBatchForm({ ...batchForm, locationId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Emplacement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {(getActiveStorageLocations?.() || []).map(loc => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de reception *</Label>
                <Input
                  type="date"
                  value={batchForm.receptionDate}
                  onChange={(e) => setBatchForm({ ...batchForm, receptionDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de production</Label>
                <Input
                  type="date"
                  value={batchForm.productionDate}
                  onChange={(e) => setBatchForm({ ...batchForm, productionDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Date d&apos;expiration (DLC) *</Label>
              <Input
                type="date"
                value={batchForm.expirationDate}
                onChange={(e) => setBatchForm({ ...batchForm, expirationDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={batchForm.notes}
                onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                placeholder="Notes sur ce lot..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBatchDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleBatchSubmit} className="bg-blue-600 hover:bg-blue-700">
              {editingBatch ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Etes-vous sur de vouloir supprimer {deleteConfirm?.type === "product" ? "ce produit" : "ce lot"} ?
            Cette action est irreversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (deleteConfirm?.type === "product") {
                  handleDeleteProduct(deleteConfirm.id)
                } else if (deleteConfirm?.type === "batch") {
                  handleDeleteBatch(deleteConfirm.id)
                }
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
