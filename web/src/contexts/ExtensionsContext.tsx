/**
 * Context de Extensões
 *
 * Provider global para gerenciar o estado de extensões ativas
 * da empresa atual.
 */

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

interface ExtensionsContextType {
  activeExtensions: string[];
  hasExtension: (extensionName: string) => boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const ExtensionsContext = createContext<ExtensionsContextType | undefined>(
  undefined,
);

export function ExtensionsProvider({ children }: { children: ReactNode }) {
  const { companyId } = useAuth();
  const [activeExtensions, setActiveExtensions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchExtensions = useCallback(async () => {
    if (!companyId) {
      setActiveExtensions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.get(`/companies/${companyId}/extensions`);
      const extensions = response.data?.data || [];

      // Extrai os nomes das extensões ativas
      // O backend já retorna apenas extensões ativas, mas garantimos aqui também
      const active = extensions
        .filter((ce: any) => ce.isActive && ce.extension)
        .map((ce: any) => ce.extension.name)
        .filter(Boolean); // Remove valores undefined/null

      console.log('[ExtensionsContext] Extensões ativas atualizadas:', active);
      setActiveExtensions(active);
    } catch (error) {
      console.error('Erro ao buscar extensões:', error);
      setActiveExtensions([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    // Limpa extensões quando companyId é removido
    if (!companyId) {
      setActiveExtensions([]);
      setIsLoading(false);
      return;
    }
    // Busca extensões quando companyId está disponível
    fetchExtensions();
  }, [companyId, fetchExtensions, refreshTrigger]);

  const hasExtension = useCallback(
    (extensionName: string): boolean => {
      return activeExtensions.includes(extensionName);
    },
    [activeExtensions],
  );

  const refresh = useCallback(async () => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <ExtensionsContext.Provider
      value={{
        activeExtensions,
        hasExtension,
        isLoading,
        refresh,
      }}
    >
      {children}
    </ExtensionsContext.Provider>
  );
}

export function useExtensions() {
  const context = useContext(ExtensionsContext);
  if (context === undefined) {
    throw new Error('useExtensions deve ser usado dentro de ExtensionsProvider');
  }
  return context;
}

