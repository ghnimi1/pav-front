"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "./ui/button"
import { Card } from "./ui/card"
import { Badge } from "./ui/badge"
import {
  Disc3Icon,
  DicesIcon,
  GiftIcon,
  ClockIcon,
  SparklesIcon,
  TrophyIcon,
  CoinsIcon,
  LockIcon,
  StarIcon,
  ZapIcon,
  ShareIcon,
  CheckCircleIcon,
  CameraIcon,
  ImageIcon,
  XIcon,
} from "lucide-react"
import { useLoyalty, type GameConfig, type LoyaltyClient } from "@/contexts/loyalty-context"
import { useNotification } from "@/contexts/notification-context"
import { useStock } from "@/contexts/stock-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { ScrollArea } from "./ui/scroll-area"

// Configuration des segments de la roulette avec design premium
const WHEEL_SEGMENTS = [
  { label: "10 pts", color: "#dc2626", textColor: "#ffffff", prize: { type: "points", value: 10 } },
  { label: "50 pts", color: "#fef3c7", textColor: "#b45309", prize: { type: "points", value: 50 } },
  { label: "5 TND", color: "#dc2626", textColor: "#ffffff", prize: { type: "discount", value: 5 } },
  { label: "20 pts", color: "#fef3c7", textColor: "#b45309", prize: { type: "points", value: 20 } },
  { label: "Perdu", color: "#991b1b", textColor: "#fecaca", prize: null },
  { label: "100 pts", color: "#fef3c7", textColor: "#b45309", prize: { type: "points", value: 100 } },
  { label: "10 TND", color: "#dc2626", textColor: "#ffffff", prize: { type: "discount", value: 10 } },
  { label: "30 pts", color: "#fef3c7", textColor: "#b45309", prize: { type: "points", value: 30 } },
  { label: "Cadeau", color: "#dc2626", textColor: "#ffffff", prize: { type: "gift", value: "Croissant" } },
  { label: "Perdu", color: "#991b1b", textColor: "#fecaca", prize: null },
  { label: "15 pts", color: "#fef3c7", textColor: "#b45309", prize: { type: "points", value: 15 } },
  { label: "JACKPOT", color: "#fbbf24", textColor: "#7c2d12", prize: { type: "jackpot", value: 200 } },
]

// Styles CSS pour les animations premium
const gameStyles = `
  @keyframes wheelSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(var(--final-rotation)); }
  }
  
  @keyframes diceRoll3D {
    0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
    25% { transform: rotateX(90deg) rotateY(90deg) rotateZ(45deg); }
    50% { transform: rotateX(180deg) rotateY(180deg) rotateZ(90deg); }
    75% { transform: rotateX(270deg) rotateY(270deg) rotateZ(135deg); }
    100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(180deg); }
  }
  
  @keyframes diceBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
  
  @keyframes confettiFall {
    0% { transform: translateY(-10px) rotate(0deg) scale(1); opacity: 1; }
    100% { transform: translateY(400px) rotate(720deg) scale(0); opacity: 0; }
  }
  
  @keyframes lightPulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.3); }
  }
  
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.5); }
    50% { box-shadow: 0 0 40px rgba(251, 191, 36, 0.8), 0 0 60px rgba(251, 191, 36, 0.4); }
  }
  
  @keyframes starSparkle {
    0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
    50% { opacity: 1; transform: scale(1) rotate(180deg); }
  }
  
  @keyframes pointerBounce {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50% { transform: translateX(-50%) translateY(5px); }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  
  @keyframes resultPopIn {
    0% { transform: scale(0) rotate(-10deg); opacity: 0; }
    50% { transform: scale(1.1) rotate(5deg); }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
`

