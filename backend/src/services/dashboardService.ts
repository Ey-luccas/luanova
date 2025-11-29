/**
 * Service de Dashboard
 *
 * Contém a lógica de negócio para o dashboard:
 * - Estatísticas gerais (total de produtos, estoque baixo, etc)
 * - Movimentações recentes
 * - Gráficos e relatórios
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
 * Busca dados do dashboard de uma empresa
 */
export async function getDashboardData(userId: number, companyId: number) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  // Data de 7 dias atrás
  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  today.setHours(23, 59, 59, 999);

  // Busca todas as estatísticas em paralelo
  const [
    totalProducts,
    products,
    lowStockProducts,
    recentMovements,
    allMovements,
    categories,
    recentSales,
  ] = await Promise.all([
    // Total de produtos
    prisma.product.count({
      where: { companyId, isActive: true },
    }),

    // Todos os produtos (para calcular valor total) - APENAS PRODUTOS, NÃO SERVIÇOS
    // IMPORTANTE: Sem limite para garantir que todos os produtos sejam considerados
    prisma.product.findMany({
      where: {
        companyId,
        isActive: true,
        isService: false, // Apenas produtos, excluindo serviços
      },
      select: {
        id: true,
        name: true,
        currentStock: true,
        unitPrice: true,
        costPrice: true,
        minStock: true,
      },
      // IMPORTANTE: Não usar take/limit para buscar TODOS os produtos
      // O Prisma não limita por padrão, mas vamos garantir explicitamente
      // Sem take/limit para buscar TODOS os produtos
    }),

    // Produtos com estoque abaixo de 2 (estoque baixo)
    prisma.product.count({
      where: {
        companyId,
        isActive: true,
        isService: false, // Apenas produtos, não serviços
        currentStock: {
          lt: 2, // Estoque menor que 2 (ou seja, 0 ou 1)
        },
      },
    }),

    // Vendas (produtos e serviços) dos últimos 7 dias (para contagem)
    prisma.sale.count({
      where: {
        companyId,
        type: {
          in: ["SALE", "SERVICE"], // Apenas vendas e serviços, excluindo devoluções
        },
        createdAt: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
    }),

    // Todas as movimentações dos últimos 7 dias (para gráfico)
    prisma.stockMovement.findMany({
      where: {
        companyId,
        createdAt: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      select: {
        type: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    }),

    // Categorias com contagem de produtos
    prisma.category.findMany({
      where: { companyId },
      include: {
        _count: {
          select: {
            products: {
              where: { isActive: true },
            },
          },
        },
      },
    }),

    // Vendas (produtos e serviços) dos últimos 7 dias (para calcular valor total)
    prisma.sale.findMany({
      where: {
        companyId,
        type: {
          in: ["SALE", "SERVICE"], // Apenas vendas e serviços, excluindo devoluções
        },
        createdAt: {
          gte: sevenDaysAgo,
          lte: today,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            unitPrice: true,
            costPrice: true,
          },
        },
      },
    }),
  ]);

  // Últimas 20 movimentações
  const last20Movements = await prisma.stockMovement.findMany({
    where: { companyId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          barcode: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  // Buscar informações dos usuários para as movimentações
  const userIds = last20Movements
    .map((m) => m.userId)
    .filter((id): id is number => id !== null && id !== undefined);

  const uniqueUserIds = [...new Set(userIds)];
  const users =
    uniqueUserIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: uniqueUserIds } },
          select: { id: true, name: true, email: true },
        })
      : [];

  const usersMap = new Map(users.map((u) => [u.id, u]));

  // Calcula valor total do estoque (usando preço de custo se disponível, senão preço de venda)
  let totalStockValue = 0;

  // Contador para debug
  let produtosComValor = 0;
  let produtosSemPreco = 0;
  let produtosComEstoqueZero = 0;

  console.log(
    `[getDashboardData] Processando ${products.length} produto(s) para cálculo do valor...`
  );
  console.log(
    `[getDashboardData] Total de produtos encontrados: ${products.length}`
  );

  // Verificar se há muitos produtos (pode indicar problema de paginação)
  // O Prisma pode ter um limite padrão de 1000 registros
  if (products.length >= 1000) {
    console.warn(
      `[getDashboardData] ⚠️ ATENÇÃO: Encontrados ${products.length} produtos. Pode haver limite de paginação do Prisma. Verificando se há mais produtos...`
    );

    // Verificar o total real de produtos
    const totalProductsCount = await prisma.product.count({
      where: {
        companyId,
        isActive: true,
        isService: false,
      },
    });

    if (totalProductsCount > products.length) {
      console.error(
        `[getDashboardData] ❌ ERRO: Existem ${totalProductsCount} produtos, mas apenas ${products.length} foram retornados. O Prisma pode estar limitando os resultados!`
      );
    }
  }

  products.forEach((product, index) => {
    // Helper para converter Decimal do Prisma para number
    // Prisma retorna Decimal como objeto, Number() funciona diretamente
    const toNumber = (value: any): number => {
      if (value == null || value === undefined) return 0;
      if (typeof value === "number" && !isNaN(value)) return value;
      // Prisma Decimal: Number() funciona diretamente no objeto
      const num = Number(value);
      return isNaN(num) ? 0 : num;
    };

    const stock = toNumber(product.currentStock);
    const costPriceNum =
      product.costPrice != null && product.costPrice !== undefined
        ? toNumber(product.costPrice)
        : null;
    const unitPriceNum =
      product.unitPrice != null && product.unitPrice !== undefined
        ? toNumber(product.unitPrice)
        : null;
    // IMPORTANTE: Usar a mesma lógica do reportService
    // O reportService usa apenas unitPrice, então vamos usar unitPrice também
    // para manter consistência entre dashboard e relatórios
    const price =
      unitPriceNum != null && unitPriceNum > 0
        ? unitPriceNum
        : costPriceNum != null && costPriceNum > 0
          ? costPriceNum
          : 0;

    console.log(
      `[getDashboardData] Produto ${index + 1} (${product.name || "sem nome"}):`,
      {
        id: product.id,
        rawStock: product.currentStock,
        rawStockType: typeof product.currentStock,
        stock,
        rawCostPrice: product.costPrice,
        rawCostPriceType: typeof product.costPrice,
        costPrice: costPriceNum,
        rawUnitPrice: product.unitPrice,
        rawUnitPriceType: typeof product.unitPrice,
        unitPrice: unitPriceNum,
        precoUsado: price,
      }
    );

    // Calcular valor do produto (mesma lógica do reportService)
    // IMPORTANTE: Considerar TODOS os produtos, mesmo com estoque 0 ou sem preço
    // Mas só somar se tiver preço válido
    if (price > 0) {
      const productValue = stock * price;
      totalStockValue += productValue;
      produtosComValor++;
      if (stock === 0) {
        produtosComEstoqueZero++;
      }
      if (index < 10) {
        // Log apenas dos primeiros 10 para não poluir
        console.log(
          `[getDashboardData] ✅ Produto "${product.name || "sem nome"}" (ID: ${product.id}): valor = R$ ${productValue.toFixed(2)} (${stock} × ${price})`
        );
      }
    } else {
      produtosSemPreco++;
      if (index < 10) {
        // Log apenas dos primeiros 10 para não poluir
        console.log(
          `[getDashboardData] ⚠️ Produto "${product.name || "sem nome"}" (ID: ${product.id}) sem preço: estoque=${stock}, preço=${price}`
        );
      }
    }
  });

  // Garantir que o valor seja um número válido
  const finalStockValue = Number(totalStockValue) || 0;

  console.log(
    `[getDashboardData] 💰 Valor total do estoque calculado: R$ ${finalStockValue.toFixed(2)}`
  );
  console.log(
    `[getDashboardData] 💰 Tipo do valor: ${typeof finalStockValue}, Valor: ${finalStockValue}`
  );
  console.log(
    `[getDashboardData] 📊 Estatísticas: ${produtosComValor} produtos com valor, ${produtosSemPreco} sem preço, ${produtosComEstoqueZero} com estoque zero`
  );
  console.log(
    `[getDashboardData] Total de produtos processados: ${products.length}`
  );

  // Agrupa movimentações por dia
  const movementsByDayMap = new Map<
    string,
    { entries: number; exits: number }
  >();

  // Nomes dos dias da semana em português
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  // Inicializa os últimos 7 dias
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayKey = dayNames[date.getDay()];
    movementsByDayMap.set(dayKey, { entries: 0, exits: 0 });
  }

  // Agrupa movimentações por dia
  allMovements.forEach((movement) => {
    const date = new Date(movement.createdAt);
    const dayKey = dayNames[date.getDay()];

    if (movementsByDayMap.has(dayKey)) {
      const dayData = movementsByDayMap.get(dayKey)!;
      if (movement.type === "IN") {
        dayData.entries++;
      } else {
        dayData.exits++;
      }
    }
  });

  // Converte Map para array (mantém ordem dos últimos 7 dias)
  const movementsByDay: Array<{
    date: string;
    entries: number;
    exits: number;
  }> = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayKey = dayNames[date.getDay()];
    const dayData = movementsByDayMap.get(dayKey) || { entries: 0, exits: 0 };
    movementsByDay.push({
      date: dayKey,
      entries: dayData.entries,
      exits: dayData.exits,
    });
  }

  // Distribuição por categoria
  const distributionByCategory = categories.map((category) => ({
    category: category.name,
    count: category._count.products,
  }));

  // Calcula o valor total movimentado em vendas (produtos e serviços) dos últimos 7 dias
  let totalSalesValue = 0;
  recentSales.forEach((sale) => {
    const quantity = Number(sale.quantity);
    const unitPrice = sale.product.unitPrice
      ? Number(sale.product.unitPrice)
      : sale.product.costPrice
        ? Number(sale.product.costPrice)
        : 0;

    if (quantity > 0 && unitPrice > 0) {
      totalSalesValue += quantity * unitPrice;
    }
  });

  // Formata movimentações recentes
  const formattedMovements = last20Movements.map((movement) => {
    const user = movement.userId ? usersMap.get(movement.userId) : null;
    return {
      id: movement.id,
      productName: movement.product.name,
      type: movement.type as "IN" | "OUT",
      quantity: Number(movement.quantity),
      createdAt: movement.createdAt.toISOString(),
      responsible: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
          }
        : null,
    };
  });

  return {
    totalProducts,
    lowStockProducts,
    totalStockValue: finalStockValue, // Garantir que seja um número válido
    recentMovementsCount: recentMovements,
    totalSalesValue, // Valor total movimentado em vendas e serviços
    movementsByDay,
    distributionByCategory,
    recentMovements: formattedMovements,
  };
}
