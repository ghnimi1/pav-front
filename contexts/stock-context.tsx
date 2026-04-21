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
  temperature?: string // Ex: "2-4°C", "-18°C"
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
  categoryId: string // Reference to parent StockCategory
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
  subCategoryId: string // Reference to parent SubCategory
  name: string
  description?: string
  unit: "kg" | "g" | "L" | "ml" | "pieces" | "sachets" | "boites"
  minQuantity: number
  unitPrice: number
  shelfLifeAfterOpening?: number // Days after opening
  supplierId?: string
  defaultLocationId?: string // Default storage location for this product
  image?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Batch {
  id: string
  productId: string // Reference to Product
  supplierId?: string
  locationId?: string // Storage location for this batch
  batchNumber: string
  quantity: number
  unitCost: number // Cost per unit for this batch
  receptionDate: string // FIFO order
  productionDate?: string
  expirationDate: string
  openingDate?: string
  expirationAfterOpening?: string
  isOpened: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// LEGACY INTERFACES (kept for menu system)
// ============================================

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
  color: string // Tailwind color classes like "bg-amber-100 text-amber-700"
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Supplement {
  id: string
  name: string
  price: number
  points?: number // Points earned when adding this supplement
  description?: string
  image?: string
  category?: string // "fromage", "viande", "legumes", "sauce", etc.
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductSupplementConfig {
  supplementId: string
  isEnabled: boolean
  customPrice?: number // Optional custom price for this specific product
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
  supplements?: Supplement[] // Legacy - kept for compatibility
  availableSupplements?: ProductSupplementConfig[] // New - configurable supplements per product
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

// Offer/Suggestion interface for time-based promotions
export interface OfferSchedule {
  daysOfWeek: number[] // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string // "HH:mm" format
  endTime: string // "HH:mm" format
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
  originalPrice: number // Sum of individual items
  discountedPrice: number // Offer price
  points: number
  items: OfferItem[] // Products included in offer
  schedule: OfferSchedule
  isActive: boolean
  validFrom?: string // ISO date
  validUntil?: string // ISO date
  maxPerDay?: number // Optional limit
  createdAt: string
  updatedAt: string
}

// Legacy interface for backwards compatibility
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
  // New hierarchy
  stockCategories: StockCategory[]
  subCategories: SubCategory[]
  products: Product[]
  batches: Batch[]
  
  // Stock category CRUD
  addStockCategory: (cat: Omit<StockCategory, "id" | "createdAt" | "updatedAt">) => void
  updateStockCategory: (id: string, cat: Partial<StockCategory>) => void
  deleteStockCategory: (id: string) => void
  
  // SubCategory CRUD
  addSubCategory: (sub: Omit<SubCategory, "id" | "createdAt" | "updatedAt">) => void
  updateSubCategory: (id: string, sub: Partial<SubCategory>) => void
  deleteSubCategory: (id: string) => void
  getSubCategoriesByCategoryId: (categoryId: string) => SubCategory[]
  
  // Product CRUD
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void
  getProductsBySubCategoryId: (subCategoryId: string) => Product[]
  getProductStock: (productId: string) => number
  
  // Batch CRUD (FIFO)
  addBatch: (batch: Omit<Batch, "id" | "createdAt" | "updatedAt">) => void
  updateBatch: (id: string, batch: Partial<Batch>) => void
  deleteBatch: (id: string) => void
  openBatch: (id: string, openingDate: string) => void
  getBatchesByProduct: (productId: string) => Batch[]
  getActiveBatches: (productId: string) => Batch[]
  consumeFromBatches: (productId: string, quantity: number) => void
  
  // Storage Locations CRUD
  storageLocations: StorageLocation[]
  addStorageLocation: (location: Omit<StorageLocation, "id" | "createdAt" | "updatedAt">) => void
  updateStorageLocation: (id: string, location: Partial<StorageLocation>) => void
  deleteStorageLocation: (id: string) => void
  getActiveStorageLocations: () => StorageLocation[]
  
  // Alerts
  getExpiringSoonBatches: () => Array<Batch & { productName: string; daysLeft: number }>
  getLowStockProducts: () => Array<Product & { currentStock: number; categoryName: string; subCategoryName: string }>
  
  // Legacy compatibility
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
  
  // Menu
  menuCategories: MenuCategory[]
  menuItems: MenuItem[]
  addMenuCategory: (category: Omit<MenuCategory, "id">) => void
  updateMenuCategory: (id: string, category: Partial<MenuCategory>) => void
  deleteMenuCategory: (id: string) => void
  addMenuItem: (item: Omit<MenuItem, "id" | "createdAt" | "updatedAt">) => void
  updateMenuItem: (id: string, item: Partial<MenuItem>) => void
  deleteMenuItem: (id: string) => void
  
  // Rewards
  rewards: Reward[]
  addReward: (reward: Omit<Reward, "id" | "createdAt" | "updatedAt">) => void
  updateReward: (id: string, reward: Partial<Reward>) => void
  deleteReward: (id: string) => void
  getActiveRewards: () => Reward[]
  
  // Supplements
  supplements: Supplement[]
  addSupplement: (supplement: Omit<Supplement, "id" | "createdAt" | "updatedAt">) => void
  updateSupplement: (id: string, supplement: Partial<Supplement>) => void
  deleteSupplement: (id: string) => void
  getActiveSupplements: () => Supplement[]
  getSupplementsForProduct: (productSupplements: ProductSupplementConfig[]) => Supplement[]
  
  // Supplement Categories
  supplementCategories: SupplementCategory[]
  addSupplementCategory: (category: Omit<SupplementCategory, "id" | "createdAt" | "updatedAt">) => void
  updateSupplementCategory: (id: string, category: Partial<SupplementCategory>) => void
  deleteSupplementCategory: (id: string) => void
  getActiveSupplementCategories: () => SupplementCategory[]
  
  // Offers
  offers: Offer[]
  addOffer: (offer: Omit<Offer, "id" | "createdAt" | "updatedAt">) => void
  updateOffer: (id: string, offer: Partial<Offer>) => void
  deleteOffer: (id: string) => void
  getActiveOffers: () => Offer[]
  getCurrentOffers: () => Offer[] // Returns offers valid for current day/time
}

const StockContext = createContext<StockContextType | undefined>(undefined)

// ============================================
// INITIAL DATA - STOCK HIERARCHY
// ============================================

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
  // Patisserie sub-categories
  {
    id: "sub-1",
    categoryId: "cat-1",
    name: "Chocolat",
    slug: "chocolat",
    description: "Chocolats et couvertures",
    icon: "🍫",
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sub-2",
    categoryId: "cat-1",
    name: "Arome",
    slug: "arome",
    description: "Aromes et extraits naturels",
    icon: "🌿",
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sub-3",
    categoryId: "cat-1",
    name: "Puree",
    slug: "puree",
    description: "Purees de fruits",
    icon: "🍓",
    order: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sub-4",
    categoryId: "cat-1",
    name: "Farine",
    slug: "farine",
    description: "Farines et poudres",
    icon: "🌾",
    order: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sub-5",
    categoryId: "cat-1",
    name: "Produits Laitiers",
    slug: "produits-laitiers",
    description: "Lait, creme, beurre",
    icon: "🥛",
    order: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Cafe sub-categories
  {
    id: "sub-6",
    categoryId: "cat-2",
    name: "Cafe",
    slug: "cafe-grains",
    description: "Cafe en grains et moulu",
    icon: "☕",
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sub-7",
    categoryId: "cat-2",
    name: "The",
    slug: "the",
    description: "Thes et infusions",
    icon: "🍵",
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sub-8",
    categoryId: "cat-2",
    name: "Sirops",
    slug: "sirops",
    description: "Sirops pour boissons",
    icon: "🍯",
    order: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Restaurant sub-categories
  {
    id: "sub-9",
    categoryId: "cat-3",
    name: "Huile",
    slug: "huile",
    description: "Huiles de cuisine",
    icon: "🫒",
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sub-10",
    categoryId: "cat-3",
    name: "Epices",
    slug: "epices",
    description: "Epices et condiments",
    icon: "🌶️",
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sub-11",
    categoryId: "cat-3",
    name: "Conserves",
    slug: "conserves",
    description: "Conserves et bocaux",
    icon: "🥫",
    order: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const initialStorageLocations: StorageLocation[] = [
  {
    id: "loc-1",
    name: "Refrigerateur 1",
    type: "refrigerator",
    description: "Refrigerateur principal pour produits laitiers",
    temperature: "2-4°C",
    capacity: "500L",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "loc-2",
    name: "Refrigerateur 2",
    type: "refrigerator",
    description: "Refrigerateur secondaire pour fruits et legumes",
    temperature: "4-6°C",
    capacity: "400L",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "loc-3",
    name: "Congelateur",
    type: "freezer",
    description: "Congelateur pour produits surgeles",
    temperature: "-18°C",
    capacity: "300L",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "loc-4",
    name: "Chambre Froide",
    type: "room",
    description: "Chambre froide positive",
    temperature: "0-4°C",
    capacity: "2000L",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "loc-5",
    name: "Chambre de Stock 1",
    type: "room",
    description: "Stock sec - farines et sucres",
    temperature: "Ambiante",
    capacity: "Grande",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "loc-6",
    name: "Chambre de Stock 2",
    type: "room",
    description: "Stock sec - conserves et emballages",
    temperature: "Ambiante",
    capacity: "Grande",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "loc-7",
    name: "Etagere Aromes",
    type: "shelf",
    description: "Etagere pour aromes et extraits",
    temperature: "Ambiante",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const initialProducts: Product[] = [
  // Chocolat products
  {
    id: "prod-1",
    subCategoryId: "sub-1",
    name: "Chocolat Blanc",
    description: "Chocolat blanc de couverture 35%",
    unit: "kg",
    minQuantity: 5,
    unitPrice: 25.0,
    shelfLifeAfterOpening: 180,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-2",
    subCategoryId: "sub-1",
    name: "Chocolat Noir 70%",
    description: "Chocolat noir de couverture 70% cacao",
    unit: "kg",
    minQuantity: 5,
    unitPrice: 28.5,
    shelfLifeAfterOpening: 180,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-3",
    subCategoryId: "sub-1",
    name: "Chocolat au Lait",
    description: "Chocolat au lait de couverture 40%",
    unit: "kg",
    minQuantity: 5,
    unitPrice: 24.0,
    shelfLifeAfterOpening: 180,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Arome products
  {
    id: "prod-4",
    subCategoryId: "sub-2",
    name: "Arome Caramel",
    description: "Arome naturel caramel concentre",
    unit: "L",
    minQuantity: 2,
    unitPrice: 35.0,
    shelfLifeAfterOpening: 365,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-5",
    subCategoryId: "sub-2",
    name: "Extrait de Vanille",
    description: "Extrait de vanille de Madagascar",
    unit: "L",
    minQuantity: 1,
    unitPrice: 85.0,
    shelfLifeAfterOpening: 365,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-6",
    subCategoryId: "sub-2",
    name: "Arome Fraise",
    description: "Arome naturel fraise",
    unit: "L",
    minQuantity: 2,
    unitPrice: 32.0,
    shelfLifeAfterOpening: 365,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Cafe products
  {
    id: "prod-7",
    subCategoryId: "sub-6",
    name: "Cafe Poudre Arabica",
    description: "Cafe moulu 100% Arabica",
    unit: "kg",
    minQuantity: 3,
    unitPrice: 18.0,
    shelfLifeAfterOpening: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-8",
    subCategoryId: "sub-6",
    name: "Cafe Grains Premium",
    description: "Cafe en grains torrefaction artisanale",
    unit: "kg",
    minQuantity: 5,
    unitPrice: 22.0,
    shelfLifeAfterOpening: 60,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Huile products
  {
    id: "prod-9",
    subCategoryId: "sub-9",
    name: "Huile Olive Extra Vierge",
    description: "Huile d'olive extra vierge premiere pression",
    unit: "L",
    minQuantity: 10,
    unitPrice: 12.0,
    shelfLifeAfterOpening: 180,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-10",
    subCategoryId: "sub-9",
    name: "Huile Tournesol",
    description: "Huile de tournesol pour friture",
    unit: "L",
    minQuantity: 20,
    unitPrice: 3.5,
    shelfLifeAfterOpening: 90,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Produits laitiers
  {
    id: "prod-11",
    subCategoryId: "sub-5",
    name: "Beurre AOP",
    description: "Beurre doux AOP 82% MG",
    unit: "kg",
    minQuantity: 10,
    unitPrice: 12.5,
    shelfLifeAfterOpening: 7,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod-12",
    subCategoryId: "sub-5",
    name: "Creme Liquide 35%",
    description: "Creme liquide UHT 35% MG",
    unit: "L",
    minQuantity: 5,
    unitPrice: 3.5,
    shelfLifeAfterOpening: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const initialBatches: Batch[] = [
  // Chocolat Blanc batches
  {
    id: "batch-1",
    productId: "prod-1",
    batchNumber: "CHB-2026-001",
    quantity: 10,
    receptionDate: "2026-01-15",
    productionDate: "2026-01-10",
    expirationDate: "2026-07-15",
    isOpened: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "batch-2",
    productId: "prod-1",
    batchNumber: "CHB-2026-002",
    quantity: 5,
    receptionDate: "2026-02-01",
    productionDate: "2026-01-25",
    expirationDate: "2026-08-01",
    isOpened: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Chocolat Noir batches
  {
    id: "batch-3",
    productId: "prod-2",
    batchNumber: "CHN-2026-001",
    quantity: 8,
    receptionDate: "2026-01-10",
    productionDate: "2026-01-05",
    expirationDate: "2026-07-10",
    isOpened: true,
    openingDate: "2026-01-20",
    expirationAfterOpening: "2026-07-10",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Cafe Poudre batch
  {
    id: "batch-4",
    productId: "prod-7",
    batchNumber: "CAF-2026-001",
    quantity: 5,
    receptionDate: "2026-03-01",
    productionDate: "2026-02-20",
    expirationDate: "2026-08-20",
    isOpened: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Beurre AOP batch (expires soon)
  {
    id: "batch-5",
    productId: "prod-11",
    batchNumber: "BEU-2026-001",
    quantity: 15,
    receptionDate: "2026-03-20",
    productionDate: "2026-03-18",
    expirationDate: "2026-04-10",
    isOpened: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Creme batch
  {
    id: "batch-6",
    productId: "prod-12",
    batchNumber: "CRE-2026-001",
    quantity: 8,
    receptionDate: "2026-03-22",
    productionDate: "2026-03-20",
    expirationDate: "2026-04-05",
    isOpened: true,
    openingDate: "2026-03-23",
    expirationAfterOpening: "2026-03-26",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// Legacy initial data
const initialLegacyCategories: Category[] = [
  { id: "1", name: "Farines", slug: "farines", icon: "🌾", color: "#f59e0b", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "2", name: "Sucres", slug: "sucres", icon: "🍬", color: "#ec4899", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const initialLegacyItems: StockItem[] = []

const initialSuppliers: Supplier[] = [
  {
    id: "sup-1",
    name: "Valrhona",
    contactName: "Sophie Martin",
    email: "pro@valrhona.com",
    phone: "+33 4 75 56 20 00",
    address: "26600 Tain-l'Hermitage",
    notes: "Chocolats de haute qualite",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-2",
    name: "Lavazza",
    contactName: "Marco Rossi",
    email: "contact@lavazza.com",
    phone: "+39 011 2398 111",
    notes: "Fournisseur cafe premium",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-3",
    name: "Isigny Sainte-Mere",
    contactName: "Jean Bernard",
    email: "contact@isigny.com",
    phone: "+33 2 31 51 33 00",
    notes: "Produits laitiers AOP",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const initialRewards: Reward[] = [
  {
    id: "r1",
    name: "Croissant Gratuit",
    description: "Un croissant artisanal offert",
    pointsCost: 50,
    type: "free_item",
    value: "1 croissant",
    image: "/golden-croissant.png",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "r2",
    name: "Reduction 5 TND",
    description: "5 TND de reduction sur votre prochaine commande",
    pointsCost: 100,
    type: "discount",
    value: "5 TND",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
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
  // ===== PETIT DEJEUNER =====
  {
    id: "0",
    name: "Petit Dejeuner Gourmand pour 2",
    description: "Assortiment complet pour deux personnes",
    price: 32.0,
    points: 32,
    category: "petit-dejeuner",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Lait", "Oeufs"],
    isAvailable: true,
    tags: ["Pour 2 personnes", "Complet"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ===== VIENNOISERIES =====
  {
    id: "1",
    name: "Croissant Artisanal",
    description: "Croissant pur beurre croustillant et fondant",
    price: 4.5,
    points: 5,
    category: "viennoiseries",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Lait"],
    isAvailable: true,
    availableSupplements: [
      { supplementId: "sup-16", isEnabled: true },
      { supplementId: "sup-17", isEnabled: true },
      { supplementId: "sup-18", isEnabled: true },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Pain au Chocolat",
    description: "Viennoiserie pur beurre garnie de chocolat noir",
    price: 5.5,
    points: 6,
    category: "viennoiseries",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Lait"],
    isAvailable: true,
    availableSupplements: [
      { supplementId: "sup-16", isEnabled: true },
      { supplementId: "sup-9", isEnabled: true },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Croissant aux Amandes",
    description: "Croissant garni de creme d'amandes et amandes effilees",
    price: 7.0,
    points: 7,
    category: "viennoiseries",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Lait", "Fruits a coque"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Chausson aux Pommes",
    description: "Pate feuilletee garnie de compote de pommes maison",
    price: 5.0,
    points: 5,
    category: "viennoiseries",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Lait"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Brioche Pur Beurre",
    description: "Brioche moelleuse faite maison",
    price: 4.0,
    points: 4,
    category: "viennoiseries",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Lait", "Oeufs"],
    isAvailable: true,
    availableSupplements: [
      { supplementId: "sup-17", isEnabled: true },
      { supplementId: "sup-18", isEnabled: true },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ===== PATISSERIES =====
  {
    id: "6",
    name: "Tarte au Citron Meringuee",
    description: "Tarte au citron avec meringue italienne flambee",
    price: 12.0,
    points: 12,
    category: "patisseries",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Lait", "Oeufs"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Eclair au Chocolat",
    description: "Eclair garni de creme patissiere au chocolat noir",
    price: 8.0,
    points: 8,
    category: "patisseries",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Lait", "Oeufs"],
    isAvailable: true,
    availableSupplements: [
      { supplementId: "sup-9", isEnabled: true },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Paris-Brest",
    description: "Couronne en pate a choux garnie de creme pralinee",
    price: 14.0,
    points: 14,
    category: "patisseries",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Lait", "Oeufs", "Fruits a coque"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "9",
    name: "Millefeuille Vanille",
    description: "Trois couches de pate feuilletee caramelisee et creme vanille",
    price: 11.0,
    points: 11,
    category: "patisseries",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Lait", "Oeufs"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "10",
    name: "Fraisier",
    description: "Genoise, creme mousseline et fraises fraiches",
    price: 15.0,
    points: 15,
    category: "patisseries",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Lait", "Oeufs"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "11",
    name: "Opera",
    description: "Biscuit joconde, ganache chocolat et cafe",
    price: 13.0,
    points: 13,
    category: "patisseries",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Lait", "Oeufs"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "12",
    name: "Tarte aux Fruits Rouges",
    description: "Pate sucree, creme patissiere et fruits rouges frais",
    price: 14.0,
    points: 14,
    category: "patisseries",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Lait", "Oeufs"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ===== SPECIALITES TUNISIENNES =====
  {
    id: "13",
    name: "Makroudh aux Dattes",
    description: "Semoule, dattes et miel - specialite tunisienne",
    price: 3.5,
    points: 4,
    category: "specialites-tunisiennes",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "14",
    name: "Baklawa",
    description: "Pate filo, pistaches et sirop de miel",
    price: 4.0,
    points: 4,
    category: "specialites-tunisiennes",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Fruits a coque"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "15",
    name: "Samsa aux Amandes",
    description: "Feuillete aux amandes et fleur d'oranger",
    price: 3.5,
    points: 4,
    category: "specialites-tunisiennes",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Fruits a coque"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "16",
    name: "Kaak Warka",
    description: "Petits gateaux secs aux amandes",
    price: 4.5,
    points: 5,
    category: "specialites-tunisiennes",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten", "Oeufs", "Fruits a coque"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "17",
    name: "Zlabia",
    description: "Beignets au miel croustillants",
    price: 3.0,
    points: 3,
    category: "specialites-tunisiennes",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Gluten"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ===== THES & INFUSIONS =====
  {
    id: "18",
    name: "The a la Menthe",
    description: "The vert a la menthe fraiche",
    price: 4.0,
    points: 4,
    category: "thes-infusions",
    image: "/placeholder.svg?height=200&width=200",
    allergens: [],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "19",
    name: "The aux Pignons",
    description: "The tunisien traditionnel aux pignons de pin",
    price: 5.0,
    points: 5,
    category: "thes-infusions",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Fruits a coque"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "20",
    name: "Cafe Turc",
    description: "Cafe turc prepare a la demande",
    price: 3.5,
    points: 4,
    category: "thes-infusions",
    image: "/placeholder.svg?height=200&width=200",
    allergens: [],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "21",
    name: "Cappuccino",
    description: "Espresso, lait mousseux et cacao",
    price: 5.5,
    points: 6,
    category: "thes-infusions",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Lait"],
    isAvailable: true,
    availableSupplements: [
      { supplementId: "sup-9", isEnabled: true },
      { supplementId: "sup-10", isEnabled: true },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ===== BOISSONS =====
  {
    id: "22",
    name: "Jus d'Orange Frais",
    description: "Oranges pressees a la minute",
    price: 6.0,
    points: 6,
    category: "boissons",
    image: "/placeholder.svg?height=200&width=200",
    allergens: [],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "23",
    name: "Smoothie Fruits Rouges",
    description: "Fraises, framboises, myrtilles et yaourt",
    price: 8.0,
    points: 8,
    category: "boissons",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Lait"],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "24",
    name: "Citronnade Maison",
    description: "Citrons frais, menthe et sucre de canne",
    price: 5.0,
    points: 5,
    category: "boissons",
    image: "/placeholder.svg?height=200&width=200",
    allergens: [],
    isAvailable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "25",
    name: "Milkshake Chocolat",
    description: "Glace vanille, lait et chocolat belge",
    price: 7.5,
    points: 8,
    category: "boissons",
    image: "/placeholder.svg?height=200&width=200",
    allergens: ["Lait"],
    isAvailable: true,
    availableSupplements: [
      { supplementId: "sup-9", isEnabled: true },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// ============================================
// INITIAL SUPPLEMENT CATEGORIES DATA
// ============================================

const initialSupplementCategories: SupplementCategory[] = [
  { id: "fromage", name: "Fromage", color: "bg-yellow-100 text-yellow-700", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "viande", name: "Viandes", color: "bg-red-100 text-red-700", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "poisson", name: "Poisson", color: "bg-blue-100 text-blue-700", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "legumes", name: "Legumes", color: "bg-green-100 text-green-700", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "herbes", name: "Herbes", color: "bg-emerald-100 text-emerald-700", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "lait", name: "Lait", color: "bg-stone-100 text-stone-700", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "topping", name: "Topping", color: "bg-pink-100 text-pink-700", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "sirop", name: "Sirop", color: "bg-amber-100 text-amber-700", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "cafe", name: "Cafe", color: "bg-orange-100 text-orange-700", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "fruits", name: "Fruits", color: "bg-rose-100 text-rose-700", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "glace", name: "Glace", color: "bg-cyan-100 text-cyan-700", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "confiture", name: "Confiture", color: "bg-purple-100 text-purple-700", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: "autre", name: "Autre", color: "bg-gray-100 text-gray-700", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

// ============================================
// INITIAL SUPPLEMENTS DATA
// ============================================

const initialSupplements: Supplement[] = [
  // Supplements pour Omelette
  {
    id: "sup-1",
    name: "Champignons",
    price: 1.50,
    points: 2,
    description: "Champignons frais sautés",
    category: "legumes",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-2",
    name: "Fromage",
    price: 1.00,
    points: 1,
    description: "Fromage gratiné",
    category: "fromage",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-3",
    name: "Thon",
    price: 2.00,
    points: 2,
    description: "Thon émietté",
    category: "poisson",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-4",
    name: "Jambon",
    price: 1.50,
    points: 2,
    description: "Jambon de dinde",
    category: "viande",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-5",
    name: "Légumes",
    price: 1.00,
    points: 1,
    description: "Mélange de légumes frais",
    category: "legumes",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-6",
    name: "Herbes fraîches",
    price: 0.50,
    points: 1,
    description: "Persil, ciboulette, basilic",
    category: "herbes",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Supplements pour Café
  {
    id: "sup-7",
    name: "Lait de soja",
    price: 0.50,
    points: 1,
    description: "Lait végétal de soja",
    category: "lait",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-8",
    name: "Lait d'avoine",
    price: 0.50,
    points: 1,
    description: "Lait végétal d'avoine",
    category: "lait",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-9",
    name: "Chantilly",
    price: 1.00,
    points: 1,
    description: "Crème chantilly maison",
    category: "topping",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-10",
    name: "Sirop caramel",
    price: 0.50,
    points: 1,
    description: "Sirop de caramel",
    category: "sirop",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-11",
    name: "Shot espresso",
    price: 1.00,
    points: 1,
    description: "Un shot d'espresso supplémentaire",
    category: "cafe",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Supplements pour Crêpes/Pancakes
  {
    id: "sup-12",
    name: "Nutella",
    price: 1.50,
    points: 2,
    description: "Pâte à tartiner chocolat-noisettes",
    category: "topping",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-13",
    name: "Fruits frais",
    price: 2.00,
    points: 2,
    description: "Assortiment de fruits frais de saison",
    category: "fruits",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-14",
    name: "Sirop d'érable",
    price: 1.00,
    points: 1,
    description: "Sirop d'érable pur",
    category: "sirop",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-15",
    name: "Glace vanille",
    price: 2.00,
    points: 2,
    description: "Boule de glace vanille",
    category: "glace",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Supplements pour Croissant/Viennoiseries
  {
    id: "sup-16",
    name: "Amandes effilées",
    price: 1.00,
    points: 1,
    description: "Amandes grillées",
    category: "topping",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-17",
    name: "Chocolat fondu",
    price: 1.00,
    points: 1,
    description: "Chocolat noir fondu",
    category: "topping",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sup-18",
    name: "Confiture maison",
    price: 0.75,
    points: 1,
    description: "Confiture artisanale aux fruits",
    category: "confiture",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// ============================================
// INITIAL OFFERS DATA
// ============================================

const initialOffers: Offer[] = [
  {
    id: "offer-1",
    name: "Petit Dejeuner Complet",
    description: "Croissant + Cafe + Jus d'orange frais",
    image: "/breakfast-offer.jpg",
    originalPrice: 12.50,
    discountedPrice: 9.90,
    points: 15,
    items: [
      { itemId: "1", quantity: 1 }, // Croissant
      { itemId: "cafe-1", quantity: 1 },
    ],
    schedule: {
      daysOfWeek: [1, 2, 3, 4, 5], // Lundi à Vendredi
      startTime: "07:00",
      endTime: "11:00",
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "offer-2",
    name: "Gouter Gourmand",
    description: "Pain au chocolat + Chocolat chaud",
    image: "/gouter-offer.jpg",
    originalPrice: 8.00,
    discountedPrice: 6.50,
    points: 10,
    items: [
      { itemId: "2", quantity: 1 }, // Pain au chocolat
    ],
    schedule: {
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // Tous les jours
      startTime: "15:00",
      endTime: "18:00",
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "offer-3",
    name: "Weekend Brunch",
    description: "Formule brunch complete pour 2 personnes",
    image: "/brunch-offer.jpg",
    originalPrice: 35.00,
    discountedPrice: 28.00,
    points: 40,
    items: [],
    schedule: {
      daysOfWeek: [0, 6], // Samedi et Dimanche
      startTime: "10:00",
      endTime: "14:00",
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

// ============================================
// PROVIDER COMPONENT
// ============================================

export function StockProvider({ children }: { children: ReactNode }) {
  // New hierarchy state
  const [stockCategories, setStockCategories] = useState<StockCategory[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([])
  
  // Legacy state
  const [items, setItems] = useState<StockItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [rewards, setRewards] = useState<Reward[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([])
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [supplementCategories, setSupplementCategories] = useState<SupplementCategory[]>([])
  const [offers, setOffers] = useState<Offer[]>([])

  // Data version - increment this to force reload of menu data
  const DATA_VERSION = "v2.0"

  // Load from localStorage
  useEffect(() => {
    // Check data version - if different, clear menu-related data and reload
    const storedVersion = localStorage.getItem("pastry-data-version")
    if (storedVersion !== DATA_VERSION) {
      // Clear old menu data to force reload with new initial data
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
      supplements: localStorage.getItem("pastry-supplements"),
      supplementCategories: localStorage.getItem("pastry-supplement-categories"),
      offers: localStorage.getItem("pastry-offers"),
    }

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
    setSupplements(stored.supplements ? JSON.parse(stored.supplements) : initialSupplements)
    setSupplementCategories(stored.supplementCategories ? JSON.parse(stored.supplementCategories) : initialSupplementCategories)
    setOffers(stored.offers ? JSON.parse(stored.offers) : initialOffers)
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
  useEffect(() => { if (supplementCategories.length) localStorage.setItem("pastry-supplement-categories", JSON.stringify(supplementCategories)) }, [supplementCategories])
  useEffect(() => { if (supplements.length) localStorage.setItem("pastry-supplements", JSON.stringify(supplements)) }, [supplements])
  useEffect(() => { if (offers.length) localStorage.setItem("pastry-offers", JSON.stringify(offers)) }, [offers])

  // ============================================
  // STOCK CATEGORY CRUD
  // ============================================
  
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
    setStockCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, ...updates, updatedAt: new Date().toISOString() } : cat
    ))
  }

  const deleteStockCategory = (id: string) => {
    // Also delete sub-categories and their products
    const subs = subCategories.filter(s => s.categoryId === id)
    subs.forEach(sub => deleteSubCategory(sub.id))
    setStockCategories(prev => prev.filter(cat => cat.id !== id))
  }

  // ============================================
  // SUBCATEGORY CRUD
  // ============================================

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
    setSubCategories(prev => prev.map(sub => 
      sub.id === id ? { ...sub, ...updates, updatedAt: new Date().toISOString() } : sub
    ))
  }

  const deleteSubCategory = (id: string) => {
    // Also delete products and their batches
    const prods = products.filter(p => p.subCategoryId === id)
    prods.forEach(prod => deleteProduct(prod.id))
    setSubCategories(prev => prev.filter(sub => sub.id !== id))
  }

  const getSubCategoriesByCategoryId = (categoryId: string) => {
    return subCategories.filter(s => s.categoryId === categoryId).sort((a, b) => a.order - b.order)
  }

  // ============================================
  // PRODUCT CRUD
  // ============================================

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
    setProducts(prev => prev.map(prod => 
      prod.id === id ? { ...prod, ...updates, updatedAt: new Date().toISOString() } : prod
    ))
  }

  const deleteProduct = (id: string) => {
    // Also delete batches
    setBatches(prev => prev.filter(b => b.productId !== id))
    setProducts(prev => prev.filter(prod => prod.id !== id))
  }

  const getProductsBySubCategoryId = (subCategoryId: string) => {
    return products.filter(p => p.subCategoryId === subCategoryId)
  }

  const getProductStock = (productId: string) => {
    return batches.filter(b => b.productId === productId).reduce((sum, b) => sum + b.quantity, 0)
  }

  // ============================================
  // STORAGE LOCATION CRUD
  // ============================================

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
    setStorageLocations(prev => prev.map(loc => 
      loc.id === id ? { ...loc, ...updates, updatedAt: new Date().toISOString() } : loc
    ))
  }

  const deleteStorageLocation = (id: string) => {
    setStorageLocations(prev => prev.filter(loc => loc.id !== id))
  }

  const getActiveStorageLocations = () => {
    return storageLocations.filter(loc => loc.isActive)
  }

  // ============================================
  // BATCH CRUD (FIFO)
  // ============================================

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
    setBatches(prev => prev.map(b => 
      b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
    ))
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
    return batches
      .filter(b => b.productId === productId)
      .sort((a, b) => new Date(a.receptionDate).getTime() - new Date(b.receptionDate).getTime())
  }

  const getActiveBatches = (productId: string) => {
    return batches
      .filter(b => b.productId === productId && b.quantity > 0)
      .sort((a, b) => new Date(a.receptionDate).getTime() - new Date(b.receptionDate).getTime())
  }

  const getArchivedBatches = (productId: string) => {
    return batches
      .filter(b => b.productId === productId && b.isOpened)
      .sort((a, b) => new Date(a.openingDate || "").getTime() - new Date(b.openingDate || "").getTime())
  }

  // Consume from batches using FIFO
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

  // ============================================
  // ALERTS
  // ============================================

  const getExpiringSoonBatches = () => {
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
    const today = new Date()

    return batches
      .filter(batch => {
        const expDate = batch.isOpened && batch.expirationAfterOpening
          ? new Date(batch.expirationAfterOpening)
          : new Date(batch.expirationDate)
        return expDate <= thirtyDaysFromNow && expDate >= today && batch.quantity > 0
      })
      .map(batch => {
        const expDate = batch.isOpened && batch.expirationAfterOpening
          ? new Date(batch.expirationAfterOpening)
          : new Date(batch.expirationDate)
        const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        const product = products.find(p => p.id === batch.productId)
        return { ...batch, productName: product?.name || "", daysLeft }
      })
      .sort((a, b) => a.daysLeft - b.daysLeft)
  }

  const getLowStockProducts = () => {
    return products
      .filter(product => {
        const stock = getProductStock(product.id)
        return stock <= product.minQuantity && product.isActive
      })
      .map(product => {
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

  // ============================================
  // LEGACY CRUD
  // ============================================

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

  // ============================================
  // MENU CRUD
  // ============================================

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

  // ============================================
  // REWARDS CRUD
  // ============================================

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

  // ============================================
  // SUPPLEMENTS CRUD
  // ============================================

  const addSupplement = (supplement: Omit<Supplement, "id" | "createdAt" | "updatedAt">) => {
    const newSupplement: Supplement = { 
      ...supplement, 
      id: `sup-${Date.now()}`, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    }
    setSupplements(prev => [...prev, newSupplement])
  }

  const updateSupplement = (id: string, updates: Partial<Supplement>) => {
    setSupplements(prev => prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
  }

  const deleteSupplement = (id: string) => {
    setSupplements(prev => prev.filter(s => s.id !== id))
  }

  const getActiveSupplements = () => supplements.filter(s => s.isActive)

  const getSupplementsForProduct = (productSupplements: ProductSupplementConfig[]) => {
    if (!productSupplements) return []
    return productSupplements
      .filter(ps => ps.isEnabled)
      .map(ps => {
        const supplement = supplements.find(s => s.id === ps.supplementId && s.isActive)
        if (!supplement) return null
        // Apply custom price if set
        return ps.customPrice !== undefined 
          ? { ...supplement, price: ps.customPrice }
          : supplement
      })
      .filter((s): s is Supplement => s !== null)
  }

  // ============================================
  // SUPPLEMENT CATEGORIES CRUD
  // ============================================

  const addSupplementCategory = (category: Omit<SupplementCategory, "id" | "createdAt" | "updatedAt">) => {
    const newCategory: SupplementCategory = { 
      ...category, 
      id: `supcat-${Date.now()}`, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    }
    setSupplementCategories(prev => [...prev, newCategory])
  }

  const updateSupplementCategory = (id: string, updates: Partial<SupplementCategory>) => {
    setSupplementCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
  }

  const deleteSupplementCategory = (id: string) => {
    // Don't allow deleting if supplements are using this category
    const inUse = supplements.some(s => s.category === id)
    if (inUse) {
      console.warn(`Cannot delete category ${id}: still in use by supplements`)
      return
    }
    setSupplementCategories(prev => prev.filter(c => c.id !== id))
  }

  const getActiveSupplementCategories = () => supplementCategories.filter(c => c.isActive)

  // ============================================
  // OFFERS CRUD
  // ============================================

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
    const currentDay = now.getDay() // 0=Sunday, 1=Monday, etc.
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`

    return offers.filter(offer => {
      if (!offer.isActive) return false

      // Check day of week
      if (!offer.schedule.daysOfWeek.includes(currentDay)) return false

      // Check time range
      const { startTime, endTime } = offer.schedule
      if (currentTime < startTime || currentTime > endTime) return false

      // Check valid dates if set
      if (offer.validFrom && new Date(offer.validFrom) > now) return false
      if (offer.validUntil && new Date(offer.validUntil) < now) return false

      return true
    })
  }

  return (
    <StockContext.Provider
      value={{
        // New hierarchy
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
        // Storage Locations
        storageLocations,
        addStorageLocation,
        updateStorageLocation,
        deleteStorageLocation,
        getActiveStorageLocations,
        // Legacy
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
        // Menu
        menuCategories,
        menuItems,
        addMenuCategory,
        updateMenuCategory,
        deleteMenuCategory,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        // Rewards
        rewards,
        addReward,
        updateReward,
        deleteReward,
        getActiveRewards,
        // Supplements
        supplements,
        addSupplement,
        updateSupplement,
        deleteSupplement,
        getActiveSupplements,
        getSupplementsForProduct,
        // Supplement Categories
        supplementCategories,
        addSupplementCategory,
        updateSupplementCategory,
        deleteSupplementCategory,
        getActiveSupplementCategories,
        // Offers
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
