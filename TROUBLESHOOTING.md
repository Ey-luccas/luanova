# 🚨 Troubleshooting - EstoqueLua

Guia rápido para resolver problemas comuns no deploy.

---

## ❌ Erro 500 no Login

### **Sintomas:**
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Erro ao fazer login
```

### **Causas Possíveis e Soluções:**

#### 1. **Prisma Client não gerado ou desatualizado**

```bash
cd /var/www/estoquelua/backend
npm run prisma:generate
pm2 restart estoquelua-backend
```

#### 2. **Migrações não aplicadas (tabelas não existem)**

```bash
cd /var/www/estoquelua/backend

# Verificar status das migrações
npm run prisma:migrate:status

# Aplicar migrações
npm run prisma:migrate:deploy

# Reiniciar
pm2 restart estoquelua-backend
```

#### 3. **Banco de dados não configurado corretamente**

Verificar se o `.env` tem a `DATABASE_URL` correta:

```bash
cd /var/www/estoquelua/backend
cat .env | grep DATABASE_URL
```

Deve ser algo como:
```
DATABASE_URL="mysql://estoquelua_user:senha@localhost:3306/estoquelua"
```

Testar conexão:
```bash
mysql -u estoquelua_user -p estoquelua
# Se conectar, digite: EXIT;
```

#### 4. **JWT Secrets não configurados ou inválidos**

```bash
cd /var/www/estoquelua/backend
cat .env | grep JWT_SECRET
```

Os secrets devem ter **mínimo 32 caracteres**.

Gerar novos secrets:
```bash
openssl rand -base64 32
openssl rand -base64 32
```

Atualizar `.env`:
```bash
nano .env
# Editar JWT_SECRET e JWT_REFRESH_SECRET
pm2 restart estoquelua-backend
```

#### 5. **Banco de dados MySQL não está rodando**

```bash
sudo systemctl status mysql

# Se não estiver rodando:
sudo systemctl start mysql
sudo systemctl enable mysql
```

#### 6. **Verificar Logs do Backend**

```bash
# Ver logs em tempo real
pm2 logs estoquelua-backend

# Ver últimos erros
pm2 logs estoquelua-backend --lines 50 --err

# Ver logs de arquivo
tail -f /var/www/estoquelua/backend/logs/error-*.log
```

#### 7. **Verificar se o Build está atualizado**

```bash
cd /var/www/estoquelua/backend

# Rebuild
npm run build

# Verificar se server.js existe
ls -la dist/server.js

# Reiniciar
pm2 restart estoquelua-backend
```

---

## ❌ Erro de Conexão com Banco de Dados

### **Sintomas:**
```
Error: P1001: Can't reach database server
Error: Authentication failed
```

### **Soluções:**

1. **Verificar se MySQL está rodando:**
```bash
sudo systemctl status mysql
sudo systemctl start mysql
```

2. **Verificar credenciais no .env:**
```bash
cat .env | grep DATABASE_URL
```

3. **Testar conexão manualmente:**
```bash
mysql -u estoquelua_user -p estoquelua
```

4. **Verificar se banco existe:**
```bash
mysql -u root -p -e "SHOW DATABASES;"
```

5. **Recriar banco se necessário:**
```bash
mysql -u root -p
```

```sql
DROP DATABASE IF EXISTS estoquelua;
CREATE DATABASE estoquelua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON estoquelua.* TO 'estoquelua_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Depois:
```bash
cd /var/www/estoquelua/backend
npm run prisma:migrate:deploy
```

---

## ❌ 502 Bad Gateway

### **Sintomas:**
```
502 Bad Gateway
nginx error
```

### **Soluções:**

1. **Verificar se backend está rodando:**
```bash
pm2 status
curl http://localhost:3001/api/health
```

2. **Se não estiver rodando:**
```bash
cd /var/www/estoquelua/backend
pm2 start ecosystem.config.js
pm2 save
```

3. **Verificar logs do Nginx:**
```bash
sudo tail -f /var/log/nginx/estoquelua-api-error.log
```

4. **Verificar configuração do Nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## ❌ CORS bloqueando requisições

### **Sintomas:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

### **Soluções:**

1. **Verificar CORS_ORIGINS no .env:**
```bash
cd /var/www/estoquelua/backend
cat .env | grep CORS_ORIGINS
```

