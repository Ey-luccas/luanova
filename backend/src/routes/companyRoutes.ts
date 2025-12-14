/**
 * Rotas de empresas
 *
 * Define todas as rotas relacionadas a empresas.
 * Todas as rotas requerem autenticação.
 */

import { Router } from "express";
import * as companyController from "../controllers/companyController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { companyAccessMiddleware } from "../middlewares/companyAccessMiddleware";
import { uploadLogo } from "../middlewares/uploadMiddleware";
import multer from "multer";

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rotas que usam :id precisam verificar acesso (exceto POST / e GET /)
// Aplicamos o middleware apenas nas rotas específicas que usam :id

/**
 * POST /api/companies
 * Cria uma nova empresa e vincula o usuário como ADMIN (owner)
 */
router.post("/", companyController.createCompany);

/**
 * GET /api/companies
 * Lista todas as empresas do usuário logado
 */
router.get("/", companyController.listCompanies);

/**
 * GET /api/companies/:id
 * Busca uma empresa por ID (apenas se o usuário tiver acesso)
 */
router.get("/:id", companyAccessMiddleware, companyController.getCompanyById);

/**
 * GET /api/companies/:id/dashboard
 * Busca dados do dashboard de uma empresa
 */
router.get(
  "/:id/dashboard",
  companyAccessMiddleware,
  companyController.getDashboard
);

/**
 * PUT /api/companies/:id
 * Atualiza uma empresa (apenas se o usuário tiver acesso)
 */
router.put("/:id", companyAccessMiddleware, companyController.updateCompany);

/**
 * PATCH /api/companies/:id
 * Atualiza parcialmente uma empresa (apenas se o usuário tiver acesso)
 */
router.patch("/:id", companyAccessMiddleware, companyController.updateCompany);

/**
 * POST /api/companies/:id/logo
 * Faz upload do logo da empresa
 */
router.post(
  "/:id/logo",
  companyAccessMiddleware,
  uploadLogo.single("logo"),
  companyController.uploadCompanyLogo
);

/**
 * GET /api/companies/:id/backup
 * Gera CSV de backup das movimentações
 */
router.get(
  "/:id/backup",
  companyAccessMiddleware,
  companyController.downloadCompanyBackup
);

/**
 * DELETE /api/companies/:id
 * Exclui uma empresa permanentemente
 */
router.delete("/:id", companyAccessMiddleware, companyController.deleteCompany);

/**
 * POST /api/companies/restore
 * Restaura empresa a partir de CSV de backup
 */
const uploadCSV = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos CSV são permitidos"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

router.post(
  "/restore",
  uploadCSV.single("csv"),
  companyController.restoreCompany
);

export default router;
