"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api-client"

// ============================================
// TYPES ET INTERFACES
// ============================================

export interface ProductSupplementConfig {
  supplementId: string
  isEnabled: boolean
  customPrice?: number
    id?: string
  name?: string
  price?: number
  description?: string
  points?: number
  category?: string
  isactive?: boolean
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

export type FormulaType = "normal" | "healthy" | "vegan" | "premium" | "enfants" | any

export interface BaseFormula {
  id: string
  name: string
  description: string
  price: number
  points?: number
  type: "normal" | "healthy" | "vegan" | "premium" | "enfants",
  image?: string
  isActive?: boolean
  imageFile?: File
  removeImage?: boolean
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

const defaultCategories: BreakfastCategory[] = []

const defaultItems: BreakfastItem[] = []

interface BreakfastContextType {
  categories: BreakfastCategory[]
  items: BreakfastItem[]
  getItemsByCategory: (categoryId: string) => BreakfastItem[]
  baseFormulas: BaseFormula[]
  selectedFormula: FormulaType
  selectFormula: (type: FormulaType) => void
  getFormulaPrice: () => number
  getFormulaPoints: () => number
  addFormula: (formula: Omit<BaseFormula, "id">) => void
  updateFormula: (id: string, formula: Partial<BaseFormula>) => void
  deleteFormula: (id: string) => void
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

async function tryCreate<T>(path: string, body: unknown): Promise<T | null> {
  try {
    return await apiPost<T>(path, body)
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (message.toLowerCase().includes("existe")) {
      return null
    }
    throw error
  }
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
  
   if (item.availableSupplements !== undefined && item.availableSupplements !== null) {
    const supplementsToSend = item.availableSupplements
      .filter(supp => supp.isEnabled === true) // Only send enabled supplements
      .map(supp => ({
        supplementId: supp.supplementId, // Send as string, backend will convert to ObjectId
        isEnabled: supp.isEnabled,
        customPrice: supp.customPrice
      }))
    formData.append("availableSupplements", JSON.stringify(supplementsToSend))
  }
  
  if (item.removeImage !== undefined) formData.append("removeImage", String(item.removeImage))
  if (item.imageFile) formData.append("imageFile", item.imageFile)

  return formData
}

function buildBreakfastFormulaFormData(formula: Partial<BaseFormula>) {
  const formData = new FormData()

  if (formula.name !== undefined) formData.append("name", formula.name)
  if (formula.description !== undefined) formData.append("description", formula.description)
  if (formula.price !== undefined) formData.append("price", String(formula.price))
  if (formula.points !== undefined) formData.append("points", String(formula.points))
  if (formula.type !== undefined && formula.type !== null) formData.append("type", formula.type)
  if (formula.image !== undefined) formData.append("image", formula.image)
  if (formula.isActive !== undefined) formData.append("isActive", String(formula.isActive))
  if (formula.removeImage !== undefined) formData.append("removeImage", String(formula.removeImage))
  if (formula.imageFile) formData.append("imageFile", formula.imageFile)

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

  const createdCategories = await apiGet<Array<ApiEntity & Omit<BreakfastCategory, "id">>>("/menu/breakfast/categories")
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
    apiGet<Array<ApiEntity & Omit<BreakfastItem, "id">>>("/menu/breakfast/items"),
    apiGet<Array<ApiEntity & Omit<BaseFormula, "id">>>("/menu/breakfast/formulas"),
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
          apiGet<Array<ApiEntity & Omit<BreakfastCategory, "id">>>("/menu/breakfast/categories"),
          apiGet<Array<ApiEntity & Omit<BreakfastItem, "id">>>("/menu/breakfast/items"),
          apiGet<Array<ApiEntity & Omit<BaseFormula, "id">>>("/menu/breakfast/formulas"),
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
        const created = await apiPost<ApiEntity & Omit<BreakfastCategory, "id">>("/menu/breakfast/categories", category)
        setCategories((prev) => [...prev, mapCategory(created)].sort((a, b) => a.order - b.order))
      } catch (error) {
        console.error("Failed to create breakfast category:", error)
      }
    })()
  }

  const updateCategory = (id: string, updates: Partial<BreakfastCategory>) => {
    void (async () => {
      try {
        await apiPut(`/menu/breakfast/categories/${id}`, updates)
        setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)))
      } catch (error) {
        console.error("Failed to update breakfast category:", error)
      }
    })()
  }

  const deleteCategory = (id: string) => {
    void (async () => {
      try {
        await apiDelete(`/menu/breakfast/categories/${id}`)
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
        const created = await apiPost<ApiEntity & Omit<BreakfastItem, "id">>(
          "/menu/breakfast/items",
          buildBreakfastItemFormData(item)
        )
        setItems((prev) => [...prev, mapItem(created)])
      } catch (error) {
        console.error("Failed to create breakfast item:", error)
      }
    })()
  }

 const updateItem = (id: string, updates: Partial<BreakfastItem>) => {
  void (async () => {
    try {
      // First, get the current item to preserve existing values
      const currentItem = items.find(item => item.id === id)
      if (!currentItem) {
        console.error("Item not found:", id)
        return
      }

      // Merge current item with updates
      const mergedItem: Partial<BreakfastItem> = {
        name: updates.name !== undefined ? updates.name : currentItem.name,
        description: updates.description !== undefined ? updates.description : currentItem.description,
        price: updates.price !== undefined ? updates.price : currentItem.price,
        points: updates.points !== undefined ? updates.points : currentItem.points,
        categoryId: updates.categoryId !== undefined ? updates.categoryId : currentItem.categoryId,
        image: updates.image !== undefined ? updates.image : currentItem.image,
        isAvailable: updates.isAvailable !== undefined ? updates.isAvailable : currentItem.isAvailable,
        isRequired: updates.isRequired !== undefined ? updates.isRequired : currentItem.isRequired,
        minQuantity: updates.minQuantity !== undefined ? updates.minQuantity : currentItem.minQuantity,
        maxQuantity: updates.maxQuantity !== undefined ? updates.maxQuantity : currentItem.maxQuantity,
        availableSupplements: updates.availableSupplements !== undefined ? updates.availableSupplements : currentItem.availableSupplements,
      }

      // Handle image removal
      if (updates.removeImage) {
        mergedItem.image = undefined
        mergedItem.removeImage = true
      }

      // Handle new image file
      if (updates.imageFile) {
        mergedItem.imageFile = updates.imageFile
      }

      const formData = buildBreakfastItemFormData(mergedItem)
      
      await apiPut(`/menu/breakfast/items/${id}`, formData)
      
      // Update local state with merged values
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...mergedItem,
                imageFile: undefined,
                removeImage: undefined,
              } as BreakfastItem
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
        await apiDelete(`/menu/breakfast/items/${id}`)
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

  const addFormula = (formula: Omit<BaseFormula, "id">) => {
    void (async () => {
      try {
        const created = await apiPost<ApiEntity & Omit<BaseFormula, "id">>(
          "/menu/breakfast/formulas",
          buildBreakfastFormulaFormData(formula)
        )
        setBaseFormulas((prev) => [...prev, mapFormula(created)])
      } catch (error) {
        console.error("Failed to create breakfast formula:", error)
      }
    })()
  }

  const updateFormula = (id: string, updates: Partial<BaseFormula>) => {
    void (async () => {
      try {
        const currentFormula = baseFormulas.find((formula) => formula.id === id)
        if (!currentFormula) {
          console.error("Formula not found:", id)
          return
        }

        const mergedFormula: Partial<BaseFormula> = {
          name: updates.name !== undefined ? updates.name : currentFormula.name,
          description: updates.description !== undefined ? updates.description : currentFormula.description,
          price: updates.price !== undefined ? updates.price : currentFormula.price,
          points: updates.points !== undefined ? updates.points : currentFormula.points,
          type: updates.type !== undefined ? updates.type : currentFormula.type,
          image: updates.image !== undefined ? updates.image : currentFormula.image,
          isActive: updates.isActive !== undefined ? updates.isActive : currentFormula.isActive,
        }

        if (updates.removeImage) {
          mergedFormula.image = undefined
          mergedFormula.removeImage = true
        }

        if (updates.imageFile) {
          mergedFormula.imageFile = updates.imageFile
        }

        await apiPut(`/menu/breakfast/formulas/${id}`, buildBreakfastFormulaFormData(mergedFormula))

        setBaseFormulas((prev) =>
          prev.map((formula) =>
            formula.id === id
              ? {
                  ...formula,
                  ...mergedFormula,
                  imageFile: undefined,
                  removeImage: undefined,
                }
              : formula
          )
        )
      } catch (error) {
        console.error("Failed to update breakfast formula:", error)
      }
    })()
  }

  const deleteFormula = (id: string) => {
    void (async () => {
      try {
        await apiDelete(`/menu/breakfast/formulas/${id}`)
        setBaseFormulas((prev) => prev.filter((formula) => formula.id !== id))
      } catch (error) {
        console.error("Failed to delete breakfast formula:", error)
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
        addFormula,
        updateFormula,
        deleteFormula,
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
