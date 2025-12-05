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
      console.log('[ExtensionsContext] Sem companyId, limpando extensões');
      setActiveExtensions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log(`[ExtensionsContext] Buscando extensões para empresa ${companyId}...`);
      
      const response = await api.get(`/companies/${companyId}/extensions`);
      console.log('[ExtensionsContext] Resposta da API:', {
        status: response.status,
        data: response.data,
        rawData: response.data?.data,
      });

      const extensions = response.data?.data || [];
      console.log('[ExtensionsContext] Extensões recebidas do backend:', extensions);

      // Extrai os nomes das extensões ativas
      // O backend já retorna apenas extensões ativas, mas garantimos aqui também
      const active = extensions
        .filter((ce: any) => {
          const isActive = ce.isActive && ce.extension;
          if (!isActive) {
            console.log(`[ExtensionsContext] Extensão filtrada (inativa ou sem extension):`, ce);
          }
          return isActive;
        })
        .map((ce: any) => {
          const name = ce.extension?.name;
          console.log(`[ExtensionsContext] Mapeando extensão:`, { name, full: ce });
          return name;
        })
        .filter(Boolean); // Remove valores undefined/null

      console.log('[ExtensionsContext] Extensões ativas extraídas:', active);
      console.log('[ExtensionsContext] Total de extensões ativas:', active.length);
      setActiveExtensions(active);
    } catch (error: any) {
      console.error('[ExtensionsContext] Erro ao buscar extensões:', error);
      console.error('[ExtensionsContext] Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      setActiveExtensions([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    console.log('[ExtensionsContext] useEffect - companyId:', companyId, 'refreshTrigger:', refreshTrigger);
    
    // Limpa extensões quando companyId é removido
    if (!companyId) {
      console.log('[ExtensionsContext] Sem companyId, limpando extensões');
      setActiveExtensions([]);
      setIsLoading(false);
      return;
    }
    
    // Busca extensões imediatamente quando companyId está disponível
    console.log('[ExtensionsContext] CompanyId disponível, buscando extensões...');
    fetchExtensions();
  }, [companyId, fetchExtensions, refreshTrigger]);

  const hasExtension = useCallback(
    (extensionName: string): boolean => {
      const has = activeExtensions.includes(extensionName);
      console.log(`[ExtensionsContext] hasExtension("${extensionName}"):`, has, `| Extensões ativas:`, activeExtensions);
      return has;
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

