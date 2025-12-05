/**
 * Página de Assinatura e Extensões
 *
 * Permite gerenciar assinatura e comprar extensões para a empresa.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import {
  Loader2,
  AlertCircle,
  Check,
  X,
  Package,
  CreditCard,
  Sparkles,
  Building2,
  Calendar,
  Zap,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Extension {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
  price: number;
  features?: string;
  isActive: boolean;
}

interface CompanyExtension {
  id: number;
  isActive: boolean;
  purchasedAt: string;
  expiresAt?: string | null;
  extension: Extension;
}

interface Company {
  id: number;
  name: string;
  logoUrl?: string | null;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyExtensionsMap, setCompanyExtensionsMap] = useState<
    Record<number, CompanyExtension[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedCompanyId, setExpandedCompanyId] = useState<number | null>(
    null,
  );
  const [logoErrors, setLogoErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [companiesRes, extensionsRes] = await Promise.all([
        api.get('/companies').catch((err) => {
          console.error('Erro ao buscar empresas:', err);
          return { data: { data: [] } };
        }),
        api.get('/extensions').catch((err) => {
          console.error('Erro ao buscar extensões:', err);
          return { data: { data: [] } };
        }),
      ]);

      let companiesData: any[] =
        companiesRes.data?.data?.companies ||
        companiesRes.data?.companies ||
        companiesRes.data?.data ||
        companiesRes.data ||
        [];

      if (!Array.isArray(companiesData)) {
        companiesData = [];
      }

      const normalizedCompanies: Company[] = companiesData
        .filter((company: any) => company && company.id && company.name)
        .map((company: any) => ({
          id: Number(company.id),
          name: String(company.name).trim(),
          logoUrl: company.logoUrl || null,
        }));

      setCompanies(normalizedCompanies);
      setExtensions(extensionsRes.data?.data || extensionsRes.data || []);

      if (normalizedCompanies.length > 0) {
        const companyExtensionsResponses = await Promise.all(
          normalizedCompanies.map((company) =>
            api.get(`/companies/${company.id}/extensions`).catch((err) => {
              console.error(
                `Erro ao buscar extensões da empresa ${company.id}:`,
                err,
              );
              return { data: { data: [] } };
            }),
          ),
        );

        const newMap: Record<number, CompanyExtension[]> = {};
        normalizedCompanies.forEach((company, index) => {
          const res = companyExtensionsResponses[index];
          const list =
            (res.data?.data as CompanyExtension[]) ||
            (res.data as CompanyExtension[]) ||
            [];
          newMap[company.id] = list;
        });

        setCompanyExtensionsMap(newMap);
      } else {
        setCompanyExtensionsMap({});
      }
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao carregar extensões. Tente novamente.');
      setCompanies([]);
      setExtensions([]);
      setCompanyExtensionsMap({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExtension = async (
    companyId: number,
    extensionId: number,
  ) => {
    try {
      setIsActivating(extensionId);
      setError(null);

      const companyExtensions = companyExtensionsMap[companyId] || [];
      const companyExtension = companyExtensions.find(
        (ce) => ce.extension.id === extensionId,
      );

      if (companyExtension && companyExtension.isActive) {
        // Desativar
        await api.delete(`/companies/${companyId}/extensions/${extensionId}`);
        setSuccess('Extensão desativada com sucesso!');
      } else {
        // Ativar/Comprar
        await api.post(`/companies/${companyId}/extensions`, {
          extensionId,
        });
        setSuccess('Extensão ativada com sucesso!');
      }

      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erro ao alterar extensão:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao alterar extensão. Tente novamente.',
      );
    } finally {
      setIsActivating(null);
    }
  };

  const isExtensionActive = (
    companyId: number,
    extensionId: number,
  ): boolean => {
    const companyExtensions = companyExtensionsMap[companyId] || [];
    const companyExtension = companyExtensions.find(
      (ce) => ce.extension.id === extensionId,
    );
    return companyExtension?.isActive || false;
  };

  const calculateTotalCost = (companyId: number): number => {
    const companyExtensions = companyExtensionsMap[companyId] || [];
    return companyExtensions
      .filter((ce) => ce.isActive)
      .reduce((total, ce) => total + Number(ce.extension.price || 0), 0);
  };

  const getActiveExtensions = (companyId: number): CompanyExtension[] => {
    const companyExtensions = companyExtensionsMap[companyId] || [];
    return companyExtensions.filter((ce) => ce.isActive);
  };

  const toggleCompanyExpansion = (companyId: number) => {
    setExpandedCompanyId(
      expandedCompanyId === companyId ? null : companyId,
    );
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
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Assinatura e Extensões
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1.5">
              Gerencie extensões e recursos da sua empresa
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4 sm:pt-10 sm:pb-6">
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

          {/* Lista de Empresas com Extensões */}
          {companies.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Nenhuma empresa encontrada
                </h3>
                <p className="text-muted-foreground mb-6">
                  Crie uma empresa na área de trabalho para começar
                </p>
                <Link href="/workspace">
                  <Button className="gap-2" size="lg">
                    <Building2 className="h-4 w-4" />
                    Ir para Área de Trabalho
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {companies.map((company) => {
                const activeExtensions = getActiveExtensions(company.id);
                const totalCost = calculateTotalCost(company.id);
                const isExpanded = expandedCompanyId === company.id;
                const logoError = logoErrors.has(company.id);

                return (
                  <Card
                    key={company.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          {company.logoUrl && !logoError ? (
                            <img
                              src={`${
                                process.env.NEXT_PUBLIC_API_URL?.replace(
                                  '/api',
                                  '',
                                ) || 'http://localhost:3001'
                              }${company.logoUrl}`}
                              alt={`Logo ${company.name}`}
                              className="h-12 w-12 rounded-lg object-cover border-2 border-border"
                              onError={() => {
                                setLogoErrors((prev) =>
                                  new Set(prev).add(company.id),
                                );
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center border-2 border-border">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1">
                            <CardTitle className="text-xl">
                              {company.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {activeExtensions.length}{' '}
                              {activeExtensions.length === 1
                                ? 'extensão ativa'
                                : 'extensões ativas'}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                              <DollarSign className="h-5 w-5" />
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(totalCost)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              /mês
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleCompanyExpansion(company.id)}
                            title={isExpanded ? 'Recolher' : 'Ver detalhes'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0">
                        <div className="border-t pt-6 space-y-4">
                          {activeExtensions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p>Nenhuma extensão ativa</p>
                            </div>
                          ) : (
                            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                              {activeExtensions.map((companyExtension) => (
                                <Card
                                  key={companyExtension.id}
                                  className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                      <CardTitle className="text-base">
                                        {companyExtension.extension.displayName ||
                                          companyExtension.extension.name}
                                      </CardTitle>
                                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    </div>
                                    <CardDescription className="text-xs">
                                      {companyExtension.extension.description ||
                                        'Sem descrição'}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between pt-2 border-t">
                                      <span className="text-sm font-semibold">
                                        {new Intl.NumberFormat('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL',
                                        }).format(
                                          Number(
                                            companyExtension.extension.price ||
                                              0,
                                          ),
                                        )}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        /mês
                                      </span>
                                    </div>
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        <span>
                                          Ativada em:{' '}
                                          {new Date(
                                            companyExtension.purchasedAt,
                                          ).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                          })}
                                        </span>
                                      </div>
                                      {companyExtension.expiresAt && (
                                        <div className="flex items-center gap-2">
                                          <Zap className="h-3 w-3" />
                                          <span>
                                            Expira em:{' '}
                                            {new Date(
                                              companyExtension.expiresAt,
                                            ).toLocaleDateString('pt-BR', {
                                              day: '2-digit',
                                              month: 'short',
                                              year: 'numeric',
                                            })}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full"
                                      onClick={() =>
                                        handleToggleExtension(
                                          company.id,
                                          companyExtension.extension.id,
                                        )
                                      }
                                      disabled={
                                        isActivating ===
                                        companyExtension.extension.id
                                      }
                                    >
                                      {isActivating ===
                                      companyExtension.extension.id ? (
                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                      ) : (
                                        <X className="h-3 w-3 mr-2" />
                                      )}
                                      Desativar
                                    </Button>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}

                          {/* Extensões Disponíveis para esta empresa */}
                          {extensions.length > 0 && (
                            <div className="pt-6 border-t">
                              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Extensões Disponíveis
                              </h3>
                              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {extensions.map((extension) => {
                                  const isActive = isExtensionActive(
                                    company.id,
                                    extension.id,
                                  );
                                  return (
                                    <Card
                                      key={extension.id}
                                      className={cn(
                                        'transition-all',
                                        isActive &&
                                          'border-primary ring-2 ring-primary/20 bg-primary/5',
                                      )}
                                    >
                                      <CardHeader className="pb-3">
                                        <CardTitle className="text-sm">
                                          {extension.displayName ||
                                            extension.name}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                          {extension.description ||
                                            'Sem descrição'}
                                        </CardDescription>
                                      </CardHeader>
                                      <CardContent className="space-y-3">
                                        <div className="flex items-baseline justify-between pt-2 border-t">
                                          <span className="text-xl font-bold">
                                            {new Intl.NumberFormat('pt-BR', {
                                              style: 'currency',
                                              currency: 'BRL',
                                            }).format(Number(extension.price))}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            /mês
                                          </span>
                                        </div>
                                        <Button
                                          className="w-full"
                                          size="sm"
                                          variant={
                                            isActive ? 'outline' : 'default'
                                          }
                                          onClick={() =>
                                            handleToggleExtension(
                                              company.id,
                                              extension.id,
                                            )
                                          }
                                          disabled={
                                            isActivating === extension.id
                                          }
                                        >
                                          {isActivating === extension.id ? (
                                            <>
                                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                              Processando...
                                            </>
                                          ) : isActive ? (
                                            <>
                                              <Check className="h-3 w-3 mr-2" />
                                              Ativa
                                            </>
                                          ) : (
                                            <>
                                              <CreditCard className="h-3 w-3 mr-2" />
                                              Ativar
                                            </>
                                          )}
                                        </Button>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
