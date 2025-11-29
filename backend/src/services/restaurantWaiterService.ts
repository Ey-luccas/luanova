/**
 * Service para gerenciar garçons
 */

import prisma from '../config/prisma';

export interface CreateWaiterData {
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  userId?: number;
}

export interface UpdateWaiterData {
  name?: string;
  code?: string;
  phone?: string;
  email?: string;
  userId?: number;
  isActive?: boolean;
}

/**
 * Lista todos os garçons de uma empresa
 */
export async function listWaiters(companyId: number) {
  return await prisma.restaurantWaiter.findMany({
    where: { companyId },
    orderBy: [{ name: 'asc' }],
    include: {
      orders: {
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      },
    },
  });
}

/**
 * Busca um garçom por ID
 */
export async function getWaiterById(companyId: number, waiterId: number) {
  return await prisma.restaurantWaiter.findFirst({
    where: {
      id: waiterId,
      companyId,
    },
    include: {
      orders: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
}

/**
 * Cria um novo garçom
 */
export async function createWaiter(companyId: number, data: CreateWaiterData) {
  // Gera código automático se não fornecido
  let code = data.code;
  if (!code) {
    const lastWaiter = await prisma.restaurantWaiter.findFirst({
      where: { companyId },
      orderBy: { id: 'desc' },
    });
    const nextNumber = lastWaiter ? parseInt(lastWaiter.code || '0') + 1 : 1;
    code = `G${nextNumber.toString().padStart(2, '0')}`;
  }

  // Verifica se o código já existe
  if (code) {
    const existing = await prisma.restaurantWaiter.findUnique({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
    });

    if (existing) {
      throw new Error('Já existe um garçom com este código');
    }
  }

  return await prisma.restaurantWaiter.create({
    data: {
      ...data,
      code,
      companyId,
    },
  });
}

/**
 * Atualiza um garçom
 */
export async function updateWaiter(
  companyId: number,
  waiterId: number,
  data: UpdateWaiterData,
) {
  const waiter = await prisma.restaurantWaiter.findFirst({
    where: {
      id: waiterId,
      companyId,
    },
  });

  if (!waiter) {
    throw new Error('Garçom não encontrado');
  }

  // Verifica se o código está sendo alterado e se já existe
  if (data.code && data.code !== waiter.code) {
    const existing = await prisma.restaurantWaiter.findUnique({
      where: {
        companyId_code: {
          companyId,
          code: data.code,
        },
      },
    });

    if (existing) {
      throw new Error('Já existe um garçom com este código');
    }
  }

  return await prisma.restaurantWaiter.update({
    where: { id: waiterId },
    data,
  });
}

/**
 * Remove um garçom
 */
export async function deleteWaiter(companyId: number, waiterId: number) {
  const waiter = await prisma.restaurantWaiter.findFirst({
    where: {
      id: waiterId,
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

  if (!waiter) {
    throw new Error('Garçom não encontrado');
  }

  if (waiter.orders.length > 0) {
    throw new Error('Não é possível remover um garçom com pedidos em aberto');
  }

  return await prisma.restaurantWaiter.delete({
    where: { id: waiterId },
  });
}

