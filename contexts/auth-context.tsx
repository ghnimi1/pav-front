"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useNotification } from "./notification-context"

export type UserRole = "admin" | "user" | "client"

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum"

// Employee role types
export type EmployeeRole = "super_admin" | "admin" | "manager" | "employee"

// Permission keys for backoffice sections
export type PermissionKey =
  | "dashboard"
  | "articles"
  | "menu"
  | "categories"
  | "suppliers"
  | "batches"
  | "alerts"
  | "clients"
  | "clients_loyalty"
  | "rewards"
  | "missions"
  | "games"
  | "special_days"
  | "referrals"
  | "pos"
  | "employees"

export interface Permission {
  key: PermissionKey
  label: string
  description: string
}

export interface Employee {
  id: string
  email: string
  password: string
  name: string
  phone?: string
  role: EmployeeRole
  permissions: PermissionKey[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
}

// All available permissions
export const ALL_PERMISSIONS: Permission[] = [
  { key: "dashboard", label: "Tableau de bord", description: "Voir les statistiques et apercu general" },
  { key: "articles", label: "Articles", description: "Gerer les articles du stock" },
  { key: "menu", label: "Menu Client", description: "Gerer le menu visible par les clients" },
  { key: "categories", label: "Categories", description: "Gerer les categories du menu" },
  { key: "suppliers", label: "Fournisseurs", description: "Gerer les fournisseurs" },
  { key: "batches", label: "Lots", description: "Gerer les lots et inventaire" },
  { key: "alerts", label: "Alertes", description: "Voir les alertes de stock et expiration" },
  { key: "clients", label: "Clients", description: "Gerer les clients" },
  { key: "clients_loyalty", label: "Fidelite Clients", description: "Gerer les points et niveaux de fidelite" },
  { key: "rewards", label: "Recompenses", description: "Gerer les recompenses du programme fidelite" },
  { key: "missions", label: "Missions", description: "Gerer les missions et defis" },
  { key: "games", label: "Jeux", description: "Gerer les jeux (roue, chichbich)" },
  { key: "special_days", label: "Jours Speciaux", description: "Gerer les evenements et jours speciaux" },
  { key: "referrals", label: "Parrainages", description: "Gerer le systeme de parrainage" },
  { key: "pos", label: "Caisse", description: "Acces a la caisse/point de vente" },
  { key: "employees", label: "Employes", description: "Gerer les employes et permissions" },
]

// Default permissions by role
export const DEFAULT_PERMISSIONS: Record<EmployeeRole, PermissionKey[]> = {
  super_admin: ALL_PERMISSIONS.map(p => p.key),
  admin: ["dashboard", "articles", "menu", "categories", "suppliers", "batches", "alerts", "clients", "clients_loyalty", "rewards", "missions", "games", "special_days", "referrals", "pos"],
  manager: ["dashboard", "articles", "menu", "batches", "alerts", "clients", "clients_loyalty", "pos"],
  employee: ["dashboard", "pos"],
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
  loyaltyPoints?: number
  loyaltyTier?: LoyaltyTier
  totalSpent?: number
  // Employee specific fields
  employeeRole?: EmployeeRole
  permissions?: PermissionKey[]
}

interface AuthApiUser {
  _id?: string
  id?: string
  email: string
  name: string
  role: UserRole
  createdAt: string
  loyaltyPoints?: number
  loyaltyTier?: "bronze" | "silver" | "gold" | "diamond" | "platinum"
  totalSpent?: number
  employeeRole?: EmployeeRole
  permissions?: PermissionKey[]
}

interface AuthApiResponse {
  token: string
  user: AuthApiUser
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string, referralCode?: string) => Promise<boolean>
  logout: () => void
  addLoyaltyPoints: (points: number, amount: number) => void
  updateUser: (updatedUser: User) => void
  // Employee management
  employees: Employee[]
  addEmployee: (employee: Omit<Employee, "id" | "createdAt" | "updatedAt">) => void
  updateEmployee: (id: string, updates: Partial<Employee>) => void
  deleteEmployee: (id: string) => void
  hasPermission: (permission: PermissionKey) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "")
