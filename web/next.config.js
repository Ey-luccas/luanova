/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de produção
  reactStrictMode: true,
  
  // Otimizações de produção
  swcMinify: true,
  compress: true,
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ];
  },
  
  // Transpilar módulos ES6 que não são transpilados por padrão
  transpilePackages: ['jsbarcode'],
  
  // Configuração para webpack
  webpack: (config, { isServer, dev }) => {
    // Permitir que jsbarcode seja usado no cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Otimizações de produção
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }
    
    return config;
  },
  
  // Configurações de imagens
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: [],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Desabilitar source maps em produção (segurança e performance)
  productionBrowserSourceMaps: false,
  
  // Configurações de output
  output: 'standalone',
}

module.exports = nextConfig
