# Guia de Deploy - Lua Nova / EstoqueLua

## ⚠️ IMPORTANTE: Este projeto usa `output: "standalone"`

Este projeto Next.js está configurado com `output: "standalone"` no `next.config.js`.  
**NUNCA use `next start` em produção.** Use apenas `node .next/standalone/server.js`.

---

## 📋 Pré-requisitos

- Node.js 18+ instalado
- NPM ou Yarn
- PM2 (opcional, para gerenciamento de processo)
- Banco de dados MySQL configurado e acessível
- Variáveis de ambiente configuradas (`.env` ou `.env.production`)

---

## 🔨 Processo de Build

### 1. Instalar Dependências

```bash
cd web
npm install
```

### 2. Executar Build

```bash
npm run build
```

Este comando:
- Executa `next build`
- Gera o output standalone em `.next/standalone/`
- Cria todos os arquivos necessários para produção

### 3. Verificar Output

Após o build, você deve ter:
```
.next/
  standalone/
    server.js          ← Arquivo principal para produção
    package.json       ← Dependências minimalistas
    .next/            ← Build otimizado
    public/           ← Assets públicos
    node_modules/     ← Dependências necessárias
```

---

## 🚀 Iniciar em Produção

### Opção 1: Node.js Direto (Recomendado para PM2)

```bash
cd web
node .next/standalone/server.js
```

### Opção 2: Usando PM2

```bash
cd web
pm2 start .next/standalone/server.js --name "lua-nova-web"
```

### Opção 3: Usando o Script NPM (Apenas após build)

```bash
cd web
npm start
```

**Nota:** O script `npm start` foi configurado para executar `node .next/standalone/server.js` automaticamente.

---

## ⚠️ O QUE NÃO FAZER

### ❌ NÃO USE `next start`

```bash
# ERRADO - NÃO FAÇA ISSO
next start
npm run start:prod  # Este script foi removido
```

**Por quê?**  
- O projeto usa `output: "standalone"`
- `next start` não funciona com standalone mode
- Usar `next start` causará erros de runtime

---

## 🔧 Configuração de Variáveis de Ambiente

Certifique-se de ter as seguintes variáveis configuradas:

```env
# Frontend (.env.local ou .env.production)
NEXT_PUBLIC_API_URL=https://api.seudominio.com/api

# Outras variáveis necessárias...
```

---

## 📦 Estrutura de Deploy Completo

Para deploy em servidor, você precisa copiar:

```
web/
  .next/standalone/     ← Todo o conteúdo desta pasta
  .next/static/         ← Assets estáticos (copiar para .next/standalone/.next/static)
  public/               ← Se houver arquivos públicos adicionais
  .env.production       ← Variáveis de ambiente
```

### Script de Cópia (Exemplo)

```bash
# Após build
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true
```

---

## 🐳 Deploy com Docker (Opcional)

Se usar Docker, o Dockerfile deve:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 🔍 Troubleshooting

### Erro: "Cannot find module" ao iniciar

**Causa:** Assets estáticos não foram copiados corretamente.

**Solução:**
```bash
cp -r .next/static .next/standalone/.next/static
```

### Erro: "EADDRINUSE" (Porta em uso)

**Causa:** A porta 3000 já está sendo usada.

**Solução:**
- Use PM2 para gerenciar o processo
- Ou defina `PORT` no ambiente: `PORT=3001 node .next/standalone/server.js`

### Build falha

**Verifique:**
1. Node.js versão 18+
2. Todas as dependências instaladas (`npm install`)
3. Variáveis de ambiente configuradas
4. Espaço em disco suficiente

---

## 📝 Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `npm run dev` | Desenvolvimento local (porta 3000) |
| `build` | `npm run build` | Build para produção (gera standalone) |
| `start` | `npm start` | Inicia em produção (usa standalone) |
| `lint` | `npm run lint` | Verifica código com ESLint |
| `typecheck` | `npm run typecheck` | Verifica tipos TypeScript |

---

## ✅ Checklist de Deploy

- [ ] Build executado com sucesso (`npm run build`)
- [ ] Assets estáticos copiados (`.next/static` → `.next/standalone/.next/static`)
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados acessível e migrado
- [ ] Porta disponível (padrão: 3000)
- [ ] Processo gerenciado (PM2 ou similar)
- [ ] Logs configurados para monitoramento
- [ ] SSL/HTTPS configurado (via Nginx/Caddy)

---

## 📚 Referências

- [Next.js Standalone Output](https://nextjs.org/docs/pages/api-reference/next-config-js/output#standalone)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)

---

**Última atualização:** Dezembro 2024  
**Versão Next.js:** 14.2.33

