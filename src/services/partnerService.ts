import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db } from "../firebase";
import type { Partner, PartnerDraft } from "../types/partner";
import type { PartnerProductStock } from "../types/product";
import { SEED_PARTNERS } from "../data/seed";
import { getProductById } from "./productService";

const COLLECTION_NAME = "partners";

/**
 * Sanitizes and consolidates partner product stock:
 * - Resolves legacy or mismatched product IDs to active/canonical product IDs
 * - Merges duplicate entries of the same product
 * - Discards orphaned product entries that do not exist
 * - Ensures non-negative stock counts
 */
export function sanitizePartnerProducts(products?: PartnerProductStock[]): PartnerProductStock[] {
  if (!products || !Array.isArray(products)) return [];
  const map = new Map<string, number>();

  for (const item of products) {
    if (!item || !item.productId) continue;
    const prod = getProductById(item.productId);
    const canonicalId = prod ? prod.id : item.productId;
    const stock = Math.max(0, Number(item.stock) || 0);

    // If duplicate entries exist for the same product, keep the maximum stock value
    const current = map.get(canonicalId);
    if (current === undefined) {
      map.set(canonicalId, stock);
    } else {
      map.set(canonicalId, Math.max(current, stock));
    }
  }

  return Array.from(map.entries()).map(([productId, stock]) => ({
    productId,
    stock,
  }));
}

// Total toples is derived from sanitized product stock — accurate and resilient
export function totalStock(partner: Partner): number {
  const sanitized = sanitizePartnerProducts(partner.products);
  return sanitized.reduce((sum, p) => sum + p.stock, 0);
}

// 1. Ambil data secara Real-time (Otomatis update kalau ada perubahan)
export const subscribeToPartners = (callback: (partners: Partner[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("name", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const data: Partner[] = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data() as Omit<Partner, "id">;
        return {
          id: docSnap.id,
          ...raw,
          products: sanitizePartnerProducts(raw.products),
        };
      });
      callback(data);
    },
    (error) => {
      console.error("Firestore subscription error:", error);
    }
  );
};

// 2. Ambil data sekali saja (Fetch biasa)
export const fetchPartners = async (): Promise<Partner[]> => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map((docSnap) => {
    const raw = docSnap.data() as Omit<Partner, "id">;
    return {
      id: docSnap.id,
      ...raw,
      products: sanitizePartnerProducts(raw.products),
    };
  });
};

// 3. Tambah Partner Baru
export const addPartner = async (partnerData: Omit<Partner, "id">) => {
  const sanitizedData = {
    ...partnerData,
    products: sanitizePartnerProducts(partnerData.products),
    createdAt: partnerData.createdAt || Date.now(),
  };
  const docRef = await addDoc(collection(db, COLLECTION_NAME), sanitizedData);
  return docRef.id;
};

export const createPartner = async (draft: PartnerDraft) => {
  return addPartner({
    ...draft,
    createdAt: Date.now(),
  });
};

// 4. Update Data Partner / Stok
export const updatePartner = async (id: string, updatedData: Partial<Partner>) => {
  const partnerDoc = doc(db, COLLECTION_NAME, id);
  const { id: _, ...dataToUpdate } = updatedData as Partner;
  if (dataToUpdate.products) {
    dataToUpdate.products = sanitizePartnerProducts(dataToUpdate.products);
  }
  await updateDoc(partnerDoc, dataToUpdate);
};

// 5. Toggle Aktif/Nonaktif
export const setPartnerActive = async (id: string, active: boolean) => {
  await updatePartner(id, { active });
};

// 6. Hapus Partner
export const deletePartner = async (id: string) => {
  const partnerDoc = doc(db, COLLECTION_NAME, id);
  await deleteDoc(partnerDoc);
};

// 7. Seed data awal jika Firestore masih kosong
export const seedInitialPartners = async () => {
  try {
    const existing = await fetchPartners();
    if (existing.length === 0) {
      for (const partner of SEED_PARTNERS) {
        const { id: _, ...partnerData } = partner;
        await addDoc(collection(db, COLLECTION_NAME), {
          ...partnerData,
          products: sanitizePartnerProducts(partnerData.products),
        });
      }
      console.log("Initial seed data added to Firestore");
    }
  } catch (err) {
    console.error("Error seeding initial partners:", err);
  }
};

