import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; dashboard?: string; message?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  role: Role | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has valid tokens
    const accessToken = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('foodeez_user');
    const decodeJwt = (token: string | null) => {
      if (!token) return null;
      try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        const payload = parts[1];
        const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        return decoded;
      } catch (e) {
        return null;
      }
    };

    if (accessToken) {
      const jwt = decodeJwt(accessToken);
      if (jwt) {
        const userObj: User = {
          id: jwt.sub ? String(jwt.sub) : jwt.id ? String(jwt.id) : jwt.userId ? String(jwt.userId) : String(Math.random()),
          name: jwt.name || jwt.firstName || jwt.email?.split?.('@')?.[0] || 'User',
          email: jwt.email || null,
          role: (jwt.role || jwt.roles || jwt['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || jwt.roleName || null) as Role,
          avatar: jwt.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(jwt.name || jwt.email || 'User')}&background=random`,
          department: jwt.department || 'General',
          designation: jwt.designation || 'User',
        };

        setUser(userObj);
        if (userObj.role) setRole(userObj.role);
        // persist a lightweight user snapshot
        try { localStorage.setItem('foodeez_user', JSON.stringify(userObj)); } catch {}
      } else if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setRole(parsed.role);
        } catch {
          localStorage.removeItem('foodeez_user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; dashboard?: string; message?: string }> => {
    try {
      const response = await api.login(email, password);
      // Decode token to extract user info (if backend didn't return full user)
      const token = response.accessToken || localStorage.getItem('accessToken');
      const decodeJwt = (token: string | null) => {
        if (!token) return null;
        try {
          const parts = token.split('.');
          if (parts.length < 2) return null;
          const payload = parts[1];
          const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
          return decoded;
        } catch (e) {
          return null;
        }
      };

      const jwt = decodeJwt(token || null);
      const userObj: User = jwt
        ? {
            id: jwt.sub ? String(jwt.sub) : jwt.id ? String(jwt.id) : String(Math.random()),
            name: jwt.name || jwt.firstName || email.split('@')[0],
            email: jwt.email || email,
            role: (jwt.role || response.role || 'EMPLOYEE') as Role,
            avatar: jwt.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(jwt.name || email.split('@')[0])}&background=random`,
            department: jwt.department || 'General',
            designation: jwt.designation || 'User',
          }
        : {
            id: String(Math.random()),
            name: email.split('@')[0],
            email,
            role: response.role.toUpperCase() as Role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`,
            department: 'General',
            designation: 'User',
          };

      setUser(userObj);
      setRole((userObj.role || response.role || 'EMPLOYEE') as Role);
      localStorage.setItem('foodeez_user', JSON.stringify(userObj));
      
      return {
        success: true,
        dashboard: response.dashboard,
        message: response.message
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed. Please try again.'
      };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setRole(null);
      localStorage.removeItem('foodeez_user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, role }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};