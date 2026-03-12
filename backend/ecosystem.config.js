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
    node_args: '--max-old-space-size=1024', // 1 GB heap (загрузка идёт через диск, не память)
  }],
};
