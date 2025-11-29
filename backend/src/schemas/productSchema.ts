/**
 * Schemas de validação para produtos usando Zod
 *
 * Schema CORRIGIDO - Mais tolerante com tipos
 * Aceita tanto string quanto number e converte automaticamente
 */

import { z } from "zod";

// Helper para converter string ou number para number
const numericString = z
  .union([z.string().regex(/^\d+$/).transform(Number), z.number()])
  .optional();

const decimalString = z
  .union([
    z
      .string()
      .regex(/^\d+(\.\d+)?$/)
      .transform(Number),
    z.number(),
  ])
  .optional();

// Schema para listagem de produtos - VERSÃO CORRIGIDA
export const listProductsSchema = z.object({
  params: z.object({
    companyId: z
      .union([
        z.string().regex(/^\d+$/, "Company ID deve ser numérico"),
        z.number(),
      ])
      .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),
  }),
  query: z
    .object({
      search: z.string().optional(),
      categoryId: z
        .union([
          z.string().regex(/^\d+$/, "Category ID deve ser numérico"),
          z.number(),
        ])
        .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val))
        .optional(),
      isActive: z.enum(["true", "false"]).optional(),
      isService: z.enum(["true", "false"]).optional(), // Novo filtro para serviços
      minStock: decimalString,
      maxStock: decimalString,
      page: z
        .union([z.string().regex(/^\d+$/).transform(Number), z.number()])
        .optional()
        .default(1),
      limit: z
        .union([z.string().regex(/^\d+$/).transform(Number), z.number()])
        .optional()
        .default(10),
    })
    .passthrough() // Permite propriedades extras sem rejeitar
    .optional()
    .default({}),
});

// Schema para listagem de categorias - VERSÃO CORRIGIDA
export const listCategoriesSchema = z.object({
  params: z.object({
    companyId: z
      .union([z.string().regex(/^\d+$/), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),
  }),
  // Ignora completamente query parameters
  query: z.object({}).optional().default({}),
});

// Schema para criação de produto
export const createProductSchema = z.object({
  params: z.object({
    companyId: z
      .union([z.string().regex(/^\d+$/), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),
  }),
  body: z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    barcode: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    categoryId: z.number().optional().nullable(), // Aceita null para serviços
    unitPrice: z
      .preprocess(
        (val) => (val === null || val === undefined || val === "" ? null : val),
        z.union([z.number().positive("Preço deve ser positivo"), z.null()])
      )
      .optional(),
    costPrice: z
      .number()
      .positive("Custo deve ser positivo")
      .optional()
      .nullable(),
    currentStock: z.number().min(0, "Estoque não pode ser negativo").default(0),
    minStock: z.number().min(0).optional().default(0).nullable(),
    maxStock: z.number().min(0).optional().nullable(),
    description: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
    isService: z.boolean().optional().default(false), // Novo campo para identificar serviços
  }),
});

// Schema para atualização de produto
export const updateProductSchema = z.object({
  params: z.object({
    companyId: z
      .union([z.string().regex(/^\d+$/), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),
    productId: z
      .union([z.string().regex(/^\d+$/), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    barcode: z.string().optional(),
    sku: z.string().optional(),
    categoryId: z.number().optional().nullable(),
    unitPrice: z.number().positive().optional().nullable(),
    costPrice: z.number().positive().optional().nullable(),
    currentStock: z.number().min(0).optional(),
    minStock: z.number().min(0).optional().nullable(),
    maxStock: z.number().min(0).optional().nullable(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

// Schema para buscar produto por código de barras
export const getProductByBarcodeSchema = z.object({
  params: z.object({
    companyId: z
      .union([z.string().regex(/^\d+$/), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),
    barcode: z.string().min(1, "Código de barras é obrigatório"),
  }),
});

// Schema para deletar produto
export const deleteProductSchema = z.object({
  params: z.object({
    companyId: z
      .union([z.string().regex(/^\d+$/), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),
    productId: z
      .union([z.string().regex(/^\d+$/), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),
  }),
});

// Schema para parâmetros de produto
export const productIdSchema = z.object({
  params: z.object({
    companyId: z
      .union([z.string().regex(/^\d+$/), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),
    productId: z
      .union([z.string().regex(/^\d+$/), z.number()])
      .transform((val) => (typeof val === "string" ? parseInt(val, 10) : val)),
  }),
});

// Tipos TypeScript inferidos
export type ListProductsInput = z.infer<typeof listProductsSchema>;
export type ListCategoriesInput = z.infer<typeof listCategoriesSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
export type UpdateProductInput = z.infer<typeof updateProductSchema>["body"];
export type GetProductByBarcodeInput = z.infer<
  typeof getProductByBarcodeSchema
>;
export type DeleteProductInput = z.infer<typeof deleteProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsSchema>["query"];
