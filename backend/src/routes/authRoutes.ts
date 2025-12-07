/**
 * Rotas de autenticação
 *
 * Define todas as rotas relacionadas à autenticação.
 */

import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { uploadAvatar as uploadAvatarMiddleware } from "../middlewares/uploadMiddleware";

const router = Router();

// Rate Limiting mais restritivo para rotas de autenticação
// Previne ataques de força bruta em login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "production" ? 5 : 20, // 5 tentativas em produção, 20 em dev
  message: {
    success: false,
    error: {
      message:
        "Muitas tentativas de autenticação. Tente novamente em 15 minutos.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (req.headers["x-real-ip"] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown"
    );
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message:
          "Muitas tentativas de autenticação. Tente novamente em 15 minutos.",
        retryAfter: 900, // 15 minutos em segundos
      },
    });
  },
});

/**
 * POST /api/auth/register
 * Registra um novo usuário
 */
router.post("/register", authLimiter, authController.register);

/**
 * POST /api/auth/login
 * Autentica usuário e retorna tokens
 */
router.post("/login", authLimiter, authController.login);

/**
 * POST /api/auth/refresh
 * Renova access token usando refresh token
 */
router.post("/refresh", authController.refresh);

/**
 * GET /api/auth/me
 * Busca perfil do usuário logado
 */
router.get("/me", authMiddleware, authController.getProfile);

/**
 * PUT /api/auth/profile
 * Atualiza perfil do usuário logado
 */
router.put("/profile", authMiddleware, authController.updateProfile);

/**
 * POST /api/auth/avatar
 * Faz upload do avatar do usuário
 */
router.post(
  "/avatar",
  authMiddleware,
  uploadAvatarMiddleware.single("avatar"),
  authController.uploadAvatar
);

export default router;
