/**
 * Layout compartilhado para páginas de workspace
 *
 * Inclui sidebar de navegação que aparece em todas as páginas de workspace.
 * Sidebar pode ser colapsada para mostrar apenas ícones.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Package,
  Users,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      const profile = response.data?.data?.user;
      if (profile) {
        setUserProfile(profile);
        setAvatarError(false);
      }
    } catch (err: any) {
      console.error('Erro ao buscar perfil:', err);
    }
  };

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
          className="h-10 w-10 shadow-md"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Overlay para mobile */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-screen bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/95 border-r border-border z-40 transition-all duration-300 shadow-sm',
          'lg:translate-x-0 lg:fixed lg:z-auto lg:h-screen',
          isMobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0',
          isSidebarCollapsed ? 'w-16' : 'w-64',
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo/Header */}
          <div
            className={cn(
              'h-20 border-b border-border flex items-center justify-center transition-all duration-300 flex-shrink-0',
              isSidebarCollapsed ? 'px-2' : 'px-4',
            )}
          >
            <div className="flex items-center gap-2 w-full justify-center">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-bold text-sm">
                  LN
                </span>
              </div>
              {!isSidebarCollapsed && (
                <h1 className="text-xl font-bold tracking-tight whitespace-nowrap">
                  Lua Nova
                </h1>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={cn(
              'flex-1 p-2 space-y-1',
              isSidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto',
            )}
          >
            <Link
              href="/workspace"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                pathname === '/workspace'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isSidebarCollapsed && 'justify-center px-2',
              )}
              title={isSidebarCollapsed ? 'Empresas' : undefined}
            >
              <Building2 className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span>Empresas</span>}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border">
                  Empresas
                </div>
              )}
            </Link>

            <Link
              href="/workspace/subscription"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                pathname === '/workspace/subscription'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isSidebarCollapsed && 'justify-center px-2',
              )}
              title={isSidebarCollapsed ? 'Assinatura' : undefined}
            >
              <Package className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span>Assinatura</span>}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border">
                  Assinatura
                </div>
              )}
            </Link>

            <Link
              href="/workspace/users"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                pathname === '/workspace/users'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isSidebarCollapsed && 'justify-center px-2',
              )}
              title={isSidebarCollapsed ? 'Usuários' : undefined}
            >
              <Users className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span>Usuários</span>}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border">
                  Usuários
                </div>
              )}
            </Link>

            <Link
              href="/workspace/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                pathname === '/workspace/settings'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isSidebarCollapsed && 'justify-center px-2',
              )}
              title={isSidebarCollapsed ? 'Configurações' : undefined}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span>Configurações</span>}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border">
                  Configurações
                </div>
              )}
            </Link>
          </nav>

          {/* Footer */}
          <div className="p-2 border-t border-border space-y-2 bg-muted/30 flex-shrink-0">
            <div
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg',
                isSidebarCollapsed && 'justify-center px-2',
              )}
            >
              {userProfile?.avatarUrl && !avatarError ? (
                <img
                  src={`${
                    process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
                    'http://localhost:3001'
                  }${userProfile.avatarUrl}`}
                  alt={userProfile?.name || 'Avatar'}
                  className="h-10 w-10 rounded-full object-cover border-2 border-border flex-shrink-0"
                  onError={() => {
                    setAvatarError(true);
                  }}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
              )}
              {!isSidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">
                    {userProfile?.name || user?.name || 'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userProfile?.email || user?.email}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-2 text-muted-foreground hover:text-foreground',
                isSidebarCollapsed && 'justify-center px-0',
              )}
              onClick={logout}
              title={isSidebarCollapsed ? 'Sair' : undefined}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              {!isSidebarCollapsed && <span>Sair</span>}
            </Button>
            {!isSidebarCollapsed && (
              <p className="text-[10px] text-muted-foreground text-center pt-2 border-t border-border">
                © 2024 Lualabs
                <br />
                <span className="text-[9px]">Desenvolvido por Lualabs</span>
              </p>
            )}
          </div>

          {/* Toggle Button - Desktop Only */}
          <div className="hidden lg:block p-2 border-t border-border flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="w-full"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? 'Expandir' : 'Recolher'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          'flex-1 h-screen overflow-y-auto transition-all duration-300',
          'pt-16 lg:pt-0', // Adiciona padding-top em mobile para não cobrir o conteúdo
          isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64',
        )}
      >
        {children}
      </div>
    </div>
  );
}
