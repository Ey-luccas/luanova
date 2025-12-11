# 🚀 EstoqueLua - Sistema de Gestão de Estoque

Sistema completo de gestão de estoque desenvolvido por **Lualabs**, com backend, painel web e aplicativo mobile.

## 📚 Documentação

- **[DEPLOY_VPS.md](./DEPLOY_VPS.md)** - Guia completo para colocar o sistema online no VPS
- **[GUIA_PROJETO.md](./GUIA_PROJETO.md)** - Como o projeto foi desenvolvido e fluxo de funcionamento
- **[RELATORIO_PROJETO.md](./RELATORIO_PROJETO.md)** - Relatório completo do estado do projeto

## 📋 Características Principais

- ✅ **Gestão de Produtos e Serviços** - Controle completo de estoque
- ✅ **Sistema de Extensões** - Módulos opcionais (Agendamentos, Restaurante, etc.)
- ✅ **Scanner de Código de Barras** - Integração com câmera para leitura de códigos
- ✅ **Multi-empresa** - Suporte a múltiplas empresas por usuário
- ✅ **Movimentações** - Registro de vendas, prestações de serviço, devoluções
- ✅ **Relatórios** - Dashboard com métricas e análises
- ✅ **Autenticação Segura** - JWT com refresh tokens
- ✅ **Interface Responsiva** - Funciona em desktop, tablet e mobile

## 📁 Estrutura do Projeto

```
estoquelua/
│
├── backend/               → API REST (Node.js + Express + Prisma)
│   ├── src/
│   │   ├── controllers/   → Controladores das rotas
│   │   ├── services/     → Lógica de negócio
│   │   ├── routes/       → Definição de rotas
│   │   ├── middlewares/  → Middlewares (auth, validação, etc.)
│   │   └── schemas/      → Schemas de validação (Zod)
│   ├── prisma/           → Schema e migrações do banco de dados
│   └── package.json
│
├── web/                   → Painel Web (Next.js 14 + TypeScript)
│   ├── src/
│   │   ├── app/          → Rotas e páginas (App Router)
│   │   ├── components/   → Componentes React reutilizáveis
│   │   ├── contexts/     → Contextos React (Auth, Extensions)
│   │   └── lib/          → Utilitários e configurações
│   └── package.json
│
├── mobile/                → App Mobile (React Native + Expo)
│   ├── app/              → Navegação e telas
│   ├── src/              → Componentes e serviços
│   └── package.json
│
└── shared/                → Código compartilhado entre projetos
    ├── types/            → Tipos TypeScript compartilhados
    └── utils/            → Utilitários compartilhados
```

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **Prisma** - ORM para banco de dados
- **SQLite** - Banco de dados (desenvolvimento)
- **JWT** - Autenticação
- **Zod** - Validação de schemas
- **Multer** - Upload de arquivos

### Frontend
- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **React Hook Form** - Gerenciamento de formulários
- **Zod** - Validação de formulários
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes UI
- **html5-qrcode** - Scanner de código de barras
- **Axios** - Cliente HTTP

### Mobile
- **React Native** - Framework mobile
- **Expo** - Plataforma de desenvolvimento
- **TypeScript** - Tipagem estática

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js 20.x ou superior
- npm 10.x ou superior
- Git

### Instalação Rápida

#### Opção 1: Script Automático (Recomendado)

```bash
# 1. Clonar repositório
git clone git@github.com:Ey-luccas/luanova.git
cd luanova

# 2. Executar script de instalação
./install.sh
```

#### Opção 2: Manual

1. **Clone o repositório:**
```bash
git clone git@github.com:Ey-luccas/luanova.git
cd luanova
```

2. **Instale as dependências:**
```bash
npm run install:all
```

3. **Configure o ambiente:**
```bash
# Backend
cd backend
cp .env.example .env
# Edite o arquivo .env com suas configurações
cd ..
```

4. **Configure o banco de dados:**
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
cd ..
```

5. **Inicie os servidores:**
```bash
npm run dev
```

> 📖 **Para instalação em dispositivo novo, veja:** [INSTALACAO_NOVO_DISPOSITIVO.md](./INSTALACAO_NOVO_DISPOSITIVO.md)

Isso iniciará:
- ✅ **Backend** na porta **3001** (http://localhost:3001)
- ✅ **Frontend** na porta **3000** (http://localhost:3000)

### Acessar o Sistema

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

## 📝 Scripts Disponíveis

### Na raiz do projeto:
- `npm run dev` - Inicia backend e frontend simultaneamente
- `npm run install:all` - Instala dependências de todos os projetos
- `npm run build` - Compila todos os projetos

### Backend:
- `npm run dev` - Inicia servidor em modo desenvolvimento
- `npm run build` - Compila TypeScript
- `npm start` - Inicia servidor em produção
- `npm run prisma:generate` - Gera cliente Prisma
- `npm run prisma:migrate` - Executa migrações
- `npm run prisma:studio` - Abre Prisma Studio

### Frontend:
- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Compila para produção
- `npm start` - Inicia servidor de produção
- `npm run lint` - Executa linter

## 🔐 Primeiro Acesso

1. Acesse http://localhost:3000
2. Clique em **"Criar conta"** para se registrar
3. Após login, crie ou selecione uma empresa
4. Você será redirecionado para o Dashboard

### Usuário de Teste (se criado via seed)
- **Email:** eylucca@gmail.com
- **Senha:** 1980Luca$

## 📚 Funcionalidades

### Gestão de Produtos
- Cadastro de produtos com código de barras
- Categorias e unidades de medida
- Controle de estoque em tempo real
- Scanner de código de barras integrado
- Histórico de movimentações

### Gestão de Serviços
- Cadastro de serviços
- Controle de prestações
- Relatórios de serviços prestados

### Movimentações
- Registro de vendas (produtos)
- Registro de prestações (serviços)
- Devoluções e reembolsos
- Múltiplas formas de pagamento (PIX, Cartão, Boleto, Espécie)

### Extensões
- **Agendamentos** - Sistema de agendamento de serviços
- **Restaurante** - Gestão de restaurante (mesas, pedidos, cozinha)
- **Relatórios Avançados** - Relatórios detalhados

### Dashboard
- Métricas em tempo real
- Gráficos de vendas
- Alertas de estoque baixo
- Resumo financeiro

## 🔧 Configuração do Ambiente

### Backend (.env)
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=seu-jwt-secret-aqui
JWT_REFRESH_SECRET=seu-refresh-secret-aqui
UPLOAD_DIR=./uploads
```

### Frontend
O frontend usa variáveis de ambiente do Next.js. Configure em `web/.env.local` se necessário.

## 📦 Estrutura de Extensões

O sistema suporta extensões modulares:
- **products_management** - Extensão padrão (sempre ativa, exceto se serviços estiver instalado)
- **services_management** - Gestão de serviços
- **appointments** - Sistema de agendamentos (requer services_management)
- **restaurant** - Sistema de restaurante

## 🐛 Troubleshooting

### Porta já em uso
```bash
# Verificar processos
lsof -i :3000
lsof -i :3001

# Matar processos
lsof -ti:3000,3001 | xargs -r kill -9
```

### Erro de módulos não encontrados
```bash
# Limpar e reinstalar
cd web
rm -rf node_modules package-lock.json
npm install
```

### Erro de banco de dados
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

## 📄 Licença

Este projeto é propriedade da **Lualabs**.

## 👥 Desenvolvido por

**Lualabs** - Sistema de gestão de estoque completo

---

**Versão:** 1.0.0  
**Última atualização:** 2024
