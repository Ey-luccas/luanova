import prisma from '../config/prisma';

export async function createFeedback(
  userId: number,
  data: {
    companyExtensionId: number;
    rating?: number;
    comment?: string;
    suggestions?: string;
  },
) {
  // Verifica se o usuário tem acesso à extensão da empresa
  const companyExtension = await prisma.companyExtension.findUnique({
    where: { id: data.companyExtensionId },
    include: {
      company: {
        include: {
          companyUsers: {
            where: { userId },
          },
        },
      },
    },
  });

  if (!companyExtension) {
    throw new Error('Extensão não encontrada');
  }

  if (companyExtension.company.companyUsers.length === 0) {
    throw new Error('Você não tem acesso a esta empresa');
  }

  // Verifica se já existe feedback do usuário para esta extensão
  const existing = await prisma.extensionFeedback.findFirst({
    where: {
      companyExtensionId: data.companyExtensionId,
      userId,
    },
  });

  if (existing) {
    // Atualiza o feedback existente
    return await prisma.extensionFeedback.update({
      where: { id: existing.id },
      data: {
        rating: data.rating,
        comment: data.comment,
        suggestions: data.suggestions,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Cria novo feedback
  return await prisma.extensionFeedback.create({
    data: {
      ...data,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function listFeedbacks(extensionId: number) {
  return await prisma.extensionFeedback.findMany({
    where: {
      companyExtension: {
        extensionId,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      companyExtension: {
        include: {
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getUserFeedback(
  userId: number,
  companyExtensionId: number,
) {
  return await prisma.extensionFeedback.findFirst({
    where: {
      userId,
      companyExtensionId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

