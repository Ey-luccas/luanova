/**
 * Controller de empresas
 *
 * Responsável por receber requisições HTTP,
 * chamar os services apropriados e retornar respostas padronizadas.
 */

import { Request, Response } from "express";
import * as companyService from "../services/companyService";
import * as companySchema from "../schemas/companySchema";
import * as dashboardService from "../services/dashboardService";
import * as csvService from "../services/csvService";
// import multer from "multer";

/**
 * Cria uma nova empresa
 * POST /api/companies
 */
export async function createCompany(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida o body da requisição
    const { body } = companySchema.createCompanySchema.parse({
      body: req.body,
    });

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Cria a empresa
    const company = await companyService.createCompany(req.user.id, body);

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: "Empresa criada com sucesso",
      data: {
        company,
      },
    });
  } catch (error: any) {
    // Tratamento de erros
    if (error.message === "CNPJ já cadastrado") {
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
      message: "Erro ao criar empresa",
    });
  }
}

/**
 * Lista todas as empresas do usuário logado
 * GET /api/companies
 */
export async function listCompanies(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    console.log(
      `[listCompanies] Buscando empresas para usuário ID: ${req.user.id}`
    );

    // Lista as empresas do usuário
    const companies = await companyService.getUserCompanies(req.user.id);

    console.log(
      `[listCompanies] ${companies.length} empresa(s) encontrada(s) para usuário ${req.user.id}`
    );

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Empresas listadas com sucesso",
      data: {
        companies,
        count: companies.length,
      },
    });
  } catch (error: any) {
    console.error("[listCompanies] Erro ao listar empresas:", error);
    console.error("[listCompanies] Stack:", error.stack);
    console.error("[listCompanies] User ID:", req.user?.id);

    res.status(500).json({
      success: false,
      message: "Erro ao listar empresas",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Busca uma empresa por ID
 * GET /api/companies/:id
 */
export async function getCompanyById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida os parâmetros
    const { params } = companySchema.companyIdSchema.parse({
      params: req.params,
    });
    const companyId = parseInt(params.id, 10);

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Busca a empresa
    const company = await companyService.getCompanyById(companyId, req.user.id);

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Empresa encontrada",
      data: {
        company,
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
        message: "ID inválido",
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Erro ao buscar empresa",
    });
  }
}

/**
 * Atualiza uma empresa
 * PUT /api/companies/:id
 */
export async function updateCompany(
  req: Request,
  res: Response
): Promise<void> {
  try {
    console.log("[updateCompany] Request params:", req.params);
    console.log(
      "[updateCompany] Request body:",
      JSON.stringify(req.body, null, 2)
    );

    // Valida os parâmetros e body
    const { params, body } = companySchema.updateCompanySchema.parse({
      params: req.params,
      body: req.body,
    });

    console.log("[updateCompany] Validated params:", params);
    console.log(
      "[updateCompany] Validated body:",
      JSON.stringify(body, null, 2)
    );
    const companyId = parseInt(params.id, 10);

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Atualiza a empresa
    const company = await companyService.updateCompany(
      companyId,
      req.user.id,
      body
    );

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Empresa atualizada com sucesso",
      data: {
        company,
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

    if (error.message === "CNPJ já cadastrado em outra empresa") {
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
      message: "Erro ao atualizar empresa",
    });
  }
}

/**
 * Upload de logo da empresa
 * POST /api/companies/:id/logo
 */
export async function uploadCompanyLogo(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const companyId = parseInt(req.params.id, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: "ID da empresa inválido",
      });
      return;
    }

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Verifica se há arquivo
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Nenhum arquivo enviado",
      });
      return;
    }

    // Gera a URL do logo
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    // Atualiza a empresa com a URL do logo
    const company = await companyService.updateCompany(companyId, req.user.id, {
      logoUrl,
    });

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Logo atualizado com sucesso",
      data: {
        company,
        logoUrl,
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

    if (error.message === "Apenas arquivos de imagem são permitidos") {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Erro ao fazer upload do logo:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao fazer upload do logo",
    });
  }
}

/**
 * Busca dados do dashboard de uma empresa
 * GET /api/companies/:id/dashboard
 */
export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.id, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: "ID da empresa inválido",
      });
      return;
    }

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Busca dados do dashboard
    const dashboardData = await dashboardService.getDashboardData(
      req.user.id,
      companyId
    );

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      data: dashboardData,
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

    console.error("Erro ao buscar dados do dashboard:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar dados do dashboard",
    });
  }
}

/**
 * Gera CSV de backup das movimentações
 * GET /api/companies/:id/backup
 */
export async function downloadCompanyBackup(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const companyId = parseInt(req.params.id, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: "ID da empresa inválido",
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    const csvContent = await csvService.generateSalesCSV(
      companyId,
      req.user.id
    );

    // Busca nome da empresa para o nome do arquivo
    const company = await companyService.getCompanyById(companyId, req.user.id);
    const fileName = `backup-${company.name.replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.csv`;

    // Define headers para download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );

    // Envia o CSV
    res.status(200).send('\ufeff' + csvContent); // BOM para Excel
  } catch (error: any) {
    if (
      error.message === "Empresa não encontrada ou você não tem acesso"
    ) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Erro ao gerar backup:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar backup",
    });
  }
}

/**
 * Exclui uma empresa permanentemente
 * DELETE /api/companies/:id
 */
export async function deleteCompany(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const companyId = parseInt(req.params.id, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: "ID da empresa inválido",
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    await companyService.deleteCompany(companyId, req.user.id);

    res.status(200).json({
      success: true,
      message: "Empresa excluída com sucesso",
    });
  } catch (error: any) {
    if (
      error.message === "Empresa não encontrada ou você não tem acesso" ||
      error.message === "Apenas administradores podem excluir empresas"
    ) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Erro ao excluir empresa:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir empresa",
    });
  }
}

/**
 * Restaura empresa a partir de CSV de backup
 * POST /api/companies/restore
 */
export async function restoreCompany(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Nenhum arquivo CSV enviado",
      });
      return;
    }

    // Lê o conteúdo do arquivo
    const csvContent = req.file.buffer.toString('utf-8');

    // Processa o CSV e restaura a empresa
    const result = await csvService.restoreCompanyFromCSV(
      csvContent,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Empresa restaurada com sucesso",
      data: result,
    });
  } catch (error: any) {
    console.error("Erro ao restaurar empresa:", error);
    
    if (
      error.message.includes("Formato de CSV inválido") ||
      error.message.includes("Nenhuma movimentação válida")
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Erro ao restaurar empresa",
    });
  }
}
