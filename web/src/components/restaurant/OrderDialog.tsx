/**
 * Componente de Comanda Digital
 * 
 * Gerencia pedidos, itens, modificadores e fechamento de comanda
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus,
  Trash2,
  Send,
  X,
  ShoppingCart,
  Users,
  DollarSign,
  ChefHat,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface Table {
  id: number;
  number: string;
  name?: string;
  capacity: number;
}

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: {
    id: number;
    name: string;
  };
  sizes?: string | null;
  sizesPrices?: string | null;
  allowHalf?: boolean;
  allowThird?: boolean;
  allowCombo?: boolean;
  allowedAddons?: string | null;
}

interface OrderItem {
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
  menuItem: MenuItem;
}

interface Order {
  id: number;
  tableId?: number;
  waiterId?: number;
  orderType: string;
  customerName?: string;
  customerPhone?: string;
  numberOfPeople?: number;
  notes?: string;
  status: string;
  subtotal: number;
  serviceFee: number;
  tip: number;
  total: number;
  items: OrderItem[];
  table?: Table;
  waiter?: {
    id: number;
    name: string;
    code?: string;
  };
}

interface OrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table | null;
  companyId: string;
  onOrderUpdated?: () => void;
}

const addItemSchema = z.object({
  menuItemId: z.string().min(1, 'Item é obrigatório'),
  quantity: z.string().min(1, 'Quantidade é obrigatória'),
  size: z.string().optional(),
  isHalf: z.boolean().optional(),
  isThird: z.boolean().optional(),
  flavors: z.string().optional(),
  addons: z.string().optional(),
  notes: z.string().optional(),
});

type AddItemFormData = z.infer<typeof addItemSchema>;

export function OrderDialog({
  open,
  onOpenChange,
  table,
  companyId,
  onOrderUpdated,
}: OrderDialogProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [waiters, setWaiters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddItemFormData>({
    resolver: zodResolver(addItemSchema),
  });

  const selectedSize = watch('size');
  const isHalf = watch('isHalf');
  const isThird = watch('isThird');

  useEffect(() => {
    if (open && table && companyId) {
      fetchOrder();
      fetchMenuItems();
      fetchWaiters();
    }
  }, [open, table, companyId]);

  const fetchOrder = async () => {
    if (!table || !companyId) return;

    try {
      setIsLoadingOrder(true);
      setError(null);

      // Busca comandas abertas da mesa
      const response = await api.get(
        `/companies/${companyId}/restaurant/orders`,
        {
          params: {
            tableId: table.id,
            status: 'OPEN,SENT_TO_KITCHEN,PREPARING,READY,DELIVERED',
          },
        },
      );

      const orders = response.data?.data || [];
      if (orders.length > 0) {
        // Pega a primeira comanda aberta
        const orderResponse = await api.get(
          `/companies/${companyId}/restaurant/orders/${orders[0].id}`,
        );
        setOrder(orderResponse.data?.data);
      } else {
        setOrder(null);
      }
    } catch (err: any) {
      console.error('Erro ao buscar comanda:', err);
      setError('Erro ao carregar comanda');
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const fetchMenuItems = async () => {
    if (!companyId) return;

    try {
      const response = await api.get(
        `/companies/${companyId}/restaurant/menu/items`,
      );
      setMenuItems(response.data?.data || []);

      // Agrupa por categoria
      const categoriesMap = new Map();
      (response.data?.data || []).forEach((item: MenuItem) => {
        if (!categoriesMap.has(item.category.id)) {
          categoriesMap.set(item.category.id, {
            id: item.category.id,
            name: item.category.name,
            items: [],
          });
        }
        categoriesMap.get(item.category.id).items.push(item);
      });
      setCategories(Array.from(categoriesMap.values()));
    } catch (err: any) {
      console.error('Erro ao buscar cardápio:', err);
    }
  };

  const fetchWaiters = async () => {
    if (!companyId) return;

    try {
      const response = await api.get(
        `/companies/${companyId}/restaurant/waiters`,
      );
      setWaiters(response.data?.data || []);
    } catch (err: any) {
      console.error('Erro ao buscar garçons:', err);
    }
  };

  const handleCreateOrder = async () => {
    if (!table || !companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.post(
        `/companies/${companyId}/restaurant/orders`,
        {
          tableId: table.id,
          orderType: 'DINE_IN',
          numberOfPeople: 1,
        },
      );

      setOrder(response.data?.data);
      onOrderUpdated?.();
    } catch (err: any) {
      console.error('Erro ao criar comanda:', err);
      setError(err.response?.data?.message || 'Erro ao criar comanda');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (data: AddItemFormData) => {
    if (!order || !companyId) return;

    try {
      setIsAddingItem(true);
      setError(null);

      const addonsArray = data.addons ? data.addons.split(',').filter(Boolean) : [];
      const flavorsArray = data.flavors ? data.flavors.split(',').filter(Boolean) : [];

      await api.post(
        `/companies/${companyId}/restaurant/orders/${order.id}/items`,
        {
          menuItemId: parseInt(data.menuItemId, 10),
          quantity: parseFloat(data.quantity),
          size: data.size || undefined,
          isHalf: data.isHalf || false,
          isThird: data.isThird || false,
          flavors: flavorsArray.length > 0 ? flavorsArray : undefined,
          addons: addonsArray.length > 0 ? addonsArray : undefined,
          notes: data.notes || undefined,
        },
      );

      await fetchOrder();
      setShowAddItem(false);
      setSelectedMenuItem(null);
      reset();
    } catch (err: any) {
      console.error('Erro ao adicionar item:', err);
      setError(err.response?.data?.message || 'Erro ao adicionar item');
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    if (!order || !companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.delete(
        `/companies/${companyId}/restaurant/orders/${order.id}/items/${itemId}`,
      );

      await fetchOrder();
    } catch (err: any) {
      console.error('Erro ao remover item:', err);
      setError(err.response?.data?.message || 'Erro ao remover item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToKitchen = async () => {
    if (!order || !companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.post(
        `/companies/${companyId}/restaurant/orders/${order.id}/send-to-kitchen`,
      );

      await fetchOrder();
      onOrderUpdated?.();
    } catch (err: any) {
      console.error('Erro ao enviar para cozinha:', err);
      setError(err.response?.data?.message || 'Erro ao enviar para cozinha');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMenuItem = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setValue('menuItemId', item.id.toString());
    setValue('quantity', '1');
    setShowAddItem(true);
  };

  const getItemPrice = (item: MenuItem, size?: string | null) => {
    if (size && item.sizesPrices) {
      try {
        const prices = JSON.parse(item.sizesPrices);
        return prices[size] || Number(item.price);
      } catch {
        return Number(item.price);
      }
    }
    return Number(item.price);
  };

  const filteredMenuItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter((item) => item.category.id.toString() === selectedCategory);

  const hasPendingItems = order?.items.some(
    (item) => item.status === 'PENDING',
  );

  if (!table) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Mesa {table.number}
            {table.name && <span className="text-muted-foreground">({table.name})</span>}
          </DialogTitle>
          <DialogDescription>
            Gerencie pedidos e itens da comanda
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-y-auto space-y-4">
          {isLoadingOrder ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !order ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhuma comanda aberta para esta mesa
              </p>
              <Button onClick={handleCreateOrder} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Criar Nova Comanda
              </Button>
            </div>
          ) : (
            <>
              {/* Informações da Comanda */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Comanda #{order.id}</CardTitle>
                    <div className="flex items-center gap-2">
                      {order.status === 'OPEN' && (
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                          Aberta
                        </span>
                      )}
                      {order.status === 'SENT_TO_KITCHEN' && (
                        <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
                          Enviada
                        </span>
                      )}
                      {order.status === 'PREPARING' && (
                        <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded flex items-center gap-1">
                          <ChefHat className="h-3 w-3" />
                          Preparando
                        </span>
                      )}
                      {order.status === 'READY' && (
                        <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Pronto
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Garçom:</span>
                      <p className="font-medium">
                        {order.waiter?.name || 'Não atribuído'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pessoas:</span>
                      <p className="font-medium">{order.numberOfPeople || 1}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <p className="font-medium text-lg">
                        {formatCurrency(Number(order.total))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Itens da Comanda */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Itens do Pedido</CardTitle>
                    <Button
                      size="sm"
                      onClick={() => setShowAddItem(true)}
                      disabled={order.status === 'CLOSED'}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {order.items.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum item adicionado ainda
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{item.menuItem.name}</p>
                              {item.size && (
                                <span className="text-xs px-2 py-0.5 bg-muted rounded">
                                  {item.size}
                                </span>
                              )}
                              {item.isHalf && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">
                                  Meia
                                </span>
                              )}
                              {item.isThird && (
                                <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 rounded">
                                  Terço
                                </span>
                              )}
                              <span
                                className={cn(
                                  'text-xs px-2 py-0.5 rounded',
                                  item.status === 'PENDING' &&
                                    'bg-gray-100 dark:bg-gray-800',
                                  item.status === 'PREPARING' &&
                                    'bg-orange-100 dark:bg-orange-900',
                                  item.status === 'READY' &&
                                    'bg-green-100 dark:bg-green-900',
                                  item.status === 'DELIVERED' &&
                                    'bg-blue-100 dark:bg-blue-900',
                                )}
                              >
                                {item.status === 'PENDING' && 'Pendente'}
                                {item.status === 'PREPARING' && 'Preparando'}
                                {item.status === 'READY' && 'Pronto'}
                                {item.status === 'DELIVERED' && 'Entregue'}
                              </span>
                            </div>
                            {item.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.notes}
                              </p>
                            )}
                            {item.flavors && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Sabores: {JSON.parse(item.flavors).join(', ')}
                              </p>
                            )}
                            {item.addons && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Adicionais: {JSON.parse(item.addons).join(', ')}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.quantity}x {formatCurrency(Number(item.unitPrice))} ={' '}
                              {formatCurrency(Number(item.subtotal))}
                            </p>
                          </div>
                          {item.status === 'PENDING' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Resumo */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">
                        {formatCurrency(Number(order.subtotal))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa de Serviço:</span>
                      <span className="font-medium">
                        {formatCurrency(Number(order.serviceFee))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Gorjeta:</span>
                      <span className="font-medium">
                        {formatCurrency(Number(order.tip))}
                      </span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(Number(order.total))}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Ações */}
        {order && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
            {hasPendingItems && (
              <Button
                onClick={handleSendToKitchen}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar para Cozinha
              </Button>
            )}
          </div>
        )}

        {/* Dialog: Adicionar Item */}
        {showAddItem && (
          <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Adicionar Item</DialogTitle>
                <DialogDescription>
                  Selecione um item do cardápio
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(handleAddItem)} className="space-y-4">
                {/* Filtro por Categoria */}
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lista de Itens */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredMenuItems.map((item) => (
                    <Card
                      key={item.id}
                      className={cn(
                        'cursor-pointer transition-colors',
                        selectedMenuItem?.id === item.id &&
                          'border-primary bg-primary/5',
                      )}
                      onClick={() => handleSelectMenuItem(item)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <p className="font-semibold">
                            {formatCurrency(Number(item.price))}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedMenuItem && (
                  <>
                    <input
                      type="hidden"
                      {...register('menuItemId')}
                      value={selectedMenuItem.id}
                    />

                    {/* Quantidade */}
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantidade *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0.01"
                        step="0.01"
                        {...register('quantity')}
                        className={cn(errors.quantity && 'border-destructive')}
                      />
                      {errors.quantity && (
                        <p className="text-sm text-destructive">
                          {errors.quantity.message}
                        </p>
                      )}
                    </div>

                    {/* Tamanho (se disponível) */}
                    {selectedMenuItem.sizes && (
                      <div className="space-y-2">
                        <Label htmlFor="size">Tamanho</Label>
                        <Select
                          value={selectedSize || ''}
                          onValueChange={(value) => setValue('size', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tamanho" />
                          </SelectTrigger>
                          <SelectContent>
                            {JSON.parse(selectedMenuItem.sizes).map((size: string) => (
                              <SelectItem key={size} value={size}>
                                {size} -{' '}
                                {formatCurrency(
                                  getItemPrice(selectedMenuItem, size),
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Meia Pizza */}
                    {selectedMenuItem.allowHalf && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isHalf"
                          checked={isHalf}
                          onCheckedChange={(checked) =>
                            setValue('isHalf', checked === true)
                          }
                        />
                        <Label htmlFor="isHalf" className="cursor-pointer">
                          Meia Pizza
                        </Label>
                      </div>
                    )}

                    {/* Terço de Pizza */}
                    {selectedMenuItem.allowThird && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isThird"
                          checked={isThird}
                          onCheckedChange={(checked) =>
                            setValue('isThird', checked === true)
                          }
                        />
                        <Label htmlFor="isThird" className="cursor-pointer">
                          Terço de Pizza
                        </Label>
                      </div>
                    )}

                    {/* Sabores (para meia/terço) */}
                    {(isHalf || isThird) && (
                      <div className="space-y-2">
                        <Label htmlFor="flavors">
                          Sabores (separados por vírgula)
                        </Label>
                        <Input
                          id="flavors"
                          placeholder="Ex: Calabresa, Portuguesa"
                          {...register('flavors')}
                        />
                      </div>
                    )}

                    {/* Adicionais */}
                    {selectedMenuItem.allowedAddons && (
                      <div className="space-y-2">
                        <Label htmlFor="addons">
                          Adicionais (separados por vírgula)
                        </Label>
                        <Input
                          id="addons"
                          placeholder="Ex: Borda Recheada, Extra Queijo"
                          {...register('addons')}
                        />
                      </div>
                    )}

                    {/* Observações */}
                    <div className="space-y-2">
                      <Label htmlFor="notes">Observações</Label>
                      <Textarea
                        id="notes"
                        placeholder="Ex: Pouco sal, carne ao ponto"
                        {...register('notes')}
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddItem(false);
                      setSelectedMenuItem(null);
                      reset();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isAddingItem || !selectedMenuItem}>
                    {isAddingItem ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Adicionar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}

