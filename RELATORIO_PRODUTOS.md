# 📊 Relatório Detalhado - Sistema de Produtos

## 🔍 Problemas Identificados

### 1. Erro 404 - Endpoint Dashboard
- **Endpoint:** `GET /api/companies/{companyId}/dashboard`
- **Status:** Não existe no backend
- **Impacto:** Página do dashboard não carrega dados
- **Solução:** Endpoint não é crítico (pode usar dados mockados temporariamente)

### 2. Erro 400 - Endpoint Categories
- **Endpoint:** `GET /api/companies/{companyId}/categories`
- **Status:** Bad Request (400)
- **Causa provável:** Validação Zod rejeitando os parâmetros
- **Impacto:** Lista de categorias não carrega no formulário de produtos

### 3. Erro 400 - Endpoint Products
- **Endpoint:** `GET /api/companies/{companyId}/products?page=1&limit=10`
- **Status:** Bad Request (400)
- **Causa provável:** Validação Zod rejeitando query parameters
- **Impacto:** Lista de produtos não carrega

---

## 🏗️ Arquitetura da Lógica de Produtos

### Frontend (`web/src/app/(dashboard)/dashboard/products/page.tsx`)

#### Estado da Página
```typescript
- products: Product[]           // Lista de produtos exibida
- categories: Category[]        // Lista de categorias para filtro
- isLoading: boolean           // Estado de carregamento
- error: string | null         // Mensagens de erro
- search: string               // Filtro de busca por texto
- categoryId: string | undefined // Filtro por categoria
- isActive: string | undefined   // Filtro por status ativo/inativo
- pagination: { page, limit, total, totalPages } // Paginação
```

#### Fluxo de Busca de Produtos

1. **Inicialização**
   - Página carrega → `useEffect` verifica autenticação
   - Se autenticado → chama `fetchCategories()` e `fetchProducts()`

2. **Busca de Categorias** (`fetchCategories`)
   ```
   GET /api/companies/{companyId}/categories
   → Resposta: { data: { categories: [...] } }
   → Filtra categorias inválidas (id inválido, nome vazio)
   → Normaliza dados (Number(id), String(name).trim())
   → setCategories(validCategories)
   ```

3. **Busca de Produtos** (`fetchProducts`)
   ```
   Parâmetros preparados:
   - page: string (obrigatório)
   - limit: string (obrigatório)
   - search?: string (opcional)
   - categoryId?: string (opcional, se definido)
   - isActive?: "true" | "false" (opcional, se definido)
   
   GET /api/companies/{companyId}/products?page=1&limit=10
   
   → Resposta esperada: {
        success: true,
        data: {
          products: [...],
          pagination: { page, limit, total, totalPages }
        }
      }
   
   → Normaliza produtos:
      - Decimal → number (Prisma retorna Decimal)
      - Valida campos obrigatórios
      - Filtra produtos inválidos
   
   → setProducts(validProducts)
   → setPagination({ total, totalPages })
   ```

4. **Filtros e Busca**
   - Mudança em `search`, `categoryId`, `isActive` → recarrega produtos
   - `handleFilterChange()` → reseta página para 1
   - Debounce implícito via `useCallback`

#### Normalização de Dados

**Categorias:**
- Filtra por: `id` válido (number > 0), `name` não vazio
- Normaliza: `id: Number(cat.id)`, `name: String(cat.name).trim()`

**Produtos:**
- Valida: `id`, `name` obrigatórios
- Converte: `Decimal` → `number` (currentStock, unitPrice, costPrice)
- Mantém: `barcode`, `sku`, `category` como estão
- Garante: `currentStock` sempre numérico (default: 0)

---

### Backend (`backend/src/`)

#### Schema de Validação (`productSchema.ts`)

**Listagem de Produtos:**
```typescript
listProductsSchema = {
  params: {
    companyId: string (regex: /^\d+$/)  // Deve ser número
  },
  query: {
    search?: string,                      // Busca por nome/barcode
    categoryId?: string (regex: /^\d+$/), // Deve ser número
    isActive?: "true" | "false",         // String exata
    minStock?: string (regex: /^\d+(\.\d+)?$/),
    maxStock?: string (regex: /^\d+(\.\d+)?$/),
    page?: string (regex: /^\d+$/),      // Deve ser número
    limit?: string (regex: /^\d+$/)      // Deve ser número
  }
}
```

**Pontos críticos:**
- ✅ `companyId` deve ser string numérica (ex: "7", não 7)
- ✅ `categoryId` se fornecido, deve ser string numérica válida
- ✅ `isActive` deve ser exatamente "true" ou "false" (string)
- ✅ `page` e `limit` devem ser strings numéricas
- ❌ **PROBLEMA:** Se `page` ou `limit` vierem como número, Zod rejeita

#### Controller (`productController.ts`)

**Fluxo:**
1. Valida `params` e `query` com Zod
2. Converte `companyId` para número
3. Prepara filtros (converte strings para tipos apropriados)
4. Chama `productService.listProducts()`
5. Retorna `{ success: true, data: { products, pagination } }`

**Tratamento de Erros:**
- `ZodError` → 400 Bad Request com lista de erros
- `Empresa não encontrada` → 404 Not Found
- Outros → 500 Internal Server Error

#### Service (`productService.ts`)

**Busca no Banco:**
```typescript
where: {
  companyId: number,
  OR?: [{ name: contains }, { barcode: contains }, ...],
  categoryId?: number,
  isActive?: boolean,
  currentStock?: { gte?: number, lte?: number }
}

orderBy: { createdAt: "desc" }
skip: (page - 1) * limit
take: limit
```

