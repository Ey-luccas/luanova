/**
 * Página de Listagem de Produtos
 *
 * Lista produtos com filtros e busca.
 * Dados vindos de: GET /api/companies/{companyId}/products
 */

'use client';

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useExtensions } from '@/contexts/ExtensionsContext';
import api from '@/lib/api';
import { devLog } from '@/utils/dev-log';
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
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Plus,
  Search,
  Loader2,
  AlertCircle,
  Edit,
  Package,
  MoreVertical,
  FileDown,
  PackagePlus,
  PackageMinus,
  Trash2,
  Power,
  PowerOff,
  Eye,
  Info,
  Warehouse,
  Activity,
  History,
  Calendar,
  Download,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Product {
  id: number;
  name: string;
  barcode?: string | null;
  sku?: string | null;
  unitPrice?: number | null;
  currentStock: number;
  category?: {
    id: number;
    name: string;
  } | null;
  isActive: boolean;
}

interface Category {
  id: number;
  name: string;
}

interface TrackingTimelineEntry {
  date: string;
  hasInitialRegistration: boolean;
  realUnits: any[];
  availableUnits: any[];
  soldUnits: any[];
}

export default function ProductsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  // Produtos é uma extensão padrão, sempre ativa - não precisa verificar

  // Memoizar companyId para evitar leituras repetidas do localStorage
  const companyId = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('companyId');
  }, []);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref para evitar múltiplas chamadas simultâneas
  const isFetchingRef = React.useRef(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<
    'ativo' | 'rascunho' | 'inativo' | 'all' | undefined
  >('all');
  const [lowStockFilter, setLowStockFilter] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Estado para dialog de adicionar unidades
  const [addUnitsDialog, setAddUnitsDialog] = useState<{
    open: boolean;
    product: Product | null;
    quantity: string;
  }>({
    open: false,
    product: null,
    quantity: '',
  });

  // Estado para dialog de remover unidades
  const [removeUnitsDialog, setRemoveUnitsDialog] = useState<{
    open: boolean;
    product: Product | null;
    quantity: string;
  }>({
    open: false,
    product: null,
    quantity: '',
  });

  // Estado para dialog de confirmação de PDF após adicionar unidades
  const [pdfConfirmDialog, setPdfConfirmDialog] = useState<{
    open: boolean;
    product: Product | null;
    units: any[];
    quantity: number;
  }>({
    open: false,
    product: null,
    units: [],
    quantity: 0,
  });

  // Estado para dialog de excluir produto
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    product: Product | null;
  }>({
    open: false,
    product: null,
  });

  // Estado para dialog de detalhes do produto
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    product: Product | null;
    monthlySalesAvg?: number;
    isLoadingAvg?: boolean;
  }>({
    open: false,
    product: null,
    monthlySalesAvg: undefined,
    isLoadingAvg: false,
  });

  // Estado para dialog de adicionar estoque
  const [addStockDialog, setAddStockDialog] = useState<{
    open: boolean;
    productId: string;
    quantity: string;
  }>({
    open: false,
    productId: '',
    quantity: '',
  });

  // Estado para dialog de rastreamento de movimentações
  const [trackingDialog, setTrackingDialog] = useState<{
    open: boolean;
    product: Product | null;
    movements: any[];
    isLoading: boolean;
  }>({
    open: false,
    product: null,
    movements: [],
    isLoading: false,
  });

  // Estado para dialog de rastreamento de estoque
  const [trackingStockDialog, setTrackingStockDialog] = useState<{
    open: boolean;
    selectedProduct: Product | null;
    productSearch: string;
    dateSearch: string;
    units: any[];
    groupedByDate: { [key: string]: any[] };
    productCreatedAt?: string | null; // Data de criação do produto
    isLoading: boolean;
  }>({
    open: false,
    selectedProduct: null,
    productSearch: '',
    dateSearch: '',
    units: [],
    groupedByDate: {},
    productCreatedAt: null,
    isLoading: false,
  });

  const filteredTrackingProducts = useMemo(() => {
    if (!trackingStockDialog.open) {
      return [] as Product[];
    }

    const searchTerm = trackingStockDialog.productSearch.toLowerCase().trim();

    if (!searchTerm) {
      return products;
    }

    return products.filter((product) => {
      const name = (product.name || '').toLowerCase();
      const barcode = (product.barcode || '').toLowerCase();
      const sku = (product.sku || '').toLowerCase();

      return (
        name.includes(searchTerm) ||
        barcode.includes(searchTerm) ||
        sku.includes(searchTerm)
      );
    });
  }, [products, trackingStockDialog.open, trackingStockDialog.productSearch]);

  const trackingTimelineEntries = useMemo<TrackingTimelineEntry[]>(() => {
    if (!trackingStockDialog.open) {
      return [];
    }

    const groupedEntries = trackingStockDialog.groupedByDate || {};
    const dateSearch = trackingStockDialog.dateSearch;

    return Object.keys(groupedEntries)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .filter((date) => !dateSearch || date === dateSearch)
      .map((date) => {
        const unitsForDate = groupedEntries[date] || [];
        const hasInitialRegistration = unitsForDate.some(
          (u: any) => u.id === 'product-creation' || u.isInitialRegistration,
        );
        const realUnits = unitsForDate.filter(
          (u: any) => u.id !== 'product-creation' && !u.isInitialRegistration,
        );
        const availableUnits = realUnits.filter(
          (u: any) => !u.isSold && u.barcode,
        );
        const soldUnits = realUnits.filter((u: any) => u.isSold);

        return {
          date,
          hasInitialRegistration,
          realUnits,
          availableUnits,
          soldUnits,
        };
      });
  }, [
    trackingStockDialog.open,
    trackingStockDialog.groupedByDate,
    trackingStockDialog.dateSearch,
  ]);

  const selectableStockProducts = useMemo(() => {
    if (!addStockDialog.open) {
      return [] as Product[];
    }

    return products.filter((product) => product.isActive);
  }, [addStockDialog.open, products]);

  // Função para criar unidades de produto com códigos de barras
  // Função helper para determinar o status do produto
  // Inativo: isActive = false (produto desativado manualmente, independente do estoque)
  // Rascunho: isActive = true E currentStock = 0 (ideia de produto, sem estoque ainda)
  // Ativo: isActive = true E currentStock > 0 (produto no estoque, disponível)
  const getProductStatus = (
    product: Product,
  ): 'inativo' | 'rascunho' | 'ativo' => {
    if (!product.isActive) {
      return 'inativo';
    }
    const stock =
      typeof product.currentStock === 'number'
        ? Math.floor(product.currentStock)
        : typeof product.currentStock === 'string'
        ? parseInt(product.currentStock, 10) || 0
        : 0;
    if (stock === 0) {
      return 'rascunho';
    }
    return 'ativo';
  };

  // Função helper para obter o texto e estilo do badge de status
  const getStatusBadge = (product: Product) => {
    const status = getProductStatus(product);
    switch (status) {
      case 'ativo':
        return {
          text: 'Ativo',
          className:
            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        };
      case 'rascunho':
        return {
          text: 'Rascunho',
          className:
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        };
      case 'inativo':
        return {
          text: 'Inativo',
          className:
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        };
      default:
        return {
          text: 'Desconhecido',
          className:
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        };
    }
  };

  const handleCreateUnits = async (productId: number, quantity: number) => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        alert('Empresa não selecionada.');
        return null;
      }

      devLog.log('🆕 [handleCreateUnits] Iniciando criação de unidades:', {
        companyId,
        productId,
        quantity,
      });

      // Criar unidades via API
      const response = await api.post(`/companies/${companyId}/units`, {
        productId,
        quantity,
      });

      devLog.log('✅ [handleCreateUnits] Resposta da API:', response.data);

      const units = response.data?.data?.units || [];

      devLog.log('📦 [handleCreateUnits] Unidades criadas:', {
        quantidadeEsperada: quantity,
        quantidadeRetornada: units.length,
        unidades: units.map((u: any) => ({
          id: u.id,
          barcode: u.barcode,
          createdAt: u.createdAt,
        })),
      });

      if (units.length === 0) {
        devLog.warn(
          '⚠️ [handleCreateUnits] Nenhuma unidade retornada pela API!',
        );
      }

      return units;
    } catch (error: any) {
      devLog.error('❌ [handleCreateUnits] Erro ao criar unidades:', error);
      devLog.error('❌ [handleCreateUnits] Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      alert(
        error.response?.data?.message ||
          'Erro ao criar unidades. Tente novamente.',
      );
      return null;
    }
  };

  // Função para gerar PDF com códigos de barras das unidades
  const generateUnitsBarcodePDF = async (units: any[], productName: string) => {
    try {
      if (!units || units.length === 0) return;

      // Importação dinâmica das bibliotecas
      const { jsPDF } = await import('jspdf');
      let JsBarcode;
      try {
        const jsbarcodeModule = await import('jsbarcode');
        JsBarcode = jsbarcodeModule.default || jsbarcodeModule;
      } catch (e) {
        JsBarcode = require('jsbarcode');
      }

      const doc = new jsPDF();

      // Título na primeira página
      doc.setFontSize(16);
      doc.text(productName, 14, 20);
      doc.setFontSize(10);
      doc.text(`Quantidade: ${units.length} unidades`, 14, 30);
      doc.setFontSize(8);
      const now = new Date();
      doc.text(`Gerado em: ${now.toLocaleString('pt-BR')}`, 14, 38);

      // Configurações de layout
      const codesPerRow = 2;
      const codeWidth = 85;
      const codeHeight = 40;
      const spacing = 10;
      const pageHeight = doc.internal.pageSize.height;
      const startY = 50;

      let currentCol = 0;
      let yPosition = startY;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Não foi possível criar o contexto do canvas');
      }

      for (let i = 0; i < units.length; i++) {
        const unit = units[i];

        // Nova página se necessário
        if (yPosition + codeHeight + 20 > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
          currentCol = 0;
        }

        // Limpar canvas
        canvas.width = 200;
        canvas.height = 100;

        // Gerar código de barras
        JsBarcode(canvas, unit.barcode, {
          format: 'CODE128',
          width: 2,
          height: 50,
          displayValue: true,
        });

        // Posição X
        const xPosition = 14 + currentCol * (codeWidth + spacing);

        // Adicionar imagem ao PDF
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(
          imgData,
          'PNG',
          xPosition,
          yPosition,
          codeWidth,
          codeHeight,
        );

        // Nome do produto
        doc.setFontSize(7);
        const nameText = productName.substring(0, 20);
        doc.text(nameText, xPosition, yPosition + codeHeight + 5);

        // Código da unidade
        doc.setFontSize(6);
        doc.text(
          `Unid: ${unit.barcode}`,
          xPosition,
          yPosition + codeHeight + 10,
        );

        // Avançar para próxima posição
        currentCol++;
        if (currentCol >= codesPerRow) {
          currentCol = 0;
          yPosition += codeHeight + spacing + 20;
        }
      }

      // Salvar PDF
      const fileName = `${productName.replace(
        /[^a-z0-9]/gi,
        '_',
      )}-unidades-${Date.now()}.pdf`;
      doc.save(fileName);
    } catch (error) {
      devLog.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    }
  };

  // Função removida - não mais necessária com o novo modal de rastreamento

  // Função para buscar unidades de um produto específico (novo rastreamento)
  const fetchUnitsByProduct = useCallback(
    async (productId: number | string) => {
      const productIdNum =
        typeof productId === 'string' ? parseInt(productId, 10) : productId;
      try {
        setTrackingStockDialog((prev) => ({
          ...prev,
          isLoading: true,
        }));
        const companyId = localStorage.getItem('companyId');
        if (!companyId) {
          alert('Empresa não selecionada.');
          return;
        }

        // Buscar unidades do produto (agora retorna também informações do produto)
        const unitsResponse = await api.get(
          `/companies/${companyId}/products/${productIdNum}/units`,
        );

        devLog.log(
          '📦 [fetchUnitsByProduct] Resposta completa da API:',
          unitsResponse.data,
        );

        const responseData = unitsResponse.data?.data || {};
        const productData = responseData.product || {};
        const unitsData = responseData.units || [];
        const units = Array.isArray(unitsData) ? unitsData : [];
        const productCreatedAt = productData.createdAt || null;

        devLog.log('📦 [fetchUnitsByProduct] Dados processados:', {
          productData,
          unitsCount: units.length,
          units: units,
          productCreatedAt,
        });

        // Agrupar unidades por data de criação
        const groupedByDate: { [key: string]: any[] } = {};

        // Adicionar a data de criação do produto (registro inicial) na timeline
        if (productCreatedAt) {
          const productDateKey = format(
            new Date(productCreatedAt),
            'yyyy-MM-dd',
          );
          if (!groupedByDate[productDateKey]) {
            groupedByDate[productDateKey] = [];
          }
          // Adicionar um marcador especial para o registro inicial do produto
          groupedByDate[productDateKey].push({
            id: 'product-creation',
            type: 'product-creation',
            createdAt: productCreatedAt,
            isInitialRegistration: true,
          });
        }

        // Agrupar unidades por data de criação
        devLog.log('📦 [fetchUnitsByProduct] Agrupando unidades...');
        units.forEach((unit: any, index: number) => {
          devLog.log(`📦 [fetchUnitsByProduct] Unidade ${index + 1}:`, {
            id: unit.id,
            barcode: unit.barcode,
            createdAt: unit.createdAt,
            isSold: unit.isSold,
          });

          if (!unit.createdAt) {
            devLog.warn(
              '⚠️ [fetchUnitsByProduct] Unidade sem createdAt:',
              unit,
            );
            return;
          }

          try {
            const dateKey = format(new Date(unit.createdAt), 'yyyy-MM-dd');
            if (!groupedByDate[dateKey]) {
              groupedByDate[dateKey] = [];
            }
            // Não adicionar duplicado se já for a data de criação do produto
            const hasInitialRegistration = groupedByDate[dateKey].some(
              (u: any) => u.id === 'product-creation',
            );
            if (!hasInitialRegistration || unit.id !== 'product-creation') {
              groupedByDate[dateKey].push(unit);
              devLog.log(
                `✅ [fetchUnitsByProduct] Unidade adicionada ao grupo ${dateKey}`,
              );
            }
          } catch (error) {
            devLog.error(
              '❌ [fetchUnitsByProduct] Erro ao processar unidade:',
              error,
              unit,
            );
          }
        });

        devLog.log(
          '📦 [fetchUnitsByProduct] Agrupamento final:',
          groupedByDate,
        );

        // Ordenar datas
        const sortedDates = Object.keys(groupedByDate).sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime(),
        );

        setTrackingStockDialog((prev) => ({
          ...prev,
          units: units,
          groupedByDate: groupedByDate,
          productCreatedAt: productCreatedAt,
          isLoading: false,
        }));
      } catch (error: any) {
        devLog.error('Erro ao buscar unidades do produto:', error);
        alert(
          error.response?.data?.message ||
            'Erro ao buscar unidades. Tente novamente.',
        );
        setTrackingStockDialog((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    },
    [api], // Dependência do api para evitar problemas
  );

  // Função removida - não mais necessária com o novo modal de rastreamento

  // Função para gerar PDF com códigos de barras das unidades de uma data
  const generatePDFForUnitsDate = async (unitsToGenerate: any[]) => {
    try {
      if (!unitsToGenerate || unitsToGenerate.length === 0) return;

      // Importação dinâmica das bibliotecas
      const { jsPDF } = await import('jspdf');
      let JsBarcode;
      try {
        const jsbarcodeModule = await import('jsbarcode');
        JsBarcode = jsbarcodeModule.default || jsbarcodeModule;
      } catch (e) {
        JsBarcode = require('jsbarcode');
      }

      const doc = new jsPDF();

      // Título na primeira página
      doc.setFontSize(16);
      doc.text(
        `Unidades Criadas em ${format(new Date(), 'dd/MM/yyyy', {
          locale: ptBR,
        })}`,
        14,
        20,
      );
      doc.setFontSize(10);
      doc.text(`Quantidade: ${unitsToGenerate.length} unidades`, 14, 30);

      // Agrupar unidades por produto
      const unitsByProduct = unitsToGenerate.reduce((acc, unit) => {
        const productName = unit.product?.name || 'Produto';
        if (!acc[productName]) {
          acc[productName] = [];
        }
        acc[productName].push(unit);
        return acc;
      }, {} as Record<string, any[]>);

      // Configurações de layout
      const codesPerRow = 2;
      const codeWidth = 85;
      const codeHeight = 40;
      const spacing = 10;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 50;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Não foi possível criar o contexto do canvas');
      }

      // Gerar códigos de barras para cada produto
      Object.entries(unitsByProduct).forEach(([productName, productUnits]) => {
        // Adicionar título do produto se necessário
        if (yPosition > 40) {
          doc.setFontSize(12);
          doc.text(productName, 14, yPosition);
          yPosition += 15;
        }

        let currentCol = 0;
        const unitsArray = productUnits as any[];

        unitsArray.forEach((unit: any) => {
          // Nova página se necessário
          if (yPosition + codeHeight + 20 > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
            currentCol = 0;
          }

          // Limpar canvas
          canvas.width = 200;
          canvas.height = 100;

          // Gerar código de barras
          JsBarcode(canvas, unit.barcode, {
            format: 'CODE128',
            width: 2,
            height: 50,
            displayValue: true,
          });

          // Posição X
          const xPosition = 14 + currentCol * (codeWidth + spacing);

          // Adicionar imagem ao PDF
          const imgData = canvas.toDataURL('image/png');
          doc.addImage(
            imgData,
            'PNG',
            xPosition,
            yPosition,
            codeWidth,
            codeHeight,
          );

          // Nome do produto
          doc.setFontSize(7);
          const nameText = productName.substring(0, 20);
          doc.text(nameText, xPosition, yPosition + codeHeight + 5);

          // Código da unidade
          doc.setFontSize(6);
          doc.text(
            `Unid: ${unit.barcode}`,
            xPosition,
            yPosition + codeHeight + 10,
          );

          // Status se vendido
          if (unit.isSold && unit.soldAt) {
            doc.setFontSize(5);
            doc.text(
              `Vendido: ${format(new Date(unit.soldAt), 'dd/MM/yyyy HH:mm', {
                locale: ptBR,
              })}`,
              xPosition,
              yPosition + codeHeight + 15,
            );
          }

          // Avançar para próxima posição
          currentCol++;
          if (currentCol >= codesPerRow) {
            currentCol = 0;
            yPosition += codeHeight + spacing + 25;
          }
        });

        yPosition += 10; // Espaço entre produtos
      });

      // Salvar PDF
      const dateStr = format(new Date(), 'dd-MM-yyyy', {
        locale: ptBR,
      });
      const fileName = `unidades-${dateStr}.pdf`;
      doc.save(fileName);
    } catch (error) {
      devLog.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    }
  };

  // Função para marcar unidade como vendida automaticamente
  // A lógica futura será implementada automaticamente
  const handleMarkUnitAsSold = async (unitId: number) => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        alert('Empresa não selecionada.');
        return;
      }

      // Marca como vendido automaticamente (sem detalhes da venda)
      // A lógica futura será automática
      await api.put(`/companies/${companyId}/units/${unitId}/sold`, {
        saleDetails: {},
      });

      // Atualizar lista de unidades se estiver no modal de rastreamento
      if (trackingStockDialog.open && trackingStockDialog.selectedProduct) {
        await fetchUnitsByProduct(trackingStockDialog.selectedProduct.id);
      }

      // Não é mais necessário atualizar o histórico antigo

      alert('Unidade marcada como vendida com sucesso!');
    } catch (error: any) {
      devLog.error('Erro ao marcar unidade como vendida:', error);
      alert(
        error.response?.data?.message ||
          'Erro ao marcar unidade como vendida. Tente novamente.',
      );
    }
  };

  // Função para buscar movimentações de um produto
  const fetchProductMovements = async (productId: number) => {
    try {
      setTrackingDialog((prev) => ({ ...prev, isLoading: true }));
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        alert('Empresa não selecionada.');
        return;
      }

      const response = await api.get(`/companies/${companyId}/movements`, {
        params: {
          productId: productId.toString(),
          limit: '1000', // Buscar muitas movimentações
        },
      });

      const movementsData =
        response.data?.data?.movements || response.data?.movements || [];
      const movements = Array.isArray(movementsData) ? movementsData : [];

      setTrackingDialog((prev) => ({
        ...prev,
        movements: movements,
        isLoading: false,
      }));
    } catch (error: any) {
      devLog.error('Erro ao buscar movimentações:', error);
      alert(
        error.response?.data?.message ||
          'Erro ao buscar movimentações. Tente novamente.',
      );
      setTrackingDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Função para calcular média de venda mensal
  const calculateMonthlySalesAverage = async (productId: number) => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) return 0;

      // Data de 6 meses atrás
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Buscar movimentações de saída (OUT) dos últimos 6 meses
      const response = await api.get(`/companies/${companyId}/movements`, {
        params: {
          productId: productId.toString(),
          type: 'OUT',
          startDate: sixMonthsAgo.toISOString(),
          limit: '1000', // Buscar bastante para calcular corretamente
        },
      });

      const movementsData =
        response.data?.data?.movements || response.data?.movements || [];
      const movements = Array.isArray(movementsData) ? movementsData : [];

      // Agrupar movimentações por mês
      const monthlySales: { [key: string]: number } = {};
      movements.forEach((movement: any) => {
        const date = new Date(movement.createdAt);
        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, '0')}`;

        if (!monthlySales[monthKey]) {
          monthlySales[monthKey] = 0;
        }

        const quantity = Number(movement.quantity) || 0;
        monthlySales[monthKey] += quantity;
      });

      // Calcular média
      const months = Object.keys(monthlySales);
      if (months.length === 0) return 0;

      const totalSales = Object.values(monthlySales).reduce(
        (sum, val) => sum + val,
        0,
      );
      const average = totalSales / months.length;

      return Math.round(average * 100) / 100; // Arredondar para 2 casas decimais
    } catch (error) {
      devLog.error('Erro ao calcular média de venda mensal:', error);
      return 0;
    }
  };

  // Garantir que categoryId nunca seja string vazia
  useEffect(() => {
    if (categoryId === '' || categoryId === null || categoryId === '0') {
      setCategoryId(undefined);
    }
  }, [categoryId]);

  // Garantir que os valores estejam sempre válidos antes de renderizar
  const safeCategoryId =
    categoryId &&
    categoryId !== '' &&
    categoryId !== '0' &&
    categoryId !== 'null' &&
    categoryId !== 'undefined'
      ? categoryId
      : undefined;

  const fetchCategories = useCallback(async () => {
    try {
      if (!companyId) return;

      const response = await api.get(`/companies/${companyId}/categories`);
      const categoriesData =
        response.data?.data?.categories || response.data?.categories || [];

      // Filtrar e validar categorias antes de setar
      const validCategories = (
        Array.isArray(categoriesData) ? categoriesData : []
      )
        .filter((cat: Category) => {
          // Garantir que categoria tenha id válido (número positivo)
          return (
            cat &&
            typeof cat.id === 'number' &&
            !isNaN(cat.id) &&
            cat.id > 0 &&
            cat.name &&
            typeof cat.name === 'string' &&
            cat.name.trim() !== ''
          );
        })
        .map((cat: Category) => ({
          id: Number(cat.id),
          name: String(cat.name).trim(),
        }));

      setCategories(validCategories);
    } catch (err) {
      devLog.error('Erro ao buscar categorias:', err);
      setCategories([]); // Garantir que sempre seja um array válido
    }
  }, []);

  // Removida lógica de categoria "Serviços" - agora usamos isService=false para produtos

  const fetchProducts = useCallback(async () => {
    // Prevenir múltiplas chamadas simultâneas
    if (isFetchingRef.current) {
      devLog.log(
        '⏸️ [fetchProducts] Já está buscando, ignorando chamada duplicada',
      );
      return;
    }

    try {
      isFetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      if (!companyId) {
        setError('Empresa não selecionada.');
        setIsLoading(false);
        return;
      }

      // Preparar parâmetros de query - backend espera todos como strings opcionais
      // GARANTIR que page e limit sempre sejam enviados como strings
      const params: Record<string, string> = {
        page: String(pagination.page || 1),
        limit: String(pagination.limit || 10),
        isService: 'false', // Produtos: isService = false
      };

      // Parâmetros opcionais (só adiciona se tiver valor válido)
      if (search && search.trim()) {
        params.search = search.trim();
      }
      if (
        categoryId &&
        categoryId !== undefined &&
        categoryId !== '' &&
        categoryId !== 'all' &&
        categoryId !== null
      ) {
        params.categoryId = categoryId.toString();
      }
      // Não enviar filtro de status para o backend - vamos filtrar no frontend

      // Log removido para melhorar performance

      const response = await api.get(`/companies/${companyId}/products`, {
        params,
      });

      // Backend retorna: { success: true, data: { products: [...], pagination: {...} } }
      const responseData = response.data?.data || response.data || {};
      const productsData = responseData.products || [];

      // Log removido para melhorar performance

      // Normalizar produtos para garantir tipos corretos (Decimal do Prisma vira number)
      const validProducts = (Array.isArray(productsData) ? productsData : [])
        .map((product: any) => ({
          id: Number(product.id),
          name: String(product.name || ''),
          barcode: product.barcode || null,
          sku: product.sku || null,
          unitPrice: (() => {
            const rawPrice = product.unitPrice;
            if (rawPrice == null || rawPrice === undefined || rawPrice === '')
              return null;

            if (typeof rawPrice === 'number') return rawPrice;
            if (typeof rawPrice === 'string') {
              const trimmed = rawPrice.trim();
              if (trimmed === '') return null;
              const num = parseFloat(trimmed);
              return isNaN(num) ? null : num;
            }

            const num = parseFloat(String(rawPrice));
            return isNaN(num) ? null : num;
          })(),
          currentStock: (() => {
            // Função auxiliar para converter qualquer formato para number
            const convertToNumber = (value: any): number => {
              if (value == null || value === undefined || value === '')
                return 0;

              if (typeof value === 'number') {
                return Math.floor(value);
              }

              if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed === '') return 0;
                const num = parseFloat(trimmed);
                return isNaN(num) ? 0 : Math.floor(num);
              }

              if (typeof value === 'object' && value !== null) {
                const num = (value as any).toNumber
                  ? (value as any).toNumber()
                  : parseFloat(String(value));
                return isNaN(num) ? 0 : Math.floor(num);
              }

              return 0;
            };

            // Converter currentStock
            let stock = convertToNumber(product.currentStock);

            // Se currentStock for 0, verificar minStock como fallback (compatibilidade com produtos antigos)
            if (stock === 0 && product.minStock != null) {
              const minStockValue = convertToNumber(product.minStock);
              if (minStockValue > 0) {
                stock = minStockValue;
              }
            }

            return stock;
          })(),
          // minStock e maxStock não são mais usados - apenas currentStock como quantidade única
          category: product.category
            ? {
                id: Number(product.category.id),
                name: String(product.category.name || ''),
              }
            : null,
          isActive: product.isActive ?? true,
        }))
        .filter((product: Product) => product.id && product.name)
        // Filtrar por status no frontend (serviços já são excluídos pelo backend com isService=false)
        .filter((product: Product) => {
          if (statusFilter === 'all' || !statusFilter) return true;
          const productStatus = getProductStatus(product);
          return productStatus === statusFilter;
        });

      // Log removido para melhorar performance

      setProducts(validProducts);

      setPagination((prev) => ({
        ...prev,
        total: responseData.pagination?.total ?? 0,
        totalPages: responseData.pagination?.totalPages ?? 1,
      }));

      // Log removido para melhorar performance
    } catch (err: any) {
      devLog.error('❌ Erro ao buscar produtos:', err);
      devLog.error('❌ Detalhes do erro:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        message: err.response?.data?.message,
        errors: err.response?.data?.errors,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          params: err.config?.params,
        },
      });

      // Tratar erros específicos
      if (err.response?.status === 400) {
        const errorDetails = err.response?.data?.errors || [];
        const errorMessage =
          err.response?.data?.message || 'Parâmetros inválidos';
        const errorMessages =
          errorDetails.length > 0
            ? errorDetails
                .map((e: any) => e.message || e.path?.join('.'))
                .join(', ')
            : '';
        setError(
          errorMessages
            ? `${errorMessage}. Erros: ${errorMessages}`
            : errorMessage,
        );
      } else if (err.response?.status === 401) {
        setError('Sessão expirada. Por favor, faça login novamente.');
        setTimeout(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('companyId');
          router.push('/login');
        }, 2000);
      } else if (err.response?.status === 404) {
        setError(
          err.response?.data?.message ||
            'Empresa não encontrada. Por favor, selecione uma empresa válida.',
        );
      } else if (err.response?.status === 500) {
        setError(
          'Erro no servidor. Por favor, tente novamente mais tarde ou verifique os logs do servidor.',
        );
        devLog.error('❌ Erro 500 - Verifique os logs do backend');
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            'Erro ao carregar produtos. Tente novamente.',
        );
      }
      setProducts([]);
      setPagination((prev) => ({
        ...prev,
        total: 0,
        totalPages: 1,
      }));
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    search,
    categoryId,
    statusFilter,
    router,
    companyId,
  ]);

  // Buscar categorias uma vez ao carregar
  useEffect(() => {
    if (isAuthenticated) {
      fetchCategories();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Disparar busca quando search mudar (com debounce) - apenas reseta a página
  useEffect(() => {
    if (!isAuthenticated) return;

    const timeoutId = setTimeout(() => {
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, isAuthenticated]);

  // ÚNICO useEffect para buscar produtos - dispara quando qualquer filtro mudar
  // search NÃO está aqui porque é tratado separadamente com debounce acima
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAuthenticated,
    pagination.page, // Isso é alterado pelo debounce do search
    pagination.limit,
    categoryId,
    statusFilter,
    companyId,
  ]);

  const handleFilterChange = useCallback(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    // fetchProducts será chamado automaticamente pelo useEffect quando pagination.page mudar
  }, []);

  // Função para alternar status do produto (ativar/desativar)
  const handleToggleProductStatus = async (product: Product) => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        alert('Empresa não selecionada.');
        return;
      }

      const newStatus = !product.isActive;

      await api.put(`/companies/${companyId}/products/${product.id}`, {
        isActive: newStatus,
      });

      // Atualizar lista de produtos
      await fetchProducts();

      alert(
        `Produto ${
          newStatus ? 'ativado com sucesso!' : 'desativado com sucesso!'
        }`,
      );
    } catch (error: any) {
      devLog.error('Erro ao alterar status do produto:', error);
      alert(
        error.response?.data?.message ||
          'Erro ao alterar status do produto. Tente novamente.',
      );
    }
  };

  // Função para deletar produto
  const handleDeleteProduct = async (product: Product) => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        alert('Empresa não selecionada.');
        return;
      }

      await api.delete(`/companies/${companyId}/products/${product.id}`);

      // Atualizar lista de produtos
      await fetchProducts();

      // Fechar dialog
      setDeleteDialog({ open: false, product: null });

      alert('Produto deletado com sucesso!');
    } catch (error: any) {
      devLog.error('Erro ao deletar produto:', error);
      alert(
        error.response?.data?.message ||
          'Erro ao deletar produto. Tente novamente.',
      );
    }
  };

  // Função para adicionar unidades ao produto e gerar PDF
  const handleAddUnits = async (product: Product, quantityToAdd: number) => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        alert('Empresa não selecionada.');
        return;
      }

      // Criar unidades via API (isso cria os registros de ProductUnit no banco para rastreamento)
      const units = await handleCreateUnits(product.id, quantityToAdd);

      if (!units || units.length === 0) {
        alert('Erro ao criar unidades. Tente novamente.');
        return;
      }

      // Atualizar lista de produtos
      await fetchProducts();

      // Atualizar rastreamento se estiver aberto para este produto
      if (
        trackingStockDialog.open &&
        trackingStockDialog.selectedProduct?.id === product.id
      ) {
        await fetchUnitsByProduct(product.id);
      }

      // Fechar dialog de adicionar unidades
      setAddUnitsDialog({ open: false, product: null, quantity: '' });

      // Mostrar dialog de confirmação para baixar PDF
      setPdfConfirmDialog({
        open: true,
        product: product,
        units: units,
        quantity: quantityToAdd,
      });
    } catch (error: any) {
      devLog.error('Erro ao adicionar unidades:', error);
      alert(
        error.response?.data?.message ||
          'Erro ao adicionar unidades. Tente novamente.',
      );
    }
  };

  // Função para remover unidades (cria movimentação tipo OUT)
  const handleRemoveUnits = async (
    product: Product,
    quantityToRemove: number,
  ) => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        alert('Empresa não selecionada.');
        return;
      }

      // Verificar se há estoque suficiente
      const currentStock =
        typeof product.currentStock === 'number'
          ? Math.floor(product.currentStock)
          : 0;

      if (quantityToRemove > currentStock) {
        alert(
          `Não é possível remover ${quantityToRemove} unidades. Estoque atual: ${currentStock}`,
        );
        return;
      }

      // Criar movimentação de saída via API
      await api.post(`/companies/${companyId}/movements`, {
        productId: product.id,
        type: 'OUT',
        quantity: quantityToRemove,
        reason: 'Correção de estoque - Unidades adicionadas incorretamente',
      });

      // Atualizar lista de produtos
      await fetchProducts();

      // Atualizar rastreamento se estiver aberto para este produto
      if (
        trackingStockDialog.open &&
        trackingStockDialog.selectedProduct?.id === product.id
      ) {
        await fetchUnitsByProduct(product.id);
      }

      // Fechar dialog de remover unidades
      setRemoveUnitsDialog({ open: false, product: null, quantity: '' });

      alert(`${quantityToRemove} unidade(s) removida(s) com sucesso!`);
    } catch (error: any) {
      devLog.error('Erro ao remover unidades:', error);
      alert(
        error.response?.data?.message ||
          'Erro ao remover unidades. Tente novamente.',
      );
    }
  };

  // Colunas da tabela
  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div>
            <div className="font-medium">{product.name}</div>
            {product.sku && (
              <div className="text-sm text-muted-foreground">
                SKU: {product.sku}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'unitPrice',
      header: 'Preço',
      cell: ({ row }) => {
        const price = row.getValue('unitPrice') as number | null;
        return price
          ? `R$ ${price.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : '-';
      },
    },
    {
      accessorKey: 'currentStock',
      header: 'Estoque Atual',
      cell: ({ row }) => {
        const product = row.original;

        // Usar currentStock como quantidade única de estoque
        // O currentStock já vem normalizado como number do processo de normalização
        // (a normalização já faz fallback para minStock se currentStock for 0)
        const stock =
          typeof product.currentStock === 'number'
            ? Math.floor(product.currentStock)
            : 0;

        // Log removido para melhorar performance

        // Se o estoque é 0 ou negativo, mostra em laranja
        const isLowStock = stock <= 0;

        return (
          <span
            className={`font-medium ${
              isLowStock
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {stock}
          </span>
        );
      },
    },
    {
      accessorKey: 'category',
      header: 'Categoria',
      cell: ({ row }) => {
        const category = row.original.category;
        return category ? (
          <span className="px-2 py-1 rounded bg-primary/10 text-primary text-sm">
            {category.name}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const product = row.original;
        const statusBadge = getStatusBadge(product);
        return (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}
          >
            {statusBadge.text}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const product = row.original;

        // Função para gerar PDF com códigos de barras
        const generateBarcodePDF = async () => {
          try {
            // Verificar se há estoque antes de gerar
            const stock = product.currentStock || 0;

            if (stock <= 0) {
              alert(
                'Este produto não possui unidades em estoque. Adicione unidades ao estoque antes de gerar os códigos de barras.\n\nO sistema gerará automaticamente quando necessário.',
              );
              return;
            }

            // Importação dinâmica das bibliotecas
            const { jsPDF } = await import('jspdf');
            // jsbarcode - importação dinâmica com fallback
            let JsBarcode;
            try {
              const jsbarcodeModule = await import('jsbarcode');
              JsBarcode = jsbarcodeModule.default || jsbarcodeModule;
            } catch (e) {
              // Fallback: usar require se import falhar
              JsBarcode = require('jsbarcode');
            }

            const doc = new jsPDF();

            // Gerar código base: se não tiver barcode, criar um baseado no ID do produto
            // Formato: PROD-{ID} para o código base
            const baseCode = product.barcode || `PROD-${product.id}`;

            // Título na primeira página
            doc.setFontSize(16);
            doc.text(product.name, 14, 20);
            doc.setFontSize(10);
            doc.text(`Quantidade: ${stock} unidades`, 14, 30);
            doc.setFontSize(8);
            doc.text(`Código base: ${baseCode}`, 14, 38);

            // Adicionar códigos de barras ao PDF
            const codesPerRow = 2; // 2 códigos por linha
            const codeWidth = 85; // Largura de cada código
            const codeHeight = 40; // Altura de cada código
            const spacing = 10; // Espaçamento
            const pageHeight = doc.internal.pageSize.height;
            const startY = 50;

            let currentRow = 0;
            let currentCol = 0;
            let yPosition = startY;

            // Criar canvas temporário para gerar código de barras
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              throw new Error('Não foi possível criar o contexto do canvas');
            }

            for (let i = 0; i < stock; i++) {
              // Verificar se precisa de nova página (antes de adicionar)
              if (yPosition + codeHeight + 20 > pageHeight - 20) {
                doc.addPage();
                yPosition = 20;
                currentRow = 0;
              }

              // Gerar código único para cada unidade
              // Formato: PROD-{ID}-{001}, PROD-{ID}-{002}, etc.
              const unitCode = `${baseCode}-${String(i + 1).padStart(3, '0')}`;

              // Limpar canvas antes de gerar novo código
              canvas.width = 200;
              canvas.height = 100;

              // Gerar código de barras único para esta unidade
              JsBarcode(canvas, unitCode, {
                format: 'CODE128',
                width: 2,
                height: 50,
                displayValue: true,
              });

              // Calcular posição X (coluna)
              const xPosition = 14 + currentCol * (codeWidth + spacing);

              // Adicionar imagem do código de barras
              const imgData = canvas.toDataURL('image/png');
              doc.addImage(
                imgData,
                'PNG',
                xPosition,
                yPosition,
                codeWidth,
                codeHeight,
              );

              // Adicionar nome do produto abaixo do código
              doc.setFontSize(7);
              const nameText = product.name.substring(0, 20);
              doc.text(nameText, xPosition, yPosition + codeHeight + 5);

              // Adicionar código da unidade abaixo do nome
              doc.setFontSize(6);
              doc.text(
                `Unid: ${unitCode}`,
                xPosition,
                yPosition + codeHeight + 10,
              );

              // Avançar para próxima posição
              currentCol++;
              if (currentCol >= codesPerRow) {
                currentCol = 0;
                currentRow++;
                yPosition += codeHeight + spacing + 20; // altura do código + espaço + texto
              }
            }

            // Salvar PDF
            const fileName = `${product.name.replace(
              /[^a-z0-9]/gi,
              '_',
            )}-codigos-barras.pdf`;
            doc.save(fileName);
          } catch (error) {
            devLog.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
          }
        };

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={async () => {
                  setDetailsDialog({
                    open: true,
                    product: product,
                    monthlySalesAvg: undefined,
                    isLoadingAvg: true,
                  });

                  const monthlyAvg = await calculateMonthlySalesAverage(
                    product.id,
                  );

                  setDetailsDialog({
                    open: true,
                    product: product,
                    monthlySalesAvg: monthlyAvg,
                    isLoadingAvg: false,
                  });
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhamento
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  // Abrir modal de rastreamento de estoque já com o produto selecionado
                  setTrackingStockDialog({
                    open: true,
                    selectedProduct: product,
                    productSearch: product.name,
                    dateSearch: '',
                    units: [],
                    groupedByDate: {},
                    isLoading: false,
                    productCreatedAt: null,
                  });
                  // Buscar as unidades do produto automaticamente
                  fetchUnitsByProduct(product.id);
                }}
              >
                <Activity className="mr-2 h-4 w-4" />
                Rastreamento
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href={`/dashboard/products/${product.id}`}
                  className="flex items-center"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setAddUnitsDialog({
                    open: true,
                    product: product,
                    quantity: '',
                  })
                }
              >
                <PackagePlus className="mr-2 h-4 w-4" />
                Adicionar Unidades
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  setRemoveUnitsDialog({
                    open: true,
                    product: product,
                    quantity: '',
                  })
                }
                disabled={
                  typeof product.currentStock === 'number'
                    ? Math.floor(product.currentStock) <= 0
                    : true
                }
              >
                <PackageMinus className="mr-2 h-4 w-4" />
                Remover Unidades
              </DropdownMenuItem>
              <DropdownMenuItem onClick={generateBarcodePDF}>
                <FileDown className="mr-2 h-4 w-4" />
                Gerar PDF de Códigos de Barras
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleToggleProductStatus(product)}
              >
                {(() => {
                  const status = getProductStatus(product);
                  if (status === 'inativo') {
                    return (
                      <>
                        <Power className="mr-2 h-4 w-4" />
                        Ativar Produto
                      </>
                    );
                  } else {
                    return (
                      <>
                        <PowerOff className="mr-2 h-4 w-4" />
                        Desativar Produto
                      </>
                    );
                  }
                })()}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setDeleteDialog({
                    open: true,
                    product: product,
                  })
                }
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir Produto
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Produtos é uma extensão padrão, sempre ativa
  // Não precisa verificar extensão

  if (isLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produtos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus produtos com estoque inteligente
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setTrackingStockDialog({
                open: true,
                selectedProduct: null,
                productSearch: '',
                dateSearch: '',
                units: [],
                groupedByDate: {},
                productCreatedAt: null,
                isLoading: false,
              });
            }}
          >
            <History className="mr-2 h-4 w-4" />
            Rastreamento de Estoque
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setAddStockDialog({ open: true, productId: '', quantity: '' })
            }
          >
            <Warehouse className="mr-2 h-4 w-4" />
            Adicionar/Retocar Estoque
          </Button>
          <Link href="/dashboard/products/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome ou código de barras..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    if (e.target.value === '') {
                      handleFilterChange();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleFilterChange();
                    }
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={safeCategoryId}
                onValueChange={(value) => {
                  // Garantir que nunca seja string vazia ou valor inválido
                  const trimmedValue = value?.trim();
                  const newValue =
                    trimmedValue &&
                    trimmedValue !== '' &&
                    trimmedValue !== '0' &&
                    trimmedValue !== 'null' &&
                    trimmedValue !== 'undefined'
                      ? trimmedValue
                      : undefined;
                  setCategoryId(newValue);
                  setTimeout(handleFilterChange, 0);
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(categories) && categories.length > 0
                    ? categories
                        .filter((category) => {
                          // Garantir que categoria seja válida
                          if (!category || !category.id) return false;
                          const id = Number(category.id);
                          return (
                            !isNaN(id) &&
                            id > 0 &&
                            category.name &&
                            typeof category.name === 'string' &&
                            category.name.trim() !== ''
                          );
                        })
                        .map((category) => {
                          // Garantir que o valor seja sempre uma string válida e não vazia
                          const id = Number(category.id);
                          if (isNaN(id) || id <= 0) return null;

                          const categoryValue = String(id).trim();
                          if (
                            !categoryValue ||
                            categoryValue === '' ||
                            categoryValue === '0'
                          ) {
                            return null;
                          }

                          return (
                            <SelectItem key={category.id} value={categoryValue}>
                              {String(category.name).trim()}
                            </SelectItem>
                          );
                        })
                        .filter((item) => item !== null)
                    : null}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusFilter || 'all'}
                onValueChange={(value) => {
                  if (
                    value === 'all' ||
                    value === '' ||
                    value === 'null' ||
                    value === 'undefined'
                  ) {
                    setStatusFilter('all');
                  } else if (
                    value === 'ativo' ||
                    value === 'rascunho' ||
                    value === 'inativo'
                  ) {
                    setStatusFilter(value);
                  } else {
                    setStatusFilter('all');
                  }
                  setTimeout(handleFilterChange, 0);
                }}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleFilterChange}
                className="w-full"
                variant="outline"
              >
                Filtrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Produtos</CardTitle>
          <CardDescription>
            {pagination.total > 0
              ? `Mostrando ${
                  (pagination.page - 1) * pagination.limit + 1
                }-${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total,
                )} de ${pagination.total} produtos`
              : 'Nenhum produto encontrado'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum produto encontrado.
              </p>
              <Link href="/dashboard/products/new">
                <Button>Adicionar primeiro produto</Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        Nenhum resultado encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Paginação */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(1, prev.page - 1),
                        }))
                      }
                      disabled={pagination.page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.totalPages, prev.page + 1),
                        }))
                      }
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog para adicionar unidades */}
      <AlertDialog
        open={addUnitsDialog.open}
        onOpenChange={(open) => setAddUnitsDialog({ ...addUnitsDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Adicionar Unidades</AlertDialogTitle>
            <AlertDialogDescription>
              Informe a quantidade de novas unidades para o produto{' '}
              <strong>{addUnitsDialog.product?.name}</strong>. O sistema gerará
              automaticamente códigos de barras únicos para cada nova unidade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade de Unidades</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                step="1"
                placeholder="Ex: 10"
                value={addUnitsDialog.quantity}
                onChange={(e) =>
                  setAddUnitsDialog({
                    ...addUnitsDialog,
                    quantity: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Estoque atual: {addUnitsDialog.product?.currentStock || 0}{' '}
                unidades
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setAddUnitsDialog({ open: false, product: null, quantity: '' })
              }
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!addUnitsDialog.product) return;

                const quantity = parseInt(addUnitsDialog.quantity, 10);
                if (isNaN(quantity) || quantity <= 0) {
                  alert(
                    'Por favor, informe uma quantidade válida maior que 0.',
                  );
                  return;
                }

                await handleAddUnits(addUnitsDialog.product, quantity);
              }}
              disabled={
                !addUnitsDialog.quantity ||
                parseInt(addUnitsDialog.quantity, 10) <= 0
              }
            >
              Adicionar Unidades
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para remover unidades */}
      <AlertDialog
        open={removeUnitsDialog.open}
        onOpenChange={(open) =>
          setRemoveUnitsDialog({ ...removeUnitsDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Unidades</AlertDialogTitle>
            <AlertDialogDescription>
              Informe a quantidade de unidades a serem removidas do produto{' '}
              <strong>{removeUnitsDialog.product?.name}</strong>. Esta ação
              criará uma movimentação de saída no estoque.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="remove-quantity">
                Quantidade de Unidades a Remover
              </Label>
              <Input
                id="remove-quantity"
                type="number"
                min="1"
                step="1"
                placeholder="Ex: 5"
                value={removeUnitsDialog.quantity}
                onChange={(e) =>
                  setRemoveUnitsDialog({
                    ...removeUnitsDialog,
                    quantity: e.target.value,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Estoque atual: {removeUnitsDialog.product?.currentStock || 0}{' '}
                unidades
              </p>
              {removeUnitsDialog.quantity && removeUnitsDialog.product && (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  Após a remoção:{' '}
                  {Math.max(
                    0,
                    (removeUnitsDialog.product.currentStock || 0) -
                      parseInt(removeUnitsDialog.quantity, 10) || 0,
                  )}{' '}
                  unidades
                </p>
              )}
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setRemoveUnitsDialog({
                  open: false,
                  product: null,
                  quantity: '',
                })
              }
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!removeUnitsDialog.product) return;

                const quantity = parseInt(removeUnitsDialog.quantity, 10);
                if (isNaN(quantity) || quantity <= 0) {
                  alert(
                    'Por favor, informe uma quantidade válida maior que 0.',
                  );
                  return;
                }

                const currentStock =
                  typeof removeUnitsDialog.product.currentStock === 'number'
                    ? Math.floor(removeUnitsDialog.product.currentStock)
                    : 0;

                if (quantity > currentStock) {
                  alert(
                    `Não é possível remover ${quantity} unidades. Estoque atual: ${currentStock}`,
                  );
                  return;
                }

                await handleRemoveUnits(removeUnitsDialog.product, quantity);
              }}
              disabled={(() => {
                if (!removeUnitsDialog.quantity) return true;
                const quantity = parseInt(removeUnitsDialog.quantity, 10);
                if (isNaN(quantity) || quantity <= 0) return true;
                if (!removeUnitsDialog.product) return true;
                const currentStock =
                  typeof removeUnitsDialog.product.currentStock === 'number'
                    ? Math.floor(removeUnitsDialog.product.currentStock)
                    : 0;
                return currentStock < quantity;
              })()}
            >
              Remover Unidades
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para baixar PDF após adicionar unidades */}
      <AlertDialog
        open={pdfConfirmDialog.open}
        onOpenChange={(open) =>
          setPdfConfirmDialog({ ...pdfConfirmDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Download do PDF de Códigos de Barras
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pdfConfirmDialog.product && (
                <>
                  Deseja baixar o PDF com os códigos de barras das{' '}
                  <strong>
                    {pdfConfirmDialog.quantity} unidade(s) nova(s)
                  </strong>{' '}
                  do produto <strong>{pdfConfirmDialog.product.name}</strong>?
                  <br />
                  <br />O PDF contém os códigos de barras únicos gerados
                  automaticamente para cada uma das novas unidades adicionadas
                  ao estoque.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setPdfConfirmDialog({
                  open: false,
                  product: null,
                  units: [],
                  quantity: 0,
                })
              }
            >
              Não, obrigado
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (
                  pdfConfirmDialog.product &&
                  pdfConfirmDialog.units &&
                  pdfConfirmDialog.units.length > 0
                ) {
                  // Gerar e baixar o PDF
                  await generateUnitsBarcodePDF(
                    pdfConfirmDialog.units,
                    pdfConfirmDialog.product.name,
                  );

                  // Fechar dialog
                  setPdfConfirmDialog({
                    open: false,
                    product: null,
                    units: [],
                    quantity: 0,
                  });

                  alert(
                    `PDF com ${pdfConfirmDialog.quantity} código(s) de barras gerado com sucesso!`,
                  );
                }
              }}
            >
              Sim, baixar PDF
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para excluir produto */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto{' '}
              <strong>{deleteDialog.product?.name}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita. Todos os dados relacionados ao
              produto serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteDialog({ open: false, product: null })}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (deleteDialog.product) {
                  await handleDeleteProduct(deleteDialog.product);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para detalhes do produto */}
      <Dialog
        open={detailsDialog.open}
        onOpenChange={(open) => setDetailsDialog({ ...detailsDialog, open })}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Produto</DialogTitle>
            <DialogDescription>
              Informações completas sobre o produto
            </DialogDescription>
          </DialogHeader>
          {detailsDialog.product && (
            <div className="space-y-6 py-4">
              {/* Nome e SKU */}
              <div>
                <h3 className="text-2xl font-bold">
                  {detailsDialog.product.name}
                </h3>
                {detailsDialog.product.sku && (
                  <p className="text-sm text-muted-foreground mt-1">
                    SKU: {detailsDialog.product.sku}
                  </p>
                )}
              </div>

              {/* Grid de informações principais */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Preço por Unidade */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Preço por Unidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {detailsDialog.product.unitPrice ? (
                        `R$ ${detailsDialog.product.unitPrice.toLocaleString(
                          'pt-BR',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          },
                        )}`
                      ) : (
                        <span className="text-muted-foreground">
                          Não informado
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Categoria */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Categoria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-medium">
                      {detailsDialog.product.category?.name || (
                        <span className="text-muted-foreground">
                          Sem categoria
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Status */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const statusBadge = getStatusBadge(
                          detailsDialog.product,
                        );
                        return (
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}
                          >
                            {statusBadge.text}
                          </span>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Média de Venda Mensal */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Média de Venda Mensal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {detailsDialog.isLoadingAvg ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Calculando...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="text-3xl font-bold">
                          <span className="text-blue-600 dark:text-blue-400">
                            {detailsDialog.monthlySalesAvg !== undefined
                              ? detailsDialog.monthlySalesAvg.toLocaleString(
                                  'pt-BR',
                                  {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  },
                                )
                              : '0'}
                          </span>
                          <span className="text-sm font-normal text-muted-foreground ml-2">
                            unidades/mês
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Baseado nos últimos 6 meses
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar/retocar estoque */}
      {addStockDialog.open && (
        <Dialog
          open={addStockDialog.open}
          onOpenChange={(open) =>
            setAddStockDialog({ ...addStockDialog, open })
          }
        >
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar/Retocar Estoque</DialogTitle>
              <DialogDescription>
                Selecione um produto e informe a quantidade de unidades a
                adicionar. O sistema gerará códigos de barras únicos para cada
                nova unidade.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Seleção de Produto */}
              <div className="space-y-2">
                <Label htmlFor="product-select">Produto</Label>
                <Select
                  value={addStockDialog.productId}
                  onValueChange={(value) =>
                    setAddStockDialog({ ...addStockDialog, productId: value })
                  }
                >
                  <SelectTrigger id="product-select">
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectableStockProducts.map((product) => (
                      <SelectItem
                        key={product.id}
                        value={product.id.toString()}
                      >
                        {product.name}
                        {product.category && (
                          <span className="text-muted-foreground ml-2">
                            - {product.category.name}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantidade */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade de Unidades</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ex: 10"
                  value={addStockDialog.quantity}
                  onChange={(e) =>
                    setAddStockDialog({
                      ...addStockDialog,
                      quantity: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Cada unidade receberá um código de barras único
                </p>
              </div>

              {/* Botões de ação */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    setAddStockDialog({
                      open: false,
                      productId: '',
                      quantity: '',
                    })
                  }
                >
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    if (!addStockDialog.productId || !addStockDialog.quantity) {
                      alert(
                        'Por favor, selecione um produto e informe a quantidade.',
                      );
                      return;
                    }

                    const quantity = parseInt(addStockDialog.quantity, 10);
                    if (isNaN(quantity) || quantity <= 0) {
                      alert(
                        'Por favor, informe uma quantidade válida maior que 0.',
                      );
                      return;
                    }

                    const productId = parseInt(addStockDialog.productId, 10);
                    const selectedProduct = products.find(
                      (p) => p.id === productId,
                    );

                    if (!selectedProduct) {
                      alert('Produto não encontrado.');
                      return;
                    }

                    // Criar unidades
                    const units = await handleCreateUnits(productId, quantity);

                    if (units && units.length > 0) {
                      // Atualizar lista de produtos
                      await fetchProducts();

                      // Atualizar rastreamento se estiver aberto para este produto
                      if (
                        trackingStockDialog.open &&
                        trackingStockDialog.selectedProduct?.id === productId
                      ) {
                        devLog.log(
                          '🔄 Atualizando rastreamento após criar unidades...',
                        );
                        await fetchUnitsByProduct(productId);
                      }

                      // Fechar dialog de adicionar estoque
                      setAddStockDialog({
                        open: false,
                        productId: '',
                        quantity: '',
                      });

                      // Mostrar dialog de confirmação para baixar PDF
                      setPdfConfirmDialog({
                        open: true,
                        product: selectedProduct,
                        units: units,
                        quantity: quantity,
                      });
                    }
                  }}
                  disabled={
                    !addStockDialog.productId ||
                    !addStockDialog.quantity ||
                    parseInt(addStockDialog.quantity, 10) <= 0
                  }
                >
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Criar Unidades
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para rastreamento de movimentações */}
      <Dialog
        open={trackingDialog.open}
        onOpenChange={(open) => setTrackingDialog({ ...trackingDialog, open })}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rastreamento de Movimentações</DialogTitle>
            <DialogDescription>
              Histórico completo de adições e retiradas do produto{' '}
              <strong>{trackingDialog.product?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          {trackingDialog.product && (
            <div className="py-4">
              {trackingDialog.isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : trackingDialog.movements.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma movimentação encontrada para este produto.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Observação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trackingDialog.movements.map((movement: any) => (
                        <TableRow key={movement.id}>
                          <TableCell>
                            {format(
                              new Date(movement.createdAt),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR },
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                movement.type === 'IN'
                                  ? 'default'
                                  : 'destructive'
                              }
                            >
                              {movement.type === 'IN' ? 'Entrada' : 'Saída'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {Number(movement.quantity) || 0}
                            {' unidades'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {movement.reason || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para rastreamento de estoque */}
      {trackingStockDialog.open && (
        <Dialog
          open={trackingStockDialog.open}
          onOpenChange={(open) =>
            setTrackingStockDialog({ ...trackingStockDialog, open })
          }
        >
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rastreamento de Estoque</DialogTitle>
              <DialogDescription>
                Selecione um produto para rastrear suas unidades e visualizar o
                histórico de adições
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Seleção de Produto */}
              {!trackingStockDialog.selectedProduct ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Selecionar Produto
                    </CardTitle>
                    <CardDescription>
                      Pesquise e selecione um produto para rastrear suas
                      unidades
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Input
                            placeholder="Buscar produto por nome..."
                            value={trackingStockDialog.productSearch}
                            onChange={(e) =>
                              setTrackingStockDialog((prev) => ({
                                ...prev,
                                productSearch: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <Button
                          onClick={() => {
                            const filtered = filteredTrackingProducts;
                            if (filtered.length === 1) {
                              setTrackingStockDialog((prev) => ({
                                ...prev,
                                selectedProduct: filtered[0],
                              }));
                              fetchUnitsByProduct(filtered[0].id);
                            } else if (filtered.length > 1) {
                              alert(
                                `Foram encontrados ${filtered.length} produtos. Seja mais específico na busca.`,
                              );
                            } else {
                              alert('Nenhum produto encontrado.');
                            }
                          }}
                          disabled={!trackingStockDialog.productSearch?.trim()}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-2 max-h-64 overflow-y-auto">
                        {filteredTrackingProducts.map((product) => (
                          <Button
                            key={product.id}
                            variant="outline"
                            className="justify-start h-auto py-3"
                            onClick={() => {
                              setTrackingStockDialog((prev) => ({
                                ...prev,
                                selectedProduct: product,
                              }));
                              fetchUnitsByProduct(product.id);
                            }}
                          >
                            <div className="text-left flex-1">
                              <div className="font-medium">{product.name}</div>
                              {product.category && (
                                <div className="text-xs text-muted-foreground">
                                  {product.category.name}
                                </div>
                              )}
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Cabeçalho com informações do produto */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>
                            {trackingStockDialog.selectedProduct.name}
                          </CardTitle>
                          <CardDescription>
                            Rastreamento de unidades deste produto
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setTrackingStockDialog((prev) => ({
                              ...prev,
                              selectedProduct: null,
                              units: [],
                              groupedByDate: {},
                              productSearch: '',
                            }));
                          }}
                        >
                          Trocar Produto
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>

                  {/* Busca por data */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Filtrar por Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={trackingStockDialog.dateSearch}
                          onChange={(e) =>
                            setTrackingStockDialog((prev) => ({
                              ...prev,
                              dateSearch: e.target.value,
                            }))
                          }
                          max={format(new Date(), 'yyyy-MM-dd')}
                        />
                        {trackingStockDialog.dateSearch && (
                          <Button
                            variant="outline"
                            onClick={() =>
                              setTrackingStockDialog((prev) => ({
                                ...prev,
                                dateSearch: '',
                              }))
                            }
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline Visual - Linha do Tempo */}
                  {trackingStockDialog.isLoading ? (
                    <div className="flex items-center justify-center h-64">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : trackingTimelineEntries.length === 0 ? (
                    <Card>
                      <CardContent className="py-8">
                        <p className="text-center text-muted-foreground">
                          Nenhuma unidade encontrada para este produto.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="relative">
                      {/* Linha vertical da timeline */}
                      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />

                      {/* Itens da timeline */}
                      <div className="space-y-8">
                        {trackingTimelineEntries.map((entry, index) => {
                          const isLast =
                            index === trackingTimelineEntries.length - 1;
                          const {
                            date,
                            hasInitialRegistration,
                            realUnits,
                            availableUnits,
                            soldUnits,
                          } = entry;

                          return (
                            <div key={date} className="relative flex gap-6">
                              {/* Círculo/Nó da timeline */}
                              <div className="relative z-10 flex-shrink-0">
                                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg border-4 border-background">
                                  <Calendar className="h-6 w-6" />
                                </div>
                                {/* Linha conectando ao próximo (se não for o último) */}
                                {!isLast && (
                                  <div className="absolute left-1/2 top-16 -translate-x-1/2 w-0.5 h-8 bg-border" />
                                )}
                              </div>

                              {/* Conteúdo do item da timeline */}
                              <div className="flex-1 pb-8">
                                <Card className="w-full">
                                  <CardHeader>
                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                      <div>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                          {format(
                                            new Date(date),
                                            "dd 'de' MMMM 'de' yyyy",
                                            {
                                              locale: ptBR,
                                            },
                                          )}
                                          {hasInitialRegistration && (
                                            <Badge
                                              variant="default"
                                              className="bg-blue-500 dark:bg-blue-600"
                                            >
                                              Registro Inicial
                                            </Badge>
                                          )}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                          {format(new Date(date), 'EEEE', {
                                            locale: ptBR,
                                          })}
                                          {hasInitialRegistration && (
                                            <span className="block mt-1 text-blue-600 dark:text-blue-400 font-medium">
                                              Data de cadastro do produto
                                            </span>
                                          )}
                                        </CardDescription>
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                          variant="secondary"
                                          className="text-base px-3 py-1"
                                        >
                                          {realUnits.length} unidade(s)
                                        </Badge>
                                        <Badge
                                          variant="default"
                                          className="text-base px-3 py-1 bg-green-500 dark:bg-green-600"
                                        >
                                          {availableUnits.length}{' '}
                                          disponível(eis)
                                        </Badge>
                                        <Badge
                                          variant="destructive"
                                          className="text-base px-3 py-1"
                                        >
                                          {soldUnits.length} vendida(s)
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="space-y-4">
                                      {/* Botão de Download PDF */}
                                      <div className="flex gap-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={async () => {
                                            if (availableUnits.length === 0) {
                                              alert(
                                                'Não há unidades disponíveis para gerar PDF.',
                                              );
                                              return;
                                            }

                                            // Gerar PDF das unidades disponíveis desta data
                                            try {
                                              const { jsPDF } = await import(
                                                'jspdf'
                                              );
                                              let JsBarcode;
                                              try {
                                                const jsbarcodeModule =
                                                  await import('jsbarcode');
                                                JsBarcode =
                                                  jsbarcodeModule.default ||
                                                  jsbarcodeModule;
                                              } catch (e) {
                                                JsBarcode = require('jsbarcode');
                                              }

                                              const doc = new jsPDF();
                                              doc.setFontSize(16);
                                              doc.text(
                                                `${trackingStockDialog.selectedProduct?.name}`,
                                                14,
                                                20,
                                              );
                                              doc.setFontSize(10);
                                              doc.text(
                                                `Data: ${format(
                                                  new Date(date),
                                                  'dd/MM/yyyy',
                                                  {
                                                    locale: ptBR,
                                                  },
                                                )}`,
                                                14,
                                                30,
                                              );
                                              doc.text(
                                                `Unidades disponíveis: ${availableUnits.length}`,
                                                14,
                                                38,
                                              );

                                              const codesPerRow = 2;
                                              const codeWidth = 85;
                                              const codeHeight = 40;
                                              const spacing = 10;
                                              let yPosition = 50;
                                              let currentCol = 0;
                                              const canvas =
                                                document.createElement(
                                                  'canvas',
                                                );
                                              const ctx =
                                                canvas.getContext('2d');

                                              if (!ctx) return;

                                              availableUnits.forEach(
                                                (unit: any) => {
                                                  if (
                                                    yPosition +
                                                      codeHeight +
                                                      20 >
                                                    doc.internal.pageSize
                                                      .height -
                                                      20
                                                  ) {
                                                    doc.addPage();
                                                    yPosition = 20;
                                                    currentCol = 0;
                                                  }

                                                  canvas.width = 200;
                                                  canvas.height = 100;
                                                  JsBarcode(
                                                    canvas,
                                                    unit.barcode,
                                                    {
                                                      format: 'CODE128',
                                                      width: 2,
                                                      height: 50,
                                                      displayValue: true,
                                                    },
                                                  );

                                                  const xPosition =
                                                    14 +
                                                    currentCol *
                                                      (codeWidth + spacing);
                                                  const imgData =
                                                    canvas.toDataURL(
                                                      'image/png',
                                                    );
                                                  doc.addImage(
                                                    imgData,
                                                    'PNG',
                                                    xPosition,
                                                    yPosition,
                                                    codeWidth,
                                                    codeHeight,
                                                  );

                                                  doc.setFontSize(7);
                                                  doc.text(
                                                    trackingStockDialog.selectedProduct?.name?.substring(
                                                      0,
                                                      20,
                                                    ) || 'Produto',
                                                    xPosition,
                                                    yPosition + codeHeight + 5,
                                                  );
                                                  doc.setFontSize(6);
                                                  doc.text(
                                                    `Unid: ${unit.barcode}`,
                                                    xPosition,
                                                    yPosition + codeHeight + 10,
                                                  );

                                                  currentCol++;
                                                  if (
                                                    currentCol >= codesPerRow
                                                  ) {
                                                    currentCol = 0;
                                                    yPosition +=
                                                      codeHeight + spacing + 20;
                                                  }
                                                },
                                              );

                                              const fileName = `${trackingStockDialog.selectedProduct?.name?.replace(
                                                /[^a-z0-9]/gi,
                                                '_',
                                              )}-${date}.pdf`;
                                              doc.save(fileName);
                                            } catch (error) {
                                              devLog.error(
                                                'Erro ao gerar PDF:',
                                                error,
                                              );
                                              alert('Erro ao gerar PDF.');
                                            }
                                          }}
                                          disabled={availableUnits.length === 0}
                                        >
                                          <Download className="mr-2 h-4 w-4" />
                                          Baixar PDF ({availableUnits.length})
                                        </Button>
                                      </div>

                                      {/* Mensagem de registro inicial se aplicável */}
                                      {hasInitialRegistration &&
                                        realUnits.length === 0 && (
                                          <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                              Este é o registro inicial do
                                              produto. Unidades serão
                                              adicionadas conforme o estoque for
                                              atualizado.
                                            </AlertDescription>
                                          </Alert>
                                        )}

                                      {/* Tabela de Unidades */}
                                      {realUnits.length > 0 && (
                                        <div className="overflow-x-auto">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead>
                                                  Código de Barras
                                                </TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>
                                                  Data/Hora de Criação
                                                </TableHead>
                                                <TableHead>
                                                  Data/Hora de Venda
                                                </TableHead>
                                                <TableHead>Ações</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {realUnits.map((unit: any) => (
                                                <TableRow key={unit.id}>
                                                  <TableCell>
                                                    <code className="px-2 py-1 bg-muted rounded text-sm">
                                                      {unit.barcode}
                                                    </code>
                                                  </TableCell>
                                                  <TableCell>
                                                    {unit.isSold ? (
                                                      <Badge
                                                        variant="destructive"
                                                        className="gap-1"
                                                      >
                                                        <CheckCircle className="h-3 w-3" />
                                                        Vendido
                                                      </Badge>
                                                    ) : (
                                                      <Badge
                                                        variant="secondary"
                                                        className="gap-1"
                                                      >
                                                        <XCircle className="h-3 w-3" />
                                                        Disponível
                                                      </Badge>
                                                    )}
                                                  </TableCell>
                                                  <TableCell>
                                                    {format(
                                                      new Date(unit.createdAt),
                                                      'dd/MM/yyyy HH:mm',
                                                      { locale: ptBR },
                                                    )}
                                                  </TableCell>
                                                  <TableCell>
                                                    {unit.soldAt
                                                      ? format(
                                                          new Date(unit.soldAt),
                                                          'dd/MM/yyyy HH:mm',
                                                          { locale: ptBR },
                                                        )
                                                      : '-'}
                                                  </TableCell>
                                                  <TableCell>
                                                    {!unit.isSold ? (
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={async () => {
                                                          await handleMarkUnitAsSold(
                                                            unit.id,
                                                          );
                                                        }}
                                                      >
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Marcar como Vendido
                                                      </Button>
                                                    ) : (
                                                      <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                          // Mostrar detalhes da venda
                                                          alert(
                                                            `Vendido em: ${format(
                                                              new Date(
                                                                unit.soldAt,
                                                              ),
                                                              'dd/MM/yyyy HH:mm',
                                                              { locale: ptBR },
                                                            )}\n` +
                                                              (unit.sellerName
                                                                ? `Vendedor: ${unit.sellerName}\n`
                                                                : '') +
                                                              (unit.attendantName
                                                                ? `Atendente: ${unit.attendantName}\n`
                                                                : '') +
                                                              (unit.buyerDescription
                                                                ? `Comprador: ${unit.buyerDescription}\n`
                                                                : '') +
                                                              (unit.paymentMethods
                                                                ? `Pagamento: ${unit.paymentMethods}\n`
                                                                : '') +
                                                              (unit.saleDescription
                                                                ? `Descrição: ${unit.saleDescription}`
                                                                : ''),
                                                          );
                                                        }}
                                                      >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Ver Detalhes
                                                      </Button>
                                                    )}
                                                  </TableCell>
                                                </TableRow>
                                              ))}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
