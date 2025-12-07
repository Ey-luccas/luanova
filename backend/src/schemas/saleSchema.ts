/**
 * Schemas de validação para vendas e devoluções usando Zod
 */

import { z } from "zod";

// Schema para criação de venda/prestação
export const createSaleSchema = z.object({
  body: z.object({
    productId: z
      .number()
      .int()
      .positive("ID do produto deve ser um número positivo"),
    type: z.enum(["SALE", "SERVICE"], {
      errorMap: () => ({
        message: 'Tipo deve ser "SALE" (Venda) ou "SERVICE" (Prestação)',
      }),
    }),
    quantity: z.number().positive("Quantidade deve ser maior que zero"),
    customerName: z.string().min(1, "Nome do cliente é obrigatório"),
    customerCpf: z.string().optional().nullable(),
    customerEmail: z
      .string()
      .email("Email inválido")
      .optional()
      .nullable()
      .or(z.literal(""))
      .transform((val) => {
        if (!val || val === "" || val === null) return null;
        return val.toLowerCase().trim();
      }),
    paymentMethod: z.enum(["PIX", "CARTAO", "BOLETO", "ESPECIE"], {
      errorMap: () => ({
        message: "Forma de pagamento deve ser PIX, CARTAO, BOLETO ou ESPECIE",
      }),
    }),
    observations: z.string().optional().nullable(),
  }),
  params: z.object({
    companyId: z.string().regex(/^\d+$/, "companyId deve ser um número"),
  }),
});

// Schema para busca de vendas por cliente
export const findSalesByCustomerSchema = z.object({
  query: z.object({
    customerName: z.string().optional(),
    customerEmail: z.string().optional().transform((val) => {
      if (!val || val === "") return undefined;
      return val.toLowerCase().trim();
    }),
    customerCpf: z.string().optional(),
    startDate: z.string().optional(), // ISO date string
    endDate: z.string().optional(), // ISO date string
  }),
  params: z.object({
    companyId: z.string().regex(/^\d+$/, "companyId deve ser um número"),
  }),
});

// Schema para criação de devolução/reembolso
export const createReturnSchema = z
  .object({
    body: z.object({
      saleId: z
        .number()
        .int()
        .positive("ID da venda deve ser um número positivo"),
      type: z.enum(["RETURN", "REFUND", "EXCHANGE"], {
        errorMap: () => ({
          message:
            'Tipo deve ser "RETURN" (Devolução), "REFUND" (Reembolso) ou "EXCHANGE" (Troca)',
        }),
      }),
      quantity: z
        .number()
        .positive("Quantidade deve ser maior que zero")
        .optional(),
      returnAction: z
        .enum(["RESTOCK", "MAINTENANCE"], {
          errorMap: () => ({
            message:
              'Ação deve ser "RESTOCK" (Voltar ao estoque) ou "MAINTENANCE" (Manutenção)',
          }),
        })
        .optional(),
      refundAmount: z
        .number()
        .positive("Valor devolvido deve ser maior que zero")
        .optional(),
      exchangeProductId: z
        .number()
        .int()
        .positive("ID do produto para troca deve ser um número positivo")
        .optional(),
      exchangeQuantity: z
        .number()
        .positive("Quantidade do produto para troca deve ser maior que zero")
        .optional(),
      additionalPayment: z
        .number()
        .positive("Valor adicional pago deve ser maior que zero")
        .optional(),
      observations: z.string().optional().nullable(),
    }),
    params: z.object({
      companyId: z.string().regex(/^\d+$/, "companyId deve ser um número"),
    }),
  })
  .refine(
    (data) => {
      // Se for devolução, quantity e returnAction são obrigatórios
      if (data.body.type === "RETURN") {
        if (!data.body.quantity || data.body.quantity <= 0) {
          return false;
        }
        if (!data.body.returnAction) {
          return false;
        }
      }
      // Se for reembolso, refundAmount é obrigatório
      if (data.body.type === "REFUND") {
        if (!data.body.refundAmount || data.body.refundAmount <= 0) {
          return false;
        }
      }
      // Se for troca, quantity, exchangeProductId e exchangeQuantity são obrigatórios
      if (data.body.type === "EXCHANGE") {
        if (!data.body.quantity || data.body.quantity <= 0) {
          return false;
        }
        if (!data.body.exchangeProductId || data.body.exchangeProductId <= 0) {
          return false;
        }
        if (!data.body.exchangeQuantity || data.body.exchangeQuantity <= 0) {
          return false;
        }
      }
      return true;
    },
    {
      message: "Dados inválidos para o tipo selecionado",
      path: ["body"],
    }
  );

// Schema para listagem de vendas/devoluções
export const listSalesSchema = z.object({
  query: z.object({
    type: z.enum(["SALE", "SERVICE", "RETURN", "REFUND"]).optional(),
    productId: z.string().regex(/^\d+$/).optional(),
    startDate: z.string().optional(), // ISO date string
    endDate: z.string().optional(), // ISO date string
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
  params: z.object({
    companyId: z.string().regex(/^\d+$/, "companyId deve ser um número"),
  }),
});
