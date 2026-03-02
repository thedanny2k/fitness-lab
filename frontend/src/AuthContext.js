// src/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthChange, loginUser, registerUser, logoutUser, getProfile } from "./firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const p = await getProfile();
          setProfile(p);
        } catch {
          setProfile({ xp: 0, streak: 0 });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login    = (email, pw) => loginUser(email, pw);
  const register = (email, pw) => registerUser(email, pw);
  const logout   = ()          => logoutUser();

  const refreshProfile = async () => {
    if (user) setProfile(await getProfile());
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
