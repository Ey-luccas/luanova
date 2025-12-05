/**
 * Controller de categorias
 * 
 * Responsável por receber requisições HTTP,
 * chamar os services apropriados e retornar respostas padronizadas.
 */

import { Request, Response } from "express";
import * as categoryService from "../services/categoryService";
import * as categorySchema from "../schemas/categorySchema";

/**
 * Lista categorias de uma empresa
 * GET /api/companies/:companyId/categories
 */
export async function listCategories(
  req: Request,
  res: Response
): Promise<void> {
  try {
    console.log('[listCategories] Request params:', req.params);
    console.log('[listCategories] Request query:', req.query);
    
    // Valida apenas params (query não é necessário para categorias)
    // O schema já faz transformação automática de tipos
    // Passa query vazio para evitar problemas - schema usa .passthrough() então aceita qualquer coisa
    const { params } = categorySchema.listCategoriesSchema.parse({
      params: req.params,
      query: req.query || {}, // Passa query recebido ou vazio
    });
    
    // O schema já converte companyId para number
    const companyId = typeof params.companyId === 'number' 
      ? params.companyId 
      : parseInt(String(params.companyId), 10);
    
    console.log('[listCategories] Validated params:', params);

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Lista categorias
    const categories = await categoryService.listCategories(
      req.user.id,
      companyId
    );

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Categorias listadas com sucesso",
      data: {
        categories,
        count: categories.length,
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
      console.error('[listCategories] Erro de validação Zod:', error.errors);
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
        details: error.errors.map((e: any) => ({
          path: e.path.join('.'),
          message: e.message,
          code: e.code,
        })),
      });
      return;
    }

    console.error('[listCategories] Erro não tratado:', error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar categorias",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Cria uma nova categoria
 * POST /api/companies/:companyId/categories
 */
export async function createCategory(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida parâmetros e body
    const { params, body } = categorySchema.createCategorySchema.parse({
      params: req.params,
      body: req.body,
    });
    // O schema já converte companyId para number
    const companyId = typeof params.companyId === 'number' 
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

    // Cria a categoria
    const category = await categoryService.createCategory(
      req.user.id,
      companyId,
      body as { name: string; }
    );

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: "Categoria criada com sucesso",
      data: {
        category,
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

    if (error.message === "Categoria com este nome já existe nesta empresa") {
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
      message: "Erro ao criar categoria",
    });
  }
}

