"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useNotification } from "@/contexts/notification-context"
import { useUnifiedSales } from "@/contexts/unified-sales-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ShoppingCartIcon, PlusIcon, MinusIcon, TrashIcon, CheckCircleIcon, UserPlusIcon, CoinsIcon } from "lucide-react"

interface CartDialogProps {
  open: boolean
  onClose: () => void
  cart: Array<{ item: any; quantity: number }>
  setCart: (cart: Array<{ item: any; quantity: number }>) => void
}

export function CartDialog({ open, onClose, cart, setCart }: CartDialogProps) {
  const { user, isAuthenticated, addLoyaltyPoints } = useAuth()
  const { addNotification } = useNotification()
  const { addSale } = useUnifiedSales()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)

  const total = cart.reduce((sum, { item, quantity }) => sum + (item.finalPrice || item.price) * quantity, 0)
  const totalPoints = cart.reduce((sum, { item, quantity }) => sum + ((item.points || 0) * quantity), 0)

  const updateQuantity = (itemKey: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(cart.filter((c, index) => {
        const key = `${c.item.id}-${(c.item.selectedSupplements || []).map((s: any) => s.id).join('-')}-${index}`
        return key !== itemKey
      }))
    } else {
      setCart(cart.map((c, index) => {
        const key = `${c.item.id}-${(c.item.selectedSupplements || []).map((s: any) => s.id).join('-')}-${index}`
        return key === itemKey ? { ...c, quantity: newQuantity } : c
      }))
    }
  }

  const handleCheckout = () => {
    if (cart.length === 0) return

    if (!isAuthenticated || !user) {
      addNotification("Veuillez vous connecter pour finaliser votre commande", "warning")
      // Store cart in localStorage so it persists after login
      localStorage.setItem("pendingCart", JSON.stringify(cart))
      router.push("/client/login")
      onClose()
      return
    }

    setIsProcessing(true)

    setTimeout(() => {
      // Calculate loyalty points (1 point per 10 TND)
      const pointsEarned = Math.floor(total / 10)

      // Add order to unified sales system
      addSale({
        type: "counter",
        source: "online",
        items: cart.map(({ item, quantity }, index) => ({
          id: `item-${Date.now()}-${index}`,
          productId: item.id,
          productType: "menu" as const,
          name: item.name,
          quantity,
          unitPrice: item.finalPrice || item.price,
          total: (item.finalPrice || item.price) * quantity,
          categoryId: item.categoryId,
        })),
        subtotal: total,
        discount: 0,
        discountType: "fixed",
        deliveryFee: 0,
        total: total,
        paymentMethod: "pending",
        paymentStatus: "pending",
        status: "pending",
        clientId: user?.id,
        clientEmail: user?.email,
        clientName: user?.name,
        pointsEarned: totalPoints,
        pointsUsed: 0,
      })

      // Add points to user account
      addLoyaltyPoints(pointsEarned, total)

      // Clear cart
      setCart([])
      localStorage.removeItem("pendingCart")

      addNotification(`Commande confirmée! Vous avez gagné ${pointsEarned} points de fidélité`, "success")

      setIsProcessing(false)
      onClose()
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <ShoppingCartIcon className="h-6 w-6 text-amber-600" />
            Votre Panier
          </DialogTitle>
        </DialogHeader>

        {cart.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-300" />
            <p className="mt-4 text-gray-600">Votre panier est vide</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            {cart.map(({ item, quantity }, index) => {
              const itemKey = `${item.id}-${(item.selectedSupplements || []).map((s: any) => s.id).join('-')}-${index}`
              const itemPrice = item.finalPrice || item.price
              return (
                <Card key={itemKey} className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.image || "/placeholder.svg?height=80&width=80&query=food"}
                      alt={item.name}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">{item.price.toFixed(2)} TND</p>
                          {item.points !== undefined && item.points > 0 && (
                            <span className="text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                              <CoinsIcon className="h-3 w-3" />
                              +{item.points} pts
                            </span>
                          )}
                        </div>
                        {/* Display selected supplements */}
                        {item.selectedSupplements && item.selectedSupplements.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.selectedSupplements.map((supp: any) => (
                              <span key={supp.id} className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                                + {supp.name} ({supp.price.toFixed(2)} TND)
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => updateQuantity(itemKey, quantity - 1)}
                          >
                            <MinusIcon className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 bg-transparent"
                            onClick={() => updateQuantity(itemKey, quantity + 1)}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-600">{(itemPrice * quantity).toFixed(2)} TND</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={() => updateQuantity(itemKey, 0)}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}

            {/* Summary */}
            <Card className="bg-amber-50 p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Sous-total</span>
                  <span>{total.toFixed(2)} TND</span>
                </div>
                {totalPoints > 0 && (
                  <div className="flex items-center justify-between text-sm text-emerald-600">
                    <span className="flex items-center gap-1.5">
                      <CoinsIcon className="h-4 w-4" />
                      Points a gagner
                    </span>
                    <span className="font-bold">+{totalPoints} pts</span>
                  </div>
                )}
                <div className="border-t border-amber-200 pt-2">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-amber-600">{total.toFixed(2)} TND</span>
                  </div>
                </div>
              </div>
            </Card>

            {!isAuthenticated || !user ? (
              <div className="space-y-3">
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <UserPlusIcon className="mx-auto h-8 w-8 text-blue-600" />
                  <p className="mt-2 text-sm font-medium text-blue-900">Connectez-vous pour finaliser votre commande</p>
                  <p className="mt-1 text-xs text-blue-700">et gagner des points de fidélité</p>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-lg hover:from-amber-700 hover:to-amber-800"
                  size="lg"
                  onClick={handleCheckout}
                >
                  <UserPlusIcon className="mr-2 h-5 w-5" />
                  Se connecter / S'inscrire
                </Button>
              </div>
            ) : (
              <Button
                className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-lg hover:from-amber-700 hover:to-amber-800"
                size="lg"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="mr-2 h-5 w-5" />
                    Confirmer la commande
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
