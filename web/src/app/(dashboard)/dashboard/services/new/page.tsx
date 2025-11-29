/**
 * Página de Cadastro de Serviço
 *
 * Formulário para cadastrar um novo serviço no catálogo.
 * Envia para: POST /api/companies/{companyId}/products
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, ArrowLeft, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Schema de validação - Serviço não tem estoque
const serviceSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  description: z.string().optional(),
  unitPrice: z.string().optional(),
  isActive: z.boolean().default(true),
});

type ServiceFormData = z.infer<typeof serviceSchema>;

export default function NewServicePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      isActive: true, // Serviços começam ativos por padrão
    },
  });

  const isActive = watch('isActive');


  const onSubmit = async (data: ServiceFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        setError('Empresa não selecionada.');
        setIsLoading(false);
        return;
      }

      // Preparar dados para envio - Serviços não usam categoria
      const payload = {
        name: data.name,
        description: data.description || null,
        unitPrice: data.unitPrice ? parseFloat(data.unitPrice) : null,
        currentStock: 0, // Serviços não têm estoque físico
        categoryId: null, // Serviços não têm categoria
        isService: true, // Marcar como serviço
        isActive: data.isActive,
      };

      await api.post(`/companies/${companyId}/products`, payload);

      // Redirecionar para lista de serviços
      router.push('/dashboard/services');
    } catch (err: any) {
      console.error('Erro ao cadastrar serviço:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao cadastrar serviço. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/services">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Novo Serviço</h1>
          <p className="text-muted-foreground mt-2">
            Cadastre um novo serviço no catálogo
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Serviço</CardTitle>
          <CardDescription>
            Preencha os dados do serviço abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome do Serviço <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ex: Consultoria, Manutenção, Instalação..."
                {...register('name')}
                className={cn(errors.name && 'border-destructive')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <textarea
                id="description"
                rows={4}
                placeholder="Descreva o serviço que será prestado..."
                {...register('description')}
                className={cn(
                  'flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                  errors.description && 'border-destructive',
                )}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Preço (Opcional)</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 150.00"
                {...register('unitPrice')}
                className={cn(errors.unitPrice && 'border-destructive')}
              />
              {errors.unitPrice && (
                <p className="text-sm text-destructive">
                  {errors.unitPrice.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Preço padrão do serviço (pode ser alterado na hora da venda)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setValue('isActive', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label
                htmlFor="isActive"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Serviço ativo (disponível para prestação)
              </Label>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/services">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Briefcase className="mr-2 h-4 w-4" />
                Cadastrar Serviço
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
