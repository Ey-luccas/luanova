# EstoqueRápido - Web

Módulo web do monorepo EstoqueRápido construído com Next.js 14, TypeScript, Tailwind CSS e shadcn/ui.

## 🛠️ Tecnologias

- **Next.js 14** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI acessíveis
- **Axios** - Cliente HTTP com interceptors
- **React Hook Form + Zod** - Formulários e validação
- **TanStack Table** - Tabelas de dados
- **Recharts** - Gráficos e visualizações
- **Fonte Inter** - Tipografia

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Backend rodando (porta 3001 por padrão)

## 🚀 Instalação

1. Instale as dependências:

```bash
cd web
npm install
```

2. Configure as variáveis de ambiente:

Crie um arquivo `.env.local` na raiz do módulo `web`:

```env
# Para desenvolvimento local:
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Para produção/VPS:
# NEXT_PUBLIC_API_URL=https://api.luanova.cloud/api
```

3. Execute o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 📁 Estrutura de Pastas

```
web/
├── src/
│   ├── app/                    # App Router do Next.js
│   │   ├── (auth)/            # Rotas de autenticação
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/       # Rotas do dashboard
│   │   │   ├── layout.tsx     # Layout com Sidebar + Header
│   │   │   └── page.tsx       # Página inicial do dashboard
│   │   ├── layout.tsx         # Layout raiz
│   │   ├── page.tsx           # Página inicial
│   │   └── globals.css        # Estilos globais
│   ├── components/
│   │   ├── ui/                # Componentes shadcn/ui
│   │   ├── sidebar.tsx        # Sidebar de navegação
│   │   └── header.tsx         # Header do dashboard
│   ├── contexts/
│   │   └── AuthContext.tsx    # Context de autenticação
│   └── lib/
│       ├── api.ts             # Instância do Axios
│       └── utils.ts           # Funções utilitárias
├── components.json            # Configuração do shadcn/ui
├── tailwind.config.ts         # Configuração do Tailwind
└── package.json
```

## 🔧 Configuração

### Variáveis de Ambiente

- `NEXT_PUBLIC_API_URL` - URL base da API do backend (padrão: `http://localhost:3001/api`)

### Axios Interceptors

O arquivo `src/lib/api.ts` configura automaticamente:

- **Request Interceptor**: Adiciona o token de autenticação nas requisições
- **Response Interceptor**: Redireciona para `/login` em caso de erro 401

### Autenticação

O `AuthContext` gerencia o estado de autenticação globalmente:

- Armazena tokens no `localStorage`
- Fornece métodos `login`, `register`, `logout` e `refreshToken`
- Estado disponível via hook `useAuth()`

## 📡 Rotas

### Autenticação

- `/login` - Página de login
- `/register` - Página de registro

### Dashboard

- `/dashboard` - Página inicial do dashboard
- `/dashboard/products` - Produtos (a implementar)
- `/dashboard/categories` - Categorias (a implementar)
- `/dashboard/movements` - Movimentações (a implementar)
- `/dashboard/reports` - Relatórios (a implementar)
- `/dashboard/settings` - Configurações (a implementar)

## 🎨 Componentes UI

Os componentes do shadcn/ui estão em `src/components/ui/`. Para adicionar novos componentes:

```bash
npx shadcn-ui@latest add [component-name]
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento (porta 3000)
- `npm run build` - Compila para produção (gera output standalone)
- `npm start` - Inicia o servidor de produção (usa `node .next/standalone/server.js`)
- `npm run lint` - Executa o ESLint
- `npm run lint:fix` - Corrige problemas do ESLint
- `npm run typecheck` - Verifica tipos TypeScript

### ⚠️ Importante: Build Standalone

Este projeto usa `output: "standalone"` no Next.js. Após o build:
- O servidor deve ser iniciado com: `node .next/standalone/server.js`
- **NÃO use** `next start` em produção
- Veja [DEPLOY.md](../DEPLOY.md) para instruções completas de deploy

## 🔐 Autenticação

A autenticação é gerenciada via Context API:

```tsx
import { useAuth } from "@/contexts/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // ...
}
```

## 📱 Responsividade

- Sidebar fixa à esquerda em desktop
- Menu hambúrguer em mobile (recolhido por padrão)
- Layout adaptativo com Tailwind CSS

## 🎯 Próximos Passos

- [ ] Implementar formulários de login/registro com React Hook Form
- [ ] Implementar páginas do dashboard
- [ ] Adicionar mais componentes do shadcn/ui conforme necessário
- [ ] Implementar proteção de rotas
- [ ] Adicionar loading states e error handling

