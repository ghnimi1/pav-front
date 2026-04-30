"use client"

import { useEffect, useState } from "react"
import { apiGet, apiPost } from "@/lib/api-client"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import {
  CalendarIcon,
  EditIcon,
  MailIcon,
  PhoneIcon,
  SearchIcon,
  TrashIcon,
  TrophyIcon,
  UserPlusIcon,
} from "lucide-react"
import { useNotification } from "@/contexts/notification-context"
import type { User, LoyaltyTier } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog"
import { Label } from "./ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Pagination } from "./pagination"

type ClientApiUser = {
  _id?: string
  id?: string
  email: string
  name: string
  role: "client" | "admin" | "user"
  createdAt: string
  phone?: string
  loyaltyPoints?: number
  loyaltyTier?: "bronze" | "silver" | "gold" | "diamond" | "platinum"
  totalSpent?: number
}

type ClientRow = User & { phone?: string }

const tierOptions: { value: LoyaltyTier; label: string }[] = [
  { value: "bronze", label: "Bronze" },
  { value: "silver", label: "Argent" },
  { value: "gold", label: "Or" },
  { value: "platinum", label: "Platine" },
]

export function ClientsManagement() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTier, setSelectedTier] = useState<string>("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const { addNotification } = useNotification()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    loyaltyPoints: 0,
    loyaltyTier: "bronze" as LoyaltyTier,
    totalSpent: 0,
  })

  useEffect(() => {
    void loadClients()
  }, [])

  const normalizeClient = (client: ClientApiUser): ClientRow => ({
    id: client.id || client._id || "",
    email: client.email,
    name: client.name,
    role: "client",
    createdAt: client.createdAt,
    loyaltyPoints: client.loyaltyPoints || 0,
    loyaltyTier: client.loyaltyTier === "diamond" ? "platinum" : (client.loyaltyTier || "bronze"),
    totalSpent: client.totalSpent || 0,
    phone: client.phone,
  })

  const loadClients = async () => {
    try {
      const response = await apiGet<{ clients: ClientApiUser[] }>("/auth/clients")
      setClients(response.clients.map(normalizeClient))
    } catch (error) {
      console.error("Failed to load clients from backend:", error)
      setClients([])
      addNotification({
        type: "error",
        category: "client",
        title: "Chargement impossible",
        message: "La liste des clients n'a pas pu etre chargee depuis le serveur",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      loyaltyPoints: 0,
      loyaltyTier: "bronze",
      totalSpent: 0,
    })
  }

  const handleAdd = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      addNotification({
        type: "error",
        category: "client",
        title: "Champs obligatoires",
        message: "Veuillez remplir le nom, l'email et le mot de passe",
      })
      return
    }

    if (formData.password.length < 6) {
      addNotification({
        type: "error",
        category: "client",
        title: "Mot de passe trop court",
        message: "Le mot de passe doit contenir au moins 6 caracteres",
      })
      return
    }

    try {
      const response = await apiPost<{ client: ClientApiUser }>("/auth/clients", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        loyaltyPoints: formData.loyaltyPoints,
        loyaltyTier: formData.loyaltyTier === "platinum" ? "diamond" : formData.loyaltyTier,
        totalSpent: formData.totalSpent,
      })

      setClients((prev) => [normalizeClient(response.client), ...prev])
      addNotification({
        type: "success",
        category: "client",
        title: "Client ajoute",
        message: `${formData.name} a ete ajoute avec succes`,
      })
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      addNotification({
        type: "error",
        category: "client",
        title: "Ajout impossible",
        message: error instanceof Error ? error.message : "Impossible d'ajouter le client",
      })
    }
  }

  const handleEdit = () => {
    if (!selectedClient || !formData.name || !formData.email) {
      addNotification({
        type: "error",
        category: "client",
        title: "Champs obligatoires",
        message: "Veuillez remplir le nom et l'email",
      })
      return
    }

    const { password, ...clientUpdates } = formData

    setClients((prev) =>
      prev.map((client) =>
        client.id === selectedClient.id
          ? {
              ...client,
              ...clientUpdates,
            }
          : client
      )
    )

    addNotification({
      type: "info",
      category: "client",
      title: "Backend requis",
      message: "La modification client doit maintenant etre persistee cote serveur",
    })
    setIsEditDialogOpen(false)
    setSelectedClient(null)
    resetForm()
  }

  const handleDelete = () => {
    if (!selectedClient) return

    setClients((prev) => prev.filter((client) => client.id !== selectedClient.id))
    addNotification({
      type: "info",
      category: "client",
      title: "Backend requis",
      message: "La suppression client doit maintenant etre persistee cote serveur",
    })
    setIsDeleteDialogOpen(false)
    setSelectedClient(null)
  }

  const openEditDialog = (client: ClientRow) => {
    setSelectedClient(client)
    setFormData({
      name: client.name,
      email: client.email,
      password: "",
      phone: client.phone || "",
      loyaltyPoints: client.loyaltyPoints || 0,
      loyaltyTier: client.loyaltyTier || "bronze",
      totalSpent: client.totalSpent || 0,
    })
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (client: ClientRow) => {
    setSelectedClient(client)
    setIsDeleteDialogOpen(true)
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTier = selectedTier === "all" || client.loyaltyTier === selectedTier
    return matchesSearch && matchesTier
  })

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const stats = {
    totalClients: clients.length,
    totalPoints: clients.reduce((sum, client) => sum + (client.loyaltyPoints || 0), 0),
    totalSpent: clients.reduce((sum, client) => sum + (client.totalSpent || 0), 0),
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Gestion des Clients</h1>
          <p className="text-muted-foreground">Gerez les informations de vos clients</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Ajouter un client
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <p className="text-3xl font-bold">{stats.totalClients}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <UserPlusIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Points Totaux</p>
              <p className="text-3xl font-bold">{stats.totalPoints}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
              <TrophyIcon className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
              <p className="text-3xl font-bold">{stats.totalSpent.toFixed(2)} TND</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <TrophyIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button variant={selectedTier === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedTier("all")}>
            Tous
          </Button>
          {tierOptions.map((tier) => (
            <Button
              key={tier.value}
              variant={selectedTier === tier.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTier(tier.value)}
            >
              {tier.label}
            </Button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4 pb-3 text-left text-sm font-medium text-muted-foreground">Client</th>
                <th className="p-4 pb-3 text-left text-sm font-medium text-muted-foreground">Contact</th>
                <th className="p-4 pb-3 text-left text-sm font-medium text-muted-foreground">Niveau</th>
                <th className="p-4 pb-3 text-right text-sm font-medium text-muted-foreground">Points</th>
                <th className="p-4 pb-3 text-right text-sm font-medium text-muted-foreground">Depenses</th>
                <th className="p-4 pb-3 text-center text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedClients.map((client) => (
                <tr key={client.id} className="border-b border-border last:border-0">
                  <td className="p-4 py-4">
                    <div>
                      <p className="font-medium text-foreground">{client.name}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        {new Date(client.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </td>
                  <td className="p-4 py-4">
                    <div className="space-y-1">
                      <p className="flex items-center gap-1 text-sm text-foreground">
                        <MailIcon className="h-3 w-3" />
                        {client.email}
                      </p>
                      {client.phone && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <PhoneIcon className="h-3 w-3" />
                          {client.phone}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 py-4">
                    <Badge variant={client.loyaltyTier === "platinum" ? "default" : client.loyaltyTier === "gold" ? "secondary" : "outline"}>
                      {tierOptions.find((tier) => tier.value === client.loyaltyTier)?.label || "Bronze"}
                    </Badge>
                  </td>
                  <td className="p-4 py-4 text-right">
                    <span className="font-medium text-foreground">{client.loyaltyPoints || 0}</span>
                  </td>
                  <td className="p-4 py-4 text-right">
                    <span className="font-medium text-foreground">{(client.totalSpent || 0).toFixed(2)} TND</span>
                  </td>
                  <td className="p-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(client)}>
                        <EditIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(client)}>
                        <TrashIcon className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredClients.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={itemsPerPage}
          totalItems={filteredClients.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setItemsPerPage(size)
            setCurrentPage(1)
          }}
        />
      )}

      {filteredClients.length === 0 && (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="text-center">
            <UserPlusIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium text-foreground">Aucun client trouve</p>
            <p className="text-sm text-muted-foreground">La liste est maintenant chargee uniquement depuis le serveur</p>
          </div>
        </div>
      )}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau client</DialogTitle>
            <DialogDescription>Remplissez les informations du nouveau client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet *</Label>
              <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nom du client" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemple.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Minimum 6 caracteres" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telephone</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+216 XX XXX XXX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="loyaltyPoints">Points de fidelite</Label>
                <Input id="loyaltyPoints" type="number" value={formData.loyaltyPoints} onChange={(e) => setFormData({ ...formData, loyaltyPoints: Number.parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalSpent">Depenses totales (TND)</Label>
                <Input id="totalSpent" type="number" step="0.01" value={formData.totalSpent} onChange={(e) => setFormData({ ...formData, totalSpent: Number.parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier">Niveau de fidelite</Label>
              <Select value={formData.loyaltyTier} onValueChange={(value: LoyaltyTier) => setFormData({ ...formData, loyaltyTier: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tierOptions.map((tier) => (
                    <SelectItem key={tier.value} value={tier.value}>
                      {tier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAdd}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>Modifiez les informations du client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom complet *</Label>
              <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nom du client" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input id="edit-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemple.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Telephone</Label>
              <Input id="edit-phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+216 XX XXX XXX" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-loyaltyPoints">Points de fidelite</Label>
                <Input id="edit-loyaltyPoints" type="number" value={formData.loyaltyPoints} onChange={(e) => setFormData({ ...formData, loyaltyPoints: Number.parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-totalSpent">Depenses totales (TND)</Label>
                <Input id="edit-totalSpent" type="number" step="0.01" value={formData.totalSpent} onChange={(e) => setFormData({ ...formData, totalSpent: Number.parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tier">Niveau de fidelite</Label>
              <Select value={formData.loyaltyTier} onValueChange={(value: LoyaltyTier) => setFormData({ ...formData, loyaltyTier: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tierOptions.map((tier) => (
                    <SelectItem key={tier.value} value={tier.value}>
                      {tier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le client</DialogTitle>
            <DialogDescription>
              Etes-vous sur de vouloir supprimer le client <strong>{selectedClient?.name}</strong> ? Cette action est irreversible.
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
