/**
 * Página de Configurações
 *
 * Permite ao usuário editar perfil e escolher o tema do sistema.
 */

'use client';

import React, { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTheme } from 'next-themes';
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
  Loader2,
  AlertCircle,
  User,
  Upload,
  Moon,
  Sun,
  Monitor,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

// Schema de validação para atualizar perfil
const updateProfileSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
});

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Form para atualizar perfil
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
    setValue: setProfileValue,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
  });

  // Redirecionar se não estiver autenticado
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Buscar dados do perfil
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  // Garantir que o componente está montado antes de mostrar o tema
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/auth/me');
      const profile = response.data?.data?.user;
      if (profile) {
        setUserProfile(profile);
        setProfileValue('name', profile.name || '');
        if (profile.avatarUrl) {
          setAvatarPreview(
            `${
              process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
              'http://localhost:3001'
            }${profile.avatarUrl}`,
          );
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar perfil:', err);
      setError('Erro ao carregar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (data: UpdateProfileFormData) => {
    try {
      setIsUpdatingProfile(true);
      setError(null);

      const payload: any = {
        name: data.name.trim(),
      };

      const response = await api.put('/auth/profile', payload);

      if (response.data.success) {
        const updatedUser = response.data.data?.user;
        if (updatedUser) {
          setUserProfile(updatedUser);
          setSuccess('Perfil atualizado com sucesso!');
          setTimeout(() => setSuccess(null), 3000);
        }
      }
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setError(
        err.response?.data?.message ||
          'Erro ao atualizar perfil. Tente novamente.',
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB.');
        return;
      }

      setAvatarFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      try {
        const formData = new FormData();
        formData.append('avatar', file);

        const response = await api.post('/auth/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          const avatarUrl = response.data.data.avatarUrl;
          setAvatarPreview(
            `${
              process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
              'http://localhost:3001'
            }${avatarUrl}`,
          );
          if (userProfile) {
            setUserProfile({ ...userProfile, avatarUrl });
          }
          setSuccess('Foto de perfil atualizada com sucesso!');
          setTimeout(() => setSuccess(null), 3000);
        }
      } catch (err: any) {
        console.error('Erro ao fazer upload do avatar:', err);
        setError(
          err.response?.data?.message ||
            'Erro ao fazer upload da foto. Tente novamente.',
        );
      }
    }
  };

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
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="px-4 sm:px-6 py-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Configurações</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Gerencie seu perfil e preferências
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
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

        <div className="space-y-6">
          {/* Seção de Perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Perfil
              </CardTitle>
              <CardDescription>
                Atualize suas informações pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmitProfile(handleUpdateProfile)}
                className="space-y-6"
              >
                {/* Avatar */}
                <div className="space-y-2">
                  <Label>Foto de Perfil</Label>
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="h-24 w-24 rounded-full object-cover border-2 border-border"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                          <User className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <Label
                        htmlFor="avatar"
                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-input rounded-md bg-background hover:bg-accent hover:text-accent-foreground"
                      >
                        <Upload className="h-4 w-4" />
                        Trocar Foto
                      </Label>
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <p className="text-sm text-muted-foreground mt-2">
                        Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="profile-name">
                    Nome <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="profile-name"
                    {...registerProfile('name')}
                    className={cn(profileErrors.name && 'border-destructive')}
                  />
                  {profileErrors.name && (
                    <p className="text-sm text-destructive">
                      {profileErrors.name.message}
                    </p>
                  )}
                </div>

                {/* Email (readonly) */}
                <div className="space-y-2">
                  <Label htmlFor="profile-email">E-mail</Label>
                  <Input
                    id="profile-email"
                    value={userProfile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    O e-mail não pode ser alterado
                  </p>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="min-w-[120px]"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Seção de Tema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {mounted && theme === 'dark' ? (
                  <Moon className="h-5 w-5" />
                ) : mounted && theme === 'light' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Monitor className="h-5 w-5" />
                )}
                Aparência
              </CardTitle>
              <CardDescription>
                Escolha o tema do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Tema</Label>
                  {mounted ? (
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger id="theme" className="w-full">
                        <SelectValue placeholder="Selecione um tema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <span className="flex items-center gap-2">
                            <Sun className="h-4 w-4" />
                            Claro
                          </span>
                        </SelectItem>
                        <SelectItem value="dark">
                          <span className="flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Escuro
                          </span>
                        </SelectItem>
                        <SelectItem value="system">
                          <span className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            Sistema
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="h-10 w-full rounded-md border border-input bg-muted animate-pulse" />
                  )}
                  <p className="text-xs text-muted-foreground">
                    O tema será aplicado em toda a aplicação
                  </p>
                </div>

                {/* Preview dos temas */}
                <div className="grid grid-cols-3 gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left',
                      theme === 'light'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Sun className="h-4 w-4" />
                      <span className="font-medium">Claro</span>
                    </div>
                    <div className="h-8 w-full bg-white border border-gray-200 rounded" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left',
                      theme === 'dark'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Moon className="h-4 w-4" />
                      <span className="font-medium">Escuro</span>
                    </div>
                    <div className="h-8 w-full bg-gray-900 border border-gray-700 rounded" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={cn(
                      'p-4 rounded-lg border-2 transition-all text-left',
                      theme === 'system'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50',
                    )}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Monitor className="h-4 w-4" />
                      <span className="font-medium">Sistema</span>
                    </div>
                    <div className="h-8 w-full bg-gradient-to-r from-white to-gray-900 border border-gray-300 rounded" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

