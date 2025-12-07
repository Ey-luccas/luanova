# 🗄️ Guia de Migração: SQLite → MySQL

## 📋 Visão Geral

O schema do Prisma está configurado para **SQLite** (desenvolvimento), mas em **produção** deve usar **MySQL**. Este guia documenta o processo completo de migração.

## ⚠️ IMPORTANTE

- **SQLite** é usado apenas para **desenvolvimento local**
- **MySQL** é **obrigatório em produção**
- O schema atual é **compatível** com ambos os bancos
- As migrações existentes são para SQLite, mas podem ser adaptadas

---

## 🔧 CONFIGURAÇÃO DO SCHEMA

### Estado Atual

O `schema.prisma` está configurado assim:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### Para Produção (MySQL)

Em produção, o Prisma usa a `DATABASE_URL` do `.env`, que deve ser MySQL:

```env
DATABASE_URL="mysql://usuario:senha@host:porta/database"
```

**O Prisma detecta automaticamente o provider pela URL!**

- Se `DATABASE_URL` começar com `mysql://` → usa MySQL
- Se `DATABASE_URL` começar com `file:` → usa SQLite
- Se `DATABASE_URL` começar com `postgresql://` → usa PostgreSQL

---

## 📝 PROCESSO DE MIGRAÇÃO PARA PRODUÇÃO

### Opção 1: Usar o Schema Atual (Recomendado)

O schema atual é **compatível com MySQL** porque:
- Não usa recursos específicos do SQLite
- Usa tipos genéricos (String, Int, Decimal, DateTime)
- Não usa enums (que SQLite não suporta nativamente)

**Passos:**

1. **Configurar DATABASE_URL no VPS:**
   ```env
   DATABASE_URL="mysql://usuario:senha@localhost:3306/estoquelua"
   ```

