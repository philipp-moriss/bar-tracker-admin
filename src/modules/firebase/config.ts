import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

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

// Initialize Auth
export const auth = getAuth(firebaseApp);

// Initialize Analytics 
export const analytics = typeof window !== 'undefined' ? getAnalytics(firebaseApp) : null;

// Initialize Storage
export const storage = getStorage(firebaseApp);