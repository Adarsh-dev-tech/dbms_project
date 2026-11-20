import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, getStoredToken, setStoredToken } from '../api/client';
import { AuthResponseData, SubscriptionDetails, User } from '../types';

interface RegisterPayload {
  orgName: string;
  orgContactName: string;
  orgEmail: string;
  orgMobileNo: string;
  password: string;
  address?: string;
  pincode?: number;
}

interface AuthContextValue {
  user: User | null;
  menus: string[];
  subscription: boolean;
  subscriptionDetails: SubscriptionDetails | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [menus, setMenus] = useState<string[]>([]);
  const [subscription, setSubscription] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] =
    useState<SubscriptionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    apiRequest<AuthResponseData>('/auth/me')
      .then((data) => {
        setUser(data.user);
        setMenus(data.menus || []);
        setSubscription(Boolean(data.subscription));
        setSubscriptionDetails(data.subscriptionDetails ?? null);
      })
      .catch(() => {
        setStoredToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await apiRequest<AuthResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, platform: 'WEB' }),
    });
    if (data.accessToken) {
      setStoredToken(data.accessToken);
    }
    setUser(data.user);
    setMenus(data.menus || []);
    setSubscription(Boolean(data.subscription));
    setSubscriptionDetails(data.subscriptionDetails ?? null);
  }

  async function register(payload: RegisterPayload) {
    const data = await apiRequest<AuthResponseData>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.accessToken) {
      setStoredToken(data.accessToken);
    }
    setUser(data.user);
    setMenus(data.menus || []);
    setSubscription(Boolean(data.subscription));
    setSubscriptionDetails(data.subscriptionDetails ?? null);
  }

  function logout() {
    setStoredToken(null);
    setUser(null);
    setMenus([]);
    setSubscription(false);
    setSubscriptionDetails(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        menus,
        subscription,
        subscriptionDetails,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
