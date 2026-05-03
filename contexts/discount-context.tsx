"use client"

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode } from "react"
import { apiGet, apiPut } from "@/lib/api-client"
import { useNavigation } from "@/contexts/navigation-context"

// ============================================
// TYPES
// ============================================

export interface DiscountTier {
  id: string
  minAmount: number
  maxAmount: number
  percent: number
  name: string
  color: string
  isActive: boolean
}

export interface DiscountConfig {
  _id?: string
  isEnabled: boolean
  minItemsForDiscount: number // Minimum number of items to qualify for discount
  tiers: DiscountTier[]
  updatedAt?: string | Date
}

export interface DiscountResult {
  discountAmount: number
  discountPercent: number
  tier: DiscountTier | null
  nextTier: {
    minAmount: number
    discount: number
    amountNeeded: string
    savings: string
    name: string
  } | null
  message: string | null
  isEligible: boolean
}

interface DiscountContextType {
  config: DiscountConfig
  isEnabled: boolean
  tiers: DiscountTier[]
  
  // Admin actions
  updateConfig: (config: Partial<DiscountConfig>) => void
  addTier: (tier: Omit<DiscountTier, "id">) => void
  updateTier: (id: string, updates: Partial<DiscountTier>) => void
  deleteTier: (id: string) => void
  toggleTier: (id: string) => void
  toggleDiscountSystem: () => void
  resetToDefaults: () => void
  
  // Calculation
  calculateDiscount: (subtotal: number, itemCount: number) => DiscountResult
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

const defaultTiers: DiscountTier[] = [
  { id: "tier-1", minAmount: 10, maxAmount: 19.99, percent: 5, name: "Decouverte", color: "bg-emerald-500", isActive: true },
  { id: "tier-2", minAmount: 20, maxAmount: 29.99, percent: 8, name: "Gourmand", color: "bg-blue-500", isActive: true },
  { id: "tier-3", minAmount: 30, maxAmount: 44.99, percent: 10, name: "Genereux", color: "bg-purple-500", isActive: true },
  { id: "tier-4", minAmount: 45, maxAmount: 59.99, percent: 12, name: "Premium", color: "bg-amber-500", isActive: true },
  { id: "tier-5", minAmount: 60, maxAmount: 99.99, percent: 15, name: "VIP", color: "bg-rose-500", isActive: true },
  { id: "tier-6", minAmount: 100, maxAmount: 999999, percent: 18, name: "Excellence", color: "bg-gradient-to-r from-amber-500 to-rose-500", isActive: true },
]

const defaultConfig: DiscountConfig = {
  isEnabled: true,
  minItemsForDiscount: 2,
  tiers: defaultTiers,
}

// ============================================
// CONTEXT
// ============================================

const DiscountContext = createContext<DiscountContextType | undefined>(undefined)
const DISCOUNT_STORAGE_KEY = "patisserie-discount-config"

function normalizeConfig(config: DiscountConfig): DiscountConfig {
  return {
    ...defaultConfig,
    ...config,
    minItemsForDiscount: Math.max(1, Number(config.minItemsForDiscount || defaultConfig.minItemsForDiscount)),
    tiers: Array.isArray(config.tiers) ? config.tiers : defaultConfig.tiers,
  }
}

function formatAmountNeeded(minAmount: number, subtotal: number) {
  return Math.max(0, minAmount - subtotal).toFixed(2)
}

export function DiscountProvider({ children }: { children: ReactNode }) {
  const { currentNavItem } = useNavigation()
  const [config, setConfig] = useState<DiscountConfig>(() => {
    // Try to load from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(DISCOUNT_STORAGE_KEY)
      if (saved) {
        try {
          return normalizeConfig(JSON.parse(saved))
        } catch {
          return defaultConfig
        }
      }
    }
    return defaultConfig
  })

  const [hasLoadedConfig, setHasLoadedConfig] = useState(false)

