"use client"

import { useCallback, useRef, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { StockProvider, useStock } from "@/contexts/stock-context"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { BreakfastProvider, useBreakfast } from "@/contexts/breakfast-context"
import { LoyaltyProvider, useLoyalty } from "@/contexts/loyalty-context"
import { LoyaltyCardsProvider } from "@/contexts/loyalty-cards-context"
import { UnifiedSalesProvider } from "@/contexts/unified-sales-context"
import { ProductionProvider, useProduction } from "@/contexts/production-context"
import { DiscountProvider, useDiscount } from "@/contexts/discount-context"
import { OrdersProvider } from "@/contexts/orders-context"
import { NotificationContainer } from "@/components/notification-container"
import { NotificationIcon } from "@/components/notification-icon"
import { Button } from "@/components/ui/button"
import { 
  ChefHatIcon, 
  PlusIcon, 
  LogOutIcon, 
  AwardIcon, 
  ShoppingCartIcon, 
  UserIcon,
  SearchIcon,
  StarIcon,
  SparklesIcon,
  HeartIcon,
  XIcon,
  FilterIcon,
  TagIcon,
  FlameIcon,
  GiftIcon,
  PercentIcon,
  CheckIcon,
  CoffeeIcon,
  MinusIcon,
  SendIcon,
  UtensilsIcon,
  CroissantIcon,
  GlassWaterIcon,
  CakeIcon,
  EggIcon,
  CrownIcon,
  IceCreamIcon,
  LeafIcon,
  InfoIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CoinsIcon,
  UserCircleIcon,
  SettingsIcon,
  ShoppingBagIcon
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { MenuItem, Supplement } from "@/contexts/stock-context"
import { LoyaltyBadge } from "@/components/loyalty-badge"
import { CartDialog } from "@/components/cart-dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BreakfastWizard, type BreakfastWizardHandle } from "@/components/breakfast-wizard"
import { PatisserieMenu, type PatisserieMenuHandle } from "@/components/patisserie-menu"
import Image from "next/image"

// Icon mapping for breakfast categories
const categoryIcons: Record<string, React.ReactNode> = {
  "star": <StarIcon className="h-4 w-4" />,
  "coffee": <CoffeeIcon className="h-4 w-4" />,
  "glass-water": <GlassWaterIcon className="h-4 w-4" />,
  "croissant": <CroissantIcon className="h-4 w-4" />,
  "cake": <CakeIcon className="h-4 w-4" />,
  "egg": <EggIcon className="h-4 w-4" />,
  "crown": <CrownIcon className="h-4 w-4" />,
  "ice-cream": <IceCreamIcon className="h-4 w-4" />,
}

function MenuContent() {
  const { menuItems, menuCategories, supplements, getSupplementsForProduct } = useStock()
  const { user, logout, isAuthenticated } = useAuth()
  const { getClientByEmail } = useLoyalty()
  const { 
    categories: breakfastCategories, 
    items: breakfastItems, 
    getItemsByCategory,
    baseFormulas,
    selectedFormula,
    selectFormula,
    getFormulaPrice,
    getFormulaPoints,
    cart: breakfastCart,
    addToCart: addToBreakfastCart,
    removeFromCart: removeFromBreakfastCart,
    updateQuantity: updateBreakfastQuantity,
    clearCart: clearBreakfastCart,
    cartTotal: breakfastCartTotal,
    cartTotalPoints: breakfastCartPoints,
    cartItemsCount: breakfastCartCount,
    createOrder
  } = useBreakfast()
  
  // Get production context for stock availability
  const { checkRecipeAvailability, getAvailableRecipes, recipes } = useProduction()
  
  // Get discount context for progressive discounts
  const discountContext = useDiscount()
  
  // Calculate smart discount for breakfast cart
  const breakfastDiscount = useMemo(() => {
    const subtotal = breakfastCartTotal + getFormulaPrice()
    const itemCount = breakfastCartCount + (selectedFormula ? 1 : 0)
    return discountContext.calculateDiscount(subtotal, itemCount)
  }, [breakfastCartTotal, breakfastCartCount, selectedFormula, getFormulaPrice, discountContext])
  
  // Final total after discount
  const breakfastFinalTotal = useMemo(() => {
    const subtotal = breakfastCartTotal + getFormulaPrice()
    return Math.round((subtotal - breakfastDiscount.discountAmount) * 100) / 100
  }, [breakfastCartTotal, getFormulaPrice, breakfastDiscount.discountAmount])
  
  // Get loyalty client data for authenticated users
  const loyaltyClient = user?.role === "client" && user?.email ? getClientByEmail(user.email) : null
  const clientPoints = loyaltyClient?.loyaltyPoints ?? 0
  
  const router = useRouter()
  const [menuMode, setMenuMode] = useState<"patisserie" | "petit-dejeuner">("patisserie")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedBreakfastCategory, setSelectedBreakfastCategory] = useState<string | null>(null)
  const [cart, setCart] = useState<Array<{ item: any; quantity: number }>>([])
  const [showCart, setShowCart] = useState(false)
  const [showBreakfastCart, setShowBreakfastCart] = useState(false)
  const [showLoyalty, setShowLoyalty] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [favorites, setFavorites] = useState<string[]>([])
  const [supplementDialog, setSupplementDialog] = useState<{ open: boolean; item: MenuItem | null; availableSupplements?: Supplement[] }>({ open: false, item: null })
  const [selectedSupplements, setSelectedSupplements] = useState<Supplement[]>([])
  const [orderSent, setOrderSent] = useState(false)
  const [customerNote, setCustomerNote] = useState("")
  const patisserieMenuRef = useRef<PatisserieMenuHandle>(null)
  const breakfastWizardRef = useRef<BreakfastWizardHandle>(null)
  const [patisserieCartSummary, setPatisserieCartSummary] = useState({ cartItemsCount: 0, finalTotal: 0 })

  const isAdmin = user?.role === "admin"

  const handlePatisserieCartSummaryChange = useCallback((summary: { cartItemsCount: number; finalTotal: number }) => {
    setPatisserieCartSummary((previous) => {
      if (
        previous.cartItemsCount === summary.cartItemsCount &&
        previous.finalTotal === summary.finalTotal
      ) {
        return previous
      }

      return summary
    })
  }, [])

  const handleLogout = () => {
    logout()
    window.location.reload()
  }

  const handleLogin = () => {
    router.push("/client/login")
  }

  const handleAddToCart = (item: MenuItem) => {
    // Check for new availableSupplements system first, then legacy supplements
    const productSupplements = item.availableSupplements 
      ? getSupplementsForProduct(item.availableSupplements)
      : (item.supplements || [])
    
    if (productSupplements.length > 0) {
      setSupplementDialog({ open: true, item, availableSupplements: productSupplements })
      setSelectedSupplements([])
    } else {
      addToCartDirect(item, [])
    }
  }

  const addToCartDirect = (item: MenuItem, supplements: Supplement[]) => {
    const supplementsTotal = supplements.reduce((sum, s) => sum + s.price, 0)
    const itemWithSupplements = {
      ...item,
      finalPrice: item.price + supplementsTotal,
      selectedSupplements: supplements
    }
    
    setCart((prev) => {
      // Create a unique key based on item id and supplements
      const supplementKey = supplements.map(s => s.id).sort().join('-')
      const uniqueKey = `${item.id}-${supplementKey}`
      
      const existing = prev.find((i) => {
        const existingKey = `${i.item.id}-${(i.item.selectedSupplements || []).map((s: Supplement) => s.id).sort().join('-')}`
        return existingKey === uniqueKey
      })
      
      if (existing) {
        return prev.map((i) => {
          const iKey = `${i.item.id}-${(i.item.selectedSupplements || []).map((s: Supplement) => s.id).sort().join('-')}`
          return iKey === uniqueKey ? { ...i, quantity: i.quantity + 1 } : i
        })
      }
      return [...prev, { item: itemWithSupplements, quantity: 1 }]
    })
  }

  const confirmSupplementSelection = () => {
    if (supplementDialog.item) {
      addToCartDirect(supplementDialog.item, selectedSupplements)
      setSupplementDialog({ open: false, item: null })
      setSelectedSupplements([])
    }
  }

  const toggleSupplement = (supplement: Supplement) => {
    setSelectedSupplements(prev => {
      const exists = prev.find(s => s.id === supplement.id)
      if (exists) {
        return prev.filter(s => s.id !== supplement.id)
      }
      return [...prev, supplement]
    })
  }

  // Calculate promotional price
  const getPromoPrice = (item: MenuItem) => {
    if (!item.promotion) return item.price
    if (item.promotion.type === "percentage" && item.promotion.value) {
      return item.price * (1 - item.promotion.value / 100)
    }
    if (item.promotion.type === "fixed" && item.promotion.value) {
      return item.price - item.promotion.value
    }
    return item.price
  }

  const toggleFavorite = (itemId: string) => {
    setFavorites(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const activeCategories = menuCategories.filter((cat) => cat.isActive).sort((a, b) => a.order - b.order)

  // Get available recipes with stock
  const availableRecipes = useMemo(() => getAvailableRecipes(), [getAvailableRecipes])
  const availableRecipeIds = useMemo(() => new Set(availableRecipes.map(r => r.recipeId)), [availableRecipes])
  
  const filteredItems = useMemo(() => {
    let items = menuItems.filter((item) => {
      // Check if item is available
      if (!item.isAvailable) return false
      
      // If item has a recipeId, check if recipe has stock
      if (item.recipeId) {
        return availableRecipeIds.has(item.recipeId)
      }
      
      // If no recipeId, show item (assuming it's always available)
      return true
    })
    
    if (selectedCategory) {
      items = items.filter((item) => item.category === selectedCategory)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      items = items.filter((item) => 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      )
    }
    
    return items
  }, [menuItems, selectedCategory, searchQuery, availableRecipeIds])

  const cartTotal = cart.reduce((sum, { item, quantity }) => sum + quantity, 0)
  const cartValue = cart.reduce((sum, { item, quantity }) => sum + (item.price * quantity), 0)

  // Points calculation (example: 1 point per 1 TND spent)
  const calculatePoints = (price: number) => Math.floor(price)
  
// Breakfast order submission
  const handleSendBreakfastOrder = () => {
    if (breakfastCartCount === 0) return
    
    // Include client info if authenticated
    const clientInfo = user?.role === "client" ? {
      id: user.id,
      email: user.email,
      name: user.name
    } : undefined
    
    const order = createOrder(customerNote, clientInfo)
    if (order) {
      setOrderSent(true)
      setCustomerNote("")
      setTimeout(() => setOrderSent(false), 5000)
    }
  }
  
  // Get cart item quantity for breakfast
  const getBreakfastCartQuantity = (itemId: string) => {
    const cartItem = breakfastCart.find(c => c.item.id === itemId)
    return cartItem ? cartItem.quantity : 0
  }
  
  // Active breakfast categories
  const activeBreakfastCategories = breakfastCategories
    .filter(cat => cat.isActive)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header - Affiché pour les deux modes */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200">
        <div className="container mx-auto px-4">
          {/* Top bar */}
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <ChefHatIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-stone-900">Le Pave d&apos;Art</h1>
                <p className="text-xs text-stone-500">Patisserie Artisanale</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Points badge - only show for authenticated clients */}
              {isAuthenticated && user?.role === "client" && (
                <button
                  onClick={() => router.push("/client/fidelite")}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full bg-amber-100 border border-amber-200 hover:bg-amber-200 transition-colors"
                >
                  <StarIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-amber-700 text-sm sm:text-base">{clientPoints}</span>
                </button>
              )}

              {isAuthenticated && <NotificationIcon />}

              {menuMode === "patisserie" && (
                <Button
                  onClick={() => patisserieMenuRef.current?.openCartSummary()}
                  className="relative h-8 sm:h-10 px-2 sm:px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm"
                >
                  <ShoppingCartIcon className="h-3.5 sm:h-5 w-3.5 sm:w-5 sm:mr-2" />
                  <span>{patisserieCartSummary.cartItemsCount}</span>
                  {patisserieCartSummary.cartItemsCount > 0 && (
                    <span className="ml-2 hidden font-semibold sm:inline">
                      {patisserieCartSummary.finalTotal.toFixed(2)} TND
                    </span>
                  )}
                </Button>
              )}

              {menuMode === "petit-dejeuner" && (
                <Button
                  onClick={() => breakfastWizardRef.current?.openCartSummary()}
                  className="relative h-8 sm:h-10 px-2 sm:px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs sm:text-sm"
                >
                  <ShoppingCartIcon className="h-3.5 sm:h-5 w-3.5 sm:w-5 sm:mr-2" />
                  <span>{breakfastCartCount + (selectedFormula ? 1 : 0)}</span>
                  {(breakfastCartCount > 0 || selectedFormula) && (
                    <span className="ml-2 hidden font-semibold sm:inline">
                      {breakfastFinalTotal.toFixed(2)} TND
                    </span>
                  )}
                </Button>
              )}
              
              {/* Commander a distance button */}
              {isAuthenticated && ( <Button
                size="sm"
                onClick={() => router.push("/commander")}
                className="h-8 sm:h-10 px-2 sm:px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl shadow-lg shadow-amber-500/20 text-xs sm:text-sm"
              >
                <ShoppingBagIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4 sm:mr-2" />
                <span className="hidden sm:inline">Commander</span>
              </Button>
            )}
              
              {isAdmin ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/admin")}
                    className="h-8 sm:h-10 px-2 sm:px-4 border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl text-xs sm:text-sm"
                  >
                    <SettingsIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-8 sm:h-10 w-8 sm:w-10 hover:bg-stone-100"
                  >
                    <LogOutIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-stone-500" />
                  </Button>
                </>
              ) : isAuthenticated && user?.role === "client" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/client/fidelite")}
                    className="h-8 sm:h-10 px-2 sm:px-4 border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl text-xs sm:text-sm"
                  >
                    <UserCircleIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Mon Compte</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-8 sm:h-10 w-8 sm:w-10 hover:bg-stone-100"
                  >
                    <LogOutIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-stone-500" />
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={handleLogin}
                  className="h-10 px-4 bg-stone-900 hover:bg-stone-800 text-white rounded-xl"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Connexion
                </Button>
              )}
            </div>
          </div>

          {/* Menu Mode Tabs */}
          <div className="flex gap-2 pb-3">
            <button
              onClick={() => setMenuMode("patisserie")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                menuMode === "patisserie"
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <ChefHatIcon className="h-4 w-4" />
              Patisserie
            </button>
            <button
              onClick={() => setMenuMode("petit-dejeuner")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
                menuMode === "petit-dejeuner"
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              <CoffeeIcon className="h-4 w-4" />
              Petit Dejeuner
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main>
        {/* Patisserie Mode Content - Uses PatisserieMenu component */}
        {menuMode === "patisserie" && (
          <PatisserieMenu
            ref={patisserieMenuRef}
            onCartSummaryChange={handlePatisserieCartSummaryChange}
          />
        )}
        
        {/* Petit Dejeuner Mode Content - Wizard */}
        {menuMode === "petit-dejeuner" && (
          <BreakfastWizard ref={breakfastWizardRef} onClose={() => setMenuMode("patisserie")} />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-stone-200 bg-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <ChefHatIcon className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-stone-900">Le Pave d&apos;Art</span>
          </div>
          <p className="text-sm text-stone-500">Patisserie Artisanale - Tous nos produits sont faits maison</p>
        </div>
      </footer>

      {isAuthenticated && user && <LoyaltyBadge open={showLoyalty} onClose={() => setShowLoyalty(false)} />}
      <CartDialog open={showCart} onClose={() => setShowCart(false)} cart={cart} setCart={setCart} />

      {/* Supplements Dialog */}
      <Dialog open={supplementDialog.open} onOpenChange={(open) => !open && setSupplementDialog({ open: false, item: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusIcon className="h-5 w-5 text-amber-600" />
              Personnalisez votre commande
            </DialogTitle>
          </DialogHeader>
          
          {supplementDialog.item && (
            <div className="space-y-4">
              {/* Item info */}
              <div className="flex gap-3 p-3 bg-stone-50 rounded-xl">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-stone-200 shrink-0">
                  <img 
                    src={supplementDialog.item.image || "/placeholder.svg"} 
                    alt={supplementDialog.item.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-stone-900">{supplementDialog.item.name}</h4>
                  <p className="text-sm text-stone-500">Prix de base: {getPromoPrice(supplementDialog.item).toFixed(2)} TND</p>
                </div>
              </div>

              {/* Supplements list */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-stone-700">Choisissez vos supplements:</p>
                {(supplementDialog.availableSupplements || []).map((supplement) => {
                  const isSelected = selectedSupplements.find(s => s.id === supplement.id)
                  return (
                    <button
                      key={supplement.id}
                      onClick={() => toggleSupplement(supplement)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                        isSelected 
                          ? "border-amber-500 bg-amber-50" 
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? "border-amber-500 bg-amber-500" : "border-stone-300"
                        }`}>
                          {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                        </div>
                        <span className="font-medium text-stone-900">{supplement.name}</span>
                      </div>
                      <span className="font-semibold text-amber-600">+{supplement.price.toFixed(2)} TND</span>
                    </button>
                  )
                })}
              </div>

              {/* Total and confirm */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-stone-600">Total:</span>
                  <span className="text-2xl font-bold text-stone-900">
                    {(getPromoPrice(supplementDialog.item) + selectedSupplements.reduce((sum, s) => sum + s.price, 0)).toFixed(2)} TND
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      addToCartDirect(supplementDialog.item!, [])
                      setSupplementDialog({ open: false, item: null })
                    }}
                  >
                    Sans supplement
                  </Button>
                  <Button 
                    className="flex-1 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    onClick={confirmSupplementSelection}
                  >
                    Ajouter au panier
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function MenuPage() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <LoyaltyProvider>
          <StockProvider>
            <ProductionProvider>
              <BreakfastProvider>
                <UnifiedSalesProvider>
                  <DiscountProvider>
                    <OrdersProvider>
                      <LoyaltyCardsProvider>
                        <MenuContent />
                      </LoyaltyCardsProvider>
                    </OrdersProvider>
                  </DiscountProvider>
                </UnifiedSalesProvider>
              </BreakfastProvider>
            </ProductionProvider>
          </StockProvider>
        </LoyaltyProvider>
        <NotificationContainer />
      </AuthProvider>
    </NotificationProvider>
  )
}
