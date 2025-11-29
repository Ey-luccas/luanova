/**
 * Rotas de Vendas e Devoluções
 *
 * Define todas as rotas relacionadas a vendas, prestações, devoluções e reembolsos.
 * Todas as rotas requerem autenticação.
 */

import { Router } from "express";
import * as saleController from "../controllers/saleController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { companyAccessMiddleware } from "../middlewares/companyAccessMiddleware";

// Router com mergeParams para capturar params da rota pai
const router = Router({ mergeParams: true });

// Todas as rotas requerem autenticação e acesso à empresa
router.use(authMiddleware);
router.use(companyAccessMiddleware);

/**
 * POST /api/companies/:companyId/sales
 * Cria uma venda ou prestação de serviço
 */
router.post("/", saleController.createSale);

/**
 * GET /api/companies/:companyId/sales/search
 * Busca vendas por cliente (nome, email, CPF ou data)
 */
router.get("/search", saleController.findSalesByCustomer);

/**
 * POST /api/companies/:companyId/sales/return
 * Cria uma devolução ou reembolso
 */
router.post("/return", saleController.createReturn);

/**
 * GET /api/companies/:companyId/sales
 * Lista vendas e devoluções com filtros
 */
router.get("/", saleController.listSales);

export default router;
