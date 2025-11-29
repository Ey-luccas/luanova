# 🚀 Início Rápido - EstoqueRápido

## ✅ Status Atual

- ✅ **Backend:** Funcionando na porta **3001**
- ⚠️ **Frontend:** Precisa ser reiniciado

## 🎯 Para Ver o Projeto AGORA

### Opção 1: Reiniciar Tudo (Recomendado)

```bash
# 1. Parar todos os servidores
pkill -f "next|ts-node|node.*server"

# 2. Aguardar 2 segundos
sleep 2

# 3. Iniciar novamente
npm run dev
```

### Opção 2: Reiniciar Apenas o Frontend

```bash
# 1. Parar apenas o Next.js
pkill -f "next"

# 2. Ir para a pasta web
cd web

# 3. Limpar cache
rm -rf .next

# 4. Iniciar frontend
npm run dev

# 5. Voltar para raiz
cd ..
```

## 🌐 URLs de Acesso

Após iniciar os servidores:

| Serviço | URL | Status |
|---------|-----|--------|
| **Frontend (Interface)** | http://localhost:3000 | ⚠️ Precisa reiniciar |
| **Backend API** | http://localhost:3001/api | ✅ Funcionando |
| **Health Check** | http://localhost:3001/api/health | ✅ Funcionando |

## 📱 Primeiros Passos

1. **Acesse:** http://localhost:3000
2. **Se não abrir:** Execute `npm run dev` na raiz do projeto
3. **Login/Cadastro:**
   - Clique em "Criar conta" se for o primeiro acesso
   - Ou faça login se já tiver conta
4. **Selecionar Empresa:**
   - Após login, você será direcionado para selecionar uma empresa
   - Se for o primeiro acesso, pode precisar criar uma empresa via API
5. **Dashboard:**
   - Após selecionar empresa, você verá o dashboard principal

## 🛑 Para Parar os Servidores

Pressione `Ctrl + C` no terminal onde está rodando.

Ou execute:
```bash
pkill -f "next|ts-node"
```

## 📝 Comandos Úteis

```bash
# Ver processos rodando
ps aux | grep -E "(next|ts-node)"

# Ver portas em uso
lsof -i :3000 -i :3001

# Limpar tudo e reiniciar
pkill -f "next|ts-node" && sleep 2 && npm run dev
```

---

**Dica:** Se o frontend não abrir, verifique se não há erros no terminal onde está rodando `npm run dev`.

