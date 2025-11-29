/**
 * Componente de Gestão de Garçons
 * 
 * CRUD completo de garçons e relatórios de desempenho
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  User,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

interface Waiter {
  id: number;
  name: string;
  code?: string | null;
  phone?: string | null;
  email?: string | null;
  isActive: boolean;
  orders?: Array<{
    id: number;
    total: number;
    createdAt: string;
  }>;
}

interface WaiterStats {
  waiterId: number;
  waiterName: string;
  totalOrders: number;
  totalRevenue: number;
  averageTicket: number;
  ordersToday: number;
  revenueToday: number;
}

interface WaiterManagementProps {
  companyId: string;
}

const waiterSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  code: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});

type WaiterFormData = z.infer<typeof waiterSchema>;

export function WaiterManagement({ companyId }: WaiterManagementProps) {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [stats, setStats] = useState<WaiterStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWaiterDialog, setShowWaiterDialog] = useState(false);
  const [editingWaiter, setEditingWaiter] = useState<Waiter | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<'today' | 'week' | 'month'>('today');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WaiterFormData>({
    resolver: zodResolver(waiterSchema),
  });

  useEffect(() => {
    if (companyId) {
      fetchWaiters();
      fetchStats();
    }
  }, [companyId, statsPeriod]);

  const fetchWaiters = async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get(
        `/companies/${companyId}/restaurant/waiters`,
      );
      setWaiters(response.data?.data || []);
    } catch (err: any) {
      console.error('Erro ao buscar garçons:', err);
      setError('Erro ao carregar garçons');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!companyId) return;

    try {
      setIsLoadingStats(true);

      // Calcula período
      const now = new Date();
      let startDate: Date;
      
      if (statsPeriod === 'today') {
        startDate = new Date(now.setHours(0, 0, 0, 0));
      } else if (statsPeriod === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7));
      } else {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
      }

      // Busca pedidos do período
      const ordersResponse = await api.get(
        `/companies/${companyId}/restaurant/orders`,
        {
          params: {
            startDate: startDate.toISOString(),
            status: 'CLOSED',
          },
        },
      );

      const orders = ordersResponse.data?.data || [];
      
      // Calcula estatísticas por garçom
      const statsMap = new Map<number, WaiterStats>();

      waiters.forEach((waiter) => {
        statsMap.set(waiter.id, {
          waiterId: waiter.id,
          waiterName: waiter.name,
          totalOrders: 0,
          totalRevenue: 0,
          averageTicket: 0,
          ordersToday: 0,
          revenueToday: 0,
        });
      });

      orders.forEach((order: any) => {
        if (!order.waiterId) return;

        const stat = statsMap.get(order.waiterId);
        if (!stat) return;

        const orderDate = new Date(order.createdAt);
        const isToday = orderDate.toDateString() === new Date().toDateString();

        stat.totalOrders++;
        stat.totalRevenue += Number(order.total);

        if (isToday) {
          stat.ordersToday++;
          stat.revenueToday += Number(order.total);
        }
      });

      // Calcula ticket médio
      statsMap.forEach((stat) => {
        stat.averageTicket =
          stat.totalOrders > 0 ? stat.totalRevenue / stat.totalOrders : 0;
      });

      setStats(Array.from(statsMap.values()));
    } catch (err: any) {
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (waiters.length > 0) {
      fetchStats();
    }
  }, [statsPeriod, waiters.length]);

  const handleCreateWaiter = async (data: WaiterFormData) => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.post(`/companies/${companyId}/restaurant/waiters`, data);
      await fetchWaiters();
      setShowWaiterDialog(false);
      reset();
      setEditingWaiter(null);
    } catch (err: any) {
      console.error('Erro ao criar garçom:', err);
      setError(err.response?.data?.message || 'Erro ao criar garçom');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateWaiter = async (data: WaiterFormData) => {
    if (!companyId || !editingWaiter) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.put(
        `/companies/${companyId}/restaurant/waiters/${editingWaiter.id}`,
        data,
      );
      await fetchWaiters();
      setShowWaiterDialog(false);
      reset();
      setEditingWaiter(null);
    } catch (err: any) {
      console.error('Erro ao atualizar garçom:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar garçom');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWaiter = async (waiterId: number) => {
    if (!companyId) return;
    if (!confirm('Tem certeza que deseja remover este garçom?')) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.delete(
        `/companies/${companyId}/restaurant/waiters/${waiterId}`,
      );
      await fetchWaiters();
    } catch (err: any) {
      console.error('Erro ao remover garçom:', err);
      setError(err.response?.data?.message || 'Erro ao remover garçom');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (waiter: Waiter) => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.put(
        `/companies/${companyId}/restaurant/waiters/${waiter.id}`,
        { isActive: !waiter.isActive },
      );
      await fetchWaiters();
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditWaiter = (waiter: Waiter) => {
    setEditingWaiter(waiter);
    reset({
      name: waiter.name,
      code: waiter.code || '',
      phone: waiter.phone || '',
      email: waiter.email || '',
    });
    setShowWaiterDialog(true);
  };

  const getWaiterStats = (waiterId: number): WaiterStats | undefined => {
    return stats.find((s) => s.waiterId === waiterId);
  };

  if (isLoading && waiters.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6" />
            Gestão de Garçons
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie garçons e visualize desempenho
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="waiters" className="space-y-4">
        <TabsList>
          <TabsTrigger value="waiters">
            <User className="h-4 w-4 mr-2" />
            Garçons
          </TabsTrigger>
          <TabsTrigger value="stats">
            <TrendingUp className="h-4 w-4 mr-2" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        {/* Tab: Garçons */}
        <TabsContent value="waiters" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setEditingWaiter(null);
                reset();
                setShowWaiterDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Garçom
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {waiters.map((waiter) => {
              const waiterStats = getWaiterStats(waiter.id);
              return (
                <Card key={waiter.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{waiter.name}</CardTitle>
                        {waiter.code && (
                          <p className="text-sm text-muted-foreground">
                            Código: {waiter.code}
                          </p>
                        )}
                      </div>
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full',
                          waiter.isActive
                            ? 'bg-green-500'
                            : 'bg-gray-400',
                        )}
                        title={waiter.isActive ? 'Ativo' : 'Inativo'}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {waiter.phone && (
                        <p className="text-sm text-muted-foreground">
                          📞 {waiter.phone}
                        </p>
                      )}
                      {waiter.email && (
                        <p className="text-sm text-muted-foreground">
                          ✉️ {waiter.email}
                        </p>
                      )}

                      {waiterStats && (
                        <div className="mt-4 pt-4 border-t space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">
                            Estatísticas ({statsPeriod === 'today' ? 'Hoje' : statsPeriod === 'week' ? 'Semana' : 'Mês'})
                          </p>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Pedidos:</span>
                            <span className="font-medium">
                              {waiterStats.totalOrders}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Receita:</span>
                            <span className="font-medium">
                              {formatCurrency(waiterStats.totalRevenue)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Ticket Médio:</span>
                            <span className="font-medium">
                              {formatCurrency(waiterStats.averageTicket)}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleEditWaiter(waiter)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(waiter)}
                          disabled={isLoading}
                        >
                          {waiter.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteWaiter(waiter.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab: Relatórios */}
        <TabsContent value="stats" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Desempenho dos Garçons</h3>
            <Select value={statsPeriod} onValueChange={(value: any) => setStatsPeriod(value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoadingStats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : stats.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhuma estatística disponível para o período selecionado
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Ranking */}
              <Card>
                <CardHeader>
                  <CardTitle>Ranking de Vendas</CardTitle>
                  <CardDescription>
                    Ordenado por receita total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats
                      .sort((a, b) => b.totalRevenue - a.totalRevenue)
                      .map((stat, index) => (
                        <div
                          key={stat.waiterId}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-white',
                                index === 0 && 'bg-yellow-500',
                                index === 1 && 'bg-gray-400',
                                index === 2 && 'bg-orange-600',
                                index > 2 && 'bg-muted',
                              )}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold">{stat.waiterName}</p>
                              <p className="text-sm text-muted-foreground">
                                {stat.totalOrders} pedidos
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">
                              {formatCurrency(stat.totalRevenue)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Ticket médio: {formatCurrency(stat.averageTicket)}
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                        <p className="text-2xl font-bold">
                          {stats.reduce((sum, s) => sum + s.totalOrders, 0)}
                        </p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Receita Total</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(
                            stats.reduce((sum, s) => sum + s.totalRevenue, 0),
                          )}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Ticket Médio Geral</p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(
                            stats.length > 0
                              ? stats.reduce((sum, s) => sum + s.totalRevenue, 0) /
                                  stats.reduce((sum, s) => sum + s.totalOrders, 0)
                              : 0,
                          )}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Garçom */}
      <Dialog open={showWaiterDialog} onOpenChange={setShowWaiterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingWaiter ? 'Editar Garçom' : 'Novo Garçom'}
            </DialogTitle>
            <DialogDescription>
              {editingWaiter
                ? 'Atualize as informações do garçom'
                : 'Adicione um novo garçom ao sistema'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(
              editingWaiter ? handleUpdateWaiter : handleCreateWaiter,
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="waiter-name">Nome *</Label>
              <Input
                id="waiter-name"
                {...register('name')}
                className={cn(errors.name && 'border-destructive')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="waiter-code">Código</Label>
              <Input
                id="waiter-code"
                {...register('code')}
                placeholder="Ex: G01 (gerado automaticamente se vazio)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waiter-phone">Telefone</Label>
              <Input
                id="waiter-phone"
                type="tel"
                {...register('phone')}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="waiter-email">Email</Label>
              <Input
                id="waiter-email"
                type="email"
                {...register('email')}
                placeholder="garcom@email.com"
                className={cn(errors.email && 'border-destructive')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowWaiterDialog(false);
                  reset();
                  setEditingWaiter(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {editingWaiter ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

