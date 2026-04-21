"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// ============================================
// CONFIGURATION DU PROGRAMME DE FIDELITE
// Le Pave d'Art - Parametres personnalises
// ============================================
export const LOYALTY_CONFIG = {
  // Points gagnes par TND depense
  pointsPerTND: 1,
  // Points necessaires pour 1 TND de reduction
  pointsPerTNDReduction: 15,
  // Seuils des niveaux VIP
  tiers: {
    bronze: { minPoints: 0, bonus: 0, name: "Bronze", color: "#CD7F32" },
    silver: { minPoints: 500, bonus: 3, name: "Silver", color: "#C0C0C0" },
    gold: { minPoints: 1500, bonus: 7, name: "Gold", color: "#FFD700" },
    diamond: { minPoints: 3000, bonus: 13, name: "Diamond", color: "#B9F2FF" },
  },
  // Journees speciales
  specialDays: {
    women: { day: 3, multiplier: 2, name: "Journee des Femmes" },
    men: { day: 4, multiplier: 2, name: "Journee des Hommes" },
  },
  // Horaires des jeux
  games: {
    roulette: { startHour: 15, endHour: 18, name: "Roulette" },
    chichbich: { startHour: 20, endHour: 23, name: "Chichbich" },
  },
  // Configuration du parrainage
  referral: {
    referrerReward: 100, // Points pour le parrain quand le filleul fait son 1er achat
    referredReward: 50,  // Points de bienvenue pour le filleul a l'inscription
  },
}

// ============================================
// TYPES ET INTERFACES
// ============================================
export type LoyaltyTier = "bronze" | "silver" | "gold" | "diamond"
export type Gender = "male" | "female" | "other"
export type TransactionType = "earn" | "redeem" | "bonus" | "adjustment" | "game_win" | "referral"
export type MissionStatus = "active" | "completed" | "expired"
export type GameType = "roulette" | "chichbich" | "share_spin"

export interface LoyaltyClient {
  id: string
  email: string
  password?: string
  name: string
  phone?: string
  birthDate?: string
  gender?: Gender
  address?: string
  qrCode: string
  loyaltyPoints: number
  lifetimePoints: number
  tier: LoyaltyTier
  totalSpent: number
  totalOrders: number
  wallet: number
  referralCode: string
  referredBy?: string
  referralCount: number
  createdAt: string
  updatedAt: string
  lastVisit?: string
  isActive: boolean
  preferences?: {
    favoriteCategories?: string[]
    allergies?: string[]
    notifications: boolean
    emailMarketing: boolean
    smsMarketing: boolean
  }
}

export interface PointsTransaction {
  id: string
  clientId: string
  type: TransactionType
  points: number
  description: string
  orderId?: string
  staffId?: string
  createdAt: string
  metadata?: {
    multiplier?: number
    bonusReason?: string
    gameType?: GameType
  }
}

export interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  type: "discount" | "free_item" | "special" | "percentage"
  value: number
  image?: string
  category?: string
  minTier?: LoyaltyTier
  isActive: boolean
  stock?: number
  validFrom?: string
  validUntil?: string
  usageLimit?: number
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface Mission {
  id: string
  name: string
  description: string
  type: "visit" | "spend" | "refer" | "birthday" | "review" | "social" | "challenge"
  target: number
  reward: number
  bonusReward?: number
  validFrom: string
  validUntil: string
  isActive: boolean
  icon?: string
  createdAt: string
}

export interface ClientMission {
  id: string
  clientId: string
  missionId: string
  progress: number
  status: MissionStatus
  completedAt?: string
  createdAt: string
}

export interface GamePlay {
  id: string
  clientId: string
  gameType: GameType
  result: "win" | "lose"
  prize?: {
    type: "points" | "discount" | "free_item"
    value: number
    description: string
  }
  playedAt: string
}

export interface ShareLink {
  id: string
  clientId: string
  code: string
  productId: string
  productName: string
  platform: string
  isClicked: boolean
  clickedAt?: string
  clickedBy?: string
  createdAt: string
  expiresAt: string
}

export interface SpecialDay {
  id: string
  name: string
  description: string
  targetGender?: Gender
  dayOfWeek?: number
  specificDate?: string
  multiplier: number
  bonusPoints?: number
  isActive: boolean
  createdAt: string
}

export interface Referral {
  id: string
  referrerId: string
  referredId: string
  referredName: string
  referredEmail: string
  status: "pending" | "first_purchase_pending" | "completed" | "rewarded"
  referrerReward: number
  referredReward: number
  firstPurchaseAmount?: number
  firstPurchaseDate?: string
  validatedBy?: string
  createdAt: string
  completedAt?: string
}

