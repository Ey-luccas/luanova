/**
 * Service para gerenciar reservas
 */

import prisma from '../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateReservationData {
  tableId?: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  reservationDate: Date;
  reservationTime: string; // "19:00"
  numberOfPeople: number;
  notes?: string;
  arrivalDeadline?: Date;
}

export interface UpdateReservationData {
  tableId?: number;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  reservationDate?: Date;
  reservationTime?: string;
  numberOfPeople?: number;
  notes?: string;
  arrivalDeadline?: Date;
  status?: 'PENDING' | 'CONFIRMED' | 'SEATED' | 'CANCELLED' | 'NO_SHOW';
}

/**
 * Lista reservas de uma empresa
 */
export async function listReservations(
  companyId: number,
  filters?: {
    date?: Date;
    status?: string;
    tableId?: number;
  },
) {
  const where: any = {
    companyId,
  };

  if (filters?.date) {
    const startOfDay = new Date(filters.date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(filters.date);
    endOfDay.setHours(23, 59, 59, 999);

    where.reservationDate = {
      gte: startOfDay,
      lte: endOfDay,
    };
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.tableId) {
    where.tableId = filters.tableId;
  }

  return await prisma.restaurantReservation.findMany({
    where,
    include: {
      table: {
        select: {
          id: true,
          number: true,
          name: true,
          capacity: true,
        },
      },
    },
    orderBy: [
      { reservationDate: 'asc' },
      { reservationTime: 'asc' },
    ],
  });
}

/**
 * Busca uma reserva por ID
 */
export async function getReservationById(
  companyId: number,
  reservationId: number,
) {
  return await prisma.restaurantReservation.findFirst({
    where: {
      id: reservationId,
      companyId,
    },
    include: {
      table: true,
    },
  });
}

/**
 * Cria uma nova reserva
 */
export async function createReservation(
  companyId: number,
  data: CreateReservationData,
) {
  // Verifica se a mesa existe (se fornecida)
  if (data.tableId) {
    const table = await prisma.restaurantTable.findFirst({
      where: {
        id: data.tableId,
        companyId,
      },
    });

    if (!table) {
      throw new Error('Mesa não encontrada');
    }

    // Verifica se a mesa está disponível no horário
    const conflictingReservation = await prisma.restaurantReservation.findFirst({
      where: {
        tableId: data.tableId,
        reservationDate: data.reservationDate,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
    });

    if (conflictingReservation) {
      throw new Error('Mesa já está reservada para este horário');
    }
  }

  // Combina data e hora
  const [hours, minutes] = data.reservationTime.split(':').map(Number);
  const reservationDateTime = new Date(data.reservationDate);
  reservationDateTime.setHours(hours, minutes, 0, 0);

  // Define prazo limite de chegada (padrão: 30 minutos após horário)
  let arrivalDeadline = data.arrivalDeadline;
  if (!arrivalDeadline) {
    arrivalDeadline = new Date(reservationDateTime);
    arrivalDeadline.setMinutes(arrivalDeadline.getMinutes() + 30);
  }

  return await prisma.restaurantReservation.create({
    data: {
      ...data,
      companyId,
      arrivalDeadline,
    },
    include: {
      table: true,
    },
  });
}

/**
 * Atualiza uma reserva
 */
export async function updateReservation(
  companyId: number,
  reservationId: number,
  data: UpdateReservationData,
) {
  const reservation = await prisma.restaurantReservation.findFirst({
    where: {
      id: reservationId,
      companyId,
    },
  });

  if (!reservation) {
    throw new Error('Reserva não encontrada');
  }

  // Se está mudando a mesa, verifica disponibilidade
  if (data.tableId && data.tableId !== reservation.tableId) {
    const table = await prisma.restaurantTable.findFirst({
      where: {
        id: data.tableId,
        companyId,
      },
    });

    if (!table) {
      throw new Error('Mesa não encontrada');
    }

    const reservationDate = data.reservationDate || reservation.reservationDate;
    const conflictingReservation = await prisma.restaurantReservation.findFirst({
      where: {
        tableId: data.tableId,
        reservationDate,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        id: {
          not: reservationId,
        },
      },
    });

    if (conflictingReservation) {
      throw new Error('Mesa já está reservada para este horário');
    }
  }

  // Se está confirmando, atualiza confirmedAt
  if (data.status === 'CONFIRMED' && reservation.status !== 'CONFIRMED') {
    (data as any).confirmedAt = new Date();
  }

  // Se está sentando, atualiza seatedAt e cria comanda
  if (data.status === 'SEATED' && reservation.status !== 'SEATED') {
    (data as any).seatedAt = new Date();

    // Cria comanda automaticamente se houver mesa
    if (reservation.tableId) {
      await prisma.restaurantOrder.create({
        data: {
          companyId,
          tableId: reservation.tableId,
          orderType: 'DINE_IN',
          customerName: reservation.customerName,
          customerPhone: reservation.customerPhone,
          numberOfPeople: reservation.numberOfPeople,
          notes: `Reserva: ${reservation.customerName}`,
          subtotal: new Decimal(0),
          serviceFee: new Decimal(0),
          tip: new Decimal(0),
          total: new Decimal(0),
        },
      });

      // Atualiza status da mesa
      await prisma.restaurantTable.update({
        where: { id: reservation.tableId },
        data: { status: 'OCCUPIED' },
      });
    }
  }

  return await prisma.restaurantReservation.update({
    where: { id: reservationId },
    data: {
      ...data,
      confirmedAt: data.status === 'CONFIRMED' ? new Date() : reservation.confirmedAt,
      seatedAt: data.status === 'SEATED' ? new Date() : reservation.seatedAt,
    },
    include: {
      table: true,
    },
  });
}

/**
 * Remove uma reserva
 */
export async function deleteReservation(
  companyId: number,
  reservationId: number,
) {
  const reservation = await prisma.restaurantReservation.findFirst({
    where: {
      id: reservationId,
      companyId,
    },
  });

  if (!reservation) {
    throw new Error('Reserva não encontrada');
  }

  if (reservation.status === 'SEATED') {
    throw new Error('Não é possível remover uma reserva que já foi sentada');
  }

  return await prisma.restaurantReservation.delete({
    where: { id: reservationId },
  });
}

