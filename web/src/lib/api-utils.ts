/**
 * Utilitários para API
 */

/**
 * Tipo para query parameters
 */
export type QueryParams = Record<string, any>;

/**
 * Converte query parameters para strings
 * Garante que todos os valores sejam strings (resolve problemas Zod)
 */
export function stringifyQueryParams(params: QueryParams): Record<string, string> {
  const stringified: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) {
      stringified[key] = String(value);
    }
  }
  
  return stringified;
}

/**
 * Obtém a URL base da API (sem /api no final)
 * Útil para construir URLs de imagens e outros recursos
 */
export function getApiBaseUrl(): string {
  // Se estiver definido nas variáveis de ambiente, usa isso
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace('/api', '');
  }

  // Se estiver no navegador, tenta detectar automaticamente
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // Se estiver em localhost, usa localhost:3001
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }

    // Se estiver em produção (luanova.cloud ou subdomínios), usa a API de produção
    if (hostname.includes('luanova.cloud') || hostname.includes('luanova')) {
      return 'https://api.luanova.cloud';
    }

    // Para outros domínios em produção, tenta construir baseado no hostname
    const baseHost = hostname.replace(/^www\./, '');
    
    if (protocol === 'https:') {
      return `https://api.${baseHost}`;
    } else {
      return `http://${baseHost}:3001`;
    }
  }

  // Fallback padrão para desenvolvimento
  return 'http://localhost:3001';
}

/**
 * Obtém a URL completa da API (com /api no final)
 */
export function getApiUrl(): string {
  const baseUrl = getApiBaseUrl();
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
}
