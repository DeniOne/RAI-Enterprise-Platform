module.exports = {
  apps: [
    {
      name: 'rai-api',
      script: 'npm',
      args: 'run start:prod',
      cwd: './apps/api',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      }
    },
    {
      name: 'rai-web',
      script: 'npm',
      args: 'run start',
      cwd: './apps/web',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'rai-tg-bot',
      script: 'npm',
      args: 'run start:prod',
      cwd: './apps/telegram-bot',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
