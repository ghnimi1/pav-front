"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  ShoppingCartIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
  TruckIcon,
  StoreIcon,
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  CreditCardIcon,
  ArrowLeftIcon,
  StarIcon,
  CheckCircleIcon,
  SearchIcon,
  FilterIcon,
  ChevronDownIcon,
  CoinsIcon,
  PackageIcon,
  InfoIcon,
  XIcon,
  HistoryIcon,
  SparklesIcon,
  CoffeeIcon,
  CakeIcon,
  CroissantIcon,
  UtensilsCrossedIcon,
} from "lucide-react"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { OrdersProvider, useOrders, type OrderItem, type DeliveryMode, type DeliveryAddress } from "@/contexts/orders-context"
import { StockProvider, useStock } from "@/contexts/stock-context"
import { LoyaltyProvider, useLoyalty } from "@/contexts/loyalty-context"
import { NotificationProvider, useNotification } from "@/contexts/notification-context"
import { NotificationContainer } from "@/components/notification-container"

function OrderPageContent() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { menuItems, menuCategories } = useStock()
  const { getClientByEmail } = useLoyalty()
  const { addNotification } = useNotification()
  const {
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    cartTotal,
    cartItemsCount,
    cartTotalPoints,
    createOrder,
    deliveryConfig,
    getDeliveryFee,
    getEstimatedTime,
    orders,
    getOrdersByClient,
  } = useOrders()

  // Get client orders for history
  const clientOrders = user?.email ? getOrdersByClient(user.email) : []

  // States
  const [activeTab, setActiveTab] = useState<"menu" | "history">("menu")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "delivery" | "info" | "confirm">("cart")
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("pickup")
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [lastOrder, setLastOrder] = useState<{ orderNumber: string; estimatedTime: number } | null>(null)

  // Form states
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    fullName: user?.name || "",
    phone: "",
    address: "",
    city: "Tunis",
    postalCode: "",
    instructions: "",
  })
  const [customerNote, setCustomerNote] = useState("")

  // Get loyalty client data
  const loyaltyClient = user?.role === "client" && user?.email ? getClientByEmail(user.email) : null
  const clientPoints = loyaltyClient?.loyaltyPoints ?? 0

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setDeliveryAddress(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
      }))
    }
  }, [user])

  // Filter items - use item.category (not categoryId) as per MenuItem interface
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch && item.isAvailable
  })

  // Calculate delivery fee
  const deliveryFee = deliveryMode === "delivery" ? getDeliveryFee(cartTotal) : 0
  const orderTotal = cartTotal + deliveryFee
  const estimatedTime = getEstimatedTime(deliveryMode)

  // Add item to cart
  const handleAddItem = (item: typeof menuItems[0]) => {
    const orderItem: OrderItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: 1,
      image: item.image,
      points: item.points || Math.floor(item.price),
    }
    addToCart(orderItem)
    addNotification({
      type: "success",
      title: "Ajoute au panier",
      message: `${item.name} a ete ajoute`,
    })
  }

  // Validate form
  const validateDeliveryForm = () => {
    if (deliveryMode === "delivery") {
      return deliveryAddress.fullName && deliveryAddress.phone && deliveryAddress.address && deliveryAddress.city
    }
    return deliveryAddress.fullName && deliveryAddress.phone
  }

  // Submit order
  const handleSubmitOrder = () => {
    if (!validateDeliveryForm()) {
      addNotification({
        type: "error",
        title: "Formulaire incomplet",
        message: "Veuillez remplir tous les champs obligatoires",
      })
      return
    }

    const clientInfo = {
      id: user?.id,
      email: user?.email,
      name: deliveryAddress.fullName,
      phone: deliveryAddress.phone,
    }

    const order = createOrder(
      deliveryMode,
      deliveryMode === "delivery" ? "cash_on_delivery" : "cash_on_pickup",
      clientInfo,
      deliveryMode === "delivery" ? deliveryAddress : undefined,
      undefined,
      customerNote
    )

    if (order) {
      setLastOrder({
        orderNumber: order.orderNumber,
        estimatedTime: order.estimatedTime,
      })
      setOrderSuccess(true)
      setCheckoutStep("cart")
      setCartOpen(false)
    }
  }

  // Render product card
  const renderProductCard = (item: typeof menuItems[0]) => {
    const cartItem = cart.find(c => c.id === item.id)
    const itemPoints = item.points || Math.floor(item.price)

    return (
      <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-stone-200">
        <div className="relative">
          <div className="h-40 bg-stone-100 overflow-hidden">
            <img
              src={item.image || "/placeholder.svg?height=160&width=240&query=pastry"}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          {item.promotion && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white">
              -{item.promotion.value}%
            </Badge>
          )}
          {isAuthenticated && (
            <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-xs">
              <CoinsIcon className="h-3 w-3 mr-1" />
              +{itemPoints} pts
            </Badge>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-stone-900 mb-1 line-clamp-1">{item.name}</h3>
          <p className="text-sm text-stone-500 line-clamp-2 mb-3 min-h-[40px]">{item.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-amber-600">{item.price.toFixed(2)} TND</span>
            {cartItem ? (
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 rounded-full"
                  onClick={() => updateCartItemQuantity(item.id, cartItem.quantity - 1)}
                >
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <span className="font-semibold w-6 text-center">{cartItem.quantity}</span>
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full bg-amber-500 hover:bg-amber-600"
                  onClick={() => updateCartItemQuantity(item.id, cartItem.quantity + 1)}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-full"
                onClick={() => handleAddItem(item)}
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/menu")}
                className="shrink-0"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-stone-900">Commander</h1>
                <p className="text-sm text-stone-500">Livraison ou retrait sur place</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200">
                  <StarIcon className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-amber-700 text-sm">{clientPoints} pts</span>
                </div>
              )}
              <Sheet open={cartOpen} onOpenChange={setCartOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    <span className="font-semibold">{cartTotal.toFixed(2)} TND</span>
                    {cartItemsCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-amber-500">
                        {cartItemsCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg flex flex-col">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <ShoppingCartIcon className="h-5 w-5" />
                      Mon Panier ({cartItemsCount})
                    </SheetTitle>
                  </SheetHeader>

                  {checkoutStep === "cart" && (
                    <div className="flex-1 flex flex-col">
                      {cart.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                          <ShoppingCartIcon className="h-16 w-16 text-stone-300 mb-4" />
                          <h3 className="font-semibold text-lg mb-2">Panier vide</h3>
                          <p className="text-stone-500 mb-4">Ajoutez des articles pour commencer</p>
                          <Button onClick={() => setCartOpen(false)} className="bg-amber-500 hover:bg-amber-600">
                            Parcourir le menu
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 overflow-auto py-4 space-y-3">
                            {cart.map(item => (
                              <div key={item.id} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                                <div className="h-16 w-16 rounded-lg overflow-hidden bg-stone-200 shrink-0">
                                  <img
                                    src={item.image || "/placeholder.svg?height=64&width=64&query=pastry"}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                                  <p className="text-amber-600 font-semibold">{item.price.toFixed(2)} TND</p>
                                  {isAuthenticated && item.points && (
                                    <p className="text-xs text-emerald-600">+{item.points * item.quantity} pts</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 rounded-full"
                                    onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                                  >
                                    <MinusIcon className="h-3 w-3" />
                                  </Button>
                                  <span className="font-semibold w-5 text-center text-sm">{item.quantity}</span>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7 rounded-full"
                                    onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                  >
                                    <PlusIcon className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Cart Summary */}
                          <div className="border-t pt-4 space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-stone-500">Sous-total</span>
                              <span className="font-medium">{cartTotal.toFixed(2)} TND</span>
                            </div>
                            {isAuthenticated && cartTotalPoints > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-emerald-600">Points a gagner</span>
                                <span className="font-medium text-emerald-600">+{cartTotalPoints} pts</span>
                              </div>
                            )}
                            {cartTotal < deliveryConfig.minOrderAmount && (
                              <div className="p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                                <InfoIcon className="h-4 w-4 inline mr-2" />
                                Commande minimum: {deliveryConfig.minOrderAmount.toFixed(2)} TND
                              </div>
                            )}
                            <Button
                              className="w-full bg-amber-500 hover:bg-amber-600 h-12"
                              disabled={cartTotal < deliveryConfig.minOrderAmount}
                              onClick={() => setCheckoutStep("delivery")}
                            >
                              Continuer
                              <ChevronDownIcon className="h-4 w-4 ml-2 rotate-[-90deg]" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {checkoutStep === "delivery" && (
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1 py-4 space-y-4">
                        <h3 className="font-semibold text-lg">Mode de reception</h3>
                        <RadioGroup
                          value={deliveryMode}
                          onValueChange={(v) => setDeliveryMode(v as DeliveryMode)}
                          className="space-y-3"
                        >
                          {deliveryConfig.pickupEnabled && (
                            <label
                              htmlFor="pickup"
                              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                deliveryMode === "pickup"
                                  ? "border-amber-500 bg-amber-50"
                                  : "border-stone-200 hover:border-stone-300"
                              }`}
                            >
                              <RadioGroupItem value="pickup" id="pickup" />
                              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                <StoreIcon className="h-6 w-6 text-emerald-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">Retrait sur place</p>
                                <p className="text-sm text-stone-500">Gratuit - ~{deliveryConfig.estimatedPickupTime} min</p>
                              </div>
                              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                Gratuit
                              </Badge>
                            </label>
                          )}
                          {deliveryConfig.deliveryEnabled && (
                            <label
                              htmlFor="delivery"
                              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                deliveryMode === "delivery"
                                  ? "border-amber-500 bg-amber-50"
                                  : "border-stone-200 hover:border-stone-300"
                              }`}
                            >
                              <RadioGroupItem value="delivery" id="delivery" />
                              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                <TruckIcon className="h-6 w-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold">Livraison a domicile</p>
                                <p className="text-sm text-stone-500">~{deliveryConfig.estimatedDeliveryTime} min</p>
                              </div>
                              {deliveryFee > 0 ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  +{deliveryFee.toFixed(2)} TND
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                  Gratuit
                                </Badge>
                              )}
                            </label>
                          )}
                        </RadioGroup>

                        {deliveryMode === "delivery" && deliveryFee === 0 && cartTotal >= deliveryConfig.freeDeliveryThreshold && (
                          <div className="p-3 bg-emerald-50 rounded-lg text-sm text-emerald-700">
                            <CheckCircleIcon className="h-4 w-4 inline mr-2" />
                            Livraison gratuite! (commande {">="} {deliveryConfig.freeDeliveryThreshold} TND)
                          </div>
                        )}

                        {deliveryMode === "delivery" && cartTotal < deliveryConfig.freeDeliveryThreshold && (
                          <div className="p-3 bg-stone-100 rounded-lg text-sm text-stone-600">
                            <InfoIcon className="h-4 w-4 inline mr-2" />
                            Livraison gratuite a partir de {deliveryConfig.freeDeliveryThreshold.toFixed(2)} TND
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500">Sous-total</span>
                          <span>{cartTotal.toFixed(2)} TND</span>
                        </div>
                        {deliveryFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Frais de livraison</span>
                            <span>{deliveryFee.toFixed(2)} TND</span>
                          </div>
                        )}
                        <div className="flex justify-between font-semibold">
                          <span>Total</span>
                          <span className="text-amber-600">{orderTotal.toFixed(2)} TND</span>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setCheckoutStep("cart")}
                          >
                            Retour
                          </Button>
                          <Button
                            className="flex-1 bg-amber-500 hover:bg-amber-600"
                            onClick={() => setCheckoutStep("info")}
                          >
                            Continuer
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {checkoutStep === "info" && (
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1 py-4 space-y-4 overflow-auto">
                        <h3 className="font-semibold text-lg">Vos informations</h3>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullName">Nom complet *</Label>
                            <Input
                              id="fullName"
                              placeholder="Votre nom"
                              value={deliveryAddress.fullName}
                              onChange={(e) => setDeliveryAddress(prev => ({ ...prev, fullName: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Telephone *</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+216 XX XXX XXX"
                              value={deliveryAddress.phone}
                              onChange={(e) => setDeliveryAddress(prev => ({ ...prev, phone: e.target.value }))}
                            />
                          </div>

                          {deliveryMode === "delivery" && (
                            <>
                              <div className="space-y-2">
                                <Label htmlFor="address">Adresse *</Label>
                                <Input
                                  id="address"
                                  placeholder="Rue, numero..."
                                  value={deliveryAddress.address}
                                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, address: e.target.value }))}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label htmlFor="city">Ville *</Label>
                                  <Input
                                    id="city"
                                    placeholder="Tunis"
                                    value={deliveryAddress.city}
                                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, city: e.target.value }))}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="postalCode">Code postal</Label>
                                  <Input
                                    id="postalCode"
                                    placeholder="1000"
                                    value={deliveryAddress.postalCode}
                                    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                                  />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="instructions">Instructions livraison</Label>
                                <Textarea
                                  id="instructions"
                                  placeholder="Etage, code d'entree..."
                                  value={deliveryAddress.instructions}
                                  onChange={(e) => setDeliveryAddress(prev => ({ ...prev, instructions: e.target.value }))}
                                />
                              </div>
                            </>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor="note">Note pour la commande</Label>
                            <Textarea
                              id="note"
                              placeholder="Allergies, preferences..."
                              value={customerNote}
                              onChange={(e) => setCustomerNote(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-3">
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setCheckoutStep("delivery")}
                          >
                            Retour
                          </Button>
                          <Button
                            className="flex-1 bg-amber-500 hover:bg-amber-600"
                            onClick={() => setCheckoutStep("confirm")}
                            disabled={!validateDeliveryForm()}
                          >
                            Verifier
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {checkoutStep === "confirm" && (
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1 py-4 space-y-4 overflow-auto">
                        <h3 className="font-semibold text-lg">Confirmation</h3>

                        {/* Order Summary */}
                        <Card className="p-4 space-y-3">
                          <h4 className="font-medium text-sm text-stone-500">ARTICLES</h4>
                          {cart.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.name}</span>
                              <span>{(item.price * item.quantity).toFixed(2)} TND</span>
                            </div>
                          ))}
                        </Card>

                        {/* Delivery Info */}
                        <Card className="p-4 space-y-3">
                          <h4 className="font-medium text-sm text-stone-500">
                            {deliveryMode === "delivery" ? "LIVRAISON" : "RETRAIT"}
                          </h4>
                          <div className="flex items-center gap-3">
                            {deliveryMode === "delivery" ? (
                              <TruckIcon className="h-5 w-5 text-blue-600" />
                            ) : (
                              <StoreIcon className="h-5 w-5 text-emerald-600" />
                            )}
                            <div>
                              <p className="font-medium">
                                {deliveryMode === "delivery" ? "Livraison a domicile" : "Retrait sur place"}
                              </p>
                              <p className="text-sm text-stone-500">
                                <ClockIcon className="h-3 w-3 inline mr-1" />
                                Temps estime: ~{estimatedTime} min
                              </p>
                            </div>
                          </div>
                          {deliveryMode === "delivery" && (
                            <div className="text-sm text-stone-600 pl-8">
                              <p>{deliveryAddress.address}</p>
                              <p>{deliveryAddress.city} {deliveryAddress.postalCode}</p>
                            </div>
                          )}
                        </Card>

                        {/* Contact Info */}
                        <Card className="p-4 space-y-2">
                          <h4 className="font-medium text-sm text-stone-500">CONTACT</h4>
                          <p className="flex items-center gap-2 text-sm">
                            <UserIcon className="h-4 w-4 text-stone-400" />
                            {deliveryAddress.fullName}
                          </p>
                          <p className="flex items-center gap-2 text-sm">
                            <PhoneIcon className="h-4 w-4 text-stone-400" />
                            {deliveryAddress.phone}
                          </p>
                        </Card>

                        {/* Payment */}
                        <Card className="p-4 space-y-2">
                          <h4 className="font-medium text-sm text-stone-500">PAIEMENT</h4>
                          <div className="flex items-center gap-3">
                            <CreditCardIcon className="h-5 w-5 text-amber-600" />
                            <div>
                              <p className="font-medium">
                                {deliveryMode === "delivery" ? "Paiement a la livraison" : "Paiement au retrait"}
                              </p>
                              <p className="text-sm text-stone-500">Especes uniquement</p>
                            </div>
                          </div>
                        </Card>

                        {/* Points */}
                        {isAuthenticated && cartTotalPoints > 0 && (
                          <Card className="p-4 bg-emerald-50 border-emerald-200">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                <CoinsIcon className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-emerald-800">+{cartTotalPoints} points</p>
                                <p className="text-sm text-emerald-600">A gagner avec cette commande</p>
                              </div>
                            </div>
                          </Card>
                        )}
                      </div>

                      <div className="border-t pt-4 space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-stone-500">Sous-total</span>
                          <span>{cartTotal.toFixed(2)} TND</span>
                        </div>
                        {deliveryFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Frais de livraison</span>
                            <span>{deliveryFee.toFixed(2)} TND</span>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total a payer</span>
                          <span className="text-amber-600">{orderTotal.toFixed(2)} TND</span>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setCheckoutStep("info")}
                          >
                            Retour
                          </Button>
                          <Button
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-12"
                            onClick={handleSubmitOrder}
                          >
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            Confirmer ({orderTotal.toFixed(2)} TND)
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs Menu / Historique */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "menu" ? "default" : "outline"}
            className={`rounded-full gap-2 ${activeTab === "menu" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
            onClick={() => setActiveTab("menu")}
          >
            <UtensilsCrossedIcon className="h-4 w-4" />
            Menu
          </Button>
          {isAuthenticated && (
            <Button
              variant={activeTab === "history" ? "default" : "outline"}
              className={`rounded-full gap-2 ${activeTab === "history" ? "bg-amber-500 hover:bg-amber-600" : ""}`}
              onClick={() => setActiveTab("history")}
            >
              <HistoryIcon className="h-4 w-4" />
              Mes commandes
              {clientOrders.length > 0 && (
                <Badge className="ml-1 bg-white/20 text-inherit">{clientOrders.length}</Badge>
              )}
            </Button>
          )}
        </div>

        {activeTab === "menu" && (
          <>
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl border-stone-200 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
            </div>

            {/* Categories with icons */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                className={`rounded-full shrink-0 gap-2 ${selectedCategory === "all" ? "bg-amber-500 hover:bg-amber-600" : "border-stone-200 hover:border-amber-300 hover:bg-amber-50"}`}
                onClick={() => setSelectedCategory("all")}
              >
                <SparklesIcon className="h-4 w-4" />
                Tout voir
              </Button>
              {menuCategories.map(category => {
                const getCategoryIcon = (slug: string) => {
                  switch(slug) {
                    case "viennoiseries": return <CroissantIcon className="h-4 w-4" />
                    case "petit-dejeuner": return <CoffeeIcon className="h-4 w-4" />
                    case "patisseries": return <CakeIcon className="h-4 w-4" />
                    default: return <UtensilsCrossedIcon className="h-4 w-4" />
                  }
                }
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.slug ? "default" : "outline"}
                    className={`rounded-full shrink-0 gap-2 ${selectedCategory === category.slug ? "bg-amber-500 hover:bg-amber-600" : "border-stone-200 hover:border-amber-300 hover:bg-amber-50"}`}
                    onClick={() => setSelectedCategory(category.slug)}
                  >
                    {getCategoryIcon(category.slug)}
                    {category.name}
                  </Button>
                )
              })}
            </div>

            {/* Products Grid */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
                  <PackageIcon className="h-12 w-12 text-stone-400" />
                </div>
                <h3 className="font-semibold text-xl mb-2 text-stone-700">Aucun produit trouve</h3>
                <p className="text-stone-500 mb-6">Essayez avec d&apos;autres termes de recherche</p>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
                  Reinitialiser les filtres
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredItems.map(item => renderProductCard(item))}
              </div>
            )}
          </>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            {clientOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
                  <HistoryIcon className="h-12 w-12 text-stone-400" />
                </div>
                <h3 className="font-semibold text-xl mb-2 text-stone-700">Aucune commande</h3>
                <p className="text-stone-500 mb-6">Vos commandes passees apparaitront ici</p>
                <Button className="bg-amber-500 hover:bg-amber-600" onClick={() => setActiveTab("menu")}>
                  Voir le menu
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-stone-700">Historique des commandes</h2>
                  <Badge variant="outline">{clientOrders.length} commande{clientOrders.length > 1 ? "s" : ""}</Badge>
                </div>
                
                {clientOrders
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map(order => {
                    const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
                      new: { label: "Nouvelle", color: "text-blue-700", bgColor: "bg-blue-100" },
                      confirmed: { label: "Confirmee", color: "text-purple-700", bgColor: "bg-purple-100" },
                      preparing: { label: "En preparation", color: "text-amber-700", bgColor: "bg-amber-100" },
                      ready: { label: "Prete", color: "text-emerald-700", bgColor: "bg-emerald-100" },
                      delivering: { label: "En livraison", color: "text-cyan-700", bgColor: "bg-cyan-100" },
                      completed: { label: "Terminee", color: "text-stone-600", bgColor: "bg-stone-100" },
                      cancelled: { label: "Annulee", color: "text-red-700", bgColor: "bg-red-100" },
                    }
                    const status = statusConfig[order.status] || statusConfig.new
                    
                    return (
                      <Card key={order.id} className="overflow-hidden">
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`h-12 w-12 rounded-xl ${order.deliveryMode === "delivery" ? "bg-blue-100" : "bg-emerald-100"} flex items-center justify-center`}>
                                {order.deliveryMode === "delivery" ? (
                                  <TruckIcon className={`h-6 w-6 ${order.deliveryMode === "delivery" ? "text-blue-600" : "text-emerald-600"}`} />
                                ) : (
                                  <StoreIcon className="h-6 w-6 text-emerald-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-stone-900">{order.orderNumber}</p>
                                <p className="text-sm text-stone-500">
                                  {new Date(order.createdAt).toLocaleDateString("fr-TN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </p>
                              </div>
                            </div>
                            <Badge className={`${status.bgColor} ${status.color} border-0`}>
                              {status.label}
                            </Badge>
                          </div>
                          
                          <div className="bg-stone-50 rounded-lg p-3 mb-3">
                            <p className="text-sm text-stone-600">
                              {order.items.map(item => `${item.quantity}x ${item.name}`).join(", ")}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-lg text-amber-600">{order.total.toFixed(2)} TND</span>
                              {order.totalPoints > 0 && order.status === "completed" && (
                                <Badge className="bg-emerald-100 text-emerald-700 border-0">
                                  <CoinsIcon className="h-3 w-3 mr-1" />
                                  +{order.totalPoints} pts
                                </Badge>
                              )}
                            </div>
                            <span className="text-sm text-stone-500">
                              {order.deliveryMode === "delivery" ? "Livraison" : "Retrait"}
                            </span>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
              </>
            )}
          </div>
        )}
      </main>

      {/* Floating Cart Button (Mobile) */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 sm:hidden z-50">
          <Button
            className="w-full h-14 bg-amber-500 hover:bg-amber-600 shadow-lg rounded-2xl"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCartIcon className="h-5 w-5 mr-2" />
            <span className="flex-1 text-left">Voir le panier ({cartItemsCount})</span>
            <span className="font-bold">{cartTotal.toFixed(2)} TND</span>
          </Button>
        </div>
      )}

      {/* Order Success Dialog */}
      <Dialog open={orderSuccess} onOpenChange={setOrderSuccess}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl">Commande envoyee!</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>Votre commande <span className="font-semibold">{lastOrder?.orderNumber}</span> a ete recue.</p>
              <p className="flex items-center justify-center gap-2 text-amber-600">
                <ClockIcon className="h-4 w-4" />
                Temps estime: ~{lastOrder?.estimatedTime} min
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600"
              onClick={() => {
                setOrderSuccess(false)
                if (isAuthenticated) {
                  router.push("/client/fidelite")
                }
              }}
            >
              {isAuthenticated ? "Voir mes commandes" : "Fermer"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setOrderSuccess(false)}
            >
              Continuer mes achats
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Prompt for non-authenticated users */}
      {!isAuthenticated && cart.length > 0 && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-40">
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <CoinsIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-stone-900">Gagnez des points!</p>
                <p className="text-xs text-stone-600 mb-2">Connectez-vous pour cumuler {cartTotalPoints} points avec cette commande</p>
                <Button
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-xs h-8"
                  onClick={() => router.push("/client/login")}
                >
                  Se connecter
                </Button>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 shrink-0"
                onClick={(e) => {
                  e.currentTarget.closest(".fixed")?.remove()
                }}
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

export default function OrderPage() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <LoyaltyProvider>
          <StockProvider>
            <OrdersProvider>
              <OrderPageContent />
            </OrdersProvider>
          </StockProvider>
        </LoyaltyProvider>
        <NotificationContainer />
      </AuthProvider>
    </NotificationProvider>
  )
}
