/**
 * Service de movimentações de estoque
 * 
 * Contém a lógica de negócio para movimentações:
 * - Criação de movimentações
 * - Atualização de estoque (currentStock)
 * - Validação de estoque suficiente para saídas
 * - Atualização de lastMovementAt
 */

import prisma from "../config/prisma";
import * as companyService from "./companyService";

/**
 * Verifica se o usuário tem acesso à empresa
 */
async function verifyCompanyAccess(userId: number, companyId: number) {
  const hasAccess = await companyService.userHasAccessToCompany(userId, companyId);
  if (!hasAccess) {
    throw new Error("Empresa não encontrada ou você não tem acesso");
  }
}

/**
 * Verifica se o produto existe e pertence à empresa
 */
async function verifyProductAccess(productId: number, companyId: number) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      companyId,
    },
  });

  if (!product) {
    throw new Error("Produto não encontrado ou não pertence a esta empresa");
  }

  return product;
}

/**
 * Valida se há estoque suficiente para saída
 */
function validateStockForOut(currentStock: number, quantity: number) {
  if (quantity > currentStock) {
    throw new Error(
      `Estoque insuficiente. Estoque atual: ${currentStock}, Tentativa de saída: ${quantity}`
    );
  }
}

/**
 * Atualiza o estoque do produto baseado no tipo de movimentação
 */
async function updateProductStock(
  productId: number,
  type: "IN" | "OUT",
  quantity: number
) {
  // Busca o produto atual para obter o estoque
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { currentStock: true },
  });

  if (!product) {
    throw new Error("Produto não encontrado");
  }

  // Calcula o novo estoque
  const currentStock = Number(product.currentStock);
  const newStock = type === "IN" 
    ? currentStock + quantity 
    : currentStock - quantity;

  // Atualiza o produto
  // Não marca como inativo automaticamente - estoque 0 = Rascunho (isActive continua true)
  await prisma.product.update({
    where: { id: productId },
    data: {
      currentStock: newStock,
      lastMovementAt: new Date(),
    },
  });
}

/**
 * Cria uma movimentação de estoque
 */
export async function createMovement(
  userId: number,
  companyId: number,
  data: {
    productId: number;
    type: "IN" | "OUT";
    quantity: number;
    reason?: string | null;
  }
) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  // Verifica se produto existe e pertence à empresa
  const product = await verifyProductAccess(data.productId, companyId);

  // Valida estoque para saídas
  if (data.type === "OUT") {
    validateStockForOut(Number(product.currentStock), data.quantity);
  }

  // Cria a movimentação e atualiza o estoque em uma transação
  const result = await prisma.$transaction(async (tx) => {
    // Cria a movimentação
    const movement = await tx.stockMovement.create({
      data: {
        productId: data.productId,
        companyId,
        type: data.type,
        quantity: data.quantity,
        reason: data.reason || null,
        userId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            currentStock: true,
          },
        },
      },
    });

    // Atualiza o estoque do produto
    await updateProductStock(data.productId, data.type, data.quantity);

    // Busca o produto atualizado
    const updatedProduct = await tx.product.findUnique({
      where: { id: data.productId },
      select: {
        id: true,
        name: true,
        currentStock: true,
        lastMovementAt: true,
      },
    });

    return {
      ...movement,
      product: updatedProduct,
    };
  });

  return result;
}

/**
 * Cria múltiplas movimentações em lote
 */
export async function createBatchMovements(
  userId: number,
  companyId: number,
  movements: Array<{
    productId: number;
    type: "IN" | "OUT";
    quantity: number;
    reason?: string | null;
  }>
) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  // Valida todos os produtos e estoques antes de processar
  const productValidations = await Promise.all(
    movements.map(async (movement) => {
      const product = await verifyProductAccess(movement.productId, companyId);

      if (movement.type === "OUT") {
        validateStockForOut(Number(product.currentStock), movement.quantity);
      }

      return {
        movement,
        product,
      };
    })
  );

  // Processa todas as movimentações em uma transação
  const results = await prisma.$transaction(async (tx) => {
    const createdMovements = [];

    for (const { movement } of productValidations) {
      // Cria a movimentação
      const createdMovement = await tx.stockMovement.create({
        data: {
          productId: movement.productId,
          companyId,
          type: movement.type,
          quantity: movement.quantity,
          reason: movement.reason || null,
          userId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              currentStock: true,
            },
          },
        },
      });

      // Atualiza o estoque do produto
      await updateProductStock(movement.productId, movement.type, movement.quantity);

      // Busca o produto atualizado
      const updatedProduct = await tx.product.findUnique({
        where: { id: movement.productId },
        select: {
          id: true,
          name: true,
          currentStock: true,
          lastMovementAt: true,
        },
      });

      createdMovements.push({
        ...createdMovement,
        product: updatedProduct,
      });
    }

    return createdMovements;
  });

  return results;
}

/**
 * Lista movimentações de uma empresa com filtros
 */
export async function listMovements(
  userId: number,
  companyId: number,
  filters?: {
    productId?: number;
    type?: "IN" | "OUT";
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }
) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  // Configuração de paginação
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const skip = (page - 1) * limit;

  // Construção do where
  const where: any = {
    companyId,
  };

  // Filtro por produto
  if (filters?.productId) {
    where.productId = filters.productId;
  }

  // Filtro por tipo
  if (filters?.type) {
    where.type = filters.type;
  }

  // Filtro por data
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  // Busca movimentações
  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            barcode: true,
            currentStock: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return {
    movements,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

