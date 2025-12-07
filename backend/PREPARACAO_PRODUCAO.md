# 🚀 Guia de Preparação para Produção - Backend

## 📋 RESUMO DA ANÁLISE

O backend está **quase pronto** para produção, mas precisa de algumas melhorias críticas de segurança e configuração.

## ✅ O QUE JÁ ESTÁ PRONTO

- ✅ TypeScript e build funcionando
- ✅ Estrutura organizada
- ✅ Autenticação JWT
- ✅ Validação de dados (Zod)
- ✅ Tratamento de erros
- ✅ Upload de arquivos com validação
- ✅ Health check básico

## ⚠️ MELHORIAS NECESSÁRIAS

### 1. INSTALAR DEPENDÊNCIAS DE SEGURANÇA

```bash
cd backend
npm install helmet express-rate-limit
npm install --save-dev @types/express-rate-limit
```

### 2. CRIAR ARQUIVO .env.example

Criar arquivo `.env.example` na raiz do backend com:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=mysql://user:password@localhost:3306/estoquelua
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
CORS_ORIGINS=https://app.luanova.cloud,https://www.luanova.cloud
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. ATUALIZAR server.ts

Adicionar:
- Helmet.js para headers de segurança
- CORS configurado com origens permitidas
- Rate Limiting
- Health check melhorado (verificar banco)

### 4. CRIAR CONFIGURAÇÃO PM2

Criar `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'estoquelua-backend',
    script: './dist/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 5. ADICIONAR SCRIPTS NO package.json

```json
{
  "scripts": {
    "start:prod": "node dist/server.js",
    "migrate:deploy": "prisma migrate deploy",
    "migrate:generate": "prisma migrate dev --name",
    "postinstall": "prisma generate"
  }
}
```

### 6. MELHORAR HEALTH CHECK

Adicionar verificação de conexão com banco de dados no endpoint `/api/health`.

## 🔧 COMANDOS PARA IMPLEMENTAR

### No VPS (após fazer pull):

```bash
# 1. Instalar dependências
cd backend
npm install --production

# 2. Gerar Prisma Client
npm run prisma:generate

# 3. Executar migrações
npm run migrate:deploy

# 4. Build do projeto
npm run build

# 5. Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 📝 CHECKLIST FINAL

Antes de fazer deploy no VPS:

- [ ] Instalar dependências (helmet, express-rate-limit)
- [ ] Criar .env.example
- [ ] Atualizar server.ts com segurança
- [ ] Criar ecosystem.config.js
- [ ] Adicionar scripts no package.json
- [ ] Melhorar health check
- [ ] Testar build localmente
- [ ] Verificar todas as variáveis de ambiente
- [ ] Configurar banco MySQL no VPS
- [ ] Configurar SSL/HTTPS
- [ ] Configurar firewall

## 🎯 PRÓXIMOS PASSOS

1. **Implementar melhorias no código** (este documento)
2. **Fazer commit das mudanças**
3. **Fazer pull no VPS**
4. **Configurar variáveis de ambiente no VPS**
5. **Executar migrações**
6. **Iniciar aplicação com PM2**

---

**Status:** Aguardando implementação das melhorias  
**Branch:** prod

