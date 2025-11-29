# Shared

Este diretório contém código compartilhado entre os diferentes projetos (backend, web e mobile).

## Estrutura

- **types/**: Definições de tipos TypeScript compartilhadas
- **utils/**: Funções utilitárias compartilhadas

## Uso

Os tipos e utilitários podem ser importados nos projetos conforme necessário:

```typescript
// Exemplo de importação
import { Product } from '../../shared/types/product';
import { formatCurrency } from '../../shared/utils/formatters';
```

