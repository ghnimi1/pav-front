"use client"

import { useState, useMemo } from "react"
import { useUnifiedSales, type SalesStats } from "@/contexts/unified-sales-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  DollarSignIcon,
  ShoppingCartIcon,
  UsersIcon,
  PackageIcon,
  CalendarIcon,
  DownloadIcon,
  CreditCardIcon,
  BanknoteIcon,
  SmartphoneIcon,
  WalletIcon,
  CoffeeIcon,
  UtensilsCrossedIcon,
  TruckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  TargetIcon,
  CoinsIcon,
  PercentIcon,
} from "lucide-react"

const COLORS = {
  primary: "#f59e0b",
  secondary: "#3b82f6",
  success: "#10b981",
  warning: "#f97316",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
  stone: "#78716c",
}

const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.success, COLORS.purple, COLORS.pink]

export function SalesDashboard() {
  const {
    sales,
    getTodayStats,
    getWeekStats,
    getMonthStats,
    getYearStats,
    getStats,
    getSalesByDateRange,
    exportToExcel,
  } = useUnifiedSales()

  const [period, setPeriod] = useState<"today" | "week" | "month" | "year">("week")

  // Get stats based on selected period
  const stats = useMemo(() => {
    switch (period) {
      case "today":
        return getTodayStats()
      case "week":
        return getWeekStats()
      case "month":
        return getMonthStats()
      case "year":
        return getYearStats()
    }
  }, [period, getTodayStats, getWeekStats, getMonthStats, getYearStats])

  // Get previous period stats for comparison
  const previousStats = useMemo(() => {
    const now = new Date()
    let start: Date, end: Date

    switch (period) {
      case "today":
        start = new Date(now)
        start.setDate(start.getDate() - 1)
        start.setHours(0, 0, 0, 0)
        end = new Date(start)
        end.setHours(23, 59, 59, 999)
        break
      case "week":
        start = new Date(now)
        start.setDate(start.getDate() - 14)
        end = new Date(now)
        end.setDate(end.getDate() - 7)
        break
      case "month":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case "year":
        start = new Date(now.getFullYear() - 1, 0, 1)
        end = new Date(now.getFullYear() - 1, 11, 31)
        break
    }

    const previousSales = getSalesByDateRange(start, end)
    return getStats(previousSales)
  }, [period, getSalesByDateRange, getStats])

  // Calculate comparison
  const getComparison = (current: number, previous: number) => {
    if (previous === 0) return { value: current > 0 ? 100 : 0, trend: current > 0 ? "up" : "stable" as const }
    const change = ((current - previous) / previous) * 100
    return {
      value: Math.abs(change),
      trend: change > 2 ? "up" : change < -2 ? "down" : "stable" as const
    }
  }

  const revenueComparison = getComparison(stats.totalRevenue, previousStats.totalRevenue)
  const salesComparison = getComparison(stats.totalSales, previousStats.totalSales)
  const basketComparison = getComparison(stats.averageBasket, previousStats.averageBasket)

  // Prepare chart data - Daily revenue for the period
  const dailyRevenueData = useMemo(() => {
    const now = new Date()
    const data: { date: string; revenue: number; sales: number }[] = []
    
    let days = 7
    if (period === "today") days = 1
    else if (period === "month") days = 30
    else if (period === "year") days = 12 // Show months for year view
    
    if (period === "year") {
      // Monthly data for year view
      for (let i = 11; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
        const monthSales = sales.filter(s => {
          const d = new Date(s.createdAt)
          return d >= month && d <= monthEnd && s.status === "completed"
        })
        data.push({
          date: month.toLocaleDateString("fr-TN", { month: "short" }),
          revenue: monthSales.reduce((sum, s) => sum + s.total, 0),
          sales: monthSales.length,
        })
      }
    } else {
      // Daily data
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const daySales = sales.filter(s => {
          const d = new Date(s.createdAt)
          return d.toDateString() === date.toDateString() && s.status === "completed"
        })
        
        data.push({
          date: date.toLocaleDateString("fr-TN", { weekday: "short", day: "numeric" }),
          revenue: daySales.reduce((sum, s) => sum + s.total, 0),
          sales: daySales.length,
        })
      }
    }
    
    return data
  }, [sales, period])

  // Payment method data for pie chart
  const paymentData = useMemo(() => {
    return [
      { name: "Especes", value: stats.byPayment.cash.revenue, count: stats.byPayment.cash.count, color: COLORS.success },
      { name: "Carte", value: stats.byPayment.card.revenue, count: stats.byPayment.card.count, color: COLORS.secondary },
      { name: "Mobile", value: stats.byPayment.mobile.revenue, count: stats.byPayment.mobile.count, color: COLORS.purple },
      { name: "Wallet", value: stats.byPayment.wallet.revenue, count: stats.byPayment.wallet.count, color: COLORS.primary },
    ].filter(p => p.value > 0)
  }, [stats])

  // Sale type data for pie chart
  const saleTypeData = useMemo(() => {
    return [
      { name: "Comptoir", value: stats.byType.counter.revenue, count: stats.byType.counter.count, color: COLORS.stone },
      { name: "Petit-dej", value: stats.byType.breakfast.revenue, count: stats.byType.breakfast.count, color: COLORS.primary },
      { name: "Table", value: stats.byType.table.revenue, count: stats.byType.table.count, color: COLORS.secondary },
      { name: "Livraison", value: stats.byType.delivery.revenue, count: stats.byType.delivery.count, color: COLORS.purple },
      { name: "Retrait", value: stats.byType.pickup.revenue, count: stats.byType.pickup.count, color: COLORS.success },
    ].filter(p => p.value > 0)
  }, [stats])

  // Hourly distribution data
  const hourlyData = useMemo(() => {
    return stats.hourlyDistribution.map(h => ({
      hour: `${h.hour}h`,
      ventes: h.count,
      revenue: h.revenue,
    }))
  }, [stats])

  // Handle export
  const handleExport = () => {
    const now = new Date()
    let start: Date, end: Date = now

    switch (period) {
      case "today":
        start = new Date(now)
        start.setHours(0, 0, 0, 0)
        break
      case "week":
        start = new Date(now)
        start.setDate(start.getDate() - 7)
        break
      case "month":
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "year":
        start = new Date(now.getFullYear(), 0, 1)
        break
    }

    const periodSales = getSalesByDateRange(start, end)
    const dateStr = now.toISOString().split("T")[0]
    exportToExcel(periodSales, `rapport-ventes-${period}-${dateStr}`)
  }

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) => {
    if (trend === "up") return <ArrowUpIcon className="h-4 w-4 text-emerald-500" />
    if (trend === "down") return <ArrowDownIcon className="h-4 w-4 text-red-500" />
    return <MinusIcon className="h-4 w-4 text-stone-400" />
  }

  const periodLabel = {
    today: "aujourd'hui",
    week: "cette semaine",
    month: "ce mois",
    year: "cette annee"
  }

  const previousPeriodLabel = {
    today: "hier",
    week: "semaine derniere",
    month: "mois dernier",
    year: "annee derniere"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-800">Tableau de Bord des Ventes</h2>
          <p className="text-sm text-muted-foreground">
            Analyse de vos performances {periodLabel[period]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-44">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Aujourd&apos;hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette annee</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <DownloadIcon className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Revenue */}
        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Chiffre d&apos;affaires</p>
                <p className="text-4xl font-bold mt-1">{stats.totalRevenue.toFixed(0)}</p>
                <p className="text-emerald-100 text-sm">TND</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <DollarSignIcon className="h-6 w-6" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm">
              <TrendIcon trend={revenueComparison.trend} />
              <span className={revenueComparison.trend === "up" ? "text-emerald-100" : revenueComparison.trend === "down" ? "text-red-200" : "text-emerald-100"}>
                {revenueComparison.value.toFixed(1)}%
              </span>
              <span className="text-emerald-200">vs {previousPeriodLabel[period]}</span>
            </div>
          </CardContent>
        </Card>

        {/* Sales Count */}
        <Card className="border-2 border-stone-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Nombre de ventes</p>
                <p className="text-4xl font-bold mt-1 text-stone-800">{stats.totalSales}</p>
                <p className="text-muted-foreground text-sm">transactions</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm">
              <TrendIcon trend={salesComparison.trend} />
              <span className={salesComparison.trend === "up" ? "text-emerald-600" : salesComparison.trend === "down" ? "text-red-600" : "text-stone-500"}>
                {salesComparison.value.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs {previousPeriodLabel[period]}</span>
            </div>
          </CardContent>
        </Card>

        {/* Average Basket */}
        <Card className="border-2 border-stone-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Panier moyen</p>
                <p className="text-4xl font-bold mt-1 text-stone-800">{stats.averageBasket.toFixed(2)}</p>
                <p className="text-muted-foreground text-sm">TND</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <TargetIcon className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm">
              <TrendIcon trend={basketComparison.trend} />
              <span className={basketComparison.trend === "up" ? "text-emerald-600" : basketComparison.trend === "down" ? "text-red-600" : "text-stone-500"}>
                {basketComparison.value.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs {previousPeriodLabel[period]}</span>
            </div>
          </CardContent>
        </Card>

        {/* Items Sold */}
        <Card className="border-2 border-stone-200">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Articles vendus</p>
                <p className="text-4xl font-bold mt-1 text-stone-800">{stats.totalItems}</p>
                <p className="text-muted-foreground text-sm">produits</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <PackageIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm">
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <CoinsIcon className="h-3 w-3 mr-1" />
                {stats.pointsEarned} pts
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUpIcon className="h-5 w-5 text-emerald-600" />
              Evolution du chiffre d&apos;affaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.success} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} TND`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                    formatter={(value: number) => [`${value.toFixed(2)} TND`, "CA"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-blue-600" />
              Modes de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {paymentData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Aucune donnee
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      formatter={(value: number, name: string) => [`${value.toFixed(2)} TND`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {paymentData.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-muted-foreground">{p.name}</span>
                  <span className="font-medium ml-auto">{p.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-3 gap-6">
        {/* Sales by Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <UtensilsCrossedIcon className="h-5 w-5 text-amber-600" />
              Types de vente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {saleTypeData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Aucune donnee
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={saleTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {saleTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      formatter={(value: number, name: string) => [`${value.toFixed(2)} TND`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="space-y-1 mt-2">
              {saleTypeData.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-muted-foreground">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{p.value.toFixed(2)} TND</span>
                    <Badge variant="outline" className="text-xs">{p.count}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card className="col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChart className="h-5 w-5 text-purple-600" />
              Repartition horaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              {hourlyData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Aucune donnee
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb" }}
                      formatter={(value: number, name: string) => [
                        name === "revenue" ? `${value.toFixed(2)} TND` : value,
                        name === "revenue" ? "CA" : "Ventes"
                      ]}
                    />
                    <Bar dataKey="ventes" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUpIcon className="h-5 w-5 text-amber-600" />
            Top produits vendus
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune vente pour cette periode
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {stats.topProducts.slice(0, 8).map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-100"
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    index === 0 ? "bg-amber-100 text-amber-700" :
                    index === 1 ? "bg-stone-200 text-stone-600" :
                    index === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-stone-100 text-stone-500"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.quantity} vendus</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-600">{product.revenue.toFixed(2)} TND</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-stone-50 border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <PercentIcon className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Remises accordees</p>
                <p className="text-lg font-bold text-red-600">{stats.totalDiscount.toFixed(2)} TND</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-50 border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TruckIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Frais livraison</p>
                <p className="text-lg font-bold text-purple-600">{stats.totalDeliveryFees.toFixed(2)} TND</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-50 border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <CoinsIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Points distribues</p>
                <p className="text-lg font-bold text-amber-600">{stats.pointsEarned} pts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stone-50 border-stone-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CoinsIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Points utilises</p>
                <p className="text-lg font-bold text-emerald-600">{stats.pointsUsed} pts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
