"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useStock } from "./stock-context"

// ============================================
// PRODUCTION FLOW: Recipe > Production Order > Showcase Stock > Sale
// ============================================

// Recipe / Fiche Technique
export interface RecipeIngredient {
  productId: string // Reference to stock Product
  quantity: number
  unit: string
}

export interface Recipe {
  id: string
  name: string
  description?: string
  categoryId: string // Recipe category (patisserie, viennoiserie, etc.)
  ingredients: RecipeIngredient[]
  yield: number // Number of units produced
  yieldUnit: string // "pieces", "kg", etc.
  preparationTime: number // minutes
  cookingTime: number // minutes
  shelfLife: number // hours after production
  sellingPrice: number // TND
  image?: string
  instructions?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface RecipeCategory {
  id: string
  name: string
  icon: string
  color: string
  isActive: boolean
}

// Showcase / Vitrine
export interface Showcase {
  id: string
  name: string
  type: "refrigerated" | "ambient" | "frozen" | "heated"
  temperature?: string
  capacity?: number
  location: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Production Order
export interface ProductionOrder {
  id: string
  recipeId: string
  showcaseId: string // Target showcase
  quantity: number // Number of batches to produce
  scheduledDate: string
  scheduledTime?: string
  status: "planned" | "in-progress" | "completed" | "cancelled"
  producedBy?: string // Employee ID
  startedAt?: string
  completedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// Showcase Stock Item (Finished Product)
export interface ShowcaseItem {
  id: string
  recipeId: string
  productionOrderId: string
  showcaseId: string
  batchNumber: string
  quantity: number // Current quantity available
  initialQuantity: number
  productionDate: string
  productionTime: string
  expirationDate: string
  expirationTime: string
  unitCost: number // Calculated from ingredients
  sellingPrice: number
  status: "available" | "low" | "expired" | "sold-out"
  createdAt: string
  updatedAt: string
}

// Sale Transaction
export interface SaleItem {
  showcaseItemId: string
  recipeId: string
  recipeName: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Sale {
  id: string
  items: SaleItem[]
  subtotal: number
  discount: number
  discountType: "percentage" | "fixed"
  total: number
  paymentMethod: "cash" | "card" | "mobile" | "wallet"
  customerId?: string // For loyalty
  pointsEarned?: number
  pointsUsed?: number
  cashierId: string
  showcaseId?: string
  createdAt: string
}

// Context Interface
interface ProductionContextType {
  // Recipe Categories
  recipeCategories: RecipeCategory[]
  addRecipeCategory: (cat: Omit<RecipeCategory, "id">) => void
  updateRecipeCategory: (id: string, cat: Partial<RecipeCategory>) => void
  deleteRecipeCategory: (id: string) => void
  
