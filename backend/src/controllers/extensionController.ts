/**
 * Controller para extensões e assinaturas
 */

import { Request, Response } from "express";
import * as extensionService from "../services/extensionService";

/**
 * Lista todas as extensões disponíveis
 * GET /api/extensions
 */
export async function listExtensions(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const extensions = await extensionService.listExtensions();

    console.log(`[listExtensions] Retornando ${extensions.length} extensões disponíveis`);
    
    res.status(200).json({
      success: true,
      data: extensions,
    });
  } catch (error: any) {
    console.error("Erro ao listar extensões:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Erro ao listar extensões",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Lista extensões de uma empresa
 * GET /api/companies/:companyId/extensions
 */
export async function getCompanyExtensions(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);

    console.log(`[getCompanyExtensions] Requisição recebida para empresa ${companyId}`);

    if (isNaN(companyId)) {
      console.error(`[getCompanyExtensions] ID da empresa inválido: ${req.params.companyId}`);
      res.status(400).json({
        success: false,
        message: "ID da empresa inválido",
      });
      return;
    }

    if (!req.user) {
      console.error(`[getCompanyExtensions] Usuário não autenticado`);
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    console.log(`[getCompanyExtensions] Usuário autenticado: ${req.user.id}, buscando extensões para empresa ${companyId}`);
    
    const extensions = await extensionService.getCompanyExtensions(companyId);

    console.log(`[getCompanyExtensions] Retornando ${extensions.length} extensões para empresa ${companyId}`);

    res.status(200).json({
      success: true,
      data: extensions,
    });
  } catch (error: any) {
    console.error("Erro ao buscar extensões da empresa:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar extensões",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Adiciona uma extensão para uma empresa
 * POST /api/companies/:companyId/extensions
 */
export async function addCompanyExtension(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const { extensionId, expiresAt } = req.body;

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: "ID da empresa inválido",
      });
      return;
    }

    if (!extensionId) {
      res.status(400).json({
        success: false,
        message: "ID da extensão é obrigatório",
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

    const expiresAtDate = expiresAt ? new Date(expiresAt) : undefined;

    const companyExtension = await extensionService.addCompanyExtension(
      companyId,
      extensionId,
      expiresAtDate
    );

    res.status(200).json({
      success: true,
      message: "Extensão adicionada com sucesso",
      data: companyExtension,
    });
  } catch (error: any) {
    if (error.message === "Extensão não encontrada ou inativa") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    // Erro de dependências faltantes
    if (error.missingDependencies) {
      res.status(400).json({
        success: false,
        message: error.message,
        missingDependencies: error.missingDependencies,
        missingDependencyNames: error.missingDependencyNames,
      });
      return;
    }

    console.error("Erro ao adicionar extensão:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao adicionar extensão",
    });
  }
}

/**
 * Remove/desativa uma extensão de uma empresa
 * DELETE /api/companies/:companyId/extensions/:extensionId
 */
export async function removeCompanyExtension(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const extensionId = parseInt(req.params.extensionId, 10);

    if (isNaN(companyId) || isNaN(extensionId)) {
      res.status(400).json({
        success: false,
        message: "IDs inválidos",
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

    await extensionService.removeCompanyExtension(companyId, extensionId);

    res.status(200).json({
      success: true,
      message: "Extensão removida com sucesso",
    });
  } catch (error: any) {
    if (error.message === "Extensão não encontrada para esta empresa") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    // Erro de dependências reversas (outras extensões dependem desta)
    if (error.blockingExtensions) {
      res.status(400).json({
        success: false,
        message: error.message,
        blockingExtensions: error.blockingExtensions,
        blockingExtensionNames: error.blockingExtensionNames,
      });
      return;
    }

    console.error("Erro ao remover extensão:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao remover extensão",
    });
  }
}
