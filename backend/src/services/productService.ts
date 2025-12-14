/**
 * Service de produtos
 *
 * Contém toda a lógica de negócio relacionada a produtos.
 * Não deve conter lógica HTTP (isso fica nos controllers).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Verifica se o usuário tem acesso à empresa
 */
async function verifyCompanyAccess(userId: number, companyId: number) {
  const companyUser = await prisma.companyUser.findFirst({
    where: {
      userId,
      companyId,
    },
    include: {
      company: true,
    },
  });

  if (!companyUser) {
    throw new Error("Empresa não encontrada ou você não tem acesso");
  }

  // Verifica se a empresa está arquivada
  if (companyUser.company.isArchived === true) {
    throw new Error("Esta empresa está arquivada e não pode ser acessada");
  }
}

async function verifyBarcodeUnique(
  barcode: string | null | undefined,
  companyId: number,
  excludeProductId?: number
) {
  if (!barcode) return;

  const where: any = { barcode, companyId };
  if (excludeProductId) {
    where.id = { not: excludeProductId };
  }

  const existing = await prisma.product.findFirst({ where });

  if (existing) {
    throw new Error("Código de barras já cadastrado nesta empresa");
  }
}

/**
 * Cria um novo produto
 */
export async function createProduct(
  userId: number,
  companyId: number,
  data: {
    name: string;
    description?: string | null;
    barcode?: string | null;
    sku?: string | null;
    categoryId?: number | null;
    currentStock?: number;
    minStock?: number | null;
    maxStock?: number | null;
    unitPrice?: number | null;
    costPrice?: number | null;
    isActive?: boolean;
    isService?: boolean; // Novo campo para identificar serviços
  }
) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  // Verifica se código de barras é único
  await verifyBarcodeUnique(data.barcode, companyId);

  // SEPARAÇÃO ABSOLUTA: Serviços e produtos são completamente diferentes
  const isService = data.isService ?? false;

  // VALIDAÇÃO CRÍTICA: Serviços NUNCA podem ter categoria
  if (isService && data.categoryId) {
    throw new Error(
      "Serviços não podem ter categoria. Categorias são exclusivas para produtos."
    );
  }

  // VALIDAÇÃO CRÍTICA: Se categoria fornecida, verificar se não é "Serviços"
  let finalCategoryId = isService ? null : data.categoryId;
  if (finalCategoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: finalCategoryId,
        companyId,
      },
    });

    if (!category) {
      throw new Error(
        "Categoria não encontrada ou não pertence a esta empresa"
      );
    }

    // VALIDAÇÃO: Produtos NUNCA podem ter categoria "Serviços"
    const categoryNameLower = category.name.toLowerCase();
    if (categoryNameLower === "serviços" || categoryNameLower === "servicos") {
      throw new Error(
        "Produtos não podem ter categoria 'Serviços'. Esta categoria não deve existir ou deve ser removida."
      );
    }
  }

  // Cria o produto
  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description || null,
      barcode: data.barcode || null,
      sku: data.sku || null,
      categoryId: finalCategoryId, // null para serviços
      companyId,
      // Usar apenas currentStock como quantidade única de estoque
      // Se minStock for fornecido (compatibilidade com frontend antigo), usar como currentStock
      currentStock:
        data.currentStock ?? (data.minStock ? Number(data.minStock) : 0),
      minStock: null, // Não usar mais minStock
      maxStock: null, // Não usar mais maxStock
      unitPrice: data.unitPrice || null,
      costPrice: data.costPrice || null,
      isActive: data.isActive ?? true,
      isService: isService, // Marcar como serviço ou produto
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return product;
}

/**
 * Lista produtos de uma empresa com filtros e busca
 */
export async function listProducts(
  userId: number,
  companyId: number,
  filters?: {
    search?: string;
    categoryId?: number;
    isActive?: boolean;
    minStock?: number;
    maxStock?: number;
    isService?: boolean; // Novo filtro: false = produtos, true = serviços
    page?: number;
    limit?: number;
  }
) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  // Configuração de paginação
  const page = filters?.page || 1;
  const limit = filters?.limit || 50;
  const skip = (page - 1) * limit;

  // Construção do where
  const where: any = {
    companyId,
  };

  // Filtro por isService (OBRIGATÓRIO para separação TOTAL)
  // SEMPRE deve ser especificado para garantir separação absoluta
  // Se isService = false, mostra APENAS produtos (isService = false)
  // Se isService = true, mostra APENAS serviços (isService = true)
  // NUNCA retornar ambos misturados
  if (filters?.isService !== undefined) {
    // Filtrar rigorosamente: true = serviços, false = produtos
    where.isService = filters.isService === true;
  } else {
    // Por padrão, se não especificado, exclui serviços (mostra apenas produtos)
    // Isso mantém compatibilidade com código antigo, mas sempre filtra
    where.isService = false;
  }

  // GARANTIA ABSOLUTA: Serviços nunca devem ter categoria
  // Se buscando serviços, garantir que categoryId seja null
  if (filters?.isService === true) {
    where.categoryId = null;
  }

  // Filtro de busca (nome, descrição, barcode, SKU)
  // SQLite não suporta mode: "insensitive", então usamos contains simples
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { description: { contains: filters.search } },
      { barcode: { contains: filters.search } },
      { sku: { contains: filters.search } },
    ];
  }

  // Filtro por categoria (APENAS para produtos, nunca para serviços)
  // Serviços NUNCA têm categoria, então não aplicar este filtro se buscando serviços
  if (filters?.categoryId && filters?.isService !== true) {
    where.categoryId = filters.categoryId;
  }

  // Filtro por status ativo
  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  // Filtro por estoque mínimo
  if (filters?.minStock !== undefined) {
    where.currentStock = { gte: filters.minStock };
  }

  // Filtro por estoque máximo
  if (filters?.maxStock !== undefined) {
    where.currentStock = {
      ...where.currentStock,
      lte: filters.maxStock,
    };
  }

  // Busca produtos
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  // Filtro adicional de segurança no resultado (garante que isService está correto)
  // FILTRO RIGOROSO: exclui qualquer item que não corresponda exatamente ao filtro
  const filteredProducts = products.filter((product) => {
    // Se filtro foi especificado, aplicar filtro rigoroso
    if (filters?.isService !== undefined) {
      const expectedIsService = filters.isService === true;
      // Retornar APENAS se isService corresponder EXATAMENTE ao esperado
      return product.isService === expectedIsService;
    }
    // Se não especificado, retorna tudo (compatibilidade)
    return true;
  });

  // O total já foi calculado corretamente pelo prisma.product.count({ where })
  // que inclui o filtro isService no where, então usamos o total diretamente
  // Não precisamos recalcular porque o where já filtra corretamente
  const finalTotal = total;

  return {
    products: filteredProducts,
    pagination: {
      page,
      limit,
      total: finalTotal,
      totalPages: Math.ceil(finalTotal / limit),
    },
  };
}

