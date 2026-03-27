const path = require('path');
const ROOT = __dirname;

const common = {
  autorestart: true,
  restart_delay: 3000,
  exp_backoff_restart_delay: 200,
  max_restarts: 50,
  min_uptime: 10000,
  kill_timeout: 5000,
  time: true,
};

module.exports = {
  apps: [
    {
      ...common,
      name: 'rai-api',
      script: path.join(ROOT, 'apps/api/dist/apps/api/src/main.js'),
      cwd: path.join(ROOT, 'apps/api'),
      interpreter: 'node',
      env: {
        NODE_ENV: 'development',
        HSM_PROVIDER: 'memory',
        PORT: 4000,
      },
    },
    {
      ...common,
      name: 'rai-web',
      script: path.join(ROOT, 'apps/web/node_modules/next/dist/bin/next'),
      args: 'dev -p 3000 -H 127.0.0.1',
      cwd: path.join(ROOT, 'apps/web'),
      interpreter: 'node',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
    },
    {
      ...common,
      name: 'rai-gripil-web',
      script: path.join(ROOT, 'apps/gripil-web/.next/standalone/apps/gripil-web/server.js'),
      cwd: path.join(ROOT, 'apps/gripil-web/.next/standalone/apps/gripil-web'),
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
        HOSTNAME: '127.0.0.1',
      },
    },
    {
      ...common,
      name: 'rai-tg-bot',
      script: path.join(ROOT, 'apps/telegram-bot/dist/src/main.js'),
      cwd: path.join(ROOT, 'apps/telegram-bot'),
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
