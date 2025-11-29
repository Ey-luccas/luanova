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
      header: 'Data/Hora',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return (
          <div>
            <div className="font-medium">
              {format(date, 'dd/MM/yyyy', { locale: ptBR })}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(date, 'HH:mm', { locale: ptBR })}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const type = row.getValue('type') as string;
        const typeInfo = getTypeInfo(type);
        const Icon = typeInfo.icon;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${typeInfo.className}`}
          >
            <Icon className="h-3 w-3" />
            {typeInfo.label}
          </span>
        );
      },
    },
    {
      accessorKey: 'product',
      header:
        hasProductsExtension && hasServicesExtension
          ? 'Produto/Serviço'
          : hasProductsExtension
          ? 'Produto'
          : 'Serviço',
      cell: ({ row }) => {
        const product = row.original.product;
        return (
          <div>
            <div className="font-medium">{product.name}</div>
            {product.barcode && (
              <div className="text-sm text-muted-foreground">
                <code>{product.barcode}</code>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'customerName',
      header: 'Cliente',
      cell: ({ row }) => {
        const sale = row.original;
        return (
          <div>
            <div className="font-medium">{sale.customerName}</div>
            {sale.customerCpf && (
              <div className="text-sm text-muted-foreground">
                CPF: {sale.customerCpf}
              </div>
            )}
            {sale.customerEmail && (
              <div className="text-sm text-muted-foreground">
                {sale.customerEmail}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'quantity',
      header: 'Quantidade',
      cell: ({ row }) => {
        const quantity = row.getValue('quantity') as number;
        return <span className="font-semibold">{quantity}</span>;
      },
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Pagamento',
      cell: ({ row }) => {
        const paymentMethod = row.getValue('paymentMethod') as string | null;
        const sale = row.original;
        if (sale.type === 'RETURN' || sale.type === 'REFUND') {
          return (
            <div>
              <div className="text-sm font-medium">
                {sale.returnAction === 'RESTOCK'
                  ? 'Voltar ao Estoque'
                  : 'Manutenção'}
              </div>
            </div>
          );
        }
        return (
          <span className="text-sm">
            {getPaymentMethodLabel(paymentMethod)}
          </span>
        );
      },
    },
    {
      accessorKey: 'observations',
      header: 'Observações',
      cell: ({ row }) => {
        const observations = row.getValue('observations') as string | null;
        return (
          <span className="text-sm text-muted-foreground">
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Movimentações</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie movimentações de produtos (vendas), serviços (prestações),
            devoluções e reembolsos
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/movements/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Movimentação
            </Button>
          </Link>
          <Link href="/dashboard/movements/return">
            <Button variant="outline">
              <RotateCcw className="mr-2 h-4 w-4" />
              Devolução/ou Reembolso
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
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Tipo</label>
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
              >
                Limpar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
          <CardDescription>
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
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhuma venda encontrada.
              </p>
              <Link href="/dashboard/movements/new">
                <Button>Registrar primeira venda</Button>
              </Link>
            </div>
          ) : (
            <>
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
                      <TableRow key={row.id}>
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
                        Nenhum resultado encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
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
