import prisma from '../config/prisma';
import { Decimal } from '@prisma/client/runtime/library';

// ============================================
// CLIENTES
// ============================================

export async function createClient(
  companyId: number,
  data: {
    name: string;
    phone: string;
    email?: string;
    internalNotes?: string;
    tags?: string;
  },
) {
  return await prisma.appointmentClient.create({
    data: {
      companyId,
      ...data,
    },
  });
}

export async function listClients(companyId: number, search?: string) {
  const where: any = { companyId };
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
    ];
  }

  return await prisma.appointmentClient.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { appointments: true },
      },
    },
  });
}

export async function getClientById(clientId: number, companyId: number) {
  const client = await prisma.appointmentClient.findFirst({
    where: { id: clientId, companyId },
    include: {
      appointments: {
        orderBy: { startTime: 'desc' },
        take: 10,
        include: {
          service: true,
          professional: true,
        },
      },
    },
  });

  if (!client) {
    throw new Error('Cliente não encontrado');
  }

  // Buscar último agendamento concluído
  const lastAppointment = await prisma.appointment.findFirst({
    where: {
      clientId: client.id,
      companyId,
      status: 'COMPLETED',
    },
    orderBy: { startTime: 'desc' },
    include: {
      service: true,
      professional: true,
    },
  });

  return {
    ...client,
    lastAppointment,
  };
}

export async function updateClient(
  clientId: number,
  _companyId: number,
  data: any,
) {
  return await prisma.appointmentClient.update({
    where: { id: clientId },
    data,
  });
}

export async function deleteClient(clientId: number, _companyId: number) {
  return await prisma.appointmentClient.delete({
    where: { id: clientId },
  });
}

// ============================================
// PROFISSIONAIS
// ============================================

export async function createProfessional(
  companyId: number,
  data: {
    userId?: number;
    name: string;
    phone?: string;
    email?: string;
    color?: string;
  },
) {
  return await prisma.appointmentProfessional.create({
    data: {
      companyId,
      ...data,
    },
  });
}

