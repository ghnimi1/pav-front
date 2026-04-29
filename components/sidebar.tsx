"use client"

import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import {
  LayoutDashboardIcon,
  PackageIcon,
  FolderIcon,
  TruckIcon,
  MenuIcon,
  UsersIcon,
  GiftIcon,
  XIcon,
  CakeIcon,
  TargetIcon,
  CalendarIcon,
  ScanLineIcon,
  TagIcon,
  ChefHatIcon,
  Dices,
  UserPlusIcon,
  UsersRoundIcon,
  ShieldIcon,
  CrownIcon,
  LayersIcon,
  BoxIcon,
  WarehouseIcon,
  BookOpenIcon,
  GlassWaterIcon,
  FactoryIcon,
  ShoppingCartIcon,
  ReceiptIcon,
  CoffeeIcon,
  ClipboardListIcon,
  SettingsIcon,
  PercentIcon,
  BellIcon,
  UtensilsCrossedIcon,
} from "lucide-react"
import Link from "next/link"
import { useAuth, type PermissionKey } from "@/contexts/auth-context"
import { Badge } from "./ui/badge"

type NavItem =
  | "dashboard"
  | "recipes"
  | "showcases"
  | "production"
  | "showcase-stock"
  | "unified-sales"
  | "breakfast-menu-admin"
  | "menu-admin"
  | "menu-client"
  | "stock-categories"
  | "sub-categories"
  | "products"
  | "storage-locations"
  | "articles"
  | "categories"
  | "suppliers"
  | "menu"
  | "clients-management"
  | "clients"
  | "rewards"
  | "missions"
  | "special-days"
  | "games"
  | "referrals"
  | "loyalty-cards"
  | "staff-pos"
  | "employees"

interface SidebarProps {
  currentView: NavItem
  onViewChange: (view: NavItem) => void
  isOpen: boolean
  onClose: () => void
  isAdmin: boolean
}

