# 🔧 Solução de Problemas - EstoqueRápido

## ❌ Problema: Frontend retornando erro 500

### Causa Identificada
O Next.js estava com problemas de cache e dependências. Os módulos `@swc/helpers` estavam faltando ou corrompidos.

### ✅ Solução Aplicada

1. **Corrigido AuthContext** - Adicionado `companyId` e `setCompanyId` ao contexto
2. **Corrigida página inicial** - Adicionada lógica de redirecionamento
3. **Instalado módulos faltantes** - `@swc/helpers` instalado
4. **Limpeza de cache** - Removido `.next` e cache do webpack

### 📋 Comandos para Resolver Manualmente

```bash
# 1. Parar todos os processos
pkill -f "next|ts-node|node.*server"

# 2. Limpar cache do Next.js
cd web
rm -rf .next node_modules/.cache

# 3. Reinstalar dependências (se necessário)
npm install

# 4. Iniciar novamente
cd ..
npm run dev
```

### 🔍 Verificar se está funcionando

```bash
# Backend (deve retornar JSON)
curl http://localhost:3001/api/health

# Frontend (deve retornar HTML)
curl -I http://localhost:3000
```

### 📝 Status Atual

- ✅ **Backend**: Funcionando corretamente na porta 3001
- ⚠️ **Frontend**: Ainda apresentando erro 500 (problema de cache/webpack)

### 🎯 Próximos Passos

Se o problema persistir, tente:

```bash
cd web
rm -rf node_modules .next
npm install
npm run dev
```

Ou use a porta alternativa que o Next.js pode ter escolhido:
- Verifique qual porta o Next.js está usando nos logs
- Acesse http://localhost:PORTA (pode ser 3000, 3001, 3002, etc.)

---

## 🚀 Como Rodar o Projeto

### Comando Único (Raiz do Projeto)

```bash
npm run dev
```

Isso inicia:
- Backend na porta **3001**
- Frontend na porta **3000**

### URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

