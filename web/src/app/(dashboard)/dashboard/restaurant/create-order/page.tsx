/**
 * Página para Criar Comanda
 * 
 * Página dedicada para criar novas comandas com opções de impressão,
 * envio para cozinha e download
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
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ShoppingCart,
  Users,
  Loader2,
  AlertCircle,
  Printer,
  Download,
  Send,
  ArrowLeft,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { OrderDialog } from '@/components/restaurant/OrderDialog';

interface Table {
  id: number;
  number: string;
  name?: string;
  capacity: number;
  status: 'FREE' | 'WAITING' | 'OCCUPIED' | 'RESERVED' | 'PAYMENT';
}

export default function CreateOrderPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, companyId } = useAuth();
  const { hasExtension } = useExtensions();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [splitType, setSplitType] = useState<'separate' | 'together'>('together');

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

  const handleTableSelect = (tableId: string) => {
    setSelectedTableId(tableId);
    const table = tables.find((t) => t.id.toString() === tableId);
    setSelectedTable(table || null);
  };

  const handleCreateOrder = () => {
    if (!selectedTable) {
      setError('Selecione uma mesa');
      return;
    }
    setShowOrderDialog(true);
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
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/restaurant')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Criar Nova Comanda</h1>
          <p className="text-muted-foreground mt-2">
            Selecione uma mesa e crie uma nova comanda
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seleção de Mesa */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Mesa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="table">Mesa *</Label>
              <Select
                value={selectedTableId}
                onValueChange={handleTableSelect}
              >
                <SelectTrigger id="table">
                  <SelectValue placeholder="Selecione uma mesa" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id.toString()}>
                      Mesa {table.number}
                      {table.name && ` - ${table.name}`}
                      {table.status === 'OCCUPIED' && ' (Ocupada)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTable && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="font-medium">Mesa {selectedTable.number}</p>
                {selectedTable.name && (
                  <p className="text-sm text-muted-foreground">
                    {selectedTable.name}
                  </p>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Capacidade: {selectedTable.capacity} pessoas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      selectedTable.status === 'FREE'
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : selectedTable.status === 'OCCUPIED'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {selectedTable.status === 'FREE' && 'Livre'}
                    {selectedTable.status === 'OCCUPIED' && 'Ocupada'}
                    {selectedTable.status === 'RESERVED' && 'Reservada'}
                    {selectedTable.status === 'WAITING' && 'Aguardando'}
                    {selectedTable.status === 'PAYMENT' && 'Pagamento'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Tipo de Comanda</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={splitType === 'together' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSplitType('together')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Comanda Junta
                </Button>
                <Button
                  type="button"
                  variant={splitType === 'separate' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSplitType('separate')}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Comandas Separadas
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {splitType === 'together'
                  ? 'Uma única comanda para todos os clientes da mesa'
                  : 'Cada cliente terá sua própria comanda separada'}
              </p>
            </div>

            <Button
              onClick={handleCreateOrder}
              disabled={!selectedTable}
              className="w-full"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Criar Comanda
            </Button>
          </CardContent>
        </Card>

        {/* Informações */}
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Funcionalidades Disponíveis:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Printer className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Imprimir:</strong> Imprima a comanda em impressoras
                    conectadas ou via WiFi
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Send className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Enviar para Cozinha:</strong> Envie os pedidos
                    diretamente para a cozinha
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Download className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Baixar Arquivo:</strong> Baixe a comanda em formato
                    JSON para backup
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Dica:</strong> Após criar a comanda, você poderá
                adicionar itens, imprimir, enviar para cozinha e baixar o
                arquivo da comanda.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog: Comanda */}
      {companyId && selectedTable && (
        <OrderDialog
          open={showOrderDialog}
          onOpenChange={(open) => {
            setShowOrderDialog(open);
            if (!open) {
              setSelectedTable(null);
              setSelectedTableId('');
            }
          }}
          table={selectedTable}
          companyId={companyId.toString()}
          onOrderUpdated={() => {
            fetchTables();
          }}
          autoCreate={true}
          autoCreateType={splitType}
        />
      )}
    </div>
  );
}

