/**
 * Service para gerenciar comandas e pedidos
 */

import prisma from '../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Cria um registro de histórico para uma comanda
 */
async function createOrderHistory(
  orderId: number,
  companyId: number,
  action: string,
  userId?: number,
  changes?: any,
  description?: string,
  previousData?: any,
) {
  try {
    await prisma.restaurantOrderHistory.create({
      data: {
        orderId,
        companyId,
        action,
        userId: userId || null,
        changes: changes ? JSON.stringify(changes) : null,
        description: description || null,
        previousData: previousData ? JSON.stringify(previousData) : null,
      },
    });
  } catch (error) {
    console.error('Erro ao criar histórico da comanda:', error);
    // Não lança erro para não interromper o fluxo principal
  }
}

export interface CreateOrderData {
  tableId?: number;
  waiterId?: number;
  orderType: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
  customerName?: string;
  customerPhone?: string;
  numberOfPeople?: number;
  notes?: string;
}

export interface AddOrderItemData {
  menuItemId: number;
  quantity: number;
  size?: string;
  isHalf?: boolean;
  isThird?: boolean;
  flavors?: string[];
  addons?: string[];
  notes?: string;
}

export interface UpdateOrderItemData {
  quantity?: number;
  size?: string;
  isHalf?: boolean;
  isThird?: boolean;
  flavors?: string[];
  addons?: string[];
  notes?: string;
  status?: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
}

export interface SplitOrderData {
  type: 'BY_VALUE' | 'BY_ITEMS' | 'BY_PERSON';
  value?: number;
  items?: number[];
  people?: number;
}

/**
 * Atualiza o status da mesa baseado nas comandas abertas
 */
async function updateTableStatusBasedOnOrders(tableId: number) {
  const table = await prisma.restaurantTable.findUnique({
    where: { id: tableId },
  });

  if (!table) {
    return;
  }

  // Verifica se há comandas abertas para esta mesa
  const openOrders = await prisma.restaurantOrder.findMany({
    where: {
      tableId,
      status: {
        in: ['OPEN', 'SENT_TO_KITCHEN', 'PREPARING', 'READY', 'DELIVERED'],
      },
    },
  });

  // Atualiza o status da mesa baseado nas comandas
  const newStatus = openOrders.length > 0 ? 'OCCUPIED' : 'FREE';
  
  if (table.status !== newStatus) {
    await prisma.restaurantTable.update({
      where: { id: tableId },
      data: { status: newStatus },
    });
  }
}

/**
 * Lista todas as comandas de uma empresa
 */