// Composant Roue de Fortune Premium
function FortuneWheel({ isSpinning, rotation, segments, onSpinEnd }: { 
  isSpinning: boolean
  rotation: number
  segments: typeof WHEEL_SEGMENTS
  onSpinEnd?: () => void 
}) {
  const segmentAngle = 360 / segments.length
  const [lightIndex, setLightIndex] = useState(0)
  
  useEffect(() => {
    if (isSpinning) {
      const interval = setInterval(() => {
        setLightIndex(prev => (prev + 1) % 20)
      }, 80)
      return () => clearInterval(interval)
    }
  }, [isSpinning])
  
  return (
    <div className="relative w-80 h-80 md:w-96 md:h-96">
      {/* Ombre portee */}
      <div className="absolute inset-4 rounded-full bg-black/20 blur-xl translate-y-4" />
      
      {/* Halo lumineux derriere la roue */}
      <div 
        className="absolute inset-0 rounded-full transition-all duration-300"
        style={{
          background: isSpinning 
            ? "radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)" 
            : "radial-gradient(circle, rgba(251,191,36,0.1) 0%, transparent 70%)",
          animation: isSpinning ? "glowPulse 0.5s ease-in-out infinite" : "none"
        }}
      />
      
      {/* Pointeur dore premium */}
      <div 
        className="absolute top-0 left-1/2 z-30"
        style={{
          animation: isSpinning ? "pointerBounce 0.2s ease-in-out infinite" : "none"
        }}
      >
        <svg width="50" height="60" viewBox="0 0 50 60" className="-translate-x-1/2 -translate-y-1 drop-shadow-2xl">
          <defs>
            <linearGradient id="pointerGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <filter id="pointerShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.3"/>
            </filter>
          </defs>
          <path 
            d="M25 55 L5 15 Q5 5 25 5 Q45 5 45 15 L25 55 Z" 
            fill="url(#pointerGold)" 
            stroke="#92400e" 
            strokeWidth="2"
            filter="url(#pointerShadow)"
          />
          <circle cx="25" cy="15" r="5" fill="#fef3c7" />
        </svg>
      </div>
      
      {/* Cadre exterieur dore */}
      <div className="absolute inset-0 rounded-full p-1 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-2xl">
        {/* Cadre rouge */}
        <div className="w-full h-full rounded-full p-3 bg-gradient-to-br from-red-500 via-red-600 to-red-800 relative overflow-hidden">
          
          {/* Ampoules lumineuses autour de la roue */}
          {[...Array(20)].map((_, i) => {
            const angle = (i * 18) - 90
            const rad = (angle * Math.PI) / 180
            const radius = 47
            return (
              <div
                key={i}
                className="absolute rounded-full transition-all duration-100"
                style={{
                  width: "14px",
                  height: "14px",
                  top: `${50 - radius * Math.cos(rad)}%`,
                  left: `${50 + radius * Math.sin(rad)}%`,
                  transform: "translate(-50%, -50%)",
                  background: (isSpinning && i === lightIndex) || (!isSpinning && i % 2 === 0)
                    ? "radial-gradient(circle at 30% 30%, #fef08a, #fbbf24, #f59e0b)"
                    : "radial-gradient(circle at 30% 30%, #fde68a, #d97706, #92400e)",
                  boxShadow: (isSpinning && i === lightIndex) || (!isSpinning && i % 2 === 0)
                    ? "0 0 10px #fbbf24, 0 0 20px #f59e0b, inset 0 -2px 4px rgba(0,0,0,0.3)"
                    : "inset 0 -2px 4px rgba(0,0,0,0.3)",
                  border: "2px solid #92400e",
                }}
              />
            )
          })}
          
          {/* Roue principale */}
          <div className="absolute inset-4 rounded-full overflow-hidden shadow-inner">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? "transform 5s cubic-bezier(0.15, 0.80, 0.20, 1.00)" : "none",
              }}
            >
              <defs>
                <filter id="segmentShadow">
                  <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#000" floodOpacity="0.2"/>
                </filter>
                <radialGradient id="centerGold" cx="30%" cy="30%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="40%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#b45309" />
                </radialGradient>
                <pattern id="shimmerPattern" patternUnits="userSpaceOnUse" width="200" height="200">
                  <rect width="200" height="200" fill="url(#centerGold)"/>
                </pattern>
              </defs>
              
              {segments.map((segment, index) => {
                const startAngle = index * segmentAngle - 90
                const endAngle = startAngle + segmentAngle
                const startRad = (startAngle * Math.PI) / 180
                const endRad = (endAngle * Math.PI) / 180
                const outerRadius = 98
                const x1 = 100 + outerRadius * Math.cos(startRad)
                const y1 = 100 + outerRadius * Math.sin(startRad)
                const x2 = 100 + outerRadius * Math.cos(endRad)
                const y2 = 100 + outerRadius * Math.sin(endRad)
                const largeArc = segmentAngle > 180 ? 1 : 0
                
                const textAngle = startAngle + segmentAngle / 2
                const textRad = (textAngle * Math.PI) / 180
                const textX = 100 + 68 * Math.cos(textRad)
                const textY = 100 + 68 * Math.sin(textRad)
                
                return (
                  <g key={index}>
                    {/* Segment principal */}
                    <path
                      d={`M 100 100 L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={segment.color}
                      stroke="#7c2d12"
                      strokeWidth="1.5"
                      filter="url(#segmentShadow)"
                    />
                    {/* Effet de brillance sur segment */}
                    <path
                      d={`M 100 100 L ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill="url(#segmentShine)"
                      opacity="0.1"
                    />
                    {/* Texte */}
                    <text
                      x={textX}
                      y={textY}
                      fill={segment.textColor}
                      fontSize={segment.label === "JACKPOT" ? "8" : "10"}
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${textAngle + 90}, ${textX}, ${textY})`}
                      style={{ 
                        textShadow: segment.label === "JACKPOT" ? "0 0 5px rgba(0,0,0,0.5)" : "none",
                        fontFamily: "system-ui, sans-serif"
                      }}
                    >
                      {segment.label}
                    </text>
                  </g>
                )
              })}
              
              {/* Cercle central dore */}
              <circle cx="100" cy="100" r="22" fill="url(#centerGold)" stroke="#92400e" strokeWidth="3" />
              <circle cx="100" cy="100" r="15" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
              <circle cx="100" cy="100" r="8" fill="url(#centerGold)" />
              
              {/* Reflet central */}
              <ellipse cx="95" cy="95" rx="4" ry="3" fill="rgba(255,255,255,0.6)" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant De 3D Premium
function Dice3D({ value, isRolling, delay = 0 }: { value: number; isRolling: boolean; delay?: number }) {
  const dotPositions: Record<number, Array<{ x: number; y: number }>> = {
    1: [{ x: 50, y: 50 }],
    2: [{ x: 25, y: 25 }, { x: 75, y: 75 }],
    3: [{ x: 25, y: 25 }, { x: 50, y: 50 }, { x: 75, y: 75 }],
    4: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
    5: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 50, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
    6: [{ x: 25, y: 25 }, { x: 75, y: 25 }, { x: 25, y: 50 }, { x: 75, y: 50 }, { x: 25, y: 75 }, { x: 75, y: 75 }],
  }

  return (
    <div
      className="relative"
      style={{
        width: "100px",
        height: "100px",
        perspective: "300px",
      }}
    >
      {/* Ombre du de */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black/30 rounded-full blur-md transition-all duration-200"
        style={{
          transform: isRolling ? "translateX(-50%) scale(0.8)" : "translateX(-50%) scale(1)",
        }}
      />
      
      <div
        className="w-full h-full relative"
        style={{
          transformStyle: "preserve-3d",
          animationName: isRolling ? "diceRoll3D, diceBounce" : "none",
          animationDuration: isRolling ? "0.12s, 0.3s" : "0s",
          animationTimingFunction: isRolling ? "linear, ease-in-out" : "linear",
          animationIterationCount: isRolling ? "infinite, infinite" : "0",
          animationDelay: `${delay}s, ${delay}s`,
        }}
      >
        {/* Face du de */}
        <div 
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #f5f5f4, #e7e5e4, #d6d3d1)",
            boxShadow: isRolling 
              ? "0 10px 30px rgba(0,0,0,0.3), inset 0 2px 10px rgba(255,255,255,0.8), inset 0 -5px 15px rgba(0,0,0,0.1)"
              : "0 15px 35px rgba(0,0,0,0.2), inset 0 2px 10px rgba(255,255,255,0.8), inset 0 -5px 15px rgba(0,0,0,0.1)",
            border: "1px solid rgba(0,0,0,0.1)",
          }}
        >
          {/* Surface du de avec points */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <radialGradient id={`dotGradient-${delay}`} cx="30%" cy="30%">
                <stop offset="0%" stopColor="#525252" />
                <stop offset="100%" stopColor="#171717" />
              </radialGradient>
              <filter id="dotShadow">
                <feDropShadow dx="1" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.3"/>
              </filter>
            </defs>
            
            {(value >= 1 && value <= 6 ? dotPositions[value] : dotPositions[1]).map((pos, i) => (
              <g key={i}>
                {/* Ombre du point */}
                <circle 
                  cx={pos.x + 1} 
                  cy={pos.y + 1} 
                  r="10" 
                  fill="rgba(0,0,0,0.2)"
                />
                {/* Point principal */}
                <circle 
                  cx={pos.x} 
                  cy={pos.y} 
                  r="10" 
                  fill={`url(#dotGradient-${delay})`}
                  filter="url(#dotShadow)"
                />
                {/* Reflet du point */}
                <circle 
                  cx={pos.x - 3} 
                  cy={pos.y - 3} 
                  r="3" 
                  fill="rgba(255,255,255,0.3)"
                />
              </g>
            ))}
          </svg>
          
          {/* Reflet de surface */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)",
              borderRadius: "1rem",
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Composant Confetti
function Confetti({ show }: { show: boolean }) {
  if (!show) return null
  
  const colors = ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#fbbf24"]
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-20px",
            width: `${8 + Math.random() * 8}px`,
            height: `${8 + Math.random() * 8}px`,
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            animation: `confettiFall ${2 + Math.random() * 2}s ease-out ${Math.random() * 0.5}s forwards`,
          }}
        />
      ))}
    </div>
  )
}

