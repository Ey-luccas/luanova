# 🚀 Guia Completo de Deploy VPS - EstoqueLua

Este documento contém **TUDO** que você precisa saber para colocar o EstoqueLua online em um servidor VPS.

---

## 📋 Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Preparação do Servidor](#preparação-do-servidor)
3. [Instalação de Dependências](#instalação-de-dependências)
4. [Configuração do MySQL](#configuração-do-mysql)
5. [Deploy do Backend](#deploy-do-backend)
6. [Configuração do Nginx](#configuração-do-nginx)
7. [Configuração SSL/HTTPS](#configuração-sslhttps)
8. [Deploy do Frontend](#deploy-do-frontend)
9. [Backup Automático](#backup-automático)
10. [Verificações Finais](#verificações-finais)
11. [Comandos Úteis](#comandos-úteis)
12. [Troubleshooting](#troubleshooting)

---

## ✅ Pré-requisitos

Antes de começar, você precisa ter:

- ✅ **VPS** com Ubuntu 20.04+ ou Debian 11+ (recomendado: Ubuntu 22.04)
- ✅ **Acesso SSH** ao servidor
- ✅ **Usuário com permissões sudo**
- ✅ **Domínio configurado** (opcional, mas recomendado)
  - Exemplo: `luanova.cloud`
  - Subdomínios: `api.luanova.cloud` (backend) e `luanova.cloud` (frontend)

---

## 🖥️ Preparação do Servidor

### 1. Conectar ao Servidor

```bash
ssh usuario@seu-servidor-ip
# ou
ssh usuario@seu-dominio.com
```

### 2. Atualizar o Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 3. Instalar Ferramentas Básicas

```bash
sudo apt install -y curl wget git ufw
```

---

## 📦 Instalação de Dependências

### 1. Instalar Node.js 20

```bash
# Adicionar repositório do NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instalar Node.js
sudo apt install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v20.x.x
npm --version   # Deve mostrar 10.x.x
```

### 2. Instalar PM2 (Gerenciador de Processos)

```bash
sudo npm install -g pm2

# Verificar instalação
pm2 --version
```

### 3. Instalar MySQL

```bash
# Instalar MySQL
sudo apt install -y mysql-server

# Iniciar e habilitar MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Verificar status
sudo systemctl status mysql
```

### 4. Instalar Nginx

```bash
# Instalar Nginx
sudo apt install -y nginx

# Iniciar e habilitar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verificar status
sudo systemctl status nginx
```

---

## 🗄️ Configuração do MySQL

### 1. Configurar Segurança do MySQL

```bash
sudo mysql_secure_installation
```

**Responda às perguntas:**
- Validar senha? **N** (se quiser senha simples) ou **Y** (senha forte)
- Remover usuários anônimos? **Y**
- Desabilitar login remoto root? **Y**
- Remover banco de teste? **Y**
- Recarregar privilégios? **Y**

### 2. Criar Banco de Dados e Usuário

```bash
# Acessar MySQL como root
sudo mysql -u root -p
```

Dentro do MySQL, execute:

```sql
-- Criar banco de dados
CREATE DATABASE estoquelua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário (substitua 'SENHA_SEGURA' por uma senha forte!)
CREATE USER 'estoquelua_user'@'localhost' IDENTIFIED BY 'SENHA_SEGURA';

-- Dar permissões
GRANT ALL PRIVILEGES ON estoquelua.* TO 'estoquelua_user'@'localhost';

-- Aplicar mudanças
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;
SELECT user, host FROM mysql.user WHERE user = 'estoquelua_user';

-- Sair
EXIT;
```

**⚠️ IMPORTANTE:** Anote a senha do usuário `estoquelua_user`, você vai precisar dela!

### 3. Testar Conexão

```bash
mysql -u estoquelua_user -p estoquelua
# Digite a senha quando solicitado
# Se conectar com sucesso, digite: EXIT;
```

---

## 🔧 Deploy do Backend

### 1. Clonar Repositório

```bash
# Ir para diretório de aplicações
cd /var/www

# Clonar repositório (substitua pela URL do seu repositório)
sudo git clone https://github.com/SEU_USUARIO/SEU_REPO.git estoquelua

# Dar permissões ao seu usuário
sudo chown -R $USER:$USER /var/www/estoquelua

# Entrar no diretório
cd estoquelua

# Ir para branch de produção
git checkout prod
```

### 2. Configurar Variáveis de Ambiente

```bash
# Ir para o backend
cd backend

# Copiar arquivo de exemplo
cp .env.example .env

# Editar arquivo .env
nano .env
```

**Cole e configure o seguinte conteúdo:**

```env
NODE_ENV=production
PORT=3001

# MySQL (substitua 'SENHA_SEGURA' pela senha que você criou)
DATABASE_URL="mysql://estoquelua_user:SENHA_SEGURA@localhost:3306/estoquelua"

# JWT Secrets (gerar com: openssl rand -base64 32)
JWT_SECRET=GERAR_SECRET_AQUI_COM_32_CARACTERES_MINIMO
JWT_REFRESH_SECRET=GERAR_OUTRO_SECRET_AQUI_COM_32_CARACTERES_MINIMO

# CORS (substitua pelos seus domínios)
CORS_ORIGINS=https://luanova.cloud,https://www.luanova.cloud

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Para gerar os JWT secrets, execute em outro terminal:**

```bash
openssl rand -base64 32
# Use o resultado para JWT_SECRET
openssl rand -base64 32
# Use o resultado para JWT_REFRESH_SECRET
```

**Salve o arquivo:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 3. Instalar Dependências

```bash
# Instalar apenas dependências de produção
npm install --production
```

### 4. Configurar Banco de Dados

```bash
# Gerar Prisma Client
npm run prisma:generate

# Aplicar migrações (cria todas as tabelas)
npm run prisma:migrate:deploy

# Verificar status
npm run prisma:migrate:status
```

### 5. Build do Projeto

```bash
# Compilar TypeScript
npm run build

# Verificar se build foi bem-sucedido
ls -la dist/server.js
# Deve existir o arquivo
```

### 6. Criar Diretórios Necessários

```bash
# Criar diretórios
mkdir -p logs uploads/logos uploads/avatars uploads/menu-items

# Dar permissões
chmod -R 755 uploads logs
```

### 7. Iniciar com PM2

```bash
# Iniciar aplicação
pm2 start ecosystem.config.js

# Verificar status
pm2 status

# Ver logs em tempo real (opcional)
pm2 logs estoquelua-backend

# Salvar configuração
pm2 save

# Configurar para iniciar no boot do sistema
pm2 startup
# Copie e execute o comando que aparecer (algo como):
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u seu_usuario --hp /home/seu_usuario
```

### 8. Verificar Funcionamento

```bash
# Testar health check
curl http://localhost:3001/api/health

# Deve retornar JSON com "status": "ok" e "database": {"status": "connected"}
```

---

## 🌐 Configuração do Nginx

### 1. Configurar Site do Backend

```bash
# Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/estoquelua-api
```

**Cole o seguinte conteúdo (substitua `api.luanova.cloud` pelo seu subdomínio):**

```nginx
server {
    listen 80;
    server_name api.luanova.cloud;  # Substitua pelo seu domínio

    # Logs
    access_log /var/log/nginx/estoquelua-api-access.log;
    error_log /var/log/nginx/estoquelua-api-error.log;

    # Tamanho máximo de upload (10MB)
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
}
```

**Salvar:** `Ctrl + O`, `Enter`, `Ctrl + X`

### 2. Ativar Site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/estoquelua-api /etc/nginx/sites-enabled/

# Remover site padrão (se existir)
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Se tudo estiver OK, recarregar Nginx
sudo systemctl reload nginx
```

### 3. Configurar DNS

**No seu provedor de DNS, configure:**

```
Tipo: A
Nome: api
Valor: IP_DO_SEU_SERVIDOR
TTL: 3600
```

**Aguarde alguns minutos para propagação do DNS.**

---

## 🔒 Configuração SSL/HTTPS

### 1. Instalar Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obter Certificado SSL

```bash
# Obter certificado (substitua pelo seu domínio)
sudo certbot --nginx -d api.luanova.cloud

# Seguir instruções:
# - Email: seu email
# - Aceitar termos: Y
# - Compartilhar email: N (ou Y, sua escolha)
# - Redirecionar HTTP para HTTPS: 2 (Sim)
```

### 3. Verificar Renovação Automática

```bash
# Testar renovação
sudo certbot renew --dry-run

# Verificar timer (renovação automática)
sudo systemctl status certbot.timer
```

**✅ O certificado será renovado automaticamente!**

### 4. Testar HTTPS

```bash
# Testar do servidor
curl -I https://api.luanova.cloud/api/health

# Deve retornar status 200
```

---

## 🎨 Deploy do Frontend

Você tem **2 opções**:

### **Opção A: Deploy no Vercel (Recomendado - Mais Fácil)**

1. **Acesse:** https://vercel.com
2. **Conecte seu repositório GitHub**
3. **Configure variáveis de ambiente:**
   - `NEXT_PUBLIC_API_URL` = `https://api.luanova.cloud/api`
4. **Deploy automático** a cada push na branch `prod`

**Pronto!** O frontend estará disponível em uma URL da Vercel ou você pode configurar seu próprio domínio.

### **Opção B: Deploy no VPS Próprio**

#### 1. Build do Frontend

```bash
# Voltar para raiz do projeto
cd /var/www/estoquelua/web

# Instalar dependências
npm install --production

# Build
npm run build

# Testar localmente (opcional)
npm start
# Pressione Ctrl+C para parar
```

#### 2. Iniciar com PM2

```bash
# Iniciar frontend com PM2
pm2 start npm --name "estoquelua-web" -- start

# Salvar
pm2 save

# Verificar
pm2 status
```

#### 3. Configurar Nginx para Frontend

```bash
# Criar configuração
sudo nano /etc/nginx/sites-available/estoquelua-web
```

**Cole:**

```nginx
server {
    listen 80;
    server_name luanova.cloud www.luanova.cloud;  # Seus domínios

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Ativar
sudo ln -s /etc/nginx/sites-available/estoquelua-web /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configurar SSL
sudo certbot --nginx -d luanova.cloud -d www.luanova.cloud
```

---

## 💾 Backup Automático

### 1. Criar Script de Backup

```bash
# Criar diretório de backups
sudo mkdir -p /var/backups/estoquelua
sudo chown $USER:$USER /var/backups/estoquelua

# Criar script
nano ~/backup-estoquelua.sh
```

**Cole:**

```bash
#!/bin/bash

# Configurações (SUBSTITUA pela senha do MySQL)
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

**Salvar e dar permissão:**

```bash
chmod +x ~/backup-estoquelua.sh
```

**⚠️ IMPORTANTE:** Edite o script e substitua `SUA_SENHA_AQUI` pela senha real!

### 2. Testar Backup

```bash
# Testar manualmente
~/backup-estoquelua.sh

# Verificar se backup foi criado
ls -lh /var/backups/estoquelua/
```

### 3. Configurar Backup Automático (Cron)

```bash
# Editar crontab
crontab -e

# Adicionar linha (backup diário às 2h da manhã)
0 2 * * * /home/seu_usuario/backup-estoquelua.sh >> /var/log/estoquelua-backup.log 2>&1

# Salvar e sair
```

**Substitua `/home/seu_usuario` pelo caminho real do seu usuário!**

Para descobrir seu caminho:

```bash
echo $HOME
```

---

## ✅ Verificações Finais

Execute cada comando e verifique:

```bash
# 1. PM2 está rodando
pm2 status
# Deve mostrar "estoquelua-backend" como "online"

# 2. Backend respondendo localmente
curl http://localhost:3001/api/health
# Deve retornar JSON com "status": "ok"

# 3. Backend respondendo via Nginx
curl https://api.luanova.cloud/api/health
# Deve retornar JSON com "status": "ok"

# 4. Nginx rodando
sudo systemctl status nginx
# Deve estar "active (running)"

# 5. MySQL rodando
sudo systemctl status mysql
# Deve estar "active (running)"

# 6. SSL funcionando
curl -I https://api.luanova.cloud/api/health
# Deve retornar status 200 e header "Strict-Transport-Security"

# 7. Firewall configurado
sudo ufw status
# Deve mostrar regras para 22, 80, 443

# 8. Logs sendo gerados
ls -la /var/www/estoquelua/backend/logs/
# Deve existir arquivos de log
```

### **Testar do Seu Computador:**

```bash
# Abrir navegador e acessar:
https://api.luanova.cloud/api/health

# Deve retornar JSON válido
```

---

## 🛠️ Comandos Úteis

### **PM2 - Gerenciar Aplicação**

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

### **Logs**

```bash
# Logs da aplicação
tail -f /var/www/estoquelua/backend/logs/combined-*.log
tail -f /var/www/estoquelua/backend/logs/error-*.log

# Logs do PM2
pm2 logs estoquelua-backend

# Logs do Nginx
sudo tail -f /var/log/nginx/estoquelua-api-access.log
sudo tail -f /var/log/nginx/estoquelua-api-error.log

# Logs do sistema
sudo journalctl -u nginx -f
sudo journalctl -u mysql -f
```

### **Atualizar Aplicação**

```bash
cd /var/www/estoquelua

# Atualizar código
git pull origin prod

# Backend
cd backend
npm install --production
npm run prisma:migrate:deploy  # Se houver novas migrações
npm run build
pm2 restart estoquelua-backend

# Frontend (se no VPS)
cd ../web
npm install --production
npm run build
pm2 restart estoquelua-web
```

### **MySQL**

```bash
# Acessar MySQL
mysql -u estoquelua_user -p estoquelua

# Ver tabelas
SHOW TABLES;

# Ver tamanho do banco
SELECT table_schema AS "Database", 
       ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS "Size (MB)" 
FROM information_schema.TABLES 
WHERE table_schema = "estoquelua";

# Sair
EXIT;
```

---

## 🚨 Troubleshooting

### **Problema: Backend não inicia**

```bash
# Ver logs
pm2 logs estoquelua-backend

# Verificar se build foi feito
ls -la /var/www/estoquelua/backend/dist/server.js

# Verificar .env
cat /var/www/estoquelua/backend/.env

# Testar manualmente
cd /var/www/estoquelua/backend
node dist/server.js
```

### **Problema: Erro de conexão com MySQL**

```bash
# Testar conexão
mysql -u estoquelua_user -p estoquelua

# Verificar se MySQL está rodando
sudo systemctl status mysql

# Verificar se banco existe
mysql -u root -p -e "SHOW DATABASES;"

# Verificar permissões
mysql -u root -p -e "SHOW GRANTS FOR 'estoquelua_user'@'localhost';"
```

### **Problema: CORS bloqueando requisições**

```bash
# Verificar CORS_ORIGINS no .env
cat /var/www/estoquelua/backend/.env | grep CORS_ORIGINS

# Ver logs
pm2 logs estoquelua-backend | grep CORS

# Adicionar domínio faltante no .env
nano /var/www/estoquelua/backend/.env
# Adicionar domínio em CORS_ORIGINS
pm2 restart estoquelua-backend
```

### **Problema: 502 Bad Gateway**

```bash
# Verificar se backend está rodando
pm2 status

# Verificar se porta está aberta
netstat -tlnp | grep 3001

# Ver logs do Nginx
sudo tail -f /var/log/nginx/estoquelua-api-error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

### **Problema: Certificado SSL não funciona**

```bash
# Verificar certificado
sudo certbot certificates

# Renovar manualmente
sudo certbot renew

# Verificar Nginx
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### **Problema: Backup não funciona**

```bash
# Testar script manualmente
~/backup-estoquelua.sh

# Verificar permissões
ls -la ~/backup-estoquelua.sh

# Ver logs do cron
grep CRON /var/log/syslog | tail -20

# Verificar se senha está correta no script
cat ~/backup-estoquelua.sh
```

### **Problema: Porta já em uso**

```bash
# Verificar qual processo está usando a porta
sudo lsof -i :3001
sudo lsof -i :3000
sudo lsof -i :80
sudo lsof -i :443

# Matar processo (se necessário)
sudo kill -9 PID_DO_PROCESSO
```

---

## 📝 Checklist Final

Antes de considerar tudo pronto:

- [ ] Node.js 20+ instalado
- [ ] MySQL instalado e banco criado
- [ ] Usuário MySQL criado com permissões
- [ ] Repositório clonado na branch `prod`
- [ ] `.env` configurado com todos os valores
- [ ] JWT secrets gerados e configurados
- [ ] Prisma Client gerado
- [ ] Migrações aplicadas
- [ ] Build compilado sem erros
- [ ] PM2 rodando e configurado para boot
- [ ] Backend respondendo em `localhost:3001`
- [ ] Nginx configurado e rodando
- [ ] DNS configurado para `api.seu-dominio.com`
- [ ] SSL/HTTPS configurado
- [ ] Frontend deployado (Vercel ou VPS)
- [ ] Backend acessível via HTTPS
- [ ] Frontend conectando ao backend
- [ ] Login funcionando
- [ ] Backup automático configurado
- [ ] Firewall configurado (portas 22, 80, 443)
- [ ] Logs sendo gerados

---

## 🎉 Pronto!

Se todos os itens estão marcados, seu sistema está **100% online e funcionando**! 🚀

### **URLs Finais:**
- **Backend API:** `https://api.luanova.cloud/api`
- **Frontend:** `https://luanova.cloud` (ou URL da Vercel)
- **Health Check:** `https://api.luanova.cloud/api/health`

### **Próximos Passos:**
1. Monitorar logs nos primeiros dias
2. Verificar backups automáticos
3. Configurar alertas (opcional)
4. Fazer primeiro login e criar empresa

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs (`pm2 logs`, arquivos em `logs/`)
2. Verifique o health check (`/api/health`)
3. Consulte a seção [Troubleshooting](#troubleshooting)
4. Verifique se todos os pré-requisitos foram instalados

---

**Boa sorte com o deploy! 🚀**

