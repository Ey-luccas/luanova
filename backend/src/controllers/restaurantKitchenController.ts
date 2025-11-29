/**
 * Controller para tela da cozinha (KDS)
 */

import { Request, Response } from 'express';
import * as restaurantKitchenService from '../services/restaurantKitchenService';

export async function getKitchenOrders(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    const filters: any = {};
    if (req.query.category) filters.category = req.query.category as string;
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

    const result = await restaurantKitchenService.getKitchenOrders(companyId, filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Erro ao buscar pedidos da cozinha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pedidos da cozinha',
    });
  }
}

export async function updateKitchenItemStatus(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const itemId = parseInt(req.params.itemId, 10);
    const { status } = req.body;

    if (isNaN(companyId) || isNaN(itemId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    if (!['PREPARING', 'READY', 'DELIVERED'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Status inválido',
      });
      return;
    }

    const item = await restaurantKitchenService.updateKitchenItemStatus(
      companyId,
      itemId,
      status,
    );

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    if (error.message === 'Item não encontrado') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao atualizar status do item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status do item',
    });
  }
}

export async function getKitchenMetrics(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : undefined;
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : undefined;

    const metrics = await restaurantKitchenService.getKitchenMetrics(
      companyId,
      startDate,
      endDate,
    );

    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    console.error('Erro ao buscar métricas da cozinha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar métricas da cozinha',
    });
  }
}

