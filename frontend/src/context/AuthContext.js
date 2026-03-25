import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext(null);
const TOKEN_KEY = 'finance_token';
const USER_KEY  = 'finance_user';

export function AuthProvider({ children }) {
   const [token, setToken]     = useState(null);
   const [user, setUser]       = useState(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      (async () => {
         try {
         const t = await AsyncStorage.getItem(TOKEN_KEY);
         const u = await AsyncStorage.getItem(USER_KEY);
         if (t && u) { setToken(t); setUser(JSON.parse(u)); }
         } catch (e) { console.warn(e); }
         finally { setLoading(false); }
      })();
   }, []);

   async function login(tokenVal, userData) {
      await AsyncStorage.setItem(TOKEN_KEY, tokenVal);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      setToken(tokenVal); setUser(userData);
   }

   async function logout() {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      setToken(null); setUser(null);
   }

   return (
      <AuthContext.Provider value={{ token, user, loading, isLoggedIn: !!token, login, logout }}>
         {children}
      </AuthContext.Provider>
   );
}

export function useAuth() {
   const ctx = useContext(AuthContext);
   if (!ctx) throw new Error('useAuth must be inside AuthProvider');
   return ctx;
}