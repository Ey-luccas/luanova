/**
 * Service de empresas
 *
 * Contém a lógica de negócio para empresas:
 * - Criação de empresas
 * - Listagem de empresas do usuário
 * - Atualização de empresas
 * - Validação de permissões
 */

import prisma from "../config/prisma";

/**
 * Cria uma nova empresa e vincula o usuário como OWNER
 */
export async function createCompany(
  userId: number,
  data: {
    name: string;
    cnpj?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  }
) {
  // Verifica se CNPJ já existe (se fornecido)
  if (data.cnpj) {
    const existingCompany = await prisma.company.findUnique({
      where: { cnpj: data.cnpj },
    });

    if (existingCompany) {
      throw new Error("CNPJ já cadastrado");
    }
  }

  // Cria a empresa e o vínculo CompanyUser em uma transação
  const result = await prisma.$transaction(async (tx) => {
    // Cria a empresa
    const company = await tx.company.create({
      data: {
        name: data.name,
        cnpj: data.cnpj || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      },
    });

    // Cria o vínculo CompanyUser com role ADMIN (OWNER não existe no enum, usando ADMIN)
    await tx.companyUser.create({
      data: {
        userId,
        companyId: company.id,
        role: "ADMIN", // ADMIN representa o dono da empresa
      },
    });

    // Ativa automaticamente a extensão de produtos (extensão padrão)
    const productsExtension = await tx.extension.findUnique({
      where: { name: "products_management" },
    });

    if (productsExtension) {
      await tx.companyExtension.create({
        data: {
          companyId: company.id,
          extensionId: productsExtension.id,
          isActive: true,
        },
      });
    }

    return company;
  });

  return result;
}

/**
 * Lista todas as empresas do usuário logado
 */
export async function getUserCompanies(userId: number) {
  try {
    console.log(`[getUserCompanies] Buscando empresas para userId: ${userId}`);

    const companyUsers = await prisma.companyUser.findMany({
      where: {
        userId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            cnpj: true,
            email: true,
            phone: true,
            address: true,
            logoUrl: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(
      `[getUserCompanies] ${companyUsers.length} vínculo(s) encontrado(s)`
    );

    const companies = companyUsers.map((cu) => ({
      ...cu.company,
      role: cu.role,
      joinedAt: cu.createdAt,
    }));

    console.log(
      `[getUserCompanies] ${companies.length} empresa(s) retornada(s)`
    );

    return companies;
  } catch (error: any) {
    console.error(
      `[getUserCompanies] Erro ao buscar empresas para userId ${userId}:`,
      error
    );
    throw error;
  }
}

/**
 * Busca uma empresa por ID (apenas se o usuário tiver acesso)
 */
export async function getCompanyById(companyId: number, userId: number) {
  // Verifica se o usuário tem acesso à empresa
  const companyUser = await prisma.companyUser.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId,
      },
    },
    include: {
      company: true,
    },
  });

  if (!companyUser) {
    throw new Error("Empresa não encontrada ou você não tem acesso");
  }

  return {
    ...companyUser.company,
    role: companyUser.role,
    joinedAt: companyUser.createdAt,
  };
}

/**
 * Atualiza uma empresa (apenas se o usuário tiver acesso)
 */
export async function updateCompany(
  companyId: number,
  userId: number,
  data: {
    name?: string;
    cnpj?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    logoUrl?: string | null;
  }
) {
  // Verifica se o usuário tem acesso à empresa
  const companyUser = await prisma.companyUser.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId,
      },
    },
  });

  if (!companyUser) {
    throw new Error("Empresa não encontrada ou você não tem acesso");
  }

  // Verifica se CNPJ já existe em outra empresa (se fornecido)
  if (data.cnpj) {
    const existingCompany = await prisma.company.findFirst({
      where: {
        cnpj: data.cnpj,
        id: {
          not: companyId,
        },
      },
    });

    if (existingCompany) {
      throw new Error("CNPJ já cadastrado em outra empresa");
    }
  }

  // Atualiza a empresa
  const company = await prisma.company.update({
    where: { id: companyId },
    data: {
      name: data.name,
      cnpj: data.cnpj !== undefined ? data.cnpj : undefined,
      email: data.email !== undefined ? data.email : undefined,
      phone: data.phone !== undefined ? data.phone : undefined,
      address: data.address !== undefined ? data.address : undefined,
      logoUrl: data.logoUrl !== undefined ? data.logoUrl : undefined,
    },
  });

  return company;
}

/**
 * Verifica se o usuário tem acesso à empresa
 */
export async function userHasAccessToCompany(
  userId: number,
  companyId: number
): Promise<boolean> {
  const companyUser = await prisma.companyUser.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId,
      },
    },
  });

  // Verifica se o usuário existe E está ativo na empresa
  return !!companyUser && companyUser.isActive === true;
}

/**
 * Verifica se o usuário é ADMIN da empresa (pode excluir)
 */
export async function userIsCompanyAdmin(
  userId: number,
  companyId: number
): Promise<boolean> {
  const companyUser = await prisma.companyUser.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId,
      },
    },
  });

  return companyUser?.role === "ADMIN";
}

/**
 * Exclui uma empresa permanentemente
 * Apenas ADMIN pode excluir
 */
export async function deleteCompany(
  companyId: number,
  userId: number
): Promise<void> {
  // Verifica se o usuário é ADMIN
  const isAdmin = await userIsCompanyAdmin(userId, companyId);
  if (!isAdmin) {
    throw new Error("Apenas administradores podem excluir empresas");
  }

  // Verifica se o usuário tem acesso à empresa
  const companyUser = await prisma.companyUser.findUnique({
    where: {
      userId_companyId: {
        userId,
        companyId,
      },
    },
  });

  if (!companyUser) {
    throw new Error("Empresa não encontrada ou você não tem acesso");
  }

  // Exclui a empresa (cascade delete remove todos os dados relacionados)
  await prisma.company.delete({
    where: { id: companyId },
  });
}
