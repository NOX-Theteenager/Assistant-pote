import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// TODO: Replace with your actual Firebase project config
// Get this from: Firebase Console -> Project Settings -> General -> Your Apps -> Web App
const firebaseConfig = {
  apiKey: "AIzaSyBvPjMro30Wfk4XMus9enzciyM5o_ym5y8",
  authDomain: "budget-buddy-b58b3.firebaseapp.com",
  projectId: "budget-buddy-b58b3",
  storageBucket: "budget-buddy-b58b3.firebasestorage.app",
  messagingSenderId: "63140701307",
  appId: "1:63140701307:web:92ce4390610b0a2412eede",
  measurementId: "G-CHS8TCCMRL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

console.log("Firebase initialized");
