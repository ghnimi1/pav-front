"use client"

import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { apiGet, apiPatch, apiPost, apiPut } from "@/lib/api-client"

export type OrderStatus = "new" | "confirmed" | "preparing" | "ready" | "delivering" | "completed" | "cancelled"
export type DeliveryMode = "delivery" | "pickup"
export type PaymentMethod = "cash_on_delivery" | "cash_on_pickup"

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  points?: number
  supplements?: { name: string; price: number }[]
  note?: string
}

export interface DeliveryAddress {
  fullName: string
  phone: string
  address: string
  city: string
  postalCode?: string
  instructions?: string
}

export interface RemoteOrder {
  id: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  totalPoints: number
  status: OrderStatus
  deliveryMode: DeliveryMode
  paymentMethod: PaymentMethod
  deliveryAddress?: DeliveryAddress
  pickupTime?: string
  estimatedTime: number
  createdAt: string
  confirmedAt?: string
  readyAt?: string
  completedAt?: string
  cancelledAt?: string
  cancelReason?: string
  clientId?: string
  clientEmail?: string
  clientName?: string
  clientPhone?: string
  confirmedBy?: string
  completedBy?: string
  customerNote?: string
  staffNote?: string
}

export interface DeliveryConfig {
  deliveryEnabled: boolean
  pickupEnabled: boolean
  deliveryFee: number
  freeDeliveryThreshold: number
  estimatedDeliveryTime: number
  estimatedPickupTime: number
  deliveryZones: string[]
  minOrderAmount: number
  maxDeliveryDistance?: number
}

interface OrdersContextType {
  orders: RemoteOrder[]
  getOrderById: (id: string) => RemoteOrder | undefined
  getOrdersByStatus: (status: OrderStatus) => RemoteOrder[]
  getOrdersByClient: (clientEmail: string) => RemoteOrder[]
  cart: OrderItem[]
  addToCart: (item: OrderItem) => void
  removeFromCart: (itemId: string) => void
  updateCartItemQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
  cartItemsCount: number
  cartTotalPoints: number
  createOrder: (
    deliveryMode: DeliveryMode,
    paymentMethod: PaymentMethod,
    clientInfo: { id?: string; email?: string; name?: string; phone?: string },
    deliveryAddress?: DeliveryAddress,
    pickupTime?: string,
    customerNote?: string
  ) => Promise<RemoteOrder | null>
  createOrderFromItems: (
    items: OrderItem[],
    deliveryMode: DeliveryMode,
    paymentMethod: PaymentMethod,
    clientInfo: { id?: string; email?: string; name?: string; phone?: string },
    deliveryAddress?: DeliveryAddress,
    pickupTime?: string,
    customerNote?: string
  ) => Promise<RemoteOrder | null>
  updateOrderStatus: (orderId: string, status: OrderStatus, staffId?: string) => Promise<void>
  cancelOrder: (orderId: string, reason?: string) => Promise<void>
  addStaffNote: (orderId: string, note: string) => Promise<void>
  deliveryConfig: DeliveryConfig
  updateDeliveryConfig: (config: Partial<DeliveryConfig>) => Promise<void>
  getDeliveryFee: (subtotal: number) => number
  getEstimatedTime: (mode: DeliveryMode) => number
}

const AUTH_TOKEN_KEY = "authToken"

