/**
 * Rotas de extensões de empresas
 */

import { Router } from "express";
import * as extensionController from "../controllers/extensionController";
import * as extensionFeedbackController from "../controllers/extensionFeedbackController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { companyAccessMiddleware } from "../middlewares/companyAccessMiddleware";

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.use(companyAccessMiddleware);

/**
 * GET /api/companies/:companyId/extensions
 * Lista extensões de uma empresa
 * IMPORTANTE: Esta rota genérica deve vir PRIMEIRO para evitar conflitos
 */
router.get("/", extensionController.getCompanyExtensions);

/**
 * POST /api/companies/:companyId/extensions/feedback
 * Cria/atualiza feedback
 */
router.post("/feedback", extensionFeedbackController.createFeedback);

/**
 * GET /api/companies/:companyId/extensions/feedback/:companyExtensionId
 * Busca feedback do usuário para uma extensão
 * IMPORTANTE: Usa /feedback/:id ao invés de /:id/feedback para evitar conflito
 */
router.get(
  "/feedback/:companyExtensionId",
  extensionFeedbackController.getUserFeedback
);

/**
 * POST /api/companies/:companyId/extensions
 * Adiciona uma extensão para uma empresa
 */
router.post("/", extensionController.addCompanyExtension);

/**
 * DELETE /api/companies/:companyId/extensions/:extensionId
 * Remove/desativa uma extensão de uma empresa
 */
router.delete("/:extensionId", extensionController.removeCompanyExtension);

export default router;