  useEffect(() => {
    // Only load discount config when viewing discount-settings
    if (currentNavItem !== "discount-settings") {
      return
    }

    if (hasLoadedConfig) {
      return
    }

    let cancelled = false

    const loadConfig = async () => {
      try {
        const remoteConfig = await apiGet<DiscountConfig>("/discounts/config", { skipAuth: true })
        if (cancelled) return
        const nextConfig = normalizeConfig(remoteConfig)
        setConfig(nextConfig)
        localStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify(nextConfig))
        setHasLoadedConfig(true)
      } catch (error) {
        console.error("Failed to load discount config:", error)
      }
    }

    void loadConfig()

    return () => {
      cancelled = true
    }
  }, [currentNavItem, hasLoadedConfig])

  // Save to localStorage whenever config changes
  const saveConfig = useCallback((newConfig: DiscountConfig) => {
    const nextConfig = normalizeConfig(newConfig)
    setConfig(nextConfig)
    if (typeof window !== "undefined") {
      localStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify(nextConfig))
    }
    void apiPut<DiscountConfig>("/discounts/config", nextConfig).then((remoteConfig) => {
      const normalizedRemoteConfig = normalizeConfig(remoteConfig)
      setConfig(normalizedRemoteConfig)
      if (typeof window !== "undefined") {
        localStorage.setItem(DISCOUNT_STORAGE_KEY, JSON.stringify(normalizedRemoteConfig))
      }
    }).catch((error) => {
      console.error("Failed to save discount config:", error)
    })
  }, [])

  // Update entire config
  const updateConfig = useCallback((updates: Partial<DiscountConfig>) => {
    saveConfig({ ...config, ...updates })
  }, [config, saveConfig])

  // Add a new tier
  const addTier = useCallback((tier: Omit<DiscountTier, "id">) => {
    const newTier: DiscountTier = {
      ...tier,
      id: `tier-${Date.now()}`,
    }
    saveConfig({
      ...config,
      tiers: [...config.tiers, newTier].sort((a, b) => a.minAmount - b.minAmount),
    })
  }, [config, saveConfig])

  // Update a tier
  const updateTier = useCallback((id: string, updates: Partial<DiscountTier>) => {
    saveConfig({
      ...config,
      tiers: config.tiers
        .map(tier => tier.id === id ? { ...tier, ...updates } : tier)
        .sort((a, b) => a.minAmount - b.minAmount),
    })
  }, [config, saveConfig])

  // Delete a tier
  const deleteTier = useCallback((id: string) => {
    saveConfig({
      ...config,
      tiers: config.tiers.filter(tier => tier.id !== id),
    })
  }, [config, saveConfig])

  // Toggle tier active state
  const toggleTier = useCallback((id: string) => {
    saveConfig({
      ...config,
      tiers: config.tiers.map(tier => 
        tier.id === id ? { ...tier, isActive: !tier.isActive } : tier
      ),
    })
  }, [config, saveConfig])

  // Toggle entire discount system
  const toggleDiscountSystem = useCallback(() => {
    saveConfig({ ...config, isEnabled: !config.isEnabled })
  }, [config, saveConfig])

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    saveConfig(defaultConfig)
  }, [saveConfig])

  // Calculate discount for a given subtotal and item count
  const calculateDiscount = useCallback((subtotal: number, itemCount: number): DiscountResult => {
    // Check if discount system is enabled
    if (!config.isEnabled) {
      return {
        discountAmount: 0,
        discountPercent: 0,
        tier: null,
        nextTier: null,
        message: null,
        isEligible: false,
      }
    }

    // Get active tiers only
    const activeTiers = config.tiers.filter(tier => tier.isActive).sort((a, b) => a.minAmount - b.minAmount)

    // Check minimum items requirement
    if (itemCount < config.minItemsForDiscount) {
      const firstTier = activeTiers[0]
      return {
        discountAmount: 0,
        discountPercent: 0,
        tier: null,
        nextTier: firstTier ? {
          minAmount: firstTier.minAmount,
          discount: firstTier.percent,
          amountNeeded: formatAmountNeeded(firstTier.minAmount, subtotal),
          savings: (firstTier.minAmount * (firstTier.percent / 100)).toFixed(2),
          name: firstTier.name,
        } : null,
        message: `Ajoutez ${config.minItemsForDiscount - itemCount} article(s) pour debloquer les reductions`,
        isEligible: false,
      }
    }

    // Find current tier
    const currentTier = activeTiers.find(
      tier => subtotal >= tier.minAmount && subtotal <= tier.maxAmount
    )

    // Find next tier
    const currentTierIndex = currentTier ? activeTiers.indexOf(currentTier) : -1
    const nextTier = currentTierIndex >= 0 && currentTierIndex < activeTiers.length - 1
      ? activeTiers[currentTierIndex + 1]
      : null

    // If subtotal is below first tier
    if (!currentTier && subtotal < (activeTiers[0]?.minAmount || 10)) {
      const firstTier = activeTiers[0]
      return {
        discountAmount: 0,
        discountPercent: 0,
        tier: null,
        nextTier: firstTier ? {
          minAmount: firstTier.minAmount,
          discount: firstTier.percent,
          amountNeeded: formatAmountNeeded(firstTier.minAmount, subtotal),
          savings: (firstTier.minAmount * (firstTier.percent / 100)).toFixed(2),
          name: firstTier.name,
        } : null,
        message: null,
        isEligible: true,
      }
    }

    // Calculate discount
    if (!currentTier) {
      return {
        discountAmount: 0,
        discountPercent: 0,
        tier: null,
        nextTier: null,
        message: null,
        isEligible: true,
      }
    }

    const discountAmount = Math.round(subtotal * (currentTier.percent / 100) * 100) / 100

    return {
      discountAmount,
      discountPercent: currentTier.percent,
      tier: currentTier,
      nextTier: nextTier ? {
        minAmount: nextTier.minAmount,
        discount: nextTier.percent,
        amountNeeded: formatAmountNeeded(nextTier.minAmount, subtotal),
        savings: (nextTier.minAmount * (nextTier.percent / 100)).toFixed(2),
        name: nextTier.name,
      } : null,
      message: `Reduction ${currentTier.name} appliquee!`,
      isEligible: true,
    }
  }, [config])

  const value = useMemo(() => ({
    config,
    isEnabled: config.isEnabled,
    tiers: config.tiers,
    updateConfig,
    addTier,
    updateTier,
    deleteTier,
    toggleTier,
    toggleDiscountSystem,
    resetToDefaults,
    calculateDiscount,
  }), [config, updateConfig, addTier, updateTier, deleteTier, toggleTier, toggleDiscountSystem, resetToDefaults, calculateDiscount])

  return (
    <DiscountContext.Provider value={value}>
      {children}
    </DiscountContext.Provider>
  )
}

