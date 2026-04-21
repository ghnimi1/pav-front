"use client"

import { useState } from "react"
import { useProduction } from "@/contexts/production-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  GlassWaterIcon,
  ThermometerIcon,
  MapPinIcon,
  PackageIcon,
  SnowflakeIcon,
  SunIcon,
  FlameIcon,
  BoxIcon
} from "lucide-react"
import type { Showcase } from "@/contexts/production-context"

export function ShowcasesManagement() {
  const { 
    showcases, 
    addShowcase, 
    updateShowcase, 
    deleteShowcase,
    showcaseItems,
    getShowcaseStock
  } = useProduction()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingShowcase, setEditingShowcase] = useState<Showcase | null>(null)
  
  const [form, setForm] = useState({
    name: "",
    type: "ambient" as Showcase["type"],
    temperature: "",
    capacity: 50,
    location: "",
    isActive: true,
  })
  
  // Stats
  const totalShowcases = showcases?.length || 0
  const activeShowcases = showcases?.filter(s => s.isActive).length || 0
  const totalItems = showcaseItems?.filter(i => i.quantity > 0).length || 0
  const totalCapacity = showcases?.reduce((sum, s) => sum + (s.capacity || 0), 0) || 0
  
  const resetForm = () => {
    setForm({
      name: "",
      type: "ambient",
      temperature: "",
      capacity: 50,
      location: "",
      isActive: true,
    })
    setEditingShowcase(null)
  }
  
  const openDialog = (showcase?: Showcase) => {
    if (showcase) {
      setEditingShowcase(showcase)
      setForm({
        name: showcase.name,
        type: showcase.type,
        temperature: showcase.temperature || "",
        capacity: showcase.capacity || 50,
        location: showcase.location,
        isActive: showcase.isActive,
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }
  
  const handleSubmit = () => {
    if (!form.name.trim()) return
    
    if (editingShowcase) {
      updateShowcase(editingShowcase.id, form)
    } else {
      addShowcase(form)
    }
    
    setIsDialogOpen(false)
    resetForm()
  }
  
  const handleDelete = (id: string) => {
    const stock = getShowcaseStock(id)
    if (stock.length > 0) {
      alert("Impossible de supprimer cette vitrine car elle contient des produits")
      return
    }
    if (confirm("Supprimer cette vitrine?")) {
      deleteShowcase(id)
    }
  }
  
  const getTypeIcon = (type: Showcase["type"]) => {
    switch (type) {
      case "refrigerated": return <SnowflakeIcon className="h-5 w-5 text-blue-500" />
      case "frozen": return <SnowflakeIcon className="h-5 w-5 text-cyan-500" />
      case "heated": return <FlameIcon className="h-5 w-5 text-orange-500" />
      case "ambient": return <SunIcon className="h-5 w-5 text-amber-500" />
      default: return <BoxIcon className="h-5 w-5" />
    }
  }
  
  const getTypeLabel = (type: Showcase["type"]) => {
    switch (type) {
      case "refrigerated": return "Refrigeree"
      case "frozen": return "Congelee"
      case "heated": return "Chauffee"
      case "ambient": return "Ambiante"
      default: return type
    }
  }
  
  const getTypeColor = (type: Showcase["type"]) => {
    switch (type) {
      case "refrigerated": return "bg-blue-100 text-blue-800"
      case "frozen": return "bg-cyan-100 text-cyan-800"
      case "heated": return "bg-orange-100 text-orange-800"
      case "ambient": return "bg-amber-100 text-amber-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground flex items-center gap-2">
            <GlassWaterIcon className="h-8 w-8 text-amber-600" />
            Vitrines de Vente
          </h1>
          <p className="text-muted-foreground">Gerez vos vitrines et comptoirs de vente</p>
        </div>
        <Button onClick={() => openDialog()} className="bg-amber-600 hover:bg-amber-700">
          <PlusIcon className="h-4 w-4 mr-2" />
          Nouvelle Vitrine
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <GlassWaterIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vitrines</p>
                <p className="text-2xl font-bold">{totalShowcases}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <SunIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vitrines Actives</p>
                <p className="text-2xl font-bold">{activeShowcases}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <PackageIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Produits en Vitrine</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <BoxIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Capacite Totale</p>
                <p className="text-2xl font-bold">{totalCapacity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Showcases Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(showcases || []).map(showcase => {
          const stock = getShowcaseStock(showcase.id)
          const itemCount = stock.reduce((sum, i) => sum + i.quantity, 0)
          const occupancy = showcase.capacity ? (itemCount / showcase.capacity) * 100 : 0
          
          return (
            <Card key={showcase.id} className={`overflow-hidden ${!showcase.isActive ? 'opacity-60' : ''}`}>
              <div className={`h-2 ${getTypeColor(showcase.type).split(' ')[0]}`} />
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(showcase.type)}
                    <CardTitle className="text-lg">{showcase.name}</CardTitle>
                  </div>
                  <Badge className={getTypeColor(showcase.type)}>{getTypeLabel(showcase.type)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{showcase.location}</span>
                  </div>
                  {showcase.temperature && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ThermometerIcon className="h-4 w-4" />
                      <span>{showcase.temperature}</span>
                    </div>
                  )}
                </div>
                
                {/* Occupancy */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Occupation</span>
                    <span className="font-medium">{itemCount} / {showcase.capacity || "∞"}</span>
                  </div>
                  {showcase.capacity && (
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          occupancy > 80 ? 'bg-red-500' : occupancy > 50 ? 'bg-amber-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, occupancy)}%` }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Stock count */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    <PackageIcon className="h-4 w-4 inline mr-1" />
                    {stock.length} lots en stock
                  </span>
                  {!showcase.isActive && <Badge variant="secondary">Inactive</Badge>}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openDialog(showcase)}>
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(showcase.id)}>
                    <TrashIcon className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {(showcases || []).length === 0 && (
        <div className="text-center py-12">
          <GlassWaterIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Aucune vitrine configuree</p>
          <Button variant="link" onClick={() => openDialog()}>Ajouter une vitrine</Button>
        </div>
      )}
      
      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GlassWaterIcon className="h-5 w-5 text-amber-600" />
              {editingShowcase ? "Modifier la Vitrine" : "Nouvelle Vitrine"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de la vitrine *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Vitrine Patisserie"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Type de vitrine *</Label>
              <Select 
                value={form.type} 
                onValueChange={(v: Showcase["type"]) => {
                  let temp = ""
                  switch (v) {
                    case "refrigerated": temp = "4-6°C"; break
                    case "frozen": temp = "-18°C"; break
                    case "heated": temp = "Chaud"; break
                    case "ambient": temp = "Ambiante"; break
                  }
                  setForm({ ...form, type: v, temperature: temp })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambient">
                    <div className="flex items-center gap-2">
                      <SunIcon className="h-4 w-4 text-amber-500" />
                      Ambiante
                    </div>
                  </SelectItem>
                  <SelectItem value="refrigerated">
                    <div className="flex items-center gap-2">
                      <SnowflakeIcon className="h-4 w-4 text-blue-500" />
                      Refrigeree
                    </div>
                  </SelectItem>
                  <SelectItem value="frozen">
                    <div className="flex items-center gap-2">
                      <SnowflakeIcon className="h-4 w-4 text-cyan-500" />
                      Congelee
                    </div>
                  </SelectItem>
                  <SelectItem value="heated">
                    <div className="flex items-center gap-2">
                      <FlameIcon className="h-4 w-4 text-orange-500" />
                      Chauffee
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Temperature</Label>
                <Input
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                  placeholder="Ex: 4-6°C"
                />
              </div>
              <div className="space-y-2">
                <Label>Capacite (produits)</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 50 })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Emplacement *</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Ex: Entree principale, Comptoir central..."
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <Label>Vitrine active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSubmit} className="bg-amber-600 hover:bg-amber-700">
              {editingShowcase ? "Enregistrer" : "Creer la Vitrine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
