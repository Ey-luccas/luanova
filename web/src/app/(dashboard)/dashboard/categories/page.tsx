/**
 * Página de Listagem de Categorias
 *
 * Lista categorias em formato de grid de cards.
 * Dados vindos de: GET /api/companies/{companyId}/categories
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Loader2,
  AlertCircle,
  FolderTree,
  Package,
  DollarSign,
  Edit,
  Trash2,
} from 'lucide-react';

interface Category {
  id: number;
  name: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

// Cores para os badges das categorias
const CATEGORY_COLORS = [
  'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  'linear-gradient(135deg, #6b7280 0%, #374151 100%)',
  'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
  'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
];

export default function CategoriesPage() {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
  }, [isAuthenticated]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        setError('Empresa não selecionada.');
        setIsLoading(false);
        return;
      }

      const response = await api.get(`/companies/${companyId}/categories`);
      const { categories: categoriesData } = response.data.data;
      // FILTRAR: Categoria "Serviços" não deve aparecer (categorias são exclusivas para produtos)
      const filteredCategories = categoriesData.filter((cat: Category) => {
        const nameLower = cat.name.toLowerCase();
        return nameLower !== 'serviços' && nameLower !== 'servicos';
      });
      setCategories(filteredCategories);
    } catch (err: any) {
      console.error('Erro ao buscar categorias:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao carregar categorias. Tente novamente.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryColor = (index: number) => {
    return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categorias</h1>
          <p className="text-muted-foreground mt-2">
            Organize seus produtos em categorias
          </p>
        </div>
        <Link href="/dashboard/categories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Grid de Categorias */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderTree className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma categoria encontrada
            </h3>
            <p className="text-muted-foreground mb-4 text-center">
              Crie categorias para organizar seus produtos
            </p>
            <Link href="/dashboard/categories/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira categoria
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category, index) => (
            <Card
              key={category.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div
                    className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                    style={{ background: getCategoryColor(index) }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        // TODO: Implementar edição
                        console.log('Editar categoria:', category.id);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        // TODO: Implementar exclusão
                        console.log('Excluir categoria:', category.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Produtos
                      </div>
                      <div className="text-xl font-semibold">
                        {category._count?.products || 0}
                      </div>
                    </div>
                    <Package className="h-5 w-5 text-muted-foreground" />
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
