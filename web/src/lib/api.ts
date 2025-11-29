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

// Base URL do backend - ajuste conforme necessário
const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Cria a instância do Axios
const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
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

    return Promise.reject(error);
  }
);

export default api;

