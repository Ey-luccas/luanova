/**
 * Service de Vendas e Devoluções
 *
 * Contém a lógica de negócio para:
 * - Criação de vendas e prestações de serviços
 * - Criação de devoluções e reembolsos
 * - Busca de vendas por cliente
 * - Gerenciamento de estoque relacionado a vendas/devoluções
 */

import prisma from "../config/prisma";
import * as companyService from "./companyService";

/**
 * Verifica se o usuário tem acesso à empresa
 */
async function verifyCompanyAccess(userId: number, companyId: number) {
  const hasAccess = await companyService.userHasAccessToCompany(
    userId,
    companyId
  );
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
 * Valida se há estoque suficiente para venda
 */
function validateStockForSale(currentStock: number, quantity: number) {
  if (quantity > currentStock) {
    throw new Error(
      `Estoque insuficiente. Estoque atual: ${currentStock}, Tentativa de venda: ${quantity}`
    );
  }
}

/**
 * Cria uma venda ou prestação de serviço
 */
export async function createSale(
  userId: number,
  companyId: number,
  data: {
    productId: number;
    type: "SALE" | "SERVICE"; // Venda ou Prestação
    quantity: number;
    customerName: string;
    customerCpf?: string | null;
    customerEmail?: string | null;
    paymentMethod: "PIX" | "CARTAO" | "BOLETO" | "ESPECIE";
    observations?: string | null;
  }
) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  // Verifica se produto existe e pertence à empresa
  const product = await verifyProductAccess(data.productId, companyId);

  // VALIDAÇÃO CRÍTICA: Garantir que tipo de movimentação corresponde ao tipo de produto
  if (data.type === "SALE" && product.isService) {
    throw new Error(
      "Não é possível vender um serviço. Use o tipo 'SERVICE' para prestações de serviço."
    );
  }
  if (data.type === "SERVICE" && !product.isService) {
    throw new Error(
      "Não é possível prestar serviço de um produto. Use o tipo 'SALE' para vendas de produto."
    );
  }

  // Para vendas (não serviços), valida estoque
  if (data.type === "SALE") {
    validateStockForSale(Number(product.currentStock), data.quantity);
  }

  // Cria a venda e atualiza o estoque em uma transação
  const result = await prisma.$transaction(async (tx) => {
    // Busca unidades disponíveis para marcar como vendidas (apenas para vendas, não serviços)
    let unitsToMarkAsSold: any[] = [];
    if (data.type === "SALE") {
      unitsToMarkAsSold = await tx.productUnit.findMany({
        where: {
          productId: data.productId,
          companyId,
          isSold: false,
          isReturned: false,
        },
        take: data.quantity,
      });

      if (unitsToMarkAsSold.length < data.quantity) {
        throw new Error(
          `Não há unidades suficientes disponíveis. Disponível: ${unitsToMarkAsSold.length}, Solicitado: ${data.quantity}`
        );
      }
    }

    // Cria a venda
    const sale = await tx.sale.create({
      data: {
        productId: data.productId,
        companyId,
        userId,
        type: data.type,
        quantity: data.quantity,
        customerName: data.customerName,
        customerCpf: data.customerCpf || null,
        customerEmail: data.customerEmail || null,
        paymentMethod: data.paymentMethod,
        observations: data.observations || null,
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

    // Para vendas, marca unidades como vendidas e reduz estoque
    if (data.type === "SALE" && unitsToMarkAsSold.length > 0) {
      // Atualiza as unidades
      await tx.productUnit.updateMany({
        where: {
          id: { in: unitsToMarkAsSold.map((u) => u.id) },
        },
        data: {
          isSold: true,
          soldAt: new Date(),
          saleId: sale.id,
          sellerName: data.customerName,
          paymentMethods: data.paymentMethod,
        },
      });

      // Atualiza o estoque do produto
      const currentStock = Number(product.currentStock);
      const newStock = currentStock - data.quantity;

      await tx.product.update({
        where: { id: data.productId },
        data: {
          currentStock: newStock,
          lastMovementAt: new Date(),
        },
      });
    }

    // Busca a venda completa
    const createdSale = await tx.sale.findUnique({
      where: { id: sale.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            currentStock: true,
          },
        },
        units: true,
      },
    });

    return createdSale;
  });

  return result;
}

/**
 * Busca vendas por cliente (nome, email, CPF ou data)
 */
export async function findSalesByCustomer(
  userId: number,
  companyId: number,
  searchCriteria: {
    customerName?: string;
    customerEmail?: string;
    customerCpf?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  const where: any = {
    companyId,
    type: { in: ["SALE", "SERVICE"] }, // Apenas vendas/prestações, não devoluções
  };

  // Filtros de busca
  if (searchCriteria.customerName) {
    where.customerName = { contains: searchCriteria.customerName };
  }

  if (searchCriteria.customerEmail) {
    where.customerEmail = { contains: searchCriteria.customerEmail };
  }

  if (searchCriteria.customerCpf) {
    where.customerCpf = searchCriteria.customerCpf;
  }

  if (searchCriteria.startDate || searchCriteria.endDate) {
    where.createdAt = {};
    if (searchCriteria.startDate) {
      where.createdAt.gte = searchCriteria.startDate;
    }
    if (searchCriteria.endDate) {
      where.createdAt.lte = searchCriteria.endDate;
    }
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          barcode: true,
          unitPrice: true,
        },
      },
      units: {
        select: {
          id: true,
          barcode: true,
          isSold: true,
          isReturned: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 50, // Limite de resultados
  });

  return sales;
}

/**
 * Cria uma devolução ou reembolso
 */
export async function createReturn(
  userId: number,
  companyId: number,
  data: {
    saleId: number; // ID da venda original
    type: "RETURN" | "REFUND" | "EXCHANGE"; // Devolução, Reembolso ou Troca
    quantity?: number; // Obrigatório para RETURN e EXCHANGE
    returnAction?: "RESTOCK" | "MAINTENANCE"; // Obrigatório para RETURN
    refundAmount?: number; // Obrigatório para REFUND
    exchangeProductId?: number; // Obrigatório para EXCHANGE
    exchangeQuantity?: number; // Obrigatório para EXCHANGE
    additionalPayment?: number; // Valor adicional pago quando produto novo é mais caro
    observations?: string | null;
  }
) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  // Busca a venda original
  const originalSale = await prisma.sale.findFirst({
    where: {
      id: data.saleId,
      companyId,
      type: { in: ["SALE", "SERVICE"] },
    },
    include: {
      product: true,
      units: {
        where: {
          isSold: true,
          isReturned: false,
        },
      },
    },
  });

  if (!originalSale) {
    throw new Error("Venda original não encontrada");
  }

  // Validações específicas por tipo
  if (data.type === "RETURN") {
    if (!data.quantity || data.quantity <= 0) {
      throw new Error("Quantidade é obrigatória para devolução");
    }
    if (!data.returnAction) {
      throw new Error("Ação de devolução é obrigatória");
    }
    if (data.quantity > originalSale.units.length) {
      throw new Error(
        `Quantidade de devolução maior que a quantidade vendida. Vendido: ${originalSale.units.length}, Solicitado: ${data.quantity}`
      );
    }
  } else if (data.type === "REFUND") {
    if (!data.refundAmount || data.refundAmount <= 0) {
      throw new Error("Valor devolvido é obrigatório para reembolso");
    }
    // Para reembolso, quantidade é sempre 1 (uma prestação/serviço)
    data.quantity = 1;
  } else if (data.type === "EXCHANGE") {
    if (!data.quantity || data.quantity <= 0) {
      throw new Error("Quantidade é obrigatória para troca");
    }
    if (!data.exchangeProductId || data.exchangeProductId <= 0) {
      throw new Error("Produto para troca é obrigatório");
    }
    if (!data.exchangeQuantity || data.exchangeQuantity <= 0) {
      throw new Error("Quantidade do produto para troca é obrigatória");
    }
    // Para troca, sempre volta ao estoque
    data.returnAction = "RESTOCK";
  }

  // Para troca, busca o produto novo
  let exchangeProduct = null;
  if (data.type === "EXCHANGE" && data.exchangeProductId) {
    exchangeProduct = await prisma.product.findFirst({
      where: {
        id: data.exchangeProductId,
        companyId,
        isActive: true,
        isService: false, // Apenas produtos físicos podem ser trocados
      },
    });

    if (!exchangeProduct) {
      throw new Error("Produto para troca não encontrado ou não está ativo");
    }

    // Valida estoque do produto novo
    const currentStock = Number(exchangeProduct.currentStock);
    if (currentStock < (data.exchangeQuantity || 0)) {
      throw new Error(
        `Estoque insuficiente do produto para troca. Disponível: ${currentStock}, Solicitado: ${data.exchangeQuantity}`
      );
    }
  }

  // Cria a devolução e atualiza o estoque em uma transação
  const result = await prisma.$transaction(async (tx) => {
    // Busca unidades vendidas para devolver (para RETURN e EXCHANGE)
    const unitsToReturn =
      (data.type === "RETURN" || data.type === "EXCHANGE") && data.quantity
        ? originalSale.units.slice(0, data.quantity)
        : [];

    // Prepara observações incluindo valor do reembolso se aplicável
    let observations = data.observations || null;
    if (data.type === "REFUND" && data.refundAmount) {
      const refundInfo = `Valor devolvido: R$ ${data.refundAmount.toFixed(2)}`;
      observations = observations
        ? `${refundInfo}. ${observations}`
        : refundInfo;
    }

    // Cria o registro de devolução/reembolso
    const returnSale = await tx.sale.create({
      data: {
        productId: originalSale.productId,
        companyId,
        userId,
        type: data.type,
        quantity: data.quantity || 1, // Para REFUND sempre 1
        customerName: originalSale.customerName,
        customerCpf: originalSale.customerCpf,
        customerEmail: originalSale.customerEmail,
        returnAction: data.returnAction || null, // Apenas para RETURN
        observations: observations,
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

    // Atualiza as unidades (para RETURN e EXCHANGE)
    if (
      (data.type === "RETURN" || data.type === "EXCHANGE") &&
      data.returnAction
    ) {
      for (const unit of unitsToReturn) {
        await tx.productUnit.update({
          where: { id: unit.id },
          data: {
            isReturned: true,
            returnAction: data.returnAction,
          },
        });
      }

      // Se for para voltar ao estoque (RESTOCK), atualiza o estoque do produto
      if (data.returnAction === "RESTOCK" && data.quantity) {
        const currentStock = Number(originalSale.product.currentStock);
        const newStock = currentStock + data.quantity;

        await tx.product.update({
          where: { id: originalSale.productId },
          data: {
            currentStock: newStock,
            lastMovementAt: new Date(),
          },
        });
      }
      // Se for MAINTENANCE, não altera o estoque, apenas marca como devolvido
    }
    // Se for REFUND, não altera estoque nem unidades

    // Para troca, cria a venda do produto novo e processa diferença de valores
    if (
      data.type === "EXCHANGE" &&
      exchangeProduct &&
      data.exchangeProductId &&
      data.exchangeQuantity
    ) {
      const returnPrice = originalSale.product.unitPrice
        ? Number(originalSale.product.unitPrice)
        : 0;
      const returnTotal = returnPrice * (data.quantity || 0);

      const exchangePrice = exchangeProduct.unitPrice
        ? Number(exchangeProduct.unitPrice)
        : 0;
      const exchangeTotal = exchangePrice * data.exchangeQuantity;

      const difference = exchangeTotal - returnTotal;

      // Cria a venda do produto novo
      await tx.sale.create({
        data: {
          productId: data.exchangeProductId,
          companyId,
          userId,
          type: "SALE",
          quantity: data.exchangeQuantity,
          customerName: originalSale.customerName,
          customerCpf: originalSale.customerCpf,
          customerEmail: originalSale.customerEmail,
          paymentMethod: originalSale.paymentMethod,
          observations: `Troca realizada. Produto original: ${originalSale.product.name} (Qtd: ${data.quantity}). ${observations || ""}`,
        },
      });

      // Atualiza estoque do produto novo (reduz)
      const exchangeCurrentStock = Number(exchangeProduct.currentStock);
      const exchangeNewStock = exchangeCurrentStock - data.exchangeQuantity;

      await tx.product.update({
        where: { id: data.exchangeProductId },
        data: {
          currentStock: exchangeNewStock,
          lastMovementAt: new Date(),
        },
      });

      // Processa diferença de valores
      if (difference > 0) {
        // Produto novo é mais caro - cliente deve pagar a diferença
        // Usa o valor adicional pago informado pelo usuário, ou a diferença se não informado
        const paymentAmount = data.additionalPayment || difference;
        const isPaymentInsufficient = paymentAmount < difference;
        const changeAmount =
          paymentAmount > difference ? paymentAmount - difference : 0;

        // Monta observações detalhadas
        let paymentObservations = `Valor adicional pago na troca: R$ ${paymentAmount.toFixed(2)}. Diferença necessária: R$ ${difference.toFixed(2)}.`;

        if (isPaymentInsufficient) {
          const missingAmount = difference - paymentAmount;
          paymentObservations += ` ATENÇÃO: Valor pago é menor que a diferença necessária. Faltam R$ ${missingAmount.toFixed(2)}.`;
        } else if (changeAmount > 0) {
          paymentObservations += ` Troco: R$ ${changeAmount.toFixed(2)}.`;
        }

        // Cria uma venda adicional para registrar o valor que o cliente pagou
        await tx.sale.create({
          data: {
            productId: data.exchangeProductId,
            companyId,
            userId,
            type: "SALE",
            quantity: 0, // Quantidade zero pois é apenas diferença de valor
            customerName: originalSale.customerName,
            customerCpf: originalSale.customerCpf,
            customerEmail: originalSale.customerEmail,
            paymentMethod: originalSale.paymentMethod,
            observations: paymentObservations,
          },
        });
      } else if (difference < 0) {
        // Produto novo é mais barato - deve devolver troco
        // Cria um registro de reembolso para o troco
        const refundAmount = Math.abs(difference);
        await tx.sale.create({
          data: {
            productId: data.exchangeProductId,
            companyId,
            userId,
            type: "REFUND",
            quantity: 1, // Quantidade sempre 1 para reembolso
            customerName: originalSale.customerName,
            customerCpf: originalSale.customerCpf,
            customerEmail: originalSale.customerEmail,
            paymentMethod: originalSale.paymentMethod,
            observations: `Troco da troca: R$ ${refundAmount.toFixed(2)}. Valor a ser devolvido ao cliente do caixa.`,
          },
        });
      }
      // Se difference === 0, não precisa criar registro adicional (troca sem diferença)

      // Atualiza observações da devolução com informações da troca
      const exchangeInfo = `Troca por: ${exchangeProduct.name} (Qtd: ${data.exchangeQuantity}). `;
      let differenceInfo = "";

      if (difference > 0) {
        const paymentAmount = data.additionalPayment || difference;
        const isPaymentInsufficient = paymentAmount < difference;

        if (isPaymentInsufficient) {
          const missingAmount = difference - paymentAmount;
          differenceInfo = `Cliente deve pagar: R$ ${difference.toFixed(2)}. Valor pago: R$ ${paymentAmount.toFixed(2)}. FALTAM R$ ${missingAmount.toFixed(2)}. `;
        } else {
          differenceInfo = `Cliente deve pagar: R$ ${difference.toFixed(2)}. Valor pago: R$ ${paymentAmount.toFixed(2)}. `;
          if (paymentAmount > difference) {
            differenceInfo += `Troco: R$ ${(paymentAmount - difference).toFixed(2)}. `;
          }
        }
      } else if (difference < 0) {
        differenceInfo = `Troco a devolver: R$ ${Math.abs(difference).toFixed(2)}. `;
      } else {
        differenceInfo = "Troca sem diferença de valor. ";
      }

      observations = `${exchangeInfo}${differenceInfo}${observations || ""}`;

      await tx.sale.update({
        where: { id: returnSale.id },
        data: {
          observations: observations,
        },
      });
    }

    // Busca a devolução completa
    const createdReturn = await tx.sale.findUnique({
      where: { id: returnSale.id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            currentStock: true,
          },
        },
        units: true,
      },
    });

    return createdReturn;
  });

  return result;
}

/**
 * Lista vendas/devoluções com filtros
 */
export async function listSales(
  userId: number,
  companyId: number,
  filters?: {
    type?: "SALE" | "SERVICE" | "RETURN" | "REFUND";
    productId?: number;
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

  // Filtro por tipo
  if (filters?.type) {
    where.type = filters.type;
  }

  // Filtro por produto
  if (filters?.productId) {
    where.productId = filters.productId;
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

  // Busca vendas/devoluções
  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            barcode: true,
          },
        },
        units: {
          select: {
            id: true,
            barcode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    sales,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
