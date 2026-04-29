"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeftIcon,
  SaveIcon,
  TruckIcon,
  StoreIcon,
  ClockIcon,
  CoinsIcon,
  MapPinIcon,
  PackageIcon,
  PlusIcon,
  XIcon,
  InfoIcon,
  CheckCircleIcon,
  SettingsIcon,
  AlertCircleIcon,
} from "lucide-react"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { OrdersProvider, useOrders, type DeliveryConfig } from "@/contexts/orders-context"
import { NotificationProvider, useNotification } from "@/contexts/notification-context"
import { NotificationContainer } from "@/components/notification-container"
import { LoyaltyProvider } from "@/contexts/loyalty-context"

function DeliveryConfigContent() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { addNotification } = useNotification()
  const { deliveryConfig, updateDeliveryConfig } = useOrders()

  // Local state for form
  const [config, setConfig] = useState<DeliveryConfig>(deliveryConfig)
  const [newZone, setNewZone] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  // Sync with context
  useEffect(() => {
    setConfig(deliveryConfig)
  }, [deliveryConfig])

  // Track changes
  useEffect(() => {
    setHasChanges(JSON.stringify(config) !== JSON.stringify(deliveryConfig))
  }, [config, deliveryConfig])

  // Check admin access
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Card className="p-8 text-center max-w-md">
          <AlertCircleIcon className="h-12 w-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Acces refuse</h2>
          <p className="text-stone-500 mb-4">Vous devez etre administrateur pour acceder a cette page.</p>
          <Button onClick={() => router.push("/")} className="bg-amber-500 hover:bg-amber-600">
            Retour a l&apos;accueil
          </Button>
        </Card>
      </div>
    )
  }

  // Handle save
  const handleSave = async () => {
    await updateDeliveryConfig(config)
    addNotification({
      type: "success",
      title: "Configuration sauvegardee",
      message: "Les parametres de livraison ont ete mis a jour",
    })
    setHasChanges(false)
  }

  // Add zone
  const addZone = () => {
    if (newZone && !config.deliveryZones.includes(newZone)) {
      setConfig(prev => ({
        ...prev,
        deliveryZones: [...prev.deliveryZones, newZone]
      }))
      setNewZone("")
    }
  }

  // Remove zone
  const removeZone = (zone: string) => {
    setConfig(prev => ({
      ...prev,
      deliveryZones: prev.deliveryZones.filter(z => z !== zone)
    }))
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Configuration Livraison</h1>
                <p className="text-sm text-stone-500">Parametres de commande et livraison</p>
              </div>
            </div>
            <Button
              className="bg-amber-500 hover:bg-amber-600"
              onClick={() => void handleSave()}
              disabled={!hasChanges}
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Changes indicator */}
        {hasChanges && (
          <Card className="p-4 bg-amber-50 border-amber-200 flex items-center gap-3">
            <InfoIcon className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700 flex-1">
              Vous avez des modifications non sauvegardees
            </p>
            <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={() => void handleSave()}>
              Sauvegarder
            </Button>
          </Card>
        )}

        {/* Delivery/Pickup Toggles */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-stone-600" />
            Modes de reception
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <TruckIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Livraison a domicile</p>
                  <p className="text-sm text-stone-500">Permettre aux clients de se faire livrer</p>
                </div>
              </div>
              <Switch
                checked={config.deliveryEnabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, deliveryEnabled: checked }))}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-stone-50 border">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <StoreIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold">Retrait sur place</p>
                  <p className="text-sm text-stone-500">Permettre aux clients de recuperer leur commande</p>
                </div>
              </div>
              <Switch
                checked={config.pickupEnabled}
                onCheckedChange={(checked) => setConfig(prev => ({ ...prev, pickupEnabled: checked }))}
              />
            </div>
          </div>
        </Card>

        {/* Delivery Fees */}
        {config.deliveryEnabled && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CoinsIcon className="h-5 w-5 text-stone-600" />
              Frais de livraison
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="deliveryFee">Frais de livraison (TND)</Label>
                <div className="relative">
                  <Input
                    id="deliveryFee"
                    type="number"
                    min="0"
                    step="0.5"
                    value={config.deliveryFee}
                    onChange={(e) => setConfig(prev => ({ ...prev, deliveryFee: parseFloat(e.target.value) || 0 }))}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">TND</span>
                </div>
                <p className="text-xs text-stone-500">Frais appliques pour chaque livraison</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="freeThreshold">Seuil livraison gratuite (TND)</Label>
                <div className="relative">
                  <Input
                    id="freeThreshold"
                    type="number"
                    min="0"
                    step="5"
                    value={config.freeDeliveryThreshold}
                    onChange={(e) => setConfig(prev => ({ ...prev, freeDeliveryThreshold: parseFloat(e.target.value) || 0 }))}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">TND</span>
                </div>
                <p className="text-xs text-stone-500">Livraison gratuite au-dela de ce montant (0 = jamais gratuit)</p>
              </div>
            </div>
            
            {/* Preview */}
            <div className="mt-4 p-4 bg-stone-50 rounded-xl">
              <p className="text-sm font-medium text-stone-600 mb-2">Apercu:</p>
              <div className="space-y-1 text-sm">
                <p className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                  Commande {"<"} {config.freeDeliveryThreshold} TND: +{config.deliveryFee} TND de frais
                </p>
                <p className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                  Commande {">="} {config.freeDeliveryThreshold} TND: Livraison gratuite
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Estimated Times */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-stone-600" />
            Temps estimes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {config.deliveryEnabled && (
              <div className="space-y-2">
                <Label htmlFor="deliveryTime">Temps de livraison (minutes)</Label>
                <div className="relative">
                  <Input
                    id="deliveryTime"
                    type="number"
                    min="5"
                    step="5"
                    value={config.estimatedDeliveryTime}
                    onChange={(e) => setConfig(prev => ({ ...prev, estimatedDeliveryTime: parseInt(e.target.value) || 30 }))}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">min</span>
                </div>
                <p className="text-xs text-stone-500">Temps moyen pour une livraison</p>
              </div>
            )}
            {config.pickupEnabled && (
              <div className="space-y-2">
                <Label htmlFor="pickupTime">Temps de preparation (minutes)</Label>
                <div className="relative">
                  <Input
                    id="pickupTime"
                    type="number"
                    min="5"
                    step="5"
                    value={config.estimatedPickupTime}
                    onChange={(e) => setConfig(prev => ({ ...prev, estimatedPickupTime: parseInt(e.target.value) || 15 }))}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">min</span>
                </div>
                <p className="text-xs text-stone-500">Temps moyen pour preparer une commande</p>
              </div>
            )}
          </div>
        </Card>

        {/* Minimum Order */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PackageIcon className="h-5 w-5 text-stone-600" />
            Commande minimum
          </h2>
          <div className="max-w-sm space-y-2">
            <Label htmlFor="minOrder">Montant minimum de commande (TND)</Label>
            <div className="relative">
              <Input
                id="minOrder"
                type="number"
                min="0"
                step="1"
                value={config.minOrderAmount}
                onChange={(e) => setConfig(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) || 0 }))}
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-stone-500">TND</span>
            </div>
            <p className="text-xs text-stone-500">Les clients ne peuvent pas commander moins que ce montant (0 = pas de minimum)</p>
          </div>
        </Card>

        {/* Delivery Zones */}
        {config.deliveryEnabled && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPinIcon className="h-5 w-5 text-stone-600" />
              Zones de livraison
            </h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter une ville/zone..."
                  value={newZone}
                  onChange={(e) => setNewZone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addZone()}
                />
                <Button onClick={addZone} className="bg-amber-500 hover:bg-amber-600">
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {config.deliveryZones.map(zone => (
                  <Badge
                    key={zone}
                    variant="secondary"
                    className="text-sm py-1.5 px-3 bg-stone-100 hover:bg-stone-200 cursor-pointer"
                  >
                    {zone}
                    <button
                      onClick={() => removeZone(zone)}
                      className="ml-2 hover:text-red-500"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              {config.deliveryZones.length === 0 && (
                <p className="text-sm text-stone-500 text-center py-4">
                  Aucune zone definie (livraison partout)
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Summary */}
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <h2 className="text-lg font-semibold mb-4 text-amber-800">Resume de la configuration</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white/60 rounded-xl">
              <TruckIcon className={`h-6 w-6 mx-auto mb-1 ${config.deliveryEnabled ? "text-blue-600" : "text-stone-400"}`} />
              <p className="text-sm font-medium">{config.deliveryEnabled ? "Livraison active" : "Livraison desactivee"}</p>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-xl">
              <StoreIcon className={`h-6 w-6 mx-auto mb-1 ${config.pickupEnabled ? "text-emerald-600" : "text-stone-400"}`} />
              <p className="text-sm font-medium">{config.pickupEnabled ? "Retrait actif" : "Retrait desactive"}</p>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-xl">
              <CoinsIcon className="h-6 w-6 mx-auto mb-1 text-amber-600" />
              <p className="text-sm font-medium">{config.deliveryFee} TND frais</p>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-xl">
              <ClockIcon className="h-6 w-6 mx-auto mb-1 text-purple-600" />
              <p className="text-sm font-medium">~{config.estimatedPickupTime} min prep</p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  )
}

export default function DeliveryConfigPage() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <LoyaltyProvider>  {/* Loyalty likely depends on auth */}
          <OrdersProvider>  {/* Orders might depend on loyalty */}
            <DeliveryConfigContent />
          </OrdersProvider>
        </LoyaltyProvider>
        <NotificationContainer />
      </AuthProvider>
    </NotificationProvider>
  )
}
