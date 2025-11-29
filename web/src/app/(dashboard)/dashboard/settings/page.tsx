/**
 * Página de Configurações
 * 
 * Página principal de configurações que redireciona para as configurações da empresa.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona para as configurações da empresa
    router.replace("/dashboard/settings/company");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    </div>
  );
}

