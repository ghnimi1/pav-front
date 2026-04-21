"use client"

import { useState } from "react"
import { useStock } from "@/contexts/stock-context"
import { useNotification } from "@/contexts/notification-context"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon, ExternalLinkIcon, ImageIcon, RefreshCwIcon, TagIcon, SparklesIcon, PercentIcon, GiftIcon, StarIcon, FlameIcon, CoinsIcon } from "lucide-react"
import type { Supplement, Promotion } from "@/contexts/stock-context"
import { Pagination } from "./pagination"

export function MenuManagement() {
  const { menuItems, menuCategories, addMenuItem, updateMenuItem, deleteMenuItem } = useStock()
  const { addNotification } = useNotification()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)

  const [formData, setFormData] = useState({
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

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const resetForm = () => {
    setFormData({
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
    setEditingItem(null)
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.description || !formData.price || !formData.category) {
      addNotification("Veuillez remplir tous les champs obligatoires", "error")
      return
    }

    const allergensArray = formData.allergens
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a)

    // Build promotion object if enabled
    let promotion: Promotion | undefined
    if (formData.hasPromotion) {
      promotion = {
        type: formData.promotionType,
        value: formData.promotionValue ? Number.parseFloat(formData.promotionValue) : undefined,
        label: formData.promotionLabel || undefined,
        endDate: formData.promotionEndDate || undefined,
      }
    }

    if (editingItem) {
      updateMenuItem(editingItem, {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        points: formData.points ? parseInt(formData.points) : undefined,
        category: formData.category,
        image: formData.image || undefined,
        allergens: allergensArray,
        isAvailable: formData.isAvailable,
        supplements: supplements.length > 0 ? supplements : undefined,
        promotion,
      })
      addNotification("Article du menu modifié avec succès", "success")
    } else {
      addMenuItem({
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        points: formData.points ? parseInt(formData.points) : undefined,
        category: formData.category,
        image: formData.image || undefined,
        allergens: allergensArray,
        isAvailable: formData.isAvailable,
        supplements: supplements.length > 0 ? supplements : undefined,
        promotion,
      })
      addNotification("Article du menu ajouté avec succès", "success")
    }

    setIsAddDialogOpen(false)
    resetForm()
  }

  const addSupplement = () => {
    if (!newSupplement.name || !newSupplement.price) {
      addNotification("Remplissez le nom et le prix du supplement", "error")
      return
    }
    setSupplements([...supplements, {
      id: Date.now().toString(),
      name: newSupplement.name,
      price: Number.parseFloat(newSupplement.price)
    }])
    setNewSupplement({ name: "", price: "" })
  }

  const removeSupplement = (id: string) => {
    setSupplements(supplements.filter(s => s.id !== id))
  }

  const handleEdit = (item: any) => {
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      points: item.points?.toString() || "",
      category: item.category,
      image: item.image || "",
      allergens: item.allergens.join(", "),
      isAvailable: item.isAvailable,
      hasPromotion: !!item.promotion,
      promotionType: item.promotion?.type || "percentage",
      promotionValue: item.promotion?.value?.toString() || "",
      promotionLabel: item.promotion?.label || "",
      promotionEndDate: item.promotion?.endDate || "",
    })
    setSupplements(item.supplements || [])
    setEditingItem(item.id)
    setIsAddDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet article du menu ?")) {
      deleteMenuItem(id)
      addNotification("Article du menu supprimé", "success")
    }
  }

  const handleViewPublicMenu = () => {
    window.open("/menu", "_blank")
  }

  const handleResetMenuData = () => {
    if (
      confirm(
        "Voulez-vous réinitialiser les données du menu avec les exemples par défaut ? Cette action est irréversible.",
      )
    ) {
      localStorage.removeItem("pastry-menu-items")
      localStorage.removeItem("pastry-menu-categories")
      window.location.reload()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Menu Client</h1>
          <p className="text-muted-foreground">Gérez les articles visibles par vos clients</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-transparent" onClick={handleResetMenuData}>
            <RefreshCwIcon className="h-4 w-4" />
            Réinitialiser
          </Button>
          <Button variant="outline" className="gap-2 bg-transparent" onClick={handleViewPublicMenu}>
            <ExternalLinkIcon className="h-4 w-4" />
            Voir le menu public
          </Button>
          <Dialog
            open={isAddDialogOpen}
            onOpenChange={(open) => {
              setIsAddDialogOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <PlusIcon className="h-4 w-4" />
                Ajouter un article
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Modifier l'article" : "Ajouter un article"}</DialogTitle>
                <DialogDescription>
                  Ajoutez les détails de l'article du menu avec photo et description
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'article *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Croissant Artisanal"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Décrivez l'article en détail..."
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
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                      placeholder="5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {menuCategories
                          .filter((cat) => cat.isActive)
                          .sort((a, b) => a.order - b.order)
                          .map((cat) => (
                            <SelectItem key={cat.id} value={cat.slug}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="image"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://exemple.com/image.jpg ou laissez vide"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Collez l'URL de l'image ou uploadez-la</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergens">Allergènes</Label>
                  <Input
                    id="allergens"
                    value={formData.allergens}
                    onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                    placeholder="Gluten, Lait, Oeufs (séparés par des virgules)"
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
                  
                  {/* Existing supplements */}
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
                            <TrashIcon className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Add new supplement */}
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
                      checked={formData.hasPromotion}
                      onChange={(e) => setFormData({ ...formData, hasPromotion: e.target.checked })}
                      className="h-4 w-4"
                    />
                  </div>
                  
                  {formData.hasPromotion && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, promotionType: "percentage" })}
                          className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-sm transition ${
                            formData.promotionType === "percentage" ? "border-amber-500 bg-amber-50 text-amber-700" : "hover:bg-muted"
                          }`}
                        >
                          <PercentIcon className="h-4 w-4" />
                          Remise %
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, promotionType: "fixed" })}
                          className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-sm transition ${
                            formData.promotionType === "fixed" ? "border-amber-500 bg-amber-50 text-amber-700" : "hover:bg-muted"
                          }`}
                        >
                          <TagIcon className="h-4 w-4" />
                          Remise TND
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, promotionType: "offer" })}
                          className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-sm transition ${
                            formData.promotionType === "offer" ? "border-green-500 bg-green-50 text-green-700" : "hover:bg-muted"
                          }`}
                        >
                          <GiftIcon className="h-4 w-4" />
                          Offre
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, promotionType: "new" })}
                          className={`flex items-center justify-center gap-2 rounded-lg border p-2 text-sm transition ${
                            formData.promotionType === "new" ? "border-blue-500 bg-blue-50 text-blue-700" : "hover:bg-muted"
                          }`}
                        >
                          <StarIcon className="h-4 w-4" />
                          Nouveau
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, promotionType: "popular" })}
                          className={`col-span-2 flex items-center justify-center gap-2 rounded-lg border p-2 text-sm transition ${
                            formData.promotionType === "popular" ? "border-red-500 bg-red-50 text-red-700" : "hover:bg-muted"
                          }`}
                        >
                          <FlameIcon className="h-4 w-4" />
                          Populaire
                        </button>
                      </div>
                      
                      {(formData.promotionType === "percentage" || formData.promotionType === "fixed") && (
                        <div className="space-y-2">
                          <Label>
                            {formData.promotionType === "percentage" ? "Pourcentage de remise" : "Montant de remise (TND)"}
                          </Label>
                          <Input
                            type="number"
                            step="1"
                            value={formData.promotionValue}
                            onChange={(e) => setFormData({ ...formData, promotionValue: e.target.value })}
                            placeholder={formData.promotionType === "percentage" ? "20" : "5"}
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label>Label personnalise (optionnel)</Label>
                        <Input
                          value={formData.promotionLabel}
                          onChange={(e) => setFormData({ ...formData, promotionLabel: e.target.value })}
                          placeholder="Ex: Offre speciale, Nouveau, etc."
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Date de fin (optionnel)</Label>
                        <Input
                          type="date"
                          value={formData.promotionEndDate}
                          onChange={(e) => setFormData({ ...formData, promotionEndDate: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="available"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="available" className="cursor-pointer">
                    Article disponible a la vente
                  </Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false)
                      resetForm()
                    }}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleSubmit}>{editingItem ? "Modifier" : "Ajouter"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {menuCategories
                .filter((cat) => cat.isActive)
                .sort((a, b) => a.order - b.order)
                .map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Articles</p>
          <p className="text-2xl font-semibold">{menuItems.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Disponibles</p>
          <p className="text-2xl font-semibold text-green-600">{menuItems.filter((item) => item.isAvailable).length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Résultats filtrés</p>
          <p className="text-2xl font-semibold">{filteredItems.length}</p>
        </Card>
      </div>

      {/* Menu Items Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {paginatedItems.map((item) => {
          const category = menuCategories.find((cat) => cat.slug === item.category)
          return (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-square w-full overflow-hidden bg-muted relative">
                <img
                  src={item.image || "/placeholder.svg?height=200&width=200&query=food"}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
                {/* Promotion Badge */}
                {item.promotion && (
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold text-white ${
                    item.promotion.type === "percentage" ? "bg-red-500" :
                    item.promotion.type === "fixed" ? "bg-orange-500" :
                    item.promotion.type === "offer" ? "bg-green-500" :
                    item.promotion.type === "new" ? "bg-blue-500" :
                    "bg-red-600"
                  }`}>
                    {item.promotion.label || (
                      item.promotion.type === "percentage" ? `-${item.promotion.value}%` :
                      item.promotion.type === "fixed" ? `-${item.promotion.value} TND` :
                      item.promotion.type === "offer" ? "OFFRE" :
                      item.promotion.type === "new" ? "NOUVEAU" :
                      "POPULAIRE"
                    )}
                  </div>
                )}
                {/* Supplements indicator */}
                {item.supplements && item.supplements.length > 0 && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white">
                    +{item.supplements.length} options
                  </div>
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground line-clamp-1">{item.name}</h3>
                  <div className="text-right shrink-0">
                    <div>
                      {item.promotion && (item.promotion.type === "percentage" || item.promotion.type === "fixed") && item.promotion.value && (
                        <span className="text-xs text-muted-foreground line-through mr-1">{item.price.toFixed(2)}</span>
                      )}
                      <span className="font-semibold text-primary">
                        {item.promotion?.type === "percentage" && item.promotion.value
                          ? (item.price * (1 - item.promotion.value / 100)).toFixed(2)
                          : item.promotion?.type === "fixed" && item.promotion.value
                          ? (item.price - item.promotion.value).toFixed(2)
                          : item.price.toFixed(2)} TND
                      </span>
                    </div>
                    {item.points !== undefined && item.points > 0 && (
                      <span className="text-xs font-medium text-emerald-600 flex items-center justify-end gap-0.5">
                        <CoinsIcon className="h-3 w-3" />
                        +{item.points} pts
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                {item.allergens.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.allergens.map((allergen) => (
                      <span
                        key={allergen}
                        className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                      >
                        {allergen}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${item.isAvailable ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-xs text-muted-foreground">
                      {item.isAvailable ? "Disponible" : "Indisponible"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(item)}>
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Pagination */}
      {filteredItems.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredItems.length}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(value) => {
            setItemsPerPage(value)
            setCurrentPage(1)
          }}
        />
      )}

      {filteredItems.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Aucun article trouvé</p>
        </Card>
      )}
    </div>
  )
}
