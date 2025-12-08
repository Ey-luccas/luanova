/**
 * Controller de webhook
 * 
 * Processa eventos de webhook (GitHub, GitLab, etc.)
 */

import { Request, Response } from "express";
import logger from "../config/logger";

/**
 * Processa webhook genérico
 * POST /api/webhook
 */
export async function handleWebhook(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const event = req.body;
    const eventType = req.headers["x-github-event"] || 
                     req.headers["x-gitlab-event"] || 
                     req.headers["x-event-type"] ||
                     "unknown";

    logger.info("Webhook recebido", {
      eventType,
      provider: detectProvider(req.headers),
      timestamp: new Date().toISOString(),
    });

    // Processa diferentes tipos de eventos
    switch (eventType) {
      case "push":
      case "Push Hook":
        await handlePushEvent(event);
        break;

      case "pull_request":
      case "Merge Request Hook":
        await handlePullRequestEvent(event);
        break;

      case "ping":
        // GitHub ping event (teste)
        logger.info("Webhook ping recebido (teste)");
        break;

      default:
        logger.info(`Evento não processado: ${eventType}`);
    }

    res.status(200).json({
      success: true,
      message: "Webhook processado com sucesso",
      eventType,
    });
  } catch (error: any) {
    logger.error("Erro ao processar webhook", { error: error.message });
    res.status(500).json({
      success: false,
      message: "Erro ao processar webhook",
    });
  }
}

/**
 * Detecta o provedor do webhook baseado nos headers
 */
function detectProvider(headers: any): string {
  if (headers["x-github-event"]) return "GitHub";
  if (headers["x-gitlab-event"]) return "GitLab";
  if (headers["x-event-type"]) return "Genérico";
  return "Desconhecido";
}

/**
 * Processa evento de push
 */
async function handlePushEvent(event: any): Promise<void> {
  logger.info("Processando evento de push", {
    branch: event.ref || event.branch,
    commits: event.commits?.length || 0,
  });

  // Aqui você pode adicionar lógica específica para push
  // Por exemplo: deploy automático, notificações, etc.
}

/**
 * Processa evento de pull request
 */
async function handlePullRequestEvent(event: any): Promise<void> {
  logger.info("Processando evento de pull request", {
    action: event.action || event.object_attributes?.action,
    number: event.number || event.object_attributes?.iid,
  });

  // Aqui você pode adicionar lógica específica para PR
  // Por exemplo: validações, notificações, etc.
}

