/**
 * Página de Autenticação (Login/Cadastro)
 *
 * Página combinada com toggle entre login e cadastro,
 * design profissional e responsivo.
 */

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/logo';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  CheckCircle2,
  Shield,
  Zap,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Schemas de validação
const loginSchema = z.object({
  email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
  password: z
    .string()
    .min(1, 'Senha é obrigatória')
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Nome é obrigatório')
      .min(3, 'Nome deve ter no mínimo 3 caracteres'),
    email: z.string().min(1, 'E-mail é obrigatório').email('E-mail inválido'),
    password: z
      .string()
      .min(1, 'Senha é obrigatória')
      .min(8, 'Senha deve ter no mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

// Cores da marca
const colors = {
  azulClaro: '#CCD3D9',
  azulEscuro: '#28404C',
  azulSemi: '#2C4B5D',
  white: '#ffffff',
};

// Função para calcular força da senha
function calculatePasswordStrength(password: string): {
  strength: number;
  text: string;
  color: string;
} {
  if (!password) {
    return { strength: 0, text: 'Mínimo 8 caracteres', color: '#6b7280' };
  }

  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.match(/[a-z]+/)) strength += 25;
  if (password.match(/[A-Z]+/)) strength += 25;
  if (password.match(/[0-9]+/)) strength += 25;

  if (strength === 0) {
    return { strength: 0, text: 'Mínimo 8 caracteres', color: '#6b7280' };
  } else if (strength <= 25) {
    return { strength, text: 'Senha fraca', color: '#ef4444' };
  } else if (strength <= 50) {
    return { strength, text: 'Senha razoável', color: '#f59e0b' };
  } else if (strength <= 75) {
    return { strength, text: 'Senha boa', color: '#3b82f6' };
  } else {
    return { strength, text: 'Senha forte', color: '#10b981' };
  }
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register: registerUser, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Lê o modo inicial da query string
  const initialMode = searchParams?.get('mode') === 'register' ? false : true;
  const [isLogin, setIsLogin] = useState(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Redireciona se já estiver autenticado (evita flash)
  // Só redireciona se não estiver processando login e não houver erro
  useEffect(() => {
    if (!authLoading && isAuthenticated && !isLoading && !error) {
      router.replace('/workspace');
    }
  }, [isAuthenticated, authLoading, isLoading, error, router]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    strength: 0,
    text: 'Mínimo 8 caracteres',
    color: '#6b7280',
  });
  const [rememberMe, setRememberMe] = useState(false);

  // Formulário de Login
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Formulário de Cadastro
  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Monitora força da senha no cadastro
  const watchPassword = registerForm.watch('password', '');

  useEffect(() => {
    if (!isLogin && watchPassword) {
      setPasswordStrength(calculatePasswordStrength(watchPassword));
    }
  }, [watchPassword, isLogin]);

  // Função para alternar entre login e cadastro
  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError(null);
    loginForm.reset();
    registerForm.reset();
    setPasswordStrength({ strength: 0, text: 'Mínimo 8 caracteres', color: '#6b7280' });
  };

  // Submit do Login
  const onLoginSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      await login(data.email, data.password);
      // Usa replace ao invés de push para evitar flash e não adicionar ao histórico
      // Aguarda um pouco para garantir que o estado foi atualizado
      setTimeout(() => {
        router.replace('/workspace');
      }, 100);
    } catch (err: any) {
      console.error('Erro ao fazer login:', err);
      // Define o erro ANTES de desativar o loading para evitar flash
      if (err.isRateLimitError) {
        const retryAfter = err.retryAfter || 900;
        const minutes = Math.ceil(retryAfter / 60);
        setError(
          `${err.message} Aguarde ${minutes} minuto${minutes > 1 ? 's' : ''} antes de tentar novamente.`
        );
      } else {
        setError(
          err.message || err.response?.data?.message || 'E-mail ou senha incorretos. Tente novamente.'
        );
      }
      // Desativa loading após definir o erro
      setIsLoading(false);
    }
  };

  // Submit do Cadastro
  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData.email, registerData.name, registerData.password);
      // Usa replace ao invés de push para evitar flash
      // Aguarda um pouco para garantir que o estado foi atualizado
      setTimeout(() => {
        router.replace('/workspace');
      }, 100);
    } catch (err: any) {
      console.error('Erro ao registrar:', err);
      // Define o erro ANTES de desativar o loading para evitar flash
      setError(
        err.message || err.response?.data?.message || 'Erro ao criar conta. Tente novamente.'
      );
      // Desativa loading após definir o erro
      setIsLoading(false);
    }
  };

  // Não renderiza apenas se estiver carregando autenticação inicial (evita flash)
  // Mas permite renderizar se houver erro de login (evita flash de erro)
  if (authLoading && !error && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se estiver autenticado e não tiver erro, redireciona (evita mostrar página de auth)
  if (isAuthenticated && !error && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{
        background: `linear-gradient(135deg, ${colors.azulEscuro} 0%, ${colors.azulSemi} 100%)`,
      }}
    >
      <div
        className={cn(
          'w-full max-w-7xl bg-white rounded-3xl overflow-hidden shadow-2xl',
          'grid grid-cols-1 lg:grid-cols-2 min-h-[700px] animate-in fade-in duration-700'
        )}
      >
        {/* Coluna Esquerda - Informações */}
        <div
          className={cn(
            'hidden lg:flex flex-col justify-center p-12 lg:p-16 relative overflow-hidden',
            'bg-gradient-to-br from-[#28404C] to-[#2C4B5D]'
          )}
        >
          {/* Formas decorativas */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div
              className="absolute rounded-full bg-[rgba(204,211,217,0.08)]"
              style={{
                width: '300px',
                height: '300px',
                top: '-100px',
                right: '-100px',
                animation: 'float 20s infinite ease-in-out',
                animationDelay: '0s',
              }}
            />
            <div
              className="absolute rounded-full bg-[rgba(204,211,217,0.08)]"
              style={{
                width: '200px',
                height: '200px',
                bottom: '-50px',
                left: '-50px',
                animation: 'float 20s infinite ease-in-out',
                animationDelay: '-5s',
              }}
            />
            <div
              className="absolute rounded-full bg-[rgba(204,211,217,0.08)]"
              style={{
                width: '150px',
                height: '150px',
                top: '50%',
                right: '10%',
                animation: 'float 20s infinite ease-in-out',
                animationDelay: '-10s',
              }}
            />
          </div>

          <div className="relative z-10 space-y-8">
            {/* Logo */}
            <div className="animate-[slide-in-from-top_0.7s_ease-out_0.2s_both]">
              <Logo width={180} height={60} variant="white" forceVariant={true} />
            </div>

            {/* Título e Descrição */}
            <div className="space-y-4 animate-[slide-in-from-bottom_0.7s_ease-out_0.3s_both]">
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                {isLogin ? 'Bem-vindo de Volta!' : 'Crie sua Conta'}
              </h1>
              <p className="text-lg text-[#CCD3D9] leading-relaxed">
                {isLogin
                  ? 'Acesse sua conta e continue sua jornada conosco. Estamos felizes em tê-lo aqui.'
                  : 'Junte-se a nós e comece a gerenciar sua empresa de forma profissional e eficiente.'}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-5 animate-[slide-in-from-left_0.7s_ease-out_0.5s_both]">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <p className="text-[#CCD3D9] text-base">Acesso seguro e protegido</p>
              </div>
              <div className="flex items-center gap-5 animate-[slide-in-from-left_0.7s_ease-out_0.6s_both]">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <p className="text-[#CCD3D9] text-base">Seus dados protegidos</p>
              </div>
              <div className="flex items-center gap-5 animate-[slide-in-from-left_0.7s_ease-out_0.7s_both]">
                <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <p className="text-[#CCD3D9] text-base">Experiência otimizada</p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita - Formulários */}
        <div className="flex items-center justify-center p-8 sm:p-12 lg:p-16 bg-white">
          <div className="w-full max-w-md">
            {/* Logo Mobile - Visível apenas em mobile */}
            <div className="flex justify-center mb-8 lg:hidden">
              <Logo width={150} height={50} variant="azul-escuro" forceVariant={true} />
            </div>
            
            {/* Toggle Buttons */}
            <div className="relative flex bg-[#f5f7fa] rounded-xl p-1.5 mb-10">
              <div
                className={cn(
                  'absolute top-1.5 left-1.5 h-[calc(100%-12px)] w-[calc(50%-6px)] rounded-lg transition-transform duration-300 ease-out',
                  'bg-gradient-to-r from-[#28404C] to-[#2C4B5D]',
                  !isLogin && 'translate-x-full'
                )}
              />
              <button
                type="button"
                onClick={() => {
                  if (!isLogin) toggleForm();
                }}
                className={cn(
                  'relative z-10 flex-1 py-3 px-6 rounded-lg font-semibold text-base transition-colors duration-300',
                  isLogin ? 'text-white' : 'text-[#6b7280]'
                )}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  if (isLogin) toggleForm();
                }}
                className={cn(
                  'relative z-10 flex-1 py-3 px-6 rounded-lg font-semibold text-base transition-colors duration-300',
                  !isLogin ? 'text-white' : 'text-[#6b7280]'
                )}
              >
                Cadastro
              </button>
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Formulário de Login */}
            {isLogin && (
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-6 animate-in fade-in duration-500"
              >
                <div className="space-y-2">
                  <label htmlFor="loginEmail" className="block text-sm font-semibold text-[#28404C]">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af] pointer-events-none" />
                    <input
                      id="loginEmail"
                      type="email"
                      placeholder="seu@email.com"
                      className={cn(
                        'w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-[#28404C] bg-white',
                        'placeholder:text-[#9ca3af] focus:outline-none focus:border-[#28404C] focus:ring-4 focus:ring-[#28404C]/10',
                        'transition-all duration-300',
                        loginForm.formState.errors.email && 'border-red-500'
                      )}
                      {...loginForm.register('email')}
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-600">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="loginPassword"
                    className="block text-sm font-semibold text-[#28404C]"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af] pointer-events-none" />
                    <input
                      id="loginPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={cn(
                        'w-full pl-12 pr-12 py-3.5 border-2 rounded-xl text-[#28404C] bg-white',
                        'placeholder:text-[#9ca3af] focus:outline-none focus:border-[#28404C] focus:ring-4 focus:ring-[#28404C]/10',
                        'transition-all duration-300',
                        loginForm.formState.errors.password && 'border-red-500'
                      )}
                      {...loginForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#28404C] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-600">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3">
                  <label className="flex items-center gap-2.5 cursor-pointer text-sm text-[#6b7280]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-5 h-5 rounded border-2 border-[#e5e7eb] checked:bg-[#28404C] checked:border-[#28404C] focus:ring-2 focus:ring-[#28404C]/20"
                    />
                    <span>Lembrar-me</span>
                  </label>
                  <a
                    href="#"
                    className="text-sm font-semibold text-[#2C4B5D] hover:text-[#28404C] transition-colors"
                  >
                    Esqueceu a senha?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'w-full py-4 px-6 rounded-xl font-semibold text-base text-white',
                    'bg-gradient-to-r from-[#28404C] to-[#2C4B5D] hover:shadow-lg',
                    'transition-all duration-300 flex items-center justify-center gap-2',
                    'disabled:opacity-70 disabled:cursor-not-allowed',
                    'hover:-translate-y-0.5 active:translate-y-0'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Entrando...</span>
                    </>
                  ) : (
                    <>
                      <span>Entrar</span>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Formulário de Cadastro */}
            {!isLogin && (
              <form
                onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                className="space-y-6 animate-in fade-in duration-500"
              >
                <div className="space-y-2">
                  <label htmlFor="registerName" className="block text-sm font-semibold text-[#28404C]">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af] pointer-events-none" />
                    <input
                      id="registerName"
                      type="text"
                      placeholder="Seu nome completo"
                      className={cn(
                        'w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-[#28404C] bg-white',
                        'placeholder:text-[#9ca3af] focus:outline-none focus:border-[#28404C] focus:ring-4 focus:ring-[#28404C]/10',
                        'transition-all duration-300',
                        registerForm.formState.errors.name && 'border-red-500'
                      )}
                      {...registerForm.register('name')}
                    />
                  </div>
                  {registerForm.formState.errors.name && (
                    <p className="text-sm text-red-600">
                      {registerForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="registerEmail"
                    className="block text-sm font-semibold text-[#28404C]"
                  >
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af] pointer-events-none" />
                    <input
                      id="registerEmail"
                      type="email"
                      placeholder="seu@email.com"
                      className={cn(
                        'w-full pl-12 pr-4 py-3.5 border-2 rounded-xl text-[#28404C] bg-white',
                        'placeholder:text-[#9ca3af] focus:outline-none focus:border-[#28404C] focus:ring-4 focus:ring-[#28404C]/10',
                        'transition-all duration-300',
                        registerForm.formState.errors.email && 'border-red-500'
                      )}
                      {...registerForm.register('email')}
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-sm text-red-600">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="registerPassword"
                    className="block text-sm font-semibold text-[#28404C]"
                  >
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af] pointer-events-none" />
                    <input
                      id="registerPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={cn(
                        'w-full pl-12 pr-12 py-3.5 border-2 rounded-xl text-[#28404C] bg-white',
                        'placeholder:text-[#9ca3af] focus:outline-none focus:border-[#28404C] focus:ring-4 focus:ring-[#28404C]/10',
                        'transition-all duration-300',
                        registerForm.formState.errors.password && 'border-red-500'
                      )}
                      {...registerForm.register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#28404C] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {registerForm.formState.errors.password && (
                    <p className="text-sm text-red-600">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                  {/* Indicador de força da senha */}
                  {watchPassword && (
                    <div className="space-y-1.5">
                      <div className="h-1 bg-[#e5e7eb] rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-300 rounded-full"
                          style={{
                            width: `${passwordStrength.strength}%`,
                            backgroundColor: passwordStrength.color,
                          }}
                        />
                      </div>
                      <p className="text-xs" style={{ color: passwordStrength.color }}>
                        {passwordStrength.text}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="registerConfirmPassword"
                    className="block text-sm font-semibold text-[#28404C]"
                  >
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af] pointer-events-none" />
                    <input
                      id="registerConfirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={cn(
                        'w-full pl-12 pr-12 py-3.5 border-2 rounded-xl text-[#28404C] bg-white',
                        'placeholder:text-[#9ca3af] focus:outline-none focus:border-[#28404C] focus:ring-4 focus:ring-[#28404C]/10',
                        'transition-all duration-300',
                        registerForm.formState.errors.confirmPassword && 'border-red-500',
                        registerForm.watch('confirmPassword') &&
                          registerForm.watch('password') &&
                          registerForm.watch('confirmPassword') === registerForm.watch('password') &&
                          !registerForm.formState.errors.confirmPassword &&
                          'border-green-500'
                      )}
                      {...registerForm.register('confirmPassword')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#28404C] transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-600">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer text-sm text-[#6b7280]">
                  <input
                    type="checkbox"
                    required
                    className="w-5 h-5 rounded border-2 border-[#e5e7eb] checked:bg-[#28404C] checked:border-[#28404C] focus:ring-2 focus:ring-[#28404C]/20 mt-0.5"
                  />
                  <span>
                    Aceito os{' '}
                    <a href="#" className="font-semibold text-[#2C4B5D] hover:text-[#28404C]">
                      Termos de Uso
                    </a>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    'w-full py-4 px-6 rounded-xl font-semibold text-base text-white',
                    'bg-gradient-to-r from-[#28404C] to-[#2C4B5D] hover:shadow-lg',
                    'transition-all duration-300 flex items-center justify-center gap-2',
                    'disabled:opacity-70 disabled:cursor-not-allowed',
                    'hover:-translate-y-0.5 active:translate-y-0'
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Criando conta...</span>
                    </>
                  ) : (
                    <>
                      <span>Criar Conta</span>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}

