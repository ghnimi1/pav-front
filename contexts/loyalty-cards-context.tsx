"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// ============================================
// TYPES ET INTERFACES - CARTES DE FIDELITE A TAMPONS
// ============================================

// Configuration d'une position de tampon
export interface StampPosition {
  position: number // 1, 2, 3... jusqu'à totalStamps
  type: "normal" | "game" | "reward"
  // Si type = "game": le client joue au Chich Bich
  gameConfig?: {
    gameName: string // "Chich Bich"
    chances: number // Nombre de chances (ex: 3)
    winCondition: "double-6" | "double-any" | "sum-12"
    rewardProductIds: string[] // Produits gagnables
  }
  // Si type = "reward": le client reçoit un produit gratuit
  rewardConfig?: {
    rewardProductIds: string[] // Produits offerts au choix
    rewardText: string // "Boisson Chaude Offert"
  }
}

// Configuration d'une carte de fidélité (côté Admin)
export interface LoyaltyCardConfig {
  id: string
  name: string // "Passeport Café", "Passeport Formule"
  description: string
  productName: string // "Café Importé", "Formule Importée"
  productPrice: number // Prix unitaire affiché (2 DT, 4.3 DT)
  eligibleProductIds: string[] // IDs des produits qui comptent pour un tampon
  totalStamps: number // Nombre total de tampons (12, 18, etc.)
  stampPositions: StampPosition[] // Configuration de chaque position
  expirationDays: number // Jours avant expiration (ex: 90 jours)
  backgroundColor: "dark" | "light" // Couleur de fond de la carte
  stampIcon: "cup" | "croissant" | "custom" // Type d'icône pour les tampons
  customStampImage?: string // Image personnalisée si custom
  gridColumns: number // Nombre de colonnes dans la grille (3, 4, 5...)
  isActive: boolean
  autoRenew: boolean // Nouvelle carte auto après complétion
  createdAt: string
  updatedAt: string
}

// Résultat d'un jeu (Chich Bich)
export interface GameResult {
  played: boolean
  won: boolean
  diceResults: [number, number][] // Tous les lancers
  finalDice?: [number, number] // Dernier lancer
  rewardProductId?: string // Produit gagné
  playedAt: string
}

// Tampon individuel d'un client
export interface CustomerStamp {
  position: number
  stampedAt: string
  orderId: string // Commande qui a déclenché le tampon
  productId: string // Produit acheté
  productName: string
  gameResult?: GameResult // Si position de jeu
  rewardClaimed?: boolean // Si position de récompense
  rewardProductId?: string // Produit de récompense réclamé
}

// Carte de fidélité d'un client (instance)
export interface CustomerLoyaltyCard {
  id: string
  configId: string // Référence à LoyaltyCardConfig
visitorId: string // ID du client/visiteur
  stamps: CustomerStamp[] // Tampons obtenus
  currentStampCount: number
  status: "active" | "completed" | "expired"
  expirationDate: string
  createdAt: string
  completedAt?: string
}

// ============================================
// CONTEXTE
// ============================================

interface LoyaltyCardsContextType {
  // Toggle global
  isLoyaltyCardsEnabled: boolean
  setLoyaltyCardsEnabled: (enabled: boolean) => void
  
  // Configurations (Admin)
  cardConfigs: LoyaltyCardConfig[]
  createCardConfig: (config: Omit<LoyaltyCardConfig, "id" | "createdAt" | "updatedAt">) => LoyaltyCardConfig
  updateCardConfig: (id: string, updates: Partial<LoyaltyCardConfig>) => void
  deleteCardConfig: (id: string) => void
  getActiveConfigs: () => LoyaltyCardConfig[]
  
  // Cartes clients
  customerCards: CustomerLoyaltyCard[]
  getCustomerCards: (visitorId: string) => CustomerLoyaltyCard[]
  getActiveCustomerCards: (visitorId: string) => CustomerLoyaltyCard[]
  createCustomerCard: (configId: string, visitorId: string) => CustomerLoyaltyCard
  
