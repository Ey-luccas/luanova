/**
 * Controller para mesas do restaurante
 */

import { Request, Response } from 'express';
import * as restaurantTableService from '../services/restaurantTableService';

export async function listTables(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    const tables = await restaurantTableService.listTables(companyId);

    res.status(200).json({
      success: true,
      data: tables,
    });
  } catch (error: any) {
    console.error('Erro ao listar mesas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar mesas',
    });
  }
}

export async function getTableById(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const tableId = parseInt(req.params.tableId, 10);

    if (isNaN(companyId) || isNaN(tableId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const table = await restaurantTableService.getTableById(companyId, tableId);

    if (!table) {
      res.status(404).json({
        success: false,
        message: 'Mesa não encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: table,
    });
  } catch (error: any) {
    console.error('Erro ao buscar mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar mesa',
    });
  }
}

export async function createTable(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    const table = await restaurantTableService.createTable(companyId, req.body);

    res.status(201).json({
      success: true,
      data: table,
    });
  } catch (error: any) {
    if (error.message === 'Já existe uma mesa com este número') {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao criar mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar mesa',
    });
  }
}

export async function updateTable(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const tableId = parseInt(req.params.tableId, 10);

    if (isNaN(companyId) || isNaN(tableId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const table = await restaurantTableService.updateTable(
      companyId,
      tableId,
      req.body,
    );

    res.status(200).json({
      success: true,
      data: table,
    });
  } catch (error: any) {
    if (error.message === 'Mesa não encontrada') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao atualizar mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar mesa',
    });
  }
}

export async function deleteTable(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const tableId = parseInt(req.params.tableId, 10);

    if (isNaN(companyId) || isNaN(tableId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    await restaurantTableService.deleteTable(companyId, tableId);

    res.status(200).json({
      success: true,
      message: 'Mesa removida com sucesso',
    });
  } catch (error: any) {
    if (
      error.message === 'Mesa não encontrada' ||
      error.message === 'Não é possível remover uma mesa com pedidos em aberto'
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao remover mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover mesa',
    });
  }
}

export async function updateTableStatus(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const tableId = parseInt(req.params.tableId, 10);
    const { status } = req.body;

    if (isNaN(companyId) || isNaN(tableId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    if (
      !['FREE', 'WAITING', 'OCCUPIED', 'RESERVED', 'PAYMENT'].includes(status)
    ) {
      res.status(400).json({
        success: false,
        message: 'Status inválido',
      });
      return;
    }

    const table = await restaurantTableService.updateTableStatus(
      companyId,
      tableId,
      status,
    );

    res.status(200).json({
      success: true,
      data: table,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar status da mesa:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar status da mesa',
    });
  }
}

