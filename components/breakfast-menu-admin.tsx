"use client"

import { useState } from "react"
import { useBreakfast, type BreakfastCategory, type BreakfastItem, type BaseFormula } from "@/contexts/breakfast-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  CoffeeIcon,
  FolderIcon,
  PackageIcon,
  StarIcon,
  GlassWaterIcon,
  CakeIcon,
  EggIcon,
  CrownIcon,
  IceCreamIcon,
  CroissantIcon,
  GripVerticalIcon,
  SearchIcon,
  XIcon,
  CheckIcon,
  AlertTriangleIcon,
  ImageIcon,
  UploadIcon,
  Trash2Icon,
  LeafIcon,
  SparklesIcon,
  CoinsIcon
} from "lucide-react"
import Image from "next/image"

// Icon options for categories
const iconOptions = [
  { value: "star", label: "Etoile", icon: <StarIcon className="h-4 w-4" /> },
  { value: "coffee", label: "Cafe", icon: <CoffeeIcon className="h-4 w-4" /> },
  { value: "glass-water", label: "Boisson", icon: <GlassWaterIcon className="h-4 w-4" /> },
  { value: "croissant", label: "Croissant", icon: <CroissantIcon className="h-4 w-4" /> },
  { value: "cake", label: "Gateau", icon: <CakeIcon className="h-4 w-4" /> },
  { value: "egg", label: "Oeuf", icon: <EggIcon className="h-4 w-4" /> },
  { value: "crown", label: "Premium", icon: <CrownIcon className="h-4 w-4" /> },
  { value: "ice-cream", label: "Dessert", icon: <IceCreamIcon className="h-4 w-4" /> },
]

const getIconComponent = (iconName: string) => {
  const option = iconOptions.find(o => o.value === iconName)
  return option?.icon || <StarIcon className="h-4 w-4" />
}

