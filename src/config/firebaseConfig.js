import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: "AIzaSyBTb3HewrmF9XFt0feCiBQ3IqySv5UYfAI",
    authDomain: "fincio-a44bb.firebaseapp.com",
    projectId: "fincio-a44bb",
    storageBucket: "fincio-a44bb.firebasestorage.app",
    messagingSenderId: "1068480197954",
    appId: "1:1068480197954:web:6a1ca162d659b122ae44db"
};

// Firebase'i başlat (eğer zaten başlatılmadıysa)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth - eğer zaten başlatıldıysa getAuth kullan
let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} catch (error) {
    // Zaten başlatıldıysa mevcut auth'u al
    auth = getAuth(app);
}

// Firestore
export const db = getFirestore(app);
export { auth };
export default app;
