/**
 * Controller para reservas
 */

import { Request, Response } from 'express';
import * as restaurantReservationService from '../services/restaurantReservationService';

export async function listReservations(req: Request, res: Response): Promise<void> {
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
    if (req.query.date) filters.date = new Date(req.query.date as string);
    if (req.query.status) filters.status = req.query.status as string;
    if (req.query.tableId) filters.tableId = parseInt(req.query.tableId as string, 10);

    const reservations = await restaurantReservationService.listReservations(
      companyId,
      filters,
    );

    res.status(200).json({
      success: true,
      data: reservations,
    });
  } catch (error: any) {
    console.error('Erro ao listar reservas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar reservas',
    });
  }
}

export async function getReservationById(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const reservationId = parseInt(req.params.reservationId, 10);

    if (isNaN(companyId) || isNaN(reservationId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const reservation = await restaurantReservationService.getReservationById(
      companyId,
      reservationId,
    );

    if (!reservation) {
      res.status(404).json({
        success: false,
        message: 'Reserva não encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error: any) {
    console.error('Erro ao buscar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar reserva',
    });
  }
}

export async function createReservation(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);

    if (isNaN(companyId)) {
      res.status(400).json({
        success: false,
        message: 'ID da empresa inválido',
      });
      return;
    }

    const reservation = await restaurantReservationService.createReservation(
      companyId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: reservation,
    });
  } catch (error: any) {
    if (
      error.message === 'Mesa não encontrada' ||
      error.message.includes('já está reservada')
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar reserva',
    });
  }
}

export async function updateReservation(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const reservationId = parseInt(req.params.reservationId, 10);

    if (isNaN(companyId) || isNaN(reservationId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    const reservation = await restaurantReservationService.updateReservation(
      companyId,
      reservationId,
      req.body,
    );

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error: any) {
    if (
      error.message === 'Reserva não encontrada' ||
      error.message === 'Mesa não encontrada' ||
      error.message.includes('já está reservada')
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao atualizar reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atualizar reserva',
    });
  }
}

export async function deleteReservation(req: Request, res: Response): Promise<void> {
  try {
    const companyId = parseInt(req.params.companyId, 10);
    const reservationId = parseInt(req.params.reservationId, 10);

    if (isNaN(companyId) || isNaN(reservationId)) {
      res.status(400).json({
        success: false,
        message: 'IDs inválidos',
      });
      return;
    }

    await restaurantReservationService.deleteReservation(companyId, reservationId);

    res.status(200).json({
      success: true,
      message: 'Reserva removida com sucesso',
    });
  } catch (error: any) {
    if (
      error.message === 'Reserva não encontrada' ||
      error.message.includes('já foi sentada')
    ) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error('Erro ao remover reserva:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover reserva',
    });
  }
}

