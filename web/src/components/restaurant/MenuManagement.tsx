/**
 * Componente de Gestão de Cardápio
 * 
 * CRUD completo de categorias e itens do cardápio
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Package,
  FolderTree,
  X,
  Filter,
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
  const [imageUploadMode, setImageUploadMode] = useState<'url' | 'file'>('url');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sizes, setSizes] = useState<string[]>([]);
  const [sizesPrices, setSizesPrices] = useState<Record<string, number>>({});
  const [sizeInput, setSizeInput] = useState<string>('');
  const [savedSizes, setSavedSizes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [savedTags, setSavedTags] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);

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

  // Função para adicionar tamanhos a partir do input
  const handleAddSizesFromInput = () => {
    if (!sizeInput.trim()) return;

    // Separa por vírgula ou espaço
    const newSizes = sizeInput
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !sizes.includes(s));

    if (newSizes.length > 0) {
      const updatedSizes = [...sizes, ...newSizes];
      setSizes(updatedSizes);
      
      // Adiciona preços zerados para novos tamanhos
      const updatedPrices = { ...sizesPrices };
      newSizes.forEach((size) => {
        if (!updatedPrices[size]) {
          updatedPrices[size] = 0;
        }
      });
      setSizesPrices(updatedPrices);
      
      setSizeInput('');
    }
  };

  // Função para adicionar tags a partir do input
  const handleAddTagsFromInput = () => {
    if (!tagInput.trim()) return;

    // Separa por vírgula ou espaço
    const newTags = tagInput
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !tags.includes(t));

    if (newTags.length > 0) {
      setTags([...tags, ...newTags]);
      setTagInput('');
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchData();
      // Carrega tamanhos salvos do localStorage
      const saved = localStorage.getItem(`savedSizes_${companyId}`);
      if (saved) {
        try {
          setSavedSizes(JSON.parse(saved));
        } catch (e) {
          console.error('Erro ao carregar tamanhos salvos:', e);
        }
      }
      
      // Carrega tags salvas do localStorage
      const savedTagsData = localStorage.getItem(`savedTags_${companyId}`);
      if (savedTagsData) {
        try {
          setSavedTags(JSON.parse(savedTagsData));
        } catch (e) {
          console.error('Erro ao carregar tags salvas:', e);
        }
      }
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

      // Upload de imagem se for arquivo
      let imageUrl = data.imageUrl || '';
      if (imageUploadMode === 'file' && imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const uploadRes = await api.post(
          `/companies/${companyId}/restaurant/menu/items/upload-image`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        // Ajusta a URL se necessário
        let uploadedUrl = uploadRes.data?.data?.imageUrl || '';
        if (uploadedUrl.startsWith('http')) {
          imageUrl = uploadedUrl;
        } else {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://api.luanova.cloud';
          imageUrl = `${baseUrl}${uploadedUrl}`;
        }
      }

      const payload: any = {
        categoryId: parseInt(data.categoryId, 10),
        name: data.name,
        description: data.description || undefined,
        price: parseFloat(data.price),
        imageUrl: imageUrl || undefined,
        preparationTime: data.preparationTime
          ? parseInt(data.preparationTime, 10)
          : undefined,
        sizes: sizes.length > 0 ? sizes : undefined,
        sizesPrices: sizes.length > 0 ? sizesPrices : undefined,
        allowedAddons: tags.length > 0 ? tags : undefined,
        availableDays: data.availableDays
          ? JSON.parse(data.availableDays)
          : undefined,
        availableShifts: data.availableShifts
          ? JSON.parse(data.availableShifts)
          : undefined,
        order: data.order || undefined,
      };

      await api.post(`/companies/${companyId}/restaurant/menu/items`, payload);
      await fetchData();
      setShowItemDialog(false);
      resetItem();
      setEditingItem(null);
      setSizes([]);
      setSizesPrices({});
      setImageFile(null);
      setImagePreview(null);
      setImageUploadMode('url');
      setSizeInput('');
      setTags([]);
      setTagInput('');
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

      // Upload de imagem se for arquivo
      let imageUrl = data.imageUrl || '';
      if (imageUploadMode === 'file' && imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        
        const uploadRes = await api.post(
          `/companies/${companyId}/restaurant/menu/items/upload-image`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        
        // Ajusta a URL se necessário
        let uploadedUrl = uploadRes.data?.data?.imageUrl || '';
        if (uploadedUrl.startsWith('http')) {
          imageUrl = uploadedUrl;
        } else {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://api.luanova.cloud';
          imageUrl = `${baseUrl}${uploadedUrl}`;
        }
      }

      const payload: any = {
        categoryId: parseInt(data.categoryId, 10),
        name: data.name,
        description: data.description || undefined,
        price: parseFloat(data.price),
        imageUrl: imageUrl || data.imageUrl || undefined,
        preparationTime: data.preparationTime
          ? parseInt(data.preparationTime, 10)
          : undefined,
        sizes: sizes.length > 0 ? sizes : (data.sizes ? JSON.parse(data.sizes) : undefined),
        sizesPrices: sizes.length > 0 ? sizesPrices : (data.sizesPrices ? JSON.parse(data.sizesPrices) : undefined),
        allowedAddons: tags.length > 0 ? tags : undefined,
        availableDays: data.availableDays
          ? JSON.parse(data.availableDays)
          : undefined,
        availableShifts: data.availableShifts
          ? JSON.parse(data.availableShifts)
          : undefined,
        order: data.order || undefined,
      };

      await api.put(
        `/companies/${companyId}/restaurant/menu/items/${editingItem.id}`,
        payload,
      );
      await fetchData();
      setShowItemDialog(false);
      resetItem();
      setEditingItem(null);
      setSizes([]);
      setSizesPrices({});
      setImageFile(null);
      setImagePreview(null);
      setImageUploadMode('url');
      setSizeInput('');
      setTags([]);
      setTagInput('');
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
    
    // Parse sizes e sizesPrices se existirem
    let parsedSizes: string[] = [];
    let parsedSizesPrices: Record<string, number> = {};
    
    if (item.sizes) {
      try {
        parsedSizes = JSON.parse(item.sizes);
      } catch (e) {
        console.error('Erro ao parsear sizes:', e);
      }
    }
    
    if (item.sizesPrices) {
      try {
        parsedSizesPrices = JSON.parse(item.sizesPrices);
      } catch (e) {
        console.error('Erro ao parsear sizesPrices:', e);
      }
    }
    
    setSizes(parsedSizes);
    setSizesPrices(parsedSizesPrices);
    setImageUploadMode(item.imageUrl ? 'url' : 'url');
    setImagePreview(item.imageUrl || null);
    setImageFile(null);
    setSizeInput('');
    
    // Parse tags se existirem
    let parsedTags: string[] = [];
    if (item.allowedAddons) {
      try {
        parsedTags = JSON.parse(item.allowedAddons);
      } catch (e) {
        // Se não for JSON, trata como string separada por vírgula
        parsedTags = item.allowedAddons.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }
    setTags(parsedTags);
    setTagInput('');
    
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
      allowedAddons: item.allowedAddons || '',
      availableDays: item.availableDays || '',
      availableShifts: item.availableShifts || '',
      order: item.order,
    });
    setShowItemDialog(true);
  };

  const filteredItems = useMemo(() => {
    let filtered = selectedCategory === 'all'
      ? menuItems
      : menuItems.filter(
          (item) => item.category.id.toString() === selectedCategory,
        );

    // Filtro por tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((item) => {
        if (!item.allowedAddons) return false;
        try {
          const itemTags = JSON.parse(item.allowedAddons);
          return selectedTags.some((tag) => itemTags.includes(tag));
        } catch (e) {
          // Se não for JSON, trata como string
          const itemTags = item.allowedAddons.split(',').map((t: string) => t.trim());
          return selectedTags.some((tag) => itemTags.includes(tag));
        }
      });
    }

    return filtered;
  }, [menuItems, selectedCategory, selectedTags]);

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

      <div className="space-y-4">
        {/* Mini Cards de Categorias com Rolagem Horizontal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Filtrar por categoria</h3>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Filtrar por Categoria</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                    Todas as categorias
                  </DropdownMenuItem>
                  {categories.map((cat) => (
                    <DropdownMenuItem
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id.toString())}
                    >
                      {cat.name}
                    </DropdownMenuItem>
                  ))}
                  {savedTags.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Filtrar por Tags</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {savedTags.map((tag) => (
                        <DropdownMenuItem
                          key={tag}
                          onClick={() => {
                            if (selectedTags.includes(tag)) {
                              setSelectedTags(selectedTags.filter((t) => t !== tag));
                            } else {
                              setSelectedTags([...selectedTags, tag]);
                            }
                          }}
                        >
                          {selectedTags.includes(tag) && '✓ '}
                          {tag}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                onClick={() => {
                  setEditingCategory(null);
                  resetCategory();
                  setShowCategoryDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2 min-w-max">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                  selectedCategory === 'all'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                Todas
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id.toString())}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2",
                    selectedCategory === category.id.toString()
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80 text-muted-foreground"
                  )}
                >
                  <FolderTree className="h-4 w-4" />
                  {category.name}
                  <span className="text-xs opacity-70">({category.items?.length || 0})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mini Cards de Tags com Rolagem Horizontal */}
          {savedTags.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Filtrar por tags</h3>
              <div className="overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-max">
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className={cn(
                      "px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                      selectedTags.length === 0
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                  >
                    Todas as tags
                  </button>
                  {savedTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter((t) => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                        selectedTags.includes(tag)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seção de Itens */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
              
          </div>

            <Button 
              onClick={() => {
                if (categories.length === 0) {
                  setError('Crie pelo menos uma categoria antes de adicionar itens');
                  return;
                }
                setEditingItem(null);
                resetItem();
                setSizes([]);
                setSizesPrices({});
                setImageFile(null);
                setImagePreview(null);
                setImageUploadMode('url');
                setSizeInput('');
                setError(null);
                setShowItemDialog(true);
              }}
              disabled={categories.length === 0}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                {item.imageUrl && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
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
                      {item.allowedAddons && (() => {
                        try {
                          const itemTags = JSON.parse(item.allowedAddons);
                          return itemTags.map((tag: string, idx: number) => (
                            <span key={idx} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">
                              {tag}
                            </span>
                          ));
                        } catch (e) {
                          const itemTags = item.allowedAddons.split(',').map((t: string) => t.trim());
                          return itemTags.map((tag: string, idx: number) => (
                            <span key={idx} className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded">
                              {tag}
                            </span>
                          ));
                        }
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

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
              <Label htmlFor="category-order">
                Ordem
                <span className="text-xs text-muted-foreground ml-2">
                  (Define a ordem de exibição no cardápio - menor número aparece primeiro)
                </span>
              </Label>
              <Input
                id="category-order"
                type="number"
                min="0"
                {...registerCategory('order', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                💡 Use números para ordenar as categorias. Ex: 1 = primeira, 2 = segunda, etc.
              </p>
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

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Imagem do Prato</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={imageUploadMode === 'url' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setImageUploadMode('url');
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                  >
                    Usar URL
                  </Button>
                  <Button
                    type="button"
                    variant={imageUploadMode === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setImageUploadMode('file');
                      setValueItem('imageUrl', '');
                    }}
                  >
                    Enviar Arquivo
                  </Button>
                </div>
              </div>

              {imageUploadMode === 'url' ? (
                <div className="space-y-2">
                  <Label htmlFor="item-image-url">URL da Imagem</Label>
                  <Input
                    id="item-image-url"
                    type="url"
                    {...registerItem('imageUrl')}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="item-image-file">Selecionar Arquivo</Label>
                  <Input
                    id="item-image-file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreview(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-md border"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Opções de Tamanhos e Variações */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Tamanhos e Variações</h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tamanhos Disponíveis</Label>
                  
                  {/* Tamanhos salvos anteriormente */}
                  {savedSizes.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs text-muted-foreground mb-2">Tamanhos usados anteriormente:</p>
                      <div className="flex flex-wrap gap-2">
                        {savedSizes.map((size) => (
                          <Button
                            key={size}
                            type="button"
                            variant={sizes.includes(size) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              if (sizes.includes(size)) {
                                setSizes(sizes.filter((s) => s !== size));
                                const newPrices = { ...sizesPrices };
                                delete newPrices[size];
                                setSizesPrices(newPrices);
                              } else {
                                setSizes([...sizes, size]);
                                setSizesPrices({ ...sizesPrices, [size]: 0 });
                              }
                            }}
                          >
                            {size}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Campo para digitar tamanhos */}
                  <div className="space-y-2">
                    <Label htmlFor="size-input">Digite os tamanhos (separados por vírgula ou espaço)</Label>
                    <Input
                      id="size-input"
                      placeholder="Ex: Pequeno, Médio, Grande ou Pequeno Médio Grande ou 300ml 500g 1L"
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSizesFromInput();
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleAddSizesFromInput}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Tamanhos
                      </Button>
                      {sizeInput.trim() && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSizeInput('')}
                        >
                          Limpar
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Digite os tamanhos separados por vírgula ou espaço. Ex: "P, M, G" ou "300ml 500g 1L"
                    </p>
                  </div>
                  
                  {/* Lista de tamanhos selecionados */}
                  {sizes.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <Label className="mb-2 block">Tamanhos Selecionados:</Label>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => (
                          <div
                            key={size}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-md border border-primary/20"
                          >
                            <span className="text-sm font-medium">{size}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-destructive/20"
                              onClick={() => {
                                setSizes(sizes.filter((s) => s !== size));
                                const newPrices = { ...sizesPrices };
                                delete newPrices[size];
                                setSizesPrices(newPrices);
                              }}
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {sizes.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <Label>Preços por Tamanho</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {sizes.map((size) => (
                        <div key={size} className="space-y-1">
                          <Label htmlFor={`price-${size}`} className="text-sm">
                            {size}
                          </Label>
                          <Input
                            id={`price-${size}`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={sizesPrices[size] || 0}
                            onChange={(e) => {
                              setSizesPrices({
                                ...sizesPrices,
                                [size]: parseFloat(e.target.value) || 0,
                              });
                            }}
                            placeholder="0.00"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tags para filtrar */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold">Tags (para filtrar)</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="tag-input">Digite as tags (separadas por vírgula ou espaço)</Label>
                  <Input
                    id="tag-input"
                    placeholder="Ex: Vegetariano, Vegano, Sem Lactose ou Vegetariano Vegano Sem Lactose"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTagsFromInput();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleAddTagsFromInput}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Tags
                    </Button>
                    {tagInput.trim() && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setTagInput('')}
                      >
                        Limpar
                      </Button>
                    )}
                  </div>
                  
                  {/* Tags salvas anteriormente */}
                  {savedTags.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-2">Tags usadas anteriormente:</p>
                      <div className="flex flex-wrap gap-2">
                        {savedTags.map((tag) => (
                          <Button
                            key={tag}
                            type="button"
                            variant={tags.includes(tag) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              if (tags.includes(tag)) {
                                setTags(tags.filter((t) => t !== tag));
                              } else {
                                setTags([...tags, tag]);
                              }
                            }}
                          >
                            {tag}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Lista de tags selecionadas */}
                  {tags.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <Label className="mb-2 block">Tags Selecionadas:</Label>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <div
                            key={tag}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-md border border-primary/20"
                          >
                            <span className="text-sm font-medium">{tag}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-destructive/20"
                              onClick={() => {
                                setTags(tags.filter((t) => t !== tag));
                              }}
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    💡 Use tags para categorizar e filtrar itens. Ex: "Vegetariano", "Vegano", "Sem Lactose", "Picante", etc.
                  </p>
                </div>
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
                  setSizes([]);
                  setSizesPrices({});
                  setImageFile(null);
                  setImagePreview(null);
                  setImageUploadMode('url');
                  setSizeInput('');
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || !watchItem('categoryId') || !watchItem('name') || !watchItem('price')}
              >
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

