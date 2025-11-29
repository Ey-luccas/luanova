/**
 * Schemas de validação para categorias usando Zod
 * 
 * Schema CORRIGIDO - Mais tolerante com tipos
 */

import { z } from "zod";

// Schema para criação de categoria
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  }),
  params: z.object({
    companyId: z
      .union([z.string().regex(/^\d+$/), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),
  }),
});

// Schema para listagem de categorias - VERSÃO CORRIGIDA
export const listCategoriesSchema = z.object({
  params: z.object({
    companyId: z
      .union([z.string().regex(/^\d+$/), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),
  }),
  // Ignora completamente query parameters - aceita qualquer coisa ou nenhuma
  query: z.any().optional().default({}),
});

// Tipos inferidos dos schemas
export type CreateCategoryInput = z.infer<typeof createCategorySchema>["body"];
export type ListCategoriesInput = z.infer<typeof listCategoriesSchema>;
