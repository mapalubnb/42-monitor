module.exports = {
  apps: [
    {
      name: '42-monitor',
      script: 'dist/index.js',
      env_file: '.env',
      max_restarts: 20,
      restart_delay: 3000,
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      exp_backoff_restart_delay: 1000,
    },
  ],
};
