/**
 * Layout do Dashboard
 *
 * Layout que envolve todas as páginas do dashboard.
 * Inclui Sidebar fixa e Header.
 */

'use client';

import React from 'react';
import { Sidebar } from '@/components/sidebar';
import { Header } from '@/components/header';
import { ExtensionsProvider } from '@/contexts/ExtensionsContext';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useSidebar();

  return (
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
      <div 
        className={cn(
          'flex-1 flex flex-col overflow-hidden w-full transition-all duration-300',
          isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        )}
      >
          {/* Header */}
          <Header />

          {/* Page content */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pt-16 lg:pt-6">
            <div className="max-w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ExtensionsProvider>
      <SidebarProvider>
        <DashboardContent>{children}</DashboardContent>
      </SidebarProvider>
    </ExtensionsProvider>
  );
}
