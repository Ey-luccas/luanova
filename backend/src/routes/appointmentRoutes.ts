import { Router } from "express";
import * as appointmentController from "../controllers/appointmentController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { companyAccessMiddleware } from "../middlewares/companyAccessMiddleware";

const router = Router({ mergeParams: true });

// Todas as rotas requerem autenticação e acesso à empresa
router.use(authMiddleware);
router.use(companyAccessMiddleware);

// ============================================
// CLIENTES
// ============================================
router.post("/clients", appointmentController.createClient);
router.get("/clients", appointmentController.listClients);
router.get("/clients/:clientId", appointmentController.getClientById);
router.put("/clients/:clientId", appointmentController.updateClient);
router.delete("/clients/:clientId", appointmentController.deleteClient);

// ============================================
// PROFISSIONAIS
// ============================================
router.post("/professionals", appointmentController.createProfessional);
router.get("/professionals", appointmentController.listProfessionals);
router.put(
  "/professionals/:professionalId",
  appointmentController.updateProfessional
);
router.delete(
  "/professionals/:professionalId",
  appointmentController.deleteProfessional
);

// ============================================
// SERVIÇOS
// ============================================
router.post("/services", appointmentController.createService);
router.get("/services", appointmentController.listServices);
router.put("/services/:serviceId", appointmentController.updateService);
router.delete("/services/:serviceId", appointmentController.deleteService);

// ============================================
// SALAS
// ============================================
router.post("/rooms", appointmentController.createRoom);
router.get("/rooms", appointmentController.listRooms);
router.put("/rooms/:roomId", appointmentController.updateRoom);
router.delete("/rooms/:roomId", appointmentController.deleteRoom);

// ============================================
// AGENDAMENTOS
// ============================================
router.post("/appointments", appointmentController.createAppointment);
router.get("/appointments", appointmentController.listAppointments);
router.get(
  "/appointments/:appointmentId",
  appointmentController.getAppointmentById
);
router.put(
  "/appointments/:appointmentId",
  appointmentController.updateAppointment
);
router.delete(
  "/appointments/:appointmentId",
  appointmentController.deleteAppointment
);

// ============================================
// LISTA DE ESPERA
// ============================================
router.post("/waitlist", appointmentController.createWaitlist);
router.get("/waitlist", appointmentController.listWaitlist);
router.put("/waitlist/:waitlistId", appointmentController.updateWaitlist);
router.delete("/waitlist/:waitlistId", appointmentController.deleteWaitlist);

export default router;
