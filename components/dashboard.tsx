"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { TopBar } from "./top-bar"
import { DashboardOverview } from "./dashboard-overview"
import { CategoriesManagement } from "./categories-management"
import { ArticlesManagement } from "./articles-management"
import { SuppliersManagement } from "./suppliers-management"
import { BatchPage } from "./batch-page"
import { MenuManagement } from "./menu-management"
import { ClientsLoyaltyManagement } from "./clients-loyalty-management"
import { RewardsManagement } from "./rewards-management"
import { ClientsManagement } from "./clients-management"
import { MissionsManagement } from "./missions-management"
import { SpecialDaysManagement } from "./special-days-management"
import { GamesManagement } from "./games-management"
import { ReferralsManagement } from "./referrals-management"
import { StaffPOS } from "./staff-pos"
import { EmployeesManagement } from "./employees-management"
import { StockCategoriesManagement } from "./stock-categories-management"
import { SubCategoriesManagement } from "./sub-categories-management"
import { ProductsManagement } from "./products-management"
import { StorageLocationsManagement } from "./storage-locations-management"
import { RecipesManagement } from "./recipes-management"
import { ShowcasesManagement } from "./showcases-management"
import { ProductionManagement } from "./production-management"
import { ShowcaseStock } from "./showcase-stock"
import { SalesPOS } from "./sales-pos"
import { MenuClientAdminContent } from "./menu-client-admin-content"
import { BreakfastMenuAdmin } from "./breakfast-menu-admin"
import { UnifiedSalesManagement } from "./unified-sales-management"
import { useAuth } from "@/contexts/auth-context"
import { useNavigation, type NavItem } from "@/contexts/navigation-context"
import { ShieldAlertIcon } from "lucide-react"
import { MenuAdminContent } from "./menu-admin"
import LoyaltyCardsAdminPage from "./cartes-fidelite"
import DiscountSettingsPage from "./remises"
import NotificationsHistoryPage from "@/app/admin/notifications/page"

