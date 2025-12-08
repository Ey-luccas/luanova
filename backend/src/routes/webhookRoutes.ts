/**
 * Rotas de webhook
 * 
 * Endpoints para receber e processar webhooks
 */

import { Router } from "express";
import { webhookMiddleware } from "../middlewares/webhookMiddleware";
import * as webhookController from "../controllers/webhookController";

const router = Router();

// Rota principal de webhook
// POST /api/webhook
// O middleware de validação é aplicado antes do controller
router.post("/", webhookMiddleware, webhookController.handleWebhook);

export default router;