  // Tampons
  addStamp: (visitorId: string, orderId: string, productId: string, productName: string) => { 
    stamped: boolean
    card?: CustomerLoyaltyCard
    position?: number
    positionType?: "normal" | "game" | "reward"
  }
  
  // Jeux
  playChichBich: (cardId: string, position: number) => GameResult
  
  // Récompenses
  claimReward: (cardId: string, position: number, productId: string) => boolean
  getPendingRewards: (visitorId: string) => { card: CustomerLoyaltyCard; position: number; config: StampPosition }[]
  getPendingGames: (visitorId: string) => { card: CustomerLoyaltyCard; position: number; config: StampPosition }[]
  
  // Utilitaires
  isProductEligible: (productId: string) => { eligible: boolean; cardConfigs: LoyaltyCardConfig[] }
  getCardConfig: (configId: string) => LoyaltyCardConfig | undefined
}

const LoyaltyCardsContext = createContext<LoyaltyCardsContextType | undefined>(undefined)

// ============================================
// DONNEES INITIALES - EXEMPLES
// ============================================

const initialCardConfigs: LoyaltyCardConfig[] = [
  {
    id: "card-cafe-1",
    name: "Passeport Cafe",
    description: "Cumulez vos cafes et tentez votre chance",
    productName: "Cafe Importe",
    productPrice: 2.0,
    eligibleProductIds: [], // À configurer par l'admin
    totalStamps: 18,
    stampPositions: [
      { position: 1, type: "normal" },
      { position: 2, type: "normal" },
      { position: 3, type: "normal" },
      { position: 4, type: "normal" },
      { position: 5, type: "normal" },
      { position: 6, type: "game", gameConfig: { gameName: "Chich Bich", chances: 3, winCondition: "double-6", rewardProductIds: [] } },
      { position: 7, type: "normal" },
      { position: 8, type: "normal" },
      { position: 9, type: "normal" },
      { position: 10, type: "normal" },
      { position: 11, type: "normal" },
      { position: 12, type: "game", gameConfig: { gameName: "Chich Bich", chances: 3, winCondition: "double-6", rewardProductIds: [] } },
      { position: 13, type: "normal" },
      { position: 14, type: "normal" },
      { position: 15, type: "normal" },
      { position: 16, type: "normal" },
      { position: 17, type: "normal" },
      { position: 18, type: "reward", rewardConfig: { rewardProductIds: [], rewardText: "Cafe Offert" } },
    ],
    expirationDays: 90,
    backgroundColor: "light",
    stampIcon: "cup",
    gridColumns: 4,
    isActive: true,
    autoRenew: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "card-formule-1",
    name: "Passeport Formule",
    description: "Cumulez vos formules et gagnez des recompenses",
    productName: "Formule Importee",
    productPrice: 4.3,
    eligibleProductIds: [], // À configurer par l'admin
    totalStamps: 18,
    stampPositions: [
      { position: 1, type: "normal" },
      { position: 2, type: "normal" },
      { position: 3, type: "normal" },
      { position: 4, type: "normal" },
      { position: 5, type: "normal" },
      { position: 6, type: "game", gameConfig: { gameName: "Chich Bich", chances: 3, winCondition: "double-6", rewardProductIds: [] } },
      { position: 7, type: "normal" },
      { position: 8, type: "normal" },
      { position: 9, type: "normal" },
      { position: 10, type: "normal" },
      { position: 11, type: "reward", rewardConfig: { rewardProductIds: [], rewardText: "Boisson Chaude Offert" } },
      { position: 12, type: "game", gameConfig: { gameName: "Chich Bich", chances: 3, winCondition: "double-6", rewardProductIds: [] } },
      { position: 13, type: "normal" },
      { position: 14, type: "normal" },
      { position: 15, type: "normal" },
      { position: 16, type: "normal" },
      { position: 17, type: "normal" },
      { position: 18, type: "reward", rewardConfig: { rewardProductIds: [], rewardText: "Formule Offert" } },
    ],
    expirationDays: 90,
    backgroundColor: "light",
    stampIcon: "croissant",
    gridColumns: 4,
    isActive: true,
    autoRenew: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// ============================================
// PROVIDER
// ============================================

export function LoyaltyCardsProvider({ children }: { children: ReactNode }) {
  const [isLoyaltyCardsEnabled, setIsLoyaltyCardsEnabled] = useState(true)
  const [cardConfigs, setCardConfigs] = useState<LoyaltyCardConfig[]>(initialCardConfigs)
  const [customerCards, setCustomerCards] = useState<CustomerLoyaltyCard[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Charger depuis localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedEnabled = localStorage.getItem("loyaltyCardsEnabled")
      const savedConfigs = localStorage.getItem("loyaltyCardConfigs")
      const savedCustomerCards = localStorage.getItem("customerLoyaltyCards")
      
      if (savedEnabled !== null) {
        setIsLoyaltyCardsEnabled(savedEnabled === "true")
      }
      
      if (savedConfigs) {
        try {
          setCardConfigs(JSON.parse(savedConfigs))
        } catch (e) {
          console.error("Error loading card configs:", e)
        }
      }
      
      if (savedCustomerCards) {
        try {
          setCustomerCards(JSON.parse(savedCustomerCards))
        } catch (e) {
          console.error("Error loading customer cards:", e)
        }
      }
      
      setIsLoaded(true)
    }
  }, [])

  // Sauvegarder dans localStorage
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem("loyaltyCardsEnabled", String(isLoyaltyCardsEnabled))
    }
  }, [isLoyaltyCardsEnabled, isLoaded])
  
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem("loyaltyCardConfigs", JSON.stringify(cardConfigs))
    }
  }, [cardConfigs, isLoaded])

  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem("customerLoyaltyCards", JSON.stringify(customerCards))
    }
  }, [customerCards, isLoaded])

  // ============================================
  // FONCTIONS ADMIN
  // ============================================

  const createCardConfig = (config: Omit<LoyaltyCardConfig, "id" | "createdAt" | "updatedAt">): LoyaltyCardConfig => {
    const newConfig: LoyaltyCardConfig = {
      ...config,
      id: `card-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setCardConfigs(prev => [...prev, newConfig])
    return newConfig
  }

  const updateCardConfig = (id: string, updates: Partial<LoyaltyCardConfig>) => {
    setCardConfigs(prev =>
      prev.map(config =>
        config.id === id
          ? { ...config, ...updates, updatedAt: new Date().toISOString() }
          : config
      )
    )
  }

  const deleteCardConfig = (id: string) => {
    setCardConfigs(prev => prev.filter(config => config.id !== id))
  }

  const getActiveConfigs = (): LoyaltyCardConfig[] => {
    if (!isLoyaltyCardsEnabled) return []
    return cardConfigs.filter(config => config.isActive)
  }

  const getCardConfig = (configId: string): LoyaltyCardConfig | undefined => {
    return cardConfigs.find(c => c.id === configId)
  }

  // ============================================
  // FONCTIONS CLIENT
  // ============================================

  const getCustomerCards = (visitorId: string): CustomerLoyaltyCard[] => {
    return customerCards.filter(card => card.visitorId === visitorId)
  }

  const getActiveCustomerCards = (visitorId: string): CustomerLoyaltyCard[] => {
    const now = new Date()
    return customerCards.filter(card => {
      if (card.visitorId !== visitorId) return false
      if (card.status === "expired") return false
      if (card.status === "completed") return false
      if (new Date(card.expirationDate) < now) {
        // Marquer comme expiré
        setCustomerCards(prev =>
          prev.map(c => c.id === card.id ? { ...c, status: "expired" as const } : c)
        )
        return false
      }
      return true
    })
  }

  const createCustomerCard = (configId: string, visitorId: string): CustomerLoyaltyCard => {
    const config = cardConfigs.find(c => c.id === configId)
    if (!config) throw new Error("Config not found")

    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + config.expirationDays)

    const newCard: CustomerLoyaltyCard = {
      id: `customer-card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      configId,
      visitorId,
      stamps: [],
      currentStampCount: 0,
      status: "active",
      expirationDate: expirationDate.toISOString(),
      createdAt: new Date().toISOString(),
    }

    setCustomerCards(prev => [...prev, newCard])
    return newCard
  }

  // ============================================
  // TAMPONS
  // ============================================

  const addStamp = (visitorId: string, orderId: string, productId: string, productName: string) => {
    // Trouver les configs éligibles pour ce produit
    const eligibleConfigs = cardConfigs.filter(
      config => config.isActive && config.eligibleProductIds.includes(productId)
    )

    if (eligibleConfigs.length === 0) {
      return { stamped: false }
    }

    // Pour chaque config éligible, trouver ou créer une carte active
    for (const config of eligibleConfigs) {
      let activeCard = customerCards.find(
        card => card.visitorId === visitorId && 
                card.configId === config.id && 
                card.status === "active"
      )

      // Si pas de carte active, en créer une
      if (!activeCard) {
        activeCard = createCustomerCard(config.id, visitorId)
      }

      // Ajouter le tampon
      const nextPosition = activeCard.currentStampCount + 1
      const positionConfig = config.stampPositions.find(p => p.position === nextPosition)

      const newStamp: CustomerStamp = {
        position: nextPosition,
        stampedAt: new Date().toISOString(),
        orderId,
        productId,
        productName,
      }

      const updatedStamps = [...activeCard.stamps, newStamp]
      const isCompleted = nextPosition >= config.totalStamps

      setCustomerCards(prev =>
        prev.map(card => {
          if (card.id === activeCard!.id) {
            const updated: CustomerLoyaltyCard = {
              ...card,
              stamps: updatedStamps,
              currentStampCount: nextPosition,
              status: isCompleted ? "completed" : "active",
              completedAt: isCompleted ? new Date().toISOString() : undefined,
            }
            return updated
          }
          return card
        })
      )

      // Si la carte est complète et auto-renew, créer une nouvelle carte
      if (isCompleted && config.autoRenew) {
        setTimeout(() => {
          createCustomerCard(config.id, visitorId)
        }, 100)
      }

      return {
        stamped: true,
        card: { ...activeCard, stamps: updatedStamps, currentStampCount: nextPosition },
        position: nextPosition,
        positionType: positionConfig?.type || "normal",
      }
    }

    return { stamped: false }
  }

  // ============================================
  // JEUX (CHICH BICH)
  // ============================================

  const rollDice = (): [number, number] => {
    return [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]
  }

  const checkWinCondition = (dice: [number, number], condition: string): boolean => {
    switch (condition) {
      case "double-6":
        return dice[0] === 6 && dice[1] === 6
      case "double-any":
        return dice[0] === dice[1]
      case "sum-12":
        return dice[0] + dice[1] === 12
      default:
        return false
    }
  }

  const playChichBich = (cardId: string, position: number): GameResult => {
    const card = customerCards.find(c => c.id === cardId)
    if (!card) throw new Error("Card not found")

    const config = cardConfigs.find(c => c.id === card.configId)
    if (!config) throw new Error("Config not found")

    const positionConfig = config.stampPositions.find(p => p.position === position)
    if (!positionConfig || positionConfig.type !== "game" || !positionConfig.gameConfig) {
      throw new Error("Invalid game position")
    }

    const { chances, winCondition, rewardProductIds } = positionConfig.gameConfig
    const diceResults: [number, number][] = []
    let won = false
    let finalDice: [number, number] | undefined

    // Jouer les chances
    for (let i = 0; i < chances; i++) {
      const dice = rollDice()
      diceResults.push(dice)
      finalDice = dice
      if (checkWinCondition(dice, winCondition)) {
        won = true
        break
      }
    }

    const gameResult: GameResult = {
      played: true,
      won,
      diceResults,
      finalDice,
      rewardProductId: won && rewardProductIds.length > 0 ? rewardProductIds[0] : undefined,
      playedAt: new Date().toISOString(),
    }

    // Mettre à jour le stamp avec le résultat du jeu
    setCustomerCards(prev =>
      prev.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            stamps: c.stamps.map(s => 
              s.position === position ? { ...s, gameResult } : s
            ),
          }
        }
        return c
      })
    )

    return gameResult
  }

  // ============================================
  // RECOMPENSES
  // ============================================

  const claimReward = (cardId: string, position: number, productId: string): boolean => {
    const card = customerCards.find(c => c.id === cardId)
    if (!card) return false

    const stamp = card.stamps.find(s => s.position === position)
    if (!stamp) return false

    setCustomerCards(prev =>
      prev.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            stamps: c.stamps.map(s =>
              s.position === position
                ? { ...s, rewardClaimed: true, rewardProductId: productId }
                : s
            ),
          }
        }
        return c
      })
    )

    return true
  }

  const getPendingRewards = (visitorId: string) => {
    const results: { card: CustomerLoyaltyCard; position: number; config: StampPosition }[] = []
    
    customerCards
      .filter(card => card.visitorId === visitorId)
      .forEach(card => {
        const config = cardConfigs.find(c => c.id === card.configId)
        if (!config) return

        card.stamps.forEach(stamp => {
          const posConfig = config.stampPositions.find(p => p.position === stamp.position)
          if (posConfig?.type === "reward" && !stamp.rewardClaimed) {
            results.push({ card, position: stamp.position, config: posConfig })
          }
        })
      })

    return results
  }

  const getPendingGames = (visitorId: string) => {
    const results: { card: CustomerLoyaltyCard; position: number; config: StampPosition }[] = []
    
    customerCards
      .filter(card => card.visitorId === visitorId)
      .forEach(card => {
        const config = cardConfigs.find(c => c.id === card.configId)
        if (!config) return

        card.stamps.forEach(stamp => {
          const posConfig = config.stampPositions.find(p => p.position === stamp.position)
          if (posConfig?.type === "game" && !stamp.gameResult?.played) {
            results.push({ card, position: stamp.position, config: posConfig })
          }
        })
      })

    return results
  }

  // ============================================
  // UTILITAIRES
  // ============================================

  const isProductEligible = (productId: string) => {
    const eligibleConfigs = cardConfigs.filter(
      config => config.isActive && config.eligibleProductIds.includes(productId)
    )
    return {
      eligible: eligibleConfigs.length > 0,
      cardConfigs: eligibleConfigs,
    }
  }

  return (
    <LoyaltyCardsContext.Provider
      value={{
        isLoyaltyCardsEnabled,
        setLoyaltyCardsEnabled: setIsLoyaltyCardsEnabled,
        cardConfigs,
        createCardConfig,
        updateCardConfig,
        deleteCardConfig,
        getActiveConfigs,
        customerCards,
        getCustomerCards,
        getActiveCustomerCards,
        createCustomerCard,
        addStamp,
        playChichBich,
        claimReward,
        getPendingRewards,
        getPendingGames,
        isProductEligible,
        getCardConfig,
      }}
    >
      {children}
    </LoyaltyCardsContext.Provider>
  )
}

export function useLoyaltyCards() {
  const context = useContext(LoyaltyCardsContext)
  if (context === undefined) {
    throw new Error("useLoyaltyCards must be used within a LoyaltyCardsProvider")
  }
  return context
}
