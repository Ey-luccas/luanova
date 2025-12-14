/**
 * Página de Cadastro de Categoria
 * 
 * Formulário para cadastrar uma nova categoria.
 * Envia para: POST /api/companies/{companyId}/categories
 */

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Schema de validação
const categorySchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .min(1, "Nome é obrigatório"),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function NewCategoryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const companyId = localStorage.getItem("companyId");
      if (!companyId) {
        setError("Empresa não selecionada.");
        setIsLoading(false);
        return;
      }

      // Preparar dados para envio (backend só aceita 'name' por enquanto)
      const payload = {
        name: data.name,
        // description não é enviado pois o backend não suporta ainda
      };

      await api.post(`/companies/${companyId}/categories`, payload);

      // Redirecionar para lista de categorias
      router.push("/dashboard/categories");
    } catch (err: any) {
      console.error("Erro ao cadastrar categoria:", err);
      setError(
        err.response?.data?.message || "Erro ao cadastrar categoria. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href="/dashboard/categories">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Nova Categoria</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Crie uma nova categoria para organizar seus produtos
          </p>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl md:text-2xl">Informações da Categoria</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Preencha os dados da categoria abaixo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm">
                Nome da Categoria <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Eletrônicos"
                {...register("name")}
                className={cn(errors.name && "border-destructive")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-xs sm:text-sm">Descrição</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Descreva o tipo de produtos desta categoria..."
                {...register("description")}
                className={cn(
                  "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground placeholder:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                  errors.description && "border-destructive"
                )}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-2">
              <Link href="/dashboard/categories" className="w-full sm:w-auto">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Categoria
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

