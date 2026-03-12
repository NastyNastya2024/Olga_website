/**
 * PM2 конфигурация для olga-backend
 * Запуск: pm2 start ecosystem.config.js
 */
module.exports = {
  apps: [{
    name: 'olga-backend',
    script: 'index.js',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
    },
    node_args: '--max-old-space-size=1024',
    // Стабилизация: не перезапускать бесконечно при падении
    max_restarts: 20,
    min_uptime: 5000,      // мин. 5 сек работы = успешный старт
    restart_delay: 3000,   // 3 сек пауза перед перезапуском
    exp_backoff_restart_delay: 100,
  }],
};
