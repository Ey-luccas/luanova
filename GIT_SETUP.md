# 🔗 Como Conectar o Repositório a um Serviço Remoto

O repositório Git local foi criado com sucesso! Agora você pode conectá-lo a um repositório remoto no GitHub, GitLab ou outro serviço.

## 📋 Status Atual

✅ Repositório Git inicializado  
✅ Branch `main` criada  
✅ Commit inicial realizado (257 arquivos)  
✅ README atualizado

## 🚀 Conectar ao GitHub

### 1. Criar Repositório no GitHub

1. Acesse https://github.com
2. Clique em **"New repository"** (ou **"+"** → **"New repository"**)
3. Preencha:
   - **Repository name:** `estoquelua` (ou o nome que preferir)
   - **Description:** Sistema de gestão de estoque completo
   - **Visibility:** Escolha Público ou Privado
   - **NÃO** marque "Initialize with README" (já temos um)
4. Clique em **"Create repository"**

### 2. Conectar o Repositório Local

Após criar o repositório no GitHub, você receberá uma URL. Use uma das opções abaixo:

#### Opção A: HTTPS (Recomendado para iniciantes)
```bash
cd /home/ey-luccas/Área\ de\ trabalho/LUALABS_PROJECTS/estoquelua
git remote add origin https://github.com/SEU_USUARIO/estoquelua.git
git branch -M main
git push -u origin main
```

#### Opção B: SSH (Se você já configurou chaves SSH)
```bash
cd /home/ey-luccas/Área\ de\ trabalho/LUALABS_PROJECTS/estoquelua
git remote add origin git@github.com:SEU_USUARIO/estoquelua.git
git branch -M main
git push -u origin main
```

**Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub!**

## 🔐 Autenticação

### Se usar HTTPS:
- O GitHub pode pedir autenticação
- Use um **Personal Access Token** (não sua senha)
- Para criar um token: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)

### Se usar SSH:
- Certifique-se de ter configurado suas chaves SSH no GitHub
- Guia: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

## 📤 Enviar Código (Push)

Após conectar, envie seu código:

```bash
git push -u origin main
```

## 📥 Comandos Úteis

### Verificar status do repositório remoto:
```bash
git remote -v
```

### Atualizar do remoto:
```bash
git pull origin main
```

### Enviar alterações:
```bash
git add .
git commit -m "Descrição das alterações"
git push origin main
```

### Ver histórico de commits:
```bash
git log --oneline
```

## 🔄 Workflow Básico

1. **Fazer alterações** nos arquivos
2. **Adicionar ao staging:**
   ```bash
   git add .
   # ou para arquivos específicos:
   git add caminho/do/arquivo
   ```
3. **Fazer commit:**
   ```bash
   git commit -m "Descrição clara do que foi alterado"
   ```
4. **Enviar para o remoto:**
   ```bash
   git push origin main
   ```

## 🏷️ Criar Tags (Versões)

Para marcar versões importantes:

```bash
# Criar tag
git tag -a v1.0.0 -m "Versão 1.0.0 - Release inicial"

# Enviar tag para o remoto
git push origin v1.0.0

# Enviar todas as tags
git push origin --tags
```

## 🌿 Criar Branches

Para trabalhar em features separadas:

```bash
# Criar nova branch
git checkout -b feature/nome-da-feature

# Fazer commits normalmente
git add .
git commit -m "Implementa nova feature"

# Enviar branch para o remoto
git push -u origin feature/nome-da-feature

# Voltar para main
git checkout main
```

## 📊 Verificar Status

```bash
# Ver arquivos modificados
git status

# Ver diferenças
git diff

# Ver histórico
git log --oneline --graph --all
```

## ⚠️ Importante

- **NUNCA** faça commit de arquivos `.env` (já estão no .gitignore)
- **NUNCA** faça commit de `node_modules/` (já está no .gitignore)
- **SEMPRE** faça commits descritivos
- **SEMPRE** teste antes de fazer push

## 🆘 Problemas Comuns

### Erro: "remote origin already exists"
```bash
# Remover remoto existente
git remote remove origin

# Adicionar novamente
git remote add origin URL_DO_REPOSITORIO
```

### Erro: "failed to push some refs"
```bash
# Atualizar primeiro
git pull origin main --rebase

# Depois fazer push
git push origin main
```

### Desfazer último commit (antes do push)
```bash
git reset --soft HEAD~1
```

---

**Pronto!** Seu repositório está configurado e pronto para ser conectado ao GitHub ou outro serviço Git remoto! 🎉