// Fallback calculation function when not in provider (uses defaultTiers defined above)
function createFallbackCalculation() {
  return (subtotal: number, itemCount: number) => {
    if (subtotal < 10 || itemCount < 1) {
      const firstTier = defaultTiers[0]
      return {
        discountAmount: 0,
        discountPercent: 0,
        tier: null,
        nextTier: firstTier ? {
          minAmount: firstTier.minAmount,
          discount: firstTier.percent,
          amountNeeded: formatAmountNeeded(firstTier.minAmount, subtotal),
          savings: (firstTier.minAmount * (firstTier.percent / 100)).toFixed(2),
          name: firstTier.name,
        } : null,
        message: null,
        isEligible: true,
      }
    }

    const currentTier = defaultTiers.find(
      tier => tier.isActive && subtotal >= tier.minAmount && subtotal <= tier.maxAmount
    )

    const currentTierIndex = currentTier ? defaultTiers.indexOf(currentTier) : -1
    const nextTier = currentTierIndex >= 0 && currentTierIndex < defaultTiers.length - 1
      ? defaultTiers[currentTierIndex + 1]
      : null

    if (!currentTier) {
      const firstTier = defaultTiers[0]
      return {
        discountAmount: 0,
        discountPercent: 0,
        tier: null,
        nextTier: firstTier ? {
          minAmount: firstTier.minAmount,
          discount: firstTier.percent,
          amountNeeded: formatAmountNeeded(firstTier.minAmount, subtotal),
          savings: (firstTier.minAmount * (firstTier.percent / 100)).toFixed(2),
          name: firstTier.name,
        } : null,
        message: null,
        isEligible: true,
      }
    }

    const discountAmount = Math.round(subtotal * (currentTier.percent / 100) * 100) / 100

    return {
      discountAmount,
      discountPercent: currentTier.percent,
      tier: currentTier,
      nextTier: nextTier ? {
        minAmount: nextTier.minAmount,
        discount: nextTier.percent,
        amountNeeded: formatAmountNeeded(nextTier.minAmount, subtotal),
        savings: (nextTier.minAmount * (nextTier.percent / 100)).toFixed(2),
        name: nextTier.name,
      } : null,
      message: `Reduction ${currentTier.name} appliquee!`,
      isEligible: true,
    }
  }
}

export function useDiscount() {
  const context = useContext(DiscountContext)
  
  // If not in provider, return a fallback with default tiers
  if (!context) {
    return {
      config: defaultConfig,
      isEnabled: true,
      tiers: defaultTiers,
      updateConfig: () => {},
      addTier: () => {},
      updateTier: () => {},
      deleteTier: () => {},
      toggleTier: () => {},
      toggleDiscountSystem: () => {},
      resetToDefaults: () => {},
      calculateDiscount: createFallbackCalculation(),
    }
  }
  
  return context
}
