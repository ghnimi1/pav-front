"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// ============================================
// TYPES ET INTERFACES
// ============================================

export interface ProductSupplementConfig {
  supplementId: string
  isEnabled: boolean
  customPrice?: number
}

export interface SelectedSupplement {
  supplementId: string
  name: string
  price: number
  points?: number
  quantity: number
}

export interface BreakfastItem {
  id: string
  name: string
  description?: string
  price: number
  points?: number
  categoryId: string
  image?: string
  isAvailable: boolean
  isRequired?: boolean
  minQuantity?: number
  maxQuantity?: number
  availableSupplements?: ProductSupplementConfig[]
}

export type FormulaType = "normal" | "healthy" | null

export interface BaseFormula {
  id: string
  name: string
  description: string
  price: number
  points?: number
  type: "normal" | "healthy"
  image?: string
}

export interface BreakfastCategory {
  id: string
  name: string
  icon: string
  description?: string
  order: number
  isActive: boolean
}

export interface CartItem {
  item: BreakfastItem
  quantity: number
  selectedSupplements?: SelectedSupplement[]
}

export interface BreakfastOrder {
  id: string
  items: CartItem[]
  total: number
  totalPoints: number
  status: "pending" | "validated" | "cancelled"
  tableNumber?: string
  ticketNumber?: string
  createdAt: string
  validatedAt?: string
  validatedBy?: string
  customerNote?: string
  // Client info for loyalty tracking
  clientId?: string
  clientEmail?: string
  clientName?: string
}

// ============================================
// BASE FORMULAS - Obligatory starting point
// ============================================

const defaultBaseFormulas: BaseFormula[] = [
  {
    id: "formula-normal",
    name: "Formule Classique",
    description: "Cafe au choix + Croissant nature",
    price: 4.9,
    points: 5,
    type: "normal",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop"
  },
  {
    id: "formula-healthy",
    name: "Formule Healthy",
    description: "The vert + Toast complet aux graines",
    price: 5.9,
    points: 6,
    type: "healthy",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop"
  }
]

// ============================================
// MENU DATA - Based on Le Pave d'Art menu
// ============================================

const defaultCategories: BreakfastCategory[] = [
  { id: "suggestions", name: "Nos Suggestions", icon: "star", description: "Formules recommandees", order: 0, isActive: true },
  { id: "boissons-chaudes", name: "Boissons Chaudes", icon: "coffee", description: "Cafe, the et chocolat", order: 1, isActive: true },
  { id: "boissons-fraiches", name: "Boissons Fraiches", icon: "glass-water", description: "Jus frais et eau", order: 2, isActive: true },
  { id: "viennoiseries", name: "Viennoiseries", icon: "croissant", description: "Viennoiseries fraiches du jour", order: 3, isActive: true },
  { id: "sucre", name: "Sucre", icon: "cake", description: "Options sucrees gourmandes", order: 4, isActive: true },
  { id: "sale", name: "Sale", icon: "egg", description: "Options salees", order: 5, isActive: true },
  { id: "premium", name: "Premium", icon: "crown", description: "Selection premium", order: 6, isActive: true },
  { id: "desserts", name: "Desserts", icon: "ice-cream", description: "Desserts et gourmandises", order: 7, isActive: true },
]

