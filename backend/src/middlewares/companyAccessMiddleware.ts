/**
 * Middleware de verificação de acesso à empresa
 *
 * Garante que o usuário autenticado tem acesso à empresa especificada
 * antes de permitir qualquer operação.
 */

import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";

/**
 * Middleware que verifica se o usuário tem acesso à empresa
 * Deve ser usado após authMiddleware em rotas com :companyId
 */
export const companyAccessMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Extrai o companyId dos parâmetros (pode ser :companyId ou :id)
    const companyIdParam = req.params.companyId || req.params.id;

    if (!companyIdParam) {
      res.status(400).json({
        success: false,
        message: "ID da empresa não fornecido",
      });
      return;
    }

    const companyId = parseInt(companyIdParam, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: "ID da empresa inválido",
      });
      return;
    }

    // Verifica se o usuário tem acesso à empresa
    const companyUser = await prisma.companyUser.findUnique({
      where: {
        userId_companyId: {
          userId: req.user.id,
          companyId,
        },
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!companyUser) {
      res.status(403).json({
        success: false,
        message: "Você não tem acesso a esta empresa",
      });
      return;
    }

    // Verifica se o usuário está ativo na empresa
    if (!companyUser.isActive) {
      res.status(403).json({
        success: false,
        message: "Seu acesso a esta empresa está desativado",
      });
      return;
    }

    // Adiciona informações da empresa ao request para uso posterior
    req.companyAccess = {
      companyId,
      role: companyUser.role,
      isActive: companyUser.isActive,
    };

    // Continua para o próximo middleware/controller
    next();
  } catch (error: any) {
    console.error("[companyAccessMiddleware] Erro:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao verificar acesso à empresa",
    });
  }
};

// Estende o tipo Request para incluir companyAccess
declare global {
  namespace Express {
    interface Request {
      companyAccess?: {
        companyId: number;
        role: string;
        isActive: boolean;
      };
    }
  }
}
