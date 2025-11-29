# 🔧 Solução Definitiva para o Erro 500

## 📋 Explicação do Erro 500

**O que é:** HTTP 500 Internal Server Error = Erro interno do servidor

**No nosso caso:** O Next.js não consegue encontrar o módulo `@swc/helpers/package.json` durante a compilação, mesmo que o arquivo exista.

**Causa provável:** Problema de resolução de módulos ou cache corrompido do Next.js.

## ✅ Solução Passo a Passo

Execute os comandos abaixo na ordem:

```bash
# 1. Parar o frontend
pkill -f "next"

# 2. Entrar na pasta web
cd web

# 3. LIMPAR COMPLETAMENTE
rm -rf node_modules package-lock.json .next node_modules/.cache

# 4. REINSTALAR TUDO
npm install

# 5. Se ainda não funcionar, reinstalar Next.js especificamente
npm install next@14.0.4 --save --force

# 6. Iniciar novamente
npm run dev
```

## 🔍 Verificação

Após reinstalar, verifique:

```bash
# Verificar se o arquivo existe
ls -la node_modules/@swc/helpers/package.json

# Verificar versão do Next.js
npm list next

# Testar se consegue resolver o módulo
node -e "console.log(require.resolve('@swc/helpers/package.json'))"
```

## 🚨 Se Ainda Não Funcionar

Pode ser necessário atualizar a versão do Next.js ou usar uma versão diferente:

```bash
cd web
rm -rf node_modules package-lock.json .next
npm install next@latest --save
npm install
npm run dev
```

---

**Status:** O arquivo `package.json` existe, mas o Next.js não consegue encontrá-lo durante a compilação.

