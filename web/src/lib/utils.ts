/**
 * Utilitários do Next.js
 * 
 * Este arquivo contém funções utilitárias utilizadas
 * em toda a aplicação web, incluindo a função cn()
 * para o shadcn/ui.
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um valor numérico como moeda brasileira (R$)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// TODO: Adicionar outras funções utilitárias conforme necessário

