#!/bin/bash

# Script de instalação automática para dispositivo novo
# Uso: ./install.sh

set -e

echo "🚀 Instalando EstoqueLua em dispositivo novo..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar Node.js
echo "📦 Verificando pré-requisitos..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado!${NC}"
    echo "Instale Node.js 20+ em: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${YELLOW}⚠️  Node.js versão $NODE_VERSION detectada. Recomendado: 20+${NC}"
fi

echo -e "${GREEN}✅ Node.js $(node --version) encontrado${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não encontrado!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm --version) encontrado${NC}"
echo ""

# Instalar dependências
echo "📥 Instalando dependências..."
echo "   (Isso pode levar alguns minutos...)"
npm run install:all

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dependências instaladas${NC}"
echo ""

# Configurar backend
echo "⚙️  Configurando backend..."
cd backend

# Verificar se .env existe
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Arquivo .env criado a partir de .env.example${NC}"
        echo -e "${YELLOW}   Por favor, edite o arquivo .env com suas configurações${NC}"
    else
        echo -e "${YELLOW}⚠️  Arquivo .env não encontrado. Criando um básico...${NC}"
        cat > .env << EOF
PORT=3001
NODE_ENV=development
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
UPLOAD_DIR=./uploads
EOF
        echo -e "${GREEN}✅ Arquivo .env criado com secrets aleatórios${NC}"
    fi
else
    echo -e "${GREEN}✅ Arquivo .env já existe${NC}"
fi

# Configurar banco de dados
echo "🗄️  Configurando banco de dados..."
npm run prisma:generate

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao gerar Prisma Client${NC}"
    exit 1
fi

npm run prisma:migrate

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erro ao executar migrações${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Banco de dados configurado${NC}"
cd ..

echo ""
echo -e "${GREEN}✨ Instalação concluída com sucesso!${NC}"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Iniciar os servidores:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "2. Acessar o sistema:"
echo "   ${YELLOW}Frontend:${NC} http://localhost:3000"
echo "   ${YELLOW}Backend:${NC}  http://localhost:3001/api"
echo ""
echo "3. (Opcional) Popular com dados de teste:"
echo "   ${YELLOW}cd backend${NC}"
echo "   ${YELLOW}npx ts-node src/scripts/seedExtensions.ts${NC}"
echo "   ${YELLOW}npx ts-node src/scripts/seedUserAndCompanies.ts${NC}"
echo ""
echo "🎉 Pronto para começar!"

