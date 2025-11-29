import { z } from 'zod';

// Schema para Cliente
export const createClientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  internalNotes: z.string().optional(),
  tags: z.string().optional(), // JSON string com array de tags
});

export const updateClientSchema = createClientSchema.partial();

// Schema para Profissional
export const createProfessionalSchema = z.object({
  userId: z.number().int().optional(),
  name: z.string().min(1, 'Nome é obrigatório'),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  color: z.string().optional(),
});

export const updateProfessionalSchema = createProfessionalSchema.partial();

// Schema para Serviço
export const createServiceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  duration: z.number().int().positive('Duração deve ser positiva'),
  price: z.number().nonnegative('Preço não pode ser negativo').optional(),
  color: z.string().optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

// Schema para Sala/Recurso
export const createRoomSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  capacity: z.number().int().positive().optional(),
  color: z.string().optional(),
});

export const updateRoomSchema = createRoomSchema.partial();

// Schema para Agendamento
export const createAppointmentSchema = z.object({
  clientId: z.number().int().positive('Cliente é obrigatório'),
  professionalId: z.number().int().positive().optional(),
  serviceId: z.number().int().positive('Serviço é obrigatório'),
  roomId: z.number().int().positive().optional(),
  startTime: z.string().datetime('Data/hora inválida'),
  internalNotes: z.string().optional(),
  clientNotes: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  clientId: z.number().int().positive().optional(),
  professionalId: z.number().int().positive().optional().nullable(),
  serviceId: z.number().int().positive().optional(),
  roomId: z.number().int().positive().optional().nullable(),
  startTime: z.string().datetime('Data/hora inválida').optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'STARTED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  internalNotes: z.string().optional(),
  clientNotes: z.string().optional(),
});

// Schema para Lista de Espera
export const createWaitlistSchema = z.object({
  clientId: z.number().int().positive('Cliente é obrigatório'),
  serviceId: z.number().int().positive('Serviço é obrigatório'),
  preferredDate: z.string().datetime().optional().nullable(),
  preferredTime: z.string().optional(),
  notes: z.string().optional(),
});

export const updateWaitlistSchema = createWaitlistSchema.partial().extend({
  status: z.enum(['WAITING', 'OFFERED', 'CONVERTED', 'CANCELLED']).optional(),
});

// Schema para filtros de agendamentos
export const appointmentFiltersSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  professionalId: z.number().int().positive().optional(),
  serviceId: z.number().int().positive().optional(),
  roomId: z.number().int().positive().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'STARTED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  clientId: z.number().int().positive().optional(),
});

