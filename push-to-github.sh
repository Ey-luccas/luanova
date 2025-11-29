#!/bin/bash

# Script para criar repositório luanova no GitHub e fazer push
set -e

echo "🚀 Conectando ao GitHub..."
echo ""

# Verificar autenticação
if ! gh auth status &>/dev/null; then
    echo "⚠️  Você precisa autenticar no GitHub primeiro!"
    echo ""
    echo "Execute:"
    echo "   gh auth login"
    echo ""
    echo "E depois execute este script novamente."
    exit 1
fi

echo "✅ Autenticado no GitHub"
echo ""

# Verificar se o repositório já existe
if gh repo view Ey-luccas/luanova &>/dev/null 2>&1; then
    echo "✅ Repositório Ey-luccas/luanova já existe!"
    echo "📤 Fazendo push do código..."
    git branch -M main
    git push -u origin main
    echo ""
    echo "✅ Código enviado com sucesso!"
else
    echo "📦 Criando repositório: Ey-luccas/luanova"
    # Criar repositório via GitHub CLI
    gh repo create Ey-luccas/luanova \
        --public \
        --description "Sistema de gestão de estoque completo - EstoqueLua"
    
    # Configurar remote SSH e fazer push
    git remote set-url origin git@github.com:Ey-luccas/luanova.git
    git branch -M main
    git push -u origin main
    echo ""
    echo "✅ Repositório criado e código enviado!"
fi

echo ""
echo "🎉 Sucesso! Acesse:"
echo "   https://github.com/Ey-luccas/luanova"
echo ""

