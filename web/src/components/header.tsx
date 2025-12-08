/**
 * Componente Header
 *
 * Header do dashboard com informações do usuário e ações.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  LogOut,
  User,
  Building2,
  ArrowLeftRight,
  Moon,
  Sun,
} from 'lucide-react';
import api from '@/lib/api';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [logoError, setLogoError] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Evitar flash de conteúdo incorreto no SSR
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExitToWorkspace = () => {
    // Ao sair do dashboard, apenas limpa a empresa selecionada
    // e volta para a área de trabalho, sem deslogar o usuário
    if (typeof window !== 'undefined') {
      localStorage.removeItem('companyId');
    }
    router.push('/workspace');
  };

  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const companyId = localStorage.getItem('companyId');
        if (!companyId) {
          setCompanyName(null);
          return;
        }

        const response = await api.get(`/companies/${companyId}`);
        const company = response.data?.data?.company || response.data?.data;
        if (company?.name) {
          setCompanyName(company.name);
        }
        if (company?.logoUrl) {
          setCompanyLogo(company.logoUrl);
          setLogoError(false); // Resetar erro ao carregar novo logo
        } else {
          setCompanyLogo(null);
          setLogoError(false);
        }
      } catch (error) {
        console.error('Erro ao buscar nome da empresa:', error);
        setCompanyName(null);
      }
    };

    fetchCompanyName();
  }, []);

  const handleSelectCompany = () => {
    // Volta para a área de trabalho para escolher outra empresa
    if (typeof window !== 'undefined') {
      localStorage.removeItem('companyId');
    }
    router.push('/workspace');
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-3 sm:px-4 md:px-6">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        {/* Indicador da empresa atual e botão para trocar */}
        {companyName ? (
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-primary/10 min-w-0">
              {companyLogo && !logoError ? (
                <img
                  src={`${
                    process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
                    'https://api.luanova.cloud'
                  }${companyLogo}`}
                  alt={`Logo ${companyName}`}
                  className="h-4 w-4 sm:h-5 sm:w-5 rounded object-cover flex-shrink-0"
                  onError={() => {
                    // Se o logo falhar ao carregar, marcar como erro
                    setLogoError(true);
                  }}
                />
              ) : (
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
                {companyName}
              </span>
            </div>
            <Button
              onClick={handleSelectCompany}
              variant="outline"
              size="sm"
              className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 flex-shrink-0"
              title="Trocar de empresa"
            >
              <ArrowLeftRight className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden md:inline">Trocar Empresa</span>
              <span className="md:hidden hidden sm:inline">Trocar</span>
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleSelectCompany}
            variant="outline"
            size="sm"
            className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
          >
            <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden md:inline">Selecionar Empresa</span>
            <span className="md:hidden hidden sm:inline">Empresa</span>
            <span className="sm:hidden">Emp.</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
        {/* Theme toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            aria-label="Alternar tema"
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        )}

        {/* User info */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium truncate max-w-[150px]">
              {user?.name || 'Usuário'}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Logout button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleExitToWorkspace}
          title="Voltar para Área de Trabalho"
          aria-label="Voltar para Área de Trabalho"
          className="h-8 w-8 sm:h-10 sm:w-10"
        >
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </div>
    </header>
  );
}
console.log('🚀 Deploy automático FRONTEND funcionando - teste 01');
