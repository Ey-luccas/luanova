/**
 * Página de Cadastro de Produto
 *
 * Formulário para cadastrar um novo produto.
 * Envia para: POST /api/companies/{companyId}/products
 */

'use client';

import React, { useEffect, useState } from 'react';
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
}

export default function NewProductPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useScanner, setUseScanner] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [showAfterScanDialog, setShowAfterScanDialog] = useState(false);
  const [existingProducts, setExistingProducts] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

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

    // Buscar produtos existentes com esse código
    setSearchingProducts(true);
    try {
      const companyId = localStorage.getItem('companyId');
      if (companyId) {
        // Buscar produto por código de barras
        try {
          const response = await api.get(
            `/companies/${companyId}/products/barcode/${barcode}`,
          );
          const product = response.data?.data?.product;
          if (product) {
            setExistingProducts([product]);
          } else {
            setExistingProducts([]);
          }
        } catch (err: any) {
          // Produto não encontrado - OK, pode criar novo
          if (err.response?.status !== 404) {
            console.error('Erro ao buscar produto:', err);
          }
          setExistingProducts([]);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setExistingProducts([]);
    } finally {
      setSearchingProducts(false);
      setShowAfterScanDialog(true);
    }
  };

  const handleSelectExistingProduct = (product: Product) => {
    // Preencher formulário com dados do produto existente
    setValue('name', product.name);
    if (product.barcode) {
      setValue('barcode', product.barcode);
    }
    setShowAfterScanDialog(false);
    setScannedBarcode(null);
    setExistingProducts([]);
  };

  const handleCreateNewProduct = () => {
    // Preencher apenas o código de barras
    if (scannedBarcode) {
      setValue('barcode', scannedBarcode);
    }
    setShowAfterScanDialog(false);
    setScannedBarcode(null);
    setExistingProducts([]);
  };

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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Novo Produto</h1>
          <p className="text-muted-foreground mt-2">
            Cadastre um novo produto no catálogo
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
          <CardDescription>Preencha os dados do produto abaixo</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Opção de modo: Normal ou Scanner */}
          <div className="mb-6 p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">
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
                className="flex-1"
              >
                <Package className="h-4 w-4 mr-2" />
                Cadastro Manual
              </Button>
              <Button
                type="button"
                variant={useScanner ? 'default' : 'outline'}
                onClick={() => setUseScanner(true)}
                className="flex-1"
              >
                <Scan className="h-4 w-4 mr-2" />
                Escanear Código
              </Button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Campo de código de barras - sempre visível */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="barcode">Código de Barras</Label>
                {useScanner && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScannerOpen(true)}
                    className="gap-2"
                  >
                    <Scan className="h-4 w-4" />
                    Escanear
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
              <Label htmlFor="name">
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
              <Label htmlFor="categoryId">Categoria</Label>
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Preço de Custo (R$)</Label>
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
                <Label htmlFor="salePrice">Preço de Venda (R$)</Label>
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
              <Label htmlFor="currentStock">Estoque Qtd</Label>
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
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Salvar como rascunho
              </Label>
            </div>

            <div className="flex justify-end gap-4">
              <Link href="/dashboard/products">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={isLoading}>
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

      {/* Dialog após escanear - opções */}
      <Dialog open={showAfterScanDialog} onOpenChange={setShowAfterScanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Código Escaneado</DialogTitle>
            <DialogDescription>
              Código de barras: <strong>{scannedBarcode}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {searchingProducts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Buscando produtos...</span>
              </div>
            ) : existingProducts.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Produto encontrado com este código:
                </p>
                {existingProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleSelectExistingProduct(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        {product.barcode && (
                          <p className="text-sm text-muted-foreground">
                            Código: {product.barcode}
                          </p>
                        )}
                      </div>
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleCreateNewProduct}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Novo Produto com Este Código
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Nenhum produto encontrado com este código de barras.
                </p>
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleCreateNewProduct}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Novo Produto
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
