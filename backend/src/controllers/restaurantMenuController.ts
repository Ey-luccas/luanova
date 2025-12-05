/**
 * Controller para cardápio
 */

import { Request, Response } from 'express';
import * as restaurantMenuService from '../services/restaurantMenuService';

export async function listCategories(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    const categories = await restaurantMenuService.listCategories(companyId);

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar categorias',
    });
  }
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    const category = await restaurantMenuService.createCategory(companyId, req.body);

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar categoria',
    });
  }
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const categoryId = parseInt(req.params.categoryId, 10);

    if (isNaN(companyId) || isNaN(categoryId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const category = await restaurantMenuService.updateCategory(
      companyId,
      categoryId,
      req.body,
    );

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    if (error.message === 'Categoria não encontrada') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar categoria',
    });
  }
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const categoryId = parseInt(req.params.categoryId, 10);

    if (isNaN(companyId) || isNaN(categoryId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    await restaurantMenuService.deleteCategory(companyId, categoryId);

    res.status(200).json({
      success: true,
      message: 'Categoria removida com sucesso',
    });
  } catch (error: any) {
    if (
      error.message === 'Categoria não encontrada' ||
      error.message.includes('possui itens')
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao remover categoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover categoria',
    });
  }
}

export async function listMenuItems(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const categoryId = req.query.categoryId
      ? parseInt(req.query.categoryId as string, 10)
      : undefined;

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    const items = await restaurantMenuService.listMenuItems(companyId, categoryId);

    res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error: any) {
    console.error('Erro ao listar itens:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar itens',
    });
  }
}

export async function getMenuItemById(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const itemId = parseInt(req.params.itemId, 10);

    if (isNaN(companyId) || isNaN(itemId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const item = await restaurantMenuService.getMenuItemById(companyId, itemId);

    if (!item) {
      res.status(404).json({
        success: false,
        message: 'Item não encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    console.error('Erro ao buscar item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar item',
    });
  }
}

export async function createMenuItem(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    const item = await restaurantMenuService.createMenuItem(companyId, req.body);

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    if (error.message === 'Categoria não encontrada') {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao criar item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar item',
    });
  }
}

export async function updateMenuItem(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const itemId = parseInt(req.params.itemId, 10);

    if (isNaN(companyId) || isNaN(itemId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const item = await restaurantMenuService.updateMenuItem(
      companyId,
      itemId,
      req.body,
    );

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    if (error.message === 'Item não encontrado' || error.message === 'Categoria não encontrada') {
      res.status(404).json({
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

export async function deleteMenuItem(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const itemId = parseInt(req.params.itemId, 10);

    if (isNaN(companyId) || isNaN(itemId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    await restaurantMenuService.deleteMenuItem(companyId, itemId);

    res.status(200).json({
      success: true,
      message: 'Item removido com sucesso',
    });
  } catch (error: any) {
    if (
      error.message === 'Item não encontrado' ||
      error.message.includes('possui pedidos')
    ) {
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

export async function uploadMenuItemImage(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado',
      });
      return;
    }

    // Retorna a URL da imagem (relativa, será resolvida pelo frontend)
    const imageUrl = `/uploads/menu-items/${req.file.filename}`;
    
    // URL completa para retornar ao frontend
    // O frontend vai usar NEXT_PUBLIC_API_URL e remover /api
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
    const fullImageUrl = `${baseUrl}${imageUrl}`;

    res.status(200).json({
      success: true,
      data: {
        imageUrl: fullImageUrl,
        filename: req.file.filename,
      },
    });
  } catch (error: any) {
    console.error('Erro ao fazer upload da imagem:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fazer upload da imagem',
    });
  }
}

