/**
 * Service para gerenciar mesas do restaurante
 */

import prisma from '../config/prisma';

export interface CreateTableData {
  number: string;
  name?: string;
  capacity: number;
  shape: 'ROUND' | 'SQUARE' | 'RECTANGLE';
  positionX?: number;
  positionY?: number;
}

export interface UpdateTableData {
  name?: string;
  capacity?: number;
  shape?: 'ROUND' | 'SQUARE' | 'RECTANGLE';
  positionX?: number;
  positionY?: number;
  status?: 'FREE' | 'WAITING' | 'OCCUPIED' | 'RESERVED' | 'PAYMENT';
  isActive?: boolean;
}

/**
 * Lista todas as mesas de uma empresa
 */
export async function listTables(companyId: number) {
  return await prisma.restaurantTable.findMany({
    where: { companyId },
    orderBy: [{ number: 'asc' }],
    include: {
      orders: {
        where: {
          status: {
            in: ['OPEN', 'SENT_TO_KITCHEN', 'PREPARING', 'READY', 'DELIVERED'],
          },
        },
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          waiter: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
      reservations: {
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          reservationDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        take: 1,
        orderBy: { reservationDate: 'asc' },
      },
    },
  });
}

/**
 * Busca uma mesa por ID
 */
export async function getTableById(companyId: number, tableId: number) {
  return await prisma.restaurantTable.findFirst({
    where: {
      id: tableId,
      companyId,
    },
    include: {
      orders: {
        where: {
          status: {
            in: ['OPEN', 'SENT_TO_KITCHEN', 'PREPARING', 'READY', 'DELIVERED'],
          },
        },
        orderBy: { createdAt: 'desc' },
        include: {
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
      },
    },
  });
}

/**
 * Cria uma nova mesa
 */
export async function createTable(companyId: number, data: CreateTableData) {
  // Verifica se já existe uma mesa com o mesmo número
  const existing = await prisma.restaurantTable.findUnique({
    where: {
      companyId_number: {
        companyId,
        number: data.number,
      },
    },
  });

  if (existing) {
    throw new Error('Já existe uma mesa com este número');
  }

  return await prisma.restaurantTable.create({
    data: {
      ...data,
      companyId,
    },
  });
}

/**
 * Atualiza uma mesa
 */
export async function updateTable(
  companyId: number,
  tableId: number,
  data: UpdateTableData,
) {
  const table = await prisma.restaurantTable.findFirst({
    where: {
      id: tableId,
      companyId,
    },
  });

  if (!table) {
    throw new Error('Mesa não encontrada');
  }

  return await prisma.restaurantTable.update({
    where: { id: tableId },
    data,
  });
}

/**
 * Remove uma mesa
 */
export async function deleteTable(companyId: number, tableId: number) {
  const table = await prisma.restaurantTable.findFirst({
    where: {
      id: tableId,
      companyId,
    },
    include: {
      orders: {
        where: {
          status: {
            in: ['OPEN', 'SENT_TO_KITCHEN', 'PREPARING', 'READY', 'DELIVERED'],
          },
        },
      },
    },
  });

  if (!table) {
    throw new Error('Mesa não encontrada');
  }

  if (table.orders.length > 0) {
    throw new Error('Não é possível remover uma mesa com pedidos em aberto');
  }

  return await prisma.restaurantTable.delete({
    where: { id: tableId },
  });
}

/**
 * Atualiza o status de uma mesa
 */
export async function updateTableStatus(
  companyId: number,
  tableId: number,
  status: 'FREE' | 'WAITING' | 'OCCUPIED' | 'RESERVED' | 'PAYMENT',
) {
  return await updateTable(companyId, tableId, { status });
}

