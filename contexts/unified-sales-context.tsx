"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// ============================================
// TYPES ET INTERFACES
// ============================================

export interface UnifiedSaleItem {
  id: string
  productId: string // Can be showcaseItemId, menuItemId, breakfastItemId
  productType: "showcase" | "menu" | "breakfast"
  name: string
  quantity: number
  unitPrice: number
  total: number
  recipeId?: string
  categoryId?: string
}

export interface UnifiedSale {
  id: string
  saleNumber: string // Format: VNT-YYYYMMDD-XXX
  type: "counter" | "breakfast" | "delivery" | "pickup" | "table"
  source: "pos" | "online" | "phone"
  items: UnifiedSaleItem[]
  subtotal: number
  discount: number
  discountType: "percentage" | "fixed"
  discountDescription?: string // Description of the discount applied (e.g., "Reduction Gourmand (8%)")
  deliveryFee: number
  total: number
  paymentMethod: "cash" | "card" | "mobile" | "wallet" | "pending"
  paymentStatus: "paid" | "pending" | "refunded" | "partial"
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed" | "cancelled"
  // Client
  clientId?: string
  clientEmail?: string
  clientName?: string
  clientPhone?: string
  // Loyalty
  pointsEarned: number
  pointsUsed: number
  // Staff & Location
  cashierId?: string
  cashierName?: string
  tableNumber?: string
  ticketNumber?: string
  // Dates
  createdAt: string
  confirmedAt?: string
  completedAt?: string
  cancelledAt?: string
  // Notes
  customerNote?: string
  staffNote?: string
  // Address for delivery
  deliveryAddress?: string
}

// Analytics Types
export interface SalesStats {
  totalSales: number
  totalRevenue: number
  averageBasket: number
  totalItems: number
  totalDiscount: number
  totalDeliveryFees: number
  pointsEarned: number
  pointsUsed: number
  byType: Record<UnifiedSale["type"], { count: number; revenue: number }>
  byPayment: Record<UnifiedSale["paymentMethod"], { count: number; revenue: number }>
  byStatus: Record<UnifiedSale["status"], number>
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[]
  hourlyDistribution: { hour: number; count: number; revenue: number }[]
}

export interface PeriodComparison {
  current: number
  previous: number
  percentChange: number
  trend: "up" | "down" | "stable"
}

// Context Interface
interface UnifiedSalesContextType {
  sales: UnifiedSale[]
  
  // CRUD Operations
  addSale: (sale: Omit<UnifiedSale, "id" | "saleNumber" | "createdAt">) => UnifiedSale
  updateSale: (id: string, updates: Partial<UnifiedSale>) => void
  deleteSale: (id: string) => void
  
  // Status Management
  confirmSale: (id: string, onStockDecrement?: (recipeId: string, quantity: number) => boolean) => void
  startPreparing: (id: string) => void
  markReady: (id: string) => void
  completeSale: (id: string) => void
  cancelSale: (id: string, reason?: string) => void
  refundSale: (id: string) => void
  
  // Filtering
  getSalesByDate: (date: Date) => UnifiedSale[]
  getSalesByDateRange: (start: Date, end: Date) => UnifiedSale[]
  getSalesByStatus: (status: UnifiedSale["status"]) => UnifiedSale[]
  getSalesByType: (type: UnifiedSale["type"]) => UnifiedSale[]
  getActiveSales: () => UnifiedSale[]
  getPendingSales: () => UnifiedSale[]
  
  // Analytics
  getStats: (sales: UnifiedSale[]) => SalesStats
  getTodayStats: () => SalesStats
  getWeekStats: () => SalesStats
  getMonthStats: () => SalesStats
  getYearStats: () => SalesStats
  getComparison: (current: UnifiedSale[], previous: UnifiedSale[]) => PeriodComparison
  
  // Export
  exportToExcel: (sales: UnifiedSale[], filename: string) => void
  
  // Counters
  todaySalesCount: number
  todayRevenue: number
}

const UnifiedSalesContext = createContext<UnifiedSalesContextType | undefined>(undefined)

// ============================================
// HELPER FUNCTIONS
// ============================================

const generateSaleNumber = (date: Date, index: number): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const num = String(index).padStart(3, "0")
  return `VNT-${year}${month}${day}-${num}`
}

