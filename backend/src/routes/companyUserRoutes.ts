/**
 * Rotas de usuários/funcionários de empresas
 */

import { Router } from "express";
import * as companyUserController from "../controllers/companyUserController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { companyAccessMiddleware } from "../middlewares/companyAccessMiddleware";

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.use(companyAccessMiddleware);

/**
 * GET /api/companies/:companyId/users
 * Lista usuários de uma empresa
 */
router.get("/", companyUserController.listCompanyUsers);

/**
 * POST /api/companies/:companyId/users
 * Adiciona um usuário à empresa
 */
router.post("/", companyUserController.addCompanyUser);

/**
 * PUT /api/companies/:companyId/users/:userId
 * Atualiza um usuário da empresa
 */
router.put("/:userId", companyUserController.updateCompanyUser);

/**
 * DELETE /api/companies/:companyId/users/:userId
 * Remove um usuário da empresa
 */
router.delete("/:userId", companyUserController.removeCompanyUser);

export default router;
