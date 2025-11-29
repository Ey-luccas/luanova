/**
 * Página de Área de Trabalho (Workspace)
 *
 * Permite ao usuário escolher empresas, criar novas empresas e editar perfil.
 */

'use client';

import React, { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  AlertCircle,
  Building2,
  Check,
  Plus,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Company {
  id: number;
  name: string;
  cnpj?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  role: string;
  joinedAt: string;
}

interface UserProfile {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

// Schema de validação para criar empresa
const createCompanySchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cnpj: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type CreateCompanyFormData = z.infer<typeof createCompanySchema>;

export default function WorkspacePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null,
  );
  const [logoErrors, setLogoErrors] = useState<Set<number>>(new Set());
  const [avatarError, setAvatarError] = useState(false);

  // Form para criar empresa
  const {
    register: registerCompany,
    handleSubmit: handleSubmitCompany,
    formState: { errors: companyErrors },
    reset: resetCompany,
  } = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
  });

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Buscar dados iniciais
  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    await Promise.all([fetchCompanies(), fetchUserProfile()]);
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      const profile = response.data?.data?.user;
      if (profile) {
        setUserProfile(profile);
      }
    } catch (err: any) {
      console.error('Erro ao buscar perfil:', err);
    }
  };

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }

      const response = await api.get('/companies');

      let companiesData: Company[] = [];

      if (
        response.data?.data?.companies &&
        Array.isArray(response.data.data.companies)
      ) {
        companiesData = response.data.data.companies;
      } else if (
        response.data?.companies &&
        Array.isArray(response.data.companies)
      ) {
        companiesData = response.data.companies;
      } else if (Array.isArray(response.data?.data)) {
        companiesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        companiesData = response.data;
      }

      const normalizedCompanies = companiesData
        .filter((company: any) => company && company.id && company.name)
        .map((company: any) => ({
          id: Number(company.id),
          name: String(company.name).trim(),
          cnpj: company.cnpj || null,
          email: company.email || null,
          phone: company.phone || null,
          address: company.address || null,
          logoUrl: company.logoUrl || null,
          role: company.role || company.companyUsers?.[0]?.role || 'OPERATOR',
          joinedAt:
            company.joinedAt ||
            company.companyUsers?.[0]?.createdAt ||
            new Date().toISOString(),
        }));

      const uniqueCompaniesMap = new Map<number, Company>();
      normalizedCompanies.forEach((company) => {
        if (!uniqueCompaniesMap.has(company.id)) {
          uniqueCompaniesMap.set(company.id, company);
        }
      });

      companiesData = Array.from(uniqueCompaniesMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR'),
      );

      setCompanies(companiesData);
    } catch (err: any) {
      console.error('Erro ao buscar empresas:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao carregar empresas. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCompany = async (companyId: number) => {
    try {
      setIsSelecting(true);
      setError(null);
      setSelectedCompanyId(companyId);

      localStorage.setItem('companyId', companyId.toString());

      router.push('/dashboard');
    } catch (err: any) {
      console.error('Erro ao selecionar empresa:', err);
      setError('Erro ao selecionar empresa. Tente novamente.');
      setSelectedCompanyId(null);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleCreateCompany = async (data: CreateCompanyFormData) => {
    try {
      setIsCreating(true);
      setError(null);

      const payload: any = {
        name: data.name.trim(),
      };

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

      const response = await api.post('/companies', payload);

      const newCompany = response.data.data?.company;

      if (newCompany) {
        await fetchCompanies();
        setShowCreateForm(false);
        resetCompany();
        setSuccess('Empresa criada com sucesso!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      console.error('Erro ao criar empresa:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao criar empresa. Tente novamente.',
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestoreCompany = async () => {
    if (!restoreFile) {
      setError('Por favor, selecione um arquivo CSV.');
      return;
    }

    try {
      setIsRestoring(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('csv', restoreFile);

      const response = await api.post('/companies/restore', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        await fetchCompanies();
        setShowRestoreDialog(false);
        setRestoreFile(null);
        setSuccess(
          `Empresa "${response.data.data.company.name}" restaurada com sucesso! ${response.data.data.salesCount} movimentação(ões) restaurada(s).`,
        );
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err: any) {
      console.error('Erro ao restaurar empresa:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao restaurar empresa. Verifique se o arquivo CSV está correto.',
      );
    } finally {
      setIsRestoring(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4 sm:pt-10 sm:pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Área de Trabalho
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1.5">
            Gerencie suas empresas e continue trabalhando de forma eficiente
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4 sm:pt-10 sm:pb-6">
          {/* Mensagem de Boas-vindas */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
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
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-semibold">
                  Bem-vindo,{' '}
                  <span className="text-primary">
                    {userProfile?.name || user?.name || 'Usuário'}!
                  </span>
                </h2>
              </div>
            </div>
            <p className="text-muted-foreground ml-[52px]">
              Selecione uma empresa para começar ou crie uma nova
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-500 bg-green-50 text-green-900 dark:bg-green-950/20 dark:text-green-300 dark:border-green-700">
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-8">
            {/* Header da Seção */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Minhas Empresas
                </h2>
                <p className="text-muted-foreground mt-1">
                  {companies.length === 0
                    ? 'Crie sua primeira empresa para começar'
                    : `${companies.length} ${
                        companies.length === 1 ? 'empresa' : 'empresas'
                      } cadastrada${companies.length === 1 ? '' : 's'}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 shadow-sm" size="lg">
                      <Upload className="h-4 w-4" />
                      Restaurar Empresa
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Restaurar Empresa do Backup</DialogTitle>
                      <DialogDescription>
                        Faça upload do arquivo CSV de backup para restaurar uma
                        empresa com suas movimentações antigas.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="csvFile">Arquivo CSV</Label>
                        <Input
                          id="csvFile"
                          type="file"
                          accept=".csv"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setRestoreFile(file);
                            }
                          }}
                          disabled={isRestoring}
                        />
                        <p className="text-sm text-muted-foreground">
                          Selecione o arquivo CSV que foi baixado ao excluir a
                          empresa.
                        </p>
                      </div>
                      <div className="flex justify-end gap-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowRestoreDialog(false);
                            setRestoreFile(null);
                          }}
                          disabled={isRestoring}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={handleRestoreCompany}
                          disabled={!restoreFile || isRestoring}
                        >
                          {isRestoring ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Restaurando...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Restaurar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="gap-2 shadow-sm"
                  size="lg"
                >
                  <Plus className="h-4 w-4" />
                  {showCreateForm ? 'Cancelar' : 'Nova Empresa'}
                </Button>
              </div>
            </div>

            {/* Formulário de Criar Empresa */}
            {showCreateForm && (
              <Card className="border-2 border-primary/20 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        Criar Nova Empresa
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Preencha os dados abaixo para criar uma nova empresa
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleSubmitCompany(handleCreateCompany)}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nome da Empresa{' '}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ex: Minha Empresa Ltda"
                        {...registerCompany('name')}
                        disabled={isCreating}
                        className="h-11"
                      />
                      {companyErrors.name && (
                        <p className="text-sm text-destructive">
                          {companyErrors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="cnpj" className="text-sm font-medium">
                          CNPJ
                        </Label>
                        <Input
                          id="cnpj"
                          placeholder="00.000.000/0000-00"
                          {...registerCompany('cnpj')}
                          disabled={isCreating}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          E-mail
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="contato@empresa.com"
                          {...registerCompany('email')}
                          disabled={isCreating}
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Telefone
                        </Label>
                        <Input
                          id="phone"
                          placeholder="(00) 00000-0000"
                          {...registerCompany('phone')}
                          disabled={isCreating}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="address"
                          className="text-sm font-medium"
                        >
                          Endereço
                        </Label>
                        <Input
                          id="address"
                          placeholder="Rua, Número - Cidade, Estado"
                          {...registerCompany('address')}
                          disabled={isCreating}
                          className="h-11"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCreateForm(false);
                          resetCompany();
                          setError(null);
                        }}
                        disabled={isCreating}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={isCreating}
                        className="flex-1"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Empresa
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Lista de Empresas */}
            {companies.length === 0 && !showCreateForm ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                    <Building2 className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    Nenhuma empresa encontrada
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Crie sua primeira empresa para começar a gerenciar seu
                    estoque e movimentações
                  </p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    className="gap-2"
                    size="lg"
                  >
                    <Plus className="h-4 w-4" />
                    Criar Primeira Empresa
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {companies.map((company) => (
                  <Card
                    key={`company-${company.id}`}
                    className={cn(
                      'group cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50',
                      'border-2',
                      selectedCompanyId === company.id &&
                        'border-primary ring-2 ring-primary/20 shadow-md',
                    )}
                    onClick={() => handleSelectCompany(company.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {company.logoUrl && !logoErrors.has(company.id) ? (
                            <div className="h-14 w-14 rounded-xl border-2 border-border flex-shrink-0 overflow-hidden bg-muted">
                              <img
                                src={`${
                                  process.env.NEXT_PUBLIC_API_URL?.replace(
                                    '/api',
                                    '',
                                  ) || 'http://localhost:3001'
                                }${company.logoUrl}`}
                                alt={`Logo ${company.name}`}
                                className="h-full w-full object-cover"
                                onError={() => {
                                  setLogoErrors((prev) =>
                                    new Set(prev).add(company.id),
                                  );
                                }}
                              />
                            </div>
                          ) : (
                            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border-2 border-border">
                              <Building2 className="h-7 w-7 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-semibold text-lg truncate mb-1 group-hover:text-primary transition-colors"
                              title={company.name}
                            >
                              {company.name}
                            </h3>
                            {company.cnpj && (
                              <p
                                className="text-xs text-muted-foreground truncate"
                                title={company.cnpj}
                              >
                                {company.cnpj}
                              </p>
                            )}
                          </div>
                        </div>
                        {selectedCompanyId === company.id && (
                          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-2 animate-in fade-in zoom-in duration-200">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-4 border-t">
                        {company.email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>📧</span>
                            <span className="truncate" title={company.email}>
                              {company.email}
                            </span>
                          </div>
                        )}
                        {company.phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>📞</span>
                            <span>{company.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs font-medium px-2 py-1 rounded-md bg-muted text-muted-foreground">
                            {company.role === 'ADMIN' && 'Administrador'}
                            {company.role === 'MANAGER' && 'Gerente'}
                            {company.role === 'OPERATOR' && 'Operador'}
                            {company.role === 'VIEWER' && 'Visualizador'}
                          </span>
                          {isSelecting && selectedCompanyId === company.id && (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
