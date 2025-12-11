# ✅ Checklist de Deploy - EstoqueLua

Use este checklist para garantir que tudo está configurado corretamente antes do deploy.

---

## 📋 Pré-Deploy

### **Repositório**
- [x] Branch `prod` está atualizada
- [ ] Alterações commitadas e pushed
- [ ] Schema Prisma configurado para MySQL ✅
- [ ] `.env.example` criado ✅
- [ ] Documentação atualizada ✅

### **Testes Locais**
- [ ] Build do backend funciona (`npm run build`)
- [ ] Build do frontend funciona (`npm run build`)
- [ ] TypeScript compila sem erros
- [ ] Testes básicos executados

---

## 🖥️ Servidor VPS

### **Sistema**
- [ ] Sistema operacional atualizado (Ubuntu/Debian)
- [ ] Node.js 20+ instalado (`node --version`)
- [ ] npm 10+ instalado (`npm --version`)
- [ ] Git instalado
- [ ] PM2 instalado globalmente (`npm install -g pm2`)

### **MySQL**
- [ ] MySQL instalado
- [ ] MySQL rodando (`sudo systemctl status mysql`)
- [ ] Banco de dados criado:
  ```sql
  CREATE DATABASE estoquelua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  ```
- [ ] Usuário MySQL criado:
  ```sql
  CREATE USER 'estoquelua_user'@'localhost' IDENTIFIED BY 'SENHA_SEGURA';
  GRANT ALL PRIVILEGES ON estoquelua.* TO 'estoquelua_user'@'localhost';
  FLUSH PRIVILEGES;
  ```
- [ ] Conexão testada:
  ```bash
  mysql -u estoquelua_user -p estoquelua
  ```

### **Nginx**
- [ ] Nginx instalado
- [ ] Nginx rodando (`sudo systemctl status nginx`)
- [ ] Configuração do backend criada (`/etc/nginx/sites-available/estoquelua-api`)
- [ ] Site ativado (`sudo ln -s /etc/nginx/sites-available/estoquelua-api /etc/nginx/sites-enabled/`)
- [ ] Configuração testada (`sudo nginx -t`)
- [ ] Nginx recarregado (`sudo systemctl reload nginx`)

### **Firewall (UFW)**
- [ ] SSH permitido (porta 22)
- [ ] HTTP permitido (porta 80)
- [ ] HTTPS permitido (porta 443)
- [ ] Firewall habilitado (`sudo ufw enable`)
- [ ] Status verificado (`sudo ufw status`)

---

## 🔧 Backend

### **Configuração**
- [ ] Repositório clonado na VPS (`/var/www/estoquelua`)
- [ ] Branch `prod` ativa (`git checkout prod`)
- [ ] Dependências instaladas (`npm install --production`)
- [ ] Arquivo `.env` criado (`cp .env.example .env`)
- [ ] `.env` configurado com valores corretos:
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL` configurado (MySQL)
  - [ ] `JWT_SECRET` gerado (mínimo 32 caracteres)
  - [ ] `JWT_REFRESH_SECRET` gerado (mínimo 32 caracteres)
  - [ ] `CORS_ORIGINS` configurado (domínios permitidos)
  - [ ] `RATE_LIMIT_*` configurado (opcional)

### **Banco de Dados**
- [ ] Prisma Client gerado (`npm run prisma:generate`)
- [ ] Migrações aplicadas (`npm run prisma:migrate:deploy`)
- [ ] Status das migrações verificado (`npm run prisma:migrate:status`)

### **Build e Deploy**
- [ ] Build executado (`npm run build`)
- [ ] Diretórios criados:
  ```bash
  mkdir -p logs uploads/logos uploads/avatars uploads/menu-items
  ```
- [ ] Permissões configuradas:
  ```bash
  chmod -R 755 uploads logs
  ```

### **PM2**
- [ ] Aplicação iniciada (`pm2 start ecosystem.config.js`)
- [ ] Status verificado (`pm2 status`)
- [ ] Logs verificados (`pm2 logs estoquelua-backend`)
- [ ] Configuração salva (`pm2 save`)
- [ ] Startup configurado (`pm2 startup` + comando exibido)

### **Testes**
- [ ] Health check funciona:
  ```bash
  curl http://localhost:3001/api/health
  ```
- [ ] Retorna JSON válido com `"status": "ok"`
- [ ] Database conectado (`"database": { "status": "connected" }`)

---

## 🌐 Frontend

### **Opção A: Deploy no Vercel (Reconmendado)**

- [ ] Repositório conectado ao Vercel
- [ ] Variável de ambiente configurada:
  - [ ] `NEXT_PUBLIC_API_URL=https://api.seu-dominio.com/api`
