/**
 * Página de Cadastro de Produto
 *
 * Formulário para cadastrar um novo produto.
 * Envia para: POST /api/companies/{companyId}/products
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Scan,
  Package,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BarcodeScanner } from '@/components/BarcodeScanner';

// Schema de validação
const productSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  categoryId: z.string().optional().nullable(),
  costPrice: z.string().optional(),
  salePrice: z.string().optional(),
  currentStock: z.string().optional(),
  barcode: z.string().optional(),
  isActive: z.boolean().default(false), // Padrão: rascunho (isActive = false)
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  barcode?: string | null;
  currentStock?: number;
}

export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useScanner, setUseScanner] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [showAfterScanDialog, setShowAfterScanDialog] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [addingStock, setAddingStock] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive: false, // Por padrão, produtos novos começam como rascunho (isActive = false)
      barcode: '',
    },
  });

  const barcode = watch('barcode');

  const categoryId = watch('categoryId');
  const isActive = watch('isActive');

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

  // Lê o código de barras da query string se houver
  useEffect(() => {
    const barcodeFromQuery = searchParams?.get('barcode');
    if (barcodeFromQuery) {
      setValue('barcode', barcodeFromQuery);
      // Opcional: abrir o dialog de opções após escanear
      setScannedBarcode(barcodeFromQuery);
      setShowAfterScanDialog(true);
    }
  }, [searchParams, setValue]);

  const fetchCategories = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) return;

      const response = await api.get(`/companies/${companyId}/categories`);
      const { categories: categoriesData } = response.data.data;
      setCategories(categoriesData);
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
    }
  };

  const handleScanSuccess = async (barcode: string) => {
    setScannedBarcode(barcode);
    setScannerOpen(false);
    // Mostra dialog com opções
    setShowAfterScanDialog(true);
  };

  const handleAddNewProduct = () => {
    // Preencher código de barras escaneado e ir para formulário
    if (scannedBarcode) {
      setValue('barcode', scannedBarcode);
    }
    setShowAfterScanDialog(false);
    setScannedBarcode(null);
  };

  const handleSelectProduct = () => {
    // Abrir painel de seleção de produtos
    setShowAfterScanDialog(false);
    // Preencher busca com código escaneado se houver
    if (scannedBarcode) {
      setSearchTerm(scannedBarcode);
    }
    setShowProductSelector(true);
    fetchProducts();
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const companyId = localStorage.getItem('companyId');
      if (!companyId) return;

      const response = await api.get(`/companies/${companyId}/products`);
      const productsData = response.data?.data?.products || [];
      setProducts(productsData);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductClick = async (product: Product) => {
    if (selectedProductId === product.id) return; // Evita cliques duplicados

    try {
      setSelectedProductId(product.id);
      setAddingStock(true);
      setError(null);

      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        setError('Empresa não selecionada.');
        return;
      }

      // Criar movimentação de entrada (+1 estoque)
      await api.post(`/companies/${companyId}/movements`, {
        productId: product.id,
        type: 'IN',
        quantity: 1,
        reason: 'Adição automática via scanner de código de barras',
      });

      // Sucesso! Fechar dialog e redirecionar
      setShowProductSelector(false);
    setScannedBarcode(null);
      setSelectedProductId(null);
      
      // Redirecionar para lista de produtos
      router.push('/dashboard/products');
    } catch (err: any) {
      console.error('Erro ao adicionar estoque:', err);
      const errorMessage =
        err.response?.data?.message ||
        'Erro ao adicionar estoque. Tente novamente.';
      setError(errorMessage);
      setSelectedProductId(null);
    } finally {
      setAddingStock(false);
    }
  };

  // Filtrar produtos por termo de busca
  const filteredProducts = products.filter((product) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      product.name.toLowerCase().includes(term) ||
      (product.barcode && product.barcode.toLowerCase().includes(term))
    );
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        setError('Empresa não selecionada.');
        setIsLoading(false);
        return;
      }

      // Preparar dados para envio - ajustar para corresponder ao schema do backend
      const payload: any = {
        name: data.name.trim(),
        isActive: data.isActive !== undefined ? data.isActive : false, // Padrão: rascunho (isActive = false)
      };

      // Código de barras - se fornecido, usar; caso contrário, será gerado automaticamente
      if (data.barcode && data.barcode.trim()) {
        payload.barcode = data.barcode.trim();
      }

      if (
        data.categoryId &&
        data.categoryId !== '' &&
        data.categoryId !== 'null' &&
        data.categoryId !== null
      ) {
        const catId = parseInt(data.categoryId, 10);
        if (!isNaN(catId) && catId > 0) {
          payload.categoryId = catId;
        }
      }

      // Backend espera unitPrice (preço de venda)
      if (data.salePrice && data.salePrice.trim()) {
        const salePrice = parseFloat(data.salePrice);
        if (!isNaN(salePrice) && salePrice > 0) {
          payload.unitPrice = salePrice;
        }
      }

      // CostPrice (preço de custo) - pode ser null no backend
      if (data.costPrice && data.costPrice.trim()) {
        const costPrice = parseFloat(data.costPrice);
        if (!isNaN(costPrice) && costPrice > 0) {
          payload.costPrice = costPrice;
        }
      }

      // Estoque Qtd (quantidade de estoque) - número inteiro (unidades)
      // Usa currentStock como a quantidade única de estoque
      if (data.currentStock && data.currentStock.trim()) {
        const stock = parseInt(data.currentStock.trim(), 10);
        if (!isNaN(stock) && stock >= 0) {
          payload.currentStock = stock;
        }
      } else {
        // Se não informado, padrão é 0
        payload.currentStock = 0;
      }

      console.log('📦 Payload enviado:', JSON.stringify(payload, null, 2));

      const response = await api.post(
        `/companies/${companyId}/products`,
        payload,
      );

      console.log('✅ Produto criado com sucesso:', response.data);

      // Redirecionar para lista de produtos
      router.push('/dashboard/products');
    } catch (err: any) {
      console.error('Erro ao cadastrar produto:', err);
      console.error('Detalhes do erro:', {
        status: err.response?.status,
        message: err.response?.data?.message,
        errors: err.response?.data?.errors,
        data: err.response?.data,
      });

      // Mostrar erro mais detalhado ao usuário
      let errorMessage =
        err.response?.data?.message ||
        'Erro ao cadastrar produto. Tente novamente.';

      // Se houver erros de validação Zod, mostrar detalhes
      if (
        err.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        const zodErrors = err.response.data.errors
          .map(
            (e: any) =>
              e.message || `${e.path?.join('.')}: ${e.message || 'inválido'}`,
          )
          .join(', ');
        errorMessage = `Dados inválidos: ${zodErrors}`;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon" className="flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">Novo Produto</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Cadastre um novo produto no catálogo
          </p>
        </div>
      </div>

      <Card className="w-full">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl md:text-2xl">Informações do Produto</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Preencha os dados do produto abaixo</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Opção de modo: Normal ou Scanner */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <Label className="text-sm sm:text-base font-semibold">
                Modo de Cadastro
              </Label>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={!useScanner ? 'default' : 'outline'}
                onClick={() => {
                  setUseScanner(false);
                  setValue('barcode', '');
                }}
                className="flex-1 text-xs sm:text-sm"
              >
                <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">Cadastro Manual</span>
              </Button>
              <Button
                type="button"
                variant={useScanner ? 'default' : 'outline'}
                onClick={() => setUseScanner(true)}
                className="flex-1 text-xs sm:text-sm"
              >
                <Scan className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0" />
                <span className="truncate">Escanear Código</span>
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {/* Campo de código de barras - sempre visível */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="barcode" className="text-xs sm:text-sm">Código de Barras</Label>
                {useScanner && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScannerOpen(true)}
                    className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3 flex-shrink-0"
                  >
                    <Scan className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Escanear</span>
                  </Button>
                )}
              </div>
              <Input
                id="barcode"
                {...register('barcode')}
                placeholder="Digite ou escaneie o código de barras"
                readOnly={useScanner && !!scannedBarcode}
                className={cn(errors.barcode && 'border-destructive')}
              />
              {scannedBarcode && (
                <p className="text-sm text-muted-foreground">
                  Código escaneado: <strong>{scannedBarcode}</strong>
                </p>
              )}
              {errors.barcode && (
                <p className="text-sm text-destructive">
                  {errors.barcode.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm">
                Nome do Produto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
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
              <Label htmlFor="categoryId" className="text-xs sm:text-sm">Categoria</Label>
              <Select
                value={categoryId || undefined}
                onValueChange={(value) => setValue('categoryId', value || null)}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Selecione uma categoria (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id.toString()}
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="costPrice" className="text-xs sm:text-sm">Preço de Custo (R$)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('costPrice')}
                  className={cn(errors.costPrice && 'border-destructive')}
                />
                {errors.costPrice && (
                  <p className="text-sm text-destructive">
                    {errors.costPrice.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salePrice" className="text-xs sm:text-sm">Preço de Venda (R$)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('salePrice')}
                  className={cn(errors.salePrice && 'border-destructive')}
                />
                {errors.salePrice && (
                  <p className="text-sm text-destructive">
                    {errors.salePrice.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentStock" className="text-xs sm:text-sm">Estoque Qtd</Label>
              <Input
                id="currentStock"
                type="number"
                step="1"
                min="0"
                placeholder="Quantidade em estoque"
                {...register('currentStock')}
                className={cn(errors.currentStock && 'border-destructive')}
              />
              {errors.currentStock && (
                <p className="text-sm text-destructive">
                  {errors.currentStock.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={!isActive}
                onCheckedChange={(checked) =>
                  setValue('isActive', checked !== true)
                }
              />
              <Label
                htmlFor="isActive"
                className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Salvar como rascunho
              </Label>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 pt-2">
              <Link href="/dashboard/products" className="w-full sm:w-auto">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Produto
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Scanner de código de barras */}
      <BarcodeScanner
        isOpen={scannerOpen}
        onScanSuccess={handleScanSuccess}
        onClose={() => setScannerOpen(false)}
      />

      {/* Dialog após escanear - opções principais */}
      <Dialog open={showAfterScanDialog} onOpenChange={setShowAfterScanDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Código Escaneado</DialogTitle>
            <DialogDescription>
              Código de barras: <strong>{scannedBarcode}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <Button
              type="button"
              className="w-full"
              onClick={handleAddNewProduct}
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Adicionar Novo Produto
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleSelectProduct}
              size="lg"
            >
              <Package className="h-5 w-5 mr-2" />
              Selecionar Produto Existente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de seleção de produtos */}
      <Dialog open={showProductSelector} onOpenChange={setShowProductSelector}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Selecionar Produto</DialogTitle>
            <DialogDescription>
              Clique em um produto para adicionar +1 ao estoque
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0 space-y-4">
            {/* Busca */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código de barras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
              </div>
            </div>

            {/* Lista de produtos */}
            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Carregando produtos...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground">
                    {searchTerm
                      ? 'Nenhum produto encontrado'
                      : 'Nenhum produto cadastrado'}
                </p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className={cn(
                      'p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors',
                      selectedProductId === product.id && 'border-primary bg-primary/5',
                      addingStock && selectedProductId === product.id && 'opacity-50'
                    )}
                    onClick={() => handleProductClick(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        {product.barcode && (
                          <p className="text-sm text-muted-foreground">
                            Código: {product.barcode}
                          </p>
                        )}
                        {product.currentStock !== undefined && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Estoque: <strong>{product.currentStock}</strong> unidades
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        {addingStock && selectedProductId === product.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <Plus className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
              onClick={() => {
                setShowProductSelector(false);
                setSearchTerm('');
                setSelectedProductId(null);
              }}
                >
              Cancelar
                </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
