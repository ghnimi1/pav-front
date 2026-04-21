"use client"

import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  TargetIcon,
  TrophyIcon,
  UsersIcon,
  ShoppingBagIcon,
  StarIcon,
  HeartIcon,
  GiftIcon,
  CalendarIcon,
} from "lucide-react"
import { useLoyalty, type Mission } from "@/contexts/loyalty-context"
import { useNotification } from "@/contexts/notification-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Switch } from "./ui/switch"
import { Textarea } from "./ui/textarea"

const missionTypes = [
  { value: "visit", label: "Visites", icon: UsersIcon },
  { value: "spend", label: "Depenses", icon: ShoppingBagIcon },
  { value: "refer", label: "Parrainages", icon: HeartIcon },
  { value: "birthday", label: "Anniversaire", icon: GiftIcon },
  { value: "review", label: "Avis", icon: StarIcon },
  { value: "social", label: "Reseaux sociaux", icon: UsersIcon },
  { value: "challenge", label: "Challenge", icon: TrophyIcon },
]

const missionIcons = [
  { value: "star", icon: StarIcon },
  { value: "heart", icon: HeartIcon },
  { value: "trophy", icon: TrophyIcon },
  { value: "gift", icon: GiftIcon },
  { value: "target", icon: TargetIcon },
  { value: "users", icon: UsersIcon },
  { value: "shopping-bag", icon: ShoppingBagIcon },
]

export function MissionsManagement() {
  const { missions, addMission, updateMission, deleteMission, clientMissions } = useLoyalty()
  const { addNotification } = useNotification()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "visit" as Mission["type"],
    target: 1,
    reward: 25,
    bonusReward: 0,
    validFrom: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    isActive: true,
    icon: "star",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "visit",
      target: 1,
      reward: 25,
      bonusReward: 0,
      validFrom: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      isActive: true,
      icon: "star",
    })
  }

  const handleAdd = () => {
    if (!formData.name || !formData.description) {
      addNotification("Veuillez remplir tous les champs obligatoires", "error")
      return
    }

    addMission({
      ...formData,
      validFrom: new Date(formData.validFrom).toISOString(),
      validUntil: new Date(formData.validUntil).toISOString(),
    })

    addNotification("Mission ajoutee avec succes", "success")
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEdit = () => {
    if (!selectedMission || !formData.name || !formData.description) {
      addNotification("Veuillez remplir tous les champs obligatoires", "error")
      return
    }

    updateMission(selectedMission.id, {
      ...formData,
      validFrom: new Date(formData.validFrom).toISOString(),
      validUntil: new Date(formData.validUntil).toISOString(),
    })

    addNotification("Mission modifiee avec succes", "success")
    setIsEditDialogOpen(false)
    setSelectedMission(null)
    resetForm()
  }

  const handleDelete = () => {
    if (!selectedMission) return

    deleteMission(selectedMission.id)
    addNotification("Mission supprimee avec succes", "success")
    setIsDeleteDialogOpen(false)
    setSelectedMission(null)
  }

  const openEditDialog = (mission: Mission) => {
    setSelectedMission(mission)
    setFormData({
      name: mission.name,
      description: mission.description,
      type: mission.type,
      target: mission.target,
      reward: mission.reward,
      bonusReward: mission.bonusReward || 0,
      validFrom: mission.validFrom.split("T")[0],
      validUntil: mission.validUntil.split("T")[0],
      isActive: mission.isActive,
      icon: mission.icon || "star",
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (mission: Mission) => {
    setSelectedMission(mission)
    setIsDeleteDialogOpen(true)
  }

  const getMissionCompletions = (missionId: string) => {
    return clientMissions.filter((cm) => cm.missionId === missionId && cm.status === "completed").length
  }

  const getMissionIcon = (iconName: string) => {
    const iconConfig = missionIcons.find((i) => i.value === iconName)
    return iconConfig?.icon || StarIcon
  }

  const activeMissions = missions.filter((m) => m.isActive)
  const inactiveMissions = missions.filter((m) => !m.isActive)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Gestion des Missions</h1>
          <p className="text-muted-foreground">Creez et gerez les challenges pour vos clients</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Nouvelle Mission
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Missions</p>
              <p className="text-3xl font-bold">{missions.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <TargetIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Missions Actives</p>
              <p className="text-3xl font-bold">{activeMissions.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <StarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completees</p>
              <p className="text-3xl font-bold">{clientMissions.filter((cm) => cm.status === "completed").length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
              <TrophyIcon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En Cours</p>
              <p className="text-3xl font-bold">{clientMissions.filter((cm) => cm.status === "active").length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <UsersIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Active Missions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Missions Actives</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeMissions.map((mission) => {
            const IconComponent = getMissionIcon(mission.icon || "star")
            const typeConfig = missionTypes.find((t) => t.value === mission.type)
            return (
              <Card key={mission.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(mission)}>
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(mission)}>
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-2">{mission.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{mission.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{typeConfig?.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Objectif:</span>
                    <span className="font-medium">{mission.target}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Recompense:</span>
                    <span className="font-medium text-amber-600">{mission.reward} pts</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completee:</span>
                    <span className="font-medium">{getMissionCompletions(mission.id)}x</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Jusqu'au {new Date(mission.validUntil).toLocaleDateString("fr-FR")}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Inactive Missions */}
      {inactiveMissions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-muted-foreground">Missions Inactives</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inactiveMissions.map((mission) => {
              const IconComponent = getMissionIcon(mission.icon || "star")
              return (
                <Card key={mission.id} className="p-6 opacity-60">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <IconComponent className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(mission)}>
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(mission)}>
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{mission.name}</h3>
                  <p className="text-sm text-muted-foreground">{mission.description}</p>
                  <Badge variant="outline" className="mt-4">
                    Inactive
                  </Badge>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false)
          setIsEditDialogOpen(false)
          setSelectedMission(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? "Modifier la Mission" : "Nouvelle Mission"}</DialogTitle>
            <DialogDescription>
              {isEditDialogOpen ? "Modifiez les details de la mission" : "Creez une nouvelle mission pour vos clients"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la mission *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Client Fidele"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Effectuez 10 achats pour gagner..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de mission</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: Mission["type"]) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {missionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">Icone</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {missionIcons.map((icon) => {
                      const Icon = icon.icon
                      return (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {icon.value}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Objectif</Label>
                <Input
                  id="target"
                  type="number"
                  min="1"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward">Recompense (pts)</Label>
                <Input
                  id="reward"
                  type="number"
                  min="1"
                  value={formData.reward}
                  onChange={(e) => setFormData({ ...formData, reward: parseInt(e.target.value) || 1 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonusReward">Bonus (pts)</Label>
                <Input
                  id="bonusReward"
                  type="number"
                  min="0"
                  value={formData.bonusReward}
                  onChange={(e) => setFormData({ ...formData, bonusReward: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Date debut</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validUntil">Date fin</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Mission active</Label>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false)
              setIsEditDialogOpen(false)
              resetForm()
            }}>
              Annuler
            </Button>
            <Button onClick={isEditDialogOpen ? handleEdit : handleAdd}>
              {isEditDialogOpen ? "Modifier" : "Creer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la Mission</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer la mission "{selectedMission?.name}" ? Cette action est irreversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
