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
      script: 'dist/apps/api/src/main.js',
      cwd: './apps/api',
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
      script: 'node_modules/next/dist/bin/next',
      args: 'dev -p 3000 -H 127.0.0.1',
      cwd: './apps/web',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
    },
    {
      ...common,
      name: 'rai-tg-bot',
      script: 'dist/src/main.js',
      cwd: './apps/telegram-bot',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