- [ ] Deploy executado
- [ ] URL de produção funcionando

### **Opção B: Deploy no VPS**

- [ ] Repositório clonado (`/var/www/estoquelua/web`)
- [ ] Dependências instaladas (`npm install --production`)
- [ ] Build executado (`npm run build`)
- [ ] PM2 configurado:
  ```bash
  pm2 start npm --name "estoquelua-web" -- start
  pm2 save
  ```
- [ ] Nginx configurado para frontend
- [ ] Frontend acessível via navegador

---

## 🔒 SSL/HTTPS

- [ ] Certbot instalado:
  ```bash
  sudo apt install certbot python3-certbot-nginx -y
  ```
- [ ] Certificado SSL obtido:
  ```bash
  sudo certbot --nginx -d api.seu-dominio.com
  ```
- [ ] Renovação automática testada:
  ```bash
  sudo certbot renew --dry-run
  ```
- [ ] HTTPS funcionando:
  ```bash
  curl -I https://api.seu-dominio.com/api/health
  ```

---

## 🔄 Backup

- [ ] Script de backup criado (`~/backup-estoquelua.sh`)
- [ ] Permissão de execução (`chmod +x ~/backup-estoquelua.sh`)
- [ ] Teste manual executado:
  ```bash
  ~/backup-estoquelua.sh
  ```
- [ ] Cron configurado (backup diário):
  ```bash
  crontab -e
  # Adicionar: 0 2 * * * /home/usuario/backup-estoquelua.sh
  ```
- [ ] Diretório de backups criado (`/var/backups/estoquelua`)

---

## ✅ Verificações Finais

### **Backend**
- [ ] PM2 rodando (`pm2 status` mostra "online")
- [ ] Health check retorna OK (`curl http://localhost:3001/api/health`)
- [ ] API acessível via Nginx (`curl https://api.seu-dominio.com/api/health`)
- [ ] Logs sendo gerados (`ls -la logs/`)
- [ ] Sem erros nos logs (`pm2 logs estoquelua-backend | tail -20`)

### **Frontend**
- [ ] Acessível via navegador
- [ ] API conectada corretamente
- [ ] Login funciona
- [ ] Navegação funciona
- [ ] Sem erros no console do navegador

### **Integração**
- [ ] Login funciona end-to-end
- [ ] Dashboard carrega dados
- [ ] Produtos listam corretamente
- [ ] Upload de imagens funciona
- [ ] Criação de registros funciona

---

## 📊 Monitoramento

- [ ] PM2 monitor configurado (`pm2 monit`)
- [ ] Logs sendo verificados regularmente
- [ ] Uso de recursos monitorado (`htop` ou `pm2 monit`)
- [ ] Alertas configurados (opcional)

---

## 📝 Documentação

- [ ] Credenciais documentadas (em local seguro)
- [ ] Senhas armazenadas em gerenciador de senhas
- [ ] Informações de acesso anotadas
- [ ] Guias de manutenção acessíveis

---

## 🚨 Troubleshooting

### Se algo não funcionar:

1. **Backend não inicia:**
   - Verificar logs: `pm2 logs estoquelua-backend`
   - Verificar `.env`: `cat .env`
   - Testar manualmente: `node dist/server.js`

2. **Erro de conexão com banco:**
   - Testar conexão: `mysql -u estoquelua_user -p estoquelua`
   - Verificar `DATABASE_URL` no `.env`
   - Verificar se MySQL está rodando: `sudo systemctl status mysql`

3. **CORS bloqueando:**
   - Verificar `CORS_ORIGINS` no `.env`
   - Verificar logs: `pm2 logs estoquelua-backend | grep CORS`
   - Adicionar domínio faltante

4. **SSL não funciona:**
   - Verificar certificado: `sudo certbot certificates`
   - Renovar: `sudo certbot renew`
   - Verificar Nginx: `sudo nginx -t`

---

## ✨ Pronto!

Se todos os itens estão marcados, o sistema está pronto para produção! 🎉

**Próximos passos:**
1. Monitorar logs nos primeiros dias
2. Verificar backups automáticos
3. Configurar alertas (opcional)
4. Documentar procedimentos de manutenção

---

**Data do Deploy:** _______________  
**Responsável:** _______________  
**Observações:** _______________

