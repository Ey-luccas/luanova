# 📚 Guia Completo - EstoqueLua

Este guia documenta como o projeto **EstoqueLua** foi desenvolvido, seu fluxo de funcionamento e como colocá-lo em produção.

---

## 📋 Índice

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura e Tecnologias](#arquitetura-e-tecnologias)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
5. [Configuração para Desenvolvimento](#configuração-para-desenvolvimento)
6. [Deploy em Produção](#deploy-em-produção)
7. [Manutenção e Monitoramento](#manutenção-e-monitoramento)

---

## 🎯 Visão Geral do Projeto

O **EstoqueLua** é um sistema completo de gestão de estoque desenvolvido pela **Lualabs**, composto por:

- **Backend API REST** - Servidor Node.js com Express e Prisma
- **Frontend Web** - Painel administrativo em Next.js 14
- **Aplicativo Mobile** - App React Native com Expo (em desenvolvimento)

### Principais Funcionalidades

- ✅ Gestão de produtos e serviços
- ✅ Controle de estoque em tempo real
- ✅ Sistema de movimentações (entrada/saída)
- ✅ Registro de vendas e prestações de serviço
- ✅ Scanner de código de barras
- ✅ Sistema multi-empresa
- ✅ Extensões modulares (Agendamentos, Restaurante)
- ✅ Dashboard com relatórios e métricas
- ✅ Autenticação JWT com refresh tokens

---

## 🏗️ Arquitetura e Tecnologias

### Backend

O backend é uma **API REST** construída com:

- **Node.js** (v20+) + **TypeScript** - Runtime e linguagem
- **Express.js** - Framework web
- **Prisma ORM** - Gerenciamento de banco de dados
- **SQLite** (desenvolvimento) / **MySQL** (produção)
- **JWT** (jsonwebtoken) - Autenticação e autorização
- **Zod** - Validação de schemas e dados
- **Winston** - Sistema de logs
- **Helmet.js** - Segurança HTTP
- **Rate Limiting** - Proteção contra DDoS
- **Multer** - Upload de arquivos
- **bcrypt** - Hash de senhas

### Frontend Web

O frontend é uma **SPA (Single Page Application)** construída com:

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de formulários (integrado com React Hook Form)
- **Tailwind CSS** - Framework de estilização
- **Shadcn/ui** - Biblioteca de componentes UI
- **Axios** - Cliente HTTP
- **html5-qrcode** - Scanner de código de barras
- **Recharts** - Gráficos e visualizações
- **Next Themes** - Gerenciamento de temas (claro/escuro)

### Mobile

- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Tipagem estática

### Banco de Dados

- **Desenvolvimento**: SQLite (arquivo `dev.db`)
- **Produção**: MySQL (obrigatório)

O Prisma gerencia a migração automática entre os dois bancos.

---

## 📁 Estrutura do Projeto

```
estoquelua/
│
├── backend/                 # API REST
│   ├── src/
│   │   ├── config/         # Configurações (env, logger, prisma)
│   │   ├── controllers/    # Controladores das rotas (lógica HTTP)
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
│   │   ├── logos/          # Logos das empresas
│   │   ├── avatars/        # Avatares de usuários
│   │   └── menu-items/     # Imagens do menu (extensão restaurante)
│   │
│   ├── logs/               # Logs da aplicação
│   ├── dist/               # Código compilado (TypeScript → JavaScript)
│   ├── ecosystem.config.js # Configuração PM2
│   ├── package.json
│   └── tsconfig.json
│
├── web/                    # Frontend Web
│   ├── src/
│   │   ├── app/            # Rotas Next.js (App Router)
│   │   │   ├── (auth)/     # Rotas de autenticação
│   │   │   ├── workspace/  # Área de trabalho (protegida)
│   │   │   └── layout.tsx  # Layout raiz
│   │   │
│   │   ├── components/     # Componentes React reutilizáveis
│   │   ├── contexts/       # Contextos React (Auth, Extensions)
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilitários (api, utils)
│   │   ├── types/          # Tipos TypeScript
│   │   └── utils/          # Funções utilitárias
│   │
│   ├── public/             # Arquivos estáticos
│   ├── package.json
│   └── next.config.js
│
├── mobile/                 # App Mobile
│   ├── app/                # Navegação Expo
│   ├── src/                # Código fonte
│   └── package.json
│
├── shared/                 # Código compartilhado
│   ├── types/              # Tipos TypeScript compartilhados
│   └── utils/              # Utilitários compartilhados
│
├── package.json            # Scripts do monorepo
├── README.md
├── GUIA_DEPLOY.md          # Guia detalhado de deploy
└── GUIA_COMPLETO.md        # Este arquivo
```

---

## 🔄 Fluxo de Funcionamento

### 1. Fluxo de Autenticação

#### Login
```
1. Usuário acessa /login
2. Preenche email e senha
3. Frontend envia POST /api/auth/login
4. Backend valida credenciais
5. Backend gera tokens (accessToken + refreshToken)
6. Frontend salva tokens no localStorage
7. Frontend redireciona para /workspace
```

#### Seleção de Empresa
```
1. Usuário autenticado acessa /select-company
2. Sistema lista empresas do usuário
3. Usuário seleciona ou cria empresa
4. companyId é salvo no localStorage
5. Redireciona para /workspace (dashboard)
```

#### Refresh Token
```
1. Frontend detecta token expirado (401)
2. Envia refreshToken para /api/auth/refresh
3. Backend valida refreshToken
4. Backend gera novo accessToken
5. Frontend atualiza accessToken no localStorage
6. Requisição original é repetida com novo token
```

### 2. Fluxo de Requisições HTTP

#### Requisição Autenticada
```
1. Frontend faz requisição (ex: GET /api/products)
2. Axios interceptor adiciona Authorization: Bearer <token>
3. Backend middleware valida token
4. Backend verifica permissões (se aplicável)
5. Controller chama Service
6. Service consulta banco via Prisma
7. Resposta retornada ao frontend
```

#### Tratamento de Erros
```
401 (Não autenticado):
  - Frontend tenta refresh token
  - Se falhar, redireciona para /login

403 (Sem permissão):
  - Exibe mensagem de erro
  - Não redireciona

500 (Erro do servidor):
  - Log registrado no backend
  - Frontend exibe mensagem genérica
```

### 3. Fluxo de Gestão de Produtos

#### Cadastro de Produto
```
1. Usuário acessa /workspace/products
2. Clica em "Novo Produto"
3. Preenche formulário (nome, código de barras, preço, etc)
4. Frontend valida com Zod
5. POST /api/products
6. Backend valida com schema Zod
7. Backend verifica se código de barras já existe
8. Prisma cria produto no banco
9. Frontend atualiza lista
```

#### Movimentação de Estoque
```
1. Usuário registra entrada/saída
2. POST /api/movements
3. Backend cria registro em StockMovement
4. Backend atualiza currentStock do Product
5. Frontend atualiza exibição
```

### 4. Fluxo de Vendas

#### Registrar Venda
```
1. Usuário seleciona produto
2. Informa quantidade e cliente
3. Seleciona forma de pagamento
4. POST /api/sales
5. Backend:
   - Cria registro em Sale
   - Atualiza estoque (currentStock)
   - Cria movimentação (StockMovement)
6. Frontend atualiza dashboard
```

### 5. Sistema de Extensões

O sistema suporta **extensões modulares**:

- **products_management** - Gestão de produtos (padrão)
- **services_management** - Gestão de serviços
- **appointments** - Sistema de agendamentos (requer services_management)
- **restaurant** - Sistema de restaurante/pizzaria

#### Fluxo de Extensões
```
1. Empresa adquire extensão
2. Backend cria registro em CompanyExtension
3. Frontend consulta extensões ativas
4. Frontend exibe/oculta funcionalidades baseado em extensões
5. Rotas e componentes condicionalmente renderizados
```

---

## ⚙️ Configuração para Desenvolvimento

### Pré-requisitos

- **Node.js** 20.x ou superior
- **npm** 10.x ou superior
- **Git**

### Instalação Rápida

```bash
# 1. Clonar repositório
git clone <url-do-repositorio>
cd estoquelua

# 2. Instalar dependências de todos os projetos
npm run install:all

# 3. Configurar backend
cd backend
cp .env.example .env
# Editar .env com suas configurações

# 4. Configurar banco de dados
npm run prisma:generate
npm run prisma:migrate

# 5. Voltar para raiz e iniciar
cd ..
npm run dev
```

### Variáveis de Ambiente

#### Backend (`backend/.env`)

```env
# Ambiente
NODE_ENV=development
PORT=3001

# Banco de Dados
DATABASE_URL="file:./prisma/dev.db"  # SQLite para desenvolvimento

# JWT Secrets (gerar com: openssl rand -base64 32)
JWT_SECRET=seu-jwt-secret-aqui
JWT_REFRESH_SECRET=seu-refresh-secret-aqui

# CORS (origens permitidas)
CORS_ORIGINS=http://localhost:3000

# Rate Limiting (opcional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Upload
UPLOAD_DIR=./uploads
```

#### Frontend (`web/.env.local` - opcional)

O frontend detecta automaticamente a URL da API baseado no hostname. Se necessário, configure:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Scripts Disponíveis

#### Na Raiz do Projeto

```bash
npm run dev              # Inicia backend + frontend
npm run install:all      # Instala dependências de todos os projetos
npm run build            # Compila todos os projetos
```

#### Backend

```bash
npm run dev              # Modo desenvolvimento (hot reload)
npm run build            # Compila TypeScript
npm start                # Inicia servidor compilado
npm run prisma:generate  # Gera cliente Prisma
npm run prisma:migrate   # Aplica migrações
npm run prisma:studio    # Abre Prisma Studio (GUI do banco)
```

#### Frontend

```bash
npm run dev              # Modo desenvolvimento
npm run build            # Compila para produção
npm start                # Inicia servidor de produção
npm run lint             # Executa linter
```

### Acessar o Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health
- **Prisma Studio**: Execute `npm run prisma:studio` no backend

### Primeiro Acesso

1. Acesse http://localhost:3000
2. Clique em "Criar conta"
3. Registre um usuário
4. Após login, crie ou selecione uma empresa
5. Você será redirecionado para o Dashboard

---

## 🚀 Deploy em Produção

### Visão Geral

O deploy envolve:

1. **Servidor VPS** (Ubuntu/Debian)
2. **MySQL** (banco de dados)
3. **PM2** (gerenciador de processos Node.js)
4. **Nginx** (proxy reverso e SSL)
5. **Let's Encrypt** (certificados SSL)

### Passo a Passo Resumido

#### 1. Preparação do Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Instalar PM2
sudo npm install -g pm2

# Configurar firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### 2. Configurar Banco de Dados MySQL

```bash
# Acessar MySQL
sudo mysql -u root -p

# Criar banco e usuário
CREATE DATABASE estoquelua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'estoquelua_user'@'localhost' IDENTIFIED BY 'SENHA_SEGURA';
GRANT ALL PRIVILEGES ON estoquelua.* TO 'estoquelua_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Deploy da Aplicação

```bash
# Clonar repositório
cd /var/www
git clone <url-do-repositorio> estoquelua
cd estoquelua/backend

# Instalar dependências
npm install --production

# Configurar .env
cp .env.example .env
nano .env  # Configurar com dados de produção
```

**Configuração do `.env` em produção:**

```env
NODE_ENV=production
PORT=3001

# MySQL OBRIGATÓRIO em produção
DATABASE_URL="mysql://estoquelua_user:SENHA_SEGURA@localhost:3306/estoquelua"

# JWT Secrets (gerar novos com: openssl rand -base64 32)
JWT_SECRET=<gerar-novo>
JWT_REFRESH_SECRET=<gerar-novo>

# CORS (domínios permitidos)
CORS_ORIGINS=https://luanova.cloud,https://www.luanova.cloud

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

```bash
# Gerar Prisma Client
npm run prisma:generate

# Aplicar migrações
npm run prisma:migrate:deploy

# Build
npm run build

# Criar diretórios
mkdir -p logs uploads/logos uploads/avatars uploads/menu-items
```

#### 4. Iniciar com PM2

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar inicialização no boot
pm2 startup
# Executar o comando exibido
```

#### 5. Configurar Nginx

```bash
# Instalar Nginx
sudo apt install nginx -y

# Criar configuração
sudo nano /etc/nginx/sites-available/estoquelua-api
```

**Conteúdo do arquivo:**

```nginx
server {
    listen 80;
    server_name api.luanova.cloud;  # Seu domínio

    client_max_body_size 10M;

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
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/estoquelua-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 6. Configurar SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado
sudo certbot --nginx -d api.luanova.cloud

# Verificar renovação automática
sudo certbot renew --dry-run
```

#### 7. Configurar Backup Automático

```bash
# Criar script de backup
nano ~/backup-estoquelua.sh
```

**Conteúdo do script:**

```bash
#!/bin/bash
DB_NAME="estoquelua"
DB_USER="estoquelua_user"
DB_PASS="SENHA_SEGURA"
BACKUP_DIR="/var/backups/estoquelua"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/estoquelua_$DATE.sql"

mkdir -p $BACKUP_DIR
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_FILE
gzip $BACKUP_FILE

# Remover backups antigos (7 dias)
find $BACKUP_DIR -name "estoquelua_*.sql.gz" -mtime +7 -delete
```

```bash
# Dar permissão
chmod +x ~/backup-estoquelua.sh

# Configurar cron (backup diário às 2h)
crontab -e
# Adicionar: 0 2 * * * /home/seu_usuario/backup-estoquelua.sh
```

### Verificações Finais

```bash
# 1. PM2 rodando
pm2 status

# 2. Health check
curl http://localhost:3001/api/health

# 3. Nginx rodando
sudo systemctl status nginx

# 4. MySQL rodando
sudo systemctl status mysql

# 5. SSL funcionando
curl -I https://api.luanova.cloud/api/health
```

### Deploy do Frontend

O frontend pode ser deployado em:

- **Vercel** (recomendado para Next.js)
- **Netlify**
- **VPS próprio** (com Nginx)

#### Deploy no Vercel

1. Conecte o repositório GitHub
2. Configure variáveis de ambiente:
   - `NEXT_PUBLIC_API_URL=https://api.luanova.cloud/api`
3. Deploy automático a cada push

#### Deploy no VPS Próprio

```bash
cd /var/www/estoquelua/web

# Build
npm run build

# Instalar PM2 (se ainda não tiver)
sudo npm install -g pm2

# Iniciar
pm2 start npm --name "estoquelua-web" -- start

# Configurar Nginx para frontend
sudo nano /etc/nginx/sites-available/estoquelua-web
```

**Configuração Nginx para frontend:**

```nginx
server {
    listen 80;
    server_name luanova.cloud www.luanova.cloud;

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

---

## 🔧 Manutenção e Monitoramento

### Comandos PM2 Úteis

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs estoquelua-backend

# Reiniciar
pm2 restart estoquelua-backend

# Parar
pm2 stop estoquelua-backend

# Monitorar recursos
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
npm run prisma:migrate:deploy  # Se houver migrações
npm run build
pm2 restart estoquelua-backend

# Frontend (se no VPS)
cd ../web
npm install --production
npm run build
pm2 restart estoquelua-web
```

### Troubleshooting

#### Aplicação não inicia

```bash
# Ver logs
pm2 logs estoquelua-backend

# Verificar build
ls -la dist/server.js

# Verificar .env
cat .env

# Testar manualmente
node dist/server.js
```

#### Erro de conexão com banco

```bash
# Testar conexão MySQL
mysql -u estoquelua_user -p estoquelua

# Verificar se banco existe
mysql -u root -p -e "SHOW DATABASES;"
```

#### CORS bloqueando requisições

```bash
# Verificar CORS_ORIGINS no .env
cat .env | grep CORS_ORIGINS

# Ver logs
pm2 logs estoquelua-backend | grep CORS
```

#### Certificado SSL expirando

```bash
# Renovar manualmente
sudo certbot renew

# Verificar status
sudo certbot certificates
```

---

## 📊 Checklist de Deploy

Antes de considerar o deploy completo, verifique:

### Backend

- [ ] Node.js 20+ instalado
- [ ] MySQL instalado e rodando
- [ ] Banco de dados criado
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
- **README Principal**: Veja `README.md`
- **Documentação Prisma**: https://www.prisma.io/docs
- **Documentação Next.js**: https://nextjs.org/docs
- **Documentação PM2**: https://pm2.keymetrics.io/docs

---

**Versão:** 1.0.0  
**Última atualização:** Dezembro 2024  
**Desenvolvido por:** Lualabs

