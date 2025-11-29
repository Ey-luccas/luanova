/**
 * Service para gerenciar cardápio
 */

import prisma from '../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateCategoryData {
  name: string;
  description?: string;
  order?: number;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export interface CreateMenuItemData {
  categoryId: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  preparationTime?: number;
  sizes?: string[]; // ["P", "M", "G", "FAMILY"]
  sizesPrices?: Record<string, number>; // {"P": 25.00, "M": 35.00}
  allowHalf?: boolean;
  allowThird?: boolean;
  allowCombo?: boolean;
  allowedAddons?: string[];
  availableDays?: string[];
  availableShifts?: string[];
  order?: number;
}

export interface UpdateMenuItemData {
  categoryId?: number;
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  preparationTime?: number;
  sizes?: string[];
  sizesPrices?: Record<string, number>;
  allowHalf?: boolean;
  allowThird?: boolean;
  allowCombo?: boolean;
  allowedAddons?: string[];
  availableDays?: string[];
  availableShifts?: string[];
  isAvailable?: boolean;
  order?: number;
}

/**
 * Lista todas as categorias de uma empresa
 */
export async function listCategories(companyId: number) {
  return await prisma.restaurantMenuCategory.findMany({
    where: { companyId },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
    include: {
      items: {
        where: { isAvailable: true },
        orderBy: [{ order: 'asc' }, { name: 'asc' }],
      },
    },
  });
}

/**
 * Cria uma nova categoria
 */
export async function createCategory(
  companyId: number,
  data: CreateCategoryData,
) {
  // Define ordem automática se não fornecida
  let order = data.order;
  if (order === undefined) {
    const lastCategory = await prisma.restaurantMenuCategory.findFirst({
      where: { companyId },
      orderBy: { order: 'desc' },
    });
    order = lastCategory ? lastCategory.order + 1 : 0;
  }

  return await prisma.restaurantMenuCategory.create({
    data: {
      ...data,
      order,
      companyId,
    },
  });
}

/**
 * Atualiza uma categoria
 */
export async function updateCategory(
  companyId: number,
  categoryId: number,
  data: UpdateCategoryData,
) {
  const category = await prisma.restaurantMenuCategory.findFirst({
    where: {
      id: categoryId,
      companyId,
    },
  });

  if (!category) {
    throw new Error('Categoria não encontrada');
  }

  return await prisma.restaurantMenuCategory.update({
    where: { id: categoryId },
    data,
  });
}

/**
 * Remove uma categoria
 */
export async function deleteCategory(companyId: number, categoryId: number) {
  const category = await prisma.restaurantMenuCategory.findFirst({
    where: {
      id: categoryId,
      companyId,
    },
    include: {
      items: true,
    },
  });

  if (!category) {
    throw new Error('Categoria não encontrada');
  }

  if (category.items.length > 0) {
    throw new Error(
      'Não é possível remover uma categoria que possui itens cadastrados',
    );
  }

  return await prisma.restaurantMenuCategory.delete({
    where: { id: categoryId },
  });
}

/**
 * Lista todos os itens do cardápio de uma empresa
 */
export async function listMenuItems(companyId: number, categoryId?: number) {
  return await prisma.restaurantMenuItem.findMany({
    where: {
      companyId,
      ...(categoryId && { categoryId }),
    },
    include: {
      category: true,
    },
    orderBy: [{ order: 'asc' }, { name: 'asc' }],
  });
}

/**
 * Busca um item do cardápio por ID
 */
export async function getMenuItemById(
  companyId: number,
  itemId: number,
) {
  return await prisma.restaurantMenuItem.findFirst({
    where: {
      id: itemId,
      companyId,
    },
    include: {
      category: true,
    },
  });
}

/**
 * Cria um novo item do cardápio
 */
export async function createMenuItem(
  companyId: number,
  data: CreateMenuItemData,
) {
  // Verifica se a categoria existe
  const category = await prisma.restaurantMenuCategory.findFirst({
    where: {
      id: data.categoryId,
      companyId,
    },
  });

  if (!category) {
    throw new Error('Categoria não encontrada');
  }

  // Define ordem automática se não fornecida
  let order = data.order;
  if (order === undefined) {
    const lastItem = await prisma.restaurantMenuItem.findFirst({
      where: { companyId, categoryId: data.categoryId },
      orderBy: { order: 'desc' },
    });
    order = lastItem ? lastItem.order + 1 : 0;
  }

  return await prisma.restaurantMenuItem.create({
    data: {
      ...data,
      companyId,
      order,
      price: new Decimal(data.price),
      sizes: data.sizes ? JSON.stringify(data.sizes) : null,
      sizesPrices: data.sizesPrices
        ? JSON.stringify(data.sizesPrices)
        : null,
      allowedAddons: data.allowedAddons
        ? JSON.stringify(data.allowedAddons)
        : null,
      availableDays: data.availableDays
        ? JSON.stringify(data.availableDays)
        : null,
      availableShifts: data.availableShifts
        ? JSON.stringify(data.availableShifts)
        : null,
    },
    include: {
      category: true,
    },
  });
}

/**
 * Atualiza um item do cardápio
 */
export async function updateMenuItem(
  companyId: number,
  itemId: number,
  data: UpdateMenuItemData,
) {
  const item = await prisma.restaurantMenuItem.findFirst({
    where: {
      id: itemId,
      companyId,
    },
  });

  if (!item) {
    throw new Error('Item não encontrado');
  }

  // Verifica se a categoria existe (se estiver sendo alterada)
  if (data.categoryId && data.categoryId !== item.categoryId) {
    const category = await prisma.restaurantMenuCategory.findFirst({
      where: {
        id: data.categoryId,
        companyId,
      },
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }
  }

  const updateData: any = { ...data };

  if (data.price !== undefined) {
    updateData.price = new Decimal(data.price);
  }

  if (data.sizes !== undefined) {
    updateData.sizes = data.sizes ? JSON.stringify(data.sizes) : null;
  }

  if (data.sizesPrices !== undefined) {
    updateData.sizesPrices = data.sizesPrices
      ? JSON.stringify(data.sizesPrices)
      : null;
  }

  if (data.allowedAddons !== undefined) {
    updateData.allowedAddons = data.allowedAddons
      ? JSON.stringify(data.allowedAddons)
      : null;
  }

  if (data.availableDays !== undefined) {
    updateData.availableDays = data.availableDays
      ? JSON.stringify(data.availableDays)
      : null;
  }

  if (data.availableShifts !== undefined) {
    updateData.availableShifts = data.availableShifts
      ? JSON.stringify(data.availableShifts)
      : null;
  }

  return await prisma.restaurantMenuItem.update({
    where: { id: itemId },
    data: updateData,
    include: {
      category: true,
    },
  });
}

/**
 * Remove um item do cardápio
 */
export async function deleteMenuItem(companyId: number, itemId: number) {
  const item = await prisma.restaurantMenuItem.findFirst({
    where: {
      id: itemId,
      companyId,
    },
    include: {
      orderItems: {
        where: {
          order: {
            status: {
              in: ['OPEN', 'SENT_TO_KITCHEN', 'PREPARING', 'READY', 'DELIVERED'],
            },
          },
        },
      },
    },
  });

  if (!item) {
    throw new Error('Item não encontrado');
  }

  if (item.orderItems.length > 0) {
    throw new Error(
      'Não é possível remover um item que possui pedidos em aberto',
    );
  }

  return await prisma.restaurantMenuItem.delete({
    where: { id: itemId },
  });
}

