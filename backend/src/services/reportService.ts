/**
 * Service de Relatórios
 * 
 * Fornece dados agregados para relatórios por período.
 */

import prisma from "../config/prisma";
import * as companyService from "./companyService";
// import { format } from "date-fns";

interface ReportPeriod {
  startDate: string;
  endDate: string;
  type: 'day' | 'week' | 'month' | 'year';
}

interface ReportData {
  period: ReportPeriod;
  sales: {
    total: number;
    totalValue: number;
    byType: {
      products: number;
      services: number;
    };
    averageTicket: number;
  };
  products: {
    totalSold: number;
    totalValue: number;
    lowStock: number;
    topSelling: Array<{
      id: number;
      name: string;
      quantity: number;
      value: number;
    }>;
  };
  services: {
    totalPerformed: number;
    totalValue: number;
    topServices: Array<{
      id: number;
      name: string;
      quantity: number;
      value: number;
    }>;
  };
  movements: {
    total: number;
    entries: number;
    exits: number;
    byDay: Array<{
      date: string;
      entries: number;
      exits: number;
    }>;
  };
  returns: {
    total: number;
    returns: number;
    refunds: number;
    exchanges: number;
    totalValue: number;
  };
  customers: {
    total: number;
    newCustomers: number;
    topCustomers: Array<{
      name: string;
      totalPurchases: number;
      totalValue: number;
    }>;
  };
  stock: {
    currentValue: number;
    totalProducts: number;
    lowStockProducts: number;
    outOfStock: number;
  };
}

