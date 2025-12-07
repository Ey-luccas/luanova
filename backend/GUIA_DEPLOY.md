# 🚀 Guia Completo de Deploy - Backend EstoqueLua

## 📋 Checklist de Produção - Status

### ✅ Segurança e Configuração

- [x] **CORS configurado** - Apenas origens permitidas em produção (`luanova.cloud`)
- [x] **Helmet.js** - Headers de segurança implementados
- [x] **Rate Limiting** - Proteção contra DDoS e força bruta
- [x] **`.env.example`** - Arquivo de exemplo criado
- [x] **PM2 configurado** - `ecosystem.config.js` criado
- [x] **Script de migração** - `prisma:migrate:deploy` para produção
- [x] **DATABASE_URL obrigatório** - Validação em produção (MySQL obrigatório)
- [x] **Health check completo** - Verifica banco, memória, uptime
- [x] **Sistema de logs** - Winston com rotação diária

### ⚠️ Configurações do Servidor (Fazer no VPS)

- [ ] **MySQL instalado e configurado**
- [ ] **Backup do banco configurado**
- [ ] **SSL/HTTPS configurado** (Nginx/Apache)
- [ ] **Firewall configurado**
- [ ] **Build testado localmente**

---

## 🎯 PASSO A PASSO COMPLETO PARA DEPLOY

### Pré-requisitos

- VPS com Ubuntu/Debian
- Node.js 18+ instalado
- MySQL instalado
- Git instalado
- Acesso SSH ao servidor

---

## 1️⃣ PREPARAÇÃO DO SERVIDOR

### 1.1 Atualizar Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Instalar Node.js (se não tiver)

```bash
# Instalar Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
node --version  # Deve ser 18+
npm --version
```

### 1.3 Instalar MySQL

```bash
# Instalar MySQL
sudo apt install mysql-server -y

# Iniciar e habilitar MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Configurar segurança
sudo mysql_secure_installation
```

**Durante a configuração:**
- Definir senha do root
- Remover usuários anônimos: **Y**
- Desabilitar login remoto root: **Y**
- Remover banco de teste: **Y**
- Recarregar privilégios: **Y**

### 1.4 Criar Banco de Dados MySQL

```bash
# Acessar MySQL
sudo mysql -u root -p

# Criar banco de dados
CREATE DATABASE estoquelua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Criar usuário dedicado (recomendado)
CREATE USER 'estoquelua_user'@'localhost' IDENTIFIED BY 'SENHA_SEGURA_AQUI';

# Dar permissões
GRANT ALL PRIVILEGES ON estoquelua.* TO 'estoquelua_user'@'localhost';
FLUSH PRIVILEGES;

# Verificar
SHOW DATABASES;
EXIT;
```

**⚠️ IMPORTANTE:** Substitua `SENHA_SEGURA_AQUI` por uma senha forte!

### 1.5 Instalar PM2

```bash
sudo npm install -g pm2
```

### 1.6 Configurar Firewall (UFW)

```bash
# Verificar status
sudo ufw status

# Permitir SSH (IMPORTANTE: fazer antes de habilitar!)
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Verificar regras
sudo ufw status verbose
```

**Nota:** A porta 3001 do backend não precisa estar aberta se usar Nginx como proxy reverso.

---

## 2️⃣ CONFIGURAR APLICAÇÃO

### 2.1 Clonar Repositório

```bash
# Ir para diretório de aplicações
cd /var/www  # ou outro diretório de sua preferência

# Clonar repositório
git clone https://github.com/SEU_USUARIO/SEU_REPO.git estoquelua
cd estoquelua

# Ir para branch de produção
git checkout prod
```

### 2.2 Instalar Dependências

```bash
cd backend

# Instalar dependências de produção
npm install --production
```

### 2.3 Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar arquivo .env
nano .env
```

**Configurar `.env` com:**

```env
# Ambiente
NODE_ENV=production
PORT=3001

# Banco de Dados MySQL (OBRIGATÓRIO em produção)
DATABASE_URL="mysql://estoquelua_user:SENHA_SEGURA_AQUI@localhost:3306/estoquelua"

# JWT Secrets (gerar com: openssl rand -base64 32)
JWT_SECRET=SEU_JWT_SECRET_COM_PELO_MENOS_32_CARACTERES_AQUI
JWT_REFRESH_SECRET=SEU_REFRESH_SECRET_COM_PELO_MENOS_32_CARACTERES_AQUI

# CORS (origens permitidas separadas por vírgula)
CORS_ORIGINS=https://luanova.cloud,https://www.luanova.cloud

# Rate Limiting (opcional, padrões já configurados)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Gerar secrets JWT:**
```bash
openssl rand -base64 32
# Use o resultado para JWT_SECRET e gere outro para JWT_REFRESH_SECRET
```

### 2.4 Gerar Prisma Client

```bash
npm run prisma:generate
```

### 2.5 Aplicar Migrações

```bash
# Aplicar migrações (converte SQLite → MySQL automaticamente)
npm run prisma:migrate:deploy

# Verificar status
npm run prisma:migrate:status
```

