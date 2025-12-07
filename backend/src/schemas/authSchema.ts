/**
 * Schemas de validação para autenticação usando Zod
 */

import { z } from "zod";

// Schema para registro de usuário
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Email inválido").transform((val) => val.toLowerCase().trim()),
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  }),
});

// Schema para login
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Email inválido").transform((val) => val.toLowerCase().trim()),
    password: z.string().min(1, "Senha é obrigatória"),
  }),
});

// Schema para refresh token
export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token é obrigatório"),
  }),
});

// Schema para atualização de perfil
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").optional(),
    avatarUrl: z.string().url("URL do avatar inválida").optional().nullable(),
  }),
});

// Tipos inferidos dos schemas
export type RegisterInput = z.infer<typeof registerSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
export type RefreshInput = z.infer<typeof refreshSchema>["body"];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
