const express = require('express');
const path = require('path');

const app = express();
const PORT = 10003;

// 提供静态文件服务
app.use(express.static(__dirname));

// 添加日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log(`__dirname: ${__dirname}`);
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Static files from: ${__dirname}`);
});
