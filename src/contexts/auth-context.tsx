'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types/user';

// use func const { user, logout } = useAuth();
interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  const login = async (userData: User) => {
    try {
      const expiryTime = new Date(Number(userData.expires) * 1000);
      if (isNaN(expiryTime.getTime())) {
        throw new Error('Invalid expiry time format');
      }

      const currentTime = new Date();
      const maxAge = Math.floor(
        (expiryTime.getTime() - currentTime.getTime()) / 1000
      );

      if (maxAge <= 0) {
        throw new Error('Token has expired');
      }

      document.cookie = `user=${JSON.stringify(userData)}; path=/; max-age=${maxAge}; secure; samesite=strict`;
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    document.cookie = 'user=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    setUser(null);
    router.push('/login');
  };

  useEffect(() => {
    const userCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('user='));
    if (userCookie) {
      const userData = JSON.parse(userCookie.split('=')[1]);
      setUser(userData);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
