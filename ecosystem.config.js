module.exports = {
  apps: [
    {
      name: 'Movies', // Application name
      script: './server.js', // Path to your application entry point
      instances: 'max', // Cluster mode, maximum instances
      exec_mode: 'cluster', // Enable cluster mode
      error_file: './logs/err.log', // Error log file
      out_file: './logs/out.log', // Output log file
      log_date_format: 'YYYY-MM-DD HH:mm Z', // Log date format
      autorestart: true, // Enable auto-restart
      max_memory_restart: '200M', // Memory management, restart when using over 200MB
      watch: true, // Enable watch mode
      ignore_watch: ["node_modules", "logs"], // Watch exclusions
      shutdown_with_force: true, // Graceful shutdown
      env: {
        NODE_ENV: 'production', // Environment variables
      },
    },
  ],
};