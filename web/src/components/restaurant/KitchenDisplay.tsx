/**
 * Componente Tela da Cozinha (KDS - Kitchen Display System)
 * 
 * Visualização de pedidos em tempo real, controle de status e tempo
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ChefHat,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface KitchenItem {
  id: number;
  menuItemId: number;
  quantity: number;
  unitPrice: number;
  size?: string | null;
  isHalf?: boolean;
  isThird?: boolean;
  flavors?: string | null;
  addons?: string | null;
  notes?: string | null;
  status: string;
  subtotal: number;
  sentToKitchenAt: string | null;
  startedAt: string | null;
  readyAt: string | null;
  deliveredAt: string | null;
  menuItem: {
    id: number;
    name: string;
    category: {
      id: number;
      name: string;
    };
    preparationTime?: number | null;
  };
  order: {
    id: number;
    table?: {
      id: number;
      number: string;
    } | null;
    waiter?: {
      id: number;
      name: string;
      code?: string;
    } | null;
    createdAt: string;
  };
}

interface KitchenMetrics {
  avgPreparationTime: number;
  statusCounts: {
    PENDING: number;
    PREPARING: number;
    READY: number;
    DELIVERED: number;
  };
  topItems: Array<{
    menuItemId: number;
    count: number;
  }>;
  totalItems: number;
}

interface KitchenDisplayProps {
  companyId: string;
}

export function KitchenDisplay({ companyId }: KitchenDisplayProps) {
  const [items, setItems] = useState<KitchenItem[]>([]);
  const [groupedItems, setGroupedItems] = useState<Record<string, KitchenItem[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [metrics, setMetrics] = useState<KitchenMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchKitchenOrders = useCallback(async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const params: any = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStatus !== 'all') params.status = selectedStatus;

      const response = await api.get(
        `/companies/${companyId}/restaurant/kitchen/orders`,
        { params },
      );

      const data = response.data?.data || {};
      const allItems: KitchenItem[] = [];

      // Coleta todos os itens de todas as categorias
      Object.values(data.groupedByCategory || {}).forEach((categoryItems: any) => {
        allItems.push(...categoryItems);
      });

      setItems(allItems);
      setGroupedItems(data.groupedByCategory || {});

      // Extrai categorias únicas
      const uniqueCategories = Array.from(
        new Set(allItems.map((item) => item.menuItem.category.name)),
      );
      setCategories(uniqueCategories);
    } catch (err: any) {
      console.error('Erro ao buscar pedidos da cozinha:', err);
      setError('Erro ao carregar pedidos da cozinha');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, selectedCategory, selectedStatus]);

  const fetchMetrics = useCallback(async () => {
    if (!companyId) return;

    try {
      const response = await api.get(
        `/companies/${companyId}/restaurant/kitchen/metrics`,
      );
      setMetrics(response.data?.data || null);
    } catch (err: any) {
      console.error('Erro ao buscar métricas:', err);
    }
  }, [companyId]);

  useEffect(() => {
    fetchKitchenOrders();
    fetchMetrics();

    // Auto-refresh a cada 10 segundos
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchKitchenOrders();
        fetchMetrics();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [fetchKitchenOrders, fetchMetrics, autoRefresh]);

  const handleUpdateStatus = async (
    itemId: number,
    newStatus: 'PREPARING' | 'READY' | 'DELIVERED',
  ) => {
    if (!companyId) return;

    try {
      setIsUpdating(itemId);
      setError(null);

      await api.patch(
        `/companies/${companyId}/restaurant/kitchen/items/${itemId}/status`,
        { status: newStatus },
      );

      await fetchKitchenOrders();
      await fetchMetrics();
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar status');
    } finally {
      setIsUpdating(null);
    }
  };

  const getTimeElapsed = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return '';
    }
  };

  const getTimeColor = (sentAt: string | null, startedAt: string | null): string => {
    if (!sentAt) return '';
    const minutes = Math.floor(
      (new Date().getTime() - new Date(sentAt).getTime()) / 60000,
    );

    if (minutes >= 30) return 'text-red-600 dark:text-red-400';
    if (minutes >= 20) return 'text-orange-600 dark:text-orange-400';
    if (minutes >= 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300';
      case 'PREPARING':
        return 'bg-orange-100 dark:bg-orange-900 border-orange-300';
      case 'READY':
        return 'bg-green-100 dark:bg-green-900 border-green-300';
      case 'DELIVERED':
        return 'bg-blue-100 dark:bg-blue-900 border-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'PENDING':
        return 'Pendente';
      case 'PREPARING':
        return 'Em Preparo';
      case 'READY':
        return 'Pronto';
      case 'DELIVERED':
        return 'Entregue';
      default:
        return status;
    }
  };

  const filteredGroupedItems =
    selectedCategory === 'all'
      ? groupedItems
      : Object.fromEntries(
          Object.entries(groupedItems).filter(
            ([category]) => category === selectedCategory,
          ),
        );

  return (
    <div className="space-y-6">
      {/* Header com Filtros e Métricas */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="h-6 w-6" />
            Tela da Cozinha (KDS)
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie pedidos em tempo real
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <>
                <Timer className="h-4 w-4 mr-2" />
                Auto-atualizar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Ativar Auto-atualizar
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Métricas */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Médio</p>
                  <p className="text-2xl font-bold">
                    {metrics.avgPreparationTime.toFixed(1)} min
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Preparo</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {metrics.statusCounts.PREPARING}
                  </p>
                </div>
                <ChefHat className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prontos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {metrics.statusCounts.READY}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Itens</p>
                  <p className="text-2xl font-bold">{metrics.totalItems}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="PREPARING">Em Preparo</SelectItem>
            <SelectItem value="READY">Pronto</SelectItem>
            <SelectItem value="DELIVERED">Entregue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pedidos por Categoria */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : Object.keys(filteredGroupedItems).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum pedido encontrado para os filtros selecionados
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredGroupedItems).map(([category, categoryItems]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryItems.map((item) => (
                    <Card
                      key={item.id}
                      className={cn(
                        'border-2 transition-all',
                        getStatusColor(item.status),
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-lg">
                              {item.menuItem.name}
                            </p>
                            {item.size && (
                              <span className="text-xs px-2 py-0.5 bg-muted rounded">
                                {item.size}
                              </span>
                            )}
                            {item.isHalf && (
                              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded ml-1">
                                Meia
                              </span>
                            )}
                            {item.isThird && (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 rounded ml-1">
                                Terço
                              </span>
                            )}
                          </div>
                          <span
                            className={cn(
                              'text-xs px-2 py-1 rounded font-medium',
                              item.status === 'PENDING' && 'bg-gray-200 dark:bg-gray-700',
                              item.status === 'PREPARING' && 'bg-orange-200 dark:bg-orange-800',
                              item.status === 'READY' && 'bg-green-200 dark:bg-green-800',
                              item.status === 'DELIVERED' && 'bg-blue-200 dark:bg-blue-800',
                            )}
                          >
                            {getStatusLabel(item.status)}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Quantidade:</span>
                            <span className="font-medium">{item.quantity}x</span>
                          </div>

                          {item.order.table && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Mesa:</span>
                              <span className="font-medium">
                                {item.order.table.number}
                              </span>
                            </div>
                          )}

                          {item.order.waiter && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Garçom:</span>
                              <span className="font-medium">
                                {item.order.waiter.name}
                              </span>
                            </div>
                          )}

                          {item.notes && (
                            <div>
                              <span className="text-muted-foreground">Obs:</span>
                              <p className="text-xs mt-1 italic">{item.notes}</p>
                            </div>
                          )}

                          {item.flavors && (
                            <div>
                              <span className="text-muted-foreground">Sabores:</span>
                              <p className="text-xs mt-1">
                                {JSON.parse(item.flavors).join(', ')}
                              </p>
                            </div>
                          )}

                          {item.addons && (
                            <div>
                              <span className="text-muted-foreground">Adicionais:</span>
                              <p className="text-xs mt-1">
                                {JSON.parse(item.addons).join(', ')}
                              </p>
                            </div>
                          )}

                          {item.sentToKitchenAt && (
                            <div className="flex items-center gap-1 mt-2">
                              <Clock
                                className={cn(
                                  'h-3 w-3',
                                  getTimeColor(item.sentToKitchenAt, item.startedAt),
                                )}
                              />
                              <span
                                className={cn(
                                  'text-xs',
                                  getTimeColor(item.sentToKitchenAt, item.startedAt),
                                )}
                              >
                                {getTimeElapsed(item.sentToKitchenAt)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Ações */}
                        <div className="flex gap-2 mt-4">
                          {item.status === 'PENDING' && (
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => handleUpdateStatus(item.id, 'PREPARING')}
                              disabled={isUpdating === item.id}
                            >
                              {isUpdating === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Iniciar
                                </>
                              )}
                            </Button>
                          )}

                          {item.status === 'PREPARING' && (
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleUpdateStatus(item.id, 'READY')}
                              disabled={isUpdating === item.id}
                            >
                              {isUpdating === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Pronto
                                </>
                              )}
                            </Button>
                          )}

                          {item.status === 'READY' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleUpdateStatus(item.id, 'DELIVERED')}
                              disabled={isUpdating === item.id}
                            >
                              {isUpdating === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Entregue
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

