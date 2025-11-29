/**
 * Página de Configurações da Empresa
 *
 * Permite editar informações da empresa, trocar logo e excluir empresa.
 * Endpoints: GET /api/companies/:id, PUT /api/companies/:id
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, AlertCircle, Upload, Trash2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Schema de validação
const companySchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cnpj: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface Company {
  id: number;
  name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
}

export default function CompanySettingsPage() {
  const router = useRouter();
  const { companyId: contextCompanyId, isAuthenticated } = useAuth();
  // Usa companyId do contexto ou do localStorage como fallback
  const companyId =
    contextCompanyId ||
    (typeof window !== 'undefined' ? localStorage.getItem('companyId') : null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  useEffect(() => {
    if (isAuthenticated && companyId) {
      fetchCompany();
    }
  }, [isAuthenticated, companyId]);

  const fetchCompany = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!companyId) {
        setError('Empresa não selecionada.');
        setIsLoading(false);
        return;
      }

      const response = await api.get(`/companies/${companyId}`);
      const fetchedCompany = response.data.data.company;
      setCompany(fetchedCompany);

      // Preencher formulário
      setValue('name', fetchedCompany.name || '');
      setValue('cnpj', fetchedCompany.cnpj || '');
      setValue('email', fetchedCompany.email || '');
      setValue('phone', fetchedCompany.phone || '');
      setValue('address', fetchedCompany.address || '');

      // Se houver logo, definir preview
      if (fetchedCompany.logoUrl) {
        setLogoPreview(fetchedCompany.logoUrl);
      }
    } catch (err: any) {
      console.error('Erro ao buscar empresa:', err);
      setError(
        err.response?.data?.message || 'Erro ao carregar dados da empresa.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CompanyFormData) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);

      if (!companyId) {
        setError('Empresa não selecionada.');
        setIsSaving(false);
        return;
      }

      // Preparar dados para envio - apenas enviar campos preenchidos
      const payload: any = {
        name: data.name.trim(),
      };

      // Adicionar campos opcionais apenas se tiverem valor
      if (data.cnpj && data.cnpj.trim()) {
        payload.cnpj = data.cnpj.trim();
      }

      if (data.email && data.email.trim()) {
        payload.email = data.email.trim();
      }

      if (data.phone && data.phone.trim()) {
        payload.phone = data.phone.trim();
      }

      if (data.address && data.address.trim()) {
        payload.address = data.address.trim();
      }

      console.log(
        '📦 Payload de atualização:',
        JSON.stringify(payload, null, 2),
      );

      const response = await api.put(`/companies/${companyId}`, payload);

      console.log('✅ Empresa atualizada com sucesso:', response.data);

      // Atualizar dados locais
      setCompany((prev) => (prev ? { ...prev, ...payload } : null));

      setSuccess('Empresa atualizada com sucesso!');

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erro ao atualizar empresa:', err);
      console.error('Detalhes do erro:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        errors: err.response?.data?.errors,
        data: err.response?.data,
      });

      // Mostrar erro mais detalhado ao usuário
      let errorMessage =
        err.response?.data?.message ||
        'Erro ao atualizar empresa. Tente novamente.';

      // Se houver erros de validação Zod, mostrar detalhes
      if (
        err.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        const zodErrors = err.response.data.errors
          .map(
            (e: any) =>
              e.message || `${e.path?.join('.')}: ${e.message || 'inválido'}`,
          )
          .join(', ');
        errorMessage = `Dados inválidos: ${zodErrors}`;
      }

      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem.');
        return;
      }

      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB.');
        return;
      }

      setLogoFile(file);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Fazer upload do logo
      try {
        if (!companyId) {
          setError('Empresa não selecionada.');
          return;
        }

        const formData = new FormData();
        formData.append('logo', file);

        const response = await api.post(
          `/companies/${companyId}/logo`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          },
        );

        if (response.data.success) {
          const logoUrl = response.data.data.logoUrl;
          setLogoPreview(logoUrl);
          setCompany((prev) => (prev ? { ...prev, logoUrl } : null));
          setSuccess('Logo atualizado com sucesso!');
          setTimeout(() => setSuccess(null), 3000);
        }
      } catch (err: any) {
        console.error('Erro ao fazer upload do logo:', err);
        setError(
          err.response?.data?.message ||
            'Erro ao fazer upload do logo. Tente novamente.',
        );
      }
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyId) {
      setError('Empresa não selecionada.');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      setSuccess(null);

      // Primeiro, baixa o backup em CSV
      try {
        const backupResponse = await api.get(`/companies/${companyId}/backup`, {
          responseType: 'blob',
        });

        // Cria um link temporário para download
        const url = window.URL.createObjectURL(new Blob([backupResponse.data]));
        const link = document.createElement('a');
        link.href = url;
        const fileName = `backup-${company?.name?.replace(/[^a-z0-9]/gi, '_') || 'empresa'}-${new Date().toISOString().split('T')[0]}.csv`;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        // Aguarda um pouco para garantir que o download iniciou
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (backupErr: any) {
        console.error('Erro ao gerar backup:', backupErr);
        // Continua mesmo se o backup falhar, mas avisa o usuário
        if (
          !confirm(
            'Erro ao gerar backup. Deseja continuar com a exclusão mesmo assim?',
          )
        ) {
          setIsDeleting(false);
          return;
        }
      }

      // Depois, exclui a empresa
      await api.delete(`/companies/${companyId}`);

      setShowDeleteDialog(false);

      // Remove companyId do localStorage
      localStorage.removeItem('companyId');

      // Redireciona para a área de trabalho
      router.push('/workspace');
    } catch (err: any) {
      console.error('Erro ao excluir empresa:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao excluir empresa. Tente novamente.',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">
            Carregando dados da empresa...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minha Empresa</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as informações e preferências da sua empresa
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950/20 dark:text-green-300 dark:border-green-700">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Informações da Empresa */}
      <Card>
        <CardHeader>
          <CardTitle>Dados da Empresa</CardTitle>
          <CardDescription>
            Atualize as informações básicas da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Logo */}
            <div className="space-y-2">
              <Label>Logo da Empresa</Label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {logoPreview ? (
                    <img
                      src={
                        logoPreview.startsWith('data:') ||
                        logoPreview.startsWith('http')
                          ? logoPreview
                          : `${
                              process.env.NEXT_PUBLIC_API_URL?.replace(
                                '/api',
                                '',
                              ) || 'http://localhost:3001'
                            }${logoPreview}`
                      }
                      alt="Logo da empresa"
                      className="h-24 w-24 rounded-lg object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center border-2 border-border">
                      <Building2 className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Label
                    htmlFor="logo"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-input rounded-md bg-background hover:bg-accent hover:text-accent-foreground"
                  >
                    <Upload className="h-4 w-4" />
                    Trocar Logo
                  </Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nome da Empresa <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  className={cn(errors.name && 'border-destructive')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  {...register('cnpj')}
                  className={cn(errors.cnpj && 'border-destructive')}
                />
                {errors.cnpj && (
                  <p className="text-sm text-destructive">
                    {errors.cnpj.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="contato@empresa.com"
                {...register('email')}
                className={cn(errors.email && 'border-destructive')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                {...register('phone')}
                className={cn(errors.phone && 'border-destructive')}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                placeholder="Rua, número, bairro"
                {...register('address')}
                className={cn(errors.address && 'border-destructive')}
              />
              {errors.address && (
                <p className="text-sm text-destructive">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Zona de Perigo - Exclusão */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
          <CardDescription>
            Ações irreversíveis relacionadas à sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Excluir Empresa</h4>
              <p className="text-sm text-muted-foreground">
                Excluir permanentemente a empresa e todos os dados associados.
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Empresa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Antes de excluir, um backup em CSV
              das movimentações será baixado automaticamente. Isso excluirá
              permanentemente a empresa "{company?.name}" e todos os dados
              associados (produtos, categorias, movimentações, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompany}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? 'Excluindo...' : 'Excluir Empresa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
