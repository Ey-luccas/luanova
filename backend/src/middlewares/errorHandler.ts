/**
 * Middleware de tratamento de erros
 * 
 * Este middleware captura erros não tratados e retorna
 * respostas HTTP apropriadas com mensagens de erro formatadas.
 */

import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Status code padrão: 500 (Internal Server Error)
  const statusCode = err.statusCode || 500;

  // Mensagem de erro
  const message =
    err.message || "Erro interno do servidor";

  // Log do erro em desenvolvimento
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err);
  }

  // Resposta formatada
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};

