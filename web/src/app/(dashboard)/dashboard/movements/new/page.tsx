/**
 * Página de Cadastro de Movimentação
 *
 * Formulário dinâmico para registrar movimentação de produto (venda) ou serviço (prestação).
 * Envia para: POST /api/companies/{companyId}/sales
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useExtensions } from '@/contexts/ExtensionsContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Package,
  Briefcase,
  Scan,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BarcodeScanner } from '@/components/BarcodeScanner';

// Schema de validação - quantidade é opcional (será validada condicionalmente)
const baseSchema = z.object({
  productId: z.string().min(1, 'Produto/Serviço é obrigatório'),
  quantity: z.string().optional(), // Opcional - validado condicionalmente
  customerName: z.string().min(1, 'Nome do cliente é obrigatório'),
  customerCpf: z.string().optional(),
  customerEmail: z
    .string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  paymentMethod: z.enum(['PIX', 'CARTAO', 'BOLETO', 'ESPECIE'], {
    errorMap: () => ({ message: 'Forma de pagamento é obrigatória' }),
  }),
  observations: z.string().optional(),
});

type MovementFormData = {
  productId: string;
  quantity?: string;
  customerName: string;
  customerCpf?: string;
  customerEmail?: string;
  paymentMethod: 'PIX' | 'CARTAO' | 'BOLETO' | 'ESPECIE';
  observations?: string;
  movementType?: 'PRODUCT' | 'SERVICE';
};

interface Product {
  id: number;
  name: string;
  barcode?: string | null;
  currentStock: number;
  isService: boolean;
  unitPrice?: number | null;
  costPrice?: number | null;
}

export default function NewMovementPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { hasExtension } = useExtensions();
  const hasServicesExtension = hasExtension('services_management');
  const hasProductsExtension = hasExtension('products_management');

  // Define o tipo inicial baseado nas extensões disponíveis
  const getInitialMovementType = (): 'PRODUCT' | 'SERVICE' => {
    if (hasProductsExtension && hasServicesExtension) {
      return 'PRODUCT'; // Padrão: produtos
    }
    if (hasProductsExtension) {
      return 'PRODUCT';
    }
    if (hasServicesExtension) {
      return 'SERVICE';
    }
    return 'PRODUCT'; // Fallback
  };

  const [movementType, setMovementType] = useState<'PRODUCT' | 'SERVICE'>(
    getInitialMovementType(),
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantityError, setQuantityError] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MovementFormData>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      paymentMethod: 'PIX',
      movementType: 'PRODUCT',
      quantity: '',
    },
  });

  const productId = watch('productId');
  const quantity = watch('quantity');

  useEffect(() => {
    if (isAuthenticated) {
      if (hasProductsExtension) {
        fetchProducts();
      }
      if (hasServicesExtension) {
        fetchServices();
      }
    }
  }, [isAuthenticated, hasServicesExtension, hasProductsExtension]);

  // Ajusta o tipo de movimentação baseado nas extensões disponíveis
  useEffect(() => {
    if (!hasServicesExtension && movementType === 'SERVICE') {
      // Se serviços não está disponível e está selecionado, muda para produtos
      if (hasProductsExtension) {
        setMovementType('PRODUCT');
      }
    }
    if (!hasProductsExtension && movementType === 'PRODUCT') {
      // Se produtos não está disponível e está selecionado, muda para serviços
      if (hasServicesExtension) {
        setMovementType('SERVICE');
      }
    }
  }, [hasServicesExtension, hasProductsExtension, movementType]);

  // Resetar formulário quando mudar o tipo
  useEffect(() => {
    setValue('productId', '');
    setValue('movementType', movementType);
    setQuantityError(null);
    // Se for serviço, definir quantidade como 1 automaticamente
    if (movementType === 'SERVICE') {
      setValue('quantity', '1');
    } else {
      setValue('quantity', '');
    }
  }, [movementType, setValue]);

  const fetchProducts = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) return;

      const response = await api.get(`/companies/${companyId}/products`, {
        params: { limit: 1000, isActive: 'true', isService: 'false' },
      });

      const data = response.data.data || response.data;
      const allProducts = data.products || [];
      // GARANTIR que apenas produtos são exibidos (isService = false ou null)
      const onlyProducts = allProducts.filter(
        (p: Product) => p.isService !== true,
      );
      setProducts(onlyProducts);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const fetchServices = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) return;

      const response = await api.get(`/companies/${companyId}/products`, {
        params: { limit: 1000, isActive: 'true', isService: 'true' },
      });

      const data = response.data.data || response.data;
      const allItems = data.products || [];
      // GARANTIR que apenas serviços são exibidos (isService = true)
      const onlyServices = allItems.filter(
        (s: Product) => s.isService === true,
      );
      setServices(onlyServices);
    } catch (err) {
      console.error('Erro ao buscar serviços:', err);
    }
  };

  const onSubmit = async (data: MovementFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setQuantityError(null);

      // Validação condicional de quantidade
      if (movementType === 'PRODUCT') {
        if (!data.quantity || data.quantity.trim() === '') {
          setQuantityError('Quantidade é obrigatória');
          setIsLoading(false);
          return;
        }
        const quantity = parseFloat(data.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          setQuantityError('Quantidade deve ser maior que zero');
          setIsLoading(false);
          return;
        }
        // Validar que é um número inteiro
        if (!Number.isInteger(quantity)) {
          setQuantityError('Quantidade deve ser um número inteiro');
          setIsLoading(false);
          return;
        }
      }

      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        setError('Empresa não selecionada.');
        setIsLoading(false);
        return;
      }

      // Preparar dados para envio
      // Para serviços, quantidade é sempre 1 (uma prestação)
      // Para produtos, garantir que seja um número inteiro
      const quantity =
        movementType === 'SERVICE'
          ? 1
          : Math.floor(parseFloat(data.quantity || '0'));

      const payload = {
        productId: parseInt(data.productId),
        type: movementType === 'PRODUCT' ? 'SALE' : 'SERVICE',
        quantity: quantity,
        customerName: data.customerName,
        customerCpf: data.customerCpf || null,
        customerEmail: data.customerEmail || null,
        paymentMethod: data.paymentMethod,
        observations: data.observations || null,
      };

      await api.post(`/companies/${companyId}/sales`, payload);

      // Redirecionar para lista de movimentações
      router.push('/dashboard/movements');
    } catch (err: any) {
      console.error('Erro ao registrar movimentação:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao registrar movimentação. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Item selecionado para exibir informações (estoque para produtos)
  const selectedItem =
    movementType === 'PRODUCT'
      ? products.find((p) => p.id === parseInt(productId || '0'))
      : services.find((s) => s.id === parseInt(productId || '0'));

  const handleScanClick = () => {
    // Só permite escanear se for produto
    if (movementType === 'PRODUCT') {
      setScannerOpen(true);
    }
  };

  const handleScanSuccess = async (barcode: string) => {
    try {
      setScannerOpen(false);
      setError(null);

      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        setError('Empresa não selecionada.');
        return;
      }

      // Buscar produto por código de barras
      const response = await api.get(
        `/companies/${companyId}/products/barcode/${barcode}`,
      );

      const product = response.data?.data?.product;
      if (!product) {
        setError('Produto não encontrado com este código de barras.');
        return;
      }

      // Verificar se é um produto (não serviço)
      if (product.isService === true) {
        setError(
          'Este código pertence a um serviço. Selecione "Serviço" como tipo de movimentação.',
        );
        return;
      }

      // Preencher formulário automaticamente
      setValue('productId', product.id.toString());
      setValue('quantity', '1'); // Quantidade padrão: 1 (pode ser alterada)

      // Se o produto não estiver na lista, adicionar
      if (!products.find((p) => p.id === product.id)) {
        setProducts((prev) => [...prev, product]);
      }
    } catch (err: any) {
      console.error('Erro ao buscar produto:', err);
      if (err.response?.status === 404) {
        setError('Produto não encontrado com este código de barras.');
      } else {
        setError(
          err.response?.data?.message ||
            'Erro ao buscar produto. Tente novamente.',
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/movements">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nova Movimentação</h1>
          <p className="text-muted-foreground mt-2">
            Registre uma movimentação de produto (venda) ou serviço (prestação)
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações da Movimentação</CardTitle>
          <CardDescription>
            Selecione o tipo e preencha os dados abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Seleção Visual de Tipo */}
            <div className="space-y-2">
              <Label>
                Tipo de Movimentação <span className="text-destructive">*</span>
              </Label>
              <div
                className={cn(
                  'grid gap-4',
                  hasServicesExtension ? 'grid-cols-2' : 'grid-cols-1',
                )}
              >
                <button
                  type="button"
                  onClick={() => setMovementType('PRODUCT')}
                  className={cn(
                    'p-6 border-2 rounded-lg transition-all text-left',
                    'hover:shadow-md',
                    movementType === 'PRODUCT'
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'p-3 rounded-lg',
                        movementType === 'PRODUCT'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted',
                      )}
                    >
                      <Package className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold">Produto</div>
                      <div className="text-sm text-muted-foreground">
                        Venda de produto físico
                      </div>
                    </div>
                  </div>
                </button>
                {hasServicesExtension ? (
                  <button
                    type="button"
                    onClick={() => setMovementType('SERVICE')}
                    className={cn(
                      'p-6 border-2 rounded-lg transition-all text-left',
                      'hover:shadow-md',
                      movementType === 'SERVICE'
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-border hover:border-primary/50',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'p-3 rounded-lg',
                          movementType === 'SERVICE'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted',
                        )}
                      >
                        <Briefcase className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-semibold">Serviço</div>
                        <div className="text-sm text-muted-foreground">
                          Prestação de serviço
                        </div>
                      </div>
                    </div>
                  </button>
                ) : (
                  <Alert className="p-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                      <span>
                        Para registrar prestações de serviços, você precisa
                        ativar a extensão "Gerenciamento de Serviços".
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard/extensions')}
                        className="ml-4"
                      >
                        Ativar Extensão
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>

            {/* Seleção de Produto/Serviço */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="productId">
                  {movementType === 'PRODUCT' ? 'Produto' : 'Serviço'}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                {movementType === 'PRODUCT' && (
                  <Button
                    type="button"
                    onClick={handleScanClick}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <Scan className="mr-2 h-4 w-4" />
                    Escanear
                  </Button>
                )}
              </div>
              {isLoadingItems ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando{' '}
                  {movementType === 'PRODUCT' ? 'produtos' : 'serviços'}...
                </div>
              ) : (
                <>
                  <Select
                    value={productId || ''}
                    onValueChange={(value) => setValue('productId', value)}
                  >
                    <SelectTrigger id="productId">
                      <SelectValue
                        placeholder={`Selecione um ${
                          movementType === 'PRODUCT' ? 'produto' : 'serviço'
                        }`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(movementType === 'PRODUCT' ? products : services)
                        .filter((item) => {
                          // Filtro ABSOLUTO de segurança
                          if (movementType === 'PRODUCT') {
                            return item.isService !== true; // Apenas produtos (false ou null)
                          } else {
                            return item.isService === true; // Apenas serviços (true)
                          }
                        })
                        .map((item) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.name}
                            {movementType === 'PRODUCT' &&
                              item.barcode &&
                              ` (${item.barcode})`}
                            {movementType === 'PRODUCT' &&
                              ` - Estoque: ${item.currentStock}`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.productId && (
                    <p className="text-sm text-destructive">
                      {errors.productId.message}
                    </p>
                  )}
                  {selectedItem && movementType === 'PRODUCT' && (
                    <p className="text-sm text-muted-foreground">
                      Estoque atual:{' '}
                      <strong>{selectedItem.currentStock}</strong>
                      {quantity &&
                        parseFloat(quantity || '0') >
                          selectedItem.currentStock && (
                          <span className="text-destructive ml-2">
                            (Estoque insuficiente)
                          </span>
                        )}
                    </p>
                  )}
                  {selectedItem && movementType === 'SERVICE' && (
                    <p className="text-sm text-muted-foreground">
                      Serviço selecionado: <strong>{selectedItem.name}</strong>
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Quantidade - Oculto para serviços */}
            {movementType === 'PRODUCT' && (
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Quantidade <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="1"
                  min="1"
                  placeholder="Ex: 1"
                  {...register('quantity', {
                    onChange: (e) => {
                      // Garantir que apenas números inteiros sejam aceitos
                      const value = e.target.value;
                      if (value && value.includes('.')) {
                        e.target.value = Math.floor(
                          parseFloat(value),
                        ).toString();
                      }
                    },
                  })}
                  className={cn(
                    (errors.quantity || quantityError) && 'border-destructive',
                  )}
                />
                {(errors.quantity || quantityError) && (
                  <p className="text-sm text-destructive">
                    {quantityError || errors.quantity?.message}
                  </p>
                )}
              </div>
            )}

            {/* Informações do Cliente */}
            <div className="space-y-2">
              <Label htmlFor="customerName">
                Nome do Cliente <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerName"
                type="text"
                placeholder="Ex: João Silva"
                {...register('customerName')}
                className={cn(errors.customerName && 'border-destructive')}
              />
              {errors.customerName && (
                <p className="text-sm text-destructive">
                  {errors.customerName.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerCpf">CPF (Opcional)</Label>
                <Input
                  id="customerCpf"
                  type="text"
                  placeholder="000.000.000-00"
                  {...register('customerCpf')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Email (Opcional)</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="cliente@email.com"
                  {...register('customerEmail')}
                  className={cn(errors.customerEmail && 'border-destructive')}
                />
                {errors.customerEmail && (
                  <p className="text-sm text-destructive">
                    {errors.customerEmail.message}
                  </p>
                )}
              </div>
            </div>

            {/* Forma de Pagamento */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">
                Forma de Pagamento <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch('paymentMethod') || 'PIX'}
                onValueChange={(
                  value: 'PIX' | 'CARTAO' | 'BOLETO' | 'ESPECIE',
                ) => setValue('paymentMethod', value)}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="CARTAO">Cartão</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="ESPECIE">Espécie</SelectItem>
                </SelectContent>
              </Select>
              {errors.paymentMethod && (
                <p className="text-sm text-destructive">
                  {errors.paymentMethod.message}
                </p>
              )}
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="observations">Observações</Label>
              <textarea
                id="observations"
                rows={3}
                placeholder="Observações adicionais sobre a movimentação..."
                {...register('observations')}
                className={cn(
                  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                  errors.observations && 'border-destructive',
                )}
              />
            </div>

            {/* Informação de quem registrou */}
            {user && (
              <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                Registrado por: <strong>{user.name || user.email}</strong>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/movements">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading || isLoadingItems}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Movimentação
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Scanner de código de barras */}
      {movementType === 'PRODUCT' && (
        <BarcodeScanner
          isOpen={scannerOpen}
          onScanSuccess={handleScanSuccess}
          onClose={() => setScannerOpen(false)}
        />
      )}
    </div>
  );
}
