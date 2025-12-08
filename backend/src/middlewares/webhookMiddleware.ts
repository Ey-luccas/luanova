/**
 * Middleware de validação de webhook
 * 
 * Valida o signature do webhook usando o segredo configurado.
 * Suporta GitHub, GitLab e webhooks genéricos.
 */

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import env from "../config/env";
import logger from "../config/logger";

/**
 * Middleware que valida o signature do webhook
 * 
 * Para GitHub: valida o header X-Hub-Signature-256
 * Para GitLab: valida o header X-Gitlab-Token
 * Para genérico: valida o header X-Webhook-Secret
 */
export const webhookMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Se não houver WEBHOOK_SECRET configurado, pula validação
    if (!env.WEBHOOK_SECRET) {
      logger.warn("Webhook secret não configurado, pulando validação");
      next();
      return;
    }

    const secret = env.WEBHOOK_SECRET;
    
    // Para GitHub, precisamos do body raw (já parseado pelo Express)
    // Vamos usar o body como string JSON
    const rawBody = req.body ? JSON.stringify(req.body) : "";

    // GitHub: X-Hub-Signature-256 (SHA-256)
    const githubSignature = req.headers["x-hub-signature-256"] as string;
    if (githubSignature) {
      const expectedSignature = `sha256=${crypto
        .createHmac("sha256", secret)
        .update(rawBody)
        .digest("hex")}`;

      if (githubSignature !== expectedSignature) {
        logger.warn("Webhook GitHub: signature inválida", {
          received: githubSignature.substring(0, 20) + "...",
        });
        res.status(401).json({
          success: false,
          message: "Webhook signature inválida",
        });
        return;
      }

      logger.debug("Webhook GitHub: signature válida");
      next();
      return;
    }

    // GitLab: X-Gitlab-Token (token direto)
    const gitlabToken = req.headers["x-gitlab-token"] as string;
    if (gitlabToken) {
      if (gitlabToken !== secret) {
        logger.warn("Webhook GitLab: token inválido");
        res.status(401).json({
          success: false,
          message: "Webhook token inválido",
        });
        return;
      }

      logger.debug("Webhook GitLab: token válido");
      next();
      return;
    }

    // Genérico: X-Webhook-Secret (token direto)
    const webhookSecret = req.headers["x-webhook-secret"] as string;
    if (webhookSecret) {
      if (webhookSecret !== secret) {
        logger.warn("Webhook genérico: secret inválido");
        res.status(401).json({
          success: false,
          message: "Webhook secret inválido",
        });
        return;
      }

      logger.debug("Webhook genérico: secret válido");
      next();
      return;
    }

    // Se nenhum header de validação foi encontrado
    logger.warn("Webhook: nenhum header de validação encontrado");
    res.status(401).json({
      success: false,
      message: "Header de validação não fornecido",
    });
  } catch (error: any) {
    logger.error("Erro ao validar webhook", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Erro ao validar webhook",
    });
  }
};

