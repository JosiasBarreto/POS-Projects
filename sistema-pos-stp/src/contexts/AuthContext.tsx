import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CashierSession, Store } from '../types';

interface AuthContextType {
  user: User | null;
  session: CashierSession | null;
  store: Store | null;
  pendingExchange: { sale_id: number; total_credit: number } | null;
  login: (user: User) => void;
  logout: () => void;
  setSession: (session: CashierSession | null) => void;
  setPendingExchange: (exchange: { sale_id: number; total_credit: number } | null) => void;
  refreshStore: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pos_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [session, setSession] = useState<CashierSession | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [pendingExchange, setPendingExchange] = useState<{ sale_id: number; total_credit: number } | null>(null);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('pos_user', JSON.stringify(userData));
  };

  const logout = () => {
    if (session) {
      console.warn("Tentativa de logout com caixa aberto bloqueada.");
      return;
    }
    setUser(null);
    setSession(null);
    setPendingExchange(null);
    localStorage.removeItem('pos_user');
  };

  const refreshStore = async () => {
    try {
      const res = await fetch('/api/store');
      const data = await res.json();
      setStore(data);
    } catch (err) {
      console.error("Failed to fetch store info", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetch(`/api/sessions/active/${user.id}`)
        .then(res => res.json())
        .then(data => setSession(data));
    }
    refreshStore();
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      store, 
      pendingExchange,
      login, 
      logout, 
      setSession, 
      setPendingExchange,
      refreshStore 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
