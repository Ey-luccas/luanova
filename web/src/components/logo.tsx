/**
 * Componente Logo
 * 
 * Exibe o logotipo Luanova com suporte a diferentes variações de cor
 * baseado no tema e contexto de uso.
 */

'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export type LogoVariant = 'auto' | 'light' | 'dark' | 'white' | 'black' | 'azul-escuro' | 'azul-semi';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  variant?: LogoVariant;
  /**
   * Força o uso de um logo específico independente do tema
   * Útil para casos onde o logo está sobre um fundo específico
   */
  forceVariant?: boolean;
  /**
   * Controla se o texto do logo deve ser exibido
   * Quando false, apenas o ícone/emblem é exibido
   */
  showText?: boolean;
}

export function Logo({ 
  className = '', 
  width, 
  height,
  variant = 'auto',
  forceVariant = false,
  showText = true
}: LogoProps) {
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determina qual logo usar
  const getLogoSrc = (): string => {
    // Se variant foi especificado explicitamente, usa ele
    if (variant !== 'auto' && forceVariant) {
      switch (variant) {
        case 'white':
          return '/logo-white.svg';
        case 'black':
          return '/logo-black.svg';
        case 'azul-escuro':
          return '/logo-azul-escuro.svg';
        case 'azul-semi':
          return '/logo-azul-semi.svg';
        case 'light':
          return '/logo-azul-escuro.svg'; // Logo azul escuro para temas claros
        case 'dark':
          return '/logo-white.svg'; // Logo branco para temas escuros
        default:
          return '/logo-azul-escuro.svg';
      }
    }

    // Auto-detecta baseado no tema
    if (variant === 'auto') {
      const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');
      return isDark ? '/logo-white.svg' : '/logo-azul-escuro.svg';
    }

    // Se variant foi especificado mas não forceVariant, ainda respeita o tema quando possível
    switch (variant) {
      case 'white':
        return '/logo-white.svg';
      case 'black':
        return '/logo-black.svg';
      case 'azul-escuro':
        return '/logo-azul-escuro.svg';
      case 'azul-semi':
        return '/logo-azul-semi.svg';
      case 'light':
        return '/logo-azul-escuro.svg';
      case 'dark':
        return '/logo-white.svg';
      default:
        return '/logo-azul-escuro.svg';
    }
  };

  // Dimensões padrão baseadas no aspect ratio do SVG
  const defaultWidth = width || 120;
  const defaultHeight = height || Math.round(defaultWidth / 3);

  const logoSrc = getLogoSrc();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoSrc}
        alt="Lua Nova"
        width={defaultWidth}
        height={defaultHeight}
        className="object-contain"
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}
