/**
 * Middleware de validação Zod MELHORADO
 * 
 * - Logs detalhados para debug
 * - Melhor formatação de erros
 * - Limpeza de query params vazios
 */

import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError } from "zod";

/**
 * Limpa query parameters removendo valores vazios, undefined e null
 * Mantém apenas valores válidos
 */
function cleanQueryParams(query: any): any {
  if (!query || typeof query !== "object") {
    return {};
  }

  const cleaned: any = {};

  for (const [key, value] of Object.entries(query)) {
    // Ignorar valores vazios, undefined, null
    if (value === "" || value === undefined || value === null) {
      continue;
    }

    // Manter apenas valores válidos
    cleaned[key] = value;
  }

  return cleaned;
}

/**
 * Middleware de validação Zod
 * Valida params, query e body usando schemas Zod
 */
export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Log dos dados recebidos (útil para debug)
      console.log("🔍 Validando requisição:", {
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.body ? "[body presente]" : "[sem body]",
      });

      // Limpar query params vazios, undefined ou null
      const cleanedQuery = cleanQueryParams(req.query);

      console.log("🧹 Query limpa:", cleanedQuery);

      // Validar com schema
      const validated = await schema.parseAsync({
        params: req.params,
        query: Object.keys(cleanedQuery).length > 0 ? cleanedQuery : undefined,
        body: req.body,
      });

      console.log("✅ Validação bem-sucedida");

      // Substituir req com dados validados e convertidos
      req.params = validated.params || req.params;
      req.query = validated.query || {};
      req.body = validated.body || req.body;

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("❌ Erro de validação Zod:", error.errors);

        // Formatar erros de forma mais legível
        const formattedErrors = error.errors.map((err) => ({
          campo: err.path.join("."),
          mensagem: err.message,
          valorRecebido:
            err.code === "invalid_type"
              ? `${typeof (err as any).received} (esperado: ${(err as any).expected})`
              : JSON.stringify((err as any).received),
        }));

        return res.status(400).json({
          success: false,
          message: "Dados inválidos",
          errors: formattedErrors,
          rawErrors: error.errors, // Para debug
        });
      }

      console.error("❌ Erro inesperado na validação:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno ao validar requisição",
      });
    }
  };
};

/**
 * Middleware alternativo mais permissivo (usar em desenvolvimento)
 * Tenta validar mas não bloqueia se falhar
 */
export const validateSoft = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cleanedQuery = cleanQueryParams(req.query);

      const validated = await schema.parseAsync({
        params: req.params,
        query: cleanedQuery,
        body: req.body,
      });

      req.params = validated.params || req.params;
      req.query = validated.query || {};
      req.body = validated.body || req.body;
    } catch (error) {
      if (error instanceof ZodError) {
        console.warn("⚠️  Validação falhou mas continuando:", error.errors);
      }
    }

    next();
  };
};

/**
 * Middleware para validar apenas params (sem query ou body)
 * Útil para rotas simples
 */
export const validateParams = (paramsSchema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("🔍 Validando params:", req.params);

      const validated = await paramsSchema.parseAsync(req.params);
      req.params = validated;

      console.log("✅ Params validados:", req.params);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.error("❌ Erro validação params:", error.errors);

        return res.status(400).json({
          success: false,
          message: "Parâmetros inválidos",
          errors: error.errors,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Erro ao validar parâmetros",
      });
    }
  };
};

