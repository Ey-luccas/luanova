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
  'linear-gradient(135deg, #28404C 0%, #1a2f3a 100%)', /* Azul Escuro */
  'linear-gradient(135deg, #2C4B5D 0%, #1f3642 100%)', /* Azul SemiEscuro */
  'linear-gradient(135deg, #CCD3D9 0%, #a8b5c0 100%)', /* Azul Claro */
  'linear-gradient(135deg, #4a6572 0%, #3d5460 100%)', /* Azul Médio */
  'linear-gradient(135deg, #5a7a8a 0%, #4a6572 100%)', /* Azul Médio-Escuro */
  'linear-gradient(135deg, #6b8a9a 0%, #5a7a8a 100%)', /* Azul Médio-Claro */
  'linear-gradient(135deg, #7a9aaa 0%, #6b8a9a 100%)', /* Azul Claro-Médio */
  'linear-gradient(135deg, #8aaaba 0%, #7a9aaa 100%)', /* Azul Claro+ */
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Categorias</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">
            Organize seus produtos em categorias
          </p>
        </div>
        <Link href="/dashboard/categories/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
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
          <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
            <FolderTree className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">
              Nenhuma categoria encontrada
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 text-center">
              Crie categorias para organizar seus produtos
            </p>
            <Link href="/dashboard/categories/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Criar primeira categoria
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category, index) => (
            <Card
              key={category.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader className="pb-3 p-4 sm:p-6">
                <div className="flex items-start justify-between">
                  <div
                    className="h-7 w-7 sm:h-8 sm:w-8 rounded-full border-2 border-white shadow-sm flex-shrink-0"
                    style={{ background: getCategoryColor(index) }}
                  />
                  <div className="flex gap-1 sm:gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9"
                      onClick={() => {
                        // TODO: Implementar edição
                        console.log('Editar categoria:', category.id);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 sm:h-9 sm:w-9 text-destructive hover:text-destructive"
                      onClick={() => {
                        // TODO: Implementar exclusão
                        console.log('Excluir categoria:', category.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <h3 className="font-semibold text-base sm:text-lg mb-2 truncate">{category.name}</h3>
                <div className="space-y-2 pt-3 sm:pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide mb-1">
                        Produtos
                      </div>
                      <div className="text-lg sm:text-xl font-semibold">
                        {category._count?.products || 0}
                      </div>
                    </div>
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
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
