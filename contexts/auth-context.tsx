"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useNotification } from "./notification-context"
import { apiPost, apiRequest } from "@/lib/api-client"

export type UserRole = "admin" | "user" | "client"
export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum"
export type EmployeeRole = "super_admin" | "admin" | "manager" | "employee"

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
  name: string
  phone?: string
  role: EmployeeRole
  permissions: PermissionKey[]
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLogin?: string
  password?: string
}

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

export const DEFAULT_PERMISSIONS: Record<EmployeeRole, PermissionKey[]> = {
  super_admin: ALL_PERMISSIONS.map((permission) => permission.key),
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
  updatedAt?: string
  isActive?: boolean
  phone?: string
  lastLogin?: string
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

interface EmployeesApiResponse {
  employees: AuthApiUser[]
}

interface EmployeeApiResponse {
  employee: AuthApiUser
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
  employees: Employee[]
  addEmployee: (employee: Omit<Employee, "id" | "createdAt" | "updatedAt" | "lastLogin">) => Promise<boolean>
  updateEmployee: (id: string, updates: Partial<Employee>) => Promise<boolean>
  deleteEmployee: (id: string) => Promise<boolean>
  hasPermission: (permission: PermissionKey) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const AUTH_TOKEN_KEY = "authToken"

const defaultSuperAdmin: Employee = {
  id: "super-admin-1",
  email: "superadmin@patisserie.tn",
  name: "Super Administrateur",
  role: "super_admin",
  permissions: ALL_PERMISSIONS.map((permission) => permission.key),
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  password: "superadmin123",
}

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

function normalizeEmployee(apiUser: AuthApiUser): Employee {
  return {
    id: apiUser.id || apiUser._id || "",
    email: apiUser.email,
    name: apiUser.name,
    phone: apiUser.phone,
    role: apiUser.employeeRole || "employee",
    permissions: apiUser.permissions || [],
    isActive: apiUser.isActive ?? true,
    createdAt: apiUser.createdAt,
    updatedAt: apiUser.updatedAt || apiUser.createdAt,
    lastLogin: apiUser.lastLogin,
  }
}

async function postAuth<TBody>(path: string, body: TBody): Promise<AuthApiResponse> {
  return apiPost<AuthApiResponse>(path, body, { skipAuth: true })
}

async function fetchWithAuth<T>(path: string, token: string, init?: { method?: string; body?: unknown }): Promise<T> {
  return apiRequest<T>({
    url: path,
    method: init?.method || "GET",
    data: init?.body,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    skipAuth: true,
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [employees, setEmployees] = useState<Employee[]>([])
  const { addNotification } = useNotification()

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      const storedUser = localStorage.getItem("currentUser")
      const token = localStorage.getItem(AUTH_TOKEN_KEY)

      if (storedUser && isMounted) {
        setUser(JSON.parse(storedUser))
      }

      if (!token) {
        const storedEmployees = localStorage.getItem("employees")
        if (storedEmployees && isMounted) {
          setEmployees(JSON.parse(storedEmployees))
        } else if (isMounted) {
          setEmployees([defaultSuperAdmin])
        }
        if (isMounted) {
          setIsLoading(false)
        }
        return
      }

      try {
        const [{ user: apiUser }, employeeResponse] = await Promise.all([
          fetchWithAuth<{ user: AuthApiUser }>("/auth/me", token),
          fetchWithAuth<EmployeesApiResponse>("/auth/employees", token).catch(() => ({ employees: [] })),
        ])

        if (!isMounted) {
          return
        }

        const normalizedUser = normalizeUser(apiUser)
        const normalizedEmployees = employeeResponse.employees.map(normalizeEmployee)

        setUser(normalizedUser)
        setEmployees(normalizedEmployees)
        localStorage.setItem("currentUser", JSON.stringify(normalizedUser))
        localStorage.setItem("employees", JSON.stringify(normalizedEmployees))
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        localStorage.removeItem("currentUser")
        localStorage.removeItem("employees")
        if (isMounted) {
          setUser(null)
          setEmployees([])
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void initializeAuth()

    return () => {
      isMounted = false
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { token, user: apiUser } = await postAuth("/auth/login", { email, password })
      const normalizedUser = normalizeUser(apiUser)

      setUser(normalizedUser)
      localStorage.setItem("currentUser", JSON.stringify(normalizedUser))
      localStorage.setItem(AUTH_TOKEN_KEY, token)

      try {
        const employeeResponse = await fetchWithAuth<EmployeesApiResponse>("/auth/employees", token)
        const normalizedEmployees = employeeResponse.employees.map(normalizeEmployee)
        setEmployees(normalizedEmployees)
        localStorage.setItem("employees", JSON.stringify(normalizedEmployees))
      } catch {
        setEmployees([])
        localStorage.removeItem("employees")
      }

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
      notify(addNotification, "success", "Compte cree avec succes", "Bienvenue dans notre programme de fidelite")
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de creer le compte"
      notify(addNotification, "error", message)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setEmployees([])
    localStorage.removeItem("currentUser")
    localStorage.removeItem("employees")
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
    const updatedClients = clients.map((client: User) => {
      if (client.id === user.id) {
        return { ...client, loyaltyPoints: newPoints, loyaltyTier: newTier, totalSpent: newTotalSpent }
      }
      return client
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
      const updatedClients = clients.map((client: User) => {
        if (client.id === updatedUser.id) {
          return { ...client, ...updatedUser }
        }
        return client
      })
      localStorage.setItem("clients", JSON.stringify(updatedClients))
    }
  }

  const addEmployee = async (employeeData: Omit<Employee, "id" | "createdAt" | "updatedAt" | "lastLogin">): Promise<boolean> => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      notify(addNotification, "error", "Session invalide")
      return false
    }

    try {
      const response = await fetchWithAuth<EmployeeApiResponse>("/auth/employees", token, {
        method: "POST",
        body: {
          name: employeeData.name,
          email: employeeData.email,
          phone: employeeData.phone,
          password: employeeData.password,
          employeeRole: employeeData.role,
          permissions: employeeData.permissions,
          isActive: employeeData.isActive,
        },
      })

      const nextEmployees = [normalizeEmployee(response.employee), ...employees]
      setEmployees(nextEmployees)
      localStorage.setItem("employees", JSON.stringify(nextEmployees))
      notify(addNotification, "success", `Employe ${response.employee.name} ajoute avec succes`)
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible d'ajouter l'employe"
      notify(addNotification, "error", message)
      return false
    }
  }

  const updateEmployee = async (id: string, updates: Partial<Employee>): Promise<boolean> => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      notify(addNotification, "error", "Session invalide")
      return false
    }

    try {
      const response = await fetchWithAuth<EmployeeApiResponse>(`/auth/employees/${id}`, token, {
        method: "PUT",
        body: {
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          password: updates.password,
          employeeRole: updates.role,
          permissions: updates.permissions,
          isActive: updates.isActive,
        },
      })

      const updatedEmployee = normalizeEmployee(response.employee)
      const nextEmployees = employees.map((employee) => (employee.id === id ? updatedEmployee : employee))
      setEmployees(nextEmployees)
      localStorage.setItem("employees", JSON.stringify(nextEmployees))

      if (user?.id === id) {
        const nextUser: User = {
          ...user,
          name: updatedEmployee.name,
          email: updatedEmployee.email,
          employeeRole: updatedEmployee.role,
          permissions: updatedEmployee.permissions,
          role: updatedEmployee.role === "employee" ? "user" : "admin",
        }
        setUser(nextUser)
        localStorage.setItem("currentUser", JSON.stringify(nextUser))
      }

      notify(addNotification, "success", "Employe modifie avec succes")
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de modifier l'employe"
      notify(addNotification, "error", message)
      return false
    }
  }

  const deleteEmployee = async (id: string): Promise<boolean> => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      notify(addNotification, "error", "Session invalide")
      return false
    }

    try {
      await fetchWithAuth<{ success: boolean }>(`/auth/employees/${id}`, token, { method: "DELETE" })

      const nextEmployees = employees.filter((employee) => employee.id !== id)
      setEmployees(nextEmployees)
      localStorage.setItem("employees", JSON.stringify(nextEmployees))
      notify(addNotification, "success", "Employe supprime avec succes")
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de supprimer l'employe"
      notify(addNotification, "error", message)
      return false
    }
  }

  const hasPermission = (permission: PermissionKey): boolean => {
    if (!user) return false
    if (user.role === "admin" && !user.employeeRole) return true
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
