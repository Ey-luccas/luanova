/**
 * Service de autenticação
 *
 * Contém a lógica de negócio para autenticação:
 * - Hash de senhas
 * - Geração de tokens JWT
 * - Validação de credenciais
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma";
import env from "../config/env";

// Tipos para tokens
export interface TokenPayload {
  userId: number;
  email: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Configurações de tokens
const ACCESS_TOKEN_EXPIRES_IN = "15m"; // 15 minutos
const REFRESH_TOKEN_EXPIRES_IN = "7d"; // 7 dias

/**
 * Gera hash da senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compara senha com hash
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Gera access token JWT
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

/**
 * Gera refresh token JWT
 */
export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

/**
 * Verifica e decodifica access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error("Token inválido ou expirado");
  }
}

/**
 * Verifica e decodifica refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error("Refresh token inválido ou expirado");
  }
}

/**
 * Registra um novo usuário
 */
export async function registerUser(
  email: string,
  name: string,
  password: string
) {
  // Verifica se o email já existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email já cadastrado");
  }

  // Hash da senha
  const hashedPassword = await hashPassword(password);

  // Cria o usuário
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  return user;
}

/**
 * Autentica usuário e gera tokens
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: any; tokens: AuthTokens }> {
  // Busca o usuário
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("Email ou senha inválidos");
  }

  // Verifica a senha
  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Email ou senha inválidos");
  }

  // Gera tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Salva o refresh token no banco
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  // Retorna usuário (sem senha) e tokens
  const { password: _, refreshToken: __, ...userWithoutSensitiveData } = user;

  return {
    user: userWithoutSensitiveData,
    tokens: {
      accessToken,
      refreshToken,
    },
  };
}

/**
 * Renova tokens usando refresh token
 */
export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  // Verifica o refresh token
  const payload = verifyRefreshToken(refreshToken);

  // Busca o usuário e verifica se o refresh token está salvo
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new Error("Usuário não encontrado");
  }

  if (user.refreshToken !== refreshToken) {
    throw new Error("Refresh token inválido");
  }

  // Gera novos tokens
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  // Atualiza o refresh token no banco
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: newRefreshToken },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

/**
 * Busca usuário por ID (para uso no middleware)
 */
export async function getUserById(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}

/**
 * Atualiza perfil do usuário
 */
export async function updateUserProfile(
  userId: number,
  data: {
    name?: string;
    avatarUrl?: string | null;
  }
) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : undefined,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return user;
}
