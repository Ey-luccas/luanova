/**
 * Servidor principal da API
 *
 * Este arquivo inicializa o servidor Express e configura
 * todas as rotas e middlewares necessários.
 */

import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import env from "./config/env";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

// Cria a aplicação Express
const app: Application = express();

// Helmet - Headers de segurança
app.use(helmet());

// CORS - Configuração de origens permitidas
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Em desenvolvimento, permite todas as origens ou sem origem (Postman, etc)
    if (env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // Em produção, apenas origens permitidas
    // Origens padrão permitidas: luanova.cloud (com e sem www)
    const defaultAllowedOrigins = [
      "https://luanova.cloud",
      "https://www.luanova.cloud",
    ];

    // Origens adicionais do .env (se configuradas)
    const envOrigins = env.CORS_ORIGINS
      ? env.CORS_ORIGINS.split(",").map((o) => o.trim())
      : [];

    const allowedOrigins = [...defaultAllowedOrigins, ...envOrigins];

    // Se não há origin (requisições do mesmo servidor, Postman, etc), negar em produção
    if (!origin) {
      return callback(new Error("Origin não fornecida"), false);
    }

    // Verifica se a origin está na lista de permitidas
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS bloqueado: ${origin} não está na lista de origens permitidas`);
      callback(new Error(`Não permitido pelo CORS. Origin: ${origin}`), false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Rate Limiting
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS ? parseInt(env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000, // 15 minutos padrão
  max: env.RATE_LIMIT_MAX_REQUESTS ? parseInt(env.RATE_LIMIT_MAX_REQUESTS) : 100, // 100 requisições padrão
  message: {
    success: false,
    error: {
      message: "Muitas requisições deste IP, tente novamente mais tarde.",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", limiter);

// Middlewares globais
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Servir arquivos estáticos (logos)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rotas
app.use("/api", routes);

// Rota padrão
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Lua Nova API",
    version: "1.0.0",
    developer: "Lualabs",
  });
});

// Middleware de tratamento de erros (deve ser o último)
app.use(errorHandler);

// Inicia o servidor
const PORT = env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 Ambiente: ${env.NODE_ENV}`);
  console.log(`🔗 API disponível em: http://localhost:${PORT}/api`);
});
