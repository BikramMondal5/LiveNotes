import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || (projectId ? `https://${projectId}-default-rtdb.asia-southeast1.firebasedatabase.app` : ""),
    projectId: projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""
};

let app: FirebaseApp | null = null;
let db: Database | null = null;

if (firebaseConfig.apiKey && firebaseConfig.databaseURL) {
    try {
        app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
        db = getDatabase(app);
    } catch (error) {
        console.error("Failed to initialize Firebase Realtime Database:", error);
    }
} else if (typeof window !== "undefined") {
    console.warn(
        "Firebase environment variables are missing. Please configure NEXT_PUBLIC_FIREBASE_DATABASE_URL and related keys in your .env.local"
    );
}

export { app, db };

