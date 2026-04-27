"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useBreakfast, type BreakfastItem, type BreakfastCategory, type SelectedSupplement } from "@/contexts/breakfast-context"
import { SupplementsModal } from "@/components/supplements-modal"
import { useUnifiedSales } from "@/contexts/unified-sales-context"
import { useLoyalty } from "@/contexts/loyalty-context"
import { useAuth } from "@/contexts/auth-context"
import { useDiscount } from "@/contexts/discount-context"
import { useOrders, type OrderItem } from "@/contexts/orders-context"
import { useNotification } from "@/contexts/notification-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import Image from "next/image"
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  SparklesIcon,
  CoffeeIcon,
  GlassWaterIcon,
  CroissantIcon,
  CakeIcon,
  EggIcon,
  CrownIcon,
  IceCreamIcon,
  StarIcon,
  ShoppingCartIcon,
  XIcon,
  SendIcon,
  SkipForwardIcon,
  CoinsIcon,
  ClockIcon,
  UtensilsIcon,
  LeafIcon,
  HeartIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  PackageIcon,
  Trash2Icon,
  PercentIcon,
  GiftIcon,
  TrendingDownIcon,
  TagIcon,
  SmileIcon,
} from "lucide-react"

// Icon mapping for categories
const categoryIcons: Record<string, React.ReactNode> = {
  "star": <StarIcon className="h-5 w-5" />,
  "coffee": <CoffeeIcon className="h-5 w-5" />,
  "glass-water": <GlassWaterIcon className="h-5 w-5" />,
  "croissant": <CroissantIcon className="h-5 w-5" />,
  "cake": <CakeIcon className="h-5 w-5" />,
  "egg": <EggIcon className="h-5 w-5" />,
  "crown": <CrownIcon className="h-5 w-5" />,
  "ice-cream": <IceCreamIcon className="h-5 w-5" />,
}

// Wizard mode types
type WizardMode = "selection" | "suggestions" | "compose"

interface WizardStep {
  id: string
  name: string
  icon: string
  description: string
  categoryId: string
}

const getFormulaImageSrc = (image?: string) => {
  if (!image) return undefined
  if (image.startsWith("http")) return image
  return `${process.env.NEXT_PUBLIC_API_IMAGE_URL}/menu/${image}`
}