const isToday = (date: Date | string): boolean => {
  const d = typeof date === "string" ? new Date(date) : date
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

const isThisWeek = (date: Date | string): boolean => {
  const d = typeof date === "string" ? new Date(date) : date
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  return d >= startOfWeek
}

const isThisMonth = (date: Date | string): boolean => {
  const d = typeof date === "string" ? new Date(date) : date
  const today = new Date()
  return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
}

const isThisYear = (date: Date | string): boolean => {
  const d = typeof date === "string" ? new Date(date) : date
  return d.getFullYear() === new Date().getFullYear()
}

// ============================================
// INITIAL DATA (Demo)
// ============================================

const generateInitialSales = (): UnifiedSale[] => {
  const sales: UnifiedSale[] = []
  const now = new Date()
  
  // Generate some demo sales for today and past days
  const demoItems = [
    { name: "Croissant Beurre", price: 2.5, type: "showcase" as const },
    { name: "Pain au Chocolat", price: 3.0, type: "showcase" as const },
    { name: "Cafe Express", price: 2.5, type: "breakfast" as const },
    { name: "Formule Classique", price: 9.0, type: "breakfast" as const },
    { name: "Tarte aux Fraises", price: 25.0, type: "showcase" as const },
    { name: "Cappuccino", price: 5.0, type: "breakfast" as const },
  ]
  
  // Today's sales
  for (let i = 0; i < 5; i++) {
    const items: UnifiedSaleItem[] = []
    const numItems = Math.floor(Math.random() * 3) + 1
    
    for (let j = 0; j < numItems; j++) {
      const product = demoItems[Math.floor(Math.random() * demoItems.length)]
      const qty = Math.floor(Math.random() * 3) + 1
      items.push({
        id: `item-${i}-${j}`,
        productId: `prod-${i}-${j}`,
        productType: product.type,
        name: product.name,
        quantity: qty,
        unitPrice: product.price,
        total: product.price * qty,
      })
    }
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const discount = Math.random() > 0.8 ? Math.floor(subtotal * 0.1) : 0
    const total = subtotal - discount
    
    const saleDate = new Date(now)
    saleDate.setHours(8 + i * 2, Math.floor(Math.random() * 60), 0, 0)
    
    sales.push({
      id: `sale-today-${i}`,
      saleNumber: generateSaleNumber(saleDate, i + 1),
      type: Math.random() > 0.5 ? "counter" : "breakfast",
      source: "pos",
      items,
      subtotal,
      discount,
      discountType: "fixed",
      deliveryFee: 0,
      total,
      paymentMethod: ["cash", "card", "mobile"][Math.floor(Math.random() * 3)] as UnifiedSale["paymentMethod"],
      paymentStatus: "paid",
      status: "completed",
      pointsEarned: Math.floor(total),
      pointsUsed: 0,
      cashierId: "admin",
      cashierName: "Administrateur",
      createdAt: saleDate.toISOString(),
      completedAt: saleDate.toISOString(),
    })
  }
  
  // Yesterday's sales
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  
  for (let i = 0; i < 8; i++) {
    const items: UnifiedSaleItem[] = []
    const numItems = Math.floor(Math.random() * 4) + 1
    
    for (let j = 0; j < numItems; j++) {
      const product = demoItems[Math.floor(Math.random() * demoItems.length)]
      const qty = Math.floor(Math.random() * 2) + 1
      items.push({
        id: `item-y-${i}-${j}`,
        productId: `prod-y-${i}-${j}`,
        productType: product.type,
        name: product.name,
        quantity: qty,
        unitPrice: product.price,
        total: product.price * qty,
      })
    }
    
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const total = subtotal
    
    const saleDate = new Date(yesterday)
    saleDate.setHours(7 + i * 1.5, Math.floor(Math.random() * 60), 0, 0)
    
    sales.push({
      id: `sale-yesterday-${i}`,
      saleNumber: generateSaleNumber(saleDate, i + 1),
      type: ["counter", "breakfast", "table"][Math.floor(Math.random() * 3)] as UnifiedSale["type"],
      source: "pos",
      items,
      subtotal,
      discount: 0,
      discountType: "fixed",
      deliveryFee: 0,
      total,
      paymentMethod: ["cash", "card"][Math.floor(Math.random() * 2)] as UnifiedSale["paymentMethod"],
      paymentStatus: "paid",
      status: "completed",
      pointsEarned: Math.floor(total),
      pointsUsed: 0,
      cashierId: "admin",
      cashierName: "Administrateur",
      createdAt: saleDate.toISOString(),
      completedAt: saleDate.toISOString(),
    })
  }
  
  // Last week sales
  for (let d = 2; d <= 7; d++) {
    const date = new Date(now)
    date.setDate(date.getDate() - d)
    
    const salesCount = Math.floor(Math.random() * 6) + 3
    for (let i = 0; i < salesCount; i++) {
      const items: UnifiedSaleItem[] = []
      const numItems = Math.floor(Math.random() * 3) + 1
      
      for (let j = 0; j < numItems; j++) {
        const product = demoItems[Math.floor(Math.random() * demoItems.length)]
        const qty = Math.floor(Math.random() * 2) + 1
        items.push({
          id: `item-d${d}-${i}-${j}`,
          productId: `prod-d${d}-${i}-${j}`,
          productType: product.type,
          name: product.name,
          quantity: qty,
          unitPrice: product.price,
          total: product.price * qty,
        })
      }
      
      const subtotal = items.reduce((sum, item) => sum + item.total, 0)
      const total = subtotal
      
      const saleDate = new Date(date)
      saleDate.setHours(8 + i * 2, Math.floor(Math.random() * 60), 0, 0)
      
      sales.push({
        id: `sale-d${d}-${i}`,
        saleNumber: generateSaleNumber(saleDate, i + 1),
        type: ["counter", "breakfast"][Math.floor(Math.random() * 2)] as UnifiedSale["type"],
        source: "pos",
        items,
        subtotal,
        discount: 0,
        discountType: "fixed",
        deliveryFee: 0,
        total,
        paymentMethod: ["cash", "card", "mobile"][Math.floor(Math.random() * 3)] as UnifiedSale["paymentMethod"],
        paymentStatus: "paid",
        status: "completed",
        pointsEarned: Math.floor(total),
        pointsUsed: 0,
        cashierId: "admin",
        cashierName: "Administrateur",
        createdAt: saleDate.toISOString(),
        completedAt: saleDate.toISOString(),
      })
    }
  }
  
  // Add some pending orders (client orders waiting to be processed)
  const pendingOrders: UnifiedSale[] = [
    {
      id: "pending-1",
      saleNumber: generateSaleNumber(now, 100),
      type: "breakfast",
      source: "online",
      items: [
        { id: "p1-1", productId: "pack-gourmand", productType: "breakfast", name: "Formule Gourmand", quantity: 2, unitPrice: 14, total: 28 },
        { id: "p1-2", productId: "cappuccino", productType: "breakfast", name: "Cappuccino", quantity: 2, unitPrice: 5, total: 10 },
      ],
      subtotal: 38,
      discount: 0,
      discountType: "fixed",
      deliveryFee: 0,
      total: 38,
      paymentMethod: "pending",
      paymentStatus: "pending",
      status: "pending",
      clientId: "client-1",
      clientEmail: "client@example.com",
      clientName: "Ahmed Ben Ali",
      pointsEarned: 38,
      pointsUsed: 0,
      tableNumber: "5",
      customerNote: "Sans sucre pour les cafes",
      createdAt: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), // 10 min ago
    },
    {
      id: "pending-2",
      saleNumber: generateSaleNumber(now, 101),
      type: "breakfast",
      source: "online",
      items: [
        { id: "p2-1", productId: "pack-classique", productType: "breakfast", name: "Formule Classique", quantity: 1, unitPrice: 9, total: 9 },
        { id: "p2-2", productId: "jus-orange", productType: "breakfast", name: "Jus d'orange frais", quantity: 1, unitPrice: 7, total: 7 },
        { id: "p2-3", productId: "croissant-amande", productType: "breakfast", name: "Croissant aux amandes", quantity: 2, unitPrice: 4.5, total: 9 },
      ],
      subtotal: 25,
      discount: 0,
      discountType: "fixed",
      deliveryFee: 0,
      total: 25,
      paymentMethod: "pending",
      paymentStatus: "pending",
      status: "pending",
      clientId: "client-2",
      clientEmail: "sara@example.com",
      clientName: "Sara Mansour",
      pointsEarned: 25,
      pointsUsed: 0,
      tableNumber: "3",
      createdAt: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 min ago
    },
    {
      id: "pending-3",
      saleNumber: generateSaleNumber(now, 102),
      type: "counter",
      source: "online",
      items: [
        { id: "p3-1", productId: "tarte-fraise", productType: "showcase", name: "Tarte aux Fraises", quantity: 1, unitPrice: 25, total: 25 },
        { id: "p3-2", productId: "eclair-cafe", productType: "showcase", name: "Eclair au Cafe", quantity: 3, unitPrice: 5, total: 15 },
      ],
      subtotal: 40,
      discount: 0,
      discountType: "fixed",
      deliveryFee: 0,
      total: 40,
      paymentMethod: "pending",
      paymentStatus: "pending",
      status: "confirmed",
      clientId: "client-3",
      clientEmail: "karim@example.com",
      clientName: "Karim Trabelsi",
      pointsEarned: 40,
      pointsUsed: 0,
      customerNote: "Pour emporter SVP",
      createdAt: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 min ago
      confirmedAt: new Date(now.getTime() - 12 * 60 * 1000).toISOString(),
    },
    {
      id: "pending-4",
      saleNumber: generateSaleNumber(now, 103),
      type: "breakfast",
      source: "online",
      items: [
        { id: "p4-1", productId: "pack-complet", productType: "breakfast", name: "Formule Complete", quantity: 1, unitPrice: 19, total: 19 },
        { id: "p4-2", productId: "the", productType: "breakfast", name: "The a la menthe", quantity: 1, unitPrice: 3, total: 3 },
      ],
      subtotal: 22,
      discount: 0,
      discountType: "fixed",
      deliveryFee: 0,
      total: 22,
      paymentMethod: "pending",
      paymentStatus: "pending",
      status: "preparing",
      clientId: "client-4",
      clientEmail: "nadia@example.com",
      clientName: "Nadia Cherif",
      pointsEarned: 22,
      pointsUsed: 0,
      tableNumber: "8",
      createdAt: new Date(now.getTime() - 20 * 60 * 1000).toISOString(), // 20 min ago
      confirmedAt: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
    },
  ]
  
  return [...sales, ...pendingOrders]
}

