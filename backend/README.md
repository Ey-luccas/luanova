# EstoqueRápido - Backend

API backend do EstoqueRápido construída com Node.js, TypeScript, Express, Prisma e SQLite.

## 🛠️ Tecnologias

- **Node.js** - Runtime JavaScript
- **TypeScript** - Tipagem estática
- **Express** - Framework web
- **Zod** - Validação de schemas
- **Prisma** - ORM
- **SQLite** - Banco de dados (desenvolvimento local)
- **ts-node-dev** - Hot reload em desenvolvimento
- **ESLint** - Linter
- **Prettier** - Formatador de código

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

## 🚀 Instalação

1. Instale as dependências:

```bash
npm install
```

2. Configure o Prisma:

```bash
# Gera o Prisma Client
npm run prisma:generate

# Aplica as migrations (cria o banco dev.db)
npm run prisma:migrate
```

O banco de dados SQLite será criado automaticamente em `prisma/dev.db`.

## 🏃 Executando

### Desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3001`

### Produção

```bash
npm run build
npm start
```

## 📡 Endpoints

### Health Check

```bash
GET /api/health
```

Resposta:
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Hello API

```bash
GET /api/
```

Resposta:
```json
{
  "success": true,
  "message": "Hello API - EstoqueRápido Backend",
  "version": "1.0.0"
}
```

## 📁 Estrutura de Pastas

```
backend/
├── src/
│   ├── config/          # Configurações (env, prisma)
│   ├── controllers/     # Controllers (lógica de requisições)
│   ├── middlewares/     # Middlewares (auth, error handling)
│   ├── routes/          # Definição de rotas
│   ├── services/         # Lógica de negócio
│   ├── types/           # Tipos TypeScript
│   ├── utils/           # Funções utilitárias
│   └── server.ts        # Arquivo principal do servidor
├── prisma/
│   ├── schema.prisma    # Schema do banco de dados
│   ├── migrations/      # Migrations do banco
│   └── dev.db           # Banco de dados SQLite
└── package.json
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor em modo desenvolvimento com hot reload
- `npm run build` - Compila o TypeScript para JavaScript
- `npm start` - Inicia o servidor em modo produção
- `npm run lint` - Executa o ESLint
- `npm run lint:fix` - Corrige automaticamente problemas do ESLint
- `npm run format` - Formata o código com Prettier
- `npm run format:check` - Verifica se o código está formatado
- `npm run typecheck` - Verifica tipos TypeScript sem compilar
- `npm run prisma:generate` - Gera o Prisma Client
- `npm run prisma:migrate` - Executa migrations do Prisma
- `npm run prisma:studio` - Abre o Prisma Studio (interface visual do banco)

## 🧪 Testando a API

Após iniciar o servidor, você pode testar os endpoints:

```bash
# Health check
curl http://localhost:3001/api/health

# Hello API
curl http://localhost:3001/api/
```

## 🧪 Testando o Banco de Dados

Execute o script de teste:

```bash
npx ts-node scripts/test-database.ts
```

## 📊 Schema do Banco de Dados

O schema do Prisma inclui as seguintes entidades:

### Entidades Principais

- **User** - Usuários do sistema
- **Company** - Empresas/Organizações
- **CompanyUser** - Relacionamento N:N entre User e Company (com roles)
- **Category** - Categorias de produtos
- **Product** - Produtos com controle de estoque
- **StockMovement** - Movimentações de estoque (entrada/saída)

### Características

- ✅ IDs autoincrement nativos
- ✅ Campos obrigatórios: `id`, `createdAt`, `updatedAt` em todas as entidades
- ✅ Unique constraints: `email` (User), `barcode + companyId` (Product)
- ✅ MovementType: `"IN"` | `"OUT"` para movimentações (String no SQLite)
- ✅ UserRole: `"ADMIN"` | `"MANAGER"` | `"OPERATOR"` | `"VIEWER"` (String no SQLite)
- ✅ Soft delete: `isActive` (boolean) em Product
- ✅ Tipos corretos: `Decimal` para valores monetários e quantidades
- ✅ Relacionamentos 1:N e N:N configurados

## 📝 Próximos Passos

1. ✅ Schema do banco de dados criado
2. ✅ Migrations aplicadas
3. ⏳ Implementar controllers e services
4. ⏳ Adicionar autenticação JWT
5. ⏳ Implementar validações com Zod
6. ⏳ Adicionar testes

## 📚 Documentação Adicional

- `SETUP_SQLITE.md` - Guia completo de setup do SQLite
