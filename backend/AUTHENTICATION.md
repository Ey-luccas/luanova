# 🔐 Módulo de Autenticação - EstoqueRápido

## 📋 Visão Geral

Módulo completo de autenticação implementado com JWT (JSON Web Tokens), incluindo:
- Registro de usuários
- Login com geração de tokens
- Refresh token para renovação de acesso
- Middleware de autenticação para rotas protegidas

## 🛠️ Tecnologias

- **bcrypt** - Hash de senhas
- **jsonwebtoken** - Geração e validação de tokens JWT
- **Zod** - Validação de schemas
- **Prisma** - ORM para banco de dados

## 📁 Estrutura

```
src/
├── schemas/
│   └── authSchema.ts        # Schemas Zod para validação
├── services/
│   └── authService.ts       # Lógica de negócio (hash, tokens, etc)
├── controllers/
│   └── authController.ts    # Handlers HTTP
├── routes/
│   └── authRoutes.ts        # Definição de rotas
└── middlewares/
    └── authMiddleware.ts    # Middleware de autenticação
```

## 🔑 Configuração

### Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
```

**Importante:** Use strings aleatórias com pelo menos 32 caracteres em produção!

### Gerar Secrets Seguros

```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📡 Endpoints

### POST /api/auth/register

Registra um novo usuário.

**Request:**
```json
{
  "email": "usuario@example.com",
  "name": "Nome do Usuário",
  "password": "senha123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@example.com",
      "name": "Nome do Usuário",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Erros:**
- `400` - Dados inválidos (validação Zod)
- `409` - Email já cadastrado
- `500` - Erro interno

---

### POST /api/auth/login

Autentica usuário e retorna tokens.

**Request:**
```json
{
  "email": "usuario@example.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "email": "usuario@example.com",
      "name": "Nome do Usuário",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Erros:**
- `400` - Dados inválidos
- `401` - Email ou senha inválidos
- `500` - Erro interno

---

### POST /api/auth/refresh

Renova tokens usando refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Tokens renovados com sucesso",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Erros:**
- `400` - Dados inválidos
- `401` - Refresh token inválido ou expirado
- `500` - Erro interno

## 🔒 Middleware de Autenticação

Use o middleware `authMiddleware` para proteger rotas:

```typescript
import { authMiddleware } from "../middlewares/authMiddleware";

router.get("/protected", authMiddleware, (req, res) => {
  // req.user está disponível aqui
  res.json({
    success: true,
    user: req.user,
  });
});
```

### Header Authorization

Todas as rotas protegidas requerem o header:

```
Authorization: Bearer <accessToken>
```

### Request com Usuário

Após passar pelo middleware, `req.user` contém:

```typescript
{
  id: number;
  email: string;
  name: string;
}
```

## ⚙️ Configurações de Tokens

- **Access Token**: Expira em 15 minutos
- **Refresh Token**: Expira em 7 dias
- **Hash de Senha**: bcrypt com 10 salt rounds

## 🔐 Segurança

### Implementado:
- ✅ Senhas hasheadas com bcrypt
- ✅ Tokens JWT assinados
- ✅ Refresh tokens salvos no banco
- ✅ Validação de tokens antes de uso
- ✅ Validação de dados com Zod
- ✅ Tratamento de erros padronizado

### Boas Práticas:
- Use HTTPS em produção
- Rotacione os secrets periodicamente
- Implemente rate limiting
- Adicione logs de segurança
- Considere 2FA para produção

## 🧪 Testando

### 1. Registrar usuário

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "name": "Usuário Teste",
    "password": "senha123"
  }'
```

### 2. Fazer login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123"
  }'
```

### 3. Usar access token

```bash
curl http://localhost:3001/api/protected \
  -H "Authorization: Bearer <accessToken>"
```

### 4. Renovar tokens

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<refreshToken>"
  }'
```

## 📝 Próximos Passos

- [ ] Implementar logout (invalidar refresh token)
- [ ] Adicionar rate limiting
- [ ] Implementar recuperação de senha
- [ ] Adicionar verificação de email
- [ ] Implementar 2FA (opcional)

