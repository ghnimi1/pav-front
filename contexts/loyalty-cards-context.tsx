"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { apiGet, apiPost, apiPut } from "@/lib/api-client"
import { useAuth } from "@/contexts/auth-context"
import { useNavigation } from "@/contexts/navigation-context"

export interface StampPosition {
  position: number
  type: "normal" | "game" | "reward"
  gameConfig?: {
    gameName: string
    chances: number
    winCondition: "double-6" | "double-any" | "sum-12"
    rewardProductIds: string[]
  }
  rewardConfig?: {
    rewardProductIds: string[]
    rewardText: string
  }
}

export interface LoyaltyCardConfig {
  id: string
  name: string
  description: string
  productName: string
  productPrice: number
  eligibleProductIds: string[]
  totalStamps: number
  stampPositions: StampPosition[]
  expirationDays: number
  backgroundColor: "dark" | "light"
  stampIcon: "cup" | "croissant" | "custom"
  customStampImage?: string
  gridColumns: number
  isActive: boolean
  autoRenew: boolean
  createdAt: string
  updatedAt: string
}

export interface GameResult {
  played: boolean
  won: boolean
  diceResults: [number, number][]
  finalDice?: [number, number]
  rewardProductId?: string
  playedAt: string
}

export interface CustomerStamp {
  position: number
  stampedAt: string
  orderId: string
  productId: string
  productName: string
  gameResult?: GameResult
  rewardClaimed?: boolean
  rewardProductId?: string
}

export interface CustomerLoyaltyCard {
  id: string
  configId: string
  visitorId: string
  stamps: CustomerStamp[]
  currentStampCount: number
  status: "active" | "completed" | "expired"
  expirationDate: string
  createdAt: string
  completedAt?: string
}

interface LoyaltyCardsResponse {
  isEnabled: boolean
  cardConfigs: LoyaltyCardConfig[]
  customerCards: CustomerLoyaltyCard[]
}

interface LoyaltyCardsContextType {
  isLoyaltyCardsEnabled: boolean
  isLoaded: boolean
  refreshLoyaltyCards: (visitorId?: string) => Promise<void>
  setLoyaltyCardsEnabled: (enabled: boolean) => Promise<void>
  cardConfigs: LoyaltyCardConfig[]
  createCardConfig: (config: Omit<LoyaltyCardConfig, "id" | "createdAt" | "updatedAt">) => Promise<LoyaltyCardConfig>
  updateCardConfig: (id: string, updates: Partial<LoyaltyCardConfig>) => Promise<void>
  deleteCardConfig: (id: string) => Promise<void>
  getActiveConfigs: () => LoyaltyCardConfig[]
  customerCards: CustomerLoyaltyCard[]
  getCustomerCards: (visitorId: string) => CustomerLoyaltyCard[]
  getActiveCustomerCards: (visitorId: string) => CustomerLoyaltyCard[]
  createCustomerCard: (configId: string, visitorId: string) => Promise<CustomerLoyaltyCard | null>
  addStamp: (
    visitorId: string,
    orderId: string,
    productId: string,
    productName: string,
    quantity?: number
  ) => Promise<{
    stamped: boolean
    card?: CustomerLoyaltyCard
    position?: number
    positionType?: "normal" | "game" | "reward"
  }>
  addStampsFromItems: (
    visitorId: string,
    orderId: string,
    items: Array<{ productId: string; productName: string; quantity?: number }>
  ) => Promise<{
    stamped: boolean
    results: Array<{
      card: CustomerLoyaltyCard
      position: number
      positionType: "normal" | "game" | "reward"
    }>
  }>
  playChichBich: (cardId: string, position: number) => Promise<GameResult>
  claimReward: (cardId: string, position: number, productId: string) => Promise<boolean>
  getPendingRewards: (visitorId: string) => { card: CustomerLoyaltyCard; position: number; config: StampPosition }[]
  getPendingGames: (visitorId: string) => { card: CustomerLoyaltyCard; position: number; config: StampPosition }[]
  isProductEligible: (productId: string) => { eligible: boolean; cardConfigs: LoyaltyCardConfig[] }
  getCardConfig: (configId: string) => LoyaltyCardConfig | undefined
}

const LoyaltyCardsContext = createContext<LoyaltyCardsContextType | undefined>(undefined)

const defaultState: LoyaltyCardsResponse = {
  isEnabled: true,
  cardConfigs: [],
  customerCards: [],
}

