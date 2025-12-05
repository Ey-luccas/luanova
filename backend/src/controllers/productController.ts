/**
 * Controller de produtos
 *
 * Responsável por receber requisições HTTP,
 * chamar os services apropriados e retornar respostas padronizadas.
 */

import { Request, Response } from "express";
import * as productService from "../services/productService";
import * as productSchema from "../schemas/productSchema";

/**
 * Lista produtos de uma empresa
 * GET /api/companies/:companyId/products
 */
export async function listProducts(req: Request, res: Response): Promise<void> {
  try {
    console.log("[listProducts] Request params:", req.params);
    console.log("[listProducts] Request query:", req.query);

    // Limpar query vazias antes de validar
    const cleanQuery: any = {};
    if (req.query && typeof req.query === "object") {
      Object.entries(req.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          cleanQuery[key] = String(value); // Garantir que seja string
        }
      });
    }

    // Valida parâmetros e query
    // O schema já faz transformação automática de tipos
    const { params, query } = productSchema.listProductsSchema.parse({
      params: req.params,
      query: Object.keys(cleanQuery).length > 0 ? cleanQuery : undefined,
    });

    // O schema já converte companyId para number
    const companyId =
      typeof params.companyId === "number"
        ? params.companyId
        : parseInt(params.companyId, 10);

    console.log("[listProducts] Validated params:", params);
    console.log("[listProducts] Validated query:", query);

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Prepara filtros
    // Nota: query.categoryId vem como number do schema transform
    // mas outros campos podem vir como string ainda
    const filters: any = {};
    if (query?.search) filters.search = query.search;
    if (query?.categoryId !== undefined) {
      filters.categoryId =
        typeof query.categoryId === "number"
          ? query.categoryId
          : parseInt(String(query.categoryId), 10);
    }
    if (query?.isActive) filters.isActive = query.isActive === "true";
    if (query?.isService !== undefined) {
      const isServiceValue = query.isService;
      if (typeof isServiceValue === 'string') {
        filters.isService = isServiceValue === "true";
      } else if (typeof isServiceValue === 'boolean') {
        filters.isService = isServiceValue;
      }
    }
    if (query?.minStock !== undefined) {
      filters.minStock =
        typeof query.minStock === "number"
          ? query.minStock
          : parseFloat(String(query.minStock));
    }
    if (query?.maxStock !== undefined) {
      filters.maxStock =
        typeof query.maxStock === "number"
          ? query.maxStock
          : parseFloat(String(query.maxStock));
    }
    // page e limit têm defaults no schema, mas garantimos aqui também
    filters.page =
      typeof query?.page === "number"
        ? query.page
        : query?.page
          ? parseInt(String(query.page), 10)
          : 1;
    filters.limit =
      typeof query?.limit === "number"
        ? query.limit
        : query?.limit
          ? parseInt(String(query.limit), 10)
          : 10;

    // Lista produtos
    const result = await productService.listProducts(
      req.user.id,
      companyId,
      filters
    );

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Produtos listados com sucesso",
      data: result,
    });
  } catch (error: any) {
    // Tratamento de erros
    if (error.message === "Empresa não encontrada ou você não tem acesso") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.name === "ZodError") {
      console.error("[listProducts] Erro de validação Zod:", error.errors);
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
        details: error.errors.map((e: any) => ({
          path: e.path.join("."),
          message: e.message,
          code: e.code,
        })),
      });
      return;
    }

    console.error("[listProducts] Erro não tratado:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar produtos",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Busca produto por código de barras
 * GET /api/companies/:companyId/products/barcode/:code
 */
export async function getProductByBarcode(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida parâmetros
    const { params } = productSchema.getProductByBarcodeSchema.parse({
      params: req.params,
    });
    // O schema já converte companyId para number
    const companyId =
      typeof params.companyId === "number"
        ? params.companyId
        : parseInt(String(params.companyId), 10);

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Busca produto
    const product = await productService.getProductByBarcode(
      req.user.id,
      companyId,
      params.barcode
    );

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Produto encontrado",
      data: {
        product,
      },
    });
  } catch (error: any) {
    // Tratamento de erros
    if (
      error.message === "Empresa não encontrada ou você não tem acesso" ||
      error.message === "Produto não encontrado"
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Erro ao buscar produto",
    });
  }
}