// ============================================
// CONTEXTE
// ============================================
interface LoyaltyContextType {
  clients: LoyaltyClient[]
  addClient: (client: Omit<LoyaltyClient, "id" | "qrCode" | "referralCode" | "createdAt" | "updatedAt">) => LoyaltyClient
  updateClient: (id: string, updates: Partial<LoyaltyClient>) => void
  deleteClient: (id: string) => void
  getClientByQR: (qrCode: string) => LoyaltyClient | undefined
  getClientByEmail: (email: string) => LoyaltyClient | undefined
  getClientByPhone: (phone: string) => LoyaltyClient | undefined

  transactions: PointsTransaction[]
  addPoints: (clientId: string, points: number, type: TransactionType, description: string, metadata?: any) => void
  redeemPoints: (clientId: string, points: number, description: string) => boolean
  calculatePointsForPurchase: (amount: number, clientTier: LoyaltyTier) => number

  rewards: Reward[]
  addReward: (reward: Omit<Reward, "id" | "usageCount" | "createdAt" | "updatedAt">) => void
  updateReward: (id: string, updates: Partial<Reward>) => void
  deleteReward: (id: string) => void
  redeemReward: (clientId: string, rewardId: string) => boolean

  missions: Mission[]
  clientMissions: ClientMission[]
  addMission: (mission: Omit<Mission, "id" | "createdAt">) => void
  updateMission: (id: string, updates: Partial<Mission>) => void
  deleteMission: (id: string) => void
  updateMissionProgress: (clientId: string, missionId: string, progress: number) => void

  gamePlays: GamePlay[]
  canPlayGame: (clientId: string, gameType: GameType) => boolean
  playGame: (clientId: string, gameType: GameType) => GamePlay
  resetGamePlays: (clientId?: string) => void

  specialDays: SpecialDay[]
  addSpecialDay: (day: Omit<SpecialDay, "id" | "createdAt">) => void
  updateSpecialDay: (id: string, updates: Partial<SpecialDay>) => void
  deleteSpecialDay: (id: string) => void
  getTodayMultiplier: (clientGender?: Gender) => number

  referrals: Referral[]
  referralConfig: { referrerReward: number; referredReward: number }
  updateReferralConfig: (config: { referrerReward: number; referredReward: number }) => void
  createReferral: (referrerId: string, referredEmail: string) => string
  completeReferral: (referralCode: string, newClientId: string, newClientName: string, newClientEmail: string) => void
  validateReferralFirstPurchase: (referralId: string, purchaseAmount: number, validatedBy: string) => void
  getReferralsByReferrer: (referrerId: string) => Referral[]
  getPendingReferrals: () => Referral[]

  addToWallet: (clientId: string, amount: number, description: string) => void
  useWallet: (clientId: string, amount: number) => boolean

  // Share Links pour Chichbich
  shareLinks: ShareLink[]
  createShareLink: (clientId: string, productId: string, productName: string, platform: string) => string
  validateShareLink: (code: string, visitorId?: string) => boolean
  getClientShareLink: (clientId: string) => ShareLink | null
  hasValidShareToday: (clientId: string) => boolean

  getClientStats: (clientId: string) => {
    totalPoints: number
    currentPoints: number
    tier: LoyaltyTier
    nextTier: LoyaltyTier | null
    pointsToNextTier: number
    totalSpent: number
    totalOrders: number
    referralCount: number
  }
  getProgramStats: () => {
    totalClients: number
    activeClients: number
    totalPointsIssued: number
    totalPointsRedeemed: number
    totalRewardsRedeemed: number
    clientsByTier: Record<LoyaltyTier, number>
  }
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined)

function generateQRCode(): string {
  return `LPA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

function generateReferralCode(name: string): string {
  const prefix = name.substring(0, 3).toUpperCase()
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}-${suffix}`
}

function calculateTier(lifetimePoints: number): LoyaltyTier {
  if (lifetimePoints >= LOYALTY_CONFIG.tiers.diamond.minPoints) return "diamond"
  if (lifetimePoints >= LOYALTY_CONFIG.tiers.gold.minPoints) return "gold"
  if (lifetimePoints >= LOYALTY_CONFIG.tiers.silver.minPoints) return "silver"
  return "bronze"
}

