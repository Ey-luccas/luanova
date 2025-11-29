/**
 * Utilitário para cachear valores do localStorage
 * Evita múltiplas leituras do localStorage em um mesmo render
 */

type CacheEntry<T> = {
  value: T | null;
  timestamp: number;
};

const cache: Map<string, CacheEntry<any>> = new Map();
const CACHE_TTL = 1000; // 1 segundo de cache

export function getCachedLocalStorage<T>(key: string): T | null {
  const cached = cache.get(key);
  const now = Date.now();

  // Se há cache válido, retorna ele
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.value;
  }

  // Senão, lê do localStorage
  if (typeof window === 'undefined') return null;
  
  try {
    const value = localStorage.getItem(key);
    const parsedValue = value ? (JSON.parse(value) as T) : null;
    
    // Atualiza cache
    cache.set(key, {
      value: parsedValue,
      timestamp: now,
    });
    
    return parsedValue;
  } catch {
    return null;
  }
}

export function invalidateCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

