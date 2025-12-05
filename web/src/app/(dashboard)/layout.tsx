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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ExtensionsProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden w-full lg:ml-0">
          {/* Header */}
          <Header />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pt-16 lg:pt-0">
            <div className="max-w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </ExtensionsProvider>
  );
}
