"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// ============================================
// STOCK HIERARCHY: Category > SubCategory > Product > Batch (FIFO)
// ============================================

export interface StorageLocation {
  id: string
  name: string
  type: "refrigerator" | "freezer" | "room" | "shelf" | "other"
  description?: string
  temperature?: string
  capacity?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface StockCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SubCategory {
  id: string
  categoryId: string
  name: string
  slug: string
  description?: string
  icon?: string
  order: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: string
  subCategoryId: string
  name: string
  description?: string
  unit: "kg" | "g" | "L" | "ml" | "pieces" | "sachets" | "boites"
  minQuantity: number
  unitPrice: number
  shelfLifeAfterOpening?: number
  supplierId?: string
  defaultLocationId?: string
  image?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Batch {
  id: string
  productId: string
  supplierId?: string
  locationId?: string
  batchNumber: string
  quantity: number
  unitCost: number
  receptionDate: string
  productionDate?: string
  expirationDate: string
  openingDate?: string
  expirationAfterOpening?: string
  isOpened: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  name: string
  contactName?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

export interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  type: "discount" | "free_item" | "special"
  value: string
  image?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SupplementCategory {
  id: string
  name: string
  color: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Supplement {
  id: string
  name: string
  price: number
  points?: number
  description?: string
  image?: string
  category?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductSupplementConfig {
  supplementId: string
  isEnabled: boolean
  customPrice?: number
}

export interface SelectedSupplement {
  supplement: Supplement
  quantity: number
}

export interface Promotion {
  type: "percentage" | "fixed" | "offer" | "new" | "popular"
  value?: number
  label?: string
  endDate?: string
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  points?: number
  category: string
  recipeId?: string
  image?: string
  allergens: string[]
  isAvailable: boolean
  tags?: string[]
  supplements?: Supplement[]
  availableSupplements?: ProductSupplementConfig[]
  promotion?: Promotion
  createdAt: string
  updatedAt: string
}

export interface MenuCategory {
  id: string
  name: string
  slug: string
  icon?: string
  order: number
  isActive: boolean
}

export interface OfferSchedule {
  daysOfWeek: number[]
  startTime: string
  endTime: string
}

export interface OfferItem {
  itemId: string
  quantity: number
}

export interface Offer {
  id: string
  name: string
  description: string
  image?: string
  originalPrice: number
  discountedPrice: number
  points: number
  items: OfferItem[]
  schedule: OfferSchedule
  isActive: boolean
  validFrom?: string
  validUntil?: string
  maxPerDay?: number
  createdAt: string
  updatedAt: string
}

export interface StockItem {
  id: string
  name: string
  category: string
  quantity: number
  unit: "kg" | "g" | "L" | "ml" | "pieces" | "sachets" | "boites"
  minQuantity: number
  unitPrice: number
  shelfLifeAfterOpening?: number
  supplier?: string
  lastUpdated: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  createdAt: string
  updatedAt: string
}

interface StockContextType {
  stockCategories: StockCategory[]
  subCategories: SubCategory[]
  products: Product[]
  batches: Batch[]
  addStockCategory: (cat: Omit<StockCategory, "id" | "createdAt" | "updatedAt">) => void
  updateStockCategory: (id: string, cat: Partial<StockCategory>) => void
  deleteStockCategory: (id: string) => void
  addSubCategory: (sub: Omit<SubCategory, "id" | "createdAt" | "updatedAt">) => void
  updateSubCategory: (id: string, sub: Partial<SubCategory>) => void
  deleteSubCategory: (id: string) => void
  getSubCategoriesByCategoryId: (categoryId: string) => SubCategory[]
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void
  getProductsBySubCategoryId: (subCategoryId: string) => Product[]
  getProductStock: (productId: string) => number
  addBatch: (batch: Omit<Batch, "id" | "createdAt" | "updatedAt">) => void
  updateBatch: (id: string, batch: Partial<Batch>) => void
  deleteBatch: (id: string) => void
  openBatch: (id: string, openingDate: string) => void
  getBatchesByProduct: (productId: string) => Batch[]
  getActiveBatches: (productId: string) => Batch[]
  consumeFromBatches: (productId: string, quantity: number) => void
  storageLocations: StorageLocation[]
  addStorageLocation: (location: Omit<StorageLocation, "id" | "createdAt" | "updatedAt">) => void
  updateStorageLocation: (id: string, location: Partial<StorageLocation>) => void
  deleteStorageLocation: (id: string) => void
  getActiveStorageLocations: () => StorageLocation[]
  getExpiringSoonBatches: () => Array<Batch & { productName: string; daysLeft: number }>
  getLowStockProducts: () => Array<Product & { currentStock: number; categoryName: string; subCategoryName: string }>
  items: StockItem[]
  categories: Category[]
  suppliers: Supplier[]
  addItem: (item: Omit<StockItem, "id" | "lastUpdated">) => void
  updateItem: (id: string, item: Partial<StockItem>) => void
  deleteItem: (id: string) => void
  addCategory: (category: Omit<Category, "id" | "createdAt" | "updatedAt">) => void
  updateCategory: (id: string, category: Partial<Omit<Category, "id" | "createdAt">>) => void
  deleteCategory: (id: string) => void
  addSupplier: (supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => void
  updateSupplier: (id: string, supplier: Partial<Omit<Supplier, "id" | "createdAt">>) => void
  deleteSupplier: (id: string) => void
  getLowStockItems: () => StockItem[]
  getArchivedBatches: (productId: string) => Batch[]
  menuCategories: MenuCategory[]
  menuItems: MenuItem[]
  addMenuCategory: (category: Omit<MenuCategory, "id">) => void
  updateMenuCategory: (id: string, category: Partial<MenuCategory>) => void
  deleteMenuCategory: (id: string) => void
  addMenuItem: (item: Omit<MenuItem, "id" | "createdAt" | "updatedAt">) => void
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void
  deleteMenuItem: (id: string) => void
  rewards: Reward[]
  addReward: (reward: Omit<Reward, "id" | "createdAt" | "updatedAt">) => void
  updateReward: (id: string, reward: Partial<Reward>) => void
  deleteReward: (id: string) => void
  getActiveRewards: () => Reward[]
  supplements: Supplement[]
  addSupplement: (supplement: Omit<Supplement, "id" | "createdAt" | "updatedAt">) => void
  updateSupplement: (id: string, supplement: Partial<Supplement>) => void
  deleteSupplement: (id: string) => void
  getActiveSupplements: () => Supplement[]
  getSupplementsForProduct: (productSupplements: ProductSupplementConfig[]) => Supplement[]
  supplementCategories: SupplementCategory[]
  addSupplementCategory: (category: Omit<SupplementCategory, "id" | "createdAt" | "updatedAt">) => void
  updateSupplementCategory: (id: string, category: Partial<SupplementCategory>) => void
  deleteSupplementCategory: (id: string) => void
  getActiveSupplementCategories: () => SupplementCategory[]
  offers: Offer[]
  addOffer: (offer: Omit<Offer, "id" | "createdAt" | "updatedAt">) => void
  updateOffer: (id: string, offer: Partial<Offer>) => void
  deleteOffer: (id: string) => void
  getActiveOffers: () => Offer[]
  getCurrentOffers: () => Offer[]
}

const StockContext = createContext<StockContextType | undefined>(undefined)

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/$/, "")
const AUTH_TOKEN_KEY = "authToken"

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init)
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
      ? payload.error
      : "Une erreur est survenue"
    throw new Error(error)
  }

  if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
    return payload.data as T
  }

  return payload as T
}

function getAuthHeaders() {
  if (typeof window === "undefined") return { "Content-Type": "application/json" }
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// API functions for supplements
async function fetchSupplements(): Promise<Supplement[]> {
  try {
    const data = await fetchJson<Supplement[]>('/menu/supplements/all', {
      headers: getAuthHeaders(),
    })
    return data.map(s => ({
      ...s,
      id: (s as any)._id || s.id,
      createdAt: s.createdAt || new Date().toISOString(),
      updatedAt: s.updatedAt || new Date().toISOString(),
    }))
  } catch (error) {
    console.error('Failed to fetch supplements:', error)
    return []
  }
}

async function fetchSupplementCategories(): Promise<SupplementCategory[]> {
  try {
    const data = await fetchJson<SupplementCategory[]>('/menu/supplement-categories', {
      headers: getAuthHeaders(),
    })
    return data.map(c => ({
      ...c,
      id: (c as any)._id || c.id,
      createdAt: c.createdAt || new Date().toISOString(),
      updatedAt: c.updatedAt || new Date().toISOString(),
    }))
  } catch (error) {
    console.error('Failed to fetch supplement categories:', error)
    return []
  }
}

async function createSupplementAPI(data: Omit<Supplement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplement> {
  const result = await fetchJson<Supplement>('/menu/supplements', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  return {
    ...result,
    id: (result as any)._id || result.id,
    createdAt: result.createdAt || new Date().toISOString(),
    updatedAt: result.updatedAt || new Date().toISOString(),
  }
}

async function updateSupplementAPI(id: string, data: Partial<Supplement>): Promise<void> {
  await fetchJson(`/menu/supplements/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
}

async function deleteSupplementAPI(id: string): Promise<void> {
  await fetchJson(`/menu/supplements/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
}

async function createSupplementCategoryAPI(data: Omit<SupplementCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupplementCategory> {
  const result = await fetchJson<SupplementCategory>('/menu/supplement-categories', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  return {
    ...result,
    id: (result as any)._id || result.id,
    createdAt: result.createdAt || new Date().toISOString(),
    updatedAt: result.updatedAt || new Date().toISOString(),
  }
}

async function updateSupplementCategoryAPI(id: string, data: Partial<SupplementCategory>): Promise<void> {
  await fetchJson(`/menu/supplement-categories/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
}

async function deleteSupplementCategoryAPI(id: string): Promise<void> {
  await fetchJson(`/menu/supplement-categories/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
}

// Initial data
const initialStockCategories: StockCategory[] = [
  {
    id: "cat-1",
    name: "Patisserie",
    slug: "patisserie",
    description: "Ingredients et produits pour la patisserie",
    icon: "🎂",
    color: "#f59e0b",
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-2",
    name: "Cafe",
    slug: "cafe",
    description: "Produits pour le cafe et boissons chaudes",
    icon: "☕",
    color: "#78350f",
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cat-3",
    name: "Restaurant",
    slug: "restaurant",
    description: "Ingredients pour la cuisine du restaurant",
    icon: "🍽️",
    color: "#dc2626",
    order: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const initialSubCategories: SubCategory[] = [
  { id: "sub-1", categoryId: "cat-1", name: "Chocolat", slug: "chocolat", description: "Chocolats et couvertures", icon: "🍫", order: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sub-2", categoryId: "cat-1", name: "Arome", slug: "arome", description: "Aromes et extraits naturels", icon: "🌿", order: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sub-3", categoryId: "cat-1", name: "Puree", slug: "puree", description: "Purees de fruits", icon: "🍓", order: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sub-4", categoryId: "cat-1", name: "Farine", slug: "farine", description: "Farines et poudres", icon: "🌾", order: 4, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sub-5", categoryId: "cat-1", name: "Produits Laitiers", slug: "produits-laitiers", description: "Lait, creme, beurre", icon: "🥛", order: 5, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sub-6", categoryId: "cat-2", name: "Cafe", slug: "cafe-grains", description: "Cafe en grains et moulu", icon: "☕", order: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sub-7", categoryId: "cat-2", name: "The", slug: "the", description: "Thes et infusions", icon: "🍵", order: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sub-8", categoryId: "cat-2", name: "Sirops", slug: "sirops", description: "Sirops pour boissons", icon: "🍯", order: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sub-9", categoryId: "cat-3", name: "Huile", slug: "huile", description: "Huiles de cuisine", icon: "🫒", order: 1, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sub-10", categoryId: "cat-3", name: "Epices", slug: "epices", description: "Epices et condiments", icon: "🌶️", order: 2, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sub-11", categoryId: "cat-3", name: "Conserves", slug: "conserves", description: "Conserves et bocaux", icon: "🥫", order: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const initialStorageLocations: StorageLocation[] = [
  { id: "loc-1", name: "Refrigerateur 1", type: "refrigerator", description: "Refrigerateur principal pour produits laitiers", temperature: "2-4°C", capacity: "500L", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "loc-2", name: "Refrigerateur 2", type: "refrigerator", description: "Refrigerateur secondaire pour fruits et legumes", temperature: "4-6°C", capacity: "400L", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "loc-3", name: "Congelateur", type: "freezer", description: "Congelateur pour produits surgeles", temperature: "-18°C", capacity: "300L", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "loc-4", name: "Chambre Froide", type: "room", description: "Chambre froide positive", temperature: "0-4°C", capacity: "2000L", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "loc-5", name: "Chambre de Stock 1", type: "room", description: "Stock sec - farines et sucres", temperature: "Ambiante", capacity: "Grande", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "loc-6", name: "Chambre de Stock 2", type: "room", description: "Stock sec - conserves et emballages", temperature: "Ambiante", capacity: "Grande", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "loc-7", name: "Etagere Aromes", type: "shelf", description: "Etagere pour aromes et extraits", temperature: "Ambiante", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const initialProducts: Product[] = [
  { id: "prod-1", subCategoryId: "sub-1", name: "Chocolat Blanc", description: "Chocolat blanc de couverture 35%", unit: "kg", minQuantity: 5, unitPrice: 25.0, shelfLifeAfterOpening: 180, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-2", subCategoryId: "sub-1", name: "Chocolat Noir 70%", description: "Chocolat noir de couverture 70% cacao", unit: "kg", minQuantity: 5, unitPrice: 28.5, shelfLifeAfterOpening: 180, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-3", subCategoryId: "sub-1", name: "Chocolat au Lait", description: "Chocolat au lait de couverture 40%", unit: "kg", minQuantity: 5, unitPrice: 24.0, shelfLifeAfterOpening: 180, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-4", subCategoryId: "sub-2", name: "Arome Caramel", description: "Arome naturel caramel concentre", unit: "L", minQuantity: 2, unitPrice: 35.0, shelfLifeAfterOpening: 365, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-5", subCategoryId: "sub-2", name: "Extrait de Vanille", description: "Extrait de vanille de Madagascar", unit: "L", minQuantity: 1, unitPrice: 85.0, shelfLifeAfterOpening: 365, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-6", subCategoryId: "sub-2", name: "Arome Fraise", description: "Arome naturel fraise", unit: "L", minQuantity: 2, unitPrice: 32.0, shelfLifeAfterOpening: 365, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-7", subCategoryId: "sub-6", name: "Cafe Poudre Arabica", description: "Cafe moulu 100% Arabica", unit: "kg", minQuantity: 3, unitPrice: 18.0, shelfLifeAfterOpening: 30, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-8", subCategoryId: "sub-6", name: "Cafe Grains Premium", description: "Cafe en grains torrefaction artisanale", unit: "kg", minQuantity: 5, unitPrice: 22.0, shelfLifeAfterOpening: 60, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-9", subCategoryId: "sub-9", name: "Huile Olive Extra Vierge", description: "Huile d'olive extra vierge premiere pression", unit: "L", minQuantity: 10, unitPrice: 12.0, shelfLifeAfterOpening: 180, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-10", subCategoryId: "sub-9", name: "Huile Tournesol", description: "Huile de tournesol pour friture", unit: "L", minQuantity: 20, unitPrice: 3.5, shelfLifeAfterOpening: 90, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-11", subCategoryId: "sub-5", name: "Beurre AOP", description: "Beurre doux AOP 82% MG", unit: "kg", minQuantity: 10, unitPrice: 12.5, shelfLifeAfterOpening: 7, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "prod-12", subCategoryId: "sub-5", name: "Creme Liquide 35%", description: "Creme liquide UHT 35% MG", unit: "L", minQuantity: 5, unitPrice: 3.5, shelfLifeAfterOpening: 3, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const initialBatches: Batch[] = [
  { id: "batch-1", productId: "prod-1", batchNumber: "CHB-2026-001", quantity: 10, unitCost: 22.0, receptionDate: "2026-01-15", productionDate: "2026-01-10", expirationDate: "2026-07-15", isOpened: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "batch-2", productId: "prod-1", batchNumber: "CHB-2026-002", quantity: 5, unitCost: 23.0, receptionDate: "2026-02-01", productionDate: "2026-01-25", expirationDate: "2026-08-01", isOpened: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "batch-3", productId: "prod-2", batchNumber: "CHN-2026-001", quantity: 8, unitCost: 26.0, receptionDate: "2026-01-10", productionDate: "2026-01-05", expirationDate: "2026-07-10", isOpened: true, openingDate: "2026-01-20", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "batch-4", productId: "prod-7", batchNumber: "CAF-2026-001", quantity: 5, unitCost: 16.0, receptionDate: "2026-03-01", productionDate: "2026-02-20", expirationDate: "2026-08-20", isOpened: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "batch-5", productId: "prod-11", batchNumber: "BEU-2026-001", quantity: 15, unitCost: 11.5, receptionDate: "2026-03-20", productionDate: "2026-03-18", expirationDate: "2026-04-10", isOpened: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "batch-6", productId: "prod-12", batchNumber: "CRE-2026-001", quantity: 8, unitCost: 3.2, receptionDate: "2026-03-22", productionDate: "2026-03-20", expirationDate: "2026-04-05", isOpened: true, openingDate: "2026-03-23", expirationAfterOpening: "2026-03-26", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const initialLegacyCategories: Category[] = [
  { id: "1", name: "Farines", slug: "farines", icon: "🌾", color: "#f59e0b", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "2", name: "Sucres", slug: "sucres", icon: "🍬", color: "#ec4899", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const initialLegacyItems: StockItem[] = []

const initialSuppliers: Supplier[] = [
  { id: "sup-1", name: "Valrhona", contactName: "Sophie Martin", email: "pro@valrhona.com", phone: "+33 4 75 56 20 00", address: "26600 Tain-l'Hermitage", notes: "Chocolats de haute qualite", status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sup-2", name: "Lavazza", contactName: "Marco Rossi", email: "contact@lavazza.com", phone: "+39 011 2398 111", notes: "Fournisseur cafe premium", status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sup-3", name: "Isigny Sainte-Mere", contactName: "Jean Bernard", email: "contact@isigny.com", phone: "+33 2 31 51 33 00", notes: "Produits laitiers AOP", status: "active", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const initialRewards: Reward[] = [
  { id: "r1", name: "Croissant Gratuit", description: "Un croissant artisanal offert", pointsCost: 50, type: "free_item", value: "1 croissant", image: "/golden-croissant.png", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "r2", name: "Reduction 5 TND", description: "5 TND de reduction sur votre prochaine commande", pointsCost: 100, type: "discount", value: "5 TND", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const initialMenuCategories: MenuCategory[] = [
  { id: "0", name: "Petit dejeuner", slug: "petit-dejeuner", icon: "🍳", order: 0, isActive: true },
  { id: "1", name: "Viennoiseries", slug: "viennoiseries", icon: "🥐", order: 1, isActive: true },
  { id: "2", name: "Patisseries", slug: "patisseries", icon: "🎂", order: 2, isActive: true },
  { id: "3", name: "Specialites Tunisiennes", slug: "specialites-tunisiennes", icon: "⭐", order: 3, isActive: true },
  { id: "4", name: "Thes & Infusions", slug: "thes-infusions", icon: "☕", order: 4, isActive: true },
  { id: "5", name: "Boissons", slug: "boissons", icon: "🥤", order: 5, isActive: true },
]

const initialMenuItems: MenuItem[] = [
  { id: "0", name: "Petit Dejeuner Gourmand pour 2", description: "Assortiment complet pour deux personnes", price: 32.0, points: 32, category: "petit-dejeuner", image: "/placeholder.svg", allergens: ["Gluten", "Lait", "Oeufs"], isAvailable: true, tags: ["Pour 2 personnes", "Complet"], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "1", name: "Croissant Artisanal", description: "Croissant pur beurre croustillant et fondant", price: 4.5, points: 5, category: "viennoiseries", image: "/placeholder.svg", allergens: ["Gluten", "Lait"], isAvailable: true, availableSupplements: [{ supplementId: "sup-16", isEnabled: true }, { supplementId: "sup-17", isEnabled: true }, { supplementId: "sup-18", isEnabled: true }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "2", name: "Pain au Chocolat", description: "Viennoiserie pur beurre garnie de chocolat noir", price: 5.5, points: 6, category: "viennoiseries", image: "/placeholder.svg", allergens: ["Gluten", "Lait"], isAvailable: true, availableSupplements: [{ supplementId: "sup-16", isEnabled: true }, { supplementId: "sup-9", isEnabled: true }], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const initialSupplementCategories: SupplementCategory[] = []

const initialSupplements: Supplement[] = []

const initialOffers: Offer[] = []

const DATA_VERSION = "v2.0"

export function StockProvider({ children }: { children: ReactNode }) {
  const [stockCategories, setStockCategories] = useState<StockCategory[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([])
  const [items, setItems] = useState<StockItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([])
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [supplementCategories, setSupplementCategories] = useState<SupplementCategory[]>([])
  const [offers, setOffers] = useState<Offer[]>([])

  // Load data from API and localStorage
  useEffect(() => {
    let cancelled = false

    const loadData = async () => {
      try {
        const hasToken = !!localStorage.getItem(AUTH_TOKEN_KEY)
        
        if (hasToken) {
          // Load supplement categories from API
          const apiSupplementCategories = await fetchSupplementCategories()
          if (!cancelled && apiSupplementCategories.length > 0) {
            setSupplementCategories(apiSupplementCategories)
          } else if (!cancelled && apiSupplementCategories.length === 0) {
            setSupplementCategories(initialSupplementCategories)
          }

          // Load supplements from API
          const apiSupplements = await fetchSupplements()
          if (!cancelled && apiSupplements.length > 0) {
            setSupplements(apiSupplements)
          } else if (!cancelled && apiSupplements.length === 0) {
            setSupplements(initialSupplements)
          }
        } else {
          setSupplementCategories(initialSupplementCategories)
          setSupplements(initialSupplements)
        }

        // Load other data from localStorage
        const storedVersion = localStorage.getItem("pastry-data-version")
        if (storedVersion !== DATA_VERSION) {
          localStorage.removeItem("pastry-menu-items")
          localStorage.removeItem("pastry-menu-categories")
          localStorage.removeItem("pastry-offers")
          localStorage.setItem("pastry-data-version", DATA_VERSION)
        }

        const stored = {
          stockCategories: localStorage.getItem("stock-categories"),
          subCategories: localStorage.getItem("sub-categories"),
          products: localStorage.getItem("stock-products"),
          batches: localStorage.getItem("stock-batches"),
          storageLocations: localStorage.getItem("storage-locations"),
          items: localStorage.getItem("pastry-stock"),
          categories: localStorage.getItem("pastry-categories"),
          suppliers: localStorage.getItem("pastry-suppliers"),
          rewards: localStorage.getItem("pastry-rewards"),
          menuItems: localStorage.getItem("pastry-menu-items"),
          menuCategories: localStorage.getItem("pastry-menu-categories"),
          offers: localStorage.getItem("pastry-offers"),
        }

        if (!cancelled) {
          setStockCategories(stored.stockCategories ? JSON.parse(stored.stockCategories) : initialStockCategories)
          setSubCategories(stored.subCategories ? JSON.parse(stored.subCategories) : initialSubCategories)
          setProducts(stored.products ? JSON.parse(stored.products) : initialProducts)
          setBatches(stored.batches ? JSON.parse(stored.batches) : initialBatches)
          setStorageLocations(stored.storageLocations ? JSON.parse(stored.storageLocations) : initialStorageLocations)
          setItems(stored.items ? JSON.parse(stored.items) : initialLegacyItems)
          setCategories(stored.categories ? JSON.parse(stored.categories) : initialLegacyCategories)
          setSuppliers(stored.suppliers ? JSON.parse(stored.suppliers) : initialSuppliers)
          setRewards(stored.rewards ? JSON.parse(stored.rewards) : initialRewards)
          setMenuItems(stored.menuItems ? JSON.parse(stored.menuItems) : initialMenuItems)
          setMenuCategories(stored.menuCategories ? JSON.parse(stored.menuCategories) : initialMenuCategories)
          setOffers(stored.offers ? JSON.parse(stored.offers) : initialOffers)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
        if (!cancelled) {
          setSupplementCategories(initialSupplementCategories)
          setSupplements(initialSupplements)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [])

  // Save to localStorage
  useEffect(() => { if (stockCategories.length) localStorage.setItem("stock-categories", JSON.stringify(stockCategories)) }, [stockCategories])
  useEffect(() => { if (subCategories.length) localStorage.setItem("sub-categories", JSON.stringify(subCategories)) }, [subCategories])
  useEffect(() => { if (products.length) localStorage.setItem("stock-products", JSON.stringify(products)) }, [products])
  useEffect(() => { localStorage.setItem("stock-batches", JSON.stringify(batches)) }, [batches])
  useEffect(() => { if (storageLocations.length) localStorage.setItem("storage-locations", JSON.stringify(storageLocations)) }, [storageLocations])
  useEffect(() => { localStorage.setItem("pastry-stock", JSON.stringify(items)) }, [items])
  useEffect(() => { localStorage.setItem("pastry-categories", JSON.stringify(categories)) }, [categories])
  useEffect(() => { localStorage.setItem("pastry-suppliers", JSON.stringify(suppliers)) }, [suppliers])
  useEffect(() => { localStorage.setItem("pastry-rewards", JSON.stringify(rewards)) }, [rewards])
  useEffect(() => { localStorage.setItem("pastry-menu-items", JSON.stringify(menuItems)) }, [menuItems])
  useEffect(() => { localStorage.setItem("pastry-menu-categories", JSON.stringify(menuCategories)) }, [menuCategories])
  useEffect(() => { if (offers.length) localStorage.setItem("pastry-offers", JSON.stringify(offers)) }, [offers])

  // Stock Category CRUD
  const addStockCategory = (cat: Omit<StockCategory, "id" | "createdAt" | "updatedAt">) => {
    const newCat: StockCategory = {
      ...cat,
      id: `cat-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setStockCategories(prev => [...prev, newCat])
  }

  const updateStockCategory = (id: string, updates: Partial<StockCategory>) => {
    setStockCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates, updatedAt: new Date().toISOString() } : cat))
  }

  const deleteStockCategory = (id: string) => {
    const subs = subCategories.filter(s => s.categoryId === id)
    subs.forEach(sub => deleteSubCategory(sub.id))
    setStockCategories(prev => prev.filter(cat => cat.id !== id))
  }

  // SubCategory CRUD
  const addSubCategory = (sub: Omit<SubCategory, "id" | "createdAt" | "updatedAt">) => {
    const newSub: SubCategory = {
      ...sub,
      id: `sub-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setSubCategories(prev => [...prev, newSub])
  }

  const updateSubCategory = (id: string, updates: Partial<SubCategory>) => {
    setSubCategories(prev => prev.map(sub => sub.id === id ? { ...sub, ...updates, updatedAt: new Date().toISOString() } : sub))
  }

  const deleteSubCategory = (id: string) => {
    const prods = products.filter(p => p.subCategoryId === id)
    prods.forEach(prod => deleteProduct(prod.id))
    setSubCategories(prev => prev.filter(sub => sub.id !== id))
  }

  const getSubCategoriesByCategoryId = (categoryId: string) => {
    return subCategories.filter(s => s.categoryId === categoryId).sort((a, b) => a.order - b.order)
  }

  // Product CRUD
  const addProduct = (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setProducts(prev => [...prev, newProduct])
  }

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(prod => prod.id === id ? { ...prod, ...updates, updatedAt: new Date().toISOString() } : prod))
  }

  const deleteProduct = (id: string) => {
    setBatches(prev => prev.filter(b => b.productId !== id))
    setProducts(prev => prev.filter(prod => prod.id !== id))
  }

  const getProductsBySubCategoryId = (subCategoryId: string) => {
    return products.filter(p => p.subCategoryId === subCategoryId)
  }

  const getProductStock = (productId: string) => {
    return batches.filter(b => b.productId === productId).reduce((sum, b) => sum + b.quantity, 0)
  }

  // Storage Location CRUD
  const addStorageLocation = (loc: Omit<StorageLocation, "id" | "createdAt" | "updatedAt">) => {
    const newLoc: StorageLocation = {
      ...loc,
      id: `loc-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setStorageLocations(prev => [...prev, newLoc])
  }

  const updateStorageLocation = (id: string, updates: Partial<StorageLocation>) => {
    setStorageLocations(prev => prev.map(loc => loc.id === id ? { ...loc, ...updates, updatedAt: new Date().toISOString() } : loc))
  }

  const deleteStorageLocation = (id: string) => {
    setStorageLocations(prev => prev.filter(loc => loc.id !== id))
  }

  const getActiveStorageLocations = () => {
    return storageLocations.filter(loc => loc.isActive)
  }

  // Batch CRUD
  const addBatch = (batch: Omit<Batch, "id" | "createdAt" | "updatedAt">) => {
    const newBatch: Batch = {
      ...batch,
      id: `batch-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setBatches(prev => [...prev, newBatch])
  }

  const updateBatch = (id: string, updates: Partial<Batch>) => {
    setBatches(prev => prev.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b))
  }

  const deleteBatch = (id: string) => {
    setBatches(prev => prev.filter(b => b.id !== id))
  }

  const openBatch = (id: string, openingDate: string) => {
    const batch = batches.find(b => b.id === id)
    if (!batch) return

    const product = products.find(p => p.id === batch.productId)
    if (!product?.shelfLifeAfterOpening) {
      updateBatch(id, { isOpened: true, openingDate })
      return
    }

    const expDate = new Date(openingDate)
    expDate.setDate(expDate.getDate() + product.shelfLifeAfterOpening)

    updateBatch(id, {
      isOpened: true,
      openingDate,
      expirationAfterOpening: expDate.toISOString().split("T")[0],
    })
  }

  const getBatchesByProduct = (productId: string) => {
    return batches.filter(b => b.productId === productId).sort((a, b) => new Date(a.receptionDate).getTime() - new Date(b.receptionDate).getTime())
  }

  const getActiveBatches = (productId: string) => {
    return batches.filter(b => b.productId === productId && b.quantity > 0).sort((a, b) => new Date(a.receptionDate).getTime() - new Date(b.receptionDate).getTime())
  }

  const getArchivedBatches = (productId: string) => {
    return batches.filter(b => b.productId === productId && b.isOpened).sort((a, b) => new Date(a.openingDate || "").getTime() - new Date(b.openingDate || "").getTime())
  }

  const consumeFromBatches = (productId: string, quantity: number) => {
    const activeBatches = getActiveBatches(productId)
    let remaining = quantity

    for (const batch of activeBatches) {
      if (remaining <= 0) break

      if (batch.quantity >= remaining) {
        updateBatch(batch.id, { quantity: batch.quantity - remaining })
        remaining = 0
      } else {
        remaining -= batch.quantity
        updateBatch(batch.id, { quantity: 0 })
      }
    }
  }

  // Alerts
  const getExpiringSoonBatches = () => {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const today = new Date()

    return batches.filter(batch => {
      const expDate = batch.isOpened && batch.expirationAfterOpening
        ? new Date(batch.expirationAfterOpening)
        : new Date(batch.expirationDate)
      return expDate <= thirtyDaysFromNow && expDate >= today && batch.quantity > 0
    }).map(batch => {
      const expDate = batch.isOpened && batch.expirationAfterOpening
        ? new Date(batch.expirationAfterOpening)
        : new Date(batch.expirationDate)
      const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      const product = products.find(p => p.id === batch.productId)
      return { ...batch, productName: product?.name || "", daysLeft }
    }).sort((a, b) => a.daysLeft - b.daysLeft)
  }

  const getLowStockProducts = () => {
    return products.filter(product => {
      const stock = getProductStock(product.id)
      return stock <= product.minQuantity && product.isActive
    }).map(product => {
      const subCat = subCategories.find(s => s.id === product.subCategoryId)
      const cat = stockCategories.find(c => c.id === subCat?.categoryId)
      return {
        ...product,
        currentStock: getProductStock(product.id),
        categoryName: cat?.name || "",
        subCategoryName: subCat?.name || "",
      }
    })
  }

  // Legacy CRUD
  const addItem = (item: Omit<StockItem, "id" | "lastUpdated">) => {
    const newItem: StockItem = { ...item, id: Date.now().toString(), lastUpdated: new Date().toISOString() }
    setItems(prev => [...prev, newItem])
  }

  const updateItem = (id: string, updates: Partial<StockItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates, lastUpdated: new Date().toISOString() } : item))
  }

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const addCategory = (category: Omit<Category, "id" | "createdAt" | "updatedAt">) => {
    const newCat: Category = { ...category, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setCategories(prev => [...prev, newCat])
  }

  const updateCategory = (id: string, updates: Partial<Omit<Category, "id" | "createdAt">>) => {
    setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates, updatedAt: new Date().toISOString() } : cat))
  }

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id))
  }

  const addSupplier = (supplier: Omit<Supplier, "id" | "createdAt" | "updatedAt">) => {
    const newSup: Supplier = { ...supplier, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setSuppliers(prev => [...prev, newSup])
  }

  const updateSupplier = (id: string, updates: Partial<Omit<Supplier, "id" | "createdAt">>) => {
    setSuppliers(prev => prev.map(sup => sup.id === id ? { ...sup, ...updates, updatedAt: new Date().toISOString() } : sup))
  }

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(sup => sup.id !== id))
  }

  const getLowStockItems = () => items.filter(item => item.quantity <= item.minQuantity)

  // Menu CRUD
  const addMenuCategory = (category: Omit<MenuCategory, "id">) => {
    const newCat: MenuCategory = { ...category, id: Date.now().toString() }
    setMenuCategories(prev => [...prev, newCat])
  }

  const updateMenuCategory = (id: string, updates: Partial<MenuCategory>) => {
    setMenuCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat))
  }

  const deleteMenuCategory = (id: string) => {
    setMenuCategories(prev => prev.filter(cat => cat.id !== id))
  }

  const addMenuItem = (item: Omit<MenuItem, "id" | "createdAt" | "updatedAt">) => {
    const newItem: MenuItem = { ...item, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setMenuItems(prev => [...prev, newItem])
  }

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems(prev => prev.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
  }

  const deleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id))
  }

  // Rewards CRUD
  const addReward = (reward: Omit<Reward, "id" | "createdAt" | "updatedAt">) => {
    const newReward: Reward = { ...reward, id: `r${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setRewards(prev => [...prev, newReward])
  }

  const updateReward = (id: string, updates: Partial<Reward>) => {
    setRewards(prev => prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r))
  }

  const deleteReward = (id: string) => {
    setRewards(prev => prev.filter(r => r.id !== id))
  }

  const getActiveRewards = () => rewards.filter(r => r.isActive)

  // Supplements CRUD with API
  const addSupplement = async (supplement: Omit<Supplement, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newSupplement = await createSupplementAPI(supplement)
      setSupplements(prev => [...prev, newSupplement])
    } catch (error) {
      console.error("Failed to create supplement:", error)
      const newSupplement: Supplement = {
        ...supplement,
        id: `sup-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setSupplements(prev => [...prev, newSupplement])
    }
  }

  const updateSupplement = async (id: string, updates: Partial<Supplement>) => {
    try {
      await updateSupplementAPI(id, updates)
      setSupplements(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
    } catch (error) {
      console.error("Failed to update supplement:", error)
      setSupplements(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
    }
  }

  const deleteSupplement = async (id: string) => {
    try {
      await deleteSupplementAPI(id)
      setSupplements(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error("Failed to delete supplement:", error)
      setSupplements(prev => prev.filter(s => s.id !== id))
    }
  }

  const getActiveSupplements = () => supplements.filter(s => s.isActive)

  const getSupplementsForProduct = (productSupplements: ProductSupplementConfig[]) => {
    if (!productSupplements) return []
    return productSupplements.filter(ps => ps.isEnabled).map(ps => {
      const supplement = supplements.find(s => s.id === ps.supplementId && s.isActive)
      if (!supplement) return null
      return ps.customPrice !== undefined ? { ...supplement, price: ps.customPrice } : supplement
    }).filter((s): s is Supplement => s !== null)
  }

  // Supplement Categories CRUD with API
  const addSupplementCategory = async (category: Omit<SupplementCategory, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newCategory = await createSupplementCategoryAPI(category)
      setSupplementCategories(prev => [...prev, newCategory])
    } catch (error) {
      console.error("Failed to create supplement category:", error)
      const newCategory: SupplementCategory = {
        ...category,
        id: `supcat-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setSupplementCategories(prev => [...prev, newCategory])
    }
  }

  const updateSupplementCategory = async (id: string, updates: Partial<SupplementCategory>) => {
    try {
      await updateSupplementCategoryAPI(id, updates)
      setSupplementCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    } catch (error) {
      console.error("Failed to update supplement category:", error)
      setSupplementCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    }
  }

  const deleteSupplementCategory = async (id: string) => {
    const inUse = supplements.some(s => s.category === id)
    if (inUse) {
      console.warn(`Cannot delete category ${id}: still in use by supplements`)
      return
    }

    try {
      await deleteSupplementCategoryAPI(id)
      setSupplementCategories(prev => prev.filter(c => c.id !== id))
    } catch (error) {
      console.error("Failed to delete supplement category:", error)
      if (!(error instanceof Error && error.message.includes('utilisent'))) {
        setSupplementCategories(prev => prev.filter(c => c.id !== id))
      }
    }
  }

  const getActiveSupplementCategories = () => supplementCategories.filter(c => c.isActive)

  // Offers CRUD
  const addOffer = (offer: Omit<Offer, "id" | "createdAt" | "updatedAt">) => {
    const newOffer: Offer = {
      ...offer,
      id: `offer-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setOffers(prev => [...prev, newOffer])
  }

  const updateOffer = (id: string, updates: Partial<Offer>) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o))
  }

  const deleteOffer = (id: string) => {
    setOffers(prev => prev.filter(o => o.id !== id))
  }

  const getActiveOffers = () => offers.filter(o => o.isActive)

  const getCurrentOffers = () => {
    const now = new Date()
    const currentDay = now.getDay()
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    return offers.filter(offer => {
      if (!offer.isActive) return false
      if (!offer.schedule.daysOfWeek.includes(currentDay)) return false
      const { startTime, endTime } = offer.schedule
      if (currentTime < startTime || currentTime > endTime) return false
      if (offer.validFrom && new Date(offer.validFrom) > now) return false
      if (offer.validUntil && new Date(offer.validUntil) < now) return false
      return true
    })
  }

  return (
    <StockContext.Provider
      value={{
        stockCategories,
        subCategories,
        products,
        batches,
        addStockCategory,
        updateStockCategory,
        deleteStockCategory,
        addSubCategory,
        updateSubCategory,
        deleteSubCategory,
        getSubCategoriesByCategoryId,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductsBySubCategoryId,
        getProductStock,
        addBatch,
        updateBatch,
        deleteBatch,
        openBatch,
        getBatchesByProduct,
        getActiveBatches,
        consumeFromBatches,
        getExpiringSoonBatches,
        getLowStockProducts,
        storageLocations,
        addStorageLocation,
        updateStorageLocation,
        deleteStorageLocation,
        getActiveStorageLocations,
        items,
        categories,
        suppliers,
        addItem,
        updateItem,
        deleteItem,
        addCategory,
        updateCategory,
        deleteCategory,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        getLowStockItems,
        getArchivedBatches,
        menuCategories,
        menuItems,
        addMenuCategory,
        updateMenuCategory,
        deleteMenuCategory,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        rewards,
        addReward,
        updateReward,
        deleteReward,
        getActiveRewards,
        supplements,
        addSupplement,
        updateSupplement,
        deleteSupplement,
        getActiveSupplements,
        getSupplementsForProduct,
        supplementCategories,
        addSupplementCategory,
        updateSupplementCategory,
        deleteSupplementCategory,
        getActiveSupplementCategories,
        offers,
        addOffer,
        updateOffer,
        deleteOffer,
        getActiveOffers,
        getCurrentOffers,
      }}
    >
      {children}
    </StockContext.Provider>
  )
}

export function useStock() {
  const context = useContext(StockContext)
  if (!context) {
    throw new Error("useStock must be used within StockProvider")
  }
  return context
}