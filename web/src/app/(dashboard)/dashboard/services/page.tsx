/**
 * Página de Catálogo de Serviços
 *
 * Lista e gerencia os serviços disponíveis para prestação.
 * Dados vindos de: GET /api/companies/{companyId}/products (filtrado por categoria de serviços)
 */

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useExtensions } from '@/contexts/ExtensionsContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Edit,
  Briefcase,
  MoreVertical,
  Trash2,
  Eye,
  Info,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface Service {
  id: number;
  name: string;
  description?: string | null;
  unitPrice?: number | null;
  isActive: boolean;
  createdAt: string;
  category?: {
    id: number;
    name: string;
  } | null;
}

export default function ServicesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { hasExtension } = useExtensions();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  
  const hasServicesExtension = hasExtension('services_management');

  // Filtros
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  const companyId = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('companyId');
  }, []);

  // Removida lógica de categoria - serviços agora usam isService=true

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!companyId) {
        setError('Empresa não selecionada.');
        setIsLoading(false);
        return;
      }

      // Busca apenas serviços (isService = true)
      const params: any = {
        page: String(pagination.page || 1),
        limit: String(pagination.limit || 50),
        isService: 'true', // Serviços: isService = true
      };

      if (search && search.trim()) {
        params.search = search.trim();
      }

      if (statusFilter !== 'all') {
        params.isActive = statusFilter === 'active' ? 'true' : 'false';
      }

      const response = await api.get(`/companies/${companyId}/products`, {
        params,
      });

      const data = response.data?.data || response.data || {};
      const productsData = data.products || [];

      // Mapeia serviços (isService = true)
      const servicesData = productsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
        isActive: p.isActive,
        createdAt: p.createdAt,
        category: p.category,
      }));

      setServices(servicesData);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || servicesData.length || 0,
        totalPages: data.pagination?.totalPages || 1,
      }));
    } catch (err: any) {
      console.error('Erro ao buscar serviços:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao carregar serviços. Tente novamente.',
      );
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, pagination.page, pagination.limit, search, statusFilter]);

  useEffect(() => {
    if (isAuthenticated && companyId) {
      fetchServices();
    }
  }, [isAuthenticated, companyId, fetchServices]);

  const handleDelete = async (serviceId: number) => {
    if (!companyId) return;
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    try {
      await api.delete(`/companies/${companyId}/products/${serviceId}`);
      fetchServices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao excluir serviço');
    }
  };

  const handleToggleStatus = async (service: Service) => {
    if (!companyId) return;

    try {
      await api.put(`/companies/${companyId}/products/${service.id}`, {
        isActive: !service.isActive,
      });
      fetchServices();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao atualizar serviço');
    }
  };

  // Colunas da tabela
  const columns: ColumnDef<Service>[] = [
    {
      accessorKey: 'name',
      header: 'Nome do Serviço',
      cell: ({ row }) => {
        const service = row.original;
        return (
          <div>
            <div className="font-medium">{service.name}</div>
            {service.description && (
              <div className="text-sm text-muted-foreground truncate max-w-md">
                {service.description}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'unitPrice',
      header: 'Preço',
      cell: ({ row }) => {
        const price = row.getValue('unitPrice') as number | null;
        return (
          <span className="font-semibold">
            {price
              ? new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(price)
              : '-'}
          </span>
        );
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean;
        return (
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={
              isActive
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
            }
          >
            {isActive ? 'Ativo' : 'Inativo'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const service = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setSelectedService(service);
                  setDetailsDialog(true);
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/services/${service.id}/edit`)
                }
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleToggleStatus(service)}
              >
                {service.isActive ? (
                  <>
                    <Info className="mr-2 h-4 w-4" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Info className="mr-2 h-4 w-4" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(service.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: services,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Verifica se a extensão de serviços está ativa
  if (!hasServicesExtension) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Extensão Necessária
            </CardTitle>
            <CardDescription>
              Para usar o gerenciamento de serviços, você precisa ativar a extensão "Gerenciamento de Serviços".
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                A extensão "Gerenciamento de Serviços" permite cadastrar, editar e gerenciar serviços prestados, além de registrar prestações de serviços nas movimentações.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/dashboard/extensions')}>
                <Briefcase className="mr-2 h-4 w-4" />
                Ir para Extensões
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && services.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Carregando serviços...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de Serviços</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie os serviços disponíveis para prestação
          </p>
        </div>
        <Link href="/dashboard/services/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Serviço
          </Button>
        </Link>
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
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-48 space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
              >
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Serviços Cadastrados</CardTitle>
          <CardDescription>
            {pagination.total > 0
              ? `Mostrando ${
                  (pagination.page - 1) * pagination.limit + 1
                }-${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total,
                )} de ${pagination.total} serviços`
              : 'Nenhum serviço encontrado'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum serviço encontrado.
              </p>
              <Link href="/dashboard/services/new">
                <Button>Cadastrar primeiro serviço</Button>
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

      {/* Dialog de Detalhes */}
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Serviço</DialogTitle>
            <DialogDescription>
              Informações completas sobre o serviço
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <p className="text-sm">{selectedService.name}</p>
              </div>
              {selectedService.description && (
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <p className="text-sm">{selectedService.description}</p>
                </div>
              )}
              {selectedService.unitPrice && (
                <div>
                  <label className="text-sm font-medium">Preço</label>
                  <p className="text-sm font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(Number(selectedService.unitPrice))}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Status</label>
                <p className="text-sm">
                  <Badge
                    variant={selectedService.isActive ? 'default' : 'secondary'}
                  >
                    {selectedService.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Data de Cadastro</label>
                <p className="text-sm">
                  {format(new Date(selectedService.createdAt), 'dd/MM/yyyy', {
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
