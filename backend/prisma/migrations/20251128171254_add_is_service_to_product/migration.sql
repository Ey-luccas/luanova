-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "barcode" TEXT,
    "sku" TEXT,
    "categoryId" INTEGER,
    "companyId" INTEGER NOT NULL,
    "currentStock" DECIMAL NOT NULL DEFAULT 0,
    "minStock" DECIMAL,
    "maxStock" DECIMAL,
    "unitPrice" DECIMAL,
    "costPrice" DECIMAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isService" BOOLEAN NOT NULL DEFAULT false,
    "lastMovementAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_products" ("barcode", "categoryId", "companyId", "costPrice", "createdAt", "currentStock", "description", "id", "isActive", "lastMovementAt", "maxStock", "minStock", "name", "sku", "unitPrice", "updatedAt") SELECT "barcode", "categoryId", "companyId", "costPrice", "createdAt", "currentStock", "description", "id", "isActive", "lastMovementAt", "maxStock", "minStock", "name", "sku", "unitPrice", "updatedAt" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE INDEX "products_companyId_idx" ON "products"("companyId");
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX "products_barcode_idx" ON "products"("barcode");
CREATE INDEX "products_isService_idx" ON "products"("isService");
CREATE UNIQUE INDEX "products_barcode_companyId_key" ON "products"("barcode", "companyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