export function LoyaltyCardsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const { currentNavItem } = useNavigation()
  const [state, setState] = useState<LoyaltyCardsResponse>(defaultState)
  const [isLoaded, setIsLoaded] = useState(false)

  const fetchCards = useCallback(async (visitorId?: string) => {
    if (!isAuthenticated || !user) {
      setState(defaultState)
      setIsLoaded(true)
      return
    }

    try {
      const query = visitorId ? `?visitorId=${encodeURIComponent(visitorId)}` : ""
      const result = await apiGet<LoyaltyCardsResponse>(`/auth/loyalty-cards${query}`)
      setState({
        isEnabled: result.isEnabled ?? true,
        cardConfigs: Array.isArray(result.cardConfigs) ? result.cardConfigs : [],
        customerCards: Array.isArray(result.customerCards) ? result.customerCards : [],
      })
    } catch (error) {
      console.error("Failed to load loyalty cards:", error)
      setState(defaultState)
    } finally {
      setIsLoaded(true)
    }
  }, [isAuthenticated, user])

  useEffect(() => {
    // Only load loyalty cards when viewing loyalty-cards
    if (currentNavItem !== "loyalty-cards") {
      return
    }

    void fetchCards()
  }, [currentNavItem, fetchCards])

  const persistSettings = useCallback(async (next: Partial<LoyaltyCardsResponse>) => {
    const result = await apiPut<{ isEnabled: boolean; cardConfigs: LoyaltyCardConfig[] }>("/auth/loyalty-cards/settings", {
      isEnabled: next.isEnabled ?? state.isEnabled,
      cardConfigs: next.cardConfigs ?? state.cardConfigs,
    })

    setState((prev) => ({
      ...prev,
      isEnabled: result.isEnabled,
      cardConfigs: result.cardConfigs,
    }))
  }, [state.cardConfigs, state.isEnabled])

  const setLoyaltyCardsEnabled = useCallback(async (enabled: boolean) => {
    await persistSettings({ isEnabled: enabled })
  }, [persistSettings])

  const createCardConfig = useCallback(async (config: Omit<LoyaltyCardConfig, "id" | "createdAt" | "updatedAt">) => {
    const newConfig: LoyaltyCardConfig = {
      ...config,
      id: `card-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    await persistSettings({ cardConfigs: [...state.cardConfigs, newConfig] })
    return newConfig
  }, [persistSettings, state.cardConfigs])

  const updateCardConfig = useCallback(async (id: string, updates: Partial<LoyaltyCardConfig>) => {
    await persistSettings({
      cardConfigs: state.cardConfigs.map((config) =>
        config.id === id ? { ...config, ...updates, updatedAt: new Date().toISOString() } : config
      ),
    })
  }, [persistSettings, state.cardConfigs])

  const deleteCardConfig = useCallback(async (id: string) => {
    await persistSettings({
      cardConfigs: state.cardConfigs.filter((config) => config.id !== id),
    })
  }, [persistSettings, state.cardConfigs])

  const getActiveConfigs = useCallback(() => {
    if (!state.isEnabled) return []
    return state.cardConfigs.filter((config) => config.isActive)
  }, [state.cardConfigs, state.isEnabled])

  const getCustomerCards = useCallback((visitorId: string) => {
    return state.customerCards.filter((card) => card.visitorId === visitorId)
  }, [state.customerCards])

  const getActiveCustomerCards = useCallback((visitorId: string) => {
    const now = new Date()
    return state.customerCards.filter((card) => {
      if (card.visitorId !== visitorId) return false
      if (card.status !== "active") return false
      return new Date(card.expirationDate) >= now
    })
  }, [state.customerCards])

  const createCustomerCard = useCallback(async (configId: string, visitorId: string) => {
    const config = state.cardConfigs.find((entry) => entry.id === configId)
    if (!config) return null

    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + config.expirationDays)
    return {
      id: `preview-${Date.now()}`,
      configId,
      visitorId,
      stamps: [],
      currentStampCount: 0,
      status: "active",
      expirationDate: expirationDate.toISOString(),
      createdAt: new Date().toISOString(),
    }
  }, [fetchCards, state.cardConfigs, state.customerCards])

  const addStampsFromItems = useCallback(async (
    visitorId: string,
    orderId: string,
    items: Array<{ productId: string; productName: string; quantity?: number }>
  ) => {
    const result = await apiPost<{
      stamped: boolean
      results: Array<{
        card: CustomerLoyaltyCard
        position: number
        positionType: "normal" | "game" | "reward"
      }>
    }>("/auth/loyalty-cards/stamp", { visitorId, orderId, items })

    await fetchCards(visitorId)
    return result
  }, [fetchCards])

  const addStamp = useCallback(async (
    visitorId: string,
    orderId: string,
    productId: string,
    productName: string,
    quantity = 1
  ) => {
    const result = await addStampsFromItems(visitorId, orderId, [{ productId, productName, quantity }])
    const firstResult = result.results[0]
    return {
      stamped: result.stamped,
      card: firstResult?.card,
      position: firstResult?.position,
      positionType: firstResult?.positionType,
    }
  }, [addStampsFromItems])

  const playChichBich = useCallback(async (cardId: string, position: number) => {
    const result = await apiPost<{ gameResult: GameResult }>("/auth/loyalty-cards/play", { cardId, position })
    await fetchCards()
    return result.gameResult
  }, [fetchCards])

  const claimReward = useCallback(async (cardId: string, position: number, productId: string) => {
    const result = await apiPost<{ success: boolean }>("/auth/loyalty-cards/claim", { cardId, position, productId })
    await fetchCards()
    return result.success
  }, [fetchCards])

  const getPendingRewards = useCallback((visitorId: string) => {
    const results: { card: CustomerLoyaltyCard; position: number; config: StampPosition }[] = []
    state.customerCards
      .filter((card) => card.visitorId === visitorId)
      .forEach((card) => {
        const config = state.cardConfigs.find((entry) => entry.id === card.configId)
        if (!config) return
        card.stamps.forEach((stamp) => {
          const positionConfig = config.stampPositions.find((entry) => entry.position === stamp.position)
          if (positionConfig?.type === "reward" && !stamp.rewardClaimed) {
            results.push({ card, position: stamp.position, config: positionConfig })
          }
        })
      })
    return results
  }, [state.cardConfigs, state.customerCards])

  const getPendingGames = useCallback((visitorId: string) => {
    const results: { card: CustomerLoyaltyCard; position: number; config: StampPosition }[] = []
    state.customerCards
      .filter((card) => card.visitorId === visitorId)
      .forEach((card) => {
        const config = state.cardConfigs.find((entry) => entry.id === card.configId)
        if (!config) return
        card.stamps.forEach((stamp) => {
          const positionConfig = config.stampPositions.find((entry) => entry.position === stamp.position)
          if (positionConfig?.type === "game" && !stamp.gameResult?.played) {
            results.push({ card, position: stamp.position, config: positionConfig })
          }
        })
      })
    return results
  }, [state.cardConfigs, state.customerCards])

  const isProductEligible = useCallback((productId: string) => {
    const eligibleConfigs = state.cardConfigs.filter(
      (config) => config.isActive && config.eligibleProductIds.includes(productId)
    )
    return {
      eligible: eligibleConfigs.length > 0,
      cardConfigs: eligibleConfigs,
    }
  }, [state.cardConfigs])

  const getCardConfig = useCallback((configId: string) => {
    return state.cardConfigs.find((config) => config.id === configId)
  }, [state.cardConfigs])

  const value = useMemo<LoyaltyCardsContextType>(() => ({
    isLoyaltyCardsEnabled: state.isEnabled,
    isLoaded,
    refreshLoyaltyCards: fetchCards,
    setLoyaltyCardsEnabled,
    cardConfigs: state.cardConfigs,
    createCardConfig,
    updateCardConfig,
    deleteCardConfig,
    getActiveConfigs,
    customerCards: state.customerCards,
    getCustomerCards,
    getActiveCustomerCards,
    createCustomerCard,
    addStamp,
    addStampsFromItems,
    playChichBich,
    claimReward,
    getPendingRewards,
    getPendingGames,
    isProductEligible,
    getCardConfig,
  }), [
    addStamp,
    addStampsFromItems,
    claimReward,
    createCardConfig,
    createCustomerCard,
    deleteCardConfig,
    fetchCards,
    getActiveConfigs,
    getCardConfig,
    getCustomerCards,
    getActiveCustomerCards,
    getPendingGames,
    getPendingRewards,
    isLoaded,
    isProductEligible,
    playChichBich,
    setLoyaltyCardsEnabled,
    state.cardConfigs,
    state.customerCards,
    state.isEnabled,
    updateCardConfig,
  ])

  return <LoyaltyCardsContext.Provider value={value}>{children}</LoyaltyCardsContext.Provider>
}

export function useLoyaltyCards() {
  const context = useContext(LoyaltyCardsContext)
  if (!context) {
    throw new Error("useLoyaltyCards must be used within a LoyaltyCardsProvider")
  }
  return context
}
