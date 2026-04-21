"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  BellIcon,
  CheckIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  TrashIcon,
  XIcon,
  ShoppingBagIcon,
  PackageIcon,
  ChefHatIcon,
  UsersIcon,
  CreditCardIcon,
  SettingsIcon,
  SearchIcon,
  FilterIcon,
  CalendarIcon,
  ClockIcon,
  ExternalLinkIcon,
  ChevronLeftIcon,
  ArchiveIcon,
  BellOffIcon,
  Trash2Icon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { NotificationProvider, useNotification, type NotificationCategory, type NotificationPriority, type Notification, CATEGORY_INFO } from "@/contexts/notification-context"
import { AuthProvider, useAuth } from "@/contexts/auth-context"
import { StockProvider } from "@/contexts/stock-context"
import { ProductionProvider } from "@/contexts/production-context"
import { ProtectedRoute } from "@/components/route-protection"
import { NotificationContainer } from "@/components/notification-container"
import { cn } from "@/lib/utils"

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
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  error: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-600",
    iconBg: "bg-red-100",
    badge: "bg-red-100 text-red-700 border-red-200",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-600",
    iconBg: "bg-amber-100",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-600",
    iconBg: "bg-blue-100",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
  },
}

const PriorityConfig = {
  urgent: { label: "Urgent", color: "bg-red-500", textColor: "text-red-700" },
  high: { label: "Haute", color: "bg-amber-500", textColor: "text-amber-700" },
  medium: { label: "Moyenne", color: "bg-blue-500", textColor: "text-blue-700" },
  low: { label: "Basse", color: "bg-slate-400", textColor: "text-slate-600" },
}

