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
  // DATABASE_URL é obrigatório em produção
  DATABASE_URL: z
    .string()
    .url()
    .optional()
    .refine(
      (val) => {
        // Em produção, DATABASE_URL é obrigatório
        if (process.env.NODE_ENV === "production" && !val) {
          return false;
        }
        return true;
      },
      {
        message: "DATABASE_URL é obrigatório em produção",
      }
    ),
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET deve ter pelo menos 32 caracteres"),
  // CORS origins (opcional, padrão permite todas em dev)
  CORS_ORIGINS: z.string().optional(),
  // Rate limiting (opcional)
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_MAX_REQUESTS: z.string().optional(),
});

// Valida e exporta as variáveis de ambiente tipadas
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Erro na validação das variáveis de ambiente:");
  console.error(result.error.format());
  process.exit(1);
}

const env = result.data;

export default env;

