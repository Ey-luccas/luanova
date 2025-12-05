/**
 * Controller de movimentações de estoque
 * 
 * Responsável por receber requisições HTTP,
 * chamar os services apropriados e retornar respostas padronizadas.
 */

import { Request, Response } from "express";
import * as movementService from "../services/movementService";
import * as movementSchema from "../schemas/movementSchema";

/**
 * Cria uma movimentação de estoque
 * POST /api/companies/:companyId/movements
 */
export async function createMovement(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida parâmetros e body
    const { params, body } = movementSchema.createMovementSchema.parse({
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

    // Cria a movimentação
    const movement = await movementService.createMovement(
      req.user.id,
      companyId,
      body as { productId: number; type: "IN" | "OUT"; quantity: number; reason?: string; }
    );

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: "Movimentação criada com sucesso",
      data: {
        movement,
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

    if (error.message.includes("Estoque insuficiente")) {
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

    res.status(500).json({
      success: false,
      message: "Erro ao criar movimentação",
    });
  }
}

/**
 * Cria múltiplas movimentações em lote
 * POST /api/companies/:companyId/movements/batch
 */
export async function createBatchMovements(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida parâmetros e body
    const { params, body } = movementSchema.createBatchMovementsSchema.parse({
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

    // Cria as movimentações em lote
    const movements = await movementService.createBatchMovements(
      req.user.id,
      companyId,
      body.movements as Array<{ productId: number; type: "IN" | "OUT"; quantity: number; reason?: string; }>
    );

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: `${movements.length} movimentação(ões) criada(s) com sucesso`,
      data: {
        movements,
        count: movements.length,
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

    if (error.message.includes("Estoque insuficiente")) {
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

    res.status(500).json({
      success: false,
      message: "Erro ao criar movimentações",
    });
  }
}

/**
 * Lista movimentações de uma empresa
 * GET /api/companies/:companyId/movements
 */
export async function listMovements(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida parâmetros e query
    const { params, query } = movementSchema.listMovementsSchema.parse({
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
    if (query?.productId) filters.productId = parseInt(query.productId, 10);
    if (query?.type) filters.type = query.type;
    if (query?.startDate) filters.startDate = new Date(query.startDate);
    if (query?.endDate) filters.endDate = new Date(query.endDate);
    if (query?.page) filters.page = parseInt(query.page, 10);
    if (query?.limit) filters.limit = parseInt(query.limit, 10);

    // Lista movimentações
    const result = await movementService.listMovements(
      req.user.id,
      companyId,
      filters
    );

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Movimentações listadas com sucesso",
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

    res.status(500).json({
      success: false,
      message: "Erro ao listar movimentações",
    });
  }
}

