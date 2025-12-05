-- CreateTable
CREATE TABLE "restaurant_order_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "userId" INTEGER,
    "changes" TEXT,
    "description" TEXT,
    "previousData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "restaurant_order_history_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "restaurant_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "restaurant_order_history_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "restaurant_order_history_orderId_idx" ON "restaurant_order_history"("orderId");

-- CreateIndex
CREATE INDEX "restaurant_order_history_companyId_idx" ON "restaurant_order_history"("companyId");

-- CreateIndex
CREATE INDEX "restaurant_order_history_createdAt_idx" ON "restaurant_order_history"("createdAt");
