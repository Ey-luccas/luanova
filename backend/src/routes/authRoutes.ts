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

/**
 * Função helper para extrair IP real do cliente
 * Mesma lógica do server.ts para consistência
 */
function getClientIP(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
    if (ip) return ip;
  }
  
  const realIP = req.headers['x-real-ip'];
  if (realIP && typeof realIP === 'string') {
    return realIP.trim();
  }
  
  return req.ip || req.socket.remoteAddress || 'unknown';
}

// Rate Limiting para rotas de autenticação
// Limite mais permissivo em produção para suportar múltiplos dispositivos
// Ainda previne ataques de força bruta, mas permite uso normal
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "production" 
    ? 20 // 20 tentativas em produção (aumentado de 5 para suportar múltiplos dispositivos)
    : 50, // 50 em desenvolvimento
  message: {
    success: false,
    error: {
      message: "Muitas tentativas de autenticação. Tente novamente em 15 minutos.",
    },
  },
  standardHeaders: true, // Retorna X-RateLimit-* headers
  legacyHeaders: false,
  // Usa função helper para obter IP real
  keyGenerator: (req) => {
    return getClientIP(req);
  },
  handler: (req, res) => {
    const clientIP = getClientIP(req);
    console.warn(`[Auth Rate Limit] Limite excedido para IP: ${clientIP}`, {
      ip: clientIP,
      url: req.originalUrl,
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: "Muitas tentativas de autenticação. Tente novamente em 15 minutos.",
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
