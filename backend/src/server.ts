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
import logger from "./config/logger";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

// Cria a aplicação Express
const app: Application = express();

// Trust Proxy - IMPORTANTE: Permite que Express confie no proxy (NGINX)
// Isso faz com que req.ip retorne o IP real do cliente ao invés do IP do proxy
// Configurado para confiar em 1 proxy (NGINX entre cliente e servidor)
app.set('trust proxy', 1);

// Função helper para extrair IP real do cliente
// Prioriza X-Forwarded-For (primeiro IP da lista), depois X-Real-IP, depois req.ip
function getClientIP(req: express.Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    // X-Forwarded-For pode ter múltiplos IPs: "client, proxy1, proxy2"
    // O primeiro é sempre o IP do cliente original
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : forwarded[0];
    if (ip) return ip;
  }
  
  const realIP = req.headers['x-real-ip'];
  if (realIP && typeof realIP === 'string') {
    return realIP.trim();
  }
  
  // req.ip já retorna o IP real quando trust proxy está configurado
  return req.ip || req.socket.remoteAddress || 'unknown';
}

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
// Lista de origens permitidas
const defaultAllowedOrigins = [
  "https://luanova.cloud",
  "https://www.luanova.cloud",
  "https://app.luanova.cloud",
  "http://localhost:3000", // Desenvolvimento local
];

// Origens adicionais do .env (se configuradas)
const envOrigins = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : [];

const allowedOrigins = [...defaultAllowedOrigins, ...envOrigins];

// Em desenvolvimento, adiciona localhost:3000 se não estiver na lista
if (env.NODE_ENV === "development" && !allowedOrigins.includes("http://localhost:3000")) {
  allowedOrigins.push("http://localhost:3000");
}

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // 👉 Sem Origin? (NGINX, curl, mobile, PM2 healthcheck) — PERMITIR
      // Isso é necessário porque o NGINX não envia Origin nas requisições proxy
      if (!origin) {
        return callback(null, true);
      }

      // 👉 Validar Origin quando existir
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Origin não permitida
      logger.warn(`❌ Origin bloqueada: ${origin}`, {
        origin,
        allowedOrigins,
      });
      return callback(new Error("Origin não permitida"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate Limiting - Configuração geral para rotas da API (exceto auth)
// Rotas de auth têm seu próprio rate limiting mais específico
const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS
    ? parseInt(env.RATE_LIMIT_WINDOW_MS)
    : 15 * 60 * 1000, // 15 minutos padrão
  max: env.RATE_LIMIT_MAX_REQUESTS
    ? parseInt(env.RATE_LIMIT_MAX_REQUESTS)
    : env.NODE_ENV === "production"
    ? 200 // 200 requisições em 15min em produção (aumentado para múltiplos dispositivos)
    : 1000, // 1000 requisições em desenvolvimento
  message: {
    success: false,
    error: {
      message: "Muitas requisições deste IP, tente novamente mais tarde.",
    },
  },
  standardHeaders: true, // Retorna rate limit info nos headers (X-RateLimit-*)
  legacyHeaders: false,
  headers: true,
  // Usa função helper para obter IP real do cliente
  keyGenerator: (req) => {
    return getClientIP(req);
  },
  // Handler customizado para quando o limite é excedido
  handler: (req, res) => {
    const clientIP = getClientIP(req);
    logger.warn(`Rate limit excedido para IP: ${clientIP}`, {
      ip: clientIP,
      url: req.originalUrl,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      error: {
        message: "Muitas requisições deste IP, tente novamente mais tarde.",
        retryAfter: Math.ceil(
          (env.RATE_LIMIT_WINDOW_MS
            ? parseInt(env.RATE_LIMIT_WINDOW_MS)
            : 15 * 60 * 1000) / 1000
        ),
      },
    });
  },
  // Pula rate limiting em rotas de auth (elas têm seu próprio)
  skip: (req) => {
    return req.path.startsWith('/api/auth');
  },
});

// Aplica rate limiting geral em todas as rotas da API (exceto auth)
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

// Middleware de logging de requisições HTTP
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`;
    const clientIP = getClientIP(req);

    if (res.statusCode >= 500) {
      logger.error(message, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        ip: clientIP,
        userAgent: req.get("user-agent"),
      });
    } else if (res.statusCode >= 400) {
      logger.warn(message, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        ip: clientIP,
      });
    } else {
      logger.http(message, {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        ip: clientIP,
      });
    }
  });

  next();
});

app.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`📡 Ambiente: ${env.NODE_ENV}`);
  logger.info(`🔗 API disponível em: http://localhost:${PORT}/api`);
});
