"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  PercentIcon, 
  PlusIcon, 
  Trash2Icon, 
  EditIcon,
  SaveIcon,
  XIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  RefreshCwIcon,
  InfoIcon,
  TrendingUpIcon,
  GiftIcon,
  ChevronLeftIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  SettingsIcon,
  SparklesIcon,
} from "lucide-react"
import Link from "next/link"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { DiscountProvider, useDiscount, type DiscountTier } from "@/contexts/discount-context"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { NotificationProvider } from "@/contexts/notification-context"

// Color options for tiers
const colorOptions = [
  { value: "bg-emerald-500", label: "Vert", preview: "bg-emerald-500" },
  { value: "bg-blue-500", label: "Bleu", preview: "bg-blue-500" },
  { value: "bg-purple-500", label: "Violet", preview: "bg-purple-500" },
  { value: "bg-amber-500", label: "Ambre", preview: "bg-amber-500" },
  { value: "bg-rose-500", label: "Rose", preview: "bg-rose-500" },
  { value: "bg-red-500", label: "Rouge", preview: "bg-red-500" },
  { value: "bg-cyan-500", label: "Cyan", preview: "bg-cyan-500" },
  { value: "bg-gradient-to-r from-amber-500 to-rose-500", label: "Degrade Or-Rose", preview: "bg-gradient-to-r from-amber-500 to-rose-500" },
  { value: "bg-gradient-to-r from-purple-500 to-pink-500", label: "Degrade Violet-Rose", preview: "bg-gradient-to-r from-purple-500 to-pink-500" },
]

