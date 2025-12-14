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
  Upload,
  X,
  Archive,
  ArchiveRestore,
  Trash2,
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
import { Logo } from '@/components/logo';

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
  isArchived?: boolean;
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null,
  );
  const [logoErrors, setLogoErrors] = useState<Set<number>>(new Set());
  const [avatarError, setAvatarError] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showToast, setShowToast] = useState(true);

  // Esconde o toast automaticamente após 5 segundos
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Função para obter saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Bom dia';
    } else if (hour >= 12 && hour < 18) {
      return 'Boa tarde';
    } else {
      return 'Boa noite';
    }
  };

  // Form para criar empresa
  const {
    register: registerCompany,
    handleSubmit: handleSubmitCompany,
    formState: { errors: companyErrors },
    reset: resetCompany,
  } = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
  });

  // Redirecionar se não estiver autenticado (sem flash)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth');
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
          isArchived: company.isArchived || false,
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

  const handleArchiveCompany = async (companyId: number) => {
    try {
      setIsSelecting(true);
      setError(null);

      // Marca a empresa como arquivada (atualiza isArchived para true)
      await api.patch(`/companies/${companyId}`, {
        isArchived: true,
      });

      setSuccess('Empresa arquivada com sucesso!');
      await fetchCompanies();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erro ao arquivar empresa:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao arquivar empresa. Tente novamente.',
      );
    } finally {
      setIsSelecting(false);
    }
  };

  const handleUnarchiveCompany = async (companyId: number) => {
    try {
      setIsSelecting(true);
      setError(null);

      // Restaura a empresa (marca isArchived como false)
      await api.patch(`/companies/${companyId}`, {
        isArchived: false,
      });

      setSuccess('Empresa restaurada com sucesso!');
      await fetchCompanies();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erro ao restaurar empresa:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao restaurar empresa. Tente novamente.',
      );
    } finally {
      setIsSelecting(false);
    }
  };

  const handleDeleteCompany = async (companyId: number) => {
    if (!confirm('Tem certeza que deseja excluir permanentemente esta empresa? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setIsSelecting(true);
      setError(null);

      // Exclui a empresa permanentemente
      await api.delete(`/companies/${companyId}`);

      setSuccess('Empresa excluída permanentemente!');
      await fetchCompanies();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erro ao excluir empresa:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao excluir empresa. Tente novamente.',
      );
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
      {/* Header fixo no mobile */}
      <header className="border-b border-border fixed top-0 left-0 right-0 z-40 lg:sticky lg:top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95 lg:bg-background/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Mobile: Apenas Logo */}
          <div className="lg:hidden flex items-center h-24 pr-16">
            <Logo width={120} height={40} variant="auto" />
          </div>
          
          {/* Desktop: Título e Descrição */}
          <div className="hidden lg:block py-6 lg:py-10">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Área de Trabalho
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1.5">
              Gerencie suas empresas e continue trabalhando de forma eficiente
            </p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="w-full pt-20 lg:pt-0 bg-background" style={{ minHeight: '100vh' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-4 sm:pt-10 sm:pb-6">
          {/* Mensagem de Boas-vindas */}
          <div className="mb-8 lg:mb-10">
            {/* Mobile: Título "Área de Trabalho" */}
            <div className="lg:hidden mb-4">
              <h1 className="text-2xl font-bold tracking-tight">
                Área de Trabalho
              </h1>
            </div>
            
            <div className="flex items-center gap-3 lg:gap-4 mb-3 lg:mb-4">
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
                      className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full object-cover border-2 border-border flex-shrink-0"
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
                  <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border flex-shrink-0 text-primary font-semibold text-sm sm:text-base lg:text-lg">
                    {(userProfile?.name || user?.name || 'U')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-2xl lg:text-3xl font-semibold truncate">
                  {getGreeting()},{' '}
                  <span className="text-primary">
                    {userProfile?.name || user?.name || 'Usuário'}!
                  </span>
                </h2>
              </div>
            </div>
          </div>

          {/* Toast/Popup */}
          {showToast && (
            <div
              className={cn(
                'fixed bottom-4 right-4 lg:bottom-6 lg:right-6 z-50',
                'bg-card border border-border rounded-lg shadow-lg p-4',
                'max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300',
                'transition-all'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  Selecione uma empresa para começar ou crie uma nova
                </p>
                <button
                  onClick={() => setShowToast(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-500 text-green-900 dark:text-green-300 dark:border-green-700 bg-background">
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-8">
            {/* Header da Seção */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                  {showArchived ? 'Empresas Arquivadas' : 'Minhas Empresas'}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">
                  {showArchived
                    ? companies.filter((c) => c.isArchived).length === 0
                      ? 'Nenhuma empresa arquivada'
                      : `${companies.filter((c) => c.isArchived).length} ${
                          companies.filter((c) => c.isArchived).length === 1
                            ? 'empresa arquivada'
                            : 'empresas arquivadas'
                        }`
                    : companies.filter((c) => !c.isArchived).length === 0
                      ? 'Crie sua primeira empresa para começar'
                      : `${companies.filter((c) => !c.isArchived).length} ${
                          companies.filter((c) => !c.isArchived).length === 1
                            ? 'empresa cadastrada'
                            : 'empresas cadastradas'
                        }`}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {!showArchived && (
                  <Button
                    variant="outline"
                    className="gap-2 shadow-sm w-full sm:w-auto"
                    size="lg"
                    onClick={() => setShowArchived(true)}
                  >
                    <Archive className="h-4 w-4" />
                    <span className="hidden sm:inline">Arquivadas</span>
                    <span className="sm:hidden">Arquivadas</span>
                  </Button>
                )}
                {showArchived && (
                  <Button
                    variant="outline"
                    className="gap-2 shadow-sm w-full sm:w-auto"
                    size="lg"
                    onClick={() => setShowArchived(false)}
                  >
                    <ArchiveRestore className="h-4 w-4" />
                    <span className="hidden sm:inline">Voltar</span>
                    <span className="sm:hidden">Voltar</span>
                  </Button>
                )}
                <Button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="gap-2 shadow-sm w-full sm:w-auto"
                  size="lg"
                >
                  <Plus className="h-4 w-4" />
                  {showCreateForm ? 'Cancelar' : <span className="hidden sm:inline">Nova Empresa</span>}
                  {!showCreateForm && <span className="sm:hidden">Nova</span>}
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

                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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

                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
            {(() => {
              const filteredCompanies = showArchived
                ? companies.filter((c) => c.isArchived)
                : companies.filter((c) => !c.isArchived);

              return filteredCompanies.length === 0 && !showCreateForm ? (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {showArchived
                        ? 'Nenhuma empresa arquivada'
                        : 'Nenhuma empresa encontrada'}
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {showArchived
                        ? 'Empresas arquivadas aparecerão aqui. Você pode excluí-las permanentemente se necessário.'
                        : 'Crie sua primeira empresa para começar a gerenciar seu estoque e movimentações'}
                    </p>
                    {!showArchived && (
                      <Button
                        onClick={() => setShowCreateForm(true)}
                        className="gap-2"
                        size="lg"
                      >
                        <Plus className="h-4 w-4" />
                        Criar Primeira Empresa
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredCompanies.map((company) => (
                  <Card
                    key={`company-${company.id}`}
                    className={cn(
                      'group transition-all duration-200 hover:shadow-lg hover:border-primary/50',
                      'border-2',
                      selectedCompanyId === company.id &&
                        'border-primary ring-2 ring-primary/20 shadow-md',
                      !showArchived && 'cursor-pointer',
                      showArchived && 'opacity-75',
                    )}
                    onClick={() => {
                      if (!showArchived && !company.isArchived) {
                        handleSelectCompany(company.id);
                      }
                    }}
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
                                  ) || 'https://api.luanova.cloud'
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
                        {/* Botão de ação: Arquivar, Restaurar ou Excluir */}
                        <div className="flex justify-end gap-2 pt-2">
                          {!showArchived ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Deseja arquivar esta empresa? Ela ficará inativa mas poderá ser restaurada depois.')) {
                                  handleArchiveCompany(company.id);
                                }
                              }}
                            >
                              <Archive className="h-4 w-4" />
                              <span className="text-xs">Arquivar</span>
                            </Button>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUnarchiveCompany(company.id);
                                }}
                              >
                                <ArchiveRestore className="h-4 w-4" />
                                <span className="text-xs">Restaurar</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCompany(company.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="text-xs">Excluir</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </main>
    </div>
  );
}