// ============================================
// PROVIDER
// ============================================

export function UnifiedSalesProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<UnifiedSale[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("unified-sales")
    if (stored) {
      try {
        setSales(JSON.parse(stored))
      } catch {
        setSales(generateInitialSales())
      }
    } else {
      setSales(generateInitialSales())
    }
    setIsLoaded(true)
  }, [])
  
  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("unified-sales", JSON.stringify(sales))
    }
  }, [sales, isLoaded])
  
  // ============================================
  // CRUD OPERATIONS
  // ============================================
  
  const addSale = (saleData: Omit<UnifiedSale, "id" | "saleNumber" | "createdAt">): UnifiedSale => {
    const now = new Date()
    const todaySales = sales.filter(s => isToday(s.createdAt))
    const saleNumber = generateSaleNumber(now, todaySales.length + 1)
    
    const newSale: UnifiedSale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      saleNumber,
      createdAt: now.toISOString(),
    }
    
    setSales(prev => [newSale, ...prev])
    return newSale
  }
  
  const updateSale = (id: string, updates: Partial<UnifiedSale>) => {
    setSales(prev => prev.map(sale => 
      sale.id === id ? { ...sale, ...updates } : sale
    ))
  }
  
  const deleteSale = (id: string) => {
    setSales(prev => prev.filter(sale => sale.id !== id))
  }
  
  // ============================================
  // STATUS MANAGEMENT
  // ============================================
  
