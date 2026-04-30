"use client"

import { useState, useMemo } from "react"
import { 
  BellIcon, 
  CheckIcon, 
  TrashIcon, 
  XIcon, 
  ShoppingBagIcon, 
  PackageIcon, 
  ChefHatIcon, 
  UsersIcon, 
  CreditCardIcon, 
  SettingsIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  InfoIcon,
  ExternalLinkIcon,
  ClockIcon,
  FilterIcon,
  HistoryIcon,
} from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import { useNotification, type NotificationCategory, type Notification, CATEGORY_INFO } from "@/contexts/notification-context"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

// Category icons mapping
const CategoryIcons: Record<NotificationCategory, typeof ShoppingBagIcon> = {
  order: ShoppingBagIcon,
  stock: PackageIcon,
  production: ChefHatIcon,
  client: UsersIcon,
  payment: CreditCardIcon,
  system: SettingsIcon,
}

// Type icons mapping
const TypeIcons = {
  success: CheckCircleIcon,
  error: AlertCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
}

// Color configs
const TypeColors = {
  success: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    icon: "text-emerald-600",
    iconBg: "bg-emerald-100",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-600",
    iconBg: "bg-red-100",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-600",
    iconBg: "bg-amber-100",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-600",
    iconBg: "bg-blue-100",
  },
}

const CategoryColors: Record<NotificationCategory, string> = {
  order: "bg-blue-500",
  stock: "bg-orange-500",
  production: "bg-purple-500",
  client: "bg-green-500",
  payment: "bg-emerald-500",
  system: "bg-slate-500",
}

