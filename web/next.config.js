/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações do Next.js
  reactStrictMode: true,
  // Garantir que a porta seja diferente do backend
  // O Next.js já tenta usar 3000 primeiro, então não precisamos configurar
  
  // Transpilar módulos ES6 que não são transpilados por padrão
  transpilePackages: ['jsbarcode'],
  
  // Configuração para webpack
  webpack: (config, { isServer }) => {
    // Permitir que jsbarcode seja usado no cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
}

module.exports = nextConfig