/**
 * Busca produto por código de barras
 */
export async function getProductByBarcode(
  userId: number,
  companyId: number,
  barcode: string
) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  const product = await prisma.product.findFirst({
    where: {
      barcode,
      companyId,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("Produto não encontrado");
  }

  return product;
}

/**
 * Busca produto por ID
 */
export async function getProductById(
  userId: number,
  companyId: number,
  productId: number
) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      companyId,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("Produto não encontrado");
  }

  return product;
}

/**
 * Atualiza um produto
 */
export async function updateProduct(
  userId: number,
  companyId: number,
  productId: number,
  data: {
    name?: string;
    description?: string | null;
    barcode?: string | null;
    sku?: string | null;
    categoryId?: number | null;
    currentStock?: number;
    minStock?: number | null;
    maxStock?: number | null;
    unitPrice?: number | null;
    costPrice?: number | null;
    isActive?: boolean;
  }
) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  // Verifica se produto existe e pertence à empresa
  const existingProduct = await prisma.product.findFirst({
    where: {
      id: productId,
      companyId,
    },
  });

  if (!existingProduct) {
    throw new Error("Produto não encontrado");
  }

  // Verifica se código de barras é único (se está sendo alterado)
  if (data.barcode !== undefined) {
    await verifyBarcodeUnique(data.barcode, companyId, productId);
  }

  // SEPARAÇÃO ABSOLUTA: Validações rigorosas para serviços e produtos
  const isService = existingProduct.isService;

  // VALIDAÇÃO CRÍTICA: Se for serviço, NUNCA pode ter categoria
  if (isService && data.categoryId !== undefined && data.categoryId !== null) {
    throw new Error(
      "Serviços não podem ter categoria. Categorias são exclusivas para produtos."
    );
  }

  // Se for serviço, garantir que categoria seja sempre null
  let finalCategoryId = data.categoryId;
  if (isService) {
    finalCategoryId = null; // Serviços sempre sem categoria
  }

  // Verifica se categoria existe e pertence à empresa (se fornecida e não for serviço)
  if (finalCategoryId !== undefined && finalCategoryId !== null) {
    const category = await prisma.category.findFirst({
      where: {
        id: finalCategoryId,
        companyId,
      },
    });

    if (!category) {
      throw new Error(
        "Categoria não encontrada ou não pertence a esta empresa"
      );
    }

    // VALIDAÇÃO CRÍTICA: Produtos NUNCA podem ter categoria "Serviços"
    const categoryNameLower = category.name.toLowerCase();
    if (categoryNameLower === "serviços" || categoryNameLower === "servicos") {
      throw new Error(
        "Produtos não podem ter categoria 'Serviços'. Esta categoria não deve existir ou deve ser removida."
      );
    }
  }

  // Atualiza o produto
  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      name: data.name,
      description:
        data.description !== undefined ? data.description : undefined,
      barcode: data.barcode !== undefined ? data.barcode : undefined,
      sku: data.sku !== undefined ? data.sku : undefined,
      categoryId: finalCategoryId !== undefined ? finalCategoryId : undefined,
      // Usar apenas currentStock como quantidade única de estoque
      // Se minStock for fornecido (compatibilidade), usar como currentStock
      currentStock:
        data.currentStock !== undefined
          ? data.currentStock
          : data.minStock !== undefined
            ? Number(data.minStock)
            : undefined,
      minStock: undefined, // Sempre remover minStock
      maxStock: undefined, // Sempre remover maxStock
      unitPrice: data.unitPrice !== undefined ? data.unitPrice : undefined,
      costPrice: data.costPrice !== undefined ? data.costPrice : undefined,
      isActive: data.isActive,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return product;
}

/**
 * Deleta um produto
 */
export async function deleteProduct(
  userId: number,
  companyId: number,
  productId: number
) {
  // Verifica acesso à empresa
  await verifyCompanyAccess(userId, companyId);

  // Verifica se produto existe e pertence à empresa
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      companyId,
    },
  });

  if (!product) {
    throw new Error("Produto não encontrado");
  }

  // Deleta o produto (CASCADE vai deletar movimentações relacionadas)
  await prisma.product.delete({
    where: { id: productId },
  });

  return { message: "Produto deletado com sucesso" };
}
