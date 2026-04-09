module.exports = {
  apps:[
    {
      name: 'BingeBox-Omega',
      script: './api/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      autorestart: true,
      max_memory_restart: '500M',
      watch: false,
      shutdown_with_force: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        ENABLE_CLUSTERING: 'true'
      },
    },
  ],
};
