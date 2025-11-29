/**
 * Schemas de validação para empresas usando Zod
 */

import { z } from "zod";

// Schema para criação de empresa
export const createCompanySchema = z.object({
  body: z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
    cnpj: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
});

// Schema para atualização de empresa
export const updateCompanySchema = z.object({
  body: z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").optional(),
    cnpj: z.string().optional().nullable(),
    email: z
      .union([
        z.string().email("Email inválido"),
        z.string().length(0), // String vazia
        z.null(),
      ])
      .optional()
      .nullable()
      .transform((val) => (val === "" || val === null ? null : val)),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    logoUrl: z.string().url("URL do logo inválida").optional().nullable(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID deve ser um número"),
  }),
});

// Schema para parâmetros de ID
export const companyIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "ID deve ser um número"),
  }),
});

// Tipos inferidos dos schemas
export type CreateCompanyInput = z.infer<typeof createCompanySchema>["body"];
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>["body"];
