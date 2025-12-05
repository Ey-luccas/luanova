/**
 * Service para gerenciar usuários/funcionários de empresas
 */

// import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import prisma from '../config/prisma';

/**
 * Lista usuários de uma empresa
 */
export async function listCompanyUsers(companyId: number, userId: number) {
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
    throw new Error('Empresa não encontrada ou você não tem acesso');
  }

  // Apenas ADMIN pode ver todos os usuários
  if (companyUser.role !== 'ADMIN') {
    throw new Error('Apenas administradores podem gerenciar usuários');
  }

  return await prisma.companyUser.findMany({
    where: {
      companyId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
      permissions: {
        include: {
          permission: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Adiciona um novo usuário/funcionário à empresa
 */
export async function addCompanyUser(
  companyId: number,
  adminUserId: number,
  data: {
    email: string;
    name: string;
    password: string;
    role?: string;
    permissions?: number[]; // IDs das permissões
  }
) {
  // Verifica se o admin tem acesso
  const adminCompanyUser = await prisma.companyUser.findUnique({
    where: {
      userId_companyId: {
        userId: adminUserId,
        companyId,
      },
    },
  });

  if (!adminCompanyUser || adminCompanyUser.role !== 'ADMIN') {
    throw new Error('Apenas administradores podem adicionar usuários');
  }

  // Verifica se o email já existe
  let user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (!user) {
    // Cria novo usuário
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
      },
    });
    user = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      createdAt: newUser.createdAt,
    } as any;
  }

  if (!user) {
    throw new Error('Erro ao criar ou buscar usuário');
  }

  // Verifica se o usuário já está na empresa
  const existingCompanyUser = await prisma.companyUser.findUnique({
    where: {
      userId_companyId: {
        userId: user.id,
        companyId,
      },
    },
  });

  if (existingCompanyUser) {
    throw new Error('Usuário já está cadastrado nesta empresa');
  }

  // Adiciona usuário à empresa
  const companyUser = await prisma.companyUser.create({
    data: {
      userId: user.id,
      companyId,
      role: data.role || 'OPERATOR',
      isActive: true,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Adiciona permissões se fornecidas
  if (data.permissions && data.permissions.length > 0) {
    await prisma.userPermission.createMany({
      data: data.permissions.map((permissionId) => ({
        companyUserId: companyUser.id,
        permissionId,
        granted: true,
      })),
    });
  }

  return companyUser;
}

/**
 * Atualiza um usuário da empresa
 */
export async function updateCompanyUser(
  companyId: number,
  adminUserId: number,
  companyUserId: number,
  data: {
    role?: string;
    isActive?: boolean;
    permissions?: number[];
  }
) {
  // Verifica se o admin tem acesso
  const adminCompanyUser = await prisma.companyUser.findUnique({
    where: {
      userId_companyId: {
        userId: adminUserId,
        companyId,
      },
    },
  });

  if (!adminCompanyUser || adminCompanyUser.role !== 'ADMIN') {
    throw new Error('Apenas administradores podem atualizar usuários');
  }

  // Atualiza o usuário
  const companyUser = await prisma.companyUser.update({
    where: {
      id: companyUserId,
    },
    data: {
      role: data.role,
      isActive: data.isActive,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  // Atualiza permissões se fornecidas
  if (data.permissions !== undefined) {
    // Remove permissões existentes
    await prisma.userPermission.deleteMany({
      where: {
        companyUserId,
      },
    });

    // Adiciona novas permissões
    if (data.permissions.length > 0) {
      await prisma.userPermission.createMany({
        data: data.permissions.map((permissionId) => ({
          companyUserId,
          permissionId,
          granted: true,
        })),
      });
    }
  }

  return companyUser;
}

/**
 * Remove um usuário da empresa
 */
export async function removeCompanyUser(
  companyId: number,
  adminUserId: number,
  companyUserId: number
) {
  // Verifica se o admin tem acesso
  const adminCompanyUser = await prisma.companyUser.findUnique({
    where: {
      userId_companyId: {
        userId: adminUserId,
        companyId,
      },
    },
  });

  if (!adminCompanyUser || adminCompanyUser.role !== 'ADMIN') {
    throw new Error('Apenas administradores podem remover usuários');
  }

  // Não permite remover a si mesmo
  if (companyUserId === adminCompanyUser.id) {
    throw new Error('Você não pode remover a si mesmo');
  }

  return await prisma.companyUser.delete({
    where: {
      id: companyUserId,
    },
  });
}

/**
 * Lista todas as permissões disponíveis
 */
export async function listPermissions() {
  return await prisma.permission.findMany({
    orderBy: [
      { category: 'asc' },
      { name: 'asc' },
    ],
  });
}

