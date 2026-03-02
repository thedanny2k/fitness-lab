// src/firebase.js
// Firebase client SDK — auth, Firestore, and API helper

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ─── Replace with your Firebase project config ───────────────────────────────
// Firebase Console → Project Settings → Your Apps → SDK setup
const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export const registerUser = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);

export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

export const onAuthChange = (callback) =>
  onAuthStateChanged(auth, callback);

// ─── API helper — attaches Bearer token to every request ─────────────────────

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

export async function apiFetch(path, options = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export const getWorkouts    = ()       => apiFetch("/api/workouts");
export const logWorkout     = (data)   => apiFetch("/api/workouts", { method: "POST",   body: JSON.stringify(data) });
export const deleteWorkout  = (id)     => apiFetch(`/api/workouts/${id}`, { method: "DELETE" });

export const getNutrition   = ()       => apiFetch("/api/nutrition");
export const logNutrition   = (data)   => apiFetch("/api/nutrition", { method: "POST",  body: JSON.stringify(data) });

export const getProfile     = ()       => apiFetch("/api/profile");
export const updateProfile  = (data)   => apiFetch("/api/profile",  { method: "PUT",   body: JSON.stringify(data) });

export const getLeaderboard = ()       => apiFetch("/api/leaderboard");
