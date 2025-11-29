/**
 * Schemas de validação para movimentações de estoque usando Zod
 */

import { z } from "zod";

// Schema para criação de movimentação
export const createMovementSchema = z.object({
  body: z.object({
    productId: z.number().int().positive("ID do produto deve ser um número positivo"),
    type: z.enum(["IN", "OUT"], {
      errorMap: () => ({ message: 'Tipo deve ser "IN" ou "OUT"' }),
    }),
    quantity: z.number().positive("Quantidade deve ser maior que zero"),
    reason: z.string().optional().nullable(),
  }),
  params: z.object({
    companyId: z.string().regex(/^\d+$/, "companyId deve ser um número"),
  }),
});

// Schema para criação em lote (batch)
export const createBatchMovementsSchema = z.object({
  body: z.object({
    movements: z
      .array(
        z.object({
          productId: z.number().int().positive("ID do produto deve ser um número positivo"),
          type: z.enum(["IN", "OUT"], {
            errorMap: () => ({ message: 'Tipo deve ser "IN" ou "OUT"' }),
          }),
          quantity: z.number().positive("Quantidade deve ser maior que zero"),
          reason: z.string().optional().nullable(),
        })
      )
      .min(1, "Deve ter pelo menos uma movimentação"),
  }),
  params: z.object({
    companyId: z.string().regex(/^\d+$/, "companyId deve ser um número"),
  }),
});

// Schema para listagem de movimentações
export const listMovementsSchema = z.object({
  params: z.object({
    companyId: z.string().regex(/^\d+$/, "companyId deve ser um número"),
  }),
  query: z
    .object({
      productId: z.string().regex(/^\d+$/, "productId deve ser um número").optional(),
      type: z.enum(["IN", "OUT"]).optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
    })
    .optional(),
});

// Tipos inferidos dos schemas
export type CreateMovementInput = z.infer<typeof createMovementSchema>["body"];
export type CreateBatchMovementsInput = z.infer<
  typeof createBatchMovementsSchema
>["body"];

