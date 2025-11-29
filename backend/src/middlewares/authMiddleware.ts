/**
 * Middleware de autenticação
 * 
 * Valida tokens JWT Bearer e adiciona informações do usuário ao request.
 */

import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";

// Estende o tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
      };
    }
  }
}

/**
 * Middleware que valida o token Bearer e adiciona o usuário ao request
 */
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extrai o token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: "Token não fornecido",
      });
      return;
    }

    // Verifica o formato "Bearer <token>"
    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
      res.status(401).json({
        success: false,
        message: "Formato de token inválido. Use: Bearer <token>",
      });
      return;
    }

    const token = parts[1];

    // Verifica e decodifica o token
    const payload = authService.verifyAccessToken(token);

    // Busca o usuário no banco
    const user = await authService.getUserById(payload.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Usuário não encontrado",
      });
      return;
    }

    // Adiciona o usuário ao request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    // Continua para o próximo middleware/controller
    next();
  } catch (error: any) {
    // Tratamento de erros
    if (error.message === "Token inválido ou expirado") {
      res.status(401).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Erro ao validar token",
    });
  }
};
