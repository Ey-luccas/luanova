# Configuração da API no VPS

## URL da API de Produção

A URL da API no VPS é: **https://api.luanova.cloud**

## Configuração Automática

O sistema detecta automaticamente o ambiente:

- **Desenvolvimento local** (`localhost`): Usa `http://localhost:3001/api`
- **Produção** (domínios `luanova.cloud`): Usa `https://api.luanova.cloud/api` automaticamente

## Configuração Manual (Opcional)

Se precisar configurar manualmente, crie ou edite o arquivo `.env.local` ou `.env.production` na raiz do módulo `web`:

```env
NEXT_PUBLIC_API_URL=https://api.luanova.cloud/api
```

## Para Mobile/Tablet

O sistema detecta automaticamente quando está rodando em um dispositivo mobile acessando o domínio de produção e usa a URL correta da API.

## Verificação

Após fazer o build e deploy, verifique no console do navegador:
- Deve aparecer: `[API] Base URL configurada: https://api.luanova.cloud/api`

## Troubleshooting

Se ainda houver erro de conexão em mobile:

1. Verifique se o arquivo `.env.production` existe no VPS com a URL correta
2. Verifique se o build foi feito após configurar a variável de ambiente
3. Verifique se o backend está acessível em `https://api.luanova.cloud`
4. Verifique CORS no backend para permitir requisições do domínio de produção

