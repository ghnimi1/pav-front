"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api-client"

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
  _id?: string
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
  hasMoreNotifications: boolean
  isLoadingNotifications: boolean
  loadMoreNotifications: () => Promise<void>
  addNotification: {
    // Signature 1: Object format
    (notification: CreateNotificationInput): void
    // Signature 2: Simple format (type, title, message?)
    (type: "success" | "error" | "warning" | "info", title: string, message?: string): void
    // Signature 3: Legacy format used in older screens (title, type, message?)
    (title: string, type: "success" | "error" | "warning" | "info", message?: string): void
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

const MAX_HISTORY = 200
const PAGE_SIZE = 8
const NOTIFICATION_TYPES = ["success", "error", "warning", "info"] as const

type PaginatedNotificationsResponse = {
  notifications: Notification[]
  total: number
  unread: number
  limit: number
  skip: number
  hasMore: boolean
}

function normalizeNotification(n: any): Notification {
  return {
    ...n,
    id: n.id || n._id,
    timestamp: new Date(n.timestamp || n.createdAt),
    category: n.category || "system",
    priority: n.priority || "medium",
    read: n.read === true,
  }
}

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
  const [remoteUnreadCount, setRemoteUnreadCount] = useState<number | null>(null)
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false)
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [nextNotificationSkip, setNextNotificationSkip] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined" || !localStorage.getItem("authToken")) return

    const loadRemoteNotifications = async () => {
      try {
        setIsLoadingNotifications(true)
        const response = await apiGet<PaginatedNotificationsResponse>(`/notifications?limit=${PAGE_SIZE}&skip=0`)
        const normalized = response.notifications.map(normalizeNotification)
        setNotificationHistory(normalized)
        setRemoteUnreadCount(response.unread)
        setHasMoreNotifications(response.hasMore)
        setNextNotificationSkip(normalized.length)
      } catch (error) {
        console.error("Failed to load remote notifications", error)
      } finally {
        setIsLoadingNotifications(false)
      }
    }

    void loadRemoteNotifications()
  }, [])

  const loadMoreNotifications = useCallback(async () => {
    if (isLoadingNotifications || !hasMoreNotifications) return
    if (typeof window === "undefined" || !localStorage.getItem("authToken")) return

    try {
      setIsLoadingNotifications(true)
      const response = await apiGet<PaginatedNotificationsResponse>(
        `/notifications?limit=${PAGE_SIZE}&skip=${nextNotificationSkip}`
      )
      const normalized = response.notifications.map(normalizeNotification)
      setNotificationHistory((prev) => {
        const existingIds = new Set(prev.map((notification) => notification.id))
        return [...prev, ...normalized.filter((notification) => !existingIds.has(notification.id))]
      })
      setRemoteUnreadCount(response.unread)
      setHasMoreNotifications(response.hasMore)
      setNextNotificationSkip((prev) => prev + normalized.length)
    } catch (error) {
      console.error("Failed to load more notifications", error)
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [hasMoreNotifications, isLoadingNotifications, nextNotificationSkip])

  // Calculate unread counts
  const unreadCount = remoteUnreadCount ?? notificationHistory.filter((n) => !n.read).length
  
  const unreadByCategory = notificationHistory.reduce((acc, n) => {
    if (!n.read) {
      acc[n.category] = (acc[n.category] || 0) + 1
    }
    return acc
  }, {} as Record<NotificationCategory, number>)

  // Core add notification function (internal)
  const addNotificationCore = useCallback((input: CreateNotificationInput, syncRemote = true) => {
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
    setRemoteUnreadCount((prev) => (prev === null ? null : prev + 1))

    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    if (syncRemote && typeof window !== "undefined" && localStorage.getItem("authToken")) {
      void apiPost<Notification>("/notifications", {
        ...input,
        read: false,
      }).then((remoteNotification: any) => {
        setNotificationHistory((prev) => {
          const withoutLocal = prev.filter((n) => n.id !== id)
          return [{
            ...newNotification,
            ...remoteNotification,
            id: remoteNotification.id || remoteNotification._id || id,
            timestamp: new Date(remoteNotification.timestamp || remoteNotification.createdAt || newNotification.timestamp),
          }, ...withoutLocal].slice(0, MAX_HISTORY)
        })
      }).catch((error) => {
        console.error("Failed to sync notification", error)
      })
    }
  }, [])

  // Overloaded addNotification function
  const addNotification = useCallback((
    arg1: CreateNotificationInput | "success" | "error" | "warning" | "info",
    arg2?: string,
    arg3?: string
  ) => {
    if (typeof arg1 === 'object' && arg1 !== null && 'type' in arg1 && 'title' in arg1) {
      addNotificationCore(arg1 as CreateNotificationInput)
    } else if (
      typeof arg1 === "string" &&
      typeof arg2 === "string" &&
      NOTIFICATION_TYPES.includes(arg2 as any) &&
      !NOTIFICATION_TYPES.includes(arg1 as any)
    ) {
      addNotificationCore({
        type: arg2 as "success" | "error" | "warning" | "info",
        title: arg1,
        message: arg3,
      })
    } else {
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
    setNotificationHistory((prev) => {
      const wasUnread = prev.some((n) => n.id === id && !n.read)
      if (wasUnread) setRemoteUnreadCount((count) => count === null ? null : Math.max(0, count - 1))
      return prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    })
    if (typeof window !== "undefined" && localStorage.getItem("authToken")) {
      void apiPatch(`/notifications/${id}/read`).catch((error) => {
        console.error("Failed to mark notification as read", error)
      })
    }
  }, [])

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotificationHistory((prev) => prev.map((n) => ({ ...n, read: true })))
    setRemoteUnreadCount(0)
    if (typeof window !== "undefined" && localStorage.getItem("authToken")) {
      void apiPatch("/notifications/read-all").catch((error) => {
        console.error("Failed to mark notifications as read", error)
      })
    }
  }, [])

  // Mark category as read
  const markCategoryAsRead = useCallback((category: NotificationCategory) => {
    setNotificationHistory((prev) => 
      prev.map((n) => (n.category === category ? { ...n, read: true } : n))
    )
    setRemoteUnreadCount(null)
    if (typeof window !== "undefined" && localStorage.getItem("authToken")) {
      void apiPatch("/notifications/read-all", { category }).catch((error) => {
        console.error("Failed to mark category notifications as read", error)
      })
    }
  }, [])

  // Clear all history
  const clearHistory = useCallback(() => {
    setNotificationHistory([])
    setRemoteUnreadCount(0)
    setHasMoreNotifications(false)
    setNextNotificationSkip(0)
    if (typeof window !== "undefined" && localStorage.getItem("authToken")) {
      void apiDelete("/notifications").catch((error) => {
        console.error("Failed to clear notifications", error)
      })
    }
  }, [])

  // Delete single notification from history
  const deleteNotification = useCallback((id: string) => {
    setNotificationHistory((prev) => prev.filter((n) => n.id !== id))
    setRemoteUnreadCount(null)
    if (typeof window !== "undefined" && localStorage.getItem("authToken")) {
      void apiDelete(`/notifications/${id}`).catch((error) => {
        console.error("Failed to delete notification", error)
      })
    }
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
        hasMoreNotifications,
        isLoadingNotifications,
        loadMoreNotifications,
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
