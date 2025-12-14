/**
 * Página de Login
 *
 * Redireciona para a página de autenticação unificada
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para /auth com query param para login
    router.replace('/auth?mode=login');
  }, [router]);

  return null;
}