export function LoyaltyProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<LoyaltyClient[]>([])
  const [transactions, setTransactions] = useState<PointsTransaction[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [clientMissions, setClientMissions] = useState<ClientMission[]>([])
  const [gamePlays, setGamePlays] = useState<GamePlay[]>([])
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [referralConfig, setReferralConfig] = useState({
    referrerReward: LOYALTY_CONFIG.referral.referrerReward,
    referredReward: LOYALTY_CONFIG.referral.referredReward,
  })
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])

  useEffect(() => {
    const storedLoyaltyClients = localStorage.getItem("loyalty_clients")
    const storedAuthClients = localStorage.getItem("clients")
    const storedTransactions = localStorage.getItem("loyalty_transactions")
    const storedRewards = localStorage.getItem("loyalty_rewards")
    const storedMissions = localStorage.getItem("loyalty_missions")
    const storedClientMissions = localStorage.getItem("loyalty_client_missions")
    const storedGamePlays = localStorage.getItem("loyalty_game_plays")
    const storedSpecialDays = localStorage.getItem("loyalty_special_days")
    const storedReferrals = localStorage.getItem("loyalty_referrals")
    const storedReferralConfig = localStorage.getItem("loyalty_referral_config")
    const storedShareLinks = localStorage.getItem("loyalty_share_links")

    // Charger les clients du systeme de fidelite
    let loyaltyClients: LoyaltyClient[] = storedLoyaltyClients ? JSON.parse(storedLoyaltyClients) : []
    
    // Synchroniser avec les clients de l'authentification
    if (storedAuthClients) {
      const authClients = JSON.parse(storedAuthClients)
      const clientsFromAuth = authClients.filter((c: any) => c.role === "client")
      
      clientsFromAuth.forEach((authClient: any) => {
        // Verifier si ce client existe deja dans loyalty_clients
        const existingClient = loyaltyClients.find(
          (lc) => lc.email === authClient.email || lc.id === authClient.id
        )
        
        if (!existingClient) {
          // Ajouter le client au systeme de fidelite
          const newLoyaltyClient: LoyaltyClient = {
            id: authClient.id,
            name: authClient.name,
            email: authClient.email,
            phone: authClient.phone || "",
            gender: authClient.gender || "male",
            birthDate: authClient.birthDate || "",
            loyaltyPoints: authClient.loyaltyPoints || 0,
            lifetimePoints: authClient.lifetimePoints || authClient.loyaltyPoints || 0,
            tier: authClient.loyaltyTier || authClient.tier || "bronze",
            totalSpent: authClient.totalSpent || 0,
            totalOrders: authClient.totalOrders || 0,
            lastVisit: authClient.lastVisit || authClient.createdAt,
            walletBalance: authClient.walletBalance || 0,
            referralCode: authClient.referralCode || generateReferralCode(authClient.name),
            referralCount: authClient.referralCount || 0,
            qrCode: authClient.qrCode || generateQRCode(),
            createdAt: authClient.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          loyaltyClients.push(newLoyaltyClient)
        } else {
          // Mettre a jour les infos si necessaire
          const idx = loyaltyClients.findIndex((lc) => lc.email === authClient.email || lc.id === authClient.id)
          if (idx !== -1) {
            loyaltyClients[idx] = {
              ...loyaltyClients[idx],
              name: authClient.name,
              loyaltyPoints: Math.max(loyaltyClients[idx].loyaltyPoints, authClient.loyaltyPoints || 0),
              totalSpent: Math.max(loyaltyClients[idx].totalSpent, authClient.totalSpent || 0),
              totalOrders: Math.max(loyaltyClients[idx].totalOrders, authClient.totalOrders || 0),
            }
          }
        }
      })
    }
    
    setClients(loyaltyClients)
    if (storedTransactions) setTransactions(JSON.parse(storedTransactions))
    if (storedRewards) setRewards(JSON.parse(storedRewards))
    else setRewards(getInitialRewards())
    if (storedMissions) setMissions(JSON.parse(storedMissions))
    else setMissions(getInitialMissions())
    if (storedClientMissions) setClientMissions(JSON.parse(storedClientMissions))
    if (storedGamePlays) setGamePlays(JSON.parse(storedGamePlays))
    if (storedSpecialDays) setSpecialDays(JSON.parse(storedSpecialDays))
    else setSpecialDays(getInitialSpecialDays())
    if (storedReferrals) setReferrals(JSON.parse(storedReferrals))
    if (storedReferralConfig) setReferralConfig(JSON.parse(storedReferralConfig))
    if (storedShareLinks) setShareLinks(JSON.parse(storedShareLinks))
  }, [])

  useEffect(() => {
    localStorage.setItem("loyalty_clients", JSON.stringify(clients))
  }, [clients])
  useEffect(() => {
    localStorage.setItem("loyalty_transactions", JSON.stringify(transactions))
  }, [transactions])
  useEffect(() => {
    localStorage.setItem("loyalty_rewards", JSON.stringify(rewards))
  }, [rewards])
  useEffect(() => {
    localStorage.setItem("loyalty_missions", JSON.stringify(missions))
  }, [missions])
  useEffect(() => {
    localStorage.setItem("loyalty_client_missions", JSON.stringify(clientMissions))
  }, [clientMissions])
  useEffect(() => {
    localStorage.setItem("loyalty_game_plays", JSON.stringify(gamePlays))
  }, [gamePlays])
  useEffect(() => {
    localStorage.setItem("loyalty_special_days", JSON.stringify(specialDays))
  }, [specialDays])
  useEffect(() => {
    localStorage.setItem("loyalty_referrals", JSON.stringify(referrals))
  }, [referrals])
  useEffect(() => {
    localStorage.setItem("loyalty_share_links", JSON.stringify(shareLinks))
  }, [shareLinks])
  useEffect(() => {
    localStorage.setItem("loyalty_referral_config", JSON.stringify(referralConfig))
  }, [referralConfig])

  // Fonction pour mettre a jour la configuration du parrainage
  const updateReferralConfig = (config: { referrerReward: number; referredReward: number }) => {
    setReferralConfig(config)
  }

  const addClient = (clientData: Omit<LoyaltyClient, "id" | "qrCode" | "referralCode" | "createdAt" | "updatedAt">) => {
    const newClient: LoyaltyClient = {
      ...clientData,
      id: `client-${Date.now()}`,
      qrCode: generateQRCode(),
      referralCode: generateReferralCode(clientData.name),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setClients((prev) => [...prev, newClient])
    return newClient
  }

  const updateClient = (id: string, updates: Partial<LoyaltyClient>) => {
    setClients((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)),
    )
  }

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  const getClientByQR = (qrCode: string) => clients.find((c) => c.qrCode === qrCode)
  const getClientByEmail = (email: string) => clients.find((c) => c.email === email)
  const getClientByPhone = (phone: string) => clients.find((c) => c.phone === phone)

  const calculatePointsForPurchase = (amount: number, clientTier: LoyaltyTier): number => {
    const basePoints = Math.floor(amount * LOYALTY_CONFIG.pointsPerTND)
    const tierBonus = LOYALTY_CONFIG.tiers[clientTier].bonus
    const bonusPoints = Math.floor(basePoints * (tierBonus / 100))
    const dayMultiplier = getTodayMultiplier()
    return Math.floor((basePoints + bonusPoints) * dayMultiplier)
  }

  const addPoints = (
    clientId: string,
    points: number,
    type: TransactionType,
    description: string,
    metadata?: any,
  ) => {
    const client = clients.find((c) => c.id === clientId)
    if (!client) return

    const transaction: PointsTransaction = {
      id: `txn-${Date.now()}`,
      clientId,
      type,
      points,
      description,
      createdAt: new Date().toISOString(),
      metadata,
    }
    setTransactions((prev) => [...prev, transaction])

    const newLifetimePoints = client.lifetimePoints + points
    const newTier = calculateTier(newLifetimePoints)

    updateClient(clientId, {
      loyaltyPoints: client.loyaltyPoints + points,
      lifetimePoints: newLifetimePoints,
      tier: newTier,
    })
  }

  const redeemPoints = (clientId: string, points: number, description: string): boolean => {
    const client = clients.find((c) => c.id === clientId)
    if (!client || client.loyaltyPoints < points) return false

    const transaction: PointsTransaction = {
      id: `txn-${Date.now()}`,
      clientId,
      type: "redeem",
      points: -points,
      description,
      createdAt: new Date().toISOString(),
    }
    setTransactions((prev) => [...prev, transaction])

    updateClient(clientId, {
      loyaltyPoints: client.loyaltyPoints - points,
    })

    return true
  }

  const addReward = (rewardData: Omit<Reward, "id" | "usageCount" | "createdAt" | "updatedAt">) => {
    const newReward: Reward = {
      ...rewardData,
      id: `reward-${Date.now()}`,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setRewards((prev) => [...prev, newReward])
  }

  const updateReward = (id: string, updates: Partial<Reward>) => {
    setRewards((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)),
    )
  }

  const deleteReward = (id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id))
  }

  const redeemReward = (clientId: string, rewardId: string): boolean => {
    const client = clients.find((c) => c.id === clientId)
    const reward = rewards.find((r) => r.id === rewardId)

    if (!client || !reward) return false
    if (!reward.isActive) return false
    if (client.loyaltyPoints < reward.pointsCost) return false
    if (reward.stock !== undefined && reward.stock <= 0) return false
    if (reward.minTier) {
      const tierOrder = ["bronze", "silver", "gold", "diamond"]
      if (tierOrder.indexOf(client.tier) < tierOrder.indexOf(reward.minTier)) return false
    }

    redeemPoints(clientId, reward.pointsCost, `Echange: ${reward.name}`)

    updateReward(rewardId, {
      usageCount: reward.usageCount + 1,
      stock: reward.stock !== undefined ? reward.stock - 1 : undefined,
    })

    return true
  }

  const addMission = (missionData: Omit<Mission, "id" | "createdAt">) => {
    const newMission: Mission = {
      ...missionData,
      id: `mission-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setMissions((prev) => [...prev, newMission])
  }

  const updateMission = (id: string, updates: Partial<Mission>) => {
    setMissions((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)))
  }

  const deleteMission = (id: string) => {
    setMissions((prev) => prev.filter((m) => m.id !== id))
  }

  const updateMissionProgress = (clientId: string, missionId: string, progress: number) => {
    const mission = missions.find((m) => m.id === missionId)
    if (!mission) return

    const existingProgress = clientMissions.find((cm) => cm.clientId === clientId && cm.missionId === missionId)

    if (existingProgress) {
      if (existingProgress.status === "completed") return

      const newProgress = existingProgress.progress + progress
      const isCompleted = newProgress >= mission.target

      setClientMissions((prev) =>
        prev.map((cm) =>
          cm.id === existingProgress.id
            ? {
                ...cm,
                progress: newProgress,
                status: isCompleted ? "completed" : "active",
                completedAt: isCompleted ? new Date().toISOString() : undefined,
              }
            : cm,
        ),
      )

      if (isCompleted) {
        addPoints(clientId, mission.reward, "bonus", `Mission completee: ${mission.name}`)
      }
    } else {
      const newClientMission: ClientMission = {
        id: `cm-${Date.now()}`,
        clientId,
        missionId,
        progress,
        status: progress >= mission.target ? "completed" : "active",
        completedAt: progress >= mission.target ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
      }
      setClientMissions((prev) => [...prev, newClientMission])

      if (progress >= mission.target) {
        addPoints(clientId, mission.reward, "bonus", `Mission completee: ${mission.name}`)
      }
    }
  }

  const canPlayGame = (clientId: string, gameType: GameType): boolean => {
    const now = new Date()
    const hour = now.getHours()

    // Lire la configuration admin depuis localStorage
    let gamesConfig: any[] = []
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("pave_art_games_config")
      if (saved) {
        gamesConfig = JSON.parse(saved)
      }
    }

    const gameConfig = gamesConfig.find((g: any) => g.id === gameType)
    const isEnabled = gameConfig?.enabled ?? true
    
    if (!isEnabled) {
      return false
    }

    // Verifier la plage horaire configuree par l'admin
    if (gameType === "roulette") {
      const startHour = gameConfig?.startHour ?? LOYALTY_CONFIG.games.roulette.startHour
      const endHour = gameConfig?.endHour ?? LOYALTY_CONFIG.games.roulette.endHour
      if (hour < startHour || hour >= endHour) {
        return false
      }
    } else if (gameType === "chichbich") {
      const startHour = gameConfig?.startHour ?? LOYALTY_CONFIG.games.chichbich.startHour
      const endHour = gameConfig?.endHour ?? LOYALTY_CONFIG.games.chichbich.endHour
      if (hour < startHour || hour >= endHour) {
        return false
      }
    }

    // Verifier la limite de parties quotidiennes
    const today = now.toISOString().split("T")[0]
    const playedToday = gamePlays.some(
      (gp) => gp.clientId === clientId && gp.gameType === gameType && gp.playedAt.startsWith(today),
    )

    return !playedToday
  }

  const playGame = (clientId: string, gameType: GameType): GamePlay => {
    const prizes = [
      { type: "points" as const, value: 10, description: "10 points bonus", probability: 0.3 },
      { type: "points" as const, value: 25, description: "25 points bonus", probability: 0.2 },
      { type: "points" as const, value: 50, description: "50 points bonus", probability: 0.1 },
      { type: "discount" as const, value: 5, description: "5 TND de reduction", probability: 0.15 },
      { type: "discount" as const, value: 10, description: "10 TND de reduction", probability: 0.05 },
      { type: "free_item" as const, value: 1, description: "Croissant offert", probability: 0.1 },
    ]

    const random = Math.random()
    let cumulativeProbability = 0
    let wonPrize = null

    for (const prize of prizes) {
      cumulativeProbability += prize.probability
      if (random <= cumulativeProbability) {
        wonPrize = prize
        break
      }
    }

    const gamePlay: GamePlay = {
      id: `game-${Date.now()}`,
      clientId,
      gameType,
      result: wonPrize ? "win" : "lose",
      prize: wonPrize
        ? {
            type: wonPrize.type,
            value: wonPrize.value,
            description: wonPrize.description,
          }
        : undefined,
      playedAt: new Date().toISOString(),
    }

setGamePlays((prev) => [...prev, gamePlay])

    if (wonPrize && wonPrize.type === "points") {
      addPoints(clientId, wonPrize.value, "game_win", `Gain ${gameType}: ${wonPrize.description}`, { gameType })
    } else if (wonPrize && wonPrize.type === "discount") {
      const client = clients.find((c) => c.id === clientId)
      if (client) {
        addToWallet(clientId, wonPrize.value, `Gain ${gameType}: ${wonPrize.description}`)
      }
    }

    return gamePlay
  }

  // Reinitialiser les parties jouees (pour un client specifique ou tous)
  const resetGamePlays = (clientId?: string) => {
    if (clientId) {
      // Reinitialiser uniquement pour un client specifique
      setGamePlays((prev) => prev.filter((gp) => gp.clientId !== clientId))
    } else {
      // Reinitialiser toutes les parties jouees
      setGamePlays([])
    }
  }

  const addSpecialDay = (dayData: Omit<SpecialDay, "id" | "createdAt">) => {
    const newDay: SpecialDay = {
      ...dayData,
      id: `special-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setSpecialDays((prev) => [...prev, newDay])
  }

  const updateSpecialDay = (id: string, updates: Partial<SpecialDay>) => {
    setSpecialDays((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)))
  }

  const deleteSpecialDay = (id: string) => {
    setSpecialDays((prev) => prev.filter((d) => d.id !== id))
  }

  const getTodayMultiplier = (clientGender?: Gender): number => {
    const now = new Date()
    const dayOfWeek = now.getDay()

    for (const day of specialDays) {
      if (!day.isActive) continue

      if (day.dayOfWeek !== undefined && day.dayOfWeek === dayOfWeek) {
        if (day.targetGender && clientGender && day.targetGender === clientGender) {
          return day.multiplier
        } else if (!day.targetGender) {
          return day.multiplier
        }
      }

      if (day.specificDate) {
        const today = now.toISOString().split("T")[0]
        if (day.specificDate === today) {
          return day.multiplier
        }
      }
    }

    return 1
  }

  const createReferral = (referrerId: string, referredEmail: string): string => {
    const referrer = clients.find((c) => c.id === referrerId)
    if (!referrer) return ""

    return referrer.referralCode
  }

  const completeReferral = (referralCode: string, newClientId: string, newClientName: string, newClientEmail: string) => {
    const referrer = clients.find((c) => c.referralCode === referralCode)
    if (!referrer) return

    // Verifier si ce client n'a pas deja ete parraine
    const existingReferral = referrals.find((r) => r.referredId === newClientId || r.referredEmail === newClientEmail)
    if (existingReferral) return

    const referral: Referral = {
      id: `ref-${Date.now()}`,
      referrerId: referrer.id,
      referredId: newClientId,
      referredName: newClientName,
      referredEmail: newClientEmail,
      status: "first_purchase_pending", // En attente du premier achat
      referrerReward: referralConfig.referrerReward,
      referredReward: referralConfig.referredReward,
      createdAt: new Date().toISOString(),
    }

    setReferrals((prev) => [...prev, referral])

    // Le filleul recoit ses points de bienvenue immediatement
    addPoints(newClientId, referralConfig.referredReward, "bonus", `Bonus bienvenue - parrainage (${referralConfig.referredReward} pts)`)
    
    // Le parrain ne recevra ses points qu'apres le premier achat du filleul
    updateClient(referrer.id, { referralCount: referrer.referralCount + 1 })
  }

  // Valider le parrainage apres le premier achat du filleul
  const validateReferralFirstPurchase = (referralId: string, purchaseAmount: number, validatedBy: string) => {
    const referral = referrals.find((r) => r.id === referralId)
    if (!referral || referral.status !== "first_purchase_pending") return

    // Mettre a jour le parrainage
    setReferrals((prev) =>
      prev.map((r) =>
        r.id === referralId
          ? {
              ...r,
              status: "rewarded" as const,
              firstPurchaseAmount: purchaseAmount,
              firstPurchaseDate: new Date().toISOString(),
              validatedBy,
              completedAt: new Date().toISOString(),
            }
          : r
      )
    )

    // Donner les points au parrain maintenant
    addPoints(referral.referrerId, referral.referrerReward, "referral", `Bonus parrainage - 1er achat de ${referral.referredName} (${purchaseAmount} TND)`)
  }

  // Obtenir tous les parrainages d'un parrain
  const getReferralsByReferrer = (referrerId: string): Referral[] => {
    return referrals.filter((r) => r.referrerId === referrerId)
  }

  // Obtenir les parrainages en attente de validation
  const getPendingReferrals = (): Referral[] => {
    return referrals.filter((r) => r.status === "first_purchase_pending")
  }

  const addToWallet = (clientId: string, amount: number, description: string) => {
    const client = clients.find((c) => c.id === clientId)
    if (!client) return

    updateClient(clientId, { wallet: client.wallet + amount })
  }

  const useWallet = (clientId: string, amount: number): boolean => {
    const client = clients.find((c) => c.id === clientId)
    if (!client || client.wallet < amount) return false

    updateClient(clientId, { wallet: client.wallet - amount })
    return true
  }

  const getClientStats = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    if (!client) {
      return {
        totalPoints: 0,
        currentPoints: 0,
        tier: "bronze" as LoyaltyTier,
        nextTier: "silver" as LoyaltyTier,
        pointsToNextTier: 500,
        totalSpent: 0,
        totalOrders: 0,
        referralCount: 0,
      }
    }

    const tierOrder: LoyaltyTier[] = ["bronze", "silver", "gold", "diamond"]
    const currentTierIndex = tierOrder.indexOf(client.tier)
    const nextTier = currentTierIndex < 3 ? tierOrder[currentTierIndex + 1] : null

    let pointsToNextTier = 0
    if (nextTier) {
      pointsToNextTier = LOYALTY_CONFIG.tiers[nextTier].minPoints - client.lifetimePoints
    }

    return {
      totalPoints: client.lifetimePoints,
      currentPoints: client.loyaltyPoints,
      tier: client.tier,
      nextTier,
      pointsToNextTier: Math.max(0, pointsToNextTier),
      totalSpent: client.totalSpent,
      totalOrders: client.totalOrders,
      referralCount: client.referralCount,
    }
  }

  // ====== SHARE LINKS FUNCTIONS ======
  const createShareLink = (clientId: string, productId: string, productName: string, platform: string): string => {
    // Generer un code unique
    const code = `SH${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    
    // Expiration: fin de la journee
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    
    const shareLink: ShareLink = {
      id: `share-${Date.now()}`,
      clientId,
      code,
      productId,
      productName,
      platform,
      isClicked: false,
      createdAt: new Date().toISOString(),
      expiresAt: today.toISOString(),
    }
    
    setShareLinks(prev => [...prev, shareLink])
    return code
  }

  const validateShareLink = (code: string, visitorId?: string): boolean => {
    const link = shareLinks.find(l => l.code === code && !l.isClicked)
    if (!link) return false
    
    // Verifier si le lien n'est pas expire
    if (new Date(link.expiresAt) < new Date()) return false
    
    // Marquer comme clique
    setShareLinks(prev => prev.map(l => 
      l.code === code 
        ? { ...l, isClicked: true, clickedAt: new Date().toISOString(), clickedBy: visitorId || "anonymous" }
        : l
    ))
    
    return true
  }

  const getClientShareLink = (clientId: string): ShareLink | null => {
    const today = new Date().toISOString().split("T")[0]
    return shareLinks.find(l => 
      l.clientId === clientId && 
      l.createdAt.startsWith(today)
    ) || null
  }

  const hasValidShareToday = (clientId: string): boolean => {
    const today = new Date().toISOString().split("T")[0]
    return shareLinks.some(l => 
      l.clientId === clientId && 
      l.createdAt.startsWith(today) && 
      l.isClicked
    )
  }

  const getProgramStats = () => {
    const totalPointsIssued = transactions
      .filter((t) => t.points > 0)
      .reduce((sum, t) => sum + t.points, 0)

    const totalPointsRedeemed = Math.abs(
      transactions.filter((t) => t.type === "redeem").reduce((sum, t) => sum + t.points, 0),
    )

    const clientsByTier = clients.reduce(
      (acc, c) => {
        acc[c.tier] = (acc[c.tier] || 0) + 1
        return acc
      },
      { bronze: 0, silver: 0, gold: 0, diamond: 0 } as Record<LoyaltyTier, number>,
    )

    const activeClients = clients.filter((c) => {
      if (!c.lastVisit) return false
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return new Date(c.lastVisit) > thirtyDaysAgo
    }).length

    return {
      totalClients: clients.length,
      activeClients,
      totalPointsIssued,
      totalPointsRedeemed,
      totalRewardsRedeemed: rewards.reduce((sum, r) => sum + r.usageCount, 0),
      clientsByTier,
    }
  }

  return (
    <LoyaltyContext.Provider
      value={{
        clients,
        addClient,
        updateClient,
        deleteClient,
        getClientByQR,
        getClientByEmail,
        getClientByPhone,
        transactions,
        addPoints,
        redeemPoints,
        calculatePointsForPurchase,
        rewards,
        addReward,
        updateReward,
        deleteReward,
        redeemReward,
        missions,
        clientMissions,
        addMission,
        updateMission,
        deleteMission,
        updateMissionProgress,
gamePlays,
  canPlayGame,
  playGame,
  resetGamePlays,
        specialDays,
        addSpecialDay,
        updateSpecialDay,
        deleteSpecialDay,
        getTodayMultiplier,
        referrals,
        referralConfig,
        updateReferralConfig,
        createReferral,
        completeReferral,
        validateReferralFirstPurchase,
        getReferralsByReferrer,
        getPendingReferrals,
        addToWallet,
        useWallet,
        shareLinks,
        createShareLink,
        validateShareLink,
        getClientShareLink,
        hasValidShareToday,
        getClientStats,
        getProgramStats,
      }}
    >
      {children}
    </LoyaltyContext.Provider>
  )
}

export function useLoyalty() {
  const context = useContext(LoyaltyContext)
  if (context === undefined) {
    throw new Error("useLoyalty must be used within a LoyaltyProvider")
  }
  return context
}

function getInitialRewards(): Reward[] {
  return [
    {
      id: "reward-1",
      name: "Croissant Offert",
      description: "Un croissant artisanal offert",
      pointsCost: 50,
      type: "free_item",
      value: 1,
      image: "/golden-croissant.png",
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "reward-2",
      name: "Reduction 5 TND",
      description: "5 TND de reduction sur votre prochaine commande",
      pointsCost: 75,
      type: "discount",
      value: 5,
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "reward-3",
      name: "Patisserie au choix",
      description: "Une patisserie de votre choix offerte",
      pointsCost: 100,
      type: "free_item",
      value: 1,
      minTier: "silver",
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "reward-4",
      name: "Reduction 10 TND",
      description: "10 TND de reduction sur votre prochaine commande",
      pointsCost: 150,
      type: "discount",
      value: 10,
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "reward-5",
      name: "Petit Dejeuner Duo",
      description: "Petit dejeuner complet pour 2 personnes",
      pointsCost: 250,
      type: "special",
      value: 30,
      minTier: "gold",
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "reward-6",
      name: "Gateau Personnalise",
      description: "Un gateau personnalise pour vos occasions speciales",
      pointsCost: 400,
      type: "special",
      value: 50,
      minTier: "diamond",
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]
}

function getInitialMissions(): Mission[] {
  return [
    {
      id: "mission-1",
      name: "Premiere Visite",
      description: "Effectuez votre premier achat",
      type: "visit",
      target: 1,
      reward: 25,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      icon: "star",
      createdAt: new Date().toISOString(),
    },
    {
      id: "mission-2",
      name: "Client Fidele",
      description: "Effectuez 10 achats",
      type: "visit",
      target: 10,
      reward: 100,
      bonusReward: 50,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      icon: "heart",
      createdAt: new Date().toISOString(),
    },
    {
      id: "mission-3",
      name: "Parrain VIP",
      description: "Parrainez 3 amis",
      type: "refer",
      target: 3,
      reward: 150,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      icon: "users",
      createdAt: new Date().toISOString(),
    },
    {
      id: "mission-4",
      name: "Gros Achat",
      description: "Depensez 100 TND en une seule commande",
      type: "spend",
      target: 100,
      reward: 75,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      icon: "shopping-bag",
      createdAt: new Date().toISOString(),
    },
  ]
}

function getInitialSpecialDays(): SpecialDay[] {
  return [
    {
      id: "special-1",
      name: "Journee des Femmes",
      description: "Points doubles pour les femmes le mercredi",
      targetGender: "female",
      dayOfWeek: 3,
      multiplier: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "special-2",
      name: "Journee des Hommes",
      description: "Points doubles pour les hommes le jeudi",
      targetGender: "male",
      dayOfWeek: 4,
      multiplier: 2,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ]
}
