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
import { SEED_PARTNERS } from "../data/seed";

const COLLECTION_NAME = "partners";

// Total toples is always derived from product stock — never stored as a separate number
export function totalStock(partner: Partner): number {
  if (!partner.products || !Array.isArray(partner.products)) return 0;
  return partner.products.reduce((sum, p) => sum + Math.max(0, p.stock), 0);
}

// 1. Ambil data secara Real-time (Otomatis update kalau ada perubahan)
export const subscribeToPartners = (callback: (partners: Partner[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("name", "asc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const data: Partner[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Partner, "id">),
      }));
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
  return querySnapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<Partner, "id">),
  }));
};

// 3. Tambah Partner Baru
export const addPartner = async (partnerData: Omit<Partner, "id">) => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...partnerData,
    createdAt: partnerData.createdAt || Date.now(),
  });
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
        await addDoc(collection(db, COLLECTION_NAME), partnerData);
      }
      console.log("Initial seed data added to Firestore");
    }
  } catch (err) {
    console.error("Error seeding initial partners:", err);
  }
};
