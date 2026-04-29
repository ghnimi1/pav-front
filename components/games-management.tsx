"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dices,
  CircleDotIcon,
  SettingsIcon,
  SaveIcon,
  ClockIcon,
  GiftIcon,
  PlusIcon,
  Trash2Icon,
  PlayIcon,
  PauseIcon,
  RefreshCwIcon,
} from "lucide-react"
import { useLoyalty, type GameConfig, type GameReward } from "@/contexts/loyalty-context"
import { useNotification } from "@/contexts/notification-context"

export function GamesManagement() {
  const [gamesConfig, setGamesConfig] = useState<GameConfig[]>([])
  const [selectedGame, setSelectedGame] = useState<GameConfig | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showRewardDialog, setShowRewardDialog] = useState(false)
  const [editingReward, setEditingReward] = useState<GameReward | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const { resetGamePlays, gamePlays, gamesConfig: storedGamesConfig, saveGamesConfig } = useLoyalty()
  const { addNotification } = useNotification()

  useEffect(() => {
    if (storedGamesConfig.length > 0) {
      setGamesConfig(storedGamesConfig)
    }
  }, [storedGamesConfig])

  const saveConfig = () => {
    saveGamesConfig(gamesConfig)
    setHasChanges(false)
    addNotification("Configuration des jeux sauvegardee", "success")
  }

  const handleResetAllGamePlays = () => {
    resetGamePlays()
    addNotification("Toutes les parties jouees ont ete reinitialisees", "success")
  }

  const updateGameConfig = (gameId: string, updates: Partial<GameConfig>) => {
    setGamesConfig((prev) =>
      prev.map((game) => (game.id === gameId ? { ...game, ...updates } : game))
    )
    setHasChanges(true)
  }

  const toggleGameEnabled = (gameId: string) => {
    updateGameConfig(gameId, {
      enabled: !gamesConfig.find((g) => g.id === gameId)?.enabled,
    })
  }

  

  const openEditDialog = (game: GameConfig) => {
    setSelectedGame({ ...game })
    setShowEditDialog(true)
  }

  const saveGameEdit = () => {
    if (selectedGame) {
      updateGameConfig(selectedGame.id, selectedGame)
      setShowEditDialog(false)
      setSelectedGame(null)
    }
  }

  const addReward = () => {
    setEditingReward({
      id: `reward_${Date.now()}`,
      name: "",
      points: 0,
      probability: 10,
      color: "#3b82f6",
      type: "points",
      value: 0,
      wheelSegment: selectedGame?.rewards.length ? selectedGame.rewards.length + 1 : 1,
    })
    setShowRewardDialog(true)
  }

  const saveReward = () => {
    if (selectedGame && editingReward) {
      const existingIndex = selectedGame.rewards.findIndex((r) => r.id === editingReward.id)
      let updatedRewards
      if (existingIndex >= 0) {
        updatedRewards = selectedGame.rewards.map((r) =>
          r.id === editingReward.id ? editingReward : r
        )
      } else {
        updatedRewards = [...selectedGame.rewards, editingReward]
      }
      setSelectedGame({ ...selectedGame, rewards: updatedRewards })
      setShowRewardDialog(false)
      setEditingReward(null)
    }
  }

  const deleteReward = (rewardId: string) => {
    if (selectedGame) {
      setSelectedGame({
        ...selectedGame,
        rewards: selectedGame.rewards.filter((r) => r.id !== rewardId),
      })
    }
  }

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, "0")}:00`
  }

  const isGameActive = (game: GameConfig) => {
    if (!game.enabled) return false
    const now = new Date().getHours()
    return now >= game.startHour && now < game.endHour
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Jeux</h2>
          <p className="text-muted-foreground">
            Configurez les jeux de fidelite, horaires et recompenses
          </p>
        </div>
        <Button onClick={saveConfig} disabled={!hasChanges} className="gap-2">
          <SaveIcon className="h-4 w-4" />
          Sauvegarder
          {hasChanges && <Badge variant="destructive" className="ml-2">Non sauvegarde</Badge>}
        </Button>
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Jeux Actifs</p>
                <p className="text-2xl font-bold">
                  {gamesConfig.filter((g) => g.enabled).length} / {gamesConfig.length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <PlayIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponibles Maintenant</p>
                <p className="text-2xl font-bold">
                  {gamesConfig.filter((g) => isGameActive(g)).length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <ClockIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Parties jouees (total)</p>
                <p className="text-2xl font-bold">{gamePlays.length}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleResetAllGamePlays}
                className="gap-2"
              >
                <RefreshCwIcon className="h-4 w-4" />
                Reinitialiser
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des jeux */}
      <div className="grid gap-6 md:grid-cols-2">
        {gamesConfig.map((game) => (
          <Card key={game.id} className={`relative overflow-hidden ${!game.enabled ? "opacity-60" : ""}`}>
            <div className={`absolute top-0 left-0 right-0 h-1 ${isGameActive(game) ? "bg-green-500" : "bg-gray-300"}`} />
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${game.id === "roulette" ? "bg-gradient-to-br from-amber-400 to-orange-500" : "bg-gradient-to-br from-purple-400 to-indigo-500"}`}>
                    {game.id === "roulette" ? (
                      <CircleDotIcon className="h-6 w-6 text-white" />
                    ) : (
                      <Dices className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{game.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <ClockIcon className="h-3 w-3" />
                      {formatHour(game.startHour)} - {formatHour(game.endHour)}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {isGameActive(game) ? (
                    <Badge className="bg-green-500">En cours</Badge>
                  ) : game.enabled ? (
                    <Badge variant="secondary">Hors horaire</Badge>
                  ) : (
                    <Badge variant="outline">Desactive</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Max parties/jour</p>
                  <p className="font-semibold">{game.maxPlaysPerDay}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground">Points requis</p>
                  <p className="font-semibold">{game.minPointsRequired} pts</p>
                </div>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Recompenses ({game.rewards.length})</p>
                <div className="flex flex-wrap gap-1">
                  {game.rewards.slice(0, 4).map((reward) => (
                    <Badge
                      key={reward.id}
                      variant="outline"
                      style={{ borderColor: reward.color, color: reward.color }}
                    >
                      {reward.points > 0 ? `${reward.points} pts` : reward.name}
                    </Badge>
                  ))}
                  {game.rewards.length > 4 && (
                    <Badge variant="outline">+{game.rewards.length - 4}</Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={game.enabled}
                    onCheckedChange={() => toggleGameEnabled(game.id)}
                  />
                  <Label className="text-sm">Actif</Label>
                </div>
                <Button variant="outline" size="sm" onClick={() => openEditDialog(game)}>
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Configurer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog Edition Jeu */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Configurer {selectedGame?.name}
            </DialogTitle>
            <DialogDescription>
              Modifiez les horaires, limites et recompenses du jeu
            </DialogDescription>
          </DialogHeader>

          {selectedGame && (
            <div className="space-y-6 py-4">
              {/* Horaires */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  Horaires de disponibilite
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Heure de debut</Label>
                    <Select
                      value={selectedGame.startHour.toString()}
                      onValueChange={(v) =>
                        setSelectedGame({ ...selectedGame, startHour: parseInt(v) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {formatHour(i)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Heure de fin</Label>
                    <Select
                      value={selectedGame.endHour.toString()}
                      onValueChange={(v) =>
                        setSelectedGame({ ...selectedGame, endHour: parseInt(v) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {formatHour(i)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Limites */}
              <div className="space-y-4">
                <h3 className="font-semibold">Limites</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Max parties par jour</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={selectedGame.maxPlaysPerDay}
                      onChange={(e) =>
                        setSelectedGame({
                          ...selectedGame,
                          maxPlaysPerDay: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Points minimum requis</Label>
                    <Input
                      type="number"
                      min={0}
                      value={selectedGame.minPointsRequired}
                      onChange={(e) =>
                        setSelectedGame({
                          ...selectedGame,
                          minPointsRequired: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Recompenses */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <GiftIcon className="h-4 w-4" />
                    Recompenses
                  </h3>
                  <Button size="sm" variant="outline" onClick={addReward}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
                <div className="space-y-2">
                  {selectedGame.rewards.map((reward) => (
                    <div
                      key={reward.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: reward.color }}
                        />
                        <div>
                          <p className="font-medium">{reward.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {reward.type || "points"} - {reward.value ?? reward.points} - {reward.probability}% de chance
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingReward(reward)
                            setShowRewardDialog(true)
                          }}
                        >
                          <SettingsIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => deleteReward(reward.id)}
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total probabilites: {selectedGame.rewards.reduce((acc, r) => acc + r.probability, 0).toFixed(1)}%
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveGameEdit}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Edition Recompense */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingReward?.id.startsWith("reward_") ? "Ajouter une" : "Modifier la"} recompense
            </DialogTitle>
          </DialogHeader>

          {editingReward && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input
                  value={editingReward.name}
                  onChange={(e) =>
                    setEditingReward({ ...editingReward, name: e.target.value })
                  }
                  placeholder="Ex: 50 Points Bonus"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Points</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingReward.points}
                    onChange={(e) =>
                      setEditingReward({
                        ...editingReward,
                        points: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Probabilite (%)</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={editingReward.probability}
                    onChange={(e) =>
                      setEditingReward({
                        ...editingReward,
                        probability: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={editingReward.type || "points"}
                    onValueChange={(value: "points" | "discount" | "free_item") =>
                      setEditingReward({ ...editingReward, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points">Points</SelectItem>
                      <SelectItem value="discount">Remise</SelectItem>
                      <SelectItem value="free_item">Produit offert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valeur</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editingReward.value ?? editingReward.points}
                    onChange={(e) =>
                      setEditingReward({
                        ...editingReward,
                        value: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Wheel segment</Label>
                <Input
                  type="number"
                  min={1}
                  value={editingReward.wheelSegment ?? 1}
                  onChange={(e) =>
                    setEditingReward({
                      ...editingReward,
                      wheelSegment: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="color"
                    value={editingReward.color}
                    onChange={(e) =>
                      setEditingReward({ ...editingReward, color: e.target.value })
                    }
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={editingReward.color}
                    onChange={(e) =>
                      setEditingReward({ ...editingReward, color: e.target.value })
                    }
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRewardDialog(false)}>
              Annuler
            </Button>
            <Button onClick={saveReward}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
