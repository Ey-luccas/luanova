/**
 * Context de Autenticação
 *
 * Provider global para gerenciar o estado de autenticação
 * da aplicação usando Context API.
 */

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  companyId: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setCompanyId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyIdState] = useState<string | null>(null);

  // Verifica se há token salvo ao montar o componente
  useEffect(() => {
    checkAuth();
    // Carrega companyId do localStorage
    if (typeof window !== 'undefined') {
      const storedCompanyId = localStorage.getItem('companyId');
      if (storedCompanyId) {
        setCompanyIdState(storedCompanyId);
      }
    }
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setIsLoading(false);
        return;
      }

      // TODO: Fazer requisição para validar token e buscar dados do usuário
      // Por enquanto, apenas verifica se o token existe
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });

      // Backend retorna: { success, data: { user, tokens: { accessToken, refreshToken } } }
      const { user: userData, tokens } = response.data.data;

      // Salva tokens no localStorage
      localStorage.setItem('accessToken', tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }

      // Atualiza estado
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      throw error;
    }
  };

  const register = async (email: string, name: string, password: string) => {
    try {
      const response = await api.post('/auth/register', {
        email,
        name,
        password,
      });

      // Após registro, faz login automaticamente
      await login(email, password);
    } catch (error) {
      console.error('Erro ao registrar:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('companyId');
    setUser(null);
    setIsAuthenticated(false);
    setCompanyIdState(null);
    window.location.href = '/login';
  };

  const setCompanyId = (id: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('companyId', id);
      setCompanyIdState(id);
    }
  };

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refreshToken');

      if (!refresh) {
        throw new Error('Refresh token não encontrado');
      }

      const response = await api.post('/auth/refresh', {
        refreshToken: refresh,
      });

      // Backend retorna: { success, data: { tokens: { accessToken, refreshToken } } }
      const { tokens } = response.data.data;

      localStorage.setItem('accessToken', tokens.accessToken);
      if (tokens.refreshToken) {
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      logout();
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        companyId,
        login,
        register,
        logout,
        refreshToken,
        setCompanyId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }

  return context;
}
