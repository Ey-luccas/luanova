/**
 * Rotas de produtos
 *
 * Define todas as rotas relacionadas a produtos.
 * Todas as rotas requerem autenticação.
 */

import { Router } from "express";
import * as productController from "../controllers/productController";
import * as productUnitController from "../controllers/productUnitController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { companyAccessMiddleware } from "../middlewares/companyAccessMiddleware";

// Router com mergeParams para capturar params da rota pai
const router = Router({ mergeParams: true });

// Todas as rotas requerem autenticação e acesso à empresa
router.use(authMiddleware);
router.use(companyAccessMiddleware);

/**
 * GET /api/companies/:companyId/products
 * Lista produtos de uma empresa com filtros e busca
 */
router.get("/", productController.listProducts);

/**
 * GET /api/companies/:companyId/products/barcode/:code
 * Busca produto por código de barras
 * IMPORTANTE: Esta rota deve vir ANTES das rotas dinâmicas para evitar conflitos
 */
router.get("/barcode/:code", productController.getProductByBarcode);

/**
 * GET /api/companies/:companyId/products/:productId/units
 * Lista unidades de um produto específico
 */
router.get("/:productId/units", productUnitController.getUnitsByProduct);

/**
 * POST /api/companies/:companyId/products
 * Cria um novo produto
 */
router.post("/", productController.createProduct);

/**
 * PUT /api/companies/:companyId/products/:productId
 * Atualiza um produto
 */
router.put("/:productId", productController.updateProduct);

/**
 * DELETE /api/companies/:companyId/products/:productId
 * Deleta um produto
 */
router.delete("/:productId", productController.deleteProduct);

export default router;
