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
  // DATABASE_URL é obrigatório em produção e deve ser MySQL
  DATABASE_URL: z
    .string()
    .url()
    .optional()
    .refine(
      (val) => {
        const nodeEnv = process.env.NODE_ENV || "development";
        
        // Em produção, DATABASE_URL é obrigatório
        if (nodeEnv === "production" && !val) {
          return false;
        }
        return true;
      },
      {
        message: "DATABASE_URL é obrigatório em produção",
      }
    )
    .refine(
      (val) => {
        const nodeEnv = process.env.NODE_ENV || "development";
        
        // Em produção, não permite SQLite (apenas MySQL/PostgreSQL)
        if (nodeEnv === "production" && val) {
          const isSQLite = val.startsWith("file:") || val.includes("sqlite");
          if (isSQLite) {
            return false;
          }
        }
        return true;
      },
      {
        message:
          "Em produção, DATABASE_URL deve ser MySQL ou PostgreSQL. SQLite não é permitido em produção.",
      }
    ),
  JWT_SECRET: z.string().min(32, "JWT_SECRET deve ter pelo menos 32 caracteres"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET deve ter pelo menos 32 caracteres"),
  // CORS origins (opcional, padrão permite todas em dev)
  CORS_ORIGINS: z.string().optional(),
  // Rate limiting (opcional)
  RATE_LIMIT_WINDOW_MS: z.string().optional(),
  RATE_LIMIT_MAX_REQUESTS: z.string().optional(),
  // Webhook secret (opcional, usado para validar webhooks)
  WEBHOOK_SECRET: z.string().optional(),
  // Caminhos dos projetos para deploy automático
  BACKEND_PATH: z.string().default("/var/www/luanova/backend"),
  FRONTEND_PATH: z.string().default("/var/www/luanova/web"),
  // Branch que deve fazer deploy automático (padrão: prod)
  DEPLOY_BRANCH: z.string().default("prod"),
});

// Valida e exporta as variáveis de ambiente tipadas
const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Erro na validação das variáveis de ambiente:");
  console.error(result.error.format());
  
  // Mensagens de erro mais claras para DATABASE_URL
  const errors = result.error.errors;
  errors.forEach((error) => {
    if (error.path.includes("DATABASE_URL")) {
      if (error.message.includes("obrigatório")) {
        console.error("\n⚠️  DATABASE_URL é OBRIGATÓRIO em produção!");
        console.error("   Configure no arquivo .env:");
        console.error('   DATABASE_URL="mysql://usuario:senha@host:porta/database"');
      } else if (error.message.includes("SQLite")) {
        console.error("\n⚠️  SQLite NÃO é permitido em produção!");
        console.error("   Use MySQL ou PostgreSQL:");
        console.error('   DATABASE_URL="mysql://usuario:senha@host:porta/database"');
        console.error('   ou');
        console.error('   DATABASE_URL="postgresql://usuario:senha@host:porta/database"');
      }
    }
  });
  
  process.exit(1);
}

const env = result.data;

export default env;

