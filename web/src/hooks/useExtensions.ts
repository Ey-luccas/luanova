/**
 * Hook para verificar extensões ativas da empresa
 */

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';

export function useExtensions(companyId: string | null) {
  const [activeExtensions, setActiveExtensions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      const active = extensions
        .filter((ce: any) => ce.isActive && ce.extension)
        .map((ce: any) => ce.extension.name);
      
      setActiveExtensions(active);
    } catch (error) {
      console.error('Erro ao buscar extensões:', error);
      setActiveExtensions([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchExtensions();
  }, [fetchExtensions]);

  const hasExtension = useCallback((extensionName: string): boolean => {
    return activeExtensions.includes(extensionName);
  }, [activeExtensions]);

  return { activeExtensions, hasExtension, isLoading, refresh: fetchExtensions };
}

