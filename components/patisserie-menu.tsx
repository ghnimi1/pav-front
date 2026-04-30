"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useStock, type MenuItem, type Offer, type MenuCategory } from "@/contexts/stock-context"
import { SupplementsModal } from "@/components/supplements-modal-menu"
import { useUnifiedSales } from "@/contexts/unified-sales-context"
import { useLoyalty } from "@/contexts/loyalty-context"
import { useAuth } from "@/contexts/auth-context"
import { useDiscount } from "@/contexts/discount-context"
import { useOrders, type OrderItem } from "@/contexts/orders-context"
import { useNotification } from "@/contexts/notification-context"
import { useLoyaltyCards } from "@/contexts/loyalty-cards-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  PlusIcon,
  MinusIcon,
  SparklesIcon,
  CoffeeIcon,
  CroissantIcon,
  CakeIcon,
  StarIcon,
  ShoppingCartIcon,
  XIcon,
  SendIcon,
  CoinsIcon,
  ClockIcon,
  SearchIcon,
  Trash2Icon,
  PercentIcon,
  GiftIcon,
  TrendingDownIcon,
  TagIcon,
  TimerIcon,
  CheckCircle2Icon,
  PackageIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  SkipForwardIcon,
  CheckIcon,
} from "lucide-react"

// Icon mapping for categories
const categoryIcons: Record<string, React.ReactNode> = {
  "star": <StarIcon className="h-5 w-5" />,
  "coffee": <CoffeeIcon className="h-5 w-5" />,
  "croissant": <CroissantIcon className="h-5 w-5" />,
  "cake": <CakeIcon className="h-5 w-5" />,
  "gift": <GiftIcon className="h-5 w-5" />,
}

// Cart item with supplements
interface CartItem {
  item: MenuItem
  quantity: number
  supplements: { supplementId: string; name: string; price: number; points?: number; quantity: number }[]
}

// Offer cart item
interface OfferCartItem {
  offer: Offer
  quantity: number
}

