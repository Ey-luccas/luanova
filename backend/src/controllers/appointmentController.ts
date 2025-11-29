import { Request, Response } from "express";
import * as appointmentService from "../services/appointmentService";
import * as appointmentSchema from "../schemas/appointmentSchema";

// ============================================
// CLIENTES
// ============================================

export async function createClient(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const validatedData = appointmentSchema.createClientSchema.parse(req.body);

    const client = await appointmentService.createClient(
      companyId,
      validatedData
    );

    res.status(201).json({ success: true, data: client });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }
    console.error("Erro ao criar cliente:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar cliente",
    });
  }
}

export async function listClients(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const search = req.query.search as string | undefined;

    const clients = await appointmentService.listClients(companyId, search);

    res.status(200).json({ success: true, data: clients });
  } catch (error: any) {
    console.error("Erro ao listar clientes:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar clientes",
    });
  }
}

export async function getClientById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const clientId = parseInt(req.params.clientId, 10);

    const client = await appointmentService.getClientById(clientId, companyId);

    res.status(200).json({ success: true, data: client });
  } catch (error: any) {
    if (error.message === "Cliente não encontrado") {
      res.status(404).json({ success: false, message: error.message });
      return;
    }
    console.error("Erro ao buscar cliente:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar cliente",
    });
  }
}

export async function updateClient(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const clientId = parseInt(req.params.clientId, 10);
    const validatedData = appointmentSchema.updateClientSchema.parse(req.body);

    const client = await appointmentService.updateClient(
      clientId,
      companyId,
      validatedData
    );

    res.status(200).json({ success: true, data: client });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }
    console.error("Erro ao atualizar cliente:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar cliente",
    });
  }
}

export async function deleteClient(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const clientId = parseInt(req.params.clientId, 10);

    await appointmentService.deleteClient(clientId, companyId);

    res.status(200).json({ success: true, message: "Cliente excluído" });
  } catch (error: any) {
    console.error("Erro ao excluir cliente:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir cliente",
    });
  }
}

// ============================================
// PROFISSIONAIS
// ============================================

export async function createProfessional(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const validatedData = appointmentSchema.createProfessionalSchema.parse(
      req.body
    );

    const professional = await appointmentService.createProfessional(
      companyId,
      validatedData
    );

    res.status(201).json({ success: true, data: professional });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }
    console.error("Erro ao criar profissional:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar profissional",
    });
  }
}

export async function listProfessionals(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;

    const professionals = await appointmentService.listProfessionals(companyId);

    res.status(200).json({ success: true, data: professionals });
  } catch (error: any) {
    console.error("Erro ao listar profissionais:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar profissionais",
    });
  }
}

export async function updateProfessional(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const professionalId = parseInt(req.params.professionalId, 10);
    const validatedData = appointmentSchema.updateProfessionalSchema.parse(
      req.body
    );

    const professional = await appointmentService.updateProfessional(
      professionalId,
      companyId,
      validatedData
    );

    res.status(200).json({ success: true, data: professional });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }
    console.error("Erro ao atualizar profissional:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar profissional",
    });
  }
}

export async function deleteProfessional(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const professionalId = parseInt(req.params.professionalId, 10);

    await appointmentService.deleteProfessional(professionalId, companyId);

    res.status(200).json({ success: true, message: "Profissional excluído" });
  } catch (error: any) {
    console.error("Erro ao excluir profissional:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir profissional",
    });
  }
}

// ============================================
// SERVIÇOS
// ============================================

export async function createService(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const validatedData = appointmentSchema.createServiceSchema.parse(req.body);

    const service = await appointmentService.createService(
      companyId,
      validatedData
    );

    res.status(201).json({ success: true, data: service });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }
    console.error("Erro ao criar serviço:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar serviço",
    });
  }
}

export async function listServices(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;

    const services = await appointmentService.listServices(companyId);

    res.status(200).json({ success: true, data: services });
  } catch (error: any) {
    console.error("Erro ao listar serviços:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar serviços",
    });
  }
}

export async function updateService(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const serviceId = parseInt(req.params.serviceId, 10);
    const validatedData = appointmentSchema.updateServiceSchema.parse(req.body);

    const service = await appointmentService.updateService(
      serviceId,
      companyId,
      validatedData
    );

    res.status(200).json({ success: true, data: service });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }
    console.error("Erro ao atualizar serviço:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar serviço",
    });
  }
}

export async function deleteService(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const serviceId = parseInt(req.params.serviceId, 10);

    await appointmentService.deleteService(serviceId, companyId);

    res.status(200).json({ success: true, message: "Serviço excluído" });
  } catch (error: any) {
    console.error("Erro ao excluir serviço:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir serviço",
    });
  }
}

// ============================================
// SALAS
// ============================================

export async function createRoom(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const validatedData = appointmentSchema.createRoomSchema.parse(req.body);

    const room = await appointmentService.createRoom(companyId, validatedData);

    res.status(201).json({ success: true, data: room });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }
    console.error("Erro ao criar sala:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar sala",
    });
  }
}

export async function listRooms(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;

    const rooms = await appointmentService.listRooms(companyId);

    res.status(200).json({ success: true, data: rooms });
  } catch (error: any) {
    console.error("Erro ao listar salas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar salas",
    });
  }
}

