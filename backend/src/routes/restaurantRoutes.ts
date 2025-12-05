/**
 * Rotas do sistema de restaurante/pizzaria
 */

import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { companyAccessMiddleware } from "../middlewares/companyAccessMiddleware";
import { uploadMenuItemImage } from "../middlewares/uploadMiddleware";
import * as tableController from "../controllers/restaurantTableController";
import * as orderController from "../controllers/restaurantOrderController";
import * as menuController from "../controllers/restaurantMenuController";
import * as waiterController from "../controllers/restaurantWaiterController";
// TODO: Importar controllers de cozinha e reservas quando criados

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.use(companyAccessMiddleware);

// Rotas de Mesas
router.get("/tables", tableController.listTables);
router.get("/tables/:tableId", tableController.getTableById);
router.post("/tables", tableController.createTable);
router.put("/tables/:tableId", tableController.updateTable);
router.delete("/tables/:tableId", tableController.deleteTable);
router.patch("/tables/:tableId/status", tableController.updateTableStatus);

// Rotas de Comandas/Pedidos
router.get("/orders", orderController.listOrders);
router.get("/orders/:orderId", orderController.getOrderById);
router.get("/orders/:orderId/history", orderController.getOrderHistory);
router.post("/orders", orderController.createOrder);
router.put("/orders/:orderId", orderController.updateOrder);
router.delete("/orders/:orderId", orderController.deleteOrder);
router.post("/orders/:orderId/items", orderController.addOrderItem);
router.put("/orders/:orderId/items/:itemId", orderController.updateOrderItem);
router.delete(
  "/orders/:orderId/items/:itemId",
  orderController.removeOrderItem
);
router.post(
  "/orders/:orderId/send-to-kitchen",
  orderController.sendOrderToKitchen
);
router.post("/orders/:orderId/move-table", orderController.moveOrderToTable);
router.post("/orders/merge", orderController.mergeOrders);
router.post("/orders/:orderId/split", orderController.splitOrder);
router.post("/orders/:orderId/close", orderController.closeOrder);

// Rotas de Cardápio - Categorias
router.get("/menu/categories", menuController.listCategories);
router.post("/menu/categories", menuController.createCategory);
router.put("/menu/categories/:categoryId", menuController.updateCategory);
router.delete("/menu/categories/:categoryId", menuController.deleteCategory);

// Rotas de Cardápio - Itens
router.get("/menu/items", menuController.listMenuItems);
router.get("/menu/items/:itemId", menuController.getMenuItemById);
router.post("/menu/items", menuController.createMenuItem);
router.put("/menu/items/:itemId", menuController.updateMenuItem);
router.delete("/menu/items/:itemId", menuController.deleteMenuItem);
// Upload de imagem para item do menu
router.post(
  "/menu/items/upload-image",
  uploadMenuItemImage.single("image"),
  menuController.uploadMenuItemImage
);

// Rotas de Garçons
router.get("/waiters", waiterController.listWaiters);
router.get("/waiters/:waiterId", waiterController.getWaiterById);
router.post("/waiters", waiterController.createWaiter);
router.put("/waiters/:waiterId", waiterController.updateWaiter);
router.delete("/waiters/:waiterId", waiterController.deleteWaiter);

// Rotas da Cozinha (KDS)
import * as kitchenController from "../controllers/restaurantKitchenController";
router.get("/kitchen/orders", kitchenController.getKitchenOrders);
router.patch(
  "/kitchen/items/:itemId/status",
  kitchenController.updateKitchenItemStatus
);
router.get("/kitchen/metrics", kitchenController.getKitchenMetrics);

// Rotas de Reservas
import * as reservationController from "../controllers/restaurantReservationController";
router.get("/reservations", reservationController.listReservations);
router.get(
  "/reservations/:reservationId",
  reservationController.getReservationById
);
router.post("/reservations", reservationController.createReservation);
router.put(
  "/reservations/:reservationId",
  reservationController.updateReservation
);
router.delete(
  "/reservations/:reservationId",
  reservationController.deleteReservation
);

export default router;
