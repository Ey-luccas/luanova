# EstoqueRapido

Sistema completo de gestão de estoque com backend, painel web e aplicativo mobile.

## 📁 Estrutura do Projeto

```
estoquerapido/
│
├── backend/               → API (Node + Express + Prisma)
│   ├── src/
│   ├── prisma/
│   └── package.json
│
├── web/                   → Painel Web (Next.js 14)
│   ├── src/
│   ├── public/
│   └── package.json
│
├── mobile/                → App (React Native + Expo)
│   ├── app/
│   ├── src/
│   └── package.json
│
├── shared/                → Tipos, utils, interfaces compartilhadas
│   ├── types/
│   ├── utils/
│   └── README.md
│
└── README.md              → Este arquivo
```

## 🚀 Início Rápido

### ⚡ Rodar Tudo de Uma Vez (Recomendado)

```bash
# Na raiz do projeto, instale as dependências uma vez
npm run install:all

# Depois, rode tudo com um único comando
npm run dev
```

Isso irá iniciar:
- ✅ Backend na porta 3001 (http://localhost:3001)
- ✅ Frontend na porta 3000 (http://localhost:3000)

### 📦 Instalar Dependências

```bash
# Instala todas as dependências (raiz + backend + web)
npm run install:all

# Ou instalar individualmente:
cd backend && npm install
cd ../web && npm install
```

### 🔧 Rodar Individualmente

#### Backend

```bash
cd backend
npm run dev
```

#### Web

```bash
cd web
npm run dev
```

#### Mobile

```bash
cd mobile
npm install
npm start
```

### 📋 Scripts Disponíveis na Raiz

- `npm run dev` - Roda backend e frontend simultaneamente
- `npm run install:all` - Instala dependências de todos os projetos
- `npm run build` - Build de produção (backend + web)
- `npm start` - Inicia em modo produção (após build)

## 🛠️ Tecnologias

- **Backend**: Node.js, Express, Prisma
- **Web**: Next.js 14, React, TypeScript
- **Mobile**: React Native, Expo, TypeScript
- **Shared**: TypeScript types e utilities

## 📝 Licença

ISC

