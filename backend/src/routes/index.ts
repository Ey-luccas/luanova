/**
 * Arquivo principal de rotas
 *
 * Este arquivo centraliza todas as rotas da aplicação
 * e as exporta para serem utilizadas no servidor principal.
 */

import { Router, Request, Response } from "express";
import authRoutes from "./authRoutes";
import companyRoutes from "./companyRoutes";
import productRoutes from "./productRoutes";
import categoryRoutes from "./categoryRoutes";
import movementRoutes from "./movementRoutes";
import productUnitRoutes from "./productUnitRoutes";
import saleRoutes from "./saleRoutes";
import reportRoutes from "./reportRoutes";
import extensionRoutes from "./extensionRoutes";
import companyExtensionRoutes from "./companyExtensionRoutes";
import companyUserRoutes from "./companyUserRoutes";
import appointmentRoutes from "./appointmentRoutes";
import * as companyUserController from "../controllers/companyUserController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Rota de teste - Hello API
router.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Lua Nova API - Desenvolvido por Lualabs",
    version: "1.0.0",
    developer: "Lualabs",
  });
});

// Rota de health check
router.get("/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Rotas de autenticação
router.use("/auth", authRoutes);

// Rotas de empresas
router.use("/companies", companyRoutes);

// Rotas de produtos (aninhadas em companies)
router.use("/companies/:companyId/products", productRoutes);

// Rotas de categorias (aninhadas em companies)
router.use("/companies/:companyId/categories", categoryRoutes);

// Rotas de movimentações de estoque (aninhadas em companies)
router.use("/companies/:companyId/movements", movementRoutes);

// Rotas de vendas e devoluções (aninhadas em companies)
router.use("/companies/:companyId/sales", saleRoutes);

// Rotas de relatórios (aninhadas em companies)
router.use("/companies/:companyId/reports", reportRoutes);

// Rotas de extensões gerais
router.use("/extensions", extensionRoutes);

// Rotas de extensões de empresas (aninhadas em companies)
router.use("/companies/:companyId/extensions", companyExtensionRoutes);

// Rotas de usuários/funcionários (aninhadas em companies)
router.use("/companies/:companyId/users", companyUserRoutes);

// Rotas de permissões
router.get(
  "/permissions",
  authMiddleware,
  companyUserController.listPermissions
);

// Rotas de unidades de produtos (aninhadas em companies)
router.use("/companies/:companyId", productUnitRoutes);

// Rotas de agendamento (aninhadas em companies)
router.use("/companies/:companyId/appointments", appointmentRoutes);

// Rotas de restaurante/pizzaria (aninhadas em companies)
import restaurantRoutes from "./restaurantRoutes";
router.use("/companies/:companyId/restaurant", restaurantRoutes);

export default router;