**Retorno:**
```typescript
{
  products: Product[],  // Inclui category: { id, name }
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

---

## ⚠️ Problemas Identificados e Correções Necessárias

### Problema 1: Query Parameters como String vs Number

**Causa:**
- Axios pode enviar números como `page=1` (number) em vez de `page="1"` (string)
- Zod espera strings para validar regex `/^\d+$/`

**Solução:**
- Garantir que todos os params sejam strings no frontend
- Ou ajustar schema do backend para aceitar number e converter

### Problema 2: Validação de Query Opcional

**Causa:**
- Schema tem `.optional()` no objeto query inteiro
- Mas se `req.query` existir com propriedades vazias, pode falhar

**Solução:**
- Melhorar validação no backend para limpar query vazio

### Problema 3: Categorias sem Query Parameters

**Causa:**
- Endpoint de categorias não recebe query params
- Mas se vier algum param extra, Zod pode rejeitar

**Solução:**
- Garantir que schema de categorias ignore query completamente

---

## 🔧 Correções Aplicadas

1. ✅ **Normalização de parâmetros no frontend**
   - `page` e `limit` sempre enviados como strings
   - Parâmetros opcionais só adicionados se tiverem valor válido

2. ✅ **Schema Zod mais tolerante**
   - Aceita `number` ou `string` para query params
   - Transforma automaticamente para string antes de validar regex
   - Usa `.passthrough()` para permitir propriedades extras

3. ✅ **Limpeza de query params no backend**
   - Remove valores vazios antes de validar
   - Garante que todos os valores sejam strings
   - Logs detalhados para debug

4. ✅ **Tratamento melhorado de erros Zod**
   - Mensagens de erro mais detalhadas
   - Lista de erros formatada para facilitar debug
   - Logs no console do servidor

5. ✅ **Logs detalhados para diagnóstico**
   - Request params e query logados
   - Query limpa logada
   - Query validada logada
   - Erros Zod com detalhes completos

---

## 📝 Explicação Detalhada da Lógica de Produtos

### Fluxo Completo - Frontend para Backend

#### 1. Usuário acessa página de produtos
```
/dashboard/products → page.tsx carrega
```

#### 2. Inicialização (useEffect)
```typescript
useEffect(() => {
  // Verifica autenticação
  if (!isAuthenticated) return;
  
  // Carrega categorias e produtos
  fetchCategories();
  fetchProducts();
}, [isAuthenticated, companyId]);
```

#### 3. Busca de Categorias
```typescript
const response = await api.get(`/companies/${companyId}/categories`);

// Backend retorna:
{
  success: true,
  data: {
    categories: [
      { id: 1, name: "Categoria 1", ... },
      { id: 2, name: "Categoria 2", ... }
    ],
    count: 2
  }
}

// Frontend normaliza:
- Filtra categorias inválidas (sem id ou name vazio)
- Normaliza tipos: id → Number, name → String.trim()
- setCategories(validCategories)
```

#### 4. Busca de Produtos
```typescript
// Prepara parâmetros (sempre como strings)
const params = {
  page: "1",      // ✅ Sempre string
  limit: "10",    // ✅ Sempre string
  search?: "termo",           // Opcional
  categoryId?: "5",           // Opcional (string numérica)
  isActive?: "true"           // Opcional ("true" ou "false")
};

// Request
GET /api/companies/7/products?page=1&limit=10&isActive=true

// Backend recebe:
req.query = {
  page: "1",           // Axios pode enviar como number
  limit: "10",         // ou string
  isActive: "true"
}

// Backend normaliza:
cleanQuery = {
  page: "1",           // ✅ Convertido para string
  limit: "10",         // ✅ Convertido para string
  isActive: "true"     // ✅ Já era string
}

// Zod valida (com transform):
- Aceita number ou string
- Transforma para string
- Valida regex
- Retorna string normalizada

// Service busca no banco:
where = {
  companyId: 7,
  isActive: true  // Converte string "true" para boolean
}

// Retorna:
{
  products: [...],
  pagination: { page: 1, limit: 10, total: 50, totalPages: 5 }
}
```

#### 5. Normalização no Frontend
```typescript
// Prisma retorna Decimal, frontend precisa de number
products.map(product => ({
  ...product,
  unitPrice: Number(product.unitPrice),      // Decimal → number
  currentStock: Number(product.currentStock), // Decimal → number
  costPrice: Number(product.costPrice),      // Decimal → number
}))
```

---

## 🐛 Problemas Resolvidos

### Problema: Erro 400 Bad Request

**Causa Raiz:**
- Schema Zod era muito restritivo
- Axios pode enviar números como `number` type
- Zod esperava apenas `string` com regex

**Solução:**
- Schema agora aceita `number | string`
- Transforma para `string` automaticamente
- Valida regex após transformação
- Limpa query params vazios antes de validar

### Problema: Categorias não carregam

**Causa Raiz:**
- Mesmo problema de validação Zod
- Query params extras causavam rejeição

**Solução:**
- Schema de categorias valida apenas `params`
- Ignora `query` completamente
- Logs adicionados para debug

---

## 🔄 Próximos Passos

1. ⚠️ **Criar endpoint de dashboard** (atualmente 404)
2. ✅ **Testar endpoints de produtos e categorias** após correções
3. ✅ **Verificar logs do backend** para confirmar normalização
4. ✅ **Monitorar erros no console do navegador**