const confirmSale = (id: string, onStockDecrement?: (recipeId: string, quantity: number) => boolean) => {
    const sale = sales.find(s => s.id === id)
    if (!sale) return
    
    // Decrement stock for each item if callback is provided
    if (onStockDecrement) {
      for (const item of sale.items) {
        // Use recipeId if available, otherwise use productId
        const recipeId = item.recipeId || item.productId
        const success = onStockDecrement(recipeId, item.quantity)
        if (!success) {
          console.warn(`[v0] Failed to decrement stock for ${item.name}`)
        }
      }
    }
    
    updateSale(id, { status: "confirmed", confirmedAt: new Date().toISOString() })
  }
  
  const startPreparing = (id: string) => {
    updateSale(id, { status: "preparing" })
  }
  
  const markReady = (id: string) => {
    updateSale(id, { status: "ready" })
  }
  
  const completeSale = (id: string) => {
    updateSale(id, { 
      status: "completed", 
      completedAt: new Date().toISOString(),
      paymentStatus: "paid"
    })
  }
  
  const cancelSale = (id: string, reason?: string) => {
    updateSale(id, { 
      status: "cancelled", 
      cancelledAt: new Date().toISOString(),
      staffNote: reason
    })
  }
  
  const refundSale = (id: string) => {
    updateSale(id, { paymentStatus: "refunded" })
  }
  
  // ============================================
  // FILTERING
  // ============================================
  
  const getSalesByDate = (date: Date): UnifiedSale[] => {
    return sales.filter(s => {
      const saleDate = new Date(s.createdAt)
      return saleDate.toDateString() === date.toDateString()
    })
  }
  
  const getSalesByDateRange = (start: Date, end: Date): UnifiedSale[] => {
    return sales.filter(s => {
      const saleDate = new Date(s.createdAt)
      return saleDate >= start && saleDate <= end
    })
  }
  
  const getSalesByStatus = (status: UnifiedSale["status"]): UnifiedSale[] => {
    return sales.filter(s => s.status === status)
  }
  
  const getSalesByType = (type: UnifiedSale["type"]): UnifiedSale[] => {
    return sales.filter(s => s.type === type)
  }
  
  const getActiveSales = (): UnifiedSale[] => {
    return sales.filter(s => 
      ["pending", "confirmed", "preparing", "ready"].includes(s.status)
    )
  }
  
  const getPendingSales = (): UnifiedSale[] => {
    return sales.filter(s => s.status === "pending")
  }
  
  // ============================================
  // ANALYTICS
  // ============================================
  
  const getStats = (salesData: UnifiedSale[]): SalesStats => {
    const completedSales = salesData.filter(s => s.status === "completed")
    
    const totalRevenue = completedSales.reduce((sum, s) => sum + s.total, 0)
    const totalItems = completedSales.reduce((sum, s) => 
      sum + s.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    )
    const totalDiscount = completedSales.reduce((sum, s) => sum + s.discount, 0)
    const totalDeliveryFees = completedSales.reduce((sum, s) => sum + s.deliveryFee, 0)
    const pointsEarned = completedSales.reduce((sum, s) => sum + s.pointsEarned, 0)
    const pointsUsed = completedSales.reduce((sum, s) => sum + s.pointsUsed, 0)
    
    // By type
    const byType: SalesStats["byType"] = {
      counter: { count: 0, revenue: 0 },
      breakfast: { count: 0, revenue: 0 },
      delivery: { count: 0, revenue: 0 },
      pickup: { count: 0, revenue: 0 },
      table: { count: 0, revenue: 0 },
    }
    completedSales.forEach(s => {
      byType[s.type].count++
      byType[s.type].revenue += s.total
    })
    
    // By payment method
    const byPayment: SalesStats["byPayment"] = {
      cash: { count: 0, revenue: 0 },
      card: { count: 0, revenue: 0 },
      mobile: { count: 0, revenue: 0 },
      wallet: { count: 0, revenue: 0 },
      pending: { count: 0, revenue: 0 },
    }
    completedSales.forEach(s => {
      byPayment[s.paymentMethod].count++
      byPayment[s.paymentMethod].revenue += s.total
    })
    
    // By status
    const byStatus: SalesStats["byStatus"] = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    }
    salesData.forEach(s => {
      byStatus[s.status]++
    })
    
    // Top products
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    completedSales.forEach(s => {
      s.items.forEach(item => {
        const existing = productMap.get(item.name) || { name: item.name, quantity: 0, revenue: 0 }
        existing.quantity += item.quantity
        existing.revenue += item.total
        productMap.set(item.name, existing)
      })
    })
    const topProducts = Array.from(productMap.entries())
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
    
    // Hourly distribution
    const hourlyMap = new Map<number, { count: number; revenue: number }>()
    for (let h = 0; h < 24; h++) {
      hourlyMap.set(h, { count: 0, revenue: 0 })
    }
    completedSales.forEach(s => {
      const hour = new Date(s.createdAt).getHours()
      const existing = hourlyMap.get(hour)!
      existing.count++
      existing.revenue += s.total
    })
    const hourlyDistribution = Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({ hour, ...data }))
      .filter(h => h.count > 0 || (h.hour >= 7 && h.hour <= 20))
    
    return {
      totalSales: completedSales.length,
      totalRevenue,
      averageBasket: completedSales.length > 0 ? totalRevenue / completedSales.length : 0,
      totalItems,
      totalDiscount,
      totalDeliveryFees,
      pointsEarned,
      pointsUsed,
      byType,
      byPayment,
      byStatus,
      topProducts,
      hourlyDistribution,
    }
  }
  
  const getTodayStats = (): SalesStats => {
    const todaySales = sales.filter(s => isToday(s.createdAt))
    return getStats(todaySales)
  }
  
  const getWeekStats = (): SalesStats => {
    const weekSales = sales.filter(s => isThisWeek(s.createdAt))
    return getStats(weekSales)
  }
  
  const getMonthStats = (): SalesStats => {
    const monthSales = sales.filter(s => isThisMonth(s.createdAt))
    return getStats(monthSales)
  }
  
  const getYearStats = (): SalesStats => {
    const yearSales = sales.filter(s => isThisYear(s.createdAt))
    return getStats(yearSales)
  }
  
  const getComparison = (current: UnifiedSale[], previous: UnifiedSale[]): PeriodComparison => {
    const currentRevenue = current.filter(s => s.status === "completed").reduce((sum, s) => sum + s.total, 0)
    const previousRevenue = previous.filter(s => s.status === "completed").reduce((sum, s) => sum + s.total, 0)
    
    const percentChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : currentRevenue > 0 ? 100 : 0
    
    return {
      current: currentRevenue,
      previous: previousRevenue,
      percentChange,
      trend: percentChange > 2 ? "up" : percentChange < -2 ? "down" : "stable"
    }
  }
  
  // ============================================
  // EXPORT
  // ============================================
  
  const exportToExcel = async (salesData: UnifiedSale[], filename: string) => {
    // Dynamic import for xlsx
    const XLSX = await import("xlsx")
    
    // Prepare data for export
    const exportData = salesData.map(sale => ({
      "Numero": sale.saleNumber,
      "Date": new Date(sale.createdAt).toLocaleDateString("fr-TN"),
      "Heure": new Date(sale.createdAt).toLocaleTimeString("fr-TN", { hour: "2-digit", minute: "2-digit" }),
      "Type": sale.type === "counter" ? "Comptoir" : sale.type === "breakfast" ? "Petit-dej" : sale.type === "delivery" ? "Livraison" : sale.type === "pickup" ? "Retrait" : "Table",
      "Articles": sale.items.map(i => `${i.quantity}x ${i.name}`).join(", "),
      "Sous-total": sale.subtotal.toFixed(2),
      "Remise": sale.discount.toFixed(2),
      "Livraison": sale.deliveryFee.toFixed(2),
      "Total": sale.total.toFixed(2),
      "Paiement": sale.paymentMethod === "cash" ? "Especes" : sale.paymentMethod === "card" ? "Carte" : sale.paymentMethod === "mobile" ? "Mobile" : "Wallet",
      "Statut": sale.status === "completed" ? "Termine" : sale.status === "cancelled" ? "Annule" : sale.status === "pending" ? "En attente" : sale.status,
      "Client": sale.clientName || "Anonyme",
      "Points gagnes": sale.pointsEarned,
      "Caissier": sale.cashierName || "-",
    }))
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(exportData)
    
    // Set column widths
    ws["!cols"] = [
      { wch: 18 }, // Numero
      { wch: 12 }, // Date
      { wch: 8 },  // Heure
      { wch: 12 }, // Type
      { wch: 40 }, // Articles
      { wch: 10 }, // Sous-total
      { wch: 10 }, // Remise
      { wch: 10 }, // Livraison
      { wch: 10 }, // Total
      { wch: 10 }, // Paiement
      { wch: 12 }, // Statut
      { wch: 15 }, // Client
      { wch: 12 }, // Points
      { wch: 15 }, // Caissier
    ]
    
    XLSX.utils.book_append_sheet(wb, ws, "Ventes")
    
    // Generate and download
    XLSX.writeFile(wb, `${filename}.xlsx`)
  }
  
  // ============================================
  // COMPUTED VALUES
  // ============================================
  
  const todaySalesData = sales.filter(s => isToday(s.createdAt) && s.status === "completed")
  const todaySalesCount = todaySalesData.length
  const todayRevenue = todaySalesData.reduce((sum, s) => sum + s.total, 0)
  
  return (
    <UnifiedSalesContext.Provider value={{
      sales,
      addSale,
      updateSale,
      deleteSale,
      confirmSale,
      startPreparing,
      markReady,
      completeSale,
      cancelSale,
      refundSale,
      getSalesByDate,
      getSalesByDateRange,
      getSalesByStatus,
      getSalesByType,
      getActiveSales,
      getPendingSales,
      getStats,
      getTodayStats,
      getWeekStats,
      getMonthStats,
      getYearStats,
      getComparison,
      exportToExcel,
      todaySalesCount,
      todayRevenue,
    }}>
      {children}
    </UnifiedSalesContext.Provider>
  )
}

export function useUnifiedSales() {
  const context = useContext(UnifiedSalesContext)
  if (!context) {
    throw new Error("useUnifiedSales must be used within a UnifiedSalesProvider")
  }
  return context
}
