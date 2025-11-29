# ❌ Erro 500 - Explicação Completa

## 🔍 O Que É o Erro 500?

**HTTP 500 Internal Server Error** significa que o servidor encontrou um erro interno e não conseguiu processar a requisição.

## 🐛 Causa do Erro no Nosso Projeto

### Problema Identificado:

```
Error: Cannot find module '@swc/helpers/package.json'
```

### Por Que Acontece?

1. **Next.js 14** usa `@swc` (Speedy Web Compiler) para compilar o código
2. Durante a compilação, o Next.js precisa ler o arquivo `package.json` do módulo `@swc/helpers`
3. O módulo está instalado, mas o Next.js não consegue encontrar o arquivo `package.json` dentro dele
4. Isso impede que o webpack compile o projeto, resultando em erro 500

### Local do Erro:

O erro acontece durante a configuração do webpack:
```
create-compiler-aliases.js → tenta ler @swc/helpers/package.json → FALHA
```

## 🔧 Soluções

### Solução 1: Reinstalação Completa (Recomendada)

```bash
cd web
rm -rf node_modules package-lock.json .next
npm install
npm run dev
```

### Solução 2: Verificar e Criar o Arquivo

```bash
cd web/node_modules/@swc/helpers
ls -la package.json  # Verificar se existe
```

Se não existir, pode ser um problema de instalação corrompida.

### Solução 3: Usar Versão Compatível

O Next.js 14.0.4 espera `@swc/helpers@0.5.2`, mas pode ter sido instalado `0.5.17`.

---

## 📋 Passos para Resolver

Execute os comandos abaixo na ordem:

```bash
# 1. Parar o frontend
pkill -f "next"

# 2. Ir para a pasta web
cd web

# 3. Limpar tudo
rm -rf node_modules package-lock.json .next node_modules/.cache

# 4. Reinstalar
npm install

# 5. Verificar se o módulo existe
ls -la node_modules/@swc/helpers/package.json

# 6. Iniciar novamente
npm run dev
```

---

**Status Atual:** ❌ Frontend com erro 500 devido a módulo faltando
**Solução:** Reinstalação completa das dependências