interface LoyaltyGamesProps {
  client: LoyaltyClient
}

const defaultGamesConfig = [
  { id: "roulette", name: "Roulette de la Chance", enabled: true, startHour: 10, endHour: 14, maxPlaysPerDay: 3, minPointsRequired: 50 },
  { id: "chichbich", name: "Chichbich", enabled: true, startHour: 18, endHour: 22, maxPlaysPerDay: 2, minPointsRequired: 100 },
]

export function LoyaltyGames({ client }: LoyaltyGamesProps) {
  const [showRouletteDialog, setShowRouletteDialog] = useState(false)
  const [showChichbichDialog, setShowChichbichDialog] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isRolling, setIsRolling] = useState(false)
  const [rouletteResult, setRouletteResult] = useState<any>(null)
  const [chichbichResult, setChichbichResult] = useState<{ dice1: number; dice2: number; reward: any } | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [wheelRotation, setWheelRotation] = useState(0)
  const [winningSegmentIndex, setWinningSegmentIndex] = useState<number | null>(null)
  const [dice1Value, setDice1Value] = useState(1)
  const [dice2Value, setDice2Value] = useState(1)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [selectedProductToShare, setSelectedProductToShare] = useState<string | null>(null)
  const [generatedShareCode, setGeneratedShareCode] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)
  const [shareTab, setShareTab] = useState<"menu" | "camera">("menu")
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [menuSearchQuery, setMenuSearchQuery] = useState("")
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { canPlayGame, playGame, createShareLink, getClientShareLink, hasValidShareToday, gamesConfig } = useLoyalty()
  const { menuItems, menuCategories } = useStock()
  const { addNotification } = useNotification()

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Verifier si le client a un lien de partage valide pour aujourd'hui
  const existingShareLink = getClientShareLink(client.id)
  const hasSharedToday = hasValidShareToday(client.id)

  const currentHour = currentTime.getHours()
  const rouletteConfig = gamesConfig.find(g => g.id === "roulette") || defaultGamesConfig[0]
  const chichbichConfig = gamesConfig.find(g => g.id === "chichbich") || defaultGamesConfig[1]

  // Verifier si les jeux sont disponibles selon la plage horaire configuree par l'admin
  const isRouletteTime = rouletteConfig.enabled && currentHour >= rouletteConfig.startHour && currentHour < rouletteConfig.endHour
  const isChichbichTime = chichbichConfig.enabled && currentHour >= chichbichConfig.startHour && currentHour < chichbichConfig.endHour

  const canPlayRoulette = canPlayGame(client.id, "roulette")
  const canPlayChichbich = canPlayGame(client.id, "chichbich")

  const handleSpinRoulette = () => {
    if (!canPlayRoulette || isSpinning) return

    setIsSpinning(true)
    setRouletteResult(null)
    setShowConfetti(false)

    // Choisir un segment aleatoire
    const randomIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length)
    setWinningSegmentIndex(randomIndex)
    
    // Calculer la rotation pour s'arreter sur ce segment
    const segmentAngle = 360 / WHEEL_SEGMENTS.length
    const targetAngle = 360 - (randomIndex * segmentAngle) - (segmentAngle / 2)
    const fullSpins = 5 // Nombre de tours complets
    const newRotation = wheelRotation + (fullSpins * 360) + targetAngle
    
    setWheelRotation(newRotation)

    // Attendre la fin de l'animation
    setTimeout(() => {
      const segment = WHEEL_SEGMENTS[randomIndex]
      const prize = segment.prize
        ? {
            type:
              segment.prize.type === "gift"
                ? "free_item"
                : segment.prize.type === "jackpot"
                  ? "points"
                  : segment.prize.type,
            value: typeof segment.prize.value === "number" ? segment.prize.value : 1,
            description: segment.label,
          }
        : undefined
      playGame(client.id, "roulette", prize)
      
      if (prize) {
        setRouletteResult({ 
          result: "win", 
          prize: { 
            description: segment.label,
            ...prize 
          } 
        })
        setShowConfetti(true)
        addNotification( "success",`Felicitations! Vous avez gagne: ${segment.label}`)
      } else {
        setRouletteResult({ result: "lose" })
        addNotification( "info","Pas de chance cette fois! Reessayez demain.")
      }
      setIsSpinning(false)
    }, 4200)
  }

  // Filtrer les produits du menu disponibles
  const availableMenuItems = menuItems.filter(item => item.isAvailable)
  const filteredMenuItems = availableMenuItems.filter(item =>
    item.name.toLowerCase().includes(menuSearchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(menuSearchQuery.toLowerCase())
  )

  // Fonctions Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
      }
    } catch (err) {
      addNotification( "error","Impossible d'acceder a la camera")
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
      setIsCameraActive(false)
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const photoData = canvas.toDataURL("image/jpeg", 0.8)
        setCapturedPhoto(photoData)
        stopCamera()
      }
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setCapturedPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerateShareLink = (platform: string) => {
    // Pour le partage depuis le menu
    if (shareTab === "menu" && !selectedProductToShare) {
      addNotification( "error","Selectionnez un produit a partager")
      return
    }
    
    // Pour le partage depuis la camera
    if (shareTab === "camera" && !capturedPhoto) {
      addNotification( "error","Prenez une photo a partager")
      return
    }

    const product = menuItems.find(p => p.id === selectedProductToShare)
    const productName = shareTab === "camera" ? "Photo Le Pave d'Art" : (product?.name || "Produit")
    const productId = shareTab === "camera" ? "photo-custom" : (product?.id || "unknown")

    // Creer le lien de partage unique
    const code = createShareLink(client.id, productId, productName, platform)
    setGeneratedShareCode(code)
  }

  const getShareUrl = (code: string) => {
    return `${window.location.origin}/share/${code}`
  }

  const copyShareLink = async () => {
    if (!generatedShareCode) return
    
    const url = getShareUrl(generatedShareCode)
    await navigator.clipboard.writeText(url)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
    addNotification( "success","Lien copie!")
  }

  const shareOnPlatform = (platform: string) => {
    if (!generatedShareCode) return
    
    const url = getShareUrl(generatedShareCode)
    const product = menuItems.find(p => p.id === selectedProductToShare)
    const shareText = shareTab === "camera" 
      ? `Regardez ma photo chez Le Pave d'Art! Venez decouvrir leurs delicieuses patisseries!`
      : `Decouvrez ${product?.name || "nos delices"} chez Le Pave d'Art! ${product?.description || ""}`

    let shareLink = ""
    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(shareText)}`
        break
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`
        break
      case "whatsapp":
        shareLink = `https://wa.me/?text=${encodeURIComponent(shareText + " " + url)}`
        break
      case "instagram":
        navigator.clipboard.writeText(shareText + " " + url)
        addNotification( "success","Texte copie! Partagez-le sur Instagram")
        return
    }

    if (shareLink) {
      window.open(shareLink, "_blank", "width=600,height=400")
    }
  }

  // Nettoyer la camera quand le dialogue se ferme
  useEffect(() => {
    if (!showShareDialog) {
      stopCamera()
      setCapturedPhoto(null)
    }
  }, [showShareDialog])

  const handleRollChichbich = () => {
    if (!canPlayChichbich || isRolling) return

    setIsRolling(true)
    setChichbichResult(null)
    setShowConfetti(false)

    // Animation des des pendant le lancer
    const rollInterval = setInterval(() => {
      setDice1Value(Math.floor(Math.random() * 6) + 1)
      setDice2Value(Math.floor(Math.random() * 6) + 1)
    }, 100)

    // Resultat final apres 2 secondes
    setTimeout(() => {
      clearInterval(rollInterval)
      
      const finalDice1 = Math.floor(Math.random() * 6) + 1
      const finalDice2 = Math.floor(Math.random() * 6) + 1
      const total = finalDice1 + finalDice2
      
      setDice1Value(finalDice1)
      setDice2Value(finalDice2)
      
      let reward = null
      if (finalDice1 === finalDice2) {
        reward = { description: `Double ${finalDice1}! +${finalDice1 * 20} points`, type: "points", value: finalDice1 * 20 }
        setShowConfetti(true)
      } else if (total >= 10) {
        reward = { description: `${total} points bonus!`, type: "points", value: total * 5 }
        setShowConfetti(true)
      } else if (total >= 7) {
        reward = { description: `${total * 2} points`, type: "points", value: total * 2 }
      }
      
      setChichbichResult({
        dice1: finalDice1,
        dice2: finalDice2,
        reward: reward,
      })

      playGame(client.id, "chichbich", reward ?? undefined)
      
      if (reward) {
        addNotification("success",`Chichbich! ${reward.description}`)
      } else {
        addNotification("info","Pas de chance cette fois!")
      }
      setIsRolling(false)
    }, 2000)
  }

  const getTimeUntil = (targetHour: number) => {
    const now = new Date()
    const target = new Date(now)
    target.setHours(targetHour, 0, 0, 0)
    if (target <= now) {
      target.setDate(target.getDate() + 1)
    }
    const diff = target.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}min`
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Jeux & Recompenses</h2>
        <p className="text-muted-foreground">Tentez votre chance et gagnez des points bonus!</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Roulette Card */}
        <Card className={`p-6 relative overflow-hidden ${!isRouletteTime ? "opacity-75" : ""}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-200/30 to-transparent rounded-bl-full" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${isRouletteTime ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-muted"}`}>
              <Disc3Icon className={`h-7 w-7 ${isRouletteTime ? "text-white" : "text-muted-foreground"}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{rouletteConfig.name}</h3>
              <p className="text-sm text-muted-foreground">
                {rouletteConfig.startHour}h - {rouletteConfig.endHour}h
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Faites tourner la roulette et gagnez des points, des reductions ou des produits gratuits!
          </p>

          {!rouletteConfig.enabled ? (
            <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <LockIcon className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600 font-medium">
                Jeu temporairement ferme par l&apos;administration
              </span>
            </div>
          ) : !isRouletteTime ? (
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <ClockIcon className="h-4 w-4" />
              <span className="text-sm">
                Disponible dans {getTimeUntil(rouletteConfig.startHour)}
              </span>
            </div>
          ) : !canPlayRoulette ? (
            <Badge variant="secondary" className="mb-4">
              <LockIcon className="h-3 w-3 mr-1" />
              Deja joue aujourd'hui
            </Badge>
          ) : (
            <Badge className="bg-green-500 mb-4">
              <SparklesIcon className="h-3 w-3 mr-1" />
              Disponible maintenant!
            </Badge>
          )}

          <Button
            className="w-full"
            disabled={!rouletteConfig.enabled || !isRouletteTime || !canPlayRoulette}
            onClick={() => setShowRouletteDialog(true)}
          >
            {!rouletteConfig.enabled ? (
              <>
                <LockIcon className="h-4 w-4 mr-2" />
                Ferme
              </>
            ) : isRouletteTime && canPlayRoulette ? (
              <>
                <Disc3Icon className="h-4 w-4 mr-2" />
                Jouer a la Roulette
              </>
            ) : (
              <>
                <LockIcon className="h-4 w-4 mr-2" />
                Non disponible
              </>
            )}
          </Button>
        </Card>

        {/* Chichbich Card */}
        <Card className={`p-6 relative overflow-hidden ${!isChichbichTime ? "opacity-75" : ""}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-200/30 to-transparent rounded-bl-full" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${isChichbichTime ? "bg-gradient-to-r from-purple-400 to-pink-500" : "bg-muted"}`}>
              <DicesIcon className={`h-7 w-7 ${isChichbichTime ? "text-white" : "text-muted-foreground"}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{chichbichConfig.name}</h3>
              <p className="text-sm text-muted-foreground">
                {chichbichConfig.startHour}h - {chichbichConfig.endHour}h
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Lancez les des tunisiens traditionnels et decouvrez votre recompense!
          </p>

          {!chichbichConfig.enabled ? (
            <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <LockIcon className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600 font-medium">
                Jeu temporairement ferme par l&apos;administration
              </span>
            </div>
          ) : !isChichbichTime ? (
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <ClockIcon className="h-4 w-4" />
              <span className="text-sm">
                Disponible dans {getTimeUntil(chichbichConfig.startHour)}
              </span>
            </div>
          ) : !canPlayChichbich ? (
            <Badge variant="secondary" className="mb-4">
              <LockIcon className="h-3 w-3 mr-1" />
              Deja joue aujourd&apos;hui
            </Badge>
          ) : hasSharedToday ? (
            <Badge className="bg-green-500 mb-4">
              <CheckCircleIcon className="h-3 w-3 mr-1" />
              Partage valide - Pret a jouer!
            </Badge>
          ) : existingShareLink && !existingShareLink.isClicked ? (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700 flex items-center gap-2 font-medium">
                <ClockIcon className="h-4 w-4" />
                En attente de clic sur votre lien...
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Quelqu&apos;un doit cliquer sur votre lien partage pour valider
              </p>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 flex items-center gap-2">
                <ShareIcon className="h-4 w-4" />
                Partagez un produit pour debloquer le jeu!
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Le jeu sera debloque quand quelqu&apos;un clique sur votre lien
              </p>
            </div>
          )}

          {/* Boutons Partager et Jouer */}
          <div className="space-y-2">
            {isChichbichTime && canPlayChichbich && !hasSharedToday && chichbichConfig.enabled && (
              existingShareLink && !existingShareLink.isClicked ? (
                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  onClick={() => {
                    setGeneratedShareCode(existingShareLink.code)
                    setSelectedProductToShare(existingShareLink.productId)
                    setShowShareDialog(true)
                  }}
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Voir mon lien de partage
                </Button>
              ) : (
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                  onClick={() => {
                    setGeneratedShareCode(null)
                    setSelectedProductToShare(null)
                    setShowShareDialog(true)
                  }}
                >
                  <ShareIcon className="h-4 w-4 mr-2" />
                  Partager pour jouer
                </Button>
              )
            )}
            
            <Button
              className="w-full"
              disabled={!chichbichConfig.enabled || !isChichbichTime || !canPlayChichbich || !hasSharedToday}
              onClick={() => setShowChichbichDialog(true)}
            >
              {!chichbichConfig.enabled ? (
                <>
                  <LockIcon className="h-4 w-4 mr-2" />
                  Ferme
                </>
              ) : !isChichbichTime ? (
                <>
                  <LockIcon className="h-4 w-4 mr-2" />
                  Non disponible
                </>
              ) : !canPlayChichbich ? (
                <>
                  <LockIcon className="h-4 w-4 mr-2" />
                  Deja joue
                </>
              ) : !hasSharedToday ? (
                <>
                  <LockIcon className="h-4 w-4 mr-2" />
                  Partagez d&apos;abord
                </>
              ) : (
                <>
                  <DicesIcon className="h-4 w-4 mr-2" />
                  Jouer au Chichbich
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Prizes Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrophyIcon className="h-5 w-5 text-amber-500" />
          Lots a Gagner
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <CoinsIcon className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="font-medium">10-100 Points</p>
            <p className="text-xs text-muted-foreground">Points bonus</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <GiftIcon className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="font-medium">5-10 TND</p>
            <p className="text-xs text-muted-foreground">Reductions</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <SparklesIcon className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="font-medium">Produits</p>
            <p className="text-xs text-muted-foreground">Gratuits</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <TrophyIcon className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="font-medium">Jackpot</p>
            <p className="text-xs text-muted-foreground">Surprises</p>
          </div>
        </div>
      </Card>

      {/* Roulette Dialog */}
      <Dialog open={showRouletteDialog} onOpenChange={(open) => {
        if (!isSpinning) {
          setShowRouletteDialog(open)
          if (!open) setRouletteResult(null)
        }
      }}>
        <DialogContent className="max-w-xl md:max-w-2xl overflow-hidden">
          <style>{gameStyles}</style>
          
          {/* Background decoratif */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-transparent to-amber-900/10 pointer-events-none" />
          <div className="absolute top-0 left-0 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-red-400/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          
          <Confetti show={showConfetti} />
          
          <DialogHeader className="relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <StarIcon className="h-5 w-5 text-amber-500" />
              <DialogTitle className="text-center text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                Roulette de la Chance
              </DialogTitle>
              <StarIcon className="h-5 w-5 text-amber-500" />
            </div>
            <DialogDescription className="text-center text-base">
              Tournez la roue et tentez de gagner des recompenses incroyables!
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-4 md:py-6 relative">
            {/* Roue de fortune */}
            <FortuneWheel 
              isSpinning={isSpinning} 
              rotation={wheelRotation} 
              segments={WHEEL_SEGMENTS} 
            />

            {/* Resultat */}
            {rouletteResult && !isSpinning && (
              <div 
                className="mt-6 text-center w-full max-w-sm"
                style={{ animation: "resultPopIn 0.5s ease-out forwards" }}
              >
                {rouletteResult.result === "win" ? (
                  <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-300 shadow-lg shadow-amber-200/50">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                      <TrophyIcon className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-amber-700 mb-1">{rouletteResult.prize?.description}</p>
                    <p className="text-amber-600 font-medium">Felicitations!</p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-3xl">😢</span>
                    </div>
                    <p className="font-semibold text-gray-700">Pas de chance cette fois!</p>
                    <p className="text-sm text-gray-500 mt-1">Revenez demain pour une nouvelle tentative</p>
                  </div>
                )}
              </div>
            )}

            {/* Boutons */}
            <div className="mt-6 flex gap-4">
              {!rouletteResult && (
                <Button
                  size="lg"
                  onClick={handleSpinRoulette}
                  disabled={isSpinning}
                  className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-700 hover:via-orange-600 hover:to-amber-600 text-white px-10 py-6 text-lg font-semibold shadow-lg shadow-orange-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-orange-500/40"
                >
                  {isSpinning ? (
                    <span className="flex items-center gap-2">
                      <Disc3Icon className="h-6 w-6 animate-spin" />
                      La roue tourne...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ZapIcon className="h-6 w-6" />
                      Tourner la Roue
                    </span>
                  )}
                </Button>
              )}

              {rouletteResult && (
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-6"
                  onClick={() => {
                    setShowRouletteDialog(false)
                    setRouletteResult(null)
                  }}
                >
                  Fermer
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chichbich Dialog */}
      <Dialog open={showChichbichDialog} onOpenChange={(open) => {
        if (!isRolling) {
          setShowChichbichDialog(open)
          if (!open) setChichbichResult(null)
        }
      }}>
        <DialogContent className="max-w-lg md:max-w-xl overflow-hidden">
          <style>{gameStyles}</style>
          
          {/* Background decoratif */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/10 via-transparent to-purple-900/10 pointer-events-none" />
          
          <Confetti show={showConfetti} />
          
          <DialogHeader className="relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <DicesIcon className="h-5 w-5 text-emerald-600" />
              <DialogTitle className="text-center text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
                Chichbich
              </DialogTitle>
              <DicesIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <DialogDescription className="text-center text-base">
              Lancez les des tunisiens et decouvrez votre recompense!
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-4 md:py-6 relative">
            {/* Zone de jeu - Tapis de casino */}
            <div 
              className="relative rounded-2xl p-8 md:p-10 shadow-2xl mb-6 overflow-hidden"
              style={{
                background: "linear-gradient(145deg, #166534, #15803d, #166534)",
                boxShadow: "inset 0 2px 20px rgba(0,0,0,0.3), 0 10px 40px rgba(0,0,0,0.2)",
              }}
            >
              {/* Motif du tapis */}
              <div className="absolute inset-4 border-2 border-amber-600/30 rounded-xl pointer-events-none" />
              <div className="absolute inset-6 border border-amber-600/20 rounded-lg pointer-events-none" />
              
              {/* Coins decoratifs */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-500/50 rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-500/50 rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-500/50 rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-500/50 rounded-br-lg" />
              
              {/* Des */}
              <div className="flex gap-6 md:gap-10 items-center justify-center relative z-10">
                <Dice3D value={isRolling || !chichbichResult ? dice1Value : chichbichResult.dice1} isRolling={isRolling} delay={0} />
                <Dice3D value={isRolling || !chichbichResult ? dice2Value : chichbichResult.dice2} isRolling={isRolling} delay={0.05} />
              </div>
              
              {/* Total */}
              {chichbichResult && !isRolling && (
                <div className="mt-6 text-center relative z-10">
                  <div className="inline-block bg-black/30 backdrop-blur-sm rounded-full px-6 py-2">
                    <span className="text-amber-200/80 text-sm uppercase tracking-wider">Total</span>
                    <p className="text-4xl font-bold text-white drop-shadow-lg">
                      {chichbichResult.dice1 + chichbichResult.dice2}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Resultat */}
            {chichbichResult && !isRolling && (
              <div 
                className="text-center w-full max-w-sm mb-4"
                style={{ animation: "resultPopIn 0.5s ease-out forwards" }}
              >
                {chichbichResult.reward ? (
                  <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-emerald-300 shadow-lg shadow-emerald-200/50">
                    {chichbichResult.dice1 === chichbichResult.dice2 && (
                      <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 mb-3 text-sm px-4 py-1">DOUBLE!</Badge>
                    )}
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                      <TrophyIcon className="h-7 w-7 text-white" />
                    </div>
                    <p className="text-xl md:text-2xl font-bold text-emerald-700">{chichbichResult.reward.description}</p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-200 flex items-center justify-center">
                      <DicesIcon className="h-7 w-7 text-gray-400" />
                    </div>
                    <p className="font-semibold text-gray-700">Pas de recompense cette fois</p>
                    <p className="text-sm text-gray-500 mt-1">Faites un double ou un total de 7+ pour gagner!</p>
                  </div>
                )}
              </div>
            )}

            {/* Regles */}
            {!chichbichResult && !isRolling && (
              <div className="text-center w-full max-w-sm mb-4">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                  <p className="font-semibold text-emerald-800 mb-2">Comment gagner?</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <p className="font-bold text-emerald-600">Double</p>
                      <p className="text-gray-500">x20 pts</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <p className="font-bold text-teal-600">10+</p>
                      <p className="text-gray-500">x5 pts</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <p className="font-bold text-cyan-600">7+</p>
                      <p className="text-gray-500">x2 pts</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons */}
            <div className="flex gap-4">
              {!chichbichResult && (
                <Button
                  size="lg"
                  onClick={handleRollChichbich}
                  disabled={isRolling}
                  className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 hover:from-emerald-700 hover:via-teal-600 hover:to-cyan-600 text-white px-10 py-6 text-lg font-semibold shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40"
                >
                  {isRolling ? (
                    <span className="flex items-center gap-2">
                      <DicesIcon className="h-6 w-6 animate-bounce" />
                      Les des roulent...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <DicesIcon className="h-6 w-6" />
                      Lancer les Des
                    </span>
                  )}
                </Button>
              )}

              {chichbichResult && (
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-6"
                  onClick={() => {
                    setShowChichbichDialog(false)
                    setChichbichResult(null)
                  }}
                >
                  Fermer
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de partage avec lien unique */}
      <Dialog open={showShareDialog} onOpenChange={(open) => {
        setShowShareDialog(open)
        if (!open) {
          setCopySuccess(false)
          setGeneratedShareCode(null)
          setSelectedProductToShare(null)
          setCapturedPhoto(null)
          setMenuSearchQuery("")
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShareIcon className="h-5 w-5 text-blue-500" />
              {generatedShareCode ? "Partagez votre lien" : "Partagez pour jouer"}
            </DialogTitle>
            <DialogDescription>
              {generatedShareCode 
                ? "Partagez ce lien unique sur vos reseaux. Le jeu sera debloque quand quelqu'un clique dessus!"
                : "Choisissez un produit du menu ou prenez une photo a partager."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Etape 1: Selection du produit ou photo */}
            {!generatedShareCode && (
              <Tabs value={shareTab} onValueChange={(v) => setShareTab(v as "menu" | "camera")} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="menu" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Menu
                  </TabsTrigger>
                  <TabsTrigger value="camera" className="flex items-center gap-2">
                    <CameraIcon className="h-4 w-4" />
                    Photo
                  </TabsTrigger>
                </TabsList>

                {/* Onglet Menu */}
                <TabsContent value="menu" className="flex-1 flex flex-col mt-4 overflow-hidden">
                  {/* Barre de recherche */}
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder="Rechercher un produit..."
                      value={menuSearchQuery}
                      onChange={(e) => setMenuSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Liste des produits */}
                  <ScrollArea className="flex-1 h-[280px] pr-2">
                    <div className="grid grid-cols-2 gap-2">
                      {filteredMenuItems.map((product) => (
                        <div
                          key={product.id}
                          onClick={() => setSelectedProductToShare(product.id)}
                          className={`cursor-pointer rounded-lg border-2 p-2 transition-all ${
                            selectedProductToShare === product.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-20 object-cover rounded-md mb-1"
                            />
                          ) : (
                            <div className="w-full h-20 bg-gray-100 rounded-md mb-1 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <p className="text-xs font-medium text-center truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground text-center">{product.price.toFixed(2)} TND</p>
                        </div>
                      ))}
                    </div>
                    {filteredMenuItems.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Aucun produit trouve
                      </div>
                    )}
                  </ScrollArea>

                  {selectedProductToShare && (
                    <Button
                      className="w-full mt-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                      onClick={() => handleGenerateShareLink("social")}
                    >
                      <ShareIcon className="h-4 w-4 mr-2" />
                      Generer mon lien de partage
                    </Button>
                  )}
                </TabsContent>

                {/* Onglet Camera */}
                <TabsContent value="camera" className="flex-1 flex flex-col mt-4">
                  <div className="flex-1 flex flex-col items-center justify-center">
                    {/* Canvas cache pour capture */}
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {/* Video ou photo capturee */}
                    {!capturedPhoto ? (
                      <div className="w-full aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden relative">
                        {isCameraActive ? (
                          <>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                              <Button
                                onClick={capturePhoto}
                                size="lg"
                                className="rounded-full w-16 h-16 bg-white hover:bg-gray-100"
                              >
                                <CameraIcon className="h-8 w-8 text-gray-900" />
                              </Button>
                              <Button
                                onClick={stopCamera}
                                variant="outline"
                                size="sm"
                                className="rounded-full bg-red-500 hover:bg-red-600 text-white border-0"
                              >
                                <XIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full gap-4">
                            <CameraIcon className="h-16 w-16 text-gray-500" />
                            <p className="text-gray-400 text-sm text-center px-4">
                              Prenez une photo de votre achat ou de votre moment chez Le Pave d&apos;Art
                            </p>
                            <div className="flex gap-3">
                              <Button onClick={startCamera} variant="outline" className="bg-white">
                                <CameraIcon className="h-4 w-4 mr-2" />
                                Ouvrir la camera
                              </Button>
                              <Button 
                                variant="outline" 
                                className="bg-white"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Galerie
                              </Button>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden relative">
                        <img
                          src={capturedPhoto}
                          alt="Photo capturee"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          onClick={() => setCapturedPhoto(null)}
                          variant="outline"
                          size="sm"
                          className="absolute top-2 right-2 rounded-full bg-white/80 hover:bg-white"
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {capturedPhoto && (
                    <Button
                      className="w-full mt-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                      onClick={() => handleGenerateShareLink("social")}
                    >
                      <ShareIcon className="h-4 w-4 mr-2" />
                      Generer mon lien de partage
                    </Button>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {/* Etape 2: Lien genere - Partage */}
            {generatedShareCode && (
              <>
                {/* Info importante */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                    <SparklesIcon className="h-4 w-4" />
                    Comment ca marche?
                  </p>
                  <ul className="text-xs text-amber-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Partagez ce lien avec vos amis</li>
                    <li>Quand quelqu&apos;un clique sur le lien, votre partage est valide</li>
                    <li>Le bouton &quot;Jouer au Chichbich&quot; sera alors debloque!</li>
                  </ul>
                </div>

                {/* Lien a partager */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Votre lien unique:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getShareUrl(generatedShareCode)}
                      className="flex-1 px-3 py-2 text-sm bg-gray-100 border rounded-lg truncate"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyShareLink}
                      className={copySuccess ? "bg-green-50 border-green-300 text-green-600" : ""}
                    >
                      {copySuccess ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Boutons de partage rapide */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Partager directement sur:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => shareOnPlatform("facebook")}
                      className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white"
                    >
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </Button>
                    <Button
                      onClick={() => shareOnPlatform("twitter")}
                      className="bg-[#1DA1F2] hover:bg-[#1DA1F2]/90 text-white"
                    >
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      Twitter
                    </Button>
                    <Button
                      onClick={() => shareOnPlatform("whatsapp")}
                      className="bg-[#25D366] hover:bg-[#25D366]/90 text-white"
                    >
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </Button>
                    <Button
                      onClick={() => shareOnPlatform("instagram")}
                      className="bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white"
                    >
                      <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                      Instagram
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
