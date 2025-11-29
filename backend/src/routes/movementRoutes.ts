/**
 * Rotas de movimentações de estoque
 *
 * Define todas as rotas relacionadas a movimentações de estoque.
 * Todas as rotas requerem autenticação.
 */

import { Router } from "express";
import * as movementController from "../controllers/movementController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { companyAccessMiddleware } from "../middlewares/companyAccessMiddleware";

// Router com mergeParams para capturar params da rota pai
const router = Router({ mergeParams: true });

// Todas as rotas requerem autenticação e acesso à empresa
router.use(authMiddleware);
router.use(companyAccessMiddleware);

/**
 * POST /api/companies/:companyId/movements
 * Cria uma movimentação de estoque
 */
router.post("/", movementController.createMovement);

/**
 * POST /api/companies/:companyId/movements/batch
 * Cria múltiplas movimentações em lote
 */
router.post("/batch", movementController.createBatchMovements);

/**
 * GET /api/companies/:companyId/movements
 * Lista movimentações de uma empresa com filtros
 */
router.get("/", movementController.listMovements);

export default router;
