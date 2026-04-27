"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CheckIcon, DicesIcon, GiftIcon, SparklesIcon, TrophyIcon, CalendarIcon, ChevronRightIcon } from "lucide-react"
import type { CustomerLoyaltyCard, LoyaltyCardConfig } from "@/contexts/loyalty-cards-context"

interface LoyaltyCardDisplayProps {
  config: LoyaltyCardConfig
  customerCard?: CustomerLoyaltyCard
  onPlayGame?: (cardId: string, position: number) => void
  compact?: boolean
}

function StampCircle({
  position,
  stamped,
  specialType,
  pendingGame,
  totalStamps,
  onPlay,
}: {
  position: number
  stamped: boolean
  specialType: "normal" | "game" | "reward"
  pendingGame: boolean
  totalStamps: number
  onPlay?: () => void
}) {
  const sizeClass = totalStamps <= 12 ? "h-12 w-12 sm:h-14 sm:w-14" : "h-10 w-10 sm:h-12 sm:w-12"
  const isGame = specialType === "game"
  const isReward = specialType === "reward"

  if (pendingGame) {
    return (
      <motion.button
        onClick={onPlay}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        className={cn(
          sizeClass,
          "relative rounded-full bg-gradient-to-br from-fuchsia-500 to-orange-500 text-white shadow-lg",
          "flex items-center justify-center"
        )}
      >
        <DicesIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-300 text-yellow-900">
          <SparklesIcon className="h-2.5 w-2.5" />
        </span>
      </motion.button>
    )
  }

  if (stamped) {
    return (
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          sizeClass,
          "rounded-full flex items-center justify-center text-white shadow-md",
          isReward
            ? "bg-gradient-to-br from-amber-400 to-orange-500"
            : isGame
              ? "bg-gradient-to-br from-fuchsia-500 to-pink-500"
              : "bg-gradient-to-br from-emerald-400 to-teal-500"
        )}
      >
        {isReward ? <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : isGame ? <DicesIcon className="h-5 w-5 sm:h-6 sm:w-6" /> : <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6" />}
      </motion.div>
    )
  }

  return (
    <div
      className={cn(
        sizeClass,
        "rounded-full border-2 border-dashed flex items-center justify-center text-xs font-semibold",
        isReward
          ? "border-amber-300 bg-amber-50 text-amber-600"
          : isGame
            ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-600"
            : "border-stone-300 bg-stone-100 text-stone-400"
      )}
    >
      {isReward ? <GiftIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : isGame ? <DicesIcon className="h-4 w-4 sm:h-5 sm:w-5" /> : position}
    </div>
  )
}

export function LoyaltyCardDisplay({ config, customerCard, onPlayGame, compact = false }: LoyaltyCardDisplayProps) {
  const stampedPositions = customerCard?.stamps.map((stamp) => stamp.position) ?? []
  const currentStamps = customerCard?.currentStampCount ?? 0
  const totalStamps = config.totalStamps
  const progress = totalStamps > 0 ? (currentStamps / totalStamps) * 100 : 0
  const gridCols = config.gridColumns || (totalStamps <= 12 ? 4 : totalStamps <= 18 ? 6 : 5)
  const expirationLabel = customerCard?.expirationDate
    ? new Date(customerCard.expirationDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
    : `${config.expirationDays} jours`

  const getPositionType = (position: number) => config.stampPositions.find((entry) => entry.position === position)?.type || "normal"
  const hasPendingGame = (position: number) => {
    const stamp = customerCard?.stamps.find((entry) => entry.position === position)
    return getPositionType(position) === "game" && !!stamp && !stamp.gameResult?.played
  }

  if (compact) {
    return (
      <Card className="overflow-hidden border-stone-200 bg-white">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">{config.name}</h3>
              <p className="text-sm text-white/80">{config.productName} - {config.productPrice} DT</p>
            </div>
            <Badge className="border-0 bg-white/20 text-white">{currentStamps}/{totalStamps}</Badge>
          </div>
        </div>
        <div className="h-2 bg-stone-100">
          <motion.div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500" animate={{ width: `${progress}%` }} />
        </div>
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: Math.min(totalStamps, 8) }, (_, index) => {
              const position = index + 1
              const stamped = stampedPositions.includes(position)
              const type = getPositionType(position)
              return (
                <StampCircle
                  key={position}
                  position={position}
                  stamped={stamped}
                  specialType={type}
                  pendingGame={false}
                  totalStamps={8}
                />
              )
            })}
            {totalStamps > 8 && <span className="self-center text-sm text-stone-500">+{totalStamps - 8}</span>}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-stone-200 bg-white shadow-xl">
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-5 text-white sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">{config.name}</h2>
            <p className="mt-1 text-white/80">{config.productName}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge className="border-0 bg-white/20 text-white">{config.productPrice} DT</Badge>
              <Badge variant="outline" className="border-white/30 text-white/80">
                <CalendarIcon className="mr-1 h-3 w-3" />
                {expirationLabel}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-black sm:text-5xl">
              {currentStamps}
              <span className="text-2xl text-white/60 sm:text-3xl">/{totalStamps}</span>
            </div>
            <p className="mt-1 text-sm text-white/70">tampons</p>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/20">
          <motion.div className="h-full rounded-full bg-white" animate={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="bg-gradient-to-b from-stone-50 to-white p-5 sm:p-6">
        <div className="grid justify-items-center gap-3 sm:gap-4" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
          {Array.from({ length: totalStamps }, (_, index) => {
            const position = index + 1
            const type = getPositionType(position)
            const pendingGame = hasPendingGame(position)
            return (
              <StampCircle
                key={position}
                position={position}
                stamped={stampedPositions.includes(position)}
                specialType={type}
                pendingGame={pendingGame}
                totalStamps={totalStamps}
                onPlay={pendingGame ? () => onPlayGame?.(customerCard?.id || "", position) : undefined}
              />
            )
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-stone-600">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />
            <span>Tampon valide</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500" />
            <span>Jeu Chich Bich</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500" />
            <span>Produit offert</span>
          </div>
        </div>

        {customerCard && customerCard.status === "completed" && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <div className="flex items-center gap-2 font-semibold">
              <TrophyIcon className="h-5 w-5" />
              Carte completee
            </div>
          </div>
        )}

        {customerCard && getPositionType(currentStamps) === "game" && hasPendingGame(currentStamps) && (
          <div className="mt-4 rounded-2xl border border-fuchsia-100 bg-fuchsia-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-fuchsia-800">Jeu disponible</p>
                <p className="text-sm text-fuchsia-700">Votre dernier tampon debloque un Chich Bich.</p>
              </div>
              <Button size="sm" onClick={() => onPlayGame?.(customerCard.id, currentStamps)} className="bg-fuchsia-600 hover:bg-fuchsia-700">
                Jouer
                <ChevronRightIcon className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-stone-900">Cartes de Fidelite</h2>
          <p className="text-sm text-stone-500">Cumulez vos achats et gagnez des recompenses</p>
        </div>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-amber-600 hover:bg-amber-50 hover:text-amber-700">
            Voir tout
            <ChevronRightIcon className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2">
        {configs.map((config) => (
          <div key={config.id} className="w-[300px] shrink-0 sm:w-[340px]">
            <LoyaltyCardDisplay
              config={config}
              customerCard={customerCards.find((card) => card.configId === config.id)}
              onPlayGame={onPlayGame}
              compact
            />
          </div>
        ))}
      </div>
    </div>
  )
}
