/**
 * Controller para garçons
 */

import { Request, Response } from 'express';
import * as restaurantWaiterService from '../services/restaurantWaiterService';

export async function listWaiters(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    const waiters = await restaurantWaiterService.listWaiters(companyId);

    res.status(200).json({
      success: true,
      data: waiters,
    });
  } catch (error: any) {
    console.error('Erro ao listar garçons:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar garçons',
    });
  }
}

export async function getWaiterById(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const waiterId = parseInt(req.params.waiterId, 10);

    if (isNaN(companyId) || isNaN(waiterId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const waiter = await restaurantWaiterService.getWaiterById(companyId, waiterId);

    if (!waiter) {
      res.status(404).json({
        success: false,
        message: 'Garçom não encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: waiter,
    });
  } catch (error: any) {
    console.error('Erro ao buscar garçom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar garçom',
    });
  }
}

export async function createWaiter(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    const waiter = await restaurantWaiterService.createWaiter(companyId, req.body);

    res.status(201).json({
      success: true,
      data: waiter,
    });
  } catch (error: any) {
    if (error.message === 'Já existe um garçom com este código') {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao criar garçom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar garçom',
    });
  }
}

export async function updateWaiter(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const waiterId = parseInt(req.params.waiterId, 10);

    if (isNaN(companyId) || isNaN(waiterId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const waiter = await restaurantWaiterService.updateWaiter(
      companyId,
      waiterId,
      req.body,
    );

    res.status(200).json({
      success: true,
      data: waiter,
    });
  } catch (error: any) {
    if (
      error.message === 'Garçom não encontrado' ||
      error.message === 'Já existe um garçom com este código'
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao atualizar garçom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar garçom',
    });
  }
}

export async function deleteWaiter(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const waiterId = parseInt(req.params.waiterId, 10);

    if (isNaN(companyId) || isNaN(waiterId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    await restaurantWaiterService.deleteWaiter(companyId, waiterId);

    res.status(200).json({
      success: true,
      message: 'Garçom removido com sucesso',
    });
  } catch (error: any) {
    if (
      error.message === 'Garçom não encontrado' ||
      error.message.includes('pedidos em aberto')
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao remover garçom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover garçom',
    });
  }
}

