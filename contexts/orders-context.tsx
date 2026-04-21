"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Types
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
  estimatedTime: number // in minutes
  createdAt: string
  confirmedAt?: string
  readyAt?: string
  completedAt?: string
  cancelledAt?: string
  cancelReason?: string
  // Client info
  clientId?: string
  clientEmail?: string
  clientName?: string
  clientPhone?: string
  // Staff info
  confirmedBy?: string
  completedBy?: string
  // Notes
  customerNote?: string
  staffNote?: string
}

export interface DeliveryConfig {
  deliveryEnabled: boolean
  pickupEnabled: boolean
  deliveryFee: number
  freeDeliveryThreshold: number
  estimatedDeliveryTime: number // minutes
  estimatedPickupTime: number // minutes
  deliveryZones: string[]
  minOrderAmount: number
  maxDeliveryDistance?: number
}

interface OrdersContextType {
  // Orders
  orders: RemoteOrder[]
  getOrderById: (id: string) => RemoteOrder | undefined
  getOrdersByStatus: (status: OrderStatus) => RemoteOrder[]
  getOrdersByClient: (clientEmail: string) => RemoteOrder[]
  
  // Cart
  cart: OrderItem[]
  addToCart: (item: OrderItem) => void
  removeFromCart: (itemId: string) => void
  updateCartItemQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  cartTotal: number
  cartItemsCount: number
  cartTotalPoints: number
  
  // Order creation
  createOrder: (
    deliveryMode: DeliveryMode,
    paymentMethod: PaymentMethod,
    clientInfo: { id?: string; email?: string; name?: string; phone?: string },
    deliveryAddress?: DeliveryAddress,
    pickupTime?: string,
    customerNote?: string
  ) => RemoteOrder | null
  
  // Order management (admin)
  updateOrderStatus: (orderId: string, status: OrderStatus, staffId?: string) => void
  cancelOrder: (orderId: string, reason?: string) => void
  addStaffNote: (orderId: string, note: string) => void
  
  // Config
  deliveryConfig: DeliveryConfig
  updateDeliveryConfig: (config: Partial<DeliveryConfig>) => void
  getDeliveryFee: (subtotal: number) => number
  getEstimatedTime: (mode: DeliveryMode) => number
}

const defaultDeliveryConfig: DeliveryConfig = {
  deliveryEnabled: true,
  pickupEnabled: true,
  deliveryFee: 5.00,
  freeDeliveryThreshold: 50.00,
  estimatedDeliveryTime: 45,
  estimatedPickupTime: 20,
  deliveryZones: ["Tunis", "Ariana", "Ben Arous", "Manouba"],
  minOrderAmount: 15.00,
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<RemoteOrder[]>([])
  const [cart, setCart] = useState<OrderItem[]>([])
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryConfig>(defaultDeliveryConfig)
  const [orderCounter, setOrderCounter] = useState(1000)

  // Load from localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem("remote-orders")
    const savedCart = localStorage.getItem("remote-cart")
    const savedConfig = localStorage.getItem("delivery-config")
    const savedCounter = localStorage.getItem("order-counter")
    
    if (savedOrders) setOrders(JSON.parse(savedOrders))
    if (savedCart) setCart(JSON.parse(savedCart))
    if (savedConfig) setDeliveryConfig({ ...defaultDeliveryConfig, ...JSON.parse(savedConfig) })
    if (savedCounter) setOrderCounter(parseInt(savedCounter))
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("remote-orders", JSON.stringify(orders))
  }, [orders])

  useEffect(() => {
    localStorage.setItem("remote-cart", JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem("delivery-config", JSON.stringify(deliveryConfig))
  }, [deliveryConfig])

  useEffect(() => {
    localStorage.setItem("order-counter", orderCounter.toString())
  }, [orderCounter])

  // Cart calculations
  const cartTotal = cart.reduce((sum, item) => {
    const supplementsTotal = item.supplements?.reduce((s, sup) => s + sup.price, 0) || 0
    return sum + (item.price + supplementsTotal) * item.quantity
  }, 0)

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const cartTotalPoints = cart.reduce((sum, item) => {
    return sum + (item.points || Math.floor(item.price)) * item.quantity
  }, 0)

  // Cart functions
  const addToCart = (item: OrderItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => 
          i.id === item.id 
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      }
      return [...prev, item]
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId))
  }

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }
    setCart(prev => prev.map(i => 
      i.id === itemId ? { ...i, quantity } : i
    ))
  }

  const clearCart = () => setCart([])

  // Order functions
  const getOrderById = (id: string) => orders.find(o => o.id === id)

  const getOrdersByStatus = (status: OrderStatus) => 
    orders.filter(o => o.status === status)

  const getOrdersByClient = (clientEmail: string) => 
    orders.filter(o => o.clientEmail === clientEmail)

  const getDeliveryFee = (subtotal: number) => {
    if (!deliveryConfig.deliveryEnabled) return 0
    if (subtotal >= deliveryConfig.freeDeliveryThreshold) return 0
    return deliveryConfig.deliveryFee
  }

  const getEstimatedTime = (mode: DeliveryMode) => {
    return mode === "delivery" 
      ? deliveryConfig.estimatedDeliveryTime 
      : deliveryConfig.estimatedPickupTime
  }

  const createOrder = (
    deliveryMode: DeliveryMode,
    paymentMethod: PaymentMethod,
    clientInfo: { id?: string; email?: string; name?: string; phone?: string },
    deliveryAddress?: DeliveryAddress,
    pickupTime?: string,
    customerNote?: string
  ): RemoteOrder | null => {
    if (cart.length === 0) return null
    if (cartTotal < deliveryConfig.minOrderAmount) return null

    const newCounter = orderCounter + 1
    setOrderCounter(newCounter)

    const deliveryFee = deliveryMode === "delivery" ? getDeliveryFee(cartTotal) : 0

    const order: RemoteOrder = {
      id: `RO-${Date.now()}`,
      orderNumber: `CMD-${newCounter}`,
      items: [...cart],
      subtotal: cartTotal,
      deliveryFee,
      total: cartTotal + deliveryFee,
      totalPoints: cartTotalPoints,
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

    setOrders(prev => [order, ...prev])
    clearCart()
    return order
  }

  const updateOrderStatus = (orderId: string, status: OrderStatus, staffId?: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order
      
      const updates: Partial<RemoteOrder> = { status }
      
      if (status === "confirmed") {
        updates.confirmedAt = new Date().toISOString()
        updates.confirmedBy = staffId
      } else if (status === "ready") {
        updates.readyAt = new Date().toISOString()
      } else if (status === "completed") {
        updates.completedAt = new Date().toISOString()
        updates.completedBy = staffId
      }
      
      return { ...order, ...updates }
    }))
  }

  const cancelOrder = (orderId: string, reason?: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: "cancelled" as OrderStatus, 
            cancelledAt: new Date().toISOString(),
            cancelReason: reason 
          }
        : order
    ))
  }

  const addStaffNote = (orderId: string, note: string) => {
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...order, staffNote: note } : order
    ))
  }

  const updateDeliveryConfig = (config: Partial<DeliveryConfig>) => {
    setDeliveryConfig(prev => ({ ...prev, ...config }))
  }

  return (
    <OrdersContext.Provider value={{
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
      updateOrderStatus,
      cancelOrder,
      addStaffNote,
      deliveryConfig,
      updateDeliveryConfig,
      getDeliveryFee,
      getEstimatedTime,
    }}>
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
