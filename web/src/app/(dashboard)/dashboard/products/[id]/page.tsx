/**
 * Página de Edição de Produto
 * 
 * Formulário para editar um produto existente.
 * Envia para: PUT /api/companies/{companyId}/products/{productId}
 */

"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Schema de validação
const productSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  categoryId: z.string().optional().nullable(),
  costPrice: z.string().optional(),
  salePrice: z.string().optional(),
  currentStock: z.string().optional(),
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
  categoryId?: number | null;
  costPrice?: number | null;
  unitPrice?: number | null;
  currentStock?: number | null;
  isActive: boolean;
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const categoryId = watch("categoryId");
  const isActive = watch("isActive");

  useEffect(() => {
    if (isAuthenticated && productId) {
      fetchCategories();
      fetchProduct();
    }
  }, [isAuthenticated, productId]);

  const fetchCategories = async () => {
    try {
      const companyId = localStorage.getItem("companyId");
      if (!companyId) return;

      const response = await api.get(`/companies/${companyId}/categories`);
      const { categories: categoriesData } = response.data.data;
      setCategories(categoriesData);
    } catch (err) {
      console.error("Erro ao buscar categorias:", err);
    }
  };

  const fetchProduct = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const companyId = localStorage.getItem("companyId");
      if (!companyId) {
        setError("Empresa não selecionada.");
        setIsLoading(false);
        return;
      }

      // Buscar produto da lista (já que não há endpoint GET específico)
      const response = await api.get(`/companies/${companyId}/products`, {
        params: { limit: 1000 },
      });

      const data = response.data.data || response.data;
      const products = data.products || [];
      const foundProduct = products.find(
        (p: Product) => p.id === parseInt(productId)
      );

      if (!foundProduct) {
        setError("Produto não encontrado.");
        setIsLoading(false);
        return;
      }

      setProduct(foundProduct);

      // Preencher formulário com dados do produto
      setValue("name", foundProduct.name);
      setValue(
        "categoryId",
        foundProduct.categoryId ? foundProduct.categoryId.toString() : null
      );
      setValue(
        "costPrice",
        foundProduct.costPrice ? foundProduct.costPrice.toString() : ""
      );
      setValue(
        "salePrice",
        foundProduct.unitPrice ? foundProduct.unitPrice.toString() : ""
      );
      // Preenche o campo de estoque com currentStock (quantidade única)
      setValue(
        "currentStock",
        foundProduct.currentStock != null ? Math.floor(Number(foundProduct.currentStock)).toString() : ""
      );
      setValue("isActive", foundProduct.isActive);
    } catch (err: any) {
      console.error("Erro ao buscar produto:", err);
      setError(
        err.response?.data?.message || "Erro ao carregar produto. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsSaving(true);
      setError(null);

      const companyId = localStorage.getItem("companyId");
      if (!companyId) {
        setError("Empresa não selecionada.");
        setIsSaving(false);
        return;
      }

      // Preparar dados para envio
      // Código de barras será gerado automaticamente pelo sistema
      // Usa currentStock como a quantidade única de estoque
      const payload: any = {
        name: data.name,
        categoryId: data.categoryId ? parseInt(data.categoryId) : null,
        costPrice: data.costPrice ? parseFloat(data.costPrice) : null,
        unitPrice: data.salePrice ? parseFloat(data.salePrice) : null,
        currentStock: data.currentStock && data.currentStock.trim() ? parseInt(data.currentStock.trim(), 10) : 0,
        isActive: data.isActive,
      };

      await api.put(`/companies/${companyId}/products/${productId}`, payload);

      // Redirecionar para lista de produtos
      router.push("/dashboard/products");
    } catch (err: any) {
      console.error("Erro ao atualizar produto:", err);
      setError(
        err.response?.data?.message || "Erro ao atualizar produto. Tente novamente."
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Carregando produto...</p>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Link href="/dashboard/products">
          <Button variant="outline">Voltar para lista</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Editar Produto</h1>
          <p className="text-muted-foreground mt-2">
            Atualize as informações do produto
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Informações do Produto</CardTitle>
          <CardDescription>
            Edite os dados do produto abaixo
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
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome do Produto <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                className={cn(errors.name && "border-destructive")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoria</Label>
              <Select
                value={categoryId || undefined}
                onValueChange={(value) => setValue("categoryId", value || null)}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Selecione uma categoria (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
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
                  {...register("costPrice")}
                  className={cn(errors.costPrice && "border-destructive")}
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
                  {...register("salePrice")}
                  className={cn(errors.salePrice && "border-destructive")}
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
                {...register("currentStock")}
                className={cn(errors.currentStock && "border-destructive")}
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
                  setValue("isActive", checked !== true)
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
              <Button type="submit" disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

