/**
 * Página de Extensões - Play Store do Sistema
 *
 * Loja de extensões onde usuários podem adquirir funcionalidades adicionais.
 */

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useExtensions } from '@/contexts/ExtensionsContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  AlertCircle,
  Check,
  X,
  Zap,
  Calendar,
  DollarSign,
  Sparkles,
  Search,
  Package,
  TrendingUp,
  Settings,
  Filter,
  CheckCircle,
  Star,
  MessageSquare,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Mapeamento de ícones do lucide-react
const iconMap: Record<string, LucideIcon> = {
  Calendar,
  Package,
  Zap,
  Settings,
  DollarSign,
  TrendingUp,
  Sparkles,
  Check,
  X,
  AlertCircle,
  Search,
  Filter,
  // Adicione mais ícones conforme necessário
};

// Função helper para obter o componente de ícone
function getExtensionIcon(iconName?: string): LucideIcon {
  if (!iconName) return Package; // Ícone padrão
  return iconMap[iconName] || Package;
}

interface Extension {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
  price: number;
  icon?: string; // Nome do ícone do lucide-react
  features?: string;
  dependencies?: string; // JSON com array de nomes de extensões necessárias
  isActive: boolean;
  createdAt: string;
}

interface CompanyExtension {
  id: number;
  isActive: boolean;
  purchasedAt: string;
  expiresAt?: string | null;
  extension: Extension;
}