  // Recipes
  recipes: Recipe[]
  addRecipe: (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => void
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void
  deleteRecipe: (id: string) => void
  getRecipeCost: (recipeId: string) => number
  getRecipeMargin: (recipeId: string) => number
  getSuggestedPrice: (recipeId: string, targetMargin: number) => number
  getRecipeTotalIngredientCost: (recipeId: string) => number
  
  // Showcases
  showcases: Showcase[]
  addShowcase: (showcase: Omit<Showcase, "id" | "createdAt" | "updatedAt">) => void
  updateShowcase: (id: string, showcase: Partial<Showcase>) => void
  deleteShowcase: (id: string) => void
  
  // Production Orders
  productionOrders: ProductionOrder[]
  addProductionOrder: (order: Omit<ProductionOrder, "id" | "createdAt" | "updatedAt">) => void
  updateProductionOrder: (id: string, order: Partial<ProductionOrder>) => void
  deleteProductionOrder: (id: string) => void
  startProduction: (orderId: string, employeeId: string) => boolean
  completeProduction: (orderId: string) => boolean
  cancelProduction: (orderId: string) => void
  checkIngredientAvailability: (recipeId: string, quantity: number) => { available: boolean; missing: { productId: string; needed: number; available: number }[] }
  
  // Showcase Stock
  showcaseItems: ShowcaseItem[]
  addShowcaseItem: (item: Omit<ShowcaseItem, "id" | "createdAt" | "updatedAt">) => void
  updateShowcaseItem: (id: string, item: Partial<ShowcaseItem>) => void
  deleteShowcaseItem: (id: string) => void
  getShowcaseStock: (showcaseId: string) => ShowcaseItem[]
  getAvailableItems: (showcaseId?: string) => ShowcaseItem[]
  getExpiringItems: (hours?: number) => ShowcaseItem[]
  getLowStockItems: () => ShowcaseItem[]
  transferItem: (itemId: string, targetShowcaseId: string, quantity: number) => void
  
  // Stock Management for Sales
  decrementShowcaseStock: (recipeId: string, quantity: number) => boolean // Returns true if successful
  checkRecipeAvailability: (recipeId: string, quantity?: number) => { available: boolean; stock: number }
  getAvailableRecipes: () => { recipeId: string; recipe: Recipe; stock: number }[] // Only recipes with stock > 0
  
  // Sales
  sales: Sale[]
  addSale: (sale: Omit<Sale, "id" | "createdAt">) => void
  processSale: (items: { showcaseItemId: string; quantity: number }[], paymentMethod: Sale["paymentMethod"], customerId?: string, discount?: number, discountType?: "percentage" | "fixed", pointsUsed?: number) => Sale | null
  getTodaySales: () => Sale[]
  getSalesStats: (startDate?: string, endDate?: string) => { totalSales: number; totalRevenue: number; averageTicket: number; topProducts: { recipeId: string; recipeName: string; quantity: number; revenue: number }[] }
}

const ProductionContext = createContext<ProductionContextType | undefined>(undefined)

// Initial Data
const initialRecipeCategories: RecipeCategory[] = [
  { id: "rcat-1", name: "Patisseries", icon: "🎂", color: "bg-pink-100 text-pink-800", isActive: true },
  { id: "rcat-2", name: "Viennoiseries", icon: "🥐", color: "bg-amber-100 text-amber-800", isActive: true },
  { id: "rcat-3", name: "Boulangerie", icon: "🥖", color: "bg-yellow-100 text-yellow-800", isActive: true },
  { id: "rcat-4", name: "Boissons", icon: "☕", color: "bg-brown-100 text-stone-800", isActive: true },
  { id: "rcat-5", name: "Snacks Sales", icon: "🥪", color: "bg-green-100 text-green-800", isActive: true },
]

const initialShowcases: Showcase[] = [
  { id: "show-1", name: "Vitrine Patisserie", type: "refrigerated", temperature: "4-6°C", capacity: 50, location: "Entree principale", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "show-2", name: "Vitrine Viennoiseries", type: "ambient", temperature: "Ambiante", capacity: 80, location: "Comptoir central", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "show-3", name: "Comptoir Cafe", type: "heated", temperature: "Chaud", capacity: 30, location: "Zone cafe", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "show-4", name: "Congelateur Vente", type: "frozen", temperature: "-18°C", capacity: 40, location: "Arriere boutique", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

// Initial showcase items (products available in the menu)
const getInitialShowcaseItems = (): ShowcaseItem[] => {
  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]
  const timeStr = now.toTimeString().split(" ")[0].substring(0, 5)
  
  // Expiration in 24 hours
  const expDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const expDateStr = expDate.toISOString().split("T")[0]
  const expTimeStr = expDate.toTimeString().split(" ")[0].substring(0, 5)
  
  return [
    // Viennoiseries (show-2)
    {
      id: "si-1",
      recipeId: "rec-1",
      productionOrderId: "po-init-1",
      showcaseId: "show-2",
      batchNumber: "VIE-001",
      quantity: 24,
      initialQuantity: 30,
      productionDate: todayStr,
      productionTime: "06:00",
      expirationDate: expDateStr,
      expirationTime: expTimeStr,
      unitCost: 0.8,
      sellingPrice: 2.5,
      status: "available" as const,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "si-2",
      recipeId: "rec-2",
      productionOrderId: "po-init-2",
      showcaseId: "show-2",
      batchNumber: "VIE-002",
      quantity: 18,
      initialQuantity: 24,
      productionDate: todayStr,
      productionTime: "06:00",
      expirationDate: expDateStr,
      expirationTime: expTimeStr,
      unitCost: 1.1,
      sellingPrice: 3.0,
      status: "available" as const,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    // Patisseries (show-1)
    {
      id: "si-3",
      recipeId: "rec-3",
      productionOrderId: "po-init-3",
      showcaseId: "show-1",
      batchNumber: "PAT-001",
      quantity: 3,
      initialQuantity: 4,
      productionDate: todayStr,
      productionTime: "07:00",
      expirationDate: expDateStr,
      expirationTime: expTimeStr,
      unitCost: 8.5,
      sellingPrice: 25.0,
      status: "available" as const,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "si-4",
      recipeId: "rec-4",
      productionOrderId: "po-init-4",
      showcaseId: "show-1",
      batchNumber: "PAT-002",
      quantity: 8,
      initialQuantity: 12,
      productionDate: todayStr,
      productionTime: "07:30",
      expirationDate: expDateStr,
      expirationTime: expTimeStr,
      unitCost: 2.2,
      sellingPrice: 5.0,
      status: "available" as const,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "si-5",
      recipeId: "rec-5",
      productionOrderId: "po-init-5",
      showcaseId: "show-1",
      batchNumber: "PAT-003",
      quantity: 6,
      initialQuantity: 8,
      productionDate: todayStr,
      productionTime: "08:00",
      expirationDate: expDateStr,
      expirationTime: expTimeStr,
      unitCost: 1.8,
      sellingPrice: 4.5,
      status: "available" as const,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: "si-6",
      recipeId: "rec-6",
      productionOrderId: "po-init-6",
      showcaseId: "show-2",
      batchNumber: "VIE-003",
      quantity: 15,
      initialQuantity: 20,
      productionDate: todayStr,
      productionTime: "06:30",
      expirationDate: expDateStr,
      expirationTime: expTimeStr,
      unitCost: 0.6,
      sellingPrice: 2.0,
      status: "available" as const,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ]
}

const initialRecipes: Recipe[] = [
{
    id: "rec-1",
    name: "Croissant Beurre",
    description: "Croissant traditionnel au beurre",
    categoryId: "rcat-2",
    ingredients: [
      { productId: "prod-11", quantity: 0.5, unit: "kg" },
      { productId: "prod-12", quantity: 0.1, unit: "L" },
    ],
    yield: 12,
    yieldUnit: "pieces",
    preparationTime: 30,
    cookingTime: 18,
    shelfLife: 24,
    sellingPrice: 2.5,
    isActive: true,
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rec-2",
    name: "Pain au Chocolat",
    description: "Viennoiserie au chocolat noir",
    categoryId: "rcat-2",
    ingredients: [
      { productId: "prod-11", quantity: 0.5, unit: "kg" },
      { productId: "prod-2", quantity: 0.24, unit: "kg" },
    ],
    yield: 12,
    yieldUnit: "pieces",
    preparationTime: 30,
    cookingTime: 18,
    shelfLife: 24,
    sellingPrice: 3.0,
    isActive: true,
    image: "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=400&h=300&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rec-3",
    name: "Tarte aux Fraises",
    description: "Tarte sable aux fraises fraiches",
    categoryId: "rcat-1",
    ingredients: [
      { productId: "prod-11", quantity: 0.25, unit: "kg" },
      { productId: "prod-12", quantity: 0.3, unit: "L" },
      { productId: "prod-5", quantity: 0.02, unit: "L" },
    ],
    yield: 1,
    yieldUnit: "pieces",
    preparationTime: 45,
    cookingTime: 25,
    shelfLife: 48,
    sellingPrice: 25.0,
    isActive: true,
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rec-4",
    name: "Eclair Cafe",
    description: "Eclair garni de creme au cafe",
    categoryId: "rcat-1",
    ingredients: [
      { productId: "prod-11", quantity: 0.15, unit: "kg" },
      { productId: "prod-12", quantity: 0.5, unit: "L" },
      { productId: "prod-7", quantity: 0.05, unit: "kg" },
      { productId: "prod-2", quantity: 0.1, unit: "kg" },
    ],
    yield: 10,
    yieldUnit: "pieces",
    preparationTime: 40,
    cookingTime: 30,
    shelfLife: 24,
    sellingPrice: 5.0,
    isActive: true,
    image: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=400&h=300&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rec-5",
    name: "Mille-Feuille",
    description: "Feuilletage croustillant et creme patissiere",
    categoryId: "rcat-1",
    ingredients: [
      { productId: "prod-11", quantity: 0.2, unit: "kg" }, // Beurre
      { productId: "prod-12", quantity: 0.3, unit: "L" },  // Creme
      { productId: "prod-5", quantity: 0.01, unit: "L" },  // Vanille
    ],
    yield: 8,
    yieldUnit: "pieces",
    preparationTime: 60,
    cookingTime: 25,
    shelfLife: 24,
    sellingPrice: 4.5,
    isActive: true,
    image: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=400&h=300&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rec-6",
    name: "Chausson aux Pommes",
    description: "Feuillete fourre aux pommes caramelisees",
    categoryId: "rcat-2",
    ingredients: [
      { productId: "prod-11", quantity: 0.25, unit: "kg" }, // Beurre
    ],
    yield: 12,
    yieldUnit: "pieces",
    preparationTime: 30,
    cookingTime: 20,
    shelfLife: 24,
    sellingPrice: 2.0,
    isActive: true,
    image: "https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400&h=300&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rec-7",
    name: "Macaron Chocolat",
    description: "Macaron au chocolat noir intense",
    categoryId: "rcat-1",
    ingredients: [
      { productId: "prod-2", quantity: 0.15, unit: "kg" }, // Chocolat
      { productId: "prod-12", quantity: 0.2, unit: "L" },  // Creme
    ],
    yield: 20,
    yieldUnit: "pieces",
    preparationTime: 45,
    cookingTime: 15,
    shelfLife: 72,
    sellingPrice: 2.5,
    isActive: true,
    image: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400&h=300&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rec-8",
    name: "Paris-Brest",
    description: "Choux garni de creme pralinee",
    categoryId: "rcat-1",
    ingredients: [
      { productId: "prod-11", quantity: 0.2, unit: "kg" }, // Beurre
      { productId: "prod-12", quantity: 0.4, unit: "L" },  // Creme
    ],
    yield: 6,
    yieldUnit: "pieces",
    preparationTime: 50,
    cookingTime: 35,
    shelfLife: 24,
    sellingPrice: 6.0,
    isActive: true,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=300&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rec-9",
    name: "Brioche Nature",
    description: "Brioche moelleuse au beurre",
    categoryId: "rcat-2",
    ingredients: [
      { productId: "prod-11", quantity: 0.3, unit: "kg" }, // Beurre
    ],
    yield: 8,
    yieldUnit: "pieces",
    preparationTime: 120,
    cookingTime: 25,
    shelfLife: 48,
    sellingPrice: 3.5,
    isActive: true,
    image: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=400&h=300&fit=crop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "rec-10",
    name: "Cafe Expresso",
    description: "Cafe expresso classique",
    categoryId: "rcat-4",
    ingredients: [
      { productId: "prod-7", quantity: 0.008, unit: "kg" },
    ],
    yield: 1,
    yieldUnit: "pieces",
    preparationTime: 2,
    cookingTime: 0,
    shelfLife: 0,
    sellingPrice: 2.0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export function ProductionProvider({ children }: { children: ReactNode }) {
  const { products, batches, consumeFromBatches } = useStock()
  
  // State
  const [recipeCategories, setRecipeCategories] = useState<RecipeCategory[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [showcases, setShowcases] = useState<Showcase[]>([])
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([])
  const [showcaseItems, setShowcaseItems] = useState<ShowcaseItem[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  
  // Load from localStorage
  useEffect(() => {
    const stored = {
      recipeCategories: localStorage.getItem("recipe-categories"),
      recipes: localStorage.getItem("recipes"),
      showcases: localStorage.getItem("showcases"),
      productionOrders: localStorage.getItem("production-orders"),
      showcaseItems: localStorage.getItem("showcase-items"),
      sales: localStorage.getItem("sales"),
    }
    
    setRecipeCategories(stored.recipeCategories ? JSON.parse(stored.recipeCategories) : initialRecipeCategories)
    setRecipes(stored.recipes ? JSON.parse(stored.recipes) : initialRecipes)
    setShowcases(stored.showcases ? JSON.parse(stored.showcases) : initialShowcases)
    setProductionOrders(stored.productionOrders ? JSON.parse(stored.productionOrders) : [])
    setShowcaseItems(stored.showcaseItems ? JSON.parse(stored.showcaseItems) : getInitialShowcaseItems())
    setSales(stored.sales ? JSON.parse(stored.sales) : [])
  }, [])
  
  // Save to localStorage
  useEffect(() => { if (recipeCategories.length) localStorage.setItem("recipe-categories", JSON.stringify(recipeCategories)) }, [recipeCategories])
  useEffect(() => { if (recipes.length) localStorage.setItem("recipes", JSON.stringify(recipes)) }, [recipes])
  useEffect(() => { if (showcases.length) localStorage.setItem("showcases", JSON.stringify(showcases)) }, [showcases])
  useEffect(() => { localStorage.setItem("production-orders", JSON.stringify(productionOrders)) }, [productionOrders])
  useEffect(() => { localStorage.setItem("showcase-items", JSON.stringify(showcaseItems)) }, [showcaseItems])
  useEffect(() => { localStorage.setItem("sales", JSON.stringify(sales)) }, [sales])
  
  // ============================================
  // RECIPE CATEGORIES CRUD
  // ============================================
  
  const addRecipeCategory = (cat: Omit<RecipeCategory, "id">) => {
    const newCat: RecipeCategory = { ...cat, id: `rcat-${Date.now()}` }
    setRecipeCategories(prev => [...prev, newCat])
  }
  
  const updateRecipeCategory = (id: string, updates: Partial<RecipeCategory>) => {
    setRecipeCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat))
  }
  
  const deleteRecipeCategory = (id: string) => {
    setRecipeCategories(prev => prev.filter(cat => cat.id !== id))
  }
  
  // ============================================
  // RECIPES CRUD
  // ============================================
  
  const addRecipe = (recipe: Omit<Recipe, "id" | "createdAt" | "updatedAt">) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: `rec-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setRecipes(prev => [...prev, newRecipe])
  }
  
  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setRecipes(prev => prev.map(rec => 
      rec.id === id ? { ...rec, ...updates, updatedAt: new Date().toISOString() } : rec
    ))
  }
  
  const deleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(rec => rec.id !== id))
  }
  
  const getRecipeCost = (recipeId: string): number => {
    const recipe = recipes.find(r => r.id === recipeId)
    if (!recipe) return 0
    
    let totalCost = 0
    for (const ing of recipe.ingredients) {
      const product = products?.find(p => p.id === ing.productId)
      if (product) {
        totalCost += (product.unitPrice * ing.quantity)
      }
    }
    
    // Cost per unit
    return recipe.yield > 0 ? totalCost / recipe.yield : totalCost
  }
  
const getRecipeMargin = (recipeId: string): number => {
    const recipe = recipes.find(r => r.id === recipeId)
    if (!recipe) return 0
    
    const cost = getRecipeCost(recipeId)
    if (cost === 0) return 100
    
    return ((recipe.sellingPrice - cost) / recipe.sellingPrice) * 100
  }

  // Get total ingredient cost (before dividing by yield)
  const getRecipeTotalIngredientCost = (recipeId: string): number => {
    const recipe = recipes.find(r => r.id === recipeId)
    if (!recipe) return 0
    
    let totalCost = 0
    for (const ing of recipe.ingredients) {
      const product = products?.find(p => p.id === ing.productId)
      if (product) {
        totalCost += (product.unitPrice * ing.quantity)
      }
    }
    return totalCost
  }

  // Suggest a selling price based on target margin
  const getSuggestedPrice = (recipeId: string, targetMargin: number): number => {
    const cost = getRecipeCost(recipeId)
    if (cost === 0) return 0
    
    // Price = Cost / (1 - margin)
    // Example: cost=2, margin=50% => price = 2 / 0.5 = 4
    const price = cost / (1 - targetMargin / 100)
    
    // Round to nearest 0.5 TND for nice pricing
    return Math.ceil(price * 2) / 2
  }
  
  // ============================================
  // SHOWCASES CRUD
  // ============================================
  
  const addShowcase = (showcase: Omit<Showcase, "id" | "createdAt" | "updatedAt">) => {
    const newShowcase: Showcase = {
      ...showcase,
      id: `show-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setShowcases(prev => [...prev, newShowcase])
  }
  
  const updateShowcase = (id: string, updates: Partial<Showcase>) => {
    setShowcases(prev => prev.map(s => 
      s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
    ))
  }
  
  const deleteShowcase = (id: string) => {
    setShowcases(prev => prev.filter(s => s.id !== id))
  }
  
  // ============================================
  // PRODUCTION ORDERS CRUD
  // ============================================
  
  const addProductionOrder = (order: Omit<ProductionOrder, "id" | "createdAt" | "updatedAt">) => {
    const newOrder: ProductionOrder = {
      ...order,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setProductionOrders(prev => [...prev, newOrder])
  }
  
  const updateProductionOrder = (id: string, updates: Partial<ProductionOrder>) => {
    setProductionOrders(prev => prev.map(o => 
      o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
    ))
  }
  
  const deleteProductionOrder = (id: string) => {
    setProductionOrders(prev => prev.filter(o => o.id !== id))
  }
  
  const checkIngredientAvailability = (recipeId: string, quantity: number) => {
    const recipe = recipes.find(r => r.id === recipeId)
    if (!recipe) return { available: false, missing: [] }
    
    const missing: { productId: string; needed: number; available: number }[] = []
    
    for (const ing of recipe.ingredients) {
      const needed = ing.quantity * quantity
      const productBatches = batches?.filter(b => b.productId === ing.productId) || []
      const available = productBatches.reduce((sum, b) => sum + b.quantity, 0)
      
      if (available < needed) {
        missing.push({ productId: ing.productId, needed, available })
      }
    }
    
    return { available: missing.length === 0, missing }
  }
  
  const startProduction = (orderId: string, employeeId: string): boolean => {
    const order = productionOrders.find(o => o.id === orderId)
    if (!order || order.status !== "planned") return false
    
    const recipe = recipes.find(r => r.id === order.recipeId)
    if (!recipe) return false
    
    // Check availability
    const { available } = checkIngredientAvailability(recipe.id, order.quantity)
    if (!available) return false
    
    // Consume ingredients from stock (FIFO)
    for (const ing of recipe.ingredients) {
      const needed = ing.quantity * order.quantity
      consumeFromBatches?.(ing.productId, needed)
    }
    
    // Update order status
    updateProductionOrder(orderId, {
      status: "in-progress",
      producedBy: employeeId,
      startedAt: new Date().toISOString(),
    })
    
    return true
  }
  
  const completeProduction = (orderId: string): boolean => {
    const order = productionOrders.find(o => o.id === orderId)
    if (!order || order.status !== "in-progress") return false
    
    const recipe = recipes.find(r => r.id === order.recipeId)
    if (!recipe) return false
    
    const now = new Date()
    const expirationDate = new Date(now.getTime() + recipe.shelfLife * 60 * 60 * 1000)
    
    // Create showcase item
    const showcaseItem: ShowcaseItem = {
      id: `si-${Date.now()}`,
      recipeId: recipe.id,
      productionOrderId: orderId,
      showcaseId: order.showcaseId,
      batchNumber: `PROD-${Date.now().toString().slice(-8)}`,
      quantity: recipe.yield * order.quantity,
      initialQuantity: recipe.yield * order.quantity,
      productionDate: now.toISOString().split("T")[0],
      productionTime: now.toTimeString().slice(0, 5),
      expirationDate: expirationDate.toISOString().split("T")[0],
      expirationTime: expirationDate.toTimeString().slice(0, 5),
      unitCost: getRecipeCost(recipe.id),
      sellingPrice: recipe.sellingPrice,
      status: "available",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    
    setShowcaseItems(prev => [...prev, showcaseItem])
    
    // Update order
    updateProductionOrder(orderId, {
      status: "completed",
      completedAt: now.toISOString(),
    })
    
    return true
  }
  
  const cancelProduction = (orderId: string) => {
    updateProductionOrder(orderId, { status: "cancelled" })
  }
  
  // ============================================
  // SHOWCASE ITEMS CRUD
  // ============================================
  
  const addShowcaseItem = (item: Omit<ShowcaseItem, "id" | "createdAt" | "updatedAt">) => {
    const newItem: ShowcaseItem = {
      ...item,
      id: `si-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setShowcaseItems(prev => [...prev, newItem])
  }
  
  const updateShowcaseItem = (id: string, updates: Partial<ShowcaseItem>) => {
    setShowcaseItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
    ))
  }
  
  const deleteShowcaseItem = (id: string) => {
    setShowcaseItems(prev => prev.filter(item => item.id !== id))
  }
  
  const getShowcaseStock = (showcaseId: string) => {
    return showcaseItems.filter(item => item.showcaseId === showcaseId && item.quantity > 0)
  }
  
  const getAvailableItems = (showcaseId?: string) => {
    const now = new Date()
    return showcaseItems.filter(item => {
      if (showcaseId && item.showcaseId !== showcaseId) return false
      if (item.quantity <= 0) return false
      
      const expDate = new Date(`${item.expirationDate}T${item.expirationTime}`)
      if (expDate <= now) return false
      
      return true
    }).sort((a, b) => {
      // FIFO: Sort by production date (oldest first)
      return new Date(a.productionDate).getTime() - new Date(b.productionDate).getTime()
    })
  }
  
  const getExpiringItems = (hours: number = 4) => {
    const now = new Date()
    const threshold = new Date(now.getTime() + hours * 60 * 60 * 1000)
    
    return showcaseItems.filter(item => {
      if (item.quantity <= 0) return false
      const expDate = new Date(`${item.expirationDate}T${item.expirationTime}`)
      return expDate <= threshold && expDate > now
    })
  }
  
  const getLowStockItems = () => {
    // Items with less than 20% of initial quantity
    return showcaseItems.filter(item => {
      if (item.quantity <= 0) return false
      return item.quantity < item.initialQuantity * 0.2
    })
  }
  
  const transferItem = (itemId: string, targetShowcaseId: string, quantity: number) => {
    const item = showcaseItems.find(i => i.id === itemId)
    if (!item || quantity > item.quantity) return
    
    // Reduce from source
    updateShowcaseItem(itemId, { quantity: item.quantity - quantity })
    
    // Add to target
    const newItem: ShowcaseItem = {
      ...item,
      id: `si-${Date.now()}`,
      showcaseId: targetShowcaseId,
      quantity,
      initialQuantity: quantity,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setShowcaseItems(prev => [...prev, newItem])
  }
  
  // ============================================
  // STOCK MANAGEMENT FOR SALES
  // ============================================
  
  // Check if a recipe has available stock
  const checkRecipeAvailability = (recipeId: string, quantity: number = 1): { available: boolean; stock: number } => {
    const now = new Date()
    const availableItems = showcaseItems.filter(item => {
      if (item.recipeId !== recipeId) return false
      if (item.quantity <= 0) return false
      const expDate = new Date(`${item.expirationDate}T${item.expirationTime}`)
      return expDate > now
    })
    
    const totalStock = availableItems.reduce((sum, item) => sum + item.quantity, 0)
    return { available: totalStock >= quantity, stock: totalStock }
  }
  
  // Get all recipes that have available stock
  const getAvailableRecipes = (): { recipeId: string; recipe: Recipe; stock: number }[] => {
    const recipeStockMap = new Map<string, number>()
    const now = new Date()
    
    showcaseItems.forEach(item => {
      if (item.quantity <= 0) return
      const expDate = new Date(`${item.expirationDate}T${item.expirationTime}`)
      if (expDate <= now) return
      
      const current = recipeStockMap.get(item.recipeId) || 0
      recipeStockMap.set(item.recipeId, current + item.quantity)
    })
    
    return Array.from(recipeStockMap.entries())
      .filter(([, stock]) => stock > 0)
      .map(([recipeId, stock]) => {
        const recipe = recipes.find(r => r.id === recipeId)
        return recipe ? { recipeId, recipe, stock } : null
      })
      .filter((item): item is { recipeId: string; recipe: Recipe; stock: number } => item !== null)
  }
  
  // Decrement showcase stock when an order is confirmed (FIFO)
  const decrementShowcaseStock = (recipeId: string, quantity: number): boolean => {
    const now = new Date()
    
    // Get available items for this recipe, sorted by expiration (FIFO - oldest first)
    const availableItems = showcaseItems
      .filter(item => {
        if (item.recipeId !== recipeId) return false
        if (item.quantity <= 0) return false
        const expDate = new Date(`${item.expirationDate}T${item.expirationTime}`)
        return expDate > now
      })
      .sort((a, b) => {
        const expA = new Date(`${a.expirationDate}T${a.expirationTime}`)
        const expB = new Date(`${b.expirationDate}T${b.expirationTime}`)
        return expA.getTime() - expB.getTime()
      })
    
    const totalAvailable = availableItems.reduce((sum, item) => sum + item.quantity, 0)
    if (totalAvailable < quantity) return false
    
    let remaining = quantity
    const updates: { id: string; newQuantity: number }[] = []
    
    for (const item of availableItems) {
      if (remaining <= 0) break
      
      const toDeduct = Math.min(item.quantity, remaining)
      updates.push({ id: item.id, newQuantity: item.quantity - toDeduct })
      remaining -= toDeduct
    }
    
    // Apply all updates
    setShowcaseItems(prev => prev.map(item => {
      const update = updates.find(u => u.id === item.id)
      if (update) {
        return {
          ...item,
          quantity: update.newQuantity,
          status: update.newQuantity <= 0 ? "sold-out" : update.newQuantity < item.initialQuantity * 0.2 ? "low" : "available",
          updatedAt: new Date().toISOString()
        }
      }
      return item
    }))
    
    return true
  }
  
  // ============================================
  // SALES
  // ============================================
  
  const addSale = (sale: Omit<Sale, "id" | "createdAt">) => {
    const newSale: Sale = {
      ...sale,
      id: `sale-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setSales(prev => [...prev, newSale])
  }
  
  const processSale = (
    items: { showcaseItemId: string; quantity: number }[],
    paymentMethod: Sale["paymentMethod"],
    customerId?: string,
    discount: number = 0,
    discountType: "percentage" | "fixed" = "fixed",
    pointsUsed: number = 0
  ): Sale | null => {
    const saleItems: SaleItem[] = []
    let subtotal = 0
    
    // Process each item (FIFO)
    for (const { showcaseItemId, quantity } of items) {
      const showcaseItem = showcaseItems.find(i => i.id === showcaseItemId)
      if (!showcaseItem || showcaseItem.quantity < quantity) return null
      
      const recipe = recipes.find(r => r.id === showcaseItem.recipeId)
      if (!recipe) return null
      
      const itemTotal = showcaseItem.sellingPrice * quantity
      
      saleItems.push({
        showcaseItemId,
        recipeId: showcaseItem.recipeId,
        recipeName: recipe.name,
        quantity,
        unitPrice: showcaseItem.sellingPrice,
        total: itemTotal,
      })
      
      subtotal += itemTotal
      
      // Reduce showcase stock
      const newQuantity = showcaseItem.quantity - quantity
      updateShowcaseItem(showcaseItemId, { 
        quantity: newQuantity,
        status: newQuantity <= 0 ? "sold-out" : newQuantity < showcaseItem.initialQuantity * 0.2 ? "low" : "available"
      })
    }
    
    // Calculate discount
    let discountAmount = 0
    if (discountType === "percentage") {
      discountAmount = subtotal * (discount / 100)
    } else {
      discountAmount = discount
    }
    
    // Points discount (1 point = 0.01 TND)
    const pointsDiscount = pointsUsed * 0.01
    
    const total = subtotal - discountAmount - pointsDiscount
    
    // Calculate points earned (1 TND = 1 point)
    const pointsEarned = customerId ? Math.floor(total) : 0
    
    const sale: Sale = {
      id: `sale-${Date.now()}`,
      items: saleItems,
      subtotal,
      discount: discountAmount + pointsDiscount,
      discountType,
      total: Math.max(0, total),
      paymentMethod,
      customerId,
      pointsEarned,
      pointsUsed,
      cashierId: "current-user", // Will be set from auth context
      createdAt: new Date().toISOString(),
    }
    
    setSales(prev => [...prev, sale])
    return sale
  }
  
  const getTodaySales = () => {
    const today = new Date().toISOString().split("T")[0]
    return sales.filter(sale => sale.createdAt.startsWith(today))
  }
  
  const getSalesStats = (startDate?: string, endDate?: string) => {
    let filteredSales = sales
    
    if (startDate) {
      filteredSales = filteredSales.filter(s => s.createdAt >= startDate)
    }
    if (endDate) {
      filteredSales = filteredSales.filter(s => s.createdAt <= endDate)
    }
    
    const totalSales = filteredSales.length
    const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0)
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0
    
    // Top products
    const productStats: Record<string, { recipeId: string; recipeName: string; quantity: number; revenue: number }> = {}
    
    for (const sale of filteredSales) {
      for (const item of sale.items) {
        if (!productStats[item.recipeId]) {
          productStats[item.recipeId] = { recipeId: item.recipeId, recipeName: item.recipeName, quantity: 0, revenue: 0 }
        }
        productStats[item.recipeId].quantity += item.quantity
        productStats[item.recipeId].revenue += item.total
      }
    }
    
    const topProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
    
    return { totalSales, totalRevenue, averageTicket, topProducts }
  }
  
  const value: ProductionContextType = {
    recipeCategories,
    addRecipeCategory,
    updateRecipeCategory,
    deleteRecipeCategory,
    recipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
getRecipeCost,
  getRecipeMargin,
  getSuggestedPrice,
  getRecipeTotalIngredientCost,
  showcases,
    addShowcase,
    updateShowcase,
    deleteShowcase,
    productionOrders,
    addProductionOrder,
    updateProductionOrder,
    deleteProductionOrder,
    startProduction,
    completeProduction,
    cancelProduction,
    checkIngredientAvailability,
    showcaseItems,
    addShowcaseItem,
    updateShowcaseItem,
    deleteShowcaseItem,
    getShowcaseStock,
    getAvailableItems,
    getExpiringItems,
    getLowStockItems,
    transferItem,
    decrementShowcaseStock,
    checkRecipeAvailability,
    getAvailableRecipes,
    sales,
    addSale,
    processSale,
    getTodaySales,
    getSalesStats,
  }
  
  return (
    <ProductionContext.Provider value={value}>
      {children}
    </ProductionContext.Provider>
  )
}

export function useProduction() {
  const context = useContext(ProductionContext)
  if (context === undefined) {
    throw new Error("useProduction must be used within a ProductionProvider")
  }
  return context
}
