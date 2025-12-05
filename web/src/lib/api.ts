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

// Função para detectar a URL base da API automaticamente
function getApiBaseURL(): string {
  // Se estiver definido nas variáveis de ambiente, usa isso
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Se estiver no navegador, tenta detectar automaticamente
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;

    // Se estiver em localhost, usa localhost:3001
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }

    // Se estiver em produção/VPS, constrói a URL baseada no hostname atual
    // Remove a porta do frontend e adiciona a porta do backend
    const baseHost = hostname;
    // Tenta porta 3001 primeiro, depois tenta sem porta (se estiver no mesmo servidor)
    if (port) {
      // Se tiver porta, tenta usar a mesma porta mas mudando para 3001
      return `${protocol}//${baseHost}:3001/api`;
    } else {
      // Se não tiver porta, tenta adicionar :3001 ou usar /api diretamente
      // Primeiro tenta com porta 3001
      return `${protocol}//${baseHost}:3001/api`;
    }
  }

  // Fallback padrão
  return "http://localhost:3001/api";
}

// Base URL do backend - detecta automaticamente em mobile/produção
const baseURL = getApiBaseURL();

console.log('[API] Base URL configurada:', baseURL);

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

// Interceptor para tratar erros de resposta (401 → redirecionar para login)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
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

