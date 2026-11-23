import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/services';
import type { AuthResponse, LoginRequest, RegisterRequest, UserProfile } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<AuthResponse>;
  register: (payload: RegisterRequest) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('rescueflow_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const raw = localStorage.getItem('rescueflow_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState<boolean>(!!localStorage.getItem('rescueflow_token'));

  const persistAuth = (auth: AuthResponse) => {
    localStorage.setItem('rescueflow_token', auth.token);
    const profile: UserProfile = {
      userId: auth.userId,
      fullName: auth.fullName,
      email: auth.email,
      role: auth.role,
      isActive: true
    };
    localStorage.setItem('rescueflow_user', JSON.stringify(profile));
    setToken(auth.token);
    setUser(profile);
  };

  const logout = () => {
    localStorage.removeItem('rescueflow_token');
    localStorage.removeItem('rescueflow_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!localStorage.getItem('rescueflow_token')) {
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
      localStorage.setItem('rescueflow_user', JSON.stringify(me));
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (payload: LoginRequest) => {
    const res = await authApi.login(payload);
    persistAuth(res);
    return res;
  };

  const register = async (payload: RegisterRequest) => {
    const res = await authApi.register(payload);
    persistAuth(res);
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
