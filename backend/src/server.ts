/**
 * Servidor principal da API
 *
 * Este arquivo inicializa o servidor Express e configura
 * todas as rotas e middlewares necessários.
 */

import express, { Application } from "express";
import cors from "cors";
import path from "path";
import env from "./config/env";
import routes from "./routes";
import { errorHandler } from "./middlewares/errorHandler";

// Cria a aplicação Express
const app: Application = express();

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
