"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"

// Notification categories for grouping
export type NotificationCategory = 
  | "order"      // Nouvelles commandes, commandes confirmees, etc.
  | "stock"      // Stock bas, rupture, expiration
  | "production" // Production terminee, ordres de production
  | "client"     // Nouveaux clients, fidelite
  | "payment"    // Paiements recus, remboursements
  | "system"     // Alertes systeme, mises a jour

export type NotificationPriority = "low" | "medium" | "high" | "urgent"

export interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info"
  category: NotificationCategory
  priority: NotificationPriority
  title: string
  message?: string
  duration?: number
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
  metadata?: {
    orderId?: string
    productId?: string
    clientId?: string
    amount?: number
    [key: string]: any
  }
}

// Helper type for creating notifications - all fields except type and title are optional
export type CreateNotificationInput = {
  type: "success" | "error" | "warning" | "info"
  category?: NotificationCategory
  priority?: NotificationPriority
  title: string
  message?: string
  duration?: number
  actionUrl?: string
  actionLabel?: string
  metadata?: {
    orderId?: string
    productId?: string
    clientId?: string
    amount?: number
    [key: string]: any
  }
}

// Overload signatures for addNotification
interface NotificationContextType {
  notifications: Notification[]
  notificationHistory: Notification[]
  unreadCount: number
  unreadByCategory: Record<NotificationCategory, number>
  addNotification: {
    // Signature 1: Object format
    (notification: CreateNotificationInput): void
    // Signature 2: Simple format (type, title, message?)
    (type: "success" | "error" | "warning" | "info", title: string, message?: string): void
  }
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  markCategoryAsRead: (category: NotificationCategory) => void
  clearHistory: () => void
  deleteNotification: (id: string) => void
  getNotificationsByCategory: (category: NotificationCategory) => Notification[]
  getNotificationsByPriority: (priority: NotificationPriority) => Notification[]
  getRecentNotifications: (limit?: number) => Notification[]
  notifyNewOrder: (orderId: string, clientName: string, total: number) => void
  notifyOrderConfirmed: (orderId: string, clientName: string) => void
  notifyLowStock: (productName: string, currentStock: number, minStock: number) => void
  notifyOutOfStock: (productName: string) => void
  notifyExpiringSoon: (productName: string, hoursUntil: number) => void
  notifyProductionComplete: (recipeName: string, quantity: number) => void
  notifyNewClient: (clientName: string) => void
  notifyPaymentReceived: (amount: number, method: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

const STORAGE_KEY = "notification_history_v2"
const MAX_HISTORY = 200

// Category display info
export const CATEGORY_INFO: Record<NotificationCategory, { label: string; icon: string; color: string }> = {
  order: { label: "Commandes", icon: "ShoppingBagIcon", color: "blue" },
  stock: { label: "Stock", icon: "PackageIcon", color: "orange" },
  production: { label: "Production", icon: "ChefHatIcon", color: "purple" },
  client: { label: "Clients", icon: "UsersIcon", color: "green" },
  payment: { label: "Paiements", icon: "CreditCardIcon", color: "emerald" },
  system: { label: "Systeme", icon: "SettingsIcon", color: "slate" },
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationHistory, setNotificationHistory] = useState<Notification[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setNotificationHistory(
          parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
            category: n.category || "system",
            priority: n.priority || "medium",
          })),
        )
      } catch (e) {
        console.error("Failed to load notification history", e)
      }
    }
  }, [])

  // Save to localStorage when history changes
  useEffect(() => {
    if (notificationHistory.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notificationHistory))
    }
  }, [notificationHistory])

  // Calculate unread counts
  const unreadCount = notificationHistory.filter((n) => !n.read).length
  
  const unreadByCategory = notificationHistory.reduce((acc, n) => {
    if (!n.read) {
      acc[n.category] = (acc[n.category] || 0) + 1
    }
    return acc
  }, {} as Record<NotificationCategory, number>)

  // Core add notification function (internal)
  const addNotificationCore = useCallback((input: CreateNotificationInput) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 9)
    const newNotification: Notification = {
      id,
      type: input.type,
      category: input.category || "system",
      priority: input.priority || "medium",
      title: input.title,
      message: input.message,
      duration: input.duration ?? 5000,
      timestamp: new Date(),
      read: false,
      actionUrl: input.actionUrl,
      actionLabel: input.actionLabel,
      metadata: input.metadata,
    }

    setNotifications((prev) => [...prev, newNotification])
    setNotificationHistory((prev) => [newNotification, ...prev].slice(0, MAX_HISTORY))

    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }, [])

  // Overloaded addNotification function
  const addNotification = useCallback((
    arg1: CreateNotificationInput | "success" | "error" | "warning" | "info",
    arg2?: string,
    arg3?: string
  ) => {
    // Check if first argument is an object (object format)
    if (typeof arg1 === 'object' && arg1 !== null && 'type' in arg1 && 'title' in arg1) {
      // Object format
      addNotificationCore(arg1 as CreateNotificationInput)
    } else {
      // Simple format: (type, title, message?)
      addNotificationCore({
        type: arg1 as "success" | "error" | "warning" | "info",
        title: arg2 || "",
        message: arg3,
      })
    }
  }, [addNotificationCore])

  // Remove notification (from active toasts only)
  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Mark as read
  const markAsRead = useCallback((id: string) => {
    setNotificationHistory((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotificationHistory((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  // Mark category as read
  const markCategoryAsRead = useCallback((category: NotificationCategory) => {
    setNotificationHistory((prev) => 
      prev.map((n) => (n.category === category ? { ...n, read: true } : n))
    )
  }, [])

  // Clear all history
  const clearHistory = useCallback(() => {
    setNotificationHistory([])
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  // Delete single notification from history
  const deleteNotification = useCallback((id: string) => {
    setNotificationHistory((prev) => prev.filter((n) => n.id !== id))
  }, [])

  // Get notifications by category
  const getNotificationsByCategory = useCallback((category: NotificationCategory) => {
    return notificationHistory.filter((n) => n.category === category)
  }, [notificationHistory])

  // Get notifications by priority
  const getNotificationsByPriority = useCallback((priority: NotificationPriority) => {
    return notificationHistory.filter((n) => n.priority === priority)
  }, [notificationHistory])

  // Get recent notifications
  const getRecentNotifications = useCallback((limit: number = 10) => {
    return notificationHistory.slice(0, limit)
  }, [notificationHistory])

  // Convenience notification generators
  const notifyNewOrder = useCallback((orderId: string, clientName: string, total: number) => {
    addNotification({
      type: "info",
      category: "order",
      priority: "high",
      title: "Nouvelle commande",
      message: `${clientName} - ${total.toFixed(2)} TND`,
      actionUrl: "/admin/ventes",
      actionLabel: "Voir la commande",
      metadata: { orderId, amount: total },
    })
  }, [addNotification])

  const notifyOrderConfirmed = useCallback((orderId: string, clientName: string) => {
    addNotification({
      type: "success",
      category: "order",
      priority: "medium",
      title: "Commande confirmee",
      message: `La commande de ${clientName} a ete confirmee`,
      metadata: { orderId },
    })
  }, [addNotification])

  const notifyLowStock = useCallback((productName: string, currentStock: number, minStock: number) => {
    addNotification({
      type: "warning",
      category: "stock",
      priority: "high",
      title: "Stock bas",
      message: `${productName}: ${currentStock}/${minStock} unites`,
      actionUrl: "/admin/stock",
      actionLabel: "Gerer le stock",
    })
  }, [addNotification])

  const notifyOutOfStock = useCallback((productName: string) => {
    addNotification({
      type: "error",
      category: "stock",
      priority: "urgent",
      title: "Rupture de stock",
      message: `${productName} est en rupture de stock`,
      actionUrl: "/admin/stock",
      actionLabel: "Commander",
    })
  }, [addNotification])

  const notifyExpiringSoon = useCallback((productName: string, hoursUntil: number) => {
    addNotification({
      type: "warning",
      category: "stock",
      priority: hoursUntil <= 6 ? "urgent" : "high",
      title: "Expiration proche",
      message: `${productName} expire dans ${hoursUntil}h`,
      actionUrl: "/admin/stock",
      actionLabel: "Voir le stock",
    })
  }, [addNotification])

  const notifyProductionComplete = useCallback((recipeName: string, quantity: number) => {
    addNotification({
      type: "success",
      category: "production",
      priority: "medium",
      title: "Production terminee",
      message: `${quantity}x ${recipeName} prets`,
      actionUrl: "/admin/production",
      actionLabel: "Voir la production",
    })
  }, [addNotification])

  const notifyNewClient = useCallback((clientName: string) => {
    addNotification({
      type: "success",
      category: "client",
      priority: "low",
      title: "Nouveau client",
      message: `${clientName} a rejoint le programme fidelite`,
      actionUrl: "/admin/clients",
      actionLabel: "Voir le client",
    })
  }, [addNotification])

  const notifyPaymentReceived = useCallback((amount: number, method: string) => {
    addNotification({
      type: "success",
      category: "payment",
      priority: "medium",
      title: "Paiement recu",
      message: `${amount.toFixed(2)} TND via ${method}`,
    })
  }, [addNotification])

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        notificationHistory,
        unreadCount,
        unreadByCategory,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        markCategoryAsRead,
        clearHistory,
        deleteNotification,
        getNotificationsByCategory,
        getNotificationsByPriority,
        getRecentNotifications,
        notifyNewOrder,
        notifyOrderConfirmed,
        notifyLowStock,
        notifyOutOfStock,
        notifyExpiringSoon,
        notifyProductionComplete,
        notifyNewClient,
        notifyPaymentReceived,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider")
  }
  return context
}