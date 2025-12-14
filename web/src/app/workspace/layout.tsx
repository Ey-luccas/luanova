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
import { Logo } from '@/components/logo';
import {
  Building2,
  Package,
  Users,
  Settings,
  LogOut,
  User,
  Menu,
  X,
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

  // Reset avatarError quando userProfile ou user mudarem
  useEffect(() => {
    if (userProfile?.avatarUrl || user?.avatarUrl) {
      setAvatarError(false);
    }
  }, [userProfile?.avatarUrl, user?.avatarUrl]);

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
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-1/2 right-4 z-50 -translate-y-1/2" style={{ top: '48px' }}>
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
          'fixed top-[96px] left-0 h-[calc(100vh-96px)] border-r border-border z-40 transition-all duration-300 shadow-sm',
          'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95',
          'lg:top-0 lg:h-screen lg:translate-x-0 lg:fixed lg:z-auto',
          isMobileMenuOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0',
          isSidebarCollapsed ? 'w-16' : 'w-64',
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo/Header - Oculto no mobile */}
          <div
            className={cn(
              'hidden lg:flex h-20 border-b border-border items-center justify-center transition-all duration-300 flex-shrink-0',
              isSidebarCollapsed ? 'px-2' : 'px-4',
              'bg-background',
            )}
          >
            <div className="flex items-center gap-2 w-full justify-center">
              {isSidebarCollapsed ? (
                <Logo width={32} height={32} showText={false} variant="auto" />
              ) : (
                <Logo width={120} height={40} variant="auto" />
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav
            className={cn(
              'flex-1 p-2 space-y-1 lg:pt-6 pt-6 lg:cursor-pointer',
              isSidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto',
            )}
            onDoubleClick={() => {
              if (window.innerWidth >= 1024) {
                setIsSidebarCollapsed(!isSidebarCollapsed);
              }
            }}
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
          <div className="p-2 border-t border-border space-y-2 bg-background/30 flex-shrink-0">
            <div
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg',
                isSidebarCollapsed && 'justify-center px-2',
              )}
            >
              {(() => {
                const avatarUrl = userProfile?.avatarUrl || user?.avatarUrl;
                const hasAvatar = avatarUrl && avatarUrl.trim() !== '' && !avatarError;
                
                if (hasAvatar) {
                  const imageUrl = `${
                    process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
                    'https://api.luanova.cloud'
                  }${avatarUrl}`;
                  
                  return (
                    <img
                      src={imageUrl}
                      alt={userProfile?.name || user?.name || 'Avatar'}
                      className="h-10 w-10 rounded-full object-cover border-2 border-border flex-shrink-0"
                      onError={() => {
                        console.error('Erro ao carregar avatar:', imageUrl);
                        setAvatarError(true);
                      }}
                      onLoad={() => {
                        setAvatarError(false);
                      }}
                    />
                  );
                }
                
                return (
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border flex-shrink-0 text-primary font-semibold text-xs">
                    {(userProfile?.name || user?.name || 'U')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                );
              })()}
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