export function Sidebar({ currentView, onViewChange, isOpen, onClose, isAdmin }: SidebarProps) {
  const { user, hasPermission } = useAuth()

  const navItems: {
    id: NavItem
    label: string
    icon: any
    adminOnly: boolean
    permission?: PermissionKey
    section?: string
    href?: string
  }[] = [
    {
      id: "dashboard",
      label: "Tableau de Bord",
      icon: LayoutDashboardIcon,
      adminOnly: false,
      permission: "dashboard",
      section: "general",
    },
    // Production Section
    {
      id: "unified-sales",
      label: "Ventes & Commandes",
      icon: ShoppingCartIcon,
      adminOnly: false,
      permission: "dashboard",
      section: "production",
    },
    {
      id: "recipes",
      label: "Fiches Techniques",
      icon: BookOpenIcon,
      adminOnly: true,
      permission: "articles",
      section: "production",
    },
    {
      id: "showcases",
      label: "Vitrines",
      icon: GlassWaterIcon,
      adminOnly: true,
      permission: "articles",
      section: "production",
    },
    {
      id: "production",
      label: "Production / Labo",
      icon: FactoryIcon,
      adminOnly: false,
      permission: "articles",
      section: "production",
    },
    {
      id: "showcase-stock",
      label: "Stock Vitrine",
      icon: ReceiptIcon,
      adminOnly: false,
      permission: "articles",
      section: "production",
    },
    
    {
      id: "breakfast-menu-admin",
      label: "Menu P.Dej (Admin)",
      icon: ClipboardListIcon,
      adminOnly: true,
      permission: "articles",
      section: "production",
    },
    {
      id: "menu-client",
      label: "Menu Client",
      icon: MenuIcon,
      adminOnly: true,
      permission: "articles",
      section: "production",
      //href: "/admin/menu-client",
    },
    {
      id: "menu-admin",
      label: "Gestion Menu",
      icon: UtensilsCrossedIcon,
      adminOnly: true,
      permission: "articles",
      section: "production",
      //href: "/admin/menu",
    },
    // Stock Section
    {
      id: "stock-categories",
      label: "Categories Stock",
      icon: FolderIcon,
      adminOnly: true,
      permission: "categories",
      section: "stock",
    },
    {
      id: "sub-categories",
      label: "Sous-categories",
      icon: LayersIcon,
      adminOnly: true,
      permission: "categories",
      section: "stock",
    },
    {
      id: "products",
      label: "Produits & Lots",
      icon: BoxIcon,
      adminOnly: true,
      permission: "articles",
      section: "stock",
    },
    {
      id: "storage-locations",
      label: "Emplacements",
      icon: WarehouseIcon,
      adminOnly: true,
      permission: "articles",
      section: "stock",
    },
   /*  {
      id: "articles",
      label: "Articles (Legacy)",
      icon: PackageIcon,
      adminOnly: false,
      permission: "articles",
      section: "stock",
    },
    {
      id: "categories",
      label: "Categories Menu",
      icon: TagIcon,
      adminOnly: true,
      permission: "categories",
      section: "stock",
    }, */
    {
      id: "suppliers",
      label: "Fournisseurs",
      icon: TruckIcon,
      adminOnly: true,
      permission: "suppliers",
      section: "stock",
    },
   /*  {
      id: "menu",
      label: "Menu Client",
      icon: MenuIcon,
      adminOnly: true,
      permission: "menu",
      section: "menu",
    }, */
    {
      id: "clients-management",
      label: "Gestion Clients",
      icon: UsersIcon,
      adminOnly: true,
      permission: "clients",
      section: "clients",
    },
    {
      id: "clients",
      label: "Clients & Fidelite",
      icon: UsersRoundIcon,
      adminOnly: true,
      permission: "clients_loyalty",
      section: "clients",
    },
    {
      id: "rewards",
      label: "Recompenses",
      icon: GiftIcon,
      adminOnly: true,
      permission: "rewards",
      section: "loyalty",
    },
    {
      id: "missions",
      label: "Missions",
      icon: TargetIcon,
      adminOnly: true,
      permission: "missions",
      section: "loyalty",
    },
    {
      id: "special-days",
      label: "Journees Speciales",
      icon: CalendarIcon,
      adminOnly: true,
      permission: "special_days",
      section: "loyalty",
    },
    {
      id: "games",
      label: "Jeux",
      icon: Dices,
      adminOnly: true,
      permission: "games",
      section: "loyalty",
    },
    {
      id: "referrals",
      label: "Parrainages",
      icon: UserPlusIcon,
      adminOnly: true,
      permission: "referrals",
      section: "loyalty",
    },
    {
      id: "loyalty-cards",
      label: "Cartes a Tampons",
      icon: CoffeeIcon,
      adminOnly: true,
      permission: "rewards",
      section: "loyalty",
      //href: "/admin/cartes-fidelite",
    },
    {
      id: "staff-pos",
      label: "Espace Caisse",
      icon: ScanLineIcon,
      adminOnly: true,
      permission: "pos",
      section: "operations",
    },
    {
      id: "employees",
      label: "Employes",
      icon: ShieldIcon,
      adminOnly: true,
      permission: "employees",
      section: "admin",
    },
  ]

  const handleNavClick = (view: NavItem) => {
    onViewChange(view)
    onClose()
  }

  // Filter items based on admin status and permissions
  const visibleNavItems = navItems.filter((item) => {
    // Non-admin users only see non-admin items
    if (!isAdmin && item.adminOnly) return false
    
    // For employee users with permissions, check specific permission
    if (user?.permissions && item.permission) {
      return hasPermission(item.permission)
    }
    
    // For old admin accounts without employee system, show all admin items
    if (isAdmin && user?.role === "admin" && !user?.employeeRole) {
      return true
    }
    
    return !item.adminOnly
  })

  // Get role display info
  const getRoleInfo = () => {
    if (!user) return null
    
    if (user.employeeRole) {
      switch (user.employeeRole) {
        case "super_admin":
          return { label: "Super Admin", color: "bg-purple-100 text-purple-700", icon: CrownIcon }
        case "admin":
          return { label: "Admin", color: "bg-red-100 text-red-700", icon: ShieldIcon }
        case "manager":
          return { label: "Manager", color: "bg-blue-100 text-blue-700", icon: ShieldIcon }
        case "employee":
          return { label: "Employe", color: "bg-green-100 text-green-700", icon: UsersIcon }
      }
    }
    
    if (user.role === "admin") {
      return { label: "Admin", color: "bg-red-100 text-red-700", icon: ShieldIcon }
    }
    
    return null
  }

  const roleInfo = getRoleInfo()

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-border p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ChefHatIcon className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">Le Pave d&apos;Art</h1>
                  <p className="text-xs text-muted-foreground">Gestion & Fidelite</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Role Badge */}
            {roleInfo && (
              <div className="mt-4 flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                  <roleInfo.icon className="h-3 w-3" />
                  {roleInfo.label}
                </div>
                {user?.permissions && (
                  <span className="text-xs text-muted-foreground">
                    {user.permissions.length} droits
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = currentView === item.id

              // If item has href, render as Link
              if (item.href) {
                return (
                  <Link key={item.id} href={item.href} className="block">
                    <Button
                      variant="ghost"
                      className={cn("w-full justify-start gap-3")}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  </Link>
                )
              }

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn("w-full justify-start gap-3", isActive && "bg-secondary font-medium")}
                  onClick={() => handleNavClick(item.id)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              )
            })}
          </nav>

          {/* Settings Section - Admin Only */}
          {isAdmin && (
            <div className="border-t border-border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Parametres</p>
              <Link href="/admin/parametres/remises" className="block">
                <Button variant="ghost" className="w-full justify-start gap-3 text-sm">
                  <PercentIcon className="h-4 w-4" />
                  Remises Progressives
                </Button>
              </Link>
              <Link href="/admin/notifications" className="block">
                <Button variant="ghost" className="w-full justify-start gap-3 text-sm">
                  <BellIcon className="h-4 w-4" />
                  Historique Notifications
                </Button>
              </Link>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-border p-4">
            <p className="text-xs text-muted-foreground">v1.0.0</p>
          </div>
        </div>
      </aside>
    </>
  )
}
