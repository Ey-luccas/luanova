-- AlterTable
-- Adiciona coluna isArchived para arquivamento de empresas
-- MySQL: TINYINT(1) (0 = false, 1 = true)
ALTER TABLE `companies` ADD COLUMN `isArchived` TINYINT(1) NOT NULL DEFAULT 0;
