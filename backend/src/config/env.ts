/**
 * Configuração e validação de variáveis de ambiente
 * 
 * Este arquivo valida todas as variáveis de ambiente necessárias
 * usando Zod para garantir type-safety.
 */

import { z } from "zod";
import dotenv from "dotenv";

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Schema de validação das variáveis de ambiente
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3001"),
  DATABASE_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET deve ter pelo menos 32 caracteres"),
});

// Valida e exporta as variáveis de ambiente tipadas
// Usa safeParse para não quebrar se faltar DATABASE_URL (útil para desenvolvimento inicial)
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Erro na validação das variáveis de ambiente:");
  console.error(result.error.format());
  process.exit(1);
}

const env = result.data;

export default env;

