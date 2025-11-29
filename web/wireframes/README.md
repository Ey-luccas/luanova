# EstoqueRápido - Painel Web

Sistema completo de gestão de estoque com design profissional e minimalista.

## 📋 Visão Geral

Este é o painel web completo do EstoqueRápido, desenvolvido com HTML5, CSS3 e JavaScript puro. O sistema oferece uma interface moderna, responsiva e intuitiva para gestão completa de estoque.

## 🎨 Características do Design

- **Minimalista e Profissional**: Design limpo focado na funcionalidade
- **Responsivo**: Adaptável a diferentes tamanhos de tela
- **Sistema de Cores Consistente**: Paleta de cores profissional
- **Tipografia Clara**: Fontes do sistema otimizadas para legibilidade
- **Animações Suaves**: Transições e feedbacks visuais elegantes

## 📁 Estrutura de Arquivos

```
├── login.html              # Página de autenticação
├── register.html           # Página de cadastro
├── dashboard.html          # Dashboard principal com KPIs e gráficos
├── products.html           # Gestão de produtos
├── movements.html          # Histórico de movimentações
├── reports.html            # Relatórios e análises
├── categories.html         # Gestão de categorias
├── settings.html           # Configurações do sistema
├── styles.css              # Estilos globais
├── auth.js                 # JavaScript de autenticação
├── dashboard.js            # JavaScript do dashboard
├── products.js             # JavaScript de produtos
├── movements.js            # JavaScript de movimentações
├── reports.js              # JavaScript de relatórios
├── categories.js           # JavaScript de categorias
└── settings.js             # JavaScript de configurações
```

## 🚀 Páginas Implementadas

### 1. Login & Registro
- Formulário de autenticação
- Criação de nova conta
- Validação de campos
- Design centralizado e atraente

### 2. Dashboard
- 4 cards de KPIs principais
- Gráfico de movimentações (7 dias)
- Gráfico de distribuição por categoria
- Tabela de produtos mais vendidos
- Alertas de estoque baixo

### 3. Produtos
- Listagem com busca e filtros
- Cadastro de novos produtos
- Modal para edição
- Importação de dados
- Paginação
- Indicadores de estoque

### 4. Movimentações
- Histórico completo de entradas/saídas
- Filtros por tipo e data
- Registro de novas movimentações
- Visualização detalhada
- Badges coloridos por tipo

### 5. Relatórios
- 3 tipos de relatórios:
  - Relatório de Estoque
  - Relatório de Movimentações
  - Relatório de Vendas
- Filtros personalizáveis
- Exportação (PDF, Excel, CSV)
- Resumo com totalizadores

### 6. Categorias
- Grid visual de categorias
- Cores personalizadas
- Estatísticas por categoria
- Criação e edição

### 7. Configurações
- Sistema de tabs:
  - Perfil do usuário
  - Dados da empresa
  - Gestão de usuários
  - Notificações
  - Planos e cobrança
- Toggle switches
- Zona de perigo

## 🎯 Funcionalidades Principais

### Componentes UI
- **Sidebar Navigation**: Navegação lateral fixa
- **KPI Cards**: Cards de métricas com tendências
- **Data Tables**: Tabelas responsivas com ordenação
- **Modals**: Janelas modais para formulários
- **Forms**: Formulários validados
- **Badges**: Indicadores de status
- **Buttons**: Botões com diferentes estilos
- **Charts**: Gráficos desenhados em Canvas

### Interatividade
- Busca em tempo real
- Filtros dinâmicos
- Paginação
- Modais com overlay
- Toggle switches
- Navegação por tabs
- Validação de formulários

## 🎨 Sistema de Design

### Cores Principais
```css
--primary-600: #2563eb      /* Azul principal */
--success-600: #16a34a      /* Verde para sucesso */
--warning-600: #d97706      /* Laranja para avisos */
--error-600: #dc2626        /* Vermelho para erros */
--gray-900: #111827         /* Texto principal */
```

### Espaçamento
```css
--spacing-sm: 0.5rem
--spacing-md: 1rem
--spacing-lg: 1.5rem
--spacing-xl: 2rem
```

### Tipografia
- Fonte: Sistema nativo (-apple-system, Segoe UI, Roboto)
- Tamanho base: 16px
- Escala modular para hierarquia

## 💻 Como Usar

1. **Visualizar o projeto**:
   - Abra `login.html` em seu navegador
   - Use qualquer e-mail/senha para fazer login (modo demo)

2. **Navegar**:
   - Use a sidebar para alternar entre páginas
   - Explore os modals clicando em "Novo Produto", etc.
   - Teste os filtros e busca

3. **Personalizar**:
   - Edite `styles.css` para ajustar cores e espaçamentos
   - Modifique os arquivos `.js` para adicionar lógica real
   - Conecte com sua API REST

## 🔧 Integração com Backend

Para conectar com o backend (API REST):

1. **Atualize as funções JavaScript**:
```javascript
// Exemplo em products.js
async function saveProduct() {
    const product = { /* dados */ };
    
    const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(product)
    });
    
    const data = await response.json();
    // Processar resposta
}
```

2. **Implemente autenticação JWT**:
```javascript
// Armazenar token após login
localStorage.setItem('token', data.token);

// Usar em requisições
const token = localStorage.getItem('token');
```

## 📱 Responsividade

O sistema é totalmente responsivo com breakpoints em:
- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

## 🎯 Próximos Passos

Para usar em produção:

1. ✅ Conectar com API REST do backend
2. ✅ Implementar autenticação real
3. ✅ Adicionar validações no servidor
4. ✅ Implementar upload real de arquivos
5. ✅ Adicionar gráficos com biblioteca (Chart.js ou Recharts)
6. ✅ Implementar cache e otimizações
7. ✅ Adicionar testes automatizados

## 📄 Licença

Este projeto foi desenvolvido para o sistema EstoqueRápido.

## 👨‍💻 Desenvolvimento

- HTML5 semântico
- CSS3 com variáveis customizadas
- JavaScript ES6+ puro (sem frameworks)
- Design system consistente
- Código limpo e bem organizado

---

**EstoqueRápido** - Gestão inteligente de estoque
