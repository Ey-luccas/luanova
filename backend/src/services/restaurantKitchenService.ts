/**
 * Service para gerenciar a tela da cozinha (KDS - Kitchen Display System)
 */

import prisma from '../config/prisma';

export interface KitchenFilters {
  category?: string;
  status?: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED';
  startDate?: Date;
  endDate?: Date;
}

/**
 * Lista pedidos para a cozinha
 */
export async function getKitchenOrders(
  companyId: number,
  filters?: KitchenFilters,
) {
  const where: any = {
    companyId,
    status: {
      in: ['OPEN', 'SENT_TO_KITCHEN', 'PREPARING', 'READY', 'DELIVERED'],
    },
    items: {
      some: {
        status: {
          in: ['PENDING', 'PREPARING', 'READY'],
        },
      },
    },
  };

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const orders = await prisma.restaurantOrder.findMany({
    where,
    include: {
      table: {
        select: {
          id: true,
          number: true,
          name: true,
        },
      },
      waiter: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      items: {
        where: {
          status: {
            in: filters?.status
              ? [filters.status]
              : ['PENDING', 'PREPARING', 'READY'],
            ...(filters?.category && {
              menuItem: {
                category: {
                  name: filters.category,
                },
              },
            }),
          },
        },
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
        orderBy: [
          { sentToKitchenAt: 'asc' },
          { createdAt: 'asc' },
        ],
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Agrupa por categoria
  const groupedByCategory: Record<string, any[]> = {};

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const categoryName = item.menuItem.category.name;
      if (!groupedByCategory[categoryName]) {
        groupedByCategory[categoryName] = [];
      }
      groupedByCategory[categoryName].push({
        ...item,
        order: {
          id: order.id,
          table: order.table,
          waiter: order.waiter,
          createdAt: order.createdAt,
        },
      });
    });
  });

  return {
    orders,
    groupedByCategory,
  };
}

/**
 * Atualiza status de um item na cozinha
 */
export async function updateKitchenItemStatus(
  companyId: number,
  itemId: number,
  status: 'PREPARING' | 'READY' | 'DELIVERED',
) {
  const item = await prisma.restaurantOrderItem.findFirst({
    where: {
      id: itemId,
      order: {
        companyId,
      },
    },
    include: {
      order: true,
    },
  });

  if (!item) {
    throw new Error('Item não encontrado');
  }

  const updateData: any = {
    status,
  };

  if (status === 'PREPARING' && !item.startedAt) {
    updateData.startedAt = new Date();
  }
  if (status === 'READY' && !item.readyAt) {
    updateData.readyAt = new Date();
  }
  if (status === 'DELIVERED' && !item.deliveredAt) {
    updateData.deliveredAt = new Date();
  }

  const updated = await prisma.restaurantOrderItem.update({
    where: { id: itemId },
    data: updateData,
    include: {
      menuItem: {
        include: {
          category: true,
        },
      },
      order: {
        include: {
          table: true,
          waiter: true,
        },
      },
    },
  });

  // Verifica se todos os itens da comanda foram entregues
  const order = await prisma.restaurantOrder.findUnique({
    where: { id: item.orderId },
    include: {
      items: true,
    },
  });

  if (order) {
    const allDelivered = order.items.every(
      (i) => i.status === 'DELIVERED' || i.status === 'CANCELLED',
    );

    if (allDelivered && order.status !== 'DELIVERED') {
      await prisma.restaurantOrder.update({
        where: { id: order.id },
        data: { status: 'DELIVERED' },
      });
    }
  }

  return updated;
}

/**
 * Obtém métricas da cozinha
 */
export async function getKitchenMetrics(
  companyId: number,
  startDate?: Date,
  endDate?: Date,
) {
  const where: any = {
    companyId,
    items: {
      some: {
        sentToKitchenAt: {
          not: null,
        },
      },
    },
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const orders = await prisma.restaurantOrder.findMany({
    where,
    include: {
      items: {
        where: {
          sentToKitchenAt: {
            not: null,
          },
        },
      },
    },
  });

  const items = orders.flatMap((order) => order.items);

  // Calcula tempo médio de preparo
  const itemsWithTime = items.filter(
    (item) => item.startedAt && item.readyAt,
  );

  const avgPreparationTime =
    itemsWithTime.length > 0
      ? itemsWithTime.reduce((sum, item) => {
          const time =
            item.readyAt!.getTime() - item.startedAt!.getTime();
          return sum + time;
        }, 0) /
        itemsWithTime.length /
        60000 // Converte para minutos
      : 0;

  // Conta itens por status
  const statusCounts = {
    PENDING: items.filter((i) => i.status === 'PENDING').length,
    PREPARING: items.filter((i) => i.status === 'PREPARING').length,
    READY: items.filter((i) => i.status === 'READY').length,
    DELIVERED: items.filter((i) => i.status === 'DELIVERED').length,
  };

  // Itens mais preparados
  const itemCounts: Record<number, number> = {};
  items.forEach((item) => {
    itemCounts[item.menuItemId] = (itemCounts[item.menuItemId] || 0) + 1;
  });

  const topItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([menuItemId, count]) => ({
      menuItemId: parseInt(menuItemId, 10),
      count,
    }));

  return {
    avgPreparationTime: Math.round(avgPreparationTime * 10) / 10,
    statusCounts,
    topItems,
    totalItems: items.length,
  };
}

