/**
 * Rotas de Relatórios
 *
 * Define todas as rotas relacionadas a relatórios e análises.
 * Todas as rotas requerem autenticação.
 */

import { Router } from "express";
import * as reportController from "../controllers/reportController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { companyAccessMiddleware } from "../middlewares/companyAccessMiddleware";

// Router com mergeParams para capturar params da rota pai
const router = Router({ mergeParams: true });

// Todas as rotas requerem autenticação e acesso à empresa
router.use(authMiddleware);
router.use(companyAccessMiddleware);

/**
 * GET /api/companies/:companyId/reports
 * Busca dados agregados para relatórios
 */
router.get("/", reportController.getReportData);

/**
 * GET /api/companies/:companyId/reports/download
 * Gera e baixa relatório
 */
router.get("/download", reportController.downloadReport);

export default router;
