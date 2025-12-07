# ✅ Checklist de Produção - Backend

## 🎯 MELHORIAS IMPLEMENTADAS

### ✅ 1. Segurança
- [x] **Helmet.js** - Headers de segurança adicionados
- [x] **CORS configurado** - Apenas origens permitidas em produção
- [x] **Rate Limiting** - Proteção contra DDoS/força bruta
- [x] **DATABASE_URL obrigatório** - Validação em produção
- [x] **Limite de tamanho** - JSON e URL encoded limitados a 10MB

### ✅ 2. Configuração
- [x] **Variáveis de ambiente** - CORS_ORIGINS, RATE_LIMIT configuráveis
- [x] **Scripts de produção** - `start:prod`, `migrate:deploy`, `postinstall`
- [x] **PM2 config** - `ecosystem.config.js` criado
- [x] **Health check melhorado** - Verifica conexão com banco

### ✅ 3. Dependências
- [x] **helmet** - Adicionado ao package.json
- [x] **express-rate-limit** - Adicionado ao package.json

---

## 📋 O QUE FAZER NO VPS

### 1. Instalar Dependências

```bash
cd backend
npm install --production
```

### 2. Configurar Variáveis de Ambiente

Criar arquivo `.env` na raiz do backend:

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=mysql://usuario:senha@localhost:3306/estoquelua
JWT_SECRET=seu-jwt-secret-com-pelo-menos-32-caracteres
JWT_REFRESH_SECRET=seu-refresh-secret-com-pelo-menos-32-caracteres
CORS_ORIGINS=https://app.luanova.cloud,https://www.luanova.cloud
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**⚠️ IMPORTANTE:**
- Gerar JWT_SECRET e JWT_REFRESH_SECRET seguros:
  ```bash
  openssl rand -base64 32
  ```
- Configurar CORS_ORIGINS com as URLs do frontend
- Configurar DATABASE_URL com credenciais do MySQL

### 3. Gerar Prisma Client

```bash
npm run prisma:generate
```

### 4. Executar Migrações

```bash
npm run prisma:migrate:deploy
```

### 5. Build do Projeto

```bash
npm run build
```

### 6. Criar Diretórios Necessários

```bash
mkdir -p logs uploads/logos uploads/avatars uploads/menu-items
```

### 7. Iniciar com PM2

```bash
# Instalar PM2 globalmente (se não tiver)
npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar para iniciar no boot (se necessário)
pm2 startup
```

### 8. Verificar Status

```bash
pm2 status
pm2 logs estoquelua-backend
```

### 9. Testar API

```bash
curl http://localhost:3001/api/health
```

Deve retornar:
```json
{
  "success": true,
  "status": "ok",
  "database": "connected",
  "timestamp": "..."
}
```

---

## 🔍 VERIFICAÇÕES FINAIS

Antes de considerar produção:

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Banco de dados MySQL configurado e acessível
- [ ] Migrações executadas com sucesso
- [ ] Build compilado sem erros
- [ ] Health check retorna "database: connected"
- [ ] PM2 rodando e reiniciando automaticamente
- [ ] Logs sendo gerados em `./logs/`
- [ ] CORS configurado com URLs corretas
- [ ] SSL/HTTPS configurado no servidor web (Nginx/Apache)
- [ ] Firewall configurado (porta 3001 apenas para localhost ou proxy reverso)

---

## 🚨 TROUBLESHOOTING

### Erro: "DATABASE_URL é obrigatório em produção"
- Verifique se a variável está no `.env`
- Verifique se o formato está correto: `mysql://user:pass@host:port/db`

### Erro: "Não permitido pelo CORS"
- Verifique se a URL do frontend está em `CORS_ORIGINS`
- Em desenvolvimento, todas as origens são permitidas

### Erro: "Muitas requisições"
- Rate limiting está funcionando
- Ajuste `RATE_LIMIT_MAX_REQUESTS` se necessário

### PM2 não inicia
- Verifique se o build foi feito: `npm run build`
- Verifique se `dist/server.js` existe
- Verifique logs: `pm2 logs estoquelua-backend`

---

## 📊 MONITORAMENTO

### Comandos PM2 úteis:

```bash
pm2 status              # Ver status
pm2 logs                # Ver logs
pm2 restart all         # Reiniciar
pm2 stop all            # Parar
pm2 delete all          # Remover
pm2 monit               # Monitor em tempo real
```

### Verificar uso de recursos:

```bash
pm2 monit
# ou
htop
```

---

**Status:** ✅ Backend pronto para produção após seguir este checklist  
**Última atualização:** Dezembro 2024

