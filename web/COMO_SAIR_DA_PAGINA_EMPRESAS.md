# 🔓 Como Sair da Página de Empresas

## 🚨 Se Você Está Preso na Página de Seleção de Empresas

### Opção 1: Limpar localStorage (Mais Rápido)

1. **Abra o Console do Navegador:**
   - Pressione `F12` ou `Ctrl+Shift+I`
   - Vá para a aba **Console**

2. **Limpe o localStorage:**
   ```javascript
   localStorage.clear()
   ```

3. **Recarregue a página:**
   - Pressione `F5` ou `Ctrl+R`

4. **Você será redirecionado para a página de login**

---

### Opção 2: Acessar Diretamente o Login

Digite na barra de endereço:
```
http://localhost:3000/login
```

---

### Opção 3: Limpar Apenas Tokens

Se quiser manter outras informações, limpe apenas os tokens:

```javascript
localStorage.removeItem("accessToken")
localStorage.removeItem("refreshToken")
localStorage.removeItem("companyId")
```

Depois recarregue a página.

---

### Opção 4: Usar o Botão "Continuar para o Dashboard"

Se a página de seleção de empresas estiver carregando (sem erro), você pode:

1. Clicar no botão **"Continuar para o Dashboard"**
2. Isso te levará para o dashboard mesmo sem empresa selecionada
3. Depois você pode criar uma empresa nas configurações

---

## 🔍 Por Que Isso Acontece?

- Você criou uma conta mas ainda não tem empresas cadastradas
- O sistema tenta buscar empresas, mas pode dar erro se:
  - O token expirou
  - Não há empresas no banco de dados
  - Há um problema de conexão com o backend

---

## ✅ Após Limpar o localStorage

1. Você será redirecionado para `/login`
2. Faça login novamente
3. Se não tiver empresas, clique em **"Continuar para o Dashboard"**
4. Depois você pode criar uma empresa nas **Configurações**

---

**Dica:** A opção mais rápida é usar `localStorage.clear()` no console!

