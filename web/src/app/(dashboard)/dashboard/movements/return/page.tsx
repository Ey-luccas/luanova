/**
 * Página de Cadastro de Devolução/Reembolso
 *
 * Formulário para registrar uma devolução ou reembolso.
 * Envia para: POST /api/companies/{companyId}/sales/return
 */

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
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
  Search,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Schema de validação
const returnSchema = z
  .object({
    saleId: z.string().min(1, 'Venda é obrigatória'),
    type: z.enum(['RETURN', 'REFUND', 'EXCHANGE'], {
      errorMap: () => ({
        message: 'Tipo deve ser "Devolução", "Reembolso" ou "Troca"',
      }),
    }),
    quantity: z.string().optional(),
    returnAction: z.enum(['RESTOCK', 'MAINTENANCE']).optional(),
    refundAmount: z.string().optional(),
    exchangeProductId: z.string().optional(),
    exchangeQuantity: z.string().optional(),
    additionalPayment: z.string().optional(), // Valor adicional pago pelo cliente na troca
    observations: z.string().optional(),
  })
  .refine(
    (data) => {
      // Se for devolução, quantidade e returnAction são obrigatórios
      if (data.type === 'RETURN') {
        if (!data.quantity || data.quantity.trim() === '') {
          return false;
        }
        const quantity = parseFloat(data.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          return false;
        }
        if (!data.returnAction) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Quantidade é obrigatória e deve ser maior que zero',
      path: ['quantity'],
    },
  )
  .refine(
    (data) => {
      // Se for devolução, returnAction é obrigatório
      if (data.type === 'RETURN' && !data.returnAction) {
        return false;
      }
      return true;
    },
    {
      message: 'Ação é obrigatória',
      path: ['returnAction'],
    },
  )
  .refine(
    (data) => {
      // Se for reembolso, refundAmount é obrigatório
      if (data.type === 'REFUND') {
        if (!data.refundAmount || data.refundAmount.trim() === '') {
          return false;
        }
        const amount = parseFloat(data.refundAmount);
        if (isNaN(amount) || amount <= 0) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Valor devolvido é obrigatório e deve ser maior que zero',
      path: ['refundAmount'],
    },
  )
  .refine(
    (data) => {
      // Se for troca, exchangeProductId e exchangeQuantity são obrigatórios
      if (data.type === 'EXCHANGE') {
        if (!data.exchangeProductId || data.exchangeProductId.trim() === '') {
          return false;
        }
        if (!data.exchangeQuantity || data.exchangeQuantity.trim() === '') {
          return false;
        }
        const quantity = parseFloat(data.exchangeQuantity);
        if (isNaN(quantity) || quantity <= 0) {
          return false;
        }
        // Para troca, quantidade devolvida será definida automaticamente como a quantidade vendida
        // Não precisa validar aqui
      }
      return true;
    },
    {
      message: 'Produto e quantidade para troca são obrigatórios',
      path: ['exchangeProductId'],
    },
  );

type ReturnFormData = z.infer<typeof returnSchema>;

interface Sale {
  id: number;
  type: 'SALE' | 'SERVICE';
  quantity: number;
  customerName: string;
  customerCpf?: string | null;
  customerEmail?: string | null;
  createdAt: string;
  product: {
    id: number;
    name: string;
    barcode?: string | null;
    unitPrice?: number | null;
  };
}

interface Product {
  id: number;
  name: string;
  unitPrice?: number | null;
  currentStock: number;
  barcode?: string | null;
  isService?: boolean;
}

export default function ReturnPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [foundSales, setFoundSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Critérios de busca
  const [searchCustomerName, setSearchCustomerName] = useState('');
  const [searchCustomerEmail, setSearchCustomerEmail] = useState('');
  const [searchCustomerCpf, setSearchCustomerCpf] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      type: 'RETURN',
      returnAction: 'RESTOCK',
    },
  });

  const saleId = watch('saleId');
  const quantity = watch('quantity');
  const returnAction = watch('returnAction');
  const type = watch('type');
  const refundAmount = watch('refundAmount');
  const exchangeProductId = watch('exchangeProductId');
  const exchangeQuantity = watch('exchangeQuantity');
  const additionalPayment = watch('additionalPayment');

  // Buscar produtos quando o componente carregar
  useEffect(() => {
    if (isAuthenticated) {
      fetchProducts();
    }
  }, [isAuthenticated]);

  const fetchProducts = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) return;

      const response = await api.get(`/companies/${companyId}/products`, {
        params: {
          isService: 'false',
          isActive: 'true',
          limit: 1000,
        },
      });

      const data = response.data?.data || response.data || {};
      const allProducts = data.products || [];
      setProducts(allProducts.filter((p: Product) => p.isService !== true));
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    }
  };

  // Limpar campos quando o tipo mudar
  useEffect(() => {
    if (type === 'RETURN') {
      setValue('refundAmount', '');
      setValue('exchangeProductId', '');
      setValue('exchangeQuantity', '');
    } else if (type === 'REFUND') {
      setValue('quantity', '');
      setValue('returnAction', undefined);
      setValue('exchangeProductId', '');
      setValue('exchangeQuantity', '');
    } else if (type === 'EXCHANGE') {
      setValue('refundAmount', '');
      setValue('returnAction', 'RESTOCK');
      setValue('additionalPayment', '');
    }
  }, [type, setValue]);

  // Busca vendas por cliente
  const searchSales = useCallback(async () => {
    try {
      setIsSearching(true);
      setError(null);

      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        setError('Empresa não selecionada.');
        return;
      }

      const params: any = {};
      if (searchCustomerName) params.customerName = searchCustomerName;
      if (searchCustomerEmail) params.customerEmail = searchCustomerEmail;
      if (searchCustomerCpf) params.customerCpf = searchCustomerCpf;

      // Se não há critérios de busca, não busca
      if (
        !params.customerName &&
        !params.customerEmail &&
        !params.customerCpf
      ) {
        setFoundSales([]);
        return;
      }

      const response = await api.get(`/companies/${companyId}/sales/search`, {
        params,
      });

      const data = response.data?.data || response.data || {};
      const sales = data.sales || [];
      setFoundSales(Array.isArray(sales) ? sales : []);

      if (sales.length === 0) {
        setError('Nenhuma venda encontrada com os critérios informados.');
      }
    } catch (err: any) {
      console.error('Erro ao buscar vendas:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao buscar vendas. Tente novamente.',
      );
      setFoundSales([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchCustomerName, searchCustomerEmail, searchCustomerCpf]);

  const selectedSale = foundSales.find((s) => s.id === parseInt(saleId || '0'));

  // Para troca, definir quantidade automaticamente quando venda for selecionada
  useEffect(() => {
    if (type === 'EXCHANGE' && selectedSale) {
      setValue('quantity', selectedSale.quantity.toString());
    }
  }, [type, selectedSale, setValue]);

  // Quando selecionar uma venda, ajustar tipo se necessário
  useEffect(() => {
    if (selectedSale) {
      if (selectedSale.type === 'SERVICE' && type !== 'REFUND') {
        // Se for serviço, forçar tipo REFUND
        setValue('type', 'REFUND');
      } else if (selectedSale.type === 'SALE' && !type) {
        // Se for produto e não tiver tipo definido, usar RETURN
        setValue('type', 'RETURN');
      }
    }
  }, [selectedSale, type, setValue]);

  const onSubmit = async (data: ReturnFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validação adicional para troca com diferença positiva
      if (
        data.type === 'EXCHANGE' &&
        selectedSale &&
        exchangeProductId &&
        exchangeQuantity
      ) {
        const returnProduct = selectedSale.product;
        const returnQuantity = selectedSale.quantity;
        const returnPrice = returnProduct.unitPrice
          ? Number(returnProduct.unitPrice)
          : 0;
        const returnTotal = returnPrice * returnQuantity;

        const exchangeProduct = products.find(
          (p) => p.id === parseInt(exchangeProductId),
        );
        const exchangeQty = parseFloat(exchangeQuantity);
        const exchangePrice = exchangeProduct?.unitPrice
          ? Number(exchangeProduct.unitPrice)
          : 0;
        const exchangeTotal = exchangePrice * exchangeQty;

        const difference = exchangeTotal - returnTotal;

        // Se houver diferença positiva, validar valor adicional pago
        if (difference > 0) {
          if (!data.additionalPayment || data.additionalPayment.trim() === '') {
            setError(
              'Valor adicional pago é obrigatório quando o produto novo é mais caro.',
            );
            setIsLoading(false);
            return;
          }
          const additionalPaymentValue = parseFloat(data.additionalPayment);
          if (isNaN(additionalPaymentValue) || additionalPaymentValue <= 0) {
            setError('Valor adicional pago deve ser maior que zero.');
            setIsLoading(false);
            return;
          }
          // Permite valor menor que a diferença, mas será registrado no banco
          // Não bloqueia o registro, apenas avisa visualmente
        }
      }

      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        setError('Empresa não selecionada.');
        setIsLoading(false);
        return;
      }

      // Preparar dados para envio
      const payload: any = {
        saleId: parseInt(data.saleId),
        type: data.type,
        observations: data.observations || null,
      };

      // Se for devolução, incluir quantity e returnAction
      if (data.type === 'RETURN') {
        payload.quantity = parseFloat(data.quantity || '0');
        payload.returnAction = data.returnAction;
      }

      // Se for reembolso, incluir refundAmount
      if (data.type === 'REFUND') {
        payload.refundAmount = parseFloat(data.refundAmount || '0');
      }

      // Se for troca, incluir dados da troca
      if (data.type === 'EXCHANGE') {
        // Para troca, quantidade devolvida é sempre igual à quantidade vendida
        payload.quantity = selectedSale
          ? selectedSale.quantity
          : parseFloat(data.quantity || '0');
        payload.returnAction = 'RESTOCK'; // Troca sempre volta ao estoque
        payload.exchangeProductId = parseInt(data.exchangeProductId || '0');
        payload.exchangeQuantity = parseFloat(data.exchangeQuantity || '0');

        // Se houver valor adicional pago, incluir
        if (data.additionalPayment) {
          payload.additionalPayment = parseFloat(data.additionalPayment);
        }
      }

      await api.post(`/companies/${companyId}/sales/return`, payload);

      // Redirecionar para lista de vendas
      router.push('/dashboard/movements');
    } catch (err: any) {
      console.error('Erro ao registrar devolução:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao registrar devolução. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href="/dashboard/movements">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Nova Devolução/Reembolso/Troca</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Busque a venda original e registre a devolução, reembolso ou troca
          </p>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl md:text-2xl">Buscar Venda Original</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Busque a venda pelo nome do cliente, email, CPF ou data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="searchName" className="text-xs sm:text-sm">Nome</Label>
                <Input
                  id="searchName"
                  type="text"
                  placeholder="Nome do cliente"
                  value={searchCustomerName}
                  onChange={(e) => setSearchCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="searchEmail" className="text-xs sm:text-sm">Email</Label>
                <Input
                  id="searchEmail"
                  type="email"
                  placeholder="Email do cliente"
                  value={searchCustomerEmail}
                  onChange={(e) => setSearchCustomerEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="searchCpf" className="text-xs sm:text-sm">CPF</Label>
                <Input
                  id="searchCpf"
                  type="text"
                  placeholder="CPF do cliente"
                  value={searchCustomerCpf}
                  onChange={(e) => setSearchCustomerCpf(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={searchSales}
              disabled={
                isSearching ||
                (!searchCustomerName &&
                  !searchCustomerEmail &&
                  !searchCustomerCpf)
              }
              className="w-full"
            >
              {isSearching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Search className="mr-2 h-4 w-4" />
              Buscar Vendas
            </Button>

            {foundSales.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Vendas Encontradas</Label>
                <div className="border rounded-md max-h-48 sm:max-h-64 overflow-y-auto">
                  {foundSales.map((sale) => (
                    <button
                      key={sale.id}
                      type="button"
                      onClick={() => {
                        setValue('saleId', sale.id.toString());
                        setValue('quantity', sale.quantity.toString());
                        // Se for serviço, definir tipo como REFUND automaticamente
                        if (sale.type === 'SERVICE') {
                          setValue('type', 'REFUND');
                        } else {
                          // Se for produto, resetar para RETURN
                          setValue('type', 'RETURN');
                        }
                      }}
                      className={cn(
                        'w-full text-left p-2 sm:p-3 border-b last:border-b-0 hover:bg-accent transition-colors',
                        saleId === sale.id.toString() && 'bg-accent',
                      )}
                    >
                      <div className="font-medium text-xs sm:text-sm truncate">{sale.product.name}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                        Cliente: {sale.customerName}
                        {sale.customerCpf && ` (CPF: ${sale.customerCpf})`}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {format(
                          new Date(sale.createdAt),
                          "dd/MM/yyyy 'às' HH:mm",
                          {
                            locale: ptBR,
                          },
                        )}{' '}
                        - Qtd: {sale.quantity}
                        {sale.product.unitPrice &&
                          ` - R$ ${Number(
                            sale.product.unitPrice,
                          ).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        Tipo: {sale.type === 'SALE' ? 'Venda' : 'Serviço'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl md:text-2xl">Informações da Devolução/Reembolso/Troca</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Preencha os dados da devolução, reembolso ou troca abaixo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {error && (
            <Alert variant="destructive" className="mb-4 text-xs sm:text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-xs sm:text-sm">
                Tipo <span className="text-destructive">*</span>
              </Label>
              <Select
                value={
                  watch('type') ||
                  (selectedSale?.type === 'SERVICE' ? 'REFUND' : 'RETURN')
                }
                onValueChange={(value: 'RETURN' | 'REFUND' | 'EXCHANGE') =>
                  setValue('type', value)
                }
                disabled={!selectedSale}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {selectedSale?.type === 'SERVICE' ? (
                    // Para serviços, apenas reembolso
                    <SelectItem value="REFUND">Reembolso</SelectItem>
                  ) : (
                    // Para produtos, todas as opções
                    <>
                      <SelectItem value="RETURN">Devolução</SelectItem>
                      <SelectItem value="REFUND">Reembolso</SelectItem>
                      <SelectItem value="EXCHANGE">Troca</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-destructive">
                  {errors.type.message}
                </p>
              )}
              {!selectedSale && (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Selecione uma venda primeiro para escolher o tipo
                </p>
              )}
            </div>

            {selectedSale && (
              <div className="p-3 sm:p-4 bg-muted rounded-md space-y-2">
                <div className="font-medium text-xs sm:text-sm">Venda Selecionada:</div>
                <div className="text-xs sm:text-sm">
                  <strong>Produto:</strong> <span className="truncate block">{selectedSale.product.name}</span>
                </div>
                <div className="text-xs sm:text-sm">
                  <strong>Cliente:</strong> {selectedSale.customerName}
                  {selectedSale.customerCpf &&
                    ` (CPF: ${selectedSale.customerCpf})`}
                </div>
                <div className="text-xs sm:text-sm">
                  <strong>Quantidade Vendida:</strong> {selectedSale.quantity}
                </div>
                {selectedSale.product.unitPrice && (
                  <div className="text-xs sm:text-sm">
                    <strong>Valor Unitário:</strong> R${' '}
                    {Number(selectedSale.product.unitPrice).toLocaleString(
                      'pt-BR',
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      },
                    )}
                  </div>
                )}
                <div className="text-xs sm:text-sm">
                  <strong>Data da Venda:</strong>{' '}
                  {format(
                    new Date(selectedSale.createdAt),
                    "dd/MM/yyyy 'às' HH:mm",
                    { locale: ptBR },
                  )}
                </div>
              </div>
            )}

            {/* Campos para Devolução */}
            {type === 'RETURN' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-xs sm:text-sm">
                    Quantidade a Devolver{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="1"
                    min="1"
                    placeholder="Ex: 1"
                    {...register('quantity')}
                    className={cn(errors.quantity && 'border-destructive')}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-destructive">
                      {errors.quantity.message}
                    </p>
                  )}
                  {selectedSale &&
                    parseFloat(quantity || '0') > selectedSale.quantity && (
                      <p className="text-sm text-destructive">
                        Quantidade não pode ser maior que a quantidade vendida (
                        {selectedSale.quantity})
                      </p>
                    )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="returnAction" className="text-xs sm:text-sm">
                    O que fazer com o produto?{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={returnAction || 'RESTOCK'}
                    onValueChange={(value: 'RESTOCK' | 'MAINTENANCE') =>
                      setValue('returnAction', value)
                    }
                  >
                    <SelectTrigger id="returnAction">
                      <SelectValue placeholder="Selecione a ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RESTOCK">Voltar ao Estoque</SelectItem>
                      <SelectItem value="MAINTENANCE">
                        Marcar para Manutenção
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.returnAction && (
                    <p className="text-sm text-destructive">
                      {errors.returnAction.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {returnAction === 'RESTOCK'
                      ? 'O produto voltará ao estoque e estará disponível para novas vendas.'
                      : 'O produto será marcado como devolvido e não voltará ao estoque automaticamente.'}
                  </p>
                </div>
              </>
            )}

            {/* Campo para Reembolso */}
            {type === 'REFUND' && (
              <div className="space-y-2">
                <Label htmlFor="refundAmount" className="text-xs sm:text-sm">
                  Valor Devolvido <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="refundAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ex: 100.00"
                  {...register('refundAmount')}
                  className={cn(errors.refundAmount && 'border-destructive')}
                />
                {errors.refundAmount && (
                  <p className="text-sm text-destructive">
                    {errors.refundAmount.message}
                  </p>
                )}
                {errors.quantity &&
                  errors.quantity.message?.includes('Dados inválidos') && (
                    <p className="text-sm text-destructive">
                      Valor deve ser maior que zero
                    </p>
                  )}
              </div>
            )}

            {/* Campos para Troca */}
            {type === 'EXCHANGE' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="exchangeProductId" className="text-xs sm:text-sm">
                    Produto para Troca{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={exchangeProductId || ''}
                    onValueChange={(value) =>
                      setValue('exchangeProductId', value)
                    }
                  >
                    <SelectTrigger id="exchangeProductId">
                      <SelectValue placeholder="Selecione o produto para troca" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id.toString()}
                        >
                          {product.name}
                          {product.unitPrice &&
                            ` - R$ ${Number(product.unitPrice).toLocaleString(
                              'pt-BR',
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              },
                            )}`}
                          {product.currentStock !== undefined &&
                            ` (Estoque: ${product.currentStock})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.exchangeProductId && (
                    <p className="text-sm text-destructive">
                      {errors.exchangeProductId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exchangeQuantity" className="text-xs sm:text-sm">
                    Quantidade do Novo Produto{' '}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="exchangeQuantity"
                    type="number"
                    step="1"
                    min="1"
                    placeholder="Ex: 1"
                    {...register('exchangeQuantity')}
                    className={cn(
                      errors.exchangeQuantity && 'border-destructive',
                    )}
                  />
                  {errors.exchangeQuantity && (
                    <p className="text-sm text-destructive">
                      {errors.exchangeQuantity.message}
                    </p>
                  )}
                  {exchangeProductId &&
                    products.find(
                      (p) => p.id === parseInt(exchangeProductId),
                    ) && (
                      <p className="text-sm text-muted-foreground">
                        Estoque disponível:{' '}
                        {
                          products.find(
                            (p) => p.id === parseInt(exchangeProductId),
                          )?.currentStock
                        }
                      </p>
                    )}
                </div>

                {/* Cálculo da diferença de valores */}
                {selectedSale &&
                  exchangeProductId &&
                  exchangeQuantity &&
                  parseFloat(exchangeQuantity) > 0 && (
                    <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                      <div className="font-medium text-xs sm:text-sm text-blue-900 dark:text-blue-100 mb-2">
                        Resumo da Troca:
                      </div>
                      {(() => {
                        const returnProduct = selectedSale.product;
                        // Para troca, quantidade devolvida é sempre igual à quantidade vendida
                        const returnQuantity = selectedSale.quantity;
                        const returnPrice = returnProduct.unitPrice
                          ? Number(returnProduct.unitPrice)
                          : 0;
                        const returnTotal = returnPrice * returnQuantity;

                        const exchangeProduct = products.find(
                          (p) => p.id === parseInt(exchangeProductId || '0'),
                        );
                        const exchangeQty = parseFloat(exchangeQuantity || '0');
                        const exchangePrice = exchangeProduct?.unitPrice
                          ? Number(exchangeProduct.unitPrice)
                          : 0;
                        const exchangeTotal = exchangePrice * exchangeQty;

                        const difference = exchangeTotal - returnTotal;

                        return (
                          <div className="space-y-1 text-xs sm:text-sm">
                            <div>
                              <strong>Valor do produto devolvido:</strong> R${' '}
                              {returnTotal.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div>
                              <strong>Valor do produto novo:</strong> R${' '}
                              {exchangeTotal.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                              {difference > 0 ? (
                                <>
                                  <div className="text-green-700 dark:text-green-300 font-semibold mb-3">
                                    <strong>Cliente deve pagar:</strong> R${' '}
                                    {difference.toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="additionalPayment" className="text-xs sm:text-sm">
                                      Valor Adicional Pago{' '}
                                      <span className="text-destructive">
                                        *
                                      </span>
                                    </Label>
                                    <Input
                                      id="additionalPayment"
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      placeholder={`Ex: ${difference.toFixed(
                                        2,
                                      )}`}
                                      {...register('additionalPayment')}
                                      className={cn(
                                        errors.additionalPayment &&
                                          'border-destructive',
                                      )}
                                    />
                                    {errors.additionalPayment && (
                                      <p className="text-sm text-destructive">
                                        {errors.additionalPayment.message}
                                      </p>
                                    )}
                                    {additionalPayment &&
                                      parseFloat(additionalPayment) <
                                        difference && (
                                        <p className="text-sm text-orange-600 dark:text-orange-400">
                                          <strong>Atenção:</strong> Valor
                                          informado (R${' '}
                                          {parseFloat(
                                            additionalPayment,
                                          ).toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}
                                          ) é menor que a diferença necessária
                                          (R${' '}
                                          {difference.toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                          })}
                                          ). Esta informação será registrada no
                                          banco de dados.
                                        </p>
                                      )}
                                  </div>
                                </>
                              ) : difference < 0 ? (
                                <div className="text-orange-700 dark:text-orange-300 font-semibold">
                                  <strong>Troco a devolver:</strong> R${' '}
                                  {Math.abs(difference).toLocaleString(
                                    'pt-BR',
                                    {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    },
                                  )}
                                </div>
                              ) : (
                                <div className="text-blue-700 dark:text-blue-300 font-semibold">
                                  <strong>Troca sem diferença de valor</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="observations" className="text-xs sm:text-sm">Observações</Label>
              <textarea
                id="observations"
                rows={3}
                placeholder="Motivo da devolução ou outras observações..."
                {...register('observations')}
                className={cn(
                  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground placeholder:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                  errors.observations && 'border-destructive',
                )}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-2">
              <Link href="/dashboard/movements" className="w-full sm:w-auto">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isLoading || !selectedSale || !saleId}
                className="w-full sm:w-auto"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <RotateCcw className="mr-2 h-4 w-4" />
                {type === 'REFUND'
                  ? 'Registrar Reembolso'
                  : type === 'EXCHANGE'
                  ? 'Registrar Troca'
                  : 'Registrar Devolução'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
