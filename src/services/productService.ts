import type { Product } from '../types/product'
import { MASTER_PRODUCTS } from '../data/products'
import {
  collection,
  getDocs,
  addDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'

const COLLECTION_NAME = 'products'

// In-memory cache so synchronous getProductById/getActiveProducts still work
// while Firestore loads. Initialised with the hardcoded seed list.
let cachedProducts: Product[] = [...MASTER_PRODUCTS]

// Subscribe to Firestore products collection (real-time)
export function subscribeToProducts(callback?: (products: Product[]) => void) {
  const q = query(collection(db, COLLECTION_NAME), orderBy('name', 'asc'))
  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        // Firestore empty — keep using MASTER_PRODUCTS seed
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
  const snapshot = await getDocs(collection(db, COLLECTION_NAME))
  if (snapshot.empty) return [...MASTER_PRODUCTS]
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Product, 'id'>),
  }))
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

// Seed products to Firestore if collection is empty
export async function seedProducts(): Promise<void> {
  const snapshot = await getDocs(collection(db, COLLECTION_NAME))
  if (!snapshot.empty) return
  for (const product of MASTER_PRODUCTS) {
    const { id: _, ...data } = product
    await addDoc(collection(db, COLLECTION_NAME), data)
  }
}

// Synchronous accessors (use cached data)
export function getActiveProducts(): Product[] {
  return cachedProducts.filter((p) => p.active)
}

export function getProductById(id: string): Product | undefined {
  return cachedProducts.find((p) => p.id === id)
}
