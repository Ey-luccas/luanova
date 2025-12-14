/**
 * Instância do Axios configurada para o backend
 * 
 * Este arquivo exporta uma instância do Axios pré-configurada
 * com baseURL, interceptors para tratamento de erros 401
 * e adição automática de tokens de autenticação.
 * 
 * MELHORADO: Garante que query params sejam sempre strings
 */

import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { stringifyQueryParams, QueryParams } from "./api-utils";

/**
 * Função para detectar a URL base da API automaticamente
 * 
 * Prioridade:
 * 1. NEXT_PUBLIC_API_URL (variável de ambiente)
 * 2. Detecção automática baseada no hostname
 * 3. Fallback para desenvolvimento
 */
function getApiBaseURL(): string {
  // Prioridade 1: Variável de ambiente (mais confiável)
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL.trim();
    // Garante que termina com /api se não terminar
    return url.endsWith('/api') ? url : `${url}/api`;
  }

  // Prioridade 2: Detecção automática no navegador
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // Desenvolvimento local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }

    // Produção: luanova.cloud e subdomínios
    if (hostname.includes('luanova.cloud')) {
      return 'https://api.luanova.cloud/api';
    }

    // Outros domínios em produção (HTTPS)
    if (protocol === 'https:') {
      const baseHost = hostname.replace(/^www\./, '');
      return `https://api.${baseHost}/api`;
    }

    // HTTP (desenvolvimento/staging)
    const baseHost = hostname.replace(/^www\./, '');
    return `http://${baseHost}:3001/api`;
  }

  // Prioridade 3: Fallback para desenvolvimento
  return process.env.NODE_ENV === 'production' 
    ? 'https://api.luanova.cloud/api'
    : 'http://localhost:3001/api';
}

// Base URL do backend - detecta automaticamente em mobile/produção
const baseURL = getApiBaseURL();

// Log apenas em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  console.log('[API] Base URL configurada:', baseURL);
}

// Cria a instância do Axios
const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30 segundos de timeout para mobile
});

// Interceptor para adicionar token antes das requisições
// E normalizar query params para strings
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Recupera o token do localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // Normaliza query params para strings (resolve problemas Zod)
    if (config.params) {
      config.params = stringifyQueryParams(config.params as QueryParams);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Cache para evitar requisições duplicadas em curto período
const requestCache = new Map<string, { timestamp: number; promise: Promise<any> }>();
const CACHE_DURATION = 1000; // 1 segundo

// Interceptor para tratar erros de resposta (401, 429, etc)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // Tratamento de erro 429 (Too Many Requests - Rate Limit)
    if (error.response?.status === 429) {
      const errorData = error.response.data as any;
      const retryAfter = errorData?.error?.retryAfter || 900; // 15 minutos padrão
      const message = errorData?.error?.message || 'Muitas requisições. Tente novamente mais tarde.';
      
      // Log apenas em desenvolvimento para evitar spam
      if (process.env.NODE_ENV === 'development') {
        console.warn('[API] Rate limit excedido:', {
          url: error.config?.url,
          retryAfter,
        });
      }
      
      // Cria erro mais descritivo com informações de retry
      const rateLimitError = new Error(message) as any;
      rateLimitError.isRateLimitError = true;
      rateLimitError.retryAfter = retryAfter;
      rateLimitError.statusCode = 429;
      
      return Promise.reject(rateLimitError);
    }

    // Se receber 401 (não autorizado), redireciona para login
    if (error.response?.status === 401) {
      // Limpa tokens do localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        
        // Redireciona para login (apenas se não estiver já na página de login)
        const currentPath = window.location.pathname;
        if (!currentPath.includes("/login") && !currentPath.includes("/register")) {
          window.location.href = "/login";
        }
      }
    }

    // Melhora tratamento de erros de rede para mobile
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
      console.error('[API] Erro de conexão:', {
        message: error.message,
        code: error.code,
        baseURL,
        url: error.config?.url,
      });
      
      // Cria um erro mais descritivo
      const networkError = new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      (networkError as any).isNetworkError = true;
      (networkError as any).originalError = error;
      return Promise.reject(networkError);
    }

    return Promise.reject(error);
  }
);

export default api;

