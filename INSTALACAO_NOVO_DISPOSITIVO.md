# 🚀 Guia de Instalação - Dispositivo Novo

Este guia mostra como configurar e rodar o projeto **EstoqueLua** em um dispositivo novo.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 20.x ou superior
- **npm** 10.x ou superior
- **Git**

### Verificar Instalações

```bash
node --version   # Deve ser v20.x ou superior
npm --version    # Deve ser 10.x ou superior
git --version    # Qualquer versão recente
```

## 🔧 Instalação Passo a Passo

### 1. Clonar o Repositório

```bash
# Via SSH (recomendado)
git clone git@github.com:Ey-luccas/luanova.git
cd luanova

# OU via HTTPS
git clone https://github.com/Ey-luccas/luanova.git
cd luanova
```

### 2. Instalar Dependências

```bash
# Instala dependências de todos os projetos (raiz, backend e web)
npm run install:all
```

Isso irá instalar:

- ✅ Dependências da raiz do projeto
- ✅ Dependências do backend
- ✅ Dependências do frontend (web)

### 3. Configurar Backend

```bash
cd backend

# Copiar arquivo de exemplo de variáveis de ambiente
cp .env.example .env

# Editar o arquivo .env (opcional, os valores padrão funcionam)
# nano .env  ou  code .env  ou  vim .env
```

**Arquivo `.env` mínimo necessário:**

```env
PORT=3001
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=seu-jwt-secret-aqui-mude-este-valor
JWT_REFRESH_SECRET=seu-refresh-secret-aqui-mude-este-valor
UPLOAD_DIR=./uploads
```

### 4. Configurar Banco de Dados

```bash
# Ainda na pasta backend
npm run prisma:generate
npm run prisma:migrate
```

Isso irá:

- ✅ Gerar o cliente Prisma
- ✅ Criar o banco de dados SQLite (`prisma/dev.db`)
- ✅ Executar todas as migrações

### 5. (Opcional) Popular Banco com Dados de Teste

```bash
# Executar seed de extensões
npx ts-node src/scripts/seedExtensions.ts

# Executar seed de usuário e empresas (opcional)
npx ts-node src/scripts/seedUserAndCompanies.ts

# Executar seed de movimentações (opcional)
npx ts-node src/scripts/seedMovements.ts
```

### 6. Voltar para Raiz e Iniciar

```bash
cd ..
npm run dev
```

Isso iniciará:

- ✅ **Backend** na porta **3001** (http://localhost:3001)
- ✅ **Frontend** na porta **3000** (http://localhost:3000)

## 🌐 Acessar o Sistema

Após iniciar os servidores:

- **Frontend (Interface):** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

## 📱 Primeiro Acesso

1. Acesse: http://localhost:3000
2. Clique em **"Criar conta"** para se registrar
3. Após login, crie ou selecione uma empresa
4. Você será redirecionado para o Dashboard

### Usuário de Teste (se executou seed)

Se você executou o seed de usuários:

- **Email:** eylucca@gmail.com
- **Senha:** 1980Luca$

## 🛠️ Scripts Disponíveis

### Na Raiz do Projeto

```bash
npm run dev              # Inicia backend e frontend simultaneamente
npm run install:all      # Instala todas as dependências
npm run build            # Compila todos os projetos para produção
npm start                # Inicia em modo produção (após build)
```

### Backend

```bash
cd backend
npm run dev              # Inicia servidor em desenvolvimento
npm run build            # Compila TypeScript
npm start                # Inicia em produção
npm run prisma:generate  # Gera cliente Prisma
npm run prisma:migrate   # Executa migrações
npm run prisma:studio   # Abre Prisma Studio (interface visual do banco)
```

### Frontend

```bash
cd web
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Compila para produção
npm start                # Inicia em produção
npm run lint             # Executa linter
```

## 🔧 Resolução de Problemas

### Erro: "Porta já em uso"

```bash
# Verificar processos nas portas
lsof -i :3000
lsof -i :3001

# Matar processos
lsof -ti:3000,3001 | xargs -r kill -9
```

### Erro: "Módulos não encontrados"

```bash
# Limpar e reinstalar
cd web
rm -rf node_modules package-lock.json
npm install
cd ../backend
rm -rf node_modules package-lock.json
npm install
cd ..
npm run install:all
```

### Erro: "Banco de dados não encontrado"

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### Erro: "Permission denied" (Linux/Mac)

```bash
# Dar permissão de execução aos scripts
chmod +x push-to-github.sh
chmod +x create-github-repo.sh
```

## 📦 Estrutura de Pastas

```
luanova/
├── backend/          # API Backend
│   ├── src/          # Código fonte
│   ├── prisma/       # Schema e migrações do banco
│   └── package.json
├── web/              # Frontend Next.js
│   ├── src/          # Código fonte
│   └── package.json
├── mobile/           # App Mobile (opcional)
├── shared/           # Código compartilhado
└── package.json      # Scripts da raiz
```

## 🔐 Variáveis de Ambiente

### Backend (.env)

```env
PORT=3001
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=altere-este-valor-para-um-secret-seguro
JWT_REFRESH_SECRET=altere-este-valor-para-um-secret-seguro
UPLOAD_DIR=./uploads
```

### Frontend

O frontend não requer variáveis de ambiente por padrão. Se necessário, crie `web/.env.local`.

## 🚀 Comandos Rápidos (Copy & Paste)

```bash
# 1. Clonar
git clone git@github.com:Ey-luccas/luanova.git
cd luanova

# 2. Instalar
npm run install:all

# 3. Configurar backend
cd backend
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
cd ..

# 4. Rodar
npm run dev
```

## ✅ Checklist de Instalação

- [ ] Node.js 20+ instalado
- [ ] Git instalado
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm run install:all`)
- [ ] Arquivo `.env` configurado no backend
- [ ] Banco de dados criado (`npm run prisma:migrate`)
- [ ] Servidores iniciados (`npm run dev`)
- [ ] Frontend acessível em http://localhost:3000
- [ ] Backend acessível em http://localhost:3001/api

## 🆘 Precisa de Ajuda?

- Verifique os logs no terminal onde os servidores estão rodando
- Confira se todas as portas estão livres
- Certifique-se de que o Node.js está na versão correta
- Verifique se o banco de dados foi criado corretamente

---

**Pronto!** Agora você pode começar a desenvolver! 🎉
