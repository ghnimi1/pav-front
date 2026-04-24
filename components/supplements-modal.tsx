"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlusIcon, MinusIcon, SparklesIcon, CheckIcon } from "lucide-react"
import { useStock, type Supplement } from "@/contexts/stock-context"
import type { BreakfastItem, SelectedSupplement, ProductSupplementConfig } from "@/contexts/breakfast-context"

interface SupplementsModalProps {
  isOpen: boolean
  onClose: () => void
  item: BreakfastItem | null
  onConfirm: (item: BreakfastItem, supplements: SelectedSupplement[]) => void
}

export function SupplementsModal({ isOpen, onClose, item, onConfirm }: SupplementsModalProps) {
  const { supplements: allSupplements } = useStock()
  const [selectedSupplements, setSelectedSupplements] = useState<Map<string, SelectedSupplement>>(new Map())
  console.log(allSupplements)
  // Reset selection when item changes
  useEffect(() => {
    setSelectedSupplements(new Map())
  }, [item?.id])

  if (!item) return null
console.log(item.availableSupplements)
  // Get available supplements for this item
  const getAvailableSupplements = (): Supplement[] => {
    if (!item.availableSupplements) return []
    
    return item.availableSupplements
      .filter(ps => ps.isEnabled)
      .map(ps => {
        const supplement = allSupplements.find(s => s.id === ps.supplementId && s.isActive)
        if (!supplement) return null
        // Apply custom price if set
        return ps.customPrice !== undefined 
          ? { ...supplement, price: ps.customPrice }
          : supplement
      })
      .filter((s): s is Supplement => s !== null)
  }

  const availableSupplements = getAvailableSupplements()
  
  const incrementSupplement = (supplement: Supplement) => {
    setSelectedSupplements(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(supplement.id)
      if (existing) {
        newMap.set(supplement.id, { ...existing, quantity: existing.quantity + 1 })
      } else {
        newMap.set(supplement.id, {
          supplementId: supplement.id,
          name: supplement.name,
          price: supplement.price,
          points: supplement.points || 0,
          quantity: 1
        })
      }
      return newMap
    })
  }

  const decrementSupplement = (supplementId: string) => {
    setSelectedSupplements(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(supplementId)
      if (existing && existing.quantity > 1) {
        newMap.set(supplementId, { ...existing, quantity: existing.quantity - 1 })
      } else {
        newMap.delete(supplementId)
      }
      return newMap
    })
  }

  const getSupplementQuantity = (supplementId: string): number => {
    return selectedSupplements.get(supplementId)?.quantity || 0
  }

  const calculateSupplementsTotal = (): number => {
    let total = 0
    selectedSupplements.forEach(s => {
      total += s.price * s.quantity
    })
    return total
  }

  const calculateTotal = (): number => {
    return item.price + calculateSupplementsTotal()
  }

  const calculateSupplementsPoints = (): number => {
    let total = 0
    selectedSupplements.forEach(s => {
      total += (s.points || 0) * s.quantity
    })
    return total
  }

  const calculateTotalPoints = (): number => {
    return (item.points || 0) + calculateSupplementsPoints()
  }

  const handleConfirm = () => {
    const supplementsList = Array.from(selectedSupplements.values())
    onConfirm(item, supplementsList)
    onClose()
  }

  const handleSkip = () => {
    onConfirm(item, [])
    onClose()
  }
  // Group supplements by category
  const groupedSupplements = availableSupplements.reduce((acc, sup) => {
    const category = sup.category || "autre"
    if (!acc[category]) acc[category] = []
    acc[category].push(sup)
    return acc
  }, {} as Record<string, Supplement[]>)

  const categoryLabels: Record<string, string> = {
    legumes: "Legumes",
    fromage: "Fromage",
    viande: "Viandes",
    poisson: "Poissons",
    herbes: "Herbes",
    lait: "Laits",
    topping: "Toppings",
    sirop: "Sirops",
    cafe: "Cafe",
    fruits: "Fruits",
    confiture: "Confitures",
    glace: "Glaces",
    autre: "Autres"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <SparklesIcon className="h-5 w-5 text-amber-500" />
            Personnaliser votre commande
          </DialogTitle>
        </DialogHeader>

        {/* Product Info */}
        <div className="flex gap-3 p-3 bg-stone-50 rounded-lg">
          {item.image && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-stone-900 truncate">{item.name}</h3>
            {item.description && (
              <p className="text-xs text-stone-500 line-clamp-2">{item.description}</p>
            )}
            <p className="text-amber-600 font-bold mt-1">{item.price.toFixed(2)} TND</p>
          </div>
        </div>

        {/* Supplements List */}
        <div className="flex-1 overflow-y-auto py-2">
          <p className="text-sm text-stone-600 mb-3">
            Ajoutez des supplements a votre {item.name}
          </p>

          {Object.entries(groupedSupplements).map(([category, sups]) => (
            <div key={category} className="mb-4">
              <h4 className="text-xs font-medium text-stone-400 uppercase tracking-wide mb-2">
                {categoryLabels[category] || category}
              </h4>
              <div className="space-y-2">
                {sups.map(supplement => {
                  const quantity = getSupplementQuantity(supplement.id)
                  const isSelected = quantity > 0

                  return (
                    <div
                      key={supplement.id}
                      className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                        isSelected 
                          ? "border-amber-400 bg-amber-50" 
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-stone-800">{supplement.name}</span>
                          {isSelected && (
                            <CheckIcon className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                        {supplement.description && (
                          <p className="text-xs text-stone-500 truncate">{supplement.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="text-sm font-semibold text-amber-600 whitespace-nowrap block">
                            +{supplement.price.toFixed(2)} TND
                          </span>
                          {supplement.points && supplement.points > 0 && (
                            <span className="text-[10px] text-emerald-600 font-medium">
                              +{supplement.points} pts
                            </span>
                          )}
                        </div>
                        
                        {quantity > 0 ? (
                          <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-0.5">
                            <button
                              onClick={() => decrementSupplement(supplement.id)}
                              className="h-7 w-7 flex items-center justify-center rounded-md bg-white shadow-sm hover:bg-stone-50"
                            >
                              <MinusIcon className="h-4 w-4" />
                            </button>
                            <span className="w-6 text-center font-bold text-sm">{quantity}</span>
                            <button
                              onClick={() => incrementSupplement(supplement)}
                              className="h-7 w-7 flex items-center justify-center rounded-md bg-amber-500 text-white hover:bg-amber-600"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => incrementSupplement(supplement)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-stone-100 hover:bg-amber-100 hover:text-amber-600 transition-colors"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer with totals */}
        <DialogFooter className="flex-col gap-3 pt-3 border-t">
          {/* Summary */}
          <div className="w-full space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-600">{item.name}</span>
              <div className="flex items-center gap-2">
                <span>{item.price.toFixed(2)} TND</span>
                {item.points && item.points > 0 && (
                  <span className="text-xs text-emerald-600">+{item.points} pts</span>
                )}
              </div>
            </div>
            {calculateSupplementsTotal() > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>Supplements ({selectedSupplements.size})</span>
                <div className="flex items-center gap-2">
                  <span>+{calculateSupplementsTotal().toFixed(2)} TND</span>
                  {calculateSupplementsPoints() > 0 && (
                    <span className="text-xs text-emerald-600">+{calculateSupplementsPoints()} pts</span>
                  )}
                </div>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-dashed">
              <span>Total</span>
              <div className="flex items-center gap-2">
                <span className="text-amber-600">{calculateTotal().toFixed(2)} TND</span>
                {calculateTotalPoints() > 0 && (
                  <span className="text-sm text-emerald-600 font-medium">+{calculateTotalPoints()} pts</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              Sans supplement
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              Confirmer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
