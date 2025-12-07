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
// Configuração completa para proteção contra XSS, clickjacking, etc.
app.use(
  helmet({
    // Content Security Policy - Previne XSS
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // Permite estilos inline se necessário
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"], // Permite imagens de qualquer origem HTTPS
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"], // Previne clickjacking
      },
    },
    // X-Content-Type-Options - Previne MIME type sniffing
    noSniff: true,
    // X-Frame-Options - Previne clickjacking (redundante com CSP, mas mantém compatibilidade)
    frameguard: {
      action: "deny",
    },
    // X-XSS-Protection - Ativa proteção XSS do navegador
    xssFilter: true,
    // Referrer-Policy - Controla informações de referrer
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin",
    },
    // HSTS - HTTP Strict Transport Security (apenas em produção com HTTPS)
    hsts: env.NODE_ENV === "production"
      ? {
          maxAge: 31536000, // 1 ano
          includeSubDomains: true,
          preload: true,
        }
      : false,
    // Desabilita alguns headers que não são necessários para API REST
    crossOriginEmbedderPolicy: false, // Pode causar problemas com CORS
    crossOriginOpenerPolicy: false, // Pode causar problemas com CORS
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Permite recursos de outras origens
  })
);

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

// Rate Limiting - Configuração geral para todas as rotas
const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS
    ? parseInt(env.RATE_LIMIT_WINDOW_MS)
    : 15 * 60 * 1000, // 15 minutos padrão
  max: env.RATE_LIMIT_MAX_REQUESTS
    ? parseInt(env.RATE_LIMIT_MAX_REQUESTS)
    : env.NODE_ENV === "production"
    ? 100 // 100 requisições em produção
    : 1000, // 1000 requisições em desenvolvimento
  message: {
    success: false,
    error: {
      message: "Muitas requisições deste IP, tente novamente mais tarde.",
    },
  },
  standardHeaders: true, // Retorna rate limit info nos headers
  legacyHeaders: false,
  // Headers informativos
  headers: true,
  // Função para obter o IP do cliente (importante para proxies)
  keyGenerator: (req) => {
    // Tenta obter IP real mesmo atrás de proxy
    return (
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      (req.headers["x-real-ip"] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      "unknown"
    );
  },
  // Handler customizado para quando o limite é excedido
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: "Muitas requisições deste IP, tente novamente mais tarde.",
        retryAfter: Math.ceil(
          (env.RATE_LIMIT_WINDOW_MS
            ? parseInt(env.RATE_LIMIT_WINDOW_MS)
            : 15 * 60 * 1000) / 1000
        ), // Segundos até poder tentar novamente
      },
    });
  },
});

// Aplica rate limiting geral em todas as rotas da API
app.use("/api", generalLimiter);

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
