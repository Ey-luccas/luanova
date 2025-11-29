/**
 * Rotas de extensões
 */

import { Router } from 'express';
import * as extensionController from '../controllers/extensionController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

router.use(authMiddleware);

/**
 * GET /api/extensions
 * Lista todas as extensões disponíveis
 */
router.get('/', extensionController.listExtensions);

export default router;

