"use client"

import { useStock } from "@/contexts/stock-context"
import { useLoyalty } from "@/contexts/loyalty-context"
import { useAuth } from "@/contexts/auth-context"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboardIcon,
  PackageIcon, 
  UsersIcon, 
  TrendingUpIcon,
  TrendingDownIcon,
  AlertTriangleIcon,
  CalendarIcon,
  GiftIcon,
  AwardIcon,
  ShoppingCartIcon,
  TargetIcon,
  PercentIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  BoxIcon,
  LayersIcon,
  FolderIcon,
  ClockIcon,
  StarIcon,
  UserPlusIcon,
  Dices,
  CrownIcon,
  WalletIcon,
  ActivityIcon,
  ZapIcon,
  ShieldIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon
} from "lucide-react"
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"

export function DashboardOverview() {
  const { 
    stockCategories = [], 
    subCategories = [], 
    products = [], 
    suppliers = [],
    menuItems = [],
    getLowStockProducts,
    getExpiringSoonBatches
  } = useStock()
  
  const { 
    clients = [], 
    transactions = [], 
    rewards = [], 
    missions = [],
    gamePlays = [],
    referrals = [],
    getProgramStats
  } = useLoyalty()
  
  const { employees = [] } = useAuth()

  // Stock KPIs
  const totalBatches = (products || []).reduce((sum, p) => sum + (p.batches?.length || 0), 0)
  const totalStockValue = (products || []).reduce((sum, p) => {
    return sum + (p.batches || []).reduce((bSum, b) => bSum + (b.quantity * b.unitCost), 0)
  }, 0)
  const lowStockProducts = getLowStockProducts?.() ?? []
  const expiringBatches = getExpiringSoonBatches?.() ?? []
  const totalStockQuantity = (products || []).reduce((sum, p) => {
    return sum + (p.batches || []).reduce((bSum, b) => bSum + b.quantity, 0)
  }, 0)

  // Loyalty KPIs
  const programStats = getProgramStats?.() ?? {
    totalClients: 0,
    activeClients: 0,
    totalPointsIssued: 0,
    totalPointsRedeemed: 0,
    totalRewardsRedeemed: 0,
    clientsByTier: { bronze: 0, silver: 0, gold: 0, diamond: 0 }
  }

  const totalClientSpent = (clients || []).reduce((sum, c) => sum + (c.totalSpent || 0), 0)
  const avgSpentPerClient = clients.length > 0 ? totalClientSpent / clients.length : 0
  const totalWalletBalance = (clients || []).reduce((sum, c) => sum + (c.wallet || 0), 0)
  
  // Recent transactions (last 7 days)
  const last7Days = new Date()
  last7Days.setDate(last7Days.getDate() - 7)
  const recentTransactions = (transactions || []).filter(t => new Date(t.createdAt) >= last7Days)
  const pointsEarnedThisWeek = recentTransactions.filter(t => t.type === 'earn' || t.type === 'bonus').reduce((sum, t) => sum + t.points, 0)
  const pointsRedeemedThisWeek = recentTransactions.filter(t => t.type === 'redeem').reduce((sum, t) => sum + Math.abs(t.points), 0)

  // Referral stats
  const completedReferrals = (referrals || []).filter(r => r.status === 'completed').length
  const pendingReferrals = (referrals || []).filter(r => r.status === 'pending').length

  // Game stats
  const todayGamePlays = (gamePlays || []).filter(g => {
    const today = new Date().toDateString()
    return new Date(g.playedAt).toDateString() === today
  }).length

  // Employee stats
  const activeEmployees = (employees || []).filter(e => e.isActive).length
  const superAdmins = (employees || []).filter(e => e.role === 'super_admin').length
  const admins = (employees || []).filter(e => e.role === 'admin').length
  const managers = (employees || []).filter(e => e.role === 'manager').length

  // Chart data for stock distribution by category
  const stockByCategory = (stockCategories || []).map(cat => {
    const catSubCategories = (subCategories || []).filter(s => s.categoryId === cat.id)
    const catProducts = (products || []).filter(p => catSubCategories.some(s => s.id === p.subCategoryId))
    const value = catProducts.reduce((sum, p) => {
      return sum + (p.batches || []).reduce((bSum, b) => bSum + (b.quantity * b.unitCost), 0)
    }, 0)
    return { name: cat.name, value, icon: cat.icon }
  }).filter(c => c.value > 0)

  // Chart data for clients by tier
  const clientsByTier = [
    { name: 'Bronze', value: programStats.clientsByTier?.bronze || 0, color: '#CD7F32' },
    { name: 'Silver', value: programStats.clientsByTier?.silver || 0, color: '#C0C0C0' },
    { name: 'Gold', value: programStats.clientsByTier?.gold || 0, color: '#FFD700' },
    { name: 'Diamond', value: programStats.clientsByTier?.diamond || 0, color: '#B9F2FF' },
  ].filter(t => t.value > 0)

  // Mock data for trends (in production this would come from historical data)
  const salesTrendData = [
    { day: 'Lun', ventes: 450, clients: 12 },
    { day: 'Mar', ventes: 380, clients: 10 },
    { day: 'Mer', ventes: 520, clients: 15 },
    { day: 'Jeu', ventes: 410, clients: 11 },
    { day: 'Ven', ventes: 680, clients: 22 },
    { day: 'Sam', ventes: 890, clients: 35 },
    { day: 'Dim', ventes: 750, clients: 28 },
  ]

  const pointsTrendData = [
    { day: 'Lun', gagnes: 450, utilises: 120 },
    { day: 'Mar', gagnes: 380, utilises: 80 },
    { day: 'Mer', gagnes: 520, utilises: 200 },
    { day: 'Jeu', gagnes: 410, utilises: 150 },
    { day: 'Ven', gagnes: 680, utilises: 300 },
    { day: 'Sam', gagnes: 890, utilises: 450 },
    { day: 'Dim', gagnes: 750, utilises: 280 },
  ]

  // Health score calculation (0-100)
  const stockHealth = lowStockProducts.length === 0 && expiringBatches.length === 0 ? 100 : 
    Math.max(0, 100 - (lowStockProducts.length * 10) - (expiringBatches.length * 15))

  return (
    <div className="space-y-6">
      {/* Header with date and refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tableau de Bord</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCwIcon className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Health Score Banner */}
      <Card className={`p-4 border-l-4 ${stockHealth >= 80 ? 'border-l-emerald-500 bg-emerald-50' : stockHealth >= 50 ? 'border-l-amber-500 bg-amber-50' : 'border-l-red-500 bg-red-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stockHealth >= 80 ? 'bg-emerald-500' : stockHealth >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}>
              {stockHealth >= 80 ? <CheckCircleIcon className="h-6 w-6 text-white" /> : <AlertTriangleIcon className="h-6 w-6 text-white" />}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Sante du Stock: {stockHealth}%</h3>
              <p className="text-sm text-muted-foreground">
                {lowStockProducts.length} produit(s) en stock bas, {expiringBatches.length} lot(s) a expiration proche
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {lowStockProducts.length > 0 && (
              <Button size="sm" variant="outline" className="gap-1 text-amber-700 border-amber-300 hover:bg-amber-100">
                <PackageIcon className="h-4 w-4" />
                Commander
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main KPI Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Stock Value */}
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Valeur Stock</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalStockValue.toFixed(0)} TND</p>
              <div className="flex items-center gap-1 mt-1 text-emerald-600 text-xs">
                <TrendingUpIcon className="h-3 w-3" />
                <span>+5.2% vs hier</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <WalletIcon className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>

        {/* Total Products */}
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Produits</p>
              <p className="text-2xl font-bold text-foreground mt-1">{products?.length || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{totalBatches} lots actifs</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BoxIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Total Clients */}
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Clients Fidelite</p>
              <p className="text-2xl font-bold text-foreground mt-1">{programStats.totalClients}</p>
              <div className="flex items-center gap-1 mt-1 text-emerald-600 text-xs">
                <UserPlusIcon className="h-3 w-3" />
                <span>+{pendingReferrals} en attente</span>
              </div>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Points Circulation */}
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Points en Circulation</p>
              <p className="text-2xl font-bold text-foreground mt-1">{(programStats.totalPointsIssued - programStats.totalPointsRedeemed).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">{programStats.totalRewardsRedeemed} recompenses</p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <StarIcon className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Second row of KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        <Card className="p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-stone-100 flex items-center justify-center">
              <FolderIcon className="h-4 w-4 text-stone-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{stockCategories?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Categories</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-violet-100 flex items-center justify-center">
              <LayersIcon className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{subCategories?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Sous-cat.</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-cyan-100 flex items-center justify-center">
              <GiftIcon className="h-4 w-4 text-cyan-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{rewards?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Recompenses</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-pink-100 flex items-center justify-center">
              <TargetIcon className="h-4 w-4 text-pink-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{missions?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Missions</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center">
              <Dices className="h-4 w-4 text-orange-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{todayGamePlays}</p>
              <p className="text-xs text-muted-foreground">Jeux Auj.</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-teal-100 flex items-center justify-center">
              <ShieldIcon className="h-4 w-4 text-teal-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{activeEmployees}</p>
              <p className="text-xs text-muted-foreground">Employes</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sales Trend Chart */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Tendance des Ventes</h3>
              <p className="text-sm text-muted-foreground">7 derniers jours</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                <span>Ventes (TND)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <span>Clients</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrendData}>
                <defs>
                  <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Area type="monotone" dataKey="ventes" stroke="#f59e0b" fill="url(#colorVentes)" strokeWidth={2} />
                <Line type="monotone" dataKey="clients" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Points Activity Chart */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Activite Points</h3>
              <p className="text-sm text-muted-foreground">Points gagnes vs utilises</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <span>Gagnes</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span>Utilises</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pointsTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e5e5',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                />
                <Bar dataKey="gagnes" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="utilises" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Third Row - Distribution & Alerts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Stock Distribution Pie */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-4">Repartition Stock</h3>
          {stockByCategory.length > 0 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stockByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#f59e0b', '#3b82f6', '#10b981', '#a855f7', '#ec4899'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value.toFixed(0)} TND`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Aucune donnee de stock
            </div>
          )}
        </Card>

        {/* Clients by Tier */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-4">Clients par Niveau</h3>
          {clientsByTier.length > 0 ? (
            <div className="space-y-3">
              {clientsByTier.map((tier) => (
                <div key={tier.name} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ backgroundColor: tier.color + '30' }}>
                    <CrownIcon className="h-4 w-4" style={{ color: tier.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{tier.name}</span>
                      <span className="text-sm font-bold">{tier.value}</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all" 
                        style={{ 
                          width: `${(tier.value / Math.max(programStats.totalClients, 1)) * 100}%`,
                          backgroundColor: tier.color 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
              Aucun client
            </div>
          )}
        </Card>

        {/* Critical Alerts */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Alertes Critiques</h3>
            <span className="text-xs text-muted-foreground">{lowStockProducts.length + expiringBatches.length} total</span>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {lowStockProducts.length === 0 && expiringBatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                  <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm text-muted-foreground">Aucune alerte</p>
              </div>
            ) : (
              <>
                {lowStockProducts.slice(0, 3).map((product) => {
                  const totalStock = (product.batches || []).reduce((sum, b) => sum + b.quantity, 0)
                  return (
                    <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                        <PackageIcon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate">{product.name}</p>
                        <p className="text-xs text-amber-700">Stock: {totalStock} / Min: {product.minQuantity}</p>
                      </div>
                    </div>
                  )
                })}
                {expiringBatches.slice(0, 3).map((batch) => {
                  const product = (products || []).find(p => p.id === batch.productId)
                  const daysUntilExpiry = Math.ceil((new Date(batch.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={batch.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-50 border border-red-200">
                      <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                        <ClockIcon className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-stone-900 truncate">{product?.name || 'Produit'}</p>
                        <p className="text-xs text-red-700">Expire dans {daysUntilExpiry} jour(s)</p>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row - Business Metrics */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center">
              <TrendingUpIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-amber-700 font-medium">CA Total Clients</p>
              <p className="text-xl font-bold text-amber-900">{totalClientSpent.toLocaleString()} TND</p>
            </div>
          </div>
          <p className="text-xs text-amber-700">Moyenne: {avgSpentPerClient.toFixed(2)} TND/client</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <WalletIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-emerald-700 font-medium">Wallets Clients</p>
              <p className="text-xl font-bold text-emerald-900">{totalWalletBalance.toFixed(2)} TND</p>
            </div>
          </div>
          <p className="text-xs text-emerald-700">Solde total des portefeuilles</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-purple-500 flex items-center justify-center">
              <UserPlusIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-purple-700 font-medium">Parrainages</p>
              <p className="text-xl font-bold text-purple-900">{completedReferrals} valides</p>
            </div>
          </div>
          <p className="text-xs text-purple-700">{pendingReferrals} en attente de validation</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <ActivityIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Points Cette Semaine</p>
              <p className="text-xl font-bold text-blue-900">+{pointsEarnedThisWeek}</p>
            </div>
          </div>
          <p className="text-xs text-blue-700">{pointsRedeemedThisWeek} points utilises</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-4">
        <h3 className="font-semibold text-foreground mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Button variant="outline" className="flex-col h-auto py-4 gap-2">
            <PackageIcon className="h-5 w-5 text-amber-600" />
            <span className="text-xs">Ajouter Produit</span>
          </Button>
          <Button variant="outline" className="flex-col h-auto py-4 gap-2">
            <BoxIcon className="h-5 w-5 text-blue-600" />
            <span className="text-xs">Nouveau Lot</span>
          </Button>
          <Button variant="outline" className="flex-col h-auto py-4 gap-2">
            <UsersIcon className="h-5 w-5 text-purple-600" />
            <span className="text-xs">Ajouter Client</span>
          </Button>
          <Button variant="outline" className="flex-col h-auto py-4 gap-2">
            <GiftIcon className="h-5 w-5 text-pink-600" />
            <span className="text-xs">Recompense</span>
          </Button>
          <Button variant="outline" className="flex-col h-auto py-4 gap-2">
            <TargetIcon className="h-5 w-5 text-emerald-600" />
            <span className="text-xs">Mission</span>
          </Button>
          <Button variant="outline" className="flex-col h-auto py-4 gap-2">
            <ShoppingCartIcon className="h-5 w-5 text-orange-600" />
            <span className="text-xs">Caisse</span>
          </Button>
        </div>
      </Card>
    </div>
  )
}
