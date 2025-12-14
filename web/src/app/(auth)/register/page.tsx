/**
 * Página de Registro
 *
 * Redireciona para a página de autenticação unificada
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para /auth com query param para cadastro
    router.replace('/auth?mode=register');
  }, [router]);

  return null;
}
