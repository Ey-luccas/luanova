/**
 * Service de categorias
 * 
 * Contém a lógica de negócio para categorias:
 * - Criação de categorias
 * - Listagem de categorias
 * - Validação de permissões e regras de negócio
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
 * Verifica se o nome da categoria já existe na empresa
 */
async function verifyCategoryNameUnique(
  name: string,
  companyId: number,
  excludeCategoryId?: number
) {
  // SQLite não suporta mode: "insensitive", então usamos contains simples
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: name, // Comparação exata (SQLite)
      companyId,
      id: excludeCategoryId ? { not: excludeCategoryId } : undefined,
    },
  });

  if (existingCategory) {
    throw new Error("Categoria com este nome já existe nesta empresa");
  }
}

/**
 * Cria uma nova categoria
 */
export async function createCategory(
  userId: number,
  companyId: number,
  data: {
    name: string;
  }
) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  // Verifica se o nome já existe na empresa
  await verifyCategoryNameUnique(data.name, companyId);

  // Cria a categoria
  const category = await prisma.category.create({
    data: {
      name: data.name,
      companyId,
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
  });

  return category;
}

/**
 * Lista todas as categorias de uma empresa
 */
export async function listCategories(userId: number, companyId: number) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  // Lista categorias
  const categories = await prisma.category.findMany({
    where: {
      companyId,
    },
    include: {
      company: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          products: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return categories;
}

