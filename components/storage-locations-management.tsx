"use client"

import { useState } from "react"
import { useStock, type StorageLocation } from "@/contexts/stock-context"
import { useNotification } from "@/contexts/notification-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  SearchIcon,
  ThermometerIcon,
  WarehouseIcon,
  RefrigeratorIcon,
  SnowflakeIcon,
  BoxIcon,
  ArchiveIcon,
} from "lucide-react"

const locationTypes: { value: StorageLocation["type"]; label: string; icon: any; color: string }[] = [
  { value: "refrigerator", label: "Refrigerateur", icon: RefrigeratorIcon, color: "text-blue-600 bg-blue-100" },
  { value: "freezer", label: "Congelateur", icon: SnowflakeIcon, color: "text-cyan-600 bg-cyan-100" },
  { value: "room", label: "Chambre/Piece", icon: WarehouseIcon, color: "text-amber-600 bg-amber-100" },
  { value: "shelf", label: "Etagere", icon: ArchiveIcon, color: "text-purple-600 bg-purple-100" },
  { value: "other", label: "Autre", icon: BoxIcon, color: "text-stone-600 bg-stone-100" },
]

export function StorageLocationsManagement() {
  const { 
    storageLocations = [], 
    addStorageLocation, 
    updateStorageLocation, 
    deleteStorageLocation,
    batches = [],
  } = useStock()
  const { addNotification } = useNotification()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    type: "room" as StorageLocation["type"],
    description: "",
    temperature: "",
    capacity: "",
    isActive: true,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      type: "room",
      description: "",
      temperature: "",
      capacity: "",
      isActive: true,
    })
    setEditingLocation(null)
  }

  const handleOpenDialog = (location?: StorageLocation) => {
    if (location) {
      setFormData({
        name: location.name,
        type: location.type,
        description: location.description || "",
        temperature: location.temperature || "",
        capacity: location.capacity || "",
        isActive: location.isActive,
      })
      setEditingLocation(location)
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      addNotification("Le nom de l'emplacement est requis", "error")
      return
    }

    if (editingLocation) {
      updateStorageLocation(editingLocation.id, formData)
      addNotification("Emplacement modifie avec succes", "success")
    } else {
      addStorageLocation(formData)
      addNotification("Emplacement ajoute avec succes", "success")
    }

    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = (id: string) => {
    // Check if location is used by any batch
    const batchesUsingLocation = batches.filter(b => b.locationId === id)
    if (batchesUsingLocation.length > 0) {
      addNotification(`Impossible de supprimer: ${batchesUsingLocation.length} lot(s) utilisent cet emplacement`, "error")
      setDeleteConfirmId(null)
      return
    }
    
    deleteStorageLocation(id)
    addNotification("Emplacement supprime", "success")
    setDeleteConfirmId(null)
  }

  const filteredLocations = (storageLocations || []).filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getLocationTypeInfo = (type: StorageLocation["type"]) => {
    return locationTypes.find(t => t.value === type) || locationTypes[4]
  }

  const getBatchCountByLocation = (locationId: string) => {
    return batches.filter(b => b.locationId === locationId).length
  }

  // Stats
  const stats = {
    total: storageLocations.length,
    active: storageLocations.filter(l => l.isActive).length,
    refrigerators: storageLocations.filter(l => l.type === "refrigerator").length,
    freezers: storageLocations.filter(l => l.type === "freezer").length,
    rooms: storageLocations.filter(l => l.type === "room" || l.type === "shelf").length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Emplacements de Stockage</h1>
          <p className="text-muted-foreground">Gerez vos zones de stockage (refrigerateurs, congelateurs, chambres...)</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Nouvel Emplacement
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-muted-foreground">Actifs</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.refrigerators}</p>
          <p className="text-sm text-muted-foreground">Refrigerateurs</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-cyan-600">{stats.freezers}</p>
          <p className="text-sm text-muted-foreground">Congelateurs</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.rooms}</p>
          <p className="text-sm text-muted-foreground">Chambres/Etageres</p>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un emplacement..."
          className="pl-10"
        />
      </div>

      {/* Locations Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredLocations.map((location) => {
          const typeInfo = getLocationTypeInfo(location.type)
          const TypeIcon = typeInfo.icon
          const batchCount = getBatchCountByLocation(location.id)

          return (
            <Card key={location.id} className={`p-4 ${!location.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                  <TypeIcon className="h-5 w-5" />
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleOpenDialog(location)}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  {deleteConfirmId === location.id ? (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(location.id)}
                      >
                        Oui
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeleteConfirmId(null)}
                      >
                        Non
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteConfirmId(location.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-foreground">{location.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{typeInfo.label}</p>

              {location.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {location.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 text-xs">
                {location.temperature && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                    <ThermometerIcon className="h-3 w-3" />
                    {location.temperature}
                  </span>
                )}
                {location.capacity && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-stone-100 text-stone-700">
                    {location.capacity}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                  {batchCount} lot(s)
                </span>
                {!location.isActive && (
                  <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">
                    Inactif
                  </span>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {filteredLocations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          Aucun emplacement trouve
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? "Modifier l'emplacement" : "Nouvel emplacement"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Refrigerateur 1"
              />
            </div>

            <div className="space-y-2">
              <Label>Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: StorageLocation["type"]) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locationTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description de l'emplacement..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Temperature</Label>
                <Input
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  placeholder="Ex: 2-4°C"
                />
              </div>
              <div className="space-y-2">
                <Label>Capacite</Label>
                <Input
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="Ex: 500L"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Emplacement actif</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSubmit}>
                {editingLocation ? "Modifier" : "Ajouter"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
