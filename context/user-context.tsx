'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User } from '@/lib/types';

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const MOCK_USERS: Record<string, User> = {
  'admin@example.com': {
    id: 'u-1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    zone: 'Financial District',
    avatar: '👨‍💼'
  },
  'officer@example.com': {
    id: 'u-2',
    name: 'Officer Johnson',
    email: 'officer@example.com',
    role: 'officer',
    zone: 'SOMA',
    avatar: '👮‍♂️'
  },
  'analyst@example.com': {
    id: 'u-3',
    name: 'Analyst Smith',
    email: 'analyst@example.com',
    role: 'analyst',
    zone: 'Mission District',
    avatar: '👩‍💼'
  }
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isHydrated, setIsHydrated] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('parksight_user');
      if (stored) {
        setUserState(JSON.parse(stored));
      }
    } catch (e) {
      localStorage.removeItem('parksight_user');
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Accept any credentials (demo mode)
    const mockUser = MOCK_USERS[email] || {
      id: `u-${Date.now()}`,
      name: email.split('@')[0],
      email,
      role: 'analyst' as const,
      zone: 'Financial District',
      avatar: '👤'
    };

    setUserState(mockUser);
    localStorage.setItem('parksight_user', JSON.stringify(mockUser));
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
    localStorage.removeItem('parksight_user');
  }, []);

  const value: UserContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    setUser: setUserState
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
}
