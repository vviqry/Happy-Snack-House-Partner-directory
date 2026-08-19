import type { Product } from '../types/product'
import { MASTER_PRODUCTS } from '../data/products'
import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION_NAME = 'products'

// In-memory cache so synchronous getProductById/getActiveProducts still work
let cachedProducts: Product[] = [...MASTER_PRODUCTS]

// Subscribe to Firestore products collection (real-time)
export function subscribeToProducts(callback?: (products: Product[]) => void) {
  const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        cachedProducts = [...MASTER_PRODUCTS]
      } else {
        cachedProducts = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Product, 'id'>),
        }))
      }
      callback?.(cachedProducts)
    },
    (error) => {
      console.error('Product subscription error:', error)
    }
  )
}

// Fetch once
export async function fetchProducts(): Promise<Product[]> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME))
    if (snapshot.empty) return [...MASTER_PRODUCTS]
    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Product, 'id'>),
    }))
  } catch (err) {
    console.error('Error fetching products:', err)
    return cachedProducts
  }
}

// Add a new product to Firestore
export async function addProduct(name: string, image?: string): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    name: name.trim(),
    image: image?.trim() || '',
    active: true,
  })
  return docRef.id
}

// Delete a product from Firestore
export async function deleteProduct(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, id)
    await deleteDoc(docRef)
  } catch (err) {
    console.error('Error deleting product from Firestore:', err)
  }
  cachedProducts = cachedProducts.filter((p) => p.id !== id)
}

// Seed products to Firestore if collection is empty
export async function seedProducts(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME))
    if (!snapshot.empty) return
    for (const product of MASTER_PRODUCTS) {
      const { id, ...data } = product
      await setDoc(doc(db, COLLECTION_NAME, id), data)
    }
  } catch (err) {
    console.error('Error seeding products:', err)
  }
}

// Synchronous accessors (use cached data)
export function getActiveProducts(): Product[] {
  return cachedProducts.filter((p) => p.active)
}

export function getProductById(id: string): Product | undefined {
  if (!id) return undefined

  // 1. Direct match by id in cache
  const found = cachedProducts.find((p) => p.id === id)
  if (found) return found

  // 2. Direct match in MASTER_PRODUCTS
  const masterFound = MASTER_PRODUCTS.find((p) => p.id === id)
  if (masterFound) {
    // If master product found, prefer matching cached product with same name if available
    const matchInCache = cachedProducts.find(
      (p) => p.name.trim().toLowerCase() === masterFound.name.trim().toLowerCase()
    )
    return matchInCache || masterFound
  }

  // 3. Fallback: match by normalized name or slug (e.g. 'fruity-candy' vs 'Fruity Candy')
  const normalizedId = id.toLowerCase().replace(/[^a-z0-9]/g, '')
  const byNormalizedCache = cachedProducts.find((p) => {
    const normName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const normId = p.id.toLowerCase().replace(/[^a-z0-9]/g, '')
    return normName === normalizedId || normId === normalizedId
  })
  if (byNormalizedCache) return byNormalizedCache

  return MASTER_PRODUCTS.find((p) => {
    const normName = p.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const normId = p.id.toLowerCase().replace(/[^a-z0-9]/g, '')
    return normName === normalizedId || normId === normalizedId
  })
}

