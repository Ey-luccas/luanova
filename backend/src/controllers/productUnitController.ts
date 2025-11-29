import { Request, Response } from 'express';
import * as productUnitService from '../services/productUnitService';

/**
 * Cria unidades de produto com códigos de barras
 * POST /api/companies/:companyId/products/:productId/units
 */
export async function createUnits(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    const companyId = parseInt(req.params.companyId, 10);
    const productId = parseInt(req.body.productId, 10);
    const quantity = parseInt(req.body.quantity, 10);

    if (!productId || isNaN(productId)) {
      res.status(400).json({
        success: false,
        message: 'ID do produto é obrigatório',
      });
      return;
    }

    if (!quantity || quantity <= 0 || isNaN(quantity)) {
      res.status(400).json({
        success: false,
        message: 'Quantidade deve ser maior que 0',
      });
      return;
    }

    console.log(`[createUnits] Controller - Criando ${quantity} unidade(s) para produto ${productId}`);

    const units = await productUnitService.createProductUnits(
      req.user.id,
      companyId,
      productId,
      quantity
    );

    console.log(`[createUnits] Controller - ${units.length} unidade(s) criada(s) com sucesso`);
    console.log(`[createUnits] Controller - Primeiras 3 unidades:`, units.slice(0, 3).map(u => ({
      id: u.id,
      barcode: u.barcode,
      createdAt: u.createdAt,
    })));

    res.status(201).json({
      success: true,
      message: `${quantity} unidade(s) criada(s) com sucesso`,
      data: {
        units,
      },
    });
  } catch (error: any) {
    console.error('Erro ao criar unidades:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao criar unidades',
    });
  }
}

/**
 * Lista unidades criadas em uma data específica
 * GET /api/companies/:companyId/units/by-date?date=2024-01-26
 */
export async function getUnitsByDate(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    const companyId = parseInt(req.params.companyId, 10);
    const dateStr = req.query.date as string;

    if (!dateStr) {
      res.status(400).json({
        success: false,
        message: 'Data é obrigatória',
      });
      return;
    }

    const date = new Date(dateStr);
    const units = await productUnitService.getUnitsByDate(
      req.user.id,
      companyId,
      date
    );

    res.status(200).json({
      success: true,
      data: {
        units,
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar unidades por data:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao listar unidades',
    });
  }
}

/**
 * Lista todas as datas que têm unidades criadas
 * GET /api/companies/:companyId/units/dates
 */
export async function getUnitsDates(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    const companyId = parseInt(req.params.companyId, 10);
    const dates = await productUnitService.getUnitsDates(
      req.user.id,
      companyId
    );

    res.status(200).json({
      success: true,
      data: {
        dates,
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar datas:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao listar datas',
    });
  }
}

/**
 * Lista unidades de um produto específico
 * GET /api/companies/:companyId/products/:productId/units
 */
export async function getUnitsByProduct(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    const companyId = parseInt(req.params.companyId, 10);
    const productId = parseInt(req.params.productId, 10);

    if (!productId || isNaN(productId)) {
      res.status(400).json({
        success: false,
        message: 'ID do produto é obrigatório',
      });
      return;
    }

    const result = await productUnitService.getUnitsByProduct(
      req.user.id,
      companyId,
      productId
    );

    console.log(`[getUnitsByProduct] Controller - Product ID: ${productId}`);
    console.log(`[getUnitsByProduct] Controller - Unidades retornadas: ${result.units.length}`);
    console.log(`[getUnitsByProduct] Controller - Produto:`, result.product);
    console.log(`[getUnitsByProduct] Controller - Primeiras 3 unidades:`, result.units.slice(0, 3));

    res.status(200).json({
      success: true,
      data: {
        product: result.product,
        units: result.units,
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar unidades do produto:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao listar unidades',
    });
  }
}

/**
 * Marca uma unidade como vendida com informações detalhadas
 * PUT /api/companies/:companyId/units/:unitId/sold
 */
export async function markAsSold(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
      });
      return;
    }

    const companyId = parseInt(req.params.companyId, 10);
    const unitId = parseInt(req.params.unitId, 10);

    const saleDetails = req.body.saleDetails || {};

    const unit = await productUnitService.markUnitAsSold(
      req.user.id,
      companyId,
      unitId,
      saleDetails
    );

    res.status(200).json({
      success: true,
      message: 'Unidade marcada como vendida',
      data: {
        unit,
      },
    });
  } catch (error: any) {
    console.error('Erro ao marcar unidade como vendida:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erro ao marcar unidade como vendida',
    });
  }
}
