/**
 * Componente Sidebar
 *
 * Sidebar fixa à esquerda com navegação.
 * Responsiva: menu recolhido em mobile.
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useExtensions } from '@/contexts/ExtensionsContext';
import {
  LayoutDashboard,
  Package,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    icon: Package,
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

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { hasExtension } = useExtensions();

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-3 right-3 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle menu"
          className="h-10 w-10 shadow-md"
        >
          {isMobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-card border-r border-border z-40 transition-transform duration-300 w-64',
          'lg:translate-x-0 lg:static lg:z-auto',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="h-16 border-b border-border flex items-center justify-center px-4">
            <h1 className="text-xl font-bold">Lua Nova</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/');
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
                    'flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isExtensions
                      ? isActive
                        ? 'bg-green-500/20 text-green-700 dark:text-green-400 hover:bg-green-500/30'
                        : 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20'
                      : isActive
                      ? 'bg-accent text-accent-foreground hover:bg-accent'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-border space-y-2">
            <Link
              href="/workspace"
              onClick={() => {
                setIsMobileOpen(false);
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('companyId');
                }
              }}
              className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
            >
              <Building2 className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">Trocar Empresa</span>
            </Link>
            <p className="text-xs text-muted-foreground text-center pt-2">
              © 2024 Lualabs
              <br />
              <span className="text-[10px]">Desenvolvido por Lualabs</span>
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