### 2.6 Build do Projeto

```bash
npm run build
```

**Verificar se build foi bem-sucedido:**
```bash
ls -la dist/
# Deve existir dist/server.js
```

### 2.7 Criar Diretórios Necessários

```bash
mkdir -p logs uploads/logos uploads/avatars uploads/menu-items

# Dar permissões (se necessário)
chmod -R 755 uploads
chmod -R 755 logs
```

---

## 3️⃣ CONFIGURAR PM2

### 3.1 Iniciar Aplicação

```bash
# Iniciar com PM2
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs
pm2 logs estoquelua-backend
```

### 3.2 Salvar Configuração

```bash
# Salvar configuração atual
pm2 save
```

### 3.3 Configurar Inicialização no Boot

```bash
# Gerar script de startup
pm2 startup

# Copiar e executar o comando exibido (será algo como):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u seu_usuario --hp /home/seu_usuario
```

### 3.4 Verificar Funcionamento

```bash
# Testar health check
curl http://localhost:3001/api/health

# Deve retornar:
# {
#   "success": true,
#   "status": "ok",
#   "database": { "status": "connected", "provider": "MySQL" },
#   ...
# }
```

---

## 4️⃣ CONFIGURAR NGINX (Proxy Reverso)

### 4.1 Instalar Nginx

```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4.2 Configurar Site

```bash
# Criar configuração
sudo nano /etc/nginx/sites-available/estoquelua-api
```

**Conteúdo do arquivo:**

```nginx
server {
    listen 80;
    server_name api.luanova.cloud;  # Substitua pelo seu domínio

    # Logs
    access_log /var/log/nginx/estoquelua-api-access.log;
    error_log /var/log/nginx/estoquelua-api-error.log;

    # Tamanho máximo de upload
    client_max_body_size 10M;

    # Proxy para backend
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint (opcional, para monitoramento)
    location /api/health {
        proxy_pass http://localhost:3001/api/health;
        access_log off;
    }
}
```

### 4.3 Ativar Site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/estoquelua-api /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 5️⃣ CONFIGURAR SSL/HTTPS (Let's Encrypt)

### 5.1 Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 Obter Certificado SSL

```bash
# Obter certificado (substitua pelo seu domínio)
sudo certbot --nginx -d api.luanova.cloud

# Seguir instruções:
# - Email: seu email
# - Aceitar termos: Y
# - Compartilhar email: N (ou Y, sua escolha)
```

### 5.3 Verificar Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Verificar timer
sudo systemctl status certbot.timer
```

**O certificado será renovado automaticamente!**

---

## 6️⃣ CONFIGURAR BACKUP DO BANCO

### 6.1 Criar Script de Backup

```bash
# Criar diretório de backups
sudo mkdir -p /var/backups/estoquelua
sudo chown $USER:$USER /var/backups/estoquelua

# Criar script
nano ~/backup-estoquelua.sh
```

**Conteúdo do script:**

```bash
#!/bin/bash

# Configurações
DB_NAME="estoquelua"
DB_USER="estoquelua_user"
DB_PASS="SUA_SENHA_AQUI"
BACKUP_DIR="/var/backups/estoquelua"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/estoquelua_$DATE.sql"

# Criar backup
mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_FILE

# Comprimir
gzip $BACKUP_FILE

# Remover backups antigos (manter últimos 7 dias)
find $BACKUP_DIR -name "estoquelua_*.sql.gz" -mtime +7 -delete

echo "Backup criado: $BACKUP_FILE.gz"
```

**Dar permissão de execução:**
```bash
chmod +x ~/backup-estoquelua.sh
```

### 6.2 Configurar Cron para Backup Automático

```bash
# Editar crontab
crontab -e

# Adicionar linha (backup diário às 2h da manhã)
0 2 * * * /home/seu_usuario/backup-estoquelua.sh >> /var/log/estoquelua-backup.log 2>&1
```

**Substitua `/home/seu_usuario` pelo seu caminho real!**

---

## 7️⃣ VERIFICAÇÕES FINAIS

### 7.1 Checklist de Verificação

Execute cada comando e verifique:

```bash
# 1. PM2 está rodando
pm2 status
# Deve mostrar estoquelua-backend como "online"

# 2. Health check funciona
curl http://localhost:3001/api/health
# Deve retornar JSON com "status": "ok" e "database": "connected"

# 3. Métricas funcionam
curl http://localhost:3001/api/metrics
# Deve retornar métricas do servidor

# 4. Nginx está rodando
sudo systemctl status nginx
# Deve estar "active (running)"

# 5. MySQL está rodando
sudo systemctl status mysql
# Deve estar "active (running)"

# 6. Firewall está ativo
sudo ufw status
# Deve mostrar regras configuradas

# 7. SSL está configurado
curl -I https://api.luanova.cloud/api/health
# Deve retornar status 200

# 8. Logs estão sendo gerados
ls -la logs/
# Deve existir arquivos de log

# 9. Banco de dados tem tabelas
mysql -u estoquelua_user -p estoquelua -e "SHOW TABLES;"
# Deve listar todas as tabelas
```

