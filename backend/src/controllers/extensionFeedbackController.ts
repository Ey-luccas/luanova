import { Request, Response } from 'express';
import * as extensionFeedbackService from '../services/extensionFeedbackService';
import * as extensionSchema from '../schemas/extensionSchema';

export async function createFeedback(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Não autenticado' });
      return;
    }

    const validatedData = extensionSchema.createFeedbackSchema.parse(req.body);

    const feedback = await extensionFeedbackService.createFeedback(
      req.user.id,
      validatedData as { companyExtensionId: number; rating?: number; comment?: string; suggestions?: string; },
    );

    res.status(201).json({ success: true, data: feedback });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: error.errors,
      });
      return;
    }
    if (
      error.message === 'Extensão não encontrada' ||
      error.message === 'Você não tem acesso a esta empresa'
    ) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao criar feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar feedback',
    });
  }
}

export async function listFeedbacks(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const extensionId = parseInt(req.params.extensionId, 10);

    if (isNaN(extensionId)) {
      res.status(400).json({
        success: false,
        message: 'ID da extensão inválido',
      });
      return;
    }

    const feedbacks = await extensionFeedbackService.listFeedbacks(extensionId);

    res.status(200).json({ success: true, data: feedbacks });
  } catch (error: any) {
    console.error('Erro ao listar feedbacks:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar feedbacks',
    });
  }
}

export async function getUserFeedback(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Não autenticado' });
      return;
    }

    const companyExtensionId = parseInt(req.params.companyExtensionId, 10);

    if (isNaN(companyExtensionId)) {
      res.status(400).json({
        success: false,
        message: 'ID inválido',
      });
      return;
    }

    const feedback = await extensionFeedbackService.getUserFeedback(
      req.user.id,
      companyExtensionId,
    );

    res.status(200).json({ success: true, data: feedback });
  } catch (error: any) {
    console.error('Erro ao buscar feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar feedback',
    });
  }
}