export async function getReportData(
  userId: number,
  companyId: number,
  startDate: string,
  endDate: string,
  periodType: 'day' | 'week' | 'month' | 'year'
): Promise<ReportData> {
  // Verifica acesso à empresa
  const hasAccess = await companyService.userHasAccessToCompany(userId, companyId);
  if (!hasAccess) {
    throw new Error("Empresa não encontrada ou você não tem acesso");
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999); // Fim do dia

  // Vendas no período
  const sales = await prisma.sale.findMany({
    where: {
      companyId,
      type: { in: ['SALE', 'SERVICE'] },
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          unitPrice: true,
          isService: true,
        },
      },
    },
  });

  // Devoluções/Reembolsos/Trocas no período
  const returns = await prisma.sale.findMany({
    where: {
      companyId,
      type: { in: ['RETURN', 'REFUND', 'EXCHANGE'] },
      createdAt: {
        gte: start,
        lte: end,
      },
    },
    include: {
      product: {
        select: {
          unitPrice: true,
        },
      },
    },
  });

  // Movimentações no período
  const movements = await prisma.stockMovement.findMany({
    where: {
      companyId,
      createdAt: {
        gte: start,
        lte: end,
      },
    },
  });

  // Produtos
  const allProducts = await prisma.product.findMany({
    where: {
      companyId,
      isService: false,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      currentStock: true,
      unitPrice: true,
    },
  });

  // Clientes únicos
  const uniqueCustomers = new Set<string>();
  const customerPurchases = new Map<string, { purchases: number; value: number }>();
  
  sales.forEach((sale) => {
    if (sale.customerName) {
      uniqueCustomers.add(sale.customerName);
      const current = customerPurchases.get(sale.customerName) || { purchases: 0, value: 0 };
      const unitPrice = sale.product.unitPrice ? Number(sale.product.unitPrice) : 0;
      const quantity = Number(sale.quantity);
      customerPurchases.set(sale.customerName, {
        purchases: current.purchases + 1,
        value: current.value + (unitPrice * quantity),
      });
    }
  });

  // Clientes novos (primeira compra no período)
  const allCustomersBeforePeriod = await prisma.sale.findMany({
    where: {
      companyId,
      createdAt: { lt: start },
    },
    select: {
      customerName: true,
    },
  });
  
  // Filtrar apenas clientes com nome não nulo e remover duplicatas
  const existingCustomersSet = new Set<string>();
  allCustomersBeforePeriod.forEach((s) => {
    if (s.customerName) {
      existingCustomersSet.add(s.customerName);
    }
  });
  const existingCustomers = existingCustomersSet;

  const newCustomers = Array.from(uniqueCustomers).filter(
    (name) => !existingCustomers.has(name)
  ).length;

  // Agregação de vendas
  const salesByType = {
    products: sales.filter((s) => s.type === 'SALE' && !s.product.isService).length,
    services: sales.filter((s) => s.type === 'SERVICE' || s.product.isService).length,
  };

  const totalSalesValue = sales.reduce((sum, sale) => {
    const unitPrice = sale.product.unitPrice ? Number(sale.product.unitPrice) : 0;
    const quantity = Number(sale.quantity);
    return sum + (unitPrice * quantity);
  }, 0);

  const averageTicket = sales.length > 0 ? totalSalesValue / sales.length : 0;

  // Produtos mais vendidos
  const productSales = new Map<number, { name: string; quantity: number; value: number }>();
  
  sales
    .filter((s) => s.type === 'SALE' && !s.product.isService)
    .forEach((sale) => {
      const current = productSales.get(sale.productId) || {
        name: sale.product.name,
        quantity: 0,
        value: 0,
      };
      const unitPrice = sale.product.unitPrice ? Number(sale.product.unitPrice) : 0;
      const quantity = Number(sale.quantity);
      productSales.set(sale.productId, {
        name: sale.product.name,
        quantity: current.quantity + quantity,
        value: current.value + (unitPrice * quantity),
      });
    });

  const topSellingProducts = Array.from(productSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const totalProductsSold = topSellingProducts.reduce((sum, p) => sum + p.quantity, 0);
  const totalProductsValue = topSellingProducts.reduce((sum, p) => sum + p.value, 0);

  // Serviços mais prestados
  const serviceSales = new Map<number, { name: string; quantity: number; value: number }>();
  
  sales
    .filter((s) => s.type === 'SERVICE' || s.product.isService)
    .forEach((sale) => {
      const current = serviceSales.get(sale.productId) || {
        name: sale.product.name,
        quantity: 0,
        value: 0,
      };
      const unitPrice = sale.product.unitPrice ? Number(sale.product.unitPrice) : 0;
      const quantity = Number(sale.quantity);
      serviceSales.set(sale.productId, {
        name: sale.product.name,
        quantity: current.quantity + quantity,
        value: current.value + (unitPrice * quantity),
      });
    });

  const topServices = Array.from(serviceSales.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);

  const totalServicesPerformed = topServices.reduce((sum, s) => sum + s.quantity, 0);
  const totalServicesValue = topServices.reduce((sum, s) => sum + s.value, 0);

  // Movimentações
  const entries = movements.filter((m) => m.type === 'IN').length;
  const exits = movements.filter((m) => m.type === 'OUT').length;

  // Movimentações por dia
  const movementsByDayMap = new Map<string, { entries: number; exits: number }>();
  movements.forEach((m) => {
    const date = m.createdAt.toISOString().split('T')[0];
    const current = movementsByDayMap.get(date) || { entries: 0, exits: 0 };
    if (m.type === 'IN') {
      current.entries++;
    } else {
      current.exits++;
    }
    movementsByDayMap.set(date, current);
  });

  const movementsByDay = Array.from(movementsByDayMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Devoluções/Reembolsos/Trocas
  const returnsCount = returns.filter((r) => r.type === 'RETURN').length;
  const refundsCount = returns.filter((r) => r.type === 'REFUND').length;
  const exchangesCount = returns.filter((r) => r.type === 'EXCHANGE').length;

  const returnsValue = returns.reduce((sum, r) => {
    const unitPrice = r.product.unitPrice ? Number(r.product.unitPrice) : 0;
    const quantity = Number(r.quantity);
    return sum + (unitPrice * quantity);
  }, 0);

  // Estoque
  const lowStockProducts = allProducts.filter((p) => Number(p.currentStock) < 2).length;
  const outOfStock = allProducts.filter((p) => Number(p.currentStock) === 0).length;
  const stockValue = allProducts.reduce((sum, p) => {
    const unitPrice = p.unitPrice ? Number(p.unitPrice) : 0;
    const stock = Number(p.currentStock);
    return sum + (unitPrice * stock);
  }, 0);

  // Top clientes
  const topCustomers = Array.from(customerPurchases.entries())
    .map(([name, data]) => ({
      name,
      totalPurchases: data.purchases,
      totalValue: data.value,
    }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 10);

  return {
    period: {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      type: periodType,
    },
    sales: {
      total: sales.length,
      totalValue: totalSalesValue,
      byType: salesByType,
      averageTicket,
    },
    products: {
      totalSold: totalProductsSold,
      totalValue: totalProductsValue,
      lowStock: lowStockProducts,
      topSelling: topSellingProducts,
    },
    services: {
      totalPerformed: totalServicesPerformed,
      totalValue: totalServicesValue,
      topServices,
    },
    movements: {
      total: movements.length,
      entries,
      exits,
      byDay: movementsByDay,
    },
    returns: {
      total: returns.length,
      returns: returnsCount,
      refunds: refundsCount,
      exchanges: exchangesCount,
      totalValue: returnsValue,
    },
    customers: {
      total: uniqueCustomers.size,
      newCustomers,
      topCustomers,
    },
    stock: {
      currentValue: stockValue,
      totalProducts: allProducts.length,
      lowStockProducts,
      outOfStock,
    },
  };
}

