/**
 * Configuração PM2 para produção
 * 
 * PM2 é um gerenciador de processos para aplicações Node.js que garante:
 * - Reinicialização automática em caso de crash
 * - Gerenciamento de logs
 * - Monitoramento de recursos
 * - Inicialização no boot do sistema
 * 
 * COMANDOS ÚTEIS:
 * 
 * Iniciar aplicação:
 *   pm2 start ecosystem.config.js
 * 
 * Parar aplicação:
 *   pm2 stop estoquelua-backend
 * 
 * Reiniciar aplicação:
 *   pm2 restart estoquelua-backend
 * 
 * Ver logs em tempo real:
 *   pm2 logs estoquelua-backend
 * 
 * Ver status:
 *   pm2 status
 * 
 * Monitorar recursos:
 *   pm2 monit
 * 
 * Salvar configuração atual:
 *   pm2 save
 * 
 * Configurar para iniciar no boot do sistema:
 *   pm2 startup
 *   (siga as instruções exibidas)
 * 
 * Deletar aplicação do PM2:
 *   pm2 delete estoquelua-backend
 */

module.exports = {
  apps: [
    {
      // Nome da aplicação no PM2
      name: "estoquelua-backend",
      
      // Script principal (deve estar compilado)
      script: "./dist/server.js",
      
      // Número de instâncias (1 para aplicação simples, "max" para cluster)
      instances: 1,
      
      // Modo de execução: "fork" (1 instância) ou "cluster" (múltiplas)
      exec_mode: "fork",
      
      // Variáveis de ambiente para produção
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      
      // Variáveis de ambiente para desenvolvimento (opcional)
      env_development: {
        NODE_ENV: "development",
        PORT: 3001,
      },
      
      // Arquivo de log de erros
      error_file: "./logs/pm2-error.log",
      
      // Arquivo de log de saída
      out_file: "./logs/pm2-out.log",
      
      // Formato de data nos logs
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      
      // Mesclar logs de todas as instâncias
      merge_logs: true,
      
      // Reiniciar automaticamente em caso de crash
      autorestart: true,
      
      // Número máximo de reinicializações em 1 minuto
      max_restarts: 10,
      
      // Tempo mínimo de execução para considerar como "estável"
      min_uptime: "10s",
      
      // Reiniciar se uso de memória exceder este valor
      max_memory_restart: "500M",
      
      // Não assistir mudanças em arquivos (desabilitado em produção)
      watch: false,
      
      // Arquivos/pastas a ignorar se watch estiver ativo
      ignore_watch: ["node_modules", "logs", "uploads", "dist", ".git"],
      
      // Aguardar tempo antes de considerar reinicialização como falha
      kill_timeout: 5000,
      
      // Aguardar tempo antes de enviar SIGKILL
      wait_ready: false,
      
      // Variáveis de ambiente adicionais (carregadas do .env)
      // Nota: PM2 não carrega .env automaticamente, use dotenv no código
      env_file: ".env",
      
      // Timeout para shutdown graceful
      shutdown_with_message: true,
      
      // Logs adicionais
      log_type: "json",
      
      // Comando a executar antes de iniciar (opcional)
      // pre_start: "npm run build",
      
      // Comando a executar após iniciar (opcional)
      // post_start: "echo 'Aplicação iniciada'",
    },
  ],
};

