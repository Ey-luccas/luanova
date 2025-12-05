/**
 * Página de Gerenciamento de Usuários/Funcionários
 *
 * Permite gerenciar usuários e permissões de empresas.
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  UserPlus,
  Users,
  Settings,
  Trash2,
  Edit,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
  Shield,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompanyUser {
  id: number;
  role: string;
  isActive: boolean;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  permissions: Array<{
    id: number;
    granted: boolean;
    permission: {
      id: number;
      code: string;
      name: string;
      category?: string | null;
    };
  }>;
}

interface Permission {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
}

interface Company {
  id: number;
  name: string;
  logoUrl?: string | null;
}

const addUserSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER']),
});

type AddUserFormData = z.infer<typeof addUserSchema>;

export default function UsersPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [usersMap, setUsersMap] = useState<
    Record<number, CompanyUser[]>
  >({});
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [showAddDialog, setShowAddDialog] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState<number | null>(null);
  const [expandedCompanyId, setExpandedCompanyId] = useState<number | null>(
    null,
  );
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [logoErrors, setLogoErrors] = useState<Set<number>>(new Set());
  const [avatarErrors, setAvatarErrors] = useState<Set<number>>(new Set());

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      role: 'OPERATOR',
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [companiesRes, permissionsRes] = await Promise.all([
        api.get('/companies').catch((err) => {
          console.error('Erro ao buscar empresas:', err);
          return { data: { data: [] } };
        }),
        api.get('/permissions').catch((err) => {
          console.error('Erro ao buscar permissões:', err);
          return { data: { data: [] } };
        }),
      ]);

      let companiesData: any[] =
        companiesRes.data?.data?.companies ||
        companiesRes.data?.companies ||
        companiesRes.data?.data ||
        companiesRes.data ||
        [];

      if (!Array.isArray(companiesData)) {
        companiesData = [];
      }

      const normalizedCompanies: Company[] = companiesData
        .filter((company: any) => company && company.id && company.name)
        .map((company: any) => ({
          id: Number(company.id),
          name: String(company.name).trim(),
          logoUrl: company.logoUrl || null,
        }));

      setCompanies(normalizedCompanies);
      setPermissions(permissionsRes.data?.data || permissionsRes.data || []);

      if (normalizedCompanies.length > 0) {
        const usersResponses = await Promise.all(
          normalizedCompanies.map((company) =>
            api.get(`/companies/${company.id}/users`).catch((err) => {
              console.error(
                `Erro ao buscar usuários da empresa ${company.id}:`,
                err,
              );
              return { data: { data: [] } };
            }),
          ),
        );

        const newMap: Record<number, CompanyUser[]> = {};
        normalizedCompanies.forEach((company, index) => {
          const res = usersResponses[index];
          const list =
            (res.data?.data as CompanyUser[]) ||
            (res.data as CompanyUser[]) ||
            [];
          newMap[company.id] = list;
        });

        setUsersMap(newMap);
      } else {
        setUsersMap({});
      }
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao carregar dados. Tente novamente.');
      setCompanies([]);
      setUsersMap({});
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async (data: AddUserFormData) => {
    if (!showAddDialog) return;

    try {
      setIsAdding(true);
      setError(null);

      await api.post(`/companies/${showAddDialog}/users`, {
        ...data,
        permissions: selectedPermissions,
      });

      setSuccess('Usuário adicionado com sucesso!');
      setShowAddDialog(null);
      reset();
      setSelectedPermissions([]);
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erro ao adicionar usuário:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao adicionar usuário. Tente novamente.',
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateUser = async (
    companyId: number,
    userId: number,
    data: { role?: string; isActive?: boolean; permissions?: number[] },
  ) => {
    try {
      setIsUpdating(userId);
      setError(null);

      await api.put(`/companies/${companyId}/users/${userId}`, data);

      setSuccess('Usuário atualizado com sucesso!');
      setShowEditDialog(null);
      setExpandedUserId(null);
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao atualizar usuário. Tente novamente.',
      );
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteUser = async (companyId: number, userId: number) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;

    try {
      setIsUpdating(userId);
      setError(null);

      await api.delete(`/companies/${companyId}/users/${userId}`);

      setSuccess('Usuário removido com sucesso!');
      setExpandedUserId(null);
      await fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Erro ao remover usuário:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao remover usuário. Tente novamente.',
      );
    } finally {
      setIsUpdating(null);
    }
  };

  const openEditDialog = (user: CompanyUser, companyId: number) => {
    setShowEditDialog(user.id);
    const grantedPermissions = user.permissions
      .filter((p) => p.granted)
      .map((p) => p.permission.id);
    setSelectedPermissions(grantedPermissions);
  };

  const toggleCompanyExpansion = (companyId: number) => {
    setExpandedCompanyId(
      expandedCompanyId === companyId ? null : companyId,
    );
    setExpandedUserId(null);
  };

  const toggleUserExpansion = (userId: number) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const groupedPermissions = permissions.reduce((acc, perm) => {
    const category = perm.category || 'Outros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4 sm:pt-10 sm:pb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Usuários e Funcionários
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1.5">
              Gerencie usuários e permissões das suas empresas
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4 sm:pt-10 sm:pb-6">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 border-green-500 bg-green-50 text-green-900 dark:bg-green-950/20 dark:text-green-300 dark:border-green-700">
              <Check className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Lista de Empresas */}
          {companies.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  Nenhuma empresa encontrada
                </h3>
                <p className="text-muted-foreground mb-6">
                  Crie uma empresa na área de trabalho para começar
                </p>
                <Link href="/workspace">
                  <Button className="gap-2" size="lg">
                    <Building2 className="h-4 w-4" />
                    Ir para Área de Trabalho
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {companies.map((company) => {
                const users = usersMap[company.id] || [];
                const activeUsers = users.filter((u) => u.isActive);
                const isExpanded = expandedCompanyId === company.id;
                const logoError = logoErrors.has(company.id);

                return (
                  <Card
                    key={company.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          {company.logoUrl && !logoError ? (
                            <img
                              src={`${
                                process.env.NEXT_PUBLIC_API_URL?.replace(
                                  '/api',
                                  '',
                                ) || 'https://api.luanova.cloud'
                              }${company.logoUrl}`}
                              alt={`Logo ${company.name}`}
                              className="h-12 w-12 rounded-lg object-cover border-2 border-border"
                              onError={() => {
                                setLogoErrors((prev) =>
                                  new Set(prev).add(company.id),
                                );
                              }}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center border-2 border-border">
                              <Building2 className="h-6 w-6 text-primary" />
                            </div>
                          )}
                          <div className="flex-1">
                            <CardTitle className="text-xl">
                              {company.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {activeUsers.length}{' '}
                              {activeUsers.length === 1
                                ? 'usuário ativo'
                                : 'usuários ativos'}
                              {users.length > activeUsers.length &&
                                ` (${users.length - activeUsers.length} inativo${
                                  users.length - activeUsers.length > 1
                                    ? 's'
                                    : ''
                                })`}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                          <Dialog
                            open={showAddDialog === company.id}
                            onOpenChange={(open) =>
                              setShowAddDialog(open ? company.id : null)
                            }
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
                                <UserPlus className="h-4 w-4" />
                                Adicionar
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                                <DialogDescription>
                                  Crie uma conta para um novo funcionário em{' '}
                                  {company.name}
                                </DialogDescription>
                              </DialogHeader>
                              <form
                                onSubmit={handleSubmit(handleAddUser)}
                                className="space-y-4 mt-4"
                              >
                                <div className="space-y-2">
                                  <Label htmlFor="name">
                                    Nome <span className="text-destructive">*</span>
                                  </Label>
                                  <Input
                                    id="name"
                                    {...register('name')}
                                    className={cn(
                                      errors.name && 'border-destructive',
                                    )}
                                  />
                                  {errors.name && (
                                    <p className="text-sm text-destructive">
                                      {errors.name.message}
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="email">
                                    E-mail <span className="text-destructive">*</span>
                                  </Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    {...register('email')}
                                    className={cn(
                                      errors.email && 'border-destructive',
                                    )}
                                  />
                                  {errors.email && (
                                    <p className="text-sm text-destructive">
                                      {errors.email.message}
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="password">
                                    Senha <span className="text-destructive">*</span>
                                  </Label>
                                  <Input
                                    id="password"
                                    type="password"
                                    {...register('password')}
                                    className={cn(
                                      errors.password && 'border-destructive',
                                    )}
                                  />
                                  {errors.password && (
                                    <p className="text-sm text-destructive">
                                      {errors.password.message}
                                    </p>
                                  )}
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="role">
                                    Função <span className="text-destructive">*</span>
                                  </Label>
                                  <Select
                                    onValueChange={(value) =>
                                      setValue('role', value as any)
                                    }
                                    defaultValue="OPERATOR"
                                  >
                                    <SelectTrigger id="role">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="ADMIN">
                                        Administrador
                                      </SelectItem>
                                      <SelectItem value="MANAGER">Gerente</SelectItem>
                                      <SelectItem value="OPERATOR">Operador</SelectItem>
                                      <SelectItem value="VIEWER">Visualizador</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Permissões</Label>
                                  <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-3">
                                    {Object.entries(groupedPermissions).map(
                                      ([category, perms]) => (
                                        <div key={category} className="space-y-2">
                                          <h4 className="font-medium text-sm">
                                            {category}
                                          </h4>
                                          {perms.map((perm) => (
                                            <div
                                              key={perm.id}
                                              className="flex items-center space-x-2"
                                            >
                                              <Checkbox
                                                id={`perm-${perm.id}`}
                                                checked={selectedPermissions.includes(
                                                  perm.id,
                                                )}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    setSelectedPermissions([
                                                      ...selectedPermissions,
                                                      perm.id,
                                                    ]);
                                                  } else {
                                                    setSelectedPermissions(
                                                      selectedPermissions.filter(
                                                        (id) => id !== perm.id,
                                                      ),
                                                    );
                                                  }
                                                }}
                                              />
                                              <Label
                                                htmlFor={`perm-${perm.id}`}
                                                className="text-sm font-normal cursor-pointer"
                                              >
                                                {perm.name}
                                              </Label>
                                            </div>
                                          ))}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                </div>

                                <div className="flex justify-end gap-4 pt-4">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setShowAddDialog(null);
                                      reset();
                                      setSelectedPermissions([]);
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button type="submit" disabled={isAdding}>
                                    {isAdding ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Adicionando...
                                      </>
                                    ) : (
                                      <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Adicionar
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleCompanyExpansion(company.id)}
                            title={isExpanded ? 'Recolher' : 'Ver usuários'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0">
                        <div className="border-t pt-6 space-y-4">
                          {users.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p>Nenhum usuário cadastrado</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {users.map((companyUser) => {
                                const isUserExpanded =
                                  expandedUserId === companyUser.id;
                                const avatarError = avatarErrors.has(
                                  companyUser.user.id,
                                );

                                return (
                                  <Card
                                    key={companyUser.id}
                                    className={cn(
                                      'transition-all',
                                      !companyUser.isActive &&
                                        'opacity-60 border-dashed',
                                    )}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          {companyUser.user.avatarUrl &&
                                          !avatarError ? (
                                            <img
                                              src={`${
                                                process.env
                                                  .NEXT_PUBLIC_API_URL?.replace(
                                                    '/api',
                                                    '',
                                                  ) || 'https://api.luanova.cloud'
                                              }${companyUser.user.avatarUrl}`}
                                              alt={companyUser.user.name}
                                              className="h-10 w-10 rounded-full object-cover border-2 border-border"
                                              onError={() => {
                                                setAvatarErrors((prev) =>
                                                  new Set(prev).add(
                                                    companyUser.user.id,
                                                  ),
                                                );
                                              }}
                                            />
                                          ) : (
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
                                              <User className="h-5 w-5 text-primary" />
                                            </div>
                                          )}
                                          <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold truncate">
                                              {companyUser.user.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground truncate">
                                              {companyUser.user.email}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="text-xs px-2 py-0.5 rounded bg-muted">
                                                {companyUser.role === 'ADMIN' &&
                                                  'Administrador'}
                                                {companyUser.role === 'MANAGER' &&
                                                  'Gerente'}
                                                {companyUser.role === 'OPERATOR' &&
                                                  'Operador'}
                                                {companyUser.role === 'VIEWER' &&
                                                  'Visualizador'}
                                              </span>
                                              {companyUser.isActive ? (
                                                <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                  Ativo
                                                </span>
                                              ) : (
                                                <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                  Inativo
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              toggleUserExpansion(companyUser.id)
                                            }
                                            title={
                                              isUserExpanded
                                                ? 'Recolher'
                                                : 'Ver permissões'
                                            }
                                            className="self-end sm:self-auto"
                                          >
                                            {isUserExpanded ? (
                                              <ChevronUp className="h-4 w-4" />
                                            ) : (
                                              <ChevronDown className="h-4 w-4" />
                                            )}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              openEditDialog(companyUser, company.id)
                                            }
                                            title="Editar usuário"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                              handleDeleteUser(
                                                company.id,
                                                companyUser.id,
                                              )
                                            }
                                            disabled={isUpdating === companyUser.id}
                                            title="Remover usuário"
                                          >
                                            {isUpdating === companyUser.id ? (
                                              <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                              <Trash2 className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </div>
                                      </div>

                                      {isUserExpanded && (
                                        <div className="mt-4 pt-4 border-t space-y-4">
                                          <div>
                                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                              <Shield className="h-4 w-4" />
                                              Permissões
                                            </h4>
                                            {companyUser.permissions.length === 0 ? (
                                              <p className="text-sm text-muted-foreground">
                                                Nenhuma permissão específica
                                              </p>
                                            ) : (
                                              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                                                {Object.entries(groupedPermissions).map(
                                                  ([category, perms]) => {
                                                    const categoryPerms =
                                                      companyUser.permissions.filter(
                                                        (p) =>
                                                          perms.some(
                                                            (perm) =>
                                                              perm.id ===
                                                              p.permission.id,
                                                          ),
                                                      );
                                                    if (categoryPerms.length === 0)
                                                      return null;

                                                    return (
                                                      <div key={category} className="space-y-2">
                                                        <h5 className="text-xs font-medium text-muted-foreground">
                                                          {category}
                                                        </h5>
                                                        <div className="space-y-1">
                                                          {categoryPerms.map((p) => (
                                                            <div
                                                              key={p.id}
                                                              className="flex items-center gap-2 text-sm"
                                                            >
                                                              {p.granted ? (
                                                                <Check className="h-3 w-3 text-green-500" />
                                                              ) : (
                                                                <X className="h-3 w-3 text-red-500" />
                                                              )}
                                                              <span
                                                                className={cn(
                                                                  !p.granted &&
                                                                    'text-muted-foreground',
                                                                )}
                                                              >
                                                                {p.permission.name}
                                                              </span>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    );
                                                  },
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* Dialog de Edição de Usuário */}
          {showEditDialog && (
            <Dialog
              open={!!showEditDialog}
              onOpenChange={(open) => setShowEditDialog(open ? showEditDialog : null)}
            >
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Editar Usuário</DialogTitle>
                  <DialogDescription>
                    Gerencie permissões e informações do usuário
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {(() => {
                    const companyUser = Object.values(usersMap)
                      .flat()
                      .find((u) => u.id === showEditDialog);
                    if (!companyUser) return null;

                    const company = companies.find((c) =>
                      usersMap[c.id]?.some((u) => u.id === showEditDialog),
                    );
                    if (!company) return null;

                    return (
                      <>
                        <div className="space-y-2">
                          <Label>Nome</Label>
                          <Input value={companyUser.user.name} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>E-mail</Label>
                          <Input value={companyUser.user.email} disabled />
                        </div>
                        <div className="space-y-2">
                          <Label>Função</Label>
                          <Select
                            defaultValue={companyUser.role}
                            onValueChange={(value) => {
                              handleUpdateUser(company.id, companyUser.id, {
                                role: value,
                              });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Administrador</SelectItem>
                              <SelectItem value="MANAGER">Gerente</SelectItem>
                              <SelectItem value="OPERATOR">Operador</SelectItem>
                              <SelectItem value="VIEWER">Visualizador</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <div className="flex gap-2">
                            <Button
                              variant={
                                companyUser.isActive ? 'default' : 'outline'
                              }
                              size="sm"
                              onClick={() => {
                                handleUpdateUser(company.id, companyUser.id, {
                                  isActive: true,
                                });
                              }}
                            >
                              Ativo
                            </Button>
                            <Button
                              variant={
                                !companyUser.isActive ? 'default' : 'outline'
                              }
                              size="sm"
                              onClick={() => {
                                handleUpdateUser(company.id, companyUser.id, {
                                  isActive: false,
                                });
                              }}
                            >
                              Inativo
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Permissões</Label>
                          <div className="border rounded-md p-4 max-h-64 overflow-y-auto space-y-3">
                            {Object.entries(groupedPermissions).map(
                              ([category, perms]) => (
                                <div key={category} className="space-y-2">
                                  <h4 className="font-medium text-sm">{category}</h4>
                                  {perms.map((perm) => {
                                    const userPerm = companyUser.permissions.find(
                                      (p) => p.permission.id === perm.id,
                                    );
                                    const isGranted = userPerm?.granted || false;

                                    const isSelected = selectedPermissions.includes(
                                      perm.id,
                                    );

                                    return (
                                      <div
                                        key={perm.id}
                                        className="flex items-center space-x-2"
                                      >
                                        <Checkbox
                                          id={`edit-perm-${perm.id}`}
                                          checked={isSelected}
                                          onCheckedChange={(checked) => {
                                            const newPermissions = checked
                                              ? [...selectedPermissions, perm.id]
                                              : selectedPermissions.filter(
                                                  (id) => id !== perm.id,
                                                );
                                            setSelectedPermissions(newPermissions);
                                            handleUpdateUser(company.id, companyUser.id, {
                                              permissions: newPermissions,
                                            });
                                          }}
                                        />
                                        <Label
                                          htmlFor={`edit-perm-${perm.id}`}
                                          className="text-sm font-normal cursor-pointer"
                                        >
                                          {perm.name}
                                        </Label>
                                      </div>
                                    );
                                  })}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-4 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowEditDialog(null);
                              setSelectedPermissions([]);
                            }}
                          >
                            Fechar
                          </Button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </main>
    </div>
  );
}