const defaultItems: BreakfastItem[] = [
  // Suggestions / Formules
  { id: "pack-classique", name: "Classique", description: "Cafe + croissant + jus", price: 9, points: 9, categoryId: "suggestions", isAvailable: true, image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400&h=300&fit=crop" },
  { id: "pack-gourmand", name: "Gourmand", description: "Cafe + croissant + toast + jus", price: 14, points: 14, categoryId: "suggestions", isAvailable: true, image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop" },
  { id: "pack-complet", name: "Complet", description: "Cafe + jus + omelette ou croque + toast", price: 19, points: 19, categoryId: "suggestions", isAvailable: true, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop" },
  
  // Boissons Chaudes
  { 
    id: "cafe-express", 
    name: "Cafe Express", 
    price: 2.5, 
    points: 3, 
    categoryId: "boissons-chaudes", 
    isAvailable: true, 
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop",
    availableSupplements: [
      { supplementId: "sup-7", isEnabled: true }, // Lait de soja
      { supplementId: "sup-8", isEnabled: true }, // Lait d'avoine
      { supplementId: "sup-9", isEnabled: true }, // Chantilly
      { supplementId: "sup-10", isEnabled: true }, // Sirop caramel
      { supplementId: "sup-11", isEnabled: true }, // Shot espresso
    ]
  },
  { 
    id: "cafe-creme", 
    name: "Cafe Creme", 
    price: 4, 
    points: 4, 
    categoryId: "boissons-chaudes", 
    isAvailable: true, 
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop",
    availableSupplements: [
      { supplementId: "sup-7", isEnabled: true }, // Lait de soja
      { supplementId: "sup-8", isEnabled: true }, // Lait d'avoine
      { supplementId: "sup-9", isEnabled: true }, // Chantilly
      { supplementId: "sup-10", isEnabled: true }, // Sirop caramel
      { supplementId: "sup-11", isEnabled: true }, // Shot espresso
    ]
  },
  { 
    id: "cappuccino", 
    name: "Cappuccino", 
    price: 5, 
    points: 5, 
    categoryId: "boissons-chaudes", 
    isAvailable: true, 
    image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop",
    availableSupplements: [
      { supplementId: "sup-7", isEnabled: true }, // Lait de soja
      { supplementId: "sup-8", isEnabled: true }, // Lait d'avoine
      { supplementId: "sup-9", isEnabled: true }, // Chantilly
      { supplementId: "sup-10", isEnabled: true }, // Sirop caramel
      { supplementId: "sup-11", isEnabled: true }, // Shot espresso
    ]
  },
  { id: "the", name: "The", price: 3, points: 3, categoryId: "boissons-chaudes", isAvailable: true, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop" },
  { id: "chocolat-chaud", name: "Chocolat Chaud", price: 5, points: 5, categoryId: "boissons-chaudes", isAvailable: true, image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&h=300&fit=crop" },
  
  // Boissons Fraiches
  { id: "jus-orange", name: "Jus orange / citronnade", price: 7, points: 7, categoryId: "boissons-fraiches", isAvailable: true, image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop" },
  { id: "jus-fraise", name: "Jus frais fraise", price: 8, points: 8, categoryId: "boissons-fraiches", isAvailable: true, image: "https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=400&h=300&fit=crop" },
  { id: "jus-kiwi", name: "Jus frais kiwi", price: 8.5, points: 9, categoryId: "boissons-fraiches", isAvailable: true, image: "https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=400&h=300&fit=crop" },
  { id: "jus-banane", name: "Jus frais banane", price: 9, points: 9, categoryId: "boissons-fraiches", isAvailable: true, image: "https://images.unsplash.com/photo-1571950006966-ea6a3cf18b24?w=400&h=300&fit=crop" },
  { id: "eau-05", name: "Eau 0.5L", price: 1.5, points: 2, categoryId: "boissons-fraiches", isAvailable: true, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop" },
  { id: "eau-1", name: "Eau 1L", price: 3, points: 3, categoryId: "boissons-fraiches", isAvailable: true, image: "https://images.unsplash.com/photo-1560023907-5f339617ea55?w=400&h=300&fit=crop" },
  
  // Viennoiseries
  { 
    id: "croissant", 
    name: "Croissant nature", 
    price: 2.5, 
    points: 3, 
    categoryId: "viennoiseries", 
    isAvailable: true, 
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop",
    availableSupplements: [
      { supplementId: "sup-16", isEnabled: true }, // Amandes effilées
      { supplementId: "sup-17", isEnabled: true }, // Chocolat fondu
      { supplementId: "sup-18", isEnabled: true }, // Confiture maison
    ]
  },
  { id: "pain-chocolat", name: "Pain au chocolat", price: 3.5, points: 4, categoryId: "viennoiseries", isAvailable: true, image: "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=400&h=300&fit=crop" },
  { id: "croissant-amande", name: "Croissant amande", price: 4.5, points: 5, categoryId: "viennoiseries", isAvailable: true, image: "https://images.unsplash.com/photo-1623334044303-241021148842?w=400&h=300&fit=crop" },
  { id: "croissant-pistache", name: "Croissant pistache", price: 5.5, points: 6, categoryId: "viennoiseries", isAvailable: true, image: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400&h=300&fit=crop" },
  
  // Sucre
  { id: "toast-beurre", name: "Toast beurre, miel & confiture", price: 4, points: 4, categoryId: "sucre", isAvailable: true, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop" },
  { id: "verrine-cheesecake", name: "Verrine cheesecake", price: 5, points: 5, categoryId: "sucre", isAvailable: true, image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop" },
  { id: "cookies", name: "Cookies / cookies healthy", price: 4, points: 4, categoryId: "sucre", isAvailable: true, image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop" },
  { id: "pain-cake-nutella", name: "Pain cake Nutella", price: 6, points: 6, categoryId: "sucre", isAvailable: true, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop" },
  { 
    id: "pancakes", 
    name: "Pancakes Maison", 
    description: "Pancakes moelleux faits maison", 
    price: 7, 
    points: 7, 
    categoryId: "sucre", 
    isAvailable: true, 
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop",
    availableSupplements: [
      { supplementId: "sup-12", isEnabled: true }, // Nutella
      { supplementId: "sup-13", isEnabled: true }, // Fruits frais
      { supplementId: "sup-9", isEnabled: true }, // Chantilly
      { supplementId: "sup-14", isEnabled: true }, // Sirop d'érable
      { supplementId: "sup-15", isEnabled: true }, // Glace vanille
    ]
  },
  { 
    id: "crepes", 
    name: "Crêpes", 
    description: "Crêpes fines et légères", 
    price: 6, 
    points: 6, 
    categoryId: "sucre", 
    isAvailable: true, 
    image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=300&fit=crop",
    availableSupplements: [
      { supplementId: "sup-12", isEnabled: true }, // Nutella
      { supplementId: "sup-13", isEnabled: true }, // Fruits frais
      { supplementId: "sup-9", isEnabled: true }, // Chantilly
      { supplementId: "sup-14", isEnabled: true }, // Sirop d'érable
      { supplementId: "sup-15", isEnabled: true }, // Glace vanille
    ]
  },
  
  // Sale
  { 
    id: "omelette", 
    name: "Omelette au choix", 
    price: 8.5, 
    points: 9, 
    categoryId: "sale", 
    isAvailable: true, 
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop",
    availableSupplements: [
      { supplementId: "sup-1", isEnabled: true }, // Champignons
      { supplementId: "sup-2", isEnabled: true }, // Fromage
      { supplementId: "sup-3", isEnabled: true }, // Thon
      { supplementId: "sup-4", isEnabled: true }, // Jambon
      { supplementId: "sup-5", isEnabled: true }, // Légumes
      { supplementId: "sup-6", isEnabled: true }, // Herbes fraîches
    ]
  },
  { id: "croque-monsieur", name: "Croque-Monsieur", price: 7, points: 7, categoryId: "sale", isAvailable: true, image: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400&h=300&fit=crop" },
  { id: "quiche", name: "Quiche", price: 7, points: 7, categoryId: "sale", isAvailable: true, image: "https://images.unsplash.com/photo-1591985666643-9b1e8be1e63c?w=400&h=300&fit=crop" },
  
  // Premium
  { id: "charcuterie-1", name: "Charcuterie 1 personne", description: "Assortiment fromage & charcuterie", price: 10, points: 10, categoryId: "premium", isAvailable: true, image: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=300&fit=crop" },
  { id: "charcuterie-2", name: "Charcuterie 2 personnes", description: "Assortiment fromage & charcuterie", price: 18, points: 18, categoryId: "premium", isAvailable: true, image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=300&fit=crop" },
  
  // Desserts
  { id: "cheesecake", name: "Cheesecake", price: 7, points: 7, categoryId: "desserts", isAvailable: true, image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop" },
  { id: "tiramisu", name: "Tiramisu", price: 7, points: 7, categoryId: "desserts", isAvailable: true, image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop" },
  { id: "fondant-chocolat", name: "Fondant chocolat", price: 6, points: 6, categoryId: "desserts", isAvailable: true, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop" },
  { id: "verrine", name: "Verrine", price: 5, points: 5, categoryId: "desserts", isAvailable: true, image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop" },
  { id: "crepe-nutella", name: "Crepe Nutella ou Speculoos", price: 8, points: 8, categoryId: "desserts", isAvailable: true, image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=300&fit=crop" },
  { id: "crepe-fruits", name: "Crepe avec fruits ou fruits secs", price: 12, points: 12, categoryId: "desserts", isAvailable: true, image: "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=400&h=300&fit=crop" },
  { id: "madeleine", name: "Madeleine", price: 3, points: 3, categoryId: "desserts", isAvailable: true, image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&h=300&fit=crop" },
  { id: "plateau-sucre-1", name: "Plateau sucre 1 personne", price: 12, points: 12, categoryId: "desserts", isAvailable: true, image: "https://images.unsplash.com/photo-1587668178277-295251f900ce?w=400&h=300&fit=crop" },
  { id: "plateau-sucre-2", name: "Plateau sucre 2 personnes", price: 22, points: 22, categoryId: "desserts", isAvailable: true, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop" },
]

// ============================================
// CONTEXT
// ============================================

interface BreakfastContextType {
  // Menu
  categories: BreakfastCategory[]
  items: BreakfastItem[]
  getItemsByCategory: (categoryId: string) => BreakfastItem[]
  
  // Base Formulas
  baseFormulas: BaseFormula[]
  selectedFormula: FormulaType
  selectFormula: (type: FormulaType) => void
  getFormulaPrice: () => number
  getFormulaPoints: () => number
  updateFormula: (id: string, formula: Partial<BaseFormula>) => void
  
  // Admin - Categories
  addCategory: (category: Omit<BreakfastCategory, "id">) => void
  updateCategory: (id: string, category: Partial<BreakfastCategory>) => void
  deleteCategory: (id: string) => void
  
  // Admin - Items
  addItem: (item: Omit<BreakfastItem, "id">) => void
  updateItem: (id: string, item: Partial<BreakfastItem>) => void
  deleteItem: (id: string) => void
  
  // Cart (client side)
  cart: CartItem[]
  addToCart: (item: BreakfastItem, supplements?: SelectedSupplement[]) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
  cartTotalPoints: number
  cartItemsCount: number
  
  // Orders
  orders: BreakfastOrder[]
  createOrder: (note?: string, clientInfo?: { id?: string, email?: string, name?: string }) => BreakfastOrder | null
  validateOrder: (orderId: string, tableNumber: string, ticketNumber: string, staffId?: string) => void
  cancelOrder: (orderId: string) => void
  pendingOrders: BreakfastOrder[]
  validatedOrders: BreakfastOrder[]
  
  // User points (accumulated from validated orders)
  userTotalPoints: number
}

const BreakfastContext = createContext<BreakfastContextType | undefined>(undefined)

export function BreakfastProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<BreakfastCategory[]>(defaultCategories)
  const [items, setItems] = useState<BreakfastItem[]>(defaultItems)
  const [baseFormulas, setBaseFormulas] = useState<BaseFormula[]>(defaultBaseFormulas)
  const [selectedFormula, setSelectedFormula] = useState<FormulaType>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<BreakfastOrder[]>([])
  const [userTotalPoints, setUserTotalPoints] = useState(0)

  // Load from localStorage and migrate data to include points
  useEffect(() => {
    const savedCategories = localStorage.getItem("breakfast-categories")
    const savedItems = localStorage.getItem("breakfast-items")
    const savedOrders = localStorage.getItem("breakfast-orders")
    const savedFormulas = localStorage.getItem("breakfast-formulas")
    const savedUserPoints = localStorage.getItem("user-total-points")
    const dataVersion = localStorage.getItem("breakfast-data-version")
    
    // Force reset if data version is outdated (v3 = supplements support)
    if (dataVersion !== "3") {
      localStorage.setItem("breakfast-data-version", "3")
      // Clear old data to use defaults with points AND supplements
      localStorage.removeItem("breakfast-items")
      localStorage.removeItem("breakfast-formulas")
      return // Will use default items/formulas which have points and supplements
    }
    
    if (savedCategories) setCategories(JSON.parse(savedCategories))
    if (savedItems) {
      // Merge saved items with default items to ensure points AND supplements are present
      const parsed = JSON.parse(savedItems) as BreakfastItem[]
      const mergedItems = parsed.map(item => {
        const defaultItem = defaultItems.find(d => d.id === item.id)
        return {
          ...item,
          points: item.points ?? defaultItem?.points ?? Math.floor(item.price),
          availableSupplements: item.availableSupplements ?? defaultItem?.availableSupplements
        }
      })
      setItems(mergedItems)
    }
    if (savedOrders) setOrders(JSON.parse(savedOrders))
    if (savedFormulas) {
      // Merge saved formulas with default formulas to ensure points are present
      const parsed = JSON.parse(savedFormulas) as BaseFormula[]
      const mergedFormulas = parsed.map(formula => {
        const defaultFormula = defaultBaseFormulas.find(d => d.id === formula.id)
        return {
          ...formula,
          points: formula.points ?? defaultFormula?.points ?? Math.floor(formula.price)
        }
      })
      setBaseFormulas(mergedFormulas)
    }
    if (savedUserPoints) setUserTotalPoints(parseInt(savedUserPoints) || 0)
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("breakfast-categories", JSON.stringify(categories))
  }, [categories])
  
  useEffect(() => {
    localStorage.setItem("breakfast-items", JSON.stringify(items))
  }, [items])
  
  useEffect(() => {
    localStorage.setItem("breakfast-orders", JSON.stringify(orders))
  }, [orders])
  
  useEffect(() => {
    localStorage.setItem("breakfast-formulas", JSON.stringify(baseFormulas))
  }, [baseFormulas])
  
  useEffect(() => {
    localStorage.setItem("user-total-points", userTotalPoints.toString())
  }, [userTotalPoints])
  
  // Get items by category
  const getItemsByCategory = (categoryId: string) => {
    return items.filter(item => item.categoryId === categoryId && item.isAvailable)
  }
  
  // Admin - Categories
  const addCategory = (category: Omit<BreakfastCategory, "id">) => {
    const newCategory: BreakfastCategory = {
      ...category,
      id: `cat-${Date.now()}`
    }
    setCategories(prev => [...prev, newCategory])
  }
  
  const updateCategory = (id: string, updates: Partial<BreakfastCategory>) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, ...updates } : cat
    ))
  }
  
  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id))
    // Also delete items in this category
    setItems(prev => prev.filter(item => item.categoryId !== id))
  }
  
  // Admin - Items
  const addItem = (item: Omit<BreakfastItem, "id">) => {
    const newItem: BreakfastItem = {
      ...item,
      id: `item-${Date.now()}`
    }
    setItems(prev => [...prev, newItem])
  }
  
  const updateItem = (id: string, updates: Partial<BreakfastItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }
  
  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }
  
  // Formula functions
  const selectFormula = (type: FormulaType) => {
    setSelectedFormula(type)
  }
  
  const getFormulaPrice = () => {
    if (!selectedFormula) return 0
    const formula = baseFormulas.find(f => f.type === selectedFormula)
    return formula?.price || 0
  }
  
  const getFormulaPoints = () => {
    if (!selectedFormula) return 0
    const formula = baseFormulas.find(f => f.type === selectedFormula)
    return formula?.points || 0
  }
  
  const updateFormula = (id: string, updates: Partial<BaseFormula>) => {
    setBaseFormulas(prev => prev.map(f => 
      f.id === id ? { ...f, ...updates } : f
    ))
  }

  // Cart functions
  const addToCart = (item: BreakfastItem, supplements?: SelectedSupplement[]) => {
    setCart(prev => {
      // If item has supplements, always add as a new line item (different customization)
      if (supplements && supplements.length > 0) {
        // Generate a unique key for this item + supplements combination
        const supplementKey = supplements.map(s => `${s.supplementId}:${s.quantity}`).sort().join(',')
        const existingWithSameSupplements = prev.find(
          i => i.item.id === item.id && 
          i.selectedSupplements?.map(s => `${s.supplementId}:${s.quantity}`).sort().join(',') === supplementKey
        )
        
        if (existingWithSameSupplements) {
          // Same item with same supplements - increase quantity
          if (item.maxQuantity && existingWithSameSupplements.quantity >= item.maxQuantity) {
            return prev
          }
          return prev.map(i => 
            i === existingWithSameSupplements 
              ? { ...i, quantity: i.quantity + 1 }
              : i
          )
        }
        // New customization - add as new line
        return [...prev, { item, quantity: 1, selectedSupplements: supplements }]
      }
      
      // No supplements - normal behavior (find existing without supplements)
      const existing = prev.find(i => i.item.id === item.id && (!i.selectedSupplements || i.selectedSupplements.length === 0))
      if (existing) {
        // Check max quantity
        if (item.maxQuantity && existing.quantity >= item.maxQuantity) {
          return prev
        }
        return prev.map(i => 
          i === existing 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    setCart(prev => prev.map(i => 
      i.item.id === itemId ? { ...i, quantity } : i
    ))
  }

  const clearCart = () => {
    setCart([])
  }

  const cartItemsTotal = cart.reduce((sum, { item, quantity, selectedSupplements }) => {
    const itemPrice = item.price * quantity
    const supplementsPrice = selectedSupplements 
      ? selectedSupplements.reduce((supSum, sup) => supSum + (sup.price * sup.quantity), 0) * quantity
      : 0
    return sum + itemPrice + supplementsPrice
  }, 0)
  const cartTotal = cartItemsTotal + getFormulaPrice()
  const cartItemsPoints = cart.reduce((sum, { item, quantity }) => sum + ((item.points || 0) * quantity), 0)
  const cartTotalPoints = cartItemsPoints + getFormulaPoints()
  const cartItemsCount = cart.reduce((sum, { quantity }) => sum + quantity, 0) + (selectedFormula ? 1 : 0)

  // Order functions
const createOrder = (note?: string, clientInfo?: { id?: string, email?: string, name?: string }): BreakfastOrder | null => {
    if (cart.length === 0 && !selectedFormula) return null
    
    // Create formula as a cart item if selected
    const formulaItem: CartItem[] = selectedFormula ? [{
      item: {
        id: `formula-${selectedFormula}`,
        name: selectedFormula === "healthy" ? "Formule Healthy" : "Formule Classique",
        description: selectedFormula === "healthy" ? "The vert + Toast complet aux graines" : "Cafe au choix + Croissant nature",
        price: getFormulaPrice(),
        points: getFormulaPoints(),
        categoryId: "formule-base",
        isAvailable: true,
        isRequired: true
      },
      quantity: 1
    }] : []
    
    const order: BreakfastOrder = {
      id: `ORD-${Date.now()}`,
      items: [...formulaItem, ...cart],
      total: cartTotal,
      totalPoints: cartTotalPoints,
      status: "pending",
      createdAt: new Date().toISOString(),
      customerNote: note,
      clientId: clientInfo?.id,
      clientEmail: clientInfo?.email,
      clientName: clientInfo?.name
    }
    
    setOrders(prev => [order, ...prev])
    clearCart()
    setSelectedFormula(null)
    return order
  }

  const validateOrder = (orderId: string, tableNumber: string, ticketNumber: string, staffId?: string) => {
    // Find the order to calculate points
    const orderToValidate = orders.find(o => o.id === orderId)
    if (orderToValidate && orderToValidate.status === "pending") {
      // Calculate total points from order items
      const orderPoints = orderToValidate.items.reduce((sum, cartItem) => {
        return sum + ((cartItem.item?.points || 0) * cartItem.quantity)
      }, 0)
      
      // Add points to user total
      setUserTotalPoints(prev => prev + orderPoints)
    }
    
    setOrders(prev => prev.map(order => 
      order.id === orderId
        ? {
            ...order,
            status: "validated",
            tableNumber,
            ticketNumber,
            validatedAt: new Date().toISOString(),
            validatedBy: staffId
          }
        : order
    ))
  }

  const cancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, status: "cancelled" }
        : order
    ))
  }

  const pendingOrders = orders.filter(o => o.status === "pending")
  const validatedOrders = orders.filter(o => o.status === "validated")

  return (
    <BreakfastContext.Provider value={{
      categories,
      items,
      getItemsByCategory,
      baseFormulas,
      selectedFormula,
      selectFormula,
      getFormulaPrice,
      getFormulaPoints,
      updateFormula,
      addCategory,
      updateCategory,
      deleteCategory,
      addItem,
      updateItem,
      deleteItem,
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      cartTotalPoints,
      cartItemsCount,
      orders,
      createOrder,
      validateOrder,
      cancelOrder,
      pendingOrders,
      validatedOrders,
      userTotalPoints
    }}>
      {children}
    </BreakfastContext.Provider>
  )
}

export function useBreakfast() {
  const context = useContext(BreakfastContext)
  if (context === undefined) {
    throw new Error("useBreakfast must be used within a BreakfastProvider")
  }
  return context
}