export function Dashboard() {
  const { currentNavItem, setCurrentNavItem } = useNavigation()
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, hasPermission } = useAuth()

  // Use the navigation context's currentNavItem directly as currentView
  const currentView = currentNavItem

  const handleViewChange = (view: NavItem) => {
    setCurrentNavItem(view)
  }

  const navigateToBatches = (productId: string) => {
    setSelectedProductId(productId)
    setCurrentNavItem("batches")
  }

  const navigateBack = () => {
    setSelectedProductId(null)
    setCurrentNavItem("articles")
  }

  // Check if user is admin (either old admin role or employee with permissions)
  const isAdmin = user?.role === "admin"
  const isUser = user?.role === "user"

  // Permission check helper - for employees with the new permission system
  const canAccess = (permission: string): boolean => {
    // Old admin accounts have full access
    if (isAdmin && !user?.employeeRole) return true
    // New employee system uses hasPermission
    return hasPermission(permission as any)
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isAdmin={isAdmin}
      />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />

        <div className="container mx-auto p-6 lg:p-8">
          {/* Dashboard View */}
          {currentView === "dashboard" && canAccess("dashboard") && (
            <DashboardOverview />
          )}

          {/* Production Views */}
          {currentView === "recipes" && canAccess("articles") && (
            <RecipesManagement />
          )}

          {currentView === "showcases" && canAccess("articles") && (
            <ShowcasesManagement />
          )}

          {currentView === "production" && canAccess("articles") && (
            <ProductionManagement />
          )}

          {currentView === "showcase-stock" && canAccess("articles") && (
            <ShowcaseStock />
          )}

          {currentView === "unified-sales" && canAccess("dashboard") && (
            <UnifiedSalesManagement />
          )}

          {currentView === "breakfast-menu-admin" && canAccess("articles") && (
            <BreakfastMenuAdmin />
          )}

          {/* Stock Views */}
          {currentView === "stock-categories" && canAccess("categories") && (
            <StockCategoriesManagement 
              onSelectCategory={() => {
                setCurrentNavItem("sub-categories")
              }} 
            />
          )}

          {currentView === "sub-categories" && canAccess("categories") && (
            <SubCategoriesManagement 
              onBack={() => setCurrentNavItem("stock-categories")}
              onSelectSubCategory={() => {
                setCurrentNavItem("products")
              }}
            />
          )}

          {currentView === "products" && canAccess("articles") && (
            <ProductsManagement 
              onBack={() => setCurrentNavItem("sub-categories")}
            />
          )}

          {currentView === "storage-locations" && canAccess("articles") && (
            <StorageLocationsManagement />
          )}

          {currentView === "articles" && canAccess("articles") && (
            <ArticlesManagement onNavigateToBatches={navigateToBatches} />
          )}

          {currentView === "categories" && canAccess("categories") && <CategoriesManagement />}

          {currentView === "suppliers" && canAccess("suppliers") && <SuppliersManagement />}

          {currentView === "batches" && selectedProductId && canAccess("batches") && (
            <BatchPage productId={selectedProductId} onBack={navigateBack} isUserRole={isUser} />
          )}

          {currentView === "menu" && canAccess("menu") && <MenuManagement />}

          {currentView === "clients-management" && canAccess("clients") && <ClientsManagement />}

          {currentView === "clients" && canAccess("clients_loyalty") && <ClientsLoyaltyManagement />}

           {currentView === "menu-client" && canAccess("menu") && <MenuClientAdminContent />}

            {currentView === "menu-admin" && canAccess("menu") && <MenuAdminContent />}

          {currentView === "rewards" && canAccess("rewards") && <RewardsManagement />}

          {currentView === "missions" && canAccess("missions") && <MissionsManagement />}

          {currentView === "special-days" && canAccess("special_days") && <SpecialDaysManagement />}

          {currentView === "games" && canAccess("games") && <GamesManagement />}

          {currentView === "referrals" && canAccess("referrals") && <ReferralsManagement />}
          
          {currentView === "loyalty-cards" && canAccess("loyalty-cards") && <LoyaltyCardsAdminPage />}

          {currentView === "staff-pos" && canAccess("pos") && <StaffPOS />}

          {currentView === "employees" && canAccess("employees") && <EmployeesManagement />}

          {currentView === "discount-settings" && canAccess("dashboard") && <DiscountSettingsPage />}

          {currentView === "notifications-history" && canAccess("dashboard") && <NotificationsHistoryPage />}

          {/* Access Denied Message */}
          {((currentView === "dashboard" && !canAccess("dashboard")) ||
            (currentView === "recipes" && !canAccess("articles")) ||
            (currentView === "showcases" && !canAccess("articles")) ||
            (currentView === "production" && !canAccess("articles")) ||
            (currentView === "showcase-stock" && !canAccess("articles")) ||
            (currentView === "unified-sales" && !canAccess("dashboard")) ||
            (currentView === "breakfast-menu-admin" && !canAccess("articles")) ||
            (currentView === "stock-categories" && !canAccess("categories")) ||
            (currentView === "sub-categories" && !canAccess("categories")) ||
            (currentView === "products" && !canAccess("articles")) ||
            (currentView === "articles" && !canAccess("articles")) ||
            (currentView === "categories" && !canAccess("categories")) ||
            (currentView === "suppliers" && !canAccess("suppliers")) ||
            (currentView === "menu" && !canAccess("menu")) ||
            (currentView === "clients-management" && !canAccess("clients")) ||
            (currentView === "clients" && !canAccess("clients_loyalty")) ||
            (currentView === "rewards" && !canAccess("rewards")) ||
            (currentView === "missions" && !canAccess("missions")) ||
            (currentView === "special-days" && !canAccess("special_days")) ||
            (currentView === "games" && !canAccess("games")) ||
            (currentView === "referrals" && !canAccess("referrals")) ||
            (currentView === "staff-pos" && !canAccess("pos")) ||
            (currentView === "employees" && !canAccess("employees")) ||
            (currentView === "discount-settings" && !canAccess("dashboard")) ||
            (currentView === "notifications-history" && !canAccess("dashboard"))) && (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <ShieldAlertIcon className="h-8 w-8 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Acces restreint</h2>
                <p className="mt-2 text-muted-foreground">
                  Vous n&apos;avez pas les permissions necessaires pour acceder a cette section.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Contactez votre administrateur si vous pensez que c&apos;est une erreur.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