export function BreakfastMenuAdmin() {
  const {
    categories,
    items,
    baseFormulas,
    updateFormula,
    addCategory,
    updateCategory,
    deleteCategory,
    addItem,
    updateItem,
    deleteItem
  } = useBreakfast()

  const [activeTab, setActiveTab] = useState<"categories" | "items" | "formulas">("items")
  
  // Formula dialog
  const [formulaDialog, setFormulaDialog] = useState<{
    open: boolean
    formula: Partial<BaseFormula> | null
  }>({ open: false, formula: null })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null)
  
  // Category dialog
  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean
    mode: "add" | "edit"
    category: Partial<BreakfastCategory> | null
  }>({ open: false, mode: "add", category: null })
  
  // Item dialog
  const [itemDialog, setItemDialog] = useState<{
    open: boolean
    mode: "add" | "edit"
    item: Partial<BreakfastItem> | null
  }>({ open: false, mode: "add", item: null })
  
  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    type: "category" | "item"
    id: string
    name: string
  } | null>(null)
  
  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false)
  
  // Handle image upload (converts to base64 for localStorage storage)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Veuillez selectionner une image')
      return
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas depasser 2MB')
      return
    }
    
    setUploadingImage(true)
    
    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setItemDialog(prev => ({
          ...prev,
          item: { ...prev.item, image: base64 }
        }))
        setUploadingImage(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading image:', error)
      setUploadingImage(false)
    }
  }
  
  // Remove image
  const handleRemoveImage = () => {
    setItemDialog(prev => ({
      ...prev,
      item: { ...prev.item, image: undefined }
    }))
  }

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === "" || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategoryFilter || item.categoryId === selectedCategoryFilter
    return matchesSearch && matchesCategory
  })

  // Sorted categories
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order)

  // Category handlers
  const handleSaveCategory = () => {
    if (!categoryDialog.category?.name) return
    
    if (categoryDialog.mode === "add") {
      addCategory({
        name: categoryDialog.category.name,
        icon: categoryDialog.category.icon || "star",
        description: categoryDialog.category.description || "",
        order: categories.length,
        isActive: categoryDialog.category.isActive !== false
      })
    } else if (categoryDialog.category.id) {
      updateCategory(categoryDialog.category.id, categoryDialog.category)
    }
    
    setCategoryDialog({ open: false, mode: "add", category: null })
  }

  // Item handlers
  const handleSaveItem = () => {
    if (!itemDialog.item?.name || !itemDialog.item?.categoryId) return
    
    if (itemDialog.mode === "add") {
      addItem({
        name: itemDialog.item.name,
        description: itemDialog.item.description || "",
        price: itemDialog.item.price || 0,
        categoryId: itemDialog.item.categoryId,
        image: itemDialog.item.image || "",
        isAvailable: itemDialog.item.isAvailable !== false
      })
    } else if (itemDialog.item.id) {
      updateItem(itemDialog.item.id, itemDialog.item)
    }
    
    setItemDialog({ open: false, mode: "add", item: null })
  }

  // Delete handlers
  const handleConfirmDelete = () => {
    if (!deleteDialog) return
    
    if (deleteDialog.type === "category") {
      deleteCategory(deleteDialog.id)
    } else {
      deleteItem(deleteDialog.id)
    }
    
    setDeleteDialog(null)
  }
  
  // Formula handlers
  const handleSaveFormula = () => {
    if (!formulaDialog.formula?.id) return
    updateFormula(formulaDialog.formula.id, formulaDialog.formula)
    setFormulaDialog({ open: false, formula: null })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <CoffeeIcon className="h-6 w-6 text-amber-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Menu Petit Dejeuner</h1>
            <p className="text-stone-500">Gerez les categories et articles du menu</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "categories" | "items" | "formulas")}>
        <div className="flex items-center justify-between gap-4">
          <TabsList className="bg-stone-100">
            <TabsTrigger value="items" className="gap-2">
              <PackageIcon className="h-4 w-4" />
              Articles ({items.length})
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <FolderIcon className="h-4 w-4" />
              Categories ({categories.length})
            </TabsTrigger>
            <TabsTrigger value="formulas" className="gap-2">
              <SparklesIcon className="h-4 w-4" />
              Formules ({baseFormulas.length})
            </TabsTrigger>
          </TabsList>
          
          {activeTab !== "formulas" && (
            <Button
              onClick={() => {
                if (activeTab === "categories") {
                  setCategoryDialog({ open: true, mode: "add", category: { isActive: true } })
                } else {
                  setItemDialog({ open: true, mode: "add", item: { isAvailable: true, categoryId: categories[0]?.id, points: 0 } })
                }
              }}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {activeTab === "categories" ? "Nouvelle Categorie" : "Nouvel Article"}
            </Button>
          )}
        </div>

        {/* Items Tab */}
        <TabsContent value="items" className="mt-6">
          {/* Search and filter */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Rechercher un article..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategoryFilter || ""}
              onChange={(e) => setSelectedCategoryFilter(e.target.value || null)}
              className="h-10 px-3 rounded-lg border border-stone-200 bg-white text-sm"
            >
              <option value="">Toutes les categories</option>
              {sortedCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Items list */}
          <div className="grid gap-3">
            {filteredItems.length === 0 ? (
              <Card className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
                    <PackageIcon className="h-8 w-8 text-stone-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-1">Aucun article trouve</h3>
                  <p className="text-stone-500 text-sm">
                    {searchQuery ? "Essayez de modifier votre recherche" : "Commencez par ajouter un article"}
                  </p>
                </div>
              </Card>
            ) : (
              filteredItems.map(item => {
                const category = categories.find(c => c.id === item.categoryId)
                return (
                  <Card key={item.id} className={`${!item.isAvailable ? "opacity-60" : ""} overflow-hidden`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Item Image or Icon */}
                          {item.image ? (
                            <div className="relative h-14 w-14 rounded-xl overflow-hidden shrink-0">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 ${
                              item.isAvailable ? "bg-amber-100" : "bg-stone-100"
                            }`}>
                              {category ? getIconComponent(category.icon) : <PackageIcon className="h-5 w-5 text-stone-400" />}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-stone-900">{item.name}</h3>
                              {!item.isAvailable && (
                                <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 text-xs font-medium">
                                  Indisponible
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <p className="text-sm text-stone-500 line-clamp-1">{item.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-lg font-bold text-amber-600">{item.price.toFixed(2)} TND</span>
                              {item.points !== undefined && item.points > 0 && (
                                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                  <CoinsIcon className="h-3 w-3" />
                                  {item.points} pts
                                </span>
                              )}
                              {category && (
                                <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                                  {category.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setItemDialog({ open: true, mode: "edit", item })}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteDialog({ open: true, type: "item", id: item.id, name: item.name })}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="mt-6">
          <div className="grid gap-3">
            {sortedCategories.length === 0 ? (
              <Card className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
                    <FolderIcon className="h-8 w-8 text-stone-300" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-900 mb-1">Aucune categorie</h3>
                  <p className="text-stone-500 text-sm">Commencez par creer une categorie</p>
                </div>
              </Card>
            ) : (
              sortedCategories.map((category, index) => {
                const itemCount = items.filter(i => i.categoryId === category.id).length
                return (
                  <Card key={category.id} className={`${!category.isActive ? "opacity-60" : ""}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-stone-400">
                            <GripVerticalIcon className="h-5 w-5" />
                            <span className="text-sm font-mono">{index + 1}</span>
                          </div>
                          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                            category.isActive ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-400"
                          }`}>
                            {getIconComponent(category.icon)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-stone-900">{category.name}</h3>
                              {!category.isActive && (
                                <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-600 text-xs font-medium">
                                  Inactive
                                </span>
                              )}
                            </div>
                            {category.description && (
                              <p className="text-sm text-stone-500">{category.description}</p>
                            )}
                            <span className="text-xs text-stone-400">{itemCount} article{itemCount > 1 ? "s" : ""}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCategoryDialog({ open: true, mode: "edit", category })}
                          >
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteDialog({ open: true, type: "category", id: category.id, name: category.name })}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
        
        {/* Formulas Tab */}
        <TabsContent value="formulas" className="mt-6">
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <p className="text-sm text-amber-800">
              Les formules de base sont obligatoires pour chaque commande petit dejeuner. 
              Vous pouvez modifier le nom, la description, le prix et les points de chaque formule.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            {baseFormulas.map(formula => (
              <Card 
                key={formula.id} 
                className={`overflow-hidden transition-all hover:shadow-lg ${
                  formula.type === "healthy" 
                    ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50" 
                    : "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
                }`}
              >
                <CardContent className="p-0">
                  {/* Formula image */}
                  {formula.image && (
                    <div className="relative h-32 w-full">
                      <Image
                        src={formula.image}
                        alt={formula.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          formula.type === "healthy" ? "bg-green-500" : "bg-amber-500"
                        }`}>
                          {formula.type === "healthy" ? (
                            <LeafIcon className="h-5 w-5 text-white" />
                          ) : (
                            <CoffeeIcon className="h-5 w-5 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg text-stone-900">{formula.name}</h3>
                        <p className="text-sm text-stone-600">{formula.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setFormulaDialog({ open: true, formula })}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xl font-bold text-amber-600">{formula.price.toFixed(2)} TND</span>
                      {formula.points !== undefined && formula.points > 0 && (
                        <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full">
                          <CoinsIcon className="h-3.5 w-3.5" />
                          {formula.points} pts
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Formula Dialog */}
      <Dialog open={formulaDialog.open} onOpenChange={(open) => !open && setFormulaDialog({ open: false, formula: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {formulaDialog.formula?.type === "healthy" ? (
                <LeafIcon className="h-5 w-5 text-green-600" />
              ) : (
                <CoffeeIcon className="h-5 w-5 text-amber-600" />
              )}
              Modifier la Formule
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={formulaDialog.formula?.name || ""}
                onChange={(e) => setFormulaDialog(prev => ({
                  ...prev,
                  formula: { ...prev.formula, name: e.target.value }
                }))}
                placeholder="Ex: Formule Classique"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                value={formulaDialog.formula?.description || ""}
                onChange={(e) => setFormulaDialog(prev => ({
                  ...prev,
                  formula: { ...prev.formula, description: e.target.value }
                }))}
                placeholder="Ex: Cafe au choix + Croissant nature"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prix (TND) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formulaDialog.formula?.price || 0}
                  onChange={(e) => setFormulaDialog(prev => ({
                    ...prev,
                    formula: { ...prev.formula, price: parseFloat(e.target.value) || 0 }
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  Points
                  <CoinsIcon className="h-3.5 w-3.5 text-emerald-600" />
                </Label>
                <Input
                  type="number"
                  value={formulaDialog.formula?.points || 0}
                  onChange={(e) => setFormulaDialog(prev => ({
                    ...prev,
                    formula: { ...prev.formula, points: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>URL de l&apos;image</Label>
              <Input
                value={formulaDialog.formula?.image || ""}
                onChange={(e) => setFormulaDialog(prev => ({
                  ...prev,
                  formula: { ...prev.formula, image: e.target.value }
                }))}
                placeholder="https://..."
              />
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setFormulaDialog({ open: false, formula: null })}>
              Annuler
            </Button>
            <Button onClick={handleSaveFormula} className="bg-amber-500 hover:bg-amber-600">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialog.open} onOpenChange={(open) => !open && setCategoryDialog({ open: false, mode: "add", category: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {categoryDialog.mode === "add" ? "Nouvelle Categorie" : "Modifier la Categorie"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={categoryDialog.category?.name || ""}
                onChange={(e) => setCategoryDialog(prev => ({
                  ...prev,
                  category: { ...prev.category, name: e.target.value }
                }))}
                placeholder="Ex: Boissons Chaudes"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={categoryDialog.category?.description || ""}
                onChange={(e) => setCategoryDialog(prev => ({
                  ...prev,
                  category: { ...prev.category, description: e.target.value }
                }))}
                placeholder="Ex: Cafe, the et chocolat"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Icone</Label>
              <div className="grid grid-cols-4 gap-2">
                {iconOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setCategoryDialog(prev => ({
                      ...prev,
                      category: { ...prev.category, icon: option.value }
                    }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                      categoryDialog.category?.icon === option.value
                        ? "border-amber-500 bg-amber-50"
                        : "border-stone-200 hover:border-stone-300"
                    }`}
                  >
                    {option.icon}
                    <span className="text-xs text-stone-500">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Ordre d&apos;affichage</Label>
              <Input
                type="number"
                min="0"
                value={categoryDialog.category?.order ?? categories.length}
                onChange={(e) => setCategoryDialog(prev => ({
                  ...prev,
                  category: { ...prev.category, order: parseInt(e.target.value) || 0 }
                }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Categorie active</Label>
              <Switch
                checked={categoryDialog.category?.isActive !== false}
                onCheckedChange={(checked) => setCategoryDialog(prev => ({
                  ...prev,
                  category: { ...prev.category, isActive: checked }
                }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog({ open: false, mode: "add", category: null })}>
              Annuler
            </Button>
            <Button onClick={handleSaveCategory} className="bg-amber-500 hover:bg-amber-600">
              {categoryDialog.mode === "add" ? "Creer" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={itemDialog.open} onOpenChange={(open) => !open && setItemDialog({ open: false, mode: "add", item: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {itemDialog.mode === "add" ? "Nouvel Article" : "Modifier l'Article"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={itemDialog.item?.name || ""}
                onChange={(e) => setItemDialog(prev => ({
                  ...prev,
                  item: { ...prev.item, name: e.target.value }
                }))}
                placeholder="Ex: Croissant amande"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={itemDialog.item?.description || ""}
                onChange={(e) => setItemDialog(prev => ({
                  ...prev,
                  item: { ...prev.item, description: e.target.value }
                }))}
                placeholder="Ex: Croissant frais garni d'amandes"
                rows={2}
              />
            </div>
            
            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Photo de l&apos;article</Label>
              <div className="relative">
                {itemDialog.item?.image ? (
                  <div className="relative group">
                    <div className="relative h-40 w-full rounded-xl overflow-hidden border-2 border-amber-200 bg-amber-50">
                      <Image
                        src={itemDialog.item.image}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center hover:bg-amber-100 transition-colors">
                          <UploadIcon className="h-5 w-5 text-stone-700" />
                        </div>
                      </label>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
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
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    <div className={`h-40 w-full rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${
                      uploadingImage 
                        ? "border-amber-300 bg-amber-50" 
                        : "border-stone-300 hover:border-amber-400 hover:bg-amber-50"
                    }`}>
                      {uploadingImage ? (
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
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prix (TND) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={itemDialog.item?.price || ""}
                  onChange={(e) => setItemDialog(prev => ({
                    ...prev,
                    item: { ...prev.item, price: parseFloat(e.target.value) || 0 }
                  }))}
                  placeholder="0.00"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  Points
                  <CoinsIcon className="h-3.5 w-3.5 text-emerald-600" />
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={itemDialog.item?.points || 0}
                  onChange={(e) => setItemDialog(prev => ({
                    ...prev,
                    item: { ...prev.item, points: parseInt(e.target.value) || 0 }
                  }))}
                  placeholder="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Categorie *</Label>
                <select
                  value={itemDialog.item?.categoryId || ""}
                  onChange={(e) => setItemDialog(prev => ({
                    ...prev,
                    item: { ...prev.item, categoryId: e.target.value }
                  }))}
                  className="h-10 w-full px-3 rounded-lg border border-stone-200 bg-white text-sm"
                >
                  <option value="">Choisir...</option>
                  {sortedCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Article disponible</Label>
              <Switch
                checked={itemDialog.item?.isAvailable !== false}
                onCheckedChange={(checked) => setItemDialog(prev => ({
                  ...prev,
                  item: { ...prev.item, isAvailable: checked }
                }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog({ open: false, mode: "add", item: null })}>
              Annuler
            </Button>
            <Button onClick={handleSaveItem} className="bg-amber-500 hover:bg-amber-600">
              {itemDialog.mode === "add" ? "Creer" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangleIcon className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          
          <p className="text-stone-600">
            Etes-vous sur de vouloir supprimer {deleteDialog?.type === "category" ? "la categorie" : "l'article"}{" "}
            <strong>{deleteDialog?.name}</strong> ?
            {deleteDialog?.type === "category" && (
              <span className="block mt-2 text-sm text-red-500">
                Attention: tous les articles de cette categorie seront egalement supprimes.
              </span>
            )}
          </p>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
