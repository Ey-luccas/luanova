# 📚 Guia Completo do Projeto EstoqueLua

Este documento explica **como o projeto foi desenvolvido**, **como funciona o fluxo de dados** e **como colocá-lo no ar em produção**.

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Projeto](#arquitetura-do-projeto)
3. [Como Foi Desenvolvido](#como-foi-desenvolvido)
4. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
5. [Tecnologias Utilizadas](#tecnologias-utilizadas)
6. [Como Colocar no Ar (Deploy)](#como-colocar-no-ar-deploy)
7. [Manutenção e Monitoramento](#manutenção-e-monitoramento)

---

## 🎯 Visão Geral

O **EstoqueLua** é um sistema completo de gestão de estoque desenvolvido pela **Lualabs**. É um **monorepo** composto por:

- **Backend API REST** - Servidor Node.js com Express, TypeScript e Prisma
- **Frontend Web** - Painel administrativo em Next.js 14 com React
- **Mobile App** - Aplicativo React Native com Expo (em desenvolvimento)

### Principais Funcionalidades

- ✅ Gestão completa de produtos e serviços
- ✅ Controle de estoque em tempo real
- ✅ Sistema de movimentações (entrada/saída)
- ✅ Registro de vendas e prestações de serviço
- ✅ Scanner de código de barras
- ✅ Sistema multi-empresa (usuários podem ter várias empresas)
- ✅ Extensões modulares (Agendamentos, Restaurante)
- ✅ Dashboard com relatórios e métricas
- ✅ Autenticação JWT com refresh tokens

---

## 🏗️ Arquitetura do Projeto

### Estrutura de Diretórios

```
estoquelua/
│
├── backend/                 # API REST (Node.js + Express)
│   ├── src/
│   │   ├── config/         # Configurações (env, logger, prisma)
│   │   ├── controllers/    # Controladores (lógica HTTP)
│   │   ├── services/       # Lógica de negócio
│   │   ├── routes/         # Definição de rotas
│   │   ├── middlewares/    # Middlewares (auth, validação, erro)
│   │   ├── schemas/        # Schemas de validação (Zod)
│   │   ├── types/          # Tipos TypeScript
│   │   ├── utils/          # Utilitários
│   │   └── server.ts       # Arquivo principal do servidor
│   │
│   ├── prisma/
│   │   ├── schema.prisma   # Schema do banco de dados
│   │   ├── migrations/     # Migrações do banco
│   │   └── dev.db          # Banco SQLite (desenvolvimento)
│   │
│   ├── uploads/            # Arquivos uploadados
│   ├── logs/               # Logs da aplicação
│   ├── dist/               # Código compilado (TypeScript → JavaScript)
│   └── ecosystem.config.js # Configuração PM2
│
├── web/                    # Frontend Web (Next.js)
│   ├── src/
│   │   ├── app/            # Rotas Next.js (App Router)
│   │   ├── components/     # Componentes React
│   │   ├── contexts/       # Contextos React (Auth, Extensions)
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilitários (api, utils)
│   │   └── types/          # Tipos TypeScript
│   └── public/             # Arquivos estáticos
│
├── mobile/                 # App Mobile (React Native + Expo)
│   ├── app/                # Navegação Expo
│   └── src/                # Código fonte
│
└── shared/                 # Código compartilhado
    ├── types/              # Tipos TypeScript compartilhados
    └── utils/              # Utilitários compartilhados
```

### Padrão de Arquitetura

O projeto segue o padrão **MVC (Model-View-Controller)** adaptado para APIs REST:

```
Requisição HTTP
    ↓
Routes (rotas) → Define endpoints
    ↓
Middlewares (validação, autenticação)
    ↓
Controllers → Recebe requisição, chama services
    ↓
Services → Lógica de negócio
    ↓
Prisma → Banco de dados (ORM)
    ↓
Resposta HTTP
```

---

## 🔨 Como Foi Desenvolvido

### 1. Estrutura de Camadas

#### **Backend (API REST)**

1. **Routes** (`src/routes/`) - Define os endpoints da API
   - Exemplo: `GET /api/products`, `POST /api/auth/login`

2. **Controllers** (`src/controllers/`) - Recebe requisições HTTP e retorna respostas
   - Valida entrada com Zod
   - Chama services
   - Trata erros e formata respostas

3. **Services** (`src/services/`) - Contém toda a lógica de negócio
   - Regras de negócio
   - Validações complexas
   - Comunicação com banco de dados via Prisma

4. **Schemas** (`src/schemas/`) - Validação de dados com Zod
   - Valida requisições HTTP
   - Garante tipos corretos
   - Mensagens de erro padronizadas

5. **Middlewares** (`src/middlewares/`) - Intercepta requisições
   - `authMiddleware` - Verifica autenticação JWT
   - `companyAccessMiddleware` - Verifica acesso à empresa
   - `validateMiddleware` - Valida dados com Zod
   - `errorHandler` - Trata erros globalmente
   - `uploadMiddleware` - Gerencia upload de arquivos

6. **Prisma** - ORM para banco de dados
   - Schema define modelos
   - Migrations gerenciam mudanças no banco
   - Prisma Client gera queries type-safe

#### **Frontend (Next.js)**

1. **Pages/Routes** (`src/app/`) - Rotas da aplicação
   - App Router do Next.js 14
   - Roteamento baseado em arquivos

2. **Components** (`src/components/`) - Componentes React reutilizáveis
   - Componentes de UI (Shadcn/ui)
   - Formulários
   - Tabelas e listas

3. **Contexts** (`src/contexts/`) - Estado global
   - `AuthContext` - Gerencia autenticação
   - `ExtensionsContext` - Gerencia extensões ativas

4. **Services** (`src/lib/api.ts`) - Cliente HTTP (Axios)
   - Configuração base
   - Interceptors para tokens
   - Tratamento de erros

### 2. Fluxo de Desenvolvimento

1. **Definir Schema** (Prisma) → Criar/atualizar `schema.prisma`
2. **Criar Migration** → `npm run prisma:migrate`
3. **Criar Schema Zod** → Validar dados de entrada
4. **Criar Service** → Lógica de negócio
5. **Criar Controller** → Recebe requisição, chama service
6. **Criar Route** → Define endpoint e middlewares
7. **Testar** → Via Postman/Insomnia ou frontend

---

## 🔄 Fluxo de Funcionamento

### 1. Fluxo de Autenticação

#### **Registro de Usuário**

```
1. Usuário acessa /register (frontend)
   ↓
2. Preenche formulário (email, nome, senha)
   ↓
3. Frontend valida com Zod
   ↓
4. POST /api/auth/register (backend)
   ↓
5. authController.register() valida entrada
   ↓
6. authService.registerUser():
   - Hash da senha com bcrypt
   - Verifica se email já existe
   - Cria usuário no banco via Prisma
   ↓
7. Retorna sucesso
   ↓
8. Frontend redireciona para /login
```

#### **Login**

```
1. Usuário acessa /login (frontend)
   ↓
2. Preenche email e senha
   ↓
3. POST /api/auth/login (backend)
   ↓
4. authController.login() valida entrada
   ↓
5. authService.loginUser():
   - Busca usuário no banco
   - Compara senha com bcrypt
   - Gera accessToken (JWT, expira em 1h)
   - Gera refreshToken (JWT, expira em 7 dias)
   - Salva refreshToken no banco
   ↓
6. Retorna { user, tokens }
   ↓
7. Frontend salva tokens no localStorage
   ↓
8. Redireciona para /select-company
```

#### **Seleção de Empresa**

```
1. Usuário autenticado acessa /select-company
   ↓
2. Frontend lista empresas do usuário (GET /api/companies)
   ↓
3. Usuário seleciona ou cria empresa
   ↓
4. Salva companyId no localStorage
   ↓
5. Redireciona para /workspace (dashboard)
```

#### **Refresh Token (Renovação Automática)**

```
1. Frontend faz requisição autenticada
   ↓
2. Backend retorna 401 (token expirado)
   ↓
3. Axios interceptor detecta 401
   ↓
4. POST /api/auth/refresh com refreshToken
   ↓
5. Backend valida refreshToken
   ↓
6. Gera novo accessToken
   ↓
7. Retorna novo token
   ↓
8. Frontend atualiza token no localStorage
   ↓
9. Repete requisição original com novo token
```

### 2. Fluxo de Requisições Autenticadas

```
1. Frontend faz requisição (ex: GET /api/products)
   ↓
2. Axios interceptor adiciona:
   Authorization: Bearer <accessToken>
   ↓
3. Backend recebe requisição
   ↓
4. authMiddleware:
   - Extrai token do header
   - Valida token JWT
   - Busca usuário no banco
   - Adiciona req.user
   ↓
5. companyAccessMiddleware (se necessário):
   - Verifica se usuário tem acesso à empresa
   - Adiciona req.companyId
   ↓
6. Controller recebe requisição:
   - Chama service com dados do request
   ↓
7. Service:
   - Executa lógica de negócio
   - Consulta/atualiza banco via Prisma
   ↓
8. Controller retorna resposta JSON
   ↓
9. Frontend recebe e atualiza UI
```

### 3. Fluxo de Gestão de Produtos

#### **Cadastro de Produto**

```
1. Usuário acessa /workspace/products
   ↓
2. Clica em "Novo Produto"
   ↓
3. Preenche formulário:
   - Nome, descrição, código de barras
   - Categoria, preço, estoque mínimo/máximo
   ↓
4. Frontend valida com Zod
   ↓
5. POST /api/products (com companyId no body)
   ↓
6. productController.create():
   - Valida entrada com Zod
   - Chama productService.createProduct()
   ↓
7. productService.createProduct():
   - Verifica se código de barras já existe
   - Cria produto no banco via Prisma
   - Inicializa currentStock = 0
   ↓
8. Retorna produto criado
   ↓
9. Frontend atualiza lista de produtos
```

#### **Movimentação de Estoque**

```
1. Usuário registra entrada/saída
   ↓
2. POST /api/movements:
   {
     productId: 1,
     type: "IN", // ou "OUT"
     quantity: 10,
     reason: "Compra"
   }
   ↓
3. movementController.create():
   - Valida entrada
   - Chama movementService.createMovement()
   ↓
4. movementService.createMovement():
   - Cria registro em StockMovement
   - Atualiza Product.currentStock:
     * Se type = "IN": currentStock += quantity
     * Se type = "OUT": currentStock -= quantity
   - Atualiza Product.lastMovementAt
   ↓
5. Retorna movimentação criada
   ↓
6. Frontend atualiza exibição do estoque
```

### 4. Fluxo de Vendas

```
1. Usuário registra venda:
   - Seleciona produtos
   - Informa quantidades
   - Seleciona cliente (opcional)
   - Escolhe forma de pagamento
   ↓
2. POST /api/sales:
   {
     items: [
       { productId: 1, quantity: 2, unitPrice: 10.00 }
     ],
     customerName: "Cliente",
     paymentMethod: "PIX"
   }
   ↓
3. saleController.create():
   - Valida entrada
   - Chama saleService.createSale()
   ↓
4. saleService.createSale():
   - Cria registro em Sale
   - Para cada item:
     * Cria SaleItem
     * Atualiza Product.currentStock (diminui)
     * Cria StockMovement (type: "OUT")
   - Calcula total da venda
   ↓
5. Retorna venda criada
   ↓
6. Frontend atualiza dashboard e estoque
```

### 5. Sistema de Extensões

O sistema suporta **extensões modulares**:

- **products_management** - Gestão de produtos (padrão)
- **services_management** - Gestão de serviços
- **appointments** - Sistema de agendamentos (requer services_management)
- **restaurant** - Sistema de restaurante/pizzaria

#### **Fluxo de Extensões**

```
1. Empresa adquire extensão
   ↓
2. Backend cria registro em CompanyExtension:
   {
     companyId: 1,
     extensionId: 2, // appointments
     isActive: true
   }
   ↓
3. Frontend consulta extensões:
   GET /api/company-extensions?companyId=1
   ↓
4. ExtensionsContext armazena extensões ativas
   ↓
5. Componentes verificam extensões:
   if (hasExtension('appointments')) {
     // Renderiza funcionalidade
   }
   ↓
6. Rotas são renderizadas condicionalmente
```

---

## 🛠️ Tecnologias Utilizadas

### Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | 20.x | Runtime JavaScript |
| **TypeScript** | 5.3+ | Tipagem estática |
| **Express.js** | 4.18+ | Framework web |
| **Prisma** | 5.7+ | ORM para banco de dados |
| **SQLite** | - | Banco de dados (desenvolvimento) |
| **MySQL** | - | Banco de dados (produção) |
| **JWT** | 9.0+ | Autenticação |
| **Zod** | 3.22+ | Validação de schemas |
| **bcrypt** | 5.1+ | Hash de senhas |
| **Multer** | 2.0+ | Upload de arquivos |
| **Winston** | 3.19+ | Sistema de logs |
| **Helmet.js** | 7.2+ | Segurança HTTP |
| **express-rate-limit** | 7.5+ | Proteção DDoS |

### Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Next.js** | 14.2+ | Framework React |
| **React** | 18.3+ | Biblioteca UI |
| **TypeScript** | 5.3+ | Tipagem estática |
| **Tailwind CSS** | 3.4+ | Framework CSS |
| **Shadcn/ui** | - | Componentes UI |
| **React Hook Form** | 7.49+ | Formulários |
| **Zod** | 3.22+ | Validação de formulários |
| **Axios** | 1.6+ | Cliente HTTP |
| **html5-qrcode** | 2.3+ | Scanner de código de barras |
| **Recharts** | 2.10+ | Gráficos |
| **next-themes** | 0.4+ | Temas (claro/escuro) |

### Mobile

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React Native** | - | Framework mobile |
| **Expo** | - | Plataforma de desenvolvimento |
| **TypeScript** | 5.3+ | Tipagem estática |

---

## 🚀 Como Colocar no Ar (Deploy)

### Pré-requisitos

- VPS com Ubuntu/Debian
- Node.js 20+ instalado
- MySQL instalado
- Git instalado
- Acesso SSH ao servidor
- Domínio configurado (opcional, mas recomendado)

---

## 📦 PASSO 1: Preparação do Servidor

### 1.1 Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Instalar Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version  # Deve ser 20.x
npm --version   # Deve ser 10.x+
```

### 1.3 Instalar MySQL

```bash
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
sudo mysql_secure_installation
```

**Durante a configuração:**
- Definir senha do root
- Remover usuários anônimos: **Y**
- Desabilitar login remoto root: **Y**
- Remover banco de teste: **Y**
- Recarregar privilégios: **Y**

### 1.4 Criar Banco de Dados MySQL

```bash
sudo mysql -u root -p
```

```sql
-- Criar banco de dados
CREATE DATABASE estoquelua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário dedicado
CREATE USER 'estoquelua_user'@'localhost' IDENTIFIED BY 'SUA_SENHA_SEGURA_AQUI';

-- Dar permissões
GRANT ALL PRIVILEGES ON estoquelua.* TO 'estoquelua_user'@'localhost';
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;
EXIT;
```

**⚠️ IMPORTANTE:** Substitua `SUA_SENHA_SEGURA_AQUI` por uma senha forte!

### 1.5 Instalar PM2

```bash
sudo npm install -g pm2
```

### 1.6 Configurar Firewall (UFW)

```bash
# Permitir SSH (IMPORTANTE: fazer antes de habilitar!)
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Verificar
sudo ufw status verbose
```

---

## 📦 PASSO 2: Deploy da Aplicação Backend

### 2.1 Clonar Repositório

```bash
# Ir para diretório de aplicações
cd /var/www  # ou outro diretório de sua preferência

# Clonar repositório
git clone <URL_DO_SEU_REPOSITORIO> estoquelua
cd estoquelua/backend
```

### 2.2 Instalar Dependências

```bash
# Instalar apenas dependências de produção
npm install --production
```

### 2.3 Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar arquivo
nano .env
```

**Configurar `.env` com:**

```env
# Ambiente
NODE_ENV=production
PORT=3001

# Banco de Dados MySQL (OBRIGATÓRIO em produção)
DATABASE_URL="mysql://estoquelua_user:SUA_SENHA_AQUI@localhost:3306/estoquelua"

# JWT Secrets (gerar com: openssl rand -base64 32)
JWT_SECRET=GERAR_SECRET_AQUI_COM_32_CARACTERES_MINIMO
JWT_REFRESH_SECRET=GERAR_OUTRO_SECRET_AQUI_COM_32_CARACTERES_MINIMO

# CORS (origens permitidas separadas por vírgula)
CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com

# Rate Limiting (opcional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Upload
UPLOAD_DIR=./uploads
```

**Gerar secrets JWT:**
```bash
openssl rand -base64 32
# Use o resultado para JWT_SECRET e gere outro para JWT_REFRESH_SECRET
```

### 2.4 Configurar Banco de Dados

```bash
# Gerar Prisma Client
npm run prisma:generate

# Aplicar migrações (cria tabelas no MySQL)
npm run prisma:migrate:deploy

# Verificar status
npm run prisma:migrate:status
```

### 2.5 Build do Projeto

```bash
# Compilar TypeScript
npm run build

# Verificar se build foi bem-sucedido
ls -la dist/
# Deve existir dist/server.js
```

### 2.6 Criar Diretórios Necessários

```bash
mkdir -p logs uploads/logos uploads/avatars uploads/menu-items

# Dar permissões
chmod -R 755 uploads logs
```

---

## 📦 PASSO 3: Iniciar Aplicação com PM2

### 3.1 Iniciar Aplicação

```bash
# Iniciar com PM2
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs
pm2 logs estoquelua-backend
```

### 3.2 Salvar Configuração PM2

```bash
# Salvar configuração
pm2 save

# Configurar inicialização no boot
pm2 startup
# Copiar e executar o comando exibido (será algo como):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u seu_usuario --hp /home/seu_usuario
```

### 3.3 Verificar Funcionamento

```bash
# Testar health check
curl http://localhost:3001/api/health

# Deve retornar:
# {
#   "success": true,
#   "status": "ok",
#   "database": { "status": "connected", "provider": "MySQL" },
#   ...
# }
```

---

## 📦 PASSO 4: Configurar Nginx (Proxy Reverso)

### 4.1 Instalar Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4.2 Configurar Site

```bash
# Criar configuração
sudo nano /etc/nginx/sites-available/estoquelua-api
```

**Conteúdo do arquivo:**

```nginx
server {
    listen 80;
    server_name api.seu-dominio.com;  # Substitua pelo seu domínio

    # Logs
    access_log /var/log/nginx/estoquelua-api-access.log;
    error_log /var/log/nginx/estoquelua-api-error.log;

    # Tamanho máximo de upload
    client_max_body_size 10M;

    # Proxy para backend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### 4.3 Ativar Site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/estoquelua-api /etc/nginx/sites-enabled/

# Remover site padrão (se existir)
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 📦 PASSO 5: Configurar SSL/HTTPS (Let's Encrypt)

### 5.1 Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 Obter Certificado SSL

```bash
# Obter certificado (substitua pelo seu domínio)
sudo certbot --nginx -d api.seu-dominio.com

# Seguir instruções:
# - Email: seu email
# - Aceitar termos: Y
# - Compartilhar email: N (ou Y, sua escolha)
```

### 5.3 Verificar Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Verificar timer
sudo systemctl status certbot.timer
```

**O certificado será renovado automaticamente!**

---

## 📦 PASSO 6: Configurar Backup Automático

### 6.1 Criar Script de Backup

```bash
# Criar diretório de backups
sudo mkdir -p /var/backups/estoquelua
sudo chown $USER:$USER /var/backups/estoquelua

# Criar script
nano ~/backup-estoquelua.sh
```

**Conteúdo do script:**

```bash
#!/bin/bash

# Configurações
DB_NAME="estoquelua"
DB_USER="estoquelua_user"
DB_PASS="SUA_SENHA_AQUI"
BACKUP_DIR="/var/backups/estoquelua"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/estoquelua_$DATE.sql"

# Criar backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_FILE

# Comprimir
gzip $BACKUP_FILE

# Remover backups antigos (manter últimos 7 dias)
find $BACKUP_DIR -name "estoquelua_*.sql.gz" -mtime +7 -delete

echo "Backup criado: $BACKUP_FILE.gz"
```

**Dar permissão de execução:**
```bash
chmod +x ~/backup-estoquelua.sh
```

### 6.2 Configurar Cron para Backup Automático

```bash
# Editar crontab
crontab -e

# Adicionar linha (backup diário às 2h da manhã)
0 2 * * * /home/seu_usuario/backup-estoquelua.sh >> /var/log/estoquelua-backup.log 2>&1
```

**Substitua `/home/seu_usuario` pelo seu caminho real!**

---

## 📦 PASSO 7: Deploy do Frontend

### Opção A: Deploy no Vercel (Recomendado)

1. Conecte seu repositório GitHub ao Vercel
2. Configure variáveis de ambiente:
   - `NEXT_PUBLIC_API_URL=https://api.seu-dominio.com/api`
3. Deploy automático a cada push

### Opção B: Deploy no VPS Próprio

```bash
cd /var/www/estoquelua/web

# Instalar dependências
npm install --production

# Build
npm run build

# Iniciar com PM2
pm2 start npm --name "estoquelua-web" -- start

# Salvar
pm2 save
```

**Configurar Nginx para frontend:**

```bash
sudo nano /etc/nginx/sites-available/estoquelua-web
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/estoquelua-web /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configurar SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

---

## ✅ Verificações Finais

Execute cada comando e verifique:

```bash
# 1. PM2 está rodando
pm2 status
# Deve mostrar estoquelua-backend como "online"

# 2. Health check funciona
curl http://localhost:3001/api/health
# Deve retornar JSON com "status": "ok"

# 3. Nginx está rodando
sudo systemctl status nginx
# Deve estar "active (running)"

# 4. MySQL está rodando
sudo systemctl status mysql
# Deve estar "active (running)"

# 5. SSL está configurado
curl -I https://api.seu-dominio.com/api/health
# Deve retornar status 200

# 6. Testar do computador local
curl https://api.seu-dominio.com/api/health
# Deve retornar JSON válido
```

---

## 🔧 Manutenção e Monitoramento

### Comandos PM2 Úteis

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs estoquelua-backend

# Reiniciar aplicação
pm2 restart estoquelua-backend

# Parar aplicação
pm2 stop estoquelua-backend

# Ver uso de recursos
pm2 monit

# Ver informações detalhadas
pm2 show estoquelua-backend
```

### Verificar Logs

```bash
# Logs da aplicação (Winston)
tail -f logs/combined-*.log
tail -f logs/error-*.log

# Logs do PM2
pm2 logs estoquelua-backend

# Logs do Nginx
sudo tail -f /var/log/nginx/estoquelua-api-access.log
sudo tail -f /var/log/nginx/estoquelua-api-error.log
```

### Atualizar Aplicação

```bash
cd /var/www/estoquelua

# Atualizar código
git pull origin main  # ou prod

# Backend
cd backend
npm install --production
npm run prisma:migrate:deploy  # Se houver novas migrações
npm run build
pm2 restart estoquelua-backend

# Frontend (se no VPS)
cd ../web
npm install --production
npm run build
pm2 restart estoquelua-web
```

---

## 🚨 Troubleshooting

### Problema: Aplicação não inicia

```bash
# Verificar logs
pm2 logs estoquelua-backend

# Verificar se build foi feito
ls -la dist/server.js

# Verificar variáveis de ambiente
cat .env

# Testar manualmente
node dist/server.js
```

### Problema: Erro de conexão com banco

```bash
# Testar conexão MySQL
mysql -u estoquelua_user -p estoquelua

# Verificar se banco existe
mysql -u root -p -e "SHOW DATABASES;"

# Verificar permissões
mysql -u root -p -e "SHOW GRANTS FOR 'estoquelua_user'@'localhost';"
```

### Problema: CORS bloqueando requisições

```bash
# Verificar CORS_ORIGINS no .env
cat .env | grep CORS_ORIGINS

# Verificar logs
pm2 logs estoquelua-backend | grep CORS
```

### Problema: Certificado SSL expirando

```bash
# Renovar manualmente
sudo certbot renew

# Verificar status
sudo certbot certificates
```

---

## 📊 Checklist de Deploy

Antes de considerar o deploy completo:

### Backend
- [ ] Node.js 20+ instalado
- [ ] MySQL instalado e rodando
- [ ] Banco de dados `estoquelua` criado
- [ ] Usuário MySQL criado com permissões
- [ ] Repositório clonado
- [ ] Dependências instaladas
- [ ] Arquivo `.env` configurado
- [ ] JWT secrets gerados
- [ ] Prisma Client gerado
- [ ] Migrações aplicadas
- [ ] Build compilado sem erros
- [ ] Diretórios criados (logs, uploads)
- [ ] PM2 instalado e configurado
- [ ] Aplicação rodando no PM2
- [ ] PM2 configurado para iniciar no boot
- [ ] Health check retorna `status: ok`

### Servidor
- [ ] Nginx instalado e configurado
- [ ] Proxy reverso funcionando
- [ ] SSL/HTTPS configurado (Let's Encrypt)
- [ ] Firewall configurado (UFW)
- [ ] Backup automático configurado

### Frontend
- [ ] Build compilado
- [ ] Variáveis de ambiente configuradas
- [ ] Deployado (Vercel/VPS)
- [ ] SSL configurado
- [ ] Testes de integração funcionando

---

## 🔐 Segurança

### Recomendações

1. **Atualizar sistema regularmente:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Monitorar logs:**
   ```bash
   tail -f logs/error-*.log
   ```

3. **Backup regular:**
   - Verificar se backups estão sendo criados
   - Testar restauração periodicamente

4. **Atualizar dependências:**
   ```bash
   npm audit
   npm audit fix
   ```

5. **Monitorar recursos:**
   ```bash
   pm2 monit
   htop
   ```

---

## 📞 Suporte e Documentação Adicional

- **Guia de Deploy Detalhado**: Veja `GUIA_DEPLOY.md`
- **Guia Completo**: Veja `GUIA_COMPLETO.md`
- **README Principal**: Veja `README.md`
- **Documentação Prisma**: https://www.prisma.io/docs
- **Documentação Next.js**: https://nextjs.org/docs
- **Documentação PM2**: https://pm2.keymetrics.io/docs

---

**Versão:** 1.0.0  
**Última atualização:** Dezembro 2024  
**Desenvolvido por:** Lualabs

