module.exports = {
  apps: [
    {
      name: "chat-app-server",
      script: "./index.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      max_memory_restart: "300M",
      restart_delay: 3000,
    },
  ],
};
