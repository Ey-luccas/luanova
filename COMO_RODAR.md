# 🚀 Como Rodar o Projeto EstoqueRápido

## 📋 Pré-requisitos

- Node.js instalado (versão 18 ou superior)
- npm ou yarn instalado

## 🎯 Método Simples - Um Comando

Na raiz do projeto, execute:

```bash
npm run dev
```

Isso iniciará automaticamente:
- ✅ **Backend** na porta **3001**
- ✅ **Frontend** na porta **3000**

## 📍 Acessar o Projeto

Depois que os servidores iniciarem, acesse:

- **Frontend (Interface Web):** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

## 🔧 Se Der Problema

### 1. Limpar processos antigos:

```bash
# Parar todos os processos
pkill -f "next|ts-node|node.*server"
lsof -ti:3000,3001 | xargs -r kill -9
```

### 2. Limpar cache (se houver erros):

```bash
cd web
rm -rf .next node_modules/.cache
cd ..
```

### 3. Reinstalar dependências (se necessário):

```bash
# Backend
cd backend
npm install
cd ..

# Frontend
cd web
npm install
cd ..
```

### 4. Iniciar novamente:

```bash
npm run dev
```

## 📱 Primeiro Acesso

1. Acesse: http://localhost:3000
2. Você será redirecionado para a página de **Login**
3. Se não tiver conta, clique em **"Criar conta"** para se registrar
4. Após login, selecione uma empresa (ou crie uma se for o primeiro acesso)
5. Você será redirecionado para o **Dashboard**

## 🛑 Parar os Servidores

Pressione `Ctrl + C` no terminal onde os servidores estão rodando.

Ou execute:

```bash
pkill -f "next|ts-node|node.*server"
```

## ⚙️ Rodar Separadamente

Se preferir rodar os servidores separadamente:

### Backend apenas:
```bash
cd backend
npm run dev
```

### Frontend apenas:
```bash
cd web
npm run dev
```

## 🐛 Troubleshooting

### Erro de porta ocupada:
```bash
# Verificar qual processo está usando a porta
lsof -i :3000
lsof -i :3001

# Matar processo específico (substitua PID pelo número retornado)
kill -9 PID
```

### Erro de módulos não encontrados:
```bash
cd web
rm -rf node_modules package-lock.json
npm install
```

### Erro de banco de dados:
Certifique-se de que o arquivo `.env` do backend está configurado corretamente.

---

**Pronto!** Agora é só executar `npm run dev` na raiz do projeto e acessar http://localhost:3000 🎉

