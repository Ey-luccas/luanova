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
    const initializeAuth = async () => {
      // Carrega companyId do localStorage PRIMEIRO
      if (typeof window !== 'undefined') {
        const storedCompanyId = localStorage.getItem('companyId');
        if (storedCompanyId) {
          console.log('[AuthContext] Carregando companyId do localStorage:', storedCompanyId);
          setCompanyIdState(storedCompanyId);
        }
      }
      
      // Depois verifica autenticação
      await checkAuth();
    };
    
    initializeAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      let token: string | null = null;
      try {
        token = localStorage.getItem('accessToken');
      } catch (storageError) {
        console.warn('localStorage não disponível:', storageError);
        setIsLoading(false);
        return;
      }

      if (!token) {
        setIsLoading(false);
        return;
      }

      // TODO: Fazer requisição para validar token e buscar dados do usuário
      // Por enquanto, apenas verifica se o token existe
      setIsAuthenticated(true);
      
      // Garante que companyId seja carregado após autenticação
      try {
        const storedCompanyId = localStorage.getItem('companyId');
        if (storedCompanyId && !companyId) {
          console.log('[AuthContext] Carregando companyId após autenticação:', storedCompanyId);
          setCompanyIdState(storedCompanyId);
        }
      } catch (storageError) {
        console.warn('Erro ao ler companyId do localStorage:', storageError);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        } catch (storageError) {
          console.warn('Erro ao limpar localStorage:', storageError);
        }
      }
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

      // Salva tokens no localStorage com tratamento de erro
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('accessToken', tokens.accessToken);
          if (tokens.refreshToken) {
            localStorage.setItem('refreshToken', tokens.refreshToken);
          }
        } catch (storageError) {
          console.error('Erro ao salvar tokens no localStorage:', storageError);
          // Em alguns navegadores mobile, localStorage pode estar desabilitado
          // Mas ainda podemos continuar com a autenticação em memória
        }
      }

      // Atualiza estado
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.error('Erro ao fazer login:', error);
      
      // Melhora mensagens de erro para mobile
      if (error.response?.status === 401) {
        throw new Error('E-mail ou senha incorretos. Verifique suas credenciais.');
      } else if (error.response?.status === 0 || error.message?.includes('Network Error')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Erro ao fazer login. Tente novamente.');
      }
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
    } catch (error: any) {
      console.error('Erro ao registrar:', error);
      
      // Melhora mensagens de erro para mobile
      if (error.response?.status === 409 || error.response?.data?.message?.includes('já existe')) {
        throw new Error('Este e-mail já está cadastrado. Tente fazer login.');
      } else if (error.response?.status === 0 || error.message?.includes('Network Error')) {
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      } else if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error('Erro ao criar conta. Tente novamente.');
      }
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
