#!/bin/bash

# Script para criar repositório no GitHub e fazer push do código
# Uso: ./create-github-repo.sh

set -e

echo "🚀 Criando repositório no GitHub..."
echo ""

# Verificar se está autenticado
if ! gh auth status &>/dev/null; then
    echo "⚠️  Você precisa fazer login no GitHub primeiro!"
    echo ""
    echo "Execute o comando abaixo e siga as instruções:"
    echo "   gh auth login"
    echo ""
    echo "Ou acesse: https://cli.github.com/manual/gh_auth_login"
    exit 1
fi

# Obter nome do usuário
GITHUB_USER=$(gh api user -q .login)
echo "✅ Autenticado como: $GITHUB_USER"
echo ""

# Nome do repositório
REPO_NAME="estoquelua"

# Verificar se o repositório já existe
if gh repo view "$GITHUB_USER/$REPO_NAME" &>/dev/null; then
    echo "⚠️  O repositório $GITHUB_USER/$REPO_NAME já existe!"
    read -p "Deseja usar este repositório existente? (s/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Operação cancelada."
        exit 1
    fi
else
    # Criar repositório
    echo "📦 Criando repositório: $REPO_NAME"
    gh repo create "$REPO_NAME" \
        --public \
        --description "Sistema de gestão de estoque completo - Backend, Frontend e Mobile" \
        --source=. \
        --remote=origin \
        --push
    echo ""
    echo "✅ Repositório criado e código enviado com sucesso!"
fi

# Verificar se o remote já existe
if git remote get-url origin &>/dev/null; then
    echo "✅ Remote 'origin' já configurado"
else
    echo "🔗 Configurando remote 'origin'..."
    git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
fi

# Fazer push
echo ""
echo "📤 Enviando código para o GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "🎉 Sucesso! Seu código está no GitHub:"
echo "   https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""