/**
 * Cria um novo produto
 * POST /api/companies/:companyId/products
 */
export async function createProduct(
  req: Request,
  res: Response
): Promise<void> {
  try {
    console.log("[createProduct] Request params:", req.params);
    console.log(
      "[createProduct] Request body:",
      JSON.stringify(req.body, null, 2)
    );

    // Valida parâmetros e body
    const { params, body } = productSchema.createProductSchema.parse({
      params: req.params,
      body: req.body,
    });

    console.log("[createProduct] Validated params:", params);
    console.log(
      "[createProduct] Validated body:",
      JSON.stringify(body, null, 2)
    );
    // O schema já converte companyId para number
    const companyId =
      typeof params.companyId === "number"
        ? params.companyId
        : parseInt(String(params.companyId), 10);

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Cria o produto
    const product = await productService.createProduct(
      req.user.id,
      companyId,
      body
    );

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: "Produto criado com sucesso",
      data: {
        product,
      },
    });
  } catch (error: any) {
    console.error("[createProduct] Erro capturado:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      errors: error.errors,
    });

    // Tratamento de erros
    if (
      error.message === "Empresa não encontrada ou você não tem acesso" ||
      error.message ===
        "Categoria não encontrada ou não pertence a esta empresa"
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message === "Código de barras já cadastrado nesta empresa") {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.name === "ZodError") {
      console.error(
        "[createProduct] Erro de validação Zod:",
        JSON.stringify(error.errors, null, 2)
      );
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }

    console.error("[createProduct] Erro não tratado:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar produto",
    });
  }
}

/**
 * Atualiza um produto
 * PUT /api/companies/:companyId/products/:productId
 */
export async function updateProduct(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida parâmetros e body
    const { params, body } = productSchema.updateProductSchema.parse({
      params: req.params,
      body: req.body,
    });
    // O schema já converte companyId e productId para number
    const companyId =
      typeof params.companyId === "number"
        ? params.companyId
        : parseInt(String(params.companyId), 10);
    const productId =
      typeof params.productId === "number"
        ? params.productId
        : parseInt(String(params.productId), 10);

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Atualiza o produto
    const product = await productService.updateProduct(
      req.user.id,
      companyId,
      productId,
      body
    );

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Produto atualizado com sucesso",
      data: {
        product,
      },
    });
  } catch (error: any) {
    // Tratamento de erros
    if (
      error.message === "Empresa não encontrada ou você não tem acesso" ||
      error.message === "Produto não encontrado" ||
      error.message ===
        "Categoria não encontrada ou não pertence a esta empresa"
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message === "Código de barras já cadastrado nesta empresa") {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Erro ao atualizar produto",
    });
  }
}

/**
 * Deleta um produto
 * DELETE /api/companies/:companyId/products/:productId
 */
export async function deleteProduct(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida parâmetros
    const { params } = productSchema.deleteProductSchema.parse({
      params: req.params,
    });

    // O schema já converte companyId e productId para number
    const companyId =
      typeof params.companyId === "number"
        ? params.companyId
        : parseInt(params.companyId, 10);
    const productId =
      typeof params.productId === "number"
        ? params.productId
        : parseInt(params.productId, 10);

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Deleta o produto
    await productService.deleteProduct(req.user.id, companyId, productId);

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Produto deletado com sucesso",
    });
  } catch (error: any) {
    // Tratamento de erros
    if (
      error.message === "Empresa não encontrada ou você não tem acesso" ||
      error.message === "Produto não encontrado"
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }

    console.error("[deleteProduct] Erro não tratado:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao deletar produto",
    });
  }
}