export function PatisserieMenu({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth()
  const { addNotification } = useNotification()
  const { getClientByEmail } = useLoyalty()
  const { addStampsFromItems } = useLoyaltyCards()
  const { addSale } = useUnifiedSales()
  const { createOrderFromItems, deliveryConfig } = useOrders()
  const {
    menuItems,
    menuCategories,
    supplements,
    getSupplementsForProduct,
    getCurrentOffers,
    getActiveOffers,
  } = useStock()

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [offerCart, setOfferCart] = useState<OfferCartItem[]>([])

  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [categoryStepIndex, setCategoryStepIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCartSummary, setShowCartSummary] = useState(false)
  const [showOrderSuccess, setShowOrderSuccess] = useState(false)
  const [lastClientOrder, setLastClientOrder] = useState<{ orderNumber: string; estimatedTime: number } | null>(null)
  const [showRecap, setShowRecap] = useState(false)
  const [customerNote, setCustomerNote] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [supplementsModalOpen, setSupplementsModalOpen] = useState(false)
  const [selectedItemForSupplements, setSelectedItemForSupplements] = useState<MenuItem | null>(null)

  // Get client loyalty data
  const loyaltyClient = user?.role === "client" && user?.email ? getClientByEmail(user.email) : null
  const clientPoints = loyaltyClient?.loyaltyPoints ?? 0
  const canCreateRemoteClientOrder = !!user?.id && !!user?.email && user.role !== "admin"

  // Use discount context
  const discountContext = useDiscount()

  // Current offers (based on day/time)
  const currentOffers = useMemo(() => getCurrentOffers(), [getCurrentOffers])

  // Active categories
  const activeCategories = useMemo(() => {
    return menuCategories.filter(cat => cat.isActive).sort((a, b) => a.order - b.order)
  }, [menuCategories])

  // Navigation steps: Offers (if any) + All categories
  const navigationSteps = useMemo(() => {
    const steps: { id: string; name: string; type: "offers" | "category" }[] = []

    if (currentOffers.length > 0) {
      steps.push({ id: "all", name: "Offres", type: "offers" })
    }

    activeCategories.forEach(cat => {
      steps.push({ id: cat.id, name: cat.name, type: "category" })
    })

    return steps
  }, [currentOffers, activeCategories])

  const isLastStep = categoryStepIndex >= navigationSteps.length - 1

  // Sync categoryStepIndex with selectedCategory when clicking tabs
  useEffect(() => {
    const currentStepIndex = navigationSteps.findIndex(step => step.id === selectedCategory)
    if (currentStepIndex !== -1 && currentStepIndex !== categoryStepIndex) {
      setCategoryStepIndex(currentStepIndex)
    }
  }, [selectedCategory, navigationSteps, categoryStepIndex])

  // Navigation functions
  const goToNextStep = () => {
    if (isLastStep) {
      setShowRecap(true)
    } else {
      const nextIndex = categoryStepIndex + 1
      setCategoryStepIndex(nextIndex)
      const nextStep = navigationSteps[nextIndex]
      setSelectedCategory(nextStep.id)
    }
  }

  const skipCurrentStep = () => {
    goToNextStep()
  }

  // Filtered products
  const filteredProducts = useMemo(() => {
    let products = menuItems.filter(item => item.isAvailable)

    if (selectedCategory !== "all") {
      products = products.filter(item => item.category === selectedCategory)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      products = products.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
    }

    return products
  }, [menuItems, selectedCategory, searchQuery])

  // Cart calculations
  const cartItemsCount = useMemo(() => {
    const productCount = cart.reduce((sum, item) => sum + item.quantity, 0)
    const offerCount = offerCart.reduce((sum, item) => sum + item.quantity, 0)
    return productCount + offerCount
  }, [cart, offerCart])

  const cartTotal = useMemo(() => {
    const productTotal = cart.reduce((sum, item) => {
      const supps = Array.isArray(item.supplements) ? item.supplements : []
      const supplementsTotal = supps.reduce((s, sup) => s + sup.price * sup.quantity, 0)
      return sum + (item.item.price + supplementsTotal) * item.quantity
    }, 0)
    const offerTotal = offerCart.reduce((sum, item) => sum + item.offer.discountedPrice * item.quantity, 0)
    return productTotal + offerTotal
  }, [cart, offerCart])

  const cartTotalPoints = useMemo(() => {
    const productPoints = cart.reduce((sum, item) => {
      const supps = Array.isArray(item.supplements) ? item.supplements : []
      const supplementsPoints = supps.reduce((s, sup) => s + (sup.points || 0) * sup.quantity, 0)
      return sum + ((item.item.points || 0) + supplementsPoints) * item.quantity
    }, 0)
    const offerPoints = offerCart.reduce((sum, item) => sum + item.offer.points * item.quantity, 0)
    return productPoints + offerPoints
  }, [cart, offerCart])

  // Smart discount calculation
  const calculateSmartDiscount = useMemo(() => {
    return discountContext.calculateDiscount(cartTotal, cartItemsCount)
  }, [cartTotal, cartItemsCount, discountContext])

  const finalTotal = useMemo(() => {
    return Math.round((cartTotal - calculateSmartDiscount.discountAmount) * 100) / 100
  }, [cartTotal, calculateSmartDiscount.discountAmount])

  // ============================================
  // CART FUNCTIONS
  // ============================================

  const addToCart = (item: MenuItem, supplements: { supplementId: string; name: string; price: number; points?: number; quantity: number }[] = []) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(
        cartItem =>
          cartItem.item.id === item.id &&
          JSON.stringify(cartItem.supplements) === JSON.stringify(supplements)
      )

      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 }
        return updated
      }

      return [...prev, { item, quantity: 1, supplements }]
    })
  }

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  const updateCartQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const updated = prev.map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + delta } : item
      )
      return updated.filter(item => item.quantity > 0)
    })
  }

  const addOfferToCart = (offer: Offer) => {
    setOfferCart(prev => {
      const existingIndex = prev.findIndex(item => item.offer.id === offer.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 }
        return updated
      }
      return [...prev, { offer, quantity: 1 }]
    })
  }

  const removeOfferFromCart = (index: number) => {
    setOfferCart(prev => prev.filter((_, i) => i !== index))
  }

  const updateOfferQuantity = (index: number, delta: number) => {
    setOfferCart(prev => {
      const updated = prev.map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + delta } : item
      )
      return updated.filter(item => item.quantity > 0)
    })
  }

  const clearCart = () => {
    setCart([])
    setOfferCart([])
  }

  // Handle add item (check for supplements)
  const handleAddItem = (item: MenuItem) => {
    if (item.availableSupplements && item.availableSupplements.length > 0) {
      setSelectedItemForSupplements(item)
      setSupplementsModalOpen(true)
    } else {
      addToCart(item, [])
    }
  }

  // FIX: Increment item in grid (no supplements) — finds existing entry and increments it
  const handleIncrementItem = (item: MenuItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.item.id === item.id && c.supplements.length === 0)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 }
        return updated
      }
      // Fallback: create new entry without supplements
      return [...prev, { item, quantity: 1, supplements: [] }]
    })
  }

  // FIX: Decrement item in grid (no supplements) — finds existing entry and decrements it
  const handleDecrementItem = (item: MenuItem) => {
    setCart(prev => {
      const idx = prev.findIndex(c => c.item.id === item.id && c.supplements.length === 0)
      if (idx < 0) return prev
      const updated = prev.map((c, i) =>
        i === idx ? { ...c, quantity: c.quantity - 1 } : c
      )
      return updated.filter(c => c.quantity > 0)
    })
  }

  const handleAddItemWithSupplements = (item: MenuItem, supplements: { supplementId: string; name: string; price: number; points?: number; quantity: number }[]) => {
    addToCart(item, supplements)
  }

  // Handle order submission
  const handleSubmitOrder = async () => {
    if (cartItemsCount === 0) return

    if (cartTotal < deliveryConfig.minOrderAmount) {
      addNotification({
        type: "error",
        title: "Commande non envoyee",
        message: `Le minimum de commande est ${deliveryConfig.minOrderAmount.toFixed(2)} TND.`,
      })
      return
    }

    const remoteOrderItems: OrderItem[] = [
      ...offerCart.map((offerItem) => ({
        id: `offer-${offerItem.offer.id}`,
        productId: offerItem.offer.id,
        name: offerItem.offer.name,
        price: offerItem.offer.discountedPrice,
        quantity: offerItem.quantity,
        image: offerItem.offer.image,
        points: offerItem.offer.points,
      })),
      ...cart.map((cartItem) => ({
        id: `${cartItem.item.id}-${cartItem.supplements.map((s) => `${s.supplementId}:${s.quantity}`).join(",")}`,
        productId: cartItem.item.id,
        name: cartItem.item.name,
        price: cartItem.item.price,
        quantity: cartItem.quantity,
        image: cartItem.item.image,
        points: cartItem.item.points || Math.floor(cartItem.item.price),
        supplements: cartItem.supplements.flatMap((supplement) =>
          Array.from({ length: supplement.quantity }, () => ({
            name: supplement.name,
            price: supplement.price,
          }))
        ),
      })),
    ]

    if (canCreateRemoteClientOrder) {
      const clientOrder = await createOrderFromItems(
        remoteOrderItems,
        "pickup",
        "cash_on_pickup",
        {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        undefined,
        undefined,
        [customerNote, tableNumber ? `Table: ${tableNumber}` : ""].filter(Boolean).join(" | "),
        {
          amount: calculateSmartDiscount.discountAmount,
          percent: calculateSmartDiscount.discountPercent,
          description: calculateSmartDiscount.tier ? `Reduction ${calculateSmartDiscount.tier.name}` : undefined,
        }
      )

      if (clientOrder) {
        setLastClientOrder({
          orderNumber: clientOrder.orderNumber,
          estimatedTime: clientOrder.estimatedTime,
        })
        setShowCartSummary(false)
        setShowOrderSuccess(true)
        clearCart()
        setCustomerNote("")
        setTableNumber("")
        return
      }

      addNotification({
        type: "error",
        title: "Commande non envoyee",
        message: "La requete n'a pas ete envoyee ou a echoue avant validation.",
      })
      return
    }

    const orderItems = [
      ...offerCart.flatMap(offerItem =>
        Array(offerItem.quantity).fill(null).map((_, i) => ({
          id: `offer-${Date.now()}-${offerItem.offer.id}-${i}`,
          productId: offerItem.offer.id,
          productType: "patisserie" as const,
          name: offerItem.offer.name,
          quantity: 1,
          unitPrice: offerItem.offer.discountedPrice,
          total: offerItem.offer.discountedPrice,
          categoryId: "offres",
        }))
      ),
      ...cart.map(cartItem => ({
        id: `item-${Date.now()}-${cartItem.item.id}`,
        productId: cartItem.item.id,
        productType: "patisserie" as const,
        name: cartItem.item.name + (cartItem.supplements.length > 0 ? ` (+${cartItem.supplements.map(s => s.name).join(", ")})` : ""),
        quantity: cartItem.quantity,
        unitPrice: cartItem.item.price + cartItem.supplements.reduce((sum, s) => sum + s.price * s.quantity, 0),
        total: (cartItem.item.price + cartItem.supplements.reduce((sum, s) => sum + s.price * s.quantity, 0)) * cartItem.quantity,
        categoryId: cartItem.item.category,
      })),
    ]

    const discountAmount = calculateSmartDiscount.discountAmount
    const finalPriceAfterDiscount = cartTotal - discountAmount

    const newSale = addSale({
      type: "patisserie",
      source: "online",
      items: orderItems,
      subtotal: cartTotal,
      discount: discountAmount,
      discountType: discountAmount > 0 ? "percentage" : "fixed",
      total: finalPriceAfterDiscount,
      pointsEarned: cartTotalPoints,
      paymentMethod: "pending",
      tableNumber: tableNumber || undefined,
      notes: customerNote || undefined,
    })

    if (loyaltyClient) {
      void addStampsFromItems(
        loyaltyClient.id,
        newSale.id,
        cart.flatMap((cartItem) =>
          Array.from({ length: cartItem.quantity }, () => ({
            productId: cartItem.item.id,
            productName: cartItem.item.name,
            quantity: 1,
          }))
        )
      ).catch((error) => {
        console.error("Failed to add loyalty card stamps:", error)
      })
    }

    setLastClientOrder(null)
    setShowCartSummary(false)
    setShowOrderSuccess(true)

    clearCart()
    setCustomerNote("")
    setTableNumber("")
  }

  // Get item quantity in cart (total across all supplement variants)
  const getItemQuantityInCart = (itemId: string) => {
    return cart.filter(c => c.item.id === itemId).reduce((sum, c) => sum + c.quantity, 0)
  }

  // Get item quantity without supplements (for grid +/- controls)
  const getItemQuantityNoSupplements = (itemId: string) => {
    return cart
      .filter(c => c.item.id === itemId && c.supplements.length === 0)
      .reduce((sum, c) => sum + c.quantity, 0)
  }

  const getOfferQuantityInCart = (offerId: string) => {
    return offerCart.find(c => c.offer.id === offerId)?.quantity || 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <CakeIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-stone-900">Le Pave d&apos;Art</h1>
                <p className="text-xs text-stone-500">Patisserie Artisanale</p>
              </div>
            </div>

            {/* Cart Button */}
            <Button
              onClick={() => setShowCartSummary(true)}
              className="relative bg-amber-500 hover:bg-amber-600 text-white"
            >
              <ShoppingCartIcon className="h-5 w-5 mr-2" />
              <span>{cartItemsCount}</span>
              {cartItemsCount > 0 && (
                <span className="ml-2 font-semibold">{finalTotal.toFixed(2)} TND</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Categories Header */}
      <div className="sticky top-[72px] z-30 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un produit..."
              className="pl-10 bg-stone-50 border-stone-200"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 -mx-4 px-4">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "shrink-0",
                selectedCategory === "all" && "bg-stone-900 text-white"
              )}
            >
              Tout voir
            </Button>
            {activeCategories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "shrink-0",
                  selectedCategory === cat.id && "bg-stone-900 text-white"
                )}
              >
                {cat.icon} {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Offers Section */}
      {currentOffers.length > 0 && selectedCategory === "all" && !searchQuery && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex items-center justify-center">
              <SparklesIcon className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-stone-900">Offres du Moment</h2>
            <Badge variant="secondary" className="bg-rose-100 text-rose-700">
              <TimerIcon className="h-3 w-3 mr-1" />
              Disponible maintenant
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentOffers.map(offer => {
              const savings = offer.originalPrice - offer.discountedPrice
              const savingsPercent = Math.round((savings / offer.originalPrice) * 100)
              const inCart = getOfferQuantityInCart(offer.id)

              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative"
                >
                  <Card className="overflow-hidden border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-white">
                    {/* Savings Badge */}
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-rose-500 text-white">
                        -{savingsPercent}%
                      </Badge>
                    </div>

                    {/* Image */}
                    <div className="h-32 bg-gradient-to-br from-rose-100 to-amber-100 flex items-center justify-center">
                      {offer.image ? (
                        <Image src={offer.image} alt={offer.name} fill className="object-cover" />
                      ) : (
                        <GiftIcon className="h-12 w-12 text-rose-300" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-stone-900">{offer.name}</h3>
                      <p className="text-sm text-stone-500 line-clamp-2 mt-1">{offer.description}</p>

                      {/* Schedule */}
                      <div className="flex items-center gap-1 mt-2 text-xs text-rose-600">
                        <ClockIcon className="h-3 w-3" />
                        <span>{offer.schedule.startTime} - {offer.schedule.endTime}</span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <span className="text-lg font-bold text-rose-600">{offer.discountedPrice.toFixed(2)} TND</span>
                          <span className="text-sm text-stone-400 line-through ml-2">{offer.originalPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 text-sm">
                          <CoinsIcon className="h-4 w-4" />
                          <span>+{offer.points} pts</span>
                        </div>
                      </div>

                      {/* Add Button */}
                      <div className="mt-3">
                        {inCart > 0 ? (
                          <div className="flex items-center justify-between bg-rose-100 rounded-lg p-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                // FIX: find exact index in offerCart
                                const idx = offerCart.findIndex(c => c.offer.id === offer.id)
                                if (idx >= 0) updateOfferQuantity(idx, -1)
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <MinusIcon className="h-4 w-4" />
                            </Button>
                            <span className="font-bold text-rose-600">{inCart}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => addOfferToCart(offer)}
                              className="h-8 w-8 p-0"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => addOfferToCart(offer)}
                            className="w-full bg-rose-500 hover:bg-rose-600 text-white"
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Ajouter
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900">
            {selectedCategory === "all"
              ? "Tous nos produits"
              : activeCategories.find(c => c.id === selectedCategory)?.name || "Produits"}
          </h2>
          <span className="text-sm text-stone-500">{filteredProducts.length} produits</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <SearchIcon className="h-12 w-12 text-stone-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-stone-700">Aucun produit trouve</h3>
            <p className="text-stone-500">Essayez de modifier votre recherche ou vos filtres</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(item => {
              const inCartTotal = getItemQuantityInCart(item.id)
              const inCartNoSupp = getItemQuantityNoSupplements(item.id)
              const hasSupplements = item.availableSupplements && item.availableSupplements.length > 0

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  className="relative"
                >
                  <Card className="overflow-hidden h-full flex flex-col">
                    {/* Points Badge */}
                    {item.points && item.points > 0 && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-emerald-500 text-white text-xs">
                          +{item.points} pts
                        </Badge>
                      </div>
                    )}

                    {/* Quantity in cart */}
                    {inCartTotal > 0 && (
                      <div className="absolute top-2 right-2 z-10">
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                          {inCartTotal}
                        </div>
                      </div>
                    )}

                    {/* Image */}
                    <div className="h-28 bg-stone-100 relative">
                      {item.image ? (
                        <Image src={`${process.env.NEXT_PUBLIC_API_IMAGE_URL}/menu/${item.image}`} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center">
                          <CakeIcon className="h-10 w-10 text-stone-300" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-3 flex-1 flex flex-col">
                      <h3 className="font-medium text-stone-900 text-sm line-clamp-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-stone-500 line-clamp-2 mt-1">{item.description}</p>
                      )}

                      {/* Supplements indicator */}
                      {hasSupplements && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                          <TagIcon className="h-3 w-3" />
                          <span>Supplements disponibles</span>
                        </div>
                      )}

                      <div className="mt-auto pt-2">
                        {/* Price */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-amber-600">{item.price.toFixed(2)} TND</span>
                        </div>

                        {/* Add Button */}
                        {/*
                          FIX: For items WITHOUT supplements, show inline +/- controls.
                          For items WITH supplements, always show "Ajouter" to open the modal
                          (since each tap may have different supplement selections).
                          The badge above still shows total count across all variants.
                        */}
                        {inCartNoSupp > 0 && !hasSupplements ? (
                          <div className="flex items-center justify-between bg-amber-100 rounded-lg p-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDecrementItem(item)}
                              className="h-7 w-7 p-0"
                            >
                              <MinusIcon className="h-4 w-4" />
                            </Button>
                            <span className="font-bold">{inCartNoSupp}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleIncrementItem(item)}
                              className="h-7 w-7 p-0"
                            >
                              <PlusIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAddItem(item)}
                            size="sm"
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                          >
                            <PlusIcon className="h-4 w-4 mr-1" />
                            Ajouter
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart Summary Dialog */}
      <Dialog open={showCartSummary} onOpenChange={setShowCartSummary}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCartIcon className="h-5 w-5 text-amber-500" />
              Votre Panier
            </DialogTitle>
          </DialogHeader>

          {cartItemsCount === 0 ? (
            <div className="text-center py-8">
              <ShoppingCartIcon className="h-12 w-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-500">Votre panier est vide</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Offers in cart */}
              {offerCart.map((item, idx) => (
                <div key={`offer-${idx}`} className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg border border-rose-200">
                  <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                    <GiftIcon className="h-6 w-6 text-rose-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-stone-900 text-sm">{item.offer.name}</h4>
                    <p className="text-xs text-rose-600">Offre speciale</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateOfferQuantity(idx, -1)}
                      className="h-7 w-7 p-0"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </Button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateOfferQuantity(idx, 1)}
                      className="h-7 w-7 p-0"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-rose-600">{(item.offer.discountedPrice * item.quantity).toFixed(2)} TND</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOfferFromCart(idx)}
                    className="h-7 w-7 p-0 text-red-500"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Products in cart */}
              {cart.map((item, idx) => (
                <div key={`item-${idx}`} className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg">
                  <div className="w-12 h-12 rounded-lg bg-stone-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.item.image ? (
                      <Image src={item.item.image} alt={item.item.name} width={48} height={48} className="object-cover" />
                    ) : (
                      <CakeIcon className="h-6 w-6 text-stone-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-stone-900 text-sm">{item.item.name}</h4>
                    {Array.isArray(item.supplements) && item.supplements.length > 0 && (
                      <p className="text-xs text-amber-600">+ {item.supplements.map(s => s.name).join(", ")}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* FIX: use updateCartQuantity with exact idx from cart.map — correct */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateCartQuantity(idx, -1)}
                      className="h-7 w-7 p-0"
                    >
                      <MinusIcon className="h-4 w-4" />
                    </Button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateCartQuantity(idx, 1)}
                      className="h-7 w-7 p-0"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-amber-600">
                      {((item.item.price + (Array.isArray(item.supplements) ? item.supplements : []).reduce((s, sup) => s + sup.price * sup.quantity, 0)) * item.quantity).toFixed(2)} TND
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(idx)}
                    className="h-7 w-7 p-0 text-red-500"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Order notes */}
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-stone-700">Numero de table (optionnel)</label>
                  <Input
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex: 5"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-stone-700">Note pour la commande</label>
                  <Textarea
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="Instructions speciales..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-600">Sous-total</span>
                  <span>{cartTotal.toFixed(2)} TND</span>
                </div>

                {calculateSmartDiscount.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <TrendingDownIcon className="h-4 w-4" />
                      Remise ({calculateSmartDiscount.discountPercent}%)
                    </span>
                    <span>-{calculateSmartDiscount.discountAmount.toFixed(2)} TND</span>
                  </div>
                )}

                {calculateSmartDiscount.nextTier && cartTotal > 0 && (
                  <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg border border-emerald-200">
                    <GiftIcon className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      Ajoutez <strong className="text-emerald-800">{calculateSmartDiscount.nextTier.amountNeeded} TND</strong> pour debloquer la remise {calculateSmartDiscount.nextTier.name} de <strong className="text-emerald-800">-{calculateSmartDiscount.nextTier.discount}%</strong>
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-amber-600">{finalTotal.toFixed(2)} TND</span>
                </div>

                <div className="flex justify-between text-sm text-emerald-600">
                  <span className="flex items-center gap-1">
                    <CoinsIcon className="h-4 w-4" />
                    Points a gagner
                  </span>
                  <span>+{cartTotalPoints} pts</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCartSummary(false)}>
              Continuer
            </Button>
            {cartItemsCount > 0 && (
              <>
                <Button variant="ghost" onClick={clearCart} className="text-red-500">
                  Vider
                </Button>
                <Button onClick={() => void handleSubmitOrder()} className="bg-amber-500 hover:bg-amber-600 text-white">
                  <SendIcon className="h-4 w-4 mr-2" />
                  Commander
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Success Dialog */}
      <Dialog open={showOrderSuccess} onOpenChange={setShowOrderSuccess}>
        <DialogContent className="max-w-sm text-center">
          <div className="py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2Icon className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">Commande envoyee!</h2>
            <p className="text-stone-600">
              {lastClientOrder
                ? `Votre commande ${lastClientOrder.orderNumber} a ete enregistree.`
                : "Votre commande a ete transmise avec succes."}
            </p>
            {lastClientOrder && (
              <p className="text-sm text-amber-600 mt-2">Retrait estime: ~{lastClientOrder.estimatedTime} min</p>
            )}
            {cartTotalPoints > 0 && (
              <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-emerald-600">
                  <CoinsIcon className="h-5 w-5" />
                  <span className="font-medium">+{cartTotalPoints} points fidelite gagnes!</span>
                </div>
              </div>
            )}
          </div>
          <Button onClick={() => setShowOrderSuccess(false)} className="w-full bg-amber-500 hover:bg-amber-600">
            Continuer
          </Button>
        </DialogContent>
      </Dialog>

      {/* Supplements Modal */}
      {selectedItemForSupplements && (
        <SupplementsModal
          isOpen={supplementsModalOpen}
          onClose={() => {
            setSupplementsModalOpen(false)
            setSelectedItemForSupplements(null)
          }}
          item={selectedItemForSupplements}
          onConfirm={(_, supplements) => {
            handleAddItemWithSupplements(selectedItemForSupplements, supplements)
            setSupplementsModalOpen(false)
            setSelectedItemForSupplements(null)
          }}
        />
      )}

      {/* Recap Screen - Full page overlay */}
      <AnimatePresence>
        {showRecap && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-gradient-to-b from-amber-50 to-white overflow-auto"
          >
            {/* Recap Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-stone-100 px-4 py-4">
              <div className="max-w-2xl mx-auto flex items-center gap-4">
                <button
                  onClick={() => setShowRecap(false)}
                  className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Retour</span>
                </button>
                <h1 className="flex-1 text-center text-lg font-bold text-stone-900">Recapitulatif</h1>
                <div className="w-20" />
              </div>
            </div>

            {/* Recap Content */}
            <div className="max-w-2xl mx-auto px-4 py-6 pb-48">
              {/* Offers Section */}
              {offerCart.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <TagIcon className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="font-semibold text-stone-800 uppercase text-xs tracking-wider">Offres selectionnees</h2>
                  </div>
                  <div className="space-y-3">
                    {offerCart.map((offerItem, idx) => (
                      <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                          <GiftIcon className="h-7 w-7 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-stone-900">{offerItem.offer.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-amber-600 font-bold">{offerItem.offer.discountedPrice.toFixed(2)} TND</span>
                            {offerItem.offer.originalPrice > offerItem.offer.discountedPrice && (
                              <span className="text-stone-400 line-through text-sm">{offerItem.offer.originalPrice.toFixed(2)}</span>
                            )}
                            <span className="text-emerald-600 text-xs font-medium">+{offerItem.offer.points} pts</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-stone-100 rounded-xl p-1">
                          <button
                            onClick={() => updateOfferQuantity(idx, -1)}
                            className="h-8 w-8 rounded-lg bg-white flex items-center justify-center hover:bg-stone-50"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="w-6 text-center font-bold text-stone-900">{offerItem.quantity}</span>
                          <button
                            onClick={() => updateOfferQuantity(idx, 1)}
                            className="h-8 w-8 rounded-lg bg-white flex items-center justify-center hover:bg-stone-50"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Products Section */}
              {cart.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-stone-800 flex items-center justify-center">
                      <PackageIcon className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="font-semibold text-stone-800 uppercase text-xs tracking-wider">Produits ajoutes</h2>
                  </div>
                  <div className="space-y-3">
                    {cart.map((cartItem, idx) => {
                      const itemSupplements = Array.isArray(cartItem.supplements) ? cartItem.supplements : []
                      const supplementsTotal = itemSupplements.reduce((s, sup) => s + sup.price * sup.quantity, 0)
                      const itemTotal = (cartItem.item.price + supplementsTotal) * cartItem.quantity
                      const itemPoints = ((cartItem.item.points || 0) + itemSupplements.reduce((s, sup) => s + (sup.points || 0) * sup.quantity, 0)) * cartItem.quantity

                      return (
                        <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-4">
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl overflow-hidden bg-stone-100 relative shrink-0">
                              {cartItem.item.image ? (
                                <Image
                                  src={cartItem.item.image}
                                  alt={cartItem.item.name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <CakeIcon className="h-7 w-7 text-stone-400" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-stone-900">{cartItem.item.name}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-amber-600 font-bold">{itemTotal.toFixed(2)} TND</span>
                                {itemPoints > 0 && (
                                  <span className="text-emerald-600 text-xs font-medium">+{itemPoints} pts</span>
                                )}
                              </div>
                            </div>

                            {/* FIX: updateCartQuantity(idx, ...) is correct here since idx comes from cart.map */}
                            <div className="flex items-center gap-2 bg-stone-100 rounded-xl p-1">
                              <button
                                onClick={() => updateCartQuantity(idx, -1)}
                                className="h-8 w-8 rounded-lg bg-white flex items-center justify-center hover:bg-stone-50"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>
                              <span className="w-6 text-center font-bold text-stone-900">{cartItem.quantity}</span>
                              <button
                                onClick={() => updateCartQuantity(idx, 1)}
                                className="h-8 w-8 rounded-lg bg-white flex items-center justify-center hover:bg-stone-50"
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Supplements */}
                          {itemSupplements.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-stone-100">
                              <p className="text-xs text-stone-500 mb-2">Supplements:</p>
                              <div className="flex flex-wrap gap-2">
                                {itemSupplements.map((sup, supIdx) => (
                                  <span key={supIdx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-xs">
                                    {sup.name} <span className="font-medium">+{sup.price.toFixed(2)}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Table Number & Notes */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Numero de table (optionnel)
                  </label>
                  <Input
                    placeholder="Ex: Table 5"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="rounded-xl border-stone-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    Note pour la cuisine (optionnel)
                  </label>
                  <Textarea
                    placeholder="Allergies, preferences..."
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    className="rounded-xl border-stone-200 resize-none"
                    rows={3}
                  />
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 rounded-3xl p-5 text-white shadow-xl">
                {/* Line items */}
                <div className="space-y-2 mb-4">
                  {offerCart.length > 0 && (
                    <div className="flex justify-between text-white/90">
                      <span>Offres</span>
                      <span className="font-medium">{offerCart.reduce((sum, item) => sum + item.offer.discountedPrice * item.quantity, 0).toFixed(2)} TND</span>
                    </div>
                  )}
                  {cart.length > 0 && (
                    <div className="flex justify-between text-white/90">
                      <span>Produits</span>
                      <span className="font-medium">
                        {cart.reduce((sum, item) => {
                          const sups = Array.isArray(item.supplements) ? item.supplements : []
                          return sum + (item.item.price + sups.reduce((s, sup) => s + sup.price * sup.quantity, 0)) * item.quantity
                        }, 0).toFixed(2)} TND
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-white/90 pt-2 border-t border-white/20">
                    <span>Sous-total</span>
                    <span className="font-medium">{cartTotal.toFixed(2)} TND</span>
                  </div>
                </div>

                {/* Discount applied */}
                {calculateSmartDiscount.discountAmount > 0 && calculateSmartDiscount.tier && (
                  <div className="flex items-center justify-between bg-white/20 rounded-xl px-3 py-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-white/30 flex items-center justify-center">
                        <PercentIcon className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="text-sm">
                        Reduction {calculateSmartDiscount.tier.name}
                        <span className="text-white/70 ml-1">(-{calculateSmartDiscount.discountPercent}% applique)</span>
                      </span>
                    </div>
                    <span className="font-bold text-emerald-200">-{calculateSmartDiscount.discountAmount.toFixed(2)} TND</span>
                  </div>
                )}

                {/* Next tier encouragement */}
                {calculateSmartDiscount.nextTier && (
                  <div className="flex items-center gap-2 text-xs text-white/80 mb-3">
                    <GiftIcon className="h-4 w-4" />
                    <span>+{calculateSmartDiscount.nextTier.amountNeeded} TND = -{calculateSmartDiscount.nextTier.discount}% ({calculateSmartDiscount.nextTier.name})</span>
                  </div>
                )}

                {/* Points */}
                {cartTotalPoints > 0 && (
                  <div className="flex justify-between text-white/90 mb-4">
                    <span>Points a gagner</span>
                    <span className="font-bold text-emerald-200">+{cartTotalPoints} pts</span>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-baseline justify-between pt-3 border-t border-white/30">
                  <span className="text-lg font-semibold">Total</span>
                  <div className="text-right">
                    {calculateSmartDiscount.discountAmount > 0 && (
                      <span className="text-white/60 line-through text-sm mr-2">{cartTotal.toFixed(2)}</span>
                    )}
                    <span className="text-2xl font-bold">{finalTotal.toFixed(2)} TND</span>
                  </div>
                </div>

                {/* Savings badge */}
                {calculateSmartDiscount.discountAmount > 0 && (
                  <div className="mt-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-sm">
                      <CheckCircle2Icon className="h-4 w-4" />
                      Vous economisez {calculateSmartDiscount.discountAmount.toFixed(2)} TND
                    </span>
                  </div>
                )}

                {/* Submit button */}
                <Button
                  onClick={() => {
                    void handleSubmitOrder()
                    setShowRecap(false)
                  }}
                  className="w-full mt-4 h-14 rounded-2xl bg-white text-amber-600 hover:bg-white/90 font-bold text-lg shadow-lg"
                >
                  <SendIcon className="h-5 w-5 mr-2" />
                  Envoyer la commande
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Bottom Bar */}
      {!showRecap && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
          {/* Summary Row - Only when cart has items */}
          {cartItemsCount > 0 && (
            <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-stone-100">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-stone-500">Sous-total</span>
                    <span className="font-semibold text-stone-900 text-sm">{cartTotal.toFixed(2)} TND</span>
                  </div>

                  {calculateSmartDiscount.discountAmount > 0 && calculateSmartDiscount.tier && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                      <span className="text-emerald-700 font-medium text-xs">
                        -{calculateSmartDiscount.discountPercent}%
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {cartTotalPoints > 0 && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                        <CoinsIcon className="h-3 w-3 text-amber-600" />
                        <span className="font-semibold text-amber-700 text-xs">+{cartTotalPoints}</span>
                      </div>
                    )}
                    <span className="text-base sm:text-lg font-bold text-stone-900">{finalTotal.toFixed(2)} TND</span>
                  </div>
                </div>

                {calculateSmartDiscount.nextTier && cartTotal > 0 && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    <GiftIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">
                      +<strong>{calculateSmartDiscount.nextTier.amountNeeded} TND</strong> = -{calculateSmartDiscount.nextTier.discount}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Row */}
          <div className="px-3 sm:px-4 py-2 sm:py-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
            <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
              <Button
                variant="outline"
                onClick={skipCurrentStep}
                className="rounded-xl px-3 sm:px-6 py-3 sm:py-4 border-stone-200"
                size="sm"
              >
                <SkipForwardIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline ml-2">Passer</span>
              </Button>

              <div className="flex-1 flex items-center justify-center gap-1">
                {navigationSteps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => {
                      setCategoryStepIndex(index)
                      setSelectedCategory(step.id)
                    }}
                    className={cn(
                      "h-1.5 sm:h-2 rounded-full transition-all",
                      index === categoryStepIndex
                        ? "w-5 sm:w-8 bg-amber-500"
                        : index < categoryStepIndex
                        ? "w-1.5 sm:w-2 bg-emerald-500"
                        : "w-1.5 sm:w-2 bg-stone-200 hover:bg-stone-300"
                    )}
                    title={step.name}
                  />
                ))}
              </div>

              <Button
                onClick={goToNextStep}
                className="rounded-xl px-3 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                size="sm"
              >
                {isLastStep ? (
                  <>
                    <span className="hidden sm:inline mr-1">Terminer</span>
                    <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline mr-1">Suivant</span>
                    <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      {!showRecap && <div className={cn(cartItemsCount > 0 ? "h-44 sm:h-36" : "h-20 sm:h-16")} />}
    </div>
  )
}