export async function listOrders(
  companyId: number,
  filters?: {
    tableId?: number;
    waiterId?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  },
) {
  const where: any = {
    companyId,
  };

  if (filters?.tableId) where.tableId = filters.tableId;
  if (filters?.waiterId) where.waiterId = filters.waiterId;
  if (filters?.status) where.status = filters.status;
  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  return await prisma.restaurantOrder.findMany({
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
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Busca uma comanda por ID
 */
export async function getOrderById(companyId: number, orderId: number) {
  return await prisma.restaurantOrder.findFirst({
    where: {
      id: orderId,
      companyId,
    },
    include: {
      table: true,
      waiter: true,
      items: {
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

/**
 * Cria uma nova comanda
 */
export async function createOrder(companyId: number, data: CreateOrderData) {
  // Verifica se a mesa existe (se fornecida)
  if (data.tableId) {
    const table = await prisma.restaurantTable.findFirst({
      where: {
        id: data.tableId,
        companyId,
      },
    });

    if (!table) {
      throw new Error('Mesa não encontrada');
    }
  }

  // Verifica se o garçom existe (se fornecido)
  if (data.waiterId) {
    const waiter = await prisma.restaurantWaiter.findFirst({
      where: {
        id: data.waiterId,
        companyId,
      },
    });

    if (!waiter) {
      throw new Error('Garçom não encontrado');
    }
  }

  const order = await prisma.restaurantOrder.create({
    data: {
      ...data,
      companyId,
      subtotal: new Decimal(0),
      serviceFee: new Decimal(0),
      tip: new Decimal(0),
      total: new Decimal(0),
    },
    include: {
      table: true,
      waiter: true,
      items: true,
    },
  });

  // Atualiza o status da mesa baseado nas comandas abertas
  if (data.tableId) {
    await updateTableStatusBasedOnOrders(data.tableId);
  }

  return order;
}

/**
 * Adiciona um item à comanda
 */
export async function addOrderItem(
  companyId: number,
  orderId: number,
  data: AddOrderItemData,
) {
  const order = await prisma.restaurantOrder.findFirst({
    where: {
      id: orderId,
      companyId,
    },
  });

  if (!order) {
    throw new Error('Comanda não encontrada');
  }

  if (order.status === 'CLOSED' || order.status === 'CANCELLED') {
    throw new Error('Não é possível adicionar itens a uma comanda fechada');
  }

  const menuItem = await prisma.restaurantMenuItem.findFirst({
    where: {
      id: data.menuItemId,
      companyId,
    },
  });

  if (!menuItem) {
    throw new Error('Item do cardápio não encontrado');
  }

  if (!menuItem.isAvailable) {
    throw new Error('Item não está disponível no momento');
  }

  // Calcula o preço do item
  let unitPrice = Number(menuItem.price);

  // Aplica preço por tamanho se fornecido
  if (data.size && menuItem.sizesPrices) {
    const sizesPrices = JSON.parse(menuItem.sizesPrices);
    if (sizesPrices[data.size]) {
      unitPrice = sizesPrices[data.size];
    }
  }

  // Aplica desconto para meia pizza
  if (data.isHalf && menuItem.allowHalf) {
    unitPrice = unitPrice / 2;
  }

  // Aplica desconto para terço de pizza
  if (data.isThird && menuItem.allowThird) {
    unitPrice = unitPrice / 3;
  }

  // Adiciona preço dos adicionais (se houver sistema de preços de adicionais)
  // Por enquanto, assumimos que os adicionais não alteram o preço
  // Mas pode ser implementado depois

  const subtotal = new Decimal(unitPrice * data.quantity);

  const orderItem = await prisma.restaurantOrderItem.create({
    data: {
      orderId,
      menuItemId: data.menuItemId,
      quantity: new Decimal(data.quantity),
      unitPrice: new Decimal(unitPrice),
      size: data.size || null,
      isHalf: data.isHalf || false,
      isThird: data.isThird || false,
      flavors: data.flavors ? JSON.stringify(data.flavors) : null,
      addons: data.addons ? JSON.stringify(data.addons) : null,
      notes: data.notes || null,
      subtotal,
    },
    include: {
      menuItem: {
        include: {
          category: true,
        },
      },
    },
  });

  // Atualiza totais da comanda
  await recalculateOrderTotals(orderId);

  return orderItem;
}

/**
 * Atualiza um item da comanda
 */
export async function updateOrderItem(
  companyId: number,
  orderId: number,
  itemId: number,
  data: UpdateOrderItemData,
) {
  const order = await prisma.restaurantOrder.findFirst({
    where: {
      id: orderId,
      companyId,
    },
  });

  if (!order) {
    throw new Error('Comanda não encontrada');
  }

  const orderItem = await prisma.restaurantOrderItem.findFirst({
    where: {
      id: itemId,
      orderId,
    },
    include: {
      menuItem: true,
    },
  });

  if (!orderItem) {
    throw new Error('Item não encontrado');
  }

  // Se o item foi enviado para cozinha, não permite alterações (exceto status)
  if (
    orderItem.sentToKitchenAt &&
    data.quantity !== undefined &&
    data.quantity !== Number(orderItem.quantity)
  ) {
    throw new Error(
      'Não é possível alterar a quantidade de um item já enviado para cozinha',
    );
  }

  const updateData: any = {};

  if (data.quantity !== undefined) {
    updateData.quantity = new Decimal(data.quantity);
    // Recalcula subtotal
    const unitPrice = Number(orderItem.unitPrice);
    updateData.subtotal = new Decimal(unitPrice * data.quantity);
  }

  if (data.size !== undefined) updateData.size = data.size;
  if (data.isHalf !== undefined) updateData.isHalf = data.isHalf;
  if (data.isThird !== undefined) updateData.isThird = data.isThird;
  if (data.flavors !== undefined)
    updateData.flavors = data.flavors ? JSON.stringify(data.flavors) : null;
  if (data.addons !== undefined)
    updateData.addons = data.addons ? JSON.stringify(data.addons) : null;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.status !== undefined) updateData.status = data.status;

  // Atualiza timestamps baseado no status
  if (data.status === 'PREPARING' && !orderItem.startedAt) {
    updateData.startedAt = new Date();
  }
  if (data.status === 'READY' && !orderItem.readyAt) {
    updateData.readyAt = new Date();
  }
  if (data.status === 'DELIVERED' && !orderItem.deliveredAt) {
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
    },
  });

  // Atualiza totais da comanda
  await recalculateOrderTotals(orderId);

  return updated;
}

/**
 * Remove um item da comanda
 */
export async function removeOrderItem(
  companyId: number,
  orderId: number,
  itemId: number,
) {
  const order = await prisma.restaurantOrder.findFirst({
    where: {
      id: orderId,
      companyId,
    },
  });

  if (!order) {
    throw new Error('Comanda não encontrada');
  }

  const orderItem = await prisma.restaurantOrderItem.findFirst({
    where: {
      id: itemId,
      orderId,
    },
  });

  if (!orderItem) {
    throw new Error('Item não encontrado');
  }

  // Se o item foi enviado para cozinha, não permite remoção
  if (orderItem.sentToKitchenAt) {
    throw new Error(
      'Não é possível remover um item já enviado para cozinha. Cancele o item ao invés de removê-lo.',
    );
  }

  await prisma.restaurantOrderItem.delete({
    where: { id: itemId },
  });

  // Atualiza totais da comanda
  await recalculateOrderTotals(orderId);
}

/**
 * Envia comanda para cozinha
 */
export async function sendOrderToKitchen(companyId: number, orderId: number) {
  const order = await prisma.restaurantOrder.findFirst({
    where: {
      id: orderId,
      companyId,
    },
    include: {
      items: {
        where: {
          status: 'PENDING',
        },
      },
    },
  });

  if (!order) {
    throw new Error('Comanda não encontrada');
  }

  if (order.items.length === 0) {
    throw new Error('Não há itens pendentes para enviar à cozinha');
  }

  // Atualiza status dos itens pendentes
  await prisma.restaurantOrderItem.updateMany({
    where: {
      orderId,
      status: 'PENDING',
    },
    data: {
      status: 'PREPARING',
      sentToKitchenAt: new Date(),
      startedAt: new Date(),
    },
  });

  // Atualiza status da comanda
  const updatedOrder = await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: {
      status: 'SENT_TO_KITCHEN',
    },
    include: {
      items: {
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  return updatedOrder;
}

/**
 * Move uma comanda de uma mesa para outra
 */
export async function moveOrderToTable(
  companyId: number,
  orderId: number,
  newTableId: number,
) {
  const order = await prisma.restaurantOrder.findFirst({
    where: {
      id: orderId,
      companyId,
    },
  });

  if (!order) {
    throw new Error('Comanda não encontrada');
  }

  const newTable = await prisma.restaurantTable.findFirst({
    where: {
      id: newTableId,
      companyId,
    },
  });

  if (!newTable) {
    throw new Error('Mesa não encontrada');
  }

  // Atualiza a comanda
  const updatedOrder = await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: {
      tableId: newTableId,
    },
  });

  // Atualiza o status das mesas baseado nas comandas abertas
  if (order.tableId) {
    await updateTableStatusBasedOnOrders(order.tableId);
  }
  await updateTableStatusBasedOnOrders(newTableId);

  return updatedOrder;
}

/**
 * Junta duas comandas (mesas)
 */
export async function mergeOrders(
  companyId: number,
  sourceOrderId: number,
  targetOrderId: number,
) {
  const sourceOrder = await prisma.restaurantOrder.findFirst({
    where: {
      id: sourceOrderId,
      companyId,
    },
    include: {
      items: true,
    },
  });

  const targetOrder = await prisma.restaurantOrder.findFirst({
    where: {
      id: targetOrderId,
      companyId,
    },
  });

  if (!sourceOrder || !targetOrder) {
    throw new Error('Comanda não encontrada');
  }

  if (sourceOrder.status === 'CLOSED' || targetOrder.status === 'CLOSED') {
    throw new Error('Não é possível juntar comandas fechadas');
  }

  // Move todos os itens da comanda origem para a destino
  await prisma.restaurantOrderItem.updateMany({
    where: {
      orderId: sourceOrderId,
    },
    data: {
      orderId: targetOrderId,
    },
  });

  // Atualiza totais da comanda destino
  await recalculateOrderTotals(targetOrderId);

  // Fecha a comanda origem
  await prisma.restaurantOrder.update({
    where: { id: sourceOrderId },
    data: {
      status: 'CLOSED',
      closedAt: new Date(),
    },
  });

  // Atualiza o status da mesa da comanda origem baseado nas comandas abertas restantes
  if (sourceOrder.tableId) {
    await updateTableStatusBasedOnOrders(sourceOrder.tableId);
  }

  return await getOrderById(companyId, targetOrderId);
}

/**
 * Divide uma comanda (cria nova comanda com alguns itens)
 */
export async function splitOrder(
  companyId: number,
  orderId: number,
  itemIds: number[],
) {
  const order = await prisma.restaurantOrder.findFirst({
    where: {
      id: orderId,
      companyId,
    },
    include: {
      items: {
        where: {
          id: {
            in: itemIds,
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error('Comanda não encontrada');
  }

  if (order.items.length === 0) {
    throw new Error('Nenhum item selecionado para dividir');
  }

  // Cria nova comanda
  const newOrder = await prisma.restaurantOrder.create({
    data: {
      companyId,
      tableId: order.tableId,
      waiterId: order.waiterId,
      orderType: order.orderType,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      numberOfPeople: order.numberOfPeople,
      notes: `Dividida da comanda #${orderId}`,
      subtotal: new Decimal(0),
      serviceFee: new Decimal(0),
      tip: new Decimal(0),
      total: new Decimal(0),
    },
  });

  // Move itens selecionados para nova comanda
  await prisma.restaurantOrderItem.updateMany({
    where: {
      id: {
        in: itemIds,
      },
    },
    data: {
      orderId: newOrder.id,
    },
  });

  // Recalcula totais de ambas as comandas
  await recalculateOrderTotals(orderId);
  await recalculateOrderTotals(newOrder.id);

  return await getOrderById(companyId, newOrder.id);
}

/**
 * Fecha uma comanda
 */
export async function closeOrder(
  companyId: number,
  orderId: number,
  data: {
    paymentMethod: string;
    serviceFee?: number;
    tip?: number;
  },
) {
  const order = await prisma.restaurantOrder.findFirst({
    where: {
      id: orderId,
      companyId,
    },
    include: {
      items: {
        where: {
          status: {
            not: 'DELIVERED',
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error('Comanda não encontrada');
  }

  if (order.items.length > 0) {
    throw new Error(
      'Não é possível fechar uma comanda com itens ainda não entregues',
    );
  }

  const serviceFee = data.serviceFee || 0;
  const tip = data.tip || 0;
  const total = Number(order.subtotal) + serviceFee + tip;

  const updatedOrder = await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: {
      status: 'CLOSED',
      paymentMethod: data.paymentMethod,
      serviceFee: new Decimal(serviceFee),
      tip: new Decimal(tip),
      total: new Decimal(total),
      closedAt: new Date(),
    },
  });

  // Atualiza o status da mesa baseado nas comandas abertas restantes
  if (order.tableId) {
    await updateTableStatusBasedOnOrders(order.tableId);
  }

  return updatedOrder;
}

/**
 * Recalcula os totais de uma comanda
 */
async function recalculateOrderTotals(orderId: number) {
  const order = await prisma.restaurantOrder.findUnique({
    where: { id: orderId },
    include: {
      items: true,
    },
  });

  if (!order) return;

  const subtotal = order.items.reduce(
    (sum, item) => sum + Number(item.subtotal),
    0,
  );

  await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: {
      subtotal: new Decimal(subtotal),
      total: new Decimal(
        subtotal + Number(order.serviceFee) + Number(order.tip),
      ),
    },
  });
}

/**
 * Atualiza uma comanda
 */
export async function updateOrder(
  companyId: number,
  orderId: number,
  userId: number,
  data: {
    waiterId?: number;
    customerName?: string;
    customerPhone?: string;
    numberOfPeople?: number;
    notes?: string;
    tableId?: number;
  },
) {
  const order = await prisma.restaurantOrder.findFirst({
    where: {
      id: orderId,
      companyId,
    },
  });

  if (!order) {
    throw new Error('Comanda não encontrada');
  }

  if (order.status === 'CLOSED') {
    throw new Error('Não é possível editar uma comanda fechada');
  }

  // Salva os dados anteriores para o histórico
  const previousData = {
    waiterId: order.waiterId,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    numberOfPeople: order.numberOfPeople,
    notes: order.notes,
    tableId: order.tableId,
  };

  // Identifica as mudanças
  const changes: any = {};
  if (data.waiterId !== undefined && data.waiterId !== order.waiterId) {
    changes.waiterId = { old: order.waiterId, new: data.waiterId };
  }
  if (data.customerName !== undefined && data.customerName !== order.customerName) {
    changes.customerName = { old: order.customerName, new: data.customerName };
  }
  if (data.customerPhone !== undefined && data.customerPhone !== order.customerPhone) {
    changes.customerPhone = { old: order.customerPhone, new: data.customerPhone };
  }
  if (data.numberOfPeople !== undefined && data.numberOfPeople !== order.numberOfPeople) {
    changes.numberOfPeople = { old: order.numberOfPeople, new: data.numberOfPeople };
  }
  if (data.notes !== undefined && data.notes !== order.notes) {
    changes.notes = { old: order.notes, new: data.notes };
  }
  if (data.tableId !== undefined && data.tableId !== order.tableId) {
    changes.tableId = { old: order.tableId, new: data.tableId };
  }

  const updateData: any = {};
  if (data.waiterId !== undefined) updateData.waiterId = data.waiterId;
  if (data.customerName !== undefined) updateData.customerName = data.customerName;
  if (data.customerPhone !== undefined) updateData.customerPhone = data.customerPhone;
  if (data.numberOfPeople !== undefined) updateData.numberOfPeople = data.numberOfPeople;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.tableId !== undefined) updateData.tableId = data.tableId;

  const updatedOrder = await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: updateData,
    include: {
      table: true,
      waiter: true,
      items: {
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  // Cria registro de histórico
  if (Object.keys(changes).length > 0) {
    await createOrderHistory(
      orderId,
      companyId,
      'UPDATED',
      userId,
      changes,
      `Comanda atualizada: ${Object.keys(changes).join(', ')}`,
      previousData,
    );
  }

  // Atualiza status da mesa se necessário
  if (data.tableId !== undefined && data.tableId !== order.tableId) {
    if (order.tableId) {
      await updateTableStatusBasedOnOrders(order.tableId);
    }
    if (data.tableId) {
      await updateTableStatusBasedOnOrders(data.tableId);
    }
  }

  return updatedOrder;
}

/**
 * Exclui uma comanda (soft delete - marca como CANCELLED)
 */
export async function deleteOrder(
  companyId: number,
  orderId: number,
  userId: number,
  reason?: string,
) {
  const order = await prisma.restaurantOrder.findFirst({
    where: {
      id: orderId,
      companyId,
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new Error('Comanda não encontrada');
  }

  if (order.status === 'CLOSED') {
    throw new Error('Não é possível excluir uma comanda fechada');
  }

  // Salva os dados anteriores para o histórico
  const previousData = {
    ...order,
    items: order.items,
  };

  // Marca como cancelada ao invés de deletar
  const updatedOrder = await prisma.restaurantOrder.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      notes: order.notes
        ? `${order.notes}\n[EXCLUÍDA] ${reason || 'Sem motivo informado'}`
        : `[EXCLUÍDA] ${reason || 'Sem motivo informado'}`,
    },
    include: {
      table: true,
      waiter: true,
      items: {
        include: {
          menuItem: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  // Cria registro de histórico
  await createOrderHistory(
    orderId,
    companyId,
    'DELETED',
    userId,
    { status: { old: order.status, new: 'CANCELLED' } },
    reason || 'Comanda excluída',
    previousData,
  );

  // Atualiza status da mesa
  if (order.tableId) {
    await updateTableStatusBasedOnOrders(order.tableId);
  }

  return updatedOrder;
}

/**
 * Busca o histórico de uma comanda
 */
export async function getOrderHistory(companyId: number, orderId: number) {
  const order = await prisma.restaurantOrder.findFirst({
    where: {
      id: orderId,
      companyId,
    },
  });

  if (!order) {
    throw new Error('Comanda não encontrada');
  }

  const history = await prisma.restaurantOrderHistory.findMany({
    where: {
      orderId,
      companyId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return history.map((h) => ({
    ...h,
    changes: h.changes ? JSON.parse(h.changes) : null,
    previousData: h.previousData ? JSON.parse(h.previousData) : null,
  }));
}

