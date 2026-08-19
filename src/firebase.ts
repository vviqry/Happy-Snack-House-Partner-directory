import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAPM5wXI3-9nxA6ZjinbO6rCEzFmEUGAOk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hsh-partner-directory.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hsh-partner-directory",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hsh-partner-directory.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "628809448883",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:628809448883:web:1f622a4ae93a5a7c3d1fc6",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ET3ZNQ65FT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
