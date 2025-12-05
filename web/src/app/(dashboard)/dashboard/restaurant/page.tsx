/**
 * Página do Sistema de Restaurante/Pizzaria
 * 
 * Mapa visual de mesas, comanda digital, tela da cozinha e gestão completa
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useExtensions } from '@/contexts/ExtensionsContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  UtensilsCrossed,
  Circle,
  Square,
  RectangleHorizontal,
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChefHat,
  Menu as MenuIcon,
  User,
  Calendar,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderDialog } from '@/components/restaurant/OrderDialog';
import { KitchenDisplay } from '@/components/restaurant/KitchenDisplay';
import { MenuManagement } from '@/components/restaurant/MenuManagement';
import { WaiterManagement } from '@/components/restaurant/WaiterManagement';
import { ReservationManagement } from '@/components/restaurant/ReservationManagement';

interface Table {
  id: number;
  number: string;
  name?: string;
  capacity: number;
  shape: 'ROUND' | 'SQUARE' | 'RECTANGLE';
  positionX?: number;
  positionY?: number;
  status: 'FREE' | 'WAITING' | 'OCCUPIED' | 'RESERVED' | 'PAYMENT';
  orders?: any[];
}

export default function RestaurantPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, companyId } = useAuth();
  const { hasExtension } = useExtensions();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [tableForm, setTableForm] = useState({
    number: '',
    name: '',
    capacity: 4,
    shape: 'ROUND' as 'ROUND' | 'SQUARE' | 'RECTANGLE',
  });

  const hasRestaurantExtension = hasExtension('restaurant_system');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && companyId) {
      if (!hasRestaurantExtension) {
        setIsLoading(false);
        return;
      }
      fetchTables();
    } else if (isAuthenticated && !companyId) {
      router.push('/workspace');
    }
  }, [isAuthenticated, companyId, hasRestaurantExtension, router]);

  const fetchTables = async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get(`/companies/${companyId}/restaurant/tables`);
      setTables(response.data?.data || []);
    } catch (err: any) {
      console.error('Erro ao buscar mesas:', err);
      setError('Erro ao carregar mesas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!companyId) {
      setError('Empresa não selecionada');
      return;
    }

    if (!tableForm.number.trim()) {
      setError('O número da mesa é obrigatório');
      return;
    }

    try {
      setIsCreatingTable(true);
      setError(null);

      const response = await api.post(`/companies/${companyId}/restaurant/tables`, {
        number: tableForm.number.trim(),
        name: tableForm.name.trim() || undefined,
        capacity: Number(tableForm.capacity),
        shape: tableForm.shape,
      });

      if (response.data.success) {
        setShowTableDialog(false);
        setTableForm({
          number: '',
          name: '',
          capacity: 4,
          shape: 'ROUND',
        });
        await fetchTables();
      }
    } catch (err: any) {
      console.error('Erro ao criar mesa:', err);
      setError(
        err.response?.data?.message ||
        'Erro ao criar mesa. Verifique se o número já não existe.'
      );
    } finally {
      setIsCreatingTable(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'FREE':
        return 'bg-green-500';
      case 'WAITING':
        return 'bg-yellow-500';
      case 'OCCUPIED':
        return 'bg-blue-500';
      case 'RESERVED':
        return 'bg-gray-500';
      case 'PAYMENT':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'FREE':
        return 'Livre';
      case 'WAITING':
        return 'Aguardando';
      case 'OCCUPIED':
        return 'Ocupada';
      case 'RESERVED':
        return 'Reservada';
      case 'PAYMENT':
        return 'Pagamento';
      default:
        return status;
    }
  };

  const getShapeIcon = (shape: string) => {
    switch (shape) {
      case 'ROUND':
        return Circle;
      case 'SQUARE':
        return Square;
      case 'RECTANGLE':
        return RectangleHorizontal;
      default:
        return Square;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasRestaurantExtension) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Extensão não ativada
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ative a extensão "Sistema de Restaurante e Pizzaria" para usar
              esta funcionalidade.
            </p>
            <Button onClick={() => router.push('/dashboard/extensions')}>
              Ir para Extensões
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Sistema de Restaurante</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie mesas, comandas, cardápio e cozinha
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tabs principais */}
      <Tabs defaultValue="tables" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tables">
            <Square className="h-4 w-4 mr-2" />
            Mesas
          </TabsTrigger>
          <TabsTrigger value="menu">
            <MenuIcon className="h-4 w-4 mr-2" />
            Cardápio
          </TabsTrigger>
          <TabsTrigger value="kitchen">
            <ChefHat className="h-4 w-4 mr-2" />
            Cozinha
          </TabsTrigger>
          <TabsTrigger value="waiters">
            <User className="h-4 w-4 mr-2" />
            Garçons
          </TabsTrigger>
          <TabsTrigger value="reservations">
            <Calendar className="h-4 w-4 mr-2" />
            Reservas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Mesas */}
        <TabsContent value="tables" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Mapa de Mesas</h2>
            <Button onClick={() => setShowTableDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Mesa
            </Button>
          </div>

          {/* Grid de Mesas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {tables.map((table) => {
              const ShapeIcon = getShapeIcon(table.shape);
              return (
                <Card
                  key={table.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-lg',
                    table.status === 'OCCUPIED' && 'border-blue-500',
                    table.status === 'RESERVED' && 'border-gray-500',
                    table.status === 'PAYMENT' && 'border-red-500',
                  )}
                  onClick={() => {
                    console.log('[RestaurantPage] Mesa clicada:', table);
                    setSelectedTable(table);
                    setShowOrderDialog(true);
                    console.log('[RestaurantPage] showOrderDialog definido como true');
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        getStatusColor(table.status)
                      )} />
                      <span className="text-xs text-muted-foreground">
                        {getStatusLabel(table.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-center mb-2">
                      <ShapeIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Mesa {table.number}</p>
                      {table.name && (
                        <p className="text-xs text-muted-foreground">{table.name}</p>
                      )}
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {table.capacity}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab: Cardápio */}
        <TabsContent value="menu">
          {companyId && <MenuManagement companyId={companyId} />}
        </TabsContent>

        {/* Tab: Cozinha */}
        <TabsContent value="kitchen">
          {companyId && <KitchenDisplay companyId={companyId} />}
        </TabsContent>

        {/* Tab: Garçons */}
        <TabsContent value="waiters">
          {companyId && <WaiterManagement companyId={companyId} />}
        </TabsContent>

        {/* Tab: Reservas */}
        <TabsContent value="reservations">
          {companyId && <ReservationManagement companyId={companyId} />}
        </TabsContent>
      </Tabs>

      {/* Dialog: Nova Mesa */}
      <Dialog 
        open={showTableDialog} 
        onOpenChange={(open) => {
          setShowTableDialog(open);
          if (!open) {
            setTableForm({
              number: '',
              name: '',
              capacity: 4,
              shape: 'ROUND',
            });
            setError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Mesa</DialogTitle>
            <DialogDescription>
              Adicione uma nova mesa ao restaurante
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTable} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="number">Número da Mesa *</Label>
              <Input
                id="number"
                placeholder="Ex: 1, A1, VIP-1"
                value={tableForm.number}
                onChange={(e) =>
                  setTableForm({ ...tableForm, number: e.target.value })
                }
                required
                disabled={isCreatingTable}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome (Opcional)</Label>
              <Input
                id="name"
                placeholder="Ex: Mesa VIP"
                value={tableForm.name}
                onChange={(e) =>
                  setTableForm({ ...tableForm, name: e.target.value })
                }
                disabled={isCreatingTable}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidade *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={tableForm.capacity}
                  onChange={(e) =>
                    setTableForm({
                      ...tableForm,
                      capacity: parseInt(e.target.value) || 4,
                    })
                  }
                  required
                  disabled={isCreatingTable}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shape">Formato *</Label>
                <Select
                  value={tableForm.shape}
                  onValueChange={(value: 'ROUND' | 'SQUARE' | 'RECTANGLE') =>
                    setTableForm({ ...tableForm, shape: value })
                  }
                  disabled={isCreatingTable}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROUND">Redonda</SelectItem>
                    <SelectItem value="SQUARE">Quadrada</SelectItem>
                    <SelectItem value="RECTANGLE">Retangular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTableDialog(false)}
                disabled={isCreatingTable}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isCreatingTable}>
                {isCreatingTable ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Mesa'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Comanda */}
      {companyId && (
        <OrderDialog
          open={showOrderDialog}
          onOpenChange={setShowOrderDialog}
          table={selectedTable}
          companyId={companyId.toString()}
          onOrderUpdated={fetchTables}
        />
      )}
    </div>
  );
}

