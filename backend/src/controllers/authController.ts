/**
 * Controller de autenticação
 *
 * Responsável por receber requisições HTTP,
 * chamar os services apropriados e retornar respostas padronizadas.
 */

import { Request, Response } from "express";
import * as authService from "../services/authService";
import * as authSchema from "../schemas/authSchema";
import { uploadAvatar as uploadAvatarMiddleware } from "../middlewares/uploadMiddleware";

/**
 * Registra um novo usuário
 * POST /api/auth/register
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    // Valida o body da requisição
    const { body } = authSchema.registerSchema.parse({ body: req.body });

    // Registra o usuário
    const user = await authService.registerUser(
      body.email,
      body.name,
      body.password
    );

    // Resposta de sucesso
    res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso",
      data: {
        user,
      },
    });
  } catch (error: any) {
    // Tratamento de erros
    if (error.message === "Email já cadastrado") {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Erro ao criar usuário",
    });
  }
}

/**
 * Autentica usuário e retorna tokens
 * POST /api/auth/login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    // Valida o body da requisição
    const { body } = authSchema.loginSchema.parse({ body: req.body });

    // Autentica o usuário
    const { user, tokens } = await authService.loginUser(
      body.email,
      body.password
    );

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Login realizado com sucesso",
      data: {
        user,
        tokens,
      },
    });
  } catch (error: any) {
    // Tratamento de erros
    if (
      error.message === "Email ou senha inválidos" ||
      error.message === "Usuário não encontrado"
    ) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Erro ao fazer login",
    });
  }
}

/**
 * Busca perfil do usuário logado
 * GET /api/auth/me
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    const user = await authService.getUserById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Erro ao buscar perfil",
    });
  }
}

/**
 * Atualiza perfil do usuário logado
 * PUT /api/auth/profile
 */
export async function updateProfile(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    const { body } = authSchema.updateProfileSchema.parse({ body: req.body });

    const user = await authService.updateUserProfile(req.user.id, body);

    res.status(200).json({
      success: true,
      message: "Perfil atualizado com sucesso",
      data: {
        user,
      },
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Erro ao atualizar perfil",
    });
  }
}

/**
 * Upload de avatar do usuário
 * POST /api/auth/avatar
 */
export async function uploadAvatar(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Nenhum arquivo enviado",
      });
      return;
    }

    // Gera a URL do avatar
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Atualiza o usuário com a URL do avatar
    const user = await authService.updateUserProfile(req.user.id, {
      avatarUrl,
    });

    res.status(200).json({
      success: true,
      message: "Avatar atualizado com sucesso",
      data: {
        user,
        avatarUrl,
      },
    });
  } catch (error: any) {
    if (error.message === "Apenas arquivos de imagem são permitidos") {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("Erro ao fazer upload do avatar:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao fazer upload do avatar",
    });
  }
}

/**
 * Renova tokens usando refresh token
 * POST /api/auth/refresh
 */
export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    // Valida o body da requisição
    const { body } = authSchema.refreshSchema.parse({ body: req.body });

    // Renova os tokens
    const tokens = await authService.refreshTokens(body.refreshToken);

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Tokens renovados com sucesso",
      data: {
        tokens,
      },
    });
  } catch (error: any) {
    // Tratamento de erros
    if (
      error.message === "Refresh token inválido ou expirado" ||
      error.message === "Refresh token inválido" ||
      error.message === "Usuário não encontrado"
    ) {
      res.status(401).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Erro ao renovar tokens",
    });
  }
}
