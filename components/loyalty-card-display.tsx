"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { 
  GiftIcon, 
  DicesIcon, 
  ChevronRightIcon,
  SparklesIcon,
  TrophyIcon,
  CalendarIcon,
  CheckIcon,
} from "lucide-react"
import type { LoyaltyCardConfig, CustomerLoyaltyCard } from "@/contexts/loyalty-cards-context"

interface LoyaltyCardDisplayProps {
  config: LoyaltyCardConfig
  customerCard?: CustomerLoyaltyCard
  onPlayGame?: (cardId: string, position: number) => void
  compact?: boolean
}

// Composant cercle de tampon simple et moderne
function StampCircle({
  position,
  isStamped,
  specialType,
  canPlay,
  onPlay,
  totalStamps,
}: {
  position: number
  isStamped: boolean
  specialType?: "game" | "reward" | null
  canPlay?: boolean
  onPlay?: () => void
  totalStamps: number
}) {
  const isGame = specialType === "game"
  const isReward = specialType === "reward"
  
  // Taille responsive basee sur le nombre total
  const sizeClass = totalStamps <= 12 ? "w-12 h-12 sm:w-14 sm:h-14" : "w-10 h-10 sm:w-12 sm:h-12"
  const textSize = totalStamps <= 12 ? "text-sm sm:text-base" : "text-xs sm:text-sm"
  
  // Si c'est une position de jeu et on peut jouer
  if (isGame && canPlay && !isStamped) {
    return (
      <motion.button
        onClick={onPlay}
        className={cn(
          sizeClass,
          "relative rounded-full flex items-center justify-center",
          "bg-gradient-to-br from-purple-500 to-pink-500",
          "shadow-lg shadow-purple-500/30",
          "hover:scale-110 transition-transform cursor-pointer"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{ 
          boxShadow: [
            "0 0 0 0 rgba(168, 85, 247, 0.4)",
            "0 0 0 10px rgba(168, 85, 247, 0)",
          ]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
        }}
      >
        <DicesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-yellow-400 rounded-full flex items-center justify-center">
          <SparklesIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-800" />
        </span>
      </motion.button>
    )
  }
  
  // Position de jeu non active (pas encore atteinte)
  if (isGame && !isStamped) {
    return (
      <div className={cn(
        sizeClass,
        "relative rounded-full flex items-center justify-center",
        "bg-purple-100 border-2 border-dashed border-purple-300"
      )}>
        <DicesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
        <span className={cn(
          "absolute -bottom-1 text-[8px] sm:text-[10px] font-bold text-purple-500 bg-white px-1 rounded-full shadow",
        )}>
          JEU
        </span>
      </div>
    )
  }
  
  // Si c'est une position de recompense non tamponnee
  if (isReward && !isStamped) {
    return (
      <div className={cn(
        sizeClass,
        "relative rounded-full flex items-center justify-center",
        "bg-amber-100 border-2 border-dashed border-amber-300"
      )}>
        <GiftIcon className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
        <span className={cn(
          "absolute -bottom-1 text-[8px] sm:text-[10px] font-bold text-amber-600 bg-white px-1 rounded-full shadow",
        )}>
          OFFERT
        </span>
      </div>
    )
  }
  
  // Tampon valide (deja tamponne)
  if (isStamped) {
    return (
      <motion.div 
        className={cn(
          sizeClass,
          "relative rounded-full flex items-center justify-center",
          isReward 
            ? "bg-gradient-to-br from-amber-400 to-orange-500"
            : isGame
            ? "bg-gradient-to-br from-purple-500 to-pink-500"
            : "bg-gradient-to-br from-emerald-400 to-teal-500",
          "shadow-md"
        )}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {isReward ? (
          <TrophyIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        ) : isGame ? (
          <DicesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        ) : (
          <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        )}
      </motion.div>
    )
  }
  
  // Cercle vide (pas encore tamponne)
  return (
    <div className={cn(
      sizeClass,
      "rounded-full flex items-center justify-center",
      "bg-stone-100 border-2 border-dashed border-stone-300",
      "text-stone-400 font-semibold",
      textSize
    )}>
      {position}
    </div>
  )
}

// Carte de fidelite complete
export function LoyaltyCardDisplay({
  config,
  customerCard,
  onPlayGame,
  compact = false,
}: LoyaltyCardDisplayProps) {
  const stampedPositions = customerCard?.stampedPositions || []
  const currentStamps = stampedPositions.length
  const totalStamps = config.totalStamps
  const progress = (currentStamps / totalStamps) * 100
  
  // Calculer les positions speciales
  const getSpecialType = (position: number): "game" | "reward" | null => {
    const posConfig = config.stampPositions.find(p => p.position === position)
    return posConfig?.type === "game" ? "game" : posConfig?.type === "reward" ? "reward" : null
  }
  
  // Verifier si on peut jouer a une position
  const canPlayAt = (position: number): boolean => {
    if (!customerCard) return false
    const posConfig = config.stampPositions.find(p => p.position === position)
    if (posConfig?.type !== "game") return false
    
    // On peut jouer si la position precedente est tamponnee mais pas celle-ci
    const previousStamped = position === 1 || stampedPositions.includes(position - 1)
    const currentNotStamped = !stampedPositions.includes(position)
    const gameNotPlayed = !customerCard.gamesPlayed?.some(g => g.position === position)
    
    return previousStamped && currentNotStamped && gameNotPlayed
  }
  
  // Calculer les colonnes de la grille
  const gridCols = totalStamps <= 12 ? 4 : totalStamps <= 18 ? 6 : 5
  
  // Date d'expiration
  const expirationDate = customerCard?.expiresAt 
    ? new Date(customerCard.expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : config.validityDays 
    ? `${config.validityDays} jours apres activation`
    : null

  if (compact) {
    return (
      <Card className="overflow-hidden bg-white border-stone-200 hover:shadow-lg transition-shadow">
        {/* Header compact */}
        <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-lg">{config.name}</h3>
              <p className="text-amber-100 text-sm">{config.productName} - {config.productPrice} DT</p>
            </div>
            <Badge className="bg-white/20 text-white border-0 text-lg font-bold px-3">
              {currentStamps}/{totalStamps}
            </Badge>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-stone-100">
          <motion.div 
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        {/* Apercu des tampons */}
        <div className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: Math.min(8, totalStamps) }).map((_, i) => {
              const position = i + 1
              const isStamped = stampedPositions.includes(position)
              const specialType = getSpecialType(position)
              
              return (
                <div 
                  key={position}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                    isStamped 
                      ? specialType === "reward"
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
                        : specialType === "game"
                        ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white"
                        : "bg-gradient-to-br from-emerald-400 to-teal-500 text-white"
                      : specialType === "game"
                      ? "bg-purple-100 text-purple-600 border-2 border-purple-300"
                      : specialType === "reward"
                      ? "bg-amber-100 text-amber-600 border-2 border-amber-300"
                      : "bg-stone-100 text-stone-400 border-2 border-dashed border-stone-300"
                  )}
                >
                  {isStamped ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : specialType === "game" ? (
                    <DicesIcon className="w-3.5 h-3.5" />
                  ) : specialType === "reward" ? (
                    <GiftIcon className="w-3.5 h-3.5" />
                  ) : (
                    position
                  )}
                </div>
              )
            })}
            {totalStamps > 8 && (
              <span className="text-sm text-stone-500">+{totalStamps - 8}</span>
            )}
          </div>
          
          {/* Message d'encouragement */}
          {currentStamps < totalStamps && (
            <p className="mt-3 text-sm text-stone-600">
              Plus que <span className="font-bold text-amber-600">{totalStamps - currentStamps}</span> tampon{totalStamps - currentStamps > 1 ? "s" : ""} pour votre recompense!
            </p>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden bg-white border-stone-200 shadow-xl">
      {/* Header avec gradient */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-white text-xl sm:text-2xl">{config.name}</h2>
            <p className="text-white/80 mt-1">{config.productName}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-white/20 text-white border-0 font-bold">
                {config.productPrice} DT
              </Badge>
              {expirationDate && (
                <Badge variant="outline" className="text-white/80 border-white/30">
                  <CalendarIcon className="w-3 h-3 mr-1" />
                  {expirationDate}
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl sm:text-5xl font-black text-white">
              {currentStamps}<span className="text-2xl sm:text-3xl text-white/60">/{totalStamps}</span>
            </div>
            <p className="text-white/70 text-sm mt-1">tampons</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-white rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>
      
      {/* Grille des tampons */}
      <div className="p-5 sm:p-6 bg-gradient-to-b from-stone-50 to-white">
        <div 
          className="grid gap-3 sm:gap-4 justify-items-center"
          style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: totalStamps }).map((_, i) => {
            const position = i + 1
            const isStamped = stampedPositions.includes(position)
            const specialType = getSpecialType(position)
            const canPlay = canPlayAt(position)
            
            return (
              <StampCircle
                key={position}
                position={position}
                isStamped={isStamped}
                specialType={specialType}
                canPlay={canPlay}
                onPlay={() => onPlayGame?.(customerCard?.id || "", position)}
                totalStamps={totalStamps}
              />
            )
          })}
        </div>
        
        {/* Legende */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
            <span className="text-stone-600">Tampon valide</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            <span className="text-stone-600">Tente ta chance</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
            <span className="text-stone-600">Produit offert</span>
          </div>
        </div>
        
        {/* Instructions jeu */}
        {config.stampPositions.some(p => p.type === "game") && (
          <div className="mt-4 p-3 bg-purple-50 rounded-xl border border-purple-100">
            <div className="flex items-start gap-2">
              <DicesIcon className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-purple-800">Jeu Chich Bich</p>
                <p className="text-sm text-purple-600">
                  Aux positions speciales, lancez les des! Double 6 = produit gratuit!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

// Composant apercu pour le menu (carousel horizontal)
export function LoyaltyCardsPreview({
  configs,
  customerCards,
  onViewAll,
  onPlayGame,
}: {
  configs: LoyaltyCardConfig[]
  customerCards: CustomerLoyaltyCard[]
  onViewAll?: () => void
  onPlayGame?: (cardId: string, position: number) => void
}) {
  if (configs.length === 0) return null
  
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-stone-900">Cartes de Fidelite</h2>
            <p className="text-sm text-stone-500">Cumulez vos achats et gagnez des recompenses</p>
          </div>
        </div>
        {onViewAll && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onViewAll}
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
          >
            Voir tout
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
      
      {/* Carousel de cartes compactes */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {configs.map(config => {
          const customerCard = customerCards.find(c => c.configId === config.id)
          return (
            <div key={config.id} className="flex-shrink-0 w-[300px] sm:w-[340px] snap-start">
              <LoyaltyCardDisplay
                config={config}
                customerCard={customerCard}
                onPlayGame={onPlayGame}
                compact
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
