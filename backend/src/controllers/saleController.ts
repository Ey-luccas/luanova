/**
 * Controller de Vendas e Devoluções
 * 
 * Responsável por receber requisições HTTP,
 * chamar os services apropriados e retornar respostas padronizadas.
 */

import { Request, Response } from "express";
import * as saleService from "../services/saleService";
import * as saleSchema from "../schemas/saleSchema";

/**
 * Cria uma venda ou prestação de serviço
 * POST /api/companies/:companyId/sales
 */
export async function createSale(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida parâmetros e body
    const { params, body } = saleSchema.createSaleSchema.parse({
      params: req.params,
      body: req.body,
    });
    const companyId = parseInt(params.companyId, 10);

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Cria a venda
    const sale = await saleService.createSale(
      req.user.id,
      companyId,
      body
    );

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: "Venda registrada com sucesso",
      data: {
        sale,
      },
    });
  } catch (error: any) {
    // Tratamento de erros
    if (
      error.message === "Empresa não encontrada ou você não tem acesso" ||
      error.message === "Produto não encontrado ou não pertence a esta empresa"
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message.includes("Estoque insuficiente") || error.message.includes("unidades suficientes")) {
      res.status(400).json({
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

    console.error("Erro ao criar venda:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar venda",
    });
  }
}

/**
 * Busca vendas por cliente
 * GET /api/companies/:companyId/sales/search
 */
export async function findSalesByCustomer(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida parâmetros e query
    const { params, query } = saleSchema.findSalesByCustomerSchema.parse({
      params: req.params,
      query: req.query,
    });
    const companyId = parseInt(params.companyId, 10);

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Prepara critérios de busca
    const searchCriteria: any = {};
    if (query.customerName) searchCriteria.customerName = query.customerName;
    if (query.customerEmail) searchCriteria.customerEmail = query.customerEmail;
    if (query.customerCpf) searchCriteria.customerCpf = query.customerCpf;
    if (query.startDate) searchCriteria.startDate = new Date(query.startDate);
    if (query.endDate) searchCriteria.endDate = new Date(query.endDate);

    // Busca vendas
    const sales = await saleService.findSalesByCustomer(
      req.user.id,
      companyId,
      searchCriteria
    );

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Vendas encontradas com sucesso",
      data: {
        sales,
        count: sales.length,
      },
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
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }

    console.error("Erro ao buscar vendas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar vendas",
    });
  }
}

/**
 * Cria uma devolução ou reembolso
 * POST /api/companies/:companyId/sales/return
 */
export async function createReturn(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida parâmetros e body
    const { params, body } = saleSchema.createReturnSchema.parse({
      params: req.params,
      body: req.body,
    });
    const companyId = parseInt(params.companyId, 10);

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Cria a devolução
    const returnSale = await saleService.createReturn(
      req.user.id,
      companyId,
      body
    );

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: "Devolução registrada com sucesso",
      data: {
        sale: returnSale,
      },
    });
  } catch (error: any) {
    // Tratamento de erros
    if (
      error.message === "Empresa não encontrada ou você não tem acesso" ||
      error.message === "Venda original não encontrada"
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message.includes("Quantidade de devolução maior")) {
      res.status(400).json({
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

    console.error("Erro ao criar devolução:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar devolução",
    });
  }
}

/**
 * Lista vendas e devoluções
 * GET /api/companies/:companyId/sales
 */
export async function listSales(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida parâmetros e query
    const { params, query } = saleSchema.listSalesSchema.parse({
      params: req.params,
      query: req.query,
    });
    const companyId = parseInt(params.companyId, 10);

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Prepara filtros
    const filters: any = {};
    if (query.type) filters.type = query.type;
    if (query.productId) filters.productId = parseInt(query.productId, 10);
    if (query.startDate) filters.startDate = new Date(query.startDate);
    if (query.endDate) filters.endDate = new Date(query.endDate);
    if (query.page) filters.page = parseInt(query.page, 10);
    if (query.limit) filters.limit = parseInt(query.limit, 10);

    // Lista vendas
    const result = await saleService.listSales(
      req.user.id,
      companyId,
      filters
    );

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Vendas listadas com sucesso",
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
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }

    console.error("Erro ao listar vendas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar vendas",
    });
  }
}

