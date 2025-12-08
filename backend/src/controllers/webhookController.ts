/**
 * Controller de webhook
 * 
 * Processa eventos de webhook (GitHub, GitLab, etc.)
 */

import { Request, Response } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import logger from "../config/logger";
import env from "../config/env";

const execAsync = promisify(exec);

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
  const ref = event.ref || event.branch || "";
  const branch = ref.replace("refs/heads/", "");
  const deployBranch = env.DEPLOY_BRANCH || "prod";

  logger.info("Processando evento de push", {
    ref,
    branch,
    deployBranch,
    commits: event.commits?.length || 0,
    repository: event.repository?.name || "unknown",
  });

  // Só faz deploy se for a branch configurada
  if (branch !== deployBranch) {
    logger.info(`Push ignorado - branch '${branch}' não é '${deployBranch}'`);
    return;
  }

  logger.info(`🚀 Iniciando deploy automático para branch '${branch}'`);

  try {
    // Deploy do backend
    await deployBackend();
    
    // Deploy do frontend (opcional, pode ser adicionado depois)
    // await deployFrontend();

    logger.info("✅ Deploy automático concluído com sucesso");
  } catch (error: any) {
    logger.error("❌ Erro durante deploy automático", {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

/**
 * Executa deploy do backend
 */
async function deployBackend(): Promise<void> {
  const backendPath = env.BACKEND_PATH || "/var/www/luanova/backend";

  logger.info("📦 Iniciando deploy do backend", { path: backendPath });

  try {
    // 1. Git pull
    logger.info("1️⃣ Executando git pull...");
    const { stdout: pullOutput, stderr: pullError } = await execAsync(
      `cd ${backendPath} && git pull`,
      { timeout: 30000 } // 30 segundos timeout
    );
    if (pullOutput) logger.debug("Git pull output:", pullOutput);
    if (pullError) logger.warn("Git pull warnings:", pullError);

    // 2. npm install
    logger.info("2️⃣ Executando npm install...");
    const { stdout: installOutput, stderr: installError } = await execAsync(
      `cd ${backendPath} && npm install`,
      { timeout: 120000 } // 2 minutos timeout
    );
    if (installOutput) logger.debug("NPM install output:", installOutput);
    if (installError) logger.warn("NPM install warnings:", installError);

    // 3. npm run build
    logger.info("3️⃣ Executando npm run build...");
    const { stdout: buildOutput, stderr: buildError } = await execAsync(
      `cd ${backendPath} && npm run build`,
      { timeout: 120000 } // 2 minutos timeout
    );
    if (buildOutput) logger.debug("Build output:", buildOutput);
    if (buildError) {
      logger.error("❌ Erro no build:", buildError);
      throw new Error(`Build falhou: ${buildError}`);
    }

    // 4. PM2 restart
    logger.info("4️⃣ Reiniciando PM2...");
    const { stdout: pm2Output, stderr: pm2Error } = await execAsync(
      `pm2 restart estoquelua-backend`,
      { timeout: 30000 } // 30 segundos timeout
    );
    if (pm2Output) logger.debug("PM2 restart output:", pm2Output);
    if (pm2Error) logger.warn("PM2 restart warnings:", pm2Error);

    logger.info("✅ Deploy do backend concluído");
  } catch (error: any) {
    logger.error("❌ Erro no deploy do backend", {
      error: error.message,
      code: error.code,
    });
    throw error;
  }
}

/**
 * Executa deploy do frontend (opcional)
 * Descomente a chamada em handlePushEvent() para ativar
 */
export async function deployFrontend(): Promise<void> {
  const frontendPath = env.FRONTEND_PATH || "/var/www/luanova/web";

  logger.info("📦 Iniciando deploy do frontend", { path: frontendPath });

  try {
    // 1. Git pull
    logger.info("1️⃣ Executando git pull (frontend)...");
    await execAsync(`cd ${frontendPath} && git pull`, { timeout: 30000 });

    // 2. npm install
    logger.info("2️⃣ Executando npm install (frontend)...");
    await execAsync(`cd ${frontendPath} && npm install`, { timeout: 120000 });

    // 3. npm run build
    logger.info("3️⃣ Executando npm run build (frontend)...");
    const { stderr: buildError } = await execAsync(
      `cd ${frontendPath} && npm run build`,
      { timeout: 180000 } // 3 minutos timeout
    );
    if (buildError) {
      logger.error("❌ Erro no build do frontend:", buildError);
      throw new Error(`Build do frontend falhou: ${buildError}`);
    }

    // 4. Reiniciar serviço do frontend (se usar PM2)
    // await execAsync(`pm2 restart estoquelua-frontend`, { timeout: 30000 });

    logger.info("✅ Deploy do frontend concluído");
  } catch (error: any) {
    logger.error("❌ Erro no deploy do frontend", {
      error: error.message,
      code: error.code,
    });
    throw error;
  }
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

