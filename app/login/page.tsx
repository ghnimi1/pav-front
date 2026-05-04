"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useAuth, AuthProvider } from "@/contexts/auth-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { NotificationContainer } from "@/components/notification-container"
import { Lock, Mail, ChefHat, Coffee } from "lucide-react"
import Link from "next/link"

function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === "client") {
        router.push("/menu")
      } else {
        router.push("/")
      }
    }
  }, [isAuthenticated, authLoading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const success = await login(email, password)
    if (success) {
      // Redirect based on role
      // Get the updated user from localStorage since state might not be updated immediately
      const storedUser = localStorage.getItem("currentUser")
      if (storedUser) {
        const loginUser = JSON.parse(storedUser)
        if (loginUser.role === "client") {
          router.push("/menu")
        } else {
          router.push("/")
        }
      }
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 mb-4">
            <ChefHat className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Connexion</h1>
          <p className="text-gray-600 mt-2">Pâtisserie</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="votre.email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            disabled={isLoading}
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-600">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-amber-600 hover:text-amber-700 font-medium">
              S'inscrire
            </Link>
          </p>
        </div>

        {/* <div className="mt-6 p-4 bg-amber-50 rounded-lg">
          <p className="text-xs text-gray-600 font-medium mb-2">Comptes de test :</p>
          <p className="text-xs text-gray-600">Admin: admin@patisserie.tn / admin123</p>
          <p className="text-xs text-gray-600">Client: client@test.com / client123</p>
        </div> */}
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <LoginForm />
        <NotificationContainer />
      </AuthProvider>
    </NotificationProvider>
  )
}
