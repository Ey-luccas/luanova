/**
 * Página de Seleção de Empresa
 *
 * Permite ao usuário selecionar uma empresa após o login.
 * Lista todas as empresas do usuário e permite selecionar uma.
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
import { Loader2, AlertCircle, Building2, Check, Plus } from 'lucide-react';
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

// Schema de validação para criar empresa
const createCompanySchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cnpj: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type CreateCompanyFormData = z.infer<typeof createCompanySchema>;

export default function SelectCompanyPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null,
  );
  const [logoErrors, setLogoErrors] = useState<Set<number>>(new Set());

  // Form para criar empresa
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
  });

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Buscar empresas do usuário
  useEffect(() => {
    if (isAuthenticated) {
      fetchCompanies();
    }
  }, [isAuthenticated]);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Verifica se há token antes de fazer a requisição
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }

      console.log('🔍 Buscando empresas do usuário...');
      const response = await api.get('/companies');

      console.log('📦 Resposta da API de empresas:', response.data);

      // Verifica se a resposta tem a estrutura esperada
      let companiesData: Company[] = [];

      // Backend retorna: { success: true, data: { companies: [...], count: number } }
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

      console.log(`✅ ${companiesData.length} empresa(s) encontrada(s)`);

      // Normaliza os dados das empresas para garantir que tenham a estrutura correta
      const normalizedCompanies = companiesData
        .filter((company: any) => company && company.id && company.name) // Filtra empresas inválidas
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

      // Remove duplicatas baseado no ID da empresa
      const uniqueCompaniesMap = new Map<number, Company>();
      normalizedCompanies.forEach((company) => {
        if (!uniqueCompaniesMap.has(company.id)) {
          uniqueCompaniesMap.set(company.id, company);
        }
      });

      // Converte para array e ordena por nome alfabeticamente
      companiesData = Array.from(uniqueCompaniesMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR'),
      );

      console.log(
        `✅ ${companiesData.length} empresa(s) única(s) encontrada(s)`,
      );
      setCompanies(companiesData);

      // Se o usuário tem apenas uma empresa, selecionar automaticamente
      if (companiesData.length === 1) {
        console.log(
          '✅ Apenas uma empresa encontrada, selecionando automaticamente...',
        );
        handleSelectCompany(companiesData[0].id);
      } else if (companiesData.length === 0) {
        console.log(
          'ℹ️  Nenhuma empresa encontrada. Usuário pode criar uma nova.',
        );
        setError(null); // Não é erro, apenas não há empresas
      }
    } catch (err: any) {
      console.error('❌ Erro ao buscar empresas:', err);
      console.error('❌ Detalhes do erro:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        data: err.response?.data,
      });

      // Tratamento de erros específicos
      if (err.response?.status === 401) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        // Limpa o localStorage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('companyId');
        // Redireciona para login após 2 segundos
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else if (err.response?.status === 500) {
        setError('Erro no servidor. Por favor, tente novamente mais tarde.');
        setCompanies([]);
      } else if (err.response?.data?.message) {
        // Se a mensagem for sobre não ter empresas, não é um erro real
        const errorMessage = err.response.data.message.toLowerCase();
        if (
          errorMessage.includes('nenhuma empresa') ||
          errorMessage.includes('não há empresas') ||
          errorMessage.includes('sem empresas')
        ) {
          // Não há empresas, mas não é erro - apenas lista vazia
          setCompanies([]);
          setError(null);
        } else {
          setError(err.response.data.message);
          setCompanies([]);
        }
      } else {
        // Se não houver resposta, pode ser que não haja empresas (200 com array vazio)
        setCompanies([]);
        setError(err.message || 'Erro ao carregar empresas. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCompany = async (companyId: number) => {
    try {
      setIsSelecting(true);
      setError(null);
      setSelectedCompanyId(companyId);

      // Salvar companyId no localStorage
      localStorage.setItem('companyId', companyId.toString());

      // Redirecionar para dashboard
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

      // Preparar dados para envio
      const payload: any = {
        name: data.name.trim(),
      };

      // Adicionar campos opcionais apenas se preenchidos
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

      // Criar empresa
      const response = await api.post('/companies', payload);

      const newCompany = response.data.data?.company;

      if (newCompany) {
        // Atualizar lista de empresas
        await fetchCompanies();

        // Selecionar automaticamente a empresa criada
        handleSelectCompany(newCompany.id);
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

  if (error && companies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erro ao carregar empresas</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button
              onClick={fetchCompanies}
              className="mt-4 w-full"
              variant="outline"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {showCreateForm ? 'Criar Nova Empresa' : 'Selecione uma Empresa'}
          </CardTitle>
          <CardDescription>
            {showCreateForm
              ? 'Preencha os dados abaixo para criar uma nova empresa'
              : 'Escolha a empresa que deseja gerenciar'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {companies.length === 0 && !error ? (
            <div className="space-y-6">
              {/* Mensagem de boas-vindas */}
              <div className="text-center py-4">
                <Building2 className="h-12 w-12 mx-auto text-primary mb-4" />
                <p className="text-foreground mb-2 font-medium text-lg">
                  Bem-vindo ao Lua Nova! 🎉
                </p>
                <p className="text-sm text-muted-foreground">
                  Crie sua primeira empresa para começar a gerenciar seu estoque
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Desenvolvido por Lualabs
                </p>
              </div>

              {/* Formulário de criação */}
              {!showCreateForm ? (
                <div className="flex flex-col items-center gap-4">
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    size="lg"
                    className="w-full max-w-sm"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Criar Minha Primeira Empresa
                  </Button>
                  <div className="flex gap-3 justify-center w-full max-w-sm">
                    <Button
                      onClick={fetchCompanies}
                      variant="outline"
                      className="flex-1"
                    >
                      Atualizar
                    </Button>
                    <Button
                      onClick={() => router.push('/dashboard')}
                      variant="ghost"
                      className="flex-1"
                    >
                      Continuar sem empresa
                    </Button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit(handleCreateCompany)}
                  className="space-y-4 max-w-md mx-auto"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nome da Empresa{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ex: Minha Empresa Ltda"
                      {...register('name')}
                      disabled={isCreating}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      {...register('cnpj')}
                      disabled={isCreating}
                    />
                    {errors.cnpj && (
                      <p className="text-sm text-destructive">
                        {errors.cnpj.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail (opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@empresa.com"
                      {...register('email')}
                      disabled={isCreating}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone (opcional)</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      {...register('phone')}
                      disabled={isCreating}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço (opcional)</Label>
                    <Input
                      id="address"
                      placeholder="Rua, Número - Cidade, Estado"
                      {...register('address')}
                      disabled={isCreating}
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        reset();
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
              )}
            </div>
          ) : companies.length === 0 &&
            error &&
            !error.includes('Sessão expirada') ? (
            <div className="space-y-6">
              <div className="text-center py-4">
                <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
                <p className="text-destructive font-medium mb-2">
                  Não foi possível carregar suas empresas
                </p>
                <p className="text-sm text-muted-foreground mb-4">{error}</p>
              </div>

              {!showCreateForm ? (
                <div className="flex flex-col items-center gap-4">
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    size="lg"
                    className="w-full max-w-sm"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Criar Minha Primeira Empresa
                  </Button>
                  <div className="flex gap-3 justify-center w-full max-w-sm">
                    <Button
                      onClick={fetchCompanies}
                      variant="outline"
                      className="flex-1"
                    >
                      Tentar novamente
                    </Button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit(handleCreateCompany)}
                  className="space-y-4 max-w-md mx-auto"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nome da Empresa{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="Ex: Minha Empresa Ltda"
                      {...register('name')}
                      disabled={isCreating}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      {...register('cnpj')}
                      disabled={isCreating}
                    />
                    {errors.cnpj && (
                      <p className="text-sm text-destructive">
                        {errors.cnpj.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail (opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contato@empresa.com"
                      {...register('email')}
                      disabled={isCreating}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone (opcional)</Label>
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      {...register('phone')}
                      disabled={isCreating}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço (opcional)</Label>
                    <Input
                      id="address"
                      placeholder="Rua, Número - Cidade, Estado"
                      {...register('address')}
                      disabled={isCreating}
                    />
                    {errors.address && (
                      <p className="text-sm text-destructive">
                        {errors.address.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        reset();
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
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Lista de empresas existentes - só mostra se não estiver criando */}
              {!showCreateForm && (
                <>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {companies.map((company) => (
                      <Card
                        key={`company-${company.id}`}
                        className={cn(
                          'cursor-pointer transition-all hover:border-primary hover:shadow-md',
                          selectedCompanyId === company.id &&
                            'border-primary ring-2 ring-primary',
                        )}
                        onClick={() => handleSelectCompany(company.id)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {company.logoUrl &&
                              !logoErrors.has(company.id) ? (
                                <img
                                    src={`${
                                      process.env.NEXT_PUBLIC_API_URL?.replace(
                                        '/api',
                                        '',
                                      ) || 'https://api.luanova.cloud'
                                    }${company.logoUrl}`}
                                  alt={`Logo ${company.name}`}
                                  className="h-12 w-12 rounded-lg object-cover border-2 border-border flex-shrink-0"
                                  onError={() => {
                                    // Se o logo falhar ao carregar, adicionar ao set de erros
                                    setLogoErrors((prev) =>
                                      new Set(prev).add(company.id),
                                    );
                                  }}
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Building2 className="h-6 w-6 text-primary" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3
                                  className="font-semibold text-lg truncate"
                                  title={company.name}
                                >
                                  {company.name}
                                </h3>
                                {company.cnpj && (
                                  <p
                                    className="text-sm text-muted-foreground truncate"
                                    title={company.cnpj}
                                  >
                                    CNPJ: {company.cnpj}
                                  </p>
                                )}
                              </div>
                            </div>
                            {selectedCompanyId === company.id && (
                              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 ml-2">
                                <Check className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>

                          <div className="space-y-2">
                            {company.email && (
                              <p
                                className="text-sm text-muted-foreground truncate"
                                title={company.email}
                              >
                                📧 {company.email}
                              </p>
                            )}
                            {company.phone && (
                              <p className="text-sm text-muted-foreground">
                                📞 {company.phone}
                              </p>
                            )}
                            <div className="flex items-center justify-between pt-2 border-t">
                              <span className="text-xs text-muted-foreground">
                                {company.role === 'ADMIN' && 'Administrador'}
                                {company.role === 'MANAGER' && 'Gerente'}
                                {company.role === 'OPERATOR' && 'Operador'}
                                {company.role === 'VIEWER' && 'Visualizador'}
                              </span>
                              {isSelecting &&
                                selectedCompanyId === company.id && (
                                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Botão para criar nova empresa */}
                  <div className="flex justify-center pt-4 border-t">
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      variant="outline"
                      className="w-full max-w-md"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Nova Empresa
                    </Button>
                  </div>
                </>
              )}

              {/* Formulário de criação de nova empresa */}
              {showCreateForm && (
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">
                    Criar Nova Empresa
                  </h3>
                  <form
                    onSubmit={handleSubmit(handleCreateCompany)}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Nome da Empresa{' '}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ex: Minha Empresa Ltda"
                        {...register('name')}
                        disabled={isCreating}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                      <Input
                        id="cnpj"
                        placeholder="00.000.000/0000-00"
                        {...register('cnpj')}
                        disabled={isCreating}
                      />
                      {errors.cnpj && (
                        <p className="text-sm text-destructive">
                          {errors.cnpj.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail (opcional)</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contato@empresa.com"
                        {...register('email')}
                        disabled={isCreating}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone (opcional)</Label>
                      <Input
                        id="phone"
                        placeholder="(00) 00000-0000"
                        {...register('phone')}
                        disabled={isCreating}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Endereço (opcional)</Label>
                      <Input
                        id="address"
                        placeholder="Rua, Número - Cidade, Estado"
                        {...register('address')}
                        disabled={isCreating}
                      />
                      {errors.address && (
                        <p className="text-sm text-destructive">
                          {errors.address.message}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowCreateForm(false);
                          reset();
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
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
