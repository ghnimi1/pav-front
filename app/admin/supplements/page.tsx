"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
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
  TagIcon,
  CheckIcon,
  XIcon,
  FilterIcon,
} from "lucide-react"
import { StockProvider, useStock, type Supplement, type SupplementCategory } from "@/contexts/stock-context"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { NotificationProvider, useNotification } from "@/contexts/notification-context"
import { NavigationProvider, useNavigation } from "@/contexts/navigation-context"
import { NotificationContainer } from "@/components/notification-container"

// Color options for categories
const colorOptions = [
  { id: "bg-green-100 text-green-700", name: "Vert", preview: "bg-green-500" },
  { id: "bg-yellow-100 text-yellow-700", name: "Jaune", preview: "bg-yellow-500" },
  { id: "bg-red-100 text-red-700", name: "Rouge", preview: "bg-red-500" },
  { id: "bg-blue-100 text-blue-700", name: "Bleu", preview: "bg-blue-500" },
  { id: "bg-emerald-100 text-emerald-700", name: "Emeraude", preview: "bg-emerald-500" },
  { id: "bg-stone-100 text-stone-700", name: "Pierre", preview: "bg-stone-500" },
  { id: "bg-pink-100 text-pink-700", name: "Rose", preview: "bg-pink-500" },
  { id: "bg-amber-100 text-amber-700", name: "Ambre", preview: "bg-amber-500" },
  { id: "bg-orange-100 text-orange-700", name: "Orange", preview: "bg-orange-500" },
  { id: "bg-cyan-100 text-cyan-700", name: "Cyan", preview: "bg-cyan-500" },
  { id: "bg-purple-100 text-purple-700", name: "Violet", preview: "bg-purple-500" },
  { id: "bg-gray-100 text-gray-700", name: "Gris", preview: "bg-gray-500" },
]

