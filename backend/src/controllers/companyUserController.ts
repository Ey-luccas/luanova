/**
 * Controller para gerenciar usuários/funcionários de empresas
 */

import { Request, Response } from 'express';
import * as companyUserService from '../services/companyUserService';

/**
 * Lista usuários de uma empresa
 * GET /api/companies/:companyId/users
 */
export async function listCompanyUsers(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    const users = await companyUserService.listCompanyUsers(
      companyId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    if (
      error.message === 'Empresa não encontrada ou você não tem acesso' ||
      error.message === 'Apenas administradores podem gerenciar usuários'
    ) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários',
    });
  }
}

/**
 * Adiciona um usuário à empresa
 * POST /api/companies/:companyId/users
 */
export async function addCompanyUser(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const { email, name, password, role, permissions } = req.body;

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    if (!email || !name || !password) {
      res.status(400).json({
        success: false,
        message: 'Email, nome e senha são obrigatórios',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    const companyUser = await companyUserService.addCompanyUser(
      companyId,
      req.user.id,
      {
        email,
        name,
        password,
        role,
        permissions,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Usuário adicionado com sucesso',
      data: companyUser,
    });
  } catch (error: any) {
    if (
      error.message === 'Apenas administradores podem adicionar usuários' ||
      error.message === 'Usuário já está cadastrado nesta empresa' ||
      error.message === 'Email já cadastrado'
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('Erro ao adicionar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar usuário',
    });
  }
}

/**
 * Atualiza um usuário da empresa
 * PUT /api/companies/:companyId/users/:userId
 */
export async function updateCompanyUser(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const userId = parseInt(req.params.userId, 10);
    const { role, isActive, permissions } = req.body;

    if (isNaN(companyId) || isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    const companyUser = await companyUserService.updateCompanyUser(
      companyId,
      req.user.id,
      userId,
      {
        role,
        isActive,
        permissions,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: companyUser,
    });
  } catch (error: any) {
    if (error.message === 'Apenas administradores podem atualizar usuários') {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar usuário',
    });
  }
}

/**
 * Remove um usuário da empresa
 * DELETE /api/companies/:companyId/users/:userId
 */
export async function removeCompanyUser(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(companyId) || isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    await companyUserService.removeCompanyUser(
      companyId,
      req.user.id,
      userId
    );

    res.status(200).json({
      success: true,
      message: 'Usuário removido com sucesso',
    });
  } catch (error: any) {
    if (
      error.message === 'Apenas administradores podem remover usuários' ||
      error.message === 'Você não pode remover a si mesmo'
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('Erro ao remover usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover usuário',
    });
  }
}

/**
 * Lista todas as permissões disponíveis
 * GET /api/permissions
 */
export async function listPermissions(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const permissions = await companyUserService.listPermissions();

    res.status(200).json({
      success: true,
      data: permissions,
    });
  } catch (error: any) {
    console.error('Erro ao listar permissões:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar permissões',
    });
  }
}