export function BreakfastWizard({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth()
  const { addNotification } = useNotification()
  const { getClientByEmail } = useLoyalty()
  const { addSale } = useUnifiedSales()
  const { createOrderFromItems, deliveryConfig } = useOrders()
  const {
    categories,
    items,
    getItemsByCategory,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartTotalPoints,
    cartItemsCount,
    createOrder,
    baseFormulas,
    selectedFormula,
    selectFormula,
    getFormulaPrice,
    getFormulaPoints,
  } = useBreakfast()

  // Wizard state
  const [wizardMode, setWizardMode] = useState<WizardMode>("selection")
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showCartSummary, setShowCartSummary] = useState(false)
  const [showOrderSuccess, setShowOrderSuccess] = useState(false)
  const [lastClientOrder, setLastClientOrder] = useState<{ orderNumber: string; estimatedTime: number } | null>(null)
  const [customerNote, setCustomerNote] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [showFormulaStep, setShowFormulaStep] = useState(false) // For mandatory formula selection in compose mode
  const [supplementsModalOpen, setSupplementsModalOpen] = useState(false)
  const [selectedItemForSupplements, setSelectedItemForSupplements] = useState<BreakfastItem | null>(null)

  // Get client loyalty data
  const loyaltyClient = user?.role === "client" && user?.email ? getClientByEmail(user.email) : null
  const clientPoints = loyaltyClient?.loyaltyPoints ?? 0
  const canCreateRemoteClientOrder = !!user?.id && !!user?.email && user.role !== "admin"

  // ============================================
  // SMART PROGRESSIVE DISCOUNT SYSTEM (Configurable)
  // ============================================
  // Uses the discount context which can be configured from admin panel

  // Use discount context - it will use its own fallback if not in provider
  const discountContext = useDiscount()

  const calculateSmartDiscount = useMemo(() => {
    const formulaPrice = getFormulaPrice()
    const subtotal = cartTotal + formulaPrice
    const itemCount = cartItemsCount + (selectedFormula ? 1 : 0)

    // Use the discount context calculation
    return discountContext.calculateDiscount(subtotal, itemCount)
  }, [cartTotal, cartItemsCount, selectedFormula, getFormulaPrice, discountContext])

  // Subtotal before discount
  const subtotal = useMemo(() => cartTotal + getFormulaPrice(), [cartTotal, getFormulaPrice])

  // Final total after discount
  const finalTotal = useMemo(() => {
    return Math.round((subtotal - calculateSmartDiscount.discountAmount) * 100) / 100
  }, [subtotal, calculateSmartDiscount.discountAmount])

  // Total points to earn
  const totalPoints = useMemo(() => cartTotalPoints + getFormulaPoints(), [cartTotalPoints, getFormulaPoints])

  // Define wizard steps based on categories (excluding suggestions for compose mode)
  const allSteps: WizardStep[] = useMemo(() => {
    return categories
      .filter(cat => cat.isActive)
      .sort((a, b) => a.order - b.order)
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        description: cat.description || "",
        categoryId: cat.id,
      }))
  }, [categories])

  // Steps for the current wizard mode
  const wizardSteps = useMemo(() => {
    if (wizardMode === "suggestions") {
      return allSteps // Include suggestions step
    } else if (wizardMode === "compose") {
      return allSteps.filter(step => step.id !== "suggestions") // Skip suggestions
    }
    return []
  }, [allSteps, wizardMode])

  const currentStep = wizardSteps[currentStepIndex]
  const isLastStep = currentStepIndex === wizardSteps.length - 1
  const isFirstStep = currentStepIndex === 0

  // Items for the current step
  const currentItems = useMemo(() => {
    if (!currentStep) return []
    return getItemsByCategory(currentStep.categoryId).filter(item => item.isAvailable)
  }, [currentStep, getItemsByCategory])

  // Handle navigation
  const goToNextStep = () => {
    if (!isLastStep) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      setShowCartSummary(true)
    }
  }

  const goToPrevStep = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const skipCurrentStep = () => {
    goToNextStep()
  }

  // Handle order submission
  const handleSubmitOrder = async () => {
    if (cartItemsCount === 0 && !selectedFormula) return

    // Calculate totals including formula
    const formulaPrice = getFormulaPrice()
    const formulaPoints = getFormulaPoints()
    const totalPrice = cartTotal + formulaPrice
    const totalPoints = cartTotalPoints + formulaPoints

    if (totalPrice < deliveryConfig.minOrderAmount) {
      addNotification({
        type: "error",
        title: "Commande non envoyee",
        message: `Le minimum de commande est ${deliveryConfig.minOrderAmount.toFixed(2)} TND.`,
      })
      return
    }

    const remoteOrderItems: OrderItem[] = [
      ...(selectedFormula
        ? [{
            id: `formula-${selectedFormula}`,
            productId: `formula-${selectedFormula}`,
            name: baseFormulas.find((formula) => formula.type === selectedFormula)?.name || "Formule de base",
            price: formulaPrice,
            quantity: 1,
            points: formulaPoints,
            image: baseFormulas.find((formula) => formula.type === selectedFormula)?.image,
          }]
        : []),
      ...cart.map((cartItem) => ({
        id: `${cartItem.item.id}-${(cartItem.selectedSupplements || []).map((s) => `${s.supplementId}:${s.quantity}`).join(",")}`,
        productId: cartItem.item.id,
        name: cartItem.item.name,
        price: cartItem.item.price,
        quantity: cartItem.quantity,
        image: cartItem.item.image,
        points: cartItem.item.points || 0,
        supplements: (cartItem.selectedSupplements || []).flatMap((supplement) =>
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
        [customerNote, tableNumber ? `Table: ${tableNumber}` : ""].filter(Boolean).join(" | ")
      )

      if (clientOrder) {
        clearCart()
        selectFormula(null)
        setLastClientOrder({
          orderNumber: clientOrder.orderNumber,
          estimatedTime: clientOrder.estimatedTime,
        })
        setShowCartSummary(false)
        setShowOrderSuccess(true)
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

    // Create order in breakfast context
    createOrder(customerNote, {
      id: loyaltyClient?.id,
      email: user?.email,
      name: user?.name,
    })

    // Build items array including formula if selected
    const orderItems = [
      // Add formula as first item if selected
      ...(selectedFormula ? [{
        id: `formula-${Date.now()}`,
        productId: `formula-${selectedFormula}`,
        productType: "breakfast" as const,
        name: baseFormulas.find(f => f.type === selectedFormula)?.name || "Formule de base",
        quantity: 1,
        unitPrice: formulaPrice,
        total: formulaPrice,
        categoryId: "formule-base",
      }] : []),
      // Add cart items
      ...cart.map(cartItem => ({
        id: `item-${Date.now()}-${cartItem.item.id}`,
        productId: cartItem.item.id,
        productType: "breakfast" as const,
        name: cartItem.item.name,
        quantity: cartItem.quantity,
        unitPrice: cartItem.item.price,
        total: cartItem.item.price * cartItem.quantity,
        categoryId: cartItem.item.categoryId,
      })),
    ]

    // Calculate final price with smart discount
    const discountAmount = calculateSmartDiscount.discountAmount
    const finalPriceAfterDiscount = totalPrice - discountAmount

    // Also add to unified sales for the admin dashboard
    addSale({
      type: "breakfast",
      source: "online",
      items: orderItems,
      subtotal: totalPrice,
      discount: discountAmount,
      discountType: discountAmount > 0 ? "percentage" : "fixed",
      discountDescription: calculateSmartDiscount.tier ? `Reduction ${calculateSmartDiscount.tier.name} (${calculateSmartDiscount.discountPercent}%)` : undefined,
      deliveryFee: 0,
      total: finalPriceAfterDiscount,
      paymentMethod: "pending",
      paymentStatus: "pending",
      status: "pending",
      clientId: loyaltyClient?.id,
      clientEmail: user?.email,
      clientName: user?.name,
      pointsEarned: totalPoints,
      pointsUsed: 0,
      tableNumber: tableNumber || undefined,
      customerNote: customerNote || undefined,
    })

    setShowCartSummary(false)
    setLastClientOrder(null)
    setShowOrderSuccess(true)
    setCustomerNote("")
    setTableNumber("")
  }

  // Get cart item quantity
  const getItemQuantity = (itemId: string) => {
    const cartItem = cart.find(c => c.item.id === itemId)
    return cartItem?.quantity || 0
  }

  // Handle add/remove from cart
  const handleAddItem = (item: BreakfastItem) => {
    // Check if item has available supplements
    if (item.availableSupplements && item.availableSupplements.length > 0) {
      // Open supplements modal
      setSelectedItemForSupplements(item)
      setSupplementsModalOpen(true)
    } else {
      // Add directly to cart
      addToCart(item)
    }
  }

  // Handle adding item with supplements
  const handleAddItemWithSupplements = (item: BreakfastItem, supplements: SelectedSupplement[]) => {
    addToCart(item, supplements)
  }

  const handleRemoveItem = (item: BreakfastItem) => {
    const cartItem = cart.find(c => c.item.id === item.id)
    if (cartItem && cartItem.quantity > 1) {
      updateQuantity(item.id, cartItem.quantity - 1)
    } else {
      removeFromCart(item.id)
    }
  }

  // Reset wizard
  const resetWizard = () => {
    setWizardMode("selection")
    setCurrentStepIndex(0)
    clearCart()
    setShowOrderSuccess(false)
    setShowFormulaStep(false)
    selectFormula(null) // Reset formula selection
  }

  // Selection screen - Choose between suggestions or compose
  if (wizardMode === "selection") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50"
      >
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm font-medium mb-4">
              <CoffeeIcon className="h-4 w-4" />
              Petit Dejeuner
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4">
              Bonjour, comment souhaitez-vous
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600">
                composer votre petit dejeuner ?
              </span>
            </h1>
            <p className="text-lg text-stone-600 max-w-2xl mx-auto">
              Choisissez une de nos suggestions ou composez votre propre petit dejeuner selon vos envies
            </p>
          </motion.div>

          {/* Options Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Suggestions Option */}
            <motion.button
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setWizardMode("suggestions")}
              className="group relative overflow-hidden rounded-3xl bg-white border-2 border-transparent hover:border-amber-300 shadow-lg hover:shadow-xl transition-all duration-300 text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 mb-2">Nos Suggestions</h2>
                <p className="text-stone-600 mb-6">
                  Decouvrez nos formules pre-composees par nos experts, puis personnalisez avec des extras
                </p>
                <div className="flex items-center gap-2 text-amber-600 font-semibold group-hover:gap-3 transition-all">
                  Commencer
                  <ArrowRightIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-amber-100 opacity-50" />
              <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-orange-100 opacity-50" />
            </motion.button>

            {/* Compose Option */}
            <motion.button
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setShowFormulaStep(true)
                setWizardMode("compose")
              }}
              className="group relative overflow-hidden rounded-3xl bg-white border-2 border-transparent hover:border-emerald-300 shadow-lg hover:shadow-xl transition-all duration-300 text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-8">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                  <UtensilsIcon className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-stone-900 mb-2">Composer mon petit dejeuner</h2>
                <p className="text-stone-600 mb-6">
                  Creez votre propre petit dejeuner en choisissant parmi toutes nos categories
                </p>
                <div className="flex items-center gap-2 text-emerald-600 font-semibold group-hover:gap-3 transition-all">
                  Commencer
                  <ArrowRightIcon className="h-5 w-5" />
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-emerald-100 opacity-50" />
              <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-teal-100 opacity-50" />
            </motion.button>
          </motion.div>

          {/* Points Badge */}
          {loyaltyClient && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex justify-center"
            >
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white shadow-lg border border-amber-100">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <StarIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-stone-500">Vos points fidelite</p>
                  <p className="text-xl font-bold text-amber-600">{clientPoints} points</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    )
  }

  // Formula Selection Screen (Mandatory for compose mode)
  if (wizardMode === "compose" && showFormulaStep && !selectedFormula) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50"
      >
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center mb-10"
          >
            <button
              onClick={() => {
                setWizardMode("selection")
                setShowFormulaStep(false)
              }}
              className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-6 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              Retour
            </button>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-4">
              <UtensilsIcon className="h-4 w-4" />
              Etape 1 - Formule de base
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-4">
              Choisissez votre
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">
                formule de base
              </span>
            </h1>
            <p className="text-lg text-stone-600 max-w-xl mx-auto">
              Cette selection est obligatoire. Vous pourrez ensuite ajouter des extras selon vos envies.
            </p>
          </motion.div>

          {/* Formula Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto"
          >
            {baseFormulas.map((formula, index) => (
              <motion.button
                key={formula.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  selectFormula(formula.type)
                  setShowFormulaStep(false)
                }}
                className="group relative overflow-hidden rounded-3xl bg-white border-2 border-transparent hover:border-emerald-300 shadow-lg hover:shadow-xl transition-all duration-300 text-left"
              >
                {/* Background Image */}
                {formula.image && (
                  <div className="absolute inset-0">
                    <Image
                      src={getFormulaImageSrc(formula.image)!}
                      alt={formula.name}
                      fill
                      className="object-cover opacity-20 group-hover:opacity-30 transition-opacity"
                    />
                  </div>
                )}
                <div className="relative p-6">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform ${
                    formula.type === "healthy" 
                      ? "bg-gradient-to-br from-green-500 to-emerald-500 shadow-green-500/30"
                      : formula.type === "vegan"
                      ? "bg-gradient-to-br from-red-500 to-pink-500 shadow-red-500/30"
                      : formula.type === "premium"
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/30"
                      : formula.type === "enfants"
                      ? "bg-gradient-to-br from-pink-500 to-rose-500 shadow-pink-500/30"
                      : "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30"
         }`}>
                  {formula.type === "healthy" ? (
                    <LeafIcon className="h-7 w-7 text-white" />
                  ) : formula.type === "vegan" ? (
                    <HeartIcon className="h-7 w-7 text-white" />
                  ) : formula.type === "premium" ? (
                    <CrownIcon className="h-7 w-7 text-white" />
                  ) : formula.type === "enfants" ? (
                    <SmileIcon className="h-7 w-7 text-white" />
                  ) : (
                    <CoffeeIcon className="h-7 w-7 text-white" />
                  )}
                  </div>
                  <h2 className="text-xl font-bold text-stone-900 mb-2">{formula.name}</h2>
                  <p className="text-stone-600 text-sm mb-4">{formula.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-stone-900">{formula.price.toFixed(1)} <span className="text-sm font-normal text-stone-500">TND</span></span>
                      {formula.points! > 0 && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0">
                          <CoinsIcon className="h-3 w-3 mr-1" />
                          +{formula.points} pts
                        </Badge>
                      )}
                    </div>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                    formula.type === "healthy"
                      ? "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white"
                      : formula.type === "vegan"
                      ? "bg-red-100 text-red-600 group-hover:bg-red-500 group-hover:text-white"
                      : formula.type === "premium"
                      ? "bg-purple-100 text-purple-600 group-hover:bg-purple-500 group-hover:text-white"
                      : formula.type === "enfants"
                      ? "bg-pink-100 text-pink-600 group-hover:bg-pink-500 group-hover:text-white"
                      : "bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white"
                  }`}>
                    <ArrowRightIcon className="h-5 w-5" />
                  </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>

          {/* Info Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-sm text-stone-500 flex items-center justify-center gap-2">
              <HeartIcon className="h-4 w-4 text-rose-400" />
              Vous ne pouvez pas passer cette etape - la formule de base est obligatoire
            </p>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  // Order Success Screen
  if (showOrderSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-md mx-auto px-4 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30"
          >
            <CheckCircleIcon className="h-12 w-12 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-stone-900 mb-3">Commande envoyee !</h1>
          <p className="text-stone-600 mb-2">
            {lastClientOrder
              ? `Votre commande ${lastClientOrder.orderNumber} a ete transmise en cuisine.`
              : "Votre commande a ete transmise en cuisine."}
          </p>
          {lastClientOrder && (
            <p className="text-amber-600 font-medium mb-2">
              Temps estime: ~{lastClientOrder.estimatedTime} min
            </p>
          )}
          {cartTotalPoints > 0 && (
            <p className="text-emerald-600 font-medium mb-8">
              Vous allez gagner +{cartTotalPoints} points fidelite
            </p>
          )}
          <Button
            onClick={resetWizard}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg shadow-amber-500/30"
          >
            Nouvelle commande
          </Button>
        </motion.div>
      </motion.div>
    )
  }

  // Cart Summary / Checkout Screen
  if (showCartSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setShowCartSummary(false)}
              className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              Retour
            </button>
            <h1 className="text-2xl font-bold text-stone-900">Recapitulatif</h1>
            <div className="w-20" />
          </div>

          {/* Selected Formula (if in compose mode) */}
          {wizardMode === "compose" && selectedFormula && (
            <Card className="rounded-3xl overflow-hidden shadow-lg border-0 mb-4 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            selectedFormula.type === "healthy"
              ? "bg-green-500"
              : selectedFormula.type === "vegan"
              ? "bg-red-500"
              : selectedFormula.type === "premium"
              ? "bg-purple-500"
              : selectedFormula.type === "enfants"
              ? "bg-pink-500"
              : "bg-amber-500"
          }`}>
            {selectedFormula.type === "healthy" ? (
              <LeafIcon className="h-6 w-6 text-white" />
            ) : selectedFormula.type === "vegan" ? (
              <HeartIcon className="h-6 w-6 text-white" />
            ) : selectedFormula.type === "premium" ? (
              <CrownIcon className="h-6 w-6 text-white" />
            ) : selectedFormula.type === "enfants" ? (
              <SmileIcon className="h-6 w-6 text-white" />
            ) : (
              <CoffeeIcon className="h-6 w-6 text-white" />
            )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-stone-500 uppercase tracking-wider">Formule de base</p>
                    <p className="font-semibold text-stone-900">
                      {baseFormulas.find(f => f.type === selectedFormula)?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-stone-900">{getFormulaPrice().toFixed(2)} TND</p>
                    {getFormulaPoints() > 0 && (
                      <p className="text-xs text-emerald-600">+{getFormulaPoints()} pts</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Cart Items */}
          <Card className="rounded-3xl overflow-hidden shadow-lg border-0 mb-6">
            <div className="p-6">
              <h2 className="font-semibold text-lg text-stone-900 mb-4">
                {wizardMode === "compose" && selectedFormula ? "Extras ajoutes" : "Votre commande"}
              </h2>

              {cart.length === 0 && !selectedFormula ? (
                <div className="text-center py-8">
                  <PackageIcon className="h-12 w-12 mx-auto text-stone-300 mb-3" />
                  <p className="text-stone-500">Votre panier est vide</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((cartItem) => (
                    <div key={cartItem.item.id} className="flex items-center gap-4 p-3 rounded-2xl bg-stone-50">
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-stone-200 shrink-0">
                        {cartItem.item.image && (
                          <Image
                            src={`${process.env.NEXT_PUBLIC_API_IMAGE_URL}/menu/${cartItem.item.image}`}
                            alt={cartItem.item.name}
                            width={64}
                            height={64}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900 truncate">{cartItem.item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-amber-600 font-semibold">{cartItem.item.price.toFixed(2)} TND</span>
                          {cartItem.item.points && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                              +{cartItem.item.points} pts
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleRemoveItem(cartItem.item)}
                        >
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{cartItem.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          onClick={() => handleAddItem(cartItem.item)}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                        {/* Delete button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => {
                            // Remove all quantity of this item
                            for (let i = 0; i < cartItem.quantity; i++) {
                              removeFromCart(cartItem.item.id)
                            }
                          }}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Note and Table */}
          <Card className="rounded-3xl overflow-hidden shadow-lg border-0 mb-6">
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">Numero de table (optionnel)</label>
                <Input
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ex: Table 5"
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-2 block">Note pour la cuisine (optionnel)</label>
                <Textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Allergies, preferences..."
                  className="rounded-xl resize-none"
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Smart Discount Encouragement */}
          {calculateSmartDiscount.nextTier && calculateSmartDiscount.discountPercent === 0 && (cartTotal + getFormulaPrice()) > 0 && (
            <Card className="rounded-2xl overflow-hidden border-0 mb-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <GiftIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-800">
                      Ajoutez {calculateSmartDiscount.nextTier.amountNeeded} TND pour debloquer
                    </p>
                    <p className="text-xs text-emerald-600">
                      Reduction {calculateSmartDiscount.nextTier.name} de {calculateSmartDiscount.nextTier.discount}%
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Total and Submit */}
          <Card className="rounded-3xl overflow-hidden shadow-xl border-0 bg-gradient-to-br from-amber-500 to-orange-500">
            <div className="p-6">
              {/* Formula Price (if selected) */}
              {wizardMode === "compose" && selectedFormula && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/80">Formule de base</span>
                  <span className="text-white font-medium">{getFormulaPrice().toFixed(2)} TND</span>
                </div>
              )}

              {/* Extras Subtotal */}
              {cart.length > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/80">Extras</span>
                  <span className="text-white font-medium">{cartTotal.toFixed(2)} TND</span>
                </div>
              )}

              {/* Subtotal before discount */}
              {(cartTotal + getFormulaPrice()) > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/80">Sous-total</span>
                  <span className="text-white font-medium">{(cartTotal + getFormulaPrice()).toFixed(2)} TND</span>
                </div>
              )}

              {/* Smart Discount Display */}
              {calculateSmartDiscount.discountAmount > 0 && calculateSmartDiscount.tier && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4"
                >
                  <div className="flex items-center justify-between mb-2 bg-white/20 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-full ${calculateSmartDiscount.tier.color} flex items-center justify-center`}>
                        <PercentIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Reduction {calculateSmartDiscount.tier.name}</p>
                        <p className="text-white/70 text-xs">-{calculateSmartDiscount.discountPercent}% applique</p>
                      </div>
                    </div>
                    <span className="text-white font-bold text-lg">-{calculateSmartDiscount.discountAmount.toFixed(2)} TND</span>
                  </div>

                  {/* Next tier encouragement */}
                  {calculateSmartDiscount.nextTier && (
                    <div className="flex items-center gap-2 text-white/70 text-xs px-2">
                      <TrendingDownIcon className="h-3 w-3" />
                      <span>
                        +{calculateSmartDiscount.nextTier.amountNeeded} TND = -{calculateSmartDiscount.nextTier.discount}% ({calculateSmartDiscount.nextTier.name})
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              <div className="flex items-center justify-between mb-4">
                <span className="text-white/80">Points a gagner</span>
                <span className="text-white font-medium">+{cartTotalPoints + getFormulaPoints()} pts</span>
              </div>

              <div className="h-px bg-white/20 mb-4" />

              {/* Final Total */}
              <div className="flex items-center justify-between mb-6">
                <span className="text-xl font-bold text-white">Total</span>
                <div className="text-right">
                  {calculateSmartDiscount.discountAmount > 0 && (
                    <span className="text-white/60 line-through text-lg mr-2">
                      {(cartTotal + getFormulaPrice()).toFixed(2)}
                    </span>
                  )}
                  <span className="text-3xl font-bold text-white">{finalTotal.toFixed(2)} TND</span>
                </div>
              </div>

              {/* Savings summary */}
              {calculateSmartDiscount.discountAmount > 0 && (
                <div className="mb-4 text-center">
                  <Badge className="bg-white/20 text-white border-0 px-4 py-1">
                    <GiftIcon className="h-3 w-3 mr-1" />
                    Vous economisez {calculateSmartDiscount.discountAmount.toFixed(2)} TND!
                  </Badge>
                </div>
              )}

              <Button
                onClick={() => void handleSubmitOrder()}
                disabled={cartItemsCount === 0 && !selectedFormula}
                className="w-full bg-white text-amber-600 hover:bg-stone-100 py-6 rounded-2xl text-lg font-semibold shadow-lg"
              >
                <SendIcon className="h-5 w-5 mr-2" />
                Envoyer la commande
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Main Wizard Steps View
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex flex-col">
      {/* Progress Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Back and Cart */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => {
                if (isFirstStep) {
                  if (wizardMode === "compose" && selectedFormula) {
                    // In compose mode, go back to formula selection
                    selectFormula(null)
                    setShowFormulaStep(true)
                  } else {
                    setWizardMode("selection")
                  }
                } else {
                  goToPrevStep()
                }
              }}
              className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
              {isFirstStep ? "Retour" : "Precedent"}
            </button>

            <h1 className="text-lg font-semibold text-stone-900">
              {wizardMode === "suggestions" ? "Nos Suggestions" : "Composer"}
            </h1>

            <button
              onClick={() => setShowCartSummary(true)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              <div className="flex items-center gap-1">
                {calculateSmartDiscount.discountAmount > 0 && (
                  <span className="text-xs line-through text-white/60">{(cartTotal + getFormulaPrice()).toFixed(2)}</span>
                )}
                <span className="font-semibold">{finalTotal.toFixed(2)} TND</span>
              </div>
              {(cartItemsCount > 0 || selectedFormula) && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {cartItemsCount + (selectedFormula ? 1 : 0)}
                </span>
              )}
              {calculateSmartDiscount.discountAmount > 0 && (
                <span className="absolute -bottom-1 -right-1 h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center">
                  -{calculateSmartDiscount.discountPercent}%
                </span>
              )}
            </button>
          </div>

          {/* Step Progress */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {wizardSteps.map((step, index) => {
              const isActive = index === currentStepIndex
              const isCompleted = index < currentStepIndex
              const hasItemsInCart = cart.some(c => c.item.categoryId === step.categoryId)

              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStepIndex(index)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full shrink-0 transition-all",
                    isActive
                      ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
                      : isCompleted
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  )}
                >
                  <span className="flex items-center justify-center">
                    {isCompleted ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      categoryIcons[step.icon] || <StarIcon className="h-4 w-4" />
                    )}
                  </span>
                  <span className="text-sm font-medium whitespace-nowrap">{step.name}</span>
                  {hasItemsInCart && !isCompleted && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Step Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30">
                {categoryIcons[currentStep?.icon] || <StarIcon className="h-6 w-6" />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-stone-900">{currentStep?.name}</h2>
                <p className="text-stone-600">{currentStep?.description}</p>
              </div>
            </div>
          </div>

          {/* Items Grid */}
          <AnimatePresence mode="wait">
            {currentItems.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-12"
              >
                <PackageIcon className="h-16 w-16 mx-auto text-stone-300 mb-4" />
                <p className="text-stone-500">Aucun article disponible dans cette categorie</p>
              </motion.div>
            ) : (
              <motion.div
                key={currentStep?.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2"
              >
                {currentItems.map((item, index) => {
                  const quantity = getItemQuantity(item.id)
                  const isInCart = quantity > 0
                  const hasSupplements = item.availableSupplements && item.availableSupplements.length > 0

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                    >
                      <Card
                        className={cn(
                          "group relative overflow-hidden rounded-lg border transition-all duration-200 h-full",
                          isInCart
                            ? "border-amber-400 shadow-md"
                            : "border-stone-200 hover:border-amber-300 hover:shadow-sm"
                        )}
                      >
                        {/* Image - Compact 56px */}
                        <div className="relative h-14 overflow-hidden bg-stone-100">
                          {item.image ? (
                            <Image
                              src={`${process.env.NEXT_PUBLIC_API_IMAGE_URL}/menu/${item.image}`}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="150px"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <CoffeeIcon className="h-6 w-6 text-stone-300" />
                            </div>
                          )}

                          {/* Price Badge */}
                          <div className="absolute top-1 right-1">
                            <span className="bg-white/90 text-amber-600 text-[9px] font-bold px-1 py-0.5 rounded">
                              {item.price.toFixed(2)}
                            </span>
                          </div>

                          {/* Points Badge */}
                          {item.points && item.points > 0 && (
                            <div className="absolute top-1 left-1">
                              <span className="bg-emerald-500 text-white text-[8px] font-medium px-1 py-0.5 rounded">
                                +{item.points}
                              </span>
                            </div>
                          )}

                          {/* Quantity indicator */}
                          {isInCart && (
                            <div className="absolute bottom-1 left-1">
                              <span className="bg-amber-500 text-white text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                                {quantity}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content - Compact */}
                        <div className="p-1.5">
                          <p className="font-medium text-xs text-stone-800 truncate mb-1">{item.name}</p>
                          {/* Supplements indicator - MOVED HERE outside the image div */}
                          {hasSupplements && (
                            <div className="flex items-center gap-1 mb-1 text-[9px] text-amber-600">
                              <TagIcon className="h-2.5 w-2.5" />
                              <span>Supplements disponibles</span>
                            </div>
                          )}
                          {/* Add/Remove Buttons - Compact */}
                          {isInCart ? (
                            <div className="flex items-center justify-between bg-stone-100 rounded p-0.5">
                              <button
                                className="h-6 w-6 rounded flex items-center justify-center bg-white"
                                onClick={() => handleRemoveItem(item)}
                              >
                                <MinusIcon className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-bold">{quantity}</span>
                              <button
                                className="h-6 w-6 rounded flex items-center justify-center bg-amber-500 text-white"
                                onClick={() => handleAddItem(item)}
                              >
                                <PlusIcon className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddItem(item)}
                              className="w-full py-1 bg-stone-900 text-white text-[10px] rounded flex items-center justify-center gap-1"
                            >
                              <PlusIcon className="h-3 w-3" />
                              Ajouter
                            </button>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Enhanced Bottom Navigation with Price Breakdown */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-lg border-t border-stone-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
        {/* Price Summary Row - Only visible when there are items */}
        {(cartItemsCount > 0 || selectedFormula) && (
          <div className="border-b border-stone-100 px-3 sm:px-4 py-2 sm:py-3">
            <div className="max-w-6xl mx-auto">
              {/* Mobile-first layout: stacked on small screens */}
              <div className="flex items-center justify-between gap-2">
                {/* Left: Subtotal */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-xs sm:text-sm text-stone-500">Sous-total:</span>
                    <span className="font-medium text-stone-700 text-sm">{subtotal.toFixed(2)} TND</span>
                  </div>

                  {/* Discount Badge - Compact on mobile */}
                  {calculateSmartDiscount.discountAmount > 0 && calculateSmartDiscount.tier && (
                    <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-50 border border-emerald-200 mt-0.5 sm:mt-0">
                      <span className="text-emerald-700 font-medium text-[10px] sm:text-xs">
                        -{calculateSmartDiscount.discountPercent}%
                      </span>
                      <span className="text-emerald-600 text-[10px] sm:text-xs hidden sm:inline">
                        -{calculateSmartDiscount.discountAmount.toFixed(2)} TND
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Total + Points */}
                <div className="flex items-center gap-2 sm:gap-4">
                  {/* Points - Compact on mobile */}
                  <div className="flex items-center gap-1 px-2 py-0.5 sm:py-1.5 rounded-full bg-amber-50 border border-amber-200">
                    <CoinsIcon className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                    <span className="font-semibold text-amber-700 text-xs sm:text-sm">+{totalPoints}</span>
                    <span className="hidden sm:inline text-amber-700 text-xs">pts</span>
                  </div>

                  {/* Final Total */}
                  <div className="flex items-baseline gap-1 sm:gap-2">
                    {calculateSmartDiscount.discountAmount > 0 && (
                      <span className="text-stone-400 line-through text-[10px] sm:text-sm">{subtotal.toFixed(2)}</span>
                    )}
                    <span className="text-base sm:text-xl font-bold text-stone-900">{finalTotal.toFixed(2)} TND</span>
                  </div>
                </div>
              </div>

              {/* Encouragement message - Compact on mobile */}
              {calculateSmartDiscount.nextTier && subtotal > 0 && (
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

        {/* Navigation Row - Compact on mobile */}
        <div className="p-2 sm:p-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
            <Button
              variant="outline"
              onClick={skipCurrentStep}
              className="rounded-xl px-3 sm:px-6 py-3 sm:py-5 border-stone-200 text-sm"
              size="sm"
            >
              <SkipForwardIcon className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
              <span className="hidden sm:inline">Passer</span>
            </Button>

            <div className="flex-1 flex items-center justify-center gap-1">
              {wizardSteps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1.5 sm:h-2 rounded-full transition-all",
                    index === currentStepIndex
                      ? "w-5 sm:w-8 bg-amber-500"
                      : index < currentStepIndex
                        ? "w-1.5 sm:w-2 bg-emerald-500"
                        : "w-1.5 sm:w-2 bg-stone-200"
                  )}
                />
              ))}
            </div>

            <Button
              onClick={goToNextStep}
              className="rounded-xl px-3 sm:px-6 py-3 sm:py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30 text-sm"
              size="sm"
            >
              {isLastStep ? (
                <>
                  <span className="hidden sm:inline">Terminer</span>
                  <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5 sm:ml-2" />
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

      {/* Supplements Modal */}
      {selectedItemForSupplements && (
        <SupplementsModal
          isOpen={supplementsModalOpen}
          onClose={() => {
            setSupplementsModalOpen(false)
            setSelectedItemForSupplements(null)
          }}
          item={selectedItemForSupplements}
          onConfirm={(selectedItemForSupplements,supplements) => {
            handleAddItemWithSupplements(selectedItemForSupplements, supplements)
            setSupplementsModalOpen(false)
            setSelectedItemForSupplements(null)
          }}
        />
      )}
    </div>
  )
}
