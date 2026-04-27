"use client"

import type React from "react"

import { useState } from "react"
import { useStock, type Reward } from "@/contexts/stock-context"
import { useNotification } from "@/contexts/notification-context"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card } from "./ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Switch } from "./ui/switch"
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  GiftIcon,
  TagIcon,
  ImageIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react"

function getRewardImageSrc(image?: string) {
  if (!image) return "/placeholder.svg"
  if (image.startsWith("http") || image.startsWith("blob:") || image.startsWith("data:")) return image
  return `${process.env.NEXT_PUBLIC_API_IMAGE_URL}/menu/${image}`
}

export function RewardsManagement() {
  const { rewards, addReward, updateReward, deleteReward } = useStock()
  const { addNotification } = useNotification()

  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "discount" | "free_item" | "special">("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingReward, setEditingReward] = useState<Reward | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pointsCost: 0,
    type: "discount" as "discount" | "free_item" | "special",
    value: "",
    image: "",
    imageFile: undefined as File | undefined,
    removeImage: false,
    isActive: true,
  })

  const filteredRewards = rewards.filter((reward) => {
    const matchesSearch =
      reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reward.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || reward.type === typeFilter
    return matchesSearch && matchesType
  })

  const handleOpenDialog = (reward?: Reward) => {
    if (reward) {
      setEditingReward(reward)
      setFormData({
        name: reward.name,
        description: reward.description,
        pointsCost: reward.pointsCost,
        type: reward.type,
        value: reward.value,
        image: reward.image || "",
        imageFile: undefined,
        removeImage: false,
        isActive: reward.isActive,
      })
    } else {
      setEditingReward(null)
      setFormData({
        name: "",
        description: "",
        pointsCost: 0,
        type: "discount",
        value: "",
        image: "",
        imageFile: undefined,
        removeImage: false,
        isActive: true,
      })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingReward(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.description || formData.pointsCost <= 0 || !formData.value) {
      addNotification("Veuillez remplir tous les champs obligatoires", "error")
      return
    }

    if (editingReward) {
      await updateReward(editingReward.id, formData)
      addNotification("Récompense modifiée avec succès", "success")
    } else {
      await addReward(formData)
      addNotification("Récompense ajoutée avec succès", "success")
    }

    handleCloseDialog()
  }

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette récompense ?")) {
      await deleteReward(id)
      addNotification("Récompense supprimée avec succès", "success")
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      addNotification("Veuillez selectionner une image", "error")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      addNotification("L'image ne doit pas depasser 5MB", "error")
      return
    }

    setFormData((prev) => ({
      ...prev,
      image: URL.createObjectURL(file),
      imageFile: file,
      removeImage: false,
    }))
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: "",
      imageFile: undefined,
      removeImage: true,
    }))
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "discount":
        return "Réduction"
      case "free_item":
        return "Produit Gratuit"
      case "special":
        return "Spécial"
      default:
        return type
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "discount":
        return "bg-blue-100 text-blue-700"
      case "free_item":
        return "bg-green-100 text-green-700"
      case "special":
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const activeRewards = rewards.filter((r) => r.isActive).length
  const totalRewards = rewards.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Gestion des Récompenses</h1>
          <p className="text-muted-foreground">Créez et gérez les récompenses du programme de fidélité</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Nouvelle Récompense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-3">
              <GiftIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRewards}</p>
              <p className="text-sm text-muted-foreground">Total Récompenses</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeRewards}</p>
              <p className="text-sm text-muted-foreground">Actives</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-3">
              <XCircleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalRewards - activeRewards}</p>
              <p className="text-sm text-muted-foreground">Inactives</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une récompense..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="discount">Réduction</SelectItem>
              <SelectItem value="free_item">Produit Gratuit</SelectItem>
              <SelectItem value="special">Spécial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Rewards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredRewards.map((reward) => (
          <Card key={reward.id} className="overflow-hidden">
            <div className="relative">
              {reward.image ? (
                <img src={getRewardImageSrc(reward.image)} alt={reward.name} className="h-48 w-full object-cover" />
              ) : (
                <div className="flex h-48 items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100">
                  <GiftIcon className="h-16 w-16 text-amber-300" />
                </div>
              )}
              <div className="absolute right-2 top-2">
                {reward.isActive ? (
                  <span className="rounded-full bg-green-500 px-2 py-1 text-xs font-semibold text-white">Active</span>
                ) : (
                  <span className="rounded-full bg-gray-500 px-2 py-1 text-xs font-semibold text-white">Inactive</span>
                )}
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <h3 className="text-lg font-bold">{reward.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{reward.description}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${getTypeBadgeColor(reward.type)}`}>
                  {getTypeLabel(reward.type)}
                </span>
                <div className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1">
                  <TagIcon className="h-4 w-4 text-amber-700" />
                  <span className="text-sm font-bold text-amber-700">{reward.pointsCost}</span>
                  <span className="text-xs text-amber-600">pts</span>
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => handleOpenDialog(reward)}
                >
                  <PencilIcon className="mr-1 h-4 w-4" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 bg-transparent"
                  onClick={() => handleDelete(reward.id)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredRewards.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <GiftIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Aucune récompense trouvée</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery || typeFilter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Commencez par créer votre première récompense"}
            </p>
          </div>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingReward ? "Modifier la récompense" : "Nouvelle récompense"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Croissant Gratuit"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pointsCost">Coût en points *</Label>
                <Input
                  id="pointsCost"
                  type="number"
                  min="1"
                  value={formData.pointsCost}
                  onChange={(e) => setFormData({ ...formData, pointsCost: Number(e.target.value) })}
                  placeholder="Ex: 50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez la récompense..."
                rows={3}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Réduction</SelectItem>
                    <SelectItem value="free_item">Produit Gratuit</SelectItem>
                    <SelectItem value="special">Spécial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Valeur *</Label>
                <Input
                  id="value"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="Ex: 5 TND ou 1 croissant"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image (optionnel)</Label>
              <div className="flex gap-2">
              {/*   <ImageIcon className="mt-2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value, imageFile: undefined, removeImage: false })
                  }
                  placeholder="URL image ou laissez vide pour importer un fichier"
                /> */}
              </div>
              <Input type="file" accept="image/*" onChange={handleImageUpload} />
              {formData.image && (
                <div className="space-y-3 rounded-lg border p-3">
                  <img
                    src={getRewardImageSrc(formData.image)}
                    alt="Aperçu récompense"
                    className="h-32 w-full rounded-md object-cover"
                  />
                  <Button type="button" variant="outline" onClick={handleRemoveImage}>
                    Supprimer l'image
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label htmlFor="isActive">Récompense active</Label>
                <p className="text-sm text-muted-foreground">Rendre cette récompense disponible aux clients</p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Annuler
              </Button>
              <Button type="submit">{editingReward ? "Modifier" : "Créer"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
