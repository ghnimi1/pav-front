"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

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
  imageFile?: File
  removeImage?: boolean
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
  isActive?: boolean
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
  clientId?: string
  clientEmail?: string
  clientName?: string
}

interface ApiEntity {
  _id?: string
  id?: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "")
const AUTH_TOKEN_KEY = "authToken"

const defaultBaseFormulas: BaseFormula[] = [
  {
    id: "formula-normal",
    name: "Formule Classique",
    description: "Cafe au choix + Croissant nature",
    price: 4.9,
    points: 5,
    type: "normal",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop",
    isActive: true,
  },
  {
    id: "formula-healthy",
    name: "Formule Healthy",
    description: "The vert + Toast complet aux graines",
    price: 5.9,
    points: 6,
    type: "healthy",
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop",
    isActive: true,
  },
]

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
  { id: "pack-classique", name: "Classique", description: "Cafe + croissant + jus", price: 9, points: 9, categoryId: "suggestions", isAvailable: true, image: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400&h=300&fit=crop" },
  { id: "pack-gourmand", name: "Gourmand", description: "Cafe + croissant + toast + jus", price: 14, points: 14, categoryId: "suggestions", isAvailable: true, image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop" },
  { id: "pack-complet", name: "Complet", description: "Cafe + jus + omelette ou croque + toast", price: 19, points: 19, categoryId: "suggestions", isAvailable: true, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop" },
  {
    id: "cafe-express",
    name: "Cafe Express",
    price: 2.5,
    points: 3,
    categoryId: "boissons-chaudes",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop",
    availableSupplements: [
      { supplementId: "sup-7", isEnabled: true },
      { supplementId: "sup-8", isEnabled: true },
      { supplementId: "sup-9", isEnabled: true },
      { supplementId: "sup-10", isEnabled: true },
      { supplementId: "sup-11", isEnabled: true },
    ],
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
      { supplementId: "sup-7", isEnabled: true },
      { supplementId: "sup-8", isEnabled: true },
      { supplementId: "sup-9", isEnabled: true },
      { supplementId: "sup-10", isEnabled: true },
      { supplementId: "sup-11", isEnabled: true },
    ],
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
      { supplementId: "sup-7", isEnabled: true },
      { supplementId: "sup-8", isEnabled: true },
      { supplementId: "sup-9", isEnabled: true },
      { supplementId: "sup-10", isEnabled: true },
      { supplementId: "sup-11", isEnabled: true },
    ],
  },
  { id: "the", name: "The", price: 3, points: 3, categoryId: "boissons-chaudes", isAvailable: true, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop" },
  { id: "chocolat-chaud", name: "Chocolat Chaud", price: 5, points: 5, categoryId: "boissons-chaudes", isAvailable: true, image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&h=300&fit=crop" },
  { id: "jus-orange", name: "Jus orange / citronnade", price: 7, points: 7, categoryId: "boissons-fraiches", isAvailable: true, image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop" },
  { id: "jus-fraise", name: "Jus frais fraise", price: 8, points: 8, categoryId: "boissons-fraiches", isAvailable: true, image: "https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=400&h=300&fit=crop" },
  { id: "jus-kiwi", name: "Jus frais kiwi", price: 8.5, points: 9, categoryId: "boissons-fraiches", isAvailable: true, image: "https://images.unsplash.com/photo-1616671276441-2f2c277b8bf6?w=400&h=300&fit=crop" },
  { id: "jus-banane", name: "Jus frais banane", price: 9, points: 9, categoryId: "boissons-fraiches", isAvailable: true, image: "https://images.unsplash.com/photo-1571950006966-ea6a3cf18b24?w=400&h=300&fit=crop" },
  { id: "eau-05", name: "Eau 0.5L", price: 1.5, points: 2, categoryId: "boissons-fraiches", isAvailable: true, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop" },
  { id: "eau-1", name: "Eau 1L", price: 3, points: 3, categoryId: "boissons-fraiches", isAvailable: true, image: "https://images.unsplash.com/photo-1560023907-5f339617ea55?w=400&h=300&fit=crop" },
  {
    id: "croissant",
    name: "Croissant nature",
    price: 2.5,
    points: 3,
    categoryId: "viennoiseries",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop",
    availableSupplements: [
      { supplementId: "sup-16", isEnabled: true },
      { supplementId: "sup-17", isEnabled: true },
      { supplementId: "sup-18", isEnabled: true },
    ],
  },
  { id: "pain-chocolat", name: "Pain au chocolat", price: 3.5, points: 4, categoryId: "viennoiseries", isAvailable: true, image: "https://images.unsplash.com/photo-1530610476181-d83430b64dcd?w=400&h=300&fit=crop" },
  { id: "croissant-amande", name: "Croissant amande", price: 4.5, points: 5, categoryId: "viennoiseries", isAvailable: true, image: "https://images.unsplash.com/photo-1623334044303-241021148842?w=400&h=300&fit=crop" },
  { id: "croissant-pistache", name: "Croissant pistache", price: 5.5, points: 6, categoryId: "viennoiseries", isAvailable: true, image: "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400&h=300&fit=crop" },
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
      { supplementId: "sup-12", isEnabled: true },
      { supplementId: "sup-13", isEnabled: true },
      { supplementId: "sup-9", isEnabled: true },
      { supplementId: "sup-14", isEnabled: true },
      { supplementId: "sup-15", isEnabled: true },
    ],
  },
  {
    id: "crepes",
    name: "Crepes",
    description: "Crepes fines et legeres",
    price: 6,
    points: 6,
    categoryId: "sucre",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=400&h=300&fit=crop",
    availableSupplements: [
      { supplementId: "sup-12", isEnabled: true },
      { supplementId: "sup-13", isEnabled: true },
      { supplementId: "sup-9", isEnabled: true },
      { supplementId: "sup-14", isEnabled: true },
      { supplementId: "sup-15", isEnabled: true },
    ],
  },
  {
    id: "omelette",
    name: "Omelette au choix",
    price: 8.5,
    points: 9,
    categoryId: "sale",
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop",
    availableSupplements: [
      { supplementId: "sup-1", isEnabled: true },
      { supplementId: "sup-2", isEnabled: true },
      { supplementId: "sup-3", isEnabled: true },
      { supplementId: "sup-4", isEnabled: true },
      { supplementId: "sup-5", isEnabled: true },
      { supplementId: "sup-6", isEnabled: true },
    ],
  },
  { id: "croque-monsieur", name: "Croque-Monsieur", price: 7, points: 7, categoryId: "sale", isAvailable: true, image: "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=400&h=300&fit=crop" },
  { id: "quiche", name: "Quiche", price: 7, points: 7, categoryId: "sale", isAvailable: true, image: "https://images.unsplash.com/photo-1591985666643-9b1e8be1e63c?w=400&h=300&fit=crop" },
  { id: "charcuterie-1", name: "Charcuterie 1 personne", description: "Assortiment fromage & charcuterie", price: 10, points: 10, categoryId: "premium", isAvailable: true, image: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=300&fit=crop" },
  { id: "charcuterie-2", name: "Charcuterie 2 personnes", description: "Assortiment fromage & charcuterie", price: 18, points: 18, categoryId: "premium", isAvailable: true, image: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&h=300&fit=crop" },
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

interface BreakfastContextType {
  categories: BreakfastCategory[]
  items: BreakfastItem[]
  getItemsByCategory: (categoryId: string) => BreakfastItem[]
  baseFormulas: BaseFormula[]
  selectedFormula: FormulaType
  selectFormula: (type: FormulaType) => void
  getFormulaPrice: () => number
  getFormulaPoints: () => number
  updateFormula: (id: string, formula: Partial<BaseFormula>) => void
  addCategory: (category: Omit<BreakfastCategory, "id">) => void
  updateCategory: (id: string, category: Partial<BreakfastCategory>) => void
  deleteCategory: (id: string) => void
  addItem: (item: Omit<BreakfastItem, "id">) => void
  updateItem: (id: string, item: Partial<BreakfastItem>) => void
  deleteItem: (id: string) => void
  cart: CartItem[]
  addToCart: (item: BreakfastItem, supplements?: SelectedSupplement[]) => void
  removeFromCart: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
  cartTotalPoints: number
  cartItemsCount: number
  orders: BreakfastOrder[]
  createOrder: (note?: string, clientInfo?: { id?: string; email?: string; name?: string }) => BreakfastOrder | null
  validateOrder: (orderId: string, tableNumber: string, ticketNumber: string, staffId?: string) => void
  cancelOrder: (orderId: string) => void
  pendingOrders: BreakfastOrder[]
  validatedOrders: BreakfastOrder[]
  userTotalPoints: number
}

const BreakfastContext = createContext<BreakfastContextType | undefined>(undefined)

function normalizeId<T extends ApiEntity>(entity: T): string {
  return entity.id || entity._id || ""
}

function mapCategory(category: ApiEntity & Omit<BreakfastCategory, "id">): BreakfastCategory {
  return { ...category, id: normalizeId(category) }
}

function mapItem(item: ApiEntity & Omit<BreakfastItem, "id">): BreakfastItem {
  return { ...item, id: normalizeId(item) }
}

function mapFormula(formula: ApiEntity & Omit<BaseFormula, "id">): BaseFormula {
  return { ...formula, id: normalizeId(formula) }
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init)
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | T | null

  if (!response.ok) {
    const error =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : "Une erreur est survenue"
    throw new Error(error)
  }

  if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
    return payload.data as T
  }

  return payload as T
}

async function tryCreate<T>(path: string, body: unknown): Promise<T | null> {
  try {
    return await fetchJson<T>(path, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (message.toLowerCase().includes("existe")) {
      return null
    }
    throw error
  }
}

function getAuthHeaders() {
  if (typeof window === "undefined") return { "Content-Type": "application/json" }
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function getAuthTokenHeader() {
  const headers = getAuthHeaders()
  return headers.Authorization ? { Authorization: headers.Authorization } : {}
}

function buildBreakfastItemFormData(item: Partial<BreakfastItem>) {
  const formData = new FormData()

  if (item.name !== undefined) formData.append("name", item.name)
  if (item.description !== undefined) formData.append("description", item.description)
  if (item.price !== undefined) formData.append("price", String(item.price))
  if (item.points !== undefined) formData.append("points", String(item.points))
  if (item.categoryId !== undefined) formData.append("categoryId", item.categoryId)
  if (item.image !== undefined) formData.append("image", item.image)
  if (item.isAvailable !== undefined) formData.append("isAvailable", String(item.isAvailable))
  if (item.isRequired !== undefined) formData.append("isRequired", String(item.isRequired))
  if (item.minQuantity !== undefined) formData.append("minQuantity", String(item.minQuantity))
  if (item.maxQuantity !== undefined) formData.append("maxQuantity", String(item.maxQuantity))
  if (item.availableSupplements !== undefined) formData.append("availableSupplements", JSON.stringify(item.availableSupplements))
  if (item.removeImage !== undefined) formData.append("removeImage", String(item.removeImage))
  if (item.imageFile) formData.append("imageFile", item.imageFile)

  return formData
}

async function bootstrapBreakfastMenu() {
  await Promise.all(
    defaultCategories.map((category) =>
      tryCreate<ApiEntity & Omit<BreakfastCategory, "id">>("/menu/breakfast/categories", {
          name: category.name,
          icon: category.icon,
          description: category.description,
          order: category.order,
          isActive: category.isActive,
        })
    )
  )

  const createdCategories = await fetchJson<Array<ApiEntity & Omit<BreakfastCategory, "id">>>("/menu/breakfast/categories")
  const categoryMap = new Map<string, string>()
  defaultCategories.forEach((category) => {
    const created = createdCategories.find((apiCategory) => apiCategory.name === category.name)
    if (created) {
      categoryMap.set(category.id, normalizeId(created))
    }
  })

  await Promise.all(
    defaultItems.map((item) =>
      tryCreate<ApiEntity & Omit<BreakfastItem, "id">>("/menu/breakfast/items", {
          ...item,
          categoryId: categoryMap.get(item.categoryId) || item.categoryId,
        })
    )
  )

  await Promise.all(
    defaultBaseFormulas.map((formula) =>
      tryCreate<ApiEntity & Omit<BaseFormula, "id">>("/menu/breakfast/formulas", {
          name: formula.name,
          description: formula.description,
          price: formula.price,
          points: formula.points,
          type: formula.type,
          image: formula.image,
          isActive: formula.isActive !== false,
        })
    )
  )

  const [createdItems, createdFormulas] = await Promise.all([
    fetchJson<Array<ApiEntity & Omit<BreakfastItem, "id">>>("/menu/breakfast/items"),
    fetchJson<Array<ApiEntity & Omit<BaseFormula, "id">>>("/menu/breakfast/formulas"),
  ])

  return {
    categories: createdCategories.map(mapCategory),
    items: createdItems.map(mapItem),
    formulas: createdFormulas.map(mapFormula),
  }
}

export function BreakfastProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<BreakfastCategory[]>(defaultCategories)
  const [items, setItems] = useState<BreakfastItem[]>(defaultItems)
  const [baseFormulas, setBaseFormulas] = useState<BaseFormula[]>(defaultBaseFormulas)
  const [selectedFormula, setSelectedFormula] = useState<FormulaType>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<BreakfastOrder[]>([])
  const [userTotalPoints, setUserTotalPoints] = useState(0)

  useEffect(() => {
    let cancelled = false

    const savedOrders = localStorage.getItem("breakfast-orders")
    const savedUserPoints = localStorage.getItem("user-total-points")

    if (savedOrders) setOrders(JSON.parse(savedOrders))
    if (savedUserPoints) setUserTotalPoints(parseInt(savedUserPoints) || 0)

    const loadBreakfastMenu = async () => {
      try {
        let [apiCategories, apiItems, apiFormulas] = await Promise.all([
          fetchJson<Array<ApiEntity & Omit<BreakfastCategory, "id">>>("/menu/breakfast/categories"),
          fetchJson<Array<ApiEntity & Omit<BreakfastItem, "id">>>("/menu/breakfast/items"),
          fetchJson<Array<ApiEntity & Omit<BaseFormula, "id">>>("/menu/breakfast/formulas"),
        ])

        const hasToken = !!localStorage.getItem(AUTH_TOKEN_KEY)
        if (apiCategories.length === 0 && apiItems.length === 0 && apiFormulas.length === 0 && hasToken) {
          const bootstrapped = await bootstrapBreakfastMenu()
          apiCategories = bootstrapped.categories
          apiItems = bootstrapped.items
          apiFormulas = bootstrapped.formulas
        }

        if (cancelled) return

        if (apiCategories.length > 0) {
          setCategories(apiCategories.map(mapCategory))
        }

        if (apiItems.length > 0) {
          setItems(apiItems.map(mapItem))
        }

        if (apiFormulas.length > 0) {
          setBaseFormulas(apiFormulas.map(mapFormula))
        }
      } catch (error) {
        console.error("Failed to load breakfast menu from backend:", error)
      }
    }

    void loadBreakfastMenu()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("breakfast-orders", JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem("user-total-points", userTotalPoints.toString())
  }, [userTotalPoints])

  const getItemsByCategory = (categoryId: string) => {
    return items.filter((item) => item.categoryId === categoryId && item.isAvailable)
  }

  const addCategory = (category: Omit<BreakfastCategory, "id">) => {
    void (async () => {
      try {
        const created = await fetchJson<ApiEntity & Omit<BreakfastCategory, "id">>("/menu/breakfast/categories", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(category),
        })
        setCategories((prev) => [...prev, mapCategory(created)].sort((a, b) => a.order - b.order))
      } catch (error) {
        console.error("Failed to create breakfast category:", error)
      }
    })()
  }

  const updateCategory = (id: string, updates: Partial<BreakfastCategory>) => {
    void (async () => {
      try {
        await fetchJson(`/menu/breakfast/categories/${id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(updates),
        })
        setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)))
      } catch (error) {
        console.error("Failed to update breakfast category:", error)
      }
    })()
  }

  const deleteCategory = (id: string) => {
    void (async () => {
      try {
        await fetchJson(`/menu/breakfast/categories/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        })
        setCategories((prev) => prev.filter((cat) => cat.id !== id))
        setItems((prev) => prev.filter((item) => item.categoryId !== id))
      } catch (error) {
        console.error("Failed to delete breakfast category:", error)
      }
    })()
  }

  const addItem = (item: Omit<BreakfastItem, "id">) => {
    void (async () => {
      try {
        const created = await fetchJson<ApiEntity & Omit<BreakfastItem, "id">>("/menu/breakfast/items", {
          method: "POST",
          headers: getAuthTokenHeader(),
          body: buildBreakfastItemFormData(item),
        })
        setItems((prev) => [...prev, mapItem(created)])
      } catch (error) {
        console.error("Failed to create breakfast item:", error)
      }
    })()
  }

  const updateItem = (id: string, updates: Partial<BreakfastItem>) => {
    void (async () => {
      try {
        await fetchJson(`/menu/breakfast/items/${id}`, {
          method: "PUT",
          headers: getAuthTokenHeader(),
          body: buildBreakfastItemFormData(updates),
        })
        setItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  ...updates,
                  imageFile: undefined,
                  removeImage: undefined,
                }
              : item
          )
        )
      } catch (error) {
        console.error("Failed to update breakfast item:", error)
      }
    })()
  }

  const deleteItem = (id: string) => {
    void (async () => {
      try {
        await fetchJson(`/menu/breakfast/items/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        })
        setItems((prev) => prev.filter((item) => item.id !== id))
      } catch (error) {
        console.error("Failed to delete breakfast item:", error)
      }
    })()
  }

  const selectFormula = (type: FormulaType) => {
    setSelectedFormula(type)
  }

  const getFormulaPrice = () => {
    if (!selectedFormula) return 0
    return baseFormulas.find((formula) => formula.type === selectedFormula && formula.isActive !== false)?.price || 0
  }

  const getFormulaPoints = () => {
    if (!selectedFormula) return 0
    return baseFormulas.find((formula) => formula.type === selectedFormula && formula.isActive !== false)?.points || 0
  }

  const updateFormula = (id: string, updates: Partial<BaseFormula>) => {
    void (async () => {
      try {
        await fetchJson(`/menu/breakfast/formulas/${id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(updates),
        })
        setBaseFormulas((prev) => prev.map((formula) => (formula.id === id ? { ...formula, ...updates } : formula)))
      } catch (error) {
        console.error("Failed to update breakfast formula:", error)
      }
    })()
  }

  const addToCart = (item: BreakfastItem, supplements?: SelectedSupplement[]) => {
    setCart((prev) => {
      if (supplements && supplements.length > 0) {
        const supplementKey = supplements.map((s) => `${s.supplementId}:${s.quantity}`).sort().join(",")
        const existing = prev.find(
          (cartItem) =>
            cartItem.item.id === item.id &&
            cartItem.selectedSupplements?.map((s) => `${s.supplementId}:${s.quantity}`).sort().join(",") === supplementKey
        )

        if (existing) {
          if (item.maxQuantity && existing.quantity >= item.maxQuantity) {
            return prev
          }
          return prev.map((cartItem) => (cartItem === existing ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem))
        }

        return [...prev, { item, quantity: 1, selectedSupplements: supplements }]
      }

      const existing = prev.find((cartItem) => cartItem.item.id === item.id && (!cartItem.selectedSupplements || cartItem.selectedSupplements.length === 0))
      if (existing) {
        if (item.maxQuantity && existing.quantity >= item.maxQuantity) {
          return prev
        }
        return prev.map((cartItem) => (cartItem === existing ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem))
      }

      return [...prev, { item, quantity: 1 }]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCart((prev) => prev.map((item) => (item.item.id === itemId ? { ...item, quantity } : item)))
  }

  const clearCart = () => {
    setCart([])
  }

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, { item, quantity, selectedSupplements }) => {
        const supplementsTotal = selectedSupplements
          ? selectedSupplements.reduce((supplementSum, supplement) => supplementSum + supplement.price * supplement.quantity, 0) * quantity
          : 0
        return sum + item.price * quantity + supplementsTotal
      }, 0),
    [cart]
  )

  const cartTotalPoints = useMemo(
    () =>
      cart.reduce((sum, { item, quantity, selectedSupplements }) => {
        const basePoints = (item.points || 0) * quantity
        const supplementsPoints = selectedSupplements
          ? selectedSupplements.reduce((supplementSum, supplement) => supplementSum + (supplement.points || 0) * supplement.quantity, 0) * quantity
          : 0
        return sum + basePoints + supplementsPoints
      }, 0),
    [cart]
  )

  const cartItemsCount = useMemo(() => cart.reduce((sum, { quantity }) => sum + quantity, 0), [cart])

  const createOrder = (note?: string, clientInfo?: { id?: string; email?: string; name?: string }): BreakfastOrder | null => {
    if (cart.length === 0 && !selectedFormula) return null

    const formulaItem: CartItem[] = selectedFormula
      ? [
          {
            item: {
              id: `formula-${selectedFormula}`,
              name: selectedFormula === "healthy" ? "Formule Healthy" : "Formule Classique",
              description: selectedFormula === "healthy" ? "The vert + Toast complet aux graines" : "Cafe au choix + Croissant nature",
              price: getFormulaPrice(),
              points: getFormulaPoints(),
              categoryId: "formule-base",
              isAvailable: true,
              isRequired: true,
            },
            quantity: 1,
          },
        ]
      : []

    const total = cartTotal + getFormulaPrice()
    const totalPoints = cartTotalPoints + getFormulaPoints()

    const order: BreakfastOrder = {
      id: `ORD-${Date.now()}`,
      items: [...formulaItem, ...cart],
      total,
      totalPoints,
      status: "pending",
      createdAt: new Date().toISOString(),
      customerNote: note,
      clientId: clientInfo?.id,
      clientEmail: clientInfo?.email,
      clientName: clientInfo?.name,
    }

    setOrders((prev) => [order, ...prev])
    clearCart()
    setSelectedFormula(null)
    return order
  }

  const validateOrder = (orderId: string, tableNumber: string, ticketNumber: string, staffId?: string) => {
    const orderToValidate = orders.find((order) => order.id === orderId)
    if (orderToValidate && orderToValidate.status === "pending") {
      const orderPoints = orderToValidate.items.reduce((sum, cartItem) => sum + ((cartItem.item?.points || 0) * cartItem.quantity), 0)
      setUserTotalPoints((prev) => prev + orderPoints)
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "validated",
              tableNumber,
              ticketNumber,
              validatedAt: new Date().toISOString(),
              validatedBy: staffId,
            }
          : order
      )
    )
  }

  const cancelOrder = (orderId: string) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: "cancelled" } : order)))
  }

  const pendingOrders = orders.filter((order) => order.status === "pending")
  const validatedOrders = orders.filter((order) => order.status === "validated")

  return (
    <BreakfastContext.Provider
      value={{
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
        userTotalPoints,
      }}
    >
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
