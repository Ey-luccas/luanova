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
  Printer,
  Download,
  Edit,
  History,
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
  imageUrl?: string | null;
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
  autoCreate?: boolean;
  autoCreateType?: 'separate' | 'together';
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
  autoCreate = false,
  autoCreateType = 'together',
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
  const [showSplitOrderDialog, setShowSplitOrderDialog] = useState(false);
  const [splitType, setSplitType] = useState<'separate' | 'together'>('together');
  const [hasCheckedForOrder, setHasCheckedForOrder] = useState(false);
  const [hasAttemptedAutoCreate, setHasAttemptedAutoCreate] = useState(false);
  const [showCreateOrderPanel, setShowCreateOrderPanel] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [showEditOrderDialog, setShowEditOrderDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showDeleteOrderDialog, setShowDeleteOrderDialog] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [tempOrderItems, setTempOrderItems] = useState<Array<{
    menuItem: MenuItem;
    quantity: number;
    size?: string;
    isHalf?: boolean;
    isThird?: boolean;
    notes?: string;
    price: number;
  }>>([]);

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
    console.log('[OrderDialog] useEffect - open:', open, 'table:', table, 'companyId:', companyId);
    if (open && table && companyId) {
      console.log('[OrderDialog] Abrindo dialog - resetando estados');
      setHasCheckedForOrder(false);
      setHasAttemptedAutoCreate(false);
      setOrder(null); // Limpa a comanda anterior
      console.log('[OrderDialog] Chamando fetchOrder, fetchMenuItems, fetchWaiters');
      fetchOrder();
      fetchMenuItems();
      fetchWaiters();
    } else if (!open) {
      console.log('[OrderDialog] Fechando dialog - resetando estados');
      // Reset quando o dialog fecha
      setHasAttemptedAutoCreate(false);
      setHasCheckedForOrder(false);
      setOrder(null);
    }
  }, [open, table, companyId]);

  // Cria comanda automaticamente se solicitado
  useEffect(() => {
    console.log('[OrderDialog] Auto-create check:', {
      open,
      table: !!table,
      companyId,
      autoCreate,
      hasCheckedForOrder,
      hasOrder: !!order,
      isLoading,
      isLoadingOrder,
      hasAttemptedAutoCreate,
    });
    
    if (
      open &&
      table &&
      companyId &&
      autoCreate &&
      hasCheckedForOrder &&
      !order &&
      !isLoading &&
      !isLoadingOrder &&
      !hasAttemptedAutoCreate
    ) {
      console.log('[OrderDialog] Criando comanda automaticamente - tipo:', autoCreateType);
      setHasAttemptedAutoCreate(true);
      // Usa setTimeout para evitar chamadas múltiplas
      const timer = setTimeout(() => {
        handleCreateOrder(autoCreateType);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [
    open,
    table,
    companyId,
    autoCreate,
    autoCreateType,
    order,
    isLoading,
    isLoadingOrder,
    hasCheckedForOrder,
    hasAttemptedAutoCreate,
  ]);

  const fetchOrder = async (force = false) => {
    console.log('[OrderDialog] fetchOrder chamado - force:', force, 'table:', table, 'companyId:', companyId);
    if (!table || !companyId) {
      console.log('[OrderDialog] fetchOrder cancelado - falta table ou companyId');
      return;
    }

    try {
      console.log('[OrderDialog] Buscando comandas da mesa:', table.id);
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

      console.log('[OrderDialog] Resposta da API:', response.data);
      const orders = response.data?.data || [];
      console.log('[OrderDialog] Comandas encontradas:', orders.length);
      console.log('[OrderDialog] IDs das comandas:', orders.map((o: any) => o.id));

      // Salva todas as comandas
      setAllOrders(orders);
      
      if (orders.length > 0) {
        // Ordena por data de criação (mais recente primeiro)
        const sortedOrders = [...orders].sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        
        // Pega a primeira comanda aberta (mais recente)
        const latestOrder = sortedOrders[0];
        console.log('[OrderDialog] Comanda mais recente encontrada:', latestOrder.id);
        console.log('[OrderDialog] Buscando detalhes da comanda:', latestOrder.id);
        
        try {
          const orderResponse = await api.get(
            `/companies/${companyId}/restaurant/orders/${latestOrder.id}`,
          );
          const orderData = orderResponse.data?.data || orderResponse.data;
          console.log('[OrderDialog] Comanda completa carregada:', orderData);
          
          if (orderData && orderData.id) {
            setOrder(orderData);
            console.log('[OrderDialog] Comanda definida no estado:', orderData.id);
          } else {
            console.warn('[OrderDialog] Comanda sem dados completos, usando dados básicos');
            setOrder(latestOrder);
          }
        } catch (err: any) {
          console.error('[OrderDialog] Erro ao buscar detalhes da comanda:', err);
          // Se falhar, usa os dados básicos
          setOrder(latestOrder);
        }
        
        // Se forçou o reload, atualiza também o callback
        if (force) {
          console.log('[OrderDialog] Forçando atualização do callback');
          onOrderUpdated?.();
        }
      } else {
        console.log('[OrderDialog] Nenhuma comanda encontrada');
        setOrder(null);
      }
      setHasCheckedForOrder(true);
      console.log('[OrderDialog] fetchOrder concluído - hasCheckedForOrder: true');
    } catch (err: any) {
      console.error('[OrderDialog] Erro ao buscar comanda:', err);
      console.error('[OrderDialog] Erro detalhado:', err.response?.data || err.message);
      if (err.response?.status !== 404) {
        setError('Erro ao carregar comanda');
      }
      setOrder(null);
      setHasCheckedForOrder(true);
    } finally {
      setIsLoadingOrder(false);
      console.log('[OrderDialog] fetchOrder finalizado - isLoadingOrder: false');
    }
  };

  const fetchAllOrders = async () => {
    if (!table || !companyId) {
      console.log('[OrderDialog] fetchAllOrders cancelado - falta table ou companyId');
      return;
    }

    try {
      console.log('[OrderDialog] fetchAllOrders iniciado - Mesa:', table.id);
      setIsLoadingOrder(true);
      setError(null);
      
      // Busca todas as comandas da mesa, sem filtrar por status
      const response = await api.get(
        `/companies/${companyId}/restaurant/orders`,
        {
          params: {
            tableId: table.id,
            // Não passa status para buscar TODAS as comandas
          },
        },
      );

      console.log('[OrderDialog] Resposta fetchAllOrders:', response.data);
      const orders = response.data?.data || [];
      console.log('[OrderDialog] Comandas encontradas (fetchAllOrders):', orders.length);
      console.log('[OrderDialog] IDs das comandas:', orders.map((o: any) => o.id));
      
      if (orders.length === 0) {
        console.log('[OrderDialog] Nenhuma comanda encontrada para a mesa');
        setAllOrders([]);
        setIsLoadingOrder(false);
        return;
      }
      
      // Busca detalhes completos de cada comanda
      console.log('[OrderDialog] Buscando detalhes completos de cada comanda...');
      const ordersWithDetails = await Promise.all(
        orders.map(async (o: any) => {
          try {
            const orderResponse = await api.get(
              `/companies/${companyId}/restaurant/orders/${o.id}`,
            );
            const fullData = orderResponse.data?.data || orderResponse.data || o;
            console.log('[OrderDialog] Comanda detalhada carregada:', fullData.id);
            return fullData;
          } catch (err: any) {
            console.error('[OrderDialog] Erro ao buscar detalhes da comanda', o.id, ':', err);
            return o;
          }
        }),
      );

      console.log('[OrderDialog] Todas as comandas carregadas:', ordersWithDetails.length);
      console.log('[OrderDialog] Definindo allOrders no estado...');
      setAllOrders(ordersWithDetails);
      setShowAllOrders(true);
      console.log('[OrderDialog] fetchAllOrders concluído com sucesso');
    } catch (err: any) {
      console.error('[OrderDialog] Erro ao buscar comandas:', err);
      console.error('[OrderDialog] Erro detalhado:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Erro ao carregar comandas');
      setAllOrders([]);
    } finally {
      setIsLoadingOrder(false);
      console.log('[OrderDialog] fetchAllOrders finalizado');
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

  const handleCreateOrder = async (splitTypeParam?: 'separate' | 'together') => {
    console.log('[OrderDialog] handleCreateOrder chamado - splitTypeParam:', splitTypeParam);
    console.log('[OrderDialog] Estado atual - table:', table, 'companyId:', companyId);
    
    if (!table || !companyId) {
      console.log('[OrderDialog] handleCreateOrder cancelado - falta table ou companyId');
      setError('Mesa ou empresa não selecionada');
      return;
    }

    // Previne múltiplas chamadas simultâneas
    if (isLoading || isLoadingOrder) {
      console.warn('[OrderDialog] AVISO: Já está carregando, ignorando chamada');
      console.warn('[OrderDialog] isLoading:', isLoading, 'isLoadingOrder:', isLoadingOrder);
      return;
    }

    try {
      console.log('[OrderDialog] Criando nova comanda...');
      setIsLoading(true);
      setError(null);

      const typeToUse = splitTypeParam || splitType;
      const numberOfPeople = typeToUse === 'separate' ? 1 : 1; // Pode ser ajustado

      console.log('[OrderDialog] Dados da comanda:', {
        tableId: table.id,
        orderType: 'DINE_IN',
        numberOfPeople,
        typeToUse,
      });

      const response = await api.post(
        `/companies/${companyId}/restaurant/orders`,
        {
          tableId: table.id,
          orderType: 'DINE_IN',
          numberOfPeople: numberOfPeople,
        },
      );

      console.log('[OrderDialog] Resposta completa da API:', response);
      console.log('[OrderDialog] response.data:', response.data);
      console.log('[OrderDialog] response.status:', response.status);
      
      const newOrder = response.data?.data || response.data;
      console.log('[OrderDialog] Nova comanda recebida:', newOrder);
      
      if (!newOrder) {
        console.error('[OrderDialog] ERRO: Resposta sem dados de comanda');
        setError('Erro: Resposta inválida do servidor');
        setIsLoading(false);
        return;
      }
      
      if (!newOrder.id) {
        console.error('[OrderDialog] ERRO: Comanda criada sem ID válido');
        console.error('[OrderDialog] Dados recebidos:', newOrder);
        setError('Erro: Comanda criada sem ID válido');
        setIsLoading(false);
        return;
      }
      
      // Busca a comanda completa para garantir que todos os dados estão atualizados
      console.log('[OrderDialog] Buscando detalhes completos da comanda:', newOrder.id);
      try {
        // Aguarda um pouco para garantir que a comanda foi salva no banco
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const orderResponse = await api.get(
          `/companies/${companyId}/restaurant/orders/${newOrder.id}`,
        );
        const fullOrderData = orderResponse.data?.data || orderResponse.data;
        console.log('[OrderDialog] Comanda completa carregada:', fullOrderData);
        
        if (fullOrderData && fullOrderData.id) {
          console.log('[OrderDialog] Definindo comanda completa no estado');
          setOrder(fullOrderData);
          console.log('[OrderDialog] Estado order atualizado para:', fullOrderData);
        } else {
          console.warn('[OrderDialog] Comanda completa não encontrada ou sem ID, usando dados básicos');
          console.warn('[OrderDialog] fullOrderData:', fullOrderData);
          if (newOrder && newOrder.id) {
            setOrder(newOrder);
            console.log('[OrderDialog] Estado order atualizado com dados básicos:', newOrder);
          }
        }
      } catch (err: any) {
        console.error('[OrderDialog] Erro ao buscar comanda completa:', err);
        console.error('[OrderDialog] Erro detalhado:', err.response?.data || err.message);
        // Se falhar ao buscar, usa os dados retornados
        if (newOrder && newOrder.id) {
          setOrder(newOrder);
          console.log('[OrderDialog] Estado order atualizado com dados básicos após erro:', newOrder);
        }
      }
      
      // Força uma nova busca após um pequeno delay para garantir que está no banco
      console.log('[OrderDialog] Aguardando 800ms e forçando nova busca da comanda...');
      setTimeout(async () => {
        console.log('[OrderDialog] Forçando busca da comanda após criação');
        try {
          await fetchOrder(true);
          console.log('[OrderDialog] Busca forçada concluída');
        } catch (err) {
          console.error('[OrderDialog] Erro na busca forçada:', err);
        }
      }, 800);
      
      // Atualiza o estado para indicar que já verificou
      setHasCheckedForOrder(true);
      setHasAttemptedAutoCreate(true);
      console.log('[OrderDialog] Estados atualizados - hasCheckedForOrder: true, hasAttemptedAutoCreate: true');
      
      // Atualiza a lista de mesas
      console.log('[OrderDialog] Chamando onOrderUpdated');
      onOrderUpdated?.();
      
      // Se for criar comandas separadas, mostra o diálogo
      if (typeToUse === 'separate') {
        console.log('[OrderDialog] Mostrando diálogo de comandas separadas');
        setShowSplitOrderDialog(true);
      }
    } catch (err: any) {
      console.error('[OrderDialog] Erro ao criar comanda:', err);
      console.error('[OrderDialog] Erro detalhado:', err.response?.data || err.message);
      console.error('[OrderDialog] Stack trace:', err.stack);
      setError(err.response?.data?.message || 'Erro ao criar comanda. Tente novamente.');
      setHasAttemptedAutoCreate(false); // Permite tentar novamente em caso de erro
    } finally {
      setIsLoading(false);
      console.log('[OrderDialog] handleCreateOrder finalizado - isLoading: false');
    }
  };

  const handleCreateSeparateOrders = async () => {
    if (!table || !companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Cria uma segunda comanda separada
      const response = await api.post(
        `/companies/${companyId}/restaurant/orders`,
        {
          tableId: table.id,
          orderType: 'DINE_IN',
          numberOfPeople: 1,
        },
      );

      setShowSplitOrderDialog(false);
      // Atualiza para mostrar a nova comanda criada
      await fetchOrder();
      onOrderUpdated?.();
    } catch (err: any) {
      console.error('Erro ao criar comanda separada:', err);
      setError(err.response?.data?.message || 'Erro ao criar comanda separada');
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

  const handlePrintOrder = () => {
    if (!order) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comanda #${order.id}</title>
          <style>
            @media print {
              @page { margin: 10mm; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 80mm;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .order-info {
              margin-bottom: 15px;
            }
            .order-info p {
              margin: 5px 0;
            }
            .items {
              margin: 15px 0;
            }
            .item {
              margin-bottom: 10px;
              padding-bottom: 10px;
              border-bottom: 1px dashed #ccc;
            }
            .item-header {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .item-details {
              font-size: 12px;
              color: #666;
              margin-left: 10px;
            }
            .total {
              margin-top: 15px;
              padding-top: 10px;
              border-top: 2px solid #000;
              text-align: right;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 10px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>COMANDA #${order.id}</h2>
            <p>Mesa ${table?.number || 'N/A'}</p>
          </div>
          <div class="order-info">
            <p><strong>Garçom:</strong> ${order.waiter?.name || 'Não atribuído'}</p>
            <p><strong>Pessoas:</strong> ${order.numberOfPeople || 1}</p>
            <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          <div class="items">
            ${order.items.map((item) => `
              <div class="item">
                <div class="item-header">
                  ${item.quantity}x ${item.menuItem.name}
                  ${item.size ? ` - ${item.size}` : ''}
                  ${item.isHalf ? ' (Meia)' : ''}
                  ${item.isThird ? ' (Terço)' : ''}
                </div>
                <div class="item-details">
                  ${item.notes ? `<p>Obs: ${item.notes}</p>` : ''}
                  ${item.flavors ? `<p>Sabores: ${JSON.parse(item.flavors).join(', ')}</p>` : ''}
                  ${item.addons ? `<p>Adicionais: ${JSON.parse(item.addons).join(', ')}</p>` : ''}
                  <p>R$ ${Number(item.subtotal).toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <p>Subtotal: R$ ${Number(order.subtotal).toFixed(2).replace('.', ',')}</p>
            ${Number(order.serviceFee) > 0 ? `<p>Taxa de Serviço: R$ ${Number(order.serviceFee).toFixed(2).replace('.', ',')}</p>` : ''}
            ${Number(order.tip) > 0 ? `<p>Gorjeta: R$ ${Number(order.tip).toFixed(2).replace('.', ',')}</p>` : ''}
            <p style="font-size: 18px;">TOTAL: R$ ${Number(order.total).toFixed(2).replace('.', ',')}</p>
          </div>
          <div class="footer">
            <p>Obrigado pela preferência!</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleDownloadOrder = () => {
    if (!order) return;

    const orderData = {
      id: order.id,
      mesa: table?.number || 'N/A',
      garcom: order.waiter?.name || 'Não atribuído',
      pessoas: order.numberOfPeople || 1,
      data: new Date().toLocaleString('pt-BR'),
      status: order.status,
      itens: order.items.map((item) => ({
        nome: item.menuItem.name,
        quantidade: item.quantity,
        tamanho: item.size || null,
        meia: item.isHalf || false,
        terco: item.isThird || false,
        sabores: item.flavors ? JSON.parse(item.flavors) : null,
        adicionais: item.addons ? JSON.parse(item.addons) : null,
        observacoes: item.notes || null,
        preco_unitario: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
      subtotal: Number(order.subtotal),
      taxa_servico: Number(order.serviceFee),
      gorjeta: Number(order.tip),
      total: Number(order.total),
    };

    const blob = new Blob([JSON.stringify(orderData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comanda-${order.id}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

  console.log('[OrderDialog] ========== RENDER ==========');
  console.log('[OrderDialog] open:', open);
  console.log('[OrderDialog] table:', table);
  console.log('[OrderDialog] order:', order);
  console.log('[OrderDialog] isLoading:', isLoading);
  console.log('[OrderDialog] isLoadingOrder:', isLoadingOrder);
  console.log('[OrderDialog] hasCheckedForOrder:', hasCheckedForOrder);
  
  if (!table) {
    console.log('[OrderDialog] Render cancelado - sem table');
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      console.log('[OrderDialog] Dialog onOpenChange:', newOpen);
      onOpenChange(newOpen);
    }}>
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
          ) : showAllOrders ? (
            <AllOrdersView
              orders={allOrders}
              table={table}
              companyId={companyId}
              onSelectOrder={async (orderId: number) => {
                try {
                  const response = await api.get(
                    `/companies/${companyId}/restaurant/orders/${orderId}`,
                  );
                  const fullOrderData = response.data?.data;
                  setOrder(fullOrderData);
                  setShowAllOrders(false);
                } catch (err: any) {
                  console.error('Erro ao carregar comanda:', err);
                  setError('Erro ao carregar comanda');
                }
              }}
              onCreateNewOrder={() => {
                setShowAllOrders(false);
                setShowCreateOrderPanel(true);
                setTempOrderItems([]);
              }}
              onRefresh={async () => {
                console.log('[OrderDialog] Atualizando lista de comandas...');
                await fetchAllOrders();
              }}
              onEditOrder={(order: Order) => {
                setEditingOrder(order);
                setShowEditOrderDialog(true);
              }}
              onDeleteOrder={(order: Order) => {
                setDeletingOrder(order);
                setShowDeleteOrderDialog(true);
              }}
              onViewHistory={async (orderId: number) => {
                try {
                  const response = await api.get(
                    `/companies/${companyId}/restaurant/orders/${orderId}/history`,
                  );
                  setOrderHistory(response.data?.data || []);
                  setShowOrderHistory(true);
                } catch (err: any) {
                  console.error('Erro ao buscar histórico:', err);
                  setError('Erro ao buscar histórico da comanda');
                }
              }}
              onClose={() => {
                setShowAllOrders(false);
              }}
            />
          ) : !order && !showCreateOrderPanel ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhuma comanda aberta para esta mesa
              </p>
              <div className="flex flex-col gap-3 items-center">
                <div className="flex gap-2">
                <Button
                  onClick={() => {
                    console.log('[OrderDialog] Botão Comanda Junta clicado');
                    setSplitType('together');
                    setShowCreateOrderPanel(true);
                    setTempOrderItems([]);
                  }}
                  disabled={isLoading || isLoadingOrder}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Comanda Junta
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log('[OrderDialog] Botão Comandas Separadas clicado');
                    setSplitType('separate');
                    setShowCreateOrderPanel(true);
                    setTempOrderItems([]);
                  }}
                  disabled={isLoading || isLoadingOrder}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Comandas Separadas
                </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAllOrders}
                    disabled={isLoadingOrder}
                  >
                    {isLoadingOrder ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    Ver Comandas da Mesa
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setHasCheckedForOrder(false);
                      fetchOrder(true);
                    }}
                    disabled={isLoadingOrder}
                  >
                    {isLoadingOrder ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Clock className="h-4 w-4 mr-2" />
                    )}
                    Recarregar
                  </Button>
                </div>
              </div>
            </div>
          ) : showCreateOrderPanel && !order ? (
            <CreateOrderPanel
              table={table}
              menuItems={menuItems}
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              tempOrderItems={tempOrderItems}
              setTempOrderItems={setTempOrderItems}
              splitType={splitType}
              customerName={customerName}
              setCustomerName={setCustomerName}
              onCancel={() => {
                setShowCreateOrderPanel(false);
                setTempOrderItems([]);
                setCustomerName('');
              }}
              onCreateOrder={async () => {
                console.log('[OrderDialog] Criando comanda com itens:', tempOrderItems);
                if (tempOrderItems.length === 0) {
                  setError('Adicione pelo menos um item à comanda');
                  return;
                }

                if (splitType === 'separate' && !customerName?.trim()) {
                  setError('Informe o nome da pessoa para comanda separada');
                  return;
                }
                
                try {
                  setIsLoading(true);
                  setError(null);
                  
                  // Cria a comanda
                  const orderData: any = {
                    tableId: table.id,
                    orderType: 'DINE_IN',
                    numberOfPeople: splitType === 'separate' ? 1 : 1,
                  };

                  // Se for comanda separada e tiver nome da pessoa, adiciona
                  if (splitType === 'separate' && customerName) {
                    orderData.customerName = customerName;
                  }

                  console.log('[OrderDialog] Dados da comanda a ser criada:', orderData);
                  const response = await api.post(
                    `/companies/${companyId}/restaurant/orders`,
                    orderData,
                  );
                  
                  console.log('[OrderDialog] Resposta da criação:', response.data);
                  const newOrder = response.data?.data || response.data;
                  console.log('[OrderDialog] Nova comanda recebida:', newOrder);
                  
                  if (!newOrder || !newOrder.id) {
                    console.error('[OrderDialog] ERRO: Comanda criada sem ID válido');
                    setError('Erro ao criar comanda');
                    setIsLoading(false);
                    return;
                  }
                  
                  console.log('[OrderDialog] Adicionando itens à comanda:', tempOrderItems.length);
                  // Adiciona os itens à comanda
                  for (const item of tempOrderItems) {
                    try {
                      console.log('[OrderDialog] Adicionando item:', item.menuItem.name, 'Quantidade:', item.quantity);
                      await api.post(
                        `/companies/${companyId}/restaurant/orders/${newOrder.id}/items`,
                        {
                          menuItemId: item.menuItem.id,
                          quantity: item.quantity,
                          size: item.size || undefined,
                          isHalf: item.isHalf || false,
                          isThird: item.isThird || false,
                          notes: item.notes || undefined,
                        },
                      );
                      console.log('[OrderDialog] Item adicionado com sucesso');
                    } catch (itemErr: any) {
                      console.error('[OrderDialog] Erro ao adicionar item:', itemErr);
                      console.error('[OrderDialog] Detalhes do erro:', itemErr.response?.data);
                    }
                  }
                  
                  console.log('[OrderDialog] Todos os itens adicionados. Buscando comanda completa...');
                  
                  // Aguarda um pouco para garantir que o backend processou tudo
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  // Busca a comanda completa diretamente pelo ID
                  console.log('[OrderDialog] Buscando comanda completa pelo ID:', newOrder.id);
                  try {
                    const orderResponse = await api.get(
                      `/companies/${companyId}/restaurant/orders/${newOrder.id}`,
                    );
                    const fullOrderData = orderResponse.data?.data || orderResponse.data;
                    console.log('[OrderDialog] Comanda completa carregada:', fullOrderData);
                    
                    if (fullOrderData && fullOrderData.id) {
                      // Define a comanda no estado ANTES de fechar o painel
                      setOrder(fullOrderData);
                      console.log('[OrderDialog] Comanda definida no estado:', fullOrderData.id);
                      
                      // Fecha o painel de criação
                      setShowCreateOrderPanel(false);
                      setTempOrderItems([]);
                      setCustomerName('');
                      
                      // Atualiza a lista de todas as comandas
                      await fetchAllOrders();
                      
                      // Atualiza a lista de mesas
                      onOrderUpdated?.();
                      
                      console.log('[OrderDialog] Comanda criada e exibida com sucesso');
                    } else {
                      console.error('[OrderDialog] Comanda não encontrada após criação');
                      setError('Comanda criada mas não foi possível carregá-la. Tente recarregar.');
                      // Força uma busca geral
                      setHasCheckedForOrder(false);
                      await fetchOrder(true);
                      setShowCreateOrderPanel(false);
                      setTempOrderItems([]);
                      setCustomerName('');
                    }
                  } catch (fetchErr: any) {
                    console.error('[OrderDialog] Erro ao buscar comanda após criação:', fetchErr);
                    // Tenta buscar todas as comandas
                    setHasCheckedForOrder(false);
                    await fetchOrder(true);
                    setShowCreateOrderPanel(false);
                    setTempOrderItems([]);
                    setCustomerName('');
                    onOrderUpdated?.();
                  }
                } catch (err: any) {
                  console.error('[OrderDialog] Erro ao criar comanda:', err);
                  setError(err.response?.data?.message || 'Erro ao criar comanda');
                } finally {
                  setIsLoading(false);
                }
              }}
              onRegisterPayment={() => {
                setShowPaymentDialog(true);
              }}
            />
          ) : order ? (
            <>
              {/* Informações da Comanda */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Comanda #{order.id}</CardTitle>
                      {order.customerName && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Cliente: {order.customerName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchAllOrders}
                        disabled={isLoadingOrder}
                        title="Ver todas as comandas da mesa"
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Ver Comandas
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setHasCheckedForOrder(false);
                          fetchOrder(true);
                        }}
                        disabled={isLoadingOrder}
                        title="Recarregar comanda"
                      >
                        {isLoadingOrder ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </Button>
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
          ) : null}
        </div>

        {/* Ações */}
        {order && (
          <div className="flex justify-between items-center gap-2 pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrintOrder}
                title="Imprimir comanda"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadOrder}
                title="Baixar arquivo da comanda"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
            <div className="flex gap-2">
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

        {/* Dialog: Criar Comandas Separadas */}
        <Dialog open={showSplitOrderDialog} onOpenChange={setShowSplitOrderDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Comandas Separadas</DialogTitle>
              <DialogDescription>
                Você criou uma comanda. Deseja criar outra comanda separada para esta mesa?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Com comandas separadas, cada pessoa pode ter seu próprio pedido e pagamento individual.
              </p>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSplitOrderDialog(false);
                    onOrderUpdated?.();
                  }}
                >
                  Não, manter uma única comanda
                </Button>
                <Button
                  onClick={handleCreateSeparateOrders}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Sim, criar comanda separada
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog: Pagamento */}
        {showPaymentDialog && order && (
          <PaymentDialog
            open={showPaymentDialog}
            onOpenChange={setShowPaymentDialog}
            order={order}
            companyId={companyId}
            onPaymentComplete={async () => {
              await fetchOrder(true);
              onOrderUpdated?.();
              setShowPaymentDialog(false);
            }}
          />
        )}

        {/* Dialog: Editar Comanda */}
        {showEditOrderDialog && editingOrder && (
          <EditOrderDialog
            open={showEditOrderDialog}
            onOpenChange={setShowEditOrderDialog}
            order={editingOrder}
            companyId={companyId}
            waiters={waiters}
            onOrderUpdated={async () => {
              await fetchOrder(true);
              await fetchAllOrders();
              onOrderUpdated?.();
              setShowEditOrderDialog(false);
              setEditingOrder(null);
            }}
          />
        )}

        {/* Dialog: Excluir Comanda */}
        {showDeleteOrderDialog && deletingOrder && (
          <DeleteOrderDialog
            open={showDeleteOrderDialog}
            onOpenChange={setShowDeleteOrderDialog}
            order={deletingOrder}
            companyId={companyId}
            onOrderDeleted={async () => {
              await fetchOrder(true);
              await fetchAllOrders();
              onOrderUpdated?.();
              setShowDeleteOrderDialog(false);
              setDeletingOrder(null);
            }}
          />
        )}

        {/* Dialog: Histórico da Comanda */}
        {showOrderHistory && (
          <OrderHistoryDialog
            open={showOrderHistory}
            onOpenChange={setShowOrderHistory}
            history={orderHistory}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// Componente de Painel de Criação de Comanda
interface CreateOrderPanelProps {
  table: Table;
  menuItems: MenuItem[];
  categories: any[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  tempOrderItems: Array<{
    menuItem: MenuItem;
    quantity: number;
    size?: string;
    isHalf?: boolean;
    isThird?: boolean;
    notes?: string;
    price: number;
  }>;
  setTempOrderItems: (items: Array<{
    menuItem: MenuItem;
    quantity: number;
    size?: string;
    isHalf?: boolean;
    isThird?: boolean;
    notes?: string;
    price: number;
  }>) => void;
  splitType: 'separate' | 'together';
  customerName?: string;
  setCustomerName?: (name: string) => void;
  onCancel: () => void;
  onCreateOrder: () => Promise<void>;
  onRegisterPayment: () => void;
}

function CreateOrderPanel({
  table,
  menuItems,
  categories,
  selectedCategory,
  setSelectedCategory,
  tempOrderItems,
  setTempOrderItems,
  splitType,
  customerName,
  setCustomerName,
  onCancel,
  onCreateOrder,
  onRegisterPayment,
}: CreateOrderPanelProps) {
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [size, setSize] = useState<string>('');
  const [isHalf, setIsHalf] = useState(false);
  const [isThird, setIsThird] = useState(false);
  const [notes, setNotes] = useState('');
  const [localCustomerName, setLocalCustomerName] = useState(customerName || '');

  const filteredMenuItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter((item) => item.category.id.toString() === selectedCategory);

  const getItemPrice = (item: MenuItem, selectedSize?: string) => {
    if (selectedSize && item.sizesPrices) {
      try {
        const prices = JSON.parse(item.sizesPrices);
        return prices[selectedSize] || Number(item.price);
      } catch {
        return Number(item.price);
      }
    }
    return Number(item.price);
  };

  const handleAddToOrder = () => {
    if (!selectedMenuItem) return;

    const itemPrice = getItemPrice(selectedMenuItem, size);
    const itemQuantity = parseFloat(quantity) || 1;

    setTempOrderItems([
      ...tempOrderItems,
      {
        menuItem: selectedMenuItem,
        quantity: itemQuantity,
        size: size || undefined,
        isHalf,
        isThird,
        notes: notes || undefined,
        price: itemPrice,
      },
    ]);

    // Reset form
    setSelectedMenuItem(null);
    setQuantity('1');
    setSize('');
    setIsHalf(false);
    setIsThird(false);
    setNotes('');
    setShowAddItemDialog(false);
  };

  const handleRemoveItem = (index: number) => {
    setTempOrderItems(tempOrderItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return tempOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {splitType === 'together' ? 'Comanda Junta' : 'Comandas Separadas'}
          </h3>
          <p className="text-sm text-muted-foreground">Mesa {table.number}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lista de Pratos */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cardápio</CardTitle>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48">
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
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {filteredMenuItems.map((item) => (
                  <Card
                    key={item.id}
                    className={cn(
                      'cursor-pointer transition-colors hover:border-primary',
                      selectedMenuItem?.id === item.id && 'border-primary bg-primary/5',
                    )}
                    onClick={() => {
                      setSelectedMenuItem(item);
                      setShowAddItemDialog(true);
                    }}
                  >
                    <CardContent className="p-3">
                      {item.imageUrl && (
                        <div className="relative h-32 w-full overflow-hidden rounded-lg mb-2">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <p className="font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <p className="font-semibold mt-2">
                        {formatCurrency(Number(item.price))}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resumo da Comanda */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Itens da Comanda</CardTitle>
            </CardHeader>
            <CardContent>
              {tempOrderItems.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  Nenhum item adicionado
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tempOrderItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-2 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.menuItem.name}</p>
                        {item.size && (
                          <p className="text-xs text-muted-foreground">Tamanho: {item.size}</p>
                        )}
                        {item.isHalf && (
                          <p className="text-xs text-muted-foreground">Meia porção</p>
                        )}
                        {item.isThird && (
                          <p className="text-xs text-muted-foreground">Terço de porção</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {item.quantity}x {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={onCreateOrder}
              disabled={tempOrderItems.length === 0 || (splitType === 'separate' && !localCustomerName.trim())}
              className="flex-1"
            >
              Criar Comanda
            </Button>
          </div>
        </div>
      </div>

      {/* Dialog: Adicionar Item */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Item</DialogTitle>
            <DialogDescription>
              {selectedMenuItem?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            {selectedMenuItem?.sizes && (
              <div className="space-y-2">
                <Label>Tamanho</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    {JSON.parse(selectedMenuItem.sizes).map((s: string) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre o item..."
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddItemDialog(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button onClick={handleAddToOrder} className="flex-1">
                Adicionar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de Dialog de Pagamento
interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  companyId: string;
  onPaymentComplete: () => Promise<void>;
}

function PaymentDialog({
  open,
  onOpenChange,
  order,
  companyId,
  onPaymentComplete,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [serviceFee, setServiceFee] = useState('');
  const [tip, setTip] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = Number(order.subtotal) || 0;
  const serviceFeeValue = parseFloat(serviceFee) || 0;
  const tipValue = parseFloat(tip) || 0;
  const total = subtotal + serviceFeeValue + tipValue;

  const handleCloseOrder = async () => {
    if (!paymentMethod) {
      setError('Selecione uma forma de pagamento');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await api.post(
        `/companies/${companyId}/restaurant/orders/${order.id}/close`,
        {
          paymentMethod,
          serviceFee: serviceFeeValue || 0,
          tip: tipValue || 0,
        },
      );

      await onPaymentComplete();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Erro ao fechar comanda:', err);
      setError(err.response?.data?.message || 'Erro ao registrar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Comanda #{order.id} - Mesa {order.table?.number}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <Label>Forma de Pagamento *</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Espécie</SelectItem>
                <SelectItem value="DEBIT_CARD">Cartão Débito</SelectItem>
                <SelectItem value="CREDIT_CARD">Cartão Crédito</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Taxa de Serviço */}
          <div className="space-y-2">
            <Label>Taxa de Serviço (opcional)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={serviceFee}
              onChange={(e) => setServiceFee(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Gorjeta */}
          <div className="space-y-2">
            <Label>Gorjeta (opcional)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Resumo */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {serviceFeeValue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de Serviço:</span>
                    <span>{formatCurrency(serviceFeeValue)}</span>
                  </div>
                )}
                {tipValue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Gorjeta:</span>
                    <span>{formatCurrency(tipValue)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCloseOrder}
              className="flex-1"
              disabled={isLoading || !paymentMethod}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Registrar Pagamento
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente de Visualização de Todas as Comandas da Mesa
interface AllOrdersViewProps {
  orders: Order[];
  table: Table;
  companyId: string;
  onSelectOrder: (orderId: number) => Promise<void>;
  onCreateNewOrder: () => void;
  onRefresh: () => Promise<void>;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (order: Order) => void;
  onViewHistory: (orderId: number) => Promise<void>;
  onClose: () => void;
}

function AllOrdersView({
  orders,
  table,
  companyId,
  onSelectOrder,
  onCreateNewOrder,
  onRefresh,
  onEditOrder,
  onDeleteOrder,
  onViewHistory,
  onClose,
}: AllOrdersViewProps) {
  console.log('[AllOrdersView] Render - orders recebidas:', orders.length);
  console.log('[AllOrdersView] IDs das comandas:', orders.map(o => o.id));
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">Aberta</span>;
      case 'SENT_TO_KITCHEN':
        return <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">Enviada</span>;
      case 'PREPARING':
        return <span className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">Preparando</span>;
      case 'READY':
        return <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">Pronta</span>;
      case 'DELIVERED':
        return <span className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">Entregue</span>;
      case 'CLOSED':
        return <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">Fechada</span>;
      default:
        return <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Comandas da Mesa {table.number}</h3>
          <p className="text-sm text-muted-foreground">
            {orders.length} {orders.length === 1 ? 'comanda encontrada' : 'comandas encontradas'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateNewOrder}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Comanda
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            title="Atualizar lista de comandas"
          >
            <Clock className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma comanda encontrada para esta mesa</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => onSelectOrder(order.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">Comanda #{order.id}</h4>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    {order.customerName && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium">Cliente:</span> {order.customerName}
                      </p>
                    )}
                    
                    {order.waiter && (
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium">Garçom:</span> {order.waiter.name}
                      </p>
                    )}
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      <span className="font-medium">Itens:</span> {order.items?.length || 0}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Subtotal: </span>
                        <span className="font-medium">{formatCurrency(Number(order.subtotal))}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total: </span>
                        <span className="font-semibold text-lg">{formatCurrency(Number(order.total))}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder(order.id);
                      }}
                      title="Abrir comanda"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                    {order.status !== 'CLOSED' && order.status !== 'CANCELLED' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditOrder(order);
                          }}
                          title="Editar comanda"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteOrder(order);
                          }}
                          title="Excluir comanda"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewHistory(order.id);
                      }}
                      title="Ver histórico"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente de Dialog para Editar Comanda
interface EditOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  companyId: string;
  waiters: any[];
  onOrderUpdated: () => Promise<void>;
}

function EditOrderDialog({
  open,
  onOpenChange,
  order,
  companyId,
  waiters,
  onOrderUpdated,
}: EditOrderDialogProps) {
  const [customerName, setCustomerName] = useState(order.customerName || '');
  const [customerPhone, setCustomerPhone] = useState(order.customerPhone || '');
  const [numberOfPeople, setNumberOfPeople] = useState(order.numberOfPeople?.toString() || '1');
  const [notes, setNotes] = useState(order.notes || '');
  const [waiterId, setWaiterId] = useState(order.waiterId?.toString() || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (order.status === 'CLOSED' || order.status === 'CANCELLED') {
      setError('Não é possível editar uma comanda fechada ou cancelada');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const updateData: any = {};
      if (customerName !== (order.customerName || '')) updateData.customerName = customerName || null;
      if (customerPhone !== (order.customerPhone || '')) updateData.customerPhone = customerPhone || null;
      if (numberOfPeople !== (order.numberOfPeople?.toString() || '1')) {
        updateData.numberOfPeople = parseInt(numberOfPeople) || 1;
      }
      if (notes !== (order.notes || '')) updateData.notes = notes || null;
      if (waiterId !== (order.waiterId?.toString() || '')) {
        updateData.waiterId = waiterId ? parseInt(waiterId) : null;
      }

      if (Object.keys(updateData).length === 0) {
        setError('Nenhuma alteração foi feita');
        setIsLoading(false);
        return;
      }

      await api.put(
        `/companies/${companyId}/restaurant/orders/${order.id}`,
        updateData,
      );

      await onOrderUpdated();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Erro ao atualizar comanda:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar comanda');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Comanda #{order.id}</DialogTitle>
          <DialogDescription>
            Atualize as informações da comanda. Todas as alterações serão registradas no histórico.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Nome do Cliente</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPhone">Telefone</Label>
            <Input
              id="customerPhone"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Telefone do cliente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfPeople">Número de Pessoas</Label>
            <Input
              id="numberOfPeople"
              type="number"
              min="1"
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="waiterId">Garçom</Label>
            <Select value={waiterId} onValueChange={setWaiterId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o garçom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem garçom</SelectItem>
                {waiters.map((waiter) => (
                  <SelectItem key={waiter.id} value={waiter.id.toString()}>
                    {waiter.name} {waiter.code && `(${waiter.code})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre a comanda"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Componente de Dialog para Excluir Comanda
interface DeleteOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  companyId: string;
  onOrderDeleted: () => Promise<void>;
}

function DeleteOrderDialog({
  open,
  onOpenChange,
  order,
  companyId,
  onOrderDeleted,
}: DeleteOrderDialogProps) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (order.status === 'CLOSED' || order.status === 'CANCELLED') {
      setError('Não é possível excluir uma comanda fechada ou cancelada');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir esta comanda? Esta ação será registrada no histórico.')) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await api.delete(
        `/companies/${companyId}/restaurant/orders/${order.id}`,
        {
          data: { reason: reason || 'Sem motivo informado' },
        },
      );

      await onOrderDeleted();
      onOpenChange(false);
      setReason('');
    } catch (err: any) {
      console.error('Erro ao excluir comanda:', err);
      setError(err.response?.data?.message || 'Erro ao excluir comanda');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Comanda #{order.id}</DialogTitle>
          <DialogDescription>
            A comanda será marcada como cancelada e todas as alterações serão registradas no histórico.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Exclusão (opcional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Informe o motivo da exclusão..."
            />
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-medium mb-2">Informações da Comanda:</p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>Total: {formatCurrency(Number(order.total))}</li>
              <li>Itens: {order.items?.length || 0}</li>
              {order.customerName && <li>Cliente: {order.customerName}</li>}
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir Comanda
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente de Dialog para Histórico da Comanda
interface OrderHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: any[];
}

function OrderHistoryDialog({
  open,
  onOpenChange,
  history,
}: OrderHistoryDialogProps) {
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'CREATED':
        return 'Criada';
      case 'UPDATED':
        return 'Atualizada';
      case 'DELETED':
        return 'Excluída';
      case 'ITEM_ADDED':
        return 'Item Adicionado';
      case 'ITEM_REMOVED':
        return 'Item Removido';
      case 'ITEM_UPDATED':
        return 'Item Atualizado';
      case 'STATUS_CHANGED':
        return 'Status Alterado';
      case 'CLOSED':
        return 'Fechada';
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATED':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      case 'UPDATED':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
      case 'DELETED':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      case 'CLOSED':
        return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico da Comanda</DialogTitle>
          <DialogDescription>
            Todas as alterações realizadas nesta comanda
          </DialogDescription>
        </DialogHeader>

        {history.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum histórico encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item, index) => (
              <Card key={item.id || index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${getActionColor(item.action)}`}>
                        {getActionLabel(item.action)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  
                  {item.description && (
                    <p className="text-sm mb-2">{item.description}</p>
                  )}
                  
                  {item.changes && Object.keys(item.changes).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(item.changes).map(([field, change]: [string, any]) => (
                        <div key={field} className="text-xs bg-muted p-2 rounded">
                          <span className="font-medium">{field}:</span>{' '}
                          <span className="text-muted-foreground line-through">
                            {change.old !== null && change.old !== undefined ? String(change.old) : 'N/A'}
                          </span>
                          {' → '}
                          <span className="font-medium">
                            {change.new !== null && change.new !== undefined ? String(change.new) : 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
