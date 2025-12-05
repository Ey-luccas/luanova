/**
 * Middleware de upload de arquivos
 *
 * Configura o multer para upload de imagens (logos)
 */

import multer from "multer";
import path from "path";
import fs from "fs";

// Criar diretório de uploads se não existir
const uploadsDir = path.join(__dirname, "../../uploads/logos");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuração de storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Nome do arquivo: timestamp-companyId-originalname
    const companyId = req.params.id || "unknown";
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = `${timestamp}-${companyId}${ext}`;
    cb(null, name);
  },
});

// Filtro de tipos de arquivo
const fileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Aceitar apenas imagens
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Apenas arquivos de imagem são permitidos"));
  }
};

// Configuração do multer
export const uploadLogo = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Storage para avatares de usuário
const avatarsDir = path.join(__dirname, "../../uploads/avatars");
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    // Nome do arquivo: timestamp-userId-originalname
    const userId = req.user?.id || "unknown";
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = `${timestamp}-${userId}${ext}`;
    cb(null, name);
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Storage para imagens de itens do cardápio
const menuItemsDir = path.join(__dirname, "../../uploads/menu-items");
if (!fs.existsSync(menuItemsDir)) {
  fs.mkdirSync(menuItemsDir, { recursive: true });
}

const menuItemStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, menuItemsDir);
  },
  filename: (req, file, cb) => {
    // Nome do arquivo: timestamp-companyId-originalname
    const companyId = req.params.companyId || "unknown";
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = `menu-${timestamp}-${companyId}${ext}`;
    cb(null, name);
  },
});

export const uploadMenuItemImage = multer({
  storage: menuItemStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
