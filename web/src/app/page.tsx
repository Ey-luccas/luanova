/**
 * Página inicial da aplicação
 *
 * Redireciona para login ou dashboard dependendo da autenticação
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/logo';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirecionar para área de trabalho
        router.push('/workspace');
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Mostra loading enquanto verifica autenticação
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <Logo width={180} height={60} />
        </div>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </main>
  );
}