const AUTH_TOKEN_KEY = "authToken"

// Default super admin account
const defaultSuperAdmin: Employee = {
  id: "super-admin-1",
  email: "superadmin@patisserie.tn",
  password: "superadmin123",
  name: "Super Administrateur",
  role: "super_admin",
  permissions: ALL_PERMISSIONS.map(p => p.key),
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

const predefinedAccounts = [
  {
    id: "admin-1",
    email: "admin@patisserie.tn",
    password: "admin123",
    name: "Administrateur",
    role: "admin" as UserRole,
    createdAt: new Date().toISOString(),
  },
  {
    id: "user-1",
    email: "user@patisserie.tn",
    password: "user123",
    name: "Utilisateur",
    role: "user" as UserRole,
    createdAt: new Date().toISOString(),
  },
  {
    id: "client-1",
    email: "client@test.com",
    password: "client123",
    name: "Client Test",
    role: "client" as UserRole,
    createdAt: new Date().toISOString(),
    loyaltyPoints: 150,
    loyaltyTier: "bronze" as LoyaltyTier,
    totalSpent: 75,
  },
]

function notify(
  addNotification: ReturnType<typeof useNotification>["addNotification"],
  type: "success" | "error" | "warning" | "info",
  title: string,
  message?: string,
) {
  addNotification({
    type,
    title,
    message,
    category: "system",
  })
}

function normalizeUser(apiUser: AuthApiUser): User {
  return {
    id: apiUser.id || apiUser._id || "",
    email: apiUser.email,
    name: apiUser.name,
    role: apiUser.role,
    createdAt: apiUser.createdAt,
    loyaltyPoints: apiUser.loyaltyPoints,
    loyaltyTier: apiUser.loyaltyTier === "diamond" ? "platinum" : apiUser.loyaltyTier,
    totalSpent: apiUser.totalSpent,
    employeeRole: apiUser.employeeRole,
    permissions: apiUser.permissions,
  }
}

async function postAuth<TBody>(path: string, body: TBody): Promise<AuthApiResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMessage =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : "Une erreur est survenue"
    throw new Error(errorMessage)
  }

  return data as AuthApiResponse
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const { addNotification } = useNotification()

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    
    // Load employees
    const storedEmployees = localStorage.getItem("employees")
    if (storedEmployees) {
      setEmployees(JSON.parse(storedEmployees))
    } else {
      // Initialize with default super admin
      const initialEmployees = [defaultSuperAdmin]
      setEmployees(initialEmployees)
      localStorage.setItem("employees", JSON.stringify(initialEmployees))
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { token, user: apiUser } = await postAuth("/auth/login", { email, password })
      const normalizedUser = normalizeUser(apiUser)

      setUser(normalizedUser)
      localStorage.setItem("currentUser", JSON.stringify(normalizedUser))
      localStorage.setItem(AUTH_TOKEN_KEY, token)
      notify(addNotification, "success", "Connexion reussie")
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email ou mot de passe incorrect"
      notify(addNotification, "error", message)
      return false
    }
  }

  const register = async (email: string, password: string, name: string, referralCode?: string): Promise<boolean> => {
    try {
      const { token, user: apiUser } = await postAuth("/auth/register", { email, password, name, referralCode })
      const normalizedUser = normalizeUser(apiUser)

      setUser(normalizedUser)
      localStorage.setItem("currentUser", JSON.stringify(normalizedUser))
      localStorage.setItem(AUTH_TOKEN_KEY, token)
      notify(
        addNotification,
        "success",
        "Compte cree avec succes",
        "Bienvenue dans notre programme de fidelite",
      )
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de creer le compte"
      notify(addNotification, "error", message)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
    localStorage.removeItem(AUTH_TOKEN_KEY)
    notify(addNotification, "success", "Deconnexion reussie")
  }

  const addLoyaltyPoints = (points: number, amount: number) => {
    if (!user || user.role !== "client") return

    const newPoints = (user.loyaltyPoints || 0) + points
    const newTotalSpent = (user.totalSpent || 0) + amount

    let newTier: LoyaltyTier = "bronze"
    if (newTotalSpent >= 1000) newTier = "platinum"
    else if (newTotalSpent >= 500) newTier = "gold"
    else if (newTotalSpent >= 200) newTier = "silver"

    const updatedUser = {
      ...user,
      loyaltyPoints: newPoints,
      loyaltyTier: newTier,
      totalSpent: newTotalSpent,
    }

    setUser(updatedUser)
    localStorage.setItem("currentUser", JSON.stringify(updatedUser))

    const clients = JSON.parse(localStorage.getItem("clients") || "[]")
    const updatedClients = clients.map((c: any) => {
      if (c.id === user.id) {
        return { ...c, loyaltyPoints: newPoints, loyaltyTier: newTier, totalSpent: newTotalSpent }
      }
      return c
    })
    localStorage.setItem("clients", JSON.stringify(updatedClients))

    if (newTier !== user.loyaltyTier) {
      notify(addNotification, "success", `Felicitations! Vous etes passe au niveau ${newTier.toUpperCase()}!`)
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem("currentUser", JSON.stringify(updatedUser))

    if (updatedUser.role === "client") {
      const clients = JSON.parse(localStorage.getItem("clients") || "[]")
      const updatedClients = clients.map((c: any) => {
        if (c.id === updatedUser.id) {
          return { ...c, ...updatedUser }
        }
        return c
      })
      localStorage.setItem("clients", JSON.stringify(updatedClients))
    }
  }

  // Employee management functions
  const addEmployee = (employeeData: Omit<Employee, "id" | "createdAt" | "updatedAt">) => {
    const newEmployee: Employee = {
      ...employeeData,
      id: `emp-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    const updatedEmployees = [...employees, newEmployee]
    setEmployees(updatedEmployees)
    localStorage.setItem("employees", JSON.stringify(updatedEmployees))
    notify(addNotification, "success", `Employe ${newEmployee.name} ajoute avec succes`)
  }

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    const updatedEmployees = employees.map(e => 
      e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
    )
    setEmployees(updatedEmployees)
    localStorage.setItem("employees", JSON.stringify(updatedEmployees))
    
    // Update current user if they updated themselves
    if (user?.id === id) {
      const updatedEmployee = updatedEmployees.find(e => e.id === id)
      if (updatedEmployee) {
        const updatedUser: User = {
          ...user,
          name: updatedEmployee.name,
          email: updatedEmployee.email,
          permissions: updatedEmployee.permissions,
          employeeRole: updatedEmployee.role,
        }
        setUser(updatedUser)
        localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      }
    }
    
    notify(addNotification, "success", "Employe modifie avec succes")
  }

  const deleteEmployee = (id: string) => {
    // Prevent deleting the last super admin
    const superAdmins = employees.filter(e => e.role === "super_admin")
    const employeeToDelete = employees.find(e => e.id === id)
    
    if (employeeToDelete?.role === "super_admin" && superAdmins.length <= 1) {
      notify(addNotification, "error", "Impossible de supprimer le dernier super admin")
      return
    }
    
    const updatedEmployees = employees.filter(e => e.id !== id)
    setEmployees(updatedEmployees)
    localStorage.setItem("employees", JSON.stringify(updatedEmployees))
    notify(addNotification, "success", "Employe supprime avec succes")
  }

  const hasPermission = (permission: PermissionKey): boolean => {
    if (!user) return false
    
    // Old admin accounts have all permissions
    if (user.role === "admin" && !user.employeeRole) return true
    
    // Check employee permissions
    if (user.permissions) {
      return user.permissions.includes(permission)
    }
    
    return false
  }

  return (
    <AuthContext.Provider
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isLoading, 
        login, 
        register, 
        logout, 
        addLoyaltyPoints, 
        updateUser,
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