### 7.2 Testar API Externa

```bash
# Testar do seu computador local
curl https://api.luanova.cloud/api/health

# Deve retornar:
# {
#   "success": true,
#   "status": "ok",
#   ...
# }
```

---

## 8️⃣ MONITORAMENTO E MANUTENÇÃO

### 8.1 Comandos PM2 Úteis

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs estoquelua-backend

# Reiniciar aplicação
pm2 restart estoquelua-backend

# Parar aplicação
pm2 stop estoquelua-backend

# Ver uso de recursos
pm2 monit

# Ver informações detalhadas
pm2 show estoquelua-backend
```

### 8.2 Verificar Logs

```bash
# Logs da aplicação (Winston)
tail -f logs/combined-*.log
tail -f logs/error-*.log

# Logs do PM2
pm2 logs estoquelua-backend

# Logs do Nginx
sudo tail -f /var/log/nginx/estoquelua-api-access.log
sudo tail -f /var/log/nginx/estoquelua-api-error.log

# Logs do sistema
sudo journalctl -u nginx -f
sudo journalctl -u mysql -f
```

### 8.3 Atualizar Aplicação

```bash
# Ir para diretório
cd /var/www/estoquelua

# Atualizar código
git pull origin prod

# Reinstalar dependências (se necessário)
cd backend
npm install --production

# Aplicar novas migrações (se houver)
npm run prisma:migrate:deploy

# Rebuild
npm run build

# Reiniciar PM2
pm2 restart estoquelua-backend
```

---

## 🚨 TROUBLESHOOTING

### Problema: Aplicação não inicia

```bash
# Verificar logs
pm2 logs estoquelua-backend

# Verificar se build foi feito
ls -la dist/server.js

# Verificar variáveis de ambiente
cat .env

# Testar manualmente
node dist/server.js
```

### Problema: Erro de conexão com banco

```bash
# Testar conexão MySQL
mysql -u estoquelua_user -p estoquelua

# Verificar se banco existe
mysql -u root -p -e "SHOW DATABASES;"

# Verificar permissões
mysql -u root -p -e "SHOW GRANTS FOR 'estoquelua_user'@'localhost';"
```

### Problema: CORS bloqueando requisições

```bash
# Verificar CORS_ORIGINS no .env
cat .env | grep CORS_ORIGINS

# Verificar logs
pm2 logs estoquelua-backend | grep CORS
```

### Problema: Rate limiting muito restritivo

```bash
# Ajustar no .env
RATE_LIMIT_WINDOW_MS=900000      # 15 minutos
RATE_LIMIT_MAX_REQUESTS=200      # Aumentar limite

# Reiniciar
pm2 restart estoquelua-backend
```

### Problema: Certificado SSL expirando

```bash
# Renovar manualmente
sudo certbot renew

# Verificar status
sudo certbot certificates
```

### Problema: Backup não funciona

```bash
# Testar script manualmente
~/backup-estoquelua.sh

# Verificar permissões
ls -la ~/backup-estoquelua.sh

# Verificar logs do cron
grep CRON /var/log/syslog
```

---

## 📊 CHECKLIST FINAL

Antes de considerar deploy completo:

- [ ] Node.js 18+ instalado
- [ ] MySQL instalado e rodando
- [ ] Banco de dados `estoquelua` criado
- [ ] Usuário MySQL criado com permissões
- [ ] Repositório clonado e na branch `prod`
- [ ] Dependências instaladas (`npm install --production`)
- [ ] Arquivo `.env` configurado com todas as variáveis
- [ ] JWT secrets gerados e configurados
- [ ] Prisma Client gerado (`npm run prisma:generate`)
- [ ] Migrações aplicadas (`npm run prisma:migrate:deploy`)
- [ ] Build compilado sem erros (`npm run build`)
- [ ] Diretórios criados (logs, uploads)
- [ ] PM2 instalado e configurado
- [ ] Aplicação rodando no PM2
- [ ] PM2 configurado para iniciar no boot
- [ ] Health check retorna `status: ok` e `database: connected`
- [ ] Nginx instalado e configurado
- [ ] Proxy reverso funcionando
- [ ] SSL/HTTPS configurado (Let's Encrypt)
- [ ] Firewall configurado (UFW)
- [ ] Backup automático configurado
- [ ] Testes externos funcionando
- [ ] Logs sendo gerados corretamente

---

## 🔐 SEGURANÇA ADICIONAL

### Recomendações:

1. **Atualizar sistema regularmente:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Monitorar logs:**
   ```bash
   # Configurar alertas para erros críticos
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

## 📞 SUPORTE

Se encontrar problemas:

1. Verificar logs (`pm2 logs`, `logs/error-*.log`)
2. Verificar health check (`/api/health`)
3. Verificar métricas (`/api/metrics`)
4. Consultar documentação (`MIGRACAO_MYSQL.md`, `CHECKLIST_PRODUCAO.md`)

---

**Status:** ✅ Guia completo de deploy  
**Última atualização:** Dezembro 2024  
**Versão:** 1.0.0

