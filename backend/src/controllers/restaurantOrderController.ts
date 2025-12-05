/**
 * Controller para comandas e pedidos
 */

import { Request, Response } from 'express';
import * as restaurantOrderService from '../services/restaurantOrderService';

export async function listOrders(req: Request, res: Response): Promise<void> {
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
    if (req.query.tableId) filters.tableId = parseInt(req.query.tableId as string, 10);
    if (req.query.waiterId) filters.waiterId = parseInt(req.query.waiterId as string, 10);
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

    const orders = await restaurantOrderService.listOrders(companyId, filters);

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    console.error('Erro ao listar comandas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar comandas',
    });
  }
}

export async function getOrderById(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const orderId = parseInt(req.params.orderId, 10);

    if (isNaN(companyId) || isNaN(orderId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const order = await restaurantOrderService.getOrderById(companyId, orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        message: 'Comanda não encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    console.error('Erro ao buscar comanda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar comanda',
    });
  }
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    const order = await restaurantOrderService.createOrder(companyId, req.body);

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    if (error.message.includes('não encontrada') || error.message.includes('não encontrado')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao criar comanda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar comanda',
    });
  }
}

export async function addOrderItem(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const orderId = parseInt(req.params.orderId, 10);

    if (isNaN(companyId) || isNaN(orderId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const item = await restaurantOrderService.addOrderItem(
      companyId,
      orderId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    if (
      error.message.includes('não encontrada') ||
      error.message.includes('não encontrado') ||
      error.message.includes('fechada') ||
      error.message.includes('disponível')
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao adicionar item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar item',
    });
  }
}

export async function updateOrderItem(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const orderId = parseInt(req.params.orderId, 10);
    const itemId = parseInt(req.params.itemId, 10);

    if (isNaN(companyId) || isNaN(orderId) || isNaN(itemId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const item = await restaurantOrderService.updateOrderItem(
      companyId,
      orderId,
      itemId,
      req.body,
    );

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    if (error.message.includes('não encontrada') || error.message.includes('não encontrado')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    if (error.message.includes('não é possível')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao atualizar item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar item',
    });
  }
}

export async function removeOrderItem(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const orderId = parseInt(req.params.orderId, 10);
    const itemId = parseInt(req.params.itemId, 10);

    if (isNaN(companyId) || isNaN(orderId) || isNaN(itemId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    await restaurantOrderService.removeOrderItem(companyId, orderId, itemId);

    res.status(200).json({
      success: true,
      message: 'Item removido com sucesso',
    });
  } catch (error: any) {
    if (error.message.includes('não encontrada') || error.message.includes('não encontrado')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    if (error.message.includes('não é possível')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao remover item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover item',
    });
  }
}

export async function sendOrderToKitchen(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const orderId = parseInt(req.params.orderId, 10);

    if (isNaN(companyId) || isNaN(orderId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const order = await restaurantOrderService.sendOrderToKitchen(companyId, orderId);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    if (error.message.includes('não encontrada') || error.message.includes('não há itens')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao enviar para cozinha:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar para cozinha',
    });
  }
}

export async function moveOrderToTable(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const orderId = parseInt(req.params.orderId, 10);
    const { newTableId } = req.body;

    if (isNaN(companyId) || isNaN(orderId) || isNaN(newTableId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const order = await restaurantOrderService.moveOrderToTable(
      companyId,
      orderId,
      newTableId,
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    if (error.message.includes('não encontrada') || error.message.includes('não encontrado')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao mover comanda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao mover comanda',
    });
  }
}

export async function mergeOrders(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const { sourceOrderId, targetOrderId } = req.body;

    if (isNaN(companyId) || isNaN(sourceOrderId) || isNaN(targetOrderId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const order = await restaurantOrderService.mergeOrders(
      companyId,
      sourceOrderId,
      targetOrderId,
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    if (error.message.includes('não encontrada') || error.message.includes('fechadas')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao juntar comandas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao juntar comandas',
    });
  }
}

export async function splitOrder(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const orderId = parseInt(req.params.orderId, 10);
    const { itemIds } = req.body;

    if (isNaN(companyId) || isNaN(orderId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Lista de itens inválida',
      });
      return;
    }

    const order = await restaurantOrderService.splitOrder(
      companyId,
      orderId,
      itemIds,
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    if (error.message.includes('não encontrada') || error.message.includes('Nenhum item')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao dividir comanda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao dividir comanda',
    });
  }
}

export async function closeOrder(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const orderId = parseInt(req.params.orderId, 10);

    if (isNaN(companyId) || isNaN(orderId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const order = await restaurantOrderService.closeOrder(
      companyId,
      orderId,
      req.body,
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    if (error.message.includes('não encontrada') || error.message.includes('não é possível')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao fechar comanda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fechar comanda',
    });
  }
}

export async function updateOrder(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const orderId = parseInt(req.params.orderId, 10);

    if (isNaN(companyId) || isNaN(orderId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    const order = await restaurantOrderService.updateOrder(
      companyId,
      orderId,
      req.user.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    if (error.message.includes('não encontrada') || error.message.includes('fechada')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('Erro ao atualizar comanda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar comanda',
    });
  }
}

export async function deleteOrder(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const orderId = parseInt(req.params.orderId, 10);

    if (isNaN(companyId) || isNaN(orderId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    const order = await restaurantOrderService.deleteOrder(
      companyId,
      orderId,
      req.user.id,
      req.body.reason,
    );

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    if (error.message.includes('não encontrada') || error.message.includes('fechada')) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('Erro ao excluir comanda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao excluir comanda',
    });
  }
}

export async function getOrderHistory(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const orderId = parseInt(req.params.orderId, 10);

    if (isNaN(companyId) || isNaN(orderId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const history = await restaurantOrderService.getOrderHistory(companyId, orderId);

    res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    if (error.message.includes('não encontrada')) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico',
    });
  }
}

