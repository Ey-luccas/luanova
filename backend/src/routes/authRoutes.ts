/**
 * Rotas de autenticação
 *
 * Define todas as rotas relacionadas à autenticação.
 */

import { Router } from "express";
import * as authController from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { uploadAvatar as uploadAvatarMiddleware } from "../middlewares/uploadMiddleware";

const router = Router();

/**
 * POST /api/auth/register
 * Registra um novo usuário
 */
router.post("/register", authController.register);

/**
 * POST /api/auth/login
 * Autentica usuário e retorna tokens
 */
router.post("/login", authController.login);

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