function DiscountSettingsContent() {
  const { user } = useAuth()
  const { 
    config, 
    tiers, 
    isEnabled,
    toggleDiscountSystem,
    addTier,
    updateTier,
    deleteTier,
    toggleTier,
    updateConfig,
    resetToDefaults,
  } = useDiscount()

  const [editingTier, setEditingTier] = useState<DiscountTier | null>(null)
  const [isAddingTier, setIsAddingTier] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  
  // Form state for new/edit tier
  const [tierForm, setTierForm] = useState({
    name: "",
    minAmount: "",
    maxAmount: "",
    percent: "",
    color: "bg-emerald-500",
  })

  // Check admin access
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertTriangleIcon className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-900 mb-2">Acces Restreint</h2>
          <p className="text-stone-600 mb-4">Vous devez etre administrateur pour acceder a cette page.</p>
          <Link href="/admin">
            <Button>Retour au Dashboard</Button>
          </Link>
        </Card>
      </div>
    )
  }

  const handleOpenAddTier = () => {
    setTierForm({
      name: "",
      minAmount: "",
      maxAmount: "",
      percent: "",
      color: "bg-emerald-500",
    })
    setIsAddingTier(true)
  }

  const handleOpenEditTier = (tier: DiscountTier) => {
    setTierForm({
      name: tier.name,
      minAmount: tier.minAmount.toString(),
      maxAmount: tier.maxAmount.toString(),
      percent: tier.percent.toString(),
      color: tier.color,
    })
    setEditingTier(tier)
  }

  const handleSaveTier = () => {
    const data = {
      name: tierForm.name,
      minAmount: parseFloat(tierForm.minAmount),
      maxAmount: parseFloat(tierForm.maxAmount),
      percent: parseFloat(tierForm.percent),
      color: tierForm.color,
      isActive: true,
    }

    if (editingTier) {
      updateTier(editingTier.id, data)
      setEditingTier(null)
    } else {
      addTier(data)
      setIsAddingTier(false)
    }
  }

  const handleDeleteTier = (id: string) => {
    deleteTier(id)
  }

  // Calculate potential savings for preview
  const calculatePreview = (amount: number) => {
    const tier = tiers.find(t => t.isActive && amount >= t.minAmount && amount <= t.maxAmount)
    if (!tier) return { discount: 0, final: amount }
    const discount = amount * (tier.percent / 100)
    return { discount, final: amount - discount, tier }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50/30">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/parametres" className="text-stone-500 hover:text-stone-700">
                <ChevronLeftIcon className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Configuration des Remises</h1>
                <p className="text-sm text-stone-500">Gerez les paliers de reduction progressifs</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                className="text-stone-600"
              >
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Reinitialiser
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Master Switch */}
        <Card className="p-6 border-0 shadow-lg bg-white rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${
                isEnabled ? "bg-emerald-100" : "bg-stone-100"
              }`}>
                <SparklesIcon className={`h-7 w-7 ${isEnabled ? "text-emerald-600" : "text-stone-400"}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-stone-900">Systeme de Remises Progressives</h2>
                <p className="text-sm text-stone-500">
                  {isEnabled 
                    ? "Les clients beneficient de reductions automatiques selon leurs achats" 
                    : "Les remises sont desactivees pour tous les clients"
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${isEnabled ? "text-emerald-600" : "text-stone-400"}`}>
                {isEnabled ? "Active" : "Inactive"}
              </span>
              <Switch
                checked={isEnabled}
                onCheckedChange={toggleDiscountSystem}
              />
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card className="p-6 border-0 shadow-lg bg-white rounded-2xl">
          <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-amber-500" />
            Parametres Generaux
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">
                Nombre minimum d&apos;articles pour la remise
              </label>
              <Input
                type="number"
                min="1"
                value={config.minItemsForDiscount}
                onChange={(e) => updateConfig({ minItemsForDiscount: parseInt(e.target.value) || 1 })}
                className="max-w-[120px]"
              />
              <p className="text-xs text-stone-500 mt-1">
                Le client doit avoir au moins ce nombre d&apos;articles pour beneficier d&apos;une remise
              </p>
            </div>
          </div>
        </Card>

        {/* Tiers List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-stone-900 flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-amber-500" />
              Paliers de Remise ({tiers.length})
            </h3>
            <Button onClick={handleOpenAddTier} size="sm" className="bg-amber-500 hover:bg-amber-600">
              <PlusIcon className="h-4 w-4 mr-2" />
              Ajouter un Palier
            </Button>
          </div>

          <div className="grid gap-4">
            <AnimatePresence>
              {tiers.sort((a, b) => a.minAmount - b.minAmount).map((tier, index) => (
                <motion.div
                  key={tier.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`p-4 border-0 shadow-md rounded-xl transition-all ${
                    tier.isActive ? "bg-white" : "bg-stone-50 opacity-60"
                  }`}>
                    <div className="flex items-center gap-4">
                      {/* Color indicator */}
                      <div className={`h-12 w-12 rounded-xl ${tier.color} flex items-center justify-center shadow-lg`}>
                        <PercentIcon className="h-6 w-6 text-white" />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-stone-900">{tier.name}</h4>
                          <Badge variant="outline" className={tier.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-100 text-stone-500"}>
                            {tier.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-stone-600">
                          De <span className="font-medium">{tier.minAmount} TND</span> a{" "}
                          <span className="font-medium">{tier.maxAmount >= 999999 ? "∞" : `${tier.maxAmount} TND`}</span>
                        </p>
                      </div>

                      {/* Discount Badge */}
                      <div className="text-center px-4">
                        <div className="text-2xl font-bold text-stone-900">-{tier.percent}%</div>
                        <p className="text-xs text-stone-500">Reduction</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleTier(tier.id)}
                          className={tier.isActive ? "text-emerald-600 hover:text-emerald-700" : "text-stone-400 hover:text-stone-600"}
                        >
                          {tier.isActive ? (
                            <ToggleRightIcon className="h-5 w-5" />
                          ) : (
                            <ToggleLeftIcon className="h-5 w-5" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditTier(tier)}
                          className="text-stone-500 hover:text-stone-700"
                        >
                          <EditIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTier(tier.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Preview Calculator */}
        <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl">
          <h3 className="font-semibold text-stone-900 mb-4 flex items-center gap-2">
            <GiftIcon className="h-5 w-5 text-amber-500" />
            Simulateur de Remise
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {[15, 35, 75].map((amount) => {
              const preview = calculatePreview(amount)
              return (
                <div key={amount} className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-sm text-stone-500 mb-1">Panier de {amount} TND</p>
                  {preview.tier ? (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${preview.tier.color} text-white border-0`}>
                          {preview.tier.name}
                        </Badge>
                        <span className="text-sm text-stone-600">-{preview.tier.percent}%</span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-stone-900">{preview.final.toFixed(2)} TND</span>
                        <span className="text-sm text-emerald-600">(-{preview.discount.toFixed(2)})</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-stone-500 text-sm">Pas de remise applicable</p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-6 border-0 shadow-sm bg-blue-50 rounded-2xl">
          <div className="flex gap-4">
            <InfoIcon className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Comment fonctionne le systeme de remises?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>- Les remises sont appliquees automatiquement selon le montant du panier</li>
                <li>- Le client voit la reduction en temps reel pendant sa commande</li>
                <li>- Les paliers sont exclusifs: un seul palier s&apos;applique a la fois</li>
                <li>- Desactiver un palier le retire temporairement sans le supprimer</li>
              </ul>
            </div>
          </div>
        </Card>
      </main>

      {/* Add/Edit Tier Dialog */}
      <Dialog open={isAddingTier || !!editingTier} onOpenChange={() => { setIsAddingTier(false); setEditingTier(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? "Modifier le Palier" : "Nouveau Palier de Remise"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Nom du palier</label>
              <Input
                value={tierForm.name}
                onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                placeholder="Ex: Premium"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">Montant Min (TND)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={tierForm.minAmount}
                  onChange={(e) => setTierForm({ ...tierForm, minAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">Montant Max (TND)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={tierForm.maxAmount}
                  onChange={(e) => setTierForm({ ...tierForm, maxAmount: e.target.value })}
                  placeholder="99.99"
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Reduction (%)</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={tierForm.percent}
                onChange={(e) => setTierForm({ ...tierForm, percent: e.target.value })}
                placeholder="10"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-stone-700 mb-2 block">Couleur</label>
              <Select value={tierForm.color} onValueChange={(v) => setTierForm({ ...tierForm, color: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded ${opt.preview}`} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview */}
            <div className="p-4 bg-stone-50 rounded-xl">
              <p className="text-xs text-stone-500 mb-2">Apercu</p>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${tierForm.color || "bg-stone-300"} flex items-center justify-center`}>
                  <PercentIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-stone-900">{tierForm.name || "Nom du palier"}</p>
                  <p className="text-sm text-stone-500">
                    {tierForm.minAmount || "0"} - {tierForm.maxAmount || "0"} TND = -{tierForm.percent || "0"}%
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddingTier(false); setEditingTier(null) }}>
              Annuler
            </Button>
            <Button 
              onClick={handleSaveTier}
              disabled={!tierForm.name || !tierForm.minAmount || !tierForm.maxAmount || !tierForm.percent}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              {editingTier ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangleIcon className="h-5 w-5" />
              Reinitialiser les Remises?
            </DialogTitle>
          </DialogHeader>
          <p className="text-stone-600">
            Cette action va reinitialiser tous les paliers de remise aux valeurs par defaut. 
            Toutes vos modifications seront perdues.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Annuler
            </Button>
            <Button 
              onClick={() => { resetToDefaults(); setShowResetConfirm(false) }}
              className="bg-amber-500 hover:bg-amber-600"
            >
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Reinitialiser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function DiscountSettingsPage() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <DiscountProvider>
          <DiscountSettingsContent />
        </DiscountProvider>
      </AuthProvider>
    </NotificationProvider>
  )
}
