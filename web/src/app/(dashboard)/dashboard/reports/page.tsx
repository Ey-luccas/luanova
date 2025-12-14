/**
 * Página de Relatórios
 *
 * Exibe relatórios detalhados com filtros de período e opção de download.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  BarChart3,
  Download,
  Calendar,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Briefcase,
  Activity,
  Users,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportData {
  period: {
    startDate: string;
    endDate: string;
    type: 'day' | 'week' | 'month' | 'year';
  };
  sales: {
    total: number;
    totalValue: number;
    byType: {
      products: number;
      services: number;
    };
    averageTicket: number;
  };
  products: {
    totalSold: number;
    totalValue: number;
    lowStock: number;
    topSelling: Array<{
      id: number;
      name: string;
      quantity: number;
      value: number;
    }>;
  };
  services: {
    totalPerformed: number;
    totalValue: number;
    topServices: Array<{
      id: number;
      name: string;
      quantity: number;
      value: number;
    }>;
  };
  movements: {
    total: number;
    entries: number;
    exits: number;
    byDay: Array<{
      date: string;
      entries: number;
      exits: number;
    }>;
  };
  returns: {
    total: number;
    returns: number;
    refunds: number;
    exchanges: number;
    totalValue: number;
  };
  customers: {
    total: number;
    newCustomers: number;
    topCustomers: Array<{
      name: string;
      totalPurchases: number;
      totalValue: number;
    }>;
  };
  stock: {
    currentValue: number;
    totalProducts: number;
    lowStockProducts: number;
    outOfStock: number;
  };
}

export default function ReportsPage() {
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [periodType, setPeriodType] = useState<
    'day' | 'week' | 'month' | 'year'
  >('month');
  const [customDate, setCustomDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd'),
  );
  const [reportData, setReportData] = useState<ReportData | null>(null);

  const getPeriodDates = useCallback(
    (type: 'day' | 'week' | 'month' | 'year', date?: string) => {
      const baseDate = date ? parseISO(date) : new Date();
      let start: Date;
      let end: Date;

      switch (type) {
        case 'day':
          start = startOfDay(baseDate);
          end = endOfDay(baseDate);
          break;
        case 'week':
          start = startOfWeek(baseDate, { locale: ptBR });
          end = endOfWeek(baseDate, { locale: ptBR });
          break;
        case 'month':
          start = startOfMonth(baseDate);
          end = endOfMonth(baseDate);
          break;
        case 'year':
          start = startOfYear(baseDate);
          end = endOfYear(baseDate);
          break;
      }

      return {
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd'),
      };
    },
    [],
  );

  const fetchReportData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError(null);

      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        setError('Empresa não selecionada.');
        return;
      }

      const dates = getPeriodDates(periodType, customDate);

      const response = await api.get(`/companies/${companyId}/reports`, {
        params: {
          startDate: dates.start,
          endDate: dates.end,
          periodType,
        },
      });

      const data = response.data?.data || response.data;
      setReportData(data);
    } catch (err: any) {
      console.error('Erro ao buscar relatórios:', err);
      setError(err.response?.data?.message || 'Erro ao carregar relatórios.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, periodType, customDate, getPeriodDates]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchReportData();
    }
  }, [isAuthenticated, fetchReportData]);

  const handleDownload = async (
    type:
      | 'full'
      | 'sales'
      | 'products'
      | 'services'
      | 'movements'
      | 'returns'
      | 'customers'
      | 'stock',
  ) => {
    if (!reportData) return;

    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) return;

      const dates = getPeriodDates(periodType, customDate);

      const response = await api.get(
        `/companies/${companyId}/reports/download`,
        {
          params: {
            startDate: dates.start,
            endDate: dates.end,
            periodType,
            reportType: type,
          },
          responseType: 'blob',
        },
      );

      // Criar link para download do PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const periodLabel =
        periodType === 'day'
          ? 'dia'
          : periodType === 'week'
          ? 'semana'
          : periodType === 'month'
          ? 'mes'
          : 'ano';
      const dateLabel = format(parseISO(customDate), 'yyyy-MM-dd');

      link.setAttribute(
        'download',
        `relatorio-${type}-${periodLabel}-${dateLabel}.pdf`,
      );
      document.body.appendChild(link);
      link.click();

      // Limpar após download
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err: any) {
      console.error('Erro ao baixar relatório:', err);
      setError('Erro ao baixar relatório.');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Relatórios</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
          Visualize relatórios e análises detalhadas do seu estoque
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <CardTitle className="text-lg sm:text-xl md:text-2xl">Filtros de Período</CardTitle>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Selecione o período para visualizar os relatórios
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodType" className="text-xs sm:text-sm">Tipo de Período</Label>
              <Select
                value={periodType}
                onValueChange={(value: 'day' | 'week' | 'month' | 'year') => {
                  setPeriodType(value);
                }}
              >
                <SelectTrigger id="periodType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Dia</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customDate" className="text-xs sm:text-sm">Data de Referência</Label>
              <Input
                id="customDate"
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={fetchReportData}
                disabled={isLoading}
                className="w-full text-xs sm:text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Gerar Relatório
                  </>
                )}
              </Button>
            </div>
          </div>
          {reportData && (
            <div className="mt-4 p-3 bg-muted rounded-md">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Período: {formatDate(reportData.period.startDate)} até{' '}
                {formatDate(reportData.period.endDate)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading && !reportData && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      )}

      {reportData && (
        <>
          {/* Botão de Download Completo */}
          <div className="flex justify-end">
            <Button onClick={() => handleDownload('full')} size="lg" className="text-xs sm:text-sm w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              <span className="whitespace-nowrap">Baixar Relatório Completo</span>
            </Button>
          </div>

          {/* Card de Vendas */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">Vendas</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload('sales')}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total de Vendas
                  </p>
                  <p className="text-xl sm:text-2xl font-bold">{reportData.sales.total}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {formatCurrency(reportData.sales.totalValue)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {formatCurrency(reportData.sales.averageTicket)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Produtos vs Serviços
                  </p>
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                    <span className="text-sm sm:text-lg font-semibold">
                      {reportData.sales.byType.products} produtos
                    </span>
                    <span className="text-sm sm:text-lg font-semibold">
                      {reportData.sales.byType.services} serviços
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Produtos */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">Produtos</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload('products')}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Vendido</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {reportData.products.totalSold}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {formatCurrency(reportData.products.totalValue)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Estoque Baixo</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">
                    {reportData.products.lowStock}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Mais Vendidos</p>
                  <p className="text-xs sm:text-sm font-semibold">
                    {reportData.products.topSelling.length} produtos
                  </p>
                </div>
              </div>
              {reportData.products.topSelling.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">
                    Top 5 Produtos Mais Vendidos
                  </h4>
                  <div className="space-y-2">
                    {reportData.products.topSelling
                      .slice(0, 5)
                      .map((product) => (
                        <div
                          key={product.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-2 bg-muted rounded-md"
                        >
                          <span className="font-medium text-xs sm:text-sm truncate">{product.name}</span>
                          <div className="flex gap-2 sm:gap-4">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              Qtd: {product.quantity}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold">
                              {formatCurrency(product.value)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Serviços */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">Serviços</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload('services')}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total Prestado
                  </p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {reportData.services.totalPerformed}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {formatCurrency(reportData.services.totalValue)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Top Serviços</p>
                  <p className="text-xs sm:text-sm font-semibold">
                    {reportData.services.topServices.length} serviços
                  </p>
                </div>
              </div>
              {reportData.services.topServices.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">
                    Top 5 Serviços Mais Prestados
                  </h4>
                  <div className="space-y-2">
                    {reportData.services.topServices
                      .slice(0, 5)
                      .map((service) => (
                        <div
                          key={service.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-2 bg-muted rounded-md"
                        >
                          <span className="font-medium text-xs sm:text-sm truncate">{service.name}</span>
                          <div className="flex gap-2 sm:gap-4">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              Qtd: {service.quantity}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold">
                              {formatCurrency(service.value)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Movimentações */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">Movimentações</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload('movements')}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total de Movimentações
                  </p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {reportData.movements.total}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Entradas</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {reportData.movements.entries}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Saídas</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    {reportData.movements.exits}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Devoluções/Reembolsos/Trocas */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <CardTitle className="text-base sm:text-lg md:text-2xl">Devoluções/Reembolsos/Trocas</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload('returns')}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Total</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {reportData.returns.total}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Devoluções</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {reportData.returns.returns}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Reembolsos</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {reportData.returns.refunds}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Trocas</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {reportData.returns.exchanges}
                  </p>
                </div>
                <div className="space-y-1 sm:col-span-2 md:col-span-1 lg:col-span-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    {formatCurrency(reportData.returns.totalValue)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card de Clientes */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">Clientes</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload('customers')}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total de Clientes
                  </p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {reportData.customers.total}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Novos Clientes
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {reportData.customers.newCustomers}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Top Clientes</p>
                  <p className="text-xs sm:text-sm font-semibold">
                    {reportData.customers.topCustomers.length} clientes
                  </p>
                </div>
              </div>
              {reportData.customers.topCustomers.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Top 5 Clientes</h4>
                  <div className="space-y-2">
                    {reportData.customers.topCustomers
                      .slice(0, 5)
                      .map((customer, index) => (
                        <div
                          key={index}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 p-2 bg-muted rounded-md"
                        >
                          <span className="font-medium text-xs sm:text-sm truncate">{customer.name}</span>
                          <div className="flex gap-2 sm:gap-4">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {customer.totalPurchases} compras
                            </span>
                            <span className="text-xs sm:text-sm font-semibold">
                              {formatCurrency(customer.totalValue)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card de Estoque */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <CardTitle className="text-lg sm:text-xl md:text-2xl">Estoque</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload('stock')}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Valor do Estoque
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {formatCurrency(reportData.stock.currentValue)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total de Produtos
                  </p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {reportData.stock.totalProducts}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Estoque Baixo</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-600">
                    {reportData.stock.lowStockProducts}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Sem Estoque</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    {reportData.stock.outOfStock}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
