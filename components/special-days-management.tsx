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
  CalendarIcon,
  SparklesIcon,
  HeartIcon,
  UserIcon,
  UsersIcon,
} from "lucide-react"
import { useLoyalty, type SpecialDay, type Gender } from "@/contexts/loyalty-context"
import { useNotification } from "@/contexts/notification-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Switch } from "./ui/switch"
import { Textarea } from "./ui/textarea"

const daysOfWeek = [
  { value: 0, label: "Dimanche" },
  { value: 1, label: "Lundi" },
  { value: 2, label: "Mardi" },
  { value: 3, label: "Mercredi" },
  { value: 4, label: "Jeudi" },
  { value: 5, label: "Vendredi" },
  { value: 6, label: "Samedi" },
]

const genderOptions = [
  { value: "female", label: "Femmes", icon: HeartIcon },
  { value: "male", label: "Hommes", icon: UserIcon },
  { value: "all", label: "Tous", icon: UsersIcon },
]

export function SpecialDaysManagement() {
  const { specialDays, addSpecialDay, updateSpecialDay, deleteSpecialDay, getTodayMultiplier } = useLoyalty()
  const { addNotification } = useNotification()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState<SpecialDay | null>(null)
  const [useSpecificDate, setUseSpecificDate] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetGender: undefined as Gender | undefined,
    dayOfWeek: undefined as number | undefined,
    specificDate: "",
    multiplier: 2,
    bonusPoints: 0,
    isActive: true,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      targetGender: undefined,
      dayOfWeek: undefined,
      specificDate: "",
      multiplier: 2,
      bonusPoints: 0,
      isActive: true,
    })
    setUseSpecificDate(false)
  }

  const handleAdd = () => {
    if (!formData.name || !formData.description) {
      addNotification("Veuillez remplir tous les champs obligatoires", "error")
      return
    }

    if (!useSpecificDate && formData.dayOfWeek === undefined) {
      addNotification("Veuillez selectionner un jour de la semaine", "error")
      return
    }

    if (useSpecificDate && !formData.specificDate) {
      addNotification("Veuillez selectionner une date specifique", "error")
      return
    }

    addSpecialDay({
      name: formData.name,
      description: formData.description,
      targetGender: formData.targetGender,
      dayOfWeek: useSpecificDate ? undefined : formData.dayOfWeek,
      specificDate: useSpecificDate ? formData.specificDate : undefined,
      multiplier: formData.multiplier,
      bonusPoints: formData.bonusPoints || undefined,
      isActive: formData.isActive,
    })

    addNotification("Journee speciale ajoutee avec succes", "success")
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEdit = () => {
    if (!selectedDay || !formData.name || !formData.description) {
      addNotification("Veuillez remplir tous les champs obligatoires", "error")
      return
    }

    updateSpecialDay(selectedDay.id, {
      name: formData.name,
      description: formData.description,
      targetGender: formData.targetGender,
      dayOfWeek: useSpecificDate ? undefined : formData.dayOfWeek,
      specificDate: useSpecificDate ? formData.specificDate : undefined,
      multiplier: formData.multiplier,
      bonusPoints: formData.bonusPoints || undefined,
      isActive: formData.isActive,
    })

    addNotification("Journee speciale modifiee avec succes", "success")
    setIsEditDialogOpen(false)
    setSelectedDay(null)
    resetForm()
  }

  const handleDelete = () => {
    if (!selectedDay) return

    deleteSpecialDay(selectedDay.id)
    addNotification("Journee speciale supprimee avec succes", "success")
    setIsDeleteDialogOpen(false)
    setSelectedDay(null)
  }

  const openEditDialog = (day: SpecialDay) => {
    setSelectedDay(day)
    setFormData({
      name: day.name,
      description: day.description,
      targetGender: day.targetGender,
      dayOfWeek: day.dayOfWeek,
      specificDate: day.specificDate || "",
      multiplier: day.multiplier,
      bonusPoints: day.bonusPoints || 0,
      isActive: day.isActive,
    })
    setUseSpecificDate(!!day.specificDate)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (day: SpecialDay) => {
    setSelectedDay(day)
    setIsDeleteDialogOpen(true)
  }

  const todayMultiplier = getTodayMultiplier()
  const today = new Date().getDay()
  const activeToday = specialDays.find(
    (d) => d.isActive && (d.dayOfWeek === today || d.specificDate === new Date().toISOString().split("T")[0])
  )

  const activeDays = specialDays.filter((d) => d.isActive)
  const inactiveDays = specialDays.filter((d) => !d.isActive)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Journees Speciales</h1>
          <p className="text-muted-foreground">Configurez les multiplicateurs de points pour des jours speciaux</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Nouvelle Journee
        </Button>
      </div>

      {/* Today's Status */}
      {activeToday && (
        <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500">
              <SparklesIcon className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-amber-900">{activeToday.name}</h2>
              <p className="text-amber-700">{activeToday.description}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-amber-600">x{activeToday.multiplier}</p>
              <p className="text-sm text-amber-700">Points aujourd'hui</p>
            </div>
          </div>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Journees Configurees</p>
              <p className="text-3xl font-bold">{specialDays.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Actives</p>
              <p className="text-3xl font-bold">{activeDays.length}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <SparklesIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Multiplicateur Aujourd'hui</p>
              <p className="text-3xl font-bold">x{todayMultiplier}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
              <SparklesIcon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Active Days */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Journees Actives</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeDays.map((day) => {
            const genderConfig = genderOptions.find((g) => g.value === day.targetGender)
            const GenderIcon = genderConfig?.icon || UsersIcon
            const dayName = day.dayOfWeek !== undefined ? daysOfWeek.find((d) => d.value === day.dayOfWeek)?.label : null

            return (
              <Card key={day.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-r from-amber-400 to-orange-500">
                    <SparklesIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(day)}>
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(day)}>
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-2">{day.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{day.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Jour:</span>
                    <Badge variant="outline">
                      {dayName || (day.specificDate ? new Date(day.specificDate).toLocaleDateString("fr-FR") : "N/A")}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cible:</span>
                    <div className="flex items-center gap-1">
                      <GenderIcon className="h-4 w-4" />
                      <span>{genderConfig?.label || "Tous"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Multiplicateur:</span>
                    <span className="font-bold text-amber-600">x{day.multiplier}</span>
                  </div>
                  {day.bonusPoints && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bonus fixe:</span>
                      <span className="font-medium text-green-600">+{day.bonusPoints} pts</span>
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Inactive Days */}
      {inactiveDays.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-muted-foreground">Journees Inactives</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {inactiveDays.map((day) => (
              <Card key={day.id} className="p-6 opacity-60">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    <SparklesIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(day)}>
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(day)}>
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">{day.name}</h3>
                <p className="text-sm text-muted-foreground">{day.description}</p>
                <Badge variant="outline" className="mt-4">
                  Inactive
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false)
          setIsEditDialogOpen(false)
          setSelectedDay(null)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? "Modifier la Journee" : "Nouvelle Journee Speciale"}</DialogTitle>
            <DialogDescription>
              {isEditDialogOpen ? "Modifiez les details de la journee speciale" : "Configurez une nouvelle journee avec multiplicateur de points"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Journee des Femmes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Points doubles pour toutes les femmes"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Date specifique (au lieu d'un jour recurrent)</Label>
              <Switch
                checked={useSpecificDate}
                onCheckedChange={setUseSpecificDate}
              />
            </div>

            {useSpecificDate ? (
              <div className="space-y-2">
                <Label htmlFor="specificDate">Date</Label>
                <Input
                  id="specificDate"
                  type="date"
                  value={formData.specificDate}
                  onChange={(e) => setFormData({ ...formData, specificDate: e.target.value })}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="dayOfWeek">Jour de la semaine</Label>
                <Select
                  value={formData.dayOfWeek?.toString()}
                  onValueChange={(value) => setFormData({ ...formData, dayOfWeek: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectionnez un jour" />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfWeek.map((day) => (
                      <SelectItem key={day.value} value={day.value.toString()}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="targetGender">Public cible</Label>
              <Select
                value={formData.targetGender || "all"}
                onValueChange={(value) => setFormData({ ...formData, targetGender: value === "all" ? undefined : value as Gender })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((gender) => {
                    const Icon = gender.icon
                    return (
                      <SelectItem key={gender.value} value={gender.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {gender.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="multiplier">Multiplicateur</Label>
                <Select
                  value={formData.multiplier.toString()}
                  onValueChange={(value) => setFormData({ ...formData, multiplier: parseFloat(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.5">x1.5</SelectItem>
                    <SelectItem value="2">x2</SelectItem>
                    <SelectItem value="2.5">x2.5</SelectItem>
                    <SelectItem value="3">x3</SelectItem>
                    <SelectItem value="5">x5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bonusPoints">Bonus fixe (pts)</Label>
                <Input
                  id="bonusPoints"
                  type="number"
                  min="0"
                  value={formData.bonusPoints}
                  onChange={(e) => setFormData({ ...formData, bonusPoints: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Journee active</Label>
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
            <DialogTitle>Supprimer la Journee Speciale</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer "{selectedDay?.name}" ? Cette action est irreversible.
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
