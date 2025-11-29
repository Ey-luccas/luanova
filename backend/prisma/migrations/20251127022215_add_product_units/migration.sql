-- CreateTable
CREATE TABLE "product_units" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "barcode" TEXT NOT NULL,
    "isSold" BOOLEAN NOT NULL DEFAULT false,
    "soldAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "product_units_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_units_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "product_units_barcode_key" ON "product_units"("barcode");

-- CreateIndex
CREATE INDEX "product_units_productId_idx" ON "product_units"("productId");

-- CreateIndex
CREATE INDEX "product_units_companyId_idx" ON "product_units"("companyId");

-- CreateIndex
CREATE INDEX "product_units_barcode_idx" ON "product_units"("barcode");

-- CreateIndex
CREATE INDEX "product_units_createdAt_idx" ON "product_units"("createdAt");

-- CreateIndex
CREATE INDEX "product_units_isSold_idx" ON "product_units"("isSold");
