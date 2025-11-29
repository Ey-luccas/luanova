/**
 * Utilitários para garantir que todos os query params sejam strings
 * Resolve problemas de validação Zod no backend
 */

export interface QueryParams {
  [key: string]: string | number | boolean | undefined | null;
}

/**
 * Converte todos os valores do objeto para string
 * Remove valores undefined, null ou vazios
 */
export function stringifyQueryParams(
  params: QueryParams
): Record<string, string> {
  const stringified: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    // Ignorar valores inválidos
    if (value === undefined || value === null || value === "") {
      continue;
    }

    // Converter para string
    stringified[key] = String(value);
  }

  return stringified;
}

