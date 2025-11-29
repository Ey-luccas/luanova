/**
 * Service para gerenciar extensões e assinaturas
 */

import prisma from "../config/prisma";

export interface ExtensionData {
  name: string;
  displayName: string;
  description?: string;
  price: number;
  features?: string;
}

/**
 * Lista todas as extensões disponíveis
 */
export async function listExtensions() {
  return await prisma.extension.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

/**
 * Verifica se uma empresa tem uma extensão ativa (função auxiliar interna)
 */
async function checkHasExtension(
  companyId: number,
  extensionName: string
): Promise<boolean> {
  const extension = await prisma.extension.findUnique({
    where: {
      name: extensionName,
    },
  });

  if (!extension) {
    return false;
  }

  const companyExtension = await prisma.companyExtension.findFirst({
    where: {
      companyId,
      extensionId: extension.id,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
  });

  return !!companyExtension;
}

/**
 * Lista extensões de uma empresa
 * Inclui automaticamente a extensão de produtos se não estiver ativa (extensão padrão)
 */
export async function getCompanyExtensions(companyId: number) {
  // Busca a extensão de produtos
  const productsExtension = await prisma.extension.findUnique({
    where: { name: "products_management" },
  });

  // Se a extensão de produtos existir, garante que está ativa para esta empresa
  // EXCETO se serviços estiver instalado (neste caso, produtos pode estar desativado)
  if (productsExtension) {
    const existingProductsExtension = await prisma.companyExtension.findUnique({
      where: {
        companyId_extensionId: {
          companyId,
          extensionId: productsExtension.id,
        },
      },
    });

    // Verifica se serviços está instalado
    const hasServices = await checkHasExtension(
      companyId,
      "services_management"
    );
    
    console.log(`[getCompanyExtensions] Produtos existe: ${!!existingProductsExtension}, está ativo: ${existingProductsExtension?.isActive}, serviços instalado: ${hasServices}`);

    // Se não existe, cria automaticamente (extensão padrão)
    if (!existingProductsExtension) {
      console.log(`[getCompanyExtensions] Criando extensão de produtos automaticamente`);
      await prisma.companyExtension.create({
        data: {
          companyId,
          extensionId: productsExtension.id,
          isActive: true,
        },
      });
    } else if (!existingProductsExtension.isActive && !hasServices) {
      // Se existe mas está inativa E serviços NÃO está instalado, reativa (extensão padrão sempre ativa)
      // Se serviços está instalado, permite que produtos fique inativa
      console.log(`[getCompanyExtensions] Reativando produtos (serviços não instalado)`);
      await prisma.companyExtension.update({
        where: {
          id: existingProductsExtension.id,
        },
        data: {
          isActive: true,
        },
      });
    } else if (!existingProductsExtension.isActive && hasServices) {
      console.log(`[getCompanyExtensions] Produtos está inativo mas serviços está instalado - mantendo inativo`);
    }
  }

  return await prisma.companyExtension.findMany({
    where: {
      companyId,
      isActive: true, // Apenas extensões ativas
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    include: {
      extension: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Verifica se as dependências de uma extensão estão ativas
 */
async function checkDependencies(
  companyId: number,
  dependencies: string[]
): Promise<{ missing: string[]; extensionNames: string[] }> {
  if (!dependencies || dependencies.length === 0) {
    return { missing: [], extensionNames: [] };
  }

  // Busca todas as extensões ativas da empresa
  const companyExtensions = await prisma.companyExtension.findMany({
    where: {
      companyId,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    include: {
      extension: {
        select: {
          name: true,
          displayName: true,
        },
      },
    },
  });

  const activeExtensionNames = companyExtensions
    .map((ce) => ce.extension.name)
    .filter(Boolean);

  // Verifica quais dependências estão faltando
  const missing = dependencies.filter(
    (dep) => !activeExtensionNames.includes(dep)
  );

  // Busca os nomes de exibição das extensões faltantes
  const missingExtensions = await prisma.extension.findMany({
    where: {
      name: { in: missing },
    },
    select: {
      name: true,
      displayName: true,
    },
  });

  const extensionNames = missingExtensions.map((ext) => ext.displayName);

  return { missing, extensionNames };
}

/**
 * Adiciona uma extensão para uma empresa
 */
export async function addCompanyExtension(
  companyId: number,
  extensionId: number,
  expiresAt?: Date
) {
  // Verifica se a extensão existe e está ativa
  const extension = await prisma.extension.findUnique({
    where: {
      id: extensionId,
      isActive: true,
    },
  });

  if (!extension) {
    throw new Error("Extensão não encontrada ou inativa");
  }

  // Verifica dependências
  let dependencies: string[] = [];
  if (extension.dependencies) {
    try {
      dependencies = JSON.parse(extension.dependencies);
    } catch (e) {
      console.error("Erro ao parsear dependências:", e);
    }
  }

  if (dependencies.length > 0) {
    const { missing, extensionNames } = await checkDependencies(
      companyId,
      dependencies
    );

    if (missing.length > 0) {
      const error = new Error(
        `Esta extensão requer as seguintes extensões: ${extensionNames.join(", ")}`
      ) as any;
      error.missingDependencies = extensionNames;
      error.missingDependencyNames = missing;
      throw error;
    }
  }

  // Verifica se a empresa já tem essa extensão
  const existing = await prisma.companyExtension.findUnique({
    where: {
      companyId_extensionId: {
        companyId,
        extensionId,
      },
    },
  });

  if (existing) {
    // Atualiza se já existe
    return await prisma.companyExtension.update({
      where: {
        id: existing.id,
      },
      data: {
        isActive: true,
        expiresAt,
        purchasedAt: new Date(),
      },
      include: {
        extension: true,
      },
    });
  }

  // Cria nova
  return await prisma.companyExtension.create({
    data: {
      companyId,
      extensionId,
      expiresAt,
    },
    include: {
      extension: true,
    },
  });
}

/**
 * Verifica se alguma extensão ativa depende desta extensão
 */
async function checkReverseDependencies(
  companyId: number,
  extensionName: string
): Promise<{ blocking: string[]; extensionNames: string[] }> {
  // Busca todas as extensões ativas da empresa
  const companyExtensions = await prisma.companyExtension.findMany({
    where: {
      companyId,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    include: {
      extension: {
        select: {
          name: true,
          displayName: true,
          dependencies: true,
        },
      },
    },
  });

  // Verifica quais extensões ativas dependem da extensão que está sendo desinstalada
  const blocking: string[] = [];
  const blockingNames: string[] = [];

  for (const ce of companyExtensions) {
    if (!ce.extension.dependencies) continue;

    try {
      const dependencies = JSON.parse(ce.extension.dependencies);
      if (Array.isArray(dependencies) && dependencies.includes(extensionName)) {
        blocking.push(ce.extension.name);
        blockingNames.push(ce.extension.displayName);
      }
    } catch (e) {
      console.error("Erro ao parsear dependências:", e);
    }
  }

  return { blocking, extensionNames: blockingNames };
}

/**
 * Remove/desativa uma extensão de uma empresa
 */
export async function removeCompanyExtension(
  companyId: number,
  extensionId: number
) {
  const companyExtension = await prisma.companyExtension.findUnique({
    where: {
      companyId_extensionId: {
        companyId,
        extensionId,
      },
    },
    include: {
      extension: {
        select: {
          name: true,
          displayName: true,
        },
      },
    },
  });

  if (!companyExtension) {
    throw new Error("Extensão não encontrada para esta empresa");
  }

  // Verifica dependências reversas (se alguma extensão ativa depende desta)
  const { blocking, extensionNames } = await checkReverseDependencies(
    companyId,
    companyExtension.extension.name
  );

  // Regra especial: produtos (extensão padrão) só pode ser desinstalado se serviços estiver instalado
  if (companyExtension.extension.name === "products_management") {
    const hasServices = await checkHasExtension(companyId, "services_management");
    console.log(`[removeCompanyExtension] Tentando desativar produtos. Serviços instalado: ${hasServices}`);
    if (!hasServices) {
      const error = new Error(
        'Não é possível desinstalar "Gerenciamento de Produtos" sem ter "Gerenciamento de Serviços" instalado. ' +
          "O sistema precisa de pelo menos uma das duas extensões ativas."
      ) as any;
      error.blockingExtensions = ["Gerenciamento de Serviços"];
      throw error;
    }
    console.log(`[removeCompanyExtension] Serviços está instalado, permitindo desativação de produtos`);
  }

  if (blocking.length > 0) {
    const error = new Error(
      `Não é possível desinstalar esta extensão porque as seguintes extensões dependem dela: ${extensionNames.join(", ")}`
    ) as any;
    error.blockingExtensions = extensionNames;
    error.blockingExtensionNames = blocking;
    throw error;
  }

  const updated = await prisma.companyExtension.update({
    where: {
      id: companyExtension.id,
    },
    data: {
      isActive: false,
    },
    include: {
      extension: true,
    },
  });
  
  console.log(`[removeCompanyExtension] Extensão desativada:`, {
    extensionName: updated.extension.name,
    isActive: updated.isActive,
    companyId,
  });
  
  return updated;
}

/**
 * Verifica se uma empresa tem uma extensão ativa
 */
export async function hasExtension(
  companyId: number,
  extensionName: string
): Promise<boolean> {
  return await checkHasExtension(companyId, extensionName);
}
