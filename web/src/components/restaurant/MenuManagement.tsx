/**
 * Componente de Gestão de Cardápio
 * 
 * CRUD completo de categorias e itens do cardápio
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
  Package,
  FolderTree,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
  description?: string | null;
  order: number;
  isActive: boolean;
  items?: MenuItem[];
}

interface MenuItem {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  preparationTime?: number | null;
  sizes?: string | null;
  sizesPrices?: string | null;
  allowHalf: boolean;
  allowThird: boolean;
  allowCombo: boolean;
  allowedAddons?: string | null;
  availableDays?: string | null;
  availableShifts?: string | null;
  isAvailable: boolean;
  order: number;
  category: {
    id: number;
    name: string;
  };
}

interface MenuManagementProps {
  companyId: string;
}

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  order: z.number().min(0).optional(),
});

const menuItemSchema = z.object({
  categoryId: z.string().min(1, 'Categoria é obrigatória'),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  price: z.string().min(1, 'Preço é obrigatório'),
  imageUrl: z.string().url().optional().or(z.literal('')),
  preparationTime: z.string().optional(),
  sizes: z.string().optional(),
  sizesPrices: z.string().optional(),
  allowHalf: z.boolean().optional(),
  allowThird: z.boolean().optional(),
  allowCombo: z.boolean().optional(),
  allowedAddons: z.string().optional(),
  availableDays: z.string().optional(),
  availableShifts: z.string().optional(),
  order: z.number().min(0).optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;
type MenuItemFormData = z.infer<typeof menuItemSchema>;

export function MenuManagement({ companyId }: MenuManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const {
    register: registerCategory,
    handleSubmit: handleSubmitCategory,
    reset: resetCategory,
    formState: { errors: errorsCategory },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const {
    register: registerItem,
    handleSubmit: handleSubmitItem,
    setValue: setValueItem,
    watch: watchItem,
    reset: resetItem,
    formState: { errors: errorsItem },
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
  });

  const allowHalf = watchItem('allowHalf');
  const allowThird = watchItem('allowThird');

  useEffect(() => {
    if (companyId) {
      fetchData();
    }
  }, [companyId]);

  const fetchData = async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [categoriesRes, itemsRes] = await Promise.all([
        api.get(`/companies/${companyId}/restaurant/menu/categories`),
        api.get(`/companies/${companyId}/restaurant/menu/items`),
      ]);

      setCategories(categoriesRes.data?.data || []);
      setMenuItems(itemsRes.data?.data || []);
    } catch (err: any) {
      console.error('Erro ao buscar cardápio:', err);
      setError('Erro ao carregar cardápio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (data: CategoryFormData) => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.post(`/companies/${companyId}/restaurant/menu/categories`, data);
      await fetchData();
      setShowCategoryDialog(false);
      resetCategory();
      setEditingCategory(null);
    } catch (err: any) {
      console.error('Erro ao criar categoria:', err);
      setError(err.response?.data?.message || 'Erro ao criar categoria');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCategory = async (data: CategoryFormData) => {
    if (!companyId || !editingCategory) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.put(
        `/companies/${companyId}/restaurant/menu/categories/${editingCategory.id}`,
        data,
      );
      await fetchData();
      setShowCategoryDialog(false);
      resetCategory();
      setEditingCategory(null);
    } catch (err: any) {
      console.error('Erro ao atualizar categoria:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar categoria');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!companyId) return;
    if (!confirm('Tem certeza que deseja remover esta categoria?')) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.delete(
        `/companies/${companyId}/restaurant/menu/categories/${categoryId}`,
      );
      await fetchData();
    } catch (err: any) {
      console.error('Erro ao remover categoria:', err);
      setError(err.response?.data?.message || 'Erro ao remover categoria');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateItem = async (data: MenuItemFormData) => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const payload: any = {
        ...data,
        categoryId: parseInt(data.categoryId, 10),
        price: parseFloat(data.price),
        preparationTime: data.preparationTime
          ? parseInt(data.preparationTime, 10)
          : undefined,
        sizes: data.sizes ? JSON.parse(data.sizes) : undefined,
        sizesPrices: data.sizesPrices ? JSON.parse(data.sizesPrices) : undefined,
        allowedAddons: data.allowedAddons
          ? data.allowedAddons.split(',').map((s) => s.trim())
          : undefined,
        availableDays: data.availableDays
          ? JSON.parse(data.availableDays)
          : undefined,
        availableShifts: data.availableShifts
          ? JSON.parse(data.availableShifts)
          : undefined,
      };

      await api.post(`/companies/${companyId}/restaurant/menu/items`, payload);
      await fetchData();
      setShowItemDialog(false);
      resetItem();
      setEditingItem(null);
    } catch (err: any) {
      console.error('Erro ao criar item:', err);
      setError(err.response?.data?.message || 'Erro ao criar item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateItem = async (data: MenuItemFormData) => {
    if (!companyId || !editingItem) return;

    try {
      setIsLoading(true);
      setError(null);

      const payload: any = {
        ...data,
        categoryId: parseInt(data.categoryId, 10),
        price: parseFloat(data.price),
        preparationTime: data.preparationTime
          ? parseInt(data.preparationTime, 10)
          : undefined,
        sizes: data.sizes ? JSON.parse(data.sizes) : undefined,
        sizesPrices: data.sizesPrices ? JSON.parse(data.sizesPrices) : undefined,
        allowedAddons: data.allowedAddons
          ? data.allowedAddons.split(',').map((s) => s.trim())
          : undefined,
        availableDays: data.availableDays
          ? JSON.parse(data.availableDays)
          : undefined,
        availableShifts: data.availableShifts
          ? JSON.parse(data.availableShifts)
          : undefined,
      };

      await api.put(
        `/companies/${companyId}/restaurant/menu/items/${editingItem.id}`,
        payload,
      );
      await fetchData();
      setShowItemDialog(false);
      resetItem();
      setEditingItem(null);
    } catch (err: any) {
      console.error('Erro ao atualizar item:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!companyId) return;
    if (!confirm('Tem certeza que deseja remover este item?')) return;

    try {
      setIsLoading(true);
      setError(null);

      await api.delete(
        `/companies/${companyId}/restaurant/menu/items/${itemId}`,
      );
      await fetchData();
    } catch (err: any) {
      console.error('Erro ao remover item:', err);
      setError(err.response?.data?.message || 'Erro ao remover item');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    resetCategory({
      name: category.name,
      description: category.description || '',
      order: category.order,
    });
    setShowCategoryDialog(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    resetItem({
      categoryId: item.category.id.toString(),
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      imageUrl: item.imageUrl || '',
      preparationTime: item.preparationTime?.toString() || '',
      sizes: item.sizes || '',
      sizesPrices: item.sizesPrices || '',
      allowHalf: item.allowHalf,
      allowThird: item.allowThird,
      allowCombo: item.allowCombo,
      allowedAddons: item.allowedAddons
        ? JSON.parse(item.allowedAddons).join(', ')
        : '',
      availableDays: item.availableDays || '',
      availableShifts: item.availableShifts || '',
      order: item.order,
    });
    setShowItemDialog(true);
  };

  const filteredItems =
    selectedCategory === 'all'
      ? menuItems
      : menuItems.filter(
          (item) => item.category.id.toString() === selectedCategory,
        );

  if (isLoading && categories.length === 0) {
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
            <Package className="h-6 w-6" />
            Gestão de Cardápio
          </h2>
          <p className="text-muted-foreground mt-1">
            Gerencie categorias e itens do cardápio
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">
            <FolderTree className="h-4 w-4 mr-2" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="items">
            <Package className="h-4 w-4 mr-2" />
            Itens
          </TabsTrigger>
        </TabsList>

        {/* Tab: Categorias */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => {
              setEditingCategory(null);
              resetCategory();
              setShowCategoryDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground mt-2">
                    {category.items?.length || 0} itens
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Itens */}
        <TabsContent value="items" className="space-y-4">
          <div className="flex items-center justify-between">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por categoria" />
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

            <Button onClick={() => {
              setEditingItem(null);
              resetItem();
              setShowItemDialog(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    <p className="text-lg font-semibold">
                      {formatCurrency(Number(item.price))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Categoria: {item.category.name}
                    </p>
                    {item.preparationTime && (
                      <p className="text-xs text-muted-foreground">
                        Tempo: {item.preparationTime} min
                      </p>
                    )}
                    <div className="flex gap-1 flex-wrap mt-2">
                      {item.allowHalf && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">
                          Meia
                        </span>
                      )}
                      {item.allowThird && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 rounded">
                          Terço
                        </span>
                      )}
                      {item.allowCombo && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 rounded">
                          Combo
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog: Categoria */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Atualize as informações da categoria'
                : 'Adicione uma nova categoria ao cardápio'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitCategory(
              editingCategory ? handleUpdateCategory : handleCreateCategory,
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="category-name">Nome *</Label>
              <Input
                id="category-name"
                {...registerCategory('name')}
                className={cn(errorsCategory.name && 'border-destructive')}
              />
              {errorsCategory.name && (
                <p className="text-sm text-destructive">
                  {errorsCategory.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Descrição</Label>
              <Textarea
                id="category-description"
                {...registerCategory('description')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-order">Ordem</Label>
              <Input
                id="category-order"
                type="number"
                min="0"
                {...registerCategory('order', { valueAsNumber: true })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCategoryDialog(false);
                  resetCategory();
                  setEditingCategory(null);
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
                {editingCategory ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Item */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Atualize as informações do item'
                : 'Adicione um novo item ao cardápio'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitItem(
              editingItem ? handleUpdateItem : handleCreateItem,
            )}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="item-category">Categoria *</Label>
              <Select
                value={watchItem('categoryId') || ''}
                onValueChange={(value) => setValueItem('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errorsItem.categoryId && (
                <p className="text-sm text-destructive">
                  {errorsItem.categoryId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-name">Nome *</Label>
              <Input
                id="item-name"
                {...registerItem('name')}
                className={cn(errorsItem.name && 'border-destructive')}
              />
              {errorsItem.name && (
                <p className="text-sm text-destructive">
                  {errorsItem.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description">Descrição</Label>
              <Textarea
                id="item-description"
                {...registerItem('description')}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-price">Preço *</Label>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...registerItem('price')}
                  className={cn(errorsItem.price && 'border-destructive')}
                />
                {errorsItem.price && (
                  <p className="text-sm text-destructive">
                    {errorsItem.price.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-preparation-time">Tempo de Preparo (min)</Label>
                <Input
                  id="item-preparation-time"
                  type="number"
                  min="0"
                  {...registerItem('preparationTime')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-image-url">URL da Imagem</Label>
              <Input
                id="item-image-url"
                type="url"
                {...registerItem('imageUrl')}
              />
            </div>

            {/* Opções para Pizzaria */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Opções para Pizzaria</h3>

              <div className="space-y-2">
                <Label htmlFor="item-sizes">Tamanhos (JSON array)</Label>
                <Input
                  id="item-sizes"
                  placeholder='["P", "M", "G", "FAMILY"]'
                  {...registerItem('sizes')}
                />
                <p className="text-xs text-muted-foreground">
                  Exemplo: ["P", "M", "G", "FAMILY"]
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-sizes-prices">Preços por Tamanho (JSON object)</Label>
                <Input
                  id="item-sizes-prices"
                  placeholder='{"P": 25.00, "M": 35.00, "G": 45.00}'
                  {...registerItem('sizesPrices')}
                />
                <p className="text-xs text-muted-foreground">
                  Exemplo: {"{"}"P": 25.00, "M": 35.00, "G": 45.00{"}"}
                </p>
              </div>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="item-allow-half"
                    checked={allowHalf}
                    onCheckedChange={(checked) =>
                      setValueItem('allowHalf', checked === true)
                    }
                  />
                  <Label htmlFor="item-allow-half" className="cursor-pointer">
                    Permitir Meia Pizza
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="item-allow-third"
                    checked={allowThird}
                    onCheckedChange={(checked) =>
                      setValueItem('allowThird', checked === true)
                    }
                  />
                  <Label htmlFor="item-allow-third" className="cursor-pointer">
                    Permitir Terço de Pizza
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="item-allow-combo"
                    {...registerItem('allowCombo')}
                  />
                  <Label htmlFor="item-allow-combo" className="cursor-pointer">
                    Permitir Combo
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-allowed-addons">Adicionais Permitidos</Label>
                <Input
                  id="item-allowed-addons"
                  placeholder="Borda Recheada, Extra Queijo, Bacon"
                  {...registerItem('allowedAddons')}
                />
                <p className="text-xs text-muted-foreground">
                  Separe por vírgula
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowItemDialog(false);
                  resetItem();
                  setEditingItem(null);
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
                {editingItem ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

