"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export type NavItem =
  | "dashboard"
  | "recipes"
  | "showcases"
  | "production"
  | "showcase-stock"
  | "unified-sales"
  | "breakfast-menu-admin"
  | "stock-categories"
  | "sub-categories"
  | "products"
  | "storage-locations"
  | "articles"
  | "categories"
  | "suppliers"
  | "batches"
  | "menu"
  | "clients-management"
  | "clients"
  | "rewards"
  | "missions"
  | "special-days"
  | "games"
  | "referrals"
  | "staff-pos"
  | "employees"
  | "menu-client"
  | "menu-admin"
  | "loyalty-cards"
  | "discount-settings"
  | "notifications-history"
  | "supplements"

interface NavigationContextType {
  currentNavItem: NavItem
  setCurrentNavItem: (item: NavItem) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children, initialNavItem }: { children: ReactNode; initialNavItem?: NavItem }) {
  const [currentNavItem, setCurrentNavItem] = useState<NavItem>(initialNavItem ?? "dashboard")

  return (
    <NavigationContext.Provider value={{ currentNavItem, setCurrentNavItem }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  // Return a default value if provider is not present (for pages outside admin dashboard)
  if (context === undefined) {
    return { currentNavItem: "dashboard" as NavItem, setCurrentNavItem: () => {} }
  }
  return context
}
