import { Router } from 'express';
import * as extensionFeedbackController from '../controllers/extensionFeedbackController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// GET /api/extensions/:extensionId/feedback - Lista feedbacks de uma extensão
router.get('/:extensionId/feedback', extensionFeedbackController.listFeedbacks);

export default router;

