"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DicesIcon, GiftIcon, SparklesIcon, XIcon, RotateCcwIcon, ShareIcon, CheckIcon, CopyIcon } from "lucide-react"
import confetti from "canvas-confetti"

interface ChichBichGameModalProps {
  isOpen: boolean
  onClose: () => void
  onPlay: () => Promise<{ won: boolean; diceResults: [number, number][] }> | { won: boolean; diceResults: [number, number][] }
  chances: number
  winCondition: string
  rewardName?: string
  productId?: string
  onShare?: (productId: string, rewardName: string) => Promise<string> // Retourne le lien de partage
}

// Composant Dé 3D
function Dice({ 
  value, 
  rolling, 
  index 
}: { 
  value: number
  rolling: boolean
  index: number 
}) {
  const dotPositions: Record<number, string[]> = {
    1: ["center"],
    2: ["top-right", "bottom-left"],
    3: ["top-right", "center", "bottom-left"],
    4: ["top-left", "top-right", "bottom-left", "bottom-right"],
    5: ["top-left", "top-right", "center", "bottom-left", "bottom-right"],
    6: ["top-left", "top-right", "center-left", "center-right", "bottom-left", "bottom-right"],
  }
  
  const getDotStyle = (position: string) => {
    const base = "w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-stone-800 absolute"
    switch (position) {
      case "center": return cn(base, "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2")
      case "top-left": return cn(base, "top-3 left-3 sm:top-4 sm:left-4")
      case "top-right": return cn(base, "top-3 right-3 sm:top-4 sm:right-4")
      case "bottom-left": return cn(base, "bottom-3 left-3 sm:bottom-4 sm:left-4")
      case "bottom-right": return cn(base, "bottom-3 right-3 sm:bottom-4 sm:right-4")
      case "center-left": return cn(base, "top-1/2 left-3 sm:left-4 -translate-y-1/2")
      case "center-right": return cn(base, "top-1/2 right-3 sm:right-4 -translate-y-1/2")
      default: return base
    }
  }

  return (
    <motion.div
      className={cn(
        "w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white shadow-lg relative",
        "border-2 border-stone-200"
      )}
      animate={rolling ? {
        rotateX: [0, 360, 720, 1080],
        rotateY: [0, 180, 360, 540],
        scale: [1, 1.1, 0.9, 1],
      } : {}}
      transition={{
        duration: 0.8,
        delay: index * 0.1,
        ease: "easeOut",
      }}
    >
      <AnimatePresence mode="wait">
        {!rolling && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="w-full h-full"
          >
            {dotPositions[value]?.map((pos, i) => (
              <div key={i} className={getDotStyle(pos)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function ChichBichGameModal({
  isOpen,
  onClose,
  onPlay,
  chances,
  winCondition,
  rewardName = "un produit",
  productId,
  onShare,
}: ChichBichGameModalProps) {
  const [gameState, setGameState] = useState<"ready" | "rolling" | "result">("ready")
  const [currentChance, setCurrentChance] = useState(1)
  const [dice, setDice] = useState<[number, number]>([1, 1])
  const [rollHistory, setRollHistory] = useState<[number, number][]>([])
  const [won, setWon] = useState(false)
  const [gameEnded, setGameEnded] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [copiedToClipboard, setCopiedToClipboard] = useState(false)

  // Reset le jeu quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setGameState("ready")
      setCurrentChance(1)
      setDice([1, 1])
      setRollHistory([])
      setWon(false)
      setGameEnded(false)
      setShareLink(null)
      setShowShareDialog(false)
      setCopiedToClipboard(false)
    }
  }, [isOpen])

  const triggerConfetti = useCallback(() => {
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    }

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      })
    }

    fire(0.25, { spread: 26, startVelocity: 55 })
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
  }, [])

  const checkWin = (d: [number, number]): boolean => {
    switch (winCondition) {
      case "double-6":
        return d[0] === 6 && d[1] === 6
      case "double-any":
        return d[0] === d[1]
      case "sum-12":
        return d[0] + d[1] === 12
      default:
        return false
    }
  }

  const rollDice = async () => {
    setGameState("rolling")
    
    // Animation de roulement
    const rollInterval = setInterval(() => {
      setDice([
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ])
    }, 100)

    // Arrêter après 1 seconde
    setTimeout(async () => {
      clearInterval(rollInterval)
      
      // Obtenir le vrai résultat
      const result = await onPlay()
      const finalDice = result.diceResults[result.diceResults.length - 1] || [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
      ]
      
      setDice(finalDice)
      setRollHistory(prev => [...prev, finalDice])
      
      const isWin = checkWin(finalDice)
      
      setTimeout(() => {
        setGameState("result")
        
        if (isWin) {
          setWon(true)
          setGameEnded(true)
          triggerConfetti()
        } else if (currentChance >= chances) {
          // Plus de chances
          setGameEnded(true)
        } else {
          // Encore des chances
          setCurrentChance(prev => prev + 1)
        }
      }, 300)
    }, 1000)
  }

  const getWinConditionText = () => {
    switch (winCondition) {
      case "double-6":
        return "Double 6"
      case "double-any":
        return "N'importe quel double"
      case "sum-12":
        return "Total de 12"
      default:
        return winCondition
    }
  }

  const handleShare = async () => {
    if (!onShare || !productId) return
    
    try {
      setIsSharing(true)
      const link = await onShare(productId, rewardName)
      setShareLink(link)
      setShowShareDialog(true)
    } catch (error) {
      console.error("Erreur lors du partage:", error)
    } finally {
      setIsSharing(false)
    }
  }

  const copyShareLink = () => {
    if (!shareLink) return
    
    navigator.clipboard.writeText(shareLink)
    setCopiedToClipboard(true)
    setTimeout(() => setCopiedToClipboard(false), 2000)
  }

  const shareViaWeb = async () => {
    if (!shareLink) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Découvrez ce produit!",
          text: `J'ai gagné ${rewardName} en jouant au Chich Bich! 🎲`,
          url: shareLink,
        })
      } catch (err) {
        console.log("Partage annulé ou erreur:", err)
      }
    } else {
      copyShareLink()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-stone-900 to-stone-800 text-white border-stone-700">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
            <DicesIcon className="w-8 h-8 text-amber-500" />
            Jeu Chich Bich
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* Règles */}
          <div className="text-center mb-6">
            <p className="text-stone-300 text-sm mb-2">
              Obtenez un <span className="text-amber-400 font-bold">{getWinConditionText()}</span> pour gagner
            </p>
            <p className="text-stone-400 text-xs">
              {rewardName} offert si vous gagnez !
            </p>
          </div>

          {/* Compteur de chances */}
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: chances }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                  i < currentChance - 1
                    ? "bg-stone-600 text-stone-400" // Utilisé
                    : i === currentChance - 1 && !gameEnded
                      ? "bg-amber-500 text-white ring-2 ring-amber-300" // Actuel
                      : "bg-stone-700 text-stone-500" // À venir
                )}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Zone des dés */}
          <div className="flex justify-center gap-6 mb-8">
            <Dice value={dice[0]} rolling={gameState === "rolling"} index={0} />
            <Dice value={dice[1]} rolling={gameState === "rolling"} index={1} />
          </div>

          {/* Résultat */}
          <AnimatePresence mode="wait">
            {gameState === "result" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center mb-6"
              >
                {won ? (
                  <div className="space-y-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white font-bold"
                    >
                      <GiftIcon className="w-5 h-5" />
                      FELICITATIONS !
                      <SparklesIcon className="w-5 h-5" />
                    </motion.div>
                    <p className="text-emerald-400">
                      Vous avez gagne {rewardName} !
                    </p>
                  </div>
                ) : gameEnded ? (
                  <div className="space-y-2">
                    <p className="text-stone-400 font-medium">
                      Pas de chance cette fois...
                    </p>
                    <p className="text-stone-500 text-sm">
                      Continuez a collecter des tampons pour rejouer !
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-amber-400 font-medium">
                      {dice[0]} + {dice[1]} = {dice[0] + dice[1]}
                    </p>
                    <p className="text-stone-400 text-sm">
                      Il vous reste {chances - currentChance + 1} chance{chances - currentChance + 1 > 1 ? "s" : ""} !
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Historique des lancers */}
          {rollHistory.length > 0 && (
            <div className="flex justify-center gap-4 mb-6">
              {rollHistory.map((roll, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-xs",
                    checkWin(roll) 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : "bg-stone-700/50 text-stone-400"
                  )}
                >
                  <span>{roll[0]}</span>
                  <span>+</span>
                  <span>{roll[1]}</span>
                  <span>=</span>
                  <span className="font-bold">{roll[0] + roll[1]}</span>
                </div>
              ))}
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-center gap-3">
            {!gameEnded && gameState !== "rolling" && (
              <Button
                onClick={() => rollDice()}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-8 py-6 text-lg rounded-xl"
              >
                <DicesIcon className="w-6 h-6 mr-2" />
                {gameState === "ready" ? "Lancer les des" : "Relancer"}
              </Button>
            )}
            
            {gameEnded && won && !shareLink && (
              <>
                <Button
                  onClick={handleShare}
                  disabled={isSharing || !onShare}
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold px-6 py-6 text-lg rounded-xl disabled:opacity-50"
                >
                  <ShareIcon className="w-6 h-6 mr-2" />
                  {isSharing ? "Partage..." : "Partager"}
                </Button>
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold px-8 py-6 text-lg rounded-xl"
                >
                  <GiftIcon className="w-6 h-6 mr-2" />
                  Reclamer ma recompense
                </Button>
              </>
            )}
            
            {gameEnded && won && shareLink && (
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold px-8 py-6 text-lg rounded-xl"
              >
                <GiftIcon className="w-6 h-6 mr-2" />
                Reclamer ma recompense
              </Button>
            )}
            
            {gameEnded && !won && (
              <Button
                onClick={onClose}
                className="bg-stone-700 hover:bg-stone-600 text-white font-bold px-8 py-6 text-lg rounded-xl"
              >
                <XIcon className="w-6 h-6 mr-2" />
                Fermer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-stone-900 to-stone-800 text-white border-stone-700">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
              <CheckIcon className="w-8 h-8 text-blue-400" />
              Partager ce produit
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-6">
            {/* Message de partage */}
            <div className="text-center">
              <p className="text-stone-300 text-sm mb-2">
                Vous venez de gagner <span className="text-emerald-400 font-bold">{rewardName}</span>!
              </p>
              <p className="text-stone-400 text-xs">
                Partagez ce produit avec vos amis pour leur en faire profiter!
              </p>
            </div>

            {/* Lien de partage */}
            {shareLink && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <div className="bg-stone-700 rounded-lg p-3 flex items-center justify-between gap-2">
                  <code className="text-xs text-stone-300 break-all flex-1 max-h-12 overflow-y-auto">
                    {shareLink}
                  </code>
                  <Button
                    onClick={copyShareLink}
                    size="sm"
                    className={cn(
                      "flex-shrink-0",
                      copiedToClipboard 
                        ? "bg-emerald-600 hover:bg-emerald-700" 
                        : "bg-amber-600 hover:bg-amber-700"
                    )}
                  >
                    <CopyIcon className="w-4 h-4" />
                  </Button>
                </div>
                {copiedToClipboard && (
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }}
                    className="text-xs text-emerald-400 text-center"
                  >
                    ✓ Lien copié dans le presse-papiers!
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* Boutons de partage */}
            <div className="space-y-2">
              <Button
                onClick={shareViaWeb}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-3 rounded-lg"
              >
                <ShareIcon className="w-5 h-5 mr-2" />
                Partager via...
              </Button>
              
              <Button
                onClick={() => setShowShareDialog(false)}
                variant="outline"
                className="w-full"
              >
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
