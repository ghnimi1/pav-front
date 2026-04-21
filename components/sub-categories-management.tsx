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
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  SearchIcon, 
  LayersIcon,
  PackageIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  FolderIcon
} from "lucide-react"
import type { SubCategory } from "@/contexts/stock-context"

interface SubCategoriesManagementProps {
  selectedCategoryId?: string
  onBack?: () => void
  onSelectSubCategory?: (subCategoryId: string) => void
}

export function SubCategoriesManagement({ selectedCategoryId, onBack, onSelectSubCategory }: SubCategoriesManagementProps) {
  const { 
    stockCategories, 
    subCategories, 
    products, 
    addSubCategory, 
    updateSubCategory, 
    deleteSubCategory,
    getSubCategoriesByCategoryId,
    getProductsBySubCategoryId
  } = useStock()
  const { addNotification } = useNotification()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategoryId, setFilterCategoryId] = useState<string>(selectedCategoryId || "all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    categoryId: selectedCategoryId || "",
    name: "",
    slug: "",
    description: "",
    icon: "",
    order: 1,
    isActive: true,
  })

  const iconOptions = ["🍫", "🌿", "🍓", "🌾", "🥛", "☕", "🍵", "🍯", "🫒", "🌶️", "🥫", "🧈", "🥚", "🍬", "🫐", "🥜"]

  const filteredSubCategories = (filterCategoryId === "all" 
    ? subCategories 
    : getSubCategoriesByCategoryId(filterCategoryId)
  )
    .filter(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.order - b.order)

  const selectedCategory = stockCategories.find(c => c.id === selectedCategoryId)

  const resetForm = () => {
    setFormData({
      categoryId: selectedCategoryId || stockCategories[0]?.id || "",
      name: "",
      slug: "",
      description: "",
      icon: "🍫",
      order: subCategories.length + 1,
      isActive: true,
    })
    setEditingSubCategory(null)
  }

  const openDialog = (subCategory?: SubCategory) => {
    if (subCategory) {
      setEditingSubCategory(subCategory)
      setFormData({
        categoryId: subCategory.categoryId,
        name: subCategory.name,
        slug: subCategory.slug,
        description: subCategory.description || "",
        icon: subCategory.icon || "🍫",
        order: subCategory.order,
        isActive: subCategory.isActive,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      addNotification("Le nom de la sous-categorie est requis", "error")
      return
    }
    if (!formData.categoryId) {
      addNotification("Veuillez selectionner une categorie parente", "error")
      return
    }

    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

    if (editingSubCategory) {
      updateSubCategory(editingSubCategory.id, { ...formData, slug })
      addNotification("Sous-categorie modifiee avec succes", "success")
    } else {
      addSubCategory({ ...formData, slug })
      addNotification("Sous-categorie ajoutee avec succes", "success")
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    const prodsCount = getProductsBySubCategoryId(id).length
    if (prodsCount > 0) {
      addNotification(`Cette sous-categorie contient ${prodsCount} produits. Supprimez-les d'abord.`, "error")
      setDeleteConfirm(null)
      return
    }
    deleteSubCategory(id)
    addNotification("Sous-categorie supprimee", "success")
    setDeleteConfirm(null)
  }

  const getCategoryName = (categoryId: string) => {
    return stockCategories.find(c => c.id === categoryId)?.name || "—"
  }

  const getCategoryColor = (categoryId: string) => {
    return stockCategories.find(c => c.id === categoryId)?.color || "#6b7280"
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
            <h2 className="text-2xl font-bold text-foreground">
              {selectedCategory ? `Sous-categories: ${selectedCategory.name}` : "Sous-categories"}
            </h2>
            <p className="text-muted-foreground">
              {selectedCategory 
                ? `Gerez les sous-categories de ${selectedCategory.name}` 
                : "Gerez vos sous-categories (Chocolat, Arome, Huile...)"}
            </p>
          </div>
        </div>
        <Button onClick={() => openDialog()} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <PlusIcon className="h-4 w-4" />
          Nouvelle Sous-categorie
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stockCategories.slice(0, 4).map(cat => {
          const count = getSubCategoriesByCategoryId(cat.id).length
          return (
            <Card 
              key={cat.id} 
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                filterCategoryId === cat.id ? "ring-2 ring-offset-2" : ""
              }`}
              style={{ 
                borderColor: filterCategoryId === cat.id ? cat.color : undefined,
                ...(filterCategoryId === cat.id && { ['--tw-ring-color' as string]: cat.color })
              }}
              onClick={() => setFilterCategoryId(filterCategoryId === cat.id ? "all" : cat.id)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cat.icon}</span>
                <div>
                  <p className="font-semibold text-foreground">{cat.name}</p>
                  <p className="text-sm text-muted-foreground">{count} sous-cat.</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une sous-categorie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {!selectedCategoryId && (
          <Select value={filterCategoryId} onValueChange={setFilterCategoryId}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Toutes categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes categories</SelectItem>
              {stockCategories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* SubCategories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredSubCategories.map((subCat) => {
          const productsCount = getProductsBySubCategoryId(subCat.id).length
          const categoryColor = getCategoryColor(subCat.categoryId)
          
          return (
            <Card 
              key={subCat.id} 
              className={`overflow-hidden transition-all hover:shadow-lg ${!subCat.isActive ? "opacity-60" : ""}`}
            >
              <div className="h-1.5" style={{ backgroundColor: categoryColor }} />
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{subCat.icon || "📦"}</span>
                    <div>
                      <h3 className="font-semibold text-foreground">{subCat.name}</h3>
                      <p className="text-xs text-muted-foreground">{getCategoryName(subCat.categoryId)}</p>
                    </div>
                  </div>
                  {!subCat.isActive && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">Inactif</span>
                  )}
                </div>

                {subCat.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{subCat.description}</p>
                )}

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <PackageIcon className="h-4 w-4" />
                  <span>{productsCount} produits</span>
                </div>

                <div className="flex items-center gap-2">
                  {onSelectSubCategory && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1"
                      onClick={() => onSelectSubCategory(subCat.id)}
                    >
                      Produits
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => openDialog(subCat)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteConfirm(subCat.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredSubCategories.length === 0 && (
        <div className="text-center py-12">
          <LayersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">Aucune sous-categorie</h3>
          <p className="text-muted-foreground">
            {filterCategoryId !== "all" 
              ? "Cette categorie n'a pas encore de sous-categories" 
              : "Commencez par creer votre premiere sous-categorie"}
          </p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSubCategory ? "Modifier la sous-categorie" : "Nouvelle sous-categorie"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categorie parente *</Label>
              <Select 
                value={formData.categoryId || undefined} 
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner une categorie" />
                </SelectTrigger>
                <SelectContent>
                  {stockCategories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Chocolat"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="chocolat"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la sous-categorie..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Icone</Label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`h-9 w-9 rounded-lg border-2 text-lg flex items-center justify-center transition-all ${
                      formData.icon === icon 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Label>Ordre</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="isActiveSubCat"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActiveSubCat" className="cursor-pointer">Actif</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              {editingSubCategory ? "Modifier" : "Creer"}
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
            Etes-vous sur de vouloir supprimer cette sous-categorie ? Cette action est irreversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
