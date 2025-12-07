/**
 * Configuração do sistema de logs com Winston
 * 
 * Sistema de logs estruturado para desenvolvimento e produção
 * com rotação de arquivos e diferentes níveis de log.
 */

import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";
import fs from "fs";
import env from "./env";

// Cria diretório de logs se não existir
const logsDir = path.join(__dirname, "../../logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define níveis de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define cores para cada nível
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Adiciona cores ao Winston
winston.addColors(colors);

// Define formato de log
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para console (mais legível)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let msg = `${timestamp} [${level}]: ${message}`;
    
    // Adiciona metadados se existirem
    if (Object.keys(meta).length > 0 && meta.stack) {
      msg += `\n${meta.stack}`;
    } else if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    
    return msg;
  })
);

// Transportes (destinos dos logs)
const transports: winston.transport[] = [
  // Console - sempre ativo
  new winston.transports.Console({
    format: consoleFormat,
    level: env.NODE_ENV === "production" ? "info" : "debug",
  }),

  // Arquivo de erros - apenas erros
  new DailyRotateFile({
    filename: path.join(logsDir, "error-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    level: "error",
    format,
    maxSize: "20m",
    maxFiles: "14d", // Mantém 14 dias de logs
    zippedArchive: true,
  }),

  // Arquivo de todos os logs
  new DailyRotateFile({
    filename: path.join(logsDir, "combined-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    format,
    maxSize: "20m",
    maxFiles: "14d", // Mantém 14 dias de logs
    zippedArchive: true,
  }),
];

// Cria o logger
const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  levels,
  format,
  transports,
  // Não encerra o processo em caso de erro
  exitOnError: false,
});

export default logger;

