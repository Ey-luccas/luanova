/**
 * Middleware de tratamento de erros
 * 
 * Este middleware captura erros não tratados e retorna
 * respostas HTTP apropriadas com mensagens de erro formatadas.
 */

import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Status code padrão: 500 (Internal Server Error)
  const statusCode = err.statusCode || 500;

  // Mensagem de erro
  const message =
    err.message || "Erro interno do servidor";

  // Log do erro com informações detalhadas
  if (statusCode >= 500) {
    // Erros do servidor (500+) - sempre logar
    logger.error(`Error ${statusCode}: ${message}`, {
      error: err.message,
      stack: err.stack,
      statusCode,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      body: req.body,
      params: req.params,
      query: req.query,
    });
  } else {
    // Erros do cliente (400-499) - logar como warning
    logger.warn(`Client Error ${statusCode}: ${message}`, {
      error: err.message,
      statusCode,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
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