2. **Criar banco de dados MySQL:**
   ```sql
   CREATE DATABASE estoquelua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

3. **Gerar Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

4. **Aplicar migrações:**
   ```bash
   npm run prisma:migrate:deploy
   ```

   **Nota:** As migrações SQLite serão convertidas automaticamente para MySQL pelo Prisma!

### Opção 2: Criar Migrações Específicas para MySQL

Se quiser ter migrações separadas para MySQL:

1. **Criar schema específico para MySQL (opcional):**
   ```prisma
   datasource db {
     provider = "mysql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Criar nova migration para MySQL:**
   ```bash
   # Com DATABASE_URL apontando para MySQL
   npx prisma migrate dev --name init_mysql
   ```

---

## 🔄 DIFERENÇAS ENTRE SQLITE E MYSQL

### Tipos de Dados

| SQLite | MySQL | Status |
|--------|-------|--------|
| `TEXT` | `VARCHAR` ou `TEXT` | ✅ Compatível |
| `INTEGER` | `INT` ou `BIGINT` | ✅ Compatível |
| `REAL` | `DECIMAL` ou `DOUBLE` | ✅ Compatível |
| `DATETIME` | `DATETIME` | ✅ Compatível |
| `BOOLEAN` | `TINYINT(1)` | ✅ Compatível |

### Constraints

- **Unique constraints:** ✅ Compatível
- **Foreign keys:** ✅ Compatível
- **Indexes:** ✅ Compatível
- **Cascade deletes:** ✅ Compatível

### Limitações do SQLite (não afetam MySQL)

- SQLite não suporta enums nativamente → Usamos String (compatível)
- SQLite não suporta alguns tipos → Não usamos tipos incompatíveis

---

## 🚀 PASSO A PASSO PARA VPS (PRODUÇÃO)

### 1. Instalar MySQL no VPS

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# Iniciar MySQL
sudo systemctl start mysql
sudo systemctl enable mysql

# Configurar segurança
sudo mysql_secure_installation
```

### 2. Criar Banco de Dados

```bash
# Acessar MySQL
sudo mysql -u root -p

# Criar banco
CREATE DATABASE estoquelua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Criar usuário (recomendado)
CREATE USER 'estoquelua_user'@'localhost' IDENTIFIED BY 'senha_segura_aqui';
GRANT ALL PRIVILEGES ON estoquelua.* TO 'estoquelua_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configurar .env no VPS

```env
NODE_ENV=production
PORT=3001
DATABASE_URL="mysql://estoquelua_user:senha_segura_aqui@localhost:3306/estoquelua"
JWT_SECRET=seu-jwt-secret-com-pelo-menos-32-caracteres
JWT_REFRESH_SECRET=seu-refresh-secret-com-pelo-menos-32-caracteres
```

### 4. Aplicar Migrações

```bash
cd backend

# Gerar Prisma Client
npm run prisma:generate

# Aplicar migrações (converte automaticamente para MySQL)
npm run prisma:migrate:deploy
```

### 5. Verificar Migração

```bash
# Verificar status
npm run prisma:migrate:status

# Verificar conexão
npm run prisma:studio
# ou
curl http://localhost:3001/api/health
```

---

## 🔍 VERIFICAÇÕES PÓS-MIGRAÇÃO

### 1. Verificar Tabelas Criadas

```sql
USE estoquelua;
SHOW TABLES;
```

Deve mostrar todas as tabelas:
- users
- companies
- company_users
- categories
- products
- stock_movements
- product_units
- sales
- extensions
- company_extensions
- ... (e todas as outras)

### 2. Verificar Estrutura de uma Tabela

```sql
DESCRIBE users;
DESCRIBE products;
```

### 3. Testar Aplicação

```bash
# Health check deve retornar database: connected
curl http://localhost:3001/api/health

# Deve retornar provider: MySQL
curl http://localhost:3001/api/metrics
```

---

## ⚠️ PROBLEMAS COMUNS E SOLUÇÕES

### Erro: "Unknown database"

**Problema:** Banco de dados não existe

**Solução:**
```sql
CREATE DATABASE estoquelua CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Erro: "Access denied"

**Problema:** Usuário não tem permissões

**Solução:**
```sql
GRANT ALL PRIVILEGES ON estoquelua.* TO 'usuario'@'localhost';
FLUSH PRIVILEGES;
```

### Erro: "Table already exists"

**Problema:** Tabelas já existem no banco

**Solução:**
```bash
# Verificar status das migrações
npm run prisma:migrate:status

# Se necessário, resetar (CUIDADO: apaga dados!)
npm run db:reset
```

### Erro: "Migration failed"

**Problema:** Migração falhou

**Solução:**
```bash
# Verificar logs
npm run prisma:migrate:status

# Tentar novamente
npm run prisma:migrate:deploy

# Se persistir, verificar sintaxe SQL das migrações
```

---

## 📊 COMPARAÇÃO: SQLITE vs MYSQL

### SQLite (Desenvolvimento)
- ✅ Fácil de configurar
- ✅ Não precisa de servidor
- ✅ Arquivo único
- ❌ Não suporta enums nativamente
- ❌ Limitações de concorrência
- ❌ Não recomendado para produção

### MySQL (Produção)
- ✅ Suporta múltiplas conexões simultâneas
- ✅ Melhor performance
- ✅ Suporta enums (mas não usamos)
- ✅ Recursos avançados (triggers, stored procedures)
- ✅ Recomendado para produção
- ❌ Requer servidor MySQL

---

## 🎯 CHECKLIST DE MIGRAÇÃO

Antes de fazer deploy em produção:

- [ ] MySQL instalado e rodando no VPS
- [ ] Banco de dados `estoquelua` criado
- [ ] Usuário MySQL criado com permissões
- [ ] `DATABASE_URL` configurado no `.env` (formato MySQL)
- [ ] `NODE_ENV=production` no `.env`
- [ ] Prisma Client gerado (`npm run prisma:generate`)
- [ ] Migrações aplicadas (`npm run prisma:migrate:deploy`)
- [ ] Health check retorna `database: connected` e `provider: MySQL`
- [ ] Testes básicos realizados (criar usuário, empresa, produto)

---

## 🔐 SEGURANÇA

### Boas Práticas

1. **Usuário dedicado:**
   - Não use `root` em produção
   - Crie usuário específico para a aplicação
   - Dê apenas permissões necessárias

2. **Senha forte:**
   - Use senha complexa para o usuário MySQL
   - Não commite senhas no Git

3. **Backup:**
   - Configure backup automático do MySQL
   - Teste restauração de backups

4. **Firewall:**
   - MySQL deve aceitar conexões apenas de `localhost`
   - Não exponha MySQL na internet

---

## 📚 RECURSOS ADICIONAIS

### Comandos MySQL Úteis

```sql
-- Ver bancos de dados
SHOW DATABASES;

-- Usar banco
USE estoquelua;

-- Ver tabelas
SHOW TABLES;

-- Ver estrutura de tabela
DESCRIBE nome_tabela;

-- Ver índices
SHOW INDEX FROM nome_tabela;

-- Ver tamanho do banco
SELECT 
  table_schema AS 'Database',
  ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'estoquelua'
GROUP BY table_schema;
```

### Backup e Restore

```bash
# Backup
mysqldump -u usuario -p estoquelua > backup_$(date +%Y%m%d).sql

# Restore
mysql -u usuario -p estoquelua < backup_20241205.sql
```

---

## ✅ CONCLUSÃO

O schema atual é **compatível com MySQL** e pode ser usado diretamente em produção. Basta:

1. Configurar `DATABASE_URL` com MySQL
2. Aplicar migrações (`prisma:migrate:deploy`)
3. Prisma converte automaticamente SQLite → MySQL

**Não é necessário modificar o schema.prisma!**

---

**Última atualização:** Dezembro 2024  
**Status:** ✅ Schema compatível com MySQL

