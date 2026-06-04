import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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

// Helper functions to reduce complexity
const decodeJwt = (token: string | null): Record<string, any> | null => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = parts[1];
    return JSON.parse(atob(payload.replaceAll('-', '+').replaceAll('_', '/')));
  } catch {
    return null;
  }
};

const buildUserFromJwt = (jwt: Record<string, any>, fallbackEmail?: string): User => {
  const email = jwt.email || fallbackEmail || null;
  const getId = () => {
    if (jwt.sub) return String(jwt.sub);
    if (jwt.id) return String(jwt.id);
    if (jwt.userId) return String(jwt.userId);
    return String(Math.random());
  };
  return {
    id: getId(),
    name: jwt.name || jwt.firstName || email?.split?.('@')?.[0] || 'User',
    email,
    role: (jwt.role || jwt.roles || jwt['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || jwt.roleName || null) as Role,
    avatar: jwt.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(jwt.name || email || 'User')}&background=random`,
    department: jwt.department || 'General',
    designation: jwt.designation || 'User',
    employeeId: jwt.employeeId ? Number(jwt.employeeId) : undefined,
  };
};

const fetchEmployeeId = async (user: User, setUserFn: (u: User) => void) => {
  if (user.employeeId) return;
  try {
    const data = await api.getEmployeeIdByUserId();
    const updatedUser = { ...user, employeeId: data.employeeId };
    setUserFn(updatedUser);
    try {
      localStorage.setItem('foodeez_user', JSON.stringify(updatedUser));
    } catch (err) {
      console.warn('Unable to persist updated user to localStorage:', err);
    }
  } catch (err) {
    console.warn('Could not fetch employee ID on init:', err);
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('foodeez_user');

      if (accessToken) {
        const jwt = decodeJwt(accessToken);
        if (jwt) {
          const userObj = buildUserFromJwt(jwt);
          setUser(userObj);
          setRole(userObj.role);
          try {
            localStorage.setItem('foodeez_user', JSON.stringify(userObj));
          } catch (err) {
            console.warn('Unable to persist user to localStorage:', err);
          }
          fetchEmployeeId(userObj, setUser);
          return;
        }
      }

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setRole(parsed.role);
          fetchEmployeeId(parsed, setUser);
          return;
        } catch (err) {
          console.warn('Failed to parse stored user from localStorage:', err);
          localStorage.removeItem('foodeez_user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }

      setIsLoading(false);
    };

    initializeAuth().finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; dashboard?: string; message?: string }> => {
    try {
      const response = await api.login(email, password);
      const token = response.accessToken || localStorage.getItem('accessToken');
      const jwt = decodeJwt(token || null);

      const userObj: User = jwt 
        ? buildUserFromJwt(jwt, email)
        : {
            id: String(Math.random()),
            name: email.split('@')[0],
            email,
            role: response.role.toUpperCase() as Role,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`,
            department: 'General',
            designation: 'User',
            employeeId: undefined,
          };

      setUser(userObj);
      setRole((userObj.role || response.role || 'EMPLOYEE') as Role);
      localStorage.setItem('foodeez_user', JSON.stringify(userObj));
      
      await fetchEmployeeId(userObj, setUser);
      
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

  const contextValue = useMemo(() => ({ user, login, logout, isLoading, role }), [user, login, logout, isLoading, role]);
  
  return (
    <AuthContext.Provider value={contextValue}>
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