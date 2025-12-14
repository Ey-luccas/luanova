/**
 * Componente Sidebar
 *
 * Sidebar fixa à esquerda com navegação.
 * Responsiva: menu recolhido em mobile.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useExtensions } from '@/contexts/ExtensionsContext';
import {
  LayoutDashboard,
  FolderTree,
  ShoppingCart,
  Settings,
  Menu,
  X,
  BarChart3,
  Building2,
  Briefcase,
  Zap,
  Calendar,
  UtensilsCrossed,
  LogOut,
} from 'lucide-react';
import { PackageIcon } from '@/components/icons/PackageIcon';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Produtos',
    href: '/dashboard/products',
    icon: PackageIcon,
  },
  {
    title: 'Serviços',
    href: '/dashboard/services',
    icon: Briefcase,
  },
  {
    title: 'Categorias',
    href: '/dashboard/categories',
    icon: FolderTree,
  },
  {
    title: 'Extensões',
    href: '/dashboard/extensions',
    icon: Zap,
  },
  {
    title: 'Agendamentos',
    href: '/dashboard/appointments',
    icon: Calendar,
  },
  {
    title: 'Restaurante',
    href: '/dashboard/restaurant',
    icon: UtensilsCrossed,
  },
  {
    title: 'Movimentações',
    href: '/dashboard/movements',
    icon: ShoppingCart,
  },
  {
    title: 'Relatórios',
    href: '/dashboard/reports',
    icon: BarChart3,
  },
  {
    title: 'Minha Empresa',
    href: '/dashboard/settings',
    icon: Building2,
  },
];

import { useSidebar } from '@/contexts/SidebarContext';

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();
  const pathname = usePathname();
  const { hasExtension } = useExtensions();
  const router = useRouter();

  const handleExitToWorkspace = () => {
    // Ao sair do dashboard, apenas limpa a empresa selecionada
    // e volta para a área de trabalho, sem deslogar o usuário
    if (typeof window !== 'undefined') {
      localStorage.removeItem('companyId');
    }
    router.push('/workspace');
    // Fecha o menu mobile se estiver aberto
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-12 -translate-y-1/2 right-3 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
          className="h-10 w-10 shadow-md transition-all duration-200"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5 transition-transform duration-200 rotate-0" />
          ) : (
            <Menu className="h-5 w-5 transition-transform duration-200" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-card border-r border-border z-40 shadow-lg',
          'lg:translate-x-0 lg:static lg:z-auto lg:fixed lg:shadow-sm',
          'transition-transform duration-300 ease-in-out lg:transition-all',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          isSidebarCollapsed ? 'w-16' : 'w-64',
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo/Header */}
          <div
            className={cn(
              'hidden lg:flex h-[94px] border-b border-border items-center justify-center transition-all duration-300 flex-shrink-0',
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

          {/* Logo/Header Mobile */}
          <div className="lg:hidden h-16 border-b border-border flex items-center justify-center px-4 pt-3 flex-shrink-0">
            <Logo width={120} height={40} variant="auto" />
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
            {navItems.map((item) => {
              const Icon = item.icon;
              // Lógica melhorada para detecção de rota ativa
              // Para /dashboard, só ativa se for exatamente /dashboard
              // Para outras rotas, ativa se for exatamente igual ou começar com o href + '/'
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(item.href + '/');
              const isExtensions = item.href === '/dashboard/extensions';

              // Verifica se é agendamento e se a extensão está ativa
              const isAppointments = item.href === '/dashboard/appointments';
              const hasAppointmentsExtension = hasExtension('appointments');

              // Verifica se é restaurante e se a extensão está ativa
              const isRestaurant = item.href === '/dashboard/restaurant';
              const hasRestaurantExtension = hasExtension('restaurant_system');

              // Verifica se é serviços e se a extensão está ativa
              const isServices = item.href === '/dashboard/services';
              const hasServicesExtension = hasExtension('services_management');

              // Verifica se é produtos e se a extensão está ativa
              const isProducts = item.href === '/dashboard/products';
              const hasProductsExtension = hasExtension('products_management');

              // Só mostra agendamento se a extensão estiver ativa
              if (isAppointments && !hasAppointmentsExtension) {
                return null;
              }

              // Só mostra restaurante se a extensão estiver ativa
              if (isRestaurant && !hasRestaurantExtension) {
                return null;
              }

              // Só mostra serviços se a extensão estiver ativa
              if (isServices && !hasServicesExtension) {
                return null;
              }

              // Produtos: se serviços está instalado, verifica se produtos está ativo
              // Se serviços não está instalado, produtos sempre aparece (extensão padrão)
              if (isProducts) {
                if (hasServicesExtension && !hasProductsExtension) {
                  // Serviços está instalado mas produtos não está ativo - não mostra
                  return null;
                }
                // Caso contrário, mostra produtos (sempre ativo se serviços não estiver instalado)
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    // Fecha o menu mobile
                    setIsMobileOpen(false);
                    
                    // Para extensões, usa navegação programática para evitar problemas
                    if (isExtensions) {
                      e.preventDefault();
                      // Pequeno delay para garantir que o estado está atualizado
                      setTimeout(() => {
                        window.location.href = item.href;
                      }, 50);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                    isExtensions
                      ? isActive
                        ? 'bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30'
                        : 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20'
                      : isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    isSidebarCollapsed && 'justify-center px-2',
                  )}
                  title={isSidebarCollapsed ? item.title : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span>{item.title}</span>}
                  {isSidebarCollapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border">
                      {item.title}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-2 border-t border-border space-y-2 bg-background/30 flex-shrink-0">
            {/* Botão de logout */}
            <Link
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleExitToWorkspace();
              }}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isSidebarCollapsed && 'justify-center px-2',
              )}
              title={isSidebarCollapsed ? 'Voltar para Área de Trabalho' : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span>Voltar para Área de Trabalho</span>}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border">
                  Voltar para Área de Trabalho
                </div>
              )}
            </Link>

            {/* Copyright - apenas quando não estiver colapsado */}
            {!isSidebarCollapsed && (
              <p className="text-[10px] text-muted-foreground text-center pt-2">
                © 2024 Lualabs
                <br />
                <span className="text-[9px]">Desenvolvido por Lualabs</span>
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30 transition-opacity duration-300 ease-in-out',
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setIsMobileOpen(false)}
      />
    </>
  );
}
