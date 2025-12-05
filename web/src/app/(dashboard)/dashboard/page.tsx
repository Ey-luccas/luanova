/**
 * Página do Dashboard
 *
 * Dashboard principal com KPIs, gráficos e tabelas.
 * Dados vindos de: GET /api/companies/{companyId}/dashboard
 */

'use client';

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useExtensions } from '@/contexts/ExtensionsContext';
import api from '@/lib/api';
import { devLog } from '@/utils/dev-log';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Package,
  TrendingDown,
  DollarSign,
  Activity,
  Loader2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Download,
  Calendar,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos
interface DashboardData {
  totalProducts: number;
  totalServices?: number;
  lowStockProducts: number;
  totalStockValue: number;
  totalSalesValue?: number; // Valor total movimentado em vendas e serviços
  recentMovementsCount: number;
  movementsByDay: Array<{
    date: string;
    entries: number;
    exits: number;
  }>;
  distributionByCategory: Array<{
    category: string;
    count: number;
  }>;
  recentMovements: Array<{
    id: number;
    productName: string;
    type: 'IN' | 'OUT';
    quantity: number;
    createdAt: string;
    responsible?: {
      id: number;
      name: string;
      email: string;
    } | null;
  }>;
}

interface MovementTableData {
  id: number;
  productName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  createdAt: string;
  responsible?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#6b7280'];

interface Product {
  id: number;
  name: string;
  currentStock: number;
  minStock?: number | null;
  unitPrice: number | null;
  category?: {
    id: number;
    name: string;
  } | null;
  isActive: boolean;
  description?: string | null;
}

export default function DashboardPage() {
  const { isAuthenticated } = useAuth();
  const { hasExtension } = useExtensions();
  const hasServicesExtension = hasExtension('services_management');
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref para evitar múltiplas chamadas simultâneas
  const isFetchingRef = useRef(false);
  const isFetchingProductsSummaryRef = useRef(false); // Ref para modal de resumo de produtos
  const isFetchingLowStockRef = useRef(false); // Ref para modal de estoque baixo
  const [movementPeriodFilter, setMovementPeriodFilter] = useState<
    'day' | 'week' | 'month'
  >('week');
  const [productsSummaryDialog, setProductsSummaryDialog] = useState<{
    open: boolean;
    products: Product[];
    isLoading: boolean;
  }>({
    open: false,
    products: [],
    isLoading: false,
  });

  const [lowStockProductsDialog, setLowStockProductsDialog] = useState<{
    open: boolean;
    products: Product[];
    isLoading: boolean;
  }>({
    open: false,
    products: [],
    isLoading: false,
  });

  const [servicesSummaryDialog, setServicesSummaryDialog] = useState<{
    open: boolean;
    services: Product[];
    isLoading: boolean;
  }>({
    open: false,
    services: [],
    isLoading: false,
  });

  const [totalServices, setTotalServices] = useState<number>(0);
  const [totalProducts, setTotalProducts] = useState<number | null>(null); // null = não buscou ainda
  const [servicesPerformedThisMonth, setServicesPerformedThisMonth] =
    useState<number>(0);
  const isFetchingServicesRef = useRef(false);
  const isFetchingProductsRef = useRef(false);
  const isFetchingServicesPerformedRef = useRef(false);
  const isFetchingServicesSummaryRef = useRef(false); // Ref para modal de resumo de serviços

  // Cachear companyId para evitar múltiplas leituras do localStorage
  const companyId = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('companyId');
  }, []);

  // Memoizar fetchDashboardData para evitar recriação desnecessária
  const fetchDashboardData = useCallback(async () => {
    // Prevenir múltiplas chamadas simultâneas
    if (isFetchingRef.current) {
      devLog.log(
        '⏸️ [fetchDashboardData] Já está buscando, ignorando chamada duplicada',
      );
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      if (!companyId) {
        setError('Empresa não selecionada. Por favor, selecione uma empresa.');
        setIsLoading(false);
        isFetchingRef.current = false;
        return;
      }

      const response = await api.get(`/companies/${companyId}/dashboard`);

      // Estrutura esperada: { success: true, data: { ... } }
      const data = response.data.data || response.data;

      // Log apenas em desenvolvimento
      devLog.log('📊 Dados do dashboard recebidos:', data);
      devLog.log('💰 Valor total do estoque (raw):', data.totalStockValue);
      devLog.log(
        '💰 Valor total do estoque (tipo):',
        typeof data.totalStockValue,
      );
      devLog.log(
        '💰 Valor total do estoque (formatado):',
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(data.totalStockValue || 0),
      );

      setDashboardData(data);
    } catch (err: any) {
      // Se o endpoint não existir (404), usar dados mockados sem mostrar erro
      if (err.response?.status === 404) {
        devLog.log(
          'ℹ️ Endpoint de dashboard ainda não implementado, usando dados mockados.',
        );
        setDashboardData(getMockDashboardData());
        setError(null); // Não mostrar erro, pois temos fallback
      } else {
        devLog.error('Erro ao buscar dados do dashboard:', err);
        setError(
          err.response?.data?.message || 'Erro ao carregar dados do dashboard.',
        );
      }
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [companyId]);

  useEffect(() => {
    if (isAuthenticated && companyId) {
      fetchDashboardData();
      if (hasServicesExtension) {
        fetchTotalServices();
        fetchServicesPerformedThisMonth();
      }
      fetchTotalProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, companyId, movementPeriodFilter, hasServicesExtension]);

  // Função para buscar total de serviços
  const fetchTotalServices = useCallback(async () => {
    if (isFetchingServicesRef.current) return;

    try {
      isFetchingServicesRef.current = true;

      if (!companyId) return;

      // Busca apenas serviços ATIVOS (isService = true, isActive = true)
      const productsResponse = await api.get(
        `/companies/${companyId}/products`,
        {
          params: {
            isService: 'true',
            isActive: 'true',
            limit: 1,
          },
        },
      );

      const productsData =
        productsResponse.data?.data || productsResponse.data || {};
      setTotalServices(productsData.pagination?.total || 0);
    } catch (err) {
      console.error('Erro ao buscar total de serviços:', err);
      setTotalServices(0);
    } finally {
      isFetchingServicesRef.current = false;
    }
  }, [companyId]);

  // Função para buscar total de produtos (excluindo serviços)
  const fetchTotalProducts = useCallback(async () => {
    if (isFetchingProductsRef.current) return;

    try {
      isFetchingProductsRef.current = true;

      if (!companyId) return;

      // Busca apenas produtos (isService = false)
      const productsResponse = await api.get(
        `/companies/${companyId}/products`,
        {
          params: {
            isService: 'false',
            limit: 1,
          },
        },
      );

      const productsData =
        productsResponse.data?.data || productsResponse.data || {};
      // Sempre usar dados reais, mesmo se for 0
      setTotalProducts(productsData.pagination?.total ?? 0);
    } catch (err) {
      console.error('Erro ao buscar total de produtos:', err);
      // Em caso de erro, mostrar 0 (dados reais) ao invés de mockados
      setTotalProducts(0);
    } finally {
      isFetchingProductsRef.current = false;
    }
  }, [companyId]);

  // Função para buscar serviços prestados no mês atual
  const fetchServicesPerformedThisMonth = useCallback(async () => {
    if (isFetchingServicesPerformedRef.current) return;

    try {
      isFetchingServicesPerformedRef.current = true;

      if (!companyId) return;

      // Calcular início e fim do mês atual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0); // Início do dia
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999); // Fim do dia

      // Buscar vendas do tipo SERVICE do mês atual
      // Primeiro, buscar com limite baixo para obter o total da paginação
      const response = await api.get(`/companies/${companyId}/sales`, {
        params: {
          type: 'SERVICE',
          startDate: startOfMonth.toISOString(),
          endDate: endOfMonth.toISOString(),
          limit: 1, // Buscar apenas 1 para obter o total
        },
      });

      const salesData = response.data?.data || response.data || {};
      const totalSales = salesData.pagination?.total || 0;

      // Se há vendas, buscar todas para somar as quantidades
      let totalQuantity = 0;
      if (totalSales > 0) {
        const allSalesResponse = await api.get(
          `/companies/${companyId}/sales`,
          {
            params: {
              type: 'SERVICE',
              startDate: startOfMonth.toISOString(),
              endDate: endOfMonth.toISOString(),
              limit: Math.min(totalSales, 1000), // Buscar até 1000 ou o total, o que for menor
            },
          },
        );

        const allSalesData =
          allSalesResponse.data?.data || allSalesResponse.data || {};
        const sales = allSalesData.sales || [];

        // Somar a quantidade de todos os serviços prestados
        totalQuantity = sales.reduce((sum: number, sale: any) => {
          const quantity =
            typeof sale.quantity === 'number'
              ? sale.quantity
              : typeof sale.quantity === 'string'
              ? parseFloat(sale.quantity) || 0
              : parseFloat(String(sale.quantity)) || 0;
          return sum + quantity;
        }, 0);
      }

      setServicesPerformedThisMonth(totalQuantity);
    } catch (err) {
      console.error('Erro ao buscar serviços prestados no mês:', err);
      setServicesPerformedThisMonth(0);
    } finally {
      isFetchingServicesPerformedRef.current = false;
    }
  }, [companyId]);

  // Função memoizada para buscar produtos do resumo
  const handleOpenProductsSummary = useCallback(async () => {
    // Prevenir múltiplas chamadas
    if (isFetchingProductsSummaryRef.current) {
      devLog.log('⏸️ Já está buscando produtos, ignorando clique duplicado');
      return;
    }

    setProductsSummaryDialog({
      open: true,
      products: [],
      isLoading: true,
    });

    // Buscar produtos para o resumo
    try {
      isFetchingProductsSummaryRef.current = true;

      if (!companyId) {
        alert('Empresa não selecionada.');
        setProductsSummaryDialog((prev) => ({ ...prev, isLoading: false }));
        isFetchingProductsSummaryRef.current = false;
        return;
      }

      // Buscar apenas produtos (isService = false)
      const response = await api.get(`/companies/${companyId}/products`, {
        params: {
          page: '1',
          limit: '10',
          isService: 'false',
        },
      });

      const responseData = response.data?.data || response.data || {};
      const productsData = responseData.products || [];

      // Normalizar produtos (serviços já são excluídos pelo backend)
      const normalizedProducts: Product[] = productsData
        .map((product: any) => ({
          id: product.id,
          name: product.name,
          currentStock:
            typeof product.currentStock === 'number'
              ? Math.floor(product.currentStock)
              : typeof product.currentStock === 'string'
              ? parseInt(product.currentStock, 10) || 0
              : 0,
          unitPrice: product.unitPrice
            ? typeof product.unitPrice === 'number'
              ? product.unitPrice
              : parseFloat(String(product.unitPrice))
            : null,
          category: product.category
            ? {
                id: Number(product.category.id),
                name: String(product.category.name || ''),
              }
            : null,
          isActive: product.isActive ?? true,
        }))
        .filter((product: Product) => product.id && product.name);

      setProductsSummaryDialog({
        open: true,
        products: normalizedProducts,
        isLoading: false,
      });
    } catch (err: any) {
      devLog.error('Erro ao buscar produtos:', err);
      setProductsSummaryDialog((prev) => ({ ...prev, isLoading: false }));
    } finally {
      isFetchingProductsSummaryRef.current = false;
    }
  }, [companyId]);

  // Função memoizada para buscar produtos com estoque baixo
  const handleOpenLowStockProducts = useCallback(async () => {
    // Prevenir múltiplas chamadas
    if (isFetchingLowStockRef.current) {
      devLog.log(
        '⏸️ Já está buscando produtos de estoque baixo, ignorando clique duplicado',
      );
      return;
    }

    setLowStockProductsDialog({
      open: true,
      products: [],
      isLoading: true,
    });

    // Buscar produtos com estoque baixo
    try {
      isFetchingLowStockRef.current = true;

      if (!companyId) {
        alert('Empresa não selecionada.');
        setLowStockProductsDialog((prev) => ({ ...prev, isLoading: false }));
        isFetchingLowStockRef.current = false;
        return;
      }

      // Buscar apenas produtos (isService = false) com estoque baixo
      const response = await api.get(`/companies/${companyId}/products`, {
        params: {
          page: '1',
          limit: '100',
          isActive: 'true',
          isService: 'false',
        },
      });

      const responseData = response.data?.data || response.data || {};
      const productsData = responseData.products || [];

      // Normalizar produtos (serviços já são excluídos pelo backend)
      const normalizedProducts: Product[] = productsData
        .map((product: any) => {
          const currentStock =
            typeof product.currentStock === 'number'
              ? Math.floor(product.currentStock)
              : typeof product.currentStock === 'string'
              ? parseInt(product.currentStock, 10) || 0
              : 0;

          const minStock = product.minStock
            ? typeof product.minStock === 'number'
              ? product.minStock
              : parseFloat(String(product.minStock))
            : null;

          const isLowStock =
            minStock !== null ? currentStock < minStock : currentStock <= 0;

          if (!isLowStock) return null;

          return {
            id: product.id,
            name: product.name,
            currentStock,
            minStock,
            unitPrice: product.unitPrice
              ? typeof product.unitPrice === 'number'
                ? product.unitPrice
                : parseFloat(String(product.unitPrice))
              : null,
            category: product.category
              ? {
                  id: Number(product.category.id),
                  name: String(product.category.name || ''),
                }
              : null,
            isActive: product.isActive ?? true,
          };
        })
        .filter(
          (product: Product | null): product is Product => product !== null,
        )
        .slice(0, 10);

      setLowStockProductsDialog({
        open: true,
        products: normalizedProducts,
        isLoading: false,
      });
    } catch (err: any) {
      devLog.error('Erro ao buscar produtos com estoque baixo:', err);
      setLowStockProductsDialog((prev) => ({ ...prev, isLoading: false }));
    } finally {
      isFetchingLowStockRef.current = false;
    }
  }, [companyId]);

  // Função memoizada para navegar para movimentações
  const handleNavigateToMovements = useCallback(() => {
    router.push('/dashboard/movements');
  }, [router]);

  // Função memoizada para buscar serviços do resumo
  const handleOpenServicesSummary = useCallback(async () => {
    // Prevenir múltiplas chamadas
    if (isFetchingServicesSummaryRef.current) {
      devLog.log('⏸️ Já está buscando serviços, ignorando clique duplicado');
      return;
    }

    setServicesSummaryDialog({
      open: true,
      services: [],
      isLoading: true,
    });

    // Buscar serviços para o resumo
    try {
      isFetchingServicesSummaryRef.current = true;

      if (!companyId) {
        alert('Empresa não selecionada.');
        setServicesSummaryDialog((prev) => ({ ...prev, isLoading: false }));
        isFetchingServicesSummaryRef.current = false;
        return;
      }

      // Buscar apenas serviços ATIVOS (isService = true, isActive = true)
      const response = await api.get(`/companies/${companyId}/products`, {
        params: {
          page: '1',
          limit: '10',
          isService: 'true',
          isActive: 'true',
        },
      });

      const responseData = response.data?.data || response.data || {};
      const servicesData = responseData.products || [];

      // Normalizar serviços
      const normalizedServices: Product[] = servicesData
        .map((service: any) => ({
          id: service.id,
          name: service.name,
          description: service.description || null,
          currentStock: 0, // Serviços não têm estoque
          unitPrice: service.unitPrice
            ? typeof service.unitPrice === 'number'
              ? service.unitPrice
              : parseFloat(String(service.unitPrice))
            : null,
          category: null, // Serviços não têm categoria
          isActive: service.isActive ?? true,
        }))
        .filter((service: Product) => service.id && service.name);

      setServicesSummaryDialog({
        open: true,
        services: normalizedServices,
        isLoading: false,
      });
    } catch (err: any) {
      devLog.error('Erro ao buscar serviços:', err);
      setServicesSummaryDialog((prev) => ({ ...prev, isLoading: false }));
    } finally {
      isFetchingServicesSummaryRef.current = false;
    }
  }, [companyId]);

  // Dados mockados caso o endpoint não exista ainda
  const getMockDashboardData = (): DashboardData => ({
    totalProducts: 1247,
    lowStockProducts: 24,
    totalStockValue: 89420,
    totalSalesValue: 15230.5, // Valor total movimentado em vendas e serviços
    recentMovementsCount: 156,
    movementsByDay: [
      { date: 'Seg', entries: 45, exits: 32 },
      { date: 'Ter', entries: 52, exits: 41 },
      { date: 'Qua', entries: 48, exits: 38 },
      { date: 'Qui', entries: 61, exits: 45 },
      { date: 'Sex', entries: 55, exits: 48 },
      { date: 'Sáb', entries: 38, exits: 29 },
      { date: 'Dom', entries: 42, exits: 35 },
    ],
    distributionByCategory: [
      { category: 'Eletrônicos', count: 234 },
      { category: 'Acessórios', count: 567 },
      { category: 'Monitores', count: 145 },
      { category: 'Armazenamento', count: 89 },
      { category: 'Outros', count: 212 },
    ],
    recentMovements: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      productName: `Produto ${i + 1}`,
      type: i % 2 === 0 ? 'IN' : 'OUT',
      quantity: Math.floor(Math.random() * 100) + 1,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      responsible: {
        id: 1,
        name: 'Usuário Admin',
        email: 'admin@example.com',
      },
    })),
  });

  // Colunas da tabela
  const columns: ColumnDef<MovementTableData>[] = [
    {
      accessorKey: 'productName',
      header: 'Produto',
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              type === 'IN'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {type === 'IN' ? 'Entrada' : 'Saída'}
          </span>
        );
      },
    },
    {
      accessorKey: 'quantity',
      header: 'Quantidade',
      cell: ({ row }) => {
        return <span className="font-medium">{row.getValue('quantity')}</span>;
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Data',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
      },
    },
    {
      accessorKey: 'responsible',
      header: 'Responsável',
      cell: ({ row }) => {
        const responsible = row.getValue(
          'responsible',
        ) as MovementTableData['responsible'];
        if (!responsible) {
          return <span className="text-muted-foreground">-</span>;
        }
        return (
          <div className="flex flex-col">
            <span className="font-medium">{responsible.name}</span>
            <span className="text-xs text-muted-foreground">
              {responsible.email}
            </span>
          </div>
        );
      },
    },
  ];

  // Função para filtrar movimentações por período
  const filteredMovements = useMemo(() => {
    if (!dashboardData?.recentMovements) return [];

    const now = new Date();
    let startDate: Date;

    switch (movementPeriodFilter) {
      case 'day':
        // Hoje desde meia-noite
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        // Semana: últimos 7 dias (domingo a sábado ou da semana que a conta foi criada e adiante)
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        // Primeiro dia do mês
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
    }

    return dashboardData.recentMovements.filter((movement) => {
      const movementDate = new Date(movement.createdAt);
      return movementDate >= startDate;
    });
  }, [dashboardData?.recentMovements, movementPeriodFilter]);

  // Função para agrupar movimentações por período (hora/dia/semana)
  const chartData = useMemo(() => {
    if (!filteredMovements.length) return [];

    const grouped: Record<string, { entries: number; exits: number }> = {};

    filteredMovements.forEach((movement) => {
      const date = new Date(movement.createdAt);
      let key: string;

      switch (movementPeriodFilter) {
        case 'day':
          // Agrupar por hora (00:00, 01:00, etc.)
          key = format(date, 'HH:00', { locale: ptBR });
          break;
        case 'week':
          // Agrupar por dia da semana (Dom, Seg, Ter, etc.)
          key = format(date, 'EEE', { locale: ptBR });
          break;
        case 'month':
          // Agrupar por dia do mês (01, 02, 03, etc.)
          key = format(date, 'dd/MM', { locale: ptBR });
          break;
        default:
          key = format(date, 'EEE', { locale: ptBR });
      }

      if (!grouped[key]) {
        grouped[key] = { entries: 0, exits: 0 };
      }

      if (movement.type === 'IN') {
        grouped[key].entries += movement.quantity;
      } else {
        grouped[key].exits += movement.quantity;
      }
    });

    // Converter para array e ordenar
    const result = Object.entries(grouped).map(([date, values]) => ({
      date,
      entries: values.entries,
      exits: values.exits,
    }));

    // Ordenar conforme o período
    if (movementPeriodFilter === 'day') {
      // Ordenar por hora
      result.sort((a, b) => a.date.localeCompare(b.date));
    } else if (movementPeriodFilter === 'week') {
      // Ordenar por dia da semana (domingo primeiro)
      const dayOrder = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      result.sort(
        (a, b) => dayOrder.indexOf(a.date) - dayOrder.indexOf(b.date),
      );
    } else if (movementPeriodFilter === 'month') {
      // Ordenar por data
      result.sort((a, b) => {
        const [dayA, monthA] = a.date.split('/').map(Number);
        const [dayB, monthB] = b.date.split('/').map(Number);
        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
      });
    }

    return result;
  }, [filteredMovements, movementPeriodFilter]);

  // Função para exportar movimentações em CSV
  const exportMovementsToCSV = useCallback(() => {
    const movements = filteredMovements;

    if (movements.length === 0) {
      alert('Nenhuma movimentação para exportar no período selecionado.');
      return;
    }

    // Cabeçalhos CSV
    const headers = [
      'Produto',
      'Tipo',
      'Quantidade',
      'Data/Hora',
      'Responsável',
    ];
    const rows = movements.map((movement: MovementTableData) => [
      movement.productName,
      movement.type === 'IN' ? 'Entrada' : 'Saída',
      String(movement.quantity),
      format(new Date(movement.createdAt), 'dd/MM/yyyy HH:mm', {
        locale: ptBR,
      }),
      movement.responsible?.name || '-',
    ]);

    // Criar conteúdo CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) =>
        row.map((cell: string) => `"${cell}"`).join(','),
      ),
    ].join('\n');

    // Criar BOM para UTF-8 (para Excel reconhecer corretamente)
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    // Nome do arquivo com período
    const periodLabel =
      movementPeriodFilter === 'day'
        ? 'dia'
        : movementPeriodFilter === 'week'
        ? 'semana'
        : 'mes';
    const fileName = `movimentacoes-${periodLabel}-${format(
      new Date(),
      'yyyy-MM-dd',
      { locale: ptBR },
    )}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Limpar URL do objeto para liberar memória
  }, [movementPeriodFilter, filteredMovements]);

  // Função para obter título do período
  const periodTitle = useMemo(() => {
    switch (movementPeriodFilter) {
      case 'day':
        return 'Movimentações - Hoje';
      case 'week':
        return 'Movimentações - Últimos 7 dias';
      case 'month':
        return 'Movimentações - Este mês';
      default:
        return 'Movimentações - Últimos 7 dias';
    }
  }, [movementPeriodFilter]);

  const table = useReactTable({
    data: filteredMovements,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">Visão geral do seu estoque</p>
      </div>

      {/* Cards de KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleOpenProductsSummary}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Produtos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalProducts !== null ? (
                totalProducts
              ) : isFetchingProductsRef.current ? (
                <Loader2 className="h-5 w-5 animate-spin inline" />
              ) : (
                <span>-</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Produtos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleOpenLowStockProducts}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {dashboardData.lowStockProducts}
            </div>
            <p className="text-xs text-muted-foreground">
              Produtos que precisam de reposição de estoque
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Valor em Estoque
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 break-all overflow-visible">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(Number(dashboardData.totalStockValue) || 0)}
            </div>
            <p className="text-xs text-green-600/70 dark:text-green-400/70">
              Valor total do estoque de produtos
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20"
          onClick={handleNavigateToMovements}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Valor Movimentado
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              R${' '}
              {(dashboardData.totalSalesValue || 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
              Vendas e serviços (últimos 7 dias)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Segunda linha de cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {hasServicesExtension && (
          <>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={handleOpenServicesSummary}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total de Serviços
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalServices}</div>
                <p className="text-xs text-muted-foreground">
                  Serviços ativos cadastrados
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Serviços Prestados
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {servicesPerformedThisMonth}
                </div>
                <p className="text-xs text-muted-foreground">
                  Serviços prestados este mês
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Gráfico de Entradas vs Saídas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{periodTitle}</CardTitle>
                <CardDescription>Entradas vs Saídas</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={movementPeriodFilter}
                  onValueChange={(value: 'day' | 'week' | 'month') =>
                    setMovementPeriodFilter(value)
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Hoje</SelectItem>
                    <SelectItem value="week">Semana</SelectItem>
                    <SelectItem value="month">Mês</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportMovementsToCSV}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250} className="min-h-[250px]">
              {movementPeriodFilter === 'month' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="entries" fill="#3b82f6" name="Entradas" />
                  <Bar dataKey="exits" fill="#ef4444" name="Saídas" />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="entries"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Entradas"
                  />
                  <Line
                    type="monotone"
                    dataKey="exits"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Saídas"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>Produtos por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250} className="min-h-[250px]">
              <PieChart>
                <Pie
                  data={dashboardData.distributionByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) =>
                    `${category}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {dashboardData.distributionByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Movimentações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Movimentações Recentes</CardTitle>
          <CardDescription>Últimas 20 movimentações de estoque</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Nenhuma movimentação encontrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de resumo de produtos */}
      <Dialog
        open={productsSummaryDialog.open}
        onOpenChange={(open) =>
          setProductsSummaryDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resumo de Produtos</DialogTitle>
            <DialogDescription>
              Lista resumida dos produtos cadastrados. Total:{' '}
              {totalProducts !== null
                ? totalProducts
                : dashboardData?.totalProducts ?? 0}{' '}
              produtos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {productsSummaryDialog.isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Carregando produtos...
                </span>
              </div>
            ) : productsSummaryDialog.products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum produto encontrado.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">Estoque</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsSummaryDialog.products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <span className="px-2 py-1 rounded bg-primary/10 text-primary text-sm">
                              {product.category.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-medium ${
                              product.currentStock > 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-orange-600 dark:text-orange-400'
                            }`}
                          >
                            {product.currentStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {product.unitPrice
                            ? `R$ ${product.unitPrice.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                  Mostrando {productsSummaryDialog.products.length} de{' '}
                  {totalProducts !== null
                    ? totalProducts
                    : dashboardData?.totalProducts ?? 0}{' '}
                  produtos cadastrados
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setProductsSummaryDialog({
                  ...productsSummaryDialog,
                  open: false,
                })
              }
            >
              Fechar
            </Button>
            <Button asChild>
              <Link
                href="/dashboard/products"
                className="flex items-center gap-2"
              >
                Ver Mais
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de produtos com estoque baixo */}
      <Dialog
        open={lowStockProductsDialog.open}
        onOpenChange={(open) =>
          setLowStockProductsDialog({ ...lowStockProductsDialog, open })
        }
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Produtos com Estoque Baixo</DialogTitle>
            <DialogDescription>
              Lista de produtos que precisam de reposição de estoque. Total:{' '}
              {dashboardData.lowStockProducts} produtos.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {lowStockProductsDialog.isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Carregando produtos com estoque baixo...
                </span>
              </div>
            ) : lowStockProductsDialog.products.length === 0 ? (
              <div className="text-center py-8">
                <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum produto com estoque baixo encontrado.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-right">
                        Estoque Atual
                      </TableHead>
                      <TableHead className="text-right">Mínimo</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockProductsDialog.products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          {product.category ? (
                            <span className="px-2 py-1 rounded bg-primary/10 text-primary text-sm">
                              {product.category.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium text-orange-600 dark:text-orange-400">
                            {product.currentStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-muted-foreground">
                            {product.minStock !== null &&
                            product.minStock !== undefined
                              ? product.minStock
                              : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {product.unitPrice
                            ? `R$ ${product.unitPrice.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                  Mostrando {lowStockProductsDialog.products.length} de{' '}
                  {dashboardData.lowStockProducts} produtos com estoque baixo
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setLowStockProductsDialog({
                  ...lowStockProductsDialog,
                  open: false,
                })
              }
            >
              Fechar
            </Button>
            <Button asChild>
              <Link
                href="/dashboard/products?lowStock=true"
                className="flex items-center gap-2"
              >
                Ver Mais
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de resumo de serviços */}
      <Dialog
        open={servicesSummaryDialog.open}
        onOpenChange={(open) =>
          setServicesSummaryDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Resumo de Serviços</DialogTitle>
            <DialogDescription>
              Lista resumida dos serviços ativos cadastrados. Total:{' '}
              {totalServices} serviços.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {servicesSummaryDialog.isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">
                  Carregando serviços...
                </span>
              </div>
            ) : servicesSummaryDialog.services.length === 0 ? (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Nenhum serviço encontrado.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Preço</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servicesSummaryDialog.services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">
                          {service.name}
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm">
                            {service.description || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {service.unitPrice
                            ? `R$ ${service.unitPrice.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}`
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-sm">
                            Ativo
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                  Mostrando {servicesSummaryDialog.services.length} de{' '}
                  {totalServices} serviços cadastrados
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setServicesSummaryDialog({
                  ...servicesSummaryDialog,
                  open: false,
                })
              }
            >
              Fechar
            </Button>
            <Button asChild>
              <Link
                href="/dashboard/services"
                className="flex items-center gap-2"
              >
                Ver Mais
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