function AdminSupplementsContent() {
  const router = useRouter()
  // Set the navigation item to supplements to trigger data loading
  const { setCurrentNavItem } = useNavigation()
  useEffect(() => {
    setCurrentNavItem("supplements")
  }, [setCurrentNavItem])
  const { user, isAuthenticated } = useAuth()
  const { addNotification } = useNotification()
  const { 
    supplements, 
    addSupplement, 
    updateSupplement, 
    deleteSupplement,
    menuItems,
    updateMenuItem,
    supplementCategories,
    addSupplementCategory,
    updateSupplementCategory,
    deleteSupplementCategory 
  } = useStock()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingSupplement, setEditingSupplement] = useState<Supplement | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Supplement | null>(null)
  
  // Category management states
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<SupplementCategory | null>(null)
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<SupplementCategory | null>(null)
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    color: "bg-gray-100 text-gray-700",
    isActive: true,
  })
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    points: "",
    description: "",
    category: "autre",
    isActive: true,
  })

  // Filter supplements
  const filteredSupplements = useMemo(() => {
    return supplements.filter(sup => {
      const matchesSearch = sup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sup.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = categoryFilter === "all" || sup.category === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [supplements, searchQuery, categoryFilter])

  // Group by category
  const groupedSupplements = useMemo(() => {
    const groups: Record<string, Supplement[]> = {}
    filteredSupplements.forEach(sup => {
      const cat = sup.category || "autre"
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(sup)
    })
    return groups
  }, [filteredSupplements])

  // Check admin access - AFTER all hooks
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

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      points: "",
      description: "",
      category: "autre",
      isActive: true,
    })
  }

  // Category management functions
  const resetCategoryForm = () => {
    setCategoryFormData({
      name: "",
      color: "bg-gray-100 text-gray-700",
      isActive: true,
    })
  }

  const handleOpenAddCategory = () => {
    resetCategoryForm()
    setEditingCategory(null)
    setShowCategoryDialog(true)
  }

  const handleOpenEditCategory = (category: SupplementCategory) => {
    setCategoryFormData({
      name: category.name,
      color: category.color,
      isActive: category.isActive,
    })
    setEditingCategory(category)
    setShowCategoryDialog(true)
  }

  const handleSaveCategory = () => {
    if (!categoryFormData.name) {
      addNotification({
        type: "error",
        title: "Erreur",
        message: "Veuillez entrer un nom pour la categorie",
      })
      return
    }

    if (editingCategory) {
      updateSupplementCategory(editingCategory.id, categoryFormData)
      addNotification({
        type: "success",
        title: "Categorie modifiee",
        message: `La categorie "${categoryFormData.name}" a ete mise a jour`,
      })
    } else {
      addSupplementCategory(categoryFormData)
      addNotification({
        type: "success",
        title: "Categorie ajoutee",
        message: `La categorie "${categoryFormData.name}" a ete creee`,
      })
    }
    setShowCategoryDialog(false)
    resetCategoryForm()
  }

  const handleDeleteCategory = (category: SupplementCategory) => {
    // Check if category is in use
    const inUse = supplements.some(s => s.category === category.id)
    if (inUse) {
      addNotification({
        type: "error",
        title: "Impossible de supprimer",
        message: `La categorie "${category.name}" est utilisee par des supplements`,
      })
      return
    }
    deleteSupplementCategory(category.id)
    addNotification({
      type: "success",
      title: "Categorie supprimee",
      message: `La categorie "${category.name}" a ete supprimee`,
    })
    setDeleteCategoryConfirm(null)
  }

  const handleOpenAdd = () => {
    resetForm()
    setEditingSupplement(null)
    setShowAddDialog(true)
  }

  const handleOpenEdit = (supplement: Supplement) => {
    setFormData({
      name: supplement.name,
      price: supplement.price.toString(),
      points: supplement.points?.toString() || "",
      description: supplement.description || "",
      category: supplement.category || "autre",
      isActive: supplement.isActive,
    })
    setEditingSupplement(supplement)
    setShowAddDialog(true)
  }

  const handleSave = () => {
    if (!formData.name || !formData.price) {
      addNotification({
        type: "error",
        title: "Erreur",
        message: "Veuillez remplir tous les champs obligatoires",
      })
      return
    }

    const supplementData = {
      name: formData.name,
      price: parseFloat(formData.price),
      points: formData.points ? parseInt(formData.points) : 0,
      description: formData.description,
      category: formData.category,
      isActive: formData.isActive,
    }

    if (editingSupplement) {
      updateSupplement(editingSupplement.id, supplementData)
      addNotification({
        type: "success",
        title: "Supplement modifie",
        message: `${formData.name} a ete mis a jour`,
      })
    } else {
      addSupplement(supplementData)
      addNotification({
        type: "success",
        title: "Supplement ajoute",
        message: `${formData.name} a ete cree`,
      })
    }

    setShowAddDialog(false)
    resetForm()
  }

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteSupplement(deleteConfirm.id)
      addNotification({
        type: "success",
        title: "Supplement supprime",
        message: `${deleteConfirm.name} a ete supprime`,
      })
      setDeleteConfirm(null)
    }
  }

  const handleToggleActive = (supplement: Supplement) => {
    updateSupplement(supplement.id, { isActive: !supplement.isActive })
    addNotification({
      type: "info",
      title: supplement.isActive ? "Supplement desactive" : "Supplement active",
      message: `${supplement.name} est maintenant ${supplement.isActive ? "desactive" : "actif"}`,
    })
  }

  const getCategoryConfig = (categoryId: string) => {
    const found = supplementCategories.find(c => c.id === categoryId)
    if (found) return found
    // Return a default category config if not found
    return {
      id: categoryId,
      name: categoryId === "autre" ? "Autre" : categoryId,
      color: "bg-gray-100 text-gray-700",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  // Count products using each supplement
  const getSupplementUsageCount = (supplementId: string) => {
    return menuItems.filter(item => 
      item.availableSupplements?.some(s => s.supplementId === supplementId)
    ).length
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Header */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="rounded-full"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Gestion des Supplements</h1>
                <p className="text-sm text-stone-500">{supplements.length} supplements configures</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleOpenAddCategory}
              >
                <TagIcon className="h-4 w-4 mr-2" />
                Categories
              </Button>
              <Button
                onClick={handleOpenAdd}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nouveau supplement
              </Button>
            </div>
          </div>

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Rechercher un supplement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <FilterIcon className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les categories</SelectItem>
                {supplementCategories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {Object.keys(groupedSupplements).length === 0 ? (
          <Card className="p-12 text-center">
            <SparklesIcon className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-stone-900 mb-2">Aucun supplement trouve</h3>
            <p className="text-stone-500 mb-4">
              {searchQuery || categoryFilter !== "all" 
                ? "Essayez de modifier vos filtres" 
                : "Commencez par ajouter votre premier supplement"}
            </p>
            <Button onClick={handleOpenAdd}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Ajouter un supplement
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSupplements).map(([categoryId, categorySupplements]) => {
              const category = getCategoryConfig(categoryId)
              return (
                <div key={categoryId}>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={category?.color}>{category.name}</Badge>
                    <span className="text-sm text-stone-500">{categorySupplements.length} supplement(s)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categorySupplements.map(supplement => {
                      const usageCount = getSupplementUsageCount(supplement.id)
                      return (
                        <Card 
                          key={supplement.id} 
                          className={`p-4 ${!supplement.isActive ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-stone-900">{supplement.name}</h4>
                              {supplement.description && (
                                <p className="text-sm text-stone-500 line-clamp-2 mt-1">
                                  {supplement.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenEdit(supplement)}
                              >
                                <EditIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => setDeleteConfirm(supplement)}
                              >
                                <Trash2Icon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-amber-600">
                                  +{supplement.price.toFixed(2)} TND
                                </span>
                                {supplement.points && supplement.points > 0 && (
                                  <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                    +{supplement.points} pts
                                  </span>
                                )}
                              </div>
                              {usageCount > 0 && (
                                <p className="text-xs text-stone-500 mt-1">
                                  Utilise dans {usageCount} produit(s)
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-stone-500">
                                {supplement.isActive ? "Actif" : "Inactif"}
                              </span>
                              <Switch
                                checked={supplement.isActive}
                                onCheckedChange={() => handleToggleActive(supplement)}
                              />
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingSupplement ? (
                <>
                  <EditIcon className="h-5 w-5 text-amber-600" />
                  Modifier le supplement
                </>
              ) : (
                <>
                  <PlusIcon className="h-5 w-5 text-amber-600" />
                  Nouveau supplement
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Champignons"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Prix (TND) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="1.50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="points">Points fidélité</Label>
                <Input
                  id="points"
                  type="number"
                  min="0"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Champignons frais sautes"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categorie</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une categorie" />
                </SelectTrigger>
                <SelectContent>
                  {supplementCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="active">Actif</Label>
              <Switch
                id="active"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600">
              {editingSupplement ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2Icon className="h-5 w-5" />
              Supprimer le supplement
            </DialogTitle>
          </DialogHeader>
          <p className="text-stone-600 py-4">
            Etes-vous sur de vouloir supprimer <strong>{deleteConfirm?.name}</strong> ?
            Cette action est irreversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-amber-500" />
              Gestion des Categories
            </DialogTitle>
          </DialogHeader>

          {/* Add/Edit Category Form */}
          <div className="border-b border-stone-200 pb-4 mb-4">
            <h3 className="font-medium text-stone-900 mb-3">
              {editingCategory ? "Modifier la categorie" : "Ajouter une categorie"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Nom de la categorie *</Label>
                <Input
                  id="cat-name"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="Ex: Fromage"
                />
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(color => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => setCategoryFormData({ ...categoryFormData, color: color.id })}
                      className={`w-8 h-8 rounded-full ${color.preview} ${
                        categoryFormData.color === color.id ? "ring-2 ring-offset-2 ring-amber-500" : ""
                      }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={categoryFormData.isActive}
                  onCheckedChange={(checked) => setCategoryFormData({ ...categoryFormData, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex gap-2 ml-auto">
                {editingCategory && (
                  <Button variant="outline" size="sm" onClick={() => {
                    setEditingCategory(null)
                    resetCategoryForm()
                  }}>
                    Annuler
                  </Button>
                )}
                <Button size="sm" onClick={handleSaveCategory} className="bg-amber-500 hover:bg-amber-600">
                  {editingCategory ? "Enregistrer" : "Ajouter"}
                </Button>
              </div>
            </div>
          </div>

          {/* Categories List */}
          <div className="space-y-2">
            <h3 className="font-medium text-stone-900 mb-3">
              Categories existantes ({supplementCategories.length})
            </h3>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {supplementCategories.map(cat => {
                const supplementCount = supplements.filter(s => s.category === cat.id).length
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 bg-stone-50 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={cat.color}>{cat.name}</Badge>
                      <span className="text-sm text-stone-500">
                        {supplementCount} supplement{supplementCount !== 1 ? "s" : ""}
                      </span>
                      {!cat.isActive && (
                        <Badge variant="outline" className="text-stone-400">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditCategory(cat)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteCategoryConfirm(cat)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        disabled={supplementCount > 0}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCategoryDialog(false)
              setEditingCategory(null)
              resetCategoryForm()
            }}>
              Fermer
            </Button>
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
            Etes-vous sur de vouloir supprimer la categorie <strong>{deleteCategoryConfirm?.name}</strong> ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategoryConfirm(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={() => deleteCategoryConfirm && handleDeleteCategory(deleteCategoryConfirm)}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AdminSupplementsPage() {
  return (
    <NavigationProvider initialNavItem="supplements">
      <NotificationProvider>
        <AuthProvider>
          <StockProvider>
            <AdminSupplementsContent />
            <NotificationContainer />
          </StockProvider>
        </AuthProvider>
      </NotificationProvider>
    </NavigationProvider>
  )
}
