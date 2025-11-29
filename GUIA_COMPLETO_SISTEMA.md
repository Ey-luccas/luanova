# 📚 Guia Completo do Sistema - EstoqueRápido

## 🎯 Índice

1. [Visão Geral](#visão-geral)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Dashboard](#dashboard)
4. [Gestão de Produtos](#gestão-de-produtos)
5. [Gestão de Categorias](#gestão-de-categorias)
6. [Movimentações de Estoque](#movimentações-de-estoque)
7. [Rastreamento de Unidades](#rastreamento-de-unidades)
8. [Configurações](#configurações)
9. [Recursos Adicionais](#recursos-adicionais)
10. [Dicas e Boas Práticas](#dicas-e-boas-práticas)

---

## 🎯 Visão Geral

O **EstoqueRápido** é um sistema completo de gestão de estoque desenvolvido para empresas que precisam controlar seus produtos, movimentações e rastreamento de unidades de forma eficiente e intuitiva.

### Principais Características

- ✅ **Gestão Completa de Produtos**: Cadastro, edição, visualização e controle de estoque
- ✅ **Sistema de Status Inteligente**: Produtos podem estar Ativos, em Rascunho ou Inativos
- ✅ **Rastreamento Individual**: Cada unidade de produto possui código de barras único
- ✅ **Movimentações Automáticas**: Registro automático de entradas e saídas
- ✅ **Dashboard Interativo**: KPIs, gráficos e análises em tempo real
- ✅ **Modo Escuro**: Interface adaptável com tema claro e escuro
- ✅ **Filtros Avançados**: Busca e filtragem por múltiplos critérios
- ✅ **Exportação de Dados**: Geração de PDFs de códigos de barras e relatórios

---

## 🔐 Acesso ao Sistema

### Login

1. Acesse a página de login
2. Informe seu **email** e **senha**
3. Clique em **"Entrar"**

### Seleção de Empresa

Após o login, se você tiver acesso a múltiplas empresas:

1. Selecione a empresa que deseja gerenciar
2. O sistema salvará sua escolha automaticamente

### Trocar de Empresa

- No menu lateral, clique em **"Trocar Empresa"**
- Selecione a empresa desejada

---

## 📊 Dashboard

O Dashboard é a página inicial do sistema e oferece uma visão geral completa do seu estoque.

### Cards de KPIs (Indicadores)

#### 1. **Total de Produtos**

- Mostra a quantidade total de produtos cadastrados
- **Clique no card** para ver um resumo dos primeiros 10 produtos
- Botão **"Ver Mais"** redireciona para a página de produtos

#### 2. **Estoque Baixo**

- Exibe produtos abaixo do estoque mínimo
- **Clique no card** para ver detalhes dos produtos com estoque baixo
- Botão **"Ver Mais"** redireciona para produtos com filtro de estoque baixo aplicado

#### 3. **Valor em Estoque** (Destaque Verde)

- Mostra o valor total do estoque em reais
- Calculado automaticamente baseado nos preços dos produtos

#### 4. **Movimentações Recentes**

- Exibe o número de movimentações dos últimos 7 dias
- **Clique no card** para ir diretamente à página de movimentações

### Gráfico de Movimentações - Últimos 7 dias

#### Filtros Disponíveis

1. **Dia**: Mostra movimentações agrupadas por hora (00:00 a 23:00)
2. **Semana**: Mostra movimentações dos últimos 7 dias agrupadas por dia da semana
3. **Mês**: Mostra movimentações agrupadas por dia do mês (gráfico de colunas)

#### Funcionalidades

- **Visualização Interativa**: Passe o mouse sobre os pontos para ver detalhes
- **Exportar CSV**: Botão para baixar a tabela de movimentações filtradas
- **Legenda**: Entradas (azul) e Saídas (vermelho)

### Tabela de Movimentações Recentes

Exibe as últimas movimentações com:

- **Data e Hora**: Quando ocorreu a movimentação
- **Produto**: Nome do produto movimentado
- **Tipo**: Entrada (verde) ou Saída (vermelho)
- **Quantidade**: Número de unidades
- **Motivo**: Razão da movimentação
- **Responsável**: Usuário que realizou a movimentação

---

## 📦 Gestão de Produtos

### Listagem de Produtos

Acesse **"Produtos"** no menu lateral para ver todos os produtos cadastrados.

#### Filtros Disponíveis

1. **Busca**: Digite o nome ou código de barras do produto
2. **Categoria**: Filtre por categoria específica
3. **Status**:
   - **Ativo**: Produto com estoque disponível
   - **Rascunho**: Produto sem estoque (em criação ou ideia)
   - **Inativo**: Produto desativado manualmente
   - **Todos**: Mostra todos os produtos
4. **Estoque Baixo**: Filtro especial para produtos abaixo do mínimo

#### Colunas da Tabela

- **Nome**: Nome do produto e SKU (se houver)
- **Preço**: Preço unitário do produto
- **Estoque Atual**: Quantidade disponível (destacado em laranja se baixo)
- **Categoria**: Categoria do produto
- **Status**: Badge colorido indicando o status
- **Ações**: Menu com opções (três pontos)

### Cadastro de Produto

1. Clique em **"Novo Produto"** no topo da página
2. Preencha os campos:
   - **Nome** (obrigatório)
   - **Descrição** (opcional)
   - **Código de Barras** (opcional - gerado automaticamente se não informado)
   - **SKU** (opcional)
   - **Categoria** (opcional)
   - **Preço Unitário** (opcional)
   - **Preço de Custo** (opcional)
   - **Estoque Mínimo** (opcional)
   - **Estoque Máximo** (opcional)
   - **Salvar como rascunho**: Marque se o produto ainda não tem estoque
3. Clique em **"Salvar"**

### Edição de Produto

1. Na lista de produtos, clique nos **três pontos** (⋮) do produto
2. Selecione **"Editar"**
3. Modifique os campos desejados
4. Clique em **"Salvar"**

### Ações Disponíveis no Menu (Três Pontos)

#### 1. **Ver Detalhamento**

- Abre um modal com informações completas do produto:
  - Nome, descrição, SKU
  - Preço unitário e preço de custo
  - Estoque atual, mínimo e máximo
  - Categoria
  - Status (Ativo/Rascunho/Inativo)
  - **Média de Venda Mensal**: Calculada automaticamente baseada nos últimos 6 meses

#### 2. **Rastreamento**

- Abre o modal de rastreamento de estoque
- Já vem com o produto selecionado
- Permite visualizar todas as unidades do produto

#### 3. **Editar**

- Redireciona para a página de edição do produto

#### 4. **Adicionar Unidades**

- Abre um dialog para informar a quantidade de unidades a adicionar
- O sistema gera automaticamente códigos de barras únicos para cada unidade
- Após adicionar, oferece download do PDF com os códigos de barras

#### 5. **Remover Unidades**

- Permite remover unidades caso tenha adicionado incorretamente
- Valida se há estoque suficiente
- Cria uma movimentação de saída automaticamente
- Mostra preview do estoque após a remoção

#### 6. **Gerar PDF de Códigos de Barras**

- Gera um PDF com todos os códigos de barras do produto
- Útil para impressão e etiquetagem

#### 7. **Ativar/Desativar Produto**

- **Ativar**: Torna o produto ativo novamente
- **Desativar**: Marca o produto como inativo (não aparece em filtros de produtos ativos)

#### 8. **Excluir Produto**

- Remove o produto permanentemente do sistema
- **Atenção**: Esta ação não pode ser desfeita!

### Status de Produtos

O sistema possui três status distintos:

#### 🟢 **Ativo**

- Produto com `isActive = true` E `currentStock > 0`
- Produto disponível para venda/uso
- Aparece em filtros de produtos ativos

#### 🟡 **Rascunho**

- Produto com `isActive = true` E `currentStock = 0`
- Produto em criação ou ideia
- Não tem estoque disponível

#### 🔴 **Inativo**

- Produto com `isActive = false`
- Produto desativado manualmente
- Não aparece em filtros de produtos ativos

---

## 📂 Gestão de Categorias

### Listagem de Categorias

Acesse **"Categorias"** no menu lateral.

- Visualização em **grid de cards**
- Cada categoria mostra:
  - Nome da categoria
  - Quantidade de produtos na categoria
  - Badge colorido para identificação visual

### Cadastro de Categoria

1. Clique em **"Nova Categoria"**
2. Informe o **nome** da categoria
3. (Opcional) Adicione uma **descrição**
4. Clique em **"Salvar"**

### Edição e Exclusão

- Clique no card da categoria para editar
- Use os botões de ação para editar ou excluir

---

## 📈 Movimentações de Estoque

### Listagem de Movimentações

Acesse **"Movimentações"** no menu lateral.

#### Filtros Disponíveis

1. **Tipo**: Entrada, Saída ou Todos
2. **Data**: Filtro por período
3. **Produto**: Buscar por produto específico

#### Colunas da Tabela

- **Data/Hora**: Quando ocorreu
- **Produto**: Nome do produto
- **Tipo**: Badge verde (Entrada) ou vermelho (Saída)
- **Quantidade**: Número de unidades
- **Motivo**: Razão da movimentação
- **Responsável**: Usuário que realizou

### Nova Movimentação

1. Clique em **"Nova Movimentação"**
2. Preencha os campos:
   - **Tipo**: Entrada ou Saída
   - **Produto**: Selecione o produto
   - **Quantidade**: Número de unidades
   - **Motivo**: Razão da movimentação (opcional)
3. Clique em **"Salvar"**

**Nota**: Movimentações do tipo "Saída" só são permitidas se houver estoque suficiente.

---

## 🔍 Rastreamento de Unidades

O sistema permite rastrear cada unidade individual de um produto.

### Acessar Rastreamento

1. Na lista de produtos, clique nos **três pontos** (⋮)
2. Selecione **"Rastreamento"**
3. O modal abre automaticamente com o produto selecionado

### Funcionalidades do Rastreamento

#### Busca de Produto

- Campo de busca para selecionar outro produto
- Filtra produtos por nome, código de barras ou SKU

#### Filtro por Data

- Busque unidades por data de criação
- Visualize histórico de adições

#### Timeline de Unidades

O sistema organiza as unidades em uma timeline mostrando:

1. **Data de Registro Inicial**

   - Quando o produto foi criado
   - Quantidade inicial de unidades

2. **Adições por Data**

   - Cada data mostra:
     - **Unidades Disponíveis**: Em estoque
     - **Unidades Vendidas**: Já vendidas
     - **Total de Unidades**: Soma de todas

3. **Detalhes das Unidades**
   - Código de barras único
   - Status (Disponível/Vendido)
   - Data de criação
   - Se vendido: data de venda, vendedor, atendente, comprador, forma de pagamento

### Informações de Unidades Vendidas

Para unidades vendidas, o sistema exibe:

- ✅ Data e hora da venda
- ✅ Nome do vendedor
- ✅ Nome do atendente
- ✅ Descrição do comprador
- ✅ Forma de pagamento

---

## ⚙️ Configurações

### Configurações da Empresa

Acesse **"Configurações"** no menu lateral.

#### Dados da Empresa

- **Nome**: Nome da empresa
- **CNPJ**: CNPJ da empresa
- **Email**: Email de contato
- **Telefone**: Telefone de contato
- **Endereço**: Endereço completo

#### Edição

1. Clique em **"Editar"**
2. Modifique os campos desejados
3. Clique em **"Salvar"**

---

## 🎨 Recursos Adicionais

### Modo Escuro

- **Toggle no Header**: Clique no ícone de sol/lua no canto superior direito
- O sistema salva sua preferência automaticamente
- Interface adapta cores para melhor visualização no modo escuro

### Exportação de Dados

#### PDF de Códigos de Barras

1. No menu de ações do produto, selecione **"Gerar PDF de Códigos de Barras"**
2. O PDF será gerado automaticamente com todos os códigos do produto

#### PDF de Unidades Novas

1. Ao adicionar unidades, o sistema oferece download do PDF
2. Confirme o download no dialog de confirmação
3. O PDF contém apenas os códigos das unidades recém-adicionadas

#### CSV de Movimentações

1. No Dashboard, no gráfico de movimentações
2. Selecione o período (dia/semana/mês)
3. Clique no botão de **download** (ícone de download)
4. O arquivo CSV será baixado com os dados filtrados

### Paginação

- Todas as listagens suportam paginação
- Use os botões **"Anterior"** e **"Próxima"** para navegar
- O número de itens por página pode ser ajustado

### Busca em Tempo Real

- A busca em produtos é feita automaticamente após 500ms de digitação
- Não é necessário pressionar Enter ou clicar em botões

---

## 💡 Dicas e Boas Práticas

### Organização de Produtos

1. **Use Categorias**: Organize produtos por categorias para facilitar a busca
2. **Defina Estoque Mínimo**: Configure estoque mínimo para receber alertas
3. **Mantenha SKUs Únicos**: Use SKUs para identificação rápida
4. **Descrições Completas**: Adicione descrições detalhadas para melhor identificação

### Gestão de Estoque

1. **Adicione Unidades Regularmente**: Mantenha o estoque atualizado
2. **Use Movimentações**: Registre todas as entradas e saídas
3. **Monitore Estoque Baixo**: Acompanhe o card de estoque baixo no dashboard
4. **Rastreie Unidades**: Use o rastreamento para produtos de alto valor

### Status de Produtos

1. **Rascunho**: Use para produtos que ainda não têm estoque físico
2. **Ativo**: Produtos prontos para venda/uso
3. **Inativo**: Produtos descontinuados ou temporariamente indisponíveis

### Códigos de Barras

1. **Geração Automática**: O sistema gera códigos automaticamente se não informados
2. **Impressão**: Use os PDFs gerados para imprimir etiquetas
3. **Rastreamento**: Cada unidade tem código único para rastreamento completo

### Dashboard

1. **Acompanhe KPIs**: Monitore os cards do dashboard diariamente
2. **Analise Gráficos**: Use os gráficos para identificar tendências
3. **Exporte Dados**: Baixe relatórios quando necessário

### Movimentações

1. **Registre Tudo**: Todas as entradas e saídas devem ser registradas
2. **Use Motivos**: Informe o motivo das movimentações para melhor rastreabilidade
3. **Valide Estoque**: O sistema impede saídas sem estoque suficiente

---

## 🆘 Solução de Problemas

### Produto não aparece na lista

- Verifique os filtros aplicados
- Confirme se o produto está ativo
- Verifique se a busca está correta

### Não consigo adicionar unidades

- Verifique se o produto está selecionado
- Confirme que a quantidade é válida (maior que 0)
- Verifique sua conexão com a internet

### Erro ao gerar PDF

- Verifique se o produto tem código de barras
- Tente novamente após alguns segundos
- Verifique se há unidades cadastradas

### Movimentação de saída bloqueada

- Verifique se há estoque suficiente
- Confirme que o produto está ativo
- Verifique se a quantidade é válida

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Verifique este guia primeiro
2. Consulte a seção de Solução de Problemas
3. Entre em contato com o suporte técnico

---

## 🎉 Conclusão

O **EstoqueRápido** é uma solução completa para gestão de estoque. Com este guia, você tem todas as informações necessárias para utilizar o sistema de forma eficiente.

**Lembre-se**: O sistema está em constante evolução. Novas funcionalidades podem ser adicionadas periodicamente.

---

_Última atualização: Dezembro 2024_
