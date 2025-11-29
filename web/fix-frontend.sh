#!/bin/bash

echo "🔧 Corrigindo problemas do frontend..."

# Parar processos
echo "1. Parando processos..."
pkill -f "next" 2>/dev/null
sleep 2

# Limpar cache
echo "2. Limpando cache..."
rm -rf .next node_modules/.cache

# Verificar módulo @swc/helpers
echo "3. Verificando @swc/helpers..."
if [ ! -f "node_modules/@swc/helpers/package.json" ]; then
    echo "   Instalando @swc/helpers..."
    npm install @swc/helpers@0.5.2 --save-dev --legacy-peer-deps
fi

# Criar link simbólico se necessário
if [ -d "node_modules/@swc/helpers" ] && [ ! -f "node_modules/@swc/helpers/package.json" ]; then
    cd node_modules/@swc/helpers
    if [ ! -f "package.json" ]; then
        echo "   Criando package.json..."
        echo '{"name":"@swc/helpers","version":"0.5.2"}' > package.json
    fi
    cd ../../..
fi

echo "✅ Correções aplicadas!"
echo ""
echo "🚀 Iniciando frontend..."
npm run dev

