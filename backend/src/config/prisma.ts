/**
 * Configuração do Prisma Client
 * 
 * Este arquivo exporta uma instância única do Prisma Client
 * para ser utilizada em toda a aplicação (singleton pattern).
 */

import { PrismaClient } from "@prisma/client";

// Instância única do Prisma Client
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

// Desconecta do banco ao encerrar a aplicação
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;