const defaultDeliveryConfig: DeliveryConfig = {
  deliveryEnabled: true,
  pickupEnabled: true,
  deliveryFee: 5.0,
  freeDeliveryThreshold: 50.0,
  estimatedDeliveryTime: 45,
  estimatedPickupTime: 20,
  deliveryZones: ["Tunis", "Ariana", "Ben Arous", "Manouba"],
  minOrderAmount: 15.0,
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

function getAuthToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

function getCurrentUser() {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("currentUser")
  if (!raw) return null
  try {
    return JSON.parse(raw) as { role?: string; email?: string }
  } catch {
    return null
  }
}

function normalizeOrder(order: any): RemoteOrder {
  return {
    ...order,
    id: order.id || order._id,
  }
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<RemoteOrder[]>([])
  const [cart, setCart] = useState<OrderItem[]>([])
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>(defaultDeliveryConfig)
  const [orderCounter, setOrderCounter] = useState(1000)

  useEffect(() => {
    const savedCart = localStorage.getItem("remote-cart")
    const savedConfig = localStorage.getItem("delivery-config")
    const savedOrders = localStorage.getItem("remote-orders")
    const savedCounter = localStorage.getItem("order-counter")

    if (savedCart) setCart(JSON.parse(savedCart))
    if (savedConfig) setDeliveryConfig({ ...defaultDeliveryConfig, ...JSON.parse(savedConfig) })
    if (savedOrders) setOrders(JSON.parse(savedOrders))
    if (savedCounter) setOrderCounter(parseInt(savedCounter, 10))

    const loadData = async () => {
      try {
        const config = await apiGet<DeliveryConfig>("/orders/config")
        setDeliveryConfig(config)
        localStorage.setItem("delivery-config", JSON.stringify(config))
      } catch (error) {
        console.error("Failed to load delivery config:", error)
      }

      try {
        const currentUser = getCurrentUser()
        const token = getAuthToken()
        if (!token || !currentUser?.role) return

        if (currentUser.role === "admin") {
          const apiOrders = await apiGet<RemoteOrder[]>("/orders/all")
          const normalizedOrders = apiOrders.map(normalizeOrder)
          setOrders(normalizedOrders)
          localStorage.setItem("remote-orders", JSON.stringify(normalizedOrders))
          return
        }

        if (currentUser.role === "client") {
          const apiOrders = await apiGet<RemoteOrder[]>("/orders/my")
          const normalizedOrders = apiOrders.map(normalizeOrder)
          setOrders(normalizedOrders)
          localStorage.setItem("remote-orders", JSON.stringify(normalizedOrders))
        }
      } catch (error) {
        console.error("Failed to load orders:", error)
      }
    }

    void loadData()
  }, [])

  useEffect(() => {
    localStorage.setItem("remote-cart", JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem("remote-orders", JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem("delivery-config", JSON.stringify(deliveryConfig))
  }, [deliveryConfig])

  useEffect(() => {
    localStorage.setItem("order-counter", orderCounter.toString())
  }, [orderCounter])

  const cartTotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const supplementsTotal = item.supplements?.reduce((acc, sup) => acc + sup.price, 0) || 0
        return sum + (item.price + supplementsTotal) * item.quantity
      }, 0),
    [cart]
  )

  const cartItemsCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart])

  const cartTotalPoints = useMemo(
    () => cart.reduce((sum, item) => sum + (item.points || Math.floor(item.price)) * item.quantity, 0),
    [cart]
  )

  const addToCart = (item: OrderItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i))
      }
      return [...prev, item]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId))
  }

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    setCart((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)))
  }

  const clearCart = () => setCart([])

  const getOrderById = (id: string) => orders.find((o) => o.id === id)
  const getOrdersByStatus = (status: OrderStatus) => orders.filter((o) => o.status === status)
  const getOrdersByClient = (clientEmail: string) => orders.filter((o) => o.clientEmail === clientEmail)

  const getDeliveryFee = (subtotal: number) => {
    if (!deliveryConfig.deliveryEnabled) return 0
    if (subtotal >= deliveryConfig.freeDeliveryThreshold) return 0
    return deliveryConfig.deliveryFee
  }

  const getEstimatedTime = (mode: DeliveryMode) => {
    return mode === "delivery" ? deliveryConfig.estimatedDeliveryTime : deliveryConfig.estimatedPickupTime
  }

  const createOrder: OrdersContextType["createOrder"] = async (
    deliveryMode,
    paymentMethod,
    clientInfo,
    deliveryAddress,
    pickupTime,
    customerNote
  ) => {
    return createOrderFromItems(cart, deliveryMode, paymentMethod, clientInfo, deliveryAddress, pickupTime, customerNote, true)
  }

  const createOrderFromItems = async (
    items: OrderItem[],
    deliveryMode,
    paymentMethod,
    clientInfo,
    deliveryAddress,
    pickupTime,
    customerNote,
    clearProviderCart = false
  ): Promise<RemoteOrder | null> => {
    if (items.length === 0) return null

    const itemsTotal = items.reduce((sum, item) => {
      const supplementsTotal = item.supplements?.reduce((acc, sup) => acc + sup.price, 0) || 0
      return sum + (item.price + supplementsTotal) * item.quantity
    }, 0)

    const itemsTotalPoints = items.reduce(
      (sum, item) => sum + (item.points || Math.floor(item.price)) * item.quantity,
      0
    )

    if (itemsTotal < deliveryConfig.minOrderAmount) return null

    try {
      const order = normalizeOrder(
        await apiPost<RemoteOrder>("/orders", {
            items,
            subtotal: itemsTotal,
            total: itemsTotal + (deliveryMode === "delivery" ? getDeliveryFee(itemsTotal) : 0),
            totalPoints: itemsTotalPoints,
            deliveryMode,
            paymentMethod,
            deliveryAddress,
            pickupTime,
            clientId: clientInfo.id,
            clientEmail: clientInfo.email,
            clientName: clientInfo.name,
            clientPhone: clientInfo.phone,
            customerNote,
          })
      )

      setOrders((prev) => [order, ...prev])
      if (clearProviderCart) {
        clearCart()
      }
      return order
    } catch (error) {
      console.error("Failed to create remote order, using local fallback:", error)

      const newCounter = orderCounter + 1
      setOrderCounter(newCounter)

      const deliveryFee = deliveryMode === "delivery" ? getDeliveryFee(itemsTotal) : 0
      const fallbackOrder: RemoteOrder = {
        id: `RO-${Date.now()}`,
        orderNumber: `CMD-${newCounter}`,
        items: [...items],
        subtotal: itemsTotal,
        deliveryFee,
        total: itemsTotal + deliveryFee,
        totalPoints: itemsTotalPoints,
        status: "new",
        deliveryMode,
        paymentMethod,
        deliveryAddress,
        pickupTime,
        estimatedTime: getEstimatedTime(deliveryMode),
        createdAt: new Date().toISOString(),
        clientId: clientInfo.id,
        clientEmail: clientInfo.email,
        clientName: clientInfo.name,
        clientPhone: clientInfo.phone,
        customerNote,
      }

      setOrders((prev) => [fallbackOrder, ...prev])
      if (clearProviderCart) {
        clearCart()
      }
      return fallbackOrder
    }
  }

  const updateOrderStatus: OrdersContextType["updateOrderStatus"] = async (orderId, status, staffId) => {
    try {
      await apiPatch("/orders/" + orderId + "/status", { status, staffId })
    } catch (error) {
      console.error("Failed to update order status in API:", error)
    }

    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId) return order

        const now = new Date().toISOString()
        const updates: Partial<RemoteOrder> = { status }
        if (status === "confirmed") {
          updates.confirmedAt = now
          updates.confirmedBy = staffId
        } else if (status === "ready") {
          updates.readyAt = now
        } else if (status === "completed") {
          updates.completedAt = now
          updates.completedBy = staffId
        }
        return { ...order, ...updates }
      })
    )
  }

  const cancelOrder: OrdersContextType["cancelOrder"] = async (orderId, reason) => {
    try {
      await apiPatch("/orders/" + orderId + "/cancel", { reason })
    } catch (error) {
      console.error("Failed to cancel order in API:", error)
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status: "cancelled",
              cancelledAt: new Date().toISOString(),
              cancelReason: reason,
            }
          : order
      )
    )
  }

  const addStaffNote: OrdersContextType["addStaffNote"] = async (orderId, note) => {
    try {
      await apiPatch("/orders/" + orderId + "/staff-note", { note })
    } catch (error) {
      console.error("Failed to save staff note in API:", error)
    }

    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, staffNote: note } : order)))
  }

  const updateDeliveryConfig: OrdersContextType["updateDeliveryConfig"] = async (config) => {
    try {
      const nextConfig = await apiPut<DeliveryConfig>("/orders/config", config)
      setDeliveryConfig(nextConfig)
      return
    } catch (error) {
      console.error("Failed to update delivery config in API:", error)
    }

    setDeliveryConfig((prev) => ({ ...prev, ...config }))
  }

  return (
    <OrdersContext.Provider
      value={{
        orders,
        getOrderById,
        getOrdersByStatus,
        getOrdersByClient,
        cart,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        cartTotal,
        cartItemsCount,
        cartTotalPoints,
        createOrder,
        createOrderFromItems,
        updateOrderStatus,
        cancelOrder,
        addStaffNote,
        deliveryConfig,
        updateDeliveryConfig,
        getDeliveryFee,
        getEstimatedTime,
      }}
    >
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrdersContext)
  if (!context) {
    throw new Error("useOrders must be used within an OrdersProvider")
  }
  return context
}
