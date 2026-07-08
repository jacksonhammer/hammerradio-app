import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeAuth, getUserProfile } from '../services/authService';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(undefined); // undefined = loading
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const unsub = subscribeAuth(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const prof = await getUserProfile(firebaseUser.uid);
          setProfile(prof);
        } catch (_) {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Refresh profile from Firestore (call after profile edits)
  const refreshProfile = async () => {
    if (user) {
      const prof = await getUserProfile(user.uid);
      setProfile(prof);
    }
  };

  const value = { user, profile, loading, refreshProfile };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