export async function listProfessionals(companyId: number) {
  return await prisma.appointmentProfessional.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function updateProfessional(
  professionalId: number,
  _companyId: number,
  data: any,
) {
  return await prisma.appointmentProfessional.update({
    where: { id: professionalId },
    data,
  });
}

export async function deleteProfessional(
  professionalId: number,
  _companyId: number,
) {
  return await prisma.appointmentProfessional.update({
    where: { id: professionalId },
    data: { isActive: false },
  });
}

// ============================================
// SERVIÇOS
// ============================================

export async function createService(
  companyId: number,
  data: {
    name: string;
    description?: string;
    duration: number;
    price?: number;
    color?: string;
  },
) {
  return await prisma.appointmentService.create({
    data: {
      companyId,
      price: data.price ? new Decimal(data.price) : null,
      ...data,
    },
  });
}

export async function listServices(companyId: number) {
  return await prisma.appointmentService.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function updateService(
  serviceId: number,
  _companyId: number,
  data: any,
) {
  if (data.price !== undefined) {
    data.price = data.price ? new Decimal(data.price) : null;
  }
  return await prisma.appointmentService.update({
    where: { id: serviceId },
    data,
  });
}

export async function deleteService(serviceId: number, _companyId: number) {
  return await prisma.appointmentService.update({
    where: { id: serviceId },
    data: { isActive: false },
  });
}

// ============================================
// SALAS/RECURSOS
// ============================================

export async function createRoom(
  companyId: number,
  data: {
    name: string;
    capacity?: number;
    color?: string;
  },
) {
  return await prisma.appointmentRoom.create({
    data: {
      companyId,
      ...data,
    },
  });
}

export async function listRooms(companyId: number) {
  return await prisma.appointmentRoom.findMany({
    where: { companyId, isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function updateRoom(roomId: number, _companyId: number, data: any) {
  return await prisma.appointmentRoom.update({
    where: { id: roomId },
    data,
  });
}

export async function deleteRoom(roomId: number, _companyId: number) {
  return await prisma.appointmentRoom.update({
    where: { id: roomId },
    data: { isActive: false },
  });
}

// ============================================
// AGENDAMENTOS
// ============================================

export async function createAppointment(
  companyId: number,
  data: {
    clientId: number;
    professionalId?: number;
    serviceId: number;
    roomId?: number;
    startTime: Date;
    internalNotes?: string;
    clientNotes?: string;
  },
) {
  // Buscar serviço para calcular endTime
  const service = await prisma.appointmentService.findUnique({
    where: { id: data.serviceId },
  });

  if (!service) {
    throw new Error('Serviço não encontrado');
  }

  const startTime = new Date(data.startTime);
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + service.duration);

  // Verificar conflitos
  const conflicts = await prisma.appointment.findMany({
    where: {
      companyId,
      OR: [
        {
          AND: [
            { startTime: { lt: endTime } },
            { endTime: { gt: startTime } },
          ],
        },
      ],
      status: {
        notIn: ['CANCELLED', 'NO_SHOW'],
      },
      ...(data.professionalId && {
        professionalId: data.professionalId,
      }),
      ...(data.roomId && {
        roomId: data.roomId,
      }),
    },
  });

  if (conflicts.length > 0) {
    throw new Error('Conflito de horário detectado');
  }

  return await prisma.appointment.create({
    data: {
      companyId,
      ...data,
      startTime,
      endTime,
      duration: service.duration,
    },
    include: {
      client: true,
      professional: true,
      service: true,
      room: true,
    },
  });
}

export async function listAppointments(
  companyId: number,
  filters?: {
    startDate?: Date;
    endDate?: Date;
    professionalId?: number;
    serviceId?: number;
    roomId?: number;
    status?: string;
    clientId?: number;
  },
) {
  const where: any = { companyId };

  if (filters?.startDate || filters?.endDate) {
    where.startTime = {};
    if (filters.startDate) {
      where.startTime.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      where.startTime.lte = new Date(filters.endDate);
    }
  }

  if (filters?.professionalId) {
    where.professionalId = filters.professionalId;
  }

  if (filters?.serviceId) {
    where.serviceId = filters.serviceId;
  }

  if (filters?.roomId) {
    where.roomId = filters.roomId;
  }

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.clientId) {
    where.clientId = filters.clientId;
  }

  return await prisma.appointment.findMany({
    where,
    include: {
      client: true,
      professional: true,
      service: true,
      room: true,
    },
    orderBy: { startTime: 'asc' },
  });
}

export async function getAppointmentById(
  appointmentId: number,
  companyId: number,
) {
  return await prisma.appointment.findFirst({
    where: { id: appointmentId, companyId },
    include: {
      client: true,
      professional: true,
      service: true,
      room: true,
    },
  });
}

export async function updateAppointment(
  appointmentId: number,
  companyId: number,
  data: any,
) {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, companyId },
    include: { service: true },
  });

  if (!appointment) {
    throw new Error('Agendamento não encontrado');
  }

  // Se mudou startTime ou serviceId, recalcular endTime
  if (data.startTime || data.serviceId) {
    const startTime = data.startTime
      ? new Date(data.startTime)
      : appointment.startTime;
    const serviceId = data.serviceId || appointment.serviceId;

    const service = await prisma.appointmentService.findUnique({
      where: { id: serviceId },
    });

    if (service) {
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + service.duration);
      data.endTime = endTime;
      data.duration = service.duration;
    }
  }

  // Verificar conflitos se mudou horário
  if (data.startTime || data.professionalId || data.roomId) {
    const startTime = data.startTime
      ? new Date(data.startTime)
      : appointment.startTime;
    const endTime = data.endTime
      ? new Date(data.endTime)
      : appointment.endTime;

    const conflicts = await prisma.appointment.findMany({
      where: {
        companyId,
        id: { not: appointmentId },
        OR: [
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gt: startTime } },
            ],
          },
        ],
        status: {
          notIn: ['CANCELLED', 'NO_SHOW'],
        },
        ...(data.professionalId && {
          professionalId: data.professionalId,
        }),
        ...(data.roomId && {
          roomId: data.roomId,
        }),
      },
    });

    if (conflicts.length > 0) {
      throw new Error('Conflito de horário detectado');
    }
  }

  // Atualizar status específicos
  if (data.status === 'STARTED') {
    data.checkedInAt = new Date();
  } else if (data.status === 'COMPLETED') {
    data.completedAt = new Date();
  }

  return await prisma.appointment.update({
    where: { id: appointmentId },
    data,
    include: {
      client: true,
      professional: true,
      service: true,
      room: true,
    },
  });
}

export async function deleteAppointment(
  appointmentId: number,
  _companyId: number,
) {
  return await prisma.appointment.delete({
    where: { id: appointmentId },
  });
}

// ============================================
// LISTA DE ESPERA
// ============================================

export async function createWaitlist(companyId: number, data: any) {
  return await prisma.waitlist.create({
    data: {
      companyId,
      preferredDate: data.preferredDate ? new Date(data.preferredDate) : null,
      ...data,
    },
    include: {
      client: true,
      service: true,
    },
  });
}

export async function listWaitlist(companyId: number, status?: string) {
  const where: any = { companyId };
  if (status) {
    where.status = status;
  }

  return await prisma.waitlist.findMany({
    where,
    include: {
      client: true,
      service: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function updateWaitlist(
  waitlistId: number,
  _companyId: number,
  data: any,
) {
  if (data.preferredDate) {
    data.preferredDate = new Date(data.preferredDate);
  }

  return await prisma.waitlist.update({
    where: { id: waitlistId },
    data,
    include: {
      client: true,
      service: true,
    },
  });
}

export async function deleteWaitlist(waitlistId: number, _companyId: number) {
  return await prisma.waitlist.delete({
    where: { id: waitlistId },
  });
}

