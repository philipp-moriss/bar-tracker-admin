import { initializeApp } from "firebase/app";

const firebaseConfig = {
    apiKey: "AIzaSyDHfykF7XpzphSjmN5hzvyNwGaAIBBRbf0",
    authDomain: "react-native-bartrekker.firebaseapp.com",
    databaseURL:
      "https://react-native-bartrekker-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "react-native-bartrekker",
    storageBucket: "react-native-bartrekker.appspot.com",
    messagingSenderId: "13802647695",
    appId: "1:13802647695:web:bb7d483388a29a52a840fa",
    measurementId: "G-18T9PMJK8V",
  };

  // Initialize Firebase
export const fierbaseApp = initializeApp(firebaseConfig);