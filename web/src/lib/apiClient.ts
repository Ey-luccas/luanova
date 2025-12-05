/**
 * Cliente API customizado que garante query params como strings
 * Resolve problemas de validação Zod no backend
 */

import axios, { AxiosRequestConfig, AxiosError } from "axios";
import { stringifyQueryParams, QueryParams } from "./api-utils";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Cliente API customizado
 */
export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api') {
    this.baseURL = baseURL;
  }

  /**
   * Define o token de autenticação
   */
  setToken(token: string) {
    this.token = token;
  }

  /**
   * Remove o token de autenticação
   */
  clearToken() {
    this.token = null;
  }

  /**
   * GET request com query params garantidos como strings
   */
  async get<T>(endpoint: string, params?: QueryParams): Promise<T> {
    // Buscar token do localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        this.setToken(token);
      }
    }

    const config: AxiosRequestConfig = {
      params: params ? stringifyQueryParams(params) : {},
      headers: this.token
        ? {
            Authorization: `Bearer ${this.token}`,
          }
        : {},
    };

    console.log("📡 GET Request:", {
      url: `${this.baseURL}${endpoint}`,
      params: config.params,
    });

    try {
      const response = await axios.get<T>(`${this.baseURL}${endpoint}`, config);
      return response.data;
    } catch (error) {
      // Tratamento de erro 401
      if ((error as AxiosError).response?.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          const currentPath = window.location.pathname;
          if (
            !currentPath.includes("/login") &&
            !currentPath.includes("/register")
          ) {
            window.location.href = "/login";
          }
        }
      }
      throw error;
    }
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    // Buscar token do localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        this.setToken(token);
      }
    }

    const config: AxiosRequestConfig = {
      headers: this.token
        ? {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          }
        : {
            "Content-Type": "application/json",
          },
    };

    console.log("📡 POST Request:", {
      url: `${this.baseURL}${endpoint}`,
      data: data ? "[data presente]" : "[sem data]",
    });

    try {
      const response = await axios.post<T>(
        `${this.baseURL}${endpoint}`,
        data,
        config
      );
      return response.data;
    } catch (error) {
      // Tratamento de erro 401
      if ((error as AxiosError).response?.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          const currentPath = window.location.pathname;
          if (
            !currentPath.includes("/login") &&
            !currentPath.includes("/register")
          ) {
            window.location.href = "/login";
          }
        }
      }
      throw error;
    }
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    // Buscar token do localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        this.setToken(token);
      }
    }

    const config: AxiosRequestConfig = {
      headers: this.token
        ? {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          }
        : {
            "Content-Type": "application/json",
          },
    };

    const response = await axios.put<T>(
      `${this.baseURL}${endpoint}`,
      data,
      config
    );
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    // Buscar token do localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        this.setToken(token);
      }
    }

    const config: AxiosRequestConfig = {
      headers: this.token
        ? {
            Authorization: `Bearer ${this.token}`,
          }
        : {},
    };

    const response = await axios.delete<T>(`${this.baseURL}${endpoint}`, config);
    return response.data;
  }
}

// Instância singleton
export const apiClient = new ApiClient();

/**
 * Hook React para usar o API Client
 */
export function useApiClient() {
  // Buscar token do localStorage ou context
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

  if (token) {
    apiClient.setToken(token);
  }

  return apiClient;
}