export async function updateRoom(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const roomId = parseInt(req.params.roomId, 10);
    const validatedData = appointmentSchema.updateRoomSchema.parse(req.body);

    const room = await appointmentService.updateRoom(
      roomId,
      companyId,
      validatedData
    );

    res.status(200).json({ success: true, data: room });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }
    console.error("Erro ao atualizar sala:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar sala",
    });
  }
}

export async function deleteRoom(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const roomId = parseInt(req.params.roomId, 10);

    await appointmentService.deleteRoom(roomId, companyId);

    res.status(200).json({ success: true, message: "Sala excluída" });
  } catch (error: any) {
    console.error("Erro ao excluir sala:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir sala",
    });
  }
}

// ============================================
// AGENDAMENTOS
// ============================================

export async function createAppointment(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const validatedData = appointmentSchema.createAppointmentSchema.parse(
      req.body
    );

    const appointment = await appointmentService.createAppointment(companyId, {
      ...validatedData,
      startTime: new Date(validatedData.startTime),
    });

    res.status(201).json({ success: true, data: appointment });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }
    if (error.message === "Conflito de horário detectado") {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error("Erro ao criar agendamento:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar agendamento",
    });
  }
}

export async function listAppointments(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const filters = appointmentSchema.appointmentFiltersSchema.parse(req.query);

    const appointments = await appointmentService.listAppointments(
      companyId,
      filters
    );

    res.status(200).json({ success: true, data: appointments });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Filtros inválidos",
        errors: error.errors,
      });
      return;
    }
    console.error("Erro ao listar agendamentos:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar agendamentos",
    });
  }
}

export async function getAppointmentById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const appointmentId = parseInt(req.params.appointmentId, 10);

    const appointment = await appointmentService.getAppointmentById(
      appointmentId,
      companyId
    );

    if (!appointment) {
      res.status(404).json({
        success: false,
        message: "Agendamento não encontrado",
      });
      return;
    }

    res.status(200).json({ success: true, data: appointment });
  } catch (error: any) {
    console.error("Erro ao buscar agendamento:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar agendamento",
    });
  }
}

export async function updateAppointment(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const appointmentId = parseInt(req.params.appointmentId, 10);
    const validatedData = appointmentSchema.updateAppointmentSchema.parse(
      req.body
    );

    const data: any = { ...validatedData };
    if (data.startTime) {
      data.startTime = new Date(data.startTime);
    }

    const appointment = await appointmentService.updateAppointment(
      appointmentId,
      companyId,
      data
    );

    res.status(200).json({ success: true, data: appointment });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }
    if (error.message === "Conflito de horário detectado") {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }
    console.error("Erro ao atualizar agendamento:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar agendamento",
    });
  }
}

export async function deleteAppointment(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const appointmentId = parseInt(req.params.appointmentId, 10);

    await appointmentService.deleteAppointment(appointmentId, companyId);

    res.status(200).json({ success: true, message: "Agendamento excluído" });
  } catch (error: any) {
    console.error("Erro ao excluir agendamento:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir agendamento",
    });
  }
}

// ============================================
// LISTA DE ESPERA
// ============================================

export async function createWaitlist(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const validatedData = appointmentSchema.createWaitlistSchema.parse(
      req.body
    );

    const waitlist = await appointmentService.createWaitlist(
      companyId,
      validatedData
    );

    res.status(201).json({ success: true, data: waitlist });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }
    console.error("Erro ao criar lista de espera:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao criar lista de espera",
    });
  }
}

export async function listWaitlist(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const status = req.query.status as string | undefined;

    const waitlist = await appointmentService.listWaitlist(companyId, status);

    res.status(200).json({ success: true, data: waitlist });
  } catch (error: any) {
    console.error("Erro ao listar lista de espera:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao listar lista de espera",
    });
  }
}

export async function updateWaitlist(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const waitlistId = parseInt(req.params.waitlistId, 10);
    const validatedData = appointmentSchema.updateWaitlistSchema.parse(
      req.body
    );

    const waitlist = await appointmentService.updateWaitlist(
      waitlistId,
      companyId,
      validatedData
    );

    res.status(200).json({ success: true, data: waitlist });
  } catch (error: any) {
    if (error.name === "ZodError") {
      res.status(400).json({
        success: false,
        message: "Dados inválidos",
        errors: error.errors,
      });
      return;
    }
    console.error("Erro ao atualizar lista de espera:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao atualizar lista de espera",
    });
  }
}

export async function deleteWaitlist(
  req: Request,
  res: Response
): Promise<void> {
  try {
    if (!req.user || !req.companyAccess) {
      res.status(401).json({ success: false, message: "Não autenticado" });
      return;
    }

    const companyId = req.companyAccess.companyId;
    const waitlistId = parseInt(req.params.waitlistId, 10);

    await appointmentService.deleteWaitlist(waitlistId, companyId);

    res.status(200).json({ success: true, message: "Item removido da lista" });
  } catch (error: any) {
    console.error("Erro ao excluir lista de espera:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao excluir lista de espera",
    });
  }
}