export default function ExtensionsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, companyId } = useAuth();
  const { hasExtension, refresh: refreshExtensions } = useExtensions();

  // Helper para verificar se serviços está instalado
  const hasServicesExtension = hasExtension('services_management');

  const [availableExtensions, setAvailableExtensions] = useState<Extension[]>(
    [],
  );
  const [companyExtensions, setCompanyExtensions] = useState<
    CompanyExtension[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState<number | null>(null);
  const [isDeactivating, setIsDeactivating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Modais
  const [showActiveModal, setShowActiveModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState<Extension | null>(
    null,
  );
  const [pendingExtensionId, setPendingExtensionId] = useState<number | null>(
    null,
  );

  // Feedback
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 0,
    comment: '',
    suggestions: '',
  });
  const [userFeedback, setUserFeedback] = useState<any>(null);

  // Filtros e busca
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'active' | 'available' | 'new'
  >('all');
  const [showNewOnly, setShowNewOnly] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Aguarda um pouco para garantir que o companyId está disponível
    if (isAuthenticated && !authLoading) {
      const checkCompanyId = () => {
        const storedCompanyId = typeof window !== 'undefined' 
          ? localStorage.getItem('companyId') 
          : null;
        
        // Se temos companyId (do contexto ou localStorage), busca os dados
        if (storedCompanyId || companyId) {
          const finalCompanyId = companyId || storedCompanyId;
          if (finalCompanyId) {
            console.log('[ExtensionsPage] CompanyId encontrado, buscando dados:', finalCompanyId);
            fetchData();
            return;
          }
        }
        
        // Só redireciona se realmente não houver companyId após um delay maior
        // Isso evita redirecionamentos prematuros em mobile
        const redirectTimer = setTimeout(() => {
          const stillNoCompanyId = typeof window !== 'undefined' 
            ? !localStorage.getItem('companyId') 
            : true;
          const stillNoCompanyIdInContext = !companyId;
          
          if (stillNoCompanyId && stillNoCompanyIdInContext) {
            console.log('[ExtensionsPage] Nenhum companyId encontrado, redirecionando para workspace');
            router.push('/workspace');
          }
        }, 1000); // Delay maior para mobile
        
        return () => clearTimeout(redirectTimer);
      };
      
      // Delay para garantir que o contexto está atualizado
      const timer = setTimeout(checkCompanyId, 200);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, authLoading, companyId, router]);

  const fetchData = async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [extensionsRes, companyExtensionsRes] = await Promise.all([
        api.get('/extensions').catch((err) => {
          console.error('Erro ao buscar extensões:', err);
          return { data: { data: [] } };
        }),
        api.get(`/companies/${companyId}/extensions`).catch((err) => {
          console.error('Erro ao buscar extensões da empresa:', err);
          return { data: { data: [] } };
        }),
      ]);

      const available = extensionsRes.data?.data || extensionsRes.data || [];
      const company = companyExtensionsRes.data?.data || companyExtensionsRes.data || [];
      
      console.log('[ExtensionsPage] Extensões disponíveis:', available);
      console.log('[ExtensionsPage] Extensões da empresa:', company);
      console.log('[ExtensionsPage] Total de extensões disponíveis:', available.length);
      console.log('[ExtensionsPage] Total de extensões da empresa:', company.length);
      
      setAvailableExtensions(available);
      setCompanyExtensions(company);
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao carregar extensões. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExtension = async (
    extensionId: number,
    isActive: boolean,
    skipConfirmation = false,
  ) => {
    if (!companyId) return;

    try {
      if (isActive) {
        // Se não pular confirmação, mostra modal de confirmação para desativar
        if (!skipConfirmation) {
          setPendingExtensionId(extensionId);
          setShowDeactivateModal(true);
          return;
        }
        setIsDeactivating(extensionId);
        await api.delete(`/companies/${companyId}/extensions/${extensionId}`);
        setSuccess('Extensão desativada com sucesso!');
        setSuccessMessage('Extensão desativada com sucesso!');
      } else {
        // Mostra modal de confirmação antes de adquirir
        setPendingExtensionId(extensionId);
        setShowConfirmModal(true);
        return;
      }

      // Atualiza os dados locais e o contexto global
      await Promise.all([fetchData(), refreshExtensions()]);

      // Mantém a mensagem de sucesso por mais tempo
      setTimeout(() => {
        setSuccess(null);
        setShowSuccessModal(false);
      }, 5000);
    } catch (err: any) {
      console.error('Erro ao alterar extensão:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao alterar extensão. Tente novamente.',
      );
    } finally {
      setIsActivating(null);
      setIsDeactivating(null);
    }
  };

  const handleConfirmDeactivation = async () => {
    if (!companyId || !pendingExtensionId) return;

    try {
      setIsDeactivating(pendingExtensionId);
      setError(null);
      setSuccess(null);
      setShowDeactivateModal(false);

      console.log(`[handleConfirmDeactivation] Desativando extensão ${pendingExtensionId} para empresa ${companyId}`);
      
      const response = await api.delete(
        `/companies/${companyId}/extensions/${pendingExtensionId}`,
      );
      
      console.log(`[handleConfirmDeactivation] Resposta do servidor:`, response.data);
      
      setSuccess('Extensão desativada com sucesso!');
      setSuccessMessage('Extensão desativada com sucesso!');

      // Atualiza os dados locais e o contexto global
      await Promise.all([fetchData(), refreshExtensions()]);

      // Mantém a mensagem de sucesso por mais tempo
      setTimeout(() => {
        setSuccess(null);
        setShowSuccessModal(false);
      }, 5000);
    } catch (err: any) {
      console.error('Erro ao desativar extensão:', err);
      console.error('Detalhes do erro:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      // Verifica se é erro de extensões bloqueantes
      if (err.response?.data?.blockingExtensions) {
        const blockingExts = err.response.data.blockingExtensions as string[];
        setError(
          err.response.data.message ||
            `Não é possível desinstalar esta extensão porque as seguintes extensões dependem dela: ${blockingExts.join(
              ', ',
            )}`,
        );
      } else {
        setError(
          err.response?.data?.message ||
            'Erro ao desativar extensão. Tente novamente.',
        );
      }
    } finally {
      setIsDeactivating(null);
      setPendingExtensionId(null);
    }
  };

  const handleConfirmActivation = async () => {
    if (!companyId || !pendingExtensionId) return;

    try {
      setIsActivating(pendingExtensionId);
      setError(null);
      setSuccess(null);
      setShowConfirmModal(false);

      const response = await api.post(`/companies/${companyId}/extensions`, {
        extensionId: pendingExtensionId,
      });

      if (response.data.success) {
        const extensionName =
          availableExtensions.find((e) => e.id === pendingExtensionId)
            ?.displayName ||
          availableExtensions.find((e) => e.id === pendingExtensionId)?.name ||
          'Extensão';
        setSuccess('Extensão adquirida e ativada com sucesso! 🎉');
        setSuccessMessage(
          `${extensionName} adquirida e ativada com sucesso! 🎉\n\nAgora você pode usar esta funcionalidade no sistema.`,
        );
        setShowSuccessModal(true);
      }

      // Atualiza os dados locais e o contexto global
      await Promise.all([fetchData(), refreshExtensions()]);

      // Mantém a mensagem de sucesso por mais tempo
      setTimeout(() => {
        setSuccess(null);
        setShowSuccessModal(false);
      }, 5000);
    } catch (err: any) {
      console.error('Erro ao ativar extensão:', err);

      // Verifica se é erro de dependências faltantes
      if (err.response?.data?.missingDependencies) {
        const missingDeps = err.response.data.missingDependencies as string[];
        const missingNames = err.response.data
          .missingDependencyNames as string[];
        setError(
          `Esta extensão requer as seguintes extensões: ${missingDeps.join(
            ', ',
          )}. ` +
            `Por favor, ative ${
              missingDeps.length === 1 ? 'a extensão' : 'as extensões'
            } primeiro.`,
        );

        // Mostra alerta mais detalhado
        setTimeout(() => {
          alert(
            `Extensão requer dependências:\n\n${missingDeps.join('\n')}\n\n` +
              `Por favor, ative ${
                missingDeps.length === 1 ? 'a extensão' : 'as extensões'
              } acima primeiro.`,
          );
        }, 100);
      } else {
        setError(
          err.response?.data?.message ||
            'Erro ao ativar extensão. Tente novamente.',
        );
      }
    } finally {
      setIsActivating(null);
      setPendingExtensionId(null);
    }
  };

  const handleOpenDetails = (extension: Extension) => {
    setSelectedExtension(extension);
    setShowDetailsModal(true);

    // Busca feedback do usuário se a extensão estiver ativa
    if (isExtensionActive(extension.id)) {
      const ce = getCompanyExtension(extension.id);
      if (ce && companyId) {
        fetchUserFeedback(ce.id);
      }
    } else {
      setUserFeedback(null);
      setFeedbackForm({ rating: 0, comment: '', suggestions: '' });
    }
  };

  const fetchUserFeedback = async (companyExtensionId: number) => {
    if (!companyId) return;

    try {
      const response = await api.get(
        `/companies/${companyId}/extensions/feedback/${companyExtensionId}`,
      );
      if (response.data.success && response.data.data) {
        setUserFeedback(response.data.data);
        setFeedbackForm({
          rating: response.data.data.rating || 0,
          comment: response.data.data.comment || '',
          suggestions: response.data.data.suggestions || '',
        });
      } else {
        setUserFeedback(null);
        setFeedbackForm({ rating: 0, comment: '', suggestions: '' });
      }
    } catch (error) {
      // Feedback não existe ainda, não é erro
      setUserFeedback(null);
      setFeedbackForm({ rating: 0, comment: '', suggestions: '' });
    }
  };

  const handleSubmitFeedback = async () => {
    if (!companyId || !selectedExtension) return;

    const ce = getCompanyExtension(selectedExtension.id);
    if (!ce) {
      setError('Extensão não está ativa. Ative primeiro para deixar feedback.');
      return;
    }

    try {
      await api.post(`/companies/${companyId}/extensions/feedback`, {
        companyExtensionId: ce.id,
        rating: feedbackForm.rating || undefined,
        comment: feedbackForm.comment || undefined,
        suggestions: feedbackForm.suggestions || undefined,
      });

      setSuccess(
        'Feedback enviado com sucesso! Obrigado pela sua contribuição.',
      );
      setShowFeedbackModal(false);
      await fetchUserFeedback(ce.id);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao enviar feedback');
    }
  };

  const isExtensionActive = (extensionId: number): boolean => {
    const extension = availableExtensions.find((e) => e.id === extensionId);
    
    // Para produtos: verifica se realmente está ativo no banco
    // Se serviços está instalado, produtos pode estar desativado
    if (extension?.name === 'products_management') {
      // Se serviços está instalado, verifica o estado real no banco
      if (hasServicesExtension) {
        return companyExtensions.some(
          (ce) => ce.extension.id === extensionId && ce.isActive,
        );
      }
      // Se serviços não está instalado, produtos é sempre ativo (extensão padrão)
      return true;
    }
    
    return companyExtensions.some(
      (ce) => ce.extension.id === extensionId && ce.isActive,
    );
  };

  const getCompanyExtension = (
    extensionId: number,
  ): CompanyExtension | undefined => {
    return companyExtensions.find(
      (ce) => ce.extension.id === extensionId && ce.isActive,
    );
  };

  // Filtra extensões baseado na busca e filtros
  const filteredExtensions = useMemo(() => {
    let filtered = [...availableExtensions];

    // Filtro de novidades (últimos 7 dias)
    if (showNewOnly || filterType === 'new') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filtered = filtered.filter((ext) => {
        const createdDate = new Date(ext.createdAt);
        return createdDate >= sevenDaysAgo;
      });
    }

    // Filtro por tipo
    if (filterType === 'active') {
      filtered = filtered.filter((ext) => isExtensionActive(ext.id));
    } else if (filterType === 'available') {
      filtered = filtered.filter((ext) => !isExtensionActive(ext.id));
    }

    // Busca por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ext) =>
          (ext.displayName || ext.name).toLowerCase().includes(query) ||
          ext.description?.toLowerCase().includes(query) ||
          ext.features?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [
    availableExtensions,
    searchQuery,
    filterType,
    showNewOnly,
    companyExtensions,
  ]);

  // Estatísticas
  const activeExtensions = companyExtensions.filter((ce) => ce.isActive);
  const totalMonthlyCost = activeExtensions.reduce(
    (sum, ce) => sum + Number(ce.extension.price),
    0,
  );
  const paidExtensions = availableExtensions.filter(
    (ext) => Number(ext.price) > 0,
  );
  const newExtensions = availableExtensions.filter((ext) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(ext.createdAt) >= sevenDaysAgo;
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Carregando extensões...</p>
        </div>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhuma empresa selecionada
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Selecione uma empresa para gerenciar extensões
            </p>
            <Button onClick={() => router.push('/workspace')}>
              Ir para Área de Trabalho
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Loja de Extensões</h1>
        <p className="text-muted-foreground mt-2">
          Adquira funcionalidades adicionais para personalizar seu sistema
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 text-green-900 dark:bg-green-950/20 dark:text-green-300 dark:border-green-700">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Cards de Ação */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {/* Card: Extensões Ativas */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
          onClick={() => setShowActiveModal(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Minhas Extensões
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeExtensions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeExtensions.length === 1
                ? 'extensão ativa'
                : 'extensões ativas'}
            </p>
          </CardContent>
        </Card>

        {/* Card: Custo Mensal */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
          onClick={() => setShowCostModal(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalMonthlyCost)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidExtensions.length}{' '}
              {paidExtensions.length === 1
                ? 'extensão paga'
                : 'extensões pagas'}
            </p>
          </CardContent>
        </Card>

        {/* Card: Novidades */}
        <Card
          className={cn(
            'cursor-pointer hover:shadow-lg transition-all',
            showNewOnly
              ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
              : 'hover:border-primary/50',
          )}
          onClick={() => {
            setShowNewOnly(!showNewOnly);
            if (!showNewOnly) {
              setFilterType('new');
            } else {
              setFilterType('all');
            }
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novidades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newExtensions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {newExtensions.length === 1 ? 'extensão nova' : 'extensões novas'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar extensões..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filterType}
              onValueChange={(value: any) => {
                setFilterType(value);
                if (value !== 'new') {
                  setShowNewOnly(false);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="available">Disponíveis</SelectItem>
                <SelectItem value="new">Novidades</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Extensões */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {showNewOnly
              ? 'Novidades'
              : filterType === 'active'
              ? 'Extensões Ativas'
              : filterType === 'available'
              ? 'Extensões Disponíveis'
              : 'Todas as Extensões'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {filteredExtensions.length}{' '}
            {filteredExtensions.length === 1
              ? 'extensão encontrada'
              : 'extensões encontradas'}
          </p>
        </div>

        {filteredExtensions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">
                Nenhuma extensão encontrada
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredExtensions.map((extension) => {
              const isActive = isExtensionActive(extension.id);
              const companyExtension = getCompanyExtension(extension.id);
              const isNew = (() => {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return new Date(extension.createdAt) >= sevenDaysAgo;
              })();
              const hasPrice = Number(extension.price) > 0;
              const ExtensionIcon = getExtensionIcon(extension.icon);

              return (
                <Card
                  key={extension.id}
                  className={cn(
                    'relative transition-all hover:shadow-lg cursor-pointer',
                    isActive && 'border-primary/50 bg-primary/5',
                    isNew && 'border-green-500/50',
                  )}
                  onClick={() => handleOpenDetails(extension)}
                >
                  {isNew && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Novo
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    {/* Ícone da extensão */}
                    <div className="flex items-center justify-center mb-4">
                      <div
                        className={cn(
                          'p-4 rounded-full',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        <ExtensionIcon className="h-8 w-8" />
                      </div>
                    </div>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 pr-2">
                        <CardTitle className="text-lg">
                          {extension.displayName || extension.name}
                        </CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">
                          {extension.description || 'Sem descrição'}
                        </CardDescription>
                      </div>
                      {isActive && (
                        <div className="ml-2 flex-shrink-0">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            <Check className="h-3 w-3 mr-1" />
                            Ativa
                          </span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Preço:</span>
                      <span className="font-semibold">
                        {hasPrice ? (
                          <>
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(Number(extension.price))}
                            /mês
                          </>
                        ) : (
                          <span className="text-green-600 dark:text-green-400">
                            Grátis
                          </span>
                        )}
                      </span>
                    </div>
                    {extension.features &&
                      (() => {
                        try {
                          const features =
                            typeof extension.features === 'string'
                              ? JSON.parse(extension.features)
                              : extension.features;
                          const featuresList = Array.isArray(features)
                            ? features
                            : extension.features
                                .split('\n')
                                .filter((f: string) => f.trim());
                          return (
                            <div className="text-sm">
                              <p className="font-medium mb-2">
                                Funcionalidades:
                              </p>
                              <ul className="list-disc list-inside space-y-1 text-muted-foreground line-clamp-3">
                                {featuresList
                                  .slice(0, 3)
                                  .map((feature: string, idx: number) => (
                                    <li key={idx}>
                                      {typeof feature === 'string'
                                        ? feature.trim()
                                        : feature}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          );
                        } catch (e) {
                          const featuresList = extension.features
                            .split('\n')
                            .filter((f: string) => f.trim());
                          return (
                            <div className="text-sm">
                              <p className="font-medium mb-2">
                                Funcionalidades:
                              </p>
                              <ul className="list-disc list-inside space-y-1 text-muted-foreground line-clamp-3">
                                {featuresList
                                  .slice(0, 3)
                                  .map((feature: string, idx: number) => (
                                    <li key={idx}>{feature.trim()}</li>
                                  ))}
                              </ul>
                            </div>
                          );
                        }
                      })()}
                    {/* Produtos: se serviços está instalado, pode ser ativado/desativado */}
                    {extension.name === 'products_management' ? (
                      hasServicesExtension ? (
                        (() => {
                          const productsIsActive = isExtensionActive(extension.id);
                          return (
                            <Button
                              variant={productsIsActive ? 'destructive' : 'default'}
                              size="sm"
                              className={cn(
                                'w-full',
                                !productsIsActive &&
                                  'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700',
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleExtension(extension.id, productsIsActive);
                              }}
                              disabled={
                                isActivating === extension.id ||
                                isDeactivating === extension.id
                              }
                            >
                              {isActivating === extension.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Ativando...
                                </>
                              ) : isDeactivating === extension.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Desativando...
                                </>
                              ) : productsIsActive ? (
                                <>
                                  <X className="mr-2 h-4 w-4" />
                                  Desativar
                                </>
                              ) : (
                                <>
                                  <Zap className="mr-2 h-4 w-4" />
                                  Adquirir
                                </>
                              )}
                            </Button>
                          );
                        })()
                      ) : (
                        <div className="text-xs text-muted-foreground text-center py-2">
                          Extensão padrão (sempre ativa)
                        </div>
                      )
                    ) : (
                      <Button
                        variant={isActive ? 'destructive' : 'default'}
                        size="sm"
                        className={cn(
                          'w-full',
                          !isActive &&
                            'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700',
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleExtension(extension.id, isActive);
                        }}
                        disabled={
                          isActivating === extension.id ||
                          isDeactivating === extension.id
                        }
                      >
                        {isActivating === extension.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Ativando...
                          </>
                        ) : isDeactivating === extension.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Desativando...
                          </>
                        ) : isActive ? (
                          <>
                            <X className="mr-2 h-4 w-4" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 h-4 w-4" />
                            Ativar
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Extensões Ativas */}
      <Dialog open={showActiveModal} onOpenChange={setShowActiveModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Minhas Extensões Ativas</DialogTitle>
            <DialogDescription>
              Gerencie as extensões que você adquiriu para sua empresa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {activeExtensions.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  Nenhuma extensão ativa no momento
                </p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {activeExtensions.map((companyExtension) => {
                  const ext = companyExtension.extension;
                  const ExtensionIcon = getExtensionIcon(ext.icon);
                  return (
                    <Card key={companyExtension.id}>
                      <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                          <div className="p-4 rounded-full bg-primary/10 text-primary">
                            <ExtensionIcon className="h-8 w-8" />
                          </div>
                        </div>
                        <CardTitle className="text-lg">
                          {ext.displayName || ext.name}
                        </CardTitle>
                        <CardDescription>{ext.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Preço:</span>
                          <span className="font-semibold">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(Number(ext.price))}
                            /mês
                          </span>
                        </div>
                        {companyExtension.purchasedAt && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Ativada em:{' '}
                              {format(
                                new Date(companyExtension.purchasedAt),
                                "dd 'de' MMM 'de' yyyy",
                                { locale: ptBR },
                              )}
                            </span>
                          </div>
                        )}
                        {companyExtension.expiresAt && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Expira em:{' '}
                              {format(
                                new Date(companyExtension.expiresAt),
                                "dd 'de' MMM 'de' yyyy",
                                { locale: ptBR },
                              )}
                            </span>
                          </div>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setShowActiveModal(false);
                            setPendingExtensionId(ext.id);
                            setShowDeactivateModal(true);
                          }}
                          disabled={
                            isDeactivating === ext.id || isActivating === ext.id
                          }
                        >
                          {isDeactivating === ext.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Desativando...
                            </>
                          ) : (
                            <>
                              <X className="mr-2 h-4 w-4" />
                              Desativar
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Custo Mensal */}
      <Dialog open={showCostModal} onOpenChange={setShowCostModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Custo Mensal e Extensões Pagas</DialogTitle>
            <DialogDescription>
              Visualize todas as extensões que possuem custo mensal ou por uso
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Custo Total Mensal
                    </p>
                    <p className="text-3xl font-bold mt-1">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(totalMonthlyCost)}
                    </p>
                  </div>
                  <DollarSign className="h-12 w-12 text-primary opacity-50" />
                </div>
              </CardContent>
            </Card>
            {paidExtensions.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  Nenhuma extensão paga disponível
                </p>
              </div>
            ) : (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {paidExtensions.map((extension) => {
                  const isActive = isExtensionActive(extension.id);
                  const ExtensionIcon = getExtensionIcon(extension.icon);
                  return (
                    <Card
                      key={extension.id}
                      className={cn(
                        isActive && 'border-primary/50 bg-primary/5',
                      )}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-center mb-4">
                          <div
                            className={cn(
                              'p-4 rounded-full',
                              isActive
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            <ExtensionIcon className="h-8 w-8" />
                          </div>
                        </div>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
                              {extension.displayName || extension.name}
                            </CardTitle>
                            <CardDescription>
                              {extension.description}
                            </CardDescription>
                          </div>
                          {isActive && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 ml-2">
                              <Check className="h-3 w-3 mr-1" />
                              Ativa
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Preço:</span>
                          <span className="font-semibold">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(Number(extension.price))}
                            /mês
                          </span>
                        </div>
                        {extension.features &&
                          (() => {
                            try {
                              const features =
                                typeof extension.features === 'string'
                                  ? JSON.parse(extension.features)
                                  : extension.features;
                              const featuresList = Array.isArray(features)
                                ? features
                                : extension.features
                                    .split('\n')
                                    .filter((f: string) => f.trim());
                              return (
                                <div className="text-sm">
                                  <p className="font-medium mb-2">
                                    Funcionalidades:
                                  </p>
                                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    {featuresList.map(
                                      (feature: string, idx: number) => (
                                        <li key={idx}>
                                          {typeof feature === 'string'
                                            ? feature.trim()
                                            : feature}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              );
                            } catch (e) {
                              const featuresList = extension.features
                                .split('\n')
                                .filter((f: string) => f.trim());
                              return (
                                <div className="text-sm">
                                  <p className="font-medium mb-2">
                                    Funcionalidades:
                                  </p>
                                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                    {featuresList.map(
                                      (feature: string, idx: number) => (
                                        <li key={idx}>{feature.trim()}</li>
                                      ),
                                    )}
                                  </ul>
                                </div>
                              );
                            }
                          })()}
                        <Button
                          variant={isActive ? 'destructive' : 'default'}
                          size="sm"
                          className={cn(
                            'w-full',
                            !isActive &&
                              'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700',
                          )}
                          onClick={() => {
                            if (isActive) {
                              setShowCostModal(false);
                              setPendingExtensionId(extension.id);
                              setShowDeactivateModal(true);
                            } else {
                              setShowCostModal(false);
                              setPendingExtensionId(extension.id);
                              setShowConfirmModal(true);
                            }
                          }}
                          disabled={
                            isActivating === extension.id ||
                            isDeactivating === extension.id
                          }
                        >
                          {isActivating === extension.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Ativando...
                            </>
                          ) : isDeactivating === extension.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Desativando...
                            </>
                          ) : isActive ? (
                            <>
                              <X className="mr-2 h-4 w-4" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <Zap className="mr-2 h-4 w-4" />
                              Ativar
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Sucesso */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Extensão Adquirida!
            </DialogTitle>
            <DialogDescription asChild>
              <div className="pt-4 space-y-2">
                <p className="text-base font-medium text-foreground">
                  {successMessage.split('\n\n')[0]}
                </p>
                {successMessage.includes('\n\n') && (
                  <p className="text-sm text-muted-foreground">
                    {successMessage.split('\n\n')[1]}
                  </p>
                )}
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                  <p className="text-sm text-green-900 dark:text-green-200">
                    ✨ A funcionalidade já está disponível na navegação!
                  </p>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setShowSuccessModal(false)}>Entendi!</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Detalhes da Extensão */}
      {selectedExtension &&
        (() => {
          const DetailsIcon = getExtensionIcon(selectedExtension.icon);
          return (
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'p-4 rounded-full',
                        isExtensionActive(selectedExtension.id)
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      <DetailsIcon className="h-12 w-12" />
                    </div>
                    <div className="flex-1">
                      <DialogTitle className="text-2xl">
                        {selectedExtension.displayName ||
                          selectedExtension.name}
                      </DialogTitle>
                      <DialogDescription className="text-base mt-2">
                        {selectedExtension.description || 'Sem descrição'}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <div className="space-y-6 mt-6">
                  {/* Preço */}
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Preço:</span>
                    <span className="text-2xl font-bold">
                      {Number(selectedExtension.price) > 0 ? (
                        <>
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(Number(selectedExtension.price))}
                          /mês
                        </>
                      ) : (
                        <span className="text-green-600 dark:text-green-400">
                          Grátis
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Dependências */}
                  {selectedExtension.dependencies &&
                    (() => {
                      try {
                        const dependencies =
                          typeof selectedExtension.dependencies === 'string'
                            ? JSON.parse(selectedExtension.dependencies)
                            : selectedExtension.dependencies;

                        if (
                          Array.isArray(dependencies) &&
                          dependencies.length > 0
                        ) {
                          // Busca os nomes de exibição das extensões dependentes
                          const dependencyExtensions = dependencies
                            .map((depName: string) => {
                              const dep = availableExtensions.find(
                                (e) => e.name === depName,
                              );
                              return dep
                                ? {
                                    name: depName,
                                    displayName: dep.displayName || dep.name,
                                  }
                                : null;
                            })
                            .filter(Boolean);

                          // Verifica quais dependências estão ativas
                          const activeDependencyNames = companyExtensions
                            .filter((ce) => ce.isActive)
                            .map((ce) => ce.extension.name);

                          const missingDependencies =
                            dependencyExtensions.filter(
                              (dep: any) =>
                                !activeDependencyNames.includes(dep.name),
                            );

                          if (dependencyExtensions.length > 0) {
                            return (
                              <div>
                                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                  <AlertCircle className="h-5 w-5" />
                                  Dependências
                                </h3>
                                <Alert
                                  className={
                                    missingDependencies.length > 0
                                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                                      : 'border-green-500 bg-green-50 dark:bg-green-950/20'
                                  }
                                >
                                  <AlertCircle
                                    className={
                                      missingDependencies.length > 0
                                        ? 'h-4 w-4 text-yellow-600'
                                        : 'h-4 w-4 text-green-600'
                                    }
                                  />
                                  <div className="space-y-2">
                                    {missingDependencies.length > 0 ? (
                                      <>
                                        <p className="font-medium text-yellow-900 dark:text-yellow-200">
                                          Esta extensão requer as seguintes
                                          extensões:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-sm">
                                          {dependencyExtensions.map(
                                            (dep: any, idx: number) => {
                                              const isMissing =
                                                missingDependencies.some(
                                                  (m: any) =>
                                                    m.name === dep.name,
                                                );
                                              return (
                                                <li
                                                  key={idx}
                                                  className={
                                                    isMissing
                                                      ? 'text-yellow-800 dark:text-yellow-300'
                                                      : 'text-green-800 dark:text-green-300'
                                                  }
                                                >
                                                  {dep.displayName}{' '}
                                                  {isMissing
                                                    ? '(Não ativada)'
                                                    : '✓'}
                                                </li>
                                              );
                                            },
                                          )}
                                        </ul>
                                        <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-2">
                                          Por favor, ative{' '}
                                          {missingDependencies.length === 1
                                            ? 'a extensão'
                                            : 'as extensões'}{' '}
                                          acima primeiro.
                                        </p>
                                      </>
                                    ) : (
                                      <>
                                        <p className="font-medium text-green-900 dark:text-green-200">
                                          Todas as dependências estão ativas:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1 text-sm text-green-800 dark:text-green-300">
                                          {dependencyExtensions.map(
                                            (dep: any, idx: number) => (
                                              <li key={idx}>
                                                {dep.displayName} ✓
                                              </li>
                                            ),
                                          )}
                                        </ul>
                                      </>
                                    )}
                                  </div>
                                </Alert>
                              </div>
                            );
                          }
                        }
                      } catch (e) {
                        console.error('Erro ao parsear dependências:', e);
                      }
                      return null;
                    })()}

                  {/* Funcionalidades */}
                  {selectedExtension.features &&
                    (() => {
                      try {
                        const features =
                          typeof selectedExtension.features === 'string'
                            ? JSON.parse(selectedExtension.features)
                            : selectedExtension.features;

                        if (Array.isArray(features) && features.length > 0) {
                          return (
                            <div>
                              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                Funcionalidades
                              </h3>
                              <div className="space-y-2">
                                {features.map(
                                  (feature: string, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                                    >
                                      <Check className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                                      <span className="text-sm">{feature}</span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          );
                        }
                      } catch (e) {
                        // Se não for JSON válido, trata como string simples
                        const features = selectedExtension.features
                          .split('\n')
                          .filter((f: string) => f.trim());
                        if (features.length > 0) {
                          return (
                            <div>
                              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                <Info className="h-5 w-5" />
                                Funcionalidades
                              </h3>
                              <div className="space-y-2">
                                {features.map(
                                  (feature: string, idx: number) => (
                                    <div
                                      key={idx}
                                      className="flex items-start gap-2 p-2 rounded-md bg-muted/50"
                                    >
                                      <Check className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                                      <span className="text-sm">
                                        {feature.trim()}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}

                  {/* Ações */}
                  <div className="flex gap-2 pt-4 border-t">
                    {isExtensionActive(selectedExtension.id) ? (
                      <>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setShowDetailsModal(false);
                            setShowFeedbackModal(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Deixar Feedback
                        </Button>
                        <Button
                          variant="destructive"
                          className="flex-1"
                          onClick={() => {
                            setShowDetailsModal(false);
                            setPendingExtensionId(selectedExtension.id);
                            setShowDeactivateModal(true);
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Desativar
                        </Button>
                      </>
                    ) : (
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          // Verifica dependências antes de mostrar confirmação
                          if (selectedExtension.dependencies) {
                            try {
                              const dependencies =
                                typeof selectedExtension.dependencies ===
                                'string'
                                  ? JSON.parse(selectedExtension.dependencies)
                                  : selectedExtension.dependencies;

                              if (
                                Array.isArray(dependencies) &&
                                dependencies.length > 0
                              ) {
                                const activeExtensionNames = companyExtensions
                                  .filter((ce) => ce.isActive)
                                  .map((ce) => ce.extension.name);

                                const missingDependencies = dependencies.filter(
                                  (depName: string) =>
                                    !activeExtensionNames.includes(depName),
                                );

                                if (missingDependencies.length > 0) {
                                  const missingNames = missingDependencies
                                    .map((depName: string) => {
                                      const dep = availableExtensions.find(
                                        (e) => e.name === depName,
                                      );
                                      return dep
                                        ? dep.displayName || dep.name
                                        : depName;
                                    })
                                    .join(', ');

                                  setError(
                                    `Esta extensão requer as seguintes extensões: ${missingNames}. ` +
                                      `Por favor, ative ${
                                        missingDependencies.length === 1
                                          ? 'a extensão'
                                          : 'as extensões'
                                      } primeiro.`,
                                  );
                                  setShowDetailsModal(false);
                                  return;
                                }
                              }
                            } catch (e) {
                              console.error(
                                'Erro ao verificar dependências:',
                                e,
                              );
                            }
                          }

                          setShowDetailsModal(false);
                          setPendingExtensionId(selectedExtension.id);
                          setShowConfirmModal(true);
                        }}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Adquirir Agora
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          );
        })()}

      {/* Modal: Confirmação de Desativação */}
      <Dialog open={showDeactivateModal} onOpenChange={setShowDeactivateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Desativação</DialogTitle>
            <DialogDescription>
              {pendingExtensionId && (
                <>
                  Tem certeza que deseja desativar a extensão{' '}
                  <strong>
                    {availableExtensions.find(
                      (e) => e.id === pendingExtensionId,
                    )?.displayName ||
                      availableExtensions.find(
                        (e) => e.id === pendingExtensionId,
                      )?.name ||
                      'Extensão'}
                  </strong>
                  ?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                A extensão será desativada e não estará mais disponível no
                sistema. Você pode reativá-la a qualquer momento.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeactivateModal(false);
                  setPendingExtensionId(null);
                }}
                disabled={isDeactivating !== null}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDeactivation}
                disabled={isDeactivating !== null}
              >
                {isDeactivating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Desativando...
                  </>
                ) : (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    Sim, Desativar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Confirmação de Aquisição */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Aquisição</DialogTitle>
            <DialogDescription>
              {pendingExtensionId && (
                <>
                  Você está prestes a adquirir a extensão{' '}
                  <strong>
                    {availableExtensions.find(
                      (e) => e.id === pendingExtensionId,
                    )?.displayName ||
                      availableExtensions.find(
                        (e) => e.id === pendingExtensionId,
                      )?.name ||
                      'Extensão'}
                  </strong>
                  .
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {pendingExtensionId && (
              <>
                {Number(
                  availableExtensions.find((e) => e.id === pendingExtensionId)
                    ?.price || 0,
                ) > 0 ? (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">
                      Custo mensal:
                    </p>
                    <p className="text-2xl font-bold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(
                        Number(
                          availableExtensions.find(
                            (e) => e.id === pendingExtensionId,
                          )?.price || 0,
                        ),
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-sm font-medium text-green-900 dark:text-green-200">
                      ✓ Esta extensão é gratuita!
                    </p>
                  </div>
                )}
              </>
            )}
            <p className="text-sm text-muted-foreground">
              Tem certeza que deseja adquirir esta extensão? Ela ficará
              disponível imediatamente após a confirmação.
            </p>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmModal(false);
                setPendingExtensionId(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmActivation}
              disabled={isActivating !== null}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isActivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adquirindo...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Sim, Adquirir
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Feedback */}
      {selectedExtension && isExtensionActive(selectedExtension.id) && (
        <Dialog open={showFeedbackModal} onOpenChange={setShowFeedbackModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Deixar Feedback
              </DialogTitle>
              <DialogDescription>
                Compartilhe sua experiência com{' '}
                <strong>
                  {selectedExtension.displayName || selectedExtension.name}
                </strong>{' '}
                e ajude-nos a melhorar!
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Avaliação */}
              <div className="space-y-2">
                <Label>Avaliação (Opcional)</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() =>
                        setFeedbackForm({ ...feedbackForm, rating })
                      }
                      className={cn(
                        'p-2 rounded-md transition-colors',
                        feedbackForm.rating >= rating
                          ? 'text-yellow-500'
                          : 'text-muted-foreground hover:text-yellow-500',
                      )}
                    >
                      <Star
                        className={cn(
                          'h-6 w-6',
                          feedbackForm.rating >= rating && 'fill-current',
                        )}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Comentário */}
              <div className="space-y-2">
                <Label htmlFor="feedbackComment">
                  O que você achou desta funcionalidade?
                </Label>
                <Textarea
                  id="feedbackComment"
                  value={feedbackForm.comment}
                  onChange={(e) =>
                    setFeedbackForm({
                      ...feedbackForm,
                      comment: e.target.value,
                    })
                  }
                  placeholder="Compartilhe sua experiência..."
                  rows={4}
                />
              </div>

              {/* Sugestões */}
              <div className="space-y-2">
                <Label htmlFor="feedbackSuggestions">
                  O que podemos melhorar?
                </Label>
                <Textarea
                  id="feedbackSuggestions"
                  value={feedbackForm.suggestions}
                  onChange={(e) =>
                    setFeedbackForm({
                      ...feedbackForm,
                      suggestions: e.target.value,
                    })
                  }
                  placeholder="Sugestões de melhorias, novas funcionalidades, etc..."
                  rows={4}
                />
              </div>

              {userFeedback && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Você já deixou um feedback anteriormente. Ao enviar, ele
                    será atualizado.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFeedbackModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmitFeedback}
                  disabled={
                    !feedbackForm.comment &&
                    !feedbackForm.suggestions &&
                    !feedbackForm.rating
                  }
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Feedback
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
