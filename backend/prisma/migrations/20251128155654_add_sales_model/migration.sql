-- CreateTable
CREATE TABLE "sales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "userId" INTEGER,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerCpf" TEXT,
    "customerEmail" TEXT,
    "paymentMethod" TEXT,
    "returnAction" TEXT,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sales_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sales_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_product_units" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "companyId" INTEGER NOT NULL,
    "barcode" TEXT NOT NULL,
    "isSold" BOOLEAN NOT NULL DEFAULT false,
    "soldAt" DATETIME,
    "sellerName" TEXT,
    "attendantName" TEXT,
    "buyerDescription" TEXT,
    "paymentMethods" TEXT,
    "saleDescription" TEXT,
    "saleId" INTEGER,
    "isReturned" BOOLEAN NOT NULL DEFAULT false,
    "returnAction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "product_units_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_units_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_units_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_product_units" ("attendantName", "barcode", "buyerDescription", "companyId", "createdAt", "id", "isSold", "paymentMethods", "productId", "saleDescription", "sellerName", "soldAt", "updatedAt") SELECT "attendantName", "barcode", "buyerDescription", "companyId", "createdAt", "id", "isSold", "paymentMethods", "productId", "saleDescription", "sellerName", "soldAt", "updatedAt" FROM "product_units";
DROP TABLE "product_units";
ALTER TABLE "new_product_units" RENAME TO "product_units";
CREATE UNIQUE INDEX "product_units_barcode_key" ON "product_units"("barcode");
CREATE INDEX "product_units_productId_idx" ON "product_units"("productId");
CREATE INDEX "product_units_companyId_idx" ON "product_units"("companyId");
CREATE INDEX "product_units_barcode_idx" ON "product_units"("barcode");
CREATE INDEX "product_units_createdAt_idx" ON "product_units"("createdAt");
CREATE INDEX "product_units_isSold_idx" ON "product_units"("isSold");
CREATE INDEX "product_units_saleId_idx" ON "product_units"("saleId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "sales_productId_idx" ON "sales"("productId");

-- CreateIndex
CREATE INDEX "sales_companyId_idx" ON "sales"("companyId");

-- CreateIndex
CREATE INDEX "sales_createdAt_idx" ON "sales"("createdAt");

-- CreateIndex
CREATE INDEX "sales_type_idx" ON "sales"("type");

-- CreateIndex
CREATE INDEX "sales_customerName_idx" ON "sales"("customerName");

-- CreateIndex
CREATE INDEX "sales_customerCpf_idx" ON "sales"("customerCpf");

-- CreateIndex
CREATE INDEX "sales_customerEmail_idx" ON "sales"("customerEmail");