export function NotificationIcon() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | NotificationCategory>("all")
  const { user } = useAuth()
  const { 
    notificationHistory, 
    unreadCount, 
    unreadByCategory,
    markAsRead, 
    markAllAsRead,
    markCategoryAsRead, 
    clearHistory,
    deleteNotification,
    hasMoreNotifications,
    isLoadingNotifications,
    loadMoreNotifications,
  } = useNotification()

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notificationHistory
    return notificationHistory.filter(n => n.category === activeTab)
  }, [notificationHistory, activeTab])

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    const groups: { label: string; notifications: Notification[] }[] = []
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const todayNotifs: Notification[] = []
    const yesterdayNotifs: Notification[] = []
    const olderNotifs: Notification[] = []
    
    filteredNotifications.forEach(n => {
      const date = new Date(n.timestamp)
      if (date.toDateString() === today.toDateString()) {
        todayNotifs.push(n)
      } else if (date.toDateString() === yesterday.toDateString()) {
        yesterdayNotifs.push(n)
      } else {
        olderNotifs.push(n)
      }
    })
    
    if (todayNotifs.length > 0) groups.push({ label: "Aujourd'hui", notifications: todayNotifs })
    if (yesterdayNotifs.length > 0) groups.push({ label: "Hier", notifications: yesterdayNotifs })
    if (olderNotifs.length > 0) groups.push({ label: "Plus ancien", notifications: olderNotifs })
    
    return groups
  }, [filteredNotifications])

  // Format time
  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "A l'instant"
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    if (days === 1) return "Hier"
    if (days < 7) return `Il y a ${days}j`
    return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
  }

  // Get categories with notifications
  const categoriesWithNotifs = useMemo(() => {
    const cats = new Set<NotificationCategory>()
    notificationHistory.forEach(n => cats.add(n.category))
    return Array.from(cats)
  }, [notificationHistory])

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <BellIcon className="h-5 w-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <button
              aria-label="Fermer les notifications"
              className="fixed inset-0 z-40 cursor-default bg-transparent"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-12 z-50 w-[420px] max-w-[calc(100vw-2rem)] rounded-xl border border-stone-200 bg-white shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                    <BellIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Notifications</h3>
                    <p className="text-xs text-muted-foreground">
                      {unreadCount > 0 ? (
                        <span className="text-amber-600 font-medium">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</span>
                      ) : (
                        "Tout est lu"
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => activeTab === "all" ? markAllAsRead() : markCategoryAsRead(activeTab as NotificationCategory)} 
                      className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <CheckIcon className="mr-1 h-3 w-3" />
                      Tout lire
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground" 
                    onClick={() => setIsOpen(false)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="border-b border-border px-2 py-2">
                <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                      activeTab === "all" 
                        ? "bg-amber-100 text-amber-700" 
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    Toutes
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {categoriesWithNotifs.map(cat => {
                    const Icon = CategoryIcons[cat]
                    const count = unreadByCategory[cat] || 0
                    return (
                      <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                          activeTab === cat 
                            ? "bg-amber-100 text-amber-700" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {CATEGORY_INFO[cat].label}
                        {count > 0 && (
                          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] text-white", CategoryColors[cat])}>
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-[400px] overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <BellIcon className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="font-medium text-foreground">Aucune notification</p>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === "all" 
                        ? "Vous n'avez pas encore de notifications" 
                        : `Pas de notifications ${CATEGORY_INFO[activeTab as NotificationCategory]?.label.toLowerCase()}`}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {groupedNotifications.map((group) => (
                      <div key={group.label}>
                        <div className="sticky top-0 bg-stone-50 px-4 py-2">
                          <p className="text-xs font-medium text-muted-foreground">{group.label}</p>
                        </div>
                        {group.notifications.map((notification) => {
                          const TypeIcon = TypeIcons[notification.type] || InfoIcon
                          const CategoryIcon = CategoryIcons[notification.category] || SettingsIcon
                          const colors = TypeColors[notification.type] || TypeColors.info
                          
                          return (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.08 }}
                              className={cn(
                                "group relative p-4 transition-colors hover:bg-muted/50",
                                !notification.read && "bg-amber-50/50"
                              )}
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="flex gap-3">
                                {/* Icon */}
                                <div className={cn(
                                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                  colors.iconBg
                                )}>
                                  <TypeIcon className={cn("h-5 w-5", colors.icon)} />
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <p className={cn(
                                          "font-semibold text-sm truncate",
                                          !notification.read && "text-foreground"
                                        )}>
                                          {notification.title}
                                        </p>
                                        {!notification.read && (
                                          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500 animate-pulse" />
                                        )}
                                      </div>
                                      {notification.message && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                          {notification.message}
                                        </p>
                                      )}
                                    </div>
                                    
                                    {/* Delete button on hover */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteNotification(notification.id)
                                      }}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-100 text-muted-foreground hover:text-red-600"
                                    >
                                      <XIcon className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  
                                  {/* Footer */}
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                      <Badge 
                                        variant="secondary" 
                                        className={cn(
                                          "h-5 text-[10px] font-medium gap-1",
                                          `bg-${CATEGORY_INFO[notification.category].color}-100 text-${CATEGORY_INFO[notification.category].color}-700`
                                        )}
                                      >
                                        <CategoryIcon className="h-3 w-3" />
                                        {CATEGORY_INFO[notification.category].label}
                                      </Badge>
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <ClockIcon className="h-3 w-3" />
                                        {formatTime(notification.timestamp)}
                                      </span>
                                    </div>
                                    
                                    {notification.actionUrl && (
                                      <Link
                                        href={notification.actionUrl}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          markAsRead(notification.id)
                                          setIsOpen(false)
                                        }}
                                        className="text-[10px] font-medium text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
                                      >
                                        {notification.actionLabel || "Voir"}
                                        <ExternalLinkIcon className="h-3 w-3" />
                                      </Link>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Priority indicator */}
                              {notification.priority === "urgent" && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500 rounded-l" />
                              )}
                              {notification.priority === "high" && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l" />
                              )}
                            </motion.div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                )}
                {hasMoreNotifications && activeTab === "all" && (
                  <div className="border-t border-border p-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={isLoadingNotifications}
                      onClick={() => void loadMoreNotifications()}
                    >
                      {isLoadingNotifications ? "Chargement..." : "Charger plus"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border p-3 flex items-center justify-between">
                {user?.role === "admin" ? (
                  <Link
                    href="/admin/notifications"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <HistoryIcon className="h-4 w-4" />
                    Voir tout l&apos;historique
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <HistoryIcon className="h-4 w-4" />
                    Historique recent
                  </span>
                )}
                {notificationHistory.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      clearHistory()
                    }}
                  >
                    <TrashIcon className="mr-1 h-3 w-3" />
                    Effacer tout
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
