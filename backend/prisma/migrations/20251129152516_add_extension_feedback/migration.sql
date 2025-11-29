-- CreateTable
CREATE TABLE "extension_feedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyExtensionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "suggestions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "extension_feedback_companyExtensionId_fkey" FOREIGN KEY ("companyExtensionId") REFERENCES "company_extensions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "extension_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "extension_feedback_companyExtensionId_idx" ON "extension_feedback"("companyExtensionId");

-- CreateIndex
CREATE INDEX "extension_feedback_userId_idx" ON "extension_feedback"("userId");
