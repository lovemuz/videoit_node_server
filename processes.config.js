module.exports = {
  apps: [
    {
      name: "nmoment-api",
      script: "./dist/app.js",
      instances: 0,
      exec_mode: "cluster",
      instance_var: "INSTANCE_ID",
      autorestart: true,
      max_memory_restart: "2G",
    },
  ],
};
