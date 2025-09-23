import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDHfykF7XpzphSjmN5hzvyNwGaAIBBRbf0",
  authDomain: "react-native-bartrekker.firebaseapp.com",
  databaseURL: "https://react-native-bartrekker-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "react-native-bartrekker",
  storageBucket: "react-native-bartrekker.appspot.com",
  messagingSenderId: "13802647695",
  appId: "1:13802647695:web:bb7d483388a29a52a840fa",
  measurementId: "G-18T9PMJK8V"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(firebaseApp);
if (import.meta.env.DEV) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (e) {
    // ignore double-connect on HMR
  }
}

// Initialize Auth
export const auth = getAuth(firebaseApp);

// Initialize Analytics 
export const analytics = typeof window !== 'undefined' ? getAnalytics(firebaseApp) : null;

// Initialize Storage
export const storage = getStorage(firebaseApp);

// Initialize Functions
export const functions = getFunctions(firebaseApp, 'us-central1');

// Connect to Functions emulator in development
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}