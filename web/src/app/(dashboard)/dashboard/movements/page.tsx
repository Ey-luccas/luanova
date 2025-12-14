/**
 * Página de Listagem de Movimentações
 *
 * Lista movimentações de produtos (vendas) e serviços (prestações), devoluções e reembolsos com filtros.
 * Dados vindos de: GET /api/companies/{companyId}/sales
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useExtensions } from '@/contexts/ExtensionsContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Plus,
  Loader2,
  AlertCircle,
  ShoppingCart,
  RotateCcw,
  CreditCard,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Sale {
  id: number;
  type: 'SALE' | 'SERVICE' | 'RETURN' | 'REFUND';
  quantity: number;
  customerName: string;
  customerCpf?: string | null;
  customerEmail?: string | null;
  paymentMethod?: 'PIX' | 'CARTAO' | 'BOLETO' | 'ESPECIE' | null;
  returnAction?: 'RESTOCK' | 'MAINTENANCE' | null;
  observations?: string | null;
  createdAt: string;
  product: {
    id: number;
    name: string;
    barcode?: string | null;
  };
}

export default function MovementsPage() {
  const { isAuthenticated } = useAuth();
  const { hasExtension } = useExtensions();
  const hasProductsExtension = hasExtension('products_management');
  const hasServicesExtension = hasExtension('services_management');
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [type, setType] = useState<string>('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchSales = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        setError('Empresa não selecionada.');
        setIsLoading(false);
        return;
      }

      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (type) {
        params.type = type;
      }

      const response = await api.get(`/companies/${companyId}/sales`, {
        params,
      });

      const data = response.data?.data || response.data || {};
      const salesData = data.sales || data || [];
      setSales(Array.isArray(salesData) ? salesData : []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || salesData.length || 0,
        totalPages: data.pagination?.totalPages || 1,
      }));
    } catch (err: any) {
      console.error('Erro ao buscar movimentações:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao carregar movimentações. Tente novamente.',
      );
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, type]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSales();
    }
  }, [isAuthenticated, fetchSales]);

  const handleFilterChange = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  // Função auxiliar para obter label e cor do tipo
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'SALE':
        return {
          label: 'Venda',
          className:
            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
          icon: ShoppingCart,
        };
      case 'SERVICE':
        return {
          label: 'Prestação',
          className:
            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
          icon: ShoppingCart,
        };
      case 'RETURN':
        return {
          label: 'Devolução',
          className:
            'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
          icon: RotateCcw,
        };
      case 'REFUND':
        return {
          label: 'Reembolso',
          className:
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
          icon: RotateCcw,
        };
      default:
        return {
          label: type,
          className:
            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
          icon: ShoppingCart,
        };
    }
  };

  // Função auxiliar para obter label da forma de pagamento
  const getPaymentMethodLabel = (method: string | null | undefined) => {
    switch (method) {
      case 'PIX':
        return 'PIX';
      case 'CARTAO':
        return 'Cartão';
      case 'BOLETO':
        return 'Boleto';
      case 'ESPECIE':
        return 'Espécie';
      default:
        return '-';
    }
  };

  // Colunas da tabela
  const columns: ColumnDef<Sale>[] = [
    {
      accessorKey: 'createdAt',
      header: () => <span className="text-xs sm:text-sm">Data/Hora</span>,
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return (
          <div className="min-w-[90px]">
            <div className="font-medium text-xs sm:text-sm">
              {format(date, 'dd/MM/yyyy', { locale: ptBR })}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(date, 'HH:mm', { locale: ptBR })}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: () => <span className="text-xs sm:text-sm">Tipo</span>,
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        const typeInfo = getTypeInfo(type);
        const Icon = typeInfo.icon;
        return (
          <span
            className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium whitespace-nowrap ${typeInfo.className}`}
          >
            <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            {typeInfo.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'product',
      header: () => (
        <span className="text-xs sm:text-sm">
          {hasProductsExtension && hasServicesExtension
            ? 'Produto/Serviço'
            : hasProductsExtension
            ? 'Produto'
            : 'Serviço'}
        </span>
      ),
      cell: ({ row }) => {
        const product = row.original.product;
        return (
          <div className="min-w-[120px] max-w-[200px] sm:max-w-none">
            <div className="font-medium text-xs sm:text-sm truncate">{product.name}</div>
            {product.barcode && (
              <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                <code>{product.barcode}</code>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'customerName',
      header: () => <span className="text-xs sm:text-sm">Cliente</span>,
      cell: ({ row }) => {
        const sale = row.original;
        return (
          <div className="min-w-[100px] max-w-[150px] sm:max-w-none">
            <div className="font-medium text-xs sm:text-sm truncate">{sale.customerName}</div>
            {sale.customerCpf && (
              <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                CPF: {sale.customerCpf}
              </div>
            )}
            {sale.customerEmail && (
              <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {sale.customerEmail}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'quantity',
      header: () => <span className="text-xs sm:text-sm">Quantidade</span>,
      cell: ({ row }) => {
        const quantity = row.getValue('quantity') as number;
        return <span className="font-semibold text-xs sm:text-sm">{quantity}</span>;
      },
    },
    {
      accessorKey: 'paymentMethod',
      header: () => <span className="text-xs sm:text-sm">Pagamento</span>,
      cell: ({ row }) => {
        const paymentMethod = row.getValue('paymentMethod') as string | null;
        const sale = row.original;
        if (sale.type === 'RETURN' || sale.type === 'REFUND') {
        return (
          <div className="min-w-[80px]">
            <div className="text-xs sm:text-sm font-medium">
              {sale.returnAction === 'RESTOCK'
                ? 'Voltar ao Estoque'
                : 'Manutenção'}
            </div>
          </div>
        );
        }
        return (
          <span className="text-xs sm:text-sm min-w-[60px] inline-block">
            {getPaymentMethodLabel(paymentMethod)}
          </span>
        );
      },
    },
    {
      accessorKey: 'observations',
      header: () => <span className="text-xs sm:text-sm">Observações</span>,
      cell: ({ row }) => {
        const observations = row.getValue('observations') as string | null;
        return (
          <span className="text-xs sm:text-sm text-muted-foreground max-w-[150px] sm:max-w-none truncate block">
            {observations || '-'}
          </span>
        );
      },
    },
  ];

  const table = useReactTable({
    data: sales,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading && sales.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Carregando movimentações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Movimentações</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Gerencie movimentações de produtos (vendas), serviços (prestações),
            devoluções e reembolsos
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href="/dashboard/movements/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Nova Movimentação
            </Button>
          </Link>
          <Link href="/dashboard/movements/return" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <RotateCcw className="mr-2 h-4 w-4" />
              <span className="whitespace-nowrap">Devolução/ou Reembolso</span>
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl md:text-2xl">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-xs sm:text-sm font-medium">Tipo</label>
              <Select
                value={type || 'all'}
                onValueChange={(value) => {
                  setType(value === 'all' ? '' : value);
                  setTimeout(handleFilterChange, 0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {hasProductsExtension && (
                    <SelectItem value="SALE">Venda</SelectItem>
                  )}
                  {hasServicesExtension && (
                    <SelectItem value="SERVICE">Prestação</SelectItem>
                  )}
                  {hasProductsExtension && (
                    <>
                      <SelectItem value="RETURN">Devolução</SelectItem>
                      <SelectItem value="REFUND">Reembolso</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setType('');
                  handleFilterChange();
                }}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl md:text-2xl">Histórico de Movimentações</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {pagination.total > 0
              ? `Mostrando ${
                  (pagination.page - 1) * pagination.limit + 1
                }-${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total,
                )} de ${pagination.total} movimentações`
              : 'Nenhuma movimentação encontrada'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {sales.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                Nenhuma venda encontrada.
              </p>
              <Link href="/dashboard/movements/new">
                <Button className="text-xs sm:text-sm">Registrar primeira venda</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="px-2 sm:px-4 text-xs sm:text-sm">
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
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="px-2 sm:px-4 py-2 sm:py-4">
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
                        Nenhum resultado encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-2 mt-4 pt-4 border-t">
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                      className="flex-1 sm:flex-initial"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.totalPages, prev.page + 1),
                        }))
                      }
                      disabled={pagination.page >= pagination.totalPages}
                      className="flex-1 sm:flex-initial"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
