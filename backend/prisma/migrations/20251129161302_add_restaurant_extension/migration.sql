-- CreateTable
CREATE TABLE "restaurant_tables" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "name" TEXT,
    "capacity" INTEGER NOT NULL DEFAULT 4,
    "shape" TEXT NOT NULL DEFAULT 'ROUND',
    "positionX" DECIMAL,
    "positionY" DECIMAL,
    "status" TEXT NOT NULL DEFAULT 'FREE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "restaurant_tables_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "restaurant_waiters" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "restaurant_waiters_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "restaurant_menu_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "restaurant_menu_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "restaurant_menu_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL NOT NULL,
    "imageUrl" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "preparationTime" INTEGER,
    "sizes" TEXT,
    "sizesPrices" TEXT,
    "allowHalf" BOOLEAN NOT NULL DEFAULT false,
    "allowThird" BOOLEAN NOT NULL DEFAULT false,
    "allowCombo" BOOLEAN NOT NULL DEFAULT false,
    "allowedAddons" TEXT,
    "availableDays" TEXT,
    "availableShifts" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "restaurant_menu_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "restaurant_menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "restaurant_menu_categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "restaurant_orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "tableId" INTEGER,
    "waiterId" INTEGER,
    "orderType" TEXT NOT NULL DEFAULT 'DINE_IN',
    "customerName" TEXT,
    "customerPhone" TEXT,
    "numberOfPeople" INTEGER,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "subtotal" DECIMAL NOT NULL DEFAULT 0,
    "serviceFee" DECIMAL NOT NULL DEFAULT 0,
    "tip" DECIMAL NOT NULL DEFAULT 0,
    "total" DECIMAL NOT NULL DEFAULT 0,
    "paymentMethod" TEXT,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "restaurant_orders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "restaurant_orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "restaurant_tables" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "restaurant_orders_waiterId_fkey" FOREIGN KEY ("waiterId") REFERENCES "restaurant_waiters" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "restaurant_order_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "quantity" DECIMAL NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL NOT NULL,
    "size" TEXT,
    "isHalf" BOOLEAN NOT NULL DEFAULT false,
    "isThird" BOOLEAN NOT NULL DEFAULT false,
    "flavors" TEXT,
    "addons" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sentToKitchenAt" DATETIME,
    "startedAt" DATETIME,
    "readyAt" DATETIME,
    "deliveredAt" DATETIME,
    "subtotal" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "restaurant_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "restaurant_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "restaurant_order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "restaurant_menu_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "restaurant_reservations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "tableId" INTEGER,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "reservationDate" DATETIME NOT NULL,
    "reservationTime" TEXT NOT NULL,
    "numberOfPeople" INTEGER NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "arrivalDeadline" DATETIME,
    "confirmedAt" DATETIME,
    "seatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "restaurant_reservations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "restaurant_reservations_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "restaurant_tables" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "restaurant_tables_companyId_idx" ON "restaurant_tables"("companyId");

-- CreateIndex
CREATE INDEX "restaurant_tables_status_idx" ON "restaurant_tables"("status");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_tables_companyId_number_key" ON "restaurant_tables"("companyId", "number");

-- CreateIndex
CREATE INDEX "restaurant_waiters_companyId_idx" ON "restaurant_waiters"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_waiters_companyId_code_key" ON "restaurant_waiters"("companyId", "code");

-- CreateIndex
CREATE INDEX "restaurant_menu_categories_companyId_idx" ON "restaurant_menu_categories"("companyId");

-- CreateIndex
CREATE INDEX "restaurant_menu_items_companyId_idx" ON "restaurant_menu_items"("companyId");

-- CreateIndex
CREATE INDEX "restaurant_menu_items_categoryId_idx" ON "restaurant_menu_items"("categoryId");

-- CreateIndex
CREATE INDEX "restaurant_menu_items_isAvailable_idx" ON "restaurant_menu_items"("isAvailable");

-- CreateIndex
CREATE INDEX "restaurant_orders_companyId_idx" ON "restaurant_orders"("companyId");

-- CreateIndex
CREATE INDEX "restaurant_orders_tableId_idx" ON "restaurant_orders"("tableId");

-- CreateIndex
CREATE INDEX "restaurant_orders_waiterId_idx" ON "restaurant_orders"("waiterId");

-- CreateIndex
CREATE INDEX "restaurant_orders_status_idx" ON "restaurant_orders"("status");

-- CreateIndex
CREATE INDEX "restaurant_orders_createdAt_idx" ON "restaurant_orders"("createdAt");

-- CreateIndex
CREATE INDEX "restaurant_order_items_orderId_idx" ON "restaurant_order_items"("orderId");

-- CreateIndex
CREATE INDEX "restaurant_order_items_menuItemId_idx" ON "restaurant_order_items"("menuItemId");

-- CreateIndex
CREATE INDEX "restaurant_order_items_status_idx" ON "restaurant_order_items"("status");

-- CreateIndex
CREATE INDEX "restaurant_reservations_companyId_idx" ON "restaurant_reservations"("companyId");

-- CreateIndex
CREATE INDEX "restaurant_reservations_tableId_idx" ON "restaurant_reservations"("tableId");

-- CreateIndex
CREATE INDEX "restaurant_reservations_reservationDate_idx" ON "restaurant_reservations"("reservationDate");

-- CreateIndex
CREATE INDEX "restaurant_reservations_status_idx" ON "restaurant_reservations"("status");