function NotificationsHistoryContent() {
  const { user } = useAuth()
  const {
    notificationHistory,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearHistory,
    deleteNotification,
  } = useNotification()

  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"all" | NotificationCategory>("all")
  const [typeFilter, setTypeFilter] = useState<"all" | "success" | "error" | "warning" | "info">("all")
  const [priorityFilter, setPriorityFilter] = useState<"all" | NotificationPriority>("all")
  const [readFilter, setReadFilter] = useState<"all" | "read" | "unread">("all")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all")

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let result = [...notificationHistory]

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        n => n.title.toLowerCase().includes(query) || n.message?.toLowerCase().includes(query)
      )
    }

    // Category
    if (categoryFilter !== "all") {
      result = result.filter(n => n.category === categoryFilter)
    }

    // Type
    if (typeFilter !== "all") {
      result = result.filter(n => n.type === typeFilter)
    }

    // Priority
    if (priorityFilter !== "all") {
      result = result.filter(n => n.priority === priorityFilter)
    }

    // Read status
    if (readFilter === "read") {
      result = result.filter(n => n.read)
    } else if (readFilter === "unread") {
      result = result.filter(n => !n.read)
    }

    // Date
    const now = new Date()
    if (dateFilter === "today") {
      result = result.filter(n => {
        const d = new Date(n.timestamp)
        return d.toDateString() === now.toDateString()
      })
    } else if (dateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      result = result.filter(n => new Date(n.timestamp) >= weekAgo)
    } else if (dateFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      result = result.filter(n => new Date(n.timestamp) >= monthAgo)
    }

    return result
  }, [notificationHistory, searchQuery, categoryFilter, typeFilter, priorityFilter, readFilter, dateFilter])

  // Group by date
  const groupedNotifications = useMemo(() => {
    const groups: { date: string; label: string; notifications: Notification[] }[] = []
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const dateGroups = new Map<string, Notification[]>()

    filteredNotifications.forEach(n => {
      const date = new Date(n.timestamp)
      let key: string
      let label: string

      if (date.toDateString() === today.toDateString()) {
        key = "today"
        label = "Aujourd'hui"
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = "yesterday"
        label = "Hier"
      } else {
        key = date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
        label = key.charAt(0).toUpperCase() + key.slice(1)
      }

      if (!dateGroups.has(key)) {
        dateGroups.set(key, [])
      }
      dateGroups.get(key)!.push(n)
    })

    dateGroups.forEach((notifications, key) => {
      let label = key
      if (key === "today") label = "Aujourd'hui"
      else if (key === "yesterday") label = "Hier"
      groups.push({ date: key, label, notifications })
    })

    return groups
  }, [filteredNotifications])

  // Stats
  const stats = useMemo(() => {
    const byCategory: Record<NotificationCategory, number> = {
      order: 0,
      stock: 0,
      production: 0,
      client: 0,
      payment: 0,
      system: 0,
    }
    const byType = { success: 0, error: 0, warning: 0, info: 0 }
    
    notificationHistory.forEach(n => {
      byCategory[n.category]++
      byType[n.type]++
    })

    return { byCategory, byType, total: notificationHistory.length, unread: unreadCount }
  }, [notificationHistory, unreadCount])

  // Format time
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
  }

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const selectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)))
    }
  }

  const deleteSelected = () => {
    selectedIds.forEach(id => deleteNotification(id))
    setSelectedIds(new Set())
  }

  const markSelectedAsRead = () => {
    selectedIds.forEach(id => markAsRead(id))
    setSelectedIds(new Set())
  }

  // Redirect if not admin
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Card className="p-8 text-center">
          <BellOffIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="font-semibold text-lg mb-2">Acces restreint</h2>
          <p className="text-muted-foreground mb-4">Vous devez etre connecte en tant qu&apos;administrateur.</p>
          <Link href="/admin">
            <Button>Se connecter</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50/30">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeftIcon className="h-5 w-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20">
                  <BellIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-stone-900">Centre de Notifications</h1>
                  <p className="text-sm text-muted-foreground">
                    {stats.total} notification{stats.total > 1 ? "s" : ""} - {stats.unread} non lue{stats.unread > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Tout marquer comme lu
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2Icon className="h-4 w-4 mr-2" />
                    Effacer tout
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Effacer toutes les notifications?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irreversible. Toutes les {stats.total} notifications seront supprimees.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground">
                      Effacer tout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          {(Object.entries(stats.byCategory) as [NotificationCategory, number][]).map(([cat, count]) => {
            const Icon = CategoryIcons[cat]
            return (
              <Card
                key={cat}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:shadow-md",
                  categoryFilter === cat && "ring-2 ring-amber-500 bg-amber-50"
                )}
                onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    `bg-${CATEGORY_INFO[cat].color}-100`
                  )}>
                    <Icon className={cn("h-5 w-5", `text-${CATEGORY_INFO[cat].color}-600`)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{count}</p>
                    <p className="text-xs text-muted-foreground">{CATEGORY_INFO[cat].label}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Filters Bar */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes categories</SelectItem>
                {(Object.keys(CATEGORY_INFO) as NotificationCategory[]).map(cat => (
                  <SelectItem key={cat} value={cat}>{CATEGORY_INFO[cat].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="success">Succes</SelectItem>
                <SelectItem value="error">Erreur</SelectItem>
                <SelectItem value="warning">Avertissement</SelectItem>
                <SelectItem value="info">Information</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priorite" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes priorites</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">Haute</SelectItem>
                <SelectItem value="medium">Moyenne</SelectItem>
                <SelectItem value="low">Basse</SelectItem>
              </SelectContent>
            </Select>

            {/* Read Status Filter */}
            <Select value={readFilter} onValueChange={(v) => setReadFilter(v as any)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="unread">Non lues</SelectItem>
                <SelectItem value="read">Lues</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as any)}>
              <SelectTrigger className="w-[140px]">
                <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute periode</SelectItem>
                <SelectItem value="today">Aujourd&apos;hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Selection Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} selectionne{selectedIds.size > 1 ? "s" : ""}
              </span>
              <Button variant="outline" size="sm" onClick={markSelectedAsRead}>
                <CheckIcon className="h-4 w-4 mr-1" />
                Marquer comme lu
              </Button>
              <Button variant="outline" size="sm" onClick={deleteSelected} className="text-destructive hover:text-destructive">
                <TrashIcon className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </div>
          )}
        </Card>

        {/* Notifications List */}
        <Card className="overflow-hidden">
          {/* List Header */}
          <div className="flex items-center gap-4 p-4 border-b bg-muted/30">
            <Checkbox
              checked={selectedIds.size === filteredNotifications.length && filteredNotifications.length > 0}
              onCheckedChange={selectAll}
            />
            <span className="text-sm font-medium text-muted-foreground">
              {filteredNotifications.length} notification{filteredNotifications.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Notifications */}
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                <BellOffIcon className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <p className="font-semibold text-lg text-foreground mb-1">Aucune notification</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchQuery || categoryFilter !== "all" || typeFilter !== "all"
                  ? "Aucune notification ne correspond a vos filtres"
                  : "Vous n'avez pas encore de notifications"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {groupedNotifications.map((group) => (
                <div key={group.date}>
                  {/* Date Header */}
                  <div className="sticky top-0 bg-muted/50 backdrop-blur-sm px-4 py-2 border-b">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </p>
                  </div>

                  {/* Notifications for this date */}
                  {group.notifications.map((notification, index) => {
                    const TypeIcon = TypeIcons[notification.type] || InfoIcon
                    const CategoryIcon = CategoryIcons[notification.category] || SettingsIcon
                    const colors = TypeColors[notification.type] || TypeColors.info
                    const priority = PriorityConfig[notification.priority] || PriorityConfig.medium

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={cn(
                          "group relative flex items-start gap-4 p-4 transition-colors hover:bg-muted/30",
                          !notification.read && "bg-amber-50/50",
                          selectedIds.has(notification.id) && "bg-amber-100/50"
                        )}
                      >
                        {/* Priority indicator */}
                        {(notification.priority === "urgent" || notification.priority === "high") && (
                          <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-1",
                            notification.priority === "urgent" ? "bg-red-500" : "bg-amber-500"
                          )} />
                        )}

                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedIds.has(notification.id)}
                          onCheckedChange={() => toggleSelect(notification.id)}
                          className="mt-1"
                        />

                        {/* Icon */}
                        <div className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                          colors.iconBg
                        )}>
                          <TypeIcon className={cn("h-6 w-6", colors.icon)} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className={cn(
                                  "font-semibold text-foreground",
                                  !notification.read && "text-foreground"
                                )}>
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                )}
                              </div>
                              {notification.message && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                              )}

                              {/* Tags */}
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={colors.badge}>
                                  <TypeIcon className="h-3 w-3 mr-1" />
                                  {notification.type === "success" && "Succes"}
                                  {notification.type === "error" && "Erreur"}
                                  {notification.type === "warning" && "Avertissement"}
                                  {notification.type === "info" && "Information"}
                                </Badge>
                                <Badge variant="secondary" className="gap-1">
                                  <CategoryIcon className="h-3 w-3" />
                                  {CATEGORY_INFO[notification.category].label}
                                </Badge>
                                <Badge variant="outline" className={cn("gap-1", priority.textColor)}>
                                  <div className={cn("h-2 w-2 rounded-full", priority.color)} />
                                  {priority.label}
                                </Badge>
                              </div>
                            </div>

                            {/* Time & Actions */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className="text-right">
                                <p className="text-sm font-medium text-foreground">
                                  {formatTime(notification.timestamp)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(notification.timestamp)}
                                </p>
                              </div>
                              
                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </Button>
                                )}
                                {notification.actionUrl && (
                                  <Link href={notification.actionUrl}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <ExternalLinkIcon className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function NotificationsHistoryPage() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <StockProvider>
          <ProductionProvider>
            <NotificationsHistoryContent />
          </ProductionProvider>
        </StockProvider>
      </AuthProvider>
    </NotificationProvider>
  )
}
