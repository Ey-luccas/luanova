/**
 * Controller de Relatórios
 *
 * Responsável por receber requisições HTTP relacionadas a relatórios,
 * chamar os services apropriados e retornar respostas padronizadas.
 */

import { Request, Response } from "express";
import * as reportService from "../services/reportService";
import * as pdfService from "../services/pdfService";
import { z } from "zod";

// Schema de validação para parâmetros de relatório
const reportParamsSchema = z.object({
  params: z.object({
    companyId: z.string().regex(/^\d+$/, "companyId deve ser um número"),
  }),
  query: z.object({
    startDate: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "startDate deve estar no formato YYYY-MM-DD"
      ),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "endDate deve estar no formato YYYY-MM-DD"),
    periodType: z.enum(["day", "week", "month", "year"]).optional(),
  }),
});

/**
 * GET /api/companies/:companyId/reports
 * Busca dados agregados para relatórios
 */
export async function getReportData(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida parâmetros
    const { params, query } = reportParamsSchema.parse({
      params: req.params,
      query: req.query,
    });

    const companyId = parseInt(params.companyId, 10);
    const periodType = (query.periodType || "month") as
      | "day"
      | "week"
      | "month"
      | "year";

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Busca dados do relatório
    const reportData = await reportService.getReportData(
      req.user.id,
      companyId,
      query.startDate,
      query.endDate,
      periodType
    );

    // Resposta de sucesso
    res.status(200).json({
      success: true,
      message: "Relatório gerado com sucesso",
      data: reportData,
    });
  } catch (error: any) {
    // Tratamento de erros
    if (error.message === "Empresa não encontrada ou você não tem acesso") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.name === "ZodError") {
      console.error("[getReportData] Erro de validação Zod:", error.errors);
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }

    console.error("[getReportData] Erro não tratado:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar relatório",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * GET /api/companies/:companyId/reports/download
 * Gera e baixa relatório em PDF
 */
export async function downloadReport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    // Valida parâmetros
    const { params, query } = reportParamsSchema
      .extend({
        query: z.object({
          startDate: z
            .string()
            .regex(
              /^\d{4}-\d{2}-\d{2}$/,
              "startDate deve estar no formato YYYY-MM-DD"
            ),
          endDate: z
            .string()
            .regex(
              /^\d{4}-\d{2}-\d{2}$/,
              "endDate deve estar no formato YYYY-MM-DD"
            ),
          periodType: z.enum(["day", "week", "month", "year"]).optional(),
          reportType: z
            .enum([
              "full",
              "sales",
              "products",
              "services",
              "movements",
              "returns",
              "customers",
              "stock",
            ])
            .optional(),
        }),
      })
      .parse({
        params: req.params,
        query: req.query,
      });

    const companyId = parseInt(params.companyId, 10);
    const periodType = (query.periodType || "month") as
      | "day"
      | "week"
      | "month"
      | "year";
    const reportType = query.reportType || "full";

    // Verifica se o usuário está autenticado
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
      return;
    }

    // Busca dados do relatório
    const reportData = await reportService.getReportData(
      req.user.id,
      companyId,
      query.startDate,
      query.endDate,
      periodType
    );

    // Gera PDF
    const pdfBuffer = await pdfService.generateReportPDF(
      reportData,
      reportType
    );

    // Define headers para download de PDF
    const periodLabel =
      periodType === "day"
        ? "dia"
        : periodType === "week"
          ? "semana"
          : periodType === "month"
            ? "mes"
            : "ano";
    const filename = `relatorio-${reportType}-${periodLabel}-${query.startDate}-${query.endDate}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);

    // Envia o PDF
    res.status(200).send(pdfBuffer);
  } catch (error: any) {
    // Tratamento de erros
    if (error.message === "Empresa não encontrada ou você não tem acesso") {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.name === "ZodError") {
      console.error("[downloadReport] Erro de validação Zod:", error.errors);
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }

    console.error("[downloadReport] Erro não tratado:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao gerar relatório",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}
