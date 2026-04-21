"use client"

import { useState } from "react"
import { useAuth, AuthProvider } from "@/contexts/auth-context"
import { StockProvider } from "@/contexts/stock-context"
import { LoyaltyProvider } from "@/contexts/loyalty-context"
import { LoyaltyCardsProvider, useLoyaltyCards } from "@/contexts/loyalty-cards-context"
import { LoyaltyCardDisplay } from "@/components/loyalty-card-display"
import { ChichBichGameModal } from "@/components/chichbich-game-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeftIcon, 
  CoffeeIcon,
  GiftIcon,
  CalendarIcon,
  TrophyIcon,
  Dice5Icon,
  SparklesIcon,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

function ClientCardsContent() {
  const { user } = useAuth()
  const { 
    getActiveConfigs, 
    getActiveCustomerCards, 
    playChichBich,
    getCardConfig,
  } = useLoyaltyCards()
  
  const [activeTab, setActiveTab] = useState("active")
  const [showChichBichModal, setShowChichBichModal] = useState(false)
  const [chichBichGameData, setChichBichGameData] = useState<{
    cardId: string
    position: number
    chances: number
    winCondition: string
    rewardName: string
  } | null>(null)
  
  const visitorId = user?.id || "guest"
  const activeConfigs = getActiveConfigs()
  const customerCards = getActiveCustomerCards(visitorId)
  
  // Separate cards by status
  const activeCards = customerCards.filter(c => c.status === "active")
  const completedCards = customerCards.filter(c => c.status === "completed")
  
  // Cards that user doesn't have yet
  const availableConfigs = activeConfigs.filter(
    config => !customerCards.some(card => card.configId === config.id)
  )
  
  // Handle playing Chich Bich game
  const handlePlayChichBich = (cardId: string, position: number) => {
    const card = customerCards.find(c => c.id === cardId)
    if (!card) return
    
    const config = getCardConfig(card.configId)
    if (!config) return
    
    const posConfig = config.stampPositions.find(p => p.position === position)
    if (!posConfig || posConfig.type !== "game" || !posConfig.gameConfig) return
    
    setChichBichGameData({
      cardId,
      position,
      chances: posConfig.gameConfig.chances,
      winCondition: posConfig.gameConfig.winCondition,
      rewardName: config.productName,
    })
    setShowChichBichModal(true)
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <CoffeeIcon className="h-8 w-8 text-amber-600" />
            </div>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>
              Connectez-vous pour acceder a vos cartes de fidelite et cumuler vos tampons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/client/register" className="block">
              <Button className="w-full bg-amber-500 hover:bg-amber-600">
                Se connecter / S&apos;inscrire
              </Button>
            </Link>
            <Link href="/menu" className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Retour au menu
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/menu">
              <Button variant="ghost" size="icon" className="shrink-0">
                <ArrowLeftIcon className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-stone-900">Mes Cartes de Fidelite</h1>
              <p className="text-sm text-stone-500">Cumulez vos achats et gagnez des recompenses</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200">
              <TrophyIcon className="h-4 w-4 text-amber-600" />
              <span className="font-semibold text-amber-700">{activeCards.length} carte{activeCards.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-stone-100">
            <TabsTrigger value="active" className="data-[state=active]:bg-white">
              En cours ({activeCards.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="data-[state=active]:bg-white">
              Disponibles ({availableConfigs.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-white">
              Terminees ({completedCards.length})
            </TabsTrigger>
          </TabsList>

          {/* Active Cards Tab */}
          <TabsContent value="active" className="space-y-6">
            {activeCards.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                    <CoffeeIcon className="h-8 w-8 text-stone-400" />
                  </div>
                  <h3 className="font-semibold text-stone-900 mb-2">Aucune carte en cours</h3>
                  <p className="text-sm text-stone-500 mb-4">
                    Commencez a collecter des tampons en passant commande!
                  </p>
                  <Link href="/menu">
                    <Button className="bg-amber-500 hover:bg-amber-600">
                      Commander maintenant
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              activeCards.map(card => {
                const config = getCardConfig(card.configId)
                if (!config) return null
                
                return (
                  <LoyaltyCardDisplay
                    key={card.id}
                    config={config}
                    customerCard={card}
                    onPlayGame={handlePlayChichBich}
                  />
                )
              })
            )}
          </TabsContent>

          {/* Available Cards Tab */}
          <TabsContent value="available" className="space-y-6">
            {availableConfigs.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <SparklesIcon className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-stone-900 mb-2">Vous avez toutes les cartes!</h3>
                  <p className="text-sm text-stone-500">
                    Continuez a collecter des tampons sur vos cartes actives.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {availableConfigs.map(config => (
                  <Card key={config.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div 
                      className={cn(
                        "h-3",
                        config.backgroundColor === "dark" ? "bg-stone-800" : "bg-amber-500"
                      )}
                    />
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{config.name}</CardTitle>
                          <CardDescription>{config.productName} - {config.productPrice.toFixed(2)} TND</CardDescription>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {config.totalStamps} tampons
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Rewards preview */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-stone-500 uppercase">Recompenses</p>
                        <div className="flex flex-wrap gap-2">
                          {config.stampPositions
                            .filter(p => p.type === "reward")
                            .slice(0, 3)
                            .map((pos, idx) => (
                              <div 
                                key={idx}
                                className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-full text-xs text-emerald-700"
                              >
                                <GiftIcon className="h-3 w-3" />
                                Position {pos.position}
                              </div>
                            ))}
                          {config.stampPositions.filter(p => p.type === "game").length > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 rounded-full text-xs text-purple-700">
                              <Dice5Icon className="h-3 w-3" />
                              Jeu Chich Bich
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Expiration info */}
                      {config.expirationDays && (
                        <div className="flex items-center gap-2 text-xs text-stone-500">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          <span>Valide {config.expirationDays} jours apres activation</span>
                        </div>
                      )}
                      
                      <p className="text-sm text-stone-600">
                        Achetez un produit eligible pour demarrer cette carte automatiquement.
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Cards Tab */}
          <TabsContent value="completed" className="space-y-6">
            {completedCards.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="mx-auto w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                    <TrophyIcon className="h-8 w-8 text-stone-400" />
                  </div>
                  <h3 className="font-semibold text-stone-900 mb-2">Aucune carte terminee</h3>
                  <p className="text-sm text-stone-500">
                    Completez vos cartes actives pour les voir ici.
                  </p>
                </CardContent>
              </Card>
            ) : (
              completedCards.map(card => {
                const config = getCardConfig(card.configId)
                if (!config) return null
                
                return (
                  <div key={card.id} className="relative">
                    <div className="absolute inset-0 bg-white/60 z-10 rounded-2xl flex items-center justify-center">
                      <Badge className="bg-emerald-500 text-white text-lg px-4 py-2">
                        <TrophyIcon className="h-5 w-5 mr-2" />
                        Completee!
                      </Badge>
                    </div>
                    <LoyaltyCardDisplay
                      config={config}
                      customerCard={card}
                    />
                  </div>
                )
              })
            )}
          </TabsContent>
        </Tabs>

        {/* How it works section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Comment ca marche?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-stone-900">Achetez</p>
                  <p className="text-sm text-stone-500">Commandez un produit eligible</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-stone-900">Tamponnez</p>
                  <p className="text-sm text-stone-500">Un tampon est ajoute automatiquement</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-stone-900">Gagnez</p>
                  <p className="text-sm text-stone-500">Recevez des recompenses et jouez!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Chich Bich Game Modal */}
      {chichBichGameData && (
        <ChichBichGameModal
          isOpen={showChichBichModal}
          onClose={() => {
            setShowChichBichModal(false)
            setChichBichGameData(null)
          }}
          onPlay={() => {
            const result = playChichBich(chichBichGameData.cardId, chichBichGameData.position)
            return result
          }}
          chances={chichBichGameData.chances}
          winCondition={chichBichGameData.winCondition}
          rewardName={chichBichGameData.rewardName}
        />
      )}
    </div>
  )
}

export default function ClientCartesPage() {
  return (
    <AuthProvider>
      <StockProvider>
        <LoyaltyProvider>
          <LoyaltyCardsProvider>
            <ClientCardsContent />
          </LoyaltyCardsProvider>
        </LoyaltyProvider>
      </StockProvider>
    </AuthProvider>
  )
}
