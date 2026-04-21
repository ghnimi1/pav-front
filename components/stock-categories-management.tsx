"use client"

import { useState } from "react"
import { useStock } from "@/contexts/stock-context"
import { useNotification } from "@/contexts/notification-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  SearchIcon, 
  FolderIcon,
  PackageIcon,
  LayersIcon,
  ChevronRightIcon
} from "lucide-react"
import type { StockCategory } from "@/contexts/stock-context"

interface StockCategoriesManagementProps {
  onSelectCategory?: (categoryId: string) => void
}

export function StockCategoriesManagement({ onSelectCategory }: StockCategoriesManagementProps) {
  const { stockCategories, subCategories, products, addStockCategory, updateStockCategory, deleteStockCategory } = useStock()
  const { addNotification } = useNotification()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<StockCategory | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    color: "#f59e0b",
    order: 1,
    isActive: true,
  })

  const iconOptions = ["🎂", "☕", "🍽️", "🥐", "🍰", "🧁", "🍞", "🥗", "🍕", "🍔", "🥤", "🍷", "📦", "🧹"]
  const colorOptions = ["#f59e0b", "#78350f", "#dc2626", "#16a34a", "#2563eb", "#7c3aed", "#db2777", "#0891b2"]

  const filteredCategories = stockCategories
    .filter(cat => cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.order - b.order)

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      icon: "🎂",
      color: "#f59e0b",
      order: stockCategories.length + 1,
      isActive: true,
    })
    setEditingCategory(null)
  }

  const openDialog = (category?: StockCategory) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        icon: category.icon || "🎂",
        color: category.color || "#f59e0b",
        order: category.order,
        isActive: category.isActive,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      addNotification("Le nom de la categorie est requis", "error")
      return
    }

    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

    if (editingCategory) {
      updateStockCategory(editingCategory.id, { ...formData, slug })
      addNotification("Categorie modifiee avec succes", "success")
    } else {
      addStockCategory({ ...formData, slug })
      addNotification("Categorie ajoutee avec succes", "success")
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    const subsCount = subCategories.filter(s => s.categoryId === id).length
    if (subsCount > 0) {
      addNotification(`Cette categorie contient ${subsCount} sous-categories. Supprimez-les d'abord.`, "error")
      setDeleteConfirm(null)
      return
    }
    deleteStockCategory(id)
    addNotification("Categorie supprimee", "success")
    setDeleteConfirm(null)
  }

  const getCategoryStats = (categoryId: string) => {
    const subs = subCategories.filter(s => s.categoryId === categoryId)
    const prods = products.filter(p => subs.some(s => s.id === p.subCategoryId))
    return { subCount: subs.length, productCount: prods.length }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Categories Stock</h2>
          <p className="text-muted-foreground">Gerez vos categories principales (Patisserie, Cafe, Restaurant...)</p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2 bg-amber-600 hover:bg-amber-700">
          <PlusIcon className="h-4 w-4" />
          Nouvelle Categorie
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <FolderIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-900">{stockCategories.length}</p>
              <p className="text-sm text-amber-600">Categories</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <LayersIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{subCategories.length}</p>
              <p className="text-sm text-blue-600">Sous-categories</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <PackageIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">{products.length}</p>
              <p className="text-sm text-green-600">Produits</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher une categorie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map((category) => {
          const stats = getCategoryStats(category.id)
          return (
            <Card 
              key={category.id} 
              className={`overflow-hidden transition-all hover:shadow-lg ${!category.isActive ? "opacity-60" : ""}`}
            >
              <div 
                className="h-2" 
                style={{ backgroundColor: category.color || "#f59e0b" }} 
              />
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{category.icon || "📦"}</span>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">/{category.slug}</p>
                    </div>
                  </div>
                  {!category.isActive && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">Inactif</span>
                  )}
                </div>

                {category.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{category.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <LayersIcon className="h-4 w-4" />
                    {stats.subCount} sous-cat.
                  </span>
                  <span className="flex items-center gap-1">
                    <PackageIcon className="h-4 w-4" />
                    {stats.productCount} produits
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {onSelectCategory && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1"
                      onClick={() => onSelectCategory(category.id)}
                    >
                      Voir
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => openDialog(category)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-8 w-8 text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteConfirm(category.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <FolderIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">Aucune categorie</h3>
          <p className="text-muted-foreground">Commencez par creer votre premiere categorie</p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Modifier la categorie" : "Nouvelle categorie"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Patisserie"
              />
            </div>

            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="patisserie"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de la categorie..."
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
                    className={`h-10 w-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all ${
                      formData.icon === icon 
                        ? "border-amber-500 bg-amber-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      formData.color === color 
                        ? "border-gray-900 scale-110" 
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color }}
                  />
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
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Actif</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700">
              {editingCategory ? "Modifier" : "Creer"}
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
            Etes-vous sur de vouloir supprimer cette categorie ? Cette action est irreversible.
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
