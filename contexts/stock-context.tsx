"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api-client"
import { useNavigation } from "@/contexts/navigation-context"

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
  imageFile?: File
  removeImage?: boolean
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
  id?: string
  name?: string
  price?: number
  description?: string
  points?: number
  category?: string
  isactive?: boolean
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
  addMenuCategory: (category: Omit<MenuCategory, "id">) => Promise<void>
  updateMenuCategory: (id: string, category: Partial<MenuCategory>) => Promise<void>
  deleteMenuCategory: (id: string) => Promise<void>
  addMenuItem: (item: Omit<MenuItem, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateMenuItem: (id: string, item: Partial<MenuItem>) => Promise<void>
  deleteMenuItem: (id: string) => Promise<void>
  toggleMenuItemAvailability: (id: string) => Promise<void>
  rewards: Reward[]
  addReward: (reward: Omit<Reward, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateReward: (id: string, reward: Partial<Reward>) => Promise<void>
  deleteReward: (id: string) => Promise<void>
  getActiveRewards: () => Reward[]
  supplements: Supplement[]
  addSupplement: (supplement: Omit<Supplement, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateSupplement: (id: string, supplement: Partial<Supplement>) => Promise<void>
  deleteSupplement: (id: string) => Promise<void>
  getActiveSupplements: () => Supplement[]
  getSupplementsForProduct: (productSupplements: ProductSupplementConfig[]) => Supplement[]
  supplementCategories: SupplementCategory[]
  addSupplementCategory: (category: Omit<SupplementCategory, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateSupplementCategory: (id: string, category: Partial<SupplementCategory>) => Promise<void>
  deleteSupplementCategory: (id: string) => Promise<void>
  getActiveSupplementCategories: () => SupplementCategory[]
  offers: Offer[]
  addOffer: (offer: Omit<Offer, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateOffer: (id: string, offer: Partial<Offer>) => Promise<void>
  deleteOffer: (id: string) => Promise<void>
  getActiveOffers: () => Offer[]
  getCurrentOffers: () => Offer[]
}

const StockContext = createContext<StockContextType | undefined>(undefined)

const AUTH_TOKEN_KEY = "authToken"

function normalizeStockCategory(category: Partial<StockCategory> & { _id?: string }): StockCategory {
  const now = new Date().toISOString()
  return {
    id: category._id || category.id || `cat-${Date.now()}`,
    name: category.name || "",
    slug: category.slug || "",
    description: category.description,
    icon: category.icon,
    color: category.color,
    order: typeof category.order === "number" ? category.order : 0,
    isActive: category.isActive !== false,
    createdAt: category.createdAt || now,
    updatedAt: category.updatedAt || now,
  }
}

function normalizeSubCategory(subCategory: Partial<SubCategory> & { _id?: string }): SubCategory {
  const now = new Date().toISOString()
  return {
    id: subCategory._id || subCategory.id || `sub-${Date.now()}`,
    categoryId: subCategory.categoryId || "",
    name: subCategory.name || "",
    slug: subCategory.slug || "",
    description: subCategory.description,
    icon: subCategory.icon,
    order: typeof subCategory.order === "number" ? subCategory.order : 0,
    isActive: subCategory.isActive !== false,
    createdAt: subCategory.createdAt || now,
    updatedAt: subCategory.updatedAt || now,
  }
}

function normalizeProduct(product: Partial<Product> & { _id?: string }): Product {
  const now = new Date().toISOString()
  return {
    id: product._id || product.id || `prod-${Date.now()}`,
    subCategoryId: product.subCategoryId || "",
    name: product.name || "",
    description: product.description,
    unit: product.unit || "kg",
    minQuantity: typeof product.minQuantity === "number" ? product.minQuantity : 5,
    unitPrice: typeof product.unitPrice === "number" ? product.unitPrice : 0,
    shelfLifeAfterOpening: product.shelfLifeAfterOpening,
    supplierId: product.supplierId,
    defaultLocationId: product.defaultLocationId,
    image: product.image,
    isActive: product.isActive !== false,
    createdAt: product.createdAt || now,
    updatedAt: product.updatedAt || now,
  }
}

function toDateInput(value?: string): string | undefined {
  if (!value) return undefined
  return value.includes("T") ? value.split("T")[0] : value
}

function normalizeBatch(batch: Partial<Batch> & { _id?: string }): Batch {
  const now = new Date().toISOString()
  return {
    id: batch._id || batch.id || `batch-${Date.now()}`,
    productId: batch.productId || "",
    supplierId: batch.supplierId,
    locationId: batch.locationId,
    batchNumber: batch.batchNumber || "",
    quantity: typeof batch.quantity === "number" ? batch.quantity : 0,
    unitCost: typeof batch.unitCost === "number" ? batch.unitCost : 0,
    receptionDate: toDateInput(batch.receptionDate) || toDateInput(now) || "",
    productionDate: toDateInput(batch.productionDate),
    expirationDate: toDateInput(batch.expirationDate) || toDateInput(now) || "",
    openingDate: toDateInput(batch.openingDate),
    expirationAfterOpening: toDateInput(batch.expirationAfterOpening),
    isOpened: batch.isOpened === true,
    notes: batch.notes,
    createdAt: batch.createdAt || now,
    updatedAt: batch.updatedAt || now,
  }
}

function normalizeStorageLocation(location: Partial<StorageLocation> & { _id?: string }): StorageLocation {
  const now = new Date().toISOString()
  return {
    id: location._id || location.id || `loc-${Date.now()}`,
    name: location.name || "",
    type: location.type || "other",
    description: location.description,
    temperature: location.temperature,
    capacity: location.capacity,
    isActive: location.isActive !== false,
    createdAt: location.createdAt || now,
    updatedAt: location.updatedAt || now,
  }
}

function normalizeSupplier(supplier: Partial<Supplier> & { _id?: string }): Supplier {
  const now = new Date().toISOString()
  return {
    id: supplier._id || supplier.id || `sup-${Date.now()}`,
    name: supplier.name || "",
    contactName: supplier.contactName,
    email: supplier.email,
    phone: supplier.phone,
    address: supplier.address,
    notes: supplier.notes,
    status: supplier.status || "active",
    createdAt: supplier.createdAt || now,
    updatedAt: supplier.updatedAt || now,
  }
}

async function fetchStockCategories(): Promise<StockCategory[]> {
  try {
    const data = await apiGet<Array<Partial<StockCategory> & { _id?: string }>>("/stock/categories")
    return data.map(normalizeStockCategory)
  } catch (error) {
    console.error("Failed to fetch stock categories:", error)
    return initialStockCategories
  }
}

async function createStockCategoryAPI(data: Omit<StockCategory, "id" | "createdAt" | "updatedAt">): Promise<StockCategory> {
  const result = await apiPost<Partial<StockCategory> & { _id?: string }>("/stock/categories", data)
  return normalizeStockCategory(result)
}

async function updateStockCategoryAPI(id: string, data: Partial<StockCategory>): Promise<void> {
  await apiPut(`/stock/categories/${id}`, data)
}

async function deleteStockCategoryAPI(id: string): Promise<void> {
  await apiDelete(`/stock/categories/${id}`)
}

async function fetchSubCategories(): Promise<SubCategory[]> {
  try {
    const data = await apiGet<Array<Partial<SubCategory> & { _id?: string }>>("/stock/subcategories")
    return data.map(normalizeSubCategory)
  } catch (error) {
    console.error("Failed to fetch subcategories:", error)
    return initialSubCategories
  }
}

async function createSubCategoryAPI(data: Omit<SubCategory, "id" | "createdAt" | "updatedAt">): Promise<SubCategory> {
  const result = await apiPost<Partial<SubCategory> & { _id?: string }>("/stock/subcategories", data)
  return normalizeSubCategory(result)
}

async function updateSubCategoryAPI(id: string, data: Partial<SubCategory>): Promise<void> {
  await apiPut(`/stock/subcategories/${id}`, data)
}

async function deleteSubCategoryAPI(id: string): Promise<void> {
  await apiDelete(`/stock/subcategories/${id}`)
}

async function fetchProducts(): Promise<Product[]> {
  try {
    const data = await apiGet<Array<Partial<Product> & { _id?: string }>>("/stock/products")
    return data.map(normalizeProduct)
  } catch (error) {
    console.error("Failed to fetch products:", error)
    return initialProducts
  }
}

async function createProductAPI(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<Product> {
  const result = await apiPost<Partial<Product> & { _id?: string }>("/stock/products", data)
  return normalizeProduct(result)
}

async function updateProductAPI(id: string, data: Partial<Product>): Promise<void> {
  await apiPut(`/stock/products/${id}`, data)
}

async function deleteProductAPI(id: string): Promise<void> {
  await apiDelete(`/stock/products/${id}`)
}

async function fetchBatches(): Promise<Batch[]> {
  try {
    const data = await apiGet<Array<Partial<Batch> & { _id?: string }>>("/stock/batches")
    return data.map(normalizeBatch)
  } catch (error) {
    console.error("Failed to fetch batches:", error)
    return initialBatches
  }
}

async function createBatchAPI(data: Omit<Batch, "id" | "createdAt" | "updatedAt">): Promise<Batch> {
  const result = await apiPost<Partial<Batch> & { _id?: string }>("/stock/batches", data)
  return normalizeBatch(result)
}

async function updateBatchAPI(id: string, data: Partial<Batch>): Promise<void> {
  await apiPut(`/stock/batches/${id}`, data)
}

async function deleteBatchAPI(id: string): Promise<void> {
  await apiDelete(`/stock/batches/${id}`)
}

async function openBatchAPI(id: string, openingDate: string, productShelfLife?: number): Promise<void> {
  await apiPost(`/stock/batches/${id}/open`, { openingDate, productShelfLife })
}

async function fetchStorageLocations(): Promise<StorageLocation[]> {
  try {
    const data = await apiGet<Array<Partial<StorageLocation> & { _id?: string }>>("/stock/storage-locations")
    return data.map(normalizeStorageLocation)
  } catch (error) {
    console.error("Failed to fetch storage locations:", error)
    return initialStorageLocations
  }
}

async function createStorageLocationAPI(data: Omit<StorageLocation, "id" | "createdAt" | "updatedAt">): Promise<StorageLocation> {
  const result = await apiPost<Partial<StorageLocation> & { _id?: string }>("/stock/storage-locations", data)
  return normalizeStorageLocation(result)
}

async function updateStorageLocationAPI(id: string, data: Partial<StorageLocation>): Promise<void> {
  await apiPut(`/stock/storage-locations/${id}`, data)
}

async function deleteStorageLocationAPI(id: string): Promise<void> {
  await apiDelete(`/stock/storage-locations/${id}`)
}

async function fetchSuppliers(): Promise<Supplier[]> {
  try {
    const data = await apiGet<Array<Partial<Supplier> & { _id?: string }>>("/stock/suppliers")
    return data.map(normalizeSupplier)
  } catch (error) {
    console.error("Failed to fetch suppliers:", error)
    return initialSuppliers
  }
}

async function createSupplierAPI(data: Omit<Supplier, "id" | "createdAt" | "updatedAt">): Promise<Supplier> {
  const result = await apiPost<Partial<Supplier> & { _id?: string }>("/stock/suppliers", data)
  return normalizeSupplier(result)
}

async function updateSupplierAPI(id: string, data: Partial<Supplier>): Promise<void> {
  await apiPut(`/stock/suppliers/${id}`, data)
}

async function deleteSupplierAPI(id: string): Promise<void> {
  await apiDelete(`/stock/suppliers/${id}`)
}

// ============================================
// API FUNCTIONS FOR MENU CATEGORIES
// ============================================

async function fetchMenuCategories(includeInactive = false): Promise<MenuCategory[]> {
  try {
    const data = await apiGet<MenuCategory[]>(includeInactive ? '/menu/categories/all' : '/menu/categories')
    return data.map(c => ({
      ...c,
      id: (c as any)._id || c.id,
    }))
  } catch (error) {
    console.error('Failed to fetch menu categories:', error)
    return []
  }
}

async function createMenuCategoryAPI(data: Omit<MenuCategory, 'id'>): Promise<MenuCategory> {
  const result = await apiPost<MenuCategory>('/menu/categories', data)
  return {
    ...result,
    id: (result as any)._id || result.id,
  }
}

async function updateMenuCategoryAPI(id: string, data: Partial<MenuCategory>): Promise<void> {
  await apiPut(`/menu/categories/${id}`, data)
}

async function deleteMenuCategoryAPI(id: string): Promise<void> {
  await apiDelete(`/menu/categories/${id}`)
}

// ============================================
// API FUNCTIONS FOR MENU ITEMS
// ============================================

async function fetchMenuItems(includeInactive = false): Promise<MenuItem[]> {
  try {
    const data = await apiGet<MenuItem[]>(includeInactive ? '/menu/items/all' : '/menu/items')
    return data.map(item => ({
      ...item,
      id: (item as any)._id || item.id,
      category: (item as any).categoryId || item.category,
      availableSupplements: (item as any).availableSupplements || (item as any).supplements || [],
    }))
  } catch (error) {
    console.error('Failed to fetch menu items:', error)
    return []
  }
}

async function createMenuItemAPI(formData: FormData): Promise<MenuItem> {
  return apiPost<MenuItem>('/menu/items', formData)
}

async function updateMenuItemAPI(id: string, formData: FormData): Promise<void> {
  await apiPut(`/menu/items/${id}`, formData)
}

async function deleteMenuItemAPI(id: string): Promise<void> {
  await apiDelete(`/menu/items/${id}`)
}

async function toggleMenuItemAvailabilityAPI(id: string): Promise<void> {
  await apiPatch(`/menu/items/${id}/toggle`)
}

// ============================================
// API FUNCTIONS FOR OFFERS
// ============================================

async function fetchOffers(includeInactive = false): Promise<Offer[]> {
  try {
    const data = await apiGet<Offer[]>(includeInactive ? '/menu/offers/all' : '/menu/offers/current')
    return data.map(offer => ({
      ...offer,
      id: (offer as any)._id || offer.id,
    }))
  } catch (error) {
    console.error('Failed to fetch offers:', error)
    return []
  }
}

async function createOfferAPI(data: Omit<Offer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Offer> {
  const result = await apiPost<Offer>('/menu/offers', data)
  return {
    ...result,
    id: (result as any)._id || result.id,
  }
}

async function updateOfferAPI(id: string, data: Partial<Offer>): Promise<void> {
  await apiPut(`/menu/offers/${id}`, data)
}

async function deleteOfferAPI(id: string): Promise<void> {
  await apiDelete(`/menu/offers/${id}`)
}

// ============================================
// API FUNCTIONS FOR REWARDS
// ============================================

function normalizeReward(reward: Partial<Reward> & { _id?: string }): Reward {
  const now = new Date().toISOString()
  return {
    id: reward._id || reward.id || `reward-${Date.now()}`,
    name: reward.name || "",
    description: reward.description || "",
    pointsCost: typeof reward.pointsCost === "number" ? reward.pointsCost : 0,
    type: reward.type || "special",
    value: reward.value || "",
    image: reward.image,
    isActive: reward.isActive !== false,
    createdAt: reward.createdAt || now,
    updatedAt: reward.updatedAt || now,
  }
}

async function fetchRewards(): Promise<Reward[]> {
  try {
    const data = await apiGet<Array<Partial<Reward> & { _id?: string }>>('/stock/rewards')
    return data.map(normalizeReward)
  } catch (error) {
    console.error('Failed to fetch rewards:', error)
    return []
  }
}

function buildRewardFormData(reward: Partial<Reward>) {
  const formData = new FormData()

  if (reward.name !== undefined) formData.append("name", reward.name)
  if (reward.description !== undefined) formData.append("description", reward.description)
  if (reward.pointsCost !== undefined) formData.append("pointsCost", String(reward.pointsCost))
  if (reward.type !== undefined) formData.append("type", reward.type)
  if (reward.value !== undefined) formData.append("value", reward.value)
  if (reward.image !== undefined) formData.append("image", reward.image)
  if (reward.isActive !== undefined) formData.append("isActive", String(reward.isActive))
  if (reward.removeImage !== undefined) formData.append("removeImage", String(reward.removeImage))
  if (reward.imageFile) formData.append("imageFile", reward.imageFile)

  return formData
}

async function createRewardAPI(data: Omit<Reward, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reward> {
  const result = await apiPost<Partial<Reward> & { _id?: string }>('/stock/rewards', buildRewardFormData(data))
  return normalizeReward(result)
}

async function updateRewardAPI(id: string, data: Partial<Reward>): Promise<void> {
  await apiPut(`/stock/rewards/${id}`, buildRewardFormData(data))
}

async function deleteRewardAPI(id: string): Promise<void> {
  await apiDelete(`/stock/rewards/${id}`)
}

// ============================================
// API FUNCTIONS FOR SUPPLEMENTS
// ============================================

async function fetchSupplements(includeInactive = false): Promise<Supplement[]> {
  try {
    const data = await apiGet<Supplement[]>(includeInactive ? '/menu/supplements/all' : '/menu/supplements')
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
    const data = await apiGet<SupplementCategory[]>('/menu/supplement-categories')
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
  const result = await apiPost<Supplement>('/menu/supplements', data)
  return {
    ...result,
    id: (result as any)._id || result.id,
    createdAt: result.createdAt || new Date().toISOString(),
    updatedAt: result.updatedAt || new Date().toISOString(),
  }
}

async function updateSupplementAPI(id: string, data: Partial<Supplement>): Promise<void> {
  await apiPut(`/menu/supplements/${id}`, data)
}

async function deleteSupplementAPI(id: string): Promise<void> {
  await apiDelete(`/menu/supplements/${id}`)
}

async function createSupplementCategoryAPI(data: Omit<SupplementCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupplementCategory> {
  const result = await apiPost<SupplementCategory>('/menu/supplement-categories', data)
  return {
    ...result,
    id: (result as any)._id || result.id,
    createdAt: result.createdAt || new Date().toISOString(),
    updatedAt: result.updatedAt || new Date().toISOString(),
  }
}

async function updateSupplementCategoryAPI(id: string, data: Partial<SupplementCategory>): Promise<void> {
  await apiPut(`/menu/supplement-categories/${id}`, data)
}

async function deleteSupplementCategoryAPI(id: string): Promise<void> {
  await apiDelete(`/menu/supplement-categories/${id}`)
}

// ============================================
// INITIAL DATA
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

const initialMenuCategories: MenuCategory[] = []

const initialMenuItems: MenuItem[] = []

const initialSupplementCategories: SupplementCategory[] = []

const initialSupplements: Supplement[] = []

const initialOffers: Offer[] = []

const DATA_VERSION = "v2.0"

// NavItems that need stock management data (categories, products, batches, etc.)
const STOCK_MANAGEMENT_NAV_ITEMS = [
  "stock-categories",
  "sub-categories",
  "products",
  "storage-locations",
  "articles",
  "categories",
  "suppliers",
  "batches",
  "recipes",
  "showcases",
  "production",
  "showcase-stock",
] as const

// NavItems that need menu data (menu items, categories, offers, supplements)
const MENU_NAV_ITEMS = [
  "menu",
  "menu-client",
  "menu-admin",
  "supplements",
  "loyalty-cards",
  "client-fidelite",
] as const

// NavItems that need rewards data
const REWARDS_NAV_ITEMS = [
  "rewards",
] as const

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
  const { currentNavItem } = useNavigation()

  // Track what has been loaded to avoid reloading on nav away and back
  const [loadedData, setLoadedData] = useState({
    menu: false,
    stock: false,
    rewards: false,
    supplements: false,
    loyaltyCards: false,
  })
  // Track the last nav item that triggered menu loading
  const [lastMenuNavItem, setLastMenuNavItem] = useState<string | null>(null)

  // Helper to check if current nav item is in a list
  const isInNavItems = (navItems: readonly string[]) => {
    return navItems.includes(currentNavItem as any)
  }

  // Load menu data (menu categories, items, offers) - loaded for menu-related views
  useEffect(() => {
    if (!isInNavItems(MENU_NAV_ITEMS)) {
      return
    }

    // Allow re-load if navigating to a different menu-related page
    if (loadedData.menu && lastMenuNavItem === currentNavItem) {
      return
    }

    let cancelled = false

    const loadMenuData = async () => {
      try {
        // Always try API first (menu items are public), then fall back to localStorage
        let apiMenuCategories: MenuCategory[] = []
        let apiMenuItems: MenuItem[] = []
        
        try {
          apiMenuCategories = await fetchMenuCategories()
        } catch (catError) {
          console.warn("Failed to fetch menu categories from API:", catError)
        }
        
        if (apiMenuCategories.length === 0) {
          const storedCategories = localStorage.getItem("pastry-menu-categories")
          if (storedCategories) {
            setMenuCategories(JSON.parse(storedCategories))
          } else {
            setMenuCategories(initialMenuCategories)
          }
        } else if (!cancelled) {
          setMenuCategories(apiMenuCategories)
        }

        try {
          apiMenuItems = await fetchMenuItems()
        } catch (itemError) {
          console.warn("Failed to fetch menu items from API:", itemError)
        }
        
        if (apiMenuItems.length === 0) {
          const storedItems = localStorage.getItem("pastry-menu-items")
          if (storedItems) {
            setMenuItems(JSON.parse(storedItems))
          } else {
            setMenuItems(initialMenuItems)
          }
        } else if (!cancelled) {
          setMenuItems(apiMenuItems)
        }

        // Fetch offers from API based on context
        // Admin views (menu-admin, menu-client) use /menu/offers/all, client views use /menu/offers/current
        let apiOffers: Offer[] = []
        try {
          const isAdminView = currentNavItem === "menu-admin" || currentNavItem === "menu-client"
          apiOffers = await fetchOffers(isAdminView) // true = /menu/offers/all, false = /menu/offers/current
        } catch (offerError) {
          console.warn("Failed to fetch offers from API:", offerError)
        }
        
        if (apiOffers.length === 0) {
          const storedOffers = localStorage.getItem("pastry-offers")
          if (storedOffers) {
            setOffers(JSON.parse(storedOffers))
          } else {
            setOffers(initialOffers)
          }
        } else if (!cancelled) {
          setOffers(apiOffers)
        }

        // Save to localStorage for future use
        if (!cancelled) {
          localStorage.setItem("pastry-data-version", DATA_VERSION)
        }

        setLoadedData(prev => ({ ...prev, menu: true }))
        setLastMenuNavItem(currentNavItem)
      } catch (error) {
        console.error("Failed to load menu data:", error)
        if (!cancelled) {
          // Fall back to localStorage on error
          const storedCategories = localStorage.getItem("pastry-menu-categories")
          const storedItems = localStorage.getItem("pastry-menu-items")
          const storedOffers = localStorage.getItem("pastry-offers")
          setMenuCategories(storedCategories ? JSON.parse(storedCategories) : initialMenuCategories)
          setMenuItems(storedItems ? JSON.parse(storedItems) : initialMenuItems)
          setOffers(storedOffers ? JSON.parse(storedOffers) : initialOffers)
        }
      }
    }

    void loadMenuData()

    return () => {
      cancelled = true
    }
  }, [currentNavItem, loadedData.menu])

  // Load supplements data - loaded for menu-related views
  useEffect(() => {
    if (!isInNavItems(MENU_NAV_ITEMS)) {
      return
    }

    if (loadedData.supplements) {
      return
    }

    let cancelled = false

    const loadSupplementsData = async () => {
      try {
        const hasToken = !!localStorage.getItem(AUTH_TOKEN_KEY)

        // Always try to fetch supplements from API (public access allowed)
        let apiSupplements = await fetchSupplements(hasToken)
        if (apiSupplements.length === 0) {
          const storedSupplements = localStorage.getItem("pastry-supplements")
          if (storedSupplements) {
            setSupplements(JSON.parse(storedSupplements))
          } else {
            setSupplements(initialSupplements)
          }
        } else if (!cancelled) {
          setSupplements(apiSupplements)
        }

        // Always try to fetch supplement categories from API (public access allowed)
        let apiSupplementCategories = await fetchSupplementCategories()
          if (apiSupplementCategories.length === 0) {
            const storedCategories = localStorage.getItem("pastry-supplement-categories")
            if (storedCategories) {
              setSupplementCategories(JSON.parse(storedCategories))
            } else {
              setSupplementCategories(initialSupplementCategories)
            }
          } else if (!cancelled) {
            setSupplementCategories(apiSupplementCategories)
          }
        if (apiSupplementCategories.length === 0) {
          const storedCategories = localStorage.getItem("pastry-supplement-categories")
          if (storedCategories) {
            setSupplementCategories(JSON.parse(storedCategories))
          } else {
            setSupplementCategories(initialSupplementCategories)
          }
        } else if (!cancelled) {
          setSupplementCategories(apiSupplementCategories)
        }
      } catch (error) {
        console.error("Failed to load supplements data:", error)
        if (!cancelled) {
          const storedSupplements = localStorage.getItem("pastry-supplements")
          const storedCategories = localStorage.getItem("pastry-supplement-categories")
          setSupplements(storedSupplements ? JSON.parse(storedSupplements) : initialSupplements)
          setSupplementCategories(storedCategories ? JSON.parse(storedCategories) : initialSupplementCategories)
        }
      }
    }

    void loadSupplementsData()

    return () => {
      cancelled = true
    }
  }, [currentNavItem, loadedData.supplements])

  // Load stock management data (categories, products, batches, suppliers, etc.)
  useEffect(() => {
    if (!isInNavItems(STOCK_MANAGEMENT_NAV_ITEMS)) {
      return
    }

    if (loadedData.stock) {
      return
    }

    let cancelled = false

    const loadStockData = async () => {
      try {
        const hasToken = !!localStorage.getItem(AUTH_TOKEN_KEY)

        // Clean up old data version if needed
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
        }

        const [fetchedStockCategories, fetchedSubCategories, fetchedProducts, fetchedBatches, fetchedStorageLocations, fetchedSuppliers] = hasToken
          ? await Promise.all([
              fetchStockCategories(),
              fetchSubCategories(),
              fetchProducts(),
              fetchBatches(),
              fetchStorageLocations(),
              fetchSuppliers(),
            ])
          : [null, null, null, null, null, null]

        if (!cancelled) {
          setStockCategories(
            fetchedStockCategories ||
              (stored.stockCategories ? JSON.parse(stored.stockCategories) : initialStockCategories)
          )
          setSubCategories(
            fetchedSubCategories ||
              (stored.subCategories ? JSON.parse(stored.subCategories) : initialSubCategories)
          )
          setProducts(
            fetchedProducts ||
              (stored.products ? JSON.parse(stored.products) : initialProducts)
          )
          setBatches(
            fetchedBatches ||
              (stored.batches ? JSON.parse(stored.batches) : initialBatches)
          )
          setStorageLocations(
            fetchedStorageLocations ||
              (stored.storageLocations ? JSON.parse(stored.storageLocations) : initialStorageLocations)
          )
          setItems(stored.items ? JSON.parse(stored.items) : initialLegacyItems)
          setCategories(stored.categories ? JSON.parse(stored.categories) : initialLegacyCategories)
          setSuppliers(
            fetchedSuppliers ||
              (stored.suppliers ? JSON.parse(stored.suppliers) : initialSuppliers)
          )
        }

        setLoadedData(prev => ({ ...prev, stock: true }))
      } catch (error) {
        console.error("Failed to load stock data:", error)
      }
    }

    void loadStockData()

    return () => {
      cancelled = true
    }
  }, [currentNavItem, loadedData.stock])

  // Load rewards data - loaded for rewards view
  useEffect(() => {
    if (!isInNavItems(REWARDS_NAV_ITEMS)) {
      return
    }

    if (loadedData.rewards) {
      return
    }

    let cancelled = false

    const loadRewardsData = async () => {
      try {
        const hasToken = !!localStorage.getItem(AUTH_TOKEN_KEY)

        if (hasToken) {
          const apiRewards = await fetchRewards()
          if (!cancelled && apiRewards.length > 0) {
            setRewards(apiRewards)
          } else if (!cancelled && apiRewards.length === 0) {
            const storedRewards = localStorage.getItem("pastry-rewards")
            setRewards(storedRewards ? JSON.parse(storedRewards) : initialRewards)
          }
        } else {
          const storedRewards = localStorage.getItem("pastry-rewards")
          if (!cancelled) {
            setRewards(storedRewards ? JSON.parse(storedRewards) : initialRewards)
          }
        }

        setLoadedData(prev => ({ ...prev, rewards: true }))
      } catch (error) {
        console.error("Failed to load rewards data:", error)
        if (!cancelled) {
          setRewards(initialRewards)
        }
      }
    }

    void loadRewardsData()

    return () => {
      cancelled = true
    }
  }, [currentNavItem, loadedData.rewards])

  // ============================================
  // LOAD LOYALTY CARDS DATA (Offers and Products)
  // ============================================
  
  // Specific effect for loyalty-cards to fetch offers and menu items
  useEffect(() => {
    if (currentNavItem !== "loyalty-cards") {
      return
    }

    if (loadedData.loyaltyCards) {
      return
    }

    let cancelled = false

    const loadLoyaltyCardsData = async () => {
      try {
        const hasToken = !!localStorage.getItem(AUTH_TOKEN_KEY)
        
        // Fetch active offers for loyalty cards (client view - only current offers)
        let apiOffers: Offer[] = []
        try {
          apiOffers = await fetchOffers(false) // false = /menu/offers/current
          if (!cancelled && apiOffers.length > 0) {
            setOffers(apiOffers)
          } else if (!cancelled && apiOffers.length === 0) {
            const storedOffers = localStorage.getItem("pastry-offers")
            if (storedOffers) {
              setOffers(JSON.parse(storedOffers))
            }
          }
        } catch (offerError) {
          console.warn("Failed to fetch offers for loyalty cards:", offerError)
          if (!cancelled) {
            const storedOffers = localStorage.getItem("pastry-offers")
            if (storedOffers) {
              setOffers(JSON.parse(storedOffers))
            }
          }
        }
        
        // Fetch menu items (products) for loyalty cards
        let apiMenuItems: MenuItem[] = []
        try {
          apiMenuItems = await fetchMenuItems(hasToken) // include inactive if admin
          if (!cancelled && apiMenuItems.length > 0) {
            setMenuItems(apiMenuItems)
          } else if (!cancelled && apiMenuItems.length === 0) {
            const storedItems = localStorage.getItem("pastry-menu-items")
            if (storedItems) {
              setMenuItems(JSON.parse(storedItems))
            }
          }
        } catch (itemError) {
          console.warn("Failed to fetch menu items for loyalty cards:", itemError)
          if (!cancelled) {
            const storedItems = localStorage.getItem("pastry-menu-items")
            if (storedItems) {
              setMenuItems(JSON.parse(storedItems))
            }
          }
        }
        
        // Fetch menu categories
        let apiMenuCategories: MenuCategory[] = []
        try {
          apiMenuCategories = await fetchMenuCategories(hasToken)
          if (!cancelled && apiMenuCategories.length > 0) {
            setMenuCategories(apiMenuCategories)
          } else if (!cancelled && apiMenuCategories.length === 0) {
            const storedCategories = localStorage.getItem("pastry-menu-categories")
            if (storedCategories) {
              setMenuCategories(JSON.parse(storedCategories))
            }
          }
        } catch (catError) {
          console.warn("Failed to fetch menu categories for loyalty cards:", catError)
          if (!cancelled) {
            const storedCategories = localStorage.getItem("pastry-menu-categories")
            if (storedCategories) {
              setMenuCategories(JSON.parse(storedCategories))
            }
          }
        }
        
        // Fetch rewards if user is authenticated
        if (hasToken && !cancelled) {
          try {
            const apiRewards = await fetchRewards()
            if (apiRewards.length > 0) {
              setRewards(apiRewards)
            }
          } catch (rewardError) {
            console.warn("Failed to fetch rewards for loyalty cards:", rewardError)
          }
        }

        if (!cancelled) {
          setLoadedData(prev => ({ ...prev, loyaltyCards: true }))
        }
      } catch (error) {
        console.error("Failed to load loyalty cards data:", error)
        if (!cancelled) {
          setLoadedData(prev => ({ ...prev, loyaltyCards: true }))
        }
      }
    }

    void loadLoyaltyCardsData()

    return () => {
      cancelled = true
    }
  }, [currentNavItem, loadedData.loyaltyCards])

  // Save stock data to localStorage (only for non-menu data)
  useEffect(() => { if (stockCategories.length) localStorage.setItem("stock-categories", JSON.stringify(stockCategories)) }, [stockCategories])
  useEffect(() => { if (subCategories.length) localStorage.setItem("sub-categories", JSON.stringify(subCategories)) }, [subCategories])
  useEffect(() => { if (products.length) localStorage.setItem("stock-products", JSON.stringify(products)) }, [products])
  useEffect(() => { localStorage.setItem("stock-batches", JSON.stringify(batches)) }, [batches])
  useEffect(() => { if (storageLocations.length) localStorage.setItem("storage-locations", JSON.stringify(storageLocations)) }, [storageLocations])
  useEffect(() => { localStorage.setItem("pastry-stock", JSON.stringify(items)) }, [items])
  useEffect(() => { localStorage.setItem("pastry-categories", JSON.stringify(categories)) }, [categories])
  useEffect(() => { localStorage.setItem("pastry-suppliers", JSON.stringify(suppliers)) }, [suppliers])
  useEffect(() => { localStorage.setItem("pastry-rewards", JSON.stringify(rewards)) }, [rewards])
  useEffect(() => { if (menuCategories.length) localStorage.setItem("pastry-menu-categories", JSON.stringify(menuCategories)) }, [menuCategories])
  useEffect(() => { if (menuItems.length) localStorage.setItem("pastry-menu-items", JSON.stringify(menuItems)) }, [menuItems])
  useEffect(() => { if (offers.length) localStorage.setItem("pastry-offers", JSON.stringify(offers)) }, [offers])
  useEffect(() => { if (supplements.length) localStorage.setItem("pastry-supplements", JSON.stringify(supplements)) }, [supplements])
  useEffect(() => { if (supplementCategories.length) localStorage.setItem("pastry-supplement-categories", JSON.stringify(supplementCategories)) }, [supplementCategories])

  // Stock Category CRUD
  const addStockCategory = (cat: Omit<StockCategory, "id" | "createdAt" | "updatedAt">) => {
    void (async () => {
      try {
        const newCategory = await createStockCategoryAPI(cat)
        setStockCategories(prev => [...prev, newCategory])
      } catch (error) {
        console.error("Failed to create stock category:", error)
      }
    })()
  }

  const updateStockCategory = (id: string, updates: Partial<StockCategory>) => {
    void (async () => {
      try {
        await updateStockCategoryAPI(id, updates)
        setStockCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates, updatedAt: new Date().toISOString() } : cat))
      } catch (error) {
        console.error("Failed to update stock category:", error)
      }
    })()
  }

  const deleteStockCategory = (id: string) => {
    void (async () => {
      try {
        await deleteStockCategoryAPI(id)
        setStockCategories(prev => prev.filter(cat => cat.id !== id))
      } catch (error) {
        console.error("Failed to delete stock category:", error)
      }
    })()
  }

  // SubCategory CRUD
  const addSubCategory = (sub: Omit<SubCategory, "id" | "createdAt" | "updatedAt">) => {
    void (async () => {
      try {
        const newSubCategory = await createSubCategoryAPI(sub)
        setSubCategories(prev => [...prev, newSubCategory])
      } catch (error) {
        console.error("Failed to create subcategory:", error)
      }
    })()
  }

  const updateSubCategory = (id: string, updates: Partial<SubCategory>) => {
    void (async () => {
      try {
        await updateSubCategoryAPI(id, updates)
        setSubCategories(prev => prev.map(sub => sub.id === id ? { ...sub, ...updates, updatedAt: new Date().toISOString() } : sub))
      } catch (error) {
        console.error("Failed to update subcategory:", error)
      }
    })()
  }

  const deleteSubCategory = (id: string) => {
    void (async () => {
      try {
        await deleteSubCategoryAPI(id)
        setSubCategories(prev => prev.filter(sub => sub.id !== id))
      } catch (error) {
        console.error("Failed to delete subcategory:", error)
      }
    })()
  }

  const getSubCategoriesByCategoryId = (categoryId: string) => {
    return subCategories.filter(s => s.categoryId === categoryId).sort((a, b) => a.order - b.order)
  }

  // Product CRUD
  const addProduct = (product: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    void (async () => {
      try {
        const newProduct = await createProductAPI(product)
        setProducts(prev => [...prev, newProduct])
      } catch (error) {
        console.error("Failed to create product:", error)
      }
    })()
  }

  const updateProduct = (id: string, updates: Partial<Product>) => {
    void (async () => {
      try {
        await updateProductAPI(id, updates)
        setProducts(prev => prev.map(prod => prod.id === id ? { ...prod, ...updates, updatedAt: new Date().toISOString() } : prod))
      } catch (error) {
        console.error("Failed to update product:", error)
      }
    })()
  }

  const deleteProduct = (id: string) => {
    void (async () => {
      try {
        await deleteProductAPI(id)
        setBatches(prev => prev.filter(b => b.productId !== id))
        setProducts(prev => prev.filter(prod => prod.id !== id))
      } catch (error) {
        console.error("Failed to delete product:", error)
      }
    })()
  }

  const getProductsBySubCategoryId = (subCategoryId: string) => {
    return products.filter(p => p.subCategoryId === subCategoryId)
  }

  const getProductStock = (productId: string) => {
    return batches.filter(b => b.productId === productId).reduce((sum, b) => sum + b.quantity, 0)
  }

  // Storage Location CRUD
  const addStorageLocation = (loc: Omit<StorageLocation, "id" | "createdAt" | "updatedAt">) => {
    void (async () => {
      try {
        const newLocation = await createStorageLocationAPI(loc)
        setStorageLocations(prev => [...prev, newLocation])
      } catch (error) {
        console.error("Failed to create storage location:", error)
      }
    })()
  }

  const updateStorageLocation = (id: string, updates: Partial<StorageLocation>) => {
    void (async () => {
      try {
        await updateStorageLocationAPI(id, updates)
        setStorageLocations(prev => prev.map(loc => loc.id === id ? { ...loc, ...updates, updatedAt: new Date().toISOString() } : loc))
      } catch (error) {
        console.error("Failed to update storage location:", error)
      }
    })()
  }

  const deleteStorageLocation = (id: string) => {
    void (async () => {
      try {
        await deleteStorageLocationAPI(id)
        setStorageLocations(prev => prev.filter(loc => loc.id !== id))
      } catch (error) {
        console.error("Failed to delete storage location:", error)
      }
    })()
  }

  const getActiveStorageLocations = () => {
    return storageLocations.filter(loc => loc.isActive)
  }

  // Batch CRUD
  const addBatch = (batch: Omit<Batch, "id" | "createdAt" | "updatedAt">) => {
    void (async () => {
      try {
        const newBatch = await createBatchAPI(batch)
        setBatches(prev => [...prev, newBatch])
      } catch (error) {
        console.error("Failed to create batch:", error)
      }
    })()
  }

  const updateBatch = (id: string, updates: Partial<Batch>) => {
    void (async () => {
      try {
        await updateBatchAPI(id, updates)
        setBatches(prev => prev.map(b => b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b))
      } catch (error) {
        console.error("Failed to update batch:", error)
      }
    })()
  }

  const deleteBatch = (id: string) => {
    void (async () => {
      try {
        await deleteBatchAPI(id)
        setBatches(prev => prev.filter(b => b.id !== id))
      } catch (error) {
        console.error("Failed to delete batch:", error)
      }
    })()
  }

  const openBatch = (id: string, openingDate: string) => {
    const batch = batches.find(b => b.id === id)
    if (!batch) return

    const product = products.find(p => p.id === batch.productId)
    void (async () => {
      try {
        await openBatchAPI(id, openingDate, product?.shelfLifeAfterOpening)

        if (!product?.shelfLifeAfterOpening) {
          setBatches(prev => prev.map(b =>
            b.id === id ? { ...b, isOpened: true, openingDate, updatedAt: new Date().toISOString() } : b
          ))
          return
        }

        const expDate = new Date(openingDate)
        expDate.setDate(expDate.getDate() + product.shelfLifeAfterOpening)

        setBatches(prev => prev.map(b =>
          b.id === id
            ? {
                ...b,
                isOpened: true,
                openingDate,
                expirationAfterOpening: expDate.toISOString().split("T")[0],
                updatedAt: new Date().toISOString(),
              }
            : b
        ))
      } catch (error) {
        console.error("Failed to open batch:", error)
      }
    })()
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
    const now = new Date().toISOString()

    const updates: { id: string; quantity: number }[] = []

    for (const batch of activeBatches) {
      if (remaining <= 0) break

      if (batch.quantity >= remaining) {
        updates.push({ id: batch.id, quantity: batch.quantity - remaining })
        remaining = 0
      } else {
        remaining -= batch.quantity
        updates.push({ id: batch.id, quantity: 0 })
      }
    }

    if (updates.length === 0) return

    setBatches(prev => prev.map(batch => {
      const update = updates.find(item => item.id === batch.id)
      return update ? { ...batch, quantity: update.quantity, updatedAt: now } : batch
    }))

    updates.forEach(update => {
      void updateBatchAPI(update.id, { quantity: update.quantity })
    })
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
    void (async () => {
      try {
        const newSupplier = await createSupplierAPI(supplier)
        setSuppliers(prev => [...prev, newSupplier])
      } catch (error) {
        console.error("Failed to create supplier:", error)
      }
    })()
  }

  const updateSupplier = (id: string, updates: Partial<Omit<Supplier, "id" | "createdAt">>) => {
    void (async () => {
      try {
        await updateSupplierAPI(id, updates)
        setSuppliers(prev => prev.map(sup => sup.id === id ? { ...sup, ...updates, updatedAt: new Date().toISOString() } : sup))
      } catch (error) {
        console.error("Failed to update supplier:", error)
      }
    })()
  }

  const deleteSupplier = (id: string) => {
    void (async () => {
      try {
        await deleteSupplierAPI(id)
        setSuppliers(prev => prev.filter(sup => sup.id !== id))
      } catch (error) {
        console.error("Failed to delete supplier:", error)
      }
    })()
  }

  const getLowStockItems = () => items.filter(item => item.quantity <= item.minQuantity)

  // Menu CRUD with API
  const addMenuCategory = async (category: Omit<MenuCategory, "id">) => {
    try {
      const newCategory = await createMenuCategoryAPI(category)
      setMenuCategories(prev => [...prev, newCategory])
    } catch (error) {
      console.error("Failed to create menu category:", error)
      const newCat: MenuCategory = { ...category, id: Date.now().toString() }
      setMenuCategories(prev => [...prev, newCat])
    }
  }

  const updateMenuCategory = async (id: string, updates: Partial<MenuCategory>) => {
    try {
      await updateMenuCategoryAPI(id, updates)
      setMenuCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat))
    } catch (error) {
      console.error("Failed to update menu category:", error)
      setMenuCategories(prev => prev.map(cat => cat.id === id ? { ...cat, ...updates } : cat))
    }
  }

  const deleteMenuCategory = async (id: string) => {
    try {
      await deleteMenuCategoryAPI(id)
      setMenuCategories(prev => prev.filter(cat => cat.id !== id))
    } catch (error) {
      console.error("Failed to delete menu category:", error)
      setMenuCategories(prev => prev.filter(cat => cat.id !== id))
    }
  }

  const addMenuItem = async (item: Omit<MenuItem, "id" | "createdAt" | "updatedAt">) => {
    try {
      const formData = new FormData()
      formData.append('name', item.name)
      formData.append('description', item.description)
      formData.append('price', item.price.toString())
      if (item.points !== undefined) formData.append('points', item.points.toString())
      formData.append('categoryId', item.category)
      formData.append('allergens', JSON.stringify(item.allergens || []))
      formData.append('isAvailable', String(item.isAvailable))
      if (item.image instanceof File) {
        formData.append('imageFile', item.image)
      } else if (item.image && typeof item.image === 'string') {
        formData.append('image', item.image)
      }
      if (item.availableSupplements) {
        formData.append('availableSupplements', JSON.stringify(item.availableSupplements))
      } else if (item.supplements) {
        formData.append('supplements', JSON.stringify(item.supplements))
      }
      if (item.promotion) {
        formData.append('promotion', JSON.stringify(item.promotion))
      }

      const newItem = await createMenuItemAPI(formData)
      setMenuItems(prev => [...prev, {
        ...newItem,
        id: (newItem as any)._id || newItem.id,
        category: (newItem as any).categoryId || newItem.category,
        availableSupplements: (newItem as any).availableSupplements || (newItem as any).supplements || [],
        createdAt: newItem.createdAt || new Date().toISOString(),
        updatedAt: newItem.updatedAt || new Date().toISOString(),
      }])
    } catch (error) {
      console.error("Failed to create menu item:", error)
      const newItem: MenuItem = {
        ...item,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setMenuItems(prev => [...prev, newItem])
    }
  }

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    try {
      const formData = new FormData()
      if (updates.name !== undefined) formData.append('name', updates.name)
      if (updates.description !== undefined) formData.append('description', updates.description)
      if (updates.price !== undefined) formData.append('price', updates.price.toString())
      if (updates.points !== undefined) formData.append('points', updates.points.toString())
      if (updates.category !== undefined) formData.append('categoryId', updates.category)
      if (updates.allergens !== undefined) formData.append('allergens', JSON.stringify(updates.allergens))
      if (updates.isAvailable !== undefined) formData.append('isAvailable', String(updates.isAvailable))
      if (updates.image instanceof File) {
        formData.append('imageFile', updates.image)
      } else if (updates.image === undefined || updates.image === null) {
        formData.append('removeImage', 'true')
      }
      if (updates.availableSupplements !== undefined) {
        formData.append('availableSupplements', JSON.stringify(updates.availableSupplements))
      } else if (updates.supplements !== undefined) {
        formData.append('supplements', JSON.stringify(updates.supplements))
      }
      if (updates.promotion !== undefined) {
        formData.append('promotion', JSON.stringify(updates.promotion))
      }

      await updateMenuItemAPI(id, formData)
      setMenuItems(prev => prev.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    } catch (error) {
      console.error("Failed to update menu item:", error)
      setMenuItems(prev => prev.map(item => item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    }
  }

  const deleteMenuItem = async (id: string) => {
    try {
      await deleteMenuItemAPI(id)
      setMenuItems(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error("Failed to delete menu item:", error)
      setMenuItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const toggleMenuItemAvailability = async (id: string) => {
    try {
      await toggleMenuItemAvailabilityAPI(id)
      setMenuItems(prev => prev.map(item => 
        item.id === id ? { ...item, isAvailable: !item.isAvailable, updatedAt: new Date().toISOString() } : item
      ))
    } catch (error) {
      console.error("Failed to toggle availability:", error)
    }
  }

  // Rewards CRUD
  const addReward = async (reward: Omit<Reward, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newReward = await createRewardAPI(reward)
      setRewards(prev => [newReward, ...prev])
    } catch (error) {
      console.error("Failed to create reward:", error)
      const newReward: Reward = {
        ...reward,
        id: `r${Date.now()}`,
        imageFile: undefined,
        removeImage: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setRewards(prev => [newReward, ...prev])
    }
  }

  const updateReward = async (id: string, updates: Partial<Reward>) => {
    try {
      await updateRewardAPI(id, updates)
      setRewards(prev => prev.map(r => r.id === id ? { ...r, ...updates, imageFile: undefined, removeImage: false, updatedAt: new Date().toISOString() } : r))
    } catch (error) {
      console.error("Failed to update reward:", error)
      setRewards(prev => prev.map(r => r.id === id ? { ...r, ...updates, imageFile: undefined, removeImage: false, updatedAt: new Date().toISOString() } : r))
    }
  }

  const deleteReward = async (id: string) => {
    try {
      await deleteRewardAPI(id)
      setRewards(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error("Failed to delete reward:", error)
      setRewards(prev => prev.filter(r => r.id !== id))
    }
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

  // Offers CRUD with API
  const addOffer = async (offer: Omit<Offer, "id" | "createdAt" | "updatedAt">) => {
    try {
      const newOffer = await createOfferAPI(offer)
      setOffers(prev => [...prev, { ...newOffer, createdAt: newOffer.createdAt || new Date().toISOString(), updatedAt: newOffer.updatedAt || new Date().toISOString() }])
    } catch (error) {
      console.error("Failed to create offer:", error)
      const newOffer: Offer = {
        ...offer,
        id: `offer-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setOffers(prev => [...prev, newOffer])
    }
  }

  const updateOffer = async (id: string, updates: Partial<Offer>) => {
    try {
      await updateOfferAPI(id, updates)
      setOffers(prev => prev.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o))
    } catch (error) {
      console.error("Failed to update offer:", error)
      setOffers(prev => prev.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o))
    }
  }

  const deleteOffer = async (id: string) => {
    try {
      await deleteOfferAPI(id)
      setOffers(prev => prev.filter(o => o.id !== id))
    } catch (error) {
      console.error("Failed to delete offer:", error)
      setOffers(prev => prev.filter(o => o.id !== id))
    }
  }

  const getActiveOffers = () => offers.filter(o => o.isActive)

  // Show all active offers (no date filtering)
  const getCurrentOffers = () => offers.filter(o => o.isActive)

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
        toggleMenuItemAvailability,
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