/**
 * Página de Assinatura
 *
 * Gerencia assinatura padrão e cobrança por seeds (uso) de cada empresa.
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  AlertCircle,
  Check,
  Building2,
  CreditCard,
  Sparkles,
  TrendingUp,
  Zap,
  Package,
  DollarSign,
  Info,
  X,
  AlertTriangle,
  PowerOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';

interface Company {
  id: number;
  name: string;
  logoUrl?: string | null;
  seedsCount?: number; // Quantidade de seeds cadastradas
  seedsUsed?: number; // Seeds em uso
  seedsCost?: number; // Custo total das seeds em uso desta empresa
}

const BASE_SUBSCRIPTION_PRICE = 149.99; // Assinatura padrão

export default function SubscriptionPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoErrors, setLogoErrors] = useState<Set<number>>(new Set());
  const [showCancelExtensionDialog, setShowCancelExtensionDialog] = useState<{
    companyId: number;
    companyName: string;
    extensionId: number;
    extensionName: string;
  } | null>(null);
  const [showCancelSubscriptionDialog, setShowCancelSubscriptionDialog] =
    useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [companyExtensionsMap, setCompanyExtensionsMap] = useState<
    Record<number, any[]>
  >({});

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

      const companiesRes = await api.get('/companies').catch((err) => {
          console.error('Erro ao buscar empresas:', err);
          return { data: { data: [] } };
      });

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
          seedsCount: company.seedsCount || 0,
          seedsUsed: company.seedsUsed || 0,
          seedsCost: company.seedsCost || 0, // Custo já calculado pelo backend
        }));

      setCompanies(normalizedCompanies);

      // Buscar extensões de cada empresa
      if (normalizedCompanies.length > 0) {
        const companyExtensionsResponses = await Promise.all(
          normalizedCompanies.map((company) =>
            api
              .get(`/companies/${company.id}/extensions`)
              .catch((err) => {
              console.error(
                `Erro ao buscar extensões da empresa ${company.id}:`,
                err,
              );
              return { data: { data: [] } };
            }),
          ),
        );

        const newMap: Record<number, any[]> = {};
        normalizedCompanies.forEach((company, index) => {
          const res = companyExtensionsResponses[index];
          const list = res.data?.data || res.data || [];
          newMap[company.id] = list.filter((ce: any) => ce.isActive);
        });

        setCompanyExtensionsMap(newMap);
      } else {
        setCompanyExtensionsMap({});
      }
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao carregar informações. Tente novamente.');
      setCompanies([]);
      setCompanyExtensionsMap({});
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCompanyCost = (company: Company): number => {
    // Usa o custo já calculado pelo backend
    return company.seedsCost || 0;
  };

  const calculateTotalCost = (): number => {
    const companiesCost = companies.reduce(
      (total, company) => total + calculateCompanyCost(company),
      0,
    );
    return BASE_SUBSCRIPTION_PRICE + companiesCost;
  };

  const totalSeedsUsed = companies.reduce(
    (total, company) => total + (company.seedsUsed || 0),
    0,
  );

  const totalSeedsCount = companies.reduce(
    (total, company) => total + (company.seedsCount || 0),
    0,
  );

  const handleCancelExtension = async () => {
    if (!showCancelExtensionDialog) return;

    try {
      setIsCancelling(true);
      setError(null);

      await api.delete(
        `/companies/${showCancelExtensionDialog.companyId}/extensions/${showCancelExtensionDialog.extensionId}`,
      );

      setSuccess('Extensão cancelada com sucesso!');
      setShowCancelExtensionDialog(null);
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erro ao cancelar extensão:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao cancelar extensão. Tente novamente.',
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsCancelling(true);
      setError(null);

      // Cancela todas as extensões de todas as empresas
      const cancelPromises = companies.flatMap((company) => {
        const companyExtensions = companyExtensionsMap[company.id] || [];
    return companyExtensions
      .filter((ce) => ce.isActive)
          .map((ce) =>
            api.delete(`/companies/${company.id}/extensions/${ce.extension.id}`),
          );
      });

      await Promise.all(cancelPromises);

      setSuccess('Assinatura cancelada com sucesso!');
      setShowCancelSubscriptionDialog(false);
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erro ao cancelar assinatura:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao cancelar assinatura. Tente novamente.',
    );
    } finally {
      setIsCancelling(false);
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
              Assinatura
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1.5">
              Gerencie sua assinatura e acompanhe o uso de seeds por empresa
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full pt-20 lg:pt-0 bg-background" style={{ minHeight: '100vh' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-4 sm:pt-10 sm:pb-6">
          {/* Mobile: Título e Descrição */}
          <div className="lg:hidden mb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Assinatura
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie sua assinatura e acompanhe o uso de seeds por empresa
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

          <div className="space-y-6">
            {/* Card de Assinatura Padrão */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center border-2 border-primary/30 flex-shrink-0">
                      <CreditCard className="h-7 w-7 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xl sm:text-2xl">Assinatura Padrão</CardTitle>
                      <CardDescription className="text-sm sm:text-base mt-1">
                        Plano base mensal
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary whitespace-nowrap">
                        R$ {BASE_SUBSCRIPTION_PRICE.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-muted-foreground text-sm sm:text-base whitespace-nowrap">/mês</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Acesso completo à plataforma</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Suporte técnico incluído</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary" />
                      <span>Atualizações automáticas</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setShowCancelSubscriptionDialog(true)}
                    >
                      <PowerOff className="h-4 w-4 mr-2" />
                      Cancelar Assinatura Completa
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumo Geral */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total de Seeds
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <span className="text-3xl font-bold">{totalSeedsCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Seeds cadastradas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Seeds em Uso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    <span className="text-3xl font-bold">{totalSeedsUsed}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Seeds ativas
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Custo Total Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="text-3xl font-bold text-primary">
                      R${' '}
                      {calculateTotalCost()
                        .toFixed(2)
                        .replace('.', ',')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assinatura + Seeds
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Informação sobre Seeds */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Como funciona:</strong> Você paga R$ {BASE_SUBSCRIPTION_PRICE.toFixed(2).replace('.', ',')} pela assinatura padrão e valores adicionais baseados no custo real das seeds em uso em cada empresa. O valor é calculado mensalmente com base no uso e custos reais.
              </AlertDescription>
            </Alert>

            {/* Lista de Empresas */}
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
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Uso por Empresa</h2>
                  <span className="text-sm text-muted-foreground">
                    {companies.length}{' '}
                    {companies.length === 1 ? 'empresa' : 'empresas'}
                  </span>
                </div>

              {companies.map((company) => {
                  const companyCost = calculateCompanyCost(company);
                const logoError = logoErrors.has(company.id);
                  const usagePercentage =
                    company.seedsCount && company.seedsCount > 0
                      ? ((company.seedsUsed || 0) / company.seedsCount) * 100
                      : 0;

                return (
                  <Card
                    key={company.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          {company.logoUrl && !logoError ? (
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
                                setLogoErrors((prev) =>
                                  new Set(prev).add(company.id),
                                );
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center border-2 border-border flex-shrink-0">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg sm:text-xl truncate">
                              {company.name}
                            </CardTitle>
                            <CardDescription className="mt-1 text-xs sm:text-sm">
                                {company.seedsUsed || 0} de{' '}
                                {company.seedsCount || 0} seeds em uso
                            </CardDescription>
                          </div>
                        </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl sm:text-2xl font-bold text-primary whitespace-nowrap">
                                R${' '}
                                {companyCost.toFixed(2).replace('.', ',')}
                              </span>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                /mês
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Custo das seeds em uso
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {/* Barra de Progresso */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs sm:text-sm">
                              <span className="text-muted-foreground">
                                Uso de Seeds
                              </span>
                              <span className="font-semibold">
                                {usagePercentage.toFixed(0)}%
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Detalhes */}
                          <div className="grid gap-3 sm:gap-4 grid-cols-2 pt-4 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5">
                                Seeds Cadastradas
                              </p>
                              <p className="text-base sm:text-lg font-semibold">
                                {company.seedsCount || 0}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1.5">
                                Seeds em Uso
                              </p>
                              <p className="text-base sm:text-lg font-semibold text-primary">
                                {company.seedsUsed || 0}
                              </p>
                            </div>
                          </div>

                          {/* Extensões Ativas */}
                          {companyExtensionsMap[company.id] &&
                            companyExtensionsMap[company.id].length > 0 && (
                              <div className="pt-4 border-t space-y-2">
                                <p className="text-xs font-semibold text-muted-foreground mb-2">
                                  Extensões Ativas
                                </p>
                                {companyExtensionsMap[company.id].map(
                                  (companyExtension: any) => (
                                    <div
                                  key={companyExtension.id}
                                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                >
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">
                                          {companyExtension.extension?.displayName ||
                                            companyExtension.extension?.name ||
                                            'Extensão'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                        {new Intl.NumberFormat('pt-BR', {
                                          style: 'currency',
                                          currency: 'BRL',
                                        }).format(
                                          Number(
                                              companyExtension.extension?.price ||
                                              0,
                                          ),
                                        )}
                                        /mês
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                      size="sm"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                      onClick={() =>
                                          setShowCancelExtensionDialog({
                                            companyId: company.id,
                                            companyName: company.name,
                                            extensionId:
                                          companyExtension.extension.id,
                                            extensionName:
                                              companyExtension.extension
                                                ?.displayName ||
                                              companyExtension.extension?.name ||
                                              'Extensão',
                                          })
                                        }
                                      >
                                        <X className="h-4 w-4 mr-1" />
                                        Cancelar
                                    </Button>
                            </div>
                                  ),
                                )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </main>

      {/* Dialog de Cancelar Extensão */}
      <Dialog
        open={!!showCancelExtensionDialog}
        onOpenChange={(open) => !open && setShowCancelExtensionDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cancelar Extensão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar a extensão{' '}
              <strong>
                {showCancelExtensionDialog?.extensionName}
              </strong>{' '}
              da empresa{' '}
              <strong>{showCancelExtensionDialog?.companyName}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita. A extensão será desativada
              imediatamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelExtensionDialog(null)}
              disabled={isCancelling}
            >
              Não, manter ativa
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelExtension}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Sim, cancelar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Cancelar Assinatura Completa */}
      <Dialog
        open={showCancelSubscriptionDialog}
        onOpenChange={setShowCancelSubscriptionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Cancelar Assinatura Completa
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar todas as extensões de todas as
              empresas?
              <br />
              <br />
              Esta ação irá:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Desativar todas as extensões ativas</li>
                <li>Manter apenas a assinatura padrão (R${' '}
                  {BASE_SUBSCRIPTION_PRICE.toFixed(2).replace('.', ',')}/mês)
                </li>
              </ul>
              <br />
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelSubscriptionDialog(false)}
              disabled={isCancelling}
            >
              Não, manter ativas
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Sim, cancelar tudo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
