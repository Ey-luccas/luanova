import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verifica se o usuário tem acesso à empresa
 */
async function verifyCompanyAccess(userId: number, companyId: number) {
  const companyUser = await prisma.companyUser.findFirst({
    where: {
      userId,
      companyId,
    },
    include: {
      company: true,
    },
  });

  if (!companyUser) {
    throw new Error('Empresa não encontrada ou você não tem acesso');
  }

  // Verifica se a empresa está arquivada
  if (companyUser.company.isArchived === true) {
    throw new Error('Esta empresa está arquivada e não pode ser acessada');
  }

  return companyUser;
}

/**
 * Cria múltiplas unidades de um produto com códigos de barras únicos
 */
export async function createProductUnits(
  userId: number,
  companyId: number,
  productId: number,
  quantity: number
) {
  // Verifica acesso
  await verifyCompanyAccess(userId, companyId);

  // Verifica se o produto existe e pertence à empresa
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      companyId,
    },
  });

  if (!product) {
    throw new Error('Produto não encontrado ou não pertence a esta empresa');
  }

  // Gera código base do produto
  const baseCode = product.barcode || `PROD-${product.id}`;

  // Busca a última unidade criada para este produto para continuar a numeração
  const lastUnit = await prisma.productUnit.findFirst({
    where: {
      productId,
      companyId,
    },
    orderBy: {
      id: 'desc',
    },
  });

  // Determina o próximo número sequencial
  let nextSequence = 1;
  if (lastUnit) {
    // Extrai o número sequencial do código de barras da última unidade
    const match = lastUnit.barcode.match(/-(\d+)$/);
    if (match) {
      nextSequence = parseInt(match[1], 10) + 1;
    }
  }

  console.log(`[createProductUnits] Service - Criando ${quantity} unidade(s) para produto ${productId}`);
  console.log(`[createProductUnits] Service - Base code: ${baseCode}, Next sequence: ${nextSequence}`);

  // Cria as unidades em uma transação
  const units = await prisma.$transaction(
    Array.from({ length: quantity }).map((_, index) => {
      const sequence = nextSequence + index;
      const barcode = `${baseCode}-${String(sequence).padStart(3, '0')}`;

      return prisma.productUnit.create({
        data: {
          productId,
          companyId,
          barcode,
          isSold: false,
        },
      });
    })
  );

  console.log(`[createProductUnits] Service - ${units.length} unidade(s) criada(s) no banco`);

  // Atualiza o estoque do produto
  const currentStock = Number(product.currentStock);
  const newStock = currentStock + quantity;
  
  await prisma.product.update({
    where: { id: productId },
    data: {
      currentStock: newStock,
      lastMovementAt: new Date(),
      // Não marca como inativo automaticamente - estoque 0 = Rascunho (isActive continua true)
    },
  });

  // Cria movimentação de estoque
  await prisma.stockMovement.create({
    data: {
      productId,
      companyId,
      type: 'IN',
      quantity,
      reason: `Criação de ${quantity} unidade(s) com códigos de barras`,
      userId,
    },
  });

  return units;
}

/**
 * Lista unidades criadas em uma data específica
 */
export async function getUnitsByDate(
  userId: number,
  companyId: number,
  date: Date
) {
  await verifyCompanyAccess(userId, companyId);

  // Define início e fim do dia
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const units = await prisma.productUnit.findMany({
    where: {
      companyId,
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return units;
}

/**
 * Lista todas as datas que têm unidades criadas
 */
export async function getUnitsDates(
  userId: number,
  companyId: number
) {
  await verifyCompanyAccess(userId, companyId);

  // Busca todas as unidades e agrupa por data
  const units = await prisma.productUnit.findMany({
    where: {
      companyId,
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Agrupa por data (sem hora)
  const datesMap = new Map<string, { date: Date; count: number }>();
  
  units.forEach((unit) => {
    const dateKey = unit.createdAt.toISOString().split('T')[0];
    
    if (!datesMap.has(dateKey)) {
      datesMap.set(dateKey, {
        date: new Date(unit.createdAt.toISOString().split('T')[0]),
        count: 0,
      });
    }
    
    const entry = datesMap.get(dateKey)!;
    entry.count++;
  });

  return Array.from(datesMap.values()).sort((a, b) => 
    b.date.getTime() - a.date.getTime()
  );
}

/**
 * Busca unidades de um produto específico
 */
export async function getUnitsByProduct(
  userId: number,
  companyId: number,
  productId: number
) {
  await verifyCompanyAccess(userId, companyId);

  // Verifica se o produto existe e pertence à empresa
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      companyId,
    },
    select: {
      id: true,
      name: true,
      createdAt: true, // Incluir data de criação do produto
    },
  });

  if (!product) {
    throw new Error('Produto não encontrado ou não pertence a esta empresa');
  }

  const units = await prisma.productUnit.findMany({
    where: {
      productId,
      companyId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`[getUnitsByProduct] Produto ID: ${productId}, Company ID: ${companyId}`);
  console.log(`[getUnitsByProduct] Unidades encontradas: ${units.length}`);
  console.log(`[getUnitsByProduct] Detalhes das unidades:`, units.map(u => ({
    id: u.id,
    barcode: u.barcode,
    createdAt: u.createdAt,
    isSold: u.isSold,
  })));

  return {
    product: {
      id: product.id,
      name: product.name,
      createdAt: product.createdAt,
    },
    units,
  };
}

/**
 * Marca uma unidade como vendida com informações detalhadas
 */
export async function markUnitAsSold(
  userId: number,
  companyId: number,
  unitId: number,
  saleDetails?: {
    sellerName?: string | null;
    attendantName?: string | null;
    buyerDescription?: string | null;
    paymentMethods?: string | null;
    saleDescription?: string | null;
  }
) {
  await verifyCompanyAccess(userId, companyId);

  const unit = await prisma.productUnit.findFirst({
    where: {
      id: unitId,
      companyId,
    },
  });

  if (!unit) {
    throw new Error('Unidade não encontrada');
  }

  if (unit.isSold) {
    throw new Error('Unidade já foi marcada como vendida');
  }

  const updatedUnit = await prisma.productUnit.update({
    where: { id: unitId },
    data: {
      isSold: true,
      soldAt: new Date(),
      sellerName: saleDetails?.sellerName || null,
      attendantName: saleDetails?.attendantName || null,
      buyerDescription: saleDetails?.buyerDescription || null,
      paymentMethods: saleDetails?.paymentMethods || null,
      saleDescription: saleDetails?.saleDescription || null,
    },
  });

  // Atualiza o estoque do produto
  const product = await prisma.product.findUnique({
    where: { id: unit.productId },
    select: { currentStock: true },
  });

  if (product) {
    const currentStock = Number(product.currentStock);
    if (currentStock > 0) {
      const newStock = currentStock - 1;
      await prisma.product.update({
        where: { id: unit.productId },
        data: {
          currentStock: newStock,
          // Não marca como inativo automaticamente - estoque 0 = Rascunho (isActive continua true)
        },
      });

      // Cria movimentação de saída
      await prisma.stockMovement.create({
        data: {
          productId: unit.productId,
          companyId,
          type: 'OUT',
          quantity: 1,
          reason: `Venda de unidade${saleDetails?.saleDescription ? `: ${saleDetails.saleDescription}` : ''}`,
          userId,
        },
      });
    }
  }

  return updatedUnit;
}
