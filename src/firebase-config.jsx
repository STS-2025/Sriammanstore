// Firebase config and initialization
import { getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyDTzovF1RChmczvRXTNtY9-i-cOTI2JAuQ",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "sri-amman-smart-store.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "sri-amman-smart-store",
  storageBucket: "sri-amman-smart-store.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_PROJECT_NUMBER || "1018585256480",
  appId: "1:1018585256480:web:1312d2d636b0672098a245",
  measurementId: "G-7D1TG59XVM"
};

const app =
  getApps().find((firebaseApp) => firebaseApp.name === "[DEFAULT]") ??
  initializeApp(firebaseConfig);
// Use Firebase's standard browser Auth initialization so popup sign-in gets
// its popup resolver. Explicitly use browser-local persistence so the
// authenticated customer remains signed in after a full page refresh.
export const auth = getAuth(app);
void setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn("Could not enable persistent Firebase Auth storage:", error);
});
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
export { app };