2. **Adicionar domínio faltante:**
```bash
nano .env
# Adicionar domínio em CORS_ORIGINS (separar por vírgula)
# Exemplo: CORS_ORIGINS=https://luanova.cloud,https://www.luanova.cloud
```

3. **Reiniciar backend:**
```bash
pm2 restart estoquelua-backend
```

4. **Verificar logs:**
```bash
pm2 logs estoquelua-backend | grep CORS
```

---

## ❌ Erro "Prisma Client not initialized"

### **Sintomas:**
```
Error: PrismaClient is not configured to run in Vercel Edge Functions
```

### **Soluções:**

```bash
cd /var/www/estoquelua/backend

# Gerar Prisma Client
npm run prisma:generate

# Rebuild
npm run build

# Reiniciar
pm2 restart estoquelua-backend
```

---

## ❌ Erro "Table doesn't exist"

### **Sintomas:**
```
Error: Table 'estoquelua.users' doesn't exist
```

### **Soluções:**

```bash
cd /var/www/estoquelua/backend

# Aplicar migrações
npm run prisma:migrate:deploy

# Verificar tabelas criadas
mysql -u estoquelua_user -p estoquelua -e "SHOW TABLES;"

# Reiniciar
pm2 restart estoquelua-backend
```

---

## ❌ Erro ao gerar JWT Token

### **Sintomas:**
```
Error: secretOrPrivateKey must have a value
```

### **Soluções:**

1. **Verificar se JWT_SECRET está configurado:**
```bash
cd /var/www/estoquelua/backend
cat .env | grep JWT_SECRET
```

2. **Gerar novos secrets:**
```bash
openssl rand -base64 32
openssl rand -base64 32
```

3. **Atualizar .env:**
```bash
nano .env
# Colar os secrets gerados
```

4. **Reiniciar:**
```bash
pm2 restart estoquelua-backend
```

---

## 🔍 Como Verificar Logs

### **PM2:**
```bash
# Ver logs em tempo real
pm2 logs estoquelua-backend

# Ver apenas erros
pm2 logs estoquelua-backend --err

# Ver últimas 100 linhas
pm2 logs estoquelua-backend --lines 100

# Ver logs de um arquivo específico
tail -f ~/.pm2/logs/estoquelua-backend-error.log
```

### **Aplicação (Winston):**
```bash
# Ver logs de erro
tail -f /var/www/estoquelua/backend/logs/error-*.log

# Ver logs combinados
tail -f /var/www/estoquelua/backend/logs/combined-*.log
```

### **Nginx:**
```bash
# Logs de acesso
sudo tail -f /var/log/nginx/estoquelua-api-access.log

# Logs de erro
sudo tail -f /var/log/nginx/estoquelua-api-error.log
```

### **MySQL:**
```bash
sudo tail -f /var/log/mysql/error.log
```

---

## ✅ Checklist de Verificação Rápida

Execute estes comandos para verificar tudo:

```bash
# 1. Backend rodando?
pm2 status

# 2. Backend respondendo?
curl http://localhost:3001/api/health

# 3. MySQL rodando?
sudo systemctl status mysql

# 4. Banco existe?
mysql -u estoquelua_user -p estoquelua -e "SHOW TABLES;"

# 5. Prisma Client gerado?
ls -la /var/www/estoquelua/backend/node_modules/.prisma/client

# 6. .env configurado?
cat /var/www/estoquelua/backend/.env | grep -E "(DATABASE_URL|JWT_SECRET)"

# 7. Nginx rodando?
sudo systemctl status nginx

# 8. SSL funcionando?
curl -I https://api.luanova.cloud/api/health
```

---

## 📞 Comandos Úteis de Emergência

### **Reiniciar Tudo:**
```bash
# Backend
pm2 restart estoquelua-backend

# Nginx
sudo systemctl restart nginx

# MySQL
sudo systemctl restart mysql
```

### **Verificar Status de Tudo:**
```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status mysql
```

### **Reconstruir Tudo do Zero:**
```bash
cd /var/www/estoquelua/backend

# Reinstalar dependências
npm install --production

# Gerar Prisma
npm run prisma:generate

# Aplicar migrações
npm run prisma:migrate:deploy

# Build
npm run build

# Reiniciar
pm2 restart estoquelua-backend
```

---

**Última atualização:** Dezembro 2024

