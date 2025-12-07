/**
 * Arquivo principal de rotas
 *
 * Este arquivo centraliza todas as rotas da aplicação
 * e as exporta para serem utilizadas no servidor principal.
 */

import { Router, Request, Response } from "express";
import os from "os";
import prisma from "../config/prisma";
import env from "../config/env";
import logger from "../config/logger";
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

// Uptime do servidor (em segundos)
const serverStartTime = Date.now();

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

// Rota de health check completo
router.get("/health", async (_req: Request, res: Response) => {
  const startTime = Date.now();
  const health: {
    success: boolean;
    status: string;
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
    database?: {
      status: string;
      responseTime?: number;
      provider?: string;
    };
    memory?: {
      used: number;
      total: number;
      percentage: number;
    };
    errors?: string[];
  } = {
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - serverStartTime) / 1000), // segundos
    environment: env.NODE_ENV,
    version: "1.0.0",
  };

  const errors: string[] = [];

  // Verifica conexão com banco de dados
  try {
    const dbStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStartTime;

    // Detecta provider do banco pela URL
    let dbProvider = "unknown";
    if (env.DATABASE_URL) {
      if (env.DATABASE_URL.startsWith("mysql://")) {
        dbProvider = "MySQL";
      } else if (env.DATABASE_URL.startsWith("postgresql://")) {
        dbProvider = "PostgreSQL";
      } else if (env.DATABASE_URL.startsWith("file:")) {
        dbProvider = "SQLite";
      }
    }

    health.database = {
      status: "connected",
      responseTime: dbResponseTime,
      provider: dbProvider,
    };
  } catch (error: any) {
    health.success = false;
    health.status = "degraded";
    errors.push(`Database: ${error.message || "Connection failed"}`);
    health.database = {
      status: "disconnected",
    };
  }

  // Informações de memória
  try {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);

    health.memory = {
      used: Math.round(usedMemory / 1024 / 1024), // MB
      total: Math.round(totalMemory / 1024 / 1024), // MB
      percentage: memoryPercentage,
    };

    // Alerta se uso de memória estiver muito alto
    if (memoryPercentage > 90) {
      errors.push("High memory usage detected");
      health.status = "warning";
    }
  } catch (error: any) {
    errors.push(`Memory check failed: ${error.message}`);
  }

  // Adiciona erros se houver
  if (errors.length > 0) {
    health.errors = errors;
  }

  // Log do health check
  const responseTime = Date.now() - startTime;
  if (health.success && health.status === "ok") {
    logger.debug("Health check passed", { responseTime, ...health });
  } else {
    logger.warn("Health check failed or degraded", { responseTime, ...health });
  }

  // Retorna status apropriado
  const statusCode = health.success ? 200 : 503;
  res.status(statusCode).json(health);
});

// Rota de métricas (opcional, pode ser protegida com auth em produção)
router.get("/metrics", async (_req: Request, res: Response) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - serverStartTime) / 1000), // segundos
      environment: env.NODE_ENV,
      version: "1.0.0",
      memory: {
        used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024), // MB
        total: Math.round(os.totalmem() / 1024 / 1024), // MB
        free: Math.round(os.freemem() / 1024 / 1024), // MB
        percentage: Math.round(
          ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
        ),
      },
      cpu: {
        loadAverage: os.loadavg(),
        cores: os.cpus().length,
      },
      platform: {
        type: os.type(),
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
      },
      database: {
        provider: env.DATABASE_URL
          ? env.DATABASE_URL.startsWith("mysql://")
            ? "MySQL"
            : env.DATABASE_URL.startsWith("postgresql://")
            ? "PostgreSQL"
            : env.DATABASE_URL.startsWith("file:")
            ? "SQLite"
            : "unknown"
          : "not configured",
      },
    };

    res.json({
      success: true,
      metrics,
    });
  } catch (error: any) {
    logger.error("Error getting metrics", { error: error.message });
    res.status(500).json({
      success: false,
      error: {
        message: "Error retrieving metrics",
      },
    });
  }
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
