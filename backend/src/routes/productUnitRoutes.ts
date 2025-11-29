import { Router } from "express";
import * as productUnitController from "../controllers/productUnitController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { companyAccessMiddleware } from "../middlewares/companyAccessMiddleware";

const router = Router({ mergeParams: true });

// Todas as rotas precisam de autenticação e acesso à empresa
router.use(authMiddleware);
router.use(companyAccessMiddleware);

/**
 * POST /api/companies/:companyId/units
 * Cria unidades de produto com códigos de barras
 * Body: { productId: number, quantity: number }
 */
router.post("/units", productUnitController.createUnits);

/**
 * GET /api/companies/:companyId/units/by-date?date=2024-01-26
 * Lista unidades criadas em uma data específica
 */
router.get("/units/by-date", productUnitController.getUnitsByDate);

/**
 * GET /api/companies/:companyId/units/dates
 * Lista todas as datas que têm unidades criadas
 */
router.get("/units/dates", productUnitController.getUnitsDates);

/**
 * PUT /api/companies/:companyId/units/:unitId/sold
 * Marca uma unidade como vendida
 */
router.put("/units/:unitId/sold", productUnitController.markAsSold);

export default router;
