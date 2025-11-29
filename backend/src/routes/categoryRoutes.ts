/**
 * Rotas de categorias
 *
 * Define todas as rotas relacionadas a categorias.
 * Todas as rotas requerem autenticação.
 */

import { Router } from "express";
import * as categoryController from "../controllers/categoryController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { companyAccessMiddleware } from "../middlewares/companyAccessMiddleware";

// Router com mergeParams para capturar params da rota pai
const router = Router({ mergeParams: true });

// Todas as rotas requerem autenticação e acesso à empresa
router.use(authMiddleware);
router.use(companyAccessMiddleware);

/**
 * GET /api/companies/:companyId/categories
 * Lista todas as categorias de uma empresa
 */
router.get("/", categoryController.listCategories);

/**
 * POST /api/companies/:companyId/categories
 * Cria uma nova categoria
 */
router.post("/", categoryController.createCategory);

export default router;
