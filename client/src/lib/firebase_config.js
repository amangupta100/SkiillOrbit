"use client";
// lib/firebase-config.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration (updated with new apiKey)
const firebaseConfig = {
  apiKey: "AIzaSyB4dkZ6O7wmTGS0qleumCdK10uWU5Fgme0",
  authDomain: "munch-app-45785.firebaseapp.com",
  projectId: "munch-app-45785",
  storageBucket: "munch-app-45785.appspot.com",
  messagingSenderId: "167961984491",
  appId: "1:167961984491:web:8c71c081b14f22c1b8edae",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { auth };
